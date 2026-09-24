// Merges a freshly parsed official snapshot into stored state, after anomaly screening.
//
// Anomaly screening defends against spoofed or broken data that still parses cleanly:
// a defaced page, a partial response, or an injected table. Suspicious snapshots are
// QUARANTINED: nothing is updated, so existing listings age out instead of changing to
// unverified data, and an operator must approve the snapshot hash to accept it.

import type { FeedListing } from '../../src/feed/types';
import type { ParseResult } from '../connectors/clarkTaxSale';

export interface SourceState {
  sourceId: string;
  etag: string | null;
  lastModified: string | null;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastChangedAt: string | null;
  lastSha256: string | null;
  changeTimes: string[];
  consecutiveErrors: number;
  health: 'ok' | 'stale' | 'quarantined' | 'error' | 'terms_not_reviewed';
  message: string | null;
  quarantinedSha256: string | null;
  listings: Record<string, FeedListing>;
}

export const emptyState = (sourceId: string): SourceState => ({
  sourceId,
  etag: null,
  lastModified: null,
  lastCheckedAt: null,
  lastSuccessAt: null,
  lastChangedAt: null,
  lastSha256: null,
  changeTimes: [],
  consecutiveErrors: 0,
  health: 'ok',
  message: null,
  quarantinedSha256: null,
  listings: {},
});

export interface Anomaly {
  code: 'MASS_REMOVAL' | 'MASS_ADDITION' | 'BID_SHIFT';
  detail: string;
}

const MIN_BASELINE = 20;

export function detectAnomalies(prev: SourceState, next: ParseResult): Anomaly[] {
  const prevAvail = Object.values(prev.listings).filter((l) => l.state === 'AVAILABLE');
  if (prevAvail.length < MIN_BASELINE) return []; // not enough history to judge
  const nextAvail = next.rows.filter((r) => !r.withdrawn);
  const prevByApn = new Map(prevAvail.map((l) => [l.apn, l]));
  const out: Anomaly[] = [];

  // A new auction cycle legitimately replaces the list.
  const prevDate = prevAvail[0]?.auctionStartsAt ?? null;
  const newCycle = !!next.auctionStartsAt && !!prevDate && next.auctionStartsAt !== prevDate;

  if (!newCycle && nextAvail.length < prevAvail.length * 0.5) {
    out.push({ code: 'MASS_REMOVAL', detail: `Available parcels fell from ${prevAvail.length} to ${nextAvail.length} in one update.` });
  }
  const added = nextAvail.filter((r) => !prevByApn.has(r.apn)).length;
  if (!newCycle && added > prevAvail.length * 0.25) {
    out.push({ code: 'MASS_ADDITION', detail: `${added} parcels appeared that were not on the previous list for the same auction.` });
  }
  const shifted = nextAvail.filter((r) => {
    const p = prevByApn.get(r.apn);
    return p && (r.minimumBid > p.minimumBid * 3 || r.minimumBid < p.minimumBid / 3);
  }).length;
  if (shifted > Math.max(3, prevAvail.length * 0.1)) {
    out.push({ code: 'BID_SHIFT', detail: `${shifted} parcels changed minimum bid by more than 3x.` });
  }
  return out;
}

export function applySnapshot(
  prev: SourceState,
  parsed: ParseResult,
  meta: { sha256: string; sourceUrl: string; now: Date },
): SourceState {
  const nowIso = meta.now.toISOString();
  const listings: Record<string, FeedListing> = {};
  const onList = new Set<string>();

  for (const r of parsed.rows) {
    onList.add(r.apn);
    const old = prev.listings[r.apn];
    listings[r.apn] = {
      sourceId: prev.sourceId,
      apn: r.apn,
      address: r.address,
      minimumBid: r.minimumBid,
      auctionStartsAt: r.auctionStartsAt,
      state: r.withdrawn ? 'WITHDRAWN' : 'AVAILABLE',
      firstSeenAt: old?.firstSeenAt ?? nowIso,
      lastVerifiedAt: nowIso,
      sourceUrl: meta.sourceUrl,
      snapshotSha256: meta.sha256,
    };
  }
  // Anything that dropped off the official list is no longer available.
  for (const [apn, old] of Object.entries(prev.listings)) {
    if (!onList.has(apn)) listings[apn] = { ...old, state: 'WITHDRAWN' };
  }

  const changed = meta.sha256 !== prev.lastSha256;
  return {
    ...prev,
    lastCheckedAt: nowIso,
    lastSuccessAt: nowIso,
    lastChangedAt: changed ? nowIso : prev.lastChangedAt,
    lastSha256: meta.sha256,
    changeTimes: changed ? [...prev.changeTimes, nowIso].slice(-30) : prev.changeTimes,
    consecutiveErrors: 0,
    health: 'ok',
    message: parsed.rejected.length ? `${parsed.rejected.length} row(s) rejected by validation` : null,
    quarantinedSha256: null,
    listings,
  };
}

/** A 304 Not Modified confirms the list is unchanged, so every listing is re-verified now. */
export function applyNotModified(prev: SourceState, now: Date): SourceState {
  const nowIso = now.toISOString();
  const listings = Object.fromEntries(
    Object.entries(prev.listings).map(([k, l]) => [k, l.state === 'AVAILABLE' ? { ...l, lastVerifiedAt: nowIso } : l]),
  );
  return { ...prev, lastCheckedAt: nowIso, lastSuccessAt: nowIso, consecutiveErrors: 0, health: 'ok', listings };
}
