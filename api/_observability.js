export function requestId(req) {
  const incoming = String(req.headers?.['x-request-id'] || req.headers?.['x-vercel-id'] || '').trim();
  return incoming.slice(0, 120) || crypto.randomUUID();
}

export function logEvent(level, event, fields = {}) {
  const payload = {
    level,
    event,
    service: 'primy-api',
    at: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function withRequestContext(req, res) {
  const id = requestId(req);
  res.setHeader('X-Request-Id', id);
  return { requestId: id, startedAt: Date.now() };
}

export function finishRequest(context, fields = {}) {
  logEvent('info', 'api_request_complete', {
    requestId: context.requestId,
    durationMs: Date.now() - context.startedAt,
    ...fields,
  });
}
