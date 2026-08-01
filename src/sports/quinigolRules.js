import { GOAL_BUCKETS, QUINIGOL_MATCH_COUNT, QUINIGOL_MAX_DEVELOPED_BETS, QUINIGOL_UNIT_PRICE } from './constants.js';
import { quinigolOutcomeFromScore } from './goalModel.js';
import { safeProduct } from './probability.js';

export const QUINIGOL_OUTCOMES = Object.freeze(GOAL_BUCKETS.flatMap(home => GOAL_BUCKETS.map(away => `${home}-${away}`)));

function uniqueOutcomes(values) {
  const source = Array.isArray(values) ? values : [values];
  return QUINIGOL_OUTCOMES.filter(value => source.includes(value));
}

export function sanitizeQuinigolSelection(raw = {}) {
  return {
    outcomes: Array.from({ length: QUINIGOL_MATCH_COUNT }, (_, index) => uniqueOutcomes(raw.outcomes?.[index] || [])),
  };
}

export function validateQuinigolSelection(raw, { requireComplete = true } = {}) {
  const selection = sanitizeQuinigolSelection(raw);
  const errors = [];
  selection.outcomes.forEach((values, index) => {
    if (requireComplete && values.length === 0) errors.push(`Falta el marcador del partido ${index + 1}.`);
  });
  return { valid: errors.length === 0, errors, selection };
}

export function countQuinigolBets(raw) {
  const { selection } = validateQuinigolSelection(raw);
  const factors = selection.outcomes.map(values => values.length);
  if (factors.some(value => value === 0)) return 0;
  return safeProduct(factors);
}

export function quinigolCost(raw) {
  return countQuinigolBets(raw) * QUINIGOL_UNIT_PRICE;
}

export function expandQuinigolColumns(raw, { limit = QUINIGOL_MAX_DEVELOPED_BETS } = {}) {
  const { valid, errors, selection } = validateQuinigolSelection(raw);
  if (!valid) throw new RangeError(errors.join(' '));
  const total = countQuinigolBets(selection);
  if (total > limit) throw new RangeError(`El desarrollo de ${total.toLocaleString('es-ES')} apuestas supera el límite de ${limit.toLocaleString('es-ES')}.`);
  let columns = [[]];
  for (const group of selection.outcomes) {
    const next = [];
    for (const column of columns) {
      for (const outcome of group) next.push([...column, outcome]);
    }
    columns = next;
  }
  return columns.map(outcomes => ({ outcomes }));
}

export function officialQuinigolResultFromScores(scores) {
  if (!Array.isArray(scores) || scores.length !== QUINIGOL_MATCH_COUNT) throw new RangeError('Se necesitan los resultados de los seis partidos.');
  return scores.map(score => quinigolOutcomeFromScore(Number(score.home), Number(score.away)));
}

export function scoreQuinigolColumn(column, officialOutcomes) {
  const hits = (column?.outcomes || []).reduce((total, outcome, index) => total + (outcome === officialOutcomes?.[index] ? 1 : 0), 0);
  return { hits, category: hits >= 2 ? `${hits} aciertos` : 'Sin categoría' };
}
