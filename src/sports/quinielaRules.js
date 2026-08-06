import {
  ELIGE8_UNIT_PRICE,
  GOAL_BUCKETS,
  QUINIELA_MAX_DEVELOPED_BETS,
  QUINIELA_REGULAR_MATCH_COUNT,
  QUINIELA_SYMBOLS,
  QUINIELA_UNIT_PRICE,
} from './constants.js';
import { goalBucket, quinielaSymbolFromScore } from './goalModel.js';
import { safeProduct } from './probability.js';

export const QUINIELA_OFFICIAL_REDUCTIONS = Object.freeze([
  { id: '4T-9', triples: 4, doubles: 0, fullBets: 81, reducedBets: 9, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
  { id: '7D-16', triples: 0, doubles: 7, fullBets: 128, reducedBets: 16, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
  { id: '3D3T-24', triples: 3, doubles: 3, fullBets: 216, reducedBets: 24, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
  { id: '6D2T-64', triples: 2, doubles: 6, fullBets: 576, reducedBets: 64, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
  { id: '8T-81', triples: 8, doubles: 0, fullBets: 6561, reducedBets: 81, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
  { id: '11D-132', triples: 0, doubles: 11, fullBets: 2048, reducedBets: 132, guaranteeStatus: 'pending-official-verification', matrixStatus: 'pending-official-import' },
]);

function uniqueAllowed(values, allowed) {
  const source = Array.isArray(values) ? values : [values];
  return allowed.filter(value => source.includes(value));
}

export function sanitizeQuinielaSelection(raw = {}) {
  const signs = Array.from({ length: QUINIELA_REGULAR_MATCH_COUNT }, (_, index) => uniqueAllowed(raw.signs?.[index] || [], QUINIELA_SYMBOLS));
  const pleno = {
    home: uniqueAllowed(raw.pleno?.home || [], GOAL_BUCKETS),
    away: uniqueAllowed(raw.pleno?.away || [], GOAL_BUCKETS),
  };
  return { signs, pleno };
}

export function validateQuinielaSelection(raw, { requireComplete = true } = {}) {
  const selection = sanitizeQuinielaSelection(raw);
  const errors = [];
  if (selection.signs.length !== QUINIELA_REGULAR_MATCH_COUNT) errors.push('La Quiniela requiere catorce partidos 1-X-2.');
  selection.signs.forEach((values, index) => {
    if (requireComplete && values.length === 0) errors.push(`Falta el pronóstico del partido ${index + 1}.`);
  });
  if (requireComplete && selection.pleno.home.length === 0) errors.push('Falta el pronóstico local del Pleno al 15.');
  if (requireComplete && selection.pleno.away.length === 0) errors.push('Falta el pronóstico visitante del Pleno al 15.');
  return { valid: errors.length === 0, errors, selection };
}

export function countQuinielaBets(raw) {
  const { selection } = validateQuinielaSelection(raw);
  const factors = [...selection.signs.map(values => values.length), selection.pleno.home.length, selection.pleno.away.length];
  if (factors.some(value => value === 0)) return 0;
  return safeProduct(factors);
}

export function quinielaCost(raw) {
  return countQuinielaBets(raw) * QUINIELA_UNIT_PRICE;
}

function expandCartesian(groups, limit) {
  let rows = [[]];
  for (const group of groups) {
    const next = [];
    for (const row of rows) {
      for (const value of group) {
        next.push([...row, value]);
        if (next.length > limit) throw new RangeError(`El desarrollo supera el límite de ${limit.toLocaleString('es-ES')} apuestas.`);
      }
    }
    rows = next;
  }
  return rows;
}

export function expandQuinielaColumns(raw, { limit = QUINIELA_MAX_DEVELOPED_BETS } = {}) {
  const { valid, errors, selection } = validateQuinielaSelection(raw);
  if (!valid) throw new RangeError(errors.join(' '));
  const total = countQuinielaBets(selection);
  if (total > limit) throw new RangeError(`El desarrollo de ${total.toLocaleString('es-ES')} apuestas supera el límite de ${limit.toLocaleString('es-ES')}.`);
  const signs = expandCartesian(selection.signs, limit);
  const plenoPairs = expandCartesian([selection.pleno.home, selection.pleno.away], limit);
  return signs.flatMap(signColumn => plenoPairs.map(([home, away]) => ({ signs: signColumn, pleno: { home, away } })));
}

export function quinielaConditionMetrics(signs) {
  const values = Array.isArray(signs) ? signs : [];
  const draws = values.filter(value => value === 'X').length;
  const awayWins = values.filter(value => value === '2').length;
  return { variants: draws + awayWins, draws, awayWins };
}

function inRange(value, range) {
  if (!range) return true;
  const min = range.min == null ? -Infinity : Number(range.min);
  const max = range.max == null ? Infinity : Number(range.max);
  return value >= min && value <= max;
}

export function matchesQuinielaConditions(signs, conditions = {}) {
  const metrics = quinielaConditionMetrics(signs);
  return inRange(metrics.variants, conditions.variants)
    && inRange(metrics.draws, conditions.draws)
    && inRange(metrics.awayWins, conditions.awayWins);
}

export function conditionQuinielaColumns(columns, conditions = {}) {
  return (columns || []).filter(column => matchesQuinielaConditions(column.signs, conditions));
}

export function countElige8Bets(raw, positions) {
  const selection = sanitizeQuinielaSelection(raw);
  const normalized = [...new Set((positions || []).map(Number))].sort((a, b) => a - b);
  if (normalized.length !== 8 || normalized.some(position => !Number.isInteger(position) || position < 1 || position > 14)) {
    throw new RangeError('Elige8 requiere exactamente ocho posiciones distintas entre 1 y 14.');
  }
  const factors = normalized.map(position => selection.signs[position - 1].length);
  if (factors.some(value => value === 0)) return 0;
  return safeProduct(factors);
}

export function elige8Cost(raw, positions) {
  return countElige8Bets(raw, positions) * ELIGE8_UNIT_PRICE;
}

export function officialQuinielaResultFromScores(scores) {
  if (!Array.isArray(scores) || scores.length !== 15) throw new RangeError('Se necesitan los resultados de los quince partidos.');
  return {
    signs: scores.slice(0, 14).map(score => quinielaSymbolFromScore(Number(score.home), Number(score.away))),
    pleno: { home: goalBucket(Number(scores[14].home)), away: goalBucket(Number(scores[14].away)) },
  };
}

export function scoreQuinielaColumn(column, officialResult) {
  const hits14 = (column?.signs || []).reduce((hits, sign, index) => hits + (sign === officialResult?.signs?.[index] ? 1 : 0), 0);
  const plenoCorrect = column?.pleno?.home === officialResult?.pleno?.home && column?.pleno?.away === officialResult?.pleno?.away;
  return {
    hits14,
    plenoCorrect,
    totalLabel: hits14 === 14 && plenoCorrect ? 'Pleno al 15' : `${hits14} aciertos`,
  };
}
