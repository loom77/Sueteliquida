import { GAMES } from '../src/utils/gameConfig.js';
const API_BASE='https://api.loteriasapi.com/api/v1';
const iso=/^\d{4}-\d{2}-\d{2}$/;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
function normalize(item,game){const d=item?.data&&!Array.isArray(item.data)?item.data:item,rd=d.resultData||d.result_data||{},date=d.drawDate||d.draw_date||d.date,numbers=(d.combination||d.numbers||[]).map(Number).filter(Number.isFinite);if(!iso.test(String(date))||numbers.length!==game.numbersToPick)return null;return{date:String(date),winningNumbers:numbers.sort((a,b)=>a-b),extra:num(rd.sueno??rd.reintegro??d.sueno??d.reintegro),complementary:game.hasComplementary?num(rd.complementario??rd.complementary??d.complementary):null}}
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({success:false,message:'Metodo non consentito'})}
 const game=GAMES[req.query?.game];if(!game)return res.status(400).json({success:false,message:'Gioco non valido'});
 const years=Math.max(1,Math.min(Number(req.query?.years)||5,22)),to=new Date(),from=new Date();from.setUTCFullYear(to.getUTCFullYear()-years);
 const key=process.env.LOTERIA_API_KEY;if(!key)return res.status(500).json({success:false,message:'LOTERIA_API_KEY non configurata su Vercel.'});
 const date=d=>d.toISOString().slice(0,10),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const upstream=await fetch(`${API_BASE}/results/${game.apiSlug}?from=${date(from)}&to=${date(to)}`,{headers:{'X-API-Key':key,Accept:'application/json'},signal:controller.signal});if(!upstream.ok)throw new Error(`Provider ${upstream.status}`);const json=await upstream.json(),raw=Array.isArray(json)?json:Array.isArray(json.data)?json.data:Array.isArray(json.results)?json.results:[];const draws=raw.map(x=>normalize(x,game)).filter(Boolean);res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');return res.status(200).json({success:true,gameId:game.id,years,draws,source:'LoteriasAPI / SELAE'})}catch(e){return res.status(502).json({success:false,message:e.name==='AbortError'?'Archivio storico: timeout del provider.':'Impossibile recuperare lo storico.'})}finally{clearTimeout(timer)}}
