import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateList, parseGame, parseYears } from '../api/_validation.js';
import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess, resetCircuit } from '../api/_circuitBreaker.js';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';

test('API validators reject malformed inputs', () => {
  assert.equal(parseGame('primitiva')?.id, 'primitiva');
  assert.equal(parseGame('unknown'), null);
  assert.equal(parseYears('10'), 10);
  assert.equal(parseYears('11'), null);
  assert.deepEqual(parseDateList('2026-07-01,2026-07-01,2026-07-03'), ['2026-07-01', '2026-07-03']);
  assert.equal(parseDateList('01/07/2026'), null);
});

test('circuit breaker opens after repeated failures and resets after success', () => {
  const name = 'test-provider';
  resetCircuit(name);
  for (let index = 0; index < 4; index += 1) recordCircuitFailure(name, { threshold: 4, cooldownMs: 10000, now: 1000 });
  assert.throws(() => assertCircuitClosed(name, { now: 1001 }), error => error.code === 'CIRCUIT_OPEN');
  recordCircuitSuccess(name);
  assert.doesNotThrow(() => assertCircuitClosed(name, { now: 1001 }));
});

test('same Evidence Engine seed reproduces the same columns', () => {
  const first = generateFusionPlay('primitiva', null, 5, { samples: 1500, seed: 'primy-repro-test' });
  const second = generateFusionPlay('primitiva', null, 5, { samples: 1500, seed: 'primy-repro-test' });
  assert.deepEqual(first.columns.map(column => [column.numbers, column.extra]), second.columns.map(column => [column.numbers, column.extra]));
  assert.equal(first.metadata.seed, 'primy-repro-test');
});
