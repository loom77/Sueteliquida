import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

const tokens = read('../src/styles/design-tokens.css');
const androidCss = read('../src/styles/android-design-system.css');
const designSystem = read('../src/components/DesignSystem.jsx');
const home = read('../src/components/HomeExperience.jsx');
const shell = read('../src/components/AppShell.jsx');
const journey = read('../src/components/CreateJourney.jsx');
const brand = read('../src/components/BrandVisuals.jsx');
const main = read('../src/main.jsx');
const pkg = JSON.parse(read('../package.json'));

test('v18.2 exposes Material semantic tokens and Android touch targets', () => {
  assert.match(tokens, /--md-sys-color-primary:/);
  assert.match(tokens, /--md-sys-color-primary-container:/);
  assert.match(tokens, /--ds-touch-target:\s*3rem/);
  assert.match(tokens, /--ds-content-compact:/);
  assert.match(tokens, /--ds-content-medium:/);
  assert.match(tokens, /--ds-content-expanded:/);
});

test('the Android component layer loads after legacy and v18 styles', () => {
  const v18Index = main.indexOf("import './primy-v18.css'");
  const androidIndex = main.indexOf("import './styles/android-design-system.css'");
  assert.ok(v18Index >= 0);
  assert.ok(androidIndex > v18Index);
  assert.match(androidCss, /\.ds-icon-button/);
  assert.match(androidCss, /\.ds-metric-card/);
  assert.match(androidCss, /@media \(min-width: 600px\)/);
  assert.match(androidCss, /@media \(min-width: 840px\)/);
});

test('the shared design system exports components mapped to Compose primitives', () => {
  for (const component of ['IconButton', 'Chip', 'MetricCard', 'AdaptiveGrid', 'ProgressSteps']) {
    assert.match(designSystem, new RegExp(`export function ${component}`));
  }
  assert.match(home, /<MetricCard/);
  assert.match(journey, /<ProgressSteps/);
  assert.match(journey, /label: 'Configura'/);
});

test('primary navigation follows the approved four-destination Android model', () => {
  assert.match(shell, /label: 'Inicio'/);
  assert.match(shell, /label: 'Preparar'/);
  assert.match(shell, /label: 'Archivo'/);
  assert.match(shell, /label: 'Perfil'/);
  assert.doesNotMatch(shell, /label: 'Juegos'/);
  assert.match(shell, /matches: \['generate', 'explore'\]/);
});

test('the official owl is the cross-platform mascot source', () => {
  assert.match(brand, /\/mascot\/primy-official-v18\.png/);
  assert.ok(fs.existsSync(new URL('../public/mascot/primy-official-v18.png', import.meta.url)));
});

test('release is v18.7.1', () => {
  assert.equal(pkg.version, '18.7.1');
  assert.match(read('../src/utils/release.js'), /18\.7\.1/);
});
