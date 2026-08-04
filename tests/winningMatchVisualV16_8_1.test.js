import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relative => readFile(new URL(relative, import.meta.url), 'utf8');

test('las coincidencias usan señal visual reforzada y accesible', async () => {
  const ui = await read('../src/components/TicketUI.jsx');
  assert.match(ui, /number-ball-ui--hit/);
  assert.match(ui, /number-ball-ui__match/);
  assert.match(ui, /coincide con el resultado oficial/);
  assert.match(ui, /dimmed/);
});

test('el archivo compara la jugada con el resultado oficial', async () => {
  const history = await read('../src/components/TicketHistory.jsx');
  assert.match(history, /OfficialDrawComparison/);
  assert.match(history, /Números extraídos y coincidencias/);
  assert.match(history, /officialSecondary/);
  assert.match(history, /officialComplementary/);
  assert.match(history, /playedExtras/);
});

test('el estilo diferencia hits, resultado oficial y números no coincidentes', async () => {
  const css = await read('../src/index.css');
  assert.match(css, /\.number-ball-ui--hit/);
  assert.match(css, /\.number-ball-ui--winning/);
  assert.match(css, /\.number-ball-ui--dimmed/);
  assert.match(css, /@keyframes primyMatchReveal/);
  assert.match(css, /prefers-reduced-motion/);
});
