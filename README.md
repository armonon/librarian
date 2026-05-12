# Librarian

A beautiful, multi-source open book atlas for discovering, organizing, and verifying books across the web.

## What it does now

- Live federated search across:
  - Open Library
  - Google Books
  - Gutendex / Project Gutenberg
- Merges duplicate-looking records by ISBN or title/author fingerprint.
- Shows metadata completeness scores.
- Filters by source, language, and availability.
- Saves books into a local browser stack.
- Shows source provenance and direct source links.
- Includes a built-in roadmap for turning this into a canonical book graph.

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
