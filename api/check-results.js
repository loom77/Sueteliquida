import { GAMES } from '../src/utils/gameConfig.js';
const API_BASE='https://api.loteriasapi.com/api/v1';
const isoDate=/^\d{4}-\d{2}-\d{2}$/;
const asNumber=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
function normalize(item,game){
  const d=item?.data&& !Array.isArray(item.data)?item.data:item;
  const winning=(d.combination||d.numbers||[]).map(Number).filter(Number.isFinite);
  const rd=d.resultData||d.result_data||{};
  const date=d.drawDate||d.draw_date||d.date;
  if(!isoDate.test(String(date))||winning.length!==game.numbersToPick)return null;
  return {date:String(date),winningNumbers:winning,extra:asNumber(rd.sueno??rd.reintegro??d.sueno??d.reintegro),complementary:game.hasComplementary?asNumber(rd.complementario??rd.complementary??d.complementary):null,prizes:d.prizes||d.prizeBreakdown||[],source:'LoteriasAPI / SELAE',updatedAt:d.meta?.updated_at||d.updatedAt||null};
}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({success:false,message:'Metodo non consentito'});}
  const game=GAMES[req.query?.game]; if(!game)return res.status(400).json({success:false,message:'Gioco non valido'});
  const dates=String(req.query?.dates||'').split(',').filter(Boolean); if(!dates.length||dates.length>31||dates.some(d=>!isoDate.test(d)))return res.status(400).json({success:false,message:'Date non valide'});
  const key=process.env.LOTERIA_API_KEY;if(!key)return res.status(500).json({success:false,message:'LOTERIA_API_KEY non configurata su Vercel.'});
  const sorted=[...dates].sort(),from=sorted[0],to=sorted.at(-1),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const upstream=await fetch(`${API_BASE}/results/${game.apiSlug}?from=${from}&to=${to}`,{headers:{'X-API-Key':key,'Accept':'application/json'},signal:controller.signal});
    if(!upstream.ok)throw new Error(`Provider ${upstream.status}`); const json=await upstream.json();
    const raw=Array.isArray(json)?json:Array.isArray(json.data)?json.data:Array.isArray(json.results)?json.results:[];
    const wanted=new Set(dates),results=raw.map(x=>normalize(x,game)).filter(x=>x&&wanted.has(x.date));
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({success:true,gameId:game.id,results});
  }catch(e){return res.status(502).json({success:false,message:e.name==='AbortError'?'Il provider ha impiegato troppo tempo. Riprova.':'Impossibile recuperare i risultati in questo momento.'});}finally{clearTimeout(timer);}
}
