import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEvidenceModels } from '../src/utils/evidenceEngine.js';
import { optimizeCoverage, portfolioObjective } from '../src/utils/portfolioOptimizer.js';

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function randomTicket(rng, max = 49, picks = 6) {
  const pool = Array.from({ length: max }, (_, index) => index + 1);
  const output = [];
  while (output.length < picks) output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return output.sort((left, right) => left - right);
}

function dateFor(index) {
  return `${2020 + Math.floor(index / 150)}-${String(1 + (index % 12)).padStart(2, '0')}-${String(1 + (index % 28)).padStart(2, '0')}`;
}

test('con sorteos IID el motor predictivo vuelve al azar uniforme', () => {
  const rng = seeded(12345);
  const draws = Array.from({ length: 360 }, (_, index) => ({
    date: dateFor(index),
    numbers: randomTicket(rng),
  }));
  const evidence = evaluateEvidenceModels('primitiva', draws, {
    folds: 70,
    minTrain: 220,
    ticketSamples: 10,
    bootstrapSamples: 180,
  });
  assert.equal(evidence.eligible, false);
  assert.equal(evidence.signalWeight, 0);
  assert.ok(evidence.models.every(model => model.assignedWeight === 0));
});

test('se detecta fuera de muestra un sesgo artificial persistente', () => {
  const draws = Array.from({ length: 300 }, (_, index) => ({
    date: dateFor(index),
    numbers: [1, 2, 3, 4, 5, 6],
  }));
  const evidence = evaluateEvidenceModels('primitiva', draws, {
    folds: 70,
    minTrain: 180,
    ticketSamples: 12,
    bootstrapSamples: 180,
  });
  assert.equal(evidence.eligible, true);
  assert.ok(evidence.signalWeight > 0);
  assert.ok(evidence.probabilities[0] > evidence.probabilities[20]);
});

test('la búsqueda local no empeora el objetivo de la cartera voraz', () => {
  const probabilities = Array(49).fill(6 / 49);
  const candidates = [
    { ticket: [1, 2, 3, 4, 5, 6], score: 80 },
    { ticket: [1, 2, 3, 4, 5, 7], score: 95 },
    { ticket: [8, 9, 10, 11, 12, 13], score: 70 },
    { ticket: [14, 15, 16, 17, 18, 19], score: 68 },
    { ticket: [20, 21, 22, 23, 24, 25], score: 65 },
    { ticket: [26, 27, 28, 29, 30, 31], score: 60 },
  ];
  const greedy = optimizeCoverage('primitiva', candidates, 4, { probabilities, localIterations: 0 });
  const improved = optimizeCoverage('primitiva', candidates, 4, { probabilities, localIterations: 120 });
  assert.ok(portfolioObjective('primitiva', improved, { probabilities }) >= portfolioObjective('primitiva', greedy, { probabilities }));
});
