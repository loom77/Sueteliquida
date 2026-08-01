import { getGameConfig } from './gameConfig.js';
import { getNextDrawInfo } from './drawSchedule.js';
import { scoreCombination, selectPortfolio } from './historyAnalytics.js';

function secureRandom(min, max) {
  const range = max - min + 1;
  const maxValid = Math.floor(0x100000000 / range) * range;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= maxValid);
  return min + (buffer[0] % range);
}

function randomSelection(min, max, count) {
  const pool = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const output = [];
  while (output.length < count) output.push(pool.splice(secureRandom(0, pool.length - 1), 1)[0]);
  return output.sort((left, right) => left - right);
}

function randomCombination(game) {
  return randomSelection(1, game.numberPoolMax, game.numbersToPick);
}

function humanPattern(combination, poolMax) {
  let run = 1;
  for (let index = 1; index < combination.length; index += 1) {
    run = combination[index] === combination[index - 1] + 1 ? run + 1 : 1;
    if (run >= 3) return true;
  }
  const high = combination.filter(number => number > Math.floor(poolMax / 2)).length;
  return high < 2 || combination.filter(number => number <= 31).length >= Math.min(5, combination.length);
}

function supplement(game) {
  if (game.secondary) return { secondaryNumbers: randomSelection(game.secondary.min, game.secondary.max, game.secondary.count) };
  return { extra: secureRandom(game.extra.min ?? 1, game.extra.max) };
}

function baseTicket(gameId, ticket, method, metadata = {}) {
  const game = getGameConfig(gameId);
  const draw = getNextDrawInfo(game.id);
  return {
    id: crypto.randomUUID(),
    gameId: game.id,
    ticket,
    ...supplement(game),
    createdAt: new Date().toISOString(),
    ...draw,
    method,
    metadata,
    purchased: false,
    status: 'draft',
  };
}

export function generateTicket(gameId, { antiPattern = true } = {}) {
  const game = getGameConfig(gameId);
  let combo = randomCombination(game);
  let attempts = 0;
  while (antiPattern && humanPattern(combo, game.numberPoolMax) && attempts++ < 100) combo = randomCombination(game);
  return baseTicket(gameId, combo, antiPattern ? 'crypto-antipattern' : 'crypto-pure');
}

export function generateTicketFromPool(gameId, candidatePool) {
  const game = getGameConfig(gameId);
  if (!Array.isArray(candidatePool) || candidatePool.length < game.numbersToPick) throw new Error('Pool insuficiente');
  const pool = [...new Set(candidatePool.map(Number))];
  const output = [];
  while (output.length < game.numbersToPick) output.push(pool.splice(secureRandom(0, pool.length - 1), 1)[0]);
  return baseTicket(gameId, output.sort((left, right) => left - right), 'montecarlo-hotpool');
}

export function generateHistoricalTicket(gameId, analysis, { samples = 12000 } = {}) {
  const game = getGameConfig(gameId);
  if (!analysis?.totalDraws) throw new Error('Histórico no disponible');
  let best = null;
  for (let index = 0; index < samples; index += 1) {
    const ticket = randomCombination(game);
    const rated = { ticket, ...scoreCombination(gameId, ticket, analysis) };
    if (!best || rated.score > best.score) best = rated;
  }
  return baseTicket(gameId, best.ticket, 'history-ranked', { score: best.score, scoreParts: best.parts, historyDraws: analysis.totalDraws, historyTo: analysis.to });
}

export function generatePortfolio(gameId, analysis, count = 5, { samples = 30000, minDistance = 4 } = {}) {
  const game = getGameConfig(gameId);
  if (!analysis?.totalDraws) throw new Error('Histórico no disponible');
  const candidates = [];
  for (let index = 0; index < samples; index += 1) {
    const ticket = randomCombination(game);
    candidates.push({ ticket, ...scoreCombination(gameId, ticket, analysis) });
  }
  return selectPortfolio(candidates, Math.max(2, Math.min(Number(count) || 5, 20)), { minDistance })
    .map((candidate, index) => baseTicket(gameId, candidate.ticket, 'portfolio-optimized', {
      portfolioIndex: index + 1,
      portfolioSize: count,
      score: candidate.score,
      scoreParts: candidate.parts,
      historyDraws: analysis.totalDraws,
      historyTo: analysis.to,
    }));
}
