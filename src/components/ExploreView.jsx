import React, { memo, useMemo, useState } from 'react';
import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  GridIcon,
  InfoIcon,
  SearchIcon,
  SparklesIcon,
  TicketIcon,
} from './Icons.jsx';
import { Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';
import { formatDrawDate, formatDrawTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { gameRuleSummary, getGameConfig } from '../utils/gameConfig.js';
import {
  ACTIVE_GAME_IDS,
  AVAILABILITY_LABELS,
  CAPABILITY_LABELS,
  GAME_CATALOG_IDS,
  GAME_FAMILIES,
  getCatalogFamily,
  searchCatalogGames,
} from '../utils/gameCatalog.js';

const STATUS_STYLES = {
  active: 'border-primy-200 bg-primy-50 text-primy-800',
  'rules-review': 'border-amber-200 bg-amber-50 text-amber-800',
  'architecture-review': 'border-slate-200 bg-slate-50 text-slate-700',
  'sports-foundation': 'border-sky-200 bg-sky-50 text-sky-800',
};

function CapabilityList({ capabilities }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Funciones previstas">
      {Object.entries(CAPABILITY_LABELS).map(([capability, label]) => {
        const available = Boolean(capabilities[capability]);
        return (
          <li
            key={capability}
            className={available
              ? 'inline-flex items-center gap-1.5 rounded-full border border-primy-200 bg-primy-50 px-2.5 py-1 text-xs font-semibold text-primy-800'
              : 'inline-flex items-center gap-1.5 rounded-full border border-default bg-muted px-2.5 py-1 text-xs font-semibold text-secondary'}
          >
            {available && <CheckIcon width="14" height="14" aria-hidden="true"/>}
            {label}
          </li>
        );
      })}
    </ul>
  );
}

const GameCard = memo(function GameCard({ game, now, onCreate, onRegister }) {
  const family = getCatalogFamily(game.familyId);
  const active = game.availability === 'active';
  const implementedGame = active ? getGameConfig(game.id) : null;
  const draw = active ? getNextDrawInfo(game.id, now) : null;

  return (
    <article className="primy-panel flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primy-700">{family?.shortName}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-primary">{game.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[game.availability] || STATUS_STYLES['architecture-review']}`}>
          {AVAILABILITY_LABELS[game.availability]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-secondary">{game.description}</p>

      <div className="mt-4 rounded-2xl border border-default bg-surface/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Modelo de boleto</p>
        <p className="mt-1 font-semibold text-primary">{game.betModel}</p>
        {active && implementedGame && (
          <p className="mt-2 text-sm text-secondary">
            {gameRuleSummary(implementedGame)}
          </p>
        )}
      </div>

      {draw && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primy-100 bg-primy-50/70 p-4">
          <CalendarIcon width="20" height="20" className="mt-0.5 shrink-0 text-primy-700" aria-hidden="true"/>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Próximo sorteo</p>
            <p className="mt-1 font-semibold capitalize text-primary">{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</p>
            <p className="mt-1 text-sm text-secondary">A las {formatDrawTime(draw.drawDateTimeISO)}</p>
          </div>
        </div>
      )}

      <CapabilityList capabilities={game.capabilities}/>

      <div className="mt-auto pt-5">
        {active ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton onClick={() => onCreate(game.id)} icon={SparklesIcon} className="w-full">Crear</PrimaryButton>
            <SecondaryButton onClick={() => onRegister(game.id)} icon={TicketIcon} className="w-full">Registrar</SecondaryButton>
          </div>
        ) : (
          <details className="group rounded-2xl border border-default bg-surface">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-primary marker:hidden">
              <span className="flex items-center gap-2"><InfoIcon width="18" height="18" aria-hidden="true"/>Ver ficha de preparación</span>
              <ChevronRightIcon width="18" height="18" className="transition-transform group-open:rotate-90" aria-hidden="true"/>
            </summary>
            <div className="border-t border-default px-4 py-4 text-sm leading-6 text-secondary">
              {game.availability === 'sports-foundation' ? (
                <>
                  <p>La base matemática ya está implementada y permanece aislada de los juegos numéricos. Las acciones siguen bloqueadas hasta completar datos oficiales, boleto, persistencia y comprobación.</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-sky-800">Completado</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {(game.foundation?.completed || []).map(item => <li key={item}>{item}</li>)}
                  </ul>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-secondary">Siguiente gate</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {(game.foundation?.pending || []).map(item => <li key={item}>{item}</li>)}
                  </ul>
                </>
              ) : (
                <>
                  <p>Este juego ya forma parte del catálogo, pero sus acciones permanecen bloqueadas hasta validar reglas, boleto, resultados oficiales, accesibilidad y pruebas.</p>
                  <p className="mt-2 font-semibold text-primary">No se mostrará una función simulada como si estuviera terminada.</p>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </article>
  );
});

export default function ExploreView({ now, history, onCreate, onRegister, onOpenArchive }) {
  const [query, setQuery] = useState('');
  const [familyId, setFamilyId] = useState('all');
  const filteredGames = useMemo(() => searchCatalogGames(query, familyId), [query, familyId]);
  const activity = useMemo(() => {
    const checked = history.filter(play => play.status === 'checked').length;
    const purchased = history.filter(play => play.purchased).length;
    return { total: history.length, checked, purchased };
  }, [history]);

  const groupedGames = useMemo(() => GAME_FAMILIES
    .map(family => ({ ...family, games: filteredGames.filter(game => game.familyId === family.id) }))
    .filter(family => family.games.length > 0), [filteredGames]);

  return (
    <div className="primy-page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-4xl">
        <Eyebrow>Juegos</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-primary sm:text-5xl">Todos los juegos, una estructura clara.</h1>
        <p className="mt-4 text-base leading-7 text-secondary">
          El catálogo reúne los diez juegos principales de SELAE. Solo aparecen activas las funciones ya verificadas por producto, desarrollo, reglas y diseño.
        </p>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Estado del catálogo">
        <div className="rounded-2xl border border-default bg-surface p-4">
          <p className="text-sm text-secondary">Juegos catalogados</p>
          <p className="mt-1 font-display text-3xl font-semibold text-primary">{GAME_CATALOG_IDS.length}</p>
        </div>
        <div className="rounded-2xl border border-default bg-surface p-4">
          <p className="text-sm text-secondary">Familias de juego</p>
          <p className="mt-1 font-display text-3xl font-semibold text-primary">{GAME_FAMILIES.length}</p>
        </div>
        <div className="rounded-2xl border border-primy-200 bg-primy-50 p-4">
          <p className="text-sm text-secondary">Operativos ahora</p>
          <p className="mt-1 font-display text-3xl font-semibold text-primy-800">{ACTIVE_GAME_IDS.length}</p>
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-default bg-surface p-4 sm:p-5" aria-label="Filtros de juegos">
        <label htmlFor="game-search" className="text-sm font-semibold text-primary">Buscar un juego</label>
        <div className="relative mt-2">
          <SearchIcon width="19" height="19" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary" aria-hidden="true"/>
          <input
            id="game-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Ej.: Euromillones, Quiniela…"
            className="min-h-12 w-full rounded-2xl border border-default bg-app pl-11 pr-4 text-base text-primary outline-none focus:border-primy-500 focus:ring-2 focus:ring-primy-100"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por familia">
          <button
            type="button"
            onClick={() => setFamilyId('all')}
            aria-pressed={familyId === 'all'}
            className={familyId === 'all' ? 'min-h-10 rounded-full bg-primy-700 px-4 text-sm font-semibold text-white' : 'min-h-10 rounded-full border border-default px-4 text-sm font-semibold text-primary hover:bg-muted'}
          >
            Todos
          </button>
          {GAME_FAMILIES.map(family => (
            <button
              key={family.id}
              type="button"
              onClick={() => setFamilyId(family.id)}
              aria-pressed={familyId === family.id}
              className={familyId === family.id ? 'min-h-10 rounded-full bg-primy-700 px-4 text-sm font-semibold text-white' : 'min-h-10 rounded-full border border-default px-4 text-sm font-semibold text-primary hover:bg-muted'}
            >
              {family.shortName}
            </button>
          ))}
        </div>
      </section>

      {groupedGames.length > 0 ? groupedGames.map(family => (
        <section key={family.id} className="mt-10" aria-labelledby={`family-${family.id}`}>
          <div className="flex items-start gap-3">
            <span className="primy-action-icon" aria-hidden="true"><GridIcon width="22" height="22"/></span>
            <div>
              <h2 id={`family-${family.id}`} className="text-2xl font-semibold tracking-[-.035em] text-primary">{family.name}</h2>
              <p className="mt-1 text-sm leading-6 text-secondary">{family.description}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {family.games.map(game => (
              <GameCard key={game.id} game={game} now={now} onCreate={onCreate} onRegister={onRegister}/>
            ))}
          </div>
        </section>
      )) : (
        <section className="mt-10 rounded-3xl border border-default bg-surface p-8 text-center" role="status">
          <SearchIcon width="28" height="28" className="mx-auto text-secondary" aria-hidden="true"/>
          <h2 className="mt-3 text-xl font-semibold text-primary">No se ha encontrado ningún juego</h2>
          <p className="mt-2 text-sm text-secondary">Prueba con otro nombre o selecciona otra familia.</p>
        </section>
      )}

      <section className="mt-10 grid gap-4 md:grid-cols-[1.25fr_.75fr]">
        <article className="primy-panel p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="primy-action-icon" aria-hidden="true"><TicketIcon width="22" height="22"/></span>
            <div>
              <h2 className="text-xl font-semibold text-primary">Tu actividad sigue unificada</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">Has guardado {activity.total} {activity.total === 1 ? 'jugada' : 'jugadas'}, marcado {activity.purchased} como compradas y comprobado {activity.checked}.</p>
            </div>
          </div>
          <SecondaryButton onClick={onOpenArchive} className="mt-5">Abrir archivo</SecondaryButton>
        </article>

        <aside className="primy-callout">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primy-800">Regla del equipo</p>
          <p className="mt-2 text-lg font-semibold text-primary">Una función solo se activa cuando está completa.</p>
          <p className="mt-2 text-sm leading-6 text-secondary">UX, arquitectura, reglas y diseño deben aprobar cada juego antes de publicarlo.</p>
        </aside>
      </section>
    </div>
  );
}
