// Outside-in QA audit harness.
// Renders public pages through Chromium, but fulfills every request via Node fetch
// (Chromium's TLS is rejected by the egress proxy; Node fetch works through it).
// Collects: link statuses, console/network errors, broken/missing assets, axe-core
// a11y violations, SEO metadata, responsive overflow, and structural perf signals.
// Only FIRST-PARTY (same registrable domain) failures are treated as reliable.

import { chromium } from 'playwright';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const COMPANIES = {
  flick:       { name: 'Flick',        category: 'AI filmmaking',       start: 'https://flick.art/',        note: '' },
  uplane:      { name: 'Uplane',       category: 'AI marketing',        start: 'https://uplane.com/',       note: '' },
  scalarfield: { name: 'Scalar Field', category: 'agentic trading',     start: 'https://scalarfield.io/',   note: '' },
  dex:         { name: 'Dex (Third Layer)', category: 'AI browser',     start: 'https://www.joindex.com/',  note: 'getdexterity.com 301-redirects to joindex.com' },
  yondu:       { name: 'Yondu',        category: 'warehouse robotics',  start: 'https://www.yondu.ai/',     note: 'yondu.ai redirects to www.yondu.ai' },
  contrario:   { name: 'Contrario',    category: 'AI recruiting',       start: 'https://www.contrario.ai/', note: 'contrario.ai redirects to www.contrario.ai' },
  naive:       { name: 'Naive',        category: 'agent infrastructure',start: 'https://usenaive.ai/',      note: '' },
};

const key = process.argv[2];
if (!COMPANIES[key]) { console.error('Usage: audit.mjs <company>. Known:', Object.keys(COMPANIES).join(', ')); process.exit(1); }
const CO = COMPANIES[key];
const OUT_DIR = path.resolve(process.cwd(), '../../..'); // resolved below via env
const REPO = process.env.REPO_DIR || '/home/user/partyinvite';
const EV_DIR = path.join(REPO, 'qa-audit', 'evidence');
const SHOT_DIR = path.join(EV_DIR, key);
fs.mkdirSync(SHOT_DIR, { recursive: true });

const registrable = (h) => { const p = h.toLowerCase().split('.'); return p.slice(-2).join('.'); };
const BASE_HOST = new URL(CO.start).host;
const BASE_REG = registrable(BASE_HOST);
const isFirstParty = (u) => { try { return registrable(new URL(u).host) === BASE_REG; } catch { return false; } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stripHash = (u) => { try { const x = new URL(u); x.hash = ''; return x.toString(); } catch { return u; } };

// ---- shared response cache (politeness: fetch each GET once) ----
const cache = new Map(); // url+method -> {status, headers, body(Buffer), finalUrl}
async function nodeFetch(url, { method = 'GET', headers = {}, body } = {}) {
  const ck = method + ' ' + url;
  if (method === 'GET' && cache.has(ck)) return cache.get(ck);
  const h = { ...headers };
  delete h['accept-encoding']; delete h['host']; delete h[':authority'];
  const init = { method, headers: h, redirect: 'manual' };
  if (body) init.body = body;
  const resp = await fetch(url, init);
  const buf = Buffer.from(await resp.arrayBuffer());
  const rh = {}; resp.headers.forEach((v, k) => { rh[k] = v; });
  const out = { status: resp.status, headers: rh, body: buf, finalUrl: resp.url };
  if (method === 'GET') cache.set(ck, out);
  return out;
}

// ---- evidence accumulators ----
const requests = [];       // {url, host, firstParty, status, type, bytes, error, onPage}
const consoleMsgs = [];    // {type, text, onPage, location}
const pageErrors = [];     // {text, onPage}
let currentPage = '';

async function setupContext(browser) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (!/^https?:/i.test(url)) { try { await route.abort(); } catch {} return; }
    try {
      const headers = { ...req.headers() };
      const pd = req.postDataBuffer();
      const r = await nodeFetch(url, { method: req.method(), headers, body: pd || undefined });
      const respHeaders = {};
      for (const [k, v] of Object.entries(r.headers)) {
        if (['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) continue;
        respHeaders[k] = v;
      }
      requests.push({ url, host: (() => { try { return new URL(url).host; } catch { return ''; } })(), firstParty: isFirstParty(url), status: r.status, type: r.headers['content-type'] || '', bytes: r.body.length, onPage: currentPage });
      // 3xx: return to browser so it follows the redirect chain faithfully
      await route.fulfill({ status: r.status, headers: respHeaders, body: r.body });
    } catch (e) {
      requests.push({ url, host: (() => { try { return new URL(url).host; } catch { return ''; } })(), firstParty: isFirstParty(url), status: 0, error: String(e.message || e), onPage: currentPage });
      try { await route.abort(); } catch {}
    }
  });
  return ctx;
}

function wirePageEvents(page) {
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error' || t === 'warning') {
      let loc = '';
      try { const l = msg.location(); loc = l && l.url ? `${l.url}:${l.lineNumber}` : ''; } catch {}
      consoleMsgs.push({ type: t, text: msg.text().slice(0, 500), onPage: currentPage, location: loc });
    }
  });
  page.on('pageerror', (err) => pageErrors.push({ text: String(err.message || err).slice(0, 500), onPage: currentPage }));
}

async function extractMeta(page) {
  return await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const attr = (s, a) => { const el = q(s); return el ? el.getAttribute(a) : null; };
    const metas = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(m => metas['og:' + m.getAttribute('property').slice(3)] = m.getAttribute('content'));
    const tw = {};
    document.querySelectorAll('meta[name^="twitter:"]').forEach(m => tw[m.getAttribute('name')] = m.getAttribute('content'));
    const h1s = [...document.querySelectorAll('h1')].map(h => (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120));
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ level: +h.tagName[1], text: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) }));
    const favicons = [...document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')].map(l => l.getAttribute('href'));
    const imgs = [...document.querySelectorAll('img')];
    const imgMissingAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => (i.currentSrc || i.src || i.getAttribute('src') || '').slice(0, 160)).slice(0, 40);
    const imgEmptyAlt = imgs.filter(i => i.hasAttribute('alt') && i.getAttribute('alt').trim() === '').length;
    const imgBroken = imgs.filter(i => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src)).map(i => (i.currentSrc || i.src).slice(0, 200)).slice(0, 40);
    const imgNoDims = imgs.filter(i => !i.getAttribute('width') && !i.getAttribute('height') && !i.style.aspectRatio).length;
    // render-blocking approximations
    const headStyles = document.head ? [...document.head.querySelectorAll('link[rel="stylesheet"]')].filter(l => !l.media || l.media === 'all' || l.media === 'screen').length : 0;
    const headSyncScripts = document.head ? [...document.head.querySelectorAll('script[src]')].filter(s => !s.async && !s.defer && s.type !== 'module').length : 0;
    return {
      title: document.title || null,
      titleLen: (document.title || '').length,
      metaDescription: attr('meta[name="description"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      robotsMeta: attr('meta[name="robots"]', 'content'),
      viewportMeta: attr('meta[name="viewport"]', 'content'),
      charset: (q('meta[charset]') ? q('meta[charset]').getAttribute('charset') : null),
      lang: document.documentElement.getAttribute('lang'),
      h1s, h1Count: h1s.length, headings,
      og: metas, twitter: tw, favicons,
      imgCount: imgs.length, imgMissingAlt, imgMissingAltCount: imgMissingAlt.length, imgEmptyAlt,
      imgBroken, imgBrokenCount: imgBroken.length, imgNoDims,
      headStyles, headSyncScripts,
      linkCount: document.querySelectorAll('a[href]').length,
      textSample: (document.body ? document.body.innerText : '').replace(/\s+/g, ' ').slice(0, 6000),
    };
  });
}

async function extractLinks(page) {
  return await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href; if (!href) return;
      out.push({ href, text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), inNav: !!a.closest('nav,header,footer') });
    });
    return out;
  });
}

async function runAxe(page) {
  try {
    await page.addScriptTag({ path: AXE_PATH });
    const res = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
      return r.violations.map(v => ({
        id: v.id, impact: v.impact, help: v.help, description: v.description, helpUrl: v.helpUrl,
        nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 240), html: (n.html || '').slice(0, 160) })),
        count: v.nodes.length,
      }));
    });
    return res;
  } catch (e) { return { error: String(e.message || e) }; }
}

async function perfSnapshot(page) {
  try {
    return await page.evaluate(async () => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paints = {}; performance.getEntriesByType('paint').forEach(p => paints[p.name] = Math.round(p.startTime));
      // LCP + CLS via buffered observers (best-effort in headless)
      let lcp = null, cls = 0;
      try {
        const lcps = performance.getEntriesByType('largest-contentful-paint');
        if (lcps.length) lcp = Math.round(lcps[lcps.length - 1].startTime);
      } catch {}
      try {
        await new Promise(res => {
          const po = new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value; });
          po.observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => { po.disconnect(); res(); }, 600);
        });
      } catch {}
      const res = performance.getEntriesByType('resource');
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        fcp: paints['first-contentful-paint'] || null,
        lcp, cls: Math.round(cls * 1000) / 1000,
        resourceCount: res.length,
      };
    });
  } catch (e) { return { error: String(e.message || e) }; }
}

async function checkOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await sleep(500);
  return await page.evaluate((w) => {
    const de = document.documentElement;
    const scrollW = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
    const overflow = scrollW - de.clientWidth;
    let offenders = [];
    if (overflow > 2) {
      const vw = w;
      offenders = [...document.querySelectorAll('body *')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > vw + 3 && r.left >= -1 && getComputedStyle(el).position !== 'fixed';
      }).slice(0, 60).map(el => ({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
        right: Math.round(el.getBoundingClientRect().right),
        id: el.id || '',
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      }));
      // keep the widest few, deepest elements
      offenders = offenders.sort((a, b) => b.right - a.right).slice(0, 8);
    }
    // tiny tap targets (links/buttons < 32px in either dim), sample
    const tap = [...document.querySelectorAll('a[href], button')].map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24)).length;
    return { width: w, scrollW, clientW: de.clientWidth, overflowPx: overflow, offenders, tinyTapTargets: tap };
  }, width);
}

async function gotoSafe(page, url, tag) {
  currentPage = url;
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await sleep(1500);
    return { ok: true, status: resp ? resp.status() : null, finalUrl: page.url() };
  } catch (e) {
    return { ok: false, error: String(e.message || e).split('\n')[0], finalUrl: page.url() };
  }
}

// robots.txt parse (User-agent: * disallows)
function parseRobots(txt) {
  const dis = []; let applies = false;
  for (const raw of txt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue;
    const m = line.match(/^([a-z-]+):\s*(.*)$/i); if (!m) continue;
    const f = m[1].toLowerCase(), v = m[2].trim();
    if (f === 'user-agent') applies = (v === '*');
    else if (f === 'disallow' && applies && v) dis.push(v);
  }
  return dis;
}
function robotsBlocks(disallows, url) {
  try { const p = new URL(url).pathname; return disallows.some(d => p.startsWith(d)); } catch { return false; }
}

function classifyKeyPage(href, text) {
  const p = (() => { try { return new URL(href).pathname.toLowerCase(); } catch { return ''; } })();
  const t = (text || '').toLowerCase();
  const kws = ['pricing', 'price', 'product', 'features', 'feature', 'about', 'blog', 'contact', 'company', 'careers', 'docs', 'solutions', 'how-it-works', 'use-cases', 'customers', 'demo', 'team'];
  return kws.find(k => p.includes(k) || t === k || t.includes(k)) || null;
}

(async () => {
  const started = new Date().toISOString();
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await setupContext(browser);
  const page = await ctx.newPage();
  wirePageEvents(page);

  const report = { key, name: CO.name, category: CO.category, start: CO.start, note: CO.note, startedAt: started, baseHost: BASE_HOST, pages: {}, links: [], robots: {}, sitemap: {}, redirectNote: null };

  // robots.txt + sitemap.xml (first-party)
  const origin = new URL(CO.start).origin;
  let disallows = [];
  try {
    const r = await nodeFetch(origin + '/robots.txt');
    const body = r.body.toString('utf8');
    const isHtml = /<html|<!doctype/i.test(body.slice(0, 200));
    report.robots = { status: r.status, present: r.status === 200 && !isHtml && /user-agent/i.test(body), looksLikeHtml: isHtml, sample: body.slice(0, 400) };
    if (r.status === 200 && !isHtml) disallows = parseRobots(body);
  } catch (e) { report.robots = { error: String(e.message || e) }; }
  try {
    const r = await nodeFetch(origin + '/sitemap.xml');
    const body = r.body.toString('utf8');
    report.sitemap = { status: r.status, present: r.status === 200 && /<urlset|<sitemapindex/i.test(body), looksLikeXml: /<\?xml|<urlset|<sitemapindex/i.test(body.slice(0, 300)) };
  } catch (e) { report.sitemap = { error: String(e.message || e) }; }

  // check initial redirect from the "advertised" domain if different
  report.redirectNote = CO.note || null;

  // ---- HOME ----
  const homeNav = await gotoSafe(page, CO.start, 'home');
  const home = { url: CO.start, nav: homeNav };
  if (homeNav.ok) {
    home.meta = await extractMeta(page);
    home.axe = await runAxe(page);
    home.perf = await perfSnapshot(page);
    home.responsive = [];
    for (const w of [375, 768, 1440]) home.responsive.push(await checkOverflow(page, w));
    await page.setViewportSize({ width: 375, height: 812 }); await sleep(400);
    try { await page.screenshot({ path: path.join(SHOT_DIR, 'home-375.png'), fullPage: false }); } catch {}
    await page.setViewportSize({ width: 1440, height: 900 }); await sleep(400);
    try { await page.screenshot({ path: path.join(SHOT_DIR, 'home-1440.png'), fullPage: false }); } catch {}
    home.links = await extractLinks(page);
  }
  report.pages.home = home;

  // ---- discover key pages ----
  const seenPaths = new Set([new URL(CO.start).pathname]);
  const keyPages = [];
  for (const l of (home.links || [])) {
    if (!isFirstParty(l.href)) continue;
    let pth; try { pth = new URL(l.href).pathname; } catch { continue; }
    if (seenPaths.has(pth)) continue;
    const cls = classifyKeyPage(l.href, l.text);
    if (cls) { seenPaths.add(pth); keyPages.push({ url: stripHash(l.href), kind: cls, text: l.text }); }
    if (keyPages.length >= 7) break;
  }
  report.keyPagesDiscovered = keyPages;

  for (const kp of keyPages) {
    const nav = await gotoSafe(page, kp.url, kp.kind);
    const pobj = { url: kp.url, kind: kp.kind, nav };
    if (nav.ok) {
      pobj.meta = await extractMeta(page);
      pobj.axe = await runAxe(page);
      pobj.responsive = [await checkOverflow(page, 375)];
      await page.setViewportSize({ width: 1440, height: 900 }); await sleep(300);
      pobj.links = await extractLinks(page);
    }
    report.pages[kp.kind + ':' + new URL(kp.url).pathname] = pobj;
    await sleep(800); // polite pacing between pages
  }

  // ---- link checking (first-party + external), throttled, robots-respecting ----
  const linkMap = new Map(); // url -> {sources:Set, text}
  const allPageLinks = [];
  for (const p of Object.values(report.pages)) if (p.links) for (const l of p.links) allPageLinks.push({ ...l, from: p.url });
  for (const l of allPageLinks) {
    const u = stripHash(l.href);
    if (!/^https?:/i.test(u)) continue;
    if (!linkMap.has(u)) linkMap.set(u, { sources: new Set(), text: l.text });
    linkMap.get(u).sources.add(l.from);
  }
  const firstPartyLinks = [...linkMap.keys()].filter(isFirstParty);
  const externalLinks = [...linkMap.keys()].filter(u => !isFirstParty(u));
  // cap
  const toCheckFP = firstPartyLinks.slice(0, 80);
  const toCheckEXT = externalLinks.slice(0, 40);
  async function checkLink(u) {
    const skipped = robotsBlocks(disallows, u);
    if (skipped) return { url: u, firstParty: isFirstParty(u), skipped: 'robots-disallow', sources: [...linkMap.get(u).sources] };
    let status = 0, finalUrl = u, method = 'HEAD', err = null;
    try {
      let r = await nodeFetch(u, { method: 'HEAD', headers: { 'user-agent': UA } });
      if (r.status === 405 || r.status === 501 || r.status === 403) { r = await nodeFetch(u, { method: 'GET', headers: { 'user-agent': UA } }); method = 'GET'; }
      status = r.status; finalUrl = r.finalUrl || u;
      // follow one redirect hop to record final status
      if (status >= 300 && status < 400 && r.headers.location) {
        try {
          const loc = new URL(r.headers.location, u).toString();
          const r2 = await nodeFetch(loc, { method: 'GET', headers: { 'user-agent': UA } });
          status = r2.status; finalUrl = loc; method += '->GET';
        } catch {}
      }
    } catch (e) { err = String(e.message || e); }
    return { url: u, firstParty: isFirstParty(u), status, finalUrl, method, error: err, sources: [...linkMap.get(u).sources].slice(0, 4), text: linkMap.get(u).text };
  }
  const linkResults = [];
  for (const u of toCheckFP) { linkResults.push(await checkLink(u)); await sleep(300); }
  for (const u of toCheckEXT) { linkResults.push(await checkLink(u)); await sleep(300); }
  report.links = linkResults;
  report.linkCounts = { firstPartyTotal: firstPartyLinks.length, externalTotal: externalLinks.length, checkedFP: toCheckFP.length, checkedEXT: toCheckEXT.length };

  // ---- network + console summary ----
  const fpFailures = requests.filter(r => r.firstParty && (r.status === 0 || r.status >= 400));
  const extFailures = requests.filter(r => !r.firstParty && (r.status === 0 || r.status >= 400));
  // dedupe by url
  const dedupe = (arr) => { const m = new Map(); for (const r of arr) if (!m.has(r.url)) m.set(r.url, r); return [...m.values()]; };
  report.network = {
    totalRequests: requests.length,
    firstPartyFailures: dedupe(fpFailures).slice(0, 40),
    thirdPartyFailures: dedupe(extFailures).slice(0, 40).map(r => ({ url: r.url, status: r.status, error: r.error, onPage: r.onPage })),
    mixedContent: dedupe(requests.filter(r => /^http:\/\//i.test(r.url))).map(r => r.url).slice(0, 20),
    largestFirstParty: dedupe(requests.filter(r => r.firstParty && r.bytes)).sort((a, b) => b.bytes - a.bytes).slice(0, 12).map(r => ({ url: r.url, kb: Math.round(r.bytes / 102.4) / 10, type: r.type })),
  };
  report.console = { errors: consoleMsgs.filter(m => m.type === 'error').slice(0, 40), warnings: consoleMsgs.filter(m => m.type === 'warning').slice(0, 25), pageErrors: pageErrors.slice(0, 20) };

  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(EV_DIR, key + '.json'), JSON.stringify(report, (k, v) => (v instanceof Set ? [...v] : v), 2));
  console.log(`[${key}] done. pages=${Object.keys(report.pages).length} reqs=${requests.length} fpFail=${report.network.firstPartyFailures.length} extFail=${report.network.thirdPartyFailures.length} axeHome=${Array.isArray(home.axe) ? home.axe.length : 'err'} consoleErr=${report.console.errors.length} links=${linkResults.length}`);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
