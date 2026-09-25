// What the homepage search can look for, and where each choice leads.
// Property sale types filter the property search; pre-foreclosures and short sales have their
// own sections (a pre-foreclosure isn't for sale yet; short sales are listed through agents).

import type { AcquisitionStatus, SaleType } from '../types';

export interface SaleSearchOption {
  key: string;
  label: string;
  hint: string; // one line shown under the search box for the selected option
  saleTypes?: SaleType[];
  statuses?: AcquisitionStatus[];
  route?: 'pre-foreclosures' | 'short-sales';
}

export const SALE_SEARCH: SaleSearchOption[] = [
  { key: 'all', label: 'All sales', hint: 'Every property heading to a forced sale.' },
  { key: 'tax', label: 'Tax sales', hint: 'County auctions of properties with unpaid property taxes.', saleTypes: ['TAX_DEED', 'TAX_LIEN_CERTIFICATE'] },
  { key: 'foreclosure', label: 'Foreclosure auctions', hint: 'Trustee and court-ordered sales after a mortgage default.', saleTypes: ['TRUSTEE_SALE', 'JUDICIAL_FORECLOSURE'] },
  { key: 'pre', label: 'Pre-foreclosures', hint: 'Owners behind on payments. Not for sale yet; track them toward auction.', route: 'pre-foreclosures' },
  { key: 'short', label: 'Short sales', hint: 'Sold below the loan balance with lender approval, through an agent.', route: 'short-sales' },
  { key: 'reo', label: 'Bank-owned (REO)', hint: 'Homes the lender took back after an auction.', saleTypes: ['REO'] },
  { key: 'hoa', label: 'HOA foreclosures', hint: 'Sales to collect unpaid HOA assessments.', saleTypes: ['HOA_FORECLOSURE'] },
  { key: 'sheriff', label: 'Sheriff & IRS sales', hint: 'Sales to satisfy court judgments or federal tax debts.', saleTypes: ['SHERIFF_EXECUTION', 'FEDERAL_TAX_SEIZURE'] },
  { key: 'liens', label: 'Liens on record', hint: 'Properties with liens but no sale scheduled. A lien alone does not mean it is for sale.', statuses: ['NOT_FOR_SALE_LIEN_ONLY'] },
];

/** Hash URL for a search choice plus an optional location. */
export function saleSearchHref(key: string, location: string): string {
  const o = SALE_SEARCH.find((x) => x.key === key) ?? SALE_SEARCH[0];
  const params = new URLSearchParams();
  if (location.trim()) params.set('q', location.trim());
  if (o.route) return `#/${o.route}${params.size ? `?${params}` : ''}`;
  if (o.saleTypes) params.set('type', o.saleTypes.join(','));
  if (o.statuses) params.set('status', o.statuses.join(','));
  return `#/search${params.size ? `?${params}` : ''}`;
}
