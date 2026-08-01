import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OFFICIAL_URL = "https://www.loteriasyapuestas.es/es/resultados";
const READER_URL = `https://r.jina.ai/${OFFICIAL_URL}`;

type GameId = "euromillones" | "primitiva" | "bonoloto" | "gordoprimitiva" | "eurodreams" | "loteria-nacional";
type PrizeRow = { category: string; amount: number | null; prize?: number | null; type?: string; number?: string; value?: string; digits?: number; series?: number; fraction?: number };
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
  metadata?: Record<string, unknown>;
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


async function parseGordo(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /El\s+Gordo[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/EuroDreams[^\n]*?\+\s*Info/i, /Loter[ií]a\s+Nacional[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de El Gordo.", "GORDO_NOT_FOUND", 404);
  const appearance = section.body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || section.body;
  const numbersPart = appearance.split(/^\s*N[º°o.]?\s*clave\s*$/mi)[0];
  const winningNumbers = uniqueFirst(bulletNumbers(numbersPart), 5, 1, 54).sort((a, b) => a - b);
  const key = labelBullet(appearance, /^\s*N[º°o.]?\s*clave\s*$/mi, 0, 9);
  if (winningNumbers.length !== 5 || key == null) throw new SyncError("El resultado de El Gordo está incompleto.", "INVALID_GORDO_PAYLOAD");
  const jackpot = extractJackpot(section.body);
  return makeDraw("gordoprimitiva", section, {
    winningNumbers, secondaryNumbers: [], extra: key, complementary: null,
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


function fiveDigitsAfterLabel(section: string, labels: RegExp[]) {
  for (const label of labels) {
    const match = label.exec(section);
    if (!match || match.index == null) continue;
    const nearby = section.slice(match.index + match[0].length, match.index + match[0].length + 180);
    const number = nearby.match(/\b(\d{5})\b/)?.[1];
    if (number) return number;
  }
  return "";
}

function amountFor(rows: PrizeRow[], labels: string[]) {
  for (const row of rows) {
    const category = String(row.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (labels.some(label => category.includes(label))) return Number(row.amount);
  }
  return null;
}


function nationalListUrl(markdown: string) {
  const match = String(markdown || "").match(/\[[^\]]*Listado\s+de\s+premios[^\]]*\]\((https?:\/\/[^)]+\.pdf(?:\?[^)]*)?)\)/i);
  return match?.[1] || "";
}

function perDecimo(value: string) {
  const parsed = parseEuropeanAmount(value);
  return parsed == null ? null : parsed / 10;
}

function listTokens(value: string, min: number, max = min) {
  return (String(value || "").match(/\b\d{1,5}\b/g) || []).filter(token => token.length >= min && token.length <= max);
}

function officialListRules(text: string, first: string, second: string, third: string, summary: PrizeRow[]) {
  const source = normalizeText(text);
  if (!/LISTA\s+OFICIAL|INSTRUCCIONES\s+PARA\s+LA\s+CONSULTA|Euros\/Billete/i.test(source)) throw new SyncError("El listado oficial de Lotería Nacional no tiene el formato esperado.", "INVALID_LNAC_LIST");
  const prizes: PrizeRow[] = [];
  const principal = [first, second, third].filter(Boolean);
  const principalAmounts = [...source.matchAll(/1\s+Premio\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros\s+para\s+el\s+billete\s+n[uú]mero/gi)].map(match => perDecimo(match[1]));
  principal.forEach((number, index) => {
    const existing = summary.find(item => item.type === "exact" && item.number === number);
    prizes.push({ type: "exact", category: existing?.category || (index === 0 ? "1er Premio" : index === 1 ? "2º Premio" : "3er Premio"), number, amount: existing?.amount ?? principalAmounts[index] ?? null });
  });
  prizes.push(...summary.filter(item => item.type === "special"));

  const approximationAmounts = [...source.matchAll(/Aproximaciones?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros/gi)].map(match => perDecimo(match[1]));
  approximationAmounts.slice(0, principal.length).forEach((amount, index) => prizes.push({ type: "approximation", category: `Aproximación al ${index === 0 ? "1er" : index === 1 ? "2º" : "3er"} Premio`, number: principal[index], amount }));

  const hundredPattern = /Centenas?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]{0,220}?n[uú]meros?\s+(\d{3})00\s+al\s+\2(?:99|99,)/gi;
  let match: RegExpExecArray | null;
  while ((match = hundredPattern.exec(source))) prizes.push({ type: "hundred", category: `Centena ${match[2]}`, value: match[2], amount: perDecimo(match[1]) });

  const blockPattern = /(\d[\d.]*)\s+Premios?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]*?terminados\s+en\s*:\s*([\s\S]{0,500}?)(?=\n\s*\d[\d.]*\s+Premios?|\n\s*Esta\s+lista|\n\s*\d+\s+Premio\s+de|$)/gi;
  while ((match = blockPattern.exec(source))) {
    for (const value of listTokens(match[3], 2, 4)) prizes.push({ type: "ending", category: `Terminación de ${value.length} cifras (${value})`, value, digits: value.length, amount: perDecimo(match[2]) });
  }
  const firstEndingPattern = /(\d[\d.]*)\s+Premios?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]*?terminados\s+como\s+el\s+primer\s+premio\s+en[^0-9]{0,160}(\d{1,4})/gi;
  while ((match = firstEndingPattern.exec(source))) prizes.push({ type: "ending", category: `Terminación del 1er premio (${match[3]})`, value: match[3], digits: match[3].length, amount: perDecimo(match[2]) });

  const refundPattern = /Reintegros?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]{0,220}?(?:sea|en)[^0-9]{0,80}(\d)\b/gi;
  while ((match = refundPattern.exec(source))) prizes.push({ type: "refund", category: `Reintegro ${match[2]}`, value: match[2], amount: perDecimo(match[1]) });
  if (!prizes.length) throw new SyncError("El listado oficial no contiene reglas interpretables.", "INVALID_LNAC_LIST");
  return prizes;
}

async function fetchOfficialList(url: string) {
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: { accept: "text/plain,text/markdown,*/*", "user-agent": "Primy/15.6 (+https://sueteliquida.vercel.app; official-list-sync)", "x-no-cache": "true" },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new SyncError(`El listado oficial ha respondido con HTTP ${response.status}.`, "LNAC_LIST_REJECTED", response.status === 429 ? 429 : 502);
  const text = normalizeText(await response.text());
  if (text.length < 500) throw new SyncError("El listado oficial está incompleto.", "INVALID_LNAC_LIST");
  return text;
}

async function parseNationalLottery(markdown: string): Promise<Draw> {
  const section = extractSection(markdown, /Loter[ií]a\s+Nacional[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i, [/La\s+Quiniela[^\n]*?\+\s*Info/i, /Quinigol[^\n]*?\+\s*Info/i]);
  if (!section?.date) throw new SyncError("No se ha encontrado el último sorteo de Lotería Nacional.", "LNAC_NOT_FOUND", 404);
  const first = fiveDigitsAfterLabel(section.body, [/1(?:er|º)\s+Premio/i, /Primer\s+Premio/i]);
  const second = fiveDigitsAfterLabel(section.body, [/2(?:º|o)\s+Premio/i, /Segundo\s+Premio/i]);
  const third = fiveDigitsAfterLabel(section.body, [/3(?:er|º)\s+Premio/i, /Tercer\s+Premio/i]);
  if (!first && !second && !third) throw new SyncError("El resultado de Lotería Nacional está incompleto.", "INVALID_LNAC_PAYLOAD");
  const rows = extractPrizeRows(section.body);
  const fraction = labelBullet(section.body, /^\s*FRACCI[ÓO]N\s*$/mi, 1, 999);
  const series = labelBullet(section.body, /^\s*SERIE\s*$/mi, 1, 9999);
  const refundBlock = section.body.split(/Reintegros?/i)[1] || "";
  const refunds = [...new Set([...refundBlock.matchAll(/^\s*[*+-]\s*R?\s*(\d)\s*$/gmi)].map(match => match[1]))].slice(0, 3);
  const prizes: PrizeRow[] = [];
  if (first) prizes.push({ type: "exact", category: "1er Premio", number: first, amount: amountFor(rows, ["1er premio", "1 premio"]) });
  if (second) prizes.push({ type: "exact", category: "2º Premio", number: second, amount: amountFor(rows, ["2o premio", "2 premio"]) });
  if (third) prizes.push({ type: "exact", category: "3er Premio", number: third, amount: amountFor(rows, ["3er premio", "3o premio", "3 premio"]) });
  const refundAmount = amountFor(rows, ["reintegro"]);
  refunds.forEach(value => prizes.push({ type: "refund", category: `Reintegro ${value}`, value, amount: refundAmount }));
  const specialAmount = amountFor(rows, ["premio especial"]);
  if (first && series != null && fraction != null && specialAmount != null) prizes.push({ type: "special", category: "Premio Especial", number: first, series, fraction, amount: specialAmount });
  const draw = await makeDraw("loteria-nacional", section, {
    winningNumbers: [], secondaryNumbers: [], extra: null, complementary: null,
    prizes, jackpotNext: null, jackpotFormatted: "",
  });
  const listUrl = nationalListUrl(section.body);
  const baseMetadata = { nationalCompleteness: "summary", officialListUrl: listUrl || null, firstPrize: first || null, secondPrize: second || null, thirdPrize: third || null, refunds, specialPrize: first && series != null && fraction != null ? { number: first, series, fraction } : null };
  if (!listUrl) return { ...draw, metadata: baseMetadata };
  try {
    const listText = await fetchOfficialList(listUrl);
    const fullPrizes = officialListRules(listText, first, second, third, prizes);
    return {
      ...draw,
      prizes: fullPrizes,
      sourceHash: await sha256(`${draw.sourceHash}:${listText}`),
      metadata: { ...baseMetadata, nationalCompleteness: "full-list", officialListRuleCount: fullPrizes.length },
    };
  } catch (error) {
    return { ...draw, metadata: { ...baseMetadata, officialListError: error instanceof Error ? error.message : String(error) } };
  }
}

async function fetchOfficialSnapshot() {
  const response = await fetch(READER_URL, {
    headers: { accept: "text/plain,text/markdown,*/*", "user-agent": "Primy/15.6 (+https://sueteliquida.vercel.app; official-results-sync)", "x-no-cache": "true" },
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
    official_updated_at: draw.updatedAt, fetched_at: draw.fetchedAt, metadata: draw.metadata || {},
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
    const settled = await Promise.allSettled([parseEuromillones(snapshot), parsePrimitiva(snapshot), parseBonoloto(snapshot), parseGordo(snapshot), parseEurodreams(snapshot), parseNationalLottery(snapshot)]);
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
