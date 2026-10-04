// Owner's rule: page content spans the full page width. No box or text block may be held to part of the page.
// Only these keep a width limit: dialogs, chat bubbles and the home page's centered hero and search bar.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ALLOWED = ['.role-dialog', '.track-dialog', '.bubble', '.hero-inner', '.hero-band .hero-inner', '.simple-hero .hero-inner', '.simple-search', '.search-top .searchbar', '.browse'];

describe('full-width pages', () => {
  it('caps no page content with a fixed max-width', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const capped: string[] = [];
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim().replace(/^@media[^{]*$/, '');
      if (!/max-width:\s*[\d.]+(px|ch|em|rem)\s*[;}]?/.test(m[2])) continue;
      const sels = selector.split(',').map((s) => s.trim());
      if (sels.every((s) => ALLOWED.some((a) => s === a || s.startsWith(`${a} `) || s.startsWith(`${a}:`)))) continue;
      capped.push(selector);
    }
    expect(capped).toEqual([]);
  });
});
