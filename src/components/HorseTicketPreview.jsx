import React, { useState } from 'react';
import { CheckIcon, HorseRacingIcon, TrashIcon } from './Icons.jsx';
import { playCost } from '../utils/playModel.js';
import { NumberBall } from './TicketUI.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function RunnerLabel({ race, number }) {
  const runner = race?.runners?.find(item => item.number === number);
  return <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-current/15 bg-white/80 px-3 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-current/10">{number}</span><span>{runner?.name || `Dorsal ${number}`}</span></span>;
}

function LototurfSummary({ play }) {
  const selection = play.selection || {};
  const race = play.races?.[0];
  return (
    <>
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Números</p>
        <div className="mt-3 flex flex-wrap gap-2">{(selection.numbers || []).map(number => <NumberBall key={number} compact>{number}</NumberBall>)}</div>
      </section>
      <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-950">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-800">Caballo ganador · 4.ª carrera</p>
        <p className="mt-1 text-sm text-secondary">{race?.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">{(selection.horses || []).map(number => <RunnerLabel key={number} race={race} number={number}/>)}</div>
      </section>
    </>
  );
}

function QuintupleSummary({ play }) {
  const rows = play.selection?.rows || [];
  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const raceIndex = Math.min(index, 4);
        const race = play.races?.[raceIndex];
        return (
          <section key={`${race?.raceId || raceIndex}-${index}`} className="rounded-2xl border border-violet-200 bg-violet-50/65 p-4 text-violet-950">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-800">{index < 5 ? `Ganador · carrera ${index + 1}` : 'Segundo · carrera 5'}</p>
            <p className="mt-1 truncate text-sm text-secondary">{race?.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">{row.map(number => <RunnerLabel key={number} race={race} number={number}/>)}</div>
          </section>
        );
      })}
    </div>
  );
}

export default function HorseTicketPreview({ play, saveState, onSaveDraft, onDiscard, onOpenPlays }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isLototurf = play.gameId === 'lototurf';
  const accent = isLototurf ? 'orange' : 'violet';
  const title = isLototurf ? 'Lototurf' : 'Quíntuple Plus';

  return (
    <section className="primy-page-enter" aria-labelledby="horse-preview-title">
      <article className={`overflow-hidden rounded-[2rem] border ${isLototurf ? 'border-orange-200' : 'border-violet-200'} bg-surface shadow-soft`}>
        <header className={isLototurf ? 'bg-gradient-to-br from-orange-900 via-orange-800 to-amber-700 p-5 text-white sm:p-6' : 'bg-gradient-to-br from-violet-950 via-violet-800 to-fuchsia-700 p-5 text-white sm:p-6'}>
          <div className="flex items-start gap-3"><HorseRacingIcon width="24" height="24"/><div><p className={`text-xs font-bold uppercase tracking-[.18em] ${isLototurf ? 'text-orange-100' : 'text-violet-100'}`}>Jugada hípica preparada</p><h2 id="horse-preview-title" className="mt-2 text-3xl font-semibold tracking-[-.04em]">{title}</h2><p className={`mt-2 text-sm ${isLototurf ? 'text-orange-100' : 'text-violet-100'}`}>{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'} · {play.equivalentBets} {play.equivalentBets === 1 ? 'apuesta' : 'apuestas'} · {euro.format(playCost(play))}</p></div></div>
        </header>

        <div className="p-5 sm:p-6">
          {isLototurf ? <LototurfSummary play={play}/> : <QuintupleSummary play={play}/>} 

          <div className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${isLototurf ? 'border-orange-100 bg-orange-50 text-orange-950' : 'border-violet-100 bg-violet-50 text-violet-950'}`}>
            <p className="font-semibold">Estado: preparada, no comprada</p>
            <p className="mt-1">Primy conserva la jornada, la revisión oficial y el pronóstico. El módulo todavía no registra compras ni confirma premios monetarios.</p>
          </div>

          {saveState === 'draft' ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              <CheckIcon width="18" height="18" className="mr-2 inline"/>Borrador guardado en tu Archivo.
              <button type="button" onClick={onOpenPlays} className="ml-2 underline underline-offset-2">Abrir Archivo</button>
            </div>
          ) : (
            <button type="button" onClick={onSaveDraft} className={`mt-5 min-h-12 w-full rounded-xl px-5 text-sm font-bold text-white ${isLototurf ? 'bg-orange-700 hover:bg-orange-800' : 'bg-violet-700 hover:bg-violet-800'}`}><CheckIcon width="18" height="18" className="mr-2 inline"/>Guardar como borrador</button>
          )}

          <button type="button" onClick={() => setConfirmDiscard(true)} className="mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17" className="mr-2 inline"/>Descartar</button>

          {confirmDiscard && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="font-semibold text-rose-950">¿Descartar esta jugada?</p><p className="mt-1 text-sm text-rose-900">Si todavía no la has guardado, no podrá recuperarse.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-primary">Conservar</button><button type="button" onClick={onDiscard} className="min-h-11 rounded-xl bg-rose-700 text-sm font-semibold text-white">Descartar</button></div></div>}
        </div>
      </article>
    </section>
  );
}
