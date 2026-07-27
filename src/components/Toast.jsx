import React, { useEffect } from 'react';
import { XIcon } from './Icons.jsx';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-default bg-slate-950 p-4 text-white shadow-xl lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]">
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-semibold leading-6">{toast.message}</p>
        <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:bg-surface/10 hover:text-white" aria-label="Chiudi messaggio"><XIcon width="18" height="18"/></button>
      </div>
      {toast.action && <button type="button" onClick={() => { toast.action(); onClose(); }} className="mt-2 min-h-11 rounded-xl bg-surface px-4 text-sm font-black text-primary">{toast.actionLabel || 'Annulla'}</button>}
    </div>
  );
}
