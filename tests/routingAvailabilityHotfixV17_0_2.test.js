import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('la preferenza predefinita si applica una sola volta e non riporta Quinigol a Primitiva', () => {
  const controller = read('../src/hooks/useAppController.js');
  assert.match(controller, /defaultGameAppliedRef = useRef\(false\)/);
  assert.match(controller, /if \(defaultGameAppliedRef\.current \|\| !preferences\.defaultGame\) return/);
  assert.match(controller, /\}, \[preferences\.defaultGame\]\);/);
  assert.doesNotMatch(controller, /\[preferences\.defaultGame, generation\.latest, generation\.busy\]/);
  assert.match(controller, /openGenerate = useCallback\(gameId => \{[\s\S]*selectGame\(gameId\)[\s\S]*navigate\('generate'\)/);
});

test('Quinigol mostra il proprio pannello e lo stato reale della giornata', () => {
  const journey = read('../src/components/CreateJourney.jsx');
  const panel = read('../src/components/QuinigolPanel.jsx');
  assert.match(journey, /activeGame === 'quinigol'[\s\S]*<QuinigolPanel/);
  assert.match(panel, /availability\?\.title \|\| 'Composición oficial no disponible'/);
  assert.match(panel, /<RoundHeader round=\{round\} availability=\{availability\}/);
  assert.equal(panel.includes('RoundAvailabilityNotice availability={availability} loading={loading} onRefresh={refresh}'), false);
});

test('i giochi ippici non restano in caricamento quando non esiste una giornata attiva', () => {
  const header = read('../src/components/HorseRoundHeader.jsx');
  const lototurf = read('../src/components/LototurfPanel.jsx');
  const quintuple = read('../src/components/QuintuplePlusPanel.jsx');
  assert.match(header, /availability\?\.title \|\| 'Programa oficial no disponible'/);
  assert.match(header, /loading \? 'Cargando programa oficial'/);
  for (const panel of [lototurf, quintuple]) {
    assert.match(panel, /HorseRoundHeader[^>]*availability=\{availability\}/);
    assert.equal(panel.includes('RoundAvailabilityNotice availability={availability} loading={loading} onRefresh={refresh}'), false);
  }
});

test('la release hotfix è 17.1.1', () => {
  assert.equal(JSON.parse(read('../package.json')).version, '17.1.1');
  assert.match(read('../src/utils/release.js'), /17\.1\.1/);
  assert.match(read('../public/offline.html'), /v17\.1\.1/);
});
