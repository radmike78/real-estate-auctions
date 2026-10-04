import { describe, expect, it } from 'vitest';
import { cashForPrice, cleanTeamList, PRICE_DEFAULTS, priceForCash, TEAM_ROLES } from './myPlan';

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

describe('team list', () => {
  it('starts with the agent and includes the lender', () => {
    expect(TEAM_ROLES[0]).toBe('agent');
    expect(TEAM_ROLES).toContain('lender');
  });
  it('keeps only known roles and clean fields', () => {
    expect(cleanTeamList({ lender: { name: 'A', contact: 5, licenseChecked: 'yes' }, hacker: { name: 'x' } })).toEqual({ lender: { name: 'A', contact: '', licenseChecked: false, fees: '' } });
  });
});
