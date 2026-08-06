import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  appendManualDigit,
  formatManualSelection,
  parseManualSelection,
  removeLastManualDigit,
  sanitizeManualSelectionText,
  toggleManualSelection,
} from '../src/utils/manualEntry.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('la selezione manuale accetta separatori, elimina duplicati e ordina', () => {
  assert.deepEqual(parseManualSelection('12, 3 12; 8-4', { min: 1, max: 49 }), [3, 4, 8, 12]);
  assert.equal(formatManualSelection([12, 3, 3, 8]), '3, 8, 12');
});

test('il selettore visuale rispetta limite, rimozione e intervallo', () => {
  let value = '';
  value = toggleManualSelection(value, 7, { min: 1, max: 49, limit: 2 });
  value = toggleManualSelection(value, 18, { min: 1, max: 49, limit: 2 });
  assert.equal(value, '7, 18');
  assert.equal(toggleManualSelection(value, 22, { min: 1, max: 49, limit: 2 }), '7, 18');
  assert.equal(toggleManualSelection(value, 7, { min: 1, max: 49, limit: 2 }), '18');
  assert.equal(toggleManualSelection(value, 99, { min: 1, max: 49, limit: 2 }), '7, 18');
});

test('la tastiera visuale della Lotería Nacional conserva gli zeri iniziali', () => {
  let value = '';
  for (const digit of [0, 0, 7, 4, 2, 9]) value = appendManualDigit(value, digit, 5);
  assert.equal(value, '00742');
  assert.equal(removeLastManualDigit(value), '0074');
});

test('il fallback testuale mantiene solo cifre e separatori utili', () => {
  assert.equal(sanitizeManualSelectionText('1, 2 / abc 3; 4'), '1, 2 3; 4');
});

test('il dialogo usa griglie touch e non dipende dal tastierino numerico per liste multiple', () => {
  const source = read('../src/components/ManualPlayDialog.jsx');
  assert.match(source, /function ManualNumberPicker/);
  assert.match(source, /aria-pressed=\{active\}/);
  assert.match(source, /Pegar o escribir números separados/);
  assert.match(source, /inputMode="text"/);
  assert.match(source, /function ManualDigitPad/);
  assert.doesNotMatch(source, /Los \{game\.numbersToPick\} números<input/);
});

test('la release del hotfix manuale è 18.1.1', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '18.1.1');
  assert.match(read('../src/utils/release.js'), /18\.1\.1/);
  assert.match(read('../public/offline.html'), /v18\.1\.1/);
});
