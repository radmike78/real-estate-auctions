import { describe, expect, it } from 'vitest';
import { LESSON_CHECKS } from './checks';
import { LEARN_MODULES } from '../learn';
import { lessonByKey } from './index';

describe('Check yourself', () => {
  it('every written lesson ends with three questions', () => {
    for (const m of LEARN_MODULES) if (lessonByKey(m.key)) expect(LESSON_CHECKS[m.key]?.length, m.key).toBe(3);
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
