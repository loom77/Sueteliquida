import { useEffect, useMemo, useState } from 'react';
import { calculatePayout } from '../utils/payout';
import { getGameConfig } from '../utils/gameConfig';
import { isCheckable, toLocalDateKey } from '../utils/drawSchedule';
const STORAGE_KEY='primy_history_v3';
function sanitize(raw){
  const arr=Array.isArray(raw)?raw:Array.isArray(raw?.tickets)?raw.tickets:[];
  return arr.filter(t=>t&&typeof t.id==='string'&&typeof t.gameId==='string'&&Array.isArray(t.ticket)).map(t=>({
    ...t, ticket:t.ticket.map(Number).filter(Number.isFinite), extra:Number(t.extra), purchased:Boolean(t.purchased ?? t.status!=='draft'),
    status:t.status==='checked'?'checked':(t.purchased?'scheduled':'draft'), drawDateKey:t.drawDateKey||toLocalDateKey(t.drawDateISO),
  }));
}
function load(){try{const current=localStorage.getItem(STORAGE_KEY);if(current)return sanitize(JSON.parse(current));const legacy=localStorage.getItem('lotto_history_v2');return legacy?sanitize(JSON.parse(legacy)):[]}catch{return []}}
export function useGameHistory(){
  const [history,setHistory]=useState([]),[error,setError]=useState(null);
  useEffect(()=>setHistory(load()),[]);
  const update=(producer)=>setHistory(current=>{const next=producer(current);try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:3,tickets:next}))}catch{setError('Impossibile salvare lo storico sul dispositivo.')}return next;});
  const saveDraft=t=>update(h=>[t,...h]);
  const markPurchased=id=>update(h=>h.map(t=>t.id===id?{...t,purchased:true,status:'scheduled'}:t));
  const removeTicket=id=>update(h=>h.filter(t=>t.id!==id));
  const clearHistory=()=>update(()=>[]);
  const setOfficialPrize=(id,value)=>update(h=>h.map(t=>t.id===id?{...t,officialPrize:Number(value)||0,prizeSource:'manual'}:t));
  const checkResults=async(gameId)=>{
    setError(null); const candidates=history.filter(t=>t.gameId===gameId&&t.purchased&&t.status!=='checked'&&isCheckable(t));
    const dates=[...new Set(candidates.map(t=>t.drawDateKey||toLocalDateKey(t.drawDateISO)).filter(Boolean))];
    if(!dates.length)return;
    try{
      const res=await fetch(`/api/check-results?game=${encodeURIComponent(gameId)}&dates=${encodeURIComponent(dates.join(','))}`);
      const data=await res.json(); if(!res.ok||!data.success)throw new Error(data.message||'Errore risultati');
      const byDate=new Map((data.results||[]).map(r=>[r.date,r]));
      update(current=>current.map(t=>{
        if(t.gameId!==gameId||!t.purchased||t.status==='checked'||!isCheckable(t))return t;
        const key=t.drawDateKey||toLocalDateKey(t.drawDateISO), draw=byDate.get(key); if(!draw)return {...t,status:'awaiting_check'};
        const payout=calculatePayout(t,draw);
        return {...t,status:'checked',checkedAt:new Date().toISOString(),result:draw,prizeCategory:payout.category,matches:payout.matches,payoutType:payout.payoutType,prizeDisplay:payout.displayText,officialPrize:payout.officialAmount,extraMatch:payout.extraMatch||false,complementaryMatch:payout.complementaryMatch||false};
      }));
    }catch(e){setError(e.message||'Errore di connessione. Riprova.');}
  };
  const statsByGame=useMemo(()=>{const out={};for(const t of history){if(!t.purchased)continue;const id=t.gameId;out[id]??={totalSpent:0,totalWon:0,unknownPrizes:0};out[id].totalSpent+=getGameConfig(id).price;if(t.status==='checked'&&typeof t.officialPrize==='number')out[id].totalWon+=t.officialPrize;else if(t.status==='checked'&&t.prizeCategory)out[id].unknownPrizes++;}for(const v of Object.values(out))v.balance=v.totalWon-v.totalSpent;return out;},[history]);
  const enriched=useMemo(()=>history.map(t=>({...t,computedStatus:t.status==='checked'?t.status:(!t.purchased?'draft':isCheckable(t)?'awaiting_check':'scheduled')})),[history]);
  return {history:enriched,statsByGame,error,saveDraft,markPurchased,removeTicket,clearHistory,setOfficialPrize,checkResults};
}
