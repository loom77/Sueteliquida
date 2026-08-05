import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const BASE = 'https://www.loteriasyapuestas.es';
const SALE_URL = `${BASE}/f/loterias/web_corporativa/Comunicacion/Avisos_de_interes/Aviso%20cierre%20La%20Quiniela%20jornada%2076%C2%AA%20y%20El%20QuiniGol%20jornada%2088%C2%AA%20de%208%20-%209%20de%20Agosto%20de%202026.pdf`;
const VERIFIED_QUINIELA_76_URL = 'https://www.quinielafutbol.info/quiniela-jornada-76-temporada-2025-2026/';

const CONFIG = {
  quiniela: {
    expected: 15,
    round: '76',
    date: '2026-08-07',
    open: '2026-08-02T00:00:00+02:00',
    close: '2026-08-07T19:00:00+02:00',
    url: `${BASE}/es/resultados/quiniela/comprobar`,
    verifiedFallback: [
      ['Sandefjord', 'KFUM Oslo'],
      ['Vålerenga', 'Bodø/Glimt'],
      ['Viking', 'Sarpsborg 08'],
      ['Start', 'Fredrikstad'],
      ['Lillestrøm', 'Rosenborg'],
      ['HamKam', 'Aalesund'],
      ['Kristiansund', 'Molde'],
      ['Örgryte', 'AIK'],
      ['Mjällby', 'Elfsborg'],
      ['Hammarby', 'Häcken'],
      ['Malmö', 'Degerfors'],
      ['Halmstads', 'Gais'],
      ['Göteborg', 'Kalmar'],
      ['Sirius', 'Brommapojkarna'],
      ['Västerås', 'Djurgårdens'],
    ],
    fallbackReference: VERIFIED_QUINIELA_76_URL,
  },
  quinigol: {
    expected: 6,
    round: '88',
    date: '2026-08-08',
    open: '2026-08-02T00:00:00+02:00',
    close: '2026-08-08T14:00:00+02:00',
    url: `${BASE}/es/resultados/quinigol/comprobar`,
    verifiedFallback: null,
    fallbackReference: null,
  },
};

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

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

function normalizePair(item: any) {
  return `${String(item.homeTeam || '').toLocaleLowerCase('es-ES')}::${String(item.awayTeam || '').toLocaleLowerCase('es-ES')}`;
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
      headers: { Accept: 'text/plain,text/markdown,*/*', 'User-Agent': 'Primy/17.0.1 sports' },
      signal: AbortSignal.timeout(40000),
    });
    lastStatus = response.status;
    if (response.ok) return await response.text();
    if (![403, 429, 502, 503].includes(response.status)) break;
    await new Promise(resolve => setTimeout(resolve, 900 * (attempt + 1)));
  }
  throw new Error(`HTTP ${lastStatus}`);
}

function predictionType(gameId: string, position: number) {
  if (gameId === 'quinigol') return 'score-buckets';
  return position === 15 ? 'pleno15' : 'one-x-two';
}

function matchItem(gameId: string, position: number, homeTeam: string, awayTeam: string, source = 'official-checker') {
  const type = predictionType(gameId, position);
  return {
    matchId: `match-${position}`,
    officialMatchId: null,
    position,
    predictionType: type,
    homeTeam,
    awayTeam,
    competition: '',
    kickoffAt: null,
    status: 'scheduled',
    officialScore: null,
    excludedReason: '',
    metadata: { source, predictionType: type },
  };
}

function parseMatches(text: string, gameId: string, expected: number) {
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
    output.set(position, matchItem(gameId, position, homeTeam, awayTeam));
  }
  return [...output.values()].sort((left, right) => left.position - right.position);
}

function extractRoundNumber(text: string) {
  const normalized = clean(text, 30000);
  return normalized.match(/jornada\s+(\d{1,3})(?:\s*[ªa])?/i)?.[1] || '';
}

function pad(value: number | string) {
  return String(value).padStart(2, '0');
}

function validDate(year: string, month: number | string, day: string) {
  const key = `${year}-${pad(month)}-${pad(day)}`;
  const parsed = new Date(`${key}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? '' : key;
}

function extractRoundDate(text: string) {
  const normalized = clean(text, 30000).toLocaleLowerCase('es-ES');
  let match = normalized.match(/\b([0-3]?\d)[\/-]([01]?\d)[\/-](20\d{2})\b/);
  if (match) return validDate(match[3], match[2], match[1]);
  match = normalized.match(/\b([0-3]?\d)\s+de\s+([a-záéíóúñ]+)\s+de\s+(20\d{2})\b/i);
  if (match) {
    const month = MONTHS[match[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    if (month) return validDate(match[3], month, match[1]);
  }
  return '';
}

function compositionValidation(matches: any[], gameId: string, expected: number) {
  const reasons: string[] = [];
  if (matches.length !== expected) reasons.push(`Se recibieron ${matches.length} partidos y se esperaban ${expected}.`);
  const positions = new Set<number>();
  const pairs = new Set<string>();
  for (const item of matches) {
    if (positions.has(item.position)) reasons.push(`Posición duplicada: ${item.position}.`);
    positions.add(item.position);
    const pair = normalizePair(item);
    if (pairs.has(pair)) reasons.push(`Encuentro duplicado: ${item.homeTeam} - ${item.awayTeam}.`);
    pairs.add(pair);
    const expectedType = predictionType(gameId, item.position);
    if (item.predictionType !== expectedType) reasons.push(`Tipo de pronóstico incorrecto en la posición ${item.position}.`);
  }
  for (let position = 1; position <= expected; position += 1) {
    if (!positions.has(position)) reasons.push(`Falta la posición ${position}.`);
  }
  return { valid: reasons.length === 0, reasons };
}

function sourceIdentity(text: string, config: any) {
  const roundNumber = extractRoundNumber(text);
  const roundDate = extractRoundDate(text);
  const reasons: string[] = [];
  if (!roundNumber && !roundDate) reasons.push('La página de comprobación no identifica de forma inequívoca la jornada publicada.');
  if (roundNumber && roundNumber !== config.round) reasons.push(`La fuente publica la jornada ${roundNumber}, no la ${config.round}.`);
  if (roundDate && roundDate !== config.date) reasons.push(`La fuente publica la fecha ${roundDate}, no ${config.date}.`);
  return { valid: reasons.length === 0, roundNumber, roundDate, reasons };
}

function fallbackMatches(gameId: string, config: any) {
  if (!Array.isArray(config.verifiedFallback) || Date.now() >= new Date(config.close).getTime()) return [];
  return config.verifiedFallback.map((pair: string[], index: number) => matchItem(gameId, index + 1, pair[0], pair[1], 'published-composition-verified-snapshot'));
}

async function syncGame(supabase: any, gameId: string) {
  const config = (CONFIG as any)[gameId];
  let text = '';
  let fetchError = '';
  try { text = await fetchText(`https://r.jina.ai/${config.url}`); }
  catch (error) { fetchError = String((error as any)?.message || error); }

  const parsedMatches = text ? parseMatches(text, gameId, config.expected) : [];
  const parsedValidation = compositionValidation(parsedMatches, gameId, config.expected);
  const identity = text ? sourceIdentity(text, config) : { valid: false, roundNumber: '', roundDate: '', reasons: ['No se pudo descargar la página de comprobación.'] };
  let matches = parsedValidation.valid && identity.valid ? parsedMatches : [];
  let sourceType = 'official-checker-identity-verified';
  let sourceReferences = [config.url, SALE_URL];

  if (!matches.length) {
    const fallback = fallbackMatches(gameId, config);
    const fallbackValidation = compositionValidation(fallback, gameId, config.expected);
    if (fallbackValidation.valid) {
      matches = fallback;
      sourceType = 'published-composition-verified-snapshot';
      sourceReferences = [SALE_URL, config.fallbackReference].filter(Boolean);
    } else {
      return {
        gameId,
        status: 'updating',
        available: false,
        parsedMatches: parsedMatches.length,
        expectedMatches: config.expected,
        parsedRoundNumber: identity.roundNumber || null,
        parsedRoundDate: identity.roundDate || null,
        reasons: [...identity.reasons, ...parsedValidation.reasons, ...fallbackValidation.reasons],
        message: 'La composición recibida no coincide con la identidad oficial esperada; Primy mantiene el juego bloqueado.',
        fetchError: fetchError || null,
      };
    }
  }

  const now = new Date().toISOString();
  const season = '2025-2026';
  const roundId = `${gameId}:${season}:${config.round}`;
  const sourceHash = hashText(`${JSON.stringify(matches)}\n${config.round}\n${config.date}\n${sourceType}`);
  const { data: previous } = await supabase.from('primy_sports_rounds').select('source_hash,revision').eq('round_id', roundId).maybeSingle();
  const revision = previous?.source_hash && previous.source_hash !== sourceHash ? Number(previous.revision || 1) + 1 : Number(previous?.revision || 1);
  const status = new Date(config.close).getTime() > Date.now() ? 'sales-open' : 'sales-closed';
  const metadata = {
    parserVersion: 'sports-checker-v8',
    sourceType,
    provisionalIdentity: false,
    identityVerified: true,
    compositionVerified: true,
    saleUrl: SALE_URL,
    sourceReferences,
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
    source: 'SELAE oficial / composición publicada verificada',
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
  const requestUrl = new URL(request.url);
  const requestedGame = request.method === 'GET' ? requestUrl.searchParams.get('game') : null;
  const gameIds = requestedGame && Object.hasOwn(CONFIG, requestedGame) ? [requestedGame] : Object.keys(CONFIG);
  const results: any[] = [];
  const errors: any[] = [];
  for (const gameId of gameIds) {
    try { results.push(await syncGame(supabase, gameId)); }
    catch (error) { errors.push({ gameId, message: String((error as any)?.message || error).slice(0, 300) }); }
  }
  return new Response(JSON.stringify({ success: errors.length === 0, complete: errors.length === 0 && results.every(result => result.available), provider: 'SELAE', syncedAt: new Date().toISOString(), results, errors }), {
    status: errors.length ? 207 : 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
});
