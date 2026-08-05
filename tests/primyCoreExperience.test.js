import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync(new URL('../src/components/GeneratorPanel.jsx', import.meta.url), 'utf8');
const home = fs.readFileSync(new URL('../src/components/HomeExperience.jsx', import.meta.url), 'utf8');
const dialog = fs.readFileSync(new URL('../src/components/PrimyCoreDialog.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

test('Primy Core mantiene una explicación compartida y accesible en el contexto de creación', () => {
  assert.match(generator, /primy-core-spotlight/);
  assert.match(generator, /Descubre cómo funciona Primy Core/);
  assert.match(generator, /aria-haspopup="dialog"/);
  assert.match(generator, /<PrimyCoreDialog open=\{coreInfoOpen\}/);
  assert.match(dialog, /id="primy-core-dialog-title"/);
});

test('la home presenta Primy Core como una función principal y responsable', () => {
  assert.match(home, /primy-home-core-feature/);
  assert.match(home, /Descubre Primy Core/);
  assert.match(home, /IA, estadística y simulación/);
  assert.match(home, /No predice resultados ni aumenta la probabilidad matemática de ganar/);
  assert.match(home, /Preparar una jugada/);
  assert.match(home, /PrimyMascot role="welcome"/);
});

test('el diálogo compartido explica AI, Monte Carlo y sus límites', () => {
  assert.match(dialog, /IA para organizar y explicar/);
  assert.match(dialog, /Estadística y simulaciones Monte Carlo/);
  assert.match(dialog, /Validación matemática y oficial/);
  assert.match(dialog, /No conoce resultados futuros/);
  assert.match(dialog, /PrimyMascotGraphic variant="helper"/);
});

test('la experiencia translúcida y el sistema v16 respetan movimiento reducido', () => {
  assert.match(css, /\.primy-core-spotlight\s*\{[\s\S]*backdrop-filter:\s*blur\(18px\)/);
  assert.match(css, /@keyframes primyCoreGlassSweep/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\s*\.01ms !important/);
});
