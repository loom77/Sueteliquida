import React, { memo, useMemo, useState } from 'react';
import { CalendarIcon, ChartIcon, SparklesIcon } from './Icons.jsx';
import { Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';
import { formatDrawDate, formatDrawTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { getGameConfig } from '../utils/gameConfig.js';

const GAME_IDS = ['primitiva', 'eurodreams'];

const GameCard = memo(function GameCard({ gameId, now, onCreate }) {
  const game = getGameConfig(gameId);
  const draw = getNextDrawInfo(gameId, now);

  return (
    <article className="primy-explore-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primy-700">{game.shortName}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-primary">{game.name}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {game.numbersPerColumn} números del 1 al {game.numberPoolMax} · {game.extra.label} del {game.extra.min} al {game.extra.max}
          </p>
        </div>
        <span className="primy-action-icon" aria-hidden="true"><CalendarIcon width="22" height="22"/></span>
      </div>

      {draw && (
        <div className="mt-6 rounded-2xl border border-default bg-surface/75 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Próximo sorteo</p>
          <p className="mt-1 font-display text-lg font-semibold capitalize text-primary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</p>
          <p className="mt-1 text-sm text-secondary">A las {formatDrawTime(draw.drawDateTimeISO)}</p>
        </div>
      )}

      <PrimaryButton onClick={() => onCreate(gameId)} icon={SparklesIcon} className="mt-5 w-full">
        Crear mi jugada
      </PrimaryButton>
    </article>
  );
});

export default function ExploreView({ now, history, onCreate, onOpenArchive }) {
  const [showContext, setShowContext] = useState(false);
  const activity = useMemo(() => {
    const checked = history.filter(play => play.status === 'checked').length;
    const purchased = history.filter(play => play.purchased).length;
    return { total: history.length, checked, purchased };
  }, [history]);

  return (
    <div className="primy-page-enter mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-3xl">
        <Eyebrow>Explorar</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-primary sm:text-5xl">Todo lo importante antes del próximo sorteo.</h1>
        <p className="mt-4 text-base leading-7 text-secondary">Consulta fechas, reglas y tu actividad cuando lo necesites. Crear una jugada sigue siendo una experiencia aparte.</p>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Juegos disponibles">
        {GAME_IDS.map(gameId => <GameCard key={gameId} gameId={gameId} now={now} onCreate={onCreate}/>) }
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-[1.25fr_.75fr]">
        <article className="primy-panel p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="primy-action-icon" aria-hidden="true"><ChartIcon width="22" height="22"/></span>
            <div>
              <h2 className="text-xl font-semibold text-primary">Tu actividad, de un vistazo</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">Has guardado {activity.total} {activity.total === 1 ? 'jugada' : 'jugadas'}, marcado {activity.purchased} como compradas y comprobado {activity.checked}.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <SecondaryButton onClick={onOpenArchive}>Abrir archivo</SecondaryButton>
            <button
              type="button"
              onClick={() => setShowContext(value => !value)}
              aria-expanded={showContext}
              aria-controls="explore-context"
              className="min-h-11 rounded-2xl border border-default px-4 text-sm font-semibold text-primary hover:bg-muted"
            >
              {showContext ? 'Ocultar contexto' : 'Cómo leer estos datos'}
            </button>
          </div>
          {showContext && (
            <div id="explore-context" className="mt-5 rounded-2xl bg-muted p-4 text-sm leading-6 text-secondary">
              El archivo resume lo que ya has hecho. No convierte una frecuencia, un retraso o una coincidencia pasada en una señal sobre el próximo sorteo.
            </div>
          )}
        </article>

        <aside className="primy-callout">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primy-800">Primy Core</p>
          <p className="mt-2 text-lg font-semibold text-primary">Cada combinación empieza de cero.</p>
          <p className="mt-2 text-sm leading-6 text-secondary">El pasado se puede explorar. La próxima extracción sigue siendo impredecible.</p>
        </aside>
      </section>
    </div>
  );
}
