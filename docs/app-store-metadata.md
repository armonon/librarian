# Librarian 1.0 — App Store submission draft

Status: build 8 is processed, attached and saved on version 1.0. Export compliance
is cleared. The description and review notes now describe source-link previews
and CORE website access. Apple's latest validation lists Content Rights only.
The owner declaration is open and unselected; no App Review submission or release
has occurred. Verification: October 8, 2026.

- Name: Librarian: Books & PDFs (Librarian was unavailable)
- App Store Connect: https://appstoreconnect.apple.com/apps/6819934484/distribution
- Subtitle: Your books. Your reading room.
- Primary category: Books
- Keywords: reader,books,pdf,library,reading,offline,bookmarks,public domain,ebook
- Support URL: https://thecreatingco.com/testing/
- Privacy policy URL: https://thecreatingco.com/privacy/
- Bundle identifier: com.armonon.librarian
- Candidate version/build: 1.0 / 8
- Platforms: iPhone and iPad, iOS/iPadOS 18 or later

## Description

Make a little space for your next great read.

Librarian brings book discovery, your PDFs, and a personal reading library into
one place on iPhone and iPad.

Search by title, author, subject, or ISBN across supported catalogs. Save catalog
references to your shelf, or download PDFs with a confirmed CC0 or CC BY 4.0 license to read
inside Librarian. Other results link to their source for reading and borrowing.
Google Books shelf details refresh online. Unverified previews and descriptions
open on source websites; CORE search opens its website.

Bring PDFs from Files, pick up where you left off, and bookmark the pages you
want to return to. Find saved books by title or author, sort your library, and
keep track of what you are reading and what you have finished.

Read saved content offline, adjust the reading size, switch between light and
dark pages, and use Text view for PDFs that contain embedded text. Export copies
through the iOS share sheet and save them to Files.

Your library is stored on your device. No account is required. Cloud sync, EPUB
imports, OCR, and password-protected PDFs are not included in this release.
PDF imports and downloads are limited to 75 MB. Availability of downloadable
books depends on the source, edition, and region. Catalog listings do not grant
access to paid, protected, or borrow-only books.

## App Review notes

Librarian is a book search engine and personal PDF/text reader, developed as a
personal hobby project. This version is free and contains no advertising or
behavioral analytics. Hosting retains operational search, connection, approximate-location,
and diagnostic logs for functionality, security and troubleshooting. Imported documents and saved reading progress remain on the device.
Discover sends search terms to catalog services directly or through a hosted proxy.

No login or purchase is required. Library is the initial screen. Add PDFs opens
the system file picker. Discover searches online catalogs; choose a supported
record with a confirmed CC0 or CC BY 4.0 file license and select Read in Librarian or Save for
offline. The exact file license is rechecked with OpenAlex and, for CC BY 4.0, matched
to publisher-deposited Crossref metadata before saving. Attribution accompanies
exports. Other catalog
records retain external source links. Search requires a connection; saved content
does not. The app does not bypass lending, payment, DRM, or copyright controls.

In the reader, the footer navigates pages and manages bookmarks. Text view uses
embedded PDF text and explains when a scanned page has no readable text. Library
supports Resume, Save / Share, finished/unread status, search, and sorting. Help
contains bundled privacy and usage information plus public support/privacy links.

Reviewers can import their own ordinary PDF. A device-tested sample and final
screenshots should be attached after the physical-device qualification below.

## Remaining checks

- Establish applicable permissions for retained catalog content and API accounts
  before the Content Rights declaration. Restricted downloads do not establish
  those independent permissions.
- Complete physical-device qualification; automated layouts are not device tests.
- Verify EU DSA account information and recheck Apple's final submission validation.

## October 7 follow-up

Age rating is saved (16+, 17+ on pre-26 systems, with regional exceptions).
App Privacy is published: Coarse Location, Search History, Performance Data and
Other Diagnostic Data, linked to users for App Functionality, not tracking.
Build 4 is archived and tested with Google Books attribution/order fixes and
clearer bundled privacy text. Owner Xcode sign-in resolved signing; build 4's
verified IPA uploaded at 18:00 PDT, finished Apple processing, and replaced build 3
on version 1.0. Build 4 export compliance is now saved. App Review notes now disclose operational hosting logs. No public release.

Owner approved excluding France and China mainland on October 7. Both regions
show Not Available; price remains free in the 173 remaining launch regions.
Standard algorithms outside Apple OS / no France answers cleared export
validation. Only Content Rights remains in the latest Add for Review check.

## Build 8 review-note addition

Search aggregates 14 catalogs. CORE is available through a website link and its
API is not called by this build. Unverified covers and descriptions are replaced
with source links before result merging or shelf storage. Legacy shelf entries
are cleaned on load. Supported Open Library CoverID/OLID images and Google Books
content remain, as do DPLA/Europeana descriptions under their metadata terms.
The app does not infer image rights from a metadata or full-text license. Direct
PDF saving retains the build-6 exact-file license checks and export attribution.
