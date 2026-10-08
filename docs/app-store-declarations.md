# App Store declaration worksheet — Librarian 1.0 (4) candidate

Prepared from the release source and Apple validation on October 6, 2026.
This worksheet is technical evidence, not an approved legal classification or
an assertion that third-party rights have been obtained. Age ratings and App Privacy were published on October 7, 2026.
Content rights and export compliance remain unresolved. App Review notes have been updated
with the owner-confirmed product purpose and absence of analytics.

## Current Apple validation

The Add for Review check rejects submission for these two items after publishing App Privacy on October 7:

1. Content Rights Information is missing.
2. Build 4 lacks export compliance information.

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

## Privacy declaration published — October 7, 2026

| Operation | Data path | Verified from source |
| --- | --- | --- |
| Import/read a local PDF | Device memory and IndexedDB | Document bytes are not sent to the catalog proxy or an AI service. |
| Bookmarks, progress, preferences | Local device storage | No library synchronization or sign-in in this release. |
| Discover | Enabled catalog APIs, directly or via Netlify proxy | Search terms appear in request URLs. Network services receive normal connection metadata. |
| Covers/fonts | External image hosts and Google Fonts | Requests can occur separately from catalog searches. |
| Download | Selected book host | The host receives the requested book URL. |
| Export | iOS share destination chosen by user | A copy is passed to the selected destination. |
| Support | External company support website | Its processing needs to be included where applicable. |

Direct inspection of the production `librarian-atlas` Netlify dashboard confirmed:

- Web Analytics is not enabled (the dashboard offers Enable Analytics).
- Observability exposes a seven-day request-history window. Actual proxy requests
  from earlier days retain complete search-query URLs, client IP, approximate
  country/region, user-agent, response status, response size and request duration.
- The security dashboard reports no connected log drain.

This is collection under Apple's definition, despite no analytics SDK. The
published label declares Coarse Location, Search History, Performance Data and
Other Diagnostic Data. All are used for App Functionality, linked to users
because IP information is retained, and not used for tracking. IP-based
operational diagnostics are classified by their use, as Apple's guidance directs;
no IDFA, account ID or app-generated device identifier is implemented.

The label was published after the owner said to continue at Apple's final
publication confirmation. App Store Connect displays Published; a fresh Add for
Review check no longer lists App Privacy. Build 4's bundled Help text explains
the operational logs. Local PDFs and reading progress are not collected. The
seven-day dashboard window is not a guarantee that all provider backups or
upstream services delete data after seven days. No raw client IPs or query logs
are committed here.

Evidence: `releases/ios-1.0-3/privacy-published.png` and
`releases/ios-1.0-4/submission-after-privacy.png`.

- https://developer.apple.com/app-store/app-privacy-details/
- https://docs.netlify.com/manage/monitoring/observability/overview/

## Age rating saved — October 7, 2026

The owner explicitly chose to keep broad search and accept the resulting rating.
Apple calculated 16+ (173 countries or regions), with regional exceptions,
and a global 17+ for operating systems earlier than version 26. No override or
Kids category was selected. App Information was saved; a subsequent Add for
Review check no longer lists age ratings as a blocker.

Questionnaire assessment for this release:

- No parental controls, age assurance, unrestricted in-app web browsing, shared
  user-generated content, social media, messaging, advertising, or gambling.
- Infrequent profanity/crude humor, horror/fear, and alcohol/tobacco/drug references.
- Infrequent medical/treatment information; health/wellness topics available.
- Frequent mature/suggestive themes; infrequent non-explicit sexual content/nudity.
- Infrequent fantasy/realistic violence and weapons references.
- No app-provided graphic sexual content or prolonged graphic/sadistic violence
  identified; those questionnaire categories were answered None.
- No simulated gambling, contests, gambling or loot boxes.

These are an assessment of the search/reader experience and ordinary literary
content, not a claim that every remotely searchable title has been audited.
There is no age filter. Reassess these answers if actual surfaced content or
features change, especially advertising. Personal imports are not shared with
other app users. Search provider availability remains unchanged.

Evidence: `releases/ios-1.0-3/age-rating-saved.png` and
`releases/ios-1.0-3/submission-after-age-rating.png` (local ignored artifacts).

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

## Owner clarification — October 7, 2026

The owner described Librarian as a book search engine and PDF reader, confirmed
no analytics, described the project as a personal hobby that may run ads later,
and reported no France encryption or China publication paperwork.

The current binary has no advertising implementation; future ads require a new
privacy/age-rating review as applicable. Apple review notes now describe the
personal search/reader purpose, no current ads or analytics, on-device imported
files, and catalog/proxy search requests. The later hosting inspection above resolved the logging uncertainty and the
published label discloses the observed collection. Data Not Collected was not selected.

Apple's trader guidance considers advertising, revenue and commercialization
intent. Because the owner may add ads, hobby status alone was not treated as a
conclusive non-trader declaration, particularly for account-wide settings.

The original worldwide preference remains in effect. A question is pending
about excluding France and China mainland for the first release versus retaining
worldwide availability while resolving documentation. No territory was removed.
This territory choice alone would not resolve privacy or content rights.

Provider evidence narrows, but does not finish, the rights/privacy review:
Project Gutenberg permits linking without requesting permission, but does not
guarantee copyright status outside the US. Netlify documents observability
containing request URLs and client IPs; the account's actual enabled features,
retention and purposes still need verification.

- https://www.gutenberg.org/policy/permission
- https://docs.netlify.com/manage/monitoring/observability/overview/
- https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements
