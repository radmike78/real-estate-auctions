// Registry of trusted sources. Only sources listed here can be ingested, and only from
// the exact hosts listed. Add a source only after confirming it is operated by the
// government agency (or its contracted auction platform) that conducts the sale.

/** Which connector reads the source. */
export type SourceKind = 'tax-sale' | 'sid-certificate' | 'irs-auction';

/**
 * The only non-.gov hosts ever allowed, each one the named agent that publishes a government
 * sale for the agency, confirmed from the agency's own .gov page. Adding a host here is a
 * reviewed code change; a source can't allow itself.
 */
export const AGENT_HOSTS: Record<string, { publisher: string; confirmedBy: string; confirmedAt: string }> = {
  'www.amgnv.com': {
    publisher: 'Assessment Management Group',
    // The Treasurer's certificate-sale page links here for the lists and sale procedures.
    confirmedBy: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/certificate-sale',
    confirmedAt: '2026-09-26',
  },
};

export interface SourceConfig {
  id: string;
  kind: SourceKind;
  agency: string;
  /** Set when an agent publishes the list for the agency; its host must be in AGENT_HOSTS. */
  publishedBy?: string;
  jurisdiction: string;
  /** Official page a human can open to confirm a listing. */
  officialUrl: string;
  /** URL the connector fetches. */
  fetchUrl: string;
  /** Exact hostnames allowed for the fetch and every redirect hop. No wildcards. Must be .gov or in AGENT_HOSTS. */
  allowedHosts: string[];
  /** Independent official system used to confirm each parcel exists (different server). */
  corroborationHosts: string[];
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
  /**
   * Date (YYYY-MM-DD) a person checked the connector against a real published list. Scheduled
   * runs refuse to fetch while null; dry runs still work so the format can be checked.
   */
  parserVerifiedAt: string | null;
  notes: string;
}

export const SOURCES: SourceConfig[] = [
  {
    id: 'nv-clark-treasurer-tax-sale',
    kind: 'tax-sale',
    agency: 'Clark County Treasurer',
    jurisdiction: 'NV-Clark',
    officialUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
    fetchUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
    allowedHosts: ['treasurer.clarkcountynv.gov'],
    corroborationHosts: ['maps.clarkcountynv.gov'],
    // The Treasurer states the auction list is updated daily as payments are made
    // ("List updated frequently" on the live page, verified 2026-09-24).
    declaredCadenceHours: 24,
    minPollMinutes: 15,
    maxPollMinutes: 6 * 60,
    // Reviewed and accepted by the site owner (docs/source-terms-review.md): automated access is allowed as long
    // as it doesn't slow the county's servers.
    termsReviewedAt: '2026-09-26',
    parserVerifiedAt: '2026-09-24',
    notes:
      'Properties delinquent 3 consecutive fiscal years are deeded to the Treasurer as trustee and may be auctioned (NRS 361). ' +
      'Parcels are lined out when redeemed. Not all liens are satisfied by the sale, and the IRS may redeem within 120 days. ' +
      'Confirm sale format, deposit and date in the current auction information notice for each auction.',
  },
  {
    id: 'nv-clark-sid-certificate-sale',
    kind: 'sid-certificate',
    agency: 'Clark County and the cities (special improvement districts)',
    publishedBy: 'Assessment Management Group',
    jurisdiction: 'NV-Clark',
    officialUrl: 'https://www.amgnv.com/notice-of-sale.asp',
    fetchUrl: 'https://www.amgnv.com/notice-of-sale.asp',
    allowedHosts: ['www.amgnv.com'],
    // Every parcel must also exist in the County Assessor's records.
    corroborationHosts: ['maps.clarkcountynv.gov'],
    // Lists go up about 3 weeks before each sale and change as owners pay.
    declaredCadenceHours: 24,
    minPollMinutes: 60,
    maxPollMinutes: 24 * 60,
    // AMG's Terms of Use prohibit copying, downloading or republishing without its prior written consent
    // (checked 2026-09-26, docs/source-terms-review.md). Stays off unless AMG gives written permission.
    termsReviewedAt: null,
    // The first real list is expected about 3 weeks before the Henderson sale (Oct 27, 2026).
    parserVerifiedAt: null,
    notes:
      'Lien certificates for unpaid special improvement district assessments (NRS 271), not the property. ' +
      'The buyer is repaid the assessment plus 1% a month; a deed only if the owner does not redeem in time. ' +
      'Registration is in person 30 to 60 minutes before the sale.',
  },
  {
    id: 'us-irs-auctions',
    kind: 'irs-auction',
    agency: 'Internal Revenue Service',
    jurisdiction: 'NV, CA, AZ, UT',
    officialUrl: 'https://www.irsauctions.gov/',
    // The site's own index of every ad (the same data its cards show).
    fetchUrl: 'https://www.irsauctions.gov/index.json',
    allowedHosts: ['www.irsauctions.gov'],
    // Clark County ads are shown only when the Assessor confirms every parcel. Ads elsewhere in NV, CA, AZ and UT are
    // shown as the IRS lists them, marked as not checked by DeedOwl, with a link to that county's assessor.
    corroborationHosts: ['maps.clarkcountynv.gov'],
    // Ads are posted a few weeks before each sale and updated when sales are canceled.
    declaredCadenceHours: 24,
    minPollMinutes: 60,
    maxPollMinutes: 12 * 60,
    // Reviewed and accepted by the site owner (docs/source-terms-review.md): robots.txt allows all, no terms of use,
    // and U.S. Government works aren't copyrighted (17 U.S.C. 105).
    termsReviewedAt: '2026-09-26',
    // Checked against the live index on 2026-09-26 (139 ads nationwide, none in Nevada that day), and again on 2026-10-05
    // for California, Arizona and Utah (142 ads; those there were past, undated or canceled).
    parserVerifiedAt: '2026-10-05',
    notes:
      'IRS seizure sales (IRC 6335): the taxpayer\'s interest only, subject to senior liens, with a 180-day redemption period (IRC 6337). ' +
      'Judicial sales are ordered by a federal court, whose order sets the terms. Read each notice of sale.',
  },
];

export function getSource(id: string): SourceConfig {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source "${id}". Only registered official sources can be ingested.`);
  return s;
}

/**
 * Registry invariants, checked at startup and in tests:
 *  - every host is an exact .gov name (.gov registration is restricted to verified U.S.
 *    government organizations, so a clone or look-alike cannot obtain one), except a fetch
 *    host listed in AGENT_HOSTS for a source that names that same agent as its publisher;
 *  - corroboration always runs against a .gov host;
 *  - official and fetch URLs are HTTPS on an allowed host.
 */
const GOV_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.gov$/;
export function validateRegistry(sources: SourceConfig[] = SOURCES): void {
  for (const s of sources) {
    for (const h of s.allowedHosts) {
      if (GOV_HOST.test(h)) continue;
      const agent = AGENT_HOSTS[h];
      if (!agent) throw new Error(`${s.id}: host "${h}" is not an exact .gov hostname`);
      if (s.publishedBy !== agent.publisher) throw new Error(`${s.id}: host "${h}" is only allowed for sources published by ${agent.publisher}`);
    }
    for (const h of s.corroborationHosts) {
      if (!GOV_HOST.test(h)) throw new Error(`${s.id}: corroboration host "${h}" is not an exact .gov hostname`);
    }
    if (!s.corroborationHosts.length) throw new Error(`${s.id}: needs an independent .gov corroboration host`);
    for (const u of [s.officialUrl, s.fetchUrl]) {
      const url = new URL(u);
      if (url.protocol !== 'https:' || !s.allowedHosts.includes(url.hostname)) throw new Error(`${s.id}: ${u} is not HTTPS on an allowed host`);
    }
  }
}
