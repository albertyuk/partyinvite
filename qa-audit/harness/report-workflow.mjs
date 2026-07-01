export const meta = {
  name: 'qa-audit-reports',
  description: 'Draft founder-ready QA audit reports for 7 startup sites, then adversarially verify each claim against evidence',
  phases: [
    { title: 'Draft', detail: 'one agent per company writes audit-<key>.md from confirmed findings + evidence' },
    { title: 'Verify', detail: 'adversarially re-check every factual claim against the evidence JSON and fix drift' },
  ],
};

const EV = '/home/user/partyinvite/qa-audit/evidence';
const OUT = '/home/user/partyinvite/qa-audit';

const APPLICANT = `The reader of section C is a founder or small team at the company. The sender (you, in first person) is a prospective USER and job applicant with a FILM + MARKETING background who genuinely likes the product. Tone: a fan who noticed a few things, never an auditor grading them. No flattery, no "I'm a passionate student" filler, no condescension. 3-5 sentences. Name the 2-3 most useful, specific findings; offer to share the full list. Do not invent a signature or the sender's name.`;

const RULES = `
HARD RULES (accuracy over completeness):
- Report ONLY the findings in CONFIRMED_FINDINGS below. Do not invent or add new issues.
- Pull exact evidence values (HTTP status, KB/MB sizes, axe rule IDs + node counts, selectors, URLs) from the evidence JSON at ${EV}/<key>.json and <key>.verified.json. Read those files.
- Every "Evidence" line must be backed by the JSON or the CONFIRMED_FINDINGS. If you cannot back a number, omit the number rather than guess.
- NEVER report anything in the EXCLUSIONS list.
- Performance sizes must be the REAL compressed transfer sizes from <key>.verified.json (assets[].realKB) or the CONFIRMED_FINDINGS, NOT the harness raw bytes. Media (mp4/jpg/png) ~= real; JS/HTML/SVG may be much smaller compressed.
- Do NOT quote millisecond load/LCP timings as the site's performance (the capture environment distorts timing). Lead perf with real asset weight, request counts, and structural signals only.
- Keep it tight and skimmable. This is for a busy founder.`;

const TEMPLATE = `
OUTPUT FILE: ${OUT}/audit-<key>.md  (use Write). Exact structure:

# QA Audit — <Company> (<domain>)
_Outside-in review of publicly served pages, <date>. Non-intrusive: logged-out pages only, no form submissions._

**A. Health summary:** <one line, e.g. "Solid, fast site; the main opportunities are accessibility and 2 quick SEO fixes.">

**B. Issues (highest impact × ease first)**

For each issue, a compact block:
### <n>. <short title>
- **Severity:** Blocker | High | Medium | Low | Polish
- **Type:** Bug (broken) | Suggestion (UX/perf/a11y/SEO)
- **What & where:** <plain English> — \`<exact URL>\` — \`<selector/element if relevant>\`
- **Evidence:** <console msg / HTTP status / real size / axe rule id + count / repro steps>
- **Fix:** <one concrete sentence>

Order by (impact × ease). Put the 2-4 real-and-easy items first.

**C. Founder-ready paragraph**
> <3-5 sentence paste-ready outreach paragraph per the applicant guidance>

Also RETURN (as your structured output) a one-line health summary and the 2-3 lead findings for the index.`;

// Authoritative, already-verified findings per company. Agents expand these; they do not add to them.
const FINDINGS = {
  flick: {
    name: 'Flick', domain: 'flick.art', category: 'AI filmmaking',
    confirmed: [
      'PERF/High: Home + About ship ~36MB of media on first load. Real compressed sizes: cover-new2.mp4 = 14.6MB autoplay hero video; about.jpg = 4.8MB; mimi.jpg = 2.9MB; ray.jpg = 1.8MB; true.svg = 1.8MB (even after zstd). Fix: compress/transcode video, serve responsive WebP/AVIF images, lazy-load below-the-fold. Especially costly on mobile for a filmmaking site whose first impression is visual.',
      'A11Y/High: Low color contrast — axe color-contrast, 22 nodes. Example: body/label text #8e8784 on light background = 3.53:1 (WCAG AA needs 4.5:1). Fix: darken the gray text.',
      'SEO/Medium: Soft-404 — nonexistent URLs return HTTP 200 with the app shell instead of a real 404 (verified: GET /this-definitely-does-not-exist-xyz123 -> 200, ~5KB HTML). Fix: return a real 404 status for unknown routes.',
      'A11Y/Low: aria-hidden-focus (serious, 1) — a focusable element inside an aria-hidden container; no <main> landmark (landmark-one-main); 23 region violations (content outside landmarks). Fix: wrap main content in <main>, add tabindex=-1 or remove focusables from aria-hidden nodes.',
    ],
    exclusions: 'The LinkedIn profile link returning 999 (LinkedIn anti-bot, not broken). All Google Sign-In / GSI / FedCM console errors ("Error retrieving a token", well-known file ERR_CONNECTION_CLOSED) — artifacts of the headless capture environment, not user-facing. Favicon works via /favicon.ico (200). Do not report missing favicon.',
  },
  uplane: {
    name: 'Uplane', domain: 'uplane.com', category: 'AI marketing',
    confirmed: [
      'BUG/Medium: The careers page is published only at the misspelled slug /carrees. Verified: GET https://uplane.com/carrees -> 200, but https://uplane.com/careers -> 404. The top-nav "Careers" link points to /carrees. Fix: rename the route to /careers and 301-redirect /carrees.',
      'A11Y/High: 4 links with no accessible name (axe link-name, 4) — icon/social links a screen reader just announces as "link"; plus low contrast text (color-contrast, 5). Fix: add aria-label or visible text to icon links; darken low-contrast text.',
      'SEO/Medium: Homepage <title> is just "Uplane" (6 chars) — no keywords or value proposition. Fix: e.g. "Uplane — Full-funnel AI marketing automation".',
      'PERF/Low: 6.5MB autoplay hero video (HeroWebsiteOp.mp4). Fix: compress/transcode and consider a poster + lazy play. 36 region violations (content outside landmarks).',
    ],
    exclusions: 'iso.org/standard/27001 returning 403 (ISO bot-block / possibly malformed link — not reliably reproducible). LinkedIn 999. The CSP "Refused to execute inline script" and "[Report Only]" console lines (no enforcing CSP header on the document; unverifiable / likely from an embedded iframe). The Rive "Could not find a View Model" warning (benign). Favicon works via a <link rel=icon> tag; do not report missing favicon.',
  },
  scalarfield: {
    name: 'Scalar Field', domain: 'scalarfield.io', category: 'agentic trading',
    confirmed: [
      'A11Y/High (critical rules): 2 buttons with no accessible name (axe button-name, 2 — critical) and 1 form field with no programmatic label (axe label, 1 — critical). On a trading product, unlabeled buttons/inputs block screen-reader and keyboard users. Fix: add aria-label/visible text to the buttons and a <label> (or aria-label) to the input.',
      'A11Y/Medium: low contrast text (color-contrast, 2); no <main> landmark (landmark-one-main); 20 region violations. Fix: add <main> and darken low-contrast text.',
      'A11Y/Low: 1 image missing an alt attribute (from the home DOM). Fix: add alt text (or alt="" if decorative).',
    ],
    exclusions: 'The 401 on https://air.scalarfield.io/auth/me — that is the app checking login state for a logged-out visitor; EXPECTED, not a bug. ERR_CONNECTION_CLOSED console lines (capture environment). Note positively: the site is otherwise well-optimized — light JS (~1.2MB), negligible layout shift (CLS 0.017), fast. Favicon works (/favicon.ico 200 + <link>).',
  },
  dex: {
    name: 'Dex', domain: 'joindex.com', category: 'AI browser (by Third Layer)',
    confirmed: [
      'MOBILE/High: ~54px horizontal overflow at 375px — the full desktop top-nav ("Product / Use Cases / Pricing / Blog" + a CTA button) is kept on mobile instead of collapsing to a menu, and the right-most button is clipped off-screen, causing a horizontal scroll. Verified visually in the 375px screenshot. Fix: collapse the nav to a hamburger below ~768px.',
      'PERF/High: ~25MB of first-load media — meeting-prep.mp4 = 20MB video and hero-media.png = 4.97MB PNG. Fix: transcode/compress the video (and lazy-load it) and convert the hero PNG to WebP/AVIF (a photo-like hero as PNG is the main win).',
      'SEO/Medium: robots.txt and sitemap.xml both return 404 (missing), and the homepage has no <link rel="canonical"> — weak for a site that wants to be indexed on the new domain. Also the old domain getdexterity.com 301-redirects to joindex.com (the outreach list still uses getdexterity.com). Fix: add robots.txt + sitemap.xml + a canonical tag.',
      'A11Y/Medium: low contrast text (axe color-contrast, 27 nodes); no <main> landmark. Fix: darken low-contrast text and add a <main> landmark.',
    ],
    exclusions: 'The h1 rendering "self-drivingworkspace" in raw text extraction is a line-break artifact — it renders correctly ("The self-driving / workspace for operators.") in the screenshot; NOT a copy bug. Favicon works (/favicon.ico 200 + <link>).',
  },
  yondu: {
    name: 'Yondu', domain: 'yondu.ai', category: 'warehouse robotics',
    confirmed: [
      'SEO/High (easy): The homepage <title> is literally "Home". Also the page has 3 <h1> elements (should be one) and no <link rel="canonical">. Fix: set a descriptive title (brand + value prop), keep a single <h1>, add a canonical tag.',
      'BUG/Medium: 2 of the job links on the careers page 404 — the underlying YC postings were taken down. Verified 404: ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern and .../FjyrKhI-quarter-1-2026-robotics-hardware-intern (a third, .../l6z04IP-senior-robotics-engineer, still returns 200). Fix: remove or update the dead job links.',
      'SEO/Low: sitemap.xml returns 404 (missing) and robots.txt is served but empty. Fix: publish a sitemap.xml and a minimal robots.txt referencing it.',
      'A11Y/Medium: low contrast text (color-contrast, 2); a link with no accessible name (link-name, 1); no <main> landmark. Fix: darken text, label the icon link, add <main>.',
    ],
    exclusions: 'The "Potential permissions policy violation: autoplay/encrypted-media/accelerometer..." console lines come from a third-party embed and are benign noise. Millisecond load timings (env-distorted). Favicon works via a <link rel=icon> tag.',
  },
  contrario: {
    name: 'Contrario', domain: 'contrario.ai', category: 'AI recruiting',
    confirmed: [
      'A11Y/High: The main opportunity is accessibility. axe found: 13 links with no accessible name (link-name), 22 aria-hidden elements containing focusable content (aria-hidden-focus), 26 low-contrast text nodes (color-contrast), and 3 heading-order jumps (skipped heading levels). For a recruiting product where candidates may use assistive tech, this matters. Fix: add aria-labels/text to icon links, remove focusables from aria-hidden nodes, darken low-contrast text, fix heading order.',
      'A11Y/Medium: no <main> landmark (landmark-one-main) and 30 region violations (content outside landmarks). Fix: wrap primary content in <main> and use semantic landmarks.',
    ],
    exclusions: 'All external link failures are bot-blocks/rate-limits, NOT broken links: producthunt.com 403, multiple linkedin.com 999/429, venturebeat.com 429. The repeated 403/400 console lines are third-party beacons blocked in the capture environment. Frame positively: SEO is solid (title, meta description, canonical, Open Graph, sitemap.xml all present), the site is fast, and layout shift is negligible (CLS 0.003). Favicon works via <link rel=icon>.',
  },
  naive: {
    name: 'Naive', domain: 'usenaive.ai', category: 'agent infrastructure',
    confirmed: [
      'SEO/SOCIAL/High (easy): The homepage has NO Open Graph and NO Twitter Card meta tags (og:* and twitter:* both empty). Links shared on X, Slack, Discord, or HN render with no title/description/preview image — costly for a dev-tool launch. Fix: add og:title/og:description/og:image and twitter:card meta tags.',
      'BUG/Medium (easy): The "Status" link points to https://status.usenaive.ai/ which returns 404 (verified). Fix: point it at a live status page or remove the link.',
      'SEO/Medium: The pricing page has no <h1> (axe page-has-heading-one); the homepage has no <link rel="canonical"> and no robots meta. Fix: add an <h1> to /pricing and a canonical tag site-wide.',
      'A11Y/Low: Otherwise the most accessible site of the set. Minor: one heading-order jump on home; a couple of solutions pages have scrollable regions that are not keyboard-focusable (scrollable-region-focusable); /templates has a duplicate landmark (landmark-unique). Fix: add tabindex=0 to scrollable regions and unique labels to duplicate landmarks.',
    ],
    exclusions: 'The 3 /docs/getting-started/* 404s are Next.js _rsc prefetch noise — the actual doc pages load fine (verified: direct GET returns 200). Do NOT report broken docs. ERR_CONNECTION_CLOSED console lines (capture environment). Favicon works via <link rel="icon" href="/favicon.svg">.',
  },
};

const SUMMARY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'healthLine', 'leads'],
  properties: {
    key: { type: 'string' },
    healthLine: { type: 'string' },
    leads: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
};

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'allClaimsSupported', 'corrections'],
  properties: {
    key: { type: 'string' },
    allClaimsSupported: { type: 'boolean' },
    corrections: { type: 'array', items: { type: 'string' } },
  },
};

const keys = Object.keys(FINDINGS);
const DATE = args && args.date ? args.date : '2026-07-01';

const results = await pipeline(
  keys,
  // Stage 1: draft the report
  (key) => {
    const f = FINDINGS[key];
    const prompt = `You are a meticulous QA/UX reviewer writing a founder-ready audit report.

COMPANY: ${f.name} (${f.domain}) — ${f.category}
DATE: ${DATE}
EVIDENCE FILES (READ THEM for exact values/selectors): ${EV}/${key}.json and ${EV}/${key}.verified.json

${RULES}

CONFIRMED_FINDINGS (authoritative — expand each into the template, ordered by impact x ease; you may pull concrete selectors/URLs/numbers from the evidence JSON):
${f.confirmed.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

EXCLUSIONS (never report these):
  ${f.exclusions}

APPLICANT GUIDANCE for section C:
${APPLICANT}

${TEMPLATE.replace(/<key>/g, key).replace(/<date>/g, DATE)}

Write the file to ${OUT}/audit-${key}.md now, then return the structured summary.`;
    return agent(prompt, { label: `draft:${key}`, phase: 'Draft', schema: SUMMARY_SCHEMA });
  },
  // Stage 2: adversarially verify the drafted file against evidence, fix drift in place
  (summary, key) => {
    const prompt = `Adversarially verify the QA report at ${OUT}/audit-${key}.md against the ground-truth evidence.

Read: ${OUT}/audit-${key}.md, ${EV}/${key}.json, ${EV}/${key}.verified.json.

Check EVERY factual claim in the report:
- HTTP status codes match the evidence (links[], network.firstPartyFailures, verified rechecks, notFoundProbe).
- Asset sizes match the REAL compressed sizes in ${key}.verified.json assets[].realKB (not harness raw bytes). Flag any size that isn't backed.
- axe rule IDs and node counts match pages[].axe in the evidence.
- Any URL cited actually appears in the evidence.
- No excluded item leaked in (LinkedIn 999, GSI/FedCM errors, expected auth 401s, _rsc prefetch 404s, "missing favicon" where a <link> or /favicon.ico exists, env ERR_CONNECTION_CLOSED, external bot-blocks).
- No millisecond timing is presented as the site's real performance.

If you find ANY unsupported/overstated claim or leaked exclusion, EDIT ${OUT}/audit-${key}.md to fix it (correct the number, or remove the claim). Keep the report's structure. Then return the list of corrections you made (empty if none).`;
    return agent(prompt, { label: `verify:${key}`, phase: 'Verify', schema: VERIFY_SCHEMA, effort: 'high' })
      .then((v) => ({ summary, verify: v }));
  }
);

return results.filter(Boolean).map((r) => ({
  key: r.summary && r.summary.key,
  healthLine: r.summary && r.summary.healthLine,
  leads: (r.summary && r.summary.leads) || [],
  allClaimsSupported: r.verify && r.verify.allClaimsSupported,
  corrections: (r.verify && r.verify.corrections) || [],
}));
