import React from 'react';
import { getGameVisualTheme, gameThemeStyle } from '../utils/gameVisualTheme.js';

export default function GameIdentity({ gameId, size = 'md', label = true, className = '' }) {
  const theme = getGameVisualTheme(gameId);
  return (
    <span className={`primy-game-identity primy-game-identity--${size} ${className}`} style={gameThemeStyle(gameId)}>
      <span className="primy-game-identity__mark" aria-hidden="true">
        {theme.icon ? <img src={theme.icon} alt="" loading="lazy" decoding="async" /> : theme.symbol}
      </span>
      {label && <span className="primy-game-identity__label">{theme.label}</span>}
    </span>
  );
}
