# QA Audit — Scalar Field (scalarfield.io)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, well-optimized site (light JS, negligible layout shift); the main opportunities are a handful of accessibility fixes, most of them quick.

**B. Issues (highest impact × ease first)**

### 1. Unlabeled buttons and one unlabeled input block screen-reader / keyboard users
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** Two buttons expose no accessible name and one form field has no programmatic label on the home page — `https://scalarfield.io/` — buttons `.group.p-2.rounded-md` and `button[aria-controls="radix-_r_7_"]`; input `textarea` (the "type your own" strategy box).
- **Evidence:** axe `button-name` (critical) × 2; axe `label` (critical) × 1. The textarea has an empty `placeholder=""` and no `<label>`/`aria-label`/`aria-labelledby`.
- **Fix:** Add an `aria-label` (or visible text) to each button and a `<label>` or `aria-label` on the textarea (e.g. "Describe the strategy your agent should trade").

### 2. Low-contrast text on the home hero
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** Two text elements fall below WCAG AA contrast — `https://scalarfield.io/` — the sub-headline `.text-xl.font-normal.text-muted` ("Your agentic trading desk, from research to live execution.") and the animated strategy line `span[data-testid="react-typed"] > span`.
- **Evidence:** axe `color-contrast` (serious) × 2 — measured ratios 2.95 (#89999d on #fff) and 1.98 (#b8b8b8 on #fff) against the 4.5:1 minimum.
- **Fix:** Darken the muted text color so both meet 4.5:1 (roughly #5b6b6e or darker on white).

### 3. No `<main>` landmark; most content sits outside landmarks
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** The document has no main landmark and page content is not wrapped in landmark regions — `https://scalarfield.io/` (same pattern repeats on `/pricing`).
- **Evidence:** axe `landmark-one-main` (moderate) × 1; axe `region` (moderate) × 20 (nav items, logo, `h1`, etc.).
- **Fix:** Wrap the primary content in a `<main>` element and put the header nav in `<header>`/`<nav>`; this clears most of the region violations at once.

### 4. One image missing an alt attribute
- **Severity:** Low
- **Type:** Suggestion (a11y)
- **What & where:** The Scalar Field logo image has no `alt` — `https://scalarfield.io/` — `https://d32mg6h25qsrpf.cloudfront.net/general_assets/scalarfield-logo.png`.
- **Evidence:** Home DOM: `imgMissingAltCount` = 1 (only this image; all other images have alt text).
- **Fix:** Add `alt="Scalar Field"` (or `alt=""` if treated as decorative alongside the wordmark).

**Positive signals:** The site is well-optimized — the heaviest JS chunk is ~331 KB compressed (the top 12 assets total ~0.9 MB real transfer), layout shift is negligible (CLS 0.017), and load is fast. Favicon resolves (`/favicon.ico` 200 with a `<link>`), `robots.txt` and `sitemap.xml` are present, 404s return a real 404, and every first-party link checked returned 200.

**C. Founder-ready paragraph**
> I've been using Scalar Field and really like where it's headed — the sub-300ms tick-to-trade framing and the one-line "type your own strategy" box are genuinely fun to play with. Poking around the marketing site with an accessibility checker, I noticed a couple of quick things: a few buttons and the "type your own" strategy textarea don't expose a name to screen readers, and the muted grey hero text on the home page falls below the WCAG contrast minimum (measured around 2.9:1 vs the 4.5:1 target). Adding a `<main>` landmark would also clean up a batch of related warnings in one shot. None of it is breaking anything — the site's fast and the rest looks solid — but they're small edits that make it friendlier for keyboard and screen-reader users. Happy to send over the full list if it's useful.

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

### 1. Home hero credential badge misspells the accelerator as "Backed by Combinator" (missing "Y")
- **Severity:** Medium
- **Type:** Bug (copy/branding)
- **What & where:** The home hero credential badge reads "Backed by Combinator" instead of "Backed by Y Combinator" — `https://scalarfield.io/`, home hero, visible string "Ultra Backed by Combinator One platform."
- **Evidence:** `scalarfield.deep.json` `pages['/'].data.text` contains the exact string "Backed by Combinator"; the phrase "Y Combinator" appears nowhere in any page's visible text (0 occurrences), yet the same page links to the YC launch page (`evidence/scalarfield.json` `links[21].url` = `https://www.ycombinator.com/launches/NSw-scalar-field-reinventing-the-trading-terminal-...`). The accelerator is Y Combinator, so the badge drops the "Y".
- **Fix:** Change the badge to "Backed by Y Combinator".

### 2. Legal-page template renders the full body copy below WCAG AA contrast (serious, 4 pages)
- **Severity:** Medium
- **Type:** Bug (a11y / interior pages)
- **What & where:** The muted body-text token on the legal template renders the whole document below AA contrast — `https://scalarfield.io/terms-of-use`, `/privacy`, `/cybersecurity-policy`, `/ai-disclosure` — e.g. `.pt-0 > div:nth-child(2)`.
- **Evidence:** `scalarfield.deep.json` axe `color-contrast` (serious): terms-of-use 64 nodes, privacy 59, cybersecurity-policy 60, ai-disclosure 57 — measured ratio 2.92, foreground `#899a9d` on `#ffffff`, 18px normal. This is the whole legal body copy, on interior pages not audited in pass-1 (pass-1 measured only the home hero, ×2). Same muted token family as the home hero.
- **Fix:** Darken the muted body-text token on the legal template to reach 4.5:1 on white (~`#5b6b6e` or darker).

### 3. Focusable content inside an aria-hidden blockquote on every docs/market-data page
- **Severity:** Medium
- **Type:** Bug (a11y / docs)
- **What & where:** Focusable content lives inside an `aria-hidden` blockquote — `https://scalarfield.io/docs/market-data/{options-quotes,equity-ohlcv,earnings,insider-trades,institutional-holdings}` — selector `blockquote`.
- **Evidence:** `scalarfield.deep.json` axe `aria-hidden-focus` (serious) ×1 on all 5 docs/market-data pages: "Focusable content should have tabindex=\"-1\" or be removed from the DOM" — keyboard users can tab into content hidden from screen readers. Rule ID absent from pass-1.
- **Fix:** Remove `aria-hidden` from the blockquote or set `tabindex="-1"` on the focusable descendant.

### 4. agentic-etfs page: large batch of low-contrast text plus an unlabeled icon button
- **Severity:** Medium
- **Type:** Bug (a11y / interior pages)
- **What & where:** The agentic-etfs page combines a large batch of low-contrast text with an unlabeled icon button — `https://scalarfield.io/agentic-etfs` — contrast on `.text-quietest`/`.text-quiet` tokens; button `.p-1\.5`.
- **Evidence:** `scalarfield.deep.json` axe `color-contrast` (serious) ×26 (e.g. ratio 2.07, `#a8b4b5` on `#fcfcf9`, 12px) and `button-name` (critical) ×1 on target `.p-1\.5` ("Element does not have inner text… aria-label… does not exist or is empty"). New interior page not in pass-1; extends the pass-1 home button-name/contrast pattern.
- **Fix:** Darken the `text-quiet`/`text-quietest` tokens to 4.5:1 and add an `aria-label` (or visible text) to the `.p-1.5` icon button.

### 5. Four legal pages have zero headings and no H1
- **Severity:** Medium
- **Type:** Bug (SEO + a11y / heading structure)
- **What & where:** Each legal page renders with no headings at all — `https://scalarfield.io/terms-of-use`, `/privacy`, `/cybersecurity-policy`, `/ai-disclosure` — document heading tree.
- **Evidence:** `scalarfield.deep.json`: each of the 4 legal pages has `data.h1Count=0` and `data.headingLevels=[]` (no headings of any level), while titles are set (e.g. "Terms of Use | ScalarField"). axe `page-has-heading-one` (moderate) ×1 fires on all four. New — these interior pages were not in pass-1.
- **Fix:** Wrap each legal document's title in a single `<h1>` and mark section titles as `<h2>`/`<h3>`.

### 6. Marketing pages ship no X-Frame-Options / CSP frame-ancestors, X-Content-Type-Options, Referrer-Policy or Permissions-Policy (framable)
- **Severity:** Low
- **Type:** Bug (security headers)
- **What & where:** The marketing pages send no framing/best-practice security headers — `https://scalarfield.io/` and `/pricing` (Vercel/Next.js HTML). Contrast with `/docs` (Mintlify).
- **Evidence:** `scalarfield.headers.json` `pages['/'].security.missing` = [content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, x-xss-protection]; identical on `/pricing`. `present[]` only = strict-transport-security + cross-origin-opener-policy. By contrast `/docs` `present[]` includes content-security-policy (frame-ancestors 'self'…) and x-frame-options: DENY, proving the org sets frame protection on docs but not the marketing pages, which are therefore embeddable in a hostile iframe. New (pass-1 was a11y only). Severity downgraded to Low per marketing-site rubric.
- **Fix:** Add a security-headers block in `next.config.js` / `vercel.json` for the marketing app: x-content-type-options: nosniff, x-frame-options: DENY (or CSP frame-ancestors 'self'), referrer-policy, a Permissions-Policy, and a baseline CSP — mirroring the `/docs` subsite.

### 7. Docs/market-data pages emit multiple `<h1>` tags (section headers marked H1)
- **Severity:** Low
- **Type:** Bug (SEO / heading structure)
- **What & where:** Section headers are marked as `<h1>`, so each page emits several — `https://scalarfield.io/docs/market-data/{insider-trades,options-quotes,equity-ohlcv,earnings,institutional-holdings}` — `<h1>` section headings.
- **Evidence:** `scalarfield.deep.json`: insider-trades `h1Count=5` (h1=['Corporate Insider Transactions','Product Overview','Querying the Data','Column Definitions','Filtering Reference']); options-quotes/equity-ohlcv/institutional-holdings=4; earnings=3. Every /docs/market-data/* page has 3-5 H1s instead of one. New (docs not in pass-1).
- **Fix:** Demote in-page section headers (Product Overview, Querying the Data, etc.) from `<h1>` to `<h2>`/`<h3>` so each page has a single top-level H1.

### 8. Heading level skips from H1 straight to H3 on /pricing and /agentic-etfs
- **Severity:** Low
- **Type:** Bug (SEO + a11y / heading order)
- **What & where:** The heading sequence jumps H1→H3 with no intervening H2 — `https://scalarfield.io/pricing` and `/agentic-etfs` — heading sequence.
- **Evidence:** `scalarfield.deep.json`: `/pricing` `headingLevels=[1,3,3,3,2]`, `/agentic-etfs`=[1,3,3,3,3,3,3,3,3,3,3,3]; both `headingHierarchyOk=false`. axe `heading-order` (moderate) ×1 on each. Jumps H1→H3 with no intervening H2. New.
- **Fix:** Change the first subsection headings on these pages from `<h3>` to `<h2>` (or insert the missing H2).

### 9. Footer/legal links and a 14px control are sub-24px tap targets on narrow phones
- **Severity:** Low
- **Type:** Bug (mobile UX / touch targets)
- **What & where:** Footer/legal and inline links fall below the 24px touch-target minimum on narrow phones — `https://scalarfield.io/` (footer link cluster) and `/pricing` (inline data-source & nav links).
- **Evidence:** `scalarfield.deep.json` `responsiveExtra`: home `tinyTapCount=12` identically at 320/390/414 — footer links measure h=16 (Docs 31×16, Discord 47×16, Terms of Service 108×16) and one button is 14×14; pricing `tinyTapCount=14` at 320 and 15 at 390/414 (Options data 74×16, FRED 30×16). All `overflowPx=0`, so this is target size (below WCAG 2.5.8 24px), not layout overflow. New — pass-1 was desktop only.
- **Fix:** Increase tappable area of footer/legal and pricing inline links (and the 14px icon button) to ≥24×24px on touch viewports via vertical padding/min-height.

### 10. Meta descriptions exceed ~160 chars on six pages (SERP truncation)
- **Severity:** Low
- **Type:** Suggestion (SEO / metadata)
- **What & where:** Six pages carry meta descriptions past the SERP truncation limit — `https://scalarfield.io/` (190), `/ai-agentic-trading` (162), `/docs/market-data/options-quotes` (206), `/docs/market-data/equity-ohlcv` (167), `/docs/market-data/insider-trades` (238), `/docs/market-data/institutional-holdings` (215).
- **Evidence:** `scalarfield.deep.json` `metaDescriptionLen` matches each cited value; all above the ~160-char SERP limit. Homepage string: "ScalarField is an AI agentic trading desk for market research, backtesting, brokerage-connected trading agents, and execution across equities, options, prediction markets, and pre-IPO names." New — no homepage SEO metadata finding in pass-1.
- **Fix:** Trim each description to ~150-160 characters.

### 11. Docs/market-data pages carry no robots meta and only inherited WebSite JSON-LD
- **Severity:** Low
- **Type:** Suggestion (SEO / structured data)
- **What & where:** The docs template exposes no robots meta and only inherited site-level structured data — `https://scalarfield.io/docs/market-data/*` (all five) — `<head>` robots meta and JSON-LD.
- **Evidence:** `scalarfield.deep.json`: every /docs/market-data/* page has `robotsMeta=null` and `jsonld=['WebSite']` (`jsonldCount=1`) — no TechArticle/Article/BreadcrumbList — whereas marketing pages carry `robotsMeta='index, follow'` and 3-6 JSON-LD blocks. New.
- **Fix:** Add an explicit robots meta and TechArticle + BreadcrumbList JSON-LD to the docs template.

### 12. Logo image missing alt is site-wide, not just the homepage
- **Severity:** Low
- **Type:** Suggestion (a11y / SEO) — extends pass-1 #4
- **What & where:** The shared logo `<img>` is missing its `alt` on every interior page, not just home — `https://scalarfield.io/pricing`, `/agentic-etfs`, `/ai-agentic-trading`, `/terms-of-use`, `/privacy`, `/cybersecurity-policy`, `/ai-disclosure` — the shared logo `<img>`.
- **Evidence:** `scalarfield.deep.json` `data.imgMissingAlt`: pricing 1/31, agentic-etfs 1/12, ai-agentic-trading and all four legal pages 1/1 (their only image is the logo, no alt). Extends pass-1 finding #4 (home logo alt) with the new detail that it repeats on every interior page.
- **Fix:** Add `alt="Scalar Field"` to the shared logo component so all pages are fixed at once.

### 13. Pricing page surfaces extra color-contrast failures only at the mobile viewport
- **Severity:** Low
- **Type:** Bug (a11y / mobile-only)
- **What & where:** Extra low-contrast text nodes appear only in the mobile pricing layout — `https://scalarfield.io/pricing` at 390px — extra muted price/label text nodes.
- **Evidence:** `scalarfield.deep.json` `mobileAxe['/pricing']` `color-contrast` (serious) ×9 vs desktop axe ×5 on the same URL — 4 additional low-contrast nodes appear only at mobile (ratio 2.92, `#899a9d` on `#ffffff`). Same muted-token root cause; pass-1 audited desktop only.
- **Fix:** Ensure the muted price/label text in the mobile layout uses the same darkened AA-compliant token.

### 14. Brand written as one word "ScalarField" in the home hero, inconsistent with "Scalar Field" everywhere else
- **Severity:** Low
- **Type:** Bug (branding consistency)
- **What & where:** The home hero sub-paragraph spells the brand as one word — `https://scalarfield.io/` — home hero sub-paragraph beginning "ScalarField helps traders turn market ideas into AI agents…".
- **Evidence:** `scalarfield.deep.json` `pages['/'].data.text` contains exactly "ScalarField helps traders turn market ideas into AI agents that analyze data". Across all pages the capitalized one-word "ScalarField" occurs once, versus 114 occurrences of two-word "Scalar Field" (legal entity is "Scalar Field, Inc."). New.
- **Fix:** Change "ScalarField helps traders…" to "Scalar Field helps traders…".

## Re-audit (2026-07-06)
_Full fresh capture 2026-07-06; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

**Prior findings — status:**

| Finding | Severity | Status | Note |
|---|---|---|---|
| home button-name x2 + strategy textarea label | Major | STILL_TRUE | Fresh deep axe (2026-07-06): button-name (critical) count=2 on same targets `.group.p-2.rounded-md` and `button[aria-controls="radix-_r_7_"]`; label (critical) count=1 on textarea (no implicit/explicit label, empty aria-label). forms[] still shows textarea and file input labeled:false. evidence2/scalarfield.deep.json pages['https://scalarfield.io/'].axe |
| agentic-etfs unlabeled icon button + color-contrast x26 | Major | STILL_TRUE | Fresh deep axe: button-name (critical) count=1 on `.p-1\.5` and color-contrast (serious) count=26 with identical sample (ratio 2.07, #a8b4b5 on #fcfcf9, 12px, .text-quietest tokens). evidence2/scalarfield.deep.json pages['/agentic-etfs'] |
| docs/market-data aria-hidden-focus blockquote x5 pages | Major | STILL_TRUE | Fresh deep axe: aria-hidden-focus (serious) count=1 on target ['blockquote'] on all 5 pages (options-quotes, equity-ohlcv, earnings, insider-trades, institutional-holdings) — "Focusable content should have tabindex=\"-1\" or be removed from the DOM". Pages loaded and axe ran (implies 200). |
| legal-template body contrast 64/59/60/57 nodes at 2.92:1 | Major | STILL_TRUE | Fresh deep axe color-contrast (serious) counts identical to prior: terms-of-use 64, privacy 59, cybersecurity-policy 60, ai-disclosure 57; same measurement (2.92, #899a9d on #ffffff, 18px, `.pt-0 > div:nth-child(2)`). extras.json sampled terms-of-use and cybersecurity-policy live 200. |
| hero badge "Backed by Combinator" missing Y | Minor | STILL_TRUE | diff.json copyStrings: "Backed by Combinator" wasPresent:true stillPresent:true; fresh home text contains "Ultra Backed by Combinator One platform"; "Y Combinator" still occurs 0 times in visible text across all 13 captured pages. |
| one-word "ScalarField helps traders" brand inconsistency | Minor | STILL_TRUE | diff.json copyStrings: "ScalarField helps traders" stillPresent:true; fresh visible-text counts: one-word "ScalarField" 1 occurrence vs two-word "Scalar Field" 114 occurrences — identical to prior. |
| shared logo img missing alt site-wide (home + 7 interior) | Minor | CHANGED | Home instance is fixed: fresh pass-1 home imgMissingAltCount=0/80 (old pass-1 was 1/81 listing scalarfield-logo.png); but the 7 interior pages still miss it — fresh deep imgMissingAlt: pricing 1/31 (pass-1 confirms it is d32mg6h25qsrpf.cloudfront.net/general_assets/scalarfield-logo.png), agentic-etfs 1/12, ai-agentic-trading 1/1, and all four legal pages 1/1. Scope narrowed from 8 pages to 7. |
| home hero sub-headline + react-typed contrast 2.95/1.98 | Minor | STILL_TRUE | Fresh home axe color-contrast (serious) count=2, identical targets and ratios: `.text-xl.font-normal.text-muted` at 2.95 (#89999d on #ffffff) and `span[data-testid="react-typed"] > span` at 1.98 (#b8b8b8 on #ffffff). |
| 4 legal pages zero headings / no H1 | Minor | STILL_TRUE | Fresh deep data: terms-of-use, privacy, cybersecurity-policy, ai-disclosure all h1Count=0 and headingLevels=[]; axe page-has-heading-one (moderate) count=1 fires on all four — identical to prior. |
| docs/market-data multiple h1 per page (3-5) | Minor | STILL_TRUE | Fresh deep h1Count identical: insider-trades 5, options-quotes 4, equity-ohlcv 4, institutional-holdings 4, earnings 3 — every /docs/market-data/* page still has 3-5 H1s. |
| heading skip H1->H3 on /pricing and /agentic-etfs | Minor | STILL_TRUE | Fresh deep: pricing headingLevels=[1,3,3,3,2], agentic-etfs=[1,3,3,3,3,3,3,3,3,3,3,3], both headingHierarchyOk=false; axe heading-order (moderate) count=1 on each — identical to prior. |
| meta descriptions 162-238 chars on 6 pages | Minor | STILL_TRUE | Fresh metaDescriptionLen identical on all six: home 190, /ai-agentic-trading 162, options-quotes 206, equity-ohlcv 167, insider-trades 238, institutional-holdings 215; diff.json metaChanges=[]. |
| marketing pages missing CSP/XFO/XCTO/Referrer/Permissions headers | Minor | STILL_TRUE | Fresh headers.json: / and /pricing security.missing = [content-security-policy, x-frame-options, x-content-type-options, referrer-policy, permissions-policy, x-xss-protection], present only HSTS + COOP; /docs still ships CSP + X-Frame-Options — same asymmetry as prior. |
| sub-24px tap targets home footer + pricing links | Minor | STILL_TRUE | Fresh responsiveExtra: home tinyTapCount=12 at 320/390/414 (footer links h=16 e.g. Docs 31x16, Discord 47x16, Terms of Service 108x16; one 14x14 button), pricing 14 at 320 and 15 at 390/414; all overflowPx=0 — identical to prior. |
| docs pages no robots meta + only WebSite JSON-LD | Minor | STILL_TRUE | Fresh deep: all five /docs/market-data/* pages robotsMeta=None and jsonld=['WebSite'] (count 1), while marketing pages carry "index, follow" + 3-6 JSON-LD blocks — unchanged. |
| pricing mobile-only contrast failures (9 mobile vs 5 desktop) | Minor | CHANGED | Muted-token contrast failures persist on /pricing (mobileAxe color-contrast count=9 at 2.92 #899a9d on #ffffff, same nodes), but desktop axe now also reports 9 (was 5; diff.json axeChanges pricing color-contrast old 5 -> new 9), so the defect is no longer mobile-only — it is now a viewport-independent contrast failure with the same muted-token root cause. |
| no main landmark / content outside landmarks (home, pricing, interior) | Minor | STILL_TRUE | Fresh deep axe: landmark-one-main (moderate) count=1 on home, pricing, agentic-etfs, and all four legal pages; region (moderate) home 20 (same as prior), pricing 76 (was 74), agentic-etfs 44, legal 11-16 — pattern unchanged. Note: deep-nav failures on /docs and www:/legal are capture artifacts — both live-verified 200 via curl (docs -> /docs/introduction 200; /legal 200). |

**New findings (2026-07-06):**

### 15. 33 target="_blank" links lack rel="noopener" (reverse-tabnabbing hardening) across all 13 captured pages
- **Severity:** Minor
- **Type:** Suggestion (security / best practice)
- **What & where:** Site-wide rendered DOM — `https://scalarfield.io/` (11), `/pricing` (5), `/ai-agentic-trading` (6), `/agentic-etfs` (2), 4 legal pages (1 each), 5 docs/market-data pages (1 each).
- **Evidence:** Fresh deep-crawl blankNoopener (2026-07-06): 33 total, per-page counts verified in `evidence2/scalarfield.deep.json` (home examples: ycombinator.com launch post, calendly.com/aman-dvds/30min, blogs.scalarfield.io; pricing: blog.scalarfield.io, discord.gg/rhW3BBaWzx, x.com/scalar_field_). Live-verified 2026-07-06: /agentic-etfs served HTML contains exactly 2 target=_blank anchors (Discord, X) with no rel attribute; homepage server HTML has 0 such anchors (they are client-injected), so most instances are rendered-DOM-only. Caveats: ~9 of the 33 are mailto: or same-origin links where tabnabbing is not a risk, and modern browsers imply noopener for target=_blank — impact is legacy-browser hardening plus lint/best-practice hygiene.
- **Fix:** Add `rel="noopener noreferrer"` in the shared external-link component so every `target="_blank"` anchor gets it (one change in the Next.js link wrapper covers all instances).

### 16. Duplicate element ID "SVGRepo_iconCarrier" on /agentic-etfs (invalid HTML)
- **Severity:** Minor
- **Type:** Bug (HTML validity)
- **What & where:** `https://scalarfield.io/agentic-etfs` — two inline SVGs.
- **Evidence:** Fresh deep-crawl dupIds: `{"count": 1, "examples": ["SVGRepo_iconCarrier x2"]}`; live-verified 2026-07-06: grep of the served HTML returns exactly 2 occurrences of `id="SVGRepo_iconCarrier"`. The ID is boilerplate from SVGRepo icon exports; duplicate IDs break getElementById/ARIA references and fail HTML validation. Not present in prior reports; no other page shows dupIds.
- **Fix:** Strip the `SVGRepo_*` id attributes from the pasted SVGRepo icons, or make them unique per instance.

### 17. "Open AI GPT-5.4" misspells the OpenAI brand on the agentic-ETFs listing
- **Severity:** Minor
- **Type:** Bug (copy/branding)
- **What & where:** `https://scalarfield.io/agentic-etfs` — strategy card "Open AI GPT-5.4 Multi-Signal S&P 500 Portfolio".
- **Evidence:** Live-verified 2026-07-06: served HTML contains "Open AI GPT-5.4 Multi-Signal S&P 500 Portfolio" (6 occurrences incl. RSC payload); also in fresh deep.json `pages['/agentic-etfs'].data.text`. The brand is one word, "OpenAI". Present in the 07-01 capture too but missed by the prior audit. Caveat / needs manual review on ownership: strategy names on this page may be user-generated, so the fix surface may be curation/moderation of featured strategy titles rather than site copy.
- **Fix:** Rename the strategy card to "OpenAI GPT-5.4 Multi-Signal S&P 500 Portfolio" (or normalize brand spellings in curated/featured strategy titles).

### 18. Grammar error in the AI Disclosure compliance page: "Any information on potential returns are projections"
- **Severity:** Minor
- **Type:** Bug (copy/grammar)
- **What & where:** `https://scalarfield.io/ai-disclosure` — Hypothetical and Historical Analysis section (before "9. USER RESPONSIBILITY").
- **Evidence:** Live-verified 2026-07-06: served HTML contains the exact sentence "Any information on potential returns are projections, not guarantees." — subject-verb disagreement ("information … are"). Also verbatim in fresh deep.json `pages['/ai-disclosure'].data.text`. Not in prior reports. Notable because it sits in an SEC-adviser-style compliance document where copy precision matters.
- **Fix:** Change to "Any information on potential returns is a projection, not a guarantee."

### 19. Footers link to two different blog properties: first-party blogs.scalarfield.io (home) vs Medium blog.scalarfield.io (pricing) — needs manual review
- **Severity:** Minor
- **Type:** Suggestion (content/IA consistency)
- **What & where:** `https://scalarfield.io/` footer "Blogs" link vs `https://scalarfield.io/pricing` footer "Blog & updates" link.
- **Evidence:** Fresh deep.json links[]: `https://blogs.scalarfield.io/` (source: homepage, 200) and `https://blog.scalarfield.io/` (source: pricing, 200). Live-verified 2026-07-06: blogs.scalarfield.io serves a first-party site titled "Scalar Field Blog - Scalar Field Blog" (390KB), while blog.scalarfield.io serves a Medium publication titled "Scalar Field – Medium" (redirects to ?gi= Medium param). Nothing is broken; the issue is two footers sending users to two independent blog platforms — needs manual review whether one is stale post-migration.
- **Fix:** Pick the canonical blog property, point both footer links at it, and 301 the deprecated subdomain (or intentionally label them differently if both are maintained).
