import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BONOLOTO_SYSTEM_BETS,
  BONOLOTO_SYSTEM_SIZES,
  bonolotoEquivalentBets,
  bonolotoTicketCost,
  expandBonolotoSystem,
} from '../src/utils/bonoloto.js';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';
import { calculatePlayPayout } from '../src/utils/payout.js';
import { playBetCount, playCost, sanitizePlay } from '../src/utils/playModel.js';

test('Bonoloto sencilla genera como mínimo dos apuestas sin inventar el reintegro', () => {
  const play = generateFusionPlay('bonoloto', null, 1, { seed: 'bonoloto-simple-minimum' });
  assert.equal(play.betType, 'simple');
  assert.equal(play.columns.length, 2);
  assert.equal(play.equivalentBets, 2);
  assert.equal(play.receiptExtra, null);
  assert.equal(play.metadata.receiptExtraPending, true);
  for (const column of play.columns) {
    assert.equal(column.numbers.length, 6);
    assert.equal(new Set(column.numbers).size, 6);
    assert.ok(column.numbers.every(number => number >= 1 && number <= 49));
    assert.equal(column.extra, undefined);
  }
  assert.equal(playCost(play), 1);
});

test('Bonoloto sencilla respeta el máximo de ocho apuestas', () => {
  const play = generateFusionPlay('bonoloto', null, 99, { seed: 'bonoloto-simple-maximum' });
  assert.equal(play.columns.length, 8);
  assert.equal(playBetCount(play), 8);
  assert.equal(playCost(play), 4);
});

test('las múltiples oficiales de Bonoloto desarrollan el número exacto de apuestas', () => {
  for (const size of BONOLOTO_SYSTEM_SIZES) {
    const selection = Array.from({ length: size }, (_, index) => index + 1);
    const developed = expandBonolotoSystem(selection);
    assert.equal(developed.length, BONOLOTO_SYSTEM_BETS[size]);
    assert.equal(bonolotoEquivalentBets(size), BONOLOTO_SYSTEM_BETS[size]);
    assert.ok(developed.every(column => column.length === 6 && new Set(column).size === 6));
  }
});

test('la múltiple especial de cinco números los combina con los 44 restantes', () => {
  const selection = [1, 2, 3, 4, 5];
  const developed = expandBonolotoSystem(selection);
  assert.equal(developed.length, 44);
  assert.deepEqual(developed[0], [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(developed.at(-1), [1, 2, 3, 4, 5, 49]);
  assert.ok(developed.every(column => selection.every(number => column.includes(number))));
});

test('el motor conserva una múltiple compacta y calcula su coste real', () => {
  const play = generateFusionPlay('bonoloto', null, 1, {
    seed: 'bonoloto-system-nine',
    betType: 'multiple',
    systemSize: 9,
  });
  assert.equal(play.betType, 'multiple');
  assert.equal(play.systemSelection.length, 9);
  assert.equal(play.columns.length, 1);
  assert.equal(play.equivalentBets, 84);
  assert.equal(playBetCount(play), 84);
  assert.equal(playCost(play), 42);
  assert.equal(bonolotoTicketCost({ betType: 'multiple', systemSize: 9 }), 42);
  assert.equal(play.receiptExtra, null);
});

test('una Bonoloto comprada exige el reintegro real del resguardo', () => {
  const draft = generateFusionPlay('bonoloto', null, 2, { seed: 'bonoloto-purchase-extra' });
  assert.ok(sanitizePlay(draft));
  assert.equal(sanitizePlay({ ...draft, purchased: true, status: 'scheduled' }), null);
  const purchased = sanitizePlay({ ...draft, purchased: true, status: 'scheduled', receiptExtra: 7 });
  assert.equal(purchased.receiptExtra, 7);
  assert.deepEqual(purchased.columns.map(column => column.extra), [7, 7]);
});

test('Bonoloto comprueba complementario, reintegro y categorías simples', () => {
  const draw = {
    winningNumbers: [1, 2, 3, 4, 5, 6],
    complementary: 7,
    extra: 8,
    prizes: [],
  };
  const play = {
    gameId: 'bonoloto',
    betType: 'simple',
    equivalentBets: 2,
    receiptExtra: 8,
    columns: [
      { numbers: [1, 2, 3, 4, 5, 7] },
      { numbers: [1, 2, 3, 20, 21, 22] },
    ],
  };
  const settlement = calculatePlayPayout(play, draw);
  assert.match(settlement.columns[0].category, /5 \+ Complementario/);
  assert.match(settlement.columns[1].category, /3 números/);
  assert.equal(settlement.receiptPrize.officialAmount, 1);
});

test('Bonoloto múltiple evalúa todas las apuestas sin expandirlas en el archivo', () => {
  const play = {
    gameId: 'bonoloto',
    betType: 'multiple',
    systemSelection: [1, 2, 3, 4, 5, 6, 7],
    systemSize: 7,
    equivalentBets: 7,
    receiptExtra: 3,
    columns: [{ numbers: [1, 2, 3, 4, 5, 6, 7], isSystem: true }],
  };
  const draw = {
    winningNumbers: [1, 2, 3, 4, 5, 6],
    complementary: 7,
    extra: 3,
    prizes: [
      { category: '1ª', amount: 1000000 },
      { category: '2ª', amount: 10000 },
    ],
  };
  const settlement = calculatePlayPayout(play, draw);
  assert.equal(settlement.columns.length, 1);
  assert.equal(settlement.columns[0].evaluatedBets, 7);
  assert.equal(settlement.columns[0].breakdown['1.ª categoría (6 números)'], 1);
  assert.equal(settlement.columns[0].breakdown['2.ª categoría (5 + Complementario)'], 6);
  assert.equal(settlement.receiptPrize.officialAmount, 3.5);
});
