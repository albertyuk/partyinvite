# QA Audit — Uplane (uplane.com)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, clean marketing site; the main opportunities are a misspelled careers URL, a batch of quick accessibility fixes, and a one-line SEO title fix.

**B. Issues (highest impact × ease first)**

### 1. Careers page lives at a misspelled URL
- **Severity:** Medium
- **Type:** Bug (broken)
- **What & where:** The top-nav "Careers" link and the real careers page both use the typo slug `/carrees`. Anyone who types or shares the intuitive `/careers` URL hits a dead end. — `https://uplane.com/carrees` (nav link `href="https://uplane.com/carrees"`)
- **Evidence:** `GET https://uplane.com/carrees` → **200** (the live careers page; it embeds an Ashby job board at `jobs.ashbyhq.com/uplane`), while `GET https://uplane.com/careers` → **404**.
- **Fix:** Rename the route to `/careers` and add a 301 redirect from `/carrees` so existing links keep working.

### 2. Icon/social links have no accessible name + low-contrast text
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** Four interactive links expose no text to screen readers — the logo (`.framer-1j8w6qx`, `href="./"`), the home logo link (`.framer-1glm8x8`), the X link (`a[href$="uplane_com"]`), and the LinkedIn link — so a screen reader just announces "link." Several passages of small text also fall below the WCAG AA contrast minimum. — `https://uplane.com/`
- **Evidence:** axe `link-name` (serious) — 4 nodes; axe `color-contrast` (serious) — 5 nodes, e.g. Cookie Policy link at 2.84:1 (`#999999` on `#ffffff`), footer text at 3.11:1 (`#8d929e` on `#ffffff`), and body text at 3.6:1 (`#2476ff` on `#f0f0f0`) — all below the 4.5:1 threshold.
- **Fix:** Add an `aria-label` (or visually hidden text) to each icon/logo link, and darken the low-contrast text colors to reach at least 4.5:1.

### 3. Homepage `<title>` is just "Uplane"
- **Severity:** Medium
- **Type:** Suggestion (SEO)
- **What & where:** The homepage title tag is the single word "Uplane" — no keywords, no value proposition — which weakens search ranking and click-through in results and browser tabs. — `https://uplane.com/`
- **Evidence:** `<title>Uplane</title>` (6 chars); the same 6-char title repeats across `/blogs`, `/about-us`, and `/talk-to-us`.
- **Fix:** Set a descriptive title, e.g. "Uplane — Full-funnel AI marketing automation."

### 4. 6.5MB autoplay hero video + content outside landmarks
- **Severity:** Low
- **Type:** Suggestion (perf/a11y)
- **What & where:** The homepage autoplays a large hero video on load, which dominates page weight, and a lot of page content sits outside ARIA landmark regions. — `https://uplane.com/` (`HeroWebsiteOp.mp4`)
- **Evidence:** `HeroWebsiteOp.mp4` real transfer size 6538KB (~6.5MB) — the single heaviest asset, out of ~6.6MB total across the top pages; axe `region` (moderate) — 36 nodes on the homepage.
- **Fix:** Compress/transcode the video and add a poster image with lazy/deferred play; wrap page content in proper landmarks (`<main>`, `<nav>`, etc.).

**C. Founder-ready paragraph**

> I came across Uplane while looking into AI marketing tools and really like what you're building — the full-funnel, "AI runs the campaigns" angle is genuinely compelling, and I dug into the site a bit given my film and marketing background. A couple of things jumped out that are worth a quick look: the "Careers" nav link points to `/carrees` (misspelled), so anyone sharing or typing the obvious `/careers` URL is unlikely to land in the right place. A few icon links (logo, X, LinkedIn) also have no label for screen readers, and the homepage `<title>` is just "Uplane," which is leaving some easy SEO on the table. I've got a short list of a few more small findings if it'd be useful — happy to send it over.

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. Misspelled "campagins" in the homepage hero line
- **Severity:** High
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/` — hero subheadline. The most-read line on the site contains a spelling error.
- **Evidence:** Exact string confirmed in `pages["https://uplane.com/"].data.text`: "AI should run campagins, so that marketers can run marketing." "campagins" is a misspelling of "campaigns" sitting in the most-read hero line.
- **Fix:** Change "campagins" to "campaigns".

### 2. "Al era" / "Al marketing" typo (capital-A lowercase-L) vs correct "AI"
- **Severity:** Medium
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/` — body copy and a section heading.
- **Evidence:** Confirmed in home `data.text`: "...the infrastructure to win in the Al era." and "Al marketing automation for the entire funnel." both render "Al" (A + lowercase L). The same page correctly writes "AI" 11 times.
- **Fix:** Replace both "Al" instances with "AI".

### 3. Broken/placeholder sentence in Managed Growth onboarding timeline
- **Severity:** Medium
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/managed-growth` — Timeline & Setup section.
- **Evidence:** Confirmed in managed-growth `data.text`: "Our worklows make onboarding possible within a matter of days. After a custom demo, we're ready to in Understand marketing objectives." The clause "ready to in Understand marketing objectives" is grammatically broken / unfinished.
- **Fix:** Rewrite to a complete sentence, e.g. "After a custom demo, we're ready to understand your marketing objectives."

### 4. Misspelled "worklows" (workflows) on Managed Growth page
- **Severity:** Medium
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/managed-growth` — Timeline & Setup section.
- **Evidence:** Confirmed in managed-growth `data.text`: "Our worklows make onboarding possible within a matter of days." "worklows" is a misspelling of "workflows".
- **Fix:** Change "worklows" to "workflows".

### 5. Identical meta description on all 11 first-party indexable pages
- **Severity:** Medium
- **Type:** Bug (SEO)
- **What & where:** `https://uplane.com/` plus `/blogs`, `/about-us`, `/talk-to-us`, `/product`, `/why-us`, `/enterprise-software`, `/managed-growth`, `/privacy`, `/terms-of-service`, `/blogs/welcome-to-uplane` — `<meta name="description">`.
- **Evidence:** `duplicates.descriptions[0]`: "Next-gen performance marketing for your company" (len 47) listed for all 11 crawled pages; `metaDescriptionLen=47` on every page. Distinct from pass-1 Finding 3, which only covered `<title>`.
- **Fix:** Write a unique, page-specific meta description (50-160 chars) for each page.

### 6. Multiple H1 elements on interior pages (/why-us has 11, /about-us has 2)
- **Severity:** Medium
- **Type:** Bug (a11y / SEO)
- **What & where:** `https://uplane.com/why-us` and `https://uplane.com/about-us` — `<h1>` elements.
- **Evidence:** `data.h1Count = 11` on `/why-us` (`headingLevels [1,1,1,1,1,1,1,1,1,1,1,2,2]`) and 2 on `/about-us` (`headingLevels [1,1,2,2]`). Section/card headings are marked up as top-level H1s. Not in pass-1 (which covered only home region/landmarks).
- **Fix:** Keep exactly one H1 per page (the main heading) and demote remaining section headings to H2/H3.

### 7. Blog article template has no H1 and starts at H3
- **Severity:** Medium
- **Type:** Bug (a11y / SEO)
- **What & where:** `https://uplane.com/blogs/welcome-to-uplane` — heading structure.
- **Evidence:** `data.h1Count = 0`, `data.h1 = []`, `headingLevels = [3,3,3,3,3,2]` (first heading is an H3, no H1). axe rule `page-has-heading-one` (moderate, 1 node, target `['html']`) also fires on this page. Not in pass-1.
- **Fix:** Render the blog post title as an `<h1>` and reorder headings to descend without skipping (h1 -> h2 -> h3).

### 8. No `<main>` landmark on interior pages (landmark-one-main)
- **Severity:** Medium
- **Type:** Bug (a11y)
- **What & where:** `https://uplane.com/blogs`, `/about-us`, `/talk-to-us`, `/product`, `/why-us`, `/managed-growth`, `/privacy`, `/terms-of-service`, `/blogs/welcome-to-uplane`; also mobile home.
- **Evidence:** axe rule `landmark-one-main` (moderate) fires on exactly those 9 interior pages (1 node each, target `['html']`, "Document does not have a main landmark") and in `mobileAxe` for the home page. Distinct from pass-1's home-page `region` finding.
- **Fix:** Wrap each page's primary content in a single `<main>` element.

### 9. Contact page's embedded scheduling iframe has no accessible name
- **Severity:** Medium
- **Type:** Bug (a11y / forms)
- **What & where:** `https://uplane.com/talk-to-us` — iframe (the embedded scheduling/lead widget; page exposes no native form, `data.formCount=0`).
- **Evidence:** axe rule `frame-title` (serious, 1 node, target `['iframe']`): "Element has no title attribute, aria-label ... does not exist or is empty...". The only lead-capture form on the site sits inside this untitled iframe. Not in pass-1.
- **Fix:** Add a descriptive title/aria-label to the iframe, e.g. `title="Contact / schedule a call"`.

### 10. Inline link not distinguishable from surrounding text (link-in-text-block)
- **Severity:** Medium
- **Type:** Bug (a11y)
- **What & where:** `https://uplane.com/talk-to-us` — `span > a[target="_blank"]`.
- **Evidence:** axe rule `link-in-text-block` (serious, 1 node): "insufficient color contrast of 2.07:1 with the surrounding text (link text #b8b8b8, surrounding text #7d7d7d)... link has no styling (such as underline)". Not in pass-1.
- **Fix:** Underline the inline link or raise its contrast vs body text to at least 3:1.

### 11. Low color-contrast text recurs site-wide on interior pages and worsens on mobile
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** `https://uplane.com/managed-growth`, `/product`, `/why-us` and other interior pages; mobile home viewport. Extends the pass-1 home-page contrast finding.
- **Evidence:** Pass-1 flagged color-contrast on the home page only. axe `color-contrast` (serious) now recurs on interior pages — `/managed-growth` and `/product` each 3 nodes of `#2476ff` on `#f5f5f5` at 3.76:1 (below 4.5:1). `mobileAxe` for the home page reports 9 color-contrast nodes vs 3 on desktop.
- **Fix:** Darken the `#2476ff` blue (and `#6a6e76` grey) to reach 4.5:1 in the shared Framer text styles so the fix propagates across pages and breakpoints.

### 12. No JSON-LD / structured data on any page
- **Severity:** Low
- **Type:** Suggestion (SEO)
- **What & where:** All 12 crawled pages.
- **Evidence:** `data.jsonldCount = 0` on every crawled page. No Organization, Product, or Article schema anywhere.
- **Fix:** Add Organization schema site-wide and Article schema on blog posts (and Product/SoftwareApplication on `/product`).

### 13. Nearly every image (427/428) has empty alt text
- **Severity:** Low
- **Type:** Suggestion (a11y / SEO)
- **What & where:** Aggregate across all 12 pages, e.g. `/managed-growth` (103 imgs), `/enterprise-software` (79), `/product` (63).
- **Evidence:** Aggregate `imgEmptyAlt = 427` of `imgTotal = 428` (`imgMissingAlt = 0`). Content images (screenshots, blog thumbnails, diagrams) are all marked `alt=""`, contributing nothing for screen readers or image search.
- **Fix:** Give meaningful alt text to content-bearing images; keep `alt=""` only for purely decorative ones.

### 14. Bare "Uplane" `<title>` spans 10 pages (extends pass-1 Finding 3)
- **Severity:** Low
- **Type:** Suggestion (SEO)
- **What & where:** `https://uplane.com/` plus `/blogs`, `/about-us`, `/talk-to-us`, `/product`, `/why-us`, `/enterprise-software`, `/managed-growth`, `/privacy`, `/terms-of-service` — `<title>`.
- **Evidence:** `duplicates.titles[0]`: title "Uplane" (len 6) shared by 10 pages. Pass-1 Finding 3 named only home + `/blogs`, `/about-us`, `/talk-to-us`; this adds `/product`, `/why-us`, `/enterprise-software`, `/managed-growth`, `/privacy`, `/terms-of-service`.
- **Fix:** Give each page a unique descriptive title, e.g. "Product — AI marketing automation | Uplane".

### 15. Best-practice security headers missing site-wide; HSTS lacks includeSubDomains/preload
- **Severity:** Low
- **Type:** Suggestion (security headers)
- **What & where:** All HTML responses (home, `/blogs`, `/about-us`, `/carrees`, `/talk-to-us`, `/product`; server: Framer/d8a9258).
- **Evidence:** `pages[].security.missing` lists content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection on all 6 measured pages. Only present hardening headers are `strict-transport-security: max-age=31536000` and `x-content-type-options: nosniff`. HSTS carries neither includeSubDomains nor preload.
- **Fix:** Add Content-Security-Policy (or at least `X-Frame-Options: SAMEORIGIN`), Referrer-Policy, Permissions-Policy, and extend HSTS to `max-age=31536000; includeSubDomains; preload`.

### 16. Subject-verb agreement error "what messages drives results"
- **Severity:** Low
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/managed-growth` — Reporting & Insights section.
- **Evidence:** Confirmed in managed-growth `data.text`: "Understand what messages drives results, and get tailored insights...". Plural subject "messages" with singular verb "drives".
- **Fix:** Change to "what messages drive results".

### 17. Inconsistent "end-2-end" styling on the same page
- **Severity:** Low
- **Type:** Suggestion (copy)
- **What & where:** `https://uplane.com/managed-growth` — "Your new marketing team" intro.
- **Evidence:** Confirmed in managed-growth `data.text`: "We'll build end-2-end marketing funnels..." while the same page also writes "End-to-End marketing funnels that convert." and "End-to-end account management...".
- **Fix:** Change "end-2-end" to "end-to-end" for consistency.

### 18. Some visible mobile controls are below the 24px minimum tap-target height
- **Severity:** Low
- **Type:** Suggestion (mobile UX / a11y)
- **What & where:** `https://uplane.com/` (two "Details" links, 45x15px); footer "Privacy Policy" (h=19px) and cookie-consent "Cookie's" button (h=16px) on `/blogs` and `/about-us`.
- **Evidence:** `responsiveExtra` at width=320: home `tinyTapCount=14` with two "Details" links at w=45 h=15; `/blogs` and `/about-us` `tinyTapCount=12` with "Privacy Policy" h=19 and `button.__framer-cookie-component-button` "Cookie's" h=16 — all under the 24px WCAG 2.2 SC 2.5.8 minimum. The count is inflated by desktop-nav anchors (h=18) Framer keeps in the DOM behind the hamburger; the genuinely-visible offenders are the ~15-19px controls. Heuristic (no target-size axe rule available).
- **Fix:** Give the visible Details, footer, and cookie-consent controls a min-height of 24px (ideally 44px) via padding.

### 19. Stray space before period in Managed Growth copy
- **Severity:** Polish
- **Type:** Bug (copy)
- **What & where:** `https://uplane.com/managed-growth` — High-Conversion Ecosystem / Throughput bullet.
- **Evidence:** Confirmed in managed-growth `data.text`: "...landing pages with continuous A/B testing match exactly your ads ." — a space precedes the closing period.
- **Fix:** Remove the space before the period.
