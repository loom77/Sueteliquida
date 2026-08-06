import React, { useEffect, useState } from 'react';
import { XIcon } from './Icons.jsx';

export default function Toast({ toast, onClose }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(false);
  }, [toast]);

  useEffect(() => {
    if (!toast || paused) return undefined;
    const duration = Number(toast.duration) || (toast.action ? 10_000 : 6_000);
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [toast, onClose, paused]);

  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-default bg-primy-700 p-4 text-white shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-semibold leading-6">{toast.message}</p>
        <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primy-100 hover:bg-surface/10 hover:text-white" aria-label="Cerrar mensaje"><XIcon width="18" height="18"/></button>
      </div>
      {toast.action && <button type="button" onClick={() => { toast.action(); onClose(); }} className="mt-2 min-h-11 rounded-xl bg-surface px-4 text-sm font-semibold text-primary">{toast.actionLabel || 'Deshacer'}</button>}
    </div>
  );
}
