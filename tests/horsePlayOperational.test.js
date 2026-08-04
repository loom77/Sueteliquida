import test from 'node:test';
import assert from 'node:assert/strict';
import { createLototurfPlay, createQuintuplePlusPlay, sanitizeHorsePlay } from '../src/horse/plays.js';
import { playBetCount, playCost, sanitizePlay } from '../src/utils/playModel.js';

function runner(number, withdrawn = false) {
  return { number, name: `Caballo ${number}`, withdrawn, status: withdrawn ? 'withdrawn' : 'active' };
}

function lototurfRound() {
  return {
    roundId: 'lototurf:2026:40', gameId: 'lototurf', officialRoundNumber: '40', roundDate: '2026-08-09',
    status: 'document-published', revision: 2, sourceHash: 'horse-lt-40', venue: 'La Zarzuela',
    races: [{ position: 1, officialRaceNumber: 4, name: 'Premio Lototurf', runners: Array.from({ length: 12 }, (_, i) => runner(i + 1, i === 8)) }],
  };
}

function quintupleRound() {
  return {
    roundId: 'quintuple-plus:2026:40', gameId: 'quintuple-plus', officialRoundNumber: '40', roundDate: '2026-08-09',
    status: 'document-published', revision: 3, sourceHash: 'horse-qp-40', venue: 'La Zarzuela',
    races: Array.from({ length: 5 }, (_, index) => ({ position: index + 1, officialRaceNumber: index + 1, name: `Carrera ${index + 1}`, runners: Array.from({ length: 8 }, (_, i) => runner(i + 1)) })),
  };
}

test('crea y persiste una jugada operativa de Lototurf vinculada a la jornada', () => {
  const play = createLototurfPlay({ round: lototurfRound(), selection: { numbers: [1, 5, 9, 14, 21, 31], horses: [7] } });
  assert.equal(play.gameId, 'lototurf');
  assert.equal(play.roundRevision, 2);
  assert.equal(play.equivalentBets, 1);
  assert.equal(playBetCount(play), 1);
  assert.equal(playCost(play), 1);
  assert.deepEqual(sanitizePlay(play)?.selection.horses, [7]);
});

test('Lototurf rechaza un caballo retirado del programa oficial', () => {
  assert.throws(() => createLototurfPlay({ round: lototurfRound(), selection: { numbers: [1, 5, 9, 14, 21, 31], horses: [9] } }), /ya no están activos/);
});

test('crea y persiste una Quíntuple Plus simple con seis filas', () => {
  const rows = [[1], [2], [3], [4], [5], [6]];
  const play = createQuintuplePlusPlay({ round: quintupleRound(), selection: { rows } });
  assert.equal(play.gameId, 'quintuple-plus');
  assert.equal(play.roundRevision, 3);
  assert.equal(play.equivalentBets, 1);
  assert.deepEqual(sanitizeHorsePlay(play)?.selection.rows, rows);
  assert.equal(playCost(play), 1);
});

test('Quíntuple Plus conserva el coste de una múltiple sin expandirla', () => {
  const rows = [[1, 2], [2], [3], [4], [5, 6], [6, 7]];
  const play = createQuintuplePlusPlay({ round: quintupleRound(), selection: { rows } });
  assert.equal(play.betType, 'multiple');
  assert.equal(play.equivalentBets, 6);
  assert.equal(playBetCount(play), 6);
  assert.equal(playCost(play), 6);
  assert.equal(play.columns.length, 1);
});
