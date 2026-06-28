// AI Librarian — recommends specific titles from the user's current search results.
// Uses the ANTHROPIC_API_KEY that Netlify's AI Gateway injects into functions (free, no setup).
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'content-type': 'application/json' };

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: cors });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'No ANTHROPIC_API_KEY available' }), { status: 500, headers: cors });
  let body = {};
  try { body = await req.json(); } catch {}
  const { question = '', books = [], shelf = [], query = '' } = body;

  const list = books.slice(0, 80).map((b, i) => `${i + 1}. "${b.title}" — ${b.authors || 'Unknown'}${b.year ? ` (${b.year})` : ''}${b.category ? ` [${b.category}]` : ''}${b.availability ? ` · ${b.availability}` : ''}`).join('\n');
  const shelfList = shelf.slice(0, 20).map(b => `- "${b.title}" — ${b.authors || 'Unknown'}`).join('\n');

  const prompt = `You are Librarian, a sharp, warm, well-read recommender. A user searched a multi-source book catalog${query ? ` for "${query}"` : ''} and these are the results:

${list || '(no results)'}
${shelfList ? `\nBooks already on their shelf:\n${shelfList}\n` : ''}
Their request: ${question || 'Recommend the best books from these results and tell me why.'}

Recommend 3-6 specific titles, chosen ONLY from the numbered results above (quote the exact title). For each: one or two sharp sentences on why it stands out and who it's for. Order or group them usefully (e.g. best starting point first, or a short reading path). Be specific and opinionated, not generic. If the results are thin or off-topic, say so honestly and suggest a better search.`;

  const base = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
  try {
    const r = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: data.error?.message || `Upstream ${r.status}`, status: r.status }), { status: 502, headers: cors });
    const text = (data.content || []).map(c => c.text || '').join('').trim();
    return new Response(JSON.stringify({ text }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: cors });
  }
};
