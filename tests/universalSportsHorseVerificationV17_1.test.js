import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('la release universal es 17.1.4', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '17.1.4');
  assert.match(read('../src/utils/release.js'), /APP_VERSION = '17\.1\.4'/);
});

test('el archivo muestra un reveal accesible para deportes e hípica', () => {
  const component = read('../src/components/VerificationReveal.jsx');
  const history = read('../src/components/TicketHistory.jsx');
  const css = read('../src/index.css');
  assert.match(component, /SportsVerificationReveal/);
  assert.match(component, /HorseVerificationReveal/);
  assert.match(component, /Comprobación oficial/);
  assert.match(history, /Categoría confirmada/);
  assert.match(history, /Importe pendiente/);
  assert.match(css, /primy-verification-reveal__row\.is-hit/);
  assert.match(css, /prefers-reduced-motion/);
});

test('los sincronizadores Fast incluyen resultados y escrutinio', () => {
  const sports = read('../supabase/functions/sync-sports-rounds/index.ts');
  const horse = read('../supabase/functions/sync-horse-rounds/index.ts');
  const orchestrator = read('../supabase/functions/scheduled-sync-all-results/index.ts');
  assert.match(sports, /sports-checker-v9/);
  assert.match(sports, /parseResultMatches/);
  assert.match(sports, /parsePrizeCategories/);
  assert.match(sports, /scrutinyComplete/);
  assert.match(horse, /horse-reader-v3/);
  assert.match(horse, /syncPublishedResults/);
  assert.match(horse, /parseHorseResult/);
  assert.match(orchestrator, /id: "sports"[\s\S]*everyMinutes: 1/);
  assert.match(orchestrator, /id: "horse"[\s\S]*everyMinutes: 5/);
});
