// Find Deals: where to look for properties, by state and county. Official sources first; other sites (listing
// portals and auction marketplaces) only in their own, clearly labeled list (CLAUDE.md).
import { REO_SOURCES } from './reoSources';
import type { StateCode } from './regions';

export interface DealSource {
  name: string;
  url: string; // an outside https link, or an internal #/ page
  what: string;
  /** National sellers only: federal agencies, Fannie Mae and Freddie Mac, or banks (shown as separate groups). */
  group?: 'government' | 'gse' | 'bank';
}

/** Official sellers that cover every state we serve: federal agencies, Fannie Mae and Freddie Mac, and banks. */
export const NATIONAL_OFFICIAL: DealSource[] = REO_SOURCES.map((s) => ({
  name: s.name,
  url: s.name === 'HUD Home Store' ? 'https://www.hudhomestore.gov/' : s.url,
  what: s.what,
  group: s.group,
}));

/** The national sellers, worded for the visitor's state (the Clark County page's search tips don't apply elsewhere). */
export const nationalOfficialFor = (stateName: string): DealSource[] =>
  NATIONAL_OFFICIAL.map((s) => ({
    ...s,
    what: s.what.replace('Search Las Vegas or a ZIP code.', 'Search your city or ZIP code.').replace('Filter for Nevada.', `Filter for ${stateName}.`),
  }));

/** The kinds of official sellers to look for in any county. */
export const WHERE_TO_LOOK: { title: string; what: string }[] = [
  { title: 'Tax sales', what: 'The county treasurer or tax collector sells properties (or tax liens) with unpaid property taxes. Look for the county’s tax sale or auction page.' },
  { title: 'Foreclosure auctions', what: 'Lenders’ trustees sell homes at public auction after a notice of sale is recorded with the county recorder and published.' },
  { title: 'Sheriff and court sales', what: 'The sheriff or constable sells property to pay court judgments, including court-ordered foreclosures.' },
  { title: 'Bank-owned and government homes', what: 'Homes a lender or government agency already owns, most often after a foreclosure, sold usually through a listing agent.' },
];

/** What we've already built for a county, on this site. Other counties show the general guide until researched. */
export const COUNTY_PAGES: Record<string, DealSource[]> = {
  'NV/Clark': [
    { name: 'Live tax sales', url: '#/live', what: 'Upcoming county tax sales, plus Clark County and IRS parcels, re-checked against the official lists.' },
    { name: 'Bank-owned & government homes', url: '#/bank-owned', what: 'Where Clark County bank-owned and government homes are listed, and how each one sells.' },
    { name: 'Short sales', url: '#/short-sales', what: 'How short sales work in Nevada and how to find them through an agent.' },
    { name: 'Business assets & closures', url: '#/business-assets', what: 'Court, receiver and government sales of business property and equipment.' },
    { name: 'Pre-foreclosures (not for sale)', url: '#/pre-foreclosures', what: 'Notices recorded before a foreclosure auction, to follow toward the sale date.' },
    { name: 'Sale guides', url: '#/playbooks', what: 'Rules for tax, trustee, HOA, sheriff and IRS sales in Nevada, California, Arizona, Utah and Texas, step by step.' },
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
    'Tax sales: about a year after taxes go unpaid, the county issues a tax certificate, and the owner has 2 years (1 if abandoned) to pay. If they don’t, the county treasurer takes title in trust and auctions it with a quitclaim deed (a deed with no promise about title). In all, about 3 years of unpaid taxes (2 if abandoned).',
    'Foreclosures: trustee auctions at least 3 months after the notice of default, with 20 days’ posted notice. The owner can’t redeem afterward, but if the sale wiped out a junior federal tax lien, the United States can redeem within 120 days (26 USC 7425).',
  ],
  CA: [
    'Tax sales: the tax collector sells tax-defaulted property after 5 years (3 for nonresidential commercial), usually online.',
    'Foreclosures: trustee auctions at least 3 months after the notice of default; on 1–4 unit homes, tenants can match, and other eligible bidders can beat, the winning bid within 15 to 45 days. The owner can’t redeem afterward. If the sale wiped out a junior federal tax lien, the United States can still redeem within 120 days (26 USC 7425).',
  ],
  AZ: [
    'Tax sales: the county treasurer sells tax liens, not property, each February; bidders bid the interest rate down from 16%. Separately, the county board of supervisors auctions land the state already took by tax deed (A.R.S. 42-18301 to 42-18303).',
    'Foreclosures: trustee auctions no sooner than the 91st day after the notice of sale; the winner pays by 5 p.m. the next business day, and the owner can’t redeem afterward (A.R.S. 33-811). One exception: if the sale wiped out a junior federal tax lien, the United States can redeem within 120 days (or the state period if longer); if the IRS wasn’t properly notified, its lien stays (26 USC 7425).',
  ],
  UT: [
    'Tax sales: the county auditor sells property in May or June, four years after the taxes went delinquent.',
    'Foreclosures: trustee auctions at least 3 months after the notice of default; bids can’t be withdrawn, and the owner can’t redeem afterward. If the sale wiped out a junior federal tax lien, the United States can still redeem within 120 days (26 USC 7425).',
  ],
  TX: [
    'Tax sales: after a court judgment, a sheriff or constable auctions the property on the first Tuesday of the month; the owner can redeem for 180 days, or 2 years for a homestead, land designated for agricultural use or a mineral interest.',
    'Foreclosures: trustee auctions on the first Tuesday of the month, between 10 a.m. and 4 p.m., with at least 21 days’ notice; after a mortgage foreclosure the owner has no right to redeem. After a property tax loan foreclosure they do (Tax Code 32.06(k)). If the sale wiped out a junior federal tax lien, the United States can still redeem within 120 days; a lien the sale didn’t wipe out stays on title.',
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

/** Texas names its offices differently: the tax assessor-collector, the appraisal district, the county clerk. */
const OFFICE_LABELS_TX = [
  { key: 'taxSale', name: 'Tax sale', what: 'Where the county lists sheriff’s and constables’ tax sales: dates, rules and how to register.' },
  { key: 'treasurer', name: 'Tax assessor-collector', what: 'Tax bills, unpaid taxes and the statement you need before you bid.' },
  { key: 'assessor', name: 'Appraisal district', what: 'Parcel (account) numbers, owners of record, values and maps.' },
  { key: 'recorder', name: 'County clerk', what: 'Deeds, loans, liens and foreclosure notices on record.' },
  { key: 'sheriff', name: 'Sheriff or constable', what: 'Sheriff’s and constables’ sales of property to pay taxes or court judgments.' },
] as const;

/** The office labels for a state. */
export const officeLabelsFor = (state: StateCode) => (state === 'TX' ? OFFICE_LABELS_TX : OFFICE_LABELS);
