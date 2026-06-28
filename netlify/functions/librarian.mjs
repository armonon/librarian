// AI Librarian — recommends specific titles from the user's current search results.
// Durability: tries multiple free providers via Netlify's AI Gateway in order, falling
// back if one is rate-limited / exhausted / erroring. No API keys or cost to set up.
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'content-type': 'application/json' };
const GW = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL || process.env.NETLIFY_AI_GATEWAY_URL || 'https://api.anthropic.com';

async function viaAnthropic(prompt, model) {
  const r = await fetch(`${GW}/v1/messages`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d = await r.json(); const t = (d.content || []).map(c => c.text || '').join('').trim();
  if (!t) throw new Error('anthropic: empty'); return t;
}
async function viaOpenAICompat(prompt, model, key) {
  const base = process.env.OPENAI_BASE_URL || GW;
  const r = await fetch(`${base}/v1/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`${model} ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d = await r.json(); const t = d.choices?.[0]?.message?.content?.trim();
  if (!t) throw new Error(`${model}: empty`); return t;
}
// Ordered fallback chain — three SEPARATE free quota pools through the gateway.
// If one provider is rate-limited / exhausted / down, the next takes over automatically.
const PROVIDERS = [
  { name: 'claude-haiku', run: p => viaAnthropic(p, 'claude-haiku-4-5-20251001') },
  { name: 'gpt-4o-mini', run: p => viaOpenAICompat(p, 'gpt-4o-mini', process.env.OPENAI_API_KEY) },
  { name: 'gemini-2.5-flash', run: p => viaOpenAICompat(p, 'gemini-2.5-flash', process.env.GEMINI_API_KEY) },
];

function buildPrompt({ books, shelf, query, question }) {
  const list = (books || []).slice(0, 80).map((b, i) => `${i + 1}. "${b.title}" — ${b.authors || 'Unknown'}${b.year ? ` (${b.year})` : ''}${b.category ? ` [${b.category}]` : ''}${b.availability ? ` · ${b.availability}` : ''}`).join('\n');
  const shelfList = (shelf || []).slice(0, 20).map(b => `- "${b.title}" — ${b.authors || 'Unknown'}`).join('\n');
  return `You are Librarian, a sharp, warm, well-read recommender. A user searched a multi-source book catalog${query ? ` for "${query}"` : ''} and these are the results:

${list || '(no results)'}
${shelfList ? `\nBooks already on their shelf:\n${shelfList}\n` : ''}
Their request: ${question || 'Recommend the best books from these results and tell me why.'}

Recommend 3-6 specific titles, chosen ONLY from the numbered results above (quote the exact title). For each: one or two sharp sentences on why it stands out and who it's for. Order or group them usefully (e.g. best starting point first, or a short reading path). Be specific and opinionated, not generic. If the results are thin or off-topic, say so honestly and suggest a better search.`;
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: cors });
  let body = {};
  try { body = await req.json(); } catch {}

  if (body.test) {
    const out = {};
    for (const p of PROVIDERS) { try { out[p.name] = (await p.run('Reply with exactly: OK')).slice(0, 40); } catch (e) { out[p.name] = `ERR ${String(e.message || e).slice(0, 120)}`; } }
    return new Response(JSON.stringify(out, null, 2), { headers: cors });
  }

  const prompt = buildPrompt(body);
  const errors = [];
  for (const p of PROVIDERS) {
    try { const text = await p.run(prompt); return new Response(JSON.stringify({ text, model: p.name }), { headers: cors }); }
    catch (e) { errors.push(`${p.name}: ${String(e.message || e)}`); }
  }
  return new Response(JSON.stringify({ error: 'All providers failed', detail: errors }), { status: 502, headers: cors });
};
