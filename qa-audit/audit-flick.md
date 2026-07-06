# QA Audit — Flick (flick.art)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Polished, well-structured marketing site; the main opportunities are trimming a heavy first-load media payload, fixing low-contrast gray text, and a quick SEO/404 fix.

**B. Issues (highest impact × ease first)**

### 1. Low color-contrast text fails WCAG AA
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** The muted gray used for FAQ labels, footer nav links, and "Backed by" text is too light against white — `https://flick.art/` (and repeated on `/about`, `/pricing`, `/blog`) — e.g. `h2.text-[11px]...opacity-50` (the FAQ heading), footer links like `a[href$="pricing"]`.
- **Evidence:** axe `color-contrast` (serious) — 22 nodes on the home page. Foreground `#8e8784` on `#ffffff` measures 3.53:1; WCAG AA requires 4.5:1. The same issue recurs site-wide (35 nodes on `/pricing`, 20 on `/about`, 20 on `/blog`).
- **Fix:** Darken the secondary text token (roughly `#6b6360` or darker) so gray text clears 4.5:1.

### 2. Soft-404: unknown URLs return HTTP 200
- **Severity:** Medium
- **Type:** Suggestion (SEO)
- **What & where:** Nonexistent routes serve the app shell with a success status instead of a real 404 — `https://flick.art/this-page-does-not-exist-qa-audit-420000` (any unknown path).
- **Evidence:** `GET` of a bogus path returns HTTP `200` with `text/html` (1,857 bytes) instead of `404`. Search engines can index phantom URLs and it muddies crawl signals.
- **Fix:** Return a real `404` status for unknown routes (serve the SPA shell with a 404 header, or add a server/edge rewrite that 404s unmatched paths).

### 3. Heavy first-load media payload (~36MB)
- **Severity:** High
- **Type:** Suggestion (perf)
- **What & where:** The home and about pages ship a large amount of real (compressed) media on first load — `https://flick.art/` and `https://flick.art/about`.
- **Evidence:** Top-12 assets total ~36.3MB real transfer. Biggest offenders (real compressed size): autoplay hero video `cdn.flick.art/cover-new2.mp4` = 14.6MB; `cdn.flick.art/system/about.jpg` = 4.8MB; `cdn.flick.art/system/mimi.jpg` = 2.9MB; `flick.art/ray.jpg` = 1.8MB; `cdn.flick.art/true.svg` = 1.8MB (even after zstd). 79 requests on the home page. Costly on mobile for a site whose first impression is visual.
- **Fix:** Transcode/compress the hero video and add a lightweight poster, serve responsive WebP/AVIF for the JPGs, simplify or rasterize the oversized SVG, and lazy-load anything below the fold.

### 4. Missing `<main>` landmark and a focusable node inside `aria-hidden`
- **Severity:** Low
- **Type:** Suggestion (a11y)
- **What & where:** Home page has no `<main>` landmark, most content sits outside any landmark, and one focusable element lives inside an `aria-hidden="true"` container — `https://flick.art/` — the `aria-hidden` node is `div.flex.items-center.shrink-0.gap-x-10...` (a marquee/logo strip).
- **Evidence:** axe `landmark-one-main` (moderate, 1), `region` (moderate, 23 nodes of content outside landmarks), `aria-hidden-focus` (serious, 1 node — focusable content that should have `tabindex="-1"` or be removed from the DOM).
- **Fix:** Wrap the primary page content in a `<main>` element, and either add `tabindex="-1"` to the focusables inside the `aria-hidden` marquee or remove them from the tab order.

**C. Founder-ready paragraph**
> I came across Flick while poking around AI filmmaking tools — I've got a film and marketing background, and it's easily one of the more thoughtfully built products I've tried. While clicking through the public pages I noticed a few small things worth a quick look: the home and about pages load around 36MB of media up front (the hero video alone is ~14.6MB and about.jpg is ~4.8MB), which is a lot on mobile for a site that leads with visuals; a lot of the muted gray text (FAQ labels, footer links) sits at about 3.5:1 contrast, just under the WCAG AA threshold; and unknown URLs currently return a 200 instead of a real 404, which can confuse search crawlers. None of these are hard fixes, and happy to share the full list if it's useful.

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. Localized sitemap URLs serve the identical English homepage shell — duplicate content, no hreflang, no canonical
- **Severity:** Medium
- **Type:** Bug (SEO)
- **What & where:** `https://flick.art/sitemap.xml` locale entries; verified pages `https://flick.art/ja` and `https://flick.art/` (server-rendered `<head>`).
- **Evidence:** Live `sitemap.xml` publishes a full set of locale variants of every marketing page (`/zh`, `/zh-TW`, `/ja`, `/ko`, `/fr`, `/de`, and more). Direct `GET` of `/ja` returns a body byte-identical to `/` (diff: IDENTICAL, both 5058 bytes), with `<html lang="en">`, the English homepage `<title>` 'Flick — AI Filmmaking Studio | We handle AI. You direct stories.', `og:url` hardcoded to `https://flick.art/`, and NO `<link rel="canonical">` and NO hreflang alternates. Crawlers see every localized URL as duplicate English content pointing OG back to the homepage. Extends pass-1's soft-404 finding (that was about status codes; this is sitemap-declared duplicate content / missing hreflang).
- **Fix:** Emit correct per-locale server-rendered `<title>`/description, lang attribute, self-referential canonical, and reciprocal `rel="alternate"` hreflang tags for each locale — or drop the localized URLs from the sitemap until real SSR localization exists.

### 2. `/auth` is indexable with no canonical and duplicates the homepage title/description — contradicting robots.txt's own stated intent
- **Severity:** Medium
- **Type:** Bug (SEO)
- **What & where:** `https://flick.art/auth` — `<meta name="robots">`, `<link rel="canonical">`, `<title>`, `<meta name="description">`.
- **Evidence:** `robots.txt` (`evidence/flick.json`) states: '# NOTE: /auth and /invite/ are intentionally NOT disallowed: they carry noindex meta tags, which only work if crawlers can fetch the page'. But live `/auth` (HTTP 200) serves `<meta name="robots" content="index, follow">` and has NO canonical (`deep.json` canonical=null; live grep count=0). Its `<title>`/description are byte-identical to the homepage, and `deep.json` duplicates{} lists exactly this title+description shared by `/` and `/auth`. The noindex the robots.txt comment promises is not actually present.
- **Fix:** Serve `<meta name="robots" content="noindex, follow">` on `/auth` (matching the robots.txt promise), or give it a self-referential canonical plus a unique title/description.

### 3. Studio plan lists contradictory and duplicated credit amounts
- **Severity:** Medium
- **Type:** Bug (content/pricing)
- **What & where:** `https://flick.art/pricing` — Studio plan card.
- **Evidence:** `deep.json` pages['/pricing'].data.text contains verbatim: '...20,000 credits / month Unlimited customizable credits 20,000 credits / mo Up to ~20,000 images or ~83min video / month'. The card states a fixed '20,000 credits' twice (once '/ month', once '/ mo') while also asserting 'Unlimited customizable credits', which contradicts the fixed figure.
- **Fix:** Remove the duplicate '20,000 credits / mo' line and reconcile 'Unlimited customizable credits' with the fixed 20,000-credit figure so the Studio plan states one unambiguous amount.

### 4. Program named both "Creative Partner" and "Creator Partner" on the same page
- **Severity:** Medium
- **Type:** Bug (content/brand consistency)
- **What & where:** `https://flick.art/creative-partners` — `<title>`, H1, and body paragraphs.
- **Evidence:** `deep.json` creative-partners: `<title>` 'Flick Creative Partner Program — For AI Filmmakers' and H1 'Creative Partner Program', but body text (verbatim, grep-confirmed) reads 'The Flick Creator Partner Program is an ongoing program...' and 'Share posts in the Creator Partner Discord'. Same program referred to by two different names within one page.
- **Fix:** Pick one canonical name (e.g. 'Creative Partner Program') and replace the 'Creator Partner' instances, including the Discord reference.

### 5. Mobile-only: a control has no accessible name (button-name, axe critical) on the home page
- **Severity:** Medium
- **Type:** Bug (a11y / mobile)
- **What & where:** `https://flick.art/` at 375px mobile viewport — button matching selector `.hover\:bg-surface-hover`.
- **Evidence:** `mobileAxe['https://flick.art/']` reports rule 'button-name' impact=critical, 1 node, target `['.hover\:bg-surface-hover']`, help='Buttons must have discernible text'. This rule is absent from the desktop axe run for the same page (desktop lists only aria-hidden-focus/color-contrast/landmark-one-main/region), so it is a mobile-layout-only regression leaving screen-reader users with an unlabeled control.
- **Fix:** Give the mobile button discernible text via visible text, aria-label, or an sr-only span so screen readers announce its purpose.

### 6. Header nav links and social/icon links fall below the 24px minimum tap-target size on narrow screens
- **Severity:** Low
- **Type:** Bug (a11y / mobile UX)
- **What & where:** `https://flick.art/blog` header nav row (Pricing/Blog/Docs/Comparisons/AI Tools/... links, h=16px) and `https://flick.art/`, `/pricing`, `/about` social/icon links (20x20px).
- **Evidence:** `responsiveExtra['https://flick.art/blog']` tinyTapCount=19 at 320px and 20 at 390/414px, with examples {tag:'a',text:'Blog',w:30,h:16}, {tag:'a',text:'Docs',w:31,h:16}, {tag:'a',text:'About',w:35,h:16}. Home/pricing/about icon links repeatedly appear as {tag:'a',text:'',w:20,h:20,cls:'text-text-color hover:rotate-12 transiti'} (home 10@320/15@390-414; pricing 8@320/13@390; about 7@320/12@390). All under the 24px WCAG 2.2 AA (2.5.8) floor; overflowPx=0 confirms these are target-size, not overflow, issues. (Merged the two candidate tap-target findings.)
- **Fix:** Give nav/footer text links and icon links a min tap area of >=24x24px (vertical padding / min-height plus inter-link spacing), ideally ~44px, without enlarging the visible glyph.

### 7. Best-practice security response headers missing site-wide (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP)
- **Severity:** Low
- **Type:** Suggestion (security headers)
- **What & where:** All HTML responses (`/`, `/pricing`, `/blog`, `/about`, `/careers`, `/docs`) — HTTP response headers.
- **Evidence:** `headers.json` security.missing on every page lists content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection; only strict-transport-security is present. No X-Content-Type-Options (MIME-sniffing) and no X-Frame-Options/CSP frame-ancestors (clickjacking). Not in pass-1. Severity downgraded from candidate's 'High' to Low: hardening best-practices on a logged-out marketing site, not an exploited vulnerability.
- **Fix:** Add via vercel.json/next config: X-Content-Type-Options: nosniff; X-Frame-Options: DENY (or CSP frame-ancestors); Referrer-Policy: strict-origin-when-cross-origin; a Permissions-Policy locking down camera/microphone/geolocation; and a scoped Content-Security-Policy.

### 8. Content-hashed JS bundle and a hero image served with `max-age=0, must-revalidate` instead of long-lived immutable caching
- **Severity:** Low
- **Type:** Bug (performance/caching)
- **What & where:** `https://flick.art/assets/index-BRXvC0ty.js` and `https://flick.art/ray.jpg` (Cache-Control response header).
- **Evidence:** `headers.json` assets: index-BRXvC0ty.js (fingerprinted filename '-BRXvC0ty', contentType application/javascript) has cacheControl 'public, max-age=0, must-revalidate', immutable=false; flick.art/ray.jpg has the same 'public, max-age=0, must-revalidate'. The JS filename is content-fingerprinted so its bytes never change, yet every repeat visit forces a revalidation round-trip. Distinct from pass-1 finding #3, which covered payload SIZE only.
- **Fix:** Serve fingerprinted /assets/* with 'Cache-Control: public, max-age=31536000, immutable' and give ray.jpg a non-zero max-age (fingerprint it or set a normal TTL).

### 9. Leftover GPT-Engineer dev tag plus multiple analytics/trackers (GA, GTM, Rewardful) load on marketing pages
- **Severity:** Low
- **Type:** Suggestion (performance/privacy)
- **What & where:** `https://flick.art/` and other marketing pages (third-party network requests).
- **Evidence:** `deep.json` thirdParty[] includes www.google-analytics.com (34 req), www.googletagmanager.com (28), cdn.gpteng.co (17 — GPT-Engineer/Lovable build tag), and r.wdfl.co (17 — Rewardful). cdn.gpteng.co is a build-tool script that typically should not ship to production. Distinct third-party/privacy angle from pass-1's raw request-count perf note.
- **Fix:** Remove the leftover cdn.gpteng.co dev tag from production and defer/consolidate GA+GTM+Rewardful loading.

### 10. `/blog` has no JSON-LD, no robots meta, no `<h1>`, and an ultra-short title
- **Severity:** Low
- **Type:** Bug (SEO/structured data)
- **What & where:** `https://flick.art/blog` — `<head>` JSON-LD, `<meta name="robots">`, page `<h1>`, `<title>`.
- **Evidence:** `deep.json` /blog: jsonldCount=0 (every other marketing page has 1-3 JSON-LD blocks), robotsMeta=null (every other page sets 'index, follow'), h1Count=0 (headingLevels all 2s), titleLen=12 ('Blog — Flick'). Confirmed by live GET: 0 ld+json blocks, no robots meta, 0 `<h1>`.
- **Fix:** Add a Blog/CollectionPage + ItemList JSON-LD block and a robots meta on /blog, promote the page heading to a single `<h1>`, and lengthen the title (e.g. 'Blog — AI Filmmaking Insights | Flick').

### 11. Login form email & password inputs lack name and autocomplete attributes
- **Severity:** Low
- **Type:** Bug (a11y / forms)
- **What & where:** `https://flick.art/auth` — the single form's email and password inputs.
- **Evidence:** `deep.json` forms[] for /auth: fieldCount=2, {type:email, name:'', required:true, autocomplete:'', labeled:true} and {type:password, name:'', required:true, autocomplete:'', labeled:true}. Both fields have empty name and empty autocomplete (labels ARE present, so labeling is fine). Missing autocomplete/name breaks password managers and browser autofill.
- **Fix:** Add autocomplete='username' (or 'email') to the email field and autocomplete='current-password' to the password field, and give each input a name attribute.

### 12. Missing `<main>` landmark and content-outside-landmark recur across interior pages not covered in pass-1
- **Severity:** Low
- **Type:** Suggestion (a11y / interior pages)
- **What & where:** `https://flick.art/projects?tab=explore`, `/auth`, `/compare`, `/tools`, `/residency`, `/creative-partners`, `/mit-ai-film-hackathon-with-flick`.
- **Evidence:** Desktop axe fires landmark-one-main (moderate, 1 node, target `['html']`) on all 7 of these pages, and region (moderate) fires on projects=1, auth=5, compare=1, tools=1, creative-partners=5, mit-hackathon=20 nodes. Pass-1 flagged landmark-one-main/region on the HOME page only; this shows a site-wide template pattern affecting interior pages pass-1 never audited.
- **Fix:** Wrap the primary content of the shared page template in a `<main>` element so the landmark and region checks pass across all routes at once.

### 13. No level-one heading (page-has-heading-one) on `/auth` and `/residency`
- **Severity:** Low
- **Type:** Suggestion (a11y / interior pages)
- **What & where:** `https://flick.art/auth` and `https://flick.art/residency` — axe target `['html']`.
- **Evidence:** Desktop axe reports page-has-heading-one (moderate, 1 node, target `['html']`) on both /auth and /residency (`deep.json`); both also have h1Count=0. Neither page was audited in pass-1, so these are new interior-page instances.
- **Fix:** Add a single top-level `<h1>` to each page (the auth screen title and the residency hero heading).

### 14. Heading hierarchy skips `<h2>` (jumps h1 to h3) on `/pricing` and `/about`
- **Severity:** Low
- **Type:** Suggestion (SEO/a11y)
- **What & where:** `https://flick.art/pricing` and `https://flick.art/about` — document heading outline.
- **Evidence:** `deep.json` headingHierarchyOk=false on both. /pricing headingLevels=[1,3,3,3,3,3,4,3,2,2,2,2] and /about headingLevels=[1,3,3,3,2,2,2,2] — both go directly from the single h1 to h3 with no intervening h2 (axe also reports heading-order on both).
- **Fix:** Re-tag the first sub-section headings on /pricing and /about as `<h2>` so the outline is contiguous h1 -> h2 -> h3.

### 15. Platform names miscapitalized as "Youtube" and "Linkedin"
- **Severity:** Low
- **Type:** Suggestion (copy/brand casing)
- **What & where:** `https://flick.art/creative-partners` — 'WHAT WE EXPECT' section.
- **Evidence:** `deep.json` creative-partners body text (verbatim, grep-confirmed): 'Share quality short films, workflow walkthroughs, or case studies on Instagram, X, Youtube, Linkedin, etc'. 'Youtube' and 'Linkedin' use non-standard casing (correct: 'YouTube', 'LinkedIn') next to correctly-cased 'Instagram'.
- **Fix:** Correct the casing to 'YouTube' and 'LinkedIn'.

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| hero/media ~36MB first-load weight (cover-new2.mp4 14.6MB) | Major | STILL_TRUE | Fresh flick.verified.json (2026-07-06): top12RealTotalMB=37; cdn.flick.art/cover-new2.mp4 realKB=14650 (200), system/about.jpg 4841KB, system/mimi.jpg 2912KB, true.svg 1765KB, ray.jpg 1827KB — same offenders, same sizes. |
| soft-404: unknown paths return HTTP 200 | Major | STILL_TRUE | Fresh verified.json notFoundProbe (2026-07-06): status 200, 1859B text/html for /this-page-does-not-exist-qa-audit-420000; live curl of /ja also confirms unknown paths get the 5058B app shell with 200. |
| color-contrast #8e8784 on #fff 3.53:1 site-wide (11 of 15 pages) | Major | STILL_TRUE | Fresh axe: color-contrast (serious) fires on all 5 axe-run pages (home/pricing/blog/about/careers) with same token — 3.53:1 #8e8784 on #ffffff (pricing also 3.45 #88817e). Fresh capture stores max 5 nodes/rule and crawled only 6 of 15 pages, so old per-page node counts (22/35/20) not re-countable, but the defect and token are identical. |
| mobile-only button-name (critical) on home at 375px | Major | STILL_TRUE | Overturned from an initial UNVERIFIABLE call by the verifier: the fresh deep crawl WAS successfully re-run (evidence2/flick.deep.json, checked 2026-07-06 08:32Z) and its mobileAxe['https://flick.art/'] still reports button-name, impact=critical, 1 node, target .hover\:bg-surface-hover — identical to 07-01. Still present / not fixed. |
| aria-hidden-focus marquee on home | Major | STILL_TRUE | Fresh axe home: aria-hidden-focus (serious), 1 node, target .gap-x-10.sm\:gap-x-14.md\:gap-x-16:nth-child(2) — same logo-marquee strip, 'Focusable content should have tabindex=-1 or be removed from the DOM'. |
| /auth indexable, homepage-duplicate title/desc, no canonical | Major | CHANGED | Live 2026-07-06: /auth now returns HTTP header `x-robots-tag: noindex` — the indexability core (and the robots.txt contradiction) is fixed. Residual defects remain: body is still the byte-identical 5058B homepage shell whose `<meta name=robots>` says 'index, follow' (contradicting the new header), title/description still duplicate the homepage, and no canonical (the HTTP Link rel=canonical header is sent only on /). Severity effectively drops to Minor (head hygiene/contradiction). |
| sitemap locale URLs (/ja,/zh,...) serve identical English homepage, no hreflang/canonical | Major | STILL_TRUE | Live 2026-07-06: /ja returns 200, byte-identical to / (5058B, same ETag d921f10e...), `<html lang="en">`, 0 hreflang, og:url hardcoded to https://flick.art/, no canonical tag and no x-robots/Link header; sitemap.xml still lists 90 `<loc>` entries including full locale sets (/zh, /zh/pricing, /zh-TW, ...) with 0 hreflang annotations. |
| security headers missing site-wide (CSP/XFO/XCTO/Referrer/Permissions/COOP) | Minor | STILL_TRUE | Fresh flick.headers.json: all 6 checked pages list content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection as missing; only strict-transport-security present. |
| fingerprinted JS + ray.jpg served max-age=0 (no immutable) | Minor | STILL_TRUE | Fresh headers.json assets: /assets/index-C6HZNF9Y.js (hash rotated from BRXvC0ty, same policy) cacheControl 'public, max-age=0, must-revalidate', immutable=false; flick.art/ray.jpg identical; hero mp4 still only max-age=14400. |
| tiny tap targets (<24px) nav/social links at mobile widths | Minor | STILL_TRUE | Fresh responsive @375px: tinyTapTargets blog=20, careers=24, pricing=18, home=14, about=11 (home also 12@768, 23@1440); overflowPx=0 everywhere — same target-size-only pattern and scale as before. |
| /blog no h1, no JSON-LD, no robots meta, 12-char title | Minor | STILL_TRUE | Fresh meta /blog: h1Count=0 (all headings level 2), robotsMeta=null, title 'Blog — Flick' titleLen=12, and axe page-has-heading-one (moderate) still fires. JSON-LD count not captured in the fresh pass (field absent), but 3 of 4 claims confirmed unchanged. |
| no `<main>` landmark / content outside landmarks, home + 7 interior pages | Minor | STILL_TRUE | Fresh axe home: landmark-one-main (moderate, 1 node, target html) and region (5 stored nodes, incl. h1) still fire — the shared template is unfixed. The 7 interior pages (/projects,/auth,/compare,/tools,/residency,/creative-partners,/mit-hackathon) were not in this pass's 6-page crawl, so their instances rest on the unchanged shared template. |
| page-has-heading-one missing on /auth and /residency | Minor | STILL_TRUE | Overturned from an initial UNVERIFIABLE call by the verifier: the fresh 15-page deep crawl covers both routes, and evidence2/flick.deep.json shows axe page-has-heading-one (moderate, 1 node) with h1Count=0 on BOTH /auth and /residency. Still present / not fixed. |
| heading hierarchy skips h1→h3 on /pricing and /about | Minor | STILL_TRUE | Fresh meta headingLevels: /pricing=[1,3,3,3,3,3,4,3,4,4,4,4,2,2,2,2], /about=[1,3,3,3,2,2,2,2]; axe heading-order (moderate) fires on both pages. |
| pricing Studio card credits contradiction (20,000 vs Unlimited) | Minor | FIXED | Pricing card redesigned. Fresh rendered text (2026-07-06): Studio now has a credit slider '24k 48k 72k 96k 120k' with a single consistent '24,000 credits /mo ... Up to ~24,000 images or ~100min video / month'; zero occurrences of '20,000' or 'Unlimited customizable credits' anywhere in the page text. Caveat: the new slider introduced a NEW axe serious issue (aria-input-field-name on .border-2) — a fresh defect, not the prior one. |
| Creative Partner vs Creator Partner naming on /creative-partners | Minor | STILL_TRUE | Live English locale chunk flick.art/assets/messages-DbVtdKsc.js (fetched 2026-07-06) still contains title 'Flick Creative Partner Program — For AI Filmmakers' and H1 string 'Creative Partner Program' alongside 'The Flick Creator Partner Program is an ongoing program...' and 'Share posts in the Creator Partner Discord' — both names still shipped. |
| Youtube/Linkedin miscapitalization on /creative-partners | Minor | STILL_TRUE | Same live English locale chunk still contains verbatim: 'Share quality short films, workflow walkthroughs, or case studies on Instagram, X, Youtube, Linkedin, etc' — casing unfixed. |
| /auth email/password inputs lack name + autocomplete | Minor | STILL_TRUE | Fresh crawl didn't reach /auth's form, but the live main JS bundle (index-C6HZNF9Y.js, fetched 2026-07-06) contains zero 'current-password', 'new-password', or 'username' autocomplete tokens (only one unrelated autoComplete:"name" input), so the autocomplete fix has not shipped; indirect but conclusive for the autocomplete half — name attrs need manual confirmation. |
| leftover cdn.gpteng.co dev tag + GA/GTM/Rewardful trackers | Minor | STILL_TRUE | Live homepage HTML (2026-07-06) still ships `<script src="https://cdn.gpteng.co/gptengineer.js">`, googletagmanager gtag (G-9B8C8H3PP3), and the Rewardful bootstrap snippet in the 5058B shell. |
| empty-table-header ×4 on /pricing comparison tables | Minor | FIXED | Same-harness fresh axe run on /pricing no longer reports empty-table-header (old pass-1 flick.json had it: minor, 4 nodes; fresh pass-1 lists only aria-input-field-name/color-contrast/heading-order/region) — consistent with the pricing-page redesign removing/reworking the comparison table. |

**New findings (2026-07-06):**

### 20. og:image and twitter:image both 404 on the shared homepage `<head>` shell — link/social previews for the homepage and every non-blog route have no image
- **Severity:** Major
- **Type:** Bug (SEO/social previews)
- **What & where:** `https://flick.art/` shell (served byte-identical on `/`, `/pricing`, `/about`, `/careers`, `/auth`, `/residency`, all locale URLs) — og:image=`https://flick.art/og-image.jpg`, twitter:image=`https://flick.art/twitter-image.jpg`, twitter:card=`summary_large_image`.
- **Evidence:** Live curl 2026-07-06: both URLs return 404 text/plain 79B (Vercel 'The page could not be found NOT_FOUND') — a real 404, not the site's usual soft-404 200, so scrapers definitively get no image. Fresh extras (evidence2/flick.extras.json socialImages) independently records both as status 404, isImage=false. Both meta tags verified verbatim in the raw 5,058B shell fetched live, and og:image=https://flick.art/og-image.jpg appears in both the 07-01 and 07-06 pass-1 captures (pages.home.meta.og), so the prior audit live-missed it (it had no image-resolution check). Not in audit-flick.md or the error-audit Flick section. Scope narrowed from the candidate's 'site-wide': blog posts are server-rendered with their own og:image on R2 which resolves (live: pub-af51a02c...r2.dev/blog/blender-ai-filmmaking/cover.jpeg → 200 image/jpeg 2.5MB), so only the shell-served routes are affected.
- **Fix:** Upload real og-image.jpg / twitter-image.jpg (1200x630) at the site root or point the shell's meta tags at an existing CDN asset, then re-scrape on the major platforms.

### 21. All non-blog routes serve the byte-identical homepage `<head>`; per-page title/description/canonical/og are injected client-side only, so social scrapers and non-JS crawlers see the homepage card (og:url=https://flick.art/, 404 og:image) for every marketing deep link
- **Severity:** Major
- **Type:** Bug (SEO/social previews)
- **What & where:** `https://flick.art/pricing`, `/about`, `/auth` (live byte-compared) and by extension `/careers`, `/residency` and all locale URLs — server-rendered HTML shell. NOT `/blog` or `/blog/<slug>`, which are genuinely server-rendered.
- **Evidence:** Live curl 2026-07-06: /pricing, /about and /auth are each byte-identical (cmp) to the 5,058B / response, sharing etag d921f10e8d1f891e18d81be181aff136, hardcoded homepage `<title>`, og:url=https://flick.art/ and the 404ing og:image; the HTTP Link rel=canonical header is sent only on /. The per-page titles/canonicals in the fresh captures come from the rendered DOM (JS-injected) — e.g. deep.json /pricing canonical=https://flick.art/pricing vs raw HTML containing none. extras.json shows every sampled sitemap URL returns the same 5,058B shell except /blog (16,861B). Correction to the candidate: /blog and blog posts ARE SSR'd with correct per-page title/og:url/canonical (live-verified on /blog and /blog/blender-ai-filmmaking), so shared blog links unfurl correctly — the defect covers the marketing/app routes. Prior audit reported the shell problem only for sitemap locale URLs and /auth's title duplication; the generalization to all English marketing routes is new.
- **Fix:** Server-render or edge-inject per-route `<head>` meta (Vercel edge middleware or a prerender step, as already done for the blog subtree) so title/description/canonical/og:url/og:image are correct in the raw HTML for every route.

### 22. NEW since 07-01: /pricing redesign shipped an unlabeled ARIA slider (axe aria-input-field-name, serious) on the plan card, plus new out-of-landmark promo-marquee spans and a color-contrast regression (35 → 41 nodes)
- **Severity:** Major
- **Type:** Bug (a11y regression)
- **What & where:** `https://flick.art/pricing` — `span[role="slider"]` (selector `.border-2`, aria-valuemin=0 aria-valuemax=4, tabindex=0) on the Studio credit slider (24k/48k/72k/96k/120k); promo marquee spans ('New lower prices: GPT Image 2: from 3 credits (80% off) · Kling O3 ... · Seedance 2 ...').
- **Evidence:** Fresh pass-1 (evidence/flick.json) pricing axe: aria-input-field-name serious count=1 with html `<span role="slider" aria-valuemin="0" aria-valuemax="4" ... tabindex="0">` and no aria-label/labelledby/title; also fires in the fresh mobile axe (deep.json mobileAxe). diff.json axeChanges confirms it is new (0 → 1) alongside region 0 → 4 (the four marquee spans, node HTML verified) and color-contrast 35 → 41; old capture's pricing rules were only color-contrast/empty-table-header/heading-order. Page redesign confirmed: H1 changed 'Get started with the plan that fits you' → 'Start free. Upgrade when you're ready.' Keyboard/screen-reader users hit a focusable slider on the purchase page announced with no name. Not in either prior report (predates the redesign).
- **Fix:** Add aria-label (e.g. 'Select plan credits') or aria-labelledby to the slider span; place the promo marquee inside a landmark and fix its contrast.

### 23. sitemap.xml omits /blog and all 14 blog posts (also /tools, /compare, /projects) while listing 81 duplicate locale shells — the site's only correctly server-rendered SEO content is unlisted
- **Severity:** Minor
- **Type:** Bug (SEO)
- **What & where:** `https://flick.art/sitemap.xml`.
- **Evidence:** Live fetch 2026-07-06: exactly 90 `<loc>` entries = 9 English pages (/, /pricing, /about, /terms, /privacy, /careers, /residency, /creative-partners, /mit-ai-film-hackathon-with-flick) × 10 (English + 9 locales: zh, zh-TW, ja, ko, fr, de, es, it, pt); zero entries contain 'blog', none contain /tools, /compare or /projects. Fresh evidence/flick.json links list 14 live /blog/<slug> URLs (e.g. /blog/blender-ai-filmmaking, /blog/img2img-consistent-character). Extra sting verified this run: the blog subtree is the only part of the site with real SSR per-page meta (see shell finding), yet it's the part missing from the sitemap while the byte-identical locale shells (already reported 07-02) fill it. extras.json sitemap sampling confirms every sampled locale entry returns the same 5,058B shell. Prior /blog finding covered only h1/JSON-LD/robots/title; prior sitemap finding covered only locale duplication — the omission is new.
- **Fix:** Add /blog and each /blog/<slug> (with lastmod) to sitemap.xml; drop or fix the locale-shell entries.

### 24. HSTS policy inconsistent across routes: homepage and /docs send max-age only (63072000), interior pages send max-age=31536000; includeSubDomains; preload
- **Severity:** Minor
- **Type:** Suggestion (security headers)
- **What & where:** `https://flick.art/` and `/docs` response headers vs `/pricing`, `/blog`, `/about`, `/careers` (and `/auth`).
- **Evidence:** Fresh evidence2/flick.headers.json: / and /docs → strict-transport-security: max-age=63072000 (no includeSubDomains/preload); /pricing, /blog, /about, /careers → max-age=31536000; includeSubDomains; preload. Identical split in the 07-01 headers capture (stable, not transient). Live-verified 2026-07-06: / → max-age=63072000; /pricing and /auth → max-age=31536000; includeSubDomains; preload. The entry point most browsers hit first — and the URL the preload-list crawler checks — carries the weaker policy, so effective HSTS scope depends on first page visited. Prior report only said 'only HSTS present' without noting the inconsistency; not a duplicate.
- **Fix:** Serve one HSTS value site-wide (max-age=31536000; includeSubDomains; preload), including on / and the /docs subtree.

### 25. Free plan credit copy contradicts itself on /pricing: '+100 every week' in the hero vs 'Credits / month 100' in the comparison table
- **Severity:** Minor
- **Type:** Bug (content/pricing)
- **What & where:** `https://flick.art/pricing` — hero subhead vs FEATURES comparison table FREE column.
- **Evidence:** Fresh flick.deep.json /pricing text verbatim: 'Start free. Upgrade when you're ready. 300 credits to start + 100 every week TRY FOR FREE' and 'FEATURES FREE CASUAL STANDARD PRO STUDIO Credits / month 100 500 2,500 8,000 24,000+'. 100/week ≈ 430+/month, so the table understates the free allowance ~4x or mislabels the unit. The same mismatch existed unreported in the 07-01 capture, so it is not a duplicate of the now-fixed Studio credits contradiction.
- **Fix:** Make the FREE column consistent with the actual grant, e.g. '~430 / mo (100 weekly)', or relabel the row so the weekly allowance is not presented as a monthly figure.

### 26. Inconsistent card title casing on /compare: 'Veo 3 alternatives for AI filmmaking' (lowercase) amid title-case '* Alternatives' cards
- **Severity:** Minor
- **Type:** Suggestion (copy consistency)
- **What & where:** `https://flick.art/compare` — comparison card titles.
- **Evidence:** Fresh flick.deep.json /compare text verbatim: 'InVideo Alternatives ... Runway Alternatives ... Sora Alternatives ... Veo 3 alternatives for AI filmmaking'. Six sibling cards use title-case 'Alternatives'; the Veo 3 card alone uses lowercase. Present in the 07-01 capture too but absent from prior reports. Cosmetic.
- **Fix:** Retitle to 'Veo 3 Alternatives' to match siblings.

**Re-audit summary:** 17 of 20 prior findings still true (all majors except /auth persist); 1 changed (/auth now ships `x-robots-tag: noindex` — live-verified; residual head-hygiene contradictions drop it to Minor); 2 fixed (pricing Studio credits contradiction, /pricing empty-table-header); 7 new findings (3 major: 404 og:image/twitter:image on the shared shell, homepage-duplicate `<head>` on all non-blog routes, unlabeled /pricing credit slider; 4 minor: sitemap omits the blog subtree, inconsistent HSTS, Free-plan credit copy contradiction, /compare card casing).
