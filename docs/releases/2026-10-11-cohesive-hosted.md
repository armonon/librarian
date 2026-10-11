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

## Connected service follow-up

Final deployment: `6acbb129728c6871b33101b0`.

The existing site configuration already enabled Collections and its RLS tables existed. The older deployed function still returned disabled. Packaging the current Collections handler with the official Netlify bundler and binding this release to the existing production runtime configuration restored `enabled: true`, with public browsing returning an empty collection list. The other three function archives and all unrelated static files remain exact.

Unauthenticated mine/create/follow requests return 401, an untrusted Origin returns 403, and invalid book identifiers return 400. Real Chromium 1440/390/320 checks import and read a local PDF, reopen the draft after reload, and confirm publishing requires email verification. No account email was sent, no SQL migration ran, and no database records were changed. Authenticated publishing/invitation and database isolation are not end-to-end qualified by these guest checks.

Optional Locker initialization now refreshes only the Library tab, keeping an active Collections form intact. The final frontend builds successfully; 58 unit cases and local PWA/offline/update checks pass. A full four-function hosting build requires the legacy proxy's ignored `_keys.mjs`; this release packages only the changed Collections handler and retains the existing proxy archive, avoiding credential substitution or secret files in Git.
