import { GAMES } from '../src/utils/gameConfig.js';
import { candidateDrawDates, fetchLatestOfficialDraw, fetchOfficialDraw, ProviderError } from './_selaeProvider.js';
import { readDrawRange, readLatestDraw, repositoryStatus, upsertDraws } from './_drawRepository.js';

const DEFAULT_FRESH_MS = 30 * 60 * 1000;

function freshEnough(draw, now = Date.now()) {
  const fetched = new Date(draw?.fetchedAt || 0).getTime();
  const ttlMinutes = Number(process.env.RESULT_CACHE_TTL_MINUTES || 30);
  const ttl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : DEFAULT_FRESH_MS;
  return Number.isFinite(fetched) && fetched > 0 && now - fetched < ttl;
}

function dedupeDraws(draws) {
  const map = new Map();
  for (const draw of draws || []) if (draw?.date) map.set(draw.date, draw);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getLatestDraw(game, { force = false, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const cached = await readLatestDraw(game.id, { fetchImpl });
  if (!force && freshEnough(cached, now.getTime())) return { draw: cached, stale: false, cacheHit: true };
  try {
    const official = await fetchLatestOfficialDraw({ game, fetchImpl, now });
    const draw = { ...official, gameId: game.id, fetchedAt: new Date().toISOString() };
    const repository = await upsertDraws([draw], { fetchImpl });
    return { draw, stale: false, cacheHit: false, repository };
  } catch (error) {
    if (cached) return { draw: { ...cached, stale: true }, stale: true, cacheHit: true, warning: error?.message || '' };
    throw error;
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

export async function getDrawsForDates(game, dates, { fetchImpl = globalThis.fetch } = {}) {
  const wanted = [...new Set(dates)].sort();
  if (!wanted.length) return { draws: [], unavailableDates: [], errors: [] };
  const cached = await readDrawRange(game.id, wanted[0], wanted.at(-1), { fetchImpl });
  const byDate = new Map(cached.filter(draw => wanted.includes(draw.date)).map(draw => [draw.date, draw]));
  const missing = wanted.filter(date => !byDate.has(date));
  const errors = [];

  const fetched = await mapWithConcurrency(missing, 3, async date => {
    try {
      const draw = await fetchOfficialDraw({ game, date, fetchImpl });
      return { ...draw, gameId: game.id, fetchedAt: new Date().toISOString() };
    } catch (error) {
      errors.push({ date, code: error?.code || 'UNKNOWN', message: error?.message || '' });
      return null;
    }
  });

  const valid = fetched.filter(Boolean);
  if (valid.length) await upsertDraws(valid, { fetchImpl });
  for (const draw of valid) byDate.set(draw.date, draw);

  const draws = wanted.map(date => byDate.get(date)).filter(Boolean);
  return {
    draws,
    unavailableDates: wanted.filter(date => !byDate.has(date)),
    errors,
    source: 'SELAE oficial / archivo Primy',
    repository: repositoryStatus(),
  };
}

export async function syncGameDraws(game, { lookbackDraws = 8, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const dates = candidateDrawDates(game, { now, count: lookbackDraws });
  const result = await getDrawsForDates(game, dates, { fetchImpl });
  return {
    gameId: game.id,
    requested: dates.length,
    saved: result.draws.length,
    unavailableDates: result.unavailableDates,
    errors: result.errors,
  };
}

export async function syncRecentDraws({ lookbackDraws = 8, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const games = {};
  for (const game of Object.values(GAMES)) games[game.id] = await syncGameDraws(game, { lookbackDraws, fetchImpl, now });
  return { games, repository: repositoryStatus(), syncedAt: new Date().toISOString() };
}

export async function getHistoryDraws(game, from, to, { fetchImpl = globalThis.fetch, refreshRecent = true, now = new Date() } = {}) {
  let draws = await readDrawRange(game.id, from, to, { fetchImpl });
  let warning = '';
  if (refreshRecent) {
    try {
      const recent = await syncGameDraws(game, { lookbackDraws: 12, fetchImpl, now });
      if (recent.saved) draws = await readDrawRange(game.id, from, to, { fetchImpl });
    } catch (error) {
      warning = error?.message || '';
    }
  }
  return {
    draws: dedupeDraws(draws),
    source: 'SELAE oficial / archivo Primy',
    limited: false,
    warning,
    repository: repositoryStatus(),
  };
}

export function coverageYears(draws, requestedYears) {
  if (!draws?.length) return 0;
  const first = new Date(`${draws[0].date}T00:00:00Z`).getTime();
  const last = new Date(`${draws.at(-1).date}T00:00:00Z`).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return 0;
  return Math.min(requestedYears, Math.max(0, Math.round(((last - first) / 31557600000) * 10) / 10));
}

export { ProviderError };
