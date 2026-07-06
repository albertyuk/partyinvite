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

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. Color-contrast failures are site-wide and deeper on interior pages (worst 1.95:1), not just the home page
- **Severity:** Low
- **Type:** Bug (a11y)
- **What & where:** Low-contrast muted-gray text fails WCAG AA across interior routes, worse than anything caught on the home page — `/use-cases` (74 nodes), `/pricing` (17 nodes), each `/use-cases/*` detail page (11 nodes), and `/terms` (2 nodes). Extends pass-1 #4.
- **Evidence:** axe `color-contrast` (serious) in `dex.deep.json`: `/use-cases` count=74 at 3.02:1 (#8d8d8d on #f4f4f6); every `/use-cases/*` detail page has an 11-node violation including `.md:text-sm` at **1.95:1** (#b1b1b2 on #f4f4f6, 14px) — below any home-page node; `/pricing` count=17 down to 2.35:1 (#a1a1a1 on #f4f4f6) and 2.58:1 on #ffffff; `/terms` count=2 at 2.58:1. Pass-1 #4 reported color-contrast ONLY on home (27 nodes).
- **Fix:** Darken the shared muted-gray tokens (#b1b1b2/#a1a1a1/#8d8d8d) to clear 4.5:1 against both #f4f4f6 and #ffffff so the fix propagates across use-cases, pricing, all detail pages, and terms.

### 2. Footer copyright uses "@" instead of "©" site-wide
- **Severity:** Low
- **Type:** Bug (content/copy)
- **What & where:** The shared footer copyright line reads with an "@" where the copyright symbol should be, on all 12 crawled pages — e.g. "ThirdLayer, Inc. @ 2026 Terms of Use Privacy Policy Contact".
- **Evidence:** The exact string "@ 2026" appears in `pages[].data.text` on all 12 pages with captured text (grep count=12); the "©" symbol is absent from the file. Not in pass-1.
- **Fix:** Replace "@" with "©" (or `&copy;`) in the shared footer component.

### 3. No structured data / JSON-LD on any page site-wide
- **Severity:** Low
- **Type:** Suggestion (SEO)
- **What & where:** No page emits any JSON-LD structured data — all 13 captured pages (home, pricing, use-cases index, `/terms`, 9 use-case detail pages).
- **Evidence:** `dex.deep.json`: `data.jsonldCount=0` and `jsonld=[]` on 13/13 pages (grep `jsonldCount:0` = 13). Pass-1 #3 only covered robots.txt/sitemap/canonical, not JSON-LD.
- **Fix:** Add Organization/SoftwareApplication JSON-LD on home/product pages and Article/HowTo on use-case detail pages.

### 4. Double-comparative "couldn't be more happier" in homepage testimonial
- **Severity:** Low
- **Type:** Bug (grammar/typo)
- **What & where:** The "F Founder" testimonial on the homepage contains a double comparative — `https://www.joindex.com/`.
- **Evidence:** Homepage `data.text` contains the exact string "couldn't be more happier" (grep confirmed, 1 occurrence); "more happier" is a double comparative.
- **Fix:** Change to "couldn't be happier".

### 5. Subjectless/dangling sentence in homepage meeting-prep copy
- **Severity:** Low
- **Type:** Bug (grammar)
- **What & where:** The "Meeting prep with full context" block on the homepage has a subjectless imperative with a dangling fragment — `https://www.joindex.com/`.
- **Evidence:** Homepage `data.text` contains the exact string "Afterwards, automatically send follow-ups using call notes, and writing tone." (grep confirmed, 1 occurrence) — subjectless with a dangling ", and writing tone" fragment.
- **Fix:** Rewrite, e.g. "Afterwards, Dex automatically sends follow-ups using your call notes and writing tone."

### 6. Missing canonical extends beyond pass-1's 3 pages to /terms and all 9 use-case detail pages
- **Severity:** Polish
- **Type:** Bug (SEO/canonical)
- **What & where:** No `<link rel="canonical">` on `/terms` or the 9 `/use-cases/*` detail pages (e.g. `/use-cases/renewal-tracker`, `/use-cases/crm-update-from-calls`). Extends pass-1 #3.
- **Evidence:** `dex.deep.json` `data.canonical=null` on 13/13 captured pages (grep count=13). Pass-1 #3 named only home, use-cases index, and pricing; this adds the /terms and detail routes.
- **Fix:** Emit a self-referential `<link rel="canonical">` from the shared layout so every route ships one.

### 7. Pricing page `<title>` is only 13 chars ("Pricing | Dex")
- **Severity:** Polish
- **Type:** Suggestion (SEO)
- **What & where:** The `<title>` on the pricing page is generic and short — `https://www.joindex.com/pricing`.
- **Evidence:** `dex.deep.json`: `data.titleLen=13` for `/pricing` (line 204), generic vs descriptive interior titles elsewhere. Not in pass-1.
- **Fix:** Expand to a descriptive, keyword-bearing title, e.g. "Pricing — Dex, the self-driving workspace for operators".

### 8. axe 'region' + landmark-one-main also fire on the Pricing interior page
- **Severity:** Polish
- **Type:** Bug (a11y)
- **What & where:** Content sits outside landmarks on the pricing interior page as well as home — `https://www.joindex.com/pricing` (region count=4, landmark-one-main count=1) and home (region count=3). Extends pass-1 #4.
- **Evidence:** `dex.deep.json`: `/pricing` axe includes `region` (moderate) count=4 and `landmark-one-main` count=1; home includes `region` count=3. Pass-1 #4 reported landmark-one-main on home only and did not mention 'region'.
- **Fix:** Add a single `<main>` plus section/header/footer landmarks so no content sits outside a landmark, applied per-route including /pricing.

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| mobile nav no-collapse / horizontal overflow home | Major | STILL_TRUE | Fresh dex.json home responsive: 375px scrollW=429 vs clientW=375 (overflowPx=54, identical to prior); fresh dex.deep.json responsiveExtra home overflowPx 82/47/35 at 320/390/414 — same values as prior. Interior pages clean (overflowPx=-15), same scope. |
| ~25MB first-load media (meeting-prep.mp4 + hero-media.png) | Major | STILL_TRUE | Fresh dex.verified.json: meeting-prep.mp4 realKB=20126 (200), hero-media.png realKB=4969 (200), top12RealTotalMB=25.3; next-largest real asset still the 323KB JS chunk. Byte-identical to prior capture. |
| missing robots.txt/sitemap.xml/canonical site-wide | Major | STILL_TRUE | dex.diff.json robotsSitemap old=404/new=404 both; dex.extras.json regression robots.txt 404 (text/html app-shell, 15687B) and sitemap.xml 404; dex.deep.json canonical=null on 13/13 captured pages incl. /terms and all 9 use-case details. Live curl 2026-07-06: robots.txt 404 text/html, sitemap.xml 404 text/html, home HTML contains 0 rel="canonical". |
| site-wide color-contrast failures (home 27, /use-cases 74, /pricing 17, details 11 each, /terms 2) | Major | STILL_TRUE | Fresh dex.deep.json axe color-contrast (serious) counts identical to prior: home 27, /use-cases 74, /pricing 17, each of 9 /use-cases/* detail pages 11, /terms 2; dex.diff.json axeChanges=[] (no count changes). |
| footer copyright '@ 2026' instead of © | Minor | STILL_TRUE | dex.diff.json copyStrings '@ 2026' wasPresent=true stillPresent=true; fresh dex.deep.json text contains '@ 2026' on 12 pages and '©' on 0 pages — same as prior. |
| jsonldCount=0 on all pages (no structured data) | Minor | STILL_TRUE | Fresh dex.deep.json data.jsonldCount=0 on all 13 pages with captured data (og=10/twitter=4 tags still present on home), unchanged from prior. |
| no `<main>` landmark + region violations on / and /pricing | Minor | STILL_TRUE | Fresh dex.deep.json axe: home landmark-one-main 1 node + region 3 nodes; /pricing landmark-one-main 1 + region 4 — identical counts to prior (also reproduced in fresh pass-1 dex.json). |
| 7 security headers missing (only HSTS present) | Minor | STILL_TRUE | Fresh dex.headers.json all sampled pages: security.missing = [content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection]; only strict-transport-security max-age=63072000 present. Unchanged. |
| header nav tap targets ~23px (Product/Pricing/Blog) | Minor | STILL_TRUE | Fresh dex.deep.json responsiveExtra: tinyTapCount=3 at 320/390/414 on home and interior pages, examples Product 53x23 / Pricing 45x23 / Blog 29x23 — same elements and heights as prior. |
| testimonial double comparative 'couldn't be more happier' | Minor | STILL_TRUE | dex.diff.json copyStrings stillPresent=true; fresh homepage text: '…Invisibly fit into my life and couldn’t be more happier.' — string unchanged. |
| subjectless meeting-prep copy 'Afterwards, automatically send follow-ups using call notes, and writing tone.' | Minor | STILL_TRUE | dex.diff.json copyStrings 'call notes, and writing tone' stillPresent=true; fresh homepage text contains the exact sentence 'Afterwards, automatically send follow-ups using call notes, and writing tone.' — unchanged. |
| pricing `<title>` only 13 chars ('Pricing \| Dex') | Minor | STILL_TRUE | Fresh dex.deep.json /pricing data.titleLen=13, unchanged; dex.diff.json metaChanges=[]. |
| fonts + hero media served max-age=0 must-revalidate (no immutable caching) | Minor | STILL_TRUE | Fresh dex.headers.json assets: aeonikprovf.woff2 and aeonikprovf-italic.woff2 cache-control 'public, max-age=0, must-revalidate' content-encoding (none); meeting-prep.mp4 and hero-media.png same cache-control — while _next/static chunks correctly get max-age=31536000,immutable. Unchanged. |

**New findings (2026-07-06):**

### 1. Stale old-brand Open Graph/Twitter meta site-wide; og:url hardcoded to homepage apex on every page
- **Severity:** Major
- **Type:** Bug (SEO/social)
- **What & where:** All pages — live-verified 2026-07-06 on `https://www.joindex.com/`, `https://www.joindex.com/pricing`, and `https://www.joindex.com/privacy-2` (shared `<head>`); og:image identical on 13/13 captured pages in fresh dex.deep.json.
- **Evidence:** Live curl 2026-07-06 on all three pages: og:title and twitter:title = "Dex – Your Second Brain in Chrome" and og:description = "Dex turns your browser into a single AI workspace — one brain that knows your tasks, your context, and how to move your work forward." (pre-rebrand positioning), while the same homepage `<title>` is "Dex — The self-driving workspace for operators". og:url = "https://joindex.com" (apex, which fresh headers.json shows 308-redirects to www) on every page including /pricing and /privacy-2, so any interior-page share unfurls as the homepage with the outdated tagline. Fresh dex.deep.json ogImage/twImage = https://joindex.com/og/og.webp on all 13 pages with data; extras.json shows it resolves via 1 redirect to www then 200 image/webp (43,714 B). og:image:alt also still reads "Dex - Your Second Brain in Chrome". Prior reports only counted og/twitter tags ("og (10) and twitter (4) tags are already present") and never read values — not a duplicate.
- **Fix:** Update the shared og:title/twitter:title/og:description (and og:image:alt) to the current self-driving-workspace positioning, ideally per-page; emit a per-page og:url on the canonical https://www.joindex.com host; point og:image at the www host to drop the scraper redirect.

### 2. Missing space renders as "agent memory.Retrieval" in homepage section copy
- **Severity:** Minor
- **Type:** Bug (content/copy)
- **What & where:** `https://www.joindex.com/` — full-width statement `<p>` in the section immediately after the "Skill Builder Agent" block.
- **Evidence:** Live-fetched raw HTML 2026-07-06 contains `<span class="font-medium text-black">Bigger than agent memory.</span><span class="text-neutral-400">Retrieval surfaces facts.` — two inline spans inside one centered `<p>` with zero whitespace between them and only color/weight utility classes (no margin/padding/br), so it renders "Bigger than agent memory.Retrieval surfaces facts." The joined string "agent memory.Retrieval surfaces facts" appears in pages[].data.text of both the 2026-07-01 and 2026-07-06 deep captures. Distinct from the excluded h1 "self-drivingworkspace" extraction artifact, which has an explicit `<br/>` and renders correctly. Not in prior reports.
- **Fix:** Add a space between the spans (e.g. `memory.</span> <span ...>` or a leading space in the gray span's text).

### 3. Privacy policy lives at CMS-duplicate slug /privacy-2; footer reaches it via a redirect and the Terms of Service hardcodes the -2 URL
- **Severity:** Minor
- **Type:** Bug (links/legal)
- **What & where:** `https://www.joindex.com/privacy` (homepage footer links href="/privacy", 2 occurrences) → 307 → `https://www.joindex.com/privacy-2`; hardcoded inside `https://www.joindex.com/terms`.
- **Evidence:** Live curl 2026-07-06: /privacy returns 307 with Location https://www.joindex.com/privacy-2; /privacy-2 returns 200 with title "Privacy Policy | Dex". The live Terms of Service body states (twice) "see our Privacy Policy, located at https://joindex.com/privacy-2", baking the duplicate-page slug (on the redirecting apex host, no less) into a legal document. Prior audit's coverage note only said "/privacy served off-app; resolves 200" and never surfaced the -2 slug or the hardcoded legal reference — not a duplicate. The /privacy and /blog ERR_CONNECTION_RESET nav failures in the fresh deep crawl are excluded capture artifacts and are not part of this finding.
- **Fix:** Publish the policy at /privacy (301 /privacy-2 → /privacy), keep footer links pointing at /privacy, and update the URL cited in the Terms of Service to the canonical www host.
