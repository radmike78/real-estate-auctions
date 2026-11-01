import { expect, it } from 'vitest';
import { COUNTY_TAX_RATES } from './countyTaxRates';
import { STATES } from './regions';
import { countyTaxLine, countyTaxRate, propertyTaxHint, rentalStartFor, taxAtPrice } from './stateCosts';

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
  expect(h.hint).toBe('Harris County: about 2.44% of value a year (2025 rental rate).');
  // One short line: the state's rules are in the details.
  expect(h.more).toContain('the starting tax here follows it at this rate');
  expect(h.more).toContain('homestead');
  expect(countyTaxLine('NV', 'Carson City')?.short).toBe('Carson City: about 1.24% of taxable value a year (2026 rental rate).');
  expect(h.more).toContain('Texas Comptroller of Public Accounts');
  expect(h.more).toContain('1.51% to 4.32%');
  expect(countyTaxLine('CA', 'Kern')?.short).toContain('about 1.25% of price');
  expect(countyTaxLine('NV', 'Clark')?.short).toContain('taxable value');
  expect(propertyTaxHint('TX').hint).not.toContain('County’s');
});

it('figures a starting tax on your price once you enter one, and leaves a typed tax alone', () => {
  const start = rentalStartFor('TX', 350_000, 'Harris').propertyTaxYear;
  const none = new Set<string>();
  expect(taxAtPrice({ propertyTaxYear: start, atPrice: 230_000 }, 'TX', 'Harris', none, 350_000, 2_400)).toBe(5_600);
  expect(taxAtPrice({ propertyTaxYear: start, atPrice: 0 }, 'TX', 'Harris', none, 350_000, 2_400)).toBe(start);
  expect(taxAtPrice({ propertyTaxYear: 7_000, atPrice: 230_000 }, 'TX', 'Harris', none, 350_000, 2_400)).toBe(5_600); // the old statewide start
  expect(taxAtPrice({ propertyTaxYear: 2_400, atPrice: 230_000 }, 'TX', 'Harris', none, 350_000, 2_400)).toBe(5_600); // the flat example
  expect(taxAtPrice({ propertyTaxYear: 4_321, atPrice: 230_000 }, 'TX', 'Harris', none, 350_000, 2_400)).toBe(4_321); // someone's own figure
  expect(taxAtPrice({ propertyTaxYear: start, atPrice: 230_000 }, 'TX', 'Harris', new Set(['propertyTaxYear']), 350_000, 2_400)).toBe(start);
  expect(taxAtPrice({ propertyTaxYear: start, atPrice: 230_000 }, 'TX', 'Nowhere', none, 350_000, 2_400)).toBe(start);
});
