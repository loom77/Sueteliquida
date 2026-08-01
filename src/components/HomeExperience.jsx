import React, { memo, useState } from 'react';
import { formatDrawDate, formatDrawTime, formatSyncTime } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import { PrimyMascotGraphic, PrimyMark } from './BrandVisuals.jsx';
import { CalendarIcon, EditIcon, InfoIcon, ListIcon, RefreshIcon, SparklesIcon } from './Icons.jsx';
import { ActionCard, Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';
import PrimyCoreDialog from './PrimyCoreDialog.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const shortDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

export const BrandSignal = memo(function BrandSignal({ label = 'Cómo funciona Primy Core', onClick }) {
  return (
    <button
      type="button"
      className="primy-brand-signal primy-home-core-trigger"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-controls="primy-core-info-dialog"
    >
      <span className="primy-brand-signal__dot" aria-hidden="true" />
      <InfoIcon width="16" height="16" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
});

export const HomeHero = memo(function HomeHero({ nextDraw, dailyLine, onGenerate, onAddExternal }) {
  const [coreInfoOpen, setCoreInfoOpen] = useState(false);

  return (
    <section className="primy-home-hero primy-page-enter" aria-labelledby="home-hero-title">
      <div className="primy-home-hero__copy">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>Tu espacio Primy</Eyebrow>
          <BrandSignal onClick={() => setCoreInfoOpen(true)} />
        </div>

        <h1 id="home-hero-title" className="primy-home-hero__title">
          Crea tu jugada en pocos instantes.
        </h1>
        <p className="primy-home-hero__lead">{dailyLine}</p>

        {nextDraw && (
          <div className="primy-next-draw" aria-label="Próximo sorteo de La Primitiva">
            <span className="primy-next-draw__icon" aria-hidden="true"><CalendarIcon width="18" height="18" /></span>
            <div>
              <p className="primy-next-draw__label">Próximo sorteo</p>
              <p className="primy-next-draw__value">
                <span className="capitalize">{formatDrawDate(nextDraw.drawDateTimeISO, { includeYear: false })}</span>
                {' · '}{formatDrawTime(nextDraw.drawDateTimeISO)}
              </p>
            </div>
          </div>
        )}

        <div className="primy-home-hero__actions">
          <PrimaryButton onClick={() => onGenerate('primitiva')} icon={SparklesIcon} className="sm:min-w-[250px]">
            Crear mi jugada
          </PrimaryButton>
          <SecondaryButton onClick={onAddExternal} icon={EditIcon}>
            Añadir boleto
          </SecondaryButton>
        </div>

        <p className="primy-home-hero__note">
          Primy te ayuda a crear, guardar y comprobar tus jugadas. No predice sorteos ni garantiza premios.
        </p>
      </div>

      <div className="primy-home-hero__visual" aria-hidden="true">
        <span className="primy-home-hero__fold"><PrimyMark className="h-full w-full" title="" /></span>
        <PrimyMascotGraphic
          variant="welcome"
          size="hero"
          caption="¿Empezamos?"
          className="primy-home-mascot"
          showCaption
        />
      </div>

      <PrimyCoreDialog open={coreInfoOpen} onClose={() => setCoreInfoOpen(false)} />
    </section>
  );
});

export const PendingDraws = memo(function PendingDraws({ dueTotal, checking, onCheckAll }) {
  if (dueTotal <= 0) return null;
  return (
    <section className="primy-attention mt-5" aria-label="Jugadas pendientes de comprobar">
      <div>
        <p className="font-display text-lg font-semibold text-primary">
          Tienes {dueTotal} {dueTotal === 1 ? 'jugada lista para comprobar' : 'jugadas listas para comprobar'}
        </p>
        <p className="mt-1 text-sm leading-6 text-secondary">Los sorteos ya se han celebrado. Comprueba cómo ha ido cuando quieras.</p>
      </div>
      <SecondaryButton onClick={onCheckAll} icon={RefreshIcon} disabled={checking}>
        {checking ? 'Comprobando…' : 'Comprobar ahora'}
      </SecondaryButton>
    </section>
  );
});

export const HomeOverview = memo(function HomeOverview({ monthlyStats, totals }) {
  const metrics = [
    { label: 'Gasto este mes', value: euro.format(monthlyStats.spent || 0), detail: `${monthlyStats.plays || 0} ${monthlyStats.plays === 1 ? 'jugada comprada' : 'jugadas compradas'}` },
    { label: 'Premios registrados', value: euro.format(monthlyStats.won || 0), detail: 'Solo importes conocidos' },
    { label: 'Archivo total', value: totals.plays || 0, detail: `${totals.columns || 0} ${totals.columns === 1 ? 'columna' : 'columnas'}` },
  ];
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumen de tu actividad">
      {metrics.map(metric => (
        <div key={metric.label} className="rounded-2xl border border-default bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-secondary">{metric.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-primary">{metric.value}</p>
          <p className="mt-1 text-xs leading-5 text-secondary">{metric.detail}</p>
        </div>
      ))}
    </section>
  );
});

export const RecentPlays = memo(function RecentPlays({ plays, onOpenPlays }) {
  const recent = plays.slice(0, 2);
  if (!recent.length) return null;
  return (
    <details className="mt-6 rounded-2xl border border-default bg-surface p-4">
      <summary className="cursor-pointer font-semibold text-primary">Últimas jugadas</summary>
      <div className="mt-4 space-y-2">
        {recent.map(play => {
          const game = getGameConfig(play.gameId);
          return (
            <div key={play.id} className="flex items-center justify-between gap-4 rounded-xl bg-muted px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{game.shortName} · {play.columns?.length || 0} {(play.columns?.length || 0) === 1 ? 'columna' : 'columnas'}</p>
                <p className="mt-1 text-xs text-secondary">{shortDate.format(new Date(play.createdAt))} · {play.purchased ? 'Registrada' : 'Borrador'}</p>
              </div>
              {play.computedStatus === 'awaiting_check' && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Comprobar</span>}
            </div>
          );
        })}
        <button type="button" onClick={onOpenPlays} className="min-h-11 w-full rounded-xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted">Abrir archivo completo</button>
      </div>
    </details>
  );
});

export const HomeQuickActions = memo(function HomeQuickActions({ historyCount, dueTotal, onExplore, onOpenPlays }) {
  return (
    <section className="mt-8" aria-labelledby="next-actions-title">
      <div className="mb-4">
        <Eyebrow>Sigue con Primy</Eyebrow>
        <h2 id="next-actions-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-primary">Dos accesos, sin ruido.</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ActionCard
          title="Mi archivo"
          description={historyCount ? `${historyCount} ${historyCount === 1 ? 'jugada guardada' : 'jugadas guardadas'} en tu archivo.` : 'Guarda, organiza y comprueba tus jugadas.'}
          icon={ListIcon}
          badge={dueTotal}
          onClick={onOpenPlays}
        />
        <ActionCard title="Todos los juegos" description="Consulta el catálogo completo y el estado de cada juego." icon={CalendarIcon} onClick={onExplore} />
      </div>
    </section>
  );
});

export const HomeFooter = memo(function HomeFooter({ drawOverview }) {
  return (
    <footer className="primy-home-footer">
      <p>Primy no vende boletos. Uso exclusivo para mayores de 18 años.</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${drawOverview.loading ? 'bg-slate-400' : drawOverview.error ? 'bg-amber-500' : 'bg-primy-500'}`} />
        <span>{drawOverview.loading ? 'Actualizando datos…' : drawOverview.fetchedAt ? `Datos actualizados ${formatSyncTime(drawOverview.fetchedAt)}` : 'Datos externos no disponibles'}</span>
        {drawOverview.error && <button type="button" onClick={drawOverview.reload} className="font-semibold text-primy-700">Reintentar</button>}
        <a href="/legal/responsible-play.html" className="font-semibold text-primy-700 hover:underline">Juego responsable</a>
      </div>
    </footer>
  );
});
