import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_GAME_IDS,
  GAME_CATALOG_IDS,
  GAME_FAMILIES,
  getGamesByFamily,
  isGameCapabilityAvailable,
  searchCatalogGames,
} from '../src/utils/gameCatalog.js';

test('el catálogo incluye los diez juegos principales de SELAE', () => {
  assert.equal(GAME_CATALOG_IDS.length, 10);
  assert.deepEqual(new Set(GAME_CATALOG_IDS), new Set([
    'euromillones',
    'primitiva',
    'bonoloto',
    'gordoprimitiva',
    'eurodreams',
    'loteria-nacional',
    'quiniela',
    'quinigol',
    'lototurf',
    'quintuple-plus',
  ]));
});

test('el catálogo se organiza en cuatro familias sin juegos huérfanos', () => {
  assert.equal(GAME_FAMILIES.length, 4);
  const grouped = GAME_FAMILIES.flatMap(family => getGamesByFamily(family.id));
  assert.equal(grouped.length, GAME_CATALOG_IDS.length);
  assert.equal(new Set(grouped.map(game => game.id)).size, GAME_CATALOG_IDS.length);
});

test('solo los juegos ya validados exponen acciones operativas', () => {
  assert.deepEqual(ACTIVE_GAME_IDS.sort(), ['bonoloto', 'eurodreams', 'euromillones', 'gordoprimitiva', 'primitiva']);
  assert.equal(isGameCapabilityAvailable('primitiva', 'createCombination'), true);
  assert.equal(isGameCapabilityAvailable('eurodreams', 'resultChecking'), true);
  assert.equal(isGameCapabilityAvailable('euromillones', 'createCombination'), true);
  assert.equal(isGameCapabilityAvailable('bonoloto', 'createCombination'), true);
  assert.equal(isGameCapabilityAvailable('gordoprimitiva', 'manualEntry'), true);
  assert.equal(isGameCapabilityAvailable('quiniela', 'manualEntry'), false);
});

test('la búsqueda filtra por texto y familia', () => {
  assert.deepEqual(searchCatalogGames('quin').map(game => game.id).sort(), ['quiniela', 'quinigol', 'quintuple-plus']);
  assert.deepEqual(searchCatalogGames('', 'horse').map(game => game.id).sort(), ['lototurf', 'quintuple-plus']);
  assert.deepEqual(searchCatalogGames('númer', 'numbers').map(game => game.id).sort(), ['bonoloto', 'eurodreams', 'euromillones', 'gordoprimitiva', 'primitiva']);
});
