import { describe, expect, it } from 'vitest';
import { SAMPLE_PROPERTIES } from '../data/sampleProperties';
import { BLANK_INPUTS, maxBidSteps, START_INPUTS, costsAtBid, defaultsFor, maxSafeBid, profitAtBid, redemptionOutcome, REDEMPTION_RULES, requiredProfit, ruleOf, sanitizeInputs, stressGrid, stressTests, totalMonths, type BidInputs, cashNeededAtBid, proposedPriceOf, resultAtPrice } from './bidCalc';
import { daysUntil, whenLabel } from '../components/ResultsList';

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
    expect(costsAtBid(base, 200_001).transferTax).toBeCloseTo(1022.55, 2); // a fraction of $500 counts as a full $500 (NRS 375.020)
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
    if (sheriff) {
      const ds = defaultsFor(sheriff);
      expect(ds.redemptionMonths).toBe(12); // the 1-year redemption comes before any work
      expect(totalMonths(ds)).toBeGreaterThanOrEqual(12);
    }
  });

  it('gives a Nevada court-ordered foreclosure sale the 1-year redemption (NRS 21.190, 21.210)', () => {
    const judicial = SAMPLE_PROPERTIES.find((p) => p.sale?.saleType === 'JUDICIAL_FORECLOSURE' && p.state === 'NV')!;
    expect(judicial).toBeTruthy();
    const d = defaultsFor(judicial);
    expect(ruleOf(d)).toBe('sheriff');
    expect(d.redemptionMonths).toBe(12);
    expect(d.redemptionRatePct).toBe(12);
    expect(d.holdingMonths).toBe(3);
    expect(d.titleLegal).toBe(1_500);
    // A trustee sale still has no owner redemption.
    const trustee = SAMPLE_PROPERTIES.find((p) => p.sale?.saleType === 'TRUSTEE_SALE')!;
    expect(ruleOf(defaultsFor(trustee))).toBe('none');
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
    expect(text).toMatch(/name on your Trustee Auction Registration Form/);
    expect(text).toMatch(/individual’s name, not a company, LLC or trust/); // the Treasurer's registration form says so
    expect(text).toMatch(/1:00 p\.m\./);
    expect(text).toMatch(/2 years after the Treasurer’s deed is delivered[^"]*\(NRS 361\.600\)/);
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

describe('review fixes', () => {
  it('rebuilds saved calculator inputs from known numeric keys only', () => {
    const out = sanitizeInputs({ targetProfitPct: { toString: 1 }, exitValue: 'abc', repairs: -5, holdingMonths: 9, extra: 1 }, BLANK_INPUTS);
    expect(out.targetProfitPct).toBe(BLANK_INPUTS.targetProfitPct);
    expect(out.exitValue).toBe(BLANK_INPUTS.exitValue);
    expect(out.repairs).toBe(BLANK_INPUTS.repairs);
    expect(out.holdingMonths).toBe(9);
    expect('extra' in out).toBe(false);
    expect(sanitizeInputs(null, BLANK_INPUTS)).toEqual(BLANK_INPUTS);
  });

  it('never shows a $0 max bid as workable', () => {
    const r = maxSafeBid({ ...BLANK_INPUTS, exitValue: 100_000, repairs: 0, contingencyPct: 0, titleLegal: 0, possession: 0, holdingMonths: 0, transferTaxPer500: 0, sellingCostPct: 0, targetProfitPct: 99.9995 });
    expect(r.maxBid).toBe(0);
    expect(r.noBidWorks).toBe(true);
  });

  it('counts days on Las Vegas calendar dates: passed, today, tomorrow, in N days', () => {
    const now = Date.parse('2026-09-25T12:00:00Z'); // 5:00 a.m. Friday in Las Vegas
    expect(daysUntil('2026-09-25T10:00:00Z', now)).toBeLessThan(0);
    expect(daysUntil('2026-09-25T14:00:00Z', now)).toBe(0);
    expect(daysUntil('2026-09-26T16:00:00Z', now)).toBe(1); // Saturday 9 a.m., 28 hours away
    expect(daysUntil('2026-09-27T12:00:00Z', now)).toBe(2);
    expect(daysUntil('2026-09-26T06:30:00Z', Date.parse('2026-09-26T05:00:00Z'))).toBe(0); // 10 p.m. and 11:30 p.m. the same evening
    expect(whenLabel(0)).toBe('today');
    expect(whenLabel(1)).toBe('tomorrow');
    expect(whenLabel(5)).toBe('in 5 days');
  });
});

describe('legal fact-check fixes', () => {
  it('uses the special-assessment checklist for lien certificates, not the tax-deed one', async () => {
    const { checklistForProperty } = await import('./buyerChecklists');
    const sid = checklistForProperty('TAX_LIEN_CERTIFICATE', 'IN_PERSON_AUCTION');
    expect(sid.key).toBe('sid');
    const text = sid.items.map((i) => `${i.text} ${i.detail ?? ''}`).join(' ');
    expect(text).toMatch(/no deposit/i);
    expect(text).toMatch(/expires 3 years/);
    expect(text).not.toMatch(/\$5,000/);
  });

  it('gives tenants the federal 90-day notice, not 60', async () => {
    const { CHECKLISTS } = await import('./buyerChecklists');
    const { playbookByKey } = await import('./playbooks');
    const all = JSON.stringify(CHECKLISTS) + JSON.stringify(playbookByKey('foreclosure'));
    expect(all).toMatch(/90 days/);
    expect(all).not.toMatch(/60 days for monthly tenants/);
  });

  it('says a special-assessment deed clears other liens', async () => {
    const { playbookByKey } = await import('./playbooks');
    expect(playbookByKey('sid')!.survives.wipedOut.join(' ')).toMatch(/NRS 271\.600/);
  });
});

describe('input limits', () => {
  it('caps percentages at 100 and money at $10 billion, and ignores negatives', async () => {
    const { clampInput, sanitizeInputs, BLANK_INPUTS } = await import('./bidCalc');
    expect(clampInput('financedPct', 250)).toBe(100);
    expect(clampInput('exitValue', 1e308)).toBe(1e10);
    expect(clampInput('repairs', -5)).toBe(0);
    expect(sanitizeInputs({ sellingCostPct: 500, targetProfitPct: 20 }, BLANK_INPUTS)).toMatchObject({ sellingCostPct: 100, targetProfitPct: 20 });
  });
});

describe('walk-away price: cash limit, minimum profit, redemption, yearly return', () => {
  const base = { ...BLANK_INPUTS };

  it('never exceeds the cash you can bring, and says which limit set it', () => {
    const free = maxSafeBid(base);
    expect(free.limitedBy).toBe('profit');
    const tight = maxSafeBid({ ...base, cashAvailable: 100_000, buyerPremiumPct: 5 });
    expect(tight.limitedBy).toBe('cash');
    // The cash covers the bid and every cost until the sale, not just the bid.
    expect(tight.cashAtAuction).toBeLessThanOrEqual(100_000);
    expect(tight.cashToStabilize).toBeLessThanOrEqual(100_000);
    expect(cashNeededAtBid({ ...base, cashAvailable: 100_000, buyerPremiumPct: 5 }, tight.maxBid + 1)).toBeGreaterThan(100_000);
    expect(tight.profitBid).toBe(maxSafeBid({ ...base, buyerPremiumPct: 5 }).profitBid);
  });

  it('uses the larger of the profit % and the dollar minimum', () => {
    expect(requiredProfit({ ...base, targetProfitPct: 10, targetProfitMin: 0 })).toBe(40_000);
    expect(requiredProfit({ ...base, targetProfitPct: 10, targetProfitMin: 60_000 })).toBe(60_000);
    // Set as dollars: the dollar amount is the whole target, whatever the percent says.
    expect(requiredProfit({ ...base, targetProfitPct: 10, targetProfitMin: 25_000, profitInDollars: 1 })).toBe(25_000);
    const withMin = maxSafeBid({ ...base, targetProfitPct: 10, targetProfitMin: 60_000 });
    expect(profitAtBid({ ...base, targetProfitPct: 10, targetProfitMin: 60_000 }, withMin.maxBid)).toBeGreaterThanOrEqual(60_000 - 1);
  });

  it('counts the redemption wait in holding costs and in the yearly return', () => {
    const quick = maxSafeBid({ ...base, holdingMonths: 6 });
    const waiting = maxSafeBid({ ...base, holdingMonths: 6, redemptionMonths: 12 });
    expect(waiting.maxBid).toBeLessThan(quick.maxBid);
    expect(quick.yearlyReturn).not.toBeNull();
    // Same profit target spread over three times as long: a much lower return per year.
    expect(waiting.yearlyReturn!).toBeLessThan(quick.yearlyReturn! / 2);
  });

  it('estimates what a redemption repays: simple 1% a month, or 20% a year compounded daily', () => {
    const hoa = { ...base, redemptionMonths: 2, redemptionRatePct: 12, redemptionDaily: 0, monthlyCarry: 0, titleLegal: 0, transferTaxPer500: 0 };
    expect(redemptionOutcome(hoa, 100_000)!.repaid).toBeCloseTo(102_000, 0);
    const irs = { ...base, redemptionMonths: 6, redemptionRatePct: 20, redemptionDaily: 1 };
    const out = redemptionOutcome(irs, 100_000)!;
    expect(out.repaid).toBeGreaterThan(110_000); // compounding beats simple 20% x half a year
    expect(out.repaid).toBeLessThan(110_600);
    expect(redemptionOutcome(base, 100_000)).toBeNull(); // no redemption period
  });

  it('builds a 3 x 3 grid that falls as value drops and repairs rise', () => {
    const g = stressGrid(base);
    expect(g).toHaveLength(3);
    expect(g[1][0]).toBe(maxSafeBid(base).profitBid);
    expect(g[0][0]).toBeLessThan(g[1][0]);
    expect(g[1][2]).toBeLessThan(g[1][0]);
    expect(g[2][0]).toBeGreaterThan(g[1][0]);
  });

  it('matches the redemption presets to the rules', () => {
    expect(ruleOf({ ...base, ...{ redemptionMonths: 2, redemptionRatePct: 12, redemptionDaily: 0 } })).toBe('hoa');
    expect(ruleOf(base)).toBe('none');
    expect(REDEMPTION_RULES.irs.daily).toBe(1);
  });
});

describe('maximum bid as a subtraction', () => {
  it('resale value minus every line equals the maximum bid, to the dollar', () => {
    for (const i of [BLANK_INPUTS, { ...BLANK_INPUTS, buyerPremiumPct: 5, survivingLiens: 8_300, financedPct: 70, redemptionMonths: 2, redemptionRatePct: 12 }, { ...BLANK_INPUTS, cashAvailable: 90_000 }]) {
      const steps = maxBidSteps(i);
      expect(steps[0].label).toBe('Resale value after repairs');
      expect(steps.reduce((a, s) => a + s.amount, 0)).toBe(maxSafeBid(i).profitBid);
      // A profit a few dollars over the target (whole-dollar price) names the target beside it.
      const last = steps[steps.length - 1];
      if (-last.amount !== Math.round(requiredProfit(i))) expect(last.label).toMatch(/your target: \$[\d,]+/);
    }
  });

  it('the standalone calculator starts without made-up dollar amounts', () => {
    expect(START_INPUTS.exitValue).toBe(0);
    expect(START_INPUTS.repairs).toBe(0);
    expect(START_INPUTS.minimumBid).toBe(0);
  });

  it('property defaults start from the listing’s minimum bid', () => {
    const p = SAMPLE_PROPERTIES.find((x) => x.sale?.minimumBid);
    if (p) expect(defaultsFor(p).minimumBid).toBe(p.sale!.minimumBid);
  });
});

describe('cash before a loan funds', () => {
  it('counts transfer tax, title, possession and carrying through the redemption wait, not just the bid', () => {
    const i: BidInputs = { ...base, financedPct: 90, redemptionMonths: 12, titleLegal: 1_500, possession: 3_500, monthlyCarry: 600, exitValue: 400_000, cashAvailable: 150_000 };
    const c = costsAtBid(i, 150_000);
    const before = 150_000 + c.premium + c.transferTax + c.survivingLiens + 1_500 + 3_500 + 12 * 600;
    expect(cashNeededAtBid(i, 150_000)).toBeGreaterThanOrEqual(before);
  });
});

describe('an offer on a listed home', () => {
  it('needs only the down payment and costs at closing, not the whole price', async () => {
    const { offerInputs } = await import('./bidCalc');
    const i: BidInputs = offerInputs({ ...base, exitValue: 400_000, repairs: 40_000, financedPct: 80, titleLegal: 3_000 });
    const c = costsAtBid(i, 250_000);
    const need = cashNeededAtBid(i, 250_000);
    expect(need).toBeLessThan(250_000 * 0.5);
    expect(need).toBeCloseTo(Math.max(250_000 * 0.2 + c.transferTax + 3_000, c.total - c.selling - c.loan), 2);
  });
});

describe('your own price', () => {
  it('is kept with the saved numbers, and judged before the asking price', () => {
    const v = sanitizeInputs({ ...BLANK_INPUTS, minimumBid: 200_000, proposedPrice: 190_000 }, BLANK_INPUTS);
    expect(v.proposedPrice).toBe(190_000);
    expect(proposedPriceOf(v)).toEqual({ price: 190_000, source: 'yours' });
    expect(proposedPriceOf({ ...v, proposedPrice: 0 })).toEqual({ price: 200_000, source: 'listed' });
    expect(sanitizeInputs({ proposedPrice: -5 }, BLANK_INPUTS).proposedPrice).toBeUndefined();
    // Its result doesn't move the walk-away price.
    const a = resultAtPrice(v, 190_000), b = resultAtPrice(v, 200_000);
    expect(a.profit - b.profit).toBeGreaterThan(0);
    expect(b.cashPeak - a.cashPeak).toBeGreaterThan(0);
    expect(maxSafeBid(v).maxBid).toBe(maxSafeBid({ ...v, proposedPrice: 150_000 }).maxBid);
  });
});
