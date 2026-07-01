export const meta = {
  name: 'qa-audit-deep',
  description: 'Comprehensive pass-2 audit: 5 dimension analysts per site -> adversarial verify -> append addendum to each report',
  phases: [
    { title: 'Analyze', detail: '5 dimension analysts per site (technical, SEO, a11y, responsive, copy)' },
    { title: 'Verify', detail: 'high-effort skeptic keeps only evidence-backed, reproducible findings' },
    { title: 'Write', detail: 'append a pass-2 deep-dive addendum to each audit-<key>.md' },
  ],
};

const QA = '/home/user/partyinvite/qa-audit';
const EV1 = `${QA}/evidence`;
const EV2 = `${QA}/evidence2`;

const SITES = {
  flick: { name: 'Flick', domain: 'flick.art', cat: 'AI filmmaking' },
  uplane: { name: 'Uplane', domain: 'uplane.com', cat: 'AI marketing' },
  scalarfield: { name: 'Scalar Field', domain: 'scalarfield.io', cat: 'agentic trading' },
  dex: { name: 'Dex', domain: 'joindex.com', cat: 'AI browser' },
  yondu: { name: 'Yondu', domain: 'yondu.ai', cat: 'warehouse robotics' },
  contrario: { name: 'Contrario', domain: 'contrario.ai', cat: 'AI recruiting' },
  naive: { name: 'Naive', domain: 'usenaive.ai', cat: 'agent infrastructure' },
};

const EXCLUSIONS = `NEVER report (verified false positives / environment artifacts):
- Social/bot-block statuses on EXTERNAL links: LinkedIn 999/429, ProductHunt/VentureBeat/X/Instagram 403/429. Only report EXTERNAL link failures if clearly a real dead link (e.g. a removed job posting that 404s), never social bot-blocks.
- Google Sign-In (GSI)/FedCM console errors and "ERR_CONNECTION_CLOSED" (headless capture artifacts).
- Expected logged-out 401/403 on auth/session endpoints (e.g. /auth/me).
- Next.js _rsc prefetch 404s where the real page loads (verify with the direct URL).
- "Missing favicon" where a <link rel=icon> tag or /favicon.ico (200) exists.
- Millisecond load/LCP timings as the site's real performance (capture path distorts them). TTFB from the curl headers.json IS usable (single request, direct).
- Do NOT re-report the pass-1 findings already in the existing audit-<key>.md. Only add NEW or meaningfully DEEPER findings. If a new finding extends a pass-1 one, say so and add only the new detail.`;

const FINDINGS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['dimension', 'findings'],
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['severity', 'type', 'title', 'where', 'evidence', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['Blocker', 'High', 'Medium', 'Low', 'Polish'] },
          type: { type: 'string' },
          title: { type: 'string' },
          where: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
  },
};

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'verified', 'rejected'],
  properties: {
    key: { type: 'string' },
    verified: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['severity', 'type', 'title', 'where', 'evidence', 'fix'],
        properties: {
          severity: { type: 'string' }, type: { type: 'string' }, title: { type: 'string' },
          where: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
    rejected: { type: 'array', items: { type: 'string' } },
  },
};

const WRITE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'newFindingCount', 'topNew'],
  properties: { key: { type: 'string' }, newFindingCount: { type: 'integer' }, topNew: { type: 'array', items: { type: 'string' }, maxItems: 4 } },
};

const DIMENSIONS = [
  { k: 'technical', label: 'Technical, performance, security headers & broken links', focus: `Read ${EV2}/<key>.headers.json, ${EV2}/<key>.deep.json, and ${EV1}/<key>.json. Look for: missing/weak security & best-practice HTTP headers (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) — group into ONE finding; slow TTFB (>800ms from headers.json); static assets missing long-lived cache-control/immutable or not compressed (content-encoding none on JS/CSS/SVG); render-blocking resources (headSyncScripts/headStylesheets); excessive third-party requests/trackers (thirdParty[]); mixed content; and FIRST-PARTY broken links (links[] with status 0 or >=400, fp:true) plus any clearly-dead external links (e.g. removed job postings). Cross-check link statuses; ignore bot-blocks.` },
  { k: 'seo', label: 'SEO, metadata & structured data', focus: `Read ${EV2}/<key>.deep.json and ${EV1}/<key>.json. Look for: duplicate <title> or meta description across pages (duplicates{}); titles too short (<15 chars) or too long (>60), descriptions missing or >160 chars (per-page titleLen/metaDescriptionLen); missing/incorrect canonical (canonical null) per page; missing robots meta; NO structured data / JSON-LD (jsonldCount 0) — for a startup, Organization/Product schema is a reasonable add; low image alt coverage across pages (imgMissingAlt vs imgTotal, aggregate); heading hierarchy skips (headingHierarchyOk false) per page; missing/!=1 h1 on interior pages (h1Count). Do NOT duplicate the pass-1 homepage SEO findings unless the issue recurs across MANY pages (then note the scope).` },
  { k: 'a11y', label: 'Accessibility (mobile + forms + interior pages) beyond pass-1', focus: `Read ${EV2}/<key>.deep.json (pages[].axe, mobileAxe, forms) and ${EV1}/<key>.json. Look for: axe violations that appear on INTERIOR pages but were not in pass-1 (which only covered home + a few); violations that appear only at MOBILE viewport (mobileAxe vs desktop); FORM accessibility from forms[] (inputs with labeled:false, missing name, placeholder-as-label, missing autocomplete on email/tel fields, <form novalidate>); and any new rule IDs (e.g. scrollable-region-focusable, target-size, aria-*). Report the rule ID + node count + an example selector. Do NOT restate the exact pass-1 home-page a11y findings; focus on what's NEW (interior pages, mobile-only, forms).` },
  { k: 'responsive', label: 'Responsive / mobile UX at extra breakpoints', focus: `Read ${EV2}/<key>.deep.json (responsiveExtra{} for widths 320/390/414, tinyTapCount/tinyTapExamples) and the home-320 screenshots in ${EV2}/<key>/. Look for: horizontal overflow at 320/390/414 (overflowPx>2) with the offending breakpoint; small tap targets (<24px, many) with examples; anything that breaks specifically on very narrow screens. If pass-1 already flagged a 375px overflow, only add if it also breaks at other widths or the tap-target count is high. Report exact overflow px and breakpoint.` },
  { k: 'copy', label: 'Content & copy quality', focus: `Read the page text in ${EV2}/<key>.deep.json (pages[].data.text). Look ONLY for issues you can prove by quoting the EXACT string from that text: real spelling/grammar typos, placeholder text ("lorem ipsum", "TODO", "Coming soon" where it looks unfinished), obviously outdated dates/years, duplicated words, broken sentence fragments, or inconsistent product/brand naming/capitalization used inconsistently across pages. QUOTE the exact offending string and name the page. Be conservative: marketing voice, intentional lowercase branding, and stylistic fragments are NOT errors. If you are not sure a string is a genuine error, do not report it. It is fine to return zero findings.` },
];

const keys = Object.keys(SITES);

const results = await pipeline(
  keys,
  // Stage 1: 5 dimension analysts in parallel (barrier within the site)
  async (key) => {
    const s = SITES[key];
    const analyst = (dim) => agent(
      `You are a meticulous QA analyst reviewing the PUBLIC marketing site of ${s.name} (${s.domain}, ${s.cat}).
Dimension: ${dim.label}.

${dim.focus}

${EXCLUSIONS}

Also read the existing report ${QA}/audit-${key}.md so you do NOT repeat its pass-1 findings.
Report ONLY real, reproducible issues backed by the evidence files. For each finding give: severity, type (Bug/Suggestion + area), a short title, where (exact URL + selector/element), evidence (the exact status/header/rule-id+count/quoted string/number from the JSON), and a one-sentence fix. Return zero findings rather than pad. Return the structured object.`,
      { label: `${dim.k}:${key}`, phase: 'Analyze', schema: FINDINGS_SCHEMA });
    const perDim = await parallel(DIMENSIONS.map(d => () => analyst(d)));
    const candidates = perDim.filter(Boolean).flatMap(r => (r.findings || []).map(f => ({ ...f, dimension: r.dimension })));
    return { key, candidates };
  },
  // Stage 2: adversarial verification — keep only evidence-backed findings
  async ({ key, candidates }) => {
    const s = SITES[key];
    const v = await agent(
      `Adversarially verify candidate pass-2 findings for ${s.name} (${s.domain}) against ground-truth evidence. Default to REJECT when unsure.

Evidence to read: ${EV1}/${key}.json, ${EV1}/${key}.verified.json, ${EV2}/${key}.headers.json, ${EV2}/${key}.deep.json, and the existing ${QA}/audit-${key}.md.

CANDIDATE FINDINGS (JSON):
${JSON.stringify(candidates, null, 1)}

For EACH candidate, verify:
- The cited status/header/rule-id/count/number actually appears in the evidence JSON.
- For copy findings, the EXACT quoted string appears in the corresponding pages[].data.text (grep the file with Bash if useful). Reject any typo/copy claim whose exact string you cannot find.
- For link findings, the URL is first-party OR a clearly-dead external (not a bot-block). Re-check with curl if in doubt: \`curl -sS -o /dev/null -w "%{http_code}" -L -A "Mozilla/5.0 Chrome/141" <url>\`.
- It is NOT a pass-1 duplicate and NOT in the exclusions list.
- Severity is proportionate (missing security headers on a marketing site = Low/Polish; a broken user-facing link = Medium; a broken form = High).

${EXCLUSIONS}

Merge near-duplicates. Return the VERIFIED findings (evidence-backed, deduped, severity-ordered) and a short list of what you rejected and why.`,
      { label: `verify:${key}`, phase: 'Verify', schema: VERIFY_SCHEMA, effort: 'high' });
    return { key, verified: (v && v.verified) || [], rejected: (v && v.rejected) || [] };
  },
  // Stage 3: append the addendum to the report
  async ({ key, verified, rejected }) => {
    const s = SITES[key];
    if (!verified.length) {
      // still record that pass-2 ran with nothing new
      await agent(
        `Append a short pass-2 note to ${QA}/audit-${key}.md (use Edit/Write, keep everything already there). Add a section:

## Deep-dive addendum (pass 2)
_A second, deeper pass (full-site crawl, security headers, forms, mobile a11y, structured data, copy) surfaced no additional reproducible issues beyond pass 1._

Then return the structured summary with newFindingCount 0.`,
        { label: `write:${key}`, phase: 'Write', schema: WRITE_SCHEMA });
      return { key, newFindingCount: 0, topNew: [], verified, rejected };
    }
    const w = await agent(
      `Append a pass-2 deep-dive addendum to the existing report at ${QA}/audit-${key}.md for ${s.name}.

Use Edit/Write and PRESERVE all existing content. Append this section at the end:

## Deep-dive addendum (pass 2)
_A second, deeper pass: full-site crawl, security/best-practice headers, forms, mobile-viewport accessibility, structured data, extra breakpoints, and copy._

Then render each verified finding below in the SAME block format the report already uses (### n. title / **Severity:** / **Type:** / **What & where:** / **Evidence:** / **Fix:**), ordered by impact x ease. Do not repeat pass-1 findings. Keep it tight.

VERIFIED FINDINGS (JSON):
${JSON.stringify(verified, null, 1)}

Return the structured summary (newFindingCount = number of findings written; topNew = up to 4 short one-liners of the most useful new findings).`,
      { label: `write:${key}`, phase: 'Write', schema: WRITE_SCHEMA });
    return { key, newFindingCount: (w && w.newFindingCount) || verified.length, topNew: (w && w.topNew) || [], verified, rejected };
  }
);

return results.filter(Boolean).map(r => ({ key: r.key, newFindingCount: r.newFindingCount, topNew: r.topNew, rejectedCount: (r.rejected || []).length }));
