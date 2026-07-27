import { GAMES, getGameConfig } from './gameConfig.js';
import { toLocalDateKey } from './drawSchedule.js';

export function sanitizeColumn(gameId, column, fallbackIndex = 1) {
  const game = GAMES[gameId];
  if (!game || !column || typeof column !== 'object') return null;
  const sourceNumbers = column.numbers || column.ticket;
  if (!Array.isArray(sourceNumbers)) return null;
  const numbers = [...new Set(sourceNumbers.map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
  if (numbers.length !== game.numbersToPick || numbers.some(number => number < 1 || number > game.numberPoolMax)) return null;
  const extra = Number(column.extra);
  if (!Number.isInteger(extra) || extra < game.extra.min || extra > game.extra.max) return null;
  return {
    ...column,
    id: typeof column.id === 'string' ? column.id : crypto.randomUUID(),
    index: Number(column.index) || fallbackIndex,
    numbers,
    extra,
    status: column.status === 'checked' ? 'checked' : 'draft',
  };
}

export function migrateLegacyTicket(ticket) {
  if (!ticket || typeof ticket !== 'object' || !GAMES[ticket.gameId]) return null;
  const column = sanitizeColumn(ticket.gameId, {
    id: ticket.columnId || ticket.id,
    numbers: ticket.ticket,
    extra: ticket.extra,
    status: ticket.status,
    result: ticket.result,
    prizeCategory: ticket.prizeCategory,
    matches: ticket.matches,
    payoutType: ticket.payoutType,
    prizeDisplay: ticket.prizeDisplay,
    officialPrize: ticket.officialPrize,
    extraMatch: ticket.extraMatch,
    complementaryMatch: ticket.complementaryMatch,
  });
  if (!column) return null;
  const purchased = Boolean(ticket.purchased ?? ticket.status !== 'draft');
  return {
    id: typeof ticket.id === 'string' ? ticket.id : crypto.randomUUID(),
    gameId: ticket.gameId,
    columns: [column],
    ...(ticket.gameId === 'primitiva' ? { receiptExtra: column.extra } : {}),
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
  if (!Array.isArray(play.columns)) return migrateLegacyTicket(play);
  const game = GAMES[play.gameId];
  let columns = play.columns.map((column, index) => sanitizeColumn(play.gameId, column, index + 1)).filter(Boolean).slice(0, game.maxSimpleBets || 1);
  if (!columns.length) return null;

  let receiptExtra;
  let rulesMigrationWarning = false;
  if (game.extra.scope === 'receipt') {
    const candidate = Number(play.receiptExtra);
    const validCandidate = Number.isInteger(candidate) && candidate >= game.extra.min && candidate <= game.extra.max;
    const distinctExtras = [...new Set(columns.map(column => column.extra))];
    receiptExtra = validCandidate ? candidate : distinctExtras[0];
    rulesMigrationWarning = !validCandidate && distinctExtras.length > 1;
    columns = columns.map(column => ({ ...column, extra: receiptExtra }));
  }

  const purchased = Boolean(play.purchased ?? play.status !== 'draft');
  return {
    ...play,
    id: typeof play.id === 'string' ? play.id : crypto.randomUUID(),
    gameId: play.gameId,
    columns,
    ...(game.extra.scope === 'receipt' ? { receiptExtra } : {}),
    metadata: rulesMigrationWarning
      ? { ...(play.metadata || {}), rulesMigrationWarning: 'La vecchia versione conteneva più reintegri. È stato mantenuto il primo: verifica il resguardo originale.' }
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

export function playCost(play) {
  return getGameConfig(play.gameId).price * (play.columns?.length || 0);
}

export function playKnownPrize(play) {
  const columnPrizes = (play.columns || []).reduce((sum, column) => sum + (typeof column.officialPrize === 'number' ? column.officialPrize : 0), 0);
  const receiptPrize = typeof play.receiptPrize?.officialAmount === 'number' ? play.receiptPrize.officialAmount : 0;
  return columnPrizes + receiptPrize;
}

export function playUnknownPrizeCount(play) {
  return (play.columns || []).filter(column => column.status === 'checked' && column.prizeCategory && column.officialPrize == null).length;
}
