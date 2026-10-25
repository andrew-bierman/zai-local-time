import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../dist/zai-local-time.user.js', import.meta.url), 'utf8');
process.env.TZ = 'America/Denver';
const windows = [];
afterEach(() => windows.splice(0).forEach(window => window.close()));
const annotation = '[data-zai-local-time]';
const settle = () => new Promise(resolve => setTimeout(resolve, 30));

function page(html, now = '2026-10-24T03:00:00Z', path = '/manage-apikey/coding-plan/personal/usage') {
  const dom = new JSDOM(html, { url: `https://z.ai${path}`, runScripts: 'outside-only' });
  windows.push(dom.window);
  dom.window.Date.now = () => Date.parse(now);
  dom.window.eval(script);
  return dom.window.document;
}

test('artifact starts with installable userscript metadata', () => {
  assert.ok(script.startsWith('// ==UserScript=='));
  assert.match(script, /@match\s+https:\/\/z\.ai\/\*/);
  assert.match(script, /@grant\s+none/);
});

test('adds local date and zone while preserving source nodes and refresh time', () => {
  const doc = page('<div id="reset">Reset Time: <b>2026-10-24 12:15</b></div><div>Last refresh time: 2026-10-24 12:15</div>');
  const source = doc.querySelector('b').firstChild;
  assert.equal(source.nodeValue, '2026-10-24 12:15');
  assert.equal(doc.querySelectorAll(annotation).length, 1);
  assert.match(doc.querySelector(annotation).textContent, /Oct 23.*10:15.*PM.*MDT/);
  assert.match(doc.querySelector(annotation).title, /UTC\+8/);
  assert.equal(doc.querySelector('b').firstChild, source);
});

test('handles time-only Singapore midnight rollover and local year rollover', () => {
  const doc = page('<p>Reset Time: 00:15</p>', '2026-12-31T15:59:00Z');
  assert.match(doc.querySelector(annotation).textContent, /Dec 31, 2026.*9:15.*AM.*MST/);
});

test('uses the local DST offset at the reset date', () => {
  const doc = page('<p>Reset Time: 2026-11-01 16:00</p>');
  assert.match(doc.querySelector(annotation).textContent, /Nov 1.*1:00.*AM.*MST/);
});

test('ignores invalid dates, unsupported formats and unrelated/editable dates', () => {
  const doc = page('<p>Reset Time: 2026-02-30 12:00</p><p>Reset Time: 25:00</p><p>Reset Time: 2026-10-24 12:00:99</p><p>Reset Time: 10-24 12:00</p><p>Created: 2026-10-24 12:00</p><div contenteditable="">Reset Time: 12:00</div><textarea>Reset Time: 12:00</textarea><p>Reset Time: 2026-10-24 12:00Z</p>');
  assert.equal(doc.querySelectorAll(annotation).length, 0);
});

test('tracks async insertion, updates, invalidation and removal without duplicates', async () => {
  const doc = page('<main></main>');
  const row = doc.createElement('p');
  row.textContent = 'Reset Time: 12:15';
  doc.querySelector('main').append(row);
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 1);
  const source = row.firstChild;
  source.nodeValue = 'Reset Time: 13:15';
  await settle();
  assert.match(row.querySelector(annotation).textContent, /11:15/);
  doc.body.setAttribute('data-unrelated', '1');
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 1);
  source.nodeValue = 'Loading…';
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 0);
  row.textContent = 'Reset Time: 14:15';
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 1);
  row.remove();
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 0);
});

test('leaves other z.ai routes alone and activates after SPA navigation', async () => {
  const doc = page('<p>Reset Time: 12:15</p>', undefined, '/chat');
  assert.equal(doc.querySelectorAll(annotation).length, 0);
  doc.defaultView.history.pushState({}, '', '/manage-apikey/coding-plan/personal/usage');
  doc.body.append(doc.createElement('div'));
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 1);
});

test('annotation text does not affect reset-label detection on later scans', async () => {
  const doc = page(`<p><span>Reset Time: ${' '.repeat(110)}</span><b>2026-10-24 12:15</b></p>`);
  assert.equal(doc.querySelectorAll(annotation).length, 1);
  doc.body.append(doc.createElement('div'));
  await settle();
  assert.equal(doc.querySelectorAll(annotation).length, 1);
});
