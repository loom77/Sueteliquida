import React, { useMemo } from 'react';
import { formatDrawDate, formatDrawTime, formatSyncTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { PrimyMascotGraphic } from './BrandVisuals.jsx';
import { CalendarIcon, EditIcon, ListIcon, RefreshIcon, SparklesIcon, TicketIcon } from './Icons.jsx';
import { ActionCard, Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';

const DAILY_LINES = [
  'Cada jugada abre una nueva posibilidad.',
  'Tu próxima combinación empieza con una elección.',
  'Crea, guarda y vive cada sorteo a tu manera.',
  'Una nueva jugada. Un nuevo momento Primy.',
];

export default function DashboardView({ now, history, dueByGame, drawOverview, onGenerate, onAddExternal, onOpenPlays, onExplore, onCheckAll, checking }) {
  const dueTotal = Object.values(dueByGame).reduce((sum, count) => sum + count, 0);
  const nextDraw = useMemo(() => getNextDrawInfo('primitiva', now), [now]);
  const dailyLine = DAILY_LINES[new Date(now).getDate() % DAILY_LINES.length];

  return (
    <div className="primy-home mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="primy-home-hero primy-page-enter">
        <div className="relative z-10 max-w-2xl">
          <Eyebrow>Primy v13</Eyebrow>
          <h1 className="mt-5 text-[2.65rem] font-semibold tracking-[-0.055em] text-primary sm:text-6xl lg:text-[4.65rem]">
            Tu próxima jugada empieza aquí.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-secondary">{dailyLine}</p>

          {nextDraw && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primy-100 bg-white/70 px-4 py-2 text-sm font-semibold text-primy-800 backdrop-blur dark:bg-surface/70">
              <CalendarIcon width="18" height="18"/>
              Próximo sorteo: <span className="capitalize">{formatDrawDate(nextDraw.drawDateTimeISO, { includeYear: false })}</span> · {formatDrawTime(nextDraw.drawDateTimeISO)}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton onClick={() => onGenerate('primitiva')} icon={SparklesIcon} className="sm:min-w-[250px]">
              Crear mi jugada
            </PrimaryButton>
            <SecondaryButton onClick={onAddExternal} icon={EditIcon}>
              Añadir boleto
            </SecondaryButton>
          </div>

          <p className="mt-5 text-xs leading-5 text-secondary">Powered by <strong className="font-semibold text-primary">Primy Core</strong>. Una experiencia clara, cuidada y sin falsas promesas.</p>
        </div>

        <div className="relative z-10 hidden lg:block">
          <PrimyMascotGraphic variant="welcome" size="hero" caption="¿Listo para crear algo nuevo?" className="w-full max-w-[390px]"/>
        </div>
      </section>

      {dueTotal > 0 && (
        <section className="primy-attention mt-5" aria-label="Jugadas pendientes de comprobar">
          <div>
            <p className="font-display text-lg font-semibold text-primary">Tienes {dueTotal} {dueTotal === 1 ? 'jugada lista para comprobar' : 'jugadas listas para comprobar'}</p>
            <p className="mt-1 text-sm leading-6 text-secondary">Los sorteos ya se han celebrado. Comprueba ahora cómo ha ido.</p>
          </div>
          <SecondaryButton onClick={onCheckAll} icon={RefreshIcon} disabled={checking}>
            {checking ? 'Comprobando…' : 'Comprobar ahora'}
          </SecondaryButton>
        </section>
      )}

      <section className="mt-8" aria-labelledby="next-actions-title">
        <div className="mb-4">
          <Eyebrow>Sigue con Primy</Eyebrow>
          <h2 id="next-actions-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-primary">Todo lo que necesitas, sin ruido.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            title="Explorar sorteos"
            description="Consulta juegos, próximas fechas e información útil antes de crear."
            icon={CalendarIcon}
            onClick={onExplore}
          />
          <ActionCard
            title="Mi archivo"
            description={history.length ? `${history.length} ${history.length === 1 ? 'jugada guardada' : 'jugadas guardadas'} en tu archivo.` : 'Tu espacio para guardar, organizar y comprobar.'}
            icon={ListIcon}
            badge={dueTotal}
            onClick={onOpenPlays}
          />
          <ActionCard
            title="Añadir boleto"
            description="Registra una jugada hecha fuera y deja que Primy la siga por ti."
            icon={TicketIcon}
            onClick={onAddExternal}
          />
        </div>
      </section>

      <footer className="mt-10 flex flex-col gap-2 border-t border-default pt-5 text-xs leading-5 text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>Primy no vende boletos ni garantiza premios. Solo para mayores de edad.</p>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${drawOverview.loading ? 'bg-slate-400' : drawOverview.error ? 'bg-amber-500' : 'bg-primy-500'}`}/>
          <span>{drawOverview.loading ? 'Actualizando datos…' : drawOverview.fetchedAt ? `Datos actualizados ${formatSyncTime(drawOverview.fetchedAt)}` : 'Datos externos no disponibles'}</span>
          {drawOverview.error && <button type="button" onClick={drawOverview.reload} className="font-semibold text-primy-700">Reintentar</button>}
        </div>
      </footer>
    </div>
  );
}
