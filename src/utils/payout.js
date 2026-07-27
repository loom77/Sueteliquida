import { getGameConfig } from './gameConfig.js';

function countMatches(a,b){ const set=new Set((b||[]).map(Number)); return (a||[]).filter(n=>set.has(Number(n))).length; }
function findOfficialPrize(results, keys=[]) {
  const tiers = Array.isArray(results.prizes) ? results.prizes : [];
  const normalized = keys.map(k=>String(k).toLowerCase().replace(/\s/g,''));
  const tier = tiers.find(t => {
    const hay = [t.category,t.match,t.name,t.label].filter(Boolean).join(' ').toLowerCase().replace(/\s/g,'');
    return normalized.some(k=>hay.includes(k));
  });
  const amount = Number(tier?.prize ?? tier?.amount ?? tier?.prizeAmount);
  return Number.isFinite(amount) ? amount : null;
}
function result(category, matches, amount=null, displayText=null, payoutType='variable', extra={}) {
  return { category, matches, officialAmount: amount, displayText: displayText || (amount != null ? `${amount.toFixed(2)} €` : 'Importo ufficiale non disponibile'), payoutType, ...extra };
}
function euroDreams(ticket, results) {
  const m=countMatches(ticket.ticket,results.winningNumbers); const dream=Number(ticket.extra)===Number(results.extra);
  if(m===6&&dream) return result('1ª categoria (6 + Sogno)',m,null,'20.000 € al mese per 30 anni','deferred',{extraMatch:true});
  if(m===6) return result('2ª categoria (6 numeri)',m,null,'2.000 € al mese per 5 anni','deferred');
  const map={5:['3ª categoria (5 numeri)',['3','5']],4:['4ª categoria (4 numeri)',['4']],3:['5ª categoria (3 numeri)',['5']],2:['6ª categoria (2 numeri)',['6']]};
  if(map[m]) { const amount=findOfficialPrize(results,map[m][1]); return result(map[m][0],m,amount,null,amount==null?'variable':'cash',{extraMatch:dream}); }
  return result(null,m,0,'Nessun premio','cash',{extraMatch:dream});
}
function primitiva(ticket, results, { includeStandaloneReintegro = true } = {}) {
  const m=countMatches(ticket.ticket,results.winningNumbers); const comp=Number(results.complementary);
  const compMatch=m===5 && (ticket.ticket||[]).some(n=>Number(n)===comp); const reintegro=Number(ticket.extra)===Number(results.extra);
  if(m===6&&reintegro) return result('Especial (6 + Reintegro)',m,findOfficialPrize(results,['especial','6+r']),'Premio variabile','variable',{extraMatch:true});
  if(m===6) return result('1ª categoria (6 numeri)',m,findOfficialPrize(results,['1','6']),'Premio variabile','variable');
  if(compMatch) return result('2ª categoria (5 + Complementare)',m,findOfficialPrize(results,['2','5+c']),'Premio variabile','variable',{complementaryMatch:true});
  if(m===5) return result('3ª categoria (5 numeri)',m,findOfficialPrize(results,['3','5']),'Premio variabile','variable');
  if(m===4) return result('4ª categoria (4 numeri)',m,findOfficialPrize(results,['4']),'Premio variabile','variable');
  if(m===3) return result('5ª categoria (3 numeri)',m,findOfficialPrize(results,['5','3']),'8,00 €','cash');
  if(includeStandaloneReintegro && reintegro) return result('Reintegro',m,findOfficialPrize(results,['reintegro']) ?? 1,'1,00 €','cash',{extraMatch:true});
  return result(null,m,0,'Nessun premio','cash',{extraMatch:reintegro});
}

export function calculatePayout(ticket, results){
  return ticket.gameId==='primitiva' ? primitiva(ticket,results) : euroDreams(ticket,results);
}

export function calculatePlayPayout(play, results) {
  const game = getGameConfig(play.gameId);
  if (play.gameId !== 'primitiva') {
    return {
      columns: (play.columns || []).map(column => calculatePayout({ gameId: play.gameId, ticket: column.numbers, extra: column.extra }, results)),
      receiptPrize: null,
    };
  }

  const receiptExtra = Number(play.receiptExtra ?? play.columns?.[0]?.extra);
  const columns = (play.columns || []).map(column => primitiva({ gameId: play.gameId, ticket: column.numbers, extra: receiptExtra }, results, { includeStandaloneReintegro: false }));
  const extraMatch = Number.isInteger(receiptExtra) && receiptExtra === Number(results.extra);
  const amount = game.price * (play.columns?.length || 0);
  return {
    columns,
    receiptPrize: extraMatch ? {
      category: 'Reintegro del resguardo',
      officialAmount: amount,
      displayText: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount),
      payoutType: 'cash',
      extraMatch: true,
    } : null,
  };
}
