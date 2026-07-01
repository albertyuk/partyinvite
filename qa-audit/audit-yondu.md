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
