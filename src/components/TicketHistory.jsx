import React, { useMemo, useState } from 'react';
import { formatDrawDate } from '../utils/drawSchedule.js';
import { getMonthlyFinance } from '../utils/financeIntegrity.js';
import { GAMES, getGameConfig } from '../utils/gameConfig.js';
import { isConfirmedColumnPrize, isConfirmedReceiptPrize, playBetCount, playCost, playKnownPrize } from '../utils/playModel.js';
import { getPlayDeleteDescription } from '../utils/playDeletion.js';
import { NumberBall, TicketStatus } from './TicketUI.jsx';
import { ChevronDownIcon, CopyIcon, RefreshIcon, RepeatIcon, SearchIcon, StarIcon, TrashIcon } from './Icons.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import GameIdentity from './GameIdentity.jsx';
import { gameThemeStyle } from '../utils/gameVisualTheme.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import { HorseVerificationReveal, SportsVerificationReveal } from './VerificationReveal.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const priority = { awaiting_check: 0, scheduled: 1, draft: 2, checked: 3 };

function hasStoredUnconfirmedPrize(play) {
  const columnAmount = (play?.columns || []).some(column => (
    Number(column?.officialPrize) > 0 && !isConfirmedColumnPrize(column)
  ));
  const receiptAmount = Number(play?.receiptPrize?.officialAmount) > 0
    && !isConfirmedReceiptPrize(play?.receiptPrize);
  return columnAmount || receiptAmount;
}

function confirmedAwardCount(play) {
  return (play?.columns || []).filter(isConfirmedColumnPrize).length
    + (isConfirmedReceiptPrize(play?.receiptPrize) ? 1 : 0);
}

function CheckNowButton({ play, onCheckPlay, checkingPlayId, checkingGame, compact = false, className = '' }) {
  if (play.computedStatus !== 'awaiting_check' || typeof onCheckPlay !== 'function') return null;
  const checking = String(checkingPlayId || '') === String(play.id);
  const otherCheckRunning = Boolean(checkingGame || (checkingPlayId && !checking));
  return (
    <button
      type="button"
      onClick={() => onCheckPlay(play)}
      disabled={checking || otherCheckRunning}
      className={`${compact ? 'primy-check-play-button primy-check-play-button--compact' : 'primy-check-play-button'} ${className}`.trim()}
      aria-label={`Comprobar ahora la jugada de ${getGameConfig(play.gameId).name}`}
    >
      <RefreshIcon width={compact ? 16 : 18} height={compact ? 16 : 18} className={checking ? 'animate-spin' : ''}/>
      <span>{checking ? 'Comprobando…' : 'Comprobar ahora'}</span>
    </button>
  );
}

function ResultSummary({ play }) {
  if (play.computedStatus !== 'checked') return null;
  const aggregateBreakdown = play.betType === 'multiple' ? play.columns?.[0]?.breakdown : null;
  const columnAwards = aggregateBreakdown
    ? Object.values(aggregateBreakdown).reduce((sum, count) => sum + Number(count || 0), 0)
    : play.columns.filter(column => column.prizeCategory).length;
  const receiptAward = play.receiptPrize?.category ? 1 : 0;
  const awarded = columnAwards + receiptAward;
  const knownPrize = playKnownPrize(play);
  const pending = play.columns.some(column => String(column.payoutType || '').startsWith('pending-official'))
    || String(play.receiptPrize?.payoutType || '').startsWith('pending-official');
  const confirmed = knownPrize > 0;
  const unconfirmedStoredAmount = hasStoredUnconfirmedPrize(play);
  const tone = confirmed ? 'is-confirmed' : (unconfirmedStoredAmount || awarded > 0) ? 'is-pending' : 'is-empty';
  const eyebrow = confirmed
    ? 'Premio confirmado'
    : unconfirmedStoredAmount
      ? 'Importe no confirmado'
      : awarded > 0
        ? 'Categoría pendiente de importe'
        : 'Resultado comprobado';
  const title = confirmed
    ? euro.format(knownPrize)
    : unconfirmedStoredAmount
      ? 'Revisión necesaria'
      : awarded > 0
        ? `${awarded} ${awarded === 1 ? 'resultado con categoría' : 'resultados con categoría'}`
        : 'Sin premio';
  const description = confirmed
    ? 'Importe total del resguardo calculado con el escrutinio oficial archivado.'
    : unconfirmedStoredAmount
      ? 'Primy ha detectado un importe guardado por una versión anterior sin fuente verificable. No se incluye en el total de premios.'
      : pending
        ? 'La coincidencia o categoría está confirmada, pero el importe oficial todavía no está disponible.'
        : 'La jugada se ha comparado con el resultado oficial guardado y no alcanza una categoría premiada.';
  return (
    <section className={`primy-result-summary ${tone}`} aria-label="Resumen del resultado">
      <div>
        <p className="primy-result-summary__eyebrow">{eyebrow}</p>
        <p className="primy-result-summary__title">{title}</p>
        <p className="primy-result-summary__description">{description}</p>
      </div>
      {confirmed && <span className="primy-result-summary__seal" aria-label="Importe confirmado">✓</span>}
      {!confirmed && pending && <span className="primy-result-summary__pending">Importe pendiente</span>}
    </section>
  );
}


function OfficialDrawComparison({ play, game }) {
  if (play.computedStatus !== 'checked') return null;
  const officialMain = (play.result?.winningNumbers || []).map(Number).filter(Number.isFinite);
  const officialSecondary = (play.result?.secondaryNumbers || []).map(Number).filter(Number.isFinite);
  const officialExtra = play.result?.extra;
  const officialComplementary = play.result?.complementary;
  if (!officialMain.length && !officialSecondary.length && officialExtra == null && officialComplementary == null) return null;

  const playedMain = new Set((play.columns || []).flatMap(column => column.numbers || []).map(Number));
  const playedSecondary = new Set((play.columns || []).flatMap(column => column.secondaryNumbers || []).map(Number));
  const playedExtras = new Set([
    play.receiptExtra,
    ...(play.columns || []).map(column => column.extra),
  ].filter(value => value !== null && value !== undefined && value !== '').map(Number));

  const mainMatches = officialMain.filter(number => playedMain.has(number)).length;
  const secondaryMatches = officialSecondary.filter(number => playedSecondary.has(number)).length;
  const complementaryMatch = officialComplementary != null && playedMain.has(Number(officialComplementary)) ? 1 : 0;
  const extraMatch = officialExtra != null && playedExtras.has(Number(officialExtra)) ? 1 : 0;
  const visibleMatches = mainMatches + secondaryMatches + complementaryMatch + extraMatch;

  return (
    <section className="primy-official-result" aria-label="Comparación con el resultado oficial">
      <div className="primy-official-result__header">
        <div>
          <p className="primy-official-result__eyebrow">Resultado oficial</p>
          <h4>Números extraídos y coincidencias</h4>
          <p>Los círculos iluminados con ✓ aparecen también en tu jugada.</p>
        </div>
        <span className="primy-official-result__count" data-zero={visibleMatches === 0 ? 'true' : 'false'}>
          <strong>{visibleMatches}</strong>
          <span>{visibleMatches === 1 ? 'coincidencia' : 'coincidencias'}</span>
        </span>
      </div>

      {officialMain.length > 0 && (
        <div className="primy-official-result__group">
          <span className="primy-official-result__label">Combinación</span>
          <div className="primy-official-result__balls">
            {officialMain.map(number => <NumberBall key={`official-main-${number}`} compact winning hit={playedMain.has(number)}>{number}</NumberBall>)}
          </div>
        </div>
      )}

      <div className="primy-official-result__extras">
        {officialSecondary.length > 0 && (
          <div className="primy-official-result__group">
            <span className="primy-official-result__label">{game.secondary?.label || 'Números adicionales'}</span>
            <div className="primy-official-result__balls">
              {officialSecondary.map(number => <NumberBall key={`official-secondary-${number}`} compact extra winning hit={playedSecondary.has(number)}>{number}</NumberBall>)}
            </div>
          </div>
        )}
        {officialComplementary != null && (
          <div className="primy-official-result__group">
            <span className="primy-official-result__label">Complementario</span>
            <div className="primy-official-result__balls"><NumberBall compact extra winning hit={playedMain.has(Number(officialComplementary))}>{officialComplementary}</NumberBall></div>
          </div>
        )}
        {officialExtra != null && (
          <div className="primy-official-result__group">
            <span className="primy-official-result__label">{game.extra?.label || 'Extra'}</span>
            <div className="primy-official-result__balls"><NumberBall compact extra winning hit={playedExtras.has(Number(officialExtra))}>{officialExtra}</NumberBall></div>
          </div>
        )}
      </div>

      <div className="primy-official-result__legend"><span aria-hidden="true">✓</span> Coincide con uno de los números de tu boleto</div>
    </section>
  );
}

function NationalPlayDetails({ play, onPurchase, onRequestRemove, onSetPrize, onFavorite, onRepeat, onCheckPlay, checkingPlayId, checkingGame }) {
  const [series, setSeries] = useState('');
  const [fraction, setFraction] = useState('');
  const number = play.nationalNumber || play.columns?.[0]?.number || '00000';
  const column = play.columns?.[0] || {};
  const needsPurchaseData = !play.purchased;
  return (
    <div className="p-4 md:p-6">
      <div className="national-archive-ticket">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-800">Lotería Nacional</p>
          <h3 className="mt-2 font-display text-4xl font-semibold tracking-[.16em] text-primary">{number}</h3>
          <p className="mt-3 text-sm font-semibold text-primary">{play.drawName || 'Sorteo de Lotería Nacional'}</p>
          <p className="mt-1 text-sm text-secondary">{formatDrawDate(play.drawDateISO)} · {play.ticketQuantity || 1} décimo(s) · {euro.format(playCost(play))}</p>
        </div>
        <TicketStatus status={play.computedStatus}/>
      </div>

      <ResultSummary play={play}/>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="national-ticket-data"><span>Serie</span><strong>{play.series ?? 'No indicada'}</strong></div>
        <div className="national-ticket-data"><span>Fracción</span><strong>{play.fraction ?? 'No indicada'}</strong></div>
        <div className="national-ticket-data"><span>Precio por décimo</span><strong>{euro.format(play.pricePerDecimo || 0)}</strong></div>
      </div>

      {column.status === 'checked' && (
        <div className={`mt-5 rounded-2xl border p-4 ${column.prizeCategory ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
          <p className="font-semibold text-primary">{column.prizeCategory || 'Sin premio confirmado'}</p>
          <p className="mt-1 text-sm text-secondary">{column.prizeDisplay}</p>
          {isConfirmedColumnPrize(column) && <p className="mt-2 text-xl font-bold text-emerald-800">{euro.format(column.officialPrize)}</p>}
          {Number(column.officialPrize) > 0 && !isConfirmedColumnPrize(column) && <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">Importe heredado no confirmado. No se suma a tus premios.</p>}
          {column.prizeCategory && column.officialPrize == null && <label className="mt-3 block text-sm font-bold text-primary">Premio oficial (€)<input type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal" onBlur={event => event.target.value && onSetPrize(play.id, column.id, event.target.value)}/></label>}
          {column.specialVerificationPending && <p className="mt-3 text-sm font-semibold text-amber-900">No se puede confirmar el Premio Especial sin serie y fracción.</p>}
        </div>
      )}

      {needsPurchaseData && (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="font-semibold text-primary">Registrar como comprado</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-primary">Serie opcional<input value={series} onChange={event => setSeries(event.target.value.replace(/\D/g, '').slice(0,4))} className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-surface px-3 font-normal"/></label><label className="text-sm font-semibold text-primary">Fracción opcional<input value={fraction} onChange={event => setFraction(event.target.value.replace(/\D/g, '').slice(0,3))} className="mt-2 min-h-11 w-full rounded-xl border border-blue-200 bg-surface px-3 font-normal"/></label></div>
          <button type="button" onClick={() => onPurchase(play.id, { series: series ? Number(series) : null, fraction: fraction ? Number(fraction) : null })} className="primy-national-action mt-4 min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-white">Registrar décimo comprado</button>
        </div>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => onFavorite(play.id)} className="primy-button primy-button-secondary"><StarIcon width="17" height="17"/>{play.favorite ? 'Quitar favorito' : 'Favorito'}</button>
        <button type="button" onClick={() => onRepeat(play)} className="primy-button primy-button-secondary"><CopyIcon width="17" height="17"/>Repetir número</button>
        <button type="button" onClick={() => onRequestRemove(play)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17" className="mr-2 inline"/>Eliminar</button>
      </div>
    </div>
  );
}


function QuinielaPlayDetails({ play, onPurchase, onRequestRemove, onFavorite, onCheckPlay, checkingPlayId, checkingGame }) {
  const column = play.columns?.[0] || { signs: [], pleno: {} };
  const matches = play.matches || [];
  const regularMatches = matches.filter(match => match.predictionType === 'one-x-two');
  const plenoMatch = matches.find(match => match.predictionType === 'pleno15') || matches.find(match => match.position === 15);
  const officialSigns = column.verificationDetails?.officialSigns || [];
  const officialPleno = column.verificationDetails?.officialPleno || {};
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800">La Quiniela</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'} · {formatDrawDate(play.drawDateISO)}</h3>
          <p className="mt-1 text-sm text-secondary">Una apuesta simple · Coste {euro.format(playCost(play))}</p>
        </div>
        <TicketStatus status={play.computedStatus}/>
      </div>

      <ResultSummary play={play}/>
      <SportsVerificationReveal play={play}/>

      <div className="grid gap-2 xl:grid-cols-2">
        {regularMatches.map(match => {
          const signIndex = match.position - 1;
          const checked = play.computedStatus === 'checked';
          const hit = checked && column.signs?.[signIndex] === officialSigns[signIndex];
          return (
            <div key={match.matchId} className={`grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-xl border px-3 py-2.5 ${hit ? 'border-emerald-300 bg-emerald-50' : 'border-default bg-muted'}`}>
              <span className="text-xs font-bold text-secondary">{match.position}</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{match.homeTeam}</p><p className="truncate text-xs text-secondary">{match.awayTeam}</p>{checked && <p className="mt-1 text-[11px] font-bold text-secondary">Resultado: {officialSigns[signIndex] || '—'}</p>}</div>
              <span className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold text-white ${hit ? 'bg-emerald-700 ring-4 ring-amber-300' : 'bg-sky-800'}`}>{column.signs?.[signIndex]}{hit && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-[9px] text-amber-950">✓</span>}</span>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${column.extraMatch ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Pleno al 15 · marcador 0/1/2/M</p>
        <p className="mt-2 font-semibold text-primary">{plenoMatch?.homeTeam} {column.pleno?.home} – {column.pleno?.away} {plenoMatch?.awayTeam}</p>
        {play.computedStatus === 'checked' && <p className="mt-1 text-xs font-bold text-secondary">Resultado oficial: {officialPleno.home || '—'} – {officialPleno.away || '—'} {column.extraMatch ? '· Coincide ✓' : ''}</p>}
      </div>

      {!play.purchased ? (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="font-semibold text-primary">Registrar boleto comprado</p>
          <p className="mt-1 text-sm leading-6 text-secondary">Después del cierre de la jornada, Primy aplicará automáticamente la verificación unificada.</p>
          <button type="button" onClick={() => onPurchase(play.id)} className="mt-4 min-h-11 w-full rounded-xl bg-sky-800 px-4 text-sm font-bold text-white">Registrar como comprado</button>
        </div>
      ) : (
        <div className="mt-5"><CheckNowButton play={play} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/></div>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onFavorite(play.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted"><StarIcon width="17" height="17" className={play.favorite ? 'fill-amber-400 text-amber-500' : ''}/>{play.favorite ? 'Quitar favorito' : 'Favorito'}</button>
        <button type="button" onClick={() => onRequestRemove(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>
      </div>
    </div>
  );
}


function QuinigolPlayDetails({ play, onPurchase, onRequestRemove, onFavorite, onCheckPlay, checkingPlayId, checkingGame }) {
  const column = play.columns?.[0] || { outcomes: [] };
  const matches = play.matches || [];
  const officialOutcomes = column.verificationDetails?.officialOutcomes || [];
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-800">El Quinigol</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'} · {formatDrawDate(play.drawDateISO)}</h3>
          <p className="mt-1 text-sm text-secondary">Una apuesta simple · Coste {euro.format(playCost(play))}</p>
        </div>
        <TicketStatus status={play.computedStatus}/>
      </div>

      <ResultSummary play={play}/>
      <SportsVerificationReveal play={play}/>

      <div className="grid gap-2 xl:grid-cols-2">
        {matches.map((match, index) => {
          const checked = play.computedStatus === 'checked';
          const hit = checked && column.outcomes?.[index] === officialOutcomes[index];
          return (
            <div key={match.matchId} className={`grid grid-cols-[2rem_minmax(0,1fr)_4rem] items-center gap-3 rounded-xl border px-3 py-2.5 ${hit ? 'border-emerald-300 bg-emerald-50' : 'border-default bg-muted'}`}>
              <span className="text-xs font-bold text-secondary">{index + 1}</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{match.homeTeam}</p><p className="truncate text-xs text-secondary">{match.awayTeam}</p>{checked && <p className="mt-1 text-[11px] font-bold text-secondary">Resultado: {officialOutcomes[index] || '—'}</p>}</div>
              <span className={`relative flex h-10 min-w-14 items-center justify-center rounded-xl px-2 text-sm font-extrabold text-white ${hit ? 'bg-emerald-700 ring-4 ring-amber-300' : 'bg-orange-600'}`}>{column.outcomes?.[index] || '—'}{hit && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-[9px] text-amber-950">✓</span>}</span>
            </div>
          );
        })}
      </div>

      {!play.purchased ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-primary">Registrar boleto comprado</p>
          <p className="mt-1 text-sm leading-6 text-secondary">Después de la jornada, Primy aplicará la verificación unificada a los seis marcadores.</p>
          <button type="button" onClick={() => onPurchase(play.id)} className="mt-4 min-h-11 w-full rounded-xl bg-orange-600 px-4 text-sm font-bold text-white">Registrar como comprado</button>
        </div>
      ) : (
        <div className="mt-5"><CheckNowButton play={play} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/></div>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onFavorite(play.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted"><StarIcon width="17" height="17" className={play.favorite ? 'fill-amber-400 text-amber-500' : ''}/>{play.favorite ? 'Quitar favorito' : 'Favorito'}</button>
        <button type="button" onClick={() => onRequestRemove(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>
      </div>
    </div>
  );
}

function HorsePlayDetails({ play, onPurchase, onRequestRemove, onFavorite, onCheckPlay, checkingPlayId, checkingGame }) {
  const [receiptExtra, setReceiptExtra] = useState('');
  const isLototurf = play.gameId === 'lototurf';
  const selection = play.selection || {};
  const official = play.result?.result || {};
  const winningNumbers = new Set(official.winningNumbers || []);
  return (
    <div className="p-4 md:p-6">
      <div className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isLototurf ? 'border-orange-200 bg-orange-50' : 'border-violet-200 bg-violet-50'}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${isLototurf ? 'text-orange-800' : 'text-violet-800'}`}>{isLototurf ? 'Lototurf' : 'Quíntuple Plus'}</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{play.officialRoundNumber ? `Jornada ${play.officialRoundNumber}` : 'Jornada oficial'} · {formatDrawDate(play.drawDateISO)}</h3>
          <p className="mt-1 text-sm text-secondary">{play.equivalentBets} {play.equivalentBets === 1 ? 'apuesta equivalente' : 'apuestas equivalentes'} · Coste {euro.format(playCost(play))}</p>
        </div>
        <TicketStatus status={play.computedStatus}/>
      </div>

      <ResultSummary play={play}/>
      <HorseVerificationReveal play={play}/>

      {isLototurf ? (
        <>
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Números</p>
            <div className="mt-3 flex flex-wrap gap-2">{(selection.numbers || []).map(number => <NumberBall key={number} compact hit={play.computedStatus === 'checked' && winningNumbers.has(number)} dimmed={play.computedStatus === 'checked' && !winningNumbers.has(number)}>{number}</NumberBall>)}</div>
          </section>
          <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-800">Caballo ganador · 4.ª carrera</p>
            <p className="mt-1 text-sm text-secondary">{play.races?.[0]?.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">{(selection.horses || []).map(number => {
              const runner = play.races?.[0]?.runners?.find(item => item.number === number);
              const hit = play.computedStatus === 'checked' && Number(number) === Number(official.winningHorse);
              return <span key={number} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-bold ${hit ? 'border-amber-400 text-emerald-900 ring-4 ring-amber-200' : 'border-orange-200 text-orange-950'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">{number}</span>{runner?.name || `Dorsal ${number}`}{hit ? ' ✓' : ''}</span>;
            })}</div>
          </section>
        </>
      ) : (
        <div className="space-y-3">
          {(selection.rows || []).map((row, index) => {
            const race = play.races?.[Math.min(index, 4)];
            const officialHorse = index < 5 ? official.winners?.[index] : official.secondFifth;
            return <section key={`${race?.raceId || index}-${index}`} className="rounded-2xl border border-violet-200 bg-violet-50/65 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-800">{index < 5 ? `Ganador · carrera ${index + 1}` : 'Segundo · carrera 5'}</p><p className="mt-1 truncate text-sm text-secondary">{race?.name}</p><div className="mt-3 flex flex-wrap gap-2">{row.map(number => { const runner = race?.runners?.find(item => item.number === number); const hit = play.computedStatus === 'checked' && Number(number) === Number(officialHorse); return <span key={number} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-bold ${hit ? 'border-amber-400 text-emerald-900 ring-4 ring-amber-200' : 'border-violet-200 text-violet-950'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">{number}</span>{runner?.name || `Dorsal ${number}`}{hit ? ' ✓' : ''}</span>; })}</div>{play.computedStatus === 'checked' && <p className="mt-2 text-xs font-bold text-secondary">Resultado oficial: dorsal {officialHorse ?? '—'}</p>}</section>;
          })}
        </div>
      )}

      {!play.purchased ? (
        <div className={`mt-5 rounded-2xl border p-4 ${isLototurf ? 'border-orange-200 bg-orange-50' : 'border-violet-200 bg-violet-50'}`}>
          <p className="font-semibold text-primary">Registrar boleto comprado</p>
          {isLototurf && <label className="mt-3 block text-sm font-semibold text-primary">Reintegro del resguardo<input value={receiptExtra} onChange={event => setReceiptExtra(event.target.value.replace(/\D/g, '').slice(0, 1))} inputMode="numeric" placeholder="0–9" className="mt-2 min-h-11 w-full rounded-xl border border-orange-200 bg-white px-3 font-normal"/></label>}
          <button type="button" disabled={isLototurf && !/^[0-9]$/.test(receiptExtra)} onClick={() => onPurchase(play.id, isLototurf ? { receiptExtra: Number(receiptExtra) } : {})} className={`mt-4 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50 ${isLototurf ? 'bg-orange-700' : 'bg-violet-700'}`}>Registrar como comprado</button>
        </div>
      ) : (
        <div className="mt-5"><CheckNowButton play={play} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/></div>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => onFavorite(play.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted"><StarIcon width="17" height="17" className={play.favorite ? 'fill-amber-400 text-amber-500' : ''}/>{play.favorite ? 'Quitar favorito' : 'Favorito'}</button>
        <button type="button" onClick={() => onRequestRemove(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50"><TrashIcon width="17" height="17"/>Eliminar</button>
      </div>
    </div>
  );
}

function PlayDetails({ play, onPurchase, onRequestRemove, onSetPrize, onFavorite, onRepeat, onVariant, onCheckPlay, checkingPlayId, checkingGame }) {
  const [purchaseExtra, setPurchaseExtra] = useState('');
  if (play.gameId === 'loteria-nacional') return <NationalPlayDetails play={play} onPurchase={onPurchase} onRequestRemove={onRequestRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/>;
  if (play.gameId === 'quiniela') return <QuinielaPlayDetails play={play} onPurchase={onPurchase} onRequestRemove={onRequestRemove} onFavorite={onFavorite} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/>;
  if (play.gameId === 'quinigol') return <QuinigolPlayDetails play={play} onPurchase={onPurchase} onRequestRemove={onRequestRemove} onFavorite={onFavorite} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/>;
  if (play.gameId === 'lototurf' || play.gameId === 'quintuple-plus') return <HorsePlayDetails play={play} onPurchase={onPurchase} onRequestRemove={onRequestRemove} onFavorite={onFavorite} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/>;
  const game = getGameConfig(play.gameId);
  const winning = new Set(play.result?.winningNumbers || []);
  const receiptScopedExtra = game.extra?.scope === 'receipt';
  const columnScopedExtra = game.extra?.scope === 'column';
  const hasSecondary = Boolean(game.secondary);
  const winningSecondary = new Set(play.result?.secondaryNumbers || []);
  const resultExtra = play.result?.extra;
  const receiptExtra = play.receiptExtra ?? play.columns?.[0]?.extra;
  const receiptExtraPending = game.extra?.assignment === 'official-receipt' && (receiptExtra === null || receiptExtra === undefined || receiptExtra === '' || !Number.isInteger(Number(receiptExtra)));
  const isMultiple = play.betType === 'multiple';
  const betCount = playBetCount(play);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">Detalle de la jugada</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{game.name} · {formatDrawDate(play.drawDateISO)}</h3>
          <p className="mt-1 text-sm text-secondary">{isMultiple ? `Múltiple de ${play.systemSize} números · ${betCount} apuestas` : `${play.columns.length} ${play.columns.length === 1 ? 'columna' : 'columnas'}`} · Coste registrado {euro.format(playCost(play))}</p>
        </div>
        <TicketStatus status={play.computedStatus}/>
      </div>

      <ResultSummary play={play}/>
      <OfficialDrawComparison play={play} game={game}/>

      {receiptScopedExtra && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Reintegro del resguardo</p>
              <p className="mt-1 text-sm text-amber-950">Único para todas las apuestas del resguardo</p>
            </div>
            {receiptExtraPending ? <span className="rounded-full border border-amber-300 bg-surface px-3 py-2 text-sm font-bold text-amber-900">Pendiente</span> : <NumberBall compact extra hit={play.computedStatus === 'checked' && Number(receiptExtra) === Number(resultExtra)} dimmed={play.computedStatus === 'checked' && Number(receiptExtra) !== Number(resultExtra)}>{receiptExtra}</NumberBall>}
          </div>
          {play.receiptPrize && (
            <div className="mt-3 border-t border-amber-200 pt-3 text-sm text-amber-950">
              <p className="font-semibold">{play.receiptPrize.category}</p>
              <p>{play.receiptPrize.displayText}</p>
            </div>
          )}
          {play.metadata?.rulesMigrationWarning && <p className="mt-3 text-sm font-bold leading-6 text-rose-800">{play.metadata.rulesMigrationWarning}</p>}
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-2">
        {play.columns.map((column, index) => {
          const hasPrize = column.status === 'checked' && Boolean(column.prizeCategory);
          return (
            <div key={column.id} className={`primy-archive-column rounded-2xl border p-4 ${hasPrize ? 'border-emerald-200 bg-emerald-50/70' : 'border-default bg-muted'}`} data-matches={column.status === 'checked' && (column.matches || column.secondaryMatches || column.extraMatch) ? 'true' : 'false'}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">{isMultiple ? `Selección múltiple · ${betCount} apuestas` : `Columna ${index + 1}`}</p>
                  {column.status === 'checked' && <p className={`mt-1 text-sm font-semibold ${hasPrize ? 'text-emerald-800' : 'text-secondary'}`}>{column.prizeCategory || 'Sin premio'}</p>}
                </div>
                {column.status === 'checked' && <span className="primy-match-count" data-zero={(column.matches || 0) + (column.secondaryMatches || 0) === 0 ? 'true' : 'false'}><strong>{column.matches || 0}</strong> aciertos{hasSecondary ? ` + ${column.secondaryMatches || 0} ${game.secondary.label.toLocaleLowerCase('es-ES')}` : ''}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {column.numbers.map(number => {
                  const isHit = column.status === 'checked' && winning.has(number);
                  return <NumberBall key={number} compact hit={isHit} dimmed={column.status === 'checked' && !isHit}>{number}</NumberBall>;
                })}
                {(hasSecondary || columnScopedExtra) && <span aria-hidden="true" className="mx-1 h-7 w-px bg-slate-300"/>}
                {hasSecondary && (column.secondaryNumbers || []).map(value => (
                  <NumberBall key={`secondary-${value}`} compact extra hit={column.status === 'checked' && winningSecondary.has(value)} dimmed={column.status === 'checked' && !winningSecondary.has(value)}>{value}</NumberBall>
                ))}
                {hasSecondary && <span className="text-sm font-bold text-secondary">{game.secondary.label}</span>}
                {columnScopedExtra && <NumberBall compact extra hit={column.status === 'checked' && Number(column.extra) === Number(resultExtra)} dimmed={column.status === 'checked' && Number(column.extra) !== Number(resultExtra)}>{column.extra}</NumberBall>}
                {columnScopedExtra && <span className="text-sm font-bold text-secondary">{game.extra.label}</span>}
              </div>
              {column.status === 'checked' && (
                <div className="mt-4 border-t border-default pt-3 text-sm leading-6 text-primary">
                  <p>{column.prizeDisplay}</p>
                  {isConfirmedColumnPrize(column) && <p className="mt-1 font-bold tabular-nums text-emerald-800">Premio confirmado: {euro.format(Number(column.officialPrize) || 0)}</p>}
                  {Number(column.officialPrize) > 0 && !isConfirmedColumnPrize(column) && <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 font-bold text-amber-900">Importe de una versión anterior sin confirmación válida. No se incluye en el total.</p>}
                  {column.prizeCategory && column.officialPrize == null && (
                    <label className="mt-3 block font-bold">
                      Premio oficial (€)
                      <input type="number" min="0" step="0.01" inputMode="decimal" className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 font-normal" onBlur={event => event.target.value && onSetPrize(play.id, column.id, event.target.value)}/>
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {play.metadata?.externalReference && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-secondary"><strong>Referencia:</strong> {play.metadata.externalReference}</p>}

      <div className="mt-6 border-t border-default pt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Acciones de la jugada</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => onFavorite(play.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted">
            <StarIcon width="17" height="17" className={play.favorite ? 'fill-amber-400 text-amber-500' : ''}/>{play.favorite ? 'Quitar favorito' : 'Favorito'}
          </button>
          <button type="button" onClick={() => onRepeat(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-default px-4 text-sm font-bold text-primary hover:bg-muted">
            <CopyIcon width="17" height="17"/>Repetir números
          </button>
          <button type="button" onClick={() => onVariant(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-800 hover:bg-violet-100">
            <RepeatIcon width="17" height="17"/>Crear variante
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!play.purchased ? (
            <div className="flex-1">
              {receiptExtraPending && <label className="mb-3 block text-sm font-semibold text-primary">Reintegro del resguardo (0–9)<input value={purchaseExtra} onChange={event => setPurchaseExtra(event.target.value.replace(/\D/g, '').slice(0, 1))} inputMode="numeric" pattern="[0-9]" className="mt-2 min-h-11 w-full rounded-xl border border-default bg-surface px-3 font-normal"/><span className="mt-1 block text-xs font-normal text-secondary">Debe coincidir con el resguardo comprado.</span></label>}
              <button type="button" disabled={receiptExtraPending && !/^[0-9]$/.test(purchaseExtra)} onClick={() => onPurchase(play.id, receiptExtraPending ? { receiptExtra: Number(purchaseExtra) } : {})} className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                He jugado este boleto · {euro.format(playCost(play))}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Registrada como jugada comprada</p>
          )}

          <button type="button" onClick={() => onRequestRemove(play)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-rose-700 hover:bg-rose-50" aria-label={`Eliminar ${game.name} del ${formatDrawDate(play.drawDateISO)}`}>
            <TrashIcon width="17" height="17"/>Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthlyFinancePanel({ plays, now }) {
  const finance = useMemo(() => getMonthlyFinance(plays, now), [plays, now]);
  const [activeDetail, setActiveDetail] = useState(null);
  const netTone = finance.netCents > 0 ? 'positive' : finance.netCents < 0 ? 'negative' : 'neutral';
  const metrics = [
    { id: 'expenses', label: 'Gastado', value: euro.format(finance.spent), tone: 'spent' },
    { id: 'winnings', label: 'Premios confirmados', value: euro.format(finance.won), tone: 'won' },
    { id: 'net', label: 'Resultado neto', value: euro.format(finance.net), tone: netTone },
  ];
  const toggleDetail = id => setActiveDetail(current => current === id ? null : id);
  const activeEntries = activeDetail === 'expenses' ? finance.details.expenses : activeDetail === 'winnings' ? finance.details.winnings : [];

  return (
    <section className="primy-monthly-finance" aria-labelledby="monthly-finance-title">
      <div className="primy-monthly-finance__header">
        <div><p>Balance mensual verificable</p><h2 id="monthly-finance-title">{finance.monthLabel}</h2></div>
        <span>Europe/Madrid</span>
      </div>
      <div className="primy-monthly-finance__metrics">
        {metrics.map(metric => (
          <button type="button" key={metric.id} data-tone={metric.tone} aria-expanded={activeDetail === metric.id} onClick={() => toggleDetail(metric.id)}>
            <span>{metric.label}</span><strong>{metric.value}</strong><small>{activeDetail === metric.id ? 'Ocultar detalle' : 'Ver cálculo'}</small>
          </button>
        ))}
      </div>

      {activeDetail === 'net' && (
        <div className="primy-monthly-finance__formula" role="region" aria-label="Cálculo del resultado neto">
          <span>{euro.format(finance.won)} premios</span><strong>−</strong><span>{euro.format(finance.spent)} gastado</span><strong>=</strong><span>{euro.format(finance.net)} neto</span>
        </div>
      )}

      {(activeDetail === 'expenses' || activeDetail === 'winnings') && (
        <div className="primy-monthly-finance__detail" role="region" aria-live="polite">
          {activeEntries.length ? activeEntries.map(entry => (
            <div key={entry.key} className="primy-monthly-finance__entry">
              <GameIdentity gameId={entry.gameId} size="sm" label={false}/>
              <div><strong>{getGameConfig(entry.gameId).shortName}</strong><span>{formatDrawDate(entry.date, { short: true })}{entry.category ? ` · ${entry.category}` : ''}</span></div>
              <b>{euro.format(entry.amount)}</b>
            </div>
          )) : <p className="primy-monthly-finance__empty">No hay movimientos confirmados en este apartado.</p>}
        </div>
      )}

      {finance.excluded.unconfirmedPrizeEntries > 0 && (
        <p className="primy-monthly-finance__warning">{finance.excluded.unconfirmedPrizeEntries} {finance.excluded.unconfirmedPrizeEntries === 1 ? 'importe antiguo no confirmado queda' : 'importes antiguos no confirmados quedan'} fuera del total.</p>
      )}
      <p className="primy-monthly-finance__legal">El gasto usa la fecha de compra o registro. Las victorias usan la fecha del sorteo y solo se incluyen con fuente confirmada.</p>
    </section>
  );
}

function ArchiveSummary({ plays }) {
  const purchased = plays.filter(play => play.purchased).length;
  const awaiting = plays.filter(play => play.computedStatus === 'awaiting_check').length;
  const checked = plays.filter(play => play.computedStatus === 'checked').length;
  return (
    <div className="primy-archive-summary" aria-label="Resumen del archivo">
      <span><strong>{plays.length}</strong> guardadas</span>
      <span><strong>{purchased}</strong> jugadas</span>
      <span data-attention={awaiting > 0 ? 'true' : 'false'}><strong>{awaiting}</strong> por comprobar</span>
      <span><strong>{checked}</strong> comprobadas</span>
    </div>
  );
}

export default function TicketHistory({ now, plays, checkingGame, checkingPlayId, onCheckPlay, onCreate, onAddExternal, onPurchase, onRemove, onSetPrize, onFavorite, onRepeat, onVariant }) {
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('action');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const statusCounts = useMemo(() => plays.reduce((counts, play) => {
    counts[play.computedStatus] = (counts[play.computedStatus] || 0) + 1;
    return counts;
  }, {}), [plays]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return plays
      .filter(play => gameFilter === 'all' || play.gameId === gameFilter)
      .filter(play => statusFilter === 'all' || play.computedStatus === statusFilter)
      .filter(play => !normalizedQuery || `${getGameConfig(play.gameId).name} ${play.drawDateKey || ''} ${play.nationalNumber || ''} ${play.officialRoundNumber || ''}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        if (sort === 'action') {
          const statusDiff = (priority[a.computedStatus] ?? 9) - (priority[b.computedStatus] ?? 9);
          if (statusDiff) return statusDiff;
        }
        return sort === 'oldest'
          ? String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
          : String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
  }, [plays, gameFilter, statusFilter, sort, query]);

  const quickStatuses = [
    ['all', 'Todas', plays.length],
    ['awaiting_check', 'Por comprobar', statusCounts.awaiting_check || 0],
    ['scheduled', 'Próximas', statusCounts.scheduled || 0],
    ['draft', 'Borradores', statusCounts.draft || 0],
    ['checked', 'Comprobadas', statusCounts.checked || 0],
  ];
  const hasActiveFilters = gameFilter !== 'all' || statusFilter !== 'all' || Boolean(query.trim());
  const resetFilters = () => { setGameFilter('all'); setStatusFilter('all'); setSort('action'); setQuery(''); };
  const requestRemove = play => setPendingDelete(play);
  const closeDeleteConfirm = () => setPendingDelete(null);
  const confirmRemove = () => {
    if (!pendingDelete) return;
    onRemove(pendingDelete.id);
    setExpanded(current => current === pendingDelete.id ? null : current);
    setPendingDelete(null);
  };
  const pendingDeleteGame = pendingDelete ? getGameConfig(pendingDelete.gameId) : null;
  const deleteDescription = getPlayDeleteDescription(pendingDelete, pendingDeleteGame?.name);

  return (
    <section className="space-y-5">
      <MonthlyFinancePanel plays={plays} now={now}/>
      <ArchiveSummary plays={plays}/>

      <div className="primy-archive-status-nav" aria-label="Filtros rápidos por estado">
        {quickStatuses.map(([value, label, count]) => (
          <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`primy-archive-status-chip ${statusFilter === value ? 'is-active' : ''}`}>
            <span>{label}</span><strong>{count}</strong>
          </button>
        ))}
      </div>

      <details className="primy-archive-mobile-filters">
        <summary><span>Buscar y ordenar</span><strong>{hasActiveFilters ? 'Filtros activos' : 'Opcional'}</strong></summary>
        <div className="primy-archive-filters primy-archive-filters--mobile">
        <label className="text-sm font-bold text-primary">Buscar<span className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-default px-3"><SearchIcon width="18" height="18"/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-normal outline-none" placeholder="Fecha o juego"/></span></label>
        <label className="text-sm font-bold text-primary">Juego<select value={gameFilter} onChange={event => setGameFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 text-sm font-normal"><option value="all">Todos</option>{Object.values(GAMES).map(game => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
        <label className="text-sm font-bold text-primary">Orden<select value={sort} onChange={event => setSort(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 text-sm font-normal"><option value="action">Acción necesaria</option><option value="newest">Más recientes</option><option value="oldest">Menos recientes</option></select></label>
        </div>
      </details>
      <div className="primy-archive-filters primy-archive-filters--desktop">
        <label className="text-sm font-bold text-primary">Buscar<span className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-default px-3"><SearchIcon width="18" height="18"/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full border-0 bg-transparent p-0 text-sm font-normal outline-none" placeholder="Fecha o juego"/></span></label>
        <label className="text-sm font-bold text-primary">Juego<select value={gameFilter} onChange={event => setGameFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 text-sm font-normal"><option value="all">Todos</option>{Object.values(GAMES).map(game => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
        <label className="text-sm font-bold text-primary">Orden<select value={sort} onChange={event => setSort(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-default bg-surface px-3 text-sm font-normal"><option value="action">Acción necesaria</option><option value="newest">Más recientes</option><option value="oldest">Menos recientes</option></select></label>
      </div>

      {!filtered.length ? (
        <div className="grid gap-5 rounded-[2rem] border border-dashed border-primy-200 bg-gradient-to-br from-ivory via-white to-sky/30 p-6 md:grid-cols-[minmax(0,1fr)_300px] md:p-8">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-primy-700">{hasActiveFilters ? 'Sin coincidencias' : 'Tu espacio está listo'}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{hasActiveFilters ? 'No encontramos jugadas con estos filtros' : 'Todavía no hay jugadas que mostrar'}</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-secondary">{hasActiveFilters ? 'Prueba con otros criterios o restablece la búsqueda para volver a ver todo tu archivo.' : 'Crea una jugada o añade un boleto. Primy los organizará aquí y te ayudará a comprobarlos cuando llegue el sorteo.'}</p>
            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters} className="mt-5 min-h-11 w-fit rounded-xl border border-primy-200 bg-surface px-4 text-sm font-semibold text-primy-800 hover:bg-primy-50">Restablecer filtros</button>
            ) : (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onCreate} className="min-h-11 rounded-xl bg-primy-700 px-5 text-sm font-semibold text-white hover:bg-primy-800">Crear mi jugada</button>
                <button type="button" onClick={onAddExternal} className="min-h-11 rounded-xl border border-primy-200 bg-surface px-5 text-sm font-semibold text-primy-800 hover:bg-primy-50">Añadir boleto</button>
              </div>
            )}
          </div>
          <PrimyMascotGraphic className="w-full max-w-[300px] justify-self-center" variant="empty" size="dashboard" caption={hasActiveFilters ? 'Probemos con otra búsqueda' : 'Cuando tengas jugadas, las guardaré aquí'}/>
        </div>
      ) : (
        <>
          <p className="text-sm text-secondary" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'jugada encontrada' : 'jugadas encontradas'}</p>

          <div className="space-y-3 lg:hidden">
            {filtered.map(play => {
              const game = getGameConfig(play.gameId);
              const isExpanded = expanded === play.id;
              const aggregateBreakdown = play.betType === 'multiple' ? play.columns?.[0]?.breakdown : null;
  const awarded = aggregateBreakdown
    ? Object.values(aggregateBreakdown).reduce((sum, count) => sum + Number(count || 0), 0)
    : play.columns.filter(column => column.prizeCategory).length;
              return (
                <article key={play.id} className={`primy-archive-card ${isExpanded ? 'is-open' : ''}`} style={gameThemeStyle(play.gameId)} data-game={play.gameId}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><GameIdentity gameId={play.gameId} size="sm" label={false}/><p className="truncate font-semibold text-primary">{game.name}</p>{play.favorite && <StarIcon width="16" height="16" className="shrink-0 fill-amber-400 text-amber-500"/>}</div>
                        <p className="mt-1 text-sm capitalize text-secondary">{formatDrawDate(play.drawDateISO)} · {play.gameId === 'loteria-nacional' ? `${play.nationalNumber} · ${play.ticketQuantity || 1} décimo(s)` : play.gameId === 'quiniela' ? '1 apuesta simple' : ['lototurf', 'quintuple-plus'].includes(play.gameId) ? `${playBetCount(play)} apuestas hípicas` : play.betType === 'multiple' ? `${playBetCount(play)} apuestas` : `${play.columns.length} ${play.columns.length === 1 ? 'columna' : 'columnas'}`}</p>
                      </div>
                      <TicketStatus status={play.computedStatus}/>
                    </div>
                    {play.computedStatus === 'awaiting_check' && (
                      <CheckNowButton play={play} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame} className="mt-4 w-full"/>
                    )}
                    <div className="mt-4 flex items-center gap-2 border-t border-default pt-3">
                      <p className="min-w-0 flex-1 text-sm font-semibold text-primary">{play.status === 'checked'
                        ? playKnownPrize(play) > 0
                          ? `${confirmedAwardCount(play)} con premio confirmado · ${euro.format(playKnownPrize(play))}`
                          : hasStoredUnconfirmedPrize(play)
                            ? 'Importe anterior no confirmado · 0,00 € contabilizados'
                            : 'Sin premio confirmado'
                        : euro.format(playCost(play))}</p>
                      <button type="button" onClick={() => requestRemove(play)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50" aria-label={`Eliminar ${game.name} del ${formatDrawDate(play.drawDateISO)}`} title="Eliminar jugada">
                        <TrashIcon width="18" height="18"/>
                      </button>
                      <button type="button" onClick={() => setExpanded(isExpanded ? null : play.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-primy-700 hover:bg-primy-50" aria-expanded={isExpanded} aria-controls={`mobile-play-details-${play.id}`}>
                        {isExpanded ? 'Cerrar' : 'Ver jugada'}<ChevronDownIcon className={isExpanded ? 'rotate-180' : ''} width="19" height="19"/>
                      </button>
                    </div>
                  </div>
                  {isExpanded && <div id={`mobile-play-details-${play.id}`} className="border-t border-default"><PlayDetails play={play} onPurchase={onPurchase} onRequestRemove={requestRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/></div>}
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-3xl border border-default bg-surface shadow-soft lg:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted text-xs uppercase tracking-wide text-secondary"><tr><th className="px-5 py-4">Sorteo</th><th className="px-5 py-4">Juego</th><th className="px-5 py-4">Apuestas</th><th className="px-5 py-4">Coste</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-default">
                {filtered.map(play => {
                  const game = getGameConfig(play.gameId);
                  const isExpanded = expanded === play.id;
                  return (
                    <React.Fragment key={play.id}>
                      <tr className={isExpanded ? 'is-expanded' : ''} style={gameThemeStyle(play.gameId)} data-game={play.gameId}>
                        <td className="px-5 py-4 font-bold capitalize text-primary">{formatDrawDate(play.drawDateISO, { short: true })}</td>
                        <td className="px-5 py-4"><div className="flex items-center gap-2 font-semibold text-primary"><GameIdentity gameId={play.gameId} size="sm" label={false}/>{game.name}{play.favorite && <StarIcon width="15" height="15" className="fill-amber-400 text-amber-500"/>}</div></td>
                        <td className="px-5 py-4 text-secondary">{playBetCount(play)}</td>
                        <td className="px-5 py-4 font-bold text-primary">{euro.format(playCost(play))}</td>
                        <td className="px-5 py-4"><TicketStatus status={play.computedStatus}/>{play.status === 'checked' && <p className="mt-1 text-xs text-secondary">Premios confirmados: {euro.format(playKnownPrize(play))}</p>}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <CheckNowButton play={play} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame} compact/>
                            <button type="button" onClick={() => requestRemove(play)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-rose-700 hover:bg-rose-50" aria-label={`Eliminar ${game.name} del ${formatDrawDate(play.drawDateISO)}`} title="Eliminar jugada">
                              <TrashIcon width="17" height="17"/>
                            </button>
                            <button type="button" onClick={() => setExpanded(isExpanded ? null : play.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-primy-700 hover:bg-primy-50" aria-expanded={isExpanded} aria-controls={`desktop-play-details-${play.id}`}>{isExpanded ? 'Cerrar' : 'Ver jugada'}<ChevronDownIcon className={isExpanded ? 'rotate-180' : ''} width="17" height="17"/></button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <tr id={`desktop-play-details-${play.id}`}><td colSpan="6" className="border-t border-default bg-muted/40"><PlayDetails play={play} onPurchase={onPurchase} onRequestRemove={requestRemove} onSetPrize={onSetPrize} onFavorite={onFavorite} onRepeat={onRepeat} onVariant={onVariant} onCheckPlay={onCheckPlay} checkingPlayId={checkingPlayId} checkingGame={checkingGame}/></td></tr>}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={closeDeleteConfirm}
        onConfirm={confirmRemove}
        title="Eliminar jugada"
        description={deleteDescription}
        confirmLabel="Sí, eliminar jugada"
      />
    </section>
  );
}
