import { test, expect } from '@playwright/test';

test('Google Books retains source order and attribution across results, details and shelf', async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('librarian.installDismissed', '1');
    localStorage.setItem('librarian.offSources', JSON.stringify(['Project Gutenberg / Gutendex', 'OpenAlex', 'Crossref', 'Internet Archive', 'CORE', 'DPLA', 'Europeana', 'K10plus', 'Library of Congress', 'BnF', 'DNB', 'Finna', 'Nasjonalbiblioteket']));
  });
  await page.route('https://www.googleapis.com/books/**', route => {
    if (new URL(route.request().url()).pathname.endsWith('/volumes/first')) return route.fulfill({headers:{'access-control-allow-origin':'*'},json:{id:'first',volumeInfo:{title:'Refreshed title',authors:['First Author']}}});
    const firstPage = new URL(route.request().url()).searchParams.get('startIndex') === '0';
    return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { items: firstPage ? [
      { id: 'first', volumeInfo: { title: 'An unexpected discovery', authors: ['First Author'], language: 'en', infoLink: 'https://books.google.com/books?id=first', industryIdentifiers: [{ identifier: '9780140328721' }] } },
      { id: 'second', volumeInfo: { title: 'Exact Query', authors: ['Second Author'], language: 'fr', description: 'Original description', infoLink: 'https://books.google.com/books?id=second' } },
    ] : [] } });
  });
  await page.route('https://openlibrary.org/search.json*', route => route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { docs: new URL(route.request().url()).searchParams.get('offset') === '0' ? [{ key: '/works/OL1W', title: 'Exact Query', author_name: ['Catalog Author'], isbn: ['9780140328721'], language: ['eng'] }] : [] } }));
  await page.goto('/');
  await page.locator('[data-tab="search"]').first().click();
  await page.locator('[data-form] input').fill('Exact Query');
  await page.locator('[data-form] button').click();
  const google = page.getByRole('region', { name: 'Google Books search results' });
  await expect(google.locator('.book-title')).toHaveText(['An unexpected discovery', 'Exact Query']);
  await expect(page.getByRole('region', { name: 'Other book catalogs' }).locator('.book')).toHaveCount(1);
  await expect(google.getByRole('img', { name: 'Powered by Google' })).toBeVisible();
  await expect(google.locator('.google-attribution')).toHaveJSProperty('naturalWidth', 62);
  await expect(google.locator('.google-source-link').first()).toHaveAttribute('href', 'https://books.google.com/books?id=first');
  await page.locator('[data-filter="availability"]').selectOption('free');
  await expect(google.locator('.book-title')).toHaveText(['An unexpected discovery', 'Exact Query']);
  await page.locator('[data-filter="availability"]').selectOption('all');
  await page.screenshot({ path: `test-results/${info.project.name}-google-results.png`, fullPage: true });
  await google.locator('[data-select="gb:first"]').click();
  await expect(page.getByRole('dialog').getByRole('img', { name: 'Powered by Google' })).toBeVisible();
  await expect(page.getByRole('dialog')).not.toContainText('undefined%');
  await page.getByRole('dialog').locator('[data-save]').click();
  await page.locator('.modal-close').click();
  await page.locator('[data-tab="profile"]').first().click();
  await expect(page.locator('.saved')).toHaveCount(1);
  await expect(page.locator('.saved').getByRole('img', { name: 'Powered by Google' })).toBeVisible();
  await expect(page.locator('.saved .google-source-link')).toHaveAttribute('href', 'https://books.google.com/books?id=first');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('librarian.saved.v1'))[0]);
  expect(stored.title).toBe('Saved Google Books link');
  expect(stored.authors).toEqual([]);
  expect(stored.cover).toBe('');
  await page.reload();
  await page.locator('[data-tab="profile"]').first().click();
  await expect(page.locator('.saved')).toHaveCount(1);
  await expect(page.locator('.saved')).toContainText('Refreshed title');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${info.project.name}-google-attribution.png`, fullPage: true });
});


test('legacy Google shelf metadata is replaced with references, including offline', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('librarian.installDismissed', '1');
    localStorage.setItem('librarian.saved.v1', JSON.stringify([{id:'gb:legacy',title:'Old cached title',authors:['Cached author'],desc:'Cached description',cover:'https://images.example/old.jpg',sources:['Google Books']} ]));
  });
  await page.route('https://**', route => route.abort());
  await page.goto('/');
  await page.locator('[data-tab="profile"]').first().click();
  await expect(page.locator('.saved')).toContainText('Saved Google Books link');
  const saved = await page.evaluate(() => localStorage.getItem('librarian.saved.v1'));
  expect(saved).not.toContain('Old cached title');
  expect(saved).not.toContain('Cached author');
  expect(saved).not.toContain('old.jpg');
  await expect(page.locator('.saved .google-source-link')).toHaveAttribute('href','https://books.google.com/books?id=legacy');
});
