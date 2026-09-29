import { describe, expect, it } from 'vitest';
import { redemptionOutcome, START_INPUTS } from './bidCalc';
import { redemptionPresetsFor, transferTaxFor } from './stateCosts';

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
      return redemptionOutcome({ ...START_INPUTS, redemptionMonths: r.months, redemptionRatePct: r.ratePct, redemptionDaily: r.daily }, bid)!.repaid;
    };
    expect(repay('AZ', 'azJudicial')).toBeCloseTo(108_000, 0);
    expect(repay('AZ', 'azJudicialAbandoned')).toBeCloseTo(108_000, 0);
    expect(repay('UT', 'utSheriff')).toBeCloseTo(106_000, 0);
  });

  it('offers only each state’s own redemption rules', () => {
    expect(Object.keys(redemptionPresetsFor('NV'))).toEqual(['none', 'hoa', 'sheriff', 'irs']);
    expect(Object.keys(redemptionPresetsFor('CA'))).not.toContain('hoa');
    expect(Object.keys(redemptionPresetsFor('UT'))).toEqual(['none', 'utSheriff', 'irs']);
  });
});
