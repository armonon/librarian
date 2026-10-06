import assert from 'node:assert/strict';
import test from 'node:test';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { pdfSave, pdfLibrary, pdfGet, pdfPut, pdfDel } from '../src/pdf-storage.js';

test('PDF bytes and metadata survive reopening without localStorage', async () => {
  globalThis.indexedDB = new IDBFactory();
  await pdfLibrary();
  const metadata = { id: 'one', title: 'Original', addedAt: 1 };
  await pdfSave(metadata, new Blob(['original PDF']));
  assert.deepEqual(await pdfLibrary(), [metadata]);
  assert.equal(await (await pdfGet('one')).blob.text(), 'original PDF');
  await pdfDel('one');
  assert.deepEqual(await pdfLibrary(), []);
  assert.equal(await pdfGet('one'), undefined);
});

test('metadata failure rolls back PDF bytes and preserves the previous library', async () => {
  globalThis.indexedDB = new IDBFactory();
  await pdfLibrary();
  await pdfSave({ id: 'old', title: 'Old', addedAt: 1 }, new Blob(['old']));
  const original = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === 'library') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, value, ...args);
    };
    await assert.rejects(pdfSave({ id: 'new', title: 'New' }, new Blob(['new'])), { name: 'QuotaExceededError' });
  } finally { IDBObjectStore.prototype.put = original; }
  assert.equal(await pdfGet('new'), undefined);
  assert.deepEqual((await pdfLibrary()).map(x => x.id), ['old']);
});

test('legacy migration preserves originals and deleted entries do not resurrect', async () => {
  globalThis.indexedDB = new IDBFactory();
  await pdfPut({ id: 'legacy', blob: new Blob(['legacy PDF']) });
  const legacy = [{ id: 'legacy', title: 'Legacy' }, { id: 'missing', title: 'Missing' }];
  assert.deepEqual(await pdfLibrary(legacy), [legacy[0]]);
  await pdfDel('legacy');
  assert.deepEqual(await pdfLibrary(legacy), []);
});
