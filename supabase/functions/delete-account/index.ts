import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: cors });
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return new Response(JSON.stringify({ success: false, code: 'ACCOUNT_DELETE_NOT_CONFIGURED' }), { status: 503, headers: cors });

  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return new Response(JSON.stringify({ success: false, code: 'UNAUTHORIZED' }), { status: 401, headers: cors });

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return new Response(JSON.stringify({ success: false, code: 'INVALID_SESSION' }), { status: 401, headers: cors });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.deleteUser(userData.user.id);
  if (error) return new Response(JSON.stringify({ success: false, code: 'DELETE_FAILED', message: error.message }), { status: 500, headers: cors });
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: cors });
});
