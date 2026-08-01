import React from 'react';
import { GAMES } from '../utils/gameConfig.js';
import { getGameVisualTheme, gameThemeStyle } from '../utils/gameVisualTheme.js';
import GameIdentity from './GameIdentity.jsx';
import { CheckIcon } from './Icons.jsx';

const ACTIVE_GAME_ORDER = ['primitiva', 'bonoloto', 'euromillones', 'gordoprimitiva', 'eurodreams', 'loteria-nacional', 'quiniela'];
const LEGACY_SELECTOR_ACTIONS = 'primy-bonoloto-action primy-euromillones-action';

export default function GameSwitch({ active, onChange, label = 'Juego', disabled = false }) {
  return (
    <fieldset className="primy-game-picker" disabled={disabled}>
      <legend className="primy-game-picker__legend">{label}</legend>
      <div className="primy-game-picker__track" data-legacy-actions={LEGACY_SELECTOR_ACTIONS}>
        {ACTIVE_GAME_ORDER.map(gameId => GAMES[gameId]).filter(Boolean).map(game => {
          const selected = active === game.id;
          const theme = getGameVisualTheme(game.id);
          return (
            <button
              type="button"
              aria-pressed={selected}
              key={game.id}
              onClick={() => onChange(game.id)}
              className="primy-game-picker__option"
              data-selected={selected ? 'true' : 'false'}
              data-game={game.id}
              data-legacy-action={theme.legacyActionClass}
              style={gameThemeStyle(game.id)}
            >
              <GameIdentity gameId={game.id} size="sm" label={false}/>
              <span className="primy-game-picker__name">{game.shortName}</span>
              <span className="primy-game-picker__check" aria-hidden="true"><CheckIcon width="14" height="14"/></span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
