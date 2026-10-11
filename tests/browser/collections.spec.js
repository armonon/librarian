import {test,expect} from '@playwright/test';
import {pdfFixture} from './pdf-fixture.js';
const library='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', book='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', user='11111111-1111-4111-8111-111111111111';
const room={id:library,owner_id:user,title:'The astronomy room',curator:'Mira',description:'A small universe of ideas.',bio:'Reading the night sky.',topic:'Science',theme:'midnight',layout:'shelves',visibility:'public',published:true};
const pdf={id:book,collection_id:library,title:'A book of stars',author:'A. Reader',description:'Begin with the sky.',shelf:'Start here',color:'#36563f',position:0,size:pdfFixture().length};
async function mock(page,{enabled=true,initial=room}={}){
 let current={...initial,books:[{...pdf}]},following=[],saved=[];const calls=[];
 await page.route('**/.netlify/functions/collections?**',async route=>{
  const url=new URL(route.request().url()),action=url.searchParams.get('action'),method=route.request().method();calls.push({action,method});
  let data;
  if(action==='config')data={enabled};
  else if(action==='browse')data=current.published&&current.visibility==='public'?[current]:[];
  else if(action==='mine')data=route.request().headers().authorization?[current]:[];
  else if(action==='social')data={following,saved};
  else if(action==='collection')data=current;
  else if(action==='members')data=[];
  else if(action==='send-code')data={sent:true};
  else if(action==='verify-code')data={access_token:'token-at-least-twenty-characters',refresh_token:'refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:user,email:'mira@example.test'}};
  else if(action==='create'){current={...route.request().postDataJSON(),id:library,owner_id:user,books:[],published:false,local:false};data=current;}
  else if(action==='upload'){const next={...pdf,title:url.searchParams.get('title')};current.books.push(next);data=next;}
  else if(action==='book'&&method==='PATCH'){current.books=current.books.map(b=>b.id===url.searchParams.get('book')?{...b,...route.request().postDataJSON()}:b);data=current.books[0];}
  else if(action==='update'){const body=route.request().postDataJSON();for(const key of ['title','curator','description','bio','topic','theme','layout','visibility','published'])if(key in body)current[key]=body[key];data=current;}
  else if(action==='read')return route.fulfill({contentType:'application/pdf',body:pdfFixture()});
  else if(action==='follow'){following=method==='POST'?[{collection_id:library,librarian_collections:current}]:[];data={ok:true};}
  else if(action==='save'){saved=method==='POST'?[{collection_id:library,librarian_collections:current}]:[];data={ok:true};}
  else data={ok:true};
  return route.fulfill({json:data});
 });return calls;
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('librarian.installDismissed','1'));});
test('draft design, PDF import, book editing and offline reading persist without a backend',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await mock(page,{enabled:false});
 await page.goto('/?collections=1');await page.getByRole('button',{name:'Create a library',exact:true}).click();
 await page.locator('[data-collection-design] input[name=title]').fill('My quiet library');
 await page.locator('[data-collection-design] input[name=curator]').fill('Mira');
 await page.locator('select[name=theme]').selectOption('forest');
 await page.locator('select[name=layout]').selectOption('reading-path');
 await page.getByRole('button',{name:'Save design',exact:true}).click();await expect(page.locator('.collection-room')).toHaveClass(/theme-forest/);
 await page.locator('[data-collection-rights]').check();await page.locator('[data-collection-files]').setInputFiles({name:'A book of stars.pdf',mimeType:'application/pdf',buffer:pdfFixture()});
 await expect(page.locator('.collection-book')).toHaveCount(1);
 await page.locator('[data-collection-edit-book]').click();await page.locator('[data-collection-book] input[name=author]').fill('A. Reader');await page.getByRole('button',{name:'Save book',exact:true}).click();
 await page.locator('.collection-book-actions [data-collection-read]').click();await expect(page.locator('.pdf-page').first()).toBeVisible();
 await page.locator('[data-page-number]').fill('2');await page.locator('[data-page-form] button').click();await page.locator('[data-bookmark-page]').click();await page.locator('[data-reader-close]').click();
 await page.reload();await page.getByRole('button',{name:'Your libraries',exact:true}).click();await page.locator('.collection-card').click();
 await expect(page.locator('.collection-book')).toContainText('A. Reader');await page.locator('.collection-book-actions [data-collection-read]').click();await expect(page.locator('[data-page-number]')).toHaveValue('2');await expect(page.locator('[data-bookmark-page]')).toHaveAttribute('aria-pressed','true');await page.locator('[data-reader-close]').click();
 await page.getByRole('button',{name:'Publish library',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Connect shared library storage');
 await page.screenshot({path:`test-results/${info.project.name}-collection-draft.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('public share links allow guest reading and saving offline without an account',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const calls=await mock(page);
 await page.goto(`/?collection=${library}`);await expect(page.locator('.collection-room h1')).toHaveText(room.title);
 await page.locator('.collection-book-actions [data-collection-read]').click();await expect(page.locator('.pdf-page').first()).toBeVisible();await page.locator('[data-reader-close]').click();
 await page.locator('[data-collection-offline]').click();await expect(page.getByRole('status')).toContainText('Saved to your offline library');
 await page.getByRole('button',{name:'Follow library',exact:true}).click();await expect(page.locator('[data-collection-auth]')).toBeVisible();expect(calls.some(c=>c.action==='follow')).toBe(false);
 await page.locator('[data-tab=library]').click();await expect(page.locator('.pdf-card')).toContainText(pdf.title);await page.locator('.pdf-actions [data-read]').click();await expect(page.locator('.pdf-page').first()).toBeVisible();await page.locator('[data-reader-close]').click();
 await page.locator('[data-tab=collections]').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.screenshot({path:`test-results/${info.project.name}-collection-public.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('curator verifies email, publishes a draft, follows and saves its shared room',async({page})=>{
 const calls=await mock(page);await page.goto('/?collections=1');await page.getByRole('button',{name:'Create a library',exact:true}).click();
 await page.locator('[data-collection-design] input[name=title]').fill('Published room');await page.getByRole('button',{name:'Save design',exact:true}).click();
 await page.locator('[data-collection-rights]').check();await page.locator('[data-collection-files]').setInputFiles({name:'Stars.pdf',mimeType:'application/pdf',buffer:pdfFixture()});await expect(page.locator('.collection-book')).toHaveCount(1);
 await page.getByRole('button',{name:'Publish library',exact:true}).click();await page.locator('[data-collection-auth] input[name=email]').fill('mira@example.test');await page.getByRole('button',{name:'Send email code',exact:true}).click();
 await page.locator('[data-collection-auth] input[name=code]').fill('00123456');await page.getByRole('button',{name:'Verify and sign in',exact:true}).click();await expect(page.locator('[data-collection-auth]')).toHaveCount(0);
 await page.getByRole('button',{name:'Publish library',exact:true}).click();await expect(page.locator('.collection-state')).toContainText('Published');await expect(page).toHaveURL(new RegExp(`collection=${library}`));
 await page.getByRole('button',{name:'Follow library',exact:true}).click();await expect(page.getByRole('button',{name:'Unfollow',exact:true})).toBeVisible();await page.getByRole('button',{name:'Save collection',exact:true}).click();await expect(page.getByRole('button',{name:'Unsave',exact:true})).toBeVisible();
 expect(calls.filter(c=>c.action==='upload')).toHaveLength(1);expect(calls.some(c=>c.action==='update'&&c.method==='PATCH')).toBe(true);
});
