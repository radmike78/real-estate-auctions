import { describe, expect, it } from 'vitest';
import { CASH_SHORT_AFTER, NO_PRICE_AFTER, settledWords } from './dealPacket';
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
});
