import { describe, expect, it } from 'vitest';
import { adAreaLabel, areasCover, MAX_AD_AREAS, peakIn, prosInArea, validateAdAreas, type AdArea } from './adAreas';
import { capMessage, capProblem, CAPS, type Placement } from './adPlans';

const city = (county: string, c: string): AdArea => ({ county, city: c });
const all = (county: string): AdArea => ({ county, city: null });
// Stand-in for the server's Census lookup.
const places: Record<string, string[]> = { Henderson: ['Clark'], 'Las Vegas': ['Clark'], Reno: ['Washoe'], 'Boulder City': ['Clark'] };
const lookup = (_: string, name: string) => places[name] ?? null;

describe('ad areas', () => {
  it('accepts cities and whole counties from the advertiser’s state', () => {
    const v = validateAdAreas([{ county: 'Clark', city: 'Henderson' }, { county: 'Washoe', city: null }, { county: 'Clark', city: '' }].slice(0, 2), 'NV', lookup);
    expect(v).toEqual({ ok: true, areas: [city('Clark', 'Henderson'), all('Washoe')] });
    expect(validateAdAreas([{ county: 'Clark' }], 'NV', lookup)).toEqual({ ok: true, areas: [all('Clark')] }); // missing city = whole county
  });

  it('refuses empty, foreign, unknown, duplicated, overlapping or oversized lists', () => {
    const bad: unknown[] = [
      undefined, null, {}, 'Clark', [], [{ county: 'Maricopa', city: null }], [{ county: 'Clark', city: 'Reno' }], [{ county: 'Clark', city: 'Atlantis' }],
      [{ county: 'constructor', city: null }], [{ county: 'Clark', city: 5 }], [{ county: 'Clark', city: '<b>Henderson</b>' }],
      [all('Clark'), all('Clark')], [city('Clark', 'Henderson'), all('Clark')],
      Array.from({ length: MAX_AD_AREAS + 1 }, (_, i) => city('Clark', `Town ${i}`)),
    ];
    for (const raw of bad) expect(validateAdAreas(raw, 'NV', lookup).ok, JSON.stringify(raw)?.slice(0, 60)).toBe(false);
    expect(validateAdAreas([all('Clark')], 'XX' as never).ok).toBe(false);
  });

  it('shows ads to visitors in a covered city, or anywhere in the county when they chose only the county', () => {
    const areas = [city('Clark', 'Henderson'), all('Washoe')];
    expect(areasCover(areas, 'Clark', 'Henderson')).toBe(true);
    expect(areasCover(areas, 'Clark', 'Las Vegas')).toBe(false);
    expect(areasCover(areas, 'Clark', null)).toBe(true);
    expect(areasCover(areas, 'Washoe', 'Reno')).toBe(true);
    expect(areasCover(areas, 'Nye', null)).toBe(false);
    expect(adAreaLabel(all('Carson City'))).toBe('All of Carson City');
    expect(adAreaLabel(city('Clark', 'Henderson'))).toBe('Henderson (Clark County)');
  });

  it('counts the busiest city: a whole county counts in each of its cities', () => {
    const others = [[city('Clark', 'Henderson')], [city('Clark', 'Henderson')], [city('Clark', 'Las Vegas')], [all('Clark')], [all('Washoe')], null];
    // Henderson: 2 single-city + 1 county-wide + 1 whole-state (older row).
    expect(peakIn(others, city('Clark', 'Henderson'))).toBe(4);
    expect(peakIn(others, city('Clark', 'Las Vegas'))).toBe(3);
    expect(peakIn(others, city('Clark', 'Boulder City'))).toBe(2);
    expect(peakIn(others, all('Clark'))).toBe(4); // its busiest city is Henderson
    expect(peakIn(others, all('Nye'))).toBe(1); // only the whole-state row
  });
});

describe('caps per city', () => {
  const p = (id: string, tier: Placement['tier'], areas: AdArea[] | null, extra: Partial<Placement> = {}): Placement => ({ id, state: 'NV', category: 'agent', tier, topic: null, areas, ...extra });

  it(`holds ${CAPS.featured} Featured spots per category in each city, counting county bundles in every city`, () => {
    const current = [p('a', 'premium', [city('Clark', 'Henderson')]), p('b', 'premium', [all('Clark')])];
    expect(capProblem(current, p('new', 'premium', [city('Clark', 'Henderson')]))).toEqual({ kind: 'featured', cap: CAPS.featured, area: city('Clark', 'Henderson') });
    expect(capProblem(current, p('new', 'premium', [city('Clark', 'Las Vegas')]))).toBeNull(); // only one there (the county bundle)
    expect(capProblem(current, p('new', 'premium', [all('Clark')]))).toMatchObject({ kind: 'featured' }); // full in Henderson
    expect(capProblem(current, p('new', 'premium', [all('Washoe')]))).toBeNull();
    expect(capProblem(current, p('new', 'standard', [city('Clark', 'Henderson')]))).toBeNull(); // Rotating isn't Featured
    expect(capProblem(current, p('a', 'premium', [city('Clark', 'Henderson')]))).toBeNull(); // renewing their own spot
    expect(capProblem(current, p('new', 'premium', [city('Clark', 'Henderson')], { state: 'AZ' }))).toBeNull(); // another state
    expect(capProblem(current, p('new', 'premium', [city('Clark', 'Henderson')], { category: 'cpa' }))).toBeNull();
  });

  it(`lists ${CAPS.listing} per category per city, and names the full area`, () => {
    const current = Array.from({ length: CAPS.listing }, (_, i) => p(`r${i}`, 'standard', [city('Clark', i % 2 ? 'Henderson' : 'Las Vegas')]));
    expect(capProblem(current, p('new', 'standard', [city('Clark', 'Henderson')]))).toBeNull(); // 2 in Henderson
    const full = capProblem([...current, p('x', 'standard', [all('Clark')]), p('y', 'standard', [all('Clark')])], p('new', 'standard', [city('Clark', 'Henderson'), city('Clark', 'Las Vegas')]));
    expect(full).toEqual({ kind: 'listing', cap: CAPS.listing, area: city('Clark', 'Las Vegas') }); // 3 + 2 county bundles
    expect(capMessage(full!, 'agent')).toBe('The Real estate agents directory in Las Vegas (Clark County) is full right now: it lists up to 5 advertisers at a time. Choose another area, or try again later.');
  });

  it('counts rows from before ad areas everywhere in their state', () => {
    expect(capProblem([p('a', 'premium', null), p('b', 'premium', [])], p('new', 'premium', [city('Clark', 'Henderson')]))).toMatchObject({ kind: 'featured' });
  });
});

describe('who a visitor sees', () => {
  // Advertisers in two counties (and one in another state): each must show only where they paid to show.
  const pros = [
    { id: 'reno-agent', state: 'NV' as const, adAreas: [city('Washoe', 'Reno')] },
    { id: 'washoe-lender', state: 'NV' as const, adAreas: [all('Washoe')] },
    { id: 'henderson-agent', state: 'NV' as const, adAreas: [city('Clark', 'Henderson')] },
    { id: 'clark-title', state: 'NV' as const, adAreas: [all('Clark')] },
    { id: 'phoenix-agent', state: 'AZ' as const, adAreas: [city('Maricopa', 'Phoenix')] },
  ];
  const ids = (area: Parameters<typeof prosInArea>[1]) => prosInArea(pros, area).map((p) => p.id);
  it('shows a city visitor the advertisers covering that city, and no one else', () => {
    expect(ids({ state: 'NV', county: 'Washoe', city: 'Reno' })).toEqual(['reno-agent', 'washoe-lender']);
    expect(ids({ state: 'NV', county: 'Washoe', city: 'Sparks' })).toEqual(['washoe-lender']);
    expect(ids({ state: 'NV', county: 'Clark', city: 'Henderson' })).toEqual(['henderson-agent', 'clark-title']);
    expect(ids({ state: 'NV', county: 'Clark', city: 'Las Vegas' })).toEqual(['clark-title']);
  });
  it('shows a county visitor everyone in that county, a state visitor the whole state, and no area everyone', () => {
    expect(ids({ state: 'NV', county: 'Washoe', city: null })).toEqual(['reno-agent', 'washoe-lender']);
    expect(ids({ state: 'NV', county: null, city: null })).toEqual(['reno-agent', 'washoe-lender', 'henderson-agent', 'clark-title']);
    expect(ids({ state: 'AZ', county: 'Pima', city: 'Tucson' })).toEqual([]);
    expect(ids(null)).toHaveLength(5);
  });
});
