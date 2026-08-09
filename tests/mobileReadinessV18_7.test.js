import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAY_DATA_CONTRACT_VERSION } from '../src/utils/playModel.js';
import {
  MOBILE_PLAY_DATA_CONTRACT_VERSION,
  MOBILE_SUPPORTED_GAMES,
} from '../src/utils/mobileContract.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(here, rel), 'utf8');

test('mobile bridge uses the exact current play data contract', () => {
  assert.equal(MOBILE_PLAY_DATA_CONTRACT_VERSION, PLAY_DATA_CONTRACT_VERSION);
  assert.equal(MOBILE_PLAY_DATA_CONTRACT_VERSION, '18.7.0');
});

test('mobile bridge exposes all ten supported game families', () => {
  assert.deepEqual(MOBILE_SUPPORTED_GAMES, [
    'primitiva','bonoloto','euromillones','gordoprimitiva','eurodreams',
    'loteria-nacional','quiniela','quinigol','lototurf','quintuple-plus',
  ]);
});

test('mobile config explicitly keeps signup Android-only and exact-event verification enabled', () => {
  const api = read('../api/mobile-config.js');
  assert.match(api, /androidSignup:\s*true/);
  assert.match(api, /webSignup:\s*false/);
  assert.match(api, /exactEventVerification:\s*true/);
  assert.match(api, /backgroundVerification:\s*true/);
  assert.match(api, /MOBILE_SUPPORTED_GAMES/);
});

test('mobile config GET returns the compatibility payload', async () => {
  const { default: handler } = await import('../api/mobile-config.js');
  const headers = new Map();
  let statusCode = 200;
  let payload;
  const res = {
    setHeader(name, value) { headers.set(name, value); },
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; return value; },
  };
  await handler({ method: 'GET' }, res);
  assert.equal(statusCode, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.playDataContract, '18.7.0');
  assert.equal(payload.supportedGames.length, 10);
  assert.equal(payload.features.webSignup, false);
  assert.equal(payload.features.androidSignup, true);
});

test('mobile config refuses non-GET methods', async () => {
  const { default: handler } = await import('../api/mobile-config.js');
  let statusCode = 200;
  let payload;
  const res = {
    setHeader() {},
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; return value; },
  };
  await handler({ method: 'POST' }, res);
  assert.equal(statusCode, 405);
  assert.equal(payload.code, 'METHOD_NOT_ALLOWED');
});
