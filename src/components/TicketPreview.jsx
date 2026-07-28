import React, { useEffect, useState } from 'react';
import { formatDrawDate, formatDrawTime } from '../utils/drawSchedule.js';
import { playCost } from '../utils/playModel.js';
import { NumberBall } from './TicketUI.jsx';
import DistributionMap from './DistributionMap.jsx';
import { CheckIcon, ChevronDownIcon, CopyIcon, SparklesIcon, VolumeIcon } from './Icons.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-primy-100 bg-primy-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
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
      <section className="primy-card-enter grid min-h-[320px] items-center gap-5 rounded-[2rem] border border-dashed border-primy-200 bg-gradient-to-br from-ivory via-white to-primy-50 p-6 text-center sm:grid-cols-[1fr_230px] sm:text-left">
        <div><p className="text-sm font-bold text-primy-700">Vista previa</p><h2 className="mt-2 text-2xl font-semibold text-primary">La jugada aparecerá aquí</h2><p className="mt-3 text-sm leading-7 text-secondary">Ajusta el número de columnas y pulsa Generar. Primy te mostrará el boleto antes de guardarlo.</p></div>
        <PrimyMascotGraphic variant="helper" size="dashboard" compact showCaption={false} className="mx-auto w-full max-w-[230px]"/>
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
      <section className="primy-card-enter grid min-h-[380px] items-center gap-6 rounded-[2rem] border border-primy-200 bg-gradient-to-br from-amber-50 via-ivory to-primy-50 p-7 text-center sm:grid-cols-[1fr_280px] sm:text-left">
        <div><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primy-700 text-white"><CheckIcon width="26" height="26"/></span><h2 className="mt-4 text-2xl font-semibold text-primy-950">{saveState === 'purchased' ? 'Jugada registrada' : 'Borrador guardado'}</h2><p className="mt-2 max-w-md text-sm leading-6 text-primy-900">{saveState === 'purchased' ? 'Primy te avisará cuando esté lista para comprobarla.' : 'La encontrarás en la sección Mis jugadas.'}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onOpenPlays} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Ir a mis jugadas</button><button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl border border-primy-300 bg-surface px-5 text-sm font-semibold text-primy-800 hover:bg-primy-100">Crear otra</button></div></div>
        <PrimyMascotGraphic variant="celebration" size="dashboard" showCaption={false} className="mx-auto w-full max-w-[280px]"/>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <article className="primy-ticket primy-card-enter rounded-[2rem] p-5 md:p-7">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primy-700"><SparklesIcon width="18" height="18"/>Jugada lista</p>
          <h2 className="mt-1 text-2xl font-semibold text-primary">{game.name}</h2>
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
            <div key={column.id} className="rounded-2xl border border-primy-100 bg-surface/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Columna {index + 1}</p>
                {!receiptScopedExtra && <span className="text-xs font-semibold text-secondary">{game.extra.label} {column.extra}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {column.numbers.map(number => <NumberBall key={number}>{number}</NumberBall>)}
                {!receiptScopedExtra && <><span aria-hidden="true" className="mx-1 h-8 w-px bg-slate-300"/><NumberBall extra>{column.extra}</NumberBall></>}
              </div>
            </div>
          ))}
        </div>

        {play.columns.length > 3 && (
          <button type="button" onClick={() => setExpanded(value => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primy-200 text-sm font-semibold text-primary hover:bg-primy-50" aria-expanded={expanded}>
            {expanded ? 'Mostrar menos columnas' : `Mostrar las otras ${hiddenCount} columnas`}
            <ChevronDownIcon className={expanded ? 'rotate-180' : ''} width="18" height="18"/>
          </button>
        )}

        {confirmPurchase ? (
          <div className="mt-6 rounded-2xl border border-primy-200 bg-primy-50 p-5" role="group" aria-labelledby="confirm-purchase-title">
            <h3 id="confirm-purchase-title" className="text-lg font-semibold text-primy-950">¿Has comprado este boleto?</h3>
            <p className="mt-2 text-sm leading-6 text-primy-900">{game.name} · {play.columns.length} {play.columns.length === 1 ? 'columna' : 'columnas'} · {euro.format(playCost(play))}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setConfirmPurchase(false)} className="min-h-12 rounded-xl border border-primy-300 bg-surface px-5 text-sm font-semibold text-primy-900 hover:bg-primy-100">No, volver atrás</button>
              <button type="button" onClick={() => { setConfirmPurchase(false); onPurchase(); }} className="min-h-12 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>Sí, registrar</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setConfirmPurchase(true)} className="min-h-12 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800"><CheckIcon className="mr-2 inline" width="18" height="18"/>He jugado · {euro.format(playCost(play))}</button>
            <button type="button" onClick={onSaveDraft} className="min-h-12 rounded-xl border border-primy-200 bg-surface px-5 text-sm font-semibold text-primary hover:bg-primy-50">Guardar como borrador</button>
          </div>
        )}

        <p className="mt-3 text-center text-xs leading-5 text-secondary">Primy no compra el boleto. Registra la jugada solo después de adquirirlo en un canal autorizado.</p>

        <details className="mt-6 rounded-2xl border border-default">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-primary">
            <span>Herramientas y detalles técnicos</span>
            <span className="text-xs font-semibold text-primy-700">Opcionales</span>
          </summary>
          <div className="space-y-5 border-t border-default p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={copyPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primy-200 px-4 text-sm font-semibold text-primary hover:bg-primy-50"><CopyIcon width="17" height="17"/>Copiar números</button>
              <button type="button" onClick={speakPlay} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primy-200 px-4 text-sm font-semibold text-primary hover:bg-primy-50"><VolumeIcon width="17" height="17"/>Escuchar números</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Números distintos" value={`${quality.uniqueNumbers || 0} de ${game.numberPoolMax}`} detail={`${Math.round((quality.coverageRatio || 0) * 100)}% del intervalo.`}/>
              <Metric label="Repetición" value={Number(quality.averageOverlap || 0) < 1 ? 'Baja' : Number(quality.averageOverlap || 0) < 2 ? 'Moderata' : 'Alta'} detail={`Media: ${Number(quality.averageOverlap || 0).toFixed(1)}.`}/>
              <Metric label="Combinaciones evaluadas" value={Number(play.metadata?.candidatesAnalyzed || 0).toLocaleString('es-ES')} detail="Candidatas examinadas."/>
            </div>

            <div className="rounded-2xl border border-primy-100 bg-primy-50 p-4">
              <p className="text-sm font-semibold text-primary">Cómo se ha construido</p>
              <p className="mt-2 text-sm leading-6 text-secondary">Primy compara varios modelos con una referencia equivalente y coordina la cobertura entre las columnas. Estas métricas describen la distribución, pero no garantizan un premio.</p>
              <p className="mt-2 text-sm font-semibold text-primary">Datos históricos: {history?.used ? 'incluidos tras la validación' : 'no incluidos en este cálculo'}.</p>
            </div>

            {play.columns.length > 1 && <DistributionMap play={play} game={game}/>} 
          </div>
        </details>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRegenerate} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-primy-700 hover:bg-primy-50">Generar de nuevo</button>
          <button type="button" onClick={onDiscard} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">Descartar</button>
        </div>
      </article>
    </section>
  );
}
