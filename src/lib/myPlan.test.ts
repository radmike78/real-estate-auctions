import { describe, expect, it } from 'vitest';
import { cashForPrice, cleanTeamList, PRICE_DEFAULTS, priceForCash, TEAM_ROLES } from './myPlan';
import { cleanBuyBox } from './toolkit';

describe('what price your cash supports', () => {
  it('finds the price whose down payment, closing costs and reserves fit the cash', () => {
    const p = priceForCash(108_800);
    // 25% down + 3% closing is 28% of the price, plus 6 months of payments: well under $388,571 (108,800 ÷ 0.28).
    expect(p).toBeGreaterThan(300_000);
    expect(p).toBeLessThan(388_571);
    expect(cashForPrice(p, PRICE_DEFAULTS).total).toBeLessThanOrEqual(108_800);
    expect(cashForPrice(p + 2_000, PRICE_DEFAULTS).total).toBeGreaterThan(108_800);
    expect(priceForCash(0)).toBe(0);
  });
});

describe('a price limit from the cash worksheet', () => {
  it('keeps the worksheet’s assumptions with the buy box, so its own check agrees', () => {
    const a = { downPct: 5, closingPct: 3, reserveMonths: 2, ratePct: 7, taxInsPct: 1.2 };
    const price = priceForCash(60_000, a);
    const b = cleanBuyBox(JSON.parse(JSON.stringify({ priceMax: price, cashMax: 60_000, priceAssumptions: a })));
    expect(b.priceAssumptions).toEqual(a);
    expect(cashForPrice(b.priceMax, b.priceAssumptions ?? PRICE_DEFAULTS).total).toBeLessThanOrEqual(b.cashMax);
    // With our usual 25% down the same price would need far more cash, which is the warning this avoids.
    expect(cashForPrice(b.priceMax, PRICE_DEFAULTS).total).toBeGreaterThan(b.cashMax);
    expect(cleanBuyBox({ priceAssumptions: { downPct: 'x' } }).priceAssumptions).toBeUndefined();
  });
});

describe('team list', () => {
  it('starts with the agent and includes the lender', () => {
    expect(TEAM_ROLES[0]).toBe('agent');
    expect(TEAM_ROLES).toContain('lender');
  });
  it('keeps only known roles and clean fields', () => {
    expect(cleanTeamList({ lender: { name: 'A', contact: 5, licenseChecked: 'yes' }, hacker: { name: 'x' } })).toEqual({ lender: { name: 'A', contact: '', licenseChecked: false, fees: '' } });
  });
});


it('keeps specialist contacts when the saved team is reloaded', () => {
  const contacts = Object.fromEntries(['cpa', 'property_manager', 'eviction', 'environmental', 'private_lender'].map((role) => [role, { name: role, contact: '555-0100', fees: 'Quote requested', licenseChecked: true }]));
  const cleaned = cleanTeamList(contacts);
  expect(Object.keys(cleaned).sort()).toEqual(Object.keys(contacts).sort());
  for (const role of Object.keys(contacts)) expect(TEAM_ROLES).toContain(role);
});

describe('Commercial income’s starting loan from your plan', () => {
  it('starts a borrower at a common 75% on a listed building, cash at 0, and nothing at an auction or when unsure', async () => {
    const { commercialLoanStart, commercialProfileStart } = await import('./myPlan');
    const p = { loan: 'yes' as const, manager: null, investable: 432_000 };
    expect(commercialLoanStart(p, true)).toBe(75);
    expect(commercialProfileStart(p, true)).toEqual({ loanPct: 75 });
    expect(commercialLoanStart({ ...p, loan: 'cash' }, true)).toBe(0);
    expect(commercialLoanStart({ ...p, loan: 'unsure' }, true)).toBeNull();
    expect(commercialLoanStart(p, false)).toBeNull();
    expect(commercialProfileStart(p, false)).toEqual({});
  });
});

describe('tax-sale wait help', () => {
  it('names Utah’s wait for the tax deed', async () => {
    const { taxSaleWait } = await import('./stateCosts');
    expect(taxSaleWait('UT')).toMatch(/60 to 180 days/);
    expect(taxSaleWait('NV')).toMatch(/NRS 361\.600/);
  });
});
