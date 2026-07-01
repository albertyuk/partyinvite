# QA Audit — Uplane (uplane.com)
_Outside-in review of publicly served pages, 2026-07-01. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** Fast, clean marketing site; the main opportunities are a misspelled careers URL, a batch of quick accessibility fixes, and a one-line SEO title fix.

**B. Issues (highest impact × ease first)**

### 1. Careers page lives at a misspelled URL
- **Severity:** Medium
- **Type:** Bug (broken)
- **What & where:** The top-nav "Careers" link and the real careers page both use the typo slug `/carrees`. Anyone who types or shares the intuitive `/careers` URL hits a dead end. — `https://uplane.com/carrees` (nav link `href="https://uplane.com/carrees"`)
- **Evidence:** `GET https://uplane.com/carrees` → **200** (the live careers page; it embeds an Ashby job board at `jobs.ashbyhq.com/uplane`), while `GET https://uplane.com/careers` → **404**.
- **Fix:** Rename the route to `/careers` and add a 301 redirect from `/carrees` so existing links keep working.

### 2. Icon/social links have no accessible name + low-contrast text
- **Severity:** High
- **Type:** Suggestion (a11y)
- **What & where:** Four interactive links expose no text to screen readers — the logo (`.framer-1j8w6qx`, `href="./"`), the home logo link (`.framer-1glm8x8`), the X link (`a[href$="uplane_com"]`), and the LinkedIn link — so a screen reader just announces "link." Several passages of small text also fall below the WCAG AA contrast minimum. — `https://uplane.com/`
- **Evidence:** axe `link-name` (serious) — 4 nodes; axe `color-contrast` (serious) — 5 nodes, e.g. Cookie Policy link at 2.84:1 (`#999999` on `#ffffff`), footer text at 3.11:1 (`#8d929e` on `#ffffff`), and body text at 3.6:1 (`#2476ff` on `#f0f0f0`) — all below the 4.5:1 threshold.
- **Fix:** Add an `aria-label` (or visually hidden text) to each icon/logo link, and darken the low-contrast text colors to reach at least 4.5:1.

### 3. Homepage `<title>` is just "Uplane"
- **Severity:** Medium
- **Type:** Suggestion (SEO)
- **What & where:** The homepage title tag is the single word "Uplane" — no keywords, no value proposition — which weakens search ranking and click-through in results and browser tabs. — `https://uplane.com/`
- **Evidence:** `<title>Uplane</title>` (6 chars); the same 6-char title repeats across `/blogs`, `/about-us`, and `/talk-to-us`.
- **Fix:** Set a descriptive title, e.g. "Uplane — Full-funnel AI marketing automation."

### 4. 6.5MB autoplay hero video + content outside landmarks
- **Severity:** Low
- **Type:** Suggestion (perf/a11y)
- **What & where:** The homepage autoplays a large hero video on load, which dominates page weight, and a lot of page content sits outside ARIA landmark regions. — `https://uplane.com/` (`HeroWebsiteOp.mp4`)
- **Evidence:** `HeroWebsiteOp.mp4` real transfer size 6538KB (~6.5MB) — the single heaviest asset, out of ~6.6MB total across the top pages; axe `region` (moderate) — 36 nodes on the homepage.
- **Fix:** Compress/transcode the video and add a poster image with lazy/deferred play; wrap page content in proper landmarks (`<main>`, `<nav>`, etc.).

**C. Founder-ready paragraph**

> I came across Uplane while looking into AI marketing tools and really like what you're building — the full-funnel, "AI runs the campaigns" angle is genuinely compelling, and I dug into the site a bit given my film and marketing background. A couple of things jumped out that are worth a quick look: the "Careers" nav link points to `/carrees` (misspelled), so anyone sharing or typing the obvious `/careers` URL is unlikely to land in the right place. A few icon links (logo, X, LinkedIn) also have no label for screen readers, and the homepage `<title>` is just "Uplane," which is leaving some easy SEO on the table. I've got a short list of a few more small findings if it'd be useful — happy to send it over.
