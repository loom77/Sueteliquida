import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizePlay, PLAY_DATA_CONTRACT_VERSION } from '../src/utils/playModel.js';
import { settlePlayAgainstOfficialData } from '../src/verification/verificationEngine.js';

const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');

function sportsMatches(count) {
  return Array.from({ length: count }, (_, index) => ({
    matchId: `official-${index + 1}`,
    officialMatchId: `official-${index + 1}`,
    position: index + 1,
    homeTeam: `Local ${index + 1}`,
    awayTeam: `Visitante ${index + 1}`,
    status: 'scheduled',
    predictionType: index === 14 ? 'pleno15' : 'regular',
  }));
}

function sportsSnapshot(gameId, count, roundId) {
  return {
    roundId,
    gameId,
    officialRoundNumber: '42',
    roundDate: '2026-08-16',
    status: 'published',
    salesCloseAt: '2026-08-16T18:00:00.000Z',
    sourceHash: `${gameId}-android-beta2-hash`,
    revision: 3,
    matches: sportsMatches(count),
  };
}

function horseRaces(gameId) {
  if (gameId === 'lototurf') {
    return [{
      position: 1,
      officialRaceNumber: 4,
      name: '4.ª carrera Lototurf',
      runners: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, name: `Caballo ${i + 1}`, status: 'active' })),
    }];
  }
  return Array.from({ length: 5 }, (_, race) => ({
    position: race + 1,
    officialRaceNumber: race + 1,
    name: `Carrera ${race + 1}`,
    runners: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Caballo ${i + 1}`, status: 'active' })),
  }));
}

test('v18.7.0 accepts Android Lotería Nacional without losing leading zeroes', () => {
  const play = sanitizePlay({
    id: 'android-national-1', gameId: 'loteria-nacional', betType: 'national-decimo',
    nationalNumber: '00123', ticketQuantity: 2, pricePerDecimo: 6,
    columns: [{ id: 'android-national-1-column-1', index: 1, number: '00123', quantity: 2, status: 'draft' }],
    createdAt: '2026-08-09T00:00:00.000Z', drawDateISO: '2026-08-13T19:00:00.000Z', drawDateKey: '2026-08-13',
    purchased: false, status: 'draft', dataContractVersion: '18.7.0',
  });
  assert.ok(play);
  assert.equal(play.nationalNumber, '00123');
  assert.equal(play.columns[0].number, '00123');
  assert.equal(PLAY_DATA_CONTRACT_VERSION, '18.7.0');
});

test('v18.7.0 preserves an Android Quiniela official-round binding', () => {
  const round = sportsSnapshot('quiniela', 15, 'quiniela:2026:42');
  const play = sanitizePlay({
    id: 'android-quiniela-1', gameId: 'quiniela', roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber, roundRevision: round.revision, roundSourceHash: round.sourceHash,
    roundDate: round.roundDate, matches: round.matches,
    columns: [{ id: 'q-col', signs: Array.from({ length: 14 }, (_, i) => ['1', 'X', '2'][i % 3]), pleno: { home: 'M', away: '1' } }],
    metadata: { sportsRoundSnapshot: round }, drawDateISO: round.salesCloseAt, drawDateKey: round.roundDate,
    createdAt: '2026-08-09T00:00:00.000Z', purchased: false, status: 'draft', dataContractVersion: '18.7.0',
  });
  assert.ok(play);
  assert.equal(play.roundId, round.roundId);
  assert.equal(play.roundSourceHash, round.sourceHash);
  assert.equal(play.columns[0].signs.length, 14);
  assert.deepEqual(play.columns[0].pleno, { home: 'M', away: '1' });
});

test('v18.7.0 preserves an Android Quinigol official-round binding', () => {
  const round = sportsSnapshot('quinigol', 6, 'quinigol:2026:42');
  const play = sanitizePlay({
    id: 'android-quinigol-1', gameId: 'quinigol', roundId: round.roundId,
    officialRoundNumber: round.officialRoundNumber, roundRevision: round.revision, roundSourceHash: round.sourceHash,
    roundDate: round.roundDate, matches: round.matches,
    columns: [{ id: 'g-col', outcomes: ['1-0', 'M-1', '2-2', '0-M', '1-1', '2-M'] }],
    metadata: { sportsRoundSnapshot: round }, drawDateISO: round.salesCloseAt, drawDateKey: round.roundDate,
    createdAt: '2026-08-09T00:00:00.000Z', purchased: false, status: 'draft', dataContractVersion: '18.7.0',
  });
  assert.ok(play);
  assert.equal(play.roundId, round.roundId);
  assert.deepEqual(play.columns[0].outcomes, ['1-0', 'M-1', '2-2', '0-M', '1-1', '2-M']);
});

test('v18.7.0 preserves Android Lototurf and Quíntuple Plus selections', () => {
  const lototurf = sanitizePlay({
    id: 'android-lototurf-1', gameId: 'lototurf', roundId: 'lototurf:2026:42', officialRoundNumber: '42',
    roundRevision: 2, sourceHash: 'lototurf-hash', venue: 'La Zarzuela', races: horseRaces('lototurf'),
    selection: { numbers: [1, 5, 9, 14, 21, 31], horses: [7] },
    columns: [{ id: 'lt-col', numbers: [1, 5, 9, 14, 21, 31], horses: [7], horse: 7 }],
    drawDateISO: '2026-08-16T12:00:00.000Z', drawDateKey: '2026-08-16', createdAt: '2026-08-09T00:00:00.000Z',
    purchased: false, status: 'draft', dataContractVersion: '18.7.0',
  });
  assert.ok(lototurf);
  assert.deepEqual(lototurf.selection.numbers, [1, 5, 9, 14, 21, 31]);
  assert.deepEqual(lototurf.selection.horses, [7]);

  const rows = [[1], [2], [3], [4], [5], [6]];
  const quintuple = sanitizePlay({
    id: 'android-qp-1', gameId: 'quintuple-plus', roundId: 'quintuple-plus:2026:42', officialRoundNumber: '42',
    roundRevision: 2, sourceHash: 'qp-hash', venue: 'La Zarzuela', races: horseRaces('quintuple-plus'),
    selection: { rows }, columns: [{ id: 'qp-col', rows }],
    drawDateISO: '2026-08-16T12:00:00.000Z', drawDateKey: '2026-08-16', createdAt: '2026-08-09T00:00:00.000Z',
    purchased: false, status: 'draft', dataContractVersion: '18.7.0',
  });
  assert.ok(quintuple);
  assert.deepEqual(quintuple.selection.rows, rows);
});

test('v18.7.0 refuses a sports or horse result from a different stored event', () => {
  const sportsPlay = { gameId: 'quiniela', roundId: 'round-A', drawDateKey: '2026-08-16' };
  assert.equal(settlePlayAgainstOfficialData(sportsPlay, { roundId: 'round-B', roundDate: '2026-08-16' }).reason, 'OFFICIAL_ROUND_MISMATCH');
  const horsePlay = { gameId: 'lototurf', roundId: 'horse-A', drawDateKey: '2026-08-16' };
  assert.equal(settlePlayAgainstOfficialData(horsePlay, { roundId: 'horse-A', roundDate: '2026-08-17' }).reason, 'OFFICIAL_DATE_MISMATCH');
});

test('web signup remains closed while the Android bridge advances', () => {
  const auth = read('../src/components/AuthScreen.jsx');
  assert.match(auth, /Registro web temporalmente cerrado/);
  assert.doesNotMatch(auth, /onSignUp/);
  assert.equal(JSON.parse(read('../package.json')).version, '18.7.1');
});
