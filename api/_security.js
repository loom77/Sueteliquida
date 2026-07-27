export function applyApiSecurity(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Origin-Agent-Cluster', '?1');
}

export function safeQuery(value, max = 256) {
  return typeof value === 'string' && value.length <= max ? value : '';
}

export function clientKey(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

const buckets = new Map();
let operations = 0;

function memoryRateLimit(key, limit, windowMs) {
  const now = Date.now();
  operations += 1;
  if (operations % 100 === 0) {
    for (const [storedKey, entry] of buckets) if (now - entry.start > windowMs * 2) buckets.delete(storedKey);
  }
  const entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

async function upstashRateLimit(key, limit, windowMs) {
  const base = String(process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '');
  if (!base || !token) return null;
  const bucketKey = `primy:rate:${Math.floor(Date.now() / windowMs)}:${key}`;
  try {
    const response = await fetch(`${base}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', bucketKey], ['PEXPIRE', bucketKey, windowMs * 2, 'NX']]),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const count = Number(payload?.[0]?.result);
    return Number.isFinite(count) ? count <= limit : null;
  } catch {
    return null;
  }
}

export async function rateLimit(req, { limit = 30, windowMs = 60000, scope = 'api' } = {}) {
  const key = `${scope}:${clientKey(req)}`;
  const distributed = await upstashRateLimit(key, limit, windowMs);
  return distributed == null ? memoryRateLimit(key, limit, windowMs) : distributed;
}
