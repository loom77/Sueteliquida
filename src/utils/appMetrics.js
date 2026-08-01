import { GAMES } from './gameConfig.js';
import { monthKeyMadrid } from './drawSchedule.js';
import { playCost, playKnownPrize } from './playModel.js';

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
  const key = monthKeyMadrid(now);
  return history.reduce((output, play) => {
    const purchasedAt = play.purchasedAt || play.createdAt;
    if (!play.purchased || monthKeyMadrid(purchasedAt) !== key) return output;
    output.plays += 1;
    output.spent += playCost(play);
    if (play.status === 'checked') output.won += playKnownPrize(play);
    return output;
  }, { spent: 0, won: 0, plays: 0 });
}

export function getPurchasedTotals(history = []) {
  return history.reduce((output, play) => {
    if (!play.purchased) return output;
    output.plays += 1;
    output.columns += Array.isArray(play.columns) ? play.columns.length : 0;
    return output;
  }, { plays: 0, columns: 0 });
}
