# Librarian — distribution guide (iOS App Store + notarized macOS app)

Two shippable builds come from the same web app (`dist/`):

- **iOS App Store** — Capacitor project in `ios/` (see also `ios-app-store.md`).
- **macOS app (notarized)** — Electron wrapper in `electron/`, packaged by
  electron-builder into a signed, notarized `.dmg`/`.zip`.

Both build the web UI first; live data is fetched over HTTPS from
`librarian-atlas.netlify.app`. Team ID: **NJBZDU7XZX** (Armon Nasiri).

> The final signing / notarize / upload steps authenticate against your Apple
> account and can't be automated for you — they need your Apple ID + 2FA (or an
> App Store Connect API key) and access to your signing certs.

## 0. One-time: point at full Xcode (needs your password)

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

---

## A. iOS — App Store

Cleanest is the Xcode GUI (handles the Distribution cert + profile for you):

```bash
npm run ios:sync   # build web + copy into the iOS project
npm run ios:open   # open ios/App/App.xcodeproj
```

In Xcode: **App target → Signing & Capabilities** → *Automatically manage
signing* → Team = Armon Nasiri (NJBZDU7XZX). Then **Product → Archive**
(destination "Any iOS Device") → **Distribute App → App Store Connect →
Upload**. Finish metadata + screenshots at appstoreconnect.apple.com, set
**App Privacy → Data Not Collected**, and Submit.

*(CLI alternative: `xcodebuild -project ios/App/App.xcodeproj -scheme App
-archivePath build/App.xcarchive archive` then `xcodebuild -exportArchive
-archivePath build/App.xcarchive -exportOptionsPlist build-resources/ExportOptions.plist
-exportPath build/ipa`, then upload the .ipa with Transporter or
`xcrun notarytool`/altool. The GUI is simpler for a first release.)*

There is **no notarization** for iOS — App Store review replaces it.

---

## B. macOS — notarized app (outside the Mac App Store)

Uses your **Developer ID Application: Armon Nasiri (NJBZDU7XZX)** cert
(already in your keychain).

### 1. Store notarization credentials once
Create an app-specific password at appleid.apple.com → Sign-In & Security →
App-Specific Passwords. Then:

```bash
export APPLE_ID="mistamoneymaker@icloud.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="NJBZDU7XZX"
```

### 2. Build → sign → notarize → staple (one command)

```bash
npm run build
APPLE_ID="$APPLE_ID" APPLE_APP_SPECIFIC_PASSWORD="$APPLE_APP_SPECIFIC_PASSWORD" APPLE_TEAM_ID="$APPLE_TEAM_ID" \
  npx electron-builder --mac -c.mac.notarize=true
```

electron-builder will: sign with your Developer ID cert (auto-discovered from
the keychain — you may get a one-time keychain-access prompt; click *Always
Allow*), submit to Apple's notary service, wait, and staple the ticket. Output
lands in `dist-mac/` as `Librarian-<ver>-arm64.dmg` (and `.zip`).

### 3. Verify

```bash
spctl -a -vvv -t install "dist-mac/mac-arm64/Librarian.app"   # → accepted, source=Notarized Developer ID
xcrun stapler validate "dist-mac/mac-arm64/Librarian.app"      # → The validate action worked!
```

Ship the `.dmg`. Users can open it with no Gatekeeper warning.

### Unsigned test build (no account needed)
```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run mac:pack   # → dist-mac/mac-arm64/Librarian.app
```

---

## Notes
- Bundle id / appId is `com.armonon.librarian` for both (change in
  `capacitor.config.json`, Xcode, and `package.json > build.appId` if needed).
- Everything the app calls is HTTPS with permissive CORS, so no ATS exceptions
  and no Mac network entitlement issues.
- Updating: change code → rebuild → re-archive (iOS) / re-run the notarize
  command (macOS). Bump versions in `package.json` and Xcode.
