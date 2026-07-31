const DEFAULT_SUPABASE_URL = 'https://vmzkhelxehgedorsvchl.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_t4RVGc3ZCYjFNeNG3Bgf-A_EXIBiEst';
const PAGE_SIZE = 1000;
const memoryRows = globalThis.__primyDrawRows || new Map();
globalThis.__primyDrawRows = memoryRows;

export class RepositoryError extends Error {
  constructor(message, { code = 'REPOSITORY_ERROR', status = 502, details = '' } = {}) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function config() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)
    .trim()
    .replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const readKey = String(
    serviceKey
      || process.env.SUPABASE_PUBLISHABLE_KEY
      || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      || DEFAULT_PUBLISHABLE_KEY,
  ).trim();
  return {
    url,
    readKey,
    serviceKey,
    readable: Boolean(url && readKey),
    writable: Boolean(url && serviceKey),
  };
}

export function repositoryStatus() {
  const current = config();
  return {
    configured: current.readable,
    writable: current.writable,
    backend: current.readable ? (current.writable ? 'supabase' : 'supabase-readonly') : 'memory',
  };
}

function keyFor(gameId, date) {
  return `${gameId}:${date}`;
}

function normalizeDraw(draw) {
  if (!draw?.date || !draw?.gameId) return null;
  return {
    gameId: String(draw.gameId),
    date: String(draw.date),
    winningNumbers: (draw.winningNumbers || []).map(Number),
    extra: draw.extra == null ? null : Number(draw.extra),
    secondaryNumbers: (draw.secondaryNumbers || draw.stars || []).map(Number),
    complementary: draw.complementary == null ? null : Number(draw.complementary),
    prizes: Array.isArray(draw.prizes) ? draw.prizes : [],
    jackpotNext: draw.jackpotNext == null ? null : Number(draw.jackpotNext),
    jackpotFormatted: String(draw.jackpotFormatted || ''),
    source: String(draw.source || 'SELAE oficial'),
    sourceUrl: String(draw.sourceUrl || ''),
    sourceHash: String(draw.sourceHash || ''),
    updatedAt: draw.updatedAt || null,
    fetchedAt: draw.fetchedAt || new Date().toISOString(),
    drawId: draw.drawId || `${draw.gameId}:${draw.date}`,
    metadata: draw.metadata && typeof draw.metadata === 'object' ? draw.metadata : {},
  };
}

function rowToDraw(row) {
  return normalizeDraw({
    gameId: row.game_id,
    date: row.draw_date,
    winningNumbers: row.winning_numbers,
    extra: row.extra,
    secondaryNumbers: row.secondary_numbers,
    complementary: row.complementary,
    prizes: row.prizes,
    jackpotNext: row.jackpot_next,
    jackpotFormatted: row.jackpot_formatted,
    source: row.source,
    sourceUrl: row.source_url,
    sourceHash: row.source_hash,
    updatedAt: row.official_updated_at,
    fetchedAt: row.fetched_at,
    drawId: `${row.game_id}:${row.draw_date}`,
    metadata: row.metadata || {},
  });
}

function drawToRow(draw) {
  const value = normalizeDraw(draw);
  return {
    game_id: value.gameId,
    draw_date: value.date,
    winning_numbers: value.winningNumbers,
    extra: value.extra,
    secondary_numbers: value.secondaryNumbers,
    complementary: value.complementary,
    prizes: value.prizes,
    jackpot_next: value.jackpotNext,
    jackpot_formatted: value.jackpotFormatted || null,
    source: value.source,
    source_url: value.sourceUrl || null,
    source_hash: value.sourceHash || null,
    official_updated_at: value.updatedAt,
    fetched_at: value.fetchedAt,
    metadata: value.metadata || {},
  };
}

function memoryUpsert(draws) {
  for (const draw of draws.map(normalizeDraw).filter(Boolean)) memoryRows.set(keyFor(draw.gameId, draw.date), draw);
}

function memoryRange(gameId, from = '', to = '') {
  return [...memoryRows.values()]
    .filter(draw => draw.gameId === gameId && (!from || draw.date >= from) && (!to || draw.date <= to))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function restRequest(path, {
  method = 'GET', body, headers = {}, fetchImpl = globalThis.fetch, timeoutMs = 10000, write = false,
} = {}) {
  const current = config();
  const apiKey = write ? current.serviceKey : current.readKey;
  if (!current.url || !apiKey) {
    throw new RepositoryError('El archivo de resultados no está configurado.', {
      code: 'REPOSITORY_NOT_CONFIGURED', status: 503,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${current.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) {
      throw new RepositoryError('No se puede acceder al archivo de resultados.', {
        code: 'REPOSITORY_REJECTED',
        status: 502,
        details: typeof payload === 'string' ? payload.slice(0, 300) : JSON.stringify(payload || {}).slice(0, 300),
      });
    }
    return { payload, response };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new RepositoryError('El archivo de resultados no ha respondido a tiempo.', {
        code: 'REPOSITORY_TIMEOUT', status: 504,
      });
    }
    if (error instanceof RepositoryError) throw error;
    throw new RepositoryError('No se puede conectar con el archivo de resultados.', {
      code: 'REPOSITORY_NETWORK_ERROR', details: String(error?.message || '').slice(0, 300),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function supabaseRange(gameId, from = '', to = '', fetchImpl = globalThis.fetch) {
  const params = new URLSearchParams({ select: '*', game_id: `eq.${gameId}`, order: 'draw_date.asc' });
  if (from) params.set('draw_date', `gte.${from}`);
  if (to) params.append('draw_date', `lte.${to}`);

  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { payload } = await restRequest(`primy_draw_results?${params}`, {
      fetchImpl,
      headers: { Range: `${offset}-${offset + PAGE_SIZE - 1}`, Prefer: 'count=none' },
    });
    const page = Array.isArray(payload) ? payload : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows.map(rowToDraw).filter(Boolean);
}

export async function readDrawRange(gameId, from = '', to = '', { fetchImpl = globalThis.fetch } = {}) {
  const current = config();
  if (!current.readable) return memoryRange(gameId, from, to);
  try {
    const draws = await supabaseRange(gameId, from, to, fetchImpl);
    memoryUpsert(draws);
    return draws;
  } catch {
    return memoryRange(gameId, from, to);
  }
}

export async function readLatestDraw(gameId, { fetchImpl = globalThis.fetch } = {}) {
  const current = config();
  if (!current.readable) return memoryRange(gameId).at(-1) || null;
  const params = new URLSearchParams({ select: '*', game_id: `eq.${gameId}`, order: 'draw_date.desc', limit: '1' });
  try {
    const { payload } = await restRequest(`primy_draw_results?${params}`, {
      fetchImpl,
      headers: { Range: '0-0', Prefer: 'count=none' },
    });
    const draw = Array.isArray(payload) ? rowToDraw(payload[0]) : null;
    if (draw) memoryUpsert([draw]);
    return draw || memoryRange(gameId).at(-1) || null;
  } catch {
    return memoryRange(gameId).at(-1) || null;
  }
}

export async function upsertDraws(draws, { fetchImpl = globalThis.fetch } = {}) {
  const normalized = draws.map(normalizeDraw).filter(Boolean);
  if (!normalized.length) return { saved: 0, persisted: false, backend: repositoryStatus().backend };
  memoryUpsert(normalized);
  const current = config();
  if (!current.writable) return { saved: normalized.length, persisted: false, backend: repositoryStatus().backend };
  try {
    await restRequest('primy_draw_results?on_conflict=game_id,draw_date', {
      method: 'POST',
      body: normalized.map(drawToRow),
      fetchImpl,
      write: true,
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    });
    return { saved: normalized.length, persisted: true, backend: 'supabase' };
  } catch {
    return { saved: normalized.length, persisted: false, backend: repositoryStatus().backend };
  }
}

export function clearMemoryRepositoryForTests() {
  memoryRows.clear();
}
