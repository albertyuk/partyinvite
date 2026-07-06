# Multi-Agent Website Error Audit — Consolidated Report

> **Re-audit 2026-07-06 — status of this report.** Every finding below was re-verified against a
> full fresh capture (new pass-1 + deep crawl + headers on all 7 sites, plus new checks: sitemap
> URL sampling, canonical-target resolution, og:image/favicon resolution, `rel=noopener`,
> duplicate IDs). Verdict: **127 of the prior findings are still true — including all 4
> Criticals — 6 were fixed by the sites in the interim, 6 changed, and the re-audit surfaced 44
> new findings (9 Major, 35 Minor).** Per-finding status tables and the new findings live in each
> `audit-<company>.md` under "Re-audit (2026-07-06)"; fresh evidence in `evidence3/`.
>
> | Site | Prior re-verified | Still true | Fixed | Changed | New (2026-07-06) |
> |---|---|---|---|---|---|
> | flick.art | 20 | 17 | 2 | 1 | 7 (3 Major, 4 Minor) |
> | uplane.com | 22 | 21 | 0 | 1 | 9 (2 Major, 7 Minor) |
> | scalarfield.io | 17 | 15 | 0 | 2 | 5 (5 Minor) |
> | joindex.com | 13 | 13 | 0 | 0 | 3 (1 Major, 2 Minor) |
> | www.yondu.ai | 27 | 27 (incl. 3 Critical) | 0 | 0 | 10 (1 Major, 9 Minor) |
> | www.contrario.ai | 23 | 22 | 1 | 0 | 6 (6 Minor) |
> | usenaive.ai | 16 | 12 (incl. 1 Critical) | 2 | 2 | 4 (2 Major, 2 Minor) |
>
> **All 4 Criticals persist** (live-verified 2026-07-06): Yondu's 3 dead YC job links on
> `/careers` and Naive's dead `status.usenaive.ai` footer link.
>
> **What the sites fixed since 07-01/02:** Flick redesigned `/pricing` (the contradictory
> Studio-credits copy and the empty-table-header violations are gone — though the redesign
> introduced an unlabeled ARIA credit slider) and added an `x-robots-tag: noindex` header to
> `/auth` (the indexability core of that finding is fixed; the in-page meta still contradicts
> it). Naive redesigned `/deploy` and `/templates`, clearing two a11y findings and adding
> canonicals to the template pages (as relative URLs). Contrario's slow-TTFB observation
> resolved (0.63s median live). Nothing copy-related was fixed anywhere — every previously
> reported typo is still live.
>
> **Strongest new findings:**
> - **Naive — `sitemap.xml` lists all 223 URLs on the wrong domain**: `naive.ai` instead of
>   `usenaive.ai`; `naive.ai` is a placeholder deployment where deep URLs 404 (Major). A
>   template page also tells users to install a third-party npm package named `naive` and links
>   dead docs on that wrong domain (Major).
> - **Flick — `og:image`/`twitter:image` 404 on every non-blog route** (`/og-image.jpg`,
>   `/twitter-image.jpg`), and all non-blog routes serve a byte-identical homepage `<head>`
>   (per-page meta is JS-injected only), so scrapers see the homepage card with a broken image
>   for every marketing deep link (2 Major). The sitemap omits the blog — the only subtree with
>   correct SSR meta.
> - **Uplane — the footer "Careers" link now dead-ends** (useparallel.com slug resolves to
>   `/company/undefined`, Major); sitemap advertises a stale homepage draft (`/old/old-home-2`)
>   and a form-success page, both indexable (Major); footer says "© 2025"; the promoted "2027
>   AI Marketing Automation Playbook" is called "2026" on its own success page.
> - **Yondu — still promoting Automate 2026 as "upcoming" 11 days after the event ended**
>   (site-wide banner, Major); og:image missing on 8 of 13 pages; "© 2025" footer; more copy
>   errors in blog posts missed by pass 1.
> - **Dex — stale old-brand OG/Twitter meta site-wide with `og:url` hardcoded to the apex**
>   (Major); the privacy policy lives at a CMS-duplicate slug `/privacy-2` hardcoded in the ToS.
> - **Contrario — its Apollo.io visitor-tracking integration is broken on every page** (script
>   403 S3 AccessDenied + intent pixel 400); the book-a-demo dropdown misspells "Chat GPT".
> - **Scalar Field — "Open AI GPT-5.4"** brand misspelling on the agentic-ETFs listing; 33
>   `target=_blank` links without `rel=noopener`.

_Orchestrated audit, 2026-07-02. One subagent per site, run in parallel (batches of 4 + 3)._
_Method: each subagent audited from the two full capture passes taken 2026-07-01 (deep crawl of
12–15 pages/site ≈ 2 link-levels, all-links status checks, axe-core desktop + 375px mobile,
console/network capture, security headers, forms, full page text), then **live-re-verified every
Critical claim and every non-200 with throttled curl on 2026-07-02**. Read-only throughout: no
forms submitted, no logins, GET/HEAD only, robots.txt honored._

_Known false positives excluded by policy: social bot-blocks (LinkedIn 999/429, ProductHunt/
VentureBeat 403/429), Google GSI/FedCM console errors and ERR_CONNECTION_CLOSED from the headless
capture environment, expected logged-out 401s on auth endpoints, Next.js `_rsc` prefetch 404s where
the direct URL loads, and "missing favicon" where a `<link rel=icon>` or `/favicon.ico` exists.
Coverage limits (all sites): post-interaction console errors and 1280px-specific layout were not
captured (desktop = 1440px; mobile = 320/375/390/414px); cross-browser untested (Chromium-only
environment)._

## Summary table

| Site | #Critical | #Major | #Minor | Reachable |
|---|---|---|---|---|
| flick.art | 0 | 7 | 13 | Y (200) |
| uplane.com | 0 | 7 | 14 | Y (200) |
| scalarfield.io | 0 | 4 | 13 | Y (200) |
| joindex.com (advertised as getdexterity.com; 301 →) | 0 | 4 | 9 | Y (200) |
| www.yondu.ai | **3** | 7 | 12 | Y (200) |
| www.contrario.ai | 0 | 5 | 12 | Y (200) |
| usenaive.ai | **1** | 5 | 10 | Y (200) |
| **Total** | **4** | **39** | **83** | 7/7 |

## Cross-site patterns

1. **All 4 Criticals are dead links around careers/status pages** — link rot where startups change
   fastest: 3 removed YC job postings still linked from Yondu `/careers` (3 of the page's 4 job
   links are dead), and Naive's footer "Status" link points to a 404 subdomain. Uplane's careers
   page narrowly avoids the same bucket only because its nav points at the *misspelled but working*
   `/carrees` slug (the intuitive `/careers` 404s).
2. **Security/best-practice headers are missing on all 7 sites** — typically only HSTS is present;
   CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy absent.
   Scalar Field protects its `/docs` subsite (CSP + XFO DENY) but not its marketing pages.
3. **Low-contrast muted-gray text tokens fail WCAG AA at scale on all 7** — from 3.53:1 (Flick,
   11 pages) down to 1.95:1 (Dex use-case pages) and 2.92:1 across whole legal templates
   (Scalar Field, 57–64 nodes/page). One shared-token fix per site clears dozens of nodes.
4. **Copy/typo defects on 6 of 7 sites** — hero-level typos (Uplane "campagins", "Al era"),
   brand errors (Scalar Field "Backed by Combinator", Contrario "WISP FLOW"), wrong glyphs (Dex
   "@ 2026" for "© 2026" on all 12 pages), factual contradictions (Yondu's Automate 2026 listed in
   both Chicago and Detroit; Flick's pricing card saying both "20,000 credits" and "Unlimited"),
   and template copy-paste (Contrario's ToS section 6 is from the Privacy Policy).
5. **Core-meta duplication/thinness is the dominant SEO failure** — Uplane serves one 47-char
   description on all 11 pages and a 6-char title on 10; Yondu's homepage title is "Home" and all
   4 blog posts are titled "Blog Post"; Contrario reuses one description on 5 pages; Dex and Naive
   omit canonicals site-wide (Dex also robots.txt + sitemap.xml, on a freshly migrated domain);
   Yondu ships a **self-deindexing canonical** pointing at a URL that 404s.
6. **Empty links/buttons (axe link-name/button-name/label) on nearly every site** — logo and
   social icon links with no accessible name (Contrario ×13, Uplane ×4, Yondu logo site-wide),
   unlabeled controls (Scalar Field's strategy textarea + 2 buttons — critical; Flick's
   mobile-only hamburger), and Yondu's only lead form is placeholder-only on 3 pages.
7. **Autoplay hero media dominates page weight on the visual sites** — Flick ~36MB first-load
   (14.6MB video), Dex ~25MB (20MB video + 5MB PNG), Uplane 6.5MB video; none use lazy/poster
   patterns; fingerprinted assets ship with `max-age=0` (no immutable caching) on Flick and Dex.
8. **No structured data** — JSON-LD absent or near-absent on Dex (0/13), Contrario (0/15),
   Yondu (1/13), Uplane (0/12), Naive (stub only); heading hierarchies broken in both directions
   (pages with 0 `<h1>`: 8 on Contrario, 4 on Scalar Field legal, Uplane/Flick/Naive interior
   pages; pages with many: Uplane `/why-us` ×11, Contrario `/customers` ×13, Scalar Field docs 3–5).
9. **Sub-24px tap targets on every site at mobile widths** (WCAG 2.5.8): footer/nav links at
   15–23px heights, icon buttons down to 14×14.
10. **No shared broken CDN asset was found across sites** (independent stacks). The only
    cross-site third-party observation: heavy tracker volume without consent gates (Naive ~371
    tracker requests; Contrario ~2.6k requests across 24 hosts) and Yondu's own Apollo intent
    pixel returning HTTP 400 on every pageload.
11. **Framework fingerprints predict the defect profile** — Framer (Uplane, Contrario):
    link-name/landmark/contrast + duplicate meta; Webflow (Yondu): unlabeled forms + templated
    titles; Next.js/Vercel (Dex, Scalar Field, Naive): canonical/OG/robots gaps + soft-404s
    (Flick, SPA): client-routing returns 200 for unknown paths.

## Prioritized fix list (highest impact × lowest effort first, across all sites)

1. **Yondu — remove/repoint the 3 dead YC job links on `/careers`** (Critical; minutes; candidates currently hit 404s from the primary hiring CTA).
2. **Naive — fix or remove the footer "Status" link** (Critical; minutes; `status.usenaive.ai` → 404 from every solutions page).
3. **One-line copy fixes, all sites** (minutes each, disproportionate credibility impact): Uplane "campagins"→"campaigns" + "Al"→"AI" ×2 + "worklows"; Scalar Field "Backed by **Y** Combinator"; Yondu "Resillience", "humaniods"; Dex "@ 2026"→"© 2026" (shared footer); Contrario "Search experties", "WISP FLOW"; Flick pricing-card credits contradiction.
4. **Yondu — fix the self-deindexing canonical** on `/yondu-ai-at-automate-2026` (points at a 404) **and the Chicago-vs-Detroit event contradiction** (user-facing factual error about their own trade-show booth).
5. **Naive — add Open Graph/Twitter tags to `/`, `/pricing`, `/cli`, `/enterprise`** (the launch URL currently unfurls blank on X/Slack/Discord/HN).
6. **Uplane — rename `/carrees` → `/careers` with a 301** (dead intuitive URL + misspelled slug in the nav).
7. **Dex — collapse the desktop nav to a hamburger on mobile** (the fleet's only true layout break: 35–82px horizontal overflow at 320–414px, primary CTA clipped off-screen).
8. **Core-meta batch per site**: Yondu titles ("Home", 4× "Blog Post"); Uplane unique titles/descriptions (11-page duplicate); Contrario unique description ×5 + `/domains` title; Dex robots.txt + sitemap.xml + canonicals (new domain!); Naive canonicals (13/14 pages); Flick `/auth` noindex + locale-URL hreflang/canonical cleanup.
9. **Shared-component a11y blockers**: Contrario carousel `aria-hidden-focus` (5 pages) + 13 unnamed links; Scalar Field strategy-widget `button-name`/`label` (critical) + docs `aria-hidden-focus`; Flick mobile `button-name` (critical) + marquee focusables; Naive `/deploy` nested-interactive ×84; Yondu lead-form labels ×3 pages.
10. **Media weight**: Flick 14.6MB hero video (+4.8/2.9MB JPEGs → WebP/AVIF); Dex 20MB video + 5MB PNG; Uplane 6.5MB video — transcode, poster + lazy-load, and add `immutable` caching to fingerprinted assets.
11. **Contrast-token darkening per site** (single-token fixes clearing 20–74 nodes/page).
12. **Baseline security headers everywhere**; prune tracker volume (Naive, Contrario); fix Yondu's 400-ing Apollo pixel.

---

# Full per-site findings

## 1. Flick — https://flick.art/

Site: https://flick.art/
Reachable: Y (live HTTP 200 at 2026-07-02T01:49:58Z)
Pages audited: 15 — /, /pricing, /blog, /docs, /about, /careers, /projects?tab=explore, /auth, /compare, /tools, /residency, /creative-partners, /mit-ai-film-hackathon-with-flick, /privacy, /terms
Coverage notes: Two passes (key-page audit + 15-page deep crawl ≈ 2 link levels) with headers/security, forms, mobile axe, and 320/375/390/414/768/1440 viewports; live re-verification via curl today. Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env).

Critical:
None found. All 15 first-party pages return 200 (home live-verified 200); 0 pageErrors, 0 first-party network failures, 0 broken first-party or primary external links (46 pass-1 + 70 deep-crawl links checked; LinkedIn 999/429 and GSI/FedCM console lines are known environment/anti-bot artifacts, excluded).

Major:
[Major] — https://flick.art/ and /about — hero/media assets — Extreme first-load page weight: top-12 assets total ~36.3MB real compressed transfer — evidence: verified.json realKB: cdn.flick.art/cover-new2.mp4 autoplay hero = 14,650KB (live-verified 200, Content-Length 15,001,811 bytes), system/about.jpg 4,841KB, system/mimi.jpg 2,912KB, true.svg 1,765KB, ray.jpg 1,827KB; 79 requests on home — transcode/compress the hero video + lightweight poster, serve responsive WebP/AVIF, lazy-load below-the-fold media
[Major] — https://flick.art/* (any unknown path) — server routing — Soft-404: nonexistent URLs return HTTP 200 with the app shell instead of 404 — evidence: notFoundProbe status 200 (1,857B); live-verified 200 (5,058B text/html) on a fresh bogus path today — serve a real 404 status for unmatched routes (SPA shell with 404 header or edge rewrite)
[Major] — site-wide (11 of 15 pages) — muted gray text (FAQ labels, footer/nav links, e.g. `a[href$="pricing"]`, `.text-text-color-secondary`) — Text contrast fails WCAG AA: #8e8784 on #ffffff = 3.53:1 (needs 4.5:1) — evidence: axe color-contrast (serious): home 22 nodes, /pricing 35, /blog /about /careers /compare /tools /creative-partners /mit-hackathon /privacy /terms 20 each — darken the secondary text token to ~#6b6360 or darker
[Major] — https://flick.art/ (375px mobile only) — button `.hover\:bg-surface-hover` — Control has no accessible name; screen-reader users get an unlabeled button — evidence: mobileAxe button-name, impact=critical, 1 node (absent from desktop run) — add aria-label or sr-only text to the mobile button
[Major] — https://flick.art/ — `div.flex.items-center.shrink-0.gap-x-10...` marquee with aria-hidden="true" — Focusable content inside an aria-hidden container is reachable by keyboard but invisible to AT — evidence: axe aria-hidden-focus (serious), 1 node, both passes — add tabindex="-1" to focusables in the marquee or remove them from tab order
[Major] — https://flick.art/auth — `<meta name="robots">`, missing canonical, `<title>`/description — /auth is indexable with title+description byte-identical to the homepage and no canonical, contradicting robots.txt's own comment that /auth "carries noindex meta tags" — evidence: deep.json duplicates{} lists exactly this title+desc pair shared by / and /auth, canonical=null; live-verified today: `<meta name="robots" content="index, follow" />`, homepage title, 0 canonical — serve noindex,follow on /auth (as robots.txt promises) or unique title/desc + self-canonical
[Major] — https://flick.art/ja (and all sitemap locale URLs: /zh, /zh-TW, /ko, /fr, /de, …) — server-rendered `<head>` — Sitemap-declared locale pages serve byte-identical English homepage content with no hreflang, no canonical, `lang="en"`, og:url hardcoded to https://flick.art/ — duplicate content at scale — evidence: live-verified today: /ja 200, body byte-identical to / (both 5,058B), 0 hreflang, `<html lang="en"` — add per-locale SSR meta + reciprocal hreflang + self-canonicals, or drop locale URLs from sitemap.xml

Minor:
[Minor] — all HTML pages — HTTP response headers — Security hardening headers missing site-wide (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP); only HSTS present — evidence: headers.json security.missing ×6 pages — add via vercel.json/next config
[Minor] — https://flick.art/assets/index-BRXvC0ty.js, /ray.jpg, hero mp4 — Cache-Control — Content-fingerprinted JS bundle and images served with `public, max-age=0, must-revalidate` (mp4 only max-age=14400), forcing revalidation on every repeat visit — evidence: headers.json assets, immutable=false — use `max-age=31536000, immutable` for fingerprinted assets
[Minor] — /blog header nav + home/pricing/about footers — nav text links (h=16px) and 20x20px social icon links — Tap targets below the 24px WCAG 2.2 (2.5.8) floor — evidence: responsiveExtra tinyTapCount: blog 19-20, home 10-15, pricing 8-13, about 7-12 at 320/390/414px; overflowPx=0 everywhere — add min 24x24px (ideally 44px) tap areas via padding
[Minor] — https://flick.art/blog — `<head>` + headings — No `<h1>` (all h2s), no JSON-LD (every other page has 1-3 blocks), no robots meta, 12-char title "Blog — Flick" — evidence: deep.json h1Count=0, jsonldCount=0, robotsMeta=null; axe page-has-heading-one — add h1, Blog/CollectionPage JSON-LD, robots meta, longer title
[Minor] — home + 7 interior pages (/projects, /auth, /compare, /tools, /residency, /creative-partners, /mit-hackathon) — page template — No `<main>` landmark; content outside landmarks — evidence: axe landmark-one-main (moderate) ×8 pages, region up to 22 nodes (home) and 20 (/mit-hackathon) — wrap primary content in `<main>` in the shared template
[Minor] — https://flick.art/auth and /residency — page headings — No level-one heading — evidence: axe page-has-heading-one (moderate), h1Count=0 on both — add a single `<h1>` per page
[Minor] — https://flick.art/pricing and /about — heading outline — Hierarchy skips h1→h3 with no h2 — evidence: deep.json headingHierarchyOk=false, headingLevels [1,3,3,…]; axe heading-order on both — re-tag first sub-section headings as `<h2>`
[Minor] — https://flick.art/pricing — Studio plan card — Contradictory/duplicated credits copy: "20,000 credits / month … Unlimited customizable credits … 20,000 credits / mo" — evidence: verbatim in deep.json pricing page text — state one unambiguous credit amount
[Minor] — https://flick.art/creative-partners — title/H1 vs body — Program named both "Creative Partner Program" (title, H1) and "Creator Partner Program"/"Creator Partner Discord" (body, ×2) — evidence: verbatim in deep.json page text — pick one canonical name
[Minor] — https://flick.art/creative-partners — "WHAT WE EXPECT" section — "Youtube" and "Linkedin" miscapitalized (correct: YouTube, LinkedIn) — evidence: verbatim in deep.json page text — fix casing
[Minor] — https://flick.art/auth — login form email/password inputs — Both fields have empty `name` and empty `autocomplete` (labels present), breaking password managers/autofill — evidence: deep.json forms[] fieldCount=2, name:'' autocomplete:'' on both — add name attrs + autocomplete="username"/"current-password"
[Minor] — marketing pages — third-party scripts — Leftover cdn.gpteng.co dev/build tag (17 req) ships to production alongside GA (34), GTM (28), Rewardful (17) — evidence: deep.json thirdParty[] — remove the gpteng tag; defer/consolidate trackers
…plus 1 further minor item not in qa-audit/audit-flick.md (axe empty-table-header, minor, 4 nodes on /pricing comparison tables — give the empty `<th>` cells text or scope).

Counts: critical=0 major=7 minor=13

## 2. Uplane — https://uplane.com/

Site: https://uplane.com/
Reachable: Y (live HTTP 200 at 2026-07-02 01:47:57Z)
Pages audited: 12 — /, /blogs, /about-us, /carrees, /talk-to-us, /product, /why-us, /enterprise-software, /managed-growth, /privacy, /terms-of-service, /blogs/welcome-to-uplane
Coverage notes: Two passes: full crawl (14 first-party + 28 external links all status-checked), security headers, axe desktop+mobile, responsive 320/375/390/414/768/1440 — no overflow at any width; no pageErrors, no first-party request failures, no mixed content. Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env); axe could not execute on /carrees (Ashby embed) — that page's a11y needs manual review.

Critical:
None found.

Major:
[Major] — https://uplane.com/carrees — top-nav "Careers" link (`href="https://uplane.com/carrees"`) — careers page lives at a misspelled slug; the intuitive /careers URL is a dead end for anyone typing or sharing it (shared-link/SEO risk; no live link points to /careers, so not Critical) — live-verified: /carrees 200, /careers 404 at 01:48:00Z — rename route to /careers with a 301 from /carrees
[Major] — https://uplane.com/ (site-wide) — `<title>` and `<meta name="description">` — duplicate core meta: bare 6-char title "Uplane" on 10 pages and identical 47-char description "Next-gen performance marketing for your company" on all 11 first-party pages — deep.json duplicates{}: titles[0] 10 pages, descriptions[0] 11 pages — write unique descriptive title + 50–160-char description per page
[Major] — https://uplane.com/ — hero `HeroWebsiteOp.mp4` (autoplay) — 6.5MB video dominates page weight (~99% of top-pages transfer; HTML itself is only ~42KB compressed) — verified.json realKB=6538, status 200 — transcode/compress, add poster image and deferred/lazy playback
[Major] — https://uplane.com/ (all 12 pages) — logo links `.framer-1glm8x8`, `.framer-1j8w6qx`, X link `a[href$="uplane_com"]`, LinkedIn link — 4 links with no accessible name; screen readers announce only "link" — axe link-name (serious, 4 nodes) on every crawled page, desktop+mobile — add aria-label or visually hidden text to each
[Major] — https://uplane.com/talk-to-us — `iframe` (Fillout embed holding the site's only lead-capture form) — iframe has no title/aria-label, so the sole conversion path is unnamed for assistive tech — axe frame-title (serious, 1 node); deep.json formCount=0 on all pages (form exists only inside this iframe) — add `title="Contact / schedule a call"`
[Major] — https://uplane.com/managed-growth (recurs site-wide) — body/footer text styles — color-contrast failures at scale: serious axe hits on all 12 pages, worst 15 nodes on /managed-growth and 9 on /product; e.g. #2476ff on #f5f5f5 = 3.76:1, #8d929e on #ffffff = 3.11:1, mobile home 9 nodes vs 3 desktop — darken shared Framer text colors (blue + grey) to ≥4.5:1
[Major] — https://uplane.com/talk-to-us — hotlinked image from thumbnails.production.thenounproject.com (...1622F95A...jpg) — image request is refused, asset does not load in-browser — in-browser 403 captured in evidence (console + network), live-verified 403 (with referer) at 01:50:25Z — self-host the icon/image instead of hotlinking Noun Project's CDN

Minor:
[Minor] — https://uplane.com/ — hero subheadline — typo "campagins": "AI should run campagins, so that marketers can run marketing." — verified in deep.json page text — change to "campaigns"
[Minor] — https://uplane.com/ — body copy + H2 — "Al" (capital-A lowercase-L) twice: "win in the Al era" and "Al marketing automation for the entire funnel" (same page writes "AI" correctly 11 times) — verified in page text and headings — replace with "AI"
[Minor] — https://uplane.com/managed-growth — Timeline & Setup section — "Our worklows make onboarding possible…" plus broken sentence "we're ready to in Understand marketing objectives." — verified in page text — fix to "workflows" and rewrite the sentence
[Minor] — https://uplane.com/managed-growth — copy nits — "what messages drives results" (agreement), "end-2-end" vs "End-to-End" on same page, stray space in "your ads ." — verified in page text — normalize copy
[Minor] — https://uplane.com/why-us — headings — 11 `<h1>` elements (headingLevels [1×11,2,2]); /about-us has 2 — deep.json h1Count — keep one H1, demote section headings to H2/H3
[Minor] — https://uplane.com/blogs/welcome-to-uplane — article template — no H1 at all; first heading is an H3 (levels [3,3,3,3,3,2]) — h1Count=0; axe page-has-heading-one (moderate) — render post title as `<h1>`
[Minor] — https://uplane.com/blogs (+8 interior pages, and mobile home) — document structure — no `<main>` landmark; content outside landmarks (axe region 19–57 nodes/page) — axe landmark-one-main (moderate) on 9 pages — wrap primary content in `<main>`
[Minor] — https://uplane.com/talk-to-us — `span > a[target="_blank"]` — inline link indistinguishable from surrounding text: 2.07:1 vs body text, no underline — axe link-in-text-block (serious, 1 node) — underline the link or raise contrast to ≥3:1
[Minor] — https://uplane.com/ (also /blogs, /about-us) — mobile controls at 320–414px — visible tap targets under 24px: two "Details" links 45×15px, footer "Privacy Policy" 19px, cookie "Cookie's" button 16px (WCAG 2.2 2.5.8; heuristic, count inflated by hidden desktop-nav anchors) — pad to ≥24px (ideally 44px)
[Minor] — https://uplane.com/ (all HTML responses) — response headers — missing content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy; HSTS lacks includeSubDomains/preload — headers.json security.missing on all 6 measured pages — add CSP/XFO/Referrer-Policy/Permissions-Policy and extend HSTS
[Minor] — https://uplane.com/managed-growth (site-wide aggregate) — content images — 427 of 428 images have `alt=""`, including screenshots/diagrams/blog thumbnails (e.g. 103 imgs on /managed-growth) — deep.json imgEmptyAlt=427/imgTotal=428 — give content-bearing images meaningful alt text
[Minor] — https://uplane.com/carrees — page itself — axe scan errored on this page (Ashby job-board embed), and it lacks a canonical tag with thin own meta ("Uplane Jobs", 11-char description) — needs manual a11y review — re-test after fixing the slug; add canonical
…plus 2 further minor items in qa-audit/audit-uplane.md (no JSON-LD/structured data on any of the 12 pages; low-contrast Cookie Policy link 2.84:1 detail)

Counts: critical=0 major=7 minor=14

## 3. Scalar Field — https://scalarfield.io/

Site: https://scalarfield.io/
Reachable: Y (live HTTP 200 at 2026-07-02 01:48 UTC)
Pages audited: 15 — /, /docs, /pricing, /agentic-etfs, /ai-agentic-trading, /terms-of-use, /privacy, /cybersecurity-policy, /ai-disclosure, /docs/market-data/{options-quotes, equity-ohlcv, earnings, insider-trades, institutional-holdings}, www:/legal
Coverage notes: Deep crawl captured full data on 13/15 pages (/docs and www:/legal deep-pass nav failed as capture artifacts; /docs covered by headers pass and live-verified 200). Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env). Site is otherwise well-optimized: top-12 assets ~0.9MB real transfer, CLS 0.017, real 404s for bogus URLs, robots+sitemap present, all 41 first-party + 5 external links 200, no mixed content, no broken links, no JS crashes.

Critical:
None found.

Major:
[Major] — https://scalarfield.io/ — buttons `.group.p-2.rounded-md` and `button[aria-controls="radix-_r_7_"]`; strategy `textarea` — two buttons expose no accessible name and the "type your own strategy" textarea has no label (empty placeholder, no aria-label; forms[] confirms textarea and file input both `labeled:false`) — axe `button-name` (critical) ×2 + `label` (critical) ×1; live-verified 200 — add `aria-label`/visible text to each button and a label such as "Describe the strategy your agent should trade" to the textarea
[Major] — https://scalarfield.io/agentic-etfs — button `.p-1\.5`; `.text-quiet`/`.text-quietest` tokens — unlabeled icon button plus a large batch of low-contrast text (e.g. 2.07:1, #a8b4b5 on #fcfcf9, 12px) — axe `button-name` (critical) ×1 + `color-contrast` (serious) ×26; live-verified 200 — add `aria-label` to the icon button and darken the quiet-text tokens to 4.5:1
[Major] — https://scalarfield.io/docs/market-data/{options-quotes, equity-ohlcv, earnings, insider-trades, institutional-holdings} — `blockquote` — keyboard-focusable content sits inside an `aria-hidden` blockquote, so keyboard users tab into content hidden from screen readers — axe `aria-hidden-focus` (serious) ×1 on all 5 pages; options-quotes live-verified 200 — remove `aria-hidden` or set `tabindex="-1"` on the focusable descendant
[Major] — https://scalarfield.io/{terms-of-use, privacy, cybersecurity-policy, ai-disclosure} — legal-template body text (e.g. `.pt-0 > div:nth-child(2)`) — entire legal body copy renders at 2.92:1 contrast (#899a9d on #ffffff, 18px), failing WCAG AA at scale — axe `color-contrast` (serious): 64/59/60/57 nodes respectively; all four live-verified 200 — darken the muted body-text token to ~#5b6b6e or darker (4.5:1)

Minor:
[Minor] — https://scalarfield.io/ — hero credential badge — reads "Backed by Combinator", missing the "Y" (page itself links to the Y Combinator launch post) — change to "Backed by Y Combinator"
[Minor] — https://scalarfield.io/ — hero sub-paragraph — brand spelled one-word "ScalarField helps traders…" vs "Scalar Field" used 114× site-wide — normalize to "Scalar Field"
[Minor] — site-wide (home + 7 interior pages) — shared logo `<img>` (scalarfield-logo.png) — missing `alt` on every page; it is the only image on legal/ai-agentic-trading pages — add `alt="Scalar Field"` in the shared component
[Minor] — https://scalarfield.io/ — hero sub-headline `.text-muted` and `span[data-testid="react-typed"]` — contrast 2.95:1 and 1.98:1 vs 4.5:1 — darken muted token
[Minor] — https://scalarfield.io/{terms-of-use, privacy, cybersecurity-policy, ai-disclosure} — heading tree — zero headings of any level (h1Count=0, headingLevels=[]); axe `page-has-heading-one` ×4 — wrap doc titles in `<h1>`, sections in `<h2>/<h3>`
[Minor] — https://scalarfield.io/docs/market-data/* — multiple `<h1>` per page (3–5; e.g. insider-trades has 5: title + "Product Overview", "Querying the Data", etc.) — demote section headers to `<h2>/<h3>`
[Minor] — https://scalarfield.io/pricing and /agentic-etfs — heading sequence skips H1→H3 (pricing [1,3,3,3,2]; agentic-etfs [1,3×11]); axe `heading-order` ×1 each — promote first subsections to `<h2>`
[Minor] — 6 pages (/, /ai-agentic-trading, 4 docs/market-data pages) — meta descriptions 162–238 chars (home 190, insider-trades 238), past ~160-char SERP truncation — trim to ~150–160
[Minor] — https://scalarfield.io/ and /pricing — HTTP response headers — marketing pages send no CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy (framable), while /docs ships CSP `frame-ancestors` + X-Frame-Options DENY — mirror the docs header set in next.config.js/vercel.json
[Minor] — https://scalarfield.io/ (footer) and /pricing (inline links) — 12–15 tap targets below 24px at 320/390/414 (footer links h=16, one 14×14 button; no overflow, overflowPx=0) — add padding/min-height ≥24px on touch viewports
[Minor] — https://scalarfield.io/docs/market-data/* — `<head>` — no robots meta (null) and only inherited WebSite JSON-LD vs marketing pages' `index, follow` + 3–6 blocks — add robots meta + TechArticle/BreadcrumbList to docs template
[Minor] — https://scalarfield.io/pricing at 390px — muted price/label text — 9 mobile contrast failures vs 5 on desktop (4 mobile-only nodes at 2.92:1) — apply the darkened AA token to the mobile layout
…plus 1 further minor item in qa-audit/audit-scalarfield.md (missing `<main>` landmark / content outside landmark regions on home, pricing, and interior pages)

Counts: critical=0 major=4 minor=13

## 4. Dex — https://www.joindex.com/ (advertised as getdexterity.com; 301 → joindex.com)

Site: https://www.joindex.com/ (advertised as getdexterity.com; 301 → joindex.com)
Reachable: Y (live HTTP 200 at 2026-07-02T01:50:33Z)
Pages audited: 15 — /, /use-cases, /pricing, /blog, /privacy, /terms, /use-cases/{crm-update-from-calls, customer-followups, enrich-inbound-leads, renewal-tracker, weekly-digest, contract-diff, expense-reports, investor-update, inbox-triage}
Coverage notes: 13/15 pages yielded full SEO/axe/text data (/blog 307→/blog/topic/all-posts, /privacy served off-app; both resolve 200). Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env). Live re-verification 2026-07-02: getdexterity.com → 301 → https://www.joindex.com/ (1 hop, 200).

Critical:
None found. (All 44 discovered links resolve 200; zero console errors/page errors; zero first-party network failures across 104 requests; no mixed content; 404 probe returns proper 404.)

Major:
[Major] — https://www.joindex.com/ — header nav + `a.inline-flex.h-10.shrink-0` ("Join Dex" CTA) — desktop nav does not collapse on mobile, so the primary CTA is clipped off-screen and the page scrolls horizontally — at 375px scrollW=429 vs clientW=375 (54px overflow; CTA right edge at 431px), visually confirmed in evidence/dex/home-375.png; also 82px overflow at 320px, 47px at 390px, 35px at 414px (home only; interior pages clean) — collapse the nav to a hamburger below ~768px so links/CTA stack.
[Major] — https://www.joindex.com/ — /landing-page-2/meeting-prep.mp4 + /landing-page-2/hero-media.png — ~25MB of first-load media on the homepage — mp4 live-verified 200 content-length 20,609,231 bytes (~20MB); PNG live-verified 200 content-length 5,088,033 bytes (~4.97MB); top-12 real assets total 25.3MB (next-largest is a 323KB JS chunk) — transcode/compress the video and lazy-load it below the fold; convert the photo-like hero PNG to WebP/AVIF.
[Major] — https://www.joindex.com/robots.txt, /sitemap.xml, all routes — missing core indexing signals site-wide on a freshly migrated domain (getdexterity.com → joindex.com) — robots.txt live-verified 404 (returns HTML app-shell, content-type text/html), sitemap.xml live-verified 404, `<link rel="canonical">` null on 13/13 captured pages incl. /terms and all 9 use-case detail pages — add robots.txt + sitemap.xml and emit a self-referential canonical from the shared layout.
[Major] — site-wide (12 pages) — muted-gray text tokens (#b1b1b2/#a1a1a1/#8d8d8d/#737373 on #f4f4f6/#ffffff) — large-scale WCAG AA contrast failures — axe color-contrast (serious): home 27 nodes (26 on mobile viewport), /use-cases 74, /pricing 17 (down to 2.35:1), each of 9 use-case detail pages 11 nodes incl. `.md:text-sm` at 1.95:1, /terms 2 — darken the shared gray tokens to clear 4.5:1 against both backgrounds so the fix propagates.

Minor:
[Minor] — all 12 pages with footer — copyright line reads "ThirdLayer, Inc. @ 2026" using "@" instead of "©" ("©" absent from entire crawl) — replace with "©"/`&copy;` in the shared footer component.
[Minor] — all 13 captured pages — jsonldCount=0 everywhere (no Organization/SoftwareApplication/Article structured data) — add JSON-LD via the shared layout; og (10) and twitter (4) tags are already present.
[Minor] — https://www.joindex.com/ and /pricing — no `<main>` landmark (axe landmark-one-main, moderate) plus content outside landmarks (axe region: 3 nodes home, 4 on /pricing) — wrap primary content in `<main>` per route.
[Minor] — all pages — 7 security headers missing (content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, cross-origin-opener-policy, x-xss-protection); only HSTS present — add via next.config headers/vercel.json.
[Minor] — all pages, header nav — tap targets "Product"/"Pricing"/"Blog" are ~23px tall (3 tiny targets at 320/390/414, 3-4 at larger widths) vs 44px guideline — increase padding/hit area.
[Minor] — https://www.joindex.com/ — homepage testimonial contains double comparative "couldn't be more happier" — change to "couldn't be happier".
[Minor] — https://www.joindex.com/ — meeting-prep copy: "Afterwards, automatically send follow-ups using call notes, and writing tone." — subjectless sentence with dangling fragment — rewrite, e.g. "Afterwards, Dex automatically sends follow-ups using your call notes and writing tone."
[Minor] — https://www.joindex.com/pricing — `<title>` is only 13 chars ("Pricing | Dex") — expand to a descriptive, keyword-bearing title.
[Minor] — fonts (aeonikprovf*.woff2) and hero media — served with `cache-control: public, max-age=0, must-revalidate` (no immutable/long max-age, fonts also uncompressed-encoding) — add long-lived immutable caching for static fonts/media.

Counts: critical=0 major=4 minor=9

## 5. Yondu — https://www.yondu.ai/

Site: https://www.yondu.ai/
Reachable: Y (live HTTP 200 at 2026-07-02 01:52:46 UTC)
Pages audited: 13 — /, /about, /ourblog, /careers, /yondu-ai-at-automate-2026, /what-were-automating, /partner-with-us, /where-weve-been, /store, /blog-posts/{smb-3pls-dont-need-to-consolidate-they-need-robotic-labor, a-swan-lake-of-robotics, a-peek-behind-the-curtain-of-humanoid-manufacturing, state-of-data-centers}
Coverage notes: Evidence from 2026-07-01 crawls (desktop+375/768/1440 responsive, axe desktop+mobile, headers, deep link check) plus 8 live curl re-verifications today. Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env).

Critical:
[Critical] — https://www.yondu.ai/careers — "Open Positions" link → ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern — Primary careers CTA is dead (Robotics Software Intern posting removed) — deep.json links[] 404; live-verified 404 today — Remove or repoint to a live posting.
[Critical] — https://www.yondu.ai/careers — "Open Positions" link → ycombinator.com/companies/yondu/jobs/FjyrKhI-quarter-1-2026-robotics-hardware-intern — Primary careers CTA dead (Q1 2026 Robotics Hardware Intern) — deep.json links[] 404; live-verified 404 today — Remove or repoint.
[Critical] — https://www.yondu.ai/careers — "Open Positions" link → ycombinator.com/companies/yondu/jobs/boSSSw0-summer-2026-robotics-hardware-intern — Primary careers CTA dead (Summer 2026 Robotics Hardware Intern); only the Senior Robotics Engineer link (l6z04IP) still works (live 200) — deep.json links[] 404; live-verified 404 today — Remove or repoint; 3 of 4 job links on the page are dead.

Major:
[Major] — https://www.yondu.ai/yondu-ai-at-automate-2026 — `<link rel="canonical">` — Self-deindexing canonical: points to https://yondu.ai/automate, which 301s to www then 404s, telling search engines the authoritative version of this live page doesn't exist — deep.json data.canonical="https://yondu.ai/automate"; live-verified 404 today — Set canonical to the page's own URL (https://www.yondu.ai/yondu-ai-at-automate-2026) or 200-serve /automate.
[Major] — https://www.yondu.ai/yondu-ai-at-automate-2026 vs /where-weve-been — event location copy — Factual contradiction on Automate 2026 venue: Automate page says "AUTOMATE 2026 · CHICAGO, ILLINOIS / McCormick Place"; Where We've Been card says "Automate 2026 … 📍 Detroit, MI 🗓 June 22-25, 2026" (same event/dates, two cities) — deep.json page text, both strings confirmed — Correct the Where We've Been card to McCormick Place, Chicago.
[Major] — https://www.yondu.ai/ — `<title>` — Homepage title is literally "Home" (og:title/twitter:title too); no canonical on any page — deep.json title="Home", titleLen 4, canonical null on 12/13 pages — Use brand + value prop, e.g. "Yondu — Drop-in Warehouse Automation Robots", and add canonicals.
[Major] — https://www.yondu.ai/blog-posts/* (all 4) — `<title>`/meta description — All four blog posts share identical title "Blog Post" and identical description "Yondu AI Blog Post", despite distinct h1s — deep.json duplicates.titles/descriptions — Template title/description from each post's headline and excerpt.
[Major] — https://www.yondu.ai/ , /what-were-automating, /partner-with-us — contact form inputs name-2, Email-2, Company-2, Message — The site's only lead-capture form is placeholder-only on all 3 pages: every field labeled:false, no aria-label/labelledby, email field has no autocomplete — deep.json forms[] — Add `<label for>` (or aria-label) per field and autocomplete=name/email/organization.
[Major] — https://www.yondu.ai/sitemap.xml + /robots.txt — crawl config — sitemap.xml returns 404 and robots.txt is served but empty — live-verified today: sitemap 404, robots 200 (empty per evidence) — Publish a sitemap.xml and a minimal robots.txt referencing it (Webflow can auto-generate both).
[Major] — all 13 pages — Apollo intent pixel (https://aplo-evnt.com/api/v1/intent_pixel/track_request?app_id=6634504ae8fb0e0438e874af) — Site's own tracking integration returns HTTP 400 on every pageload, so visitor-intent data is silently lost and a console error fires site-wide — yondu.json console.errors + network.thirdPartyFailures — Fix the Apollo app_id/config or remove the pixel.

Minor:
[Minor] — https://www.yondu.ai/about — cultural pillars heading — Typo "Grit & Resillience" — deep.json page text — Change to "Resilience".
[Minor] — https://www.yondu.ai/partner-with-us — Teleoperation section — Typo "teleoperated humaniods" — deep.json page text — Change to "humanoids".
[Minor] — https://www.yondu.ai/blog-posts/state-of-data-centers — Inference vs Training section — Grammar break: "when you're measure TTFT" — deep.json page text — "when you're measuring TTFT".
[Minor] — https://www.yondu.ai/blog-posts/smb-3pls-dont-need-to-consolidate-they-need-robotic-labor — body copy — Missing negation contradicts the article's thesis: "The first automation wave that can truly help SMB 3PLs is a giant fixed system…" followed by "It is a flexible robotic labor that can be dropped into existing facilities" — deep.json page text — Insert "is not a giant fixed system"; drop the article before "labor".
[Minor] — https://www.yondu.ai/about — .horizontal-timeline — Scrollable region not keyboard-focusable (axe scrollable-region-focusable, serious; desktop + mobile scans) — deep.json axe — Add tabindex="0" and an accessible name.
[Minor] — https://www.yondu.ai/ and /about — Get In Touch / hello@yonduai.com / phone links — Tap targets only 22px tall at 320/390/414 widths (below WCAG 2.2 24px minimum) — deep.json responsiveExtra tinyTapCount 3 (home) + 2 (about) — Add padding/min-height ≥24px (ideally ~44px).
[Minor] — sitewide (11/13 pages) — .text-span-50, .button-9 et al. — axe color-contrast (serious): ratio 1.96 (#bba4d3 on #f3f0e5) — deep.json axe per page — Darken the light-purple text/buttons to meet AA.
[Minor] — sitewide (12/13 pages) — .nav-logo-link — Logo link has no accessible name (axe link-name, serious) — deep.json axe — Add aria-label="Yondu home".
[Minor] — https://www.yondu.ai/ — headings — 3 `<h1>` elements on the homepage (also 2 on /careers, /where-weve-been, /store) — deep.json h1Count — Keep a single h1 per page.
[Minor] — /blog-posts/a-peek-behind-the-curtain-of-humanoid-manufacturing and /state-of-data-centers — body headings — Heading levels skip (h1→h3→h5/h6; axe heading-order) — deep.json headingLevels — Re-tag sub-headings to h2/h3.
[Minor] — sitewide — structured data — JSON-LD on only 1 of 13 pages (Event on the Automate page); no Organization/WebSite/BlogPosting anywhere else — deep.json jsonldCount=0 on 12/13 — Add Organization+WebSite globally, BlogPosting on posts.
[Minor] — https://www.yondu.ai/ (all pages) — response headers — No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy (HSTS present; no mixed content found) — headers.json www headers — Add via Cloudflare/Webflow custom headers.
…plus 4 further minor items in qa-audit/audit-yondu.md (non-descriptive interior titles, over-length meta descriptions, missing `<main>` landmark on 12/13 pages, "bottle necks" spelling inconsistency)

Counts: critical=3 major=7 minor=12

## 6. Contrario — https://www.contrario.ai/

Site: https://www.contrario.ai/
Reachable: Y (live HTTP 200 at 2026-07-02T01:53:09Z; 3/3 samples 200)
Pages audited: 15 — /, /customers, /book-a-demo, /blogs, /careers, /domains, /companies, /recruiters, /referral, /privacy-policy, /terms-of-service, /faqs, /blogs/announcement/better-recruiting-built-on-contrario, /blogs/case-studies/listenlabs, /blogs/case-studies/gallium
Coverage notes: Two-pass audit (axe desktop+mobile, SEO/meta, headers, forms, 79 links checked, full page text) plus live curl re-verification today. Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env).

Critical:
None found. All pages 200; no JS crashes; prior non-200 externals (ProductHunt 403, LinkedIn 429/999, VentureBeat 429) are bot-blocks, not broken links.

Major:
[Major] — https://www.contrario.ai/ (also /customers, /book-a-demo, /domains, /companies) — `li[aria-hidden="true"]:nth-child(12)`–`:nth-child(16)` in the testimonial carousel — carousel clone slides are `aria-hidden="true"` yet contain focusable links, so keyboard users tab into content hidden from screen readers; the defect is in a shared component and ships on 5 pages — axe `aria-hidden-focus` (serious): 22 nodes on home and 22 on each of the 4 interior pages embedding the carousel — Add `tabindex="-1"` to (or remove from tab order) links inside the aria-hidden clones once in the shared carousel component.
[Major] — https://www.contrario.ai/ — `a.framer-auccsu[href="./"]` (header logo), customer-logo `<a>`s (e.g. `a[data-framer-name="Sieve"]`), footer social icon links — 13 links render only an image/icon with no accessible name, announced as empty "link" by screen readers — axe `link-name` (serious): 13 nodes on home; 2–3 nodes recur on every crawled page — Add `aria-label` or visually hidden text (e.g. `aria-label="Contrario home"`, the company name per logo link).
[Major] — https://www.contrario.ai/ (and blog footer sitewide) — muted grey text: customer names/roles, footer section labels (PRODUCT/COMPANY/CONNECT), copyright, "Systems Operational" — body text below WCAG AA 4.5:1 at scale — axe `color-contrast` (serious): 26 nodes on home (e.g. `#8d9097` on `#fafafa` = 3.06:1; `#70747d` on `#fafafa` = 4.48:1; footer `#5e5e5e` on `#191919` = 2.71:1); flagged on all 15 pages — Darken light-grey foregrounds / lighten dark-footer greys to ≥4.5:1.
[Major] — 8 pages incl. https://www.contrario.ai/book-a-demo, /referral, /privacy-policy, /terms-of-service, /faqs, all 3 blog posts; plus https://www.contrario.ai/customers — document heading structure — 8 pages ship zero `<h1>` (book-a-demo heading levels `[2,4,4,4,4]`; case studies start at h3), while /customers marks 13 elements as `<h1>` — 12 of them stat numbers ("10+", "90+ days", "100%"…) alongside "Customer Stories"; home also skips h2→h4 (axe `heading-order` ×3) — deep.json `h1Count` per page + axe `page-has-heading-one` on each of the 8 — Add exactly one descriptive `<h1>` per page; demote the 12 stat-number h1s on /customers to styled text; fix h4 skips on home.
[Major] — https://www.contrario.ai/domains (title) and /, /blogs, /domains, /referral, /blogs/announcement/better-recruiting-built-on-contrario (description) — `<title>` and `<meta name="description">` — /domains reuses the homepage title "Contrario | AI Recruiting Platform" verbatim, and one generic 136-char description ("Contrario is the AI Recruiting Platform powered by expert recruiters…") is served on 5 topically distinct pages including the blog index — deep.json `duplicates.titles`/`duplicates.descriptions` — Write a unique title for /domains (e.g. "Hiring Domains | Contrario") and a unique description per page.

Minor:
[Minor] — https://www.contrario.ai/terms-of-service — body section-6 heading — copy-paste from the Privacy Policy contradicts the page's own TOC: body reads "…6. California Privacy Rights 6.1 User Submissions Any content you post, upload, or share on or through Contrario (including resumes, referrals, job listings…)" while the TOC lists section 6 as "User Content and Licensing" — deep.json page text — Rename the heading to match TOC and subsections.
[Minor] — https://www.contrario.ai/terms-of-service — "On this page" sidebar — labeled "Privacy policy sections", a leftover from the Privacy Policy template — deep.json page text — Relabel to "Terms sections".
[Minor] — all HTML responses site-wide — response headers — missing content-security-policy, x-frame-options, referrer-policy, permissions-policy, cross-origin-opener-policy; HSTS present but without includeSubDomains/preload — headers.json `security.missing` identical on all 6 sampled pages; low risk (no auth/cookies on this marketing site) — Add at minimum CSP `frame-ancestors`/XFO and Referrer-Policy at the Framer/CDN layer.
[Minor] — https://www.contrario.ai/ — document TTFB — needs manual review — intermittent: prior capture showed 1,466 ms on home (other pages 426–520 ms), but live today TTFB = 0.599/0.628/0.655 s (median 0.63 s, live-verified 2026-07-02T01:53Z) — Monitor; likely CDN cold-start, not a steady-state problem.
[Minor] — site-wide — third-party scripts — 24 third-party hosts generating ~2,621 requests across the 15-page crawl (analytics/tracker volume) — deep.json `thirdParty`/`requestTotal` — Prune unused trackers to cut weight and privacy surface.
[Minor] — site-wide — page landmarks — no `<main>` element and large portions of content outside any landmark region — axe `landmark-one-main` (1 node) + `region` (30 nodes on home; flagged on all 15 pages) — Wrap primary content in `<main>` with semantic header/nav/footer.
[Minor] — https://www.contrario.ai/book-a-demo (also home) — `input.framer-form-input`, small text links — tap targets below the 24px WCAG 2.5.8 floor at mobile widths: form inputs only 20px tall; tinyTapCount 10/11/10 at 320/390/414px — deep.json `responsiveExtra` — Raise touch-target min-height to ≥24px (ideally ~44px).
[Minor] — https://www.contrario.ai/domains — anchor `href="https://gigaml.com/"` — genuinely dead outbound customer link: returns HTTP 404 serving Framer's "Site Not Found" page (live-verified 404 at 2026-07-02T01:53:32Z) — Update or remove the gigaml.com reference.
[Minor] — https://www.contrario.ai/privacy-policy — inline body links incl. `[href="mailto:founders@contrario.ai"]` — links distinguished by color alone (no underline) at 1.31:1–2.47:1 contrast vs surrounding text — axe `link-in-text-block` (serious), 6 nodes — Underline inline policy links or raise link-vs-text contrast to ≥3:1.
[Minor] — https://www.contrario.ai/book-a-demo and /referral — forms — 2 forms found, structurally sound: book-a-demo has 7 real labeled fields (email, first/last name, company, funding-size + referral-source selects, hiring-needs textarea, all required) + 11 unlabeled honeypots; referral has 9 real labeled fields + 11 honeypots. Defect: every real field has empty `autocomplete` (WCAG 1.3.5) — deep.json `forms[]` — Add `email`, `given-name`, `family-name`, `organization` tokens.
[Minor] — site-wide (all 15 pages) — structured data — zero `<script type="application/ld+json">` anywhere: no Organization, Article, or FAQPage markup — deep.json `jsonldCount==0` on every page — Add Organization schema sitewide, Article on posts, FAQPage on /faqs.
[Minor] — https://www.contrario.ai/companies and /blogs/case-studies/gallium — copy defects — typo "Search experties" in the LIVE CANDIDATES field placeholder; brand misspelled "WISP FLOW" in a mockup chip (spelled "Wispr Flow" in ~12 other mentions); Gallium team card says "Carlos Libardo Founding Data Engineer" while the same page's Impact section says "Carlos Eduardo Libardo, Founding AI Engineer" — deep.json page text — Fix spelling and reconcile name/title. No "lorem ipsum"/"TODO"/"coming soon"/"{{" placeholders found anywhere.
…plus 6 further minor items in qa-audit/audit-contrario.md (9 short un-branded titles, 204-char meta description, 62-char title, comp-figure "k" casing, blog title-case mismatch, dropped article in announcement post).

Counts: critical=0 major=5 minor=12

## 7. Naive — https://usenaive.ai/

Site: https://usenaive.ai/
Reachable: Y (live HTTP 200 at 2026-07-02 01:53 UTC)
Pages audited: 15 — /, /solutions/agent-native-{governance,cloud-infrastructure,payments}, /templates, /docs, /pricing, /blog, /developers/primitives(+/ceo,/connections,/formation), /cli, /enterprise, /deploy
Coverage notes: Two passes (Playwright crawl + curl re-verification) covering 148 links, axe desktop+mobile, headers, SEO, content text; no genuine console/JS errors or failed requests after excluding _rsc-prefetch and tracker-blocking artifacts; no mixed content; no layout overflow at 320/390/414px; formCount=0 site-wide (CLI-first signup — no forms to audit). Post-interaction console errors and 1280px-specific layout not captured (desktop = 1440px); cross-browser untested (Chromium-only env).

Critical:
[Critical] — https://usenaive.ai/ (also linked from all 3 /solutions/* pages) — footer link `<a href="https://status.usenaive.ai/">Status</a>` — Primary navigation "Status" link is dead: status.usenaive.ai returns 404 (107-byte text/plain) — harness 404, curl re-check 404, live-verified 404 at 01:53 UTC today — Point it at a live status page or remove the link until one exists.

Major:
[Major] — https://usenaive.ai/ (also /pricing, /cli, /enterprise) — `<head>` og:*/twitter:* meta — Homepage ships zero Open Graph and zero Twitter Card tags, so the main launch URL unfurls as a bare link (no title/image) on X, Slack, Discord, HN; /pricing, /cli, /enterprise also have ogCount=0/twitterCount=0 (solutions/primitives pages have partial tags, proving the template can emit them) — live-verified today: grep counts og=0, twitter=0 on / — Add og:title/description/image + twitter:card=summary_large_image to the shared head, prioritizing /.
[Major] — https://usenaive.ai/deploy — `.group/card` deploy demo cards — axe nested-interactive, impact serious, count 84: clickable cards each wrap focusable descendants, breaking keyboard/screen-reader navigation at scale — naive.deep.json axe ("Element has focusable descendants") — Make each card either the sole interactive element or a plain container.
[Major] — 13 of 14 crawlable pages (all except /blog) — `<link rel="canonical">` — Canonical tag missing site-wide; only /blog emits one (https://usenaive.ai/blog), risking duplicate-URL dilution — naive.deep.json canonical=null on all 13 — Add a self-referencing canonical in the shared head template.
[Major] — https://usenaive.ai/pricing and https://usenaive.ai/cli — page `<h1>` — No level-one heading on either page (/pricing tops out at `<h2>` "Simple pricing"; /cli headings start at h3) — axe page-has-heading-one, h1Count=0 on both — Promote each page's top heading to `<h1>`.
[Major] — https://usenaive.ai/cli, /solutions/agent-native-cloud-infrastructure (3 nodes), /solutions/agent-native-payments (1), and / at 390px mobile (2) — scrollable `<pre>`/prose-card regions — axe scrollable-region-focusable (serious): horizontally-scrollable code blocks and mobile prose cards are not keyboard-reachable — desktop + mobileAxe in naive.deep.json — Add `tabindex="0"` (or wrap content) so scrollable regions are focusable.

Minor:
[Minor] — https://usenaive.ai/ — hero grid card `<h3 class="font-medium ... text-lg">` — heading-order (moderate): h3 follows h1 directly, skipping h2 — home axe, 1 node — Fix the one heading-level skip.
[Minor] — https://usenaive.ai/templates — second `<nav>` in `.lg:grid` — landmark-unique (moderate): duplicate unlabeled nav landmark — axe, 1 node — Add a unique aria-label.
[Minor] — /solutions/* and / at 320–414px — code-block language toggles (h=23px), "Copy" button (43×15), 14×14 icon-only link — 23–49 tap targets per page under the WCAG 2.5.8 24×24 minimum — naive.deep.json responsiveExtra tinyTapCount 23/24 (home) up to 44/49 (solutions) — Give controls ≥24×24px hit areas on small viewports.
[Minor] — https://usenaive.ai/ (all marketing routes) — HTTP response headers — Only bare HSTS (max-age=63072000, no includeSubDomains/preload); missing CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP — naive.headers.json — Add a baseline header set via next.config `headers()`/vercel.json.
[Minor] — site-wide (logged-out pages) — third-party scripts — 371 tracker/ad requests across 11 hosts with no consent gate: PostHog 95, Clarity 81, Google ads/DoubleClick 58, GTM 41, google.com 68 — naive.deep.json thirdParty[] (of 1607 total requests) — Consolidate analytics and consent-gate/drop retargeting pixels.
[Minor] — all crawled pages — `<meta name="robots">` — robots meta absent everywhere (robots.txt and sitemap.xml are present and fine) — naive.deep.json robotsMeta=null ×14 — Optional: emit explicit robots meta via Next metadata for intentionality.
[Minor] — site-wide — JSON-LD structured data — No usable structured data; sole block is a bare `["Blog"]` stub on /blog (jsonldCount=0 elsewhere) — naive.deep.json — Add Organization/WebSite schema site-wide, Product/SoftwareApplication on solutions/primitives.
[Minor] — https://usenaive.ai/pricing — body copy: "Managed plans on Naive Studio…" and "Naive Studio · plans" — Brand name drops the diaeresis twice in body copy while the same page's title ("Pricing | Naïve"), meta description, and other body strings use "Naïve" — inconsistent within one page (naive.deep.json page text) — Change both to "Naïve Studio".
[Minor] — https://usenaive.ai/ (235 chars), /templates (179), /enterprise (178) — `<meta name="description">` — Meta descriptions exceed the ~160-char SERP display limit and truncate mid-sentence — naive.deep.json metaDescriptionLen — Trim to ≤160 chars.
[Minor] — /developers/primitives/formation (64), /ceo (62), /connections (62) — `<title>` — Titles exceed ~60 chars so the " | Naïve" suffix truncates in Google results — naive.deep.json titleLen — Shorten to ≤60 chars.

Counts: critical=1 major=5 minor=10
