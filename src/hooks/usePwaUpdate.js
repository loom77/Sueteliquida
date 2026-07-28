import { useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function usePwaUpdate({ onNeedRefresh, onOfflineReady } = {}) {
  const callbacks = useRef({ onNeedRefresh, onOfflineReady });
  callbacks.current = { onNeedRefresh, onOfflineReady };

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() { callbacks.current.onNeedRefresh?.(() => updateSW(true)); },
      onOfflineReady() { callbacks.current.onOfflineReady?.(); },
      onRegisterError(error) { console.error('No se ha podido registrar la PWA:', error); },
    });
  }, []);
}
