import { applyApiSecurity, rateLimit, requestSearchParams, safeQuery } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import { fetchOfficialHorseRound } from './_horseOfficialProvider.js';
import { upsertHorseRounds } from './_horseRoundRepository.js';
import { HORSE_GAME_IDS } from '../src/horse/constants.js';

function isAuthorized(req) {
  const secret = String(process.env.CRON_SECRET || '').trim();
  if (!secret) return true;
  const authorization = String(req.headers?.authorization || '');
  const headerSecret = String(req.headers?.['x-cron-secret'] || '');
  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

function requestedGames(req) {
  const candidate = safeQuery(requestSearchParams(req).get('game'), 40).trim();
  return candidate && HORSE_GAME_IDS.includes(candidate) ? [candidate] : [...HORSE_GAME_IDS];
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  if (!isAuthorized(req)) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Sincronización no autorizada.' });
  if (!(await rateLimit(req, { limit: 4, windowMs: 60 * 60 * 1000, scope: 'sync-horse-rounds' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'La sincronización hípica ya se ha solicitado recientemente.' });
  }

  const results = [];
  const errors = [];
  for (const gameId of requestedGames(req)) {
    try {
      const round = await fetchOfficialHorseRound(gameId, { includeResult: true });
      const stored = await upsertHorseRounds([round]);
      results.push({
        gameId,
        roundId: round.roundId,
        roundDate: round.roundDate,
        status: round.status,
        races: round.races.length,
        runners: round.races.reduce((total, race) => total + race.runners.length, 0),
        resultAvailable: Boolean(round.result?.valid),
        revision: stored.rounds[0]?.revision || round.revision,
        persisted: stored.persisted,
        sourceHash: round.sourceHash,
      });
    } catch (error) {
      errors.push({ gameId, code: error?.code || 'HORSE_SYNC_ERROR', message: String(error?.message || '').slice(0, 300) });
    }
  }
  const success = results.length > 0 && errors.length === 0;
  const status = success ? 200 : results.length ? 207 : 502;
  finishRequest(context, { endpoint: 'sync-horse-rounds', status, provider: 'SELAE' });
  if (errors.length) logEvent('error', 'sync_horse_rounds_partial', { requestId: context.requestId, errors });
  return res.status(status).json({ success, provider: 'SELAE', syncedAt: new Date().toISOString(), results, errors });
}
