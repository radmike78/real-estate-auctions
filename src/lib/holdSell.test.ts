import { describe, expect, it } from 'vitest';
import { HOLD_SELL_DEFAULTS, holdAndSell, irr, loanBalance, RENT_DEFAULTS } from './holdCalc';

describe('hold and sell', () => {
  it('finds the IRR of simple cash flows', () => {
    expect(irr([-100, 110])!).toBeCloseTo(0.1, 6);
    expect(irr([-1000, 0, 0, 1331])!).toBeCloseTo(0.1, 6);
    expect(irr([100, 100])).toBeNull();
  });

  it('amortizes the loan balance', () => {
    expect(loanBalance(200_000, 6, 30, 0)).toBe(200_000);
    expect(loanBalance(200_000, 6, 30, 360)).toBeCloseTo(0, 0);
    // After 5 years on a 30-year 6% loan, about 93% of the balance is still owed.
    expect(loanBalance(200_000, 6, 30, 60)).toBeCloseTo(186_108, -1);
  });

  it('adds the yearly cash flow and the sale, after selling costs and the payoff', () => {
    const v = { ...RENT_DEFAULTS, value: 300_000, loanPct: 75, ratePct: 7, years: 30 };
    const r = holdAndSell(v, 280_000, HOLD_SELL_DEFAULTS, true);
    expect(r.flows).toHaveLength(5);
    expect(r.saleValue).toBeCloseTo(300_000 * 1.03 ** 5, 0);
    expect(r.saleNet).toBeCloseTo(r.saleValue * 0.93 - r.payoff, 0);
    expect(r.profit).toBeCloseTo(r.flows.reduce((a, b) => a + b, 0) + r.saleNet - r.cashIn, 0);
    expect(r.equityMultiple).toBeGreaterThan(1);
    expect(r.irr).not.toBeNull();
    // No growth, no appreciation, no selling cost and no loan: you get back what the property earns, and the price.
    const flat = holdAndSell({ ...v, loanPct: 0 }, 280_000, { years: 3, appreciationPct: 0, rentGrowthPct: 0, sellingCostPct: 0 }, true);
    expect(flat.saleValue).toBe(300_000);
    expect(flat.payoff).toBe(0);
  });
});

describe('commercial operating costs', () => {
  it('uses the line items when any is entered, and the percentage otherwise', async () => {
    const { COMMERCIAL_DEFAULTS, commercialNoi } = await import('./holdCalc');
    const base = { ...COMMERCIAL_DEFAULTS, monthlyRent: 10_000, otherMonthly: 0, vacancyPct: 10, expensePct: 35 };
    expect(commercialNoi(base)).toMatchObject({ collected: 108_000, expenses: 37_800, noi: 70_200, byLine: false });
    const lines = commercialNoi({ ...base, opTaxYear: 12_000, opInsuranceYear: 4_000, opRepairsYear: 6_000, opManagementPct: 5 });
    expect(lines).toMatchObject({ expenses: 12_000 + 4_000 + 6_000 + 5_400, byLine: true });
    expect(lines.noi).toBe(108_000 - 27_400);
  });
});
