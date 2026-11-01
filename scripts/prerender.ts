// Crawlable pages: after `vite build`, writes a plain-HTML copy of each public page to dist/<path>/index.html,
// plus sitemap.xml and robots.txt. The app runs on #/ addresses, which search engines don't index, so each copy
// carries the page's text, its own title, description and canonical URL, and the same app script. When the app
// starts on one of these addresses it switches to the matching #/ page (src/main.tsx).
//
//   npx tsx scripts/prerender.ts [distDir]        SITE_URL sets the canonical host (default https://deedowl.com)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEARN_MODULES } from '../src/lib/learn';
import { LESSONS } from '../src/lib/lessons';
import type { LessonBlock } from '../src/lib/lessons/types';
import { PROPERTY_TOPICS } from '../src/lib/deep/propertyTopics';
import { STRATEGY_GUIDES, strategyOf } from '../src/lib/strategies';
import { PROPERTY_DEEP } from '../src/lib/deep/propertyDeep';
import { PRO_DEEP } from '../src/lib/deep/proDeep';
import { PRO_GUIDES } from '../src/lib/proGuide';
import { PATH } from '../src/lib/path';
import { LEARN_PATHS } from '../src/lib/learn';
import { CHAPTERS } from '../src/practice/dealJourney';
import { DRILLS } from '../src/practice/drills';
import { FIRST_DEAL, WORKSHEETS } from '../src/lib/toolkit';

const DIST = process.argv[2] ?? 'dist';
const SITE = (process.env.SITE_URL ?? 'https://deedowl.com').replace(/\/$/, '');
const STATES = 'Nevada, California, Arizona, Utah and Texas';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (items: readonly string[]) => (items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;
/** An in-app #/ link as its crawlable address. */
const pathOf = (hash: string) => {
  const [path, query] = hash.split('?');
  return '/' + path.replace(/^#\/?/, '').replace(/\/?$/, '/').replace(/^\/$/, '') + (query ? `?${query}` : '');
};

function block(b: LessonBlock): string {
  if (typeof b === 'string') return `<p>${esc(b)}</p>`;
  if ('list' in b) return list(b.list);
  if ('table' in b)
    return `<div class="table-wrap"><table class="lesson-table"><thead><tr>${b.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
  if ('links' in b) return `<ul>${b.links.map((x) => `<li>${link(x.url.startsWith('#/') ? pathOf(x.url) : x.url, x.label)}: ${esc(x.what)}</li>`).join('')}</ul>`;
  return `<h3>${esc(b.why.title)}</h3><h4>Why you would</h4>${list(b.why.yes.map((p) => `${p.who}: ${p.text}`))}<h4>Why you wouldn’t</h4>${list(b.why.no.map((p) => `${p.who}: ${p.text}`))}`;
}

export interface Page {
  path: string; // '/learn/red-flags/'
  title: string;
  description: string;
  body: string; // HTML inside <main>
  lastmod?: string;
}

const NAV = [
  ['/', 'Home'],
  ['/decide/', 'Decide'],
  ['/learn/', 'Learn'],
  ['/practice/', 'Practice'],
  ['/pros/', 'Your team'],
  ['/find-deals/', 'Find deals'],
  ['/analyze/', 'Analyze a deal'],
] as const;

export function pages(): Page[] {
  const out: Page[] = [];
  const home = `<h1>Become a real estate investor, step by step</h1><p>Learn it, practice it, then find and analyze real deals in ${STATES}. Free, with no sign-up. We teach the process; you buy directly from the official seller.</p><h2>Your path</h2><ol>${PATH.map((s) => `<li>${link(pathOf(s.href), s.label)}: ${esc(s.blurb)}</li>`).join('')}</ol><h2>Lessons</h2><ul>${LEARN_MODULES.map((m) => `<li>${link(pathOf(m.href ?? `#/learn/${m.key}`), m.title)}: ${esc(m.summary)}</li>`).join('')}</ul>`;
  out.push({ path: '/', title: 'DeedOwl · Learn real estate investing, step by step', description: `Free, step-by-step real estate investing: lessons, practice purchases, deal calculators and official sources for foreclosures, tax sales and bank-owned homes in ${STATES}.`, body: home });

  const modLink = (k: string) => {
    const m = LEARN_MODULES.find((x) => x.key === k)!;
    return `<li>${link(pathOf(m.href ?? `#/learn/${m.key}`), m.title)}: ${esc(m.summary)}</li>`;
  };
  const learn = `<h1>Learn real estate investing</h1><p>Plain-language lessons, in order, with the sources each one was written from.</p>${LEARN_PATHS.map((p) => `<h2>${esc(p.title)}</h2><p>${esc(p.what)}</p><ul>${p.keys.map(modLink).join('')}</ul>`).join('')}<h2>Property types in depth</h2><ul>${PROPERTY_TOPICS.map((t) => `<li>${link(`/learn/types/${t.slug}/`, t.title)}</li>`).join('')}</ul>`;
  out.push({ path: '/learn/', title: 'Learn real estate investing · DeedOwl', description: 'Free lessons on markets, property types, deal analysis, financing, forced sales, scams to avoid and benefits for veterans.', body: learn });

  for (const l of LESSONS) {
    const m = LEARN_MODULES.find((x) => x.key === l.key)!;
    const body = `<h1>${esc(m.title)}</h1><p>${esc(l.intro)}</p><h2>What you’ll learn</h2>${list(l.takeaways)}${l.sections.map((s) => `<h2>${esc(s.heading)}</h2>${s.blocks.map(block).join('')}`).join('')}${l.practice ? `<h2>Put it into practice</h2><p>${esc(l.practice)}</p>` : ''}<h2>Key terms</h2><dl>${l.terms.map((t) => `<dt>${esc(t.term)}</dt><dd>${esc(t.meaning)}</dd>`).join('')}</dl><h2>Sources</h2><ul>${l.sources.map((s) => `<li>${link(s.url, s.label)}</li>`).join('')}</ul><p>Last reviewed ${esc(l.reviewed)}.</p>`;
    out.push({ path: `/learn/${l.key}/`, title: `${m.title} · DeedOwl`, description: m.summary, body, lastmod: l.reviewed });
  }

  for (const t of PROPERTY_TOPICS) {
    const d = PROPERTY_DEEP[t.key];
    if (!d) continue;
    const body = `<h1>${esc(t.title)}</h1>${d.overview.map((p) => `<p>${esc(p)}</p>`).join('')}<h2>Who it suits</h2>${list(d.bestFor)}<h2>Who it doesn’t</h2>${list(d.notFor)}<h2>Real stories</h2>${d.stories.map((s) => `<h3>${esc(s.title)} (${esc(s.year)})</h3><p>${esc(s.happened)}</p><p><strong>Lesson:</strong> ${esc(s.lesson)} ${link(s.source.url, s.source.label)}</p>`).join('')}<h2>Costs</h2>${list(d.costs)}<h2>How people pay</h2>${list(d.money)}<h2>Check before you buy</h2>${list(d.checklist)}<h2>Sources</h2><ul>${d.sources.map((s) => `<li>${link(s.url, s.label)}</li>`).join('')}</ul>`;
    out.push({ path: `/learn/types/${t.slug}/`, title: `Investing in ${t.title.toLowerCase()} · DeedOwl`, description: `${t.title}: who they suit, what they cost, how people pay for them, and real stories of what went right and wrong.`, body });
  }

  out.push({ path: '/learn/strategies/', title: 'Ways to make money with real estate · DeedOwl', description: 'Renting, house hacking, flips, BRRRR, bank-owned homes, auctions, apartments and REITs: how each makes money and what goes wrong.', body: `<h1>Ways to make money with real estate</h1><ul>${STRATEGY_GUIDES.map((g) => `<li>${link(`/learn/strategies/${g.slug}/`, strategyOf(g).title)}: ${esc(strategyOf(g).what)}</li>`).join('')}</ul>` });
  for (const g of STRATEGY_GUIDES) {
    const s = strategyOf(g);
    const body = `<h1>${esc(s.title)}</h1><p>${esc(s.what)}</p><h2>How it makes money</h2>${list(g.makesMoney)}<h2>The honest risk</h2>${list([`Cash you need to start: ${s.risk.atRisk}`, `Worst realistic outcome: ${s.risk.worst}`, ...(s.risk.ongoing ? [`What you keep owing: ${s.risk.ongoing}`] : []), `How long a first deal takes: ${s.risk.time}`])}<h2>What goes wrong on a first deal</h2>${list(g.watchFor)}<h2>Your first steps</h2>${list(s.checklist.map((c) => c.text))}`;
    out.push({ path: `/learn/strategies/${g.slug}/`, title: `${s.title} · Ways to make money · DeedOwl`, description: s.what, body });
  }

  out.push({ path: '/pros/', title: 'Your real estate team · DeedOwl', description: 'Who helps with an investment purchase, when you need each one, how they’re paid and what to check before you hire.', body: `<h1>Your team</h1><ul>${PRO_GUIDES.map((g) => `<li>${link(`/pros/${g.key}/`, g.title)}: ${esc(g.summary)}</li>`).join('')}</ul>` });
  for (const g of PRO_GUIDES) {
    const d = PRO_DEEP[g.key];
    const body = `<h1>${esc(g.title)}</h1><p>${esc(g.does)}</p><h2>When you need one</h2>${list(g.when)}<h2>How to find one</h2>${list(g.find)}<h2>Questions to ask</h2>${list(g.ask)}${d ? `${d.overview.map((p) => `<p>${esc(p)}</p>`).join('')}<h2>How they’re paid</h2>${list(d.money)}<h2>Check before you hire</h2>${list(d.checklist)}<h2>Real stories</h2>${d.stories.map((s) => `<h3>${esc(s.title)} (${esc(s.year)})</h3><p>${esc(s.happened)}</p><p><strong>Lesson:</strong> ${esc(s.lesson)}</p>`).join('')}` : ''}`;
    out.push({ path: `/pros/${g.key}/`, title: `${g.title} · Your real estate team · DeedOwl`, description: g.summary, body });
  }

  for (const d of DRILLS) {
    const missions = d.missions
      .map((m) => {
        if (m.kind === 'facts') return `<h2>${esc(m.title)}</h2><ul>${m.lines.map((x) => `<li>${esc(x.label)}: ${esc(x.value)}</li>`).join('')}</ul><p>${esc(m.lesson)}</p>`;
        if (m.kind === 'estimate') return `<h2>${esc(m.title)}</h2><p>${esc(m.question)}</p>${list(m.items.map((x) => x.label))}<p>${esc(m.lesson)}</p>`;
        return `<h2>${esc(m.title)}</h2><p>${esc(m.question)}</p>${list(m.options.map((o) => `${o.label}${o.detail ? ` (${o.detail})` : ''}`))}<p>${esc(m.lesson)}</p>`;
      })
      .join('');
    const body = `<p>Simulation: a fictional property for practice.</p><h1>${esc(d.title)}</h1><p>${esc(d.teaser)}</p><p>${esc(d.where)}</p><ul>${d.facts.map((f) => `<li>${esc(f.label)}: ${esc(f.value)}</li>`).join('')}</ul>${missions}<h2>${esc(d.verdict.question)}</h2><p>Buy, investigate or pass? Work through the drill to see what an experienced investor would weigh.</p>`;
    out.push({ path: `/practice/drills/${d.id}/`, title: `${d.title} · Practice · DeedOwl`, description: `A free “Would you buy it?” practice drill: ${d.teaser}`, body });
  }
  out.push({
    path: '/practice/drills/',
    title: '“Would you buy it?” practice drills · DeedOwl',
    description: 'Free real estate practice drills for every kind of sale: value a property, check the rent, price the repairs, find the liens, run the numbers and decide.',
    body: `<h1>Would you buy it? Practice drills</h1><p>Simulations with fictional properties. Each one ends with buy, investigate or pass.</p><ul>${DRILLS.map((d) => `<li>${link(`/practice/drills/${d.id}/`, d.title)}: ${esc(d.teaser)}</li>`).join('')}</ul>`,
  });
  out.push({
    path: '/toolkit/',
    title: 'Free real estate investor toolkit · DeedOwl',
    description: 'A first-deal roadmap from first idea to closing, a buy box builder, worksheets to download, and free calculators and checklists.',
    body: `<h1>My plan: investor toolkit</h1><h2>Your first deal, step by step</h2><ol>${FIRST_DEAL.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ol><h2>Worksheets</h2>${WORKSHEETS.map((w) => `<h3>${esc(w.title)}</h3><p>${esc(w.intro)}</p>${list(w.items)}`).join('')}`,
  });

  const simple: [string, string, string][] = [
    ['/decide/', 'Decide your investing strategy', 'Nine questions about your money, time and goals point to the strategies that fit, each with its risks and a checklist.'],
    ['/practice/', 'Practice buying a property', 'Buy a fictional property step by step at a tax sale, foreclosure auction, bank-owned or short sale before you risk real money.'],
    ['/find-deals/', 'Find real estate deals', `Where to look for properties in each county of ${STATES}, starting with the official sellers.`],
    ['/analyze/', 'Analyze a real estate deal', 'Free calculators for a maximum bid, flips, rentals, tax lien certificates and commercial income, with what each number means.'],
    ['/learn/reading/', 'Recommended real estate investing books', 'Books worth reading for new investors, picked for plain, practical advice, with no get-rich-quick titles or seminar sales pitches.'],
    ['/homeowner-help/', 'Facing foreclosure? Free help', 'Free, trustworthy help for homeowners and renters facing foreclosure, scams to avoid, and how to claim surplus money after a sale.'],
    ['/about/', 'How DeedOwl works', 'What DeedOwl does and doesn’t do, where its information comes from, and how to use it safely.'],
    ['/bank-owned/', 'Bank-owned and government homes', `Where lenders, Fannie Mae, Freddie Mac, HUD and the VA list the homes they own in ${STATES}, and how buying one works.`],
    ['/short-sales/', 'Buying a short sale', 'How a short sale works, how long lender approval takes, and how to make an offer through a licensed agent.'],
    ['/pre-foreclosures/', 'Pre-foreclosures: notices of default and sale', 'What a recorded notice of default or sale means, how to follow one to its official sale, and what not to do.'],
    ['/business-assets/', 'Business closures and their property', 'How property from closing businesses is sold through courts, trustees, receivers and the sheriff, and how to buy from the official seller.'],
    ['/live/', 'Live tax sales', `Upcoming county tax sales and verified IRS sales in ${STATES}, with links to each county’s official list.`],
    ['/financing/', 'Financing your investment', 'Loan types for investors, what lenders check, and how to compare offers with a qualified lender.'],
    ['/guides/', 'Sale guides by state', `Step-by-step guides to tax sales, foreclosure auctions, HOA sales, IRS sales and bank-owned homes in ${STATES}.`],
    ['/privacy/', 'Privacy policy', 'What DeedOwl collects, why, how long it keeps it, and your choices.'],
    ['/terms/', 'Terms of use', 'The terms for using DeedOwl and for advertising on it.'],
  ];
  for (const [path, title, description] of simple) out.push({ path, title: `${title} · DeedOwl`, description, body: `<h1>${esc(title)}</h1><p>${esc(description)}</p>` });
  out.push({ path: '/practice/deal/', title: 'Build your first deal · DeedOwl', description: 'One fictional property, short interactive decisions, and a saved workbook from budget to ownership.', body: `<h1>Build your first deal</h1><p>Practice on fictional Cedar House. Learn to check evidence, compare funding, test costs, handle surprises and decide whether to proceed or pass.</p><ul>${CHAPTERS.map((c) => `<li>${link(`/practice/deal/${c.id}/`, c.title)}: ${esc(c.purpose)}</li>`).join('')}</ul><p>Finer details vary by location, financing and contract. Check current local rules before acting.</p>` });
  for (const c of CHAPTERS) out.push({ path: `/practice/deal/${c.id}/`, title: `${c.title} · Practice · DeedOwl`, description: `Fictional practice deal: ${c.purpose}`, body: `<h1>${esc(c.title)}</h1><p>Fictional practice: ${esc(c.purpose)}</p>${list(c.facts)}<p>${esc(c.local)}</p>${link('/practice/deal/', 'Build your first deal')}` });
  for (const [slug, title] of [['workbook', 'Your practice deal workbook'], ['specialties', 'Specialty investing challenges']]) out.push({ path: `/practice/deal/${slug}/`, title: `${title} · DeedOwl`, description: 'Build investment skills with fictional practice, not a real purchase approval.', body: `<h1>${title}</h1>${link('/practice/deal/', 'Open the practice deal')}` });
  // Every page is a normal path now: one without a crawlable copy is served by the app itself.
  return out;
}

export function render(template: string, p: Page): string {
  const canonical = `${SITE}${p.path}`;
  const nav = `<nav class="pre-nav"><a class="pre-logo" href="/"><img src="/logo.svg" alt="" width="32" height="32"> DeedOwl</a><ul>${NAV.map(([h, t]) => `<li>${link(h, t)}</li>`).join('')}</ul></nav>`;
  return template
    // Pages live in sub-folders, so every local file the template loads must be addressed from the site root.
    .replace(/(src|href)="\.?\/?(?!\/|https?:)([^"]+)"/g, (_m, attr: string, f: string) => `${attr}="/${f}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>\n    <link rel="canonical" href="${esc(canonical)}" />\n    <meta property="og:title" content="${esc(p.title)}" />\n    <meta property="og:description" content="${esc(p.description)}" />\n    <meta property="og:url" content="${esc(canonical)}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(p.description)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${nav}<main style="min-height:100vh"><noscript><p>This page’s tools need JavaScript. The lessons in Learn work without it.</p></noscript>${p.body}</main></div>`);
}

export function sitemap(all: Page[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all
    .map((p) => `  <url><loc>${esc(SITE + p.path)}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
}

if (process.argv[1]?.endsWith('prerender.ts')) {
  const template = readFileSync(join(DIST, 'index.html'), 'utf8');
  // The untouched app shell, served for pages without their own copy (server/app.ts): no home title or canonical.
  writeFileSync(join(DIST, 'app.html'), template);
  const all = pages();
  for (const p of all) {
    const dir = join(DIST, p.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), render(template, p));
  }
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap(all));
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`Prerendered ${all.length} pages, sitemap.xml and robots.txt in ${DIST}`);
}
