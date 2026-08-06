import { HORSE_GAME_IDS } from './constants.js';
import { horseRoundFingerprint, sanitizeHorseRound } from './roundModel.js';

const MONTHS = Object.freeze({
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
});

export class HorseOfficialParseError extends Error {
  constructor(message, { code = 'HORSE_PARSE_ERROR', details = '' } = {}) {
    super(message);
    this.name = 'HorseOfficialParseError';
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

function cleanText(value, max = 500) {
  return decodeEntities(String(value || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function textLines(value) {
  return decodeEntities(String(value || ''))
    .replace(/\r/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|tr|td|th|div|section|article|h[1-6])>/gi, '\n')
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

export function extractOfficialHorseDate(value) {
  const text = cleanText(value, 100000).toLocaleLowerCase('es-ES');
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

export function extractOfficialHorseRoundNumber(value) {
  const text = cleanText(value, 100000);
  return text.match(/(?:CONCURSO|JORNADA)\s*[:\-]?\s*(\d{1,3})(?:\s*\/\s*(20\d{2}))?/i)?.[1] || '';
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

function absoluteUrl(value, baseUrl) {
  try { return new URL(decodeEntities(value), baseUrl).toString(); }
  catch { return ''; }
}

export function extractHorseDocumentLinks(html, baseUrl = 'https://www.loteriasyapuestas.es') {
  const documents = [];
  const source = String(html || '');
  for (const match of source.matchAll(/<a\b([^>]*)href=["']([^"']+\.pdf(?:\?[^"']*)?)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const title = cleanText(`${match[1]} ${match[3]} ${match[4]}`, 300);
    const url = absoluteUrl(match[2], baseUrl);
    if (!url) continue;
    const normalized = title.toLocaleLowerCase('es-ES');
    const kind = /retirad/.test(normalized) ? 'withdrawals' : /programa|carrera|favorit/.test(normalized) ? 'program' : 'document';
    documents.push({ kind, url, title });
  }
  for (const match of source.matchAll(/(?:href|src)=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi)) {
    const url = absoluteUrl(match[1], baseUrl);
    if (!url || documents.some(document => document.url === url)) continue;
    const normalized = decodeURIComponent(url).toLocaleLowerCase('es-ES');
    const kind = /retirad/.test(normalized) ? 'withdrawals' : /programa|carrera|lototurf|quintuple/.test(normalized) ? 'program' : 'document';
    documents.push({ kind, url, title: '' });
  }
  return documents;
}

function parseProgramHeader(lines, gameId) {
  const joined = lines.join(' ');
  const roundDate = extractOfficialHorseDate(joined);
  const officialRoundNumber = extractOfficialHorseRoundNumber(joined);
  const season = joined.match(/(?:CONCURSO|JORNADA)\s*[:\-]?\s*\d{1,3}\s*\/\s*(20\d{2})/i)?.[1] || (roundDate ? roundDate.slice(0, 4) : '');
  const venue = joined.match(/Hip[oó]dromo\s+de\s+(.+?)(?:\s+el\s+pr[oó]ximo|\s+y\s+que|\s+DOMINGO|\s+JUEVES|\s+SÁBADO)/i)?.[1] || '';
  const targetRace = gameId === 'lototurf' ? 4 : null;
  return { roundDate, officialRoundNumber, season, venue: cleanText(venue, 140), targetRace };
}

function parseRaceHeader(line) {
  const match = cleanText(line, 500).match(/^(\d{1,2})\s*[ªa]\s*CARRERA\s*-\s*(.+)$/i);
  if (!match) return null;
  const tail = match[2];
  const distance = Number(tail.match(/([\d.]{3,5})\s*mts/i)?.[1]?.replace(/\./g, '')) || null;
  const time = tail.match(/Hora\s*:\s*(\d{1,2}):(\d{2})/i);
  const name = cleanText(tail.replace(/\s*-\s*[\d.]+\s+Euros[\s\S]*$/i, '').replace(/\s*-\s*[\d.]+\s*mts[\s\S]*$/i, ''), 220);
  return { officialRaceNumber: Number(match[1]), name, distanceMeters: distance, time: time ? `${pad(time[1])}:${time[2]}` : '' };
}

function parseRunnerLine(line, maxRunner) {
  const text = cleanText(line, 600);
  const match = text.match(/^(\d{1,2})\s+(.+?)\s+(\d{1,2})\s+a(?:ñ|n)os\s+(\d{2}(?:[.,]\d)?)\s+(.+)$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isInteger(number) || number < 1 || number > maxRunner) return null;
  const remainder = match[5];
  const recentFormMatch = remainder.match(/\[([^\]]+)\]\s*$/);
  const recentForm = recentFormMatch ? recentFormMatch[1].split(',').map(item => item.trim()).filter(Boolean) : [];
  const withoutForm = recentFormMatch ? remainder.slice(0, recentFormMatch.index).trim() : remainder;
  const tokens = withoutForm.split(/\s{2,}|\t+/).filter(Boolean);
  return {
    number,
    name: cleanText(match[2], 140),
    age: Number(match[3]),
    weightKg: Number(match[4].replace(',', '.')),
    jockey: cleanText(tokens[0] || '', 120),
    stable: cleanText(tokens[1] || '', 140),
    trainer: cleanText(tokens[2] || '', 120),
    stall: Number(tokens[3]) || null,
    recentForm,
    status: /\bRet\b|retirad/i.test(text) ? 'withdrawn' : /favorit/i.test(text) ? 'favorite' : 'active',
    metadata: { raw: text, unparsedTail: tokens.length <= 1 ? withoutForm : '' },
  };
}

export function parseHorseWithdrawalsText(value) {
  const lines = textLines(value);
  const joined = lines.join(' ');
  const roundDate = extractOfficialHorseDate(joined);
  const officialRoundNumber = extractOfficialHorseRoundNumber(joined);
  const withdrawals = [];
  for (const line of lines) {
    const match = line.match(/^(\d{1,2})\s+(\d{1,2})\s+(.+?)\s+([0-3]?\d\/[01]?\d\/20\d{2})$/);
    if (!match) continue;
    withdrawals.push({
      raceNumber: Number(match[1]),
      horseNumber: Number(match[2]),
      horseName: cleanText(match[3], 140),
      publishedDate: extractOfficialHorseDate(match[4]),
    });
  }
  return { roundDate, officialRoundNumber, withdrawals };
}

function applyWithdrawals(races, withdrawalData) {
  if (!withdrawalData?.withdrawals?.length) return races;
  return races.map(race => ({
    ...race,
    runners: race.runners.map(runner => {
      const withdrawn = withdrawalData.withdrawals.find(item => item.raceNumber === race.officialRaceNumber && item.horseNumber === runner.number);
      return withdrawn ? { ...runner, status: 'withdrawn', withdrawn: true, metadata: { ...runner.metadata, withdrawalPublishedDate: withdrawn.publishedDate } } : runner;
    }),
  }));
}

export function parseOfficialHorseProgramText(value, gameId, options = {}) {
  if (!HORSE_GAME_IDS.includes(gameId)) throw new HorseOfficialParseError('Juego hípico no soportado.', { code: 'UNSUPPORTED_HORSE_GAME' });
  const lines = textLines(value);
  const header = parseProgramHeader(lines, gameId);
  const maxRunner = gameId === 'lototurf' ? 12 : 20;
  const races = [];
  let current = null;
  for (const line of lines) {
    const raceHeader = parseRaceHeader(line);
    if (raceHeader) {
      if (current && current.runners.length > 0 && current.officialRaceNumber === raceHeader.officialRaceNumber) {
        current = { ...current, ...raceHeader, venue: header.venue };
      } else {
        if (current) races.push(current);
        current = { position: races.length + 1, ...raceHeader, venue: header.venue, runners: [] };
      }
      continue;
    }
    const runner = parseRunnerLine(line, maxRunner);
    if (runner) {
      if (!current && gameId === 'lototurf') current = { position: 1, officialRaceNumber: 4, name: '4.ª carrera Lototurf', venue: header.venue, runners: [] };
      if (current) current.runners.push(runner);
    }
  }
  if (current) races.push(current);

  let selectedRaces = races;
  if (gameId === 'lototurf') selectedRaces = races.filter(race => race.officialRaceNumber === 4).slice(0, 1);
  else selectedRaces = races.slice(0, 5).map((race, index) => ({ ...race, position: index + 1 }));

  const withdrawalData = options.withdrawalText ? parseHorseWithdrawalsText(options.withdrawalText) : null;
  selectedRaces = applyWithdrawals(selectedRaces, withdrawalData);
  const roundDate = options.roundDate || header.roundDate || withdrawalData?.roundDate || '';
  const officialRoundNumber = String(options.officialRoundNumber || header.officialRoundNumber || withdrawalData?.officialRoundNumber || '');
  const season = String(options.season || header.season || (roundDate ? roundDate.slice(0, 4) : ''));
  const roundId = String(options.roundId || [gameId, season || null, officialRoundNumber || roundDate || 'current'].filter(Boolean).join(':'));
  const round = sanitizeHorseRound({
    roundId,
    gameId,
    season,
    officialRoundNumber,
    roundDate: roundDate || null,
    status: options.status || 'document-published',
    source: 'SELAE oficial',
    sourceUrl: options.sourceUrl || '',
    programUrl: options.programUrl || options.sourceUrl || '',
    withdrawalsUrl: options.withdrawalsUrl || '',
    sourceHash: textHash(`${value}\n${options.withdrawalText || ''}`),
    fetchedAt: options.fetchedAt || new Date().toISOString(),
    venue: header.venue,
    races: selectedRaces,
    documents: options.documents || [],
    metadata: {
      parserVersion: 'horse-official-program-v1',
      sourceType: 'official-program-document',
      withdrawalCount: withdrawalData?.withdrawals?.length || 0,
      ...options.metadata,
    },
  });
  if (!round.validation.valid) {
    throw new HorseOfficialParseError(round.validation.errors.join(' '), {
      code: 'HORSE_PROGRAM_INVALID', details: round.validation.warnings.join(' '),
    });
  }
  return { ...round, fingerprint: horseRoundFingerprint(round) };
}

function parseAmount(value) {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function parsePrizeCategories(lines) {
  const categories = [];
  for (const line of lines) {
    const match = line.match(/^((?:Especial|Reintegro|\d+\s*[ªa]).*?)\s+(\d[\d.]*)\s+([\d.]+,\d{2})\s*€?$/i);
    if (!match) continue;
    categories.push({ category: cleanText(match[1], 140), winners: Number(match[2].replace(/\./g, '')), prize: parseAmount(match[3]) });
  }
  return categories;
}

function sectionForGame(lines, gameId) {
  const startPattern = gameId === 'lototurf' ? /^Lototurf\s*-/i : /^Qu[ií]ntuple Plus\s*-/i;
  const otherPattern = gameId === 'lototurf' ? /^Qu[ií]ntuple Plus\s*-/i : /^Lototurf\s*-/i;
  const start = lines.findIndex(line => startPattern.test(line));
  if (start < 0) return lines;
  const tail = lines.slice(start);
  const end = tail.slice(1).findIndex(line => otherPattern.test(line));
  return end >= 0 ? tail.slice(0, end + 1) : tail;
}

export function parseOfficialHorseResultHtml(html, gameId, options = {}) {
  if (!HORSE_GAME_IDS.includes(gameId)) throw new HorseOfficialParseError('Juego hípico no soportado.', { code: 'UNSUPPORTED_HORSE_GAME' });
  const allLines = textLines(html);
  const lines = sectionForGame(allLines, gameId);
  const joined = lines.join(' ');
  const roundDate = options.roundDate || extractOfficialHorseDate(joined) || '';
  const officialRoundNumber = String(options.officialRoundNumber || extractOfficialHorseRoundNumber(joined) || '');
  const season = String(options.season || (roundDate ? roundDate.slice(0, 4) : ''));
  let result;

  if (gameId === 'lototurf') {
    const horseIndex = lines.findIndex(line => /^Caballo$/i.test(line) || /^Image:\s*Caballo$/i.test(line));
    const prefix = horseIndex >= 0 ? lines.slice(0, horseIndex) : lines;
    const markerIndex = prefix.findIndex(line => /Ver por orden de aparici[oó]n/i.test(line));
    const numberLines = (markerIndex >= 0 ? prefix.slice(markerIndex + 1) : prefix)
      .flatMap(line => line.match(/\b(?:0?[1-9]|[12]\d|3[01])\b/g) || [])
      .map(Number);
    const winningNumbers = [];
    for (const number of numberLines) {
      if (!winningNumbers.includes(number)) winningNumbers.push(number);
      if (winningNumbers.length === 6) break;
    }
    const afterHorse = horseIndex >= 0 ? lines.slice(horseIndex + 1) : [];
    const winningHorse = Number(afterHorse.find(line => /^(?:0?[1-9]|1[0-2])$/.test(line)) || joined.match(/Caballo(?:\s+ganador)?[^0-9]{0,30}(0?[1-9]|1[0-2])/i)?.[1]);
    const rIndex = lines.findIndex(line => /^R$/i.test(line));
    const reintegro = Number((rIndex >= 0 ? lines.slice(rIndex + 1).find(line => /^[0-9]$/.test(line)) : null) || joined.match(/Reintegro[^0-9]{0,20}([0-9])/i)?.[1]);
    result = { winningNumbers, winningHorse, reintegro, prizeCategories: parsePrizeCategories(lines) };
  } else {
    const winners = [];
    let secondFifth = null;
    for (const line of lines) {
      const row = line.match(/^(\d)\.\s*Carrera\s*(\d)(?:\s*\(2[ºo]\s*Clasificado\))?\s*(?:Image\s*)?(\d{1,2})$/i)
        || line.match(/^Carrera\s*(\d)(?:\s*\(2[ºo]\s*Clasificado\))?[^0-9]{0,30}(\d{1,2})$/i);
      if (!row) continue;
      const rowNumber = Number(row.length === 4 ? row[1] : winners.length + 1);
      const horse = Number(row[row.length - 1]);
      if (rowNumber === 6 || /2[ºo]\s*Clasificado/i.test(line)) secondFifth = horse;
      else if (winners.length < 5) winners.push(horse);
    }
    if (winners.length < 5) {
      const pairs = [...joined.matchAll(/Carrera\s*[1-5][^0-9]{0,50}(\d{1,2})/gi)].map(match => Number(match[1]));
      for (const horse of pairs) if (winners.length < 5) winners.push(horse);
    }
    if (secondFifth == null) secondFifth = Number(joined.match(/Carrera\s*5\s*\(2[ºo]\s*Clasificado\)[^0-9]{0,50}(\d{1,2})/i)?.[1]);
    result = { winners: winners.slice(0, 5), secondFifth, prizeCategories: parsePrizeCategories(lines) };
  }

  const roundId = String(options.roundId || [gameId, season || null, officialRoundNumber || roundDate || 'result'].filter(Boolean).join(':'));
  const round = sanitizeHorseRound({
    roundId,
    gameId,
    season,
    officialRoundNumber,
    roundDate: roundDate || null,
    status: options.status || 'official',
    source: 'SELAE oficial',
    sourceUrl: options.sourceUrl || '',
    resultUrl: options.sourceUrl || '',
    sourceHash: textHash(cleanText(html, 250000)),
    fetchedAt: options.fetchedAt || new Date().toISOString(),
    races: options.races || [],
    result,
    documents: options.documents || [],
    metadata: { parserVersion: 'horse-official-result-v1', sourceType: 'official-result-file', ...options.metadata },
  });
  if (!round.validation.valid) {
    throw new HorseOfficialParseError(round.validation.errors.join(' '), {
      code: 'HORSE_RESULT_INVALID', details: round.validation.warnings.join(' '),
    });
  }
  return { ...round, fingerprint: horseRoundFingerprint(round) };
}

export function mergeHorseProgramAndResult(program, result) {
  if (!program) return result;
  if (!result) return program;
  if (program.gameId !== result.gameId) throw new HorseOfficialParseError('Programa y resultado pertenecen a juegos distintos.', { code: 'HORSE_MERGE_GAME_MISMATCH' });
  const merged = sanitizeHorseRound({
    ...program,
    roundDate: result.roundDate || program.roundDate,
    officialRoundNumber: result.officialRoundNumber || program.officialRoundNumber,
    status: result.status || program.status,
    result: result.result,
    resultUrl: result.resultUrl,
    sourceHash: textHash(`${program.sourceHash}|${result.sourceHash}`),
    fetchedAt: result.fetchedAt || program.fetchedAt,
    documents: [...(program.documents || []), ...(result.documents || [])].filter((document, index, array) => array.findIndex(item => item.url === document.url) === index),
    metadata: { ...program.metadata, ...result.metadata, merged: true },
  });
  if (!merged.validation.valid) throw new HorseOfficialParseError(merged.validation.errors.join(' '), { code: 'HORSE_MERGE_INVALID' });
  return { ...merged, fingerprint: horseRoundFingerprint(merged) };
}
