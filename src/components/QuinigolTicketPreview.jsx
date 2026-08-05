import React from 'react';
import { formatDrawDate } from '../utils/drawSchedule.js';
import { CheckIcon, TrashIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function QuinigolTicketPreview({ play, saveState, onSaveDraft, onDiscard, onOpenPlays }) {
  const outcomes = play.columns?.[0]?.outcomes || [];
  const matches = play.matches || [];
  return (
    <article className="rounded-[2rem] border border-orange-200 bg-white p-5 shadow-soft sm:p-6" aria-label="Vista previa del Quinigol">
      <header className="flex flex-col gap-3 border-b border-orange-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">El Quinigol</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'}</h2>
          <p className="mt-1 text-sm text-secondary">{formatDrawDate(play.drawDateISO)} · {euro.format(1)}</p>
        </div>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-900">Borrador</span>
      </header>

      <div className="mt-5 space-y-2">
        {matches.map((match, index) => (
          <div key={match.matchId} className="grid grid-cols-[2rem_minmax(0,1fr)_4rem] items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-3">
            <span className="text-xs font-bold text-secondary">{index + 1}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{match.homeTeam}</p><p className="truncate text-xs text-secondary">{match.awayTeam}</p></div>
            <span className="flex min-h-10 items-center justify-center rounded-xl bg-orange-600 text-sm font-extrabold text-white">{outcomes[index] || '—'}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onSaveDraft} disabled={saveState === 'saving'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white disabled:opacity-60"><CheckIcon width="18" height="18"/>{saveState === 'saving' ? 'Guardando…' : 'Guardar borrador'}</button>
        <button type="button" onClick={onDiscard} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-bold text-orange-950"><TrashIcon width="18" height="18"/>Descartar</button>
      </div>
      {saveState === 'saved' && <button type="button" onClick={onOpenPlays} className="mt-3 min-h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900">Abrir Archivo</button>}
    </article>
  );
}
