import React, { useEffect, useState } from 'react';
import { formatDrawDate, formatDrawTime } from '../utils/drawSchedule.js';
import { playCost } from '../utils/playModel.js';
import { NumberBall } from './TicketUI.jsx';
import DistributionMap from './DistributionMap.jsx';
import { CheckIcon, ChevronDownIcon, CopyIcon, SparklesIcon, TicketIcon, VolumeIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function Metric({ label, value, detail }) {
  return <div className="rounded-xl bg-muted p-4"><p className="text-xs font-bold uppercase tracking-wide text-secondary">{label}</p><p className="mt-1 text-lg font-black text-primary">{value}</p>{detail && <p className="mt-1 text-xs leading-5 text-secondary">{detail}</p>}</div>;
}

export default function TicketPreview({ play, game, saveState = 'unsaved', onSaveDraft, onPurchase, onRegenerate, onDiscard, onOpenPlays, onToast }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  useEffect(() => { setExpanded(false); setConfirmPurchase(false); }, [play?.id]);

  if (!play) {
    return (
      <section className="flex min-h-[460px] flex-col items-center justify-center rounded-3xl border border-dashed border-default bg-surface p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted-strong text-secondary"><TicketIcon width="26" height="26"/></span>
        <h2 className="mt-4 text-xl font-black text-primary">L’anteprima apparirà qui</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">Scegli gioco e budget. Primy non salva nulla finché non decidi tu.</p>
      </section>
    );
  }

  const quality = play.metadata?.quality || {};
  const history = play.metadata?.history;
  const shownColumns = expanded ? play.columns : play.columns.slice(0, 3);
  const hiddenCount = play.columns.length - shownColumns.length;

  const copyPlay = async () => {
    const text = `${game.name} — ${formatDrawDate(play.drawDateISO)}\n${play.columns.map((column, index) => `Colonna ${index + 1}: ${column.numbers.join(' ')} · ${game.extra.label} ${column.extra}`).join('\n')}`;
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
    const text = `${game.name}. ${play.columns.map((column, index) => `Colonna ${index + 1}: ${column.numbers.join(', ')}. ${game.extra.label}: ${column.extra}.`).join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  if (saveState !== 'unsaved') {
    return (
      <section className="flex min-h-[460px] flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white"><CheckIcon width="26" height="26"/></span>
        <h2 className="mt-4 text-xl font-black text-emerald-950">{saveState === 'purchased' ? 'Giocata registrata' : 'Bozza salvata'}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-emerald-900">{saveState === 'purchased' ? 'Primy la terrà nello storico e la segnalerà quando sarà pronta per la verifica.' : 'Potrai ritrovarla e segnarla come giocata dalla sezione Le mie giocate.'}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onOpenPlays} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800">Vai alle mie giocate</button><button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl border border-emerald-300 bg-surface px-5 text-sm font-black text-emerald-800 hover:bg-emerald-100">Crea un’altra giocata</button></div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-live="polite">
      <article className="rounded-3xl border border-default bg-surface p-5 md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="flex items-center gap-2 text-sm font-bold text-indigo-700"><SparklesIcon width="18" height="18"/>Giocata pronta</p><h2 className="mt-1 text-2xl font-black text-primary">{game.name} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'}</h2><p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO)} · {formatDrawTime(play.drawDateISO)}</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={speakPlay} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><VolumeIcon width="17" height="17"/>Ascolta</button><button type="button" onClick={copyPlay} className="flex min-h-11 items-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><CopyIcon width="17" height="17"/>Copia</button></div>
        </div>

        <div className="mt-6 space-y-3">
          {shownColumns.map((column, index) => <div key={column.id} className="rounded-2xl bg-muted p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-secondary">Colonna {index + 1}</p><span className="text-xs font-bold text-secondary">{game.extra.label} {column.extra}</span></div><div className="mt-3 flex flex-wrap items-center gap-2">{column.numbers.map(number => <NumberBall key={number}>{number}</NumberBall>)}<span aria-hidden="true" className="mx-1 h-8 w-px bg-slate-300"/><NumberBall extra>{column.extra}</NumberBall></div></div>)}
        </div>

        {play.columns.length > 3 && <button type="button" onClick={() => setExpanded(value => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-default text-sm font-black text-primary hover:bg-muted" aria-expanded={expanded}>{expanded ? 'Mostra meno colonne' : `Mostra le altre ${hiddenCount} colonne`}<ChevronDownIcon className={expanded ? 'rotate-180' : ''} width="18" height="18"/></button>}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Numeri diversi utilizzati" value={`${quality.uniqueNumbers || 0} su ${game.numberMax}`} detail={`${Math.round((quality.coverageRatio || 0) * 100)}% del range del gioco.`}/>
          <Metric label="Numeri ripetuti tra colonne" value={Number(quality.averageOverlap || 0) < 1 ? 'Bassa' : Number(quality.averageOverlap || 0) < 2 ? 'Moderata' : 'Alta'} detail={`Media tecnica: ${Number(quality.averageOverlap || 0).toFixed(1)}.`}/>
          <Metric label="Combinazioni valutate" value={Number(play.metadata?.candidatesAnalyzed || 0).toLocaleString('it-IT')} detail="Candidati esaminati durante la costruzione."/>
        </div>

        <details className="mt-5 rounded-xl border border-default p-4"><summary className="cursor-pointer text-sm font-bold text-primary">Come è stata costruita</summary><p className="mt-3 text-sm leading-6 text-secondary">Primy parte dal casuale uniforme, confronta più modelli storici con una baseline equivalente e usa soltanto quelli che superano una validazione fuori campione. Poi coordina la copertura tra le colonne. Queste metriche descrivono la distribuzione, non una garanzia di vincita.</p><p className="mt-2 text-sm font-bold text-primary">Dati storici: {history?.used ? 'inclusi dopo la validazione' : 'non inclusi in questa elaborazione'}.</p></details>

        <div className="mt-6 rounded-2xl bg-muted p-4"><p className="text-sm font-bold text-primary">Primy non acquista la schedina.</p><p className="mt-1 text-sm leading-6 text-secondary">Usa “Ho giocato questa schedina” soltanto dopo averla acquistata tramite un canale autorizzato.</p></div>

        {confirmPurchase ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="group" aria-labelledby="confirm-purchase-title"><h3 id="confirm-purchase-title" className="text-lg font-black text-emerald-950">Hai acquistato questa schedina?</h3><p className="mt-2 text-sm leading-6 text-emerald-900">{game.name} · {play.columns.length} {play.columns.length === 1 ? 'colonna' : 'colonne'} · {euro.format(playCost(play))}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setConfirmPurchase(false)} className="min-h-12 rounded-xl border border-emerald-300 bg-white px-5 text-sm font-black text-emerald-900 hover:bg-emerald-100">No, torna indietro</button><button type="button" onClick={() => { setConfirmPurchase(false); onPurchase(); }} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>Sì, registra</button></div></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setConfirmPurchase(true)} className="min-h-12 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"><CheckIcon className="mr-2 inline" width="18" height="18"/>Ho giocato questa schedina · {euro.format(playCost(play))}</button><button type="button" onClick={onSaveDraft} className="min-h-12 rounded-xl border border-default bg-surface px-5 text-sm font-black text-primary hover:bg-muted">Salva come bozza</button></div>}
        <div className="mt-3 flex flex-wrap justify-center gap-2"><button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Genera di nuovo</button><button type="button" onClick={onDiscard} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Scarta anteprima</button></div>
      </article>

      {play.columns.length > 1 && <DistributionMap play={play} game={game}/>} 
    </section>
  );
}
