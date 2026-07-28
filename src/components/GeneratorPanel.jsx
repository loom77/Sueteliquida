import React, { useMemo } from 'react';
import GameSwitch from './GameSwitch.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { AlertIcon, SparklesIcon, WalletIcon } from './Icons.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function GeneratorPanel({ game, activeGame, onGameChange, columnCount, setColumnCount, onGenerate, busy, progress = 0, generationError, monthlySpent = 0, monthlyLimit = null, variantLabel = '', onClearVariant, layout = 'wide' }) {
  const totalCost = game.price * columnCount;
  const maxColumns = game.maxSimpleBets || 1;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + totalCost > monthlyLimit;
  const isPrimitiva = activeGame === 'primitiva';
  const compactLayout = layout === 'compact';
  const coreStage = useMemo(() => {
    if (!busy) return null;
    if (progress < 0.28) return { title: 'Primy Core está preparando tu selección', detail: 'Configurando el juego y el número de columnas.' };
    if (progress < 0.68) return { title: 'Construyendo tus combinaciones', detail: 'Cada columna se crea de forma independiente y sin duplicados.' };
    if (progress < 0.96) return { title: 'Últimas comprobaciones', detail: 'Verificando que el boleto cumpla todas las reglas del juego.' };
    return { title: 'Tu jugada está casi lista', detail: 'Preparando el resultado para mostrarlo.' };
  }, [busy, progress]);

  return (
    <section className="primy-panel primy-card-enter p-5 md:p-7">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isPrimitiva ? 'bg-primy-100 text-primy-800' : 'bg-lavender text-violet-800'}`}><SparklesIcon width="22" height="22"/></span>
        <div><p className={`text-sm font-semibold ${isPrimitiva ? 'text-primy-700' : 'text-violet-700'}`}>Primy Core</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-primary">Prepara tu jugada</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Elige el juego y cuántas columnas quieres incluir en este boleto.</p></div>
      </div>

      {variantLabel && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-lavender/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-violet-950">Variante de una jugada existente</p><p className="mt-1 text-sm leading-6 text-violet-800">Primy creará una selección distinta de {variantLabel}.</p></div><button type="button" onClick={onClearVariant} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-violet-800 hover:bg-violet-100">Quitar referencia</button></div>}

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>

      <div className={compactLayout ? 'mt-6 space-y-4' : 'mt-6 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_270px]'}>
        <div className={`min-w-0 overflow-hidden rounded-3xl border p-5 sm:p-6 ${isPrimitiva ? 'border-primy-200 bg-gradient-to-br from-primy-50 via-ivory to-cream dark:from-primy-950 dark:to-surface' : 'border-violet-200 bg-gradient-to-br from-lavender via-ivory to-cream dark:from-violet-950 dark:to-surface'}`}>
          <div className="flex items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isPrimitiva ? 'bg-primy-700 text-white' : 'bg-eurodreams text-white'}`}><WalletIcon width="21" height="21"/></span><div><p className="text-sm font-medium text-secondary">Presupuesto de la jugada</p><p className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-primary">{euro.format(totalCost)}</p></div></div>

          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-surface p-3 shadow-sm sm:p-4">
            <button type="button" onClick={() => setColumnCount(value => Math.max(1, value - 1))} disabled={busy || columnCount <= 1} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-2xl font-semibold text-primary hover:bg-primy-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Reducir el presupuesto en una columna">−</button>
            <div className="text-center"><output aria-live="polite" className="font-display text-4xl font-semibold tabular-nums text-primary">{columnCount}</output><p className="mt-1 text-sm font-medium text-secondary">{columnCount === 1 ? 'columna' : 'columnas'} · {euro.format(game.price)} cada una</p></div>
            <button type="button" onClick={() => setColumnCount(value => Math.min(maxColumns, value + 1))} disabled={busy || columnCount >= maxColumns} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-2xl font-semibold text-primary hover:bg-primy-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Aumentar el presupuesto en una columna">+</button>
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">Mínimo 1, máximo {maxColumns} columnas en el mismo boleto.</p>

          <button type="button" onClick={onGenerate} disabled={busy} className={`primy-shimmer mt-6 flex min-h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-4 text-center text-base font-semibold leading-6 text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60 ${isPrimitiva ? 'bg-primy-700 hover:bg-primy-800' : 'bg-eurodreams hover:bg-violet-800'}`}>
            <SparklesIcon width="20" height="20"/>{busy ? `Primy Core · ${Math.round(progress * 100)}%` : `Crear ${columnCount === 1 ? 'mi jugada' : `${columnCount} columnas`} · ${euro.format(totalCost)}`}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">La generación no guarda ni compra nada.</p>
        </div>

        {compactLayout ? (
          <div className={`grid min-w-0 grid-cols-[104px_minmax(0,1fr)] items-center gap-4 rounded-3xl border p-3 sm:grid-cols-[120px_minmax(0,1fr)] ${isPrimitiva ? 'border-primy-200 bg-primy-50/70' : 'border-violet-200 bg-lavender/60'}`}>
            <PrimyMascotGraphic
              className="w-full"
              variant={busy ? 'thinking' : 'helper'}
              size="dashboard"
              compact
              showCaption={false}
              caption=""
            />
            <div className="min-w-0 pr-1">
              <p className={`text-xs font-bold uppercase tracking-[0.16em] ${isPrimitiva ? 'text-primy-700' : 'text-violet-700'}`}>Primy te acompaña</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-primary">{busy ? 'Estoy coordinando tus columnas.' : 'Puedes ajustar el presupuesto o generar una combinación nueva.'}</p>
              <p className="mt-1 text-xs leading-5 text-secondary">El boleto generado permanece visible debajo y nunca tapa los controles.</p>
            </div>
          </div>
        ) : (
          <PrimyMascotGraphic
            className="w-full"
            variant={busy ? 'thinking' : 'helper'}
            size="dashboard"
            caption={busy ? 'Estoy coordinando tus columnas' : 'Elige tu presupuesto y yo preparo el resto'}
          />
        )}
      </div>

      {busy && <div className="primy-core-progress mt-5"><div aria-live="polite"><p className="font-display text-lg font-semibold text-primary">{coreStage?.title}</p><p className="mt-1 text-sm leading-6 text-secondary">{coreStage?.detail}</p></div><div className="mt-4" role="progressbar" aria-label="Progreso de generación" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}><div className="h-2.5 overflow-hidden rounded-full bg-primy-100"><div className={`h-full rounded-full transition-[width] ${isPrimitiva ? 'bg-primy-600' : 'bg-eurodreams'}`} style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}/></div><div className="mt-4 flex justify-center gap-2" aria-hidden="true">{[1,2,3,4,5,6].map((n,index)=><span key={n} className="number-ball primy-reveal flex h-9 w-9 items-center justify-center rounded-full border border-primy-200 font-display text-xs font-bold text-primy-800" style={{animationDelay:`${index*70}ms`}}>?</span>)}</div></div></div>}
      {exceedsLimit && <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertIcon className="mt-0.5 shrink-0" width="20" height="20"/><p>Esta jugada superaría el límite mensual personal de <strong>{euro.format(monthlyLimit)}</strong>. Puedes reducir el presupuesto con el botón menos.</p></div>}
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{generationError}</div>}
    </section>
  );
}
