import { GAMES, getGameConfig } from './gameConfig.js';
import { toLocalDateKey } from './drawSchedule.js';
import { bonolotoEquivalentBets, isBonolotoSystemSize } from './bonoloto.js';
import { gordoEquivalentBets, isGordoSystemSize } from './gordoPrimitiva.js';
import { sanitizeNationalPlay } from './nationalLottery.js';
import { sanitizeQuinielaPlay } from '../sports/quinielaPlay.js';

function sanitizeSecondaryNumbers(game, column) {
  if (!game.secondary) return null;
  const source = column.secondaryNumbers || column.stars || column.extras;
  if (!Array.isArray(source)) return null;
  const values = [...new Set(source.map(Number).filter(Number.isInteger))].sort((left, right) => left - right);
  if (values.length !== game.secondary.count) return null;
  if (values.some(value => value < game.secondary.min || value > game.secondary.max)) return null;
  return values;
}


function receiptExtraValue(value, game) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= game.extra.min && number <= game.extra.max ? number : null;
}

function sanitizeNumbers(source, { count, min = 1, max }) {
  if (!Array.isArray(source)) return null;
  const numbers = [...new Set(source.map(Number).filter(Number.isInteger))].sort((left, right) => left - right);
  if (numbers.length !== count || numbers.some(number => number < min || number > max)) return null;
  return numbers;
}

export function sanitizeColumn(gameId, column, fallbackIndex = 1, { system = false } = {}) {
  const game = GAMES[gameId];
  if (!game || !column || typeof column !== 'object') return null;
  const expectedCount = system ? Number(column.numbers?.length || column.ticket?.length) : game.numbersToPick;
  const numbers = sanitizeNumbers(column.numbers || column.ticket, { count: expectedCount, max: game.numberPoolMax });
  if (!numbers) return null;

  let supplement = {};
  if (game.secondary) {
    const secondaryNumbers = sanitizeSecondaryNumbers(game, column);
    if (!secondaryNumbers) return null;
    supplement = { secondaryNumbers };
  } else if (game.extra?.scope === 'column') {
    const extra = Number(column.extra);
    if (!Number.isInteger(extra) || extra < game.extra.min || extra > game.extra.max) return null;
    supplement = { extra };
  } else if (game.extra?.scope === 'receipt') {
    const extra = Number(column.extra);
    if (Number.isInteger(extra) && extra >= game.extra.min && extra <= game.extra.max) supplement = { extra };
  }

  return {
    ...column,
    id: typeof column.id === 'string' ? column.id : crypto.randomUUID(),
    index: Number(column.index) || fallbackIndex,
    numbers,
    ...supplement,
    ...(system ? { isSystem: true } : {}),
    status: column.status === 'checked' ? 'checked' : 'draft',
  };
}

function sanitizeBonolotoMultiple(play) {
  const game = GAMES.bonoloto;
  const selection = sanitizeNumbers(play.systemSelection || play.columns?.[0]?.numbers, {
    count: Number(play.systemSize || play.systemSelection?.length || play.columns?.[0]?.numbers?.length),
    max: game.numberPoolMax,
  });
  if (!selection || !isBonolotoSystemSize(selection.length)) return null;
  const equivalentBets = bonolotoEquivalentBets(selection.length);
  const column = sanitizeColumn('bonoloto', {
    ...(play.columns?.[0] || {}),
    numbers: selection,
    isSystem: true,
  }, 1, { system: true });
  if (!column) return null;
  return { selection, equivalentBets, column };
}

function sanitizeGordoMultiple(play) {
  const game = GAMES.gordoprimitiva;
  const selection = sanitizeNumbers(play.systemSelection || play.columns?.[0]?.numbers, {
    count: Number(play.systemSize || play.systemSelection?.length || play.columns?.[0]?.numbers?.length),
    max: game.numberPoolMax,
  });
  if (!selection || !isGordoSystemSize(selection.length)) return null;
  const equivalentBets = gordoEquivalentBets(selection.length);
  const column = sanitizeColumn('gordoprimitiva', {
    ...(play.columns?.[0] || {}),
    numbers: selection,
    isSystem: true,
  }, 1, { system: true });
  if (!column) return null;
  return { selection, equivalentBets, column };
}

export function migrateLegacyTicket(ticket) {
  if (!ticket || typeof ticket !== 'object' || !GAMES[ticket.gameId]) return null;
  const column = sanitizeColumn(ticket.gameId, {
    id: ticket.columnId || ticket.id,
    numbers: ticket.ticket,
    extra: ticket.extra,
    secondaryNumbers: ticket.secondaryNumbers || ticket.stars || ticket.extras,
    status: ticket.status,
    result: ticket.result,
    prizeCategory: ticket.prizeCategory,
    matches: ticket.matches,
    secondaryMatches: ticket.secondaryMatches,
    payoutType: ticket.payoutType,
    prizeDisplay: ticket.prizeDisplay,
    officialPrize: ticket.officialPrize,
    extraMatch: ticket.extraMatch,
    complementaryMatch: ticket.complementaryMatch,
  });
  if (!column) return null;
  const game = GAMES[ticket.gameId];
  const purchased = Boolean(ticket.purchased ?? ticket.status !== 'draft');
  const receiptExtra = game.extra?.scope === 'receipt' ? receiptExtraValue(ticket.receiptExtra ?? ticket.extra, game) : undefined;
  if (purchased && game.extra?.scope === 'receipt' && receiptExtra == null) return null;
  return {
    id: typeof ticket.id === 'string' ? ticket.id : crypto.randomUUID(),
    gameId: ticket.gameId,
    betType: 'simple',
    equivalentBets: 1,
    columns: [{ ...column, ...(receiptExtra != null ? { extra: receiptExtra } : {}) }],
    ...(game.extra?.scope === 'receipt' ? { receiptExtra: receiptExtra ?? null } : {}),
    createdAt: ticket.createdAt || new Date().toISOString(),
    purchasedAt: purchased ? (ticket.purchasedAt || ticket.createdAt || new Date().toISOString()) : undefined,
    drawDateISO: ticket.drawDateISO,
    drawDateTimeISO: ticket.drawDateTimeISO || ticket.drawDateISO,
    drawDateKey: ticket.drawDateKey || toLocalDateKey(ticket.drawDateISO),
    checkableFromISO: ticket.checkableFromISO,
    method: ticket.method || 'legacy-single-column',
    metadata: ticket.metadata || {},
    purchased,
    status: ticket.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    checkedAt: ticket.checkedAt,
    result: ticket.result,
  };
}

export function sanitizePlay(play) {
  if (!play || typeof play !== 'object' || !GAMES[play.gameId]) return null;
  if (play.gameId === 'loteria-nacional') return sanitizeNationalPlay(play);
  if (play.gameId === 'quiniela') return sanitizeQuinielaPlay(play);
  if (!Array.isArray(play.columns)) return migrateLegacyTicket(play);
  const game = GAMES[play.gameId];
  const purchased = Boolean(play.purchased ?? play.status !== 'draft');

  if (play.gameId === 'bonoloto' && play.betType === 'multiple') {
    const system = sanitizeBonolotoMultiple(play);
    if (!system) return null;
    const receiptExtra = receiptExtraValue(play.receiptExtra, game);
    const validExtra = receiptExtra != null;
    if (purchased && !validExtra) return null;
    return {
      ...play,
      id: typeof play.id === 'string' ? play.id : crypto.randomUUID(),
      gameId: 'bonoloto',
      betType: 'multiple',
      systemSelection: system.selection,
      systemSize: system.selection.length,
      equivalentBets: system.equivalentBets,
      columns: [{ ...system.column, ...(validExtra ? { extra: receiptExtra } : {}) }],
      receiptExtra: validExtra ? receiptExtra : null,
      metadata: play.metadata || {},
      purchased,
      purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
      status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
      drawDateKey: play.drawDateKey || toLocalDateKey(play.drawDateISO),
    };
  }

  if (play.gameId === 'gordoprimitiva' && play.betType === 'multiple') {
    const system = sanitizeGordoMultiple(play);
    if (!system) return null;
    return {
      ...play,
      id: typeof play.id === 'string' ? play.id : crypto.randomUUID(),
      gameId: 'gordoprimitiva',
      betType: 'multiple',
      systemSelection: system.selection,
      systemSize: system.selection.length,
      equivalentBets: system.equivalentBets,
      columns: [system.column],
      metadata: play.metadata || {},
      purchased,
      purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
      status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
      drawDateKey: play.drawDateKey || toLocalDateKey(play.drawDateISO),
    };
  }

  let columns = play.columns
    .map((column, index) => sanitizeColumn(play.gameId, column, index + 1))
    .filter(Boolean)
    .slice(0, game.maxSimpleBets || 1);
  if (!columns.length) return null;
  if (game.minSimpleBets && columns.length < game.minSimpleBets) return null;

  let receiptExtra;
  let rulesMigrationWarning = false;
  if (game.extra?.scope === 'receipt') {
    const candidate = receiptExtraValue(play.receiptExtra, game);
    const validCandidate = candidate != null;
    const distinctExtras = [...new Set(columns.map(column => column.extra).filter(Number.isInteger))];
    receiptExtra = validCandidate ? candidate : distinctExtras[0];
    if (purchased && receiptExtra == null) return null;
    rulesMigrationWarning = game.id === 'primitiva' && !validCandidate && distinctExtras.length > 1;
    columns = columns.map(column => ({
      ...column,
      ...(receiptExtra != null ? { extra: receiptExtra } : {}),
    }));
  }

  return {
    ...play,
    id: typeof play.id === 'string' ? play.id : crypto.randomUUID(),
    gameId: play.gameId,
    betType: 'simple',
    equivalentBets: columns.length,
    columns,
    ...(game.extra?.scope === 'receipt' ? { receiptExtra: receiptExtra ?? null } : {}),
    metadata: rulesMigrationWarning
      ? { ...(play.metadata || {}), rulesMigrationWarning: 'La versión anterior contenía varios reintegros. Se ha conservado el primero: comprueba el resguardo original.' }
      : (play.metadata || {}),
    purchased,
    purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    drawDateKey: play.drawDateKey || toLocalDateKey(play.drawDateISO),
  };
}

export function sanitizePlays(raw) {
  const source = Array.isArray(raw) ? raw : Array.isArray(raw?.plays) ? raw.plays : Array.isArray(raw?.tickets) ? raw.tickets : [];
  return source.map(sanitizePlay).filter(Boolean).slice(0, 500);
}

export function playBetCount(play) {
  if (play?.gameId === 'quiniela') return 1;
  if (play?.gameId === 'loteria-nacional') return Math.max(1, Number(play.ticketQuantity) || 1);
  return play?.betType === 'multiple'
    ? Number(play.equivalentBets || (play.gameId === 'gordoprimitiva' ? gordoEquivalentBets(play.systemSize) : bonolotoEquivalentBets(play.systemSize))) || 0
    : (play?.columns?.length || 0);
}

export function playCost(play) {
  if (play?.gameId === 'loteria-nacional') return Math.max(0, Number(play.pricePerDecimo) || 0) * playBetCount(play);
  return getGameConfig(play.gameId).price * playBetCount(play) * Math.max(1, Number(play.drawCount) || 1);
}

export function playKnownPrize(play) {
  const columnPrizes = (play.columns || []).reduce((sum, column) => sum + (typeof column.officialPrize === 'number' ? column.officialPrize : 0), 0);
  const receiptPrize = typeof play.receiptPrize?.officialAmount === 'number' ? play.receiptPrize.officialAmount : 0;
  return columnPrizes + receiptPrize;
}

export function playUnknownPrizeCount(play) {
  return (play.columns || []).filter(column => column.status === 'checked' && column.prizeCategory && column.officialPrize == null).length;
}
