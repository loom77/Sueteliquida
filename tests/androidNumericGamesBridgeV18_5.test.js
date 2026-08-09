import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePlay, PLAY_DATA_CONTRACT_VERSION } from '../src/utils/playModel.js';
import { calculatePlayPayout } from '../src/utils/payout.js';

const base = (gameId, columns, extra = {}) => ({
  id: `android-${gameId}-beta1`,
  gameId,
  columns,
  betType: 'simple',
  equivalentBets: columns.length,
  createdAt: '2026-08-09T00:30:00.000Z',
  purchasedAt: '2026-08-09T00:31:00.000Z',
  purchased: true,
  status: 'scheduled',
  drawDateKey: '2026-08-11',
  drawDateISO: '2026-08-11T19:00:00.000Z',
  drawDateTimeISO: '2026-08-11T19:00:00.000Z',
  salesCloseISO: '2026-08-11T18:30:00.000Z',
  checkableFromISO: '2026-08-11T19:35:00.000Z',
  costCents: 250 * columns.length,
  method: 'primy-uniform-19.1-multigame',
  metadata: { androidClientVersion: '19.1.0-beta1' },
  ...extra,
});

test('v18.7.0 accepts Android Euromillones columns with two stars per column', () => {
  const play = sanitizePlay(base('euromillones', [
    { id: 'e1', index: 1, numbers: [1, 8, 19, 34, 50], secondaryNumbers: [2, 11] },
    { id: 'e2', index: 2, numbers: [4, 17, 23, 39, 44], secondaryNumbers: [1, 9] },
  ], { costCents: 500 }));
  assert.ok(play);
  assert.equal(play.gameId, 'euromillones');
  assert.deepEqual(play.columns[0].secondaryNumbers, [2, 11]);
  assert.equal(play.costCents, 500);
  assert.equal(play.dataContractVersion, '18.7.0');
  assert.equal(PLAY_DATA_CONTRACT_VERSION, '18.7.0');
});

test('v18.7.0 accepts Android El Gordo column extras without treating them as receipt reintegro', () => {
  const play = sanitizePlay(base('gordoprimitiva', [
    { id: 'g1', index: 1, numbers: [3, 14, 27, 41, 54], extra: 7 },
  ], { drawDateKey: '2026-08-16', costCents: 150 }));
  assert.ok(play);
  assert.equal(play.columns[0].extra, 7);
  assert.equal('receiptExtra' in play, false);
});

test('v18.7.0 accepts Android EuroDreams Sueño per column and preserves deferred payouts', () => {
  const play = sanitizePlay(base('eurodreams', [
    { id: 'd1', index: 1, numbers: [2, 7, 13, 21, 31, 40], extra: 4 },
  ], { drawDateKey: '2026-08-10', costCents: 250 }));
  assert.ok(play);
  assert.equal(play.columns[0].extra, 4);
  const payout = calculatePlayPayout(play, {
    winningNumbers: [2, 7, 13, 21, 31, 40],
    extra: 4,
    prizes: [],
  });
  assert.equal(payout.columns[0].category, '1.ª categoría (6 + Sueño)');
  assert.equal(payout.columns[0].payoutType, 'deferred');
  assert.match(payout.columns[0].displayText, /20\.000/);
});
