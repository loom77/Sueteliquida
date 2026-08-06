import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyLototurfBet,
  lototurfEquivalentBets,
  resolveLototurfHorseSelection,
  sanitizeLototurfSelection,
  validateLototurfSimpleColumns,
} from '../src/horse/lototurfRules.js';

test('Lototurf reproduce la tabla oficial de apuestas múltiples', () => {
  assert.equal(lototurfEquivalentBets(6, 1), 1);
  assert.equal(lototurfEquivalentBets(7, 1), 7);
  assert.equal(lototurfEquivalentBets(8, 1), 28);
  assert.equal(lototurfEquivalentBets(9, 1), 84);
  assert.equal(lototurfEquivalentBets(10, 1), 210);
  assert.equal(lototurfEquivalentBets(6, 4), 4);
  assert.equal(lototurfEquivalentBets(10, 4), 840);
});

test('Lototurf valida apuestas simples y múltiples autorizadas', () => {
  const simple = sanitizeLototurfSelection({ numbers: [1, 4, 9, 13, 21, 31], horse: 7 });
  assert.equal(simple.betType, 'simple');
  assert.equal(simple.equivalentBets, 1);
  assert.equal(simple.cost, 1);

  const multiple = sanitizeLototurfSelection({
    numbers: [1, 4, 6, 9, 13, 18, 21, 24, 27, 31],
    horses: [2, 5, 8, 11],
  });
  assert.equal(multiple.betType, 'multiple');
  assert.equal(multiple.equivalentBets, 840);
  assert.equal(multiple.cost, 840);

  assert.equal(sanitizeLototurfSelection({ numbers: [1, 2, 3, 4, 5], horse: 1 }), null);
  assert.equal(sanitizeLototurfSelection({ numbers: [1, 2, 3, 4, 5, 6], horses: [1, 2, 3, 4, 5] }), null);
});

test('Lototurf admite de una a seis apuestas sencillas por boleto', () => {
  const columns = Array.from({ length: 6 }, (_, index) => ({
    numbers: [1, 2, 3, 4, 5, 6].map(number => number + index),
    horse: index + 1,
  }));
  assert.equal(validateLototurfSimpleColumns(columns), true);
  assert.equal(validateLototurfSimpleColumns([...columns, columns[0]]), false);
});

test('Lototurf aplica la sustitución por el dorsal anterior con vuelta al 12', () => {
  assert.equal(resolveLototurfHorseSelection(7, [1, 3, 6, 9, 12]), 6);
  assert.equal(resolveLototurfHorseSelection(1, [4, 8, 12]), 12);
  assert.equal(resolveLototurfHorseSelection(5, [5, 8, 12]), 5);
});

test('Lototurf clasifica las siete categorías y el reintegro por separado', () => {
  const draw = { winningNumbers: [1, 2, 3, 4, 5, 6], winningHorse: 7, reintegro: 4 };
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,5,6], horse: 7, reintegro: 4 }, draw).category, 1);
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,5,6], horse: 8 }, draw).category, 2);
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,5,9], horse: 7 }, draw).category, 3);
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,5,9], horse: 8 }, draw).category, 4);
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,9,10], horse: 7 }, draw).category, 5);
  assert.equal(classifyLototurfBet({ numbers: [1,2,3,4,9,10], horse: 8 }, draw).category, 6);
  const seventh = classifyLototurfBet({ numbers: [1,2,3,9,10,11], horse: 7, reintegro: 4 }, draw);
  assert.equal(seventh.category, 7);
  assert.equal(seventh.reintegroMatch, true);
});
