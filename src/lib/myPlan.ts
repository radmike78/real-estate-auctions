// My plan's own records: your goal in a sentence, the team you've lined up, and what price your cash can support.
// Kept in this browser like the rest of the plan, and included in progress backups.
import { annualDebtService } from './holdCalc';
import { CORE_TEAM, type ProKey } from './proGuide';

export const GOAL_KEY = 'deedowl.goal.v1';
export const TEAM_LIST_KEY = 'deedowl.teamlist.v1';
/** Fired after My plan's cash or buy box is changed from another part of the page. */
export const PLAN_EVENT = 'deedowl:plan';

export const cleanGoal = (v: unknown) => (typeof v === 'string' ? v.slice(0, 400) : '');

export interface TeamMember {
  name: string;
  contact: string;
  licenseChecked: boolean;
  fees: string;
}
export type TeamList = Partial<Record<ProKey, TeamMember>>;

/** The roles a first purchase usually needs, in the order you'll usually call them. */
export const TEAM_ROLES: ProKey[] = CORE_TEAM;

export function cleanTeamList(v: unknown): TeamList {
  const out: TeamList = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
  for (const k of TEAM_ROLES) {
    const m = (v as Record<string, unknown>)[k];
    if (!m || typeof m !== 'object') continue;
    const o = m as Record<string, unknown>;
    out[k] = { name: str(o.name, 120), contact: str(o.contact, 160), licenseChecked: o.licenseChecked === true, fees: str(o.fees, 200) };
  }
  return out;
}

export interface PriceAssumptions {
  downPct: number; // down payment, % of the price
  closingPct: number; // closing costs, % of the price
  reserveMonths: number; // months of the full payment the lender wants left in the bank
  ratePct: number; // loan rate, yearly
  taxInsPct: number; // property tax and insurance, % of the price per year
}

export const PRICE_DEFAULTS: PriceAssumptions = { downPct: 25, closingPct: 3, reserveMonths: 6, ratePct: 7, taxInsPct: 1.2 };

/** Cash a purchase at `price` takes: down payment, closing costs, and the reserves left in the bank afterward. */
export function cashForPrice(price: number, a: PriceAssumptions) {
  const down = (price * a.downPct) / 100;
  const closing = (price * a.closingPct) / 100;
  const monthly = annualDebtService(price - down, a.ratePct, 30) / 12 + (price * a.taxInsPct) / 100 / 12;
  const reserves = monthly * a.reserveMonths;
  return { down, closing, monthly, reserves, total: down + closing + reserves };
}

/** The highest price (to the nearest $1,000) whose down payment, closing costs and reserves fit your cash. */
export function priceForCash(cash: number, a: PriceAssumptions = PRICE_DEFAULTS): number {
  if (!(cash > 0)) return 0;
  let lo = 0;
  let hi = 20_000_000;
  if (cashForPrice(hi, a).total <= cash) return hi;
  while (hi - lo > 1000) {
    const mid = (lo + hi) / 2;
    if (cashForPrice(mid, a).total <= cash) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo / 1000) * 1000;
}
