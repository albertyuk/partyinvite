// Pass-2 deep capture (Playwright): deeper crawl + link status, per-page SEO (duplicate
// titles/descriptions, alt coverage, heading hierarchy, JSON-LD), forms inventory,
// desktop + mobile axe, tap targets, extra responsive breakpoints, third-party inventory,
// and page text for copy analysis. Writes evidence2/<key>.deep.json.
import { chromium } from 'playwright';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const REPO = process.env.REPO_DIR || '/home/user/partyinvite';
const EV1 = path.join(REPO, 'qa-audit', 'evidence');
const EV2 = path.join(REPO, 'qa-audit', 'evidence2');
const key = process.argv[2];
const ev1 = JSON.parse(fs.readFileSync(path.join(EV1, key + '.json'), 'utf8'));
const START = ev1.start;
const SHOT = path.join(EV2, key);
fs.mkdirSync(SHOT, { recursive: true });

const registrable = (h) => h.toLowerCase().split('.').slice(-2).join('.');
const BASE_REG = registrable(new URL(START).host);
const isFP = (u) => { try { return registrable(new URL(u).host) === BASE_REG; } catch { return false; } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const stripHash = (u) => { try { const x = new URL(u); x.hash = ''; return x.toString(); } catch { return u; } };

const cache = new Map();
async function nodeFetch(url, { method = 'GET', headers = {}, body } = {}) {
  const ck = method + ' ' + url;
  if (method === 'GET' && cache.has(ck)) return cache.get(ck);
  const h = { ...headers }; delete h['accept-encoding']; delete h['host']; delete h[':authority'];
  const init = { method, headers: h, redirect: 'manual' }; if (body) init.body = body;
  const resp = await fetch(url, init);
  const buf = Buffer.from(await resp.arrayBuffer());
  const rh = {}; resp.headers.forEach((v, k) => rh[k] = v);
  const out = { status: resp.status, headers: rh, body: buf, finalUrl: resp.url };
  if (method === 'GET') cache.set(ck, out);
  return out;
}

const requests = [];
async function setup(browser) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
  await ctx.route('**/*', async (route) => {
    const req = route.request(); const url = req.url();
    if (!/^https?:/i.test(url)) { try { await route.abort(); } catch {} return; }
    try {
      const r = await nodeFetch(url, { method: req.method(), headers: { ...req.headers() }, body: req.postDataBuffer() || undefined });
      const rh = {}; for (const [k, v] of Object.entries(r.headers)) if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) rh[k] = v;
      requests.push({ url, host: (() => { try { return new URL(url).host; } catch { return ''; } })(), fp: isFP(url), status: r.status, type: r.headers['content-type'] || '', bytes: r.body.length });
      await route.fulfill({ status: r.status, headers: rh, body: r.body });
    } catch (e) { requests.push({ url, fp: isFP(url), status: 0, error: String(e.message || e) }); try { await route.abort(); } catch {} }
  });
  return ctx;
}

async function pageData(page) {
  return await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const attr = (s, a) => { const el = q(s); return el ? el.getAttribute(a) : null; };
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
    // heading hierarchy: any jump of >1 level going down the doc
    let hierarchyOk = true; for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) hierarchyOk = false;
    const imgs = [...document.querySelectorAll('img')];
    const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { const j = JSON.parse(s.textContent); return (j['@type'] || (Array.isArray(j) ? j.map(x => x['@type']) : null) || 'unknown'); } catch { return 'PARSE_ERROR'; } });
    const forms = [...document.querySelectorAll('form')].map(f => {
      const fields = [...f.querySelectorAll('input,select,textarea')].filter(el => !['hidden', 'submit', 'button'].includes(el.type)).map(el => {
        const id = el.id;
        const hasLabelFor = id && !!document.querySelector(`label[for="${CSS.escape(id)}"]`);
        const wrappedLabel = !!el.closest('label');
        return { tag: el.tagName.toLowerCase(), type: el.type || '', name: el.name || '', required: el.required, autocomplete: el.getAttribute('autocomplete') || '', ariaLabel: el.getAttribute('aria-label') || '', ariaLabelledby: el.getAttribute('aria-labelledby') || '', placeholder: el.getAttribute('placeholder') || '', labeled: hasLabelFor || wrappedLabel || !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby') };
      });
      return { action: f.getAttribute('action') || '', method: (f.getAttribute('method') || 'get').toLowerCase(), novalidate: f.hasAttribute('novalidate'), fieldCount: fields.length, fields };
    });
    return {
      title: document.title || '', titleLen: (document.title || '').length,
      metaDescription: attr('meta[name="description"]', 'content'), metaDescriptionLen: (attr('meta[name="description"]', 'content') || '').length,
      canonical: attr('link[rel="canonical"]', 'href'), robotsMeta: attr('meta[name="robots"]', 'content'),
      lang: document.documentElement.getAttribute('lang'), viewportMeta: attr('meta[name="viewport"]', 'content'),
      h1: [...document.querySelectorAll('h1')].map(h => (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100)),
      h1Count: document.querySelectorAll('h1').length, headingLevels: headings, headingHierarchyOk: hierarchyOk,
      imgTotal: imgs.length, imgMissingAlt: imgs.filter(i => !i.hasAttribute('alt')).length, imgEmptyAlt: imgs.filter(i => i.getAttribute('alt') === '').length,
      jsonld, jsonldCount: jsonld.length,
      ogCount: document.querySelectorAll('meta[property^="og:"]').length, twitterCount: document.querySelectorAll('meta[name^="twitter:"]').length,
      forms, formCount: forms.length,
      headSyncScripts: document.head ? [...document.head.querySelectorAll('script[src]')].filter(s => !s.async && !s.defer && s.type !== 'module').length : 0,
      headStylesheets: document.head ? document.head.querySelectorAll('link[rel="stylesheet"]').length : 0,
      text: (document.body ? document.body.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 9000),
    };
  });
}

async function runAxe(page, tags) {
  try {
    await page.addScriptTag({ path: AXE_PATH });
    return await page.evaluate(async (t) => {
      const r = await axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: t } });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length, help: v.help, nodes: v.nodes.slice(0, 3).map(n => ({ target: n.target, summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 200) })) }));
    }, tags);
  } catch (e) { return { error: String(e.message || e) }; }
}

async function tapTargetsAndOverflow(page, width) {
  await page.setViewportSize({ width, height: 850 }); await sleep(400);
  return await page.evaluate((w) => {
    const de = document.documentElement;
    const scrollW = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
    const overflow = scrollW - de.clientWidth;
    const small = [...document.querySelectorAll('a[href],button,[role="button"],input,select')].map(el => { const r = el.getBoundingClientRect(); return { el, r }; })
      .filter(({ r }) => r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24));
    const tiny = small.slice(0, 10).map(({ el, r }) => ({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40) }));
    return { width: w, overflowPx: overflow, tinyTapCount: small.length, tinyTapExamples: tiny };
  }, width);
}

async function goto(page, url) {
  try { const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await sleep(1000); return { ok: true, status: r ? r.status() : null, finalUrl: page.url() }; }
  catch (e) { return { ok: false, error: String(e.message || e).split('\n')[0] }; }
}

function robotsBlocks(dis, url) { try { const p = new URL(url).pathname; return dis.some(d => p.startsWith(d)); } catch { return false; } }

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await setup(browser);
  const page = await ctx.newPage();
  const out = { key, name: ev1.name, start: START, checkedAt: new Date().toISOString(), pages: {}, links: [], forms: [], thirdParty: {}, mobileAxe: {}, responsiveExtra: {}, duplicates: {} };

  // robots disallow from pass1
  const dis = [];
  try { const rb = ev1.robots?.sample || ''; for (const raw of rb.split('\n')) { const m = raw.replace(/#.*/, '').trim().match(/^disallow:\s*(.+)$/i); if (m) dis.push(m[1].trim()); } } catch {}

  // primary set: home + pass1 key pages; then BFS a few more
  const primary = [START, ...(ev1.keyPagesDiscovered || []).map(k => k.url)];
  const seen = new Set(); const queue = [];
  for (const u of primary) { const s = stripHash(u); if (!seen.has(s)) { seen.add(s); queue.push({ url: s, primary: true }); } }
  const MAX_RENDER = 15;
  const allLinks = new Map(); // url -> Set(sources)
  let rendered = 0;

  while (queue.length && rendered < MAX_RENDER) {
    const item = queue.shift();
    const nav = await goto(page, item.url);
    rendered++;
    const rec = { url: item.url, primary: item.primary, nav };
    if (nav.ok) {
      const d = await pageData(page);
      rec.data = d;
      // desktop axe on all rendered pages
      rec.axe = await runAxe(page, ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']);
      // collect links
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ href: a.href, text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), nav: !!a.closest('nav,header,footer') })));
      for (const l of links) {
        const su = stripHash(l.href); if (!/^https?:/i.test(su)) continue;
        if (!allLinks.has(su)) allLinks.set(su, new Set());
        allLinks.get(su).add(item.url);
        // enqueue new same-origin pages (BFS) until cap
        if (isFP(su) && !seen.has(su) && rendered + queue.length < MAX_RENDER) {
          const pth = (() => { try { return new URL(su).pathname; } catch { return ''; } })();
          if (pth && pth !== '/' && !/\.(pdf|zip|png|jpg|jpeg|webp|svg|mp4|xml|json)$/i.test(pth)) { seen.add(su); queue.push({ url: su, primary: false }); }
        }
      }
      if (Array.isArray(d.forms) && d.forms.length) out.forms.push({ page: item.url, forms: d.forms });
    }
    out.pages[item.url] = rec;
    await sleep(500);
  }

  // mobile axe + extra responsive on home + first 3 primary pages
  const mobilePages = Object.values(out.pages).filter(p => p.primary && p.nav.ok).slice(0, 4);
  for (const p of mobilePages) {
    await goto(page, p.url);
    out.mobileAxe[p.url] = await runAxe(page, ['wcag2a', 'wcag2aa', 'wcag21aa']); // after setting mobile viewport below
    // extra breakpoints
    const res = [];
    for (const w of [320, 390, 414]) res.push(await tapTargetsAndOverflow(page, w));
    out.responsiveExtra[p.url] = res;
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  // re-run mobile axe properly at 375 for home
  await goto(page, START); await page.setViewportSize({ width: 375, height: 812 }); await sleep(500);
  out.mobileAxe[START] = await runAxe(page, ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']);
  try { await page.screenshot({ path: path.join(SHOT, 'home-320.png') }); } catch {}
  await page.setViewportSize({ width: 320, height: 720 }); await sleep(400);
  try { await page.screenshot({ path: path.join(SHOT, 'home-320-narrow.png') }); } catch {}

  // duplicate titles/descriptions across rendered pages
  const titles = {}, descs = {};
  for (const p of Object.values(out.pages)) { if (!p.data) continue; const t = p.data.title || ''; const de = p.data.metaDescription || ''; (titles[t] = titles[t] || []).push(p.url); if (de) (descs[de] = descs[de] || []).push(p.url); }
  out.duplicates.titles = Object.entries(titles).filter(([, v]) => v.length > 1).map(([t, v]) => ({ title: t.slice(0, 80), pages: v }));
  out.duplicates.descriptions = Object.entries(descs).filter(([, v]) => v.length > 1).map(([d, v]) => ({ desc: d.slice(0, 80), pages: v }));

  // deep link status check (throttled, robots-respecting)
  const fp = [...allLinks.keys()].filter(isFP);
  const ext = [...allLinks.keys()].filter(u => !isFP(u));
  const checkFP = fp.slice(0, 180), checkEXT = ext.slice(0, 60);
  async function check(u) {
    if (robotsBlocks(dis, u)) return { url: u, fp: isFP(u), skipped: 'robots' };
    let status = 0, finalUrl = u, err = null, method = 'HEAD';
    try {
      let r = await nodeFetch(u, { method: 'HEAD', headers: { 'user-agent': UA } });
      if ([403, 405, 501].includes(r.status)) { r = await nodeFetch(u, { method: 'GET', headers: { 'user-agent': UA } }); method = 'GET'; }
      status = r.status; finalUrl = r.finalUrl || u;
      if (status >= 300 && status < 400 && r.headers.location) { try { const loc = new URL(r.headers.location, u).toString(); const r2 = await nodeFetch(loc, { method: 'GET', headers: { 'user-agent': UA } }); status = r2.status; finalUrl = loc; method += '->GET'; } catch {} }
    } catch (e) { err = String(e.message || e); }
    return { url: u, fp: isFP(u), status, finalUrl, method, error: err, sources: [...allLinks.get(u)].slice(0, 3) };
  }
  const linkResults = [];
  for (const u of checkFP) { linkResults.push(await check(u)); await sleep(200); }
  for (const u of checkEXT) { linkResults.push(await check(u)); await sleep(200); }
  out.links = linkResults;
  out.linkStats = { fpDiscovered: fp.length, extDiscovered: ext.length, fpChecked: checkFP.length, extChecked: checkEXT.length };

  // third-party inventory
  const tp = {};
  for (const r of requests) if (!r.fp && r.host) tp[r.host] = (tp[r.host] || 0) + 1;
  out.thirdParty = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([host, n]) => ({ host, requests: n }));
  out.requestTotal = requests.length;
  out.mixedContent = [...new Set(requests.filter(r => /^http:\/\//i.test(r.url)).map(r => r.url))].slice(0, 20);

  fs.writeFileSync(path.join(EV2, key + '.deep.json'), JSON.stringify(out, null, 2));
  const nonOk = linkResults.filter(l => l.status && (l.status === 0 || l.status >= 400));
  console.log(`[${key}] rendered=${rendered} pages=${Object.keys(out.pages).length} forms=${out.forms.length} linksChecked=${linkResults.length} linkNon200=${nonOk.length} dupTitles=${out.duplicates.titles.length} thirdPartyHosts=${out.thirdParty.length} reqTotal=${out.requestTotal}`);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
