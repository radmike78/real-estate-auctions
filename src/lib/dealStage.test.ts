import { beforeEach, describe, expect, it } from 'vitest';
import { cleanDeal, loadDeals, saveDeals, type Deal } from './analyze';
import { EMPTY_PACKET, nextAction, savePacket } from './dealPacket';
import { dealNextTask, inferStage, setDealStage, STAGE_STEPS, stageLabel, stageOf, stageTasks } from './dealStage';
import { cleanLog, saveLog } from './evidence';
import { saveOwned } from './owned';
import { planNow } from './planNext';
import { ROADMAP } from './roadmap';
import { DEAL_KEY } from './roadmapDeals';
import { focusDealId, NO_DEAL } from './roadmapState';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const deal: Deal = { id: 'd1', name: '123 Main St', state: 'TX', county: 'Travis', kind: 'listing', plan: 'rent', notes: '', done: [], updatedAt: '2026-10-06T00:00:00Z' };
const now = new Date('2026-10-06T15:00:00Z');
const last = <T,>(a: T[]): T | undefined => a[a.length - 1];
// A rental analysis saved at $280,000, as the reviewer did: numbers, but no offer made.
const withNumbers = () => localStorage.setItem('fsf.calc.rent.d1-offer.v1', JSON.stringify({ value: 280000, atPrice: 280000, monthlyRent: 2200 }));

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  (globalThis as unknown as { window?: unknown }).window ??= { dispatchEvent: () => true };
  (globalThis as unknown as { CustomEvent?: unknown }).CustomEvent ??= class { constructor(public type: string) {} };
});

// Accepted-offer deadlines: the offer date, the option period and fee, and the deposit deadline.
const ACCEPTED = /accepted|option period|option fee|deadline/i;

describe('a saved deal’s stage', () => {
  it('treats a deal saved before stages existed as researching unless an accepted offer is on its calendar', () => {
    expect(inferStage(deal, EMPTY_PACKET)).toBe('researching');
    expect(stageOf(deal)).toBe('researching');
    expect(inferStage(deal, { ...EMPTY_PACKET, dates: [{ when: '', what: 'Offer accepted (Day 0)', who: '' }] })).toBe('researching');
    expect(inferStage(deal, { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Offer accepted (Day 0)', who: '' }] })).toBe('contract');
  });

  it('works out passed, closed and owned from what’s recorded', () => {
    saveLog('analyzed:d1', cleanLog({ gate: 'pass' }));
    expect(stageOf(deal)).toBe('passed');
    saveOwned({ d1: { boughtOn: '2026-09-01', months: [] } });
    expect(stageOf(deal)).toBe('closed');
    saveOwned({ d1: { boughtOn: '2026-09-01', months: [{ month: '2026-09', rent: 2200, costs: 2000, note: '' }] } });
    expect(stageOf(deal)).toBe('owned');
  });

  it('keeps the stage the buyer chose with the deal, and drops an unknown one', () => {
    saveDeals([deal]);
    setDealStage('d1', 'offer');
    expect(loadDeals()[0].stage).toBe('offer');
    expect(stageOf(loadDeals()[0])).toBe('offer');
    expect(cleanDeal({ ...deal, stage: 'bogus' })?.stage).toBeUndefined();
    expect(cleanDeal({ ...deal, stage: 'contract' })?.stage).toBe('contract');
  });

  it('names stages for the way the property is bought', () => {
    expect(stageLabel('offer', deal)).toBe('Preparing an offer');
    expect(stageLabel('offer', { kind: 'trustee' })).toBe('Preparing to bid');
    expect(stageLabel('contract', deal)).toBe('Under contract');
    expect(stageLabel('contract', { kind: 'taxSale' })).toMatch(/Won/);
  });
});

describe('the next action follows the stage', () => {
  it('asks a new candidate for research, never accepted-offer deadlines', () => {
    withNumbers();
    const task = dealNextTask(deal, EMPTY_PACKET, now);
    expect(task.label).toBe('Confirm who is selling 123 Main St, and what exactly is sold');
    expect(nextAction(deal, EMPTY_PACKET, now).text).not.toMatch(ACCEPTED);
    for (const t of stageTasks(deal, 'researching', EMPTY_PACKET, now)) expect(`${t.label} ${t.produces}`, t.key).not.toMatch(ACCEPTED);
    // Once the sale is verified, the rent comes next, and says what it produces.
    saveLog('analyzed:d1', cleanLog({ rows: { sale: { done: true } } }));
    const rent = dealNextTask(deal, EMPTY_PACKET, now);
    expect(rent.label).toBe('Verify the rent for 123 Main St');
    expect(rent.produces).toMatch(/3 comparable rents/);
    expect(rent.support.map((s) => s.href)).toContain('#/learn/analyze');
  });

  it('runs the numbers first when there are none', () => {
    expect(dealNextTask(deal, EMPTY_PACKET, now).openDeal).toBe(true);
  });

  it('moves a researched deal on only after a decision', () => {
    withNumbers();
    saveLog('analyzed:d1', cleanLog({ rows: Object.fromEntries(['sale', 'income', 'insurance'].map((k) => [k, { done: true }])), gate: 'proceed' }));
    const p = { ...EMPTY_PACKET, fit: 'fits' as const, fitWhy: 'Under my price limit' };
    const t = dealNextTask(deal, p, now, 'researching');
    expect(t.setStage).toBe('offer');
    saveLog('analyzed:d1', cleanLog({ rows: {}, gate: 'pass' }));
    expect(last(stageTasks(deal, 'researching', p, now))?.setStage).toBe('passed');
  });

  it('prepares an offer, then waits for the seller to accept', () => {
    withNumbers();
    const tasks = stageTasks(deal, 'offer', EMPTY_PACKET, now);
    expect(tasks.map((t) => t.key)).toEqual(['numbers', 'ev-terms', 'earnest', 'qa', 'offer']);
    expect(last(tasks)?.advance?.stage).toBe('contract');
  });

  it('brings in the contract deadlines once it’s under contract', () => {
    withNumbers();
    const t = dealNextTask(deal, EMPTY_PACKET, now, 'contract');
    expect(t.label).toBe('Put 123 Main St’s contract deadlines on its calendar');
    expect(t.produces).toMatch(/Offer accepted/);
    expect(t.produces).toMatch(/Option period ends/);
    expect(stageTasks(deal, 'contract', EMPTY_PACKET, now).some((x) => /option period/.test(x.label))).toBe(true);
    expect(stageTasks({ ...deal, state: 'NV' }, 'contract', EMPTY_PACKET, now).some((x) => /inspection period/.test(x.label))).toBe(true);
  });

  it('puts a deadline within a week ahead of the stage’s tasks, but not for a deal you passed on', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'Inspection', who: '' }] };
    expect(dealNextTask(deal, p, now, 'contract').urgent).toBe(true);
    expect(dealNextTask(deal, p, now, 'passed').key).toBe('next');
  });

  it('gives auctions bidding tasks, and owners monthly ones', () => {
    const auction: Deal = { ...deal, kind: 'trustee', plan: 'flip' };
    expect(stageTasks(auction, 'researching', EMPTY_PACKET, now).map((t) => t.key)).toContain('ev-title');
    expect(last(stageTasks(auction, 'offer', EMPTY_PACKET, now))?.advance?.label).toMatch(/won/i);
    const owned = stageTasks(deal, 'owned', EMPTY_PACKET, now);
    expect(owned[0].key).toBe('month');
    expect(last(owned)?.key).toBe('next');
  });

  it('assigns each of a property’s roadmap steps to exactly one stage', () => {
    const all = Object.values(STAGE_STEPS).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const s of ROADMAP.filter((x) => x.phase >= 4)) expect(all, s.id).toContain(s.id);
    for (const id of all) expect(ROADMAP.some((s) => s.id === id), id).toBe(true);
  });
});

describe('My plan’s one Continue', () => {
  it('works on the property you saved, at its stage', () => {
    saveDeals([deal]);
    withNumbers();
    const p = planNow(now);
    expect(p.source).toBe('deal');
    expect(p.context).toBe('123 Main St · Researching');
    expect(p.task.label).not.toMatch(ACCEPTED);
    expect(p.tasks?.length).toBeGreaterThan(3);
  });

  it('falls back to the roadmap when “None yet” is chosen, and skips deals you passed on', () => {
    saveDeals([deal]);
    localStorage.setItem(DEAL_KEY, JSON.stringify(NO_DEAL));
    expect(focusDealId()).toBe('');
    localStorage.setItem('deedowl.mode.v1', JSON.stringify('explore'));
    expect(planNow(now).source).toBe('roadmap');
    // An empty choice was stored on every visit before: it doesn't hide your deals.
    localStorage.setItem(DEAL_KEY, JSON.stringify(''));
    expect(focusDealId()).toBe('analyzed:d1');
    saveDeals([{ ...deal, stage: 'passed' }]);
    expect(focusDealId()).toBe('');
  });

  it('starts a brand-new visitor on the Getting started tour, and someone who knows the basics on the roadmap', () => {
    const fresh = planNow(now);
    expect(fresh.source).toBe('starter');
    expect(fresh.context).toMatch(/Getting started · 1 of/);
    localStorage.setItem('deedowl.mode.v1', JSON.stringify('explore'));
    const explore = planNow(now);
    expect(explore.source).toBe('roadmap');
    expect(explore.task.label).toBe('Write your goal');
  });

  it('carries the stage into the deal packet download', async () => {
    saveDeals([{ ...deal, stage: 'contract' }]);
    savePacket('analyzed:d1', EMPTY_PACKET);
    const { dealPacketText } = await import('./dealPacket');
    expect(dealPacketText(loadDeals()[0], EMPTY_PACKET, now)).toMatch(/STAGE: Under contract/);
  });
});
