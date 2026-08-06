import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchOfficialHorseProgram,
  fetchOfficialHorseResult,
  horseProgramPageUrl,
  horseResultSourceUrl,
} from '../api/_horseOfficialProvider.js';

const programText = `
DOMINGO 14/06/2026 CONCURSO 32/2026
Programa de la 4ª carrera de caballos a celebrarse en el Hipódromo de la Zarzuela el próximo domingo.
4ª CARRERA - Premio Test - 2.400 mts Hora: 13:15 h.
1 CABALLO UNO 4 años 58 JINETE A CUADRA A ENTRENADOR A 1 [01]
2 CABALLO DOS 5 años 57 JINETE B CUADRA B ENTRENADOR B 2 [02]
3 CABALLO TRES 3 años 56 JINETE C CUADRA C ENTRENADOR C 3 [03]
`;

const resultHtml = `Lototurf - J32ª Jornada 32ª - domingo - dom - 14/06/2026\nVer por orden de aparición\n01\n02\n03\n04\n05\n06\nCaballo\n03\nR\n7`;

test('construye únicamente URLs oficiales SELAE', () => {
  assert.equal(horseProgramPageUrl('lototurf'), 'https://www.loteriasyapuestas.es/es/lototurf/programa-favoritos-y-retirados');
  assert.match(horseProgramPageUrl('quintuple-plus'), /quintuple-plus\/programa-favoritos-y-retirados/);
  assert.equal(horseResultSourceUrl('lototurf', '2026-06-14'), 'https://www.loteriasyapuestas.es/f/loterias/resultados/lototurf.html?game_id=LOTU&fecha_sorteo=20260614');
});

test('permite validar textos extraídos server-side sin enviar claves comerciales', async () => {
  const round = await fetchOfficialHorseProgram('lototurf', { programText, withdrawalText: '', fetchedAt: '2026-06-14T10:00:00Z' });
  assert.equal(round.races[0].runners.length, 3);
  let headers;
  const fetchImpl = async (_url, options) => {
    headers = options.headers;
    return new Response(resultHtml, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const result = await fetchOfficialHorseResult('lototurf', '2026-06-14', { fetchImpl });
  assert.equal(result.result.winningHorse, 3);
  assert.equal(headers['x-api-key'], undefined);
  assert.match(headers['User-Agent'], /Primy\/16\.6/);
});
