import { beforeEach, describe, expect, it, vi } from 'vitest';

// Practice part 1 (Cedar House) finished, without answering every chapter here.
vi.mock('../practice/dealJourney', async (orig) => {
  const m = await orig<typeof import('../practice/dealJourney')>();
  return { ...m, loadJourney: () => ({ ...m.loadJourney(), completed: m.CHAPTERS.map((c) => c.id) }) };
});

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
  localStorage.setItem('deedowl.mode.v1', JSON.stringify('guided'));
  localStorage.setItem('deedowl.state.v1', 'NV');
});

describe('practice part 2 follows your route', () => {
  it('sends a lien buyer to lien practice, with the rental case optional', async () => {
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    const { planNow, guidedPracticeDone } = await import('./planNext');
    const p = planNow(new Date('2026-11-03T12:00:00Z'));
    expect(p.context).toBe('Step 3 · Practice part 2: Practice a lien purchase');
    expect(p.task.support.some((s) => s.href === '#/practice/case' && /^Optional/.test(s.label))).toBe(true);
    expect(guidedPracticeDone('certificate')).toBe(false);
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['c-practice']));
    expect(guidedPracticeDone('certificate')).toBe(true);
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).not.toMatch(/Practice part 2/);
  });

  it('sends an auction buyer to auction practice, and a listing buyer to the rental case', async () => {
    const { planNow } = await import('./planNext');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('auction'));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).toBe('Step 3 · Practice part 2: Finish a practice auction');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('listing'));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).toBe('Step 3 · Practice part 2: Buy a rental (the paperwork)');
  });

  it('counts a deal saved during lien or auction practice part 2 as practice', async () => {
    await import('./planNext');
    const { savingPractice } = await import('./analyze');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    expect(savingPractice()).toBe(true);
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('auction'));
    expect(savingPractice()).toBe(true);
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['a-practice']));
    expect(savingPractice()).toBe(false);
  });

  it('saves a Nevada or Arizona lien deal as a real deal when the lien route fell back to auctions', async () => {
    await import('./planNext');
    const { savingPractice } = await import('./analyze');
    localStorage.setItem('deedowl.state.v1', 'TX');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    expect(savingPractice()).toBe(true);
    expect(savingPractice({ kind: 'lien', state: 'AZ' })).toBe(false);
    expect(savingPractice({ kind: 'lien', state: 'NV' })).toBe(false);
    expect(savingPractice({ kind: 'trustee', state: 'TX' })).toBe(true);
  });

  it('keeps the lien route and finished lien practice after passing on an out-of-state lien deal', async () => {
    const { planNow, guidedPracticeDone, practiceState } = await import('./planNext');
    const { planPath } = await import('./roadmapState');
    localStorage.setItem('deedowl.state.v1', 'UT');
    const deal = { id: 'dz1', name: 'Clark SID parcel 1', state: 'NV', county: 'Clark', kind: 'lien', plan: 'lien', notes: '', done: [], stage: 'researching', updatedAt: '2026-11-01T00:00:00.000Z', locationConfirmed: true };
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([deal]));
    expect(planPath()).toBe('certificate');
    expect(practiceState()).toBe('NV');
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['c-practice']));
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([{ ...deal, stage: 'passed' }]));
    expect(planPath()).toBe('certificate');
    expect(practiceState()).toBe('NV');
    expect(guidedPracticeDone()).toBe(true);
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).not.toMatch(/Practice part 2/);
  });

  it('drops the lien deal’s route when you choose "None yet (learning)"', async () => {
    const { practiceState } = await import('./planNext');
    const { planPath, NO_DEAL } = await import('./roadmapState');
    localStorage.setItem('deedowl.state.v1', 'UT');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    const deal = { id: 'dz1', name: 'Clark SID parcel 1', state: 'NV', county: 'Clark', kind: 'lien', plan: 'lien', notes: '', done: [], stage: 'researching', updatedAt: '2026-11-01T00:00:00.000Z', locationConfirmed: true };
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([deal]));
    expect(planPath()).toBe('certificate');
    localStorage.setItem('deedowl.roadmap.deal.v1', JSON.stringify(NO_DEAL));
    expect(planPath()).toBe('auction');
    expect(practiceState()).toBe('UT');
  });
});
