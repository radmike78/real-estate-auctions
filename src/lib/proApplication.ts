// Advertiser signup: shared validation used by the form (instant feedback) and the server
// (authoritative), plus the approval rules the server enforces. Everything is reduced to
// plain text; nothing an applicant types is rendered as HTML or turned into a link without
// passing these checks.

import { CATEGORIES, CREDIT_PROFILES, servicesFor, type Category } from './pros';

export const CLARK_COUNTY_CITIES = [
  'Las Vegas', 'Henderson', 'North Las Vegas', 'Boulder City', 'Mesquite', 'Laughlin', 'Moapa', 'Overton', 'Logandale',
  'Indian Springs', 'Searchlight', 'Sandy Valley', 'Blue Diamond', 'Enterprise', 'Paradise', 'Spring Valley', 'Summerlin',
  'Sunrise Manor', 'Whitney', 'Winchester',
] as const;

export const LANGUAGES = [
  'English', 'Spanish', 'Tagalog', 'Chinese', 'Vietnamese', 'Korean', 'Japanese', 'Amharic', 'Arabic', 'French', 'German',
  'Hindi', 'Italian', 'Portuguese', 'Russian', 'Thai', 'American Sign Language',
] as const;

const AGENT_PREFIX_TYPE: Record<string, string> = { S: 'Salesperson', BS: 'Broker-Salesperson', B: 'Broker' };

export interface ApplicationInput {
  category: string;
  name: string;
  company: string;
  licenseId: string;
  serviceCities: string[];
  serviceZips: string; // comma or space separated
  services: string[];
  creditProfiles: string[];
  languages: string[];
  headline: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  attestLicensed: boolean;
  attestAccurate: boolean;
  consentVerification: boolean;
  attestAdvertising: boolean;
  /** Honeypot: hidden from people; bots fill it. Must stay empty. */
  company_url?: string;
}

export interface ProProfile {
  category: Category;
  name: string;
  company: string;
  licenseId: string;
  licenseType: string | null; // agents only, derived from the license prefix
  serviceCities: string[];
  serviceZips: string[];
  services: string[];
  creditProfiles: string[];
  languages: string[];
  headline: string;
  phone: string; // +1XXXXXXXXXX
  email: string; // lowercase
  website: string | null;
  bio: string;
}

type Field = keyof ApplicationInput | 'form';
export type ValidationResult = { ok: true; profile: ProProfile } | { ok: false; errors: Partial<Record<Field, string>> };

/** Plain text: no control characters or angle brackets, whitespace collapsed. */
export const plain = (v: unknown, max: number): string =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

export function normalizePhone(v: string): string | null {
  const d = v.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(ten) ? `+1${ten}` : null;
}

const strings = (v: unknown) => [...new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])];

export function validateApplication(raw: Partial<ApplicationInput>): ValidationResult {
  const errors: Partial<Record<Field, string>> = {};
  if (raw.company_url) errors.form = 'Submission rejected.';

  const category = raw.category as Category;
  const info = CATEGORIES[category];
  if (!info) return { ok: false, errors: { ...errors, category: 'Choose what kind of business you are.' } };

  const name = plain(raw.name, 100);
  if (!/^[\p{L}\p{N}][\p{L}\p{N}&',. ()/-]{1,98}[\p{L}\p{N}.)]$/u.test(name)) errors.name = 'Enter the name to show (person or business), as licensed.';

  const company = plain(raw.company, 120);
  if (company.length < 2) errors.company = category === 'agent' ? 'Enter the brokerage you are licensed under.' : 'Enter your company or employer.';

  const licenseId = plain(raw.licenseId, 20).toUpperCase().replace(/\s/g, '');
  let licenseType: string | null = null;
  if (!info.licensePattern.test(licenseId)) errors.licenseId = `Enter your ${info.licenseLabel} (${info.licenseHint}).`;
  else if (category === 'agent') licenseType = AGENT_PREFIX_TYPE[licenseId.split('.')[0]];

  const serviceCities = strings(raw.serviceCities);
  if (!serviceCities.length || serviceCities.length > 10 || !serviceCities.every((c) => (CLARK_COUNTY_CITIES as readonly string[]).includes(c))) {
    errors.serviceCities = 'Choose 1 to 10 Clark County cities or areas you serve.';
  }
  const serviceZips = [...new Set(plain(raw.serviceZips, 400).split(/[\s,;]+/).filter(Boolean))];
  if (serviceZips.length > 40 || !serviceZips.every((z) => /^89[01]\d{2}$/.test(z))) {
    errors.serviceZips = 'List Clark County ZIP codes (5 digits starting 890 or 891), separated by commas. Up to 40.';
  }

  const allowed = servicesFor(category);
  const services = strings(raw.services);
  if (!services.length || !services.every((s) => allowed.includes(s))) errors.services = info.financing ? 'Choose the loan types you offer.' : 'Choose at least one service.';

  const creditProfiles = strings(raw.creditProfiles);
  if (info.financing) {
    if (!creditProfiles.length || !creditProfiles.every((c) => (CREDIT_PROFILES as readonly string[]).includes(c))) errors.creditProfiles = 'Choose the credit situations you work with.';
  } else if (creditProfiles.length) errors.creditProfiles = 'Only lenders list credit situations.';

  const languages = strings(raw.languages);
  if (!languages.length || languages.length > 6 || !languages.every((l) => (LANGUAGES as readonly string[]).includes(l))) errors.languages = 'Choose 1 to 6 languages.';

  const headline = plain(raw.headline, 90);
  if (headline.length < 10) errors.headline = 'Write a short headline (10 to 90 characters).';

  const phone = normalizePhone(plain(raw.phone, 30));
  if (!phone) errors.phone = 'Enter a valid U.S. phone number.';

  const email = plain(raw.email, 254).toLowerCase();
  if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(email)) errors.email = 'Enter a valid email address.';

  let website: string | null = plain(raw.website, 200) || null;
  if (website) {
    try {
      const u = new URL(website);
      if (u.protocol !== 'https:' || u.username || u.password) throw new Error();
      website = u.href;
    } catch {
      errors.website = 'Website must be a full https:// address.';
    }
  }

  const bio = plain(raw.bio, 800);
  if (bio.length < 30) errors.bio = 'Write at least 30 characters about how you help buyers and investors.';

  for (const k of ['attestLicensed', 'attestAccurate', 'consentVerification', 'attestAdvertising'] as const) {
    if (raw[k] !== true) errors[k] = 'Required.';
  }

  if (Object.keys(errors).length || !phone) return { ok: false, errors };
  return {
    ok: true,
    profile: { category, name, company, licenseId, licenseType, serviceCities, serviceZips, services, creditProfiles: info.financing ? creditProfiles : [], languages, headline, phone, email, website, bio },
  };
}

// ---- Approval rules (enforced by the server, mirrored in the admin UI) ----

export interface LicenseVerification {
  licenseStatus: 'Active' | 'Inactive' | 'Expired' | 'Revoked' | 'Not found';
  licenseExpires: string | null; // YYYY-MM-DD as shown by the regulator; null if the registration doesn't expire
  nameMatches: boolean;
  typeMatches: boolean; // license type / classification fits the category
  companyMatches: boolean; // regulator shows them with this company / brokerage
  identityConfirmed: boolean; // confirmed the applicant IS this licensee
  identityMethod: string; // how, using contact details NOT taken from the application
}

export function approvalBlockers(category: Category, v: Partial<LicenseVerification>, today = new Date().toISOString().slice(0, 10)): string[] {
  const info = CATEGORIES[category];
  const out: string[] = [];
  if (!info) return ['Unknown category.'];
  if (v.licenseStatus !== 'Active') out.push(`${info.regulator} must show the license or registration as Active.`);
  if (info.licenseExpires && (!v.licenseExpires || !/^\d{4}-\d{2}-\d{2}$/.test(v.licenseExpires) || v.licenseExpires <= today)) {
    out.push(`Enter a future expiration date, as shown on ${info.regulator}.`);
  }
  if (!v.nameMatches) out.push(`Confirm the name on ${info.regulator} matches.`);
  if (!v.typeMatches) out.push(`Confirm the license type or classification fits "${info.label}".`);
  if (!v.companyMatches) out.push(`Confirm ${info.regulator} shows them with this company.`);
  if (!v.identityConfirmed) out.push('Confirm the applicant is the licensee, using contact details that did not come from the application.');
  if (plain(v.identityMethod, 300).length < 15) out.push('Describe how identity was confirmed (at least 15 characters).');
  return out;
}

export interface Billing {
  plan: string; // e.g. "Monthly listing"
  paidThrough: string; // YYYY-MM-DD
}

export function validateBilling(b: Partial<Billing>): Billing | null {
  const plan = plain(b.plan, 60);
  const paidThrough = plain(b.paidThrough, 10);
  return plan.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(paidThrough) ? { plan, paidThrough } : null;
}
