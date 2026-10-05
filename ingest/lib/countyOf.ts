// Which county a sale is in, from the city the IRS lists and (when that's not enough) a county the ad names. Uses the
// Census place lists the site already ships (src/data/places) and the county names in src/lib/regions.ts.
import az from '../../src/data/places/az.json';
import ca from '../../src/data/places/ca.json';
import nv from '../../src/data/places/nv.json';
import ut from '../../src/data/places/ut.json';
import tx from '../../src/data/places/tx.json';
import { STATES } from '../../src/lib/regions';

type Code = 'NV' | 'CA' | 'AZ' | 'UT' | 'TX';
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const PLACES: Record<Code, Map<string, string[]>> = { NV: index(nv), CA: index(ca), AZ: index(az), UT: index(ut), TX: index(tx) };
function index(places: { name: string; counties: string[] }[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const p of places) m.set(norm(p.name), [...new Set([...(m.get(norm(p.name)) ?? []), ...p.counties])]);
  return m;
}

/** Counties of the state named in the text ("San Bernardino County"), longest names first so "Santa Cruz" isn't read as "Cruz". */
function countiesNamed(state: Code, text: string): string[] {
  const t = ` ${norm(text)} `;
  const names = [...(STATES.find((s) => s.code === state)?.counties ?? [])].sort((a, b) => b.length - a.length);
  const found: string[] = [];
  for (const c of names) {
    const n = norm(c);
    if (t.includes(` ${n} county `) || (c === 'Carson City' && t.includes(' carson city '))) found.push(c);
  }
  return found;
}

/**
 * The county, or null when it can't be told for sure: the city's county when the city is in just one; otherwise the
 * one county the ad names (in the location or the text) that fits.
 */
export function countyOf(state: Code, city: string, text: string): string | null {
  const inCity = countiesNamed(state, city);
  if (inCity.length === 1) return inCity[0];
  const byPlace = PLACES[state].get(norm(city)) ?? [];
  if (byPlace.length === 1) return byPlace[0];
  const named = countiesNamed(state, text).filter((c) => !byPlace.length || byPlace.includes(c));
  return named.length === 1 ? named[0] : null;
}
