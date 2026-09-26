// Builds the public feed from source states. Only listings that are AVAILABLE, freshly
// verified and whose auction is still open are published. A source that is stale,
// quarantined, erroring or not yet terms-reviewed publishes nothing (fail closed).

import type { Feed, FeedCertificate, FeedFederalSale, FeedListing, FeedSourceStatus } from '../../src/feed/types';
import { saleStillAhead } from '../connectors/sidCertificateSale';
import type { SourceConfig } from '../sources/registry';
import { auctionStillOpen, isFresh, maxAgeMinutes, observedChangeIntervalHours, pollIntervalMinutes } from './cadence';
import type { SourceState } from './reconcile';

const M = 60_000;

export function nextAuctionAt(state: SourceState, now: Date): string | null {
  const upcoming = Object.values(state.listings)
    .filter((l) => l.state === 'AVAILABLE' && l.auctionStartsAt && auctionStillOpen(l.auctionStartsAt, now))
    .map((l) => l.auctionStartsAt!);
  for (const f of Object.values(state.federalSales ?? {})) {
    if (f.state === 'AVAILABLE' && auctionStillOpen(f.saleStartsAt, now)) upcoming.push(f.saleStartsAt);
  }
  // SID sales are announced by date only; they are held in the morning.
  for (const c of Object.values(state.certificates ?? {})) {
    if (c.state === 'AVAILABLE' && saleStillAhead(c.saleDate, now)) upcoming.push(new Date(`${c.saleDate}T09:00:00-08:00`).toISOString());
  }
  upcoming.sort();
  return upcoming[0] ?? null;
}

export function scheduleFor(source: SourceConfig, state: SourceState, now: Date) {
  const poll = pollIntervalMinutes(source, {
    changeTimes: state.changeTimes,
    nextAuctionAt: nextAuctionAt(state, now),
    consecutiveErrors: state.consecutiveErrors,
    now,
  });
  const nextCheckAt = state.lastCheckedAt ? new Date(Date.parse(state.lastCheckedAt) + poll * M) : now;
  return { pollMinutes: poll, maxAgeMinutes: maxAgeMinutes(source, poll), nextCheckAt };
}

export function buildFeed(sources: SourceConfig[], states: Record<string, SourceState>, now: Date): Feed {
  const statuses: FeedSourceStatus[] = [];
  const listings: FeedListing[] = [];
  const certificates: FeedCertificate[] = [];
  const federalSales: FeedFederalSale[] = [];
  const expiries: number[] = [];

  for (const source of sources) {
    const state = states[source.id];
    if (!state) continue;
    const sched = scheduleFor(source, state, now);
    const fresh = isFresh(state.lastSuccessAt, sched.maxAgeMinutes, now);
    let health: FeedSourceStatus['health'] = state.health;
    if (!source.termsReviewedAt || !source.parserVerifiedAt) health = 'terms_not_reviewed';
    else if (health === 'ok' && !fresh) health = 'stale';

    if (health === 'ok' && source.kind === 'sid-certificate') {
      const pub = Object.values(state.certificates ?? {}).filter(
        (c) => c.state === 'AVAILABLE' && isFresh(c.lastVerifiedAt, sched.maxAgeMinutes, now) && saleStillAhead(c.saleDate, now),
      );
      certificates.push(...pub);
      if (pub.length) expiries.push(Date.parse(state.lastSuccessAt!) + sched.maxAgeMinutes * M);
    } else if (health === 'ok' && source.kind === 'irs-auction') {
      const pub = Object.values(state.federalSales ?? {}).filter(
        (f) => f.state === 'AVAILABLE' && isFresh(f.lastVerifiedAt, sched.maxAgeMinutes, now) && auctionStillOpen(f.saleStartsAt, now),
      );
      federalSales.push(...pub);
      if (pub.length) expiries.push(Date.parse(state.lastSuccessAt!) + sched.maxAgeMinutes * M);
    } else if (health === 'ok') {
      const pub = Object.values(state.listings).filter(
        (l) => l.state === 'AVAILABLE' && isFresh(l.lastVerifiedAt, sched.maxAgeMinutes, now) && auctionStillOpen(l.auctionStartsAt, now),
      );
      listings.push(...pub);
      if (pub.length) expiries.push(Date.parse(state.lastSuccessAt!) + sched.maxAgeMinutes * M);
    }

    statuses.push({
      sourceId: source.id,
      agency: source.agency,
      ...(source.publishedBy ? { publishedBy: source.publishedBy } : {}),
      officialUrl: source.officialUrl,
      lastCheckedAt: state.lastCheckedAt,
      lastChangedAt: state.lastChangedAt,
      observedChangeIntervalHours: observedChangeIntervalHours(state.changeTimes),
      nextCheckAt: sched.nextCheckAt.toISOString(),
      health,
      certificateIssuer: Object.values(state.tlsBaselines ?? {})[0]?.issuerOrg ?? null,
      message:
        health === 'terms_not_reviewed'
          ? source.termsReviewedAt
            ? 'Not enabled yet: waiting to check the first posted list.'
            : 'Not enabled: automated collection needs a terms review or the site’s written permission.'
          : health === 'stale'
            ? 'Not re-verified recently enough. Listings are hidden until the next successful check.'
            : state.message,
    });
  }

  listings.sort((a, b) => (a.auctionStartsAt ?? '').localeCompare(b.auctionStartsAt ?? '') || a.apn.localeCompare(b.apn));
  const expiresAt = new Date(expiries.length ? Math.min(...expiries) : now.getTime() + 60 * M).toISOString();
  certificates.sort((a, b) => a.saleDate.localeCompare(b.saleDate) || a.district.localeCompare(b.district) || a.apn.localeCompare(b.apn));
  federalSales.sort((a, b) => a.saleStartsAt.localeCompare(b.saleStartsAt) || a.id.localeCompare(b.id));
  return {
    version: 1,
    generatedAt: now.toISOString(),
    expiresAt,
    sources: statuses,
    listings,
    ...(certificates.length ? { certificates } : {}),
    ...(federalSales.length ? { federalSales } : {}),
  };
}
