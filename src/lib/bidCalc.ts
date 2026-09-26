// Maximum safe bid: the highest bid that still leaves the buyer's target profit after EVERY cost,
// not just "value minus bid". Costs that grow with the bid (buyer's premium, transfer tax,
// financing) are solved for exactly, so the result is the true break-point.

import type { Property } from '../types';
import { moneySummary } from './rules';

export interface BidInputs {
  exitValue: number; // conservative resale value after repairs (use your own comps)
  repairs: number;
  contingencyPct: number; // extra % on repairs for surprises (no interior inspection)
  buyerPremiumPct: number; // % of the bid
  transferTaxPer500: number; // Nevada real property transfer tax, Clark County $2.55 per $500
  survivingLiens: number; // debts that stay with the property after the sale
  titleLegal: number; // title search, attorney review, quiet title
  possession: number; // eviction, relocation, locksmith
  holdingMonths: number;
  monthlyCarry: number; // taxes, insurance, utilities, HOA dues
  financedPct: number; // share of purchase + repairs borrowed (after the sale; auctions need cash)
  interestRatePct: number; // annual
  pointsPct: number; // lender fees, % of the loan
  sellingCostPct: number; // agent commission + closing costs when you sell
  targetProfitPct: number; // profit you require, % of exit value
}

export interface BidResult {
  maxBid: number; // 0 when no bid meets the target
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
  const transferTax = (bid / 500) * nz(i.transferTaxPer500);
  const loan = ((bid + repairs) * Math.min(nz(i.financedPct), 100)) / 100;
  const financing = loan * ((nz(i.interestRatePct) / 100) * (nz(i.holdingMonths) / 12) + nz(i.pointsPct) / 100);
  const holding = nz(i.holdingMonths) * nz(i.monthlyCarry);
  const selling = (nz(i.exitValue) * nz(i.sellingCostPct)) / 100;
  const total = bid + premium + transferTax + repairs + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + holding + financing + selling;
  return { bid, premium, transferTax, repairs, survivingLiens: nz(i.survivingLiens), titleLegal: nz(i.titleLegal), possession: nz(i.possession), holding, financing, selling, loan, total };
}

export function profitAtBid(i: BidInputs, bid: number): number {
  return nz(i.exitValue) - costsAtBid(i, bid).total;
}

function solve(i: BidInputs, profitPct: number): number {
  const repairs = nz(i.repairs) * (1 + nz(i.contingencyPct) / 100);
  const f = Math.min(nz(i.financedPct), 100) / 100;
  const k = (nz(i.interestRatePct) / 100) * (nz(i.holdingMonths) / 12) + nz(i.pointsPct) / 100;
  const perBid = 1 + nz(i.buyerPremiumPct) / 100 + nz(i.transferTaxPer500) / 500 + f * k;
  const fixed = repairs + nz(i.survivingLiens) + nz(i.titleLegal) + nz(i.possession) + nz(i.holdingMonths) * nz(i.monthlyCarry) + f * repairs * k;
  const available = nz(i.exitValue) * (1 - nz(i.sellingCostPct) / 100 - profitPct / 100) - fixed;
  return available / perBid;
}

export function maxSafeBid(i: BidInputs): BidResult {
  const raw = solve(i, nz(i.targetProfitPct));
  const maxBid = Math.max(0, Math.floor(raw));
  const breakEvenBid = Math.max(0, Math.floor(solve(i, 0)));
  const c = costsAtBid(i, maxBid);
  return {
    maxBid,
    breakEvenBid,
    fixedCosts: r2(c.repairs + c.survivingLiens + c.titleLegal + c.possession + c.holding + c.selling),
    repairsWithContingency: r2(c.repairs),
    cashAtAuction: r2(maxBid + c.premium),
    cashToStabilize: r2(c.total - c.selling - c.loan),
    noBidWorks: maxBid <= 0,
  };
}

/** How the max bid moves if the deal goes worse than planned. */
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

export const BLANK_INPUTS: BidInputs = {
  exitValue: 400_000,
  repairs: 40_000,
  contingencyPct: 15,
  buyerPremiumPct: 0,
  transferTaxPer500: 2.55,
  survivingLiens: 0,
  titleLegal: 500,
  possession: 300,
  holdingMonths: 6,
  monthlyCarry: 450,
  financedPct: 0,
  interestRatePct: 11,
  pointsPct: 2,
  sellingCostPct: 8,
  targetProfitPct: 15,
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
  const holdingMonths =
    type === 'SHERIFF_EXECUTION' ? 15 // 1-year redemption before you can safely improve it
    : type === 'FEDERAL_TAX_SEIZURE' ? 9 // 180-day redemption
    : type === 'HOA_FORECLOSURE' ? 7 // 60-day redemption
    : 6;
  return {
    ...BLANK_INPUTS,
    exitValue: Math.round(p.estimatedMarketValue / 1000) * 1000,
    repairs: p.propertyType === 'Vacant Land' || p.propertyType === 'Commercial Land' ? 0 : Math.round(((p.sqft ?? 1500) * 40) / 1000) * 1000,
    buyerPremiumPct: s?.buyerPremiumPct ?? 0,
    survivingLiens: Math.round(money.likelySurviving + money.uncertain),
    titleLegal,
    possession,
    holdingMonths,
    // Clark County tax is roughly 3.3% of assessed value a year (before abatements), plus about $300/month insurance and utilities.
    monthlyCarry: Math.round((p.assessedValue * 0.033) / 12 + 300),
  };
}

/** Rebuild inputs from untrusted saved data: only known keys, only finite non-negative numbers. */
export function sanitizeInputs(saved: unknown, defaults: BidInputs): BidInputs {
  const out = { ...defaults };
  if (!saved || typeof saved !== 'object') return out;
  for (const k of Object.keys(defaults) as (keyof BidInputs)[]) {
    const v = (saved as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v;
  }
  return out;
}
