import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanDeal, loadDeals, saveDeals, type Deal } from './analyze';
import { EMPTY_PACKET, nextAction, savePacket } from './dealPacket';
import { countyTermsNote, dayOf, owedAfterPass, dealNextTask, earlyMoveNote, inferStage, paymentPassed, saleOverFor, withRow, setDealStage, STAGE_STEPS, stageHint, stageLabel, stageOf, stageTasks } from './dealStage';
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
  expect(t.label).toMatch(/(Sale day has passed for 123 Main St|The sale day for 123 Main St is over in Nevada): did you win\?/);
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
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-09', what: 'Deed recorded', who: 'County', resolved: true }, { when: '2026-09-08', what: 'Challenge window ends', who: 'Title company' }] };
    expect(dealNextTask({ ...nvFlip, stage: 'closed' }, p, now, 'closed').label).toBe('The challenge window ended 28 days ago: ask your title company or attorney whether any suit was filed, and whether the 90-day limit for anyone not properly notified (NRS 107.080(6)) still runs. If none was filed, mark it handled.');
  });

  it('drops past registration and signing rows once they’re behind you, and keeps “It was redeemed” in the last week', () => {
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Bidder registration (if required)', who: 'me' }, { when: '2026-10-02', what: 'Sale day', who: '' }, { when: '2026-10-05', what: 'Payment deadline', who: 'Trustee' }] };
    expect(dealNextTask(nvFlip, won, now, 'contract').label).toMatch(/^The payment deadline for .* passed .*contact the trustee and an attorney today.*NRS 107.083/);
    const signed = { ...EMPTY_PACKET, dates: [{ when: '2026-10-05', what: 'Contract signed', who: 'Agent' }] };
    expect(dealNextTask({ ...nvFlip, kind: 'short', plan: 'rent' }, signed, now, 'contract').label).toMatch(/^Send the earnest money/);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const wait = { ...EMPTY_PACKET, dates: [{ when: '2026-08-10', what: 'Sale day', who: 'Agent', resolved: true }, { when: '2026-10-09', what: 'Redemption period ends', who: 'Former owner' }] };
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
    const owned = { ...EMPTY_PACKET, dates: [{ when: '2026-07-03', what: 'Sale day', who: 'Agent', resolved: true }, { when: '2026-09-01', what: 'Redemption period ends', who: 'Owner' }, { when: '2026-09-20', what: 'Deed delivered (if no one redeemed)', who: 'Agent' }] };
    expect(dealNextTask({ ...hoa, plan: 'rent' }, owned, now, 'owned').urgent).toBeFalsy();
    const t = dealNextTask(hoa, { ...EMPTY_PACKET, dates: [owned.dates[0], owned.dates[1]] }, now, 'closed');
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
    expect(dealNextTask(nvFlip, p, now, 'contract').label).toMatch(/payment deadline/i);
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const d = { ...EMPTY_PACKET, dates: [{ when: '2026-07-03', what: 'Sale day', who: 'Agent', resolved: true }, { when: '2026-09-01', what: 'Redemption period ends', who: 'Owner', resolved: true }, { when: '2026-10-04', what: 'Deed delivered (if no one redeemed)', who: 'Agent' }] };
    const t = dealNextTask(hoa, d, now, 'closed');
    expect(t.tick?.label).toBe('I have the deed, and it’s recorded: mark it handled');
    expect(t.urgent).toBe(false);
  });

  it('round 7: a ticked undated wait counts; a paid-off lien’s rows stop reminding; the lien reminder carries the payoff button', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const };
    const undated = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Sale day', who: 'Owner', resolved: true }, { when: '', what: 'Redemption period ends', who: 'Owner', resolved: true }] };
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
    const cw = { ...EMPTY_PACKET, dates: [{ when: '2026-09-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-01', what: 'Deed recorded', who: 'County', resolved: true }, { when: '2026-10-01', what: 'Challenge window ends', who: 'Title' }] };
    expect(dealNextTask(nvFlip, cw, now, 'closed').redate?.when).toBe('2026-11-30');
  });

  it('an unpaid Clark tax sale and Nevada IRS win after the sale day say when payment was due', () => {
    const now2 = new Date('2026-11-14T18:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    const tax = { ...nvFlip, kind: 'taxSale' as const, stage: 'contract' as const };
    savePacket(`analyzed:${tax.id}`, p);
    const tt = stageTasks(tax, 'contract', p, now2).find((x) => x.key === 'ev-terms')!;
    expect(tt.label).toMatch(/Clark County’s payment was due by 1:00 p.m. Nevada time on the sale day/);
    expect(tt.advance2?.stage).toBe('passed');
    const irs = { ...nvFlip, kind: 'irs' as const, stage: 'contract' as const };
    const it2 = stageTasks(irs, 'contract', p, now2).find((x) => x.key === 'ev-terms')!;
    expect(it2.label).toMatch(/no more than 1 month after the sale/);
    // On the payment day itself it names the deadline.
    const today = { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, today);
    expect(stageTasks(tax, 'contract', today, new Date('2026-11-14T17:00:00Z')).find((x) => x.key === 'ev-terms')!.label).toMatch(/by 1:00 p.m. Nevada time today/);
    // Between 1:00 and 4:30 p.m. only a re-auctioned parcel can still be paid; after 4:30 it asks whether you paid, and passing records the deadline.
    expect(stageTasks(tax, 'contract', today, new Date('2026-11-14T23:00:00Z')).find((x) => x.key === 'ev-terms')!.label).toMatch(/^Did you win .* in the 2:00 p.m. re-auction\? Then pay by 4:30 p.m. Nevada time today/);
    const after = stageTasks(tax, 'contract', today, new Date('2026-11-15T01:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(after.label).toMatch(/^Did you pay for/);
    expect(after.advance2?.addRow).toMatchObject({ when: '2026-11-14', what: 'Payment deadline' });
  });

  it('Clark, between 1:00 and 4:30 p.m. on the sale day, lets a morning winner who missed 1:00 answer too', () => {
    const tax = { ...nvFlip, kind: 'taxSale' as const, stage: 'contract' as const };
    const today = { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, today);
    const t = stageTasks(tax, 'contract', today, new Date('2026-11-14T23:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(t.advance2?.label).toMatch(/didn’t pay by 1:00 p.m./);
    expect(t.advance2?.addRow).toMatchObject({ when: '2026-11-14', what: 'Payment deadline' });
    // Before 1:00 p.m. there's no such answer yet.
    expect(stageTasks(tax, 'contract', today, new Date('2026-11-14T17:00:00Z')).find((x) => x.key === 'ev-terms')!.advance2).toBeUndefined();
    // Before the 2:00 p.m. re-auction it doesn't ask about it as if held.
    expect(stageTasks(tax, 'contract', today, new Date('2026-11-14T21:30:00Z')).find((x) => x.key === 'ev-terms')!.label).toMatch(/^Won .* this morning\? .*held only if needed/);
    // A deadline typed in as the county's own date keeps these steps: after 4:30 p.m. it asks whether you paid.
    const typed = { ...EMPTY_PACKET, dates: [...today.dates, { when: '2026-11-14', what: 'Payment deadline', who: 'Clark County Treasurer' }] };
    savePacket(`analyzed:${tax.id}`, typed);
    const late = dealNextTask(tax, typed, new Date('2026-11-15T01:00:00Z'), 'contract');
    expect(late.label).toMatch(/^Did you pay for/);
    expect(late.advance2?.stage).toBe('passed');
  });

  it('passing after a missed payment fills the usual blank Payment deadline row', () => {
    const rows = [{ when: '2026-11-12', what: 'Sale day', who: 'Trustee' }, { when: '', what: 'Payment deadline', who: '' }];
    expect(withRow(rows, { when: '2026-11-12', what: 'Payment deadline', who: 'the trustee' })).toEqual([rows[0], { when: '2026-11-12', what: 'Payment deadline', who: 'the trustee' }]);
    // A row dated later than the missed deadline takes the deadline that counted; an earlier one is kept; no row adds one.
    const dated = [{ when: '2026-11-20', what: 'Payment deadline', who: 'HOA agent' }];
    expect(withRow(dated, { when: '2026-11-12', what: 'Payment deadline', who: 'x' })).toEqual([{ when: '2026-11-12', what: 'Payment deadline', who: 'x; you had typed Nov 20, 2026' }]);
    expect(withRow(dated, { when: '2026-11-25', what: 'Payment deadline', who: 'x' })).toEqual(dated);
    expect(withRow([rows[0]], { when: '2026-11-12', what: 'Payment deadline', who: 'x' })).toHaveLength(2);
  });

  it('counts a Nevada payment deadline and sale day in Nevada’s day, and offers “I didn’t pay in time” once it passes', () => {
    const hoa = { ...nvFlip, kind: 'hoa' as const, stage: 'contract' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'Agent', resolved: true }, { when: '2026-11-20', what: 'Payment deadline', who: 'HOA agent' }] };
    savePacket(`analyzed:${hoa.id}`, p);
    saveDeals([hoa]);
    // 7 p.m. Nov 20 in Nevada (already Nov 21 in UTC): still today.
    const evening = new Date('2026-11-21T03:00:00Z');
    expect(paymentPassed(hoa, evening)).toBe('');
    expect(dealNextTask(hoa, p, evening, 'contract').days).toBe(0);
    expect(dealNextTask(hoa, p, evening, 'contract').label).toMatch(/^Pay for .* by its payment deadline, today in Nevada/);
    // 1 a.m. Nov 21 in Nevada: passed, with both answers.
    const late = new Date('2026-11-21T09:00:00Z');
    expect(paymentPassed(hoa, late)).toBe('2026-11-20');
    const t = dealNextTask(hoa, p, late, 'contract');
    expect(t.advance2?.stage).toBe('passed');
    expect(t.tick?.label).toMatch(/I paid/);
    // Sale day: not over until Nevada's day ends.
    const sale = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer' }] };
    expect(saleOverFor({ state: 'NV', kind: 'taxSale', county: 'Washoe' }, sale, new Date('2026-11-13T03:00:00Z'))).toBe(false);
    expect(saleOverFor({ state: 'NV', kind: 'taxSale', county: 'Washoe' }, sale, new Date('2026-11-13T09:00:00Z'))).toBe(true);
  });

  it('keeps a Nevada sale day’s step for the whole Nevada day, wherever the reader is', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-15', what: 'Sale day', who: 'Trustee' }] };
    savePacket(`analyzed:${nvFlip.id}`, p);
    // 6 p.m. Nov 15 in Nevada is already Nov 16 in UTC and east of it.
    expect(dealNextTask({ ...nvFlip, stage: 'researching' }, p, new Date('2026-11-16T02:00:00Z'), 'researching').label).toMatch(/^Today in Nevada is the sale day for/);
  });

  it('the Passed hint after a missed payment names the deadline, and Clark’s deposit and ban', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-16T20:00:00Z'));
    try {
      const won = { ...nvFlip, kind: 'taxSale' as const, county: 'Clark', stage: 'contract' as const };
      savePacket(`analyzed:${won.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-11-14', what: 'Payment deadline', who: 'Clark County Treasurer' }] });
      // Passed straight from Researching ("I didn't win"): no missed-payment wording.
      saveDeals([{ ...won, stage: 'researching' }]);
      setDealStage(won.id, 'passed');
      expect(stageHint('passed', loadDeals()[0])).not.toMatch(/didn’t pay/);
      // Passed from Won: it is a missed payment.
      saveDeals([won]);
      setDealStage(won.id, 'passed');
      const tax = loadDeals()[0];
      expect(tax.passedFrom).toBe('won');
      const h = stageHint('passed', tax);
      expect(h).toMatch(/^You didn’t pay by the deadline \(Nov 14, 2026\)/);
      expect(h).toMatch(/loses the \$5,000 deposit and is banned/);
    } finally { vi.useRealTimers(); }
  });

  it('a won, unpaid deal moved to Passed is warned first, and its hint never calls it a fine result', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '', what: 'Payment deadline', who: '' }] };
    const won = { ...nvFlip, stage: 'contract' as const };
    savePacket(`analyzed:${won.id}`, p);
    saveDeals([won]);
    expect(earlyMoveNote(won, 'passed')).toMatch(/^You won this\. A winner who doesn’t pay/);
    setDealStage(won.id, 'passed');
    const h = stageHint('passed', loadDeals()[0]);
    expect(h).toMatch(/^You passed after winning, and the payment isn’t marked paid\..*NRS 107\.083/);
    expect(h).not.toMatch(/fine result|good result|walked away/);
    // Home, My plan and My deals say it too.
    expect(dealNextTask(loadDeals()[0]).label).toMatch(/^Ask the trustee and an attorney what you may owe for/);
    expect(owedAfterPass().map((x) => x.id)).toEqual([won.id]);
    // Passed before the win: one line for every auction.
    saveDeals([{ ...nvFlip, stage: 'researching' }]);
    setDealStage(nvFlip.id, 'passed');
    expect(stageHint('passed', loadDeals()[0])).toBe('You didn’t win this one, or chose not to bid. Either is a fine result when the evidence says no: find your next property.');
    // Passed from Owned (a rescinded sale, say): it was won, so never "didn't win".
    saveDeals([{ ...nvFlip, stage: 'owned' }]);
    setDealStage(nvFlip.id, 'passed');
    expect(loadDeals()[0].passedFrom).toBe('owned');
    expect(stageHint('passed', loadDeals()[0])).toMatch(/^Passed after the purchase was completed\. If the sale was rescinded/);
  });

  it('a Nevada tax sale outside Clark and Washoe asks paid or not after the sale day; a typed Clark date is checked against the county’s', () => {
    const elko = { ...nvFlip, kind: 'taxSale' as const, county: 'Elko', stage: 'contract' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${elko.id}`, p);
    const t = stageTasks(elko, 'contract', p, new Date('2026-11-14T18:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(t.label).toMatch(/^Did you pay for .*online auction’s terms of sale.*contact the Treasurer and an attorney today/);
    expect(t.advance2?.stage).toBe('passed');
    const clark = { ...elko, county: 'Clark' };
    expect(countyTermsNote(clark, { ...EMPTY_PACKET, dates: [...p.dates, { when: '2026-11-18', what: 'Payment deadline', who: '' }] })).toMatch(/You typed a later payment date \(Nov 18, 2026\)/);
    expect(countyTermsNote(clark, { ...EMPTY_PACKET, dates: [...p.dates, { when: '2026-11-12', what: 'Payment deadline', who: '' }] })).toBe('');
    // A later typed date keeps the county's own steps, even weeks later.
    const far = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-12-01', what: 'Payment deadline', who: '' }] };
    savePacket(`analyzed:${clark.id}`, far);
    expect(dealNextTask(clark, far, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/^Did you pay for .*\(Dec 1, 2026\)/);
    // Your next action leads with the county's deadline, not the later typed one.
    const typed = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-11-18', what: 'Payment deadline', who: '' }] };
    savePacket(`analyzed:${clark.id}`, typed);
    expect(dealNextTask(clark, typed, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/^Did you pay for .*You typed a later payment date \(Nov 18, 2026\)/);
    expect(dealNextTask(clark, typed, new Date('2026-11-14T18:00:00Z'), 'contract').advance2?.stage).toBe('passed');
    expect(dealNextTask(clark, typed, new Date('2026-11-14T18:00:00Z'), 'contract').days).toBe(-1);
    // Before the county's time it is still due, with no 'didn't pay' answer yet.
    expect(dealNextTask(clark, typed, new Date('2026-11-12T18:00:00Z'), 'contract').label).toMatch(/^Pay for .* by 1:00 p.m. Nevada time today.*You typed a later payment date/);
    // The reader can say the Treasurer gave the later date: then that date's own steps follow.
    const conf = dealNextTask(clark, typed, new Date('2026-11-14T18:00:00Z'), 'contract');
    expect(conf.undo?.label).toBe('The Treasurer gave me this date in writing');
    expect(conf.undo?.addRow?.who).toBe('Treasurer, for Nov 18, 2026');
    const confirmed = { ...EMPTY_PACKET, dates: [...typed.dates, conf.undo!.addRow!] };
    savePacket(`analyzed:${clark.id}`, confirmed);
    expect(dealNextTask(clark, confirmed, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/^Pay for .* by its payment deadline, in 4 days \(Nov 18, 2026\)/);
    // A written date after the 20-day SID deadline: the SID question comes with the payment step.
    const late20 = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-12-10', what: 'Payment deadline', who: '' }, { when: '2026-11-13', what: 'Treasurer confirmed the later payment date in writing', who: 'Treasurer, for Dec 10, 2026', resolved: true }] };
    savePacket(`analyzed:${clark.id}`, late20);
    expect(dealNextTask(clark, late20, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/Now, ask the Treasurer whether a special improvement district \(SID\) affidavit was filed\. If one was, enter the SID payoff in Key dates and pay it by Dec 2, 2026/);
    expect(dealNextTask(clark, late20, new Date('2026-11-14T18:00:00Z'), 'contract').record?.label).toBe('The Treasurer confirmed no SID affidavit');
    expect(dealNextTask(clark, late20, new Date('2026-11-14T18:00:00Z'), 'contract').redate?.label).toBe('Yes, there’s an SID affidavit: I’ll pay it by Dec 2, 2026');
    // Once answered yes (the payoff row dated), only a short reminder stays, with no answer buttons.
    const yes = { ...late20, dates: [...late20.dates, { when: '2026-12-02', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] };
    savePacket(`analyzed:${clark.id}`, yes);
    expect(dealNextTask(clark, yes, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/SID certificate payoff/);
    // On the deadline day in Nevada (already the next day east of it), the payoff is due today, not ended.
    const lastDay = dealNextTask(clark, yes, new Date('2026-12-03T06:00:00Z'), 'contract');
    expect(lastDay.label).not.toMatch(/ended/);
    expect(lastDay.days).toBe(0);
    expect(lastDay.label).toMatch(/Pay it by Dec 2, 2026, 20 days after the sale, or the sale is void/);
    // Just after Nevada midnight it has ended, wherever the reader is.
    expect(dealNextTask(clark, yes, new Date('2026-12-03T08:30:00Z'), 'contract').days).toBeLessThan(0);
    savePacket(`analyzed:${clark.id}`, late20);
    // A payment date a day before the SID deadline warns too; one well before it doesn't.
    const close = { ...late20, dates: late20.dates.map((x) => (x.what === 'Payment deadline' ? { ...x, when: '2026-12-01' } : x.what.startsWith('Treasurer confirmed') ? { ...x, who: 'Treasurer, for Dec 1, 2026' } : x)) };
    savePacket(`analyzed:${clark.id}`, close);
    expect(dealNextTask(clark, close, new Date('2026-11-27T18:00:00Z'), 'contract').label).toMatch(/Any SID payoff is due Dec 2, 2026/);
    expect(dealNextTask(clark, close, new Date('2026-11-27T18:00:00Z'), 'contract').record?.label).toBe('The Treasurer confirmed no SID affidavit');
    savePacket(`analyzed:${clark.id}`, late20);
    // Day 20 counts in Nevada's day: at 9 p.m. Dec 2 in Nevada (already Dec 3 in UTC) it hasn't ended.
    expect(dealNextTask(clark, late20, new Date('2026-12-03T05:00:00Z'), 'contract').label).toMatch(/pay it by Dec 2, 2026/);
    // After the 20 days it still warns before the payment.
    expect(dealNextTask(clark, late20, new Date('2026-12-04T18:00:00Z'), 'contract').label).toMatch(/The 20 days for any special improvement district \(SID\) payoff ended Dec 2, 2026\. Ask the Treasurer in writing now/);
    // A date weeks out keeps its date; a changed typed date ends the answer, and the county's steps return.
    const farOk = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-12-01', what: 'Payment deadline', who: '' }, { when: '2026-11-13', what: 'Treasurer confirmed the later payment date in writing', who: 'Treasurer, for Dec 1, 2026', resolved: true }] };
    savePacket(`analyzed:${clark.id}`, farOk);
    expect(dealNextTask(clark, farOk, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/\(Dec 1, 2026\), the date the Treasurer gave you in writing/);
    expect(dealNextTask(clark, farOk, new Date('2026-11-14T18:00:00Z'), 'contract').undo?.removeRow).toBe('Treasurer confirmed the later payment date in writing');
    const moved = { ...farOk, dates: farOk.dates.map((x) => (x.what === 'Payment deadline' ? { ...x, when: '2026-12-03' } : x)) };
    savePacket(`analyzed:${clark.id}`, moved);
    expect(dealNextTask(clark, moved, new Date('2026-11-14T18:00:00Z'), 'contract').label).toMatch(/^Did you pay for .*You typed a later payment date/);
    // Answering again for the new date replaces the old answer.
    expect(dealNextTask(clark, moved, new Date('2026-11-14T18:00:00Z'), 'contract').undo).toMatchObject({ removeRow: 'Treasurer confirmed the later payment date in writing', addRow: { who: 'Treasurer, for Dec 3, 2026' } });
  });

  it('every Nevada date counts in Nevada’s day, and the SID step gives Clark’s own deadline over an unconfirmed later date', () => {
    const tax = { ...nvFlip, kind: 'taxSale' as const, county: 'Clark', stage: 'contract' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-12-05', what: 'Payment deadline', who: '' }, { when: '2026-12-02', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] };
    savePacket(`analyzed:${tax.id}`, p);
    const t = dealNextTask(tax, p, new Date('2026-11-20T18:00:00Z'), 'contract');
    // The county's own payment question leads over the SID payoff until the bid is answered.
    expect(t.label).toMatch(/^Did you pay for .*1:00 p\.m\. Nevada time on the sale day/);
    expect(t.advance2?.stage).toBe('passed');
    // After day 20 with the SID payoff dated and open, the county step carries its answers.
    expect(dealNextTask(tax, p, new Date('2026-12-04T18:00:00Z'), 'contract').record?.label).toBe('I paid the SID payoff by Dec 2, 2026: mark it handled');
    // A void sale has no county payment step.
    const voided = { ...EMPTY_PACKET, dates: [...p.dates, { when: '2026-12-04', what: 'The sale is void (the SID payoff wasn’t made within 20 days, NRS 361.595(6))', who: 'You', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, voided);
    expect(dealNextTask(tax, voided, new Date('2026-12-04T18:00:00Z'), 'contract').label).not.toMatch(/^Did you pay for/);
    savePacket(`analyzed:${tax.id}`, p);
    // Washoe, sale today, with an SID payoff row added: the payment due tomorrow still leads.
    const wa = { ...tax, county: 'Washoe' };
    const wp = { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '', what: 'Payment deadline', who: '' }, { when: '2026-12-07', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] };
    savePacket(`analyzed:${wa.id}`, wp);
    expect(dealNextTask(wa, wp, new Date('2026-11-17T20:00:00Z'), 'contract').label).toMatch(/^Pay for .* by 5:00 p\.m\. Nevada time tomorrow, Nov 18, 2026/);
    // 10:30 p.m. Oct 31 in Nevada (Nov 1 in UTC): a closed HOA deal's dates still count Oct 31 as today.
    const hoa = { ...nvFlip, kind: 'hoa' as const, stage: 'closed' as const };
    const hp = { ...EMPTY_PACKET, dates: [{ when: '2026-10-31', what: 'Redemption period ends', who: 'Agent' }] };
    savePacket(`analyzed:${hoa.id}`, hp);
    expect(dealNextTask(hoa, hp, new Date('2026-11-01T06:30:00Z'), 'closed').days).toBe(0);
  });

  it('today is the deal state’s day, and a rural tax win past both deadlines keeps the SID payoff and its answers', () => {
    expect(dayOf({ state: 'NV' }, new Date('2026-11-19T02:00:00Z'))).toBe('2026-11-18');
    expect(dayOf({ state: 'TX' }, new Date('2026-11-19T05:30:00Z'))).toBe('2026-11-18');
    const elko = { ...nvFlip, kind: 'taxSale' as const, county: 'Elko', stage: 'contract' as const };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-11-20', what: 'Payment deadline', who: '' }, { when: '2026-12-02', what: 'SID certificate payoff (affidavit filed)', who: 'Me' }] };
    savePacket(`analyzed:${elko.id}`, p);
    const t = dealNextTask(elko, p, new Date('2026-12-04T18:00:00Z'), 'contract');
    expect(t.label).toMatch(/SID payoff/);
  });

  it('a Nevada trustee win left unpaid after the sale day is urgent', () => {
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Trustee', resolved: true }] };
    savePacket(`analyzed:${nvFlip.id}`, p);
    const t = stageTasks({ ...nvFlip, stage: 'contract' }, 'contract', p, new Date('2026-11-14T18:00:00Z')).find((x) => x.key === 'ev-terms')!;
    expect(t.label).toMatch(/contact the trustee and an attorney today/);
    // An answer is needed: paid, or not (which passes the deal).
    expect(t.days).toBe(-1);
    expect(t.advance2?.stage).toBe('passed');
    // (No date is recorded for it: the notice sets a trustee sale's deadline, so the site doesn't make one up.)
    expect(t.advance2?.addRow).toBeUndefined();
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
    expect(t.tick?.label).toBe('I paid the SID payoff: mark it handled');
    const { sameEvent } = await import('./dealPacket');
    expect(sameEvent('Closing date', 'Closing')).toBe(true);
    expect(sameEvent('Closing Disclosure received', 'Closing')).toBe(false);
  });

  it('round 10 UX: a 90-day limit that ended is named; passed rows; the SID row; undated contract rows; a ticked closing; no one redeemed', async () => {
    const { packetSections } = await import('./dealPacket');
    // now = Oct 6, 2026. Sale Jul 1 + 90 = Sep 29 (over); the window ended Aug 4.
    const tr = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-07-05', what: 'Deed recorded', who: 'Me', resolved: true }, { when: '2026-08-04', what: 'Challenge window ends', who: 'Me' }] };
    const t = dealNextTask(nvFlip, tr, now, 'closed');
    expect(t.label).toMatch(/ended Sep 29, 2026\. If none was filed, mark it handled/);
    expect(t.label).not.toMatch(/still runs/);
    expect(t.tick?.label).toBe('No suit was filed: mark it handled');
    expect(t.redate).toBeUndefined();
    saveDeals([{ ...nvFlip, stage: 'closed' }]);
    const tl = packetSections({ ...nvFlip, stage: 'closed' }, tr, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(tl).toMatch(/Jul 5, 2026: Deed recorded \(Me\) — handled/);
    expect(tl).toMatch(/Next: the challenge window ended 63 days ago \(Aug 4, 2026\): see Your next action\./);
    const tax = { ...nvFlip, kind: 'taxSale' as const };
    const sid = { ...EMPTY_PACKET, dates: [{ when: '2026-09-20', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-20', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-30', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'Me' }] };
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
    savePacket('analyzed:f1', { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-09-30', what: 'Redemption period ends', who: 'A', resolved: true }] });
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
    expect(et.tick?.label).toBe('I paid the SID payoff: mark it handled');
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
    expect(t.label).toMatch(/^Closing (for .* )?is tomorrow.*did escrow receive it\?/);
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
    expect(t.label).toMatch(/ended Oct 19, 2026 \(counted from the Sale day you entered, [A-Z][a-z]{2} \d+, 2026\): move it to/);
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
    expect(t.tick?.label).toBe('I paid the SID payoff to City by Sep 30, 2026: mark it handled');
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
    expect(dealNextTask(tax, ahead, now, 'contract').tick).toMatchObject({ label: 'I paid the SID payoff: mark it handled', setWhen: '2026-10-06' });
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
    expect(dealNextTask(hoa, unpaid, now, 'contract').label).toMatch(/^The payment deadline for .* passed/);
    const pp = { ...EMPTY_PACKET, dates: [unpaid.dates[0], { ...unpaid.dates[1], resolved: true }] };
    savePacket('analyzed:f1', pp);
    expect(dealNextTask(hoa, pp, now, 'contract').label).not.toMatch(/Overdue by .* Payment deadline|payment deadline for .* passed/);
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
    const rp = { ...EMPTY_PACKET, dates: [{ when: '2026-07-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-07-08', what: 'Deed recorded', who: 'Trustee' }] };
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
    expect(dealNextTask(nvFlip, split, now, 'contract').label).toMatch(/payment deadline \(balance/i);
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
    expect(t.label).toMatch(/deadline you entered .* has passed\. Eureka’s usual deadline is/);
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

  it('round 93: day checks that don’t know the deal count in the chosen state’s day', async () => {
    const { closingDoneIn } = await import('./dealStage');
    localStorage.setItem('deedowl.state.v1', 'NV');
    // 06:00 UTC on Nov 18 is still Nov 17 in Nevada: a closing ticked for Nov 18 hasn't happened yet.
    const at = new Date('2026-11-18T06:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-18', what: 'Closing', who: 'Escrow', resolved: true }] };
    expect(closingDoneIn(p, at)).toBe(false);
    expect(closingDoneIn(p, new Date('2026-11-18T20:00:00Z'))).toBe(true);
    // A Nevada deal counts in Nevada's day even when another state is chosen.
    localStorage.setItem('deedowl.state.v1', 'TX');
    expect(closingDoneIn(p, at, { state: 'NV' })).toBe(false);
    const { nextDate } = await import('./dealPacket');
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: 'Seller’s disclosure form due', who: 'Seller' }] };
    expect(nextDate(q, at, { state: 'NV' })?.days).toBe(0);
    expect(nextDate(q, at, { state: 'TX' })?.days).toBe(-1);
  });

  it('round 93: a void Nevada tax sale, once passed, reads as the void sale, not the reader’s pass', async () => {
    const { packetSections } = await import('./dealPacket');
    const tax: Deal = { ...deal, id: 'v93', name: '2210 Mesa Verde Ln', state: 'NV', county: 'Nye', kind: 'taxSale', plan: 'flip', stage: 'passed' };
    saveDeals([tax]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-12-03', what: 'The sale is void (the SID payoff wasn’t made within 20 days, NRS 361.595(6))', who: 'Me', resolved: true }] };
    savePacket(`analyzed:${tax.id}`, p);
    const text = JSON.stringify(packetSections(tax, p, new Date('2026-12-04T18:00:00Z')));
    expect(text).not.toMatch(/before you passed|you moved it to Passed/);
    expect(text).toMatch(/before the sale/);
  });

  it('round 94: a redemption end ticked ahead of its date isn’t "No one redeemed" yet', () => {
    const hoa: Deal = { ...deal, id: 'h94', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    savePacket(`analyzed:${hoa.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-09-18', what: 'Certificate of sale recorded', who: 'County', resolved: true }, { when: '2026-11-17', what: 'Redemption period ends', who: 'HOA agent', resolved: true }] });
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-17T18:00:00Z'));
      expect(stageHint('closed', hoa)).not.toMatch(/No one redeemed/);
      vi.setSystemTime(new Date('2026-11-19T18:00:00Z'));
      expect(stageHint('closed', hoa)).toMatch(/No one redeemed/);
    } finally { vi.useRealTimers(); }
  });

  it('round 94: in the closing week, unticked earnest money asks whether escrow received it', () => {
    const offer: Deal = { ...deal, id: 'e94', name: '45 Elm Ave', state: 'NV', county: 'Washoe', kind: 'listing', plan: 'rent', stage: 'contract' };
    saveDeals([offer]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Offer accepted', who: 'Seller' }, { when: '', what: 'Earnest money due', who: 'Escrow' }, { when: '2026-11-18', what: 'Closing', who: 'Escrow' }] };
    savePacket(`analyzed:${offer.id}`, p);
    const t = dealNextTask(offer, p, new Date('2026-11-17T18:00:00Z'), 'contract');
    expect(t.key).toBe('deposit-sent');
    expect(t.label).toMatch(/the earnest money isn’t marked received: did escrow receive it\?/);
    expect(t.label).not.toMatch(/send the earnest money/);
    expect(t.tick?.label).toBe('Escrow has it: mark it handled');
    expect(t.tick?.noDate).toBe(true);
    // A dated, overdue earnest row in the closing week puts the closing first.
    const late = { ...p, dates: p.dates.map((x) => (x.what === 'Earnest money due' ? { ...x, when: '2026-10-23' } : x)) };
    savePacket(`analyzed:${offer.id}`, late);
    const lt = dealNextTask(offer, late, new Date('2026-11-17T18:00:00Z'), 'contract');
    expect(lt.label).toMatch(/^Closing for 45 Elm Ave is tomorrow \(Nov 18, 2026\), and the earnest money \(due Oct 23, 2026\) isn’t marked received/);
  });

  it('round 94 verifier: a redemption end ticked ahead of its date keeps the wait, at Won and with another state chosen', () => {
    const hoa: Deal = { ...deal, id: 'w94', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'contract' };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-09-17', what: 'Payment deadline', who: 'HOA agent', resolved: true }, { when: '2026-11-17', what: 'Redemption period ends', who: 'HOA agent', resolved: true }] };
    savePacket(`analyzed:${hoa.id}`, p);
    expect(dealNextTask(hoa, p, new Date('2026-11-16T18:00:00Z'), 'contract').label).not.toMatch(/No one redeemed/);
    // 11 p.m. Pacific on Nov 17 is still the last day in Nevada, even with Texas chosen.
    localStorage.setItem('deedowl.state.v1', 'TX');
    const closed = { ...hoa, stage: 'closed' as const };
    saveDeals([closed]);
    const t = dealNextTask(closed, p, new Date('2026-11-18T07:00:00Z'), 'closed');
    expect(t.label).not.toMatch(/^Get the deed/);
  });

  it('round 95: an early-ticked redemption end isn’t over, and a redemption can be recorded at Owned before the deed', async () => {
    const { redemptionOver } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'r95', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'contract' };
    saveDeals([hoa]);
    const sale = { when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true };
    const ticked = { ...EMPTY_PACKET, dates: [sale, { when: '2026-11-17', what: 'Redemption period ends', who: 'HOA agent', resolved: true }] };
    savePacket(`analyzed:${hoa.id}`, ticked);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-16T18:00:00Z'));
      expect(redemptionOver(hoa)).toBe(false);
      vi.setSystemTime(new Date('2026-11-19T18:00:00Z'));
      expect(redemptionOver(hoa)).toBe(true);
    } finally { vi.useRealTimers(); }
    const owned = { ...hoa, stage: 'owned' as const };
    saveDeals([owned]);
    const open = { ...EMPTY_PACKET, dates: [sale, { when: '2026-09-18', what: 'Certificate of sale recorded', who: 'County', resolved: true }, { when: '2026-11-17', what: 'Redemption period ends', who: 'HOA agent' }] };
    savePacket(`analyzed:${hoa.id}`, open);
    const t = dealNextTask(owned, open, new Date('2026-11-16T18:00:00Z'), 'owned');
    expect(JSON.stringify(t.advance2 ?? null)).toMatch(/redeem/i);
  });

  it('round 95 verifier: an undated redemption end ticked early isn’t over until the worked-out end passes', async () => {
    const { redemptionOver, redemptionPast } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'u95', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-18', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-09-19', what: 'Certificate of sale recorded', who: 'County', resolved: true }, { when: '', what: 'Redemption period ends', who: 'HOA agent', resolved: true }] };
    savePacket(`analyzed:${hoa.id}`, p);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-10T18:00:00Z'));
      expect(redemptionOver(hoa)).toBe(false);
      expect(redemptionPast(hoa)).toBe(false);
      expect(dealNextTask(hoa, p, new Date(), 'closed').label).not.toMatch(/^Get the deed|No one redeemed/);
      vi.setSystemTime(new Date('2026-11-25T18:00:00Z'));
      expect(redemptionOver(hoa)).toBe(true);
      expect(redemptionPast(hoa)).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('round 96 verifier: an early-marked redemption end goes back to open while the period runs, and stays once it has passed', async () => {
    const { clearEarlyRedemptionEnds } = await import('./dealStage');
    const { loadPacket } = await import('./dealPacket');
    const hoa: Deal = { ...deal, id: 'm96', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    const other: Deal = { ...hoa, id: 'n96' };
    saveDeals([hoa, other]);
    const row = { when: '2026-11-17', what: 'Redemption period ends', who: 'HOA agent', resolved: true };
    savePacket(`analyzed:${hoa.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true }, row] });
    savePacket(`analyzed:${other.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true }, { ...row, when: '2026-11-10' }] });
    clearEarlyRedemptionEnds(new Date('2026-11-17T18:00:00Z'));
    expect(loadPacket(`analyzed:${hoa.id}`).dates.find((x) => x.what === 'Redemption period ends')).toMatchObject({ when: '2026-11-17' });
    expect(loadPacket(`analyzed:${hoa.id}`).dates.find((x) => x.what === 'Redemption period ends')?.resolved).toBeFalsy();
    expect(loadPacket(`analyzed:${other.id}`).dates.find((x) => x.what === 'Redemption period ends')?.resolved).toBe(true);
  });

  it('round 97: the redemption end and the deed after it wait for the law’s end (or a Sale day to count from)', async () => {
    const { redemptionMarkWait } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'g97', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const now = new Date('2026-10-01T18:00:00Z');
    expect(redemptionMarkWait(hoa, { ...EMPTY_PACKET, dates: [] }, now)).toBe('no-sale');
    const sale = { when: '2026-09-17', what: 'Sale day', who: 'HOA agent', resolved: true };
    // A typed end 9 days after the sale still waits for the law's 60 days.
    const early = { ...EMPTY_PACKET, dates: [sale, { when: '2026-09-26', what: 'Redemption period ends', who: 'HOA agent' }] };
    expect(redemptionMarkWait(hoa, early, now)).toMatch(/^2026-11-1[67]$/);
    expect(redemptionMarkWait(hoa, early, new Date('2026-11-20T18:00:00Z'))).toBe('');
    expect(redemptionMarkWait(hoa, { ...early, dates: [...early.dates, { when: '2026-09-25', what: 'Redemption money collected', who: 'HOA agent', resolved: true }] }, now)).toBe('');
  });

  it('round 98 clarity: a typed redemption end earlier than the law keeps its date but reopens while someone can redeem', async () => {
    const { clearEarlyRedemptionEnds, lawRedemptionEnd } = await import('./dealStage');
    const { loadPacket } = await import('./dealPacket');
    const hoa: Deal = { ...deal, id: 'l97', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-01', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-11-10', what: 'Redemption period ends', who: 'HOA agent', resolved: true }] };
    savePacket(`analyzed:${hoa.id}`, p);
    const law = lawRedemptionEnd(hoa, p);
    expect(law > '2026-12-29').toBe(true);
    clearEarlyRedemptionEnds(new Date('2026-11-17T20:00:00Z'));
    const row = loadPacket(`analyzed:${hoa.id}`).dates.find((x) => x.what === 'Redemption period ends');
    expect(row?.when).toBe('2026-11-10');
    expect(row?.resolved).toBeFalsy();
  });

  it('round 97 verifier: an early typed end entered before the Sale day asks to fix the date, with no "No one redeemed"', async () => {
    const { fixRedemptionRows } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'v97', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const now = new Date('2026-11-17T20:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-01', what: 'Sale day', who: 'HOA agent', resolved: true }, { when: '2026-11-10', what: 'Redemption period ends', who: 'HOA agent' }, { when: '', what: 'Deed delivered (if no one redeemed)', who: 'HOA agent', resolved: true }] };
    savePacket(`analyzed:${hoa.id}`, p);
    const t = dealNextTask(hoa, p, now, 'closed');
    expect(JSON.stringify(t)).not.toMatch(/No one redeemed: mark it handled/);
    const q = fixRedemptionRows(hoa, p, now)!;
    expect(q.dates.find((x) => x.what === 'Redemption period ends')!.when).toBe('2026-11-10');
    expect(q.dates.find((x) => x.what === 'Deed delivered (if no one redeemed)')!.resolved).toBe(false);
  });

  it('round 98: with no Sale day, a typed redemption end waits for the Sale day (the law counts from it)', async () => {
    const { redemptionMarkWait } = await import('./dealStage');
    const sh: Deal = { ...deal, id: 's98', name: '45 Elm Ave', state: 'NV', county: 'Clark', kind: 'court', plan: 'flip', stage: 'closed' };
    saveDeals([sh]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-03', what: 'Certificate of sale recorded', who: 'County', resolved: true }, { when: '2026-09-04', what: 'Redemption period ends', who: 'Sheriff' }] };
    expect(redemptionMarkWait(sh, p, new Date('2026-11-17T20:00:00Z'))).toBe('no-sale');
    expect(dealNextTask(sh, p, new Date('2026-11-17T20:00:00Z'), 'closed').label).toMatch(/^Enter the Sale day/);
  });

  it('round 98 verifier: a typed end earlier than the law’s isn’t treated as ended anywhere', async () => {
    const { redemptionEnd } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'e98', name: '2 Ash', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-11-05', what: 'Redemption period ends', who: 'A' }] };
    savePacket(`analyzed:${hoa.id}`, p);
    expect(redemptionEnd(hoa, p)).toBe('2026-11-30');
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-17T20:00:00Z'));
      expect(stageHint('closed', hoa)).not.toMatch(/ended/);
    } finally { vi.useRealTimers(); }
    // At Won (paid) with no Sale day, the Sale day comes first.
    const won = { ...hoa, stage: 'contract' as const };
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Payment deadline', who: 'A', resolved: true }, { when: '2026-11-05', what: 'Redemption period ends', who: 'A' }] };
    saveDeals([won]);
    savePacket(`analyzed:${hoa.id}`, q);
    expect(dealNextTask(won, q, new Date('2026-11-17T20:00:00Z'), 'contract').label).not.toMatch(/ended/);
  });

  it('round 99: one effective redemption end in reminders, and a closing dated before the contract asks to fix it', () => {
    const hoa: Deal = { ...deal, id: 'f99', name: '2 Ash', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-12-01', what: 'Redemption period ends', who: 'A' }] };
    savePacket(`analyzed:${hoa.id}`, p);
    const t = dealNextTask(hoa, p, new Date('2026-12-05T20:00:00Z'), 'closed');
    expect(t.label).not.toMatch(/ended 4 days ago/);
    const reo: Deal = { ...deal, id: 'c99', name: '9 Oak', state: 'NV', county: 'Washoe', kind: 'reo', plan: 'rent', stage: 'contract' };
    saveDeals([reo]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Offer accepted (Day 0)', who: 'Seller' }, { when: '2026-11-01', what: 'Closing', who: 'Escrow' }] };
    savePacket(`analyzed:${reo.id}`, q);
    const c = dealNextTask(reo, q, new Date('2026-11-17T20:00:00Z'), 'contract');
    expect(c.label).toMatch(/is before the contract date/);
    expect(c.advance).toBeUndefined();
  });

  it('round 101: a won auction’s Sale day that can’t fit its other dates gets advice naming the other date, without blocking', async () => {
    const { saleDayOdd } = await import('./dealStage');
    const hoa: Deal = { ...deal, id: 'y101', name: '2 Ash', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([hoa]);
    const now = new Date('2026-11-17T20:00:00Z');
    // Tracking a win months later: the certificate dated today doesn't make the Sale day look wrong.
    const late = { ...EMPTY_PACKET, dates: [{ when: '2026-03-10', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-11-17', what: 'Certificate of sale recorded', who: 'County', resolved: true }] };
    expect(saleDayOdd(hoa, late, now)).toBe('');
    // A postponed sale whose payment date wasn't moved: both dates are named.
    const moved = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Sale day', who: 'A', resolved: true }, { when: '2026-10-06', what: 'Payment deadline', who: 'A', resolved: true }] };
    expect(saleDayOdd(hoa, moved, now)).toMatch(/after “Payment deadline” \(Oct 6, 2026\).*check both dates/);
    savePacket(`analyzed:${hoa.id}`, moved);
    expect(dealNextTask(hoa, moved, now, 'closed').label).not.toMatch(/^Check the Sale day/);
  });

  it('round 103: a Nevada tax deed’s missing recovery-suit window is named with its date and holds Key dates', async () => {
    const { packetSections } = await import('./dealPacket');
    const tx: Deal = { ...deal, id: 'k102', name: '5 Pine', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'owned' };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, calendarReviewedFor: 'owned', dates: [{ when: '2026-06-01', what: 'Sale day', who: 'Treasurer', resolved: true }, { when: '2026-06-20', what: 'Treasurer’s deed recorded', who: 'Treasurer', resolved: true }, { when: '2026-06-25', what: 'Treasurer confirmed the sale had no SID affidavit', who: 'Treasurer', resolved: true }] };
    savePacket(`analyzed:${tx.id}`, p);
    const sec = packetSections(tx, p, new Date('2026-11-17T20:00:00Z')).find((x) => x.key === 'dates')!;
    expect(sec.lines.some((t) => /^Recovery-suit window ends: 2 years after the Treasurer’s deed is delivered, no earlier than Jun 20, 2028, 2 years from its recording date \(NRS 361\.600\)\*/.test(t))).toBe(true);
    expect(sec.lines.some((t) => /not in this packet: .*Recovery-suit/.test(t))).toBe(false);
    expect(sec.hold).toBe(true);
  });

  it('round 103 clarity: a challenge or recovery-suit window can’t be marked before it ends, and an early tick doesn’t lift the repairs gate', async () => {
    const { windowMarkWait, clearEarlyRedemptionEnds } = await import('./dealStage');
    const { loadPacket } = await import('./dealPacket');
    const tr: Deal = { ...deal, id: 'w103', name: '8 Fir', state: 'NV', county: 'Washoe', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const now = new Date('2026-11-17T20:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '2026-11-17', what: 'Deed recorded', who: 'County', resolved: true }, { when: '', what: 'Challenge window ends', who: '', resolved: true }] };
    expect(windowMarkWait(tr, p, 'Challenge window ends', now)).toBe('2026-12-17');
    savePacket(`analyzed:${tr.id}`, p);
    clearEarlyRedemptionEnds(now);
    expect(loadPacket(`analyzed:${tr.id}`).dates.find((x) => x.what === 'Challenge window ends')?.resolved).toBeFalsy();
    const tx: Deal = { ...tr, id: 'x103', kind: 'taxSale' };
    expect(windowMarkWait(tx, { ...EMPTY_PACKET, dates: [{ when: '2026-06-20', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }] }, 'Recovery-suit window ends', now)).toBe('2028-06-20');
  });

  it('round 104: a challenge window typed earlier than the law’s end is read at the law’s end everywhere', async () => {
    const { packetSections } = await import('./dealPacket');
    const tr: Deal = { ...deal, id: 'c104', name: '8 Fir', state: 'NV', county: 'Washoe', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const now = new Date('2026-12-12T20:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '2026-11-17', what: 'Deed recorded', who: 'County', resolved: true }, { when: '2026-12-10', what: 'Challenge window ends', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const dates = packetSections(tr, p, now).find((x) => x.key === 'dates')!;
    expect(dates.lines.join(' ')).toMatch(/Dec 17, 2026: Challenge window ends \(the date you entered, Dec 10, 2026, is earlier than the law allows/);
    expect(dates.lines.join(' ')).not.toMatch(/ended 2 days ago/);
    const reps = stageTasks(tr, 'closed', p, now).find((t) => t.key === 'repairs');
    if (reps) expect(reps.label).not.toMatch(/Dec 10/);
  });

  it('round 104 content and clarity: a tax deed’s recovery window is no earlier than; before the deed it comes later, then is still to add; a passed window still holds, with its question', async () => {
    const { packetSections } = await import('./dealPacket');
    const tx: Deal = { ...deal, id: 'r104', name: '6 Pine', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'closed' };
    saveDeals([tx]);
    const now = new Date('2026-11-17T20:00:00Z');
    const typed = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-20', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }, { when: '2027-01-01', what: 'Recovery-suit window ends', who: 'Me' }] };
    savePacket(`analyzed:${tx.id}`, typed);
    const a = packetSections(tx, typed, now).find((x) => x.key === 'dates')!.lines.join(' ');
    expect(a).toMatch(/Recovery-suit window ends \(the date you entered, Jan 1, 2027, is earlier than the law allows: the window ends no earlier than this.*after\*\)/);
    const pre = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-05', what: 'Payment deadline', who: 'T', resolved: true }] };
    const won: Deal = { ...tx, id: 'w104', stage: 'contract' };
    saveDeals([won]);
    savePacket(`analyzed:${won.id}`, pre);
    const b = packetSections(won, pre, now).find((x) => x.key === 'dates')!.lines;
    expect(b.some((t) => /add any that apply/.test(t) && /Treasurer’s deed recorded|Recovery-suit/.test(t))).toBe(false);
    expect(b.filter((t) => /^Later: /.test(t)).length).toBe(1);
    expect(b.some((t) => /^Later: .*then add “Recovery-suit window ends” \(2 years after the deed is delivered, NRS 361\.600\)\./.test(t))).toBe(true);
    // (At Deed recorded with no recorded deed date, the deed is still to add, and it holds the part.)
    saveDeals([tx]);
    savePacket(`analyzed:${tx.id}`, pre);
    const bc = packetSections(tx, pre, now).find((x) => x.key === 'dates')!;
    expect(bc.lines.some((t) => /^Still to add: the date the Treasurer’s deed was recorded/.test(t))).toBe(true);
    expect(bc.lines.some((t) => /^Later: /.test(t))).toBe(false);
    expect(bc.hold).toBe(true);
    const old = { ...EMPTY_PACKET, calendarReviewedFor: 'owned', dates: [{ when: '2024-02-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2024-02-29', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }, { when: '2024-03-05', what: 'Treasurer confirmed the sale had no SID affidavit', who: 'T', resolved: true }] };
    const ox: Deal = { ...tx, id: 'o104', stage: 'owned' };
    saveDeals([ox]);
    savePacket(`analyzed:${ox.id}`, old);
    const c = packetSections(ox, old, now).find((x) => x.key === 'dates')!;
    expect(c.lines.some((t) => /^Recovery-suit window ends: .*likely ended soon after Mar 1, 2026.*ask your title company whether any suit or counterclaim/.test(t))).toBe(true);
    expect(c.hold).toBe(true);
    const { windowEnded } = await import('./dealPacket');
    expect(windowEnded('Recovery-suit window ends', 3)!.text).toBe('the recovery-suit window likely ended 3 days ago');
    expect(stageTasks(ox, 'owned', old, now).find((t) => t.key === 'window')?.label).toMatch(/^Add the recovery-suit window’s end to .*ask your title company/);
  });

  it('round 104 clarity: a Nevada trustee deal at Deed recorded with no recorded deed date asks for it, not an optional challenge window', async () => {
    const { packetSections } = await import('./dealPacket');
    const tr: Deal = { ...deal, id: 't104', name: '9 Fir', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'Trustee', resolved: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    const sec = packetSections(tr, p, new Date('2026-11-20T20:00:00Z')).find((x) => x.key === 'dates')!;
    expect(sec.lines.some((t) => /^Still to add: the date the trustee’s deed was recorded/.test(t))).toBe(true);
    expect(sec.lines.some((t) => /add any that apply/.test(t) && /Challenge window/.test(t))).toBe(false);
    expect(sec.hold).toBe(true);
  });

  it('round 104 verifier: a handled window needs no deed row; a plain apostrophe names the deed row; the deed date leads Your next action', async () => {
    const { packetSections } = await import('./dealPacket');
    const { deedDateMissing } = await import('./dealStage');
    const now = new Date('2026-12-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'v104', name: '9 Fir', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    saveDeals([tr]);
    const done = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-12-17', what: 'Challenge window ends', who: 'Title co', resolved: true }] };
    savePacket(`analyzed:${tr.id}`, done);
    expect(deedDateMissing(tr, done)).toBe('');
    expect(packetSections(tr, done, now).find((x) => x.key === 'dates')!.lines.some((t) => /^Still to add/.test(t))).toBe(false);
    const plain = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-17', what: "Trustee's deed recorded", who: 'County', resolved: true }] };
    expect(deedDateMissing(tr, plain)).toBe('');
    const tx: Deal = { ...tr, id: 'v104t', kind: 'taxSale', stage: 'closed' };
    saveDeals([tx]);
    expect(deedDateMissing(tx, { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: "Treasurer's deed recorded", who: 'T', resolved: true }] })).toBe('');
    const blank = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'T', resolved: true }, { when: '2026-11-12', what: 'Treasurer confirmed no SID affidavit', who: 'T', resolved: true }, { when: '', what: 'Treasurer’s deed recorded', who: '' }] };
    savePacket(`analyzed:${tx.id}`, blank);
    expect(packetSections(tx, blank, now).find((x) => x.key === 'dates')!.lines.some((t) => /^Still to add: the date on the “Treasurer’s deed recorded” row/.test(t))).toBe(true);
    expect(dealNextTask(tx, blank, now, 'closed').label).toMatch(/^Enter the date 9 Fir’s deed was recorded in Key dates/);
  });

  it('round 105 tools: a dated deed row not yet ticked still sets the window’s law end; the deed date leads at Owned; a blank recovery row at Owned is still to add, with its date', async () => {
    const { packetSections } = await import('./dealPacket');
    const { lawWindowEnd, windowMarkWait } = await import('./dealStage');
    const tr: Deal = { ...deal, id: 'u105', name: '7 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const now = new Date('2026-12-12T20:00:00Z');
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-17', what: 'Deed recorded', who: 'County' }, { when: '2026-12-10', what: 'Challenge window ends', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(lawWindowEnd(tr, p, 'Challenge window ends')).toBe('2026-12-17');
    expect(windowMarkWait(tr, p, 'Challenge window ends', now)).toBe('2026-12-17');
    const t = dealNextTask(tr, p, now, 'closed');
    expect(t.label).not.toMatch(/ended/);
    expect(t.label).toMatch(/^Mark 7 Elm’s deed recording handled/);
    const rep = stageTasks(tr, 'closed', p, now).find((x) => x.key === 'repairs');
    if (rep) expect(rep.label).not.toMatch(/Dec 10/);
    const ow: Deal = { ...tr, id: 'u105o', stage: 'owned', plan: 'rent' };
    saveDeals([ow]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }] };
    savePacket(`analyzed:${ow.id}`, q);
    expect(dealNextTask(ow, q, now, 'owned').label).toMatch(/^Enter the date 7 Elm’s deed was recorded/);
    const tx: Deal = { ...tr, id: 'u105t', kind: 'taxSale', stage: 'owned' };
    saveDeals([tx]);
    const r = { ...EMPTY_PACKET, dates: [{ when: '2024-02-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2024-02-05', what: 'Payment deadline', who: 'T', resolved: true }, { when: '2024-02-06', what: 'Treasurer confirmed no SID affidavit', who: 'T', resolved: true }, { when: '2024-11-01', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }, { when: '', what: 'Recovery-suit window ends', who: '' }] };
    savePacket(`analyzed:${tx.id}`, r);
    const lines = packetSections(tx, r, now).find((x) => x.key === 'dates')!.lines;
    expect(lines.some((x) => /^Still to add: the date for Recovery-suit window ends \(2 years after the deed is delivered, so it likely ended soon after Nov 1, 2026/.test(x))).toBe(true);
    expect(lines).not.toContain('Nothing else is due now.');
  });

  it('round 105 clarity: a dated deed row not yet ticked asks for its tick, not "passed"; the trustee rent hint names the window; the recovery task says no earlier than', async () => {
    const { packetSections } = await import('./dealPacket');
    const { stageHint } = await import('./dealStage');
    const now = new Date('2026-12-01T20:00:00Z');
    const tr: Deal = { ...deal, id: 'q105', name: '4 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'rent', stage: 'owned' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-17', what: 'Deed recorded', who: 'County' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const lines = packetSections(tr, p, now).find((x) => x.key === 'dates')!.lines;
    expect(lines.some((t) => /Deed recorded \(County\) — not marked handled: mark it to confirm the recording date/.test(t))).toBe(true);
    expect(lines).not.toContain('Nothing else is due now.');
    expect(stageHint('owned', tr)).toMatch(/^Bought at a trustee’s sale: the challenge window comes first/);
    const tx: Deal = { ...tr, id: 'q105t', kind: 'taxSale', stage: 'closed' };
    const tp = { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: 'Treasurer’s deed recorded', who: 'T', resolved: true }] };
    const w = stageTasks(tx, 'closed', tp, now).find((t) => t.key === 'window')!;
    expect(w.produces).toMatch(/no earlier than Nov 17, 2028, 2 years from its recording on Nov 17, 2026; the 2 years run from the deed’s delivery/);
    expect(w.produces).not.toMatch(/about/);
  });

  it('round 105 verifier: with no deed date, an early window tick waits, and Key dates and the hint ask for the deed date', async () => {
    const { packetSections } = await import('./dealPacket');
    const { windowTickWait, stageHint } = await import('./dealStage');
    const now = new Date('2026-12-12T20:00:00Z');
    const tr: Deal = { ...deal, id: 'n105', name: '3 Ash', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '', what: 'Deed recorded', who: 'County', resolved: true }, { when: '2026-12-10', what: 'Challenge window ends', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(windowTickWait(tr, p, 'Challenge window ends', now)).toBe('no-deed');
    const lines = packetSections(tr, p, now).find((x) => x.key === 'dates')!.lines;
    expect(lines).toContain('Next: the date the deed was recorded (see Your next action): the window’s end is worked out from it.');
    expect(lines.some((t) => /marked handled without one/.test(t))).toBe(true);
    expect(stageHint('closed', tr)).toMatch(/^The deed is yours: enter the date it was recorded/);
    expect(lines.some((t) => /Challenge window ends \(Me\) — can’t be checked yet: it counts from the deed’s recording/.test(t))).toBe(true);
    const done = { ...p, dates: p.dates.map((x) => (x.what === 'Challenge window ends' ? { ...x, resolved: true } : x)) };
    expect(windowTickWait(tr, done, 'Challenge window ends', now)).toBe('');
  });

  it('round 106 content: a deed row dated after today reads as expected, not as a date to confirm', async () => {
    const { packetSections } = await import('./dealPacket');
    const now = new Date('2026-11-18T20:00:00Z');
    const tr: Deal = { ...deal, id: 'f106', name: '2 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-25', what: 'Deed recorded', who: 'County' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const lines = packetSections(tr, p, now).find((x) => x.key === 'dates')!.lines;
    expect(lines.some((t) => /Deed recorded \(County\) — expected: mark it handled once it’s recorded/.test(t))).toBe(true);
    expect(lines.some((t) => /^Still to add: “Deed recorded”, expected Nov 25, 2026/.test(t))).toBe(true);
    expect(stageTasks(tr, 'closed', p, now).find((t) => t.key === 'deed-date')?.label).toMatch(/once it’s recorded \(expected Nov 25, 2026\)/);
  });

  it('round 106 clarity: an expected deed date still ahead drives no window', async () => {
    const { lawWindowEnd, windowMarkWait, deedRecordedOn } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'e106', name: '5 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-25', what: 'Deed recorded', who: 'County' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(deedRecordedOn(p, true, now)).toBeUndefined();
    expect(lawWindowEnd(tr, p, 'Challenge window ends', now)).toBe('');
    expect(windowMarkWait(tr, p, 'Challenge window ends', now)).toBe('no-deed');
    expect(deedRecordedOn(p, true, new Date('2026-11-26T20:00:00Z'))).toBe('2026-11-25');
  });

  it('round 107 tools: an expected deed date that has passed, never ticked, doesn’t open the window question; the deed tick comes first', async () => {
    const { windowTickWait } = await import('./dealStage');
    const now = new Date('2026-12-26T20:00:00Z');
    const tr: Deal = { ...deal, id: 'x107', name: '1 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-25', what: 'Deed recorded', who: 'County' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const t = dealNextTask(tr, p, now, 'closed');
    expect(t.label).toMatch(/^Mark 1 Elm’s deed recording handled/);
    expect(t.tick?.label ?? '').not.toMatch(/no suit/);
    expect(windowTickWait(tr, { ...p, dates: [...p.dates, { when: '2026-12-25', what: 'Challenge window ends', who: '' }] }, 'Challenge window ends', now)).toBe('no-deed');
  });

  it('round 107 clarity: My plan dates no window or repairs from an expected deed date', async () => {
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'm107', name: '6 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'closed' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-25', what: 'Deed recorded', who: 'County' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const tasks = stageTasks(tr, 'closed', p, now);
    expect(tasks.map((t) => t.label).join(' | ')).not.toMatch(/Dec 25, 2026/);
    expect(tasks.find((t) => t.key === 'window')?.label).toMatch(/^Put the challenge window’s end on 6 Elm’s calendar/);
  });

  it('round 107 verifier: a won auction not marked paid asks for the payment before a recording reminder', async () => {
    const { packetSections } = await import('./dealPacket');
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'p107', name: '8 Elm', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-18', what: 'Deed recorded', who: 'Trustee' }] };
    savePacket(`analyzed:${tr.id}`, p);
    const t = dealNextTask(tr, p, now, 'contract');
    expect(t.label).toMatch(/pay/i);
    expect(t.label).not.toMatch(/^Deed recorded/);
    expect(packetSections(tr, p, now).find((x) => x.key === 'dates')!.lines).toContain('Next: the payment, until you mark it paid (see Your next action).');
    const paid = { ...p, dates: [...p.dates, { when: '2026-11-10', what: 'Payment deadline', who: 'Me', resolved: true }] };
    savePacket(`analyzed:${tr.id}`, paid);
    expect(dealNextTask(tr, paid, now, 'contract').label).toMatch(/Deed recorded/);
  });

  it('round 108 tools: a paid Nevada tax sale’s open SID question leads a near deed date; at Won a typed window waits for the deed', async () => {
    const { windowTickWait } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const tx: Deal = { ...deal, id: 's108', name: '9 Pine', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-12', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-23', what: 'Treasurer’s deed recorded', who: 'T' }] };
    savePacket(`analyzed:${tx.id}`, p);
    const t = dealNextTask(tx, p, now, 'contract');
    expect(t.label).not.toMatch(/Treasurer’s deed recorded/);
    expect(t.label).toMatch(/SID/);
    const tr: Deal = { ...tx, id: 'w108', kind: 'trustee' };
    saveDeals([tr]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-10-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-01', what: 'Challenge window ends', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, q);
    expect(windowTickWait(tr, q, 'Challenge window ends', now)).toBe('no-deed');
    expect(dealNextTask(tr, q, now, 'contract').label).not.toMatch(/challenge window ended/i);
    const { packetSections } = await import('./dealPacket');
    const ql = packetSections({ ...tr, stage: 'contract' }, q, now).find((x) => x.key === 'dates')!.lines;
    expect(ql).toContain('Next: once the deed is recorded, the window’s end is worked out from its recording date.');
    expect(ql.join(' ')).not.toMatch(/window ended/);
  });

  it('round 109 tools: a date the reader added never hides the SID question, an unpaid win’s payment or an ended redemption’s answer', async () => {
    const { packetSections } = await import('./dealPacket');
    const now = new Date('2026-11-30T20:00:00Z');
    const tx: Deal = { ...deal, id: 'c109', name: '3 Pine', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-12', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-29', what: 'Get insurance quote', who: 'Me' }] };
    savePacket(`analyzed:${tx.id}`, p);
    expect(dealNextTask(tx, p, now, 'contract').label).toMatch(/SID/);
    expect(packetSections(tx, p, now).find((x) => x.key === 'dates')!.lines.join(' ')).not.toMatch(/Next: Get insurance quote/);
    const tr: Deal = { ...tx, id: 'u109', kind: 'trustee' };
    saveDeals([tr]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-28', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-12-02', what: 'Get insurance quote', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, q);
    expect(dealNextTask(tr, q, now, 'contract').label).toMatch(/pay/i);
    expect(packetSections(tr, q, now).find((x) => x.key === 'dates')!.lines).toContain('Next: the payment, until you mark it paid (see Your next action).');
    const hoa: Deal = { ...tx, id: 'h109', kind: 'hoa', stage: 'closed' };
    saveDeals([hoa]);
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-09-30', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-30', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-02', what: 'Certificate of sale recorded', who: 'C', resolved: true }, { when: '2026-11-29', what: 'Redemption period ends', who: 'HOA' }, { when: '2026-12-02', what: 'Get contractor bids', who: 'Me' }] };
    savePacket(`analyzed:${hoa.id}`, r);
    expect(dealNextTask(hoa, r, now, 'closed').label).not.toMatch(/contractor bids/);
  });

  it('round 109 clarity: the overdue-answer rule only uses rows the stage still reminds about; a redemption payoff leads a reader’s date', async () => {
    const { REDEEMED_ROW } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'g109', name: '5 Ash', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-02', what: 'Payment deadline', who: 'Me' }, { when: '2026-06-10', what: 'Deed recorded', who: 'C', resolved: true }, { when: '2026-07-10', what: 'Challenge window ends', who: 'Me', resolved: true }, { when: '2026-11-23', what: 'Get contractor bids', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'owned').label).not.toMatch(/Payment deadline/);
    const hoa: Deal = { ...tr, id: 'r109', kind: 'hoa', stage: 'closed' };
    saveDeals([hoa]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-10', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-09-12', what: 'Certificate of sale recorded', who: 'C', resolved: true }, { when: '2026-11-09', what: 'Redemption period ends', who: 'HOA' }, { when: '', what: REDEEMED_ROW, who: 'HOA' }, { when: '2026-11-23', what: 'Get contractor bids', who: 'Me' }] };
    savePacket(`analyzed:${hoa.id}`, q);
    expect(dealNextTask(hoa, q, now, 'closed').label).toMatch(/^Collect the redemption money/);
  });

  it('round 109 verifier: a sale’s own date due within a week leads any reader date, in Your next action and Key dates alike', async () => {
    const { packetSections } = await import('./dealPacket');
    const { REDEEMED_ROW } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const tx: Deal = { ...deal, id: 'v109a', name: '4 Pine', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-03', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-21', what: 'SID certificate payoff', who: 'Me' }, { when: '2026-10-05', what: 'Call the insurance agent', who: 'Me' }] };
    savePacket(`analyzed:${tx.id}`, p);
    expect(dealNextTask(tx, p, now, 'contract').label).toMatch(/SID/);
    const pl = packetSections(tx, p, now).find((x) => x.key === 'dates')!.lines.join(' ');
    expect(pl).not.toMatch(/Next: Call the insurance agent/);
    expect(pl).not.toMatch(/Next: the special improvement district \(SID\) question/);
    const of: Deal = { ...tx, id: 'v109b', kind: 'reo', stage: 'contract' };
    saveDeals([of]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Offer accepted', who: 'Agent', resolved: true }, { when: '2026-11-21', what: 'Inspection period ends', who: 'Me' }, { when: '2026-10-05', what: 'Call the insurance agent', who: 'Me' }] };
    savePacket(`analyzed:${of.id}`, q);
    expect(dealNextTask(of, q, now, 'contract').label).toMatch(/Inspection/i);
    const hoa: Deal = { ...tx, id: 'v109c', kind: 'hoa', stage: 'closed' };
    saveDeals([hoa]);
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-09-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-10', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-09-12', what: 'Certificate of sale recorded', who: 'C', resolved: true }, { when: '2026-11-09', what: 'Redemption period ends', who: 'HOA' }, { when: '', what: REDEEMED_ROW, who: 'HOA' }, { when: '2026-11-23', what: 'Get contractor bids', who: 'Me' }] };
    savePacket(`analyzed:${hoa.id}`, r);
    expect(packetSections(hoa, r, now).find((x) => x.key === 'dates')!.lines.join(' ')).not.toMatch(/Next: Get contractor bids/);
  });

  it('round 110 tools: a reader date named like a contract word stays the reader’s; a paid-off Nevada lien’s payoff leads a reader date', async () => {
    const { packetSections } = await import('./dealPacket');
    const { REDEEMED_ROW } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'w110', name: '2 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-21', what: 'Payment deadline', who: 'Me' }, { when: '2026-11-20', what: 'Closing costs: ask the title company', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'contract').label).toMatch(/pay/i);
    expect(dealNextTask(tr, p, now, 'contract').label).not.toMatch(/Closing costs/);
    const ln: Deal = { ...tr, id: 'l110', kind: 'lien', stage: 'closed' };
    saveDeals([ln]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '', what: REDEEMED_ROW, who: 'Treasurer' }, { when: '2026-11-22', what: 'Call my accountant', who: 'Me' }] };
    savePacket(`analyzed:${ln.id}`, q);
    expect(dealNextTask(ln, q, now, 'closed').label).not.toMatch(/accountant/);
    expect(packetSections(ln, q, now).find((x) => x.key === 'dates')!.lines.join(' ')).not.toMatch(/Next: Call my accountant/);
  });

  it('round 110 clarity: a reader’s “Registration of my LLC” or “Closing costs: …” stays a reminder after the sale or closing', async () => {
    const { sameDate } = await import('./dealPacket');
    expect(sameDate('Registration of my LLC', 'Registration')).toBe(false);
    expect(sameDate('Bidder registration (if required)', 'Registration')).toBe(true);
    expect(sameDate('Registration deadline', 'Bidder registration')).toBe(true);
    expect(sameDate('Closing costs: ask title', 'Closing')).toBe(false);
    expect(sameDate('Closing (moved)', 'Closing')).toBe(true);
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'y110', name: '3 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-06-10', what: 'Deed recorded', who: 'C', resolved: true }, { when: '2026-07-10', what: 'Challenge window ends', who: 'Me', resolved: true }, { when: '2026-11-22', what: 'Registration of my LLC', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'owned').label).toMatch(/Registration of my LLC/);
  });
  it('round 110 verifier: one rule says which renamed rows are the sale’s registration, closing and SID payoff', async () => {
    const { sameDate, registrationRow, calendarRows } = await import('./dealPacket');
    const { officialRow } = await import('./dealStage');
    for (const n of ['Registration deadline', 'Bidder registration due Nov 21', 'Bidder registration closes Nov 23', 'Bidder registration online', 'Bidder registration and $5,000 deposit', 'Bidder registration with the trustee', 'Registration, Nov 21']) expect([n, registrationRow(n), sameDate(n, 'Registration')]).toEqual([n, true, true]);
    for (const n of ['Registration of my LLC', 'Registration for my LLC']) expect([n, registrationRow(n)]).toEqual([n, false]);
    for (const n of ['Closing scheduled with escrow', 'Closing, Dec 3', 'Closing with First American', 'Closing - title company']) expect([n, sameDate(n, 'Closing')]).toEqual([n, true]);
    for (const n of ['Closing costs: ask the title company', 'Closing statement: send to my CPA', 'Closing Disclosure received']) expect([n, sameDate(n, 'Closing')]).toEqual([n, false]);
    const tax: Deal = { ...deal, id: 'v110s', name: '4 Oak', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    expect(officialRow(tax, 'SID certificate payoff deadline')).toBe(true);
    expect(officialRow(tax, 'SID certificate payoff to the City of Henderson')).toBe(true);
    expect(officialRow(tax, 'Registration deadline')).toBe(true);
    expect(officialRow(tax, 'Registration of my LLC')).toBe(false);
    const now = new Date('2026-11-20T20:00:00Z');
    saveDeals([tax]);
    // (V110-1) A renamed SID payoff row at Won still leads: missing it voids the sale.
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-15', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-16', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '', what: 'Treasurer’s deed recorded', who: 'Treasurer' }, { when: '', what: 'Recovery-suit window ends', who: 'Me' }, { when: '2026-11-25', what: 'SID certificate payoff deadline', who: 'Me' }] };
    savePacket(`analyzed:${tax.id}`, p);
    expect(dealNextTask(tax, p, now, 'contract').label).toMatch(/SID/);
    // (V110-2) A renamed registration row tomorrow leads the sale 4 days out.
    const tr: Deal = { ...deal, id: 'v110r', name: '5 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'researching' };
    saveDeals([tr]);
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-21', what: 'Registration deadline', who: 'Trustee' }, { when: '2026-11-24', what: 'Sale day', who: 'Trustee' }, { when: '2026-11-24', what: 'Payment deadline', who: 'Me' }] };
    savePacket(`analyzed:${tr.id}`, q);
    expect(dealNextTask(tr, q, now, 'researching').label).toMatch(/Registration deadline/);
    // (V110-3) After a win, a renamed registration row is behind you, in the reminders and the calendar alike.
    const won = { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Bidder registration online', who: 'Trustee' }, { when: '2026-11-15', what: 'Sale day', who: 'Trustee', resolved: true }, { when: '2026-11-15', what: 'Payment deadline', who: 'Me', resolved: true }] };
    saveDeals([{ ...tr, stage: 'contract' }]);
    savePacket(`analyzed:${tr.id}`, won);
    expect(dealNextTask({ ...tr, stage: 'contract' }, won, now, 'contract').label).not.toMatch(/registration/i);
    expect(calendarRows(won, 'contract').some((x) => /registration/i.test(x.what))).toBe(false);
    // (V110-4) After closing, a renamed, unticked closing row is behind you.
    const re: Deal = { ...deal, id: 'v110c', name: '6 Oak', state: 'NV', county: 'Clark', kind: 'reo', plan: 'flip', stage: 'closed' };
    saveDeals([re]);
    const c = { ...EMPTY_PACKET, dates: [{ when: '2026-10-20', what: 'Offer accepted (Day 0)', who: 'Me', resolved: true }, { when: '2026-11-13', what: 'Closing scheduled with escrow', who: 'Escrow' }] };
    savePacket(`analyzed:${re.id}`, c);
    expect(dealNextTask(re, c, now, 'closed').label).not.toMatch(/Closing scheduled/);
    // (V110-5) The reader's own LLC reminder doesn't get the registration button.
    const llc = { ...EMPTY_PACKET, dates: [{ when: '2026-06-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-06-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-06-10', what: 'Deed recorded', who: 'C', resolved: true }, { when: '2026-07-10', what: 'Challenge window ends', who: 'Me', resolved: true }, { when: '2026-11-15', what: 'Registration of my LLC', who: 'Me' }] };
    const ow = { ...tr, stage: 'owned' as const };
    saveDeals([ow]);
    savePacket(`analyzed:${tr.id}`, llc);
    const t = dealNextTask(ow, llc, now, 'owned');
    expect(t.label).toMatch(/Registration of my LLC/);
    expect(JSON.stringify(t)).not.toMatch(/I registered/);
  });
  it('round 111 tools: a row the reader added (own) is the sale’s own event only when named exactly as it', async () => {
    const { sameDate, sameEvent, registrationRow, cleanPacket } = await import('./dealPacket');
    const { paidIn, officialRow, deedRecordedOn } = await import('./dealStage');
    const own = (what: string) => ({ what, own: true });
    const { ownNamed } = await import('./dealPacket');
    const offers = (w: string, n: string) => ownNamed(w, n) || (n === 'Closing' && ['Close of escrow', 'COE', 'Settlement'].some((a) => ownNamed(w, a)));
    for (const [w, n] of [['Sale day prep: get a cashier’s check', 'Sale day'], ['Payment deadline for HOA dues', 'Payment deadline'], ['Deed recorded copy to my lender', 'Deed recorded'], ['Earnest money: move cash', 'Earnest money'], ['Appraisal deadline for my refinance', 'Appraisal deadline']] as const) expect([w, sameDate(own(w), n), sameDate(w, n)]).toEqual([w, false, true]);
    for (const w of ['Closing day walk-through', 'Closing costs: ask title']) expect([w, sameEvent(own(w), 'Closing'), sameDate(own(w), 'Closing')]).toEqual([w, false, false]);
    for (const w of ['Registration with the Secretary of State', 'Registration for LLC', 'Registration: LLC annual list']) expect([w, registrationRow(own(w))]).toEqual([w, false]);
    for (const [w, n] of [['Sale day (get cashier’s check)', 'Sale day'], ['Payment deadline (HOA dues)', 'Payment deadline'], ['Closing (walk-through)', 'Closing']] as const) expect([w, sameDate(own(w), n), sameEvent(own(w), n)]).toEqual([w, false, false]);
    for (const [w, n] of [['Bidder registration (if required)', 'Bidder registration'], ['Sale day (Nov 24)', 'Sale day'], ['Sale day (postponed)', 'Sale day']] as const) expect([w, offers(w, n), sameDate(own(w), n), sameDate({ what: w, own: true, as: n }, n)]).toEqual([w, true, false, false]);
    for (const [w, n] of [['Sale day', 'Sale day'], ['Sale day (moved)', 'Sale day'], ['Payment deadline Nov 21', 'Payment deadline'], ['Registration deadline', 'Registration'], ['Closing: Dec 3', 'Closing'], ['Close of escrow', 'Closing']] as const) expect([w, offers(w, n), sameDate(own(w), n), sameDate({ what: w, own: true, as: n }, n)]).toEqual([w, true, false, false]);
    // (The site's own closing row, renamed, is still the closing in every check.)
    expect(sameEvent('Closing scheduled with escrow', 'Closing')).toBe(true);
    expect(sameEvent('Closing Disclosure received', 'Closing')).toBe(false);
    // (The flag survives saving and loading.)
    expect(cleanPacket({ dates: [{ when: '', what: 'x', who: '', own: true }] }).dates[0].own).toBe(true);
    expect(cleanPacket({ dates: [{ when: '', what: 'x', who: '' }] }).dates[0].own).toBeUndefined();
    const now = new Date('2026-11-20T20:00:00Z');
    // (TOOLS-1) A passed "Sale day prep" doesn't end the sale.
    const tr: Deal = { ...deal, id: 'v111a', name: '7 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'researching' };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-18', what: 'Sale day prep: get a cashier’s check', who: 'Me', own: true }, { when: '2026-11-22', what: 'Registration deadline', who: 'Trustee' }, { when: '2026-11-24', what: 'Sale day', who: 'Trustee' }] };
    expect(saleOverFor(tr, p, now)).toBe(false);
    saveDeals([tr]);
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'researching').label).not.toMatch(/did you win/i);
    // (TOOLS-2) "Payment deadline for HOA dues" doesn't un-pay a paid win.
    const tax: Deal = { ...deal, id: 'v111b', name: '8 Oak', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    const q = { ...EMPTY_PACKET, dates: [{ when: '2026-11-15', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-16', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-12-01', what: 'Payment deadline for HOA dues', who: 'Me', own: true }] };
    expect(paidIn(q, tax)).toBe(true);
    saveDeals([tax]);
    savePacket(`analyzed:${tax.id}`, q);
    expect(dealNextTask(tax, q, now, 'contract').label).toMatch(/SID/);
    // (TOOLS-4) A ticked copy to the lender isn't the deed's recording; the reader's own reminder isn't the sale's.
    expect(deedRecordedOn({ ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Deed recorded copy to my lender', who: 'Me', resolved: true, own: true }] }, true, now)).toBeUndefined();
    expect(officialRow(tr, own('Sale day prep: get a cashier’s check'))).toBe(false);
  });
  it('round 111 clarity: “Closing date” or “Sale date” typed by hand is the event; a bare number isn’t a date; a reader reminder doesn’t push aside insuring a win', async () => {
    const { sameDate, sameEvent, registrationRow } = await import('./dealPacket');
    const own = (what: string) => ({ what, own: true });
    const { ownNamed } = await import('./dealPacket');
    const offers = (w: string, n: string) => ownNamed(w, n) || (n === 'Closing' && ['Close of escrow', 'COE', 'Settlement'].some((a) => ownNamed(w, a)));
    for (const [w, n] of [['Closing date', 'Closing'], ['Closing day', 'Closing'], ['COE date', 'Closing'], ['Sale date', 'Sale day'], ['Payment deadline 11/21', 'Payment deadline']] as const) expect([w, offers(w, n), sameDate(own(w), n), sameDate({ what: w, own: true, as: n }, n)]).toEqual([w, true, false, false]);
    expect([ownNamed('Registration due', 'Registration'), registrationRow(own('Registration due')), registrationRow({ what: 'Registration due', own: true, as: 'Registration' })]).toEqual([true, false, false]);
    for (const [w, n] of [['Payment deadline 2nd HOA installment', 'Payment deadline'], ['Closing 2nd walk-through', 'Closing'], ['Closing day walk-through', 'Closing']] as const) expect([w, sameDate(own(w), n), sameEvent(own(w), n)]).toEqual([w, false, false]);
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'v111c', name: '10 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-19', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-22', what: 'Pay HOA dues', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'contract').label).toMatch(/Insure/);
  });
  it('round 111 verifier: after a typed date only a time or a date note may follow; a reminder due today or overdue still leads', async () => {
    const { sameDate, sameEvent } = await import('./dealPacket');
    const { windowTickWait } = await import('./dealStage');
    const own = (what: string) => ({ what, own: true });
    const { ownNamed } = await import('./dealPacket');
    const offers = (w: string, n: string) => ownNamed(w, n) || (n === 'Closing' && ['Close of escrow', 'COE', 'Settlement'].some((a) => ownNamed(w, a)));
    for (const [w, n] of [['Payment deadline Nov 20 for HOA dues', 'Payment deadline'], ['Payment deadline 11/16 for HOA dues', 'Payment deadline'], ['Closing 11/20 final walk-through', 'Closing'], ['Challenge window ends? ask my attorney', 'Challenge window ends']] as const) expect([w, sameDate(own(w), n), sameEvent(own(w), n)]).toEqual([w, false, false]);
    for (const [w, n] of [['Sale day (10 a.m.)', 'Sale day'], ['Sale day 10am', 'Sale day'], ['Sale day (postponed to Dec 5)', 'Sale day'], ['Sale day (moved to Dec 5)', 'Sale day'], ['Sale day Nov 24, 2026 at 9:30 a.m.', 'Sale day'], ['Closing: Dec 3', 'Closing'], ['Payment deadline 11/21/2026', 'Payment deadline']] as const) expect([w, offers(w, n), sameDate(own(w), n), sameDate({ what: w, own: true, as: n }, n)]).toEqual([w, true, false, false]);
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'v111d', name: '11 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-19', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-20', what: 'Pay HOA dues (late fee after today)', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'contract').label).toMatch(/Pay HOA dues/);
    // (A reader's own reminder named like a window can be ticked.)
    expect(windowTickWait(tr, p, own('Challenge window ends? ask my attorney'), now)).toBe('');
  });
  it('round 112 tools: after the event’s name only words that say when may follow; the site’s full names with their notes count', async () => {
    const { sameDate, sameEvent } = await import('./dealPacket');
    const own = (what: string) => ({ what, own: true });
    const { ownNamed } = await import('./dealPacket');
    const offers = (w: string, n: string) => ownNamed(w, n) || (n === 'Closing' && ['Close of escrow', 'COE', 'Settlement'].some((a) => ownNamed(w, a)));
    for (const [w, n] of [['Sale day moved to Dec 5', 'Sale day'], ['Sale day (Nov 10, 10 a.m.)', 'Sale day'], ['Sale day at 10', 'Sale day'], ['Sale day 10:00', 'Sale day'], ['Payment deadline Nov 19 by 5pm', 'Payment deadline'], ['Closing (est.)', 'Closing'], ['Earnest money due (3 business days)', 'Earnest money due'], ['Approval notice received (dates count from here)', 'Approval notice received'], ['Payment deadline (', 'Payment deadline'], ['Payment deadline 1', 'Payment deadline']] as const) expect([w, offers(w, n), sameDate(own(w), n), sameDate({ what: w, own: true, as: n }, n)]).toEqual([w, true, false, false]);
    expect(ownNamed('Registration (check the notice)', 'Registration (check the notice)')).toBe(true);
    expect(sameDate({ what: 'Registration (check the notice)', own: true, as: 'Registration (check the notice)' }, 'Registration')).toBe(false);
    for (const [w, n] of [['Sale day prep', 'Sale day'], ['Payment deadline Nov 20 for HOA dues', 'Payment deadline'], ['Payment deadline (HOA dues)', 'Payment deadline'], ['Closing day walk-through', 'Closing'], ['Closing may move', 'Closing'], ['Deed recorded copy to my lender', 'Deed recorded'], ['Registration of my LLC', 'Registration']] as const) expect([w, sameDate(own(w), n), sameEvent(own(w), n)]).toEqual([w, false, false]);
  });
  it('round 112 tools: a reader reminder due today doesn’t push aside a passed worked-out redemption end', async () => {
    const now = new Date('2026-11-20T20:00:00Z');
    const ho: Deal = { ...deal, id: 'v112a', name: '12 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([ho]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-08-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-08-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-08-02', what: 'Certificate of sale recorded', who: 'C', resolved: true }, { when: '', what: 'Redemption period ends', who: 'Me' }, { when: '2026-11-20', what: 'Call the contractor', who: 'Me', own: true }] };
    savePacket(`analyzed:${ho.id}`, p);
    expect(dealNextTask(ho, p, now, 'closed').label).toMatch(/redemption period ended/i);
  });
  it('round 112 clarity: a reader’s row stays their own reminder until they say which sale date it is, whatever the typing order', async () => {
    const { sameDate, cleanPacket } = await import('./dealPacket');
    const { eventFor, paidIn } = await import('./dealStage');
    const tr: Deal = { ...deal, id: 'v112c', name: '16 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    for (const w of ['Payment deadline for HOA dues', 'Sale day prep', 'Deed recorded copy to my lender']) expect([w, sameDate({ what: w, own: true }, w.split(' ').slice(0, 2).join(' '))]).toEqual([w, false]);
    // (Named exactly as one of this sale's usual dates, it becomes that date when the reader leaves the name box.)
    const { usualExact, autoStillHolds } = await import('./dealStage');
    expect(usualExact(tr, 'payment deadline')).toBe('Payment deadline');
    expect(usualExact(tr, 'Bidder registration')).toBe('Bidder registration (if required)');
    expect(usualExact(tr, 'Redemption period ends')).toBe('');
    expect(usualExact(tr, 'Closing')).toBe('');
    expect(usualExact({ state: 'NV', kind: 'taxSale' }, 'Challenge window ends')).toBe('');
    expect(autoStillHolds('Deed recorded (instrument 123)', 'Deed recorded')).toBe(true);
    expect(autoStillHolds('Payment deadline (wired from my bank)', 'Payment deadline')).toBe(true);
    expect(autoStillHolds('Payment deadline for HOA dues', 'Payment deadline')).toBe(false);
    expect(autoStillHolds('Sale day prep', 'Sale day')).toBe(false);
    expect(eventFor(tr, 'Sale day Wednesday 10am')).toBe('Sale day');
    expect(eventFor(tr, 'Close of escrow Dec 5')).toBe('');
    expect(eventFor(tr, 'Payment deadline for HOA dues')).toBe('');
    expect(eventFor(tr, 'Sale day prep')).toBe('');
    // (A reader's own row never counts as the sale's date, even one saved as chosen by an older build.)
    const paid = { ...EMPTY_PACKET, dates: [{ when: '2026-11-19', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-19', what: 'Payment deadline (wired from my bank)', who: 'Me', resolved: true, own: true, as: 'Payment deadline' }, { when: '2026-12-01', what: 'Payment deadline for HOA dues', who: 'Me', own: true }] };
    expect(paidIn(paid, tr)).toBe(false);
    expect(cleanPacket(paid).dates[1].as).toBe('Payment deadline');
    expect(cleanPacket({ dates: [{ when: '', what: 'x', who: '', as: 'Sale day' }] }).dates[0].as).toBeUndefined();
  });
  it('round 112 verifier: the offer names this kind of sale’s usual date, by the name its steps look for', async () => {
    const { eventFor } = await import('./dealStage');
    const { suggestedDates } = await import('./dealPacket');
    const tr = { state: 'NV' as const, kind: 'trustee' as const };
    const li = { state: 'NV' as const, kind: 'listing' as const };
    expect(eventFor(tr, 'Auction day Nov 24')).toBe(suggestedDates(tr).find((n) => /^sale day/i.test(n)));
    expect(eventFor(tr, 'SID certificate payoff')).toBe('');
    expect(eventFor(tr, 'Redemption period ends')).toBe('');
    expect(eventFor(li, 'Sale day')).toBe('');
    const em = eventFor(li, 'Earnest Money Deposit (wired Nov 3)');
    expect(em === '' || suggestedDates(li).includes(em)).toBe(true);
    expect(eventFor(li, 'EMD due Nov 3')).toBe(suggestedDates(li).find((n) => /^earnest money/i.test(n)) ?? '');
    expect(eventFor(li, 'COE Dec 5')).toBe(suggestedDates(li).find((n) => /^closing/i.test(n)) ?? '');
    expect(eventFor(tr, 'Registration deadline')).toBe(suggestedDates(tr).find((n) => /registration/i.test(n)) ?? '');
    const tx = { state: 'NV' as const, kind: 'taxSale' as const };
    expect(eventFor(tx, 'Deed recorded')).toBe(suggestedDates(tx).find((n) => /deed recorded/i.test(n)) ?? '');
  });
  it('round 113 clarity: at Owned, a deed date still to confirm leads a reader’s reminder', async () => {
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'v113a', name: '18 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'rent', stage: 'owned' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-25', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-25', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-01', what: 'Deed recorded', who: 'C' }, { when: '', what: 'Challenge window ends', who: 'Me' }, { when: '2026-11-22', what: 'Call insurance agent', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    expect(dealNextTask(tr, p, now, 'owned').label).not.toMatch(/insurance agent/);
  });
  it('round 116 clarity: a date the reader adds again, on the same day as a handled one, is done too', async () => {
    const { handledCopy } = await import('./dealPacket');
    const { paidIn } = await import('./dealStage');
    const now = new Date('2026-11-20T20:00:00Z');
    const ho: Deal = { ...deal, id: 'v116a', name: '19 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'contract' };
    saveDeals([ho]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'Me', own: true, as: 'Payment deadline', asAuto: true }] };
    expect(handledCopy(p, p.dates[2])).toBe(true);
    expect(paidIn(p, ho)).toBe(true);
    // (A reader's row never counts as the sale's own: a differently dated one is just their reminder.)
    expect(paidIn({ ...p, dates: [...p.dates.slice(0, 2), { when: '2026-11-12', what: 'Payment deadline', who: 'Me', own: true }] }, ho)).toBe(true);
    savePacket(`analyzed:${ho.id}`, p);
    expect(dealNextTask(ho, p, now, 'contract').label).not.toMatch(/payment deadline/i);
    // (A split payment on another day still needs its own tick.)
    const q = { ...p, dates: [...p.dates.slice(0, 2), { when: '2026-11-25', what: 'Payment deadline (second half)', who: 'Me' }] };
    expect(paidIn(q, ho)).toBe(false);
    // (A reader's own reminder, ticked, is never a copy of the sale's open payment.)
    const r = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-20', what: 'Payment deadline', who: 'HOA' }, { when: '2026-11-20', what: 'Payment deadline (bring cashier’s check)', who: 'Me', own: true, resolved: true }] };
    expect(handledCopy(r, r.dates[1])).toBe(false);
    expect(paidIn(r, ho)).toBe(false);
  });
  it('round 112 content: at Owned, a Nevada trustee buy’s passed worked-out challenge window leads a reader’s reminder', async () => {
    const now = new Date('2026-11-20T20:00:00Z');
    const tr: Deal = { ...deal, id: 'v112b', name: '15 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'rent', stage: 'owned' };
    saveDeals([tr]);
    for (const when of ['2026-11-20', '2026-11-22']) {
      const p = { ...EMPTY_PACKET, dates: [{ when: '2026-09-25', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-09-25', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-10-01', what: 'Deed recorded', who: 'C', resolved: true }, { when: '', what: 'Challenge window ends', who: 'Me' }, { when, what: 'Call insurance agent', who: 'Me', own: true }] };
      savePacket(`analyzed:${tr.id}`, p);
      expect(dealNextTask(tr, p, now, 'owned').label).toMatch(/challenge window/i);
    }
  });
  it('round 119 verifier: a reader’s SID reminder never hides an unpaid win’s payment, and a second payee stays on a step', async () => {
    const { suggestedDates, sidSiteFor } = await import('./dealPacket');
    const now = new Date('2026-11-18T20:00:00Z');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    // VER-1: Washoe, won and not paid; the reader types the SID payee at the counter.
    const wa: Deal = { ...deal, id: 'v119a', name: '1 Reno', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([wa]);
    let rows = set(base(wa), /^Sale day/, { when: '2026-11-17', resolved: true });
    const pw = { ...EMPTY_PACKET, dates: [...rows, { when: '2026-11-24', what: 'SID certificate payoff', who: 'City of Reno', own: true }] };
    savePacket(`analyzed:${wa.id}`, pw);
    const tw = dealNextTask(wa, pw, now, 'contract');
    expect(tw.label).not.toMatch(/your own reminder/);
    expect(tw.label).toMatch(/Pay|paid/);
    // VER-2: at Deed recorded, one payee paid and another still open: the open one keeps its step, by name.
    const cl: Deal = { ...deal, id: 'v119b', name: '2 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'closed' };
    saveDeals([cl]);
    rows = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    rows = set(rows, /^SID certificate payoff/, { when: '2026-11-18', who: 'City of Las Vegas', resolved: true });
    const pc = { ...EMPTY_PACKET, dates: [...rows, { when: '2026-11-27', what: 'SID certificate payoff', who: 'Clark County' }] };
    savePacket(`analyzed:${cl.id}`, pc);
    const tc = dealNextTask(cl, pc, now, 'closed');
    expect(tc.label).not.toMatch(/affidavit that you paid/);
    expect(tc.label).toMatch(/to Clark County by Nov 30/);
    expect(stageTasks(cl, 'closed', pc, now).some((x) => x.key === 'sid-paid-affidavit')).toBe(false);
    // VER-3: a reopened question names the payee whose row has no date, in the present tense.
    const ph: Deal = { ...cl, id: 'v119c', stage: 'contract' };
    saveDeals([ph]);
    const pr = { ...EMPTY_PACKET, dates: [...rows, { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    const ask = stageTasks(ph, 'contract', pr, now).find((x) => x.key === 'sid-affidavit')!;
    expect(ask.label).toMatch(/Did a city or county file an SID affidavit for another payoff to City of Henderson/);
    expect(ask.label).not.toMatch(/^Asked/);
    expect(ask.undo?.undatedOnly).toBe(true);
    // (A reader's reminder to the same payee moves into that payee's blank row, case aside.)
    const ps = { ...EMPTY_PACKET, dates: [...set(rows, /^SID certificate payoff/, { when: '', who: 'City of Henderson', resolved: false }), { when: '2026-11-22', what: 'SID certificate payoff', who: 'city of henderson ', own: true }] };
    expect(sidSiteFor(ps, ps.dates[ps.dates.length - 1])).toBe(ps.dates.findIndex((x) => !x.own && /^SID certificate payoff/.test(x.what)));
    // VER-4: a reminder that repeats the site's dated payoff doesn't lead.
    const pd = { ...EMPTY_PACKET, dates: [...set(rows, /^SID certificate payoff/, { when: '2026-11-20', who: 'City of Las Vegas', resolved: false }), { when: '2026-11-20', what: 'SID certificate payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${ph.id}`, pd);
    expect(dealNextTask(ph, pd, now, 'contract').label).not.toMatch(/your own reminder/);
    // VER-5: a trustee win's payment due today leads a hand-typed, ticked Auction date.
    const tr: Deal = { ...deal, id: 'v119d', name: '3 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...set(base(tr), /^Payment deadline/, { when: '2026-11-18' }), { when: '2026-11-18', what: 'Auction date', who: 'Me', own: true, resolved: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    expect(dealNextTask(tr, pt, now, 'contract').label).not.toMatch(/your own reminder/);
  });
  it('round 120 tools: county pay rules keep the Sale-day pointer; paid payees and open site SID rows keep their steps', async () => {
    const { suggestedDates, handledCopy, sidSiteFor } = await import('./dealPacket');
    const now = new Date('2026-11-18T20:00:00Z');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    // TOOLS-1: Washoe, sale date only on the reader's row, payment typed for tomorrow: move it first (the 5 p.m. rule needs it).
    const wa: Deal = { ...deal, id: 'v120a', name: '1 Reno', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([wa]);
    const pw = { ...EMPTY_PACKET, dates: [...set(base(wa), /^Payment deadline/, { when: '2026-11-19', who: 'Me' }), { when: '2026-11-17', what: 'Auction date', who: 'Me', own: true }] };
    savePacket(`analyzed:${wa.id}`, pw);
    expect(dealNextTask(wa, pw, now, 'contract').label).toMatch(/your own reminder/);
    // TOOLS-2: the City's row marked paid today; the reader's reminder to the same payee for Nov 22 is a handled copy.
    const cl: Deal = { ...deal, id: 'v120b', name: '2 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-18', who: 'City of Las Vegas', resolved: true }), { when: '2026-11-22', what: 'SID certificate payoff', who: 'city of  las vegas', own: true }] };
    expect(handledCopy(p2, p2.dates[p2.dates.length - 1])).toBe(true);
    savePacket(`analyzed:${cl.id}`, p2);
    expect(dealNextTask(cl, p2, new Date('2026-12-03T20:00:00Z'), 'contract').label).not.toMatch(/your own reminder/);
    // TOOLS-3: the site's dated, open payoff leads in its last week over a reminder dated differently, or with no payee.
    for (const who of ['City of Las Vegas', '']) {
      const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-22', who: 'City of Las Vegas' }), { when: '2026-11-26', what: 'SID certificate payoff', who, own: true }] };
      savePacket(`analyzed:${cl.id}`, p3);
      expect(dealNextTask(cl, p3, new Date('2026-11-24T20:00:00Z'), 'contract').label).not.toMatch(/your own reminder/);
      expect(sidSiteFor(p3, p3.dates[p3.dates.length - 1])).toBe(p3.dates.findIndex((x) => !x.own && /^SID certificate payoff/.test(x.what)));
    }
    // TOOLS-4: after the deadline, the reopened question still names the payee whose row has no date.
    const p4 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-22', who: 'City of Las Vegas', resolved: true }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    const ask = stageTasks(cl, 'contract', p4, new Date('2026-12-03T20:00:00Z')).find((x) => x.key === 'sid-affidavit')!;
    expect(ask.label).toMatch(/Was an SID affidavit filed for another payoff to City of Henderson .* paid by Nov 30, 2026/);
    expect(ask.record?.label).toMatch(/City of Henderson/);
    expect(ask.tick?.label).toMatch(/sale is void/);
    expect(ask.undo?.undatedOnly).toBe(true);
    // CONTENT-1: the site's default payee words are not a payee name.
    const pdef = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-25', who: 'You, with that city or county' })] };
    const due = stageTasks({ ...cl, stage: 'closed' }, 'closed', pdef, now).find((x) => x.key === 'sid-pay');
    expect(due?.label).not.toMatch(/to You/);
    // TOOLS-5: at Deed recorded, a dated payoff still owed comes before the question about an undated one.
    const p5 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-22', who: 'City of Las Vegas' }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    const keys = stageTasks({ ...cl, stage: 'closed' }, 'closed', p5, now).filter((x) => !x.done).map((x) => x.key);
    expect(keys.indexOf('sid-pay')).toBeGreaterThanOrEqual(0);
    expect(keys.indexOf('sid-pay')).toBeLessThan(keys.indexOf('sid-affidavit'));
  });
  it('round 120 clarity: SID reminders naming no payee or “Me”, the first SID Yes uses the reader’s row, the reopened Yes dates one payee, the county pay hour in the pointer', async () => {
    const { suggestedDates, handledCopy, sidSiteFor } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v120c', name: '4 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    // CLARITY-2: "Me" or blank, next to the sale's only SID row: the same payment, before and after it's paid.
    for (const who of ['', 'Me']) {
      const open = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-22', who: 'City of Las Vegas' }), { when: '2026-11-22', what: 'SID certificate payoff', who, own: true }] };
      expect(sidSiteFor(open, open.dates[open.dates.length - 1])).toBe(open.dates.findIndex((x) => !x.own && /^SID/.test(x.what)));
      const done = { ...open, dates: set(open.dates, /^SID certificate payoff/, { when: '2026-11-19', resolved: true }) };
      expect(handledCopy(done, done.dates[done.dates.length - 1])).toBe(true);
      savePacket(`analyzed:${cl.id}`, done);
      expect(dealNextTask(cl, done, new Date('2026-11-25T20:00:00Z'), 'contract').label).not.toMatch(/your own reminder/);
    }
    // CLARITY-1: the first SID question's Yes uses the reader's own payoff row.
    const own = { ...EMPTY_PACKET, dates: [...paid, { when: '2026-11-25', what: 'SID certificate payoff', who: 'City of Las Vegas', own: true }] };
    const q = stageTasks(cl, 'contract', own, new Date('2026-11-19T20:00:00Z')).find((x) => x.key === 'sid-affidavit')!;
    expect(q.redate?.moveOwn).toEqual({ what: 'SID certificate payoff', when: '2026-11-25', who: 'City of Las Vegas', payee: 'City of Las Vegas' });
    expect(q.redate?.label).toMatch(/SID affidavit for the payoff to City of Las Vegas I added \(Nov 25, 2026\)\. Use that row/);
    // CLARITY-3: the reopened Yes dates only the payee it names.
    const two = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Las Vegas', resolved: true }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }, { when: '', what: 'SID certificate payoff', who: 'Clark County' }] };
    const r = stageTasks(cl, 'contract', two, new Date('2026-11-19T20:00:00Z')).find((x) => x.key === 'sid-affidavit')!;
    expect(r.redate?.onlyWho).toBe('City of Henderson');
    // VER-1 (round 120 verifier): once one payee is dated, the other's undated row is still asked about on that step.
    const one = { ...two, dates: two.dates.map((x) => (x.who === 'City of Henderson' ? { ...x, when: '2026-11-30' } : x)) };
    savePacket(`analyzed:${cl.id}`, one);
    expect(dealNextTask(cl, one, new Date('2026-11-25T20:00:00Z'), 'contract').label).toMatch(/Also ask the Treasurer whether Clark County filed an SID affidavit: that payoff’s row in Key dates has no date/);
    expect(dealNextTask(cl, one, new Date('2026-11-25T20:00:00Z'), 'contract').undo?.label).toBe('No SID affidavit for the payoff to City of Henderson after all: remove that row');
    const kc = stageTasks({ ...cl, stage: 'closed' }, 'closed', one, new Date('2026-11-25T20:00:00Z')).find((x) => x.key === 'sid-pay');
    expect(kc?.label).toMatch(/to City of Henderson by Nov 30, 2026.*Also ask .* Clark County/);
    // VER-3: a "Me" reminder isn't done while another SID row is still open.
    const me = { ...one, dates: [...one.dates, { when: '2026-12-05', what: 'SID certificate payoff', who: 'Me', own: true }] };
    expect(handledCopy(me, me.dates[me.dates.length - 1])).toBe(false);
    // CLARITY-4: Clark, sale date only on the reader's row, unpaid: the pointer says the county's pay hour.
    const pc = { ...EMPTY_PACKET, dates: [...set(base(cl), /^Payment deadline/, { when: '2026-11-19', who: 'Me' }), { when: '2026-11-19', what: 'Auction date', who: 'Me', own: true }] };
    savePacket(`analyzed:${cl.id}`, pc);
    const t = dealNextTask(cl, pc, new Date('2026-11-19T19:00:00Z'), 'contract');
    expect(t.label).toMatch(/your own reminder/);
    expect(t.label).toMatch(/reminder\. Your payment is due by 1:00 p\.m\. Nevada time today, Nov 19, 2026, under Clark County’s terms/);
  });
  it('round 121 tools: a “SID payoff” reminder to a paid payee is done; a no-payee reminder never takes the open SID question', async () => {
    const { suggestedDates, handledCopy, sidSiteFor } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v121a', name: '5 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    // TOOLS-1
    const pb = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Las Vegas', resolved: true }), { when: '2026-11-15', what: 'SID payoff', who: 'CITY OF LAS VEGAS', own: true }] };
    expect(handledCopy(pb, pb.dates[pb.dates.length - 1])).toBe(true);
    savePacket(`analyzed:${cl.id}`, pb);
    expect(dealNextTask(cl, pb, new Date('2026-11-19T20:00:00Z'), 'contract').label).not.toMatch(/your own reminder/);
    // TOOLS-2: one paid, another undated, a "Me" reminder: the question leads, and the reminder isn't given to Henderson.
    const pc = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-20', who: 'City of Las Vegas', resolved: true }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }, { when: '2026-11-27', what: 'SID certificate payoff', who: 'Me', own: true }] };
    savePacket(`analyzed:${cl.id}`, pc);
    expect(sidSiteFor(pc, pc.dates[pc.dates.length - 1])).toBe(-1);
    expect(dealNextTask(cl, pc, new Date('2026-11-25T20:00:00Z'), 'contract').label).toMatch(/SID affidavit for another payoff to City of Henderson/);
    // TOOLS-4: once every SID row is paid, a "Me" reminder is done.
    const pd = { ...pc, dates: pc.dates.map((x) => (x.who === 'City of Henderson' ? { ...x, when: '2026-11-24', resolved: true } : x)) };
    expect(handledCopy(pd, pd.dates[pd.dates.length - 1])).toBe(true);
  });
  it('round 121 clarity: an unnamed payoff’s remove button names its date; a named reminder moves into the site’s “Me” payoff; Key dates asks for the Sale day before the redemption question', async () => {
    const { suggestedDates, sidSiteFor, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v121b', name: '6 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    // CLARITY-1
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'Me' }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    savePacket(`analyzed:${cl.id}`, p1);
    const t1 = dealNextTask(cl, p1, new Date('2026-11-25T20:00:00Z'), 'contract');
    expect(t1.undo?.label).toBe('No SID affidavit for the Nov 30, 2026 payoff after all: remove that row');
    expect(t1.undo?.removeWhen).toBe('2026-11-30');
    // CLARITY-2
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'Me' }), { when: '2026-11-27', what: 'SID certificate payoff', who: 'City of Henderson', own: true }] };
    expect(sidSiteFor(p2, p2.dates[p2.dates.length - 1])).toBe(p2.dates.findIndex((x) => !x.own && /^SID/.test(x.what)));
    // CLARITY-3
    const ho: Deal = { ...deal, id: 'v121c', name: '7 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([ho]);
    const p3 = { ...EMPTY_PACKET, dates: [...base(ho).filter((x) => !/^Deed delivered/.test(x.what)), { when: '2026-11-18', what: 'Deed delivered (if no one redeemed)', who: '' }] };
    savePacket(`analyzed:${ho.id}`, p3);
    const lines = packetSections(ho, p3, new Date('2026-11-25T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).not.toMatch(/the redemption period is over/);
  });
  it('round 121 verifier: an undated named reminder is never moved over a dated payoff; a reminder never stands in for the dated SID payoff step', async () => {
    const { suggestedDates, sidSiteFor, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v121d', name: '8 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    const yes = set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'Me' });
    // VER-1
    const p1 = { ...EMPTY_PACKET, dates: [...yes, { when: '', what: 'SID certificate payoff', who: 'City of Henderson', own: true }] };
    expect(sidSiteFor(p1, p1.dates[p1.dates.length - 1])).toBe(-1);
    // VER-2: Nov 19, the payoff is 11 days out; a reminder for Nov 23 doesn't replace its step, and Key dates agrees.
    const now = new Date('2026-11-19T20:00:00Z');
    for (const who of ['', 'City of Henderson']) {
      const p2 = { ...EMPTY_PACKET, dates: [...yes, { when: '2026-11-23', what: 'SID payoff', who, own: true }] };
      savePacket(`analyzed:${cl.id}`, p2);
      expect(dealNextTask(cl, p2, now, 'contract').label).toMatch(/SID certificate payoff/);
      expect(dealNextTask(cl, p2, now, 'contract').label).not.toMatch(/^Insure/);
      const lines = packetSections(cl, p2, now).find((x) => x.key === 'dates')!.lines.join(' | ');
      expect(lines).not.toMatch(/Next: the special improvement district \(SID\) question/);
    }
  });
  it('round 122 tools: the remove button removes its own row; a second payee’s reminder is on a step; certificate sales at Owned check the deed date', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v122a', name: '9 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    // TOOLS-1
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-20', who: 'Me' }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    savePacket(`analyzed:${cl.id}`, p1);
    const t1 = dealNextTask(cl, p1, now, 'contract');
    if (t1.undo?.removeWhen) expect(t1.undo.removeWhen).toBe('2026-11-20');
    // TOOLS-3
    const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'City of Las Vegas' }), { when: '2026-11-22', what: 'SID payoff', who: 'City of Henderson', own: true }] };
    savePacket(`analyzed:${cl.id}`, p3);
    expect(dealNextTask(cl, p3, now, 'contract').label).toMatch(/SID payoff/);
    // TOOLS-4: HOA at Owned, the deed date typed before the redemption end.
    const ho: Deal = { ...deal, id: 'v122b', name: '10 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'owned' };
    saveDeals([ho]);
    const p4 = { ...EMPTY_PACKET, dates: [...set(set(base(ho), /^Sale day/, { when: '2026-11-01', resolved: true }), /^Deed delivered/, { when: '2026-11-10' })] };
    savePacket(`analyzed:${ho.id}`, p4);
    expect(dealNextTask(ho, p4, now, 'owned').label).toMatch(/before the redemption period ends/);
    // TOOLS-5: no Sale day at Owned: Key dates asks for it.
    const p5 = { ...EMPTY_PACKET, dates: [...set(base(ho).filter((x) => !/^Sale day/.test(x.what)), /^Deed delivered/, { when: '2026-11-10' })] };
    savePacket(`analyzed:${ho.id}`, p5);
    const lines = packetSections(ho, p5, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).not.toMatch(/mark it once you have it/);
  });
  it('round 122 clarity: the SID payoff leads a later reminder at Won; a hand-typed Sale day after buying gets the pointer; deed and SID names in a reader’s words', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const { eventFor } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v122c', name: '11 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-10', resolved: true }), /^Payment deadline/, { when: '2026-11-10', resolved: true });
    // CLARITY-1
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-28', who: 'City of Las Vegas' }), { when: '2026-11-22', what: 'Call the locksmith', who: 'Me', own: true }] };
    savePacket(`analyzed:${cl.id}`, p1);
    expect(dealNextTask(cl, p1, now, 'contract').label).toMatch(/SID certificate payoff/);
    // CLARITY-2: HOA at Deed recorded, Sale day typed by hand.
    const ho: Deal = { ...deal, id: 'v122d', name: '12 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([ho]);
    const p2 = { ...EMPTY_PACKET, dates: [...base(ho), { when: '2026-11-12', what: 'Sale day', who: 'Me', own: true }] };
    savePacket(`analyzed:${ho.id}`, p2);
    expect(dealNextTask(ho, p2, now, 'closed').label).toMatch(/your own reminder/);
    // CLARITY-3 / CLARITY-4
    expect(eventFor(ho, 'Deed received')).toMatch(/^Deed delivered/);
    expect(eventFor(ho, 'Sheriff’s deed')).toMatch(/^Deed delivered/);
    expect(eventFor(cl, 'Deed date')).toMatch(/deed recorded/i);
    expect(eventFor(cl, 'SID payoff to City of Las Vegas')).toMatch(/^SID certificate payoff/);
  });
  it('round 122 verifier: one rule for a reader’s SID reminders', async () => {
    const { suggestedDates, sidPayee, sidSiteFor } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v122e', name: '13 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // VER-1: a named reminder next to the site's "Me" row: the sale's payoff step leads, not Insure.
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-12-02', who: 'Me' }), { when: '2026-11-27', what: 'SID payment', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p1);
    expect(dealNextTask(cl, p1, now, 'contract').label).toMatch(/SID certificate payoff/);
    // VER-2: at Deed recorded, a payoff to a payee no sale row names, overdue: it leads with its pointer.
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-12-02', who: 'City of Henderson' }), { when: '2026-11-18', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p2);
    expect(dealNextTask({ ...cl, stage: 'closed' }, p2, now, 'closed').label).toMatch(/your own reminder/);
    // VER-3: after "no affidavit", a reader's SID reminder never leads.
    const p3 = { ...EMPTY_PACKET, dates: [...paid.filter((x) => !/^SID/.test(x.what)), { when: '2026-11-19', what: 'Treasurer confirmed no SID affidavit', who: 'T', resolved: true }, { when: '2026-11-22', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p3);
    expect(dealNextTask(cl, p3, now, 'contract').label).not.toMatch(/voids the sale/);
    // VER-4: the payee can come from the name.
    const own = { when: '2026-11-25', what: 'SID payoff to City of Las Vegas', who: '', own: true };
    expect(sidPayee(own)).toBe('City of Las Vegas');
    const p4 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-28', who: 'City of Henderson' }), own] };
    expect(sidSiteFor(p4, own)).toBe(-1);
  });
  it('round 123 tools: a payee in the reminder’s name survives Move, “Use that row” and a Who of “Me”; a third payee’s overdue payoff leads; Key dates keeps an unplaceable one', async () => {
    const { suggestedDates, sidPayee, sidSiteFor, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v123a', name: '14 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // TOOLS-1
    const mine = { when: '2026-11-25', what: 'SID payoff to City of Las Vegas', who: '', own: true };
    const q = stageTasks(cl, 'contract', { ...EMPTY_PACKET, dates: [...paid, mine] }, now).find((x) => x.key === 'sid-affidavit')!;
    expect(q.redate?.moveOwn?.payee).toBe('City of Las Vegas');
    // TOOLS-2 / TOOLS-6
    expect(sidPayee({ ...mine, who: 'Me' })).toBe('City of Las Vegas');
    expect(sidPayee({ ...mine, what: 'SID payoff to City of Las Vegas (moved to Nov 25)' })).toBe('City of Las Vegas');
    expect(sidPayee({ ...mine, what: 'SID payoff for parcel 12 to Clark County' })).toBe('Clark County');
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-28', who: 'City of Henderson' }), { ...mine, who: 'Me', when: '2026-11-21' }] };
    expect(sidSiteFor(p2, p2.dates[p2.dates.length - 1])).toBe(-1);
    savePacket(`analyzed:${cl.id}`, p2);
    expect(dealNextTask(cl, p2, now, 'contract').label).toMatch(/SID payoff to City of Las Vegas/);
    // TOOLS-3: Las Vegas paid, Henderson undated (reopened question), the reader's Clark County payoff 3 days overdue.
    const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Las Vegas', resolved: true }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }, { when: '2026-11-16', what: 'SID payoff', who: 'Clark County', own: true }] };
    savePacket(`analyzed:${cl.id}`, p3);
    expect(dealNextTask(cl, p3, now, 'contract').label).toMatch(/your own reminder/);
    // TOOLS-4: Key dates names the same reminder.
    const lines = packetSections(cl, p2, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).toMatch(/Next: your own “SID payoff to City of Las Vegas” reminder/);
  });
  it('round 123 content: Key dates follows Your next action for a reader’s own Sale day after buying', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const now = new Date('2026-11-19T20:00:00Z');
    const ho: Deal = { ...deal, id: 'v123b', name: '15 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'closed' };
    saveDeals([ho]);
    const p = { ...EMPTY_PACKET, dates: [...suggestedDates(ho).map((what) => ({ when: '', what, who: '' })), { when: '2026-10-01', what: 'Sale day', who: 'Me', own: true }] };
    savePacket(`analyzed:${ho.id}`, p);
    const lines = packetSections(ho, p, now).find((x) => x.key === 'dates')!.lines.join(' | ');
    expect(lines).not.toMatch(/Next: Sale day, overdue/);
    expect(lines).toMatch(/Next: your own “Sale day” reminder \(see Your next action\)/);
  });
  it('round 123 clarity: a far-off reminder to a new SID payee doesn’t hide the sale’s payoff; Key dates names the reminder Your next action is about; a past Closing after buying isn’t overdue', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v123c', name: '16 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // CLARITY-1
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'City of Henderson' }), { when: '2026-11-29', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p1);
    expect(dealNextTask(cl, p1, now, 'contract').label).toMatch(/SID certificate payoff/);
    // CLARITY-2: the deadline 5 days away, the reader's payoff (to the sale's undated row) in 3: Key dates names it.
    const now2 = new Date('2026-11-27T20:00:00Z');
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '', who: '' }), { when: '2026-11-30', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p2);
    const t2 = dealNextTask(cl, p2, now2, 'contract');
    if (/your own reminder/.test(t2.label)) expect(packetSections(cl, p2, now2).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Next: your own “SID payoff” reminder/);
    // CLARITY-3
    const li: Deal = { ...deal, id: 'v123d', name: '17 Oak', state: 'NV', county: 'Clark', kind: 'listing', plan: 'rent', stage: 'closed' };
    saveDeals([li]);
    const p3 = { ...EMPTY_PACKET, dates: [{ when: '2026-11-14', what: 'Closing', who: 'Escrow', own: true }] };
    savePacket(`analyzed:${li.id}`, p3);
    expect(dealNextTask(li, p3, now, 'closed').label).not.toMatch(/Overdue by 5 days/);
  });
  it('round 123 verifier: payee names compared loosely; a missed sale payoff leads a reader’s overdue reminder', async () => {
    const { suggestedDates, sidPayee, sidSamePayee } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const row = { when: '2026-11-28', what: 'SID certificate payoff', who: 'City of Henderson' };
    for (const what of ['SID payoff to the City of Henderson', 'SID payoff to Henderson']) expect(sidSamePayee({ when: '2026-11-28', what, who: '', own: true }, row)).toBe(true);
    expect(sidPayee({ when: '', what: 'SID payment to be made', who: '', own: true })).toBe('');
    // VER-2
    const cl: Deal = { ...deal, id: 'v123e', name: '18 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    const p = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'City of Henderson' }), { when: '2026-12-01', what: 'SID payoff to City of Las Vegas', who: '', own: true }] };
    savePacket(`analyzed:${cl.id}`, p);
    expect(dealNextTask(cl, p, new Date('2026-12-04T20:00:00Z'), 'contract').label).not.toMatch(/your own reminder/);
  });
  it('round 124 tools: the sale’s SID payoff due within a week leads another payee’s reminder and names it; payee notes are dropped; Key dates names the reopened question', async () => {
    const { suggestedDates, sidPayee, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const now = new Date('2026-11-19T20:00:00Z');
    const cl: Deal = { ...deal, id: 'v124a', name: '19 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // TOOLS-1, at Won and Deed recorded
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-20', who: 'City of Henderson' }), { when: '2026-11-18', what: 'SID payoff to City of Las Vegas', who: '', own: true }] };
    savePacket(`analyzed:${cl.id}`, p1);
    for (const st of ['contract', 'closed'] as const) {
      const t = dealNextTask({ ...cl, stage: st }, p1, now, st);
      expect(t.label).not.toMatch(/is your own reminder/);
      expect(t.label).toMatch(/Also: the reminder you added, “SID payoff to City of Las Vegas”/);
    }
    // TOOLS-2
    for (const what of ['SID payoff to City of Henderson on 11/21', 'SID payoff to City of Henderson by check', 'SID payoff to City of Henderson, NV']) expect(sidPayee({ when: '', what, who: '', own: true })).toBe('City of Henderson');
    // TOOLS-3
    const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Las Vegas', resolved: true }), { when: '', what: 'SID certificate payoff', who: 'City of Henderson' }] };
    savePacket(`analyzed:${cl.id}`, p3);
    expect(dealNextTask(cl, p3, now, 'contract').key).toBe('sid-affidavit');
    expect(packetSections(cl, p3, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/Next: the special improvement district \(SID\) question/);
  });
  it('round 124 content: a reminder after the deadline is told to pay by it; Key dates follows the sale’s payoff; a reader’s payoff ticked late is asked about', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v124b', name: '20 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // CONTENT-1: deadline Dec 2; the reader's date Dec 5 to the same payee, the sale's row Nov 20; clock Nov 28.
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'City of Henderson' }), { when: '2026-12-05', what: 'SID payoff', who: 'City of Henderson', own: true }] };
    savePacket(`analyzed:${cl.id}`, p1);
    const t1 = dealNextTask(cl, p1, new Date('2026-11-28T20:00:00Z'), 'contract');
    expect(t1.label).not.toMatch(/whether the sale stands/);
    // CONTENT-2: the sale's payoff due tomorrow, with the Also sentence: Key dates doesn't name the reminder.
    const now = new Date('2026-11-19T20:00:00Z');
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-20', who: 'City of Henderson' }), { when: '2026-11-18', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p2);
    expect(dealNextTask(cl, p2, now, 'contract').label).toMatch(/Also: the reminder you added/);
    expect(packetSections(cl, p2, now).find((x) => x.key === 'dates')!.lines.join(' | ')).not.toMatch(/Next: your own “SID payoff” reminder/);
    // CONTENT-3
    const p3 = { ...EMPTY_PACKET, dates: [...paid.filter((x) => !/^SID/.test(x.what)), { when: '2026-12-05', what: 'SID payoff', who: 'City of Henderson', own: true, resolved: true }] };
    // (A reader's own payoff ticked late to a payee no sale row names: the sale-stands question, as for a sale row.)
    expect(stageTasks(cl, 'contract', p3, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(true);
    // VER-3 (round 124 verifier): the sale's own row ticked with a future date after the deadline isn't asked about yet.
    const p4 = { ...EMPTY_PACKET, dates: [...paid, { ...set(base(cl), /^SID certificate payoff/, {}).find((x) => /^SID/.test(x.what))!, when: '2026-12-05', who: 'City of Henderson', resolved: true }] };
    expect(stageTasks(cl, 'contract', p4, new Date('2026-11-19T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(false);
    expect(stageTasks(cl, 'contract', p4, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(true);
  });
  it('round 124 clarity: payees in a reader’s own words; a future-dated ticked payoff isn’t asked about yet', async () => {
    const { sidPayee, sidNamed } = await import('./dealPacket');
    const r = (what: string, who = '') => sidPayee({ when: '', what, who, own: true });
    for (const what of ['SID payoff to City of Las Vegas', 'SID payoff - City of Las Vegas', 'SID payment (City of Las Vegas)', 'SID payoff: City of Las Vegas']) expect(r(what)).toBe('City of Las Vegas');
    // (Only a plainly named payee counts; anything else names none, and the row's note asks for the payee.)
    expect(sidNamed('Second SID payoff')).toBe(false);
    for (const what of ['SID payoff to the Treasurer', 'SID payoff to Clark County Treasurer', 'SID payoff Nov 25', 'SID payoff deadline', 'SID payment to be made', 'SID payoff Final', 'SID payoff ASAP']) expect(r(what)).toBe('');
    expect(r('SID payoff City of Las Vegas')).toBe('City of Las Vegas');
    const { suggestedDates } = await import('./dealPacket');
    const cl: Deal = { ...deal, id: 'v124c', name: '21 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = suggestedDates(cl).filter((w) => !/^SID/.test(w)).map((what) => ({ when: /^(Sale day|Payment deadline)/.test(what) ? '2026-11-12' : '', what, who: '', resolved: /^(Sale day|Payment deadline)/.test(what) }));
    const p = { ...EMPTY_PACKET, dates: [...paid, { when: '2026-12-05', what: 'SID payoff', who: 'City of Henderson', own: true, resolved: true }] };
    expect(stageTasks(cl, 'contract', p, new Date('2026-11-19T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(false);
  });
  it('round 125 tools: a future-dated SID tick isn’t paid; an undated payoff with a payee is on a step; a reader’s late payoff to a new payee is asked about; payee parsing', async () => {
    const { suggestedDates, sidPayee } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v125a', name: '22 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // TOOLS-1: the sale's row ticked with Dec 5 (future): on Dec 1 the step still says to pay by Dec 2.
    const p1 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-12-05', who: 'City of Henderson', resolved: true })] };
    savePacket(`analyzed:${cl.id}`, p1);
    const t1 = dealNextTask(cl, p1, new Date('2026-12-01T20:00:00Z'), 'contract');
    expect(t1.label).not.toMatch(/^Insure/);
    expect(t1.label).toMatch(/Dec 2, 2026/);
    // TOOLS-2: an undated reader payoff to a payee no sale row names, the deadline in 5 days.
    const p2 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Henderson', resolved: true }), { when: '', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p2);
    expect(dealNextTask(cl, p2, new Date('2026-11-27T20:00:00Z'), 'contract').label).toMatch(/SID payoff/);
    // TOOLS-3: a reader's own payoff to Las Vegas ticked Dec 5, Henderson paid on time.
    const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-15', who: 'City of Henderson', resolved: true }), { when: '2026-12-05', what: 'SID payoff', who: 'City of Las Vegas', own: true, resolved: true }] };
    expect(stageTasks(cl, 'contract', p3, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(true);
    // (A receipt for the paid Henderson payoff is not.)
    const p3b = { ...p3, dates: [...p3.dates.slice(0, -1), { when: '2026-12-05', what: 'SID payoff', who: 'City of Henderson', own: true, resolved: true }] };
    expect(stageTasks(cl, 'contract', p3b, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(false);
    // TOOLS-6
    expect(sidPayee({ when: '', what: 'SID payoff to City of Henderson 11/25', who: '', own: true })).toBe('City of Henderson');
    expect(sidPayee({ when: '', what: 'SID payoff to City of Henderson Friday', who: '', own: true })).toBe('City of Henderson');
  });
  it('round 125 content: a future-ticked sale SID row still leads a reader’s reminder and reads as not paid yet in Key dates', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const { siteSidSoon } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v125b', name: '23 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    const p = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-30', who: 'City of Henderson', resolved: true }), { when: '2026-11-26', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    savePacket(`analyzed:${cl.id}`, p);
    const now = new Date('2026-11-27T20:00:00Z');
    expect(siteSidSoon(p, '2026-11-27')).toBe(true);
    expect(dealNextTask(cl, p, now, 'contract').label).not.toMatch(/your own reminder/);
    expect(packetSections(cl, p, now).find((x) => x.key === 'dates')!.lines.join(' | ')).toMatch(/not paid yet: marked paid on a day still to come/);
  });
  it('round 125 clarity: sale-date names; “the sale stands” answers the SID question; a named reminder next to the paid “Me” row is that payment', async () => {
    const { suggestedDates, handledCopy } = await import('./dealPacket');
    const { eventFor, sidAnswered } = await import('./dealStage');
    const tx = { state: 'NV' as const, kind: 'taxSale' as const };
    for (const n of ['Date of sale', 'Sale', 'Won auction', 'Sale date']) expect(eventFor(tx, n)).toMatch(/^Sale day/);
    expect(eventFor(tx, 'Sale price')).toBe('');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v125c', name: '24 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    expect(sidAnswered({ ...EMPTY_PACKET, dates: [...paid, { when: '2026-12-06', what: 'Treasurer confirmed the sale stands', who: 'T', resolved: true }] })).toBe(true);
    const p = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-19', who: 'Me', resolved: true }), { when: '2026-11-25', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    expect(handledCopy(p, p.dates[p.dates.length - 1])).toBe(true);
    savePacket(`analyzed:${cl.id}`, p);
    expect(dealNextTask(cl, p, new Date('2026-11-24T20:00:00Z'), 'contract').label).not.toMatch(/voids the sale/);
  });
  it('round 125 verifier: ordinary words aren’t payees; “the sale stands” settles Key dates; a copy of the paid “Me” payoff stays a copy when ticked', async () => {
    const { suggestedDates, sidPayee, packetSections } = await import('./dealPacket');
    const { eventFor } = await import('./dealStage');
    const r = (what: string) => sidPayee({ when: '', what, who: '', own: true });
    for (const what of ['SID payoff Confirmed with City of Henderson', 'SID payoff Quote from City of Henderson', 'SID payoff Paid, City of Henderson', 'SID payoff Receipt, City of Henderson']) expect(r(what)).toBe('');
    expect(r('SID payoff City of Henderson')).toBe('City of Henderson');
    expect(r('SID payoff Clark County')).toBe('Clark County');
    expect(r('SID payoff to Town of Sunrise Manor')).toBe('Town of Sunrise Manor');
    expect(eventFor({ state: 'NV', kind: 'taxSale' }, 'Sale deed')).not.toMatch(/^Sale day/);
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v125d', name: '25 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    // VER-2
    const p2 = { ...EMPTY_PACKET, dates: [...paid.filter((x) => !/^SID/.test(x.what)), { when: '2026-12-05', what: 'SID payoff', who: 'City of Henderson', own: true, resolved: true }, { when: '2026-12-06', what: 'Treasurer confirmed the sale stands', who: 'T', resolved: true }] };
    savePacket(`analyzed:${cl.id}`, p2);
    expect(packetSections(cl, p2, new Date('2026-12-07T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join(' | ')).not.toMatch(/ask the Treasurer whether an SID affidavit was filed/);
    // VER-3
    const p3 = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-19', who: 'Me', resolved: true }), { when: '2026-11-25', what: 'SID payoff', who: 'City of Las Vegas', own: true, resolved: true }] };
    expect(stageTasks(cl, 'contract', p3, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(false);
    // (One dated after the deadline isn't that on-time payment: it's asked about.)
    const p3b = { ...p3, dates: p3.dates.map((x) => (x.own ? { ...x, when: '2026-12-05' } : x)) };
    expect(stageTasks(cl, 'contract', p3b, new Date('2026-12-06T20:00:00Z')).some((x) => x.key === 'sid-void')).toBe(true);
  });
  it('round 126 tools: the paid “Me” row stands for one reader payoff only; a hand-typed sale day says the bid is still to pay', async () => {
    const { suggestedDates, handledCopy } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v126a', name: '26 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    const me = set(paid, /^SID certificate payoff/, { when: '2026-11-19', who: 'Me', resolved: true });
    const two = { ...EMPTY_PACKET, dates: [...me, { when: '2026-11-25', what: 'SID payoff', who: 'City of Las Vegas', own: true }, { when: '2026-11-26', what: 'SID payoff', who: 'City of Henderson', own: true }] };
    expect(handledCopy(two, two.dates[two.dates.length - 1])).toBe(false);
    expect(handledCopy(two, two.dates[two.dates.length - 2])).toBe(false);
    savePacket(`analyzed:${cl.id}`, two);
    expect(dealNextTask(cl, two, new Date('2026-11-24T20:00:00Z'), 'contract').label).toMatch(/SID payoff/);
    const late = { ...EMPTY_PACKET, dates: [...me, { when: '2026-12-05', what: 'SID payoff', who: 'City of Las Vegas', own: true }] };
    expect(handledCopy(late, late.dates[late.dates.length - 1])).toBe(false);
    // TOOLS-2
    const tr: Deal = { ...deal, id: 'v126b', name: '27 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...base(tr), { when: '2026-11-19', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    const t = dealNextTask(tr, pt, new Date('2026-11-19T20:00:00Z'), 'contract');
    if (/your own reminder/.test(t.label)) expect(t.label).toMatch(/winning bid isn’t marked paid yet\. Payment is usually due at the sale, as the trustee’s notice says\*/);
    // (A week later, unpaid: what the winner risks.)
    const tl = dealNextTask(tr, pt, new Date('2026-11-26T20:00:00Z'), 'contract');
    if (/your own reminder/.test(tl.label)) expect(tl.label).toMatch(/contact the trustee and an attorney today/);
    // CONTENT-2: an SID lien win with a hand-typed sale day gets its payment sentence too.
    const li: Deal = { ...deal, id: 'v126c', name: '28 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: [...base(li).filter((x) => !/^Sale day/.test(x.what)), { when: '2026-11-18', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${li.id}`, pl);
    const tli = dealNextTask(li, pl, new Date('2026-11-19T15:00:00Z'), 'contract');
    if (/your own reminder/.test(tli.label)) expect(tli.label).toMatch(/10:00 a\.m\. Nevada time/);
    // (round 126 clarity: Washoe's payment day says today, and was due after 10 a.m.; Clark gets its own rule.)
    expect(tli.label).toMatch(/Payment is due before 10:00 a\.m\. Nevada time today/);
    expect(dealNextTask(li, pl, new Date('2026-11-19T20:00:00Z'), 'contract').label).toMatch(/Payment was due before 10:00 a\.m\. Nevada time today/);
    const lc: Deal = { ...li, id: 'v126d', county: 'Clark' };
    saveDeals([lc]);
    savePacket(`analyzed:${lc.id}`, pl);
    const plc = { ...pl, dates: pl.dates.map((x) => ('own' in x && x.own ? { ...x, when: '2026-11-19' } : x)) };
    savePacket(`analyzed:${lc.id}`, plc);
    const tc = dealNextTask(lc, plc, new Date('2026-11-21T20:00:00Z'), 'contract');
    expect(tc.label).toMatch(/on Nov 23, 2026, the next day the Treasurer’s office is open/);
    expect(tc.label).not.toMatch(/contact/);
    expect(dealNextTask(lc, plc, new Date('2026-11-23T19:00:00Z'), 'contract').label).toMatch(/was due before 10:00 a\.m\. Nevada time today/);
  });
  it('round 126 verifier: a plan and its receipt to one payee are one payoff next to the paid “Me” row; two payees in one name are not', async () => {
    const { suggestedDates, handledCopy } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v126e', name: '29 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    const me = set(set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true }), /^SID certificate payoff/, { when: '2026-11-19', who: 'Me', resolved: true });
    const p = { ...EMPTY_PACKET, dates: [...me, { when: '2026-11-25', what: 'SID payoff to City of Henderson', who: '', own: true }, { when: '2026-11-19', what: 'SID payment to the city of henderson', who: '', own: true, resolved: true }] };
    expect(handledCopy(p, p.dates[p.dates.length - 2])).toBe(true);
    const two = { ...EMPTY_PACKET, dates: [...me, { when: '2026-11-25', what: 'SID payoff', who: 'City of Henderson and City of Las Vegas', own: true }] };
    expect(handledCopy(two, two.dates[two.dates.length - 1])).toBe(false);
  });
  it('round 127 tools: a plan and its ticked receipt are one payoff; a hand-typed sale day reads a dated payment deadline', async () => {
    const { suggestedDates, handledCopy } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const set = (rows: { when: string; what: string; who: string; resolved?: boolean; own?: boolean }[], name: RegExp, v: Partial<{ when: string; who: string; resolved: boolean }>) => rows.map((x) => (name.test(x.what) && !x.own ? { ...x, ...v } : x));
    const cl: Deal = { ...deal, id: 'v127a', name: '30 Vegas', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([cl]);
    const paid = set(set(base(cl), /^Sale day/, { when: '2026-11-12', resolved: true }), /^Payment deadline/, { when: '2026-11-12', resolved: true });
    const p = { ...EMPTY_PACKET, dates: [...set(paid, /^SID certificate payoff/, { when: '2026-11-25', who: 'City of Las Vegas' }), { when: '2026-11-28', what: 'SID payoff', who: 'City of Henderson', own: true }, { when: '2026-11-20', what: 'SID payment', who: 'City of Henderson', own: true, resolved: true }] };
    expect(handledCopy(p, p.dates[p.dates.length - 2])).toBe(true);
    savePacket(`analyzed:${cl.id}`, p);
    expect(dealNextTask(cl, p, new Date('2026-12-04T20:00:00Z'), 'contract').label).not.toMatch(/Henderson.*void|void.*Henderson/);
    // TOOLS-2: trustee, hand-typed sale day Nov 19, the sale's payment row Nov 24.
    const tr: Deal = { ...deal, id: 'v127b', name: '31 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...set(base(tr), /^Payment deadline/, { when: '2026-11-24' }), { when: '2026-11-19', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    const t = dealNextTask(tr, pt, new Date('2026-11-20T20:00:00Z'), 'contract');
    expect(t.label).not.toMatch(/held liable/);
    if (/your own reminder/.test(t.label)) expect(t.label).toMatch(/Payment deadline row in Key dates says Nov 24, 2026/);
  });
  it('round 127 content: a dated lien payment row keeps the 10 a.m. cutoff; sheriff and HOA late lines', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v127c', name: '32 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const p = { ...EMPTY_PACKET, dates: [...base(li).filter((x) => !/^Sale day/.test(x.what)).map((x) => (/^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-23' } : x)), { when: '2026-11-22', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${li.id}`, p);
    const am = dealNextTask(li, p, new Date('2026-11-23T16:00:00Z'), 'contract').label;
    if (/your own reminder/.test(am)) { expect(am).toMatch(/before 10:00 a\.m\. Nevada time that day/); expect(am).toMatch(/certificate isn’t marked paid yet/); }
    const pm = dealNextTask(li, p, new Date('2026-11-23T21:00:00Z'), 'contract').label;
    if (/your own reminder/.test(pm)) expect(pm).toMatch(/That deadline passed/);
    const co: Deal = { ...deal, id: 'v127d', name: '33 Oak', state: 'NV', county: 'Clark', kind: 'court', plan: 'flip', stage: 'contract' };
    saveDeals([co]);
    const pc = { ...EMPTY_PACKET, dates: [...base(co), { when: '2026-11-12', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${co.id}`, pc);
    const tc = dealNextTask(co, pc, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    expect(tc).not.toMatch(/NRS 21\.150/);
    if (/your own reminder/.test(tc)) expect(tc).toMatch(/and an attorney today; a winner who doesn’t pay can be held liable for the loss \(NRS 21\.160\)/);
  });
  it('round 127 clarity: a reader’s own payment row is named and used; everyday payment and SID names', async () => {
    const { suggestedDates, sidPayee, sidNamed } = await import('./dealPacket');
    const { eventFor } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tr: Deal = { ...deal, id: 'v127e', name: '34 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    for (const n of ['Pay balance', 'Balance due', 'Pay the trustee']) expect(eventFor(tr, n)).toMatch(/^Payment deadline/);
    expect(sidNamed('Pay SID to City of Henderson')).toBe(true);
    expect(sidPayee({ when: '', what: 'Pay SID to City of Henderson', who: '', own: true })).toBe('City of Henderson');
    const p = { ...EMPTY_PACKET, dates: [...base(tr), { when: '2026-11-17', what: 'Sale', who: 'Me', own: true }, { when: '2026-11-24', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    const t = dealNextTask(tr, p, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    // (Round 128: the reader's own date counts only if the trustee gave it in writing, so the late warning stays.)
    expect(t).toMatch(/count on it only if the trustee gave you that date in writing\*\. If not: /);
    // (After Make on the sale day, the payment step names the reader's own payment row and offers no one-click pass yet.)
    const p2 = { ...p, dates: p.dates.map((x) => (x.what === 'Sale' ? { when: '2026-11-17', what: 'Sale day', who: 'Me' } : /^Sale day/.test(x.what) && !('own' in x) ? { ...x, when: '2026-11-17' } : x)).filter((x, i, a) => a.findIndex((y) => y.what === x.what && y.when === x.when) === i) };
    savePacket(`analyzed:${tr.id}`, p2);
    const t2 = dealNextTask(tr, p2, new Date('2026-11-19T20:00:00Z'), 'contract');
    if (/Payment due/.test(t2.label)) expect(t2.advance2).toBeUndefined();
  });
  it('round 127 verifier: a lien keeps the statutory payment day; the payment step leads with a later written date; no HOA/Treasurer payment aliases; a receipt isn’t its own copy', async () => {
    const { suggestedDates, handledCopy } = await import('./dealPacket');
    const { eventFor } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v127v1', name: '40 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    expect(eventFor(li, 'Pay the Treasurer')).not.toMatch(/^Payment deadline/);
    expect(eventFor(li, 'Pay the HOA')).not.toMatch(/^Payment deadline/);
    const pl = { ...EMPTY_PACKET, dates: [...base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-18' } : x)), { when: '2026-11-30', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${li.id}`, pl);
    const tl = dealNextTask(li, pl, new Date('2026-11-19T16:00:00Z'), 'contract').label;
    expect(tl).not.toMatch(/your own reminder/);
    const tr: Deal = { ...deal, id: 'v127v2', name: '41 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...base(tr).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-18' } : x)), { when: '2026-11-25', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    const tt = dealNextTask(tr, pt, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    expect(tt).toMatch(/^If the trustee gave you a later payment date in writing\*, your own reminder “Payment due” \(Nov 25, 2026\)/); expect(tt).not.toMatch(/You typed a payment date/);
    expect(tl).toMatch(/before 10 a\.m\. Nevada time today/);
    const rc = { when: '2026-11-20', what: 'SID payoff to City of Henderson', who: 'City of Henderson', own: true, resolved: true };
    const pr = { ...EMPTY_PACKET, dates: [{ when: '2026-11-10', what: 'Sale day', who: 'T', resolved: true }, rc] };
    if (typeof handledCopy === 'function') expect(handledCopy(pr, rc)).toBe(false);
  });
  it('round 128 tools: an SID lien keeps the law’s payment day over a later typed one; a reader’s own payment date is conditional; later payment reminders stay after paying', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const { nvLienDueLikelyPassed, lienPayLater, siteSidFirst } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v128a', name: '50 Oak', state: 'NV', county: 'Clark', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-18' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
    savePacket(`analyzed:${li.id}`, pl);
    const at = new Date('2026-11-20T19:00:00Z');
    expect(lienPayLater(li, pl, pl.dates.find((x) => /^Payment deadline/.test(x.what))!)).toBe(true);
    expect(nvLienDueLikelyPassed(li, at)).toBe('2026-11-19');
    const tl = dealNextTask(li, pl, at, 'contract').label;
    expect(tl).toMatch(/^Did you pay for 50 Oak\?/);
    expect(tl).toMatch(/Your Payment deadline row says Nov 25, 2026: if the notice of sale, or the treasurer that held the sale in writing, set that later time\*, pay by then and mark it handled\. If you paid, mark it handled\. If you didn’t pay by your deadline, the certificate isn’t yours/);
    expect(tl).not.toMatch(/In 5 days/);
    const { packetSections } = await import('./dealPacket');
    const dl = packetSections(li, pl, at).find((x) => x.key === 'dates')!.lines;
    expect(dl).toContain('Next: the payment, until you mark it paid (see Your next action).');
    expect(dl.join('\n')).toMatch(/Nov 25, 2026: Payment deadline[^\n]* — after the law’s payment day \(before 10:00 a\.m\. Nevada time on Nov 19, 2026, NRS 271\.560\)/);
    // (Round 128 content: an IRS payment date more than 1 month after the sale isn't called when it's due.)
    const { irsPastMonth } = await import('./dealStage');
    expect(irsPastMonth({ kind: 'irs' }, '2026-11-17', '2026-12-17')).toBe(false);
    expect(irsPastMonth({ kind: 'irs' }, '2026-11-17', '2026-12-18')).toBe(true);
    const ir: Deal = { ...deal, id: 'v128d', name: '53 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const pi = { ...EMPTY_PACKET, dates: [...base(ir).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-17' } : x)), { when: '2027-01-05', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${ir.id}`, pi);
    const ti = dealNextTask(ir, pi, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    expect(ti).not.toMatch(/is when it’s due/);
    expect(ti).toMatch(/more than 1 month after the sale\. An IRS sale can defer part of the price for no more than 1 month after the sale \(26 U\.S\.C\. 6335\(e\)\)/);
    const tr: Deal = { ...deal, id: 'v128b', name: '51 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...base(tr), { when: '2026-11-17', what: 'Sale', who: 'Me', own: true }, { when: '2026-11-24', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    const tt = dealNextTask(tr, pt, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    expect(tt).toMatch(/Your own reminder “Payment due” says Nov 24, 2026: count on it only if the trustee gave you that date in writing\*\. If not: Payment is usually due at the sale/);
    expect(tt).toMatch(/The sale was on Nov 17, 2026: if you haven’t paid, contact the trustee and an attorney today/);
    const ow: Deal = { ...deal, id: 'v128c', name: '52 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    const po = { ...EMPTY_PACKET, dates: [{ when: '2026-11-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-22', what: 'Balance due', who: 'Contractor', own: true }, { when: '2026-10-30', what: 'Payment due', who: 'Me', own: true }] };
    const kept = siteSidFirst(po, ow, po, '2026-11-26', 'owned').dates.map((x) => x.what);
    expect(kept).toContain('Balance due');
    expect(kept).not.toContain('Payment due');
    const kc = siteSidFirst(po, ow, po, '2026-11-26', 'contract').dates.map((x) => x.what);
    expect(kc).toContain('Balance due');
  });
  it('round 128 clarity: a paid win’s payment reminder has no Move pointer; reminders stay after buying with no Sale day; an IRS sale row past 1 month is cautioned', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const { siteSidFirst, irsPayLater, irsMonthEnd } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tr: Deal = { ...deal, id: 'v128e', name: '54 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...base(tr).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-17' } : /^Payment deadline/.test(x.what) ? { ...x, resolved: true, who: 'Me' } : x)), { when: '2026-11-24', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    for (const day of ['2026-11-19T20:00:00Z', '2026-11-25T20:00:00Z', '2026-12-02T20:00:00Z']) expect(dealNextTask(tr, pt, new Date(day), 'contract').label).not.toMatch(/Move this date|Make this the sale/);
    const ow: Deal = { ...deal, id: 'v128f', name: '55 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    const po = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Deed recorded', who: 'Recorder', resolved: true }, { when: '2026-11-15', what: 'Balance due', who: 'Contractor', own: true }] };
    expect(siteSidFirst(po, ow, po, '2026-11-19', 'owned').dates.map((x) => x.what)).toContain('Balance due');
    const ir: Deal = { ...deal, id: 'v128g', name: '56 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const pi = { ...EMPTY_PACKET, dates: base(ir).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-12' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-12-20' } : x)) };
    savePacket(`analyzed:${ir.id}`, pi);
    expect(irsMonthEnd(pi)).toBe('2026-12-12');
    expect(irsPayLater(ir, pi, pi.dates.find((x) => /^Payment deadline/.test(x.what))!)).toBe(true);
    const a = dealNextTask(ir, pi, new Date('2026-11-19T20:00:00Z'), 'contract').label;
    expect(a).toMatch(/^Pay for 56 Oak by the date in the IRS notice of sale, and no later than Dec 12, 2026, 1 month after the sale: an IRS sale can defer part of the price for no more than 1 month \(26 U\.S\.C\. 6335\(e\)\), and its Payment deadline row says Dec 20, 2026, later than that/);
    expect(a).not.toMatch(/unless|in writing/);
    const b = dealNextTask(ir, pi, new Date('2026-12-14T20:00:00Z'), 'contract').label;
    expect(b).toMatch(/^Did you pay for 56 Oak\? An IRS sale can defer part of the price for no more than 1 month after the sale \(26 U\.S\.C\. 6335\(e\)\): that was Dec 12, 2026, before its Payment deadline row’s date \(Dec 20, 2026\)\. If you haven’t paid, contact the IRS sale officer named in the notice today/);
    expect(b).not.toMatch(/in \d+ days/);
    const lines = packetSections(ir, pi, new Date('2026-11-19T20:00:00Z')).find((x) => x.key === 'dates')!.lines;
    expect(lines.join('\n')).toMatch(/Dec 20, 2026: Payment deadline[^\n]* — more than 1 month after the sale/);
    expect(lines).toContain('Next: the payment, until you mark it paid (see Your next action).');
  });
  it('round 128 verifier: the IRS 1-month day at month end; a paid win’s contractor reminder stays on its due day with no Sale day', async () => {
    const { irsPastMonth, irsMonthEnd, siteSidFirst } = await import('./dealStage');
    expect(irsMonthEnd({ ...EMPTY_PACKET, dates: [{ when: '2027-01-31', what: 'Sale day', who: '' }] })).toBe('2027-02-28');
    expect(irsMonthEnd({ ...EMPTY_PACKET, dates: [{ when: '2026-12-15', what: 'Sale day', who: '' }] })).toBe('2027-01-15');
    expect(irsPastMonth({ kind: 'irs' }, '2026-10-31', '2026-12-01')).toBe(true);
    expect(irsPastMonth({ kind: 'irs' }, '2026-10-31', '2026-11-30')).toBe(false);
    const tr: Deal = { ...deal, id: 'v128h', name: '57 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    const pp = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-19', what: 'Balance due', who: 'Contractor', own: true }] };
    expect(siteSidFirst(pp, tr, pp, '2026-11-19', 'contract').dates.map((x) => x.what)).toContain('Balance due');
    expect(siteSidFirst(pp, tr, pp, '2026-11-25', 'contract').dates.map((x) => x.what)).toContain('Balance due');
  });
  it('round 129 clarity: “I paid” also ticks the reader’s own payment reminders; an IRS payment marked paid after the 1-month day is flagged; the own IRS reminder names the day', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const { ownPayRows, irsPaidLate } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tr: Deal = { ...deal, id: 'v129a', name: '60 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const pt = { ...EMPTY_PACKET, dates: [...base(tr).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-17' } : x)), { when: '2026-11-24', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${tr.id}`, pt);
    expect(ownPayRows(tr, pt)).toEqual([{ what: 'Payment due', when: '2026-11-24' }]);
    const t = dealNextTask(tr, pt, new Date('2026-11-19T20:00:00Z'), 'contract');
    // (Round 130: “I paid” leaves the reader’s own reminders alone; their row note asks.)
    expect(t.tick?.alsoOwn).toBeUndefined();
    const ir: Deal = { ...deal, id: 'v129b', name: '61 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const pi = { ...EMPTY_PACKET, dates: [{ when: '2026-11-12', what: 'Sale day', who: 'IRS' }, { when: '2026-12-14', what: 'Payment deadline', who: 'Me', resolved: true }] };
    savePacket(`analyzed:${ir.id}`, pi);
    expect(irsPaidLate(ir, pi, pi.dates[1])).toBe(true);
    expect(irsPaidLate(ir, pi, { ...pi.dates[1], when: '2026-12-12' })).toBe(false);
    expect(packetSections(ir, pi, new Date('2026-12-15T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n')).toMatch(/Dec 14, 2026: Payment deadline[^\n]* — this date is after the 1-month limit \(Dec 12, 2026, 26 U\.S\.C\. 6335\(e\)\): if you paid after that day, ask the IRS sale officer in writing whether the sale stands\*/);
    const po = { ...EMPTY_PACKET, dates: [...base(ir).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-12' } : x)), { when: '2027-01-05', what: 'Payment due', who: 'Me', own: true }] };
    savePacket(`analyzed:${ir.id}`, po);
    expect(dealNextTask(ir, po, new Date('2026-11-19T20:00:00Z'), 'contract').label).toMatch(/no more than 1 month after the sale \(26 U\.S\.C\. 6335\(e\)\), that’s Dec 12, 2026, so check/);
  });
  it('round 129 verifier: split payment rows don’t tick the balance reminder; after the IRS 1-month day the answer records that day', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const { ownPayRows } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tr: Deal = { ...deal, id: 'v129c', name: '62 Oak', state: 'NV', county: 'Clark', kind: 'hoa', plan: 'flip', stage: 'contract' };
    const ps = { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: 'Sale day', who: 'T' }, { when: '2026-11-17', what: 'Payment deadline (deposit)', who: 'Me' }, { when: '2026-11-24', what: 'Payment deadline (balance)', who: 'Me' }, { when: '2026-11-24', what: 'Balance due', who: 'Me', own: true }] };
    expect(ownPayRows(tr, ps)).toEqual([]);
    const ir: Deal = { ...deal, id: 'v129d', name: '63 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const pi = { ...EMPTY_PACKET, dates: base(ir).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-12' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-12-20' } : x)) };
    savePacket(`analyzed:${ir.id}`, pi);
    const t = dealNextTask(ir, pi, new Date('2026-12-14T20:00:00Z'), 'contract');
    expect(t.tick?.label).toBe('I paid by Dec 12, 2026: mark it handled');
    expect(t.tick?.setWhen).toBe('2026-12-12');
    expect(t.label).toMatch(/if you paid later, mark it, then change the row’s date to the day you paid/);
    const t0 = dealNextTask(ir, pi, new Date('2026-11-19T20:00:00Z'), 'contract');
    // (Round 130 clarity: the payment row keeps its date; a tick means paid by that deadline.)
    expect(t0.tick?.setWhen).toBeUndefined();
  });
  it('round 130 tools: a paid win’s own payment reminder stays in Key dates but doesn’t lead; a paid deadline still ahead reads as met', async () => {
    const { packetSections } = await import('./dealPacket');
    const tr: Deal = { ...deal, id: 'v130a', name: '64 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'contract' };
    saveDeals([tr]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-17', what: 'Sale day', who: 'T' }, { when: '2026-11-24', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-25', what: 'Payment due', who: 'Roofer', own: true }] };
    savePacket(`analyzed:${tr.id}`, p);
    for (const day of ['2026-11-19T20:00:00Z', '2026-11-27T20:00:00Z']) expect(dealNextTask(tr, p, new Date(day), 'contract').label).not.toMatch(/Payment due/);
    const lines = packetSections(tr, p, new Date('2026-11-19T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n');
    expect(lines).toMatch(/Nov 24, 2026: Payment deadline \(Me\) — marked paid \(before this deadline\)/);
    expect(lines).toMatch(/Nov 25, 2026: Payment due \(Roofer\)/);
  });
  it('round 130 clarity: a payment deadline keeps its tick and date; after buying, a payment-named contractor bill leads', async () => {
    const ow: Deal = { ...deal, id: 'v130b', name: '65 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'owned' };
    saveDeals([ow]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-01', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-01', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-05', what: 'Deed recorded', who: 'Recorder', resolved: true }, { when: '2026-12-05', what: 'Payment due', who: 'Roofer', own: true }] };
    savePacket(`analyzed:${ow.id}`, p);
    const { packetSections } = await import('./dealPacket');
    const p2 = { ...p, dates: [...p.dates, { when: '2026-12-05', what: 'Challenge window ends', who: 'Me', resolved: true }] };
    savePacket(`analyzed:${ow.id}`, p2);
    expect(dealNextTask(ow, p2, new Date('2026-12-08T20:00:00Z'), 'owned').label).toMatch(/Payment due/);
    expect(packetSections(ow, p2, new Date('2026-12-08T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n')).toMatch(/Next: Payment due/);
  });
  it('round 131 tools: a payment deadline ticked before the win is cleared when the deal is won', async () => {
    const { setDealStage, paidIn } = await import('./dealStage');
    const { loadPacket } = await import('./dealPacket');
    const tr: Deal = { ...deal, id: 'v131a', name: '66 Oak', state: 'NV', county: 'Clark', kind: 'trustee', plan: 'flip', stage: 'researching' };
    saveDeals([tr]);
    savePacket(`analyzed:${tr.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-11-25', what: 'Sale day', who: 'T' }, { when: '', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-26', what: 'Payment due', who: 'Me', own: true, resolved: true }] });
    setDealStage(tr.id, 'contract');
    const pk = loadPacket(`analyzed:${tr.id}`);
    expect(paidIn(pk, tr)).toBe(false);
    expect(pk.dates.find((x) => x.what === 'Payment due')!.resolved).toBe(true);
  });
  it('round 131 content: an SID lien pick clears a tick made before it; a Washoe payment day on a holiday gets a caution', async () => {
    const { setDealStage, paidIn } = await import('./dealStage');
    const { loadPacket, suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v131b', name: '67 Oak', state: 'NV', county: 'Clark', kind: 'lien', plan: 'flip', stage: 'researching' };
    saveDeals([li]);
    savePacket(`analyzed:${li.id}`, { ...EMPTY_PACKET, dates: [{ when: '2026-11-25', what: 'Sale day', who: 'T' }, { when: '', what: 'Payment deadline', who: 'Me', resolved: true }] });
    setDealStage(li.id, 'contract');
    expect(paidIn(loadPacket(`analyzed:${li.id}`), li)).toBe(false);
    for (const kind of ['taxSale', 'lien'] as const) {
      const w: Deal = { ...deal, id: `v131${kind}`, name: '68 Oak', state: 'NV', county: 'Washoe', kind, plan: 'flip', stage: 'contract' };
      saveDeals([w]);
      const pw = { ...EMPTY_PACKET, dates: base(w).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
      savePacket(`analyzed:${w.id}`, pw);
      expect(dealNextTask(w, pw, new Date('2026-11-26T15:00:00Z'), 'contract').label).toMatch(/Nov 26, 2026 is a Nevada legal holiday \(NRS 236\.015\), when the Treasurer’s office is likely closed\*: ask the Washoe County Treasurer in writing when payment is due/);
    }
  });
  it('round 131 clarity: a Washoe lien’s date from the Treasurer after a holiday counts; no tick carried onto the payment row', async () => {
    const { lienPayLater } = await import('./dealStage');
    const { suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const w: Deal = { ...deal, id: 'v131c', name: '69 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([w]);
    const pw = { ...EMPTY_PACKET, dates: base(w).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-30', who: 'Treasurer' } : x)) };
    savePacket(`analyzed:${w.id}`, pw);
    expect(lienPayLater(w, pw, pw.dates.find((x) => /^Payment deadline/.test(x.what))!)).toBe(false);
    const t = dealNextTask(w, pw, new Date('2026-11-26T15:00:00Z'), 'contract').label;
    expect(t).not.toMatch(/likely closed|before 10 a\.m\. Nevada time today/);
    const late = { ...pw, dates: pw.dates.map((x) => (/^Payment deadline/.test(x.what) ? { ...x, when: '2026-12-01' } : x)) };
    expect(lienPayLater(w, late, late.dates.find((x) => /^Payment deadline/.test(x.what))!)).toBe(true);
  });
  it('round 131 verifier: a Washoe holiday payment day isn’t called late until the next open day', async () => {
    const { nvLienDueLikelyPassed, taxPayState, washoeOpenDay } = await import('./dealStage');
    const { suggestedDates } = await import('./dealPacket');
    expect(washoeOpenDay({ county: 'Washoe' }, '2026-11-26')).toBe('2026-11-30');
    expect(washoeOpenDay({ county: 'Clark' }, '2026-11-26')).toBe('2026-11-26');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v131d', name: '70 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
    savePacket(`analyzed:${li.id}`, pl);
    expect(nvLienDueLikelyPassed(li, new Date('2026-11-26T19:00:00Z'))).toBe('');
    expect(nvLienDueLikelyPassed(li, new Date('2026-11-27T19:00:00Z'))).toBe('');
    expect(nvLienDueLikelyPassed(li, new Date('2026-11-30T19:00:00Z'))).toBe('2026-11-30');
    expect(dealNextTask(li, pl, new Date('2026-11-27T19:00:00Z'), 'contract').label).not.toMatch(/mark the deal passed/);
    const tx: Deal = { ...deal, id: 'v131e', name: '71 Oak', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const pt = { ...EMPTY_PACKET, dates: base(tx).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
    savePacket(`analyzed:${tx.id}`, pt);
    expect(taxPayState(tx, pt, new Date('2026-11-27T19:00:00Z')).state).toBe('due');
    expect(taxPayState(tx, pt, new Date('2026-12-01T19:00:00Z')).state).toBe('late');
  });
  it('round 132 tools: Washoe tax names the next open day; a Washoe lien row typed on the closed day isn’t overdue', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tx: Deal = { ...deal, id: 'v132a', name: '72 Oak', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const pt = { ...EMPTY_PACKET, dates: base(tx).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
    savePacket(`analyzed:${tx.id}`, pt);
    const a = dealNextTask(tx, pt, new Date('2026-11-27T19:00:00Z'), 'contract').label;
    expect(a).not.toMatch(/today, Nov 26/);
    expect(a).toMatch(/Nov 30, 2026/);
    const li: Deal = { ...deal, id: 'v132b', name: '73 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-26' } : x)) };
    savePacket(`analyzed:${li.id}`, pl);
    for (const at of ['2026-11-27T19:00:00Z', '2026-11-30T16:00:00Z']) {
      const t = dealNextTask(li, pl, new Date(at), 'contract');
      expect(t.label).not.toMatch(/^Overdue/);
      expect(JSON.stringify(t)).not.toMatch(/didn’t pay in time/);
    }
  });
  it('round 132 content: Washoe holiday wording names the open day as likely; a lien row on a closed day isn’t a passed deadline', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tx: Deal = { ...deal, id: 'v132c', name: '74 Oak', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const pt = { ...EMPTY_PACKET, dates: base(tx).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : x)) };
    savePacket(`analyzed:${tx.id}`, pt);
    const a = dealNextTask(tx, pt, new Date('2026-11-26T19:00:00Z'), 'contract').label;
    expect(a).toMatch(/5:00 p\.m\. Nevada time on Nov 30, 2026, the first day after the sale the Treasurer’s office is likely open\*/);
    expect(a).not.toMatch(/today, Nov 30/);
    const li: Deal = { ...deal, id: 'v132d', name: '75 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-27' } : x)) };
    savePacket(`analyzed:${li.id}`, pl);
    const lines = packetSections(li, pl, new Date('2026-11-30T16:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n');
    expect(lines).not.toMatch(/deadline has passed|overdue/);
  });
  it('round 132 clarity: a Washoe tax date typed on the closed day or the next open day isn’t passed or “later”', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const { paymentPassed, countyTermsNote } = await import('./dealStage');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tx: Deal = { ...deal, id: 'v132e', name: '76 Oak', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    for (const typed of ['2026-11-26', '2026-11-30']) {
      const p = { ...EMPTY_PACKET, dates: base(tx).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: typed } : x)) };
      savePacket(`analyzed:${tx.id}`, p);
      expect(paymentPassed(tx, new Date('2026-11-27T19:00:00Z'))).toBe('');
      expect(countyTermsNote(tx, p)).toBe('');
    }
  });
  it('round 132 verifier: a Washoe tax deadline typed on a closed day isn’t “passed” in the cash line; the lien download names the open day', async () => {
    const { suggestedDates, packetSections } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const tx: Deal = { ...deal, id: 'v132f', name: '77 Oak', state: 'NV', county: 'Washoe', kind: 'taxSale', plan: 'flip', stage: 'contract', bid: 150000 } as Deal;
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: base(tx).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-11-26' } : x)) };
    savePacket(`analyzed:${tx.id}`, p);
    const all = packetSections(tx, p, new Date('2026-11-27T19:00:00Z')).map((x) => x.lines.join('\n')).join('\n');
    expect(all).not.toMatch(/has passed/);
    const li: Deal = { ...deal, id: 'v132g', name: '78 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const pl = { ...EMPTY_PACKET, dates: base(li).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2026-11-25' } : /^Payment deadline/.test(x.what) ? { ...x, when: '2026-12-02' } : x)) };
    savePacket(`analyzed:${li.id}`, pl);
    expect(packetSections(li, pl, new Date('2026-11-27T19:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n')).toMatch(/so the steps use Nov 30, 2026, the first day after it the Treasurer’s office is likely open\*/);
  });
  it('round 133 tools: an IRS reminder past the 1-month limit reads in the past once it passed, and the pass button stays', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const ir: Deal = { ...deal, id: 'v133a', name: '79 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const p = { ...EMPTY_PACKET, dates: [...base(ir).map((x) => (/^Sale day/.test(x.what) ? { ...x, when: '2027-01-28' } : x)), { when: '2027-03-05', what: 'Balance due', who: 'Me', own: true }] };
    savePacket(`analyzed:${ir.id}`, p);
    const t = dealNextTask(ir, p, new Date('2027-03-15T20:00:00Z'), 'contract');
    expect(t.label).not.toMatch(/so check that date/);
    expect(JSON.stringify(t)).toMatch(/didn’t pay in time/);
  });
  it('round 133 content: a hand-typed Washoe lien sale day before a holiday says the open day is likely', async () => {
    const { suggestedDates } = await import('./dealPacket');
    const base = (k: Deal) => suggestedDates(k).map((what) => ({ when: '', what, who: '' }));
    const li: Deal = { ...deal, id: 'v133b', name: '80 Oak', state: 'NV', county: 'Washoe', kind: 'lien', plan: 'flip', stage: 'contract' };
    saveDeals([li]);
    const p = { ...EMPTY_PACKET, dates: [...base(li).filter((x) => !/^Sale day/.test(x.what)), { when: '2026-11-25', what: 'Sale', who: 'Me', own: true }] };
    savePacket(`analyzed:${li.id}`, p);
    const t = dealNextTask(li, p, new Date('2026-11-30T16:00:00Z'), 'contract').label;
    if (/today/.test(t)) expect(t).toMatch(/likely open\* \(NRS 271\.560 sets the day after the sale/);
    expect(t).not.toMatch(/due before 10:00 a\.m\. Nevada time today \(NRS 271\.560\)/);
  });
  it('round 133 clarity: an IRS row past the 1-month limit is flagged on Analyze (via irsPayLater) and in the step', async () => {
    const { irsPayLater, irsMonthEnd } = await import('./dealStage');
    const ir: Deal = { ...deal, id: 'v133c', name: '81 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Sale day', who: 'IRS' }, { when: '2026-11-10', what: 'Payment deadline', who: 'Me' }] };
    expect(irsMonthEnd(p)).toBe('2026-11-01');
    expect(irsPayLater(ir, p, p.dates[1])).toBe(true);
  });
  it('round 133 verifier: a hand-built IRS packet’s payment row past the 1-month limit is caught from the reader’s own sale row', async () => {
    const { irsMonthEnd, irsPayLater } = await import('./dealStage');
    const ir: Deal = { ...deal, id: 'v133d', name: '82 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Won the auction', who: 'Me', own: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'Me' }] };
    savePacket(`analyzed:${ir.id}`, p);
    expect(irsMonthEnd(p)).toBe('2026-11-01');
    expect(irsPayLater(ir, p, p.dates[1])).toBe(true);
    const t = dealNextTask(ir, p, new Date('2026-11-03T20:00:00Z'), 'contract').label;
    expect(t).not.toMatch(/Its Payment deadline row in Key dates says Nov 10/);
  });
  it('round 134 tools: a hand-built IRS pointer says the 1-month limit passed only after it; an IRS deadline with no Sale day asks for it', async () => {
    const ir: Deal = { ...deal, id: 'v134a', name: '83 Oak', state: 'NV', county: 'Clark', kind: 'irs', plan: 'flip', stage: 'contract' };
    saveDeals([ir]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-10-01', what: 'Won the auction', who: 'Me', own: true }, { when: '2026-11-10', what: 'Payment deadline', who: 'Me' }] };
    savePacket(`analyzed:${ir.id}`, p);
    const a = dealNextTask(ir, p, new Date('2026-10-20T20:00:00Z'), 'contract').label;
    expect(a).not.toMatch(/contact the IRS today/);
    const b = dealNextTask(ir, p, new Date('2026-11-03T20:00:00Z'), 'contract').label;
    if (/1-month/.test(b) && /own reminder|Won the auction/.test(b)) expect(b).toMatch(/The 1-month limit passed \(Nov 1, 2026\)/);
    const q = { ...EMPTY_PACKET, dates: [{ when: '', what: 'Sale day', who: '' }, { when: '2026-11-25', what: 'Payment deadline', who: 'Me' }] };
    savePacket(`analyzed:${ir.id}`, q);
    expect(dealNextTask(ir, q, new Date('2026-11-20T20:00:00Z'), 'contract').label).toMatch(/Enter the Sale day in Key dates too/);
  });
  it('round 134 clarity: a second-payee SID reminder dated after the 20 days is warned about', async () => {
    const { packetSections } = await import('./dealPacket');
    const tx: Deal = { ...deal, id: 'v134b', name: '84 Oak', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-02', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-15', what: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', who: 'City of Las Vegas' }, { when: '2026-11-25', what: 'SID payoff - city of Henderson', who: 'City of Henderson', own: true }] };
    savePacket(`analyzed:${tx.id}`, p);
    const t = dealNextTask(tx, p, new Date('2026-11-10T20:00:00Z'), 'contract').label;
    expect(t).toMatch(/dated after the 20-day deadline \(Nov 22, 2026\): “SID payoff - city of Henderson” \(City of Henderson\), Nov 25, 2026/);
    const p3 = { ...p, dates: [...p.dates, { when: '2026-11-28', what: 'SID payoff - Clark County', who: 'Clark County', own: true }] };
    savePacket(`analyzed:${tx.id}`, p3);
    expect(dealNextTask(tx, p3, new Date('2026-11-10T20:00:00Z'), 'contract').label).toMatch(/These payoffs are dated after the 20-day deadline/);
    expect(packetSections(tx, p, new Date('2026-11-10T20:00:00Z')).find((x) => x.key === 'dates')!.lines.join('\n')).toMatch(/SID payoff - city of Henderson[^\n]* — open, after the 20-day deadline/);
  });
  it('round 135 tools: the late SID answer names its payee and ticks only its own row', async () => {
    const tx: Deal = { ...deal, id: 'v135a', name: '85 Oak', state: 'NV', county: 'Clark', kind: 'taxSale', plan: 'flip', stage: 'contract' };
    saveDeals([tx]);
    const SID = 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)';
    const p = { ...EMPTY_PACKET, dates: [{ when: '2026-11-02', what: 'Sale day', who: 'T', resolved: true }, { when: '2026-11-02', what: 'Payment deadline', who: 'Me', resolved: true }, { when: '2026-11-22', what: SID, who: 'Clark County' }, { when: '2026-11-25', what: SID, who: 'City of Henderson' }] };
    savePacket(`analyzed:${tx.id}`, p);
    const t = dealNextTask(tx, p, new Date('2026-11-23T20:00:00Z'), 'contract');
    if (t.tick && /I paid the SID payoff/.test(t.tick.label)) { expect(t.tick.label).toMatch(/to (Clark County|City of Henderson) by Nov 22, 2026/); expect(t.tick.asIs).toBe(true); expect(t.tick.at).toBeTruthy(); }
  });
});
