import { applyApiSecurity, rateLimit } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';

const SYNC_ENDPOINT = 'https://vmzkhelxehgedorsvchl.supabase.co/functions/v1/sync-sports-rounds';

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  if (!(await rateLimit(req, { limit: 2, windowMs: 60 * 60 * 1000, scope: 'sync-sports-rounds' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'La sincronización deportiva ya se ha solicitado recientemente.' });
  }
  try {
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: req.query?.game || null, trigger: 'vercel-manual' }),
      signal: AbortSignal.timeout(65000),
    });
    const payload = await response.json().catch(() => ({}));
    finishRequest(context, { endpoint: 'sync-sports-rounds', status: response.status, provider: 'SELAE' });
    return res.status(response.status).json(payload);
  } catch (error) {
    logEvent('error', 'sync_sports_rounds_failed', { requestId: context.requestId, code: error?.name === 'TimeoutError' ? 'SYNC_TIMEOUT' : 'SYNC_FAILED', message: error?.message || '' });
    return res.status(502).json({ success: false, provider: 'SELAE', code: 'SPORTS_SYNC_FAILED', message: 'No se ha podido solicitar la sincronización deportiva.' });
  }
}
