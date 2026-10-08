# Provider rights and age-rating review — October 7, 2026

Scope: release 1.0 (4) candidate, with all current search providers enabled. This is an
initial primary-source review, not a blanket clearance of every returned item.
Public licenses can supply permission without individual letters. The remaining
work is to verify the app follows those terms and preserves item-level rights.

| Provider | Evidence found | Remaining check |
| --- | --- | --- |
| Open Library | [Licensing](https://openlibrary.org/developers/licensing): Internet Archive asserts no new proprietary rights in the database, but explicitly notes existing rights issues. | Covers and contributed descriptions are not universally cleared by this statement. |
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
rights, export documentation, regional availability and physical-device qualification
remain as documented in app-store-declarations.md.

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
