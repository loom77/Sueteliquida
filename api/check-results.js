import { applyApiSecurity, rateLimit, requestSearchParams } from './_security.js';
import { parseDateList, parseGame, parseRoundIdList } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { ProviderError } from './_drawService.js';
import { getVerificationEvents } from './_verificationService.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 48, windowMs: 60000, scope: 'check-results' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const searchParams = requestSearchParams(req);
  const game = parseGame(searchParams.get('game'));
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Juego no válido.' });

  const datesRaw = searchParams.get('dates');
  const dates = datesRaw ? parseDateList(datesRaw, { max: 31 }) : [];
  const roundIdsRaw = searchParams.get('roundIds');
  const roundIds = roundIdsRaw ? parseRoundIdList(roundIdsRaw, { max: 31 }) : [];
  if (dates == null) return res.status(400).json({ success: false, code: 'INVALID_DATES', message: 'Fechas no válidas.' });
  if (roundIds == null) return res.status(400).json({ success: false, code: 'INVALID_ROUND_IDS', message: 'Jornadas no válidas.' });
  if (!dates.length && !roundIds.length) return res.status(400).json({ success: false, code: 'MISSING_VERIFICATION_KEYS', message: 'Indica al menos una fecha o una jornada.' });

  try {
    const result = await getVerificationEvents(game, { dates, roundIds });
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    finishRequest(context, {
      endpoint: 'check-results', status: 200, provider: 'SELAE', gameId: game.id,
      requestedDates: dates.length, requestedRounds: roundIds.length, results: result.events.length,
    });
    return res.status(200).json({
      success: true,
      provider: 'SELAE',
      gameId: game.id,
      results: result.events,
      unavailableDates: result.unavailableDates,
      unavailableRoundIds: result.unavailableRoundIds,
      partial: result.unavailableDates.length > 0 || result.unavailableRoundIds.length > 0,
      repository: result.repository,
      liveFetched: result.liveFetched || 0,
      providerErrors: result.errors || [],
      notice: result.unavailableDates.length || result.unavailableRoundIds.length
        ? 'Algunos resultados oficiales todavía no se han publicado o no están archivados.'
        : '',
    });
  } catch (error) {
    logEvent('error', 'check_results_failed', {
      requestId: context.requestId, gameId: game?.id, provider: 'SELAE',
      code: error?.code || 'UNKNOWN', message: error?.message || '',
    });
    const known = error instanceof ProviderError || Number.isInteger(error?.status);
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(known ? (error.status || 502) : 502).json({
      success: false,
      provider: 'SELAE',
      code: error?.code || 'UNKNOWN_PROVIDER_ERROR',
      message: error?.message || 'No se pueden recuperar los resultados oficiales en este momento.',
      providerStatus: error?.providerStatus || null,
    });
  }
}
