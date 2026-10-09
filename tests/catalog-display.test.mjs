import test from 'node:test';
import assert from 'node:assert/strict';
import { displayRecord, shelfRecord } from '../src/catalog-rights.js';

test('unverified preview bytes and descriptions are discarded without losing discovery or reading actions', () => {
  for (const source of ['Crossref', 'OpenAlex', 'CORE', 'Internet Archive', 'Project Gutenberg', 'K10plus', 'Library of Congress', 'BnF', 'DNB', 'Finna', 'Nasjonalbiblioteket']) {
    const input = { id: 'test:1', title: 'Book', sources: [source], cover: 'https://example.test/cover.jpg', desc: 'Restricted abstract', links: [{ url: 'https://example.test/item', label: source }], downloads: [{ url: 'https://example.test/book.pdf' }] };
    const clean = displayRecord(input, true);
    assert.equal(clean.cover, '');
    assert.ok(!clean.desc.includes('Restricted'));
    assert.equal(clean.previewAtSource, true);
    assert.deepEqual(clean.links, input.links);
    assert.deepEqual(clean.downloads, input.downloads);
    assert.deepEqual(shelfRecord(clean), clean);
  }
});

test('allowed content keeps its own provenance, not another provider’s permissions', () => {
  for (const source of ['DPLA', 'Europeana']) {
    const clean = displayRecord({ id:'x', sources:[source], desc:'Open metadata description', cover:'https://example.test/unknown.jpg' }, true);
    assert.equal(clean.desc, 'Open metadata description');
    assert.equal(clean.cover, '');
    assert.equal(shelfRecord(clean).desc, clean.desc);
  }
  const ol = { id:'ol:x', sources:['Open Library'], cover:'https://covers.openlibrary.org/b/id/123-L.jpg', desc:'2 editions indexed by Open Library.' };
  assert.equal(displayRecord(ol,true).cover,ol.cover);
  for (const cover of ['https://covers.openlibrary.org.evil.test/b/id/123-L.jpg','https://covers.openlibrary.org/unknown.jpg','https://user@covers.openlibrary.org/b/id/123-L.jpg']) assert.equal(displayRecord({...ol,cover},true).cover,'');
  const legacy = shelfRecord({...ol,sources:['Open Library','Crossref'],desc:'Old merged abstract'});
  assert.ok(!legacy.desc.includes('Old merged'));
  assert.equal(legacy.cover,ol.cover);
  const google = {id:'gb:x',sources:['Google Books'],desc:'Original Google text',cover:'https://books.google.com/cover'};
  assert.deepEqual(displayRecord(google,true),google);
  assert.equal(shelfRecord(google).cover,'');
});
