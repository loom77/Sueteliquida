import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlayPayout } from '../src/utils/payout.js';
import {
  isConfirmedColumnPrize,
  playKnownPrize,
  sanitizePlay,
} from '../src/utils/playModel.js';
import { applyVerificationSettlement } from '../src/verification/verificationEngine.js';

test('el resumen ignora importes heredados sin categoría ni fuente confirmada', () => {
  const stale = {
    columns: [
      { status: 'checked', officialPrize: 1359.59 },
      { status: 'checked', prizeCategory: 'Importe heredado', officialPrize: 80 },
    ],
    receiptPrize: { officialAmount: 20 },
  };
  assert.equal(playKnownPrize(stale), 0);
});

test('el resumen suma únicamente premios con categoría y fuente explícita', () => {
  const confirmed = {
    columns: [
      { status: 'checked', prizeCategory: '13.ª categoría', officialPrize: 4.5, prizeSource: 'official-verification' },
      { status: 'checked', prizeCategory: 'Premio manual', officialPrize: 2, prizeSource: 'manual' },
      { status: 'checked', officialPrize: 9999, prizeSource: 'official-verification' },
    ],
    receiptPrize: {
      category: 'Reintegro del resguardo',
      officialAmount: 1,
      prizeSource: 'official-verification',
    },
  };
  assert.equal(playKnownPrize(confirmed), 7.5);
  assert.equal(isConfirmedColumnPrize(confirmed.columns[0]), true);
  assert.equal(isConfirmedColumnPrize(confirmed.columns[2]), false);
});

test('la sanitización conserva la procedencia de un premio confirmado', () => {
  const play = sanitizePlay({
    id: 'confirmed-prize',
    gameId: 'euromillones',
    purchased: true,
    status: 'checked',
    columns: [{
      id: 'column-1',
      numbers: [1, 2, 3, 20, 21],
      secondaryNumbers: [6, 8],
      status: 'checked',
      prizeCategory: '12.ª categoría',
      officialPrize: 4.5,
      prizeSource: 'official-verification',
      prizeConfirmedAt: '2026-08-06T16:00:00.000Z',
    }],
  });
  assert.equal(play.columns[0].prizeSource, 'official-verification');
  assert.equal(playKnownPrize(play), 4.5);
});

test('Euromillones no confunde la 12.ª categoría con la 2.ª categoría', () => {
  const draw = {
    winningNumbers: [1, 2, 3, 4, 5],
    secondaryNumbers: [6, 7],
    prizes: [
      { category: '2.ª categoría', prize: 1359.59 },
      { category: '12.ª categoría', prize: 4.5 },
    ],
  };
  const settlement = calculatePlayPayout({
    gameId: 'euromillones',
    columns: [{
      numbers: [1, 2, 20, 21, 22],
      secondaryNumbers: [6, 8],
    }],
  }, draw);
  assert.match(settlement.columns[0].category, /12\.ª categoría/);
  assert.equal(settlement.columns[0].officialAmount, 4.5);
});

test('la verificación oficial marca la fuente antes de incluir el importe en el resumen', () => {
  const checkedAt = '2026-08-06T16:30:00.000Z';
  const play = {
    id: 'verified',
    gameId: 'euromillones',
    purchased: true,
    columns: [{
      id: 'c1',
      numbers: [1, 2, 20, 21, 22],
      secondaryNumbers: [6, 8],
      status: 'draft',
    }],
  };
  const settlement = {
    complete: true,
    columns: [{
      category: '12.ª categoría',
      matches: 2,
      secondaryMatches: 1,
      officialAmount: 4.5,
      displayText: '4,50 €',
      payoutType: 'cash',
    }],
    receiptPrize: null,
  };
  const verified = applyVerificationSettlement(play, { sourceHash: 'official-source' }, settlement, { checkedAt });
  assert.equal(verified.columns[0].prizeSource, 'official-verification');
  assert.equal(verified.columns[0].prizeConfirmedAt, checkedAt);
  assert.equal(verified.metadata.verificationEngine, 'unified-v5-monthly-finance-integrity');
  assert.equal(playKnownPrize(verified), 4.5);
});
