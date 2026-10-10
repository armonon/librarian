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
- **Library** — import your PDFs, read them and keep reading progress locally.
- **AI Librarian (not exposed in the current navigation)** — dormant client/server recommendation code remains, but the app has no account/session integration. It is not an offline heuristic and must not be advertised as available. The server requires a verified Momentium account and a durable quota check before any configured provider call. Guest search, shelf and local PDF reading do not require this feature.
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

Do not deploy a partial local snapshot over a live site: first reconcile published assets, functions and configuration with the intended source. A successful frontend build does not recover production proxy configuration or prove the currently published PDF reader assets are present. Follow required PR/check gates.

### Recommendation service prerequisites

Before making the hidden AI feature reachable, integrate the approved account/login session flow (including expiry and sign-out) and send its session Bearer token to the protected function. No such client integration currently exists. Never accept a service-role key in the browser, fabricate a session, or remove the server guard to enable recommendations.

The server additionally needs `LIBRARIAN_AI_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, the durable `consume_librarian_ai_quota` RPC, and existing provider configuration. Unconfigured, expired, unverified and quota-denied requests fail closed. Configure only approved deployments; do not put credential values in source. Verified-account end-to-end recommendations remain unqualified until authorized test access and this integration exist.


## Research

See [`docs/book-data-research.md`](docs/book-data-research.md) for the ranked API/source plan and long-term architecture.

## Data strategy

Best starting stack:

1. Open Library dumps as the backbone.
2. Wikidata for authority/entity enrichment.
3. Internet Archive for availability and public-domain/full-text links.
4. Gutenberg/Standard Ebooks/LibriVox for free reading/listening layers.
5. Google Books only as an enrichment layer, not the commercial backbone.

## Curated digital collections (incremental web feature)

`/?collections=1` opens the curator workspace. It uses verified Supabase email
accounts, server-mediated collection metadata, and a private Supabase Storage
bucket for uploaded PDFs. A share link is `/?collection=<slug>`; guests can open
public and unlisted collections without an account. Local-only PDF imports and
the existing reader remain available from the original Library section.

See [`docs/collections.md`](docs/collections.md) for the migration, server
configuration, quota/security model, verification evidence, and remaining rollout
gaps. The feature is not production-ready until the migration and server env are
configured in the intended Supabase/Netlify projects and a real verified curator
account completes the live workflow in a browser.
## Installable & offline (PWA) — thecreateco Wave 4

Librarian installs as an app and **works offline after your first visit** (web only; the iOS/Electron shells don't use a service worker).

- `public/sw.js` (hand-written, no Workbox): precaches the app shell — the list and a content `VERSION` are injected at build time by the `pwaPrecache` plugin in `vite.config.js`. Navigations are network-first (3 s) with cached-page then shell fallback. `/pdfjs/` support files are cached on first use so the reader works offline.
- **Never cached:** your PDFs (IndexedDB only), Netlify functions (`/.netlify/*`), and every cross-origin request (catalog APIs, book downloads, Google Fonts). Only exception: the public thecreateco suite kit script.
- **No silent updates:** a new worker waits; `src/pwa.js` shows "Update available — Reload", and only that click posts `SKIP_WAITING`.
- `/sw.js` is served `Cache-Control: no-cache` (`public/_headers`) so updates and the kill switch reach everyone quickly.
- `npm run build && npm run pwa-check` — headless Chromium: manifest/icons, SW control, import a PDF → offline reload → reader paints it, cache audit (no PDFs/functions/cross-origin), and a v1→v2 update-prompt cycle. `PWA_CHECK_URL=https://librarian.thecreatingco.com/ npm run pwa-check` runs the offline checks against a deployed site.

### Service worker kill switch

If the service worker itself ever misbehaves in production: `npm run build && cp scripts/kill-switch-sw.js dist/sw.js`, then deploy `dist`. Every browser that installed it unregisters it and clears Librarian's caches on its next visit (PDFs and shelf are untouched). Restoring an older deploy alone does **not** remove an installed worker.

## thecreateco suite menu + Locker

On the web, `src/pwa.js` adds `<script src="https://thecreatingco.com/suite/v1/suite.js" data-app="librarian" defer>` and the header carries a persistent `<tcc-suite-menu>`. Optional: if the kit is missing or offline, nothing changes. The CSP allows `https://thecreatingco.com` for scripts, fonts and the Locker bridge frame.

- **Save to Locker** on each Library PDF (stored in this browser on this device — no account, no cloud).
- **Open from Locker:** `/?tcc-open=<id>` with a PDF adds it to the Library and opens the reader.
