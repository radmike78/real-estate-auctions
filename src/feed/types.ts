// Shape of the signed, published listings feed (public/data/listings.json).
// Shared by the ingester (writer) and the browser (verifier/reader).

export type ListingState =
  | 'AVAILABLE' // on the current official list, not lined out, verified recently
  | 'WITHDRAWN'; // lined out / redeemed / removed from the official list

export interface FeedListing {
  sourceId: string;
  apn: string; // ###-##-###-###
  address: string | null;
  minimumBid: number;
  auctionStartsAt: string | null; // ISO
  state: ListingState;
  firstSeenAt: string;
  lastVerifiedAt: string; // last time this row was seen on the official list
  sourceUrl: string; // official page it came from (allowlisted host)
  snapshotSha256: string; // hash of the raw source document it came from
}

export interface FeedSourceStatus {
  sourceId: string;
  agency: string;
  officialUrl: string;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  observedChangeIntervalHours: number | null;
  nextCheckAt: string | null;
  health: 'ok' | 'stale' | 'quarantined' | 'error' | 'terms_not_reviewed';
  message: string | null;
}

export interface Feed {
  version: 1;
  generatedAt: string;
  // The browser refuses to show anything after this time. Set from the source cadence,
  // so a stalled ingester can never leave outdated "available" listings on screen.
  expiresAt: string;
  sources: FeedSourceStatus[];
  listings: FeedListing[]; // only AVAILABLE listings are published
}
