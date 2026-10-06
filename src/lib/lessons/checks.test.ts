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

  it('never points anyone toward an owner', () => {
    const all = JSON.stringify(LESSON_CHECKS);
    expect(all).not.toMatch(/contact the owner|knock on the door|reach out to the owner/i);
  });
});
