import React, { useEffect, useState } from 'react';
import { formatDrawDate, formatDrawTime } from '../utils/drawSchedule.js';
import { playCost } from '../utils/playModel.js';
import { NumberBall } from './TicketUI.jsx';
import DistributionMap from './DistributionMap.jsx';
import { CheckIcon, ChevronDownIcon, CopyIcon, SparklesIcon, TicketIcon, VolumeIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">{label}</p>
      <p className="mt-1 text-lg font-black text-primary">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-secondary">{detail}</p>}
    </div>
  );
}

export default function TicketPreview({ play, game, saveState = 'unsaved', onSaveDraft, onPurchase, onRegenerate, onDiscard, onOpenPlays, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  useEffect(() => { setExpanded(false); setConfirmPurchase(false); }, [play?.id]);

  if (!play) {
    return (
      <section className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-default bg-surface p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted-strong text-secondary"><TicketIcon width="26" height="26"/></span>
        <h2 className="mt-4 text-xl font-black text-primary">La giocata apparirà qui</h2>
      </section>
    );
  }

  const quality = play.metadata?.quality || {};
  const receiptScopedExtra = game.extra.scope === 'receipt';
  const receiptExtra = play.receiptExtra ?? play.columns?.[0]?.extra;
  const history = play.metadata?.history;
  const shownColumns = expanded ? play.columns : play.columns.slice(0, 3);
  const hiddenCount = play.columns.length - shownColumns.length;

  const copyPlay = async () => {
    const extraLine = receiptScopedExtra ? `\nReintegro del resguardo: ${receiptExtra}` : '';
    const columnsText = play.columns.map((column, index) => `Colonna ${index + 1}: ${column.numbers.join(' ')}${receiptScopedExtra ? '' : ` · ${game.extra.label} ${column.extra}`}`).join('\n');
    const text = `${game.name} — ${formatDrawDate(play.drawDateISO)}${extraLine}\n${columnsText}`;
    try {
      await navigator.clipboard.writeText(text);
      onToast?.('Colonne copiate negli appunti.');
    } catch {
      onToast?.('Il browser non ha consentito la copia automatica.');
    }
  };

  const speakPlay = () => {
    if (!('speechSynthesis' in window)) return onToast?.('La lettura vocale non è disponibile in questo browser.');
    window.speechSynthesis.cancel();
    const sharedExtraText = receiptScopedExtra ? `Reintegro del resguardo: ${receiptExtra}. ` : '';
    const text = `${game.name}. ${sharedExtraText}${play.columns.map((column, index) => `Colonna ${index + 1}: ${column.numbers.join(', ')}.${receiptScopedExtra ? '' : ` ${game.extra.label}: ${column.extra}.`}`).join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  if (saveState !== 'unsaved') {
    return (
      <section className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white"><CheckIcon width="26" height="26"/></span>
        <h2 className="mt-4 text-xl font-black text-emerald-950">{saveState === 'purchased' ? 'Giocata registrata' : 'Bozza salvata'}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-emerald-900">{saveState === 'purchased' ? 'Primy la segnalerà quando sarà pronta per la verifica.' : 'La ritroverai nella sezione Le mie giocate.'}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onOpenPlays} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800">Vai alle mie giocate</button>
          <button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl border border-emerald-300 bg-surface px-5 text-sm font-black text-emerald-800 hover:bg-emerald-100">Crea un’altra</button>
        </div>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <article className="rounded-3xl border border-default bg-surface p-5 md:p-7">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-indigo-700"><SparklesIcon width="18" height="18"/>Giocata pronta</p>
          <h2 className="mt-1 text-2xl font-black text-primary">{game.name}</h2>
          <p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO)} · {formatDrawTime(play.drawDateTimeISO || play.drawDateISO)} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'}</p>
        </div>

        {receiptScopedExtra && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Reintegro del resguardo</p>
              <p className="mt-1 text-sm leading-6 text-amber-950">È unico e vale per tutte le colonne di questa schedina.</p>
            </div>
            <NumberBall extra>{receiptExtra}</NumberBall>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {shownColumns.map((column, index) => (
            <div key={column.id} className="rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Colonna {index + 1}</p>
                {!receiptScopedExtra && <span className="text-xs font-bold text-secondary">{game.extra.label} {column.extra}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {column.numbers.map(number => <NumberBall key={number}>{number}</NumberBall>)}
                {!receiptScopedExtra && <><span aria-hidden="true" className="mx-1 h-8 w-px bg-slate-300"/><NumberBall extra>{column.extra}</NumberBall></>}
              </div>
            </div>
          ))}
        </div>

        {play.columns.length > 3 && (
          <button type="button" onClick={() => setExpanded(value => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-default text-sm font-black text-primary hover:bg-muted" aria-expanded={expanded}>
            {expanded ? 'Mostra meno colonne' : `Mostra le altre ${hiddenCount} colonne`}
            <ChevronDownIcon className={expanded ? 'rotate-180' : ''} width="18" height="18"/>
          </button>
        )}

        {confirmPurchase ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="group" aria-labelledby="confirm-purchase-title">
            <h3 id="confirm-purchase-title" className="text-lg font-black text-emerald-950">Hai acquistato questa schedina?</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-900">{game.name} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'} · {euro.format(playCost(play))}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setConfirmPurchase(false)} className="min-h-12 rounded-xl border border-emerald-300 bg-white px-5 text-sm font-black text-emerald-900 hover:bg-emerald-100">No, torna indietro</button>
              <button type="button" onClick={() => { setConfirmPurchase(false); onPurchase(); }} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>Sì, registra</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setConfirmPurchase(true)} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>Ho giocato · {euro.format(playCost(play))}</button>
            <button type="button" onClick={onSaveDraft} className="min-h-12 rounded-xl border border-default bg-surface px-5 text-sm font-black text-primary hover:bg-muted">Salva come bozza</button>
          </div>
        )}

        <p className="mt-3 text-center text-xs leading-5 text-secondary">Primy non acquista la schedina. Registra la giocata solo dopo l’acquisto su un canale autorizzato.</p>

        <details className="mt-6 rounded-2xl border border-default">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-primary">
            <span>Strumenti e dettagli tecnici</span>
            <span className="text-xs font-bold text-indigo-700">Facoltativi</span>
          </summary>
          <div className="space-y-5 border-t border-default p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={copyPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><CopyIcon width="17" height="17"/>Copia numeri</button>
              <button type="button" onClick={speakPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><VolumeIcon width="17" height="17"/>Ascolta numeri</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Numeri diversi" value={`${quality.uniqueNumbers || 0} su ${game.numberPoolMax}`} detail={`${Math.round((quality.coverageRatio || 0) * 100)}% del range.`}/>
              <Metric label="Ripetizione" value={Number(quality.averageOverlap || 0) < 1 ? 'Bassa' : Number(quality.averageOverlap || 0) < 2 ? 'Moderata' : 'Alta'} detail={`Media: ${Number(quality.averageOverlap || 0).toFixed(1)}.`}/>
              <Metric label="Combinazioni valutate" value={Number(play.metadata?.candidatesAnalyzed || 0).toLocaleString('it-IT')} detail="Candidati esaminati."/>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm font-black text-primary">Come è stata costruita</p>
              <p className="mt-2 text-sm leading-6 text-secondary">Primy confronta più modelli con una baseline equivalente e coordina la copertura tra le colonne. Queste metriche descrivono la distribuzione, non garantiscono una vincita.</p>
              <p className="mt-2 text-sm font-bold text-primary">Dati storici: {history?.used ? 'inclusi dopo la validazione' : 'non inclusi in questa elaborazione'}.</p>
            </div>

            {play.columns.length > 1 && <DistributionMap play={play} game={game}/>} 
          </div>
        </details>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Genera di nuovo</button>
          <button type="button" onClick={onDiscard} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Scarta</button>
        </div>
      </article>
    </section>
  );
}
