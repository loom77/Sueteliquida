import test from 'node:test';
import assert from 'node:assert/strict';
import { getMonthlyFinance } from '../src/utils/financeIntegrity.js';
import { sanitizePlay } from '../src/utils/playModel.js';

const august = new Date('2026-08-15T10:00:00.000Z');

function basePlay(overrides = {}) {
  return {
    id: overrides.id || 'play-1',
    gameId: 'primitiva',
    purchased: true,
    purchasedAt: '2026-08-02T10:00:00.000Z',
    drawDateISO: '2026-08-03T20:00:00.000Z',
    drawDateKey: '2026-08-03',
    status: 'checked',
    columns: [{
      id: 'column-1',
      numbers: [1, 2, 3, 4, 5, 6],
      extra: 7,
      status: 'checked',
      prizeCategory: '5.ª categoría',
      officialPrize: 4.5,
      prizeSource: 'official-verification',
      prizeConfirmedAt: '2026-08-03T22:00:00.000Z',
    }],
    ...overrides,
  };
}

test('separa el mes de compra del mes del sorteo', () => {
  const play = basePlay({
    purchasedAt: '2026-07-31T18:00:00.000Z',
    drawDateISO: '2026-08-01T20:00:00.000Z',
  });
  const finance = getMonthlyFinance([play], august);
  assert.equal(finance.spent, 0);
  assert.equal(finance.won, 4.5);
  assert.equal(finance.net, 4.5);
});

test('non conta bozze o combinazioni solo generate come spesa', () => {
  const draft = basePlay({ purchased: false, status: 'draft', purchasedAt: undefined });
  const finance = getMonthlyFinance([draft], august);
  assert.equal(finance.spentCents, 0);
  assert.equal(finance.purchasedPlays, 0);
});

test('esclude il premio fantasma da 1.359,59 euro', () => {
  const stale = basePlay({
    columns: [{ id: 'legacy', numbers: [1, 2, 3, 4, 5, 6], extra: 7, status: 'checked', officialPrize: 1359.59 }],
  });
  const finance = getMonthlyFinance([stale], august);
  assert.equal(finance.wonCents, 0);
  assert.equal(finance.excluded.unconfirmedPrizeEntries, 1);
});

test('deduplica un boleto esterno con la stessa referenza', () => {
  const first = sanitizePlay(basePlay({ id: 'one', metadata: { externalReference: 'ABC-123' } }));
  const second = sanitizePlay(basePlay({ id: 'two', metadata: { externalReference: 'ABC-123' } }));
  const finance = getMonthlyFinance([first, second], august);
  assert.equal(finance.purchasedPlays, 1);
  assert.equal(finance.won, 4.5);
  assert.equal(finance.excluded.duplicateExpenseEntries, 1);
  assert.equal(finance.excluded.duplicatePrizeEntries, 1);
});

test('rispetta il cambio di mese nel fuso Europe/Madrid', () => {
  const play = basePlay({ purchasedAt: '2026-07-31T22:30:00.000Z' });
  const finance = getMonthlyFinance([play], august);
  assert.equal(finance.purchasedPlays, 1);
});

test('calcola il risultato netto in centesimi interi', () => {
  const play = basePlay();
  const finance = getMonthlyFinance([play], august);
  assert.equal(finance.spentCents, 100);
  assert.equal(finance.wonCents, 450);
  assert.equal(finance.netCents, 350);
  assert.equal(finance.net, 3.5);
});

test('la migrazione marca importi ereditati come non confermati e congela il costo', () => {
  const migrated = sanitizePlay(basePlay({
    columns: [{ id: 'legacy', numbers: [1, 2, 3, 4, 5, 6], extra: 7, status: 'checked', officialPrize: 1359.59 }],
  }));
  assert.equal(migrated.financeSchemaVersion, '18.0.2');
  assert.equal(migrated.costCents, 100);
  assert.equal(migrated.columns[0].prizeCents, 135959);
  assert.equal(migrated.columns[0].prizeStatus, 'unconfirmed');
});

test('la migrazione conferma premio, fonte e identificatore di verifica', () => {
  const migrated = sanitizePlay(basePlay());
  assert.equal(migrated.columns[0].prizeStatus, 'confirmed');
  assert.equal(migrated.columns[0].prizeCents, 450);
  assert.match(migrated.columns[0].verificationId, /^official-verification:/);
});
