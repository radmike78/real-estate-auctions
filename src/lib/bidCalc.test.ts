import { describe, expect, it } from 'vitest';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { BLANK_INPUTS, costsAtBid, defaultsFor, maxSafeBid, profitAtBid, stressTests, type BidInputs } from './bidCalc';

const base: BidInputs = { ...BLANK_INPUTS, exitValue: 400_000, repairs: 40_000, buyerPremiumPct: 5, financedPct: 70 };

describe('maximum safe bid', () => {
  it('leaves exactly the target profit at the max bid, after every cost', () => {
    const r = maxSafeBid(base);
    expect(r.noBidWorks).toBe(false);
    const profit = profitAtBid(base, r.maxBid);
    expect(profit).toBeGreaterThanOrEqual(base.exitValue * 0.15 - 1);
    expect(profit).toBeLessThan(base.exitValue * 0.15 + 5); // floor() keeps it just above target
    expect(profitAtBid(base, r.maxBid + 100)).toBeLessThan(base.exitValue * 0.15);
  });

  it('break-even bid makes zero profit and is higher than the max bid', () => {
    const r = maxSafeBid(base);
    expect(Math.abs(profitAtBid(base, r.breakEvenBid))).toBeLessThan(5);
    expect(r.breakEvenBid).toBeGreaterThan(r.maxBid);
  });

  it('counts costs that simple calculators miss', () => {
    const c = costsAtBid(base, 200_000);
    expect(c.premium).toBe(10_000);
    expect(c.transferTax).toBeCloseTo(1020, 2); // $2.55 per $500
    expect(c.repairs).toBeCloseTo(46_000, 2); // 15% contingency
    expect(c.selling).toBe(32_000);
    expect(c.financing).toBeGreaterThan(0);
  });

  it('says so when no bid can meet the target', () => {
    const r = maxSafeBid({ ...base, exitValue: 50_000, repairs: 60_000 });
    expect(r.noBidWorks).toBe(true);
    expect(r.maxBid).toBe(0);
  });

  it('stress tests only ever lower the max bid', () => {
    const [asIs, ...worse] = stressTests(base);
    for (const w of worse) expect(w.maxBid).toBeLessThanOrEqual(asIs.maxBid);
    expect(worse[worse.length - 1].maxBid).toBeLessThan(worse[0].maxBid);
  });

  it('property defaults reflect the sale type and occupancy', () => {
    const tax = SAMPLE_PROPERTIES.find((p) => p.sale?.saleType === 'TAX_DEED')!;
    const d = defaultsFor(tax);
    expect(d.titleLegal).toBeGreaterThanOrEqual(3_000); // quiet title budget for tax deeds
    expect(d.exitValue).toBeGreaterThan(0);
    const sheriff = SAMPLE_PROPERTIES.find((p) => p.sale?.saleType === 'SHERIFF_EXECUTION');
    if (sheriff) expect(defaultsFor(sheriff).holdingMonths).toBeGreaterThanOrEqual(12);
  });
});

import { diligenceReport } from './diligence';
import { DD_STEPS } from './ddFunnel';
import { PLAYBOOKS, playbookForSale } from './playbooks';

describe('due-diligence workflow and playbooks', () => {
  it('puts every automated check into exactly one of the 12 steps', () => {
    expect(DD_STEPS).toHaveLength(12);
    const mapped = DD_STEPS.flatMap((s) => s.areas);
    for (const p of SAMPLE_PROPERTIES.slice(0, 10)) {
      for (const c of diligenceReport(p)) expect(mapped.filter((a) => a === c.area)).toHaveLength(1);
    }
  });

  it('has a playbook for every sale type, with official https sources and no income promises', () => {
    for (const t of ['TAX_DEED', 'TAX_LIEN_CERTIFICATE', 'TRUSTEE_SALE', 'JUDICIAL_FORECLOSURE', 'HOA_FORECLOSURE', 'SHERIFF_EXECUTION', 'FEDERAL_TAX_SEIZURE', 'REO'] as const) {
      expect(playbookForSale(t), t).not.toBeNull();
    }
    for (const p of PLAYBOOKS) {
      for (const s of p.sources) expect(s.url).toMatch(/^(https:\/\/|#\/)/);
      expect(JSON.stringify(p)).not.toMatch(/guarantee(d)? (profit|return)|get rich|passive income/i);
    }
  });

  it('states the verified Clark County tax sale rules', () => {
    const tax = PLAYBOOKS.find((p) => p.key === 'tax')!;
    const text = JSON.stringify(tax);
    expect(text).toMatch(/not an LLC or trust/);
    expect(text).toMatch(/1:00 p\.m\./);
    expect(text).toMatch(/protest for 2 years/);
    expect(text).not.toMatch(/buyer.s premium/i); // the in-person Treasurer auction has none
  });
});

describe('My deals storage', () => {
  it('ignores malformed saved entries instead of crashing', async () => {
    const store: Record<string, string> = {};
    globalThis.localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } } as Storage;
    store['fsf.deals.v1'] = JSON.stringify([{ id: 'p1', statusAtSave: 'bogus', postponementsAtSave: 'x' }, { nope: 1 }, 'junk']);
    const { loadDeals } = await import('./deals');
    const list = loadDeals();
    expect(list).toHaveLength(1);
    expect(list[0].statusAtSave).toBeNull();
    expect(list[0].postponementsAtSave).toBe(0);
    expect(list[0].notes).toBe('');
  });
});
