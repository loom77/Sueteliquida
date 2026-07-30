import React from 'react';
import { GAMES } from '../utils/gameConfig.js';

const ACTIVE_GAME_ORDER = ['primitiva', 'bonoloto', 'euromillones', 'eurodreams'];

function selectedTone(gameId) {
  if (gameId === 'primitiva') return 'bg-primy-700 text-white shadow-soft';
  if (gameId === 'bonoloto') return 'primy-bonoloto-action shadow-soft';
  if (gameId === 'euromillones') return 'primy-euromillones-action shadow-soft';
  return 'bg-eurodreams text-white shadow-soft';
}

export default function GameSwitch({ active, onChange, label = 'Juego' }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-primary">{label}</legend>
      <div className="grid grid-cols-1 gap-2 rounded-2xl bg-muted-strong p-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIVE_GAME_ORDER.map(gameId => GAMES[gameId]).filter(Boolean).map(game => {
          const selected = active === game.id;
          return (
            <button
              type="button"
              aria-pressed={selected}
              key={game.id}
              onClick={() => onChange(game.id)}
              className={`min-h-12 rounded-xl px-3 py-2.5 text-sm font-semibold ${selected ? selectedTone(game.id) : 'text-secondary hover:bg-surface hover:text-primary'}`}
            >
              {game.shortName}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
