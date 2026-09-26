// Merges a freshly parsed official snapshot into stored state, after anomaly screening.
//
// Anomaly screening defends against spoofed or broken data that still parses cleanly:
// a defaced page, a partial response, or an injected table. Suspicious snapshots are
// QUARANTINED: nothing is updated and the source publishes nothing until an operator
// approves the snapshot hash.

import type { FeedCertificate, FeedListing } from '../../src/feed/types';
import type { ParseResult } from '../connectors/clarkTaxSale';
import type { IdentityBaseline } from './siteIdentity';

export interface SourceState {
  sourceId: string;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastChangedAt: string | null;
  lastSha256: string | null;
  changeTimes: string[];
  consecutiveErrors: number;
  health: 'ok' | 'stale' | 'quarantined' | 'error' | 'terms_not_reviewed';
  message: string | null;
  quarantinedSha256: string | null;
  /** Approved TLS identity per host; a change of issuing CA requires human approval. */
  tlsBaselines: Record<string, IdentityBaseline>;
  pendingCertFingerprint: string | null;
  listings: Record<string, FeedListing>;
  /** SID lien certificates, keyed "district|apn" (SID sources only). */
  certificates?: Record<string, FeedCertificate>;
}

export const emptyState = (sourceId: string): SourceState => ({
  sourceId,
  lastCheckedAt: null,
  lastSuccessAt: null,
  lastChangedAt: null,
  lastSha256: null,
  changeTimes: [],
  consecutiveErrors: 0,
  health: 'ok',
  message: null,
  quarantinedSha256: null,
  tlsBaselines: {},
  pendingCertFingerprint: null,
  listings: {},
});

export interface Anomaly {
  code: 'MASS_REMOVAL' | 'MASS_ADDITION' | 'BID_SHIFT';
  detail: string;
}

const MIN_BASELINE = 20;

export function detectAnomalies(prev: SourceState, next: ParseResult, now = new Date()): Anomaly[] {
  const prevAvail = Object.values(prev.listings).filter((l) => l.state === 'AVAILABLE');
  if (prevAvail.length < MIN_BASELINE) return []; // not enough history to judge
  // A new auction cycle legitimately replaces the whole list.
  if (prevAvail.some((l) => l.auctionId !== next.auctionKey)) return [];

  const out: Anomaly[] = [];
  const nextByApn = new Map(next.rows.map((r) => [r.apn, r]));

  // Parcels are normally removed by being LINED OUT (still present, flagged). Parcels that
  // silently vanish from the data in bulk suggest a truncated or substituted response.
  const auctionStarted = !!next.auctionStartsAt && Date.parse(next.auctionStartsAt) <= now.getTime();
  const vanished = prevAvail.filter((l) => !nextByApn.has(l.apn)).length;
  if (!auctionStarted && vanished > prevAvail.length * 0.5) {
    out.push({ code: 'MASS_REMOVAL', detail: `${vanished} of ${prevAvail.length} available parcels vanished from the data in one update.` });
  }
  const prevApns = new Set(Object.keys(prev.listings));
  const added = next.rows.filter((r) => !r.withdrawn && !prevApns.has(r.apn)).length;
  if (added > prevAvail.length * 0.25) {
    out.push({ code: 'MASS_ADDITION', detail: `${added} new parcels appeared for an auction whose list was already published.` });
  }
  const shifted = prevAvail.filter((l) => {
    const r = nextByApn.get(l.apn);
    return r && !r.withdrawn && (r.minimumBid > l.minimumBid * 3 || r.minimumBid < l.minimumBid / 3);
  }).length;
  if (shifted > Math.max(3, prevAvail.length * 0.1)) {
    out.push({ code: 'BID_SHIFT', detail: `${shifted} parcels changed minimum bid by more than 3x.` });
  }
  return out;
}

export function applySnapshot(
  prev: SourceState,
  parsed: ParseResult,
  meta: { sha256: string; sourceUrl: string; now: Date; confirmedApns: Set<string>; landUse?: Map<string, { code: string; description: string }> },
): SourceState {
  const nowIso = meta.now.toISOString();
  const listings: Record<string, FeedListing> = {};
  const onList = new Set<string>();

  for (const r of parsed.rows) {
    onList.add(r.apn);
    const old = prev.listings[r.apn];
    const confirmed = meta.confirmedApns.has(r.apn);
    listings[r.apn] = {
      sourceId: prev.sourceId,
      apn: r.apn,
      address: r.address,
      minimumBid: r.minimumBid,
      auctionId: parsed.auctionKey,
      auctionStartsAt: r.auctionStartsAt,
      auctionFormat: parsed.auctionFormat,
      auctionLocation: parsed.auctionLocation,
      groupApn: r.groupApn,
      personalPropertyExcluded: r.personalPropertyExcluded,
      state: r.withdrawn ? 'WITHDRAWN' : confirmed ? 'AVAILABLE' : 'UNCONFIRMED',
      corroboratedAt: confirmed ? nowIso : (old?.corroboratedAt ?? null),
      firstSeenAt: old?.firstSeenAt ?? nowIso,
      lastVerifiedAt: nowIso,
      sourceUrl: meta.sourceUrl,
      snapshotSha256: meta.sha256,
      landUse: meta.landUse?.get(r.apn) ?? old?.landUse ?? null,
    };
  }
  // Anything that dropped off the official list is no longer available.
  for (const [apn, old] of Object.entries(prev.listings)) {
    if (!onList.has(apn)) listings[apn] = { ...old, state: 'WITHDRAWN' };
  }

  const unconfirmed = Object.values(listings).filter((l) => l.state === 'UNCONFIRMED').length;
  const changed = meta.sha256 !== prev.lastSha256;
  const notes = [
    parsed.rejected.length ? `${parsed.rejected.length} row(s) rejected by validation` : null,
    unconfirmed ? `${unconfirmed} parcel(s) hidden: not found in Assessor records` : null,
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
    message: notes.length ? notes.join('; ') : null,
    quarantinedSha256: null,
    listings,
  };
}
