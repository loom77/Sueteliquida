import { getGameConfig } from './gameConfig.js';

export function overlap(a, b) {
  const set = new Set(a);
  return b.reduce((count, number) => count + (set.has(number) ? 1 : 0), 0);
}

function ticketOf(item) {
  return item.ticket || item.numbers || item;
}

export function coverageMetrics(gameId, tickets) {
  const game = getGameConfig(gameId);
  const frequency = Array(game.numberPoolMax + 1).fill(0);
  for (const item of tickets) for (const number of ticketOf(item)) frequency[number] += 1;
  const uniqueNumbers = frequency.slice(1).filter(Boolean).length;
  const maxNumberReuse = Math.max(0, ...frequency);
  let totalOverlap = 0;
  let pairs = 0;
  for (let first = 0; first < tickets.length; first += 1) {
    for (let second = first + 1; second < tickets.length; second += 1) {
      totalOverlap += overlap(ticketOf(tickets[first]), ticketOf(tickets[second]));
      pairs += 1;
    }
  }
  return {
    uniqueNumbers,
    coverageRatio: uniqueNumbers / game.numberPoolMax,
    maxNumberReuse,
    averageOverlap: pairs ? totalOverlap / pairs : 0,
  };
}

function probabilityFor(probabilities, number, fallback) {
  if (!Array.isArray(probabilities)) return fallback;
  return Number(probabilities[number - 1]) || fallback;
}

export function portfolioObjective(gameId, tickets, {
  probabilities,
  qualityWeight = 0.08,
  pairCoverageWeight = 0.24,
} = {}) {
  const game = getGameConfig(gameId);
  if (!tickets.length) return -Infinity;
  const fallbackProbability = game.numbersToPick / game.numberPoolMax;
  const usage = Array(game.numberPoolMax + 1).fill(0);
  const coveredPairs = new Set();
  let quality = 0;
  let overlapPenalty = 0;

  for (const item of tickets) {
    const ticket = ticketOf(item);
    quality += Number(item.score) || 0;
    for (const number of ticket) usage[number] += 1;
    for (let first = 0; first < ticket.length; first += 1) {
      for (let second = first + 1; second < ticket.length; second += 1) {
        coveredPairs.add(`${ticket[first]}-${ticket[second]}`);
      }
    }
  }

  for (let first = 0; first < tickets.length; first += 1) {
    for (let second = first + 1; second < tickets.length; second += 1) {
      const shared = overlap(ticketOf(tickets[first]), ticketOf(tickets[second]));
      overlapPenalty += shared ** 1.7;
    }
  }

  let weightedCoverage = 0;
  let reusePenalty = 0;
  for (let number = 1; number <= game.numberPoolMax; number += 1) {
    const probability = probabilityFor(probabilities, number, fallbackProbability);
    if (usage[number] > 0) weightedCoverage += probability;
    if (usage[number] > 1) reusePenalty += probability * ((usage[number] - 1) ** 1.65);
  }

  let weightedPairCoverage = 0;
  for (const key of coveredPairs) {
    const [left, right] = key.split('-').map(Number);
    weightedPairCoverage += probabilityFor(probabilities, left, fallbackProbability)
      * probabilityFor(probabilities, right, fallbackProbability);
  }

  return (
    weightedCoverage * 150
    + weightedPairCoverage * pairCoverageWeight * 100
    + quality / tickets.length * qualityWeight
    - reusePenalty * 28
    - overlapPenalty * 2.8
  );
}

function greedySelection(gameId, candidates, target, options) {
  const selected = [];
  const remaining = [...candidates];
  while (selected.length < target && remaining.length) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (let index = 0; index < remaining.length; index += 1) {
      const value = portfolioObjective(gameId, [...selected, remaining[index]], options);
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return { selected, remaining };
}

/**
 * Greedy covering design followed by deterministic local swap search.
 * This is still an approximation, but it improves global portfolio coverage
 * over a one-pass greedy selection without adding a heavy solver dependency.
 */
export function optimizeCoverage(gameId, candidates, count, options = {}) {
  const target = Math.max(1, Math.min(Number(count) || 1, 20));
  if (!Array.isArray(candidates) || !candidates.length) return [];
  const candidateLimit = Math.max(target * 30, Math.min(Number(options.candidateLimit) || 700, candidates.length));
  const ordered = options.rankCandidates === false
    ? [...candidates]
    : [...candidates].sort((left, right) => (Number(right.score) || 0) - (Number(left.score) || 0));
  const pool = ordered.slice(0, candidateLimit);
  const { selected, remaining } = greedySelection(gameId, pool, target, options);
  let bestScore = portfolioObjective(gameId, selected, options);
  const iterations = Math.max(0, Math.min(Number(options.localIterations) || 140, 500));

  for (let iteration = 0; iteration < iterations && remaining.length; iteration += 1) {
    const selectedIndex = iteration % selected.length;
    const start = (iteration * 17) % remaining.length;
    const checks = Math.min(45, remaining.length);
    let replacementIndex = -1;
    let replacementScore = bestScore;
    for (let offset = 0; offset < checks; offset += 1) {
      const candidateIndex = (start + offset) % remaining.length;
      const trial = [...selected];
      trial[selectedIndex] = remaining[candidateIndex];
      const score = portfolioObjective(gameId, trial, options);
      if (score > replacementScore + 1e-9) {
        replacementScore = score;
        replacementIndex = candidateIndex;
      }
    }
    if (replacementIndex >= 0) {
      const previous = selected[selectedIndex];
      selected[selectedIndex] = remaining[replacementIndex];
      remaining[replacementIndex] = previous;
      bestScore = replacementScore;
    }
  }

  return selected;
}
