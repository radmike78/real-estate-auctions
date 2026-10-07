import { describe, expect, it } from 'vitest';
import { LESSON_CHECKS } from './checks';
import { LEARN_MODULES } from '../learn';
import { lessonByKey } from './index';
import { showFor } from '../myState';
import { STATES } from '../regions';

describe('Check yourself', () => {
  it('every written lesson ends with at least three questions, and two or three for any one state', () => {
    for (const m of LEARN_MODULES) {
      if (!lessonByKey(m.key)) continue;
      const all = LESSON_CHECKS[m.key] ?? [];
      expect(all.length, m.key).toBeGreaterThanOrEqual(3);
      for (const st of STATES) {
        const n = all.filter((c) => showFor(st.code, `${c.q} ${c.options.join(' ')} ${c.why}`)).length;
        expect(n, `${m.key} ${st.code}`).toBeGreaterThanOrEqual(2);
        expect(n, `${m.key} ${st.code}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it('each question has three different options and one right answer', () => {
    for (const [key, checks] of Object.entries(LESSON_CHECKS)) {
      expect(lessonByKey(key), key).toBeTruthy();
      for (const c of checks) {
        expect(c.options.length, c.q).toBe(3);
        expect(new Set(c.options).size, c.q).toBe(3);
        expect(c.answer, c.q).toBeGreaterThanOrEqual(0);
        expect(c.answer, c.q).toBeLessThan(3);
        expect(c.why.length, c.q).toBeGreaterThan(20);
      }
    }
  });

  it('the rental example’s cash flow is NOI − loan payments − reserves, at both loan sizes it quotes', () => {
    // Standard amortizing payment, 7% for 30 years, paid monthly.
    const yearly = (loan: number) => { const i = 0.07 / 12; return (loan * i) / (1 - (1 + i) ** -360) * 12; };
    const noi = 28_800 - 1_440 - 9_000;
    expect(noi).toBe(18_360);
    expect(Math.round(yearly(240_000))).toBe(19_161);
    expect(Math.round(noi - yearly(240_000) - 1_400)).toBe(-2_201);
    expect(Math.round(yearly(150_000))).toBe(11_975);
    expect(Math.round(noi - yearly(150_000) - 1_400)).toBe(4_985);
    const text = JSON.stringify(lessonByKey('analyze')) + JSON.stringify(LESSON_CHECKS.analyze);
    expect(text).toMatch(/\$11,975 a year, so cash flow is about \+\$4,985/);
    // Cap rate vs interest rate alone doesn't decide cash flow; the loan's size and terms do.
    expect(text).not.toMatch(/can.t carry a \d/i);
  });

  it('never points anyone toward an owner', () => {
    const all = JSON.stringify(LESSON_CHECKS);
    expect(all).not.toMatch(/contact the owner|knock on the door|reach out to the owner/i);
  });
});
