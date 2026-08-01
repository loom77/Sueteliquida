import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('la revisión mobile e iPad usa icono de presupuesto, navegación compacta y filtros progresivos', () => {
  const generator = read('../src/components/GeneratorPanel.jsx');
  const icons = read('../src/components/Icons.jsx');
  const settings = read('../src/components/SettingsView.jsx');
  const history = read('../src/components/TicketHistory.jsx');
  const css = read('../src/index.css');
  assert.match(generator, /BudgetControlIcon/);
  assert.match(icons, /export const BudgetControlIcon/);
  assert.match(settings, /primy-profile-mobile-nav/);
  assert.match(history, /primy-archive-mobile-filters/);
  assert.match(css, /Primy v16\.3/);
  assert.match(css, /@media \(max-width: 699px\)/);
  assert.match(css, /@media \(min-width: 700px\) and \(max-width: 1199px\)/);
});
