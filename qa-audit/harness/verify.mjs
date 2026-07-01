// Second-pass verification: for each site's evidence JSON, independently confirm
// the perf/asset findings with real over-the-wire (compressed) sizes via curl,
// check the default /favicon.ico fallback, and re-test any first-party link/asset
// failures. Writes qa-audit/evidence/<key>.verified.json.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = process.env.REPO_DIR || '/home/user/partyinvite';
const EV = path.join(REPO, 'qa-audit', 'evidence');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

function curlMeta(url, { compressed = true, method = 'GET' } = {}) {
  const args = ['-sS', '-o', '/dev/null', '-A', UA, '--max-time', '45',
    '-w', '%{http_code}\t%{size_download}\t%{content_type}\t%{url_effective}\t%{num_redirects}'];
  if (compressed) args.push('--compressed');
  if (method === 'HEAD') args.push('-I');
  if (method === 'GET') args.push('-L');
  args.push(url);
  try {
    const out = execFileSync('curl', args, { encoding: 'utf8', timeout: 50000 });
    const [code, size, type, eff, redirs] = out.trim().split('\t');
    return { status: +code, size: +size, type, finalUrl: eff, redirects: +redirs };
  } catch (e) {
    return { status: 0, error: String(e.message || e).split('\n')[0] };
  }
}

const key = process.argv[2];
const file = path.join(EV, key + '.json');
if (!fs.existsSync(file)) { console.error('no evidence for', key); process.exit(1); }
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const origin = new URL(d.start).origin;

const v = { key, checkedAt: new Date().toISOString(), assets: [], favicon: null, firstPartyLinkFailuresReChecked: [], firstPartyAssetFailuresReChecked: [], notFoundProbe: null };

// favicon default fallback
v.favicon = { ...curlMeta(origin + '/favicon.ico', { method: 'HEAD' }), url: origin + '/favicon.ico' };

// real transfer sizes for the largest first-party assets
let total = 0;
for (const a of (d.network?.largestFirstParty || [])) {
  const m = curlMeta(a.url, { compressed: true });
  if (m.status === 200 && m.size) total += m.size;
  v.assets.push({ url: a.url, harnessKB: a.kb, realKB: m.size ? Math.round(m.size / 1024) : null, status: m.status, encoding: m.type, type: a.type });
}
v.top12RealTotalMB = Math.round(total / 1024 / 1024 * 10) / 10;

// re-check any first-party link failures the harness flagged
for (const l of (d.links || [])) {
  if (l.firstParty && l.status && (l.status === 0 || l.status >= 400)) {
    v.firstPartyLinkFailuresReChecked.push({ url: l.url, harnessStatus: l.status, recheck: curlMeta(l.url, { method: 'GET' }) });
  }
}
// re-check first-party asset/network failures
for (const r of (d.network?.firstPartyFailures || [])) {
  v.firstPartyAssetFailuresReChecked.push({ url: r.url, harnessStatus: r.status, harnessErr: r.error, recheck: curlMeta(r.url, { method: 'GET' }) });
}

// probe a guaranteed-nonexistent path to confirm the site returns a real 404 (soft-404 detection)
v.notFoundProbe = { ...curlMeta(origin + '/this-page-does-not-exist-qa-audit-' + Math.floor(1e6 * 0.42), { method: 'GET' }), note: 'expect 404' };

fs.writeFileSync(path.join(EV, key + '.verified.json'), JSON.stringify(v, null, 2));
console.log(`[${key}] favicon=${v.favicon.status} top12RealMB=${v.top12RealTotalMB} fpLinkFails=${v.firstPartyLinkFailuresReChecked.length} fpAssetFails=${v.firstPartyAssetFailuresReChecked.length} 404probe=${v.notFoundProbe.status}`);
