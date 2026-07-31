import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TARGETS = [`${SUPABASE_URL}/functions/v1/sync-selae`, `${SUPABASE_URL}/functions/v1/sync-euromillones`, `${SUPABASE_URL}/functions/v1/sync-loteria-nacional`];

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ success: false, code: "METHOD_NOT_ALLOWED" }), { status: 405, headers: { "content-type": "application/json" } });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return new Response(JSON.stringify({ success: false, code: "SYNC_NOT_CONFIGURED" }), { status: 503, headers: { "content-type": "application/json" } });

  const results = await Promise.all(TARGETS.map(async target => {
    try {
      const response = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ mode: "latest", trigger: "supabase-cron" }),
        signal: AbortSignal.timeout(55000),
      });
      let body: Record<string, unknown>;
      try { body = JSON.parse(await response.text()); } catch { body = { success: false, code: "INVALID_RESPONSE" }; }
      return { target: target.split("/").at(-1), status: response.status, ...body };
    } catch (error) {
      return { target: target.split("/").at(-1), status: 502, success: false, message: String(error instanceof Error ? error.message : error) };
    }
  }));

  const success = results.some(result => result.success);
  return new Response(JSON.stringify({ success, results, syncedAt: new Date().toISOString() }), {
    status: success ? 200 : 502,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
});
