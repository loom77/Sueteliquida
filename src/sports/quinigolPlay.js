import { createId } from '../utils/createId.js';
import { QUINIGOL_UNIT_PRICE } from './constants.js';
import { sanitizeQuinigolSelection, validateQuinigolSelection } from './quinigolRules.js';
import { sanitizeSportsRound, sportsRoundAvailability } from './roundModel.js';

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
      predictionType: match.predictionType,
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

function simpleOutcomes(raw = {}) {
  const selection = sanitizeQuinigolSelection(raw);
  return { outcomes: selection.outcomes.map(values => values.slice(0, 1)) };
}

export function createSimpleQuinigolPlay({ round: rawRound, selection: rawSelection, createdAt = new Date().toISOString() } = {}) {
  const round = sanitizeSportsRound(rawRound || {}, { expectedMatches: 6 });
  const preparationNow = new Date(createdAt);
  const availability = sportsRoundAvailability(round, { expectedMatches: 6, now: Number.isNaN(preparationNow.getTime()) ? new Date() : preparationNow });
  if (!availability.operational) throw new RangeError(availability.message);
  if (round.gameId !== 'quinigol') throw new RangeError('La jornada no pertenece a El Quinigol.');

  const normalized = simpleOutcomes(rawSelection);
  const validation = validateQuinigolSelection(normalized);
  if (!validation.valid) throw new RangeError(validation.errors.join(' '));
  if (validation.selection.outcomes.some(values => values.length !== 1)) {
    throw new RangeError('Esta primera versión admite un único marcador por partido.');
  }

  const outcomes = validation.selection.outcomes.map(values => values[0]);
  const drawDateISO = roundDateIso(round);
  const snapshot = roundSnapshot(round);
  return {
    id: createId('play'),
    gameId: 'quinigol',
    betType: 'simple',
    equivalentBets: 1,
    columns: [{
      id: createId('column'),
      index: 1,
      outcomes,
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
    method: 'quinigol-simple-manual',
    metadata: {
      preparedOnly: true,
      sportsRoundSnapshot: snapshot,
      unitPrice: QUINIGOL_UNIT_PRICE,
    },
    purchased: false,
    status: 'draft',
  };
}

export function sanitizeQuinigolPlay(play) {
  if (!play || play.gameId !== 'quinigol') return null;
  const snapshot = play.metadata?.sportsRoundSnapshot || {
    roundId: play.roundId,
    gameId: 'quinigol',
    officialRoundNumber: play.officialRoundNumber,
    roundDate: play.roundDate || play.drawDateKey,
    status: play.purchased ? 'sales-closed' : 'sales-open',
    salesCloseAt: play.drawDateISO,
    sourceHash: play.roundSourceHash,
    revision: play.roundRevision,
    matches: play.matches,
  };
  const round = sanitizeSportsRound(snapshot, { expectedMatches: 6 });
  if (!round.validation.valid || round.gameId !== 'quinigol') return null;
  const column = play.columns?.[0];
  const rawOutcomes = Array.isArray(column?.outcomes)
    ? { outcomes: column.outcomes.map(outcome => [outcome]) }
    : { outcomes: [] };
  const validation = validateQuinigolSelection(rawOutcomes);
  if (!validation.valid || validation.selection.outcomes.some(values => values.length !== 1)) return null;
  const purchased = Boolean(play.purchased ?? play.status !== 'draft');
  const drawDateISO = play.drawDateISO || roundDateIso(round);
  return {
    ...play,
    id: typeof play.id === 'string' ? play.id : createId('play'),
    gameId: 'quinigol',
    betType: 'simple',
    equivalentBets: 1,
    columns: [{
      ...column,
      id: typeof column?.id === 'string' ? column.id : createId('column'),
      index: 1,
      outcomes: validation.selection.outcomes.map(values => values[0]),
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
    method: play.method || 'quinigol-simple-manual',
    metadata: {
      ...(play.metadata || {}),
      preparedOnly: !purchased,
      sportsRoundSnapshot: roundSnapshot(round),
      unitPrice: QUINIGOL_UNIT_PRICE,
    },
    purchased,
    purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
  };
}
