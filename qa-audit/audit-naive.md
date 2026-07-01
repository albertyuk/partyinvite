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
