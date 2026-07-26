import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextDrawInfo, toLocalDateKey } from '../src/utils/drawSchedule.js';
import { calculatePayout } from '../src/utils/payout.js';

test('Primitiva include il lunedì',()=>{
  const from=new Date(2026,6,26,12,0,0); // domenica locale
  assert.equal(toLocalDateKey(getNextDrawInfo('primitiva',from).drawDateISO),'2026-07-27');
});
test('Primitiva distingue Especial',()=>{
  const t={gameId:'primitiva',ticket:[1,2,3,4,5,6],extra:7};
  const r={winningNumbers:[1,2,3,4,5,6],extra:7,complementary:9,prizes:[]};
  assert.match(calculatePayout(t,r).category,/Especial/);
});
test('EuroDreams primo premio è differito e non entra come cash inventato',()=>{
  const t={gameId:'eurodreams',ticket:[1,2,3,4,5,6],extra:2};
  const r={winningNumbers:[1,2,3,4,5,6],extra:2,prizes:[]};
  const p=calculatePayout(t,r); assert.equal(p.payoutType,'deferred'); assert.equal(p.officialAmount,null);
});
