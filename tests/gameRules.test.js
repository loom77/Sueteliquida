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


test('El Gordo de la Primitiva genera cinco números y una clave por columna', () => {
  const play = generateFusionPlay('gordoprimitiva', null, 6, { seed: 'gordo-six-columns' });
  assert.equal(play.columns.length, 6);
  assert.equal(play.receiptExtra, undefined);
  for (const column of play.columns) {
    assert.equal(column.numbers.length, 5);
    assert.equal(new Set(column.numbers).size, 5);
    assert.ok(column.numbers.every(number => number >= 1 && number <= 54));
    assert.ok(Number.isInteger(column.extra));
    assert.ok(column.extra >= 0 && column.extra <= 9);
  }
});

test('El Gordo de la Primitiva liquida las categorías por combinación y clave', () => {
  const draw = { winningNumbers: [1, 2, 3, 4, 5], extra: 7, prizes: [] };
  const first = calculatePlayPayout({ gameId: 'gordoprimitiva', columns: [{ numbers: [1, 2, 3, 4, 5], extra: 7 }] }, draw).columns[0];
  const seventh = calculatePlayPayout({ gameId: 'gordoprimitiva', columns: [{ numbers: [1, 2, 20, 21, 22], extra: 7 }] }, draw).columns[0];
  const none = calculatePlayPayout({ gameId: 'gordoprimitiva', columns: [{ numbers: [1, 20, 21, 22, 23], extra: 4 }] }, draw).columns[0];
  assert.match(first.category, /1\.ª categoría/);
  assert.equal(first.matches, 5);
  assert.equal(first.extraMatch, true);
  assert.match(seventh.category, /7\.ª categoría/);
  assert.equal(seventh.matches, 2);
  assert.equal(seventh.extraMatch, true);
  assert.equal(none.category, null);
  assert.equal(none.officialAmount, 0);
});


test('EuroDreams asigna el importe de la categoría exacta y no confunde el número de aciertos con otra fila', () => {
  const draw = {
    winningNumbers: [4, 12, 21, 27, 34, 39],
    extra: 1,
    prizes: [
      { category: '1ª 6 + 1', amount: 0, prize: 0 },
      { category: '2ª 6 + 0', amount: 2000, prize: 2000 },
      { category: '3ª 5 + 0/1', amount: 404.01, prize: 404.01 },
      { category: '4ª 4 + 0/1', amount: 32.03, prize: 32.03 },
      { category: '5ª 3 + 0/1', amount: 5.09, prize: 5.09 },
      { category: '6ª 2 + 0/1', amount: 2.5, prize: 2.5 },
    ],
  };
  const settlement = calculatePlayPayout({
    gameId: 'eurodreams',
    columns: [{ numbers: [3, 4, 11, 14, 32, 39], extra: 4 }],
  }, draw).columns[0];
  assert.equal(settlement.matches, 2);
  assert.match(settlement.category, /6\.ª categoría/);
  assert.equal(settlement.officialAmount, 2.5);
});
