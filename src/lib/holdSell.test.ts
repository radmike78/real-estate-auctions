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

describe('seller financing', () => {
  it('figures the payment, the balloon and the bank comparison', async () => {
    const { sellerFinance, SELLER_FINANCE_DEFAULTS, loanBalance } = await import('./holdCalc');
    const r = sellerFinance(SELLER_FINANCE_DEFAULTS);
    expect(r.down).toBe(30_000);
    expect(r.loan).toBe(270_000);
    expect(r.monthly).toBeCloseTo(1796.32, 0); // $270,000 at 7% over 30 years
    expect(r.balloon).toBe(loanBalance(270_000, 7, 30, 60));
    expect(r.balloonPctOfPrice).toBeGreaterThan(0.8);
    expect(r.bankDown).toBe(75_000);
    expect(r.cashSaved).toBe(45_000);
    // No balloon: it pays off over the term.
    const full = sellerFinance({ ...SELLER_FINANCE_DEFAULTS, balloonYears: 0 });
    expect(full.balloon).toBe(0);
    expect(full.balloonYears).toBe(0);
  });
});

describe('lender view and short-term rental', () => {
  it('shows what a conventional and a DSCR lender see', async () => {
    const { lenderView, RENT_DEFAULTS, annualDebtService } = await import('./holdCalc');
    const v = { ...RENT_DEFAULTS, monthlyRent: 2_000, propertyTaxYear: 2_400, insuranceYear: 1_200, hoaMonthly: 0, loanPct: 75, ratePct: 7, years: 30, value: 300_000 };
    const r = lenderView(v, 300_000, true);
    const pi = annualDebtService(225_000, 7, 30) / 12;
    expect(r.pitia).toBeCloseTo(pi + 200 + 100, 1);
    expect(r.conventionalNet).toBeCloseTo(1_500 - r.pitia, 1);
    expect(r.dscr).toBeCloseTo(2_000 / r.pitia, 2);
  });

  it('compares renting by the night with renting by the year, and finds the break-even occupancy', async () => {
    const { strCompare, STR_DEFAULTS, RENT_DEFAULTS } = await import('./holdCalc');
    const v = { ...RENT_DEFAULTS, monthlyRent: 2_200, vacancyPct: 6, propertyTaxYear: 2_400, insuranceYear: 1_400, hoaMonthly: 0 };
    const r = strCompare(v, STR_DEFAULTS);
    expect(r.nights).toBe(219);
    expect(r.gross).toBeCloseTo(219 * (180 + 100 / 3), -1);
    expect(r.noi).toBeCloseTo(r.gross - r.costs, 2);
    expect(r.difference).toBeCloseTo(r.noi - r.longTermNoi, 2);
    // At the break-even occupancy the two earn the same.
    const even = strCompare(v, { ...STR_DEFAULTS, occupancyPct: r.breakEvenOccupancyPct! });
    expect(Math.abs(even.difference)).toBeLessThan(300);
    // Empty all year, renting by the night loses money.
    expect(strCompare(v, { ...STR_DEFAULTS, occupancyPct: 0 }).noi).toBeLessThan(0);
  });
});
