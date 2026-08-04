import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('la creación enruta Lototurf y Quíntuple Plus a paneles dedicados', async () => {
  const journey = await read('src/components/CreateJourney.jsx');
  assert.match(journey, /LototurfPanel/);
  assert.match(journey, /QuintuplePlusPanel/);
  assert.match(journey, /HorseTicketPreview/);
});

test('los paneles usan la jornada oficial, selección por dorsales y coste equivalente', async () => {
  const [lototurf, quintuple] = await Promise.all([
    read('src/components/LototurfPanel.jsx'),
    read('src/components/QuintuplePlusPanel.jsx'),
  ]);
  assert.match(lototurf, /useHorseRound\('lototurf'\)/);
  assert.match(lototurf, /Números del 1 al 31/);
  assert.match(lototurf, /apuestas equivalentes/);
  assert.match(quintuple, /useHorseRound\('quintuple-plus'\)/);
  assert.match(quintuple, /Segundo clasificado · carrera 5/);
  assert.match(quintuple, /65\.535 apuestas equivalentes/);
});

test('el archivo permite registrar y comprobar las hípicas sin habilitar repetición', async () => {
  const archive = await read('src/components/TicketHistory.jsx');
  assert.match(archive, /HorsePlayDetails/);
  assert.match(archive, /Registrar boleto comprado/);
  assert.match(archive, /CheckNowButton/);
  const section = archive.slice(archive.indexOf('function HorsePlayDetails'), archive.indexOf('function PlayDetails'));
  assert.match(section, /onPurchase/);
  assert.match(section, /onCheckPlay/);
  assert.doesNotMatch(section, /onRepeat/);
});
