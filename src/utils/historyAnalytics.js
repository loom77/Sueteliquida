import { getGameConfig } from './gameConfig.js';

const pairKey=(a,b)=>`${Math.min(a,b)}-${Math.max(a,b)}`;
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));

export function normalizeHistoricalDraws(gameId,draws=[]){
 const game=getGameConfig(gameId);
 return (Array.isArray(draws)?draws:[]).map(d=>({
  date:String(d.date||d.drawDate||d.draw_date||''),
  numbers:(d.winningNumbers||d.numbers||d.combination||[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=game.numberPoolMax).sort((a,b)=>a-b),
  extra:Number(d.extra??d.reintegro??d.sueno),
  secondaryNumbers:(d.secondaryNumbers||d.stars||[]).map(Number).filter(Number.isInteger).sort((a,b)=>a-b),
 })).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&d.numbers.length===game.numbersToPick).sort((a,b)=>a.date.localeCompare(b.date));
}

export function analyzeHistory(gameId,rawDraws=[]){
 const game=getGameConfig(gameId),draws=normalizeHistoricalDraws(gameId,rawDraws),total=draws.length;
 const frequency=Array(game.numberPoolMax+1).fill(0),lastSeen=Array(game.numberPoolMax+1).fill(-1),pairs=new Map(),sums=[],oddCounts=[],highCounts=[],repeatCounts=[];
 draws.forEach((d,index)=>{
  d.numbers.forEach(n=>{frequency[n]++;lastSeen[n]=index});
  for(let i=0;i<d.numbers.length;i++)for(let j=i+1;j<d.numbers.length;j++){const k=pairKey(d.numbers[i],d.numbers[j]);pairs.set(k,(pairs.get(k)||0)+1)}
  sums.push(d.numbers.reduce((a,b)=>a+b,0)); oddCounts.push(d.numbers.filter(n=>n%2).length); highCounts.push(d.numbers.filter(n=>n>game.numberPoolMax/2).length);
  if(index){const prev=new Set(draws[index-1].numbers);repeatCounts.push(d.numbers.filter(n=>prev.has(n)).length)}
 });
 const expected=total?total*game.numbersToPick/game.numberPoolMax:0;
 const numbers=Array.from({length:game.numberPoolMax},(_,i)=>i+1).map(n=>({number:n,count:frequency[n],frequencyRatio:expected?frequency[n]/expected:1,delay:lastSeen[n]<0?total:total-1-lastSeen[n]}));
 return {gameId,totalDraws:total,from:draws[0]?.date||null,to:draws.at(-1)?.date||null,draws,numbers,pairs,sumMean:mean(sums),sumMin:sums.length?Math.min(...sums):null,sumMax:sums.length?Math.max(...sums):null,oddMean:mean(oddCounts),highMean:mean(highCounts),repeatMean:mean(repeatCounts),latest:draws.at(-1)||null};
}

function consecutivePenalty(combo){let longest=1,run=1;for(let i=1;i<combo.length;i++){run=combo[i]===combo[i-1]+1?run+1:1;longest=Math.max(longest,run)}return longest>=4?1:longest===3?.45:0}
function decadeConcentration(combo){const c={};combo.forEach(n=>{const d=Math.floor((n-1)/10);c[d]=(c[d]||0)+1});return Math.max(...Object.values(c))/combo.length}
function birthdayShareRisk(combo){return combo.filter(n=>n<=31).length/combo.length}

export function scoreCombination(gameId,combo,analysis,{antiShare=true}={}){
 const game=getGameConfig(gameId),sorted=[...combo].sort((a,b)=>a-b);
 if(sorted.length!==game.numbersToPick||!analysis?.totalDraws)return {score:50,parts:{history:0,balance:0,diversity:0,antiShare:0}};
 const numMap=new Map(analysis.numbers.map(x=>[x.number,x]));
 const history=mean(sorted.map(n=>{const x=numMap.get(n);const freq=1-Math.min(Math.abs((x?.frequencyRatio||1)-1),1);const delayNorm=clamp((x?.delay||0)/Math.max(analysis.totalDraws*.08,1));return .65*freq+.35*(1-Math.abs(delayNorm-.5)*2)}));
 const sum=sorted.reduce((a,b)=>a+b,0),sumSpan=Math.max((analysis.sumMax||sum)-(analysis.sumMin||sum),1),sumFit=1-clamp(Math.abs(sum-analysis.sumMean)/(sumSpan*.45));
 const odd=sorted.filter(n=>n%2).length,high=sorted.filter(n=>n>game.numberPoolMax/2).length;
 const parityFit=1-clamp(Math.abs(odd-analysis.oddMean)/game.numbersToPick),highFit=1-clamp(Math.abs(high-analysis.highMean)/game.numbersToPick);
 const balance=mean([sumFit,parityFit,highFit,1-decadeConcentration(sorted)]);
 let pairScore=0,pairN=0;for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){pairScore+=clamp((analysis.pairs.get(pairKey(sorted[i],sorted[j]))||0)/Math.max(analysis.totalDraws*.035,1));pairN++}
 const latest=new Set(analysis.latest?.numbers||[]),repeat=sorted.filter(n=>latest.has(n)).length,repeatFit=1-clamp(Math.abs(repeat-analysis.repeatMean)/game.numbersToPick);
 const diversity=mean([1-consecutivePenalty(sorted),repeatFit,1-(pairN?pairScore/pairN:0)*.35]);
 const share=antiShare?mean([1-birthdayShareRisk(sorted),1-consecutivePenalty(sorted),1-decadeConcentration(sorted)]):.5;
 const score=100*(.28*history+.32*balance+.22*diversity+.18*share);
 return {score:Math.round(score*10)/10,parts:{history:Math.round(history*100),balance:Math.round(balance*100),diversity:Math.round(diversity*100),antiShare:Math.round(share*100)}};
}

export function combinationDistance(a,b){const s=new Set(a);return a.filter(n=>!new Set(b).has(n)).length+ b.filter(n=>!s.has(n)).length}

export function selectPortfolio(candidates,count,{minDistance=4}={}){
 const sorted=[...candidates].sort((a,b)=>b.score-a.score),selected=[];
 for(const c of sorted){if(selected.every(s=>combinationDistance(s.ticket,c.ticket)>=minDistance))selected.push(c);if(selected.length>=count)break}
 if(selected.length<count)for(const c of sorted){if(!selected.includes(c))selected.push(c);if(selected.length>=count)break}
 return selected;
}

function seeded(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
function seededCombo(game,rng){const pool=Array.from({length:game.numberPoolMax},(_,i)=>i+1),out=[];while(out.length<game.numbersToPick)out.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);return out.sort((a,b)=>a-b)}
function matches(a,b){const s=new Set(b);return a.filter(n=>s.has(n)).length}
export function backtestHistory(gameId,rawDraws=[],{windows=60,candidates=180}={}){
 const game=getGameConfig(gameId),draws=normalizeHistoricalDraws(gameId,rawDraws),start=Math.max(30,draws.length-Math.max(10,windows));
 let rankedMatches=0,randomMatches=0,rankedTwoPlus=0,randomTwoPlus=0,runs=0;
 for(let i=start;i<draws.length;i++){
  const prior=draws.slice(0,i),analysis=analyzeHistory(gameId,prior),rng=seeded(0x9e3779b9^i);let best=null;
  for(let k=0;k<candidates;k++){const ticket=seededCombo(game,rng),rated={ticket,...scoreCombination(gameId,ticket,analysis)};if(!best||rated.score>best.score)best=rated}
  const baseline=seededCombo(game,rng),r=matches(best.ticket,draws[i].numbers),b=matches(baseline,draws[i].numbers);rankedMatches+=r;randomMatches+=b;if(r>=2)rankedTwoPlus++;if(b>=2)randomTwoPlus++;runs++;
 }
 return {runs,rankedAverage:runs?rankedMatches/runs:0,randomAverage:runs?randomMatches/runs:0,rankedTwoPlus,runsTwoPlus:randomTwoPlus,delta:runs?(rankedMatches-randomMatches)/runs:0,verdict:runs&&rankedMatches>randomMatches?'better':runs&&rankedMatches<randomMatches?'worse':'equal'};
}
