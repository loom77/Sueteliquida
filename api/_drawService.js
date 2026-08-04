import { GAMES } from '../src/utils/gameConfig.js';
import { readDrawRange, readLatestDraw, repositoryStatus, upsertDraws } from './_drawRepository.js';
import { fetchOfficialDraw } from './_selaeProvider.js';

export class ProviderError extends Error {
  constructor(message, { code = 'PROVIDER_ERROR', status = 502, providerStatus = null, retryAfter = null } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
    this.providerStatus = providerStatus;
    this.retryAfter = retryAfter;
  }
}

const DEFAULT_FRESH_MS = 18 * 60 * 60 * 1000;
const LIVE_RESULT_GAMES = new Set([
  'primitiva',
  'bonoloto',
  'euromillones',
  'gordoprimitiva',
  'eurodreams',
  'loteria-nacional',
]);

function freshEnough(draw, now = Date.now()) {
  const fetched = new Date(draw?.fetchedAt || 0).getTime();
  const ttlMinutes = Number(process.env.RESULT_CACHE_TTL_MINUTES || 1080);
  const ttl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : DEFAULT_FRESH_MS;
  return Number.isFinite(fetched) && fetched > 0 && now - fetched < ttl;
}

function dedupeDraws(draws) {
  const map = new Map();
  for (const draw of draws || []) if (draw?.date) map.set(draw.date, draw);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function mapWithConcurrency(values, limit, worker) {
  const output = new Array(values.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(values[index], index);
    }
  });
  await Promise.all(runners);
  return output;
}

async function fetchMissingDraws(game, dates, { fetchImpl = globalThis.fetch } = {}) {
  if (!LIVE_RESULT_GAMES.has(game.id) || !dates.length) return { draws: [], errors: [] };
  const attempts = await mapWithConcurrency(dates, 2, async date => {
    try {
      const draw = await fetchOfficialDraw({ game, date, timeoutMs: 14000, fetchImpl });
      return { date, draw };
    } catch (error) {
      return {
        date,
        error: {
          code: error?.code || 'LIVE_RESULT_ERROR',
          message: error?.message || 'Resultado oficial no disponible.',
        },
      };
    }
  });
  const draws = attempts.map(item => item.draw).filter(Boolean);
  if (draws.length) await upsertDraws(draws, { fetchImpl });
  return {
    draws,
    errors: attempts.filter(item => item.error).map(item => ({ date: item.date, ...item.error })),
  };
}

export async function getLatestDraw(game, { fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const draw = await readLatestDraw(game.id, { fetchImpl });
  if (!draw) {
    throw new ProviderError('El archivo oficial todavía no contiene resultados para este juego.', {
      code: 'ARCHIVE_EMPTY', status: 503,
    });
  }
  const stale = !freshEnough(draw, now.getTime());
  return {
    draw: stale ? { ...draw, stale: true } : draw,
    stale,
    cacheHit: true,
    warning: stale ? 'La sincronización automática conservará este dato hasta recibir el siguiente resultado oficial.' : '',
  };
}

export async function getDrawsForDates(game, dates, {
  fetchImpl = globalThis.fetch,
  fetchMissing = true,
} = {}) {
  const wanted = [...new Set(dates)].sort();
  if (!wanted.length) return { draws: [], unavailableDates: [], errors: [], liveFetched: 0 };

  const cached = await readDrawRange(game.id, wanted[0], wanted.at(-1), { fetchImpl });
  const byDate = new Map(cached.filter(draw => wanted.includes(draw.date)).map(draw => [draw.date, draw]));
  const missing = wanted.filter(date => !byDate.has(date));
  let live = { draws: [], errors: [] };

  // A user-triggered verification must not wait for the next cron cycle. When
  // the archive has no row yet, query the official per-game result directly,
  // validate it and persist it for all users.
  if (fetchMissing && missing.length) {
    live = await fetchMissingDraws(game, missing, { fetchImpl });
    for (const draw of live.draws) byDate.set(draw.date, draw);
  }

  return {
    draws: wanted.map(date => byDate.get(date)).filter(Boolean),
    unavailableDates: wanted.filter(date => !byDate.has(date)),
    errors: live.errors,
    liveFetched: live.draws.length,
    source: 'SELAE oficial / archivo Primy',
    repository: repositoryStatus(),
  };
}

export async function syncGameDraws(game, { fetchImpl = globalThis.fetch } = {}) {
  const latest = await readLatestDraw(game.id, { fetchImpl });
  return {
    gameId: game.id,
    requested: 0,
    saved: latest ? 1 : 0,
    unavailableDates: [],
    errors: [],
    managedBy: 'supabase-cron',
  };
}

export async function syncRecentDraws({ fetchImpl = globalThis.fetch } = {}) {
  const games = {};
  for (const game of Object.values(GAMES)) games[game.id] = await syncGameDraws(game, { fetchImpl });
  return { games, repository: repositoryStatus(), managedBy: 'supabase-cron', syncedAt: new Date().toISOString() };
}

export async function getHistoryDraws(game, from, to, { fetchImpl = globalThis.fetch } = {}) {
  const draws = await readDrawRange(game.id, from, to, { fetchImpl });
  return {
    draws: dedupeDraws(draws),
    source: 'SELAE oficial / archivo Primy',
    limited: false,
    warning: '',
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
