# QA Audit — Naive (usenaive.ai)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, structurally clean, and the most accessible site in the set — the real wins are two quick SEO fixes (social preview tags + a canonical) and one dead "Status" link.

**B. Issues (highest impact × ease first)**

### 1. Homepage has no social preview tags (Open Graph / Twitter Card)
- **Severity:** High
- **Type:** Suggestion (SEO/social)
- **What & where:** The homepage ships no Open Graph or Twitter Card meta — `og:*` and `twitter:*` are both empty. Every link shared on X, Slack, Discord, or HN renders as a bare URL with no title, description, or preview image. — `https://usenaive.ai/`
- **Evidence:** `meta.og` = `{}` and `meta.twitter` = `{}` on the homepage (naive.json). Note the interior solutions pages *do* have og/twitter tags, so the highest-traffic launch URL is the one missing them.
- **Fix:** Add `og:title`, `og:description`, `og:image`, and `twitter:card=summary_large_image` to the homepage `<head>`.

### 2. "Status" footer link 404s
- **Severity:** Medium
- **Type:** Bug (broken)
- **What & where:** The footer "Status" link points to `https://status.usenaive.ai/`, which does not resolve to a status page. — `https://usenaive.ai/` — footer link, `href="https://status.usenaive.ai/"`
- **Evidence:** Verified re-check returns HTTP 404 (107 bytes, `text/plain`) — naive.verified.json `firstPartyLinkFailuresReChecked`.
- **Fix:** Point it at a live status page or remove the link until one exists.

### 3. Missing SEO basics: no `<h1>` on /pricing, no canonical or robots meta
- **Severity:** Medium
- **Type:** Suggestion (SEO)
- **What & where:** The pricing page has no level-one heading (its top heading is an `<h2>` "Simple pricing"), and the homepage and pricing page both lack a `<link rel="canonical">` and a robots meta tag. — `https://usenaive.ai/pricing`, `https://usenaive.ai/`
- **Evidence:** Pricing `h1Count` = 0 and axe `page-has-heading-one` (moderate, 1 node, target `html`). `canonical` = null and `robotsMeta` = null on both home and pricing (naive.json).
- **Fix:** Promote the pricing page's top heading to an `<h1>` and add a self-referencing canonical tag site-wide.

### 4. Minor accessibility polish
- **Severity:** Low
- **Type:** Suggestion (a11y)
- **What & where:** Otherwise the cleanest a11y profile of the set. Three small items: (a) one heading-order jump on the homepage, (b) code-block regions on two solutions pages scroll horizontally but aren't keyboard-focusable, (c) /templates has a duplicate unlabeled `<nav>` landmark. — `https://usenaive.ai/`, `https://usenaive.ai/solutions/agent-native-cloud-infrastructure`, `https://usenaive.ai/solutions/agent-native-payments`, `https://usenaive.ai/templates`
- **Evidence:** Home axe `heading-order` (1 node — an `<h3>` "Cloud backend" following the `<h1>`). `scrollable-region-focusable` on cloud-infrastructure (3 `<pre>` nodes) and payments (1 `<pre>` node). /templates axe `landmark-unique` (1 node, `<nav class="flex flex-row...">`, target `.lg\:grid > .flex-row`). All from naive.json.
- **Fix:** Add `tabindex="0"` to the scrollable `<pre>` blocks, give the duplicate `<nav>` a unique `aria-label`, and correct the one heading-level skip.

_Performance note: nothing to flag. The homepage is ~43 KB of HTML with the largest JS chunk ~138 KB (compressed); the twelve heaviest first-party assets total ~0.9 MB. Load is not a concern._

**C. Founder-ready paragraph**
> I've been using Naive and really like what you're building — the config-file-per-agent model is the right shape for this. Two small things I noticed while poking around: the homepage doesn't have any Open Graph or Twitter Card tags, so links to usenaive.ai currently unfurl as a bare URL on X, Slack, and HN with no title or preview image (the interior solutions pages already have them, so it's just the main launch URL). The footer "Status" link also 404s right now, and the /pricing page is missing an `<h1>`. All quick fixes — happy to send over the full short list if it's useful.

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. /deploy demo cards have 84 nested-interactive violations (serious) — interior page never scanned in pass-1
- **Severity:** Medium
- **Type:** Bug (a11y)
- **What & where:** The `.group/card` deploy demo cards are clickable yet each wraps focusable descendants, producing nested-interactive controls that break keyboard and screen-reader navigation. — `https://usenaive.ai/deploy` — `.group/card` deploy demo cards (selector `.flex-1.min-h-0.flex:nth-child(1) > .h-full.duration-300.opacity-40 > ... > .group\/card...`)
- **Evidence:** naive.deep.json `pages['https://usenaive.ai/deploy'].axe`: rule `nested-interactive`, impact serious, count 84, help "Interactive controls must not be nested", node summary "Element has focusable descendants". The `.group/card` elements are clickable yet wrap focusable descendants. Page otherwise loads clean (h1Count 1). /deploy was NOT among the 8 pages axe-scanned in pass-1.
- **Fix:** Make each card either the sole interactive element or a plain container so no clickable element contains another focusable control.

### 2. /cli has no `<h1>` and a keyboard-inaccessible scrollable `<pre>` — interior page never scanned in pass-1
- **Severity:** Medium
- **Type:** Bug (a11y + SEO)
- **What & where:** The CLI page has no level-one heading (its headings start at `<h3>`) and its horizontally-scrollable `<pre>` block cannot be reached by keyboard. — `https://usenaive.ai/cli` — `page-has-heading-one` (target `html`) and `scrollable-region-focusable` (target `pre`)
- **Evidence:** naive.deep.json `pages['https://usenaive.ai/cli'].axe`: `page-has-heading-one` (moderate, count 1) and `scrollable-region-focusable` (serious, count 1, target `pre`); `data.h1Count`=0, `headingLevels`=[3,3,3,3], title "Naïve CLI | Install & onboard your agent". Extends pass-1's no-h1 finding (previously only /pricing) and the scrollable-`<pre>` finding (previously only solutions pages) to /cli, a page pass-1 never scanned.
- **Fix:** Promote the CLI page's top heading to an `<h1>` and add `tabindex="0"` to the horizontally-scrollable `<pre>` block.

### 3. Canonical tag missing on 13 of 14 crawlable pages — gap is site-wide, not just home + pricing
- **Severity:** Medium
- **Type:** Bug (SEO/canonical)
- **What & where:** Only /blog emits a `<link rel="canonical">`; every other crawled route ships none, so the gap flagged in pass-1 for home + pricing is effectively the whole site. — All crawled pages except /blog: /, /pricing, /cli, /enterprise, /deploy, /templates, /developers/primitives(+/ceo,/connections,/formation), /solutions/agent-native-{governance,cloud-infrastructure,payments} — `<link rel=canonical>`
- **Evidence:** naive.deep.json: `canonical`=null on all 13 non-blog crawled pages; only /blog has `canonical`='https://usenaive.ai/blog'. Extends pass-1 finding #3 (which named only home + pricing) — one page proves the template CAN emit it, so the gap is effectively site-wide.
- **Fix:** Add a self-referencing `<link rel=canonical>` to the shared head template so every route emits one.

### 4. No meaningful JSON-LD / structured data anywhere; the only block is a bare ['Blog'] stub
- **Severity:** Low
- **Type:** Suggestion (SEO/structured data)
- **What & where:** No page carries usable structured data — the sole JSON-LD block is a bare `@type` stub — so search engines get no Organization, Product, or breadcrumb signals. — All crawlable pages; sole JSON-LD is a stub on `https://usenaive.ai/blog`
- **Evidence:** naive.deep.json: `jsonldCount`=0 on all 13 non-blog pages; /blog `jsonldCount`=1 but its jsonld payload is exactly `["Blog"]` (bare @type stub, no Organization/Product/BreadcrumbList data). No Organization, WebSite, SoftwareApplication, or Product schema on the homepage or any solution/primitive page.
- **Fix:** Add an Organization + WebSite JSON-LD block site-wide and Product/SoftwareApplication schema on the solutions and primitives pages.

### 5. Open Graph & Twitter Card tags also missing on /cli, /enterprise and /pricing (not only the homepage)
- **Severity:** Low
- **Type:** Suggestion (SEO/social)
- **What & where:** Three interior pages join the homepage in shipping no social preview tags, so pass-1's "interior pages do have them" claim doesn't hold for these routes. — `https://usenaive.ai/cli`, `/enterprise`, `/pricing` — `<head>` `og:*` / `twitter:*` meta
- **Evidence:** naive.deep.json: `ogCount`=0 and `twitterCount`=0 on /cli, /enterprise, and /pricing (vs `ogCount`=2 `twitterCount`=3 on the solutions/primitives pages). Corrects/extends pass-1 finding #1, which stated interior pages "do have" og/twitter tags — these three interior pages do not.
- **Fix:** Extend the `og:`/`twitter:` head tags used on the solutions pages to /cli, /enterprise, and /pricing.

### 6. Homepage prose cards become keyboard-inaccessible scrollable regions at mobile viewport (mobile-only regression)
- **Severity:** Low
- **Type:** Bug (a11y, mobile-only)
- **What & where:** Two backdrop-blur prose card blocks overflow and gain a scrollbar only at mobile width, and that scrollable region isn't keyboard-reachable. — `https://usenaive.ai/` at 390px — `.z-10.relative:nth-child(3) > ... > .leading-\[1\.7\].text-white\/85.py-5` and `.gap-5.lg\:border-r.md\:px-10 > ... > .leading-\[1\.7\].text-white\/85.py-5`
- **Evidence:** naive.deep.json `mobileAxe['https://usenaive.ai/']` has `scrollable-region-focusable` (serious, count 2). Desktop `pages['https://usenaive.ai/'].axe` has ONLY `heading-order` (no scrollable-region), so these two backdrop-blur card blocks overflow and gain a scrollbar only at mobile width — distinct from the pass-1 desktop `<pre>` findings on solutions pages.
- **Fix:** Reflow these card blocks so content wraps at narrow widths, or add `tabindex="0"` so the scrollable region is keyboard-reachable on mobile.

### 7. Code-block toggles, Copy button, and top icon link fall under the 24px minimum tap target on mobile (solutions pages)
- **Severity:** Low
- **Type:** Bug (mobile UX / tap targets)
- **What & where:** Language toggles, the Copy button, and a 14×14px icon-only link render below the WCAG 2.5.8 (AA) 24×24 minimum hit area at mobile widths. — `https://usenaive.ai/solutions/agent-native-{cloud-infrastructure,payments,governance}` and `/` at 320/390/414px — `button.cursor-pointer.px-2.5.py-1.font-mono` (CLI/SDK/TypeScript/cURL), button "Copy", and a 14×14px icon-only `<a>`
- **Evidence:** naive.deep.json `responsiveExtra`: cloud-infrastructure & payments `tinyTapCount` 44(320)/49(390/414); governance 35/40/40; home 23/24/24. `tinyTapExamples` include `{tag:'a',text:'',w:14,h:14}`, `{tag:'button',text:'Copy',w:43,h:15}`, language toggles at h=23 ('CLI' w=38, 'SDK' w=38, 'TypeScript' w=80, 'cURL' w=44), and `{tag:'a',text:'View primitive→',w:120,h:20}` — all under the WCAG 2.5.8 (AA) 24×24 minimum. Home 320px tinyTaps are the desktop nav `a.link` items (h=20) collapsed behind the hamburger, so excluded. Not axe-flagged; measured at mobile widths only, so new vs pass-1.
- **Fix:** Give the code-block language toggles, the Copy button, and the 14×14 icon link a minimum 24×24px (ideally 44px) hit area via padding/min-height on small viewports.

### 8. Pricing page body drops the brand diaeresis: 'Naive Studio' vs 'Naïve Studio' everywhere else
- **Severity:** Low
- **Type:** Bug (copy/brand consistency)
- **What & where:** The pricing body copy renders the product name as plain "Naive Studio" while the same page's meta, title, and other body strings all use the diaeresis. — `https://usenaive.ai/pricing` — subheading under "Simple pricing" and the "Naive Studio · plans" toggle label
- **Evidence:** `pages['https://usenaive.ai/pricing'].data.text` contains the exact strings "Managed plans on Naive Studio. Pay-as-you-go on the Platform." and "Naive Studio · plans" (verified: "Naive Studio" appears twice). The SAME page's `metaDescription` reads "Pay-as-you-go on the Naïve Platform. Managed plans on Naïve Studio.", its title is "Pricing | Naïve", and its own body elsewhere uses the diaeresis ("Try Naïve free for 7 days", "Remove Naïve badge", "© 2026 Naïve, Inc") — all confirmed present. This pricing body copy is the only place the name renders as plain "Naive".
- **Fix:** Change both body occurrences of "Naive Studio" to "Naïve Studio" to match the page's own meta description, title, and site-wide branding.

### 9. Meta description exceeds the ~160-char SERP display limit on three pages (homepage 235 chars)
- **Severity:** Low
- **Type:** Suggestion (SEO/metadata)
- **What & where:** Three pages ship meta descriptions past the ~160-char SERP cutoff, so the snippet truncates mid-sentence in search results. — `https://usenaive.ai/` (235), `/templates` (179), `/enterprise` (178) — `<meta name=description>`
- **Evidence:** naive.deep.json `metaDescriptionLen`: / =235, /templates =179, /enterprise =178. Verified homepage description text "The AI-native cloud for apps and agents. All the infrastructure they need — ... — unified in one API and governed on every action." is 235 chars and will truncate mid-sentence in SERP snippets.
- **Fix:** Trim these descriptions to <=160 chars, front-loading the value proposition before the truncation point.

### 10. Marketing pages ship no security headers except a bare HSTS
- **Severity:** Low
- **Type:** Bug (Security headers)
- **What & where:** The marketing routes send only a bare HSTS header — no CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, or COOP. — `https://usenaive.ai/` and `/solutions/*`, `/templates`, `/pricing` — HTTP response headers
- **Evidence:** naive.headers.json: homepage `security.present` = only `{strict-transport-security: max-age=63072000}`, `security.missing` = [content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection]. Identical on /solutions/*, /templates, /pricing. Only the Mintlify-proxied /docs (308) carries CSP + x-frame-options:DENY. HSTS value also omits includeSubDomains/preload. Severity set to Low per marketing-site guidance (no user data flows through these pages).
- **Fix:** Add a baseline header set (CSP, X-Frame-Options, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy) via vercel.json / next.config `headers()` for all routes, and extend HSTS with includeSubDomains; preload.

### 11. Logged-out marketing pages load 11 third-party hosts / 371 tracker & ad requests, with no consent gate
- **Severity:** Low
- **Type:** Suggestion (Privacy/Performance — third-party trackers)
- **What & where:** Public, logged-out pages fire 371 third-party requests across 11 hosts — including DoubleClick retargeting and Clarity session recording — before any consent gate. — `https://usenaive.ai/` and interior pages — third-party network requests
- **Evidence:** naive.deep.json `thirdParty[]`: 11 distinct hosts, 371 total third-party requests (of `requestTotal` 1607). PostHog us-assets.i.posthog.com=95; Microsoft Clarity (i/www/scripts/c.clarity.ms)=33+19+19+10=81; Google ads googleads.g.doubleclick.net=37 + www.googleadservices.com=19 + ad.doubleclick.net=2 =58; GTM=41; www.google.com=68. No first-party cookies set (`cookies:[]` on every page in naive.headers.json) and no consent gate before these load.
- **Fix:** Consolidate to one analytics stack, drop or consent-gate the DoubleClick/AdServices retargeting pixels on the public marketing site, and lazy-load remaining scripts.

### 12. Three primitive-page `<title>` tags exceed 60 chars and will truncate in search results
- **Severity:** Polish
- **Type:** Suggestion (SEO/metadata)
- **What & where:** Three primitive pages have titles past ~60 chars, so Google drops the " | Naïve" brand suffix (and part of the descriptor) in results. — `https://usenaive.ai/developers/primitives/formation` (64), `/ceo` (62), `/connections` (62) — `<title>`
- **Evidence:** naive.deep.json `titleLen`: formation=64 (verified "Formation — Incorporate a real US company for your agent | Naïve"), ceo=62, connections=62 — all >60, so the " | Naïve" brand suffix (and part of the descriptor) is dropped in Google's ~60-char title display.
- **Fix:** Shorten these titles to <=60 chars, e.g. "Formation — Incorporate a US company for your agent | Naïve".
