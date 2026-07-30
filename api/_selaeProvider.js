import { createHash } from 'node:crypto';
import { assertCircuitClosed, recordCircuitFailure, recordCircuitSuccess } from './_circuitBreaker.js';

const DEFAULT_BASE = 'https://www.loteriasyapuestas.es';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = new Map([
  ['enero', 1], ['febrero', 2], ['marzo', 3], ['abril', 4], ['mayo', 5], ['junio', 6],
  ['julio', 7], ['agosto', 8], ['septiembre', 9], ['setiembre', 9], ['octubre', 10],
  ['noviembre', 11], ['diciembre', 12],
]);

const SOURCES = {
  euromillones: {
    file: 'euromillones.html',
    codes: ['EMIL'],
    label: 'Euromillones',
  },
  primitiva: {
    file: 'primitiva.html',
    codes: ['LAPR'],
    label: 'La Primitiva',
  },
  eurodreams: {
    file: 'eurodreams.html',
    // EDMS is documented on the current Spanish SELAE page. EUDR remains as a
    // compatibility fallback because older/localised pages have published it.
    codes: ['EDMS', 'EUDR'],
    label: 'EuroDreams',
  },
};

export class ProviderError extends Error {
  constructor(message, {
    code = 'PROVIDER_ERROR',
    status = 502,
    providerStatus = null,
    details = '',
    retryAfter = null,
    endpoint = '',
  } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
    this.providerStatus = providerStatus;
    this.details = details;
    this.retryAfter = retryAfter;
    this.endpoint = endpoint;
  }
}

export function selaeBase() {
  return String(process.env.SELAE_BASE_URL || DEFAULT_BASE).trim().replace(/\/$/, '');
}

function safeText(value, max = 500) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function decodeEntities(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
    ntilde: 'ñ', Ntilde: 'Ñ', euro: '€',
  };
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (entity, name) => named[name] ?? entity);
}

export function htmlToText(html) {
  return decodeEntities(String(html || ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<img\b[^>]*(?:alt|title)=["']([^"']+)["'][^>]*>/gi, ' $1 ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|td|th|section|article|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\t\r ]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function compactDate(date) {
  const value = String(date || '').trim();
  if (!ISO_DATE.test(value)) return '';
  return value.replaceAll('-', '');
}

function isoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function extractOfficialDate(text, requestedDate = '') {
  const source = String(text || '');
  const iso = source.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) return isoDate(iso[1], iso[2], iso[3]);

  const european = source.match(/\b(0?[1-9]|[12]\d|3[01])[\/-](0?[1-9]|1[0-2])[\/-](20\d{2})\b/);
  if (european) return isoDate(european[3], european[2], european[1]);

  const spanish = source.toLowerCase().match(/\b(0?[1-9]|[12]\d|3[01])\s+de\s+([a-záéíóúñ]+)\s+de\s+(20\d{2})\b/i);
  if (spanish) {
    const normalizedMonth = spanish[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const month = MONTHS.get(normalizedMonth);
    if (month) return isoDate(spanish[3], month, spanish[1]);
  }
  return ISO_DATE.test(requestedDate) ? requestedDate : '';
}

function numberList(value, min, max) {
  const numbers = String(value || '').match(/\b\d{1,2}\b/g) || [];
  return numbers.map(Number).filter(number => number >= min && number <= max);
}

function uniqueFirst(numbers, count) {
  const seen = new Set();
  const output = [];
  for (const number of numbers) {
    if (seen.has(number)) continue;
    seen.add(number);
    output.push(number);
    if (output.length === count) break;
  }
  return output;
}

function labelledSegment(text) {
  const source = String(text || '');
  const lower = source.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const labels = ['combinacion ganadora', 'numeros ganadores', 'resultado del sorteo', 'resultados ultimo sorteo'];
  let start = -1;
  for (const label of labels) {
    const index = lower.indexOf(label);
    if (index >= 0) {
      start = index + label.length;
      break;
    }
  }
  if (start < 0) return '';
  const tail = lower.slice(start);
  const endings = ['complementario', 'reintegro', 'sueno', 'joker', 'categoria', 'premios', 'escrutinio'];
  let end = Math.min(tail.length, 1000);
  for (const ending of endings) {
    const index = tail.indexOf(ending);
    if (index >= 0) end = Math.min(end, index);
  }
  return source.slice(start, start + end);
}

function structuralBallNumbers(html, max) {
  const output = [];
  const source = String(html || '');
  const elementPattern = /<(?:li|span|div|td|strong|b)[^>]*(?:class|id)=["'][^"']*(?:bola|ball|numero|number|combinacion|resultado)[^"']*["'][^>]*>([\s\S]*?)<\/(?:li|span|div|td|strong|b)>/gi;
  let match;
  while ((match = elementPattern.exec(source))) {
    const values = numberList(htmlToText(match[1]), 1, max);
    if (values.length === 1) output.push(values[0]);
  }

  const imagePattern = /<img\b([^>]*(?:bola|ball|numero|number)[^>]*)>/gi;
  while ((match = imagePattern.exec(source))) {
    const attributes = match[1];
    const explicit = attributes.match(/(?:alt|title|data-(?:numero|number|value))=["'][^\d]*(\d{1,2})[^"']*["']/i);
    const src = attributes.match(/src=["'][^"']*?(\d{1,2})(?:\.[a-z]+|[\/_-])[^"']*["']/i);
    const value = Number(explicit?.[1] || src?.[1]);
    if (value >= 1 && value <= max) output.push(value);
  }
  return output;
}

export function extractWinningNumbers(html, text, game) {
  const embedded = String(html || '').match(/(?:combinaci[oó]n|winning[_-]?numbers|numbers)\s*["']?\s*[:=]\s*\[([^\]]+)\]/i);
  if (embedded) {
    const values = uniqueFirst(numberList(embedded[1], 1, game.numberPoolMax), game.numbersToPick);
    if (values.length === game.numbersToPick) return values.sort((a, b) => a - b);
  }

  const segment = labelledSegment(text);
  const fromLabel = uniqueFirst(numberList(segment, 1, game.numberPoolMax), game.numbersToPick);
  if (fromLabel.length === game.numbersToPick) return fromLabel.sort((a, b) => a - b);

  const structural = uniqueFirst(structuralBallNumbers(html, game.numberPoolMax), game.numbersToPick);
  if (structural.length === game.numbersToPick) return structural.sort((a, b) => a - b);

  const normalized = String(text || '').replace(/\s+/g, ' ');
  const sequencePattern = /(?:^|[^\d])((?:\d{1,2}\s*(?:[-–—|,;]\s*|\s+)){5}\d{1,2})(?=$|[^\d])/g;
  let match;
  while ((match = sequencePattern.exec(normalized))) {
    const candidate = uniqueFirst(numberList(match[1], 1, game.numberPoolMax), game.numbersToPick);
    if (candidate.length === game.numbersToPick) return candidate.sort((a, b) => a - b);
  }
  return [];
}

function extractLabelNumber(text, labels, min, max, html = '') {
  const source = String(text || '');
  const raw = String(html || '');
  for (const label of labels) {
    const pattern = new RegExp(`${label}[^0-9]{0,45}(?:[A-Z]\\s*\\()?([0-9]{1,2})`, 'i');
    let value = Number(source.match(pattern)?.[1]);
    if (Number.isInteger(value) && value >= min && value <= max) return value;

    const jsonPattern = new RegExp(`[\"']?(?:${label})[\"']?\\s*[:=]\\s*[\"']?([0-9]{1,2})`, 'i');
    value = Number(raw.match(jsonPattern)?.[1]);
    if (Number.isInteger(value) && value >= min && value <= max) return value;

    const labelIndex = raw.toLowerCase().search(new RegExp(label, 'i'));
    if (labelIndex >= 0) {
      const nearby = raw.slice(labelIndex, labelIndex + 500);
      const attribute = nearby.match(/(?:data-(?:value|numero|number)|alt|title)=["'][^0-9]{0,20}([0-9]{1,2})[^"']*["']/i)
        || nearby.match(/src=["'][^"']*?(?:bola|ball|numero|number)[^"']*?([0-9]{1,2})[^"']*["']/i);
      value = Number(attribute?.[1]);
      if (Number.isInteger(value) && value >= min && value <= max) return value;
    }
  }
  return null;
}


function extractLabelNumbers(text, labels, min, max, count, html = '') {
  const source = String(text || '');
  const raw = String(html || '');
  for (const label of labels) {
    const pattern = new RegExp(`${label}[^0-9]{0,80}((?:[0-9]{1,2}[^0-9]+){${Math.max(0, count - 1)}}[0-9]{1,2})`, 'i');
    const match = source.match(pattern);
    if (match) {
      const values = uniqueFirst(numberList(match[1], min, max), count);
      if (values.length === count) return values.sort((left, right) => left - right);
    }

    const jsonPattern = new RegExp(`["']?(?:${label})["']?\\s*[:=]\\s*\\[([^\\]]+)\\]`, 'i');
    const jsonMatch = raw.match(jsonPattern);
    if (jsonMatch) {
      const values = uniqueFirst(numberList(jsonMatch[1], min, max), count);
      if (values.length === count) return values.sort((left, right) => left - right);
    }

    const index = source.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').search(new RegExp(label, 'i'));
    if (index >= 0) {
      const values = uniqueFirst(numberList(source.slice(index, index + 240), min, max), count);
      if (values.length === count) return values.sort((left, right) => left - right);
    }
  }
  return [];
}

function parseEuropeanAmount(value) {
  const normalized = String(value || '').replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function extractJackpot(text) {
  const source = String(text || '');
  const match = source.match(/(?:bote|pr[oó]ximo\s+sorteo)[^€\d]{0,100}([\d.]+(?:,\d{1,2})?)\s*€/i);
  if (!match) return { jackpotNext: null, jackpotFormatted: '' };
  return { jackpotNext: parseEuropeanAmount(match[1]), jackpotFormatted: `${match[1]} €` };
}

function extractPrizeRows(html) {
  const rows = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowPattern.exec(String(html || '')))) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell => safeText(htmlToText(cell[1]), 120));
    if (cells.length < 2) continue;
    const amountCell = cells.find(cell => /\d[\d.,]*\s*€/.test(cell));
    if (!amountCell) continue;
    const amount = parseEuropeanAmount(amountCell.match(/([\d.]+(?:,\d{1,2})?)/)?.[1]);
    const category = cells.find(cell => cell !== amountCell && /(?:categor|acierto|reintegro|n[uú]mero)/i.test(cell)) || cells[0];
    if (category && amount != null) rows.push({ category, amount, prize: amount });
  }
  return rows.slice(0, 20);
}

export function parseSelaeHtml(html, game, { requestedDate = '', endpoint = '' } = {}) {
  const raw = String(html || '');
  const text = htmlToText(raw);
  if (!text || text.length < 20) {
    throw new ProviderError('SELAE ha devuelto una respuesta vacía.', {
      code: 'INVALID_PROVIDER_PAYLOAD', status: 502, endpoint,
    });
  }

  const date = extractOfficialDate(text, requestedDate);
  const winningNumbers = extractWinningNumbers(raw, text, game);
  if (!date || winningNumbers.length !== game.numbersToPick) {
    const unavailable = /(?:no\s+hay\s+resultados|sin\s+resultados|sorteo\s+no\s+celebrado|resultados\s+no\s+disponibles)/i.test(text);
    throw new ProviderError(
      unavailable ? 'El resultado oficial todavía no está disponible.' : `No se ha podido interpretar el resultado oficial de ${game.name}.`,
      { code: unavailable ? 'DRAW_NOT_AVAILABLE' : 'INVALID_PROVIDER_PAYLOAD', status: unavailable ? 404 : 502, endpoint, details: safeText(text) },
    );
  }

  if (requestedDate && date !== requestedDate) {
    throw new ProviderError('SELAE ha devuelto un sorteo distinto al solicitado.', {
      code: 'DRAW_DATE_MISMATCH', status: 502, endpoint, details: `Solicitado ${requestedDate}; recibido ${date}`,
    });
  }

  const secondaryNumbers = game.secondary
    ? extractLabelNumbers(text, ['estrellas?', 'stars?'], game.secondary.min, game.secondary.max, game.secondary.count, raw)
    : [];
  const extra = game.id === 'eurodreams'
    ? extractLabelNumber(text, ['sue(?:ñ|n)o'], game.extra.min, game.extra.max, raw)
    : game.extra ? extractLabelNumber(text, ['reintegro'], game.extra.min, game.extra.max, raw) : null;
  const complementary = game.hasComplementary
    ? extractLabelNumber(text, ['complementario'], 1, game.numberPoolMax, raw)
    : null;

  if ((game.secondary && secondaryNumbers.length !== game.secondary.count) || (!game.secondary && extra == null) || (game.hasComplementary && complementary == null)) {
    throw new ProviderError(`El resultado oficial de ${game.name} está incompleto.`, {
      code: 'INVALID_PROVIDER_PAYLOAD', status: 502, endpoint, details: safeText(text),
    });
  }

  const jackpot = extractJackpot(text);
  const sourceHash = createHash('sha256').update(raw).digest('hex');
  return {
    date,
    winningNumbers,
    extra,
    secondaryNumbers,
    complementary,
    prizes: extractPrizeRows(raw),
    jackpotNext: jackpot.jackpotNext,
    jackpotFormatted: jackpot.jackpotFormatted,
    source: 'SELAE oficial',
    sourceUrl: endpoint,
    sourceHash,
    updatedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    drawId: `${game.id}:${date}`,
  };
}

function mapHttpError(response, endpoint) {
  const retryAfter = response.headers?.get?.('retry-after') || null;
  if (response.status === 404) {
    return new ProviderError('El resultado oficial todavía no está disponible.', {
      code: 'DRAW_NOT_AVAILABLE', status: 404, providerStatus: 404, endpoint,
    });
  }
  if (response.status === 429) {
    return new ProviderError('SELAE ha limitado temporalmente las consultas.', {
      code: 'RATE_LIMITED', status: 429, providerStatus: 429, retryAfter, endpoint,
    });
  }
  if (response.status >= 500) {
    return new ProviderError('SELAE no está disponible temporalmente.', {
      code: 'PROVIDER_UNAVAILABLE', status: 502, providerStatus: response.status, endpoint,
    });
  }
  return new ProviderError(`SELAE ha respondido con HTTP ${response.status}.`, {
    code: 'PROVIDER_REJECTED', status: 502, providerStatus: response.status, endpoint,
  });
}

export function selaeResultUrl(game, date = '', code = '') {
  const source = SOURCES[game?.id];
  if (!source) throw new ProviderError('Juego no compatible con SELAE.', { code: 'INVALID_GAME', status: 400 });
  const params = new URLSearchParams({ game_id: code || source.codes[0] });
  const compact = compactDate(date);
  if (compact) params.set('fecha_sorteo', compact);
  return `${selaeBase()}/f/loterias/resultados/${source.file}?${params}`;
}

async function requestHtml(endpoint, { timeoutMs = 12000, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new ProviderError('El entorno no admite fetch.', { code: 'FETCH_UNAVAILABLE', status: 500 });
  const circuitName = `selae:${selaeBase()}`;
  try {
    assertCircuitClosed(circuitName);
  } catch (error) {
    throw new ProviderError(error.message, { code: 'CIRCUIT_OPEN', status: 503, retryAfter: String(error.retryAfter || 30), endpoint });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        'User-Agent': 'Primy/15.3 (+https://sueteliquida.vercel.app; official-results-sync)',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!response.ok) throw mapHttpError(response, endpoint);
    const html = await response.text();
    recordCircuitSuccess(circuitName);
    return html;
  } catch (error) {
    if (error?.name === 'AbortError') {
      recordCircuitFailure(circuitName);
      throw new ProviderError('SELAE no ha respondido dentro del tiempo previsto.', { code: 'PROVIDER_TIMEOUT', status: 504, endpoint });
    }
    if (error instanceof ProviderError) {
      if (!['DRAW_NOT_AVAILABLE', 'RATE_LIMITED'].includes(error.code)) recordCircuitFailure(circuitName);
      throw error;
    }
    recordCircuitFailure(circuitName);
    throw new ProviderError('No se puede conectar con SELAE.', {
      code: 'NETWORK_ERROR', status: 502, endpoint, details: safeText(error?.message || ''),
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOfficialDraw({
  game,
  date = '',
  timeoutMs = 12000,
  fetchImpl = globalThis.fetch,
} = {}) {
  const source = SOURCES[game?.id];
  if (!source) throw new ProviderError('Juego no compatible con SELAE.', { code: 'INVALID_GAME', status: 400 });
  let lastError = null;
  for (const code of source.codes) {
    const endpoint = selaeResultUrl(game, date, code);
    try {
      const html = await requestHtml(endpoint, { timeoutMs, fetchImpl });
      return parseSelaeHtml(html, game, { requestedDate: date, endpoint });
    } catch (error) {
      lastError = error;
      if (!['DRAW_NOT_AVAILABLE', 'INVALID_PROVIDER_PAYLOAD', 'DRAW_DATE_MISMATCH'].includes(error?.code)) throw error;
    }
  }
  throw lastError || new ProviderError('Resultado oficial no disponible.', { code: 'DRAW_NOT_AVAILABLE', status: 404 });
}

function madridDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).reduce((output, part) => ({ ...output, [part.type]: part.value }), {});
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

export function candidateDrawDates(game, { now = new Date(), count = 8 } = {}) {
  const parts = madridDateParts(now);
  const cursor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  const output = [];
  for (let inspected = 0; inspected < 40 && output.length < count; inspected += 1) {
    if (game.drawDays.includes(cursor.getUTCDay())) output.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return output;
}

export function drawDatesInRange(game, from, to) {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return [];
  const cursor = new Date(`${from}T12:00:00.000Z`);
  const end = new Date(`${to}T12:00:00.000Z`);
  const output = [];
  while (cursor <= end) {
    if (game.drawDays.includes(cursor.getUTCDay())) output.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return output;
}

export async function fetchLatestOfficialDraw({ game, timeoutMs = 12000, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  // The undated official file is the cheapest path and normally contains the
  // latest result. If its date cannot be interpreted, bounded date probes keep
  // the integration deterministic without a commercial API.
  try {
    return await fetchOfficialDraw({ game, timeoutMs, fetchImpl });
  } catch (error) {
    if (!['INVALID_PROVIDER_PAYLOAD', 'DRAW_NOT_AVAILABLE'].includes(error?.code)) throw error;
  }

  let lastError = null;
  for (const date of candidateDrawDates(game, { now, count: 8 })) {
    try {
      return await fetchOfficialDraw({ game, date, timeoutMs, fetchImpl });
    } catch (error) {
      lastError = error;
      if (!['DRAW_NOT_AVAILABLE', 'INVALID_PROVIDER_PAYLOAD', 'DRAW_DATE_MISMATCH'].includes(error?.code)) throw error;
    }
  }
  throw lastError || new ProviderError('No hay resultados oficiales disponibles.', { code: 'DRAW_NOT_AVAILABLE', status: 404 });
}
