# Website QA Audit — 7 startup marketing sites

_Outside-in, prospective-user review of publicly served pages. 2026-07-01; fully re-audited
2026-07-06._

> **Re-audit 2026-07-06:** every finding was re-verified against a brand-new capture. 127 prior
> findings still true (including all 4 Criticals), 6 fixed by the sites, 6 changed, and **44 new
> findings** from new checks (sitemap URL sampling, canonical targets, og:image resolution,
> `rel=noopener`, duplicate IDs). Standouts: Naive's sitemap points all 223 URLs at the wrong
> domain (`naive.ai`); Flick's `og:image`/`twitter:image` 404 on every non-blog route; Uplane's
> footer Careers link dead-ends at `/company/undefined`; Yondu still promotes Automate 2026 as
> "upcoming" after the event ended. See the status block at the top of
> [error-audit.md](./error-audit.md) and the "Re-audit (2026-07-06)" section in each report;
> fresh evidence in [`evidence3/`](./evidence3).

A friendly, non-intrusive review of each company's public marketing site: broken links,
console/network errors, performance/asset weight, accessibility (axe-core), responsive
behavior, SEO/metadata, security headers, forms, and copy quality. **Logged-out pages only**
— no forms submitted, no accounts created, no irreversible actions; `robots.txt` honored and
requests throttled.

Two passes were run. **Pass 1** covered each site's home + main nav pages (the headline
findings in section B of each report). **Pass 2** was a deeper sweep — full-site crawl
(12–15 pages/site), security/best-practice headers, compression/caching, forms, mobile-viewport
accessibility, structured data, extra breakpoints (320/390/414px), and copy — appended as a
"Deep-dive addendum" in each report. Together that's **~130 verified findings**; pass 2 alone
added **106** (and its verifiers rejected ~34 candidates as unreproducible).

Every finding was captured with a headless browser **and** independently re-verified (HTTP
status, real compressed sizes, axe rule IDs, and — for copy — the exact string grepped from the
captured page text). Known false positives were deliberately excluded (see _Method & caveats_).

## Companies

| Company | Category | One-line health summary | Report |
|---|---|---|---|
| **Flick** (flick.art) | AI filmmaking | Polished but heavy (~36MB media); low-contrast text site-wide; soft-404, duplicated `/auth` metadata, and localized sitemap URLs serving English. | [audit-flick.md](./audit-flick.md) |
| **Uplane** (uplane.com) | AI marketing | Fast, clean — but a broken careers URL, **typos in the hero copy** ("campagins", "Al era"), identical meta description on 11 pages, and interior a11y gaps. | [audit-uplane.md](./audit-uplane.md) |
| **Scalar Field** (scalarfield.io) | agentic trading | Well-optimized; hero badge misspells **"Backed by Combinator"** (no "Y"), legal pages at 2.9:1 contrast, unlabeled controls. | [audit-scalarfield.md](./audit-scalarfield.md) |
| **Dex** (joindex.com) | AI browser | Clean build; mobile-nav overflow, ~25MB media, missing SEO basics site-wide, and "@" used for the copyright symbol on all 12 pages. | [audit-dex.md](./audit-dex.md) |
| **Yondu** (yondu.ai) | warehouse robotics | `<title>` "Home"; a **self-deindexing canonical** (→404), a **Chicago-vs-Detroit event contradiction**, "Blog Post" titles, and typos. | [audit-yondu.md](./audit-yondu.md) |
| **Contrario** (contrario.ai) | AI recruiting | Polished; the opportunity is accessibility — an aria-hidden carousel bug across 4 pages, 8 pages with no `<h1>`, and a copy-pasted ToS section. | [audit-contrario.md](./audit-contrario.md) |
| **Naive** (usenaive.ai) | agent infrastructure | Most accessible of the set; but no social-preview tags, a dead Status link, canonical missing on 13/14 pages, and 84 nested-interactive a11y errors on `/deploy`. | [audit-naive.md](./audit-naive.md) |

## The strongest outreach hooks (verified)

If sending a founder 2–3 findings, these are the most specific and highest-signal — each was
confirmed against the captured page text or a live request:

- **Uplane** — the homepage hero reads "AI should run **campagins**" (typo); "the **Al** era" / "**Al** marketing automation" render *Al* (capital-A, lowercase-L) instead of *AI*.
- **Scalar Field** — the hero credential badge says "**Backed by Combinator**" (the "Y" is missing) on the same page that links to their Y Combinator launch.
- **Yondu** — the Automate 2026 event is listed in **Chicago** on its detail page but **Detroit** on "Where We've Been"; all four blog posts share the title "Blog Post".
- **Dex** — the footer copyright uses "**@ 2026**" instead of "© 2026" on all 12 pages.
- **Flick** — the pricing "Studio" card lists "20,000 credits" twice while also claiming "Unlimited customizable credits."
- **Contrario** — the Terms of Service section 6 ("California Privacy Rights") is copy-pasted from the Privacy Policy, contradicting its own table of contents.

## Patterns across all seven sites

1. **Copy/typo errors are more common than expected — and the best outreach material.**
   Real spelling errors (Uplane "campagins"/"worklows", Yondu "Resillience"/"humaniods"),
   wrong glyphs (Dex "@" for "©"), brand inconsistencies (Scalar Field "ScalarField" vs
   "Scalar Field"; "Backed by Combinator"), and factual contradictions (Yondu's event city,
   Flick's credits card) appear on most sites. They're trivial to fix and unmistakably real.

2. **SEO problems scale across the whole site, not just the homepage.**
   Duplicate/placeholder titles and descriptions (Uplane's 47-char description on 11 pages;
   Yondu's four "Blog Post" titles), missing `<link rel=canonical>` site-wide (Naive 13/14
   pages, Dex's use-case pages), a **self-deindexing canonical** on Yondu (points to a 404),
   no JSON-LD structured data (Dex, Yondu 12/13, Scalar Field docs), and localized sitemap
   URLs that serve identical English content with no hreflang (Flick /zh, /ja, /fr).

3. **The pass-1 accessibility issues recur on interior pages and worsen on mobile.**
   The aria-hidden-focus carousel bug repeats on 4 Contrario pages and on Flick; low-contrast
   text covers whole legal templates (Scalar Field 57–64 nodes at 2.9:1; Dex 1.95:1 on
   use-case pages); heading structure is broken in both directions (Uplane `/why-us` has 11
   `<h1>`s, Contrario `/customers` tags 13 stats as `<h1>`, while 8+ pages have none); a
   mobile-only critical `button-name` failure hits Flick's hamburger; Naive's `/deploy` has 84
   nested-interactive violations; contact forms are placeholder-only with no labels (Yondu, and
   Uplane's lead form sits in an untitled iframe).

4. **Security/best-practice headers are largely absent on the marketing pages.**
   All seven omit most of HSTS/CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy.
   Tellingly, Scalar Field protects its `/docs` subsite (X-Frame-Options: DENY) but not its
   marketing pages, which are therefore embeddable in a hostile iframe. Low priority, easy fix.

5. **Third-party/tracker weight is heavy on the Framer/marketing sites.**
   Naive fires ~371 third-party tracker requests; Contrario makes ~2,600 requests across 24
   third-party hosts; Yondu's Apollo intent-pixel returns HTTP 400 on every pageload.

6. **Framework fingerprints predict the failure mode.** Framer (Uplane, Contrario), Webflow
   (Yondu), Next.js/Vercel (Dex, Scalar Field, Naive), and a GPT-Engineer/Lovable build (Flick).
   Framer/Webflow sites share the link-name/landmark/contrast/heading profile; the Next.js sites
   share the canonical/soft-404/structured-data gaps. A single shared-component fix clears many.

## Method & caveats

- **Capture:** headless Chromium (Playwright) rendering each public page with full request
  interception, `axe-core` for accessibility (desktop + 375px mobile), and `curl` for
  independent HTTP-status, header, and real (compressed) transfer-size verification. Pass 2
  crawled 12–15 pages per site and checked all discovered links.
- **Verification:** every pass-2 finding went through a high-effort adversarial verifier that
  re-checked the cited status/header/rule-id/count against the evidence JSON, grepped the exact
  quoted string for copy claims, and re-curled links in doubt — defaulting to reject.
- **Excluded as false positives** (verified environment/anti-bot artifacts, not site bugs):
  LinkedIn `999`/`429` and ProductHunt/VentureBeat/X `403`/`429` on social links; Google
  Sign-In (GSI)/FedCM console errors and `ERR_CONNECTION_CLOSED` from the headless capture;
  *expected* logged-out `401` auth checks; Next.js `_rsc` prefetch `404`s where the real page
  loads; "missing favicon" where a `<link rel=icon>` or `/favicon.ico` exists.
- **Not quoted as truth:** raw millisecond load/LCP timings (the interception path distorts
  timing). Performance findings use real asset weight, request counts, single-request TTFB, and
  structural signals. **Cross-browser rendering was not tested** — only Chromium is available in
  this environment (Firefox/WebKit are not installed).
- **Evidence:** pass-1 capture in [`evidence/`](./evidence); pass-2 capture (deep crawl +
  headers) in [`evidence2/`](./evidence2); capture scripts in [`harness/`](./harness). Mobile
  (375/320px) and desktop (1440px) screenshots are under each `evidence*/<company>/`.

_Suggested outreach: send the 2–3 highest-value findings from a company's report (each report's
section C is a paste-ready paragraph; the copy/contradiction findings above are the strongest
hooks) and offer the full file — signal over volume._
