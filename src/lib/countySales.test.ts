import { describe, expect, it } from 'vitest';
import { COUNTY_SALES, upcomingCountySales } from './countySales';
import { STATES } from './regions';
import { COUNTY_OFFICES } from './countyOffices';

describe('upcoming county tax sales', () => {
  it('link only to the county’s own HTTPS .gov site, with real dates in order', () => {
    for (const s of COUNTY_SALES) {
      expect(STATES.find((x) => x.code === s.state)?.counties, s.id).toContain(s.county);
      for (const u of [s.saleUrl, s.listUrl].filter((x): x is string => !!x)) {
        const url = new URL(u);
        expect(url.protocol, u).toBe('https:');
        // The county's .gov site, or an official site the county offices list already links (a Texas appraisal district).
        const official = Object.values(COUNTY_OFFICES[`${s.state}/${s.county}`] ?? {}).map((o) => new URL(o.url).hostname);
        expect(/\.gov$/.test(url.hostname) || official.includes(url.hostname), u).toBe(true);
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
      if (s.registerDay) expect(s.registerDay, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(COUNTY_SALES.map((s) => s.id)).size).toBe(COUNTY_SALES.length);
  });

  it('shows a sale until it ends, soonest first, and only the chosen county on its own page', () => {
    const before = new Date('2026-10-05T17:00:00Z');
    // Texas sales are checked separately below, so new ones can be added without rewriting these lists.
    const ids = (now: Date, state?: 'CA' | 'UT') => upcomingCountySales(now, { state }).map((s) => s.id).filter((id) => !id.startsWith('tx-'));
    expect(ids(before)).toEqual(['az-mohave-2026-otc', 'ca-los-angeles-2026B', 'az-cochise-2026-otc', 'ca-los-angeles-2026B-follow-up', 'ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    // The visitor's state comes first.
    expect(ids(before, 'UT').slice(0, 3)).toEqual(['ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    // Gone once over: Mohave's offers close Nov 30 and LA's October sale ends Oct 20 at noon.
    expect(ids(new Date('2026-12-01T08:00:00Z'))).toEqual(['az-cochise-2026-otc', 'ca-los-angeles-2026B-follow-up', 'ut-davis-2027', 'ut-utah-2027', 'ut-salt-lake-2027']);
    expect(ids(new Date('2027-05-28T07:00:00Z'))).toEqual([]);
    expect(upcomingCountySales(before, { state: 'CA', county: 'Orange' })).toEqual([]);
    expect(upcomingCountySales(before, { state: 'CA', county: 'Los Angeles' })).toHaveLength(2);
  });

  it('lists Texas sales soonest first and drops each once it ends', () => {
    const now = new Date('2026-10-06T17:00:00Z');
    const tx = upcomingCountySales(now, { state: 'TX' }).filter((s) => s.state === 'TX');
    expect(tx.length).toBeGreaterThan(0);
    for (let i = 1; i < tx.length; i++) expect(Date.parse(tx[i].startsAt)).toBeGreaterThanOrEqual(Date.parse(tx[i - 1].startsAt));
    expect(upcomingCountySales(now, { state: 'TX' })[0].state).toBe('TX');
    const after = upcomingCountySales(new Date('2026-11-04T07:00:00Z'), { state: 'TX' }).map((s) => s.id);
    expect(after).not.toContain('tx-tarrant-2026-11');
    expect(after).toContain('tx-travis-2026-12');
  });
});
