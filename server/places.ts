// The Census place names per state (src/data/places), for checking the cities an advertiser serves or advertises in.
import az from '../src/data/places/az.json';
import ca from '../src/data/places/ca.json';
import nv from '../src/data/places/nv.json';
import ut from '../src/data/places/ut.json';
import tx from '../src/data/places/tx.json';
import type { StateCode } from '../src/lib/regions';

/** Each place name and the counties it's in (a few names are used by places in more than one county). */
function index(places: { name: string; counties: string[] }[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const p of places) m.set(p.name, [...new Set([...(m.get(p.name) ?? []), ...p.counties])]);
  return m;
}

const PLACES: Record<StateCode, Map<string, string[]>> = { NV: index(nv), CA: index(ca), AZ: index(az), UT: index(ut), TX: index(tx) };

export const isKnownCity = (state: StateCode, name: string) => PLACES[state]?.has(name) ?? false;

/** The counties a city is in, or null when the state has no place by that name. */
export const placeCounties = (state: StateCode, name: string): string[] | null => PLACES[state]?.get(name) ?? null;
