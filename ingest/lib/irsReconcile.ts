// Merges a parsed IRS auctions index into stored state. An ad that is canceled, loses its sale
// date or drops off the site is withdrawn at once.

import type { FeedFederalSale } from '../../src/feed/types';
import type { IrsParseResult } from '../connectors/irsAuctions';
import type { SourceState } from './reconcile';

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
