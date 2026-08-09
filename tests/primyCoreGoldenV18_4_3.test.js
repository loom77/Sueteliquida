import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';

test('web Primy Core golden vector is frozen for Android alpha3 parity', () => {
  const drawInfo = {
    gameId: 'primitiva',
    drawDateKey: '2026-08-10',
    drawDateTimeISO: '2026-08-10T19:40:00.000Z',
    salesCloseISO: '2026-08-10T19:15:00.000Z',
    checkableFromISO: '2026-08-10T20:00:00.000Z',
  };
  const play = generateFusionPlay('primitiva', null, 3, {
    seed: '00112233445566778899aabbccddeeff',
    drawInfo,
    now: '2026-08-08T20:00:00.000Z',
  });
  assert.deepEqual(play.columns.map(column => column.numbers), [
    [3, 7, 20, 26, 35, 40],
    [3, 5, 13, 26, 31, 45],
    [7, 10, 12, 16, 21, 45],
  ]);
  assert.equal(play.receiptExtra, 6);
  assert.equal(play.metadata.seed, '00112233445566778899aabbccddeeff');
  assert.equal(play.method, 'primy-uniform');
});
