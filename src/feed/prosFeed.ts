// Signed professional directory (public/data/pros.json + .sig), written by the server when an
// admin approves, re-verifies, bills or suspends an advertiser. The browser verifies the Ed25519
// signature and expiry before showing any profile, and re-applies every listing rule, so a
// tampered or stale file can't add a fake professional or swap in a scammer's phone number.

import { MAX_AD_AREAS } from '../lib/adAreas';
import { stateByCode } from '../lib/regions';
import { isAdTier, topicAllowed } from '../lib/adPlans';
import { validateAdLine } from '../lib/proApplication';
import { isCategory, isListable, safeMailto, safeTel, safeWebsite, type Pro } from '../lib/pros';
import { checkSignature, isFeedResponse, MAX_FEED_LIFETIME_MS } from './verify';

export interface ProsFeed {
  version: 1;
  /** Binds the signature to this kind of file, so a signed listings feed can't be passed off as a directory. */
  type: 'pros';
  generatedAt: string;
  expiresAt: string;
  pros: Pro[];
}

export type ProsFeedResult =
  | { ok: true; feed: ProsFeed }
  | { ok: false; reason: 'NOT_CONFIGURED' | 'MISSING' | 'BAD_SIGNATURE' | 'EXPIRED' | 'MALFORMED' | 'ROLLED_BACK'; detail: string };

const CLOCK_SKEW_MS = 5 * 60_000;
const NEWEST_KEY = 'fsf.pros.newest.v1';

const str = (v: unknown, max: number) => typeof v === 'string' && v.length > 0 && v.length <= max;
const strArr = (v: unknown, maxLen: number, maxItems: number) => Array.isArray(v) && v.length <= maxItems && v.every((x) => str(x, maxLen));

export function validPro(p: Pro, now = new Date()): boolean {
  return (
    str(p.id, 64) &&
    isCategory(p.category) &&
    str(p.name, 100) &&
    str(p.company, 120) &&
    str(p.licenseId, 30) &&
    (p.state === undefined || !!stateByCode(p.state)) &&
    (p.serviceCounties === undefined || strArr(p.serviceCounties, 40, 20)) &&
    (p.adAreas === undefined || (Array.isArray(p.adAreas) && p.adAreas.length <= MAX_AD_AREAS && p.adAreas.every((a) => str(a?.county, 40) && (a.city === null || str(a.city, 80))))) &&
    strArr(p.serviceCities, 60, 30) &&
    strArr(p.serviceZips, 5, 40) &&
    strArr(p.services, 60, 20) &&
    strArr(p.creditProfiles, 60, 10) &&
    strArr(p.languages, 40, 6) &&
    str(p.headline, 90) &&
    str(p.bio, 800) &&
    p.isSample === false &&
    (p.photo === undefined || p.photo === null || (typeof p.photo === 'string' && /^[0-9a-f]{64}$/.test(p.photo))) &&
    (p.phone === null || !!safeTel(p.phone)) &&
    (p.email === null || !!safeMailto(p.email)) &&
    (p.website === null || !!safeWebsite(p.website)) &&
    isListable(p, now)
  );
}

/**
 * The advertising fields, re-checked here like everything else: an unknown plan counts as Standard, an ad line must
 * pass the same rules as on the form (or it's dropped), and a topic must be one this category may use on Premium Plus.
 */
export function sanitizePro(p: Pro): Pro {
  const tier = isAdTier(p.tier) ? p.tier : 'standard';
  const adLine = typeof p.adLine === 'string' && p.adLine.trim() && validateAdLine(p.adLine, p.category) === null ? p.adLine.trim() : null;
  const adTopic = tier === 'premium_plus' && topicAllowed(p.category, p.adTopic) ? p.adTopic : null;
  // Listings published before advertising opened to other states are Nevada, Clark County.
  const state = p.state && stateByCode(p.state) ? p.state : 'NV';
  const serviceCounties = Array.isArray(p.serviceCounties) && p.serviceCounties.length ? p.serviceCounties : state === 'NV' ? ['Clark'] : [];
  // Listings published before ad areas showed across their counties.
  const adAreas = Array.isArray(p.adAreas) ? p.adAreas.map((a) => ({ county: a.county, city: a.city ?? null })) : serviceCounties.map((county) => ({ county, city: null }));
  const adsOff = p.adsOff === true;
  return { ...p, state, serviceCounties, adAreas, tier, adLine, adTopic, adsOff };
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
  if (feed.version !== 1 || feed.type !== 'pros' || !Array.isArray(feed.pros)) return { ok: false, reason: 'MALFORMED', detail: 'Unexpected directory format.' };
  const generated = Date.parse(feed.generatedAt);
  if (!(generated <= now.getTime() + CLOCK_SKEW_MS)) return { ok: false, reason: 'MALFORMED', detail: 'The directory is dated in the future.' };
  if (!(Date.parse(feed.expiresAt) > now.getTime())) return { ok: false, reason: 'EXPIRED', detail: 'The directory has expired and is being refreshed.' };
  // Same cap as the listings: a copy that claims to stay valid for days is refused.
  if (!(Date.parse(feed.expiresAt) - generated <= MAX_FEED_LIFETIME_MS)) return { ok: false, reason: 'MALFORMED', detail: 'The directory claims too long a lifetime.' };
  return { ok: true, feed: { ...feed, pros: feed.pros.filter((p) => validPro(p, now)).map(sanitizePro) } };
}

let cached: { at: number; result: Promise<ProsFeedResult> } | null = null;
const CACHE_MS = 5 * 60_000;
/** Loads and verifies the directory, reusing the result for 5 minutes across pages. */
export function loadVerifiedPros(publicKeySpkiB64: string | null): Promise<ProsFeedResult> {
  if (!publicKeySpkiB64) return Promise.resolve({ ok: false, reason: 'NOT_CONFIGURED', detail: 'No signing key configured.' });
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.result;
  const result = (async () => {
    const [data, sig] = await Promise.all([fetch('/data/pros.json', { cache: 'no-cache' }), fetch('/data/pros.json.sig', { cache: 'no-cache' })]);
    if (!isFeedResponse(data) || !isFeedResponse(sig)) return { ok: false as const, reason: 'MISSING' as const, detail: 'No directory has been published yet.' };
    const r = await verifyProsFeed(await data.arrayBuffer(), await sig.text(), publicKeySpkiB64);
    return r.ok ? refuseRollback(r) : r;
  })().catch((e: Error) => ({ ok: false as const, reason: 'MISSING' as const, detail: e.message }));
  cached = { at: Date.now(), result };
  return result;
}

/**
 * Refuses a validly signed but OLDER directory than one this browser already saw, so whoever
 * controls the host can't replay a copy from before an advertiser was suspended.
 */
function refuseRollback(r: Extract<ProsFeedResult, { ok: true }>): ProsFeedResult {
  try {
    const seen = Date.parse(localStorage.getItem(NEWEST_KEY) ?? '');
    const got = Date.parse(r.feed.generatedAt);
    if (seen && got < seen) return { ok: false, reason: 'ROLLED_BACK', detail: 'An older copy of the directory was served. It was not shown.' };
    localStorage.setItem(NEWEST_KEY, r.feed.generatedAt);
  } catch {
    /* storage unavailable: signature and expiry checks still apply */
  }
  return r;
}
