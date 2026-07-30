import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, retrieveHistory } from '../api/history.js';
import { clearMemoryRepositoryForTests } from '../api/_drawRepository.js';
import { GAMES } from '../src/utils/gameConfig.js';

function htmlFor(date) {
  const [year, month, day] = date.split('-');
  return `<html><body><p>La Primitiva: resultados del ${day}/${month}/${year}</p>
  <h2>Combinación ganadora</h2><span class="bola">1</span><span class="bola">2</span>
  <span class="bola">3</span><span class="bola">4</span><span class="bola">5</span><span class="bola">6</span>
  <p>Complementario: 7</p><p>Reintegro: 8</p></body></html>`;
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

test('recupera fechas recientes desde SELAE y las archiva sin clave API', async () => {
  clearMemoryRepositoryForTests();
  const previous = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requests = [];
  const fetchImpl = async url => {
    const requested = new URL(String(url));
    requests.push(requested);
    const compact = requested.searchParams.get('fecha_sorteo');
    const date = compact ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}` : '2026-07-30';
    return new Response(htmlFor(date), { status: 200, headers: { 'content-type': 'text/html' } });
  };

  try {
    const { result } = await retrieveHistory(GAMES.primitiva, 1, {
      fetchImpl,
      now: new Date('2026-07-30T12:00:00Z'),
    });
    assert.equal(result.draws.length, 12);
    assert.ok(requests.every(request => !request.searchParams.has('api_key')));
    assert.equal(result.source, 'SELAE oficial / archivo Primy');
  } finally {
    if (previous == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous;
  }
});
