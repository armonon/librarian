import { createAiGuard, RequestError } from '../lib/ai-guard.mjs';
const guard = createAiGuard();
const cors = { 'content-type': 'application/json', 'cache-control': 'no-store' };
export const config = { rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
const GW = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL || process.env.NETLIFY_AI_GATEWAY_URL || 'https://api.anthropic.com';

async function viaAnthropic(prompt, model) {
  const r = await fetch(`${GW}/v1/messages`, { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d = await r.json(); const t = (d.content || []).map(c => c.text || '').join('').trim();
  if (!t) throw new Error('anthropic: empty'); return t;
}
async function viaOpenAICompat(prompt, model, key) {
  const base = process.env.OPENAI_BASE_URL || GW;
  const r = await fetch(`${base}/v1/chat/completions`, { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`${model} ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d = await r.json(); const t = d.choices?.[0]?.message?.content?.trim();
  if (!t) throw new Error(`${model}: empty`); return t;
}
// One reserved account request permits at most this bounded fallback chain.
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
  let body;
  try { body = await guard(req); }
  catch (error) { return new Response(JSON.stringify({ error: error instanceof RequestError ? error.message : 'Recommendation service unavailable.' }), { status: error instanceof RequestError ? error.status : 503, headers: cors }); }

  const prompt = buildPrompt(body);
  for (const p of PROVIDERS) {
    try { const text = await p.run(prompt); return new Response(JSON.stringify({ text, model: p.name }), { headers: cors }); }
    catch { /* Try the next configured provider without exposing credentials or upstream response bodies. */ }
  }
  return new Response(JSON.stringify({ error: 'Recommendations are temporarily unavailable. Please try again later.' }), { status: 502, headers: cors });
};
