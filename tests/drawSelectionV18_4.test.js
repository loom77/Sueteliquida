import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getUpcomingPlayableDraws } from '../src/utils/drawSchedule.js';
import { generateFusionPlay } from '../src/utils/fusionEngine.js';
import { verificationLookupForPlay } from '../src/verification/verificationEngine.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('dopo il cutoff di sabato La Primitiva offre i sorteggi successivi e non quello chiuso', () => {
  const now = new Date('2026-08-08T19:25:00.000Z'); // 21:25 Europe/Madrid
  const draws = getUpcomingPlayableDraws('primitiva', now, 4);
  assert.equal(draws.length, 4);
  assert.equal(draws[0].drawDateKey, '2026-08-10');
  assert.equal(draws[1].drawDateKey, '2026-08-13');
  assert.ok(draws.every(draw => draw.drawDateKey !== '2026-08-08'));
});

test('la seconda estrazione scelta viene congelata nella giocata generata', () => {
  const now = new Date('2026-08-08T19:25:00.000Z');
  const draws = getUpcomingPlayableDraws('primitiva', now, 4);
  const selected = draws[1];
  const play = generateFusionPlay('primitiva', null, 1, {
    seed: 'v18.4-second-draw',
    drawInfo: selected,
    now,
  });
  assert.equal(play.drawDateKey, '2026-08-13');
  assert.equal(play.drawDateISO, selected.drawDateISO);
  assert.equal(play.checkableFromISO, selected.checkableFromISO);
  assert.equal(play.metadata.scheduledDraw.drawDateKey, '2026-08-13');
  assert.equal(play.metadata.scheduledDraw.selectionSource, 'user-selection');
});

test('la verifica ufficiale usa esattamente la data della estrazione selezionata', () => {
  const lookup = verificationLookupForPlay({
    gameId: 'primitiva',
    drawDateKey: '2026-08-13',
    drawDateISO: '2026-08-13T19:40:00.000Z',
  });
  assert.equal(lookup.gameId, 'primitiva');
  assert.equal(lookup.date, '2026-08-13');
});

test('la Home non mostra più una estrazione arbitraria e Preparar contiene il selettore data', () => {
  const home = read('../src/components/HomeExperience.jsx');
  const generator = read('../src/components/GeneratorPanel.jsx');
  assert.doesNotMatch(home, /Próximo sorteo disponible/);
  assert.match(home, /Elegir juego/);
  assert.match(generator, /Sorteo de esta jugada/);
  assert.match(generator, /comprobará el resultado únicamente contra ese sorteo/);
});

test('il contratto dati v18.4 conserva la data sorteggio come identità di verifica', async () => {
  const { sanitizePlay, PLAY_DATA_CONTRACT_VERSION } = await import('../src/utils/playModel.js');
  const now = new Date('2026-08-08T19:25:00.000Z');
  const selected = getUpcomingPlayableDraws('primitiva', now, 4)[1];
  const raw = generateFusionPlay('primitiva', null, 1, { seed: 'contract-v18.4', drawInfo: selected, now });
  const stored = sanitizePlay(raw);
  assert.equal(PLAY_DATA_CONTRACT_VERSION, '18.7.0');
  assert.equal(stored.dataContractVersion, '18.7.0');
  assert.equal(stored.drawDateKey, selected.drawDateKey);
  assert.equal(verificationLookupForPlay(stored).date, selected.drawDateKey);
});
