// Where an advertiser's ads show: the ad areas they pay for, each a city or town (by its Census name) or a whole
// county (a "county bundle", every city and community in it). Separate from the areas they say they serve
// (serviceCounties and serviceCities on their profile), which are only shown on their profile.
//
// Each area is one unit of the plan's monthly price (one price for every area for now; size-based prices may come
// later). The caps in adPlans.ts are counted per city: a county bundle takes a spot in every city of its county.
import { countyName, stateByCode, type StateCode } from './regions';
import type { Pro } from './pros';

export interface AdArea {
  county: string;
  /** A city or town in that county; null for the whole county. */
  city: string | null;
}

/** Most ad areas one advertiser can hold. */
export const MAX_AD_AREAS = 25;

export const adAreaLabel = (a: AdArea) => (a.city ? `${a.city} (${countyName(a.county)})` : `All of ${countyName(a.county)}`);

const sameArea = (a: AdArea, b: AdArea) => a.county === b.county && a.city === b.city;

/**
 * Checks ad areas for a state. `placeCounties` (the server passes the Census lists) gives the counties a city is in, or
 * null when there's no such city; the browser offers only names from the list, so it can leave it out.
 */
export function validateAdAreas(
  raw: unknown,
  state: StateCode,
  placeCounties?: (state: StateCode, city: string) => string[] | null,
): { ok: true; areas: AdArea[] } | { ok: false; error: string } {
  const st = stateByCode(state);
  if (!st || !Array.isArray(raw)) return { ok: false, error: 'Choose at least one city or county.' };
  if (!raw.length) return { ok: false, error: 'Choose at least one city or county.' };
  if (raw.length > MAX_AD_AREAS) return { ok: false, error: `Choose up to ${MAX_AD_AREAS} areas.` };
  const areas: AdArea[] = [];
  for (const r of raw) {
    const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
    const county = o.county;
    const city = o.city === null || o.city === undefined || o.city === '' ? null : o.city;
    if (typeof county !== 'string' || !st.counties.includes(county)) return { ok: false, error: `Choose counties in ${st.name}.` };
    if (city !== null) {
      if (typeof city !== 'string' || city.length > 80 || /[\u0000-\u001f<>]/.test(city)) return { ok: false, error: 'Choose cities from the list.' };
      if (placeCounties && !(placeCounties(state, city) ?? []).includes(county)) return { ok: false, error: `${city} isn’t a ${st.name} city in ${countyName(county)}. Choose it from the list.` };
    }
    const a: AdArea = { county, city };
    if (areas.some((x) => sameArea(x, a))) return { ok: false, error: `${adAreaLabel(a)} is listed twice.` };
    areas.push(a);
  }
  for (const a of areas) {
    if (a.city && areas.some((x) => x.county === a.county && x.city === null)) {
      return { ok: false, error: `${a.city} is already part of ${adAreaLabel({ county: a.county, city: null })}. Remove one of them.` };
    }
  }
  return { ok: true, areas };
}

/**
 * Whether ads for these areas show to a visitor in this county (and city, when they chose one). A visitor who chose
 * only a county sees advertisers with any area in it.
 */
export const areasCover = (areas: AdArea[], county: string, city: string | null) =>
  areas.some((a) => a.county === county && (a.city === null || city === null || a.city === city));

/**
 * Advertisers whose listing and ads show to a visitor in this area: same state, and when the visitor chose a city (or
 * county), an ad area covering it. Everyone when the visitor hasn't chosen an area.
 */
export const prosInArea = <P extends Pick<Pro, 'state' | 'adAreas'>>(pros: P[], area: { state: StateCode; county: string | null; city: string | null } | null): P[] =>
  !area ? pros : pros.filter((p) => p.state === area.state && (!area.county || areasCover(p.adAreas ?? [], area.county, area.city)));

/**
 * The most of `others` that show in any one city of `area`. `null` stands for an advertiser who holds the whole state
 * (rows from before ad areas existed), counted everywhere. A whole county's busiest city is the one with the most
 * single-city holders, on top of everyone holding the whole county.
 */
export function peakIn(others: (AdArea[] | null)[], area: AdArea): number {
  const wide = (o: AdArea[] | null) => o === null || o.some((a) => a.county === area.county && a.city === null);
  const everywhere = others.filter(wide).length;
  const rest = others.filter((o): o is AdArea[] => !wide(o));
  if (area.city) return everywhere + rest.filter((o) => o.some((a) => a.county === area.county && a.city === area.city)).length;
  const perCity = new Map<string, number>();
  for (const o of rest) {
    for (const c of new Set(o.filter((a) => a.county === area.county && a.city).map((a) => a.city!))) perCity.set(c, (perCity.get(c) ?? 0) + 1);
  }
  return everywhere + Math.max(0, ...perCity.values());
}
