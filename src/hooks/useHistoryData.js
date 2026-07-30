import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeHistory } from '../utils/historyAnalytics.js';

const KEY = 'primy_history_cache_v5';
const LEGACY_KEYS = ['primy_history_cache_v4', 'primy_history_cache_v3', 'primy_history_cache_v2'];
const CACHE_TTL = 6 * 60 * 60 * 1000;
const LIMITED_CACHE_TTL = 24 * 60 * 60 * 1000;
const MIN_MANUAL_REFRESH_MS = 60 * 1000;

function readCache() {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      const value = localStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch { /* cache opzionale */ }
  return {};
}

function cleanNotice(value, { latestOnly = false, totalDraws = 0 } = {}) {
  if (latestOnly || totalDraws <= 1) {
    return 'Solo hay un sorteo archivado. Primy seguirá ampliando el archivo con los resultados oficiales de SELAE.';
  }
  return typeof value === 'string' ? value : '';
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw new Error(`El servidor ha devuelto una respuesta no válida (HTTP ${response.status}).`); }
}

const initialState = {
  loading: false,
  loaded: false,
  error: '',
  warning: '',
  notice: '',
  analysis: null,
  source: '',
  limited: false,
  latestOnly: false,
  stale: false,
  sufficientForAudit: false,
  retryAt: 0,
  savedAt: 0,
};

export function useHistoryData(gameId, { enabled = false } = {}) {
  const [state, setState] = useState(initialState);
  const controllerRef = useRef(null);
  const lastManualRefreshRef = useRef(0);
  const retryAtRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const cache = readCache();
    const hit = cache[gameId];
    const ttl = hit?.latestOnly || hit?.limited ? LIMITED_CACHE_TTL : CACHE_TTL;
    const fresh = hit && Date.now() - Number(hit.savedAt || 0) < ttl;

    if (!force && fresh && Array.isArray(hit.draws)) {
      const totalDraws = hit.draws.length;
      retryAtRef.current = 0;
      setState({
        loading: false,
        loaded: true,
        error: '',
        warning: '',
        notice: cleanNotice(hit.notice, { latestOnly: Boolean(hit.latestOnly), totalDraws }),
        analysis: totalDraws ? analyzeHistory(gameId, hit.draws) : null,
        source: hit.source || '',
        limited: Boolean(hit.limited),
        latestOnly: Boolean(hit.latestOnly) || totalDraws <= 1,
        stale: Boolean(hit.stale),
        sufficientForAudit: Boolean(hit.sufficientForAudit),
        retryAt: 0,
        savedAt: Number(hit.savedAt || 0),
      });
      return;
    }

    if (force) {
      const now = Date.now();
      const retryAt = Math.max(retryAtRef.current, lastManualRefreshRef.current + MIN_MANUAL_REFRESH_MS);
      if (retryAt > now) {
        const seconds = Math.max(1, Math.ceil((retryAt - now) / 1000));
        setState(current => ({ ...current, warning: `Espera ${seconds} segundos antes de volver a actualizar el historial.` }));
        return;
      }
      lastManualRefreshRef.current = now;
    } else {
      lastManualRefreshRef.current = Date.now();
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState(current => ({ ...current, loading: true, error: '', warning: '', notice: current.notice || '' }));

    try {
      const response = await fetch(`/api/history?game=${encodeURIComponent(gameId)}&years=10`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const data = await readJson(response);
      if (!response.ok || !data.success) {
        const error = new Error(data.message || `Error del archivo histórico (HTTP ${response.status}).`);
        error.code = data.code;
        error.retryAfter = Number(data.retryAfter || response.headers.get('retry-after')) || 0;
        throw error;
      }

      const draws = Array.isArray(data.draws) ? data.draws : [];
      const totalDraws = draws.length;
      const stored = {
        draws,
        source: data.source || '',
        notice: cleanNotice(data.notice, { latestOnly: Boolean(data.latestOnly), totalDraws }),
        limited: Boolean(data.limited),
        latestOnly: Boolean(data.latestOnly) || totalDraws <= 1,
        stale: Boolean(data.stale),
        sufficientForAudit: Boolean(data.sufficientForAudit),
        savedAt: Date.now(),
      };
      try { localStorage.setItem(KEY, JSON.stringify({ ...cache, [gameId]: stored })); } catch { /* cache opzionale */ }
      retryAtRef.current = 0;
      setState({
        loading: false,
        loaded: true,
        error: '',
        warning: stored.stale ? 'No se ha podido actualizar SELAE; se conserva la última copia disponible.' : '',
        notice: stored.notice,
        analysis: totalDraws ? analyzeHistory(gameId, draws) : null,
        source: stored.source,
        limited: stored.limited,
        latestOnly: stored.latestOnly,
        stale: stored.stale,
        sufficientForAudit: stored.sufficientForAudit,
        retryAt: 0,
        savedAt: stored.savedAt,
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      const retrySeconds = error.retryAfter || (error.code === 'RATE_LIMITED' || error.code === 'LOCAL_RATE_LIMIT' ? 60 : 0);
      const retryAt = retrySeconds ? Date.now() + retrySeconds * 1000 : 0;
      retryAtRef.current = retryAt;

      if (hit?.draws?.length) {
        const totalDraws = hit.draws.length;
        setState({
          loading: false,
          loaded: true,
          error: '',
          warning: error.code === 'RATE_LIMITED' || error.code === 'LOCAL_RATE_LIMIT'
            ? 'SELAE ha limitado temporalmente las actualizaciones. Se conserva la última copia local.'
            : 'No se ha podido actualizar el historial. Se conserva la última copia local.',
          notice: cleanNotice(hit.notice, { latestOnly: Boolean(hit.latestOnly), totalDraws }),
          analysis: analyzeHistory(gameId, hit.draws),
          source: hit.source || '',
          limited: Boolean(hit.limited),
          latestOnly: Boolean(hit.latestOnly) || totalDraws <= 1,
          stale: true,
          sufficientForAudit: Boolean(hit.sufficientForAudit),
          retryAt,
          savedAt: Number(hit.savedAt || 0),
        });
      } else {
        const guidance = error.code === 'CRON_SECRET_NOT_CONFIGURED'
          ? ' Configura CRON_SECRET para activar la sincronización programada.'
          : error.code === 'REPOSITORY_NOT_CONFIGURED'
            ? ' Configura SUPABASE_SERVICE_ROLE_KEY para conservar el archivo entre despliegues.'
            : '';
        setState({ ...initialState, loaded: true, retryAt, error: `${error.message}${guidance}` });
      }
    }
  }, [gameId]);

  useEffect(() => {
    setState(initialState);
    lastManualRefreshRef.current = 0;
    retryAtRef.current = 0;
    if (enabled) load(false);
    return () => controllerRef.current?.abort();
  }, [gameId, enabled, load]);

  return { ...state, reload: () => load(true), load: () => load(false) };
}
