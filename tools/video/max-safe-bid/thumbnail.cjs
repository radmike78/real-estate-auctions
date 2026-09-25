// Renders out/thumbnail.png (1280x720) on top of the real calculator, using the site's fonts.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const out = path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  const base = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => localStorage.setItem('fsf.role-ack.v1', '1'));
  const p = await ctx.newPage();
  await p.goto(base + '#/calculator');
  const fill = (label, v) => p.getByLabel(label, { exact: true }).fill(String(v));
  await fill('Resale value after repairs', 350000);
  await fill('Repairs', 45000);
  await fill('Title search, attorney, quiet title', 3500);
  await fill('Getting possession', 2500);
  await fill('Monthly holding costs', 950);
  await fill('Check a bid', 221000);
  await p.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 250); });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = `#th{position:fixed;inset:0;z-index:99999;background:linear-gradient(90deg,#0b1020 0%,rgba(11,16,32,.97) 44%,rgba(11,16,32,.55) 62%,rgba(11,16,32,0) 78%)}
    #th .t{position:absolute;left:58px;top:92px;width:700px;color:#fff}
    #th .k{font:600 28px/1 'JetBrains Mono Variable',monospace;letter-spacing:.08em;color:#93c5fd;text-transform:uppercase;margin-bottom:24px}
    #th h1{font:700 104px/.95 'Space Grotesk Variable',sans-serif;margin:0;letter-spacing:-.035em}
    #th h1 span{background:linear-gradient(90deg,#22d3ee,#818cf8,#c084fc);-webkit-background-clip:text;color:transparent}
    #th .pill{display:inline-block;margin-top:36px;background:#dc2626;color:#fff;font:700 44px/1 'Space Grotesk Variable',sans-serif;padding:16px 28px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.45)}
    #th .free{position:absolute;left:58px;bottom:54px;background:#fef3c7;color:#92400e;font:800 30px/1 'Inter Variable',sans-serif;padding:12px 22px;border-radius:999px}`;
    document.head.appendChild(s);
    const d = document.createElement('div');
    d.id = 'th';
    d.innerHTML = `<div class="t"><div class="k">Foreclosure &amp; tax auctions</div><h1>What’s your<br><span>max bid?</span></h1><div class="pill">Know when to STOP</div></div><div class="free">FREE calculator · Las Vegas</div>`;
    document.body.appendChild(d);
    document.querySelector('.site-header').style.visibility = 'hidden';
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(out, 'thumbnail.png') });
  await b.close();
  console.log('wrote', path.join(out, 'thumbnail.png'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
