import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess } from './_circuitBreaker.js';
import { SPORTS_GAME_IDS } from '../src/sports/constants.js';
import { parseOfficialSportsRoundHtml, SportsRoundParseError } from '../src/sports/officialRoundParser.js';

const DEFAULT_BASE = 'https://www.loteriasyapuestas.es';
const PATHS = Object.freeze({
  quiniela: '/es/resultados/quiniela/comprobar',
  quinigol: '/es/resultados/quinigol/comprobar',
});

export class SportsOfficialProviderError extends Error {
  constructor(message, { code = 'SPORTS_PROVIDER_ERROR', status = 502, details = '', retryAfter = null } = {}) {
    super(message);
    this.name = 'SportsOfficialProviderError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export function sportsSelaeBase() {
  return String(process.env.SELAE_BASE_URL || DEFAULT_BASE).trim().replace(/\/$/, '');
}

export function sportsRoundSourceUrl(gameId) {
  if (!SPORTS_GAME_IDS.includes(gameId)) throw new SportsOfficialProviderError('Juego deportivo no válido.', { code: 'INVALID_SPORTS_GAME', status: 400 });
  const override = process.env[`SELAE_${gameId.toUpperCase()}_ROUND_URL`];
  return String(override || `${sportsSelaeBase()}${PATHS[gameId]}`);
}

export async function fetchOfficialSportsRound(gameId, options = {}) {
  if (!SPORTS_GAME_IDS.includes(gameId)) throw new SportsOfficialProviderError('Juego deportivo no válido.', { code: 'INVALID_SPORTS_GAME', status: 400 });
  const circuit = `selae-sports-${gameId}`;
  assertCircuitClosed(circuit);
  const endpoint = options.sourceUrl || sportsRoundSourceUrl(gameId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  try {
    const response = await (options.fetchImpl || globalThis.fetch)(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
        'User-Agent': 'Primy/15.8 (+official sports round synchronization)',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new SportsOfficialProviderError('SELAE no ha devuelto la jornada deportiva.', {
        code: response.status === 404 ? 'SPORTS_ROUND_NOT_PUBLISHED' : 'SPORTS_PROVIDER_HTTP_ERROR',
        status: response.status === 404 ? 404 : 502,
        details: `HTTP ${response.status}`,
      });
    }
    const contentType = String(response.headers.get('content-type') || '');
    if (contentType && !/html|text/i.test(contentType)) {
      throw new SportsOfficialProviderError('La fuente oficial ha devuelto un formato inesperado.', { code: 'SPORTS_PROVIDER_CONTENT_TYPE', details: contentType });
    }
    const html = await response.text();
    const round = parseOfficialSportsRoundHtml(html, gameId, {
      sourceUrl: endpoint,
      fetchedAt: options.fetchedAt || new Date().toISOString(),
      roundDate: options.roundDate,
      season: options.season,
      officialRoundNumber: options.officialRoundNumber,
      salesOpenAt: options.salesOpenAt,
      salesCloseAt: options.salesCloseAt,
      metadata: { provider: 'SELAE', requestedMode: 'current-composition' },
    });
    recordCircuitSuccess(circuit);
    return round;
  } catch (error) {
    recordCircuitFailure(circuit);
    if (error?.name === 'AbortError') throw new SportsOfficialProviderError('SELAE no ha respondido a tiempo.', { code: 'SPORTS_PROVIDER_TIMEOUT', status: 504 });
    if (error instanceof SportsOfficialProviderError) throw error;
    if (error instanceof SportsRoundParseError) throw new SportsOfficialProviderError(error.message, { code: error.code, status: 502, details: error.details });
    throw new SportsOfficialProviderError('No se ha podido consultar la composición oficial.', { code: 'SPORTS_PROVIDER_NETWORK_ERROR', details: String(error?.message || '').slice(0, 300) });
  } finally { clearTimeout(timer); }
}
