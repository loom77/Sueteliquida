import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDrawTime, getNextDrawInfo, getNextPlayableDrawInfo, isPreparationOpen, toLocalDateKey } from '../src/utils/drawSchedule.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('Primitiva rolls to Monday after the Saturday preparation cutoff', () => {
  const now = new Date('2026-08-08T21:25:00+02:00');
  const chronological = getNextDrawInfo('primitiva', now);
  const playable = getNextPlayableDrawInfo('primitiva', now);

  assert.equal(toLocalDateKey(chronological.drawDateTimeISO), '2026-08-08');
  assert.equal(toLocalDateKey(playable.drawDateTimeISO), '2026-08-10');
  assert.equal(formatDrawTime(playable.drawDateTimeISO), '21:40');
  assert.equal(formatDrawTime(playable.salesCloseISO), '21:15');
  assert.equal(playable.gameId, 'primitiva');
});

test('Primitiva remains available before the configured cutoff', () => {
  const now = new Date('2026-08-08T21:14:59+02:00');
  const playable = getNextPlayableDrawInfo('primitiva', now);
  assert.equal(toLocalDateKey(playable.drawDateTimeISO), '2026-08-08');
  assert.equal(isPreparationOpen(playable, now), true);
});

test('the exact sales cutoff closes preparation for that draw', () => {
  const now = new Date('2026-08-08T21:15:00+02:00');
  const playable = getNextPlayableDrawInfo('primitiva', now);
  assert.equal(toLocalDateKey(playable.drawDateTimeISO), '2026-08-10');
});

test('draw information lives in game selection and not on the Home', () => {
  const home = read('../src/components/HomeExperience.jsx');
  const dashboard = read('../src/components/DashboardView.jsx');
  const generator = read('../src/components/GeneratorPanel.jsx');
  assert.doesNotMatch(home, /Próximo sorteo disponible/);
  assert.doesNotMatch(dashboard, /getNextPlayableDrawInfo\('primitiva', now\)/);
  assert.match(home, /Elegir juego/);
  assert.match(generator, /Sorteo de esta jugada/);
  assert.match(generator, /cierre \{formatDrawTime\(draw\.salesCloseISO\)\}/);
  assert.match(generator, /comprobará el resultado únicamente contra ese sorteo/);
});

test('generation and repeat actions never target a draw after its preparation cutoff', () => {
  assert.match(read('../src/utils/engine.js'), /getNextPlayableDrawInfo\(game\.id\)/);
  assert.match(read('../src/utils/fusionEngine.js'), /getNextPlayableDrawInfo\(gameId\)/);
  assert.match(read('../src/hooks/usePlayActions.js'), /getNextPlayableDrawInfo\(play\.gameId\)/);
});

test('v18.3 Core Journey separates review from configuration', () => {
  const journey = read('../src/components/CreateJourney.jsx');
  assert.match(journey, /\{ id: 'review', label: 'Revisa' \}/);
  assert.match(journey, /\{ id: 'save', label: 'Guarda' \}/);
  assert.match(journey, /primy-review-stage/);
  assert.match(journey, /Modificar configuración/);
  assert.match(journey, /Revisa antes de guardar/);
});
