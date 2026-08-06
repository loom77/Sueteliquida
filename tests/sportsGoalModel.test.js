import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateGoalBuckets,
  aggregateOneXTwo,
  buildScoreMatrix,
  createMatchProbabilitySnapshot,
  goalBucket,
  quinigolOutcomeFromScore,
} from '../src/sports/goalModel.js';
import { distributionTotal, isNormalizedDistribution } from '../src/sports/probability.js';

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} no está cerca de ${expected}`);
}

test('la matriz Poisson/Dixon-Coles se normaliza y no contiene probabilidades negativas', () => {
  const matrix = buildScoreMatrix({ homeLambda: 1.55, awayLambda: 1.1, rho: -0.08, maxGoals: 10 });
  close(distributionTotal(matrix), 1);
  assert.ok(matrix.every(score => score.probability >= 0));
});

test('las distribuciones 1-X-2 y 0-1-2-M suman uno', () => {
  const matrix = buildScoreMatrix({ homeLambda: 1.4, awayLambda: 1.25 });
  const oneXTwo = aggregateOneXTwo(matrix);
  const buckets = aggregateGoalBuckets(matrix);
  assert.equal(isNormalizedDistribution(oneXTwo), true);
  assert.equal(isNormalizedDistribution(buckets), true);
  assert.deepEqual(Object.keys(oneXTwo), ['1', '2', 'X'].sort().sort());
  assert.equal(Object.keys(buckets).length, 16);
});

test('un partido simétrico produce probabilidades local y visitante prácticamente iguales', () => {
  const oneXTwo = aggregateOneXTwo(buildScoreMatrix({ homeLambda: 1.3, awayLambda: 1.3, rho: -0.05 }));
  assert.ok(Math.abs(oneXTwo['1'] - oneXTwo['2']) < 1e-10);
});

test('M agrupa correctamente tres o más goles', () => {
  assert.equal(goalBucket(0), '0');
  assert.equal(goalBucket(2), '2');
  assert.equal(goalBucket(3), 'M');
  assert.equal(goalBucket(7), 'M');
  assert.equal(quinigolOutcomeFromScore(4, 1), 'M-1');
});

test('el snapshot conserva versión, corte de datos y las tres representaciones probabilísticas', () => {
  const snapshot = createMatchProbabilitySnapshot(
    { matchId: 'J25-M1' },
    { homeLambda: 1.7, awayLambda: 0.9, rho: -0.07 },
    { generatedAt: '2026-08-01T12:00:00.000Z', dataCutoffAt: '2026-08-01T10:00:00.000Z', sourceVersion: 'dataset-1' },
  );
  assert.equal(snapshot.matchId, 'J25-M1');
  assert.equal(snapshot.dataCutoffAt, '2026-08-01T10:00:00.000Z');
  assert.equal(snapshot.sourceVersion, 'dataset-1');
  assert.equal(isNormalizedDistribution(snapshot.oneXTwo), true);
  assert.equal(isNormalizedDistribution(snapshot.goalBuckets), true);
  assert.equal(isNormalizedDistribution(snapshot.scoreMatrix), true);
});
