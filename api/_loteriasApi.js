import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess } from './_circuitBreaker.js';
const OFFICIAL_BASE = 'https://api.loteriasapi.com/v1';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ProviderError extends Error {
  constructor(message, { code = 'PROVIDER_ERROR', status = 502, providerStatus = null, details = '', retryAfter = null, endpoint = '' } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
    this.providerStatus = providerStatus;
    this.details = details;
    this.retryAfter = retryAfter;
    this.endpoint = endpoint;
  }
}

export function providerBase() {
  return String(process.env.LOTERIA_API_BASE || OFFICIAL_BASE).trim().replace(/\/$/, '');
}

function safeText(value, max = 320) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function messageFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return safeText(
    payload.message ||
    payload.error?.message ||
    payload.error ||
    payload.detail ||
    payload.details ||
    payload.data?.message ||
    ''
  );
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return { rawText: safeText(text) }; }
}

function mapHttpError(response, payload, endpoint) {
  const providerMessage = messageFromPayload(payload);
  const retryAfter = response.headers.get('retry-after');
  if (response.status === 401) {
    return new ProviderError('La API key non è valida, non è attiva oppure non appartiene a LoteriasAPI.', {
      code: 'AUTH_INVALID', status: 401, providerStatus: 401, details: providerMessage, endpoint,
    });
  }
  if (response.status === 403) {
    return new ProviderError('LoteriasAPI ha rifiutato questa richiesta. Controlla permessi e stato del piano.', {
      code: 'PLAN_RESTRICTED', status: 403, providerStatus: 403, details: providerMessage, endpoint,
    });
  }
  if (response.status === 404) {
    return new ProviderError('Endpoint LoteriasAPI non trovato.', {
      code: 'ENDPOINT_NOT_FOUND', status: 502, providerStatus: 404, details: providerMessage, endpoint,
    });
  }
  if (response.status === 429) {
    return new ProviderError('Limite di richieste LoteriasAPI raggiunto. Riprova più tardi.', {
      code: 'RATE_LIMITED', status: 429, providerStatus: 429, details: providerMessage, retryAfter, endpoint,
    });
  }
  if (response.status >= 500) {
    return new ProviderError('LoteriasAPI è temporaneamente indisponibile.', {
      code: 'PROVIDER_UNAVAILABLE', status: 502, providerStatus: response.status, details: providerMessage, endpoint,
    });
  }
  return new ProviderError(providerMessage || `LoteriasAPI ha risposto con HTTP ${response.status}.`, {
    code: 'PROVIDER_REJECTED', status: 502, providerStatus: response.status, details: providerMessage, endpoint,
  });
}

export async function providerRequest(path, {
  key,
  query = {},
  timeoutMs = 15000,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) {
    throw new ProviderError('LOTERIA_API_KEY non configurata su Vercel.', {
      code: 'KEY_NOT_CONFIGURED', status: 500,
    });
  }
  if (typeof fetchImpl !== 'function') {
    throw new ProviderError('Il runtime non supporta fetch.', { code: 'FETCH_UNAVAILABLE', status: 500 });
  }

  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') search.set(name, String(value));
  }

  const base = providerBase();
  const circuitName = `provider:${base}`;
  try {
    assertCircuitClosed(circuitName);
  } catch (error) {
    throw new ProviderError(error.message, { code: 'CIRCUIT_OPEN', status: 503, retryAfter: String(error.retryAfter || 30) });
  }
  const endpoint = `${base}${path}${search.size ? `?${search}` : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: { 'x-api-key': normalizedKey, Accept: 'application/json' },
      signal: controller.signal,
    });
    const payload = await readPayload(response);
    if (!response.ok) throw mapHttpError(response, payload, endpoint);
    if (payload?.success === false) {
      throw new ProviderError(messageFromPayload(payload) || 'LoteriasAPI ha restituito una risposta negativa.', {
        code: 'PROVIDER_REJECTED', status: 502, providerStatus: response.status, endpoint,
      });
    }
    recordCircuitSuccess(circuitName);
    return { payload, response, base, endpoint };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ProviderError('LoteriasAPI non ha risposto entro il tempo previsto.', {
        code: 'PROVIDER_TIMEOUT', status: 504, endpoint,
      });
    }
    if (error instanceof ProviderError) {
      if (!['AUTH_INVALID', 'PLAN_RESTRICTED', 'RATE_LIMITED', 'ENDPOINT_NOT_FOUND'].includes(error.code)) recordCircuitFailure(circuitName);
      throw error;
    }
    recordCircuitFailure(circuitName);
    throw new ProviderError('Impossibile collegarsi a LoteriasAPI.', {
      code: 'NETWORK_ERROR', status: 502, details: safeText(error?.message || ''), endpoint,
    });
  } finally {
    clearTimeout(timer);
  }
}

function findDrawArray(value, depth = 0) {
  if (depth > 5 || value == null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return null;
  for (const key of ['data', 'results', 'items', 'draws', 'records']) {
    const found = findDrawArray(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function looksLikeDraw(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Boolean(
    value.draw_date || value.drawDate || value.date ||
    value.numbers || value.combination || value.winningNumbers || value.winning_numbers
  );
}

export function extractDrawItems(payload) {
  const array = findDrawArray(payload);
  if (array) return array;
  const candidates = [payload?.data, payload?.result, payload];
  const draw = candidates.find(looksLikeDraw);
  return draw ? [draw] : [];
}

function asNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeDate(value) {
  const text = String(value || '').trim();
  if (ISO_DATE.test(text)) return text;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function unwrapDraw(item) {
  if (!item || typeof item !== 'object') return {};
  if (looksLikeDraw(item.data)) return item.data;
  return item;
}

export function normalizeProviderDraw(item, game) {
  const draw = unwrapDraw(item);
  const resultData = draw.resultData || draw.result_data || draw.extras || {};
  const date = normalizeDate(draw.draw_date || draw.drawDate || draw.date || draw.draw?.date);
  const rawNumbers = draw.numbers || draw.combination || draw.winningNumbers || draw.winning_numbers || resultData.numbers || [];
  const winningNumbers = [...new Set((Array.isArray(rawNumbers) ? rawNumbers : []).map(Number).filter(Number.isFinite))]
    .sort((a, b) => a - b);

  if (!date || winningNumbers.length !== game.numbersToPick) return null;
  if (winningNumbers.some(number => number < 1 || number > game.numberPoolMax)) return null;

  const dream = draw.dream ?? resultData.dream ?? resultData.sueno ?? resultData.sueño;
  const reintegro = draw.reintegro ?? resultData.reintegro;
  const complementary = draw.complementary ?? draw.complementario ?? resultData.complementary ?? resultData.complementario;

  const rawJackpot = draw.jackpot_next ?? draw.jackpotNext ?? draw.next_jackpot ?? draw.nextJackpot ?? draw.jackpot;
  const jackpotNext = asNumber(rawJackpot?.amount ?? rawJackpot?.value ?? rawJackpot);

  return {
    date,
    winningNumbers,
    extra: asNumber(game.id === 'eurodreams' ? dream : reintegro),
    complementary: game.hasComplementary ? asNumber(complementary) : null,
    prizes: Array.isArray(draw.prizes) ? draw.prizes : Array.isArray(draw.prizeBreakdown) ? draw.prizeBreakdown : [],
    jackpotNext,
    jackpotFormatted: safeText(draw.jackpotFormatted || draw.jackpot_formatted || draw.nextJackpotFormatted || '', 80),
    source: draw.meta?.source ? `LoteriasAPI / ${draw.meta.source}` : 'LoteriasAPI / SELAE',
    updatedAt: draw.meta?.updated_at || draw.updatedAt || draw.updated_at || null,
    drawId: draw.draw_id || draw.drawId || null,
  };
}

export function dedupeDraws(draws) {
  const byDate = new Map();
  for (const draw of draws) if (draw?.date) byDate.set(draw.date, draw);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchDrawRange({
  game,
  key,
  from,
  to,
  allowRecentFallback = false,
  timeoutMs = 9000,
  fetchImpl = globalThis.fetch,
} = {}) {
  const path = `/results/${game.apiSlug}`;
  try {
    const { payload, base } = await providerRequest(path, {
      key,
      query: { from, to },
      timeoutMs,
      fetchImpl,
    });
    const draws = dedupeDraws(
      extractDrawItems(payload).map(item => normalizeProviderDraw(item, game)).filter(Boolean)
    ).filter(draw => (!from || draw.date >= from) && (!to || draw.date <= to));

    if (draws.length || !allowRecentFallback) {
      return { draws, providerBase: base, limited: false, notice: '' };
    }
  } catch (error) {
    if (!allowRecentFallback || !['PLAN_RESTRICTED', 'PROVIDER_REJECTED', 'ENDPOINT_NOT_FOUND'].includes(error.code)) throw error;
  }

  const { payload, base } = await providerRequest(`${path}/latest`, { key, timeoutMs, fetchImpl });
  const draws = dedupeDraws(
    extractDrawItems(payload).map(item => normalizeProviderDraw(item, game)).filter(Boolean)
  );
  return {
    draws,
    providerBase: base,
    limited: true,
    notice: 'Lo storico completo non è stato restituito: è disponibile soltanto l’ultima estrazione.',
  };
}
