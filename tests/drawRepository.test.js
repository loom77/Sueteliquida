import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearMemoryRepositoryForTests,
  readDrawRange,
  readLatestDraw,
  repositoryStatus,
  upsertDraws,
} from '../api/_drawRepository.js';

async function withoutServiceKey(callback) {
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try { return await callback(); }
  finally {
    if (previous == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous;
  }
}

test('usa Supabase en solo lectura y conserva memoria como fallback sin service_role', async () => {
  clearMemoryRepositoryForTests();
  await withoutServiceKey(async () => {
    assert.equal(repositoryStatus().backend, 'supabase-readonly');
    const saved = await upsertDraws([
      { gameId: 'primitiva', date: '2026-07-27', winningNumbers: [1, 2, 3, 4, 5, 6], extra: 7, complementary: 8 },
      { gameId: 'primitiva', date: '2026-07-30', winningNumbers: [2, 3, 4, 5, 6, 7], extra: 8, complementary: 9 },
    ]);
    assert.equal(saved.persisted, false);

    const unavailableArchive = async () => { throw new Error('offline'); };
    const draws = await readDrawRange('primitiva', '2026-07-01', '2026-07-31', { fetchImpl: unavailableArchive });
    assert.equal(draws.length, 2);
    assert.equal((await readLatestDraw('primitiva', { fetchImpl: unavailableArchive })).date, '2026-07-30');
  });
});

test('persiste en Supabase mediante service_role sin exponer la clave al cliente', async () => {
  clearMemoryRepositoryForTests();
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-secret';
  process.env.SUPABASE_URL = 'https://project.example';
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response('', { status: 201 });
  };
  try {
    const result = await upsertDraws([{
      gameId: 'euromillones', date: '2026-07-28', winningNumbers: [1, 2, 3, 4, 5], secondaryNumbers: [6, 7], extra: null,
    }], { fetchImpl });
    assert.equal(result.persisted, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /primy_draw_results\?on_conflict=/);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer server-secret');
    assert.doesNotMatch(calls[0].options.body, /server-secret/);
    assert.deepEqual(JSON.parse(calls[0].options.body)[0].secondary_numbers, [6, 7]);
  } finally {
    if (previousKey == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousUrl == null) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
  }
});
