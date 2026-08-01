import { GAMES } from '../src/utils/gameConfig.js';
import { readDrawRange, readLatestDraw, repositoryStatus } from './_drawRepository.js';

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

export async function getDrawsForDates(game, dates, { fetchImpl = globalThis.fetch } = {}) {
  const wanted = [...new Set(dates)].sort();
  if (!wanted.length) return { draws: [], unavailableDates: [], errors: [] };
  const cached = await readDrawRange(game.id, wanted[0], wanted.at(-1), { fetchImpl });
  const byDate = new Map(cached.filter(draw => wanted.includes(draw.date)).map(draw => [draw.date, draw]));
  return {
    draws: wanted.map(date => byDate.get(date)).filter(Boolean),
    unavailableDates: wanted.filter(date => !byDate.has(date)),
    errors: [],
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

