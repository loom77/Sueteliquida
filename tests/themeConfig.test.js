import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import tailwindConfig from '../tailwind.config.js';

const requiredSkyShades = ['DEFAULT', '50', '100', '200', '300', '600', '700', '800', '950'];

test('la paleta Euromillones expone todos los tonos usados por la interfaz', () => {
  const sky = tailwindConfig.theme?.extend?.colors?.sky;
  assert.equal(typeof sky, 'object');
  for (const shade of requiredSkyShades) assert.ok(sky[shade], `Falta sky.${shade}`);
});

test('el generador y el selector usan una acción Euromillones con contraste garantizado', () => {
  const generator = fs.readFileSync(new URL('../src/components/GeneratorPanel.jsx', import.meta.url), 'utf8');
  const switcher = fs.readFileSync(new URL('../src/components/GameSwitch.jsx', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(generator, /primy-euromillones-action/);
  assert.match(generator, /data-game-action=\{activeGame\}/);
  assert.match(switcher, /primy-euromillones-action/);
  assert.match(css, /\.primy-euromillones-action\s*\{[\s\S]*background-color:\s*#0369a1;[\s\S]*color:\s*#fff;/);
});
