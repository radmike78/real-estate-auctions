// The Census place names per state (src/data/places), for checking the cities an advertiser says they serve.
import az from '../src/data/places/az.json';
import ca from '../src/data/places/ca.json';
import nv from '../src/data/places/nv.json';
import ut from '../src/data/places/ut.json';
import type { StateCode } from '../src/lib/regions';

const NAMES: Record<StateCode, Set<string>> = {
  NV: new Set(nv.map((p) => p.name)),
  CA: new Set(ca.map((p) => p.name)),
  AZ: new Set(az.map((p) => p.name)),
  UT: new Set(ut.map((p) => p.name)),
};

export const isKnownCity = (state: StateCode, name: string) => NAMES[state]?.has(name) ?? false;
