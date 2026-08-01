import React, { useState } from 'react';
import { CheckIcon, TrashIcon } from './Icons.jsx';
import { playCost } from '../utils/playModel.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function QuinielaTicketPreview({ play, saveState, onSaveDraft, onDiscard, onOpenPlays }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const column = play.columns?.[0];
  const matches = play.matches || [];

  return (
    <section className="primy-page-enter" aria-labelledby="quiniela-preview-title">
      <article className="overflow-hidden rounded-[2rem] border border-sky-200 bg-surface shadow-soft">
        <header className="bg-gradient-to-br from-sky-900 via-sky-800 to-cyan-700 p-5 text-white sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-100">Jugada preparada</p>
          <h2 id="quiniela-preview-title" className="mt-2 text-3xl font-semibold tracking-[-.04em]">La Quiniela</h2>
          <p className="mt-2 text-sm text-sky-100">{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'} · {euro.format(playCost(play))}</p>
        </header>

        <div className="p-5 sm:p-6">
          <div className="space-y-2">
            {matches.slice(0, 14).map((match, index) => (
              <div key={match.matchId} className="grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-xl border border-default bg-muted px-3 py-2.5">
                <span className="text-xs font-bold text-secondary">{index + 1}</span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{match.homeTeam}</p><p className="truncate text-xs text-secondary">{match.awayTeam}</p></div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-800 text-lg font-extrabold text-white">{column.signs[index]}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Pleno al 15</p>
            <p className="mt-2 font-semibold text-primary">{matches[14]?.homeTeam} {column.pleno.home} – {column.pleno.away} {matches[14]?.awayTeam}</p>
            <p className="mt-1 text-xs text-secondary">M representa tres o más goles.</p>
          </div>

          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
            <p className="font-semibold">Estado: preparada, no comprada</p>
            <p className="mt-1">La composición oficial queda vinculada mediante jornada, revisión y huella de fuente. En esta fase Primy solo permite guardarla como borrador.</p>
          </div>

          {saveState === 'draft' ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              <CheckIcon width="18" height="18" className="mr-2 inline"/>Borrador guardado en tu Archivo.
              <button type="button" onClick={onOpenPlays} className="ml-2 underline underline-offset-2">Abrir Archivo</button>
            </div>
          ) : (
            <button type="button" onClick={onSaveDraft} className="mt-5 min-h-12 w-full rounded-xl bg-sky-800 px-5 text-sm font-bold text-white hover:bg-sky-900"><CheckIcon width="18" height="18" className="mr-2 inline"/>Guardar como borrador</button>
          )}

          <button type="button" onClick={() => setConfirmDiscard(true)} className="mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17" className="mr-2 inline"/>Descartar</button>

          {confirmDiscard && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-semibold text-rose-950">¿Descartar esta Quiniela?</p><p className="mt-1 text-sm text-rose-900">Si todavía no la has guardado, no podrá recuperarse.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-primary">Conservar</button><button type="button" onClick={onDiscard} className="min-h-11 rounded-xl bg-rose-700 text-sm font-semibold text-white">Descartar</button></div></div>}
        </div>
      </article>
    </section>
  );
}
