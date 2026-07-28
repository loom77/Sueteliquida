import { applyApiSecurity, rateLimit } from './_security.js';
import { parseGame, parseYears } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { fetchDrawRange, ProviderError } from './_loteriasApi.js';

const dateKey = date => date.toISOString().slice(0, 10);
const RETRYABLE_HISTORY_CODES = new Set(['PLAN_RESTRICTED', 'PROVIDER_REJECTED', 'ENDPOINT_NOT_FOUND']);

function rangeForYears(years) {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setUTCFullYear(toDate.getUTCFullYear() - years);
  return { from: dateKey(fromDate), to: dateKey(toDate) };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 12, windowMs: 60000 }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const game = parseGame(req.query?.game);
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Juego no válido.' });

  const requestedYears = parseYears(req.query?.years);
  if (requestedYears == null) return res.status(400).json({ success: false, code: 'INVALID_YEARS', message: 'Intervalo histórico no válido.' });
  const attempts = [...new Set([requestedYears, Math.min(requestedYears, 2), 1])].filter(Boolean);

  try {
    let result = null;
    let actualYears = requestedYears;
    const notices = [];

    for (const years of attempts) {
      const { from, to } = rangeForYears(years);
      try {
        const candidate = await fetchDrawRange({
          game,
          key: process.env.LOTERIA_API_KEY,
          from,
          to,
          allowRecentFallback: false,
          timeoutMs: 8000,
        });
        if (candidate.draws.length) {
          result = candidate;
          actualYears = years;
          if (years < requestedYears) notices.push(`El proveedor ha devuelto un historial reducido de aproximadamente ${years} ${years === 1 ? 'año' : 'años'}.`);
          break;
        }
      } catch (error) {
        if (!(error instanceof ProviderError) || !RETRYABLE_HISTORY_CODES.has(error.code)) throw error;
        notices.push(`El intervalo de ${years} ${years === 1 ? 'año' : 'años'} no está disponible con el plan actual.`);
      }
    }

    if (!result) {
      const { from, to } = rangeForYears(1);
      result = await fetchDrawRange({
        game,
        key: process.env.LOTERIA_API_KEY,
        from,
        to,
        allowRecentFallback: true,
        timeoutMs: 8000,
      });
      actualYears = 1;
    }

    if (!result.draws.length) {
      return res.status(502).json({ success: false, code: 'EMPTY_HISTORY', message: 'LoteriasAPI no ha devuelto sorteos válidos.' });
    }

    const sufficientForAudit = result.draws.length >= 100;
    if (result.notice) notices.push(result.notice);
    if (!sufficientForAudit) notices.push(`Hay disponibles ${result.draws.length} sorteos válidos. Para la auditoría histórica se necesitan al menos 100.`);

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    finishRequest(context, { endpoint: 'history', status: 200, gameId: game.id, draws: result.draws.length, actualYears });
    return res.status(200).json({
      success: true,
      gameId: game.id,
      requestedYears,
      actualYears,
      draws: result.draws,
      source: 'LoteriasAPI / SELAE',
      limited: result.limited || actualYears < requestedYears || !sufficientForAudit,
      sufficientForAudit,
      notice: [...new Set(notices)].join(' '),
    });
  } catch (error) {
    logEvent('error', 'history_failed', { requestId: context.requestId, gameId: game?.id, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    const known = error instanceof ProviderError;
    const status = known ? error.status : 502;
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(status).json({
      success: false,
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'No se puede recuperar el historial.',
      providerStatus: known ? error.providerStatus : null,
    });
  }
}
