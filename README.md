# Librarian

A multi-source open book atlas for discovering, organizing, and verifying books across the web. Dark "reading room" UI — warm canvas, editorial serif, single clay accent.

## What it does now

- **Live federated search across 15 catalogs**, fanned out in parallel:
  - Trade/general: Open Library, Google Books, Gutendex / Project Gutenberg
  - Academic: OpenAlex, Crossref, CORE
  - Digitized / archives: Internet Archive, DPLA, Europeana, Finna
  - Union / national catalogs: K10plus (~200M), Library of Congress, BnF, DNB, Nasjonalbiblioteket (Norway)
  - Plus keyless WorldCat "find in a library" link-outs by ISBN.
- **Cross-source dedup** via union-find clustering: records merge if they share any ISBN *or* a fuzzy title+author fingerprint, so ISBN-less records still merge across sources.
- **Relevance-blended ranking**: query relevance + metadata completeness + catalog count.
- Result cards show cover, source tags, normalized category, year, page count, availability, score, and an **"in N catalogs"** breadth badge.
- Detail modal surfaces description, all identifiers, subjects, every source link, provenance, and an **Open Library editions expander** (every edition of a work on demand).
- Filters by source, language, and availability; paginated with "show more".
- Saves books into a local browser shelf, with a live shelf count in the nav.

### Architecture

Keyless, CORS-friendly sources are called directly from the browser. Keyed or no-CORS sources (CORE, DPLA, Europeana, and the SRU/JSON national catalogs) go through a Netlify Function proxy (`netlify/functions/proxy.mjs`) that holds the API keys server-side — keys live in Netlify env vars or a gitignored `netlify/functions/_keys.mjs`, never in the client bundle or git.

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

## Deploy

The live site (Netlify) does **not** auto-deploy from GitHub. Deploy manually:

```bash
npm run build && netlify deploy --prod --dir=dist
```

Set the proxy API keys as Netlify env vars (`DPLA_KEY`, `EUROPEANA_KEY`, `CORE_KEY`) or in a gitignored `netlify/functions/_keys.mjs`.

## Research

See [`docs/book-data-research.md`](docs/book-data-research.md) for the ranked API/source plan and long-term architecture.

## Data strategy

Best starting stack:

1. Open Library dumps as the backbone.
2. Wikidata for authority/entity enrichment.
3. Internet Archive for availability and public-domain/full-text links.
4. Gutenberg/Standard Ebooks/LibriVox for free reading/listening layers.
5. Google Books only as an enrichment layer, not the commercial backbone.
