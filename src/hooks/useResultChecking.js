import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAMES } from '../utils/gameConfig.js';
import { supabase } from '../lib/supabase.js';

const AUTO_REFRESH_MS = 120000;

export function useResultChecking({ dueByGame, checkResults, showToast }) {
  const [checkingGame, setCheckingGame] = useState('');
  const [checkingPlayId, setCheckingPlayId] = useState('');
  const runningRef = useRef(false);
  const dueKey = useMemo(() => Object.entries(dueByGame)
    .filter(([, count]) => count > 0)
    .map(([gameId, count]) => `${gameId}:${count}`)
    .sort()
    .join('|'), [dueByGame]);
  const dueGameIds = useMemo(() => dueKey
    ? dueKey.split('|').map(entry => entry.split(':')[0]).filter(gameId => GAMES[gameId])
    : [], [dueKey]);

  const resultMessage = useCallback((result, { singular = false } = {}) => {
    if (result.checked > 0) {
      return singular || result.checked === 1
        ? 'Jugada comprobada con el resultado oficial.'
        : `${result.checked} jugadas comprobadas con el resultado oficial.`;
    }
    if (result.unavailable > 0) return 'El resultado oficial todavía no está publicado. Primy volverá a comprobarlo automáticamente.';
    return 'No se han encontrado resultados nuevos que aplicar.';
  }, []);

  const checkGame = useCallback(async (gameId, { silent = false } = {}) => {
    if (!gameId || runningRef.current) return { checked: 0, unavailable: 0, skipped: true };
    runningRef.current = true;
    setCheckingGame(gameId);
    try {
      const result = await checkResults(gameId);
      if (!silent || result.checked > 0) showToast(result.error || resultMessage(result));
      return result;
    } finally {
      setCheckingGame('');
      runningRef.current = false;
    }
  }, [checkResults, resultMessage, showToast]);

  const checkPlay = useCallback(async play => {
    if (!play?.id || !play?.gameId || runningRef.current) return { checked: 0, unavailable: 0, skipped: true };
    runningRef.current = true;
    setCheckingPlayId(String(play.id));
    try {
      const result = await checkResults(play.gameId, { playIds: [play.id] });
      showToast(result.error || resultMessage(result, { singular: true }));
      return result;
    } finally {
      setCheckingPlayId('');
      runningRef.current = false;
    }
  }, [checkResults, resultMessage, showToast]);

  const checkAll = useCallback(async ({ silent = false } = {}) => {
    if (runningRef.current) return { checked: 0, unavailable: 0, skipped: true };
    const gameIds = dueGameIds;
    if (!gameIds.length) return { checked: 0, unavailable: 0 };
    runningRef.current = true;
    setCheckingGame('all');
    let checked = 0;
    let unavailable = 0;
    let firstError = '';
    try {
      for (const gameId of gameIds) {
        const result = await checkResults(gameId);
        checked += result.checked || 0;
        unavailable += result.unavailable || 0;
        firstError ||= result.error || '';
      }
      const aggregate = { checked, unavailable, error: firstError };
      if (!silent || checked > 0) showToast(firstError || resultMessage(aggregate));
      return aggregate;
    } finally {
      setCheckingGame('');
      runningRef.current = false;
    }
  }, [checkResults, dueGameIds, resultMessage, showToast]);


  useEffect(() => {
    if (!supabase || !dueKey || !dueGameIds.length) return undefined;
    const dueGames = new Set(dueGameIds);
    const channel = supabase
      .channel(`primy-fast-verification-${[...dueGameIds].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'primy_verification_events' },
        payload => {
          const gameId = String(payload?.new?.game_id || '');
          if (!dueGames.has(gameId) || document.visibilityState === 'hidden' || !navigator.onLine) return;
          window.setTimeout(() => checkGame(gameId, { silent: true }), 120);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkGame, dueGameIds, dueKey]);

  useEffect(() => {
    if (!dueKey) return undefined;
    let disposed = false;
    const refresh = () => {
      if (disposed || document.visibilityState === 'hidden' || !navigator.onLine || runningRef.current) return;
      checkAll({ silent: true });
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    const initialTimer = window.setTimeout(refresh, 1800);
    const interval = window.setInterval(refresh, AUTO_REFRESH_MS);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [checkAll, dueKey]);

  return { checkingGame, checkingPlayId, checkGame, checkPlay, checkAll };
}
