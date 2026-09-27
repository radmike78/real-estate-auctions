// Advertising professionals: real estate agents, lenders, title/escrow, insurance, contractors, home inspectors,
// property managers, real estate attorneys and CPAs. Every category needs an official Nevada lookup to verify against.
//
// Every profile is a paid advertisement, but ranking is NEUTRAL: filters decide who matches,
// and matches are shown in a daily rotating order that is the same for everyone. Paying more
// never buys better placement. (RESPA section 8; CFPB Advisory Opinion 88 FR 9162, Feb 13, 2023,
// still in effect in 2026: a platform that steers consumers to settlement-service providers based
// on payments violates the anti-kickback rule. It warns that equal-fee random rotation can still be
// steering if presented as tailored, and that disclosures don't cure it. So: never label anyone
// "best", "top" or "recommended", and never push an advertiser to a user after a search.)
//
// A profile is shown only while ALL of these hold:
//   - its license/registration was confirmed by a person on the official regulator lookup
//     within the last 90 days, shows active, and (if it expires) hasn't expired;
//   - its advertising is paid through today;
//   - every contact link is safe (tel:, mailto:, https:).

export const REVERIFY_DAYS = 90;

export type Category =
  | 'agent' | 'loan_officer' | 'mortgage_company' | 'bank' | 'credit_union' | 'private_lender' | 'title_escrow' | 'insurance' | 'contractor'
  | 'home_inspector' | 'property_manager' | 'attorney' | 'cpa';

export interface CategoryInfo {
  label: string;
  plural: string;
  group: 'Real estate' | 'Financing' | 'Closing & protection' | 'Inspection & repairs' | 'Legal & tax' | 'Ownership';
  regulator: string;
  lookupUrl: string;
  licenseLabel: string;
  licensePattern: RegExp;
  licenseHint: string;
  licenseExpires: boolean; // bank charters/FDIC certs don't expire
  services: readonly string[];
  financing: boolean;
  /** A licensed person (not a company) advertises in this category. */
  individual?: boolean;
  /** A rule of this profession's regulator about advertising, shown on the application. */
  advertisingNote?: string;
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  agent: {
    label: 'Real estate agent',
    plural: 'Real estate agents',
    group: 'Real estate',
    regulator: 'Nevada Real Estate Division',
    lookupUrl: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx',
    licenseLabel: 'Nevada real estate license number',
    licensePattern: /^(S|BS|B)\.\d{5,8}(\.[A-Z]{1,5})?$/,
    licenseHint: 'e.g. S.0012345, BS.0012345 or B.0012345',
    licenseExpires: true,
    services: ['Short sales', 'Bank-owned (REO)', 'Auction & tax-sale properties', 'Investors', 'First-time buyers', 'Probate & estate sales'],
    financing: false,
  },
  loan_officer: {
    label: 'Loan officer',
    plural: 'Loan officers',
    group: 'Financing',
    regulator: 'Nevada Division of Mortgage Lending or federal registration (via NMLS Consumer Access)',
    lookupUrl: 'https://www.nmlsconsumeraccess.org/',
    licenseLabel: 'Individual NMLS ID',
    licensePattern: /^\d{3,8}$/,
    licenseHint: 'Digits only, e.g. 123456',
    licenseExpires: true,
    services: [],
    financing: true,
  },
  mortgage_company: {
    label: 'Mortgage company',
    plural: 'Mortgage lenders & brokers',
    group: 'Financing',
    regulator: 'Nevada Division of Mortgage Lending (via NMLS Consumer Access)',
    lookupUrl: 'https://www.nmlsconsumeraccess.org/',
    licenseLabel: 'Company NMLS ID',
    licensePattern: /^\d{3,8}$/,
    licenseHint: 'Digits only, e.g. 3030',
    licenseExpires: true,
    services: [],
    financing: true,
  },
  bank: {
    label: 'Bank',
    plural: 'Banks',
    group: 'Financing',
    regulator: 'FDIC BankFind',
    lookupUrl: 'https://banks.data.fdic.gov/bankfind-suite/bankfind',
    licenseLabel: 'FDIC certificate number',
    licensePattern: /^\d{1,6}$/,
    licenseHint: 'The "FDIC Cert #" shown on BankFind',
    licenseExpires: false,
    services: [],
    financing: true,
  },
  credit_union: {
    label: 'Credit union',
    plural: 'Credit unions',
    group: 'Financing',
    regulator: 'NCUA Credit Union Locator',
    lookupUrl: 'https://mapping.ncua.gov/',
    licenseLabel: 'NCUA charter number',
    licensePattern: /^\d{1,6}$/,
    licenseHint: 'The charter number shown by the NCUA locator',
    licenseExpires: false,
    services: [],
    financing: true,
  },
  private_lender: {
    label: 'Hard money / private lender',
    plural: 'Hard money & private lenders',
    group: 'Financing',
    regulator: 'Nevada Division of Mortgage Lending (via NMLS Consumer Access)',
    lookupUrl: 'https://www.nmlsconsumeraccess.org/',
    licenseLabel: 'Company NMLS ID',
    licensePattern: /^\d{3,8}$/,
    licenseHint: 'Company NMLS ID. Most Nevada mortgage licenses are on NMLS (NRS 645B); commercial-only lenders without one can’t be listed yet',
    licenseExpires: true,
    services: [],
    financing: true,
  },
  title_escrow: {
    label: 'Title & escrow',
    plural: 'Title & escrow companies',
    group: 'Closing & protection',
    regulator: 'Nevada Division of Insurance (title agents and escrow officers)',
    lookupUrl: 'https://di.nv.gov/nv/r/doi/licensing/search',
    licenseLabel: 'Nevada Division of Insurance license number',
    licensePattern: /^[A-Z0-9-]{3,15}$/,
    licenseHint: 'As shown on the Division of Insurance lookup',
    licenseExpires: true,
    services: ['Title insurance', 'Escrow & closing', 'Title search / reports', 'Quiet title referrals', 'Investor closings', 'Mobile notary'],
    financing: false,
  },
  insurance: {
    label: 'Insurance',
    plural: 'Insurance agents',
    group: 'Closing & protection',
    regulator: 'Nevada Division of Insurance',
    lookupUrl: 'https://di.nv.gov/nv/r/doi/licensing/search',
    licenseLabel: 'Nevada insurance license number or NPN',
    licensePattern: /^[A-Z0-9-]{3,15}$/,
    licenseHint: 'As shown on the Division of Insurance lookup',
    licenseExpires: true,
    services: ['Homeowners', 'Landlord / rental', 'Vacant property', "Builder's risk / renovation", 'Flood', 'Umbrella'],
    financing: false,
  },
  contractor: {
    label: 'Contractor',
    plural: 'Contractors & repair companies',
    group: 'Inspection & repairs',
    regulator: 'Nevada State Contractors Board',
    lookupUrl: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch/ContractorLicenseSearch.aspx',
    licenseLabel: 'NSCB license number',
    licensePattern: /^\d{4,8}[A-Z]?$/,
    licenseHint: 'Digits, e.g. 0081234',
    licenseExpires: true,
    services: ['General contractor', 'Fix & flip renovations', 'Roofing', 'Plumbing', 'Electrical', 'HVAC', 'Flooring', 'Painting', 'Landscaping', 'Pools', 'Mold & water damage', 'Clean-out & trash-out'],
    financing: false,
  },
  home_inspector: {
    label: 'Home inspector',
    plural: 'Home inspectors',
    group: 'Inspection & repairs',
    regulator: 'Nevada Real Estate Division (inspectors of structures, NRS 645D)',
    lookupUrl: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx',
    licenseLabel: 'Nevada inspector of structures certificate number',
    licensePattern: /^[A-Z0-9][A-Z0-9.-]{3,19}$/,
    licenseHint: 'As shown on the Real Estate Division lookup',
    licenseExpires: true,
    services: ['Pre-purchase home inspection', 'Commercial property inspection', 'Exterior-only review (no access)', 'Roof inspection', 'Sewer scope', 'Pool & spa', 'Mold testing', 'Radon testing'],
    financing: false,
    individual: true,
  },
  property_manager: {
    label: 'Property manager',
    plural: 'Property managers',
    group: 'Ownership',
    regulator: 'Nevada Real Estate Division (property management permit)',
    lookupUrl: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx',
    licenseLabel: 'Nevada property management permit number',
    licensePattern: /^[A-Z0-9][A-Z0-9.-]{3,19}$/,
    licenseHint: 'As shown on the Real Estate Division lookup',
    licenseExpires: true,
    services: ['Full-service management', 'Tenant placement', 'Rent collection', 'Make-ready & turnover', 'Vacant property checks', 'Short-term rental management', 'Commercial property management'],
    financing: false,
    individual: true,
  },
  attorney: {
    label: 'Real estate attorney',
    plural: 'Real estate attorneys',
    group: 'Legal & tax',
    regulator: 'State Bar of Nevada',
    lookupUrl: 'https://nvbar.org/for-the-public/find-a-lawyer/',
    licenseLabel: 'State Bar of Nevada license number',
    licensePattern: /^\d{1,6}$/,
    licenseHint: 'Your bar number, digits only',
    licenseExpires: false,
    services: ['Quiet title', 'Title & lien review', 'Foreclosure sale disputes', 'HOA liens', 'Landlord & eviction', 'Contracts & closings', 'Probate & estate sales', 'Entity & LLC formation', '1031 exchange documents'],
    financing: false,
    individual: true,
    advertisingNote: 'Nevada lawyers must file their advertisements with the State Bar under RPC 7.2A. Your DeedOwl profile is an advertisement, so file it before it goes live.',
  },
  cpa: {
    label: 'CPA',
    plural: 'CPAs',
    group: 'Legal & tax',
    regulator: 'Nevada State Board of Accountancy',
    lookupUrl: 'https://www.nvaccountancy.com/license_verification.fx',
    licenseLabel: 'Nevada CPA certificate number',
    licensePattern: /^[A-Z0-9][A-Z0-9-]{1,11}$/,
    licenseHint: 'As shown on the Board of Accountancy lookup',
    licenseExpires: true,
    services: ['Real estate investor taxes', '1031 exchange tax planning', 'Entity & LLC tax setup', 'Depreciation & cost segregation', 'Bookkeeping for rentals', 'Capital gains planning', 'IRS notices & tax liens'],
    financing: false,
    individual: true,
  },
};

export const LOAN_PRODUCTS = [
  'Conventional',
  'FHA',
  'VA',
  'USDA',
  'Jumbo',
  'Renovation (FHA 203k / HomeStyle)',
  'Non-QM / bank statement',
  'DSCR (rental investor)',
  'Fix & flip / bridge',
  'Hard money',
  'Construction',
  'Cash-out / HELOC',
  'Commercial',
] as const;

/** Credit situations a lender says it works with. Self-reported by the lender, not an offer of credit. */
export const CREDIT_PROFILES = [
  'Excellent (740+)',
  'Good (680–739)',
  'Fair (620–679)',
  'Rebuilding (below 620)',
  'No or limited credit / ITIN',
  'Recent bankruptcy or foreclosure',
] as const;

export const FINANCING_CATEGORIES = (Object.keys(CATEGORIES) as Category[]).filter((c) => CATEGORIES[c].financing);

export interface Pro {
  id: string;
  category: Category;
  name: string; // person or company name shown
  company: string; // brokerage / employer / company
  licenseId: string;
  licenseStatus: 'Active' | 'Inactive' | 'Expired' | 'Revoked';
  licenseExpires: string | null; // YYYY-MM-DD, null when the registration doesn't expire
  licenseVerifiedAt: string; // YYYY-MM-DD, date a person confirmed it on the regulator lookup
  licenseVerifiedBy: string;
  paidThrough: string; // YYYY-MM-DD advertising paid through
  serviceCities: string[];
  serviceZips: string[];
  services: string[]; // category services or loan products
  creditProfiles: string[]; // financing categories only
  languages: string[];
  headline: string;
  bio: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  /** SHA-256 of the approved profile photo, served at /api/pro-photos/<hash>.webp. Absent or null: initials. */
  photo?: string | null;
  isSample: boolean;
}

export type ListingProblem = 'LICENSE_NOT_ACTIVE' | 'LICENSE_EXPIRED' | 'VERIFICATION_STALE' | 'NOT_PAID' | 'UNSAFE_CONTACT' | 'MISSING_CONTACT';

export const safeTel = (v: string | null) => (v && /^\+1\d{10}$/.test(v) ? `tel:${v}` : null);
export const safeMailto = (v: string | null) => (v && /^[^\s@<>"'()?&]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v) ? `mailto:${v}` : null);
export function safeWebsite(v: string | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

export function listingProblems(p: Pro, now = new Date()): ListingProblem[] {
  const today = now.toISOString().slice(0, 10);
  const out: ListingProblem[] = [];
  if (p.licenseStatus !== 'Active') out.push('LICENSE_NOT_ACTIVE');
  if (CATEGORIES[p.category]?.licenseExpires && (!p.licenseExpires || p.licenseExpires < today)) out.push('LICENSE_EXPIRED');
  const age = (now.getTime() - Date.parse(`${p.licenseVerifiedAt}T00:00:00Z`)) / 86_400_000;
  if (!(age >= 0 && age <= REVERIFY_DAYS)) out.push('VERIFICATION_STALE');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.paidThrough) || p.paidThrough < today) out.push('NOT_PAID');
  if ((p.phone && !safeTel(p.phone)) || (p.email && !safeMailto(p.email)) || (p.website && !safeWebsite(p.website))) out.push('UNSAFE_CONTACT');
  if (!safeTel(p.phone) && !safeMailto(p.email)) out.push('MISSING_CONTACT');
  return out;
}

export const isListable = (p: Pro, now = new Date()) => !!CATEGORIES[p.category] && listingProblems(p, now).length === 0;

export interface ProQuery {
  categories: Category[]; // empty = any
  location: string; // city or ZIP
  service: string | 'any';
  creditProfile: string | 'any';
  language: string | 'any';
}

/** Stable per-day shuffle: the same order for every visitor on a given day, different each day. */
export function rotationKey(id: string, day: string): number {
  let h = 2166136261;
  for (const ch of `${day}:${id}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function searchPros(all: Pro[], q: ProQuery, now = new Date()): Pro[] {
  const loc = q.location.trim().toLowerCase().replace(/,?\s*nv$/, '');
  const day = now.toISOString().slice(0, 10);
  return all
    .filter((p) => isListable(p, now))
    .filter((p) => !q.categories.length || q.categories.includes(p.category))
    .filter((p) => !loc || p.serviceZips.includes(loc) || p.serviceCities.some((c) => c.toLowerCase() === loc) || p.name.toLowerCase().includes(loc) || p.company.toLowerCase().includes(loc))
    .filter((p) => q.service === 'any' || p.services.includes(q.service))
    .filter((p) => q.creditProfile === 'any' || p.creditProfiles.includes(q.creditProfile))
    .filter((p) => q.language === 'any' || p.languages.includes(q.language))
    .sort((a, b) => rotationKey(a.id, day) - rotationKey(b.id, day));
}

export const servicesFor = (c: Category): readonly string[] => (CATEGORIES[c].financing ? LOAN_PRODUCTS : CATEGORIES[c].services);
