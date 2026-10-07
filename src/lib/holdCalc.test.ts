import { describe, expect, it } from 'vitest';
import { allInCost, annualDebtService, COMMERCIAL_DEFAULTS, commercialMaxBid, commercialNoi, LIEN_DEFAULTS, lienYield, RENT_DEFAULTS, rentMaxBid, rentNoi, sanitizeNumbers, rentStress, rentMonthlyCashFlow, explainRent, rentAtPrice, loanAt } from './holdCalc';

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

describe('rentEmptyMonths', () => {
  it('counts the months savings cover the loan, tax, insurance and HOA with no rent', async () => {
    const { rentEmptyMonths } = await import('./holdCalc');
    const v = { ...RENT_DEFAULTS, loanPct: 0, propertyTaxYear: 2_400, insuranceYear: 1_200, hoaMonthly: 100 };
    expect(rentEmptyMonths(v)).toEqual({ monthly: 400, months: null });
    expect(rentEmptyMonths({ ...v, reserveCash: 2_000 }).months).toBe(5);
  });
});

describe('a purchase loan on a listed home', () => {
  const i = { ...RENT_DEFAULTS, cashAvailable: 0, buyerPremiumPct: 0, transferTaxPer500: 2.55, survivingLiens: 0, titleLegal: 500, possession: 0, repairs: 0, contingencyPct: 0,
    monthlyRent: 2150, vacancyPct: 6, propertyTaxYear: 1700, insuranceYear: 1100, hoaMonthly: 45, managementPct: 8, maintenancePct: 5, capexPct: 5,
    value: 300_000, loanPct: 75, ratePct: 6.75, years: 30, loanCostPct: 2, targetCocPct: 8, minDscr: 1.25, reserveCash: 0 };

  it('sizes the loan on the lower of the price and the value, so a lower price can work', () => {
    expect(loanAt(i, 250_000, true)).toBe(187_500);
    expect(loanAt(i, 320_000, true)).toBe(225_000);
    expect(loanAt(i, 250_000, false)).toBe(225_000); // a later refinance doesn't change with the price
    const r = rentMaxBid(i, true);
    // Checked by hand: about $206,000 gives an 8% cash-on-cash return; $300,000 loses money.
    expect(r.maxBid).toBeGreaterThan(205_000);
    expect(r.maxBid).toBeLessThan(208_000);
    expect(r.cashOnCash!).toBeGreaterThanOrEqual(0.08);
    expect(rentAtPrice(i, 300_000, true).cashFlow).toBeLessThan(0);
  });

  it('caps the price by the cash you can put in, not by the full price', () => {
    const r = rentMaxBid({ ...i, cashAvailable: 50_000 }, true);
    expect(r.limitedBy).toBe('cash');
    expect(r.allIn - r.loanNet).toBeLessThanOrEqual(50_000);
    expect(r.maxBid).toBeGreaterThan(150_000);
  });

  it('at an auction, the cash covers the bid and the repairs before any refinance', () => {
    const r = rentMaxBid({ ...i, repairs: 30_000, cashAvailable: 100_000 });
    expect(r.allIn).toBeLessThanOrEqual(100_000);
  });
});

describe('no target return on a purchase without a loan', () => {
  it('sets no price limit instead of the search ceiling', () => {
    expect(rentMaxBid({ ...RENT_DEFAULTS, targetCocPct: 0, loanPct: 0 }, true).maxBid).toBe(Infinity);
    expect(rentMaxBid({ ...RENT_DEFAULTS, targetCocPct: 0, loanPct: 75 }, true).maxBid).toBeLessThan(1e9);
    expect(rentMaxBid({ ...RENT_DEFAULTS, targetCocPct: 0, loanPct: 0, cashAvailable: 0 }, true).overCap).toBe(false);
  });

  it('with a target set, a price past the $1 billion search ceiling is flagged, not shown as "no limit"', () => {
    const r = rentMaxBid({ ...RENT_DEFAULTS, targetCocPct: 8, loanPct: 0, cashAvailable: 0, monthlyRent: 1e9 }, true);
    expect(r.maxBid).toBe(Infinity);
    expect(r.overCap).toBe(true);
    expect(rentMaxBid({ ...RENT_DEFAULTS, targetCocPct: 8, loanPct: 0, cashAvailable: 0 }, true).overCap).toBe(false);
  });
});

describe('commercial reserves and reimbursements', () => {
  it('a yearly replacement reserve lowers cash flow, not NOI or the cap-rate price', () => {
    const base = { ...COMMERCIAL_DEFAULTS, value: 900_000, loanPct: 70 };
    const a = commercialMaxBid(base);
    const b = commercialMaxBid({ ...base, reservesYear: 12_000 });
    expect(b.noi).toBe(a.noi);
    expect(b.maxBid).toBe(a.maxBid);
    expect(Math.round((a.cashFlow - b.cashFlow) / 12)).toBe(1_000);
  });

  it('reimbursements counted once give the same NOI either way', () => {
    const lines = { opInsuranceYear: 0, opRepairsYear: 0, opUtilitiesYear: 0, opManagementPct: 0, opOtherYear: 0, vacancyPct: 0 };
    // $100,000 rent, $10,000 reimbursed as income, $30,000 full costs…
    const gross = commercialNoi({ ...COMMERCIAL_DEFAULTS, ...lines, monthlyRent: 100_000 / 12, otherMonthly: 10_000 / 12, opTaxYear: 30_000 });
    // …or $100,000 rent and $20,000 costs after reimbursement.
    const net = commercialNoi({ ...COMMERCIAL_DEFAULTS, ...lines, monthlyRent: 100_000 / 12, otherMonthly: 0, opTaxYear: 20_000 });
    expect(Math.round(gross.noi)).toBe(80_000);
    expect(Math.round(net.noi)).toBe(80_000);
  });
});
