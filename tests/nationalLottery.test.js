import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNationalLotteryPayout,
  createNationalPlay,
  generateNationalNumber,
  getNationalDrawInfo,
  getUpcomingNationalDraws,
  normalizeNationalNumber,
  sanitizeNationalPlay,
} from '../src/utils/nationalLottery.js';
import { playBetCount, playCost, sanitizePlay } from '../src/utils/playModel.js';

const draw = getNationalDrawInfo('2026-08-01', { drawName: 'Extra de Agosto', pricePerDecimo: 15, drawHour: 13, drawMinute: 0 });

test('Lotería Nacional conserva ceros iniciales y completa solo las cifras vacías', () => {
  assert.equal(normalizeNationalNumber('00742'), '00742');
  assert.equal(normalizeNationalNumber('07*4', { allowPattern: true }), '07*4*');
  const generated = generateNationalNumber('00***');
  assert.match(generated, /^00\d{3}$/);
});

test('crea un décimo de Lotería Nacional con sorteo y coste dinámico', () => {
  const play = createNationalPlay({ draw, number: '00742', ticketQuantity: 3 });
  assert.equal(play.gameId, 'loteria-nacional');
  assert.equal(play.nationalNumber, '00742');
  assert.equal(play.ticketQuantity, 3);
  assert.equal(play.pricePerDecimo, 15);
  assert.equal(playCost(play), 45);
  assert.equal(playBetCount(play), 3);
});

test('sanitiza décimos sin convertir el número a entero', () => {
  const play = sanitizeNationalPlay({
    id: 'lnac-1', gameId: 'loteria-nacional', nationalNumber: '00019', ticketQuantity: 2,
    pricePerDecimo: 6, columns: [{ number: '00019', quantity: 2 }], purchased: true, drawDateKey: '2026-08-08',
  });
  assert.equal(play.nationalNumber, '00019');
  assert.equal(play.columns[0].number, '00019');
  assert.equal(sanitizePlay(play).nationalNumber, '00019');
});

test('calcula premios exactos, reintegros y cantidad de décimos', () => {
  const play = createNationalPlay({ draw, number: '70334', ticketQuantity: 2, series: 6, fraction: 1 });
  const settlement = calculateNationalLotteryPayout(play, {
    metadata: { nationalCompleteness: 'summary', specialPrize: { number: '70334', series: 6, fraction: 1 } },
    prizes: [
      { type: 'exact', category: '1er Premio', number: '70334', amount: 200000 },
      { type: 'special', category: 'Premio Especial', number: '70334', series: 6, fraction: 1, amount: 20000000 },
      { type: 'refund', category: 'Reintegro 4', value: '4', amount: 20 },
    ],
  });
  assert.match(settlement.columns[0].category, /1er Premio/);
  assert.match(settlement.columns[0].category, /Premio Especial/);
  assert.doesNotMatch(settlement.columns[0].category, /Reintegro/);
  assert.equal(settlement.columns[0].officialAmount, (200000 + 20000000) * 2);
});

test('no inventa un cero cuando falta el listado oficial completo', () => {
  const play = createNationalPlay({ draw, number: '12345', ticketQuantity: 1 });
  const settlement = calculateNationalLotteryPayout(play, { metadata: { nationalCompleteness: 'summary' }, prizes: [] });
  assert.equal(settlement.columns[0].officialAmount, null);
  assert.match(settlement.columns[0].displayText, /Pendiente/);
});

test('genera próximos sorteos incluyendo jueves y sábado con precios distintos', () => {
  const draws = getUpcomingNationalDraws(new Date('2026-07-31T10:00:00Z'), 4);
  assert.equal(draws[0].drawDateKey, '2026-08-01');
  assert.equal(draws[0].pricePerDecimo, 15);
  assert.ok(draws.some(item => item.drawType === 'ordinary-thursday' && item.pricePerDecimo === 3));
  assert.ok(draws.some(item => item.drawType === 'ordinary-saturday' && item.pricePerDecimo === 6));
});


test('la lista completa acumula aproximación, centena, terminaciones y reintegros sin duplicar un premio exacto', () => {
  const play = createNationalPlay({ draw, number: '77013', ticketQuantity: 1 });
  const settlement = calculateNationalLotteryPayout(play, {
    metadata: { nationalCompleteness: 'full-list' },
    prizes: [
      { type: 'exact', category: '1er Premio', number: '77014', amount: 30000 },
      { type: 'approximation', category: 'Aproximación al 1er Premio', number: '77014', amount: 1200 },
      { type: 'hundred', category: 'Centena 770', value: '770', amount: 30 },
      { type: 'ending', category: 'Terminación 14', value: '14', digits: 2, amount: 6 },
      { type: 'refund', category: 'Reintegro 3', value: '3', amount: 3 },
    ],
  });
  assert.equal(settlement.columns[0].officialAmount, 1233);
  assert.match(settlement.columns[0].category, /Aproximación/);
  assert.match(settlement.columns[0].category, /Centena/);
});
