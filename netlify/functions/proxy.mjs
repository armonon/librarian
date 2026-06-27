// Keyed/no-CORS source proxy. Keys come from Netlify env vars when available,
// otherwise from the gitignored _keys.mjs bundled at deploy. Never sent to the browser.
import { KEYS } from './_keys.mjs';
const k = name => process.env[name] || KEYS[name] || '';

const TARGETS = {
  dpla: q => ({ url: `https://api.dp.la/v2/items?q=${q}&sourceResource.type=text&page_size=100&api_key=${k('DPLA_KEY')}` }),
  europeana: q => ({ url: `https://api.europeana.eu/record/v2/search.json?query=${q}&rows=100&profile=rich&qf=TYPE%3ATEXT&wskey=${k('EUROPEANA_KEY')}` }),
  core: q => ({ url: `https://api.core.ac.uk/v3/search/works/?q=${q}&limit=60`, headers: { Authorization: `Bearer ${k('CORE_KEY')}` } }),
};

export default async (req) => {
  const u = new URL(req.url);
  const api = u.searchParams.get('api');
  const q = encodeURIComponent(u.searchParams.get('q') || '');
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json', 'cache-control': 'public, max-age=600' };
  const build = TARGETS[api];
  if (!build || !q) return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: cors });
  const { url, headers } = build(q);
  try {
    const r = await fetch(url, { headers: headers || {} });
    return new Response(await r.text(), { status: r.status, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: cors });
  }
};
