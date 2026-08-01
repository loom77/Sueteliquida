import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync(new URL('../src/components/GeneratorPanel.jsx', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../src/components/HomeExperience.jsx', import.meta.url), 'utf8');
const dialog = fs.readFileSync(new URL('../src/components/PrimyCoreDialog.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Primy Core recibe una presentación destacada y accesible', () => {
  assert.match(generator, /primy-core-spotlight/);
  assert.match(generator, /Descubre más sobre Primy Core/);
  assert.match(generator, /aria-haspopup="dialog"/);
  assert.match(generator, /<PrimyCoreDialog open=\{coreInfoOpen\}/);
  assert.match(dialog, /id="primy-core-dialog-title"/);
});

test('la página principal abre el mismo diálogo de Primy Core desde un acceso evidente', () => {
  assert.match(home, /Cómo funciona Primy Core/);
  assert.match(home, /primy-home-core-trigger/);
  assert.match(home, /aria-controls="primy-core-info-dialog"/);
  assert.match(home, /<PrimyCoreDialog open=\{coreInfoOpen\}/);
  assert.match(css, /\.primy-home-core-trigger\s*\{/);
});

test('el diálogo compartido explica con lenguaje simple qué hace y qué no hace Primy Core', () => {
  assert.match(dialog, /Analiza y ordena/);
  assert.match(dialog, /motor inteligente de análisis avanzado/);
  assert.match(dialog, /Comprueba y acompaña/);
  assert.match(dialog, /No asegura ninguna ganancia/);
  assert.match(dialog, /PrimyMascotGraphic variant="helper"/);
});

test('la experiencia translúcida respeta movimiento reducido', () => {
  assert.match(css, /\.primy-core-spotlight\s*\{[\s\S]*backdrop-filter:\s*blur\(18px\)/);
  assert.match(css, /@keyframes primyCoreGlassSweep/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.primy-core-spotlight::after[\s\S]*animation:\s*none !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.primy-home-core-trigger/);
});
