import { applyApiSecurity, rateLimit, safeQuery } from './_security.js';
import { finishRequest, logEvent, withRequestContext } from './_observability.js';
import {
  horseRoundRepositoryStatus,
  readHorseRound,
  readHorseRoundRange,
  readLatestHorseRound,
} from './_horseRoundRepository.js';
import { HORSE_GAME_IDS } from '../src/horse/constants.js';

function parseGame(value) {
  const gameId = safeQuery(value, 40).trim();
  return HORSE_GAME_IDS.includes(gameId) ? gameId : '';
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
  if (!(await rateLimit(req, { limit: 30, windowMs: 60000, scope: 'horse-rounds' }))) {
    return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Demasiadas consultas seguidas.' });
  }
  const gameId = parseGame(req.query?.game);
  if (!gameId) return res.status(400).json({ success: false, code: 'INVALID_HORSE_GAME', message: 'Juego hípico no válido.' });
  const roundId = safeQuery(req.query?.roundId, 160).trim();
  const from = dateKey(req.query?.from);
  const to = dateKey(req.query?.to);
  if ((req.query?.from && !from) || (req.query?.to && !to)) {
    return res.status(400).json({ success: false, code: 'INVALID_DATE_RANGE', message: 'El intervalo de jornadas no es válido.' });
  }
  try {
    const payload = roundId
      ? await readHorseRound(roundId)
      : (from || to)
        ? await readHorseRoundRange(gameId, from, to)
        : await readLatestHorseRound(gameId);
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      finishRequest(context, { endpoint: 'horse-rounds', status: 200, provider: 'SELAE', gameId, availability: 'no-active-round' });
      return res.status(200).json({
        success: true,
        provider: 'SELAE',
        gameId,
        data: null,
        availability: {
          state: 'no-active-round',
          operational: false,
          title: 'Sin jornada hípica activa',
          message: 'SELAE todavía no ha publicado un programa oficial descargable para la jornada en curso.',
          reasons: [],
        },
        repository: horseRoundRepositoryStatus(),
      });
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    finishRequest(context, { endpoint: 'horse-rounds', status: 200, provider: 'SELAE', gameId });
    return res.status(200).json({ success: true, provider: 'SELAE', gameId, data: payload, repository: horseRoundRepositoryStatus() });
  } catch (error) {
    logEvent('error', 'horse_rounds_failed', { requestId: context.requestId, gameId, code: error?.code || 'UNKNOWN', message: error?.message || '' });
    return res.status(error?.status || 502).json({ success: false, code: error?.code || 'HORSE_ARCHIVE_ERROR', message: error?.message || 'No se puede consultar el archivo hípico.' });
  }
}
