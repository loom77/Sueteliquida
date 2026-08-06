import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearHorseRoundMemoryForTests,
  horseRoundRepositoryStatus,
  readHorseRound,
  readLatestHorseRound,
  upsertHorseRounds,
} from '../api/_horseRoundRepository.js';

function round(sourceHash = 'horse-a') {
  return {
    roundId: 'lototurf:2026:32',
    gameId: 'lototurf',
    season: '2026',
    officialRoundNumber: '32',
    roundDate: '2026-06-14',
    status: 'document-published',
    sourceHash,
    races: [{
      position: 1,
      officialRaceNumber: 4,
      name: 'Premio Test',
      runners: [1, 2, 3].map(number => ({ number, name: `Caballo ${number}` })),
    }],
  };
}

async function withoutServiceKey(callback) {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try { return await callback(); }
  finally { if (previous == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previous; }
}

test('conserva snapshots y revisiones en memoria si Supabase es solo lectura', async () => {
  clearHorseRoundMemoryForTests();
  await withoutServiceKey(async () => {
    assert.equal(horseRoundRepositoryStatus().backend, 'supabase-readonly');
    await upsertHorseRounds([round('horse-a')]);
    const second = await upsertHorseRounds([round('horse-b')]);
    assert.equal(second.revisions, 1);
    const offline = async () => { throw new Error('offline'); };
    assert.equal((await readLatestHorseRound('lototurf', { fetchImpl: offline })).revision, 2);
    assert.equal((await readHorseRound('lototurf:2026:32', { fetchImpl: offline })).sourceHash, 'horse-b');
  });
});

test('persiste jornada y revisión sin exponer service_role en el cuerpo', async () => {
  clearHorseRoundMemoryForTests();
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'horse-server-secret';
  process.env.SUPABASE_URL = 'https://project.example';
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url: String(url), options }); return new Response('', { status: 201 }); };
  try {
    const result = await upsertHorseRounds([round()], { fetchImpl });
    assert.equal(result.persisted, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /primy_horse_rounds\?on_conflict=round_id/);
    assert.match(calls[1].url, /primy_horse_round_revisions/);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer horse-server-secret');
    assert.doesNotMatch(calls[0].options.body, /horse-server-secret/);
  } finally {
    if (previousKey == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousUrl == null) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
  }
});
