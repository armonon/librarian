# Librarian book data research

Goal: make Librarian the most useful, organized book index on the web by combining open bibliographic metadata, authority graphs, availability signals, public-domain full text, covers, and provenance.

## Recommended source ranking

1. **Open Library** — primary backbone
   - Docs: https://openlibrary.org/developers/api and https://openlibrary.org/developers/dumps
   - Best for works, editions, authors, ISBN/OCLC/LCCN/OLID IDs, subjects, languages, covers, IA links, ratings/log dumps.
   - Use monthly dumps for bulk. API is for low-volume user-facing lookups; identify with User-Agent.

2. **Wikidata** — open authority/enrichment graph
   - Docs: https://www.wikidata.org/wiki/Wikidata:Data_access
   - CC0. Strong for author/work identity, series, awards, genres, translations, adaptations, and external IDs.

3. **Internet Archive** — availability and full-text layer
   - Docs: https://archive.org/developers/
   - Best for digitized books, scans, PDFs, EPUBs, OCR text, collections, item metadata, thumbnails, and read/borrow/download links.
   - Rights vary per item; store availability/link-out rather than assuming reuse.

4. **Library of Congress** — library-grade metadata
   - Docs: https://www.loc.gov/apis/
   - Good for structured collection records, contributors, subjects, dates, formats, places, LCCN, and provenance.

5. **Project Gutenberg / Gutendex** — public-domain ebooks
   - Docs: https://gutendex.com/ and https://www.gutenberg.org/ebooks/offline_catalogs.html
   - Best for public-domain texts, formats, languages, subjects, and download/popularity signals.

6. **Crossref + DataCite** — scholarly books and chapters
   - Docs: https://api.crossref.org/works and https://api.datacite.org/
   - Best for DOI metadata, monographs, chapters, proceedings, publishers, references, ORCID/ROR links.

7. **Google Books API** — enrichment, not the core backend
   - Docs: https://developers.google.com/books/docs/v1/using
   - Useful for mainstream volume coverage, preview links, thumbnails, categories, sale info.
   - Caveat: terms are restrictive for paid/commercial products; avoid as sole data source.

8. **HathiTrust** — preservation and rights signal
   - Example: `https://catalog.hathitrust.org/api/volumes/brief/json/isbn:9780131103627`
   - Best for Full View / Limited Search availability, HathiTrust IDs, item links, and rights codes.

9. **Standard Ebooks + LibriVox** — high-quality public-domain reading/listening layer
   - Standard Ebooks: https://standardebooks.org/ebooks
   - LibriVox API: https://librivox.org/api/feed/audiobooks/?format=json
   - Great for polished ebooks and audiobook availability.

## Lower-priority / caution

- **ISBNdb**: useful but paid/closed; verify terms.
- **WorldCat/OCLC**: excellent catalog, restricted access; only via official agreements/APIs, no scraping.
- **NYT Books API**: useful popularity signal, not bibliographic base; needs key and has terms.
- **Goodreads**: no reliable public official API for new projects; avoid scraping.

## Proposed architecture

### Canonical model

- `Work`
- `Edition`
- `Contributor`
- `Identifier`
- `Availability`
- `Cover`
- `SourceRecord`
- `PopularitySignal`

Every imported fact should include source, timestamp, source URL, confidence, and rights/availability notes when applicable.

### Initial bulk ingest

1. Open Library dumps: works, editions, authors, identifiers, subjects.
2. Wikidata dump/SPARQL enrichment: entity IDs, series, awards, adaptations, alternate names.
3. Gutenberg / Standard Ebooks / LibriVox: public-domain reading and listening inventory.
4. Internet Archive metadata: availability, scans, OCR files, collections.
5. LOC data: authority-grade enrichment after entity resolution stabilizes.

### On-demand enrichment

- Google Books for previews/covers/snippets where terms permit.
- Crossref/DataCite for scholarly books and chapters.
- HathiTrust for preservation/full-view/limited-view availability.

### Search/index

- Postgres for canonical entities and source records.
- Meilisearch/OpenSearch for title/author/subject/identifier search.
- Separate full-text index only for public-domain/licensed text.

### Rights-safe serving

- Store metadata broadly.
- Store/download full text only from clearly public-domain/open sources.
- For restricted scans, show availability and link out; do not serve content.

## MVP implemented now

The current static Vite app includes live federated search against:

- Open Library
- Google Books
- Gutendex / Project Gutenberg

It also includes:

- duplicate merging by ISBN/title-author fingerprint
- metadata quality score
- availability/source/language filters
- local saved stacks
- source provenance on every result
- detail modal with identifiers and source links
- visible source/research map and next-level architecture section
