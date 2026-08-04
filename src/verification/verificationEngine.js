import { calculatePlayPayout } from '../utils/payout.js';
import { getGameConfig } from '../utils/gameConfig.js';
import { officialQuinielaResultFromScores, scoreQuinielaColumn } from '../sports/quinielaRules.js';
import { officialQuinigolResultFromScores, scoreQuinigolColumn } from '../sports/quinigolRules.js';
import { classifyLototurfBet } from '../horse/lototurfRules.js';
import { classifyQuintuplePlusForecast } from '../horse/quintuplePlusRules.js';

export const VERIFICATION_FAMILIES = Object.freeze({
  DRAW: 'draw',
  SPORTS: 'sports',
  HORSE: 'horse',
});

const DRAW_GAMES = new Set(['primitiva', 'bonoloto', 'euromillones', 'gordoprimitiva', 'eurodreams', 'loteria-nacional']);
const SPORTS_GAMES = new Set(['quiniela', 'quinigol']);
const HORSE_GAMES = new Set(['lototurf', 'quintuple-plus']);

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function normalizeLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES')
    .replace(/[ªº]/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function categoryRows(payload) {
  const candidates = [
    payload?.prizeCategories,
    payload?.prizes,
    payload?.metadata?.prizeCategories,
    payload?.metadata?.prizes,
    payload?.result?.prizeCategories,
  ];
  return candidates.find(Array.isArray) || [];
}

function findCategoryPrize(payload, keys) {
  const normalizedKeys = keys.map(normalizeLabel).filter(Boolean);
  let best = null;
  for (const row of categoryRows(payload)) {
    const source = normalizeLabel(row?.category || row?.label || row?.name || row?.match);
    const sourceTokens = new Set(source.split(/\s+/).filter(Boolean));
    let score = -1;
    for (const key of normalizedKeys) {
      const tokens = key.split(/\s+/).filter(Boolean);
      if (source === key) score = Math.max(score, 1200 + key.length);
      else if (tokens.length && tokens.every(token => sourceTokens.has(token))) score = Math.max(score, 900 + tokens.length * 20);
      else if (key.length >= 4 && source.includes(key)) score = Math.max(score, 200 + key.length);
    }
    if (score > (best?.score ?? -1)) best = { row, score };
  }
  if (!best || best.score < 0) return null;
  const amount = Number(best.row?.prize ?? best.row?.amount ?? best.row?.prizeAmount);
  return Number.isFinite(amount) ? amount : null;
}

function categoryNumberKeys(number, label = '') {
  return [`${number}a categoria`, `${number} categoria`, label].filter(Boolean);
}

function resultColumn({
  category = null,
  matches = 0,
  secondaryMatches,
  extraMatch = false,
  complementaryMatch = false,
  amount = category ? null : 0,
  displayText,
  payoutType,
  breakdown,
  evaluatedBets,
  awardedBets,
  details,
} = {}) {
  const resolvedType = payoutType || (category ? (amount == null ? 'pending-official-scrutiny' : 'cash') : 'cash');
  return {
    category,
    matches,
    ...(secondaryMatches == null ? {} : { secondaryMatches }),
    extraMatch,
    complementaryMatch,
    officialAmount: amount,
    displayText: displayText || (category
      ? amount == null ? 'Categoría confirmada. Importe pendiente del escrutinio oficial.' : euro.format(amount)
      : 'Sin premio'),
    payoutType: resolvedType,
    ...(breakdown ? { breakdown } : {}),
    ...(evaluatedBets == null ? {} : { evaluatedBets }),
    ...(awardedBets == null ? {} : { awardedBets }),
    ...(details ? { verificationDetails: details } : {}),
  };
}

export function verificationFamilyForGame(gameId) {
  if (DRAW_GAMES.has(gameId)) return VERIFICATION_FAMILIES.DRAW;
  if (SPORTS_GAMES.has(gameId)) return VERIFICATION_FAMILIES.SPORTS;
  if (HORSE_GAMES.has(gameId)) return VERIFICATION_FAMILIES.HORSE;
  return '';
}

export function verificationLookupForPlay(play) {
  return {
    gameId: play?.gameId || '',
    family: verificationFamilyForGame(play?.gameId),
    date: play?.drawDateKey || String(play?.drawDateISO || '').slice(0, 10),
    roundId: play?.roundId || '',
  };
}

function officialSportsScores(round) {
  const matches = Array.isArray(round?.matches) ? [...round.matches].sort((a, b) => Number(a.position) - Number(b.position)) : [];
  if (!matches.length || matches.some(match => !match?.officialScore || !Number.isInteger(Number(match.officialScore.home)) || !Number.isInteger(Number(match.officialScore.away)))) return null;
  return matches.map(match => ({ home: Number(match.officialScore.home), away: Number(match.officialScore.away) }));
}

function settleQuiniela(play, round) {
  const scores = officialSportsScores(round);
  if (!scores || scores.length !== 15) return { complete: false, reason: 'SPORTS_RESULTS_PENDING' };
  const official = officialQuinielaResultFromScores(scores);
  const column = play.columns?.[0] || {};
  const score = scoreQuinielaColumn(column, official);
  let category = null;
  let keys = [];
  if (score.hits14 === 14 && score.plenoCorrect) {
    category = 'Pleno al 15';
    keys = ['pleno al 15', 'especial'];
  } else if (score.hits14 >= 10) {
    category = `${score.hits14} aciertos`;
    keys = [`${score.hits14} aciertos`, `${15 - score.hits14}a categoria`];
  }
  const amount = category ? findCategoryPrize(round, keys) : 0;
  return {
    complete: true,
    officialResult: official,
    columns: [resultColumn({
      category,
      matches: score.hits14,
      extraMatch: score.plenoCorrect,
      amount,
      details: { officialSigns: official.signs, officialPleno: official.pleno, totalLabel: score.totalLabel },
    })],
    receiptPrize: null,
  };
}

function settleQuinigol(play, round) {
  const scores = officialSportsScores(round);
  if (!scores || scores.length !== 6) return { complete: false, reason: 'SPORTS_RESULTS_PENDING' };
  const official = officialQuinigolResultFromScores(scores);
  const column = play.columns?.[0] || {};
  const score = scoreQuinigolColumn(column, official);
  const category = score.hits >= 2 ? `${score.hits} aciertos` : null;
  const amount = category ? findCategoryPrize(round, [category]) : 0;
  return {
    complete: true,
    officialResult: official,
    columns: [resultColumn({ category, matches: score.hits, amount, details: { officialOutcomes: official } })],
    receiptPrize: null,
  };
}

function combinations(values, size) {
  const output = [];
  const source = [...values];
  const visit = (start, selected) => {
    if (selected.length === size) {
      output.push([...selected]);
      return;
    }
    for (let index = start; index <= source.length - (size - selected.length); index += 1) {
      selected.push(source[index]);
      visit(index + 1, selected);
      selected.pop();
    }
  };
  visit(0, []);
  return output;
}

function aggregateCategories(categoryCounts, payload) {
  const entries = Object.entries(categoryCounts).filter(([, count]) => count > 0);
  if (!entries.length) return { amount: 0, unknown: false };
  let total = 0;
  let unknown = false;
  for (const [categoryNumber, count] of entries) {
    const number = Number(categoryNumber);
    const prize = findCategoryPrize(payload, categoryNumberKeys(number, `${number}.ª categoría`));
    if (prize == null) unknown = true;
    else total += prize * count;
  }
  return { amount: unknown ? null : total, unknown };
}

function settleLototurf(play, round) {
  const draw = round?.result;
  if (!draw?.valid) return { complete: false, reason: 'HORSE_RESULTS_PENDING' };
  const selection = play.selection || play.columns?.[0] || {};
  const numberSets = combinations(selection.numbers || [], 6);
  const horses = selection.horses || [selection.horse].filter(Boolean);
  if (!numberSets.length || !horses.length) return { complete: false, reason: 'INVALID_PLAY_SELECTION' };
  const categoryCounts = {};
  let maxMatches = 0;
  let horseMatch = false;
  for (const numbers of numberSets) {
    for (const horse of horses) {
      const score = classifyLototurfBet({ numbers, horse }, draw);
      if (!score) continue;
      maxMatches = Math.max(maxMatches, score.matches);
      horseMatch ||= score.horseMatch;
      if (score.category) categoryCounts[score.category] = (categoryCounts[score.category] || 0) + 1;
    }
  }
  const awardedBets = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const totals = aggregateCategories(categoryCounts, draw);
  const category = awardedBets ? `${awardedBets} ${awardedBets === 1 ? 'apuesta con premio' : 'apuestas con premio'}` : null;
  const reintegro = Number(play.receiptExtra);
  const reintegroMatch = Number.isInteger(reintegro) && reintegro === Number(draw.reintegro);
  const refundAmount = reintegroMatch ? findCategoryPrize(draw, ['reintegro']) : null;
  const receiptPrize = reintegroMatch ? {
    category: 'Reintegro del resguardo',
    officialAmount: refundAmount == null ? null : refundAmount * Number(play.equivalentBets || 1),
    displayText: refundAmount == null ? 'Reintegro confirmado. Importe pendiente del escrutinio oficial.' : euro.format(refundAmount * Number(play.equivalentBets || 1)),
    payoutType: refundAmount == null ? 'pending-official-scrutiny' : 'cash',
    extraMatch: true,
  } : null;
  return {
    complete: true,
    columns: [resultColumn({
      category,
      matches: maxMatches,
      extraMatch: horseMatch,
      amount: totals.amount,
      breakdown: categoryCounts,
      evaluatedBets: numberSets.length * horses.length,
      awardedBets,
      details: { winningNumbers: draw.winningNumbers, winningHorse: draw.winningHorse, reintegro: draw.reintegro },
    })],
    receiptPrize,
  };
}

function forEachQuintupleCombination(rows, callback) {
  let count = 0;
  const current = [];
  const visit = index => {
    if (index === rows.length) {
      if (current[4] !== current[5]) {
        count += 1;
        callback(current);
      }
      return;
    }
    for (const value of rows[index] || []) {
      current[index] = value;
      visit(index + 1);
    }
  };
  visit(0);
  return count;
}

function settleQuintuplePlus(play, round) {
  const draw = round?.result;
  if (!draw?.valid) return { complete: false, reason: 'HORSE_RESULTS_PENDING' };
  const rows = play.selection?.rows || play.columns?.[0]?.rows;
  if (!Array.isArray(rows) || rows.length !== 6) return { complete: false, reason: 'INVALID_PLAY_SELECTION' };
  const officialRows = [...draw.winners.map(value => [value]), [draw.secondFifth]];
  const categoryCounts = {};
  let bestMatches = 0;
  let secondMatch = false;
  const evaluatedBets = forEachQuintupleCombination(rows, values => {
    const score = classifyQuintuplePlusForecast({ rows: values.map(value => [value]) }, { rows: officialRows });
    if (!score) return;
    bestMatches = Math.max(bestMatches, score.winningMatches);
    secondMatch ||= score.secondMatch;
    if (score.category) categoryCounts[score.category] = (categoryCounts[score.category] || 0) + 1;
  });
  const awardedBets = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const totals = aggregateCategories(categoryCounts, draw);
  const category = awardedBets ? `${awardedBets} ${awardedBets === 1 ? 'apuesta con premio' : 'apuestas con premio'}` : null;
  return {
    complete: true,
    columns: [resultColumn({
      category,
      matches: bestMatches,
      extraMatch: secondMatch,
      amount: totals.amount,
      breakdown: categoryCounts,
      evaluatedBets,
      awardedBets,
      details: { winners: draw.winners, secondFifth: draw.secondFifth },
    })],
    receiptPrize: null,
  };
}

export function settlePlayAgainstOfficialData(play, officialData) {
  const family = verificationFamilyForGame(play?.gameId);
  if (!family) return { complete: false, reason: 'UNSUPPORTED_GAME' };
  if (!officialData) return { complete: false, reason: 'OFFICIAL_DATA_MISSING' };
  if (family === VERIFICATION_FAMILIES.DRAW) {
    const settlement = calculatePlayPayout(play, officialData);
    return { complete: true, ...settlement };
  }
  if (play.gameId === 'quiniela') return settleQuiniela(play, officialData);
  if (play.gameId === 'quinigol') return settleQuinigol(play, officialData);
  if (play.gameId === 'lototurf') return settleLototurf(play, officialData);
  if (play.gameId === 'quintuple-plus') return settleQuintuplePlus(play, officialData);
  return { complete: false, reason: 'UNSUPPORTED_GAME' };
}

export function applyVerificationSettlement(play, officialData, settlement, { checkedAt = new Date().toISOString() } = {}) {
  if (!settlement?.complete) return { ...play, status: 'awaiting_check' };
  const sourceColumns = Array.isArray(play.columns) ? play.columns : [];
  const columns = sourceColumns.map((column, index) => {
    const payout = settlement.columns?.[index] || settlement.columns?.[0] || resultColumn();
    return {
      ...column,
      status: 'checked',
      prizeCategory: payout.category,
      matches: payout.matches,
      secondaryMatches: payout.secondaryMatches ?? undefined,
      payoutType: payout.payoutType,
      prizeDisplay: payout.displayText,
      officialPrize: payout.officialAmount,
      extraMatch: Boolean(payout.extraMatch),
      complementaryMatch: Boolean(payout.complementaryMatch),
      breakdown: payout.breakdown || undefined,
      evaluatedBets: payout.evaluatedBets || undefined,
      awardedBets: payout.awardedBets || undefined,
      verificationDetails: payout.verificationDetails || undefined,
      nationalMatches: payout.nationalMatches || undefined,
      specialVerificationPending: Boolean(payout.specialVerificationPending),
    };
  });
  return {
    ...play,
    status: 'checked',
    checkedAt,
    result: officialData,
    columns,
    receiptPrize: settlement.receiptPrize || undefined,
    metadata: {
      ...(play.metadata || {}),
      verificationEngine: 'unified-v2',
      verificationFamily: verificationFamilyForGame(play.gameId),
      verifiedAt: checkedAt,
      officialSourceHash: officialData?.sourceHash || officialData?.source_hash || null,
    },
  };
}

export function verificationResultSummary(play) {
  const total = (play?.columns || []).reduce((sum, column) => sum + (Number(column?.officialPrize) || 0), 0)
    + (Number(play?.receiptPrize?.officialAmount) || 0);
  const awarded = (play?.columns || []).reduce((sum, column) => {
    if (column?.breakdown && typeof column.breakdown === 'object') return sum + Object.values(column.breakdown).reduce((inner, count) => inner + Number(count || 0), 0);
    return sum + (column?.prizeCategory ? 1 : 0);
  }, 0);
  const pending = (play?.columns || []).some(column => String(column?.payoutType || '').startsWith('pending-official'))
    || String(play?.receiptPrize?.payoutType || '').startsWith('pending-official');
  return { total, awarded, pending };
}

export function verificationGameLabel(gameId) {
  return getGameConfig(gameId)?.name || gameId;
}
