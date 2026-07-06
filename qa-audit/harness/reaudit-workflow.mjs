export const meta = {
  name: 'qa-reaudit',
  description: 'Re-verify every prior finding against the fresh 2026-07-06 capture and hunt for new issues; adversarially verify; update reports',
  phases: [
    { title: 'Recheck', detail: 'per site: re-verify prior findings + hunt new issues (parallel)' },
    { title: 'Verify', detail: 'adversarially confirm FIXED claims and NEW findings' },
    { title: 'Write', detail: 'append re-audit section to each audit-<key>.md' },
  ],
};

const QA = '/home/user/partyinvite/qa-audit';           // old evidence + reports (committed)
const NEWQA = '/tmp/claude-0/-home-user-partyinvite/aa7afbb0-18ff-5279-81f6-fb7b2daaffb7/scratchpad/reaudit/qa-audit'; // fresh capture
const DATE = (args && args.date) || '2026-07-06';

const SITES = {
  flick: { name: 'Flick', domain: 'flick.art' },
  uplane: { name: 'Uplane', domain: 'uplane.com' },
  scalarfield: { name: 'Scalar Field', domain: 'scalarfield.io' },
  dex: { name: 'Dex', domain: 'joindex.com' },
  yondu: { name: 'Yondu', domain: 'yondu.ai' },
  contrario: { name: 'Contrario', domain: 'contrario.ai' },
  naive: { name: 'Naive', domain: 'usenaive.ai' },
};

const EXCLUSIONS = `Known false positives — NEVER report as defects:
- Social/anti-bot statuses on external links: LinkedIn 999/429, ProductHunt/VentureBeat/X/Instagram/iso.org 403/429. A YC job link 404 IS reportable (postings get removed for real) — re-verify live.
- Google GSI/FedCM console errors; ERR_CONNECTION_CLOSED lines (headless-capture artifacts; also transient page.goto nav failures in the capture where a live curl of the same URL returns 200).
- Expected logged-out 401/403 on auth/session endpoints (e.g. air.scalarfield.io/auth/me).
- Next.js _rsc prefetch 404s where the direct URL returns 200.
- "Missing favicon" where a <link rel=icon> or /favicon.ico works.
- Raw millisecond load timings (capture-distorted). Single-request TTFB from headers.json is OK.
- The Dex h1 "self-drivingworkspace" text-extraction artifact (renders correctly).
- If evidence is ambiguous, mark "needs manual review" instead of asserting.`;

const FILES = (k) => `FRESH capture (${DATE}):
- ${NEWQA}/evidence/${k}.json (pass-1: pages, links, axe, console, network, meta, responsive)
- ${NEWQA}/evidence/${k}.verified.json (real asset sizes, favicon, soft-404 probe)
- ${NEWQA}/evidence2/${k}.headers.json (security headers, compression, TTFB, canonicalization)
- ${NEWQA}/evidence2/${k}.deep.json (deep crawl; NEW fields this run: pages[].data.ogImage/twImage/blankNoopener/dupIds/deprecatedTags)
- ${NEWQA}/evidence2/${k}.extras.json (NEW checks: sitemap URL sampling, canonical-target statuses, og:image/favicon resolution, regression-list URL statuses)
- ${NEWQA}/evidence2/${k}.diff.json (machine diff vs old evidence: copy-string status, prior-broken-link statuses, axe count changes, meta changes, new failures)
OLD evidence (2026-07-01/02) for comparison: ${QA}/evidence/${k}.json, ${QA}/evidence2/${k}.deep.json
PRIOR REPORTS (source of the findings to re-verify): the "${k}" per-site section in ${QA}/error-audit.md and the full ${QA}/audit-${k}.md.
The JSONs are large — extract with python3/jq via Bash instead of reading whole files.
Live checks: curl only (no Playwright): curl -sS -o /dev/null -w "%{http_code}" -L -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36" --max-time 30 <url> ; throttle ~1/s, max ~25 requests, GET/HEAD only, never POST.`;

const RECHECK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'statuses'],
  properties: {
    key: { type: 'string' },
    statuses: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['finding', 'severity', 'status', 'note'],
        properties: {
          finding: { type: 'string', description: 'short id of the prior finding' },
          severity: { type: 'string' },
          status: { type: 'string', enum: ['STILL_TRUE', 'FIXED', 'CHANGED', 'UNVERIFIABLE'] },
          note: { type: 'string', description: 'fresh evidence cite; for CHANGED, what changed' },
        },
      },
    },
  },
};

const HUNT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'findings'],
  properties: {
    key: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['severity', 'title', 'where', 'evidence', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['Critical', 'Major', 'Minor'] },
          title: { type: 'string' }, where: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
  },
};

const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'confirmedNew', 'rejectedNew', 'overturnedStatuses'],
  properties: {
    key: { type: 'string' },
    confirmedNew: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['severity', 'title', 'where', 'evidence', 'fix'], properties: { severity: { type: 'string' }, title: { type: 'string' }, where: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } } } },
    rejectedNew: { type: 'array', items: { type: 'string' } },
    overturnedStatuses: { type: 'array', items: { type: 'string' }, description: 'prior-finding statuses (esp. FIXED claims) the verifier overturned, with reason' },
  },
};

const WRITE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['key', 'still', 'fixed', 'changed', 'newCount', 'headline'],
  properties: { key: { type: 'string' }, still: { type: 'integer' }, fixed: { type: 'integer' }, changed: { type: 'integer' }, newCount: { type: 'integer' }, headline: { type: 'string' } },
};

const keys = (args && args.keys) || Object.keys(SITES);

const results = await pipeline(
  keys,
  // Stage 1: re-verify prior findings + hunt new issues, in parallel
  async (k) => {
    const s = SITES[k];
    const [recheck, hunt] = await parallel([
      () => agent(`You are re-auditing ${s.name} (${s.domain}) on ${DATE}. A full fresh capture was just taken.
TASK: re-verify EVERY finding previously reported for this site. The authoritative prior-finding list = the "${s.name}" per-site section of ${QA}/error-audit.md (every [Critical]/[Major]/[Minor] line) — cross-reference ${QA}/audit-${k}.md for detail.
${FILES(k)}
For each prior finding, determine from FRESH evidence (start with ${k}.diff.json — it pre-computes copy-string presence, prior-broken-link statuses, axe count changes, and regression-URL statuses — then the fresh JSONs, then live curl for anything Critical or status-related):
- STILL_TRUE (fresh evidence shows the same defect; cite the fresh value)
- FIXED (defect no longer present; cite fresh value AND live-verify with curl if it's a status/link/meta claim)
- CHANGED (still a defect but materially different — count/scope/severity changed; describe)
- UNVERIFIABLE (fresh capture cannot confirm either way; say why)
Keep "finding" ids short but recognizable (e.g. "YC job link NU60VVf 404", "hero typo campagins", "color-contrast home 22 nodes").
${EXCLUSIONS}
Return the structured list covering ALL prior findings for this site (Critical+Major individually; Minors may be grouped where they share a root cause, but every Minor must be covered by some entry).`,
        { label: `recheck:${k}`, phase: 'Recheck', schema: RECHECK_SCHEMA }),
      () => agent(`You are hunting for NEW, previously-unreported issues on ${s.name} (${s.domain}), using a fresh ${DATE} capture with checks the earlier audit did not have.
${FILES(k)}
Focus (in order):
1. ${k}.extras.json — sitemap sampled URLs that are non-200; canonical targets that redirect elsewhere or non-200 (selfConsistent=false); og:image/twitter:image URLs that fail or aren't images; favicon targets that fail.
2. ${k}.deep.json NEW fields — blankNoopener (target=_blank without rel=noopener: security/tabnabbing, report count + examples), dupIds (duplicate element IDs), deprecatedTags.
3. ${k}.diff.json — newLinkFailures, newConsoleErrors, newFpFailures, metaChanges (a regression since 07-01 is a finding: "changed since last audit"), axeChanges where counts INCREASED.
4. Fresh copy sweep — grep pages[].data.text in the fresh deep.json for typos/errors NOT in the prior reports (prior findings are in ${QA}/audit-${k}.md — do not re-report them). Quote exact strings; be conservative (marketing voice/stylistic fragments are not errors).
5. Anything else in the fresh evidence the prior audit demonstrably missed.
${EXCLUSIONS}
Only report what the evidence directly shows; live-curl anything status-based before claiming it (max ~15 curls, throttled). Severity: Critical = broken pages/dead primary links; Major = broken assets/meta/a11y blockers/canonical-vs-sitemap contradictions; Minor = typos/small SEO/hardening. Return zero findings rather than pad.`,
        { label: `hunt:${k}`, phase: 'Recheck', schema: HUNT_SCHEMA }),
    ]);
    return { k, recheck: recheck || { statuses: [] }, hunt: hunt || { findings: [] } };
  },
  // Stage 2: adversarial verification of FIXED claims + NEW findings
  async ({ k, recheck, hunt }) => {
    const s = SITES[k];
    const v = await agent(`Adversarial verifier for the ${s.name} (${s.domain}) re-audit. Default to reject/overturn when unsure.
${FILES(k)}
A) FIXED/CHANGED claims to audit — a "FIXED" that isn't real would wrongly tell a founder their bug is gone:
${JSON.stringify(recheck.statuses.filter(x => x.status !== 'STILL_TRUE'), null, 1)}
For each: confirm against fresh evidence and (for link/status/meta claims) a live curl. If a FIXED claim is wrong (defect still present), add it to overturnedStatuses with the correct status and evidence.
B) NEW candidate findings to audit:
${JSON.stringify(hunt.findings, null, 1)}
For each: verify the cited value actually appears in the fresh evidence (grep the exact string for copy claims); re-curl status claims; check it is NOT already in ${QA}/audit-${k}.md or the ${s.name} section of ${QA}/error-audit.md (if it is, reject as duplicate); check it is not an excluded artifact; check severity is proportionate. Merge near-duplicates.
${EXCLUSIONS}
Return confirmedNew (cleaned, severity-ordered), rejectedNew (title + one-line reason), overturnedStatuses (finding + corrected status + reason; empty if none).`,
      { label: `verify:${k}`, phase: 'Verify', schema: VERIFY_SCHEMA, effort: 'high' });
    return { k, recheck, verify: v || { confirmedNew: [], rejectedNew: [], overturnedStatuses: [] } };
  },
  // Stage 3: write the re-audit section into the per-site report
  async ({ k, recheck, verify }) => {
    const s = SITES[k];
    const w = await agent(`Append a re-audit section to ${QA}/audit-${k}.md for ${s.name}. PRESERVE all existing content; append at the end:

## Re-audit (${DATE})
_Full fresh capture ${DATE}; every prior finding re-verified, plus new checks (sitemap URL sampling, canonical targets, social-preview images, rel=noopener, duplicate IDs)._

Then three subsections:
"**Prior findings — status:**" — a compact table (| Finding | Severity | Status | Note |) from this data (apply overturnedStatuses corrections BEFORE writing; use the corrected status):
${JSON.stringify(recheck.statuses, null, 1)}
Overturned by verifier (apply these): ${JSON.stringify(verify.overturnedStatuses)}

"**New findings (${DATE}):**" — each confirmed new finding in the report's existing block format (### n. title / **Severity:** / **Type:** / **What & where:** / **Evidence:** / **Fix:**), numbered continuing style, ordered by severity:
${JSON.stringify(verify.confirmedNew, null, 1)}
(If none: a one-line "No new issues found beyond the prior findings.")

Use Edit/Write. Then return the structured summary: still/fixed/changed = counts AFTER applying overturns; newCount = confirmedNew length; headline = one line for the consolidated index (e.g. "All 4 majors still true; 2 typos fixed; 3 new findings incl. broken sitemap URLs").`,
      { label: `write:${k}`, phase: 'Write', schema: WRITE_SCHEMA });
    return { k, summary: w, confirmedNew: verify.confirmedNew, rejectedNew: verify.rejectedNew, overturned: verify.overturnedStatuses, statuses: recheck.statuses };
  }
);

return results.filter(Boolean).map(r => ({
  key: r.k,
  headline: r.summary?.headline,
  still: r.summary?.still, fixed: r.summary?.fixed, changed: r.summary?.changed, newCount: r.summary?.newCount,
  confirmedNew: r.confirmedNew?.map(f => `[${f.severity}] ${f.title} — ${f.where}`),
  overturned: r.overturned,
  rejectedNewCount: r.rejectedNew?.length ?? 0,
}));
