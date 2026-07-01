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
