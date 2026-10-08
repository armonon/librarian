import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/native-export.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export async function','async function');
for(const cancel of [false,true]) test(`native export includes attribution and cleans temporary files${cancel ? ' after cancellation' : ''}`,async()=>{
 const writes=[],deleted=[]; let shared;
 const context=vm.createContext({Capacitor:{isNativePlatform:()=>true}, Directory:{Cache:'cache'},Encoding:{UTF8:'utf8'},
  FileReader:class{readAsDataURL(){this.result='data:application/pdf;base64,cGRm';this.onload();}},
  Filesystem:{writeFile:async data=>{writes.push(data);return{uri:'file:///'+data.path};},deleteFile:async data=>deleted.push(data.path)},
  Share:{share:async data=>{shared=data;if(cancel)throw new Error('User cancelled');}}
 });
 vm.runInContext(source,context);
 assert.equal(await context.nativeExport(new Blob(['pdf']),'Book.pdf','Author\nCC BY 4.0\nhttps://publisher.test/book'),true);
 assert.equal(writes.length,2);assert.equal(shared.files.length,2);
 assert.match(shared.files[1],/attribution\.txt$/);assert.match(shared.text,/CC BY 4.0/);
 assert.equal(writes[1].encoding,'utf8');assert.deepEqual(deleted,writes.map(w=>w.path));
});
