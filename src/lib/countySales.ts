// Upcoming county tax sales, with links to the county's own sale page and property list. DeedOwl doesn't copy the
// lists: buyers open them on the county's site. Each entry is checked by hand on the county's page (checkedOn) and
// drops off the site once its sale ends.
//
// To add a sale: copy the dates, times and links from the county treasurer's own page (not an auction company's), with
// the UTC offset for that date, and set checkedOn. Links must be HTTPS on the county's .gov site, or on an official
// site the county offices list already links for that county, such as a Texas appraisal district's (tested).
import type { StateCode } from './regions';

export interface CountySale {
  id: string;
  state: StateCode;
  county: string; // as named in regions.ts
  agency: string;
  name: string; // the county's name for the sale
  format: 'Online auction' | 'In-person auction' | 'Sealed bid' | 'Over-the-counter offers';
  /** Only the dates are announced (no times): startsAt is the first day at 00:00 and endsAt the last day at 23:59, local. */
  datesOnly?: boolean;
  /** Only the start time is announced (a one-day sale in person): endsAt is the end of that day. */
  startOnly?: boolean;
  /** Where it's held, for an in-person sale. */
  place?: string;
  startsAt: string; // ISO with the local UTC offset
  endsAt: string;
  /** Owners can pay the taxes and pull the property until then. */
  redeemBy: string | null;
  /** Last moment to register and pay the deposit. */
  registerBy: string | null;
  /** A registration deadline the county gives as a date only, and what must be in by then (Travis: the bidder form). */
  registerDay?: string; // YYYY-MM-DD
  registerWhat?: string;
  saleUrl: string; // the county's page for the sale
  /** The county's property list; null when it isn't posted yet. */
  listUrl: string | null;
  /** When the county says it will post the list, as a phrase ("on April 22, 2027", "in April 2027"), if it isn’t posted yet. */
  listExpected?: string;
  /** Where the list is when it isn't a file DeedOwl can link (on the sale page itself, or with the county's law firm). */
  listNote?: string;
  /** "Before you can bid": the county's own registration and payment rules, each from its sale page. */
  bidRules?: string[];
  checkedOn: string; // YYYY-MM-DD
}

export const COUNTY_SALES: CountySale[] = [
  {
    // https://www.dallam.org/county/clerk.shtml links the sheriff's joint notice (https://www.dallam.org/county/11.3.26sale.pdf),
    // checked 2026-10-06: "will on the 3rd day of November, 2026, at the Courthouse door of said County, in the City of
    // Dalhart, at 2:00 PM on said day, proceed to sell for cash"; "to satisfy the judgment(s) for delinquent property taxes".
    id: 'tx-dallam-2026-11',
    state: 'TX',
    county: 'Dallam',
    agency: 'Dallam County Sheriff (notice posted by the County Clerk)',
    name: 'November 3, 2026 tax sale',
    format: 'In-person auction',
    startOnly: true,
    place: 'Courthouse door, Dalhart',
    startsAt: '2026-11-03T14:00:00-06:00',
    endsAt: '2026-11-03T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    // Checked 2026-11-01: the clerk's page no longer lists this sale, but the notice is still posted.
    saleUrl: 'https://www.dallam.org/county/11.3.26sale.pdf',
    listUrl: 'https://www.dallam.org/county/11.3.26sale.pdf',
    checkedOn: '2026-11-01',
  },
  {
    // https://www.childresstx.us/pages/county-sheriff, checked 2026-10-06: "Upcoming Sheriff's Sale Property Tax Sale -
    // November 3rds 2026 Location - South steps of the Court House Time - 1:00pm Listing - See attached Notice Of Sale"
    // (posted as images on that page).
    id: 'tx-childress-2026-11',
    state: 'TX',
    county: 'Childress',
    agency: 'Childress County Sheriff’s Office',
    name: 'November 3, 2026 property tax sale',
    format: 'In-person auction',
    startOnly: true,
    place: 'South steps of the courthouse, Childress',
    startsAt: '2026-11-03T13:00:00-06:00',
    endsAt: '2026-11-03T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.childresstx.us/pages/county-sheriff',
    listUrl: null,
    listNote: 'The notice of sale, with the properties, is posted as images on the sheriff’s page.',
    checkedOn: '2026-10-06',
  },
  {
    // https://grimescad.org/ (Grimes Central Appraisal District, which collects taxes), checked 2026-10-06: "The next
    // delinquent tax sale is scheduled for December 1, 2026 at the Grimes County Courthouse in Anderson, Texas." The page
    // sends buyers to its delinquent-tax law firms for the list; DeedOwl doesn't link them.
    id: 'tx-grimes-2026-12',
    state: 'TX',
    county: 'Grimes',
    agency: 'Grimes Central Appraisal District',
    name: 'December 1, 2026 delinquent tax sale',
    format: 'In-person auction',
    datesOnly: true,
    place: 'Grimes County Courthouse, Anderson',
    startsAt: '2026-12-01T00:00:00-06:00',
    endsAt: '2026-12-01T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://grimescad.org/',
    listUrl: null,
    listNote: 'The appraisal district’s page points to its delinquent-tax law firms for the property list.',
    checkedOn: '2026-10-06',
  },
  {
    // https://hoodcad.net/property-tax-sale/ (Hood Central Appraisal District), checked 2026-10-06: sales are held in "the
    // 2nd floor Courtroom of the Hood County Courthouse at 100 East Pearl Street, in the City of Granbury"; "The next Tax
    // Sale for Hood County is tentatively scheduled for March 2, 2027".
    id: 'tx-hood-2027-03',
    state: 'TX',
    county: 'Hood',
    agency: 'Hood Central Appraisal District',
    name: 'March 2, 2027 tax sale (tentative)',
    format: 'In-person auction',
    datesOnly: true,
    place: '2nd floor courtroom, Hood County Courthouse, 100 East Pearl Street, Granbury',
    startsAt: '2027-03-02T00:00:00-06:00',
    endsAt: '2027-03-02T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://hoodcad.net/property-tax-sale/',
    listUrl: null,
    listExpected: 'as a link on its page once the sale information is available',
    checkedOn: '2026-10-06',
  },
  {
    // https://jeffcotax.com/property-tax/delinquent-tax-sale/ (Jefferson County Tax Office), checked 2026-10-06: "2026 SHERIFF
    // SALE DATES *Subject to change* ... December 1, 2026 – Original Sheriff Sale"; "Once the sale begins at 10:00 am, no one
    // will be allowed to obtain a bidder number." Checked 2026-11-01: the revised notice of sale (PDF) is posted and names the
    // place: "In the Jury Impaneling Room, of the Courthouse of Jefferson County, located at 1085 Pearl Street, 1st Floor".
    id: 'tx-jefferson-2026-12',
    state: 'TX',
    county: 'Jefferson',
    agency: 'Jefferson County Tax Office',
    name: 'December 1, 2026 sheriff’s tax sale',
    format: 'In-person auction',
    startOnly: true,
    startsAt: '2026-12-01T10:00:00-06:00',
    endsAt: '2026-12-01T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://jeffcotax.com/property-tax/delinquent-tax-sale/',
    listUrl: 'https://jeffcotax.com/wp-content/uploads/2026/10/December-1-2026-Notice-of-Sale-Revised.pdf',
    place: 'Jury Impaneling Room, Jefferson County Courthouse, 1085 Pearl Street (1st floor), Beaumont',
    bidRules: [
      'Request the tax office’s Statement of No Delinquent Taxes Owed ahead of time, and be registered before the sale starts at 10 a.m.',
      'Buying in a company’s name: bring its assumed name certificate, or its Franchise Tax Account Status with the officers listed.',
      'Pay in cash or by cashier’s check to the Jefferson County Sheriff’s Department by 4 p.m. on sale day.',
    ],
    checkedOn: '2026-11-01',
  },
  {
    // https://www.randallcounty.gov/293/Sheriff-Sale and its sale flyer (DocumentCenter/View/2583), checked 2026-10-06:
    // "NEXT SALE April 6, 2027 11:00 A.M. RANDALL COUNTY ANNEX BUILDING (NORTH ENTRANCE, ELECTIONS OFFICE) 4320 S. WESTERN
    // ST., AMARILLO"; "Registrations must be in our office by April 2, 2027 before 5pm to be able to bid." The flyer lists
    // the properties once there are any; it has none yet.
    id: 'tx-randall-2027-04',
    state: 'TX',
    county: 'Randall',
    agency: 'Randall County Tax Assessor-Collector',
    name: 'April 6, 2027 sheriff’s tax sale',
    format: 'In-person auction',
    startOnly: true,
    place: 'Randall County Annex Building (north entrance, Elections Office), 4320 S. Western St., Amarillo',
    startsAt: '2027-04-06T11:00:00-05:00',
    endsAt: '2027-04-06T23:59:00-05:00',
    redeemBy: null,
    registerBy: null,
    registerDay: '2027-04-02',
    registerWhat: 'Get your bidder registration to the tax office before 5 p.m.',
    saleUrl: 'https://www.randallcounty.gov/293/Sheriff-Sale',
    listUrl: null,
    listExpected: 'in the sale flyer on its page (it has the date but no properties yet)',
    bidRules: ['Register with the tax office by the deadline; you can’t owe Randall County taxes, and registration is renewed each year.', 'Bring a government photo ID for your bidder card; no cards once the sale starts.', 'Payment is due in full at the sale. A personal check is taken but must be replaced with certified funds before 2 p.m. that day.'],
    checkedOn: '2026-10-06',
  },
  {
    // https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings.html, checked
    // 2026-10-06: a "NOVEMBER 3, 2026" listing. The Constable 3 page: register before 10 a.m.; cashier's checks and money
    // orders only. The place isn't on these pages, so it isn't shown.
    id: 'tx-tarrant-2026-11',
    state: 'TX',
    county: 'Tarrant',
    agency: 'Tarrant County Constable, Precinct 3',
    name: 'November 3, 2026 delinquent tax sale',
    format: 'In-person auction',
    startOnly: true,
    startsAt: '2026-11-03T10:00:00-06:00',
    endsAt: '2026-11-03T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings.html',
    listUrl: 'https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings/november-3--2026.html',
    bidRules: [
      'Register before 10 a.m.; no registrations once the sale starts.',
      'Pay with cashier’s checks or money orders for the exact amount (bring several sizes); certified funds are due within one hour after the sale.',
      'Get the county tax office’s statement that you owe no delinquent taxes ($10) before a constable’s deed can be issued.',
    ],
    checkedOn: '2026-10-06',
  },
  {
    // https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings.html, checked
    // 2026-11-01: a "DECEMBER 1, 2026" listing. The Constable 3 page: register before 10 a.m.; cashier's checks and money
    // orders only. The place isn't on these pages, so it isn't shown.
    id: 'tx-tarrant-2026-12',
    state: 'TX',
    county: 'Tarrant',
    agency: 'Tarrant County Constable, Precinct 3',
    name: 'December 1, 2026 delinquent tax sale',
    format: 'In-person auction',
    startOnly: true,
    startsAt: '2026-12-01T10:00:00-06:00',
    endsAt: '2026-12-01T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings.html',
    listUrl: 'https://www.tarrantcountytx.gov/en/constables/constable-3/delinquent-tax-sales/monthly-tax-sales-listings/december-1--2026.html',
    bidRules: [
      'Register before 10 a.m.; no registrations once the sale starts.',
      'Pay with cashier’s checks or money orders for the exact amount (bring several sizes); certified funds are due within one hour after the sale.',
      'Get the county tax office’s statement that you owe no delinquent taxes ($10) before a constable’s deed can be issued.',
    ],
    checkedOn: '2026-11-01',
  },
  {
    // https://www.fortbendcountytx.gov/your-county/county-calendar/november-tax-sales, checked 2026-10-06: "Nov. 03, 2026,
    // 10:00 AM - 4:00 PM Location Gus George Academy-Patton Hall 1521 Eugene Heimann Cir Richmond, TX 77469", with the
    // Constable Precinct 1 list.
    id: 'tx-fort-bend-2026-11',
    state: 'TX',
    county: 'Fort Bend',
    agency: 'Fort Bend County Constable, Precinct 1',
    name: 'November tax sales',
    format: 'In-person auction',
    place: 'Gus George Academy, Patton Hall, 1521 Eugene Heimann Circle, Richmond',
    startsAt: '2026-11-03T10:00:00-06:00',
    endsAt: '2026-11-03T16:00:00-06:00',
    redeemBy: null,
    registerBy: null,
    // Checked 2026-11-01: the calendar page now links a notice for each property instead of one list.
    saleUrl: 'https://www.fortbendcountytx.gov/your-county/county-calendar/november-tax-sales',
    listUrl: 'https://www.fortbendcountytx.gov/your-county/county-calendar/november-tax-sales',
    checkedOn: '2026-11-01',
  },
  {
    // https://tax-office.traviscountytx.gov/properties/foreclosed, checked 2026-10-06: online sales; the bidder registration
    // and $10 fee go to the tax office at least five business days before the sale ("November 3, 2026 / October 27, 2026",
    // "December 1, 2026 / November 24, 2026"); the list goes up on the auction site about 15 days before.
    id: 'tx-travis-2026-11',
    state: 'TX',
    county: 'Travis',
    agency: 'Travis County Tax Office',
    name: 'November 3, 2026 tax sale',
    format: 'Online auction',
    datesOnly: true,
    startsAt: '2026-11-03T00:00:00-06:00',
    endsAt: '2026-11-03T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    registerDay: '2026-10-27',
    registerWhat: 'Send the tax office your bidder registration and the $10 fee',
    saleUrl: 'https://tax-office.traviscountytx.gov/properties/foreclosed',
    listUrl: null,
    listExpected: 'about 15 days before the sale, on the auction site its page links to',
    bidRules: ['Register on the auction site the tax office links, and send the tax office the bidder registration and $10 fee at least five business days before the sale; you need both.', 'Owing back taxes on any Travis County property makes you ineligible to bid.'],
    checkedOn: '2026-10-06',
  },
  {
    id: 'tx-travis-2026-12',
    state: 'TX',
    county: 'Travis',
    agency: 'Travis County Tax Office',
    name: 'December 1, 2026 tax sale',
    format: 'Online auction',
    datesOnly: true,
    startsAt: '2026-12-01T00:00:00-06:00',
    endsAt: '2026-12-01T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    registerDay: '2026-11-24',
    registerWhat: 'Send the tax office your bidder registration and the $10 fee',
    saleUrl: 'https://tax-office.traviscountytx.gov/properties/foreclosed',
    listUrl: null,
    listExpected: 'about 15 days before the sale, on the auction site its page links to',
    bidRules: ['Register on the auction site the tax office links, and send the tax office the bidder registration and $10 fee at least five business days before the sale; you need both.', 'Owing back taxes on any Travis County property makes you ineligible to bid.'],
    checkedOn: '2026-10-06',
  },
  {
    // https://www.liveoakappraisal.com/home/Custom?custurl=/home/taxsales (the Live Oak County Appraisal District), checked
    // 2026-10-06: "Tax Sale List November 3, 2026"; the notice: "the first Tuesday in November, 2026 ... at the North
    // Door, 301 Houston Street of the Courthouse ... George West, Texas, between the hours of 10 o'clock a.m. and 4
    // o'clock p.m."
    id: 'tx-live-oak-2026-11',
    state: 'TX',
    county: 'Live Oak',
    agency: 'Live Oak County Appraisal District (notice of the sheriff’s sale)',
    name: 'November 3, 2026 tax sale',
    format: 'In-person auction',
    place: 'North door of the courthouse, 301 Houston Street, George West',
    startsAt: '2026-11-03T10:00:00-06:00',
    endsAt: '2026-11-03T16:00:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.liveoakappraisal.com/home/Custom?custurl=/home/taxsales',
    listUrl: 'https://www.liveoakappraisal.com/Forms/GetDocument?fileName=MiscellaneousFiles%5C1790618721_Notice+of+Tax+Sale+-+11-3-26.pdf',
    checkedOn: '2026-10-06',
  },
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
  {
    // https://www.mohave.gov/departments/clerk-of-the-board/over-the-counter-tax-deed-sales/, checked 2026-10-05: parcels
    // that didn't sell at the March auction; "Between April 15th and November 30th, bid offers for purchase can be
    // submitted to the Clerk of the Board's Office." The list is updated monthly.
    id: 'az-mohave-2026-otc',
    state: 'AZ',
    county: 'Mohave',
    agency: 'Mohave County Clerk of the Board',
    name: 'over-the-counter tax deed land',
    format: 'Over-the-counter offers',
    datesOnly: true,
    startsAt: '2026-04-15T00:00:00-07:00',
    endsAt: '2026-11-30T23:59:00-07:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.mohave.gov/departments/clerk-of-the-board/over-the-counter-tax-deed-sales/',
    listUrl: 'https://www.mohave.gov/media/lexkhrwq/otc_td_list_1126.pdf',
    checkedOn: '2026-11-01',
  },
  {
    // https://www.cochise.az.gov/903/2026-Over-the-Counter-Tax-Deed-Land-Sale, checked 2026-10-05: "Sale Opens: October 19,
    // 2026 Sale Closes: December 18, 2026". Offers go to the Board of Supervisors office.
    id: 'az-cochise-2026-otc',
    state: 'AZ',
    county: 'Cochise',
    agency: 'Cochise County Board of Supervisors',
    name: '2026 over-the-counter tax deed land sale',
    format: 'Over-the-counter offers',
    datesOnly: true,
    startsAt: '2026-10-19T00:00:00-07:00',
    endsAt: '2026-12-18T23:59:00-07:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.cochise.az.gov/903/2026-Over-the-Counter-Tax-Deed-Land-Sale',
    listUrl: 'https://www.cochise.az.gov/DocumentCenter/View/28513',
    checkedOn: '2026-10-05',
  },
  {
    // https://www.daviscountyutah.gov/controller/tax-administration-group/tax-sale/delinquent-tax-sale, checked 2026-10-05:
    // "The 2027 Davis County Delinquent Tax Sale will be held: May 12th, 2027 @ 10:00 am"; more information in April 2027.
    id: 'ut-davis-2027',
    state: 'UT',
    county: 'Davis',
    agency: 'Davis County',
    name: '2027 delinquent tax sale',
    format: 'In-person auction',
    startOnly: true,
    place: 'Davis County Administration Building, Room 303, 61 South Main Street, Farmington',
    startsAt: '2027-05-12T10:00:00-06:00',
    endsAt: '2027-05-12T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.daviscountyutah.gov/controller/tax-administration-group/tax-sale/delinquent-tax-sale',
    listUrl: null,
    listExpected: 'in April 2027',
    checkedOn: '2026-10-05',
  },
  {
    // https://auditor.utahcounty.gov/may-tax-sale, checked 2026-10-05: property list live April 22, 2027; "May 20, 2027 —
    // Bidding Opens 9:59 am — deadline to redeem ... 10:00 am — online bidding opens"; "May 27, 2027 — Bidding Closes
    // 12:00 pm".
    id: 'ut-utah-2027',
    state: 'UT',
    county: 'Utah',
    agency: 'Utah County Auditor',
    name: '2027 May tax sale',
    format: 'Online auction',
    startsAt: '2027-05-20T10:00:00-06:00',
    endsAt: '2027-05-27T12:00:00-06:00',
    redeemBy: '2027-05-20T09:59:00-06:00',
    registerBy: null,
    saleUrl: 'https://auditor.utahcounty.gov/may-tax-sale',
    listUrl: null,
    listExpected: 'on April 22, 2027',
    checkedOn: '2026-10-05',
  },
  {
    // https://www.saltlakecounty.gov/property-tax/property-tax-sale/, checked 2026-10-05: "The 2027 tax sale will be held
    // May 26th and 27th"; "Information regarding 2027 tax sale will be available April 2027."
    id: 'ut-salt-lake-2027',
    state: 'UT',
    county: 'Salt Lake',
    agency: 'Salt Lake County',
    name: '2027 tax sale',
    format: 'Online auction',
    datesOnly: true,
    startsAt: '2027-05-26T00:00:00-06:00',
    endsAt: '2027-05-27T23:59:00-06:00',
    redeemBy: null,
    registerBy: null,
    saleUrl: 'https://www.saltlakecounty.gov/property-tax/property-tax-sale/',
    listUrl: null,
    listExpected: 'in April 2027',
    checkedOn: '2026-10-05',
  },
];

/** Sales that haven't ended, soonest first; the visitor's state first when given. */
export function upcomingCountySales(now: Date, opts: { state?: StateCode | null; county?: string | null } = {}): CountySale[] {
  return COUNTY_SALES.filter((s) => Date.parse(s.endsAt) > now.getTime() && (!opts.county || (s.state === opts.state && s.county === opts.county)))
    .sort((a, b) => Number(b.state === opts.state) - Number(a.state === opts.state) || Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

