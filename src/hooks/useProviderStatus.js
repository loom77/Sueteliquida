import { useCallback, useEffect, useState } from 'react';

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export function useProviderStatus() {
  const [state, setState] = useState({ loading: true, online: false, configured: null, message: '', latestDrawDate: null });

  const reload = useCallback(async () => {
    setState(current => ({ ...current, loading: true }));
    try {
      const response = await fetch('/api/provider-status', { headers: { Accept: 'application/json' } });
      const data = await readJson(response);
      setState({
        loading: false,
        online: Boolean(response.ok && data.success),
        configured: data.configured !== false,
        message: data.message || '',
        latestDrawDate: data.latestDrawDate || null,
      });
    } catch {
      setState({ loading: false, online: false, configured: null, message: 'No se puede acceder al servicio de datos.', latestDrawDate: null });
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
