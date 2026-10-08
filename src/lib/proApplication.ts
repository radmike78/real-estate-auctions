// Advertiser signup: shared validation used by the form (instant feedback) and the server
// (authoritative), plus the approval rules the server enforces. Everything is reduced to
// plain text; nothing an applicant types is rendered as HTML or turned into a link without
// passing these checks.

import { isAdTier, type AdTier } from './adPlans';
import { CATEGORIES, CREDIT_PROFILES, isCategory, servicesFor, type Category } from './pros';
import { allowsAlternativeQualifications, regulatorFor } from './regulators';
import { MAX_AD_AREAS, type AdArea } from './adAreas';
import { STATES, stateByCode, type StateCode } from './regions';

/** Most counties, and most cities, one application can list as its service area. */
export const MAX_SERVICE_COUNTIES = 20;
export const MAX_SERVICE_CITIES = 30;

/** What an advertiser's profile must never contain. Shown on the application and in the Advertiser terms. */
export const CONTENT_RULES = [
  "Text copied from another website, another professional's profile or a company's marketing, unless you own it or have written permission.",
  "Other companies' logos, slogans or brand names used to suggest a connection. Naming your own brokerage or employer is fine.",
  'Claims that a government agency, HUD, Fannie Mae, Freddie Mac, a county or DeedOwl endorses you or works with you.',
  'Promises nobody can keep, such as "guaranteed approval", "guaranteed profit" or "we can stop any foreclosure".',
  "Reviews, testimonials, awards or sales numbers you can't back up.",
  "Anyone else's name, photo or personal details, including clients and homeowners.",
  'Wording that prefers or excludes anyone based on a group protected by applicable federal, state or local fair housing law.',
  'Offers aimed at homeowners in foreclosure or behind on payments (such as "we buy houses" or "sell before the auction"), or asking visitors to refer them.',
  'In your ad line: web addresses, emails or phone numbers (buyers contact you through the buttons), and words like "best", "#1", "trusted", "guaranteed" or "lowest". Lenders also leave out rates, APRs, payments and dollar amounts.',
] as const;

/** The rules for the optional ad line, shown next to the field. Enforced by validateAdLine. */
export const AD_LINE_RULES = [
  'Optional. 20 to 180 characters of plain text, in your own words ("We…", "Ask us about…").',
  'It appears in your ad boxes (the rotating ad on Rotating, fixed ads on Spotlight and Mentor Connect, and optional Mentor Connect topic ads), labeled as an ad. We review it before it goes live.',
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
  // Profiles from before advertising opened to other states are Nevada, Clark County.
  const state: StateCode = stateByCode(String(p.state)) ? p.state : 'NV';
  const serviceCounties = Array.isArray(p.serviceCounties) && p.serviceCounties.length ? p.serviceCounties : state === 'NV' ? ['Clark'] : [];
  // Profiles from before ad areas: their ads showed across their counties, so each county becomes a county bundle.
  const adAreas = Array.isArray(p.adAreas) ? p.adAreas : serviceCounties.map((county) => ({ county, city: null }));
  return { ...p, state, serviceCounties, adAreas, adLine: typeof p.adLine === 'string' ? p.adLine : '', adTopic: typeof p.adTopic === 'string' ? p.adTopic : '', adLinePending: typeof p.adLinePending === 'string' ? p.adLinePending : '' };
}

export const LANGUAGES = [
  'English', 'Spanish', 'Tagalog', 'Chinese', 'Vietnamese', 'Korean', 'Japanese', 'Amharic', 'Arabic', 'French', 'German',
  'Hindi', 'Italian', 'Portuguese', 'Russian', 'Thai', 'American Sign Language',
] as const;

const AGENT_PREFIX_TYPE: Record<string, string> = { S: 'Salesperson', BS: 'Broker-Salesperson', B: 'Broker' };

export interface ApplicationInput {
  /** The state they're licensed in and advertise to (NV, CA, AZ or UT). */
  state: string;
  category: string;
  name: string;
  company: string;
  licenseId: string;
  /** Counties they serve, in their state. */
  serviceCounties: string[];
  /** Optional cities or towns they serve, by their Census names (src/data/places). */
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
  state: StateCode;
  category: Category;
  name: string;
  company: string;
  licenseId: string;
  licenseType: string | null; // Nevada agents only, derived from the license prefix
  serviceCounties: string[];
  /** Where their ads show (adAreas.ts), chosen on their dashboard after approval; each is billed at the plan price. */
  adAreas: AdArea[];
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

/**
 * `isCity` (the server passes the Census place lists) checks each city name against the state's places; the form
 * only offers names from that list, so in the browser it can be left out.
 */
export function validateApplication(raw: Partial<ApplicationInput>, isCity?: (state: StateCode, name: string) => boolean): ValidationResult {
  const errors: Partial<Record<Field, string>> = {};
  if (raw.company_url) errors.form = 'Submission rejected.';

  const st = STATES.find((s) => s.code === raw.state);
  if (!st) errors.state = 'Choose the state where you work and advertise.';
  const state = (st?.code ?? 'NV') as StateCode;

  if (!isCategory(raw.category)) return { ok: false, errors: { ...errors, category: 'Choose what kind of business you are.' } };
  const category = raw.category;
  const info = CATEGORIES[category];

  const name = plain(raw.name, 100);
  if (!/^[\p{L}\p{N}][\p{L}\p{N}&',. ()/-]{1,98}[\p{L}\p{N}.)]$/u.test(name)) errors.name = 'Enter your legal name or business name.';

  const company = plain(raw.company, 120);
  if (company.length < 2) errors.company = category === 'agent' ? 'Enter the brokerage you are licensed under.' : 'Enter your company or employer.';

  // Any format (the admin checks the number on the state's official lookup before approving), but only safe
  // characters, starting with a letter or digit: nothing a spreadsheet, link or page could read as code.
  const licenseId = plain(raw.licenseId, 30).toUpperCase();
  let licenseType: string | null = null;
  if (licenseId || !allowsAlternativeQualifications(category, state)) {
    if (licenseId.length < 2) errors.licenseId = 'Enter your license, registration or ID number.';
    else if (!/^[A-Z0-9][A-Z0-9 .\/#-]*$/.test(licenseId)) errors.licenseId = 'Use only letters, numbers, spaces and . - / # in the credential number.';
    else if (category === 'agent' && state === 'NV') licenseType = AGENT_PREFIX_TYPE[licenseId.split('.')[0]] ?? null;
  }

  const serviceCounties = strings(raw.serviceCounties);
  if (!serviceCounties.length || serviceCounties.length > MAX_SERVICE_COUNTIES || (st && !serviceCounties.every((c) => st.counties.includes(c)))) {
    errors.serviceCounties = `Choose 1 to ${MAX_SERVICE_COUNTIES} counties you serve${st ? ` in ${st.name}` : ''}.`;
  }
  const serviceCities = strings(raw.serviceCities).map((c) => plain(c, 60)).filter(Boolean);
  if (serviceCities.length > MAX_SERVICE_CITIES || (isCity && st && !serviceCities.every((c) => isCity(state, c)))) {
    errors.serviceCities = `Choose up to ${MAX_SERVICE_CITIES} cities or towns from the list.`;
  }
  const serviceZips = [...new Set(plain(raw.serviceZips, 400).split(/[\s,;]+/).filter(Boolean))];
  if (serviceZips.length > 40 || !serviceZips.every((z) => /^\d{5}$/.test(z))) {
    errors.serviceZips = 'List 5-digit ZIP codes, separated by commas. Up to 40.';
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
    profile: { state, category, name, company, licenseId, licenseType, serviceCounties, adAreas: [], serviceCities, serviceZips, services, creditProfiles: info.financing ? creditProfiles : [], languages, headline, phone, email, website, bio, adLine, adTopic: '', adLinePending: '' },
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
  /** Older approvals recorded how identity was confirmed; the admin's checkbox is enough now. */
  identityMethod?: string;
}

export function approvalBlockers(category: Category, v: Partial<LicenseVerification>, today = new Date().toISOString().slice(0, 10), state: StateCode = 'NV'): string[] {
  const out: string[] = [];
  if (!isCategory(category)) return ['Unknown category.'];
  const info = CATEGORIES[category];
  const reg = regulatorFor(category, state).name;
  const alternative = allowsAlternativeQualifications(category, state);
  if (v.licenseStatus !== 'Active') out.push(alternative ? 'Verify required licenses and alternative qualifications before approving.' : `${reg} must show the license or registration as Active.`);
  // The expiration date is optional (the 90-day re-check catches lapses); a date that is entered must be in the future.
  if (info.licenseExpires && v.licenseExpires && (!/^\d{4}-\d{2}-\d{2}$/.test(v.licenseExpires) || v.licenseExpires <= today)) {
    out.push(`The expiration date must be in the future, as shown on ${reg}, or left blank.`);
  }
  if (!v.nameMatches) out.push(`Confirm the name on ${reg} matches.`);
  if (!v.typeMatches) out.push(alternative ? `Confirm all licenses required for the advertised services, and the alternative qualifications and insurance for "${info.label}".` : `Confirm the license type or classification fits "${info.label}".`);
  if (!v.companyMatches) out.push(alternative ? 'Confirm the applicant is authorized to advertise for this company.' : `Confirm ${reg} shows them with this company.`);
  if (!v.identityConfirmed) out.push('Confirm the applicant’s identity, using contact details that did not come from the application.');
  if (!v.contentReviewed) out.push('Check the headline, bio and ad line against the content rules.');
  return out;
}

export interface Billing {
  plan: string; // e.g. "Card · Premium · $199 / month", or an admin's label for a payment received another way
  paidThrough: string; // YYYY-MM-DD
  /** Advertising plan. Rows stored before plans existed have none: treat as 'standard'. */
  tier?: AdTier;
  /** How many ad areas are paid for (the Stripe quantity, or an admin's entry). Missing: all of them (older rows). */
  areas?: number;
}

/** The ad areas that are paid for: the first `billing.areas` of the advertiser's list (all of them on older rows). */
export function paidAreas(profile: Pick<ProProfile, 'adAreas'>, billing: Billing | null | undefined): AdArea[] {
  const n = billing?.areas;
  return typeof n === 'number' ? profile.adAreas.slice(0, Math.max(0, n)) : profile.adAreas;
}

/** An admin's manual billing entry (a payment received another way). */
export function validateBilling(b: Partial<Record<keyof Billing, unknown>>): Billing | null {
  const plan = plain(b.plan, 60);
  const paidThrough = plain(b.paidThrough, 10);
  const tier = b.tier === undefined || b.tier === null || b.tier === '' ? 'standard' : b.tier;
  if (!isAdTier(tier)) return null;
  const areas = b.areas === undefined || b.areas === null || b.areas === '' ? undefined : Number(b.areas);
  if (areas !== undefined && !(Number.isInteger(areas) && areas >= 1 && areas <= MAX_AD_AREAS)) return null;
  return plan.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(paidThrough) && !Number.isNaN(Date.parse(paidThrough))
    ? { plan, paidThrough, tier, ...(areas !== undefined ? { areas } : {}) }
    : null;
}

/** A stored billing record's plan (older rows have none). */
export const billingTier = (b: Billing | null | undefined): AdTier => (b && isAdTier(b.tier) ? b.tier : 'standard');
