export const GAMES = {
  eurodreams: {
    id: 'eurodreams',
    name: 'EuroDreams',
    shortName: 'EuroDreams',
    numberPoolMax: 40,
    numbersToPick: 6,
    price: 2.5,
    extra: { key: 'sueno', label: 'Sogno', min: 1, max: 5 },
    hasComplementary: false,
    drawDays: [1, 4],
    drawTime: { hour: 21, minute: 0 },
    salesCloseTime: { hour: 20, minute: 30 },
    resultPublicationTime: { hour: 21, minute: 40 },
    resultDelayMinutes: 40,
    apiSlug: 'eurodreams',
    accent: 'violet',
    payoff: '20.000 € al mese per 30 anni',
  },
  primitiva: {
    id: 'primitiva',
    name: 'La Primitiva',
    shortName: 'Primitiva',
    numberPoolMax: 49,
    numbersToPick: 6,
    price: 1,
    extra: { key: 'reintegro', label: 'Reintegro', min: 0, max: 9 },
    hasComplementary: true,
    drawDays: [1, 4, 6],
    drawTime: { hour: 21, minute: 40 },
    salesCloseTime: { hour: 21, minute: 15 },
    resultPublicationTime: { hour: 22, minute: 0 },
    resultDelayMinutes: 20,
    apiSlug: 'primitiva',
    accent: 'indigo',
    payoff: 'Jackpot variabile',
  },
};

export const DEFAULT_GAME = 'primitiva';

export function getGameConfig(gameId) {
  return GAMES[gameId] || GAMES[DEFAULT_GAME];
}
