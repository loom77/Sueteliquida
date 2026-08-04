export const LOTOTURF_PRICE = 1;
export const LOTOTURF_NUMBER_MIN = 1;
export const LOTOTURF_NUMBER_MAX = 31;
export const LOTOTURF_NUMBERS_PER_BET = 6;
export const LOTOTURF_HORSE_MIN = 1;
export const LOTOTURF_HORSE_MAX = 12;
export const LOTOTURF_MAX_SIMPLE_BETS = 6;
export const LOTOTURF_MULTIPLE_NUMBER_COUNTS = Object.freeze([6, 7, 8, 9, 10]);
export const LOTOTURF_MULTIPLE_HORSE_COUNTS = Object.freeze([1, 2, 3, 4]);

function integerRange(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function uniqueSorted(values, min, max) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(value => integerRange(value, min, max)).filter(value => value != null))]
    .sort((left, right) => left - right);
}

export function combinationCount(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) return 0;
  const size = Math.min(k, n - k);
  let result = 1;
  for (let index = 1; index <= size; index += 1) result = (result * (n - size + index)) / index;
  return Math.round(result);
}

export function lototurfEquivalentBets(numberCount, horseCount) {
  const numbers = integerRange(numberCount, LOTOTURF_NUMBERS_PER_BET, 10);
  const horses = integerRange(horseCount, LOTOTURF_HORSE_MIN, 4);
  if (numbers == null || horses == null) return 0;
  return combinationCount(numbers, LOTOTURF_NUMBERS_PER_BET) * horses;
}

export function sanitizeLototurfSelection(selection = {}) {
  const numbers = uniqueSorted(selection.numbers, LOTOTURF_NUMBER_MIN, LOTOTURF_NUMBER_MAX);
  const horses = uniqueSorted(selection.horses ?? [selection.horse], LOTOTURF_HORSE_MIN, LOTOTURF_HORSE_MAX);
  const validNumberCount = LOTOTURF_MULTIPLE_NUMBER_COUNTS.includes(numbers.length);
  const validHorseCount = LOTOTURF_MULTIPLE_HORSE_COUNTS.includes(horses.length);
  if (!validNumberCount || !validHorseCount) return null;
  const equivalentBets = lototurfEquivalentBets(numbers.length, horses.length);
  if (!equivalentBets || equivalentBets > 840) return null;
  return {
    numbers,
    horses,
    equivalentBets,
    betType: numbers.length === LOTOTURF_NUMBERS_PER_BET && horses.length === 1 ? 'simple' : 'multiple',
    cost: equivalentBets * LOTOTURF_PRICE,
  };
}

export function validateLototurfSimpleColumns(columns) {
  if (!Array.isArray(columns) || columns.length < 1 || columns.length > LOTOTURF_MAX_SIMPLE_BETS) return false;
  return columns.every(column => {
    const selection = sanitizeLototurfSelection({ numbers: column?.numbers, horse: column?.horse ?? column?.extra });
    return selection?.betType === 'simple';
  });
}

export function resolveLototurfHorseSelection(selectedHorse, activeHorses) {
  const selected = integerRange(selectedHorse, LOTOTURF_HORSE_MIN, LOTOTURF_HORSE_MAX);
  const active = uniqueSorted(activeHorses, LOTOTURF_HORSE_MIN, LOTOTURF_HORSE_MAX);
  if (selected == null || active.length === 0) return null;
  if (active.includes(selected)) return selected;
  let candidate = selected;
  for (let step = 0; step < LOTOTURF_HORSE_MAX; step += 1) {
    candidate = candidate === LOTOTURF_HORSE_MIN ? LOTOTURF_HORSE_MAX : candidate - 1;
    if (active.includes(candidate)) return candidate;
  }
  return null;
}

export function classifyLototurfBet(column, draw) {
  const numbers = uniqueSorted(column?.numbers, LOTOTURF_NUMBER_MIN, LOTOTURF_NUMBER_MAX);
  const winningNumbers = uniqueSorted(draw?.winningNumbers, LOTOTURF_NUMBER_MIN, LOTOTURF_NUMBER_MAX);
  const horse = integerRange(column?.horse ?? column?.extra, LOTOTURF_HORSE_MIN, LOTOTURF_HORSE_MAX);
  const winningHorse = integerRange(draw?.winningHorse ?? draw?.horse, LOTOTURF_HORSE_MIN, LOTOTURF_HORSE_MAX);
  if (numbers.length !== LOTOTURF_NUMBERS_PER_BET || winningNumbers.length !== LOTOTURF_NUMBERS_PER_BET || horse == null || winningHorse == null) {
    return null;
  }
  const winningSet = new Set(winningNumbers);
  const matches = numbers.filter(number => winningSet.has(number)).length;
  const horseMatch = horse === winningHorse;
  let category = null;
  if (matches === 6 && horseMatch) category = 1;
  else if (matches === 6) category = 2;
  else if (matches === 5 && horseMatch) category = 3;
  else if (matches === 5) category = 4;
  else if (matches === 4 && horseMatch) category = 5;
  else if (matches === 4) category = 6;
  else if (matches === 3 && horseMatch) category = 7;

  const ticketReintegro = integerRange(column?.reintegro ?? column?.receiptExtra, 0, 9);
  const drawReintegro = integerRange(draw?.reintegro ?? draw?.extra, 0, 9);
  return {
    matches,
    horseMatch,
    category,
    categoryLabel: category ? `${category}.ª categoría` : null,
    reintegroMatch: ticketReintegro != null && drawReintegro != null && ticketReintegro === drawReintegro,
  };
}
