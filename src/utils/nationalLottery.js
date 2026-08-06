import { madridDateFromParts, toLocalDateKey } from './drawSchedule.js';

const SPECIAL_DRAWS = Object.freeze({
  '2026-08-01': { drawName: 'Extra de Agosto', drawType: 'special-saturday', pricePerDecimo: 15, drawHour: 13, drawMinute: 0 },
  '2026-12-22': { drawName: 'Sorteo de Navidad', drawType: 'christmas', pricePerDecimo: 20, drawHour: 9, drawMinute: 0 },
  '2027-01-06': { drawName: 'Sorteo de El Niño', drawType: 'el-nino', pricePerDecimo: 20, drawHour: 12, drawMinute: 0 },
});

const pad2 = value => String(value).padStart(2, '0');

export function normalizeNationalNumber(value, { allowPattern = false } = {}) {
  const source = String(value ?? '').trim().replace(/\s/g, '');
  const allowed = allowPattern ? /[^0-9*]/g : /\D/g;
  const cleaned = source.replace(allowed, '').slice(0, 5);
  if (allowPattern) return cleaned.padEnd(5, '*');
  return /^\d{5}$/.test(cleaned) ? cleaned : '';
}

function secureDigit() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 10);
}

export function generateNationalNumber(pattern = '*****') {
  const normalized = normalizeNationalNumber(pattern, { allowPattern: true });
  return normalized.replace(/\*/g, secureDigit);
}

export function nationalNumberDigits(number) {
  return normalizeNationalNumber(number).split('');
}

function calendarParts(date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function dateKey(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function infoForDate(key, override = null) {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const defaultInfo = weekday === 4
    ? { drawName: 'Sorteo del jueves', drawType: 'ordinary-thursday', pricePerDecimo: 3, drawHour: 21, drawMinute: 0 }
    : { drawName: 'Sorteo del sábado', drawType: 'ordinary-saturday', pricePerDecimo: 6, drawHour: 13, drawMinute: 0 };
  const info = { ...defaultInfo, ...(override || SPECIAL_DRAWS[key] || {}) };
  const draw = madridDateFromParts({ year, month, day, hour: info.drawHour, minute: info.drawMinute });
  const salesClose = new Date(draw.getTime() - 30 * 60_000);
  const publication = new Date(draw.getTime() + 45 * 60_000);
  return {
    id: `lnac-${key}`,
    gameId: 'loteria-nacional',
    drawDateKey: key,
    drawDateISO: draw.toISOString(),
    drawDateTimeISO: draw.toISOString(),
    salesCloseISO: salesClose.toISOString(),
    resultPublicationISO: publication.toISOString(),
    checkableFromISO: publication.toISOString(),
    timeZone: 'Europe/Madrid',
    drawName: info.drawName,
    drawType: info.drawType,
    pricePerDecimo: info.pricePerDecimo,
  };
}

export function getNationalDrawInfo(dateKey, overrides = {}) {
  return infoForDate(dateKey, overrides);
}

export function getUpcomingNationalDraws(from = new Date(), count = 6) {
  const today = toLocalDateKey(from);
  const [year, month, day] = today.split('-').map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day, 12));
  const draws = [];
  for (let offset = 0; offset < 180 && draws.length < count; offset += 1) {
    const current = new Date(cursor);
    current.setUTCDate(cursor.getUTCDate() + offset);
    const parts = calendarParts(current);
    const key = dateKey(parts);
    const weekday = current.getUTCDay();
    const special = SPECIAL_DRAWS[key];
    if (!special && weekday !== 4 && weekday !== 6) continue;
    const info = infoForDate(key, special);
    if (new Date(info.salesCloseISO) <= from) continue;
    draws.push(info);
  }
  return draws;
}

export function sanitizeNationalPlay(play) {
  if (!play || play.gameId !== 'loteria-nacional') return null;
  const number = normalizeNationalNumber(play.nationalNumber ?? play.number ?? play.columns?.[0]?.number);
  if (!number) return null;
  const quantity = Math.max(1, Math.min(10, Number(play.ticketQuantity ?? play.decimos ?? play.columns?.[0]?.quantity) || 1));
  const price = Math.max(0, Number(play.pricePerDecimo ?? play.unitPrice) || 0);
  const purchased = Boolean(play.purchased ?? play.status !== 'draft');
  const seriesRaw = play.series ?? play.columns?.[0]?.series;
  const fractionRaw = play.fraction ?? play.columns?.[0]?.fraction;
  const series = seriesRaw == null || seriesRaw === '' ? null : Math.max(1, Number(seriesRaw) || 1);
  const fraction = fractionRaw == null || fractionRaw === '' ? null : Math.max(1, Number(fractionRaw) || 1);
  const columnSource = play.columns?.[0] || {};
  return {
    ...play,
    id: typeof play.id === 'string' ? play.id : crypto.randomUUID(),
    gameId: 'loteria-nacional',
    betType: 'national-decimo',
    nationalNumber: number,
    ticketQuantity: quantity,
    pricePerDecimo: price,
    equivalentBets: quantity,
    series,
    fraction,
    columns: [{
      ...columnSource,
      id: typeof columnSource.id === 'string' ? columnSource.id : crypto.randomUUID(),
      index: 1,
      number,
      quantity,
      series,
      fraction,
      status: columnSource.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    }],
    metadata: play.metadata || {},
    purchased,
    purchasedAt: purchased ? (play.purchasedAt || play.createdAt || new Date().toISOString()) : undefined,
    status: play.status === 'checked' ? 'checked' : purchased ? 'scheduled' : 'draft',
    drawDateKey: play.drawDateKey || toLocalDateKey(play.drawDateISO),
  };
}

function normalizePrizeNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? digits.padStart(5, '0').slice(-5) : '';
}

function amountValue(entry) {
  const value = Number(entry?.amount ?? entry?.prize ?? entry?.prizeAmount);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function lastDigitsMatch(number, target, digits) {
  return number.slice(-digits) === String(target ?? '').replace(/\D/g, '').padStart(digits, '0').slice(-digits);
}

export function calculateNationalLotteryPayout(play, draw) {
  const number = normalizeNationalNumber(play.nationalNumber ?? play.number ?? play.columns?.[0]?.number);
  const quantity = Math.max(1, Number(play.ticketQuantity ?? play.columns?.[0]?.quantity) || 1);
  const series = play.series ?? play.columns?.[0]?.series ?? null;
  const fraction = play.fraction ?? play.columns?.[0]?.fraction ?? null;
  const entries = Array.isArray(draw?.prizes) ? draw.prizes : [];
  const matches = [];

  for (const entry of entries) {
    const type = String(entry.type || '').toLowerCase();
    const target = normalizePrizeNumber(entry.number ?? entry.value ?? entry.target);
    let amount = amountValue(entry);
    let hit = false;

    if (type === 'exact' || ['first', 'second', 'third', 'fourth', 'fifth', 'pedrea'].includes(type)) {
      hit = Boolean(target && number === target);
    } else if (type === 'special') {
      hit = Boolean(target && number === target && Number(series) === Number(entry.series) && Number(fraction) === Number(entry.fraction));
    } else if (type === 'approximation') {
      const base = Number(target);
      const candidate = Number(number);
      hit = Number.isInteger(base) && Number.isInteger(candidate) && Math.abs(candidate - base) === 1;
    } else if (type === 'ending' || type === 'extraction') {
      const digits = Math.max(1, Math.min(5, Number(entry.digits) || String(entry.value || '').replace(/\D/g, '').length));
      hit = lastDigitsMatch(number, entry.value ?? entry.number, digits);
    } else if (type === 'refund' || type === 'reintegro') {
      hit = lastDigitsMatch(number, entry.value ?? entry.number, 1);
      if (amount == null) amount = Math.max(0, Number(play.pricePerDecimo) || 0);
    } else if (type === 'hundred') {
      const hundred = String(entry.value ?? entry.number ?? entry.target ?? '').replace(/\D/g, '').slice(0, 3);
      hit = /^\d{3}$/.test(hundred) && number.slice(0, 3) === hundred;
    }

    if (hit) matches.push({
      category: String(entry.category || entry.label || 'Premio'),
      amount,
      type,
    });
  }

  const exactMatches = matches.filter(item => ['exact', 'first', 'second', 'third', 'fourth', 'fifth', 'pedrea'].includes(item.type));
  const specialMatches = matches.filter(item => item.type === 'special');
  // La lista oficial publica importes acumulados para los números completos.
  // Cuando hay un premio exacto, no se vuelven a sumar centenas, terminaciones o reintegros.
  const effectiveMatches = exactMatches.length ? [...exactMatches, ...specialMatches] : matches;
  const hasUnknownAmount = effectiveMatches.some(item => item.amount == null);
  const perDecimo = effectiveMatches.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const officialAmount = hasUnknownAmount ? null : perDecimo * quantity;
  const completeness = draw?.nationalCompleteness || draw?.metadata?.nationalCompleteness || 'summary';
  const incomplete = completeness !== 'full-list';
  const category = effectiveMatches.length ? effectiveMatches.map(item => item.category).join(' · ') : null;
  const displayText = effectiveMatches.length
    ? officialAmount == null ? 'Importe oficial pendiente' : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(officialAmount)
    : incomplete ? 'Pendiente de listado completo' : 'Sin premio';
  const specialPrize = draw?.specialPrize || draw?.metadata?.specialPrize;
  const specialNumber = normalizePrizeNumber(specialPrize?.number);

  return {
    columns: [{
      category,
      matches: effectiveMatches.length,
      officialAmount: effectiveMatches.length ? officialAmount : incomplete ? null : 0,
      displayText,
      payoutType: incomplete && !effectiveMatches.length ? 'pending-official-list' : 'cash',
      nationalMatches: effectiveMatches,
      specialVerificationPending: Boolean(specialPrize && specialNumber === number && (series == null || fraction == null)),
    }],
    receiptPrize: null,
  };
}

export function createNationalPlay({ draw, pattern = '*****', number = '', ticketQuantity = 1, series = null, fraction = null } = {}) {
  const selectedDraw = draw || getUpcomingNationalDraws(new Date(), 1)[0];
  if (!selectedDraw) throw new Error('No hay un sorteo de Lotería Nacional disponible.');
  const nationalNumber = normalizeNationalNumber(number) || generateNationalNumber(pattern);
  const quantity = Math.max(1, Math.min(10, Number(ticketQuantity) || 1));
  const pricePerDecimo = Math.max(0, Number(selectedDraw.pricePerDecimo) || 0);
  return {
    id: crypto.randomUUID(),
    gameId: 'loteria-nacional',
    betType: 'national-decimo',
    nationalNumber,
    ticketQuantity: quantity,
    pricePerDecimo,
    equivalentBets: quantity,
    series: series == null || series === '' ? null : Number(series),
    fraction: fraction == null || fraction === '' ? null : Number(fraction),
    columns: [{
      id: crypto.randomUUID(),
      index: 1,
      number: nationalNumber,
      quantity,
      series: series == null || series === '' ? null : Number(series),
      fraction: fraction == null || fraction === '' ? null : Number(fraction),
      status: 'draft',
    }],
    createdAt: new Date().toISOString(),
    ...selectedDraw,
    method: 'primy-national-number',
    purchased: false,
    status: 'draft',
    metadata: {
      engine: 'Primy Core · Lotería Nacional',
      engineVersion: '15.6-national',
      generationConfig: { mode: number ? 'manual-number' : pattern.includes('*') ? 'partial-random' : 'uniform-number', pattern },
      availabilityNotice: 'Preparar un número no lo reserva ni confirma que esté disponible para comprar.',
      history: { used: false, reason: 'Las estadísticas históricas no modifican la probabilidad futura del número.' },
    },
  };
}
