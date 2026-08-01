import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_VISUAL_THEMES } from '../src/utils/gameVisualTheme.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const switcher = read('../src/components/GameSwitch.jsx');
const generator = read('../src/components/GeneratorPanel.jsx');
const explore = read('../src/components/ExploreView.jsx');
const profile = read('../src/components/SettingsView.jsx');
const archive = read('../src/components/TicketHistory.jsx');
const css = read('../src/index.css');
const generationController = read('../src/hooks/useGenerationController.js');

test('v16.1 centraliza una identidad visual distinta para todos los juegos de la experiencia', () => {
  for (const gameId of ['primitiva', 'bonoloto', 'euromillones', 'gordoprimitiva', 'eurodreams', 'loteria-nacional', 'quiniela', 'quinigol']) {
    const theme = GAME_VISUAL_THEMES[gameId];
    assert.ok(theme, `Falta tema para ${gameId}`);
    assert.match(theme.primary, /^#[0-9A-F]{6}$/i);
    assert.match(theme.soft, /^#[0-9A-F]{6}$/i);
  }
});

test('el selector deja de comprimir nombres y usa tarjetas responsive', () => {
  assert.match(switcher, /primy-game-picker__track/);
  assert.match(switcher, /primy-game-picker__option/);
  assert.doesNotMatch(switcher, /2xl:grid-cols-7/);
  assert.match(css, /\.primy-game-picker__name[\s\S]*overflow-wrap:\s*anywhere/);
});

test('la preparación usa CTA Primy, presupuesto compacto y thinking mínimo de cuatro segundos', () => {
  assert.match(generationController, /MIN_GENERATION_PRESENTATION_MS\s*=\s*4_000/);
  assert.match(generator, /primy-generator__budget/);
  assert.match(generator, /ds-button--primary/);
  assert.match(generator, /ThinkingProgress/);
  assert.match(css, /\.primy-generator__action-bar[\s\S]*position:\s*sticky/);
});

test('Juegos, Archivo y Perfil aplican la nueva jerarquía creativa', () => {
  assert.doesNotMatch(explore, /CapabilityList/);
  assert.match(explore, /Más opciones/);
  assert.match(archive, /GameIdentity/);
  assert.match(archive, /primy-archive-summary/);
  assert.match(profile, /PrimyMascot role="companion"/);
  assert.match(profile, /Mi juego responsable/);
});
