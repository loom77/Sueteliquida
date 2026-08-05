import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Primy Core appare in evidenza nella prima schermata', () => {
  const home = read('../src/components/HomeExperience.jsx');
  assert.match(home, /primy-home-core-feature/);
  assert.match(home, /Descubre Primy Core/);
  assert.match(home, /inteligencia artificial/);
  assert.match(home, /simulaciones Monte Carlo/);
  assert.match(home, /No predice resultados ni aumenta la probabilidad matemática de ganar/);
  assert.match(home, /PrimyCoreDialog/);
});

test('la guida Core resta accessibile su telefono e iPad', () => {
  const generator = read('../src/components/GeneratorPanel.jsx');
  const css = read('../src/index.css');
  assert.match(generator, /primy-core-spotlight--mobile-guide/);
  assert.match(generator, /Descubre cómo funciona Primy Core/);
  assert.match(css, /\.primy-core-spotlight--mobile-guide\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(css, /grid-column:\s*1\s*\/\s*-1/);
  assert.match(css, /\.primy-core-learn--compact span \{ position: static/);
  assert.match(css, /@media \(min-width: 700px\) and \(max-width: 1199px\)[\s\S]*?\.primy-core-spotlight--mobile-guide/);
});

test('la spiegazione distingue AI, statistica e Monte Carlo da una previsione', () => {
  const dialog = read('../src/components/PrimyCoreDialog.jsx');
  assert.match(dialog, /IA para organizar y explicar/);
  assert.match(dialog, /Estadística y simulaciones Monte Carlo/);
  assert.match(dialog, /no predicen la siguiente extracción/);
  assert.match(dialog, /no aumenta las probabilidades matemáticas/);
});

test('la release del hotfix di discoverability è 17.1.2', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '17.1.2');
  assert.match(read('../src/utils/release.js'), /17\.1\.2/);
  assert.match(read('../public/offline.html'), /v17\.1\.2/);
});
