// The walk-away price solver's promise, checked over many generated deals: the price it returns still meets your
// profit target, and a little more would not. Also the cash limit and the Texas flat redemption premium.
import { describe, expect, it } from 'vitest';
import { BLANK_INPUTS, cashLimitedBid, cashNeededAtBid, maxSafeBid, profitAtBid, redemptionPremiumPct, requiredProfit, type BidInputs } from './bidCalc';

// A small fixed-seed generator, so a failure always reproduces.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function deals(n: number): BidInputs[] {
  const r = rng(20261031);
  const pick = (lo: number, hi: number) => Math.round(lo + r() * (hi - lo));
  return Array.from({ length: n }, () => ({
    ...BLANK_INPUTS,
    exitValue: pick(80_000, 900_000),
    repairs: pick(0, 120_000),
    contingencyPct: pick(0, 25),
    buyerPremiumPct: pick(0, 10),
    survivingLiens: r() < 0.3 ? pick(0, 60_000) : 0,
    holdingMonths: pick(1, 18),
    monthlyCarry: pick(0, 2_000),
    financedPct: r() < 0.5 ? pick(0, 80) : 0,
    redemptionMonths: r() < 0.3 ? pick(1, 12) : 0,
    redemptionRatePct: r() < 0.3 ? pick(0, 20) : 0,
    targetProfitPct: pick(5, 25),
    cashAvailable: r() < 0.4 ? pick(20_000, 500_000) : 0,
  }));
}

describe('walk-away price solver', () => {
  it('returns a price that meets the profit target, and $600 more does not', () => {
    for (const i of deals(300)) {
      const { profitBid } = maxSafeBid(i);
      if (profitBid <= 0) continue;
      expect(profitAtBid(i, profitBid), JSON.stringify(i)).toBeGreaterThanOrEqual(requiredProfit(i) - 0.01);
      // Transfer tax rises in $500 steps, so the solver may stop up to one step short: past that, the target is missed.
      expect(profitAtBid(i, profitBid + 600), JSON.stringify(i)).toBeLessThan(requiredProfit(i));
    }
  });

  it('caps the price at the highest bid the cash covers', () => {
    for (const i of deals(300).filter((d) => d.cashAvailable > 0)) {
      const b = cashLimitedBid(i);
      if (b === 0) {
        expect(cashNeededAtBid(i, 0)).toBeGreaterThan(i.cashAvailable);
        continue;
      }
      expect(cashNeededAtBid(i, b)).toBeLessThanOrEqual(i.cashAvailable);
      expect(cashNeededAtBid(i, b + 1)).toBeGreaterThan(i.cashAvailable);
    }
    expect(cashLimitedBid({ ...BLANK_INPUTS, cashAvailable: 0 })).toBe(Infinity);
  });
});

describe('flat redemption premium (Texas Tax Code 34.21)', () => {
  const tx = { ...BLANK_INPUTS, redemptionRatePct: 25, redemptionFlat: 1, redemptionFlat2Pct: 50 };
  it('is 25% in the first year and 50% in the second', () => {
    expect(redemptionPremiumPct(tx, 6)).toBe(25);
    expect(redemptionPremiumPct(tx, 12)).toBe(25);
    expect(redemptionPremiumPct(tx, 18)).toBe(50);
  });
  it('stays at the first-year rate where no second-year rate applies', () => {
    expect(redemptionPremiumPct({ ...tx, redemptionFlat2Pct: 0 }, 18)).toBe(25);
  });
});
