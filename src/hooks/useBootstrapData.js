import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CACHE_KEY = 'primy_bootstrap_v1';
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw new Error(`Respuesta de datos no válida (HTTP ${response.status}).`); }
}

export function useBootstrapData() {
  const [state, setState] = useState({ loading: true, games: {}, errors: {}, fetchedAt: '', error: '', online: false, configured: null, message: '' });
  const controllerRef = useRef(null);

  const load = useCallback(async (force = false) => {
    const cached = readCache();
    if (!force && cached && Date.now() - Number(cached.savedAt || 0) < CACHE_TTL) {
      setState({ ...cached, loading: false, error: '', online: Object.keys(cached.games || {}).length > 0 });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const response = await fetch('/api/bootstrap', { headers: { Accept: 'application/json' }, signal: controller.signal });
      const data = await readJson(response);
      if (!response.ok || !data.success) throw Object.assign(new Error(data.message || 'No se pueden actualizar los datos.'), { configured: data.configured, code: data.code });
      const next = {
        loading: false,
        games: data.games || {}, errors: data.errors || {}, fetchedAt: data.fetchedAt || '', error: '',
        online: true, configured: data.configured !== false, message: data.message || '',
      };
      setState(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...next, savedAt: Date.now() })); } catch { /* caché opcional */ }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      if (cached) {
        setState({ ...cached, loading: false, online: Object.keys(cached.games || {}).length > 0, error: 'Datos sin actualizar: se muestra la última sincronización disponible.' });
      } else {
        setState({ loading: false, games: {}, errors: {}, fetchedAt: '', error: error?.message || 'No se pueden actualizar los datos.', online: false, configured: error?.configured ?? null, message: error?.message || '' });
      }
    }
  }, []);

  useEffect(() => {
    load(false);
    return () => controllerRef.current?.abort();
  }, [load]);

  const providerStatus = useMemo(() => ({
    loading: state.loading,
    online: state.online,
    configured: state.configured,
    message: state.message || state.error,
    reload: () => load(true),
  }), [state, load]);

  const drawOverview = useMemo(() => ({
    loading: state.loading,
    games: state.games,
    errors: state.errors,
    fetchedAt: state.fetchedAt,
    error: state.error,
    reload: () => load(true),
  }), [state, load]);

  return { providerStatus, drawOverview, reload: () => load(true) };
}
