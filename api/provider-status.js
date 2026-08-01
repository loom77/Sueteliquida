import { applyApiSecurity, rateLimit } from './_security.js';
import { providerRequest, extractDrawItems, normalizeProviderDraw, ProviderError } from './_loteriasApi.js';
import { GAMES } from '../src/utils/gameConfig.js';

export default async function handler(req, res) {
  applyApiSecurity(res);
  res.setHeader('Cache-Control', 'no-store');
  if (!(await rateLimit(req, { limit: 10, windowMs: 60000 }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas solicitudes.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  try {
    const game = GAMES.primitiva;
    const result = await providerRequest(`/results/${game.apiSlug}/latest`, { key: process.env.LOTERIA_API_KEY });
    const draw = extractDrawItems(result.payload).map(item => normalizeProviderDraw(item, game)).find(Boolean) || null;
    return res.status(200).json({ success: true, configured: true, latestDrawDate: draw?.date || null });
  } catch (error) {
    const known = error instanceof ProviderError;
    return res.status(known ? error.status : 502).json({
      success: false,
      configured: error?.code !== 'KEY_NOT_CONFIGURED',
      code: known ? error.code : 'UNKNOWN_PROVIDER_ERROR',
      message: known ? error.message : 'Error de conexión con el proveedor.',
      providerStatus: known ? error.providerStatus : null,
    });
  }
}
