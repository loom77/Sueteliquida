import { useCallback,useEffect,useState } from 'react';
import { analyzeHistory } from '../utils/historyAnalytics.js';
const KEY='primy_history_cache_v1';
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
export function useHistoryData(gameId){
 const [state,setState]=useState({loading:false,error:'',analysis:null,source:''});
 const load=useCallback(async(force=false)=>{const cache=read(),hit=cache[gameId],fresh=hit&&Date.now()-hit.savedAt<6*60*60*1000;if(!force&&fresh){setState({loading:false,error:'',analysis:analyzeHistory(gameId,hit.draws),source:hit.source});return}setState(s=>({...s,loading:true,error:''}));try{const r=await fetch(`/api/history?game=${encodeURIComponent(gameId)}&years=10`),j=await r.json();if(!r.ok||!j.success)throw new Error(j.message||'Errore archivio');const next={...cache,[gameId]:{draws:j.draws,source:j.source,savedAt:Date.now()}};localStorage.setItem(KEY,JSON.stringify(next));setState({loading:false,error:'',analysis:analyzeHistory(gameId,j.draws),source:j.source})}catch(e){if(hit?.draws?.length)setState({loading:false,error:'Uso la cache locale: '+e.message,analysis:analyzeHistory(gameId,hit.draws),source:hit.source});else setState({loading:false,error:e.message,analysis:null,source:''})}},[gameId]);
 useEffect(()=>{load(false)},[load]);return{...state,reload:()=>load(true)};
}
