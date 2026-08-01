import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimpleQuinielaPlay, sanitizeQuinielaPlay, validateSimpleQuinielaSelection } from '../src/sports/quinielaPlay.js';
import { playBetCount, playCost, sanitizePlay } from '../src/utils/playModel.js';

function round() {
  return {
    roundId: 'quiniela-2026-01',
    gameId: 'quiniela',
    season: '2026-27',
    officialRoundNumber: '1',
    roundDate: '2026-08-16',
    status: 'published',
    salesCloseAt: '2026-08-16T18:00:00.000Z',
    source: 'SELAE oficial',
    sourceUrl: 'https://example.test/quiniela',
    sourceHash: 'sports-fixture-1',
    revision: 2,
    matches: Array.from({ length: 15 }, (_, index) => ({
      matchId: `match-${index + 1}`,
      officialMatchId: `official-${index + 1}`,
      position: index + 1,
      homeTeam: `Local ${index + 1}`,
      awayTeam: `Visitante ${index + 1}`,
      status: 'scheduled',
    })),
  };
}

function selection() {
  return {
    signs: Array.from({ length: 14 }, (_, index) => ['1', 'X', '2'][index % 3]),
    pleno: { home: 'M', away: '1' },
  };
}

test('crea una Quiniela simple vinculada a la revisión oficial de la jornada', () => {
  const play = createSimpleQuinielaPlay({ round: round(), selection: selection(), createdAt: '2026-08-01T16:00:00.000Z' });
  assert.equal(play.gameId, 'quiniela');
  assert.equal(play.columns.length, 1);
  assert.equal(play.columns[0].signs.length, 14);
  assert.deepEqual(play.columns[0].pleno, { home: 'M', away: '1' });
  assert.equal(play.roundRevision, 2);
  assert.equal(play.roundSourceHash, 'sports-fixture-1');
  assert.equal(play.metadata.preparedOnly, true);
  assert.equal(play.purchased, false);
  assert.equal(playBetCount(play), 1);
  assert.equal(playCost(play), 0.75);
});

test('la selección simple exige catorce signos y los dos valores del Pleno', () => {
  const incomplete = selection();
  incomplete.signs[7] = '';
  incomplete.pleno.away = '';
  const result = validateSimpleQuinielaSelection(incomplete);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /partido 8/i);
  assert.match(result.errors.join(' '), /visitante del Pleno/i);
  assert.throws(() => createSimpleQuinielaPlay({ round: round(), selection: incomplete }), /partido 8/i);
});

test('la persistencia conserva solo borradores deportivos válidos y rechaza una compra prematura', () => {
  const play = createSimpleQuinielaPlay({ round: round(), selection: selection() });
  const stored = sanitizePlay(play);
  assert.ok(stored);
  assert.equal(stored.status, 'draft');
  assert.equal(stored.columns[0].signs[1], 'X');
  assert.equal(sanitizeQuinielaPlay({ ...play, purchased: true, status: 'scheduled' }), null);
});

test('rechaza una composición que no contiene los quince partidos oficiales', () => {
  const incompleteRound = round();
  incompleteRound.matches.pop();
  assert.throws(() => createSimpleQuinielaPlay({ round: incompleteRound, selection: selection() }), /15 partidos/i);
});
