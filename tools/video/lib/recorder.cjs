// Shared recorder for the site walkthrough videos.
//
// Each video folder has a video.json (narration segments, caption lines and their measured
// durations) and a record.cjs that describes what happens on screen in each segment. This file
// runs the browser, lays the scenes on a timeline driven by the voiceover lengths, draws the
// captions, title card, badge and highlight on top of the real page, and writes out/timing.json
// so build.py can line the picture up with the narration.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OVERLAY_CSS = `
#vcap{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:1100px;width:max-content;z-index:99999;
  background:rgba(8,12,24,.86);color:#fff;font:600 26px/1.3 'Inter Variable',Inter,system-ui,sans-serif;padding:12px 24px;border-radius:14px;
  text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:opacity .25s;opacity:0;pointer-events:none}
#vcard{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;text-align:center;color:#fff;
  background:radial-gradient(900px 500px at 50% 35%,rgba(99,102,241,.45),transparent 70%),linear-gradient(160deg,#0b1020,#111a33 60%,#1b1240);
  transition:opacity .6s;opacity:0;pointer-events:none}
#vcard .k{font:500 22px/1 'JetBrains Mono Variable',monospace;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd;margin-bottom:22px}
#vcard h1{font:700 76px/1.05 'Space Grotesk Variable',sans-serif;margin:0 0 20px;letter-spacing:-.02em}
#vcard h1 span{background:linear-gradient(90deg,#22d3ee,#818cf8,#c084fc);-webkit-background-clip:text;color:transparent}
#vcard p{font:500 28px/1.4 'Inter Variable',Inter,sans-serif;color:#cbd5e1;margin:0}
#vbadge{position:fixed;top:84px;right:22px;z-index:99998;background:#fef3c7;color:#92400e;font:700 18px/1 'Inter Variable',Inter,sans-serif;
  padding:9px 14px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.25);opacity:0;transition:opacity .3s}
#vmark{position:fixed;inset:0;z-index:100001;display:none}
.vhl{outline:4px solid #22d3ee !important;outline-offset:4px;border-radius:12px;box-shadow:0 0 0 10px rgba(34,211,238,.18) !important}
html{scroll-behavior:smooth}`;

// Runs inside the page on every load.
function installOverlay(css) {
  const add = () => {
    if (document.getElementById('vcap')) return;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    for (const id of ['vcap', 'vcard', 'vbadge', 'vmark']) {
      const d = document.createElement('div');
      d.id = id;
      document.body.appendChild(d);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
  const $ = (id) => document.getElementById(id);
  window.__cap = (t) => { if (!t) { $('vcap').style.opacity = 0; return; } $('vcap').textContent = t; $('vcap').style.opacity = 1; };
  window.__card = (html) => { if (!html) { $('vcard').style.opacity = 0; return; } $('vcard').innerHTML = html; $('vcard').style.opacity = 1; };
  window.__badge = (t) => { if (!t) { $('vbadge').style.opacity = 0; return; } $('vbadge').textContent = t; $('vbadge').style.opacity = 1; };
  window.__mark = (c) => { $('vmark').style.background = c || ''; $('vmark').style.display = c ? 'block' : 'none'; };
  window.__hl = (el) => { document.querySelectorAll('.vhl').forEach((e) => e.classList.remove('vhl')); if (el) el.classList.add('vhl'); };
}

/**
 * Record one video.
 * @param {string} dir   the video folder (contains video.json)
 * @param {(api) => Promise<void>} scenes  drives the page; see the api object below
 */
async function record(dir, scenes) {
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8'));
  const segs = cfg.segments;
  if (segs.some((s) => !s.duration)) throw new Error('Missing durations: run `python3 tools/video/build.py durations <video>` first.');
  const { lead = 0.8, gap = 0.7, tail = 3.5 } = cfg.timing || {};
  const START = [];
  let t = lead;
  for (const s of segs) { START.push(t); t += s.duration + gap; }
  const DUR = segs.map((s) => s.duration);
  const TOTAL = START[START.length - 1] + DUR[DUR.length - 1] + tail;

  const out = path.join(dir, 'out');
  fs.mkdirSync(out, { recursive: true });
  const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/') + '#/';
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: path.join(out, 'raw'), size: { width: 1280, height: 720 } } });
  await ctx.addInitScript(() => { localStorage.setItem('fsf.role-ack.v1', '1'); });
  await ctx.addInitScript(installOverlay, OVERLAY_CSS);
  const tCtx = Date.now();
  const p = await ctx.newPage();
  const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

  let t0 = 0;
  const at = (sec) => sleep(t0 + sec * 1000 - Date.now());
  const field = (label) => p.getByLabel(label, { exact: true });
  const hlBox = (loc) => loc.evaluate((el) => window.__hl(el));
  const hl = (loc) =>
    loc.evaluate((el) => {
      const box = el.closest('.calc-field, .calc-max, .calc-kv, table, .calc-verdict, .calc-group, .drill-tile, section') || el;
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.__hl(box);
    });
  const typeInto = async (label, value, delay = 110) => {
    const f = field(label);
    await hl(f);
    await p.waitForTimeout(450);
    await f.click();
    await f.press('Control+A');
    await f.press('Backspace');
    await f.type(String(value), { delay });
  };

  const api = {
    page: p, base, START, DUR, TOTAL, at, field, hl, hlBox, typeInto,
    goto: (route) => p.goto(base + route),
    card: (html) => p.evaluate((h) => window.__card(h), html),
    badge: (text) => p.evaluate((x) => window.__badge(x), text),
    clearHighlight: () => p.evaluate(() => window.__hl(null)),
    scrollTo: (top) => p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top),
    /** Call once the opening frame is on screen; starts the narration clock. */
    start: async () => {
      await p.evaluate(() => document.fonts.ready);
      // Green flash marks real time in the recording so build.py can line up picture and sound.
      api.tg = Date.now();
      await p.evaluate(() => window.__mark('#00ff00'));
      await p.waitForTimeout(500);
      await p.evaluate(() => window.__mark(null));
      await p.waitForTimeout(500);
      t0 = Date.now();
      // Captions: each segment's lines share its duration in proportion to their length.
      const jobs = [];
      segs.forEach((s, i) => {
        const total = s.captions.reduce((n, l) => n + l.length, 0);
        let c = START[i];
        for (const l of s.captions) { jobs.push([c, l]); c += (l.length / total) * DUR[i]; }
        jobs.push([START[i] + DUR[i] + 0.05, null]);
      });
      (async () => { for (const [ct, l] of jobs) { await at(ct); await p.evaluate((x) => window.__cap(x), l).catch(() => {}); } })();
    },
  };

  await scenes(api);

  await at(TOTAL + 0.3);
  const tm = Date.now();
  await p.evaluate(() => window.__mark('#ff00ff'));
  await p.waitForTimeout(600);
  const video = p.video();
  await ctx.close();
  const raw = await video.path();
  const secs = (x) => (x - tCtx) / 1000;
  fs.writeFileSync(path.join(out, 'timing.json'), JSON.stringify({ raw, tg: secs(api.tg), t0: secs(t0), tm: secs(tm), total: TOTAL, start: START, durations: DUR }, null, 2));
  await b.close();
  console.log(`Recorded ${raw} (${TOTAL.toFixed(1)}s). Next: python3 tools/video/build.py render ${path.basename(dir)}`);
}

module.exports = { record };
