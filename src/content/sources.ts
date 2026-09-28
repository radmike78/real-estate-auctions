// Every outside source the site links to or relies on, and when its content was last checked.
//
// This file is for us, not the public: tests and `npm run content:status` use it, and the site never imports it.
// Rules (enforced by src/content/content.test.ts):
//   - Every https:// link on the site must be listed here (by exact URL, or by a listed `prefix`).
//   - Listing sources (`role: 'listing'`) must be a government agency, Fannie Mae/Freddie Mac, the bank that owns
//     the property, or the official seller the county names: never an auction marketplace or aggregator (CLAUDE.md).
//   - `checked` is the date someone read the page and confirmed what the site says about it. Leave it null
//     until then: `npm run content:status` lists everything unchecked or older than 6 months.
// When an official page changes, re-read it, fix the site's text, and update `checked` (and `note`).

export type SourceRole =
  | 'listing' // where properties or assets are actually sold
  | 'rules' // laws, procedures, official FAQs and notices the guides are written from
  | 'lookup' // research tools: records, maps, license lookups
  | 'help' // free help for homeowners and consumers
  | 'payment' // advertiser billing
  | 'sample'; // fictional sample data only

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Also covers every link that starts with `url` (for links built from a pattern, like NRS chapters). */
  prefix?: boolean;
  role: SourceRole;
  /** The date the page's content was read and matched against the site (YYYY-MM-DD), or null if not yet. */
  checked: string | null;
  /** Watched for changes by `npm run content:check-sources` (weekly on GitHub): pages whose rules can change
   *  between auctions. A change means: re-read it and update the site. */
  watch?: boolean;
  note?: string;
}

const NRS = (ch: string, title: string, checked: string | null, note?: string): Source => ({
  id: `nrs-${ch}`,
  title: `NRS ${Number(ch)}: ${title}`,
  publisher: 'Nevada Legislature',
  url: `https://www.leg.state.nv.us/NRS/NRS-${ch}.html`,
  role: 'rules',
  checked,
  note,
});

export const SOURCES: Source[] = [
  // ---------------- Nevada law ----------------
  { id: 'nrs', title: 'Nevada Revised Statutes (chapter pages)', publisher: 'Nevada Legislature', url: 'https://www.leg.state.nv.us/NRS/NRS-', prefix: true, role: 'rules', checked: null, note: 'Pattern for chapter links; each chapter the guides rely on is listed below.' },
  NRS('021', 'execution sales (sheriff and constable)', '2026-09-27', '1-year redemption at 1% a month, 60 days between redemptions, rents deducted (21.250); homestead $605,000.'),
  NRS('040', 'possession after foreclosure', '2026-09-27', 'NRS 40.255: 3-day notice to former owners; 60 days for tenants; homes up to 4 units.'),
  NRS('107', 'deeds of trust, trustee sales, mediation', '2026-09-27', '3 months after notice of default; notice of sale posted 20 days, published 3 weeks; reinstatement to 5 days before sale (107.0805); mediation petition 30 days, $25 fee, $500 cap (107.086); 30 days / 90 days to challenge (107.080).'),
  NRS('115', 'homestead exemption', '2026-09-28', '$605,000 of equity; does not apply to mortgages or deeds of trust the owner signed, taxes or mechanic’s liens (115.010); no bid under $605,000 when sold because equity is over the limit (115.050).'),
  NRS('116', 'HOA liens, super-priority, redemption', '2026-09-27', '9 months super-priority; lender payment at least 5 days before sale and recorded 2 days before (116.31164, 116.31166); 60-day redemption at 1% a month plus upkeep; 90 days notice of default to notice of sale (116.31162).'),
  NRS('271', 'special assessments (SID lien certificates)', '2026-09-27', '120 days or 2 years to redeem, 1% a month, 60-day notice, certificate expires after 3 years.'),
  NRS('361', 'property tax and tax sales', '2026-09-27', 'Pay-off until 3 business days before sale (361.585); SID certificate paid within 20 days or sale void (361.595); 2 years to sue (361.600); quitclaim deed.'),
  { id: 'usc-12-5220', title: 'Protecting Tenants at Foreclosure Act (note to 12 U.S.C. 5220)', publisher: 'U.S. House, Office of the Law Revision Counsel', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title12-section5220&num=0&edition=prelim', role: 'rules', checked: '2026-09-27', note: '90 days notice for bona fide tenants.' },

  // ---------------- Clark County ----------------
  { id: 'treasurer-faq', watch: true, title: 'Treasurer: tax auction FAQs', publisher: 'Clark County Treasurer', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs', role: 'rules', checked: '2026-09-27', note: '$5,000 deposit; deposit refund 2–3 weeks; payment forms; SID certificate procedures; names AMG as SID administrator.' },
  { id: 'treasurer-auction-info', watch: true, title: 'Treasurer: real property tax auction information (and past results)', publisher: 'Clark County Treasurer', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/real-property-tax-auction-information', role: 'rules', checked: '2026-09-27', note: 'No 2026 notice posted as of this date.' },
  { id: 'treasurer-notice-2025-05', watch: true, title: 'Treasurer: May 2025 Trustee Auction Information notice and registration form (PDF)', publisher: 'Clark County Treasurer', url: 'https://treasurer.co.clark.nv.us/pdf/May%202025%20Trustee%20Auction%20Info.pdf', role: 'rules', checked: '2026-09-27', note: 'Bidder name on the registration form becomes the deed name and "must be an individual name not a company, LLC or Trust"; deposit refund "approximately 4 - 5 weeks"; 280-bidder cap. Each auction has a new notice: re-read it when the next one is published.' },
  { id: 'treasurer-auction', title: 'Treasurer: auction portal', publisher: 'Clark County Treasurer', url: 'https://treasurer.clarkcountynv.gov/auction', role: 'listing', checked: '2026-09-27' },
  { id: 'treasurer-auction-list', title: 'Treasurer: auction list (the parcels offered)', publisher: 'Clark County Treasurer', url: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList', role: 'listing', checked: '2026-09-27', note: 'Source of the live tax-sale listings (ingest).' },
  { id: 'amg-sid-notice', watch: true, title: 'Assessment Management Group: SID notice of sale', publisher: 'Assessment Management Group (the county’s named SID administrator)', url: 'https://www.amgnv.com/notice-of-sale.asp', role: 'listing', checked: '2026-09-27', note: 'Allowed as a listing source because the Treasurer’s own FAQ names AMG as the administrator for Clark County and the cities.' },
  { id: 'sheriff-sales', watch: true, title: 'Sheriff civil: sheriff’s sales', publisher: 'Clark County Sheriff (Civil Section)', url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/sheriff_s_sales/', role: 'listing', checked: '2026-09-27', note: 'Sales by year (a 2026-sales page exists); Tue–Thu at the Regional Justice Center.' },
  { id: 'sheriff-civil', title: 'Sheriff civil section', publisher: 'Clark County Sheriff (Civil Section)', url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/', role: 'listing', checked: '2026-09-27' },
  { id: 'constable-eviction', title: 'Las Vegas Township Constable: eviction process', publisher: 'Clark County', url: 'https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process', role: 'rules', checked: '2026-09-27' },
  { id: 'assessor', title: 'Clark County Assessor', publisher: 'Clark County Assessor', url: 'https://www.clarkcountynv.gov/government/assessor/', role: 'lookup', checked: '2026-09-27' },
  { id: 'planning', title: 'Comprehensive Planning (zoning)', publisher: 'Clark County', url: 'https://www.clarkcountynv.gov/government/departments/comprehensive_planning_department/', role: 'lookup', checked: '2026-09-27' },
  { id: 'recorder', title: 'Recorder: official records search', publisher: 'Clark County Recorder', url: 'https://recorderecomm.clarkcountynv.gov/AcclaimWeb/', role: 'lookup', checked: '2026-09-27' },
  { id: 'county-maps', title: 'Clark County OpenWeb maps (parcels, aerials)', publisher: 'Clark County', url: 'https://maps.clarkcountynv.gov', prefix: true, role: 'lookup', checked: '2026-09-27' },
  { id: 'courts-mediation', watch: true, title: 'Eighth Judicial District Court: foreclosure mediation', publisher: 'Clark County courts', url: 'https://www.clarkcountycourts.us/departments/adr/foreclosure-mediation/', role: 'help', checked: '2026-09-27' },
  { id: 'courts-portal', title: 'Eighth Judicial District Court: case portal', publisher: 'Clark County courts', url: 'https://www.clarkcountycourts.us/portal/', role: 'lookup', checked: '2026-09-27' },

  // ---------------- Nevada state ----------------
  { id: 'nred-lookup', title: 'Nevada Real Estate Division: license lookup', publisher: 'State of Nevada', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx', role: 'lookup', checked: '2026-09-27' },
  { id: 'nscb-lookup', title: 'Nevada State Contractors Board: license search', publisher: 'State of Nevada', url: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch/ContractorLicenseSearch.aspx', role: 'lookup', checked: '2026-09-27' },
  { id: 'doi-lookup', title: 'Nevada Division of Insurance: license search', publisher: 'State of Nevada', url: 'https://di.nv.gov/nv/r/doi/licensing/search', role: 'lookup', checked: '2026-09-27' },
  { id: 'accountancy-lookup', title: 'CPAverify (Nevada State Board of Accountancy takes part)', publisher: 'National Association of State Boards of Accountancy', url: 'https://cpaverify.org/', role: 'lookup', checked: '2026-09-28', note: 'Replaces the Board’s old license-verification link, which now opens the Board’s portal home page.' },
  { id: 'doi-agent-search', title: 'Nevada Division of Insurance: individual and agency license search (pre-filled)', publisher: 'State of Nevada', url: 'https://di.nv.gov/nv/r/doi/licensing/', prefix: true, role: 'lookup', checked: '2026-09-28', note: 'Undocumented search parameters (p9_lname, p9_fname, p10_agency); checked 2026-09-28 that they pre-fill the form.' },
  { id: 'mld-licensees', title: 'Nevada Division of Mortgage Lending: search licensees (independent escrow, mortgage)', publisher: 'State of Nevada', url: 'https://www.mld.nv.gov/industry-info/search-licensees/', role: 'lookup', checked: '2026-09-28' },
  { id: 'nmls-search', title: 'NMLS Consumer Access: search by name or ID', publisher: 'Nationwide Multistate Licensing System', url: 'https://www.nmlsconsumeraccess.org/Home.aspx/SubSearch', prefix: true, role: 'lookup', checked: null, note: 'Search results for what the visitor typed (the site shows a terms page and a check first).' },
  { id: 'nmls-entity', title: 'NMLS Consumer Access: record by NMLS ID', publisher: 'Nationwide Multistate Licensing System', url: 'https://www.nmlsconsumeraccess.org/EntityDetails.aspx/', prefix: true, role: 'lookup', checked: null, note: 'Record pages by NMLS ID; the site blocks automated checks, so open one in a browser to confirm.' },
  { id: 'nvbar-find', title: 'State Bar of Nevada: find a lawyer', publisher: 'State Bar of Nevada', url: 'https://nvbar.org/for-the-public/find-a-lawyer/', role: 'lookup', checked: '2026-09-27' },
  { id: 'nvbar', title: 'State Bar of Nevada', publisher: 'State Bar of Nevada', url: 'https://www.nvbar.org/', role: 'lookup', checked: '2026-09-27' },
  { id: 'esos', title: 'Nevada Secretary of State: business records (ORION)', publisher: 'State of Nevada', url: 'https://orion.nv.gov/portal/public/', role: 'lookup', checked: '2026-09-27', note: 'Checked in a browser by the site owner: works (ORION, the Secretary of State’s new system).' },
  { id: 'nv-tax', title: 'Nevada Department of Taxation', publisher: 'State of Nevada', url: 'https://tax.nv.gov/', role: 'lookup', checked: '2026-09-27' },
  { id: 'ndep-cleanup', title: 'NDEP: environmental cleanup', publisher: 'Nevada Division of Environmental Protection', url: 'https://ndep.nv.gov/environmental-cleanup', role: 'rules', checked: '2026-09-27' },
  { id: 'nv-ag', title: 'Nevada Attorney General', publisher: 'State of Nevada', url: 'https://ag.nv.gov/', role: 'help', checked: '2026-09-27' },

  // ---------------- Federal ----------------
  { id: 'irs-auctions', watch: true, title: 'IRS auctions', publisher: 'Internal Revenue Service', url: 'https://www.irsauctions.gov/', prefix: true, role: 'listing', checked: '2026-09-27', note: '180-day redemption at 20% compounded daily (IRM 5.10.6). Also the source of IRS listings (ingest).' },
  { id: 'hud-homestore', title: 'HUD Home Store', publisher: 'U.S. Department of Housing and Urban Development', url: 'https://www.hudhomestore.gov/', prefix: true, role: 'listing', checked: '2026-09-27', note: 'Owner-occupant first-bid periods (ML 2025-13).' },
  { id: 'va-reo', title: 'VA: VA-acquired property', publisher: 'U.S. Department of Veterans Affairs', url: 'https://www.benefits.va.gov/homeloans/realtors_property_mgmt.asp', role: 'listing', checked: '2026-09-27' },
  { id: 'usda-reo', title: 'USDA: single-family housing resales', publisher: 'U.S. Department of Agriculture', url: 'https://properties.sc.egov.usda.gov/resales/public/searchSFH', role: 'listing', checked: '2026-09-27' },
  { id: 'fdic-sales', title: 'FDIC: real estate and property sales', publisher: 'Federal Deposit Insurance Corporation', url: 'https://www.fdic.gov/asset-sales/real-estate-and-property-sales', role: 'listing', checked: '2026-09-27' },
  { id: 'ncua-sales', title: 'NCUA: loan sales and available real estate', publisher: 'National Credit Union Administration', url: 'https://ncua.gov/support-services/conservatorships-liquidations/loan-sales-available-real-estate', role: 'listing', checked: '2026-09-27' },
  { id: 'gsa-real-estate', title: 'GSA: real estate sales', publisher: 'U.S. General Services Administration', url: 'https://www.realestatesales.gov/', role: 'listing', checked: '2026-09-27' },
  { id: 'gsa-auctions', title: 'GSA auctions (government personal property)', publisher: 'U.S. General Services Administration', url: 'https://www.gsaauctions.gov/', role: 'listing', checked: '2026-09-27', note: 'Checked in a browser by the site owner: works.' },
  { id: 'treasury-auctions', title: 'U.S. Treasury: real property auctions', publisher: 'U.S. Department of the Treasury', url: 'https://www.treasury.gov/auctions/treasury/rp/index.shtml', role: 'listing', checked: '2026-09-27' },
  { id: 'nv-bankruptcy', title: 'U.S. Bankruptcy Court, District of Nevada', publisher: 'U.S. Courts', url: 'https://www.nvb.uscourts.gov/', role: 'lookup', checked: '2026-09-27' },
  { id: 'pacer', title: 'PACER (federal court records)', publisher: 'U.S. Courts', url: 'https://pacer.uscourts.gov/', role: 'lookup', checked: '2026-09-27', note: 'Fees as stated on the site.' },
  { id: 'fdic-bankfind', title: 'FDIC BankFind', publisher: 'Federal Deposit Insurance Corporation', url: 'https://banks.data.fdic.gov/bankfind-suite/bankfind', role: 'lookup', checked: '2026-09-27' },
  { id: 'ncua-mapping', title: 'NCUA credit union locator', publisher: 'National Credit Union Administration', url: 'https://mapping.ncua.gov/', role: 'lookup', checked: '2026-09-27' },
  { id: 'nmls', title: 'NMLS Consumer Access (loan officer lookup)', publisher: 'Nationwide Multistate Licensing System', url: 'https://www.nmlsconsumeraccess.org/', role: 'lookup', checked: '2026-09-27', note: 'Checked in a browser by the site owner: works.' },
  { id: 'ada-title-iii', title: 'ADA Title III (public accommodations)', publisher: 'U.S. Department of Justice', url: 'https://www.ada.gov/topics/title-iii/', role: 'rules', checked: '2026-09-27', note: 'Readily achievable barrier removal and alterations. Landlord/tenant shared duty is 28 CFR 36.201(b).' },
  { id: 'epa-aai', title: 'EPA: All Appropriate Inquiries (brownfields)', publisher: 'U.S. Environmental Protection Agency', url: 'https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries', role: 'rules', checked: '2026-09-27', note: 'ASTM E1527-21; within 1 year before acquisition, with interviews, records, site visit and lien search within 180 days.' },
  { id: 'epa-enviro', title: 'EPA Envirofacts', publisher: 'U.S. Environmental Protection Agency', url: 'https://enviro.epa.gov/', role: 'lookup', checked: '2026-09-27' },
  { id: 'sba-504', title: 'SBA 504 loans', publisher: 'U.S. Small Business Administration', url: 'https://www.sba.gov/loans/504-loans/', role: 'rules', checked: '2026-09-27', note: 'Excludes passive or speculative businesses and investment in rental real estate.' },
  { id: 'hud-counselors', title: 'HUD: find a housing counselor', publisher: 'U.S. Department of Housing and Urban Development', url: 'https://answers.hud.gov/housingcounseling/', role: 'help', checked: '2026-09-27' },
  { id: 'cfpb-counselors', title: 'CFPB: find a housing counselor', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/find-a-housing-counselor/', role: 'help', checked: '2026-09-27' },

  // ---------------- Fannie Mae / Freddie Mac ----------------
  { id: 'homepath', watch: true, title: 'Fannie Mae HomePath', publisher: 'Fannie Mae', url: 'https://homepath.fanniemae.com/property-finder', role: 'listing', checked: '2026-09-27', note: '30-day First Look in Nevada.' },
  { id: 'homesteps', title: 'Freddie Mac HomeSteps', publisher: 'Freddie Mac', url: 'https://www.homesteps.com/', role: 'listing', checked: '2026-09-27', note: 'First Look: the first 30 days on the MLS go to owner-occupants, public entities and nonprofits; nationwide rule; excludes multi-family and land.' },

  // ---------------- Banks (their own bank-owned homes) ----------------
  { id: 'bofa-reo', title: 'Bank of America: bank-owned homes', publisher: 'Bank of America', url: 'https://foreclosures.bankofamerica.com/oreo', role: 'listing', checked: '2026-09-27' },
  { id: 'bofa-reo-search', title: 'Bank of America: bank-owned homes search', publisher: 'Bank of America', url: 'https://foreclosures.bankofamerica.com/search', role: 'listing', checked: '2026-09-27' },
  { id: 'chase-reo', title: 'Chase: REO FAQ', publisher: 'JPMorgan Chase', url: 'https://www.chase.com/personal/mortgage/reo-faq', role: 'listing', checked: '2026-09-27' },
  { id: 'usbank-reo', title: 'U.S. Bank: bank-owned residential real estate', publisher: 'U.S. Bank', url: 'https://www.usbank.com/splash/real-estate/bank-owned-residential-real-estate-for-sale.html', role: 'listing', checked: '2026-09-27' },
  { id: 'firstcitizens-reo', title: 'First Citizens Bank: real estate for sale', publisher: 'First Citizens Bank', url: 'https://www.firstcitizens.com/real-estate', role: 'listing', checked: '2026-09-27' },

  // ---------------- Free help ----------------
  { id: 'lacsn', title: 'Legal Aid Center of Southern Nevada', publisher: 'Legal Aid Center of Southern Nevada (nonprofit)', url: 'https://www.lacsn.org/', role: 'help', checked: '2026-09-27' },
  { id: 'nls', title: 'Nevada Legal Services', publisher: 'Nevada Legal Services (nonprofit)', url: 'https://nevadalegalservices.org/', role: 'help', checked: '2026-09-27' },
  { id: 'civil-self-help', title: 'Civil Law Self-Help Center', publisher: 'Legal Aid Center of Southern Nevada (under contract with Clark County)', url: 'https://www.civillawselfhelpcenter.org/', role: 'help', checked: '2026-09-27' },

  // ---------------- Research tools and billing ----------------
  { id: 'google-maps', title: 'Google Maps (Street View and map search)', publisher: 'Google', url: 'https://www.google.com/maps/', prefix: true, role: 'lookup', checked: '2026-09-27', note: 'Research tool only, never a listing source. Not linked for homes that aren’t for sale.' },
  { id: 'stripe-checkout', title: 'Stripe Checkout', publisher: 'Stripe', url: 'https://checkout.stripe.com/', prefix: true, role: 'payment', checked: null },
  { id: 'stripe-billing', title: 'Stripe billing portal', publisher: 'Stripe', url: 'https://billing.stripe.com/', prefix: true, role: 'payment', checked: null },
  { id: 'example', title: 'Placeholder addresses in fictional sample profiles', publisher: 'IANA example domain', url: 'https://example.com/', prefix: true, role: 'sample', checked: null },
];

/** Hosts allowed as listing sources: government, Fannie Mae/Freddie Mac, the banks that own the homes, and the
 *  SID administrator the county names. Anything else as a listing source fails the tests. */
export const LISTING_HOSTS = [
  /\.gov$/,
  /(^|\.)fanniemae\.com$/,
  /(^|\.)homesteps\.com$/,
  /(^|\.)(bankofamerica|chase|usbank|firstcitizens)\.com$/,
  /^www\.amgnv\.com$/,
  /^treasurer\.co\.clark\.nv\.us$/,
];

export const sourceById = (id: string) => SOURCES.find((s) => s.id === id);
/** The listed source that covers a link, if any. */
export const sourceForUrl = (url: string) => SOURCES.find((s) => (s.prefix ? url.startsWith(s.url) : url === s.url));
