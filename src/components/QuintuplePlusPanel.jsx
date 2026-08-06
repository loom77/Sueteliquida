import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HorseRoundHeader from './HorseRoundHeader.jsx';
import RoundAvailabilityNotice from './RoundAvailabilityNotice.jsx';
import { AlertIcon, CheckIcon, HorseRacingIcon, TicketIcon } from './Icons.jsx';
import { useHorseRound } from '../hooks/useHorseRound.js';
import { sanitizeQuintuplePlusSelection } from '../horse/quintuplePlusRules.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function updateRow(rows, index, value, multiple) {
  return rows.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    if (!multiple) return [value];
    return row.includes(value) ? row.filter(item => item !== value) : [...row, value].sort((a, b) => a - b);
  });
}

function RunnerGrid({ race, row, rowIndex, multiple, label, onChange }) {
  const activeRunners = (race?.runners || []).filter(runner => !runner.withdrawn);
  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50/45 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-violet-800">{label}</p><h3 className="mt-1 truncate text-lg font-semibold text-primary">{race?.name || `Carrera ${Math.min(rowIndex + 1, 5)}`}</h3><p className="mt-1 text-xs text-secondary">{race?.scheduledAt ? new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(race.scheduledAt)) : 'Horario pendiente'}{race?.distanceMeters ? ` · ${race.distanceMeters} m` : ''}</p></div>
        <span className="rounded-full bg-white px-3 py-2 text-sm font-bold text-violet-900">{row.length} seleccionado{row.length === 1 ? '' : 's'}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {activeRunners.map(runner => {
          const selected = row.includes(runner.number);
          return <button key={runner.number} type="button" onClick={() => onChange(runner.number)} aria-pressed={selected} className={selected ? 'grid min-h-16 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-violet-700 bg-violet-700 p-3 text-left text-white shadow-soft' : 'grid min-h-16 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-violet-200 bg-white p-3 text-left hover:bg-violet-100'}><span className={selected ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-white/18 text-lg font-extrabold' : 'flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-lg font-extrabold text-violet-900'}>{runner.number}</span><span className="min-w-0"><strong className="block truncate text-sm">{runner.name}</strong><small className={selected ? 'block truncate text-white/75' : 'block truncate text-secondary'}>{runner.jockey || runner.trainer || 'Participante oficial'}</small></span>{selected && <CheckIcon width="19" height="19"/>}</button>;
        })}
      </div>
      {multiple && <p className="mt-3 text-xs text-secondary">Puedes seleccionar varios dorsales. Primy calcula automáticamente las combinaciones válidas.</p>}
    </section>
  );
}

export default function QuintuplePlusPanel({ activeGame, onGameChange, onPrepareQuintuplePlus, onDiscard, latest, generationError = '', monthlySpent = 0, monthlyLimit = null }) {
  const { round, availability, loading, error, refresh } = useHorseRound('quintuple-plus');
  const [multiple, setMultiple] = useState(false);
  const [rows, setRows] = useState(() => Array.from({ length: 6 }, () => []));

  useEffect(() => {
    setMultiple(false);
    setRows(Array.from({ length: 6 }, () => []));
  }, [round?.roundId, round?.sourceHash]);

  const runnerCounts = useMemo(() => (round?.races || []).map(race => Math.max(...race.runners.map(runner => runner.number))), [round]);
  const selection = useMemo(() => sanitizeQuintuplePlusSelection({ rows, runnerCounts }), [rows, runnerCounts]);
  const cost = selection?.cost || 0;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + cost > monthlyLimit;

  const changeMode = value => {
    setMultiple(value === 'multiple');
    if (value === 'simple') setRows(current => current.map(row => row.slice(0, 1)));
  };

  const prepare = () => {
    if (!round || !availability?.operational || !selection || exceedsLimit) return;
    onPrepareQuintuplePlus?.({ round, selection });
  };

  return (
    <section className="primy-panel p-5 sm:p-7" aria-labelledby="quintuple-panel-title">
      <div className="flex items-start gap-4">
        <span className="primy-action-icon bg-violet-100 text-violet-900"><HorseRacingIcon width="24" height="24"/></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-violet-800">Quíntuple Plus · módulo operativo</p>
          <h2 id="quintuple-panel-title" className="mt-2 text-3xl font-semibold tracking-[-.045em] text-primary">Pronostica cinco ganadores y el segundo de la quinta</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Cada selección queda vinculada a la composición oficial de las cinco carreras. La misma montura no puede ser primera y segunda en una combinación concreta.</p>
        </div>
      </div>

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>
      <div className="mt-6"><HorseRoundHeader gameName="Quíntuple Plus" round={round} availability={availability} loading={loading} error={error} onRefresh={refresh}/></div>
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{generationError}</div>}
      <div className="mt-4"><RoundAvailabilityNotice availability={availability} loading={loading}/></div>

      {latest ? (
        <div className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-violet-800">Pronóstico preparado</p>
          <p className="mt-2 text-lg font-semibold text-primary">Revisa las seis filas y guárdalas como borrador.</p>
          <button type="button" onClick={onDiscard} className="mt-4 min-h-11 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 hover:bg-violet-100">Editar pronóstico</button>
        </div>
      ) : round && round.races.length === 5 && availability?.operational && (
        <>
          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-primary">Tipo de jugada</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
              <button type="button" onClick={() => changeMode('simple')} aria-pressed={!multiple} className={!multiple ? 'min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white shadow-soft' : 'min-h-11 rounded-xl px-4 text-sm font-bold text-secondary hover:bg-white'}>Sencilla</button>
              <button type="button" onClick={() => changeMode('multiple')} aria-pressed={multiple} className={multiple ? 'min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white shadow-soft' : 'min-h-11 rounded-xl px-4 text-sm font-bold text-secondary hover:bg-white'}>Múltiple</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-secondary">La jugada sencilla marca un dorsal por fila. En múltiple puedes cubrir varios participantes hasta el límite reglamentario de 65.535 apuestas equivalentes.</p>
          </fieldset>

          <div className="mt-6 space-y-4">
            {round.races.map((race, index) => <RunnerGrid key={race.raceId} race={race} row={rows[index]} rowIndex={index} multiple={multiple} label={`Ganador · carrera ${index + 1}`} onChange={value => setRows(current => updateRow(current, index, value, multiple))}/>)}
            <RunnerGrid race={round.races[4]} row={rows[5]} rowIndex={5} multiple={multiple} label="Segundo clasificado · carrera 5" onChange={value => setRows(current => updateRow(current, 5, value, multiple))}/>
          </div>

          <div className="mt-6 rounded-3xl border border-default bg-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Resumen</p><p className="mt-1 text-lg font-semibold text-primary">{selection ? `${selection.equivalentBets} ${selection.equivalentBets === 1 ? 'apuesta equivalente' : 'apuestas equivalentes'}` : 'Completa las seis filas'}</p></div><strong className="text-3xl font-bold text-violet-800">{euro.format(cost)}</strong></div>
            {rows[4].length === 1 && rows[5].length === 1 && rows[4][0] === rows[5][0] && <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950"><AlertIcon width="18" height="18"/>El ganador y el segundo de la quinta carrera deben ser distintos.</div>}
            {exceedsLimit && <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-900"><AlertIcon width="18" height="18"/>Supera tu límite mensual personal.</div>}
            <button type="button" onClick={prepare} disabled={!selection || exceedsLimit} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-45"><TicketIcon width="19" height="19"/>Preparar Quíntuple Plus · {euro.format(cost)}</button>
          </div>
        </>
      )}
    </section>
  );
}
