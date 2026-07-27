import { GAMES } from '../src/utils/gameConfig.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseGame(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return GAMES[key] || null;
}

export function parseYears(value, { fallback = 10, min = 1, max = 10 } = {}) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

export function parseDateList(value, { max = 31 } = {}) {
  const dates = [...new Set(String(value || '').split(',').map(item => item.trim()).filter(Boolean))];
  if (!dates.length || dates.length > max || dates.some(date => !ISO_DATE.test(date))) return null;
  return dates;
}

export function isProviderDrawShape(draw) {
  return Boolean(
    draw && typeof draw === 'object' &&
    typeof draw.date === 'string' && ISO_DATE.test(draw.date) &&
    Array.isArray(draw.winningNumbers)
  );
}
