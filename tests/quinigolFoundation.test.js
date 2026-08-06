import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countQuinigolBets,
  expandQuinigolColumns,
  officialQuinigolResultFromScores,
  QUINIGOL_OUTCOMES,
  quinigolCost,
  scoreQuinigolColumn,
} from '../src/sports/quinigolRules.js';

function simpleSelection() {
  return { outcomes: Array.from({ length: 6 }, () => ['0-0']) };
}

test('el espacio completo de Quinigol contiene 16^6 apuestas', () => {
  const full = { outcomes: Array.from({ length: 6 }, () => [...QUINIGOL_OUTCOMES]) };
  assert.equal(countQuinigolBets(full), 16_777_216);
  assert.throws(() => expandQuinigolColumns(full), /supera el límite/i);
});

test('las selecciones múltiples se desarrollan como producto cartesiano', () => {
  const selection = simpleSelection();
  selection.outcomes[0] = ['0-0', '1-0'];
  selection.outcomes[1] = ['0-0', '0-1', '1-1'];
  assert.equal(countQuinigolBets(selection), 6);
  assert.equal(quinigolCost(selection), 6);
  assert.equal(expandQuinigolColumns(selection).length, 6);
});

test('los resultados oficiales agregan tres o más goles con M', () => {
  const result = officialQuinigolResultFromScores([
    { home: 0, away: 0 },
    { home: 1, away: 2 },
    { home: 3, away: 0 },
    { home: 2, away: 4 },
    { home: 5, away: 5 },
    { home: 2, away: 1 },
  ]);
  assert.deepEqual(result, ['0-0', '1-2', 'M-0', '2-M', 'M-M', '2-1']);
});

test('la comprobación cuenta coincidencias exactas de las seis casillas', () => {
  const official = ['0-0', '1-2', 'M-0', '2-M', 'M-M', '2-1'];
  const score = scoreQuinigolColumn({ outcomes: ['0-0', '1-2', 'M-0', '2-M', '0-0', '2-1'] }, official);
  assert.equal(score.hits, 5);
  assert.equal(score.category, '5 aciertos');
});
