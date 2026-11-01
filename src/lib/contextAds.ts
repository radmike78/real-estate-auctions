// Who the automatic Mentor Connect spots show (adSpots.ts): the professionals a deal or a step needs. The site owner
// turns these spots on or off, or gives them a fixed list, in Admin → Ad spots.
//
// Automatic picks:
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
  return analyzeAllowsAds(kind) ? BY_PLAN[plan] : [];
}

/** Who a My plan step says to call, as advertiser categories ("Each professional" and officials match none). */
const BY_CONTACT: [RegExp, Category[]][] = [
  [/^(loan officer|lender)\b/i, LENDERS],
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
  const byContact = BY_CONTACT.find(([re]) => re.test(to))?.[1] ?? [];
  // A step whose help is the inspector's page ("Inspect, then decide") also shows inspectors, beside whoever you call.
  return step.href === '#/pros/inspector' && !byContact.includes('home_inspector') ? [...byContact, 'home_inspector'] : byContact;
}

/** For the Advertise page: the Analyze plans that show this kind of professional, by plan key. */
export const analyzePlansFor = (cat: Category): Plan[] => (Object.keys(BY_PLAN) as Plan[]).filter((p) => BY_PLAN[p].includes(cat));
/** For the Advertise page: the My plan steps (through an agent) that show this kind of professional. */
export const stepsFor = (cat: Category, steps: RoadmapStep[]): RoadmapStep[] => steps.filter((st) => stepAdCategories(st, 'listing').includes(cat));

/** Whether Analyze may show ads for this kind of sale at all (an owner's fixed list included): buying through an agent only. */
export const analyzeAllowsAds = (kind: SaleKind) => kind === 'listing' || kind === 'reo' || kind === 'short';
/** The same rule for the owner's fixed ad spots, which can be switched on for every guide, lesson, drill, property
 *  page or deal packet: none of them shows an ad where the page is about a forced sale or a lien. */
// Not the commercial guide either: it mostly covers tax, trustee and receiver sales.
export const playbookAllowsAds = (key: string) => key === 'reo' || key === 'short';
export const lessonAllowsAds = (key: string) => key !== 'forced-sales';
const FORCED_DRILL = /trustee|tax-|hoa-|sheriff|irs|foreclos|receiver|short-sale|lien|surplus/;
export const drillAllowsAds = (id: string) => !FORCED_DRILL.test(id);
/** Whether a My plan step may show ads at all (an owner's fixed list included): the agent route, and never beside an
 * official seller (county, treasurer, trustee, sheriff). */
export const stepAllowsAds = (step: RoadmapStep, path: RoadmapPath) =>
  path === 'listing' && (!step.path || step.path.includes('listing')) && !!step.say && !/county|treasurer|trustee|sheriff/i.test(step.say.to);
