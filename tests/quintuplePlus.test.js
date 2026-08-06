import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyQuintuplePlusForecast,
  createSimpleQuintupleForecast,
  quintuplePlusEquivalentBets,
  resolveWithdrawnHorse,
  sanitizeQuintuplePlusSelection,
} from '../src/horse/quintuplePlusRules.js';

test('Quíntuple Plus calcula simples, múltiples y excluye parejas imposibles en la quinta carrera', () => {
  assert.equal(quintuplePlusEquivalentBets([[1],[2],[3],[4],[5],[6]]), 1);
  assert.equal(quintuplePlusEquivalentBets([[1,2],[3],[4],[5],[6],[7]]), 2);
  assert.equal(quintuplePlusEquivalentBets([[1],[2],[3],[4],[5,6],[6,7]]), 3);
  assert.equal(quintuplePlusEquivalentBets([[1],[2],[3],[4],[5],[5]]), 0);
});

test('Quíntuple Plus respeta dorsales 1-20 y el límite de 65.535 apuestas', () => {
  const valid = sanitizeQuintuplePlusSelection({ rows: [[1,2],[3],[4],[5],[6,7],[7,8]] });
  assert.equal(valid.equivalentBets, 6);
  assert.equal(valid.cost, 6);
  assert.equal(valid.betType, 'multiple');

  const impossible = sanitizeQuintuplePlusSelection({ rows: [[1],[2],[3],[4],[5],[5]] });
  assert.equal(impossible, null);
  const invalidHorse = sanitizeQuintuplePlusSelection({ rows: [[1],[2],[3],[4],[5],[21]] });
  assert.equal(invalidHorse, null);
});

test('Quíntuple Plus crea una apuesta simple con primero y segundo distintos en la quinta', () => {
  let cursor = 0;
  const values = [2, 3, 4, 5, 6, 6, 7];
  const forecast = createSimpleQuintupleForecast([12, 10, 9, 8, 12], () => values[cursor++]);
  assert.equal(forecast.betType, 'simple');
  assert.equal(forecast.equivalentBets, 1);
  assert.notEqual(forecast.rows[4][0], forecast.rows[5][0]);
});

test('Quíntuple Plus clasifica las cuatro categorías oficiales', () => {
  const result = [[1],[2],[3],[4],[5],[6]];
  assert.equal(classifyQuintuplePlusForecast([[1],[2],[3],[4],[5],[6]], result).category, 1);
  assert.equal(classifyQuintuplePlusForecast([[1],[2],[3],[4],[5],[7]], result).category, 2);
  assert.equal(classifyQuintuplePlusForecast([[1],[2],[3],[9],[5],[6]], result).category, 3);
  assert.equal(classifyQuintuplePlusForecast([[1],[2],[3],[9],[5],[7]], result).category, 4);
  assert.equal(classifyQuintuplePlusForecast([[1],[2],[8],[9],[5],[6]], result).category, null);
});

test('Quíntuple Plus aplica la sustitución por el dorsal anterior', () => {
  assert.equal(resolveWithdrawnHorse(8, [1, 3, 7, 9], 12), 7);
  assert.equal(resolveWithdrawnHorse(1, [4, 8, 12], 12), 12);
});
