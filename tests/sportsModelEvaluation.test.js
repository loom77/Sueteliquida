import test from 'node:test';
import assert from 'node:assert/strict';
import { calibrationBins, multiclassBrierScore, multiclassLogLoss, temporalLeakageIssues } from '../src/sports/modelEvaluation.js';

const perfect = [
  { outcome: '1', probabilities: { '1': 0.999, X: 0.0005, '2': 0.0005 } },
  { outcome: 'X', probabilities: { '1': 0.001, X: 0.998, '2': 0.001 } },
  { outcome: '2', probabilities: { '1': 0.001, X: 0.001, '2': 0.998 } },
];

const weak = [
  { outcome: '1', probabilities: { '1': 1 / 3, X: 1 / 3, '2': 1 / 3 } },
  { outcome: 'X', probabilities: { '1': 1 / 3, X: 1 / 3, '2': 1 / 3 } },
  { outcome: '2', probabilities: { '1': 1 / 3, X: 1 / 3, '2': 1 / 3 } },
];

test('log-loss y Brier premian probabilidades mejor calibradas', () => {
  assert.ok(multiclassLogLoss(perfect) < multiclassLogLoss(weak));
  assert.ok(multiclassBrierScore(perfect) < multiclassBrierScore(weak));
});

test('la curva de calibración conserva recuento y medias por intervalo', () => {
  const bins = calibrationBins([...perfect, ...weak], { label: '1', bins: 5 });
  assert.equal(bins.length, 5);
  assert.equal(bins.reduce((sum, bin) => sum + bin.count, 0), 6);
  assert.ok(bins.some(bin => bin.count > 0 && bin.meanPredicted != null));
});

test('detecta leakage cuando el corte de datos o la predicción llegan después del inicio', () => {
  const matches = [{ matchId: 'm1', kickoffAt: '2026-08-10T20:00:00.000Z' }];
  const clean = [{ matchId: 'm1', generatedAt: '2026-08-10T18:00:00.000Z', dataCutoffAt: '2026-08-10T17:00:00.000Z' }];
  const leaked = [{ matchId: 'm1', generatedAt: '2026-08-10T20:10:00.000Z', dataCutoffAt: '2026-08-10T20:00:00.000Z' }];
  assert.deepEqual(temporalLeakageIssues(clean, matches), []);
  assert.deepEqual(new Set(temporalLeakageIssues(leaked, matches).map(issue => issue.code)), new Set(['DATA_AFTER_KICKOFF', 'PREDICTION_AFTER_KICKOFF']));
});
