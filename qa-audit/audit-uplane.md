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

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| careers at misspelled /carrees slug; /careers 404 | Major | STILL_TRUE | Live curl 2026-07-06: https://uplane.com/careers -> 404, /carrees -> 200; extras.json regression confirms (404/200); fresh deep crawl has 16 'carrees' references and zero links to /careers — nav 'Careers' still points at the typo slug. |
| duplicate core meta: 6-char title x10 pages, 47-char description x11 pages | Major | STILL_TRUE | Fresh deep.json duplicates{}: title 'Uplane' on the same 10 pages, description 'Next-gen performance marketing for your company' (47 chars) on all 11 first-party pages; diff.json metaChanges=[] (nothing changed since 07-01). |
| 6.5MB autoplay hero video HeroWebsiteOp.mp4 | Major | STILL_TRUE | Fresh verified.json: static.uplane.com/c/uplane/HeroWebsiteOp.mp4 realKB=6538, status 200; top12RealTotalMB=6.6 with homepage HTML only 42KB compressed — video is still ~99% of top-page transfer. |
| 4 links with no accessible name (logo x2, X, LinkedIn) site-wide | Major | STILL_TRUE | Fresh deep.json axe link-name (serious) count=4 on all 11 axe-scannable pages and in mobileAxe x4; same targets .framer-1glm8x8, .framer-1j8w6qx, a[href$="uplane_com"] (+LinkedIn). |
| talk-to-us Fillout iframe has no title (frame-title) | Major | STILL_TRUE | Fresh axe on /talk-to-us: frame-title (serious) 1 node, target '#bi199u > iframe', 'Element has no title attribute aria-label...'; deep.json still shows formCount=0 site-wide (sole lead form remains inside this untitled iframe). |
| color-contrast failures site-wide, worst managed-growth/product, worse on mobile | Major | STILL_TRUE | Fresh axe color-contrast (serious) on all 11 scannable pages: managed-growth 13 nodes (was 15), product 9, home 4 desktop vs 9 mobile (mobileAxe); same tokens #2476ff on #f5f5f5 = 3.76:1 and #8d929e on #ffffff = 3.11:1. Marginal count drop (diff.json: mg 15->13, talk-to-us 6->2), defect unchanged in kind and scale. |
| talk-to-us hotlinked Noun Project image 403 | Major | STILL_TRUE | Fresh capture network.thirdPartyFailures: thumbnails.production.thenounproject.com/...1622F95A...jpg status 403 on /talk-to-us (plus matching console error); live curl with Referer today -> 403. |
| hero typo 'campagins' | Minor | STILL_TRUE | diff.json copyStrings 'campagins' stillPresent=true; verbatim in fresh home data.text: 'AI should run campagins, so that marketers can run marketing.' |
| 'Al era' / 'Al marketing automation' (Al for AI) x2 on home | Minor | STILL_TRUE | diff.json copyStrings 'the Al era' and 'Al marketing automation' both stillPresent=true; both found verbatim in fresh home data.text. |
| managed-growth 'worklows' + broken sentence 'ready to in Understand' | Minor | STILL_TRUE | Fresh managed-growth data.text still contains 'Our worklows make onboarding pos...' and 'After a custom demo, we're ready to in Understand marketing objective...'; diff.json confirms both strings stillPresent. |
| managed-growth copy nits: 'what messages drives', 'end-2-end', stray space 'your ads .' | Minor | STILL_TRUE | All three verbatim in fresh managed-growth data.text: 'Understand what messages drives results', 'We'll build end-2-end marketing funnels', '...match exactly your ads .'; diff.json copyStrings agree. |
| why-us 11 h1 elements; about-us 2 | Minor | STILL_TRUE | Fresh deep.json: /why-us h1Count=11, /about-us h1Count=2 (all other pages 1 except the blog post's 0). |
| blog post welcome-to-uplane has no H1, starts at H3 | Minor | STILL_TRUE | Fresh deep.json /blogs/welcome-to-uplane: h1Count=0 and axe page-has-heading-one (moderate) x1 still fires. |
| no <main> landmark on 9 interior pages + mobile home | Minor | STILL_TRUE | Fresh axe landmark-one-main (moderate) x1 on the same 9 pages (/blogs, /about-us, /talk-to-us, /product, /why-us, /managed-growth, /privacy, /terms-of-service, /blogs/welcome-to-uplane) and on mobile home; region counts 19-56 nodes/page (was 19-57). |
| talk-to-us link-in-text-block (undistinguished inline link) | Minor | CHANGED | No longer fires on /talk-to-us (diff.json 1->0; old node was 2.07:1 #b8b8b8 vs #7d7d7d) but the same rule now fires on /terms-of-service (0->1: span > a[target="_blank"], 2.85:1, link #a4a4a4 vs surrounding #585858, no underline). Root defect persists on a different page. |
| mobile tap targets under 24px (Details 45x15 etc.) | Minor | STILL_TRUE | Fresh responsiveExtra: home tinyTapCount 14-15 at 320/390px with the two 'Details' links still 45x15; /blogs and /about-us tinyTapCount 12-13 (count still inflated by hidden desktop-nav anchors at h=18, as originally noted); overflowPx=0 everywhere. |
| security headers missing site-wide; HSTS lacks includeSubDomains/preload | Minor | STILL_TRUE | Fresh headers.json: all 6 measured pages missing content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy; only HSTS 'max-age=31536000' (no includeSubDomains/preload) + x-content-type-options present. |
| 427/428 images with empty alt | Minor | STILL_TRUE | Fresh deep.json per-page sums: imgEmptyAlt=427 of imgTotal=428 (e.g. /managed-growth 103/103, /enterprise-software 79/79, /product 63/63) — identical to prior aggregate. |
| carrees axe scan error + no canonical + thin meta | Minor | STILL_TRUE | Fresh capture: axe='error' on /carrees desktop and mobile (mobileAxe error now explicitly shows the Ashby CSP nonce blocking script injection — root cause identified, page still un-scannable); canonical=null, title 'Uplane Jobs', metaDescriptionLen=11. Manual a11y review still required. |
| no JSON-LD/structured data on any page | Minor | STILL_TRUE | Fresh deep.json: jsonldCount=0 on all 12 crawled pages. |
| Cookie Policy link 2.84:1 contrast detail | Minor | STILL_TRUE | Fresh home axe color-contrast still includes span > a[target="_blank"] at 2.84:1 (#999999 on #ffffff, 14px); same node also present on fresh /talk-to-us scan. |

**New findings (2026-07-06):**

### 20. Global footer "Careers" link dead-ends on a third-party 404 (useparallel.com company slug resolves to /company/undefined)
- **Severity:** Major
- **Type:** Bug (broken link)
- **What & where:** Footer "Careers" link (`<a href="https://www.useparallel.com/uplane1/careers" target="_blank" rel="noopener">Careers</a>`) on at least https://uplane.com/, /blogs, /about-us, /talk-to-us
- **Evidence:** Fresh pass-1 (evidence/uplane.json links[]) and fresh deep crawl (evidence2/uplane.deep.json links[]): https://www.useparallel.com/uplane1/careers -> 302 -> https://www.useparallel.com/company/undefined (literal broken slug "undefined"); sources list /, /blogs, /about-us, /talk-to-us. Live curl 2026-07-06: full redirect chain terminates at https://www.useparallel.com/404 with HTTP 404. Anchor confirmed in live homepage HTML today (2 SSR-variant copies in the footer). The top-nav Careers still points to the working /carrees page. Same broken redirect existed in the 07-01 capture but was never reported — the prior audit said "no live link points to /careers" and missed this external footer Careers link. Not in audit-uplane.md or the error-audit.md uplane section. Downgraded from the candidate's Critical: it breaks the hiring channel from every page footer, but not a revenue/conversion path (prior audit rated the analogous /carrees slug issue Major).
- **Fix:** Point the footer Careers link at the working careers page (/carrees, or /careers once the slug is renamed), or restore/correct the Parallel job-board company slug; update the shared footer component so the fix propagates to every page.

### 21. sitemap.xml advertises a stale homepage draft (/old/old-home-2) and a form-success utility page (/success-popup), both 200, self-canonical, and indexable
- **Severity:** Major
- **Type:** Bug (SEO)
- **What & where:** https://uplane.com/sitemap.xml entries https://uplane.com/old/old-home-2 and https://uplane.com/success-popup
- **Evidence:** Fresh extras (evidence2/uplane.extras.json sitemap.sampled): both URLs return 200; /old/old-home-2 is 937,111 bytes of HTML — the largest page on the site vs 527,165 for the real homepage. Live curl 2026-07-06: both URLs present in the live sitemap; /old/old-home-2 serves `<title>Uplane</title>`, the same duplicate meta description "Next-gen performance marketing for your company", `<link rel="canonical" href="https://uplane.com/old/old-home-2">` and `<meta name="robots" content="max-image-preview:large">` (no noindex); /success-popup is likewise self-canonical with no noindex ("successfully registered for the Uplane 2026 AI Marketing Automation Playbook" confirmed in live HTML). Search engines are explicitly invited to index an outdated duplicate homepage and a post-registration confirmation page. Neither URL appears in the prior reports (sitemap URL sampling is a new check this run).
- **Fix:** Remove /old/old-home-2 and /success-popup from the sitemap and mark them noindex (or delete the old draft and 301 it to /). In Framer, unpublish drafts instead of leaving them live under /old/.

### 22. Lead-magnet year mismatch: site promotes the "2027 AI Marketing Automation Playbook" but the registration success page says "2026"
- **Severity:** Minor
- **Type:** Bug (copy)
- **What & where:** https://uplane.com/, /blogs, /enterprise-software (promo blocks) vs https://uplane.com/success-popup (confirmation copy)
- **Evidence:** Fresh deep.json page text on /, /blogs, /enterprise-software: "2027 AI Marketing Automation Playbook" (also confirmed in live homepage HTML 2026-07-06). Live curl of /success-popup 2026-07-06: "successfully registered for the Uplane 2026 AI Marketing Automation Playbook. We‘ll send you this year‘s guide as soon as it becomes available". The promo already said "2027" in the 07-01 capture, so the success page is stale — registrants are told they signed up for last year's guide. Not in the prior reports (/success-popup was never crawled).
- **Fix:** Update the /success-popup copy to "2027 AI Marketing Automation Playbook" (and fix the reversed apostrophes in "We‘ll"/"year‘s" while there).

### 23. Footer copyright is stale: "© 2025 Uplane. All rights reserved." across the site in mid-2026
- **Severity:** Minor
- **Type:** Bug (copy)
- **What & where:** Shared footer on 10 of 11 crawled first-party pages (https://uplane.com/, /blogs, /about-us, /talk-to-us, /product, /why-us, /enterprise-software, /managed-growth, /terms-of-service, /blogs/welcome-to-uplane)
- **Evidence:** Fresh deep.json page text contains "© 2025 Uplane. All rights reserved." on the 10 pages listed (extracted text of /privacy does not include it — candidate's "all pages" claim corrected). Confirmed in live homepage HTML 2026-07-06. Meanwhile the legal pages say "Last Updated: June 02, 2026" and the audit date is 2026-07-06. Present in the 07-01 capture too but never reported (the prior sweep flagged the analogous "@ 2026" footer bug on Dex, not this).
- **Fix:** Change the shared footer component to "© 2026" (or render the year dynamically).

### 24. Two grammar errors on /why-us: run-on "doesn’t just help it works for you" and "explain them the ad idea"
- **Severity:** Minor
- **Type:** Bug (copy)
- **What & where:** https://uplane.com/why-us — "Perform. Powered by AI." summary and "Design Bottleneck" card
- **Evidence:** Exact strings confirmed in fresh deep.json page text: (1) "Uplane doesn’t just help it works for you, 24/7." — missing punctuation/conjunction between clauses; (2) "Still waiting for the next alignment meeting with your design team to explain them the ad idea you had last week?" — "explain them the ad idea" is ungrammatical. Neither string appears in the prior reports, whose copy findings were confined to / and /managed-growth.
- **Fix:** Rewrite to "Uplane doesn't just help — it works for you, 24/7." and "…to explain the ad idea to them" (or "walk them through the ad idea").

### 25. Opening single quote (U+2018) used as apostrophe in the Deutsche Bahn CMO quote, enterprise copy, and success-popup
- **Severity:** Minor
- **Type:** Bug (copy)
- **What & where:** https://uplane.com/ and https://uplane.com/enterprise-software (customer quote "That‘s exactly the shift…"), /enterprise-software ("Uplane‘s engineering team"), /success-popup ("We‘ll", "year‘s")
- **Evidence:** Live homepage HTML byte-checked 2026-07-06: "That‘s exactly the shift a company like Deutsche Bahn needs" uses U+2018 instead of U+2019 — inside the flagship customer testimonial. Fresh deep.json text confirms U+2018 once on / and twice on /enterprise-software ("Uplane‘s engineering team", "That‘s exactly the shift"); live /success-popup HTML shows "We‘ll send you this year‘s guide". The rest of the site correctly uses U+2019 (e.g. "Uplane’s Growth Managers"). Verified in served HTML, so not an extraction artifact; not in the prior reports.
- **Fix:** Replace the U+2018 characters with U+2019 (’) in the quote block, enterprise card, and success-popup copy.

### 26. Legal pages contradict each other on the company's principal place of business (Dover, DE vs San Francisco, CA), plus "is an Inc. registered" wording
- **Severity:** Minor
- **Type:** Bug (content / legal)
- **What & where:** https://uplane.com/privacy ("Who We Are") vs https://uplane.com/terms-of-service ("Contact Information")
- **Evidence:** Fresh deep.json page text — Privacy: "Uplane, Inc. is an Inc." and "principal place of business at 1111B S Governors Ave STE 40514, Dover, DE 19904" (a registered-agent mail suite); Terms: "500 Sansome St, STE 410, San Francisco, CA 94111". The two legal documents give different company addresses, and "is an Inc. registered" is malformed. Not in the prior reports. Which address is correct needs the founder's/legal's call — flagged as an inconsistency, not a determination.
- **Fix:** Align both documents: identify the Delaware address as the registered address and use the actual operating address as the principal place of business; change "is an Inc. registered" to "is a corporation registered".

### 27. Recurring Rive runtime errors on /product: "Could not find a View Model linked to Artboard" (x7)
- **Severity:** Minor
- **Type:** Bug (runtime / console)
- **What & where:** https://uplane.com/product — Framer RivePlayer (https://framerusercontent.com/sites/7122F1ic1frRdtnJPMsjjc/RivePlayer_vX.DAAzqJfX.mjs)
- **Evidence:** Fresh pass-1 console (evidence/uplane.json console.errors): 7 errors on /product — "Could not find a View Model linked to Artboard Artboard." and "…Artboard Artboard 3.", all sourced from the RivePlayer module. Identical 7 errors in the 07-01 capture (/home/user/partyinvite/qa-audit/evidence/uplane.json), so reproducible, not transient, and never previously reported. Not in any known-false-positive category (not GSI/FedCM/ERR_CONNECTION_CLOSED). Indicates the Rive animations' data bindings fail to attach; whether the animations visibly misbehave needs manual visual review.
- **Fix:** Re-export the Rive files with the View Model bound to the named artboards (or update the RivePlayer bindings), then visually confirm the /product animations render their dynamic states.

### 28. Duplicate element ID "dtyhev" on the homepage (Framer SSR breakpoint variants duplicate a manually-set ID)
- **Severity:** Minor
- **Type:** Bug (HTML validity)
- **What & where:** https://uplane.com/ — two `div.framer-dtyhev-container` elements with id="dtyhev"
- **Evidence:** New dupIds check (evidence2/uplane.deep.json pages[https://uplane.com/].data.dupIds): {count:1, examples:["dtyhev x2"]}. Confirmed in live homepage HTML 2026-07-06: `id="dtyhev"` appears exactly twice — once inside `.ssr-variant.hidden-dfyudr` and once inside `.ssr-variant.hidden-1r3d4c6.hidden-wx0m0w` (responsive variants of the same component). Duplicate IDs are invalid HTML and can break anchor/aria/getElementById references. Only page on the site with a duplicate ID; not in the prior reports (new check this run).
- **Fix:** Clear or uniquify the manual element ID on that Framer component (Framer copies custom IDs across breakpoint variants) — e.g. remove the custom ID or suffix it per variant.
