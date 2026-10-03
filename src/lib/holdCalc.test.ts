import { describe, expect, it } from 'vitest';
import { allInCost, annualDebtService, COMMERCIAL_DEFAULTS, commercialMaxBid, commercialNoi, LIEN_DEFAULTS, lienYield, RENT_DEFAULTS, rentMaxBid, rentNoi, sanitizeNumbers, rentStress, rentMonthlyCashFlow, explainRent, rentAtPrice } from './holdCalc';

describe('rent / hold', () => {
  it('works out net operating income from rent, vacancy and costs', () => {
    const n = rentNoi({ ...RENT_DEFAULTS, monthlyRent: 2_000, vacancyPct: 10, propertyTaxYear: 1_000, insuranceYear: 1_000, hoaMonthly: 0, managementPct: 10, maintenancePct: 0, capexPct: 0 });
    expect(n.collected).toBe(21_600);
    expect(n.expenses).toBe(2_000 + 2_160);
    expect(n.noi).toBe(21_600 - 4_160);
  });

  it('all cash: the walk-away bid gives exactly the target cash-on-cash return', () => {
    const i = { ...RENT_DEFAULTS, loanPct: 0, targetCocPct: 8 };
    const r = rentMaxBid(i);
    expect(r.noBidWorks).toBe(false);
    expect(r.cashOnCash!).toBeGreaterThanOrEqual(0.08 - 1e-9);
    // One dollar more (plus one transfer-tax step) would fall below the target.
    const above = r.cashFlow / allInCost(i, r.maxBid + 500);
    expect(above).toBeLessThan(0.08);
  });

  it('a refinance leaves less cash in the deal, so you can pay more, and checks the loan coverage', () => {
    const cash = rentMaxBid({ ...RENT_DEFAULTS, loanPct: 0 });
    const refi = rentMaxBid({ ...RENT_DEFAULTS, loanPct: 50 });
    expect(refi.debtService).toBeGreaterThan(0);
    expect(refi.dscr).not.toBeNull();
    expect(refi.maxBid).not.toBe(cash.maxBid);
    const heavy = rentMaxBid({ ...RENT_DEFAULTS, loanPct: 80, ratePct: 10 });
    expect(heavy.loanOk).toBe(heavy.dscr! >= RENT_DEFAULTS.minDscr);
  });

  it('respects the cash you can bring and says so', () => {
    const r = rentMaxBid({ ...RENT_DEFAULTS, cashAvailable: 50_000 });
    expect(r.maxBid).toBeLessThanOrEqual(50_000);
    expect(r.limitedBy).toBe('cash');
  });

  it('no bid works when rent does not cover costs', () => {
    expect(rentMaxBid({ ...RENT_DEFAULTS, monthlyRent: 200 }).noBidWorks).toBe(true);
  });
});

describe('commercial income', () => {
  it('pays no more than your cap rate on cost allows, counting lease-up carry', () => {
    const i = { ...COMMERCIAL_DEFAULTS };
    const r = commercialMaxBid(i);
    const noi = commercialNoi(i).noi;
    expect(r.leaseUpCost).toBe(6 * 2_000);
    expect(noi / r.allIn).toBeGreaterThanOrEqual(0.09 - 1e-6);
    const slowerLeaseUp = commercialMaxBid({ ...i, leaseUpMonths: 12 });
    expect(slowerLeaseUp.maxBid).toBeLessThan(r.maxBid);
  });
});

describe('lien certificates', () => {
  it('1% a month simple interest, and a yearly yield counting the wait to be paid', () => {
    const y = lienYield(LIEN_DEFAULTS); // $2,000 for 8 months
    expect(y.interest).toBe(160);
    expect(y.payoff).toBe(2_160);
    expect(y.yearlyYield!).toBeCloseTo(160 / 2_000 / (9.5 / 12), 6);
    expect(lienYield({ ...LIEN_DEFAULTS, fees: 50 }).profit).toBe(110);
  });
});

describe('helpers', () => {
  it('amortizes a loan', () => {
    expect(annualDebtService(100_000, 0, 10)).toBeCloseTo(10_000, 6);
    expect(annualDebtService(100_000, 6, 30)).toBeCloseTo(7_194.6, 0);
  });
  it('rebuilds saved numbers safely', () => {
    expect(sanitizeNumbers({ price: -5, fees: 'x', ratePctMonth: 2, extra: 9 }, LIEN_DEFAULTS)).toEqual({ ...LIEN_DEFAULTS, ratePctMonth: 2 });
  });
});

describe('rent deal lab', () => {
  const base = { ...RENT_DEFAULTS };
  it('stress tests lower cash flow, and the base row matches the cash flow', () => {
    const rows = rentStress(base);
    expect(rows[0].monthly).toBeCloseTo(rentMonthlyCashFlow(base), 2);
    for (const r of rows.slice(1)) expect(r.monthly, r.key).toBeLessThan(rows[0].monthly);
  });
  it('explains thin deals, missing reserves and what to verify', () => {
    const lines = explainRent({ ...base, capexPct: 0, vacancyPct: 2, managementPct: 0 });
    expect(lines.join(' ')).toMatch(/big replacements/);
    expect(lines.join(' ')).toMatch(/below the 5–8%/);
    expect(lines.join(' ')).toMatch(/manage it yourself/);
    expect(lines[lines.length - 1]).toMatch(/insurance quote/);
    expect(explainRent({ ...base, monthlyRent: 100 })[0]).toMatch(/loses about/);
  });
});

describe('NOI, reserves, debt service and cash flow stay separate', () => {
  const i = { ...RENT_DEFAULTS, monthlyRent: 2_000, vacancyPct: 0, propertyTaxYear: 1_200, insuranceYear: 1_200, hoaMonthly: 0, managementPct: 0, maintenancePct: 0, capexPct: 10, loanPct: 0 };
  it('keeps reserves out of NOI and takes them from cash flow', () => {
    const n = rentNoi(i);
    expect(n.noi).toBe(24_000 - 2_400);
    expect(n.reserves).toBe(2_400);
    expect(rentMaxBid(i).cashFlow).toBe(24_000 - 2_400 - 2_400);
  });
  it('adds up from rent to cash flow at a chosen price', () => {
    const a = rentAtPrice({ ...i, loanPct: 75, value: 300_000, ratePct: 7, years: 30 }, 250_000);
    expect(a.gross - a.vacancy).toBeCloseTo(a.collected, 2);
    expect(a.collected - a.operating).toBeCloseTo(a.noi, 2);
    expect(a.noi - a.reserves - a.debtService).toBeCloseTo(a.cashFlow, 2);
    expect(a.dscr).toBeCloseTo(a.noi / a.debtService, 2);
    expect(a.capOnPrice).toBeCloseTo(a.noi / 250_000, 6);
  });
});
