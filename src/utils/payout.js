import { getGameConfig } from './gameConfig.js';

function countMatches(left, right) {
  const set = new Set((right || []).map(Number));
  return (left || []).filter(number => set.has(Number(number))).length;
}

function normalizeCategory(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s/g, '');
}

function findOfficialPrize(results, keys = []) {
  const tiers = Array.isArray(results.prizes) ? results.prizes : [];
  const normalized = keys.map(normalizeCategory);
  const tier = tiers.find(candidate => {
    const haystack = normalizeCategory([candidate.category, candidate.match, candidate.name, candidate.label].filter(Boolean).join(' '));
    return normalized.some(key => haystack.includes(key));
  });
  const amount = Number(tier?.prize ?? tier?.amount ?? tier?.prizeAmount);
  return Number.isFinite(amount) ? amount : null;
}

function result(category, matches, amount = null, displayText = null, payoutType = 'variable', extra = {}) {
  return {
    category,
    matches,
    officialAmount: amount,
    displayText: displayText || (amount != null ? `${amount.toFixed(2)} €` : 'Importe oficial no disponible'),
    payoutType,
    ...extra,
  };
}

function euroDreams(ticket, results) {
  const matches = countMatches(ticket.ticket, results.winningNumbers);
  const dream = Number(ticket.extra) === Number(results.extra);
  if (matches === 6 && dream) return result('1.ª categoría (6 + Sueño)', matches, null, '20.000 € al mes durante 30 años', 'deferred', { extraMatch: true });
  if (matches === 6) return result('2.ª categoría (6 números)', matches, null, '2.000 € al mes durante 5 años', 'deferred');
  const map = {
    5: ['3.ª categoría (5 números)', ['3', '5']],
    4: ['4.ª categoría (4 números)', ['4']],
    3: ['5.ª categoría (3 números)', ['5']],
    2: ['6.ª categoría (2 números)', ['6']],
  };
  if (map[matches]) {
    const amount = findOfficialPrize(results, map[matches][1]);
    return result(map[matches][0], matches, amount, null, amount == null ? 'variable' : 'cash', { extraMatch: dream });
  }
  return result(null, matches, 0, 'Sin premio', 'cash', { extraMatch: dream });
}

function primitiva(ticket, results, { includeStandaloneReintegro = true } = {}) {
  const matches = countMatches(ticket.ticket, results.winningNumbers);
  const complementary = Number(results.complementary);
  const complementaryMatch = matches === 5 && (ticket.ticket || []).some(number => Number(number) === complementary);
  const reintegro = Number(ticket.extra) === Number(results.extra);
  if (matches === 6 && reintegro) return result('Especial (6 + Reintegro)', matches, findOfficialPrize(results, ['especial', '6+r']), 'Premio variable', 'variable', { extraMatch: true });
  if (matches === 6) return result('1.ª categoría (6 números)', matches, findOfficialPrize(results, ['1', '6']), 'Premio variable', 'variable');
  if (complementaryMatch) return result('2.ª categoría (5 + Complementario)', matches, findOfficialPrize(results, ['2', '5+c']), 'Premio variable', 'variable', { complementaryMatch: true });
  if (matches === 5) return result('3.ª categoría (5 números)', matches, findOfficialPrize(results, ['3', '5']), 'Premio variable', 'variable');
  if (matches === 4) return result('4.ª categoría (4 números)', matches, findOfficialPrize(results, ['4']), 'Premio variable', 'variable');
  if (matches === 3) return result('5.ª categoría (3 números)', matches, findOfficialPrize(results, ['5', '3']), '8,00 €', 'cash');
  if (includeStandaloneReintegro && reintegro) return result('Reintegro', matches, findOfficialPrize(results, ['reintegro']) ?? 1, '1,00 €', 'cash', { extraMatch: true });
  return result(null, matches, 0, 'Sin premio', 'cash', { extraMatch: reintegro });
}

const EUROMILLONES_CATEGORIES = new Map([
  ['5+2', { number: 1, label: '1.ª categoría (5 + 2 estrellas)' }],
  ['5+1', { number: 2, label: '2.ª categoría (5 + 1 estrella)' }],
  ['5+0', { number: 3, label: '3.ª categoría (5 + 0 estrellas)' }],
  ['4+2', { number: 4, label: '4.ª categoría (4 + 2 estrellas)' }],
  ['4+1', { number: 5, label: '5.ª categoría (4 + 1 estrella)' }],
  ['3+2', { number: 6, label: '6.ª categoría (3 + 2 estrellas)' }],
  ['4+0', { number: 7, label: '7.ª categoría (4 + 0 estrellas)' }],
  ['2+2', { number: 8, label: '8.ª categoría (2 + 2 estrellas)' }],
  ['3+1', { number: 9, label: '9.ª categoría (3 + 1 estrella)' }],
  ['3+0', { number: 10, label: '10.ª categoría (3 + 0 estrellas)' }],
  ['1+2', { number: 11, label: '11.ª categoría (1 + 2 estrellas)' }],
  ['2+1', { number: 12, label: '12.ª categoría (2 + 1 estrella)' }],
  ['2+0', { number: 13, label: '13.ª categoría (2 + 0 estrellas)' }],
]);

function euromillones(ticket, results) {
  const matches = countMatches(ticket.ticket, results.winningNumbers);
  const secondaryMatches = countMatches(ticket.secondaryNumbers, results.secondaryNumbers);
  const category = EUROMILLONES_CATEGORIES.get(`${matches}+${secondaryMatches}`);
  if (!category) return result(null, matches, 0, 'Sin premio', 'cash', { secondaryMatches });
  const amount = findOfficialPrize(results, [
    `${category.number}ª`,
    `${matches}+${secondaryMatches}`,
    `${matches}aciertos+${secondaryMatches}estrellas`,
    category.label,
  ]);
  return result(category.label, matches, amount, amount == null ? 'Premio variable' : null, amount == null ? 'variable' : 'cash', { secondaryMatches });
}

export function calculatePayout(ticket, results) {
  if (ticket.gameId === 'primitiva') return primitiva(ticket, results);
  if (ticket.gameId === 'euromillones') return euromillones(ticket, results);
  return euroDreams(ticket, results);
}

export function calculatePlayPayout(play, results) {
  const game = getGameConfig(play.gameId);
  if (play.gameId !== 'primitiva') {
    return {
      columns: (play.columns || []).map(column => calculatePayout({
        gameId: play.gameId,
        ticket: column.numbers,
        extra: column.extra,
        secondaryNumbers: column.secondaryNumbers,
      }, results)),
      receiptPrize: null,
    };
  }

  const receiptExtra = Number(play.receiptExtra ?? play.columns?.[0]?.extra);
  const columns = (play.columns || []).map(column => primitiva({ gameId: play.gameId, ticket: column.numbers, extra: receiptExtra }, results, { includeStandaloneReintegro: false }));
  const extraMatch = Number.isInteger(receiptExtra) && receiptExtra === Number(results.extra);
  const amount = game.price * (play.columns?.length || 0);
  return {
    columns,
    receiptPrize: extraMatch ? {
      category: 'Reintegro del resguardo',
      officialAmount: amount,
      displayText: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount),
      payoutType: 'cash',
      extraMatch: true,
    } : null,
  };
}
