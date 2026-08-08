import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('release.js exports the label consumed by ReleaseStamp', () => {
  const release = read('../src/utils/release.js');
  const stamp = read('../src/components/ReleaseStamp.jsx');
  assert.match(release, /export const APP_VERSION = '18\.3\.0'/);
  assert.match(release, /export const APP_RELEASE_LABEL = `release v\$\{APP_VERSION\}`/);
  assert.match(stamp, /import \{ APP_RELEASE_LABEL \} from '\.\.\/utils\/release\.js'/);
});

test('package and offline fallback expose the same release', () => {
  const pkg = JSON.parse(read('../package.json'));
  assert.equal(pkg.version, '18.3.0');
  assert.match(read('../public/offline.html'), /release v18\.3\.0/);
});
