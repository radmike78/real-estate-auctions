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

  it('follows Decide’s top strategy for the route until one is picked', async () => {
    const { planNow } = await import('./planNext');
    const { planPath } = await import('./roadmapState');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { ready: 'ready', goal: 'income', cash: '10to50', borrow: 'cash', time: 'parttime', hands: 'diy', risk: 'high', market: 'com' } }));
    expect(planPath()).toBe('auction');
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).toBe('Step 3 · Practice part 2: Finish a practice auction');
    // "None yet (learning)" keeps it.
    localStorage.setItem('deedowl.roadmap.deal.v1', JSON.stringify('none'));
    expect(planPath()).toBe('auction');
    // A route you pick wins.
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('listing'));
    expect(planPath()).toBe('listing');
  });

  it('follows a saved property’s route over Decide’s pick once it leads, and Decide’s pick while it waits or with none', async () => {
    const { planPath } = await import('./roadmapState');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { ready: 'ready', goal: 'income', cash: '10to50', borrow: 'cash', time: 'parttime', hands: 'diy', risk: 'high', market: 'com' } }));
    expect(planPath()).toBe('auction');
    const listing = { id: 'dl1', name: '12 Elm St', state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent', notes: '', done: [], stage: 'researching', updatedAt: '2026-11-01T00:00:00.000Z', locationConfirmed: true };
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([listing]));
    // A guided learner's listing waits (My plan: "None yet (learning)"): Decide's pick holds until practice part 2.
    expect(planPath()).toBe('auction');
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['a-practice']));
    expect(planPath()).toBe('listing');
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify([]));
    // "Doesn't apply" settles it too, for the route and for My plan alike.
    const { guidedPracticeDone } = await import('./planNext');
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({ 'a-practice': 'na' }));
    expect(planPath()).toBe('listing');
    expect(guidedPracticeDone('auction')).toBe(true);
    // Marked for the auction route only: it doesn't settle the agent route's practice.
    expect(guidedPracticeDone('listing')).toBe(false);
    // My plan agrees: the property leads (not "waits while you finish practice").
    const { planNow: pn } = await import('./planNext');
    expect(pn(new Date('2026-11-03T12:00:00Z')).source).toBe('deal');
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({}));
    expect(guidedPracticeDone('auction')).toBe(false);
    // Self-directed: the property leads at once.
    localStorage.setItem('deedowl.mode.v1', JSON.stringify('explore'));
    expect(planPath()).toBe('listing');
    localStorage.setItem('deedowl.mode.v1', JSON.stringify('guided'));
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([{ ...listing, kind: 'lien', plan: 'lien' }]));
    expect(planPath()).toBe('certificate');
    // "None yet (learning)": Decide's pick again.
    localStorage.setItem('deedowl.roadmap.deal.v1', JSON.stringify('none'));
    expect(planPath()).toBe('auction');
  });

  it('tracks where Analyze’s State field moved you from, until you’re elsewhere', async () => {
    const { noteStateMove, movedFrom } = await import('./analyze');
    const { setMyState } = await import('./myState');
    setMyState('CA');
    noteStateMove('CA', 'NV'); setMyState('NV');
    expect(movedFrom()).toBe('CA');
    noteStateMove('NV', 'AZ'); setMyState('AZ');
    expect(movedFrom()).toBe('CA');
    // Changed in the header: the move is over (for good, even back in Arizona), and a new one starts from there.
    setMyState('TX');
    expect(movedFrom()).toBeNull();
    setMyState('AZ');
    expect(movedFrom()).toBeNull();
    setMyState('TX');
    noteStateMove('TX', 'NV'); setMyState('NV');
    expect(movedFrom()).toBe('TX');
    // Back home through the State field.
    noteStateMove('NV', 'TX'); setMyState('TX');
    expect(movedFrom()).toBeNull();
  });

  it('counts the rental purchase step marked done in My plan as practice part 2 done', async () => {
    const { planNow } = await import('./planNext');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('listing'));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).toBe('Step 3 · Practice part 2: Buy a rental (the paperwork)');
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['practice']));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).context).not.toMatch(/Practice part 2/);
  });

  it('lets a lien-route reader in a state without lien sales mark the auction practice "doesn’t apply"', async () => {
    const { planNow } = await import('./planNext');
    localStorage.setItem('deedowl.state.v1', 'CA');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('certificate'));
    const listing = { id: 'dl1', name: '9 Oak Ave', state: 'CA', county: 'Kern', kind: 'listing', plan: 'rent', notes: '', done: [], stage: 'researching', updatedAt: '2026-11-01T00:00:00.000Z', locationConfirmed: true };
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([listing]));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).source).not.toBe('deal');
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({ 'a-practice': 'na' }));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).source).toBe('deal');
  });

  it('lets an auction deal lead once its own route’s practice is marked "doesn’t apply"', async () => {
    const { planNow } = await import('./planNext');
    const trustee = { id: 'dt1', name: '5 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', notes: '', done: [], stage: 'researching', updatedAt: '2026-11-01T00:00:00.000Z', locationConfirmed: true };
    localStorage.setItem('deedowl.analyze.v1', JSON.stringify([trustee]));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).source).not.toBe('deal');
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({ 'a-practice': 'na' }));
    expect(planNow(new Date('2026-11-03T12:00:00Z')).source).toBe('deal');
  });
  it('keeps "None yet (learning)" when a practice analysis is saved, and ends it for a real one', async () => {
    const { saveDeals } = await import('./analyze');
    const now = new Date().toISOString();
    const base = { state: 'NV' as const, county: 'Douglas', kind: 'listing' as const, plan: 'rent' as const, notes: '', done: [], updatedAt: now };
    localStorage.setItem('deedowl.roadmap.deal.v1', JSON.stringify('none'));
    saveDeals([{ ...base, id: 'p1', name: 'Practice one', practice: true }]);
    expect(JSON.parse(localStorage.getItem('deedowl.roadmap.deal.v1')!)).toBe('none');
    saveDeals([{ ...base, id: 'p1', name: 'Practice one', practice: true }, { ...base, id: 'r1', name: 'Real one' }]);
    expect(JSON.parse(localStorage.getItem('deedowl.roadmap.deal.v1')!)).toBe('');
  });
  it('makes a practice analysis a real deal: clears the flag, ends None yet, and the open draft follows', async () => {
    const { saveDeals, makeRealDeal, loadDeals, CURRENT_KEY } = await import('./analyze');
    const d = { state: 'NV' as const, county: 'Washoe', kind: 'listing' as const, plan: 'rent' as const, notes: '', done: [], updatedAt: new Date().toISOString(), id: 'p9', name: 'Real after all', practice: true };
    saveDeals([d]);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(d));
    localStorage.setItem('deedowl.roadmap.deal.v1', JSON.stringify('none'));
    makeRealDeal('p9');
    expect(loadDeals()[0].practice).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(CURRENT_KEY)!).practice).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('deedowl.roadmap.deal.v1')!)).toBe('');
  });
  it('counts a route practice step done when another practice settled part 2 (rental purchase, or another route)', async () => {
    const { roadmapNextStep } = await import('./planNext');
    const { practiceDoneElsewhere, roadmapProgress } = await import('./roadmapState');
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('auction'));
    // Every step before the auction practice done, so it would be next.
    const { roadmapFor } = await import('./roadmap');
    const ids = roadmapFor('auction', 'NV').map((x) => x.id);
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(ids.slice(0, ids.indexOf('a-practice'))));
    expect(roadmapNextStep()?.id).toBe('a-practice');
    localStorage.setItem('deedowl.roadmap.credited.v1', JSON.stringify(['practice']));
    expect(practiceDoneElsewhere('a-practice')).toBe('practice');
    // The rental purchase is the agent route's own step: it keeps its own tick (it can be unticked).
    expect(practiceDoneElsewhere('practice')).toBeNull();
    expect(roadmapNextStep()?.id).not.toBe('a-practice');
    const { savingPractice } = await import('./analyze');
    expect(savingPractice()).toBe(false);
    const before = roadmapProgress().done;
    localStorage.setItem('deedowl.roadmap.credited.v1', JSON.stringify([]));
    expect(roadmapProgress().done).toBe(before - 1);
    // Auction practice done, then the agent route: its practice step is counted done too.
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['a-practice']));
    localStorage.setItem('deedowl.roadmap.path.v1', JSON.stringify('listing'));
    expect(practiceDoneElsewhere('practice')).toBe('a-practice');
    expect(practiceDoneElsewhere('a-practice')).toBeNull();
    // "Doesn't apply" on another route doesn't settle this one.
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify([]));
    localStorage.setItem('deedowl.roadmap.status.v1', JSON.stringify({ 'a-practice': 'na' }));
    expect(practiceDoneElsewhere('practice')).toBeNull();
  });
});
