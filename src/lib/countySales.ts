// Upcoming county tax sales, with links to the county's own sale page and property list. DeedOwl doesn't copy the
// lists: buyers open them on the county's site. Each entry is checked by hand on the county's page (checkedOn) and
// drops off the site once its sale ends.
//
// To add a sale: copy the dates, times and links from the county treasurer's own page (not an auction company's), with
// the UTC offset for that date, and set checkedOn. Links must be HTTPS on the county's .gov site (tested).
import type { StateCode } from './regions';

export interface CountySale {
  id: string;
  state: StateCode;
  county: string; // as named in regions.ts
  agency: string;
  name: string; // the county's name for the sale
  format: 'Online auction' | 'In-person auction' | 'Sealed bid';
  startsAt: string; // ISO with the local UTC offset
  endsAt: string;
  /** Owners can pay the taxes and pull the property until then. */
  redeemBy: string | null;
  /** Last moment to register and pay the deposit. */
  registerBy: string | null;
  saleUrl: string; // the county's page for the sale
  /** The county's property list; null when it isn't posted yet. */
  listUrl: string | null;
  checkedOn: string; // YYYY-MM-DD
}

export const COUNTY_SALES: CountySale[] = [
  {
    // https://ttc.lacounty.gov/schedule-of-upcoming-auctions/ and the 2026B Terms and Conditions, checked 2026-10-05.
    id: 'ca-los-angeles-2026B',
    state: 'CA',
    county: 'Los Angeles',
    agency: 'Los Angeles County Treasurer and Tax Collector',
    name: '2026B tax-defaulted property auction',
    format: 'Online auction',
    startsAt: '2026-10-17T15:00:00-07:00',
    endsAt: '2026-10-20T12:00:00-07:00',
    redeemBy: '2026-10-16T17:00:00-07:00',
    registerBy: '2026-10-13T13:00:00-07:00',
    saleUrl: 'https://ttc.lacounty.gov/schedule-of-upcoming-auctions/',
    listUrl: 'https://ttc.lacounty.gov/wp-content/uploads/2026/08/2026B-Auction-Book.pdf',
    checkedOn: '2026-10-05',
  },
  {
    // Same page, "Follow-Up Online Auction (2026B)": properties that didn't sell in October. Its list isn't posted yet.
    id: 'ca-los-angeles-2026B-follow-up',
    state: 'CA',
    county: 'Los Angeles',
    agency: 'Los Angeles County Treasurer and Tax Collector',
    name: '2026B follow-up auction',
    format: 'Online auction',
    startsAt: '2026-12-05T15:00:00-08:00',
    endsAt: '2026-12-08T12:00:00-08:00',
    redeemBy: '2026-12-04T17:00:00-08:00',
    registerBy: '2026-12-01T13:00:00-08:00',
    saleUrl: 'https://ttc.lacounty.gov/schedule-of-upcoming-auctions/',
    listUrl: null,
    checkedOn: '2026-10-05',
  },
];

/** Sales that haven't ended, soonest first; the visitor's state first when given. */
export function upcomingCountySales(now: Date, opts: { state?: StateCode | null; county?: string | null } = {}): CountySale[] {
  return COUNTY_SALES.filter((s) => Date.parse(s.endsAt) > now.getTime() && (!opts.county || (s.state === opts.state && s.county === opts.county)))
    .sort((a, b) => Number(b.state === opts.state) - Number(a.state === opts.state) || a.startsAt.localeCompare(b.startsAt));
}

/** Sale times show in the sale's own local time. Arizona doesn't observe daylight saving time. */
export const SALE_TIME_ZONE: Record<StateCode, string> = { NV: 'America/Los_Angeles', CA: 'America/Los_Angeles', AZ: 'America/Phoenix', UT: 'America/Denver' };
