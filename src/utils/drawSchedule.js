import { getGameConfig } from './gameConfig.js';
const pad = (n) => String(n).padStart(2, '0');
export function toLocalDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
export function getNextDrawInfo(gameId, from = new Date()) {
  const game = getGameConfig(gameId);
  const cutoffHour = game.drawTimeHour ?? 22;
  const cursor = new Date(from);
  if (game.drawDays.includes(cursor.getDay()) && cursor.getHours() < cutoffHour) {
    // same day draw
  } else {
    cursor.setDate(cursor.getDate() + 1);
    while (!game.drawDays.includes(cursor.getDay())) cursor.setDate(cursor.getDate() + 1);
  }
  cursor.setHours(0,0,0,0);
  const checkable = new Date(cursor); checkable.setHours(cutoffHour,0,0,0);
  return { drawDateISO: cursor.toISOString(), drawDateKey: toLocalDateKey(cursor), checkableFromISO: checkable.toISOString() };
}
export function formatDrawDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(iso));
}
export function isCheckable(ticket, now = new Date()) {
  return !ticket.checkableFromISO || now >= new Date(ticket.checkableFromISO);
}
