import { GAMES } from './gameConfig.js';
import { getMonthlyFinance } from './financeIntegrity.js';
import { playBetCount } from './playModel.js';

export function getDueByGame(history = []) {
  return Object.keys(GAMES).reduce((output, gameId) => {
    output[gameId] = history.filter(play => play.gameId === gameId && play.computedStatus === 'awaiting_check').length;
    return output;
  }, {});
}

export function getDueTotal(dueByGame = {}) {
  return Object.values(dueByGame).reduce((sum, count) => sum + Number(count || 0), 0);
}

export function getMonthlyStats(history = [], now = new Date()) {
  const finance = getMonthlyFinance(history, now);
  return {
    spent: finance.spent,
    won: finance.won,
    net: finance.net,
    plays: finance.purchasedPlays,
    winningPlays: finance.winningPlays,
    spentCents: finance.spentCents,
    wonCents: finance.wonCents,
    netCents: finance.netCents,
    monthKey: finance.monthKey,
    monthLabel: finance.monthLabel,
    details: finance.details,
    excluded: finance.excluded,
  };
}

export function getPurchasedTotals(history = []) {
  return history.reduce((output, play) => {
    if (!play.purchased) return output;
    output.plays += 1;
    output.columns += playBetCount(play);
    return output;
  }, { plays: 0, columns: 0 });
}
