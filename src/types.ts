// Core domain model for the distressed-property / forced-sale discovery prototype.
// Mirrors db/schema.sql; every fact carries a SourceRef so the UI can show provenance.

export type Confidence = 'high' | 'medium' | 'low';

export interface SourceRef {
  agency: string;
  url: string | null; // null in sample data — never fabricate official links
  documentNumber?: string;
  recordedDate?: string; // ISO date
  lastVerified: string; // ISO datetime
  confidence: Confidence;
}

export type SaleType =
  | 'TAX_DEED'
  | 'TAX_LIEN_CERTIFICATE'
  | 'TRUSTEE_SALE'
  | 'JUDICIAL_FORECLOSURE'
  | 'HOA_FORECLOSURE'
  | 'SHERIFF_EXECUTION'
  | 'FEDERAL_TAX_SEIZURE'
  | 'REO';

// Answers "can I actually buy this, and how?"
export type AcquisitionStatus =
  | 'ONLINE_BIDDING'
  | 'IN_PERSON_AUCTION'
  | 'SEALED_BID'
  | 'BROKER_OFFER'
  | 'COURT_CONFIRMATION_REQUIRED'
  | 'LIEN_CERTIFICATE_ONLY'
  | 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE'
  | 'SALE_CANCELLED_OR_POSTPONED'
  | 'STATUS_REQUIRES_CONFIRMATION'
  | 'NOT_FOR_SALE_LIEN_ONLY';

export type LienType =
  | 'PROPERTY_TAX'
  | 'FIRST_DEED_OF_TRUST'
  | 'SECOND_DEED_OF_TRUST'
  | 'HOA_SUPERPRIORITY'
  | 'HOA_SUBPRIORITY'
  | 'FEDERAL_TAX'
  | 'STATE_TAX'
  | 'JUDGMENT'
  | 'MECHANICS'
  | 'CODE_ENFORCEMENT'
  | 'MUNICIPAL_UTILITY';

export interface Lien {
  id: string;
  type: LienType;
  holder: string;
  amount: number;
  recordedDate: string;
  foreclosing?: boolean; // the lien being enforced by the pending sale
  source: SourceRef;
}

export type EventType =
  | 'TAX_DELINQUENT'
  | 'LIEN_RECORDED'
  | 'NOTICE_OF_DEFAULT'
  | 'NOTICE_OF_SALE'
  | 'LIS_PENDENS'
  | 'SALE_SCHEDULED'
  | 'SALE_POSTPONED'
  | 'SALE_CANCELLED'
  | 'SOLD'
  | 'BANKRUPTCY_FILED'
  | 'DEEDED_TO_TRUSTEE';

export interface PropertyEvent {
  date: string;
  type: EventType;
  description: string;
  source: SourceRef;
}

export interface SaleDetails {
  saleType: SaleType;
  conductedBy: string; // trustee, treasurer, sheriff, HOA agent
  startsAt: string | null; // ISO datetime
  endsAt: string | null;
  location: string; // physical location or "Online"
  officialUrl: string | null;
  minimumBid: number | null;
  deposit: string | null;
  registrationDeadline: string | null;
  paymentMethods: string[];
  finalPaymentDeadline: string | null;
  buyerPremiumPct: number | null;
  deedType: string;
  redemptionPeriod: string | null;
  eligibility: string | null;
  postponements: number;
  /** Replaces the sale type's general "what you would be buying" text when this sale's terms differ. */
  whatYouBuy?: string;
}

export type PropertyType =
  | 'Single Family'
  | 'Condo'
  | 'Townhouse'
  | 'Multi-Family' // 2–4 units
  | 'Vacant Land'
  // Commercial (see src/lib/propertyClass.ts)
  | 'Apartments (5+ units)'
  | 'Retail'
  | 'Office'
  | 'Industrial'
  | 'Hotel / Motel'
  | 'Commercial Land'
  | 'Other commercial' // Assessor commercial codes that aren't clearly retail, office or lodging
  | 'Not classified'; // the Assessor record doesn't say, or the use is neither (public land, utilities)
export type Occupancy = 'Owner-occupied' | 'Tenant-occupied' | 'Vacant' | 'Unknown';

/** Where a property record comes from. Sample records never appear in production builds. */
export type PropertyOrigin = 'sample' | 'treasurer-feed' | 'irs-feed';

export interface Property {
  id: string;
  /** Absent on sample records. 'treasurer-feed' / 'irs-feed' = from the signed, verified Treasurer or IRS list. */
  origin?: PropertyOrigin;
  apn: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  lat: number | null; // null = no verified map location
  lng: number | null;
  legalDescription: string | null;
  ownerOfRecord: string | null;
  propertyType: PropertyType;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  assessedValue: number | null;
  estimatedMarketValue: number | null; // null = no estimate: the buyer pulls their own comps
  lastSale: { date: string; price: number } | null;
  occupancy: Occupancy;
  status: AcquisitionStatus;
  sale: SaleDetails | null;
  liens: Lien[];
  /** false = no lien search has been done for this record, so an empty list means "unknown", not "none". */
  liensChecked?: boolean;
  events: PropertyEvent[];
  /** null = not checked for this record (verified listings carry only what the official source publishes). */
  flags: {
    bankruptcy: boolean;
    codeViolations: number;
    floodZone: string;
    wildfireRisk: 'Low' | 'Moderate' | 'High';
    zoning: string;
    openPermits: number;
  } | null;
  /** Clark County Assessor land use, when the record came from the verified feed. */
  landUse?: { code: string; description: string } | null;
  lastUpdated: string;
}
