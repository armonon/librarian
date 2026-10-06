import assert from 'node:assert/strict';
import test from 'node:test';
import { decodePdfRecord, encodePdfRecord } from '../src/pdf-storage.js';

test('new PDF records persist bytes rather than temporary file-backed Blobs', async () => {
  const blob = new Blob(['%PDF-test\n'], { type: 'application/pdf' });
  const record = await encodePdfRecord({ id: 'one', blob });
  assert.equal(record.id, 'one');
  assert.equal(record.blob, undefined);
  assert.ok(record.bytes instanceof ArrayBuffer);
  const restored = decodePdfRecord(record);
  assert.equal(restored.id, 'one');
  assert.equal(restored.blob.type, blob.type);
  assert.equal(await restored.blob.text(), await blob.text());
});

test('existing Blob records remain readable without rewriting or deleting them', async () => {
  const record = { id: 'legacy', blob: new Blob(['old PDF']) };
  assert.equal(decodePdfRecord(record), record);
  assert.equal(await decodePdfRecord(record).blob.text(), 'old PDF');
  assert.equal(decodePdfRecord(undefined), undefined);
});

test('invalid records are rejected rather than exposed as empty PDFs', async () => {
  await assert.rejects(encodePdfRecord({ id: 'bad', blob: 'not a PDF blob' }), TypeError);
  assert.throws(() => decodePdfRecord({ id: 'bad', bytes: 'broken' }), TypeError);
});
