// SAMPLE DATA ONLY. Every address, owner, lender, trustee and document number here is
// fictional and generated from a fixed seed. Dates are relative to today, so the demo
// always has upcoming sales. Replace this module with real county connectors
// (see db/schema.sql and README) before relying on anything shown.

import type {
  AcquisitionStatus,
  Lien,
  LienType,
  Occupancy,
  Property,
  PropertyEvent,
  PropertyType,
  SaleDetails,
  SourceRef,
} from '../types';
import { pacificToIso } from '../lib/time';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260924);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const int = (lo: number, hi: number) => Math.floor(between(lo, hi + 1));
const round = (n: number, to: number) => Math.round(n / to) * to;

const NOW = new Date();
NOW.setMinutes(0, 0, 0);
const DAY = 86_400_000;
const daysFrom = (d: number) => new Date(NOW.getTime() + d * DAY);
const isoDate = (d: number) => daysFrom(d).toISOString().slice(0, 10);
// A sale `d` days from now at `hour` o'clock Las Vegas time.
const isoAt = (d: number, hour: number) => {
  const x = daysFrom(d);
  return pacificToIso(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), hour);
};

const AREAS = [
  { city: 'Las Vegas', zip: '89101', lat: 36.172, lng: -115.141 },
  { city: 'Las Vegas', zip: '89108', lat: 36.205, lng: -115.223 },
  { city: 'Las Vegas', zip: '89117', lat: 36.145, lng: -115.28 },
  { city: 'Las Vegas', zip: '89121', lat: 36.12, lng: -115.09 },
  { city: 'Las Vegas', zip: '89123', lat: 36.037, lng: -115.15 },
  { city: 'Las Vegas', zip: '89147', lat: 36.113, lng: -115.28 },
  { city: 'Henderson', zip: '89014', lat: 36.058, lng: -115.058 },
  { city: 'Henderson', zip: '89052', lat: 35.99, lng: -115.1 },
  { city: 'Henderson', zip: '89015', lat: 36.035, lng: -114.97 },
  { city: 'North Las Vegas', zip: '89030', lat: 36.21, lng: -115.12 },
  { city: 'North Las Vegas', zip: '89031', lat: 36.255, lng: -115.17 },
  { city: 'North Las Vegas', zip: '89032', lat: 36.22, lng: -115.17 },
  { city: 'Boulder City', zip: '89005', lat: 35.978, lng: -114.834 },
  { city: 'Mesquite', zip: '89027', lat: 36.805, lng: -114.067 },
] as const;

const STREETS = [
  'Sample Mesa Dr', 'Example Ridge Ave', 'Demo Canyon Ct', 'Placeholder Sage Ln', 'Mock Juniper Way',
  'Fictional Quail St', 'Testing Palm Blvd', 'Specimen Yucca Pl', 'Prototype Vista Cir', 'Model Agave Rd',
];

const LENDERS = ['Example National Bank', 'Sample Mortgage Co.', 'Demo Home Loans LLC', 'Placeholder Savings'];
const TRUSTEES = ['Sample Trustee Services LLC', 'Example Foreclosure Corp', 'Demo Default Services'];
const HOAS = ['Sample Mesa HOA', 'Example Ridge Community Assn.', 'Demo Canyon Owners Assn.'];
const OWNERS = ['J. Sample', 'A. Example Trust', 'M. Placeholder', 'R. Demo', 'K. Testcase LLC', 'L. Fixture'];

const TRUSTEE_SALE_LOCATION = 'Sample auction location, Las Vegas, NV (see notice of sale)';

let docSeq = 1000;
function src(agency: string, recordedDate?: string, confidence: SourceRef['confidence'] = 'high'): SourceRef {
  return {
    agency,
    url: null,
    documentNumber: `SAMPLE-${++docSeq}`,
    recordedDate,
    lastVerified: new Date(NOW.getTime() - int(1, 72) * 3_600_000).toISOString(),
    confidence,
  };
}

let lienSeq = 0;
function lien(type: LienType, holder: string, amount: number, recordedDaysAgo: number, foreclosing = false): Lien {
  const recordedDate = isoDate(-recordedDaysAgo);
  const agency = type === 'PROPERTY_TAX' ? 'Clark County Treasurer (sample)' : 'Clark County Recorder (sample)';
  return { id: `L${++lienSeq}`, type, holder, amount: round(amount, 10), recordedDate, foreclosing, source: src(agency, recordedDate) };
}

const ev = (daysAgo: number, type: PropertyEvent['type'], description: string, agency = 'Clark County Recorder (sample)'): PropertyEvent => ({
  date: isoDate(-daysAgo),
  type,
  description,
  source: src(agency, isoDate(-daysAgo)),
});

type Scenario =
  | 'tax_deed'
  | 'trustee'
  | 'hoa'
  | 'sheriff'
  | 'judicial'
  | 'irs'
  | 'reo'
  | 'pre_foreclosure'
  | 'postponed'
  | 'lien_only'
  | 'stale'
  | 'reinstated';

const SCENARIOS: Scenario[] = [
  'tax_deed', 'tax_deed', 'tax_deed', 'tax_deed', 'trustee', 'trustee', 'trustee', 'trustee', 'hoa', 'hoa',
  'sheriff', 'judicial', 'irs', 'reo', 'reo', 'pre_foreclosure', 'pre_foreclosure', 'postponed', 'reinstated', 'lien_only',
  'lien_only', 'stale',
];

function baseSale(overrides: Partial<SaleDetails> & Pick<SaleDetails, 'saleType' | 'conductedBy'>): SaleDetails {
  return {
    startsAt: null,
    endsAt: null,
    location: TRUSTEE_SALE_LOCATION,
    officialUrl: null,
    minimumBid: null,
    deposit: null,
    registrationDeadline: null,
    paymentMethods: ["Cashier's check"],
    finalPaymentDeadline: null,
    buyerPremiumPct: null,
    deedType: 'Trustee’s deed (no warranty)',
    redemptionPeriod: 'None after sale',
    eligibility: null,
    postponements: 0,
    ...overrides,
  };
}

function makeProperty(i: number, scenario: Scenario, commercial?: PropertyType): Property {
  const area = AREAS[i % AREAS.length];
  const propertyType: PropertyType =
    commercial ?? (scenario === 'tax_deed' && rand() < 0.4 ? 'Vacant Land' : pick(['Single Family', 'Single Family', 'Condo', 'Townhouse', 'Multi-Family'] as const));
  const land = propertyType === 'Vacant Land' || propertyType === 'Commercial Land';
  const sqft = commercial
    ? land ? null : propertyType === 'Apartments (5+ units)' ? int(6_000, 40_000) : propertyType === 'Hotel / Motel' ? int(15_000, 60_000) : int(2_500, 30_000)
    : land ? null : propertyType === 'Condo' ? int(650, 1300) : int(1100, 3200);
  const value = commercial
    ? land ? round(between(150_000, 1_800_000), 1000) : round((sqft ?? 5000) * between(110, 260), 1000)
    : land ? round(between(25_000, 180_000), 1000) : round((sqft ?? 1500) * between(210, 330), 1000);
  const occupancy: Occupancy = land ? 'Vacant' : commercial ? pick(['Tenant-occupied', 'Tenant-occupied', 'Vacant', 'Unknown'] as const) : pick(['Owner-occupied', 'Tenant-occupied', 'Vacant', 'Unknown'] as const);
  const annualTax = round(value * 0.0075, 10);
  const loanAge = int(900, 5000);
  const dot = lien('FIRST_DEED_OF_TRUST', pick(LENDERS), value * between(0.45, 0.95), loanAge);

  const liens: Lien[] = [];
  const events: PropertyEvent[] = [];
  let sale: SaleDetails | null = null;
  let status: AcquisitionStatus;
  const flags: Property['flags'] = {
    bankruptcy: false,
    codeViolations: rand() < 0.2 ? int(1, 3) : 0,
    floodZone: rand() < 0.15 ? 'AE (high risk)' : 'X (minimal)',
    wildfireRisk: pick(['Low', 'Low', 'Moderate', 'High'] as const),
    zoning: commercial ? (propertyType === 'Industrial' ? pick(['M-1', 'IL']) : propertyType === 'Apartments (5+ units)' ? pick(['R-4', 'R-5']) : pick(['C-1', 'C-2', 'CG'])) : land ? pick(['RE', 'R-E', 'H-2']) : pick(['R-1', 'R-2', 'RS-5.2', 'R-3']),
    openPermits: rand() < 0.2 ? 1 : 0,
  };
  const addHoa = () => {
    if (commercial) return; // HOA super-priority liens are a residential (NRS 116) issue
    if (propertyType === 'Single Family' && rand() < 0.5) return;
    const hoa = pick(HOAS);
    liens.push(lien('HOA_SUPERPRIORITY', hoa, int(1800, 3600), int(200, 400)));
    if (rand() < 0.6) liens.push(lien('HOA_SUBPRIORITY', hoa, int(800, 4000), int(150, 350)));
  };
  const maybeExtras = () => {
    if (rand() < 0.3) liens.push(lien('JUDGMENT', 'Sample Credit Recovery LLC', between(3_000, 40_000), int(100, 1500)));
    if (rand() < 0.15) liens.push(lien('FEDERAL_TAX', 'Internal Revenue Service (sample)', between(8_000, 90_000), int(100, 1200)));
    if (flags.codeViolations && rand() < 0.6) liens.push(lien('CODE_ENFORCEMENT', 'City code enforcement (sample)', between(500, 9_000), int(60, 600)));
    if (rand() < 0.1) liens.push(lien('MECHANICS', 'Sample Roofing Inc.', between(4_000, 25_000), int(60, 500)));
    if (rand() < 0.1) liens.push(lien('MUNICIPAL_UTILITY', 'Sample Water/Sewer District', between(300, 2_500), int(60, 700)));
  };
  const saleDay = int(4, 60);

  switch (scenario) {
    case 'tax_deed': {
      const delinquentYears = int(3, 5);
      const owed = annualTax * delinquentYears * 1.15;
      liens.push(lien('PROPERTY_TAX', 'Clark County Treasurer', owed, delinquentYears * 365, true));
      if (!land) liens.push(dot);
      maybeExtras();
      events.push(
        ev(delinquentYears * 365, 'TAX_DELINQUENT', `Property taxes became delinquent for fiscal year ${NOW.getFullYear() - delinquentYears}.`, 'Clark County Treasurer (sample)'),
        ev((delinquentYears - 2) * 365 + 30, 'DEEDED_TO_TRUSTEE', 'Two-year redemption period expired. Property held in trust by the County Treasurer.', 'Clark County Treasurer (sample)'),
        ev(int(20, 45), 'SALE_SCHEDULED', 'Parcel listed on the Treasurer’s tax auction list.', 'Clark County Treasurer (sample)'),
      );
      // Mirrors the Treasurer's published process: in-person auction at the Government Center,
      // refundable registration deposit, minimum bid = taxes, penalties, interest and costs.
      sale = baseSale({
        saleType: 'TAX_DEED',
        conductedBy: 'Clark County Treasurer',
        startsAt: isoAt(saleDay, 8),
        location: 'Commission Chambers, Clark County Government Center, 500 S. Grand Central Pkwy, Las Vegas',
        minimumBid: round(owed + 350, 10),
        deposit: '$5,000 registration deposit per bidder, certified funds; credited if you win (per the Treasurer auction notice)',
        registrationDeadline: isoAt(saleDay - 8, 17),
        paymentMethods: ['Cash', "Cashier's check", 'Money order'],
        finalPaymentDeadline: isoAt(saleDay, 13),
        deedType: 'Quitclaim deed from the Treasurer, recorded within 30 days, in the bidder’s individual name',
        redemptionPeriod: 'None after the auction. The former owner may protest the sale for 2 years (title insurance may be unavailable meanwhile); the IRS may redeem within 120 days if it holds a lien',
        eligibility: 'Registered bidders only, capped at 280; must register as an individual (not an LLC or trust)',
      });
      status = 'IN_PERSON_AUCTION';
      break;
    }
    case 'trustee':
    case 'postponed':
    case 'stale': {
      dot.foreclosing = true;
      liens.push(dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * between(0, 1.2), 200));
      if (rand() < 0.35) liens.push(lien('SECOND_DEED_OF_TRUST', pick(LENDERS), value * between(0.05, 0.2), loanAge - int(100, 700)));
      addHoa();
      maybeExtras();
      const nodDays = int(150, 260);
      events.push(
        ev(nodDays, 'NOTICE_OF_DEFAULT', `Notice of Default and Election to Sell recorded by ${pick(TRUSTEES)}.`),
        ev(int(25, 60), 'NOTICE_OF_SALE', 'Notice of Trustee’s Sale recorded and posted.'),
      );
      const trustee = pick(TRUSTEES);
      const date = scenario === 'stale' ? -int(10, 30) : saleDay;
      sale = baseSale({
        saleType: 'TRUSTEE_SALE',
        conductedBy: trustee,
        startsAt: isoAt(date, 10),
        minimumBid: round(dot.amount * between(0.55, 1.02), 1000),
        deposit: "Cashier's checks for the full bid amount (confirm with the trustee)",
        finalPaymentDeadline: isoAt(date, 17),
        eligibility: 'Open to the public',
      });
      status = 'IN_PERSON_AUCTION';
      if (scenario === 'postponed') {
        sale.postponements = int(1, 4);
        flags.bankruptcy = rand() < 0.5;
        events.push(ev(int(1, 10), 'SALE_POSTPONED', flags.bankruptcy ? 'Sale postponed: bankruptcy petition filed (automatic stay).' : 'Sale postponed by the beneficiary.'));
        if (flags.bankruptcy) events.push(ev(int(5, 15), 'BANKRUPTCY_FILED', 'Chapter 13 petition filed (sample).', 'U.S. Bankruptcy Court, D. Nev. (sample)'));
        status = 'SALE_CANCELLED_OR_POSTPONED';
      }
      if (scenario === 'stale') {
        events.push(ev(-date, 'SALE_SCHEDULED', 'Scheduled sale date passed. No trustee’s deed or cancellation has been recorded yet.'));
        sale.startsAt = isoAt(date, 10);
        status = 'STATUS_REQUIRES_CONFIRMATION';
      }
      break;
    }
    case 'hoa': {
      const hoa = pick(HOAS);
      const superP = lien('HOA_SUPERPRIORITY', hoa, int(2200, 3600), int(300, 500), true);
      liens.push(superP, lien('HOA_SUBPRIORITY', hoa, int(1500, 6000), int(250, 450)), dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * 0.5, 150));
      maybeExtras();
      events.push(
        ev(int(250, 400), 'LIEN_RECORDED', `Notice of Delinquent Assessment Lien recorded by ${hoa}.`),
        ev(int(120, 200), 'NOTICE_OF_DEFAULT', 'HOA Notice of Default and Election to Sell (NRS 116.31162).'),
        ev(int(20, 50), 'NOTICE_OF_SALE', 'HOA Notice of Foreclosure Sale recorded and mailed.'),
      );
      sale = baseSale({
        saleType: 'HOA_FORECLOSURE',
        conductedBy: `${hoa} (foreclosure agent, sample)`,
        startsAt: isoAt(saleDay, 11),
        minimumBid: round(superP.amount + 2500, 100),
        deposit: "Cashier's checks; confirm the amount with the HOA agent",
        finalPaymentDeadline: isoAt(saleDay, 17),
        deedType: 'Foreclosure deed (NRS 116, no warranty)',
        eligibility: 'Open to the public',
      });
      status = 'IN_PERSON_AUCTION';
      break;
    }
    case 'sheriff': {
      const j = lien('JUDGMENT', 'Sample Credit Recovery LLC', between(25_000, 120_000), int(300, 900), true);
      liens.push(j, dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * 0.4, 120));
      addHoa();
      events.push(
        ev(int(300, 900), 'LIEN_RECORDED', 'Abstract of judgment recorded.'),
        ev(int(20, 40), 'NOTICE_OF_SALE', 'Writ of execution issued; sheriff’s notice of sale posted.', 'Las Vegas Justice / District Court (sample)'),
      );
      sale = baseSale({
        saleType: 'SHERIFF_EXECUTION',
        conductedBy: 'Las Vegas Metropolitan Police Dept. civil section (sample)',
        startsAt: isoAt(saleDay, 10),
        minimumBid: null,
        deposit: 'Certified funds; confirm with the civil section',
        deedType: "Sheriff's certificate of sale, then a sheriff's deed",
        redemptionPeriod: 'Debtor may redeem within 1 year (NRS 21.210)',
        eligibility: 'Open to the public',
      });
      status = 'IN_PERSON_AUCTION';
      break;
    }
    case 'judicial': {
      dot.foreclosing = true;
      liens.push(dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax, 200));
      maybeExtras();
      events.push(
        ev(int(400, 700), 'LIS_PENDENS', 'Lis pendens recorded; judicial foreclosure complaint filed.', 'Eighth Judicial District Court (sample)'),
        ev(int(30, 60), 'NOTICE_OF_SALE', 'Judgment and decree of foreclosure entered; sale ordered.', 'Eighth Judicial District Court (sample)'),
      );
      sale = baseSale({
        saleType: 'JUDICIAL_FORECLOSURE',
        conductedBy: 'Court-appointed commissioner / sheriff (sample)',
        startsAt: isoAt(saleDay, 10),
        minimumBid: round(dot.amount * 0.8, 1000),
        deposit: 'Certified funds; see the court order',
        deedType: "Sheriff's certificate, then a deed after the redemption period",
        redemptionPeriod: 'Up to 1 year after sale',
        eligibility: 'Open to the public',
      });
      status = 'COURT_CONFIRMATION_REQUIRED';
      break;
    }
    case 'irs': {
      const irs = lien('FEDERAL_TAX', 'Internal Revenue Service (sample)', between(60_000, 200_000), int(400, 1200), true);
      liens.push(irs, dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * 0.6, 150));
      events.push(
        ev(int(400, 1200), 'LIEN_RECORDED', 'Notice of Federal Tax Lien recorded.'),
        ev(int(40, 90), 'NOTICE_OF_SALE', 'Levy and seizure; public notice of sealed-bid sale issued.', 'IRS (sample)'),
      );
      sale = baseSale({
        saleType: 'FEDERAL_TAX_SEIZURE',
        conductedBy: 'Internal Revenue Service (sample)',
        startsAt: isoAt(saleDay, 10),
        location: 'Sealed bids delivered to the IRS Property Appraisal & Liquidation Specialist (see notice)',
        minimumBid: round(value * 0.35, 1000),
        deposit: 'Set in the IRS notice of sale (sample)',
        paymentMethods: ["Cashier's check", 'Certified check'],
        deedType: 'Certificate of sale, then an IRS deed',
        redemptionPeriod: '180 days (26 U.S.C. § 6337)',
        eligibility: 'The taxpayer and IRS employees may not bid',
      });
      status = 'SEALED_BID';
      break;
    }
    case 'reo': {
      events.push(
        ev(int(200, 300), 'NOTICE_OF_DEFAULT', 'Notice of Default recorded.'),
        ev(int(60, 150), 'SOLD', 'Trustee sale held with no third-party bidder; property reverted to the lender (REO).'),
      );
      liens.push(lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * 0.3, 90));
      sale = baseSale({
        saleType: 'REO',
        conductedBy: `${pick(LENDERS)} via listing broker (sample)`,
        location: 'Broker listing / lender online auction',
        minimumBid: round(value * between(0.85, 0.98), 1000),
        deposit: 'Earnest money per purchase contract',
        paymentMethods: ['Financing or cash through escrow'],
        deedType: 'Special warranty deed (typical)',
        redemptionPeriod: null,
        eligibility: 'Pre-approval or proof of funds',
      });
      status = 'BROKER_OFFER';
      if (rand() < 0.5) {
        // Some lenders sell REO through a timed online auction instead of a broker listing.
        Object.assign(sale, {
          location: 'Online (lender auction platform)',
          startsAt: isoAt(saleDay, 9),
          endsAt: isoAt(saleDay + 3, 12),
          registrationDeadline: isoAt(saleDay + 2, 17),
          buyerPremiumPct: 5,
          deposit: 'Earnest money within 24 h of winning (see platform terms)',
          finalPaymentDeadline: isoAt(saleDay + 33, 17),
        });
        status = 'ONLINE_BIDDING';
      }
      break;
    }
    case 'pre_foreclosure': {
      liens.push(dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * between(0, 1), 200));
      addHoa();
      events.push(ev(int(10, 80), 'NOTICE_OF_DEFAULT', `Notice of Default and Election to Sell recorded by ${pick(TRUSTEES)}. No sale date yet (NRS 107 requires 3 months first).`));
      status = 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE';
      break;
    }
    case 'reinstated': {
      liens.push(dot, lien('PROPERTY_TAX', 'Clark County Treasurer', annualTax * between(0, 0.5), 200));
      const nod = int(120, 300);
      events.push(
        ev(nod, 'NOTICE_OF_DEFAULT', `Notice of Default and Election to Sell recorded by ${pick(TRUSTEES)}.`),
        ev(int(10, nod - 30), 'SALE_CANCELLED', 'Notice of rescission recorded: the default was cured (loan reinstated or modified).'),
      );
      status = 'SALE_CANCELLED_OR_POSTPONED';
      break;
    }
    case 'lien_only':
    default: {
      liens.push(dot);
      const kind = pick(['JUDGMENT', 'FEDERAL_TAX', 'MECHANICS'] as const);
      const holder = kind === 'JUDGMENT' ? 'Sample Credit Recovery LLC' : kind === 'FEDERAL_TAX' ? 'Internal Revenue Service (sample)' : 'Sample Roofing Inc.';
      liens.push(lien(kind, holder, between(5_000, 60_000), int(60, 700)));
      maybeExtras();
      events.push(ev(int(60, 700), 'LIEN_RECORDED', `${kind.replace(/_/g, ' ').toLowerCase()} lien recorded. No enforcement action is on record.`));
      status = 'NOT_FOR_SALE_LIEN_ONLY';
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  const street = `${int(1000, 9999)} ${pick(STREETS)}`;
  const lastSaleDaysAgo = loanAge + int(0, 30);
  return {
    id: `p${i + 1}`,
    apn: `000-${String(int(10, 99))}-${String(int(100, 999))}-${String(int(100, 999))}`,
    address: street,
    city: area.city,
    county: 'Clark',
    state: 'NV',
    zip: area.zip,
    lat: area.lat + between(-0.025, 0.025),
    lng: area.lng + between(-0.03, 0.03),
    legalDescription: `SAMPLE SUBDIVISION UNIT ${int(1, 9)} PLAT BOOK ${int(10, 180)} PAGE ${int(1, 99)} LOT ${int(1, 200)} BLOCK ${int(1, 20)}`,
    ownerOfRecord: status === 'BROKER_OFFER' ? `${sale?.conductedBy.split(' via')[0]}` : pick(OWNERS),
    propertyType,
    beds: land || commercial ? null : propertyType === 'Condo' ? int(1, 2) : int(2, 5),
    baths: land || commercial ? null : int(1, 3) + (rand() < 0.5 ? 0.5 : 0),
    sqft,
    lotSqft: commercial ? int(10_000, 220_000) : land ? int(4_000, 40_000) : propertyType === 'Condo' ? 0 : int(3_500, 9_000),
    yearBuilt: land ? null : int(1965, 2020),
    assessedValue: round(value * 0.35 * between(0.8, 1), 100),
    estimatedMarketValue: value,
    lastSale: land && rand() < 0.5 ? null : { date: isoDate(-lastSaleDaysAgo), price: round(value * between(0.5, 0.95), 1000) },
    occupancy,
    status,
    sale,
    liens,
    events,
    flags,
    lastUpdated: new Date(NOW.getTime() - int(1, 48) * 3_600_000).toISOString(),
  };
}

// Commercial samples come after the residential ones, so adding them didn't change any residential sample.
const COMMERCIAL_SAMPLES: [Scenario, PropertyType][] = [
  ['tax_deed', 'Commercial Land'], ['tax_deed', 'Retail'], ['trustee', 'Office'], ['trustee', 'Apartments (5+ units)'], ['judicial', 'Industrial'],
  ['sheriff', 'Retail'], ['reo', 'Office'], ['reo', 'Apartments (5+ units)'], ['irs', 'Hotel / Motel'], ['tax_deed', 'Industrial'],
];
export const SAMPLE_PROPERTIES: Property[] = [
  ...Array.from({ length: 60 }, (_, i) => makeProperty(i, SCENARIOS[i % SCENARIOS.length])),
  ...COMMERCIAL_SAMPLES.map(([scenario, type], j) => makeProperty(60 + j, scenario, type)),
];
