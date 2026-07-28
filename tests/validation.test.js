import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateList, parseGame, parseYears } from '../api/_validation.js';
import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess, resetCircuit } from '../api/_circuitBreaker.js';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';

test('los validadores de la API rechazan entradas mal formadas', () => {
  assert.equal(parseGame('primitiva')?.id, 'primitiva');
  assert.equal(parseGame('unknown'), null);
  assert.equal(parseYears('10'), 10);
  assert.equal(parseYears('11'), null);
  assert.deepEqual(parseDateList('2026-07-01,2026-07-01,2026-07-03'), ['2026-07-01', '2026-07-03']);
  assert.equal(parseDateList('01/07/2026'), null);
});

test('el cortacircuitos se abre tras fallos repetidos y se restablece después de un éxito', () => {
  const name = 'test-provider';
  resetCircuit(name);
  for (let index = 0; index < 4; index += 1) recordCircuitFailure(name, { threshold: 4, cooldownMs: 10000, now: 1000 });
  assert.throws(() => assertCircuitClosed(name, { now: 1001 }), error => error.code === 'CIRCUIT_OPEN');
  recordCircuitSuccess(name);
  assert.doesNotThrow(() => assertCircuitClosed(name, { now: 1001 }));
});

test('la misma semilla del Motor de Evidencia reproduce las mismas columnas', () => {
  const first = generateFusionPlay('primitiva', null, 5, { samples: 1500, seed: 'primy-repro-test' });
  const second = generateFusionPlay('primitiva', null, 5, { samples: 1500, seed: 'primy-repro-test' });
  assert.deepEqual(first.columns.map(column => [column.numbers, column.extra]), second.columns.map(column => [column.numbers, column.extra]));
  assert.equal(first.metadata.seed, 'primy-repro-test');
});
