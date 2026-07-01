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
