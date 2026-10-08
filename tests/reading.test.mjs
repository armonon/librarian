import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { pdfSave, pdfUpdate, pdfLibrary, pdfGet, pdfDel } from '../src/pdf-storage.js';
import { readingPage, libraryItems, readableLink, validatePdf, textPages } from '../src/reading.js';
import handler from '../netlify/functions/book-text.mjs';

test('reading position and bookmarks persist together without altering original bytes', async () => {
  globalThis.indexedDB = new IDBFactory();
  await pdfSave({ id: 'book', title: 'Book' }, new Blob(['%PDF-original']));
  await Promise.all([pdfUpdate('book', { page: 12, totalPages: 80 }), pdfUpdate('book', { bookmarks: [3, 12] })]);
  const [book] = await pdfLibrary();
  assert.equal(book.page, 12);
  assert.deepEqual(book.bookmarks, [3, 12]);
  assert.equal(await (await pdfGet('book')).blob.text(), '%PDF-original');
  await pdfDel('book');
  await assert.rejects(pdfUpdate('book', { page: 15 }), /no longer/);
  assert.deepEqual(await pdfLibrary(), []);
});
test('library filtering, search and sort preserve the original list', () => {
  const items = [{ title: 'Zebra', author: 'Austen', lastReadAt: 10 }, { title: 'Apple', addedAt: 20 }, { title: 'Finished', finished: true }];
  assert.equal(libraryItems(items, 'austen')[0].title, 'Zebra');
  assert.deepEqual(libraryItems(items, '', 'reading').map(x => x.title), ['Zebra']);
  assert.deepEqual(libraryItems(items, '', 'unread').map(x => x.title), ['Apple']);
  assert.deepEqual(libraryItems(items, '', 'finished').map(x => x.title), ['Finished']);
  assert.equal(libraryItems(items, '', 'all', 'title')[0].title, 'Apple');
  assert.equal(items[0].title, 'Zebra');
});
test('reader clamps invalid pages, validates PDF bytes and preserves text', async () => {
  assert.equal(readingPage(-10, 4), 1); assert.equal(readingPage(80, 4), 4);
  assert.equal(readingPage('nope', 4), 1);
  await assert.rejects(validatePdf(new Blob(['<html>login</html>'], { type: 'application/pdf' })), /not a PDF/);
  await validatePdf(new Blob(['%PDF-1.7\nreal header']));
  const text = 'Project Gutenberg\n' + 'A paragraph.\n'.repeat(1000);
  assert.equal(textPages(text).join(''), text + '\n');
});
test('only supported full texts receive in-app reading actions', () => {
  assert.equal(readableLink({ links: [{ url: 'https://example.com/preview', label: 'Preview' }] }), null);
  assert.equal(readableLink({ links: [{ url: 'javascript:alert(1)', label: 'PDF' }] }), null);
  assert.equal(readableLink({ links: [{ url: 'https://example.com/book.pdf' }] }), null);
  assert.equal(readableLink({ links: [{ url: 'https://www.gutenberg.org/ebooks/1342' }] }), null);
});
test('Gutenberg endpoint rejects arbitrary targets and upstream HTML', async () => {
  assert.equal((await handler(new Request('https://app.test/?id=https://example.com'))).status, 400);
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => { assert.equal(url, 'https://www.gutenberg.org/cache/epub/1342/pg1342.txt'); return new Response('<html>Project Gutenberg login</html>'); };
    assert.equal((await handler(new Request('https://app.test/?id=1342'))).status, 502);
    globalThis.fetch = async () => new Response('Project Gutenberg\nA real book');
    assert.equal(await (await handler(new Request('https://app.test/?id=1342'))).text(), 'Project Gutenberg\nA real book');
  } finally { globalThis.fetch = original; }
});
