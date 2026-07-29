import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge, parseBirthDate, verifyMinimumAge } from '../src/utils/ageVerification.js';

test('verifica correctamente el día exacto de la mayoría de edad', () => {
  assert.equal(verifyMinimumAge('2008-07-29', 18, { year: 2026, month: 7, day: 29 }).eligible, true);
  assert.equal(verifyMinimumAge('2008-07-30', 18, { year: 2026, month: 7, day: 29 }).eligible, false);
});

test('rechaza fechas imposibles o futuras', () => {
  assert.equal(parseBirthDate('2008-02-30'), null);
  assert.equal(verifyMinimumAge('2030-01-01', 18, { year: 2026, month: 7, day: 29 }).reason, 'future');
});

test('calcula la edad sin guardar la fecha de nacimiento', () => {
  assert.equal(calculateAge('1977-05-26', { year: 2026, month: 7, day: 29 }), 49);
});
