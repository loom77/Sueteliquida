import { useCallback, useEffect, useState } from 'react';
import { sanitizeSportsRound, sportsRoundAvailability } from '../sports/roundModel.js';

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

export function useSportsRound(gameId, { enabled = true } = {}) {
  const [state, setState] = useState({ round: null, availability: null, loading: false, error: '', repository: null });

  const load = useCallback(async signal => {
    if (!enabled || !gameId) return;
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const response = await fetch(`/api/sports-rounds?game=${encodeURIComponent(gameId)}`, {
        headers: { Accept: 'application/json' },
        signal,
      });
      const payload = await readJson(response);
      if (!response.ok || !payload.success) throw new Error(payload.message || 'No se puede cargar la jornada oficial.');
      if (!payload.data) {
        setState({ round: null, availability: payload.availability || { state: 'updating', operational: false, title: 'Jornada en actualización', message: 'Primy está esperando una composición oficial completa y verificable.', reasons: [] }, loading: false, error: '', repository: payload.repository || null });
        return;
      }
      const expectedMatches = gameId === 'quiniela' ? 15 : 6;
      const round = sanitizeSportsRound(payload.data, { expectedMatches });
      if (!round.validation.valid) throw new Error(round.validation.errors.join(' '));
      setState({ round, availability: sportsRoundAvailability(round, { expectedMatches }), loading: false, error: '', repository: payload.repository || null });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setState(current => ({ ...current, loading: false, error: error?.message || 'No se puede cargar la jornada oficial.', availability: { state: 'unavailable', operational: false, title: 'Jornada no disponible', message: 'Primy todavía no ha recibido una composición oficial completa y verificable.', reasons: [] } }));
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
