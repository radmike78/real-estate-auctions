import { describe, expect, it } from 'vitest';
import { pages, render, sitemap } from './prerender';

describe('crawlable pages', () => {
  const all = pages();
  it('covers every lesson and property type, with unique paths and real descriptions', () => {
    const paths = all.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/learn/red-flags/');
    expect(paths).toContain('/learn/types/condo/');
    for (const p of all) expect(p.description.length, p.path).toBeGreaterThan(40);
  });

  it('links only to real pages, so crawlers never hit a dead end', () => {
    // A pre-built copy, or a page the app serves at that path (the server sends the app for it).
    const paths = new Set(all.map((p) => p.path));
    const APP_ONLY = new Set(['/playbooks/', '/toolkit/buy-box/']);
    for (const p of all)
      for (const [, href] of p.body.matchAll(/href="(\/[^"]*)"/g)) {
        expect(href, `${p.path} → ${href}`).not.toContain('#');
        const bare = href.replace(/&amp;/g, '&').split('?')[0];
        expect(paths.has(bare) || APP_ONLY.has(bare), `${p.path} → ${href}`).toBe(true);
      }
  });

  it('roots local files, sets the canonical URL and escapes text', () => {
    const t = '<head><meta name="description" content="x" /><script src="theme.js"></script><script src="./assets/a.js"></script><title>t</title></head><div id="root"></div>';
    const html = render(t, { path: '/learn/x/', title: 'A & B', description: '<d>', body: '<p>hi</p>' });
    expect(html).toContain('src="/theme.js"');
    expect(html).toContain('src="/assets/a.js"');
    expect(html).toContain('<link rel="canonical" href="https://deedowl.com/learn/x/" />');
    expect(html).toContain('<title>A &amp; B</title>');
    expect(html).toContain('content="&lt;d&gt;"');
    expect(sitemap(all)).toContain('<loc>https://deedowl.com/learn/red-flags/</loc>');
  });
});
