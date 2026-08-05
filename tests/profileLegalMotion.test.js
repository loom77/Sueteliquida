import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('v16.3 conserva iconos gráficos propios para los ocho juegos', () => {
  const theme = read('../src/utils/gameVisualTheme.js');
  for (const game of ['primitiva','bonoloto','euromillones','gordoprimitiva','eurodreams','loteria-nacional','quiniela','quinigol']) {
    assert.match(theme, new RegExp(`/game-icons/${game}\\.png`));
    assert.ok(fs.statSync(new URL(`../public/game-icons/${game}.png`, import.meta.url)).size > 10_000);
  }
  assert.match(read('../src/components/GameIdentity.jsx'), /theme\.icon/);
});

test('el registro pregunta el nombre y el perfil permite modificarlo en Supabase', () => {
  const authScreen = read('../src/components/AuthScreen.jsx');
  const authHook = read('../src/hooks/useAuth.js');
  const settings = read('../src/components/SettingsView.jsx');
  const migration = read('../supabase/migrations/20260801_profile_name_trigger.sql');
  assert.match(authScreen, /¿Cómo te llamas\?/);
  assert.match(authHook, /updateDisplayName/);
  assert.match(authHook, /from\('primy_profiles'\)\.upsert/);
  assert.match(settings, /Guardar nombre/);
  assert.match(settings, /greetingName \? `Hola, \$\{greetingName\}/);
  assert.match(migration, /raw_user_meta_data ->> 'display_name'/);
});

test('las transiciones de vista son dinámicas y respetan movimiento reducido', () => {
  const router = read('../src/hooks/useAppRouter.js');
  const views = read('../src/app/AppViews.jsx');
  const css = read('../src/index.css');
  assert.match(router, /startViewTransition/);
  assert.match(views, /primy-route-scene/);
  assert.match(css, /::view-transition-new\(root\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('la sección legal no promete premios y describe honestamente el almacenamiento', () => {
  const settings = read('../src/components/SettingsView.jsx');
  const terms = read('../public/legal/terms.html');
  const privacy = read('../public/legal/privacy.html');
  assert.match(settings, /no garantiza premios/);
  assert.match(settings, /se almacenan en tu cuenta privada/);
  assert.match(terms, /no predice resultados ni garantiza premios/);
  assert.match(privacy, /no sería correcto afirmar que nunca se guarda ningún dato de jugada/);
});

test('todas las pantallas principales muestran la release 17.1.1', () => {
  assert.match(read('../src/utils/release.js'), /17\.1\.1/);
  assert.match(read('../src/components/AppShell.jsx'), /ReleaseStamp/);
  assert.match(read('../src/components/AuthScreen.jsx'), /ReleaseStamp/);
  assert.equal(JSON.parse(read('../package.json')).version, '17.1.1');
});
