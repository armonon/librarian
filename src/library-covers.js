import {loadPdfjs,pdfOptions} from './pdf-reader.js';
import {pdfGet} from './pdf-storage.js';
const cache=new Map();
let queue=Promise.resolve();
function cover(id){
 if(cache.has(id))return cache.get(id);
 const task=queue.catch(()=>{}).then(async()=>{
  let loading;
  try{
   const record=await pdfGet(id);if(!record?.blob)return null;
   const lib=await loadPdfjs();loading=lib.getDocument(pdfOptions(await record.blob.arrayBuffer()));
   const doc=await loading.promise,page=await doc.getPage(1),base=page.getViewport({scale:1});
   const viewport=page.getViewport({scale:240/base.width});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
   return canvas.toDataURL('image/jpeg',.8);
  }catch{return null;}finally{await loading?.destroy().catch(()=>{});}
 });
 cache.set(id,task);if(cache.size>64)cache.delete(cache.keys().next().value);queue=task;return task;
}
let observer;
export function paintLibraryCovers(){
 observer?.disconnect();
 observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const node=entry.target;observer.unobserve(node);
   void cover(node.dataset.coverId).then(url=>{if(!url||!node.isConnected)return;const img=new Image();img.alt='';img.src=url;node.replaceChildren(img);node.classList.add('has-cover');});
  }
 },{rootMargin:'200px'});
 document.querySelectorAll('[data-cover-id]').forEach(node=>observer.observe(node));
}
