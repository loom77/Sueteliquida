import { getGameConfig } from './gameConfig.js';
import { getNextPlayableDrawInfo } from './drawSchedule.js';
import { coverageMetrics } from './portfolioOptimizer.js';
import { bonolotoEquivalentBets, isBonolotoSystemSize } from './bonoloto.js';
import { gordoEquivalentBets, isGordoSystemSize } from './gordoPrimitiva.js';

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

function randomCombination(game, rng) {
  const pool = Array.from({ length: game.numberPoolMax }, (_, index) => index + 1);

  // Partial Fisher-Yates: every valid unordered combination has the same
  // probability. No historical, structural or human-choice pattern is used
  // to accept, reject or rank the generated numbers.
  for (let index = 0; index < game.numbersToPick; index += 1) {
    const other = rng.int(index, pool.length - 1);
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }

  return pool.slice(0, game.numbersToPick).sort((left, right) => left - right);
}

function randomSelection(game, count, rng) {
  const pool = Array.from({ length: game.numberPoolMax }, (_, index) => index + 1);
  for (let index = 0; index < count; index += 1) {
    const other = rng.int(index, pool.length - 1);
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool.slice(0, count).sort((left, right) => left - right);
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
 * Equilibrio meramente descriptivo. Nunca se presenta como una mayor probabilidad de acierto.
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
 * Desempate secundario por premio esperado, basado en sesgos documentados de elección humana.
 * No se presenta como una mejora de la probabilidad de acertar el sorteo.
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

export function resolveFusionProfile(gameId, analysis) {
  const game = getGameConfig(gameId);
  const uniformProbability = game.numbersToPick / game.numberPoolMax;
  return {
    hasHistory: Boolean(analysis?.totalDraws),
    evidence: {
      eligible: false,
      reason: 'El historial se conserva solo para análisis descriptivo.',
      runs: 0,
      models: [],
    },
    audit: {
      eligible: false,
      reason: 'La generación uniforme no utiliza modelos predictivos.',
      runs: 0,
      delta: 0,
      lower95: 0,
      foldWinRate: null,
    },
    probabilities: Array.from({ length: game.numberPoolMax + 1 }, (_, number) => number ? uniformProbability : 0),
    signalWeight: 0,
    weights: {
      predictive: 0,
      historical: 0,
      portfolioCoverage: 0,
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
  const predictive = 50;
  const diversity = anchorDiversityScore(numbers, avoidColumns);
  // Puntuación orientada al acierto: sin evidencia histórica, todas las combinaciones válidas
  // son neutrales. Los diagnósticos sobre patrones humanos y equilibrio visual quedan fuera
  // de la clasificación predictiva. En las variantes, la distancia respecto al origen es
  // únicamente un término pequeño y explícito de diversificación.
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
  if (!game.extra) return Array(count).fill(null);
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

function randomSecondaryNumbers(game, rng) {
  if (!game.secondary) return [];
  const pool = Array.from({ length: game.secondary.max - game.secondary.min + 1 }, (_, index) => game.secondary.min + index);
  for (let index = 0; index < game.secondary.count; index += 1) {
    const other = rng.int(index, pool.length - 1);
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool.slice(0, game.secondary.count).sort((left, right) => left - right);
}

export function generateFusionPlay(gameId, analysis, columnCount = 1, options = {}) {
  const game = getGameConfig(gameId);
  const seed = String(options.seed || createGenerationSeed());
  const rng = createSeededRandom(seed);
  const minimumSimpleBets = game.minSimpleBets || 1;
  const count = Math.max(minimumSimpleBets, Math.min(Number(columnCount) || minimumSimpleBets, game.maxSimpleBets || 1));
  const profile = resolveFusionProfile(gameId, analysis, options.evidenceOptions || options.auditOptions || {});
  if (options.betType === 'multiple' && ['bonoloto', 'gordoprimitiva'].includes(gameId)) {
    const systemSize = Number(options.systemSize);
    const isBonoloto = gameId === 'bonoloto';
    const valid = isBonoloto ? isBonolotoSystemSize(systemSize) : isGordoSystemSize(systemSize);
    if (!valid) throw new Error(`Selecciona una múltiple válida de ${game.name}.`);
    const numbers = randomSelection(game, systemSize, rng);
    const draw = getNextPlayableDrawInfo(gameId);
    const equivalentBets = isBonoloto ? bonolotoEquivalentBets(systemSize) : gordoEquivalentBets(systemSize);
    const extra = isBonoloto ? null : rng.int(game.extra.min, game.extra.max);
    return {
      id: crypto.randomUUID(),
      gameId,
      betType: 'multiple',
      systemSelection: numbers,
      systemSize,
      equivalentBets,
      columns: [{ id: crypto.randomUUID(), index: 1, numbers, ...(extra == null ? {} : { extra }), isSystem: true, status: 'draft' }],
      ...(isBonoloto ? { receiptExtra: null } : {}),
      createdAt: new Date().toISOString(),
      ...draw,
      method: 'primy-uniform-system',
      purchased: false,
      status: 'draft',
      metadata: {
        engine: 'Motor uniforme de Primy',
        engineVersion: '15.5-gordo-uniform',
        seed,
        requestedColumns: 1,
        ...(isBonoloto ? { receiptExtraPending: true } : {}),
        generationConfig: { mode: 'uniform-system-selection', gameId, systemSize, equivalentBets },
        quality: { uniqueNumbers: numbers.length, coverageRatio: numbers.length / game.numberPoolMax, averageOverlap: 0 },
        history: { available: Boolean(analysis?.totalDraws), used: false, weight: 0, draws: analysis?.totalDraws || 0, through: analysis?.to || null },
        weights: { predictive: 0, historical: 0, portfolioCoverage: 0, structural: 0, antiShare: 0 },
        variantOf: options.variantOf || null,
      },
    };
  }
  const selected = [];
  const seen = new Set();
  const blockedExact = new Set((options.avoidColumns || []).map(column =>
    [...(column.numbers || column.ticket || [])].sort((left, right) => left - right).join('-')
  ));
  let attempts = 0;
  const maximumAttempts = Math.max(1000, count * 100);

  while (selected.length < count && attempts < maximumAttempts) {
    attempts += 1;
    const numbers = randomCombination(game, rng);
    const key = numbers.join('-');
    if (seen.has(key) || blockedExact.has(key)) continue;
    seen.add(key);
    // Scores are retained only for backward-compatible diagnostics in the UI.
    // They never influence acceptance, rejection or ordering.
    selected.push(scoreCandidate(gameId, numbers, { ...profile, signalWeight: 0 }, []));
    if (options.onProgress) options.onProgress(selected.length / count);
  }

  if (selected.length !== count) {
    throw new Error('No se pudieron generar suficientes columnas únicas.');
  }

  const receiptExtra = game.extra?.scope === 'receipt'
    ? (game.extra.assignment === 'official-receipt' ? null : rng.int(game.extra.min, game.extra.max))
    : null;
  const extras = game.extra?.scope === 'receipt'
    ? Array(selected.length).fill(receiptExtra)
    : distributeExtras(game, selected.length, rng);
  const draw = getNextPlayableDrawInfo(gameId);
  const playId = crypto.randomUUID();
  const metrics = coverageMetrics(gameId, selected);
  const columns = selected.map((candidate, index) => ({
    id: crypto.randomUUID(),
    index: index + 1,
    numbers: candidate.ticket,
    ...(game.secondary
      ? { secondaryNumbers: randomSecondaryNumbers(game, rng) }
      : game.extra?.scope === 'receipt' && receiptExtra == null
        ? {}
        : { extra: extras[index] }),
    score: candidate.score,
    scoreParts: candidate.parts,
    status: 'draft',
  }));

  return {
    id: playId,
    gameId,
    columns,
    ...(game.extra?.scope === 'receipt' ? { receiptExtra } : {}),
    betType: 'simple',
    equivalentBets: columns.length,
    createdAt: new Date().toISOString(),
    ...draw,
    method: 'primy-uniform',
    purchased: false,
    status: 'draft',
    metadata: {
      engine: 'Motor uniforme de Primy',
      engineVersion: '15.5-gordo-uniform',
      seed,
      randomDraws: attempts,
      generationConfig: { mode: 'uniform-without-replacement', columns: count, gameId, secondaryMode: game.secondary ? 'uniform-without-replacement' : null },
      requestedColumns: count,
      ...(game.extra?.assignment === 'official-receipt' ? { receiptExtraPending: true } : {}),
      quality: {
        ...metrics,
      },
      history: {
        available: profile.hasHistory,
        used: false,
        weight: 0,
        audit: profile.audit,
        evidence: {
          reason: 'El historial se conserva solo como análisis descriptivo y no interviene en la generación.',
          runs: profile.evidence.runs,
          models: profile.evidence.models,
        },
        draws: analysis?.totalDraws || 0,
        through: analysis?.to || null,
      },
      weights: {
        predictive: 0,
        historical: 0,
        portfolioCoverage: 0,
        structural: 0,
        antiShare: 0,
      },
      variantOf: options.variantOf || null,
    },
  };
}

