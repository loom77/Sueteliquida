import React, { useEffect, useState } from 'react';
import { formatDrawDate, formatDrawTime } from '../utils/drawSchedule.js';
import { playCost } from '../utils/playModel.js';
import { NumberBall } from './TicketUI.jsx';
import DistributionMap from './DistributionMap.jsx';
import { CheckIcon, ChevronDownIcon, CopyIcon, SparklesIcon, TicketIcon, VolumeIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

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
        <h2 className="mt-4 text-xl font-black text-primary">La jugada aparecerá aquí</h2>
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
    const columnsText = play.columns.map((column, index) => `Columna ${index + 1}: ${column.numbers.join(' ')}${receiptScopedExtra ? '' : ` · ${game.extra.label} ${column.extra}`}`).join('\n');
    const text = `${game.name} — ${formatDrawDate(play.drawDateISO)}${extraLine}\n${columnsText}`;
    try {
      await navigator.clipboard.writeText(text);
      onToast?.('Columnas copiadas al portapapeles.');
    } catch {
      onToast?.('El navegador no ha permitido la copia automática.');
    }
  };

  const speakPlay = () => {
    if (!('speechSynthesis' in window)) return onToast?.('La lectura en voz alta no está disponible en este navegador.');
    window.speechSynthesis.cancel();
    const sharedExtraText = receiptScopedExtra ? `Reintegro del resguardo: ${receiptExtra}. ` : '';
    const text = `${game.name}. ${sharedExtraText}${play.columns.map((column, index) => `Columna ${index + 1}: ${column.numbers.join(', ')}.${receiptScopedExtra ? '' : ` ${game.extra.label}: ${column.extra}.`}`).join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  if (saveState !== 'unsaved') {
    return (
      <section className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white"><CheckIcon width="26" height="26"/></span>
        <h2 className="mt-4 text-xl font-black text-emerald-950">{saveState === 'purchased' ? 'Jugada registrada' : 'Borrador guardado'}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-emerald-900">{saveState === 'purchased' ? 'Primy te avisará cuando esté lista para comprobarla.' : 'La encontrarás en la sección Mis jugadas.'}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onOpenPlays} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800">Ir a mis jugadas</button>
          <button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl border border-emerald-300 bg-surface px-5 text-sm font-black text-emerald-800 hover:bg-emerald-100">Crear otra</button>
        </div>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <article className="rounded-3xl border border-default bg-surface p-5 md:p-7">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-indigo-700"><SparklesIcon width="18" height="18"/>Jugada lista</p>
          <h2 className="mt-1 text-2xl font-black text-primary">{game.name}</h2>
          <p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO)} · {formatDrawTime(play.drawDateTimeISO || play.drawDateISO)} · {play.columns.length} {play.columns.length === 1 ? 'columna' : 'columnas'}</p>
        </div>

        {receiptScopedExtra && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Reintegro del resguardo</p>
              <p className="mt-1 text-sm leading-6 text-amber-950">Es único y se aplica a todas las columnas de este boleto.</p>
            </div>
            <NumberBall extra>{receiptExtra}</NumberBall>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {shownColumns.map((column, index) => (
            <div key={column.id} className="rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Columna {index + 1}</p>
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
            {expanded ? 'Mostrar menos columnas' : `Mostrar las otras ${hiddenCount} columnas`}
            <ChevronDownIcon className={expanded ? 'rotate-180' : ''} width="18" height="18"/>
          </button>
        )}

        {confirmPurchase ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="group" aria-labelledby="confirm-purchase-title">
            <h3 id="confirm-purchase-title" className="text-lg font-black text-emerald-950">¿Has comprado este boleto?</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-900">{game.name} · {play.columns.length} {play.columns.length === 1 ? 'columna' : 'columnas'} · {euro.format(playCost(play))}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setConfirmPurchase(false)} className="min-h-12 rounded-xl border border-emerald-300 bg-white px-5 text-sm font-black text-emerald-900 hover:bg-emerald-100">No, volver atrás</button>
              <button type="button" onClick={() => { setConfirmPurchase(false); onPurchase(); }} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>Sí, registrar</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setConfirmPurchase(true)} className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-black text-white hover:bg-emerald-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>He jugado · {euro.format(playCost(play))}</button>
            <button type="button" onClick={onSaveDraft} className="min-h-12 rounded-xl border border-default bg-surface px-5 text-sm font-black text-primary hover:bg-muted">Guardar como borrador</button>
          </div>
        )}

        <p className="mt-3 text-center text-xs leading-5 text-secondary">Primy no compra el boleto. Registra la jugada solo después de adquirirlo en un canal autorizado.</p>

        <details className="mt-6 rounded-2xl border border-default">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-primary">
            <span>Herramientas y detalles técnicos</span>
            <span className="text-xs font-bold text-indigo-700">Opcionales</span>
          </summary>
          <div className="space-y-5 border-t border-default p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={copyPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><CopyIcon width="17" height="17"/>Copiar números</button>
              <button type="button" onClick={speakPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-black text-primary hover:bg-muted"><VolumeIcon width="17" height="17"/>Escuchar números</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Números distintos" value={`${quality.uniqueNumbers || 0} de ${game.numberPoolMax}`} detail={`${Math.round((quality.coverageRatio || 0) * 100)}% del intervalo.`}/>
              <Metric label="Repetición" value={Number(quality.averageOverlap || 0) < 1 ? 'Baja' : Number(quality.averageOverlap || 0) < 2 ? 'Moderata' : 'Alta'} detail={`Media: ${Number(quality.averageOverlap || 0).toFixed(1)}.`}/>
              <Metric label="Combinaciones evaluadas" value={Number(play.metadata?.candidatesAnalyzed || 0).toLocaleString('es-ES')} detail="Candidatas examinadas."/>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm font-black text-primary">Cómo se ha construido</p>
              <p className="mt-2 text-sm leading-6 text-secondary">Primy compara varios modelos con una referencia equivalente y coordina la cobertura entre las columnas. Estas métricas describen la distribución, pero no garantizan un premio.</p>
              <p className="mt-2 text-sm font-bold text-primary">Datos históricos: {history?.used ? 'incluidos tras la validación' : 'no incluidos en este cálculo'}.</p>
            </div>

            {play.columns.length > 1 && <DistributionMap play={play} game={game}/>} 
          </div>
        </details>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">Generar de nuevo</button>
          <button type="button" onClick={onDiscard} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Descartar</button>
        </div>
      </article>
    </section>
  );
}
