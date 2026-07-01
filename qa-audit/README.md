# Website QA Audit — 7 startup marketing sites

_Outside-in, prospective-user review of publicly served pages. 2026-07-01._

A friendly, non-intrusive review of each company's public marketing site: broken links,
console/network errors, performance/asset weight, accessibility (axe-core), responsive
behavior, and SEO/metadata. **Logged-out pages only** — no forms submitted, no accounts
created, no irreversible actions; `robots.txt` honored and requests throttled.

Every finding below was captured with a headless browser **and** independently re-verified
(HTTP status, real compressed transfer sizes, axe rule IDs). Known false positives were
deliberately excluded (see _Method & caveats_).

## Companies

| Company | Category | One-line health summary | Report |
|---|---|---|---|
| **Flick** (flick.art) | AI filmmaking | Polished, well-built site; main wins are trimming a ~36MB first-load media payload, low-contrast gray text, and a soft-404 fix. | [audit-flick.md](./audit-flick.md) |
| **Uplane** (uplane.com) | AI marketing | Fast, clean site; main wins are a broken/misspelled careers URL, a batch of quick a11y fixes, and a one-line SEO title. | [audit-uplane.md](./audit-uplane.md) |
| **Scalar Field** (scalarfield.io) | agentic trading | Fast, well-optimized (light JS, low CLS); main wins are a few accessibility fixes, most of them quick. | [audit-scalarfield.md](./audit-scalarfield.md) |
| **Dex** (joindex.com) | AI browser | Clean, no broken links; real wins are a mobile-nav fix, ~25MB of first-load media, and SEO basics (robots/sitemap/canonical). | [audit-dex.md](./audit-dex.md) |
| **Yondu** (yondu.ai) | warehouse robotics | Fast, lightweight; main wins are two quick SEO fixes, two dead job links, and easy a11y touch-ups. | [audit-yondu.md](./audit-yondu.md) |
| **Contrario** (contrario.ai) | AI recruiting | Solid, fast, polished; the main opportunity is accessibility (icon-link labels, landmarks, contrast). | [audit-contrario.md](./audit-contrario.md) |
| **Naive** (usenaive.ai) | agent infrastructure | Fast, structurally clean, most accessible of the set; real wins are social-preview tags, a canonical, and one dead Status link. | [audit-naive.md](./audit-naive.md) |

## Patterns across all seven sites

1. **Accessibility is the most common gap — and the same few issues repeat.**
   All 7 are missing a `<main>` landmark (`landmark-one-main`) and trigger `region`
   violations (content outside landmarks). Low-contrast light-gray body text appears on
   6 of 7 (flick, uplane, scalar field, dex, yondu, contrario). Icon/logo/social links with
   no accessible name (`link-name`) show up on uplane (4), yondu (1), and contrario (13);
   focusable content inside `aria-hidden` carousels (`aria-hidden-focus`) on flick and
   contrario. These track site-builder defaults more than deliberate choices — which is
   good news, because a shared component fix clears many at once.

2. **The "visual" products ship very heavy hero media; the dev/data products don't.**
   Flick loads ~36MB on first paint (a 14.6MB autoplay hero video), Dex ~25MB (a 20MB video
   + a ~5MB hero PNG), Uplane a 6.5MB hero video. In contrast Scalar Field, Naive, and
   Contrario each keep first-party weight under ~1MB. Transcoding/compressing video and
   moving photo-like PNGs to WebP/AVIF is the single biggest mobile win for the first group.

3. **SEO hygiene gaps cluster on the newer/Next.js sites.**
   Placeholder titles (`<title>Uplane</title>`, `<title>Home</title>` on Yondu), missing
   `<link rel="canonical">` (dex, yondu, naive), missing `sitemap.xml` (dex, yondu), missing
   `robots.txt` (dex), no Open Graph/Twitter tags on Naive's homepage, and a soft-404 on
   Flick (unknown URLs return 200). All are quick, high-leverage fixes.

4. **The broken links that actually matter are on careers pages.**
   Yondu has 2 dead YC job postings (404); Uplane's careers page is only reachable at the
   misspelled `/carrees` (the intuitive `/careers` 404s). Naive has a dead `status.usenaive.ai`
   subdomain link. (Most other "broken" externals were social bot-blocks — see below.)

5. **Framework fingerprints are visible.** Framer (Uplane, Contrario), Webflow (Yondu),
   and Next.js (Dex, Scalar Field, Naive). Framer sites share the link-name/landmark/contrast
   profile; the Next.js sites share the canonical/soft-404/social-meta profile.

## Method & caveats

- **Capture:** headless Chromium (Playwright) rendering each public page with full request
  interception, `axe-core` for accessibility, and `curl` for independent HTTP-status and
  real (compressed) transfer-size verification. Pages checked per site: home + main nav
  pages (product/features, pricing, about, blog, careers, docs — whatever existed).
- **Excluded as false positives** (verified as environment/anti-bot artifacts, not site bugs):
  LinkedIn `999` and ProductHunt/VentureBeat `403`/`429` on social links; Google Sign-In
  (GSI)/FedCM console errors from the headless capture; *expected* logged-out `401` auth
  checks (e.g. `air.scalarfield.io/auth/me`); Next.js `_rsc` prefetch `404`s where the real
  page loads fine; "missing favicon" where a `<link rel=icon>` tag or `/favicon.ico` exists;
  and `ERR_CONNECTION_CLOSED` lines caused by the capture environment.
- **Not quoted as truth:** raw millisecond load/LCP timings — the interception path distorts
  timing, so performance findings lead with real asset weight, request counts, and structural
  signals instead.
- **Evidence:** per-company raw capture JSON and verification JSON are in
  [`evidence/`](./evidence), with mobile (375px) and desktop (1440px) screenshots per site.

_Suggested outreach: send the 2–3 highest-value findings from a company's report (each report's
section C is a paste-ready paragraph) and offer the full file — signal over volume._
