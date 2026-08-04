import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SOURCES: Record<string, { url: string; expected: number }> = {
  quiniela: { url: 'https://www.loteriasyapuestas.es/es/resultados/quiniela/comprobar', expected: 15 },
  quinigol: { url: 'https://www.loteriasyapuestas.es/es/resultados/quinigol/comprobar', expected: 6 },
};

function clean(value: string, max = 160) {
  return String(value || '').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return `selae-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseMatches(html: string, expected: number) {
  const lines = html.replace(/<script\b[\s\S]*?<\/script>/gi, '\n').replace(/<style\b[\s\S]*?<\/style>/gi, '\n').replace(/<\/(?:p|li|div|section|article|h[1-6])>/gi, '\n').replace(/<[^>]+>/g, ' ').split(/\n+/).map(line => clean(line, 500)).filter(Boolean);
  const chunks = [
    ...[...html.matchAll(/<(?:li|p|article|section|div)\b[^>]*>([\s\S]*?)<\/(?:li|p|article|section|div)>/gi)].map(match => clean(match[1], 500)),
    ...lines,
  ];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (/^(?:P\s*[-.]?\s*)?\d{1,2}\s*[.)ªa:-]?$/i.test(lines[index]) && /\s[-–—]\s/.test(lines[index + 1])) chunks.push(`${lines[index]} ${lines[index + 1]}`);
  }
  const byPosition = new Map<number, any>();
  for (const chunk of chunks) {
    const prefix = chunk.match(/^\s*(?:P\s*[-.]?\s*)?(\d{1,2})\s*[.)ªa:-]?\s*(.+)$/i);
    if (!prefix) continue;
    const position = Number(prefix[1]);
    if (position < 1 || position > expected) continue;
    const pair = prefix[2].match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (!pair) continue;
    const homeTeam = clean(pair[1], 120);
    const awayTeam = clean(pair[2], 120).replace(/\s+(?:[012XM]\s+){4,}.*$/i, '').trim();
    if (!homeTeam || !awayTeam || /^\d+$/.test(homeTeam) || /^\d+$/.test(awayTeam)) continue;
    byPosition.set(position, {
      matchId: `match-${position}`,
      officialMatchId: null,
      position,
      homeTeam,
      awayTeam,
      competition: '',
      kickoffAt: null,
      status: 'scheduled',
      officialScore: null,
      excludedReason: '',
      metadata: {},
    });
  }
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

async function syncGame(supabase: any, gameId: string) {
  const source = SOURCES[gameId];
  let html = '';
  let lastStatus = 0;
  const urls = [source.url, `https://r.jina.ai/${source.url}`];
  for (const url of urls) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, { headers: { Accept: url.includes('r.jina.ai') ? 'text/plain,text/markdown,*/*' : 'text/html', 'Accept-Language': 'es-ES,es;q=0.9', 'User-Agent': 'Primy/16.9 sports sync', 'x-no-cache': 'true' } });
      lastStatus = response.status;
      if (response.ok) { html = await response.text(); break; }
      if (![403, 429].includes(response.status)) break;
      await new Promise(resolve => setTimeout(resolve, 900 * (attempt + 1)));
    }
    if (html) break;
  }
  if (!html) throw new Error(`SELAE ${gameId}: HTTP ${lastStatus}`);
  const matches = parseMatches(html, source.expected);
  if (matches.length !== source.expected) throw new Error(`SELAE ${gameId}: ${matches.length}/${source.expected} partidos interpretados`);
  const sourceHash = hashText(clean(html, 250000));
  const now = new Date().toISOString();
  const roundId = `${gameId}:current`;
  const { data: previous } = await supabase.from('primy_sports_rounds').select('source_hash,revision').eq('round_id', roundId).maybeSingle();
  const revision = previous?.source_hash && previous.source_hash !== sourceHash ? Number(previous.revision || 1) + 1 : Number(previous?.revision || 1);
  const row = {
    round_id: roundId, game_id: gameId, season: null, official_round_number: null, round_date: null,
    status: 'published', sales_open_at: null, sales_close_at: null, source: 'SELAE oficial', source_url: source.url,
    source_hash: sourceHash, official_updated_at: null, fetched_at: now, revision, matches,
    metadata: { parserVersion: 'sports-edge-v2', sourceType: 'checker-composition', provisionalIdentity: true },
  };
  const { error } = await supabase.from('primy_sports_rounds').upsert(row, { onConflict: 'round_id' });
  if (error) throw error;
  const { error: revisionError } = await supabase.from('primy_sports_round_revisions').upsert({
    round_id: roundId, source_hash: sourceHash, game_id: gameId, status: 'published', fetched_at: now, matches,
    metadata: { revision, parserVersion: 'sports-edge-v2' },
  }, { onConflict: 'round_id,source_hash', ignoreDuplicates: true });
  if (revisionError) throw revisionError;
  return { gameId, roundId, matches: matches.length, revision, changed: previous?.source_hash !== sourceHash, sourceHash };
}

Deno.serve(async req => {
  if (req.method !== 'POST' && req.method !== 'GET') return new Response(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ success: false, code: 'SUPABASE_NOT_CONFIGURED' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  let body: any = {};
  try { body = req.method === 'POST' ? await req.json() : {}; } catch { body = {}; }
  const requested = body?.gameId && SOURCES[body.gameId] ? [body.gameId] : Object.keys(SOURCES);
  const results = [];
  const errors = [];
  for (const gameId of requested) {
    try { results.push(await syncGame(supabase, gameId)); }
    catch (error) { errors.push({ gameId, message: String(error?.message || error).slice(0, 300) }); }
  }
  const success = results.length > 0 && errors.length === 0;
  return new Response(JSON.stringify({ success, provider: 'SELAE', syncedAt: new Date().toISOString(), results, errors }), {
    status: success ? 200 : results.length ? 207 : 502,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
});
