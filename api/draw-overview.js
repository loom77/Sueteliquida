import { GAMES } from '../src/utils/gameConfig.js';
import { getLatestDraw } from './_drawService.js';
import { repositoryStatus } from './_drawRepository.js';
import { applyApiSecurity, rateLimit } from './_security.js';

function serializeError(error) {
  return { code: error?.code || 'OVERVIEW_ERROR', message: error?.message || 'No se pueden actualizar los datos.' };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  if (!(await rateLimit(req, { limit: 40, windowMs: 60000, scope: 'draw-overview' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  const games = {};
  const errors = {};
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
      errors[game.id] = serializeError(error);
    }
  }));

  const available = Object.keys(games).length;
  return res.status(available ? 200 : 502).json({
    success: available > 0,
    provider: 'SELAE',
    repository: repositoryStatus(),
    games,
    errors,
    partial: available > 0 && Object.keys(errors).length > 0,
    fetchedAt: new Date().toISOString(),
  });
}
