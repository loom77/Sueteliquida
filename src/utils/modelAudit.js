import { analyzeHistory, scoreCombination } from './historyAnalytics.js';
import { getGameConfig } from './gameConfig.js';

function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function combo(game,rng){const pool=Array.from({length:game.numberPoolMax},(_,i)=>i+1),out=[];while(out.length<game.numbersToPick)out.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);return out.sort((a,b)=>a-b)}
function hits(a,b){const s=new Set(b);return a.reduce((n,x)=>n+s.has(x),0)}
function mean(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0}
function stdev(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}

/**
 * Walk-forward audit with multiple random baselines. A model is only considered
 * eligible when its conservative 95% lower bound is above zero and the effect
 * repeats across folds. This is intentionally strict to prevent overfitting.
 */
export function auditHistoricalModel(gameId,rawDraws,{windows=90,candidates=250,baselines=24,minTrain=80}={}){
 const game=getGameConfig(gameId),draws=Array.isArray(rawDraws)?rawDraws:[];
 if(draws.length<minTrain+20)return {eligible:false,reason:'Storico insufficiente',runs:0,delta:0,lower95:0,foldWinRate:0};
 const start=Math.max(minTrain,draws.length-windows),deltas=[],foldWins=[];
 for(let i=start;i<draws.length;i++){
  const analysis=analyzeHistory(gameId,draws.slice(0,i));
  const rankedRng=mulberry32(0xA53C9E1D^i);let best=null;
  for(let k=0;k<candidates;k++){const ticket=combo(game,rankedRng),rated={ticket,...scoreCombination(gameId,ticket,analysis)};if(!best||rated.score>best.score)best=rated}
  const ranked=hits(best.ticket,draws[i].numbers),randomScores=[];
  for(let b=0;b<baselines;b++){const rng=mulberry32((i+1)*2654435761^(b*2246822519));randomScores.push(hits(combo(game,rng),draws[i].numbers))}
  const baseline=mean(randomScores),delta=ranked-baseline;deltas.push(delta);foldWins.push(delta>0?1:0);
 }
 const delta=mean(deltas),se=stdev(deltas)/Math.sqrt(Math.max(deltas.length,1)),lower95=delta-1.96*se,foldWinRate=mean(foldWins);
 const eligible=deltas.length>=40&&lower95>0&&foldWinRate>=0.56&&delta>=0.08;
 return {eligible,reason:eligible?'Vantaggio fuori campione rilevato':'Nessun vantaggio robusto dimostrato',runs:deltas.length,delta,lower95,foldWinRate,baselineCount:baselines};
}
