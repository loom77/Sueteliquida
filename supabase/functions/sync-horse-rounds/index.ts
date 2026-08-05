import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const BASE = 'https://www.loteriasyapuestas.es';
const PAGES = {
  lototurf: `${BASE}/es/lototurf/programa-favoritos-y-retirados`,
  'quintuple-plus': `${BASE}/es/quintuple-plus/programa-favoritos-y-retirados`,
};
const EXPECTED = { lototurf: 1, 'quintuple-plus': 5 };
const MAX_RUNNERS = { lototurf: 12, 'quintuple-plus': 20 };

function clean(value: string, maxLength = 300000) {
  return String(value || '').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/<[^>]+>/g, ' ').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, maxLength);
}
function absolute(value: string) { try { return new URL(value, BASE).toString(); } catch { return ''; } }
async function fetchText(url: string) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: 'text/plain,text/markdown,*/*', 'User-Agent': 'Primy/17.0 horse' }, signal: AbortSignal.timeout(50000) });
    lastStatus = response.status;
    if (response.ok) return await response.text();
    if (![403, 429, 502, 503].includes(response.status)) break;
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw new Error(`HTTP ${lastStatus}`);
}
function hashText(value: string) { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return `horse-${(hash >>> 0).toString(16).padStart(8, '0')}`; }
function dateKey(text: string) { const match = text.match(/\b([0-3]?\d)[\/-]([01]?\d)[\/-](20\d{2})\b/); return match ? `${match[3]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}` : ''; }
function roundNumber(text: string) { return text.match(/(?:CONCURSO|JORNADA)\s*[:.-]?\s*(\d{1,3})(?:\s*\/\s*20\d{2})?/i)?.[1] || ''; }
function documentLink(source: string) {
  const links = [
    ...[...source.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+\.pdf(?:\?[^)]*)?)\)/gi)].map(match => ({ label: clean(match[1], 300), url: absolute(match[2]) })),
    ...[...source.matchAll(/<a\b[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(match => ({ label: clean(match[2], 300), url: absolute(match[1]) })),
  ];
  return links.find(link => /programa|carreras|jornada/i.test(link.label + link.url)) || links[0] || null;
}
function runner(line: string, max: number) {
  const source = clean(line, 600).replace(/^[-*|]+|[-*|]+$/g, '').trim();
  const match = source.match(/^(\d{1,2})\s+(.+?)\s+(\d{1,2})\s+a(?:ñ|n)os\s+([\d,.]+)/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (number < 1 || number > max) return null;
  const recentForm = (source.match(/\[([^\]]+)\]/)?.[1] || '').split(/[,;\s]+/).filter(Boolean).slice(0, 8);
  return { number, name: clean(match[2], 140), age: Number(match[3]), weightKg: Number(match[4].replace(',', '.')) || null, jockey: '', stable: '', trainer: '', stall: null, recentForm, status: /\bret(?:irad[oa])?\b/i.test(source) ? 'withdrawn' : /favorit/i.test(source) ? 'favorite' : 'active', metadata: { raw: source } };
}
function raceHeader(line: string) {
  const match = clean(line, 600).match(/^(\d{1,2})\s*[ªa.]?\s*CARRERA\s*[-–—:]?\s*(.*?)(?:\s+-\s+)?(?:([\d.]+)\s*mts?)?(?:.*?Hora:\s*([0-2]?\d:[0-5]\d))?/i);
  if (!match) return null;
  return { officialRaceNumber: Number(match[1]), name: clean(match[2] || `Carrera ${match[1]}`, 220), distanceMeters: match[3] ? Number(match[3].replace(/\./g, '')) : null, scheduledAt: null, time: match[4] || null };
}
function parseProgram(text: string, gameId: string, programUrl: string, pageUrl: string) {
  const lines = String(text || '').split(/\n+/).map(line => clean(line, 700).replace(/^\|+|\|+$/g, '').trim()).filter(Boolean);
  const date = dateKey(text);
  const number = roundNumber(text);
  const venue = clean(text.match(/Hip[oó]dromo\s+(?:de\s+)?([^\n,.]{3,100})/i)?.[1] || '', 140);
  const races: any[] = [];
  const globalRunners: any[] = [];
  let current: any = null;
  for (const line of lines) {
    const header = raceHeader(line);
    if (header) { if (current) races.push(current); current = { position: races.length + 1, raceId: `race-${races.length + 1}`, ...header, venue, runners: [] }; continue; }
    const parsedRunner = runner(line, (MAX_RUNNERS as any)[gameId]);
    if (parsedRunner) { globalRunners.push(parsedRunner); if (current) current.runners.push(parsedRunner); }
  }
  if (current) races.push(current);
  let selected: any[] = [];
  if (gameId === 'lototurf') {
    const race4 = races.find(race => race.officialRaceNumber === 4) || { position: 1, raceId: 'race-1', officialRaceNumber: 4, name: '4.ª carrera Lototurf', venue, distanceMeters: null, scheduledAt: null, runners: globalRunners };
    if (!race4.runners.length) race4.runners = globalRunners;
    selected = [{ ...race4, position: 1, raceId: 'race-1' }];
  } else selected = races.slice(0, 5).map((race, index) => ({ ...race, position: index + 1, raceId: `race-${index + 1}` }));
  if (!date || !number) throw new Error('El programa no contiene fecha o número de jornada.');
  if (selected.length !== (EXPECTED as any)[gameId]) throw new Error(`${selected.length}/${(EXPECTED as any)[gameId]} carreras interpretadas`);
  for (const race of selected) if (race.runners.length < 3 || race.runners.length > (MAX_RUNNERS as any)[gameId]) throw new Error(`Carrera ${race.position}: ${race.runners.length} caballos`);
  const season = date.slice(0, 4);
  const roundId = `${gameId}:${season}:${number}`;
  const now = new Date().toISOString();
  return { roundId, gameId, season, officialRoundNumber: number, roundDate: date, status: 'document-published', source: 'SELAE oficial', sourceUrl: pageUrl, programUrl, sourceHash: hashText(text), officialUpdatedAt: now, fetchedAt: now, revision: 1, venue, races: selected, documents: [{ kind: 'program', url: programUrl, title: `Programa ${gameId}`, fetchedAt: now, sourceHash: hashText(text) }], metadata: { parserVersion: 'horse-reader-v2', sourceType: 'official-program-document' } };
}
async function syncGame(supabase: any, gameId: string) {
  const pageUrl = (PAGES as any)[gameId];
  let source = '';
  try { source = await fetchText(`https://r.jina.ai/${pageUrl}`); }
  catch (error) { return { gameId, status: 'source-unavailable', available: false, message: String((error as any)?.message || error) }; }
  const link = documentLink(source);
  if (!link) return { gameId, status: 'no-active-round', available: false, message: 'SELAE no ha publicado un programa descargable para la jornada en curso.' };
  let program = '';
  try { program = await fetchText(`https://r.jina.ai/${link.url}`); }
  catch (error) { return { gameId, status: 'program-unavailable', available: false, message: String((error as any)?.message || error), programUrl: link.url }; }
  const parsed = parseProgram(program, gameId, link.url, pageUrl);
  const { data: previous } = await supabase.from('primy_horse_rounds').select('source_hash,revision').eq('round_id', parsed.roundId).maybeSingle();
  parsed.revision = previous?.source_hash && previous.source_hash !== parsed.sourceHash ? Number(previous.revision || 1) + 1 : Number(previous?.revision || 1);
  const row = { round_id: parsed.roundId, game_id: parsed.gameId, season: parsed.season, official_round_number: parsed.officialRoundNumber, round_date: parsed.roundDate, status: parsed.status, sales_open_at: null, sales_close_at: null, source: parsed.source, source_url: parsed.sourceUrl, program_url: parsed.programUrl, withdrawals_url: '', result_url: '', source_hash: parsed.sourceHash, official_updated_at: parsed.officialUpdatedAt, fetched_at: parsed.fetchedAt, revision: parsed.revision, venue: parsed.venue, races: parsed.races, result: null, documents: parsed.documents, metadata: parsed.metadata };
  const { error } = await supabase.from('primy_horse_rounds').upsert(row, { onConflict: 'round_id' });
  if (error) throw error;
  const { error: revisionError } = await supabase.from('primy_horse_round_revisions').upsert({ round_id: parsed.roundId, source_hash: parsed.sourceHash, game_id: gameId, status: parsed.status, fetched_at: parsed.fetchedAt, races: parsed.races, result: null, metadata: { ...parsed.metadata, revision: parsed.revision, roundDate: parsed.roundDate, officialRoundNumber: parsed.officialRoundNumber } }, { onConflict: 'round_id,source_hash', ignoreDuplicates: true });
  if (revisionError) throw revisionError;
  return { gameId, status: 'synced', available: true, roundId: parsed.roundId, roundDate: parsed.roundDate, officialRoundNumber: parsed.officialRoundNumber, races: parsed.races.length, revision: parsed.revision };
}

Deno.serve(async request => {
  if (!['GET', 'POST'].includes(request.method)) return new Response(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED' }), { status: 405 });
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ success: false, code: 'SUPABASE_NOT_CONFIGURED' }), { status: 503 });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const results: any[] = [];
  const errors: any[] = [];
  for (const gameId of Object.keys(PAGES)) {
    try { results.push(await syncGame(supabase, gameId)); }
    catch (error) { errors.push({ gameId, message: String((error as any)?.message || error).slice(0, 400) }); }
  }
  return new Response(JSON.stringify({ success: errors.length === 0, complete: errors.length === 0 && results.every(result => result.available), provider: 'SELAE', syncedAt: new Date().toISOString(), results, errors }), {
    status: errors.length ? 207 : 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
});
