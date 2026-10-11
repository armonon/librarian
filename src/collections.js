import './collections.css';
import { pdfGet, pdfSave } from './pdf-storage.js';
import { loadPdfjs, pdfOptions } from './pdf-reader.js';
const DRAFTS = 'librarian.collections.drafts.v1', SESSION = 'librarian.collections.session.v1';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => crypto.randomUUID();
const designData = room => Object.fromEntries(['title','description','curator','bio','topic','theme','layout','visibility'].map(key=>[key,room[key]]));
const defaults = () => ({ id: uid(), title: 'My reading room', description: '', curator: 'A curious reader', bio: '', topic: '', theme: 'paper', layout: 'shelves', visibility: 'public', published: false, books: [], local: true });
function readStorage(key, fallback, kind = 'localStorage') { try { return JSON.parse(window[kind].getItem(key)) || fallback; } catch { return fallback; } }
export function collectionLink(id, origin = 'https://librarian-atlas.netlify.app') { const url = new URL('/', origin); url.searchParams.set('collection', id); return url.href; }
export function createCollections({ base = '', changed, readBook, imported, localBooks, publicOrigin = location.protocol === 'http:' || location.protocol === 'https:' ? location.origin : 'https://librarian-atlas.netlify.app' }) {
  const c = { enabled: false, initialized: false, loading: false, busy: false, error: '', notice: '', drafts: readStorage(DRAFTS, []), session: readStorage(SESSION, null, 'sessionStorage'), view: 'discover', list: [], mine: [], following: [], saved: [], selected: null, editing: false, query: '', topic: '', members: [], bookEdit: null, auth: false, report: false };
  if (!Array.isArray(c.drafts)) c.drafts = [];
  c.drafts=c.drafts.filter(d=>d && typeof d.id==='string' && typeof d.title==='string' && Array.isArray(d.books));
  let refreshing, initialized;
  const saveDrafts = () => { try { const value=JSON.stringify(c.drafts); localStorage.setItem(DRAFTS,value); if(localStorage.getItem(DRAFTS)!==value)throw Error(); } catch { throw new Error('This draft could not be saved on your device. Free up storage and keep this tab open before trying again.'); } };
  const storeSession = session => { c.session = session?.access_token ? { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at || Math.floor(Date.now()/1000) + session.expires_in, user: session.user } : null; try { if (c.session) sessionStorage.setItem(SESSION, JSON.stringify(c.session)); else sessionStorage.removeItem(SESSION); } catch { c.notice='Signed in for this window. Session storage is unavailable.'; } };
  async function request(action, { method = 'GET', params = {}, body, binary = false, anonymous = false } = {}) {
    if (!anonymous && c.session && c.session.expires_at < Date.now()/1000 + 60 && action !== 'refresh') {
      refreshing ||= request('refresh', { method: 'POST', body: { refresh_token: c.session.refresh_token }, anonymous: true }).then(storeSession).catch(error => { storeSession(null); throw error; }).finally(() => { refreshing = null; });
      await refreshing;
    }
    const url = new URL(`${base}/.netlify/functions/collections`, location.href);
    url.searchParams.set('action', action); for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const headers = {};
    if (!anonymous && c.session) headers.Authorization = `Bearer ${c.session.access_token}`;
    if (body !== undefined) headers['Content-Type'] = body instanceof Blob ? 'application/pdf' : 'application/json';
    const response = await fetch(url, { method, headers, body: body === undefined ? undefined : body instanceof Blob ? body : JSON.stringify(body), signal: AbortSignal.timeout(binary || body instanceof Blob ? 90000 : 25000), cache: 'no-store' });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Could not reach shared libraries.'); }
    return binary ? response.blob() : response.json();
  }
  async function run(task) {
    if (c.busy) return;
    c.busy = true; c.error = ''; c.notice = ''; changed();
    try { await task(); } catch (error) { c.error = error.message || 'Could not complete this change.'; }
    finally { c.busy = false; changed(); }
  }
  async function sync() {
    if (!c.enabled) return;
    c.list = await request('browse', { params: { q: c.query } });
    if (c.session) {
      [c.mine, { following: c.following, saved: c.saved }] = await Promise.all([request('mine'), request('social')]);
    } else { c.mine = []; c.following = []; c.saved = []; }
  }
  async function init() {
    if (initialized) return initialized;
    initialized = (async () => {
      c.loading = true; changed();
      try { c.enabled = (await request('config', { anonymous: true })).enabled; await sync(); }
      catch (error) { c.error = error.message; }
      c.initialized = true; c.loading = false;
      const id = new URLSearchParams(location.search).get('collection');
      if (id && c.enabled) { try { await select(id, false); } catch (error) { c.error = error.message; } }
      else if (id) c.error = 'This shared library cannot be opened until the library service is connected.';
      changed();
    })(); return initialized;
  }
  async function select(id, push = true) {
    c.bookEdit = null; c.editing = false; c.members = []; c.report = false; c.error = ''; c.notice = '';
    c.selected = c.drafts.find(d => d.id === id) || await request('collection', { params: { library: id } });
    if (push) { const url = new URL(location.href); c.selected.local ? url.searchParams.delete('collection') : url.searchParams.set('collection', id); history.pushState({}, '', url); }
    if (!c.selected.local && c.session) {
      try { c.members = await request('members', { params: { library: id } }); } catch { /* A visitor cannot view the curator list. */ }
    }
    changed();
  }
  const owner = () => c.selected?.local || !!(c.session && c.selected?.owner_id === c.session.user?.id);
  const editor = () => owner() || c.members.some(m => m.email === c.session?.user?.email?.toLowerCase());
  function card(library) {
    return `<button class="collection-card theme-${escape(library.theme)}" data-collection-open="${escape(library.id)}"><span class="collection-spines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="collection-kicker">${escape(library.topic || (library.local ? 'On this device' : 'Curated library'))}</span><strong>${escape(library.title)}</strong><span>By ${escape(library.curator)}</span><span class="collection-description">${escape(library.description || 'A place for books, ideas, and new discoveries.')}</span>${library.local || !library.published ? '<span class="collection-badge">Draft</span>' : ''}</button>`;
  }
  const action = (name, label, primary = false, extra = '') => `<button type="button" class="${primary ? 'btn-primary' : 'btn-ghost'}" data-collection-action="${name}" ${c.busy ? 'disabled' : ''} ${extra}>${label}</button>`;
  function authView() {
    return `<form class="collection-form auth-form" data-collection-auth><h3>Your curator account</h3><p>Use your Momentium email to publish, follow libraries, or save collections across devices.</p><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" value="${escape(c.authEmail || '')}" required /></label><label>Eight-digit email code<input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" minlength="8" maxlength="8" /></label><div class="collection-actions"><button class="btn-primary" name="mode" value="verify-code" ${c.busy ? 'disabled' : ''}>Verify and sign in</button><button class="btn-ghost" name="mode" value="send-code" ${c.busy ? 'disabled' : ''}>Send email code</button>${action('auth-close', 'Cancel')}</div><p>Request a code, then enter the eight digits from your email. A verified account is required for publishing.</p></form>`;
  }
  function designForm(library) {
    const field = (name, label, max, area = false) => `<label>${label}${area ? `<textarea name="${name}" maxlength="${max}" rows="3">${escape(library[name])}</textarea>` : `<input name="${name}" value="${escape(library[name])}" maxlength="${max}" ${['title','curator'].includes(name) ? 'required' : ''} />`}</label>`;
    const options = (name, label, values) => `<label>${label}<select name="${name}">${values.map(([value,text]) => `<option value="${value}" ${library[name]===value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    return `<form class="collection-form" data-collection-design><h3>Make this space yours</h3><div class="collection-fields">${field('title','Library name',120)}${field('curator','Curator name',80)}${field('description','Welcome note',2000,true)}${field('bio','About the curator',1000,true)}${field('topic','Subject',80)}${options('theme','Atmosphere',[['paper','Warm paper'],['midnight','Midnight archive'],['forest','Forest study']])}${options('layout','Arrangement',[['shelves','Themed shelves'],['gallery','Book gallery'],['reading-path','Reading path']])}${options('visibility','Sharing',[['public','Public · listed in discovery'],['unlisted','Unlisted · anyone with the link'],['private','Private · owner and co-curators']])}</div><p>Public and unlisted PDFs can be read and saved by visitors. Keep documents private unless you have permission to share them.</p><div class="collection-actions"><button class="btn-primary" ${c.busy ? 'disabled' : ''}>Save design</button>${action('edit-close','Close')}</div></form>`;
  }
  function bookForm(book) {
    return `<form class="collection-form" data-collection-book><h3>Edit book</h3><div class="collection-fields">${[['title','Title',200],['author','Author',200],['shelf','Shelf / subject',100]].map(([name,label,max]) => `<label>${label}<input name="${name}" value="${escape(book[name])}" maxlength="${max}" ${name==='title'?'required':''} /></label>`).join('')}<label>Cover color<input name="color" type="color" value="${escape(book.color || '#7a3b2e')}" /></label><label>Reading order<input name="position" type="number" min="0" max="10000" value="${book.position || 0}" required /></label><label>Curator’s note<textarea name="description" rows="3" maxlength="2000">${escape(book.description)}</textarea></label></div><div class="collection-actions"><button class="btn-primary" ${c.busy ? 'disabled' : ''}>Save book</button>${action('book-close','Cancel')}</div></form>`;
  }
  function room(library) {
    const isEditor = editor(), isOwner = owner(), books = library.books || [];
    const followed = c.following.some(x => x.collection_id === library.id), saved = c.saved.some(x => x.collection_id === library.id);
    const groups = library.layout === 'shelves' ? [...new Set(books.map(b=>b.shelf || 'The collection'))] : ['The collection'];
    return `<div class="collection-room theme-${escape(library.theme)} layout-${escape(library.layout)}"><div class="collection-room-head"><p class="eyebrow">${escape(library.topic || 'A personal reading room')}</p><h1>${escape(library.title)}</h1><p class="collection-welcome">${escape(library.description)}</p><p class="collection-byline">Curated by <strong>${escape(library.curator)}</strong></p>${library.bio ? `<p class="collection-bio">${escape(library.bio)}</p>` : ''}<p class="collection-state">${library.local ? 'Draft saved on this device' : library.published ? library.visibility === 'private' ? 'Private · invited curators only' : library.visibility === 'unlisted' ? 'Unlisted · anyone with the link' : 'Published · open to all readers' : 'Unpublished · invited curators only'} · ${books.length} ${books.length===1?'book':'books'}</p><div class="collection-actions">${isOwner ? action('edit','Design library') + (library.local ? action('publish','Publish library',true) : action(library.published?'unpublish':'publish',library.published?'Unpublish':'Publish library',true)) : ''}${!library.local && library.published && library.visibility !== 'private' ? action('share','Share library') : ''}${!library.local ? action('follow',followed?'Unfollow':'Follow library') + action('favorite',saved?'Unsave':'Save collection') : ''}</div>${c.notice && c.notice.startsWith('Share link:') ? `<label class="collection-share">Library link<input readonly value="${escape(collectionLink(library.id,publicOrigin))}" aria-label="Library link" /></label>` : ''}</div>
    ${c.editing && isOwner ? designForm(library) : ''}${c.bookEdit && isEditor ? bookForm(c.bookEdit) : ''}
    ${isEditor ? `<section class="collection-upload"><h3>Grow your collection</h3><p>Add up to 50 PDFs, 4 MB each. Uploaded files are stored in your shared library.</p><label class="collection-rights"><input type="checkbox" data-collection-rights /> I have permission to distribute these PDFs to the readers of this library.</label><div class="collection-actions"><label class="btn-ghost file-button">Add PDFs<input data-collection-files type="file" accept="application/pdf,.pdf" multiple ${c.busy ? 'disabled' : ''} /></label><label>From your offline library<select data-collection-local><option value="">Choose a saved PDF…</option>${localBooks().filter(b=>b.format !== 'text' && b.size <= 4*1024*1024).map(b=>`<option value="${escape(b.id)}">${escape(b.title)}</option>`).join('')}</select></label>${action('add-local','Add selected PDF')}</div></section>` : ''}
    ${books.length ? groups.map(group=>`<section class="collection-shelf"><h2>${escape(group)}</h2><div class="collection-book-grid">${books.filter(b=>library.layout !== 'shelves' || (b.shelf || 'The collection')===group).sort((a,b)=>a.position-b.position).map((b,i)=>`<article class="collection-book"><button class="collection-cover" style="--cover:${/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#7a3b2e'}" data-collection-read="${escape(b.id)}" aria-label="Read ${escape(b.title)}">${library.layout==='reading-path'?`<span class="path-number">${i+1}</span>`:''}<span>${escape(b.title)}</span><small>${escape(b.author || library.curator)}</small></button><h3>${escape(b.title)}</h3>${b.author ? `<p>${escape(b.author)}</p>` : ''}${b.description ? `<p class="collection-book-note">${escape(b.description)}</p>` : ''}<div class="collection-book-actions"><button data-collection-read="${escape(b.id)}" ${c.busy?'disabled':''}>Read</button>${!library.local ? `<button data-collection-offline="${escape(b.id)}" ${c.busy?'disabled':''}>Save offline</button>` : ''}${isEditor ? `<button data-collection-edit-book="${escape(b.id)}" ${c.busy?'disabled':''}>Edit</button><button data-collection-remove-book="${escape(b.id)}" ${c.busy?'disabled':''}>Remove</button>` : ''}</div></article>`).join('')}</div></section>`).join('') : '<div class="collection-empty"><h3>Your first shelf awaits.</h3><p>Add a PDF and give it a title, a cover color, and a home.</p></div>'}
    ${isOwner && !library.local ? `<section class="collection-collaborators"><h3>Co-curators</h3><p>Invite a verified account by email. Co-curators can add and organize books, including in private libraries. Invitations appear when they sign in; no email is sent.</p><form data-collection-invite><label>Email<input name="email" type="email" required /></label><button class="btn-ghost" ${c.busy?'disabled':''}>Invite curator</button></form><ul>${c.members.map(m=>`<li>${escape(m.email)} <button data-collection-revoke="${escape(m.email)}" ${c.busy?'disabled':''}>Remove access</button></li>`).join('')}</ul></section>` : ''}
    <div class="collection-room-footer">${!library.local ? action('report','Report this library') : ''}${isOwner ? action('delete','Delete library') : ''}</div>
    ${c.report ? `<form class="collection-form" data-collection-report><label>Describe the issue<textarea name="reason" minlength="10" maxlength="2000" required rows="3"></textarea></label><button class="btn-primary" ${c.busy?'disabled':''}>Submit report</button><p>You can also <a href="https://thecreatingco.com/testing/?category=privacy#feedback" target="_blank" rel="noopener noreferrer">contact support</a> without an account.</p></form>` : ''}</div>`;
  }
  function view() {
    let list = c.view === 'mine' ? [...c.drafts,...c.mine] : c.view === 'following' ? c.following.map(x=>x.librarian_collections).filter(Boolean) : c.view === 'saved' ? c.saved.map(x=>x.librarian_collections).filter(Boolean) : c.list;
    list = list.filter(l=>(!c.topic || l.topic===c.topic) && `${l.title} ${l.curator} ${l.topic}`.toLowerCase().includes(c.query.toLowerCase()));
    const topics = [...new Set(c.list.map(l=>l.topic).filter(Boolean))];
    return `<section class="section collections-section"><div class="wrap"><div class="collection-heading"><div><p class="eyebrow">Librarian Collections</p><h2>Whole worlds.<br>One bookshelf.</h2><p>Design your reading room. Share what moves you.<br>Find your next idea on someone else’s shelf.</p></div><div class="collection-actions">${action('create','Create a library',true)}${c.enabled ? c.session ? action('logout','Sign out') : action('auth','Sign in') : ''}</div></div>
    ${!c.enabled && c.initialized ? '<p class="notice">Shared publishing is not connected yet. Design a draft here; it stays on this device until you publish.</p>' : ''}
    ${c.session ? `<p class="collection-account">Signed in as ${escape(c.session.user?.email)}</p>` : ''}${c.error ? `<p class="notice" role="alert">${escape(c.error)}</p>` : ''}${c.notice ? `<p class="collection-notice" role="status">${escape(c.notice)}</p>` : ''}${c.busy || c.loading ? '<p role="status" class="collection-working">Working…</p>' : ''}
    ${c.auth ? authView() : ''}
    ${c.selected ? `${action('back','← All collections')}${room(c.selected)}` : `<div class="collection-browse"><div class="collection-tabs" role="group" aria-label="Collection views">${[['discover','Explore'],['mine','Your libraries'],['following','Following'],['saved','Saved']].map(([value,label])=>`<button data-collection-view="${value}" aria-pressed="${c.view===value}">${label}</button>`).join('')}</div><form data-collection-search class="collection-search"><label class="sr-only" for="collection-query">Search libraries</label><input id="collection-query" name="q" value="${escape(c.query)}" placeholder="Search libraries or curators…" /><button class="btn-ghost">Search</button><label>Subject<select data-collection-topic><option value="">All subjects</option>${topics.map(t=>`<option value="${escape(t)}" ${c.topic===t?'selected':''}>${escape(t)}</option>`).join('')}</select></label></form>${list.length ? `<div class="collection-grid">${list.map(card).join('')}</div>` : `<div class="collection-empty"><h3>${c.loading ? 'Opening the stacks…' : c.view==='discover' ? 'A new world starts with your collection.' : 'No collections here yet.'}</h3><p>${c.view==='following'?'Follow a library to keep it close.':c.view==='saved'?'Save a collection to return to it.':'Create a library, add your books, and make it your own.'}</p></div>`}</div>`}</div></section>`;
  }
  async function persistDesign(data) {
    const library = c.selected;
    if (library.local) { Object.assign(library,data); saveDrafts(); }
    else c.selected = { ...await request('update',{method:'PATCH',params:{library:library.id},body:{...data,published:library.published}}), books:library.books };
    if (library.local && library.cloudId) await request('update',{method:'PATCH',params:{library:library.cloudId},body:{...designData(library),published:false}});
    c.notice = 'Library design saved.'; c.editing = false; await sync();
  }
  async function addBlob(blob, title, localId) {
    if (blob.size > 4*1024*1024) throw new Error('Shared PDFs must be 4 MB or smaller.');
    const task = (await loadPdfjs()).getDocument(pdfOptions(await blob.arrayBuffer()));
    try { await task.promise; } catch { throw new Error('This PDF could not be opened. Choose a complete, unlocked PDF.'); } finally { await task.destroy(); }
    const library = c.selected;
    if (library.books.length>=50) throw new Error('Each library can hold up to 50 PDFs.');
    if (library.local) {
      const id = uid(); let sourceId = localId;
      if (!sourceId) { sourceId = uid(); const meta={id:sourceId,title,author:'',format:'pdf',source:'Imported',size:blob.size,addedAt:Date.now()}; await pdfSave(meta,blob); imported(meta); }
      library.books.push({id,localId:sourceId,title,author:'',description:'',shelf:'The collection',color:'#7a3b2e',position:library.books.length,size:blob.size}); saveDrafts();
    } else {
      const book = await request('upload',{method:'POST',params:{library:library.id,rights:'confirmed',title},body:blob});
      const edited = await request('book',{method:'PATCH',params:{library:library.id,book:book.id},body:{...book,position:library.books.length}});
      library.books.push(edited);
    }
  }
  async function publish() {
    if (!c.enabled) throw new Error('Connect shared library storage before publishing. Your draft is saved on this device.');
    if (!c.session) { c.auth=true; c.notice='Sign in, then publish your library.'; return; }
    let library=c.selected;
    if (!library.books.length) throw new Error('Add at least one PDF before publishing.');
    if (library.local) {
      if (library.cloudAccount && library.cloudAccount !== c.session.user.id) throw new Error('Sign in with the account that began publishing this draft.');
      if (!library.cloudId) { const remote=await request('create',{method:'POST',body:designData(library)}); library.cloudId=remote.id; library.cloudAccount=c.session.user.id; saveDrafts(); }
      for (const book of library.books) {
        if (book.cloudId) { await request('book',{method:'PATCH',params:{library:library.cloudId,book:book.cloudId},body:book}); continue; }
        const record=await pdfGet(book.localId);
        if (!record?.blob) throw new Error(`The PDF for “${book.title}” is missing. Remove it from the draft or add it again.`);
        const remote=await request('upload',{method:'POST',params:{library:library.cloudId,rights:'confirmed',title:book.title},body:record.blob});
        book.cloudId=remote.id; saveDrafts();
        await request('book',{method:'PATCH',params:{library:library.cloudId,book:remote.id},body:book});
      }
      await request('update',{method:'PATCH',params:{library:library.cloudId},body:{...designData(library),published:true}});
      const remoteId=library.cloudId; c.drafts=c.drafts.filter(d=>d.id!==library.id); saveDrafts(); await sync(); await select(remoteId);
    } else { await request('update',{method:'PATCH',params:{library:library.id},body:{...designData(library),published:true}}); await sync(); await select(library.id); }
    c.notice=c.selected.visibility==='private'?'Private library saved for its curators.':'Your library is published. Use Share library to invite readers.';
  }
  async function getBlob(book) { if (c.selected.local) { const record=await pdfGet(book.localId); if (!record?.blob) throw new Error('The original PDF is no longer on this device.'); return record.blob; } return request('read',{params:{book:book.id},binary:true}); }
  async function social(kind) {
    if (!c.session) { c.auth=true; c.notice='Sign in to follow or save a collection.'; return; }
    const existing=(kind==='follow'?c.following:c.saved).some(x=>x.collection_id===c.selected.id);
    await request(kind==='follow'?'follow':'save',{method:existing?'DELETE':'POST',params:{library:c.selected.id}}); await sync();
  }
  async function handle(name) {
    if (name==='create') { const library=defaults(); c.drafts.push(library); saveDrafts(); c.selected=library; c.editing=true; c.members=[]; return; }
    if (name==='auth') { c.auth=true; return; }
    if (name==='auth-close') { c.auth=false; return; }
    if (name==='back') { c.selected=null; c.editing=false; const url=new URL(location.href); url.searchParams.delete('collection'); history.pushState({},'',url); await sync(); return; }
    if (name==='edit') { c.editing=true; return; }
    if (name==='edit-close') { c.editing=false; return; }
    if (name==='book-close') { c.bookEdit=null; return; }
    if (name==='publish') return publish();
    if (name==='unpublish') { await request('update',{method:'PATCH',params:{library:c.selected.id},body:{...designData(c.selected),published:false}}); await select(c.selected.id); await sync(); c.notice='Library unpublished. Its public link no longer opens for visitors.'; return; }
    if (name==='logout') { try { await request('logout',{method:'POST'}); } finally { storeSession(null); c.selected=null; c.members=[]; await sync(); } return; }
    if (name==='follow' || name==='favorite') return social(name);
    if (name==='share') {
      const url=collectionLink(c.selected.id,publicOrigin);
      if (navigator.share) { try { await navigator.share({title:c.selected.title,url}); } catch(error) { if (error.name!=='AbortError') throw error; } }
      else { try { await navigator.clipboard.writeText(url); c.notice='Library link copied.'; } catch { c.notice=`Share link: ${url}`; } }
      return;
    }
    if (name==='report') { c.report=!c.report; return; }
    if (name==='add-local') {
      const { id, rights } = c.pendingLocal || {};
      if (!rights) throw new Error('Confirm permission to share the PDF.');
      const meta=localBooks().find(b=>b.id===id), record=id && await pdfGet(id);
      if (!meta || !record?.blob) throw new Error('Choose an available PDF from your offline library.');
      await addBlob(record.blob,meta.title,id); c.notice='Book added.'; return;
    }
    if (name==='delete') {
      const library=c.selected;
      if (!window.confirm(`Delete “${library.title}” and its shared PDFs? Offline copies on this device will remain.`)) return;
      if (library.local) { if (library.cloudId) await request('delete',{method:'DELETE',params:{library:library.cloudId}}); c.drafts=c.drafts.filter(d=>d.id!==library.id); saveDrafts(); }
      else await request('delete',{method:'DELETE',params:{library:library.id}});
      c.selected=null; c.view='mine'; const url=new URL(location.href); url.searchParams.delete('collection'); history.replaceState({},'',url); await sync(); c.notice='Library deleted.';
    }
  }
  function bind(root=document) {
    root.querySelectorAll('[data-collection-action]').forEach(el=>el.onclick=()=>{ if(el.dataset.collectionAction==='add-local')c.pendingLocal={id:root.querySelector('[data-collection-local]')?.value,rights:root.querySelector('[data-collection-rights]')?.checked}; void run(()=>handle(el.dataset.collectionAction)); });
    root.querySelectorAll('[data-collection-open]').forEach(el=>el.onclick=()=>run(()=>select(el.dataset.collectionOpen)));
    root.querySelectorAll('[data-collection-view]').forEach(el=>el.onclick=()=>run(async()=>{c.view=el.dataset.collectionView; c.query=''; c.topic=''; if (['following','saved'].includes(c.view) && !c.session) c.auth=true; await sync();}));
    root.querySelector('[data-collection-auth]')?.addEventListener('submit',event=>{
      event.preventDefault(); const form=new FormData(event.currentTarget), mode=event.submitter?.value || 'verify-code';
      void run(async()=>{const session=await request(mode,{method:'POST',anonymous:true,body:{email:form.get('email'),...(mode==='verify-code'?{code:form.get('code')}:{})}}); c.authEmail=form.get('email'); if (session.access_token) { storeSession(session); c.auth=false; await sync(); if (c.selected && !c.selected.local) await select(c.selected.id,false); c.notice='Signed in.'; } else c.notice='Code requested. Check your inbox and enter the eight-digit code.';});
    });
    root.querySelector('[data-collection-design]')?.addEventListener('submit',event=>{event.preventDefault(); const body=Object.fromEntries(new FormData(event.currentTarget)); void run(()=>persistDesign(body));});
    root.querySelector('[data-collection-book]')?.addEventListener('submit',event=>{event.preventDefault(); const body=Object.fromEntries(new FormData(event.currentTarget)); body.position=Number(body.position); void run(async()=>{if(c.selected.local){Object.assign(c.bookEdit,body);saveDrafts();}else{const book=await request('book',{method:'PATCH',params:{library:c.selected.id,book:c.bookEdit.id},body});c.selected.books=c.selected.books.map(b=>b.id===book.id?book:b);}c.bookEdit=null;c.notice='Book details saved.';});});
    root.querySelector('[data-collection-files]')?.addEventListener('change',event=>{
      const files=Array.from(event.target.files || []), rights=root.querySelector('[data-collection-rights]')?.checked;
      void run(async()=>{if(!rights)throw new Error('Confirm permission to share these PDFs.');let added=0;for(const file of files){await addBlob(file,file.name.replace(/\.pdf$/i,''));added++;c.notice=`Added ${added} of ${files.length} PDFs.`;} });
    });
    root.querySelector('[data-collection-search]')?.addEventListener('submit',event=>{event.preventDefault();c.query=new FormData(event.currentTarget).get('q') || '';void run(sync);});
    root.querySelector('[data-collection-topic]')?.addEventListener('change',event=>{c.topic=event.target.value;changed();});
    root.querySelectorAll('[data-collection-edit-book]').forEach(el=>el.onclick=()=>{c.bookEdit=c.selected.books.find(b=>b.id===el.dataset.collectionEditBook);changed();});
    root.querySelectorAll('[data-collection-remove-book]').forEach(el=>el.onclick=()=>run(async()=>{const book=c.selected.books.find(b=>b.id===el.dataset.collectionRemoveBook);if(!window.confirm(`Remove “${book.title}” from this library?`))return;if(c.selected.local){if(book.cloudId)await request('book',{method:'DELETE',params:{library:c.selected.cloudId,book:book.cloudId}});c.selected.books=c.selected.books.filter(b=>b.id!==book.id);saveDrafts();}else{await request('book',{method:'DELETE',params:{library:c.selected.id,book:book.id}});await select(c.selected.id,false);} }));
    root.querySelectorAll('[data-collection-read]').forEach(el=>el.onclick=()=>run(async()=>{const book=c.selected.books.find(b=>b.id===el.dataset.collectionRead);const blob=await getBlob(book);await readBook({...book,source:'Collection',collectionId:c.selected.id},blob);}));
    root.querySelectorAll('[data-collection-offline]').forEach(el=>el.onclick=()=>run(async()=>{const book=c.selected.books.find(b=>b.id===el.dataset.collectionOffline);const blob=await getBlob(book), meta={id:`collection-${book.id}`,title:book.title,author:book.author,format:'pdf',source:'Collection',collectionId:c.selected.id,size:blob.size,addedAt:Date.now()};const existing=localBooks().find(b=>b.id===meta.id);if(!existing){await pdfSave(meta,blob);imported(meta);}c.notice='Saved to your offline library.';}));
    root.querySelector('[data-collection-invite]')?.addEventListener('submit',event=>{event.preventDefault();const email=new FormData(event.currentTarget).get('email');void run(async()=>{await request('members',{method:'POST',params:{library:c.selected.id},body:{email}});c.members=await request('members',{params:{library:c.selected.id}});c.notice='Curator invited. They can open this library from Your libraries after signing in.';});});
    root.querySelectorAll('[data-collection-revoke]').forEach(el=>el.onclick=()=>run(async()=>{await request('members',{method:'DELETE',params:{library:c.selected.id},body:{email:el.dataset.collectionRevoke}});c.members=await request('members',{params:{library:c.selected.id}});}));
    root.querySelector('[data-collection-report]')?.addEventListener('submit',event=>{event.preventDefault();const reason=new FormData(event.currentTarget).get('reason');void run(async()=>{if(!c.session){c.auth=true;throw new Error('Sign in to submit a report, or use the support link.');}await request('report',{method:'POST',params:{library:c.selected.id},body:{reason}});c.report=false;c.notice='Report received for review.';});});
  }
  window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('collection');void run(async()=>{if(id)await select(id,false);else c.selected=null;});});
  return { view, bind, init, state:c };
}
