import { describe, expect, it } from 'vitest';
import { redemptionOutcome, START_INPUTS } from './bidCalc';
import { redemptionChoicesFor, redemptionPresetsFor, transferTaxFor } from './stateCosts';

describe('state deal costs', () => {
  it('uses each state’s transfer tax per $500', () => {
    expect(transferTaxFor('NV', 'Clark').per500).toBe(2.55);
    expect(transferTaxFor('NV', 'Washoe').per500).toBe(2.05);
    expect(transferTaxFor('NV', 'Churchill').per500).toBe(2.05);
    expect(transferTaxFor('NV', 'Elko').per500).toBe(1.95);
    expect(transferTaxFor('CA', 'Los Angeles').per500).toBe(0.55);
    expect(transferTaxFor('AZ', 'Maricopa').per500).toBe(0);
    expect(transferTaxFor('UT', 'Salt Lake').per500).toBe(0);
  });

  it('repays the flat redemption amounts the law sets (Arizona +8%, Utah +6%) at the end of the wait', () => {
    const bid = 100_000;
    const repay = (st: 'AZ' | 'UT', key: string) => {
      const r = redemptionPresetsFor(st)[key];
      return redemptionOutcome({ ...START_INPUTS, redemptionMonths: r.months, redemptionRatePct: r.ratePct, redemptionDaily: r.daily, redemptionFlat: r.flat, redemptionFlat2Pct: r.flat2Pct }, bid)!.repaid;
    };
    expect(repay('AZ', 'azJudicial')).toBeCloseTo(108_000, 0);
    expect(repay('AZ', 'azJudicialAbandoned')).toBeCloseTo(108_000, 0);
    expect(repay('UT', 'utSheriff')).toBeCloseTo(106_000, 0);
  });

  it('treats a Texas tax redemption premium as a flat amount, not yearly interest (Tax Code 34.21)', () => {
    const tx = redemptionPresetsFor('TX');
    const at = (key: string, months: number, bid: number) => {
      const r = tx[key];
      return redemptionOutcome({ ...START_INPUTS, redemptionMonths: months, redemptionRatePct: r.ratePct, redemptionDaily: r.daily, redemptionFlat: r.flat, redemptionFlat2Pct: r.flat2Pct }, bid)!.repaid;
    };
    // The review's example: a $149,000 bid redeemed after 3 months still owes the full 25%, not 12.5%.
    expect(at('txTaxOther', 3, 149_000)).toBeCloseTo(186_250, 0);
    expect(at('txTaxOther', 6, 149_000)).toBeCloseTo(186_250, 0);
    // Homestead, agricultural land or mineral interest: 25% in the first year, 50% in the second.
    expect(at('txTaxHomestead', 4, 100_000)).toBeCloseTo(125_000, 0);
    expect(at('txTaxHomestead', 12, 100_000)).toBeCloseTo(125_000, 0);
    expect(at('txTaxHomestead', 18, 100_000)).toBeCloseTo(150_000, 0);
    // Condominium association sale: 6% a year really is yearly interest (Property Code 82.113).
    expect(at('txHoaCondo', 3, 100_000)).toBeCloseTo(101_500, 0);
  });

  it('fits the redemption rule to the kind of sale and asks Texas buyers to confirm it', () => {
    expect(redemptionChoicesFor('TX', 'taxSale')).toMatchObject({ keys: ['txTaxHomestead', 'txTaxOther'], start: 'txTaxHomestead' });
    expect(redemptionChoicesFor('TX', 'taxSale').confirm).toMatch(/mineral interest/);
    expect(redemptionChoicesFor('TX', 'hoa').keys).toEqual(['txHoaSubdivision', 'txHoaCondo', 'usFederal']);
    expect(redemptionChoicesFor('TX', 'hoa').confirm).toMatch(/declaration/);
    // IRS interest can't carry into an HOA sale; Texas execution sales have no redemption; trustee and HOA sales can
    // leave the United States its 120 days when a junior federal tax lien was on title (26 USC 7425(d)).
    expect(redemptionChoicesFor('TX', 'hoa').keys).not.toContain('irs');
    expect(redemptionChoicesFor('TX', 'court').keys).toEqual(['none']);
    expect(redemptionChoicesFor('TX', 'trustee')).toMatchObject({ keys: ['none', 'usFederal'], start: 'none' });
    expect(redemptionChoicesFor('NV', 'hoa')).toMatchObject({ keys: ['hoa', 'usFederal'], start: 'hoa' });
    expect(redemptionPresetsFor('CA').usFederal).toMatchObject({ months: 4, ratePct: 6 });
    for (const st of ['NV', 'CA', 'AZ', 'UT', 'TX'] as const)
      for (const kind of ['trustee', 'taxSale', 'court', 'hoa', 'irs'])
        for (const k of redemptionChoicesFor(st, kind).keys) expect(redemptionPresetsFor(st), `${st} ${kind} ${k}`).toHaveProperty(k);
  });

  it('offers only each state’s own redemption rules', () => {
    expect(Object.keys(redemptionPresetsFor('NV'))).toEqual(['none', 'hoa', 'sheriff', 'irs', 'usFederal']);
    // California's HOA redemption is its own: 90 days (Civil Code 5715), not Nevada's 60.
    expect(redemptionPresetsFor('CA').hoa).toMatchObject({ months: 3, ratePct: 10 });
    expect(Object.keys(redemptionPresetsFor('UT'))).toEqual(['none', 'utSheriff', 'irs', 'usFederal']);
  });
});
