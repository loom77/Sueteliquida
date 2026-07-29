import React, { memo } from 'react';
import { formatDrawDate, formatDrawTime, formatSyncTime } from '../utils/drawSchedule.js';
import { PrimyMascotGraphic, PrimyMark } from './BrandVisuals.jsx';
import { CalendarIcon, EditIcon, ListIcon, RefreshIcon, SparklesIcon, TicketIcon } from './Icons.jsx';
import { ActionCard, Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';

export const BrandSignal = memo(function BrandSignal({ label = 'Primy Core' }) {
  return (
    <span className="primy-brand-signal" aria-label={label}>
      <span className="primy-brand-signal__dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
});

export const HomeHero = memo(function HomeHero({ nextDraw, dailyLine, onGenerate, onAddExternal }) {
  return (
    <section className="primy-home-hero primy-page-enter" aria-labelledby="home-hero-title">
      <div className="primy-home-hero__copy">
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>Tu espacio Primy</Eyebrow>
          <BrandSignal />
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

export const HomeQuickActions = memo(function HomeQuickActions({ historyCount, dueTotal, onExplore, onOpenPlays, onAddExternal }) {
  return (
    <section className="mt-8" aria-labelledby="next-actions-title">
      <div className="mb-4">
        <Eyebrow>Sigue con Primy</Eyebrow>
        <h2 id="next-actions-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-primary">Todo lo importante, a mano.</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ActionCard title="Explorar sorteos" description="Consulta fechas, juegos e información útil con calma." icon={CalendarIcon} onClick={onExplore} />
        <ActionCard
          title="Mi archivo"
          description={historyCount ? `${historyCount} ${historyCount === 1 ? 'jugada guardada' : 'jugadas guardadas'} en tu archivo.` : 'Guarda, organiza y comprueba tus jugadas.'}
          icon={ListIcon}
          badge={dueTotal}
          onClick={onOpenPlays}
        />
        <ActionCard title="Añadir boleto" description="Registra una jugada hecha fuera para seguirla desde Primy." icon={TicketIcon} onClick={onAddExternal} />
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
