import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conditionQuinielaColumns,
  countElige8Bets,
  countQuinielaBets,
  elige8Cost,
  expandQuinielaColumns,
  officialQuinielaResultFromScores,
  QUINIELA_OFFICIAL_REDUCTIONS,
  quinielaConditionMetrics,
  quinielaCost,
  sanitizeQuinielaSelection,
  scoreQuinielaColumn,
} from '../src/sports/quinielaRules.js';

function simpleSelection() {
  return {
    signs: Array.from({ length: 14 }, () => ['1']),
    pleno: { home: ['0'], away: ['0'] },
  };
}

test('el espacio completo de Quiniela es 3^14 por 16 marcadores del Pleno', () => {
  const full = {
    signs: Array.from({ length: 14 }, () => ['1', 'X', '2']),
    pleno: { home: ['0', '1', '2', 'M'], away: ['0', '1', '2', 'M'] },
  };
  assert.equal(countQuinielaBets(full), 76_527_504);
  assert.throws(() => expandQuinielaColumns(full), /supera el límite/i);
});

test('dobles, triples y pleno multiplican las apuestas y el coste', () => {
  const selection = simpleSelection();
  selection.signs[0] = ['1', 'X'];
  selection.signs[1] = ['1', 'X'];
  selection.signs[2] = ['1', 'X', '2'];
  selection.pleno.home = ['0', '1'];
  assert.equal(countQuinielaBets(selection), 24);
  assert.equal(quinielaCost(selection), 18);
  assert.equal(expandQuinielaColumns(selection).length, 24);
});

test('las condiciones filtran variantes, empates y doses sin alterar las columnas originales', () => {
  const selection = simpleSelection();
  selection.signs[0] = ['1', 'X'];
  selection.signs[1] = ['1', '2'];
  const columns = expandQuinielaColumns(selection);
  const filtered = conditionQuinielaColumns(columns, { variants: { min: 1, max: 1 }, draws: { min: 0, max: 1 }, awayWins: { min: 0, max: 1 } });
  assert.equal(columns.length, 4);
  assert.equal(filtered.length, 2);
  assert.deepEqual(quinielaConditionMetrics(['1', 'X', '2', '1']), { variants: 2, draws: 1, awayWins: 1 });
});

test('Elige8 desarrolla únicamente los ocho partidos seleccionados', () => {
  const selection = simpleSelection();
  selection.signs[0] = ['1', 'X'];
  selection.signs[3] = ['1', 'X', '2'];
  const positions = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.equal(countElige8Bets(selection, positions), 6);
  assert.equal(elige8Cost(selection, positions), 3);
  assert.throws(() => countElige8Bets(selection, [1, 2]), /exactamente ocho/i);
});

test('convierte marcadores oficiales y puntúa Pleno al 15 por separado', () => {
  const scores = Array.from({ length: 15 }, (_, index) => index === 14 ? { home: 4, away: 2 } : { home: 1, away: 0 });
  const result = officialQuinielaResultFromScores(scores);
  assert.deepEqual(result.signs, Array.from({ length: 14 }, () => '1'));
  assert.deepEqual(result.pleno, { home: 'M', away: '2' });
  const score = scoreQuinielaColumn({ signs: result.signs, pleno: result.pleno }, result);
  assert.equal(score.hits14, 14);
  assert.equal(score.plenoCorrect, true);
  assert.equal(score.totalLabel, 'Pleno al 15');
});

test('las reducidas se catalogan sin fingir que las matrices oficiales ya están importadas', () => {
  assert.equal(QUINIELA_OFFICIAL_REDUCTIONS.length, 6);
  assert.ok(QUINIELA_OFFICIAL_REDUCTIONS.every(reduction => reduction.matrixStatus === 'pending-official-import'));
  assert.ok(QUINIELA_OFFICIAL_REDUCTIONS.every(reduction => reduction.guaranteeStatus === 'pending-official-verification'));
});

test('la sanitización mantiene el orden oficial de los símbolos', () => {
  const sanitized = sanitizeQuinielaSelection({ signs: [['2', '1', 'X', '1']], pleno: { home: ['M', '0'], away: ['2'] } });
  assert.deepEqual(sanitized.signs[0], ['1', 'X', '2']);
  assert.deepEqual(sanitized.pleno.home, ['0', 'M']);
});
