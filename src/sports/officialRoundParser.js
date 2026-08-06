import {
  QUINIELA_MATCH_COUNT,
  QUINIGOL_MATCH_COUNT,
  SPORTS_GAME_IDS,
} from './constants.js';
import { goalBucket, quinielaSymbolFromScore } from './goalModel.js';
import { sanitizeSportsRound, sportsRoundFingerprint } from './roundModel.js';

const MONTHS = Object.freeze({
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
});

const EXPECTED_MATCHES = Object.freeze({
  quiniela: QUINIELA_MATCH_COUNT,
  quinigol: QUINIGOL_MATCH_COUNT,
});

export class SportsRoundParseError extends Error {
  constructor(message, { code = 'SPORTS_ROUND_PARSE_ERROR', details = '' } = {}) {
    super(message);
    this.name = 'SportsRoundParseError';
    this.code = code;
    this.details = details;
  }
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ');
}

function cleanText(value, max = 180) {
  return decodeEntities(String(value || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function htmlToLines(html) {
  return decodeEntities(String(html || ''))
    .replace(/<script\b[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|tr|td|th|div|section|article|h[1-6]|option)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function isoDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return '';
  const key = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  return key === `${year}-${pad(month)}-${pad(day)}` ? key : '';
}

export function extractOfficialSportsDate(value) {
  const text = cleanText(value, 10000).toLocaleLowerCase('es-ES');
  let match = text.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);
  if (match) return isoDate(match[1], match[2], match[3]);
  match = text.match(/\b([0-3]?\d)[\/]([01]?\d)[\/](20\d{2})\b/);
  if (match) return isoDate(match[3], match[2], match[1]);
  match = text.match(/\b([0-3]?\d)\s+de\s+([a-záéíóúñ]+)\s+de\s+(20\d{2})\b/i);
  if (match) {
    const month = MONTHS[match[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    if (month) return isoDate(match[3], month, match[1]);
  }
  return '';
}

function extractRoundMetadata(text) {
  const normalized = cleanText(text, 20000);
  const match = normalized.match(/jornada\s+(\d{1,3})(?:\s*[ªa])?(?:\s+de\s+la\s+temporada\s+(20\d{2}\s*[-/]\s*20\d{2}))?/i);
  return {
    officialRoundNumber: match?.[1] || '',
    season: match?.[2]?.replace(/\s+/g, '').replace('/', '-') || '',
  };
}

function parsePosition(value) {
  const text = cleanText(value, 30).replace(/^p\s*[-.]?\s*15/i, '15');
  const match = text.match(/^(\d{1,2})(?:\s*[.)ªa:-])?$/i) || text.match(/^(\d{1,2})\s*[.)ªa:-]/i);
  const position = Number(match?.[1]);
  return Number.isInteger(position) && position > 0 && position <= 15 ? position : null;
}

function parseScore(value) {
  const text = cleanText(value, 80).toUpperCase();
  const numeric = text.match(/(?:^|\s)(\d{1,2})\s*[-–—:]\s*(\d{1,2})(?:\s|$)/);
  if (numeric) {
    return {
      officialScore: { home: Number(numeric[1]), away: Number(numeric[2]) },
      status: 'finished',
      officialBucketScore: `${goalBucket(Number(numeric[1]))}-${goalBucket(Number(numeric[2]))}`,
    };
  }
  const excluded = text.match(/(?:^|\s)(?:A|S)\s*[-–—:]\s*(?:A|S)(?:\s|$)/);
  if (excluded) return { officialScore: null, status: 'excluded', officialBucketScore: 'A-A' };
  return { officialScore: null, status: 'scheduled', officialBucketScore: '' };
}

function cleanTeam(value) {
  return cleanText(value, 120)
    .replace(/^\d{1,2}\s*[.)ªa:-]\s*/, '')
    .replace(/\s+(?:[012XM]\s+){3,}[012XM]?\s*$/i, '')
    .replace(/\s+(?:\d{1,2}|[012XM])\s*[-–—:]\s*(?:\d{1,2}|[012XMA])(?:\s+[12X])?\s*$/i, '')
    .trim();
}

function matchFromCells(cells) {
  if (cells.length < 3) return null;
  const position = parsePosition(cells[0]);
  if (!position) return null;
  const homeTeam = cleanTeam(cells[1]);
  const awayTeam = cleanTeam(cells[2]);
  if (!homeTeam || !awayTeam || /^\d+$/.test(homeTeam) || /^\d+$/.test(awayTeam)) return null;
  const score = parseScore(cells.slice(3).join(' '));
  return { position, homeTeam, awayTeam, ...score };
}

function extractTableMatches(html) {
  const matches = [];
  for (const rowMatch of String(html || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map(match => cleanText(match[1]));
    const parsed = matchFromCells(cells);
    if (parsed) matches.push(parsed);
  }
  return matches;
}

function parseInlineMatch(value) {
  const text = cleanText(value, 500);
  const prefix = text.match(/^\s*(?:P\s*[-.]?\s*)?(\d{1,2})\s*[.)ªa:-]?\s*(.+)$/i);
  if (!prefix) return null;
  const position = Number(prefix[1]);
  if (!Number.isInteger(position) || position < 1 || position > 15) return null;
  const rest = prefix[2];
  const pair = rest.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!pair) return null;
  const homeTeam = cleanTeam(pair[1]);
  let awayAndTail = pair[2];
  const score = parseScore(awayAndTail);
  awayAndTail = awayAndTail
    .replace(/\s+(?:\d{1,2}|[AS])\s*[-–—:]\s*(?:\d{1,2}|[AS])(?:\s+[12X])?\s*$/i, '')
    .replace(/\s+(?:[012XM]\s+){4,}.*$/i, '');
  const awayTeam = cleanTeam(awayAndTail);
  if (!homeTeam || !awayTeam || /^\d+$/.test(homeTeam) || /^\d+$/.test(awayTeam)) return null;
  return { position, homeTeam, awayTeam, ...score };
}

function extractInlineMatches(html) {
  const matches = [];
  const lines = htmlToLines(html);
  const chunks = [
    ...String(html || '').matchAll(/<(?:li|p|article|section|div)\b[^>]*>([\s\S]*?)<\/(?:li|p|article|section|div)>/gi),
  ].map(match => cleanText(match[1], 500));
  chunks.push(...lines);

  // SELAE sometimes renders the position and the team pair in adjacent nodes:
  // "1." followed by "Equipo A - Equipo B". Join only those precise pairs.
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (parsePosition(lines[index]) && /\s[-–—]\s/.test(lines[index + 1])) {
      chunks.push(`${lines[index]} ${lines[index + 1]}`);
    }
  }

  for (const chunk of chunks) {
    const parsed = parseInlineMatch(chunk);
    if (parsed) matches.push(parsed);
  }
  return matches;
}

function dedupeMatches(matches, expectedMatches) {
  const byPosition = new Map();
  for (const match of matches) {
    if (match.position > expectedMatches) continue;
    const existing = byPosition.get(match.position);
    if (!existing || (match.officialScore && !existing.officialScore)) byPosition.set(match.position, match);
  }
  return [...byPosition.values()].sort((left, right) => left.position - right.position);
}

function textHash(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `selae-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseMoney(value) {
  const normalized = String(value || '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePrizeLabel(value) {
  return cleanText(value, 200)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseOfficialSportsPrizeCategories(value) {
  const lines = Array.isArray(value) ? value : htmlToLines(value);
  const categories = [];
  for (const line of lines) {
    const cleaned = cleanText(line, 600);
    const match = cleaned.match(/^((?:Pleno\s+al\s+15|Especial|Elige\s*8|\d+\s*[ªa](?:\s*\([^)]*\))?).*?)\s+(\d[\d.]*)\s+([\d.]+,\d{2})\s*€?$/i);
    if (!match) continue;
    const prize = parseMoney(match[3]);
    if (prize == null) continue;
    categories.push({
      category: cleanText(match[1], 180),
      winners: Number(match[2].replace(/\./g, '')),
      prize,
    });
  }
  return categories.filter((category, index, all) => all.findIndex(item => normalizePrizeLabel(item.category) === normalizePrizeLabel(category.category)) === index);
}

function inferRoundStatus(matches) {
  if (matches.length && matches.every(match => ['finished', 'excluded'].includes(match.status))) return 'official';
  if (matches.some(match => ['finished', 'excluded', 'live'].includes(match.status))) return 'provisional';
  return 'published';
}

function enrichOfficialOutcomes(gameId, matches) {
  return matches.map(match => {
    if (!match.officialScore) return match;
    const { home, away } = match.officialScore;
    return {
      ...match,
      metadata: {
        officialBucketScore: match.officialBucketScore,
        officialOutcome: gameId === 'quiniela' && match.position <= 14
          ? quinielaSymbolFromScore(home, away)
          : match.officialBucketScore,
      },
    };
  });
}

export function parseOfficialSportsRoundHtml(html, gameId, options = {}) {
  if (!SPORTS_GAME_IDS.includes(gameId)) {
    throw new SportsRoundParseError('El proveedor deportivo no reconoce el juego.', { code: 'UNSUPPORTED_SPORTS_GAME' });
  }
  const expectedMatches = EXPECTED_MATCHES[gameId];
  const allText = htmlToLines(html).join(' ');
  const parsedMeta = extractRoundMetadata(allText);
  const matches = enrichOfficialOutcomes(gameId, dedupeMatches([
    ...extractTableMatches(html),
    ...extractInlineMatches(html),
  ], expectedMatches));

  if (matches.length !== expectedMatches) {
    throw new SportsRoundParseError(`La composición oficial contiene ${matches.length} partidos y se esperaban ${expectedMatches}.`, {
      code: 'SPORTS_MATCH_COUNT_MISMATCH',
      details: matches.map(match => `${match.position}:${match.homeTeam}-${match.awayTeam}`).join('|'),
    });
  }

  const roundDate = options.roundDate || extractOfficialSportsDate(`${options.sourceUrl || ''} ${allText}`);
  const officialRoundNumber = String(options.officialRoundNumber || parsedMeta.officialRoundNumber || '');
  const season = String(options.season || parsedMeta.season || '');
  const sourceHash = textHash(cleanText(html, 250000));
  const prizeCategories = parseOfficialSportsPrizeCategories(html);
  const provisionalIdentity = !roundDate && !officialRoundNumber;
  const roundId = String(options.roundId || [gameId, season || null, officialRoundNumber || roundDate || 'current'].filter(Boolean).join(':'));
  const status = options.status || inferRoundStatus(matches);

  const round = sanitizeSportsRound({
    roundId,
    gameId,
    season,
    officialRoundNumber,
    roundDate: roundDate || null,
    status,
    salesOpenAt: options.salesOpenAt || null,
    salesCloseAt: options.salesCloseAt || null,
    source: 'SELAE oficial',
    sourceUrl: options.sourceUrl || '',
    sourceHash,
    officialUpdatedAt: options.officialUpdatedAt || null,
    fetchedAt: options.fetchedAt || new Date().toISOString(),
    updatedAt: options.updatedAt || new Date().toISOString(),
    matches,
    prizeCategories,
    metadata: {
      parserVersion: 'sports-official-round-v2',
      sourceType: status === 'official' ? 'results-page' : 'checker-composition',
      dateInferred: Boolean(options.roundDate && !extractOfficialSportsDate(`${options.sourceUrl || ''} ${allText}`)),
      provisionalIdentity,
      prizeCategories,
      scrutinyComplete: prizeCategories.length > 0,
      ...options.metadata,
    },
  }, { expectedMatches });

  if (!round.validation.valid) {
    throw new SportsRoundParseError(round.validation.errors.join(' '), {
      code: 'SPORTS_ROUND_INVALID', details: round.validation.warnings.join(' '),
    });
  }
  return { ...round, fingerprint: sportsRoundFingerprint(round) };
}
