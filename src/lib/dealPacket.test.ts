import { beforeEach, describe, expect, it } from 'vitest';
import type { Deal } from './analyze';
import { cleanPacket, dealPacketText, EMPTY_PACKET, flipBudget, loadPacket, nextAction, nextDate, packetSections, savePacket, suggestedDates, dateGuide } from './dealPacket';
import { saveLog, cleanLog } from './evidence';
import { stageTasks } from './dealStage';
import { dealNumbers } from './propertyPacket';
import { cashNeededAtBid, offerInputs, profitAtBid, sanitizeInputs, BLANK_INPUTS } from './bidCalc';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const deal: Deal = { id: 'd1', name: '12 Test St', state: 'TX', county: 'Travis', kind: 'listing', plan: 'rent', notes: '', done: [], updatedAt: '2026-10-06T00:00:00Z' };
const now = new Date('2026-10-06T15:00:00Z');

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
});

describe('the deal packet', () => {
  it('cleans stored packets so bad data can’t break the page', () => {
    expect(cleanPacket(null)).toEqual(EMPTY_PACKET);
    const p = cleanPacket({ fit: 'maybe', dates: [{ when: 'soon', what: 'x'.repeat(500) }], earnest: -5, qa: 'nope' });
    expect(p.fit).toBe('');
    expect(p.dates[0].when).toBe('');
    expect(p.dates[0].what.length).toBe(200);
    expect(p.earnest).toBe(0);
    expect(p.qa).toEqual([]);
  });

  it('suggests the dates each kind of sale needs, in the state’s words', () => {
    expect(suggestedDates({ kind: 'listing', state: 'TX' }).join(' ')).toMatch(/Option period ends/);
    expect(suggestedDates({ kind: 'listing', state: 'NV' }).join(' ')).toMatch(/Inspection period ends/);
    expect(suggestedDates({ kind: 'taxSale', state: 'TX' })).toContain('Redemption period ends');
    expect(suggestedDates({ kind: 'court', state: 'TX' })).not.toContain('Redemption period ends');
    // Owners can't redeem after a tax sale in Nevada, California, Utah or Arizona.
    for (const state of ['NV', 'CA', 'UT', 'AZ'] as const) expect(suggestedDates({ kind: 'taxSale', state })).not.toContain('Redemption period ends');
    expect(suggestedDates({ kind: 'short', state: 'TX' }).join(' ')).toMatch(/approval/i);
  });

  it('lists the Texas contract deadlines from the TREC forms, with short sales counted from the Amended Effective Date', () => {
    const find = (kind: Deal['kind'], re: RegExp) => dateGuide({ kind, state: 'TX' }).find((g) => re.test(g.what));
    for (const kind of ['listing', 'reo', 'short'] as const) {
      // Seller's Disclosure Notice (20-19, 7B(2)), HOA subdivision information (36-11, A) and title objections (20-19, 6D).
      expect(find(kind, /Seller’s Disclosure Notice due \(only if box 7B\(2\) is checked\)/)?.why).toMatch(/7B/);
      expect(find(kind, /HOA subdivision information due \(only with the HOA addendum\)/)?.when).toMatch(/3 days after you receive it/);
      expect(find(kind, /^Title objections due$/)?.missed).toMatch(/Schedule C/);
      expect(find(kind, /^Buyer Approval deadline \(only if paragraph 2A’s “subject to Buyer Approval” box is checked\)$/)).toBeTruthy();
      expect(find(kind, /^Property Approval deadline \(only with the financing addendum\)$/)).toBeTruthy();
    }
    // A lender reselling a home it took back is exempt from the disclosure notice (Property Code 5.008(e)(4)).
    expect(find('reo', /Seller’s Disclosure Notice/)?.when).toMatch(/5\.008\(e\)\(4\)/);
    // Short sale: the option period starts at signing and its end is unsettled; performance counts from the Amended Effective Date.
    expect(find('short', /Option period ends/)?.when).toMatch(/Starts when you both sign.*Amended Effective Date\*/);
    for (const re of [/Water Disclosure/, /Buyer Approval/, /Seller’s Disclosure Notice/, /HOA subdivision/]) {
      expect(find('short', re)?.when).toMatch(/after the Amended Effective Date \(the day the seller tells you of the lender’s approval, 45-2, D\)/);
      expect(find('listing', re)?.when).toMatch(/after the effective date/);
      expect(find('listing', re)?.when).not.toMatch(/Amended/);
    }
    expect(find('listing', /Option period ends/)?.when).toMatch(/after the effective date/);
    // Earnest money and option fee stay due from signing under the short sale addendum (45-2, C).
    expect(find('short', /Earnest money due/)?.when).toMatch(/Within 3 days after the effective date/);
    expect(find('short', /Option fee due/)).toBeTruthy();
    // Other states keep the plain list.
    expect(suggestedDates({ kind: 'short', state: 'NV' })).not.toContain('Title objections due');
  });

  it('marks every part missing on a new deal and points to one next action', () => {
    const secs = packetSections(deal, EMPTY_PACKET, now);
    expect(secs.map((s) => s.key)).toEqual(['plan', 'property', 'dates', 'cash', 'numbers', 'evidence', 'pros', 'decision']);
    expect(secs.every((s) => s.status === 'missing')).toBe(true);
    expect(nextAction(deal, EMPTY_PACKET, now).text).toMatch(/Keep and rent/);
  });

  it('puts a deadline within a week ahead of everything else', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-09', what: 'Option period ends (5 p.m.)', who: 'Me and my agent' }, { when: '2026-10-01', what: 'Offer accepted', who: '' }] };
    expect(nextDate(p, now)?.days).toBe(3);
    expect(nextAction(deal, p, now).text).toBe('In 3 days: Option period ends (5 p.m.). Who: Me and my agent.');
    const secs = packetSections(deal, p, now);
    expect(secs.find((s) => s.key === 'dates')?.status).toBe('done');
  });

  it('follows the evidence log and professionals’ answers', () => {
    const log = cleanLog({ rows: { title: { open: 'Does the 2023 roofing lien survive?', owner: 'Title company, Friday' } } });
    saveLog('analyzed:d1', log);
    expect(nextAction(deal, EMPTY_PACKET, now).text).toBe('Get an answer to: Does the 2023 roofing lien survive? (Title company, Friday).');
    const p = { ...EMPTY_PACKET, qa: [{ role: 'title', q: 'Will you insure it?', a: '', on: '' }] };
    expect(packetSections(deal, p, now).find((s) => s.key === 'pros')?.status).toBe('started');
  });

  it('saves per deal and prints every part', () => {
    savePacket('analyzed:d1', { ...EMPTY_PACKET, fit: 'more', fitWhy: 'rent unproven', earnest: 3000 });
    const p = loadPacket('analyzed:d1');
    expect(p.fit).toBe('more');
    const text = dealPacketText(deal, p, now);
    expect(text).toMatch(/^DEAL PACKET: 12 Test St/);
    expect(text).toMatch(/NEXT ACTION:/);
    expect(text).toMatch(/Need more evidence, because rent unproven/);
    expect(text).toMatch(/\$3,000 earnest money/);
  });

  it('shows only the numbers of the strategy the deal is saved with, never another calculator’s leftovers', () => {
    // A Fix and sell result left over from before the deal switched to Keep and rent, plus the current rental.
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000 }));
    localStorage.setItem('fsf.calc.rent.d1-offer.v1', JSON.stringify({ value: 300000, atPrice: 300000, monthlyRent: 2200 }));
    const rentDeal = { ...deal, plan: 'rent' as const };
    const text = packetSections(rentDeal, EMPTY_PACKET, now).map((x) => x.lines.join('\n')).join('\n');
    expect(text).toMatch(/Strategy: Keep and rent/);
    expect(text).toMatch(/Your offer \(your actual price\): \$300,000 → monthly cash flow/);
    expect(text).not.toMatch(/Walk-away price|\$250,000 resale/);
    const flip = packetSections({ ...deal, plan: 'flip' }, EMPTY_PACKET, now).map((x) => x.lines.join('\n')).join('\n');
    expect(flip).toMatch(/Strategy: Fix and sell/);
    expect(flip).toMatch(/What-if: walk-away price .*\$250,000 resale value/);
    expect(flip).not.toMatch(/Monthly cash flow/);
    expect(dealNumbers({ ...deal, plan: 'flip' })).toBeNull();
    expect(dealNumbers(rentDeal)?.price).toBe(300000);
  });

  it('shows a downside for Fix and sell and Commercial, and counts the numbers done only with one', () => {
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000 }));
    const flip = packetSections({ ...deal, plan: 'flip' }, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!;
    const flipText = flip.lines.join('\n');
    expect(flipText).toMatch(/If resale value 10% lower: (walk-away price \$[\d,]+|no price works)/);
    expect(flipText).toMatch(/If repairs 25% higher:/);
    expect(flipText).toMatch(/If takes 3 months longer:/);
    expect(flipText).toMatch(/If all three at once:/);
    expect(flip.status).toBe('done');
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 10000 }));
    const com = packetSections({ ...deal, plan: 'commercial' }, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!;
    expect(com.lines.join('\n')).toMatch(/If rent 10% lower: (highest price \$[\d,]+|no price works)/);
    expect(com.status).toBe('done');
    // Income too low for any price to meet the return: a result, not "No numbers yet".
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 500, repairs: 400000 }));
    const none = packetSections({ ...deal, plan: 'commercial' }, EMPTY_PACKET, now);
    const noneText = none.find((s) => s.key === 'numbers')!.lines.join('\n');
    expect(noneText).toMatch(/No price meets your 9% return on cost with the income and costs you entered/);
    expect(noneText).not.toMatch(/No numbers yet/);
    expect(none.find((s) => s.key === 'cash')!.lines.join('\n')).toMatch(/No price meets your 9% return on cost/);
  });

  it('counts loan interest and points in a financed flip’s budget, at your saved price', () => {
    const flip: Deal = { ...deal, kind: 'trustee', plan: 'flip' };
    const inputs = { minimumBid: 150000, exitValue: 300000, repairs: 40000, contingencyPct: 10, holdingMonths: 6, monthlyCarry: 500, financedPct: 70, interestRatePct: 11, pointsPct: 2 };
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify(inputs));
    const b = flipBudget(flip)!;
    // 70% of the $150,000 opening bid plus $44,000 repairs = $135,800 loan; 11% for 6 months plus 2 points.
    expect(b.price).toBe(150000);
    expect(b.financing).toBeCloseTo(135800 * (0.11 * 0.5 + 0.02), 0);
    expect(b.total).toBeCloseTo(44000 + 3000 + b.financing, 0);
    // Your own bid replaces the opening bid.
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ ...inputs, proposedPrice: 200000 }));
    expect(flipBudget(flip)!.price).toBe(200000);
    expect(flipBudget(flip)!.financing).toBeCloseTo((200000 + 44000) * 0.7 * 0.075, 0);
  });

  it('words a commercial walk-away price by what sets it: return, cash or the lender’s coverage', () => {
    const auction: Deal = { ...deal, kind: 'trustee', plan: 'commercial' };
    const numbers = () => packetSections(auction, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!.lines.join('\n');
    // Cash binds before the 9% target does.
    localStorage.setItem('fsf.calc.commercial.d1.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 9, cashAvailable: 100000 }));
    let t = numbers();
    expect(t).toMatch(/Walk-away price, set by the cash you can bring: \$[\d,]+ \(return on cost at that price: [\d.]+%\)/);
    expect(t).not.toMatch(/Highest price for a 9% return/);
    expect(t).toMatch(/If rent 10% lower: still \$[\d,]+, set by the cash you can bring/);
    // No target, but cash caps the price: never "a 0% return".
    localStorage.setItem('fsf.calc.commercial.d1.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 0, cashAvailable: 300000 }));
    t = numbers();
    expect(t).not.toMatch(/0% return on cost:/);
    expect(t).toMatch(/set by the cash you can bring/);
    // A purchase loan with no target: the lender’s minimum coverage sets it.
    const offer: Deal = { ...deal, plan: 'commercial' };
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 0, loanPct: 70, value: 900000 }));
    t = packetSections(offer, EMPTY_PACKET, now).find((s) => s.key === 'numbers')!.lines.join('\n');
    expect(t).toMatch(/Walk-away price, set by the lender’s minimum coverage \(DSCR\): \$[\d,]+/);
    expect(t).toMatch(/If rent 10% lower: walk-away price, set by the lender’s minimum coverage/);
    // The target return sets it: the usual wording.
    localStorage.setItem('fsf.calc.commercial.d1.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 9 }));
    expect(numbers()).toMatch(/Highest price for a 9% return on cost: \$[\d,]+/);
  });

  it('flags a commercial price over $1 billion as a likely typo, not a missing target', () => {
    const offer: Deal = { ...deal, plan: 'commercial' };
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 1e9, targetCapPct: 9 }));
    const s = packetSections(offer, EMPTY_PACKET, now);
    for (const k of ['cash', 'numbers']) {
      const t = s.find((x) => x.key === k)!.lines.join('\n');
      expect(t).toMatch(/The price is over \$1 billion with the rent and costs you entered in Commercial income: check them for a typo\./);
      expect(t).not.toMatch(/No target return entered/);
    }
    localStorage.setItem('fsf.calc.commercial.d1-offer.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 0 }));
    expect(packetSections(offer, EMPTY_PACKET, now).find((x) => x.key === 'numbers')!.lines.join('\n')).toMatch(/No target return entered/);
  });

  it('gives a flip its repair and holding budget from Fix and sell, for the owned tracker', () => {
    const flip: Deal = { ...deal, kind: 'trustee', plan: 'flip' };
    expect(flipBudget(flip)).toBeNull();
    localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000, contingencyPct: 15, holdingMonths: 4, monthlyCarry: 500 }));
    expect(flipBudget(flip)).toEqual({ repairs: 23000, monthly: 500, months: 4, holding: 2000, financing: 0, price: 0, total: 25000 });
    expect(flipBudget({ ...flip, plan: 'rent' })).toBeNull();
    const closed = (b: boolean) => stageTasks(flip, 'closed', EMPTY_PACKET, now).find((t) => t.key === 'owned')!.produces.includes(b ? 'against the budget in your Fix and sell numbers' : 'compare yourself');
    expect(closed(true)).toBe(true);
    localStorage.removeItem('fsf.bid.analyzed-d1.v1');
    expect(closed(false)).toBe(true);
  });

  it('asks for a target return when Commercial income has none, instead of saying no price works', () => {
    localStorage.setItem('fsf.calc.commercial.d1.v1', JSON.stringify({ monthlyRent: 10000, targetCapPct: 0 }));
    const auction: Deal = { ...deal, kind: 'trustee', plan: 'commercial' };
    const secs = packetSections(auction, EMPTY_PACKET, now);
    const cash = secs.find((s) => s.key === 'cash')!;
    const nums = secs.find((s) => s.key === 'numbers')!;
    const all = [...cash.lines, ...nums.lines].join('\n');
    expect(all).toMatch(/No target return entered in Commercial income: enter the cap rate you require to get a walk-away price\./);
    expect(all).not.toMatch(/No price meets|0% return on cost|Rent 10% lower|rent 10% lower|Infinity|NaN/);
    // Nothing to count yet: the numbers aren't saved and the deal still asks you to run the calculator.
    expect(nums.status).toBe('missing');
    expect(cash.status).toBe('missing');
    expect(cash.fix?.href).toBe('#/analyze');
    expect(stageTasks(auction, 'researching', EMPTY_PACKET, now).find((t) => t.key === 'numbers')?.done).toBe(false);
  });

  describe('Fix and sell: your own price first, the walk-away price as a what-if', () => {
    // The reviewer's case: a regular listing in Harris County, Texas.
    const harris: Deal = { ...deal, county: 'Harris', plan: 'flip' };
    const base = { minimumBid: 200000, exitValue: 300000, repairs: 20000, contingencyPct: 15, transferTaxPer500: 0, titleLegal: 0, possession: 0, holdingMonths: 0, monthlyCarry: 0, financedPct: 0, sellingCostPct: 8, targetProfitPct: 15 };
    const save = (v: object) => localStorage.setItem('fsf.bid.analyzed-d1.v1', JSON.stringify(v));
    const section = (key: string) => packetSections(harris, EMPTY_PACKET, now).find((s) => s.key === key)!.lines.join('\n');

    it('shows the profit and cash at the asking price, and labels the walk-away figures as a separate what-if', () => {
      save(base);
      const cash = section('cash');
      const nums = section('numbers');
      expect(nums).toMatch(/The asking price \(used until you enter your own offer\): \$200,000 → estimated profit \$53,000 \(your target \$45,000\)/);
      expect(nums).toMatch(/What-if: walk-away price \$208,000, the most you could pay/);
      expect(cash).toMatch(/Estimated cash you’ll put in, at the asking price of \$200,000, under these assumptions \(through repairs and holding until it sells\): \$223,000/);
      expect(cash).toMatch(/What-if, at your walk-away price of \$208,000 \(the most you could pay, not your price\): estimated cash you’d put in \$231,000/);
      // Your price comes first in both parts.
      expect(cash.indexOf('$223,000')).toBeLessThan(cash.indexOf('$231,000'));
      expect(nums.indexOf('$53,000')).toBeLessThan(nums.indexOf('$208,000'));
      // The download says the same.
      const text = dealPacketText(harris, EMPTY_PACKET, now);
      expect(text).toContain('at the asking price of $200,000, under these assumptions (through repairs and holding until it sells): $223,000');
      expect(cash).not.toMatch(/draws/);
      expect(text).toContain('$200,000 → estimated profit $53,000');
      expect(text).toContain('walk-away price of $208,000 (the most you could pay, not your price): estimated cash you’d put in $231,000');
    });

    it('warns about repair draws once, when a loan pays part of the deal', () => {
      save({ ...base, financedPct: 80 });
      const cash = section('cash');
      expect(cash.match(/through draws after work is done/g)).toHaveLength(1);
    });

    it('moves the profit and cash with your own offer, while the walk-away price stays', () => {
      save({ ...base, proposedPrice: 190000 });
      const nums = section('numbers');
      const cash = section('cash');
      expect(nums).toMatch(/Your offer \(your actual price\): \$190,000 → estimated profit \$63,000/);
      expect(nums).toMatch(/walk-away price \$208,000/);
      expect(cash).toMatch(/at your offer of \$190,000, under these assumptions \(through repairs and holding until it sells\): \$213,000/);
      expect(cash).toMatch(/walk-away price of \$208,000 .*\$231,000/);
      expect(dealPacketText(harris, EMPTY_PACKET, now)).toContain('$190,000 → estimated profit $63,000');
    });

    it('shows each downside case at your own price, next to its walk-away price', () => {
      save(base);
      const nums = section('numbers');
      // Resale 10% lower: $270,000 − $200,000 − $23,000 repairs − $21,600 selling = $25,400.
      expect(nums).toMatch(/If resale value 10% lower: profit \$25,400 at \$200,000; walk-away price \$184,900/);
      // Repairs 25% higher: $28,750 with the cushion, so $300,000 − $200,000 − $28,750 − $24,000 = $47,250.
      expect(nums).toMatch(/If repairs 25% higher: profit \$47,250 at \$200,000; walk-away price \$202,250/);
      expect(nums).toMatch(/If all three at once: profit \$[\d,]+ at \$200,000; walk-away price \$179,150/);
    });

    it('counts financing and holding costs at your own price', () => {
      const v = { ...base, holdingMonths: 6, monthlyCarry: 1000, financedPct: 80, interestRatePct: 10, pointsPct: 2, proposedPrice: 195000 };
      save(v);
      const i = offerInputs(sanitizeInputs(v, BLANK_INPUTS));
      // A listed home: the loan pays 80% of the price at closing; you bring the rest, then repairs, holding and loan costs.
      const loan = (195000 + 23000) * 0.8;
      const loanCost = loan * (0.1 * 0.5 + 0.02);
      const profit = 300000 - 195000 - 23000 - 6000 - loanCost - 24000;
      expect(profitAtBid(i, 195000)).toBeCloseTo(profit, 2);
      const cashAt = cashNeededAtBid(i, 195000);
      expect(cashAt).toBeCloseTo(195000 + 23000 + 6000 + loanCost - loan, 2);
      const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
      expect(section('numbers')).toContain(`$195,000 → estimated profit ${money(profit)}`);
      expect(section('cash')).toContain(`at your offer of $195,000, under these assumptions (through repairs and holding until it sells): ${money(cashAt)}`);
      // Changing only your price leaves the walk-away price where it was.
      const walk = section('numbers').match(/walk-away price (\$[\d,]+), the most/)![1];
      save({ ...v, proposedPrice: 180000 });
      expect(section('numbers')).toContain(`walk-away price ${walk}, the most`);
      expect(section('numbers')).toContain(`$180,000 → estimated profit ${money(profitAtBid(i, 180000))}`);
      expect(section('cash')).toContain(`${money(cashNeededAtBid(i, 180000))}`);
    });

    it('at an auction, shows sale-day cash at the opening bid, not the walk-away price', () => {
      const auction: Deal = { ...harris, kind: 'trustee' };
      save({ ...base, minimumBid: 150000 });
      const cash = packetSections(auction, EMPTY_PACKET, now).find((s) => s.key === 'cash')!.lines.join('\n');
      expect(cash).toMatch(/On sale day, at the opening bid of \$150,000: \$150,000/);
      expect(cash).toMatch(/What-if, at your walk-away price of \$208,000 .*: \$208,000 on sale day/);
    });
  });
});
