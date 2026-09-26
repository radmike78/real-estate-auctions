// Shape of the signed, published listings feed (public/data/listings.json).
// Shared by the ingester (writer) and the browser (verifier/reader).

export type ListingState =
  | 'AVAILABLE' // on the current official list, not lined out, confirmed by the Assessor, verified recently
  | 'UNCONFIRMED' // on the list but not found in the independent Assessor records: never published
  | 'WITHDRAWN'; // lined out / redeemed / sold / removed from the official list

export interface FeedListing {
  sourceId: string;
  apn: string; // ###-##-###-###
  address: string | null;
  minimumBid: number;
  auctionId: string; // Treasurer auction cycle
  auctionStartsAt: string | null; // ISO
  auctionFormat: string | null; // e.g. "In-Person", as published by the Treasurer
  auctionLocation: string | null;
  groupApn: string | null; // sold together with other parcels as one item, one bid
  personalPropertyExcluded: boolean;
  state: ListingState;
  corroboratedAt: string | null; // when the Assessor last confirmed the parcel exists
  firstSeenAt: string;
  lastVerifiedAt: string; // last time this row was seen on the official list
  sourceUrl: string; // official page it came from (allowlisted host)
  /** County Assessor land use (e.g. 20.110 Single Family Residential); null if not read yet. Absent in older feeds. */
  landUse?: { code: string; description: string } | null;
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
  certificateIssuer: string | null; // CA that issued the verified server certificate
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
