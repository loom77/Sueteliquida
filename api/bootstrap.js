import { GAMES } from '../src/utils/gameConfig.js';
import { extractDrawItems, normalizeProviderDraw, providerRequest, ProviderError } from './_loteriasApi.js';
import { applyApiSecurity, rateLimit } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';

function publicError(error) {
  return { code: error?.code || 'OVERVIEW_ERROR', message: error?.message || 'No se pueden actualizar los datos.' };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  if (!(await rateLimit(req, { limit: 40, windowMs: 60000, scope: 'bootstrap' }))) return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const key = process.env.LOTERIA_API_KEY;
  if (!key) return res.status(500).json({ success: false, configured: false, code: 'KEY_NOT_CONFIGURED', message: 'LOTERIA_API_KEY no está configurada en Vercel.' });

  const games = {};
  logEvent('info', 'bootstrap_start', { requestId: context.requestId });
  const errors = {};
  await Promise.all(Object.values(GAMES).map(async game => {
    try {
      const { payload } = await providerRequest(`/results/${game.apiSlug}/latest`, { key, timeoutMs: 9000 });
      const draw = extractDrawItems(payload).map(item => normalizeProviderDraw(item, game)).find(Boolean);
      if (!draw) throw new ProviderError(`Respuesta ${game.name} no reconocida.`, { code: 'INVALID_PROVIDER_PAYLOAD' });
      games[game.id] = {
        latestDate: draw.date,
        jackpotNext: draw.jackpotNext,
        jackpotFormatted: draw.jackpotFormatted,
        updatedAt: draw.updatedAt,
        source: draw.source,
      };
    } catch (error) {
      errors[game.id] = publicError(error);
      logEvent('warn', 'bootstrap_game_failed', { requestId: context.requestId, gameId: game.id, code: error?.code || 'UNKNOWN' });
    }
  }));

  const available = Object.keys(games).length;
  finishRequest(context, { endpoint: 'bootstrap', status: available ? 200 : 502, availableGames: available });
  return res.status(available ? 200 : 502).json({
    success: available > 0,
    configured: true,
    games,
    errors,
    partial: available > 0 && Object.keys(errors).length > 0,
    fetchedAt: new Date().toISOString(),
    message: available ? '' : 'El proveedor no ha devuelto datos válidos.',
  });
}
