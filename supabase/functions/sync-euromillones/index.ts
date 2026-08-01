import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OFFICIAL_URL = "https://www.loteriasyapuestas.es/es/resultados";
const READER_URL = `https://r.jina.ai/${OFFICIAL_URL}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function normalize(value: string) { return String(value || "").replace(/\u00a0/g, " ").replace(/\r/g, "").replace(/[ \t]+/g, " "); }
function parseAmount(value: string) {
  const number = Number(String(value).replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}
function unique(values: number[], count: number, min: number, max: number) {
  const output: number[] = [];
  const seen = new Set<number>();
  for (const value of values) {
    if (!Number.isInteger(value) || value < min || value > max || seen.has(value)) continue;
    seen.add(value); output.push(value);
    if (output.length === count) break;
  }
  return output;
}
function extractPrizes(body: string) {
  const rows: Array<{ category: string; amount: number; prize: number }> = [];
  for (const line of body.split("\n")) {
    if (!line.includes("|") || !/€/.test(line)) continue;
    const cells = line.split("|").map(value => value.trim()).filter(Boolean);
    if (cells.length < 2 || /categor[ií]as|premios/i.test(cells[0])) continue;
    const amountCell = cells.find(value => /[\d.]+(?:,\d{1,2})?\s*€/.test(value));
    const raw = amountCell?.match(/([\d.]+(?:,\d{1,2})?)\s*€/i)?.[1];
    const amount = raw ? parseAmount(raw) : null;
    if (amount != null) rows.push({ category: cells[0], amount, prize: amount });
  }
  return rows.slice(0, 13);
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
async function fetchSnapshot() {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(READER_URL, {
      headers: { accept: "text/plain,text/markdown,*/*", "user-agent": "Primy/15.4 Euromillones sync", "x-no-cache": "true" },
      signal: AbortSignal.timeout(45000),
    });
    lastStatus = response.status;
    if (response.ok) return normalize(await response.text());
    if (response.status !== 429) break;
    await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(`READER_HTTP_${lastStatus}`);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const markdown = await fetchSnapshot();
    const start = /Euromillones[^\n]*?(\d{2})\/(\d{2})\/(\d{4})[^\n]*?\+\s*Info/i.exec(markdown);
    if (!start || start.index == null) throw new Error("EUROMILLONES_NOT_FOUND");
    const tail = markdown.slice(start.index + start[0].length);
    const end = /La\s+Primitiva[^\n]*?\+\s*Info/i.exec(tail)?.index ?? tail.length;
    const body = tail.slice(0, end);
    const resultBlock = (body.split(/Ver\s+por\s+orden\s+de\s+aparici[oó]n/i)[1] || body).split(/Otros\s+resultados/i)[0];
    const bullets = [...resultBlock.matchAll(/^\s*[*+-]\s*(\d{1,2})\s*$/gm)].map(match => Number(match[1]));
    const winningNumbers = unique(bullets.slice(0, 5), 5, 1, 50).sort((a, b) => a - b);
    const secondaryNumbers = unique(bullets.slice(5).reverse(), 2, 1, 12).sort((a, b) => a - b);
    if (winningNumbers.length !== 5 || secondaryNumbers.length !== 2) throw new Error("INVALID_EUROMILLONES_PAYLOAD");

    const date = `${start[3]}-${start[2]}-${start[1]}`;
    const jackpotMatch = body.match(/Bote\s+publicitado\s*:\s*\|?\s*([\d.]+(?:,\d{1,2})?)\s*€/i);
    const jackpotNext = jackpotMatch ? parseAmount(jackpotMatch[1]) : null;
    const now = new Date().toISOString();
    const row = {
      game_id: "euromillones", draw_date: date, winning_numbers: winningNumbers, secondary_numbers: secondaryNumbers,
      extra: null, complementary: null, prizes: extractPrizes(body), jackpot_next: jackpotNext,
      jackpot_formatted: jackpotMatch ? `${jackpotMatch[1]} €` : null, source: "SELAE oficial mediante caché de lectura",
      source_url: OFFICIAL_URL, source_hash: await hash(start[0] + body), official_updated_at: now, fetched_at: now,
    };
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const response = await fetch(`${supabaseUrl}/rest/v1/primy_draw_results?on_conflict=game_id,draw_date`, {
      method: "POST",
      headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([row]), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`SUPABASE_WRITE_FAILED:${(await response.text()).slice(0, 200)}`);
    return json({ success: true, provider: "SELAE", saved: 1, draw: { gameId: "euromillones", date, winningNumbers, secondaryNumbers }, syncedAt: now });
  } catch (error) {
    return json({ success: false, provider: "SELAE", saved: 0, message: String(error instanceof Error ? error.message : error) }, 502);
  }
});
