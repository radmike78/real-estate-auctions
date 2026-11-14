import { describe, expect, it } from 'vitest';
import { CASH_SHORT_AFTER, NO_PRICE_AFTER, cashShortAfter, defaultWords, noPriceAfter, owedWords, settledWords } from './dealPacket';
import { noRealisticAdvice } from './holdCalc';
import { nvLienDue, nvPastCutoff, taskHeadParts } from './dealStage';

describe('settledWords: pre-sale advice reworded once the price is agreed, won or paid', () => {
  it('leaves text alone before a price is fixed', () => {
    expect(settledWords('No bid fits. Walk away or change your plan.', null)).toBe('No bid fits. Walk away or change your plan.');
  });
  it('replaces every no-realistic-price advice with the stage advice', () => {
    for (const [offer, loan] of [[true, true], [true, false], [false, true], [false, false]] as const) {
      expect(settledWords(noRealisticAdvice(offer, loan), 'owed')).toBe(CASH_SHORT_AFTER.owed);
      expect(settledWords(noRealisticAdvice(offer, loan), 'agreed')).toBe(CASH_SHORT_AFTER.agreed);
    }
  });
  it('rewords walking away, skipping and bid names', () => {
    expect(settledWords('Even at $0 it loses. Walk away or change your plan.', 'paid')).toBe(`Even at $0 it loses. ${NO_PRICE_AFTER.paid}`);
    expect(settledWords('Check the rent and costs, or skip this one.', 'owed')).toBe('Check the rent and costs.');
    expect(settledWords('No realistic bid fits the cash you entered', 'owed')).toBe('Your cash is short');
    expect(settledWords('No offer works', 'agreed')).toBe('No price works');
  });
  it('names the walk-away price as what the plan could have paid after a win or purchase, not under contract', () => {
    expect(settledWords('profit $5 at $330,000; walk-away price $109,639', 'owed')).toBe('profit $5 at $330,000; the most this plan could have paid, $109,639');
    expect(settledWords('What-if, at your walk-away price of $126,054 (the most you could have paid, not your price): $126,054', 'paid')).toBe('What-if, at the most this plan could have paid ($126,054, not your price): $126,054');
    expect(settledWords('Walk-away price, set by the cash you can bring: $2', 'owed')).toBe('The most this plan could have paid, set by the cash you can bring: $2');
    expect(settledWords('walk-away price $5', 'agreed')).toBe('walk-away price $5');
  });
  it('says what a Nevada winner who does not pay faces, by kind of sale, and nothing elsewhere', () => {
    expect(defaultWords({ state: 'NV', kind: 'trustee' })).toMatch(/NRS 107\.083/);
    expect(defaultWords({ state: 'NV', kind: 'court' })).toMatch(/NRS 21\.160/);
    expect(defaultWords({ state: 'NV', kind: 'irs' })).toMatch(/6335\(e\)\(3\)/);
    expect(defaultWords({ state: 'CA', kind: 'trustee' })).toBe('');
    expect(cashShortAfter('owed', { state: 'NV', kind: 'trustee' })).toBe(`${CASH_SHORT_AFTER.owed.replace('the official seller', 'the trustee')} ${defaultWords({ state: 'NV', kind: 'trustee' })}`);
    expect(cashShortAfter('paid', { state: 'NV', kind: 'trustee' })).toBe(CASH_SHORT_AFTER.paid);
  });
  it('leads with the bid when the bid alone is more than the cash', () => {
    expect(owedWords(150000, 50000, 'the cash you entered')).toMatch(/^Your winning bid of \$150,000 alone is \$100,000 more than the cash you entered\./);
    expect(owedWords(40000, 50000, 'the cash you entered')).toBe(CASH_SHORT_AFTER.owed);
  });
  it('keeps renting or selling until the deed is yours, and reminds an unpaid winner the bid is still due', () => {
    expect(noPriceAfter('paid', { noDeed: true })).toMatch(/Until the redemption period ends and the deed is yours/);
    expect(noPriceAfter('owed', {})).toMatch(/^If you haven’t paid the bid yet, it’s still due/);
    expect(noPriceAfter('agreed', { noDeed: true })).toBe(NO_PRICE_AFTER.agreed);
  });
  it('says the payment and penalty once: quiet where the result at your price already does', () => {
    expect(noPriceAfter('owed', { state: 'NV', kind: 'court', quiet: true })).not.toMatch(/still due|NRS 21\.160/);
    expect(noPriceAfter('owed', { state: 'NV', kind: 'court' })).toMatch(/still due by the sale’s payment deadline\. A winner who doesn’t pay can be held liable for any loss when the property is sold again \(NRS 21\.160\)\. Check/);
    expect(settledWords('What-if: walk-away price $5, the most you could have paid and still meet our example target', 'paid')).toBe('What-if: the most this plan could have paid, $5, which would still have met our example target');
    expect(defaultWords({ state: 'NV', kind: 'taxSale', county: 'Eureka' })).not.toMatch(/deposit/);
  });
  it('times the Nevada SID 10 a.m. cutoff in Nevada time, wherever the reader is', () => {
    expect(nvPastCutoff(new Date('2026-11-13T17:30:00Z'))).toBe(false); // 9:30 a.m. in Nevada (11:30 a.m. in New York)
    expect(nvPastCutoff(new Date('2026-11-13T18:30:00Z'))).toBe(true); // 10:30 a.m. in Nevada
  });
  it('works out a Nevada SID payment date from the sale day when none was typed', () => {
    const p = { dates: [{ what: 'Sale day', when: '2026-11-19', who: '' }] } as unknown as Parameters<typeof nvLienDue>[1];
    expect(nvLienDue({ kind: 'lien', state: 'NV', county: 'Washoe' }, p)).toBe('2026-11-20'); // the day after (NRS 271.560)
    expect(nvLienDue({ kind: 'lien', state: 'NV', county: 'Clark' }, p)).toBe('2026-11-23'); // Thursday sale: Clark's office reopens Monday
    expect(nvLienDue({ kind: 'lien', state: 'AZ', county: 'Maricopa' }, p)).toBe('');
  });
});

describe('taskHeadParts', () => {
  it('keeps short tasks whole', () => {
    expect(taskHeadParts('Pay for Pine St lot as the sale requires', 'Pine St lot')).toEqual(['Pay for Pine St lot as the sale requires', '']);
  });
  it('splits a long question after its first sentence, not at a.m.', () => {
    const l = 'Did you pay for Pine St. lot? Its payment deadline was likely today at 10 a.m. Nevada time* (the day after the sale). If the sale ran into a later day, your deadline is later: change the Sale day first. If you paid, mark it handled.';
    expect(taskHeadParts(l, 'Pine St. lot')).toEqual(['Did you pay for Pine St. lot?', l.slice('Did you pay for Pine St. lot? '.length)]);
    const t = 'Pay for Lot 7 before 10 a.m. Nevada time today* (the next business day the office is open; later if the sale ran into a later day) if you were the winner. If you were an alternate, don’t pay yet: wait for the call.';
    expect(taskHeadParts(t, 'Lot 7')[0]).toMatch(/if you were the winner\.$/);
  });
});
