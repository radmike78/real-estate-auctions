// Browser-side verification of the published feed. Nothing is shown unless:
//  1. the Ed25519 signature over the exact bytes verifies against the compiled-in key,
//  2. the feed has not expired (stale data is never displayed as available),
//  3. every listing passes shape checks and links only to allowlisted official hosts.

import type { Feed, FeedCertificate, FeedFederalSale, FeedListing } from './types';
import { STATES } from '../lib/regions';

// Official hosts a listing may link to. Mirrors ingest/sources/registry.ts (exact .gov names only).
export const OFFICIAL_HOSTS = new Set(['treasurer.clarkcountynv.gov']);
// Agents that publish a government sale list for the agency (AGENT_HOSTS in the registry).
// Only SID lien certificates may link here.
export const AGENT_HOSTS = new Set(['www.amgnv.com']);
// Federal sale sites (irsauctions.gov). Only IRS sales may link here.
export const FEDERAL_HOSTS = new Set(['www.irsauctions.gov']);

export function isFederalSaleUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && FEDERAL_HOSTS.has(u.hostname) && /^\/ad\/[a-z0-9-]+\/?$/.test(u.pathname) && !u.search && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** The states we cover, and their counties (src/lib/regions.ts). */
const IRS_COUNTIES: Record<string, string[]> = Object.fromEntries(STATES.map((s) => [s.code, s.counties]));
// Any county's parcel number, as the IRS notice labels it ("020-120-110", "10767006C", "0310-672-35-0000").
const ANY_PARCEL = /^\d[0-9A-Z.-]{4,23}$/;

/** Clark County (and older feeds without a place): the Assessor-confirmed rules. Elsewhere: as the IRS lists it. */
export const isClarkSale = (f: FeedFederalSale) => (f.usState ?? 'NV') === 'NV' && (f.county ?? 'Clark') === 'Clark';

function validFederalSale(f: FeedFederalSale): boolean {
  if (!f || typeof f !== 'object') return false;
  const clark = isClarkSale(f);
  return (
    (clark || (typeof f.usState === 'string' && typeof f.county === 'string' && !!IRS_COUNTIES[f.usState]?.includes(f.county))) &&
    f.state === 'AVAILABLE' &&
    typeof f.id === 'string' &&
    /^[a-z0-9-]{3,200}$/.test(f.id) &&
    shortName(f.title, 200) &&
    Array.isArray(f.apns) &&
    f.apns.length > 0 &&
    f.apns.length <= 20 &&
    f.apns.every((a) => typeof a === 'string' && (clark ? APN : ANY_PARCEL).test(a)) &&
    shortText(f.address, 120) &&
    shortName(f.city, 60) &&
    typeof f.zip === 'string' &&
    (clark ? /^89[01]\d\d$/ : /^(\d{5})?$/).test(f.zip) &&
    (f.saleKind === 'ADMINISTRATIVE' || f.saleKind === 'JUDICIAL') &&
    (f.saleFormat === 'Public auction' || f.saleFormat === 'Sealed bid') &&
    (f.minimumBid === null || (typeof f.minimumBid === 'number' && Number.isFinite(f.minimumBid) && f.minimumBid > 0)) &&
    isDate(f.saleStartsAt) &&
    shortText(f.saleLocation, 200) &&
    // Clark County parcels must be confirmed by the Assessor; elsewhere nothing claims they were.
    (clark ? isDate(f.corroboratedAt) : f.corroboratedAt === null) &&
    isDate(f.lastVerifiedAt) &&
    isDate(f.firstSeenAt) &&
    isFederalSaleUrl(f.sourceUrl) &&
    (f.landUse == null ||
      (typeof f.landUse === 'object' && typeof f.landUse.code === 'string' && /^\d{2}\.\d{3}(\.[A-Z])?$/.test(f.landUse.code) && typeof f.landUse.description === 'string' && f.landUse.description.length <= 80)) &&
    typeof f.snapshotSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(f.snapshotSha256)
  );
}

const APN = /^\d{3}-\d{2}-\d{3}-\d{3}$/;
const isDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const shortText = (v: unknown, max: number) => v === null || (typeof v === 'string' && v.length <= max);

export type VerifyResult =
  | { ok: true; feed: Feed }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING' | 'BAD_SIGNATURE' | 'EXPIRED' | 'MALFORMED' | 'ROLLED_BACK'; detail: string };

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));

/** Verifies an Ed25519 signature over the exact bytes. Returns an error message, or null when valid. */
export async function checkSignature(data: ArrayBuffer, signatureB64: string, publicKeySpkiB64: string, subtle: SubtleCrypto = crypto.subtle): Promise<string | null> {
  try {
    const key = await subtle.importKey('spki', b64ToBytes(publicKeySpkiB64), { name: 'Ed25519' }, false, ['verify']);
    const valid = await subtle.verify({ name: 'Ed25519' }, key, b64ToBytes(signatureB64), data);
    return valid ? null : 'The file does not match its signature. It may have been tampered with.';
  } catch (e) {
    return `Signature check failed: ${(e as Error).message}`;
  }
}

/**
 * True when a fetched feed file really exists. Many static hosts answer a missing file with the
 * site's index.html and HTTP 200, which must count as "not published", not as a bad signature.
 */
export function isFeedResponse(res: Response): boolean {
  return res.ok && !/text\/html/i.test(res.headers.get('content-type') ?? '');
}

export function isOfficialUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && OFFICIAL_HOSTS.has(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** A link a SID lien certificate may use: the agency's .gov site or its named publishing agent. */
export function isCertificateSourceUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && (OFFICIAL_HOSTS.has(u.hostname) || AGENT_HOSTS.has(u.hostname)) && !u.username && !u.password;
  } catch {
    return false;
  }
}

const shortName = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;

function validCertificate(c: FeedCertificate): boolean {
  return (
    !!c &&
    c.state === 'AVAILABLE' &&
    typeof c.apn === 'string' &&
    APN.test(c.apn) &&
    shortText(c.address, 200) &&
    shortName(c.district, 20) &&
    typeof c.amountDue === 'number' &&
    Number.isFinite(c.amountDue) &&
    c.amountDue > 0 &&
    shortName(c.jurisdiction, 60) &&
    shortName(c.publishedBy, 80) &&
    typeof c.saleDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(c.saleDate) &&
    isDate(c.corroboratedAt) &&
    isDate(c.lastVerifiedAt) &&
    isCertificateSourceUrl(c.sourceUrl) &&
    typeof c.snapshotSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(c.snapshotSha256)
  );
}

function validListing(l: FeedListing): boolean {
  return (
    l.state === 'AVAILABLE' &&
    typeof l.apn === 'string' &&
    APN.test(l.apn) &&
    typeof l.minimumBid === 'number' &&
    Number.isFinite(l.minimumBid) &&
    l.minimumBid > 0 &&
    shortText(l.address, 200) &&
    shortText(l.auctionFormat, 40) &&
    shortText(l.auctionLocation, 300) &&
    (l.groupApn === null || (typeof l.groupApn === 'string' && APN.test(l.groupApn))) &&
    typeof l.personalPropertyExcluded === 'boolean' &&
    isDate(l.auctionStartsAt) && // no scheduled auction -> not shown
    isDate(l.corroboratedAt) && // must be confirmed by the independent Assessor records
    isDate(l.lastVerifiedAt) &&
    isOfficialUrl(l.sourceUrl) &&
    (l.landUse == null ||
      (typeof l.landUse === 'object' && typeof l.landUse.code === 'string' && /^\d{2}\.\d{3}(\.[A-Z])?$/.test(l.landUse.code) && typeof l.landUse.description === 'string' && l.landUse.description.length <= 80)) &&
    typeof l.snapshotSha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(l.snapshotSha256)
  );
}

export async function verifyFeed(
  data: ArrayBuffer,
  signatureB64: string,
  publicKeySpkiB64: string | null,
  now = new Date(),
  subtle: SubtleCrypto = crypto.subtle,
): Promise<VerifyResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No feed-signing public key is configured.' };
  const sigError = await checkSignature(data, signatureB64, publicKeySpkiB64, subtle);
  if (sigError) return { ok: false, reason: 'BAD_SIGNATURE', detail: sigError };

  let feed: Feed;
  try {
    feed = JSON.parse(new TextDecoder().decode(data)) as Feed;
  } catch {
    return { ok: false, reason: 'MALFORMED', detail: 'Listings file is not valid JSON.' };
  }
  if (feed.version !== 1 || !Array.isArray(feed.listings) || !Array.isArray(feed.sources)) {
    return { ok: false, reason: 'MALFORMED', detail: 'Unexpected feed format.' };
  }
  if (Date.parse(feed.generatedAt) > now.getTime() + 5 * 60_000) {
    return { ok: false, reason: 'MALFORMED', detail: 'Feed is dated in the future.' };
  }
  // The publisher never signs a feed for more than 24 hours (ingest/lib/cadence.ts), so a longer
  // lifetime means it wasn't made by our publisher; refuse it rather than trust it for longer.
  if (!(Date.parse(feed.expiresAt) - Date.parse(feed.generatedAt) <= MAX_FEED_LIFETIME_MS)) {
    return { ok: false, reason: 'MALFORMED', detail: 'Feed lifetime is longer than allowed.' };
  }
  if (!(Date.parse(feed.expiresAt) > now.getTime())) {
    return { ok: false, reason: 'EXPIRED', detail: `Listings expired at ${feed.expiresAt} and are being re-verified.` };
  }
  const certificates = Array.isArray(feed.certificates) ? feed.certificates.filter(validCertificate) : [];
  const federalSales = Array.isArray(feed.federalSales) ? feed.federalSales.filter(validFederalSale) : [];
  return { ok: true, feed: { ...feed, listings: feed.listings.filter(validListing), certificates, federalSales } };
}

export const MAX_FEED_LIFETIME_MS = 25 * 60 * 60_000; // 24 h plus clock slack
const NEWEST_KEY = 'fsf.listings.newest.v1';

/**
 * Refuses a validly signed but OLDER listings feed than one this browser already saw, so whoever controls
 * the host or a cache can't replay a copy from before a parcel was redeemed or lined out.
 */
export function refuseRollback(r: VerifyResult, storage: Pick<Storage, 'getItem' | 'setItem'> | null = globalThis.localStorage ?? null): VerifyResult {
  if (!r.ok || !storage) return r;
  try {
    const seen = Date.parse(storage.getItem(NEWEST_KEY) ?? '');
    const got = Date.parse(r.feed.generatedAt);
    if (seen && got < seen) return { ok: false, reason: 'ROLLED_BACK', detail: 'An older copy of the listings was served. It was not shown.' };
    storage.setItem(NEWEST_KEY, r.feed.generatedAt);
  } catch {
    /* storage unavailable: signature and expiry checks still apply */
  }
  return r;
}

export async function loadVerifiedFeed(publicKeySpkiB64: string | null): Promise<VerifyResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No feed-signing public key is configured.' };
  const [data, sig] = await Promise.all([
    fetch('/data/listings.json', { cache: 'no-cache' }),
    fetch('/data/listings.json.sig', { cache: 'no-cache' }),
  ]);
  if (!isFeedResponse(data) || !isFeedResponse(sig)) return { ok: false, reason: 'MISSING', detail: 'No published listings feed was found.' };
  return refuseRollback(await verifyFeed(await data.arrayBuffer(), await sig.text(), publicKeySpkiB64));
}
