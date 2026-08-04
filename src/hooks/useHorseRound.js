import { useCallback, useEffect, useState } from 'react';
import { sanitizeHorseRound } from '../horse/roundModel.js';

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

export function useHorseRound(gameId, { enabled = true } = {}) {
  const [state, setState] = useState({ round: null, loading: false, error: '', repository: null });

  const load = useCallback(async signal => {
    if (!enabled || !gameId) return;
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const response = await fetch(`/api/horse-rounds?game=${encodeURIComponent(gameId)}`, {
        headers: { Accept: 'application/json' },
        signal,
      });
      const payload = await readJson(response);
      if (!response.ok || !payload.success) throw new Error(payload.message || 'No se puede cargar la jornada hípica oficial.');
      const round = sanitizeHorseRound(payload.data);
      if (!round.validation.valid) throw new Error(round.validation.errors.join(' '));
      if (round.gameId !== gameId) throw new Error('La jornada recibida no corresponde al juego seleccionado.');
      setState({ round, loading: false, error: '', repository: payload.repository || null });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setState(current => ({ ...current, loading: false, error: error?.message || 'No se puede cargar la jornada hípica oficial.' }));
    }
  }, [enabled, gameId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [enabled, load]);

  const refresh = useCallback(() => load(undefined), [load]);
  return { ...state, refresh };
}
