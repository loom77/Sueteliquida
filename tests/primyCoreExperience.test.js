import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync(new URL('../src/components/GeneratorPanel.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Primy Core recibe una presentación destacada y accesible', () => {
  assert.match(generator, /primy-core-spotlight/);
  assert.match(generator, /Descubre más sobre Primy Core/);
  assert.match(generator, /aria-haspopup="dialog"/);
  assert.match(generator, /AccessibleDialog open=\{coreInfoOpen\}/);
  assert.match(generator, /id="primy-core-dialog-title"/);
});

test('el diálogo explica con lenguaje simple qué hace y qué no hace Primy Core', () => {
  assert.match(generator, /Analiza y ordena/);
  assert.match(generator, /Usa un motor inteligente de análisis avanzado/);
  assert.match(generator, /Comprueba y acompaña/);
  assert.match(generator, /No asegura ninguna ganancia, no compra boletos y no puede garantizar premios ni resultados futuros/);
  assert.match(generator, /PrimyMascotGraphic variant="helper"/);
});

test('la experiencia translúcida respeta movimiento reducido', () => {
  assert.match(css, /\.primy-core-spotlight\s*\{[\s\S]*backdrop-filter:\s*blur\(18px\)/);
  assert.match(css, /@keyframes primyCoreGlassSweep/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.primy-core-spotlight::after[\s\S]*animation:\s*none !important/);
});
