import React from 'react';
import { GAMES } from '../utils/gameConfig.js';

export default function GameSwitch({ active, onChange, label = 'Juego' }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-primary">{label}</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted-strong p-1.5">
        {['primitiva', 'eurodreams'].map(gameId => GAMES[gameId]).filter(Boolean).map(game => {
          const selected = active === game.id;
          const selectedTone = game.id === 'primitiva' ? 'bg-primy-700 text-white shadow-soft' : 'bg-eurodreams text-white shadow-soft';
          return <button type="button" aria-pressed={selected} key={game.id} onClick={() => onChange(game.id)} className={`min-h-12 rounded-xl px-4 py-2.5 text-sm font-semibold ${selected ? selectedTone : 'text-secondary hover:bg-surface hover:text-primary'}`}>{game.shortName}</button>;
        })}
      </div>
    </fieldset>
  );
}
