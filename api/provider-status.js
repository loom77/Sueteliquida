import { applyApiSecurity, rateLimit } from './_security.js';
import { getLatestDraw, ProviderError } from './_drawService.js';
import { repositoryStatus } from './_drawRepository.js';
import { GAMES } from '../src/utils/gameConfig.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  res.setHeader('Cache-Control', 'no-store');
  if (!(await rateLimit(req, { limit: 10, windowMs: 60000, scope: 'provider-status' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }

  try {
    const { draw, stale, cacheHit } = await getLatestDraw(GAMES.primitiva, { force: true });
    return res.status(200).json({
      success: true,
      configured: true,
      provider: 'SELAE',
      source: draw.source || 'SELAE oficial',
      latestDrawDate: draw.date,
      stale: Boolean(stale),
      cacheHit: Boolean(cacheHit),
      repository: repositoryStatus(),
    });
  } catch (error) {
    const known = error instanceof ProviderError;
    return res.status(known ? error.status : 502).json({
      success: false,
      configured: true,
      provider: 'SELAE',
      repository: repositoryStatus(),
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'Error de conexión con SELAE.',
      providerStatus: known ? error.providerStatus : null,
    });
  }
}
