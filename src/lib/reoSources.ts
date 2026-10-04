// Where to find bank-owned (REO) and government-owned homes in Clark County, NV.
// Direct sources only: every link goes to a government agency, a government-sponsored enterprise
// (Fannie Mae, Freddie Mac) or the bank / credit union that owns the homes. Never link third-party
// auction marketplaces or listing aggregators here (enforced in features.test.ts).

import type { ClassFilter, PropertyClass } from './propertyClass';

export type ReoGroup = 'government' | 'gse' | 'bank';

export interface ReoSource {
  name: string;
  owner: string; // who runs the site
  group: ReoGroup;
  url: string;
  what: string; // what you'll find there
  howToBuy: string;
  firstLook?: string; // who can buy before investors
  clarkCounty: string; // how often it has Clark County homes
  classes: PropertyClass[]; // residential (1–4 unit homes, residential land) and/or commercial
}

export const HUD_CLARK_SEARCH = 'https://www.hudhomestore.gov/searchresult?citystate=Clark%20County,%20NV';

export const REO_SOURCES: ReoSource[] = [
  {
    name: 'HUD Home Store',
    owner: 'U.S. Department of Housing and Urban Development',
    group: 'government',
    url: HUD_CLARK_SEARCH,
    what: 'Homes HUD took back after an FHA-insured loan was foreclosed.',
    howToBuy: 'Bids go through a HUD-registered real estate broker. Some homes qualify for FHA repair loans.',
    firstLook: 'Owner-occupants, nonprofits and government buyers get an exclusive bidding period first. Each listing shows when investor bids open.',
    clarkCounty: 'A few Clark County homes at most times.',
    classes: ['residential'],
  },
  {
    name: 'VA-acquired homes',
    owner: 'U.S. Department of Veterans Affairs',
    group: 'government',
    url: 'https://www.benefits.va.gov/homeloans/realtors_property_mgmt.asp',
    what: 'Homes VA took back after a VA-guaranteed loan ended in foreclosure.',
    howToBuy: 'VA’s contractor lists them through local agents on the MLS. Ask any licensed agent to show you one.',
    clarkCounty: 'Occasional. They appear on the MLS like other listings.',
    classes: ['residential'],
  },
  {
    name: 'USDA single-family resales',
    owner: 'U.S. Department of Agriculture, Rural Development',
    group: 'government',
    url: 'https://properties.sc.egov.usda.gov/resales/public/searchSFH',
    what: 'Homes from foreclosed USDA rural housing loans.',
    howToBuy: 'Search by state, then contact the USDA office named on the listing. It will explain how to bid.',
    clarkCounty: 'Rare. Only areas USDA counts as rural, such as outlying towns.',
    classes: ['residential'],
  },
  {
    name: 'IRS auctions',
    owner: 'Internal Revenue Service',
    group: 'government',
    url: 'https://www.irsauctions.gov/',
    what: 'Real estate the IRS seized for unpaid federal taxes.',
    howToBuy: 'You bid at an IRS sale (sealed or public), not through a listing. You get only the owner’s interest, and the owner can buy it back (redeem) within 180 days.',
    clarkCounty: 'Rare.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'GSA Real Estate Sales',
    owner: 'U.S. General Services Administration',
    group: 'government',
    url: 'https://www.realestatesales.gov/',
    what: 'Surplus federal buildings and land, sold by online bid.',
    howToBuy: 'Register on the GSA site and bid online. It’s an auction with its own terms, not a listing you buy through an agent.',
    clarkCounty: 'Rare, and usually land or commercial buildings.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'Treasury real property auctions',
    owner: 'U.S. Department of the Treasury',
    group: 'government',
    url: 'https://www.treasury.gov/auctions/treasury/rp/index.shtml',
    what: 'Property forfeited to the federal government.',
    howToBuy: 'Sold at auction, not like a listed home, and every sale has its own terms. Read them before you bid.',
    clarkCounty: 'Rare.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'FDIC real estate sales',
    owner: 'Federal Deposit Insurance Corporation',
    group: 'government',
    url: 'https://www.fdic.gov/asset-sales/real-estate-and-property-sales',
    what: 'Property from failed banks the FDIC took over.',
    howToBuy: 'Follow the instructions on each listing.',
    clarkCounty: 'Rare. Only after a bank failure.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'NCUA real estate for sale',
    owner: 'National Credit Union Administration',
    group: 'government',
    url: 'https://ncua.gov/support-services/conservatorships-liquidations/loan-sales-available-real-estate',
    what: 'Mostly groups of loans from closed credit unions, sold to qualified bidders. Single properties are rare.',
    howToBuy: 'Qualified bidders sign a confidentiality agreement. Follow the instructions for each sale.',
    clarkCounty: 'Rare. Only after a credit union closes.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'Fannie Mae HomePath',
    owner: 'Fannie Mae (government-sponsored)',
    group: 'gse',
    url: 'https://homepath.fanniemae.com/property-finder',
    what: 'Homes Fannie Mae took back after foreclosure. Search Las Vegas or a ZIP code.',
    howToBuy: 'Offers through your agent, submitted on HomePath.',
    firstLook: 'First Look: in Nevada, for the first 30 days a home is on HomePath.com, Fannie Mae accepts offers only from buyers who will live in it, public entities and some nonprofits.',
    clarkCounty: 'Regularly. One of the largest sources of bank-owned homes.',
    classes: ['residential'],
  },
  {
    name: 'Freddie Mac HomeSteps',
    owner: 'Freddie Mac (government-sponsored)',
    group: 'gse',
    url: 'https://www.homesteps.com/',
    what: 'Homes Freddie Mac took back after foreclosure.',
    howToBuy: 'Offers through the listing agent. Search by city or ZIP code.',
    firstLook: 'First Look: in Nevada, during the first 30 days on the MLS, only owner-occupants, public entities and nonprofits can buy.',
    clarkCounty: 'Regularly.',
    classes: ['residential'],
  },
  {
    name: 'Bank of America bank-owned homes',
    owner: 'Bank of America',
    group: 'bank',
    url: 'https://foreclosures.bankofamerica.com/search',
    what: 'The bank’s own list of homes it owns after foreclosure. Search Las Vegas or a ZIP code.',
    howToBuy: 'Offers through the listing agent shown on each home.',
    clarkCounty: 'Varies.',
    classes: ['residential'],
  },
  {
    name: 'Bank of America commercial properties',
    owner: 'Bank of America',
    group: 'bank',
    url: 'https://foreclosures.bankofamerica.com/oreo',
    what: 'The bank’s own list of commercial buildings and land it owns.',
    howToBuy: 'Contact the listing broker shown on each property.',
    clarkCounty: 'Occasional.',
    classes: ['commercial'],
  },
  {
    name: 'First Citizens Bank REO search',
    owner: 'First Citizens Bank',
    group: 'bank',
    url: 'https://www.firstcitizens.com/real-estate',
    what: 'The bank’s nationwide list of real estate it owns. Filter for Nevada.',
    howToBuy: 'Contact the listing agent shown on each property.',
    clarkCounty: 'Rare.',
    classes: ['residential', 'commercial'],
  },
  {
    name: 'U.S. Bank REO properties',
    owner: 'U.S. Bank',
    group: 'bank',
    url: 'https://www.usbank.com/splash/real-estate/bank-owned-residential-real-estate-for-sale.html',
    what: 'How U.S. Bank sells the homes it owns.',
    howToBuy: 'Sold through local agents on the MLS or online auctions. U.S. Bank takes no direct offers.',
    clarkCounty: 'Found on the MLS through an agent, or in an online auction.',
    classes: ['residential'],
  },
  {
    name: 'Chase REO questions',
    owner: 'JPMorgan Chase',
    group: 'bank',
    url: 'https://www.chase.com/personal/mortgage/reo-faq',
    what: 'Chase’s own answers on how it sells homes it owns.',
    howToBuy: 'Chase lists its homes with local agents on the MLS.',
    clarkCounty: 'Found on the MLS through an agent.',
    classes: ['residential'],
  },
];

export const REO_GROUPS: Record<ReoGroup, { title: string; summary: string; commercialSummary?: string }> = {
  government: { title: 'Government agencies', summary: 'HUD, VA, USDA, IRS, GSA, Treasury, FDIC and NCUA', commercialSummary: 'IRS, GSA, Treasury, FDIC and NCUA' },
  gse: { title: 'Fannie Mae & Freddie Mac', summary: 'Government-sponsored. Among the biggest sources of bank-owned homes' },
  bank: { title: 'Banks & credit unions', summary: 'Lenders’ own lists, and how the others sell' },
};

export const reoSourcesIn = (g: ReoGroup, c: ClassFilter = 'all') => REO_SOURCES.filter((s) => s.group === g && (c === 'all' || s.classes.includes(c)));
