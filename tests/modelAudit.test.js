import test from 'node:test';
import assert from 'node:assert/strict';
import { auditHistoricalModel } from '../src/utils/modelAudit.js';
import { optimizeCoverage,coverageMetrics } from '../src/utils/portfolioOptimizer.js';
const draws=Array.from({length:150},(_,i)=>({date:`2025-${String(1+(i%12)).padStart(2,'0')}-${String(1+(i%28)).padStart(2,'0')}`,numbers:[1,8,16,24,33,47].map((n,j)=>((n+i*(j+3))%49)+1)}));
test('la auditoría rechaza historiales insuficientes',()=>{const r=auditHistoricalModel('primitiva',draws.slice(0,40));assert.equal(r.eligible,false)});
test('la auditoría devuelve estadísticas conservadoras',()=>{const r=auditHistoricalModel('primitiva',draws,{windows:45,candidates:40,baselines:8});assert.equal(typeof r.lower95,'number');assert.equal(typeof r.eligible,'boolean')});
test('el optimizador aumenta la cobertura',()=>{const c=[{ticket:[1,2,3,4,5,6],score:90},{ticket:[1,2,3,4,5,7],score:99},{ticket:[8,9,10,11,12,13],score:80},{ticket:[14,15,16,17,18,19],score:70}];const p=optimizeCoverage('primitiva',c,3);const m=coverageMetrics('primitiva',p);assert.ok(m.uniqueNumbers>=17);assert.ok(m.averageOverlap<1)});
