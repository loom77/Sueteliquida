export const GAMES = {
  eurodreams: {
    id: 'eurodreams', name: 'EuroDreams', numberPoolMax: 40, numbersToPick: 6, price: 2.5,
    extra: { key: 'sueno', label: 'Sueño', min: 1, max: 5 }, hasComplementary: false,
    drawDays: [1, 4], drawTimeHour: 22, apiSlug: 'eurodreams',
  },
  primitiva: {
    id: 'primitiva', name: 'La Primitiva', numberPoolMax: 49, numbersToPick: 6, price: 1,
    extra: { key: 'reintegro', label: 'Reintegro', min: 0, max: 9 }, hasComplementary: true,
    drawDays: [1, 4, 6], drawTimeHour: 22, apiSlug: 'primitiva',
  },
};
export const DEFAULT_GAME = 'eurodreams';
export function getGameConfig(gameId) { return GAMES[gameId] || GAMES[DEFAULT_GAME]; }
