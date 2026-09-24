// Partner agent directory with license verification.
//
// The Nevada Real Estate Division (NRED) license lookup blocks automated queries, so each
// partner's license is verified BY A PERSON on the official lookup at onboarding and again
// at least every 90 days. The date and the verifier are stored. A profile is shown only while:
//   - the license is Active and not expired,
//   - the last verification is recent (<= 90 days),
//   - every contact link is safe (tel:, mailto:, or https:// website).
// Users are always given the official lookup link to check the license themselves.

export const NRED_LOOKUP_URL = 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx';
export const REVERIFY_DAYS = 90;

export type LicenseType = 'Salesperson' | 'Broker-Salesperson' | 'Broker';
export type Specialty = 'Short sales' | 'Bank-owned (REO)' | 'Auction & tax-sale properties' | 'Investors' | 'First-time buyers' | 'Probate & estate sales';

export interface Agent {
  id: string;
  name: string;
  brokerage: string; // every licensee must work under a Nevada broker
  licenseNumber: string;
  licenseType: LicenseType;
  licenseStatus: 'Active' | 'Inactive' | 'Expired' | 'Revoked';
  licenseExpires: string; // YYYY-MM-DD, per NRED
  licenseVerifiedAt: string; // YYYY-MM-DD, date a person confirmed it on the NRED lookup
  licenseVerifiedBy: string;
  serviceCities: string[];
  serviceZips: string[];
  specialties: Specialty[];
  languages: string[];
  shortSaleExperience: string | null; // self-reported, shown as such
  phone: string | null; // E.164, e.g. +17025550100
  email: string | null;
  website: string | null;
  bio: string;
  isSample: boolean;
}

export type VerificationProblem = 'LICENSE_NOT_ACTIVE' | 'LICENSE_EXPIRED' | 'VERIFICATION_STALE' | 'UNSAFE_CONTACT' | 'MISSING_CONTACT';

export const safeTel = (v: string | null) => (v && /^\+1\d{10}$/.test(v) ? `tel:${v}` : null);
export const safeMailto = (v: string | null) => (v && /^[^\s@<>"'()]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v) ? `mailto:${v}` : null);
export function safeWebsite(v: string | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

export function verificationProblems(a: Agent, now = new Date()): VerificationProblem[] {
  const today = now.toISOString().slice(0, 10);
  const out: VerificationProblem[] = [];
  if (a.licenseStatus !== 'Active') out.push('LICENSE_NOT_ACTIVE');
  if (a.licenseExpires < today) out.push('LICENSE_EXPIRED');
  const age = (now.getTime() - Date.parse(`${a.licenseVerifiedAt}T00:00:00Z`)) / 86_400_000;
  if (!(age >= 0 && age <= REVERIFY_DAYS)) out.push('VERIFICATION_STALE');
  if ((a.phone && !safeTel(a.phone)) || (a.email && !safeMailto(a.email)) || (a.website && !safeWebsite(a.website))) out.push('UNSAFE_CONTACT');
  if (!safeTel(a.phone) && !safeMailto(a.email)) out.push('MISSING_CONTACT');
  return out;
}

export const isListable = (a: Agent, now = new Date()) => verificationProblems(a, now).length === 0;

export interface AgentQuery {
  location: string; // city or ZIP
  specialty: Specialty | 'any';
  language: string | 'any';
}

export function searchAgents(all: Agent[], q: AgentQuery, now = new Date()): Agent[] {
  const loc = q.location.trim().toLowerCase().replace(/,?\s*nv$/, '');
  return all
    .filter((a) => isListable(a, now))
    .filter((a) => !loc || a.serviceZips.includes(loc) || a.serviceCities.some((c) => c.toLowerCase() === loc) || a.name.toLowerCase().includes(loc))
    .filter((a) => q.specialty === 'any' || a.specialties.includes(q.specialty))
    .filter((a) => q.language === 'any' || a.languages.includes(q.language))
    .sort((a, b) => Number(b.specialties.includes('Short sales')) - Number(a.specialties.includes('Short sales')) || a.name.localeCompare(b.name));
}
