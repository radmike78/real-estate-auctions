// Keeps the content inventory honest. If one of these fails, the message says what to check and how to record it.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { guideDocs } from '../../src/components/guideIndex';
import { FACTS } from '../../src/content/facts';
import { LISTING_HOSTS, SOURCES, sourceById, sourceForUrl } from '../../src/content/sources';
import { PLAYBOOKS } from '../../src/lib/playbooks';
import { SITE_PAGES } from '../../src/lib/siteStats';
import { loadReviews, pageHash, ROOT } from './ledger';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);

/** Every https:// link the site can show: literal links in the source, plus links built from data. */
function siteLinks(): Map<string, string> {
  const links = new Map<string, string>();
  for (const f of walk(join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.|[\\/]content[\\/]/.test(f))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/https:\/\/[A-Za-z0-9./?=_%:&#~+-]+/g)) links.set(m[0].replace(/[.,)]+$/, ''), relative(ROOT, f));
  }
  for (const d of guideDocs()) for (const s of d.sources) links.set(s.url, d.href);
  for (const p of PLAYBOOKS) for (const s of p.sources) if (s.url.startsWith('https://')) links.set(s.url, `playbook ${p.key}`);
  return links;
}

describe('source inventory (src/content/sources.ts)', () => {
  const links = siteLinks();

  it('lists every outside link the site shows', () => {
    const missing = [...links].filter(([u]) => !sourceForUrl(u)).map(([u, where]) => `${u}  (in ${where})`);
    expect(missing, 'Add these to src/content/sources.ts, with who publishes them and whether you have checked them').toEqual([]);
  });

  it('only lists sources the site still uses', () => {
    const unused = SOURCES.filter((s) => ![...links.keys()].some((u) => (s.prefix ? u.startsWith(s.url) : u === s.url))).map((s) => s.id);
    expect(unused, 'Remove these from src/content/sources.ts, or link them where the site relies on them').toEqual([]);
  });

  it('takes listings only from government, Fannie Mae/Freddie Mac, owning banks or the county’s named seller (CLAUDE.md)', () => {
    const bad = SOURCES.filter((s) => s.role === 'listing' && !LISTING_HOSTS.some((re) => re.test(new URL(s.url).hostname))).map((s) => s.url);
    expect(bad).toEqual([]);
  });

  it('has unique ids, https links and real dates', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      expect(s.url, s.id).toMatch(/^https:\/\//);
      if (s.checked) {
        expect(s.checked, s.id).toMatch(DATE);
        expect(s.checked <= today, `${s.id} checked in the future`).toBe(true);
      }
    }
  });
});

describe('fact inventory (src/content/facts.ts)', () => {
  it('ties every fact to listed sources that have been checked', () => {
    for (const f of FACTS) {
      expect(f.sources.length, f.id).toBeGreaterThan(0);
      for (const id of f.sources) {
        const s = sourceById(id);
        expect(s, `${f.id} cites unknown source ${id}`).toBeTruthy();
        expect(s!.checked, `${f.id} relies on ${id}, which hasn't been checked`).toBeTruthy();
      }
      expect(f.checked, f.id).toMatch(DATE);
    }
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length);
  });

  it('still finds each fact where the site states it (edited text needs a re-check)', () => {
    const lost = FACTS.flatMap((f) => f.where.filter((w) => !read(w.file).includes(w.text)).map((w) => `${f.id}: "${w.text}" no longer in ${w.file}`));
    expect(lost, 'This text changed. Check the new wording against the fact’s sources, then update the fact (text and date) in src/content/facts.ts').toEqual([]);
  });
});

describe('page reviews (src/content/reviews.json)', () => {
  const reviews = loadReviews();

  it('covers every public page', () => {
    const covered = new Set(reviews.flatMap((r) => r.files));
    const pages = readdirSync(join(ROOT, 'src/components')).filter((f) => f.endsWith('Page.tsx') && !/^(Admin|Advertiser|ApplicationConfirm)Page/.test(f));
    expect(pages.filter((f) => !covered.has(`src/components/${f}`)), 'Add these pages to src/content/reviews.json and review them').toEqual([]);
    const ids = new Set(reviews.map((r) => r.id));
    expect(Object.keys(SITE_PAGES).filter((k) => k !== 'other' && !ids.has(k))).toEqual([]);
  });

  it('has been reviewed since its words last changed', () => {
    const edited = reviews.filter((r) => pageHash(r.files) !== r.hash).map((r) => r.id);
    expect(
      edited,
      'These pages changed after their last content review. Check the changed text against its sources, then run: npm run content:reviewed -- ' + edited.join(' '),
    ).toEqual([]);
  });
});

describe('privacy page', () => {
  it('names every outside service that handles visitor or customer data', () => {
    const code = [...walk(join(ROOT, 'server')), ...walk(join(ROOT, 'deploy')), join(ROOT, 'vite.config.ts')]
      .filter((f) => !/\.test\./.test(f))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const privacy = read('src/components/PrivacyPage.tsx');
    const services: [RegExp, string][] = [
      [/api\.resend\.com/, 'Resend'],
      [/api\.postmarkapp\.com/, 'Postmark'],
      [/api\.stripe\.com/, 'Stripe'],
      [/r2\.cloudflarestorage\.com|TRUST_CLOUDFLARE/, 'Cloudflare'],
      [/tile\.openstreetmap\.org/, 'OpenStreetMap'],
    ];
    const unnamed = services.filter(([re, name]) => re.test(code) && !privacy.includes(name)).map(([, n]) => n);
    expect(unnamed, 'The site now uses these services: say so in the privacy policy (src/components/PrivacyPage.tsx)').toEqual([]);
  });
});
