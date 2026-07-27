import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeHistory } from '../utils/historyAnalytics.js';

const KEY = 'primy_history_cache_v3';
const LEGACY_KEY = 'primy_history_cache_v2';
const CACHE_TTL = 6 * 60 * 60 * 1000;

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw new Error(`Il server ha restituito una risposta non valida (HTTP ${response.status}).`); }
}

const initialState = {
  loading: false, loaded: false, error: '', notice: '', analysis: null, source: '',
  limited: false, sufficientForAudit: false,
};

export function useHistoryData(gameId, { enabled = false } = {}) {
  const [state, setState] = useState(initialState);
  const controllerRef = useRef(null);

  const load = useCallback(async (force = false) => {
    const cache = readCache();
    const hit = cache[gameId];
    const fresh = hit && Date.now() - Number(hit.savedAt || 0) < CACHE_TTL;

    if (!force && fresh && Array.isArray(hit.draws)) {
      setState({
        loading: false, loaded: true, error: '', notice: hit.notice || '',
        analysis: hit.draws.length ? analyzeHistory(gameId, hit.draws) : null,
        source: hit.source || '', limited: Boolean(hit.limited),
        sufficientForAudit: Boolean(hit.sufficientForAudit),
      });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState(current => ({ ...current, loading: true, error: '', notice: '' }));
    try {
      const response = await fetch(`/api/history?game=${encodeURIComponent(gameId)}&years=10`, {
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const data = await readJson(response);
      if (!response.ok || !data.success) {
        const error = new Error(data.message || `Errore archivio (HTTP ${response.status}).`);
        error.code = data.code;
        throw error;
      }

      const draws = Array.isArray(data.draws) ? data.draws : [];
      const stored = {
        draws, source: data.source || '', notice: data.notice || '', limited: Boolean(data.limited),
        sufficientForAudit: Boolean(data.sufficientForAudit), savedAt: Date.now(),
      };
      try { localStorage.setItem(KEY, JSON.stringify({ ...cache, [gameId]: stored })); } catch { /* cache opzionale */ }
      setState({
        loading: false, loaded: true, error: '', notice: stored.notice,
        analysis: draws.length ? analyzeHistory(gameId, draws) : null,
        source: stored.source, limited: stored.limited, sufficientForAudit: stored.sufficientForAudit,
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      if (hit?.draws?.length) {
        setState({
          loading: false, loaded: true, error: `Connessione non disponibile: uso la cache locale. ${error.message}`,
          notice: hit.notice || '', analysis: analyzeHistory(gameId, hit.draws), source: hit.source || '',
          limited: Boolean(hit.limited), sufficientForAudit: Boolean(hit.sufficientForAudit),
        });
      } else {
        const guidance = error.code === 'KEY_NOT_CONFIGURED'
          ? ' Configura LOTERIA_API_KEY nelle Environment Variables di Vercel e ridistribuisci il progetto.'
          : error.code === 'AUTH_INVALID' ? ' Controlla la chiave nella dashboard di LoteriasAPI.'
            : error.code === 'PLAN_RESTRICTED' ? ' Il piano corrente potrebbe non includere lo storico richiesto.' : '';
        const code = error.code ? ` [${error.code}]` : '';
        setState({ ...initialState, loaded: true, error: `${error.message}${code}${guidance}` });
      }
    }
  }, [gameId]);

  useEffect(() => {
    if (enabled) load(false);
    return () => controllerRef.current?.abort();
  }, [enabled, load]);

  useEffect(() => {
    setState(current => current.loaded ? { ...initialState } : current);
  }, [gameId]);

  return { ...state, reload: () => load(true), load: () => load(false) };
}
