import { HORSE_GAME_IDS } from '../src/horse/constants.js';
import { sanitizeHorseRound } from '../src/horse/roundModel.js';

const DEFAULT_SUPABASE_URL = 'https://vmzkhelxehgedorsvchl.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_t4RVGc3ZCYjFNeNG3Bgf-A_EXIBiEst';
const memoryRounds = globalThis.__primyHorseRounds || new Map();
const memoryRevisions = globalThis.__primyHorseRoundRevisions || new Map();
globalThis.__primyHorseRounds = memoryRounds;
globalThis.__primyHorseRoundRevisions = memoryRevisions;

export class HorseRoundRepositoryError extends Error {
  constructor(message, { code = 'HORSE_REPOSITORY_ERROR', status = 502, details = '' } = {}) {
    super(message);
    this.name = 'HorseRoundRepositoryError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function config() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const readKey = String(serviceKey || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY).trim();
  return { url, serviceKey, readKey, readable: Boolean(url && readKey), writable: Boolean(url && serviceKey) };
}

export function horseRoundRepositoryStatus() {
  const current = config();
  return {
    configured: current.readable,
    writable: current.writable,
    backend: current.readable ? (current.writable ? 'supabase' : 'supabase-readonly') : 'memory',
    versioned: true,
  };
}

function normalizeRound(raw) {
  const round = sanitizeHorseRound(raw);
  return round.validation.valid ? round : null;
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
    programUrl: row.program_url,
    withdrawalsUrl: row.withdrawals_url,
    resultUrl: row.result_url,
    sourceHash: row.source_hash,
    officialUpdatedAt: row.official_updated_at,
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at,
    revision: row.revision,
    venue: row.venue,
    races: row.races,
    result: row.result,
    documents: row.documents,
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
    program_url: value.programUrl || null,
    withdrawals_url: value.withdrawalsUrl || null,
    result_url: value.resultUrl || null,
    source_hash: value.sourceHash || null,
    official_updated_at: value.officialUpdatedAt,
    fetched_at: value.fetchedAt,
    revision: value.revision,
    venue: value.venue || null,
    races: value.races,
    result: value.result,
    documents: value.documents,
    metadata: value.metadata || {},
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
    races: value.races,
    result: value.result,
    documents: value.documents,
    metadata: { ...value.metadata, revision: value.revision },
  };
}

function memoryUpsert(rounds) {
  let revisions = 0;
  const stored = [];
  for (const raw of rounds) {
    const round = normalizeRound(raw);
    if (!round) continue;
    const previous = memoryRounds.get(round.roundId);
    const changed = Boolean(previous && previous.sourceHash && round.sourceHash && previous.sourceHash !== round.sourceHash);
    const revision = changed ? previous.revision + 1 : (previous?.revision || round.revision || 1);
    const value = { ...round, revision };
    memoryRounds.set(value.roundId, value);
    if (value.sourceHash) memoryRevisions.set(`${value.roundId}:${value.sourceHash}`, value);
    if (changed) revisions += 1;
    stored.push(value);
  }
  return { stored, revisions };
}

function sortRounds(rounds) {
  return [...rounds].sort((left, right) => {
    const leftKey = left.roundDate || left.salesCloseAt || left.updatedAt || '';
    const rightKey = right.roundDate || right.salesCloseAt || right.updatedAt || '';
    return leftKey.localeCompare(rightKey);
  });
}

async function restRequest(path, { method = 'GET', body, fetchImpl = globalThis.fetch, timeoutMs = 12000, write = false, prefer = '' } = {}) {
  const current = config();
  const apiKey = write ? current.serviceKey : current.readKey;
  if (!current.url || !apiKey) throw new HorseRoundRepositoryError('El archivo hípico no está configurado.', { code: 'HORSE_REPOSITORY_NOT_CONFIGURED', status: 503 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${current.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new HorseRoundRepositoryError('Supabase no ha podido procesar el archivo hípico.', {
        code: 'HORSE_REPOSITORY_HTTP_ERROR', status: 502, details: `HTTP ${response.status}: ${details.slice(0, 240)}`,
      });
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error?.name === 'AbortError') throw new HorseRoundRepositoryError('Supabase no ha respondido a tiempo.', { code: 'HORSE_REPOSITORY_TIMEOUT', status: 504 });
    if (error instanceof HorseRoundRepositoryError) throw error;
    throw new HorseRoundRepositoryError('No se ha podido consultar el archivo hípico.', { code: 'HORSE_REPOSITORY_NETWORK_ERROR', details: String(error?.message || '') });
  } finally {
    clearTimeout(timer);
  }
}

export async function upsertHorseRounds(rounds, options = {}) {
  if (!Array.isArray(rounds) || rounds.length === 0) return { persisted: false, count: 0, revisions: 0, rounds: [] };
  const normalized = rounds.map(normalizeRound).filter(Boolean);
  if (normalized.length !== rounds.length) throw new HorseRoundRepositoryError('Una o más jornadas hípicas no son válidas.', { code: 'INVALID_HORSE_ROUND', status: 400 });
  const memory = memoryUpsert(normalized);
  const current = config();
  if (!current.writable) return { persisted: false, count: memory.stored.length, revisions: memory.revisions, rounds: memory.stored };

  const rows = memory.stored.map(roundToRow).filter(Boolean);
  const revisions = memory.stored.map(revisionToRow).filter(Boolean);
  await restRequest('primy_horse_rounds?on_conflict=round_id', {
    method: 'POST', body: rows, write: true, fetchImpl: options.fetchImpl,
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
  if (revisions.length) {
    await restRequest('primy_horse_round_revisions?on_conflict=round_id,source_hash', {
      method: 'POST', body: revisions, write: true, fetchImpl: options.fetchImpl,
      prefer: 'resolution=ignore-duplicates,return=minimal',
    });
  }
  return { persisted: true, count: rows.length, revisions: memory.revisions, rounds: memory.stored };
}

export async function readHorseRound(roundId, options = {}) {
  const key = String(roundId || '').trim();
  if (!key) return null;
  const current = config();
  if (current.readable) {
    try {
      const rows = await restRequest(`primy_horse_rounds?round_id=eq.${encodeURIComponent(key)}&select=*&limit=1`, { fetchImpl: options.fetchImpl });
      const round = Array.isArray(rows) && rows[0] ? rowToRound(rows[0]) : null;
      if (round) { memoryUpsert([round]); return round; }
    } catch (error) {
      if (options.strict) throw error;
    }
  }
  return memoryRounds.get(key) || null;
}

export async function readLatestHorseRound(gameId, options = {}) {
  if (!HORSE_GAME_IDS.includes(gameId)) throw new HorseRoundRepositoryError('Juego hípico no válido.', { code: 'INVALID_HORSE_GAME', status: 400 });
  const current = config();
  if (current.readable) {
    try {
      const rows = await restRequest(`primy_horse_rounds?game_id=eq.${encodeURIComponent(gameId)}&select=*&order=round_date.desc.nullslast,updated_at.desc&limit=1`, { fetchImpl: options.fetchImpl });
      const round = Array.isArray(rows) && rows[0] ? rowToRound(rows[0]) : null;
      if (round) { memoryUpsert([round]); return round; }
    } catch (error) {
      if (options.strict) throw error;
    }
  }
  return sortRounds([...memoryRounds.values()].filter(round => round.gameId === gameId)).at(-1) || null;
}

export async function readHorseRoundRange(gameId, from = '', to = '', options = {}) {
  if (!HORSE_GAME_IDS.includes(gameId)) throw new HorseRoundRepositoryError('Juego hípico no válido.', { code: 'INVALID_HORSE_GAME', status: 400 });
  const filters = [`game_id=eq.${encodeURIComponent(gameId)}`, 'select=*', 'order=round_date.asc.nullslast'];
  if (from) filters.push(`round_date=gte.${encodeURIComponent(from)}`);
  if (to) filters.push(`round_date=lte.${encodeURIComponent(to)}`);
  const current = config();
  if (current.readable) {
    try {
      const rows = await restRequest(`primy_horse_rounds?${filters.join('&')}`, { fetchImpl: options.fetchImpl });
      const rounds = Array.isArray(rows) ? rows.map(rowToRound).filter(Boolean) : [];
      if (rounds.length) { memoryUpsert(rounds); return rounds; }
    } catch (error) {
      if (options.strict) throw error;
    }
  }
  return sortRounds([...memoryRounds.values()].filter(round => {
    if (round.gameId !== gameId) return false;
    if (from && round.roundDate && round.roundDate < from) return false;
    if (to && round.roundDate && round.roundDate > to) return false;
    return true;
  }));
}

export function clearHorseRoundMemoryForTests() {
  memoryRounds.clear();
  memoryRevisions.clear();
}
