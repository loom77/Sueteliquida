import { applyApiSecurity, rateLimit } from './_security.js';
import { parseDateList, parseGame } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { getDrawsForDates, ProviderError } from './_drawService.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 20, windowMs: 60000, scope: 'check-results' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const game = parseGame(req.query?.game);
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Juego no válido.' });

  const dates = parseDateList(req.query?.dates, { max: 31 });
  if (!dates) return res.status(400).json({ success: false, code: 'INVALID_DATES', message: 'Fechas no válidas.' });

  try {
    const result = await getDrawsForDates(game, dates);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    finishRequest(context, {
      endpoint: 'check-results', status: 200, provider: 'SELAE', gameId: game.id,
      requestedDates: dates.length, results: result.draws.length,
    });
    return res.status(200).json({
      success: true,
      provider: 'SELAE',
      gameId: game.id,
      results: result.draws,
      unavailableDates: result.unavailableDates,
      partial: result.unavailableDates.length > 0,
      repository: result.repository,
      notice: result.unavailableDates.length
        ? 'Algunos sorteos oficiales todavía no se han publicado, no corresponden a un día de sorteo o no están archivados.'
        : '',
    });
  } catch (error) {
    logEvent('error', 'check_results_failed', {
      requestId: context.requestId, gameId: game?.id, provider: 'SELAE',
      code: error?.code || 'UNKNOWN', message: error?.message || '',
    });
    const known = error instanceof ProviderError;
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(known ? error.status : 502).json({
      success: false,
      provider: 'SELAE',
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'No se pueden recuperar los resultados oficiales en este momento.',
      providerStatus: known ? error.providerStatus : null,
    });
  }
}
