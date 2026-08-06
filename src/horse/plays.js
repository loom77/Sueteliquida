import { createId } from '../utils/createId.js';
import { sanitizeHorseRound } from './roundModel.js';
import { sanitizeLototurfSelection } from './lototurfRules.js';
import { sanitizeQuintuplePlusSelection } from './quintuplePlusRules.js';

function cleanText(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function roundDateIso(round) {
  const scheduled = round?.races?.map(race => race.scheduledAt).filter(Boolean).sort()[0];
  if (scheduled) return scheduled;
  if (round?.roundDate) return new Date(`${round.roundDate}T12:00:00Z`).toISOString();
  return new Date().toISOString();
}

function copyRunner(runner) {
  return {
    number: runner.number,
    name: runner.name,
    jockey: runner.jockey || '',
    trainer: runner.trainer || '',
    status: runner.status,
    favorite: Boolean(runner.favorite),
    withdrawn: Boolean(runner.withdrawn),
  };
}

function copyRace(race) {
  return {
    raceId: race.raceId,
    position: race.position,
    officialRaceNumber: race.officialRaceNumber,
    name: race.name,
    venue: race.venue,
    scheduledAt: race.scheduledAt,
    distanceMeters: race.distanceMeters,
    runners: (race.runners || []).map(copyRunner),
    withdrawnNumbers: [...(race.withdrawnNumbers || [])],
    favoriteNumbers: [...(race.favoriteNumbers || [])],
  };
}

function normalizeRound(rawRound, expectedGameId) {
  const round = sanitizeHorseRound(rawRound || {});
  if (round.gameId !== expectedGameId) throw new Error('La jornada oficial no corresponde al juego seleccionado.');
  if (!round.validation.valid) throw new Error(round.validation.errors.join(' '));
  return round;
}

function activeRunnerNumbers(race) {
  return (race?.runners || []).filter(runner => !runner.withdrawn).map(runner => runner.number);
}

function ensureSelectedRunnersAreActive(selected, active, label) {
  const activeSet = new Set(active);
  const inactive = selected.filter(number => !activeSet.has(number));
  if (inactive.length) throw new Error(`${label}: los dorsales ${inactive.join(', ')} ya no están activos en el programa oficial.`);
}

export function createLototurfPlay({ round: rawRound, selection: rawSelection } = {}) {
  const round = normalizeRound(rawRound, 'lototurf');
  const race = round.races[0];
  const selection = sanitizeLototurfSelection(rawSelection);
  if (!selection) throw new Error('La selección de Lototurf no cumple las reglas del boleto.');
  ensureSelectedRunnersAreActive(selection.horses, activeRunnerNumbers(race), 'Lototurf');
  const drawDateISO = roundDateIso(round);
  return {
    id: createId('play'),
    gameId: 'lototurf',
    betType: selection.betType,
    equivalentBets: selection.equivalentBets,
    selection: { numbers: selection.numbers, horses: selection.horses },
    columns: [{
      id: createId('column'),
      index: 1,
      numbers: selection.numbers,
      horses: selection.horses,
      horse: selection.horses[0],
      isSystem: selection.betType === 'multiple',
      status: 'draft',
    }],
    roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber,
    roundRevision: round.revision,
    sourceHash: round.sourceHash,
    drawDateISO,
    drawDateKey: round.roundDate,
    checkableFromISO: validIso(round.salesCloseAt) || drawDateISO,
    venue: round.venue || race.venue,
    races: [copyRace(race)],
    createdAt: new Date().toISOString(),
    purchased: false,
    status: 'draft',
    method: 'lototurf-official-round',
    metadata: {
      officialSource: round.source,
      sourceUrl: round.sourceUrl || round.programUrl || '',
      officialRoundBound: true,
    },
  };
}

export function createQuintuplePlusPlay({ round: rawRound, selection: rawSelection } = {}) {
  const round = normalizeRound(rawRound, 'quintuple-plus');
  const runnerCounts = round.races.map(race => Math.max(...race.runners.map(runner => runner.number)));
  const selection = sanitizeQuintuplePlusSelection({ ...rawSelection, runnerCounts });
  if (!selection) throw new Error('La selección de Quíntuple Plus no cumple las reglas del boleto.');
  selection.rows.forEach((row, index) => {
    const raceIndex = Math.min(index, 4);
    ensureSelectedRunnersAreActive(row, activeRunnerNumbers(round.races[raceIndex]), `Carrera ${raceIndex + 1}`);
  });
  const drawDateISO = roundDateIso(round);
  return {
    id: createId('play'),
    gameId: 'quintuple-plus',
    betType: selection.betType,
    equivalentBets: selection.equivalentBets,
    selection: { rows: selection.rows, runnerCounts: selection.runnerCounts },
    columns: [{
      id: createId('column'),
      index: 1,
      rows: selection.rows,
      isSystem: selection.betType === 'multiple',
      status: 'draft',
    }],
    roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber,
    roundRevision: round.revision,
    sourceHash: round.sourceHash,
    drawDateISO,
    drawDateKey: round.roundDate,
    checkableFromISO: validIso(round.salesCloseAt) || drawDateISO,
    venue: round.venue || round.races[0]?.venue,
    races: round.races.map(copyRace),
    createdAt: new Date().toISOString(),
    purchased: false,
    status: 'draft',
    method: 'quintuple-plus-official-round',
    metadata: {
      officialSource: round.source,
      sourceUrl: round.sourceUrl || round.programUrl || '',
      officialRoundBound: true,
    },
  };
}

export function sanitizeHorsePlay(play) {
  if (!play || !['lototurf', 'quintuple-plus'].includes(play.gameId)) return null;
  const purchased = Boolean(play.purchased ?? play.status !== 'draft');
  const base = {
    ...play,
    id: typeof play.id === 'string' && play.id ? play.id : createId('play'),
    officialRoundNumber: cleanText(play.officialRoundNumber, 40),
    roundId: cleanText(play.roundId, 160),
    sourceHash: cleanText(play.sourceHash, 180),
    roundRevision: Math.max(1, Number(play.roundRevision) || 1),
    drawDateISO: validIso(play.drawDateISO) || new Date().toISOString(),
    drawDateKey: /^\d{4}-\d{2}-\d{2}$/.test(String(play.drawDateKey || '')) ? play.drawDateKey : null,
    createdAt: validIso(play.createdAt) || new Date().toISOString(),
    purchased,
    purchasedAt: purchased ? (validIso(play.purchasedAt) || validIso(play.createdAt) || new Date().toISOString()) : undefined,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    venue: cleanText(play.venue, 140),
    races: Array.isArray(play.races) ? play.races.map(copyRace) : [],
    metadata: play.metadata && typeof play.metadata === 'object' ? { ...play.metadata } : {},
  };

  if (play.gameId === 'lototurf') {
    const raw = play.selection || play.columns?.[0] || {};
    const selection = sanitizeLototurfSelection({ numbers: raw.numbers, horses: raw.horses || [raw.horse] });
    if (!selection) return null;
    return {
      ...base,
      gameId: 'lototurf',
      betType: selection.betType,
      equivalentBets: selection.equivalentBets,
      selection: { numbers: selection.numbers, horses: selection.horses },
      columns: [{
        ...(play.columns?.[0] || {}),
        id: play.columns?.[0]?.id || createId('column'),
        index: 1,
        numbers: selection.numbers,
        horses: selection.horses,
        horse: selection.horses[0],
        isSystem: selection.betType === 'multiple',
        status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
      }],
    };
  }

  const rawRows = play.selection?.rows || play.columns?.[0]?.rows;
  const runnerCounts = play.selection?.runnerCounts || play.races?.map(race => activeRunnerNumbers(race).length);
  const selection = sanitizeQuintuplePlusSelection({ rows: rawRows, runnerCounts });
  if (!selection) return null;
  return {
    ...base,
    gameId: 'quintuple-plus',
    betType: selection.betType,
    equivalentBets: selection.equivalentBets,
    selection: { rows: selection.rows, runnerCounts: selection.runnerCounts },
    columns: [{
      ...(play.columns?.[0] || {}),
      id: play.columns?.[0]?.id || createId('column'),
      index: 1,
      rows: selection.rows,
      isSystem: selection.betType === 'multiple',
      status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    }],
  };
}
