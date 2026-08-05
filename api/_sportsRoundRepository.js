import {
  QUINIELA_MATCH_COUNT,
  QUINIGOL_MATCH_COUNT,
  SPORTS_GAME_IDS,
} from '../src/sports/constants.js';
import { sanitizeSportsRound } from '../src/sports/roundModel.js';

const DEFAULT_SUPABASE_URL = 'https://vmzkhelxehgedorsvchl.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_t4RVGc3ZCYjFNeNG3Bgf-A_EXIBiEst';
const PAGE_SIZE = 250;
const memoryRounds = globalThis.__primySportsRounds || new Map();
const memoryRevisions = globalThis.__primySportsRoundRevisions || new Map();
globalThis.__primySportsRounds = memoryRounds;
globalThis.__primySportsRoundRevisions = memoryRevisions;

const EXPECTED_MATCHES = Object.freeze({ quiniela: QUINIELA_MATCH_COUNT, quinigol: QUINIGOL_MATCH_COUNT });

export class SportsRoundRepositoryError extends Error {
  constructor(message, { code = 'SPORTS_REPOSITORY_ERROR', status = 502, details = '' } = {}) {
    super(message);
    this.name = 'SportsRoundRepositoryError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function config() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const readKey = String(serviceKey || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY).trim();
  return { url, readKey, serviceKey, readable: Boolean(url && readKey), writable: Boolean(url && serviceKey) };
}

export function sportsRoundRepositoryStatus() {
  const current = config();
  return {
    configured: current.readable,
    writable: current.writable,
    backend: current.readable ? (current.writable ? 'supabase' : 'supabase-readonly') : 'memory',
    versioned: true,
  };
}

function validDateKey(value) {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeRound(raw) {
  if (!SPORTS_GAME_IDS.includes(raw?.gameId)) return null;
  const value = sanitizeSportsRound(raw, { expectedMatches: EXPECTED_MATCHES[raw.gameId] });
  if (!value.roundId || !value.validation.valid) return null;
  return {
    ...value,
    roundDate: validDateKey(raw.roundDate),
    source: String(raw.source || 'SELAE oficial'),
    officialUpdatedAt: raw.officialUpdatedAt || null,
    fetchedAt: raw.fetchedAt || new Date().toISOString(),
    revision: Number.isInteger(Number(raw.revision)) && Number(raw.revision) > 0 ? Number(raw.revision) : 1,
  };
}

function rowToRound(row) {
  return normalizeRound({
    roundId: row.round_id,
    gameId: row.game_id,
    season: row.season,
    officialRoundNumber: row.official_round_number,
    roundDate: row.round_date,
    status: row.status,
    salesOpenAt: row.sales_open_at,
    salesCloseAt: row.sales_close_at,
    source: row.source,
    sourceUrl: row.source_url,
    sourceHash: row.source_hash,
    officialUpdatedAt: row.official_updated_at,
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at,
    revision: row.revision,
    matches: row.matches,
    prizeCategories: row.metadata?.prizeCategories || [],
    metadata: row.metadata || {},
  });
}

function roundToRow(raw) {
  const value = normalizeRound(raw);
  if (!value) return null;
  return {
    round_id: value.roundId,
    game_id: value.gameId,
    season: value.season || null,
    official_round_number: value.officialRoundNumber || null,
    round_date: value.roundDate,
    status: value.status,
    sales_open_at: value.salesOpenAt,
    sales_close_at: value.salesCloseAt,
    source: value.source,
    source_url: value.sourceUrl || null,
    source_hash: value.sourceHash || null,
    official_updated_at: value.officialUpdatedAt,
    fetched_at: value.fetchedAt,
    revision: value.revision,
    matches: value.matches,
    metadata: {
      ...(value.metadata || {}),
      prizeCategories: value.prizeCategories || value.metadata?.prizeCategories || [],
    },
  };
}

function revisionToRow(raw) {
  const value = normalizeRound(raw);
  if (!value?.sourceHash) return null;
  return {
    round_id: value.roundId,
    source_hash: value.sourceHash,
    game_id: value.gameId,
    status: value.status,
    fetched_at: value.fetchedAt,
    matches: value.matches,
    metadata: { ...value.metadata, revision: value.revision },
  };
}

function memoryUpsert(rounds) {
  for (const raw of rounds) {
    const round = normalizeRound(raw);
    if (!round) continue;
    const previous = memoryRounds.get(round.roundId);
    const revision = previous && previous.sourceHash !== round.sourceHash ? previous.revision + 1 : (previous?.revision || round.revision || 1);
    const stored = { ...round, revision };
    memoryRounds.set(stored.roundId, stored);
    if (stored.sourceHash) memoryRevisions.set(`${stored.roundId}:${stored.sourceHash}`, stored);
  }
}

function sortRounds(rounds) {
  return [...rounds].sort((left, right) => {
    const leftKey = left.roundDate || left.salesCloseAt || left.updatedAt || '';
    const rightKey = right.roundDate || right.salesCloseAt || right.updatedAt || '';
    return leftKey.localeCompare(rightKey);
  });
}

function memoryRange(gameId, from = '', to = '') {
  return sortRounds([...memoryRounds.values()].filter(round => {
    if (round.gameId !== gameId) return false;
    if (from && round.roundDate && round.roundDate < from) return false;
    if (to && round.roundDate && round.roundDate > to) return false;
    return true;
  }));
}

async function restRequest(path, { method = 'GET', body, headers = {}, fetchImpl = globalThis.fetch, timeoutMs = 10000, write = false } = {}) {
  const current = config();
  const apiKey = write ? current.serviceKey : current.readKey;
  if (!current.url || !apiKey) {
    throw new SportsRoundRepositoryError('El archivo de jornadas deportivas no está configurado.', { code: 'SPORTS_REPOSITORY_NOT_CONFIGURED', status: 503 });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${current.url}/rest/v1/${path}`, {
      method,
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) {
      throw new SportsRoundRepositoryError('No se puede acceder al archivo de jornadas deportivas.', {
        code: 'SPORTS_REPOSITORY_REJECTED', status: 502,
        details: typeof payload === 'string' ? payload.slice(0, 300) : JSON.stringify(payload || {}).slice(0, 300),
      });
    }
    return { payload, response };
  } catch (error) {
    if (error?.name === 'AbortError') throw new SportsRoundRepositoryError('El archivo deportivo no ha respondido a tiempo.', { code: 'SPORTS_REPOSITORY_TIMEOUT', status: 504 });
    if (error instanceof SportsRoundRepositoryError) throw error;
    throw new SportsRoundRepositoryError('No se puede conectar con el archivo deportivo.', { code: 'SPORTS_REPOSITORY_NETWORK_ERROR', details: String(error?.message || '').slice(0, 300) });
  } finally { clearTimeout(timer); }
}

async function supabaseRange(gameId, from = '', to = '', fetchImpl = globalThis.fetch) {
  const params = new URLSearchParams({ select: '*', game_id: `eq.${gameId}`, order: 'round_date.asc.nullslast,updated_at.asc' });
  if (from) params.set('round_date', `gte.${from}`);
  if (to) params.append('round_date', `lte.${to}`);
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { payload } = await restRequest(`primy_sports_rounds?${params}`, { fetchImpl, headers: { Range: `${offset}-${offset + PAGE_SIZE - 1}`, Prefer: 'count=none' } });
    const page = Array.isArray(payload) ? payload : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows.map(rowToRound).filter(Boolean);
}

export async function readSportsRoundRange(gameId, from = '', to = '', { fetchImpl = globalThis.fetch } = {}) {
  if (!SPORTS_GAME_IDS.includes(gameId)) return [];
  const current = config();
  if (!current.readable) return memoryRange(gameId, from, to);
  try {
    const rounds = await supabaseRange(gameId, from, to, fetchImpl);
    memoryUpsert(rounds);
    return rounds;
  } catch { return memoryRange(gameId, from, to); }
}

export async function readLatestSportsRound(gameId, { fetchImpl = globalThis.fetch } = {}) {
  if (!SPORTS_GAME_IDS.includes(gameId)) return null;
  const current = config();
  if (!current.readable) return memoryRange(gameId).at(-1) || null;
  const params = new URLSearchParams({ select: '*', game_id: `eq.${gameId}`, order: 'round_date.desc.nullslast,updated_at.desc', limit: '1' });
  try {
    const { payload } = await restRequest(`primy_sports_rounds?${params}`, { fetchImpl, headers: { Range: '0-0', Prefer: 'count=none' } });
    const round = Array.isArray(payload) ? rowToRound(payload[0]) : null;
    if (round) memoryUpsert([round]);
    return round || memoryRange(gameId).at(-1) || null;
  } catch { return memoryRange(gameId).at(-1) || null; }
}

export async function readSportsRound(roundId, { fetchImpl = globalThis.fetch } = {}) {
  const key = String(roundId || '').trim();
  if (!key) return null;
  const current = config();
  if (!current.readable) return memoryRounds.get(key) || null;
  const params = new URLSearchParams({ select: '*', round_id: `eq.${key}`, limit: '1' });
  try {
    const { payload } = await restRequest(`primy_sports_rounds?${params}`, { fetchImpl, headers: { Range: '0-0', Prefer: 'count=none' } });
    const round = Array.isArray(payload) ? rowToRound(payload[0]) : null;
    if (round) memoryUpsert([round]);
    return round || memoryRounds.get(key) || null;
  } catch { return memoryRounds.get(key) || null; }
}

export async function upsertSportsRounds(rounds, { fetchImpl = globalThis.fetch } = {}) {
  const normalized = rounds.map(normalizeRound).filter(Boolean);
  if (!normalized.length) return { saved: 0, revisions: 0, persisted: false, backend: sportsRoundRepositoryStatus().backend };
  memoryUpsert(normalized);
  const stored = normalized.map(round => memoryRounds.get(round.roundId));
  const current = config();
  if (!current.writable) return { saved: stored.length, revisions: stored.filter(round => round.sourceHash).length, persisted: false, backend: sportsRoundRepositoryStatus().backend };
  try {
    await restRequest('primy_sports_rounds?on_conflict=round_id', {
      method: 'POST', body: stored.map(roundToRow), fetchImpl, write: true,
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
    const revisions = stored.map(revisionToRow).filter(Boolean);
    if (revisions.length) {
      await restRequest('primy_sports_round_revisions?on_conflict=round_id,source_hash', {
        method: 'POST', body: revisions, fetchImpl, write: true,
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      });
    }
    return { saved: stored.length, revisions: revisions.length, persisted: true, backend: 'supabase' };
  } catch {
    return { saved: stored.length, revisions: stored.filter(round => round.sourceHash).length, persisted: false, backend: sportsRoundRepositoryStatus().backend };
  }
}

export function clearSportsRoundMemoryForTests() {
  memoryRounds.clear();
  memoryRevisions.clear();
}
