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
