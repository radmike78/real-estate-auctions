// Browser-side verification of the published feed. Nothing is shown unless:
//  1. the Ed25519 signature over the exact bytes verifies against the compiled-in key,
//  2. the feed has not expired (stale data is never displayed as available),
//  3. every listing passes shape checks and links only to allowlisted official hosts.

import type { Feed, FeedCertificate, FeedListing } from './types';

// Official hosts a listing may link to. Mirrors ingest/sources/registry.ts (exact .gov names only).
export const OFFICIAL_HOSTS = new Set(['treasurer.clarkcountynv.gov']);
// Agents that publish a government sale list for the agency (AGENT_HOSTS in the registry).
// Only SID lien certificates may link here.
export const AGENT_HOSTS = new Set(['www.amgnv.com']);

const APN = /^\d{3}-\d{2}-\d{3}-\d{3}$/;
const isDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const shortText = (v: unknown, max: number) => v === null || (typeof v === 'string' && v.length <= max);

export type VerifyResult =
  | { ok: true; feed: Feed }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING' | 'BAD_SIGNATURE' | 'EXPIRED' | 'MALFORMED'; detail: string };

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
  if (!(Date.parse(feed.expiresAt) > now.getTime())) {
    return { ok: false, reason: 'EXPIRED', detail: `Listings expired at ${feed.expiresAt} and are being re-verified.` };
  }
  const certificates = Array.isArray(feed.certificates) ? feed.certificates.filter(validCertificate) : [];
  return { ok: true, feed: { ...feed, listings: feed.listings.filter(validListing), certificates } };
}

export async function loadVerifiedFeed(publicKeySpkiB64: string | null): Promise<VerifyResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No feed-signing public key is configured.' };
  const [data, sig] = await Promise.all([
    fetch('data/listings.json', { cache: 'no-store' }),
    fetch('data/listings.json.sig', { cache: 'no-store' }),
  ]);
  if (!isFeedResponse(data) || !isFeedResponse(sig)) return { ok: false, reason: 'MISSING', detail: 'No published listings feed was found.' };
  return verifyFeed(await data.arrayBuffer(), await sig.text(), publicKeySpkiB64);
}
