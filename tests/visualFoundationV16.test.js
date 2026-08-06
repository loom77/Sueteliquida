import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

const tokens = read('../src/styles/design-tokens.css');
const designSystem = read('../src/components/DesignSystem.jsx');
const mascot = read('../src/components/PrimyMascot.jsx');
const thinking = read('../src/components/ThinkingProgress.jsx');
const shell = read('../src/components/AppShell.jsx');
const home = read('../src/components/HomeExperience.jsx');
const dashboard = read('../src/components/DashboardView.jsx');
const main = read('../src/main.jsx');
const css = read('../src/index.css');

test('v16 centraliza color, superficies, radios, sombras y movimiento', () => {
  assert.match(tokens, /--ds-brand-700:\s*#0b7a49/);
  assert.match(tokens, /--ds-accent:\s*#ffd052/);
  assert.match(tokens, /--ds-radius-control:\s*\.75rem/);
  assert.match(tokens, /--ds-radius-card:\s*1rem/);
  assert.match(tokens, /--ds-motion-page:\s*240ms/);
  assert.match(main, /styles\/design-tokens\.css/);
});

test('el design system expone las primitivas aprobadas sin romper los wrappers heredados', () => {
  for (const component of ['Button', 'Card', 'SectionHeader', 'StatusNotice', 'EmptyState', 'PageHeader', 'SegmentedControl', 'ActionMenu']) {
    assert.match(designSystem, new RegExp(`export function ${component}`));
  }
  assert.match(designSystem, /export function PrimaryButton/);
  assert.match(designSystem, /export function SecondaryButton/);
});

test('la mascota usa roles funcionales centralizados', () => {
  for (const role of ['guide', 'welcome', 'thinking', 'confirmation', 'responsible', 'empty']) {
    assert.match(mascot, new RegExp(`${role}:`));
  }
  assert.match(mascot, /data-mascot-role/);
  assert.match(home, /PrimyMascot role="welcome"/);
  assert.match(shell, /PrimyMascot role="guide" protagonist=\{false\}/);
});

test('la base del rituale de elaboración contiene cuatro fases transparentes', () => {
  assert.match(thinking, /Revisando las reglas del juego/);
  assert.match(thinking, /Comprobando el coste y tus límites/);
  assert.match(thinking, /Preparando la combinación/);
  assert.match(thinking, /Haciendo la última revisión/);
  assert.match(thinking, /PrimyMascot role="thinking"/);
});

test('sidebar y home eliminan duplicaciones y usan una jerarquía más corta', () => {
  assert.doesNotMatch(shell, /Todo lo que necesitas para vivir cada sorteo/);
  assert.match(shell, /label: 'Preparar'/);
  assert.match(shell, /primy-sidebar/);
  assert.match(dashboard, /HomeOverview/);
  assert.match(home, /Resultado neto/);
  assert.match(home, /Premios confirmados/);
  assert.match(home, /Última actividad/);
  assert.match(home, /Accesos rápidos/);
  assert.match(css, /\.primy-home-v16__hero/);
  assert.match(css, /\.primy-nav-item\[data-active='true'\]/);
});
