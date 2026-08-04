export const QUINTUPLE_PLUS_PRICE = 1;
export const QUINTUPLE_PLUS_RACES = 5;
export const QUINTUPLE_PLUS_ROWS = 6;
export const QUINTUPLE_PLUS_HORSE_MIN = 1;
export const QUINTUPLE_PLUS_HORSE_MAX = 20;
export const QUINTUPLE_PLUS_MAX_BETS = 65_535;

function normalizeHorse(value, max = QUINTUPLE_PLUS_HORSE_MAX) {
  const number = Number(value);
  return Number.isInteger(number) && number >= QUINTUPLE_PLUS_HORSE_MIN && number <= max ? number : null;
}

function normalizeRow(values, max = QUINTUPLE_PLUS_HORSE_MAX) {
  const source = Array.isArray(values) ? values : [values];
  return [...new Set(source.map(value => normalizeHorse(value, max)).filter(value => value != null))]
    .sort((left, right) => left - right);
}

export function quintuplePlusEquivalentBets(rows) {
  if (!Array.isArray(rows) || rows.length !== QUINTUPLE_PLUS_ROWS) return 0;
  const normalized = rows.map(row => normalizeRow(row));
  if (normalized.some(row => row.length === 0)) return 0;
  const firstFour = normalized.slice(0, 4).reduce((product, row) => product * row.length, 1);
  const fifthWinners = normalized[4];
  const fifthSeconds = normalized[5];
  const overlap = fifthWinners.filter(horse => fifthSeconds.includes(horse)).length;
  const validFifthPairs = (fifthWinners.length * fifthSeconds.length) - overlap;
  return firstFour * validFifthPairs;
}

export function sanitizeQuintuplePlusSelection(selection = {}) {
  const rawRows = selection.rows || [
    selection.race1,
    selection.race2,
    selection.race3,
    selection.race4,
    selection.race5Winner,
    selection.race5Second,
  ];
  if (!Array.isArray(rawRows) || rawRows.length !== QUINTUPLE_PLUS_ROWS) return null;
  const runnerLimits = Array.isArray(selection.runnerCounts) && selection.runnerCounts.length === QUINTUPLE_PLUS_RACES
    ? selection.runnerCounts.map(count => Math.min(QUINTUPLE_PLUS_HORSE_MAX, Math.max(3, Number(count) || QUINTUPLE_PLUS_HORSE_MAX)))
    : Array(QUINTUPLE_PLUS_RACES).fill(QUINTUPLE_PLUS_HORSE_MAX);
  const rows = rawRows.map((row, index) => normalizeRow(row, runnerLimits[Math.min(index, 4)]));
  if (rows.some(row => row.length === 0)) return null;
  const equivalentBets = quintuplePlusEquivalentBets(rows);
  if (!equivalentBets || equivalentBets > QUINTUPLE_PLUS_MAX_BETS) return null;
  return {
    rows,
    runnerCounts: runnerLimits,
    equivalentBets,
    betType: rows.every(row => row.length === 1) ? 'simple' : 'multiple',
    cost: equivalentBets * QUINTUPLE_PLUS_PRICE,
  };
}

export function classifyQuintuplePlusForecast(forecast, result) {
  const selection = sanitizeQuintuplePlusSelection({ rows: forecast?.rows || forecast });
  const official = sanitizeQuintuplePlusSelection({ rows: result?.rows || result });
  if (!selection || !official || official.rows.some(row => row.length !== 1)) return null;
  const winners = official.rows.slice(0, 5).map(row => row[0]);
  const secondFifth = official.rows[5][0];
  const picks = selection.rows.slice(0, 5);
  const winningMatches = winners.reduce((total, winner, index) => total + (picks[index].includes(winner) ? 1 : 0), 0);
  const secondMatch = selection.rows[5].includes(secondFifth);
  let category = null;
  if (winningMatches === 5 && secondMatch) category = 1;
  else if (winningMatches === 5) category = 2;
  else if (winningMatches === 4 && secondMatch) category = 3;
  else if (winningMatches === 4) category = 4;
  return {
    winningMatches,
    secondMatch,
    category,
    categoryLabel: category ? `${category}.ª categoría` : null,
    specialEligible: category === 1,
  };
}

export function resolveWithdrawnHorse(selectedHorse, activeHorses, maxHorse = QUINTUPLE_PLUS_HORSE_MAX) {
  const selected = normalizeHorse(selectedHorse, maxHorse);
  const active = normalizeRow(activeHorses, maxHorse);
  if (selected == null || active.length === 0) return null;
  if (active.includes(selected)) return selected;
  let candidate = selected;
  for (let step = 0; step < maxHorse; step += 1) {
    candidate = candidate === 1 ? maxHorse : candidate - 1;
    if (active.includes(candidate)) return candidate;
  }
  return null;
}

export function createSimpleQuintupleForecast(runnerCounts, randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))) {
  if (!Array.isArray(runnerCounts) || runnerCounts.length !== QUINTUPLE_PLUS_RACES) throw new Error('Se necesitan cinco carreras oficiales.');
  const limits = runnerCounts.map(count => {
    const normalized = Number(count);
    if (!Number.isInteger(normalized) || normalized < 3 || normalized > QUINTUPLE_PLUS_HORSE_MAX) throw new Error('Cada carrera debe tener entre 3 y 20 caballos.');
    return normalized;
  });
  const rows = limits.map(limit => [randomInt(1, limit)]);
  let second = randomInt(1, limits[4]);
  while (second === rows[4][0]) second = randomInt(1, limits[4]);
  rows.push([second]);
  return sanitizeQuintuplePlusSelection({ rows, runnerCounts: limits });
}
