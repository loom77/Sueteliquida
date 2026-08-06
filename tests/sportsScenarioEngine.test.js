import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatchProbabilitySnapshot } from '../src/sports/goalModel.js';
import { simulateQuinielaPortfolio, simulateQuinigolPortfolio } from '../src/sports/scenarioEngine.js';

function snapshot(id, homeLambda = 1.4, awayLambda = 1.1) {
  return createMatchProbabilitySnapshot({ matchId: id }, { homeLambda, awayLambda, rho: -0.06 }, { generatedAt: '2026-08-01T12:00:00.000Z' });
}

test('la simulación de Quiniela es reproducible con la misma semilla', () => {
  const snapshots = Array.from({ length: 15 }, (_, index) => snapshot(`q-${index + 1}`));
  const columns = [{ signs: Array.from({ length: 14 }, () => '1'), pleno: { home: '1', away: '0' } }];
  const first = simulateQuinielaPortfolio({ matchSnapshots: snapshots, columns, iterations: 500, seed: 'fixed-seed' });
  const second = simulateQuinielaPortfolio({ matchSnapshots: snapshots, columns, iterations: 500, seed: 'fixed-seed' });
  assert.deepEqual(first, second);
  assert.ok(first.probabilityAtLeast10 >= 0 && first.probabilityAtLeast10 <= 1);
});

test('la simulación de Quinigol devuelve una distribución normalizada del mejor resultado', () => {
  const snapshots = Array.from({ length: 6 }, (_, index) => snapshot(`g-${index + 1}`, 1.2, 1.2));
  const columns = [{ outcomes: Array.from({ length: 6 }, () => '1-1') }];
  const result = simulateQuinigolPortfolio({ matchSnapshots: snapshots, columns, iterations: 500, seed: 'quinigol-seed' });
  const total = Object.values(result.bestHitsDistribution).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < 1e-12);
  assert.ok(result.probabilityAtLeast2 >= 0 && result.probabilityAtLeast2 <= 1);
});
