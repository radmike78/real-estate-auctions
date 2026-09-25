// Agent signup: shared validation used by the signup form (for instant feedback) and by the
// server (authoritative). Everything is normalized to plain text; nothing an applicant types
// is ever rendered as HTML or used to build a link without passing these checks.

import type { LicenseType, Specialty } from './agents';

export const SPECIALTIES: Specialty[] = [
  'Short sales',
  'Bank-owned (REO)',
  'Auction & tax-sale properties',
  'Investors',
  'First-time buyers',
  'Probate & estate sales',
];

export const CLARK_COUNTY_CITIES = [
  'Las Vegas', 'Henderson', 'North Las Vegas', 'Boulder City', 'Mesquite', 'Laughlin', 'Moapa', 'Overton', 'Logandale',
  'Indian Springs', 'Searchlight', 'Sandy Valley', 'Blue Diamond', 'Enterprise', 'Paradise', 'Spring Valley', 'Summerlin',
  'Sunrise Manor', 'Whitney', 'Winchester',
] as const;

export const LANGUAGES = [
  'English', 'Spanish', 'Tagalog', 'Chinese', 'Vietnamese', 'Korean', 'Japanese', 'Amharic', 'Arabic', 'French', 'German',
  'Hindi', 'Italian', 'Portuguese', 'Russian', 'Thai', 'American Sign Language',
] as const;

// Nevada Real Estate Division license numbers: S. (salesperson), BS. (broker-salesperson),
// B. (broker), followed by digits and an optional suffix such as .LLC or .CORP.
const LICENSE_RE = /^(S|BS|B)\.\d{5,8}(\.[A-Z]{2,5})?$/;
const PREFIX_TYPE: Record<string, LicenseType> = { S: 'Salesperson', BS: 'Broker-Salesperson', B: 'Broker' };

export interface ApplicationInput {
  name: string;
  brokerage: string;
  licenseNumber: string;
  licenseType: string;
  serviceCities: string[];
  serviceZips: string; // comma or space separated
  specialties: string[];
  languages: string[];
  shortSaleExperience: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  attestLicensed: boolean;
  attestAccurate: boolean;
  consentVerification: boolean;
  /** Honeypot: hidden from people; bots fill it. Must stay empty. */
  company_url?: string;
}

export interface AgentProfile {
  name: string;
  brokerage: string;
  licenseNumber: string;
  licenseType: LicenseType;
  serviceCities: string[];
  serviceZips: string[];
  specialties: Specialty[];
  languages: string[];
  shortSaleExperience: string | null;
  phone: string; // +1XXXXXXXXXX
  email: string; // lowercase
  website: string | null;
  bio: string;
}

export type ValidationResult = { ok: true; profile: AgentProfile } | { ok: false; errors: Partial<Record<keyof ApplicationInput | 'form', string>> };

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
  // NANP: area code and exchange can't start with 0 or 1.
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(ten) ? `+1${ten}` : null;
}

export function validateApplication(raw: Partial<ApplicationInput>): ValidationResult {
  const errors: Partial<Record<keyof ApplicationInput | 'form', string>> = {};
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

  if (raw.company_url) errors.form = 'Submission rejected.';

  const name = plain(raw.name, 80);
  if (!/^[\p{L}][\p{L}' .-]{1,78}[\p{L}.]$/u.test(name)) errors.name = 'Enter your full name as it appears on your license.';

  const brokerage = plain(raw.brokerage, 120);
  if (brokerage.length < 2) errors.brokerage = 'Enter the brokerage you are licensed under.';

  const licenseNumber = plain(raw.licenseNumber, 20).toUpperCase().replace(/\s/g, '');
  const m = licenseNumber.match(LICENSE_RE);
  let licenseType: LicenseType | null = null;
  if (!m) errors.licenseNumber = 'Use your Nevada license number, e.g. S.0012345, BS.0012345 or B.0012345.';
  else {
    licenseType = PREFIX_TYPE[m[1]];
    if (raw.licenseType !== licenseType) errors.licenseType = `A ${m[1]}. license number is a ${licenseType} license.`;
  }

  const serviceCities = [...new Set(arr(raw.serviceCities))];
  if (!serviceCities.length || serviceCities.length > 10 || !serviceCities.every((c) => (CLARK_COUNTY_CITIES as readonly string[]).includes(c))) {
    errors.serviceCities = 'Choose 1 to 10 Clark County cities or areas you serve.';
  }

  const serviceZips = [...new Set(plain(raw.serviceZips, 400).split(/[\s,;]+/).filter(Boolean))];
  if (serviceZips.length > 40 || !serviceZips.every((z) => /^89[01]\d{2}$/.test(z))) {
    errors.serviceZips = 'List Clark County ZIP codes (5 digits starting 890 or 891), separated by commas. Up to 40.';
  }

  const specialties = [...new Set(arr(raw.specialties))] as Specialty[];
  if (!specialties.length || !specialties.every((s) => SPECIALTIES.includes(s))) errors.specialties = 'Choose at least one specialty.';

  const languages = [...new Set(arr(raw.languages))];
  if (!languages.length || languages.length > 6 || !languages.every((l) => (LANGUAGES as readonly string[]).includes(l))) {
    errors.languages = 'Choose 1 to 6 languages.';
  }

  const shortSaleExperience = plain(raw.shortSaleExperience, 80) || null;

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

  const bio = plain(raw.bio, 600);
  if (bio.length < 30) errors.bio = 'Write at least 30 characters about how you help buyers.';

  if (raw.attestLicensed !== true) errors.attestLicensed = 'Required.';
  if (raw.attestAccurate !== true) errors.attestAccurate = 'Required.';
  if (raw.consentVerification !== true) errors.consentVerification = 'Required.';

  if (Object.keys(errors).length || !licenseType || !phone) return { ok: false, errors };
  return {
    ok: true,
    profile: { name, brokerage, licenseNumber, licenseType, serviceCities, serviceZips, specialties, languages, shortSaleExperience, phone, email, website, bio },
  };
}

// ---- Approval rules (enforced by the server, mirrored in the admin UI) ----

export interface LicenseVerification {
  licenseStatus: 'Active' | 'Inactive' | 'Expired' | 'Revoked' | 'Not found';
  licenseExpires: string; // YYYY-MM-DD as shown on the NRED lookup
  nameMatches: boolean; // name on NRED matches the application
  typeMatches: boolean; // license type on NRED matches
  brokerageMatches: boolean; // NRED shows the licensee under this brokerage
  identityConfirmed: boolean; // confirmed the applicant IS this licensee
  identityMethod: string; // how, using contact details NOT taken from the application
}

export function approvalBlockers(v: Partial<LicenseVerification>, today = new Date().toISOString().slice(0, 10)): string[] {
  const out: string[] = [];
  if (v.licenseStatus !== 'Active') out.push('The NRED lookup must show the license as Active.');
  if (!v.licenseExpires || !/^\d{4}-\d{2}-\d{2}$/.test(v.licenseExpires) || v.licenseExpires <= today) out.push('Enter a license expiration date in the future, as shown on NRED.');
  if (!v.nameMatches) out.push("Confirm the name on NRED matches the applicant's name.");
  if (!v.typeMatches) out.push('Confirm the license type on NRED matches.');
  if (!v.brokerageMatches) out.push('Confirm NRED shows the licensee under this brokerage.');
  if (!v.identityConfirmed) out.push('Confirm the applicant is the licensee, using contact details that did not come from the application.');
  if (plain(v.identityMethod, 300).length < 15) out.push('Describe how identity was confirmed (at least 15 characters).');
  return out;
}
