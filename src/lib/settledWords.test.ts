import { describe, expect, it } from 'vitest';
import { CASH_SHORT_AFTER, NO_PRICE_AFTER, cashShortAfter, defaultWords, noPriceAfter, owedWords, settledWords } from './dealPacket';
import { noRealisticAdvice } from './holdCalc';

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
    expect(settledWords('No realistic bid fits the cash you entered', 'owed')).toBe('No realistic price fits the cash you entered');
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
    expect(cashShortAfter('owed', { state: 'NV', kind: 'trustee' })).toBe(`${CASH_SHORT_AFTER.owed} ${defaultWords({ state: 'NV', kind: 'trustee' })}`);
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
});
