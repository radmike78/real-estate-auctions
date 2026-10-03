import { describe, expect, it } from 'vitest';
import { BLANK_INPUTS, costsAtBid, maxSafeBid } from '../lib/bidCalc';
import { buyingCosts, exitPlans, practiceAsIsValue } from './exitPlans';

const fix = { ...BLANK_INPUTS, exitValue: 345_000, repairs: 25_000, survivingLiens: 4_760, titleLegal: 500, possession: 1_500, holdingMonths: 6, monthlyCarry: 590 };

describe('practice exit plans', () => {
  it('compares selling as-is with fixing and selling, from the opening bid', () => {
    const asIs = practiceAsIsValue(345_000, 25_000);
    expect(asIs).toBeLessThan(345_000 - 25_000);
    const [a, f] = exitPlans(fix, asIs, 173_000);
    expect([a.key, f.key]).toEqual(['as-is', 'fix']);
    expect(a.repairs).toBe(0);
    expect(a.months).toBeLessThan(f.months);
    expect(a.cashTiedUp).toBeLessThan(f.cashTiedUp);
    expect(f.maxBid).toBe(maxSafeBid(fix).maxBid);
    // Profit = sale price − price and costs to buy − repairs − holding − selling.
    const b = buyingCosts(fix, 173_000);
    expect(f.profitAtStart).toBeCloseTo(345_000 - 173_000 - b.total - f.repairs - f.holding - f.selling, 2);
    expect(b.total + 173_000 + f.repairs + f.holding + f.selling).toBeCloseTo(costsAtBid(fix, 173_000).total, 2);
  });
  it('shows one plan when there is nothing to fix', () => {
    const plans = exitPlans({ ...fix, repairs: 0 }, practiceAsIsValue(345_000, 0), 173_000);
    expect(plans.map((p) => p.label)).toEqual(['Sell']);
  });
});
