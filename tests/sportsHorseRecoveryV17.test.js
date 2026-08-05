import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isSuspiciousSportsTeamName, sanitizeSportsRound, sportsRoundAvailability } from '../src/sports/roundModel.js';
import { createSimpleQuinigolPlay, sanitizeQuinigolPlay } from '../src/sports/quinigolPlay.js';
import { horseRoundAvailability, sanitizeHorseRound } from '../src/horse/roundModel.js';

function sportsMatches(count) {
  return Array.from({ length: count }, (_, index) => ({
    matchId: `m-${index + 1}`,
    position: index + 1,
    homeTeam: `Local ${index + 1}`,
    awayTeam: `Visitante ${index + 1}`,
    status: 'scheduled',
  }));
}

function verifiedQuinigolRound() {
  return {
    roundId: 'quinigol:2025-2026:88',
    gameId: 'quinigol',
    season: '2025-2026',
    officialRoundNumber: '88',
    roundDate: '2026-08-08',
    status: 'sales-open',
    salesOpenAt: '2026-08-02T00:00:00+02:00',
    salesCloseAt: '2026-08-08T14:00:00+02:00',
    source: 'SELAE oficial',
    sourceUrl: 'https://www.loteriasyapuestas.es/es/resultados/quinigol/comprobar',
    sourceHash: 'official-current-88',
    revision: 1,
    matches: sportsMatches(6),
    metadata: { provisionalIdentity: false, sourceType: 'official-checker-validated-snapshot' },
  };
}

test('los nombres deportivos contaminados por enlaces o Markdown quedan bloqueados', () => {
  assert.equal(isSuspiciousSportsTeamName('[Vps'), true);
  assert.equal(isSuspiciousSportsTeamName('FC Inter](https://example.test)'), true);
  assert.equal(isSuspiciousSportsTeamName('Aik'), false);
  const round = sanitizeSportsRound({ ...verifiedQuinigolRound(), matches: [{ ...sportsMatches(6)[0], homeTeam: '[Vps' }, ...sportsMatches(6).slice(1)] }, { expectedMatches: 6 });
  assert.equal(round.validation.valid, false);
});

test('una jornada deportiva provisional o sin identidad oficial nunca habilita la creación', () => {
  const round = sanitizeSportsRound({
    ...verifiedQuinigolRound(),
    roundId: 'quinigol:current',
    officialRoundNumber: '',
    roundDate: null,
    salesCloseAt: null,
    metadata: { provisionalIdentity: true, sourceType: 'checker-composition' },
  }, { expectedMatches: 6 });
  const availability = sportsRoundAvailability(round, { expectedMatches: 6, now: new Date('2026-08-05T00:00:00+02:00') });
  assert.equal(availability.operational, false);
  assert.equal(availability.state, 'updating');
});

test('Quinigol prepara, vincula y conserva una apuesta simple sobre una jornada verificada', () => {
  const round = verifiedQuinigolRound();
  const availability = sportsRoundAvailability(sanitizeSportsRound(round, { expectedMatches: 6 }), { expectedMatches: 6, now: new Date('2026-08-05T00:00:00+02:00') });
  assert.equal(availability.operational, true);
  const play = createSimpleQuinigolPlay({
    round,
    selection: { outcomes: [['0-1'], ['1-1'], ['2-M'], ['M-0'], ['1-2'], ['0-0']] },
    createdAt: '2026-08-05T00:00:00.000Z',
  });
  assert.equal(play.gameId, 'quinigol');
  assert.equal(play.equivalentBets, 1);
  assert.equal(play.columns[0].outcomes.length, 6);
  assert.equal(play.roundId, round.roundId);
  assert.equal(play.roundSourceHash, round.sourceHash);
  assert.ok(sanitizeQuinigolPlay(play));
});

function runners(count) {
  return Array.from({ length: count }, (_, index) => ({ number: index + 1, name: `Caballo ${index + 1}`, status: 'active' }));
}

test('los módulos hípicos distinguen ausencia de programa de un fallo del motor', () => {
  const empty = sanitizeHorseRound({ roundId: 'lototurf:none', gameId: 'lototurf', status: 'draft', races: [] });
  const availability = horseRoundAvailability(empty, { now: new Date('2026-08-05T00:00:00+02:00') });
  assert.equal(availability.operational, false);
  assert.equal(availability.state, 'unavailable');
});

test('un programa hípico oficial completo se habilita y uno incompleto queda bloqueado', () => {
  const valid = sanitizeHorseRound({
    roundId: 'lototurf:2026:33',
    gameId: 'lototurf',
    officialRoundNumber: '33',
    roundDate: '2026-08-09',
    status: 'document-published',
    sourceHash: 'horse-official-33',
    source: 'SELAE oficial',
    races: [{ raceId: 'race-1', position: 1, officialRaceNumber: 4, name: '4.ª carrera', runners: runners(8) }],
  });
  assert.equal(horseRoundAvailability(valid, { now: new Date('2026-08-05T00:00:00+02:00') }).operational, true);
  const incomplete = sanitizeHorseRound({ ...valid, races: [{ ...valid.races[0], runners: runners(2) }] });
  assert.equal(horseRoundAvailability(incomplete).operational, false);
});

test('la sincronización hípica vive en Supabase y ya no depende del endpoint Vercel', () => {
  const scheduled = fs.readFileSync(new URL('../supabase/functions/scheduled-sync-all-results/index.ts', import.meta.url), 'utf8');
  const sports = fs.readFileSync(new URL('../supabase/functions/sync-sports-rounds/index.ts', import.meta.url), 'utf8');
  const horse = fs.readFileSync(new URL('../supabase/functions/sync-horse-rounds/index.ts', import.meta.url), 'utf8');
  assert.match(scheduled, /SUPABASE_URL.*sync-horse-rounds/s);
  assert.doesNotMatch(scheduled, /sueteliquida\.vercel\.app\/api\/sync-horse-rounds/);
  assert.match(sports, /sports-checker-v9/);
  assert.match(sports, /published-composition-verified-snapshot/);
  assert.match(sports, /verifiedFallback: null/);
  assert.match(horse, /no-active-round/);
});


test('la ausencia de jornada se devuelve como estado controlado y no como error HTTP', () => {
  const sportsApi = fs.readFileSync(new URL('../api/sports-rounds.js', import.meta.url), 'utf8');
  const horseApi = fs.readFileSync(new URL('../api/horse-rounds.js', import.meta.url), 'utf8');
  assert.match(sportsApi, /status\(200\).*state: 'updating'/s);
  assert.match(horseApi, /status\(200\).*state: 'no-active-round'/s);
  assert.doesNotMatch(horseApi, /HORSE_ARCHIVE_EMPTY/);
});
