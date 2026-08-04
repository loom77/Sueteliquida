import { createId } from '../utils/createId.js';
import { GOAL_BUCKETS, QUINIELA_SYMBOLS, QUINIELA_UNIT_PRICE } from './constants.js';
import { sanitizeQuinielaSelection, validateQuinielaSelection } from './quinielaRules.js';
import { sanitizeSportsRound } from './roundModel.js';

function singleValue(value, allowed) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return allowed.includes(candidate) ? candidate : '';
}

export function sanitizeSimpleQuinielaSelection(raw = {}) {
  const signs = Array.from({ length: 14 }, (_, index) => singleValue(raw.signs?.[index], QUINIELA_SYMBOLS));
  return {
    signs,
    pleno: {
      home: singleValue(raw.pleno?.home, GOAL_BUCKETS),
      away: singleValue(raw.pleno?.away, GOAL_BUCKETS),
    },
  };
}

export function validateSimpleQuinielaSelection(raw = {}) {
  const selection = sanitizeSimpleQuinielaSelection(raw);
  const errors = [];
  selection.signs.forEach((sign, index) => {
    if (!sign) errors.push(`Falta el pronóstico del partido ${index + 1}.`);
  });
  if (!selection.pleno.home) errors.push('Falta el pronóstico local del Pleno al 15.');
  if (!selection.pleno.away) errors.push('Falta el pronóstico visitante del Pleno al 15.');
  return { valid: errors.length === 0, errors, selection };
}

function roundSnapshot(round) {
  return {
    roundId: round.roundId,
    gameId: round.gameId,
    season: round.season,
    officialRoundNumber: round.officialRoundNumber,
    roundDate: round.roundDate,
    status: round.status,
    salesOpenAt: round.salesOpenAt,
    salesCloseAt: round.salesCloseAt,
    source: round.source,
    sourceUrl: round.sourceUrl,
    sourceHash: round.sourceHash,
    revision: round.revision,
    fetchedAt: round.fetchedAt,
    matches: round.matches.map(match => ({
      matchId: match.matchId,
      officialMatchId: match.officialMatchId,
      position: match.position,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      competition: match.competition,
      kickoffAt: match.kickoffAt,
      status: match.status,
    })),
  };
}

function roundDateIso(round) {
  if (round.salesCloseAt) return round.salesCloseAt;
  const firstKickoff = round.matches.map(match => match.kickoffAt).filter(Boolean).sort()[0];
  if (firstKickoff) return firstKickoff;
  return round.roundDate ? `${round.roundDate}T23:59:00.000Z` : new Date().toISOString();
}

export function createSimpleQuinielaPlay({ round: rawRound, selection: rawSelection, createdAt = new Date().toISOString() } = {}) {
  const round = sanitizeSportsRound(rawRound || {}, { expectedMatches: 15 });
  if (!round.validation.valid) throw new RangeError(round.validation.errors.join(' '));
  if (round.gameId !== 'quiniela') throw new RangeError('La jornada no pertenece a La Quiniela.');

  const { valid, errors, selection } = validateSimpleQuinielaSelection(rawSelection);
  if (!valid) throw new RangeError(errors.join(' '));

  const canonical = {
    signs: selection.signs.map(sign => [sign]),
    pleno: { home: [selection.pleno.home], away: [selection.pleno.away] },
  };
  const rules = validateQuinielaSelection(canonical);
  if (!rules.valid) throw new RangeError(rules.errors.join(' '));

  const drawDateISO = roundDateIso(round);
  const snapshot = roundSnapshot(round);
  return {
    id: createId('play'),
    gameId: 'quiniela',
    betType: 'simple',
    equivalentBets: 1,
    columns: [{
      id: createId('column'),
      index: 1,
      signs: selection.signs,
      pleno: selection.pleno,
      status: 'draft',
    }],
    roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber,
    roundRevision: round.revision,
    roundSourceHash: round.sourceHash,
    roundDate: round.roundDate,
    matches: snapshot.matches,
    createdAt,
    drawDateISO,
    drawDateTimeISO: drawDateISO,
    drawDateKey: round.roundDate || drawDateISO.slice(0, 10),
    checkableFromISO: null,
    method: 'quiniela-simple-manual',
    metadata: {
      preparedOnly: true,
      sportsRoundSnapshot: snapshot,
      unitPrice: QUINIELA_UNIT_PRICE,
    },
    purchased: false,
    status: 'draft',
  };
}

export function sanitizeQuinielaPlay(play) {
  if (!play || play.gameId !== 'quiniela') return null;
  const snapshot = play.metadata?.sportsRoundSnapshot || {
    roundId: play.roundId,
    gameId: 'quiniela',
    officialRoundNumber: play.officialRoundNumber,
    roundDate: play.roundDate || play.drawDateKey,
    status: 'published',
    salesCloseAt: play.drawDateISO,
    sourceHash: play.roundSourceHash,
    revision: play.roundRevision,
    matches: play.matches,
  };
  const round = sanitizeSportsRound(snapshot, { expectedMatches: 15 });
  if (!round.validation.valid || round.gameId !== 'quiniela') return null;
  const column = play.columns?.[0];
  const validation = validateSimpleQuinielaSelection({ signs: column?.signs, pleno: column?.pleno });
  if (!validation.valid) return null;
  const purchased = Boolean(play.purchased ?? play.status !== 'draft');
  const drawDateISO = play.drawDateISO || roundDateIso(round);
  return {
    ...play,
    id: typeof play.id === 'string' ? play.id : createId('play'),
    gameId: 'quiniela',
    betType: 'simple',
    equivalentBets: 1,
    columns: [{
      ...column,
      id: typeof column?.id === 'string' ? column.id : createId('column'),
      index: 1,
      signs: validation.selection.signs,
      pleno: validation.selection.pleno,
      status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    }],
    roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber,
    roundRevision: round.revision,
    roundSourceHash: round.sourceHash,
    roundDate: round.roundDate,
    matches: round.matches,
    createdAt: play.createdAt || new Date().toISOString(),
    drawDateISO,
    drawDateTimeISO: play.drawDateTimeISO || drawDateISO,
    drawDateKey: play.drawDateKey || round.roundDate || drawDateISO.slice(0, 10),
    checkableFromISO: purchased ? (play.checkableFromISO || drawDateISO) : null,
    method: play.method || 'quiniela-simple-manual',
    metadata: {
      ...(play.metadata || {}),
      preparedOnly: !purchased,
      sportsRoundSnapshot: roundSnapshot(round),
      unitPrice: QUINIELA_UNIT_PRICE,
    },
    purchased,
    purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
  };
}
