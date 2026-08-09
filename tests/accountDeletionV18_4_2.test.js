import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('v18.4.3 exposes account deletion without embedding service role in the client', () => {
  const auth = read('../src/hooks/useAuth.js');
  const settings = read('../src/components/SettingsView.jsx');
  const fn = read('../supabase/functions/delete-account/index.ts');
  assert.match(auth, /supabase\.functions\.invoke\('delete-account'/);
  assert.match(settings, /Eliminar mi cuenta/);
  assert.match(fn, /auth\.admin\.deleteUser/);
  assert.match(fn, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(auth, /SUPABASE_SERVICE_ROLE_KEY|service_role/);
});

test('account deletion has a public web path for store-policy disclosure', () => {
  const page = read('../public/legal/account-deletion.html');
  assert.match(page, /Eliminar tu cuenta y tus datos/);
  assert.match(page, /Eliminar mi cuenta/);
});
