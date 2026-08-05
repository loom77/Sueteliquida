export const SPORTS_GAME_IDS = Object.freeze(['quiniela', 'quinigol']);

export const SPORTS_ROUND_STATUSES = Object.freeze([
  'draft',
  'published',
  'sales-open',
  'sales-closed',
  'in-progress',
  'provisional',
  'official',
  'cancelled',
]);

export const SPORTS_MATCH_STATUSES = Object.freeze([
  'scheduled',
  'live',
  'finished',
  'postponed',
  'cancelled',
  'excluded',
]);

export const SPORTS_PREDICTION_TYPES = Object.freeze([
  'one-x-two',
  'pleno15',
  'score-buckets',
]);

export const QUINIELA_SYMBOLS = Object.freeze(['1', 'X', '2']);
export const GOAL_BUCKETS = Object.freeze(['0', '1', '2', 'M']);
export const QUINIELA_MATCH_COUNT = 15;
export const QUINIELA_REGULAR_MATCH_COUNT = 14;
export const QUINIELA_UNIT_PRICE = 0.75;
export const ELIGE8_UNIT_PRICE = 0.5;
export const QUINIELA_MAX_DEVELOPED_BETS = 31_104;

export const QUINIGOL_MATCH_COUNT = 6;
export const QUINIGOL_UNIT_PRICE = 1;
export const QUINIGOL_MAX_DEVELOPED_BETS = 10_368;

export const SPORTS_FOUNDATION_VERSION = '17.0.2';
export const SPORTS_MODEL_VERSION = 'football-goals-dc-v1';
