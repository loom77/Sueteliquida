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
  return { category, matches, officialAmount: amount, displayText: displayText || (amount != null ? `${amount.toFixed(2)} €` : 'Importe oficial no disponible'), payoutType, ...extra };
}
function euroDreams(ticket, results) {
  const m=countMatches(ticket.ticket,results.winningNumbers); const dream=Number(ticket.extra)===Number(results.extra);
  if(m===6&&dream) return result('1.ª categoría (6 + Sueño)',m,null,'20.000 € al mes durante 30 años','deferred',{extraMatch:true});
  if(m===6) return result('2.ª categoría (6 números)',m,null,'2.000 € al mes durante 5 años','deferred');
  const map={5:['3.ª categoría (5 números)',['3','5']],4:['4.ª categoría (4 números)',['4']],3:['5.ª categoría (3 números)',['5']],2:['6.ª categoría (2 números)',['6']]};
  if(map[m]) { const amount=findOfficialPrize(results,map[m][1]); return result(map[m][0],m,amount,null,amount==null?'variable':'cash',{extraMatch:dream}); }
  return result(null,m,0,'Sin premio','cash',{extraMatch:dream});
}
function primitiva(ticket, results, { includeStandaloneReintegro = true } = {}) {
  const m=countMatches(ticket.ticket,results.winningNumbers); const comp=Number(results.complementary);
  const compMatch=m===5 && (ticket.ticket||[]).some(n=>Number(n)===comp); const reintegro=Number(ticket.extra)===Number(results.extra);
  if(m===6&&reintegro) return result('Especial (6 + Reintegro)',m,findOfficialPrize(results,['especial','6+r']),'Premio variable','variable',{extraMatch:true});
  if(m===6) return result('1.ª categoría (6 números)',m,findOfficialPrize(results,['1','6']),'Premio variable','variable');
  if(compMatch) return result('2.ª categoría (5 + Complementario)',m,findOfficialPrize(results,['2','5+c']),'Premio variable','variable',{complementaryMatch:true});
  if(m===5) return result('3.ª categoría (5 números)',m,findOfficialPrize(results,['3','5']),'Premio variable','variable');
  if(m===4) return result('4.ª categoría (4 números)',m,findOfficialPrize(results,['4']),'Premio variable','variable');
  if(m===3) return result('5.ª categoría (3 números)',m,findOfficialPrize(results,['5','3']),'8,00 €','cash');
  if(includeStandaloneReintegro && reintegro) return result('Reintegro',m,findOfficialPrize(results,['reintegro']) ?? 1,'1,00 €','cash',{extraMatch:true});
  return result(null,m,0,'Sin premio','cash',{extraMatch:reintegro});
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
      displayText: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount),
      payoutType: 'cash',
      extraMatch: true,
    } : null,
  };
}
