import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('la evolución de marca incluye símbolo, wordmark e iconos PWA coherentes', () => {
  const visuals = fs.readFileSync(new URL('../src/components/BrandVisuals.jsx', import.meta.url), 'utf8');
  const logo = fs.readFileSync(new URL('../public/primy-logo.svg', import.meta.url), 'utf8');
  const appIcon = fs.readFileSync(new URL('../public/primy-app-icon.svg', import.meta.url), 'utf8');
  assert.match(visuals, /PrimyMark/);
  assert.match(visuals, /Tu guía inteligente de juego/);
  assert.match(logo, /TU GUÍA INTELIGENTE DE JUEGO/);
  assert.match(appIcon, /aria-label="Primy"/);
  assert.ok(fs.statSync(new URL('../public/icon-192x192.png', import.meta.url)).size > 1000);
  assert.ok(fs.statSync(new URL('../public/icon-512x512.png', import.meta.url)).size > 1000);
});
