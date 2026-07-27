import { applyApiSecurity, rateLimit } from './_security.js';
import { parseDateList, parseGame } from './_validation.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { fetchDrawRange, ProviderError } from './_loteriasApi.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (!(await rateLimit(req, { limit: 20, windowMs: 60000 }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Troppe richieste. Riprova tra poco.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Metodo non consentito.' });
  }

  const game = parseGame(req.query?.game);
  if (!game) return res.status(400).json({ success: false, code: 'INVALID_GAME', message: 'Gioco non valido.' });

  const dates = parseDateList(req.query?.dates, { max: 31 });
  if (!dates) {
    return res.status(400).json({ success: false, code: 'INVALID_DATES', message: 'Date non valide.' });
  }

  const sorted = [...dates].sort();
  try {
    const result = await fetchDrawRange({
      game,
      key: process.env.LOTERIA_API_KEY,
      from: sorted[0],
      to: sorted.at(-1),
      allowRecentFallback: false,
    });
    const wanted = new Set(dates);
    const results = result.draws.filter(draw => wanted.has(draw.date));
    const found = new Set(results.map(draw => draw.date));
    const unavailableDates = dates.filter(date => !found.has(date));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    finishRequest(context, { endpoint: 'check-results', status: 200, gameId: game.id, requestedDates: dates.length, results: results.length });
    return res.status(200).json({
      success: true,
      gameId: game.id,
      results,
      unavailableDates,
      partial: unavailableDates.length > 0,
      notice: unavailableDates.length
        ? 'Alcune estrazioni non sono disponibili con il piano API corrente o non sono ancora state pubblicate.'
        : '',
    });
  } catch (error) {
    logEvent('error', 'check_results_failed', { requestId: context.requestId, gameId: game?.id, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    const known = error instanceof ProviderError;
    if (error?.retryAfter) res.setHeader('Retry-After', error.retryAfter);
    return res.status(known ? error.status : 502).json({
      success: false,
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'Impossibile recuperare i risultati in questo momento.',
      providerStatus: known ? error.providerStatus : null,
    });
  }
}
