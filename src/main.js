import './styles.css';

const SOURCES = [
  { name: 'Open Library', badge: 'core', priority: 'Index backbone', live: true, url: 'https://openlibrary.org/developers/api', coverage: 'Open works, editions, ISBNs, authors, subjects, covers, ratings, and Internet Archive read/borrow links.', access: 'Free API, keyless. Powers the editions expander.', best: ['works + editions', 'covers', 'ISBNs', 'subjects'] },
  { name: 'Google Books', badge: 'coverage', priority: 'Coverage enrichment', live: true, url: 'https://developers.google.com/books/docs/v1/using', coverage: 'Massive mainstream discovery index with thumbnails, previews, categories, and sale info.', access: 'Keyless (anonymous quota); add a key for production volume.', best: ['previews', 'mainstream', 'covers', 'page counts'] },
  { name: 'Project Gutenberg / Gutendex', badge: 'public domain', priority: 'Free classics', live: true, url: 'https://gutendex.com/', coverage: 'Public-domain ebook metadata, formats, languages, and download/popularity counts.', access: 'Free JSON API, keyless.', best: ['free ebooks', 'EPUB/HTML', 'classics'] },
  { name: 'OpenAlex', badge: 'scholarly', priority: 'Academic works', live: true, url: 'https://openalex.org/', coverage: 'Books, monographs, and dissertations with abstracts, open-access links, and an author/institution graph.', access: 'Free, CC0; polite pool via mailto.', best: ['monographs', 'dissertations', 'abstracts', 'OA links'] },
  { name: 'Crossref', badge: 'scholarly', priority: 'Scholarly books', live: true, url: 'https://api.crossref.org/', coverage: 'DOI-registered books, monographs, and reference works with ISBNs and publishers.', access: 'Free polite pool; mailto included.', best: ['DOIs', 'ISBNs', 'publishers'] },
  { name: 'Internet Archive', badge: 'full text', priority: 'Read / borrow layer', live: true, url: 'https://archive.org/developers/', coverage: 'Digitized books, scans, OCR text, and read/borrow links with cover thumbnails.', access: 'Free, keyless.', best: ['read links', 'scans', 'covers'] },
  { name: 'CORE', badge: 'open access', priority: 'OA full text', live: true, url: 'https://core.ac.uk/services/api', coverage: 'Aggregated open-access papers, theses, and repository full text from thousands of providers.', access: 'Free API key (via proxy).', best: ['OA PDFs', 'theses', 'repositories'] },
  { name: 'DPLA', badge: 'US heritage', priority: 'US libraries + archives', live: true, url: 'https://pro.dp.la/developers', coverage: 'Tens of millions of items from US libraries, archives, and museums.', access: 'Free API key (via proxy).', best: ['archives', 'museums', 'covers'] },
  { name: 'Europeana', badge: 'EU heritage', priority: 'European institutions', live: true, url: 'https://pro.europeana.eu/page/apis', coverage: 'Books and texts from 2,000+ European galleries, libraries, archives, and museums.', access: 'Free API key (via proxy).', best: ['European texts', 'manuscripts', 'covers'] },
  { name: 'K10plus', badge: 'union catalog', priority: 'Union catalog (~200M)', live: true, url: 'https://www.k10plus.de/', coverage: 'One of the largest freely queryable union catalogs — the closest open analog to WorldCat scale.', access: 'Keyless SRU/Dublin Core (via proxy).', best: ['union records', 'editions', 'ISBNs'] },
  { name: 'Library of Congress', badge: 'authority', priority: 'US national catalog', live: true, url: 'https://www.loc.gov/apis/', coverage: 'Library-grade catalog records with subjects, identifiers, and provenance.', access: 'Keyless SRU (via proxy).', best: ['authority data', 'subjects', 'ISBNs'] },
  { name: 'BnF', badge: 'national', priority: 'France', live: true, url: 'https://api.bnf.fr/', coverage: 'Bibliothèque nationale de France catalog via SRU.', access: 'Keyless SRU/Dublin Core (via proxy).', best: ['French imprints', 'ARK records'] },
  { name: 'DNB', badge: 'national', priority: 'Germany', live: true, url: 'https://www.dnb.de/sru', coverage: 'Deutsche Nationalbibliothek — legal-deposit, near-complete for German publishing.', access: 'Keyless SRU (via proxy).', best: ['German imprints', 'legal deposit'] },
  { name: 'Finna', badge: 'aggregator', priority: 'Finland', live: true, url: 'https://www.finna.fi/', coverage: 'Aggregates every Finnish library, archive, and museum in one API.', access: 'Keyless JSON (via proxy).', best: ['Finnish libraries', 'covers', 'ISBNs'] },
  { name: 'Nasjonalbiblioteket', badge: 'national', priority: 'Norway', live: true, url: 'https://api.nb.no/', coverage: 'National Library of Norway — large digitized book collection.', access: 'Keyless JSON (via proxy).', best: ['Norwegian imprints', 'digitized'] },
  { name: 'WorldCat', badge: 'union catalog', priority: 'Find in a library', live: false, url: 'https://www.oclc.org/developer/', coverage: 'Global union catalog of ~17k libraries. Used as keyless "find in a library" link-outs by ISBN; the full API needs OCLC membership.', access: 'Link-outs live; API requires paid OCLC membership.', best: ['holdings', 'link-outs'] },
  { name: 'Wikidata', badge: 'graph', priority: 'Knowledge graph (roadmap)', live: false, url: 'https://www.wikidata.org/wiki/Wikidata:Data_access', coverage: 'Cross-links for works, authors, awards, series, adaptations, and external IDs.', access: 'SPARQL; planned enrichment layer.', best: ['entity resolution', 'awards', 'series'] },
  { name: 'HathiTrust', badge: 'preservation', priority: 'Full-view (roadmap)', live: false, url: 'https://www.hathitrust.org/data', coverage: '~18M digitized volumes with full-view / limited-view rights signals.', access: 'Bib API by ISBN/OCLC; planned.', best: ['full view', 'rights', 'preservation'] },
];

const FEATURES = [
  ['atlas-search', 'Atlas search', 'One query fans out to 15 catalogs — trade, academic, archive, and national libraries — then merges duplicate editions across sources by ISBN and a fuzzy title/author fingerprint.'],
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
const GOOGLE_OFFSETS = [0, 40, 80, 120];
const GUTENDEX_PAGES = [1, 2, 3, 4];
const PAGE_SIZE = 24;
// Polite-pool contact sent to OpenAlex/Crossref for higher, friendlier rate limits. Change to your email.
const POLITE_MAILTO = 'librarian-atlas@users.noreply.github.com';
// Server-side proxy for keyed / no-CORS sources (DPLA, Europeana, CORE). Keys live in Netlify env vars.
const PROXY = '/.netlify/functions/proxy';
const app = document.querySelector('#app');
const storeKey = 'librarian.saved.v1';
const state = { tab: 'search', query: '', loading: false, loadingMore: false, searched: false, results: [], error: '', saved: loadSaved(), filters: { source: 'all', availability: 'all', language: 'all' }, limit: PAGE_SIZE, selected: null, ask: '', reply: '' };
let searchToken = 0;

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
const SRC_TAG = { 'Open Library': 'OL', 'Google Books': 'GB', 'Project Gutenberg': 'PG', 'Internet Archive': 'IA', 'OpenAlex': 'OA', 'Crossref': 'CR', 'DPLA': 'DPLA', 'Europeana': 'EUR', 'CORE': 'CORE', 'K10plus': 'K10', 'Library of Congress': 'LOC', 'BnF': 'BNF', 'DNB': 'DNB', 'Finna': 'FIN', 'Nasjonalbiblioteket': 'NB' };
function reconstructAbstract(inv) { if (!inv) return ''; const out = []; for (const [w, ps] of Object.entries(inv)) for (const p of ps) out[p] = w; return out.join(' ').replace(/\s+/g, ' ').trim(); }
function isbnOf(ids = []) { return uniq(ids).map(x => String(x).replace(/[^0-9Xx]/g, '')).find(x => /^(97[89]\d{10}|\d{9}[\dXx])$/.test(x)) || ''; }

const ICON = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  bookmark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  bookmarkFill: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  ext: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  stack: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
};

async function json(url) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 9500); try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); } finally { clearTimeout(t); } }
async function text(url) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 11000); try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.text(); } finally { clearTimeout(t); } }

async function openLibrary(q) {
  const settled = await Promise.allSettled(OPEN_LIBRARY_OFFSETS.map(offset => json(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=100&offset=${offset}&fields=key,title,author_name,first_publish_year,publish_year,isbn,language,subject,cover_i,edition_count,ia,ebook_access,ratings_average,number_of_pages_median`)));
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.docs || []) : []).map(d => ({
    id: `ol:${d.key}`, work: /^\/works\//.test(d.key || '') ? d.key : '', title: d.title, authors: uniq(d.author_name).slice(0, 4), year: d.first_publish_year || '', pages: d.number_of_pages_median || '', subjects: uniq(d.subject).slice(0, 14), langs: uniq(d.language).slice(0, 4), ids: uniq(d.isbn).slice(0, 8),
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '',
    desc: `${d.edition_count || 1} edition${d.edition_count === 1 ? '' : 's'} indexed by Open Library${d.ratings_average ? ` • average rating ${d.ratings_average.toFixed(1)}` : ''}.`,
    availability: d.ebook_access === 'public' || d.ia?.length ? 'Readable / borrowable' : 'Catalog only',
    links: [{ label: 'Open Library', url: `https://openlibrary.org${d.key}` }, ...(d.ia?.[0] ? [{ label: 'Internet Archive item', url: `https://archive.org/details/${d.ia[0]}` }] : [])],
    sources: ['Open Library']
  }));
}

async function googleBooks(q) {
  const settled = await Promise.allSettled(GOOGLE_OFFSETS.map(start => json(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&startIndex=${start}&printType=books&projection=lite`)));
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.items || []) : []).map(item => { const v = item.volumeInfo || {}, a = item.accessInfo || {}, s = item.saleInfo || {}; return {
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

async function openAlex(q) {
  const term = q.replace(/^isbn:/i, '').trim();
  const data = await json(`https://api.openalex.org/works?search=${encodeURIComponent(term)}&filter=type:book|monograph|dissertation&per-page=200&mailto=${encodeURIComponent(POLITE_MAILTO)}`);
  return (data.results || []).map(w => {
    const oa = w.open_access || {}, loc = w.best_oa_location || w.primary_location || {}, doi = (w.doi || '').replace(/^https?:\/\/doi\.org\//, '');
    const abstract = reconstructAbstract(w.abstract_inverted_index);
    return {
      id: `oa:${w.id}`, title: w.display_name, authors: uniq((w.authorships || []).map(a => a.author?.display_name)).slice(0, 4), year: w.publication_year || '', pages: '',
      subjects: uniq((w.topics || []).map(t => t.display_name)).slice(0, 10), langs: w.language ? [w.language] : [], ids: uniq([doi]).slice(0, 8), cover: '',
      desc: abstract ? compact(abstract, 320) : `${titleCase(w.type || 'work')}${loc.source?.display_name ? ` • ${loc.source.display_name}` : ''}${w.cited_by_count ? ` • cited ${w.cited_by_count.toLocaleString()} times` : ''}.`,
      availability: oa.is_oa ? 'Free / open access' : 'Catalog only',
      links: uniqLinks([...(oa.oa_url ? [{ label: 'Open-access full text', url: oa.oa_url }] : []), ...(loc.landing_page_url ? [{ label: 'Publisher page', url: loc.landing_page_url }] : []), ...(doi ? [{ label: 'DOI', url: `https://doi.org/${doi}` }] : []), { label: 'OpenAlex', url: w.id }]),
      sources: ['OpenAlex']
    };
  });
}

async function crossref(q) {
  const term = q.replace(/^isbn:/i, '').trim();
  const data = await json(`https://api.crossref.org/works?query=${encodeURIComponent(term)}&filter=type:monograph,type:book,type:reference-book&rows=100&select=title,author,published,ISBN,publisher,type,abstract,subject,language,DOI&mailto=${encodeURIComponent(POLITE_MAILTO)}`);
  return (data.message?.items || []).map(it => {
    const doi = it.DOI || '', yr = (it.published?.['date-parts']?.[0] || [])[0] || '';
    return {
      id: `cr:${doi || (it.title || [])[0] || Math.random()}`, title: (it.title || [])[0], authors: uniq((it.author || []).map(a => [a.given, a.family].filter(Boolean).join(' '))).slice(0, 4), year: yr, pages: '',
      subjects: uniq(it.subject).slice(0, 10), langs: it.language ? [it.language] : [], ids: uniq(it.ISBN).slice(0, 8), cover: '',
      desc: it.abstract ? compact(String(it.abstract).replace(/<[^>]+>/g, ''), 320) : `${it.publisher || 'Publisher'}${it.type ? ` • ${titleCase(it.type.replace(/-/g, ' '))}` : ''}.`,
      availability: 'Catalog only', links: uniqLinks(doi ? [{ label: 'DOI', url: `https://doi.org/${doi}` }] : []), sources: ['Crossref']
    };
  });
}

async function internetArchive(q) {
  const term = q.replace(/^isbn:/i, '').trim();
  const data = await json(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+AND+mediatype%3Atexts&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=language&fl[]=subject&fl[]=isbn&rows=100&page=1&output=json`);
  return (data.response?.docs || []).map(d => {
    const arr = v => [].concat(v || []).filter(Boolean);
    return {
      id: `ia:${d.identifier}`, title: arr(d.title)[0], authors: arr(d.creator).slice(0, 4), year: year(d.year), pages: '',
      subjects: uniq(arr(d.subject)).slice(0, 10), langs: uniq(arr(d.language)).slice(0, 3), ids: uniq(arr(d.isbn)).slice(0, 8),
      cover: `https://archive.org/services/img/${d.identifier}`, desc: 'Digitized full text on the Internet Archive.', availability: 'Readable / borrowable',
      links: [{ label: 'Internet Archive', url: `https://archive.org/details/${d.identifier}` }], sources: ['Internet Archive']
    };
  });
}

async function dpla(q) {
  const data = await json(`${PROXY}?api=dpla&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  return (data.docs || []).map(d => {
    const sr = d.sourceResource || {}, arr = v => [].concat(v || []).filter(Boolean);
    return {
      id: `dpla:${d.id}`, title: arr(sr.title)[0], authors: uniq(arr(sr.creator)).slice(0, 4), year: year(sr.date?.displayDate || sr.date), pages: '',
      subjects: uniq(arr(sr.subject).map(s => s?.name || s)).slice(0, 10), langs: uniq(arr(sr.language).map(l => l?.name || l)).slice(0, 3), ids: [],
      cover: typeof d.object === 'string' ? d.object : '',
      desc: compact(arr(sr.description)[0] || `Held by ${d.provider?.name || d.dataProvider || 'a DPLA partner'}.`, 320),
      availability: 'Catalog only',
      links: uniqLinks([...(d.isShownAt ? [{ label: d.provider?.name || 'View item', url: d.isShownAt }] : []), { label: 'DPLA', url: `https://dp.la/item/${d.id}` }]),
      sources: ['DPLA']
    };
  });
}

async function europeana(q) {
  const data = await json(`${PROXY}?api=europeana&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  const arr = v => [].concat(v || []).filter(Boolean), notUri = a => !/^https?:\/\//.test(a);
  return (data.items || []).map(it => ({
    id: `eu:${it.id}`, title: arr(it.title)[0], authors: uniq(arr(it.dcCreator).filter(notUri)).slice(0, 4), year: year(arr(it.year)[0]), pages: '',
    subjects: uniq(arr(it.dcSubject).filter(notUri)).slice(0, 10), langs: uniq(arr(it.language)).slice(0, 3), ids: [],
    cover: arr(it.edmPreview)[0] || '',
    desc: compact(arr(it.dcDescription)[0] || `From ${arr(it.dataProvider)[0] || 'a Europeana partner'}.`, 320),
    availability: 'Catalog only',
    links: uniqLinks([...(arr(it.edmIsShownAt)[0] ? [{ label: 'View item', url: arr(it.edmIsShownAt)[0] }] : []), ...(it.guid ? [{ label: 'Europeana', url: it.guid }] : [])]),
    sources: ['Europeana']
  }));
}

async function core(q) {
  const data = await json(`${PROXY}?api=core&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  return (data.results || []).map(w => ({
    id: `core:${w.id}`, title: w.title, authors: uniq((w.authors || []).map(a => a.name)).slice(0, 4), year: w.yearPublished || '', pages: '',
    subjects: uniq([].concat(w.fieldOfStudy || []).filter(Boolean)).slice(0, 10), langs: w.language ? [w.language.name || w.language.code] : [], ids: uniq([w.doi]).slice(0, 8), cover: '',
    desc: w.abstract ? compact(w.abstract, 320) : `${w.publisher || 'Open-access work'}${w.documentType ? ` • ${w.documentType}` : ''}.`,
    availability: w.downloadUrl ? 'Free / open access' : 'Catalog only',
    links: uniqLinks([...(w.downloadUrl ? [{ label: 'Open-access PDF', url: w.downloadUrl }] : []), ...(w.doi ? [{ label: 'DOI', url: `https://doi.org/${w.doi}` }] : []), { label: 'CORE', url: `https://core.ac.uk/works/${w.id}` }]),
    sources: ['CORE']
  }));
}

// Generic SRU / Dublin Core parser — handles K10plus, Library of Congress, BnF (namespaces vary).
const RELATORS = /[.,]\s*(auteur du texte|éditeur scientifique|verfasser(in)?|mitwirkende[r]?|herausgeber(in)?|übersetzer(in)?|author|editor|translator|illustrator|compiler|writer of [a-z ]+|foreword|introduction|contributor)\b.*$/i;
const cleanName = s => s.replace(/\s*[([][^)\]]*[)\]]/g, '').replace(RELATORS, '').replace(/[\s,.;:/]+$/, '').trim();
const cleanTitle = s => s.replace(/\s*[/:;]\s*$/, '').replace(/\s+/g, ' ').trim();
function parseSRU(xml, source, prefix) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) return [];
  return [...doc.getElementsByTagNameNS('*', 'recordData')].map((rd, i) => {
    const get = name => [...rd.getElementsByTagNameNS('*', name)].map(e => e.textContent.trim()).filter(Boolean);
    const title = cleanTitle(get('title')[0] || ''); if (!title) return null;
    const rawIds = get('identifier');
    const ids = uniq(rawIds.map(x => { const m = x.replace(/[^0-9Xx]/g, ''); return /^(97[89]\d{10}|\d{9}[\dXx])$/.test(m) ? m : (/^(https?:|urn:|ark:)/i.test(x) ? '' : (x.length <= 20 ? x : '')); }).filter(Boolean));
    const wc = isbnOf(ids), catUrl = rawIds.find(x => /^https?:\/\//i.test(x));
    return {
      id: `${prefix}:${i}:${(wc || title).slice(0, 50)}`, title,
      authors: uniq([...get('creator'), ...get('contributor')].map(cleanName)).filter(Boolean).slice(0, 4),
      year: year(get('date')[0]), pages: '', subjects: uniq(get('subject')).slice(0, 10), langs: uniq(get('language')).slice(0, 3), ids: ids.slice(0, 8), cover: '',
      desc: compact(get('description')[0] || `Catalog record from ${source}.`, 320), availability: 'Catalog only',
      links: uniqLinks([...(catUrl ? [{ label: `${source} record`, url: catUrl }] : []), ...(wc ? [{ label: 'Find in a library (WorldCat)', url: `https://search.worldcat.org/isbn/${wc}` }] : [])]),
      sources: [source]
    };
  }).filter(Boolean);
}
async function k10plus(q) { return parseSRU(await text(`${PROXY}?api=k10plus&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`), 'K10plus', 'k10'); }
async function loc(q) { return parseSRU(await text(`${PROXY}?api=loc&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`), 'Library of Congress', 'loc'); }
async function bnf(q) { return parseSRU(await text(`${PROXY}?api=bnf&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`), 'BnF', 'bnf'); }
async function dnb(q) { return parseSRU(await text(`${PROXY}?api=dnb&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`), 'DNB', 'dnb'); }

async function finna(q) {
  const data = await json(`${PROXY}?api=finna&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  return (data.records || []).filter(r => !r.formats || r.formats.some(f => /book/i.test(f.value || f.translated || ''))).map(r => {
    const isbns = [].concat(r.cleanIsbn || []).filter(Boolean), wc = isbnOf(isbns), img = (r.images || [])[0];
    return {
      id: `finna:${r.id}`, title: Array.isArray(r.title) ? r.title[0] : r.title, authors: uniq((r.nonPresenterAuthors || []).map(a => a.name)).slice(0, 4),
      year: year(r.year), pages: '', subjects: uniq([].concat(...(r.subjects || []))).slice(0, 10), langs: uniq(r.languages).slice(0, 3), ids: uniq(isbns).slice(0, 8),
      cover: img ? `https://api.finna.fi${img}` : '', desc: 'Catalog record from Finnish libraries (Finna).', availability: 'Catalog only',
      links: uniqLinks([{ label: 'Finna', url: `https://www.finna.fi/Record/${encodeURIComponent(r.id)}` }, ...(wc ? [{ label: 'Find in a library (WorldCat)', url: `https://search.worldcat.org/isbn/${wc}` }] : [])]),
      sources: ['Finna']
    };
  });
}

async function norway(q) {
  const data = await json(`${PROXY}?api=norway&q=${encodeURIComponent(q.replace(/^isbn:/i, '').trim())}`);
  return (data?._embedded?.items || []).filter(it => (it.metadata?.mediaTypes || []).some(m => /bøker|book/i.test(m))).map(it => {
    const m = it.metadata || {}, ln = it._links || {}, isbns = [].concat(m.identifiers?.isbn || []).filter(Boolean), wc = isbnOf(isbns);
    const thumb = ln.thumbnail_large || ln.thumbnail_custom || ln.thumbnail_small;
    return {
      id: `nb:${it.id}`, title: m.title, authors: uniq(m.creators).slice(0, 4), year: year(m.originInfo?.issued), pages: '',
      subjects: uniq([].concat(m.subjects || [])).slice(0, 10), langs: uniq((m.languages || []).map(l => l.code || l)).slice(0, 3), ids: uniq(isbns).slice(0, 8),
      cover: thumb ? (thumb.href || thumb) : '', desc: 'Catalog record from the National Library of Norway.', availability: 'Catalog only',
      links: uniqLinks([{ label: 'Nasjonalbiblioteket', url: `https://www.nb.no/items/${it.id}` }, ...(wc ? [{ label: 'Find in a library (WorldCat)', url: `https://search.worldcat.org/isbn/${wc}` }] : [])]),
      sources: ['Nasjonalbiblioteket']
    };
  });
}

function tokenize(q) { return String(q || '').replace(/^isbn:/i, '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2); }
function relevance(book, toks) {
  if (!toks.length) return 0;
  const title = (book.title || '').toLowerCase(), hay = `${title} ${(book.authors || []).join(' ').toLowerCase()}`;
  let rel = toks.filter(t => hay.includes(t)).length / toks.length;
  const phrase = toks.join(' ');
  if (title.includes(phrase)) rel += 0.3;
  if (title === phrase) rel += 0.4;
  return Math.min(rel, 1.3);
}
// ---- fuzzy dedup helpers ----
const strip = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
function normTitle(t = '') { return strip(t).split(/[:/]/)[0].replace(/^(the|a|an|le|la|les|el|der|die|das)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).slice(0, 8).join(' '); }
function authorKey(authors = []) {
  const a = strip(authors[0]); if (!a) return '';
  let surname, first;
  if (a.includes(',')) { const p = a.split(','); surname = p[0]; first = (p[1] || '').trim(); }
  else { const w = a.replace(/[^a-z\s.]/g, '').split(/\s+/).filter(Boolean); surname = w[w.length - 1] || ''; first = w[0] || ''; }
  surname = surname.replace(/[^a-z]/g, '');
  return surname ? `${surname}-${(first || '')[0] || ''}` : '';
}
function fingerprint(b) { const t = normTitle(b.title), ak = authorKey(b.authors); return (t.length >= 2 && ak) ? `${t}|${ak}` : ''; }
function normIsbns(ids = []) { return uniq(ids).map(x => String(x).replace(/[^0-9Xx]/g, '').toUpperCase()).filter(x => /^(\d{9}[\dX]|\d{13})$/.test(x)); }
function dedupeAuthors(list) {
  const seen = new Map();
  for (const a of list) {
    if (!a) continue;
    const norm = strip(a).replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(t => t.length > 1).sort().join(' ');
    if (!seen.has(norm)) seen.set(norm, a);
    else if (seen.get(norm).includes(',') && !a.includes(',')) seen.set(norm, a); // prefer "First Last" display
  }
  return [...seen.values()].slice(0, 5);
}
function combine(a, b) {
  return { ...a, work: a.work || b.work, title: a.title || b.title, year: a.year || b.year, pages: a.pages || b.pages, cover: a.cover || b.cover,
    desc: (a.desc || '').length >= (b.desc || '').length ? a.desc : b.desc,
    availability: /free|read|borrow|preview/i.test(a.availability) ? a.availability : b.availability,
    authors: dedupeAuthors([...(a.authors || []), ...(b.authors || [])]),
    subjects: uniq([a.subjects, b.subjects]).slice(0, 16), ids: uniq([a.ids, b.ids]), langs: uniq([a.langs, b.langs]),
    links: uniqLinks([...(a.links || []), ...(b.links || [])]), sources: uniq([a.sources, b.sources]) };
}
function merge(all, q) {
  const recs = all.filter(x => x?.title);
  const parent = recs.map((_, i) => i);
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  const isbnMap = new Map(), fpMap = new Map();
  recs.forEach((r, i) => {
    for (const is of normIsbns(r.ids)) { if (isbnMap.has(is)) union(i, isbnMap.get(is)); else isbnMap.set(is, i); }
    const fp = fingerprint(r);
    if (fp) { if (fpMap.has(fp)) union(i, fpMap.get(fp)); else fpMap.set(fp, i); }
  });
  const groups = new Map();
  recs.forEach((r, i) => { const root = find(i); (groups.get(root) || groups.set(root, []).get(root)).push(r); });
  const toks = tokenize(q);
  const out = [...groups.values()].map(g => g.reduce(combine));
  for (const b of out) { b.score = score(b); b.held = uniq(b.sources).length; b.rank = relevance(b, toks) + (b.score / 100) * 0.6 + Math.min(b.held - 1, 4) * 0.08; }
  return out.sort((a, b) => b.rank - a.rank || Number(b.year || 0) - Number(a.year || 0));
}
function uniqLinks(links) { return links.filter((l, i, a) => l?.url && a.findIndex(x => x.url === l.url) === i); }

async function search(q) {
  q = String(q || '').trim(); if (!q) return;
  const token = ++searchToken;
  Object.assign(state, { query: q, loading: true, loadingMore: false, searched: true, error: '', limit: PAGE_SIZE, filters: { source: 'all', availability: 'all', language: 'all' } });
  if (state.tab !== 'search') state.tab = 'search';
  try { history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(q)}`); } catch {}
  render();
  const settle = async arr => (await Promise.allSettled(arr)).flatMap(r => r.status === 'fulfilled' ? r.value : []);
  // Phase 1: fast keyless sources — show results quickly.
  const fast = await settle([openLibrary(q), googleBooks(q), gutenberg(q), openAlex(q), crossref(q), internetArchive(q)]);
  if (token !== searchToken) return; // a newer search superseded this one
  state.results = merge(fast, q);
  state.loading = false;
  state.loadingMore = true;
  if (state.tab === 'search') render();
  document.querySelector('#results')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  // Phase 2: slower proxied / national catalogs — fill in.
  const slow = await settle([dpla(q), europeana(q), core(q), k10plus(q), loc(q), bnf(q), dnb(q), finna(q), norway(q)]);
  if (token !== searchToken) return;
  state.results = merge(fast.concat(slow), q);
  state.loadingMore = false;
  state.error = !state.results.length ? 'The live APIs returned nothing useful. Try a broader title, author, subject, or ISBN.' : '';
  if (state.tab === 'search') render();
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
  const srcs = uniq(b.sources), held = b.held || srcs.length;
  const tags = srcs.slice(0, 4).map(s => `<span class="tag">${esc(SRC_TAG[s] || s)}</span>`).join('') + (srcs.length > 4 ? `<span class="tag more">+${srcs.length - 4}</span>` : '');
  const meta = [category(b), b.year, b.pages ? `${b.pages} pp` : ''].filter(Boolean).join(' · ');
  const dot = b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low';
  const right = held > 1 ? `<span class="held" title="Found in ${held} catalogs">${ICON.stack} ${held} catalogs</span>` : `<span class="score" title="Metadata completeness"><span class="dot ${dot}"></span>${b.score}%</span>`;
  return `<article class="book" data-select="${esc(b.id)}">
    <div class="book-cover">${coverInner(b)}</div>
    <div class="book-main">
      <div class="book-tags">${tags}</div>
      <h3 class="book-title">${esc(b.title)}</h3>
      <p class="book-author">${esc(b.authors?.join(', ') || 'Unknown author')}</p>
      <p class="book-meta">${esc(meta)}</p>
      <div class="book-foot"><span class="pill ${availClass(b.availability)}">${esc(availLabel(b.availability))}</span>${right}</div>
    </div>
    <button class="book-save ${saved ? 'is-saved' : ''}" data-save="${esc(b.id)}" aria-label="${saved ? 'Remove from shelf' : 'Save to shelf'}">${saved ? ICON.bookmarkFill : ICON.bookmark}</button>
  </article>`;
}

function resultsSection() {
  const books = filtered();
  const shown = books.slice(0, state.limit);
  const head = `<div class="section-head"><div class="titles"><p class="eyebrow">Live atlas</p><h2>${state.loading ? 'Searching the catalogs…' : `${books.length} result${books.length === 1 ? '' : 's'}`}</h2>${!state.loading && state.results.length ? `<p>Merged across ${sourceList().length} source${sourceList().length === 1 ? '' : 's'} and ranked by relevance.${state.loadingMore ? ' <span class="loading-more">searching more catalogs…</span>' : ''}</p>` : ''}</div>
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
  const liveCount = SOURCES.filter(s => s.live).length;
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Live sources</p><h2>${liveCount} catalogs, federated into one search.</h2><p>Every query fans out to these in parallel, then records are merged across sources by ISBN and a fuzzy title/author fingerprint, scored for completeness, and ranked by relevance.</p></div></div>
    <div class="sources">${SOURCES.map(s => `<article><div class="top"><span class="badge">${esc(s.badge)}</span>${s.live ? '<span class="live-pill">live</span>' : '<span class="priority">roadmap</span>'}</div><h3>${esc(s.name)}</h3><p class="muted" style="color:var(--clay);font-size:0.78rem;font-weight:600;margin:0 0 8px">${esc(s.priority)}</p><p>${esc(s.coverage)}</p><div class="chips">${s.best.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div><span class="access">${esc(s.access)}</span><a href="${esc(s.url)}" target="_blank" rel="noreferrer">Docs ${ICON.ext}</a></article>`).join('')}</div>
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
  const wc = isbnOf(b.ids);
  const links = uniqLinks([...(b.links || []), ...(wc ? [{ label: 'Find in a library (WorldCat)', url: `https://search.worldcat.org/isbn/${wc}` }] : [])]);
  return `<div class="backdrop" data-close><article class="modal" role="dialog" aria-modal="true" aria-label="${esc(b.title)}">
    <button class="modal-close" data-close aria-label="Close">${ICON.x}</button>
    <div class="modal-grid">
      <div class="modal-cover">${coverInner(b, 'modal')}</div>
      <div class="modal-body">
        <p class="eyebrow">${esc(category(b))}</p>
        <h2>${esc(b.title)}</h2>
        <p class="modal-author">${esc(b.authors?.join(', ') || 'Unknown author')}</p>
        <div class="modal-row"><span class="pill ${availClass(b.availability)}">${esc(b.availability || 'Catalog only')}</span>${(b.held || 1) > 1 ? `<span class="held">${ICON.stack} in ${b.held} catalogs</span>` : ''}<span class="score"><span class="dot ${b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low'}"></span>${b.score}% complete</span></div>
        ${meta ? `<p class="book-meta" style="margin-bottom:18px">${esc(meta)}</p>` : ''}
        ${b.desc ? `<p class="modal-desc">${esc(b.desc)}</p>` : ''}
        ${b.subjects?.length ? `<div class="modal-section"><h4>Subjects</h4><div class="chips" style="display:flex;flex-wrap:wrap;gap:6px">${uniq(b.subjects).slice(0, 10).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>` : ''}
        ${ids.length ? `<div class="modal-section"><h4>Identifiers</h4><div class="id-list">${ids.map(i => `<code>${esc(i)}</code>`).join('')}</div></div>` : ''}
        ${links.length ? `<div class="modal-section"><h4>Sources · ${esc(uniq(b.sources).join(', '))}</h4><div class="link-list">${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)} ${ICON.ext}</a>`).join('')}</div></div>` : ''}
        ${b.work ? `<div class="modal-section"><h4>Editions</h4><button class="btn-ghost" data-editions="${esc(b.work)}">${ICON.stack} Show all editions</button><div class="editions"></div></div>` : ''}
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
  const bd = document.querySelector('.backdrop');
  if (bd) bd.onclick = e => { if (e.target === bd || e.target.closest('.modal-close')) { state.selected = null; render(); } };
  document.querySelectorAll('[data-editions]').forEach(el => el.onclick = e => { e.stopPropagation(); loadEditions(el.dataset.editions, el); });
}

async function loadEditions(work, btn) {
  const box = btn.nextElementSibling;
  btn.disabled = true; btn.textContent = 'Loading editions…';
  try {
    const data = await json(`https://openlibrary.org${work}/editions.json?limit=50`);
    const rows = (data.entries || []).map(e => {
      const isbn = (e.isbn_13 || e.isbn_10 || [])[0];
      const meta = [e.publishers?.[0], year(e.publish_date), e.number_of_pages ? `${e.number_of_pages} pp` : '', isbn].filter(Boolean).join(' · ');
      return `<div class="edition-row"><strong>${esc(e.title || 'Untitled edition')}</strong><span>${esc(meta)}</span></div>`;
    }).join('');
    box.innerHTML = rows || '<p class="notice">No separate editions listed.</p>';
    btn.remove();
  } catch { btn.disabled = false; btn.innerHTML = `${ICON.stack} Show all editions`; box.innerHTML = '<p class="notice">Could not load editions.</p>'; }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.selected) { state.selected = null; render(); } });
const initialQuery = new URLSearchParams(location.search).get('q');
render();
if (initialQuery) search(initialQuery);
