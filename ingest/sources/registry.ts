// Registry of trusted sources. Only sources listed here can be ingested, and only from
// the exact hosts listed. Add a source only after confirming it is operated by the
// government agency (or its contracted auction platform) that conducts the sale.

export interface SourceConfig {
  id: string;
  agency: string;
  jurisdiction: string;
  /** Official page a human can open to confirm a listing. */
  officialUrl: string;
  /** URL the connector fetches. */
  fetchUrl: string;
  /** Exact hostnames allowed for the fetch and every redirect hop. No wildcards. */
  allowedHosts: string[];
  /** What the agency says about how often it updates. Used until enough history is observed. */
  declaredCadenceHours: number;
  /** Bounds for adaptive polling. */
  minPollMinutes: number;
  maxPollMinutes: number;
  /**
   * Date (YYYY-MM-DD) a person reviewed the site's terms of use / robots rules and
   * confirmed automated access is permitted. Scheduled runs refuse to fetch while null.
   */
  termsReviewedAt: string | null;
  notes: string;
}

export const SOURCES: SourceConfig[] = [
  {
    id: 'nv-clark-treasurer-tax-sale',
    agency: 'Clark County Treasurer',
    jurisdiction: 'NV-Clark',
    officialUrl: 'https://treasurer.clarkcountynv.gov/auction',
    fetchUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
    allowedHosts: ['treasurer.clarkcountynv.gov'],
    // The Treasurer states the auction list is updated daily as payments are made.
    declaredCadenceHours: 24,
    minPollMinutes: 15,
    maxPollMinutes: 6 * 60,
    termsReviewedAt: null,
    notes:
      'Properties delinquent 3 consecutive fiscal years are deeded to the Treasurer as trustee and may be auctioned (NRS 361). ' +
      'Parcels are lined out when redeemed. Not all liens are satisfied by the sale, and the IRS may redeem within 120 days. ' +
      'Confirm sale format, deposit and date in the current auction information notice for each auction.',
  },
];

export function getSource(id: string): SourceConfig {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source "${id}". Only registered official sources can be ingested.`);
  return s;
}
