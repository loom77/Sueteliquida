import { SPORTS_GAME_IDS, SPORTS_MATCH_STATUSES, SPORTS_ROUND_STATUSES } from './constants.js';

function cleanText(value, maxLength = 140) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function validIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function sanitizeSportsMatch(raw, fallbackPosition = 1) {
  const position = Number(raw?.position ?? fallbackPosition);
  const homeTeam = cleanText(raw?.homeTeam || raw?.home?.name);
  const awayTeam = cleanText(raw?.awayTeam || raw?.away?.name);
  const officialMatchId = cleanText(raw?.officialMatchId || raw?.matchId || raw?.id, 100);
  const status = SPORTS_MATCH_STATUSES.includes(raw?.status) ? raw.status : 'scheduled';
  return {
    matchId: officialMatchId || `match-${position}`,
    officialMatchId: officialMatchId || null,
    position: Number.isInteger(position) && position > 0 ? position : fallbackPosition,
    homeTeam,
    awayTeam,
    competition: cleanText(raw?.competition, 100),
    kickoffAt: validIso(raw?.kickoffAt),
    status,
    officialScore: raw?.officialScore && Number.isInteger(Number(raw.officialScore.home)) && Number.isInteger(Number(raw.officialScore.away))
      ? { home: Number(raw.officialScore.home), away: Number(raw.officialScore.away) }
      : null,
    excludedReason: status === 'excluded' ? cleanText(raw?.excludedReason, 240) : '',
    metadata: raw?.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {},
  };
}

export function sanitizeSportsRound(raw, { expectedMatches } = {}) {
  const gameId = SPORTS_GAME_IDS.includes(raw?.gameId) ? raw.gameId : '';
  const matches = Array.isArray(raw?.matches)
    ? raw.matches.map((match, index) => sanitizeSportsMatch(match, index + 1)).sort((a, b) => a.position - b.position)
    : [];
  const status = SPORTS_ROUND_STATUSES.includes(raw?.status) ? raw.status : 'draft';
  const round = {
    roundId: cleanText(raw?.roundId || raw?.id, 120),
    gameId,
    season: cleanText(raw?.season, 40),
    officialRoundNumber: cleanText(raw?.officialRoundNumber, 40),
    status,
    salesOpenAt: validIso(raw?.salesOpenAt),
    salesCloseAt: validIso(raw?.salesCloseAt),
    sourceUrl: cleanText(raw?.sourceUrl, 500),
    sourceHash: cleanText(raw?.sourceHash, 160),
    updatedAt: validIso(raw?.updatedAt) || new Date().toISOString(),
    matches,
    metadata: raw?.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {},
  };
  const validation = validateSportsRound(round, { expectedMatches });
  return { ...round, validation };
}

export function validateSportsRound(round, { expectedMatches } = {}) {
  const errors = [];
  const warnings = [];
  if (!SPORTS_GAME_IDS.includes(round?.gameId)) errors.push('gameId no pertenece a un juego deportivo soportado.');
  if (!round?.roundId) errors.push('roundId es obligatorio.');
  if (!Array.isArray(round?.matches) || round.matches.length === 0) errors.push('La jornada debe contener partidos.');
  if (expectedMatches != null && round?.matches?.length !== expectedMatches) errors.push(`La jornada debe contener ${expectedMatches} partidos.`);

  const positions = new Set();
  const ids = new Set();
  for (const match of round?.matches || []) {
    if (!match.homeTeam || !match.awayTeam) errors.push(`El partido ${match.position || '?'} no tiene ambos equipos.`);
    if (match.homeTeam && match.awayTeam && match.homeTeam.toLocaleLowerCase('es-ES') === match.awayTeam.toLocaleLowerCase('es-ES')) {
      errors.push(`El partido ${match.position || '?'} repite el mismo equipo.`);
    }
    if (positions.has(match.position)) errors.push(`La posición ${match.position} está duplicada.`);
    positions.add(match.position);
    if (ids.has(match.matchId)) errors.push(`El identificador ${match.matchId} está duplicado.`);
    ids.add(match.matchId);
    if (!match.kickoffAt) warnings.push(`El partido ${match.position} todavía no tiene hora oficial válida.`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function sportsRoundFingerprint(round) {
  const canonical = JSON.stringify({
    roundId: round?.roundId || '',
    gameId: round?.gameId || '',
    officialRoundNumber: round?.officialRoundNumber || '',
    matches: (round?.matches || []).map(match => [match.position, match.officialMatchId || match.matchId, match.homeTeam, match.awayTeam, match.kickoffAt, match.status]),
  });
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sports-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
