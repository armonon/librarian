# Librarian 1.0 (6) candidate — release readiness, October 7, 2026

**Decision: build 6 tested, signed, uploaded, processed and attached. Content Rights remains unresolved.**
Build 6 is attached to version 1.0, with export compliance cleared.
The release preserves all search providers and limits direct downloads.
No App Review submission or public release has occurred.

## Build 6 follow-up

- All 15 search providers, catalog covers/descriptions and external source links
  remain. Direct in-app downloads require an exact CC0 PDF location from OpenAlex,
  or a published OpenAlex edition matched by DOI to an effective CC BY 4.0
  version-of-record license deposited with Crossref. Both metadata sources are
  revalidated without HTTP caching immediately before file retrieval.
- Unlicensed/unknown download URLs and Gutenberg identifiers no longer enable
  direct file actions. Original PDFs imported from Files and existing local books
  retain offline reading, bookmarks and export.
- Downloaded files retain original title/authors, source, exact license, evidence
  URL and check time. Source/license links appear in the library.
- Google shelf persistence now stores references only. Legacy cached metadata is
  migrated; current details reload online. Offline source references remain.
- 40 unit tests and 18 WebKit checks passed on small iPhone, iPhone and iPad.
  They cover publisher DOI/version/license/date matching, blocked stale rights,
  attribution exports, Google refresh and offline legacy-bookmark migration.
- A live catalog/publisher metadata check verified a qualifying CC BY 4.0 book:
  OpenAlex W3210383951, DOI 10.1007/978-3-030-80519-7. This verifies license
  metadata, not physical-device downloading or worldwide source uptime.
- Native exports include the original PDF plus a source/license attribution file
  and share text. Browser exports offer the same attribution as a separate file.
- Archive and distribution export succeeded; strict recursive IPA signature
  verification passed. Build 6 upload succeeded at 19:07 PDT on October 7.
  Evidence is in ignored `releases/ios-1.0-6/` (archive, IPA and logs).
- Store description and review notes were updated to match the new download policy.
- Retained covers/abstracts and API account entitlements still require source-rights
  verification. Restricted downloads alone do not establish those permissions.

## Build 4 follow-up — October 7

- Google Books remains enabled with a separate ordered results section, official
  local attribution graphic, full source name and direct links in results,
  details and shelf. No merging or reranking Google records across providers.
- Bundled Help now discloses operational search/IP/approximate-location/diagnostic
  logging verified in production Netlify, while local files remain on-device.
- 34 unit tests and 15 WebKit checks passed across small iPhone, iPhone and iPad.
  A final focused attribution rerun passed on all three layouts.
- Xcode 26.2 Release device archive succeeded:
  `releases/ios-1.0-4/Librarian-unsigned.xcarchive`.
- Owner Xcode sign-in resolved distribution signing. Exported IPA:
  `releases/ios-1.0-4/AppStore/App.ipa`; strict recursive signature verification
  passed and embedded CFBundleVersion is 4. Upload succeeded at 18:00 PDT;
  Apple processing completed; build 4 is attached to version 1.0. Export/upload
  logs remain in the ignored folder.
- App Review notes now explicitly describe operational hosting logs and
  distinguish them from behavioral analytics.
- App Privacy is published. A fresh Apple validation now lists only
  Content Rights after the approved region exclusions and export answers.
  Age ratings remain saved.

## Uploaded build 3 evidence

- Bundle `com.armonon.librarian`; version/build `1.0` / `3`; team `NJBZDU7XZX`.
- Universal iPhone/iPad, iOS/iPadOS 18.0 minimum, Xcode/SDK 26.2.
- Archive: `releases/ios-1.0-3/Librarian-unsigned.xcarchive`.
- Apple Distribution export: `releases/ios-1.0-3/AppStore/App.ipa`.
- Exported IPA passed strict recursive signature verification; embedded bundle,
  version, minimum OS and device families 1/2 checked.
- Test/build/export/upload logs are in the ignored release folder. Private review
  contact details are saved only in App Store Connect, not in this document.

## Completed work

- Persistent local PDF/text library, reading position, bookmarks, filtering,
  sorting, offline reading, supported catalog downloads and native sharing.
- Bundled Help/privacy, PDF Text view, small-phone layout, reduced motion,
  preference recovery, explicit deletion confirmation and cancellation handling.
- HTTPS-only PDF downloads, PDF header validation, 75 MB limit, bounded page
  rendering, safe external links, and stale reader-update guards.
- Native Gutenberg discovery now falls back to the official OPDS feed when all
  Gutendex requests fail. Navigation entries, malformed feeds and foreign IDs
  are rejected. The fallback returns the first search page, without bulk crawling.
- Complete failures in Google Books/Open Library now report unavailable instead
  of appearing to be successful zero-result searches.
- Vite updated to 8.3.3; obsolete splash assets moved out of the asset catalog.

## Verification

34 unit tests and 12 WebKit checks passed on small iPhone, iPhone and iPad sizes.
Flows exercise import/render, bookmarks, resume, offline reading, export,
organization, discovery-to-text, privacy, settings recovery, invalid files,
embedded text and deletion. OPDS tests cover readable links and invalid feeds.
The first browser run had one PDF-loading failure while assets were regenerated
by ios:sync; the complete rerun with stable assets passed. Automated search data
is mocked; WebKit dimensions are not physical-device qualification.

The Release device archive, simulator build, distribution export and Apple upload
succeeded. Live native iPad simulator testing found Pride and Prejudice through
catalog search, downloaded Gutenberg edition 1342 and opened it in the reader. Page 2 and its
bookmark persisted; the library and reading position survived native relaunch.
The native share sheet and Save to Files flow completed on this simulator.
The live reading screenshot is `releases/ios-1.0-3/screenshots/ipad-live-reading.png`.

Host live checks: the nine hosted proxies, Open Library, OpenAlex, Crossref and
Gutenberg text responded successfully. Internet Archive recovered to 200.
Gutendex still returned 403 and Google Books 429; native Gutenberg OPDS returned
200. The fallback addresses discovery availability without bypassing access
controls. Regional behavior and real-device networks remain to be qualified.

Runtime npm dependencies reported no known advisories. Development/asset/desktop
packaging dependencies still have audit findings, including transitive tar/sharp
in the older asset generator. This is not a vulnerability-free repository claim.
Native downloads receive data before the size check; large-file memory behavior
needs physical-device testing.

## App Store settings saved

- Description, subtitle, keywords, Books category, support/privacy URLs, no-login
  review notes, copyright and owner-supplied review contact.
- Native iPhone 17 Pro screenshot (1206 × 2622) and 13-inch iPad screenshot
  (2064 × 2752), accepted by App Store Connect.
- Free price retained. Owner approved excluding France and China mainland:
  173 launch regions remain, with both excluded regions verified Not Available.
  Future storefront setting and automatic release after approval remain selected.

## Remaining gates and next actions

1. **Content rights — owner:** confirm permission for third-party
   catalogs/content in launch territories. Age ratings are saved: 16+ globally
   on current operating systems, 17+ before version 26, with regional exceptions.
   Do not infer worldwide copyright permission from US public-domain status.
2. **Completed signing/privacy:** build 6 is signed, uploaded, processed and
   attached. App Privacy is published based on verified hosting logs.
3. **Completed export questionnaire:** standard PDF.js encryption outside Apple
   OS declared; France distribution answered No after the owner-approved exclusion.
   Apple validation no longer lists export compliance. No exemption flag invented.
4. **Regional eligibility:** China mainland is excluded as approved; no publication
   permit was asserted. EU DSA trader information still requires owner resolution.
5. **Physical qualification — devices needed:** iPhone 16 was unavailable to
   devicectl; no physical iPad connected. Test local/iCloud Files import, native
   Save to Files, offline cold launch, force-quit/reopen, rotation, background
   recovery, mixed/large PDFs, low storage, VoiceOver and text sizing on both.
6. **Final submission:** build 6 is processed and attached. Resolve Content Rights, review Apple's validation and submit for App Review only
   after the above gates. No public release has occurred.

## Scope limits

EPUB import, OCR, password-protected PDFs and cloud/iCloud library sync are not
included. The separate web release still needs its new book-text function
published with the matching bundle. Existing Mac/Vision compatibility settings
have not been qualified by this iPhone/iPad release effort.

## References

- [App review guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance)
- [Gutenberg OPDS catalog](https://dev.gutenberg.org/ebooks/offline_catalogs.html)

## Latest submission validation

After publishing App Privacy on October 7, a fresh Add for Review check returned
two blockers: Content Rights and export compliance.
Broad search remains enabled as requested. See
[app-store-declarations.md](app-store-declarations.md) for code-backed facts and
the owner information needed to complete them. No submission was created.

## Final build 6 App Store verification

Build UUID `f4b3ea83-ea1e-481f-bd4c-eeeb6aebe044` finished processing and is saved
on version 1.0. Export answers were repeated (standard encryption outside Apple
OS; no France distribution). TestFlight shows Ready to Submit. A fresh version
validation lists only Content Rights Information. This is not App Review approval
or a submitted/released version. Store description and review notes reflect the
CC0 / publisher-verified CC BY 4.0 policy. Proof: ignored
`releases/ios-1.0-6/release-validation.png`.

## Build 7 — Open Library request pacing

The successor candidate includes the shared request-spacing fix from commit
8872e29. Search retains all five pages, while edition lookups share the same
1.1-second request gate. There are no additional content removals.

42 unit tests and 18 WebKit browser checks passed before the native version
increment. The iOS-mode bundle synced successfully. Release archive, automatic
App Store signing/export, and strict deep signature verification succeeded;
the signed IPA reports build 7. Evidence is under ignored
`releases/ios-1.0-7/`. Physical iPhone 16 remains unavailable to devicectl and no
physical iPad is connected. Those device checks remain outstanding.

Build 7 uploaded successfully at 20:03 PDT October 7 and processed under UUID
`cacfbf5c-d07a-4f4f-a2a1-5df8c3245f64`. Export answers are saved (standard
algorithms outside Apple OS; no France distribution). TestFlight shows Ready to
Submit. Build 7 replaced build 6 on version 1.0 and the selection is saved.
Fresh Add for Review validation still lists Content Rights Information only.
No App Review submission or public release occurred. Screenshot evidence:
`releases/ios-1.0-7/release-validation.png` (ignored).
