// Signed professional directory (public/data/pros.json + .sig), written by the server when an
// admin approves, re-verifies, bills or suspends an advertiser. The browser verifies the Ed25519
// signature and expiry before showing any profile, and re-applies every listing rule, so a
// tampered or stale file can't add a fake professional or swap in a scammer's phone number.

import { CATEGORIES, isListable, safeMailto, safeTel, safeWebsite, type Pro } from '../lib/pros';
import { checkSignature, isFeedResponse } from './verify';

export interface ProsFeed {
  version: 1;
  generatedAt: string;
  expiresAt: string;
  pros: Pro[];
}

export type ProsFeedResult =
  | { ok: true; feed: ProsFeed }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING' | 'BAD_SIGNATURE' | 'EXPIRED' | 'MALFORMED'; detail: string };

const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;
const strArr = (v: unknown, maxLen: number, maxItems: number) => Array.isArray(v) && v.length <= maxItems && v.every((x) => str(x, maxLen));

export function validPro(p: Pro, now = new Date()): boolean {
  return (
    str(p.id, 64) &&
    !!CATEGORIES[p.category] &&
    str(p.name, 100) &&
    str(p.company, 120) &&
    str(p.licenseId, 20) &&
    strArr(p.serviceCities, 40, 10) &&
    strArr(p.serviceZips, 5, 40) &&
    strArr(p.services, 60, 20) &&
    strArr(p.creditProfiles, 60, 10) &&
    strArr(p.languages, 40, 6) &&
    str(p.headline, 90) &&
    str(p.bio, 800) &&
    p.isSample === false &&
    (p.phone === null || !!safeTel(p.phone)) &&
    (p.email === null || !!safeMailto(p.email)) &&
    (p.website === null || !!safeWebsite(p.website)) &&
    isListable(p, now)
  );
}

export async function verifyProsFeed(
  data: ArrayBuffer,
  signatureB64: string,
  publicKeySpkiB64: string | null,
  now = new Date(),
  subtle: SubtleCrypto = crypto.subtle,
): Promise<ProsFeedResult> {
  if (!publicKeySpkiB64) return { ok: false, reason: 'NOT_CONFIGURED', detail: 'No signing key configured.' };
  const sigError = await checkSignature(data, signatureB64, publicKeySpkiB64, subtle);
  if (sigError) return { ok: false, reason: 'BAD_SIGNATURE', detail: sigError };
  let feed: ProsFeed;
  try {
    feed = JSON.parse(new TextDecoder().decode(data));
  } catch {
    return { ok: false, reason: 'MALFORMED', detail: 'Directory is not valid JSON.' };
  }
  if (feed.version !== 1 || !Array.isArray(feed.pros)) return { ok: false, reason: 'MALFORMED', detail: 'Unexpected directory format.' };
  if (!(Date.parse(feed.expiresAt) > now.getTime())) return { ok: false, reason: 'EXPIRED', detail: 'The directory has expired and is being refreshed.' };
  return { ok: true, feed: { ...feed, pros: feed.pros.filter((p) => validPro(p, now)) } };
}

let cached: { at: number; result: Promise<ProsFeedResult> } | null = null;
const CACHE_MS = 5 * 60_000;
/** Loads and verifies the directory, reusing the result for 5 minutes across pages. */
export function loadVerifiedPros(publicKeySpkiB64: string | null): Promise<ProsFeedResult> {
  if (!publicKeySpkiB64) return Promise.resolve({ ok: false, reason: 'NOT_CONFIGURED', detail: 'No signing key configured.' });
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.result;
  const result = (async () => {
    const [data, sig] = await Promise.all([fetch('data/pros.json', { cache: 'no-store' }), fetch('data/pros.json.sig', { cache: 'no-store' })]);
    if (!isFeedResponse(data) || !isFeedResponse(sig)) return { ok: false as const, reason: 'MISSING' as const, detail: 'No directory has been published yet.' };
    return verifyProsFeed(await data.arrayBuffer(), await sig.text(), publicKeySpkiB64);
  })().catch((e: Error) => ({ ok: false as const, reason: 'MISSING' as const, detail: e.message }));
  cached = { at: Date.now(), result };
  return result;
}
