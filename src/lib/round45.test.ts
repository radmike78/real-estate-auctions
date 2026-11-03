import { beforeEach, describe, expect, it } from 'vitest';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
  localStorage.setItem('deedowl.state.v1', 'NV');
});

describe('a cap-rate or return target', () => {
  it('counts an exact hit as met despite float rounding, and a hair under as a miss', async () => {
    const { capMisses } = await import('./holdCalc');
    expect(0.0725 * 100 < 7.25).toBe(true); // the float quirk this guards against
    expect(capMisses(0.0725, 7.25)).toBe(false);
    expect(capMisses(0.0724, 7.25)).toBe(true);
    expect(capMisses(0.08, 8)).toBe(false);
  });
});

describe('marking a step done from another page', () => {
  it('ticks it again after an untick, and clears its status', async () => {
    const { markStepDone, roadmapDone, creditStep } = await import('./roadmapState');
    creditStep('a-practice');
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify([]));
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({ 'a-practice': 'doing' }));
    creditStep('a-practice'); // once only: stays unticked
    expect(roadmapDone()).not.toContain('a-practice');
    markStepDone('a-practice');
    expect(roadmapDone()).toContain('a-practice');
    expect(JSON.parse(localStorage.getItem('deedowl.roadmap.status.v1')!)).not.toHaveProperty('a-practice');
  });
});

describe('steps ticked for you', () => {
  it('ticks investable cash only once the emergency fund is taken out, and the county step with a route', async () => {
    const { syncRoadmapCredits } = await import('./journey');
    const { roadmapDone } = await import('./roadmapState');
    localStorage.setItem('deedowl.cash.v1', JSON.stringify({ savings: 30000 }));
    syncRoadmapCredits();
    expect(roadmapDone()).not.toContain('money');
    localStorage.setItem('deedowl.cash.v1', JSON.stringify({ savings: 30000, spending: 3000, months: 3 }));
    localStorage.setItem('deedowl.area.v1', JSON.stringify({ state: 'NV', city: null, county: 'Washoe' }));
    syncRoadmapCredits();
    expect(roadmapDone()).toContain('money');
    expect(roadmapDone()).not.toContain('market');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    syncRoadmapCredits();
    expect(roadmapDone()).toContain('market');
  });
});
