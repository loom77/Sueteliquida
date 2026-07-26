import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHistory, scoreCombination, selectPortfolio, combinationDistance } from '../src/utils/historyAnalytics.js';
const draws=Array.from({length:60},(_,i)=>({date:`2026-${String(1+Math.floor(i/28)).padStart(2,'0')}-${String(1+i%28).padStart(2,'0')}`,winningNumbers:[1+i%20,5+i%25,10+i%30,20+i%20,30+i%15,40+i%10].map(n=>((n-1)%49)+1)}));
test('analisi storico crea metriche utilizzabili',()=>{const a=analyzeHistory('primitiva',draws);assert.equal(a.totalDraws,60);assert.equal(a.numbers.length,49);assert.ok(a.sumMean>0)});
test('scoring restituisce punteggio e componenti',()=>{const a=analyzeHistory('primitiva',draws);const r=scoreCombination('primitiva',[3,11,18,27,36,47],a);assert.ok(r.score>=0&&r.score<=100);assert.equal(typeof r.parts.balance,'number')});
test('portafoglio privilegia distanza tra colonne',()=>{const c=[{ticket:[1,2,3,4,5,6],score:99},{ticket:[1,2,3,4,5,7],score:98},{ticket:[8,9,10,11,12,13],score:90}];const p=selectPortfolio(c,2,{minDistance:4});assert.equal(p.length,2);assert.ok(combinationDistance(p[0].ticket,p[1].ticket)>=4)});
import { backtestHistory } from '../src/utils/historyAnalytics.js';
test('backtest walk-forward confronta ranking e casuale',()=>{const b=backtestHistory('primitiva',draws,{windows:20,candidates:30});assert.ok(b.runs>0);assert.equal(typeof b.delta,'number')});
