import React, { memo } from 'react';
import { formatDrawDate, formatDrawTime, formatSyncTime } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';
import { CalendarIcon, EditIcon, GridIcon, ListIcon, RefreshIcon, SparklesIcon } from './Icons.jsx';
import { ActionCard, Button, Card, Eyebrow, PrimaryButton, SecondaryButton, SectionHeader, StatusNotice } from './DesignSystem.jsx';
import { PrimyMascot } from './PrimyMascot.jsx';

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const shortDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

export const HomeHero = memo(function HomeHero({ nextDraw, dailyLine, displayName = '', onGenerate, onAddExternal }) {
  return (
    <Card tone="feature" padding="none" className="primy-home-v16__hero primy-page-enter" aria-labelledby="home-hero-title">
      <div className="primy-home-v16__hero-copy">
        <Eyebrow>{displayName ? `Hola, ${displayName}` : 'Tu espacio Primy'}</Eyebrow>
        <h1 id="home-hero-title" className="primy-home-v16__title">Prepara tu próxima jugada con claridad.</h1>
        <p className="primy-home-v16__lead">{dailyLine}</p>

        {nextDraw && (
          <div className="primy-home-v16__next" aria-label="Próximo sorteo de La Primitiva">
            <span className="primy-home-v16__next-icon" aria-hidden="true"><CalendarIcon width="18" height="18" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-secondary">Próximo sorteo</p>
              <p className="mt-1 text-sm font-semibold text-primary">
                <span className="capitalize">{formatDrawDate(nextDraw.drawDateTimeISO, { includeYear: false })}</span>
                {' · '}{formatDrawTime(nextDraw.drawDateTimeISO)}
              </p>
            </div>
          </div>
        )}

        <div className="primy-home-v16__actions">
          <PrimaryButton onClick={() => onGenerate('primitiva')} icon={SparklesIcon}>Preparar una jugada</PrimaryButton>
          <SecondaryButton onClick={onAddExternal} icon={EditIcon}>Registrar boleto</SecondaryButton>
        </div>

        <p className="primy-home-v16__note">Primy prepara y organiza tus jugadas. No vende boletos ni garantiza premios.</p>
      </div>

      <div className="primy-home-v16__mascot">
        <PrimyMascot role="welcome" size="hero" caption="¿Empezamos?" showCaption={false} />
      </div>
    </Card>
  );
});

export const PendingDraws = memo(function PendingDraws({ dueTotal, checking, onCheckAll }) {
  if (dueTotal <= 0) return null;
  return (
    <StatusNotice
      tone="warning"
      title={`${dueTotal} ${dueTotal === 1 ? 'jugada lista para comprobar' : 'jugadas listas para comprobar'}`}
      className="mt-5"
      action={(
        <Button variant="secondary" size="sm" onClick={onCheckAll} icon={RefreshIcon} loading={checking} loadingLabel="Comprobando…">
          Comprobar ahora
        </Button>
      )}
    >
      Los sorteos ya se han celebrado. Puedes comprobarlos cuando quieras.
    </StatusNotice>
  );
});

export const HomeOverview = memo(function HomeOverview({ monthlyStats, totals }) {
  const metrics = [
    { label: 'Gasto este mes', value: euro.format(monthlyStats.spent || 0) },
    { label: 'Premios registrados', value: euro.format(monthlyStats.won || 0) },
    { label: 'Jugadas en archivo', value: totals.plays || 0 },
  ];
  return (
    <Card tone="inset" padding="sm" className="mt-5" aria-label="Resumen de tu actividad">
      <div className="grid gap-2 sm:grid-cols-3">
        {metrics.map(metric => (
          <div key={metric.label} className="primy-home-v16__metric">
            <p className="text-xs font-semibold text-secondary">{metric.label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-primary">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
});

export const RecentPlays = memo(function RecentPlays({ plays, onOpenPlays }) {
  const play = plays[0];
  if (!play) {
    return (
      <Card tone="section" padding="md" className="mt-6">
        <SectionHeader
          eyebrow="Actividad"
          title="Tu primera jugada aparecerá aquí"
          description="Prepara una propuesta o registra un boleto comprado para empezar tu archivo."
          action={<Button variant="ghost" size="sm" onClick={onOpenPlays}>Abrir archivo</Button>}
        />
      </Card>
    );
  }
  const game = getGameConfig(play.gameId);
  return (
    <Card tone="section" padding="md" className="mt-6" aria-labelledby="latest-play-title">
      <SectionHeader
        eyebrow="Última actividad"
        title={`${game.shortName} · ${play.columns?.length || 0} ${(play.columns?.length || 0) === 1 ? 'columna' : 'columnas'}`}
        description={`${shortDate.format(new Date(play.createdAt))} · ${play.purchased ? 'Boleto registrado' : 'Borrador guardado'}`}
        action={<Button variant="ghost" size="sm" onClick={onOpenPlays}>Ver archivo</Button>}
      />
      {play.computedStatus === 'awaiting_check' && (
        <div className="mt-4"><span className="ds-badge ds-badge--warning">Pendiente de comprobar</span></div>
      )}
    </Card>
  );
});

export const HomeQuickActions = memo(function HomeQuickActions({ historyCount, dueTotal, onExplore, onOpenPlays }) {
  return (
    <section className="mt-7" aria-labelledby="next-actions-title">
      <SectionHeader eyebrow="Accesos rápidos" title="Sigue desde donde te convenga" />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ActionCard
          title="Mi archivo"
          description={historyCount ? `${historyCount} ${historyCount === 1 ? 'jugada guardada' : 'jugadas guardadas'}.` : 'Organiza y comprueba tus jugadas.'}
          icon={ListIcon}
          badge={dueTotal}
          onClick={onOpenPlays}
        />
        <ActionCard title="Todos los juegos" description="Consulta el catálogo y el estado de cada juego." icon={GridIcon} onClick={onExplore} />
      </div>
    </section>
  );
});

export const HomeFooter = memo(function HomeFooter({ drawOverview }) {
  return (
    <footer className="primy-home-v16__footer">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${drawOverview.loading ? 'bg-slate-400' : drawOverview.error ? 'bg-amber-500' : 'bg-primy-500'}`} aria-hidden="true" />
        <span>{drawOverview.loading ? 'Actualizando datos…' : drawOverview.fetchedAt ? `Datos actualizados ${formatSyncTime(drawOverview.fetchedAt)}` : 'Datos externos no disponibles'}</span>
        {drawOverview.error && <button type="button" onClick={drawOverview.reload} className="font-semibold text-primy-700">Reintentar</button>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span>Solo para mayores de 18 años.</span>
        <a href="/legal/responsible-play.html" className="font-semibold text-primy-700 hover:underline">Juego responsable</a>
      </div>
    </footer>
  );
});
