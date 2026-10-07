import test from 'node:test';
import assert from 'node:assert/strict';
import { readPreference, readList, zoomPreference, writePreference } from '../src/preferences.js';
import { externalURL } from '../src/external-links.js';
import { boundedPdf, MAX_BOOK_BYTES } from '../src/book-download.js';

test('corrupt or denied preferences cannot prevent app launch', () => {
  globalThis.localStorage = { getItem: () => '{broken', setItem: () => { throw new Error('Storage blocked'); } };
  assert.deepEqual(readList('shelf', Boolean), []);
  globalThis.localStorage.getItem = () => '{"unexpected":"object"}';
  assert.deepEqual(readList('shelf', Boolean), []);
  globalThis.localStorage.getItem = () => { throw new Error('Denied'); };
  assert.equal(readPreference('mode', 'default'), 'default');
  assert.equal(writePreference('mode', 1), false);
  for (const value of ['NaN', 'Infinity', '-5', '0']) assert.equal(zoomPreference(value), 1);
});
test('remote book metadata cannot supply script, local-file, or credentialed links', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,test', 'https://name:password@example.com/']) assert.equal(externalURL(url), '');
  assert.equal(externalURL('https://example.com/book'), 'https://example.com/book');
});
test('PDF downloads reject oversized advertised files and preserve valid bytes', async () => {
  await assert.rejects(boundedPdf(new Response('pdf', { headers: { 'content-length': String(MAX_BOOK_BYTES + 1) } })), /75 MB/);
  const content = '%PDF-1.4\noriginal';
  assert.equal(await (await boundedPdf(new Response(content))).text(), content);
});
