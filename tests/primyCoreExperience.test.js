import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync(new URL('../src/components/GeneratorPanel.jsx', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../src/components/HomeExperience.jsx', import.meta.url), 'utf8');
const dialog = fs.readFileSync(new URL('../src/components/PrimyCoreDialog.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Primy Core mantiene una explicación compartida y accesible en el contexto de creación', () => {
  assert.match(generator, /primy-core-spotlight/);
  assert.match(generator, /Cómo trabaja Primy Core/);
  assert.match(generator, /aria-haspopup="dialog"/);
  assert.match(generator, /<PrimyCoreDialog open=\{coreInfoOpen\}/);
  assert.match(dialog, /id="primy-core-dialog-title"/);
});

test('la home v16 elimina la repetición promocional de Primy Core y prioriza una sola acción', () => {
  assert.doesNotMatch(home, /Cómo funciona Primy Core/);
  assert.doesNotMatch(home, /primy-home-core-trigger/);
  assert.match(home, /Preparar una jugada/);
  assert.match(home, /PrimyMascot role="welcome"/);
});

test('el diálogo compartido explica con lenguaje simple qué hace y qué no hace Primy Core', () => {
  assert.match(dialog, /Analiza y ordena/);
  assert.match(dialog, /motor inteligente de análisis avanzado/);
  assert.match(dialog, /Comprueba y acompaña/);
  assert.match(dialog, /No asegura ninguna ganancia/);
  assert.match(dialog, /PrimyMascotGraphic variant="helper"/);
});

test('la experiencia translúcida y el sistema v16 respetan movimiento reducido', () => {
  assert.match(css, /\.primy-core-spotlight\s*\{[\s\S]*backdrop-filter:\s*blur\(18px\)/);
  assert.match(css, /@keyframes primyCoreGlassSweep/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\s*\.01ms !important/);
});
