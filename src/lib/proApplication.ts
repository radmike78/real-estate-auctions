// Advertiser signup: shared validation used by the form (instant feedback) and the server
// (authoritative), plus the approval rules the server enforces. Everything is reduced to
// plain text; nothing an applicant types is rendered as HTML or turned into a link without
// passing these checks.

import { isAdTier, type AdTier } from './adPlans';
import { CATEGORIES, CREDIT_PROFILES, servicesFor, type Category } from './pros';

export const CLARK_COUNTY_CITIES = [
  'Las Vegas', 'Henderson', 'North Las Vegas', 'Boulder City', 'Mesquite', 'Laughlin', 'Moapa', 'Overton', 'Logandale',
  'Indian Springs', 'Searchlight', 'Sandy Valley', 'Blue Diamond', 'Enterprise', 'Paradise', 'Spring Valley', 'Summerlin',
  'Sunrise Manor', 'Whitney', 'Winchester',
] as const;

/** What an advertiser's profile must never contain. Shown on the application and in the Advertiser terms. */
export const CONTENT_RULES = [
  "Text copied from another website, another professional's profile or a company's marketing, unless you own it or have written permission.",
  "Other companies' logos, slogans or brand names used to suggest a connection. Naming your own brokerage or employer is fine.",
  'Claims that a government agency, HUD, Fannie Mae, Freddie Mac, a county or DeedOwl endorses you or works with you.',
  'Promises nobody can keep, such as "guaranteed approval", "guaranteed profit" or "we can stop any foreclosure".',
  "Reviews, testimonials, awards or sales numbers you can't back up.",
  "Anyone else's name, photo or personal details, including clients and homeowners.",
  'Wording that prefers or excludes anyone based on a group protected by federal or Nevada fair housing law.',
  'Offers aimed at homeowners in foreclosure or behind on payments (such as "we buy houses" or "sell before the auction"), or asking visitors to refer them.',
  'In your ad line: web addresses, emails or phone numbers (buyers contact you through the buttons), and words like "best", "#1", "trusted", "guaranteed" or "lowest". Lenders also leave out rates, APRs, payments and dollar amounts.',
] as const;

/** The rules for the optional ad line, shown next to the field. Enforced by validateAdLine. */
export const AD_LINE_RULES = [
  'Optional. 20 to 180 characters of plain text, in your own words ("We…", "Ask us about…").',
  'It appears in your Featured ad and topic ad boxes (Premium and Premium Plus), labeled as an ad. We review it before it goes live.',
  'No web addresses, emails or phone numbers: buyers contact you through the buttons.',
  'No "best", "#1", "number one", "top-rated", "trusted", "recommended", "endorsed", "guaranteed", "lowest", "cheapest" or "DeedOwl".',
  'Lenders: no rates, APRs, percentages, payment amounts, down payments or other dollar amounts. Those trigger Truth in Lending disclosures an ad line can’t hold.',
] as const;

const AD_LINE_BANNED = /\b(best|trusted|recommended|endorsed|guarantee[ds]?|guaranteed|lowest|cheapest|deedowl|number\s+one)\b|#\s*1\b|\btop[\s-]*rated\b/i;
const AD_LINE_URL = /https?:|www\.|\b[a-z0-9-]+\.(com|net|org|io|us|co|biz|info|gov|edu|realty|homes|house|loans|law|mortgage|properties|app|site|online|pro)\b/i;
const AD_LINE_EMAIL = /\S@\S/;
const AD_LINE_PHONE = /(\d[\s().-]*){7,}/;
const AD_LINE_LENDING = /%|\bapr\b|\brates?\b|\$|\bpayments?\b|\bdown\s+payment|\bpercent\b/i;

/**
 * Checks an advertiser's ad line. Returns a message to show, or null when it's fine (an empty line is fine).
 * Used by the form, the server and the browser's check of the signed directory.
 */
export function validateAdLine(raw: unknown, category: Category): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return 'Write your ad line as plain text.';
  if (/[\u0000-\u001f\u007f<>]/.test(raw)) return 'Remove the < and > characters and line breaks. Plain text only.';
  const line = raw.trim();
  if (!line) return null;
  if (line.length < 20 || line.length > 180) return 'Write 20 to 180 characters, or leave it blank.';
  if (AD_LINE_URL.test(line) || AD_LINE_EMAIL.test(line)) return 'Leave out web addresses and emails: buyers contact you through the buttons.';
  if (AD_LINE_PHONE.test(line)) return 'Leave out phone numbers: buyers contact you through the buttons.';
  const banned = line.match(AD_LINE_BANNED);
  if (banned) return `Leave out "${banned[0]}". Ad lines can’t claim to be the best, trusted, recommended or guaranteed, or mention DeedOwl.`;
  if (CATEGORIES[category]?.financing && AD_LINE_LENDING.test(line)) return 'Lenders: leave out rates, APRs, percentages, payments and dollar amounts. They require Truth in Lending disclosures.';
  return null;
}

/** Fills in fields added after a profile was stored, so older rows keep working. */
export function withProfileDefaults(p: ProProfile): ProProfile {
  return { ...p, adLine: typeof p.adLine === 'string' ? p.adLine : '', adTopic: typeof p.adTopic === 'string' ? p.adTopic : '', adLinePending: typeof p.adLinePending === 'string' ? p.adLinePending : '' };
}

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
  /** Optional one-line ad in the advertiser's own words (AD_LINE_RULES). */
  adLine?: string;
  attestLicensed: boolean;
  attestAccurate: boolean;
  consentVerification: boolean;
  attestAdvertising: boolean;
  /** Everything they submit is their own original work (or they have permission), and follows CONTENT_RULES. */
  attestOriginal: boolean;
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
  /** Approved ad line ('' = none). Shown in Featured and topic ad boxes. */
  adLine: string;
  /** The Learn/Practice topic (adTopics.ts) of a Premium Plus ad ('' = none). Chosen from a fixed list, so it needs no content review. */
  adTopic: string;
  /** An ad line the advertiser sent from their dashboard, waiting for an admin's review ('' = none). Never published. */
  adLinePending: string;
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

  const adLineError = validateAdLine(raw.adLine, category);
  if (adLineError) errors.adLine = adLineError;
  const adLine = adLineError ? '' : typeof raw.adLine === 'string' ? raw.adLine.trim() : '';

  // Angle brackets would otherwise be quietly turned into spaces ("<b>LLC</b>" shows as "b LLC /b"): ask instead.
  for (const k of ['name', 'company', 'headline', 'bio'] as const) {
    if (typeof raw[k] === 'string' && /[<>]/.test(raw[k] as string)) errors[k] = 'Remove the < and > characters. Plain text only.';
  }

  for (const k of ['attestLicensed', 'attestAccurate', 'consentVerification', 'attestOriginal', 'attestAdvertising'] as const) {
    if (raw[k] !== true) errors[k] = 'Required.';
  }

  if (Object.keys(errors).length || !phone) return { ok: false, errors };
  return {
    ok: true,
    profile: { category, name, company, licenseId, licenseType, serviceCities, serviceZips, services, creditProfiles: info.financing ? creditProfiles : [], languages, headline, phone, email, website, bio, adLine, adTopic: '', adLinePending: '' },
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
  contentReviewed: boolean; // headline, bio and ad line checked against CONTENT_RULES
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
  if (!v.contentReviewed) out.push('Check the headline, bio and ad line against the content rules.');
  if (plain(v.identityMethod, 300).length < 15) out.push('Describe how identity was confirmed (at least 15 characters).');
  return out;
}

export interface Billing {
  plan: string; // e.g. "Card · Premium · $199 / month", or "Complimentary"
  paidThrough: string; // YYYY-MM-DD
  /** Advertising plan. Rows stored before plans existed have none: treat as 'standard'. */
  tier?: AdTier;
  /** Recorded by an admin with no fee (a "Complimentary" plan label). */
  complimentary?: boolean;
}

/** The admin's plan label means no fee was charged. */
export const isComplimentaryLabel = (plan: string) => /^complimentary\b/i.test(plan.trim());

/** An admin's manual billing entry. The plan label defaults to "Complimentary" in the form; any label works. */
export function validateBilling(b: Partial<Record<keyof Billing, unknown>>): Billing | null {
  const plan = plain(b.plan, 60);
  const paidThrough = plain(b.paidThrough, 10);
  const tier = b.tier === undefined || b.tier === null || b.tier === '' ? 'standard' : b.tier;
  if (!isAdTier(tier)) return null;
  return plan.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(paidThrough) && !Number.isNaN(Date.parse(paidThrough))
    ? { plan, paidThrough, tier, complimentary: isComplimentaryLabel(plan) }
    : null;
}

/** A stored billing record's plan (older rows have none). */
export const billingTier = (b: Billing | null | undefined): AdTier => (b && isAdTier(b.tier) ? b.tier : 'standard');
