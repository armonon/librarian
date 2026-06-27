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
  ['atlas-search', 'Atlas search', 'One query fans out to Open Library, Google Books, and Gutenberg, then merges duplicate editions by ISBN, title, and author.'],
  ['quality-score', 'Metadata quality score', 'Every result is scored by completeness so the most complete catalog record naturally rises to the top.'],
  ['availability', 'Availability first', 'Filter toward free ebooks, public-domain downloads, previews, borrowable scans, or catalog-only records.'],
  ['stacks', 'Personal stacks', 'Save discoveries into a working shelf for research, shopping, or syllabus building — stored in your browser.'],
  ['provenance', 'Source provenance', 'Every card shows which APIs supplied the record and links straight back to each source to verify it.'],
  ['roadmap', 'Expansion playbook', 'A ranked source map and architecture for turning this into a serious, canonical book graph.'],
];

const BLUEPRINT = [
  ['Ingest', 'Monthly Open Library dumps + Gutenberg catalog + Internet Archive metadata + Wikidata IDs + Library of Congress enrichment.'],
  ['Resolve', 'Cluster works and editions using ISBN-10/13, LCCN, OCLC, OLID, DOI, title-author fingerprints, and Wikidata QIDs.'],
  ['Enrich', 'Add covers, summaries, subjects, series, awards, related works, availability, formats, and source confidence.'],
  ['Explore', 'Expose semantic search, collection builders, syllabus mode, public-domain finder, author maps, and API endpoints.'],
];

const GENRES = ['science fiction', 'fantasy', 'poetry', 'history', 'biography', 'autobiography', 'philosophy', 'mystery', 'romance', 'thriller', 'horror', 'drama', 'essays', 'short stories', 'art', 'science', 'religion', 'psychology', 'economics', 'politics', 'memoir', 'adventure', 'classics', 'children', 'cooking', 'travel', 'nature', 'fiction'];
const COVER_TINTS = ['#7a3b2e', '#2f4a55', '#4a3a5e', '#6b5326', '#36563f', '#5e3340', '#3a4a3a', '#523a2a'];

const SAMPLES = ['octavia butler', 'persian poetry', 'systems thinking', 'james baldwin', 'public domain astronomy', 'isbn:9780140328721'];
const OPEN_LIBRARY_OFFSETS = [0, 100, 200, 300, 400];
const GUTENDEX_PAGES = [1, 2, 3, 4];
const PAGE_SIZE = 24;
const app = document.querySelector('#app');
const storeKey = 'librarian.saved.v1';
const state = { tab: 'search', query: '', loading: false, searched: false, results: [], error: '', saved: loadSaved(), filters: { source: 'all', availability: 'all', language: 'all' }, limit: PAGE_SIZE, selected: null, ask: '', reply: '' };

function loadSaved() { try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch { return []; } }
function persist() { localStorage.setItem(storeKey, JSON.stringify(state.saved)); }
function esc(v = '') { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uniq(a = []) { return [...new Set(a.flat().filter(Boolean).map(String))]; }
function year(v) { return String(v || '').match(/-?\d{3,4}/)?.[0] || ''; }
function isbn(ids = []) { return ids.find(id => /^97[89]/.test(String(id).replace(/[^0-9X]/gi, ''))) || ids[0] || ''; }
function key(book) { const i = isbn(book.ids); return i ? `isbn:${i.replace(/[^0-9X]/gi, '').toUpperCase()}` : `${book.title}|${book.authors?.[0] || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function compact(text = '', max = 180) { text = Array.isArray(text) ? text.join(', ') : String(text); return text.length > max ? `${text.slice(0, max).trim()}…` : text; }
function score(book) { return Math.round(([book.title, book.authors?.length, book.cover, book.year, book.subjects?.length, book.ids?.length, book.desc, book.langs?.length, book.links?.length, !/catalog only/i.test(book.availability || '')].filter(Boolean).length / 10) * 100); }
function titleCase(s = '') { return String(s).replace(/\w\S*/g, w => w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).replace(/^./, c => c.toUpperCase()); }

function category(book) {
  const subs = uniq(book.subjects).map(s => s.trim()).filter(Boolean);
  const low = subs.map(s => s.toLowerCase());
  for (const g of GENRES) { const re = new RegExp(`(^|[^a-z])${g.replace(/ /g, '\\s+')}([^a-z]|$)`); if (low.some(s => re.test(s))) return titleCase(g); }
  const phrase = subs.find(s => s.split(' ').length <= 3 && s.length <= 24 && !/[,;:()/0-9]/.test(s));
  return titleCase((phrase || subs[0] || book.sources?.[0] || 'General').slice(0, 30));
}
function availClass(av = '') { if (/free|public|read|borrow/i.test(av)) return 'free'; if (/preview|sale/i.test(av)) return 'preview'; return 'catalog'; }
function availLabel(av = '') { if (/free|public/i.test(av)) return 'Free'; if (/read|borrow/i.test(av)) return 'Readable'; if (/preview/i.test(av)) return 'Preview'; if (/sale/i.test(av)) return 'For sale'; return 'Catalog'; }
function tint(s = '?') { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COVER_TINTS[h % COVER_TINTS.length]; }
function coverInner(b, cls = 'book') { return b.cover ? `<img src="${esc(b.cover)}" alt="Cover for ${esc(b.title)}" loading="lazy" />` : `<span class="initial" style="background:${tint(b.title)}">${esc((b.title || '?').trim()[0] || '?')}</span>`; }
const SRC_TAG = { 'Open Library': 'OL', 'Google Books': 'GB', 'Project Gutenberg': 'PG', 'Internet Archive': 'IA' };

const ICON = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  bookmark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  bookmarkFill: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  ext: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
};

async function json(url) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 9500); try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); } finally { clearTimeout(t); } }

async function openLibrary(q) {
  const settled = await Promise.allSettled(OPEN_LIBRARY_OFFSETS.map(offset => json(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=100&offset=${offset}&fields=key,title,author_name,first_publish_year,publish_year,isbn,language,subject,cover_i,edition_count,ia,ebook_access,ratings_average,number_of_pages_median`)));
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.docs || []) : []).map(d => ({
    id: `ol:${d.key}`, title: d.title, authors: uniq(d.author_name).slice(0, 4), year: d.first_publish_year || '', pages: d.number_of_pages_median || '', subjects: uniq(d.subject).slice(0, 14), langs: uniq(d.language).slice(0, 4), ids: uniq(d.isbn).slice(0, 8),
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
    desc: `${d.edition_count || 1} edition${d.edition_count === 1 ? '' : 's'} indexed by Open Library${d.ratings_average ? ` • average rating ${d.ratings_average.toFixed(1)}` : ''}.`,
    availability: d.ebook_access === 'public' || d.ia?.length ? 'Readable / borrowable' : 'Catalog only',
    links: [{ label: 'Open Library', url: `https://openlibrary.org${d.key}` }, ...(d.ia?.[0] ? [{ label: 'Internet Archive item', url: `https://archive.org/details/${d.ia[0]}` }] : [])],
    sources: ['Open Library']
  }));
}

async function googleBooks(q) {
  const data = await json(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&printType=books&projection=lite`);
  return (data.items || []).map(item => { const v = item.volumeInfo || {}, a = item.accessInfo || {}, s = item.saleInfo || {}; return {
    id: `gb:${item.id}`, title: v.title, authors: uniq(v.authors).slice(0, 4), year: year(v.publishedDate), pages: v.pageCount || '', subjects: uniq(v.categories).slice(0, 8), langs: uniq([v.language]), ids: uniq((v.industryIdentifiers || []).map(x => x.identifier)).slice(0, 8),
    cover: (v.imageLinks?.thumbnail || '').replace('http://', 'https://'), desc: compact(v.description || `${v.publisher || 'Publisher metadata'}${v.pageCount ? ` • ${v.pageCount} pages` : ''}.`, 320),
    availability: a.epub?.isAvailable || a.pdf?.isAvailable ? 'Preview / ebook metadata' : s.saleability === 'FOR_SALE' ? 'For sale' : 'Catalog only',
    links: [...(v.previewLink ? [{ label: 'Google preview', url: v.previewLink }] : []), ...(v.infoLink ? [{ label: 'Google Books', url: v.infoLink }] : [])], sources: ['Google Books']
  }; });
}

async function gutenberg(q) {
  const term = encodeURIComponent(q.replace(/^isbn:/i, '').trim());
  const settled = await Promise.allSettled(GUTENDEX_PAGES.map(page => json(`https://gutendex.com/books?search=${term}&page=${page}`)));
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.results || []) : []).map(b => ({
    id: `pg:${b.id}`, title: b.title, authors: uniq((b.authors || []).map(a => a.name)).slice(0, 4), year: '', pages: '', subjects: uniq([...(b.subjects || []), ...(b.bookshelves || [])]).slice(0, 14), langs: uniq(b.languages), ids: [`Project Gutenberg ${b.id}`],
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
    const next = { ...old, title: old.title || b.title, year: old.year || b.year, pages: old.pages || b.pages, cover: old.cover || b.cover, desc: (old.desc || '').length >= (b.desc || '').length ? old.desc : b.desc, availability: /free|read|borrow|preview/i.test(old.availability) ? old.availability : b.availability, authors: uniq([old.authors, b.authors]), subjects: uniq([old.subjects, b.subjects]).slice(0, 16), ids: uniq([old.ids, b.ids]), langs: uniq([old.langs, b.langs]), links: uniqLinks([...(old.links || []), ...(b.links || [])]), sources: uniq([old.sources, b.sources]) };
    next.score = score(next); map.set(k, next);
  }
  return [...map.values()].sort((a, b) => b.score - a.score || Number(b.year || 0) - Number(a.year || 0));
}
function uniqLinks(links) { return links.filter((l, i, a) => l?.url && a.findIndex(x => x.url === l.url) === i); }

async function search(q) {
  q = String(q || '').trim(); if (!q) return;
  Object.assign(state, { query: q, loading: true, searched: true, error: '', limit: PAGE_SIZE, filters: { source: 'all', availability: 'all', language: 'all' } });
  if (state.tab !== 'search') state.tab = 'search';
  render();
  const out = await Promise.allSettled([openLibrary(q), googleBooks(q), gutenberg(q)]);
  state.results = merge(out.flatMap(r => r.status === 'fulfilled' ? r.value : []));
  state.loading = false;
  state.error = !state.results.length ? 'The live APIs returned nothing useful. Try a broader title, author, subject, or ISBN.' : '';
  render();
  document.querySelector('#results')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function filtered() { return state.results.filter(b => (state.filters.source === 'all' || b.sources.includes(state.filters.source)) && (state.filters.language === 'all' || b.langs.includes(state.filters.language)) && (state.filters.availability === 'all' || (state.filters.availability === 'free' ? /free|public|read|borrow/i.test(b.availability) : /preview|sale|catalog/i.test(b.availability)))); }
function sourceList() { return uniq(state.results.flatMap(b => b.sources)); }
function languages() { return uniq(state.results.flatMap(b => b.langs)).slice(0, 12); }
function findBook(id) { return state.results.find(x => x.id === id) || (state.selected && state.selected.id === id ? state.selected : null) || state.saved.find(x => x.id === id); }
function toggleSave(id) {
  const b = findBook(id); if (!b) return;
  const has = state.saved.some(x => key(x) === key(b));
  if (has) state.saved = state.saved.filter(x => key(x) !== key(b));
  else { state.saved.unshift(b); state.saved = state.saved.slice(0, 60); }
  persist();
  if (state.tab === 'profile') { render(); return; } // shelf list changes; rebuild it
  syncSaveButtons(); syncShelfCount(); // surgical update — never touch the result images
}
function remove(id) {
  state.saved = state.saved.filter(b => b.id !== id);
  persist();
  const card = [...document.querySelectorAll('[data-remove]')].find(el => el.dataset.remove === id)?.closest('.saved');
  if (card && state.saved.length) { card.remove(); syncShelfCount(); } else render();
}
function syncSaveButtons() {
  document.querySelectorAll('[data-save]').forEach(btn => {
    const b = findBook(btn.dataset.save); if (!b) return;
    const saved = state.saved.some(x => key(x) === key(b));
    btn.classList.toggle('is-saved', saved);
    if (btn.classList.contains('btn-ghost')) btn.innerHTML = `${saved ? ICON.bookmarkFill : ICON.bookmark} ${saved ? 'Saved' : 'Save to shelf'}`;
    else { btn.innerHTML = saved ? ICON.bookmarkFill : ICON.bookmark; btn.setAttribute('aria-label', saved ? 'Remove from shelf' : 'Save to shelf'); }
  });
}
function syncShelfCount() {
  const tab = document.querySelector('.nav [data-tab="profile"]'); if (!tab) return;
  let badge = tab.querySelector('.count'); const n = state.saved.length;
  if (n) { if (!badge) { badge = document.createElement('span'); badge.className = 'count'; tab.appendChild(badge); } badge.textContent = n; }
  else if (badge) badge.remove();
}

function askLibrarian(text) {
  state.ask = String(text || '').trim();
  if (!state.ask) { state.reply = ''; render(); return; }
  const shelf = state.saved;
  const cats = uniq(shelf.map(category)).slice(0, 4);
  const authors = uniq(shelf.flatMap(b => b.authors || [])).slice(0, 4);
  if (!shelf.length) {
    state.reply = `You asked: “${state.ask}”\n\nYour shelf is empty, so there's nothing to build a path from yet.\nSearch for a title, author, or subject and save 3–5 results, then ask again — I'll draft a reading order across them.`;
  } else {
    state.reply = [
      `You asked: “${state.ask}”`,
      ``,
      `Working from your shelf — ${cats.join(', ') || 'saved books'}${authors.length ? ` (authors: ${authors.join(', ')})` : ''}.`,
      ``,
      `Suggested path:`,
      `1. Start with the most complete record on your shelf as an anchor.`,
      `2. Read one adjacent category (${cats[1] || cats[0] || 'a related subject'}) to widen context.`,
      `3. Compare two authors across time to see how the idea evolves.`,
      ``,
      `Gaps to fill: search “${cats[0] || state.ask}” and save the highest-scoring results to extend the path.`,
    ].join('\n');
  }
  render();
}

/* ---------- views ---------- */
function topbar() {
  const tab = (id, label, badge) => `<button data-tab="${id}" class="${state.tab === id ? 'active' : ''}">${label}${badge ? `<span class="count">${badge}</span>` : ''}</button>`;
  return `<header class="topbar"><div class="wrap"><div class="brand"><span class="mark">Librarian</span><span class="mark-tag">atlas</span></div><nav class="nav" aria-label="Sections">${tab('search', 'Search')}${tab('ai', 'AI Librarian')}${tab('sources', 'Sources')}${tab('profile', 'Shelf', state.saved.length || '')}</nav></div></header>`;
}

function hero() {
  return `<section class="hero"><div class="wrap"><p class="eyebrow">Librarian v0.1 · open book atlas</p><h1>Search every public book catalog at once.</h1><p class="lede">One query fans out across open catalogs, public-domain libraries, and commercial-scale metadata — merged, scored, and traced back to every source.</p>
    <form class="search" data-form><div class="search-field">${ICON.search}<input name="q" value="${esc(state.query)}" placeholder="Search title, author, subject, or ISBN…" autocomplete="off" /></div><button class="btn-primary" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Searching…' : 'Search'}</button></form>
    <div class="samples">${SAMPLES.map(q => `<button data-query="${esc(q)}">${esc(q)}</button>`).join('')}</div></div></section>`;
}

function features() {
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">What it does</p><h2>Not just search — an organization layer for books.</h2></div></div>
    <div class="features">${FEATURES.map(([, h, p]) => `<article><span class="ico">${ICON.book}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}</div></div></section>`;
}

function bookCard(b) {
  const saved = state.saved.some(x => key(x) === key(b));
  const tags = uniq(b.sources).map(s => `<span class="tag">${esc(SRC_TAG[s] || s)}</span>`).join('');
  const meta = [category(b), b.year, b.pages ? `${b.pages} pp` : ''].filter(Boolean).join(' · ');
  const dot = b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low';
  return `<article class="book" data-select="${esc(b.id)}">
    <div class="book-cover">${coverInner(b)}</div>
    <div class="book-main">
      <div class="book-tags">${tags}</div>
      <h3 class="book-title">${esc(b.title)}</h3>
      <p class="book-author">${esc(b.authors?.join(', ') || 'Unknown author')}</p>
      <p class="book-meta">${esc(meta)}</p>
      <div class="book-foot"><span class="pill ${availClass(b.availability)}">${esc(availLabel(b.availability))}</span><span class="score" title="Metadata completeness"><span class="dot ${dot}"></span>${b.score}%</span></div>
    </div>
    <button class="book-save ${saved ? 'is-saved' : ''}" data-save="${esc(b.id)}" aria-label="${saved ? 'Remove from shelf' : 'Save to shelf'}">${saved ? ICON.bookmarkFill : ICON.bookmark}</button>
  </article>`;
}

function resultsSection() {
  const books = filtered();
  const shown = books.slice(0, state.limit);
  const head = `<div class="section-head"><div class="titles"><p class="eyebrow">Live atlas</p><h2>${state.loading ? 'Searching the catalogs…' : `${books.length} result${books.length === 1 ? '' : 's'}`}</h2>${!state.loading && state.results.length ? `<p>Merged across ${sourceList().length} source${sourceList().length === 1 ? '' : 's'} and ranked by metadata completeness.</p>` : ''}</div>
    ${state.results.length ? `<div class="filters">
      <select data-filter="source"><option value="all">All sources</option>${sourceList().map(s => `<option ${state.filters.source === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <select data-filter="availability"><option value="all">All availability</option><option value="free" ${state.filters.availability === 'free' ? 'selected' : ''}>Readable / free</option><option value="preview" ${state.filters.availability === 'preview' ? 'selected' : ''}>Preview / catalog</option></select>
      <select data-filter="language"><option value="all">All languages</option>${languages().map(l => `<option ${state.filters.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : ''}</div>`;
  let body;
  if (state.loading) body = `<div class="books">${Array.from({ length: 8 }, () => '<div class="skeleton"></div>').join('')}</div>`;
  else if (state.error) body = `<p class="notice">${esc(state.error)}</p>`;
  else if (!books.length) body = '<p class="notice">No matches after filters. Try widening the lens.</p>';
  else body = `<div class="books">${shown.map(bookCard).join('')}</div>${books.length > state.limit ? `<button class="show-more" data-more>Show more (${books.length - state.limit} more)</button>` : ''}`;
  return `<section class="section" id="results"><div class="wrap">${head}${body}</div></section>`;
}

function searchTab() {
  return hero() + (state.searched ? resultsSection() : features());
}

function aiTab() {
  const shelf = state.saved.slice(0, 6);
  const context = shelf.length
    ? `<div class="mini-shelf">${shelf.map(b => `<button data-query="${esc(category(b))}"><strong>${esc(b.title)}</strong><span>${esc(category(b))}</span></button>`).join('')}</div>`
    : '<p class="notice">No saved books yet. Save a few search results to give the librarian context.</p>';
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">AI Librarian</p><h2>Ask for a reading path.</h2><p>Drafts a route through your saved shelf — similar books, a reading order, or a category map.</p></div></div>
    <div class="ai-grid">
      <form class="ai-ask" data-ask-form><textarea name="ask" placeholder="Ask for similar books, a reading order, or a category map…">${esc(state.ask)}</textarea><button class="btn-primary">Ask Librarian</button></form>
      <div class="ai-answer"><p class="label">Shelf context</p>${context}${state.reply ? `<div class="ai-reply">${esc(state.reply)}</div>` : '<p class="notice">Ask a question to draft a path from your shelf.</p>'}<p class="ai-note">Offline draft generated from your shelf. Wire this panel to a model for richer, generative answers.</p></div>
    </div></div></section>`;
}

function sourcesTab() {
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Research map</p><h2>The sources that can make Librarian unmatched.</h2><p>Production path: cache politely, dedupe by ISBN / OCLC / LCCN / Open Library / Wikidata IDs, then rank records by provenance, completeness, availability, and usefulness.</p></div></div>
    <div class="sources">${SOURCES.map(s => `<article><div class="top"><span class="badge">${esc(s.badge)}</span><span class="priority">${esc(s.priority)}</span></div><h3>${esc(s.name)}</h3><p>${esc(s.coverage)}</p><div class="chips">${s.best.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div><span class="access">${esc(s.access)}</span><a href="${esc(s.url)}" target="_blank" rel="noreferrer">Docs ${ICON.ext}</a></article>`).join('')}</div>
    <div class="section-head blueprint" style="margin-top:48px"><div class="titles"><p class="eyebrow">Next-level architecture</p><h2>How this becomes the greatest organized index.</h2></div></div>
    <div class="steps">${BLUEPRINT.map(([h, p], i) => `<article><span class="n">${i + 1}</span><b>${esc(h)}</b><p>${esc(p)}</p></article>`).join('')}</div></div></section>`;
}

function profileTab() {
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Your shelf</p><h2>Saved books.</h2><p>${state.saved.length ? `${state.saved.length} book${state.saved.length === 1 ? '' : 's'} saved locally in this browser.` : 'Save books from search to build your shelf.'}</p></div></div>
    ${state.saved.length ? `<div class="shelf">${state.saved.map(savedCard).join('')}</div>` : '<p class="notice">No saved books yet. Head to Search and tap the bookmark on any result.</p>'}</div></section>`;
}
function savedCard(b) {
  return `<article class="saved" data-select="${esc(b.id)}"><div class="book-cover">${coverInner(b)}</div><div class="saved-body"><span class="cat">${esc(category(b))}</span><strong>${esc(b.title)}</strong><span class="author">${esc(b.authors?.[0] || 'Unknown author')}</span></div><button class="saved-remove" data-remove="${esc(b.id)}" aria-label="Remove from shelf">${ICON.trash}</button></article>`;
}

function modal() {
  const b = state.selected; if (!b) return '';
  const saved = state.saved.some(x => key(x) === key(b));
  const meta = [b.year, b.pages ? `${b.pages} pages` : '', (b.langs || []).slice(0, 3).join(', ')].filter(Boolean).join(' · ');
  const ids = uniq(b.ids).slice(0, 8);
  const links = uniqLinks(b.links || []);
  return `<div class="backdrop" data-close><article class="modal" role="dialog" aria-modal="true" aria-label="${esc(b.title)}">
    <button class="modal-close" data-close aria-label="Close">${ICON.x}</button>
    <div class="modal-grid">
      <div class="modal-cover">${coverInner(b, 'modal')}</div>
      <div class="modal-body">
        <p class="eyebrow">${esc(category(b))}</p>
        <h2>${esc(b.title)}</h2>
        <p class="modal-author">${esc(b.authors?.join(', ') || 'Unknown author')}</p>
        <div class="modal-row"><span class="pill ${availClass(b.availability)}">${esc(b.availability || 'Catalog only')}</span>${meta ? `<span class="score"><span class="dot ${b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low'}"></span>${b.score}% complete</span>` : ''}</div>
        ${meta ? `<p class="book-meta" style="margin-bottom:18px">${esc(meta)}</p>` : ''}
        ${b.desc ? `<p class="modal-desc">${esc(b.desc)}</p>` : ''}
        ${b.subjects?.length ? `<div class="modal-section"><h4>Subjects</h4><div class="chips" style="display:flex;flex-wrap:wrap;gap:6px">${uniq(b.subjects).slice(0, 10).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>` : ''}
        ${ids.length ? `<div class="modal-section"><h4>Identifiers</h4><div class="id-list">${ids.map(i => `<code>${esc(i)}</code>`).join('')}</div></div>` : ''}
        ${links.length ? `<div class="modal-section"><h4>Sources · ${esc(uniq(b.sources).join(', '))}</h4><div class="link-list">${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)} ${ICON.ext}</a>`).join('')}</div></div>` : ''}
        <div class="modal-actions"><button class="btn-ghost ${saved ? 'is-saved' : ''}" data-save="${esc(b.id)}">${saved ? ICON.bookmarkFill : ICON.bookmark} ${saved ? 'Saved' : 'Save to shelf'}</button></div>
      </div>
    </div>
  </article></div>`;
}

function activeTab() {
  if (state.tab === 'ai') return aiTab();
  if (state.tab === 'sources') return sourcesTab();
  if (state.tab === 'profile') return profileTab();
  return searchTab();
}

function render() { app.innerHTML = `${topbar()}<main>${activeTab()}</main>${modal()}`; bind(); }
function repaintResults() { const el = document.querySelector('#results'); if (el) { el.outerHTML = resultsSection(); bind(); } else render(); }

function bind() {
  document.querySelector('[data-form]')?.addEventListener('submit', e => { e.preventDefault(); search(new FormData(e.currentTarget).get('q')); });
  document.querySelector('[data-ask-form]')?.addEventListener('submit', e => { e.preventDefault(); askLibrarian(new FormData(e.currentTarget).get('ask')); });
  document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => { state.tab = el.dataset.tab; window.scrollTo({ top: 0 }); render(); });
  document.querySelectorAll('[data-query]').forEach(el => el.onclick = () => { state.tab = 'search'; search(el.dataset.query); });
  document.querySelectorAll('[data-filter]').forEach(el => el.onchange = () => { state.filters[el.dataset.filter] = el.value; state.limit = PAGE_SIZE; repaintResults(); });
  document.querySelector('[data-more]')?.addEventListener('click', () => { state.limit += PAGE_SIZE; repaintResults(); });
  document.querySelectorAll('[data-save]').forEach(el => el.onclick = e => { e.stopPropagation(); toggleSave(el.dataset.save); });
  document.querySelectorAll('[data-remove]').forEach(el => el.onclick = e => { e.stopPropagation(); remove(el.dataset.remove); });
  document.querySelectorAll('[data-select]').forEach(el => el.onclick = () => { state.selected = state.results.find(b => b.id === el.dataset.select) || state.saved.find(b => b.id === el.dataset.select); render(); });
  document.querySelectorAll('[data-close]').forEach(el => el.onclick = e => { if (e.target.closest('.modal') && !e.target.closest('[data-close]')) return; state.selected = null; render(); });
}

document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.selected) { state.selected = null; render(); } });
render();
