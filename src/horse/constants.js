export const HORSE_GAME_IDS = Object.freeze(['lototurf', 'quintuple-plus']);

export const HORSE_ROUND_STATUSES = Object.freeze([
  'draft',
  'document-published',
  'sales-open',
  'sales-closed',
  'in-progress',
  'provisional',
  'official',
  'cancelled',
]);

export const HORSE_RUNNER_STATUSES = Object.freeze(['active', 'favorite', 'withdrawn', 'unknown']);

export const HORSE_EXPECTED_RACES = Object.freeze({
  lototurf: 1,
  'quintuple-plus': 5,
});

export const HORSE_MAX_RUNNERS = Object.freeze({
  lototurf: 12,
  'quintuple-plus': 20,
});
