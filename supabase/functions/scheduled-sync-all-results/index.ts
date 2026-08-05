import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const targets = [
  { id: "numbers", url: `${SUPABASE_URL}/functions/v1/scheduled-sync-selae`, auth: false, everyMinutes: 1 },
  { id: "loteria-nacional", url: `${SUPABASE_URL}/functions/v1/sync-loteria-nacional`, auth: true, everyMinutes: 1 },
  { id: "sports", url: `${SUPABASE_URL}/functions/v1/sync-sports-rounds`, auth: true, everyMinutes: 5 },
  { id: "horse", url: `${SUPABASE_URL}/functions/v1/sync-horse-rounds`, auth: true, everyMinutes: 15 },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ success: false, code: "METHOD_NOT_ALLOWED" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ success: false, code: "SYNC_NOT_CONFIGURED" }, 503);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const trigger = String(body.trigger || "supabase-fast-cron").slice(0, 80);
  const forceAll = body.forceAll === true || trigger.startsWith("manual-");
  const now = new Date();
  const startedAt = now.toISOString();
  const minute = now.getUTCMinutes();
  const activeTargets = targets.filter(target => forceAll || target.everyMinutes <= 1 || minute % target.everyMinutes === 0);
  const skippedTargets = targets
    .filter(target => !activeTargets.includes(target))
    .map(target => ({ id: target.id, ok: true, skipped: true, status: 204, durationMs: 0, cadenceMinutes: target.everyMinutes }));

  const executedResults = await Promise.all(activeTargets.map(async target => {
    const started = Date.now();
    try {
      const response = await fetch(target.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(target.auth ? { authorization: `Bearer ${SERVICE_ROLE_KEY}` } : {}),
        },
        body: JSON.stringify({ mode: "latest", trigger }),
        signal: AbortSignal.timeout(target.id === "horse" ? 80000 : 55000),
      });
      const text = await response.text();
      let payload: Record<string, unknown> = {};
      try { payload = text ? JSON.parse(text) : {}; } catch { payload = { code: "INVALID_RESPONSE", preview: text.slice(0, 180) }; }
      return { id: target.id, ok: response.ok, status: response.status, durationMs: Date.now() - started, ...payload };
    } catch (error) {
      return { id: target.id, ok: false, status: 502, durationMs: Date.now() - started, code: "TARGET_FAILED", message: String(error instanceof Error ? error.message : error).slice(0, 240) };
    }
  }));

  const results = [...executedResults, ...skippedTargets];
  const failures = executedResults.filter(result => !(result.ok || result.success));
  const successes = executedResults.length - failures.length;
  return json({
    success: successes > 0,
    complete: failures.length === 0,
    trigger,
    forceAll,
    startedAt,
    finishedAt: new Date().toISOString(),
    results,
  }, successes > 0 ? (failures.length === 0 ? 200 : 207) : 502);
});
