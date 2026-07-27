import { getGameConfig } from './gameConfig.js';
import { getNextDrawInfo } from './drawSchedule.js';
import { getEvidenceProfile, probabilityAffinity } from './evidenceEngine.js';
import { weightedCombination } from './predictiveModels.js';
import { coverageMetrics, optimizeCoverage } from './portfolioOptimizer.js';

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function seedFromString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function createSeededRandom(seedValue) {
  let state = seedFromString(seedValue);
  const uint32 = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  return {
    uint32,
    float: () => uint32() / 0x100000000,
    int(min, max) {
      const range = max - min + 1;
      const maxValid = Math.floor(0x100000000 / range) * range;
      let value;
      do value = uint32(); while (value >= maxValid);
      return min + (value % range);
    },
  };
}

function createGenerationSeed() {
  const buffer = new Uint32Array(4);
  crypto.getRandomValues(buffer);
  return [...buffer].map(value => value.toString(16).padStart(8, '0')).join('');
}

function shuffle(values, rng) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = rng.int(0, index);
    [output[index], output[other]] = [output[other], output[index]];
  }
  return output;
}

function randomCombination(gameId, game, profile, rng) {
  if (profile.signalWeight > 0) return weightedCombination(gameId, profile.probabilities, rng.float);
  const pool = Array.from({ length: game.numberPoolMax }, (_, index) => index + 1);
  const output = [];
  while (output.length < game.numbersToPick) {
    output.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  }
  return output.sort((left, right) => left - right);
}

function longestRun(numbers) {
  let longest = 1;
  let run = 1;
  for (let index = 1; index < numbers.length; index += 1) {
    run = numbers[index] === numbers[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

function maxBucketCount(numbers, bucketSize = 10) {
  const buckets = new Map();
  for (const number of numbers) {
    const bucket = Math.floor((number - 1) / bucketSize);
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }
  return Math.max(0, ...buckets.values());
}

function repeatedLastDigits(numbers) {
  const counts = new Map();
  for (const number of numbers) {
    const digit = number % 10;
    counts.set(digit, (counts.get(digit) || 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

/**
 * Descriptive balance only. It is never presented as a higher draw probability.
 */
export function scoreStructuralQuality(gameId, numbers) {
  const game = getGameConfig(gameId);
  const sorted = [...numbers].sort((left, right) => left - right);
  const odd = sorted.filter(number => number % 2 !== 0).length;
  const high = sorted.filter(number => number > game.numberPoolMax / 2).length;
  const theoreticalMean = game.numbersToPick * (game.numberPoolMax + 1) / 2;
  const sum = sorted.reduce((total, number) => total + number, 0);
  const expectedSpread = game.numberPoolMax * 0.62;
  const parity = 1 - clamp(Math.abs(odd - game.numbersToPick / 2) / (game.numbersToPick / 2));
  const range = 1 - clamp(Math.abs(high - game.numbersToPick / 2) / (game.numbersToPick / 2));
  const sumFit = 1 - clamp(Math.abs(sum - theoreticalMean) / expectedSpread);
  const decadeSpread = 1 - clamp((maxBucketCount(sorted) - 2) / Math.max(1, game.numbersToPick - 2));
  const runFit = longestRun(sorted) >= 4 ? 0 : longestRun(sorted) === 3 ? 0.55 : 1;
  const score = 100 * mean([parity, range, sumFit, decadeSpread, runFit]);
  return {
    score: Math.round(score * 10) / 10,
    parts: {
      parity: Math.round(parity * 100),
      range: Math.round(range * 100),
      sum: Math.round(sumFit * 100),
      spread: Math.round(decadeSpread * 100),
      sequences: Math.round(runFit * 100),
    },
  };
}

/**
 * Secondary expected-payout tie-breaker based on documented human choice biases.
 * It does not claim to improve the probability of matching the draw.
 */
export function scoreAntiShare(gameId, numbers) {
  const game = getGameConfig(gameId);
  const sorted = [...numbers].sort((left, right) => left - right);
  const birthdayRatio = sorted.filter(number => number <= 31).length / game.numbersToPick;
  const birthdayFit = 1 - clamp((birthdayRatio - 0.5) / 0.5);
  const runFit = longestRun(sorted) >= 3 ? 0.25 : 1;
  const decadeFit = 1 - clamp((maxBucketCount(sorted) - 2) / Math.max(1, game.numbersToPick - 2));
  const lastDigitFit = 1 - clamp((repeatedLastDigits(sorted) - 2) / Math.max(1, game.numbersToPick - 2));
  const allMultiples = sorted.every(number => number % 5 === 0 || number % 7 === 0) ? 0 : 1;
  const score = 100 * mean([birthdayFit, runFit, decadeFit, lastDigitFit, allMultiples]);
  return {
    score: Math.round(score * 10) / 10,
    parts: {
      birthdays: Math.round(birthdayFit * 100),
      sequences: Math.round(runFit * 100),
      decades: Math.round(decadeFit * 100),
      lastDigits: Math.round(lastDigitFit * 100),
    },
  };
}

export function resolveFusionProfile(gameId, analysis, evidenceOptions = {}) {
  const evidence = getEvidenceProfile(gameId, analysis, evidenceOptions);
  const historicalWeight = evidence.signalWeight || 0;
  return {
    hasHistory: Boolean(analysis?.totalDraws),
    evidence,
    audit: {
      eligible: evidence.eligible,
      reason: evidence.reason,
      runs: evidence.runs,
      delta: mean(evidence.models?.map(model => model.meanHitGain) || []),
      lower95: Math.max(0, ...((evidence.models || []).map(model => model.lowerHitGain))),
      foldWinRate: null,
    },
    probabilities: evidence.probabilities,
    signalWeight: historicalWeight,
    // Only validated probability estimates influence hit-oriented ranking.
    // Structural balance and anti-sharing remain diagnostics and never masquerade
    // as predictive evidence.
    weights: {
      predictive: historicalWeight,
      historical: historicalWeight,
      portfolioCoverage: 1,
      structural: 0,
      antiShare: 0,
    },
  };
}

function overlapCount(left, right) {
  const set = new Set(left);
  return right.reduce((count, number) => count + (set.has(number) ? 1 : 0), 0);
}

function anchorDiversityScore(numbers, avoidColumns = []) {
  if (!Array.isArray(avoidColumns) || !avoidColumns.length) return 100;
  const maximumOverlap = Math.max(0, ...avoidColumns.map(column => overlapCount(numbers, column.numbers || column.ticket || [])));
  return Math.max(0, 100 - maximumOverlap * 18);
}

function scoreCandidate(gameId, numbers, profile, avoidColumns = []) {
  const structural = scoreStructuralQuality(gameId, numbers);
  const antiShare = scoreAntiShare(gameId, numbers);
  const predictive = profile.signalWeight > 0
    ? probabilityAffinity(gameId, numbers, profile.probabilities)
    : 50;
  const diversity = anchorDiversityScore(numbers, avoidColumns);
  // Hit-oriented score: no historical evidence means every valid combination is
  // neutral. Human-pattern and visual-balance diagnostics are kept out of the
  // predictive rank. For variants, distance from the source is only a small,
  // explicit diversification term.
  const finalScore = avoidColumns.length
    ? predictive * 0.95 + diversity * 0.05
    : predictive;
  return {
    ticket: numbers,
    score: Math.round(finalScore * 10) / 10,
    probabilityScore: predictive,
    parts: {
      predictive,
      structural: structural.score,
      antiShare: antiShare.score,
      sourceDiversity: diversity,
      structuralDetails: structural.parts,
      antiShareDetails: antiShare.parts,
    },
  };
}

function distributeExtras(game, count, rng) {
  const values = [];
  for (let extra = game.extra.min; extra <= game.extra.max; extra += 1) values.push(extra);
  const output = [];
  let cycle = shuffle(values, rng);
  while (output.length < count) {
    if (!cycle.length) cycle = shuffle(values, rng);
    output.push(cycle.shift());
  }
  return output;
}

export function generateFusionPlay(gameId, analysis, columnCount = 1, options = {}) {
  const game = getGameConfig(gameId);
  const seed = String(options.seed || createGenerationSeed());
  const rng = createSeededRandom(seed);
  const count = Math.max(1, Math.min(Number(columnCount) || 1, 20));
  const samples = Math.max(count * 250, Math.min(Number(options.samples) || Math.max(6000, count * 1000), 36000));
  const profile = resolveFusionProfile(gameId, analysis, options.evidenceOptions || options.auditOptions || {});
  const candidates = [];
  const seen = new Set();

  for (let index = 0; index < samples; index += 1) {
    const numbers = randomCombination(gameId, game, profile, rng);
    const key = numbers.join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(scoreCandidate(gameId, numbers, profile, options.avoidColumns || []));
    if (options.onProgress && index % 500 === 0) options.onProgress(index / samples);
  }

  const selected = optimizeCoverage(gameId, candidates, count, {
    probabilities: profile.probabilities,
    qualityWeight: profile.signalWeight > 0 ? 0.08 : 0,
    rankCandidates: profile.signalWeight > 0,
    localIterations: Math.min(220, 80 + count * 8),
  });
  const extras = distributeExtras(game, selected.length, rng);
  const draw = getNextDrawInfo(gameId);
  const playId = crypto.randomUUID();
  const metrics = coverageMetrics(gameId, selected);
  const columns = selected.map((candidate, index) => ({
    id: crypto.randomUUID(),
    index: index + 1,
    numbers: candidate.ticket,
    extra: extras[index],
    score: candidate.score,
    scoreParts: candidate.parts,
    status: 'draft',
  }));

  return {
    id: playId,
    gameId,
    columns,
    createdAt: new Date().toISOString(),
    ...draw,
    method: 'primy-evidence',
    purchased: false,
    status: 'draft',
    metadata: {
      engine: 'Primy Evidence Engine',
      engineVersion: '12.0',
      seed,
      candidatesAnalyzed: candidates.length,
      generationConfig: { samples, columns: count, gameId },
      requestedColumns: count,
      quality: {
        ...metrics,
      },
      history: {
        available: profile.hasHistory,
        used: profile.signalWeight > 0,
        weight: Math.round(profile.signalWeight * 1000) / 10,
        audit: profile.audit,
        evidence: {
          reason: profile.evidence.reason,
          runs: profile.evidence.runs,
          models: profile.evidence.models,
        },
        draws: analysis?.totalDraws || 0,
        through: analysis?.to || null,
      },
      weights: Object.fromEntries(Object.entries(profile.weights).map(([key, value]) => [key, Math.round(value * 1000) / 10])),
      variantOf: options.variantOf || null,
    },
  };
}
