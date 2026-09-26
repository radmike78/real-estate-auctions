// Residential vs. commercial. Follows the usual real-estate line: homes with 1–4 units (houses,
// condos, townhouses, duplexes to fourplexes) and land zoned for them are residential; apartments
// with 5+ units, stores, offices, industrial buildings, hotels and commercial land are commercial.

import type { PropertyType } from '../types';

export type PropertyClass = 'residential' | 'commercial';
export type ClassFilter = 'all' | PropertyClass;

export const CLASS_LABEL: Record<PropertyClass, string> = { residential: 'Residential', commercial: 'Commercial' };

export const RESIDENTIAL_TYPES: PropertyType[] = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Vacant Land'];
export const COMMERCIAL_TYPES: PropertyType[] = ['Apartments (5+ units)', 'Retail', 'Office', 'Industrial', 'Hotel / Motel', 'Commercial Land'];

export const classOfType = (t: PropertyType): PropertyClass => (COMMERCIAL_TYPES.includes(t) ? 'commercial' : 'residential');
export const typesFor = (c: ClassFilter): PropertyType[] => (c === 'all' ? [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES] : c === 'residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES);
export const parseClass = (v: string | null | undefined): ClassFilter => (v === 'residential' || v === 'commercial' ? v : 'all');

/** Clark County Assessor land-use code (e.g. "20.110", "41.335.C") → class, or null when it's
 *  neither (public land, parks, agriculture, utilities, unknown vacant land) or not recognized.
 *  Code families checked against the Assessor's own parcel records:
 *    12–13 vacant residential land · 14–15 vacant commercial / industrial land
 *    20–32 homes with 1–4 units · 33–39 apartments with 5+ units, mobile-home parks
 *    40–49 commercial (retail, offices, hotels, casinos, recreation) · 50–59 industrial */
export function classOfLandUse(code: string | null | undefined): PropertyClass | null {
  const m = /^(\d{2})\.\d{3}/.exec(code?.trim() ?? '');
  if (!m) return null;
  const n = Number(m[1]);
  if (n === 12 || n === 13 || (n >= 20 && n <= 32)) return 'residential';
  if (n === 14 || n === 15 || (n >= 33 && n <= 59)) return 'commercial';
  return null;
}
