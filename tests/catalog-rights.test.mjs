import test from 'node:test';
import assert from 'node:assert/strict';
import { CC0, CC_BY, downloadCredits, openAlexDownloads, permittedDownload, shelfRecord } from '../src/catalog-rights.js';
import { readableLink } from '../src/reading.js';
const location = {license:'cc0',is_oa:true,pdf_url:'https://publisher.test/exact.pdf',landing_page_url:'https://publisher.test/item'};
const work = {id:'https://openalex.org/W123', display_name:'Original work',locations:[location]};
test('download license must cover the exact location; OA alone and URL labels never suffice', () => {
  const links = [{url:'https://example.test/other.pdf',label:'Free PDF'}];
  for (const license of [null, undefined, 'public-domain', 'cc-by', 'publisher-specific', 'cc-by-nc']) {
    assert.equal(readableLink({links,downloads:openAlexDownloads({...work,locations:[{...location,license}]})}),null);
  }
  const downloads = openAlexDownloads({...work, locations:[{...location,license:null,pdf_url:links[0].url},location]});
  assert.equal(readableLink({links,downloads}).url,location.pdf_url);
  assert.equal(readableLink({links}),null);
  assert.equal(openAlexDownloads({...work,locations:[{...location,is_oa:false}]}).length,0);
});
test('download provenance rejects unsafe URLs and forged provider identifiers', () => {
  const [d] = openAlexDownloads(work);
  assert.ok(permittedDownload(d));
  for (const patch of [{url:'http://example.test/file.pdf'}, {url:'https://user:pass@example.test/file.pdf'}, {sourceUrl:'javascript:alert(1)'}, {evidenceUrl:'https://openalex.org.evil.test/W123'}, {evidenceUrl:'https://openalex.org/not-a-work'}, {license:CC0+'evil'}]) assert.equal(permittedDownload({...d,...patch}),false);
});
test('Google shelf references remove cached content without losing bookmark identity', () => {
  const old = {id:'gb:abc',title:'API title',authors:['Author'],cover:'https://example.test/image.jpg',desc:'API description',ids:['ISBN'],sources:['Google Books']};
  const clean = shelfRecord(old);
  assert.equal(clean.id,old.id);
  assert.equal(clean.googleReference,true);
  assert.equal(clean.title,'Saved Google Books link');
  assert.equal(clean.cover,''); assert.deepEqual(clean.authors,[]);
  assert.equal(clean.links[0].url,'https://books.google.com/books?id=abc');
  assert.deepEqual(shelfRecord(clean),clean);
  const other={id:'ol:123',title:'Keep me'}; assert.equal(shelfRecord(other).title,other.title);
});

test('CC BY requires matching DOI, published edition, exact publisher license and effective date', () => {
 const w={...work,doi:'https://doi.org/10.1234/example',locations:[{...location,license:'cc-by',version:'publishedVersion'}]};
 const license={'content-version':'vor',URL:CC_BY,start:{timestamp:1}};
 const publisher={DOI:'10.1234/example',license:[license]};
 assert.equal(openAlexDownloads(w).length,0);
 assert.equal(openAlexDownloads(w,publisher,2)[0].license,CC_BY);
 for(const patch of [{DOI:'10.1234/different'}, {license:[{...license,'content-version':'tdm'}]}, {license:[{...license,URL:'https://creativecommons.org/licenses/by-nc/4.0/'}]}, {license:[{...license,start:{timestamp:100}}]}]) assert.equal(openAlexDownloads(w,{...publisher,...patch},2).length,0);
 assert.equal(openAlexDownloads({...w,locations:[{...w.locations[0],version:'submittedVersion'}]},publisher,2).length,0);
 assert.match(downloadCredits({title:'A book',author:'An author',licenseUrl:CC_BY,sourceUrl:'https://publisher.test/book'}),/Original PDF supplied unchanged/);
});
