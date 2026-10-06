const MAX_BODY = 32768;
export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function boundedJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RequestError(415, 'JSON required.');
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new RequestError(413, 'Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, 'Request body required.');
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new RequestError(413, 'Request too large.'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, 'Invalid JSON.');
  } finally { reader.releaseLock(); }
}

export function validateQuestion(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(k => !['books', 'shelf', 'query', 'question'].includes(k))) throw new RequestError(400, 'Invalid recommendation request.');
  for (const [key, max] of [['query', 500], ['question', 2000]]) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > max)) throw new RequestError(400, 'Question or query is too long.');
  }
  for (const [key, max] of [['books', 80], ['shelf', 20]]) {
    const entries = body[key] ?? [];
    if (!Array.isArray(entries) || entries.length > max) throw new RequestError(400, 'Invalid book list.');
    for (const book of entries) {
      if (!book || typeof book !== 'object' || Array.isArray(book) || typeof book.title !== 'string' || book.title.length > 500) throw new RequestError(400, 'Invalid book.');
      for (const [field, value] of Object.entries(book)) {
        if (!['title', 'authors', 'year', 'category', 'availability'].includes(field) || !['string', 'number'].includes(typeof value) || String(value).length > 1000) throw new RequestError(400, 'Invalid book field.');
      }
    }
  }
  if (!body.books?.length) throw new RequestError(400, 'Search for books first.');
  return body;
}

export function createAiGuard({ env = process.env, fetcher = (...args) => fetch(...args) } = {}) {
  return async request => {
    const origin = request.headers.get('origin');
    const allowed = new Set([new URL(request.url).origin, ...(env.LIBRARIAN_ALLOWED_ORIGINS || '').split(',').filter(Boolean)]);
    if (origin && !allowed.has(origin)) throw new RequestError(403, 'Origin not allowed.');
    const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9._-]{20,8192})$/)?.[1];
    if (!token) throw new RequestError(401, 'A verified Momentium account is required for AI recommendations.');
    const base = env.SUPABASE_URL;
    if (env.LIBRARIAN_AI_ENABLED !== 'true' || !base || !env.SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) throw new RequestError(503, 'AI recommendations are unavailable while secure account access is being configured. Book search and your PDF library remain available.');
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new RequestError(503, 'Account service is not configured.');
    let auth;
    try {
      auth = await fetcher(new URL('/auth/v1/user', url), { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
    } catch { throw new RequestError(503, 'Account verification unavailable.'); }
    if (!auth.ok) throw new RequestError(auth.status === 401 || auth.status === 403 ? 401 : 503, 'Account verification unavailable.');
    const user = await auth.json();
    if (!user.id || !user.email || !user.email_confirmed_at || user.is_anonymous) throw new RequestError(403, 'Verify your email before using AI recommendations.');
    const body = validateQuestion(await boundedJson(request));
    let quota;
    try {
      const response = await fetcher(new URL('/rest/v1/rpc/consume_librarian_ai_quota', url), {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ account_id: user.id }),
      });
      if (!response.ok) throw new Error('Quota unavailable');
      quota = await response.json();
    } catch { throw new RequestError(503, 'Recommendation quota service unavailable.'); }
    if (quota !== true) throw new RequestError(429, 'Recommendation limit reached. Please try again later.');
    return body;
  };
}
