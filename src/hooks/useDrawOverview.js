import { useCallback, useEffect, useState } from 'react';

const CACHE_KEY = 'primy_draw_overview_v1';
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw new Error(`Respuesta de datos no válida (HTTP ${response.status}).`); }
}

export function useDrawOverview() {
  const [state, setState] = useState({ loading: true, games: {}, errors: {}, fetchedAt: '', error: '' });

  const load = useCallback(async (force = false) => {
    const cached = readCache();
    if (!force && cached && Date.now() - Number(cached.savedAt || 0) < CACHE_TTL) {
      setState({ loading: false, games: cached.games || {}, errors: cached.errors || {}, fetchedAt: cached.fetchedAt || '', error: '' });
      return;
    }

    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const response = await fetch('/api/draw-overview', { headers: { Accept: 'application/json' } });
      const data = await readJson(response);
      if (!response.ok || !data.success) throw new Error(data.message || 'No se pueden actualizar los botes ni la fuente de datos.');
      const next = { loading: false, games: data.games || {}, errors: data.errors || {}, fetchedAt: data.fetchedAt || '', error: '' };
      setState(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...next, savedAt: Date.now() })); } catch { /* caché opcional */ }
    } catch (error) {
      if (cached) {
        setState({ loading: false, games: cached.games || {}, errors: cached.errors || {}, fetchedAt: cached.fetchedAt || '', error: 'Datos sin actualizar: se muestra la última sincronización disponible.' });
      } else {
        setState({ loading: false, games: {}, errors: {}, fetchedAt: '', error: error?.message || 'No se pueden actualizar los datos.' });
      }
    }
  }, []);

  useEffect(() => { load(false); }, [load]);
  return { ...state, reload: () => load(true) };
}
