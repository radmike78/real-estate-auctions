// Owner's rule: page content spans the full page width. No box or text block may be held to part of the page.
// Only these keep a width limit: dialogs, chat bubbles and the home page's centered hero and search bar.
import { readdirSync, readFileSync } from 'node:fs';
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

// Owner's rule: no small text. Nothing on the site is set below 14px (0.8rem at the 16px base is the floor, and only for labels).
describe('no small text', () => {
  it('sets no font-size below 0.8rem or 13px in any stylesheet', () => {
    const dir = new URL('../src/styles/', import.meta.url);
    const files = ['../src/styles.css', ...readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => `../src/styles/${f}`)];
    const small: string[] = [];
    for (const f of files) {
      const css = readFileSync(new URL(f, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/font-size:\s*(\d*\.?\d+)(rem|px)/g)) {
        const v = Number(m[1]);
        if ((m[2] === 'rem' && v < 0.8) || (m[2] === 'px' && v < 13)) small.push(`${f}: ${m[0]}`);
      }
    }
    expect(small).toEqual([]);
  });
});
