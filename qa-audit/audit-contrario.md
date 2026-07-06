# QA Audit — Contrario (contrario.ai)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Solid, fast, well-optimized site; the main opportunity is accessibility — a handful of fixes (icon-link labels, landmarks, contrast) that would meaningfully help candidates on assistive tech.

**B. Issues (highest impact × ease first)**

### 1. Icon/logo links have no accessible name
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** Several links (the header logo, customer-logo links, footer social links) render only an image or icon with no text or label, so screen readers announce them as an empty "link." — `https://www.contrario.ai/` — e.g. `a.framer-auccsu[href="./"]` (logo), `li:nth-child(1) > a[data-framer-name="Sieve"]`, and the other customer-logo `<a>` elements.
- **Evidence:** axe `link-name` (serious) — 13 nodes. Example: `<a class="framer-auccsu framer-u5ynwl" href="./" data-framer-page-link-current="true">` is in tab order with no discernible text.
- **Fix:** Add an `aria-label` (or visually hidden text) to each icon/logo link, e.g. `aria-label="Contrario home"` and the company name for each customer-logo link.

### 2. Focusable content inside `aria-hidden` elements
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** The duplicated (carousel) customer-quote slides are marked `aria-hidden="true"` but still contain focusable links, so keyboard users tab into content that is hidden from screen readers. — `https://www.contrario.ai/` — e.g. `li[aria-hidden="true"]:nth-child(12)` through `:nth-child(16)`.
- **Evidence:** axe `aria-hidden-focus` (serious) — 22 nodes. Each flagged node: "Focusable content should have tabindex=\"-1\" or be removed from the DOM."
- **Fix:** Apply `tabindex="-1"` to (or remove from the tab order) any links inside the `aria-hidden` carousel clones so hidden and focus states stay in sync.

### 3. Low-contrast text below WCAG AA
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** Muted grey text — customer names/roles on the homepage and the footer section labels (PRODUCT / COMPANY / CONNECT), copyright, and "Systems Operational" on the dark footer — falls under the 4.5:1 AA threshold. — `https://www.contrario.ai/` and `https://www.contrario.ai/blogs/announcement/better-recruiting-built-on-contrario`
- **Evidence:** axe `color-contrast` (serious) — 26 nodes on home. Examples: customer role `#8d9097` on `#fafafa` = 3.06:1; customer name `#70747d` on `#fafafa` = 4.48:1. On the blog footer, `#5e5e5e` on `#191919` = 2.71:1 for section labels.
- **Fix:** Darken the light-grey foregrounds (and lighten the dark-footer greys) until each pair meets at least 4.5:1 for body text.

### 4. Heading order skips levels
- **Severity:** Low
- **Type:** Suggestion (a11y)
- **What & where:** The homepage jumps from `<h2>`/`<h3>` section headings straight to `<h4>` sub-labels (e.g. "Upload your role", "Review candidates on Slack") without an intervening `<h3>`, breaking the document outline. — `https://www.contrario.ai/` — e.g. `.framer-besqrq > h4`, `.framer-13juv1y > h4`, `.framer-1tnk58y > h4`.
- **Evidence:** axe `heading-order` (moderate) — 3 nodes on home ("Heading order invalid").
- **Fix:** Reassign these `<h4>`s to the next sequential level (likely `<h3>`) so heading levels only increase by one.

### 5. No `<main>` landmark; content sits outside landmark regions
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** The document has no `<main>` element, and a large share of page content is not wrapped in any landmark, so screen-reader users can't jump to the primary content or navigate by region. — `https://www.contrario.ai/` — target `html`; example unlandmarked nodes `.framer-yllbqb`, the Solutions/Features dropdown text containers.
- **Evidence:** axe `landmark-one-main` (moderate) — 1 node ("Document does not have a main landmark"); axe `region` (moderate) — 30 nodes ("Some page content is not contained by landmarks").
- **Fix:** Wrap the primary page body in a single `<main>` and use semantic landmarks (`<header>`, `<nav>`, `<footer>`) so all content falls inside a region.

**C. Founder-ready paragraph**
> I've been looking at Contrario as both a potential user and someone hoping to join the team, and I really like what you've built — the site is genuinely fast and the story is sharp. Poking around the front end, I noticed a few small accessibility things that seem worth a quick pass: a number of your icon and logo links (the header logo, the customer logos, the footer social icons) have no text label, so screen readers just announce an empty "link," and the duplicated customer-quote carousel slides are marked hidden but still catch keyboard focus. There's also some light-grey text — customer names/roles and the footer labels — that dips below the WCAG contrast minimum, plus the page is missing a `<main>` landmark. None of it is breaking anything, and they're the kind of fixes that mostly matter for candidates using assistive tech, which feels on-brand for a recruiting product. Happy to share the full list with exact selectors if it's useful.

_Notes on scope: SEO is in good shape (title, meta description, canonical, Open Graph/Twitter cards, robots.txt and sitemap.xml all present). Performance is strong — real compressed page transfers are ~47 KB (home) and 40 KB or less elsewhere, with negligible layout shift (CLS 0.003). External link "failures" (Product Hunt, LinkedIn, VentureBeat) are bot-blocks/rate-limits, and the console 403/400 lines are third-party analytics beacons blocked in the capture environment — none are site bugs._

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. `aria-hidden-focus` carousel bug ships site-wide (4 interior pages, not just home)
- **Severity:** High
- **Type:** Suggestion (a11y) — extends pass-1 #2
- **What & where:** The same duplicated testimonial-carousel clones flagged on home in pass-1 #2 recur on every interior page that embeds the shared carousel. — `https://www.contrario.ai/customers`, `/book-a-demo`, `/domains`, `/companies` — e.g. `li[aria-hidden="true"]:nth-child(12)`..`nth-child(16)`.
- **Evidence:** `deep.json` per-page axe: `aria-hidden-focus` (serious) = 22 nodes on EACH of `/customers`, `/book-a-demo`, `/domains`, `/companies` — "Focusable content should have tabindex=\"-1\" or be removed from the DOM." The defect lives in the shared carousel component, so it propagates to every page embedding it.
- **Fix:** Apply the pass-1 #2 fix (`tabindex="-1"` or remove clones from tab order) once in the shared carousel component so all pages inherit it.

### 2. Interior pages have wrong `<h1>` count: 8 pages have zero, `/customers` renders 13
- **Severity:** Medium
- **Type:** Bug (a11y + SEO / heading structure)
- **What & where:** Eight pages ship no `<h1>` at all, and `/customers` marks 12 stat numbers up as `<h1>`. — `h1Count==0`: `/book-a-demo`, `/referral`, `/privacy-policy`, `/terms-of-service`, `/faqs`, `/blogs/announcement/better-recruiting-built-on-contrario`, `/blogs/case-studies/listenlabs`, `/blogs/case-studies/gallium`; `h1Count==13`: `/customers`.
- **Evidence:** `deep.json` `data.h1Count`: those 8 pages report 0 with `h1==[]` (book-a-demo headingLevels `[2,4,4,4,4]`; privacy-policy `[3,4,...]`; case studies start at `h3`), and axe `page-has-heading-one` (moderate) = 1 node `['html']` on each. `/customers` `h1` = `['Customer Stories','10+','90+ days','5 tools','100%','20+ hrs/week','4 days','80%','45 days','40%','100+ hours','4 engineers','50%']` — stat numbers as `<h1>` (axe `heading-order`=3). Pass-1 only covered h4-skips on home.
- **Fix:** Add exactly one descriptive `<h1>` to each of the 8 pages missing it, and on `/customers` demote the 12 stat-number `<h1>`s to non-heading text, leaving only 'Customer Stories' as the H1.

### 3. Privacy Policy inline links not distinguishable from body text
- **Severity:** Medium
- **Type:** Bug (a11y / link distinguishability)
- **What & where:** Inline links in the policy body rely on color alone (no underline) and don't contrast enough with the surrounding text. — `https://www.contrario.ai/privacy-policy` — e.g. `[href="mailto:founders@contrario.ai"]` and the `[rel="noopener"]` policy-body links.
- **Evidence:** `deep.json` axe `link-in-text-block` (serious) = 6 nodes, only on `/privacy-policy`. "The link has insufficient color contrast of 1.31:1 with the surrounding text" (one node 2.47:1); link color `#2f2cff`, no underline.
- **Fix:** Underline (or otherwise non-color-distinguish) inline links in policy body text, or raise link-vs-text contrast to at least 3:1.

### 4. Terms of Service section 6 heading is a copy-paste from the Privacy Policy
- **Severity:** Medium
- **Type:** Bug (content/copy)
- **What & where:** The ToS section-6 heading is the Privacy Policy's section-6 title, contradicting the page's own table of contents and its subsections. — `https://www.contrario.ai/terms-of-service` — body section 6 heading, immediately before '6.1 User Submissions'.
- **Evidence:** `deep.json` text renders '...6. California Privacy Rights 6.1 User Submissions Any content you post, upload, or share...' while the page's own TOC lists '5. Rights in the Services 6. User Content and Licensing 7. Copyright...'. The 6.1/6.2 subsections are about user content, so the section-6 title 'California Privacy Rights' is wrong.
- **Fix:** Change the ToS section-6 heading from 'California Privacy Rights' to 'User Content and Licensing' to match its TOC and subsections.

### 5. Same meta description copied across 5 pages
- **Severity:** Medium
- **Type:** Bug (SEO/metadata)
- **What & where:** One generic description is served on five topically-distinct pages, including the blog index. — `https://www.contrario.ai/`, `/blogs`, `/domains`, `/referral`, `/blogs/announcement/better-recruiting-built-on-contrario` — `<meta name="description">`.
- **Evidence:** `deep.json` `duplicates.descriptions`: 'Contrario is the AI Recruiting Platform powered by expert recruiters. Trusted by companies at every stage for their most critical hires.' (len 136) is served on exactly those 5 pages, including the blog index and the topically-distinct `/domains` and `/referral` pages.
- **Fix:** Write a unique meta description per page (blog index, referral, domains, announcement post) reflecting each page's content.

### 6. `/domains` reuses the generic homepage `<title>` (duplicate title)
- **Severity:** Medium
- **Type:** Bug (SEO/metadata)
- **What & where:** `/domains` is a distinct page but carries the homepage title verbatim. — `https://www.contrario.ai/domains` — `<title>`.
- **Evidence:** `deep.json` `duplicates.titles`: 'Contrario | AI Recruiting Platform' is shared by `['https://www.contrario.ai/','https://www.contrario.ai/domains']`. `/domains` has `h1==['Domains']`, body 'Every Contrario search is matched to domain-expert recruiters...', yet the homepage title.
- **Fix:** Give `/domains` a unique, descriptive title such as 'Hiring Domains | Contrario'.

### 7. No JSON-LD / structured data on any page (all 15)
- **Severity:** Medium
- **Type:** Suggestion (SEO/structured data)
- **What & where:** No structured data anywhere on the site. — Site-wide — no `<script type="application/ld+json">` on any crawled page.
- **Evidence:** `deep.json`: all 15 crawled pages have `data.jsonldCount==0` and `data.jsonld==[]`. No Organization, Product/Service, Article, BreadcrumbList, or FAQPage markup anywhere — cross-page confirmation of the pass-1 homepage observation.
- **Fix:** Add Organization schema sitewide (logo, sameAs), Article schema on blog/case-study posts, and FAQPage schema on `/faqs` so search engines can surface rich results.

### 8. Dead outbound customer link to gigaml.com (404 / removed Framer site)
- **Severity:** Low
- **Type:** Bug (broken link)
- **What & where:** A customer-showcase link points to a removed Framer site that returns 404. — `https://www.contrario.ai/domains` — anchor `href="https://gigaml.com/"`.
- **Evidence:** `deep.json` `links[]`: `{url:'https://gigaml.com/', fp:false, status:404, sources:['https://www.contrario.ai/domains']}`. Re-verified with curl (Chrome UA): HEAD and GET return HTTP 404 serving Framer's `<title>Site Not Found | Framer</title>` — a genuine dead link, not a bot-block. (The finance.yahoo.com article link that showed status 0 re-verified as a live 200 and is NOT a defect.)
- **Fix:** Update or remove the gigaml.com reference(s) on `/domains` so the showcase doesn't link visitors to a 404 'Site Not Found' page.

### 9. Email/name/company form fields have no `autocomplete` attribute
- **Severity:** Low
- **Type:** Suggestion (a11y / forms — autofill)
- **What & where:** Real form fields are labeled but lack the `autocomplete` purpose hint (WCAG 1.3.5). — `https://www.contrario.ai/book-a-demo` (`input[type=email]` name='Work email') and `https://www.contrario.ai/referral` (`input[type=email]` name='email').
- **Evidence:** `deep.json` `forms[]`: on both pages the visible required email input has `autocomplete=""` (should be `'email'`); First/Last Name and Company fields likewise `autocomplete=""` instead of `given-name`/`family-name`/`organization`. Fields are `labeled=true`, so this is purely the missing purpose hint. (The unlabeled inputs with `autocomplete='one-time-code'` are honeypots and correctly not reported.)
- **Fix:** Add autocomplete tokens to the real fields: `'email'` on the email input, and `given-name`/`family-name`/`organization` on the name/company inputs.

### 10. Sub-24px tap targets at mobile widths, including 20px-tall form inputs on Book-a-Demo
- **Severity:** Low
- **Type:** Suggestion (a11y / mobile target size)
- **What & where:** Multiple tap targets fall below the 24px WCAG 2.5.8 floor at mobile widths, notably 20px-tall form inputs. — `https://www.contrario.ai/book-a-demo` at 320/390/414px (also home at 390px).
- **Evidence:** `deep.json` `responsiveExtra`: book-a-demo `tinyTapCount` = 10/11/10 at 320/390/414px. At 390px: `input.framer-form-input` w=99 h=20 and w=234 h=20 (fields only 20px tall), `a.framer-15xbc7q` w=85 h=22, `a.framer-r5hy08` w=72 h=20 — all below 24px. Home `tinyTapCount` 4-5 ('Spencer Mateega' link 125x18). `overflowPx=0` everywhere (no horizontal scroll).
- **Fix:** Raise touch-target height to at least 24px (ideally ~44px) for form inputs and icon links on small viewports via min-height/padding.

### 11. Nine page titles are too short and omit the brand suffix
- **Severity:** Low
- **Type:** Suggestion (SEO/metadata)
- **What & where:** Nine titles are short and lack the '| Contrario' suffix the homepage title carries. — `/faqs`(4), `/blogs`(5), `/careers`(7), `/referral`(8), `/customers`(9), `/book-a-demo`(11), `/companies`(13), `/privacy-policy`(14), `/recruiters`(14) — `<title>`.
- **Evidence:** `deep.json` `data.titleLen`: FAQs=4, Blogs=5, Careers=7, Referral=8, Customers=9, Book a Demo=11, For Companies=13, Privacy Policy=14, For Recruiters=14 — all short and none carry the '| Contrario' suffix.
- **Fix:** Expand each to a keyword-rich, brand-suffixed title, e.g. 'FAQs | Contrario AI Recruiting', 'Careers at Contrario', 'Customer Stories | Contrario'.

### 12. ListenLabs case-study meta description exceeds the ~160-char limit
- **Severity:** Low
- **Type:** Bug (SEO/metadata)
- **What & where:** The meta description runs to 204 chars and will truncate in SERP snippets. — `https://www.contrario.ai/blogs/case-studies/listenlabs` — `<meta name="description">`.
- **Evidence:** `deep.json` `metaDescriptionLen==204`: 'Listen Labs reached a $500M valuation in January 2026. Their hiring challenge was not finding candidates. It was finding the right ones, fast, without adding noise to their existing recruiting operations.'
- **Fix:** Trim to roughly 150-160 characters so it displays in full.

### 13. Best-practice security response headers missing site-wide
- **Severity:** Low
- **Type:** Bug (security headers)
- **What & where:** Common security headers are absent on all HTML responses, so pages can be framed (clickjacking) and leak full referrers. — All HTML responses (home, `/customers`, `/careers`, `/blogs`, `/book-a-demo`, `/announcement`) — top-level document response headers.
- **Evidence:** `headers.json` `security.missing` is identical on all 6 sampled pages: content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection. Only present: `strict-transport-security: max-age=31536000` (no includeSubDomains/preload) and `x-content-type-options: nosniff`. Severity kept Low — Framer-hosted marketing site, no auth/session/cookies.
- **Fix:** Add site-wide headers in the Framer/CDN config: Content-Security-Policy (at minimum `frame-ancestors`), `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a Permissions-Policy, and extend HSTS to `includeSubDomains; preload`.

### 14. Typo 'experties' (should be 'expertise') in the For Companies search field
- **Severity:** Low
- **Type:** Bug (content/copy)
- **What & where:** A search-field placeholder is misspelled. — `https://www.contrario.ai/companies` — LIVE CANDIDATES search-field placeholder.
- **Evidence:** `deep.json` text exact string: 'LIVE CANDIDATES Search experties (e.g. Fintech, Design)'.
- **Fix:** Correct 'Search experties' to 'Search expertise'.

### 15. Customer brand 'Wispr Flow' misspelled as 'WISP FLOW' in a product mockup
- **Severity:** Low
- **Type:** Bug (content/copy)
- **What & where:** The brand is dropped an 'r' in a mockup chip. — `https://www.contrario.ai/companies` — 'Admin work handled' card, product-designer chip.
- **Evidence:** `deep.json` text exact string: 'PRODUCT DESIGNER (WISP FLOW)'. The brand is spelled 'Wispr Flow'/'WISPR FLOW' in ~12 other mentions across the site; `/companies` itself contains one correct 'Wispr Flow'.
- **Fix:** Change 'WISP FLOW' to 'WISPR FLOW' to match the brand used everywhere else.

### 16. Gallium case study contradicts itself on Carlos Libardo's name and role
- **Severity:** Low
- **Type:** Bug (content/copy)
- **What & where:** The team card's name and title disagree with the rest of the page. — `https://www.contrario.ai/blogs/case-studies/gallium` — team card vs THE IMPACT section vs ROLES HIRED list.
- **Evidence:** `deep.json` text: team list 'Jose Thomaz Founding Data Engineer Carlos Libardo Founding Data Engineer' (duplicating Jose's title), but the Impact section says 'Carlos Eduardo Libardo, Founding AI Engineer', and 'ROLES HIRED VIA CONTRARIO' lists one each Founding AI/ML/Software/Data Engineer — so the team card's name+title is inconsistent.
- **Fix:** Relabel the team card to 'Carlos Eduardo Libardo — Founding AI Engineer' so name and role are consistent across the page.

### 17. Terms of Service on-page nav mislabeled 'Privacy policy sections'
- **Severity:** Low
- **Type:** Bug (content/copy)
- **What & where:** A leftover from the Privacy Policy template labels the ToS sidebar. — `https://www.contrario.ai/terms-of-service` — 'On this page' sidebar heading.
- **Evidence:** `deep.json` text exact string: 'On this page Privacy policy sections Overview 1.1 Using Contrario...' — a leftover from the Privacy Policy template on the Terms of Service page.
- **Fix:** Relabel the ToS on-page nav from 'Privacy policy sections' to 'Terms sections' (or similar).

### 18. Gallium case-study title slightly over 60 chars
- **Severity:** Polish
- **Type:** Suggestion (SEO/metadata)
- **What & where:** The title is a couple characters over the ~60-char SERP display limit. — `https://www.contrario.ai/blogs/case-studies/gallium` — `<title>`.
- **Evidence:** `deep.json` `titleLen==62` for 'How Gallium made 4 engineering hires in 15 days with Contrario'.
- **Fix:** Shorten, e.g. 'Gallium: 4 engineering hires in 15 days with Contrario'.

### 19. Inconsistent 'K' capitalization in Careers total-comp figures
- **Severity:** Polish
- **Type:** Bug (content/copy)
- **What & where:** One comp figure uses lowercase 'k' while the rest use uppercase. — `https://www.contrario.ai/careers` — Open roles list (Talent Operator row).
- **Evidence:** `deep.json` text: 'TOTAL COMP $140K - $220K' and 'TOTAL COMP $100K - $150K' (uppercase K) vs 'TOTAL COMP $80k - $200k' (lowercase k) for the Talent Operator role.
- **Fix:** Normalize the Talent Operator figure to '$80K - $200K'.

### 20. Article title rendered with different capitalization on blog index vs article
- **Severity:** Polish
- **Type:** Bug (content/copy)
- **What & where:** The announcement's title case differs between the index link and the article itself. — `https://www.contrario.ai/blogs` (link) vs the announcement article (title/H1).
- **Evidence:** `deep.json`: blog index text contains 'Better Recruiting. Built on Contrario.' twice (title-case 'Recruiting'), while the article's own page title is 'Better recruiting. Built on Contrario.' (lowercase 'recruiting'), which also appears in the article body.
- **Fix:** Pick one canonical capitalization and use it in both the index link and the article heading.

### 21. Missing article in announcement blog: 'recognize shape of a fit'
- **Severity:** Polish
- **Type:** Bug (content/copy)
- **What & where:** A dropped article in a bullet on the announcement post. — `https://www.contrario.ai/blogs/announcement/better-recruiting-built-on-contrario` — 'Agents learn across many company workflows' bullet list.
- **Evidence:** `deep.json` text exact string: "Holding a company's hiring bar deeply enough to recognize shape of a fit" — a dropped article before 'shape'.
- **Fix:** Insert the missing article: '...to recognize the shape of a fit'.

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| aria-hidden-focus carousel 22 nodes on 5 pages | Major | STILL_TRUE | Fresh pass-1 home axe aria-hidden-focus=22; fresh deep.json count=22 on /customers, /book-a-demo, /companies. /domains reported 0 this run (was 22) but its extracted page text is byte-identical to the old capture — carousel-init timing variance in the capture, not a fix; defect confirmed on 4 of the 5 pages. |
| link-name 13 unnamed icon/logo links | Major | STILL_TRUE | Fresh pass-1 home link-name=13; fresh deep.json count=13 home, 13 /customers and /book-a-demo, 14 /companies, 47 /domains, 2 on every other crawled page — same shared logo/social-icon links with no accessible name. |
| color-contrast sitewide (26 nodes home) | Major | STILL_TRUE | Fresh pass-1 home color-contrast=26 (identical to prior); fresh deep.json flags all 15 pages (e.g. #9da0a6 on #fafafa = 2.51:1). Minor count drift on two pages (/referral 11→18, /customers 5→6) per diff.json — same defect, same scale. |
| h1 structure: 8 pages zero h1, /customers 13 h1s, home h4 skips | Major | STILL_TRUE | Fresh deep.json h1Count=0 on the same 8 pages (/book-a-demo headingLevels still [2,4,4,4,4], /referral, /privacy-policy, /terms-of-service, /faqs, 3 blog posts, each with page-has-heading-one=1); /customers h1 list still ['Customer Stories','10+','90+ days',...] = 13; home heading-order still 3 nodes. |
| duplicate title /domains + one description on 5 pages | Major | STILL_TRUE | Fresh deep.json duplicates: title 'Contrario \| AI Recruiting Platform' still on / and /domains; the 136-char 'Contrario is the AI Recruiting Platform powered by expert recruiters…' description still served on the same 5 pages (/, /blogs, /domains, /referral, announcement post). diff.json metaChanges=[]. |
| ToS section-6 heading 'California Privacy Rights' copy-paste | Minor | STILL_TRUE | Fresh deep.json /terms-of-service text still reads '…6. California Privacy Rights 6.1 User Submissions Any content you post, upload, or share…' while the TOC still lists 'User Content and Licensing'. |
| ToS sidebar labeled 'Privacy policy sections' | Minor | STILL_TRUE | diff.json copyStrings 'Privacy policy sections' stillPresent=true; fresh /terms-of-service text contains it at char offset 79 ('On this page Privacy policy sections Overview…'). |
| security headers missing sitewide | Minor | STILL_TRUE | Fresh headers.json: identical security.missing on all sampled pages — content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection; HSTS still bare 'max-age=31536000' (no includeSubDomains/preload). |
| home TTFB intermittent spike | Minor | FIXED | Prior 1,466 ms spike not reproduced: fresh headers.json TTFB home=408 ms, interior pages 204–284 ms (www canonical probe 738 ms); live curl 2026-07-06 TTFB 0.399 s, HTTP 200. Was already flagged 'needs manual review / monitor'; steady-state is normal. |
| 24 third-party hosts ~2.6k requests | Minor | STILL_TRUE | Fresh deep.json thirdParty=24 hosts, requestTotal=2663 across the 15-page crawl (prior ~2,621) — framerusercontent 1241, youtube 693, posthog 97+19, doubleclick 60, apollo/aplo-evnt 60, GTM 19, etc. |
| no main landmark / content outside regions | Minor | STILL_TRUE | Fresh axe: landmark-one-main=1 on every one of the 15 pages; region count=33 on home in deep.json (30 in pass-1, matching prior), 10–47 on interior pages. |
| tiny tap targets, 20px form inputs on book-a-demo | Minor | STILL_TRUE | Fresh deep.json responsiveExtra book-a-demo tinyTapCount=10/11/10 at 320/390/414px (identical to prior), inputs still h=20 (e.g. 99x20, 234x20 at 390px); home 4–5 ('Spencer Mateega' 125x18). |
| gigaml.com dead outbound link on /domains | Minor | STILL_TRUE | diff.json 404→404; fresh extras.json regression probe 404 (6,873-byte page); fresh deep.json still lists source=/domains; live curl 2026-07-06 returns 404 serving '<title>Site Not Found \| Framer</title>'. |
| link-in-text-block privacy-policy 6 nodes | Minor | STILL_TRUE | Fresh deep.json axe link-in-text-block count=6 on /privacy-policy only — unchanged. |
| form fields missing autocomplete | Minor | STILL_TRUE | Fresh deep.json forms: all 7 real labeled fields on /book-a-demo and all 9 on /referral still have autocomplete="" (honeypots still one-time-code). |
| zero JSON-LD structured data sitewide | Minor | STILL_TRUE | Fresh deep.json jsonldCount=0 on all 15 crawled pages. |
| copy defects: 'Search experties' / 'WISP FLOW' / Carlos Libardo card | Minor | STILL_TRUE | diff.json copyStrings: 'Search experties', 'WISP FLOW', and 'Carlos Libardo Founding Data Engineer' all stillPresent=true; fresh /blogs/case-studies/gallium text still also says 'Carlos Eduardo Libardo, Founding AI Engineer', so the name/title contradiction stands; /companies still has exactly one correct 'Wispr Flow'. |
| 9 short un-branded page titles | Minor | STILL_TRUE | Fresh deep.json titleLen unchanged for all nine: FAQs=4, Blogs=5, Careers=7, Referral=8, Customers=9, Book a Demo=11, For Companies=13, Privacy Policy=14, For Recruiters=14 — none carry the '\| Contrario' suffix. |
| listenlabs meta description 204 chars | Minor | STILL_TRUE | Fresh deep.json /blogs/case-studies/listenlabs metaDescriptionLen=204, same 'Listen Labs reached a $500M valuation…' text. |
| gallium title 62 chars | Minor | STILL_TRUE | Fresh deep.json /blogs/case-studies/gallium titleLen=62, same title 'How Gallium made 4 engineering hires in 15 days with Contrario'. |
| careers comp lowercase 'k' inconsistency | Minor | STILL_TRUE | Fresh /careers text still contains '$80k - $200k' (lowercase) alongside '$140K - $220K' and '$100K - $150K' (uppercase). |
| blog index vs article title-case mismatch | Minor | STILL_TRUE | Fresh /blogs text has 'Better Recruiting. Built on Contrario.' x2 (title-case) while the article page title and body remain 'Better recruiting. Built on Contrario.' (lowercase r). |
| announcement dropped article 'recognize shape of a fit' | Minor | STILL_TRUE | Fresh announcement-post text still reads verbatim "Holding a company's hiring bar deeply enough to recognize shape of a fit". |

**New findings (2026-07-06):**

### 22. Apollo.io visitor-tracking integration broken on every page: tracker script 403 (S3 AccessDenied) + intent pixel 400
- **Severity:** Minor
- **Type:** Bug (third-party integration)
- **What & where:** All sampled pages (6/6 in pass-1: /, /customers, /book-a-demo, /blogs, /careers, /blogs/announcement/...) — requests to ddwl4m2hdecbv.cloudfront.net and aplo-evnt.com
- **Evidence:** Fresh contrario.json console.errors: 'Failed to load resource: 403' for https://ddwl4m2hdecbv.cloudfront.net/b/E63P0HZPLROW/E63P0HZPLROW.js.gz and '400' for https://aplo-evnt.com/api/v1/intent_pixel/track_request?app_id=6a078047d790b60015729cd7 on all 6 sampled pages (same on all 6 in the 07-01 capture); both listed in network.thirdPartyFailures. Live curl 2026-07-06 09:43 UTC: the CloudFront URL returns HTTP 403 with a genuine S3 error body (`<Error><Code>AccessDenied</Code>`, server: AmazonS3, x-cache: 'Error from cloudfront') — an origin-side denial, not a proxy or headless artifact; the aplo-evnt pixel endpoint returns 404 to a bare GET (400 with the browser payload). The prior report's note dismissed these console lines as 'blocked in the capture environment', which this origin-level evidence contradicts; the app_id/asset appears deactivated or misconfigured.
- **Fix:** Fix or remove the Apollo website-visitor tracking snippet — as deployed it throws two console errors and two wasted requests on every pageload and collects no data.

### 23. Dead LinkedIn profile link for investor Franklyn Wang on Careers (degraded from bot-block 429 to real 404 since 07-01)
- **Severity:** Minor
- **Type:** Bug (broken link)
- **What & where:** https://www.contrario.ai/careers — 'Backed by the best' investor card 'Franklyn Wang (CEO, Liquid)' -> https://www.linkedin.com/in/franklyn-wang/
- **Evidence:** Fresh deep.json links[48]: status 404 (GET), source /careers; diff.json priorBrokenLinks shows it moved 429 -> 404 while sibling profiles moved 429 -> 200 or 999. Live differential curl 2026-07-06 09:44 UTC: franklyn-wang/ = 404 while control linkedin.com/in/peterboboff/ = 200 seconds later from the same IP/UA — a removed/renamed profile, not anti-bot noise. The card and link confirmed present in today's served /careers HTML. (Related: his company link tryliquid.xyz now redirects to https://www.liquid.trade/ (200), consistent with a rebrand.)
- **Fix:** Update the card to Franklyn Wang's current LinkedIn URL or drop the hyperlink; consider also pointing the Liquid link at the new liquid.trade domain.

### 24. Referral form's COMPANY STAGE dropdown omits the 'Seed' stage that the book-a-demo stage dropdown includes (and the field is named 'Company Size')
- **Severity:** Minor
- **Type:** Bug (forms/content)
- **What & where:** https://www.contrario.ai/referral — 'COMPANY STAGE' select (internal name 'Company Size')
- **Evidence:** Live HTML 2026-07-06: /referral stage options are Bootstrapped, Pre-Seed, Series A, Growth (Series B/C), Scale (Series D+) — no 'Seed' — while /book-a-demo's equivalent select includes `<option value="Seed">Seed</option>` between Pre-Seed and Series A. A seed-stage company being referred has no accurate choice. The select's name attribute is 'Company Size' while its visible label is 'Company Stage' (both grep-confirmed in the served HTML). Intent should be manually confirmed, but the sibling form strongly suggests an oversight.
- **Fix:** Add a 'Seed' option to the referral form's stage dropdown, and align the field's internal name with its label for cleaner CRM data.

### 25. Book-a-demo 'How did you hear about us?' dropdown misspells the ChatGPT brand as 'Chat GPT' and has a lone lowercase option 'internet search'
- **Severity:** Minor
- **Type:** Bug (content/copy)
- **What & where:** https://www.contrario.ai/book-a-demo — 'HOW DID YOU HEAR ABOUT US?' select
- **Evidence:** Live HTML 2026-07-06 contains `<option value="Chat GPT">Chat GPT</option>` and `<option value="internet search">internet search</option>` while every sibling option is capitalized ('LinkedIn', 'Twitter', 'Word-of-mouth', 'Referral', 'VC Deal (YC, Nexus)', 'Product Hunt', 'Other'). Same class of brand-spelling defect as the previously reported 'WISP FLOW', but a different, unreported instance; present in the 07-01 capture too.
- **Fix:** Rename the labels to 'ChatGPT' and 'Internet search' (values can stay if the CRM depends on them).

### 26. Missing space 'providers.All' in Privacy Policy section 8.3
- **Severity:** Minor
- **Type:** Bug (content/copy)
- **What & where:** https://www.contrario.ai/privacy-policy — section '8.3 How We Store Google User Data'
- **Evidence:** Fresh deep.json page text: '...hosted by industry-leading cloud infrastructure providers.All data is encrypted in transit using TLS/SSL...'. Live-verified 2026-07-06: grep of the served HTML returns 'providers.All data is encrypted in tran' — a single text node, i.e. a real typo rather than a text-extraction artifact. Present in the 07-01 capture but absent from the prior report.
- **Fix:** Insert the space: '...cloud infrastructure providers. All data is encrypted...'.

### 27. Gallium case study titled two different ways on the same /customers page and inconsistently across the site
- **Severity:** Minor
- **Type:** Bug (content/copy)
- **What & where:** https://www.contrario.ai/customers (hero story list vs 'Case Studies' card row); also /blogs and the announcement post vs the article's own H1/`<title>`
- **Evidence:** Live HTML of /customers 2026-07-06 contains both variants: 'How Gallium made 4 engineering hires in 15 days with Contrario' (1 occurrence, hero list) and 'How Gallium hired 4 engineers in 15 days with Contrario' (2 occurrences, card row) — also both present in fresh deep.json text. The article's own `<title>` uses 'made 4 engineering hires' while /blogs and the announcement post's card row use 'hired 4 engineers'. Distinct from prior findings #18 (title length) and #20 ('Better Recruiting' capitalization).
- **Fix:** Pick one canonical title for the Gallium case study and use it in the /customers hero, case-study cards, /blogs, and the article H1/`<title>`.
