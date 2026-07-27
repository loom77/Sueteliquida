import React from 'react';
import GameSwitch from './GameSwitch.jsx';
import { AlertIcon, SparklesIcon, WalletIcon } from './Icons.jsx';

const PRESETS = [1, 3, 5, 10, 20];
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

export default function GeneratorPanel({
  game,
  activeGame,
  onGameChange,
  columnCount,
  setColumnCount,
  onGenerate,
  busy,
  progress = 0,
  generationError,
  monthlySpent = 0,
  monthlyLimit = null,
  variantLabel = '',
  onClearVariant,
}) {
  const totalCost = game.price * columnCount;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + totalCost > monthlyLimit;
  const setBudget = value => {
    const amount = Math.max(game.price, Number(value) || game.price);
    setColumnCount(Math.min(20, Math.max(1, Math.floor(amount / game.price))));
  };

  return (
    <section className="rounded-3xl border border-default bg-surface p-5 md:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><SparklesIcon width="21" height="21"/></span>
        <div>
          <p className="text-sm font-bold text-indigo-700">Metodo automatico Primy</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">Costruisci il tuo portafoglio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Scegli gioco e budget. Primy coordina tutte le colonne insieme, evitando duplicati e riducendo la ripetizione inutile.</p>
        </div>
      </div>

      {variantLabel && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-black text-violet-950">Variante di una giocata esistente</p><p className="mt-1 text-sm leading-6 text-violet-800">Primy cercherà colonne diverse da {variantLabel}, mantenendo lo stesso gioco e la stessa quantità.</p></div>
          <button type="button" onClick={onClearVariant} className="min-h-11 rounded-xl px-4 text-sm font-black text-violet-800 hover:bg-violet-100">Rimuovi riferimento</button>
        </div>
      )}

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange}/></div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-muted p-5">
          <div className="flex items-center justify-between gap-4">
            <div><label htmlFor="column-count" className="text-base font-black text-primary">Colonne</label><p className="mt-1 text-sm text-secondary">Da 1 a 20 nella stessa giocata.</p></div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setColumnCount(value => Math.max(1, value - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-xl font-black hover:bg-muted-strong" aria-label="Riduci il numero di colonne">−</button><output htmlFor="column-count" className="min-w-14 text-center text-3xl font-black tabular-nums text-primary">{columnCount}</output><button type="button" onClick={() => setColumnCount(value => Math.min(20, value + 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-xl font-black hover:bg-muted-strong" aria-label="Aumenta il numero di colonne">+</button></div>
          </div>
          <input id="column-count" type="range" min="1" max="20" value={columnCount} onChange={event => setColumnCount(Number(event.target.value))} className="mt-5 w-full accent-indigo-600" aria-valuetext={`${columnCount} ${columnCount === 1 ? 'colonna' : 'colonne'}`}/>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Scelte rapide">{PRESETS.map(value => <button type="button" key={value} onClick={() => setColumnCount(value)} className={`min-h-11 min-w-11 rounded-xl px-3 text-sm font-black ${columnCount === value ? 'bg-slate-950 text-white' : 'border border-default bg-surface text-primary hover:bg-muted-strong'}`}>{value}</button>)}</div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><WalletIcon width="19" height="19"/></span><div><label htmlFor="budget" className="font-black text-primary">Budget massimo</label><p className="mt-1 text-sm text-secondary">Modificando il budget, Primy calcola le colonne possibili.</p></div></div>
          <div className="mt-5 flex items-center gap-3"><span className="text-xl font-black text-secondary">€</span><input id="budget" type="number" min={game.price} max={game.price * 20} step={game.price} value={totalCost} onChange={event => setBudget(event.target.value)} className="min-h-12 w-full rounded-xl border border-default px-4 text-2xl font-black tabular-nums text-primary"/></div>
          <p className="mt-3 text-sm leading-6 text-secondary">{euro.format(game.price)} per colonna · costo calcolato {euro.format(totalCost)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-lg font-black">{columnCount} {columnCount === 1 ? 'colonna' : 'colonne'} · {euro.format(totalCost)}</p><p className="mt-1 text-sm leading-6 text-slate-300">Primy prepara la combinazione, ma non acquista la schedina.</p></div>
        <button type="button" onClick={onGenerate} disabled={busy} className="min-h-12 rounded-xl bg-surface px-6 text-sm font-black text-primary hover:bg-muted-strong disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52">{busy ? `Elaborazione ${Math.round(progress * 100)}%` : 'Genera giocata'}</button>
      </div>

      {busy && <div className="mt-4" role="progressbar" aria-label="Avanzamento generazione" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}><div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}/></div><p className="mt-2 text-sm text-secondary">Analisi e coordinamento delle colonne in corso…</p></div>}

      {exceedsLimit && <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertIcon className="mt-0.5 shrink-0" width="20" height="20"/><p>Con questa giocata supereresti il limite mensile personale di <strong>{euro.format(monthlyLimit)}</strong>. Puoi comunque generarla, ma valuta di ridurre il budget.</p></div>}
      {generationError && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{generationError}</div>}
    </section>
  );
}
