// Saved searches for email alerts, shared by the browser (building one) and the server (matching it).
// A saved search is stored as a canonical target string, so the same search can't be saved twice:
//   search:tax?class=commercial&max=50000
// Only verified sources can be searched: today that's the Clark County Treasurer's tax-sale list.

import { classOfLandUse, type ClassFilter } from './propertyClass';

export interface SavedSearch {
  source: 'tax';
  cls: ClassFilter;
  maxBid: number | null; // highest minimum bid, whole dollars
}

const RE = /^search:tax\?class=(all|residential|commercial)(?:&max=([1-9]\d{0,8}))?$/;
export const SEARCH_TARGET_RE = RE;

export function searchTarget(s: SavedSearch): string {
  return `search:tax?class=${s.cls}${s.maxBid ? `&max=${Math.floor(s.maxBid)}` : ''}`;
}

export function parseSearchTarget(target: string): SavedSearch | null {
  const m = RE.exec(target);
  return m ? { source: 'tax', cls: m[1] as ClassFilter, maxBid: m[2] ? Number(m[2]) : null } : null;
}

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function searchLabel(s: SavedSearch): string {
  const what = s.cls === 'all' ? 'All tax-sale parcels' : s.cls === 'residential' ? 'Residential tax-sale parcels' : 'Commercial tax-sale parcels';
  return `${what}${s.maxBid ? `, minimum bid up to ${money(s.maxBid)}` : ''}`;
}

/** Whether a listing matches. Class comes from the Assessor land-use code; unclassified parcels match only "all". */
export function matchesSearch(s: SavedSearch, l: { minimumBid: number; landUseCode?: string | null }): boolean {
  if (s.maxBid !== null && l.minimumBid > s.maxBid) return false;
  return s.cls === 'all' || classOfLandUse(l.landUseCode) === s.cls;
}
