import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_TIME_ZONE, drawInfoForDate, formatDrawTime, getNextDrawInfo, monthKeyMadrid, toLocalDateKey } from '../src/utils/drawSchedule.js';

test('los horarios se fijan en Europe/Madrid durante el verano', () => {
  const draw = drawInfoForDate('primitiva', '2026-07-27');
  assert.equal(APP_TIME_ZONE, 'Europe/Madrid');
  assert.equal(draw.drawDateTimeISO, '2026-07-27T19:40:00.000Z');
  assert.equal(formatDrawTime(draw.drawDateTimeISO), '21:40');
});

test('los horarios siguen automáticamente el cambio al horario de invierno', () => {
  const draw = drawInfoForDate('primitiva', '2026-10-26');
  assert.equal(draw.drawDateTimeISO, '2026-10-26T20:40:00.000Z');
  assert.equal(formatDrawTime(draw.drawDateTimeISO), '21:40');
});

test('EuroDreams distingue entre el sorteo y la publicación del resultado', () => {
  const draw = drawInfoForDate('eurodreams', '2026-07-27');
  assert.equal(formatDrawTime(draw.salesCloseISO), '20:30');
  assert.equal(formatDrawTime(draw.drawDateTimeISO), '21:00');
  assert.equal(formatDrawTime(draw.resultPublicationISO), '21:40');
  assert.ok(new Date(draw.resultPublicationISO) > new Date(draw.drawDateTimeISO));
});

test('el próximo sorteo no depende de la zona horaria del dispositivo', () => {
  const from = new Date('2026-07-27T20:45:00.000Z'); // 22:45 en Madrid, después de La Primitiva
  const next = getNextDrawInfo('primitiva', from);
  assert.equal(next.drawDateKey, '2026-07-30');
});

test('las claves del calendario usan siempre Madrid', () => {
  const instant = new Date('2026-07-31T22:30:00.000Z'); // ya es 1 de agosto en Madrid
  assert.equal(toLocalDateKey(instant), '2026-08-01');
  assert.equal(monthKeyMadrid(instant), '2026-08');
});
