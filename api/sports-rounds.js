import { applyApiSecurity, rateLimit, requestSearchParams, safeQuery } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import {
  readLatestSportsRound,
  readSportsRound,
  readSportsRoundRange,
  sportsRoundRepositoryStatus,
} from './_sportsRoundRepository.js';
import { SPORTS_GAME_IDS } from '../src/sports/constants.js';

function parseGame(value) {
  const gameId = safeQuery(value, 30).trim();
  return SPORTS_GAME_IDS.includes(gameId) ? gameId : '';
}

function dateKey(value) {
  const text = safeQuery(value, 10).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  const context = withRequestContext(req, res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Método no permitido.' });
  }
  if (!(await rateLimit(req, { limit: 30, windowMs: 60000, scope: 'sports-rounds' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas consultas seguidas.' });
  }
  const searchParams = requestSearchParams(req);
  const gameId = parseGame(searchParams.get('game'));
  if (!gameId) return res.status(400).json({ success: false, code: 'INVALID_SPORTS_GAME', message: 'Juego deportivo no válido.' });
  const roundId = safeQuery(searchParams.get('roundId'), 140).trim();
  const fromRaw = searchParams.get('from');
  const from = dateKey(fromRaw);
  const toRaw = searchParams.get('to');
  const to = dateKey(toRaw);
  if ((fromRaw && !from) || (toRaw && !to)) {
    return res.status(400).json({ success: false, code: 'INVALID_DATE_RANGE', message: 'El intervalo de jornadas no es válido.' });
  }
  try {
    const payload = roundId
      ? await readSportsRound(roundId)
      : (from || to)
        ? await readSportsRoundRange(gameId, from, to)
        : await readLatestSportsRound(gameId);
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      finishRequest(context, { endpoint: 'sports-rounds', status: 200, provider: 'SELAE', gameId, availability: 'updating' });
      return res.status(200).json({
        success: true,
        provider: 'SELAE',
        gameId,
        data: null,
        availability: {
          state: 'updating',
          operational: false,
          title: 'Jornada en actualización',
          message: 'Primy está esperando una composición oficial completa, identificada y abierta a la venta.',
          reasons: [],
        },
        repository: sportsRoundRepositoryStatus(),
      });
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    finishRequest(context, { endpoint: 'sports-rounds', status: 200, provider: 'SELAE', gameId });
    return res.status(200).json({ success: true, provider: 'SELAE', gameId, data: payload, repository: sportsRoundRepositoryStatus() });
  } catch (error) {
    logEvent('error', 'sports_rounds_failed', { requestId: context.requestId, gameId, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    return res.status(error?.status || 502).json({ success: false, code: error?.code || 'SPORTS_ARCHIVE_ERROR', message: error?.message || 'No se puede consultar el archivo deportivo.' });
  }
}
