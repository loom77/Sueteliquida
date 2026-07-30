import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OFFICIAL_URL = "https://www.loteriasyapuestas.es/es/resultados";
const READER_URL = `https://r.jina.ai/${OFFICIAL_URL}`;

type GameId = "euromillones" | "primitiva" | "bonoloto" | "eurodreams";
type PrizeRow = { category: string; amount: number; prize: number };
type Draw = {
  gameId: GameId;
  date: string;
  winningNumbers: number[];
  secondaryNumbers: number[];
  extra: number | null;
  complementary: number | null;
  prizes: PrizeRow[];
  jackpotNext: number | null;
  jackpotFormatted: string;
  source: string;
  sourceUrl: string;
  sourceHash: string;
  updatedAt: string;
  fetchedAt: string;
};

class SyncError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "SYNC_ERROR", status = 502) {
    super(message);
    this.name = "SyncError";
    this.code = code;
    this.status = status;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function normalizeText(value: string) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\r/g, "").replace(/[ \t]+/g, " ");
}

function europeanDateToIso(value: string) {
  const match = String(value || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function parseEuropeanAmount(value: string) {
  const normalized = String(value || "").replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function extractSection(markdown: string, startPattern: RegExp, endPatterns: RegExp[]) {
  const startMatch = startPattern.exec(markdown);
  if (!startMatch || startMatch.index == null) return null;
  const tail = markdown.slice(startMatch.index + startMatch[0].length);
  let end = tail.length;
  for (const pattern of endPatterns) {
    const match = pattern.exec(tail);
    if (match?.index != null) end = Math.min(end, match.index);
  }
  return { header: startMatch[0], date: europeanDateToIso(startMatch[1] || startMatch[0]), body: tail.slice(0, end) };
}

function bulletNumbers(value: string) {
  return [...String(value || "").matchAll(/^\s*[*+-]\s*(\d{1,2})\s*$/gm)].map(match => Number(match[1]));
}

function uniqueFirst(values: number[], count: number, min: number, max: number) {
  const output: number[] = [];
  const seen = new Set<number>();
  for (const value of values) {
    if (!Number.isInteger(value) || value < min || value > max || seen.has(value)) continue;
    seen.add(value);
    output.push(value);
    if (output.length === count) break;
  }
  return output;
}

function labelBullet(section: string, label: RegExp, min: number, max: number) {
  const match = label.exec(section);
  if (!match || match.index == null) return null;
  const nearby = section.slice(match.index + match[0].length, match.index + match[0].length + 140);
  const value = Number(nearby.match(/^\s*(?:\n\s*)?[*+-]\s*(\d{1,2})/m)?.[1] || nearby.match(/\b(\d{1,2})\b/)?.[1]);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function extractJackpot(section: string) {
  const match = section.match(/Bote\s+publicitado\s*:\s*\|?\s*([\d.]+(?:,\d{1,2})?)\s*€/i);
  if (!match) return { jackpotNext: null, jackpotFormatted: "" };
  return { jackpotNext: parseEuropeanAmount(match[1]), jackpotFormatted: `${match[1]} €` };
}

function extractPrizeRows(section: string): PrizeRow[] {
  const rows: PrizeRow[] = [];
  for (const line of section.split("\n")) {
    if (!line.includes("|") || !/€/.test(line)) continue;
    const cells = line.split("|").map(cell => cell.trim()).filter(Boolean);
    if (cells.length < 2 || /categor[ií]as|premios/i.test(cells[0])) continue;
    const amountCell = cells.find(cell => /[\d.]+(?:,\d{1,2})?\s*€/.test(cell));
    const value = amountCell?.match(/([\d.]+(?:,\d{1,2})?)\s*€/i)?.[1];
    const amount = value ? parseEuropeanAmount(value) : null;
    if (amount != null) rows.push({ category: cells[0], amount, prize: amount });
  }
  return rows.slice(0, 20);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function makeDraw(gameId: GameId, section: NonNullable<ReturnType<typeof extractSection>>, values: Omit<Draw, "gameId" | "date" | "source" | "sourceUrl" | "sourceHash" | "updatedAt" | "fetchedAt">): Promise<Draw> {
  const now = new Date().toISOString();
  return {
    gameId,
    date: section.date,
    ...values,
    source: "SELAE oficial mediante caché de lectura",
    sourceUrl: OFFICIAL_URL,
    sourceHash: await sha256(section.header + section.body),
    updatedAt: now,
    fetchedAt: now,
  };
}

async function parseEuromillones(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /Euromillones[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/La\s+Primitiva[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de Euromillones.", "EUROMILLONES_NOT_FOUND", 404);
  const appearance = section.body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || section.body;
  const resultBlock = appearance.split(/Otros\s+resultados/i)[0];
  const bullets = bulletNumbers(resultBlock);
  const winningNumbers = uniqueFirst(bullets.slice(0, 5), 5, 1, 50).sort((a, b) => a - b);
  const secondaryNumbers = uniqueFirst(bullets.slice(5).reverse(), 2, 1, 12).sort((a, b) => a - b);
  if (winningNumbers.length !== 5 || secondaryNumbers.length !== 2) {
    throw new SyncError("El resultado de Euromillones está incompleto.", "INVALID_EUROMILLONES_PAYLOAD");
  }
  const jackpot = extractJackpot(section.body);
  return makeDraw("euromillones", section, {
    winningNumbers, secondaryNumbers, extra: null, complementary: null,
    prizes: extractPrizeRows(section.body), jackpotNext: jackpot.jackpotNext, jackpotFormatted: jackpot.jackpotFormatted,
  });
}

async function parsePrimitiva(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /La\s+Primitiva[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/Bonoloto[^\n]*?\+\s*Info/i, /El\s+Gordo[^\n]*?\+\s*Info/i, /EuroDreams[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de La Primitiva.", "PRIMITIVA_NOT_FOUND", 404);
  const appearance = section.body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || section.body;
  const numbersPart = appearance.split(/^\s*C\s*$/mi)[0];
  const winningNumbers = uniqueFirst(bulletNumbers(numbersPart), 6, 1, 49).sort((a, b) => a - b);
  const complementary = labelBullet(appearance, /^\s*C\s*$/mi, 1, 49);
  const reintegro = labelBullet(appearance, /^\s*R\s*$/mi, 0, 9);
  if (winningNumbers.length !== 6 || complementary == null || reintegro == null) throw new SyncError("El resultado de La Primitiva está incompleto.", "INVALID_PRIMITIVA_PAYLOAD");
  const jackpot = extractJackpot(section.body);
  return makeDraw("primitiva", section, {
    winningNumbers, secondaryNumbers: [], extra: reintegro, complementary,
    prizes: extractPrizeRows(section.body), jackpotNext: jackpot.jackpotNext, jackpotFormatted: jackpot.jackpotFormatted,
  });
}


async function parseBonoloto(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /Bonoloto[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/El\s+Gordo[^\n]*?\+\s*Info/i, /EuroDreams[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de Bonoloto.", "BONOLOTO_NOT_FOUND", 404);
  const appearance = section.body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || section.body;
  const numbersPart = appearance.split(/^\s*C\s*$/mi)[0];
  const winningNumbers = uniqueFirst(bulletNumbers(numbersPart), 6, 1, 49).sort((a, b) => a - b);
  const complementary = labelBullet(appearance, /^\s*C\s*$/mi, 1, 49);
  const reintegro = labelBullet(appearance, /^\s*R\s*$/mi, 0, 9);
  if (winningNumbers.length !== 6 || complementary == null || reintegro == null) throw new SyncError("El resultado de Bonoloto está incompleto.", "INVALID_BONOLOTO_PAYLOAD");
  const jackpot = extractJackpot(section.body);
  return makeDraw("bonoloto", section, {
    winningNumbers, secondaryNumbers: [], extra: reintegro, complementary,
    prizes: extractPrizeRows(section.body), jackpotNext: jackpot.jackpotNext, jackpotFormatted: jackpot.jackpotFormatted,
  });
}

async function parseEurodreams(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /EuroDreams[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/Loter[ií]a\s+Nacional[^\n]*?\+\s*Info/i, /La\s+Quiniela[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de EuroDreams.", "EURODREAMS_NOT_FOUND", 404);
  const appearance = section.body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || section.body;
  const numbersPart = appearance.split(/^\s*SUE[ÑN]O\s*$/mi)[0];
  const winningNumbers = uniqueFirst(bulletNumbers(numbersPart), 6, 1, 40).sort((a, b) => a - b);
  const dream = labelBullet(appearance, /^\s*SUE[ÑN]O\s*$/mi, 1, 5);
  if (winningNumbers.length !== 6 || dream == null) throw new SyncError("El resultado de EuroDreams está incompleto.", "INVALID_EURODREAMS_PAYLOAD");
  return makeDraw("eurodreams", section, {
    winningNumbers, secondaryNumbers: [], extra: dream, complementary: null,
    prizes: extractPrizeRows(section.body), jackpotNext: null, jackpotFormatted: "",
  });
}

async function fetchOfficialSnapshot() {
  const response = await fetch(READER_URL, {
    headers: { accept: "text/plain,text/markdown,*/*", "user-agent": "Primy/15.4 (+https://sueteliquida.vercel.app; official-results-sync)", "x-no-cache": "true" },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (response.status === 429) throw new SyncError("La caché de lectura ha limitado temporalmente la consulta.", "READER_RATE_LIMITED", 429);
  if (!response.ok) throw new SyncError(`La fuente de lectura ha respondido con HTTP ${response.status}.`, "READER_REJECTED");
  const text = normalizeText(await response.text());
  if (text.length < 500) throw new SyncError("La fuente de lectura ha devuelto una respuesta incompleta.", "READER_INVALID_PAYLOAD");
  return text;
}

async function upsertDraws(draws: Draw[]) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) throw new SyncError("Supabase no está configurado.", "SUPABASE_NOT_CONFIGURED", 500);
  const rows = draws.map(draw => ({
    game_id: draw.gameId, draw_date: draw.date, winning_numbers: draw.winningNumbers,
    secondary_numbers: draw.secondaryNumbers, extra: draw.extra, complementary: draw.complementary,
    prizes: draw.prizes, jackpot_next: draw.jackpotNext, jackpot_formatted: draw.jackpotFormatted || null,
    source: draw.source, source_url: draw.sourceUrl, source_hash: draw.sourceHash,
    official_updated_at: draw.updatedAt, fetched_at: draw.fetchedAt,
  }));
  const response = await fetch(`${supabaseUrl}/rest/v1/primy_draw_results?on_conflict=game_id,draw_date`, {
    method: "POST",
    headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new SyncError(`Supabase ha rechazado la escritura: ${(await response.text()).slice(0, 300)}`, "SUPABASE_WRITE_FAILED");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const snapshot = await fetchOfficialSnapshot();
    const settled = await Promise.allSettled([parseEuromillones(snapshot), parsePrimitiva(snapshot), parseBonoloto(snapshot), parseEurodreams(snapshot)]);
    const draws = settled.filter((result): result is PromiseFulfilledResult<Draw> => result.status === "fulfilled").map(result => result.value);
    const errors = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected").map(result => ({ code: result.reason instanceof SyncError ? result.reason.code : "UNKNOWN", message: result.reason instanceof Error ? result.reason.message : String(result.reason) }));
    if (!draws.length) return json({ success: false, provider: "SELAE", saved: 0, errors }, 502);
    await upsertDraws(draws);
    return json({ success: true, provider: "SELAE", transport: "reader-cache", saved: draws.length, draws: draws.map(draw => ({ gameId: draw.gameId, date: draw.date, winningNumbers: draw.winningNumbers, secondaryNumbers: draw.secondaryNumbers, extra: draw.extra, complementary: draw.complementary })), errors, syncedAt: new Date().toISOString() });
  } catch (error) {
    const known = error instanceof SyncError;
    return json({ success: false, provider: "SELAE", saved: 0, code: known ? error.code : "UNKNOWN", message: error instanceof Error ? error.message : String(error) }, known ? error.status : 502);
  }
});
