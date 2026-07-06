# QA Audit — Yondu (yondu.ai)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, lightweight site (homepage ~13KB HTML); the main opportunities are two quick SEO fixes, a couple of dead job links, and a handful of easy accessibility touch-ups.

**B. Issues (highest impact × ease first)**

### 1. Homepage title is "Home", plus 3 `<h1>`s and no canonical
- **Severity:** High
- **Type:** Suggestion (SEO)
- **What & where:** The homepage `<title>` is literally `Home`, which is what shows in search results and browser tabs — `https://www.yondu.ai/`. The page also has three `<h1>` elements (should be one) and no `<link rel="canonical">`.
- **Evidence:** `meta.title` = "Home" (`titleLen` 4); `og:title` / `twitter:title` also "Home"; `h1Count` = 3 ("The Future of Physical Labor.", "We envision a future where all manual tasks are done by robots…", "Partnership with Shipbots"); `canonical` = null.
- **Fix:** Set a descriptive title (brand + value prop, e.g. "Yondu — Drop-in warehouse automation robots"), keep a single `<h1>`, and add a canonical tag.

### 2. Two job links on the Careers page 404
- **Severity:** Medium
- **Type:** Bug (broken)
- **What & where:** Two "Open Positions" links point to YC postings that have been taken down — `https://www.yondu.ai/careers`.
- **Evidence:** HTTP 404 on `ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern` (Robotics Software Intern) and `.../FjyrKhI-quarter-1-2026-robotics-hardware-intern` (Quarter 1 2026 Robotics Hardware Intern). The Senior Robotics Engineer link (`.../l6z04IP-senior-robotics-engineer`) still returns 200.
- **Fix:** Remove or repoint the two dead job links to live postings.

### 3. Accessibility: low contrast, an unlabeled link, and no `<main>` landmark
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** On the homepage (`https://www.yondu.ai/`): two low-contrast text elements, a link with no accessible name, and no `<main>` landmark. The same patterns recur on About, Blog, and Careers.
- **Evidence:** axe `color-contrast` (serious) × 2 — `.text-span-50` and `.button-9` both at contrast ratio 1.96 (`#bba4d3` on `#f3f0e5`); axe `link-name` (serious) × 1 — the nav logo link `.nav-logo-link` (`<a href="/">`) has no discernible text; axe `landmark-one-main` (moderate) — "Document does not have a main landmark".
- **Fix:** Darken the light-purple text/button to meet WCAG AA, add an `aria-label` (e.g. "Yondu home") to the logo link, and wrap primary content in a `<main>` element.

### 4. Missing sitemap.xml; robots.txt is empty
- **Severity:** Low
- **Type:** Suggestion (SEO)
- **What & where:** `https://www.yondu.ai/sitemap.xml` and `https://www.yondu.ai/robots.txt`.
- **Evidence:** `sitemap.xml` returns HTTP 404 (not present); `robots.txt` is served (HTTP 200) but empty.
- **Fix:** Publish a `sitemap.xml` and a minimal `robots.txt` that references it.

**C. Founder-ready paragraph**
> I've been following what Yondu is building — drop-in brownfield bin-picking at a price mid-sized 3PLs can actually afford is genuinely exciting — and while poking around the site I noticed a few small things worth a quick fix. The homepage tab/search title currently just says "Home" rather than something like "Yondu — drop-in warehouse automation," which is an easy SEO win; a couple of the open-role links on the Careers page (the Robotics Software Intern and the Q1 2026 Robotics Hardware Intern) now 404 because the YC postings came down; and a bit of the light-purple text on the homepage is hard to read against the cream background. None of it is urgent, but all of it is quick. Happy to send over the full list with exact URLs if that's useful.

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. Automate 2026 page's canonical points at /automate, which 301s then 404s (self-deindex risk)
- **Severity:** High
- **Type:** Bug (SEO / canonical)
- **What & where:** The `<link rel="canonical">` on `https://www.yondu.ai/yondu-ai-at-automate-2026` names a URL that does not exist.
- **Evidence:** `deep.json` `data.canonical` = `"https://yondu.ai/automate"` on this nav-status-200 page. Live `curl -L` on `https://yondu.ai/automate` returns HTTP 404 (301 to www then 404). A canonical naming a non-existent URL as authoritative signals Google to drop the live page.
- **Fix:** Point the canonical at the page's own live URL (`https://www.yondu.ai/yondu-ai-at-automate-2026`), or create and 200-serve `/automate` first.

### 2. Automate 2026 event location contradicts itself: Chicago vs Detroit
- **Severity:** High
- **Type:** Bug (content / factual inconsistency)
- **What & where:** `https://www.yondu.ai/yondu-ai-at-automate-2026` vs `https://www.yondu.ai/where-weve-been` disagree on where Automate 2026 is.
- **Evidence:** `deep.json` text: the Automate page states "AUTOMATE 2026 · CHICAGO, ILLINOIS" and "Venue McCormick Place, Chicago, Illinois"; Where We've Been lists "Automate 2026 UPCOMING EXHIBITOR 📍 Detroit, MI 🗓 June 22-25, 2026". Same event/dates, two different cities.
- **Fix:** Correct the Where We've Been card to McCormick Place, Chicago (the detailed page's venue), and re-check other location references.

### 3. No JSON-LD structured data on 12 of 13 crawled pages
- **Severity:** Medium
- **Type:** Suggestion (SEO / structured data)
- **What & where:** All pages except `/yondu-ai-at-automate-2026` — e.g. Home, `/about`, `/ourblog`, `/careers`, `/partner-with-us`, all 4 `/blog-posts/*` — carry no Organization/WebSite/Article schema.
- **Evidence:** `deep.json` `data.jsonldCount` = 0 on 12 of 13 pages; only `/yondu-ai-at-automate-2026` has jsonld `["Event"]`, `jsonldCount` 1. No Organization, WebSite, or BlogPosting schema exists elsewhere.
- **Fix:** Add Organization + WebSite JSON-LD to the global template and BlogPosting schema to `/blog-posts/*` pages.

### 4. All 4 blog posts share identical title "Blog Post" and identical meta description
- **Severity:** Medium
- **Type:** Bug (SEO / duplicate metadata)
- **What & where:** `/blog-posts/smb-3pls-dont-need-to-consolidate-they-need-robotic-labor`, `/a-swan-lake-of-robotics`, `/a-peek-behind-the-curtain-of-humanoid-manufacturing`, `/state-of-data-centers`.
- **Evidence:** `deep.json` `duplicates.titles`: "Blog Post" shared by all 4 blog URLs; `duplicates.descriptions`: "Yondu AI Blog Post" shared by the same 4. Each post has a distinct `<h1>` (e.g. "The State of Data Centers") not reflected in title/description.
- **Fix:** Template blog-post `<title>` and meta description from each post's own headline/excerpt.

### 5. Contact form: all 4 fields are placeholder-only, email field lacks autocomplete — on 3 pages
- **Severity:** Medium
- **Type:** Bug (a11y / forms)
- **What & where:** `https://www.yondu.ai/`, `/what-were-automating`, `/partner-with-us` — inputs `name-2`, `Email-2`, `Company-2`, `Message`.
- **Evidence:** `deep.json` `forms[]`: every field `labeled:false`, `ariaLabel:""`, `ariaLabelledby:""`, relying only on placeholder; email input `{"type":"email","name":"Email-2","autocomplete":"",...}`. The same 4-field form appears on all three pages.
- **Fix:** Add a real `<label for>` (or `aria-label`) to each field and set `autocomplete=email/name/organization` on the respective inputs.

### 6. About-page horizontal timeline is a scrollable region not keyboard-focusable
- **Severity:** Medium
- **Type:** Bug (a11y / keyboard)
- **What & where:** `https://www.yondu.ai/about` — selector `.horizontal-timeline`.
- **Evidence:** `deep.json` axe rule `scrollable-region-focusable` (impact serious) × 1, target `.horizontal-timeline`; present in both desktop and mobileAxe `/about` scans. Not in pass-1 audit.
- **Fix:** Add `tabindex="0"` and an accessible name to the scrollable timeline container.

### 7. Sub-24px tap targets on mobile: Get In Touch / email / phone links are only 22px tall
- **Severity:** Medium
- **Type:** Bug (a11y / mobile target-size)
- **What & where:** `https://www.yondu.ai/` (Get In Touch 119×22, hello@yonduai.com 147×22, +1-904-325-3099 134×22) and `/about` (email 147×22, phone 106×22).
- **Evidence:** `deep.json` `responsiveExtra`: home `tinyTapCount` 3 and about `tinyTapCount` 2 at widths 320/390/414; every example h:22 (below WCAG 2.2 24px target-size minimum). Not in pass-1.
- **Fix:** Give these contact links ≥24px (ideally ~44px) tappable height via padding/min-height at mobile breakpoints.

### 8. A third YC job link on Careers 404s (Summer 2026 Robotics Hardware Intern)
- **Severity:** Low
- **Type:** Bug (broken link)
- **What & where:** `https://www.yondu.ai/careers` → `https://www.ycombinator.com/companies/yondu/jobs/boSSSw0-summer-2026-robotics-hardware-intern`.
- **Evidence:** `deep.json` `links[]`: `boSSSw0-summer-2026-robotics-hardware-intern` status 404, source `/careers`. Live `curl` confirms 404. Pass-1 finding #2 listed only NU60VVf and FjyrKhI; this is a third dead link on the same page.
- **Fix:** Remove or repoint the Summer 2026 Robotics Hardware Intern link along with the two dead YC postings already noted.

### 9. Heading hierarchy skips levels on two blog posts (h1→h3→h5 / →h6)
- **Severity:** Low
- **Type:** Bug (SEO/a11y / heading hierarchy)
- **What & where:** `https://www.yondu.ai/blog-posts/a-peek-behind-the-curtain-of-humanoid-manufacturing` and `/blog-posts/state-of-data-centers`.
- **Evidence:** `deep.json` `headingHierarchyOk` = false on both; `headingLevels` [1,2,3,5,5,6,...] (Peek) and [1,2,3,6,6,6,...] (Data Centers); axe rule `heading-order` (moderate) count 1 on each. All other pages `headingHierarchyOk` true.
- **Fix:** Re-tag body sub-headings on these two posts to h2/h3 so levels increase by one.

### 10. Apollo intent-pixel fires and returns HTTP 400 on every crawled page
- **Severity:** Low
- **Type:** Bug (third-party tracker)
- **What & where:** All crawled pages — request to `https://aplo-evnt.com/api/v1/intent_pixel/track_request?app_id=6634504ae8fb0e0438e874af`.
- **Evidence:** `evidence/yondu.json` console errors: the aplo-evnt.com intent_pixel request returns "status of 400 (Bad Request)" on all crawled pages. It is the site's own Apollo tracking config, not a bot-block.
- **Fix:** Fix or remove the Apollo intent-pixel integration (verify app_id/endpoint) so it stops issuing a 400 request on every pageload.

### 11. Blog sentence contradicts its own thesis (missing negation) plus "a flexible robotic labor"
- **Severity:** Low
- **Type:** Bug (grammar / broken sentence)
- **What & where:** `https://www.yondu.ai/blog-posts/smb-3pls-dont-need-to-consolidate-they-need-robotic-labor` — after "This is why general purpose robots matter."
- **Evidence:** `deep.json` text: "The first automation wave that can truly help SMB 3PLs is a giant fixed system built into the warehouse. It is a flexible robotic labor that can be dropped into existing facilities..." — the "is a giant fixed system" claim contradicts the next sentence and the article's thesis; "a flexible robotic labor" mismatches article "a" with the mass noun "labor."
- **Fix:** Insert the missing negation ("is not a giant fixed system") and change "a flexible robotic labor" to "flexible robotic labor."

### 12. Misspelled "Resillience" in About-page cultural pillar heading
- **Severity:** Low
- **Type:** Bug (typo)
- **What & where:** `https://www.yondu.ai/about` — cultural pillars section.
- **Evidence:** `deep.json` text: "...turning our size into an advantage. Grit & Resillience We stay steady under pressure..." — "Resillience" has a doubled l.
- **Fix:** Change "Resillience" to "Resilience".

### 13. Misspelled "humaniods" on Partner With Us page
- **Severity:** Low
- **Type:** Bug (typo)
- **What & where:** `https://www.yondu.ai/partner-with-us` — Teleoperation as a Service section.
- **Evidence:** `deep.json` text: "Yondu Brain allows you to deploy teleoperated humaniods to perform real work in production environments." — transposed letters.
- **Fix:** Change "humaniods" to "humanoids".

### 14. Grammatically broken "you're measure TTFT" in State of Data Centers blog
- **Severity:** Low
- **Type:** Bug (grammar)
- **What & where:** `https://www.yondu.ai/blog-posts/state-of-data-centers` — Inference vs Training section.
- **Evidence:** `deep.json` text: "...or during inference when you’re measure TTFT (Time to First Token...)." — "you're measure" is ungrammatical.
- **Fix:** Change to "when you’re measuring TTFT" (or "when you measure TTFT").

### 15. Non-descriptive, too-short titles on interior pages
- **Severity:** Polish
- **Type:** Suggestion (SEO / metadata)
- **What & where:** `/ourblog` ("Blog"), `/store` ("Store"), `/careers` ("Careers"), `/about` ("About Us"), and 4 `/blog-posts/*` ("Blog Post").
- **Evidence:** `deep.json` `titleLen`: Blog=4, Store=5, Careers=7, About Us=8, Blog Post=9 — all <15 chars, none contain brand/value prop. Extends pass-1's homepage "Home" (titleLen 4) across most interior pages.
- **Fix:** Add brand + descriptor to each title, e.g. "News & Insights — Yondu AI", "Careers at Yondu — Warehouse Robotics".

### 16. Two key meta descriptions exceed the ~160-char snippet limit
- **Severity:** Polish
- **Type:** Suggestion (SEO / metadata)
- **What & where:** `https://www.yondu.ai/` (172) and `https://www.yondu.ai/yondu-ai-at-automate-2026` (201).
- **Evidence:** `deep.json` `metaDescriptionLen` = 172 (homepage) and 201 (Automate page), both >160. About (166) borderline.
- **Fix:** Trim to ~150–160 chars, front-loading the key phrase.

### 17. Inconsistent spelling of "bottleneck" within the State of Data Centers article
- **Severity:** Polish
- **Type:** Suggestion (consistency)
- **What & where:** `https://www.yondu.ai/blog-posts/state-of-data-centers` — heading vs body.
- **Evidence:** `deep.json` text: heading "The bottle necks in the space currently:" (two words) vs body "The largest bottleneck to data center development..." (closed form).
- **Fix:** Standardize on the closed form "bottlenecks" in the heading.

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| YC job link NU60VVf robotics-software-intern 404 on /careers | Critical | STILL_TRUE | Fresh deep.json links[]: 404, source https://www.yondu.ai/careers; extras.json regression 404; live curl 2026-07-06 = 404. Careers page added 2 new live postings (dtIZ1oD, QAKnidR both 200), so dead links are now 3 of 6 job links instead of 3 of 4 — defect unchanged. |
| YC job link FjyrKhI q1-2026-robotics-hardware-intern 404 on /careers | Critical | STILL_TRUE | Fresh deep.json links[]: 404 from /careers; extras.json 404; live curl 2026-07-06 = 404. Still linked from the Open Positions section. |
| YC job link boSSSw0 summer-2026-robotics-hardware-intern 404 on /careers | Critical | STILL_TRUE | Fresh deep.json links[]: 404 from /careers; extras.json 404; live curl 2026-07-06 = 404. Senior Robotics Engineer link (l6z04IP) still 200. |
| Self-deindexing canonical on /yondu-ai-at-automate-2026 → yondu.ai/automate 404 | Major | STILL_TRUE | Fresh deep.json data.canonical still "https://yondu.ai/automate"; extras.json canonicals[]: status 404 after 1 redirect (finalUrl www.yondu.ai/automate), selfConsistent:false; live curl 2026-07-06 = 404. |
| Automate 2026 venue contradiction: Chicago vs Detroit | Major | STILL_TRUE | Fresh deep.json text: automate page reads "AUTOMATE 2026 · CHICAGO, ILLINOIS … Venue McCormick Place, Chicago, Illinois"; /where-weve-been card still reads "Automate 2026 UPCOMING EXHIBITOR 📍 Detroit, MI 🗓 June 22-25, 2026". diff.json copyStrings: both "Detroit, MI" and "McCormick Place" stillPresent:true. |
| Homepage title literally "Home"; no canonical on 12/13 pages | Major | STILL_TRUE | Fresh deep.json: title="Home", titleLen 4 on https://www.yondu.ai/; canonical=null on 12/13 pages (only exception is the automate page's broken canonical). diff.json metaChanges=[]. |
| All 4 blog posts share title "Blog Post" + description "Yondu AI Blog Post" | Major | STILL_TRUE | Fresh deep.json duplicates.titles: "Blog Post" on all 4 /blog-posts/* URLs; duplicates.descriptions: "Yondu AI Blog Post" (descLen 18) on the same 4, despite distinct h1s. |
| Lead-capture form placeholder-only on /, /what-were-automating, /partner-with-us | Major | STILL_TRUE | Fresh deep.json forms[]: identical 4-field form (name-2, Email-2, Company-2, Message) on all 3 pages, every field labeled:false with empty ariaLabel/ariaLabelledby and autocomplete:"" (incl. the email input). |
| sitemap.xml 404 + empty robots.txt | Major | STILL_TRUE | Fresh extras.json: sitemap.xml status 404 (live curl 2026-07-06 = 404); robots.txt 200 with size 0 (pass-1 yondu.json robots sample=""). diff.json robotsSitemap old/new identical. |
| Apollo intent pixel (aplo-evnt.com track_request) HTTP 400 on pageload | Major | STILL_TRUE | Fresh pass-1 yondu.json network.thirdPartyFailures: aplo-evnt.com/api/v1/intent_pixel/track_request?app_id=6634504ae8fb0e0438e874af status 400 on https://www.yondu.ai/, plus 4x "400 (Bad Request)" console errors across crawled pages. |
| Typo "Grit & Resillience" on /about | Minor | STILL_TRUE | diff.json copyStrings "Resillience" stillPresent:true; fresh deep.json /about text: "Grit & Resillience We stay steady under pressure…" (correct spelling "Resilience" not found on page). |
| Typo "teleoperated humaniods" on /partner-with-us | Minor | STILL_TRUE | diff.json stillPresent:true; fresh text: "deploy teleoperated humaniods to perform real work in production environments". |
| Grammar "when you're measure TTFT" in /blog-posts/state-of-data-centers | Minor | STILL_TRUE | Fresh deep.json text: "during inference when you’re measure TTFT (Time to First Token…" — still present verbatim. diff.json's wasPresent:false for this string is an apostrophe-encoding artifact (page uses curly ’, diff probed straight '). |
| Missing negation "is a giant fixed system" + "a flexible robotic labor" in smb-3pls post | Minor | STILL_TRUE | diff.json stillPresent:true; fresh text verbatim: "The first automation wave that can truly help SMB 3PLs is a giant fixed system built into the warehouse. It is a flexible robotic labor that can be dropped into existing facilities…". |
| /about .horizontal-timeline scrollable region not keyboard-focusable | Minor | STILL_TRUE | Fresh deep.json axe on /about: scrollable-region-focusable (serious) x1, target .horizontal-timeline. |
| 22px-tall tap targets (Get In Touch / email / phone) on / and /about at mobile widths | Minor | STILL_TRUE | Fresh deep.json responsiveExtra: home tinyTapCount 3 (Get In Touch 119x22, hello@yonduai.com 147x22, +1-904-325-3099 134x22) and /about tinyTapCount 2 (email 147x22, phone 106x22) at 320/390/414px. |
| color-contrast: light-purple tokens fail AA sitewide (.text-span-50/.button-9 at 1.96) | Minor | STILL_TRUE | Fresh axe: color-contrast (serious) now on 12/13 pages (was 11/13); home still .text-span-50 and .button-9 at 1.96 (#bba4d3 vs #f3f0e5). Per-page node counts shifted (diff.json: home 4→2, /about 1→3 with new nodes .long-title 2.77 / .text-span-30 1.56 / .text-block-12 3.74, /careers 1→2) — same root token defect, marginally wider scope. |
| .nav-logo-link has no accessible name (axe link-name) on 12/13 pages | Minor | STILL_TRUE | Fresh axe: link-name (serious) x1 targeting .nav-logo-link on 12/13 pages (all except /yondu-ai-at-automate-2026), "Element is in tab order and does not have accessible text". |
| Multiple h1s: home x3; /careers, /where-weve-been, /store x2 | Minor | STILL_TRUE | Fresh deep.json h1Count: / = 3, /careers = 2, /where-weve-been = 2, /store = 2 — identical to prior capture. |
| Heading-order skips on 2 blog posts (h1→h3→h5/h6) | Minor | STILL_TRUE | Fresh deep.json: a-peek-behind-the-curtain headingLevels [1,2,3,5,5,6,…] and state-of-data-centers [1,2,3,6,6,6,…], headingHierarchyOk=false on both; axe heading-order (moderate) x1 on each. |
| JSON-LD on only 1 of 13 pages | Minor | STILL_TRUE | Fresh deep.json jsonldCount=0 on 12/13 pages; only /yondu-ai-at-automate-2026 has 1 (Event). No Organization/WebSite/BlogPosting schema anywhere else. |
| Security headers missing site-wide (CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy, COOP) | Minor | STILL_TRUE | Fresh headers.json security.missing on every sampled page: content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy; only HSTS max-age=31536000 present (Cloudflare/Webflow). |
| Non-descriptive short interior titles (Blog/Store/Careers/About Us/Blog Post) | Minor | STILL_TRUE | Fresh deep.json titleLen: /ourblog "Blog"=4, /store "Store"=5, /careers "Careers"=7, /about "About Us"=8, 4x "Blog Post"=9 — all unchanged, no brand/value-prop added. |
| Over-length meta descriptions (home 172, automate 201 chars) | Minor | STILL_TRUE | Fresh deep.json metaDescriptionLen: / = 172, /yondu-ai-at-automate-2026 = 201, /about = 166 (borderline) — identical to prior values. |
| Missing <main> landmark on 12/13 pages | Minor | STILL_TRUE | Fresh axe: landmark-one-main (moderate) x1 on 12/13 pages (absent only on /where-weve-been), plus region (moderate) up to 3 nodes/page. |
| "bottle necks" vs "bottleneck" spelling inconsistency in state-of-data-centers | Minor | STILL_TRUE | Fresh deep.json text: heading "The bottle necks in the space currently:" (open form) vs body "The largest bottleneck to data center development…" / "these two bottlenecks are also connected" (closed form) on the same page. |

**New findings (2026-07-06):**

### 18. Site still promotes Automate 2026 as upcoming 11 days after the event ended (site-wide banner + two events stale-tagged 'Upcoming')
- **Severity:** Major
- **Type:** Bug (content / stale event)
- **What & where:** 12 of 13 pages (nav banner; the event page itself omits it), https://www.yondu.ai/where-weve-been, https://www.yondu.ai/yondu-ai-at-automate-2026.
- **Evidence:** Automate 2026 ran June 22-25, 2026 (site's own dates); today is 2026-07-06. Fresh deep.json text shows the "WE'LL BE AT AUTOMATE 2026!" banner on 12 of 13 pages; live HTML today confirms `<em class="italic-text-3">We&#x27;ll Be At Automate 2026!</em>` on the homepage. The event page is still present/future tense — live-verified today: "Find us at the show", "showing two live applications", "walk up and watch". On /where-weve-been, live markup today shows exactly 2 `data-status="upcoming"` cards with `<span class="yn-badge upcoming-tag">Upcoming</span>`: Automate 2026 (June 22-25, 2026) and AI Con USA (Jun 7-12, 2026) — both ended weeks ago. headers.json www last-modified: Tue, 23 Jun 2026 15:58:04 GMT (not republished since mid-event). Prior reports cover only the Chicago-vs-Detroit contradiction, not staleness.
- **Fix:** Remove or retire the site-wide event banner, move Automate 2026 and AI Con USA to the 'Past' section on /where-weve-been (badge 'Attended'/'Exhibited'), and rewrite /yondu-ai-at-automate-2026 in past tense or redirect it to a recap.

### 19. og:image missing on 8 of 13 pages and twitter:image on 9 of 13 — link shares render without a preview image (new check this run)
- **Severity:** Minor
- **Type:** Suggestion (SEO / social preview)
- **What & where:** https://www.yondu.ai/about, /ourblog, /careers, /yondu-ai-at-automate-2026, /what-were-automating, /partner-with-us, /where-weve-been, /store (no og:image or twitter:image); https://www.yondu.ai/ (og:image present, twitter:image missing).
- **Evidence:** Fresh deep.json data.ogImage/twImage: null on all 8 listed pages; homepage has og:image but twImage=null; only the 4 blog posts have both. Live-verified today: og:image count is 0 on /about, /careers, /where-weve-been and the Automate event page (which does carry og:title, so social meta there is partial but image-less); homepage has 1 og:image and 0 twitter:image. extras.json confirms the homepage og:image (YonduBot.png, 2,093,774 bytes) serves 200 as image/png. The event page built for promotion and the careers page shared with candidates both produce image-less social cards. Prior audit checked only og:title/description.
- **Fix:** Set a default Open Graph image site-wide in Webflow page settings and per-page images for the event/careers pages; add twitter:image (or rely on og:image with summary_large_image card) on the homepage. Consider compressing the 2.0 MB homepage og:image.

### 20. Color-contrast violations increased since 07-01: /about 1→3 and /careers 1→2, with new failing grey-text elements beyond the known purple issue
- **Severity:** Minor
- **Type:** Bug (a11y / contrast regression)
- **What & where:** https://www.yondu.ai/about (.long-title, .text-block-12), https://www.yondu.ai/careers (.text-block-11).
- **Evidence:** diff.json axeChanges: about color-contrast old 1 → new 3; careers old 1 → new 2 (home decreased 4→2). Fresh deep.json axe node details verified: /about .long-title 2.77:1 (#94908b on #f3f0e5, 40px normal — below even the 3:1 large-text minimum) and .text-block-12 3.74:1 (#7d7a76 on #f3f0e5, 17px); /careers .text-block-11 3.57:1 (#817d79 on #f3f0e5, 18px). These grey-on-cream failures are distinct elements from the purple .text-span-30/.text-span-37 issue in the prior report (which is also still present at 1.56:1 and 1.71:1).
- **Fix:** Darken the grey text tokens (#94908b, #7d7a76, #817d79) on the #f3f0e5 background to >=4.5:1 (>=3:1 for the 40px .long-title), alongside the already-reported purple fixes.

### 21. Footer copyright reads "© 2025" site-wide in July 2026 (present on 07-01 but missed by the prior audit)
- **Severity:** Minor
- **Type:** Bug (content / stale)
- **What & where:** All crawled pages, e.g. https://www.yondu.ai/ footer.
- **Evidence:** Fresh deep.json text on 10/13 pages (the other 3 captures truncate before the footer): "Copyright © 2025 Yondu Inc. All Rights Reserved." Live-verified today on /, /about, /careers, /where-weve-been. No copyright finding exists in qa-audit/audit-yondu.md or the Yondu section of error-audit.md.
- **Fix:** Update the shared footer to "© 2026" or bind the year dynamically in the Webflow footer component.

### 22. Two different contact phone numbers published: homepage says +1-904-325-3099, three other pages say +14159078109 (needs manual review)
- **Severity:** Minor
- **Type:** Bug (content / inconsistency — needs manual review)
- **What & where:** https://www.yondu.ai/ (contact block) vs https://www.yondu.ai/about, /what-were-automating, /partner-with-us.
- **Evidence:** Fresh deep.json text: home "CONTACT OUR TEAM hello@yonduai.com +1-904-325-3099" while the equivalent CONTACT blocks on /about, /what-were-automating and /partner-with-us show "+14159078109" (unformatted, no separators). Live-verified today: home HTML contains +1-904-325-3099, /about HTML contains +14159078109. The prior audit mentioned the 904 number only as a tap-target measurement, never the discrepancy. May be intentional (separate lines) — needs manual review, but one number is likely stale and the 415 one is unformatted.
- **Fix:** Confirm which number is current, use it consistently in the shared contact component, and format it (e.g. +1 (415) 907-8109 or +1-904-325-3099).

### 23. Homepage video caption is a broken sentence: "We introduce Yondu AI co-founder Michael Chen and Tahmid Jamal break down..."
- **Severity:** Minor
- **Type:** Bug (grammar / broken sentence)
- **What & where:** https://www.yondu.ai/ — video section (label "In this video").
- **Evidence:** Live HTML today: `In this video</div><div class="body-text-12">We introduce Yondu AI co-founder Michael Chen and Tahmid Jamal break down the many dimensions of their work, from the challenges they&#x27;re solving today to the long-term vision...` — two clauses fused ("We introduce X and Y break down"), and "co-founder" is singular for two people. Same text in fresh deep.json. Not reportable before: the 07-01 deep capture stored empty text for the homepage.
- **Fix:** Rewrite, e.g. "In this video, Yondu AI co-founders Michael Chen and Tahmid Jamal break down the many dimensions of their work..."

### 24. State of Data Centers post: "undoubtably", a dangling fragment ending "...and more, connectivity.", agreement error "because it impacts", and "lends to consider" (all missed by pass 1)
- **Severity:** Minor
- **Type:** Bug (grammar / factual)
- **What & where:** https://www.yondu.ai/blog-posts/state-of-data-centers.
- **Evidence:** All strings verified in fresh deep.json AND live HTML today: (1) "undoubtably" (nonstandard for "undoubtedly"); (2) fragment "Despite innovations in cables, PCIe (Peripheral Component Interconnect Express), hollow core optics, and more, connectivity." immediately followed by "These limitations matter because it impacts the ability..."; (3) "lends to consider many different tradeoffs" — ungrammatical. Additionally flagged for manual review: "tens of thousands of watts... often taking up 10%-30% of a data center's entire power consumption" (live-verified) — tens of kW cannot be 10-30% of the multi-MW facilities the article describes. Prior reports flagged only "you're measure TTFT" and "bottle necks" on this page.
- **Fix:** Change to "undoubtedly"; complete the fragment (e.g. "...and more, connectivity has not kept pace") and fix "because it impacts" to "because they impact"; rewrite "lends to consider" as "requires weighing"; re-check the watts figure (likely tens of megawatts).

### 25. Swan Lake post opening states the opposite of its claim: "a feat no other robotics company has yet to achieve"
- **Severity:** Minor
- **Type:** Bug (grammar / inverted meaning)
- **What & where:** https://www.yondu.ai/blog-posts/a-swan-lake-of-robotics — first paragraph.
- **Evidence:** Live HTML today: "the engineers and Robots at Yondu accomplished a feat no other robotics company has yet to achieve" — "has yet to achieve" under negation literally means every other company has already achieved it; intended is "has yet achieved". Stray capitalization "Robots" also confirmed live. Same text in fresh deep.json. Absent from prior reports.
- **Fix:** Change to "a feat no other robotics company has yet achieved" and lowercase "robots".

### 26. About-page pillar mixes grammatical persons: "We never ask anyone to do anything you wouldn't do yourself"
- **Severity:** Minor
- **Type:** Bug (grammar)
- **What & where:** https://www.yondu.ai/about — Flat Structure cultural pillar.
- **Evidence:** Live HTML today contains `anything you wouldn&#x27;t do yourself`; fresh deep.json text: "Founders and everyone work equally on the same problems without exception. We never ask anyone to do anything you wouldn't do yourself." — subject "We...anyone" paired with "you...yourself". Prior reports flagged only "Resillience" on this page.
- **Fix:** Change to "We never ask anyone to do anything we wouldn't do ourselves."

### 27. 32 target="_blank" links carry no rel="noopener" — including all YC job links on /careers (new blankNoopener check)
- **Severity:** Minor
- **Type:** Bug (security / best practice)
- **What & where:** All 13 pages (2 footer social links each: x.com/yonduai, linkedin.com/company/yonduai/); https://www.yondu.ai/careers (8 instances incl. the ycombinator.com job anchors).
- **Evidence:** Fresh deep.json data.blankNoopener: {count:2} on 12 pages + {count:8} on /careers = 32 total (candidate's "30" corrected). Live-verified today on /careers: 8 occurrences of target="_blank", 0 occurrences of rel containing noopener; anchors like `<a href="https://www.ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern" target="_blank" class="career-link w-inline-block">` have no rel attribute at all. Homepage: 2 target="_blank", 0 noopener. Impact is limited — evergreen browsers imply noopener — but headers.json confirms no CSP or COOP is served, so explicit rel is the only hardening for legacy browsers.
- **Fix:** Add rel="noopener noreferrer" to all target="_blank" links (the footer social component and careers link component cover all 32).
