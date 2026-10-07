# Librarian 1.0 (3) — release readiness, October 7, 2026

**Decision: technical candidate uploaded; not ready for App Review submission.**
App Store Connect record `6819934484`, **Librarian: Books & PDFs**, remains Prepare
for Submission. Build 3 uploaded successfully at 22:18 PDT, finished processing,
and is attached to version 1.0 with Missing Compliance. This is not an App Review
approval or a public release.

## Candidate and evidence

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
- Free price in all 175 countries/regions; availability includes future
  storefronts, effective on release. Automatic release after approval selected.

## Remaining gates and next actions

1. **Content rights — owner:** confirm permission for third-party
   catalogs/content in launch territories. Age ratings are saved: 16+ globally
   on current operating systems, 17+ before version 26, with regional exceptions.
   Do not infer worldwide copyright permission from US public-domain status.
2. **App Privacy — owner/hosting administrator:** verify retention of search
   queries, IPs and request logs, analytics and provider practices, then complete
   the privacy label. Local PDF storage alone does not imply Data Not Collected.
3. **Export compliance — owner:** PDF.js bundles AES/RC4 implementations. Apple's
   standard-encryption questionnaire with France selected explicitly requires
   export documentation for review. Supply applicable documentation or establish
   the correct exemption with Apple; no unsupported exemption was declared.
4. **Worldwide regulatory eligibility — owner:** App Store Connect flags missing
   EU DSA trader information and China mainland publication permits. Determine
   applicable registrations/permits; selecting all storefronts is not approval.
5. **Physical qualification — devices needed:** iPhone 16 was unavailable to
   devicectl; no physical iPad connected. Test local/iCloud Files import, native
   Save to Files, offline cold launch, force-quit/reopen, rotation, background
   recovery, mixed/large PDFs, low storage, VoiceOver and text sizing on both.
6. **Final submission:** build 3 is processed and attached. Resolve its Missing
   Compliance state, review Apple's validation and submit for App Review only
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

After saving the age-rating questionnaire on October 7, a fresh Add for Review
check returned three blockers: Content Rights, export compliance and App Privacy.
Broad search remains enabled as requested. See
[app-store-declarations.md](app-store-declarations.md) for code-backed facts and
the owner information needed to complete them. No submission was created.
