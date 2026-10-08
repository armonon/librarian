# Provider rights and age-rating review — October 7, 2026

Scope: release 1.0 (6), with all current search providers enabled, plus the
post-build-6 request-spacing fix described below. This is a continuing
primary-source review, not a blanket clearance of every returned item.
Public licenses can supply permission without individual letters. The remaining
work is to verify the app follows those terms and preserves item-level rights.

| Provider | Evidence found | Remaining check |
| --- | --- | --- |
| Open Library | [API guidance](https://openlibrary.org/developers/api) supports user-driven book discovery; [cover guidelines](https://openlibrary.org/dev/docs/api/covers) expressly support displaying covers using their image URLs. Current cards use CoverID URLs and link to the source. Descriptions are generated from edition counts/ratings, not contributed prose. | Preserve this API usage; no blanket ownership claim is necessary. Post-build-6 code spaces requests to respect the default rate. Registration/application identification remains to review. |
| Google Books | [API terms](https://developers.google.com/books/terms) allow API use subject to Google's terms; paid app access needs separate permission. | Build 4 corrects [branding](https://developers.google.com/books/branding): separate results retain API order, original authors/descriptions, full source name, bundled official attribution and prominent source links on results/details/shelf. No cross-provider deduplication of Google records. Current app is free. Storage/removal obligations and broader rights still require review. |
| Gutenberg / Gutendex | [Permission](https://www.gutenberg.org/policy/permission) permits linking without asking; [license](https://www.gutenberg.org/policy/license) governs downloaded editions. | Preserve embedded notices. Non-US copyright status and permission-based editions need attention. Gutendex is a separate metadata intermediary. |
| OpenAlex | [Official license](https://github.com/ourresearch/openalex-docs/blob/main/license.md) makes OpenAlex data CC0. | Metadata reuse does not grant rights in linked full texts. |
| Crossref | [REST documentation](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) provides reusable scholarly metadata but warns some abstracts are copyrighted. | The app displays abstracts; do not treat every abstract as CC0. |
| Internet Archive | Catalog and item links are exposed in the app. | Item-level rights and API terms still need review; a readable/borrowable flag is not a redistribution license. |
| CORE | [API page](https://core.ac.uk/services/api) and [FAQ](https://core.ac.uk/faq) describe eligibility and terms for free/commercial licenses. | Verify the existing API account's license and full-text reuse conditions. Possession of a key is not the license record. |
| DPLA | [Terms](https://dp.la/about/terms-conditions) make metadata CC0. | Digital objects and previews require their own rights assessment. |
| Europeana | [Metadata guidance](https://www.europeana.eu/en/rights/usage-guidelines-for-metadata) makes metadata CC0; [framework](https://pro.europeana.eu/index.php/page/europeana-licensing-framework) separates digital-object rights. | Preserve source links and item rights for previews/downloads. |
| K10plus | Search integration inspected. | Applicable SRU data license not established in this review. |
| Library of Congress | [Official tutorial](https://libraryofcongress.github.io/data-exploration/loc.gov%20JSON%20API/Accessing%20images%20for%20analysis.html) explains resource-specific rights assessment. | The app uses an SRU endpoint; establish that endpoint's metadata terms and item rights. |
| BnF | [Reuse policy](https://www.bnf.fr/fr/reutiliser-les-donnees-de-la-bnf) places descriptive data under the French Open Licence. | Verify source/date attribution requirements for the exact SRU records. |
| DNB | [Open-data service](https://data.dnb.de/opendata/) provides metadata under CC0 unless otherwise stated. | Confirm the terms attached to the precise SRU dataset; linked content is separate. |
| Finna | [Material rights](https://www.finna.fi/Content/terms?lng=en-gb) vary by item. | Establish metadata API terms and preserve rights for displayed images. |
| National Library of Norway | [Licenses](https://www.nb.no/tilgang/lisens/) distinguish item reuse conditions. | Establish catalog metadata terms and individual content licenses. |

## All-ages target

[Apple's definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)
require answers about actual content and capabilities. Apple calculates ratings;
4+ requires no objectionable material. A general-purpose reader does not justify
answering None to every content category when the app also supplies unfiltered
catalog descriptions, covers and downloadable works.

The current app has no age-filtered or curated discovery boundary. Neither a
simple keyword blacklist nor an all-ages marketing statement establishes that
boundary. Keep broad discovery and complete the questionnaire accurately, or
build a reviewed age-appropriate catalog with controls that prevent bypass through
other providers. The owner chose broad discovery on October 7. The questionnaire is now saved
with Apple’s calculated 16+ rating (17+ on earlier operating systems, with
regional exceptions). No features or providers were removed and no 4+
declaration was submitted. See app-store-declarations.md for the answers.

## Current operational blocker

App Store Connect access was restored and the age rating was saved. App Privacy was subsequently published using verified Netlify logging evidence. Content
rights and physical-device qualification remain open. France and China mainland
were excluded with owner approval, and build 6 export compliance is now saved.
The latest Apple validation lists Content Rights Information only.

## Further findings and build 4 changes

The Google Books implementation previously used the abbreviation GB and merged
and reranked its records with other providers. The candidate now isolates those
records, preserves their order and descriptions, and displays the official
Powered by Google graphic with direct Google Books links. The general source
selector can select or exclude the section; language and availability filters
are explicitly scoped to other catalogs. Broad search and all providers remain.

[CORE's FAQ](https://core.ac.uk/faq) ties higher-rate registered API access to
license eligibility; its definition of noncommercial use is narrower than simply
calling an app a hobby. Verify the existing API account's entitlement. The FAQ
also requests attribution and project information. No email has been sent or
new terms accepted. Cover/full-text permissions still depend on the item and
territory. These outstanding points prevent a blanket content-rights assertion.

## Concrete implementation gaps verified after build 4

- `src/main.js` `toggleSave`/`persist` stores entire Google Books records in
  localStorage with no expiry. [Google API terms, section 5](https://developers.google.com/terms/)
  restrict permanent copies and caching beyond permitted cache headers absent
  separate permission. Keep shelf references and fetch current authorized metadata;
  do not treat a branding fix as resolving storage obligations.
- `gutenberg()` labels every Gutendex result public domain without checking its
  copyright field. `src/reading.js` `readableLink` enables a text download for any
  Gutenberg ebook URL and a PDF download based on URL/label, without a license
  predicate. [Gutenberg permission guidance](https://www.gutenberg.org/policy/permission)
  distinguishes US public-domain works from copyrighted permission-based editions
  and explicitly does not establish non-US redistribution rights.
- CORE's [FAQ](https://core.ac.uk/faq) confirms keyless rate-limited access exists,
  but the current authenticated proxy's entitlement remains unverified. An existing
  key must not be treated as evidence of an applicable license.

Proposed next candidate, pending owner choice: retain broad bibliographic search
and personal imported-PDF reading; restrict app-provided images, descriptions and
full-text downloads to documented permissions, and keep source landing-page links
for other content. Providers without established API entitlement would need a
verified entitlement or be omitted from in-app aggregation. This changes the
current product's content/download coverage, so the owner has been asked to choose
this route or supply the missing license information. No blanket Content Rights
assertion has been saved and no App Review submission has occurred.

## Build 5 implementation — owner chose limited downloads, broad discovery

All 15 providers, covers, descriptions, filters, source links and shelf discovery
remain enabled. This preserves the owner's requested scope; it does not assert
that every retained source's terms have been cleared.

- Direct file actions now require an exact OpenAlex location with `is_oa: true`,
  `license: cc0`, an HTTPS PDF URL and a valid OpenAlex work identifier. Open-access
  flags alone, filenames, labels and Gutenberg identifiers no longer grant actions.
- Before saving, the app fetches current work metadata without HTTP caching and
  verifies the same file remains CC0. If verification fails, no file is requested.
  The original title/authors, source, license and evidence URL are saved with it;
  the library exposes source and license links. CC-BY variants are not inferred
  from versionless license names. Future support can retain their exact terms.
- Gutenberg discovery and landing-page links remain; misleading unconditional
  public-domain labels are removed. New Gutenberg text downloads are disabled in
  the app. Existing local books and user-imported PDFs are preserved.
- Google bookmarks store only a generated source reference and identifier.
  Existing saved API metadata is migrated to references; current details reload
  online with no-store requests. Offline bookmarks retain source links.
- Help includes content-removal contact via the existing support form.

Evidence for the location-based distinction:
https://help.openalex.org/data/locations/ and
https://github.com/ourresearch/openalex-docs/blob/main/api-entities/works/work-object/location-object.md.

Remaining independent issues: CORE account entitlement; Google public API project
identification per https://developers.google.com/books/docs/v1/using; reuse of
retained third-party abstracts/previews in relevant territories. These are not
silently certified by changing the download policy. Content Rights remains unsaved.

### Final candidate: build 6

The CC0-only prototype found zero current matching book/monograph/dissertation
records in a live OpenAlex check. To preserve useful downloads, build 6 also
supports `cc-by` OpenAlex locations only when `version: publishedVersion`, DOI
matches the Crossref record, and an effective `content-version: vor` entry names
exactly https://creativecommons.org/licenses/by/4.0 (optional trailing slash).
No license family is silently upgraded to version 4.0. A user-triggered check
resolves the publisher license before displaying file actions; the app repeats
the checks before retrieval. Future-dated, TDM-only, mismatched DOI, unversioned,
NC/ND/SA and unknown licenses do not enable this route.

A live matching example is OpenAlex W3210383951 / DOI
10.1007/978-3-030-80519-7, whose published PDF location is `cc-by` and whose
Crossref record contains a CC BY 4.0 `vor` license effective 2021-11-04.
Original PDFs remain unchanged. The app displays source/license links, saves
provenance and authors, and includes an attribution text file with native exports.
Browser exports expose a separate attribution download. This does not resolve
independent API entitlement or retained preview/abstract permissions.

## Retained discovery review and request pacing — after build 6

Open Library's published cover-use guidance supports the actual image display
pattern used here. The app uses cover IDs, which the cover documentation exempts
from its ISBN/OCLC-based image quota. This narrows the earlier open question;
we should not require individual cover permission letters simply because the
catalog does not claim ownership of every cover.

Its [API usage guidance](https://openlibrary.org/developers/api) sets a default
one-request-per-second rate. Search previously launched five pages together.
The shared request gate now spaces Open Library search pages and edition lookups
by at least 1.1 seconds. All five pages remain; other providers run independently.
The HTTP timeout starts after admission, and a late timer after app suspension
cannot release a queued burst. Failures do not block later requests. This is
per running app instance, not a promise of a shared quota across devices on one
network. The change is not part of the already uploaded build 6.

No additional providers, descriptions, covers, reader features or source links
were removed during this follow-up. The build-6 limitations remain:
- No automatic Gutenberg text fetching into the reader.
- Direct PDF saving requires the supported, freshly verified CC0 or CC BY 4.0
  path; a PDF URL or open-access label alone is insufficient.
- Google Books shelf entries persist references and refresh details online,
  rather than retaining permanent offline copies of its metadata.

CORE's current account entitlement is still unknown. Its FAQ distinguishes the
free rate-limited API from registered higher-rate arrangements; a hobby label or
an existing API key alone does not settle that distinction. The owner has been
asked whether a license was granted. No new provider contract or blanket Apple
Content Rights declaration has been accepted.

Validation for the request-spacing change: 42 unit tests and 18 WebKit browser
checks passed across small iPhone, iPhone and iPad viewports; the iOS-mode web
bundle builds successfully. Native archive/upload remains pending. App Store
Connect was rechecked: build 6 remains attached, Prepare for Submission, with
Content Rights Information the only listed Add for Review validation error.
