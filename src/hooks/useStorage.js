import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyVerificationSettlement, settlePlayAgainstOfficialData, verificationLookupForPlay } from '../verification/verificationEngine.js';
import { GAMES } from '../utils/gameConfig.js';
import { isCheckable, toLocalDateKey } from '../utils/drawSchedule.js';
import { FINANCE_SCHEMA_VERSION, playBetCount, playCost, playCostCents, playKnownPrize, playUnknownPrizeCount, sanitizePlay, sanitizePlays, toMoneyCents } from '../utils/playModel.js';
import { supabase } from '../lib/supabase.js';

const STORAGE_KEY = 'primy_plays_v11';
const LEGACY_KEYS = ['primy_plays_v10', 'primy_plays_v9', 'primy_plays_v8', 'primy_plays_v7', 'primy_history_v4', 'primy_history_v3', 'lotto_history_v2'];

function userStorageKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

function parseStored(value) {
  if (!value) return { plays: [], pending: [] };
  try {
    const parsed = JSON.parse(value);
    return {
      plays: sanitizePlays(parsed),
      pending: Array.isArray(parsed?.pending) ? parsed.pending : [],
    };
  } catch {
    return { plays: [], pending: [] };
  }
}

function loadUserCache(userId) {
  if (!userId) return { plays: [], pending: [] };
  return parseStored(localStorage.getItem(userStorageKey(userId)));
}

function loadLegacyPlays() {
  try {
    const keys = [STORAGE_KEY, ...LEGACY_KEYS];
    for (const key of keys) {
      const parsed = parseStored(localStorage.getItem(key));
      if (parsed.plays.length) return parsed.plays;
    }
  } catch {
    // Un almacenamiento dañado no debe impedir el inicio de la aplicación.
  }
  return [];
}

function writeUserCache(userId, plays, pending) {
  if (!userId) return;
  localStorage.setItem(userStorageKey(userId), JSON.stringify({ version: '18.0.2', plays, pending }));
}

function mergePlays(...collections) {
  const byId = new Map();
  for (const collection of collections) {
    for (const play of sanitizePlays(collection)) {
      if (!byId.has(play.id)) byId.set(play.id, play);
    }
  }
  return [...byId.values()].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function asStoredPlay(play, purchased) {
  const purchasedAt = purchased ? (play.purchasedAt || new Date().toISOString()) : undefined;
  return sanitizePlay({
    ...play,
    purchased,
    purchasedAt,
    ...(purchased ? { costCents: playCostCents(play), purchaseDateISO: purchasedAt } : {}),
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    columns: (play.columns || []).map(column => ({
      ...column,
      status: column.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    })),
  });
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`El servidor ha devuelto una respuesta no válida (HTTP ${response.status}).`);
  }
}

export function useGameHistory(user) {
  const [history, setHistory] = useState([]);
  const [storageError, setStorageError] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [pendingLocalPlays, setPendingLocalPlays] = useState([]);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const historyRef = useRef([]);
  const pendingRef = useRef([]);
  const userRef = useRef(user);
  const verificationControllersRef = useRef(new Map());

  useEffect(() => { userRef.current = user; }, [user]);

  const cacheCurrent = useCallback((plays = historyRef.current, pending = pendingRef.current) => {
    if (!userRef.current?.id) return;
    try {
      writeUserCache(userRef.current.id, plays, pending);
      setStorageError('');
    } catch {
      setStorageError('No se pueden guardar los datos temporales en este dispositivo.');
    }
  }, []);

  const enqueue = useCallback(operation => {
    pendingRef.current = [...pendingRef.current, operation].slice(-250);
    cacheCurrent(historyRef.current, pendingRef.current);
    setSyncStatus('offline');
  }, [cacheCurrent]);

  const remoteUpsert = useCallback(async plays => {
    const currentUser = userRef.current;
    if (!supabase || !currentUser?.id || !plays.length) return;
    const rows = plays.map(play => ({
      user_id: currentUser.id,
      id: String(play.id),
      data: play,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('primy_plays').upsert(rows, { onConflict: 'user_id,id' });
    if (error) throw error;
  }, []);

  const remoteDelete = useCallback(async id => {
    const currentUser = userRef.current;
    if (!supabase || !currentUser?.id) return;
    const { error } = await supabase.from('primy_plays').delete().eq('user_id', currentUser.id).eq('id', String(id));
    if (error) throw error;
  }, []);

  const remoteClear = useCallback(async () => {
    const currentUser = userRef.current;
    if (!supabase || !currentUser?.id) return;
    const { error } = await supabase.from('primy_plays').delete().eq('user_id', currentUser.id);
    if (error) throw error;
  }, []);

  const persistOperation = useCallback(async operation => {
    if (!navigator.onLine) {
      enqueue(operation);
      return;
    }
    try {
      setSyncStatus('syncing');
      if (operation.type === 'upsert') await remoteUpsert(operation.plays || []);
      else if (operation.type === 'delete') await remoteDelete(operation.id);
      else if (operation.type === 'clear') await remoteClear();
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      setStorageError('');
    } catch {
      enqueue(operation);
      setStorageError('Los cambios se han guardado en este dispositivo y se sincronizarán cuando vuelva la conexión.');
    }
  }, [enqueue, remoteClear, remoteDelete, remoteUpsert]);

  const flushPending = useCallback(async () => {
    if (!navigator.onLine || !pendingRef.current.length) return false;
    const queue = [...pendingRef.current];
    setSyncStatus('syncing');
    try {
      for (const operation of queue) {
        if (operation.type === 'upsert') await remoteUpsert(operation.plays || []);
        else if (operation.type === 'delete') await remoteDelete(operation.id);
        else if (operation.type === 'clear') await remoteClear();
      }
      pendingRef.current = [];
      cacheCurrent(historyRef.current, []);
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      setStorageError('');
      return true;
    } catch {
      setSyncStatus('offline');
      return false;
    }
  }, [cacheCurrent, remoteClear, remoteDelete, remoteUpsert]);

  useEffect(() => {
    let cancelled = false;
    const currentUser = user;
    if (!currentUser?.id || !supabase) {
      historyRef.current = [];
      pendingRef.current = [];
      setHistory([]);
      setSyncStatus('idle');
      return undefined;
    }

    const cache = loadUserCache(currentUser.id);
    historyRef.current = cache.plays;
    pendingRef.current = cache.pending;
    setHistory(cache.plays);
    setSyncStatus('loading');

    const loadRemote = async () => {
      try {
        if (cache.pending.length) await flushPending();
        const { data, error } = await supabase
          .from('primy_plays')
          .select('id,data,updated_at')
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        const normalizedRows = (data || []).map(row => ({ raw: row.data, play: sanitizePlay(row.data) })).filter(item => item.play);
        const remote = normalizedRows.map(item => item.play);
        const financeMigrations = normalizedRows.filter(item => item.raw?.financeSchemaVersion !== FINANCE_SCHEMA_VERSION).map(item => item.play);
        if (financeMigrations.length) {
          try {
            await remoteUpsert(financeMigrations);
          } catch {
            // La migración financiera es best-effort: nunca debe bloquear la carga del archivo.
          }
        }
        historyRef.current = remote;
        setHistory(remote);
        pendingRef.current = [];
        cacheCurrent(remote, []);
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
        setStorageError('');

        const { data: migration, error: migrationError } = await supabase
          .from('primy_data_migrations')
          .select('local_storage_imported')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (migrationError) throw migrationError;
        if (!cancelled && !migration?.local_storage_imported) {
          const legacy = loadLegacyPlays();
          setPendingLocalPlays(legacy);
          if (!legacy.length) {
            await supabase.from('primy_data_migrations').upsert({
              user_id: currentUser.id,
              local_storage_imported: true,
              imported_at: new Date().toISOString(),
            });
          }
        }
      } catch {
        if (cancelled) return;
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        setStorageError('No se puede conectar con tu cuenta. Primy está usando la copia guardada en este dispositivo.');
      }
    };

    loadRemote();
    const onOnline = () => flushPending();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      for (const controller of verificationControllersRef.current.values()) controller.abort();
      verificationControllersRef.current.clear();
    };
  }, [cacheCurrent, flushPending, user]);

  const applyUpdate = useCallback((producer, operationFactory) => {
    const current = historyRef.current;
    const next = sanitizePlays(producer(current));
    historyRef.current = next;
    setHistory(next);
    cacheCurrent(next, pendingRef.current);
    const operation = operationFactory?.(next, current);
    if (operation) persistOperation(operation);
    return next;
  }, [cacheCurrent, persistOperation]);

  const savePlay = useCallback((play, { purchased = false } = {}) => {
    const stored = asStoredPlay(play, purchased);
    if (!stored) {
      setStorageError('La jugada no es válida y no se puede guardar.');
      return null;
    }
    applyUpdate(current => [stored, ...current.filter(item => item.id !== stored.id)], () => ({ type: 'upsert', plays: [stored] }));
    return stored;
  }, [applyUpdate]);

  const markPurchased = useCallback((id, purchaseData = {}) => {
    let updated = null;
    applyUpdate(current => current.map(play => {
      if (play.id !== id) return play;
      updated = asStoredPlay({ ...play, ...purchaseData, metadata: { ...(play.metadata || {}), ...(purchaseData.receiptExtra != null ? { receiptExtraPending: false } : {}) } }, true);
      return updated;
    }), () => updated ? ({ type: 'upsert', plays: [updated] }) : null);
  }, [applyUpdate]);

  const toggleFavorite = useCallback(id => {
    let updated = null;
    applyUpdate(current => current.map(play => {
      if (play.id !== id) return play;
      updated = { ...play, favorite: !play.favorite };
      return updated;
    }), () => updated ? ({ type: 'upsert', plays: [updated] }) : null);
  }, [applyUpdate]);

  const removePlay = useCallback(id => applyUpdate(current => current.filter(play => play.id !== id), () => ({ type: 'delete', id })), [applyUpdate]);
  const restorePlay = useCallback(play => applyUpdate(current => [play, ...current.filter(item => item.id !== play.id)], () => ({ type: 'upsert', plays: [play] })), [applyUpdate]);
  const clearHistory = useCallback(() => applyUpdate(() => [], () => ({ type: 'clear' })), [applyUpdate]);

  const importHistory = useCallback(raw => {
    const imported = sanitizePlays(raw);
    if (!imported.length) throw new Error('El archivo no contiene jugadas válidas de Primy.');
    applyUpdate(current => mergePlays(imported, current), () => ({ type: 'upsert', plays: imported }));
    return imported.length;
  }, [applyUpdate]);

  const importLocalData = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id || !pendingLocalPlays.length) return;
    setMigrationBusy(true);
    try {
      const merged = mergePlays(pendingLocalPlays, historyRef.current);
      await remoteUpsert(pendingLocalPlays);
      const { error } = await supabase.from('primy_data_migrations').upsert({
        user_id: currentUser.id,
        local_storage_imported: true,
        imported_at: new Date().toISOString(),
      });
      if (error) throw error;
      historyRef.current = merged;
      setHistory(merged);
      cacheCurrent(merged, pendingRef.current);
      setPendingLocalPlays([]);
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch {
      setStorageError('No se han podido importar las jugadas antiguas. Inténtalo de nuevo cuando tengas conexión.');
    } finally {
      setMigrationBusy(false);
    }
  }, [cacheCurrent, pendingLocalPlays, remoteUpsert]);

  const dismissLocalData = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;
    setMigrationBusy(true);
    try {
      const { error } = await supabase.from('primy_data_migrations').upsert({
        user_id: currentUser.id,
        local_storage_imported: true,
        imported_at: new Date().toISOString(),
      });
      if (error) throw error;
      setPendingLocalPlays([]);
    } catch {
      setStorageError('No se ha podido guardar tu decisión. Inténtalo de nuevo.');
    } finally {
      setMigrationBusy(false);
    }
  }, []);

  const setOfficialPrize = useCallback((playId, columnId, value) => {
    let updated = null;
    const confirmedAt = new Date().toISOString();
    applyUpdate(current => current.map(play => {
      if (play.id !== playId) return play;
      updated = {
        ...play,
        columns: play.columns.map(column => column.id === columnId ? {
          ...column,
          officialPrize: Math.max(0, Number(value) || 0),
          prizeCents: toMoneyCents(value),
          prizeStatus: 'confirmed',
          prizeSource: 'manual',
          prizeConfirmedAt: confirmedAt,
          verifiedAt: confirmedAt,
          verificationId: `manual:${playId}:${columnId}:${confirmedAt}`,
        } : column),
      };
      return updated;
    }), () => updated ? ({ type: 'upsert', plays: [updated] }) : null);
  }, [applyUpdate]);

  const checkResults = useCallback(async (gameId, { playIds = [] } = {}) => {
    setVerificationError('');
    const selectedIds = new Set((playIds || []).map(String));
    const snapshot = historyRef.current;
    const candidates = snapshot.filter(play => (
      play.gameId === gameId
      && play.purchased
      && play.status !== 'checked'
      && isCheckable(play)
      && (!selectedIds.size || selectedIds.has(String(play.id)))
    ));
    const candidateIds = new Set(candidates.map(play => String(play.id)));
    const lookups = candidates.map(verificationLookupForPlay);
    const dates = [...new Set(lookups.map(item => item.date).filter(Boolean))];
    const roundIds = [...new Set(lookups.map(item => item.roundId).filter(Boolean))];
    if (!dates.length && !roundIds.length) return { checked: 0, unavailable: 0 };

    try {
      verificationControllersRef.current.get(gameId)?.abort();
      const controller = new AbortController();
      verificationControllersRef.current.set(gameId, controller);
      const params = new URLSearchParams({
        game: gameId,
        attempt: String(Date.now()),
      });
      if (dates.length) params.set('dates', dates.join(','));
      if (roundIds.length) params.set('roundIds', roundIds.join(','));
      const response = await fetch(`/api/check-results?${params}`, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = await readJson(response);
      if (!response.ok || !data.success) {
        const suffix = data.code ? ` [${data.code}]` : '';
        throw new Error(`${data.message || 'Error al recuperar los resultados.'}${suffix}`);
      }

      const byDate = new Map();
      const byRoundId = new Map();
      for (const event of data.results || []) {
        if (event?.date) byDate.set(event.date, event);
        if (event?.roundId) byRoundId.set(event.roundId, event);
      }
      let checked = 0;
      let pending = 0;
      const changed = [];
      applyUpdate(current => current.map(play => {
        if (
          play.gameId !== gameId
          || !play.purchased
          || play.status === 'checked'
          || !isCheckable(play)
          || !candidateIds.has(String(play.id))
        ) return play;
        const lookup = verificationLookupForPlay(play);
        const event = (lookup.roundId && byRoundId.get(lookup.roundId)) || (lookup.date && byDate.get(lookup.date));
        if (!event?.payload) {
          pending += 1;
          if (play.status === 'awaiting_check') return play;
          const awaiting = { ...play, status: 'awaiting_check' };
          changed.push(awaiting);
          return awaiting;
        }
        const settlement = settlePlayAgainstOfficialData(play, event.payload);
        if (!settlement.complete) {
          pending += 1;
          const identityMismatch = ['OFFICIAL_DATE_MISMATCH', 'OFFICIAL_ROUND_MISMATCH'].includes(settlement.reason);
          const awaiting = {
            ...play,
            status: 'awaiting_check',
            ...(identityMismatch ? {} : { result: event.payload }),
            metadata: {
              ...(play.metadata || {}),
              verificationPendingReason: settlement.reason || 'OFFICIAL_DATA_INCOMPLETE',
            },
          };
          changed.push(awaiting);
          return awaiting;
        }
        checked += 1;
        const updated = applyVerificationSettlement(play, event.payload, settlement);
        changed.push(updated);
        return updated;
      }), () => changed.length ? ({ type: 'upsert', plays: changed }) : null);
      return {
        checked,
        pending,
        unavailable: (data.unavailableDates?.length || 0) + (data.unavailableRoundIds?.length || 0),
        liveFetched: data.liveFetched || 0,
      };
    } catch (caught) {
      if (caught?.name === 'AbortError') return { checked: 0, unavailable: dates.length + roundIds.length, aborted: true };
      const message = caught?.message || 'Error de conexión. Inténtalo de nuevo.';
      setVerificationError(message);
      return { checked: 0, unavailable: dates.length + roundIds.length, error: message };
    } finally {
      verificationControllersRef.current.delete(gameId);
    }
  }, [applyUpdate]);

  const statsByGame = useMemo(() => {
    const output = {};
    for (const play of history) {
      if (!play.purchased) continue;
      const id = play.gameId;
      output[id] ??= { totalSpent: 0, totalWon: 0, unknownPrizes: 0, playCount: 0, columnCount: 0 };
      output[id].playCount += 1;
      output[id].columnCount += playBetCount(play);
      output[id].totalSpent += playCost(play);
      if (play.status === 'checked') {
        output[id].totalWon += playKnownPrize(play);
        output[id].unknownPrizes += playUnknownPrizeCount(play);
      }
    }
    for (const gameId of Object.keys(GAMES)) {
      output[gameId] ??= { totalSpent: 0, totalWon: 0, unknownPrizes: 0, playCount: 0, columnCount: 0 };
      output[gameId].balance = output[gameId].totalWon - output[gameId].totalSpent;
    }
    return output;
  }, [history]);

  const enriched = useMemo(() => history.map(play => ({
    ...play,
    computedStatus: play.status === 'checked' ? 'checked' : !play.purchased ? 'draft' : isCheckable(play) ? 'awaiting_check' : 'scheduled',
  })), [history]);

  return {
    history: enriched,
    statsByGame,
    storageError,
    verificationError,
    syncStatus,
    lastSyncedAt,
    pendingLocalCount: pendingLocalPlays.length,
    pendingSyncCount: pendingRef.current.length,
    retrySync: flushPending,
    migrationBusy,
    importLocalData,
    dismissLocalData,
    clearVerificationError: () => setVerificationError(''),
    savePlay,
    markPurchased,
    toggleFavorite,
    removePlay,
    restorePlay,
    clearHistory,
    importHistory,
    setOfficialPrize,
    checkResults,
  };
}
