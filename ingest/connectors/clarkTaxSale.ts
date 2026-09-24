// Connector: Clark County Treasurer delinquent-property (trustee) auction.
//
// Verified against the live site on 2026-09-24. The public Auction List page
// (https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList) renders two data grids
// that load JSON from the same official host:
//   /auction/Auction/Event_Read?auctionId=N   -> auction sessions (date, In-Person/Online, place, Prior/…)
//   /auction/Auction/Parcel_Read?auctionId=N  -> parcels (APN, MinBidAmount, IsLineOut, WinningBidAmount, …)
// The connector reads the page only to discover the current auctionId, then reads the JSON.
//
// FAIL-CLOSED rules:
//  - Exactly one auctionId must be advertised on the page, and every parcel must belong to it.
//  - Responses must have the expected shape (Data array, Total matching, no Errors).
//  - Each parcel is validated; unknown or malformed values reject the row, and >5% rejected
//    rows reject the whole snapshot (SchemaDriftError). Nothing is ever guessed.
//  - The county's own data contains HTML (grouped parcels arrive as a <button onclick=…>,
//    addresses contain <br/>). All values are reduced to plain text before use.
//  - Lined-out parcels (paid/redeemed/removed) and parcels with a winning bid or recorded
//    deed are never available.

import { createHash } from 'node:crypto';
import type { SourceConfig } from '../sources/registry';
import { secureFetch, type FetchOptions } from '../lib/secureFetch';

export class SchemaDriftError extends Error {}

export interface AuctionEvent {
  startsAt: string; // ISO UTC
  status: string; // e.g. "Prior"
  format: string; // e.g. "In-Person", "Online"
  location: string | null;
}

export interface ParsedRow {
  apn: string;
  address: string | null;
  minimumBid: number;
  withdrawn: boolean;
  sold: boolean;
  groupApn: string | null; // parcels sold together as one item, one bid
  personalPropertyExcluded: boolean; // "#" marker: personal property not included in the sale
  auctionStartsAt: string | null;
}

export interface ParseResult {
  auctionKey: string; // Treasurer auctionId: identifies the auction cycle
  auctionStartsAt: string | null; // next session that has not happened yet, else the last one
  auctionFormat: string | null;
  auctionLocation: string | null;
  events: AuctionEvent[];
  rows: ParsedRow[];
  rejected: { row: number; reason: string }[];
}

const MAX_REJECT_RATIO = 0.05;
const APN_RE = /\b(\d{3}-\d{2}-\d{3}-\d{3})\b/;

/** Reduces any markup to plain text (tags removed, entities decoded, whitespace collapsed). */
export function toPlainText(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractAuctionId(pageHtml: string): string {
  const ids = new Set([...pageHtml.matchAll(/Parcel_Read\?auctionId=(\d{1,6})\b/g)].map((m) => m[1]));
  if (ids.size !== 1) {
    throw new SchemaDriftError(`Expected exactly one auctionId on the Auction List page, found ${ids.size}. Page layout may have changed.`);
  }
  return [...ids][0];
}

function dataArray(json: unknown, what: string): Record<string, unknown>[] {
  const o = json as { Data?: unknown; Total?: unknown; Errors?: unknown };
  if (!o || !Array.isArray(o.Data)) throw new SchemaDriftError(`${what}: response has no Data array.`);
  if (o.Errors) throw new SchemaDriftError(`${what}: county returned errors: ${JSON.stringify(o.Errors).slice(0, 200)}`);
  if (typeof o.Total === 'number' && o.Total !== o.Data.length) {
    throw new SchemaDriftError(`${what}: got ${o.Data.length} of ${o.Total} records (response is paged). Refusing a partial list.`);
  }
  return o.Data as Record<string, unknown>[];
}

export function parseEvents(json: unknown): AuctionEvent[] {
  return dataArray(json, 'Event_Read').map((e, i) => {
    const t = typeof e.EventDateTimeStart === 'string' ? Date.parse(e.EventDateTimeStart) : NaN;
    if (Number.isNaN(t)) throw new SchemaDriftError(`Event_Read: session ${i + 1} has no valid start time.`);
    const location = toPlainText(e.Address).slice(0, 300) || null;
    return { startsAt: new Date(t).toISOString(), status: toPlainText(e.EventStatus), format: toPlainText(e.EventType), location };
  });
}

/** Sessions still to come (not marked prior/cancelled), soonest first. */
export function upcomingEvents(events: AuctionEvent[]): AuctionEvent[] {
  return events.filter((e) => !/prior|cancel|complete|closed/i.test(e.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function parseParcels(json: unknown, auctionKey: string, events: AuctionEvent[]): ParseResult {
  const data = dataArray(json, 'Parcel_Read');
  const next = upcomingEvents(events)[0];
  const last = [...events].sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];
  const session = next ?? last ?? null;

  const rows: ParsedRow[] = [];
  const rejected: ParseResult['rejected'] = [];
  const seen = new Set<string>();

  data.forEach((r, i) => {
    const row = i + 1;
    const reject = (reason: string) => void rejected.push({ row, reason });

    if (String(r.TrusteeAuctionId) !== auctionKey) return reject(`belongs to auction ${String(r.TrusteeAuctionId)}, expected ${auctionKey}`);

    const shown = toPlainText(r.ShowParcelNumber);
    const apn = shown.match(APN_RE)?.[1] ?? toPlainText(r.GroupParcelNumber).match(APN_RE)?.[1];
    const other = toPlainText(r.ParcelNumber).match(APN_RE)?.[1];
    if (!apn) return reject(`no valid parcel number in "${shown.slice(0, 40)}"`);
    if (other && other !== apn) return reject(`parcel number mismatch ${apn} vs ${other}`);
    if (seen.has(apn)) return reject(`duplicate parcel ${apn}`);
    seen.add(apn);

    const minimumBid = r.MinBidAmount;
    if (typeof minimumBid !== 'number' || !Number.isFinite(minimumBid) || minimumBid <= 0 || minimumBid >= 50_000_000) {
      return reject(`invalid minimum bid for ${apn}`);
    }
    if (typeof r.IsLineOut !== 'boolean') return reject(`missing line-out flag for ${apn}`);
    const winning = r.WinningBidAmount ?? 0;
    if (typeof winning !== 'number' || !Number.isFinite(winning) || winning < 0) return reject(`invalid winning bid for ${apn}`);
    const deed = r.DeedRecordingDate;
    if (deed !== null && deed !== undefined && (typeof deed !== 'string' || Number.isNaN(Date.parse(deed)))) {
      return reject(`invalid deed recording date for ${apn}`);
    }
    const pp = r.IsPersonalPropertyNotIncluded;
    const ppFlag = pp === true || pp === 'True' ? true : pp === false || pp === 'False' || pp === null || pp === undefined ? false : null;
    if (ppFlag === null) return reject(`unrecognized personal-property flag for ${apn}`);

    const sold = winning > 0 || !!deed;
    const loc = toPlainText(r.PropertyLocation);
    rows.push({
      apn,
      address: !loc || /^unassigned situs$/i.test(loc) ? null : loc.slice(0, 200),
      minimumBid: Math.round(minimumBid * 100) / 100,
      withdrawn: r.IsLineOut || sold,
      sold,
      groupApn: toPlainText(r.GroupParcelNumber).match(APN_RE)?.[1] ?? null,
      personalPropertyExcluded: ppFlag || /#/.test(shown),
      auctionStartsAt: session?.startsAt ?? null,
    });
  });

  const total = rows.length + rejected.length;
  if (total === 0) throw new SchemaDriftError('Parcel list is empty.');
  if (rejected.length / total > MAX_REJECT_RATIO) {
    throw new SchemaDriftError(`${rejected.length} of ${total} parcels failed validation (limit ${MAX_REJECT_RATIO * 100}%). First: ${rejected[0].reason}`);
  }
  return {
    auctionKey,
    auctionStartsAt: session?.startsAt ?? null,
    auctionFormat: session?.format || null,
    auctionLocation: session?.location ?? null,
    events,
    rows,
    rejected,
  };
}

export interface RawSnapshot {
  page: string;
  events: string;
  parcels: string;
}

export function parseSnapshot(raw: RawSnapshot): { parsed: ParseResult; sha256: string } {
  const auctionKey = extractAuctionId(raw.page);
  let events: unknown, parcels: unknown;
  try {
    events = JSON.parse(raw.events);
    parcels = JSON.parse(raw.parcels);
  } catch {
    throw new SchemaDriftError('County data endpoint did not return JSON (possibly an error or firewall page).');
  }
  const parsed = parseParcels(parcels, auctionKey, parseEvents(events));
  // The snapshot hash covers exactly the data the listings came from.
  const sha256 = createHash('sha256').update(raw.events).update('\n').update(raw.parcels).digest('hex');
  return { parsed, sha256 };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetches the page and both JSON endpoints from the official host, politely and sequentially. */
export async function fetchSnapshot(source: SourceConfig, extra: Pick<FetchOptions, 'fetchImpl' | 'verifyCertificate'> = {}): Promise<RawSnapshot> {
  const opts = { allowedHosts: source.allowedHosts, ...extra };
  const get = async (url: string, accept: RegExp) => {
    const r = await secureFetch(url, { ...opts, acceptContentTypes: accept });
    if (r.kind !== 'ok') throw new Error(`Unexpected 304 from ${url}`);
    return r.body;
  };
  const page = await get(source.fetchUrl, /^text\/html\b/i);
  const id = extractAuctionId(page);
  const base = new URL('/auction/Auction/', source.fetchUrl);
  await pause(1000);
  const events = await get(new URL(`Event_Read?auctionId=${id}`, base).href, /^application\/json\b/i);
  await pause(1000);
  const parcels = await get(new URL(`Parcel_Read?auctionId=${id}`, base).href, /^application\/json\b/i);
  return { page, events, parcels };
}
