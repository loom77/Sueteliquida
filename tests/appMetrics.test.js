import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueByGame, getDueTotal, getMonthlyStats, getPurchasedTotals } from '../src/utils/appMetrics.js';

const now = new Date('2026-07-30T10:00:00.000Z');

const history = [
  {
    id: 'a',
    gameId: 'primitiva',
    purchased: true,
    purchasedAt: '2026-07-12T10:00:00.000Z',
    computedStatus: 'awaiting_check',
    status: 'checked',
    columns: [{ officialPrize: 5 }, { officialPrize: 0 }],
    receiptPrize: { officialAmount: 1 },
  },
  {
    id: 'b',
    gameId: 'eurodreams',
    purchased: true,
    purchasedAt: '2026-07-18T10:00:00.000Z',
    computedStatus: 'scheduled',
    status: 'scheduled',
    columns: [{}, {}],
  },
  {
    id: 'c',
    gameId: 'primitiva',
    purchased: false,
    createdAt: '2026-07-20T10:00:00.000Z',
    computedStatus: 'awaiting_check',
    status: 'draft',
    columns: [{}],
  },
];

test('resume las jugadas pendientes por juego', () => {
  const due = getDueByGame(history);
  assert.equal(due.primitiva, 2);
  assert.equal(due.eurodreams, 0);
  assert.equal(getDueTotal(due), 2);
});

test('calcula el gasto y los premios del mes de Madrid', () => {
  const stats = getMonthlyStats(history, now);
  assert.deepEqual(stats, { spent: 7, won: 6, plays: 2 });
});

test('cuenta únicamente jugadas compradas y sus columnas', () => {
  assert.deepEqual(getPurchasedTotals(history), { plays: 2, columns: 4 });
});
