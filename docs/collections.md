# Librarian Collections

Collections is integrated into the web, Electron and Capacitor app. Offline Library remains device-local. Collections adds local design drafts and optional hosted reading rooms.

## Included

- Curator name, biography, welcome note, subject, three themes, and shelves/gallery/reading-path layouts.
- PDF upload or import from the offline library, custom title/author/note/cover color/shelf/order.
- Public discovery, subject filtering and title/curator/subject search, persistent following and saved collections.
- Public links (`/?collection=<UUID>`), guest reading in the existing PDF.js reader, device-local progress/bookmarks, and explicit Save offline.
- Public, unlisted, private and unpublished access; owner publication controls; verified co-curator invitations and revocation.
- Momentium eight-digit email-code sign-in, token refresh, sign-out, content reports and deletion.
- Server validation, private object storage, database RLS, byte limits, immutable ownership, upload cleanup and bounded JSON.

Limits: 10 libraries per owner, 50 books per library, 4 MiB per shared PDF. The shared-upload cap fits Netlify's binary request limit. Offline PDF import keeps its existing larger limit. Co-curators manage books; only owners manage design, publishing, invitations and deletion. Inviting adds an account to the access list; it does not send email. Unlisted is link-accessible rather than private. Reports are stored for an operator to review; configure ownership of that queue before launch. MFA-enrolled accounts are denied until an additional-factor UI is implemented. Existing AI recommendations remain unavailable.

## Connect the backend

Apply `supabase/migrations/202610100001_librarian_collections.sql` once in the selected project's SQL editor or migration pipeline. It only creates Librarian-namespaced objects and one **private** bucket. It does not alter existing account settings, tables or buckets. Take a database backup before a production migration. The local database verification uses a disposable PostgreSQL cluster with minimal Supabase auth/storage schemas, not the production project.

Set server runtime variables in Netlify's **Functions** scope:

- `SUPABASE_URL`: selected project's HTTPS URL.
- `SUPABASE_PUBLISHABLE_KEY`: publishable key or legacy anon key, **never** a service-role key.
- `LIBRARIAN_COLLECTIONS_ENABLED=true`: enable only after the migration and live checks.
- `LIBRARIAN_ALLOWED_ORIGINS`: comma-separated extra web origins, when needed. The function accepts its own request origin and `capacitor://localhost`; Electron file-origin requests use the `null` origin; every mutation still requires a verified bearer token.

These variables must be set in hosted runtime configuration; a local `.env` file does not configure production. Local Vite reads process environment for this endpoint. The UI's configuration endpoint returns only an enabled boolean, never a key. All database and storage operations use the caller's access token, or anonymous access for public reads; no service-role bypass is used. Preserve the existing verified Momentium email-code length, SMTP and confirmation settings.

Native apps use the existing `https://librarian-atlas.netlify.app` function base and public share origin. Deploy the functions and frontend together to that intended existing site. Do not replace other live catalog proxy configuration. iOS and Electron packages need rebuilding before they contain this feature. A successful frontend build alone does not publish, update App Store declarations, or verify real email delivery.

## Verification and operations

`npm test` covers server authorization, PDF validation, failure cleanup, request validation and existing reading/storage behaviors. `npx playwright test tests/browser/collections.spec.js` exercises local draft persistence, guest PDF reading, offline saves, email-code UX, publishing, follow/save and phone/iPad layouts using a simulated backend. `npm run test:collections:db` creates and cleans up an isolated local PostgreSQL cluster (`PGBIN` can select its binaries); `tests/collections-rls.sql` checks the actual SQL policies in a disposable database: private visibility, owner/editor/stranger boundaries, revocation, immutable owner IDs, unlisted access, favorite privacy and automatic unpublication of empty libraries.

Before enabling production, verify two independently controlled confirmed accounts: new and returning email delivery, refresh/sign-out, a published link in a guest browser, private access rejection, co-curator invite/revoke, PDF upload/delete, and report receipt. Native transport and physical-device QA remain separate checks. Do not send verification codes to other people's inboxes without their authorization.

Review `librarian_reports` with restricted administrative access and resolve/remove reported content through the owner/admin workflow. Delete orphaned storage objects through the Storage API after failed cleanup; do not remove `storage.objects` rows manually. Access is checked on each read and public PDF responses are `private, no-store`; already downloaded visitor copies cannot be recalled. Deleting an account requires removing its uploaded objects through the Storage API before the auth user is removed.

Implementation references: [Supabase storage access controls](https://supabase.com/docs/guides/storage/security/access-control), [Netlify function payload limits](https://docs.netlify.com/build/functions/configuration/).

## Verification result — October 10, 2026

- 58 Node tests passed.
- All 30 browser scenarios passed across small iPhone, iPhone and iPad. Two iPad regression runs were invalidated by concurrent build output replacement and passed when rerun against a stable build. The nine Collections scenarios passed, including public guest reading and the simulated publishing/account flow.
- SQL migration and role/access checks passed in an isolated PostgreSQL 16 cluster.
- Web production build and iOS-target build/Capacitor synchronization succeeded.
- Applied the namespaced migration to the existing NOW production project (`ggocizycptonnquijywu`). The SQL editor reported success. Confirmed the Storage policy set contains only the three intended Librarian policies.
- Repeated the role/access checks against the actual Supabase auth/storage schemas in a transaction: verified guest/public access, private rejection, owner/editor/stranger boundaries, unverified rejection, co-curator revocation, immutable ownership, unlisted visibility, favorite privacy and automatic unpublication. Every fixture mutation was scoped to the test collection and rolled back; no test users or libraries remain.
- Configured `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `LIBRARIAN_COLLECTIONS_ENABLED` in Netlify Functions scope, preserving other runtime settings.
- Published deployment `6ac9eb6e60494397bc888895` to [Librarian](https://librarian.thecreatingco.com). Hosted configuration and browsing return 200; guest owner operations return 401 and missing/private libraries return 404. The live Collections interface shows Sign in and connected discovery.
- Retained the exact existing `librarian` and `proxy` function archive digests and twelve legacy assets. Added `collections` and `book-text` together with the frontend. The prior Collections deployment is `6ac9ea83875ca3c81c6b8391`; the pre-Collections deployment is `6ac1ecba6479a9e160b433b7` for Netlify rollback. Desktop primary actions were verified at a minimum height of 44 pixels.
- Real email delivery and an authenticated two-account HTTP/browser flow still need a tester-controlled inbox and verification code. Production SQL checks exercise database roles directly and do not qualify SMTP delivery or actual PDF byte transport. Native binary distribution remains separate.
