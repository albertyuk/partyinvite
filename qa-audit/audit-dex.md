# QA Audit — Dex (joindex.com)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Clean, well-built marketing site with no broken links or console errors; the real wins are one mobile-nav fix, trimming ~25MB of first-load media, and a couple of quick SEO/accessibility gaps.

**B. Issues (highest impact × ease first)**

### 1. Mobile nav doesn't collapse — horizontal scroll at 375px
- **Severity:** High
- **Type:** Bug (broken)
- **What & where:** On phones the full desktop top nav ("Product / Use Cases / Pricing / Blog" plus the "Join Dex" CTA) stays inline instead of collapsing to a menu, so the right-most CTA button is clipped off-screen and the page scrolls sideways — `https://www.joindex.com/` — the `Join Dex` CTA (`a.inline-flex.h-10.shrink-0`) is the right-most offender.
- **Evidence:** At 375px, `scrollW` = 429 vs `clientW` = 375 → **54px of horizontal overflow**; offenders include the `Join Dex` anchor (right edge 431px) and the `Desktop soon` pill. No overflow at 768px or 1440px, so it's mobile-only.
- **Fix:** Collapse the top nav to a hamburger menu below ~768px so the links and CTA stack instead of overflowing.

### 2. ~25MB of first-load media (20MB video + 5MB PNG)
- **Severity:** High
- **Type:** Suggestion (perf)
- **What & where:** The homepage pulls a very heavy uncompressed video and a photo-like hero shipped as PNG on first load — `https://www.joindex.com/` — `landing-page-2/meeting-prep.mp4` and `landing-page-2/hero-media.png`.
- **Evidence:** `meeting-prep.mp4` = **~20MB** (20,126 KB, real transfer), `hero-media.png` = **~4.97MB** (4,969 KB, real transfer); the top-12 real assets total **25.3MB**. These are the two largest requests by a wide margin (next-largest asset is a 323KB JS chunk).
- **Fix:** Transcode/compress the video and lazy-load it below the fold, and convert the hero PNG to WebP/AVIF (the photo-like hero as PNG is the single biggest win).

### 3. Missing robots.txt, sitemap.xml, and canonical tag
- **Severity:** Medium
- **Type:** Suggestion (SEO)
- **What & where:** Core indexing signals are absent for a site that's actively rebranding onto a new domain — `https://www.joindex.com/robots.txt`, `https://www.joindex.com/sitemap.xml`, and the `<link rel="canonical">` on `https://www.joindex.com/`.
- **Evidence:** `robots.txt` → **404** (returns HTML, not a robots file), `sitemap.xml` → **404**, and `canonical` is `null` on the home, use-cases, and pricing pages. Separately, the old domain `getdexterity.com` **301-redirects** to `joindex.com` (worth noting since outreach lists still reference getdexterity.com).
- **Fix:** Add a `robots.txt`, a `sitemap.xml`, and a self-referential `<link rel="canonical">` to each page.

### 4. Low-contrast text and no `<main>` landmark
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** Several muted-gray text elements fall below the WCAG AA contrast threshold, and the document has no main landmark — `https://www.joindex.com/` — e.g. `.hero-subcopy`, the `Install Dex, then…` limited-spots line, and the "soon" pill.
- **Evidence:** axe `color-contrast` (serious) = **27 nodes** on the homepage, e.g. `.hero-subcopy` at 4.31:1 (#737373 on #f4f4f6, needs 4.5:1) and a "soon" pill at 2.36:1; axe `landmark-one-main` (moderate) = **1 node** (`<html lang="en">` has no `<main>`).
- **Fix:** Darken the muted-gray text to clear 4.5:1 and wrap the primary page content in a `<main>` landmark.

**C. Founder-ready paragraph**

> I've been using Dex and genuinely like where it's going, so I poked at the marketing site from a user's-eye view and noticed a few small things worth a look. The biggest one: on my phone the top nav doesn't collapse, so the "Join Dex" button gets cut off and the homepage scrolls sideways (about 54px of overflow at 375px) — an easy fix once the nav goes to a hamburger under ~768px. The homepage also loads ~25MB of media up front (a 20MB video and a ~5MB hero PNG), which would be a quick win to compress and lazy-load. Minor but easy: there's no robots.txt, sitemap, or canonical tag yet, which matters more now that you're moving onto joindex.com. Happy to send over the full list if it's useful.
