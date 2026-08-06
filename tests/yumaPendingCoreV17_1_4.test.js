import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('home highlights Primy Core with AI and Monte Carlo', () => {
  const home = read('src/components/HomeExperience.jsx');
  const core = read('src/components/PrimyCoreDialog.jsx');
  assert.match(home, /Descubre Primy Core/);
  assert.match(home, /Monte Carlo/);
  assert.match(core, /inteligencia artificial/i);
  assert.match(core, /Monte Carlo/);
});

test('archive renders every pending play without slicing the list', () => {
  const plays = read('src/components/PlaysView.jsx');
  assert.match(plays, /Jugadas pendientes recientes/);
  assert.match(plays, /pending\.map\(play/);
  assert.doesNotMatch(plays, /pending\.slice\(/);
});

test('mobile hotfix is loaded', () => {
  const main = read('src/main.jsx');
  assert.match(main, /mobile-yuma-hotfix\.css/);
});
