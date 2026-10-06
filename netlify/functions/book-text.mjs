// Only numbered Gutenberg text files; no arbitrary remote URL proxy.
export default async function handler(request) {
  const headers = { 'access-control-allow-origin': '*', 'content-type': 'text/plain; charset=utf-8' };
  const id = new URL(request.url).searchParams.get('id');
  if (request.method !== 'GET' || !/^[1-9]\d{0,6}$/.test(id || '')) return new Response('Invalid book', { status: 400, headers });
  try {
    const response = await fetch(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (!response.ok) return new Response('This edition is unavailable.', { status: 502, headers });
    const text = await response.text();
    if (text.length > 5000000 || !/Project Gutenberg/i.test(text) || /<html/i.test(text.slice(0, 500))) throw new Error('Invalid text');
    return new Response(text, { headers: { ...headers, 'cache-control': 'public, max-age=86400' } });
  } catch { return new Response('Could not retrieve this edition. Please try again later.', { status: 502, headers }); }
}
