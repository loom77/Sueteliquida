import { applyApiSecurity, rateLimit } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { syncRecentDraws } from './_drawService.js';

function authorized(req) {
  const secret = String(process.env.CRON_SECRET || '').trim();
  if (!secret) return false;
  const authorization = String(req.headers?.authorization || '');
  return authorization === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  if (!authorized(req)) {
    return res.status(process.env.CRON_SECRET ? 401 : 503).json({
      success: false,
      code: process.env.CRON_SECRET ? 'UNAUTHORIZED' : 'CRON_SECRET_NOT_CONFIGURED',
      message: process.env.CRON_SECRET ? 'Autorización no válida.' : 'Configura CRON_SECRET antes de activar la sincronización programada.',
    });
  }
  if (!(await rateLimit(req, { limit: 6, windowMs: 60 * 60 * 1000, scope: 'sync-results' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'La sincronización ya se ha solicitado recientemente.' });
  }

  try {
    const result = await syncRecentDraws({ lookbackDraws: 8 });
    finishRequest(context, { endpoint: 'sync-results', status: 200, provider: 'SELAE' });
    return res.status(200).json({ success: true, provider: 'SELAE', ...result });
  } catch (error) {
    logEvent('error', 'sync_results_failed', { requestId: context.requestId, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    return res.status(error?.status || 502).json({ success: false, provider: 'SELAE', code: error?.code || 'SYNC_FAILED', message: error?.message || 'No se ha podido sincronizar el archivo oficial.' });
  }
}
