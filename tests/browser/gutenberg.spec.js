import { test, expect } from '@playwright/test';
import { parseGutenbergCatalog } from '../../src/gutenberg-catalog.js';

test('official Gutenberg feed produces readable editions and rejects navigation or foreign IDs', async ({ page }) => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
    <entry><id>https://www.gutenberg.org/ebooks/authors/search.opds/?query=austen</id><title>Authors</title></entry>
    <entry><id>https://www.gutenberg.org/ebooks/1342.opds</id><title>Pride &amp; Prejudice</title><content type="text">Jane Austen</content></entry>
    <entry><id>https://evil.example/ebooks/999.opds</id><title>Foreign</title></entry>
    <entry><id>https://www.gutenberg.org/ebooks/999.opds</id></entry>
  </feed>`;
  const books = await page.evaluate(`(${parseGutenbergCatalog.toString()})(${JSON.stringify(xml)})`);
  expect(books).toHaveLength(1);
  expect(books[0]).toMatchObject({ id: 'pg:1342', title: 'Pride & Prejudice', authors: ['Jane Austen'], links: [{ label: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/1342' }] });
  for (const invalid of ['<feed>', '<html>Service unavailable</html>', '<feed xmlns="https://wrong.example"/>']) {
    await expect(page.evaluate(`(${parseGutenbergCatalog.toString()})(${JSON.stringify(invalid)})`)).rejects.toThrow('Invalid Gutenberg');
  }
});
