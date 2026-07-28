import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHistory, scoreCombination, selectPortfolio, combinationDistance, backtestHistory } from '../src/utils/historyAnalytics.js';
import { coverageMetrics, optimizeCoverage } from '../src/utils/portfolioOptimizer.js';

const draws = Array.from({ length: 60 }, (_, index) => ({
  date: `2026-${String(1 + Math.floor(index / 28)).padStart(2, '0')}-${String(1 + index % 28).padStart(2, '0')}`,
  winningNumbers: [1 + index % 20, 5 + index % 25, 10 + index % 30, 20 + index % 20, 30 + index % 15, 40 + index % 10].map(number => ((number - 1) % 49) + 1),
}));

test('el análisis histórico crea métricas utilizables', () => {
  const analysis = analyzeHistory('primitiva', draws);
  assert.equal(analysis.totalDraws, 60);
  assert.equal(analysis.numbers.length, 49);
  assert.ok(analysis.sumMean > 0);
});

test('la puntuación devuelve valor y componentes', () => {
  const analysis = analyzeHistory('primitiva', draws);
  const result = scoreCombination('primitiva', [3, 11, 18, 27, 36, 47], analysis);
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(typeof result.parts.balance, 'number');
});

test('la cartera prioriza la distancia y la cobertura', () => {
  const candidates = [
    { ticket: [1, 2, 3, 4, 5, 6], score: 99 },
    { ticket: [1, 2, 3, 4, 5, 7], score: 98 },
    { ticket: [8, 9, 10, 11, 12, 13], score: 90 },
    { ticket: [14, 15, 16, 17, 18, 19], score: 88 },
  ];
  const portfolio = optimizeCoverage('primitiva', candidates, 3);
  const metrics = coverageMetrics('primitiva', portfolio);
  assert.equal(portfolio.length, 3);
  assert.ok(metrics.uniqueNumbers >= 17);
  assert.ok(combinationDistance(portfolio[0].ticket, portfolio[1].ticket) >= 8);
});

test('la retrospección progresiva compara la clasificación y el azar', () => {
  const result = backtestHistory('primitiva', draws, { windows: 20, candidates: 30 });
  assert.ok(result.runs > 0);
  assert.equal(typeof result.delta, 'number');
});

test('el selector heredado sigue funcionando', () => {
  const candidates = [{ ticket: [1, 2, 3, 4, 5, 6], score: 99 }, { ticket: [8, 9, 10, 11, 12, 13], score: 90 }];
  assert.equal(selectPortfolio(candidates, 2).length, 2);
});
