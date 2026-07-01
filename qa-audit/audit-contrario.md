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
