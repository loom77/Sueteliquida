import { getGameConfig } from './gameConfig.js';

export const APP_TIME_ZONE = 'Europe/Madrid';
const pad = number => String(number).padStart(2, '0');
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23', weekday: 'short',
});

function zonedParts(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const values = Object.fromEntries(partsFormatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return {
    year: Number(values.year), month: Number(values.month), day: Number(values.day),
    hour: Number(values.hour), minute: Number(values.minute), second: Number(values.second),
    weekday: WEEKDAYS[values.weekday],
  };
}

function zoneOffsetMs(instant) {
  const parts = zonedParts(instant);
  if (!parts) return 0;
  const representedAsUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return representedAsUTC - Math.floor(instant.getTime() / 1000) * 1000;
}

export function madridDateFromParts({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  const wallTimeUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  let candidate = wallTimeUTC;
  for (let index = 0; index < 4; index += 1) {
    const next = wallTimeUTC - zoneOffsetMs(new Date(candidate));
    if (Math.abs(next - candidate) < 1000) break;
    candidate = next;
  }
  return new Date(candidate);
}

function shiftCalendarDate({ year, month, day }, days) {
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

function dateKeyFromParts(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function toLocalDateKey(value) {
  const parts = zonedParts(value);
  return parts ? dateKeyFromParts(parts) : '';
}

export function monthKeyMadrid(value = new Date()) {
  const parts = zonedParts(value);
  return parts ? `${parts.year}-${pad(parts.month)}` : '';
}

function weekdayForCalendarDate(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0)).getUTCDay();
}

function instantForDateAndTime(dateParts, time) {
  return madridDateFromParts({ ...dateParts, hour: time.hour, minute: time.minute || 0, second: 0 });
}

export function drawInfoForDate(gameId, dateKey) {
  const game = getGameConfig(gameId);
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (![year, month, day].every(Number.isInteger)) return null;
  const calendarDate = { year, month, day };
  const weekday = weekdayForCalendarDate(calendarDate);
  const national = gameId === 'loteria-nacional';
  const drawTime = national && weekday === 6 ? { hour: 13, minute: 0 } : game.drawTime;
  const salesTime = national && weekday === 6 ? { hour: 12, minute: 30 } : (game.salesCloseTime || drawTime);
  const publicationTime = national && weekday === 6 ? { hour: 13, minute: 45 } : (game.resultPublicationTime || drawTime);
  const draw = instantForDateAndTime(calendarDate, drawTime);
  const salesClose = instantForDateAndTime(calendarDate, salesTime);
  const publication = instantForDateAndTime(calendarDate, publicationTime);
  const checkable = publication > draw ? publication : new Date(draw.getTime() + (game.resultDelayMinutes || 20) * 60_000);
  return {
    drawDateISO: draw.toISOString(),
    drawDateTimeISO: draw.toISOString(),
    drawDateKey: dateKeyFromParts(calendarDate),
    salesCloseISO: salesClose.toISOString(),
    resultPublicationISO: publication.toISOString(),
    checkableFromISO: checkable.toISOString(),
    timeZone: APP_TIME_ZONE,
  };
}

export function getNextDrawInfo(gameId, from = new Date()) {
  const game = getGameConfig(gameId);
  const local = zonedParts(from);
  if (!local) return drawInfoForDate(gameId, toLocalDateKey(new Date()));
  let calendarDate = { year: local.year, month: local.month, day: local.day };
  let candidate = drawInfoForDate(gameId, dateKeyFromParts(calendarDate));

  if (!(game.drawDays.includes(local.weekday) && from < new Date(candidate.drawDateTimeISO))) {
    do {
      calendarDate = shiftCalendarDate(calendarDate, 1);
    } while (!game.drawDays.includes(weekdayForCalendarDate(calendarDate)));
    candidate = drawInfoForDate(gameId, dateKeyFromParts(calendarDate));
  }
  return candidate;
}

export function formatDrawDate(iso, options = {}) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: APP_TIME_ZONE,
    weekday: options.short ? 'short' : 'long',
    day: 'numeric',
    month: options.short ? 'short' : 'long',
    year: options.includeYear === false ? undefined : 'numeric',
  }).format(date);
}

export function formatDrawTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { timeZone: APP_TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatSyncTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { timeZone: APP_TIME_ZONE, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatCountdown(targetISO, now = new Date()) {
  const target = new Date(targetISO);
  const delta = target.getTime() - now.getTime();
  if (!Number.isFinite(delta) || delta <= 0) return 'en curso';
  const totalMinutes = Math.floor(delta / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export function isCheckable(ticket, now = new Date()) {
  return !ticket.checkableFromISO || now >= new Date(ticket.checkableFromISO);
}
