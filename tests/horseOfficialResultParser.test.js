import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOfficialHorseResultHtml } from '../src/horse/officialHorseParser.js';

const lototurf = `
Lototurf - J44ª Jornada 44ª - sábado - sáb - 25/07/2026
Ver por orden de aparición
03
04
10
20
23
31
23
31
10
03
04
20
Caballo
08
R
2
1ª (6 Números + Caballo Ganador) 0 0,00 €
2ª (6 Números) 0 0,00 €
4ª (5 Números) 5 533,78 €
Reintegro 3.736 1,00 €
`;

const quintuple = `
Quíntuple Plus - J44ª Jornada 44ª - sábado - sáb - 25/07/2026
1. Carrera 1 Image 01
2. Carrera 2 Image 01
3. Carrera 3 Image 02
4. Carrera 4 Image 08
5. Carrera 5 Image 04
6. Carrera 5 (2º Clasificado) Image 02
Especial (1 solo resguardo de 1ª Cat) 0 0,00 €
1ª (5 Caballos Gan+2º de 5ªCarrera) 3 973,68 €
2ª (5 Caballos Ganadores) 6 142,00 €
3ª (4 Caballos Gan+2º de 5ªCarrera) 49 17,39 €
4ª (4 Caballos Ganadores) 109 7,82 €
`;

test('interpreta combinación, caballo y reintegro oficiales de Lototurf', () => {
  const round = parseOfficialHorseResultHtml(lototurf, 'lototurf');
  assert.equal(round.roundDate, '2026-07-25');
  assert.equal(round.officialRoundNumber, '44');
  assert.deepEqual(round.result.winningNumbers, [3, 4, 10, 20, 23, 31]);
  assert.equal(round.result.winningHorse, 8);
  assert.equal(round.result.reintegro, 2);
  assert.equal(round.result.prizeCategories.at(-1).prize, 1);
});

test('interpreta ganadores y segundo de la quinta carrera', () => {
  const round = parseOfficialHorseResultHtml(quintuple, 'quintuple-plus');
  assert.deepEqual(round.result.winners, [1, 1, 2, 8, 4]);
  assert.equal(round.result.secondFifth, 2);
  assert.equal(round.result.prizeCategories.length, 5);
  assert.equal(round.result.prizeCategories[1].prize, 973.68);
});
