// Business assets & closures: where equipment, inventory, vehicles and whole businesses are sold by
// official sellers (courts, court-appointed trustees and receivers, the sheriff, government agencies),
// and how each kind of sale works. Links are checked official sites only; no private liquidators or
// business-for-sale marketplaces (see CLAUDE.md).

export interface BusinessSource {
  name: string;
  owner: string;
  url: string;
  what: string;
  howToUse: string;
}

export const BUSINESS_SOURCES: BusinessSource[] = [
  {
    name: 'U.S. Bankruptcy Court, District of Nevada',
    owner: 'Federal court',
    url: 'https://www.nvb.uscourts.gov/',
    what: 'Chapter 7 and Chapter 11 cases for Nevada businesses. Trustees sell equipment, inventory, vehicles, real estate and whole businesses, with court approval.',
    howToUse: 'Sale notices and bid procedures are filed in each case. Contact the trustee, or the sale contact named in the court’s sale notice.',
  },
  {
    name: 'PACER: federal court records',
    owner: 'Federal courts',
    url: 'https://pacer.uscourts.gov/',
    what: 'Read the filings in any bankruptcy case: asset lists, sale motions, bid deadlines and court orders.',
    howToUse: '$0.10 a page, never more than $3 per document, and free if you spend $30 or less in a quarter.',
  },
  {
    name: 'Eighth Judicial District Court portal',
    owner: 'Clark County district court',
    url: 'https://www.clarkcountycourts.us/portal/',
    what: 'State court cases, including receiverships, where a court-appointed receiver runs or sells a business or its property.',
    howToUse: 'Search the case, then contact the receiver. Receiver sales usually need court approval.',
  },
  {
    name: 'Clark County Sheriff: civil section',
    owner: 'Clark County',
    url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/',
    what: 'Sales under a writ of execution, to pay a court judgment. Business property can be seized and sold this way (NRS Chapter 21).',
    howToUse: 'Check the sheriff’s notices: each one sets the payment terms. Property is sold as-is.',
  },
  {
    name: 'IRS auctions',
    owner: 'Internal Revenue Service',
    url: 'https://www.irsauctions.gov/',
    what: 'Business equipment, vehicles, inventory and real estate the IRS seized for unpaid federal taxes.',
    howToUse: 'Register and bid by the terms in each notice. You get the taxpayer’s interest, which may be subject to prior liens.',
  },
  {
    name: 'GSA Auctions',
    owner: 'U.S. General Services Administration',
    url: 'https://www.gsaauctions.gov/',
    what: 'Federal surplus equipment, vehicles and furniture. Not closed businesses, but a steady source of business equipment.',
    howToUse: 'Register and bid online. Items are sold as-is, and you arrange pickup.',
  },
  {
    name: 'Nevada Secretary of State business search',
    owner: 'State of Nevada',
    url: 'https://orion.nv.gov/portal/public/',
    what: 'Whether a company is active, revoked or dissolved, and who its officers and registered agent are.',
    howToUse: 'Research only: confirm who can legally sell. It isn’t a list of sales. Nevada moved its business records to a new system in 2026, and searching may ask you to create a free account.*',
  },
  {
    name: 'Nevada Department of Taxation',
    owner: 'State of Nevada',
    url: 'https://tax.nv.gov/',
    what: 'Where a seller gets the receipt or certificate showing state taxes are paid, before you buy all or part of a business or its stock of goods.',
    howToUse: 'Without it, Nevada law makes the buyer liable for the seller’s unpaid taxes, up to the price paid (NRS 360.525).',
  },
];

export interface SaleChannel {
  name: string;
  seller: string;
  howItWorks: string;
  whatYouGet: string;
  watchFor: string;
}

export const SALE_CHANNELS: SaleChannel[] = [
  {
    name: 'Bankruptcy sale',
    seller: 'Chapter 7 trustee, or in Chapter 11 the debtor in possession, selling under court approval',
    howItWorks: 'The trustee proposes a sale, often with a first "stalking horse" bid, then takes higher offers by a deadline or at an auction. The court approves the winner.',
    whatYouGet: 'Often "free and clear" of liens, when the court’s sale order says so.',
    watchFor: 'Tight deadlines, deposits, and objections that can delay or change the sale. Read the sale order.',
  },
  {
    name: 'Receivership sale',
    seller: 'A receiver appointed by the state court',
    howItWorks: 'The receiver markets the business or its assets and asks the court to approve the sale.',
    whatYouGet: 'What the court order describes, usually as-is.',
    watchFor: 'Court approval, and whether liens and leases are cleared or stay.',
  },
  {
    name: 'Sheriff’s execution sale',
    seller: 'The sheriff or constable, to pay a judgment',
    howItWorks: 'Property seized under a writ of execution is sold at a public sale after notice.',
    whatYouGet: 'The judgment debtor’s interest, as-is, with no warranty.',
    watchFor: 'Liens that come before the judgment (such as an equipment lender’s) may stay attached. Search for them first.',
  },
  {
    name: 'Tax seizure sale',
    seller: 'The IRS or another tax agency',
    howItWorks: 'Seized property is sold by public auction or sealed bid after notice.',
    whatYouGet: 'The taxpayer’s interest, which may be subject to earlier liens.',
    watchFor: 'For real estate, the owner can redeem within 180 days of an IRS sale.',
  },
];

