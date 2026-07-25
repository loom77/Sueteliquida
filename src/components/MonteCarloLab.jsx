import React,{useEffect,useRef,useState}from'react';
import{getGameConfig}from'../utils/gameConfig';
const OPTIONS=[2000,20000,100000];
export default function MonteCarloLab({gameId}){
 const [draws,setDraws]=useState(20000),[result,setResult]=useState(null),[progress,setProgress]=useState(0),[running,setRunning]=useState(false); const workerRef=useRef(); const game=getGameConfig(gameId);
 useEffect(()=>()=>workerRef.current?.terminate(),[]);
 const run=()=>{workerRef.current?.terminate();const w=new Worker(new URL('../workers/monteCarlo.worker.js',import.meta.url),{type:'module'});workerRef.current=w;setRunning(true);setResult(null);setProgress(0);w.onmessage=({data})=>{if(data.type==='progress')setProgress(data.value);if(data.type==='done'){setResult(data.result);setRunning(false);setProgress(1);w.terminate();}};w.postMessage({mode:'experiment',totalDraws:draws,poolMax:game.numberPoolMax,pick:game.numbersToPick,topK:10});};
 const max=result?Math.max(...result.freqAll):0;
 return <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
  <h2 className="text-sm font-bold text-slate-400 uppercase mb-1">Laboratorio Monte Carlo</h2><p className="text-xs text-slate-500 mb-4">Verifica visiva: i numeri più frequenti in un campione non prevedono le estrazioni successive.</p>
  <div className="flex gap-2 mb-4">{OPTIONS.map(n=><button key={n} onClick={()=>{setDraws(n);setResult(null)}} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${draws===n?'bg-slate-900 text-white':'border-slate-200 text-slate-500'}`}>{n.toLocaleString('it-IT')}</button>)}</div>
  <button onClick={run} disabled={running} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">{running?`Simulazione ${Math.round(progress*100)}%`:`Simula ${draws.toLocaleString('it-IT')} estrazioni`}</button>
  {running&&<div className="h-2 bg-slate-100 rounded mt-3 overflow-hidden"><div className="h-full bg-indigo-500" style={{width:`${progress*100}%`}}/></div>}
  {result&&<div className="space-y-4 mt-4"><div><div className="flex items-end gap-px h-24 bg-slate-50 rounded-lg p-1">{result.freqAll.map((c,i)=><div key={i} title={`${i+1}: ${c}`} className="flex-1 bg-indigo-400 rounded-t" style={{height:`${max?(c/max)*100:0}%`}}/>)}</div><p className="text-[11px] text-slate-400 mt-1">Le differenze sono normali oscillazioni casuali attorno a una distribuzione uniforme.</p></div><div className="bg-slate-50 rounded-xl p-4 text-sm"><p>Numeri “caldi” del primo campione: <strong>{result.hotNumbers.join(', ')}</strong></p><p className="mt-2">Atteso: <strong>{(result.expectedHotHitRate*100).toFixed(2)}%</strong> · osservato dopo: <strong>{(result.observedHotHitRate*100).toFixed(2)}%</strong></p><p className="text-xs text-slate-500 mt-2">Scarto {result.diffPct>=0?'+':''}{result.diffPct.toFixed(1)}%: non costituisce potere predittivo.</p></div></div>}
 </section>;
}
