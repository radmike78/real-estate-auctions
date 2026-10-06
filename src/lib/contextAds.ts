// "At the moment you need one" ads: one labeled advertiser box beside a step where the reader is about to call a
// professional. Spotlight and Mentor Connect advertisers take turns in them, in their ad areas, like the rotating ad on
// the Your Team page.
//
// Where they show:
//  - Analyze a deal, beside "What's next": the professionals that plan needs (Fix and sell: contractors, inspectors
//    and short-term lenders; Keep and rent: lenders, insurance and property managers; Commercial: lenders, insurance
//    and property managers).
//  - My plan, beside "Your next step": whoever that step says to call ("What to say: Insurance agent" → insurance).
//
// Only for buying through an agent (listings and bank-owned homes). Never for forced sales (tax, trustee, HOA,
// sheriff, IRS) or lien certificates: an ad there could read as an invitation to approach owners in distress, the
// same rule as the Learn and Practice topic ads (adTopics.ts). Never for steps where the contact is the county,
// trustee or sheriff (official sellers, not advertisers).
import type { Plan, SaleKind } from './analyze';
import type { Category } from './pros';
import type { RoadmapPath, RoadmapStep } from './roadmap';

const LENDERS: Category[] = ['loan_officer', 'mortgage_company', 'bank', 'credit_union'];

const BY_PLAN: Record<Plan, Category[]> = {
  flip: ['contractor', 'home_inspector', 'private_lender'],
  rent: [...LENDERS, 'insurance', 'property_manager'],
  commercial: [...LENDERS, 'insurance', 'property_manager'],
  lien: [],
};

/** The advertisers for Analyze a deal: by plan, and only for a listing or a bank-owned home. */
export function analyzeAdCategories(kind: SaleKind, plan: Plan): Category[] {
  return kind === 'listing' || kind === 'reo' || kind === 'short' ? BY_PLAN[plan] : [];
}

/** Who a My plan step says to call, as advertiser categories ("Each professional" and officials match none). */
const BY_CONTACT: [RegExp, Category[]][] = [
  [/^loan officer\b/i, LENDERS],
  [/^your bank\b/i, ['bank', 'credit_union']],
  [/^(your agent|appraiser or agent)\b/i, ['agent']],
  [/^insurance agent\b/i, ['insurance']],
  [/^(title company|title officer|escrow officer)\b/i, ['title_escrow']],
  [/^attorney\b/i, ['attorney']],
  [/^contractor\b/i, ['contractor']],
  [/^tax advisor\b/i, ['cpa']],
];

/** The advertisers for a My plan step: only on the "through an agent" route, for steps that apply to it. */
export function stepAdCategories(step: RoadmapStep, path: RoadmapPath): Category[] {
  if (path !== 'listing' || (step.path && !step.path.includes('listing'))) return [];
  const to = step.say?.to ?? '';
  return BY_CONTACT.find(([re]) => re.test(to))?.[1] ?? [];
}
