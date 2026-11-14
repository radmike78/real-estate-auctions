import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    localStorage.setItem('deedowl.buybox.v1', JSON.stringify({ priceMax: 300000 }));
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
    // (No tracker yet: starting it comes first, then the listing.)
    const owned = stageTasks(flip, 'owned', EMPTY_PACKET, now);
    expect(owned.map((t) => t.key)).toEqual(['owned', 'list', 'sold', 'next']);
    expect(owned[1].label).toMatch(/price backed by sold comps/);
    expect(owned[2].label).toMatch(/sale and your actual profit/);
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
  expect(stageTasks(hoa, 'closed', EMPTY_PACKET, now).find((t) => t.key === 'first-week')?.href).toBe('#/toolkit/roadmap?deal=analyzed%3Adh2&step=first-week');
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
    expect(dealNextTask(nvFlip, won, now, 'contract').label).toMatch(/^The payment deadline for .* passed .*contact the trustee today.*NRS 107.083/);
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

  it('an unpaid Clark tax sale and Nevada IRS win after the sale day say when payment was due', () => {
    const now2 = new Date('2026-11-14T18:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    const tax = { ...nvFlip, kind: 'taxSale' as const, stage: 'contract' as const };
    savePacket(`analyzed:${tax.id}`, p);
    const tt = stageTasks(tax, 'contract', p, now2).find((x) => x.key === 'ev-terms')!;
    expect(tt.label).toMatch(/Clark County’s payment was due by 1:00 p.m. on the sale day/);
    expect(tt.advance2?.stage).toBe('passed');
    const irs = { ...nvFlip, kind: 'irs' as const, stage: 'contract' as const };
    const it2 = stageTasks(irs, 'contract', p, now2).find((x) => x.key === 'ev-terms')!;
    expect(it2.label).toMatch(/no more than 1 month after the sale/);
    // On the payment day itself it names the deadline.
    const today = { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, today);
    expect(stageTasks(tax, 'contract', today, new Date('2026-11-14T17:00:00Z')).find((x) => x.key === 'ev-terms')!.label).toMatch(/by 1:00 p.m. today/);
    // After 1:00 p.m. Nevada time the same day it asks whether you paid, and passing records the deadline.
    const after = stageTasks(tax, 'contract', today, new Date('2026-11-14T23:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(after.label).toMatch(/^Did you pay for/);
    expect(after.advance2?.addRow).toMatchObject({ when: '2026-11-14', what: 'Payment deadline' });
  });

  it('a Nevada trustee win left unpaid after the sale day is urgent', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Trustee', resolved: true }] };
    savePacket(`analyzed:${nvFlip.id}`, p);
    const t = stageTasks({ ...nvFlip, stage: 'contract' }, 'contract', p, new Date('2026-11-14T18:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(t.label).toMatch(/contact the trustee today/);
    expect(t.days).toBe(0);
  });

  it('a Nevada tax sale with its Treasurer’s deed recorded offers no SID void choice (NRS 361.595(6))', () => {
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const later = new Date('2026-11-14T18:00:00Z');
    const sale = { when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true };
    const before = { ...EMPTY_PACKET, dates: [sale] };
    savePacket(`analyzed:${tax.id}`, before);
    const ask = stageTasks(tax, 'owned', before, later).find((x) => x.key === 'sid-affidavit');
    expect(ask?.undo?.label).toMatch(/the sale is void/);
    const deeded = { ...EMPTY_PACKET, dates: [sale, { when: '2026-10-20', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, deeded);
    const tasks = stageTasks(tax, 'owned', deeded, later);
    expect(tasks.some((x) => x.key === 'sid-affidavit' || x.key === 'sid-paid-affidavit')).toBe(false);
    expect(tasks.some((x) => /the sale is void/.test(x.undo?.label ?? ''))).toBe(false);
    // A deed ticked ahead of its date isn't on record yet: the SID question (and its 20-day warning) stays.
    const ahead = { ...EMPTY_PACKET, dates: [sale, { when: '2026-12-10', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, ahead);
    expect(stageTasks(tax, 'owned', ahead, later).some((x) => x.key === 'sid-affidavit')).toBe(true);
    // At Won, a future-dated tick doesn't put 'the deed is recorded' first.
    expect(stageTasks(tax, 'contract', ahead, later).find((x) => !x.done)?.key).not.toBe('record');
    // An undated tick while the 20 days still run doesn't settle the SID question either.
    const fresh = { when: '2026-11-05', what: 'Sale day', who: 'T', resolved: true };
    const undated = { ...EMPTY_PACKET, dates: [fresh, { when: '', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, undated);
    expect(stageTasks(tax, 'contract', undated, later).some((x) => x.key === 'sid-affidavit')).toBe(true);
    expect(stageTasks(tax, 'contract', undated, later).find((x) => !x.done)?.key).not.toBe('record');
    // The Won hint says so while the SID step is open, and puts an overdue SID payoff first.
    const won = { ...tax, stage: 'contract' as const };
    const paid = { when: '2026-11-05', what: 'Payment deadline', who: 'T', resolved: true };
    savePacket(`analyzed:${tax.id}`, { ...undated, dates: [...undated.dates, paid] });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T18:00:00Z'));
    try { expect(stageHint('contract', won)).toMatch(/without a date/); } finally { vi.useRealTimers(); }
    savePacket(`analyzed:${tax.id}`, { ...EMPTY_PACKET, dates: [fresh, paid, { when: '2026-11-20', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }, { when: '2026-11-10', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T18:00:00Z'));
    try {
      expect(stageHint('contract', won)).toMatch(/The 20 days for the SID certificate payoff ended/);
      for (const st of ['closed', 'owned'] as const) expect(stageHint(st, tax)).toMatch(/still open after its 20 days/);
      // With no deed row at all, Won and Owned put the overdue payoff first too.
      savePacket(`analyzed:${tax.id}`, { ...EMPTY_PACKET, dates: [fresh, paid, { when: '2026-11-20', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] });
      expect(stageHint('contract', tax)).toMatch(/20 days for the SID certificate payoff ended/);
      expect(stageHint('owned', tax)).toMatch(/still open after its 20 days/);
    } finally { vi.useRealTimers(); }
    // With the deed on record, the overdue payoff task offers no void and promises none.
    const onRecord = { ...EMPTY_PACKET, dates: [fresh, paid, { when: '2026-11-20', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }, { when: '2026-11-10', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, onRecord);
    const nt = dealNextTask({ ...tax, stage: 'closed' }, onRecord, new Date('2026-11-30T18:00:00Z'), 'closed');
    // After the 20 days it asks directly, and its 'didn't pay' answer is offered, matching the text.
    expect(`${nt.label} ${nt.produces ?? ''}`).toMatch(/Your deed for .* is recorded.*Did you pay it by Nov 25, 2026\?/);
    expect(JSON.stringify(nt)).toMatch(/didn’t pay it by Nov 25, 2026: the sale is void/);
    // An unticked, past-dated deed row doesn't push the open SID payoff out of Your next action.
    const expected = { ...EMPTY_PACKET, dates: [fresh, paid, { when: '2026-11-20', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }, { when: '2026-11-10', what: 'Treasurer’s deed recorded', who: 'Treasurer' }] };
    savePacket(`analyzed:${tax.id}`, expected);
    expect(dealNextTask({ ...tax, stage: 'contract' }, expected, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/SID certificate payoff/);
    // A payoff row dated after day 20 is capped at the deadline there, and Key dates leads with it too.
    const lateRow = { ...EMPTY_PACKET, dates: [fresh, paid, { when: '2026-12-05', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }, { when: '2026-11-10', what: 'Treasurer’s deed recorded', who: 'Treasurer' }] };
    savePacket(`analyzed:${tax.id}`, lateRow);
    const lt = dealNextTask({ ...tax, stage: 'contract' }, lateRow, new Date('2026-11-22T18:00:00Z'), 'contract');
    expect(`${lt.label} ${lt.produces ?? ''}`).toMatch(/Nov 25, 2026|In 3 days/);
    savePacket(`analyzed:${tax.id}`, onRecord);
    // Inside the 20 days it still says to pay by the deadline, at Won as at Deed recorded.
    for (const st of ['contract', 'closed'] as const) {
      const inside = dealNextTask({ ...tax, stage: st }, onRecord, new Date('2026-11-15T18:00:00Z'), st);
      expect(inside.label).not.toMatch(/Did you pay it/);
      // Also after the payoff row's own date (Nov 20) but before day 20 (Nov 25).
      const late = dealNextTask({ ...tax, stage: st }, onRecord, new Date('2026-11-22T18:00:00Z'), st);
      expect(late.label).not.toMatch(/usually means it was paid|Did you pay it/);
    }
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
    expect(lines).toMatch(/Sep 30, 2026: Redemption period ends \(worked out from the sale day; confirm it\) — ended: ask whether anyone redeemed/);
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
    expect(tl).toMatch(/Next: the challenge window ended 63 days ago \(Aug 4, 2026\): see Your next action\./);
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
    expect(stageHint('contract', listing)).toBe('Closed? Mark it below to start the new-owner tasks.');
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
    expect(t.postpone?.label).toBe('It was postponed: clear its dates to enter the new ones');
    expect(dealNextTask(nvFlip, past, now, 'researching').postpone).toBeDefined();
    // Once postponed (dates cleared): the new date comes first.
    const pp = { ...EMPTY_PACKET, postponedSale: true, dates: [{ when: '', what: 'Sale day', who: 'Trustee' }, { when: '', what: 'Bidder registration (if required)', who: 'me' }] };
    expect(dealNextTask(nvFlip, pp, now, 'offer').label).toMatch(/^Enter the new sale date for 2210 Mesa Verde Ln \(the trustee announces it .*NRS 107\.082\)$/);
    // The sale day itself can be postponed too.
    expect(dealNextTask(nvFlip, { ...EMPTY_PACKET, dates: [{ when: '2026-10-06', what: 'Sale day', who: 'Trustee' }] }, now, 'offer').postpone).toBeDefined();
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
    // The same wording with the window's row dated by the reader.
    const dated = { ...tg, dates: [...tg.dates, { when: '2026-10-01', what: 'Challenge window ends', who: 'Title' }] };
    const dt = dealNextTask(nvFlip, dated, now, 'closed');
    expect(dt.label).toMatch(/Anyone who wasn’t can still sue until Nov 18, 2026/);
    expect(dt.tick?.label).toBe('My attorney or title company confirmed proper notice and no suit*: mark it handled');
    expect(dt.redate?.label).toBe('Wait for the 90-day limit: move the end to Nov 18, 2026');
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

  it('round 23 flow: a paid Nevada tax-sale win names the SID payoff next; a sold flip names its sale month and the purchase month’s days', async () => {
    const { sidPending } = await import('./dealStage');
    const { flipSaleLine } = await import('./dealPacket');
    const tax = { ...nvFlip, id: 'tx23', kind: 'taxSale' as const, stage: 'contract' as const };
    saveDeals([tax]);
    savePacket('analyzed:tx23', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-21', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] });
    expect(sidPending(tax, new Date('2026-10-06T12:00:00'))).toBe('pay the special improvement district (SID) certificate by Oct 21, 2026, or the sale is void (NRS 361.595(6)); the Treasurer then records the deed (NRS 361.595(7))');
    expect(sidPending(tax, new Date('2026-10-25T12:00:00'))).toMatch(/^ask the Treasurer in writing whether the sale stands\*: the 20 days for the special improvement district \(SID\) payoff ended Oct 21, 2026, and if it wasn’t paid by then the sale is void/);
    // The usual undated row is only a reminder: the affidavit question stays open.
    savePacket('analyzed:tx23', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] });
    expect(sidPending(tax, new Date('2026-10-06T12:00:00'))).toMatch(/^ask the Treasurer whether a special improvement district \(SID\) affidavit was filed; if one was, pay the SID certificate/);
    expect(sidPending(tax, new Date('2026-10-25T12:00:00'))).toBe('ask the Treasurer whether a special improvement district (SID) affidavit was filed; the 20 days for any SID payoff ended Oct 21, 2026 (NRS 361.595(6))');
    expect(sidPending(tax, new Date('2026-10-25T12:00:00'))).not.toMatch(/records the deed/);
    expect(sidPending({ ...tax, id: 'tx24' }, new Date('2026-10-25T12:00:00'))).toBe('');
    // A trustee win shows no SID step.
    expect(sidPending(nvFlip, new Date('2026-10-06T12:00:00'))).toBe('');
    // Bought Sep 16, October recorded, sold Nov 6: November (the sale month) and Sep 16–30 are named.
    localStorage.setItem('fsf.bid.analyzed-f1.v1', JSON.stringify({ exitValue: 340000, proposedPrice: 180000, sellingCostPct: 6 }));
    saveOwned({ f1: { boughtOn: '2026-09-16', months: [{ month: '2026-10', rent: 0, costs: 31000, note: '' }], sold: { on: '2026-11-06', price: 335000 } } });
    const line = flipSaleLine({ ...nvFlip, stage: 'owned' })!;
    expect(line).toMatch(/No costs are recorded for Nov 2026 \(the sale month, through Nov 6, 2026\), so this leaves it out/);
    expect(line).toMatch(/Costs from Sep 16, 2026 to the end of that month count only if you included them in Oct 2026\./);
  });

  it('round 24: a passed offer’s deposit marked sent on the roadmap; a sold flip leaves out months after the sale', async () => {
    const { packetSections, flipSaleLine } = await import('./dealPacket');
    const offer = { ...nvFlip, id: 'do24', kind: 'listing' as const, plan: 'rent' as const, stage: 'passed' as const };
    saveDeals([offer]);
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:do24': { done: ['deposit'], status: {} } }));
    const cash = (p: typeof EMPTY_PACKET) => packetSections(offer, p, now).find((x) => x.key === 'cash')!.lines.join(' | ');
    expect(cash({ ...EMPTY_PACKET, earnest: 5000 })).toMatch(/\$5,000 \(if you cancelled in time, ask escrow to return it\*\)/);
    expect(cash(EMPTY_PACKET)).toMatch(/Earnest money: sent, amount not entered \(if you cancelled in time, ask escrow to return it\*\)/);
    localStorage.setItem('fsf.bid.analyzed-f1.v1', JSON.stringify({ exitValue: 340000, proposedPrice: 180000, sellingCostPct: 6 }));
    saveOwned({ f1: { boughtOn: '2026-07-01', months: [{ month: '2026-07', rent: 0, costs: 1000, note: '' }, { month: '2026-08', rent: 0, costs: 1000, note: '' }, { month: '2026-09', rent: 0, costs: 1000, note: '' }, { month: '2026-10', rent: 0, costs: 500, note: '' }], sold: { on: '2026-09-30', price: 335000 } } });
    const line = flipSaleLine({ ...nvFlip, stage: 'owned' })!;
    expect(line).toMatch(/the \$3,000 you recorded paying/);
    expect(line).toMatch(/Oct 2026 is recorded after the sale month, so it’s left out: check the sale date\./);
  });

  it('round 24 verifier: an offer calendar reviewed before the closing row counts it missing; a flip is asked for last month', async () => {
    const offer = { ...nvFlip, id: 'dov24', kind: 'listing' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([offer]);
    const p = { ...EMPTY_PACKET, calendarReviewedFor: 'contract', dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Escrow', resolved: true }] };
    expect(stageTasks(offer, 'contract', p, now).find((x) => x.key === 'dates')!.done).toBe(false);
    const withClose = { ...p, dates: [...p.dates, { when: '2026-11-20', what: 'Close of escrow', who: 'Escrow' }] };
    expect(stageTasks(offer, 'contract', withClose, now).find((x) => x.key === 'dates')!.done).toBe(true);
    saveOwned({ f1: { boughtOn: '2026-08-01', months: [{ month: '2026-08', rent: 0, costs: 900, note: '' }] } });
    expect(stageTasks({ ...nvFlip, stage: 'owned' }, 'owned', EMPTY_PACKET, now).map((t) => t.label)).toContain('Record last month’s costs for 2210 Mesa Verde Ln');
  });

  it('round 25: an NV tax sale moved to Deed recorded or Owned keeps the unanswered SID question', async () => {
    const tax = { ...nvFlip, id: 'tx25', kind: 'taxSale' as const, stage: 'closed' as const };
    saveDeals([tax]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }] };
    savePacket('analyzed:tx25', p);
    for (const st of ['closed', 'owned'] as const) expect(stageTasks({ ...tax, stage: st }, st, p, now).map((t) => t.key)).toContain('sid-affidavit');
    const answered = { ...p, dates: [...p.dates, { when: '2026-10-05', what: 'Treasurer confirmed no SID affidavit', who: 'Treasurer', resolved: true }] };
    savePacket('analyzed:tx25', answered);
    expect(stageTasks(tax, 'closed', answered, now).map((t) => t.key)).not.toContain('sid-affidavit');
  });

  it('round 25 flow: contract tasks lead over far deadlines; a passed appraisal asks or cancels; the SID affidavit; the next property', async () => {
    const offer = { ...nvFlip, id: 'dof25', kind: 'reo' as const, plan: 'rent' as const, stage: 'contract' as const };
    const other = { ...nvFlip, id: 'dot25', name: '1470 Kingsbury Grade', stage: 'researching' as const };
    saveDeals([offer, other]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-12', what: 'Appraisal deadline', who: 'Lender' }, { when: '2026-11-15', what: 'Closing', who: 'Escrow' }] };
    // An appraisal deadline 6 days away leads as itself (its own answers stay).
    expect(dealNextTask(offer, p, now, 'contract').label).toMatch(/Appraisal deadline/);
    expect(dealNextTask(offer, p, now, 'contract').label).not.toMatch(/title commitment/);
    // The closing a week away: the title review leads first, with its own button; then insurance; a COE row counts.
    const cp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-10-12', what: 'COE', who: 'Escrow' }] };
    const t1 = dealNextTask(offer, cp, now, 'contract');
    expect(t1.label).toMatch(/^Closing is in 6 days \(Oct 12, 2026\): before then, review the title commitment/);
    expect(t1.record?.label).toBe('I reviewed it: mark it done');
    const cp2 = { ...cp, dates: [...cp.dates, { when: '2026-10-06', what: 'Title commitment reviewed', who: 'Me', resolved: true }] };
    expect(dealNextTask(offer, cp2, now, 'contract').label).toMatch(/before then, have insurance in place/);
    const late = dealNextTask(offer, p, new Date('2026-10-14T15:00:00Z'), 'contract');
    expect(late.label).toMatch(/^The appraisal deadline for .* ended 2 days ago/);
    expect(late.advance2?.label).toBe('I cancelled in writing: mark it passed');
    const tax = { ...nvFlip, id: 'tx25b', kind: 'taxSale' as const, stage: 'contract' as const };
    saveDeals([tax]);
    const tp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-10', what: 'SID certificate payoff (affidavit filed)', who: 'Me', resolved: true }] };
    expect(stageTasks(tax, 'contract', tp, now).map((t) => t.key)).toContain('sid-paid-affidavit');
    const passed = { ...offer, stage: 'passed' as const };
    saveDeals([passed, other]);
    expect(stageTasks(passed, 'passed', EMPTY_PACKET, now).find((t) => t.key === 'next')!.label).toBe('Go on to 1470 Kingsbury Grade in My plan');
  });

  it('round 26: the closing-week task keeps its urgency; the SID payment at Deed recorded; COE date', async () => {
    const offer = { ...nvFlip, id: 'dof26', kind: 'reo' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([offer]);
    const t = dealNextTask(offer, { ...EMPTY_PACKET, dates: [{ when: '2026-10-07', what: 'COE date', who: 'Escrow' }] }, now, 'contract');
    expect(t.label).toMatch(/^Closing is tomorrow/);
    expect(t.urgent).toBe(true);
    const tax = { ...nvFlip, id: 'tx26', kind: 'taxSale' as const, stage: 'closed' as const };
    saveDeals([tax]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-21', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] };
    savePacket('analyzed:tx26', p);
    expect(stageTasks(tax, 'closed', p, now)[0].key).toBe('sid-pay');
  });

  it('round 26 flow: no early It closed; a missing who is named; a changed kind refreshes untouched usual dates', async () => {
    const offer = { ...nvFlip, id: 'dof26b', kind: 'reo' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([offer]);
    const done = { when: '2026-10-01', what: 'Earnest money due', who: 'Escrow', resolved: true };
    const marks = ['Title commitment reviewed', 'Insurance in place', 'Final walkthrough done'].map((what) => ({ when: '2026-10-05', what, who: 'Me', resolved: true }));
    const early = dealNextTask(offer, { ...EMPTY_PACKET, dates: [done, ...marks, { when: '2026-10-09', what: 'Closing', who: 'Escrow' }] }, now, 'contract');
    expect(early.advance).toBeUndefined();
    const noWho = stageTasks(offer, 'contract', { ...EMPTY_PACKET, dates: [done, { when: '2026-11-20', what: 'Closing', who: '' }] }, now).find((t) => t.key === 'dates')!;
    expect(noWho.label).toBe('Add who handles Closing for 2210 Mesa Verde Ln');
    const { loadPacket, suggestedDates } = await import('./dealPacket');
    const sheriff = { ...nvFlip, id: 'dkind26', kind: 'court' as const, stage: 'researching' as const };
    saveDeals([sheriff]);
    savePacket('analyzed:dkind26', { ...EMPTY_PACKET, dates: suggestedDates(sheriff).map((what) => ({ when: '', what, who: '' })) });
    const lien = { ...sheriff, kind: 'lien' as const, plan: 'lien' as const };
    saveDeals([lien]);
    expect([...loadPacket('analyzed:dkind26').dates.map((x) => x.what)].sort()).toEqual([...suggestedDates(lien)].sort());
  });

  it('round 26 verifier: closing-week urgency counts; renamed rows stay; a dated open window waits', async () => {
    const { needsAnswerNow } = await import('./dealStage');
    const offer = { ...nvFlip, id: 'dof26c', kind: 'reo' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([offer]);
    const t = dealNextTask(offer, { ...EMPTY_PACKET, dates: [{ when: '2026-10-07', what: 'Closing', who: 'Escrow' }] }, now, 'contract');
    expect(needsAnswerNow(t)).toBe(true);
    const { loadPacket, suggestedDates } = await import('./dealPacket');
    const sheriff = { ...nvFlip, id: 'dkind26b', kind: 'court' as const, stage: 'researching' as const };
    saveDeals([sheriff]);
    const rows = suggestedDates(sheriff).map((what) => ({ when: '', what, who: '' }));
    rows[1] = { ...rows[1], what: 'Sale day (per the sheriff notice)' };
    savePacket('analyzed:dkind26b', { ...EMPTY_PACKET, dates: rows });
    saveDeals([{ ...sheriff, kind: 'trustee' as const }]);
    expect(loadPacket('analyzed:dkind26b').dates.map((x) => x.what)).toContain('Sale day (per the sheriff notice)');
    const flip = { ...nvFlip, stage: 'owned' as const };
    saveDeals([flip]);
    const wp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Deed recorded', who: 'Trustee', resolved: true }, { when: '2026-10-31', what: 'Challenge window ends', who: 'Title company' }] };
    expect(stageTasks(flip, 'owned', wp, now)[0].label).toMatch(/^Before you spend on repairs or sign a sale for 2210 Mesa Verde Ln, ask your title company whether a challenge was filed; the window ends Oct 31, 2026/);
  });

  it('round 27: closing-week text; an unticked record row reopens its task; a trimmed packet stays on a county change', async () => {
    const { nextAction, loadPacket, suggestedDates } = await import('./dealPacket');
    const offer = { ...nvFlip, id: 'dof27', kind: 'reo' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([offer]);
    const base = [{ when: '2026-10-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-10-07', what: 'Closing', who: 'Escrow' }];
    expect(nextAction(offer, { ...EMPTY_PACKET, dates: base }, now).text).toMatch(/^Closing is tomorrow/);
    const unticked = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-05', what: 'Title commitment reviewed', who: 'Me', resolved: false }] };
    expect(stageTasks(offer, 'contract', unticked, now).find((t) => t.key === 'contract-title')!.done).toBe(false);
    expect(dealNextTask(offer, unticked, now, 'contract').label).not.toMatch(/Overdue/);
    const d = { ...nvFlip, id: 'dtrim27', kind: 'court' as const, stage: 'researching' as const };
    saveDeals([d]);
    const trimmed = suggestedDates(d).slice(1).map((what) => ({ when: '', what, who: '' }));
    savePacket('analyzed:dtrim27', { ...EMPTY_PACKET, dates: trimmed });
    saveDeals([{ ...d, county: 'Washoe' }]);
    expect(loadPacket('analyzed:dtrim27').dates.length).toBe(trimmed.length);
  });

  it('round 27 flow: a kind change keeps touched rows and swaps the untouched ones', async () => {
    const { loadPacket, suggestedDates } = await import('./dealPacket');
    const reo = { ...nvFlip, id: 'dreo27', kind: 'reo' as const, plan: 'rent' as const, stage: 'researching' as const };
    saveDeals([reo]);
    const rows = suggestedDates(reo).map((what) => ({ when: '', what, who: '' }));
    rows[0] = { ...rows[0], what: `${rows[0].what} (per bank addendum)` };
    savePacket('analyzed:dreo27', { ...EMPTY_PACKET, dates: [...rows, { when: '', what: 'Ask the bank about the roof', who: '' }] });
    const auction = { ...reo, kind: 'trustee' as const, plan: 'flip' as const };
    saveDeals([auction]);
    const after = loadPacket('analyzed:dreo27').dates.map((x) => x.what);
    expect(after).toContain('Ask the bank about the roof');
    expect(after).toContain(rows[0].what);
    for (const w of suggestedDates(auction)) expect(after).toContain(w);
    for (const w of suggestedDates(reo).filter((x) => !suggestedDates(auction).includes(x)).slice(1)) expect(after).not.toContain(w);
  });

  it('round 27 verifier: the SID affidavit at Deed recorded after paying; a kind change keeps the new kind’s order', async () => {
    const { loadPacket, suggestedDates } = await import('./dealPacket');
    const tax = { ...nvFlip, id: 'tx27', kind: 'taxSale' as const, stage: 'closed' as const };
    saveDeals([tax]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-05', what: 'SID certificate payoff (affidavit filed)', who: 'Me', resolved: true }] };
    savePacket('analyzed:tx27', p);
    expect(stageTasks(tax, 'closed', p, now)[0].key).toBe('sid-paid-affidavit');
    expect(stageHint('closed', tax)).toMatch(/^Paid on time: the Treasurer can’t issue the deed until the city or county files its affidavit/);
    const reo = { ...nvFlip, id: 'dord27', kind: 'reo' as const, plan: 'rent' as const, stage: 'researching' as const };
    saveDeals([reo]);
    savePacket('analyzed:dord27', { ...EMPTY_PACKET, dates: [...suggestedDates(reo).map((what) => ({ when: '', what, who: '' })), { when: '', what: 'Ask about the roof', who: '' }] });
    const auction = { ...reo, kind: 'trustee' as const, plan: 'flip' as const };
    saveDeals([auction]);
    const order = loadPacket('analyzed:dord27').dates.map((x) => x.what).filter((w) => suggestedDates(auction).includes(w));
    expect(order).toEqual(suggestedDates(auction).filter((w) => order.includes(w)));
  });

  it('round 28 tools: an HOA win left at Won after its redemption ended asks; a trustee flip keeps its worked-out window', async () => {
    const { packetSections } = await import('./dealPacket');
    const hoa = { ...nvFlip, id: 'dhoa28', kind: 'hoa' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Sale day', who: 'Agent', resolved: true }, { when: '2026-07-02', what: 'Payment deadline', who: 'Me', resolved: true }] };
    savePacket('analyzed:dhoa28', p);
    expect(dealNextTask(hoa, p, now, 'contract').label).toMatch(/redeem/i);
    expect(stageHint('contract', hoa)).toMatch(/^Paid, and the redemption period is over: move it to the next stage/);
    expect(dealNextTask(hoa, p, now, 'contract').advance?.stage).toBe('closed');
    // Answered 'no one redeemed' at Won: the deed comes next, with no redeem button.
    const answered = { ...p, dates: [...p.dates, { when: '2026-09-02', what: 'Redemption period ends', who: 'Agent', resolved: true }] };
    savePacket('analyzed:dhoa28', answered);
    const t2 = dealNextTask(hoa, answered, now, 'contract');
    expect(t2.label).toMatch(/^No one redeemed .*for the deed$/);
    expect(t2.advance?.stage).toBe('closed');
    expect(t2.advance2?.label ?? '').not.toMatch(/redeemed it/);
    // At the next stage, the deed task leads.
    expect(dealNextTask({ ...hoa, stage: 'closed' }, answered, now, 'closed').label).toMatch(/deed/i);
    const flip = { ...nvFlip, id: 'dfl28', stage: 'owned' as const };
    saveDeals([flip]);
    const fp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-28', what: 'Deed recorded', who: 'Trustee', resolved: true }, { when: '', what: 'Challenge window ends', who: '' }] };
    expect(packetSections(flip, fp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Oct 28, 2026: Challenge window ends \(worked out/);
  });

  it('round 29 verifier: a short sale closing soon with no approval waits for the lender', async () => {
    const short = { ...nvFlip, id: 'dsh29', kind: 'short' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([short]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-10-06', what: 'Closing', who: 'Escrow' }] };
    const t = dealNextTask(short, p, now, 'contract');
    expect(t.label).toMatch(/^Closing is set for Oct 6, 2026, but the lender hasn’t approved the short sale/);
    expect(t.advance).toBeUndefined();
    const approved = { ...p, dates: [...p.dates, { when: '2026-10-02', what: 'Approval notice received', who: 'Lender', resolved: true }] };
    expect(dealNextTask(short, approved, now, 'contract').label).not.toMatch(/hasn’t approved/);
  });

  it('round 30: a short sale whose closing date passed with no approval asks what happened, with an answer for each', async () => {
    const short = { ...nvFlip, id: 'dsh30', kind: 'short' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([short]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-10-01', what: 'Closing', who: 'Escrow' }] };
    savePacket('analyzed:dsh30', p);
    const t = dealNextTask(short, p, now, 'contract');
    expect(t.label).toMatch(/^The closing date \(Oct 1, 2026\) has passed without the lender’s approval/);
    expect(t.record?.row.what).toBe('Approval notice received');
    expect(t.advance2?.stage).toBe('passed');
    const { packetSections } = await import('./dealPacket');
    expect(packetSections(short, p, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Closing, date passed 5 days ago \(no approval yet\)/);
  });

  it('round 30: a paid HOA win with its certificate recorded and the redemption over moves on without “once you have the certificate”', async () => {
    const hoa = { ...nvFlip, id: 'dhw30', kind: 'hoa' as const, stage: 'contract' as const };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-20', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-08-20', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-08-25', what: 'Certificate of sale recorded', who: 'HOA agent', resolved: true }] };
    savePacket('analyzed:dhw30', p);
    const later = new Date('2026-11-11T15:00:00Z');
    const t = dealNextTask(hoa, p, later, 'contract');
    expect(t.label).toMatch(/ended Oct 19, 2026: move it to/);
    expect(t.label).not.toMatch(/once you have the certificate/);
    expect(t.advance?.label).toMatch(/^Move it to/);
    expect(stageHint('closed', hoa)).toMatch(/^The redemption period ended on Oct 19, 2026: find out whether anyone redeemed/);
    const { rentWaitNote } = await import('./dealPacket');
    expect(rentWaitNote('NV', 'hoa', 'dhw30')).toBeNull();
    expect(rentWaitNote('NV', 'hoa')).toMatch(/60 days/);
  });

  it('round 32: a sheriff win moved to the owner stage before its deed keeps the wait and the deed first', async () => {
    const sh = { ...nvFlip, id: 'dsw32', kind: 'court' as const, stage: 'owned' as const };
    saveDeals([sh]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'Sheriff', resolved: true }, { when: '2026-09-10', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-09-20', what: 'Certificate of sale recorded', who: 'Sheriff', resolved: true }] };
    savePacket('analyzed:dsw32', p);
    const later = new Date('2026-11-11T15:00:00Z');
    const keys = stageTasks(sh, 'owned', p, later).map((t) => t.key);
    expect(keys[0]).toBe('redemption-wait');
    expect(dealNextTask(sh, p, later, 'owned').label).not.toMatch(/for sale/);
    const { beforeDeed } = await import('./dealStage');
    expect(beforeDeed(sh)).toBe('2027-09-10');
  });

  it('round 34: a closing tomorrow ranks above a passed sale day; a missed short-sale approval can be answered; Key dates wait for an asked row', async () => {
    const { pressingWeight } = await import('./dealStage');
    expect(pressingWeight({ key: 'closing-week', label: 'Closing is tomorrow', days: 1, urgent: true })).toBeLessThan(pressingWeight({ key: 'bid', label: 'Did you win?' }));
    expect(pressingWeight({ key: 'sid-void', label: 'void' })).toBeLessThan(pressingWeight({ key: 'closing-week', label: 'x', days: 0, urgent: true }));
    const short = { ...nvFlip, id: 'dsa34', kind: 'short' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([short]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-10-01', what: 'Lienholder approval deadline (from the short sale addendum)', who: 'Lender' }, { when: '2026-12-15', what: 'Closing', who: 'Escrow' }] };
    savePacket('analyzed:dsa34', p);
    const t = dealNextTask(short, p, now, 'contract');
    expect(t.record?.row.what).toBe('Approval notice received');
    expect(t.advance2?.stage).toBe('passed');
    const { packetSections } = await import('./dealPacket');
    const tx = { ...nvFlip, id: 'dtk34', kind: 'taxSale' as const, stage: 'owned' as const };
    saveDeals([tx]);
    const tp = { ...EMPTY_PACKET, calendarReviewedFor: 'owned', dates: [{ when: '2026-06-01', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-06-20', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }, { when: '2026-06-25', what: 'Treasurer confirmed the sale had no SID affidavit', who: 'Treasurer', resolved: true }, { when: '', what: 'Recovery-suit window ends', who: '' }] };
    savePacket('analyzed:dtk34', tp);
    expect(packetSections(tx, tp, now).find((x) => x.key === 'dates')!.status).not.toBe('done');
  });

  it('round 33 verifier: a Nevada tax-sale flip moved to the owner stage keeps its window and before-remodel checks first', () => {
    const tx = { ...nvFlip, id: 'dtx33', kind: 'taxSale' as const, stage: 'owned' as const };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-06-20', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }, { when: '2026-06-25', what: 'Treasurer confirmed the sale had no SID affidavit', who: 'Treasurer', resolved: true }] };
    savePacket('analyzed:dtx33', p);
    const keys = stageTasks(tx, 'owned', p, new Date('2026-11-11T15:00:00Z')).map((t) => t.key);
    expect(keys.indexOf('before-remodel')).toBeGreaterThanOrEqual(0);
    expect(keys.indexOf('before-remodel')).toBeLessThan(keys.indexOf('list'));
  });

  it('round 32 verifier: an HOA win moved to the owner stage after its redemption ended asks whether anyone redeemed', async () => {
    const h = { ...nvFlip, id: 'dho32', kind: 'hoa' as const, stage: 'owned' as const };
    saveDeals([h]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-20', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-08-20', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-08-25', what: 'Certificate of sale recorded', who: 'HOA agent', resolved: true }] };
    savePacket('analyzed:dho32', p);
    const later = new Date('2026-11-11T15:00:00Z');
    const t = dealNextTask(h, p, later, 'owned');
    expect(t.label).toMatch(/redemption period .*ended|did anyone redeem|whether anyone redeemed/i);
    expect(t.label).not.toMatch(/^Wait out/);
    expect(stageHint('owned', h)).toMatch(/^The redemption period ended on Oct 19, 2026/);
  });

  it('round 30 verifier: a redemption ticked early still runs, a redeemed deal isn’t “over”, and a passed closing asks for the new date', async () => {
    const { rentWaitNote } = await import('./dealPacket');
    const { redemptionPast } = await import('./dealStage');
    const hoa = { ...nvFlip, id: 'dhe30', kind: 'hoa' as const, stage: 'contract' as const };
    saveDeals([hoa]);
    const ahead = { ...EMPTY_PACKET, dates: [{ when: '2099-08-20', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '', what: 'Redemption period ends', who: '', resolved: true }] };
    savePacket('analyzed:dhe30', ahead);
    expect(redemptionPast(hoa)).toBe(false);
    expect(rentWaitNote('NV', 'hoa', 'dhe30')).toMatch(/60 days/);
    savePacket('analyzed:dhe30', { ...EMPTY_PACKET, dates: [{ when: '2026-08-20', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-09-01', what: 'Redemption money collected', who: 'Owner' }] });
    expect(redemptionPast(hoa)).toBe(false);
    // (Before a win, an old sale day doesn't hide the caution.)
    saveDeals([{ ...hoa, stage: 'researching' as const }]);
    savePacket('analyzed:dhe30', { ...EMPTY_PACKET, dates: [{ when: '2026-01-20', what: 'Sale day', who: 'HOA agent' }] });
    expect(rentWaitNote('NV', 'hoa', 'dhe30')).toMatch(/60 days/);
    const short = { ...nvFlip, id: 'dsp30', kind: 'short' as const, plan: 'rent' as const, stage: 'contract' as const };
    saveDeals([short]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Earnest money due', who: 'Escrow', resolved: true }, { when: '2026-09-20', what: 'Approval notice received', who: 'The lender', resolved: true }, { when: '2026-10-01', what: 'Closing', who: 'Escrow' }] };
    savePacket('analyzed:dsp30', p);
    expect(dealNextTask(short, p, now, 'contract').label).toMatch(/has passed: if it closed, mark it closed; if it moved, type the new closing date/);
  });

  it('round 11 flow: a late SID payoff; Still to add; hints; time order after the deed; registration passed', async () => {
    const { packetSections, dealPacketText } = await import('./dealPacket');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    // Sale Sep 10 -> deadline Sep 30 (passed). The payoff dated Oct 3, open: "I paid it by Sep 30" sets the date.
    const base = [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }];
    const open = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] };
    const t = dealNextTask(tax, open, now, 'contract');
    // After the 20 days the answer is 'paid by the deadline', and it dates the row no later than it.
    expect(t.tick?.label).toBe('I paid it by Sep 30, 2026: mark it handled');
    expect(t.tick?.setWhen).toBe('2026-09-30');
    // Handled with the late date kept: the warning stays, and the next step asks whether the sale stands.
    const late = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City', resolved: true }] };
    const lt = dealNextTask(tax, late, now, 'contract');
    expect(lt.label).toMatch(/after the 20-day deadline \(Sep 30, 2026\): ask the Treasurer in writing whether the sale stands\*/);
    expect(lt.undo?.label).toBe('The Treasurer said the sale is void: mark it');
    // Void: collect the rest of what you paid.
    const voided = { ...late, dates: [...late.dates, { when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] };
    const vt = dealNextTask(tax, voided, now, 'contract');
    expect(vt.label).toMatch(/is void: ask the Treasurer in writing for the rest of what you paid\*/);
    expect(vt.tick).toMatchObject({ label: 'I got the refund: mark it passed', then: 'passed' });
    // Before the deadline, "I paid it" on a later-dated row records today.
    const ahead = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-21', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-08', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] };
    expect(dealNextTask(tax, ahead, now, 'contract').tick).toMatchObject({ label: 'I paid it: mark it handled', setWhen: '2026-10-06' });
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(packetSections({ ...tax, stage: 'contract' }, late, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/— handled, after the 20-day deadline \(ask the Treasurer whether the sale stands\*\)/);
    const stands = { ...late, dates: [...late.dates, { when: '2026-10-05', what: 'Treasurer confirmed the sale stands', who: 'The county treasurer', resolved: true }] };
    expect(dealNextTask(tax, stands, now, 'contract').label).not.toMatch(/whether the sale stands/);
    // The download: the pre-sale parts read "left blank" after a win.
    expect(dealPacketText({ ...tax, stage: 'contract' }, late, now)).toMatch(/YOUR DECISION \[left blank: from before you won\]/);
    // Still to add: no "(if …)" rows.
    const short = { ...nvFlip, kind: 'short' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Contract signed', who: 'Me' }, { when: '2026-10-02', what: 'Approval notice received (dates count from here)', who: 'Lender' }, { when: '', what: 'Defect cancellation deadline (if a defect is disclosed)', who: '' }, { when: '', what: 'Closing', who: '' }] };
    saveDeals([{ ...short, stage: 'contract' }]);
    expect(packetSections({ ...short, stage: 'contract' }, sp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Still to add: the date for Closing\./);
    // A short sale's ticked Closing.
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Closing', who: 'Escrow', resolved: true }] });
    expect(stageHint('contract', short)).toMatch(/^Closed\? Mark it below/);
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

  it('round 12: the late-SID question before reminders; void drops the recording tasks; hints and summary', async () => {
    const { packetSections } = await import('./dealPacket');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const base = [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City', resolved: true }, { when: '2026-10-09', what: 'Treasurer’s deed recorded', who: 'Treasurer' }];
    const late = { ...EMPTY_PACKET, dates: base };
    expect(dealNextTask(tax, late, now, 'contract').key).toBe('sid-void');
    savePacket('analyzed:f1', late);
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(stageHint('contract', tax)).toMatch(/^Paid, but the SID payoff came after the 20-day deadline/);
    expect(packetSections({ ...tax, stage: 'contract' }, late, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Next: ask the Treasurer in writing whether the sale stands\*; the SID payoff was after the 20-day deadline \(Sep 30, 2026\)/);
    const voided = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] };
    expect(dealNextTask(tax, voided, now, 'contract').key).toBe('sid-refund');
    const keys = stageTasks(tax, 'contract', voided, now).map((t) => t.key);
    expect(keys).not.toContain('record');
    expect(keys).not.toContain('ev-insurance');
    savePacket('analyzed:f1', voided);
    expect(stageHint('contract', tax)).toMatch(/^The Treasurer said the sale is void/);
  });

  it('round 12 flow: a bought home keeps its answer; first full month; winning bid; filed and unpaid SID; lien end', async () => {
    const { packetSections, teamRolesFor } = await import('./dealPacket');
    const { liveIn } = await import('./dealStage');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    const home = { ...nvFlip, kind: 'listing' as const, plan: 'rent' as const };
    saveDeals([{ ...home, stage: 'contract' }]);
    setDealStage('f1', 'closed');
    expect(loadDeals()[0].home).toBe('live');
    expect(teamRolesFor(loadDeals()[0])).not.toContain('property_manager');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'invest' } }));
    expect(liveIn({ id: 'f1', kind: 'listing', plan: 'rent' })).toBe(true);
    localStorage.removeItem('deedowl.decide.v1');
    // Bought Oct 2: the first full month (October... ends Nov 30 for a mid-month purchase).
    saveOwned({ f1: { boughtOn: '2026-10-02', months: [] } });
    const ms = stageTasks({ ...loadDeals()[0], stage: 'owned' }, 'owned', EMPTY_PACKET, now).find((x) => x.key === 'month')!;
    expect(ms.label).toMatch(/first full month ends Nov 30, 2026/);
    saveOwned({});
    // At a win, the winning bid.
    const wins = stageTasks(nvFlip, 'contract', EMPTY_PACKET, now).map((x) => x.key);
    expect(wins).toContain('won-price');
    // An affidavit filed and not paid: void, then the refund.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }] };
    const aff = stageTasks(tax, 'contract', sp, now).find((x) => x.key === 'sid-affidavit')!;
    expect(aff.undo?.label).toBe('An affidavit was filed and I didn’t pay it in time: the sale is void');
    const voided = { ...sp, dates: [...sp.dates, { when: '2026-10-06', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] };
    expect(dealNextTask(tax, voided, now, 'contract').key).toBe('sid-refund');
    // A Nevada SID lien: the worked-out 120-day end.
    const lien = { ...nvFlip, kind: 'lien' as const, plan: 'lien' as const };
    saveDeals([{ ...lien, stage: 'closed' }]);
    const lp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'City', resolved: true }] };
    expect(packetSections({ ...lien, stage: 'closed' }, lp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Still to add: the date for Earliest you may act \(unpaid lien\): 2 years after the certificate of sale \(the sale day\) if the parcel had a home or other significant permanent improvement at the sale, as the city or county decides; otherwise 120 days \(about Dec 30, 2026\)\. Plan on 2 years until the Treasurer confirms which applies \(NRS 271\.595\(1\)\)\*\. After that, the owner can still redeem until 60 days after the notice/);
  });

  it('round 12 verifier: the winning bid is marked; postponed summary; void recording rows; homes settled', async () => {
    const { packetSections } = await import('./dealPacket');
    const { settleHomes } = await import('./dealStage');
    const won = stageTasks(nvFlip, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'won-price')!;
    // No bid saved yet: the task says so, with no tick.
    expect(won.label).toBe('No bid is saved for 2210 Mesa Verde Ln yet: enter your winning bid in Analyze');
    expect(won.tick).toBeUndefined();
    expect(stageTasks(nvFlip, 'contract', { ...EMPTY_PACKET, dates: [{ when: '2026-10-06', what: 'Winning bid entered in Analyze', who: 'Me', resolved: true }] }, now).find((x) => x.key === 'won-price')!.done).toBe(true);
    const keys = stageTasks(nvFlip, 'contract', EMPTY_PACKET, now).map((x) => x.key);
    expect(keys.indexOf('ev-insurance')).toBeLessThan(keys.indexOf('won-price'));
    saveDeals([{ ...nvFlip, stage: 'researching' }]);
    const pp = { ...EMPTY_PACKET, postponedSale: true, dates: [{ when: '', what: 'Sale day', who: 'Trustee' }, { when: '2026-10-01', what: 'Sale postponed (was Oct 1, 2026)', who: 'Trustee', resolved: true }] };
    expect(packetSections({ ...nvFlip, stage: 'researching' }, pp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Next: enter the new sale date \(the sale was postponed\)\./);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const vp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-09', what: 'Treasurer’s deed recorded', who: 'Treasurer' }, { when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] };
    savePacket('analyzed:f1', vp);
    saveDeals([{ ...tax, stage: 'contract' }]);
    expect(packetSections({ ...tax, stage: 'contract' }, vp, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Treasurer’s deed recorded \(Treasurer\) — not needed \(the sale is void\)/);
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    saveDeals([{ ...nvFlip, kind: 'listing', plan: 'rent', stage: 'owned' }]);
    settleHomes();
    expect(loadDeals()[0].home).toBe('live');
    localStorage.removeItem('deedowl.decide.v1');
  });

  it('round 13 code: an investor’s bought rental stays a rental; unpaid SID void answer; late SID at Deed recorded', async () => {
    // (An investor: Decide answered with an investment loan.)
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'invest' } }));
    const { liveIn, settleHomes } = await import('./dealStage');
    const rental = { ...nvFlip, kind: 'listing' as const, plan: 'rent' as const };
    saveDeals([{ ...rental, stage: 'contract' }]);
    setDealStage('f1', 'closed');
    expect(loadDeals()[0].home).toBe('rent');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    settleHomes();
    expect(liveIn({ id: 'f1', kind: 'listing', plan: 'rent' })).toBe(false);
    localStorage.removeItem('deedowl.decide.v1');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const unpaid = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-11', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-09-25', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] };
    const t = dealNextTask(tax, unpaid, now, 'contract');
    expect(t.record?.label).toBe('I didn’t pay it by Sep 30, 2026: the sale is void');
    expect(t.record?.row).toMatchObject({ what: 'The sale is void (the SID payoff wasn’t made within 20 days, NRS 361.595(6))', who: 'You' });
    const late = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-03', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City', resolved: true }, { when: '2026-10-04', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }] };
    expect(dealNextTask(tax, late, now, 'closed').key).toBe('sid-void');
    savePacket('analyzed:f1', late);
    expect(stageHint('closed', tax)).toMatch(/after the 20-day deadline: confirm with the Treasurer whether the sale stands\*/);
  });

  it('round 13 UX: answers from the plan are marked; void can be undone; one ranking', async () => {
    const { pressingWeight, trackerAsksHome } = await import('./dealStage');
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    saveDeals([{ ...nvFlip, kind: 'reo', plan: 'rent', stage: 'contract' }]);
    setDealStage('f1', 'owned');
    expect(loadDeals()[0]).toMatchObject({ home: 'live', homeFrom: 'plan' });
    saveOwned({ f1: { boughtOn: '2026-08-01', months: [{ month: '2026-09', rent: 2500, costs: 500, note: '' }] } });
    expect(trackerAsksHome(loadDeals()[0])).toBe(true);
    const { setDealHome } = await import('./dealStage');
    setDealHome('f1', 'live');
    expect(loadDeals()[0].homeFrom).toBeUndefined();
    expect(trackerAsksHome(loadDeals()[0])).toBe(false);
    saveOwned({});
    localStorage.removeItem('deedowl.decide.v1');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const voided = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] };
    expect(dealNextTask(tax, voided, now, 'contract').undo).toEqual({ label: 'Not void after all? Undo', removeRow: 'The sale is void' });
    expect(pressingWeight({ key: 'sid-void', label: '' })).toBeLessThan(pressingWeight({ key: 'date', label: 'Redemption period ends' }));
  });

  it('round 13 flow: paid at the win: no overdue payment; a typed bid can be marked; trustee hint keeps the 90 days', async () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    // The pre-sale "funds ready" tick isn't payment: the reminder stays until the payment is marked.
    saveLog('analyzed:f1', cleanLog({ rows: { terms: { done: true } } }));
    const unpaid = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-09-01', what: 'Payment deadline', who: 'Me' }] };
    expect(dealNextTask(hoa, unpaid, now, 'contract').label).toMatch(/Overdue by .* Payment deadline/);
    const pp = { ...EMPTY_PACKET, dates: [unpaid.dates[0], { ...unpaid.dates[1], resolved: true }] };
    savePacket('analyzed:f1', pp);
    expect(dealNextTask(hoa, pp, now, 'contract').label).not.toMatch(/Overdue by .* Payment deadline/);
    expect(stageTasks(hoa, 'contract', pp, now).find((x) => x.key === 'dates')!.label).toBe('Put 2210 Mesa Verde Ln’s recording date on its calendar');
    saveLog('analyzed:f1', cleanLog({ rows: {} }));
    localStorage.setItem('fsf.calc.rent.f1.v1', JSON.stringify({ atPrice: 150000 }));
    localStorage.setItem('fsf.calc.rent.f1.v1.typed.v1', JSON.stringify(['atPrice']));
    const won = stageTasks({ ...hoa, plan: 'rent' }, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'won-price')!;
    expect(won.tick?.label).toBe('I entered my winning bid: mark it');
    expect(won.produces).toMatch(/instead of the walk-away price/);
    // (Dates well ahead: the hint reads the real clock.)
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2030-01-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2030-01-05', what: 'Deed recorded', who: 'Me', resolved: true }, { when: '2030-02-04', what: 'Challenge window ends', who: 'Title' }] });
    expect(stageHint('closed', nvFlip)).toMatch(/ends Feb 4, 2030, or Apr 1, 2030 for anyone not properly notified/);
  });

  it('round 13 verifier: no question for an investor rental; a home rent of 0; paid calendar; void owned', async () => {
    // (An investor: Decide answered with an investment loan.)
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'invest' } }));
    const { asksHome, forCalendar } = await import('./dealStage');
    const { ownNumbers } = await import('./dealPacket');
    const rental = { ...nvFlip, kind: 'listing' as const, plan: 'rent' as const };
    saveDeals([{ ...rental, stage: 'contract' }]);
    setDealStage('f1', 'owned');
    expect(loadDeals()[0]).toMatchObject({ home: 'rent', homeFrom: 'plan' });
    expect(asksHome(loadDeals()[0])).toBe(false);
    // A home: its price alone counts as its numbers (no rent typed).
    localStorage.setItem('deedowl.decide.v1', JSON.stringify({ answers: { borrow: 'live' } }));
    saveDeals([{ ...rental, stage: 'offer' }]);
    localStorage.setItem('fsf.calc.rent.f1-offer.v1', JSON.stringify({ atPrice: 300000, monthlyRent: 2200 }));
    localStorage.setItem('fsf.calc.rent.f1-offer.v1.typed.v1', JSON.stringify(['atPrice']));
    expect(ownNumbers(loadDeals()[0])).toBe(true);
    localStorage.removeItem('deedowl.decide.v1');
    expect(ownNumbers(loadDeals()[0])).toBe(false);
    // A paid win: the undated payment row doesn't block the calendar.
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const pp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'A', resolved: true }, { when: '', what: 'Payment deadline', who: '', resolved: true }] };
    savePacket('analyzed:f1', pp);
    expect(forCalendar(hoa, pp, 'contract').dates.some((x) => x.what === 'Payment deadline')).toBe(false);
    saveLog('analyzed:f1', cleanLog({ rows: {} }));
    // A void tax sale at Owned: the hint says void.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }] });
    expect(stageHint('owned', tax)).toMatch(/^The Treasurer said the sale is void/);
  });

  it('round 14 code: paying is marked by its own answer; void labels; refund done; Feb 29', async () => {
    const { packetSections, redemptionEndFrom } = await import('./dealPacket').then(async (m) => ({ ...m, ...(await import('./dealStage')) }));
    // The pay task's own answer marks the payment row.
    const pay = stageTasks(nvFlip, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'ev-terms')!;
    expect(pay.tick).toMatchObject({ label: 'I paid: mark it handled', row: 'Payment deadline' });
    expect(pay.done).toBe(false);
    saveLog('analyzed:f1', cleanLog({ rows: { terms: { done: true } } }));
    expect(stageTasks(nvFlip, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'ev-terms')!.done).toBe(false);
    saveLog('analyzed:f1', cleanLog({ rows: {} }));
    // A void sale's label, and the refund received.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const vd = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'The sale is void (the Treasurer said so)', who: 'The county treasurer', resolved: true }, { when: '2026-10-06', what: 'Refund received from the Treasurer', who: 'The county treasurer', resolved: true }] };
    savePacket('analyzed:f1', vd);
    expect(stageLabel('owned', { ...tax, stage: 'owned' })).toBe('Void: refund due');
    // A stage picker lists the other stages by their own names.
    expect(stageLabel('closed', { ...tax, stage: 'owned' })).not.toBe('Void: refund due');
    expect(stageLabel('passed', tax)).not.toBe('Void: refund due');
    saveDeals([{ ...tax, stage: 'passed' }]);
    expect(packetSections({ ...tax, stage: 'passed' }, vd, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/The refund is received: nothing else is due\./);
    expect(stageTasks(tax, 'owned', vd, now).map((x) => x.key)).not.toContain('list');
    // A sheriff sale on Feb 29: a year later is Feb 28.
    const court = { ...nvFlip, kind: 'court' as const };
    expect(redemptionEndFrom(court, { ...EMPTY_PACKET, dates: [{ when: '2028-02-29', what: 'Sale day', who: 'S', resolved: true }] })).toBe('2029-02-28');
  });

  it('round 14 flow: auction questions; sale day leads; passed rows answerable; sheriff records; void by law; roadmap credit', async () => {
    const { needsAnswerNow } = await import('./dealStage');
    const { settledFor } = await import('./roadmapState');
    expect(stageTasks(nvFlip, 'offer', EMPTY_PACKET, now).map((x) => x.key)).toContain('qa');
    // On sale day the sale day leads over an unticked registration row.
    const sd = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Bidder registration (if required)', who: 'Trustee' }, { when: '2026-10-06', what: 'Sale day', who: 'Trustee' }] };
    expect(dealNextTask(nvFlip, sd, now, 'offer').label).not.toMatch(/Bidder registration/);
    // A passed contract row gets an answer; an ended inspection period reads as a window.
    const listing = { ...nvFlip, kind: 'listing' as const };
    const ip = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Inspection period ends', who: 'Me' }] };
    const it2 = dealNextTask(listing, ip, now, 'contract');
    expect(it2.label).toMatch(/inspection period for 2210 Mesa Verde Ln ended 5 days ago/);
    expect(it2.tick?.label).toBe('Inspections done: mark it handled');
    expect(it2.advance2).toMatchObject({ stage: 'passed', label: 'I cancelled in writing: mark it passed' });
    // NV sheriff: the sheriff files the certificate.
    const court = { ...nvFlip, kind: 'court' as const };
    expect(stageTasks(court, 'contract', EMPTY_PACKET, now).find((x) => x.key === 'record')!.label).toMatch(/the sheriff files a copy with the county recorder, NRS 21\.190/);
    // Did you win? counts as needing an answer now.
    const past = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Trustee' }] };
    expect(needsAnswerNow(dealNextTask(nvFlip, past, now, 'offer'))).toBe(true);
    // Void by law (not paid in time): the hint says so.
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'The sale is void (the SID payoff wasn’t made within 20 days, NRS 361.595(6))', who: 'You', resolved: true }] });
    expect(stageHint('contract', tax)).toMatch(/^The SID payoff wasn’t made within 20 days, so the sale is void/);
    // The roadmap credits a property's earlier stages.
    saveDeals([{ ...nvFlip, stage: 'closed' }]);
    const settled = settledFor('analyzed:f1');
    const bid = ROADMAP.find((x) => x.id === STAGE_STEPS.offer[0])!;
    expect(settled(bid)).toBe(true);
  });

  it('round 14 verifier: old void rows still count; possession is never credited', async () => {
    const { loadPacket, savePacket: sp } = await import('./dealPacket');
    const { settledFor } = await import('./roadmapState');
    localStorage.setItem('deedowl.dealPacket.v1', JSON.stringify({ 'analyzed:f1': { dates: [{ when: '2026-10-05', what: 'Treasurer: the sale is void', who: 'The county treasurer', resolved: true }] } }));
    expect(loadPacket('analyzed:f1').dates[0].what).toBe('The sale is void (the Treasurer said so)');
    const { sidState } = await import('./dealStage');
    expect(sidState({ ...nvFlip, kind: 'taxSale' })).toBe('void');
    sp('analyzed:f1', EMPTY_PACKET);
    saveDeals([{ ...nvFlip, kind: 'court', stage: 'closed' }]);
    const settled = settledFor('analyzed:f1');
    expect(settled(ROADMAP.find((x) => x.id === 'a-possess')!)).toBe(false);
    expect(settled(ROADMAP.find((x) => x.id === 'a-bid')!)).toBe(true);
  });

  it('round 15 code: no shortcut answer on the deed or a stage event; a renamed payment row can be paid', async () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const dp = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-10-01', what: 'Deed delivered (if no one redeemed)', who: 'A' }] };
    expect(dealNextTask(hoa, dp, now, 'closed').tick?.label ?? '').not.toMatch(/no longer applies/);
    const listing = { ...nvFlip, kind: 'listing' as const };
    const cl = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Closing', who: 'Escrow' }] };
    expect(dealNextTask(listing, cl, now, 'contract').tick?.label ?? '').not.toMatch(/no longer applies/);
    const rp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Payment deadline for the balance', who: 'Me', resolved: true }] };
    expect(stageTasks(nvFlip, 'contract', rp, now).find((x) => x.key === 'ev-terms')!.done).toBe(true);
  });

  it('round 15 flow: the winning bid after the deed; a past recording date; SID yes; future closing; passed vs not needed', async () => {
    const { packetSections } = await import('./dealPacket');
    expect(stageTasks(nvFlip, 'closed', EMPTY_PACKET, now).map((x) => x.key)).toContain('won-price');
    const rp = { ...EMPTY_PACKET, dates: [{ when: '2026-07-08', what: 'Deed recorded', who: 'Trustee' }] };
    const t = dealNextTask(nvFlip, rp, now, 'contract');
    expect(t.label).toMatch(/^Deed recorded for 2210 Mesa Verde Ln: expected on Jul 8, 2026. If it’s recorded, mark it handled/);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-01', what: 'Payment deadline', who: 'Me', resolved: true }] };
    expect(stageTasks(tax, 'contract', sp, now).find((x) => x.key === 'sid-affidavit')!.redate).toMatchObject({ when: '2026-10-21', who: 'Me' });
    const listing = { ...nvFlip, kind: 'listing' as const };
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-12-10', what: 'Closing', who: 'Escrow', resolved: true }] });
    expect(stageHint('contract', listing)).not.toMatch(/^Closed\?/);
    saveDeals([{ ...listing, stage: 'closed' }]);
    const lines = packetSections({ ...listing, stage: 'closed' }, { ...EMPTY_PACKET, dates: [{ when: '2026-11-20', what: 'Seller’s disclosure form due', who: 'Seller' }] }, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).toMatch(/Seller’s disclosure form due \(Seller\) — not needed now \(it closed\)/);
  });

  it('says so when the deed row is ticked at a win', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Deed recorded', who: 'Trustee', resolved: true }] };
    expect(stageTasks(nvFlip, 'contract', p, now).find((x) => x.key === 'record')!.label).toMatch(/^The deed for 2210 Mesa Verde Ln is recorded/);
  });

  it('round 15: a passed deed row asks whether anyone redeemed; a closing ticked early; the SID payoff leads; I paid leaves the date blank', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-10-01', what: 'Deed delivered (if no one redeemed)', who: 'HOA agent' }] };
    const t = dealNextTask(hoa, p, now, 'closed');
    expect(t.label).toMatch(/did anyone redeem\?/);
    expect(t.tick).toMatchObject({ label: 'No one redeemed: mark it handled', row: 'Redemption period ends' });
    expect(t.answer).toBe(true);
    const offer = { ...deal, kind: 'listing' as const };
    const early = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Closing', who: 'Title', resolved: true }, { when: '2026-10-08', what: 'Inspection period ends', who: 'Me' }] };
    expect(dealNextTask(offer, early, now, 'contract').key).not.toBe('close');
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sid = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-19', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City' }] };
    expect(dealNextTask(tax, sid, now, 'contract').label).toMatch(/SID certificate payoff/);
    const pay = stageTasks({ ...nvFlip, kind: 'trustee' as const }, 'contract', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }] }, now).find((x) => x.key === 'ev-terms');
    if (pay?.tick) expect(pay.tick.noDate).toBe(true);
  });

  it('round 16: a split payment stays open; the redemption end isn’t passed at the win; an early deed date is checked; an early closing tick', async () => {
    const { packetSections } = await import('./dealPacket');
    const split = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-05', what: 'Payment deadline (deposit at the sale)', who: 'Me', resolved: true }, { when: '2026-10-08', what: 'Payment deadline (balance, next business day)', who: 'Me' }] };
    savePacket('analyzed:f1', split);
    saveDeals([{ ...nvFlip, stage: 'contract' }]);
    expect(dealNextTask(nvFlip, split, now, 'contract').label).toMatch(/Payment deadline \(balance/);
    expect(packetSections({ ...nvFlip, stage: 'contract' }, split, now).find((x) => x.key === 'dates')!.lines.join(' | ')).not.toMatch(/balance, next business day\) \(Me\) — passed/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-10-02', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-10-03', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2027-01-01', what: 'Redemption period ends', who: 'HOA' }] };
    savePacket('analyzed:f1', won);
    saveDeals([{ ...hoa, stage: 'contract' }]);
    expect(packetSections({ ...hoa, stage: 'contract' }, won, now).find((x) => x.key === 'dates')!.lines.join(' | ')).not.toMatch(/Redemption period ends \(HOA\) — passed/);
    const court = { ...nvFlip, kind: 'court' as const };
    const early = { ...EMPTY_PACKET, dates: [{ when: '2026-08-03', what: 'Sale day', who: 'S', resolved: true }, { when: '2027-08-03', what: 'Redemption period ends', who: 'S' }, { when: '2026-10-01', what: 'Deed delivered (if no one redeemed)', who: 'S' }] };
    const t = dealNextTask(court, early, now, 'closed');
    expect(t.label).toMatch(/is before the redemption period ends/);
    expect(t.tick?.label).not.toBe('No one redeemed: mark it handled');
    const offer = { ...deal, kind: 'listing' as const };
    const ahead = { ...EMPTY_PACKET, dates: [{ when: '2026-12-01', what: 'Closing', who: 'Title', resolved: true }] };
    expect(dealNextTask(offer, ahead, now, 'contract').key).not.toBe('close');
  });

  it('round 16 verifier: earnest money back after passing; a passed redemption end at the win; the early deed in Key dates', async () => {
    const { packetSections } = await import('./dealPacket');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Carson City', kind: 'listing' as const };
    const passed = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Earnest money due', who: 'Me', resolved: true }, { when: '2026-12-01', what: 'Closing', who: 'Title' }] };
    const t = dealNextTask(offer, passed, now, 'passed');
    expect(t.key).toBe('deposit-back');
    saveDeals([{ ...offer, stage: 'passed' }]);
    expect(packetSections({ ...offer, stage: 'passed' }, passed, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Closing \(Title\) — not needed \(you passed\)/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-08-02', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-08-03', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-01', what: 'Redemption period ends', who: 'HOA' }] };
    expect(dealNextTask(hoa, won, now, 'contract').label).toMatch(/[Rr]edemption/);
    const court = { ...nvFlip, kind: 'court' as const };
    const early = { ...EMPTY_PACKET, dates: [{ when: '2026-08-03', what: 'Sale day', who: 'S', resolved: true }, { when: '2027-08-03', what: 'Redemption period ends', who: 'S' }, { when: '2026-10-01', what: 'Deed delivered (if no one redeemed)', who: 'S' }] };
    saveDeals([{ ...court, stage: 'closed' }]);
    expect(packetSections({ ...court, stage: 'closed' }, early, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Next: the deed date you entered/);
  });

  it('round 17: an early deed date is checked at the win and before it passes; the winning bid comes before the redemption wait', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-09-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-31', what: 'Redemption period ends', who: 'HOA' }, { when: '2026-09-20', what: 'Deed delivered (if no one redeemed)', who: 'HOA agent' }] };
    expect(dealNextTask(hoa, won, now, 'contract').label).toMatch(/is before the redemption period ends/);
    const soon = { ...EMPTY_PACKET, dates: [{ when: '2026-08-26', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-10-25', what: 'Redemption period ends', who: 'HOA' }, { when: '2026-10-08', what: 'Deed delivered (if no one redeemed)', who: 'HOA agent' }] };
    expect(dealNextTask(hoa, soon, now, 'closed').label).toMatch(/is before the redemption period ends/);
    const keys = stageTasks({ ...nvFlip, kind: 'court' as const }, 'closed', { ...EMPTY_PACKET, dates: [{ when: '2026-08-03', what: 'Sale day', who: 'S', resolved: true }] }, now).map((t) => t.key);
    if (keys.includes('won-price')) expect(keys.indexOf('won-price')).toBeLessThan(keys.indexOf('redemption-wait'));
  });

  it('round 17 flow: "It was redeemed" during the wait; the inspection answers before the deadline; a short sale waits for approval', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const wait = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'HOA', resolved: true }, { when: '2026-11-19', what: 'Redemption period ends', who: 'HOA' }] };
    const t = dealNextTask(hoa, wait, now, 'closed');
    expect(t.advance2?.label).toBe('Someone redeemed it: collect the payoff (the redemption period runs until Nov 19, 2026)');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    const insp = { ...EMPTY_PACKET, dates: [{ when: '2026-09-30', what: 'Contract signed', who: 'Me', resolved: true }, { when: '2026-09-30', what: 'Earnest money due', who: 'Me', resolved: true }, { when: '2026-10-09', what: 'Inspection period ends', who: 'Me' }] };
    const i = dealNextTask(offer, insp, now, 'contract');
    expect(i.advance2?.label).toBe('I cancelled in writing: mark it passed');
    expect(i.tick?.label).toBe('Inspections done: mark it handled');
    const short = { ...offer, kind: 'short' as const };
    const keys = stageTasks(short, 'contract', insp, now).map((x) => x.key);
    expect(keys.indexOf('short-approval')).toBeLessThan(keys.indexOf('inspection-complete'));
  });

  it('round 17 verifier: a roadmap step ticks one saved row; any buy box field counts', async () => {
    const { settleStepRow } = await import('./dealStage');
    const { loadPacket } = await import('./dealPacket');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    saveDeals([{ ...offer, stage: 'contract' }]);
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Me' }, { when: '2026-10-20', what: 'Earnest money due (additional deposit after inspections)', who: 'Me' }] });
    settleStepRow('analyzed:f1', 'deposit');
    const rows = loadPacket('analyzed:f1').dates;
    expect(rows.map((x) => !!x.resolved)).toEqual([true, false]);
    localStorage.setItem('deedowl.buybox.v1', JSON.stringify({ area: 'Reno' }));
    const p = { ...EMPTY_PACKET, fit: 'fits' as const, fitWhy: 'In Reno' };
    expect(stageTasks({ ...offer, stage: 'researching' }, 'researching', p, now).find((t) => t.key === 'fit')?.done).toBe(true);
  });

  it('round 18: a step marked done before its row exists settles the row when it is added', async () => {
    const { loadPacket } = await import('./dealPacket');
    const { DEAL_STEPS_KEY } = await import('./roadmapDeals');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    saveDeals([{ ...offer, stage: 'contract' }]);
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: ['deposit'], status: {} } }));
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Me' }] });
    expect(loadPacket('analyzed:f1').dates[0].resolved).toBe(true);
    savePacket('analyzed:f1', { ...loadPacket('analyzed:f1'), dates: [...loadPacket('analyzed:f1').dates, { when: '2026-10-20', what: 'Earnest money due (additional deposit)', who: 'Me' }] });
    expect(loadPacket('analyzed:f1').dates.map((x) => !!x.resolved)).toEqual([true, false]);
    expect(dealNextTask(offer, { ...EMPTY_PACKET }, now, 'passed').key).toBe('deposit-back');
  });

  it('round 18 flow: a passed cancel-by window is a question, and the inspection due tomorrow leads over it', () => {
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Clark', kind: 'reo' as const };
    const base = [{ when: '2026-09-28', what: 'Contract signed', who: 'Me', resolved: true }, { when: '2026-09-29', what: 'Earnest money due', who: 'Me', resolved: true }];
    const win = { ...EMPTY_PACKET, dates: [...base, { when: '2026-10-05', what: 'HOA resale package: cancel by (if in an HOA)', who: 'Me' }] };
    const t = dealNextTask(offer, win, now, 'contract');
    expect(t.label).toMatch(/right to cancel over the HOA resale package ended/);
    expect(t.advance2?.label).toBe('I cancelled in writing: mark it passed');
    const both = { ...EMPTY_PACKET, dates: [...win.dates, { when: '2026-10-07', what: 'Inspection period ends', who: 'Me' }] };
    expect(dealNextTask(offer, both, now, 'contract').label).toMatch(/Inspection period ends/);
  });

  it('round 18 verifier: a row unticked after a step settled it stays unticked; To do undoes it; a deposit that does not apply is not money sent', async () => {
    const { loadPacket } = await import('./dealPacket');
    const { DEAL_STEPS_KEY } = await import('./roadmapDeals');
    const { unsettleStep, settleAllSteps } = await import('./dealStage');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    saveDeals([{ ...offer, stage: 'contract' }]);
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: ['inspect'], status: {} } }));
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-10', what: 'Inspection period ends', who: 'Me' }] });
    expect(loadPacket('analyzed:f1').dates[0].resolved).toBe(true);
    // (Unticked on the page: the same row, its step tag kept.)
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ ...loadPacket('analyzed:f1').dates[0], resolved: false }] });
    expect(loadPacket('analyzed:f1').dates[0].resolved).toBeFalsy();
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-10', what: 'Inspection period ends', who: 'Me', resolved: true }] });
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: [], status: {} } }));
    unsettleStep('analyzed:f1', 'inspect');
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f2': { done: [], status: { deposit: 'na' } } }));
    saveDeals([{ ...offer, id: 'f2', stage: 'passed' }]);
    settleAllSteps('analyzed:f2');
    expect(dealNextTask({ ...offer, id: 'f2' }, { ...EMPTY_PACKET }, now, 'passed').key).not.toBe('deposit-back');
  });

  it('round 19: the row carries its step, so a rename keeps it and To do unticks it', async () => {
    const { loadPacket } = await import('./dealPacket');
    const { DEAL_STEPS_KEY } = await import('./roadmapDeals');
    const { unsettleStep } = await import('./dealStage');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    saveDeals([{ ...offer, stage: 'contract' }]);
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: ['deposit'], status: {} } }));
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Me' }] });
    const r = loadPacket('analyzed:f1').dates[0];
    expect(r).toMatchObject({ resolved: true, step: 'deposit' });
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ ...r, what: 'Earnest money due (to Ticor)' }] });
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: [], status: {} } }));
    unsettleStep('analyzed:f1', 'deposit');
    const after = loadPacket('analyzed:f1').dates[0];
    expect(after.resolved).toBeFalsy();
    expect(after.step).toBeUndefined();
  });

  it('round 19 verifier: the old step record moves onto the rows; a won sale day needs no who', async () => {
    const { loadPacket, calendarReady } = await import('./dealPacket');
    const { DEAL_STEPS_KEY } = await import('./roadmapDeals');
    const { settleAllSteps } = await import('./dealStage');
    const offer = { ...deal, id: 'f1', state: 'NV' as const, county: 'Washoe', kind: 'listing' as const };
    saveDeals([{ ...offer, stage: 'contract' }]);
    localStorage.setItem(DEAL_STEPS_KEY, JSON.stringify({ 'analyzed:f1': { done: ['deposit'], status: {} } }));
    localStorage.setItem('deedowl.stepRows.v1', JSON.stringify({ 'analyzed:f1': { deposit: 'Earnest money due' } }));
    localStorage.setItem('deedowl.dealPacket.v1', JSON.stringify({ 'analyzed:f1': { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Earnest money due', who: 'Me' }] } }));
    settleAllSteps('analyzed:f1');
    const r = loadPacket('analyzed:f1').dates[0];
    expect(r.step).toBe('deposit');
    expect(r.resolved).toBeFalsy();
    expect(localStorage.getItem('deedowl.stepRows.v1')).toBeNull();
    expect(calendarReady({ ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: '' }, { when: '', what: 'Payment deadline', who: 'Me', resolved: true }] }, 'contract')).toBe(true);
  });

  it('round 20: with Decide skipped, closing a listed home leaves the home question open', () => {
    const rental = { ...deal, id: 'f1', state: 'NV' as const, county: 'Clark', kind: 'listing' as const, plan: 'rent' as const };
    saveDeals([{ ...rental, stage: 'contract' }]);
    setDealStage('f1', 'closed');
    expect(loadDeals()[0].home).toBeUndefined();
  });
});

describe('round 39: Eureka sealed-bid sale', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });
  it('marks the payment made with the bid when won, and asks about the enclosed payment when lost', () => {
    const eu: Deal = { ...deal, id: 'deu39', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([eu]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Treasurer' }] };
    savePacket('analyzed:deu39', p);
    const t = dealNextTask(eu, p, now, 'offer');
    expect(t.advance?.ticks).toEqual(['Sealed bid and full payment due']);
    expect(t.advance2?.label).toMatch(/enclosed payment/);
  });
  it('round 39 verifier: a win from the stage list (or any button) marks the sealed bid and its payment made', async () => {
    const { loadPacket } = await import('./dealPacket');
    const eu: Deal = { ...deal, id: 'deu40', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'researching' };
    saveDeals([eu]);
    savePacket('analyzed:deu40', { ...EMPTY_PACKET, dates: [{ when: '2026-09-30', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-10-01', what: 'Sale day', who: 'Treasurer' }] });
    setDealStage('deu40', 'contract');
    const p = loadPacket('analyzed:deu40');
    expect(p.dates.find((x) => x.what === 'Sealed bid and full payment due')?.resolved).toBe(true);
    expect(p.dates.find((x) => x.what === 'Sealed bid and full payment due')?.when).toBe('2026-09-30');
    expect(p.dates.some((x) => x.what === 'Payment deadline')).toBe(false);
    const won = loadDeals()[0];
    const t = dealNextTask(won, p, now, 'contract');
    expect(t.label).not.toMatch(/Pay for|Overdue/);
    expect(stageHint('contract', won)).not.toMatch(/Payment and recording deadlines are running/);
  });
  it('round 40: a blank sealed-bid row is dated the day before the sale on a win, and sale day leads over it', async () => {
    const { loadPacket } = await import('./dealPacket');
    const eu: Deal = { ...deal, id: 'deu41', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([eu]);
    const today = now.toLocaleDateString('en-CA');
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const sp = { ...EMPTY_PACKET, dates: [{ when: y.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You' }, { when: today, what: 'Sale day', who: 'Treasurer' }] };
    savePacket('analyzed:deu41', sp);
    const t = dealNextTask(eu, sp, now, 'offer');
    expect(t.label).not.toMatch(/Overdue/);
    expect(t.advance?.label).toMatch(/won: mark it won/);
    expect(t.advance?.tickWhen).toBe(y.toLocaleDateString('en-CA'));
    savePacket('analyzed:deu41', { ...EMPTY_PACKET, dates: [{ when: '', what: 'Sealed bid and full payment due', who: '' }, { when: '2026-10-01', what: 'Sale day', who: 'Treasurer' }] });
    setDealStage('deu41', 'contract');
    expect(loadPacket('analyzed:deu41').dates.find((x) => x.what === 'Sealed bid and full payment due')).toMatchObject({ resolved: true, when: '2026-09-30' });
  });
  it('round 40: the sealed-bid row has its own "I sent it" button before the sale', () => {
    const eu: Deal = { ...deal, id: 'deu42', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([eu]);
    const t1 = new Date(now); t1.setDate(t1.getDate() + 1);
    const t2 = new Date(now); t2.setDate(t2.getDate() + 2);
    const sp = { ...EMPTY_PACKET, dates: [{ when: t1.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You' }, { when: t2.toLocaleDateString('en-CA'), what: 'Sale day', who: 'Treasurer' }] };
    const t = dealNextTask(eu, sp, now, 'offer');
    expect(t.label).toMatch(/Send the sealed bid and full payment/);
    expect(t.tick?.label).toMatch(/I sent my sealed bid/);
  });
  it('round 40 verifier: a ticked sealed-bid row carried to a Clark sale is not its payment', async () => {
    const { paidIn, fillSealedDay } = await import('./dealStage');
    const rows = { ...EMPTY_PACKET, dates: [{ when: '2026-09-30', what: 'Sealed bid and full payment due', who: 'You', resolved: true }, { when: '2026-10-01', what: 'Sale day', who: 'T' }, { when: '2026-10-01', what: 'Payment deadline', who: 'Me' }] };
    expect(paidIn(rows, { state: 'NV', kind: 'taxSale', county: 'Clark' })).toBe(false);
    expect(paidIn(rows, { state: 'NV', kind: 'taxSale', county: 'Eureka' })).toBe(true);
    const blank = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Sealed bid and full payment due', who: '' }, { when: '2026-12-02', what: 'Sale day', who: 'T' }] };
    expect(fillSealedDay({ state: 'NV', kind: 'taxSale', county: 'Eureka' }, blank).dates[0].when).toBe('2026-12-01');
    expect(fillSealedDay({ state: 'NV', kind: 'taxSale', county: 'Clark' }, blank).dates[0].when).toBe('');
  });
  it('round 43: a dated sealed-bid deadline is kept when the sale date changes (the hint flags it), and a sent bid counts down only to the sale', async () => {
    const { fillSealedDay } = await import('./dealStage');
    const eu = { state: 'NV' as const, kind: 'taxSale' as const, county: 'Eureka' };
    const moved = { ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-11-13', what: 'Sale day', who: 'T' }] };
    // (Nov 19 was the usual day before the Nov 20 sale, so it was filled in: it follows the sale to Nov 13.)
    expect(fillSealedDay(eu, { ...moved, sealedFor: '2026-11-20' }).dates[0].when).toBe('2026-11-12');
    // (Typing the sale date passes through a blank one: the filled-in deadline still follows.)
    expect(fillSealedDay(eu, { ...moved, dates: [moved.dates[0], { ...moved.dates[1], when: '' }], sealedFor: '2026-11-20' }).dates[0].when).toBe('2026-11-19');
    expect(fillSealedDay(eu, { ...moved, sealedFor: '2026-11-20' }).sealedFor).toBe('2026-11-13');
    // (A date from the notice that wasn't the usual day before is kept.)
    expect(fillSealedDay(eu, moved, { ...moved, dates: [moved.dates[0], { ...moved.dates[1], when: '2026-11-25' }] }).dates[0].when).toBe('2026-11-19');
    // (A deadline still on the usual day before the old sale date, the one filled in, follows the sale.)
    const filled = { ...EMPTY_PACKET, dates: [{ when: '2026-11-11', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-11-22', what: 'Sale day', who: 'T' }] };
    // (Nov 22, 2026 is a Sunday: the last day the Treasurer's office is open before it is Thursday, Nov 19.)
    expect(fillSealedDay(eu, { ...filled, sealedFor: '2026-11-12' }).dates[0].when).toBe('2026-11-19');
    // (A deadline filled in before round 45 on a closed day (Sun Nov 15 for a Monday sale) moves to Thursday.)
    const oldSun = { ...EMPTY_PACKET, dates: [{ when: '2026-11-15', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-11-16', what: 'Sale day', who: 'T' }] };
    expect(fillSealedDay(eu, { ...oldSun, sealedFor: '2026-11-16' }).dates[0].when).toBe('2026-11-12');
    expect(fillSealedDay(eu, oldSun).dates[0].when).toBe('2026-11-12');
    // (An older packet still on the usual deadline gets sealedFor, so later edits move it.)
    expect(fillSealedDay(eu, { ...EMPTY_PACKET, dates: [{ when: '2026-11-11', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-11-12', what: 'Sale day', who: 'T' }] }).sealedFor).toBe('2026-11-12');
    const df: Deal = { ...deal, id: 'deu45', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([df]);
    savePacket('analyzed:deu45', moved);
    expect(stageHint('offer', df)).toMatch(/is on or after the sale .*Check the notice and fix the date/);
    // (A date typed first, then the sale day added for the first time, is kept.)
    const firstSale = { ...EMPTY_PACKET, dates: [{ when: '2026-12-03', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-12-07', what: 'Sale day', who: 'T' }] };
    expect(fillSealedDay(eu, firstSale, { ...firstSale, dates: [firstSale.dates[0], { ...firstSale.dates[1], when: '' }] }).dates[0].when).toBe('2026-12-03');
    // (A date typed from the notice, with the sale unchanged, is kept.)
    expect(fillSealedDay(eu, moved, moved).dates[0].when).toBe('2026-11-19');
    const sent = { ...moved, dates: [{ ...moved.dates[0], resolved: true }, moved.dates[1]] };
    expect(fillSealedDay(eu, sent).dates[0].when).toBe('2026-11-19');
    const d: Deal = { ...deal, id: 'deu43', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([d]);
    const t2 = new Date(now); t2.setDate(t2.getDate() + 2);
    const t1 = new Date(now); t1.setDate(t1.getDate() + 1);
    const p = { ...EMPTY_PACKET, dates: [{ when: t1.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You', resolved: true }, { when: t2.toLocaleDateString('en-CA'), what: 'Sale day', who: 'T' }] };
    const t = dealNextTask(d, p, now, 'offer');
    expect(t.label).not.toMatch(/walk-away/);
  });
  it('round 42: the arrival rule reaches My deals and the download; a sent bid gets a waiting hint', () => {
    const d: Deal = { ...deal, id: 'deu44', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([d]);
    const t2 = new Date(now); t2.setDate(t2.getDate() + 3);
    const t1 = new Date(now); t1.setDate(t1.getDate() + 2);
    const open = { ...EMPTY_PACKET, dates: [{ when: t1.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You' }, { when: t2.toLocaleDateString('en-CA'), what: 'Sale day', who: 'T' }] };
    expect(nextAction(d, open, now).text).toMatch(/must reach the Eureka County Treasurer’s office by the notice’s deadline that day \(usually 4 p\.m\./);
    // (The hint reads today's date.)
    const r1 = new Date(); r1.setDate(r1.getDate() + 2); const r2 = new Date(); r2.setDate(r2.getDate() + 3);
    savePacket('analyzed:deu44', { ...EMPTY_PACKET, dates: [{ when: r1.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You', resolved: true }, { when: r2.toLocaleDateString('en-CA'), what: 'Sale day', who: 'T' }] });
    expect(stageHint('offer', d)).toMatch(/Your sealed bid and payment are with the Eureka County Treasurer/);
  });
  it('round 46: Nevada legal holidays move the filled-in bid deadline', async () => {
    const { nvHoliday, sealedDay } = await import('./dealStage');
    expect(nvHoliday(new Date(2027, 0, 18))).toBe(true); // Martin Luther King Jr. Day
    expect(nvHoliday(new Date(2026, 10, 26))).toBe(true); // Thanksgiving
    expect(nvHoliday(new Date(2026, 9, 30))).toBe(true); // Nevada Day (last Friday of October)
    expect(nvHoliday(new Date(2026, 10, 12))).toBe(false);
    expect(nvHoliday(new Date(2027, 11, 31))).toBe(true); // New Year's Day 2028 (a Saturday), observed Friday
    expect(nvHoliday(new Date(2028, 11, 31))).toBe(false);
    // (A deadline round 45 filled on Thanksgiving for a Monday Nov 30, 2026 sale moves to Wednesday, Nov 25.)
    const { fillSealedDay } = await import('./dealStage');
    const tg = { ...EMPTY_PACKET, sealedFor: '2026-11-30', dates: [{ when: '2026-11-26', what: 'Sealed bid and full payment due', who: 'You' }, { when: '2026-11-30', what: 'Sale day', who: 'T' }] };
    expect(fillSealedDay({ state: 'NV', kind: 'taxSale', county: 'Eureka' }, tg).dates[0].when).toBe('2026-11-25');
    // (A Tuesday Jan 19, 2027 sale: Monday is a holiday, so Thursday Jan 14.)
    expect(sealedDay({ ...EMPTY_PACKET, dates: [{ when: '2027-01-19', what: 'Sale day', who: 'T' }] })).toBe('2027-01-14');
  });
  it('round 47: a missed sealed-bid deadline asks whether the bid went in, with a pass answer', () => {
    const d: Deal = { ...deal, id: 'deu47', state: 'NV', county: 'Eureka', kind: 'taxSale', plan: 'flip', stage: 'researching' };
    saveDeals([d]);
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const t3 = new Date(now); t3.setDate(t3.getDate() + 3);
    const p = { ...EMPTY_PACKET, dates: [{ when: y.toLocaleDateString('en-CA'), what: 'Sealed bid and full payment due', who: 'You' }, { when: t3.toLocaleDateString('en-CA'), what: 'Sale day', who: 'T' }] };
    const t = dealNextTask(d, p, now, 'researching');
    // (The usual deadline, the day before the sale, is still ahead: the reader is sent to the notice.)
    expect(t.label).toMatch(/deadline you entered .* has passed, but Eureka’s usual deadline is/);
    expect(t.label).not.toMatch(/Overdue/);
    expect(t.tick?.label).toMatch(/I sent my sealed bid and payment in time/);
    // (The usual deadline is still ahead: the pass answer is about the notice's deadline.)
    expect(t.advance2?.label).toMatch(/The notice’s deadline passed without my bid/);
    expect(t.redate?.label).toMatch(/change it to/);
  });
  it('round 39 verifier: other sales keep their payment step when moved by the stage list', async () => {
    const { loadPacket } = await import('./dealPacket');
    const cl: Deal = { ...deal, id: 'dcl40', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'offer' };
    saveDeals([cl]);
    savePacket('analyzed:dcl40', { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Treasurer' }] });
    setDealStage('dcl40', 'contract');
    expect(loadPacket('analyzed:dcl40').dates.some((x) => x.what === 'Payment deadline')).toBe(false);
  });
});
