// License lookup helper. Attorneys (State Bar) and banks (FDIC) are searched live on the official source by the
// server (server/licenses.ts). The other regulators (NRED, NMLS, NSCB, Division of Insurance, CPAs) don't allow
// other sites to query them, so this:
//   1. checks a license number's format and reads what it can from it (e.g. S. = salesperson),
//   2. opens the official lookup, with the search filled in where that site accepts it in the address,
//   3. says what to check there.

import { CATEGORIES, isListable, type Category, type Pro } from './pros';

export interface LookupAnalysis {
  mode: 'empty' | 'license' | 'name';
  normalized: string;
  formatOk: boolean | null; // null when the query is a name
  detail: string;
}

const AGENT_TYPES: Record<string, string> = { S: 'a salesperson license', BS: 'a broker-salesperson license', B: 'a broker license' };

export function analyzeQuery(category: Category, raw: string): LookupAnalysis {
  const q = raw.trim().replace(/\s+/g, ' ');
  if (!q) return { mode: 'empty', normalized: '', formatOk: null, detail: '' };
  const info = CATEGORIES[category];
  const compact = q.toUpperCase().replace(/\s/g, '');
  const looksLikeNumber = /\d/.test(compact) && /^[A-Z0-9.-]+$/.test(compact);
  if (!looksLikeNumber) return { mode: 'name', normalized: q, formatOk: null, detail: `Search ${info.regulator} by name to find the license.` };
  const ok = info.licensePattern.test(compact);
  let detail = ok ? `This looks like a valid ${info.licenseLabel}.` : `This doesn't match the usual format for a ${info.licenseLabel} (${info.licenseHint}).`;
  if (ok && category === 'agent') detail = `This looks like ${AGENT_TYPES[compact.split('.')[0]]} number.`;
  return { mode: 'license', normalized: compact, formatOk: ok, detail };
}

/** Matches in our verified directory (currently listed only): exact license number, or name/company containing the text. */
export function findInDirectory(pros: Pro[], categories: Category[], a: LookupAnalysis, now = new Date()): Pro[] {
  if (a.mode === 'empty') return [];
  const inCats = pros.filter((p) => categories.includes(p.category) && isListable(p, now));
  if (a.mode === 'license') return inCats.filter((p) => p.licenseId.toUpperCase() === a.normalized);
  const needle = a.normalized.toLowerCase();
  if (needle.length < 3) return [];
  return inCats.filter((p) => p.name.toLowerCase().includes(needle) || p.company.toLowerCase().includes(needle));
}

export const WHAT_TO_CHECK: Record<'agent' | 'lender' | 'contractor' | 'insurance' | 'professional', string[]> = {
  agent: [
    'Status is Active (not Inactive, Expired or Revoked).',
    'The name matches the person you are talking to.',
    'They are licensed under the brokerage they claim.',
    'Any disciplinary actions listed.',
  ],
  lender: [
    'Mortgage companies and their loan officers: an active Nevada license. Bank and credit union loan officers: an active federal registration instead.',
    'The NMLS ID matches the one on their emails and Loan Estimate.',
    'Any regulatory actions listed.',
  ],
  contractor: [
    'The license is active and covers the work (the classification, e.g. B for general building).',
    'The job fits within the monetary limit on the license.',
    'Any complaints or disciplinary history.',
  ],
  insurance: ['The agent or agency is licensed and active in Nevada.', 'The license covers the line of insurance you need (property & casualty, title).'],
  professional: ['Status is Active or in good standing.', 'The name matches the person you are talking to.', 'Any disciplinary actions listed.'],
};

export const checklistFor = (c: Category) =>
  c === 'agent' ? WHAT_TO_CHECK.agent
    : c === 'contractor' ? WHAT_TO_CHECK.contractor
    : c === 'insurance' || c === 'title_escrow' ? WHAT_TO_CHECK.insurance
    : CATEGORIES[c].financing ? WHAT_TO_CHECK.lender
    : WHAT_TO_CHECK.professional;

export const RED_FLAGS = [
  'Asks you to wire earnest money or fees to a personal account, or changes wiring instructions by email or text.',
  'Pressures you to decide or pay today, or to skip an inspection or title search.',
  "Won't give a license number, or the one given doesn't match the lookup.",
  'Offers a guaranteed loan approval, or charges any fee except a credit report fee before you get a Loan Estimate and say you want to go ahead.',
];

// ---------------- Searching the official sources ----------------

/** Professions whose official source lets our site show results directly (server/licenses.ts). */
export const LIVE_KIND: Partial<Record<Category, 'attorney' | 'bank'>> = { attorney: 'attorney', bank: 'bank' };

export interface LicenseResult {
  name: string;
  id: string;
  status: string;
  since?: string;
  company?: string;
  address?: string;
  phone?: string;
  website?: string;
  discipline?: string[];
  officialUrl: string;
}
export interface LicenseSearch {
  source: string;
  results: LicenseResult[];
  more: boolean;
  checkedAt: string;
}

const NMLS_KIND: Partial<Record<Category, 'INDIVIDUAL' | 'COMPANY'>> = { loan_officer: 'INDIVIDUAL', mortgage_company: 'COMPANY', private_lender: 'COMPANY' };

/**
 * Where to send someone for a profession we can't search directly: the official lookup, with the search filled in
 * when that site accepts it in the address (`prefilled`). Otherwise the page copies what they typed to paste there.
 */
export function officialSearch(category: Category, raw: string): { url: string; prefilled: boolean } {
  const q = raw.trim().replace(/\s+/g, ' ');
  const base = CATEGORIES[category].lookupUrl;
  if (!q) return { url: base, prefilled: false };
  if (category === 'insurance' || category === 'title_escrow') {
    const words = q.split(' ');
    return words.length >= 2
      ? { url: `https://di.nv.gov/nv/r/doi/licensing/9?p9_lname=${encodeURIComponent(words[words.length - 1])}&p9_fname=${encodeURIComponent(words[0])}`, prefilled: true }
      : { url: `https://di.nv.gov/nv/r/doi/licensing/10?p10_agency=${encodeURIComponent(q)}`, prefilled: true };
  }
  const nmls = NMLS_KIND[category];
  if (nmls && /^\d{1,10}$/.test(q)) return { url: `https://www.nmlsconsumeraccess.org/EntityDetails.aspx/${nmls}/${q}`, prefilled: true };
  return { url: base, prefilled: false };
}
