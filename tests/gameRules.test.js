import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';
import { calculatePlayPayout } from '../src/utils/payout.js';
import { playKnownPrize, sanitizePlay } from '../src/utils/playModel.js';

test('La Primitiva usa un solo reintegro per tutte le colonne del resguardo', () => {
  const play = generateFusionPlay('primitiva', null, 3, { samples: 900, seed: 'shared-reintegro' });
  assert.equal(play.columns.length, 3);
  assert.ok(Number.isInteger(play.receiptExtra));
  assert.deepEqual([...new Set(play.columns.map(column => column.extra))], [play.receiptExtra]);
});

test('Il reintegro Primitiva restituisce l importo totale giocato sul resguardo una sola volta', () => {
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

test('EuroDreams mantiene un Sogno per ogni giocata semplice e massimo sei blocchi', () => {
  const play = generateFusionPlay('eurodreams', null, 9, { samples: 1300, seed: 'eurodreams-blocks' });
  assert.equal(play.columns.length, 6);
  assert.ok(play.columns.every(column => column.extra >= 1 && column.extra <= 5));
  assert.equal(play.receiptExtra, undefined);
});

test('La migrazione corregge vecchie giocate Primitiva con reintegri diversi e segnala la verifica', () => {
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
  assert.match(play.metadata.rulesMigrationWarning, /verifica il resguardo/i);
});

test('Il totale premi include il reintegro del resguardo senza duplicarlo per colonna', () => {
  const play = { columns: [{ officialPrize: 8 }, { officialPrize: 0 }], receiptPrize: { officialAmount: 2 } };
  assert.equal(playKnownPrize(play), 10);
});
