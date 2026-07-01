// Pass-2 capture (curl-based): security/best-practice headers, compression, caching,
// TTFB, HTTP version, http->https redirect, www<->apex canonicalization, cookie flags.
// Reads pass-1 evidence to know key pages + heavy assets. Writes evidence2/<key>.headers.json.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = process.env.REPO_DIR || '/home/user/partyinvite';
const EV1 = path.join(REPO, 'qa-audit', 'evidence');
const EV2 = path.join(REPO, 'qa-audit', 'evidence2');
fs.mkdirSync(EV2, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

function curl(url, extra = []) {
  const args = ['-sS', '-A', UA, '--max-time', '40', '-D', '-', '-o', '/dev/null',
    '-w', '\n@@@%{http_code}\t%{time_starttransfer}\t%{http_version}\t%{redirect_url}\t%{scheme}\t%{size_download}\t%{num_redirects}', ...extra, url];
  try {
    const out = execFileSync('curl', args, { encoding: 'utf8', timeout: 45000, maxBuffer: 8 * 1024 * 1024 });
    const i = out.lastIndexOf('\n@@@');
    const head = out.slice(0, i);
    const [code, ttfb, ver, redir, scheme, size, nredir] = out.slice(i + 4).split('\t');
    // parse the LAST response block's headers (after redirects, -D - concatenates)
    const blocks = head.split(/\r?\n\r?\n/).filter(b => /^HTTP\//m.test(b));
    const last = blocks[blocks.length - 1] || head;
    const headers = {};
    const setCookies = [];
    for (const line of last.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
      if (!m) continue;
      const k = m[1].toLowerCase();
      if (k === 'set-cookie') setCookies.push(m[2]);
      else headers[k] = m[2];
    }
    return { status: +code, ttfbMs: Math.round(parseFloat(ttfb) * 1000), httpVersion: ver, redirectUrl: redir, scheme, size: +size, numRedirects: +nredir, headers, setCookies, redirectBlocks: blocks.length };
  } catch (e) { return { error: String(e.message || e).split('\n')[0] }; }
}

const SEC = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy', 'x-xss-protection'];
function secReport(h) {
  const present = {}, missing = [];
  for (const s of SEC) { if (h[s]) present[s] = h[s].slice(0, 160); else missing.push(s); }
  return { present, missing, server: h['server'], xPoweredBy: h['x-powered-by'], cacheControl: h['cache-control'], vary: h['vary'] };
}
function cookieFlags(list) {
  return (list || []).map(c => {
    const name = c.split('=')[0];
    return { name, secure: /;\s*secure/i.test(c), httpOnly: /;\s*httponly/i.test(c), sameSite: (c.match(/samesite=(\w+)/i) || [])[1] || null };
  });
}

const key = process.argv[2];
const ev1 = JSON.parse(fs.readFileSync(path.join(EV1, key + '.json'), 'utf8'));
const start = ev1.start;
const u = new URL(start);
const apex = u.host.replace(/^www\./, '');
const wwwHost = u.host.startsWith('www.') ? u.host : 'www.' + u.host;

const out = { key, name: ev1.name, start, checkedAt: new Date().toISOString(), canonicalization: {}, pages: {}, assets: {}, notes: [] };

// http -> https redirect
out.canonicalization.httpToHttps = curl('http://' + apex + '/', ['-I']);
// apex vs www: fetch both (no -L) and see if one redirects to the other
out.canonicalization.apex = curl('https://' + apex + '/', ['-I']);
out.canonicalization.www = curl('https://' + wwwHost + '/', ['-I']);
// trailing slash consistency on a key page
// gather key pages from pass1
const pageUrls = [start, ...(ev1.keyPagesDiscovered || []).map(k => k.url)].slice(0, 7);
for (const p of pageUrls) {
  const r = curl(p, ['--compressed']);
  if (r.error) { out.pages[p] = r; continue; }
  out.pages[p] = {
    status: r.status, ttfbMs: r.ttfbMs, httpVersion: r.httpVersion, numRedirects: r.numRedirects,
    contentEncoding: r.headers['content-encoding'] || '(none)',
    security: secReport(r.headers),
    cookies: cookieFlags(r.setCookies),
  };
}
// static assets: compression + caching on the heaviest first-party assets from pass1
const assetUrls = (ev1.network?.largestFirstParty || []).map(a => a.url).filter(x => /\.(js|css|svg|png|jpe?g|webp|woff2?|mp4)(\?|$)/i.test(x)).slice(0, 8);
for (const a of assetUrls) {
  const r = curl(a, ['--compressed']);
  if (r.error) { out.assets[a] = r; continue; }
  out.assets[a] = {
    status: r.status, ttfbMs: r.ttfbMs, sizeKB: Math.round(r.size / 1024),
    contentEncoding: r.headers['content-encoding'] || '(none)',
    cacheControl: r.headers['cache-control'] || '(none)',
    etag: r.headers['etag'] ? 'yes' : 'no',
    contentType: r.headers['content-type'] || '',
    immutable: /immutable/.test(r.headers['cache-control'] || ''),
  };
}
fs.writeFileSync(path.join(EV2, key + '.headers.json'), JSON.stringify(out, null, 2));
const home = out.pages[start] || {};
console.log(`[${key}] http->https=${out.canonicalization.httpToHttps.status||out.canonicalization.httpToHttps.error} apex=${out.canonicalization.apex.status} www=${out.canonicalization.www.status} homeMissingSec=${(home.security?.missing||[]).length} homeEnc=${home.contentEncoding} ttfb=${home.ttfbMs}ms http=${home.httpVersion} cookies=${(home.cookies||[]).length}`);
