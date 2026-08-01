import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('la UX de Quiniela simple usa la jornada oficial, 1-X-2, Pleno y coste persistente', () => {
  const panel = read('../src/components/QuinielaPanel.jsx');
  const preview = read('../src/components/QuinielaTicketPreview.jsx');
  const journey = read('../src/components/CreateJourney.jsx');
  const hook = read('../src/hooks/useSportsRound.js');
  assert.match(hook, /sports-rounds\?game=/);
  assert.match(panel, /14 signos y el Pleno al 15/);
  assert.match(panel, /QUINIELA_SYMBOLS/);
  assert.match(panel, /GOAL_BUCKETS/);
  assert.match(panel, /0\.75|QUINIELA_UNIT_PRICE/);
  assert.match(panel, /Una apuesta simple preparada, todavía no comprada/);
  assert.match(preview, /Guardar como borrador/);
  assert.doesNotMatch(preview, /He jugado|Registrar.*comprad/i);
  assert.match(journey, /QuinielaPanel/);
  assert.match(journey, /QuinielaTicketPreview/);
});

test('el archivo muestra el pronóstico deportivo sin habilitar compra ni repetición', () => {
  const archive = read('../src/components/TicketHistory.jsx');
  assert.match(archive, /QuinielaPlayDetails/);
  assert.match(archive, /Borrador deportivo: todavía no comprado/);
  assert.match(archive, /Pleno al 15/);
});
