import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFusionPlay, resolveFusionProfile, scoreAntiShare, scoreStructuralQuality } from '../src/utils/fusionEngine.js';
import { analyzeHistory } from '../src/utils/historyAnalytics.js';
import { playCost, sanitizePlays } from '../src/utils/playModel.js';

const primitivaDraws = Array.from({ length: 70 }, (_, index) => ({
  date: `2025-${String(1 + (index % 12)).padStart(2, '0')}-${String(1 + (index % 28)).padStart(2, '0')}`,
  winningNumbers: [1, 9, 17, 25, 33, 41].map((number, offset) => ((number + index * (offset + 2) - 1) % 49) + 1),
}));

test('Fusión genera el número solicitado de columnas de La Primitiva', () => {
  const play = generateFusionPlay('primitiva', null, 5, { samples: 900 });
  assert.equal(play.columns.length, 5);
  assert.ok(play.columns.every(column => column.numbers.length === 6));
  assert.ok(play.columns.every(column => column.extra === play.receiptExtra));
  assert.ok(play.receiptExtra >= 0 && play.receiptExtra <= 9);
  assert.equal(new Set(play.columns.map(column => column.numbers.join('-'))).size, 5);
  assert.equal(play.method, 'primy-evidence');
});

test('Fusión también funciona con EuroDreams, distribuye el Sueño y respeta el máximo del boleto', () => {
  const play = generateFusionPlay('eurodreams', null, 8, { samples: 1200 });
  assert.equal(play.columns.length, 6);
  assert.ok(play.columns.every(column => column.numbers.every(number => number >= 1 && number <= 40)));
  assert.ok(play.columns.every(column => column.extra >= 1 && column.extra <= 5));
  assert.ok(new Set(play.columns.map(column => column.extra)).size >= 4);
});

test('el historial insuficiente se excluye automáticamente', () => {
  const analysis = analyzeHistory('primitiva', primitivaDraws);
  const profile = resolveFusionProfile('primitiva', analysis, { minTrain: 80 });
  assert.equal(profile.audit.eligible, false);
  assert.equal(profile.weights.historical, 0);
});

test('la puntuación estructural y anticompartición se mantiene dentro de los límites', () => {
  const structural = scoreStructuralQuality('primitiva', [4, 12, 19, 27, 38, 46]);
  const antiShare = scoreAntiShare('primitiva', [4, 12, 19, 27, 38, 46]);
  assert.ok(structural.score >= 0 && structural.score <= 100);
  assert.ok(antiShare.score >= 0 && antiShare.score <= 100);
});

test('migra una columna antigua a una jugada multicolumna', () => {
  const plays = sanitizePlays([{ id: 'legacy', gameId: 'primitiva', ticket: [1, 2, 3, 4, 5, 6], extra: 7, purchased: true, status: 'scheduled' }]);
  assert.equal(plays.length, 1);
  assert.equal(plays[0].columns.length, 1);
  assert.equal(playCost(plays[0]), 1);
});

test('la variante penaliza el solapamiento con la jugada de origen', () => {
  const source = [{ numbers: [1, 2, 3, 4, 5, 6] }];
  const play = generateFusionPlay('primitiva', null, 4, { samples: 1800, avoidColumns: source, variantOf: 'source-play' });
  assert.equal(play.metadata.variantOf, 'source-play');
  assert.equal(play.columns.length, 4);
  assert.ok(play.columns.every(column => column.numbers.filter(number => source[0].numbers.includes(number)).length < 6));
});
