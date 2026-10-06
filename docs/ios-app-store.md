# Librarian — iOS App Store guide

The app is wrapped as a native iOS app with **Capacitor** (project in `ios/`).
The web UI is bundled into the app; live data (search APIs, the serverless
proxy, AI) is fetched over HTTPS from `librarian-atlas.netlify.app`.

## One-time prerequisites (only you can do these)

1. **Full Xcode** — Xcode 26.2 and the iOS SDK are installed on this machine.
   The global developer directory still selects Command Line Tools. Use
   `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for build commands;
   changing the global selection is not necessary.
2. **Apple Developer Program** — enroll at developer.apple.com ($99/year).
3. **Bundle ID** — default is `com.armonon.librarian`. If that's taken or you
   want your own, change `appId` in `capacitor.config.json` and the target's
   Bundle Identifier in Xcode, then `npm run ios:sync`.

## Build & run

```bash
npm run ios:sync   # builds the web app and copies it into the iOS project
npm run ios:open   # opens ios/App/App.xcodeproj in Xcode
```

In Xcode:
- Select the **App** target → **Signing & Capabilities** → check
  *Automatically manage signing* → pick your **Team**.
- Choose a simulator or your iPhone → press **▶ Run** to test.

## Submit to the App Store

1. Set version/build: target → General (or `MARKETING_VERSION` / build number).
2. **Product → Archive** (select "Any iOS Device" first).
3. In the Organizer: **Distribute App → App Store Connect → Upload**.
4. At appstoreconnect.apple.com: create the app record (same bundle ID), add
   metadata (name, subtitle, description, keywords), upload screenshots
   for the currently required iPhone/iPad sizes, complete **App Privacy** after
   reviewing actual app and server data handling (do not assume Data Not Collected:
   the AI request sends the question, query, books and shelf to the server), attach
   the uploaded build, and **Submit for Review**.

## Updating later

Change code → `npm run ios:sync` → bump the build number → Archive → Upload.
(UI changes ship with the app; book data is always live from the APIs, so most
content updates need no resubmission.)

## Notes
- The iOS target is now **iOS/iPadOS 18+**, matching PDF.js's documented Safari
  legacy-build baseline, not a claim that older OS/device tests have passed.
  `ios:sync` uses the matching legacy PDF API/worker and a Safari 18 compilation
  target. Desktop production builds retain their original PDF entry points.
- A post-sync hook corrects Capacitor 8.5.2's generated `.iOS(.v18)` enum to
  `.iOS("18.0")`, which is valid under its generated Swift tools 5.9 manifest.
- PDF imports now persist owned ArrayBuffer bytes instead of temporary File
  references. This fixes the observed WebKit IndexedDB import failure. Existing
  Blob records remain readable. Transactions close connections and reject aborts.
  Offline import, actual PDF canvas painting and reload persistence passed in
  iPhone/iPad Playwright WebKit emulation; that does not prove native Files access.
- On September 28, signing was blocked because Xcode rejected the saved Apple
  Account login and no iOS provisioning profiles were installed. Sign in again
  through Xcode Settings, then select the correct team and provision the app.
  Unsigned archives and simulator apps are not public iPhone downloads.
- Prefer TestFlight qualification before App Store submission. Verify offline PDF
  import/render/reopen, network errors, background recovery, VoiceOver and Files
  access on physical iPhone and iPad; the simulator cannot establish those fully.
- **HTTPS only** from the app — no App Transport Security exceptions needed
  (the one HTTP catalog, LoC SRU, is reached server-side via the proxy).
- **Guideline 4.2 (minimum functionality):** this is a real app, not a web
  wrapper — offline PDF library + reader (Day/Dark/zoom), a saved shelf, and
  federated search across 15 catalogs. Lead with those in the review notes.
- To make external links (Docs, WorldCat, source links) open in Safari cleanly,
  consider adding `@capacitor/browser` later; default behavior is acceptable.

## Reading-room update — October 6, 2026

Library now opens first. Imported PDFs and supported search downloads are saved
with their bytes, reading position, page count, bookmarks, and read/unread state.
The library supports title/author search, recent/title sorting, status filters,
and Continue reading. Existing PDF records and saved catalog shelves are retained.

Search details offer **Read in Librarian** and **Save for offline** for direct
HTTPS PDFs and Gutenberg books. Gutenberg editions are saved as plain text, with
adjustable type, paginated reading and bookmarks. Catalog-only records retain
source links; this does not unlock commercial books, DRM, or borrowing services.
EPUB import and cross-device/iCloud synchronization are not implemented.

The native app fetches Gutenberg text via CapacitorHttp. The web version uses the
new `netlify/functions/book-text.mjs` endpoint, which must be deployed with the
web bundle before web discovery-to-text reading works. This update has not been
published. The function only retrieves numbered Gutenberg editions and rejects
HTML and invalid responses.

Save / Share uses Capacitor Filesystem and Share to present the native share
sheet (including Save to Files). Temporary export copies are removed after the
sheet closes. Library bytes are unchanged. The filesystem required-reason privacy
manifest is included in the Xcode Resources phase. Library storage is local; it
is not a cloud backup and uninstalling the app can remove it.

Verification commands:

```sh
npm test
npm run test:browser
npm run ios:sync
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild \
  -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/librarian-reading-build CODE_SIGNING_ALLOWED=NO build
```

The browser tests use WebKit at iPhone and iPad dimensions. External network
requests are blocked for saved-book reopen checks while local bundled assets
remain available, matching native packaging. Service workers are disabled in
these tests. Search responses are fixtures; the Gutenberg function was also
checked against a live edition. These checks do not qualify the native Files
picker, native share sheet, VoiceOver, or physical-device background recovery.

Latest local verification: 31 unit tests and 4 WebKit flow tests passed; the
unsigned simulator build succeeded and launched on the Release QA iPhone and
Release QA iPad. Screenshots were visually inspected. Vite development and preview
serve the local Gutenberg endpoint, and the PDF worker is excluded from dependency
prebundling to preserve its URL import in WebKit development. Native release
signing, TestFlight upload, and web deployment have not been performed.
