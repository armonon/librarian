import { RequestError, boundedJson } from './ai-guard.mjs';
export function publishableKey(key) {
  if (typeof key !== 'string') return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try { return key.startsWith('eyJ') && JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { return false; }
}
export const MAX_PDF = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function id(value) { if (!uuid.test(value || '')) throw new RequestError(400, 'Invalid identifier.'); return value; }
export function libraryInput(value) {
  const text = (key, max, required = false) => {
    const s = value?.[key];
    if (typeof s !== 'string' || s.length > max || (required && !s.trim())) throw new RequestError(400, `Invalid ${key}.`);
    return s.trim();
  };
  const row = { title: text('title', 120, true), description: text('description', 2000), curator: text('curator', 80, true), bio: text('bio', 1000), topic: text('topic', 80), theme: value.theme, layout: value.layout, visibility: value.visibility };
  if (!['paper', 'midnight', 'forest'].includes(row.theme) || !['shelves', 'gallery', 'reading-path'].includes(row.layout) || !['public', 'unlisted', 'private'].includes(row.visibility)) throw new RequestError(400, 'Invalid library design.');
  return row;
}
export function bookInput(value) {
  const clean = {};
  for (const [key, max] of [['title', 200], ['author', 200], ['description', 2000], ['shelf', 100]]) {
    if (typeof value?.[key] !== 'string' || value[key].length > max || (key === 'title' && !value[key].trim())) throw new RequestError(400, `Invalid ${key}.`);
    clean[key] = value[key].trim();
  }
  if (!/^#[0-9a-f]{6}$/i.test(value.color || '') || !Number.isInteger(value.position) || value.position < 0 || value.position > 10000) throw new RequestError(400, 'Invalid book appearance or order.');
  return { ...clean, color: value.color, position: value.position };
}
export async function pdfBytes(request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/pdf') throw new RequestError(415, 'Upload a PDF.');
  const reader = request.body?.getReader(); if (!reader) throw new RequestError(400, 'PDF required.');
  let size = 0; const chunks = [];
  try {
    for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > MAX_PDF) { await reader.cancel(); throw new RequestError(413, 'PDFs must be 4 MB or smaller.'); } chunks.push(part.value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  if (size < 12 || !new TextDecoder().decode(bytes.slice(0, 5)).startsWith('%PDF-') || !new TextDecoder().decode(bytes.slice(-2048)).includes('%%EOF')) throw new RequestError(400, 'This file is not a complete PDF.');
  return bytes;
}
export function createCollectionsHandler({ env = process.env, fetcher = (...args) => fetch(...args) } = {}) {
  return async request => {
    const url = new URL(request.url), action = url.searchParams.get('action') || 'browse';
    const headers = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    const origin = request.headers.get('origin');
    const allowed = new Set([url.origin, 'capacitor://localhost', 'null', ...(env.LIBRARIAN_ALLOWED_ORIGINS || '').split(',').filter(Boolean)]);
    if (origin && !allowed.has(origin)) return Response.json({ error: 'Origin not allowed.' }, { status: 403, headers });
    if (origin && allowed.has(origin)) Object.assign(headers, { 'access-control-allow-origin': origin, vary: 'Origin' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'access-control-allow-headers': 'Authorization, Content-Type' } });
    try {
      const base = env.SUPABASE_URL, key = env.SUPABASE_PUBLISHABLE_KEY;
      const enabled = env.LIBRARIAN_COLLECTIONS_ENABLED === 'true' && !!base && publishableKey(key);
      if (action === 'config' && request.method === 'GET') return Response.json({ enabled }, { headers });
      if (!enabled) throw new RequestError(503, 'Shared libraries are not connected yet. You can still design a draft on this device.');
      const service = new URL(base);
      if (service.protocol !== 'https:' || service.pathname !== '/' || service.username || service.password) throw new RequestError(503, 'Library service is not configured.');
      const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9._-]{20,8192})$/)?.[1];
      const authHeaders = { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) };
      async function upstream(path, options = {}) {
        let response;
        try { response = await fetcher(new URL(path, service), { ...options, headers: { ...authHeaders, ...options.headers }, signal: AbortSignal.timeout(20000) }); }
        catch { throw new RequestError(503, 'Library service unavailable. Try again.'); }
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          if (detail.code === '23505') throw new RequestError(409, 'This entry already exists.');
          if (response.status === 401) throw new RequestError(401, 'Please sign in again.');
          if (response.status === 403 || detail.code === '42501') throw new RequestError(403, 'You do not have access to change this library.');
          throw new RequestError(response.status === 404 ? 404 : 400, path.startsWith('/auth') ? 'Could not verify your account. Check your email or request a new code.' : 'Could not complete this change. Check the fields, access, and collection limits.');
        }
        return response;
      }
      const json = async (path, method = 'GET', body) => {
        const res = await upstream(path, { method, headers: { 'content-type': 'application/json', Prefer: 'return=representation' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
        return res.status === 204 ? null : res.json();
      };
      let user;
      const account = async () => {
        if (!token) throw new RequestError(401, 'Sign in to curate or save libraries.');
        user ||= await json('/auth/v1/user');
        if (user.factors?.some(f => f.status === 'verified')) throw new RequestError(403, 'This account requires an additional authentication factor. Use an account without enrolled MFA until that flow is available.');
        if (!user.id || !user.email_confirmed_at || user.is_anonymous) throw new RequestError(403, 'Verify your email before publishing.');
        return user;
      };
      const libraryId = () => id(url.searchParams.get('library'));
      const getLibrary = async lib => {
        const rows = await json(`/rest/v1/librarian_collections?id=eq.${lib}&select=*`);
        if (!rows.length) throw new RequestError(404, 'This library is unavailable or private.');
        return rows[0];
      };
      const editor = async lib => {
        const u = await account(), row = await getLibrary(lib);
        if (row.owner_id !== u.id) {
          const members = await json(`/rest/v1/librarian_members?collection_id=eq.${lib}&email=eq.${encodeURIComponent(u.email.toLowerCase())}&select=email`);
          if (!members.length) throw new RequestError(403, 'Only curators can edit this library.');
        }
        return row;
      };
      const owner = async lib => { const row = await editor(lib); if (row.owner_id !== user.id) throw new RequestError(403, 'Only the owner can change sharing or invitations.'); return row; };
      let data;
      if (['send-code', 'verify-code', 'refresh'].includes(action) && request.method === 'POST') {
        const body = await boundedJson(request);
        if (action === 'refresh') {
          if (typeof body.refresh_token !== 'string' || body.refresh_token.length > 8192) throw new RequestError(400, 'Invalid session.');
          data = await json('/auth/v1/token?grant_type=refresh_token', 'POST', { refresh_token: body.refresh_token });
        } else {
          if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new RequestError(400, 'Enter your email address.');
          if (action === 'send-code') {
            await json('/auth/v1/otp', 'POST', { email: body.email.trim(), create_user: true });
            data = { sent: true };
          } else {
            if (typeof body.code !== 'string' || !/^\d{8}$/.test(body.code)) throw new RequestError(400, 'Enter the eight-digit email code.');
            data = await json('/auth/v1/verify', 'POST', { email: body.email.trim(), token: body.code, type: 'email' });
          }
        }
      } else if (action === 'logout' && request.method === 'POST') { await account(); await upstream('/auth/v1/logout?scope=local', { method: 'POST' }); data = { ok: true };
      } else if (action === 'browse' && request.method === 'GET') {
        const q = (url.searchParams.get('q') || '').slice(0, 120);
        data = await json('/rest/v1/librarian_collections?select=*&published=eq.true&visibility=eq.public&order=updated_at.desc&limit=60' + (q ? `&or=${encodeURIComponent('(title.ilike.*' + q.replace(/[^\p{L}\p{N}\s-]/gu, '') + '*,curator.ilike.*' + q.replace(/[^\p{L}\p{N}\s-]/gu, '') + '*,topic.ilike.*' + q.replace(/[^\p{L}\p{N}\s-]/gu, '') + '*)')}` : ''));
      } else if (action === 'mine' && request.method === 'GET') { await account(); data = await json('/rest/v1/rpc/librarian_my_collections', 'POST', {});
      } else if (action === 'collection' && request.method === 'GET') {
        const lib = libraryId(), row = await getLibrary(lib);
        const books = await json(`/rest/v1/librarian_books?collection_id=eq.${lib}&select=*&order=position.asc,created_at.asc`);
        data = { ...row, books };
      } else if (action === 'create' && request.method === 'POST') { await account(); const input = libraryInput(await boundedJson(request)); data = (await json('/rest/v1/librarian_collections', 'POST', { ...input, owner_id: user.id }))[0];
      } else if (action === 'update' && request.method === 'PATCH') {
        const lib = libraryId(); await owner(lib); const body = await boundedJson(request); const input = libraryInput(body);
        if (typeof body.published !== 'boolean') throw new RequestError(400, 'Invalid publish state.');
        data = (await json(`/rest/v1/librarian_collections?id=eq.${lib}`, 'PATCH', { ...input, published: body.published }))[0];
      } else if (action === 'upload' && request.method === 'POST') {
        const lib = libraryId(); await editor(lib);
        if (url.searchParams.get('rights') !== 'confirmed') throw new RequestError(400, 'Confirm permission to share this PDF.');
        const bytes = await pdfBytes(request), book = crypto.randomUUID(), path = `${lib}/${book}.pdf`;
        await upstream(`/storage/v1/object/librarian-pdfs/${path}`, { method: 'POST', headers: { 'content-type': 'application/pdf', 'x-upsert': 'false' }, body: bytes });
        try {
          data = (await json('/rest/v1/librarian_books', 'POST', { id: book, collection_id: lib, title: (url.searchParams.get('title') || 'Untitled PDF').slice(0, 200), storage_path: path, size: bytes.length, rights_confirmed: true }))[0];
        } catch (error) { await upstream('/storage/v1/object/librarian-pdfs', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) }).catch(() => {}); throw error; }
      } else if (action === 'book' && request.method === 'PATCH') {
        const book = id(url.searchParams.get('book')), lib = libraryId(); await editor(lib);
        data = (await json(`/rest/v1/librarian_books?id=eq.${book}&collection_id=eq.${lib}`, 'PATCH', bookInput(await boundedJson(request))))[0];
        if (!data) throw new RequestError(404, 'Book unavailable.');
      } else if (action === 'book' && request.method === 'DELETE') {
        const book = id(url.searchParams.get('book')), lib = libraryId(); await editor(lib);
        const rows = await json(`/rest/v1/librarian_books?id=eq.${book}&collection_id=eq.${lib}&select=*`);
        if (!rows.length) throw new RequestError(404, 'Book unavailable.');
        await json(`/rest/v1/librarian_books?id=eq.${book}&collection_id=eq.${lib}`, 'DELETE');
        await upstream('/storage/v1/object/librarian-pdfs', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [rows[0].storage_path] }) }); data = { ok: true };
      } else if (action === 'read' && request.method === 'GET') {
        const book = id(url.searchParams.get('book'));
        const rows = await json(`/rest/v1/librarian_books?id=eq.${book}&select=*`);
        if (!rows.length) throw new RequestError(404, 'Book unavailable or private.');
        const res = await upstream(`/storage/v1/object/authenticated/librarian-pdfs/${rows[0].storage_path}`);
        return new Response(res.body, { headers: { ...headers, 'content-type': 'application/pdf', 'content-disposition': 'inline', 'cache-control': 'private, no-store', ...(res.headers.get('content-length') ? { 'content-length': res.headers.get('content-length') } : {}) } });
      } else if (['follow', 'save'].includes(action)) {
        const u = await account(), lib = libraryId(); await getLibrary(lib);
        const table = action === 'follow' ? 'librarian_follows' : 'librarian_favorites';
        if (request.method === 'POST') await json(`/rest/v1/${table}`, 'POST', { user_id: u.id, collection_id: lib });
        else if (request.method === 'DELETE') await json(`/rest/v1/${table}?user_id=eq.${u.id}&collection_id=eq.${lib}`, 'DELETE');
        else throw new RequestError(405, 'Method not allowed.'); data = { ok: true };
      } else if (action === 'social' && request.method === 'GET') {
        const u = await account(); data = {};
        for (const [keyName, table] of [['following', 'librarian_follows'], ['saved', 'librarian_favorites']]) data[keyName] = await json(`/rest/v1/${table}?user_id=eq.${u.id}&select=collection_id,librarian_collections(*)`);
      } else if (action === 'members' && request.method === 'GET') { const lib = libraryId(); await editor(lib); data = await json(`/rest/v1/librarian_members?collection_id=eq.${lib}&select=email`);
      } else if (action === 'members' && ['POST', 'DELETE'].includes(request.method)) {
        const lib = libraryId(); await owner(lib); const body = await boundedJson(request);
        if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new RequestError(400, 'Enter the co-curator’s email.');
        const email = body.email.trim().toLowerCase();
        data = await json('/rest/v1/librarian_members' + (request.method === 'DELETE' ? `?collection_id=eq.${lib}&email=eq.${encodeURIComponent(email)}` : ''), request.method, request.method === 'POST' ? { collection_id: lib, email } : undefined);
      } else if (action === 'report' && request.method === 'POST') {
        const u = await account(), lib = libraryId(); await getLibrary(lib); const body = await boundedJson(request);
        if (typeof body.reason !== 'string' || body.reason.trim().length < 10 || body.reason.length > 2000) throw new RequestError(400, 'Describe the issue in 10–2000 characters.');
        await json('/rest/v1/librarian_reports', 'POST', { reporter_id: u.id, collection_id: lib, reason: body.reason.trim() }); data = { ok: true };
      } else if (action === 'delete' && request.method === 'DELETE') {
        const lib = libraryId(); await owner(lib);
        const books = await json(`/rest/v1/librarian_books?collection_id=eq.${lib}&select=storage_path`);
        // Unpublish before removing bytes so a failed cleanup cannot leave public broken books.
        await json(`/rest/v1/librarian_collections?id=eq.${lib}`, 'PATCH', { published: false });
        if (books.length) await upstream('/storage/v1/object/librarian-pdfs', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: books.map(b => b.storage_path) }) });
        await json(`/rest/v1/librarian_collections?id=eq.${lib}`, 'DELETE'); data = { ok: true };
      } else throw new RequestError(405, 'Method not allowed.');
      return Response.json(data ?? { ok: true }, { headers });
    } catch (error) { return Response.json({ error: error instanceof RequestError ? error.message : 'Library service unavailable.' }, { status: error instanceof RequestError ? error.status : 503, headers }); }
  };
}
