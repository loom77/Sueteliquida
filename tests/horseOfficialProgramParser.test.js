import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractHorseDocumentLinks,
  parseHorseWithdrawalsText,
  parseOfficialHorseProgramText,
} from '../src/horse/officialHorseParser.js';

const lototurfProgram = `
Nº CABALLO EDAD KG JINETE CUADRA ENTRENADOR CAJÓN Últ. actuaciones*
1 PONCE DE LEON (FR) 6 años 63 J.ZAMBUDIO BOLAK J.HORCAJADA 1 [03,12,06,08,02]
2 SPANISH RULER (FR) 6 años 62,5 V.JANACEK YEGUADA VALMODOMUS G.ARIZKORRETA 6 [04,NP,02,01,06]
3 YUKATA ROSA (IRE) 4 años 61 R.N.VALLE YEGUADA AGF G.ARIZKORRETA 10 [07,02,02,09]
4 NAT IMPACT (GB) 5 años 60 I.MELGAREJO AFRICA J.M.OSORIO 7 [01,06,08,09,01]
5 YENKA (FR) 4 años 56 R.SOUSA BIENVENIDO MORENO B.MORENO 5 [02,07,09,01,05]
6 CHENEL (FR) 6 años 56 B.FAYOS PALCO 7 R.MAROTO 8 [03,01,02,05,05]
7 MARCO AURELIO (IRE) 5 años 54,5 J.GOMEZ DON PEPE M.A. ALVAREZ 2 [05,01,02,05,06]
8 DANCELOT (FR) 3 años 54,5 V.ALONSO MARQUES DE MIRAFLORES CH.DELCHER 3 [01,07,01,04,08]
9 AGRIPA (FR) 3 años 54 J.GELABERT YEGUADA URDIÑ-ORIYA A.SOTO 4 [01,02,05]
10 SOFUNNY (IRE) 7 años 52,5 D.SIKOROVA MAFIUS J.C.ROSELL 9 [07,07,06,07,09]
Programa de la 4ª carrera de caballos a celebrarse en el Hipódromo de la Zarzuela el próximo domingo y que determina el caballo ganador para la apuesta del Lototurf.
DOMINGO
14/06/2026
CONCURSO
32/2026
4ª CARRERA - Premio Alberto Domper - 11.050 Euros a repartir - 2.400 mts Hora: 13:15 h.
`;

const withdrawals = `
CABALLOS RETIRADOS
Jornada: 32 Fecha: 14/06/2026
CARRERA CABALLO NOMBRE FECHA
4 8 DANCELOT (FR) 13/06/2026
`;

const quintupleProgram = `
JORNADA 33/2026 FECHA 18/06/2026 HIPÓDROMO DE LA ZARZUELA
1ª CARRERA - Premio Uno - 1.600 mts Hora: 11:30 h.
1 CABALLO UNO 4 años 58 JINETE A CUADRA A ENTRENADOR A 1 [01,02]
2 CABALLO DOS 5 años 57 JINETE B CUADRA B ENTRENADOR B 2 [03,01]
3 CABALLO TRES 3 años 56 JINETE C CUADRA C ENTRENADOR C 3 [02,04]
2ª CARRERA - Premio Dos - 1.800 mts Hora: 12:05 h.
1 CABALLO CUATRO 4 años 58 JINETE D CUADRA D ENTRENADOR D 1 [01]
2 CABALLO CINCO 5 años 57 JINETE E CUADRA E ENTRENADOR E 2 [02]
3 CABALLO SEIS 3 años 56 JINETE F CUADRA F ENTRENADOR F 3 [03]
3ª CARRERA - Premio Tres - 2.000 mts Hora: 12:40 h.
1 CABALLO SIETE 4 años 58 JINETE G CUADRA G ENTRENADOR G 1 [01]
2 CABALLO OCHO 5 años 57 JINETE H CUADRA H ENTRENADOR H 2 [02]
3 CABALLO NUEVE 3 años 56 JINETE I CUADRA I ENTRENADOR I 3 [03]
4ª CARRERA - Premio Cuatro - 2.200 mts Hora: 13:15 h.
1 CABALLO DIEZ 4 años 58 JINETE J CUADRA J ENTRENADOR J 1 [01]
2 CABALLO ONCE 5 años 57 JINETE K CUADRA K ENTRENADOR K 2 [02]
3 CABALLO DOCE 3 años 56 JINETE L CUADRA L ENTRENADOR L 3 [03]
5ª CARRERA - Premio Cinco - 2.400 mts Hora: 13:50 h.
1 CABALLO TRECE 4 años 58 JINETE M CUADRA M ENTRENADOR M 1 [01]
2 CABALLO CATORCE 5 años 57 JINETE N CUADRA N ENTRENADOR N 2 [02]
3 CABALLO QUINCE 3 años 56 JINETE O CUADRA O ENTRENADOR O 3 [03]
`;

test('interpreta el programa oficial de Lototurf y aplica retirados', () => {
  const round = parseOfficialHorseProgramText(lototurfProgram, 'lototurf', { withdrawalText: withdrawals });
  assert.equal(round.roundDate, '2026-06-14');
  assert.equal(round.officialRoundNumber, '32');
  assert.equal(round.races.length, 1);
  assert.equal(round.races[0].officialRaceNumber, 4);
  assert.equal(round.races[0].runners.length, 10);
  assert.equal(round.races[0].distanceMeters, 2400);
  assert.equal(round.races[0].runners.find(runner => runner.number === 8).status, 'withdrawn');
  assert.equal(round.validation.valid, true);
});

test('interpreta cinco carreras oficiales de Quíntuple Plus', () => {
  const round = parseOfficialHorseProgramText(quintupleProgram, 'quintuple-plus');
  assert.equal(round.roundDate, '2026-06-18');
  assert.equal(round.officialRoundNumber, '33');
  assert.equal(round.races.length, 5);
  assert.equal(round.races.every(race => race.runners.length === 3), true);
  assert.equal(round.races[4].distanceMeters, 2400);
});

test('interpreta el documento oficial de retirados', () => {
  const parsed = parseHorseWithdrawalsText(withdrawals);
  assert.equal(parsed.roundDate, '2026-06-14');
  assert.equal(parsed.officialRoundNumber, '32');
  assert.deepEqual(parsed.withdrawals[0], {
    raceNumber: 4,
    horseNumber: 8,
    horseName: 'DANCELOT (FR)',
    publishedDate: '2026-06-13',
  });
});

test('descubre enlaces PDF oficiales sin copiar marcas o contenidos', () => {
  const html = `<a href="/f/loterias/documentos/Lototurf/Programa%20LT%2032.pdf">Programa de carreras jornada del 14/06/2026</a><a href="/f/loterias/documentos/Apuestas_Hipicas/Caballos%20retirados/Caballos%20Retirados%2032.pdf">Caballos retirados</a>`;
  const documents = extractHorseDocumentLinks(html, 'https://www.loteriasyapuestas.es/es/lototurf/programa-favoritos-y-retirados');
  assert.equal(documents.length, 2);
  assert.equal(documents[0].kind, 'program');
  assert.equal(documents[1].kind, 'withdrawals');
});
