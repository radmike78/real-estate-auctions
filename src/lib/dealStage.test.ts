import { beforeEach, describe, expect, it } from 'vitest';
import { cleanDeal, loadDeals, saveDeals, type Deal } from './analyze';
import { EMPTY_PACKET, nextAction, savePacket } from './dealPacket';
import { dealNextTask, inferStage, setDealStage, STAGE_STEPS, stageHint, stageLabel, stageOf, stageTasks } from './dealStage';
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
// Numbers the reader typed (the rent among them), not the calculator's examples.
const withNumbers = () => { localStorage.setItem('fsf.calc.rent.d1-offer.v1', JSON.stringify({ value: 280000, atPrice: 280000, monthlyRent: 2200 })); localStorage.setItem('fsf.calc.rent.d1-offer.v1.typed.v1', JSON.stringify(['value', 'atPrice', 'monthlyRent'])); };

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

  it('counts the numbers only once the property’s own rent is typed, not the examples behind one click', () => {
    localStorage.setItem('fsf.calc.rent.d1-offer.v1', JSON.stringify({ value: 280000, atPrice: 280000, monthlyRent: 2200 }));
    localStorage.setItem('fsf.calc.rent.d1-offer.v1.typed.v1', JSON.stringify(['atPrice']));
    expect(stageTasks(deal, 'researching', EMPTY_PACKET, now).find((t) => t.key === 'numbers')?.done).toBe(false);
    withNumbers();
    expect(stageTasks(deal, 'researching', EMPTY_PACKET, now).find((t) => t.key === 'numbers')?.done).toBe(true);
  });

  it('moves a researched deal on only after a decision', () => {
    withNumbers();
    saveLog('analyzed:d1', cleanLog({ rows: Object.fromEntries(['sale', 'income', 'insurance'].map((k) => [k, { done: true }])), gate: 'proceed' }));
    const p = { ...EMPTY_PACKET, fit: 'fits' as const, fitWhy: 'Under my price limit' };
    const t = dealNextTask(deal, p, now, 'researching');
    expect(t.setStage).toBe('offer');
    saveLog('analyzed:d1', cleanLog({ rows: {}, gate: 'pass' }));
    // Pass chosen: moving it to Passed is the next task, ahead of the research still open.
    expect(stageTasks(deal, 'researching', p, now)[0]?.setStage).toBe('passed');
    expect(dealNextTask(deal, { ...EMPTY_PACKET }, now, 'researching').setStage).toBe('passed');
  });

  it('prepares an offer, then waits for the seller to accept', () => {
    withNumbers();
    const tasks = stageTasks(deal, 'offer', EMPTY_PACKET, now);
    expect(tasks.map((t) => t.key)).toEqual(['numbers', 'ev-terms', 'earnest', 'qa', 'offer']);
    expect(last(tasks)?.advance?.stage).toBe('contract');
  });

  it('brings in the contract deadlines once it’s under contract', () => {
    withNumbers();
    // The earnest money is due right after signing: it comes before the calendar.
    expect(dealNextTask(deal, EMPTY_PACKET, now, 'contract').label).toBe('Send the earnest money for 123 Main St and confirm receipt');
    const t = stageTasks(deal, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'dates')!;
    expect(t.label).toBe('Put 123 Main St’s contract deadlines on its calendar');
    expect(t.produces).toMatch(/the date rows under Key dates/);
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

  it('never picks a practice analysis on its own, and moves on from a chosen property you passed on', () => {
    saveDeals([{ ...deal, practice: true }]);
    expect(focusDealId()).toBe('');
    localStorage.setItem(DEAL_KEY, JSON.stringify('analyzed:d1'));
    expect(focusDealId()).toBe('analyzed:d1'); // chosen in My plan: it's the one you're working on
    saveDeals([{ ...deal, stage: 'passed' }, { ...deal, id: 'd2', name: '9 New St', updatedAt: '2026-10-07T00:00:00Z' }]);
    expect(focusDealId()).toBe('analyzed:d2');
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

it('walks a Nevada HOA sale through the certificate, the redemption wait and the deed (NRS 116.31166)', () => {
  const hoa: Deal = { ...deal, id: 'dh1', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  const keys = (p = EMPTY_PACKET) => stageTasks(hoa, 'closed', p, now).map((t) => [t.key, t.done] as const);
  const k0 = keys().map(([k]) => k);
  // Insure it first; then the wait; then the deed; repairs only after.
  expect(k0.indexOf('first-week')).toBeLessThan(k0.indexOf('redemption-wait'));
  expect(k0.indexOf('redemption-wait')).toBeLessThan(k0.indexOf('deed'));
  expect(k0.indexOf('deed')).toBeLessThan(k0.indexOf('repairs'));
  expect(Object.fromEntries(keys())['redemption-wait']).toBe(false);
  // The wait is done once its end date has passed and is marked handled; the deed once its row is.
  const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner', resolved: true }, { when: '2026-09-20', what: 'Deed delivered (if no one redeemed)', who: 'HOA agent', resolved: true }] };
  expect(Object.fromEntries(keys(p))['redemption-wait']).toBe(true);
  expect(Object.fromEntries(keys(p))['deed']).toBe(true);
  // A date still ahead isn't done, even if ticked.
  const ahead = { ...EMPTY_PACKET, dates: [{ when: '2027-01-01', what: 'Redemption period ends', who: 'Owner', resolved: true }] };
  expect(Object.fromEntries(keys(ahead))['redemption-wait']).toBe(false);
  // An IRS sale is the same: a certificate of sale, 180 days, then the deed (26 U.S.C. 6337, 6338).
  expect(stageLabel('closed', { kind: 'irs', state: 'TX' })).toBe('Certificate of sale received');
  expect(stageTasks({ ...hoa, kind: 'irs' }, 'closed', EMPTY_PACKET, now).find((t) => t.key === 'redemption-wait')?.label).toMatch(/180 days after the sale/);
});

it('opens the roadmap step a deal task is backed by', () => {
  const hoa: Deal = { ...deal, id: 'dh2', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  expect(stageTasks(hoa, 'closed', EMPTY_PACKET, now).find((t) => t.key === 'first-week')?.href).toBe('#/toolkit/roadmap?step=first-week');
});

it('an IRS sale with "No redemption" picked gets the deed at once; a ticked deed row is enough', () => {
  const irs: Deal = { ...deal, id: 'di1', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip' };
  localStorage.setItem('fsf.bid.analyzed-di1.v1', JSON.stringify({ exitValue: 250000, repairs: 20000, redemptionMonths: 0, redemptionRatePct: 0 }));
  localStorage.setItem('fsf.bid.analyzed-di1.v1.typed.v1', JSON.stringify(['exitValue', 'repairs', 'rulePick_NV_irs_none']));
  expect(stageLabel('closed', irs)).toBe('Deed recorded');
  expect(stageTasks(irs, 'closed', EMPTY_PACKET, now).map((t) => t.key)).not.toContain('redemption-wait');
  localStorage.removeItem('fsf.bid.analyzed-di1.v1'); localStorage.removeItem('fsf.bid.analyzed-di1.v1.typed.v1');
  const hoa: Deal = { ...deal, id: 'dh3', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  const p = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Deed delivered (if no one redeemed)', who: '', resolved: true }] };
  expect(stageTasks(hoa, 'closed', p, now).find((t) => t.key === 'deed')?.done).toBe(true);
});

it('says "Deed recorded" once the deed row is ticked, and counts the wait as over', () => {
  const hoa: Deal = { ...deal, id: 'dh4', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  expect(stageLabel('closed', hoa)).toBe('Certificate of sale recorded');
  const p = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Deed delivered (if no one redeemed)', who: '', resolved: true }] };
  savePacket('analyzed:dh4', p);
  expect(stageLabel('closed', hoa)).toBe('Deed recorded');
  expect(stageTasks(hoa, 'closed', p, now).find((t) => t.key === 'redemption-wait')?.done).toBe(true);
});

it('counts a renamed wait or deed row as that date', () => {
  const hoa: Deal = { ...deal, id: 'dh5', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends (60 days, check notice)', who: 'Owner', resolved: true }, { when: '', what: 'Deed delivered', who: '', resolved: true }] };
  const t = Object.fromEntries(stageTasks(hoa, 'closed', p, now).map((x) => [x.key, x.done]));
  expect(t['redemption-wait']).toBe(true);
  expect(t['deed']).toBe(true);
});

it('asks whether you won once sale day has passed, ahead of later dates, and counts a handled payment as paid', () => {
  const hoa: Deal = { ...deal, id: 'dh6', state: 'NV', county: 'Washoe', kind: 'hoa', plan: 'rent', stage: 'offer' };
  const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-10-08', what: 'Certificate of sale recorded', who: 'HOA agent' }] };
  const t = dealNextTask(hoa, p, now, 'offer');
  expect(t.label).toMatch(/Sale day has passed for 123 Main St: did you win\?/);
  expect(t.advance?.stage).toBe('contract');
  // Before the sale, a post-sale row isn't a reminder.
  const before = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'Certificate of sale recorded', who: 'HOA agent' }] };
  expect(dealNextTask(hoa, before, now, 'offer').key).not.toBe('date');
  const paid = { ...EMPTY_PACKET, dates: [{ when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }] };
  expect(stageTasks({ ...hoa, stage: 'contract' }, 'contract', paid, now).find((x) => x.key === 'ev-terms')?.done).toBe(true);
});

it('gives a home you’ll live in no rental tasks', () => {
  localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
  const home: Deal = { ...deal, id: 'dl7', state: 'NV', county: 'Washoe', kind: 'reo', plan: 'rent' };
  const keys = stageTasks(home, 'closed', EMPTY_PACKET, now).map((t) => `${t.key}:${t.label}`).join(' | ');
  expect(keys).not.toMatch(/rental-lease|before renting/);
  expect(keys).toMatch(/as your home/);
  localStorage.removeItem('deedowl.decide.v1');
});

it('offers "didn’t win" beside "did you win?", with no doubled punctuation in the next action', () => {
  const hoa: Deal = { ...deal, id: 'dh8', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'offer' };
  const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'HOA agent', resolved: true }] };
  const keys = stageTasks(hoa, 'offer', p, now).map((t) => t.key);
  expect(keys.slice(0, 2)).toEqual(['bid', 'lost']);
  expect(stageTasks(hoa, 'offer', p, now).find((t) => t.key === 'lost')?.setStage).toBe('passed');
  expect(nextAction(hoa, p, now).text).not.toMatch(/\?\./);
});

it('round 4: researching past sale day, two answers, deed ends the redemption reminder, early calendar, live-in owned', async () => {
  const { calendarReady, dateGuide, rentWaitNote } = await import('./dealPacket');
  const hoa: Deal = { ...deal, id: 'dh9', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip' };
  const past = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'HOA agent' }] };
  const r = dealNextTask(hoa, past, now, 'researching');
  expect(r.label).toMatch(/: did you win\?$/);
  expect(r.advance2?.stage).toBe('passed');
  expect(dealNextTask(hoa, past, now, 'offer').advance2?.stage).toBe('passed');
  // A future sale day ticked handled isn't over.
  const future = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Sale day', who: 'HOA agent', resolved: true }] };
  expect(dealNextTask(hoa, future, now, 'offer').label).not.toMatch(/Sale day has passed/);
  // The deed ticked: no "ask for the deed" reminder.
  const deedIn = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Redemption period ends', who: 'Owner' }, { when: '', what: 'Deed delivered (if no one redeemed)', who: '', resolved: true }] };
  expect(dealNextTask(hoa, deedIn, now, 'closed').label).not.toMatch(/ask for the deed/);
  // Before the sale, only the pre-sale dates need filling in.
  const pre = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Sale day', who: 'HOA agent' }, { when: '', what: 'Redemption period ends', who: '' }] };
  expect(calendarReady(pre, 'offer')).toBe(true);
  expect(calendarReady({ ...pre, dates: [{ when: '', what: 'Sale day', who: '' }] }, 'offer')).toBe(false);
  // An IRS rental with "No redemption" picked: no certificate rows, no rent-wait note.
  localStorage.setItem('fsf.bid.analyzed-di9.v1', JSON.stringify({ exitValue: 250000, redemptionMonths: 0, redemptionRatePct: 0 }));
  localStorage.setItem('fsf.bid.analyzed-di9.v1.typed.v1', JSON.stringify(['exitValue', 'rulePick_NV_irs_none']));
  const irs: Deal = { ...deal, id: 'di9', state: 'NV', county: 'Clark', kind: 'irs', plan: 'rent' };
  expect(dateGuide(irs).map((g) => g.what)).not.toContain('Redemption period ends');
  expect(rentWaitNote('NV', 'irs', 'di9')).toBeNull();
  // A home you live in, once owned: "Living there".
  localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
  expect(stageLabel('owned', { ...deal, id: 'dl9', state: 'NV', kind: 'reo', plan: 'rent' })).toBe('Living there');
  localStorage.removeItem('deedowl.decide.v1');
});

describe('Nevada round 4 flow', () => {
  const nvFlip: Deal = { ...deal, id: 'f1', name: '2210 Mesa Verde Ln', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip' };

  it('finishes a flip once its sale is recorded', () => {
    saveDeals([{ ...nvFlip, stage: 'owned' }]);
    saveOwned({ f1: { boughtOn: '2026-09-01', months: [] } });
    expect(stageTasks(nvFlip, 'owned', EMPTY_PACKET, now).find((x) => x.key === 'sold')!.done).toBe(false);
    saveOwned({ f1: { boughtOn: '2026-09-01', months: [], sold: { on: '2026-10-01', price: 430000 } } });
    expect(stageTasks(nvFlip, 'owned', EMPTY_PACKET, now).find((x) => x.key === 'sold')!.done).toBe(true);
    expect(dealNextTask(nvFlip, EMPTY_PACKET, now, 'owned').key).toBe('next');
  });

  it('keeps a deal under way in focus when a newer candidate is saved', () => {
    saveDeals([{ ...nvFlip, stage: 'closed' }, { ...nvFlip, id: 'f2', name: '9 New St', stage: 'researching', updatedAt: '2026-10-07T00:00:00Z' }]);
    expect(focusDealId()).toBe('analyzed:f1');
    // An owned rental is ongoing: a newer candidate leads.
    saveDeals([{ ...nvFlip, plan: 'rent', stage: 'owned' }, { ...nvFlip, id: 'f2', name: '9 New St', stage: 'researching', updatedAt: '2026-10-07T00:00:00Z' }]);
    expect(focusDealId()).toBe('analyzed:f2');
  });

  it('lets a short sale’s approval-dependent dates wait, and calls an ended window ended', async () => {
    const { calendarRows, windowEnded } = await import('./dealPacket');
    const rows = [{ when: '2026-11-06', what: 'Contract signed', who: 'You' }, { when: '', what: 'Approval notice received (dates count from here)', who: '' }, { when: '', what: 'Inspection period ends', who: '' }, { when: '', what: 'Closing', who: '' }];
    expect(calendarRows({ ...EMPTY_PACKET, dates: rows }, 'contract').map((x) => x.what)).toEqual(['Contract signed']);
    rows[1] = { ...rows[1], when: '2027-01-10', who: 'Lender' };
    expect(calendarRows({ ...EMPTY_PACKET, dates: rows }, 'contract')).toHaveLength(4);
    expect(windowEnded('Challenge window ends', 27)!.text).toBe('the challenge window ended 27 days ago');
    expect(windowEnded('Sale day', 2)).toBeNull();
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-08', what: 'Challenge window ends', who: 'Title company' }] };
    expect(dealNextTask({ ...nvFlip, stage: 'closed' }, p, now, 'closed').label).toBe('The challenge window ended 28 days ago: ask your title company or attorney whether any suit was filed, and whether the 90-day limit for anyone not properly notified (NRS 107.080(6)) still runs. If none was filed, mark it handled.');
  });

  it('drops past registration and signing rows once they’re behind you, and keeps “It was redeemed” in the last week', () => {
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Bidder registration (if required)', who: 'me' }, { when: '2026-10-02', what: 'Sale day', who: '' }, { when: '2026-10-05', what: 'Payment deadline', who: 'Trustee' }] };
    expect(dealNextTask(nvFlip, won, now, 'contract').label).toMatch(/^Overdue by 1 day: Payment deadline/);
    const signed = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Contract signed', who: 'Agent' }] };
    expect(dealNextTask({ ...nvFlip, kind: 'short', plan: 'rent' }, signed, now, 'contract').label).toMatch(/^Send the earnest money/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const wait = { ...EMPTY_PACKET, dates: [{ when: '2026-10-09', what: 'Redemption period ends', who: 'Former owner' }] };
    const t = dealNextTask(hoa, wait, now, 'closed');
    expect(t.advance2?.addRow?.what).toBe('Redemption money collected');
    // It was redeemed: the payoff comes first, and finishes as "Redeemed (repaid)".
    const red = { ...wait, dates: [...wait.dates, t.advance2!.addRow!] };
    const pay = dealNextTask(hoa, red, new Date('2026-10-20T15:00:00Z'), 'closed');
    expect(pay.key).toBe('payoff');
    expect(pay.tick).toEqual({ label: 'I was repaid for 2210 Mesa Verde Ln: mark it finished', row: 'Redemption money collected', then: 'passed' });
    expect(pay.produces).toMatch(/NRS 116\.31166/);
  });

  it('counts a ticked Treasurer’s deed row, and words an unpaid lien’s date as a wait that ended', async () => {
    const { windowEnded } = await import('./dealPacket');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] };
    expect(stageTasks({ ...nvFlip, kind: 'taxSale' }, 'contract', p, now).find((x) => x.key === 'record')!.label).toMatch(/is recorded/);
    expect(windowEnded('Earliest you may act (unpaid lien)', 6)!.short).toBe('ended 6 days ago');
  });

  it('links a stage to its own date rows, and asks a Nevada lien buyer whether they were picked', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Payment deadline', who: 'Trustee', resolved: true }, { when: '2026-10-07', what: 'Deed recorded', who: 'Trustee' }] };
    expect(dealNextTask(nvFlip, p, now, 'contract').advance?.label).toBe('The deed is recorded: mark it');
    // Moved on with the row unticked: no "Overdue: Deed recorded" at Deed recorded.
    expect(dealNextTask(nvFlip, { ...p, dates: [{ ...p.dates[1], when: '2026-09-20' }] }, now, 'closed').label).not.toMatch(/Deed recorded/);
    const lien = { ...nvFlip, kind: 'lien' as const, plan: 'lien' as const };
    const sale = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: '' }] };
    const t = dealNextTask(lien, sale, now, 'researching');
    expect(t.label).toMatch(/were you picked\?$/);
    expect(t.advance?.label).toBe('I was picked: mark it');
  });

  it('asks for the challenge window’s end after a Nevada trustee sale, and shows a sold flip’s rough profit', async () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Deed recorded', who: 'Trustee', resolved: true }] };
    const w = stageTasks(nvFlip, 'closed', p, now).find((x) => x.key === 'window')!;
    expect(w.produces).toMatch(/Oct 20, 2026/);
    expect(w.done).toBe(false);
    const { flipSaleLine } = await import('./dealPacket');
    localStorage.setItem('fsf.bid.analyzed-f1.v1', JSON.stringify({ exitValue: 340000, proposedPrice: 180000, sellingCostPct: 6 }));
    saveOwned({ f1: { boughtOn: '2026-06-01', months: [{ month: '2026-07', rent: 0, costs: 30000, note: '' }], sold: { on: '2026-10-01', price: 335000 } } });
    const line = flipSaleLine({ ...nvFlip, stage: 'owned' })!;
    expect(line).toMatch(/^Sold on Oct 1, 2026 for \$335,000 \(you planned a \$340,000 resale\)/);
    expect(line).toMatch(/Rough profit before income tax: about \$[0-9,]+ \(the sale, less your \$180,000 bid/);
    expect(line).not.toMatch(/walk-away/);
  });

  it('keeps a redeemed deal’s calendar complete, and puts the wait behind an owned certificate-first deal', async () => {
    const { calendarReady } = await import('./dealPacket');
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'Agent', resolved: true }, { when: '', what: 'Redemption money collected', who: 'The person who redeemed' }] };
    expect(calendarReady(p, 'closed')).toBe(true);
    const owned = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner' }, { when: '2026-09-20', what: 'Deed delivered (if no one redeemed)', who: 'Agent' }] };
    expect(dealNextTask({ ...hoa, plan: 'rent' }, owned, now, 'owned').urgent).toBeFalsy();
    const t = dealNextTask(hoa, { ...EMPTY_PACKET, dates: [owned.dates[0]] }, now, 'closed');
    expect(t.answer).toBe(true);
    expect(t.advance2?.addRow?.what).toBe('Redemption money collected');
  });

  it('round 6: sale-day buttons, a strict stage event, the redemption undo and labels', () => {
    const today = { ...EMPTY_PACKET, dates: [{ when: '2026-10-06', what: 'Sale day', who: 'Trustee' }] };
    const t = dealNextTask(nvFlip, today, now, 'offer');
    expect(t.advance?.label).toBe('I won the bid: mark it won');
    expect(t.advance2?.stage).toBe('passed');
    const cd = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'Closing Disclosure received', who: 'Lender' }] };
    expect(dealNextTask({ ...nvFlip, kind: 'reo' as const }, cd, now, 'contract').advance).toBeUndefined();
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const red = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner' }, { when: '', what: 'Redemption money collected', who: 'The person who redeemed' }] };
    const pay = dealNextTask(hoa, red, now, 'closed');
    expect(pay.undo?.removeRow).toBe('Redemption money collected');
    expect(pay.tick?.closes).toBeUndefined();
    const after = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner', resolved: true }, { when: '2026-10-03', what: 'Deed delivered (if no one redeemed)', who: 'Agent' }] };
    expect(dealNextTask(hoa, after, now, 'closed').advance2).toBeUndefined();
    expect(stageHint('passed', hoa)).not.toMatch(/redeemed/);
  });

  it('round 6 flow: work after the challenge window, SID payoff, paid tick, calendar review, deed tick', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '2026-09-20', what: 'Deed recorded', who: 'Trustee', resolved: true }] };
    const rep = stageTasks(nvFlip, 'closed', p, now).find((x) => x.key === 'repairs')!;
    expect(rep.label).toMatch(/start the work after the challenge window ends \(Oct 20, 2026, or Nov 30, 2026 if anyone wasn’t properly notified/);
    expect(stageTasks(nvFlip, 'closed', p, now).find((x) => x.key === 'window')!.produces).toMatch(/90 days after the sale \(Nov 30, 2026\)/);
    const lien = { ...nvFlip, kind: 'lien' as const, plan: 'lien' as const };
    const hold = stageTasks(lien, 'owned', EMPTY_PACKET, now).find((x) => x.key === 'hold')!;
    expect(hold.advance2?.addRow?.who).toMatch(/Treasurer/);
    const paid = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Redemption money collected', who: 'The Treasurer who sold the certificate' }] };
    expect(dealNextTask(lien, paid, now, 'owned').key).toBe('payoff');
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Payment deadline', who: 'Me' }] };
    expect(dealNextTask(nvFlip, won, now, 'contract').tick?.label).toBe('I paid: mark it handled');
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const deedP = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner', resolved: true }] };
    expect(stageTasks(hoa, 'closed', deedP, now).find((x) => x.key === 'deed')!.tick?.label).toBe('I have the deed, and it’s recorded: mark it handled');
  });

  it('round 6 verifier: no sale-day reminder once won; the deed reminder carries its answer', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-06', what: 'Sale day', who: 'Trustee' }, { when: '2026-10-06', what: 'Payment deadline', who: 'Me' }] };
    expect(dealNextTask(nvFlip, p, now, 'contract').label).toMatch(/Payment deadline/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const d = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Redemption period ends', who: 'Owner', resolved: true }, { when: '2026-10-04', what: 'Deed delivered (if no one redeemed)', who: 'Agent' }] };
    const t = dealNextTask(hoa, d, now, 'closed');
    expect(t.tick?.label).toBe('I have the deed, and it’s recorded: mark it handled');
    expect(t.urgent).toBe(false);
  });

  it('round 7: a ticked undated wait counts; a paid-off lien’s rows stop reminding; the lien reminder carries the payoff button', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const undated = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Redemption period ends', who: 'Owner', resolved: true }] };
    expect(stageTasks(hoa, 'closed', undated, now).find((x) => x.key === 'redemption-wait')!.done).toBe(true);
    const lien = { ...nvFlip, kind: 'lien' as const, plan: 'lien' as const };
    const near = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'Earliest you may act (unpaid lien)', who: 'Treasurer' }] };
    expect(dealNextTask(lien, near, now, 'owned').advance2?.label).toMatch(/The owner paid for/);
    const paying = { ...near, dates: [...near.dates, { when: '', what: 'Redemption money collected', who: 'The Treasurer' }] };
    expect(dealNextTask(lien, paying, now, 'owned').key).toBe('payoff');
  });

  it('round 7 verifier: a dated payoff row keeps the payoff task; earnest money marked sent; NV roadmap wording', async () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const red = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'Redemption money collected', who: 'x' }] };
    expect(dealNextTask(hoa, red, now, 'closed').key).toBe('payoff');
    const reo = { ...nvFlip, kind: 'reo' as const };
    const em = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Me', resolved: true }] };
    expect(stageTasks(reo, 'contract', em, now).find((x) => x.key === 'deposit-sent')!.label).toMatch(/^Confirm escrow received/);
    const { roadmapFor } = await import('./roadmap');
    const step = roadmapFor('auction', 'NV').find((x) => x.id === 'a-before-remodel')!;
    expect(JSON.stringify(step)).not.toMatch(/Texas/);
    expect(step.stop).toMatch(/challenge or recovery-suit window/);
  });

  it('round 8 flow: ticked closing leads, sale-day answers at researching, redemption end, SID affidavit, 90-day redate', () => {
    const reo = { ...nvFlip, kind: 'reo' as const };
    const closed = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Closing', who: 'Escrow', resolved: true }] };
    expect(dealNextTask(reo, closed, now, 'contract').key).toBe('close');
    const sale = { ...EMPTY_PACKET, dates: [{ when: '2026-10-06', what: 'Sale day', who: 'T' }] };
    expect(dealNextTask(nvFlip, sale, now, 'researching').advance?.label).toBe('I won the bid: mark it won');
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const hp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'A', resolved: true }] };
    expect(stageTasks(hoa, 'closed', hp, now).find((x) => x.key === 'redemption-wait')!.label).toMatch(/ends Oct 31, 2026/);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    expect(stageTasks(tax, 'contract', EMPTY_PACKET, now).some((x) => x.key === 'sid-affidavit')).toBe(true);
    const cw = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-01', what: 'Challenge window ends', who: 'Title' }] };
    expect(dealNextTask(nvFlip, cw, now, 'closed').redate?.when).toBe('2026-11-30');
  });

  it('round 8 verifier: the SID question comes right after paying, and its no is its own row; lien areas; redemption end from the row', () => {
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const keys = stageTasks(tax, 'contract', EMPTY_PACKET, now).map((x) => x.key);
    expect(keys.indexOf('sid-affidavit')).toBe(keys.indexOf('ev-terms') + 1);
    const t = stageTasks(tax, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'sid-affidavit')!;
    expect(t.tick?.row).toBe('Treasurer confirmed no SID affidavit');
    expect(stageTasks(tax, 'contract', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Treasurer confirmed no SID affidavit', who: 'T', resolved: true }] }, now).find((x) => x.key === 'sid-affidavit')!.done).toBe(true);
    const lien = { ...nvFlip, kind: 'lien' as const, plan: 'lien' as const };
    const pay = stageTasks(lien, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'ev-terms');
    if (pay) expect(pay.produces).not.toMatch(/Financing and sale terms/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const hp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-11-20', what: 'Redemption period ends', who: 'O' }] };
    expect(stageTasks(hoa, 'closed', hp, now).find((x) => x.key === 'redemption-wait')!.label).toMatch(/ends Nov 20, 2026/);
  });

  it('round 9: a passed computed redemption end asks, a Closing Disclosure tick isn’t closing, a finished chosen deal gives way', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '', what: 'Redemption period ends', who: '' }] };
    const t = dealNextTask(hoa, p, now, 'closed');
    expect(t.label).toMatch(/^The redemption period ended 6 days ago \(Sep 30, 2026\)/);
    expect(t.tick?.when).toBe('2026-09-30');
    const reo = { ...nvFlip, kind: 'reo' as const };
    const cd = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Closing Disclosure received', who: 'Lender', resolved: true }] };
    expect(dealNextTask(reo, cd, now, 'contract').key).not.toBe('close');
    saveDeals([{ ...nvFlip, stage: 'owned' }, { ...nvFlip, id: 'f2', name: 'Open One', stage: 'contract', updatedAt: '2026-09-01T00:00:00Z' }]);
    saveOwned({ f1: { boughtOn: '2026-06-01', months: [], sold: { on: '2026-09-15', price: 300000 } } });
    localStorage.setItem(DEAL_KEY, JSON.stringify('analyzed:f1'));
    expect(focusDealId()).toBe('analyzed:f2');
  });

  it('round 9 flow: a repaid only deal still leads My plan; an offer’s contract dates wait; pre-sale rows behind a win', async () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const, stage: 'passed' as const };
    saveDeals([hoa]);
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Redemption money collected', who: 'x', resolved: true }] });
    expect(focusDealId()).toBe('analyzed:f1');
    const { calendarRows } = await import('./dealPacket');
    expect(calendarRows({ ...EMPTY_PACKET, dates: [{ when: '', what: 'Closing', who: '' }] }, 'researching')).toHaveLength(0);
    const { behindStage } = await import('./dealStage');
    expect(behindStage(nvFlip, 'contract')).toContain('Sale day');
  });

  it('round 9 verifier: no "did anyone redeem?" after the deed; the worked-out end in the summary; a capped SID date names the deadline', async () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const deedP = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-10-02', what: 'Deed delivered (if no one redeemed)', who: 'A', resolved: true }] };
    expect(dealNextTask(hoa, deedP, now, 'closed').label).not.toMatch(/did anyone redeem|ended \d+ days ago/);
    const { packetSections } = await import('./dealPacket');
    saveDeals([{ ...hoa, stage: 'closed' }]);
    const open = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }] };
    const lines = packetSections({ ...hoa, stage: 'closed' }, open, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).toMatch(/Sep 30, 2026: Redemption period ends \(worked out from the sale day; confirm it\) — open/);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sid = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-30', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    expect(dealNextTask(tax, sid, now, 'contract').label).toMatch(/The deadline is Oct 10, 2026, 20 days after the sale; your date, Nov 30, 2026, is later/);
  });

  it('round 10: no worked-out redemption on an IRS no-redemption sale; the open SID payoff after the deed; Closing date counts', async () => {
    const irs = { ...nvFlip, kind: 'irs' as const };
    localStorage.setItem('fsf.bid.analyzed-f1.v1', JSON.stringify({}));
    localStorage.setItem('fsf.bid.analyzed-f1.v1.typed.v1', JSON.stringify(['rulePick_NV_irs_none']));
    const { redemptionEndFrom } = await import('./dealStage');
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'IRS', resolved: true }] };
    expect(redemptionEndFrom(irs, sp)).toBe('');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sid = { ...EMPTY_PACKET, dates: [{ when: '2026-10-08', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    const t = dealNextTask(tax, sid, now, 'closed');
    expect(t.label).toMatch(/SID certificate payoff for .* is still open/);
    expect(t.tick?.label).toBe('I paid it: mark it handled');
    const { sameEvent } = await import('./dealPacket');
    expect(sameEvent('Closing date', 'Closing')).toBe(true);
    expect(sameEvent('Closing Disclosure received', 'Closing')).toBe(false);
  });

  it('round 10 UX: a 90-day limit that ended is named; passed rows; the SID row; undated contract rows; a ticked closing; no one redeemed', async () => {
    const { packetSections } = await import('./dealPacket');
    // now = Oct 6, 2026. Sale Jul 1 + 90 = Sep 29 (over); the window ended Aug 4.
    const tr = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-07-05', what: 'Deed recorded', who: 'Me' }, { when: '2026-08-04', what: 'Challenge window ends', who: 'Me' }] };
    const t = dealNextTask(nvFlip, tr, now, 'closed');
    expect(t.label).toMatch(/ended Sep 29, 2026\. If none was filed, mark it handled/);
    expect(t.label).not.toMatch(/still runs/);
    expect(t.tick?.label).toBe('No suit was filed: mark it handled');
    expect(t.redate).toBeUndefined();
    saveDeals([{ ...nvFlip, stage: 'closed' }]);
    const tl = packetSections({ ...nvFlip, stage: 'closed' }, tr, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(tl).toMatch(/Jul 5, 2026: Deed recorded \(Me\) — passed/);
    expect(tl).toMatch(/ended Sep 29, 2026/);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sid = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-30', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    saveDeals([{ ...tax, stage: 'contract' }]);
    const sl = packetSections({ ...tax, stage: 'contract' }, sid, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(sl).toMatch(/Nov 30, 2026: SID certificate payoff .* — open, after the 20-day deadline/);
    expect(sl).toMatch(/the 20-day deadline, Oct 10, 2026; your date is later/);
    const short = { ...nvFlip, kind: 'short' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Contract signed', who: 'Me' }, { when: '2026-10-02', what: 'Approval notice received (dates count from here)', who: 'Lender' }, { when: '', what: 'Inspection period ends', who: '' }, { when: '', what: 'Closing', who: '' }] };
    saveDeals([{ ...short, stage: 'contract' }]);
    const shl = packetSections({ ...short, stage: 'contract' }, sp, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(shl).toMatch(/Approval notice received \(dates count from here\) \(Lender\) — passed/);
    expect(shl).toMatch(/Still to add: the dates for Inspection period ends; Closing\./);
    expect(shl).not.toMatch(/Nothing else is due now/);
    const listing = { ...nvFlip, kind: 'listing' as const };
    const lp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Closing', who: 'Escrow', resolved: true }] };
    savePacket('analyzed:f1', lp);
    expect(stageTasks(listing, 'contract', lp, now).find((x) => x.key === 'close')!.label).toBe('The closing is marked handled: mark 2210 Mesa Verde Ln closed');
    expect(stageHint('contract', listing)).toMatch(/closing is marked handled/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-09-30', what: 'Redemption period ends', who: 'A', resolved: true }] });
    expect(stageHint('closed', hoa)).toMatch(/^No one redeemed: get the deed from the person who conducted the sale/);
  });

  it('round 10 flow: the SID deadline named; pay early; did you win in the summary; lienholder deadline; first week; deed first; worked-out window', async () => {
    const { packetSections } = await import('./dealPacket');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    // now = Oct 6. Sale Sep 20 -> deadline Oct 10 (ahead); sale Sep 10 -> Sep 30 (passed).
    const ahead = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-21', what: 'Payment deadline', who: 'Me', resolved: true }] };
    const sa = stageTasks(tax, 'contract', ahead, now).find((x) => x.key === 'sid-affidavit')!;
    expect(sa.produces).toMatch(/by Oct 10, 2026 \(20 days after the sale\)/);
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(packetSections({ ...tax, stage: 'contract' }, ahead, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Oct 10, 2026: SID certificate payoff deadline, if there’s an SID affidavit \(worked out/);
    const past = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }] };
    expect(stageTasks(tax, 'contract', past, now).find((x) => x.key === 'sid-affidavit')!.label).toMatch(/The 20 days for any SID payoff on 2210 Mesa Verde Ln ended Sep 30, 2026/);
    const late = { ...past, dates: [...past.dates, { when: '2026-10-02', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    expect(dealNextTask(tax, late, now, 'contract').label).toMatch(/ended Sep 30, 2026\. If it wasn’t paid by then, the sale is void and the Treasurer may keep up to 10%/);
    const early = { ...ahead, dates: [...ahead.dates, { when: '2026-10-08', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    const et = dealNextTask(tax, early, now, 'contract');
    expect(et.tick?.label).toBe('I paid it: mark it handled');
    expect(et.undo?.label).toBe('No SID affidavit after all: remove the payoff row');
    // Researching after the sale: the summary asks too.
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'T' }, { when: '2026-09-02', what: 'Payment deadline', who: 'Me' }, { when: '', what: 'Bidder registration (if required)', who: '' }] };
    saveDeals([{ ...nvFlip, stage: 'researching' }]);
    const rl = packetSections({ ...nvFlip, stage: 'researching' }, r, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(rl).toMatch(/Next: the sale day has passed: answer “did you win\?”/);
    expect(rl).not.toMatch(/overdue/);
    const { calendarRows } = await import('./dealPacket');
    expect(calendarRows(r, 'researching').some((x) => /registration/i.test(x.what))).toBe(false);
    // A short sale approved: the lienholder deadline is behind.
    const short = { ...nvFlip, kind: 'short' as const };
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Approval notice received (dates count from here)', who: 'Lender' }, { when: '2026-10-20', what: 'Lienholder approval deadline (from the short sale addendum)', who: 'Lender' }] });
    const { behindStage } = await import('./dealStage');
    expect(behindStage(short, 'contract')).toContain('Lienholder approval deadline');
    // First week: no locks promised before lawful possession.
    expect(stageTasks(nvFlip, 'closed', EMPTY_PACKET, now).find((x) => x.key === 'first-week')!.produces).toMatch(/once you lawfully have possession of a vacant home, locks changed/);
    // No one redeemed: the deed first.
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const nr = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-09-30', what: 'Redemption period ends', who: 'A', resolved: true }] };
    const keys = stageTasks(hoa, 'closed', nr, now).map((x) => x.key);
    expect(keys.indexOf('deed')).toBeLessThan(keys.indexOf('first-week'));
    expect(stageTasks(hoa, 'closed', nr, now).find((x) => x.key === 'first-week')!.label).toBe('Secure and insure 2210 Mesa Verde Ln');
    // Trustee: the challenge window worked out from the deed's recording.
    const tr = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-01', what: 'Deed recorded', who: 'Me', resolved: true }] };
    saveDeals([{ ...nvFlip, stage: 'closed' }]);
    expect(packetSections({ ...nvFlip, stage: 'closed' }, tr, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Oct 31, 2026: Challenge window ends \(worked out from the deed’s recording/);
  });

  it('round 10 verifier: worked-out challenge question; remodel check after the deed; who on a dated redemption row; lienholder met; offer hint; registration', async () => {
    const { packetSections, calendarRows } = await import('./dealPacket');
    // Deed Jul 5 -> window Aug 4 (passed); sale Jul 1 -> 90 days Sep 29 (passed). now = Oct 6.
    const tr = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-07-05', what: 'Deed recorded', who: 'Me', resolved: true }] };
    const t = dealNextTask(nvFlip, tr, now, 'closed');
    expect(t.label).toMatch(/^The challenge window ended 63 days ago \(Aug 4, 2026, worked out from the deed’s recording\)/);
    expect(t.tick).toEqual({ label: 'No suit was filed: mark it handled', row: 'Challenge window ends', when: '2026-08-04', who: 'Your title company' });
    // Sale Aug 20 -> 90 days Nov 18 still ahead: move the end.
    const tg = { ...EMPTY_PACKET, dates: [{ when: '2026-08-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-01', what: 'Deed recorded', who: 'Me', resolved: true }] };
    expect(dealNextTask(nvFlip, tg, now, 'closed').redate?.when).toBe('2026-11-18');
    // No one redeemed: the deed, then the remodel check without a redemption question.
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const nr = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-09-30', what: 'Redemption period ends', who: 'A', resolved: true }] };
    const ts = stageTasks(hoa, 'closed', nr, now);
    const keys = ts.map((x) => x.key);
    expect(keys.indexOf('deed')).toBeLessThan(keys.indexOf('before-remodel'));
    expect(ts.find((x) => x.key === 'before-remodel')!.label).toBe('Check possession and title for 2210 Mesa Verde Ln before you remodel');
    // A dated redemption row with no "who": the answer fills it.
    const court = { ...nvFlip, kind: 'court' as const };
    const cr = { ...EMPTY_PACKET, dates: [{ when: '2025-10-01', what: 'Sale day', who: 'S', resolved: true }, { when: '2026-10-01', what: 'Redemption period ends', who: '' }] };
    expect(dealNextTask(court, cr, now, 'closed').tick?.who).toBe('The sheriff’s civil office');
    // A lienholder deadline the approval came after stays open; one it met reads "met".
    const short = { ...nvFlip, kind: 'short' as const };
    saveDeals([{ ...short, stage: 'contract' }]);
    const late = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Approval notice received (dates count from here)', who: 'Lender' }, { when: '2026-09-20', what: 'Lienholder approval deadline (from the short sale addendum)', who: 'Lender' }] };
    savePacket('analyzed:f1', late);
    expect(packetSections({ ...short, stage: 'contract' }, late, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Lienholder approval deadline \(from the short sale addendum\) \(Lender\) — open/);
    const met = { ...late, dates: [late.dates[0], { ...late.dates[1], when: '2026-10-20' }] };
    savePacket('analyzed:f1', met);
    expect(packetSections({ ...short, stage: 'contract' }, met, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/— met \(approved Oct 1, 2026\)/);
    // The offer stage after the sale; a dated registration row isn't still needed.
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'T' }, { when: '2026-08-25', what: 'Bidder registration (if required)', who: '' }] };
    savePacket('analyzed:f1', r);
    expect(stageHint('offer', nvFlip)).toMatch(/^The sale day has passed: say whether you won/);
    expect(calendarRows(r, 'offer').some((x) => /registration/i.test(x.what))).toBe(false);
  });

  it('round 11: contract dates wait for the offer; a postponed sale; per-property home choice; SID passed in the summary; date days', async () => {
    const { packetSections } = await import('./dealPacket');
    const { setDealHome, liveIn } = await import('./dealStage');
    const listing = { ...nvFlip, kind: 'listing' as const, plan: 'rent' as const };
    const ep = { ...EMPTY_PACKET, dates: [{ when: '2026-10-04', what: 'Earnest money due', who: 'me' }] };
    expect(dealNextTask(listing, ep, now, 'offer').label).not.toMatch(/Earnest money due/);
    expect(dealNextTask(listing, ep, now, 'contract').label).toMatch(/^Overdue by 2 days: Earnest money due/);
    // A sale day that went by: "postponed" clears the date.
    const past = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Trustee' }] };
    const t = dealNextTask(nvFlip, past, now, 'offer');
    expect(t.undo).toEqual({ label: 'It was postponed: clear the sale date to enter the new one', removeRow: 'Sale day', addRow: { when: '', what: 'Sale day', who: 'Trustee' } });
    expect(dealNextTask(nvFlip, past, now, 'researching').undo?.removeRow).toBe('Sale day');
    // A reader buying a home: each property can be the home or a rental.
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    saveDeals([{ ...listing, stage: 'contract' }]);
    expect(liveIn(listing)).toBe(true);
    setDealHome('f1', 'rent');
    expect(loadDeals()[0].home).toBe('rent');
    expect(liveIn({ id: 'f1', kind: 'listing', plan: 'rent' })).toBe(false);
    setDealHome('f1', 'live');
    expect(liveIn({ id: 'f1', kind: 'listing', plan: 'rent' })).toBe(true);
    localStorage.removeItem('deedowl.decide.v1');
    // The worked-out SID deadline once it has passed.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }] };
    saveDeals([{ ...tax, stage: 'contract' }]);
    const lines = packetSections({ ...tax, stage: 'contract' }, sp, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).toMatch(/Next: the 20 days for any SID payoff ended Sep 30, 2026: ask the Treasurer whether an SID affidavit was filed/);
    expect(lines).not.toMatch(/overdue/);
    // A date reminder carries its days (My plan's finish note reads them).
    const late = { ...sp, dates: [...sp.dates, { when: '2026-10-02', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
    expect(dealNextTask(tax, late, now, 'contract').days).toBeLessThan(0);
  });

  it('round 11 UX: the 90-day limit while it runs; its own row; passed deadlines carry days; row words', async () => {
    const { packetSections } = await import('./dealPacket');
    // Sale Aug 20 (+90 = Nov 18, ahead); deed Sep 1 (+30 = Oct 1, passed). now = Oct 6.
    const tg = { ...EMPTY_PACKET, dates: [{ when: '2026-08-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-01', what: 'Deed recorded', who: 'Me', resolved: true }] };
    const t = dealNextTask(nvFlip, tg, now, 'closed');
    expect(t.label).toMatch(/properly notified\*\. Anyone who wasn’t can still sue until Nov 18, 2026, 90 days after the sale/);
    expect(t.redate?.label).toBe('Wait for the 90-day limit: move the end to Nov 18, 2026');
    expect(t.tick?.label).toBe('My attorney or title company confirmed proper notice and no suit*: mark it handled');
    expect(t.days).toBeLessThan(0);
    // Before the 30 days end, Key dates show the 90-day limit too.
    const early = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-20', what: 'Deed recorded', who: 'Me', resolved: true }] };
    saveDeals([{ ...nvFlip, stage: 'closed' }]);
    const el = packetSections({ ...nvFlip, stage: 'closed' }, early, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(el).toMatch(/Oct 20, 2026: Challenge window ends/);
    expect(el).toMatch(/Nov 30, 2026: 90-day limit for anyone not properly notified ends/);
    expect(el).toMatch(/Next: Challenge window ends, in 14 days/);
    // A researching deal's passed sale day.
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T' }] };
    saveDeals([{ ...nvFlip, stage: 'researching' }]);
    expect(packetSections({ ...nvFlip, stage: 'researching' }, r, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Sale day \(T\) — passed: did you win\?/);
    // The SID deadline passed: its row and the affidavit task.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }] };
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(packetSections({ ...tax, stage: 'contract' }, sp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/— ended: ask the Treasurer/);
    expect(dealNextTask(tax, sp, now, 'contract').days).toBe(-1);
    expect(stageHint('contract', tax)).toBe('Payment and recording deadlines are running.');
  });

  it('round 11 flow: a late SID payoff; Still to add; hints; time order after the deed; registration passed', async () => {
    const { packetSections, dealPacketText } = await import('./dealPacket');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    // Sale Sep 10 -> deadline Sep 30 (passed). The payoff dated Oct 3, open: "I paid it by Sep 30" sets the date.
    const base = [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }];
    const open = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] };
    const t = dealNextTask(tax, open, now, 'contract');
    expect(t.tick).toMatchObject({ label: 'I paid it by Sep 30, 2026: mark it handled', setWhen: '2026-09-30' });
    // Handled with the late date kept: the warning stays, and the next step asks whether the sale stands.
    const late = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City', resolved: true }] };
    const lt = dealNextTask(tax, late, now, 'contract');
    expect(lt.label).toMatch(/after the 20-day deadline \(Sep 30, 2026\): ask the Treasurer in writing whether the sale stands\*/);
    expect(lt.advance2?.stage).toBe('passed');
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(packetSections({ ...tax, stage: 'contract' }, late, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/— handled, after the 20-day deadline \(ask the Treasurer whether the sale stands\*\)/);
    const stands = { ...late, dates: [...late.dates, { when: '2026-10-05', what: 'Treasurer confirmed the sale stands', who: 'The county treasurer', resolved: true }] };
    expect(dealNextTask(tax, stands, now, 'contract').label).not.toMatch(/whether the sale stands/);
    // The download: the pre-sale parts read "left blank" after a win.
    expect(dealPacketText({ ...tax, stage: 'contract' }, late, now)).toMatch(/YOUR DECISION \[left blank: from before you bought\]/);
    // Still to add: no "(if …)" rows.
    const short = { ...nvFlip, kind: 'short' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Contract signed', who: 'Me' }, { when: '2026-10-02', what: 'Approval notice received (dates count from here)', who: 'Lender' }, { when: '', what: 'Defect cancellation deadline (if a defect is disclosed)', who: '' }, { when: '', what: 'Closing', who: '' }] };
    saveDeals([{ ...short, stage: 'contract' }]);
    expect(packetSections({ ...short, stage: 'contract' }, sp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Still to add: the date for Closing\./);
    // A short sale's ticked Closing.
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Closing', who: 'Escrow', resolved: true }] });
    expect(stageHint('contract', short)).toMatch(/^The closing is marked handled/);
    // HOA after the deed: possession in the hint; tasks in time order.
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const dp = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-09-30', what: 'Redemption period ends', who: 'A', resolved: true }, { when: '2026-10-02', what: 'Deed delivered (if no one redeemed)', who: 'A', resolved: true }] };
    savePacket('analyzed:f1', dp);
    expect(stageHint('closed', hoa)).toMatch(/secure and insure it, confirm possession and title insurance/);
    const keys = stageTasks(hoa, 'closed', dp, now).map((x) => x.key);
    expect(keys.indexOf('deed')).toBeLessThan(keys.indexOf('first-week'));
    expect(keys.indexOf('redemption-wait')).toBeLessThan(keys.indexOf('first-week'));
    // A closed HOA deal waiting on the deed: name the row.
    const wait = { ...EMPTY_PACKET, dates: [dp.dates[0], dp.dates[1], { when: '', what: 'Deed delivered (if no one redeemed)', who: '' }] };
    saveDeals([{ ...hoa, stage: 'closed' }]);
    expect(packetSections({ ...hoa, stage: 'closed' }, wait, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Still to add: the date for Deed delivered/);
    // Trustee hint with the worked-out window.
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-09-25', what: 'Deed recorded', who: 'Me', resolved: true }] });
    expect(stageHint('closed', nvFlip)).toMatch(/the challenge window ended Oct 25, 2026 \(worked out from the deed’s recording/);
    // Registration passed once the sale is over, at researching.
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T' }, { when: '2026-09-25', what: 'Bidder registration deadline', who: 'Me' }] };
    saveDeals([{ ...nvFlip, stage: 'researching' }]);
    expect(packetSections({ ...nvFlip, stage: 'researching' }, r, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Bidder registration deadline \(Me\) — passed/);
  });

  it('says so when the deed row is ticked at a win', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Deed recorded', who: 'Trustee', resolved: true }] };
    expect(stageTasks(nvFlip, 'contract', p, now).find((x) => x.key === 'record')!.label).toMatch(/^The deed for 2210 Mesa Verde Ln is recorded/);
  });
});
