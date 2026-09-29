// Find Deals: where to look for properties, by state and county. Official sources first; other sites (listing
// portals and auction marketplaces) only in their own, clearly labeled list (CLAUDE.md).
import { REO_SOURCES } from './reoSources';
import type { StateCode } from './regions';

export interface DealSource {
  name: string;
  url: string; // an outside https link, or an internal #/ page
  what: string;
}

/** Official sellers that cover every state we serve: federal agencies, Fannie Mae and Freddie Mac, and banks. */
export const NATIONAL_OFFICIAL: DealSource[] = REO_SOURCES.map((s) => ({
  name: s.name,
  url: s.name === 'HUD Home Store' ? 'https://www.hudhomestore.gov/' : s.url,
  what: s.what,
}));

/** The kinds of official sellers to look for in any county. */
export const WHERE_TO_LOOK: { title: string; what: string }[] = [
  { title: 'Tax sales', what: 'The county treasurer or tax collector sells properties (or tax liens) with unpaid property taxes. Look for the county’s tax sale or auction page.' },
  { title: 'Foreclosure auctions', what: 'Lenders’ trustees sell homes at public auction after a notice of sale is recorded with the county recorder and published.' },
  { title: 'Sheriff and court sales', what: 'The sheriff or constable sells property to pay court judgments, including court-ordered foreclosures.' },
  { title: 'Bank-owned and government homes', what: 'Homes that didn’t sell at auction, sold by the lender or a government agency, usually through a listing agent.' },
];

/** What we've already built for a county, on this site. Other counties show the general guide until researched. */
export const COUNTY_PAGES: Record<string, DealSource[]> = {
  'NV/Clark': [
    { name: 'Live tax sales', url: '#/live', what: 'Clark County Treasurer tax-sale parcels and IRS sales, re-checked against the official lists.' },
    { name: 'Bank-owned & government homes', url: '#/bank-owned', what: 'Where Clark County bank-owned and government homes are listed, and how each one sells.' },
    { name: 'Short sales', url: '#/short-sales', what: 'How short sales work in Nevada and how to find them through an agent.' },
    { name: 'Business assets & closures', url: '#/business-assets', what: 'Court, receiver and government sales of business property and equipment.' },
    { name: 'Pre-foreclosures (not for sale)', url: '#/pre-foreclosures', what: 'Notices recorded before a foreclosure auction, to follow toward the sale date.' },
    { name: 'How each sale works', url: '#/playbooks', what: 'Nevada rules for tax, trustee, HOA, sheriff and IRS sales, step by step.' },
  ],
};

export const countyKey = (state: StateCode, county: string) => `${state}/${county}`;

/** Listing portals and auction marketplaces: useful, but not the official seller. Shown only under "Other sites". */
export const OTHER_SITES: { group: string; sites: DealSource[] }[] = [
  {
    group: 'Home listing sites',
    sites: [
      { name: 'Zillow', url: 'https://www.zillow.com/', what: 'Homes listed for sale, with filters for foreclosures and bank-owned homes.' },
      { name: 'Realtor.com', url: 'https://www.realtor.com/', what: 'Homes listed by agents on the local MLS.' },
      { name: 'Redfin', url: 'https://www.redfin.com/', what: 'Homes listed for sale, with sold prices to compare.' },
    ],
  },
  {
    group: 'Online auction companies',
    sites: [
      { name: 'Auction.com', url: 'https://www.auction.com/', what: 'Foreclosure and bank-owned auctions run by a private company.' },
      { name: 'Xome', url: 'https://www.xome.com/', what: 'Bank-owned and foreclosure auctions run by a private company.' },
      { name: 'Hubzu', url: 'https://www.hubzu.com/', what: 'Online auctions of bank-owned homes.' },
      { name: 'Bid4Assets', url: 'https://www.bid4assets.com/', what: 'Online auctions; some counties hold their official tax sales here, so start from the county’s own page.' },
    ],
  },
  {
    group: 'Commercial property',
    sites: [
      { name: 'LoopNet', url: 'https://www.loopnet.com/', what: 'Commercial property for sale and lease.' },
      { name: 'Crexi', url: 'https://www.crexi.com/', what: 'Commercial property listings and auctions.' },
    ],
  },
];

/** How forced sales work in each state, in one line each (from the forced-sales lesson). */
export const STATE_SALES: Record<StateCode, string[]> = {
  NV: [
    'Tax sales: the county treasurer holds the property 2 years (1 if abandoned), then auctions it by quitclaim deed.',
    'Foreclosures: trustee auctions at least 3 months after the notice of default, with 20 days’ posted notice.',
  ],
  CA: [
    'Tax sales: the tax collector sells tax-defaulted property after 5 years (3 for nonresidential commercial), usually online.',
    'Foreclosures: trustee auctions at least 3 months after the notice of default; on 1–4 unit homes, tenants and some buyers get 15 to 45 days to match the winning bid.',
  ],
  AZ: [
    'Tax sales: the county treasurer sells tax liens, not property, each February; bidders bid the interest rate down from 16%.',
    'Foreclosures: trustee auctions no sooner than the 91st day after the notice of sale; the winner pays by 5 p.m. the next business day.',
  ],
  UT: [
    'Tax sales: the county auditor sells property in May or June after four years of unpaid taxes.',
    'Foreclosures: trustee auctions at least 3 months after the notice of default; bids can’t be withdrawn.',
  ],
};

/** The offices Find Deals lists for a county, in order. */
export const OFFICE_LABELS = [
  { key: 'taxSale', name: 'Tax sale', what: 'The county’s tax sale page: dates, rules, deposits and how to bid.' },
  { key: 'treasurer', name: 'Treasurer / tax collector', what: 'Tax bills, unpaid taxes and sale notices.' },
  { key: 'assessor', name: 'Assessor', what: 'Parcel numbers, owners of record, values and parcel maps.' },
  { key: 'recorder', name: 'Recorder', what: 'Deeds, loans, liens and foreclosure notices on record.' },
  { key: 'sheriff', name: 'Sheriff’s civil unit', what: 'Sheriff’s sales of property to pay court judgments.' },
] as const;
