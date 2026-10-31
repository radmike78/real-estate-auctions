import { describe, expect, it } from 'vitest';
import { practiceConfig, resolveAnswers, NOT_SURE } from './narrow';

describe('Practice: not sure where to start', () => {
  it('starts an unsure beginner with Build your first deal', () => {
    const c = practiceConfig(true);
    const picks = c.result(resolveAnswers(c, { started: NOT_SURE, buy: NOT_SURE }));
    expect(picks[0].href).toBe('#/practice/deal');
    expect(picks.length).toBeLessThanOrEqual(3);
  });
  it('sends auction buyers outside Nevada to their sale guides, not Clark County practice', () => {
    const picks = practiceConfig(false).result({ started: 'yes', buy: 'auction' });
    expect(picks.map((p) => p.href ?? p.scrollTo)).toEqual(['#/playbooks', 'practice-drills']);
  });
  it('offers Nevada auction practice where it applies', () => {
    expect(practiceConfig(true).result({ started: 'yes', buy: 'auction' })[0].scrollTo).toBe('practice-auction');
  });
});
