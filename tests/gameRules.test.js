import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';
import { calculatePlayPayout } from '../src/utils/payout.js';
import { playKnownPrize, sanitizePlay } from '../src/utils/playModel.js';

test('La Primitiva usa un único reintegro para todas las columnas del resguardo', () => {
  const play = generateFusionPlay('primitiva', null, 3, { samples: 900, seed: 'shared-reintegro' });
  assert.equal(play.columns.length, 3);
  assert.ok(Number.isInteger(play.receiptExtra));
  assert.deepEqual([...new Set(play.columns.map(column => column.extra))], [play.receiptExtra]);
});

test('El reintegro de La Primitiva devuelve una sola vez el importe total jugado en el resguardo', () => {
  const play = {
    gameId: 'primitiva',
    receiptExtra: 7,
    columns: [
      { numbers: [1,2,3,4,5,6], extra: 7 },
      { numbers: [8,9,10,11,12,13], extra: 7 },
      { numbers: [14,15,16,17,18,19], extra: 7 },
    ],
  };
  const draw = { winningNumbers: [30,31,32,33,34,35], complementary: 36, extra: 7, prizes: [] };
  const settlement = calculatePlayPayout(play, draw);
  assert.equal(settlement.receiptPrize.officialAmount, 3);
  assert.ok(settlement.columns.every(column => column.officialAmount === 0));
});

test('EuroDreams mantiene un Sueño por cada apuesta simple y un máximo de seis bloques', () => {
  const play = generateFusionPlay('eurodreams', null, 9, { samples: 1300, seed: 'eurodreams-blocks' });
  assert.equal(play.columns.length, 6);
  assert.ok(play.columns.every(column => column.extra >= 1 && column.extra <= 5));
  assert.equal(play.receiptExtra, undefined);
});

test('La migración corrige jugadas antiguas de La Primitiva con reintegros distintos y señala la comprobación', () => {
  const play = sanitizePlay({
    id: 'legacy-invalid',
    gameId: 'primitiva',
    columns: [
      { id: 'a', numbers: [1,2,3,4,5,6], extra: 2 },
      { id: 'b', numbers: [7,8,9,10,11,12], extra: 9 },
    ],
    purchased: true,
    status: 'scheduled',
  });
  assert.equal(play.receiptExtra, 2);
  assert.deepEqual(play.columns.map(column => column.extra), [2,2]);
  assert.match(play.metadata.rulesMigrationWarning, /comprueba el resguardo/i);
});

test('El total de premios incluye el reintegro del resguardo sin duplicarlo por columna', () => {
  const play = { columns: [{ officialPrize: 8 }, { officialPrize: 0 }], receiptPrize: { officialAmount: 2 } };
  assert.equal(playKnownPrize(play), 10);
});

test('Euromillones genera cinco números y dos estrellas distintas por columna', () => {
  const play = generateFusionPlay('euromillones', null, 8, { seed: 'euromillones-five-columns' });
  assert.equal(play.columns.length, 5);
  assert.equal(play.receiptExtra, undefined);
  for (const column of play.columns) {
    assert.equal(column.numbers.length, 5);
    assert.equal(new Set(column.numbers).size, 5);
    assert.ok(column.numbers.every(number => number >= 1 && number <= 50));
    assert.equal(column.secondaryNumbers.length, 2);
    assert.equal(new Set(column.secondaryNumbers).size, 2);
    assert.ok(column.secondaryNumbers.every(star => star >= 1 && star <= 12));
  }
});

test('Euromillones conserva las estrellas durante la sanitización', () => {
  const play = sanitizePlay({
    id: 'euromillones-valid',
    gameId: 'euromillones',
    columns: [{ id: 'e1', numbers: [2, 11, 23, 37, 49], secondaryNumbers: [3, 10] }],
    purchased: true,
    status: 'scheduled',
  });
  assert.deepEqual(play.columns[0].numbers, [2, 11, 23, 37, 49]);
  assert.deepEqual(play.columns[0].secondaryNumbers, [3, 10]);
  assert.equal(play.columns[0].extra, undefined);
});

test('Euromillones aplica sus trece categorías con coincidencias de estrellas', () => {
  const draw = { winningNumbers: [1, 2, 3, 4, 5], secondaryNumbers: [6, 7], prizes: [] };
  const first = calculatePlayPayout({ gameId: 'euromillones', columns: [{ numbers: [1, 2, 3, 4, 5], secondaryNumbers: [6, 7] }] }, draw).columns[0];
  const thirteenth = calculatePlayPayout({ gameId: 'euromillones', columns: [{ numbers: [1, 2, 20, 21, 22], secondaryNumbers: [8, 9] }] }, draw).columns[0];
  const none = calculatePlayPayout({ gameId: 'euromillones', columns: [{ numbers: [1, 20, 21, 22, 23], secondaryNumbers: [8, 9] }] }, draw).columns[0];
  assert.match(first.category, /1\.ª categoría/);
  assert.equal(first.matches, 5);
  assert.equal(first.secondaryMatches, 2);
  assert.match(thirteenth.category, /13\.ª categoría/);
  assert.equal(thirteenth.secondaryMatches, 0);
  assert.equal(none.category, null);
  assert.equal(none.officialAmount, 0);
});
