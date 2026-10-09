import './styles.css';
import { spacedRequests } from './request-spacing.js';
import { CC0, CC_BY, openAlexDownloads, needsPublisherLicense, downloadCredits, shelfRecord, displayRecord } from './catalog-rights.js';
import { parseGutenbergCatalog } from './gutenberg-catalog.js';
import { externalURL } from './external-links.js';
import { fetchPdf, MAX_BOOK_BYTES } from './book-download.js';
import { readPreference, writePreference, readList, zoomPreference } from './preferences.js';
import { privacySection } from './privacy.js';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { nativeExport } from './native-export.js';
import { libraryItems, readableLink, readingPage, validatePdf, textPages } from './reading.js';
import { loadPdfjs, pdfOptions } from './pdf-reader.js';
import { pdfSave, pdfLibrary, pdfGet, pdfDel, pdfUpdate } from './pdf-storage.js';
import { pdfDownload } from './pdf-download.js';

const SOURCES = [
  { name: 'Open Library', badge: 'core', priority: 'Index backbone', live: true, url: 'https://openlibrary.org/developers/api', coverage: 'Open works, editions, ISBNs, authors, subjects, covers, ratings, and Internet Archive read/borrow links.', access: 'Free API, keyless. Powers the editions expander.', best: ['works + editions', 'covers', 'ISBNs', 'subjects'] },
  { name: 'Google Books', badge: 'coverage', priority: 'Coverage enrichment', live: true, url: 'https://developers.google.com/books/docs/v1/using', coverage: 'Massive mainstream discovery index with thumbnails, previews, categories, and sale info.', access: 'Keyless (anonymous quota); add a key for production volume.', best: ['previews', 'mainstream', 'covers', 'page counts'] },
  { name: 'Project Gutenberg / Gutendex', badge: 'public domain', priority: 'Free classics', live: true, url: 'https://gutendex.com/', coverage: 'Public-domain ebook metadata, formats, languages, and download/popularity counts.', access: 'Free JSON API, keyless.', best: ['free ebooks', 'EPUB/HTML', 'classics'] },
  { name: 'OpenAlex', badge: 'scholarly', priority: 'Academic works', live: true, url: 'https://openalex.org/', coverage: 'Books, monographs, and dissertations with catalog facts and open-access links.', access: 'Free, CC0; polite pool via mailto.', best: ['monographs', 'dissertations', 'OA links'] },
  { name: 'Crossref', badge: 'scholarly', priority: 'Scholarly books', live: true, url: 'https://api.crossref.org/', coverage: 'DOI-registered books, monographs, and reference works with ISBNs and publishers.', access: 'Free polite pool; mailto included.', best: ['DOIs', 'ISBNs', 'publishers'] },
  { name: 'Internet Archive', badge: 'full text', priority: 'Read / borrow layer', live: true, url: 'https://archive.org/developers/', coverage: 'Catalog records and source links to digitized books and borrowing options.', access: 'Free, keyless.', best: ['read links', 'scans'] },
  { name: 'CORE', badge: 'open access', priority: 'Search at source', live: false, linkOnly: true, url: 'https://core.ac.uk/', coverage: 'Search papers, theses, and repository records on the CORE website.', access: 'Opens CORE in your browser.', best: ['research', 'theses', 'repositories'] },
  { name: 'DPLA', badge: 'US heritage', priority: 'US libraries + archives', live: true, url: 'https://pro.dp.la/developers', coverage: 'Tens of millions of items from US libraries, archives, and museums.', access: 'Free API key (via proxy).', best: ['archives', 'museums'] },
  { name: 'Europeana', badge: 'EU heritage', priority: 'European institutions', live: true, url: 'https://pro.europeana.eu/page/apis', coverage: 'Books and texts from 2,000+ European galleries, libraries, archives, and museums.', access: 'Free API key (via proxy).', best: ['European texts', 'manuscripts'] },
  { name: 'K10plus', badge: 'union catalog', priority: 'Union catalog (~200M)', live: true, url: 'https://www.k10plus.de/', coverage: 'One of the largest freely queryable union catalogs — the closest open analog to WorldCat scale.', access: 'Keyless SRU/Dublin Core (via proxy).', best: ['union records', 'editions', 'ISBNs'] },
  { name: 'Library of Congress', badge: 'authority', priority: 'US national catalog', live: true, url: 'https://www.loc.gov/apis/', coverage: 'Library-grade catalog records with subjects, identifiers, and provenance.', access: 'Keyless SRU (via proxy).', best: ['authority data', 'subjects', 'ISBNs'] },
  { name: 'BnF', badge: 'national', priority: 'France', live: true, url: 'https://api.bnf.fr/', coverage: 'Bibliothèque nationale de France catalog via SRU.', access: 'Keyless SRU/Dublin Core (via proxy).', best: ['French imprints', 'ARK records'] },
  { name: 'DNB', badge: 'national', priority: 'Germany', live: true, url: 'https://www.dnb.de/sru', coverage: 'Deutsche Nationalbibliothek — legal-deposit, near-complete for German publishing.', access: 'Keyless SRU (via proxy).', best: ['German imprints', 'legal deposit'] },
  { name: 'Finna', badge: 'aggregator', priority: 'Finland', live: true, url: 'https://www.finna.fi/', coverage: 'Aggregates every Finnish library, archive, and museum in one API.', access: 'Keyless JSON (via proxy).', best: ['Finnish libraries', 'ISBNs'] },
  { name: 'Nasjonalbiblioteket', badge: 'national', priority: 'Norway', live: true, url: 'https://api.nb.no/', coverage: 'National Library of Norway — large digitized book collection.', access: 'Keyless JSON (via proxy).', best: ['Norwegian imprints', 'digitized'] },
  { name: 'WorldCat', badge: 'union catalog', priority: 'Find in a library', live: false, url: 'https://www.oclc.org/developer/', coverage: 'Global union catalog of ~17k libraries. Used as keyless "find in a library" link-outs by ISBN; the full API needs OCLC membership.', access: 'Link-outs live; API requires paid OCLC membership.', best: ['holdings', 'link-outs'] },
  { name: 'Wikidata', badge: 'graph', priority: 'Knowledge graph (roadmap)', live: false, url: 'https://www.wikidata.org/wiki/Wikidata:Data_access', coverage: 'Cross-links for works, authors, awards, series, adaptations, and external IDs.', access: 'SPARQL; planned enrichment layer.', best: ['entity resolution', 'awards', 'series'] },
  { name: 'HathiTrust', badge: 'preservation', priority: 'Full-view (roadmap)', live: false, url: 'https://www.hathitrust.org/data', coverage: '~18M digitized volumes with full-view / limited-view rights signals.', access: 'Bib API by ISBN/OCLC; planned.', best: ['full view', 'rights', 'preservation'] },
];

const FEATURES = [
  ['atlas-search', 'Atlas search', 'Search trade, academic, archive, and national libraries in one place. Google Books has its own results; duplicate editions from other catalogs are grouped together.'],
  ['quality-score', 'Metadata quality score', 'Every result is scored by completeness so the most complete catalog record naturally rises to the top.'],
  ['availability', 'Availability first', 'Filter toward free ebooks, public-domain downloads, previews, borrowable scans, or catalog-only records.'],
  ['stacks', 'Personal stacks', 'Save discoveries into a working shelf for research, shopping, or syllabus building — stored on your device.'],
  ['provenance', 'Source provenance', 'Every card shows which APIs supplied the record and links straight back to each source to verify it.'],
  ['offline-reading', 'Your offline reading room', 'Save supported books and PDFs, bookmark pages, and return to your place without an internet connection.'],
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
// Server-side proxy for keyed / no-CORS sources (DPLA, Europeana and national catalogs). Keys live in Netlify env vars.
// In the native (Capacitor) app the UI loads from a local origin, so serverless
// function calls must be absolute; on the web they stay same-origin (relative).
const NATIVE = location.protocol === 'capacitor:' || location.protocol === 'file:' || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const FN_BASE = NATIVE ? 'https://librarian-atlas.netlify.app' : '';
const PROXY = `${FN_BASE}/.netlify/functions/proxy`;
const app = document.querySelector('#app');
const storeKey = 'librarian.saved.v1';
const libKey = 'librarian.library.v1';
const state = { tab: 'library', libraryQuery: '', libraryFilter: 'all', librarySort: 'recent', query: '', loading: false, loadingMore: false, searched: false, results: [], error: '', saved: loadSaved(), filters: { source: 'all', availability: 'all', language: 'all' }, limit: PAGE_SIZE, selected: null, ask: '', reply: '', replyModel: '', asking: false, askError: '', library: loadLibrary(), reader: null, readerDark: readPreference('librarian.readerDark', '0') === '1', readerZoom: zoomPreference(readPreference('librarian.readerZoom', '1')), importing: false, libError: '', offSources: loadOffSources(), sourceStats: {} };
function loadOffSources() { return readList('librarian.offSources', item => typeof item === 'string'); }
let searchToken = 0;

function loadSaved() { const loaded = readList(storeKey, item => item && typeof item.id === 'string' && typeof item.title === 'string' && ['authors', 'ids', 'sources', 'links', 'subjects', 'langs'].every(field => item[field] === undefined || Array.isArray(item[field]))); const clean = loaded.map(shelfRecord);
  if (JSON.stringify(clean) !== JSON.stringify(loaded)) writePreference(storeKey, JSON.stringify(clean));
  return clean;
}
function persist(next) {
  try {
    const serialized = JSON.stringify(next.map(shelfRecord));
    localStorage.setItem(storeKey, serialized);
    if (localStorage.getItem(storeKey) !== serialized) throw new Error('Shelf write was not confirmed');
  } catch {
    state.shelfError = 'Could not confirm the shelf change. Check available browser storage and try again.';
    return false;
  }
  state.saved = next;
  state.shelfError = '';
  return true;
}
function loadLibrary() { return readList(libKey, item => item && typeof item.id === 'string' && typeof item.title === 'string'); }
const libraryReady = pdfLibrary(state.library).then(entries => { state.library = entries; render(); }).catch(() => {
  state.libError = 'Library storage is unavailable. Your original files have not been changed.'; render();
});

/* ---------- PDF library: bytes in IndexedDB, metadata index in localStorage ---------- */

function fmtSize(n = 0) { return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`; }
const uid = () => `pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function importPdfs(files) {
  if (state.importing) return;
  const pdfs = [...files].filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
  if (!pdfs.length) { state.libError = 'Those weren’t PDFs. Add .pdf files.'; render(); return; }
  state.importing = true; state.libError = ''; render();
  try {
    await libraryReady;
    for (const f of pdfs) {
      try {
        const metadata = { id: uid(), title: f.name.replace(/\.pdf$/i, ''), author: '', source: 'Imported', size: f.size, addedAt: Date.now() };
        if (f.size > MAX_BOOK_BYTES) throw new Error('PDFs must be 75 MB or smaller.');
        await validatePdf(f);
        await pdfSave(metadata, f);
        state.library.unshift(metadata);
      } catch (error) { state.libError = `Some PDFs could not be saved. ${error.message || 'Storage may be full or blocked.'} Keep the originals and try again.`; }
    }
  } finally { state.importing = false; render(); }
}
async function removePdf(id) {
  const book = state.library.find(item => item.id === id);
  if (!book || !window.confirm(`Remove “${book.title}” and its reading progress from Librarian? Export a copy first if needed.`)) return;
  try { await libraryReady; await pdfDel(id); state.library = state.library.filter(x => x.id !== id); }
  catch { state.libError = 'Could not remove this PDF. It remains in your library.'; }
  render();
}

let readyPdfDownload;
async function downloadPdf(id) {
  const meta = state.library.find(item => item.id === id);
  if (!meta) return;
  try {
    const record = await pdfGet(id);
    const result = meta.format === 'text' ? { blob: record.blob, name: `${meta.title}.txt` } : pdfDownload(record, meta.title);
    if (await nativeExport(result.blob, result.name, downloadCredits(meta))) return;
    const url = URL.createObjectURL(result.blob);
    if (readyPdfDownload) { URL.revokeObjectURL(readyPdfDownload.url); if (readyPdfDownload.creditsUrl) URL.revokeObjectURL(readyPdfDownload.creditsUrl); }
    const credits = downloadCredits(meta);
    readyPdfDownload = { url, name: result.name, credits, creditsUrl: credits ? URL.createObjectURL(new Blob([credits], {type:'text/plain'})) : '' };
    state.libError = ''; render();
    document.querySelector('[data-pdf-download-ready]')?.click();
  } catch (error) { state.libError = error.message || 'Could not prepare the PDF download.'; render(); }
}

async function currentDownloads(workUrl) {
  if (!/^https:\/\/openalex\.org\/W\d+$/.test(workUrl)) throw new Error('Invalid source record.');
  const work = await json(workUrl.replace('https://openalex.org/', 'https://api.openalex.org/works/'), true);
  if (work.id !== workUrl) throw new Error('Source record could not be verified.');
  let publisher;
  if (needsPublisherLicense(work)) {
    const doi = work.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
    publisher = (await json(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, true)).message;
  }
  return openAlexDownloads(work, publisher).filter(d => readableLink({ downloads: [d] }));
}
async function checkDownloadLicense(book) {
  if (book._licenseBusy) return;
  state.selected = { ...book, _licenseBusy: true }; render();
  try {
    const downloads = await currentDownloads(book.downloadWork);
    if (state.selected?.id === book.id) state.selected = { ...book, downloads, _pdfMsg: downloads.length ? 'Download license confirmed. You can now save this edition.' : 'No supported download license could be confirmed. Please use the source links.' };
  } catch { if (state.selected?.id === book.id) state.selected = { ...book, _pdfMsg: 'The license check is unavailable. Please try again or open the source.' }; }
  render();
}
const savingBooks = new Set();
async function saveResultPdf(book, read = false) {
  const bookKey = key(book);
  if (savingBooks.has(bookKey)) return;
  const existing = state.library.find(item => item.bookKey === bookKey);
  if (existing) { if (read) openReader(existing.id); else { state.selected = { ...book, _pdfMsg: 'Already in your Library.' }; render(); } return; }
  const link = readableLink(book);
  if (!link) return;
  savingBooks.add(bookKey);
  state.selected = { ...book, _pdfBusy: true }; render();
  try {
    // Recheck the exact location before fetching, including bookmarks saved in older builds.
    const verified = (await currentDownloads(link.evidenceUrl)).find(d => d.url === link.url && d.license === link.license);
    if (!verified) throw new Error('Download permission is no longer confirmed. Please open the source.');
    const blob = await fetchPdf(link.url);
    await validatePdf(blob);
    await libraryReady;
    const metadata = { id: uid(), bookKey, format: 'pdf', title: verified.title || book.title || 'Untitled', author: verified.authors.join(', '), cover: '', source: verified.source, sourceUrl: verified.sourceUrl, licenseUrl: verified.license, publisherEvidenceUrl: verified.publisherEvidenceUrl, licenseEvidenceUrl: verified.evidenceUrl, rightsCheckedAt: Date.now(), size: blob.size, addedAt: Date.now() };
    await pdfSave(metadata, blob);
    state.library.unshift(metadata);
    if (state.selected && key(state.selected) === bookKey) state.selected = { ...book, _pdfMsg: 'Saved for offline reading.' };
    if (read) { openReader(metadata.id); return; }
  } catch (error) {
    if (state.selected && key(state.selected) === bookKey) state.selected = { ...book, _pdfMsg: `${error.message || 'Could not save this book.'} You can also open the source, download a PDF, and import it into Library.` };
  } finally { savingBooks.delete(bookKey); }
  render();
}

async function updateBook(id, changes) {
  try {
    const updated = await pdfUpdate(id, changes);
    state.library = state.library.map(item => item.id === id ? updated : item);
    state.libError = '';
    const notice = document.querySelector('[data-reader-status]'); if (notice) notice.textContent = '';
    if (!state.reader && state.tab === 'library') render();
    return updated;
  } catch (error) {
    state.libError = 'Could not save your reading changes. Check available storage and try again.';
    const notice = document.querySelector('[data-reader-status]');
    if (notice) notice.textContent = state.libError;
    return null;
  }
}
function openReader(id) {
  const meta = state.library.find(x => x.id === id); if (!meta) return;
  state.selected = null;
  state.reader = { id, title: meta.title, format: meta.format || 'pdf', page: readingPage(meta.page, meta.totalPages), painted: false, io: null, layout: 0 };
  document.body.classList.add('reading');
  render();
  document.querySelector('[data-reader-close]')?.focus();
}
function closeReader() {
  const reader = state.reader;
  if (reader?.io) reader.io.disconnect();
  reader?.resizeObserver?.disconnect();
  if (reader?.loadingTask) void reader.loadingTask.destroy().catch(() => {});
  state.reader = null;
  document.body.classList.remove('reading');
  render();
  document.querySelector(`[data-read="${reader?.id}"]`)?.focus();
}
function readerMeta() { return state.library.find(item => item.id === state.reader?.id); }
function updateReaderControls() {
  const r = state.reader; if (!r) return;
  const total = r.pdf?.numPages || r.text?.length || 0;
  const input = document.querySelector('[data-page-number]');
  if (input && document.activeElement !== input) input.value = r.page;
  if (input) input.max = total || 1;
  const count = document.querySelector('[data-page-count]'); if (count) count.textContent = total ? `/ ${total}` : '/ …';
  const bookmark = document.querySelector('[data-bookmark-page]');
  const marked = (readerMeta()?.bookmarks || []).includes(r.page);
  if (bookmark) { bookmark.setAttribute('aria-pressed', String(marked)); bookmark.textContent = marked ? 'Bookmarked' : 'Bookmark'; }
  const picker = document.querySelector('[data-bookmark-jump]');
  if (picker) picker.innerHTML = '<option value="">Bookmarks</option>' + (readerMeta()?.bookmarks || []).map(page => `<option value="${page}">Page ${page}</option>`).join('');
  const previous = document.querySelector('[data-page-step="-1"]'); if (previous) previous.disabled = r.page <= 1;
  const next = document.querySelector('[data-page-step="1"]'); if (next) next.disabled = !total || r.page >= total;
}
function recordPage(page) {
  const r = state.reader; if (!r) return;
  const total = r.pdf?.numPages || r.text?.length;
  if (!total) return;
  r.page = readingPage(page, total);
  updateReaderControls();
  void updateBook(r.id, { page: r.page, totalPages: total, lastReadAt: Date.now() });
}
function goToPage(page) {
  const r = state.reader; if (!r) return;
  if (!r.pdf && !r.text) return;
  r.page = readingPage(page, r.pdf?.numPages || r.text?.length);
  if (r.text) paintTextPage();
  else if (r.textMode) void paintPdfTextPage();
  else {
    const box = document.querySelector('#pdf-pages');
    const slot = box?.querySelector(`[data-page="${r.page}"]`);
    if (slot) box.scrollTop += slot.getBoundingClientRect().top - box.getBoundingClientRect().top - 10;
  }
  const input = document.querySelector('[data-page-number]'); if (input) input.value = r.page;
  recordPage(r.page);
}
async function bookmarkPage() {
  const r = state.reader; if (!r) return;
  if ((!r.pdf && !r.text) || r.bookmarkBusy) return;
  r.bookmarkBusy = true;
  const pages = readerMeta()?.bookmarks || [];
  const next = pages.includes(r.page) ? pages.filter(page => page !== r.page) : [...pages, r.page].sort((a, b) => a - b);
  await updateBook(r.id, { bookmarks: next });
  r.bookmarkBusy = false;
  if (state.reader === r) updateReaderControls();
}
function paintTextPage() {
  const r = state.reader, box = document.querySelector('#pdf-pages');
  if (!r?.text || !box) return;
  box.innerHTML = `<article class="text-page" style="font-size:${Math.round(18 * state.readerZoom)}px"><pre>${esc(r.text[r.page - 1])}</pre></article>`;
  box.scrollTop = 0;
}
async function paintPdfTextPage() {
  const reader = state.reader, box = document.querySelector('#pdf-pages');
  if (!reader?.pdf || !reader.textMode || !box) return;
  const pageNumber = reader.page;
  box.onscroll = null;
  box.innerHTML = '<p class="reader-msg" role="status">Loading page text…</p>';
  try {
    const page = await reader.pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    if (state.reader !== reader || !reader.textMode || reader.page !== pageNumber || !box.isConnected) return;
    const text = content.items.map(item => item.str === undefined ? '' : item.str + (item.hasEOL ? '\n' : ' ')).join('').trim();
    box.innerHTML = `<article class="text-page" style="font-size:${Math.round(18 * state.readerZoom)}px"><h2>Page ${pageNumber}</h2><pre>${esc(text || 'No embedded text was found on this page. This scan needs OCR before its text can be read aloud.')}</pre></article>`;
    box.scrollTop = 0;
  } catch { if (state.reader === reader && reader.textMode) box.innerHTML = '<p class="reader-msg">Page text could not be read. Switch to Page view to see the original.</p>'; }
}
function togglePdfText() {
  const reader = state.reader; if (!reader?.pdf) return;
  reader.textMode = !reader.textMode;
  reader.layout++;
  reader.io?.disconnect();
  const button = document.querySelector('[data-text-mode]');
  button.setAttribute('aria-pressed', String(reader.textMode));
  button.textContent = reader.textMode ? 'Page view' : 'Text view';
  if (reader.textMode) void paintPdfTextPage(); else void layoutPages();
}
function readerFilter() { return state.readerDark ? 'invert(0.88) hue-rotate(180deg) brightness(0.95) contrast(0.9)' : 'none'; }
function applyReaderFilter() { const el = document.querySelector('#pdf-reader'); if (el) { el.style.setProperty('--pdf-filter', readerFilter()); el.dataset.dark = state.readerDark ? '1' : '0'; } }
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
function setZoom(dir) {
  const i = ZOOMS.reduce((best, z, k) => Math.abs(z - state.readerZoom) < Math.abs(ZOOMS[best] - state.readerZoom) ? k : best, 0);
  const next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + dir))];
  if (next === state.readerZoom) return;
  state.readerZoom = next; writePreference('librarian.readerZoom', next);
  const out = document.querySelector('.zoom-val'); if (out) out.textContent = `${Math.round(next * 100)}%`;
  if (state.reader?.text) paintTextPage(); else if (state.reader?.textMode) void paintPdfTextPage(); else void layoutPages();
}
function toggleReaderDark() { state.readerDark = !state.readerDark; writePreference('librarian.readerDark', state.readerDark ? '1' : '0'); const btn = document.querySelector('[data-dark-toggle]'); if (btn) { btn.classList.toggle('active', state.readerDark); btn.innerHTML = `${state.readerDark ? ICON.sun : ICON.moon} ${state.readerDark ? 'Light' : 'Dark'}`; } applyReaderFilter(); }
async function paintReader() {
  const box = document.querySelector('#pdf-pages'); if (!box || state.reader.painted) return;
  const reader = state.reader;
  reader.painted = true;
  try {
    const rec = await pdfGet(reader.id);
    if (state.reader !== reader) return;
    if (!rec?.blob || !document.querySelector('#pdf-pages')) { if (box.isConnected) box.innerHTML = '<p class="reader-msg">File not found in storage.</p>'; return; }
    if (reader.format === 'text') {
      reader.text = textPages(await rec.blob.text());
      if (state.reader !== reader) return;
      reader.page = readingPage(reader.page, reader.text.length);
      paintTextPage(); recordPage(reader.page); return;
    }
    const lib = await loadPdfjs();
    const data = await rec.blob.arrayBuffer();
    if (state.reader !== reader) return;
    reader.loadingTask = lib.getDocument(pdfOptions(data));
    const pdf = await reader.loadingTask.promise;
    if (state.reader !== reader) { await pdf.destroy(); return; }
    reader.pdf = pdf;
    await layoutPages();
    if (state.reader !== reader) return;
    let width = box.clientWidth;
    reader.resizeObserver = new ResizeObserver(() => {
      if (Math.abs(box.clientWidth - width) < 2) return;
      width = box.clientWidth; void layoutPages();
    });
    reader.resizeObserver.observe(box);
  } catch (e) { if (box.isConnected) box.innerHTML = `<p class="reader-msg">${e?.name === 'PasswordException' ? 'This PDF is password-protected. Import an unlocked copy to read it here.' : 'Could not open this PDF. Your saved copy is unchanged; close the reader and export it or try another file.'}</p>`; }
}

// Builds the page slots at the current zoom. Re-run on zoom change (no re-parse).
async function layoutPages() {
  const reader = state.reader, box = document.querySelector('#pdf-pages'), pdf = reader?.pdf;
  if (!box || !pdf || reader.textMode) return;
  const generation = ++reader.layout;
  reader.io?.disconnect();
  let first;
  try { first = await pdf.getPage(1); } catch { return; }
  if (state.reader !== reader || generation !== reader.layout || !box.isConnected) return;
  const unit = (Math.min(box.clientWidth - 40, 900) / first.getViewport({ scale: 1 }).width) * state.readerZoom;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const approxH = Math.round(first.getViewport({ scale: unit }).height);
  box.innerHTML = '';
  const valid = () => state.reader === reader && reader.layout === generation && box.isConnected;
  const rendered = new Set();
  const renderPage = async (n, slot) => {
    if (rendered.has(n)) return; rendered.add(n);
    try {
      const page = await pdf.getPage(n); if (!valid()) return;
      const dimensions = page.getViewport({ scale: 1 });
      const pixelLimit = Math.sqrt(4000000 / (dimensions.width * dimensions.height));
      const vp = page.getViewport({ scale: Math.min(unit * dpr, 4, pixelLimit) });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page'; canvas.width = vp.width; canvas.height = vp.height;
      canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `Page ${n}`);
      canvas.style.width = `${page.getViewport({ scale: unit }).width}px`;
      // Keep a stable page slot while offscreen canvases are released.
      slot.style.minHeight = `${page.getViewport({ scale: unit }).height}px`;
      slot.replaceChildren(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      if (!valid() || !slot.isConnected) { canvas.width = 0; canvas.height = 0; }
    } catch { rendered.delete(n); if (valid()) slot.textContent = `Page ${n} could not be rendered. Reopen the book to retry.`; }
  };
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!valid()) return;
    const n = +entry.target.dataset.page;
    if (entry.isIntersecting) void renderPage(n, entry.target);
    else if (rendered.has(n)) {
      // A long book must not retain hundreds of full-resolution canvases.
      entry.target.replaceChildren(); rendered.delete(n);
    }
  }), { root: box, rootMargin: '1000px 0px' });
  for (let n = 1; n <= pdf.numPages; n++) {
    const slot = document.createElement('div'); slot.className = 'pdf-slot'; slot.dataset.page = n; slot.style.minHeight = `${approxH}px`;
    box.appendChild(slot); io.observe(slot);
  }
  reader.io = io;
  let ticking = false;
  box.onscroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false; if (!valid()) return;
      const edge = box.getBoundingClientRect().top + Math.min(100, box.clientHeight / 3);
      const slots = [...box.children];
      const slot = slots.find(slot => slot.getBoundingClientRect().bottom > edge);
      if (slot?.dataset.page && +slot.dataset.page !== reader.page) recordPage(+slot.dataset.page);
    });
  };
  goToPage(reader.page);
}
function esc(v = '') { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uniq(a = []) { return [...new Set(a.flat().filter(Boolean).map(String))]; }
function year(v) { return String(v || '').match(/-?\d{3,4}/)?.[0] || ''; }
function isbn(ids = []) { return ids.find(id => /^97[89]/.test(String(id).replace(/[^0-9X]/gi, ''))) || ids[0] || ''; }
function key(book) { if (book.id?.startsWith('gb:')) return book.id; const i = isbn(book.ids); return i ? `isbn:${i.replace(/[^0-9X]/gi, '').toUpperCase()}` : `${book.title}|${book.authors?.[0] || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
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
function coverInner(b, cls = 'book') { return externalURL(b.cover) ? `<img src="${esc(b.cover)}" alt="Cover for ${esc(b.title)}" loading="lazy" />` : `<span class="initial" style="background:${tint(b.title)}">${esc((b.title || '?').trim()[0] || '?')}</span>`; }
const SRC_TAG = { 'Open Library': 'OL', 'Google Books': 'Google Books', 'Project Gutenberg': 'PG', 'Internet Archive': 'IA', 'OpenAlex': 'OA', 'Crossref': 'CR', 'DPLA': 'DPLA', 'Europeana': 'EUR', 'CORE': 'CORE', 'K10plus': 'K10', 'Library of Congress': 'LOC', 'BnF': 'BNF', 'DNB': 'DNB', 'Finna': 'FIN', 'Nasjonalbiblioteket': 'NB' };
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
  upload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></svg>',
  read: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  sun: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>',
  moon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
};

const openLibraryRequest = spacedRequests();
async function json(url, fresh = false) {
  const request = async () => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 9500);
    try {
      const r = await fetch(url, { signal: c.signal, ...(fresh || url.startsWith('https://www.googleapis.com/books/') ? { cache: 'no-store' } : {}) });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    } finally { clearTimeout(t); }
  };
  return new URL(url, location.href).hostname === 'openlibrary.org' ? openLibraryRequest(request) : request();
}
async function text(url) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 11000); try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.text(); } finally { clearTimeout(t); } }

async function openLibrary(q) {
  const settled = await Promise.allSettled(OPEN_LIBRARY_OFFSETS.map(offset => json(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=100&offset=${offset}&fields=key,title,author_name,first_publish_year,publish_year,isbn,language,subject,cover_i,edition_count,ia,ebook_access,ratings_average,number_of_pages_median`)));
  if (settled.every(r => r.status === 'rejected')) throw new Error('Open Library is temporarily unavailable');
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
  if (settled.every(r => r.status === 'rejected')) throw new Error('Google Books is temporarily unavailable');
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.items || []) : []).map(googleBook);
}
function googleBook(item) {
  const v = item.volumeInfo || {}, s = item.saleInfo || {};
  return {
    id: `gb:${item.id}`, title: v.title || 'Google Books record', authors: v.authors || [], year: year(v.publishedDate), pages: v.pageCount || '', subjects: uniq(v.categories).slice(0, 8), langs: uniq([v.language]), ids: uniq((v.industryIdentifiers || []).map(x => x.identifier)).slice(0, 8),
    cover: (v.imageLinks?.thumbnail || '').replace('http://', 'https://'), desc: v.description || '',
    availability: s.saleability === 'FOR_SALE' ? 'For sale' : 'Catalog only',
    links: [{ label: 'Google Books', url: v.infoLink || `https://books.google.com/books?id=${encodeURIComponent(item.id)}` }], sources: ['Google Books']
  };
}
let googleShelfLoading = false;
async function refreshGoogleShelf() {
  if (googleShelfLoading) return;
  googleShelfLoading = true;
  try {
    const pending = state.saved.filter(b => b.googleReference).map(b => b.id);
    for (let i = 0; i < pending.length; i += 3) {
      await Promise.all(pending.slice(i, i + 3).map(async id => {
        try {
          const item = await json(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id.slice(3))}`);
          if (`gb:${item.id}` !== id || !item.volumeInfo?.title) return;
          const book = googleBook(item);
          state.saved = state.saved.map(b => b.id === id ? book : b);
          if (state.selected?.id === id) state.selected = book;
        } catch { /* The saved source link remains usable when metadata is unavailable. */ }
      }));
      if (state.tab === 'profile') render();
    }
  } finally { googleShelfLoading = false; }
}

async function gutenberg(q) {
  const term = encodeURIComponent(q.replace(/^isbn:/i, '').trim());
  const settled = await Promise.allSettled(GUTENDEX_PAGES.map(page => json(`https://gutendex.com/books?search=${term}&page=${page}`)));
  if (settled.every(r => r.status === 'rejected')) {
    if (!NATIVE) throw new Error('Gutenberg discovery is temporarily unavailable');
    const response = await CapacitorHttp.get({
      url: `https://www.gutenberg.org/ebooks/search.opds/?query=${term}`,
      responseType: 'text', connectTimeout: 9500, readTimeout: 11000,
    });
    if (response.status !== 200 || typeof response.data !== 'string' || response.data.length > 2_000_000) {
      throw new Error('Gutenberg discovery is temporarily unavailable');
    }
    return parseGutenbergCatalog(response.data);
  }
  return settled.flatMap(r => r.status === 'fulfilled' ? (r.value.results || []) : []).map(b => ({
    id: `pg:${b.id}`, title: b.title, authors: uniq((b.authors || []).map(a => a.name)).slice(0, 4), year: '', pages: '', subjects: uniq([...(b.subjects || []), ...(b.bookshelves || [])]).slice(0, 14), langs: uniq(b.languages), ids: [`Project Gutenberg ${b.id}`],
    cover: b.formats?.['image/jpeg'] || '', desc: `Project Gutenberg edition • ${(b.download_count || 0).toLocaleString()} downloads. Check the source for copyright and regional availability.`, availability: 'View at source',
    links: [{ label: 'Project Gutenberg', url: `https://www.gutenberg.org/ebooks/${b.id}` }, ...(b.formats?.['text/html'] ? [{ label: 'Read HTML', url: b.formats['text/html'] }] : []), ...(b.formats?.['application/epub+zip'] ? [{ label: 'Download EPUB', url: b.formats['application/epub+zip'] }] : [])], sources: ['Project Gutenberg']
  }));
}

async function openAlex(q) {
  const term = q.replace(/^isbn:/i, '').trim();
  const data = await json(`https://api.openalex.org/works?search=${encodeURIComponent(term)}&filter=type:book|monograph|dissertation&per-page=200&mailto=${encodeURIComponent(POLITE_MAILTO)}`);
  return (data.results || []).map(w => {
    const oa = w.open_access || {}, loc = w.best_oa_location || w.primary_location || {}, doi = (w.doi || '').replace(/^https?:\/\/doi\.org\//, '');
    return {
      id: `oa:${w.id}`, title: w.display_name, authors: uniq((w.authorships || []).map(a => a.author?.display_name)).slice(0, 4), year: w.publication_year || '', pages: '',
      subjects: uniq((w.topics || []).map(t => t.display_name)).slice(0, 10), langs: w.language ? [w.language] : [], ids: uniq([doi]).slice(0, 8), cover: '',
      desc: `${titleCase(w.type || 'work')}${loc.source?.display_name ? ` • ${loc.source.display_name}` : ''}${w.cited_by_count ? ` • cited ${w.cited_by_count.toLocaleString()} times` : ''}.`,
      availability: oa.is_oa ? 'Free / open access' : 'Catalog only',
      links: uniqLinks([...(oa.oa_url ? [{ label: 'Open-access full text', url: oa.oa_url }] : []), ...(loc.landing_page_url ? [{ label: 'Publisher page', url: loc.landing_page_url }] : []), ...(doi ? [{ label: 'DOI', url: `https://doi.org/${doi}` }] : []), { label: 'OpenAlex', url: w.id }]),
      downloadWork: needsPublisherLicense(w) ? w.id : '', downloads: openAlexDownloads(w), sources: ['OpenAlex']
    };
  });
}

async function crossref(q) {
  const term = q.replace(/^isbn:/i, '').trim();
  const data = await json(`https://api.crossref.org/works?query=${encodeURIComponent(term)}&filter=type:monograph,type:book,type:reference-book&rows=100&select=title,author,published,ISBN,publisher,type,subject,language,DOI&mailto=${encodeURIComponent(POLITE_MAILTO)}`);
  return (data.message?.items || []).map(it => {
    const doi = it.DOI || '', yr = (it.published?.['date-parts']?.[0] || [])[0] || '';
    return {
      id: `cr:${doi || (it.title || [])[0] || Math.random()}`, title: (it.title || [])[0], authors: uniq((it.author || []).map(a => [a.given, a.family].filter(Boolean).join(' '))).slice(0, 4), year: yr, pages: '',
      subjects: uniq(it.subject).slice(0, 10), langs: it.language ? [it.language] : [], ids: uniq(it.ISBN).slice(0, 8), cover: '',
      desc: `${it.publisher || 'Publisher'}${it.type ? ` • ${titleCase(it.type.replace(/-/g, ' '))}` : ''}.`,
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
    const wc = isbnOf(ids), catUrl = rawIds.find(x => /^https?:\/\//i.test(x)) || { K10plus: 'https://www.k10plus.de/', 'Library of Congress': 'https://catalog.loc.gov/', BnF: 'https://catalogue.bnf.fr/', DNB: 'https://www.dnb.de/' }[source];
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

// Registry of live sources. Keys match SOURCES[].name so the Sources tab can
// toggle them and show what each contributed to the last search.
const FETCHERS = {
  'Open Library': { fn: openLibrary, tier: 'fast' },
  'Google Books': { fn: googleBooks, tier: 'fast' },
  'Project Gutenberg / Gutendex': { fn: gutenberg, tier: 'fast' },
  'OpenAlex': { fn: openAlex, tier: 'fast' },
  'Crossref': { fn: crossref, tier: 'fast' },
  'Internet Archive': { fn: internetArchive, tier: 'fast' },
  'DPLA': { fn: dpla, tier: 'slow' },
  'Europeana': { fn: europeana, tier: 'slow' },
  'K10plus': { fn: k10plus, tier: 'slow' },
  'Library of Congress': { fn: loc, tier: 'slow' },
  'BnF': { fn: bnf, tier: 'slow' },
  'DNB': { fn: dnb, tier: 'slow' },
  'Finna': { fn: finna, tier: 'slow' },
  'Nasjonalbiblioteket': { fn: norway, tier: 'slow' },
};
function sourceOn(name) { return !state.offSources.includes(name); }
function toggleSource(name) {
  state.offSources = sourceOn(name) ? [...state.offSources, name] : state.offSources.filter(n => n !== name);
  writePreference('librarian.offSources', JSON.stringify(state.offSources));
  render();
}
// Runs one tier, recording per-source result counts (-1 = failed) for the Sources tab.
function runTier(tier, q) {
  return Object.entries(FETCHERS).filter(([n, v]) => v.tier === tier && sourceOn(n)).map(([n, v]) =>
    v.fn(q).then(r => { state.sourceStats[n] = (r || []).length; return (r || []).map(book => displayRecord(book, true)); })
      .catch(() => { state.sourceStats[n] = -1; return []; }));
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
  const description = Boolean(a.descriptionSource) !== Boolean(b.descriptionSource) ? (a.descriptionSource ? a : b) : ((a.desc || '').length >= (b.desc || '').length ? a : b);
  return { ...a, work: a.work || b.work, title: a.title || b.title, year: a.year || b.year, pages: a.pages || b.pages, cover: a.cover || b.cover,
    desc: description.desc, descriptionSource: description.descriptionSource, previewAtSource: a.previewAtSource || b.previewAtSource,
    availability: /free|read|borrow|preview/i.test(a.availability) ? a.availability : b.availability,
    authors: dedupeAuthors([...(a.authors || []), ...(b.authors || [])]),
    subjects: uniq([a.subjects, b.subjects]).slice(0, 16), ids: uniq([a.ids, b.ids]), langs: uniq([a.langs, b.langs]),
    downloadWork: a.downloadWork || b.downloadWork, downloads: [...(a.downloads || []), ...(b.downloads || [])], links: uniqLinks([...(a.links || []), ...(b.links || [])]), sources: uniq([a.sources, b.sources]) };
}
function merge(all, q) {
  // Google Books requires its results to retain their source order and identity.
  const google = all.filter(x => x?.title && x.sources?.includes('Google Books'));
  const recs = all.filter(x => x?.title && !x.sources?.includes('Google Books'));
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
  return out.sort((a, b) => b.rank - a.rank || Number(b.year || 0) - Number(a.year || 0)).concat(google);
}
function uniqLinks(links) { return links.filter((l, i, a) => externalURL(l?.url) && a.findIndex(x => x.url === l.url) === i); }

async function search(q) {
  q = String(q || '').trim(); if (!q) return;
  const token = ++searchToken;
  Object.assign(state, { query: q, loading: true, loadingMore: false, searched: true, error: '', limit: PAGE_SIZE, filters: { source: 'all', availability: 'all', language: 'all' } });
  if (state.tab !== 'search') state.tab = 'search';
  try { history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(q)}`); } catch {}
  render();
  const settle = async arr => (await Promise.allSettled(arr)).flatMap(r => r.status === 'fulfilled' ? r.value : []);
  state.sourceStats = {};
  // Phase 1: fast keyless sources — show results quickly.
  const fast = await settle(runTier('fast', q));
  if (token !== searchToken) return; // a newer search superseded this one
  state.results = merge(fast, q);
  state.loading = false;
  state.loadingMore = true;
  if (state.tab === 'search') render();
  document.querySelector('#results')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  // Phase 2: slower proxied / national catalogs — fill in.
  const slow = await settle(runTier('slow', q));
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
  const next = has ? state.saved.filter(x => key(x) !== key(b)) : [b, ...state.saved].slice(0, 60);
  const hadError = !!state.shelfError;
  if (!persist(next) || hadError) { render(); return; }
  if (state.tab === 'profile') { render(); return; } // shelf list changes; rebuild it
  syncSaveButtons(); syncShelfCount(); // surgical update — never touch the result images
}
function remove(id) {
  const hadError = !!state.shelfError;
  if (!persist(state.saved.filter(b => b.id !== id)) || hadError) { render(); return; }
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

function renderMd(s) {
  return esc(s)
    .replace(/^#{1,6}\s*(.+)$/gm, '<strong class="md-h">$1</strong>')
    .replace(/^\s*---+\s*$/gm, '<span class="md-hr"></span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}
async function askLibrarian(text) {
  state.ask = String(text || '').trim();
  if (!state.ask) { state.reply = ''; state.askError = ''; render(); return; }
  if (!state.results.length) { state.reply = ''; state.askError = 'Run a search first — the librarian recommends from the books your search found.'; render(); return; }
  state.asking = true; state.reply = ''; state.askError = ''; render();
  const books = state.results.slice(0, 80).map(b => ({ title: b.title, authors: (b.authors || []).join(', '), year: b.year, category: category(b), availability: b.availability }));
  const shelf = state.saved.slice(0, 20).map(b => ({ title: b.title, authors: (b.authors || []).join(', ') }));
  try {
    const r = await fetch(`${FN_BASE}/.netlify/functions/librarian`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: state.ask, query: state.query, books, shelf }) });
    const data = await r.json();
    state.reply = data.text || '';
    state.replyModel = data.model || '';
    state.askError = data.text ? '' : (data.error || 'The librarian could not respond. Try again.');
  } catch { state.askError = 'Could not reach the AI Librarian (it runs on the deployed site, not local dev).'; }
  state.asking = false; render();
}

/* ---------- views ---------- */
function topbar() {
  const tab = (id, label, badge) => `<button data-tab="${id}" class="${state.tab === id ? 'active' : ''}">${label}${badge ? `<span class="count">${badge}</span>` : ''}</button>`;
  return `<header class="topbar"><div class="wrap"><div class="brand"><span class="mark">Librarian</span><span class="mark-tag">your reading room</span></div><nav class="nav" aria-label="Sections">${tab('search', 'Discover')}${tab('library', 'Library', state.library.length || '')}${tab('sources', 'Sources')}${tab('profile', 'Shelf', state.saved.length || '')}${tab('privacy', 'Help')}</nav></div></header>`;
}

function hero() {
  return `<section class="hero"><div class="wrap"><p class="eyebrow">Discover your next read</p><h1>Find a book. Make it yours.</h1><p class="lede">Search across book catalogs and public-domain libraries. Save available full texts for reading here, or keep discoveries on your shelf.</p>
    <form class="search" data-form><div class="search-field">${ICON.search}<input name="q" value="${esc(state.query)}" placeholder="Search title, author, subject, or ISBN…" autocomplete="off" /></div><button class="btn-primary" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Searching…' : 'Search'}</button></form>
    ${sourceOn('Google Books') ? `<div class="search-attribution">${googleAttribution()}</div>` : ''}
    <p class="catalog-note"><a href="https://core.ac.uk/" target="_blank" rel="noopener noreferrer">Search CORE at its source ${ICON.ext}</a></p>
    <div class="samples">${SAMPLES.map(q => `<button data-query="${esc(q)}">${esc(q)}</button>`).join('')}</div></div></section>`;
}

function features() {
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">What it does</p><h2>Not just search — an organization layer for books.</h2></div></div>
    <div class="features">${FEATURES.map(([, h, p]) => `<article><span class="ico">${ICON.book}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('')}</div></div></section>`;
}

function googleAttribution() {
  return '<img class="google-attribution" src="./attribution/powered-by-google.png" alt="Powered by Google" width="62" height="30" />';
}
function googleSourceLink(b) {
  if (!b.sources?.includes('Google Books')) return '';
  const url = externalURL(b.links?.find(l => l.label === 'Google Books')?.url);
  return url ? `<a class="google-source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">View on Google Books ${ICON.ext}</a>` : '';
}
function bookCard(b) {
  const saved = state.saved.some(x => key(x) === key(b));
  const srcs = uniq(b.sources), held = b.held || srcs.length;
  const tags = srcs.slice(0, 4).map(s => `<span class="tag">${esc(SRC_TAG[s] || s)}</span>`).join('') + (srcs.length > 4 ? `<span class="tag more">+${srcs.length - 4}</span>` : '');
  const meta = [category(b), b.year, b.pages ? `${b.pages} pp` : ''].filter(Boolean).join(' · ');
  const dot = b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low';
  const right = b.sources?.includes('Google Books') ? '' : held > 1 ? `<span class="held" title="Found in ${held} catalogs">${ICON.stack} ${held} catalogs</span>` : `<span class="score" title="Metadata completeness"><span class="dot ${dot}"></span>${b.score}%</span>`;
  return `<article class="book" tabindex="0" aria-label="Open book details" data-select="${esc(b.id)}">
    <div class="book-cover">${coverInner(b)}</div>
    <div class="book-main">
      <div class="book-tags">${tags}</div>
      <h3 class="book-title">${esc(b.title)}</h3>
      <p class="book-author">${esc(b.authors?.join(', ') || 'Unknown author')}</p>
      <p class="book-meta">${esc(meta)}</p>
      ${googleSourceLink(b)}
      <div class="book-foot"><span class="pill ${availClass(b.availability)}">${esc(availLabel(b.availability))}</span>${right}</div>
    </div>
    <button class="book-save ${saved ? 'is-saved' : ''}" data-save="${esc(b.id)}" aria-label="${saved ? 'Remove from shelf' : 'Save to shelf'}">${saved ? ICON.bookmarkFill : ICON.bookmark}</button>
  </article>`;
}

function resultsSection() {
  const books = filtered();
  const catalogBooks = books.filter(b => !b.sources?.includes('Google Books'));
  const googleBooks = state.filters.source === 'all' || state.filters.source === 'Google Books' ? state.results.filter(b => b.sources?.includes('Google Books')) : [];
  const shown = catalogBooks.slice(0, state.limit);
  const googleShown = googleBooks.slice(0, state.limit);
  const head = `<div class="section-head"><div class="titles"><p class="eyebrow">Live atlas</p><h2>${state.loading ? 'Searching the catalogs…' : `${catalogBooks.length + googleBooks.length} results`}</h2>${!state.loading && state.results.length ? `<p>Search across ${sourceList().length} source${sourceList().length === 1 ? '' : 's'}. Google Books results appear separately in their original order.${state.loadingMore ? ' <span class="loading-more">searching more catalogs…</span>' : ''}</p>` : ''}</div>
    ${state.results.length ? `<div class="filters">
      <select data-filter="source"><option value="all">All sources</option>${sourceList().map(s => `<option ${state.filters.source === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <select data-filter="availability"><option value="all">All availability</option><option value="free" ${state.filters.availability === 'free' ? 'selected' : ''}>Readable / free</option><option value="preview" ${state.filters.availability === 'preview' ? 'selected' : ''}>Preview / catalog</option></select>
      <select data-filter="language"><option value="all">All languages</option>${languages().map(l => `<option ${state.filters.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : ''}</div>`;
  let body;
  if (state.loading) body = `<div class="books">${Array.from({ length: 8 }, () => '<div class="skeleton"></div>').join('')}</div>`;
  else if (state.error) body = `<p class="notice">${esc(state.error)}</p>`;
  else if (!catalogBooks.length && !googleBooks.length) body = '<p class="notice">No matches after filters. Try widening the lens.</p>';
  else body = `${googleShown.length ? `<section class="google-results" aria-label="Google Books search results"><div class="catalog-heading"><h3>Google Books search results</h3>${googleAttribution()}</div><p class="catalog-note">Availability and language filters apply to the other catalogs below.</p><div class="books">${googleShown.map(bookCard).join('')}</div></section>` : ''}${shown.length ? `<section aria-label="Other book catalogs">${googleShown.length ? '<h3 class="catalog-heading">Other book catalogs</h3>' : ''}<div class="books">${shown.map(bookCard).join('')}</div></section>` : ''}${catalogBooks.length > state.limit || googleBooks.length > state.limit ? `<button class="show-more" data-more>Show more results</button>` : ''}`;
  return `<section class="section" id="results"><div class="wrap">${head}${body}</div></section>`;
}

function searchTab() {
  return hero() + (state.searched ? resultsSection() : features());
}

function aiTab() {
  const n = state.results.length, scanning = Math.min(n, 80);
  const ctx = n
    ? `Reads the ${scanning} top result${scanning === 1 ? '' : 's'} from your search${state.query ? ` for “${esc(state.query)}”` : ''} and recommends specific titles.`
    : 'Search for books first — the librarian recommends from the results your search finds.';
  const samples = ['Which should I start with?', 'Pick the 3 most beginner-friendly', 'Build me a reading path', 'What\'s the most essential one here?'];
  let answer;
  if (state.asking) answer = `<div class="ai-loading"><span class="spinner"></span>Reading ${scanning} books…</div>`;
  else if (state.reply) answer = `<div class="ai-reply">${renderMd(state.reply)}</div>`;
  else if (state.askError) answer = `<p class="notice">${esc(state.askError)}</p>`;
  else answer = '<p class="notice">Ask a question to get specific picks from your search results.</p>';
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">AI Librarian</p><h2>Ask for a recommendation.</h2><p>${ctx}</p></div></div>
    <div class="ai-grid">
      <form class="ai-ask" data-ask-form>
        <textarea name="ask" placeholder="e.g. which of these should I read first, and why?">${esc(state.ask)}</textarea>
        <button class="btn-primary" ${state.asking || !n ? 'disabled' : ''}>${state.asking ? 'Reading…' : 'Ask Librarian'}</button>
        ${n ? `<div class="ai-samples">${samples.map(s => `<button type="button" data-ask="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : '<p class="ai-note">No active search yet. Run a query on the Search tab, then come back.</p>'}
      </form>
      <div class="ai-answer"><p class="label">Recommendation</p>${answer}<p class="ai-note">${state.reply && state.replyModel ? `Answered by ${esc(state.replyModel)} · ` : ''}Free via Netlify AI Gateway, with automatic fallback across Claude, GPT-4o-mini, and Gemini. Recommends only from titles your search found.</p></div>
    </div></div></section>`;
}

function libraryTab() {
  const items = libraryItems(state.library, state.libraryQuery, state.libraryFilter, state.librarySort);
  const recent = libraryItems(state.library, '', 'reading')[0];
  const cards = items.map(p => `<article class="pdf-card">
    <button class="pdf-open" data-read="${esc(p.id)}" aria-label="Read ${esc(p.title)}" style="--book-color:${tint(p.title)}"><span class="pdf-ico">${ICON.read}</span><span>${p.format === 'text' ? 'BOOK' : 'PDF'}</span></button>
    <div class="pdf-body">
      <strong>${esc(p.title)}</strong>
      <span class="pdf-meta">${esc([p.author, p.source, fmtSize(p.size)].filter(Boolean).join(' · '))}</span>
      <span class="reading-state">${p.finished ? 'Finished' : p.lastReadAt ? `Page ${p.page || 1} of ${p.totalPages || '…'}` : 'Ready to read'} · Available offline</span>
      ${[CC0, CC_BY].includes(p.licenseUrl) ? `<span class="pdf-meta"><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original source</a> · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${p.licenseUrl === CC0 ? 'CC0' : 'CC BY 4.0'} license</a></span>` : ''}
      ${p.totalPages ? `<progress value="${p.finished ? p.totalPages : p.page || 1}" max="${p.totalPages}" aria-label="Reading progress"></progress>` : ''}
      <div class="pdf-actions"><button data-read="${esc(p.id)}">${ICON.read} ${p.lastReadAt ? 'Resume' : 'Read'}</button><button data-download-pdf="${esc(p.id)}">${NATIVE ? 'Save / Share' : p.format === 'text' ? 'Download text' : 'Download PDF'}</button><button data-finished="${esc(p.id)}">${p.finished ? 'Mark unread' : 'Mark finished'}</button><button data-del-pdf="${esc(p.id)}" aria-label="Remove ${esc(p.title)}">${ICON.trash} Remove</button></div>
    </div></article>`).join('');
  return `<section class="section library-section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Your personal library</p><h2>${state.library.length ? "Your library." : "A little space for<br>your next great read."}</h2><p>${state.library.length ? "Your books, your place, your pace. Everything here is saved on this device." : "Discover a book, bring your PDFs, and pick up where you left off. Your saved books stay on this device for offline reading."}</p></div>
      <div class="library-add"><button class="btn-primary" data-import-open>${ICON.upload} Add PDFs</button><input type="file" accept="application/pdf,.pdf" multiple data-import hidden ${state.importing ? 'disabled' : ''} /><button class="btn-ghost" data-tab="search">Find a book ${ICON.search}</button></div></div>
    ${state.importing ? '<p class="notice" role="status">Adding your PDFs…</p>' : ''}
    ${state.libError ? `<p class="notice" role="alert">${esc(state.libError)}</p>` : ''}
    ${readyPdfDownload ? `<p class="notice" role="status"><a data-pdf-download-ready href="${esc(readyPdfDownload.url)}" download="${esc(readyPdfDownload.name)}">Download ${esc(readyPdfDownload.name)}</a>${readyPdfDownload.creditsUrl ? ` · <a href="${esc(readyPdfDownload.creditsUrl)}" download="${esc(readyPdfDownload.name)}.attribution.txt">Save attribution</a>` : ''}</p>` : ''}
    ${recent && !state.libraryQuery && state.libraryFilter === 'all' ? `<div class="continue-reading"><div><p class="eyebrow">Continue reading</p><h3>${esc(recent.title)}</h3><p>${esc(recent.author || recent.source)} · Page ${recent.page || 1} of ${recent.totalPages || '…'}</p></div><button class="btn-primary" data-read="${esc(recent.id)}">Pick up where you left off ${ICON.read}</button></div>` : ''}
    <div class="library-tools"><div class="library-filters" role="group" aria-label="Reading status">${[['all', 'All books'], ['reading', 'Reading'], ['unread', 'Unread'], ['finished', 'Finished']].map(([value, label]) => `<button data-library-filter="${value}" aria-pressed="${state.libraryFilter === value}">${label}</button>`).join('')}</div><span class="library-count">${state.library.length} saved</span></div>
    ${state.library.length ? `<div class="library-search-row"><form data-library-search><input type="search" name="query" aria-label="Search your library" placeholder="Search your library…" value="${esc(state.libraryQuery)}" /><button class="btn-ghost">Search</button></form><select data-library-sort aria-label="Sort library"><option value="recent" ${state.librarySort === 'recent' ? 'selected' : ''}>Recently opened</option><option value="title" ${state.librarySort === 'title' ? 'selected' : ''}>Title A–Z</option></select></div>` : ''}
    ${items.length ? `<div class="pdf-grid">${cards}</div>` : state.library.length ? '<p class="notice">No books match this view. Try another filter or search.</p>' : `<div class="library-empty"><div class="empty-book">${ICON.read}</div><h3>Your reading room starts here.</h3><p>Add a PDF from Files, or discover a book to save and read in Librarian.</p><button class="btn-ghost" data-query="Jane Austen">Explore classic books</button><label class="pdf-drop" data-import-label><input type="file" accept="application/pdf,.pdf" multiple data-import /><span>Choose PDFs or drop them here</span></label></div>`}
    </div></section>`;
}

function readerOverlay() {
  const r = state.reader; if (!r) return '';
  return `<div class="reader" id="pdf-reader" role="dialog" aria-modal="true" aria-label="Reading ${esc(r.title)}" data-dark="${state.readerDark ? '1' : '0'}" style="--pdf-filter:${readerFilter()}">
    <div class="reader-bar"><span class="reader-title">${esc(r.title)}</span>
      ${r.format === 'pdf' ? '<button class="reader-dark" data-text-mode aria-pressed="false">Text view</button>' : ''}
      <div class="reader-zoom"><button data-zoom="-1" aria-label="Zoom out">&minus;</button><span class="zoom-val">${Math.round(state.readerZoom * 100)}%</span><button data-zoom="1" aria-label="Zoom in">+</button></div>
      <button class="reader-dark ${state.readerDark ? 'active' : ''}" data-dark-toggle>${state.readerDark ? ICON.sun : ICON.moon} ${state.readerDark ? 'Light' : 'Dark'}</button>
      <button class="reader-close" data-reader-close aria-label="Close reader">${ICON.x}</button></div>
    <div class="reader-pages" id="pdf-pages" tabindex="0" aria-label="Book pages"><div class="reader-msg"><span class="spinner"></span> Opening…</div></div>
    <div class="reader-footer"><div class="page-navigation"><button data-page-step="-1" aria-label="Previous page">‹</button><form data-page-form><label>Page <input data-page-number name="page" type="number" inputmode="numeric" min="1" value="${r.page}" aria-label="Page number" /></label><span data-page-count>/ …</span><button type="submit">Go</button></form><button data-page-step="1" aria-label="Next page">›</button></div><div class="bookmark-controls"><button data-bookmark-page aria-pressed="false">Bookmark</button><select data-bookmark-jump aria-label="Go to bookmark"><option value="">Bookmarks</option></select></div><span class="reader-status" data-reader-status role="status"></span></div>
  </div>`;
}

function sourcesTab() {
  const live = SOURCES.filter(s => s.live);
  const onCount = live.filter(s => sourceOn(s.name)).length;
  const stats = state.sourceStats, ran = Object.keys(stats).length;
  const contributed = Object.values(stats).filter(v => v > 0).length;
  const summary = ran
    ? `Last search${state.query ? ` for “${esc(state.query)}”` : ''}: <strong>${contributed}</strong> of ${ran} searched catalogs returned records. Toggle any off to skip it next time.`
    : 'Run a search and this becomes a live report of exactly what each catalog contributed. Toggle any off to skip it.';
  const statOf = s => {
    const v = stats[s.name];
    if (!sourceOn(s.name)) return '<span class="src-stat off">off</span>';
    if (v === undefined) return '';
    if (v === -1) return '<span class="src-stat fail">no response</span>';
    if (v === 0) return '<span class="src-stat zero">0 records</span>';
    return `<span class="src-stat hit">${v} records</span>`;
  };
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Source control</p><h2>${onCount} of ${live.length} catalogs enabled.</h2><p>${summary}</p></div>
      <div class="src-bulk"><button data-src-all="on">Enable all</button><button data-src-all="fast">Fast only</button></div></div>
    <div class="sources">${SOURCES.filter(s => s.live || s.linkOnly || s.name === "WorldCat").map(s => `<article class="${s.live && !sourceOn(s.name) ? 'is-off' : ''}"><div class="top"><span class="badge">${esc(s.badge)}</span>${s.live ? `<label class="src-toggle" title="${sourceOn(s.name) ? 'Searching this catalog' : 'Skipping this catalog'}"><input type="checkbox" data-src="${esc(s.name)}" ${sourceOn(s.name) ? 'checked' : ''} /><span class="switch"></span></label>` : `<span class="priority">${s.linkOnly ? 'Source website' : 'Library lookup'}</span>`}</div><h3>${esc(s.name)}</h3><div class="src-line"><span class="src-role">${esc(s.priority)}</span>${s.live ? statOf(s) : ''}</div><p>${esc(s.coverage)}</p><div class="chips">${s.best.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div><span class="access">${esc(s.access)}</span><a href="${esc(s.url)}" target="_blank" rel="noreferrer">${s.linkOnly ? 'Search at source' : 'Docs'} ${ICON.ext}</a></article>`).join('')}</div>
    <div class="suggest-box" style="margin-top:44px">
      <div class="titles"><p class="eyebrow">Missing something?</p><h2>Suggest a source.</h2><p>Know an open catalog, national library, or book API Librarian should federate? Name it (and a link if you have one) and it goes straight to the project’s issue tracker.</p></div>
      <form class="suggest-form" data-suggest-form>
        <input name="src" placeholder="Source name or API URL — e.g. Trove (Australia), or api.example.org" autocomplete="off" required />
        <button class="btn-primary">Suggest ${ICON.ext}</button>
      </form>
    </div></div></section>`;
}
function submitSuggestion(text) {
  text = String(text || '').trim(); if (!text) return;
  const url = `https://github.com/armonon/librarian/issues/new?title=${encodeURIComponent('Source suggestion: ' + text.slice(0, 80))}&body=${encodeURIComponent('Suggested source: ' + text + '\n\n(Submitted from the Sources tab.)')}&labels=source-suggestion`;
  window.open(url, '_blank', 'noopener');
}

function profileTab() {
  return `<section class="section"><div class="wrap"><div class="section-head"><div class="titles"><p class="eyebrow">Your shelf</p><h2>Saved books.</h2><p>${state.saved.length ? `${state.saved.length} book${state.saved.length === 1 ? '' : 's'} saved locally in this browser.` : 'Save books from search to build your shelf.'}</p></div></div>
    ${state.saved.length ? `<div class="shelf">${state.saved.map(savedCard).join('')}</div>` : '<p class="notice">No saved books yet. Head to Search and tap the bookmark on any result.</p>'}</div></section>`;
}
function savedCard(b) {
  return `<article class="saved" tabindex="0" aria-label="Open saved book details" data-select="${esc(b.id)}"><div class="book-cover">${coverInner(b)}</div><div class="saved-body"><span class="cat">${esc(category(b))}</span><strong>${esc(b.title)}</strong><span class="author">${esc(b.authors?.[0] || 'Unknown author')}</span>${b.sources?.includes('Google Books') ? googleAttribution() + googleSourceLink(b) : ''}</div><button class="saved-remove" data-remove="${esc(b.id)}" aria-label="Remove from shelf">${ICON.trash}</button></article>`;
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
        ${b.sources?.includes('Google Books') ? googleAttribution() + googleSourceLink(b) : ''}
        <div class="modal-row"><span class="pill ${availClass(b.availability)}">${esc(b.availability || 'Catalog only')}</span>${(b.held || 1) > 1 ? `<span class="held">${ICON.stack} in ${b.held} catalogs</span>` : ''}${b.sources?.includes('Google Books') ? '' : `<span class="score"><span class="dot ${b.score >= 85 ? '' : b.score >= 70 ? 'mid' : 'low'}"></span>${b.score}% complete</span>`}</div>
        ${meta ? `<p class="book-meta" style="margin-bottom:18px">${esc(meta)}</p>` : ''}
        ${b.desc ? `<p class="modal-desc">${esc(b.desc)}</p>` : ''}
        ${b.subjects?.length ? `<div class="modal-section"><h4>Subjects</h4><div class="chips" style="display:flex;flex-wrap:wrap;gap:6px">${uniq(b.subjects).slice(0, 10).map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>` : ''}
        ${ids.length ? `<div class="modal-section"><h4>Identifiers</h4><div class="id-list">${ids.map(i => `<code>${esc(i)}</code>`).join('')}</div></div>` : ''}
        ${links.length ? `<div class="modal-section"><h4>${b.previewAtSource ? 'Previews & descriptions at source' : 'Sources'} · ${esc(uniq(b.sources).join(', '))}</h4><div class="link-list">${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)} ${ICON.ext}</a>`).join('')}</div></div>` : ''}
        ${b.work ? `<div class="modal-section"><h4>Editions</h4><button class="btn-ghost" data-editions="${esc(b.work)}">${ICON.stack} Show all editions</button><div class="editions"></div></div>` : ''}
        <div class="modal-actions"><button class="btn-ghost ${saved ? 'is-saved' : ''}" data-save="${esc(b.id)}">${saved ? ICON.bookmarkFill : ICON.bookmark} ${saved ? 'Saved' : 'Save to shelf'}</button>${readableLink(b) ? `<button class="btn-primary" data-read-result ${b._pdfBusy ? 'disabled' : ''}>${b._pdfBusy ? 'Saving…' : 'Read in Librarian'}</button><button class="btn-ghost" data-save-pdf ${b._pdfBusy ? 'disabled' : ''}>Save for offline</button>` : '<p class="ai-note">Open the source to read, borrow, or check download options. In-app downloads require a confirmed CC0 or CC BY 4.0 license for this edition. You can also import your own PDFs from Files.</p>'}</div>
        ${state.shelfError ? `<p class="notice" role="alert" data-shelf-error>${esc(state.shelfError)}</p>` : ''}
        ${b.downloadWork && !readableLink(b) ? `<button class="btn-ghost" data-check-download ${b._licenseBusy ? 'disabled' : ''}>${b._licenseBusy ? 'Checking license…' : 'Check download license'}</button>` : ''}
        ${readableLink(b) ? `<p class="ai-note">Download license: <a href="${esc(readableLink(b).license)}" target="_blank" rel="noopener noreferrer">${readableLink(b).license === CC0 ? 'CC0' : 'CC BY 4.0'}</a> · <a href="${esc(readableLink(b).sourceUrl)}" target="_blank" rel="noopener noreferrer">Original source</a>. The file’s license is checked again before saving.</p>` : ''}
        ${b._pdfMsg ? `<p class="ai-note" style="margin-top:10px">${esc(b._pdfMsg)}</p>` : ''}
      </div>
    </div>
  </article></div>`;
}

function activeTab() {
  // AI Librarian temporarily hidden — keep aiTab() defined for easy re-enable.
  if (state.tab === 'privacy') return privacySection();
  if (state.tab === 'library') return libraryTab();
  if (state.tab === 'sources') return sourcesTab();
  if (state.tab === 'profile') return profileTab();
  return searchTab();
}

function render() { if (state.reader?.painted && document.querySelector("#pdf-reader")) return; app.innerHTML = `${topbar()}<main>${state.shelfError ? `<div class="wrap"><p class="notice" role="alert" data-shelf-error>${esc(state.shelfError)}</p></div>` : ''}${activeTab()}</main>${modal()}${readerOverlay()}`; bind(); if (state.reader && !state.reader.painted) paintReader(); }
function repaintResults() { const el = document.querySelector('#results'); if (el) { el.outerHTML = resultsSection(); bind(); } else render(); }

function bind() {
  document.querySelector('[data-form]')?.addEventListener('submit', e => { e.preventDefault(); search(new FormData(e.currentTarget).get('q')); });
  document.querySelector('[data-ask-form]')?.addEventListener('submit', e => { e.preventDefault(); askLibrarian(new FormData(e.currentTarget).get('ask')); });
  document.querySelectorAll('[data-ask]').forEach(el => el.onclick = () => askLibrarian(el.dataset.ask));
  document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => { state.tab = el.dataset.tab; window.scrollTo({ top: 0 }); render(); if (state.tab === 'profile') void refreshGoogleShelf(); });
  document.querySelectorAll('[data-query]').forEach(el => el.onclick = () => { state.tab = 'search'; search(el.dataset.query); });
  document.querySelectorAll('[data-filter]').forEach(el => el.onchange = () => { state.filters[el.dataset.filter] = el.value; state.limit = PAGE_SIZE; repaintResults(); });
  document.querySelector('[data-more]')?.addEventListener('click', () => { state.limit += PAGE_SIZE; repaintResults(); });
  document.querySelectorAll('[data-save]').forEach(el => el.onclick = e => { e.stopPropagation(); toggleSave(el.dataset.save); });
  document.querySelectorAll('[data-remove]').forEach(el => el.onclick = e => { e.stopPropagation(); remove(el.dataset.remove); });
  document.querySelectorAll('[data-select]').forEach(el => el.onclick = event => { if (event.target.closest('a')) return; state.selected = state.results.find(b => b.id === el.dataset.select) || state.saved.find(b => b.id === el.dataset.select); render(); });
  document.querySelectorAll('[data-select]').forEach(el => el.onkeydown = event => { if (event.target === el && ['Enter', ' '].includes(event.key)) { event.preventDefault(); el.click(); } });
  const bd = document.querySelector('.backdrop');
  if (bd) bd.onclick = e => { if (e.target === bd || e.target.closest('.modal-close')) { state.selected = null; render(); } };
  document.querySelectorAll('[data-editions]').forEach(el => el.onclick = e => { e.stopPropagation(); loadEditions(el.dataset.editions, el); });
  document.querySelector('[data-import-open]')?.addEventListener('click', () => document.querySelector('[data-import]')?.click());
  document.querySelectorAll('[data-import]').forEach(el => el.onchange = e => { const f = e.target.files; if (f && f.length) importPdfs(f); e.target.value = ''; });
  document.querySelectorAll('[data-read]').forEach(el => el.onclick = e => { e.stopPropagation(); openReader(el.dataset.read); });
  document.querySelectorAll('[data-download-pdf]').forEach(el => el.onclick = e => { e.stopPropagation(); void downloadPdf(el.dataset.downloadPdf); });
  document.querySelectorAll('[data-del-pdf]').forEach(el => el.onclick = e => { e.stopPropagation(); removePdf(el.dataset.delPdf); });
  document.querySelectorAll('[data-save-pdf]').forEach(el => el.onclick = e => { e.stopPropagation(); const b = state.selected; if (b) saveResultPdf(b); });
  document.querySelector('[data-check-download]')?.addEventListener('click', () => { if (state.selected) void checkDownloadLicense(state.selected); });
  document.querySelector('[data-read-result]')?.addEventListener('click', () => { if (state.selected) void saveResultPdf(state.selected, true); });
  document.querySelector('[data-library-search]')?.addEventListener('submit', event => { event.preventDefault(); state.libraryQuery = new FormData(event.currentTarget).get('query') || ''; render(); });
  document.querySelectorAll('[data-library-filter]').forEach(el => el.onclick = () => { state.libraryFilter = el.dataset.libraryFilter; render(); });
  document.querySelector('[data-library-sort]')?.addEventListener('change', event => { state.librarySort = event.target.value; render(); });
  document.querySelectorAll('[data-finished]').forEach(el => el.onclick = async () => { const item = state.library.find(item => item.id === el.dataset.finished); if (item) { await updateBook(item.id, item.finished ? { finished: false, lastReadAt: 0, page: 1 } : { finished: true }); render(); } });
  document.querySelectorAll('[data-page-step]').forEach(el => el.onclick = () => goToPage(state.reader.page + Number(el.dataset.pageStep)));
  document.querySelector('[data-page-form]')?.addEventListener('submit', event => { event.preventDefault(); goToPage(new FormData(event.currentTarget).get('page')); });
  document.querySelector('[data-bookmark-page]')?.addEventListener('click', bookmarkPage);
  document.querySelector('[data-bookmark-jump]')?.addEventListener('change', event => { if (event.target.value) goToPage(event.target.value); });
  document.querySelector('[data-reader-close]')?.addEventListener('click', closeReader);
  document.querySelector('[data-text-mode]')?.addEventListener('click', togglePdfText);
  document.querySelectorAll('[data-zoom]').forEach(el => el.onclick = () => setZoom(+el.dataset.zoom));
  document.querySelectorAll('[data-src]').forEach(el => el.onchange = () => toggleSource(el.dataset.src));
  document.querySelector('[data-suggest-form]')?.addEventListener('submit', e => { e.preventDefault(); submitSuggestion(new FormData(e.currentTarget).get('src')); e.currentTarget.reset(); });
  document.querySelectorAll('[data-src-all]').forEach(el => el.onclick = () => {
    state.offSources = el.dataset.srcAll === 'fast' ? Object.entries(FETCHERS).filter(([, v]) => v.tier === 'slow').map(([n]) => n) : [];
    writePreference('librarian.offSources', JSON.stringify(state.offSources)); render();
  });
  document.querySelector('[data-dark-toggle]')?.addEventListener('click', toggleReaderDark);
  const drop = document.querySelector('[data-import-label]');
  if (drop) { drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over'); drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer?.files?.length) importPdfs(e.dataTransfer.files); }; }
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

document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (state.reader) closeReader(); else if (state.selected) { state.selected = null; render(); } } });
const initialQuery = new URLSearchParams(location.search).get('q');
render();
if (initialQuery) search(initialQuery);

if (!NATIVE && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

/* ---------- PWA install affordance ---------- */
let deferredInstall = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function installBanner(inner) {
  if (NATIVE || isStandalone() || readPreference('librarian.installDismissed', '0') === '1' || document.querySelector('.install-banner')) return;
  const el = document.createElement('div'); el.className = 'install-banner';
  el.innerHTML = `${inner}<button class="install-x" aria-label="Dismiss">${ICON.x}</button>`;
  document.body.appendChild(el);
  el.querySelector('.install-x').onclick = () => { el.remove(); writePreference('librarian.installDismissed', '1'); };
  el.querySelector('[data-install]')?.addEventListener('click', async () => { if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; } el.remove(); });
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; installBanner('<span>Install <strong>Librarian</strong> as an app.</span><button class="btn-primary" data-install>Install</button>'); });
window.addEventListener('appinstalled', () => document.querySelector('.install-banner')?.remove());
if (isIOS() && !isStandalone() && !NATIVE) setTimeout(() => installBanner('<span>Add <strong>Librarian</strong> to your Home Screen: tap Share, then <strong>Add to Home Screen</strong>.</span>'), 2500);
