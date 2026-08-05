import { applyApiSecurity, rateLimit, requestSearchParams } from './_security.js';
import { parseGame, parseYears } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { coverageYears, getHistoryDraws, ProviderError } from './_drawService.js';

const dateKey = date => date.toISOString().slice(0, 10);
const AUDIT_MINIMUM_DRAWS = 100;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STALE_TTL_MS = 48 * 60 * 60 * 1000;
const historyCache = globalThis.__primyHistoryCache || new Map();
globalThis.__primyHistoryCache = historyCache;

function rangeForYears(years, now = new Date()) {
  const toDate = new Date(now);
  const fromDate = new Date(now);
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
  const latestOnly = drawCount <= 1;
  let notice = '';

  if (!drawCount) {
    notice = 'El archivo oficial todavía no contiene sorteos para este intervalo. Ejecuta la sincronización o la importación histórica de SELAE.';
  } else if (latestOnly) {
    notice = 'Solo hay un sorteo archivado. Primy seguirá ampliando automáticamente el archivo con los resultados oficiales de SELAE.';
  } else if (!sufficientForAudit) {
    notice = `El archivo contiene ${drawCount} sorteos válidos. El análisis técnico requiere al menos ${AUDIT_MINIMUM_DRAWS}.`;
  } else if (actualYears < requestedYears) {
    notice = `El archivo disponible cubre aproximadamente ${actualYears} ${actualYears === 1 ? 'año' : 'años'} de los ${requestedYears} solicitados.`;
  }

  if (result.warning) notice = `${notice ? `${notice} ` : ''}La actualización más reciente no se ha completado: ${result.warning}`;
  if (stale) notice = `${notice ? `${notice} ` : ''}Se conserva la última copia disponible${staleReason ? `: ${staleReason}` : '.'}`;

  return {
    success: true,
    provider: 'SELAE',
    gameId: game.id,
    requestedYears,
    actualYears,
    draws: result.draws,
    source: result.source || 'SELAE oficial / archivo Primy',
    repository: result.repository,
    limited: actualYears < requestedYears || !sufficientForAudit,
    latestOnly,
    stale,
    sufficientForAudit,
    minimumAuditDraws: AUDIT_MINIMUM_DRAWS,
    notice,
  };
}

async function retrieveHistory(game, requestedYears, options = {}) {
  const { from, to } = rangeForYears(requestedYears, options.now);
  const result = await getHistoryDraws(game, from, to, options);
  return { result, actualYears: coverageYears(result.draws, requestedYears) };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 20, windowMs: 60000, scope: 'history' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas actualizaciones seguidas. Espera un minuto antes de volver a intentarlo.', retryAfter: 60 });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const searchParams = requestSearchParams(req);
  const game = parseGame(searchParams.get('game'));
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Juego no válido.' });

  const requestedYears = parseYears(searchParams.get('years'));
  if (requestedYears == null) return res.status(400).json({ success: false, code: 'INVALID_YEARS', message: 'Intervalo histórico no válido.' });

  const fresh = readCached(game.id, requestedYears);
  if (fresh) {
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=21600');
    return res.status(200).json(fresh);
  }

  try {
    const { result, actualYears } = await retrieveHistory(game, requestedYears);
    const payload = buildPayload({ game, requestedYears, actualYears, result });
    writeCached(game.id, requestedYears, payload);
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    finishRequest(context, { endpoint: 'history', status: 200, provider: 'SELAE', gameId: game.id, draws: result.draws.length, actualYears });
    return res.status(200).json(payload);
  } catch (error) {
    const stale = readCached(game.id, requestedYears, STALE_TTL_MS);
    if (stale) {
      const payload = { ...stale, stale: true, notice: `${stale.notice ? `${stale.notice} ` : ''}No se ha podido actualizar ahora; se conserva la última copia disponible.` };
      res.setHeader('Cache-Control', 'private, max-age=60');
      return res.status(200).json(payload);
    }

    logEvent('error', 'history_failed', {
      requestId: context.requestId, gameId: game?.id, provider: 'SELAE',
      code: error?.code || 'UNKNOWN', message: error?.message || '',
    });
    const known = error instanceof ProviderError;
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(known ? error.status : 502).json({
      success: false,
      provider: 'SELAE',
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'No se puede recuperar el historial oficial.',
      providerStatus: known ? error.providerStatus : null,
      retryAfter: Number(error?.retryAfter) || null,
    });
  }
}

export { buildPayload, rangeForYears, retrieveHistory };
