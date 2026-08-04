const DEFAULT_SUPABASE_URL = 'https://vmzkhelxehgedorsvchl.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_t4RVGc3ZCYjFNeNG3Bgf-A_EXIBiEst';

function config() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, '');
  const key = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.SUPABASE_PUBLISHABLE_KEY
      || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      || DEFAULT_PUBLISHABLE_KEY,
  ).trim();
  return { url, key, configured: Boolean(url && key) };
}

function rowToEvent(row) {
  if (!row?.game_id || !row?.event_key) return null;
  return {
    gameId: row.game_id,
    family: row.event_family,
    eventKey: row.event_key,
    date: row.event_date,
    roundId: row.round_id || '',
    status: row.status,
    payload: row.payload,
    sourceHash: row.source_hash || '',
    officialUpdatedAt: row.official_updated_at || null,
    fetchedAt: row.fetched_at || null,
    revision: Number(row.revision || 1),
  };
}

async function request(path, { fetchImpl = globalThis.fetch } = {}) {
  const current = config();
  if (!current.configured) return { events: [], unavailable: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetchImpl(`${current.url}/rest/v1/${path}`, {
      headers: {
        apikey: current.key,
        Authorization: `Bearer ${current.key}`,
        Accept: 'application/json',
        Range: '0-199',
        Prefer: 'count=none',
      },
      signal: controller.signal,
    });
    if (!response.ok) return { events: [], unavailable: response.status === 404 || response.status === 400 };
    const rows = await response.json().catch(() => []);
    return { events: Array.isArray(rows) ? rows.map(rowToEvent).filter(Boolean) : [], unavailable: false };
  } catch {
    return { events: [], unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function readVerificationEvents(gameId, { dates = [], roundIds = [], fetchImpl = globalThis.fetch } = {}) {
  const cleanDates = [...new Set(dates.map(value => String(value || '').trim()).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)))];
  const cleanRoundIds = [...new Set(roundIds.map(value => String(value || '').trim().replace(/[\"(),]/g, '')).filter(Boolean))];
  const filters = new URLSearchParams({
    select: '*',
    game_id: `eq.${gameId}`,
    order: 'event_date.asc.nullslast,updated_at.asc',
  });
  const dateFilter = cleanDates.length ? `event_date.in.(${cleanDates.join(',')})` : '';
  const roundFilter = cleanRoundIds.length ? `round_id.in.(${cleanRoundIds.map(value => `"${value}"`).join(',')})` : '';
  if (dateFilter && roundFilter) filters.set('or', `(${dateFilter},${roundFilter})`);
  else if (dateFilter) filters.set('event_date', `in.(${cleanDates.join(',')})`);
  else if (roundFilter) filters.set('round_id', `in.(${cleanRoundIds.map(value => `"${value}"`).join(',')})`);
  else return { events: [], unavailable: false };
  return request(`primy_verification_events?${filters.toString()}`, { fetchImpl });
}

export function verificationEventRepositoryStatus() {
  const current = config();
  return { configured: current.configured, backend: current.configured ? 'supabase-unified-events' : 'fallback' };
}
