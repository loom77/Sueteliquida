import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candidateDrawDates,
  fetchOfficialDraw,
  parseSelaeHtml,
  selaeBase,
  selaeResultUrl,
} from '../api/_selaeProvider.js';
import { GAMES } from '../src/utils/gameConfig.js';

const primitivaHtml = `
<!doctype html><html><body>
<h1>Resultados último sorteo</h1>
<p>La Primitiva: resultados del 27 de julio de 2026</p>
<section><h2>Combinación ganadora</h2>
<span class="bola">01</span><span class="bola">05</span><span class="bola">18</span>
<span class="bola">36</span><span class="bola">37</span><span class="bola">42</span></section>
<p>Complementario: C(17)</p><p>Reintegro: R(2)</p>
<p>Bote próximo sorteo: 5.200.000 €</p>
<table><tr><td>5.ª categoría</td><td>8,00 €</td></tr></table>
</body></html>`;


const euromillonesHtml = `
<html><body><h1>Resultados último sorteo</h1>
<p>Euromillones: resultados del 28/07/2026</p>
<section><h2>Combinación ganadora</h2>
<span class="bola">03</span><span class="bola">11</span><span class="bola">24</span>
<span class="bola">36</span><span class="bola">49</span></section>
<p>Estrellas: 4 - 10</p>
<p>Bote próximo sorteo: 89.000.000 €</p>
<table><tr><td>1.ª categoría</td><td>17.000.000,00 €</td></tr></table>
</body></html>`;

const eurodreamsHtml = `
<html><body><h1>Resultados último sorteo</h1>
<p>EuroDreams: resultados del 27/07/2026</p>
<div>Combinación ganadora</div><ul>
<li class="ball">2</li><li class="ball">7</li><li class="ball">16</li>
<li class="ball">22</li><li class="ball">31</li><li class="ball">40</li></ul>
<p>Sueño: 4</p></body></html>`;

test('usa los ficheros oficiales de SELAE sin clave comercial', () => {
  const previous = process.env.SELAE_BASE_URL;
  delete process.env.SELAE_BASE_URL;
  assert.equal(selaeBase(), 'https://www.loteriasyapuestas.es');
  const url = selaeResultUrl(GAMES.primitiva, '2026-07-27');
  assert.match(url, /primitiva\.html/);
  assert.match(url, /game_id=LAPR/);
  assert.match(url, /fecha_sorteo=20260727/);
  if (previous == null) delete process.env.SELAE_BASE_URL;
  else process.env.SELAE_BASE_URL = previous;
});

test('interpreta y valida La Primitiva oficial', () => {
  const draw = parseSelaeHtml(primitivaHtml, GAMES.primitiva, { requestedDate: '2026-07-27', endpoint: 'https://example.test' });
  assert.deepEqual(draw.winningNumbers, [1, 5, 18, 36, 37, 42]);
  assert.equal(draw.date, '2026-07-27');
  assert.equal(draw.extra, 2);
  assert.equal(draw.complementary, 17);
  assert.equal(draw.jackpotNext, 5200000);
  assert.equal(draw.source, 'SELAE oficial');
  assert.equal(draw.sourceHash.length, 64);
});


test('interpreta Bonoloto con complementario y reintegro oficiales', () => {
  const html = `
    <main>
      <h1>Bonoloto</h1>
      <p>Resultado del sorteo 30/07/2026</p>
      <div>Combinación ganadora: 4 - 11 - 19 - 27 - 35 - 46</div>
      <div>Complementario: 8</div>
      <div>Reintegro: 3</div>
    </main>`;
  const draw = parseSelaeHtml(html, GAMES.bonoloto, { requestedDate: '2026-07-30' });
  assert.deepEqual(draw.winningNumbers, [4, 11, 19, 27, 35, 46]);
  assert.equal(draw.complementary, 8);
  assert.equal(draw.extra, 3);
});

test('interpreta Euromillones con dos estrellas oficiales', () => {
  const url = selaeResultUrl(GAMES.euromillones, '2026-07-28');
  assert.match(url, /euromillones\.html/);
  assert.match(url, /game_id=EMIL/);
  const draw = parseSelaeHtml(euromillonesHtml, GAMES.euromillones, { requestedDate: '2026-07-28' });
  assert.deepEqual(draw.winningNumbers, [3, 11, 24, 36, 49]);
  assert.deepEqual(draw.secondaryNumbers, [4, 10]);
  assert.equal(draw.extra, null);
  assert.equal(draw.complementary, null);
  assert.equal(draw.jackpotNext, 89000000);
});

test('interpreta EuroDreams y el número Sueño', () => {
  const draw = parseSelaeHtml(eurodreamsHtml, GAMES.eurodreams, { requestedDate: '2026-07-27' });
  assert.deepEqual(draw.winningNumbers, [2, 7, 16, 22, 31, 40]);
  assert.equal(draw.extra, 4);
  assert.equal(draw.complementary, null);
});

test('rechaza una respuesta oficial de fecha distinta', () => {
  assert.throws(
    () => parseSelaeHtml(primitivaHtml, GAMES.primitiva, { requestedDate: '2026-07-30' }),
    error => error.code === 'DRAW_DATE_MISMATCH',
  );
});

test('fetchOfficialDraw no envía x-api-key', async () => {
  let requestedUrl = '';
  let requestedHeaders = null;
  const fetchImpl = async (url, options) => {
    requestedUrl = String(url);
    requestedHeaders = options.headers;
    return new Response(primitivaHtml, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const draw = await fetchOfficialDraw({ game: GAMES.primitiva, date: '2026-07-27', fetchImpl });
  assert.equal(draw.date, '2026-07-27');
  assert.match(requestedUrl, /loteriasyapuestas\.es/);
  assert.equal(requestedHeaders['x-api-key'], undefined);
});

test('genera solo fechas compatibles con el calendario del juego', () => {
  const dates = candidateDrawDates(GAMES.primitiva, { now: new Date('2026-07-30T12:00:00Z'), count: 4 });
  assert.deepEqual(dates, ['2026-07-30', '2026-07-27', '2026-07-25', '2026-07-23']);
});

test('admite un resultado oficial embebido como datos estructurados', () => {
  const html = `<html><body><h1>Resultados último sorteo de La Primitiva</h1>
  <script>window.__result={"numbers":[3,9,14,22,35,49],"complementario":6,"reintegro":4};</script>
  <p>Complementario: 6 · Reintegro: 4</p></body></html>`;
  const draw = parseSelaeHtml(html, GAMES.primitiva, { requestedDate: '2026-07-30' });
  assert.deepEqual(draw.winningNumbers, [3, 9, 14, 22, 35, 49]);
  assert.equal(draw.complementary, 6);
  assert.equal(draw.extra, 4);
});
