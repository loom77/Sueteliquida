import { sampleCategorical, createSeededRandom } from './probability.js';
import { quinigolOutcomeFromScore, quinielaSymbolFromScore, goalBucket } from './goalModel.js';
import { scoreQuinielaColumn } from './quinielaRules.js';
import { scoreQuinigolColumn } from './quinigolRules.js';

function sampleScore(snapshot, random) {
  const sampled = sampleCategorical(snapshot?.scoreMatrix || [], random);
  if (!sampled) throw new RangeError('Falta una matriz probabilística válida para simular el partido.');
  return { home: sampled.homeGoals, away: sampled.awayGoals };
}

function requireIterations(iterations) {
  const value = Number(iterations);
  if (!Number.isInteger(value) || value < 100 || value > 100_000) throw new RangeError('Las simulaciones deben estar entre 100 y 100.000.');
  return value;
}

export function simulateQuinielaPortfolio({ matchSnapshots, columns, iterations = 5_000, seed = 'quiniela' } = {}) {
  const count = requireIterations(iterations);
  if (!Array.isArray(matchSnapshots) || matchSnapshots.length !== 15) throw new RangeError('La simulación de Quiniela necesita quince partidos.');
  if (!Array.isArray(columns) || columns.length === 0) throw new RangeError('La cartera debe contener al menos una columna.');
  const random = createSeededRandom(seed);
  const bestHitsHistogram = Object.fromEntries(Array.from({ length: 15 }, (_, value) => [value, 0]));
  let pleno15 = 0;

  for (let iteration = 0; iteration < count; iteration += 1) {
    const scores = matchSnapshots.map(snapshot => sampleScore(snapshot, random));
    const official = {
      signs: scores.slice(0, 14).map(score => quinielaSymbolFromScore(score.home, score.away)),
      pleno: { home: goalBucket(scores[14].home), away: goalBucket(scores[14].away) },
    };
    let best = { hits14: 0, plenoCorrect: false };
    for (const column of columns) {
      const score = scoreQuinielaColumn(column, official);
      if (score.hits14 > best.hits14 || (score.hits14 === best.hits14 && score.plenoCorrect)) best = score;
    }
    bestHitsHistogram[best.hits14] += 1;
    if (best.hits14 === 14 && best.plenoCorrect) pleno15 += 1;
  }

  return {
    iterations: count,
    seed: String(seed),
    bestHitsDistribution: Object.fromEntries(Object.entries(bestHitsHistogram).map(([hits, value]) => [hits, value / count])),
    probabilityAtLeast10: Object.entries(bestHitsHistogram).filter(([hits]) => Number(hits) >= 10).reduce((sum, [, value]) => sum + value, 0) / count,
    probability14: bestHitsHistogram[14] / count,
    probabilityPleno15: pleno15 / count,
  };
}

export function simulateQuinigolPortfolio({ matchSnapshots, columns, iterations = 5_000, seed = 'quinigol' } = {}) {
  const count = requireIterations(iterations);
  if (!Array.isArray(matchSnapshots) || matchSnapshots.length !== 6) throw new RangeError('La simulación de Quinigol necesita seis partidos.');
  if (!Array.isArray(columns) || columns.length === 0) throw new RangeError('La cartera debe contener al menos una columna.');
  const random = createSeededRandom(seed);
  const bestHitsHistogram = Object.fromEntries(Array.from({ length: 7 }, (_, value) => [value, 0]));

  for (let iteration = 0; iteration < count; iteration += 1) {
    const outcomes = matchSnapshots.map(snapshot => {
      const score = sampleScore(snapshot, random);
      return quinigolOutcomeFromScore(score.home, score.away);
    });
    let bestHits = 0;
    for (const column of columns) bestHits = Math.max(bestHits, scoreQuinigolColumn(column, outcomes).hits);
    bestHitsHistogram[bestHits] += 1;
  }

  return {
    iterations: count,
    seed: String(seed),
    bestHitsDistribution: Object.fromEntries(Object.entries(bestHitsHistogram).map(([hits, value]) => [hits, value / count])),
    probabilityAtLeast2: Object.entries(bestHitsHistogram).filter(([hits]) => Number(hits) >= 2).reduce((sum, [, value]) => sum + value, 0) / count,
    probability6: bestHitsHistogram[6] / count,
  };
}
