// Merges a parsed IRS auctions index into stored state. An ad that is canceled, loses its sale
// date or drops off the site is withdrawn at once.

import type { FeedFederalSale } from '../../src/feed/types';
import type { IrsParseResult } from '../connectors/irsAuctions';
import type { Anomaly, SourceState } from './reconcile';

/**
 * Changes a defaced or spoofed index would show, held for an operator to confirm on the official site
 * (like the county sources): a sale's minimum bid moving more than 3x, a sale moved to a different
 * place, or a burst of new Clark County sales at once. Postponements and cancellations are normal and
 * withdraw a sale without review.
 */
export function detectIrsAnomalies(prev: SourceState, next: IrsParseResult): Anomaly[] {
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
  const added = next.rows.filter((r) => !known[r.id]).length;
  if (added > Math.max(5, avail.length * 2)) out.push({ code: 'MASS_ADDITION', detail: `${added} new Clark County IRS sales appeared in one update.` });
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
    // Every parcel in the sale must be a real Clark County parcel.
    const confirmed = r.apns.length > 0 && r.apns.every((a) => meta.confirmedApns.has(a));
    const open = !r.canceled && !!r.saleStartsAt;
    sales[r.id] = {
      sourceId: prev.sourceId,
      id: r.id,
      title: r.title,
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
      corroboratedAt: confirmed ? nowIso : (old?.corroboratedAt ?? null),
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
  const unconfirmed = Object.values(sales).filter((x) => x.state === 'UNCONFIRMED').length;
  const changed = meta.sha256 !== prev.lastSha256;
  const notes = [
    `${parsed.totalAds} ads nationwide; ${parsed.rows.length} in Clark County`,
    parsed.skipped.length ? `${parsed.skipped.length} Clark County ad(s) not shown: ${[...new Set(parsed.skipped.map((s) => s.reason))].join(', ')}` : null,
    unconfirmed ? `${unconfirmed} sale(s) hidden: parcel not found in Assessor records` : null,
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
    message: notes.join('; '),
    quarantinedSha256: null,
    federalSales: sales,
  };
}
