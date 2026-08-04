import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyVerificationSettlement,
  settlePlayAgainstOfficialData,
  verificationFamilyForGame,
  verificationLookupForPlay,
} from '../src/verification/verificationEngine.js';

test('clasifica todas las familias de comprobación', () => {
  assert.equal(verificationFamilyForGame('primitiva'), 'draw');
  assert.equal(verificationFamilyForGame('quiniela'), 'sports');
  assert.equal(verificationFamilyForGame('lototurf'), 'horse');
});

test('la comprobación unificada conserva 8 euros para tres aciertos de La Primitiva', () => {
  const play = {
    gameId: 'primitiva', receiptExtra: 1, purchased: true,
    columns: [{ id: 'c1', numbers: [3, 15, 22, 23, 24, 50], extra: 1 }],
  };
  const draw = {
    gameId: 'primitiva', date: '2026-08-01', winningNumbers: [3, 15, 22, 34, 42, 49], complementary: 7, extra: 4,
    prizes: [
      { category: '3.ª categoría', amount: 1357.09 },
      { category: '4.ª categoría', amount: 84.53 },
      { category: '5.ª categoría', amount: 8 },
    ],
  };
  const settlement = settlePlayAgainstOfficialData(play, draw);
  assert.equal(settlement.complete, true);
  assert.equal(settlement.columns[0].officialAmount, 8);
  const updated = applyVerificationSettlement(play, draw, settlement, { checkedAt: '2026-08-01T22:00:00Z' });
  assert.equal(updated.status, 'checked');
  assert.equal(updated.metadata.verificationEngine, 'unified-v2');
});

test('La Quiniela confirma aciertos y deja el importe pendiente si falta el escrutinio', () => {
  const play = {
    gameId: 'quiniela', roundId: 'quiniela:2026:1', purchased: true,
    columns: [{ id: 'q1', signs: Array(14).fill('1'), pleno: { home: '1', away: '0' } }],
  };
  const round = {
    gameId: 'quiniela', roundId: 'quiniela:2026:1', roundDate: '2026-08-02', status: 'official',
    matches: Array.from({ length: 15 }, (_, index) => ({ position: index + 1, officialScore: index === 14 ? { home: 1, away: 0 } : { home: 2, away: 0 } })),
    metadata: {},
  };
  const settlement = settlePlayAgainstOfficialData(play, round);
  assert.equal(settlement.complete, true);
  assert.equal(settlement.columns[0].category, 'Pleno al 15');
  assert.equal(settlement.columns[0].officialAmount, null);
  assert.equal(settlement.columns[0].payoutType, 'pending-official-scrutiny');
});

test('Lototurf calcula la categoría y el importe desde el resultado oficial', () => {
  const play = {
    gameId: 'lototurf', purchased: true, equivalentBets: 1,
    selection: { numbers: [1, 2, 3, 4, 5, 6], horses: [7] },
    columns: [{ id: 'l1', numbers: [1, 2, 3, 4, 5, 6], horses: [7], horse: 7 }],
  };
  const round = {
    gameId: 'lototurf', roundId: 'lototurf:1', result: {
      valid: true, winningNumbers: [1, 2, 3, 4, 5, 6], winningHorse: 7, reintegro: 4,
      prizeCategories: [{ category: '1.ª categoría', prize: 1200 }],
    },
  };
  const settlement = settlePlayAgainstOfficialData(play, round);
  assert.equal(settlement.complete, true);
  assert.equal(settlement.columns[0].officialAmount, 1200);
  assert.equal(settlement.columns[0].breakdown['1'], 1);
});

test('Quíntuple Plus cuenta una apuesta de primera categoría', () => {
  const play = {
    gameId: 'quintuple-plus', purchased: true, equivalentBets: 1,
    selection: { rows: [[1], [2], [3], [4], [5], [6]] },
    columns: [{ id: 'h1', rows: [[1], [2], [3], [4], [5], [6]] }],
  };
  const round = {
    gameId: 'quintuple-plus', roundId: 'quintuple-plus:1', result: {
      valid: true, winners: [1, 2, 3, 4, 5], secondFifth: 6,
      prizeCategories: [{ category: '1.ª categoría', prize: 2500 }],
    },
  };
  const settlement = settlePlayAgainstOfficialData(play, round);
  assert.equal(settlement.complete, true);
  assert.equal(settlement.columns[0].officialAmount, 2500);
  assert.equal(settlement.columns[0].breakdown['1'], 1);
});

test('la búsqueda prioriza roundId y conserva la fecha', () => {
  assert.deepEqual(verificationLookupForPlay({ gameId: 'quiniela', roundId: 'q:1', drawDateKey: '2026-08-02' }), {
    gameId: 'quiniela', family: 'sports', date: '2026-08-02', roundId: 'q:1',
  });
});
