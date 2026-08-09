import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePlay, playCostCents } from '../src/utils/playModel.js';
import { settlePlayAgainstOfficialData } from '../src/verification/verificationEngine.js';

const androidDraft = {
  id: 'android-alpha5-bonoloto',
  gameId: 'bonoloto',
  betType: 'simple',
  equivalentBets: 2,
  columns: [
    { id: 'c1', index: 1, numbers: [1, 2, 3, 4, 5, 7], status: 'draft' },
    { id: 'c2', index: 2, numbers: [1, 2, 3, 20, 21, 22], status: 'draft' },
  ],
  receiptExtra: null,
  createdAt: '2026-08-08T20:00:00.000Z',
  drawDateISO: '2026-08-09T19:30:00.000Z',
  drawDateTimeISO: '2026-08-09T19:30:00.000Z',
  drawDateKey: '2026-08-09',
  salesCloseISO: '2026-08-09T19:00:00.000Z',
  checkableFromISO: '2026-08-09T19:50:00.000Z',
  method: 'primy-uniform-15.5-parity',
  metadata: {
    androidClientVersion: '19.0.0-alpha5',
    scheduledDraw: { drawDateKey: '2026-08-09', selectionSource: 'android-draw-picker' },
  },
  purchased: false,
  status: 'draft',
  costCents: 100,
  dataContractVersion: '18.4.0',
};

test('v18.7.0 accepts an Android alpha5 Bonoloto draft without inventing the receipt reintegro', () => {
  const play = sanitizePlay(androidDraft);
  assert.ok(play);
  assert.equal(play.gameId, 'bonoloto');
  assert.equal(play.columns.length, 2);
  assert.equal(play.receiptExtra, null);
  assert.equal(play.drawDateKey, '2026-08-09');
  assert.equal(playCostCents(play), 100);
});

test('v18.7.0 refuses to treat Bonoloto as purchased until the real receipt reintegro is supplied', () => {
  assert.equal(sanitizePlay({ ...androidDraft, purchased: true, status: 'scheduled' }), null);
  const purchased = sanitizePlay({ ...androidDraft, purchased: true, status: 'scheduled', receiptExtra: 8 });
  assert.ok(purchased);
  assert.equal(purchased.receiptExtra, 8);
  assert.deepEqual(purchased.columns.map(column => column.extra), [8, 8]);
});

test('v18.7.0 exact-date lock also protects Android Bonoloto plays', () => {
  const play = sanitizePlay({ ...androidDraft, purchased: true, status: 'scheduled', receiptExtra: 8 });
  const mismatch = settlePlayAgainstOfficialData(play, {
    date: '2026-08-10',
    winningNumbers: [1, 2, 3, 4, 5, 6], complementary: 7, extra: 8, prizes: [],
  });
  assert.equal(mismatch.complete, false);
  assert.equal(mismatch.reason, 'OFFICIAL_DATE_MISMATCH');

  const exact = settlePlayAgainstOfficialData(play, {
    date: '2026-08-09',
    winningNumbers: [1, 2, 3, 4, 5, 6], complementary: 7, extra: 8,
    prizes: [
      { category: '2.ª categoría', amount: 10 },
      { category: '5.ª categoría', amount: 4 },
    ],
  });
  assert.equal(exact.complete, true);
  assert.equal(exact.columns[0].matches, 5);
  assert.match(exact.columns[0].category, /Complementario/);
  assert.equal(exact.receiptPrize.officialAmount, 1);
});
