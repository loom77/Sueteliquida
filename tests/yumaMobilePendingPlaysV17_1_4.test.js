import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const playsView = fs.readFileSync(new URL('../src/components/PlaysView.jsx', import.meta.url), 'utf8');
const mobileCss = fs.readFileSync(new URL('../src/mobile-yuma-hotfix.css', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const release = fs.readFileSync(new URL('../src/utils/release.js', import.meta.url), 'utf8');

const pendingStatuses = [
  { id: 'a', computedStatus: 'scheduled', createdAt: '2026-08-05T10:00:00Z' },
  { id: 'b', computedStatus: 'awaiting_check', createdAt: '2026-08-06T10:00:00Z' },
  { id: 'c', computedStatus: 'checked', createdAt: '2026-08-06T11:00:00Z' },
];

test('the pending section renders the complete unresolved set without slicing it', () => {
  assert.match(playsView, /computedStatus === 'scheduled'/);
  assert.match(playsView, /computedStatus === 'awaiting_check'/);
  assert.match(playsView, /pendingPlays\.map\(play/);
  assert.doesNotMatch(playsView, /pendingPlays\.slice\(/);
  const pending = pendingStatuses.filter(play => ['scheduled', 'awaiting_check'].includes(play.computedStatus));
  assert.equal(pending.length, 2);
});

test('pending plays are sorted newest first', () => {
  assert.match(playsView, /sort\(\(a, b\) => playTimestamp\(b\) - playTimestamp\(a\)\)/);
});

test('mobile layout does not clip the pending list', () => {
  assert.match(mobileCss, /\.primy-pending-recent__list/);
  assert.match(mobileCss, /max-height:\s*none\s*!important/);
  assert.match(mobileCss, /overflow:\s*visible\s*!important/);
});

test('Yuma mobile hotfix and release 17.1.4 are wired', () => {
  assert.match(main, /mobile-yuma-hotfix\.css/);
  assert.match(release, /17\.1\.4/);
  assert.match(mobileCss, /\.primy-home-v16__mascot[\s\S]*display:\s*flex\s*!important/);
  assert.match(mobileCss, /\.primy-mobile-nav__icon svg/);
});
