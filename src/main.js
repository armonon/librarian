import './styles.css';

const SOURCES = [
  { name: 'Open Library', badge: 'core', priority: 'Core index backbone', url: 'https://openlibrary.org/developers/api', coverage: 'Open works, editions, ISBNs, authors, subjects, covers, ratings, and Internet Archive read/borrow links.', access: 'Free API; identify with User-Agent for higher rate limits. Use monthly dumps for bulk indexing.', best: ['works + editions', 'covers', 'ISBNs', 'subjects'] },
  { name: 'Internet Archive', badge: 'full text', priority: 'Availability layer', url: 'https://archive.org/developers/', coverage: 'Digitized books, scans, PDFs, EPUBs, OCR text, collections, and item metadata.', access: 'Free metadata/APIs; respect controlled digital lending and per-item licenses.', best: ['read links', 'OCR text', 'collections', 'downloads'] },
  { name: 'Google Books', badge: 'coverage', priority: 'Coverage enrichment', url: 'https://developers.google.com/books/docs/v1/using', coverage: 'Massive volume discovery index with thumbnails, previews, categories, sale info, and public bookshelves.', access: 'Use an API key for production public-data quotas; OAuth only for private shelves.', best: ['previews', 'mainstream coverage', 'covers', 'sale info'] },
  { name: 'Project Gutenberg / Gutendex', badge: 'public domain', priority: 'Free classics layer', url: 'https://gutendex.com/', coverage: 'Public-domain ebook metadata, subjects, formats, languages, and popularity/download counts.', access: 'Free JSON API; run a mirror for serious production usage.', best: ['free ebooks', 'EPUB/HTML', 'classics', 'languages'] },
  { name: 'Library of Congress', badge: 'authority', priority: 'Catalog authority layer', url: 'https://www.loc.gov/apis/', coverage: 'Structured collection records, dates, formats, places, subjects, and library-grade provenance.', access: 'Free loc.gov JSON API; excellent for enrichment and facets.', best: ['authority data', 'collections', 'facets', 'history'] },
  { name: 'Wikidata', badge: 'graph', priority: 'Knowledge graph layer', url: 'https://www.wikidata.org/wiki/Wikidata:Data_access', coverage: 'Cross-links for works, authors, awards, series, adaptations, external IDs, and cultural context.', access: 'SPARQL endpoint with etiquette limits; use dumps for bulk graph work.', best: ['entity resolution', 'awards', 'series', 'external IDs'] },
  { name: 'Crossref + DataCite', badge: 'scholarly', priority: 'Academic books layer', url: 'https://api.crossref.org/', coverage: 'DOIs, monographs, chapters, publishers, references, and citation-style metadata.', access: 'Free polite pool; include mailto for production integrations.', best: ['chapters', 'DOIs', 'publishers', 'citations'] },
  { name: 'Standard Ebooks + LibriVox', badge: 'experience', priority: 'Beautiful editions + audio', url: 'https://standardebooks.org/ebooks', coverage: 'Polished public-domain ebook editions and public-domain audiobook availability.', access: 'Use OPDS/RSS-style catalogs and cache respectfully.', best: ['beautiful ebooks', 'audiobooks', 'public domain'] },
];

const FEATURES = [
  ['Atlas Search', 'One query fans out to Open Library, Google Books, and Gutenberg, then merges duplicate editions by ISBN/title/author.'],
  ['Metadata Quality Score', 'Every result is scored by completeness so the best catalog record naturally rises.'],
  ['Availability First', 'Filter toward free ebooks, public-domain downloads, previews, borrowable scans, or catalog-only records.'],
  ['Personal Stacks', 'Save discoveries locally into a working collection for research, shopping, or syllabus building.'],
  ['Source Provenance', 'Every card shows exactly which API supplied the record and where to verify it.'],
  ['Expansion Playbook', 'The site includes a ranked source map and architecture for turning this into a serious book graph.'],
];

const SAMPLES = ['octavia butler', 'persian poetry', 'systems thinking', 'james baldwin', 'public domain astronomy', 'isbn:9780140328721'];
const app = document.querySelector('#app');
const storeKey = 'librarian.saved.v1';
const state = { query: '', loading: false, searched: false, results: [], error: '', saved: loadSaved(), filters: { source: 'all', availability: 'all', language: 'all' }, selected: null };

function loadSaved() { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } }
function persist() { localStorage.setItem(storeKey, JSON.stringify(state.saved)); }
function esc(v = '') { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uniq(a = []) { return [...new Set(a.flat().filter(Boolean).map(String))]; }
function year(v) { return String(v || '').match(/-?\d{3,4}/)?.[0] || ''; }
function isbn(ids = []) { return ids.find(id => /^97[89]/.test(String(id).replace(/[^0-9X]/gi, ''))) || ids[0] || ''; }
function key(book) { const i = isbn(book.ids); return i ? `isbn:${i.replace(/[^0-9X]/gi, '').toUpperCase()}` : `${book.title}|${book.authors?.[0] || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function compact(text = '', max = 180) { text = Array.isArray(text) ? text.join(', ') : String(text); return text.length > max ? `${text.slice(0, max).trim()}…` : text; }
function score(book) { return Math.round(([book.title, book.authors?.length, book.cover, book.year, book.subjects?.length, book.ids?.length, book.desc, book.langs?.length, book.links?.length, !/catalog only/i.test(book.availability || '')].filter(Boolean).length / 10) * 100); }
async function json(url) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 9500); try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); } finally { clearTimeout(t); } }

async function openLibrary(q) {
  const data = await json(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=18&fields=key,title,author_name,first_publish_year,publish_year,isbn,language,subject,cover_i,edition_count,ia,ebook_access,ratings_average`);
  return (data.docs || []).map(d => ({
    id: `ol:${d.key}`, title: d.title, authors: uniq(d.author_name).slice(0, 4), year: d.first_publish_year || '', subjects: uniq(d.subject).slice(0, 10), langs: uniq(d.language).slice(0, 4), ids: uniq(d.isbn).slice(0, 8),
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
    desc: `${d.edition_count || 1} edition${d.edition_count === 1 ? '' : 's'} indexed by Open Library${d.ratings_average ? ` • average rating ${d.ratings_average.toFixed(1)}` : ''}.`,
    availability: d.ebook_access === 'public' || d.ia?.length ? 'Readable / borrowable' : 'Catalog only',
    links: [{ label: 'Open Library', url: `https://openlibrary.org${d.key}` }, ...(d.ia?.[0] ? [{ label: 'Internet Archive item', url: `https://archive.org/details/${d.ia[0]}` }] : [])],
    sources: ['Open Library']
  }));
}

async function googleBooks(q) {
  const data = await json(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=18&printType=books&projection=lite`);
  return (data.items || []).map(item => { const v = item.volumeInfo || {}, a = item.accessInfo || {}, s = item.saleInfo || {}; return {
    id: `gb:${item.id}`, title: v.title, authors: uniq(v.authors).slice(0, 4), year: year(v.publishedDate), subjects: uniq(v.categories).slice(0, 8), langs: uniq([v.language]), ids: uniq((v.industryIdentifiers || []).map(x => x.identifier)).slice(0, 8),
    cover: (v.imageLinks?.thumbnail || '').replace('http://', 'https://'), desc: compact(v.description || `${v.publisher || 'Publisher metadata'}${v.pageCount ? ` • ${v.pageCount} pages` : ''}.`, 260),
    availability: a.epub?.isAvailable || a.pdf?.isAvailable ? 'Preview / ebook metadata' : s.saleability === 'FOR_SALE' ? 'For sale' : 'Catalog only',
    links: [...(v.previewLink ? [{ label: 'Google preview', url: v.previewLink }] : []), ...(v.infoLink ? [{ label: 'Google Books', url: v.infoLink }] : [])], sources: ['Google Books']
  }; });
}

async function gutenberg(q) {
  const data = await json(`https://gutendex.com/books?search=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  return (data.results || []).slice(0, 18).map(b => ({
    id: `pg:${b.id}`, title: b.title, authors: uniq((b.authors || []).map(a => a.name)).slice(0, 4), year: b.authors?.[0]?.birth_year || '', subjects: uniq([...(b.subjects || []), ...(b.bookshelves || [])]).slice(0, 10), langs: uniq(b.languages), ids: [`Project Gutenberg ${b.id}`],
    cover: b.formats?.['image/jpeg'] || '', desc: `Public-domain ebook from Project Gutenberg • ${(b.download_count || 0).toLocaleString()} downloads.`, availability: 'Free public-domain ebook',
    links: [{ label: 'Project Gutenberg', url: `https://www.gutenberg.org/ebooks/${b.id}` }, ...(b.formats?.['text/html'] ? [{ label: 'Read HTML', url: b.formats['text/html'] }] : []), ...(b.formats?.['application/epub+zip'] ? [{ label: 'Download EPUB', url: b.formats['application/epub+zip'] }] : [])], sources: ['Project Gutenberg']
  }));
}

function merge(all) {
  const map = new Map();
  for (const b of all.filter(x => x?.title)) {
    const k = key(b);
    const old = map.get(k);
    if (!old) { b.score = score(b); map.set(k, b); continue; }
    const next = { ...old, title: old.title || b.title, year: old.year || b.year, cover: old.cover || b.cover, desc: old.desc || b.desc, availability: /free|read|borrow|preview/i.test(old.availability) ? old.availability : b.availability, authors: uniq([old.authors, b.authors]), subjects: uniq([old.subjects, b.subjects]).slice(0, 14), ids: uniq([old.ids, b.ids]), langs: uniq([old.langs, b.langs]), links: uniqLinks([...(old.links || []), ...(b.links || [])]), sources: uniq([old.sources, b.sources]) };
    next.score = score(next); map.set(k, next);
  }
  return [...map.values()].sort((a, b) => b.score - a.score || Number(b.year || 0) - Number(a.year || 0));
}
function uniqLinks(links) { return links.filter((l, i, a) => l?.url && a.findIndex(x => x.url === l.url) === i); }

async function search(q) {
  q = String(q || '').trim(); if (!q) return;
  Object.assign(state, { query: q, loading: true, searched: true, error: '' }); render();
  const out = await Promise.allSettled([openLibrary(q), googleBooks(q), gutenberg(q)]);
  state.results = merge(out.flatMap(r => r.status === 'fulfilled' ? r.value : []));
  state.loading = false;
  state.error = !state.results.length ? 'The live APIs returned nothing useful. Try a broader title, author, subject, or ISBN.' : '';
  render();
  document.querySelector('#results')?.scrollIntoView({ block: 'start' });
}

function filtered() { return state.results.filter(b => (state.filters.source === 'all' || b.sources.includes(state.filters.source)) && (state.filters.language === 'all' || b.langs.includes(state.filters.language)) && (state.filters.availability === 'all' || (state.filters.availability === 'free' ? /free|public|read|borrow/i.test(b.availability) : /preview|sale|catalog/i.test(b.availability)))); }
function sources() { return uniq(state.results.flatMap(b => b.sources)); }
function languages() { return uniq(state.results.flatMap(b => b.langs)).slice(0, 12); }
function save(id) { const b = state.results.find(x => x.id === id); if (b && !state.saved.some(x => key(x) === key(b))) { state.saved.unshift(b); state.saved = state.saved.slice(0, 36); persist(); render(); } }
function remove(id) { state.saved = state.saved.filter(b => b.id !== id); persist(); render(); }

function hero() { return `<section class="hero"><div><p class="eyebrow">Librarian v0.1 • open book atlas</p><h1>The web’s book knowledge, organized into one beautiful discovery engine.</h1><p class="lede">Search open catalogs, public-domain libraries, and commercial-scale metadata. Compare editions, find free reads, save stacks, and see the source behind every record.</p><form class="search" data-form><input name="q" value="${esc(state.query)}" placeholder="Search title, author, subject, or ISBN…" /><button>${state.loading ? 'Searching…' : 'Search the atlas'}</button></form><div class="samples">${SAMPLES.map(q => `<button data-query="${esc(q)}">${esc(q)}</button>`).join('')}</div></div><aside class="heroPanel"><div class="orb"></div><div class="stat"><b>8</b><span>priority sources mapped</span></div><div class="stat"><b>3</b><span>live APIs wired now</span></div><div class="stat"><b>${state.saved.length}</b><span>books in your local stack</span></div><p>Roadmap: add a backend indexer to hydrate Open Library dumps, IA full text, Wikidata IDs, LOC authority data, and DOI metadata into a ranked graph.</p></aside></section>`; }
function features() { return `<section class="section"><div class="heading"><p class="eyebrow">What changed</p><h2>Not just search — an organization layer for books.</h2></div><div class="grid features">${FEATURES.map(([h, p]) => `<article><i></i><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}</div></section>`; }
function results() { if (!state.searched) return ''; const books = filtered(); return `<section class="section" id="results"><div class="heading row"><div><p class="eyebrow">Live atlas</p><h2>${state.loading ? 'Asking the libraries…' : `${books.length} organized result${books.length === 1 ? '' : 's'}`}</h2></div><div class="filters"><select data-filter="source"><option value="all">All sources</option>${sources().map(s => `<option ${state.filters.source === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><select data-filter="availability"><option value="all">All availability</option><option value="free" ${state.filters.availability === 'free' ? 'selected' : ''}>Readable/free</option><option value="preview" ${state.filters.availability === 'preview' ? 'selected' : ''}>Preview/catalog</option></select><select data-filter="language"><option value="all">All languages</option>${languages().map(l => `<option ${state.filters.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div></div>${state.error ? `<p class="notice">${esc(state.error)}</p>` : ''}${state.loading ? `<div class="grid books">${Array.from({ length: 6 }, () => '<article class="book skeleton"></article>').join('')}</div>` : `<div class="grid books">${books.map(book).join('') || '<p class="notice">No matches after filters. Try widening the lens.</p>'}</div>`}</section>`; }
function book(b) { const saved = state.saved.some(x => key(x) === key(b)); return `<article class="book"><div class="cover">${b.cover ? `<img src="${esc(b.cover)}" alt="Cover for ${esc(b.title)}" loading="lazy" />` : `<em>${esc((b.title || '?')[0])}</em>`}</div><div class="body"><div class="meta"><span>${esc(b.availability || 'Catalog only')}</span><span>${b.score}% complete</span></div><h3>${esc(b.title)}</h3><p class="by">${esc(b.authors?.join(', ') || 'Unknown author')}${b.year ? ` • ${esc(b.year)}` : ''}</p><p>${esc(compact(b.desc, 155))}</p><div class="chips">${b.sources.map(s => `<span>${esc(s)}</span>`).join('')}${(b.subjects || []).slice(0, 3).map(s => `<span>${esc(s)}</span>`).join('')}</div><div class="actions"><button data-select="${esc(b.id)}">Details</button><button data-save="${esc(b.id)}" ${saved ? 'disabled' : ''}>${saved ? 'Saved' : 'Save stack'}</button>${b.links?.[0] ? `<a href="${esc(b.links[0].url)}" target="_blank" rel="noreferrer">Open source</a>` : ''}</div></div></article>`; }
function stack() { return `<section class="section"><div class="heading row"><div><p class="eyebrow">Your stack</p><h2>Build a working shelf while you research.</h2></div><p>${state.saved.length ? `${state.saved.length} saved locally in this browser` : 'Save books from search results to start a stack.'}</p></div><div class="saved">${state.saved.map(b => `<article><strong>${esc(b.title)}</strong><span>${esc(b.authors?.[0] || 'Unknown')}${b.year ? ` • ${esc(b.year)}` : ''}</span><button data-remove="${esc(b.id)}">Remove</button></article>`).join('') || '<p class="notice">Your saved stack is empty. Search something weird and wonderful.</p>'}</div></section>`; }
function sourceMap() { return `<section class="section"><div class="heading"><p class="eyebrow">Research map</p><h2>The data sources that can make Librarian unmatched.</h2><p>Production path: cache politely, dedupe by ISBN/OCLC/LCCN/OpenLibrary/Wikidata IDs, then rank records by provenance, completeness, availability, and user usefulness.</p></div><div class="grid sources">${SOURCES.map(s => `<article><div class="top"><span>${esc(s.badge)}</span><b>${esc(s.priority)}</b></div><h3>${esc(s.name)}</h3><p class="muted">${esc(s.coverage)}</p><div class="chips">${s.best.map(x => `<span>${esc(x)}</span>`).join('')}</div><p>${esc(s.access)}</p><a href="${esc(s.url)}" target="_blank" rel="noreferrer">Docs ↗</a></article>`).join('')}</div></section>`; }
function blueprint() { return `<section class="section blueprint"><div><p class="eyebrow">Next-level architecture</p><h2>How this becomes the greatest organized index.</h2></div><div class="steps"><article><b>1. Ingest</b><p>Monthly Open Library dumps + Gutenberg catalog + IA metadata + Wikidata IDs + LOC enrichment.</p></article><article><b>2. Resolve</b><p>Cluster works and editions using ISBN-10/13, LCCN, OCLC, OLID, DOI, title-author fingerprints, and Wikidata QIDs.</p></article><article><b>3. Enrich</b><p>Add covers, summaries, subjects, series, awards, related works, availability, formats, and source confidence.</p></article><article><b>4. Explore</b><p>Expose semantic search, collection builders, syllabus mode, public-domain finder, author maps, and API endpoints.</p></article></div></section>`; }
function modal() { const b = state.selected; if (!b) return ''; return `<div class="backdrop" data-close><article class="modal"><button class="x" data-close>×</button><div class="modalGrid"><div class="cover big">${b.cover ? `<img src="${esc(b.cover)}" alt="Cover for ${esc(b.title)}" />` : `<em>${esc((b.title || '?')[0])}</em>`}</div><div><p class="eyebrow">${esc(b.sources.join(' + '))}</p><h2>${esc(b.title)}</h2><p class="by">${esc(b.authors?.join(', ') || 'Unknown author')}${b.year ? ` • ${esc(b.year)}` : ''}</p><p>${esc(b.desc)}</p><dl><dt>Availability</dt><dd>${esc(b.availability)}</dd><dt>Languages</dt><dd>${esc(b.langs?.join(', ') || 'Unknown')}</dd><dt>Identifiers</dt><dd>${esc((b.ids || []).slice(0, 8).join(', ') || 'None surfaced')}</dd><dt>Metadata score</dt><dd>${b.score}% complete</dd></dl><div class="chips wide">${(b.subjects || []).slice(0, 12).map(s => `<span>${esc(s)}</span>`).join('')}</div><div class="actions links">${(b.links || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)}</a>`).join('')}</div></div></div></article></div>`; }

function render() { app.innerHTML = `<main>${hero()}${results()}</main>${modal()}`; bind(); }
function bind() {
  document.querySelector('[data-form]')?.addEventListener('submit', e => { e.preventDefault(); search(new FormData(e.currentTarget).get('q')); });
  document.querySelectorAll('[data-query]').forEach(el => el.onclick = () => search(el.dataset.query));
  document.querySelectorAll('[data-filter]').forEach(el => el.onchange = () => { state.filters[el.dataset.filter] = el.value; render(); });
  document.querySelectorAll('[data-save]').forEach(el => el.onclick = () => save(el.dataset.save));
  document.querySelectorAll('[data-remove]').forEach(el => el.onclick = () => remove(el.dataset.remove));
  document.querySelectorAll('[data-select]').forEach(el => el.onclick = () => { state.selected = state.results.find(b => b.id === el.dataset.select); render(); });
  document.querySelectorAll('[data-close]').forEach(el => el.onclick = e => { if (e.target.closest('.modal') && !e.target.matches('.x')) return; state.selected = null; render(); });
}
render();
