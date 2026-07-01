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
