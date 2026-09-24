# Librarian — iOS App Store guide

The app is wrapped as a native iOS app with **Capacitor** (project in `ios/`).
The web UI is bundled into the app; live data (search APIs, the serverless
proxy, AI) is fetched over HTTPS from `librarian-atlas.netlify.app`.

## One-time prerequisites (only you can do these)

1. **Full Xcode** — install from the Mac App Store (~7 GB). This machine only
   has Command Line Tools, which can't build/submit iOS apps.
   After installing: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
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
   (6.7" iPhone required), set **App Privacy → Data Not Collected** (the app
   stores your shelf/PDFs only on-device and queries public book APIs), attach
   the uploaded build, and **Submit for Review**.

## Updating later

Change code → `npm run ios:sync` → bump the build number → Archive → Upload.
(UI changes ship with the app; book data is always live from the APIs, so most
content updates need no resubmission.)

## Notes
- **HTTPS only** from the app — no App Transport Security exceptions needed
  (the one HTTP catalog, LoC SRU, is reached server-side via the proxy).
- **Guideline 4.2 (minimum functionality):** this is a real app, not a web
  wrapper — offline PDF library + reader (Day/Dark/zoom), a saved shelf, and
  federated search across 15 catalogs. Lead with those in the review notes.
- To make external links (Docs, WorldCat, source links) open in Safari cleanly,
  consider adding `@capacitor/browser` later; default behavior is acceptable.
