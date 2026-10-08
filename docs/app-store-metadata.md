# Librarian 1.0 — App Store submission draft

Status: app record 6819934484 created. Store copy, copyright, review contact,
privacy URL, iPhone/iPad screenshots and free worldwide availability are saved.
Build 1.0 (3) processed and attached with Missing Compliance; not submitted for App Review. Content rights, age rating,
App Privacy, export compliance and regional eligibility remain open. See
[ios-release-readiness.md](ios-release-readiness.md) for current evidence and gates.

- Name: Librarian: Books & PDFs (Librarian was unavailable)
- App Store Connect: https://appstoreconnect.apple.com/apps/6819934484/distribution
- Subtitle: Your books. Your reading room.
- Primary category: Books
- Keywords: reader,books,pdf,library,reading,offline,bookmarks,public domain,ebook
- Support URL: https://thecreatingco.com/testing/
- Privacy policy URL: https://thecreatingco.com/privacy/
- Bundle identifier: com.armonon.librarian
- Candidate version/build: 1.0 / 3
- Platforms: iPhone and iPad, iOS/iPadOS 18 or later

## Description

Make a little space for your next great read.

Librarian brings book discovery, your PDFs, and a personal reading library into
one place on iPhone and iPad.

Search by title, author, subject, or ISBN across supported catalogs. Save catalog
references to your shelf, or download supported PDFs and Project Gutenberg text
editions to read inside Librarian.

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
analytics. Imported documents and saved reading progress remain on the device.
Discover sends search terms to catalog services directly or through a hosted proxy.

No login or purchase is required. Library is the initial screen. Add PDFs opens
the system file picker. Discover searches online catalogs; choose a supported
record and select Read in Librarian or Save for offline. Unsupported catalog
records retain external source links. Search requires a connection; saved content
does not. The app does not bypass lending, payment, DRM, or copyright controls.

In the reader, the footer navigates pages and manages bookmarks. Text view uses
embedded PDF text and explains when a scanned page has no readable text. Library
supports Resume, Save / Share, finished/unread status, search, and sorting. Help
contains bundled privacy and usage information plus public support/privacy links.

Reviewers can import their own ordinary PDF. A device-tested sample and final
screenshots should be attached after the physical-device qualification below.

## Required owner decisions before submission

- Select truthful content/age-rating answers for open catalog and book content;
  do not mark this as a Kids Category app without a separate compliance review.
- Complete App Privacy based on actual hosting and catalog-provider practices.
  Local files remain on-device, but search terms and normal connection data go
  to enabled catalogs/proxies. Do not infer Data Not Collected from local storage.
- Complete the encryption/export questionnaire. This app uses HTTPS and bundles
  PDF.js, whose PDF parsing includes cryptographic code. No exemption declaration
  has been set automatically.
- Verify the rights and territory availability of the catalog integrations and
  public-domain content distribution before selecting storefronts.
- Complete physical-device qualification. Native simulator store screenshots
  have been accepted; automated fixture screenshots are QA evidence only.

## October 7 follow-up

Age rating is saved (16+, 17+ on pre-26 systems, with regional exceptions).
App Privacy is published: Coarse Location, Search History, Performance Data and
Other Diagnostic Data, linked to users for App Functionality, not tracking.
Build 4 is archived and tested with Google Books attribution/order fixes and
clearer bundled privacy text. Owner Xcode sign-in resolved signing; build 4's
verified IPA uploaded at 18:00 PDT, finished Apple processing, and replaced build 3
on version 1.0. Build 4 remains Missing Compliance. App Review notes now disclose operational hosting logs. No public release.
