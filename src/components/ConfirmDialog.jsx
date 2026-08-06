import React from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  busy = false,
}) {
  const titleId = 'confirm-dialog-title';
  const confirmTone = tone === 'danger'
    ? 'bg-rose-700 text-white hover:bg-rose-800'
    : 'bg-primy-700 text-white hover:bg-primy-800';

  return (
    <AccessibleDialog open={open} onClose={busy ? undefined : onClose} labelledBy={titleId} className="max-w-lg" closeOnBackdrop={!busy}>
      <div>
        <p className="text-sm font-bold text-primy-700">Confirmación</p>
        <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-primary">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 text-secondary">{description}</p>}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={busy} className="min-h-12 rounded-xl border border-default bg-surface px-5 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-50">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={`min-h-12 rounded-xl px-5 text-sm font-semibold disabled:opacity-50 ${confirmTone}`}>
          {busy ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </AccessibleDialog>
  );
}
