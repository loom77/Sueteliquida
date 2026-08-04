import {
  HORSE_EXPECTED_RACES,
  HORSE_GAME_IDS,
  HORSE_MAX_RUNNERS,
  HORSE_ROUND_STATUSES,
  HORSE_RUNNER_STATUSES,
} from './constants.js';

function cleanText(value, maxLength = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function integer(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function decimal(value, min, max) {
  if (value == null || value === '') return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function validDateKey(value) {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function validIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function uniqueIntegerList(values, min, max) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(value => integer(value, min, max)).filter(value => value != null))].sort((a, b) => a - b);
}

export function sanitizeHorseRunner(raw, fallbackNumber = 1, maxRunner = 20) {
  const number = integer(raw?.number ?? raw?.dorsal ?? fallbackNumber, 1, maxRunner);
  const status = HORSE_RUNNER_STATUSES.includes(raw?.status)
    ? raw.status
    : raw?.withdrawn
      ? 'withdrawn'
      : raw?.favorite
        ? 'favorite'
        : 'active';
  return {
    number: number ?? fallbackNumber,
    name: cleanText(raw?.name || raw?.horseName || `Caballo ${number ?? fallbackNumber}`, 140),
    age: integer(raw?.age, 2, 20),
    weightKg: decimal(raw?.weightKg ?? raw?.weight, 30, 100),
    jockey: cleanText(raw?.jockey, 120),
    stable: cleanText(raw?.stable || raw?.owner, 140),
    trainer: cleanText(raw?.trainer, 120),
    stall: integer(raw?.stall ?? raw?.box, 1, 40),
    recentForm: Array.isArray(raw?.recentForm)
      ? raw.recentForm.map(item => cleanText(item, 12)).filter(Boolean).slice(0, 8)
      : cleanText(raw?.recentForm, 120).split(/[\s,;|]+/).filter(Boolean).slice(0, 8),
    status,
    favorite: status === 'favorite' || Boolean(raw?.favorite),
    withdrawn: status === 'withdrawn' || Boolean(raw?.withdrawn),
    metadata: raw?.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {},
  };
}

export function sanitizeHorseRace(raw, fallbackPosition = 1, gameId = 'quintuple-plus') {
  const maxRunner = HORSE_MAX_RUNNERS[gameId] || 20;
  const position = integer(raw?.position ?? raw?.racePosition ?? fallbackPosition, 1, 9) ?? fallbackPosition;
  const officialRaceNumber = integer(raw?.officialRaceNumber ?? raw?.raceNumber ?? position, 1, 20) ?? position;
  const runners = Array.isArray(raw?.runners)
    ? raw.runners.map((runner, index) => sanitizeHorseRunner(runner, index + 1, maxRunner)).sort((a, b) => a.number - b.number)
    : [];
  const seen = new Set();
  const uniqueRunners = runners.filter(runner => {
    if (seen.has(runner.number)) return false;
    seen.add(runner.number);
    return true;
  });
  return {
    raceId: cleanText(raw?.raceId || raw?.id || `race-${position}`, 100),
    position,
    officialRaceNumber,
    name: cleanText(raw?.name || raw?.raceName || `Carrera ${officialRaceNumber}`, 220),
    venue: cleanText(raw?.venue || raw?.racecourse, 140),
    scheduledAt: validIso(raw?.scheduledAt),
    distanceMeters: integer(raw?.distanceMeters ?? raw?.distance, 400, 6000),
    prizeAmount: decimal(raw?.prizeAmount, 0, 10_000_000),
    runners: uniqueRunners,
    favoriteNumbers: uniqueRunners.filter(runner => runner.favorite).map(runner => runner.number),
    withdrawnNumbers: uniqueRunners.filter(runner => runner.withdrawn).map(runner => runner.number),
    result: raw?.result && typeof raw.result === 'object'
      ? {
          winner: integer(raw.result.winner, 1, maxRunner),
          second: integer(raw.result.second, 1, maxRunner),
        }
      : null,
    metadata: raw?.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {},
  };
}

export function sanitizeHorseResult(gameId, raw = {}) {
  if (gameId === 'lototurf') {
    const winningNumbers = uniqueIntegerList(raw?.winningNumbers || raw?.numbers, 1, 31);
    const winningHorse = integer(raw?.winningHorse ?? raw?.horse, 1, 12);
    const reintegro = integer(raw?.reintegro ?? raw?.refund, 0, 9);
    return {
      winningNumbers,
      winningHorse,
      reintegro,
      prizeCategories: Array.isArray(raw?.prizeCategories) ? raw.prizeCategories.map(category => ({
        category: cleanText(category?.category || category?.label, 140),
        winners: integer(category?.winners, 0, 100_000_000) ?? 0,
        prize: decimal(category?.prize, 0, 100_000_000) ?? 0,
      })) : [],
      valid: winningNumbers.length === 6 && winningHorse != null && reintegro != null,
    };
  }
  if (gameId === 'quintuple-plus') {
    const winners = uniqueIntegerList(raw?.winners || raw?.winningHorses, 1, 20);
    const orderedWinners = Array.isArray(raw?.winners || raw?.winningHorses)
      ? (raw.winners || raw.winningHorses).map(value => integer(value, 1, 20)).filter(value => value != null).slice(0, 5)
      : [];
    const secondFifth = integer(raw?.secondFifth ?? raw?.second, 1, 20);
    return {
      winners: orderedWinners,
      secondFifth,
      prizeCategories: Array.isArray(raw?.prizeCategories) ? raw.prizeCategories.map(category => ({
        category: cleanText(category?.category || category?.label, 140),
        winners: integer(category?.winners, 0, 100_000_000) ?? 0,
        prize: decimal(category?.prize, 0, 100_000_000) ?? 0,
      })) : [],
      valid: orderedWinners.length === 5 && winners.length >= 1 && secondFifth != null && orderedWinners[4] !== secondFifth,
    };
  }
  return { valid: false };
}

export function sanitizeHorseRound(raw) {
  const gameId = HORSE_GAME_IDS.includes(raw?.gameId) ? raw.gameId : '';
  const races = Array.isArray(raw?.races)
    ? raw.races.map((race, index) => sanitizeHorseRace(race, index + 1, gameId)).sort((a, b) => a.position - b.position)
    : [];
  const status = HORSE_ROUND_STATUSES.includes(raw?.status) ? raw.status : 'draft';
  const result = raw?.result ? sanitizeHorseResult(gameId, raw.result) : null;
  const round = {
    roundId: cleanText(raw?.roundId || raw?.id, 140),
    gameId,
    season: cleanText(raw?.season, 40),
    officialRoundNumber: cleanText(raw?.officialRoundNumber, 40),
    roundDate: validDateKey(raw?.roundDate),
    status,
    salesOpenAt: validIso(raw?.salesOpenAt),
    salesCloseAt: validIso(raw?.salesCloseAt),
    source: cleanText(raw?.source || 'SELAE oficial', 100),
    sourceUrl: cleanText(raw?.sourceUrl, 600),
    programUrl: cleanText(raw?.programUrl, 600),
    withdrawalsUrl: cleanText(raw?.withdrawalsUrl, 600),
    resultUrl: cleanText(raw?.resultUrl, 600),
    sourceHash: cleanText(raw?.sourceHash, 180),
    officialUpdatedAt: validIso(raw?.officialUpdatedAt),
    fetchedAt: validIso(raw?.fetchedAt) || new Date().toISOString(),
    updatedAt: validIso(raw?.updatedAt) || new Date().toISOString(),
    revision: integer(raw?.revision, 1, 1_000_000) || 1,
    venue: cleanText(raw?.venue, 140),
    races,
    result,
    documents: Array.isArray(raw?.documents) ? raw.documents.map(document => ({
      kind: cleanText(document?.kind, 40),
      url: cleanText(document?.url, 600),
      title: cleanText(document?.title, 220),
      fetchedAt: validIso(document?.fetchedAt),
      sourceHash: cleanText(document?.sourceHash, 180),
    })).filter(document => document.url) : [],
    metadata: raw?.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {},
  };
  return { ...round, validation: validateHorseRound(round) };
}

export function validateHorseRound(round) {
  const errors = [];
  const warnings = [];
  if (!HORSE_GAME_IDS.includes(round?.gameId)) errors.push('gameId no pertenece a un juego hípico soportado.');
  if (!round?.roundId) errors.push('roundId es obligatorio.');
  if (!round?.roundDate) warnings.push('La jornada todavía no tiene una fecha oficial válida.');
  if (!round?.officialRoundNumber) warnings.push('La jornada todavía no tiene número oficial.');

  const expectedRaces = HORSE_EXPECTED_RACES[round?.gameId] || 0;
  if (round?.races?.length > 0 && round.races.length !== expectedRaces) {
    errors.push(`El programa de ${round.gameId} debe contener ${expectedRaces} ${expectedRaces === 1 ? 'carrera' : 'carreras'}.`);
  }
  if ((!round?.races || round.races.length === 0) && !round?.result?.valid) {
    errors.push('La jornada debe contener un programa oficial o un resultado oficial válido.');
  }

  const positions = new Set();
  for (const race of round?.races || []) {
    if (positions.has(race.position)) errors.push(`La posición de carrera ${race.position} está duplicada.`);
    positions.add(race.position);
    if (round.gameId === 'lototurf' && race.officialRaceNumber !== 4) errors.push('Lototurf debe referirse a la 4.ª carrera oficial.');
    const maxRunner = HORSE_MAX_RUNNERS[round.gameId] || 20;
    if (race.runners.length < 3 || race.runners.length > maxRunner) {
      errors.push(`La carrera ${race.position} debe contener entre 3 y ${maxRunner} caballos.`);
    }
    const numbers = new Set();
    for (const runner of race.runners) {
      if (numbers.has(runner.number)) errors.push(`El dorsal ${runner.number} está duplicado en la carrera ${race.position}.`);
      numbers.add(runner.number);
      if (!runner.name) warnings.push(`El dorsal ${runner.number} de la carrera ${race.position} no tiene nombre.`);
    }
  }
  if (round?.result && !round.result.valid) errors.push('El resultado hípico no supera la validación reglamentaria.');
  return { valid: errors.length === 0, errors, warnings };
}

export function horseRoundFingerprint(round) {
  const canonical = JSON.stringify({
    roundId: round?.roundId || '',
    gameId: round?.gameId || '',
    officialRoundNumber: round?.officialRoundNumber || '',
    roundDate: round?.roundDate || '',
    races: (round?.races || []).map(race => [
      race.position,
      race.officialRaceNumber,
      race.name,
      race.scheduledAt,
      race.runners.map(runner => [runner.number, runner.name, runner.status]),
    ]),
    result: round?.result || null,
  });
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `horse-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
