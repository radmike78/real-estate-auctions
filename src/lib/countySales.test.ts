import { describe, expect, it } from 'vitest';
import { COUNTY_SALES, upcomingCountySales } from './countySales';
import { STATES } from './regions';

describe('upcoming county tax sales', () => {
  it('link only to the county’s own HTTPS .gov site, with real dates in order', () => {
    for (const s of COUNTY_SALES) {
      expect(STATES.find((x) => x.code === s.state)?.counties, s.id).toContain(s.county);
      for (const u of [s.saleUrl, s.listUrl].filter((x): x is string => !!x)) {
        const url = new URL(u);
        expect(url.protocol, u).toBe('https:');
        expect(url.hostname, u).toMatch(/\.gov$/);
      }
      for (const d of [s.startsAt, s.endsAt, s.redeemBy, s.registerBy].filter((x): x is string => !!x)) {
        expect(d, s.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      }
      expect(Date.parse(s.endsAt)).toBeGreaterThan(Date.parse(s.startsAt));
      if (s.redeemBy) expect(Date.parse(s.redeemBy)).toBeLessThan(Date.parse(s.startsAt));
      if (s.registerBy) expect(Date.parse(s.registerBy)).toBeLessThan(Date.parse(s.startsAt));
      expect(s.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (s.listExpected) expect(s.listUrl, s.id).toBeNull();
      expect(s.datesOnly && s.startOnly, s.id).toBeFalsy();
    }
    expect(new Set(COUNTY_SALES.map((s) => s.id)).size).toBe(COUNTY_SALES.length);
  });

  it('shows a sale until it ends, soonest first, and only the chosen county on its own page', () => {
    const before = new Date('2026-10-05T17:00:00Z');
    const ids = (now: Date, state?: 'CA' | 'UT') => upcomingCountySales(now, { state }).map((s) => s.id);
    expect(ids(before)).toEqual(['az-mohave-2026-otc', 'ca-los-angeles-2026B', 'az-cochise-2026-otc', 'ca-los-angeles-2026B-follow-up', 'ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    // The visitor's state comes first.
    expect(ids(before, 'UT').slice(0, 3)).toEqual(['ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    // Gone once over: Mohave's offers close Nov 30 and LA's October sale ends Oct 20 at noon.
    expect(ids(new Date('2026-12-01T08:00:00Z'))).toEqual(['az-cochise-2026-otc', 'ca-los-angeles-2026B-follow-up', 'ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    expect(ids(new Date('2027-05-28T07:00:00Z'))).toEqual([]);
    expect(upcomingCountySales(before, { state: 'CA', county: 'Orange' })).toEqual([]);
    expect(upcomingCountySales(before, { state: 'CA', county: 'Los Angeles' })).toHaveLength(2);
  });
});
