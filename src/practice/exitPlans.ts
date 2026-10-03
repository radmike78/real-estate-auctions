// Practice numbers worked in the order an investor works them: start at the opening bid, add the costs to buy and
// hold, then compare selling as-is with fixing and selling, and only then set the maximum bid.
import { costsAtBid, maxSafeBid, profitAtBid, type BidInputs } from '../lib/bidCalc';

/** Months to list and close a property sold as it stands. A practice figure. */
export const AS_IS_MONTHS = 2;

/** A practice as-is value: buyers of a home that needs work pay well under its repaired value less the repairs. */
export const practiceAsIsValue = (value: number, repairs: number) => (repairs > 0 ? Math.max(0, Math.round((value * 0.95 - repairs * 1.5) / 1000) * 1000) : value);

export interface ExitPlan {
  key: 'as-is' | 'fix';
  label: string;
  inputs: BidInputs;
  salePrice: number;
  repairs: number;
  months: number;
  holding: number;
  financing: number;
  selling: number;
  /** Cash in the deal before the sale, at the starting price: price, costs to buy, repairs and holding, less any loan. */
  cashTiedUp: number;
  profitAtStart: number;
  targetProfit: number;
  /** Highest price that still leaves the target profit (0 = no price works). */
  maxBid: number;
}

/** The costs of buying at a price, before any repairs or holding. */
export function buyingCosts(i: BidInputs, price: number) {
  const c = costsAtBid(i, price);
  return { premium: c.premium, transferTax: c.transferTax, survivingLiens: c.survivingLiens, titleLegal: c.titleLegal, possession: c.possession, total: c.premium + c.transferTax + c.survivingLiens + c.titleLegal + c.possession };
}

function plan(key: ExitPlan['key'], label: string, inputs: BidInputs, start: number): ExitPlan {
  const c = costsAtBid(inputs, start);
  const r = maxSafeBid(inputs);
  return {
    key,
    label,
    inputs,
    salePrice: inputs.exitValue,
    repairs: c.repairs,
    months: inputs.holdingMonths,
    holding: c.holding,
    financing: c.financing,
    selling: c.selling,
    cashTiedUp: c.total - c.selling - c.loan,
    profitAtStart: profitAtBid(inputs, start),
    targetProfit: Math.max((inputs.exitValue * inputs.targetProfitPct) / 100, inputs.targetProfitMin),
    maxBid: r.noBidWorks ? 0 : r.maxBid,
  };
}

/** Selling as it stands (when there are repairs to skip) and fixing then selling, both from the same starting price. */
export function exitPlans(fix: BidInputs, asIsValue: number, start: number): ExitPlan[] {
  const fixed = plan('fix', fix.repairs > 0 ? 'Fix and sell' : 'Sell', fix, start);
  if (!(fix.repairs > 0)) return [fixed];
  const asIs = plan('as-is', 'Sell as-is', { ...fix, exitValue: asIsValue, repairs: 0, holdingMonths: Math.min(AS_IS_MONTHS, fix.holdingMonths) }, start);
  return [asIs, fixed];
}
