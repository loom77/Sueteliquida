import { applyApiSecurity, rateLimit } from './_security.js';
import { parseGame, parseYears } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { fetchDrawRange, fetchLatestDraw, ProviderError } from './_loteriasApi.js';

const dateKey = date => date.toISOString().slice(0, 10);
const AUDIT_MINIMUM_DRAWS = 100;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STALE_TTL_MS = 48 * 60 * 60 * 1000;
const FALLBACK_CODES = new Set(['PLAN_RESTRICTED', 'PROVIDER_REJECTED', 'ENDPOINT_NOT_FOUND']);

const historyCache = globalThis.__primyHistoryCache || new Map();
globalThis.__primyHistoryCache = historyCache;

function rangeForYears(years) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setUTCFullYear(toDate.getUTCFullYear() - years);
  return { from: dateKey(fromDate), to: dateKey(toDate) };
}

function cacheKey(gameId, years) {
  return `${gameId}:${years}`;
}

function readCached(gameId, years, maxAge = CACHE_TTL_MS) {
  const cached = historyCache.get(cacheKey(gameId, years));
  if (!cached || Date.now() - cached.savedAt > maxAge) return null;
  return cached.payload;
}

function writeCached(gameId, years, payload) {
  historyCache.set(cacheKey(gameId, years), { savedAt: Date.now(), payload });
}

function buildPayload({ game, requestedYears, actualYears, result, stale = false, staleReason = '' }) {
  const drawCount = result.draws.length;
  const sufficientForAudit = drawCount >= AUDIT_MINIMUM_DRAWS;
  const latestOnly = Boolean(result.limited) && drawCount <= 1;
  let notice = '';

  if (latestOnly) {
    notice = 'El plan conectado solo permite consultar el último sorteo. Primy lo muestra como referencia; el análisis histórico completo permanece desactivado.';
  } else if (!sufficientForAudit) {
    notice = `El proveedor ha devuelto ${drawCount} ${drawCount === 1 ? 'sorteo válido' : 'sorteos válidos'}. El análisis técnico requiere al menos ${AUDIT_MINIMUM_DRAWS}.`;
  } else if (actualYears < requestedYears) {
    notice = `El proveedor ha devuelto un intervalo reducido de aproximadamente ${actualYears} ${actualYears === 1 ? 'año' : 'años'}.`;
  }

  if (stale) {
    notice = `${notice ? `${notice} ` : ''}Se conserva la última copia disponible porque el proveedor no ha podido actualizar los datos${staleReason ? `: ${staleReason}` : '.'}`;
  }

  return {
    success: true,
    gameId: game.id,
    requestedYears,
    actualYears,
    draws: result.draws,
    source: result.providerBase ? 'LoteriasAPI / SELAE' : (result.source || 'LoteriasAPI / SELAE'),
    limited: latestOnly || actualYears < requestedYears || !sufficientForAudit,
    latestOnly,
    stale,
    sufficientForAudit,
    minimumAuditDraws: AUDIT_MINIMUM_DRAWS,
    notice,
  };
}

async function retrieveHistory(game, requestedYears) {
  const { from, to } = rangeForYears(requestedYears);
  try {
    const result = await fetchDrawRange({
      game,
      key: process.env.LOTERIA_API_KEY,
      from,
      to,
      allowRecentFallback: false,
      timeoutMs: 8000,
    });
    if (result.draws.length) return { result, actualYears: requestedYears };
  } catch (error) {
    if (!(error instanceof ProviderError) || !FALLBACK_CODES.has(error.code)) throw error;
  }

  const result = await fetchLatestDraw({
    game,
    key: process.env.LOTERIA_API_KEY,
    timeoutMs: 8000,
  });
  return { result, actualYears: 0 };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 20, windowMs: 60000 }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas actualizaciones seguidas. Espera un minuto antes de volver a intentarlo.', retryAfter: 60 });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const game = parseGame(req.query?.game);
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Juego no válido.' });

  const requestedYears = parseYears(req.query?.years);
  if (requestedYears == null) return res.status(400).json({ success: false, code: 'INVALID_YEARS', message: 'Intervalo histórico no válido.' });

  const fresh = readCached(game.id, requestedYears);
  if (fresh) {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=21600');
    return res.status(200).json(fresh);
  }

  try {
    const { result, actualYears } = await retrieveHistory(game, requestedYears);
    if (!result.draws.length) {
      return res.status(502).json({ success: false, code: 'EMPTY_HISTORY', message: 'LoteriasAPI no ha devuelto sorteos válidos.' });
    }

    const payload = buildPayload({ game, requestedYears, actualYears, result });
    writeCached(game.id, requestedYears, payload);
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    finishRequest(context, { endpoint: 'history', status: 200, gameId: game.id, draws: result.draws.length, actualYears });
    return res.status(200).json(payload);
  } catch (error) {
    const stale = readCached(game.id, requestedYears, STALE_TTL_MS);
    if (stale && ['RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'PROVIDER_TIMEOUT', 'NETWORK_ERROR', 'CIRCUIT_OPEN'].includes(error?.code)) {
      const payload = { ...stale, stale: true, notice: `${stale.notice ? `${stale.notice} ` : ''}No se ha podido actualizar ahora; se conserva la última copia disponible.` };
      res.setHeader('Cache-Control', 'private, max-age=60');
      return res.status(200).json(payload);
    }

    logEvent('error', 'history_failed', { requestId: context.requestId, gameId: game?.id, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    const known = error instanceof ProviderError;
    const status = known ? error.status : 502;
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(status).json({
      success: false,
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'No se puede recuperar el historial.',
      providerStatus: known ? error.providerStatus : null,
      retryAfter: Number(error?.retryAfter) || null,
    });
  }
}

export { buildPayload, retrieveHistory };
