# Cohesive hosted Librarian release — 2026-10-11

Published deployment: `6acbab77a8b738a1a1d7a6e1` at https://librarian.thecreatingco.com.

Preserves the newer production Collections designer captured from the publisher's local source and matching production bundle `index-oDXrQM_f.js`. Adds the account-wide PWA and Locker changes to this designer rather than restoring the older incompatible Collections client/service-role endpoints.

- Local collections retain themes, arrangements, imported PDFs, reading progress and bookmarks.
- Reader imports from Locker and offers PDF export to Locker; shared company navigation remains available.
- Generated offline precache, explicit update/reload prompt, lazy-load-safe worker registration, and deployed canonical metadata remain intact.
- All four production function digests were retained exactly, including the existing Collections feature flag and RLS implementation.
- The production Collections configuration currently reports `enabled: false`. Public sharing, curator verification and invitations require backend configuration and database qualification. Local drafts remain functional; no database or account records were changed.

Validation: 58 unit tests, 30 Chromium browser cases across 1440/390/320 widths (mocked collections cases are client contracts), production build, and real local/draft/live offline PDF import/read tests. Local update prompt/reload cycle and cache audit pass. The hosting service returns `max-age=0,must-revalidate` for the worker, equivalent mandatory network revalidation to `no-cache`; the check accepts both.

Release manifest and deployment evidence: `/Users/lillypad/Projects/remaining-app-releases-20261011`.
