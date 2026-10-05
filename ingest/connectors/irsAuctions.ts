// Connector: IRS seizure and judicial sales (irsauctions.gov, run by the Treasury Department).
//
// Verified against the live site on 2026-09-26. The site publishes every ad in one JSON index
// (https://www.irsauctions.gov/index.json) with the fields the site itself shows on its cards:
// title, location ("City ST, ZIP"), date ("Sep 24, 2026 10:00 AM"), minimumBid and the notice text.
// robots.txt allows all automated access. None of the 139 ads that day were in Nevada.
//
// The site covers the whole country and includes vehicles and personal property. We keep an ad only
// when it is real estate in one of the states we cover (NV, CA, AZ, UT, TX): a location in that state, a
// county we can name, and at least one parcel number in the notice. In Clark County the County Assessor
// must also confirm every parcel (and the property gets its own page); elsewhere the sale is shown as the
// IRS lists it, with a link to that county's assessor so the buyer can check the parcel.
//
// PRIVACY: IRS notices name the taxpayer. Only the title, place, date, minimum bid, parcel numbers
// and the sale's terms are kept; the notice text itself is never stored or published.
//
// FAIL-CLOSED rules:
//  - The index must be a JSON array of ads with the expected fields, or nothing is published.
//  - An ad with no sale date (e.g. "To Be Announced"), no parcel number, a canceled title or an
//    unreadable date or minimum bid is never shown.

import { createHash } from 'node:crypto';
import type { SourceConfig } from '../sources/registry';
import { secureFetch, type FetchOptions } from '../lib/secureFetch';
import { SchemaDriftError } from './clarkTaxSale';
import { countyOf } from '../lib/countyOf';
import { timeZoneFor } from '../../src/lib/regions';

export { SchemaDriftError };

export type IrsState = 'NV' | 'CA' | 'AZ' | 'UT' | 'TX';

export interface IrsAd {
  id: string; // slug from /ad/<slug>/
  title: string;
  usState: IrsState;
  county: string; // as named in src/lib/regions.ts, e.g. "Clark", "Los Angeles"
  /** Clark County: every parcel must be confirmed by the County Assessor. Elsewhere: shown as the IRS lists it. */
  assessorChecked: boolean;
  apns: string[];
  address: string | null;
  city: string;
  zip: string;
  saleKind: 'ADMINISTRATIVE' | 'JUDICIAL'; // IRC 6335 seizure sale, or a federal court-ordered sale
  saleFormat: 'Public auction' | 'Sealed bid';
  minimumBid: number | null;
  saleStartsAt: string | null; // ISO
  saleLocation: string | null;
  canceled: boolean;
  sourceUrl: string;
}

export interface IrsParseResult {
  totalAds: number; // every ad on the site, all states
  rows: IrsAd[]; // real-estate candidates in NV, CA, AZ, UT and TX
  skipped: { id: string; reason: string }[]; // ads in those states we can't show
}

const APN_DASHED = /\b(\d{3}-\d{2}-\d{3}-\d{3})\b/g;
const APN_PLAIN = /\b(?:APN|parcel)[^0-9]{0,20}(\d{11})\b/gi;
// Clark County ZIPs are 890xx-891xx, less these in Esmeralda, Lincoln and Nye counties.
const NOT_CLARK = new Set(['89001', '89008', '89010', '89013', '89017', '89020', '89022', '89023', '89041', '89042', '89043', '89045', '89047', '89048', '89049', '89060', '89061']);
const isClarkZip = (zip: string) => /^89[01]\d\d$/.test(zip) && !NOT_CLARK.has(zip);
/** Sale times on the site are local to the sale (by state; see timeZoneFor for Texas's Mountain-time counties). */
export const TIME_ZONE: Record<IrsState, string> = { NV: 'America/Los_Angeles', CA: 'America/Los_Angeles', AZ: 'America/Phoenix', UT: 'America/Denver', TX: 'America/Chicago' };
// Parcel numbers outside Clark County, which every county formats its own way ("020-120-110", "10767006C",
// "0310-672-35-0000"): read only where the notice labels them, so a price or phone number is never taken for one.
const PARCEL_LABELED = /\b(?:A\.?P\.?N\.?|A\.?I\.?N\.?|Assessor'?s?\s+Parcel\s+(?:Number|No\.?|#)|Parcel\s+(?:Number|No\.?|ID|#))\s*(?:\(s\)|s)?\s*[:#.]?\s*(\d[\dA-Za-z]*(?:[-.]\d[\dA-Za-z]*){0,5})/gi;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '') // emoji
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

/** Offset of local time (Las Vegas by default) from UTC at a given moment, e.g. "-07:00". */
function zoneOffset(utcGuess: number, timeZone: string): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(utcGuess))
    .find((p) => p.type === 'timeZoneName')?.value;
  const m = /GMT([+-])(\d{1,2})/.exec(part ?? '');
  return m ? `${m[1]}${m[2].padStart(2, '0')}:00` : '-08:00';
}

/** "Sep 24, 2026 10:00 AM" in local time (Las Vegas by default) -> ISO UTC; null when missing or "To Be Announced". */
export function parseSaleDate(v: string, timeZone = 'America/Los_Angeles'): string | null {
  const m = /^([A-Za-z]{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}) ([AP]M)$/.exec(v.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  const day = Number(m[2]);
  let hour = Number(m[4]) % 12;
  if (m[6] === 'PM') hour += 12;
  if (month < 0 || day < 1 || day > 31 || Number(m[5]) > 59) return null;
  const local = `${m[3]}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${m[5]}:00`;
  if (new Date(`${local}Z`).getUTCDate() !== day) return null; // e.g. Feb 30
  const t = Date.parse(`${local}${zoneOffset(Date.parse(`${local}Z`), timeZone)}`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function parseMinimumBid(v: unknown): number | null | 'invalid' {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^[0-9.e+]+$/i.test(v.trim()) ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n >= 1e9) return 'invalid';
  return Math.round(n * 100) / 100;
}

/** Parcel numbers a notice labels as such (any county's format), upper-cased, at most 20. */
export function labeledParcels(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(PARCEL_LABELED)) {
    const v = m[1].toUpperCase().replace(/\.$/, '');
    if ((v.match(/\d/g) ?? []).length >= 6 && v.length <= 24) found.add(v);
  }
  return [...found].slice(0, 20);
}

function apnsIn(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(APN_DASHED)) found.add(m[1]);
  for (const m of text.matchAll(APN_PLAIN)) found.add(`${m[1].slice(0, 3)}-${m[1].slice(3, 5)}-${m[1].slice(5, 8)}-${m[1].slice(8)}`);
  return [...found].slice(0, 20);
}

export function parseIndex(body: string): IrsParseResult {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new SchemaDriftError('IRS auctions index is not JSON (possibly an error or firewall page).');
  }
  if (!Array.isArray(json)) throw new SchemaDriftError('IRS auctions index is not a list.');
  const ads = (json as Record<string, unknown>[]).filter((a) => a && a.section === 'ad' && typeof a.url === 'string' && /^\/ad\/[a-z0-9-]{3,200}\/?$/.test(a.url));
  if (ads.length < 5) throw new SchemaDriftError(`IRS auctions index has only ${ads.length} ads. The format may have changed.`);
  for (const f of ['title', 'content', 'date', 'location', 'minimumBid']) {
    if (ads.some((a) => typeof a[f] !== 'string')) throw new SchemaDriftError(`IRS auctions index: ads are missing the "${f}" field.`);
  }

  const rows: IrsAd[] = [];
  const skipped: IrsParseResult['skipped'] = [];
  for (const a of ads) {
    const loc = clean(a.location, 120);
    const lm = /^(.{2,60}?),? (NV|CA|AZ|UT|TX),? ?(\d{5})?(?:-\d{4})?$/i.exec(loc);
    if (!lm) continue; // not in a state we cover
    const usState = lm[2].toUpperCase() as IrsState;
    const id = (a.url as string).replace(/^\/ad\//, '').replace(/\/$/, '');
    const skip = (reason: string) => void skipped.push({ id, reason });
    const content = typeof a.content === 'string' ? a.content : '';
    const title = clean(a.title, 200);
    const [city, zip] = [clean(lm[1], 60), lm[3] ?? ''];
    const clark = usState === 'NV' && isClarkZip(zip);
    const county = clark ? 'Clark' : countyOf(usState, city, `${title} ${clean(content.slice(0, 3000), 3000)}`);
    if (!county) {
      skip('county not identified');
      continue;
    }
    const apns = clark ? apnsIn(content) : labeledParcels(clean(content, 20000));
    if (!apns.length) {
      skip(clark ? 'no Clark County parcel number in the notice' : 'no parcel number in the notice');
      continue;
    }
    const minimumBid = parseMinimumBid(a.minimumBid);
    if (minimumBid === 'invalid') {
      skip('unreadable minimum bid');
      continue;
    }
    // The notice opens with "<title> <property address> <City> ST <ZIP> United States …" when the ad has a street address.
    const head = clean(content.slice(0, 600), 600);
    const am = zip ? new RegExp(`^.*?\\b(\\d{1,6} [A-Za-z0-9 .#'-]{3,80}?) ${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},? ${usState} ${zip}\\b`, 'i').exec(head.slice(title.length)) : null;
    const place = /Place of Sale:\s*([^\n]{5,200})/i.exec(content)?.[1];
    rows.push({
      id,
      title,
      usState,
      county,
      assessorChecked: clark,
      apns,
      address: am ? clean(am[1], 120) : null,
      city,
      zip,
      saleKind: /judicial sale|court order|district court/i.test(`${title} ${content.slice(0, 1500)}`) ? 'JUDICIAL' : 'ADMINISTRATIVE',
      saleFormat: /sealed bid/i.test(`${title} ${content}`) ? 'Sealed bid' : 'Public auction',
      minimumBid,
      saleStartsAt: parseSaleDate(clean(a.date, 60), timeZoneFor(usState, county)),
      saleLocation: place ? clean(place, 200) : null,
      canceled: /cancel+ed|postponed/i.test(title),
      sourceUrl: `https://www.irsauctions.gov/ad/${id}/`,
    });
  }
  return { totalAds: ads.length, rows, skipped };
}

export function parseIrsSnapshot(body: string): { parsed: IrsParseResult; sha256: string } {
  return { parsed: parseIndex(body), sha256: createHash('sha256').update(body).digest('hex') };
}

export async function fetchIrsIndex(source: SourceConfig, extra: Pick<FetchOptions, 'fetchImpl' | 'verifyCertificate'> = {}): Promise<string> {
  const r = await secureFetch(source.fetchUrl, { allowedHosts: source.allowedHosts, ...extra, acceptContentTypes: /^application\/json\b/i });
  if (r.kind !== 'ok') throw new Error(`Unexpected 304 from ${source.fetchUrl}`);
  return r.body;
}
