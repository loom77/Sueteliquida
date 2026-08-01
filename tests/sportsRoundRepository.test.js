import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearSportsRoundMemoryForTests,
  readLatestSportsRound,
  readSportsRound,
  sportsRoundRepositoryStatus,
  upsertSportsRounds,
} from '../api/_sportsRoundRepository.js';

function round(sourceHash = 'hash-a') {
  return {
    roundId: 'quiniela:2026-2027:1', gameId: 'quiniela', season: '2026-2027', officialRoundNumber: '1',
    roundDate: '2026-08-16', status: 'published', sourceHash, sourceUrl: 'https://example.test',
    matches: Array.from({ length: 15 }, (_, index) => ({ position: index + 1, homeTeam: `Local ${index + 1}`, awayTeam: `Visitante ${index + 1}` })),
  };
}

async function withoutServiceKey(callback) {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try { return await callback(); }
  finally { if (previous == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previous; }
}

test('conserva jornadas y revisiones en memoria cuando Supabase está en solo lectura', async () => {
  clearSportsRoundMemoryForTests();
  await withoutServiceKey(async () => {
    assert.equal(sportsRoundRepositoryStatus().backend, 'supabase-readonly');
    const first = await upsertSportsRounds([round('hash-a')]);
    const second = await upsertSportsRounds([round('hash-b')]);
    assert.equal(first.persisted, false);
    assert.equal(second.revisions, 1);
    const offline = async () => { throw new Error('offline'); };
    const latest = await readLatestSportsRound('quiniela', { fetchImpl: offline });
    assert.equal(latest.revision, 2);
    assert.equal((await readSportsRound('quiniela:2026-2027:1', { fetchImpl: offline })).sourceHash, 'hash-b');
  });
});

test('persiste snapshot y revisión con service_role sin incluir la clave en el cuerpo', async () => {
  clearSportsRoundMemoryForTests();
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sports-server-secret';
  process.env.SUPABASE_URL = 'https://project.example';
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url: String(url), options }); return new Response('', { status: 201 }); };
  try {
    const result = await upsertSportsRounds([round()], { fetchImpl });
    assert.equal(result.persisted, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /primy_sports_rounds\?on_conflict=round_id/);
    assert.match(calls[1].url, /primy_sports_round_revisions/);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer sports-server-secret');
    assert.doesNotMatch(calls[0].options.body, /sports-server-secret/);
    assert.equal(JSON.parse(calls[0].options.body)[0].matches.length, 15);
  } finally {
    if (previousKey == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousUrl == null) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
  }
});
