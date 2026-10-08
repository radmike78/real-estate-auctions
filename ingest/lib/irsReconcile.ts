// Merges a parsed IRS auctions index into stored state. An ad that is canceled, loses its sale
// date or drops off the site is withdrawn at once.

import { auctionStillOpen } from './cadence';
import type { FeedFederalSale } from '../../src/feed/types';
import type { IrsParseResult } from '../connectors/irsAuctions';
import type { Anomaly, SourceState } from './reconcile';

/** Why an IRS ad in our states isn't shown, in plain words for the Sources list. */
const SKIP_WORDS: Record<string, string> = {
  'county not identified': 'the notice doesn’t name the county',
  'no Clark County parcel number in the notice': 'the notice has no Clark County parcel number',
  'no parcel number in the notice': 'the notice has no parcel number',
  'unreadable minimum bid': 'the minimum bid couldn’t be read',
};

/**
 * Changes a defaced or spoofed index would show, held for an operator to confirm on the official site
 * (like the county sources): a sale's minimum bid moving more than 3x, a sale moved to a different
 * place, or a burst of new Clark County sales at once. Postponements and cancellations are normal and
 * withdraw a sale without review.
 */
export function detectIrsAnomalies(prev: SourceState, next: IrsParseResult, now: Date = new Date()): Anomaly[] {
  const known = prev.federalSales ?? {};
  const avail = Object.values(known).filter((x) => x.state === 'AVAILABLE');
  const out: Anomaly[] = [];
  let bidShifts = 0;
  let moved = 0;
  for (const r of next.rows) {
    const old = known[r.id];
    if (!old || old.state !== 'AVAILABLE' || r.canceled) continue;
    if (old.minimumBid && r.minimumBid && (r.minimumBid > old.minimumBid * 3 || r.minimumBid * 3 < old.minimumBid)) bidShifts++;
    if (old.saleLocation && r.saleLocation && old.saleLocation.trim().toLowerCase() !== r.saleLocation.trim().toLowerCase()) moved++;
  }
  if (bidShifts) out.push({ code: 'BID_SHIFT', detail: `${bidShifts} IRS sale(s) changed minimum bid by more than 3x.` });
  if (moved) out.push({ code: 'LOCATION_CHANGE', detail: `${moved} IRS sale(s) changed sale location.` });
  // Only sales that would show count: the index also keeps past and canceled ads, which appear all at once the first
  // time a state is added and are never published.
  const added = next.rows.filter((r) => !known[r.id] && !r.canceled && r.saleStartsAt && Date.parse(r.saleStartsAt) > now.getTime()).length;
  if (added > Math.max(5, avail.length * 2)) out.push({ code: 'MASS_ADDITION', detail: `${added} new upcoming IRS sales appeared in one update.` });
  return out;
}

export function applyIrsSnapshot(
  prev: SourceState,
  parsed: IrsParseResult,
  meta: { sha256: string; now: Date; confirmedApns: Set<string>; landUse?: Map<string, { code: string; description: string }> },
): SourceState {
  const nowIso = meta.now.toISOString();
  const sales: Record<string, FeedFederalSale> = {};
  const seen = new Set<string>();
  for (const r of parsed.rows) {
    seen.add(r.id);
    const old = prev.federalSales?.[r.id];
    // In Clark County every parcel in the sale must be a real parcel in the Assessor's records. Elsewhere the sale is
    // shown as the IRS lists it (the site says so and links the county assessor).
    const confirmed = !r.assessorChecked || (r.apns.length > 0 && r.apns.every((a) => meta.confirmedApns.has(a)));
    const open = !r.canceled && !!r.saleStartsAt;
    sales[r.id] = {
      sourceId: prev.sourceId,
      id: r.id,
      title: r.title,
      usState: r.usState,
      county: r.county,
      apns: r.apns,
      address: r.address,
      city: r.city,
      zip: r.zip,
      saleKind: r.saleKind,
      saleFormat: r.saleFormat,
      minimumBid: r.minimumBid,
      saleStartsAt: r.saleStartsAt ?? old?.saleStartsAt ?? '',
      saleLocation: r.saleLocation,
      state: !open ? 'WITHDRAWN' : confirmed ? 'AVAILABLE' : 'UNCONFIRMED',
      corroboratedAt: !r.assessorChecked ? null : confirmed ? nowIso : (old?.corroboratedAt ?? null),
      firstSeenAt: old?.firstSeenAt ?? nowIso,
      lastVerifiedAt: nowIso,
      sourceUrl: r.sourceUrl,
      landUse: meta.landUse?.get(r.apns[0]) ?? old?.landUse ?? null,
      snapshotSha256: meta.sha256,
    };
  }
  for (const [id, old] of Object.entries(prev.federalSales ?? {})) {
    if (!seen.has(id)) sales[id] = { ...old, state: 'WITHDRAWN' };
  }
  const upcoming = Object.values(sales).filter((x) => auctionStillOpen(x.saleStartsAt, meta.now));
  const available = upcoming.filter((x) => x.state === 'AVAILABLE').length;
  const unconfirmed = upcoming.filter((x) => x.state === 'UNCONFIRMED').length;
  const changed = meta.sha256 !== prev.lastSha256;
  // Shown to buyers under Sources, so it reads as plain sentences.
  const clark = parsed.rows.filter((r) => r.assessorChecked).length;
  const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
  const notes = [
    `The IRS index contains ${n(parsed.totalAds, 'notice', 'notices')} nationwide, including past, canceled and undated notices. These are not counts of available auctions. We parsed ${n(parsed.rows.length, 'notice', 'notices')} in Nevada, California, Arizona, Utah or Texas, ${clark === 0 ? 'none' : clark} of them in Clark County.`,
    `${n(available, 'upcoming sale meets', 'upcoming sales meet')} our publication checks as of this source check. Only eligible upcoming sales appear in the feed; stale or held sources can hide them.`,
    parsed.skipped.length
      ? `${n(parsed.skipped.length, 'additional notice', 'additional notices')} in those states ${parsed.skipped.length === 1 ? 'isn’t' : 'aren’t'} shown here because ${[...new Set(parsed.skipped.map((s) => SKIP_WORDS[s.reason] ?? s.reason))].join(', or ')}.`
      : null,
    unconfirmed ? `${n(unconfirmed, 'upcoming sale is', 'upcoming sales are')} hidden because the parcel wasn’t found in the Assessor’s records.` : null,
  ].filter(Boolean);
  return {
    ...prev,
    lastCheckedAt: nowIso,
    lastSuccessAt: nowIso,
    lastChangedAt: changed ? nowIso : prev.lastChangedAt,
    lastSha256: meta.sha256,
    changeTimes: changed ? [...prev.changeTimes, nowIso].slice(-30) : prev.changeTimes,
    consecutiveErrors: 0,
    health: 'ok',
    message: notes.join(' '),
    quarantinedSha256: null,
    federalSales: sales,
  };
}
