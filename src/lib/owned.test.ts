import { describe, expect, it } from 'vitest';
import { cleanOwned, ownedSummary } from './owned';

describe('owned properties', () => {
  it('keeps only well-formed entries, one per month, newest first', () => {
    const o = cleanOwned({
      abc: { boughtOn: '2026-03-15', months: [{ month: '2026-04', rent: 2000, costs: 1800, note: 'x' }, { month: '2026-05', rent: 2000, costs: 2500 }, { month: '2026-04', rent: 9, costs: 9 }, { month: '2026-13', rent: 1, costs: 1 }, 'junk'] },
      bad: { boughtOn: 'yesterday', months: [] },
      'no good id!': { boughtOn: '2026-01-01', months: [] },
      nums: { boughtOn: '2026-01-01', months: [{ month: '2026-02', rent: 'x', costs: Infinity }] },
    });
    expect(Object.keys(o).sort()).toEqual(['abc', 'nums']);
    expect(o.abc.months.map((m) => m.month)).toEqual(['2026-05', '2026-04']);
    expect(o.abc.months[1]).toEqual({ month: '2026-04', rent: 2000, costs: 1800, note: 'x' });
    expect(o.nums.months[0]).toMatchObject({ rent: 0, costs: 0 });
    expect(cleanOwned(null)).toEqual({});
    expect(cleanOwned([1, 2])).toEqual({});
  });

  it('compares actual months with the projection', () => {
    const s = ownedSummary({ boughtOn: '2026-03-15', months: [{ month: '2026-05', rent: 2000, costs: 2500, note: '' }, { month: '2026-04', rent: 2000, costs: 1800, note: '' }] }, 150);
    expect(s).toMatchObject({ months: 2, rent: 4000, costs: 4300, actual: -300, averageMonthly: -150, projectedTotal: 300, gapMonthly: -300 });
    expect(ownedSummary({ boughtOn: '2026-03-15', months: [] }, null)).toMatchObject({ months: 0, gapMonthly: null, projectedTotal: null });
  });
});
