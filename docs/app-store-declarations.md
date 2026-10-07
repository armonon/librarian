# App Store declaration worksheet — Librarian 1.0 (3)

Prepared from the release source and Apple validation on October 6, 2026.
This worksheet is technical evidence, not an approved legal classification or
an assertion that third-party rights have been obtained. No declaration below
has been submitted on the owner's behalf.

## Current Apple validation

The Add for Review check rejects submission for exactly these four items:

1. Content Rights Information is missing.
2. Build 3 lacks export compliance information.
3. An Admin must provide App Privacy practices.
4. Required age-rating questions are unanswered.

Screenshots, copyright and review-contact information are no longer listed as
validation errors. Worldwide regional eligibility and real-device qualification
remain separate release checks.

## Export technical statement

Librarian is a general-purpose book discovery and local document reader for
Apple iPhone and iPad. Its network operations use the platform's HTTP/TLS APIs.
Its PDF renderer is Mozilla PDF.js 6.3.289, bundled with the app. The legacy
worker contains ARCFourCipher, AES128Cipher and AES256Cipher implementations
for PDF processing. These are standard algorithms implemented outside Apple's
operating system. There is no password-entry UI; the app reports unsupported
password-protected documents when the renderer requires a password. Absence of
a password-entry UI does not mean the cryptographic code is absent or unused.

Evidence: src/pdf-reader.js, src/pdf-options.js, src/main.js and
node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs (classes at lines 63860,
64169 and 64207 in the installed 6.3.289 package).

App Store Connect's standard-encryption answer with France selected required
export documentation. No exemption flag or Apple approval code was invented.
Owner action: provide the applicable existing documentation or obtain a
classification/exemption determination. Apple says classification responsibility
belongs to the developer; ANSSI provides the French declaration process.

- https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/
- https://cyber.gouv.fr/reglementation/reglementation-identite-confiance-numerique/controles-reglementaires-cryptographie/controle-moyen-de-cryptologie/

## Privacy facts and unresolved retention

| Operation | Data path | Verified from source |
| --- | --- | --- |
| Import/read a local PDF | Device memory and IndexedDB | Document bytes are not sent to the catalog proxy or an AI service. |
| Bookmarks, progress, preferences | Local device storage | No library synchronization or sign-in in this release. |
| Discover | Enabled catalog APIs, directly or via Netlify proxy | Search terms appear in request URLs. Network services receive normal connection metadata. |
| Covers/fonts | External image hosts and Google Fonts | Requests can occur separately from catalog searches. |
| Download | Selected book host | The host receives the requested book URL. |
| Export | iOS share destination chosen by user | A copy is passed to the selected destination. |
| Support | External company support website | Its processing needs to be included where applicable. |

The proxy source has no explicit console logging or analytics calls. It sets
public response caching for 600 seconds. These facts do not establish Netlify
access-log retention, account analytics settings, third-party provider retention,
or whether data is linked to users. Do not select Data Not Collected solely
because the local library stays on-device.

Owner/hosting administrator must establish retention, purposes, identity linkage,
and tracking practices for search/request data before the privacy label is saved.
The iOS required-reason manifest for file timestamps is separate from that label.

## Age-rating facts for owner review

The app has no implemented parental controls, age assurance, social feed, direct
messaging, advertising or gambling gameplay. It is not presented as a Kids app.
Personal imported files are not broadcast to other users. Catalog discovery is
not age-filtered and can expose book descriptions, covers and downloadable works
with mature subject matter. Do not mark all content categories None based only
on the app's neutral interface. Assess the catalogs' supplied content against
Apple's frequency definitions and determine whether third-party content falls
within the user-generated-content definition before completing the questionnaire.

https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions

## Content rights and territories

The app accesses third-party catalogs and book content. Public API access or a
working API key does not by itself prove commercial redistribution permission
for all metadata/covers or worldwide copyright status for every book. Confirm
terms/permissions for the enabled integrations and the supported downloads.
Do not certify that the app has no third-party content.

The owner selected free distribution everywhere. Keep that preference; resolve
EU trader information and any applicable China publication/registration permits
instead of silently excluding countries. Those facts cannot be derived from
the code or from the app being free.

## Device qualification handoff

Connect and unlock an iPhone and iPad and enable their normal developer pairing.
The available iPhone 16 currently reports unavailable; no physical iPad is listed.
Use the signed candidate to check local/iCloud PDF import, native Save to Files,
offline cold launch, relaunch/progress/bookmarks, rotation and background recovery,
large/mixed-page PDFs, low storage, VoiceOver and increased text size. Record
OS/model, pass/fail and any reproduction steps. Simulator/WebKit successes do
not replace these checks.
