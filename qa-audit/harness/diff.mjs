// Compare old committed evidence (2026-07-01/02) vs fresh re-audit capture.
// Produces <key>.diff.json in the re-audit evidence2 dir: copy-string regressions,
// prior-broken-link statuses, axe count changes, meta changes, new failures.
import fs from 'fs';
import path from 'path';

const OLD = '/home/user/partyinvite/qa-audit';
const NEW = process.env.REPO_DIR + '/qa-audit';
const key = process.argv[2];

const j = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const o1 = j(`${OLD}/evidence/${key}.json`), n1 = j(`${NEW}/evidence/${key}.json`);
const o2 = j(`${OLD}/evidence2/${key}.deep.json`), n2 = j(`${NEW}/evidence2/${key}.deep.json`);
const nx = j(`${NEW}/evidence2/${key}.extras.json`);

// Copy strings previously reported as findings (exact, incl. typographic apostrophes)
const STRINGS = {
  flick: ['Unlimited customizable credits', '20,000 credits', 'Creator Partner Program', 'Youtube, Linkedin'],
  uplane: ['campagins', 'worklows', 'ready to in Understand', 'the Al era', 'Al marketing automation', 'what messages drives', 'end-2-end'],
  scalarfield: ['Backed by Combinator', 'ScalarField helps traders'],
  yondu: ['Resillience', 'humaniods', "you're measure TTFT", 'Detroit, MI', 'McCormick Place', 'is a giant fixed system'],
  dex: ['couldn’t be more happier', 'call notes, and writing tone', '@ 2026'],
  contrario: ['Search experties', 'WISP FLOW', 'Privacy policy sections', 'Carlos Libardo Founding Data Engineer'],
  naive: ['Naive Studio'],
};

const textOf = (d) => Object.values(d?.pages || {}).map(p => p?.data?.text || '').join('  ');
const oldText = textOf(o2), newText = textOf(n2);

const out = { key, comparedAt: new Date().toISOString(), copyStrings: [], priorBrokenLinks: [], axeChanges: [], metaChanges: [], robotsSitemap: {}, newLinkFailures: [], newConsoleErrors: [], newFpFailures: [] };

for (const s of (STRINGS[key] || [])) {
  out.copyStrings.push({ string: s, wasPresent: oldText.includes(s), stillPresent: newText.includes(s) });
}

// prior non-200 links (from old pass1+deep links) -> status now (new links or extras regression)
const oldBad = new Map();
for (const src of [o1?.links, o2?.links]) for (const l of (src || [])) if (l.status && (l.status === 0 || l.status >= 400)) oldBad.set(l.url, l.status);
const newStatus = new Map();
for (const src of [n1?.links, n2?.links]) for (const l of (src || [])) if (l.url) newStatus.set(l.url, l.status);
for (const r of (nx?.regression || [])) newStatus.set(r.url, r.status);
for (const [u, os] of oldBad) out.priorBrokenLinks.push({ url: u, oldStatus: os, newStatus: newStatus.get(u) ?? null });

// axe rule count changes per common page
const axeMap = (d) => { const m = {}; for (const [pu, p] of Object.entries(d?.pages || {})) { if (!Array.isArray(p?.axe)) continue; for (const v of p.axe) m[`${pu} :: ${v.id}`] = v.count; } return m; };
const oa = axeMap(o2), na = axeMap(n2);
for (const k2 of new Set([...Object.keys(oa), ...Object.keys(na)])) {
  const a = oa[k2] ?? 0, b = na[k2] ?? 0;
  if (a !== b) out.axeChanges.push({ pageRule: k2, old: a, new: b });
}

// meta changes on common pages
for (const pu of Object.keys(o2?.pages || {})) {
  const od = o2.pages[pu]?.data, nd = n2?.pages?.[pu]?.data;
  if (!od || !nd) continue;
  const diffs = {};
  for (const f of ['title', 'metaDescription', 'canonical', 'h1Count', 'ogCount', 'twitterCount', 'jsonldCount']) {
    const a = od[f] ?? null, b = nd[f] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs[f] = { old: a, new: b };
  }
  if (Object.keys(diffs).length) out.metaChanges.push({ page: pu, diffs });
}

out.robotsSitemap = { robots: { old: o1?.robots?.status, new: n1?.robots?.status }, sitemap: { old: o1?.sitemap?.status, new: n1?.sitemap?.status } };

// brand-new link failures (in new, not previously bad)
for (const [u, s] of newStatus) if (s && (s === 0 || s >= 400) && !oldBad.has(u)) out.newLinkFailures.push({ url: u, status: s });

// new console errors / fp failures not in old capture (rough text match)
const oldCons = new Set((o1?.console?.errors || []).map(c => c.text));
for (const c of (n1?.console?.errors || [])) if (!oldCons.has(c.text)) out.newConsoleErrors.push({ text: c.text.slice(0, 160), onPage: c.onPage });
const oldFp = new Set((o1?.network?.firstPartyFailures || []).map(f => f.url));
for (const f of (n1?.network?.firstPartyFailures || [])) if (!oldFp.has(f.url)) out.newFpFailures.push({ url: f.url, status: f.status, error: f.error });

fs.writeFileSync(`${NEW}/evidence2/${key}.diff.json`, JSON.stringify(out, null, 2));
const fixedStr = out.copyStrings.filter(c => c.wasPresent && !c.stillPresent).length;
const fixedLinks = out.priorBrokenLinks.filter(l => l.newStatus === 200).length;
console.log(`[${key}] strings: ${out.copyStrings.filter(c=>c.stillPresent).length} still / ${fixedStr} fixed | priorBadLinks: ${out.priorBrokenLinks.length} (${fixedLinks} now 200) | axeChanges=${out.axeChanges.length} metaChanges=${out.metaChanges.length} newLinkFail=${out.newLinkFailures.length} newConsole=${out.newConsoleErrors.length} newFpFail=${out.newFpFailures.length}`);
