import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSportsRound, sportsRoundFingerprint, validateSportsRound } from '../src/sports/roundModel.js';

function matches(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `m-${index + 1}`,
    position: index + 1,
    homeTeam: `Local ${index + 1}`,
    awayTeam: `Visitante ${index + 1}`,
    kickoffAt: `2026-08-${String((index % 20) + 1).padStart(2, '0')}T18:00:00+02:00`,
  }));
}

test('normaliza una jornada oficial sin inventar partidos', () => {
  const round = sanitizeSportsRound({
    roundId: 'quiniela-2026-01',
    gameId: 'quiniela',
    officialRoundNumber: '1',
    status: 'published',
    matches: matches(15),
  }, { expectedMatches: 15 });
  assert.equal(round.validation.valid, true);
  assert.equal(round.matches.length, 15);
  assert.equal(round.matches[0].position, 1);
  assert.equal(round.matches.at(-1).position, 15);
});

test('detecta posiciones e identificadores duplicados', () => {
  const round = sanitizeSportsRound({
    roundId: 'bad-round',
    gameId: 'quinigol',
    matches: [
      { id: 'same', position: 1, homeTeam: 'A', awayTeam: 'B' },
      { id: 'same', position: 1, homeTeam: 'C', awayTeam: 'D' },
    ],
  }, { expectedMatches: 6 });
  assert.equal(round.validation.valid, false);
  assert.ok(round.validation.errors.some(error => /posición 1/i.test(error)));
  assert.ok(round.validation.errors.some(error => /identificador same/i.test(error)));
});

test('el fingerprint cambia cuando cambia la composición de la jornada', () => {
  const base = sanitizeSportsRound({ roundId: 'q-1', gameId: 'quinigol', matches: matches(6) });
  const changed = sanitizeSportsRound({ roundId: 'q-1', gameId: 'quinigol', matches: matches(6).map((match, index) => index === 0 ? { ...match, awayTeam: 'Otro equipo' } : match) });
  assert.notEqual(sportsRoundFingerprint(base), sportsRoundFingerprint(changed));
});

test('la validación no acepta una jornada deportiva sin gameId compatible', () => {
  const validation = validateSportsRound({ roundId: 'x', gameId: 'primitiva', matches: matches(6) }, { expectedMatches: 6 });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => /gameId/i.test(error)));
});
