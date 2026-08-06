import { getGameConfig } from './gameConfig.js';
import { normalizeHistoricalDraws } from './historyAnalytics.js';
import {
  MODEL_DEFINITIONS,
  blendProbabilities,
  brierLoss,
  uniformProbabilities,
  weightedCombination,
} from './predictiveModels.js';

const cache = new Map();
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = value + 0x6D2B79F5 | 0;
    let mixed = Math.imul(value ^ value >>> 15, 1 | value);
    mixed = mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed) ^ mixed;
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

function hits(ticket, winningNumbers) {
  const winners = new Set(winningNumbers);
  return ticket.reduce((count, number) => count + (winners.has(number) ? 1 : 0), 0);
}

function quantile(sorted, probability) {
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function bootstrapLower(values, { samples = 400, alpha = 0.0125, seed = 0xC0FFEE } = {}) {
  if (!values.length) return 0;
  const rng = mulberry32(seed ^ values.length);
  const estimates = [];
  const blockLength = Math.max(3, Math.round(Math.sqrt(values.length)));
  for (let sample = 0; sample < samples; sample += 1) {
    let total = 0;
    let collected = 0;
    while (collected < values.length) {
      const start = Math.floor(rng() * values.length);
      for (let offset = 0; offset < blockLength && collected < values.length; offset += 1) {
        total += values[(start + offset) % values.length];
        collected += 1;
      }
    }
    estimates.push(total / values.length);
  }
  estimates.sort((left, right) => left - right);
  return quantile(estimates, alpha);
}

function evaluateModelOnFold(gameId, model, priorDraws, actualDraw, foldIndex, ticketSamples) {
  const probabilities = model.predict(gameId, priorDraws);
  const uniform = uniformProbabilities(gameId);
  const modelLoss = brierLoss(probabilities, actualDraw.numbers);
  const uniformLoss = brierLoss(uniform, actualDraw.numbers);
  let modelHits = 0;
  let uniformHits = 0;
  for (let sample = 0; sample < ticketSamples; sample += 1) {
    const pairedSeed = (foldIndex + 1) * 2654435761 ^ (sample + 1) * 2246822519 ^ model.id.length;
    const modelRng = mulberry32(pairedSeed);
    const uniformRng = mulberry32(pairedSeed);
    modelHits += hits(weightedCombination(gameId, probabilities, modelRng), actualDraw.numbers);
    uniformHits += hits(weightedCombination(gameId, uniform, uniformRng), actualDraw.numbers);
  }
  return {
    brierGain: uniformLoss - modelLoss,
    hitGain: modelHits / ticketSamples - uniformHits / ticketSamples,
    probabilities,
  };
}

function evidenceWeight(result) {
  if (!result.eligible) return 0;
  const brierScale = Math.max(0, result.meanBrierGain) * 220;
  const hitScale = Math.max(0, result.meanHitGain) * 4;
  return Math.min(1, brierScale + hitScale);
}

export function evaluateEvidenceModels(gameId, rawDraws, {
  folds,
  minTrain,
  ticketSamples = 12,
  bootstrapSamples = 400,
} = {}) {
  const game = getGameConfig(gameId);
  const draws = normalizeHistoricalDraws(gameId, rawDraws);
  const defaultMinTrain = gameId === 'eurodreams' ? 120 : 220;
  const trainFloor = Math.max(60, Number(minTrain) || defaultMinTrain);
  const maxFolds = Math.max(20, Number(folds) || (gameId === 'eurodreams' ? 70 : 100));
  if (draws.length < trainFloor + 30) {
    return {
      eligible: false,
      reason: 'Historial insuficiente para una validación predictiva rigurosa',
      draws: draws.length,
      runs: 0,
      signalWeight: 0,
      probabilities: uniformProbabilities(gameId),
      models: [],
    };
  }

  const start = Math.max(trainFloor, draws.length - maxFolds);
  const modelResults = [];
  for (const model of MODEL_DEFINITIONS) {
    if (draws.length < Math.max(trainFloor, model.minDraws) + 20) continue;
    const brierGains = [];
    const hitGains = [];
    for (let target = start; target < draws.length; target += 1) {
      const prior = draws.slice(0, target);
      if (prior.length < model.minDraws) continue;
      const result = evaluateModelOnFold(gameId, model, prior, draws[target], target, ticketSamples);
      brierGains.push(result.brierGain);
      hitGains.push(result.hitGain);
    }
    const meanBrierGain = mean(brierGains);
    const meanHitGain = mean(hitGains);
    const lowerBrierGain = bootstrapLower(brierGains, {
      samples: bootstrapSamples,
      alpha: 0.0125,
      seed: 0xBADA55 ^ model.id.length,
    });
    const lowerHitGain = bootstrapLower(hitGains, {
      samples: bootstrapSamples,
      alpha: 0.0125,
      seed: 0xA11CE ^ model.id.length,
    });
    const eligible = brierGains.length >= 45
      && lowerBrierGain > 0
      && lowerHitGain >= 0
      && meanHitGain > 0.01;
    const fullProbabilities = model.predict(gameId, draws);
    const result = {
      id: model.id,
      label: model.label,
      runs: brierGains.length,
      eligible,
      meanBrierGain,
      lowerBrierGain,
      meanHitGain,
      lowerHitGain,
      probabilities: fullProbabilities,
    };
    result.rawWeight = evidenceWeight(result);
    modelResults.push(result);
  }

  const eligibleModels = modelResults.filter(model => model.eligible && model.rawWeight > 0);
  const rawWeightTotal = eligibleModels.reduce((sum, model) => sum + model.rawWeight, 0);
  const predictiveBudget = rawWeightTotal ? Math.min(0.25, 0.08 + rawWeightTotal * 0.08) : 0;
  const weightedModels = [{ weight: 1 - predictiveBudget, probabilities: uniformProbabilities(gameId) }];
  for (const model of eligibleModels) {
    weightedModels.push({
      weight: predictiveBudget * model.rawWeight / rawWeightTotal,
      probabilities: model.probabilities,
    });
  }

  return {
    eligible: eligibleModels.length > 0,
    reason: eligibleModels.length
      ? 'Señal histórica débil pero repetida fuera de muestra'
      : 'Ningún modelo histórico supera al azar con evidencia suficiente',
    draws: draws.length,
    runs: Math.max(0, draws.length - start),
    signalWeight: predictiveBudget,
    probabilities: blendProbabilities(gameId, weightedModels),
    models: modelResults.map(({ probabilities, rawWeight, ...model }) => ({
      ...model,
      assignedWeight: model.eligible && rawWeightTotal
        ? predictiveBudget * rawWeight / rawWeightTotal
        : 0,
    })),
  };
}

export function getEvidenceProfile(gameId, analysis, options = {}) {
  const draws = analysis?.draws || [];
  const latest = draws.at(-1)?.date || 'none';
  const key = `${gameId}:${draws.length}:${latest}:${options.folds || ''}:${options.minTrain || ''}:${options.ticketSamples || ''}:${options.bootstrapSamples || ''}`;
  if (!options.disableCache && cache.has(key)) return cache.get(key);
  const result = evaluateEvidenceModels(gameId, draws, options);
  if (!options.disableCache) cache.set(key, result);
  return result;
}

export function probabilityAffinity(gameId, ticket, probabilities) {
  const game = getGameConfig(gameId);
  const uniform = game.numbersToPick / game.numberPoolMax;
  if (!Array.isArray(probabilities) || probabilities.length !== game.numberPoolMax) return 50;
  const ratios = ticket.map(number => Math.log(Math.max(1e-9, probabilities[number - 1]) / uniform));
  const average = mean(ratios);
  return Math.max(0, Math.min(100, 50 + average * 180));
}
