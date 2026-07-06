// Re-audit extras (curl/fetch based, new checks not in earlier passes):
//  - sitemap.xml URL sampling (do listed URLs actually 200?)
//  - canonical-target resolution for every crawled page (catch self-deindexing canonicals)
//  - og:image / twitter:image URL resolution (broken social preview images)
//  - favicon <link> target resolution
//  - fixed regression list: re-check every URL cited in prior findings
// Writes REPO_DIR/qa-audit/evidence2/<key>.extras.json
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = process.env.REPO_DIR;
const EV1 = path.join(REPO, 'qa-audit', 'evidence');
const EV2 = path.join(REPO, 'qa-audit', 'evidence2');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

function curl(url, { method = 'GET', maxTime = 35 } = {}) {
  const args = ['-sS', '-o', '/dev/null', '-A', UA, '--max-time', String(maxTime), '-L',
    '-w', '%{http_code}\t%{url_effective}\t%{num_redirects}\t%{content_type}\t%{size_download}'];
  if (method === 'HEAD') args.push('-I');
  args.push(url);
  try {
    const [code, eff, nr, ct, sz] = execFileSync('curl', args, { encoding: 'utf8', timeout: (maxTime + 8) * 1000 }).trim().split('\t');
    return { status: +code, finalUrl: eff, redirects: +nr, type: ct, size: +sz };
  } catch (e) { return { status: 0, error: String(e.message || e).split('\n')[0].slice(0, 120) }; }
}
function curlBody(url, maxBytes = 400000) {
  try {
    return execFileSync('curl', ['-sS', '-A', UA, '--max-time', '35', '-L', url], { encoding: 'utf8', timeout: 45000, maxBuffer: maxBytes * 4 }).slice(0, maxBytes);
  } catch { return ''; }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// URLs cited in prior findings, re-checked verbatim every run (regression list)
const REGRESSION = {
  flick: ['https://flick.art/this-definitely-does-not-exist-xyz123', 'https://flick.art/ja', 'https://flick.art/auth', 'https://flick.art/docs'],
  uplane: ['https://uplane.com/careers', 'https://uplane.com/carrees'],
  scalarfield: [],
  dex: ['https://www.joindex.com/robots.txt', 'https://www.joindex.com/sitemap.xml', 'https://getdexterity.com/'],
  yondu: [
    'https://www.ycombinator.com/companies/yondu/jobs/NU60VVf-robotics-software-intern',
    'https://www.ycombinator.com/companies/yondu/jobs/FjyrKhI-quarter-1-2026-robotics-hardware-intern',
    'https://www.ycombinator.com/companies/yondu/jobs/boSSSw0-summer-2026-robotics-hardware-intern',
    'https://www.ycombinator.com/companies/yondu/jobs/l6z04IP-senior-robotics-engineer',
    'https://yondu.ai/automate', 'https://www.yondu.ai/sitemap.xml', 'https://www.yondu.ai/robots.txt'],
  contrario: ['https://gigaml.com/'],
  naive: ['https://status.usenaive.ai/'],
};

const key = process.argv[2];
const ev1 = JSON.parse(fs.readFileSync(path.join(EV1, key + '.json'), 'utf8'));
const deep = JSON.parse(fs.readFileSync(path.join(EV2, key + '.deep.json'), 'utf8'));
const origin = new URL(ev1.start).origin;
const out = { key, checkedAt: new Date().toISOString(), sitemap: {}, canonicals: [], socialImages: [], favicons: [], regression: [] };

// --- sitemap sampling ---
{
  const smUrl = origin + '/sitemap.xml';
  const head = curl(smUrl, { method: 'GET' });
  out.sitemap.status = head.status;
  if (head.status === 200) {
    let body = curlBody(smUrl);
    let locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
    // sitemapindex: descend into first two child sitemaps
    if (/<sitemapindex/i.test(body) && locs.length) {
      const children = locs.slice(0, 2);
      locs = [];
      for (const c of children) { const b = curlBody(c); locs.push(...[...b.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1])); await sleep(400); }
      out.sitemap.index = true; out.sitemap.children = children;
    }
    out.sitemap.totalLocs = locs.length;
    // sample: spread across the list, max 14
    const n = Math.min(14, locs.length);
    const sample = [];
    for (let i = 0; i < n; i++) sample.push(locs[Math.floor(i * locs.length / n)]);
    out.sitemap.sampled = [];
    for (const u of [...new Set(sample)]) {
      const r = curl(u); out.sitemap.sampled.push({ url: u, ...r });
      await sleep(400);
    }
    out.sitemap.non200 = out.sitemap.sampled.filter(s => s.status !== 200);
  }
}

// --- canonical targets (every crawled page that sets one) ---
{
  const seen = new Set();
  for (const [pu, p] of Object.entries(deep.pages || {})) {
    const c = p?.data?.canonical; if (!c || seen.has(c)) continue; seen.add(c);
    const r = curl(c);
    out.canonicals.push({ page: pu, canonical: c, ...r, selfConsistent: r.status === 200 && (r.finalUrl === c || r.finalUrl === c + '/' || r.finalUrl.replace(/\/$/, '') === c.replace(/\/$/, '')) });
    await sleep(300);
  }
}

// --- og:image / twitter:image resolution ---
{
  const imgs = new Set();
  const homeOg = ev1.pages?.home?.meta?.og || {}; if (homeOg['og:image']) imgs.add(homeOg['og:image']);
  const homeTw = ev1.pages?.home?.meta?.twitter || {}; if (homeTw['twitter:image']) imgs.add(homeTw['twitter:image']);
  for (const p of Object.values(deep.pages || {})) { const d = p?.data; if (d?.ogImage) imgs.add(d.ogImage); if (d?.twImage) imgs.add(d.twImage); }
  for (const u of [...imgs].slice(0, 10)) {
    let abs = u; try { abs = new URL(u, origin).toString(); } catch {}
    const r = curl(abs); out.socialImages.push({ url: abs, ...r, isImage: /image\//.test(r.type || '') });
    await sleep(300);
  }
}

// --- favicon link targets ---
{
  const favs = new Set(ev1.pages?.home?.meta?.favicons || []);
  for (const f of [...favs].slice(0, 4)) {
    let abs = f; try { abs = new URL(f, origin).toString(); } catch {}
    const r = curl(abs); out.favicons.push({ href: f, resolved: abs, ...r });
    await sleep(300);
  }
}

// --- regression list ---
for (const u of (REGRESSION[key] || [])) {
  const r = curl(u); out.regression.push({ url: u, ...r });
  await sleep(500);
}

fs.writeFileSync(path.join(EV2, key + '.extras.json'), JSON.stringify(out, null, 2));
console.log(`[${key}] sitemap=${out.sitemap.status}(${out.sitemap.totalLocs ?? '-'} locs, ${out.sitemap.non200?.length ?? '-'} non-200) canonicals=${out.canonicals.length}(${out.canonicals.filter(c => !c.selfConsistent).length} suspect) ogImgs=${out.socialImages.length}(${out.socialImages.filter(i => i.status !== 200).length} bad) fav=${out.favicons.filter(f => f.status !== 200).length}bad regr=${out.regression.map(r => r.status).join(',')}`);
