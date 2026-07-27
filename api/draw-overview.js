import { GAMES } from '../src/utils/gameConfig.js';
import { extractDrawItems, normalizeProviderDraw, providerRequest, ProviderError } from './_loteriasApi.js';
import { applyApiSecurity, rateLimit } from './_security.js';

function serializeError(error) {
  return { code: error?.code || 'OVERVIEW_ERROR', message: error?.message || 'Impossibile aggiornare i dati.' };
}

export default async function handler(req, res) {
  applyApiSecurity(res);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  if (!(await rateLimit(req, { limit: 40, windowMs: 60000 }))) return res.status(429).json({ success: false, code: 'LOCAL_RATE_LIMIT', message: 'Troppe richieste.' });
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', message: 'Metodo non consentito.' });
  }

  const key = process.env.LOTERIA_API_KEY;
  if (!key) return res.status(500).json({ success: false, code: 'KEY_NOT_CONFIGURED', message: 'LOTERIA_API_KEY non configurata su Vercel.' });

  const games = {};
  const errors = {};
  await Promise.all(Object.values(GAMES).map(async game => {
    try {
      const { payload, base } = await providerRequest(`/results/${game.apiSlug}/latest`, { key });
      const draw = extractDrawItems(payload).map(item => normalizeProviderDraw(item, game)).find(Boolean);
      if (!draw) throw new ProviderError(`Risposta ${game.name} non riconosciuta.`, { code: 'INVALID_PROVIDER_PAYLOAD' });
      games[game.id] = { latestDate: draw.date, jackpotNext: draw.jackpotNext, jackpotFormatted: draw.jackpotFormatted, updatedAt: draw.updatedAt, source: draw.source };
    } catch (error) {
      errors[game.id] = serializeError(error);
    }
  }));

  const available = Object.keys(games).length;
  return res.status(available ? 200 : 502).json({ success: available > 0, games, errors, partial: available > 0 && Object.keys(errors).length > 0, fetchedAt: new Date().toISOString() });
}
