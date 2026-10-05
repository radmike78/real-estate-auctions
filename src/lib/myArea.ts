// The visitor's area: their state (myState.ts) plus, when they pick one, a city and the county it's in. Chosen when
// they start (the welcome) or from "Your area" in the header, and used across the site for local information and
// local professionals. Kept only in this browser. Changing the state elsewhere (the state picker) drops a city from
// another state.
import { useEffect, useState } from 'react';
import { getMyState, setMyState } from './myState';
import { countyName, stateByCode, type StateCode } from './regions';

export interface Area {
  state: StateCode;
  /** A city or town, as named by the Census Bureau (e.g. "Henderson"); null when only the state is chosen. */
  city: string | null;
  /** The county the city is in (e.g. "Clark"); for a city in more than one county, the one the visitor chose. */
  county: string | null;
}

const KEY = 'deedowl.area.v1';
const EVENT = 'deedowl:area';

function read(): Area | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Area> | null;
    const st = raw && stateByCode(String(raw.state));
    if (!raw || !st) return null;
    const city = typeof raw.city === 'string' && raw.city.trim() ? raw.city.slice(0, 80) : null;
    const county = typeof raw.county === 'string' && st.counties.includes(raw.county) ? raw.county : null;
    return { state: st.code as StateCode, city: city && county ? city : null, county };
  } catch {
    return null;
  }
}

/** The chosen area, or null. A city counts only while its state is still the visitor's state. */
export function getMyArea(): Area | null {
  const state = getMyState();
  if (!state) return null;
  const a = read();
  return a && a.state === state ? a : { state, city: null, county: null };
}

export function setMyArea(a: Area | null) {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: not kept, but this page still updates */
  }
  setMyState(a ? a.state : null);
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** The chosen area, kept in sync across the page (and with the state picker). */
export function useMyArea(): [Area | null, (a: Area | null) => void] {
  const [v, setV] = useState<Area | null>(getMyArea);
  useEffect(() => {
    const on = () => setV(getMyArea());
    window.addEventListener(EVENT, on);
    window.addEventListener('deedowl:state', on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener('deedowl:state', on);
    };
  }, []);
  return [v, setMyArea];
}

/** "Reno (Washoe County)", "Washoe County, Nevada" or "Nevada": for saying which area a list covers. */
export function areaLong(a: Area): string {
  const state = stateByCode(a.state)?.name ?? a.state;
  if (a.city && a.county) return `${a.city} (${countyName(a.county)})`;
  if (a.county) return `${countyName(a.county)}, ${state}`;
  return state;
}

/** "Henderson, NV", "Clark County, NV" or "Nevada". */
export function areaLabel(a: Area): string {
  if (a.city) return `${a.city}, ${a.state}`;
  if (a.county) return `${a.county} County, ${a.state}`;
  return stateByCode(a.state)?.name ?? a.state;
}
