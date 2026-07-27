import React from 'react';
import { GAMES } from '../utils/gameConfig.js';

export default function GameSwitch({ active, onChange, label = 'Gioco' }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold text-primary">{label}</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted-strong p-1.5">
        {Object.values(GAMES).map(game => (
          <button
            type="button"
            aria-pressed={active === game.id}
            key={game.id}
            onClick={() => onChange(game.id)}
            className={`min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active === game.id ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:bg-surface/60 hover:text-primary'}`}
          >
            {game.shortName}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
