import { getGameConfig } from './gameConfig.js';
import { normalizeHistoricalDraws } from './historyAnalytics.js';

const EPSILON = 1e-12;

function normalizeInclusionProbabilities(values, picks) {
  const positive = values.map(value => Math.max(EPSILON, Number(value) || 0));
  const total = positive.reduce((sum, value) => sum + value, 0) || 1;
  return positive.map(value => value * picks / total);
}

export function uniformProbabilities(gameId) {
  const game = getGameConfig(gameId);
  return Array(game.numberPoolMax).fill(game.numbersToPick / game.numberPoolMax);
}

export function bayesianFrequencyProbabilities(gameId, rawDraws, { priorDraws = 40 } = {}) {
  const game = getGameConfig(gameId);
  const draws = normalizeHistoricalDraws(gameId, rawDraws);
  const priorPerNumber = priorDraws * game.numbersToPick / game.numberPoolMax;
  const counts = Array(game.numberPoolMax).fill(priorPerNumber);
  for (const draw of draws) for (const number of draw.numbers) counts[number - 1] += 1;
  return normalizeInclusionProbabilities(counts, game.numbersToPick);
}

export function recencyProbabilities(gameId, rawDraws, { halfLife = 32, priorDraws = 30 } = {}) {
  const game = getGameConfig(gameId);
  const draws = normalizeHistoricalDraws(gameId, rawDraws);
  const priorPerNumber = priorDraws * game.numbersToPick / game.numberPoolMax;
  const scores = Array(game.numberPoolMax).fill(priorPerNumber);
  const decay = Math.log(2) / Math.max(1, halfLife);
  const lastIndex = draws.length - 1;
  draws.forEach((draw, index) => {
    const weight = Math.exp(-decay * (lastIndex - index));
    for (const number of draw.numbers) scores[number - 1] += weight;
  });
  return normalizeInclusionProbabilities(scores, game.numbersToPick);
}

function recentFrequencyFeature(game, draws, endExclusive, lookback) {
  const feature = Array(game.numberPoolMax).fill(0);
  const start = Math.max(0, endExclusive - lookback);
  const count = Math.max(1, endExclusive - start);
  for (let index = start; index < endExclusive; index += 1) {
    for (const number of draws[index].numbers) feature[number - 1] += 1 / count;
  }
  return feature;
}

function squaredDistance(left, right) {
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    total += delta * delta;
  }
  return total;
}

export function knnSequenceProbabilities(gameId, rawDraws, {
  lookback = 12,
  neighbors = 18,
  priorDraws = 50,
  maxHistory = 900,
} = {}) {
  const game = getGameConfig(gameId);
  const draws = normalizeHistoricalDraws(gameId, rawDraws);
  if (draws.length < lookback + 30) return bayesianFrequencyProbabilities(gameId, draws, { priorDraws });

  const current = recentFrequencyFeature(game, draws, draws.length, lookback);
  const candidates = [];
  const firstTarget = Math.max(lookback, draws.length - maxHistory);
  for (let target = firstTarget; target < draws.length; target += 1) {
    const feature = recentFrequencyFeature(game, draws, target, lookback);
    candidates.push({
      distance: squaredDistance(current, feature),
      next: draws[target].numbers,
    });
  }
  candidates.sort((left, right) => left.distance - right.distance);

  const prior = bayesianFrequencyProbabilities(gameId, draws, { priorDraws });
  const scores = prior.map(value => value * priorDraws);
  const selected = candidates.slice(0, Math.max(3, Math.min(neighbors, candidates.length)));
  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    const weight = 1 / (Math.sqrt(item.distance) + 0.08 + index * 0.01);
    for (const number of item.next) scores[number - 1] += weight;
  }
  return normalizeInclusionProbabilities(scores, game.numbersToPick);
}

export function longShortBlendProbabilities(gameId, rawDraws, {
  halfLife = 24,
  longPrior = 80,
  shortWeight = 0.55,
} = {}) {
  const longTerm = bayesianFrequencyProbabilities(gameId, rawDraws, { priorDraws: longPrior });
  const shortTerm = recencyProbabilities(gameId, rawDraws, { halfLife, priorDraws: 20 });
  const weight = Math.max(0, Math.min(1, shortWeight));
  const game = getGameConfig(gameId);
  return normalizeInclusionProbabilities(
    longTerm.map((value, index) => value * (1 - weight) + shortTerm[index] * weight),
    game.numbersToPick,
  );
}

export const MODEL_DEFINITIONS = Object.freeze([
  {
    id: 'bayes-frequency',
    label: 'Frecuencias bayesianas',
    minDraws: 80,
    predict: (gameId, draws) => bayesianFrequencyProbabilities(gameId, draws, { priorDraws: 50 }),
  },
  {
    id: 'recency-26',
    label: 'Recencia 26',
    minDraws: 100,
    predict: (gameId, draws) => recencyProbabilities(gameId, draws, { halfLife: 26, priorDraws: 35 }),
  },
  {
    id: 'long-short',
    label: 'Largo/corto plazo',
    minDraws: 120,
    predict: (gameId, draws) => longShortBlendProbabilities(gameId, draws, { halfLife: 22, longPrior: 90, shortWeight: 0.5 }),
  },
  {
    id: 'knn-sequence',
    label: 'KNN secuencial',
    minDraws: 180,
    predict: (gameId, draws) => knnSequenceProbabilities(gameId, draws, { lookback: 12, neighbors: 18, priorDraws: 55 }),
  },
]);

export function brierLoss(probabilities, winningNumbers) {
  const winners = new Set(winningNumbers);
  let total = 0;
  for (let index = 0; index < probabilities.length; index += 1) {
    const outcome = winners.has(index + 1) ? 1 : 0;
    const delta = probabilities[index] - outcome;
    total += delta * delta;
  }
  return total / probabilities.length;
}

export function weightedCombination(gameId, probabilities, rng = Math.random) {
  const game = getGameConfig(gameId);
  const available = probabilities.map((weight, index) => ({ number: index + 1, weight: Math.max(EPSILON, weight) }));
  const output = [];
  while (output.length < game.numbersToPick && available.length) {
    const total = available.reduce((sum, item) => sum + item.weight, 0);
    let target = rng() * total;
    let chosenIndex = available.length - 1;
    for (let index = 0; index < available.length; index += 1) {
      target -= available[index].weight;
      if (target <= 0) {
        chosenIndex = index;
        break;
      }
    }
    output.push(available.splice(chosenIndex, 1)[0].number);
  }
  return output.sort((left, right) => left - right);
}

export function blendProbabilities(gameId, weightedModels) {
  const game = getGameConfig(gameId);
  const values = Array(game.numberPoolMax).fill(0);
  let totalWeight = 0;
  for (const model of weightedModels) {
    const weight = Math.max(0, Number(model.weight) || 0);
    if (!weight || !Array.isArray(model.probabilities)) continue;
    totalWeight += weight;
    for (let index = 0; index < values.length; index += 1) values[index] += model.probabilities[index] * weight;
  }
  if (!totalWeight) return uniformProbabilities(gameId);
  return normalizeInclusionProbabilities(values.map(value => value / totalWeight), game.numbersToPick);
}
