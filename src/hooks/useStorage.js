import { useEffect, useMemo, useRef, useState } from 'react';
import { calculatePayout } from '../utils/payout.js';
import { GAMES } from '../utils/gameConfig.js';
import { isCheckable, toLocalDateKey } from '../utils/drawSchedule.js';
import { playCost, playKnownPrize, playUnknownPrizeCount, sanitizePlay, sanitizePlays } from '../utils/playModel.js';

const STORAGE_KEY = 'primy_plays_v11';
const LEGACY_KEYS = ['primy_plays_v10', 'primy_plays_v9', 'primy_plays_v8', 'primy_plays_v7', 'primy_history_v4', 'primy_history_v3', 'lotto_history_v2'];

function load() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return sanitizePlays(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return sanitizePlays(JSON.parse(value));
    }
  } catch {
    // Lo storage corrotto non deve impedire l'avvio dell'app.
  }
  return [];
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Il server ha restituito una risposta non valida (HTTP ${response.status}).`);
  }
}

function asStoredPlay(play, purchased) {
  const purchasedAt = purchased ? (play.purchasedAt || new Date().toISOString()) : undefined;
  const normalized = sanitizePlay({
    ...play,
    purchased,
    purchasedAt,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    columns: (play.columns || []).map(column => ({
      ...column,
      status: column.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    })),
  });
  return normalized;
}

export function useGameHistory() {
  const [history, setHistory] = useState([]);
  const [storageError, setStorageError] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const historyRef = useRef([]);
  const verificationControllerRef = useRef(null);

  useEffect(() => {
    const loaded = load();
    historyRef.current = loaded;
    setHistory(loaded);
    return () => verificationControllerRef.current?.abort();
  }, []);

  const update = producer => {
    setHistory(current => {
      const next = sanitizePlays(producer(current));
      historyRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 11, plays: next }));
        setStorageError('');
      } catch {
        setStorageError('Impossibile salvare le giocate sul dispositivo. Controlla lo spazio disponibile o le impostazioni del browser.');
      }
      return next;
    });
  };

  const savePlay = (play, { purchased = false } = {}) => {
    const stored = asStoredPlay(play, purchased);
    if (!stored) {
      setStorageError('La giocata non è valida e non può essere salvata.');
      return null;
    }
    update(current => [stored, ...current.filter(item => item.id !== stored.id)]);
    return stored;
  };

  const markPurchased = id => update(current => current.map(play => play.id === id ? asStoredPlay(play, true) : play));
  const toggleFavorite = id => update(current => current.map(play => play.id === id ? { ...play, favorite: !play.favorite } : play));
  const removePlay = id => update(current => current.filter(play => play.id !== id));
  const restorePlay = play => update(current => [play, ...current.filter(item => item.id !== play.id)]);
  const clearHistory = () => update(() => []);
  const importHistory = raw => {
    const imported = sanitizePlays(raw);
    if (!imported.length) throw new Error('Il file non contiene giocate Primy valide.');
    update(current => {
      const byId = new Map(current.map(play => [play.id, play]));
      for (const play of imported) byId.set(play.id, play);
      return [...byId.values()].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    });
    return imported.length;
  };

  const setOfficialPrize = (playId, columnId, value) => update(current => current.map(play => play.id !== playId ? play : {
    ...play,
    columns: play.columns.map(column => column.id === columnId ? {
      ...column,
      officialPrize: Math.max(0, Number(value) || 0),
      prizeSource: 'manual',
    } : column),
  }));

  const checkResults = async gameId => {
    setVerificationError('');
    const snapshot = historyRef.current;
    const candidates = snapshot.filter(play => play.gameId === gameId && play.purchased && play.status !== 'checked' && isCheckable(play));
    const dates = [...new Set(candidates.map(play => play.drawDateKey || toLocalDateKey(play.drawDateISO)).filter(Boolean))];
    if (!dates.length) return { checked: 0, unavailable: 0 };

    try {
      verificationControllerRef.current?.abort();
      const controller = new AbortController();
      verificationControllerRef.current = controller;
      const response = await fetch(`/api/check-results?game=${encodeURIComponent(gameId)}&dates=${encodeURIComponent(dates.join(','))}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const data = await readJson(response);
      if (!response.ok || !data.success) {
        const suffix = data.code ? ` [${data.code}]` : '';
        throw new Error(`${data.message || 'Errore durante il recupero dei risultati.'}${suffix}`);
      }

      const byDate = new Map((data.results || []).map(result => [result.date, result]));
      let checked = 0;
      update(current => current.map(play => {
        if (play.gameId !== gameId || !play.purchased || play.status === 'checked' || !isCheckable(play)) return play;
        const key = play.drawDateKey || toLocalDateKey(play.drawDateISO);
        const draw = byDate.get(key);
        if (!draw) return { ...play, status: 'awaiting_check' };
        checked += 1;

        const columns = play.columns.map(column => {
          const payout = calculatePayout({ gameId: play.gameId, ticket: column.numbers, extra: column.extra }, draw);
          return {
            ...column,
            status: 'checked',
            prizeCategory: payout.category,
            matches: payout.matches,
            payoutType: payout.payoutType,
            prizeDisplay: payout.displayText,
            officialPrize: payout.officialAmount,
            extraMatch: payout.extraMatch || false,
            complementaryMatch: payout.complementaryMatch || false,
          };
        });

        return {
          ...play,
          status: 'checked',
          checkedAt: new Date().toISOString(),
          result: draw,
          columns,
        };
      }));
      return { checked, unavailable: data.unavailableDates?.length || 0 };
    } catch (caught) {
      if (caught?.name === 'AbortError') return { checked: 0, unavailable: dates.length, aborted: true };
      const message = caught?.message || 'Errore di connessione. Riprova.';
      setVerificationError(message);
      return { checked: 0, unavailable: dates.length, error: message };
    }
  };

  const statsByGame = useMemo(() => {
    const output = {};
    for (const play of history) {
      if (!play.purchased) continue;
      const id = play.gameId;
      output[id] ??= { totalSpent: 0, totalWon: 0, unknownPrizes: 0, playCount: 0, columnCount: 0 };
      output[id].playCount += 1;
      output[id].columnCount += play.columns.length;
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
