import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOfficialSportsRound, sportsRoundSourceUrl } from '../api/_sportsOfficialProvider.js';

const html = `<html><body><p>Fecha jornada: 16 de agosto de 2026</p>${Array.from({ length: 6 }, (_, index) => `<div>${index + 1}. Casa ${index + 1} - Fuera ${index + 1} 0 1 2 M 0 1 2 M</div>`).join('')}</body></html>`;

test('usa exclusivamente las páginas oficiales de comprobación de SELAE', () => {
  assert.equal(sportsRoundSourceUrl('quiniela'), 'https://www.loteriasyapuestas.es/es/resultados/quiniela/comprobar');
  assert.equal(sportsRoundSourceUrl('quinigol'), 'https://www.loteriasyapuestas.es/es/resultados/quinigol/comprobar');
});

test('descarga la jornada sin enviar claves comerciales', async () => {
  let headers = null;
  const fetchImpl = async (_url, options) => { headers = options.headers; return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }); };
  const round = await fetchOfficialSportsRound('quinigol', { fetchImpl });
  assert.equal(round.matches.length, 6);
  assert.equal(headers['x-api-key'], undefined);
  assert.match(headers['User-Agent'], /Primy/);
});
