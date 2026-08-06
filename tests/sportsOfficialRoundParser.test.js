import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOfficialSportsRoundHtml } from '../src/sports/officialRoundParser.js';

const quinielaHtml = `
<html><body><h1>La Quiniela · Jornada 1ª de la temporada 2026-2027</h1>
<p>Fecha jornada: 16 de agosto de 2026</p>
${Array.from({ length: 14 }, (_, index) => `<div class="partido">${index + 1}. Local ${index + 1} - Visitante ${index + 1}<span>1 X 2</span></div>`).join('')}
<div>P-15. España - Argentina <span>0 1 2 M 0 1 2 M</span></div>
</body></html>`;

const quinigolHtml = `
<html><body><h1>El Quinigol</h1><p>17/08/2026</p>
<table>${Array.from({ length: 6 }, (_, index) => `<tr><td>${index + 1}</td><td>Casa ${index + 1}</td><td>Fuera ${index + 1}</td><td>${index % 2 ? '1-1' : '3-0'}</td></tr>`).join('')}</table>
</body></html>`;

test('interpreta la composición oficial actual de La Quiniela sin confundir los controles 1-X-2', () => {
  const round = parseOfficialSportsRoundHtml(quinielaHtml, 'quiniela', { sourceUrl: 'https://www.loteriasyapuestas.es/es/resultados/quiniela/comprobar' });
  assert.equal(round.gameId, 'quiniela');
  assert.equal(round.matches.length, 15);
  assert.equal(round.matches[14].homeTeam, 'España');
  assert.equal(round.matches[14].awayTeam, 'Argentina');
  assert.equal(round.roundDate, '2026-08-16');
  assert.equal(round.officialRoundNumber, '1');
  assert.equal(round.season, '2026-2027');
  assert.equal(round.status, 'published');
  assert.equal(round.validation.valid, true);
});

test('interpreta resultados oficiales de Quinigol y agrega M para tres o más goles', () => {
  const round = parseOfficialSportsRoundHtml(quinigolHtml, 'quinigol', { sourceUrl: 'https://www.loteriasyapuestas.es/es/el-quinigol/resultados/test' });
  assert.equal(round.matches.length, 6);
  assert.equal(round.status, 'official');
  assert.deepEqual(round.matches[0].officialScore, { home: 3, away: 0 });
  assert.equal(round.matches[0].metadata.officialOutcome, 'M-0');
  assert.equal(round.roundDate, '2026-08-17');
});

test('rechaza una jornada oficial incompleta en vez de inventar partidos', () => {
  assert.throws(
    () => parseOfficialSportsRoundHtml('<div>1. A - B</div>', 'quiniela'),
    error => error.code === 'SPORTS_MATCH_COUNT_MISMATCH',
  );
});

test('une posición y partido cuando SELAE los publica en nodos adyacentes', () => {
  const html = `<html><body><p>18/08/2026</p>${Array.from({ length: 6 }, (_, index) => `<p>${index + 1}.</p><p>Local separado ${index + 1} - Visitante separado ${index + 1}</p>`).join('')}</body></html>`;
  const round = parseOfficialSportsRoundHtml(html, 'quinigol');
  assert.equal(round.matches.length, 6);
  assert.equal(round.matches[0].homeTeam, 'Local separado 1');
  assert.equal(round.matches[5].awayTeam, 'Visitante separado 6');
});
