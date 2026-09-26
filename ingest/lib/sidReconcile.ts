// Merges a parsed SID certificate list into stored state. A certificate that drops off the
// list was paid (or pulled) and is never shown again for that sale.

import type { FeedCertificate } from '../../src/feed/types';
import type { SidParseResult } from '../connectors/sidCertificateSale';
import type { Anomaly, SourceState } from './reconcile';

const MIN_BASELINE = 20;

/** A list that suddenly loses most of its certificates before the sale is suspicious. */
export function detectSidAnomalies(prev: SourceState, next: SidParseResult): Anomaly[] {
  const avail = Object.values(prev.certificates ?? {}).filter((c) => c.state === 'AVAILABLE');
  if (avail.length < MIN_BASELINE || !next.sale) return [];
  if (avail.some((c) => c.saleDate !== next.sale!.saleDate)) return []; // a new sale replaces the list
  const onList = new Set(next.rows.map((r) => `${r.district}|${r.apn}`));
  const vanished = avail.filter((c) => !onList.has(`${c.district}|${c.apn}`)).length;
  const out: Anomaly[] = [];
  if (vanished > avail.length * 0.5) out.push({ code: 'MASS_REMOVAL', detail: `${vanished} of ${avail.length} certificates vanished from the list in one update.` });
  const known = new Set(Object.keys(prev.certificates ?? {}));
  const added = next.rows.filter((r) => !known.has(`${r.district}|${r.apn}`)).length;
  if (added > avail.length * 0.25) out.push({ code: 'MASS_ADDITION', detail: `${added} new certificates appeared on a list that was already published.` });
  return out;
}

export function applySidSnapshot(
  prev: SourceState,
  parsed: SidParseResult,
  meta: { sha256: string; sourceUrl: string; publishedBy: string; now: Date; confirmedApns: Set<string> },
): SourceState {
  const nowIso = meta.now.toISOString();
  const certificates: Record<string, FeedCertificate> = {};
  const onList = new Set<string>();
  for (const r of parsed.sale ? parsed.rows : []) {
    const key = `${r.district}|${r.apn}`;
    onList.add(key);
    const old = prev.certificates?.[key];
    const confirmed = meta.confirmedApns.has(r.apn);
    certificates[key] = {
      sourceId: prev.sourceId,
      apn: r.apn,
      address: r.address,
      district: r.district,
      amountDue: r.amountDue,
      jurisdiction: parsed.sale!.jurisdiction,
      saleDate: parsed.sale!.saleDate,
      publishedBy: meta.publishedBy,
      state: confirmed ? 'AVAILABLE' : 'UNCONFIRMED',
      corroboratedAt: confirmed ? nowIso : (old?.corroboratedAt ?? null),
      firstSeenAt: old?.firstSeenAt ?? nowIso,
      lastVerifiedAt: nowIso,
      sourceUrl: meta.sourceUrl,
      snapshotSha256: meta.sha256,
    };
  }
  for (const [key, old] of Object.entries(prev.certificates ?? {})) {
    if (!onList.has(key)) certificates[key] = { ...old, state: 'WITHDRAWN' };
  }
  const unconfirmed = Object.values(certificates).filter((c) => c.state === 'UNCONFIRMED').length;
  const changed = meta.sha256 !== prev.lastSha256;
  const notes = [
    parsed.sale ? null : parsed.notices.length ? 'Sale announced; the certificate list is not posted yet.' : 'No sale announced.',
    parsed.rejected.length ? `${parsed.rejected.length} row(s) rejected by validation` : null,
    unconfirmed ? `${unconfirmed} certificate(s) hidden: parcel not found in Assessor records` : null,
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
    certificates,
  };
}
