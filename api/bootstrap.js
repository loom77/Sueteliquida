import { GAMES } from '../src/utils/gameConfig.js';
import { getLatestDraw, ProviderError } from './_drawService.js';
import { repositoryStatus } from './_drawRepository.js';
import { applyApiSecurity, rateLimit } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';

function publicError(error) {
  return { code: error?.code || 'OVERVIEW_ERROR', message: error?.message || 'No se pueden actualizar los datos.' };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  if (!(await rateLimit(req, { limit: 40, windowMs: 60000, scope: 'bootstrap' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const games = {};
  const errors = {};
  logEvent('info', 'bootstrap_start', { requestId: context.requestId, provider: 'SELAE' });

  await Promise.all(Object.values(GAMES).map(async game => {
    try {
      const { draw, stale } = await getLatestDraw(game);
      games[game.id] = {
        latestDate: draw.date,
        jackpotNext: draw.jackpotNext,
        jackpotFormatted: draw.jackpotFormatted,
        updatedAt: draw.updatedAt || draw.fetchedAt,
        source: draw.source || 'SELAE oficial',
        stale: Boolean(stale),
      };
    } catch (error) {
      errors[game.id] = publicError(error);
      logEvent('warn', 'bootstrap_game_failed', {
        requestId: context.requestId,
        gameId: game.id,
        code: error?.code || 'UNKNOWN',
      });
    }
  }));

  const available = Object.keys(games).length;
  finishRequest(context, { endpoint: 'bootstrap', status: available ? 200 : 502, availableGames: available, provider: 'SELAE' });
  return res.status(available ? 200 : 502).json({
    success: available > 0,
    configured: true,
    provider: 'SELAE',
    repository: repositoryStatus(),
    games,
    errors,
    partial: available > 0 && Object.keys(errors).length > 0,
    fetchedAt: new Date().toISOString(),
    message: available ? '' : 'SELAE no ha devuelto datos oficiales válidos.',
  });
}

export { ProviderError };
