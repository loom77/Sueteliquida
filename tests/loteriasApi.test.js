import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDrawItems, fetchDrawRange, fetchLatestDraw, normalizeProviderDraw, providerBase, providerRequest } from '../api/_loteriasApi.js';
import { GAMES } from '../src/utils/gameConfig.js';

test('usa la URL base oficial de LoteriasAPI', () => {
  const previous = process.env.LOTERIA_API_BASE;
  delete process.env.LOTERIA_API_BASE;
  assert.equal(providerBase(), 'https://api.loteriasapi.com/api/v1');
  if (previous) process.env.LOTERIA_API_BASE = previous;
});

test('normaliza la respuesta oficial de La Primitiva', () => {
  const payload = { success: true, data: [{ draw_date: '2026-07-25', numbers: [1, 5, 18, 36, 37, 42], complementary: 17, reintegro: 2, prizes: [] }] };
  const items = extractDrawItems(payload);
  const draw = normalizeProviderDraw(items[0], GAMES.primitiva);
  assert.deepEqual(draw.winningNumbers, [1, 5, 18, 36, 37, 42]);
  assert.equal(draw.date, '2026-07-25');
  assert.equal(draw.extra, 2);
  assert.equal(draw.complementary, 17);
});

test('envía la clave en la cabecera x-api-key', async () => {
  let requestedUrl = '';
  let requestedHeaders = null;
  const fetchImpl = async (url, options) => {
    requestedUrl = url;
    requestedHeaders = options.headers;
    return new Response(JSON.stringify({ draw_date: '2026-07-25', numbers: [1, 2, 3, 4, 5, 6], complementary: 7, reintegro: 8 }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  await providerRequest('/results/primitiva/latest', { key: 'test-key', fetchImpl });
  assert.equal(requestedUrl, 'https://api.loteriasapi.com/api/v1/results/primitiva/latest');
  assert.equal(requestedHeaders['x-api-key'], 'test-key');
});


test('recupera y normaliza un historial por intervalo', async () => {
  const fetchImpl = async url => {
    assert.match(url, /from=2026-07-01/);
    assert.match(url, /to=2026-07-31/);
    return new Response(JSON.stringify({ data: [
      { draw_date: '2026-07-20', numbers: [2, 8, 14, 20, 31, 44], complementary: 7, reintegro: 4 },
      { draw_date: '2026-07-23', numbers: [1, 9, 13, 28, 35, 49], complementary: 6, reintegro: 8 }
    ] }), { status: 200 });
  };
  const result = await fetchDrawRange({ game: GAMES.primitiva, key: 'key', from: '2026-07-01', to: '2026-07-31', fetchImpl });
  assert.equal(result.draws.length, 2);
  assert.equal(result.draws[0].date, '2026-07-20');
});

test('normaliza el bote del próximo sorteo', () => {
  const draw = normalizeProviderDraw({ draw_date: '2026-07-25', numbers: [1, 5, 18, 36, 37, 42], complementary: 17, reintegro: 2, jackpot_next: 5200000 }, GAMES.primitiva);
  assert.equal(draw.jackpotNext, 5200000);
});


test('consulta el último sorteo con una sola petición', async () => {
  let requests = 0;
  const fetchImpl = async url => {
    requests += 1;
    assert.match(url, /\/results\/primitiva\/latest$/);
    return new Response(JSON.stringify({ draw_date: '2026-07-25', numbers: [1, 2, 3, 4, 5, 6], complementary: 7, reintegro: 8 }), { status: 200 });
  };
  const result = await fetchLatestDraw({ game: GAMES.primitiva, key: 'key', fetchImpl });
  assert.equal(requests, 1);
  assert.equal(result.draws.length, 1);
  assert.equal(result.limited, true);
});
