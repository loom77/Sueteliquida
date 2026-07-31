import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OFFICIAL_URL = "https://www.loteriasyapuestas.es/es/resultados";
const READER_URL = `https://r.jina.ai/${OFFICIAL_URL}`;

type Prize = { category: string; amount: number | null; type: string; number?: string; value?: string; digits?: number; series?: number; fraction?: number };

class SyncError extends Error {
  constructor(message: string, public code = "SYNC_ERROR", public status = 502) { super(message); }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function clean(value: string) { return String(value || "").replace(/\u00a0/g, " ").replace(/\r/g, "").replace(/[ \t]+/g, " "); }
function iso(value: string) { const match = String(value).match(/(\d{2})\/(\d{2})\/(\d{4})/); return match ? `${match[3]}-${match[2]}-${match[1]}` : ""; }
function amount(value: string) { const parsed = Number(String(value).replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")); return Number.isFinite(parsed) ? parsed : null; }
function perDecimo(value: string) { const parsed = amount(value); return parsed == null ? null : parsed / 10; }
function bullets(value: string) { return [...String(value).matchAll(/^\s*[*+-]\s*(?:R\s*)?(\d{1,5})\s*$/gmi)].map(match => match[1]); }
async function hash(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join(""); }

function section(markdown: string) {
  const match = /Loter[ií]a\s+Nacional[^\n]*?(\d{2}\/\d{2}\/\d{4})[^\n]*?\+\s*Info/i.exec(markdown);
  if (!match?.index) return null;
  const tail = markdown.slice(match.index + match[0].length);
  const end = [/La\s+Quiniela[^\n]*?\+\s*Info/i, /Quinigol[^\n]*?\+\s*Info/i]
    .map(pattern => pattern.exec(tail)?.index).filter((value): value is number => value != null)
    .reduce((best, value) => Math.min(best, value), tail.length);
  return { date: iso(match[1]), header: match[0], body: tail.slice(0, end) };
}

function fiveAfter(body: string, pattern: RegExp) {
  const match = pattern.exec(body);
  if (!match?.index) return "";
  return body.slice(match.index + match[0].length, match.index + match[0].length + 180).match(/\b(\d{5})\b/)?.[1] || "";
}

function tableRows(body: string) {
  const rows: { category: string; amount: number }[] = [];
  for (const line of body.split("\n")) {
    if (!line.includes("|") || !/€/.test(line)) continue;
    const cells = line.split("|").map(value => value.trim()).filter(Boolean);
    const raw = cells.find(value => /[\d.]+(?:,\d{1,2})?\s*€/.test(value))?.match(/([\d.]+(?:,\d{1,2})?)\s*€/)?.[1];
    const parsed = raw ? amount(raw) : null;
    if (cells[0] && parsed != null && !/categor[ií]as/i.test(cells[0])) rows.push({ category: cells[0], amount: parsed });
  }
  return rows;
}

function amountFor(rows: { category: string; amount: number }[], terms: string[]) {
  for (const row of rows) {
    const label = row.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (terms.some(term => label.includes(term))) return row.amount;
  }
  return null;
}

function listUrl(body: string) { return body.match(/\[[^\]]*Listado\s+de\s+premios[^\]]*\]\((https?:\/\/[^)]+\.pdf(?:\?[^)]*)?)\)/i)?.[1] || ""; }
function tokens(value: string, min: number, max = min) { return (String(value).match(/\b\d{1,5}\b/g) || []).filter(item => item.length >= min && item.length <= max); }

function fullRules(text: string, first: string, second: string, third: string, summary: Prize[]) {
  const source = clean(text);
  if (!/LISTA\s+OFICIAL|INSTRUCCIONES\s+PARA\s+LA\s+CONSULTA|Euros\/Billete/i.test(source)) throw new SyncError("Listado oficial no interpretable.", "INVALID_OFFICIAL_LIST");
  const prizes: Prize[] = [];
  const principals = [first, second, third].filter(Boolean);
  const principalAmounts = [...source.matchAll(/1\s+Premio\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros\s+para\s+el\s+billete\s+n[uú]mero/gi)].map(match => perDecimo(match[1]));
  principals.forEach((number, index) => {
    const existing = summary.find(item => item.type === "exact" && item.number === number);
    prizes.push({ type: "exact", category: existing?.category || (index === 0 ? "1er Premio" : index === 1 ? "2º Premio" : "3er Premio"), number, amount: existing?.amount ?? principalAmounts[index] ?? null });
  });
  prizes.push(...summary.filter(item => item.type === "special"));

  const approximations = [...source.matchAll(/Aproximaciones?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros/gi)].map(match => perDecimo(match[1]));
  approximations.slice(0, principals.length).forEach((value, index) => prizes.push({ type: "approximation", category: `Aproximación al ${index === 0 ? "1er" : index === 1 ? "2º" : "3er"} Premio`, number: principals[index], amount: value }));

  let match: RegExpExecArray | null;
  const hundreds = /Centenas?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]{0,220}?n[uú]meros?\s+(\d{3})00\s+al\s+\2(?:99|99,)/gi;
  while ((match = hundreds.exec(source))) prizes.push({ type: "hundred", category: `Centena ${match[2]}`, value: match[2], amount: perDecimo(match[1]) });

  const extraction = /(\d[\d.]*)\s+Premios?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]*?terminados\s+en\s*:\s*([\s\S]{0,500}?)(?=\n\s*\d[\d.]*\s+Premios?|\n\s*Esta\s+lista|\n\s*\d+\s+Premio\s+de|$)/gi;
  while ((match = extraction.exec(source))) for (const value of tokens(match[3], 2, 4)) prizes.push({ type: "ending", category: `Terminación de ${value.length} cifras (${value})`, value, digits: value.length, amount: perDecimo(match[2]) });

  const firstEndings = /(\d[\d.]*)\s+Premios?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]*?terminados\s+como\s+el\s+primer\s+premio\s+en[^0-9]{0,160}(\d{1,4})/gi;
  while ((match = firstEndings.exec(source))) prizes.push({ type: "ending", category: `Terminación del 1er premio (${match[3]})`, value: match[3], digits: match[3].length, amount: perDecimo(match[2]) });

  const refunds = /Reintegros?\s+de\s+([\d.]+(?:,\d{1,2})?)\s+euros[^\n]{0,220}?(?:sea|en)[^0-9]{0,80}(\d)\b/gi;
  while ((match = refunds.exec(source))) prizes.push({ type: "refund", category: `Reintegro ${match[2]}`, value: match[2], amount: perDecimo(match[1]) });
  return prizes;
}

async function fetchText(url: string, timeout = 45000) {
  const response = await fetch(url, { headers: { accept: "text/plain,text/markdown,*/*", "user-agent": "Primy/15.6 (+https://sueteliquida.vercel.app; national-sync)", "x-no-cache": "true" }, signal: AbortSignal.timeout(timeout), redirect: "follow" });
  if (!response.ok) throw new SyncError(`Fuente HTTP ${response.status}`, "SOURCE_REJECTED", response.status === 429 ? 429 : 502);
  const text = clean(await response.text());
  if (text.length < 300) throw new SyncError("Fuente incompleta.", "SOURCE_INVALID");
  return text;
}

async function save(draw: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new SyncError("Supabase no configurado.", "SUPABASE_NOT_CONFIGURED", 500);
  const response = await fetch(`${url}/rest/v1/primy_draw_results?on_conflict=game_id,draw_date`, { method: "POST", headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([draw]), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new SyncError(`Supabase: ${(await response.text()).slice(0, 200)}`, "SUPABASE_WRITE_FAILED");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const markdown = await fetchText(READER_URL);
    const current = section(markdown);
    if (!current?.date) throw new SyncError("No se encontró Lotería Nacional.", "LNAC_NOT_FOUND", 404);
    const first = fiveAfter(current.body, /1(?:er|º)\s+Premio/i);
    const second = fiveAfter(current.body, /2(?:º|o)\s+Premio/i);
    const third = fiveAfter(current.body, /3(?:er|º)\s+Premio/i);
    if (!first && !second && !third) throw new SyncError("Resultado incompleto.", "INVALID_LNAC_RESULT");
    const rows = tableRows(current.body);
    const refundValues = [...new Set(bullets((current.body.split(/Reintegros?/i)[1] || "")).filter(value => /^\d$/.test(value)))].slice(0, 3);
    const fraction = Number((current.body.match(/FRACCI[ÓO]N[\s\S]{0,80}?[+*-]\s*(\d+)/i)?.[1])) || null;
    const series = Number((current.body.match(/SERIE[\s\S]{0,80}?[+*-]\s*(\d+)/i)?.[1])) || null;
    const summary: Prize[] = [];
    if (first) summary.push({ type: "exact", category: "1er Premio", number: first, amount: amountFor(rows, ["1er premio", "1 premio"]) });
    if (second) summary.push({ type: "exact", category: "2º Premio", number: second, amount: amountFor(rows, ["2o premio", "2 premio"]) });
    if (third) summary.push({ type: "exact", category: "3er Premio", number: third, amount: amountFor(rows, ["3er premio", "3o premio", "3 premio"]) });
    const refundAmount = amountFor(rows, ["reintegro"]);
    refundValues.forEach(value => summary.push({ type: "refund", category: `Reintegro ${value}`, value, amount: refundAmount }));
    const specialAmount = amountFor(rows, ["premio especial"]);
    if (first && series && fraction && specialAmount != null) summary.push({ type: "special", category: "Premio Especial", number: first, series, fraction, amount: specialAmount });

    const pdfUrl = listUrl(current.body);
    let prizes = summary;
    let completeness = "summary";
    let listError = "";
    let listText = "";
    if (pdfUrl) {
      try { listText = await fetchText(`https://r.jina.ai/${pdfUrl}`); prizes = fullRules(listText, first, second, third, summary); completeness = "full-list"; }
      catch (error) { listError = error instanceof Error ? error.message : String(error); }
    }
    const now = new Date().toISOString();
    const metadata = { nationalCompleteness: completeness, officialListUrl: pdfUrl || null, officialListRuleCount: prizes.length, officialListError: listError || null, firstPrize: first || null, secondPrize: second || null, thirdPrize: third || null, refunds: refundValues, specialPrize: first && series && fraction ? { number: first, series, fraction } : null };
    const sourceHash = await hash(`${current.header}:${current.body}:${listText}`);
    await save({ game_id: "loteria-nacional", draw_date: current.date, winning_numbers: [], secondary_numbers: [], extra: null, complementary: null, prizes, jackpot_next: null, jackpot_formatted: null, source: "SELAE oficial mediante caché de lectura", source_url: pdfUrl || OFFICIAL_URL, source_hash: sourceHash, official_updated_at: now, fetched_at: now, metadata });
    return json({ success: true, provider: "SELAE", gameId: "loteria-nacional", date: current.date, completeness, prizeRules: prizes.length, officialListUrl: pdfUrl || null, syncedAt: now });
  } catch (error) {
    const known = error instanceof SyncError;
    return json({ success: false, provider: "SELAE", gameId: "loteria-nacional", code: known ? error.code : "UNKNOWN", message: error instanceof Error ? error.message : String(error) }, known ? error.status : 502);
  }
});
