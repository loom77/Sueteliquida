import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/mobile-yuma-hotfix.css', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../src/components/HomeExperience.jsx', import.meta.url), 'utf8');
const coreSource = readFileSync(new URL('../src/components/PrimyCoreDialog.jsx', import.meta.url), 'utf8');

test('Yuma mobile hotfix is loaded after the main stylesheet', () => {
  assert.match(mainSource, /import '\.\/index\.css'[\s\S]*import '\.\/mobile-yuma-hotfix\.css'/);
});

test('mobile keeps Primy Core access above the fixed navigation and creation CTA', () => {
  assert.match(css, /\.primy-core-spotlight--mobile-guide \.primy-core-learn--compact[\s\S]*position:\s*fixed\s*!important/);
  assert.match(css, /bottom:\s*calc\(9\.45rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /\.primy-main-content\[data-view='generate'\][\s\S]*padding-bottom:\s*calc\(13rem/);
});

test('mobile restores the owl and visible icons', () => {
  assert.match(css, /\.primy-home-v16__mascot[\s\S]*display:\s*flex\s*!important/);
  assert.match(css, /url\('\/mascot\/primy-avatar\.webp'\)/);
  assert.match(css, /\.primy-mobile-nav__icon svg[\s\S]*display:\s*block\s*!important/);
  assert.match(css, /\.primy-creative-icon[\s\S]*visibility:\s*visible\s*!important/);
});

test('home and explainer explicitly describe AI, statistics and Monte Carlo', () => {
  assert.match(homeSource, /inteligencia artificial/i);
  assert.match(homeSource, /Monte Carlo/i);
  assert.match(coreSource, /IA para organizar y explicar/i);
  assert.match(coreSource, /Estadística y simulaciones Monte Carlo/i);
});
