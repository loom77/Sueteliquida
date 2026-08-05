import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requestSearchParams } from '../api/_security.js';
import { sanitizeSportsRound, sportsRoundAvailability, sportsRoundFingerprint } from '../src/sports/roundModel.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

function matches(count) {
  return Array.from({ length: count }, (_, index) => ({
    matchId: `match-${index + 1}`,
    position: index + 1,
    homeTeam: `Local ${index + 1}`,
    awayTeam: `Visitante ${index + 1}`,
    status: 'scheduled',
  }));
}

function round(gameId, count) {
  return {
    roundId: `${gameId}:2025-2026:test`,
    gameId,
    officialRoundNumber: '99',
    roundDate: '2026-08-10',
    salesCloseAt: '2026-08-10T20:00:00+02:00',
    status: 'sales-open',
    sourceHash: 'verified-source',
    metadata: { identityVerified: true, compositionVerified: true },
    matches: matches(count),
  };
}

test('normalizza retrocompatibilmente i ruoli della Quiniela e del Quinigol', () => {
  const quiniela = sanitizeSportsRound(round('quiniela', 15), { expectedMatches: 15 });
  assert.equal(quiniela.validation.valid, true);
  assert.ok(quiniela.matches.slice(0, 14).every(match => match.predictionType === 'one-x-two'));
  assert.equal(quiniela.matches[14].predictionType, 'pleno15');
  const quinigol = sanitizeSportsRound(round('quinigol', 6), { expectedMatches: 6 });
  assert.equal(quinigol.validation.valid, true);
  assert.ok(quinigol.matches.every(match => match.predictionType === 'score-buckets'));
});

test('blocca un ruolo incompatibile, una posizione mancante e un incontro duplicato', () => {
  const wrongRole = sanitizeSportsRound({
    ...round('quiniela', 15),
    matches: matches(15).map(match => match.position === 15 ? { ...match, predictionType: 'one-x-two' } : match),
  }, { expectedMatches: 15 });
  assert.equal(wrongRole.validation.valid, false);
  assert.ok(wrongRole.validation.errors.some(error => /tipo de pronóstico incompatible/i.test(error)));

  const missingPosition = sanitizeSportsRound({
    ...round('quinigol', 6),
    matches: matches(6).map((match, index) => index === 5 ? { ...match, position: 7 } : match),
  }, { expectedMatches: 6 });
  assert.equal(missingPosition.validation.valid, false);
  assert.ok(missingPosition.validation.errors.some(error => /Falta la posición 6/i.test(error)));

  const duplicate = sanitizeSportsRound({
    ...round('quiniela', 15),
    matches: matches(15).map(match => match.position === 15 ? { ...match, homeTeam: 'Local 2', awayTeam: 'Visitante 2' } : match),
  }, { expectedMatches: 15 });
  assert.equal(duplicate.validation.valid, false);
  assert.ok(duplicate.validation.errors.some(error => /repite el encuentro/i.test(error)));
});

test('una fuente esplicitamente non verificata resta in aggiornamento', () => {
  const candidate = sanitizeSportsRound({
    ...round('quinigol', 6),
    metadata: { identityVerified: false, compositionVerified: false },
  }, { expectedMatches: 6 });
  const availability = sportsRoundAvailability(candidate, { expectedMatches: 6, now: new Date('2026-08-05T12:00:00+02:00') });
  assert.equal(availability.operational, false);
  assert.equal(availability.state, 'updating');
});

test('la huella sportiva include il ruolo del pronostico', () => {
  const base = sanitizeSportsRound(round('quiniela', 15), { expectedMatches: 15 });
  const changed = { ...base, matches: base.matches.map(match => match.position === 15 ? { ...match, predictionType: 'one-x-two' } : match) };
  assert.notEqual(sportsRoundFingerprint(base), sportsRoundFingerprint(changed));
});

test('le API usano URLSearchParams e non il parser query legacy', () => {
  const params = requestSearchParams({ url: '/api/history?game=primitiva&years=3' });
  assert.equal(params.get('game'), 'primitiva');
  assert.equal(params.get('years'), '3');
  for (const file of ['../api/history.js', '../api/sports-rounds.js', '../api/horse-rounds.js', '../api/check-results.js']) {
    const source = read(file);
    assert.match(source, /requestSearchParams/);
    assert.doesNotMatch(source, /req\.query/);
  }
});

test('la sincronizzazione v8 verifica identità e non ricicla Quinigol 87 come giornata 88', () => {
  const sync = read('../supabase/functions/sync-sports-rounds/index.ts');
  assert.match(sync, /sports-checker-v9/);
  assert.match(sync, /sourceIdentity/);
  assert.match(sync, /identityVerified: true/);
  assert.match(sync, /compositionVerified: true/);
  assert.match(sync, /quinigol:[\s\S]*verifiedFallback: null/);
  assert.doesNotMatch(sync, /\['Tps', 'IFK Mariehamn'\]/);
  assert.match(sync, /predictionType/);
});

test('la migrazione elimina snapshot v7 e valida Pleno e Quinigol', () => {
  const migration = read('../supabase/migrations/20260805_sports_identity_hardening_v1701.sql');
  assert.match(migration, /sports-checker-v7/);
  assert.match(migration, /duplicated home-away pair/);
  assert.match(migration, /pleno15/);
  assert.match(migration, /score-buckets/);
});

test('Quiniela risolve il Pleno per ruolo e Quinigol resta usabile su mobile e iPad', () => {
  const panel = read('../src/components/QuinielaPanel.jsx');
  const preview = read('../src/components/QuinielaTicketPreview.jsx');
  const archive = read('../src/components/TicketHistory.jsx');
  const quinigol = read('../src/components/QuinigolPanel.jsx');
  assert.match(panel, /predictionType === 'one-x-two'/);
  assert.match(panel, /predictionType === 'pleno15'/);
  assert.match(preview, /predictionType === 'pleno15'/);
  assert.match(archive, /predictionType === 'pleno15'/);
  assert.match(panel, /marcador 0\/1\/2\/M/);
  assert.match(quinigol, /overflow-x-auto/);
  assert.match(quinigol, /min-w-\[310px\]/);
  assert.match(quinigol, /min-h-12/);
});

test('release e SEO sono aggiornati a v17.1.1', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '17.1.1');
  assert.match(read('../src/utils/release.js'), /17\.1\.1/);
  assert.match(read('../index.html'), /Quiniela, Quinigol y juegos hípicos/);
  assert.match(read('../public/offline.html'), /v17\.1\.1/);
});
