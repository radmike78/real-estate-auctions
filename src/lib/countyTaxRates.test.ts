import { expect, it } from 'vitest';
import { COUNTY_TAX_RATES } from './countyTaxRates';
import { STATES } from './regions';
import { countyTaxLine, countyTaxRate, propertyTaxHint, rentalStartFor } from './stateCosts';

// A rental's yearly tax as a % of value, by state: wide enough for every county, narrow enough to catch a slipped
// decimal (a rate per $100 entered as a %, or a % entered as a fraction).
const BOUNDS = { NV: [0.4, 1.6], CA: [0.95, 1.4], AZ: [0.2, 1.6], UT: [0.2, 1.4], TX: [0.5, 4.5] } as const;

it('has a published rate for every county the site covers, and none it doesn’t', () => {
  for (const s of STATES) {
    const rates = COUNTY_TAX_RATES[s.code].counties;
    expect(Object.keys(rates).sort()).toEqual([...s.counties].sort());
    const [lo, hi] = BOUNDS[s.code];
    for (const [county, r] of Object.entries(rates)) {
      expect(r.pct, `${s.code} ${county}`).toBeGreaterThanOrEqual(lo);
      expect(r.pct, `${s.code} ${county}`).toBeLessThanOrEqual(hi);
      if (r.low !== null || r.high !== null) {
        expect(r.low! <= r.pct + 0.005 && r.pct <= r.high! + 0.005, `${s.code} ${county} range`).toBe(true);
      }
    }
  }
});

it('starts a rental’s property tax from the county’s rate, and from the state’s when the county is unknown', () => {
  expect(rentalStartFor('TX', 350_000, 'Harris').propertyTaxYear).toBe(Math.round((350_000 * 0.0244) / 50) * 50);
  expect(rentalStartFor('CA', 350_000, 'Kern').propertyTaxYear).toBe(Math.round((350_000 * 0.01248) / 50) * 50);
  expect(rentalStartFor('TX', 350_000, 'Nowhere').propertyTaxYear).toBe(7_000);
  expect(rentalStartFor('TX', 350_000).propertyTaxYear).toBe(7_000);
  expect(countyTaxRate('NV', 'Clark')?.pct).toBe(1.04);
});

it('says where the starting tax comes from, with the year and the range inside the county', () => {
  const h = propertyTaxHint('TX', 'Harris');
  expect(h.hint).toContain('Harris County’s 2025 rate for a rental: about 2.44%');
  expect(countyTaxLine('NV', 'Carson City')?.short).toMatch(/^Carson City’s 2026 rate/);
  expect(h.more).toContain('Texas Comptroller of Public Accounts');
  expect(h.more).toContain('1.51% to 4.32%');
  expect(countyTaxLine('CA', 'Kern')?.short).toContain('about 1.25% of the price');
  expect(countyTaxLine('NV', 'Clark')?.short).toContain('taxable value');
  expect(propertyTaxHint('TX').hint).not.toContain('County’s');
});
