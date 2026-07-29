import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, retrieveHistory } from '../api/history.js';
import { GAMES } from '../src/utils/gameConfig.js';

test('resume de forma clara un plan que solo ofrece el último sorteo', () => {
  const payload = buildPayload({
    game: GAMES.primitiva,
    requestedYears: 10,
    actualYears: 0,
    result: {
      draws: [{ date: '2026-07-28', winningNumbers: [1, 2, 3, 4, 5, 6] }],
      limited: true,
      providerBase: 'https://api.loteriasapi.com/api/v1',
    },
  });

  assert.equal(payload.latestOnly, true);
  assert.equal(payload.sufficientForAudit, false);
  assert.match(payload.notice, /solo permite consultar el último sorteo/i);
  assert.doesNotMatch(payload.notice, /intervalo de 10 años/i);
});


test('no repite intervalos cuando el plan bloquea el historial', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.LOTERIA_API_KEY;
  const requests = [];
  process.env.LOTERIA_API_KEY = 'test-key';
  globalThis.fetch = async url => {
    requests.push(String(url));
    if (requests.length === 1) {
      return new Response(JSON.stringify({ message: 'Plan restricted' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ draw_date: '2026-07-28', numbers: [1, 2, 3, 4, 5, 6], complementary: 7, reintegro: 8 }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const { result, actualYears } = await retrieveHistory(GAMES.primitiva, 10);
    assert.equal(requests.length, 2);
    assert.match(requests[0], /from=/);
    assert.match(requests[1], /\/results\/primitiva\/latest$/);
    assert.equal(result.draws.length, 1);
    assert.equal(actualYears, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey == null) delete process.env.LOTERIA_API_KEY;
    else process.env.LOTERIA_API_KEY = previousKey;
  }
});
