import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('the recovery hotfix increments the app without changing the mobile data contract', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '18.7.1');
  assert.match(read('../src/utils/release.js'), /APP_VERSION = '18\.7\.1'/);
  assert.match(read('../src/utils/mobileContract.js'), /MOBILE_PLAY_DATA_CONTRACT_VERSION = '18\.7\.0'/);
});

test('the PWA updates before authentication can block the app', () => {
  const app = read('../src/App.jsx');
  const controller = read('../src/hooks/useAppController.js');
  assert.match(app, /usePwaUpdate\(\);[\s\S]*const auth = useAuth\(\);/);
  assert.doesNotMatch(controller, /usePwaUpdate/);
});

test('the service worker activates and controls clients automatically', () => {
  const config = read('../vite.config.js');
  assert.match(config, /registerType:\s*'autoUpdate'/);
  assert.match(config, /skipWaiting:\s*true/);
  assert.match(config, /clientsClaim:\s*true/);
  assert.match(config, /cleanupOutdatedCaches:\s*true/);
});

test('session recovery cannot leave the loading screen indefinitely', () => {
  const auth = read('../src/hooks/useAuth.js');
  const screen = read('../src/components/AuthScreen.jsx');
  assert.match(auth, /AUTH_BOOTSTRAP_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(auth, /Promise\.race\(\[supabase\.auth\.getSession\(\), bootstrapTimeout\]\)/);
  assert.match(auth, /setLoading\(false\)/);
  assert.match(screen, /auth\.notice/);
});
