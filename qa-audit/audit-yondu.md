# QA Audit — Yondu (yondu.ai)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, lightweight site (homepage ~13KB HTML); the main opportunities are two quick SEO fixes, a couple of dead job links, and a handful of easy accessibility touch-ups.

**B. Issues (highest impact × ease first)**

### 1. Homepage title is "Home", plus 3 `<h1>`s and no canonical
- **Severity:** High
- **Type:** Suggestion (SEO)
- **What & where:** The homepage `<title>` is literally `Home`, which is what shows in search results and browser tabs — `https://www.yondu.ai/`. The page also has three `<h1>` elements (should be one) and no `<link rel="canonical">`.
- **Evidence:** `meta.title` = "Home" (`titleLen` 4); `og:title` / `twitter:title` also "Home"; `h1Count` = 3 ("The Future of Physical Labor.", "We envision a future where all manual tasks are done by robots…", "Partnership with Shipbots"); `canonical` = null.
- **Fix:** Set a descriptive title (brand + value prop, e.g. "Yondu — Drop-in warehouse automation robots"), keep a single `<h1>`, and add a canonical tag.

### 2. Two job links on the Careers page 404
- **Severity:** Medium
- **Type:** Bug (broken)
- **What & where:** Two "Open Positions" links point to YC postings that have been taken down — `https://www.yondu.ai/careers`.
- **Evidence:** HTTP 404 on `ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern` (Robotics Software Intern) and `.../FjyrKhI-quarter-1-2026-robotics-hardware-intern` (Quarter 1 2026 Robotics Hardware Intern). The Senior Robotics Engineer link (`.../l6z04IP-senior-robotics-engineer`) still returns 200.
- **Fix:** Remove or repoint the two dead job links to live postings.

### 3. Accessibility: low contrast, an unlabeled link, and no `<main>` landmark
- **Severity:** Medium
- **Type:** Suggestion (a11y)
- **What & where:** On the homepage (`https://www.yondu.ai/`): two low-contrast text elements, a link with no accessible name, and no `<main>` landmark. The same patterns recur on About, Blog, and Careers.
- **Evidence:** axe `color-contrast` (serious) × 2 — `.text-span-50` and `.button-9` both at contrast ratio 1.96 (`#bba4d3` on `#f3f0e5`); axe `link-name` (serious) × 1 — the nav logo link `.nav-logo-link` (`<a href="/">`) has no discernible text; axe `landmark-one-main` (moderate) — "Document does not have a main landmark".
- **Fix:** Darken the light-purple text/button to meet WCAG AA, add an `aria-label` (e.g. "Yondu home") to the logo link, and wrap primary content in a `<main>` element.

### 4. Missing sitemap.xml; robots.txt is empty
- **Severity:** Low
- **Type:** Suggestion (SEO)
- **What & where:** `https://www.yondu.ai/sitemap.xml` and `https://www.yondu.ai/robots.txt`.
- **Evidence:** `sitemap.xml` returns HTTP 404 (not present); `robots.txt` is served (HTTP 200) but empty.
- **Fix:** Publish a `sitemap.xml` and a minimal `robots.txt` that references it.

**C. Founder-ready paragraph**
> I've been following what Yondu is building — drop-in brownfield bin-picking at a price mid-sized 3PLs can actually afford is genuinely exciting — and while poking around the site I noticed a few small things worth a quick fix. The homepage tab/search title currently just says "Home" rather than something like "Yondu — drop-in warehouse automation," which is an easy SEO win; a couple of the open-role links on the Careers page (the Robotics Software Intern and the Q1 2026 Robotics Hardware Intern) now 404 because the YC postings came down; and a bit of the light-purple text on the homepage is hard to read against the cream background. None of it is urgent, but all of it is quick. Happy to send over the full list with exact URLs if that's useful.
