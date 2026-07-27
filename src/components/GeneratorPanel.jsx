import React from 'react';
import GameSwitch from './GameSwitch.jsx';
import { AlertIcon, SparklesIcon, WalletIcon } from './Icons.jsx';

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
  const maxColumns = game.maxSimpleBets || 1;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + totalCost > monthlyLimit;

  return (
    <section className="rounded-3xl border border-default bg-surface p-5 md:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <SparklesIcon width="21" height="21"/>
        </span>
        <div>
          <p className="text-sm font-black text-indigo-700">Passaggio 2 di 2</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">Scegli quanto vuoi giocare</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Imposta il budget aumentando o diminuendo il numero di colonne. È l’unico controllo necessario.</p>
        </div>
      </div>

      {variantLabel && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-violet-950">Variante di una giocata esistente</p>
            <p className="mt-1 text-sm leading-6 text-violet-800">Primy cercherà colonne diverse da {variantLabel}.</p>
          </div>
          <button type="button" onClick={onClearVariant} className="min-h-11 rounded-xl px-4 text-sm font-black text-violet-800 hover:bg-violet-100">Rimuovi riferimento</button>
        </div>
      )}

      <div className="mt-7">
        <GameSwitch active={activeGame} onChange={onGameChange} label="Gioco scelto"/>
      </div>

      <div className="mt-6 rounded-3xl bg-muted p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <WalletIcon width="21" height="21"/>
          </span>
          <div>
            <p className="text-sm font-bold text-secondary">Budget della giocata</p>
            <p className="mt-0.5 text-3xl font-black tabular-nums text-primary">{euro.format(totalCost)}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-surface p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setColumnCount(value => Math.max(1, value - 1))}
            disabled={busy || columnCount <= 1}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-default text-2xl font-black text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Riduci il budget di una colonna"
          >
            −
          </button>

          <div className="text-center">
            <output aria-live="polite" className="text-3xl font-black tabular-nums text-primary">{columnCount}</output>
            <p className="mt-1 text-sm font-bold text-secondary">{columnCount === 1 ? 'colonna' : 'colonne'} · {euro.format(game.price)} ciascuna</p>
          </div>

          <button
            type="button"
            onClick={() => setColumnCount(value => Math.min(maxColumns, value + 1))}
            disabled={busy || columnCount >= maxColumns}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-default text-2xl font-black text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Aumenta il budget di una colonna"
          >
            +
          </button>
        </div>

        <p className="mt-3 text-center text-xs leading-5 text-secondary">Minimo 1, massimo {maxColumns} colonne nello stesso boleto.</p>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={busy}
        className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-950 px-6 text-base font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? `Preparazione in corso · ${Math.round(progress * 100)}%` : `Genera ${columnCount === 1 ? 'la giocata' : `${columnCount} colonne`} · ${euro.format(totalCost)}`}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-secondary">La generazione non salva e non acquista nulla.</p>

      {busy && (
        <div className="mt-4" role="progressbar" aria-label="Avanzamento generazione" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}/>
          </div>
        </div>
      )}

      {exceedsLimit && (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <AlertIcon className="mt-0.5 shrink-0" width="20" height="20"/>
          <p>Questa giocata supererebbe il limite mensile personale di <strong>{euro.format(monthlyLimit)}</strong>. Puoi ridurre il budget con il pulsante meno.</p>
        </div>
      )}
      {generationError && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{generationError}</div>}
    </section>
  );
}
