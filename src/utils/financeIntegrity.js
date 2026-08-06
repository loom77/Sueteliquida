import { monthKeyMadrid } from './drawSchedule.js';
import {
  fromMoneyCents,
  isConfirmedColumnPrize,
  isConfirmedReceiptPrize,
  playCostCents,
  toMoneyCents,
} from './playModel.js';

const monthFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  month: 'long',
  year: 'numeric',
});

function validDateValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function purchaseDateForPlay(play) {
  return validDateValue(play?.purchasedAt || play?.purchaseDateISO || play?.registeredAt || play?.createdAt);
}

export function drawDateForPlay(play) {
  return validDateValue(play?.drawDateTimeISO || play?.drawDateISO || (play?.drawDateKey ? `${play.drawDateKey}T12:00:00.000Z` : ''));
}

function explicitTicketReference(play) {
  return String(
    play?.financeId
    || play?.ticketReference
    || play?.metadata?.externalReference
    || play?.metadata?.ticketReference
    || play?.metadata?.barcode
    || ''
  ).trim();
}

function ticketIdentity(play) {
  const explicit = explicitTicketReference(play);
  if (explicit) return `${play?.gameId || 'unknown'}:${play?.drawDateKey || drawDateForPlay(play)}:${explicit}`;
  return String(play?.id || crypto.randomUUID());
}

function prizeCents(record, centsField, amountField) {
  const stored = Number(record?.[centsField]);
  if (Number.isInteger(stored) && stored >= 0) return stored;
  return toMoneyCents(record?.[amountField]);
}

function confirmedPrizeEntries(play) {
  const identity = ticketIdentity(play);
  const hasExplicitReference = Boolean(explicitTicketReference(play));
  const entries = [];
  (play?.columns || []).forEach((column, index) => {
    if (!isConfirmedColumnPrize(column)) return;
    const amountCents = prizeCents(column, 'prizeCents', 'officialPrize');
    if (amountCents <= 0) return;
    entries.push({
      key: String(hasExplicitReference ? `prize:${identity}:column:${column.id || index}` : column.verificationId || `prize:${identity}:column:${column.id || index}`),
      playId: play.id,
      gameId: play.gameId,
      columnId: column.id || String(index),
      category: column.prizeCategory,
      source: column.prizeSource,
      verifiedAt: column.verifiedAt || column.prizeConfirmedAt || play?.metadata?.verifiedAt || '',
      amountCents,
      amount: fromMoneyCents(amountCents),
      kind: 'column',
    });
  });
  if (isConfirmedReceiptPrize(play?.receiptPrize)) {
    const receipt = play.receiptPrize;
    const amountCents = prizeCents(receipt, 'prizeCents', 'officialAmount');
    if (amountCents > 0) {
      entries.push({
        key: String(hasExplicitReference ? `prize:${identity}:receipt` : receipt.verificationId || `prize:${identity}:receipt`),
        playId: play.id,
        gameId: play.gameId,
        columnId: 'receipt',
        category: receipt.category,
        source: receipt.prizeSource,
        verifiedAt: receipt.verifiedAt || receipt.prizeConfirmedAt || play?.metadata?.verifiedAt || '',
        amountCents,
        amount: fromMoneyCents(amountCents),
        kind: 'receipt',
      });
    }
  }
  return entries;
}

function unconfirmedPrizeCount(play) {
  const columns = (play?.columns || []).filter(column => {
    const amountCents = prizeCents(column, 'prizeCents', 'officialPrize');
    return amountCents > 0 && !isConfirmedColumnPrize(column);
  }).length;
  const receiptAmount = prizeCents(play?.receiptPrize, 'prizeCents', 'officialAmount');
  return columns + (receiptAmount > 0 && !isConfirmedReceiptPrize(play?.receiptPrize) ? 1 : 0);
}

export function getMonthlyFinance(history = [], now = new Date()) {
  const monthKey = monthKeyMadrid(now);
  const expenseKeys = new Set();
  const prizeKeys = new Set();
  const winningPlayIds = new Set();
  const expenses = [];
  const winnings = [];
  const excluded = {
    unconfirmedPrizeEntries: 0,
    undatedPrizeEntries: 0,
    invalidExpenseEntries: 0,
    duplicateExpenseEntries: 0,
    duplicatePrizeEntries: 0,
  };

  for (const play of history || []) {
    const purchaseDate = purchaseDateForPlay(play);
    if (play?.purchased && !purchaseDate) excluded.invalidExpenseEntries += 1;
    if (play?.purchased && monthKeyMadrid(purchaseDate) === monthKey) {
      const amountCents = playCostCents(play);
      const key = `expense:${ticketIdentity(play)}`;
      if (amountCents <= 0) {
        excluded.invalidExpenseEntries += 1;
      } else if (expenseKeys.has(key)) {
        excluded.duplicateExpenseEntries += 1;
      } else {
        expenseKeys.add(key);
        expenses.push({
          key,
          playId: play.id,
          gameId: play.gameId,
          date: purchaseDate,
          amountCents,
          amount: fromMoneyCents(amountCents),
        });
      }
    }

    const drawDate = drawDateForPlay(play);
    const prizes = confirmedPrizeEntries(play);
    if (prizes.length && !drawDate) excluded.undatedPrizeEntries += prizes.length;
    if (monthKeyMadrid(drawDate) === monthKey) {
      excluded.unconfirmedPrizeEntries += unconfirmedPrizeCount(play);
      for (const prize of prizes) {
        if (prizeKeys.has(prize.key)) {
          excluded.duplicatePrizeEntries += 1;
          continue;
        }
        prizeKeys.add(prize.key);
        winningPlayIds.add(String(play.id));
        winnings.push({ ...prize, date: drawDate });
      }
    }
  }

  const spentCents = expenses.reduce((sum, entry) => sum + entry.amountCents, 0);
  const wonCents = winnings.reduce((sum, entry) => sum + entry.amountCents, 0);
  const netCents = wonCents - spentCents;
  const referenceDate = now instanceof Date ? now : new Date(now);

  return {
    monthKey,
    monthLabel: Number.isNaN(referenceDate.getTime()) ? monthKey : monthFormatter.format(referenceDate),
    spentCents,
    wonCents,
    netCents,
    spent: fromMoneyCents(spentCents),
    won: fromMoneyCents(wonCents),
    net: fromMoneyCents(netCents),
    purchasedPlays: expenses.length,
    winningPlays: winningPlayIds.size,
    details: { expenses, winnings },
    excluded,
  };
}
