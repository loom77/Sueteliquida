import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import { AlertIcon, CalendarIcon, CheckIcon, RefreshIcon, ShieldIcon, TicketIcon } from './Icons.jsx';
import { useSportsRound } from '../hooks/useSportsRound.js';
import RoundAvailabilityNotice from './RoundAvailabilityNotice.jsx';
import { GOAL_BUCKETS, QUINIELA_SYMBOLS, QUINIELA_UNIT_PRICE } from '../sports/constants.js';
import { validateSimpleQuinielaSelection } from '../sports/quinielaPlay.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

function RoundHeader({ round, availability, loading, error, onRefresh }) {
  return (
    <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-primy-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-sky-800">Jornada oficial SELAE</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-primary">
            {round ? `Quiniela ${round.officialRoundNumber ? `· Jornada ${round.officialRoundNumber}` : ''}` : loading ? 'Cargando composición oficial' : availability?.title || 'Composición oficial no disponible'}
          </h2>
          {round?.roundDate && <p className="mt-2 flex items-center gap-2 text-sm text-secondary"><CalendarIcon width="17" height="17"/>{date.format(new Date(`${round.roundDate}T12:00:00Z`))}</p>}
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-60">
          <RefreshIcon width="17" height="17" className={loading ? 'animate-spin' : ''}/>{loading ? 'Actualizando' : 'Actualizar'}
        </button>
      </div>
      {error && <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><AlertIcon width="20" height="20" className="mt-0.5 shrink-0"/><p>{error}</p></div>}
      {round?.validation?.warnings?.length > 0 && <p className="mt-4 text-xs leading-5 text-secondary">Algunos horarios todavía no están publicados. La composición y el orden oficial sí se conservan.</p>}
    </div>
  );
}

function SignSelector({ position, match, value, onChange }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-default bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Partido {position}</p>
        <p className="mt-1 truncate font-semibold text-primary">{match.homeTeam}</p>
        <p className="truncate text-sm text-secondary">{match.awayTeam}</p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Pronóstico del partido ${position}: ${match.homeTeam} contra ${match.awayTeam}`}>
        {QUINIELA_SYMBOLS.map(sign => (
          <button key={sign} type="button" onClick={() => onChange(sign)} aria-pressed={value === sign} className={value === sign ? 'min-h-12 rounded-xl bg-sky-800 text-base font-extrabold text-white shadow-soft' : 'min-h-12 rounded-xl border border-sky-200 bg-white text-base font-extrabold text-sky-900 hover:bg-sky-50'}>{sign}</button>
        ))}
      </div>
    </div>
  );
}

function GoalSelector({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-primary">{label}</legend>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {GOAL_BUCKETS.map(bucket => <button key={bucket} type="button" onClick={() => onChange(bucket)} aria-pressed={value === bucket} className={value === bucket ? 'min-h-12 rounded-xl bg-amber-500 text-base font-extrabold text-slate-950 shadow-soft' : 'min-h-12 rounded-xl border border-amber-200 bg-white text-base font-extrabold text-amber-950 hover:bg-amber-50'}>{bucket}</button>)}
      </div>
      <p className="mt-2 text-xs text-secondary">M significa 3 o más goles.</p>
    </fieldset>
  );
}

export default function QuinielaPanel({ activeGame, onGameChange, onPrepareQuiniela, onDiscard, latest, generationError = '', monthlySpent = 0, monthlyLimit = null }) {
  const { round, availability, loading, error, refresh } = useSportsRound('quiniela');
  const [signs, setSigns] = useState(() => Array(14).fill(''));
  const [pleno, setPleno] = useState({ home: '', away: '' });

  useEffect(() => {
    setSigns(Array(14).fill(''));
    setPleno({ home: '', away: '' });
  }, [round?.roundId, round?.sourceHash]);

  const regularMatches = useMemo(() => (round?.matches || []).filter(match => match.predictionType === 'one-x-two'), [round]);
  const plenoMatch = useMemo(() => (round?.matches || []).find(match => match.predictionType === 'pleno15') || null, [round]);
  const validation = useMemo(() => validateSimpleQuinielaSelection({ signs, pleno }), [signs, pleno]);
  const completed = signs.filter(Boolean).length + (pleno.home ? 1 : 0) + (pleno.away ? 1 : 0);
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + QUINIELA_UNIT_PRICE > monthlyLimit;

  const prepare = () => {
    if (!round || !availability?.operational || !validation.valid || exceedsLimit) return;
    onPrepareQuiniela?.({ round, selection: validation.selection });
  };

  return (
    <section className="primy-panel p-5 sm:p-7" aria-labelledby="quiniela-panel-title">
      <div className="flex items-start gap-4">
        <span className="primy-action-icon bg-sky-100 text-sky-900"><TicketIcon width="22" height="22"/></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-sky-800">Quiniela simple · fase operativa</p>
          <h2 id="quiniela-panel-title" className="mt-2 text-3xl font-semibold tracking-[-.045em] text-primary">Marca los 14 signos y el Pleno al 15</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Esta primera versión prepara una única apuesta simple. No activa todavía dobles, triples, reducidas, condicionadas ni Elige8.</p>
        </div>
      </div>

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>
      <div className="mt-6"><RoundHeader round={round} availability={availability} loading={loading} error={error} onRefresh={refresh}/></div>
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{generationError}</div>}
      <div className="mt-4"><RoundAvailabilityNotice availability={availability} loading={loading}/></div>

      {latest ? (
        <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-sky-800">Pronóstico preparado</p>
          <p className="mt-2 text-lg font-semibold text-primary">Revisa el boleto en el panel lateral y guárdalo como borrador.</p>
          <p className="mt-2 text-sm leading-6 text-secondary">La selección sigue disponible en esta pantalla. Para corregir un signo antes de guardar, vuelve al modo de edición.</p>
          <button type="button" onClick={onDiscard} className="mt-4 min-h-11 rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-900 hover:bg-sky-100">Editar pronóstico</button>
        </div>
      ) : round && availability?.operational && (
        <>
          <div className="mt-6 space-y-3">
            {regularMatches.map(match => {
              const signIndex = match.position - 1;
              return <SignSelector key={match.matchId} position={match.position} match={match} value={signs[signIndex]} onChange={sign => setSigns(current => current.map((item, itemIndex) => itemIndex === signIndex ? sign : item))}/>;
            })}
          </div>

          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/70 p-5" aria-labelledby="pleno-title">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-amber-900">Partido 15 · marcador 0/1/2/M</p>
            <h3 id="pleno-title" className="mt-2 text-xl font-semibold text-primary">Pleno al 15</h3>
            <p className="mt-1 text-sm text-secondary">{plenoMatch?.homeTeam} contra {plenoMatch?.awayTeam}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <GoalSelector label={plenoMatch?.homeTeam || 'Equipo local'} value={pleno.home} onChange={home => setPleno(current => ({ ...current, home }))}/>
              <GoalSelector label={plenoMatch?.awayTeam || 'Equipo visitante'} value={pleno.away} onChange={away => setPleno(current => ({ ...current, away }))}/>
            </div>
          </section>

          <div className="sticky bottom-3 z-20 mt-6 rounded-3xl border border-sky-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,47,80,.18)] backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Progreso del boleto</p>
                <p className="mt-1 text-lg font-semibold text-primary">{completed} de 16 selecciones · {euro.format(QUINIELA_UNIT_PRICE)}</p>
                <p className="mt-1 text-xs text-secondary">Una apuesta simple preparada, todavía no comprada.</p>
              </div>
              <button type="button" onClick={prepare} disabled={!validation.valid || exceedsLimit} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-800 px-6 text-sm font-bold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"><CheckIcon width="18" height="18"/>Preparar jugada</button>
            </div>
            {exceedsLimit && <p className="mt-3 text-sm font-semibold text-rose-800">Esta apuesta superaría tu límite mensual personal.</p>}
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><ShieldIcon width="20" height="20" className="mt-0.5 shrink-0"/><p>Primy guarda el pronóstico y la versión de la jornada oficial. No compra ni valida el boleto y no presenta este pronóstico como garantía de acierto.</p></div>
        </>
      )}
    </section>
  );
}
