import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('v18.4.1 warns before abandoning unsaved generated numbers', () => {
  const controller = read('../src/hooks/useAppController.js');
  const overlays = read('../src/app/AppOverlays.jsx');
  assert.match(controller, /hasUnsavedGeneratedPlay/);
  assert.match(controller, /beforeunload/);
  assert.match(controller, /¿Salir sin guardar esta jugada\?/);
  assert.match(controller, /Salir y perder los números/);
  assert.match(overlays, /unsavedGenerationConfirm/);
});

test('SPA navigation and browser back are guarded', () => {
  const router = read('../src/hooks/useAppRouter.js');
  assert.match(router, /shouldBlockNavigation/);
  assert.match(router, /onBlockedNavigation/);
  assert.match(router, /source: 'history'/);
  assert.match(router, /force = false/);
});

test('the guard also covers game switching, configuration discard and sign out', () => {
  const controller = read('../src/hooks/useAppController.js');
  assert.match(controller, /type: 'game'/);
  assert.match(controller, /type: 'discard'/);
  assert.match(controller, /type: 'signout'/);
  assert.match(controller, /requestDiscardLatest/);
  assert.match(controller, /requestSignOut/);
});
