import { test, expect } from '@playwright/test';

test('source-only previews never load, including merged results and legacy shelf entries', async ({ page }, info) => {
  const imageRequests = [];
  const coreRequests = [];
  await page.addInitScript(() => {
    localStorage.setItem('librarian.installDismissed','1');
    localStorage.setItem('librarian.offSources',JSON.stringify(['Google Books','Project Gutenberg / Gutendex','OpenAlex','Internet Archive','K10plus','Library of Congress','BnF','DNB','Finna','Nasjonalbiblioteket','Europeana']));
    localStorage.setItem('librarian.saved.v1',JSON.stringify([{id:'cr:legacy',title:'Legacy book',authors:['An Author'],sources:['Crossref','Open Library'],desc:'UNVERIFIED LEGACY DESCRIPTION',cover:'https://unverified.example/legacy.jpg',links:[{label:'Publisher',url:'https://publisher.example/legacy'}]}]));
  });
  await page.route('https://unverified.example/**',route=>{imageRequests.push(route.request().url());return route.abort();});
  await page.route('https://openlibrary.org/search.json*',route=>route.fulfill({headers:{'access-control-allow-origin':'*'},json:{docs:new URL(route.request().url()).searchParams.get('offset')==='0'?[{key:'/works/OL1W',title:'Merged book',author_name:['An Author'],isbn:['9780140328721']}]:[]}}));
  await page.route('https://api.crossref.org/**',route=>route.fulfill({headers:{'access-control-allow-origin':'*'},json:{message:{items:[{DOI:'10.1234/book',title:['Merged book'],author:[{given:'An',family:'Author'}],ISBN:['9780140328721'],abstract:'UNVERIFIED SEARCH ABSTRACT'}]}}}));
  await page.route('**/.netlify/functions/proxy?*',route=>{
    const api=new URL(route.request().url()).searchParams.get('api');
    if(api==='core')coreRequests.push(route.request().url());
    return route.fulfill({json:api==='dpla'?{docs:[{id:'item',object:'https://unverified.example/new.jpg',sourceResource:{title:'Archive book',description:'Licensed DPLA metadata'},isShownAt:'https://publisher.example/archive'}]}:{}});
  });
  await page.goto('/');
  await page.locator('[data-tab="profile"]').first().click();
  await page.locator('[data-select="cr:legacy"]').click();
  await expect(page.getByRole('dialog')).not.toContainText('UNVERIFIED');
  await expect(page.getByRole('dialog').getByRole('link',{name:'Publisher'})).toHaveAttribute('href','https://publisher.example/legacy');
  expect(await page.evaluate(()=>localStorage.getItem('librarian.saved.v1'))).not.toContain('unverified.example');
  await page.locator('.modal-close').click();
  await page.locator('[data-tab="search"]').first().click();
  await expect(page.getByRole('link',{name:/Search CORE at its source/})).toHaveAttribute('href','https://core.ac.uk/');
  await page.locator('[data-form] input').fill('Merged book');
  await page.locator('[data-form] button').click();
  await expect(page.locator('.book')).toHaveCount(2);
  await page.locator('.book').filter({hasText:'Merged book'}).locator('.book-title').click();
  await expect(page.getByRole('dialog')).not.toContainText('UNVERIFIED');
  await expect(page.getByRole('dialog').getByRole('link',{name:'DOI',exact:false})).toHaveAttribute('href','https://doi.org/10.1234/book');
  await page.locator('.modal-close').click();
  await page.locator('.book').filter({hasText:'Archive book'}).locator('.book-title').click();
  await expect(page.getByRole('dialog')).toContainText('Licensed DPLA metadata');
  await expect(page.getByRole('dialog')).toContainText('Previews & descriptions at source');
  await expect(page.getByRole('dialog').getByRole('link',{name:'View item'})).toHaveAttribute('href','https://publisher.example/archive');
  expect(imageRequests).toEqual([]);
  expect(coreRequests).toEqual([]);
  await page.screenshot({path:`test-results/${info.project.name}-source-previews.png`,fullPage:true});
});
