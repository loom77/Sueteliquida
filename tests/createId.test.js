import test from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/utils/createId.js';

test('crea identificadores no vacíos y distintos', () => {
  const first = createId('test');
  const second = createId('test');
  assert.equal(typeof first, 'string');
  assert.ok(first.length > 8);
  assert.notEqual(first, second);
});
