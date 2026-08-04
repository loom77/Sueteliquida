import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess } from './_circuitBreaker.js';
import { extractPdfText, PdfTextExtractionError } from './_pdfText.js';
import { HORSE_GAME_IDS } from '../src/horse/constants.js';
import {
  extractHorseDocumentLinks,
  HorseOfficialParseError,
  mergeHorseProgramAndResult,
  parseOfficialHorseProgramText,
  parseOfficialHorseResultHtml,
} from '../src/horse/officialHorseParser.js';

const DEFAULT_BASE = 'https://www.loteriasyapuestas.es';
const PROGRAM_PATHS = Object.freeze({
  lototurf: '/es/lototurf/programa-favoritos-y-retirados',
  'quintuple-plus': '/es/quintuple-plus/programa-favoritos-y-retirados',
});
const RESULT_PATHS = Object.freeze({
  lototurf: { file: 'lototurf.html', gameCode: 'LOTU' },
  'quintuple-plus': { file: 'quintuple.html', gameCode: 'QUPL' },
});
const WITHDRAWAL_PATH = '/es/lototurf/caballos-retirados';

export class HorseOfficialProviderError extends Error {
  constructor(message, { code = 'HORSE_PROVIDER_ERROR', status = 502, details = '', retryAfter = null } = {}) {
    super(message);
    this.name = 'HorseOfficialProviderError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

export function horseSelaeBase() {
  return String(process.env.SELAE_BASE_URL || DEFAULT_BASE).trim().replace(/\/$/, '');
}

function assertGame(gameId) {
  if (!HORSE_GAME_IDS.includes(gameId)) {
    throw new HorseOfficialProviderError('Juego hípico no válido.', { code: 'INVALID_HORSE_GAME', status: 400 });
  }
}

export function horseProgramPageUrl(gameId) {
  assertGame(gameId);
  const key = gameId === 'lototurf' ? 'LOTOTURF' : 'QUINTUPLE_PLUS';
  return String(process.env[`SELAE_${key}_PROGRAM_URL`] || `${horseSelaeBase()}${PROGRAM_PATHS[gameId]}`);
}

export function horseWithdrawalsPageUrl() {
  return String(process.env.SELAE_HORSE_WITHDRAWALS_URL || `${horseSelaeBase()}${WITHDRAWAL_PATH}`);
}

function compactDate(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new HorseOfficialProviderError('La fecha del resultado hípico no es válida.', { code: 'INVALID_HORSE_RESULT_DATE', status: 400 });
  }
  return text.replace(/-/g, '');
}

export function horseResultSourceUrl(gameId, roundDate) {
  assertGame(gameId);
  const source = RESULT_PATHS[gameId];
  const key = gameId === 'lototurf' ? 'LOTOTURF' : 'QUINTUPLE_PLUS';
  const template = String(process.env[`SELAE_${key}_RESULT_URL`] || '').trim();
  if (template) return template.replace('{date}', compactDate(roundDate)).replace('{dateKey}', roundDate);
  return `${horseSelaeBase()}/f/loterias/resultados/${source.file}?game_id=${source.gameCode}&fecha_sorteo=${compactDate(roundDate)}`;
}

async function fetchResponse(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    return await (options.fetchImpl || globalThis.fetch)(url, {
      method: 'GET',
      headers: {
        Accept: options.accept || 'text/html,application/xhtml+xml,application/pdf,text/plain',
        'Accept-Language': 'es-ES,es;q=0.9',
        'User-Agent': 'Primy/16.6 (+official horse data synchronization)',
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HorseOfficialProviderError('SELAE no ha respondido a tiempo.', { code: 'HORSE_PROVIDER_TIMEOUT', status: 504 });
    }
    throw new HorseOfficialProviderError('No se ha podido consultar la fuente hípica oficial.', {
      code: 'HORSE_PROVIDER_NETWORK_ERROR', details: String(error?.message || '').slice(0, 300),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, options = {}) {
  const response = await fetchResponse(url, options);
  if (!response.ok) {
    throw new HorseOfficialProviderError('SELAE no ha devuelto el documento hípico solicitado.', {
      code: response.status === 404 ? 'HORSE_DOCUMENT_NOT_PUBLISHED' : 'HORSE_PROVIDER_HTTP_ERROR',
      status: response.status === 404 ? 404 : 502,
      details: `HTTP ${response.status}`,
    });
  }
  return { response, text: await response.text() };
}

async function fetchPdfDocument(url, options = {}) {
  const response = await fetchResponse(url, { ...options, accept: 'application/pdf,application/octet-stream' });
  if (!response.ok) {
    throw new HorseOfficialProviderError('SELAE no ha devuelto el PDF hípico oficial.', {
      code: response.status === 404 ? 'HORSE_PDF_NOT_PUBLISHED' : 'HORSE_PROVIDER_HTTP_ERROR',
      status: response.status === 404 ? 404 : 502,
      details: `HTTP ${response.status}`,
    });
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  try {
    return { bytes, text: extractPdfText(bytes) };
  } catch (error) {
    if (error instanceof PdfTextExtractionError) {
      throw new HorseOfficialProviderError(error.message, { code: error.code, details: error.details });
    }
    throw error;
  }
}

function chooseDocument(documents, kind) {
  const candidates = documents.filter(document => document.kind === kind);
  return candidates.at(-1) || null;
}

async function discoverWithdrawals(options = {}) {
  if (options.withdrawalText) return { text: options.withdrawalText, url: options.withdrawalsUrl || '', document: null };
  const pageUrl = options.withdrawalsPageUrl || horseWithdrawalsPageUrl();
  try {
    const { text: pageHtml } = await fetchText(pageUrl, options);
    const documents = extractHorseDocumentLinks(pageHtml, pageUrl);
    const document = chooseDocument(documents, 'withdrawals');
    if (!document) return { text: '', url: '', document: null };
    const pdf = await fetchPdfDocument(document.url, options);
    return { text: pdf.text, url: document.url, document };
  } catch (error) {
    if (['HORSE_DOCUMENT_NOT_PUBLISHED', 'HORSE_PDF_NOT_PUBLISHED'].includes(error?.code)) return { text: '', url: '', document: null };
    if (options.requireWithdrawals) throw error;
    return { text: '', url: '', document: null };
  }
}

export async function fetchOfficialHorseProgram(gameId, options = {}) {
  assertGame(gameId);
  const circuit = `selae-horse-program-${gameId}`;
  assertCircuitClosed(circuit);
  try {
    const sourceUrl = options.sourceUrl || horseProgramPageUrl(gameId);
    let programText = options.programText || '';
    let programUrl = options.programUrl || '';
    let documents = Array.isArray(options.documents) ? [...options.documents] : [];

    if (!programText) {
      const { text: pageHtml } = await fetchText(sourceUrl, options);
      const discovered = extractHorseDocumentLinks(pageHtml, sourceUrl);
      documents.push(...discovered);
      const programDocument = chooseDocument(discovered, 'program');
      if (!programDocument) {
        throw new HorseOfficialProviderError('La página oficial no contiene un programa de carreras descargable.', {
          code: 'HORSE_PROGRAM_DOCUMENT_NOT_FOUND', status: 502,
        });
      }
      programUrl = programDocument.url;
      const pdf = await fetchPdfDocument(programUrl, options);
      programText = pdf.text;
    }

    const withdrawals = await discoverWithdrawals(options);
    if (withdrawals.document) documents.push(withdrawals.document);
    const round = parseOfficialHorseProgramText(programText, gameId, {
      sourceUrl,
      programUrl: programUrl || sourceUrl,
      withdrawalText: withdrawals.text,
      withdrawalsUrl: withdrawals.url,
      fetchedAt: options.fetchedAt || new Date().toISOString(),
      roundDate: options.roundDate,
      officialRoundNumber: options.officialRoundNumber,
      season: options.season,
      documents: documents.map(document => ({ ...document, fetchedAt: options.fetchedAt || new Date().toISOString() })),
      metadata: { provider: 'SELAE', documentDiscovery: !options.programText },
    });
    recordCircuitSuccess(circuit);
    return round;
  } catch (error) {
    recordCircuitFailure(circuit);
    if (error instanceof HorseOfficialProviderError) throw error;
    if (error instanceof HorseOfficialParseError) {
      throw new HorseOfficialProviderError(error.message, { code: error.code, status: 502, details: error.details });
    }
    throw new HorseOfficialProviderError('No se ha podido interpretar el programa hípico oficial.', {
      code: 'HORSE_PROGRAM_PROVIDER_ERROR', details: String(error?.message || '').slice(0, 300),
    });
  }
}

export async function fetchOfficialHorseResult(gameId, roundDate, options = {}) {
  assertGame(gameId);
  const circuit = `selae-horse-result-${gameId}`;
  assertCircuitClosed(circuit);
  const sourceUrl = options.sourceUrl || horseResultSourceUrl(gameId, roundDate);
  try {
    const html = options.resultHtml || (await fetchText(sourceUrl, options)).text;
    const result = parseOfficialHorseResultHtml(html, gameId, {
      sourceUrl,
      roundDate,
      fetchedAt: options.fetchedAt || new Date().toISOString(),
      officialRoundNumber: options.officialRoundNumber,
      season: options.season,
      races: options.races || [],
      metadata: { provider: 'SELAE' },
    });
    recordCircuitSuccess(circuit);
    return result;
  } catch (error) {
    recordCircuitFailure(circuit);
    if (error instanceof HorseOfficialProviderError) throw error;
    if (error instanceof HorseOfficialParseError) {
      throw new HorseOfficialProviderError(error.message, { code: error.code, status: 502, details: error.details });
    }
    throw new HorseOfficialProviderError('No se ha podido interpretar el resultado hípico oficial.', {
      code: 'HORSE_RESULT_PROVIDER_ERROR', details: String(error?.message || '').slice(0, 300),
    });
  }
}

export async function fetchOfficialHorseRound(gameId, options = {}) {
  const program = await fetchOfficialHorseProgram(gameId, options);
  if (options.includeResult === false || !program.roundDate) return program;
  const today = String(options.today || new Date().toISOString().slice(0, 10));
  if (program.roundDate > today) return program;
  try {
    const result = await fetchOfficialHorseResult(gameId, program.roundDate, {
      ...options,
      officialRoundNumber: program.officialRoundNumber,
      season: program.season,
      races: program.races,
    });
    return mergeHorseProgramAndResult(program, result);
  } catch (error) {
    if (['HORSE_DOCUMENT_NOT_PUBLISHED', 'HORSE_RESULT_INVALID'].includes(error?.code) || error?.status === 404) return program;
    if (options.requireResult) throw error;
    return program;
  }
}
