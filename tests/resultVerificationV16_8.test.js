import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { clearMemoryRepositoryForTests } from '../api/_drawRepository.js';
import { getDrawsForDates } from '../api/_drawService.js';
import { GAMES } from '../src/utils/gameConfig.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('consulta el resultado oficial en vivo cuando el archivo aún no lo contiene', async () => {
  clearMemoryRepositoryForTests();
  const html = `
    <h1>Euromillones 04/08/2026</h1>
    <div>Combinación ganadora</div>
    <ul><li>3</li><li>11</li><li>20</li><li>31</li><li>44</li></ul>
    <div>Estrellas</div><ul><li>2</li><li>9</li></ul>
  `;
  const fetchImpl = async url => {
    const target = String(url);
    if (target.includes('/rest/v1/primy_draw_results')) {
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    }
    assert.match(target, /euromillones\.html/);
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const result = await getDrawsForDates(GAMES.euromillones, ['2026-08-04'], { fetchImpl, fetchMissing: true });
  assert.equal(result.liveFetched, 1);
  assert.equal(result.unavailableDates.length, 0);
  assert.deepEqual(result.draws[0].winningNumbers, [3, 11, 20, 31, 44]);
  assert.deepEqual(result.draws[0].secondaryNumbers, [2, 9]);
});

test('la interfaz incorpora comprobación individual y actualización automática', () => {
  const history = read('../src/components/TicketHistory.jsx');
  const hook = read('../src/hooks/useResultChecking.js');
  const api = read('../api/check-results.js');
  const cron = read('../supabase/migrations/20260804_fast_result_sync.sql');
  assert.match(history, /Comprobar ahora/);
  assert.match(history, /onCheckPlay/);
  assert.match(hook, /AUTO_REFRESH_MS = 120000/);
  assert.match(hook, /visibilitychange/);
  assert.match(api, /private, no-store/);
  assert.match(cron, /\*\/5 19-23/);
});
