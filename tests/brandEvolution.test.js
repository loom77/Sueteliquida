import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8');
}

test('la evolución de marca final incluye símbolo, wordmark, refresh CSS e iconos PWA coherentes', () => {
  const visuals = read('../src/components/BrandVisuals.jsx');
  const brandRefresh = read('../src/brand-refresh.css');
  const indexHtml = read('../index.html');
  const logo = read('../public/primy-logo.svg');
  const mark = read('../public/primy-mark.svg');
  const appIcon = read('../public/primy-app-icon.svg');
  const favicon = read('../public/favicon.svg');

  assert.match(visuals, /PrimyMark/);
  assert.match(visuals, /Tu guía inteligente de juego/);
  assert.match(indexHtml, /brand-refresh\.css/);
  assert.match(brandRefresh, /primy-mark\.svg/);
  assert.match(logo, />Primy<|>\s*Primy\s*</);
  assert.match(logo, />7<|>\s*7\s*</);
  assert.match(mark, />7<|>\s*7\s*</);
  assert.match(appIcon, /aria-label="Primy"/);
  assert.match(favicon, /svg/i);
  assert.ok(fs.statSync(new URL('../public/icon-192x192.png', import.meta.url)).size > 1000);
  assert.ok(fs.statSync(new URL('../public/icon-512x512.png', import.meta.url)).size > 1000);
  assert.ok(fs.statSync(new URL('../public/apple-touch-icon.png', import.meta.url)).size > 1000);
});
