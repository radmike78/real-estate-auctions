// The due-diligence funnel: 12 steps from "is this even a real opportunity?" to "a professional
// has reviewed it". Each step groups the automated screening checks that belong to it and says how
// to confirm them yourself. No hidden score: every finding shows its reason.

import type { Property } from '../types';
import { diligenceReport, type Check } from './diligence';

export interface DdStep {
  key: string;
  title: string;
  why: string;
  how: string;
  who?: string;
  areas: string[]; // diligence areas that belong to this step
}

export const DD_STEPS: DdStep[] = [
  { key: 'parcel', title: 'Confirm the parcel and what you’d buy', why: 'People bid on strips, common areas and lien certificates thinking they’re homes.', how: 'Match the parcel number (APN) on the Assessor map and read the deed type offered.', areas: ['Deed type offered', 'Zoning and land use'] },
  { key: 'status', title: 'Confirm the sale is still on', why: 'Sales are often paid off, postponed or cancelled at the last minute.', how: 'Check the official notice and call the trustee or Treasurer the day before.', areas: ['Foreclosure stage'] },
  { key: 'value', title: 'Check value and resale', why: 'Our value is an estimate. Your profit depends on real sold comps.', how: 'Pull 3–5 recent sold comparables within half a mile; ask an agent for a price opinion.', who: 'Real estate agent', areas: ['Comparable sales', 'Estimated equity'] },
  { key: 'taxes', title: 'Review taxes, HOA and assessments', why: 'Unpaid taxes, HOA dues and special assessments can stay with the property.', how: 'Check the Treasurer balance, special assessments and the HOA’s statement.', areas: ['Property-tax status', 'HOA and municipal liens'] },
  { key: 'title-chain', title: 'Trace the title history', why: 'Gaps or unreleased liens in the chain can block title insurance.', how: 'Search the Recorder’s grantor/grantee index, or order a title search.', who: 'Title company', areas: ['Chain of title', 'Releases / satisfactions'] },
  { key: 'liens', title: 'Find every recorded lien and its priority', why: 'This is where buyers lose the most money: a senior mortgage or IRS lien that survives.', how: 'Identify which lien is foreclosing and list everything recorded before it.', who: 'Title company or attorney', areas: ['Mortgages and assignments', 'Liens and apparent priority', 'Federal tax liens'] },
  { key: 'courts', title: 'Check court cases and bankruptcy', why: 'A bankruptcy filing stops the sale; pending lawsuits can cloud title.', how: 'Search district court records and federal bankruptcy (PACER) for the owner.', areas: ['Lis pendens', 'Bankruptcy'] },
  { key: 'land', title: 'Review access, zoning and environment', why: 'Landlocked lots, flood zones, code cases and open permits all cost money.', how: 'Check the plat and easements, FEMA flood map, code enforcement and permit history.', areas: ['Easements and restrictions', 'Flood, wildfire, environmental', 'Code violations / demolition', 'Building permits'] },
  { key: 'occupancy', title: 'Assess occupancy and condition', why: 'You usually can’t go inside, and occupants may have to be evicted.', how: 'Drive by, look for signs of occupancy, and budget repairs from the outside plus a contingency.', who: 'Contractor or inspector', areas: ['Occupancy', 'Repair exposure'] },
  { key: 'redemption', title: 'Check redemption and title insurance', why: 'Redemption periods tie up your money; some deeds can’t be insured right away.', how: 'Read the redemption rules for this sale type and ask a title company what they’ll insure.', who: 'Title company', areas: ['Redemption rights', 'Title insurance availability'] },
  { key: 'max-bid', title: 'Set your maximum safe bid', why: 'Overbidding is the most common way a good property becomes a bad deal.', how: 'Run the max bid calculator with your own comps and quotes, and decide your walk-away number.', areas: [] },
  { key: 'review', title: 'Get a professional review', why: 'Lien priority and sale validity are legal questions.', how: 'Have a title company or real estate attorney review your findings before you bid.', who: 'Title company or attorney', areas: [] },
];

export function ddSteps(p: Property): (DdStep & { checks: Check[]; worst: Check['result'] | null })[] {
  const report = diligenceReport(p);
  const rank = { flag: 3, review: 2, manual: 1, ok: 0 } as const;
  return DD_STEPS.map((s) => {
    const checks = report.filter((c) => s.areas.includes(c.area));
    const worst = checks.reduce<Check['result'] | null>((w, c) => (w === null || rank[c.result] > rank[w] ? c.result : w), null);
    return { ...s, checks, worst };
  });
}

const KEY = (id: string) => `fsf.dd.${id}.v1`;
export function loadDdDone(id: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(id)) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export function saveDdDone(id: string, done: string[]) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify(done));
  } catch {
    /* storage unavailable */
  }
}
