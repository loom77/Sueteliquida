import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, retrieveHistory } from '../api/history.js';
import { clearMemoryRepositoryForTests } from '../api/_drawRepository.js';
import { GAMES } from '../src/utils/gameConfig.js';

function archivedRows(count = 12) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2026, 4, 4 + index * 7)).toISOString().slice(0, 10);
    return {
      game_id: 'primitiva',
      draw_date: date,
      winning_numbers: [1, 2, 3, 4, 5, 6].map(number => number + (index % 4)),
      extra: index % 10,
      complementary: 20 + (index % 10),
      prizes: [],
      jackpot_next: null,
      jackpot_formatted: null,
      source: 'SELAE oficial mediante caché de lectura',
      source_url: 'https://www.loteriasyapuestas.es/es/resultados',
      source_hash: `hash-${index}`,
      official_updated_at: `${date}T22:30:00.000Z`,
      fetched_at: `${date}T22:35:00.000Z`,
    };
  });
}

test('explica que el archivo oficial se ampliará cuando solo hay un sorteo', () => {
  const payload = buildPayload({
    game: GAMES.primitiva,
    requestedYears: 10,
    actualYears: 0,
    result: {
      draws: [{ date: '2026-07-27', winningNumbers: [1, 2, 3, 4, 5, 6] }],
      source: 'SELAE oficial / archivo Primy',
      repository: { backend: 'memory' },
    },
  });
  assert.equal(payload.latestOnly, true);
  assert.equal(payload.sufficientForAudit, false);
  assert.match(payload.notice, /seguirá ampliando/i);
  assert.equal(payload.provider, 'SELAE');
});

test('recupera el historial desde el archivo Supabase sin consumir una API comercial', async () => {
  clearMemoryRepositoryForTests();
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requests = [];
  const rows = archivedRows();
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: new URL(String(url)), options });
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const { result } = await retrieveHistory(GAMES.primitiva, 1, {
      fetchImpl,
      now: new Date('2026-07-30T12:00:00Z'),
    });
    assert.equal(result.draws.length, 12);
    assert.ok(requests.every(({ url }) => url.pathname.endsWith('/rest/v1/primy_draw_results')));
    assert.ok(requests.every(({ url }) => !url.searchParams.has('api_key')));
    assert.ok(requests.every(({ options }) => Boolean(options.headers.apikey)));
    assert.equal(result.source, 'SELAE oficial / archivo Primy');
  } finally {
    if (previous == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous;
  }
});
