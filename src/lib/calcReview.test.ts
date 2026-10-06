import { describe, expect, it } from 'vitest';
import { annualDebtService, commercialMaxBid, COMMERCIAL_DEFAULTS, rentMaxBid, RENT_DEFAULTS } from './holdCalc';
import { BLANK_INPUTS, maxSafeBid, redemptionOutcome, START_INPUTS } from './bidCalc';

// The calculator findings from the full-site review, each pinned with the reviewer's own example.
describe('calculator review fixes', () => {
  it('never treats a loan with no term as free', () => {
    expect(annualDebtService(100_000, 7, 0)).toBeCloseTo(annualDebtService(100_000, 7, 30), 2);
    const offer = { ...RENT_DEFAULTS, possession: 0, titleLegal: 2_500, repairs: 5_000, loanPct: 75, ratePct: 7, value: 350_000 };
    expect(rentMaxBid({ ...offer, years: 0 }, true).maxBid).toBe(rentMaxBid({ ...offer, years: 30 }, true).maxBid);
  });

  it('keeps a purchase loan within the lender’s minimum coverage (DSCR)', () => {
    const r = rentMaxBid({ ...RENT_DEFAULTS, value: 400_000, loanPct: 75, ratePct: 7, targetCocPct: 2, minDscr: 1.25 }, true);
    expect(r.dscr).not.toBeNull();
    expect(r.dscr!).toBeGreaterThanOrEqual(1.25);
  });

  it('says when a refinance costs more than the income, instead of “no price works”', () => {
    const r = rentMaxBid({ ...RENT_DEFAULTS, loanPct: 75 });
    if (r.noBidWorks) expect(r.loanTooBig).toBe(true);
    expect(rentMaxBid({ ...RENT_DEFAULTS, loanPct: 0 }).loanTooBig).toBe(false);
  });

  it('counts loan payments during a commercial lease-up when a purchase loan is in place', () => {
    const v = { ...COMMERCIAL_DEFAULTS, value: 950_000, loanPct: 75 };
    const withCarry = commercialMaxBid(v, true);
    const months = v.leaseUpMonths;
    expect(months).toBeGreaterThan(0);
    // The all-in cost includes the months of payments, so the highest price is lower than with carry costs alone.
    expect(withCarry.allIn).toBeGreaterThan(withCarry.maxBid);
    expect(withCarry.loanFees).toBeGreaterThanOrEqual(0);
  });

  it('figures the auction return on the most cash you have in at once', () => {
    const i = { ...START_INPUTS, exitValue: 400_000, financedPct: 80, interestRatePct: 11, pointsPct: 2, redemptionMonths: 12, redemptionRatePct: 12, holdingMonths: 4 };
    const r = maxSafeBid(i);
    expect(r.cashPeak).toBeGreaterThanOrEqual(r.cashAtAuction);
    expect(r.cashPeak).toBeGreaterThanOrEqual(r.cashToStabilize);
    if (r.yearlyReturn !== null) expect(r.yearlyReturn).toBeCloseTo(r.profit / r.cashPeak / (16 / 12), 6);
  });

  it('counts loan interest and points in what a redemption leaves you short', () => {
    const base = { ...BLANK_INPUTS, exitValue: 400_000, redemptionMonths: 12, redemptionRatePct: 12, holdingMonths: 4 };
    const cash = redemptionOutcome({ ...base, financedPct: 0 }, 200_000)!;
    const financed = redemptionOutcome({ ...base, financedPct: 80, interestRatePct: 11, pointsPct: 2 }, 200_000)!;
    expect(financed.spent).toBeGreaterThan(cash.spent);
  });

  it('runs IRS redemption interest for 180 days', () => {
    const out = redemptionOutcome({ ...BLANK_INPUTS, redemptionMonths: 6, redemptionRatePct: 20, redemptionDaily: 1 }, 100_000)!;
    expect(out.repaid).toBeCloseTo(100_000 * (1 + 0.2 / 365) ** 180, 0);
  });
});
