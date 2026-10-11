import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionsHandler, libraryInput, bookInput, pdfBytes, MAX_PDF, publishableKey } from '../netlify/lib/collections.mjs';
const library='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', book='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', owner='11111111-1111-4111-8111-111111111111';
const token='verified-token-that-is-at-least-twenty-characters';
const env={SUPABASE_URL:'https://accounts.example/',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public-key',LIBRARIAN_COLLECTIONS_ENABLED:'true'};
const input={title:'A room',curator:'Curator',description:'',bio:'',topic:'',theme:'paper',layout:'shelves',visibility:'public'};
const req=(action,method='GET',body,params={},auth=true)=>new Request('https://library.example/.netlify/functions/collections?'+new URLSearchParams({action,...params}),{method,headers:{...(auth?{authorization:`Bearer ${token}`} : {}),...(body!==undefined?{'content-type':body instanceof Uint8Array?'application/pdf':'application/json'}:{})},...(body!==undefined?{body:body instanceof Uint8Array?body:JSON.stringify(body)}:{})});
const response=data=>Response.json(data);
test('disabled configuration is explicit and never touches upstream',async()=>{
 const handler=createCollectionsHandler({env:{},fetcher:()=>{throw Error('Must not fetch');}});
 assert.deepEqual(await (await handler(req('config'))).json(),{enabled:false});
 assert.equal((await handler(req('browse'))).status,503);
});
test('foreign origins and malformed IDs cannot reach shared data',async()=>{
 let calls=0;const handler=createCollectionsHandler({env,fetcher:()=>{calls++;throw Error();}});
 const request=req('browse');request.headers.set('origin','https://attacker.example');
 assert.equal((await handler(request)).status,403);
 assert.equal((await handler(req('collection','GET',undefined,{library:'not-a-uuid'}))).status,400);assert.equal(calls,0);
});
test('guest discovery filters out drafts and unlisted collections',async()=>{
 let upstream;const handler=createCollectionsHandler({env,fetcher:(url,options)=>{upstream={url:new URL(url),options};return response([]);}});
 assert.equal((await handler(req('browse','GET',undefined,{},false))).status,200);
 assert.equal(upstream.url.searchParams.get('visibility'),'eq.public');assert.equal(upstream.url.searchParams.get('published'),'eq.true');
 assert.equal(upstream.options.headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);assert.equal(upstream.options.headers.Authorization,undefined);
});
test('verification precedes mutations and unverified or MFA accounts fail closed',async()=>{
 for(const account of [{id:owner,email:'owner@example.test'},{id:owner,email:'owner@example.test',email_confirmed_at:'2026-10-10',factors:[{status:'verified'}]}]){
  let calls=0;const handler=createCollectionsHandler({env,fetcher:()=>{calls++;return response(account);}});
  assert.equal((await handler(req('create','POST',input))).status,403);assert.equal(calls,1);
 }
 const handler=createCollectionsHandler({env,fetcher:()=>{throw Error('Must not fetch');}});
 assert.equal((await handler(req('create','POST',input,{},false))).status,401);
});
test('co-curators can edit books but cannot publish or invite',async()=>{
 const calls=[];const handler=createCollectionsHandler({env,fetcher:(url,options)=>{
  const p=new URL(url).pathname;calls.push({p,options});
  if(p==='/auth/v1/user')return response({id:'22222222-2222-4222-8222-222222222222',email:'editor@example.test',email_confirmed_at:'2026-10-10'});
  if(p==='/rest/v1/librarian_collections')return response([{id:library,owner_id:owner}]);
  if(p==='/rest/v1/librarian_members')return response([{email:'editor@example.test'}]);
  if(p==='/rest/v1/librarian_books')return response([{id:book}]);throw Error(p);
 }});
 const body={title:'Book',author:'',description:'',shelf:'Classics',color:'#7a3b2e',position:0};
 assert.equal((await handler(req('book','PATCH',body,{library,book}))).status,200);
 assert.equal((await handler(req('update','PATCH',{...input,published:true},{library}))).status,403);
 assert.equal((await handler(req('members','POST',{email:'other@example.test'},{library}))).status,403);
 assert.equal(calls.filter(c=>c.p==='/rest/v1/librarian_collections'&&c.options.method==='PATCH').length,0);
});
test('guest PDF reading checks accessible metadata before fetching bytes and disables caching',async()=>{
 const calls=[];const bytes=new Uint8Array(Buffer.from('%PDF-1.4\nexample\n%%EOF'));
 const handler=createCollectionsHandler({env,fetcher:(url)=>{calls.push(new URL(url).pathname);return calls.length===1?response([{id:book,storage_path:`${library}/${book}.pdf`}]):new Response(bytes);}});
 const result=await handler(req('read','GET',undefined,{book},false));assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(result.headers.get('content-type'),'application/pdf');assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes);
 const denied=createCollectionsHandler({env,fetcher:()=>response([])});assert.equal((await denied(req('read','GET',undefined,{book},false))).status,404);
});
test('PDF uploads reject wrong types, truncated data and excessive byte streams',async()=>{
 for(const [body,type,status] of [['<html>no</html>','application/pdf',400],['%PDF-1.4\ntruncated','application/pdf',400],['%PDF-1.4\n%%EOF','text/plain',415]]){
  await assert.rejects(pdfBytes(new Request('https://test.example',{method:'POST',headers:{'content-type':type},body})),e=>e.status===status);
 }
 const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_PDF+1));controller.close();}});
 await assert.rejects(pdfBytes(new Request('https://test.example',{method:'POST',headers:{'content-type':'application/pdf'},body,duplex:'half'})),e=>e.status===413);
});
test('failed book metadata insertion cleans up uploaded bytes',async()=>{
 const calls=[];const handler=createCollectionsHandler({env,fetcher:(url,options)=>{
  const path=new URL(url).pathname;calls.push({path,method:options.method});
  if(path==='/auth/v1/user')return response({id:owner,email:'owner@example.test',email_confirmed_at:'2026-10-10'});
  if(path==='/rest/v1/librarian_collections')return response([{id:library,owner_id:owner}]);
  if(path==='/rest/v1/librarian_books')return Response.json({code:'23514'},{status:400});
  return response({ok:true});
 }});
 const bytes=new Uint8Array(Buffer.from('%PDF-1.4\nvalid fixture\n%%EOF'));
 assert.equal((await handler(req('upload','POST',bytes,{library,rights:'confirmed'}))).status,400);
 assert(calls.some(c=>c.path==='/storage/v1/object/librarian-pdfs'&&c.method==='DELETE'));
});
test('design validation rejects injectable colors, invalid sharing and extra-long descriptions',()=>{
 assert.equal(libraryInput(input).theme,'paper');assert.throws(()=>libraryInput({...input,visibility:'world'}));assert.throws(()=>libraryInput({...input,description:'x'.repeat(2001)}));
 assert.throws(()=>bookInput({title:'X',author:'',description:'',shelf:'',color:'red; background:url(x)',position:0}));
});
test('email codes preserve leading zeroes and reject incomplete verification',async()=>{
 const calls=[];const handler=createCollectionsHandler({env,fetcher:(url,options)=>{calls.push({url:String(url),body:JSON.parse(options.body)});return response({access_token:token});}});
 assert.equal((await handler(req('verify-code','POST',{email:'owner@example.test',code:'00123456'}, {},false))).status,200);
 assert.equal(calls[0].body.token,'00123456');assert.equal(calls[0].body.type,'email');
 assert.equal((await handler(req('verify-code','POST',{email:'owner@example.test',code:'123456'}, {},false))).status,400);assert.equal(calls.length,1);
});

test('misconfigured service-role keys never authorize guest reads',async()=>{
 const payload=Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url');
 for(const key of ['sb_secret_do-not-use',`eyJhbGciOiJIUzI1NiJ9.${payload}.signature`]){
  assert.equal(publishableKey(key),false);
  const handler=createCollectionsHandler({env:{...env,SUPABASE_PUBLISHABLE_KEY:key},fetcher:()=>{throw Error('Never fetch');}});
  assert.equal((await handler(req('read','GET',undefined,{book},false))).status,503);
 }
});
