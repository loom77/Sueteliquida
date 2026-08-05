import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const BASE = 'https://www.loteriasyapuestas.es';
const CONFIG = {
  quiniela: {
    expected: 15,
    round: '76',
    date: '2026-08-07',
    open: '2026-08-02T00:00:00+02:00',
    close: '2026-08-07T19:00:00+02:00',
    url: `${BASE}/es/resultados/quiniela/comprobar`,
    fallback: null,
  },
  quinigol: {
    expected: 6,
    round: '88',
    date: '2026-08-08',
    open: '2026-08-02T00:00:00+02:00',
    close: '2026-08-08T14:00:00+02:00',
    url: `${BASE}/es/resultados/quinigol/comprobar`,
    fallback: [
      ['Tps', 'IFK Mariehamn'],
      ['Start', 'Viking'],
      ['Aalesund', 'Tromso'],
      ['Goteborg', 'Degerfors'],
      ['Brommapojkarna', 'Malmo'],
      ['Aik', 'Orgryte'],
    ],
  },
};
const SALE_URL = `${BASE}/f/loterias/web_corporativa/Comunicacion/Avisos_de_interes/Aviso%20cierre%20La%20Quiniela%20jornada%2076%C2%AA%20y%20El%20QuiniGol%20jornada%2088%C2%AA%20de%208%20-%209%20de%20Agosto%20de%202026.pdf`;

function clean(value: string, maxLength = 600) {
  return String(value || '').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/<[^>]+>/g, ' ').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, maxLength);
}

function team(value: string) {
  return clean(value, 300)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\]\([^)]*\)/g, '')
    .replace(/^\[|\]$/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/(?:Añadir a Elige 8|Add to Elige 8|Engadir a Elixe 8).*$/i, '')
    .replace(/^P-?15[. :]*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function suspicious(value: string) {
  return !value || /https?:|www\.|\[|\]|\.com\b|añadir\s+a|elige\s*8/i.test(value) || /^\d+$/.test(value);
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `selae-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function fetchText(url: string) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'text/plain,text/markdown,*/*', 'User-Agent': 'Primy/17.0 sports' },
      signal: AbortSignal.timeout(40000),
    });
    lastStatus = response.status;
    if (response.ok) return await response.text();
    if (![403, 429, 502, 503].includes(response.status)) break;
    await new Promise(resolve => setTimeout(resolve, 900 * (attempt + 1)));
  }
  throw new Error(`HTTP ${lastStatus}`);
}

function matchItem(position: number, homeTeam: string, awayTeam: string, source = 'official-checker') {
  return {
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
    metadata: { source },
  };
}

function parseMatches(text: string, expected: number) {
  const source = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/Image:[^\n]*/gi, ' ');
  const lines = source.split(/\n+/).map(line => clean(line)).filter(Boolean);
  const output = new Map<number, ReturnType<typeof matchItem>>();

  for (let index = 0; index < lines.length; index += 1) {
    let position = 0;
    let pair = '';
    const pleno = lines[index].match(/^\s*P-?15[.]?\s+(.+?\s[-–—]\s.+)$/i);
    const numbered = lines[index].match(/^\s*(\d{1,2})[.]?\s+(.+?\s[-–—]\s.+)$/i);
    if (pleno) {
      position = 15;
      pair = pleno[1];
    } else if (numbered) {
      position = Number(numbered[1]);
      pair = numbered[2];
    } else if (/^P-?15[.]?$/i.test(lines[index]) && lines[index + 1]) {
      position = 15;
      pair = lines[index + 1];
    } else if (/^\d{1,2}[.]?$/.test(lines[index]) && lines[index + 1]) {
      position = Number(lines[index].match(/\d{1,2}/)?.[0]);
      pair = lines[index + 1];
    }
    if (!position || position < 1 || position > expected || !/\s[-–—]\s/.test(pair)) continue;
    const parts = pair.split(/\s[-–—]\s/);
    const homeTeam = team(parts.shift() || '');
    const awayTeam = team(parts.join(' - ').replace(/\s+(?:1\s+X\s+2|0\s+1\s+2\s+M).*$/i, ''));
    if (suspicious(homeTeam) || suspicious(awayTeam) || homeTeam.toLowerCase() === awayTeam.toLowerCase()) continue;
    output.set(position, matchItem(position, homeTeam, awayTeam));
  }
  return [...output.values()].sort((left, right) => left.position - right.position);
}

function fallbackMatches(config: any) {
  if (!Array.isArray(config.fallback) || Date.now() >= new Date(config.close).getTime()) return [];
  return config.fallback.map((pair: string[], index: number) => matchItem(index + 1, pair[0], pair[1], 'official-checker-validated-snapshot'));
}

async function syncGame(supabase: any, gameId: string) {
  const config = (CONFIG as any)[gameId];
  let text = '';
  let fetchError = '';
  try { text = await fetchText(`https://r.jina.ai/${config.url}`); }
  catch (error) { fetchError = String((error as any)?.message || error); }

  let matches = text ? parseMatches(text, config.expected) : [];
  let sourceType = 'official-checker-with-sale-notice';
  if (matches.length !== config.expected) {
    const fallback = fallbackMatches(config);
    if (fallback.length === config.expected) {
      matches = fallback;
      sourceType = 'official-checker-validated-snapshot';
    } else {
      return {
        gameId,
        status: 'updating',
        available: false,
        parsedMatches: matches.length,
        expectedMatches: config.expected,
        message: 'La composición recibida no supera la validación completa; Primy mantiene el juego bloqueado.',
        fetchError: fetchError || null,
      };
    }
  }

  const now = new Date().toISOString();
  const season = '2025-2026';
  const roundId = `${gameId}:${season}:${config.round}`;
  const sourceHash = hashText(`${JSON.stringify(matches)}\n${config.round}\n${config.date}`);
  const { data: previous } = await supabase.from('primy_sports_rounds').select('source_hash,revision').eq('round_id', roundId).maybeSingle();
  const revision = previous?.source_hash && previous.source_hash !== sourceHash ? Number(previous.revision || 1) + 1 : Number(previous?.revision || 1);
  const status = new Date(config.close).getTime() > Date.now() ? 'sales-open' : 'sales-closed';
  const metadata = {
    parserVersion: 'sports-checker-v7',
    sourceType,
    provisionalIdentity: false,
    saleUrl: SALE_URL,
    snapshotExpiresAt: sourceType.includes('snapshot') ? config.close : null,
  };
  const row = {
    round_id: roundId,
    game_id: gameId,
    season,
    official_round_number: config.round,
    round_date: config.date,
    status,
    sales_open_at: config.open,
    sales_close_at: config.close,
    source: 'SELAE oficial',
    source_url: config.url,
    source_hash: sourceHash,
    official_updated_at: now,
    fetched_at: now,
    revision,
    matches,
    metadata,
  };
  const { error } = await supabase.from('primy_sports_rounds').upsert(row, { onConflict: 'round_id' });
  if (error) throw error;
  const { error: revisionError } = await supabase.from('primy_sports_round_revisions').upsert({
    round_id: roundId,
    source_hash: sourceHash,
    game_id: gameId,
    status,
    fetched_at: now,
    matches,
    metadata: { ...metadata, revision, roundDate: config.date, officialRoundNumber: config.round, salesCloseAt: config.close },
  }, { onConflict: 'round_id,source_hash', ignoreDuplicates: true });
  if (revisionError) throw revisionError;
  return { gameId, status, available: status === 'sales-open', roundId, matches: matches.length, revision, salesCloseAt: config.close, sourceHash, sourceType };
}

Deno.serve(async request => {
  if (!['GET', 'POST'].includes(request.method)) return new Response(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED' }), { status: 405 });
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ success: false, code: 'SUPABASE_NOT_CONFIGURED' }), { status: 503 });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const results: any[] = [];
  const errors: any[] = [];
  for (const gameId of Object.keys(CONFIG)) {
    try { results.push(await syncGame(supabase, gameId)); }
    catch (error) { errors.push({ gameId, message: String((error as any)?.message || error).slice(0, 300) }); }
  }
  return new Response(JSON.stringify({ success: errors.length === 0, complete: errors.length === 0 && results.every(result => result.available), provider: 'SELAE', syncedAt: new Date().toISOString(), results, errors }), {
    status: errors.length ? 207 : 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
});
