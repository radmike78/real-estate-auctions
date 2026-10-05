// Cities, towns and other Census places in each covered state, with the county (or counties) each is in. From the
// U.S. Census Bureau (see src/data/places/README.md). Loaded only when someone picks a city, one state at a time.
import type { StateCode } from './regions';

export interface Place {
  /** The Census name without its type, e.g. "Henderson". */
  name: string;
  /** "city", "town", "CDP" (an unincorporated community the Census Bureau maps), etc. */
  type: string;
  /** Counties the place is in (a few cities span two; the visitor picks which part). */
  counties: string[];
  population?: number;
}

const LOADERS: Record<StateCode, () => Promise<{ default: Place[] }>> = {
  NV: () => import('../data/places/nv.json'),
  CA: () => import('../data/places/ca.json'),
  AZ: () => import('../data/places/az.json'),
  UT: () => import('../data/places/ut.json'),
  TX: () => import('../data/places/tx.json'),
};

const cache = new Map<StateCode, Promise<Place[]>>();

export function loadPlaces(state: StateCode): Promise<Place[]> {
  let p = cache.get(state);
  if (!p) {
    p = LOADERS[state]().then((m) => m.default);
    cache.set(state, p);
  }
  return p;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Places matching what someone typed: names that start with it first (largest first), then names that contain it.
 * Cities and towns come before unincorporated communities of the same size.
 */
export function matchPlaces(places: Place[], typed: string, limit = 8): Place[] {
  const q = norm(typed);
  if (!q) return [];
  const rank = (p: Place) => (p.type === 'CDP' ? 1 : 0);
  const byBig = (a: Place, b: Place) => rank(a) - rank(b) || (b.population ?? 0) - (a.population ?? 0) || a.name.localeCompare(b.name);
  const starts = places.filter((p) => norm(p.name).startsWith(q)).sort(byBig);
  const contains = places.filter((p) => !norm(p.name).startsWith(q) && norm(p.name).includes(q)).sort(byBig);
  return [...starts, ...contains].slice(0, limit);
}
