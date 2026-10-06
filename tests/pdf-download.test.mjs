import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pdfDownload } from '../src/pdf-download.js';
import { encodePdfRecord, decodePdfRecord } from '../src/pdf-storage.js';

test('PDF storage to download preserves the original bytes', async () => {
  const original = new File(['%PDF-1.4\noriginal bytes\n%%EOF'], 'test.pdf', { type: 'application/pdf' });
  const stored = await encodePdfRecord({ id: 'test', blob: original });
  const result = pdfDownload(decodePdfRecord(stored), 'test.pdf');
  assert.equal(result.name, 'test.pdf');
  assert.deepEqual(await result.blob.arrayBuffer(), await original.arrayBuffer());
});
test('missing PDFs fail visibly and download names cannot contain path separators', () => {
  assert.throws(() => pdfDownload(undefined, 'Missing'), /unavailable/);
  assert.throws(() => pdfDownload({ blob: new Blob([]) }, 'Empty'), /unavailable/);
  assert.equal(pdfDownload({ blob: new Blob(['pdf']) }, '../book\\copy.pdf').name, '.._book_copy.pdf');
});
