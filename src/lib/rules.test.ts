import { describe, expect, it } from 'vitest';
import type { Lien, Property, SaleDetails } from '../types';
import { assessLiens, moneySummary } from './rules';
import { applyFilters, DEFAULT_FILTERS, parseLocation } from './search';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { STATUS } from './status';

const src = { agency: 'test', url: null, lastVerified: '2026-01-01T00:00:00Z', confidence: 'high' as const };
const lien = (id: string, type: Lien['type'], recordedDate: string, amount = 1000, foreclosing = false): Lien => ({
  id, type, holder: 'x', amount, recordedDate, foreclosing, source: src,
});

function prop(liens: Lien[], sale: Partial<SaleDetails> | null): Property {
  return {
    ...SAMPLE_PROPERTIES[0],
    liens,
    estimatedMarketValue: 300_000,
    sale: sale ? ({ ...SAMPLE_PROPERTIES[0].sale!, minimumBid: 100_000, ...sale } as SaleDetails) : null,
  };
}

const outcomes = (p: Property) => Object.fromEntries(assessLiens(p).map((a) => [a.lien.id, a.outcome]));

describe('lien survival (Nevada)', () => {
  it('trustee sale: juniors wiped out, seniors and taxes survive, HOA super-priority survives', () => {
    const p = prop(
      [
        lien('dot', 'FIRST_DEED_OF_TRUST', '2020-01-01', 200_000, true),
        lien('senior', 'JUDGMENT', '2019-01-01', 5_000),
        lien('junior', 'JUDGMENT', '2022-01-01', 7_000),
        lien('tax', 'PROPERTY_TAX', '2025-01-01', 3_000),
        lien('hoa', 'HOA_SUPERPRIORITY', '2024-01-01', 2_000),
        lien('hoaSub', 'HOA_SUBPRIORITY', '2024-01-01', 4_000),
        lien('irs', 'FEDERAL_TAX', '2023-01-01', 50_000),
      ],
      { saleType: 'TRUSTEE_SALE' },
    );
    expect(outcomes(p)).toEqual({
      dot: 'FORECLOSING',
      senior: 'LIKELY_SURVIVES',
      junior: 'LIKELY_EXTINGUISHED',
      tax: 'LIKELY_SURVIVES',
      hoa: 'LIKELY_SURVIVES',
      hoaSub: 'LIKELY_EXTINGUISHED',
      irs: 'UNCERTAIN',
    });
    const m = moneySummary(p);
    expect(m.likelySurviving).toBe(5_000 + 3_000 + 2_000);
    expect(m.uncertain).toBe(50_000);
    expect(m.estimatedEquity).toBe(300_000 - 100_000 - 10_000);
  });

  it('HOA foreclosure: first deed of trust is uncertain, never silently wiped out', () => {
    const p = prop(
      [lien('hoa', 'HOA_SUPERPRIORITY', '2024-01-01', 3_000, true), lien('dot', 'FIRST_DEED_OF_TRUST', '2018-01-01', 150_000)],
      { saleType: 'HOA_FORECLOSURE' },
    );
    expect(outcomes(p).dot).toBe('UNCERTAIN');
  });

  it('tax deed: private liens likely extinguished, federal and municipal liens need review', () => {
    const p = prop(
      [
        lien('tax', 'PROPERTY_TAX', '2021-01-01', 4_000, true),
        lien('dot', 'FIRST_DEED_OF_TRUST', '2015-01-01'),
        lien('irs', 'FEDERAL_TAX', '2019-01-01'),
        lien('code', 'CODE_ENFORCEMENT', '2023-01-01'),
      ],
      { saleType: 'TAX_DEED' },
    );
    expect(outcomes(p)).toEqual({ tax: 'FORECLOSING', dot: 'LIKELY_EXTINGUISHED', irs: 'UNCERTAIN', code: 'UNCERTAIN' });
  });

  it('no pending sale: all liens remain and there is no equity estimate', () => {
    const p = prop([lien('j', 'JUDGMENT', '2024-01-01', 9_000)], null);
    expect(moneySummary(p)).toMatchObject({ likelySurviving: 9_000, estimatedEquity: null });
  });
});

describe('search', () => {
  it('parses location queries', () => {
    expect(parseLocation('89123')).toEqual({ kind: 'zip', zip: '89123' });
    expect(parseLocation('Henderson, nv')).toEqual({ kind: 'cityState', city: 'henderson', state: 'NV' });
    expect(parseLocation('000-12-345-678')).toEqual({ kind: 'apn', apn: '00012345678' });
    expect(parseLocation('clark county')).toEqual({ kind: 'text', text: 'clark county' });
  });

  it('filters by city/state and ZIP', () => {
    const hend = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, location: 'Henderson, NV' });
    expect(hend.length).toBeGreaterThan(0);
    expect(hend.every((p) => p.city === 'Henderson')).toBe(true);
    const zip = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, location: '89123' });
    expect(zip.every((p) => p.zip === '89123')).toBe(true);
    expect(applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, location: 'Austin, TX' })).toHaveLength(0);
  });

  it('"buyable now" excludes lien-only and pre-foreclosure properties', () => {
    const r = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, purchasableOnly: true });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => STATUS[p.status].purchasable)).toBe(true);
    expect(r.some((p) => p.status === 'NOT_FOR_SALE_LIEN_ONLY')).toBe(false);
  });

  it('online filter returns only online-bidding sales', () => {
    const r = applyFilters(SAMPLE_PROPERTIES, { ...DEFAULT_FILTERS, bidding: 'online' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.status === 'ONLINE_BIDDING')).toBe(true);
  });
});

describe('sample data invariants', () => {
  it('a lien alone never marks a property purchasable', () => {
    for (const p of SAMPLE_PROPERTIES) {
      if (!p.sale) expect(STATUS[p.status].purchasable).toBe(false);
    }
  });
});
