import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const authScreen = fs.readFileSync(new URL('../src/components/AuthScreen.jsx', import.meta.url), 'utf8');
const authHook = fs.readFileSync(new URL('../src/hooks/useAuth.js', import.meta.url), 'utf8');

test('v18.4.3 web keeps login and password recovery but removes public account creation', () => {
  assert.match(authScreen, /Registro web temporalmente cerrado/);
  assert.match(authScreen, /Iniciar sesión/);
  assert.match(authScreen, /He olvidado mi contraseña/);
  assert.doesNotMatch(authScreen, /auth\.signUp/);
  assert.doesNotMatch(authScreen, />Crear cuenta</);
  assert.doesNotMatch(authHook, /supabase\.auth\.signUp/);
  assert.doesNotMatch(authHook, /\bsignUp,\s*$/m);
  assert.match(authHook, /VITE_WEB_TEST_EMAIL/);
  assert.match(authHook, /acceso web está reservado a la cuenta de pruebas autorizada/);
});
