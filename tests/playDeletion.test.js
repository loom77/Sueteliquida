import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlayDeleteDescription } from '../src/utils/playDeletion.js';

test('avisa al eliminar una jugada registrada como comprada', () => {
  const description = getPlayDeleteDescription({ purchased: true }, 'La Primitiva');

  assert.match(description, /registrada como comprada/i);
  assert.match(description, /no anula el boleto físico ni la apuesta realizada/i);
});

test('una jugada no comprada también exige confirmación y mantiene deshacer', () => {
  const description = getPlayDeleteDescription({ purchased: false }, 'EuroDreams');

  assert.match(description, /se eliminará del archivo/i);
  assert.match(description, /deshacer/i);
});
