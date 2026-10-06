const { test } = require('node:test');
const assert = require('node:assert/strict');
const { externalURL } = require('../electron/navigation.cjs');

test('book links allow only credential-free HTTP and HTTPS URLs', () => {
  assert.equal(externalURL('https://openlibrary.org/books/OL1M'), 'https://openlibrary.org/books/OL1M');
  for (const value of ['file:///etc/passwd', 'javascript:alert(1)', 'x-apple.systempreferences:foo',
    'https://user:password@example.com', 'data:text/html,hello', 'not a URL']) {
    assert.equal(externalURL(value), null, value);
  }
});
