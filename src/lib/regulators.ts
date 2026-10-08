// Where an advertiser's license is checked, by category and state: Nevada's from the category list (pros.ts), the
// other states' from the same official lookups the Your Team pages use (licenseLookups.ts). Banks and credit unions
// are checked nationally (FDIC, NCUA) in every state. The admin opens this lookup before approving.
import { SHORT_LICENSE_LABEL } from './adPlans';
import { LICENSE_LOOKUPS } from './licenseLookups';
import type { ProKey } from './proGuide';
import { CATEGORIES, type Category } from './pros';
import { stateByCode, type StateCode } from './regions';

const LOOKUP_KEY: Partial<Record<Category, ProKey>> = {
  agent: 'agent',
  loan_officer: 'lender',
  mortgage_company: 'lender',
  private_lender: 'private_lender',
  title_escrow: 'title',
  insurance: 'insurance',
  contractor: 'contractor',
  home_inspector: 'inspector',
  property_manager: 'property_manager',
  attorney: 'attorney',
  cpa: 'cpa',
};

const NO_LOOKUP: Record<string, string> = {
  'private_lender:CA': 'the DFPI or DRE license lookup (whichever license the lender holds)',
  'home_inspector:CA': 'proof of insurance and training (California doesn’t license home inspectors)',
  'private_lender:TX': 'NMLS Consumer Access (Texas Department of Savings and Mortgage Lending licenses), if the lender needs a license',
  'contractor:TX': 'their trade license (TDLR or the plumbing board) and proof of insurance (Texas has no general contractor license)',
};

/** Some services have no statewide license; private lending in Texas depends on the services offered.
 * An optional number never bypasses admin review of required trade licenses, qualifications and insurance.
 */
export function allowsAlternativeQualifications(category: Category, state: StateCode): boolean {
  return (category === 'home_inspector' && state === 'CA') ||
    (category === 'contractor' && state === 'TX') ||
    (category === 'private_lender' && state === 'TX');
}

export interface Regulator {
  name: string;
  url: string | null;
  /** When there's no single lookup (e.g. California doesn't license home inspectors), what to check instead. */
  note?: string;
}

export function regulatorFor(category: Category, state: StateCode): Regulator {
  const info = CATEGORIES[category];
  const key = LOOKUP_KEY[category];
  if (state === 'NV' || !key) return { name: info.regulator, url: info.lookupUrl };
  const l = LICENSE_LOOKUPS[key]?.[state];
  if (!l) return { name: `${stateByCode(state)?.name ?? state} licensing agency`, url: null };
  if (!('note' in l)) return { name: l.who, url: l.url };
  // No single lookup: say what gets checked instead (the note is the buyer's advice from the Your Team pages).
  const name = NO_LOOKUP[`${category}:${state}`] ?? `the ${stateByCode(state)?.name ?? state} regulator for their license`;
  return { name, url: null, note: l.note };
}

/** The short license label in ad boxes, e.g. "NMLS ID", "Nevada license", "Arizona license". */
export function shortLicenseLabel(category: Category, state: StateCode): string {
  if (state === 'NV') return SHORT_LICENSE_LABEL[category];
  if (category === 'loan_officer' || category === 'mortgage_company' || (category === 'private_lender' && state !== 'CA')) return 'NMLS ID';
  if (category === 'bank') return 'FDIC cert.';
  if (category === 'credit_union') return 'NCUA charter';
  // No statewide license: name what was actually checked.
  if (category === 'contractor' && state === 'TX') return 'Trade license / credential';
  if (category === 'home_inspector' && state === 'CA') return 'Credential';
  return `${stateByCode(state)?.name ?? state} license`;
}
