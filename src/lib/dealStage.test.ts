import { beforeEach, describe, expect, it } from 'vitest';
import { cleanDeal, loadDeals, saveDeals, type Deal } from './analyze';
import { EMPTY_PACKET, nextAction, savePacket } from './dealPacket';
import { dealNextTask, inferStage, setDealStage, STAGE_STEPS, stageLabel, stageOf, stageTasks } from './dealStage';
import { cleanLog, saveLog } from './evidence';
import { saveOwned } from './owned';
import { planNow } from './planNext';
import { ROADMAP } from './roadmap';
import { DEAL_STEPS_KEY, DEAL_KEY } from './roadmapDeals';
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

  it('gives a flip repair and selling tasks after closing, not rental ones', () => {
    const flip: Deal = { ...deal, kind: 'trustee', plan: 'flip' };
    const closed = stageTasks(flip, 'closed', EMPTY_PACKET, now);
    const labels = closed.map((t) => t.label).join(' | ');
    expect(labels).toMatch(/Get repair bids for 123 Main St and start the work/);
    expect(labels).toMatch(/repair and holding costs against your budget/);
    expect(labels).not.toMatch(/rent/i);
    expect(last(closed)?.label).toBe('Mark 123 Main St as fixing and selling');
    expect(stageLabel('owned', flip)).toBe('Fixing and selling');
    expect(stageLabel('owned', deal)).toBe('Owned and operating');
    const owned = stageTasks(flip, 'owned', EMPTY_PACKET, now);
    expect(owned.map((t) => t.key)).toEqual(['list', 'sold', 'next']);
    expect(owned[0].label).toMatch(/price backed by sold comps/);
    expect(owned[1].label).toMatch(/sale and your actual profit/);
    expect(owned.map((t) => t.label).join(' | ')).not.toMatch(/rent/i);
    // A rental keeps its monthly tasks.
    expect(stageTasks(deal, 'closed', EMPTY_PACKET, now).map((t) => t.key)).toContain('owned');
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

  it('keeps a guided beginner on the lessons when they tick a planning task early', () => {
    localStorage.setItem('deedowl.mode.v1', JSON.stringify('guided'));
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: Object.fromEntries(['goal', 'cash', 'ready', 'borrow', 'time', 'hands', 'risk', 'market', 'state'].map((k) => [k, 'x'])), done: [] }));
    localStorage.setItem('deedowl.roadmap.v1', JSON.stringify(['money']));
    const p = planNow(now);
    expect(p.context).toBe('Step 2 · Learn');
    expect(p.task.key).toMatch(/^lesson-/);
  });

  it('starts a brand-new visitor on Decide, and someone who knows the basics on the roadmap', () => {
    const fresh = planNow(now);
    expect(fresh.source).toBe('starter');
    expect(fresh.context).toBe('Step 1 · Decide');
    expect(fresh.task.href).toBe('#/decide');
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


describe('separate contract milestones', () => {
  it('does not carry pre-approval, inspection research or an insurance quote into later completion', () => {
    const log = cleanLog({ rows: { terms: { done: true }, condition: { done: true }, insurance: { done: true }, title: { done: true } } });
    const tasks = stageTasks(deal, 'contract', EMPTY_PACKET, now, log);
    for (const key of ['final-financing', 'inspection-complete', 'bound-insurance', 'contract-title', 'final-walkthrough', 'appraisal-complete']) {
      expect(tasks.find((t) => t.key === key)?.done, key).toBe(false);
    }
  });
  it('completes only the specific milestone for the specific property', () => {
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:d1': { done: ['loan-approval'], status: {} } }));
    const tasks = stageTasks(deal, 'contract', EMPTY_PACKET, now);
    expect(tasks.find((t) => t.key === 'final-financing')?.done).toBe(true);
    expect(tasks.find((t) => t.key === 'bound-insurance')?.done).toBe(false);
    expect(stageTasks({ ...deal, id: 'd2' }, 'contract', EMPTY_PACKET, now).find((t) => t.key === 'final-financing')?.done).toBe(false);
  });
  it('requires a calendar review for the current stage instead of merely counting dates', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Accepted', who: 'Agent' }, { when: '2026-11-01', what: 'Closing', who: 'Escrow' }] };
    expect(stageTasks(deal, 'contract', p, now).find((t) => t.key === 'dates')?.done).toBe(false);
    expect(stageTasks(deal, 'contract', { ...p, calendarReviewedFor: 'offer' }, now).find((t) => t.key === 'dates')?.done).toBe(false);
    expect(stageTasks(deal, 'contract', { ...p, calendarReviewedFor: 'contract' }, now).find((t) => t.key === 'dates')?.done).toBe(true);
    expect(stageTasks(deal, 'contract', { ...p, calendarReviewedFor: 'contract', dates: [...p.dates, { when: '', what: 'Inspection', who: '' }] }, now).find((t) => t.key === 'dates')?.done).toBe(false);
  });
});

it('tracks deposit delivery independently of the offer amount and final approval', () => {
  const p = { ...EMPTY_PACKET, earnest: 3000 };
  expect(stageTasks(deal, 'contract', p, now).find(t => t.key === 'deposit-sent')?.done).toBe(false);
  localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ [`analyzed:${deal.id}`]: { done: ['deposit'], status: {} } }));
  const tasks = stageTasks(deal, 'contract', p, now);
  expect(tasks.find(t => t.key === 'deposit-sent')?.done).toBe(true);
  expect(tasks.find(t => t.key === 'final-financing')?.done).toBe(false);
});

it('includes preparation and lawful tenancy before a rental is operating', () => {
  const tasks = stageTasks(deal, 'closed', EMPTY_PACKET, now);
  const keys = tasks.map(t => t.key);
  expect(keys.indexOf('rental-repairs')).toBeLessThan(keys.indexOf('owned'));
  expect(keys.indexOf('rental-lease')).toBeLessThan(keys.indexOf('owned'));
  expect(tasks.find(t => t.key === 'rental-lease')?.done).toBe(false);
});
