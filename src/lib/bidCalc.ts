// Maximum safe bid: the highest bid that still leaves the buyer's target profit after EVERY cost,
// not just "value minus bid". Costs that grow with the bid (buyer's premium, transfer tax,
// financing) are solved for exactly, so the result is the true break-point.

import type { Property } from '../types';
import { moneySummary } from './rules';

export interface BidInputs {
  /** The opening (minimum) bid stated in the auction listing. The starting point; it doesn't change the maximum. */
  minimumBid: number;
  exitValue: number; // conservative resale value after repairs (use your own comps)
  repairs: number;
  contingencyPct: number; // extra % on repairs for surprises (no interior inspection)
  buyerPremiumPct: number; // % of the bid
  transferTaxPer500: number; // Nevada real property transfer tax, Clark County $2.55 per $500
  survivingLiens: number; // debts that stay with the property after the sale
  titleLegal: number; // title search, attorney review, quiet title
  possession: number; // eviction, relocation, locksmith
  /** Months the former owner (or others) can redeem after the sale. Hold off on repairs until it ends. */
  redemptionMonths: number;
  /** What a redemption pays you on top of your price, % a year (1% a month = 12). */
  redemptionRatePct: number;
  /** 1 when that interest compounds daily (IRS seizure sales), 0 for simple interest. */
  redemptionDaily: number;
  /**
   * 1 when the law adds a flat percentage of your price instead of yearly interest (Texas tax sales, Arizona and Utah
   * judicial sales): redemptionRatePct is then that flat %, the same whenever in the wait the owner redeems.
   */
  redemptionFlat: number;
  /** With a flat premium, the % if the owner redeems after the first 12 months (Texas: 50%); 0 when there's no step. */
  redemptionFlat2Pct: number;
  /** 1 once the buyer has confirmed in the official records which redemption rule applies to this property. */
  redemptionChecked: number;
  holdingMonths: number; // months to fix and sell, after any redemption wait
  monthlyCarry: number; // taxes, insurance, utilities, HOA dues
  financedPct: number; // share of purchase + repairs borrowed (after the sale; auctions need cash)
  interestRatePct: number; // annual
  pointsPct: number; // lender fees, % of the loan
  sellingCostPct: number; // agent commission + closing costs when you sell
  targetProfitPct: number; // profit you require, % of exit value
  targetProfitMin: number; // ...and at least this many dollars (0 = no minimum); the whole target when profitInDollars
  /** 1 to set the profit you want as a dollar amount (targetProfitMin) instead of a % of the resale value. */
  profitInDollars: number;
  cashAvailable: number; // cash you can bring on auction day (0 = no limit)
}

export interface BidResult {
  /** The walk-away price: the lower of the profit limit and the cash limit. 0 when no bid works. */
  maxBid: number; // 0 when no bid meets the target
  /** Highest bid that still meets the profit target, ignoring the cash limit. */
  profitBid: number;
  /** What sets the walk-away price. */
  limitedBy: 'profit' | 'cash';
  /** Profit at the walk-away price. */
  profit: number;
  /** That profit as a yearly return on the cash in the deal (e.g. 0.18 = 18% a year); null without a time frame. */
  yearlyReturn: number | null;
  breakEvenBid: number;
  fixedCosts: number; // everything that doesn't depend on the bid
  repairsWithContingency: number;
  /** Cash you must bring on auction day at the max bid (bid + premium). */
  cashAtAuction: number;
  /** Total cash in the deal at the max bid, through repairs and holding, net of any loan. */
  cashToStabilize: number;
  noBidWorks: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const nz = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** Every cost at a given bid, itemized. */
export function costsAtBid(i: BidInputs, bid: number) {
  const repairs = nz(i.repairs) * (1 + nz(i.contingencyPct) / 100);
  const premium = (bid * nz(i.buyerPremiumPct)) / 100;
  const transferTax = Math.ceil(bid / 500) * nz(i.transferTaxPer500); // per $500 or fraction (NRS 375.020 and 375.023)
  const loan = ((bid + repairs) * Math.min(nz(i.financedPct), 100)) / 100;
  const financing = loan * ((nz(i.interestRatePct) / 100) * (totalMonths(i) / 12) + nz(i.pointsPct) / 100);
  const holding = totalMonths(i) * nz(i.monthlyCarry);
  const selling = (nz(i.exitValue) * nz(i.sellingCostPct)) / 100;
  const total = bid + premium + transferTax + repairs + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + holding + financing + selling;
  return { bid, premium, transferTax, repairs, survivingLiens: nz(i.survivingLiens), titleLegal: nz(i.titleLegal), possession: nz(i.possession), holding, financing, selling, loan, total };
}

export function profitAtBid(i: BidInputs, bid: number): number {
  return nz(i.exitValue) - costsAtBid(i, bid).total;
}

/** Every month you carry the property: any redemption wait, then fixing and selling. */
export const totalMonths = (i: BidInputs) => nz(i.redemptionMonths) + nz(i.holdingMonths);

/** The profit you require in dollars: the dollar amount you set, or your % of the resale value and at least your minimum. */
export const requiredProfit = (i: BidInputs) => (nz(i.profitInDollars) ? nz(i.targetProfitMin) : Math.max((nz(i.exitValue) * nz(i.targetProfitPct)) / 100, nz(i.targetProfitMin)));

function solve(i: BidInputs, profit: number): number {
  const repairs = nz(i.repairs) * (1 + nz(i.contingencyPct) / 100);
  const f = Math.min(nz(i.financedPct), 100) / 100;
  const k = (nz(i.interestRatePct) / 100) * (totalMonths(i) / 12) + nz(i.pointsPct) / 100;
  const perBid = 1 + nz(i.buyerPremiumPct) / 100 + nz(i.transferTaxPer500) / 500 + f * k;
  // + one transfer-tax step: rounding up to the next $500 costs at most one extra step.
  const fixed = nz(i.transferTaxPer500) + repairs + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + totalMonths(i) * nz(i.monthlyCarry) + f * repairs * k;
  const available = nz(i.exitValue) * (1 - nz(i.sellingCostPct) / 100) - profit - fixed;
  return available / perBid;
}

/** Cash a bid takes from you: the bid and premium on the day, and every cost until you sell, less any loan. */
export function cashNeededAtBid(i: BidInputs, bid: number): number {
  const c = costsAtBid(i, bid);
  return Math.max(bid + c.premium, c.total - c.selling - c.loan);
}

/**
 * Highest bid whose cash, on auction day and through repairs and holding until you sell, fits the cash you can
 * bring; Infinity with no limit. A bid you can pay but can't afford to fix and carry isn't a safe bid.
 */
export function cashLimitedBid(i: BidInputs): number {
  const cash = nz(i.cashAvailable);
  if (!(cash > 0)) return Infinity;
  if (cashNeededAtBid(i, 0) > cash) return 0;
  let lo = 0;
  let hi = Math.ceil(cash) + 1; // the bid alone can't exceed the cash
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (cashNeededAtBid(i, mid) <= cash) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** An offer on a listed home has no auction cash limit, buyer's premium or redemption wait: the calculator and every
 * saved result (the deal packet) drop them the same way. */
export const offerInputs = (v: BidInputs): BidInputs => ({ ...v, cashAvailable: 0, buyerPremiumPct: 0, redemptionMonths: 0, redemptionRatePct: 0, redemptionDaily: 0, redemptionFlat: 0, redemptionFlat2Pct: 0 });

export function maxSafeBid(i: BidInputs): BidResult {
  const profitBid = Math.max(0, Math.floor(solve(i, requiredProfit(i))));
  const cashBid = cashLimitedBid(i);
  const limitedBy = cashBid < profitBid ? 'cash' : 'profit';
  const maxBid = Math.min(profitBid, cashBid);
  const breakEvenBid = Math.max(0, Math.floor(solve(i, 0)));
  const c = costsAtBid(i, maxBid);
  const cashToStabilize = r2(c.total - c.selling - c.loan);
  const profit = r2(profitAtBid(i, maxBid));
  const years = totalMonths(i) / 12;
  return {
    maxBid,
    profitBid,
    limitedBy,
    profit,
    yearlyReturn: maxBid > 0 && years > 0 && cashToStabilize > 0 ? profit / cashToStabilize / years : null,
    breakEvenBid,
    fixedCosts: r2(c.repairs + c.survivingLiens + c.titleLegal + c.possession + c.holding + c.selling),
    repairsWithContingency: r2(c.repairs),
    cashAtAuction: r2(maxBid + c.premium),
    cashToStabilize,
    noBidWorks: maxBid <= 0,
  };
}

/**
 * If the owner redeems at the end of the wait: what the redemption repays on your price, and what you'd have spent by
 * then that it doesn't (premium, transfer tax, title work and holding costs). Some rules also repay taxes and
 * assessments you paid; this leaves them out, so it's the cautious figure.
 */
export function redemptionOutcome(i: BidInputs, bid: number): { repaid: number; spent: number; net: number } | null {
  const months = nz(i.redemptionMonths);
  if (!(months > 0) || !(bid > 0)) return null;
  const rate = nz(i.redemptionRatePct) / 100;
  const repaid = i.redemptionFlat ? bid * (1 + redemptionPremiumPct(i, months) / 100)
    : i.redemptionDaily ? bid * (1 + rate / 365) ** Math.round((months * 365) / 12)
    : bid * (1 + (rate * months) / 12);
  const c = costsAtBid(i, bid);
  const spent = bid + c.premium + c.transferTax + c.titleLegal + months * nz(i.monthlyCarry);
  return { repaid: r2(repaid), spent: r2(spent), net: r2(repaid - spent) };
}

/**
 * A flat redemption premium, as a % of your price, for a redemption after this many months: the law sets it, so it
 * doesn't shrink when the owner redeems early (Texas Tax Code 34.21: 25% in the first year, 50% in the second).
 */
export function redemptionPremiumPct(i: BidInputs, months: number): number {
  return months > 12 && nz(i.redemptionFlat2Pct) > 0 ? nz(i.redemptionFlat2Pct) : nz(i.redemptionRatePct);
}

/** How the walk-away price moves if the deal goes worse (or better) than planned. */
export function stressTests(i: BidInputs): { label: string; maxBid: number }[] {
  const at = (patch: Partial<BidInputs>) => maxSafeBid({ ...i, ...patch }).maxBid;
  return [
    { label: 'As entered', maxBid: at({}) },
    { label: 'Resale value 10% lower', maxBid: at({ exitValue: i.exitValue * 0.9 }) },
    { label: 'Repairs 25% higher', maxBid: at({ repairs: i.repairs * 1.25 }) },
    { label: 'Takes 3 months longer', maxBid: at({ holdingMonths: i.holdingMonths + 3 }) },
    { label: 'All three at once', maxBid: at({ exitValue: i.exitValue * 0.9, repairs: i.repairs * 1.25, holdingMonths: i.holdingMonths + 3 }) },
  ];
}

export const GRID_VALUE_STEPS = [-10, 0, 5] as const;
export const GRID_REPAIR_STEPS = [0, 25, 50] as const;
/**
 * Highest bid that meets the profit target for each resale value change (rows) and repair overrun (columns), in %.
 * The cash limit is left out here, so the grid shows how the deal itself moves.
 */
export function stressGrid(i: BidInputs): number[][] {
  return GRID_VALUE_STEPS.map((v) => GRID_REPAIR_STEPS.map((r) => maxSafeBid({ ...i, exitValue: (i.exitValue * (100 + v)) / 100, repairs: (i.repairs * (100 + r)) / 100 }).profitBid));
}

export const BLANK_INPUTS: BidInputs = {
  minimumBid: 0,
  exitValue: 400_000,
  repairs: 40_000,
  contingencyPct: 15,
  buyerPremiumPct: 0,
  transferTaxPer500: 2.55,
  survivingLiens: 0,
  titleLegal: 500,
  possession: 300,
  redemptionMonths: 0,
  redemptionRatePct: 0,
  redemptionDaily: 0,
  redemptionFlat: 0,
  redemptionFlat2Pct: 0,
  redemptionChecked: 0,
  holdingMonths: 6,
  monthlyCarry: 450,
  financedPct: 0,
  interestRatePct: 11,
  pointsPct: 2,
  sellingCostPct: 8,
  targetProfitPct: 15,
  targetProfitMin: 0,
  profitInDollars: 0,
  cashAvailable: 0,
};

/**
 * The standalone calculator starts empty: only typical rates (transfer tax, contingency, cost to sell, profit) are
 * filled in, and every dollar amount comes from the listing and the buyer's own research.
 */
export const START_INPUTS: BidInputs = {
  ...BLANK_INPUTS,
  exitValue: 0,
  repairs: 0,
  titleLegal: 0,
  possession: 0,
  monthlyCarry: 0,
};

/**
 * The maximum the deal allows, as a plain subtraction: resale value minus every cost and your profit equals the
 * maximum bid (before any cash limit). Rounded to whole dollars so the lines add up exactly.
 */
export function maxBidSteps(i: BidInputs): { label: string; amount: number }[] {
  // The deal's own maximum (before any cash limit), so the profit line is the target, not an inflated figure.
  const bid = maxSafeBid(i).profitBid;
  const c = costsAtBid(i, bid);
  const costs: [string, number][] = [
    ['Selling costs', c.selling],
    ['Repairs and contingency', c.repairs],
    ['Liens that stay', c.survivingLiens],
    ['Title, attorney, quiet title', c.titleLegal],
    ['Getting possession', c.possession],
    ['Holding costs', c.holding],
    ['Loan costs', c.financing],
    ["Buyer's premium", c.premium],
    ['Transfer tax', c.transferTax],
  ];
  const exit = Math.round(nz(i.exitValue));
  const rows = costs.filter(([, v]) => v > 0).map(([label, v]) => ({ label, amount: -Math.round(v) }));
  const profit = exit + rows.reduce((a, x) => a + x.amount, 0) - bid;
  return [{ label: 'Resale value after repairs', amount: exit }, ...rows, { label: 'Your profit', amount: -profit }];
}

/**
 * Redemption rules by kind of sale (see the playbooks and src/content/facts.ts, where each is tied to its source).
 * Months are the longest wait; interest is what a redemption adds to your price.
 */
export const REDEMPTION_RULES = {
  none: { label: 'No redemption', months: 0, ratePct: 0, daily: 0, flat: 0, flat2Pct: 0 },
  hoa: { label: 'HOA foreclosure: 60 days, +1% a month', months: 2, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
  sheriff: { label: 'Sheriff’s sale: 1 year, +1% a month', months: 12, ratePct: 12, daily: 0, flat: 0, flat2Pct: 0 },
  irs: { label: 'IRS seizure sale: 180 days, +20% a year', months: 6, ratePct: 20, daily: 1, flat: 0, flat2Pct: 0 },
} as const;
type RuleShape = { months: number; ratePct: number; daily: number; flat?: number; flat2Pct?: number };
export const ruleOf = (i: BidInputs, rules: Record<string, RuleShape> = REDEMPTION_RULES): string => {
  for (const [k, r] of Object.entries(rules))
    if (nz(i.redemptionMonths) === r.months && nz(i.redemptionRatePct) === r.ratePct && nz(i.redemptionDaily) === r.daily && nz(i.redemptionFlat) === (r.flat ?? 0) && nz(i.redemptionFlat2Pct) === (r.flat2Pct ?? 0)) return k;
  return 'custom';
};

/**
 * Starting assumptions for a property, each one meant to be replaced by the buyer's own numbers.
 * Title/legal and possession defaults reflect typical Nevada costs by sale type and occupancy.
 */
export function defaultsFor(p: Property): BidInputs {
  const s = p.sale;
  const money = moneySummary(p);
  const type = s?.saleType;
  const titleLegal =
    type === 'TAX_DEED' ? 3_800 // title search + an uncontested quiet title ($1,500–$5,000+)
    : type === 'HOA_FORECLOSURE' ? 2_800 // title search + attorney review of the HOA sale
    : type === 'SHERIFF_EXECUTION' || type === 'FEDERAL_TAX_SEIZURE' ? 1_500
    : 500; // title search / O&E report + recording
  const possession = p.occupancy === 'Vacant' ? 300 : p.occupancy === 'Unknown' ? 1_500 : 3_500;
  // The redemption wait comes first (hold off on repairs), then months to fix and sell.
  const rule = REDEMPTION_RULES[type === 'SHERIFF_EXECUTION' ? 'sheriff' : type === 'FEDERAL_TAX_SEIZURE' ? 'irs' : type === 'HOA_FORECLOSURE' ? 'hoa' : 'none'];
  const holdingMonths =
    type === 'SHERIFF_EXECUTION' || type === 'FEDERAL_TAX_SEIZURE' ? 3
    : type === 'HOA_FORECLOSURE' ? 5
    : type === 'TAX_DEED' ? 12 // resale usually waits for a quiet title action (or the 2-year window after the deed)
    : 6;
  return {
    ...BLANK_INPUTS,
    minimumBid: s?.minimumBid ?? 0,
    exitValue: p.estimatedMarketValue === null ? 0 : Math.round(p.estimatedMarketValue / 1000) * 1000, // no estimate: the buyer enters their own comps
    // No building size on record (e.g. a listing from the official list): start at $0 rather than invent a budget.
    repairs: p.propertyType === 'Vacant Land' || p.propertyType === 'Commercial Land' || p.sqft === null ? 0 : Math.round((p.sqft * 40) / 1000) * 1000,
    buyerPremiumPct: s?.buyerPremiumPct ?? 0,
    survivingLiens: Math.round(money.likelySurviving + money.uncertain),
    titleLegal,
    possession,
    redemptionMonths: rule.months,
    redemptionRatePct: rule.ratePct,
    redemptionDaily: rule.daily,
    redemptionFlat: rule.flat,
    redemptionFlat2Pct: rule.flat2Pct,
    holdingMonths,
    // Clark County tax rates are about 2.9–3.3% of assessed value a year depending on district (before abatements);
    // 3.3% is the conservative end. Plus about $300/month insurance and utilities.
    monthlyCarry: Math.round(((p.assessedValue ?? 0) * 0.033) / 12 + 300),
  };
}

/** Largest sensible value for each input: percentages stop at 100, money at $10 billion. */
export const INPUT_MAX: Record<keyof BidInputs, number> = {
  minimumBid: 1e10, exitValue: 1e10, repairs: 1e10, contingencyPct: 100, buyerPremiumPct: 100, transferTaxPer500: 100, survivingLiens: 1e10,
  titleLegal: 1e10, possession: 1e10, redemptionMonths: 120, redemptionRatePct: 100, redemptionDaily: 1, redemptionFlat: 1, redemptionFlat2Pct: 100, redemptionChecked: 1, holdingMonths: 600,
  monthlyCarry: 1e10, financedPct: 100, interestRatePct: 100, pointsPct: 100, sellingCostPct: 100, targetProfitPct: 100,
  targetProfitMin: 1e10, profitInDollars: 1, cashAvailable: 1e10,
};
/** A typed or saved value made safe: 0 for invalid or negative, capped at the input's maximum. */
export const clampInput = (k: keyof BidInputs, v: number) => (Number.isFinite(v) && v > 0 ? Math.min(v, INPUT_MAX[k]) : 0);

/** Rebuild inputs from untrusted saved data: only known keys, only finite non-negative numbers. */
export function sanitizeInputs(saved: unknown, defaults: BidInputs): BidInputs {
  const out = { ...defaults };
  if (!saved || typeof saved !== 'object') return out;
  for (const k of Object.keys(defaults) as (keyof BidInputs)[]) {
    const v = (saved as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = clampInput(k, v);
  }
  return out;
}
