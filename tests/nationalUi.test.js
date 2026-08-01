import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Lotería Nacional usa una experiencia dedicada y no el selector de columnas', () => {
  const journey = fs.readFileSync(new URL('../src/components/CreateJourney.jsx', import.meta.url), 'utf8');
  const panel = fs.readFileSync(new URL('../src/components/NationalLotteryPanel.jsx', import.meta.url), 'utf8');
  const preview = fs.readFileSync(new URL('../src/components/NationalTicketPreview.jsx', import.meta.url), 'utf8');
  assert.match(journey, /NationalLotteryPanel/);
  assert.match(journey, /NationalTicketPreview/);
  assert.match(panel, /Escribe o completa tu número/);
  assert.match(panel, /De 1 a 10 décimos/);
  assert.match(panel, /Preparar número/);
  assert.match(preview, /Registrar como comprado/);
  assert.match(preview, /Serie y fracción son opcionales/);
});

test('la interfaz nacional conserva el aviso de disponibilidad y juego responsable', () => {
  const panel = fs.readFileSync(new URL('../src/components/NationalLotteryPanel.jsx', import.meta.url), 'utf8');
  const preview = fs.readFileSync(new URL('../src/components/NationalTicketPreview.jsx', import.meta.url), 'utf8');
  assert.match(panel, /no lo reserva ni confirma su disponibilidad/i);
  assert.match(preview, /no vende décimos/i);
  assert.match(preview, /no asegura ningún premio/i);
});
