import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candidateDrawDates,
  fetchOfficialDraw,
  parseSelaeHtml,
  parseNationalOfficialListText,
  extractNationalOfficialListUrl,
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



test('interpreta El Gordo con cinco números y número clave', () => {
  const html = `
    <html><body><h1>El Gordo</h1><p>Resultado del sorteo 26/07/2026</p>
    <div>Combinación ganadora: 8 - 22 - 38 - 39 - 46</div>
    <p>Nº clave: 0</p><table><tr><td>8.ª categoría</td><td>3,00 €</td></tr></table>
    </body></html>`;
  const url = selaeResultUrl(GAMES.gordoprimitiva, '2026-07-26');
  assert.match(url, /gordo\.html/);
  assert.match(url, /game_id=ELGR/);
  const draw = parseSelaeHtml(html, GAMES.gordoprimitiva, { requestedDate: '2026-07-26' });
  assert.deepEqual(draw.winningNumbers, [8, 22, 38, 39, 46]);
  assert.equal(draw.extra, 0);
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

test('interpreta el resumen oficial de Lotería Nacional sin perder números de cinco cifras', () => {
  const html = `
    <html><body>
      <p>Lotería Nacional: resultados del 04/07/2026</p>
      <h2>1er Premio</h2><strong>70334</strong>
      <h2>2º Premio</h2><strong>61957</strong>
      <h2>3er Premio</h2><strong>45794</strong>
      <p>FRACCIÓN</p><span>1</span><p>SERIE</p><span>6</span>
      <p>Reintegros</p><ul><li>R 0</li><li>R 4</li><li>R 8</li></ul>
      <table>
        <tr><td>Premio Especial</td><td>20.000.000 €</td></tr>
        <tr><td>1er Premio</td><td>200.000 €</td></tr>
        <tr><td>2º Premio</td><td>60.000 €</td></tr>
        <tr><td>3er Premio</td><td>20.020 €</td></tr>
        <tr><td>Reintegro</td><td>20 €</td></tr>
      </table>
    </body></html>`;
  const url = selaeResultUrl(GAMES['loteria-nacional'], '2026-07-04');
  assert.match(url, /lnac\.html/);
  assert.match(url, /game_id=LNAC/);
  const result = parseSelaeHtml(html, GAMES['loteria-nacional'], { requestedDate: '2026-07-04' });
  assert.equal(result.metadata.firstPrize, '70334');
  assert.equal(result.metadata.secondPrize, '61957');
  assert.equal(result.metadata.specialPrize.series, 6);
  assert.deepEqual(result.metadata.refunds, ['0', '4', '8']);
  assert.ok(result.prizes.some(prize => prize.type === 'special' && prize.amount === 20000000));
});


test('interpreta el listado oficial completo de Lotería Nacional como importes por décimo', () => {
  const listText = `
    LISTA OFICIAL de las extracciones realizadas
    1 Premio de 300.000 euros para el billete número 77014
    1 Premio de 60.000 euros para el billete número 78788
    Aproximaciones de 12.000 euros cada una, para los billetes números 77013 y 77015
    Aproximaciones de 7.470 euros cada una, para los billetes números 78787 y 78789
    Centenas de 300 euros cada una, para los billetes números 77000 al 77099
    Centenas de 150 euros cada una, para los billetes números 78700 al 78799
    40 Premios de 750 euros cada uno, para todos los billetes terminados en:
    0558 3520 3664 7477
    700 Premios de 150 euros cada uno, para todos los billetes terminados en:
    124 141 343 453 620 897 997
    9.000 Premios de 60 euros cada uno, para todos los billetes terminados en:
    21 23 36 44 60 83 83 91 99
    9 Premios de 750 euros cada uno, para los billetes terminados como el primer premio en 7014
    99 Premios de 150 euros cada uno, para los billetes terminados como el primer premio en 014
    999 Premios de 60 euros cada uno, para los billetes terminados como el primer premio en 14
    10.000 Reintegros de 30 euros cada uno, para los billetes cuya última cifra obtenida en la primera extracción especial sea 3
    9.999 Reintegros de 30 euros cada uno, para los billetes terminados como el primer premio en 4
    INSTRUCCIONES PARA LA CONSULTA DE ESTA LISTA
  `;
  const parsed = parseNationalOfficialListText(listText, {
    firstPrize: '77014', secondPrize: '78788',
    summaryPrizes: [
      { type: 'exact', category: '1er Premio', number: '77014', amount: 30000 },
      { type: 'exact', category: '2º Premio', number: '78788', amount: 6000 },
    ],
    officialListUrl: 'https://example.test/lista.pdf',
  });
  assert.equal(parsed.metadata.nationalCompleteness, 'full-list');
  assert.ok(parsed.prizes.some(prize => prize.type === 'approximation' && prize.number === '77014' && prize.amount === 1200));
  assert.ok(parsed.prizes.some(prize => prize.type === 'hundred' && prize.value === '770' && prize.amount === 30));
  assert.ok(parsed.prizes.some(prize => prize.type === 'ending' && prize.value === '0558' && prize.amount === 75));
  assert.equal(parsed.prizes.filter(prize => prize.type === 'ending' && prize.value === '83').length, 2);
  assert.ok(parsed.prizes.some(prize => prize.type === 'refund' && prize.value === '3' && prize.amount === 3));
});

test('extrae el enlace PDF del listado oficial desde HTML o Markdown', () => {
  const href = '/f/loterias/documentos/Lotería%20Nacional/listas/SM_LISTAOFICIAL.A2026.S061.pdf';
  assert.match(extractNationalOfficialListUrl(`<a href="${href}">Listado de premios</a>`), /SM_LISTAOFICIAL/);
  assert.equal(extractNationalOfficialListUrl('[Listado de premios](https://example.test/lista.pdf)'), 'https://example.test/lista.pdf');
});
