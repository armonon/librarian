import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pdfOptions } from '../src/pdf-options.js';

test('PDF resources remain bundled on desktop, iOS and nested web installs', () => {
  for (const base of ['file:///Applications/Librarian.app/Contents/Resources/app.asar/dist/index.html',
    'capacitor://localhost/index.html', 'https://example.test/library/index.html']) {
    const bytes = new Uint8Array([37, 80, 68, 70]);
    const options = pdfOptions(bytes, base);
    assert.equal(options.data, bytes);
    assert.equal(options.isEvalSupported, false);
    assert.equal(options.enableScripting, false);
    assert.equal(options.enableXfa, false);
    assert.equal(options.wasmUrl, new URL('./pdfjs/wasm/', base).href);
    assert.equal(options.cMapUrl, new URL('./pdfjs/cmaps/', base).href);
    assert.equal(options.standardFontDataUrl, new URL('./pdfjs/standard_fonts/', base).href);
  }
});
