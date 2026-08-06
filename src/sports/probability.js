const EPSILON = 1e-12;

export function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clampProbability(value) {
  return Math.min(1, Math.max(0, finiteNumber(value)));
}

export function distributionTotal(distribution) {
  if (Array.isArray(distribution)) {
    return distribution.reduce((sum, item) => sum + finiteNumber(item?.probability ?? item), 0);
  }
  if (distribution && typeof distribution === 'object') {
    return Object.values(distribution).reduce((sum, value) => sum + finiteNumber(value), 0);
  }
  return 0;
}

export function normalizeDistribution(distribution) {
  if (Array.isArray(distribution)) {
    const clean = distribution.map(item => ({ ...item, probability: Math.max(0, finiteNumber(item?.probability)) }));
    const total = distributionTotal(clean);
    if (total <= EPSILON) throw new RangeError('La distribución no contiene masa probabilística positiva.');
    return clean.map(item => ({ ...item, probability: item.probability / total }));
  }

  if (distribution && typeof distribution === 'object') {
    const clean = Object.fromEntries(Object.entries(distribution).map(([key, value]) => [key, Math.max(0, finiteNumber(value))]));
    const total = distributionTotal(clean);
    if (total <= EPSILON) throw new RangeError('La distribución no contiene masa probabilística positiva.');
    return Object.fromEntries(Object.entries(clean).map(([key, value]) => [key, value / total]));
  }

  throw new TypeError('La distribución debe ser un array o un objeto.');
}

export function isNormalizedDistribution(distribution, tolerance = 1e-9) {
  return Math.abs(distributionTotal(distribution) - 1) <= tolerance;
}

function hashSeed(seed) {
  const source = String(seed ?? 'primy-sports');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed = 'primy-sports') {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleCategorical(distribution, random = Math.random) {
  const entries = Array.isArray(distribution)
    ? normalizeDistribution(distribution).map(item => [item, item.probability])
    : Object.entries(normalizeDistribution(distribution));
  const target = random();
  let cumulative = 0;
  for (const [value, probability] of entries) {
    cumulative += probability;
    if (target <= cumulative) return value;
  }
  return entries.at(-1)?.[0] ?? null;
}

export function safeProduct(values, { max = Number.MAX_SAFE_INTEGER } = {}) {
  return values.reduce((product, value) => {
    const factor = Number(value);
    if (!Number.isInteger(factor) || factor < 0) throw new RangeError('Los factores combinatorios deben ser enteros no negativos.');
    if (factor !== 0 && product > max / factor) throw new RangeError('El desarrollo supera el límite numérico seguro.');
    return product * factor;
  }, 1);
}
