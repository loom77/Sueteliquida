import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import RoundAvailabilityNotice from './RoundAvailabilityNotice.jsx';
import { AlertIcon, CalendarIcon, CheckIcon, RefreshIcon, ShieldIcon, TicketIcon } from './Icons.jsx';
import { useSportsRound } from '../hooks/useSportsRound.js';
import { GOAL_BUCKETS, QUINIGOL_UNIT_PRICE } from '../sports/constants.js';
import { validateQuinigolSelection } from '../sports/quinigolRules.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

function RoundHeader({ round, availability, loading, error, onRefresh }) {
  return (
    <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Jornada oficial SELAE</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-primary">
            {round ? `Quinigol ${round.officialRoundNumber ? `· Jornada ${round.officialRoundNumber}` : ''}` : loading ? 'Cargando composición oficial' : availability?.title || 'Composición oficial no disponible'}
          </h2>
          {round?.roundDate && <p className="mt-2 flex items-center gap-2 text-sm text-secondary"><CalendarIcon width="17" height="17"/>{date.format(new Date(`${round.roundDate}T12:00:00Z`))}</p>}
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-950 hover:bg-orange-100 disabled:opacity-60">
          <RefreshIcon width="17" height="17" className={loading ? 'animate-spin' : ''}/>{loading ? 'Actualizando' : 'Actualizar'}
        </button>
      </div>
      {error && <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><AlertIcon width="20" height="20" className="mt-0.5 shrink-0"/><p>{error}</p></div>}
    </div>
  );
}

function OutcomeSelector({ match, position, value, onChange }) {
  return (
    <section className="rounded-2xl border border-default bg-surface p-4">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Partido {position}</p>
        <p className="mt-1 font-semibold text-primary">{match.homeTeam}</p>
        <p className="text-sm text-secondary">{match.awayTeam}</p>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[310px] grid-cols-[2.4rem_repeat(4,minmax(3rem,1fr))] gap-2" role="group" aria-label={`Marcador de ${match.homeTeam} contra ${match.awayTeam}`}>
          <span aria-hidden="true" />
          {GOAL_BUCKETS.map(away => <span key={`away-${away}`} className="text-center text-xs font-bold text-secondary">{awayTeamLabel(away)}</span>)}
          {GOAL_BUCKETS.map(home => (
            <React.Fragment key={`home-${home}`}>
              <span className="flex items-center justify-center text-xs font-bold text-secondary">{homeTeamLabel(home)}</span>
              {GOAL_BUCKETS.map(away => {
                const outcome = `${home}-${away}`;
                const selected = value === outcome;
                return (
                  <button key={outcome} type="button" onClick={() => onChange(outcome)} aria-pressed={selected} className={selected ? 'min-h-12 rounded-xl bg-orange-600 text-sm font-extrabold text-white shadow-soft ring-4 ring-amber-200' : 'min-h-12 rounded-xl border border-orange-200 bg-white text-sm font-extrabold text-orange-950 hover:bg-orange-50'}>
                    {outcome}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-secondary">Filas: goles de {match.homeTeam}. Columnas: goles de {match.awayTeam}. M significa 3 o más goles.</p>
    </section>
  );
}

function homeTeamLabel(bucket) { return bucket === 'M' ? 'M' : bucket; }
function awayTeamLabel(bucket) { return bucket === 'M' ? 'M' : bucket; }

export default function QuinigolPanel({ activeGame, onGameChange, onPrepareQuinigol, onDiscard, latest, generationError = '', monthlySpent = 0, monthlyLimit = null }) {
  const { round, availability, loading, error, refresh } = useSportsRound('quinigol');
  const [outcomes, setOutcomes] = useState(() => Array(6).fill(''));

  useEffect(() => setOutcomes(Array(6).fill('')), [round?.roundId, round?.sourceHash]);

  const validation = useMemo(() => validateQuinigolSelection({ outcomes: outcomes.map(value => value ? [value] : []) }), [outcomes]);
  const completed = outcomes.filter(Boolean).length;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + QUINIGOL_UNIT_PRICE > monthlyLimit;

  const prepare = () => {
    if (!round || !availability?.operational || !validation.valid || exceedsLimit) return;
    onPrepareQuinigol?.({ round, selection: validation.selection });
  };

  return (
    <section className="primy-panel p-5 sm:p-7" aria-labelledby="quinigol-panel-title">
      <div className="flex items-start gap-4">
        <span className="primy-action-icon bg-orange-100 text-orange-900"><TicketIcon width="22" height="22"/></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Quinigol · módulo operativo</p>
          <h2 id="quinigol-panel-title" className="mt-2 text-3xl font-semibold tracking-[-.045em] text-primary">Pronostica los goles de los seis partidos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Selecciona un marcador por partido con los valores 0, 1, 2 o M. Esta versión prepara una apuesta simple de 1 €.</p>
        </div>
      </div>

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>
      <div className="mt-6"><RoundHeader round={round} availability={availability} loading={loading} error={error} onRefresh={refresh}/></div>
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{generationError}</div>}
      <div className="mt-4"><RoundAvailabilityNotice availability={availability} loading={loading}/></div>

      {latest ? (
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Pronóstico preparado</p>
          <p className="mt-2 text-lg font-semibold text-primary">Revisa el boleto y guárdalo como borrador.</p>
          <button type="button" onClick={onDiscard} className="mt-4 min-h-11 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-950 hover:bg-orange-100">Editar pronóstico</button>
        </div>
      ) : round && availability?.operational && (
        <>
          <div className="mt-6 space-y-4">
            {round.matches.map((match, index) => (
              <OutcomeSelector key={match.matchId} match={match} position={index + 1} value={outcomes[index]} onChange={outcome => setOutcomes(current => current.map((item, itemIndex) => itemIndex === index ? outcome : item))}/>
            ))}
          </div>

          <div className="sticky bottom-3 z-20 mt-6 rounded-3xl border border-orange-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(95,45,15,.18)] backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Progreso del boleto</p>
                <p className="mt-1 text-lg font-semibold text-primary">{completed} de 6 partidos · {euro.format(QUINIGOL_UNIT_PRICE)}</p>
                <p className="mt-1 text-xs text-secondary">Una apuesta simple preparada, todavía no comprada.</p>
              </div>
              <button type="button" onClick={prepare} disabled={!validation.valid || exceedsLimit} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckIcon width="18" height="18"/>Preparar jugada</button>
            </div>
            {exceedsLimit && <p className="mt-3 text-sm font-semibold text-rose-800">Esta apuesta superaría tu límite mensual personal.</p>}
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950"><ShieldIcon width="20" height="20" className="mt-0.5 shrink-0"/><p>Primy conserva la composición oficial y el pronóstico. No compra, transmite ni garantiza el boleto.</p></div>
        </>
      )}
    </section>
  );
}
