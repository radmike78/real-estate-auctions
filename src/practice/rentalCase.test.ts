import { describe, expect, it } from 'vitest';
import { N, payment, RENTAL_CASE } from './rentalCase';
import { cleanCase } from './caseProgress';

describe('Buy a rental, start to finish', () => {
  it('keeps its numbers consistent from step to step', () => {
    expect(N.investable).toBe(142_000 - 31_200 - 8_000);
    expect(payment(216_750)).toBe(1406);
    expect(payment(210_000)).toBe(1362);
    expect(N.cashOffer).toBe(72_250 + 8_400 + 6 * (1406 + 142 + 90 + 45));
    expect(N.loanFinal).toBe(210_000);
    expect(N.cashToClose).toBe(280_000 - 210_000 + 8_400 - 3_000);
    expect(N.cashFlow).toBe(2150 - 3 * 108 - 142 - 90 - 45 - 1362);
    // The finished deal fits inside the cash you said you could invest.
    expect(N.cashFinal).toBeLessThanOrEqual(N.investable);
    expect(N.cashRenegotiated).toBeLessThanOrEqual(N.investable);
    // But paying for the repairs at the first price would leave almost nothing: that's the lesson of the inspection.
    expect(N.investable - N.cashOffer - N.urgent).toBeLessThan(2_000);
  });

  it('has unique ids, a reasonable answer to every decision, and right options in every multi-select', () => {
    const stages = new Set<string>();
    for (const st of RENTAL_CASE) {
      expect(stages.has(st.key), st.key).toBe(false);
      stages.add(st.key);
      const ids = st.tasks.map((t) => t.id);
      expect(new Set(ids).size, st.key).toBe(ids.length);
      expect(st.log.length, st.key).toBeGreaterThan(0);
      for (const t of st.tasks) {
        if (t.kind === 'choice') {
          expect(t.choices.some((c) => c.verdict === 'best' || c.verdict === 'ok'), t.id).toBe(true);
          for (const c of t.choices) if (c.walk) expect(c.verdict, t.id).not.toBe('poor');
        }
        if (t.kind === 'multi') expect(t.options.some((o) => o.right), t.id).toBe(true);
        if (t.kind === 'number') expect(t.worked.length, t.id).toBeGreaterThan(0);
      }
    }
  });

  it('names Nevada wherever it uses a Nevada rule', () => {
    for (const st of RENTAL_CASE)
      for (const t of st.tasks)
        if (t.kind === 'choice')
          for (const c of t.choices) if (/NRS /.test(c.why)) expect(`${t.prompt} ${c.why}`, t.id).toMatch(/Nevada/);
  });

  it('cleans stored progress', () => {
    expect(cleanCase(null)).toEqual({ done: [], answers: {}, first: {} });
    expect(cleanCase({ done: ['a/b', 5], answers: { x: 1, y: 'hi', z: [1, 2], bad: { a: 1 } }, first: { x: 'best', y: 'nope' }, walked: 'offer' })).toEqual({
      done: ['a/b'],
      answers: { x: 1, y: 'hi', z: [1, 2] },
      first: { x: 'best' },
      walked: 'offer',
    });
  });
});

describe('the deal packet', () => {
  it('reports a walk-away without claiming a purchase, and keeps what you found', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    const done = RENTAL_CASE.flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`));
    const walked = packetSections({ done, answers: {}, first: {}, walked: 'inspection' });
    const result = walked.find((s) => s.title === 'Result')!.rows.join(' ');
    expect(result).toMatch(/walked away/);
    expect(result).not.toMatch(/You bought it/);
    expect(walked.find((s) => s.title === 'Your budget')!.rows.join(' ')).not.toMatch(/Cash the deal took/);
    const log = walked.find((s) => s.title === 'Evidence log')!.rows.join(' ');
    expect(log).toMatch(/Sewer/);
    expect(log).not.toMatch(/^Price:|Renegotiated|Appraised at|mechanic/);
  });

  it('survives an out-of-range stored answer', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    expect(() => packetSections({ done: [], answers: { 'cash/stretch': 99, 'listing/screen': 1.5 }, first: {} })).not.toThrow();
  });
});

describe('the counteroffer path', () => {
  it('asks about the counter only after a lower offer, and logs the opening offer and the counter', async () => {
    const { tasksFor } = await import('./rentalCase');
    const { packetSections } = await import('../components/RentalCasePage');
    const offer = RENTAL_CASE.find((s) => s.key === 'offer')!;
    expect(tasksFor(offer, { 'offer/price': 0 }).some((t) => t.id === 'countered')).toBe(false);
    expect(tasksFor(offer, { 'offer/price': 1 }).some((t) => t.id === 'countered')).toBe(true);
    const done = RENTAL_CASE.slice(0, RENTAL_CASE.indexOf(offer) + 1).flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`));
    const packet = packetSections({ done, answers: { 'offer/price': 1, 'offer/countered': 0 }, first: {} });
    const log = packet.find((s) => s.title === 'Evidence log')!.rows.join(' ');
    expect(log).toMatch(/Opened at \$275,000/);
    expect(log).toMatch(/countered at \$289,000\. You accepted/);
  });

  it('a walk-away before the contract is signed claims no contract, deposit or deadlines', async () => {
    const { packetSections } = await import('../components/RentalCasePage');
    const offer = RENTAL_CASE.find((s) => s.key === 'offer')!;
    const done = RENTAL_CASE.slice(0, RENTAL_CASE.indexOf(offer)).flatMap((s) => s.tasks.map((t) => `${s.key}/${t.id}`)).concat(['offer/price', 'offer/signed', 'offer/countered']);
    const packet = packetSections({ done, answers: { 'offer/price': 1, 'offer/countered': 2 }, first: {}, walked: 'offer' });
    const all = packet.map((s) => s.rows.join(' ')).join(' ');
    expect(all).toMatch(/No contract was signed/);
    expect(all).not.toMatch(/Signed at|earnest money\./i);
    expect(packet.find((s) => s.title === 'Deadline calendar')!.rows[0]).toMatch(/^Not yet/);
  });

  it('the loan sheet never says the down payment is 25% of the lower value', () => {
    const loan = RENTAL_CASE.find((s) => s.key === 'loan')!;
    expect(JSON.stringify(loan)).not.toMatch(/25% of the price or the appraised value/);
  });
});

describe('walk-aways follow the answers', () => {
  it('finds the step whose showing answer walks away, and ignores hidden ones', async () => {
    const { walkedFrom } = await import('./rentalCase');
    expect(walkedFrom({ 'offer/price': 1, 'offer/countered': 2 })).toBe('offer');
    // Back to $289,000: the counteroffer (and its walk-away) is no longer showing.
    expect(walkedFrom({ 'offer/price': 0, 'offer/countered': 2 })).toBeUndefined();
  });

  it('asking for repairs leads to the seller’s price offer, not the price-cut reply', async () => {
    const { tasksFor } = await import('./rentalCase');
    const insp = RENTAL_CASE.find((s) => s.key === 'inspection')!;
    const ids = (a: number) => tasksFor(insp, { 'inspection/respond': a }).map((t) => t.id);
    expect(ids(0)).toContain('counter');
    expect(ids(0)).not.toContain('repairs-reply');
    expect(ids(2)).toContain('repairs-reply');
    expect(ids(2)).not.toContain('counter');
  });
});

describe('known replacements', () => {
  it('budgets the roof and water heater, and the cash flow reflects it', () => {
    expect(N.replaceMonthly).toBe(325);
    expect(N.cashFlowWithReplacements).toBe(N.cashFlow - (N.replaceMonthly - N.setAside));
  });
});
