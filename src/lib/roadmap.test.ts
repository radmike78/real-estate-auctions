import { describe, expect, it } from 'vitest';
import { ROADMAP, roadmapFor } from './roadmap';

describe('roadmap routes', () => {
  it('gives lien buyers their own practice and research, with no rental tasks', () => {
    const lien = roadmapFor('certificate');
    const ids = lien.map((s) => s.id);
    expect(ids).toContain('c-practice');
    expect(ids).toContain('c-paper');
    expect(ids).not.toContain('practice');
    expect(ids).not.toContain('paper');
    for (const s of lien.filter((x) => x.phase >= 3)) expect(`${s.title} ${s.steps.join(' ')} ${s.doneWhen}`, s.id).not.toMatch(/rental|cash flow|tenant/i);
  });

  it('lets cash buyers finish the lender step with proof of funds', () => {
    const lender = ROADMAP.find((s) => s.id === 'lender')!;
    expect(lender.doneWhen).toMatch(/proof of funds/);
  });

  it('has unique ids, and a reason wherever a step can be marked “doesn’t apply”', () => {
    expect(new Set(ROADMAP.map((s) => s.id)).size).toBe(ROADMAP.length);
    expect(ROADMAP.find((s) => s.id === 'rent')!.skip).toBeTruthy();
    for (const s of ROADMAP) if (s.skip !== undefined) expect(s.skip.length, s.id).toBeGreaterThan(10);
  });
});
