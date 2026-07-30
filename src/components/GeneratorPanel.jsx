import React, { useEffect, useMemo, useState } from 'react';
import GameSwitch from './GameSwitch.jsx';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import AccessibleDialog from './AccessibleDialog.jsx';
import { AlertIcon, CheckIcon, InfoIcon, ShieldIcon, SparklesIcon, WalletIcon, XIcon } from './Icons.jsx';
import { BONOLOTO_SYSTEM_SIZES, bonolotoEquivalentBets } from '../utils/bonoloto.js';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const CORE_STEPS = [
  { icon: InfoIcon, title: 'Entiende cada juego', text: 'Reconoce cuántos números, estrellas o elementos extra corresponden, qué rangos son válidos y cómo se calcula el coste.' },
  { icon: SparklesIcon, title: 'Crea de forma independiente', text: 'Genera cada selección sin copiar columnas y sin usar el historial para prometer qué saldrá en el próximo sorteo.' },
  { icon: CheckIcon, title: 'Comprueba antes de entregar', text: 'Revisa duplicados, cantidades, reglas del boleto y presupuesto antes de mostrarte el resultado.' },
];

const GAME_THEMES = {
  primitiva: {
    label: 'text-primy-700', icon: 'bg-primy-100 text-primy-800', strong: 'bg-primy-700 hover:bg-primy-800',
    panel: 'border-primy-200 bg-gradient-to-br from-primy-50 via-ivory to-cream dark:from-primy-950 dark:to-surface',
    helper: 'border-primy-200 bg-primy-50/70', progress: 'bg-primy-600',
  },
  bonoloto: {
    label: 'text-lime-800', icon: 'bg-lime-100 text-lime-900', strong: 'primy-bonoloto-action',
    panel: 'border-lime-200 bg-gradient-to-br from-lime-50 via-ivory to-cream dark:from-lime-950 dark:to-surface',
    helper: 'border-lime-200 bg-lime-50/70', progress: 'bg-lime-700',
  },
  euromillones: {
    label: 'text-sky-700', icon: 'bg-sky-100 text-sky-800', strong: 'primy-euromillones-action',
    panel: 'border-sky-200 bg-gradient-to-br from-sky-50 via-ivory to-cream dark:from-sky-950 dark:to-surface',
    helper: 'border-sky-200 bg-sky-50/70', progress: 'bg-sky-600',
  },
  eurodreams: {
    label: 'text-violet-700', icon: 'bg-lavender text-violet-800', strong: 'bg-eurodreams hover:bg-violet-800',
    panel: 'border-violet-200 bg-gradient-to-br from-lavender via-ivory to-cream dark:from-violet-950 dark:to-surface',
    helper: 'border-violet-200 bg-lavender/60', progress: 'bg-eurodreams',
  },
};

export default function GeneratorPanel({
  game, activeGame, onGameChange, columnCount, setColumnCount,
  betType = 'simple', setBetType, systemSize = 7, setSystemSize,
  onGenerate, onCancel, busy, progress = 0, generationError,
  monthlySpent = 0, monthlyLimit = null, variantLabel = '', onClearVariant, layout = 'wide',
}) {
  const isBonoloto = activeGame === 'bonoloto';
  const isMultiple = isBonoloto && betType === 'multiple';
  const minColumns = game.minSimpleBets || 1;
  const maxColumns = game.maxSimpleBets || 1;
  const equivalentBets = isMultiple ? bonolotoEquivalentBets(systemSize) : columnCount;
  const totalCost = game.price * equivalentBets;
  const exceedsLimit = monthlyLimit != null && monthlyLimit > 0 && monthlySpent + totalCost > monthlyLimit;
  const compactLayout = layout === 'compact';
  const theme = GAME_THEMES[activeGame] || GAME_THEMES.primitiva;
  const [coreInfoOpen, setCoreInfoOpen] = useState(false);

  useEffect(() => {
    if (isBonoloto && betType === 'simple' && columnCount < minColumns) setColumnCount(minColumns);
  }, [betType, columnCount, isBonoloto, minColumns, setColumnCount]);

  const coreStage = useMemo(() => {
    if (!busy) return null;
    if (progress < 0.28) return { title: 'Primy Core está preparando tu selección', detail: 'Configurando el juego y el tipo de apuesta.' };
    if (progress < 0.68) return { title: 'Construyendo tus combinaciones', detail: isMultiple ? 'Generando una selección múltiple válida.' : 'Cada columna se crea de forma independiente y sin duplicados.' };
    if (progress < 0.96) return { title: 'Últimas comprobaciones', detail: 'Verificando que el boleto cumpla todas las reglas del juego.' };
    return { title: 'Tu jugada está casi lista', detail: 'Preparando el resultado para mostrarlo.' };
  }, [busy, isMultiple, progress]);

  const actionLabel = isMultiple
    ? `Crear múltiple de ${systemSize} números · ${euro.format(totalCost)}`
    : `Crear ${columnCount === 1 ? 'mi jugada' : `${columnCount} columnas`} · ${euro.format(totalCost)}`;

  return (
    <section className="primy-panel primy-card-enter p-5 md:p-7" aria-busy={busy}>
      <div className="primy-core-spotlight">
        <span className="primy-core-spotlight__orb primy-core-spotlight__orb--one" aria-hidden="true" />
        <span className="primy-core-spotlight__orb primy-core-spotlight__orb--two" aria-hidden="true" />
        <span className={`primy-core-spotlight__icon ${theme.icon}`} aria-hidden="true"><SparklesIcon width="24" height="24"/></span>
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`primy-core-spotlight__badge ${theme.label}`}>
              <span className="primy-core-spotlight__status" aria-hidden="true" />
              Primy Core
            </span>
            <span className="text-xs font-semibold text-secondary">El corazón de cada jugada</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary">Prepara tu jugada</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Elige el juego y configura el boleto. Primy Core aplica las reglas, crea la selección y comprueba que todo encaje antes de mostrártela.</p>
          <button
            type="button"
            className="primy-core-learn"
            onClick={() => setCoreInfoOpen(true)}
            aria-haspopup="dialog"
            aria-controls="primy-core-info-dialog"
          >
            <InfoIcon width="18" height="18"/>
            Descubre más sobre Primy Core
          </button>
        </div>
      </div>

      {variantLabel && <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-lavender/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-violet-950">Variante de una jugada existente</p><p className="mt-1 text-sm leading-6 text-violet-800">Primy creará una selección distinta de {variantLabel}.</p></div><button type="button" onClick={onClearVariant} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-violet-800 hover:bg-violet-100">Quitar referencia</button></div>}

      <div className="mt-7"><GameSwitch active={activeGame} onChange={onGameChange} label="Juego elegido"/></div>

      {isBonoloto && (
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-semibold text-primary">Tipo de apuesta</legend>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted-strong p-1.5">
            <button type="button" aria-pressed={!isMultiple} onClick={() => setBetType?.('simple')} disabled={busy} className={`min-h-12 rounded-xl px-4 text-sm font-semibold ${!isMultiple ? 'primy-bonoloto-action text-white' : 'text-secondary hover:bg-surface hover:text-primary'}`}>Sencilla</button>
            <button type="button" aria-pressed={isMultiple} onClick={() => setBetType?.('multiple')} disabled={busy} className={`min-h-12 rounded-xl px-4 text-sm font-semibold ${isMultiple ? 'primy-bonoloto-action text-white' : 'text-secondary hover:bg-surface hover:text-primary'}`}>Múltiple</button>
          </div>
          <p className="mt-2 text-xs leading-5 text-secondary">La sencilla genera de 2 a 8 apuestas. La múltiple crea una única selección que equivale a varias apuestas oficiales.</p>
        </fieldset>
      )}

      <div className={compactLayout ? 'mt-6 space-y-4' : 'mt-6 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_270px]'}>
        <div className={`min-w-0 overflow-hidden rounded-3xl border p-5 sm:p-6 ${theme.panel}`}>
          <div className="flex items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${theme.strong.split(' ')[0]}`}><WalletIcon width="21" height="21"/></span><div><p className="text-sm font-medium text-secondary">Presupuesto de la jugada</p><p className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-primary">{euro.format(totalCost)}</p></div></div>

          {isMultiple ? (
            <div className="mt-6 rounded-2xl border border-white/80 bg-surface p-4 shadow-sm">
              <label className="text-sm font-semibold text-primary" htmlFor="bonoloto-system-size">Números de la selección múltiple</label>
              <select id="bonoloto-system-size" value={systemSize} onChange={event => setSystemSize?.(Number(event.target.value))} disabled={busy} className="mt-2 min-h-12 w-full rounded-xl border border-default bg-surface px-3 text-base text-primary">
                {BONOLOTO_SYSTEM_SIZES.map(size => <option key={size} value={size}>{size} números · {bonolotoEquivalentBets(size)} apuestas</option>)}
              </select>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-lime-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-lime-800">Apuestas equivalentes</p><p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{equivalentBets}</p></div>
                <div className="rounded-xl bg-lime-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-lime-800">Coste por sorteo</p><p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{euro.format(totalCost)}</p></div>
              </div>
              {equivalentBets >= 84 && <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"><AlertIcon className="mt-0.5 shrink-0" width="18" height="18"/><p>Esta múltiple desarrolla {equivalentBets} apuestas y tiene un coste elevado. Revisa el importe antes de continuar.</p></div>}
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-surface p-3 shadow-sm sm:p-4">
                <button type="button" onClick={() => setColumnCount(value => Math.max(minColumns, value - 1))} disabled={busy || columnCount <= minColumns} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-2xl font-semibold text-primary hover:bg-primy-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Reducir el presupuesto en una columna">−</button>
                <div className="text-center"><output aria-live="polite" className="font-display text-4xl font-semibold tabular-nums text-primary">{columnCount}</output><p className="mt-1 text-sm font-medium text-secondary">{columnCount === 1 ? 'columna' : 'columnas'} · {euro.format(game.price)} cada una</p></div>
                <button type="button" onClick={() => setColumnCount(value => Math.min(maxColumns, value + 1))} disabled={busy || columnCount >= maxColumns} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-2xl font-semibold text-primary hover:bg-primy-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Aumentar el presupuesto en una columna">+</button>
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-secondary">Mínimo {minColumns}, máximo {maxColumns} columnas en el mismo boleto.</p>
            </>
          )}

          {game.secondary && <p className="mt-2 text-center text-xs leading-5 text-secondary">Cada columna incluye {game.numbersToPick} números y {game.secondary.count} {game.secondary.label.toLocaleLowerCase('es-ES')} independientes.</p>}
          {game.extra?.assignment === 'official-receipt' && <p className="mt-3 rounded-xl border border-lime-200 bg-lime-50 p-3 text-center text-xs leading-5 text-lime-950">Primy no genera el reintegro. Lo introducirás al registrar el boleto comprado, exactamente como aparece en el resguardo.</p>}

          <div className="mt-6 grid gap-2">
            <button type="button" onClick={onGenerate} disabled={busy} aria-label={`Crear una jugada de ${game.name}`} data-game-action={activeGame} className={`primy-shimmer flex min-h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-4 text-center text-base font-semibold leading-6 text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-60 ${theme.strong}`}>
              <SparklesIcon width="20" height="20"/>{busy ? `Primy Core · ${Math.round(progress * 100)}%` : actionLabel}
            </button>
            {busy && <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-default bg-surface px-4 text-sm font-semibold text-primary hover:bg-muted">Cancelar generación</button>}
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-secondary">La generación no guarda ni compra nada.</p>
        </div>

        {compactLayout ? (
          <div className={`grid min-w-0 grid-cols-[104px_minmax(0,1fr)] items-center gap-4 rounded-3xl border p-3 sm:grid-cols-[120px_minmax(0,1fr)] ${theme.helper}`}>
            <PrimyMascotGraphic className="w-full" variant={busy ? 'thinking' : 'helper'} size="dashboard" compact showCaption={false} caption=""/>
            <div className="min-w-0 pr-1"><p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.label}`}>Primy te acompaña</p><p className="mt-1 text-sm font-semibold leading-6 text-primary">{busy ? 'Estoy coordinando tu boleto.' : 'Revisa el tipo de apuesta y el presupuesto antes de generar.'}</p><p className="mt-1 text-xs leading-5 text-secondary">El boleto generado permanece visible debajo y nunca tapa los controles.</p></div>
          </div>
        ) : (
          <PrimyMascotGraphic className="w-full" variant={busy ? 'thinking' : 'helper'} size="dashboard" caption={busy ? 'Estoy coordinando tu boleto' : 'Revisa el presupuesto y yo preparo el resto'}/>
        )}
      </div>

      {busy && <div className="primy-core-progress mt-5"><div aria-live="polite"><p className="font-display text-lg font-semibold text-primary">{coreStage?.title}</p><p className="mt-1 text-sm leading-6 text-secondary">{coreStage?.detail}</p></div><div className="mt-4" role="progressbar" aria-label="Progreso de generación" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}><div className="h-2.5 overflow-hidden rounded-full bg-primy-100"><div className={`h-full rounded-full transition-[width] ${theme.progress}`} style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}/></div></div></div>}
      {exceedsLimit && <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertIcon className="mt-0.5 shrink-0" width="20" height="20"/><p>Esta jugada superaría el límite mensual personal de <strong>{euro.format(monthlyLimit)}</strong>. Reduce el número de apuestas.</p></div>}
      {generationError && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{generationError}</div>}

      <AccessibleDialog open={coreInfoOpen} onClose={() => setCoreInfoOpen(false)} labelledBy="primy-core-dialog-title" className="primy-core-dialog max-w-3xl">
        <div id="primy-core-info-dialog">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primy-700">El corazón de Primy</p>
              <h2 id="primy-core-dialog-title" className="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">Así funciona Primy Core</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary sm:text-base">Primy Core es el sistema que convierte las reglas oficiales del juego que eliges en una jugada válida, clara y lista para revisar.</p>
            </div>
            <button type="button" onClick={() => setCoreInfoOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-primary hover:bg-muted" aria-label="Cerrar información sobre Primy Core"><XIcon width="20" height="20"/></button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-3">
              {CORE_STEPS.map(step => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title} className="primy-core-step">
                    <span className="primy-core-step__icon" aria-hidden="true"><StepIcon width="20" height="20"/></span>
                    <div><h3 className="text-base font-semibold text-primary">{step.title}</h3><p className="mt-1 text-sm leading-6 text-secondary">{step.text}</p></div>
                  </div>
                );
              })}
            </div>

            <div className="primy-core-dialog__mascot">
              <PrimyMascotGraphic variant="helper" size="dashboard" compact showCaption={false} className="w-full" />
              <p className="mt-3 text-center text-sm font-semibold leading-6 text-primary">Tú eliges el juego y cuánto quieres jugar. Primy Core se ocupa de que la jugada cumpla las reglas.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primy-200 bg-primy-50/80 p-4">
              <p className="flex items-center gap-2 font-semibold text-primy-900"><CheckIcon width="18" height="18"/>Lo que sí hace</p>
              <p className="mt-2 text-sm leading-6 text-primy-900/80">Aplica reglas, valida combinaciones, calcula el coste y evita errores dentro del boleto.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-amber-950"><ShieldIcon width="18" height="18"/>Lo que nunca hace</p>
              <p className="mt-2 text-sm leading-6 text-amber-950/80">No compra boletos, no predice resultados y no puede garantizar premios.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-secondary">El historial es informativo y permanece separado de la generación.</p>
            <button type="button" onClick={() => setCoreInfoOpen(false)} className="primy-button primy-button-primary">Entendido, seguir preparando</button>
          </div>
        </div>
      </AccessibleDialog>
    </section>
  );
}
