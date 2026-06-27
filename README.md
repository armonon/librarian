# Librarian

A multi-source open book atlas for discovering, organizing, and verifying books across the web. Dark "reading room" UI — warm canvas, editorial serif, single clay accent.

## What it does now

- Live federated search across:
  - Open Library
  - Google Books
  - Gutendex / Project Gutenberg
- Merges duplicate-looking records by ISBN or title/author fingerprint.
- Ranks results by a metadata completeness score (shown on every card and in the detail view).
- Data-rich result cards: cover, source tags, normalized category, year, page count, availability, and score.
- Detail modal surfacing description, all identifiers, subjects, every source link, and provenance.
- Filters by source, language, and availability; paginated with "show more".
- Saves books into a local browser shelf, with a live shelf count in the nav.

### Tabs

- **Search** — the federated search and results.
- **AI Librarian** — drafts a reading path from your saved shelf. This is an *offline heuristic template*, not a live model; it reflects your question and shelf categories. Wire it to an API for generative answers.
- **Sources** — the ranked source map and the ingest → resolve → enrich → explore architecture.
- **Shelf** — your locally saved books.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Research

See [`docs/book-data-research.md`](docs/book-data-research.md) for the ranked API/source plan and long-term architecture.

## Data strategy

Best starting stack:

1. Open Library dumps as the backbone.
2. Wikidata for authority/entity enrichment.
3. Internet Archive for availability and public-domain/full-text links.
4. Gutenberg/Standard Ebooks/LibriVox for free reading/listening layers.
5. Google Books only as an enrichment layer, not the commercial backbone.
