import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('v18 home follows the approved Android-first information architecture', () => {
  const home = read('src/components/HomeExperience.jsx');
  assert.match(home, /Tu próxima jugada empieza aquí/);
  assert.match(home, /Descubre Primy Core/);
  assert.match(home, /Inteligencia artificial/);
  assert.match(home, /simulaciones Monte Carlo/);
  assert.match(home, /HOME_STEPS/);
  assert.match(home, /Elige tu juego/);
  assert.match(home, /FEATURED_GAME_IDS/);
});

test('v18 styles load after legacy mobile hotfixes', () => {
  const main = read('src/main.jsx');
  assert.match(main, /mobile-yuma-hotfix\.css'[\s\S]*primy-v18\.css'/);
});

test('Android creation screen keeps Core in flow and one sticky action above navigation', () => {
  const generator = read('src/components/GeneratorPanel.jsx');
  const css = read('src/primy-v18.css');
  assert.match(generator, /primy-core-spotlight--android-flow/);
  assert.match(generator, /data-android-sticky-action="true"/);
  assert.match(css, /primy-core-spotlight--android-flow[\s\S]*position:\s*relative\s*!important/);
  assert.match(css, /primy-core-spotlight--android-flow \.primy-core-learn--compact[\s\S]*position:\s*static\s*!important/);
  assert.match(css, /primy-generator__action-bar\[data-android-sticky-action='true'\][\s\S]*bottom:\s*calc\(var\(--primy-v18-nav-height\)/);
});

test('short Android viewports disable sticky action to avoid trapped content', () => {
  const css = read('src/primy-v18.css');
  assert.match(css, /max-height:\s*640px/);
  assert.match(css, /position:\s*static\s*!important/);
  assert.match(css, /100dvh/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('release is v18.0.3', () => {
  const pkg = JSON.parse(read('package.json'));
  const release = read('src/utils/release.js');
  assert.equal(pkg.version, '18.0.3');
  assert.match(release, /18\.0\.3/);
});
