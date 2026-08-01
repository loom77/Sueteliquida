import { GOAL_BUCKETS, SPORTS_MODEL_VERSION } from './constants.js';
import { normalizeDistribution } from './probability.js';

function requireLambda(value, label) {
  const lambda = Number(value);
  if (!Number.isFinite(lambda) || lambda <= 0 || lambda > 12) {
    throw new RangeError(`${label} debe estar entre 0 y 12 goles esperados.`);
  }
  return lambda;
}

export function poissonProbability(goals, lambda) {
  if (!Number.isInteger(goals) || goals < 0) return 0;
  const rate = requireLambda(lambda, 'La intensidad Poisson');
  let factorial = 1;
  for (let value = 2; value <= goals; value += 1) factorial *= value;
  return Math.exp(-rate) * (rate ** goals) / factorial;
}

export function dixonColesAdjustment(homeGoals, awayGoals, homeLambda, awayLambda, rho = 0) {
  const correlation = Math.max(-0.2, Math.min(0.2, Number(rho) || 0));
  if (homeGoals === 0 && awayGoals === 0) return 1 - (homeLambda * awayLambda * correlation);
  if (homeGoals === 0 && awayGoals === 1) return 1 + (homeLambda * correlation);
  if (homeGoals === 1 && awayGoals === 0) return 1 + (awayLambda * correlation);
  if (homeGoals === 1 && awayGoals === 1) return 1 - correlation;
  return 1;
}

export function buildScoreMatrix({ homeLambda, awayLambda, rho = -0.08, maxGoals = 10 } = {}) {
  const homeRate = requireLambda(homeLambda, 'homeLambda');
  const awayRate = requireLambda(awayLambda, 'awayLambda');
  if (!Number.isInteger(maxGoals) || maxGoals < 5 || maxGoals > 20) {
    throw new RangeError('maxGoals debe ser un entero entre 5 y 20.');
  }

  const matrix = [];
  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals += 1) {
      const independent = poissonProbability(homeGoals, homeRate) * poissonProbability(awayGoals, awayRate);
      const adjusted = independent * Math.max(0.000001, dixonColesAdjustment(homeGoals, awayGoals, homeRate, awayRate, rho));
      matrix.push({ homeGoals, awayGoals, probability: adjusted });
    }
  }
  return normalizeDistribution(matrix);
}

export function quinielaSymbolFromScore(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return '1';
  if (homeGoals < awayGoals) return '2';
  return 'X';
}

export function goalBucket(goals) {
  const value = Number(goals);
  if (!Number.isInteger(value) || value < 0) throw new RangeError('Los goles deben ser enteros no negativos.');
  return value >= 3 ? 'M' : String(value);
}

export function quinigolOutcomeFromScore(homeGoals, awayGoals) {
  return `${goalBucket(homeGoals)}-${goalBucket(awayGoals)}`;
}

export function aggregateOneXTwo(scoreMatrix) {
  const distribution = { '1': 0, X: 0, '2': 0 };
  for (const score of scoreMatrix) {
    distribution[quinielaSymbolFromScore(score.homeGoals, score.awayGoals)] += score.probability;
  }
  return normalizeDistribution(distribution);
}

export function aggregateGoalBuckets(scoreMatrix) {
  const distribution = Object.fromEntries(GOAL_BUCKETS.flatMap(home => GOAL_BUCKETS.map(away => [`${home}-${away}`, 0])));
  for (const score of scoreMatrix) {
    distribution[quinigolOutcomeFromScore(score.homeGoals, score.awayGoals)] += score.probability;
  }
  return normalizeDistribution(distribution);
}

export function createMatchProbabilitySnapshot(match, parameters, options = {}) {
  const scoreMatrix = buildScoreMatrix({ ...parameters, maxGoals: options.maxGoals ?? 10 });
  return {
    matchId: String(match?.matchId || match?.id || ''),
    generatedAt: options.generatedAt || new Date().toISOString(),
    modelVersion: options.modelVersion || SPORTS_MODEL_VERSION,
    parameters: {
      homeLambda: Number(parameters.homeLambda),
      awayLambda: Number(parameters.awayLambda),
      rho: Number(parameters.rho ?? -0.08),
    },
    oneXTwo: aggregateOneXTwo(scoreMatrix),
    goalBuckets: aggregateGoalBuckets(scoreMatrix),
    scoreMatrix,
    dataCutoffAt: options.dataCutoffAt || null,
    sourceVersion: options.sourceVersion || null,
    warnings: Array.isArray(options.warnings) ? [...options.warnings] : [],
  };
}
