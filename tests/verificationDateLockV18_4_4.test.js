import test from 'node:test';
import assert from 'node:assert/strict';
import { settlePlayAgainstOfficialData, verificationLookupForPlay } from '../src/verification/verificationEngine.js';

test('v18.7.0 refuses a Primitiva result from a date different from the stored drawDateKey', () => {
  const play = {
    id: 'locked-play', gameId: 'primitiva', drawDateKey: '2026-08-13', receiptExtra: 4, purchased: true,
    columns: [{ id: 'c1', numbers: [3, 15, 22, 23, 24, 50], extra: 4 }],
  };
  const wrong = {
    gameId: 'primitiva', date: '2026-08-10', winningNumbers: [3, 15, 22, 34, 42, 49], complementary: 7, extra: 4, prizes: [],
  };
  const result = settlePlayAgainstOfficialData(play, wrong);
  assert.equal(result.complete, false);
  assert.equal(result.reason, 'OFFICIAL_DATE_MISMATCH');
  assert.equal(result.expectedDate, '2026-08-13');
  assert.equal(result.officialDate, '2026-08-10');
});

test('v18.7.0 settles only the exact stored draw', () => {
  const play = {
    id: 'locked-play', gameId: 'primitiva', drawDateKey: '2026-08-13', receiptExtra: 1, purchased: true,
    columns: [{ id: 'c1', numbers: [3, 15, 22, 23, 24, 50], extra: 1 }],
  };
  const exact = {
    gameId: 'primitiva', date: '2026-08-13', winningNumbers: [3, 15, 22, 34, 42, 49], complementary: 7, extra: 4,
    prizes: [{ category: '5.ª categoría', amount: 8 }],
  };
  assert.deepEqual(verificationLookupForPlay(play), { gameId: 'primitiva', family: 'draw', date: '2026-08-13', roundId: '' });
  const result = settlePlayAgainstOfficialData(play, exact);
  assert.equal(result.complete, true);
  assert.equal(result.columns[0].officialAmount, 8);
});

test('v18.7.0 storage does not persist a mismatched official payload as the play result', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync(new URL('../src/hooks/useStorage.js', import.meta.url), 'utf8');
  assert.match(source, /identityMismatch/);
  assert.match(source, /OFFICIAL_DATE_MISMATCH/);
  assert.match(source, /identityMismatch \? \{\} : \{ result: event\.payload \}/);
});
