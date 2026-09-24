// Freshness policy: how often to re-check a source, and how long a verification stays valid.
//
// Polling adapts to how often the source ACTUALLY changes (learned from content hashes),
// starting from the agency's declared cadence, and tightens as an auction approaches because
// parcels are redeemed and lined out right up to the sale. A listing is shown as available
// only while its last verification is younger than maxAgeMinutes. After that it disappears
// until re-verified, so a stalled or failing ingester can never leave outdated listings up.

import type { SourceConfig } from '../sources/registry';

const H = 3_600_000;
const M = 60_000;

/** Median hours between observed content changes, or null until there is enough history. */
export function observedChangeIntervalHours(changeTimes: string[]): number | null {
  const t = changeTimes.map((x) => Date.parse(x)).sort((a, b) => a - b).slice(-11);
  if (t.length < 3) return null;
  const gaps = t.slice(1).map((x, i) => (x - t[i]) / H).sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
}

export function pollIntervalMinutes(
  source: SourceConfig,
  opts: { changeTimes: string[]; nextAuctionAt: string | null; consecutiveErrors: number; now: Date },
): number {
  const observed = observedChangeIntervalHours(opts.changeTimes);
  const expectedChangeHours = Math.min(source.declaredCadenceHours, observed ?? source.declaredCadenceHours);
  // Sample ~4x per expected change so a change is picked up within a quarter of its interval.
  let minutes = (expectedChangeHours * 60) / 4;

  if (opts.nextAuctionAt) {
    const hoursToAuction = (Date.parse(opts.nextAuctionAt) - opts.now.getTime()) / H;
    if (hoursToAuction <= 24 && hoursToAuction > -12) minutes = source.minPollMinutes;
    else if (hoursToAuction <= 72 && hoursToAuction > 0) minutes = Math.min(minutes, 60);
  }
  if (opts.consecutiveErrors > 0) minutes *= 2 ** Math.min(opts.consecutiveErrors, 4); // back off on errors
  return Math.round(Math.min(source.maxPollMinutes, Math.max(source.minPollMinutes, minutes)));
}

/** How long a successful verification is trusted before listings are hidden. */
export function maxAgeMinutes(source: SourceConfig, pollMinutes: number): number {
  return Math.min(source.declaredCadenceHours * 60, 2 * pollMinutes + 30);
}

export function isFresh(lastVerifiedAt: string | null, maxAgeMin: number, now: Date): boolean {
  return !!lastVerifiedAt && now.getTime() - Date.parse(lastVerifiedAt) <= maxAgeMin * M;
}

/**
 * Parcels are offered through the auction day; hide them once the sale is effectively over.
 * No published auction date means nothing is scheduled, so nothing is shown (fail closed).
 */
export function auctionStillOpen(auctionStartsAt: string | null, now: Date): boolean {
  return !!auctionStartsAt && now.getTime() < Date.parse(auctionStartsAt) + 10 * H;
}
