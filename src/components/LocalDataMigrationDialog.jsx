import React from 'react';
import AccessibleDialog from './AccessibleDialog.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';

export default function LocalDataMigrationDialog({ count, onImport, onSkip, busy }) {
  return (
    <AccessibleDialog open={count > 0} onClose={() => {}} labelledBy="local-migration-title" closeOnBackdrop={false} className="max-w-lg">
      <div className="mb-4"><PrimyMascotGraphic className="mx-auto w-full max-w-[280px]" size="dashboard" caption="Puedo llevar tus jugadas a tu cuenta"/></div><p className="text-sm font-semibold text-primy-700">Migración de datos</p>
      <h2 id="local-migration-title" className="mt-1 text-2xl font-semibold text-primary">Hemos encontrado jugadas en este dispositivo</h2>
      <p className="mt-3 text-sm leading-6 text-secondary">Hay {count} {count === 1 ? 'jugada guardada' : 'jugadas guardadas'} antes de crear la cuenta. Puedes copiarlas a tu cuenta para verlas también en otros dispositivos.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onSkip} disabled={busy} className="min-h-12 rounded-2xl border border-default px-4 font-semibold text-primary hover:bg-muted disabled:opacity-60">No importar</button>
        <button type="button" onClick={onImport} disabled={busy} className="min-h-12 rounded-xl bg-primy-700 px-4 font-semibold text-white hover:bg-primy-800 disabled:opacity-60">{busy ? 'Importando…' : 'Importar a mi cuenta'}</button>
      </div>
    </AccessibleDialog>
  );
}
