import React, { memo, useMemo, useState } from 'react';
import {
  CalendarIcon,
  ChevronRightIcon,
  GridIcon,
  InfoIcon,
  SearchIcon,
  SparklesIcon,
  TicketIcon,
} from './Icons.jsx';
import { Eyebrow, PrimaryButton, SecondaryButton } from './DesignSystem.jsx';
import GameIdentity from './GameIdentity.jsx';
import { gameThemeStyle } from '../utils/gameVisualTheme.js';
import { formatDrawDate, formatDrawTime, getNextDrawInfo } from '../utils/drawSchedule.js';
import { gameRuleSummary, getGameConfig } from '../utils/gameConfig.js';
import {
  ACTIVE_GAME_IDS,
  AVAILABILITY_LABELS,
  GAME_CATALOG_IDS,
  GAME_FAMILIES,
  getCatalogFamily,
  searchCatalogGames,
} from '../utils/gameCatalog.js';

const STATUS_STYLES = {
  active: 'is-active',
  'rules-review': 'is-review',
  'architecture-review': 'is-planned',
  'sports-foundation': 'is-review',
  'sports-data-foundation': 'is-review',
  'quiniela-simple-beta': 'is-beta',
};

const GameCard = memo(function GameCard({ game, now, onCreate, onRegister, onOpenArchive }) {
  const family = getCatalogFamily(game.familyId);
  const active = Boolean(game.capabilities.createCombination);
  const implementedGame = active ? getGameConfig(game.id) : null;
  const draw = active && game.familyId !== 'sports' ? getNextDrawInfo(game.id, now) : null;

  return (
    <article className="primy-game-card" style={gameThemeStyle(game.id)} data-game={game.id}>
      <span className="primy-game-card__wash" aria-hidden="true" />
      <header className="primy-game-card__header">
        <GameIdentity gameId={game.id} size="lg" label={false}/>
        <span className={`primy-game-card__status ${STATUS_STYLES[game.availability] || 'is-planned'}`}>
          {AVAILABILITY_LABELS[game.availability]}
        </span>
      </header>

      <div className="primy-game-card__body">
        <p className="primy-game-card__family">{family?.shortName}</p>
        <h3>{game.name}</h3>
        <p className="primy-game-card__payoff">{game.betModel}</p>
        <p className="primy-game-card__description">{game.description}</p>

        {draw && (
          <div className="primy-game-card__draw">
            <CalendarIcon width="19" height="19" aria-hidden="true"/>
            <div><span>Próximo sorteo</span><strong>{formatDrawDate(draw.drawDateTimeISO, { includeYear: false })}</strong><small>{formatDrawTime(draw.drawDateTimeISO)}</small></div>
          </div>
        )}

        {!draw && active && implementedGame && <p className="primy-game-card__rule">{gameRuleSummary(implementedGame)}</p>}
      </div>

      <footer className="primy-game-card__footer">
        {active ? (
          <>
            <PrimaryButton onClick={() => onCreate(game.id)} icon={SparklesIcon} className="primy-game-card__primary">{game.id === 'quiniela' ? 'Preparar Quiniela' : 'Preparar'}</PrimaryButton>
            {game.capabilities.manualEntry && <SecondaryButton onClick={() => onRegister(game.id)} icon={TicketIcon}>Registrar</SecondaryButton>}
            <details className="primy-game-card__more">
              <summary>Más opciones <ChevronRightIcon width="16" height="16"/></summary>
              <div>
                <button type="button" onClick={onOpenArchive}>Abrir archivo</button>
                <p>{implementedGame ? gameRuleSummary(implementedGame) : game.betModel}</p>
              </div>
            </details>
          </>
        ) : (
          <details className="primy-game-card__preparation">
            <summary><InfoIcon width="18" height="18"/>Ver estado de preparación <ChevronRightIcon width="17" height="17"/></summary>
            <div>
              <p>{game.foundation?.phase || 'Arquitectura en definición'}</p>
              <ul>{(game.foundation?.pending || ['Reglas, experiencia y validación pendientes']).slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul>
            </div>
          </details>
        )}
      </footer>
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
      <header className="primy-games-hero">
        <div>
          <Eyebrow>Juegos</Eyebrow>
          <h1>Un universo distinto para cada juego.</h1>
          <p>Elige por color, formato o próxima fecha. Primy mantiene una experiencia común sin borrar la personalidad de cada boleto.</p>
        </div>
        <div className="primy-games-hero__stats" aria-label="Estado del catálogo">
          <span><strong>{ACTIVE_GAME_IDS.length}</strong> operativos</span>
          <span><strong>{GAME_CATALOG_IDS.length}</strong> catalogados</span>
          <span><strong>{GAME_FAMILIES.length}</strong> familias</span>
        </div>
      </header>

      <section className="primy-games-filter" aria-label="Filtros de juegos">
        <label htmlFor="game-search"><SearchIcon width="19" height="19"/><input id="game-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar un juego"/></label>
        <div aria-label="Filtrar por familia">
          <button type="button" onClick={() => setFamilyId('all')} aria-pressed={familyId === 'all'}>Todos</button>
          {GAME_FAMILIES.map(family => <button key={family.id} type="button" onClick={() => setFamilyId(family.id)} aria-pressed={familyId === family.id}>{family.shortName}</button>)}
        </div>
      </section>

      {groupedGames.length > 0 ? groupedGames.map(family => (
        <section key={family.id} className="primy-games-family" aria-labelledby={`family-${family.id}`}>
          <div className="primy-games-family__heading">
            <span aria-hidden="true"><GridIcon width="21" height="21"/></span>
            <div><h2 id={`family-${family.id}`}>{family.name}</h2><p>{family.description}</p></div>
          </div>
          <div className="primy-games-grid">
            {family.games.map(game => <GameCard key={game.id} game={game} now={now} onCreate={onCreate} onRegister={onRegister} onOpenArchive={onOpenArchive}/>) }
          </div>
        </section>
      )) : (
        <section className="primy-games-empty" role="status"><SearchIcon width="28" height="28"/><h2>No se ha encontrado ningún juego</h2><p>Prueba con otro nombre o selecciona otra familia.</p></section>
      )}

      <section className="primy-games-activity">
        <span aria-hidden="true"><TicketIcon width="22" height="22"/></span>
        <div><h2>Todo termina en un único archivo</h2><p>{activity.total} guardadas · {activity.purchased} compradas · {activity.checked} comprobadas</p></div>
        <SecondaryButton onClick={onOpenArchive}>Abrir archivo</SecondaryButton>
      </section>
    </div>
  );
}
