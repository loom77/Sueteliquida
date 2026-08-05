import { SPORTS_GAME_IDS, SPORTS_MATCH_STATUSES, SPORTS_ROUND_STATUSES } from './constants.js';

function cleanText(value, maxLength = 140) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function isSuspiciousSportsTeamName(value) {
  const text = cleanText(value, 220);
  if (!text) return true;
  return /https?:|www\.|\[|\]|\]\(|\.com\b|añadir\s+a|elige\s*8|javascript:|data:/i.test(text);
}

function operationalDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
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
    roundDate: validDateKey(raw?.roundDate),
    status,
    salesOpenAt: validIso(raw?.salesOpenAt),
    salesCloseAt: validIso(raw?.salesCloseAt),
    source: cleanText(raw?.source || 'SELAE oficial', 100),
    sourceUrl: cleanText(raw?.sourceUrl, 500),
    sourceHash: cleanText(raw?.sourceHash, 160),
    officialUpdatedAt: validIso(raw?.officialUpdatedAt),
    fetchedAt: validIso(raw?.fetchedAt) || new Date().toISOString(),
    revision: Number.isInteger(Number(raw?.revision)) && Number(raw.revision) > 0 ? Number(raw.revision) : 1,
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
    if (isSuspiciousSportsTeamName(match.homeTeam) || isSuspiciousSportsTeamName(match.awayTeam)) {
      errors.push(`El partido ${match.position || '?'} contiene nombres de equipos no válidos.`);
    }
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

export function sportsRoundAvailability(round, { now = new Date(), expectedMatches } = {}) {
  const validation = validateSportsRound(round, { expectedMatches });
  if (!round || !validation.valid) {
    return {
      state: 'invalid',
      operational: false,
      title: 'Jornada no disponible',
      message: 'Primy ha bloqueado una composición incompleta o no verificable.',
      reasons: validation.errors,
    };
  }

  const identityMissing = !round.officialRoundNumber || !round.roundDate || !round.salesCloseAt || !round.sourceHash;
  const provisional = Boolean(round.metadata?.provisionalIdentity || round.metadata?.sourceType === 'checker-composition');
  if (identityMissing || provisional) {
    return {
      state: 'updating',
      operational: false,
      title: 'Jornada en actualización',
      message: 'Estamos verificando el número de jornada, la fecha y el cierre oficial de ventas.',
      reasons: [
        ...(!round.officialRoundNumber ? ['Falta el número oficial de jornada.'] : []),
        ...(!round.roundDate ? ['Falta la fecha oficial.'] : []),
        ...(!round.salesCloseAt ? ['Falta el cierre oficial de ventas.'] : []),
        ...(provisional ? ['La fuente todavía tiene identidad provisional.'] : []),
      ],
    };
  }

  const nowDate = operationalDate(now) || new Date();
  const closeDate = operationalDate(round.salesCloseAt);
  if (round.status === 'cancelled') {
    return { state: 'cancelled', operational: false, title: 'Jornada cancelada', message: 'La jornada oficial ha sido cancelada.', reasons: [] };
  }
  if (closeDate && closeDate.getTime() <= nowDate.getTime()) {
    return {
      state: 'closed',
      operational: false,
      title: 'Venta cerrada',
      message: 'La composición sigue disponible para consulta, pero ya no se pueden preparar nuevas jugadas.',
      reasons: [],
    };
  }
  if (['sales-closed', 'in-progress', 'provisional', 'official'].includes(round.status)) {
    return {
      state: round.status === 'official' ? 'finished' : 'closed',
      operational: false,
      title: round.status === 'official' ? 'Jornada finalizada' : 'Venta cerrada',
      message: 'La jornada ya no admite nuevas jugadas.',
      reasons: [],
    };
  }

  return {
    state: 'available',
    operational: true,
    title: 'Jornada disponible',
    message: 'Composición, fecha y cierre oficial verificados.',
    reasons: [],
  };
}

export function sportsRoundFingerprint(round) {
  const canonical = JSON.stringify({
    roundId: round?.roundId || '',
    gameId: round?.gameId || '',
    officialRoundNumber: round?.officialRoundNumber || '',
    roundDate: round?.roundDate || '',
    matches: (round?.matches || []).map(match => [match.position, match.officialMatchId || match.matchId, match.homeTeam, match.awayTeam, match.kickoffAt, match.status]),
  });
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sports-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
