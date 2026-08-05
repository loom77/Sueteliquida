import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import HorseRoundHeader from './HorseRoundHeader.jsx';
import RoundAvailabilityNotice from './RoundAvailabilityNotice.jsx';
import { AlertIcon, CheckIcon, HorseRacingIcon, TicketIcon } from './Icons.jsx';
import { useHorseRound } from '../hooks/useHorseRound.js';
import { sanitizeLototurfSelection } from '../horse/lototurfRules.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function toggle(list, value, max) {
  if (list.includes(value)) return list.filter(item => item !== value);
  if (list.length >= max) return list;
  return [...list, value].sort((a, b) => a - b);
}

export default function LototurfPanel({ activeGame, onGameChange, onPrepareLototurf, onDiscard, latest, generationError = '', monthlySpent = 0, monthlyLimit = null }) {
  const { round, availability, loading, error, refresh } = useHorseRound('lototurf');
  const [mode, setMode] = useState('simple');
  const [numbers, setNumbers] = useState([]);
  const [horses, setHorses] = useState([]);

  useEffect(() => {
    setMode('simple');
    setNumbers([]);
    setHorses([]);
  }, [round?.roundId, round?.sourceHash]);

  const race = round?.races?.[0];
  const activeRunners = (race?.runners || []).filter(runner => !runner.withdrawn);
  const selection = useMemo(() => sanitizeLototurfSelection({ numbers, horses }), [numbers, horses]);
  const cost = selection?.cost || 0;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + cost > monthlyLimit;

  const changeMode = next => {
    setMode(next);
    if (next === 'simple') {
      setNumbers(current => current.slice(0, 6));
      setHorses(current => current.slice(0, 1));
    }
  };

  const prepare = () => {
    if (!round || !availability?.operational || !selection || exceedsLimit) return;
    onPrepareLototurf?.({ round, selection });
  };

  return (
    <section className="primy-panel p-5 sm:p-7" aria-labelledby="lototurf-panel-title">
      <div className="flex items-start gap-4">
        <span className="primy-action-icon bg-orange-100 text-orange-900"><HorseRacingIcon width="24" height="24"/></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Lototurf · módulo operativo</p>
          <h2 id="lototurf-panel-title" className="mt-2 text-3xl font-semibold tracking-[-.045em] text-primary">Elige seis números y el caballo ganador</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">La jugada queda vinculada al programa oficial de la jornada. Primy no compra ni valida el boleto.</p>
        </div>
      </div>

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>
      <div className="mt-6"><HorseRoundHeader gameName="Lototurf" round={round} loading={loading} error={error} onRefresh={refresh}/></div>
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">{generationError}</div>}
      <div className="mt-4"><RoundAvailabilityNotice availability={availability} loading={loading} onRefresh={refresh}/></div>

      {latest ? (
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-800">Jugada preparada</p>
          <p className="mt-2 text-lg font-semibold text-primary">Revisa el boleto y guárdalo como borrador.</p>
          <button type="button" onClick={onDiscard} className="mt-4 min-h-11 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-900 hover:bg-orange-100">Editar selección</button>
        </div>
      ) : round && race && availability?.operational && (
        <>
          <fieldset className="mt-6">
            <legend className="text-sm font-bold text-primary">Tipo de jugada</legend>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
              {['simple', 'multiple'].map(value => <button key={value} type="button" onClick={() => changeMode(value)} aria-pressed={mode === value} className={mode === value ? 'min-h-11 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white shadow-soft' : 'min-h-11 rounded-xl px-4 text-sm font-bold text-secondary hover:bg-white'}>{value === 'simple' ? 'Sencilla' : 'Múltiple'}</button>)}
            </div>
            <p className="mt-2 text-xs leading-5 text-secondary">Sencilla: 6 números y 1 caballo. Múltiple: hasta 10 números y 4 caballos; el coste aumenta según las combinaciones equivalentes.</p>
          </fieldset>

          <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5" aria-labelledby="lototurf-numbers-title">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Parte numérica</p><h3 id="lototurf-numbers-title" className="mt-1 text-xl font-semibold text-primary">Números del 1 al 31</h3></div><span className="rounded-full bg-white px-3 py-2 text-sm font-bold text-emerald-900">{numbers.length}/{mode === 'simple' ? 6 : 10}</span></div>
            <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8">
              {Array.from({ length: 31 }, (_, index) => index + 1).map(number => {
                const selected = numbers.includes(number);
                const disabled = !selected && numbers.length >= (mode === 'simple' ? 6 : 10);
                return <button key={number} type="button" disabled={disabled} onClick={() => setNumbers(current => toggle(current, number, mode === 'simple' ? 6 : 10))} aria-pressed={selected} className={selected ? 'aspect-square rounded-full bg-emerald-700 text-sm font-extrabold text-white shadow-soft' : 'aspect-square rounded-full border border-emerald-200 bg-white text-sm font-bold text-emerald-950 hover:bg-emerald-100 disabled:opacity-35'}>{number}</button>;
              })}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-orange-200 bg-orange-50/60 p-5" aria-labelledby="lototurf-horse-title">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-orange-800">4.ª carrera oficial</p><h3 id="lototurf-horse-title" className="mt-1 text-xl font-semibold text-primary">Caballo ganador</h3><p className="mt-1 text-sm text-secondary">{race.name}{race.distanceMeters ? ` · ${race.distanceMeters} m` : ''}</p></div><span className="rounded-full bg-white px-3 py-2 text-sm font-bold text-orange-900">{horses.length}/{mode === 'simple' ? 1 : 4}</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {activeRunners.map(runner => {
                const selected = horses.includes(runner.number);
                const disabled = !selected && horses.length >= (mode === 'simple' ? 1 : 4);
                return <button key={runner.number} type="button" disabled={disabled} onClick={() => setHorses(current => toggle(current, runner.number, mode === 'simple' ? 1 : 4))} aria-pressed={selected} className={selected ? 'grid min-h-16 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-orange-700 bg-orange-700 p-3 text-left text-white shadow-soft' : 'grid min-h-16 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-orange-200 bg-white p-3 text-left hover:bg-orange-100 disabled:opacity-35'}><span className={selected ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-white/18 text-lg font-extrabold' : 'flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-lg font-extrabold text-orange-900'}>{runner.number}</span><span className="min-w-0"><strong className="block truncate text-sm">{runner.name}</strong><small className={selected ? 'block truncate text-white/75' : 'block truncate text-secondary'}>{runner.jockey || runner.trainer || 'Datos oficiales del participante'}</small></span>{selected && <CheckIcon width="19" height="19"/>}</button>;
              })}
            </div>
            {(race.runners || []).some(runner => runner.withdrawn) && <p className="mt-3 text-xs font-semibold text-rose-800">Los caballos retirados no pueden seleccionarse.</p>}
          </section>

          <div className="mt-6 rounded-3xl border border-default bg-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Resumen</p><p className="mt-1 text-lg font-semibold text-primary">{selection ? `${selection.equivalentBets} ${selection.equivalentBets === 1 ? 'apuesta equivalente' : 'apuestas equivalentes'}` : 'Completa la selección'}</p></div><strong className="text-3xl font-bold text-orange-800">{euro.format(cost)}</strong></div>
            {exceedsLimit && <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-900"><AlertIcon width="18" height="18"/>Supera tu límite mensual personal.</div>}
            <button type="button" onClick={prepare} disabled={!selection || exceedsLimit} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-45"><TicketIcon width="19" height="19"/>Preparar Lototurf · {euro.format(cost)}</button>
          </div>
        </>
      )}
    </section>
  );
}
