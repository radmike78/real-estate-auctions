import { describe, expect, it } from 'vitest';
import { AD_SPOTS, cleanSpots, DEFAULT_SPOTS, spotCategories, spotsOn } from './adSpots';
import { CATEGORIES } from './pros';

describe('Mentor Connect ad spots', () => {
  it('starts with the spots that were already live, and every other spot off', () => {
    expect(spotsOn(DEFAULT_SPOTS).map((s) => s.key)).toEqual(['finddeals', 'analyze', 'toolkit']);
    expect(DEFAULT_SPOTS.analyze.categories).toBe('auto');
  });

  it('never offers a spot on pages for homeowners or business closures', () => {
    for (const s of AD_SPOTS) expect(s.key).not.toMatch(/homeowner|preforeclos|surplus|business/i);
    for (const s of AD_SPOTS) for (const c of s.categories) expect(CATEGORIES[c], `${s.key}: ${c}`).toBeTruthy();
    expect(new Set(AD_SPOTS.map((s) => s.key)).size).toBe(AD_SPOTS.length);
  });

  it('cleans saved settings: unknown spots and kinds of professionals are dropped, "automatic" only where it exists', () => {
    const s = cleanSpots({ lesson: { on: true, categories: ['cpa', 'cpa', 'x'] }, deals: { on: true, categories: 'auto' }, homeowner: { on: true }, __proto__: { on: true } });
    expect(s.lesson).toEqual({ on: true, categories: ['cpa'] });
    expect(s.deals.categories).not.toBe('auto');
    expect(s).not.toHaveProperty('homeowner');
    expect(Object.keys(s)).toEqual(AD_SPOTS.map((x) => x.key));
    expect(cleanSpots('nonsense')).toEqual(DEFAULT_SPOTS);
  });

  it('shows the owner’s list, the page’s own pick on "automatic", and nothing when off', () => {
    const s = cleanSpots({ analyze: { on: true, categories: 'auto' }, toolkit: { on: true, categories: ['insurance'] }, lesson: { on: false, categories: ['cpa'] } });
    expect(spotCategories(s, 'analyze', ['contractor'])).toEqual(['contractor']);
    expect(spotCategories(s, 'analyze', [])).toEqual([]);
    expect(spotCategories(s, 'toolkit', ['agent'])).toEqual(['insurance']);
    expect(spotCategories(s, 'lesson')).toEqual([]);
    expect(spotCategories(s, 'no-such-spot')).toEqual([]);
  });
});
