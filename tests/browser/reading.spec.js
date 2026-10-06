import { test, expect } from '@playwright/test';
function pdfFixture() {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R 5 0 R 7 0 R] /Count 3 >>'];
  for (let i = 0; i < 3; i++) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 9 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    const stream = `BT /F1 24 Tf 72 700 Td (Reading test page ${i + 1}) Tj ET`;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n', offsets = [0];
  for (let i = 0; i < objects.length; i++) { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('librarian.installDismissed', '1'));
});
test('import, render, bookmark, resume offline, export and organize a PDF', async ({ page, context }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.locator('[data-import]').first().setInputFiles({ name: 'Reading sample.pdf', mimeType: 'application/pdf', buffer: pdfFixture() });
  await expect(page.locator('.pdf-card')).toHaveCount(1);
  await page.locator('.pdf-actions [data-read]').click();
  await expect(page.locator('.pdf-page').first()).toBeVisible();
  await page.locator('[data-page-number]').fill('2');
  await page.locator('[data-page-form] button').click();
  await expect(page.locator('[data-page-number]')).toHaveValue('2');
  await page.locator('[data-bookmark-page]').click();
  await expect(page.locator('[data-bookmark-page]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-reader-close]').click();
  await expect(page.locator('.continue-reading')).toContainText('Page 2 of 3');
  await page.reload();
  await expect(page.locator('.pdf-card')).toHaveCount(1);
  // Bundled app assets remain available, as they do on capacitor://localhost.
  await page.route('https://**', route => route.abort());
  await page.locator('.pdf-actions [data-read]').click();
  await expect(page.locator('[data-page-number]')).toHaveValue('2');
  await expect(page.locator('.pdf-page').first()).toBeVisible();
  await expect(page.locator('[data-bookmark-page]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-dark-toggle]').click();
  await expect(page.locator('#pdf-reader')).toHaveAttribute('data-dark', '1');
  await page.screenshot({ path: `test-results/${info.project.name}-reader.png` });
  await page.locator('[data-reader-close]').click();
  await page.unroute('https://**');
  const download = page.waitForEvent('download');
  await page.locator('[data-download-pdf]').click();
  expect((await download).suggestedFilename()).toBe('Reading sample.pdf');
  await page.locator('[data-finished]').click();
  await page.locator('[data-library-filter="finished"]').click();
  await expect(page.locator('.pdf-card')).toHaveCount(1);
  await page.locator('[data-library-filter="unread"]').click();
  await expect(page.locator('.pdf-card')).toHaveCount(0);
  await page.locator('[data-library-filter="all"]').click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `test-results/${info.project.name}-library.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('discover a full-text book, save it once, and read it offline', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('librarian.offSources', JSON.stringify(['Open Library', 'Google Books', 'OpenAlex', 'Crossref', 'Internet Archive', 'CORE', 'DPLA', 'Europeana', 'K10plus', 'Library of Congress', 'BnF', 'DNB', 'Finna', 'Nasjonalbiblioteket'])));
  await page.route('https://gutendex.com/**', route => route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { results: [{ id: 1342, title: 'Pride and Prejudice', authors: [{ name: 'Austen, Jane' }], languages: ['en'], formats: {}, subjects: ['Fiction'] }] } }));
  await page.route('**/.netlify/functions/book-text?id=1342', route => route.fulfill({ contentType: 'text/plain', body: 'Project Gutenberg\n' + 'Elizabeth opened her book.\n'.repeat(500) }));
  await page.goto('/');
  await page.locator('[data-tab="search"]').first().click();
  await page.locator('[data-form] input').fill('Pride and Prejudice');
  await page.locator('[data-form] button').click();
  await page.locator('[data-select]').first().click();
  await page.locator('[data-read-result]').click();
  await expect(page.locator('.text-page')).toContainText('Project Gutenberg');
  await page.locator('[data-page-step="1"]').click();
  await expect(page.locator('[data-page-number]')).toHaveValue('2');
  await page.locator('[data-reader-close]').click();
  await page.locator('[data-select]').first().click();
  await page.locator('[data-save-pdf]').click();
  await expect(page.locator('.modal')).toContainText('Already in your Library');
  await page.locator('.modal-close').click();
  await page.locator('[data-tab="library"]').click();
  await expect(page.locator('.pdf-card')).toHaveCount(1);
  // Bundled app assets remain available, as they do on capacitor://localhost.
  await page.route('https://**', route => route.abort());
  await page.locator('.pdf-actions [data-read]').click();
  await expect(page.locator('.text-page')).toContainText('Elizabeth');
  await expect(page.locator('[data-page-number]')).toHaveValue('2');
});
