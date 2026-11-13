import { workStorage as localStorage } from './workStorage';
// Where a saved deal stands (researching, preparing an offer or bid, under contract or won, closed, owned and
// operating, or passed) and the tasks that belong to that stage. The stage picks the deal's next action in My plan:
// a new candidate gets research and verification tasks, and the accepted-offer deadlines only appear once the seller
// has accepted. Each task says what you'll have when it's done, and links the lessons and practice that help.
//
// Site rules: tasks never involve contacting a homeowner, an occupant or a former owner. Official sellers, your own
// team, public records and the county only.
import { CURRENT_KEY, DEAL_STAGES, isDealStage, loadDeals, saveDeals, type Deal, type DealStage } from './analyze';
import { investorProfile } from './myPlan';
import { cleanBuyBox, EMPTY_BUY_BOX } from './toolkit';
import { bidTyped, CONTRACT_ROWS, calendarReady, calendarRows, dateRowComplete, sale90, capSid, challenge90Ahead, challengeEnded, sidDeadline, flipSaleLine, savePacket, irsWithoutRedemption, RECORDED_ROWS, sameEvent, windowEnded, sameDate, roleTitleFor, loadPacket, calendarComplete, nextDate, savedNumbers, hasSavedNumbers, flipBudget, suggestedDates, type PacketData, onPacketSaved } from './dealPacket';
import { areasFor, loadLog, type EvidenceLog } from './evidence';
import { loadOwned, type Owned } from './owned';
import { proGuideByKey } from './proGuide';
import { dealProgress, focusDealId, progressChanged } from './roadmapState';

export { DEAL_STAGES, isDealStage, type DealStage };

type Way = 'offer' | 'auction' | 'lien';
/** How the property is bought: an offer on a listing, a bid at an auction, or a lien certificate. */
export const wayOf = (d: Pick<Deal, 'kind'>): Way => (d.kind === 'lien' ? 'lien' : d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short' ? 'offer' : 'auction');

/** A certificate of sale first, the deed only after the redemption period, if no one redeems: a Nevada HOA sale (60 days,
 *  NRS 116.31166(3), (7)), a Nevada sheriff's sale (1 year, NRS 21.210, 21.220(4)) and an IRS sale (180 days, 26 U.S.C.
 *  6337(b), 6338). */
export const certificateFirst = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }): boolean => (d.kind === 'irs' && !irsWithoutRedemption({ state: d.state ?? 'NV', kind: d.kind, id: d.id, plan: d.plan })) || (d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court'));
const waitWord = (d: { kind: Deal['kind'] }) => (d.kind === 'hoa' ? '60 days' : d.kind === 'irs' ? '180 days' : '1 year');
/** The packet's date row for the deed after the wait (dateGuide names it the same). */
export const DEED_AFTER_WAIT = 'Deed delivered (if no one redeemed)';
/** A date in the packet with its date entered, passed and marked handled. */
/** A date for a sentence: 2027-01-18 -> "Jan 18, 2027". */
export const prettyDay = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : iso);
const localDay = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const handled = (p: PacketData, what: string, now: Date) => p.dates.some((x) => sameDate(x.what, what) && !!x.resolved && (!x.when || x.when < localDay(now)));
/** A home you'll live in: bought by offer to keep, by a reader buying a home to live in (Decide), unless this property is
 *  marked a rental (or the rent recorded in its tracker covers its costs). The reader can say so for each property. */
export function liveIn(d: { kind: Deal['kind']; plan?: Deal['plan']; id?: string; home?: Deal['home'] }): boolean {
  if (!d.id) return false;
  if (d.plan !== 'rent' || wayOf(d) !== 'offer') return false;
  const home = (d.id ? loadDeals().find((x) => x.id === d.id)?.home : undefined) ?? d.home;
  if (home) return home === 'live';
  // (Rent that covers the costs doesn't change it on its own: the tracker asks whether you still live there.)
  return !!investorProfile().ownerOccupant;
}
/** Decide answered how you'll pay and live (its borrow question): it can say home or rental. */
export const decideAnswered = () => { try { const dc = JSON.parse(localStorage.getItem('deedowl.decide.v1') ?? 'null'); return !!dc?.answers?.borrow; } catch { return false; } };
/** Whether to ask "do you live there?" for this property: a reader buying a home to live in, keeping one bought by offer. */
export const asksHome = (d: { kind: Deal['kind']; plan?: Deal['plan']; id?: string; home?: Deal['home'] }) => {
  if (d.plan !== 'rent' || wayOf(d) !== 'offer') return false;
  if (investorProfile().ownerOccupant) return true;
  // An answer the reader gave, or a home filled in from the plan, keeps the question (an investor's rental filled in as a rental doesn't).
  const st = d.id ? loadDeals().find((x) => x.id === d.id) : undefined;
  const home = st?.home ?? d.home;
  const from = st ? st.homeFrom : (d as { homeFrom?: string }).homeFrom;
  // (Decide skipped and no answer yet: no way to know, so ask, with neither choice picked.)
  if (!home) return !decideAnswered();
  return from !== 'plan' || home === 'live';
};
const HOMES_SETTLED_KEY = 'deedowl.homes-settled.v1';
/** Homes already bought with no answer yet keep the one they have now (so a later Decide change doesn't switch them). */
export function settleHomes() {
  // Once per device: later Decide changes never relabel a bought property.
  if (localStorage.getItem(HOMES_SETTLED_KEY)) return;
  // (Decide skipped: wait until it's answered, then keep what it says.)
  if (!decideAnswered()) return;
  localStorage.setItem(HOMES_SETTLED_KEY, '1');
  const all = loadDeals();
  const fix = all.filter((d) => (d.stage === 'closed' || d.stage === 'owned') && !d.home && d.plan === 'rent' && wayOf(d) === 'offer');
  if (fix.length) saveDeals(all.map((d) => (fix.includes(d) ? { ...d, home: liveIn(d) ? 'live' as const : 'rent' as const, homeFrom: 'plan' as const } : d)));
}
/** The tracker asks "Do you still live there?": rent recorded covers the costs, and this property has no answer yet. */
export const trackerAsksHome = (d: { id: string; kind: Deal['kind']; plan?: Deal['plan']; home?: Deal['home'] }) => {
  const st = loadDeals().find((x) => x.id === d.id);
  if ((st?.home && st.homeFrom !== 'plan') || !asksHome(d)) return false;
  const ms = loadOwned()[d.id]?.months ?? [];
  return ms.some((m) => m.rent > 0) && ms.reduce((t, m) => t + m.rent, 0) >= ms.reduce((t, m) => t + m.costs, 0);
};
/** Mark a property your home or a rental. */
export function setDealHome(id: string, home: 'live' | 'rent') {
  const all = loadDeals();
  if (!all.some((d) => d.id === id)) return;
  saveDeals(all.map((d) => (d.id === id ? { ...d, home, homeFrom: undefined } : d)));
  try {
    const cur = JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null') as Deal | null;
    if (cur && cur.id === id) localStorage.setItem(CURRENT_KEY, JSON.stringify({ ...cur, home, homeFrom: undefined }));
  } catch {
    /* storage unavailable */
  }
  progressChanged();
}

/** Dates that only matter once you've won (they come after the sale): no reminder for them before then. */
const AFTER_SALE = ['SID certificate payoff', 'Certificate of sale recorded', 'Certificate of sale received', 'Redemption period ends', DEED_AFTER_WAIT, 'Deed recorded', 'Deed or certificate recorded', 'Treasurer’s deed recorded', 'Recovery-suit window ends', 'Challenge window ends', 'Rescission window ends', 'Intent-to-bid window ends', 'Eligible bid deadline (45 days)', 'Earliest you may act (unpaid lien)', 'Certificate expires'];
export const afterSale = (what: string) => AFTER_SALE.some((n) => sameDate(what, n));
/** The packet's dates that can be a reminder now: before winning, not the post-sale ones; never a sale day that has
 *  passed; and once the deed is ticked, not the redemption period. */
/** A contract window that ended (a cancel-by date, the seller's disclosure) doesn't lead over an inspection, appraisal
 * or loan deadline in the next 2 days: Your next action and Key dates both use this. */
export function contingencyFirst<T extends { what: string; when: string; days: number }>(nd: T | null, p: PacketData, now: Date, stage: string, kind?: string): T | (PacketData['dates'][number] & { days: number }) | null {
  if (!nd || nd.days >= 0 || stage !== 'contract' || !windowEnded(nd.what, -nd.days, kind)?.ask) return nd;
  const soon = p.dates.filter((x) => !x.resolved && x.when && x.when >= localDay(now) && ['Inspection period ends', 'Option period ends', 'Appraisal deadline', 'Loan approval deadline'].some((n) => sameEvent(x.what, n))).sort((x, y) => x.when.localeCompare(y.when))[0];
  const days = soon ? Math.round((new Date(`${soon.when}T12:00:00`).getTime() - new Date(`${localDay(now)}T12:00:00`).getTime()) / 864e5) : 99;
  return soon && days <= 2 ? { ...soon, days } : nd;
}
/** At a certificate-first win, the redemption end and the deed are ahead: not reminders yet (and not behind you). */
export const notYet = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }, stage: string, p?: PacketData, now: Date = new Date()) => (stage === 'contract' && wayOf(d) !== 'offer' && certificateFirst(d) ? [DEED_AFTER_WAIT, 'Redemption period ends'].filter((n) => !(p?.dates.some((x) => sameDate(x.what, n) && x.when && x.when < localDay(now)))) : []);
/** A deed date typed before the redemption ends (the end typed or worked out, still ahead): that end, else ''. */
export const earlyDeedEnd = (d: Pick<Deal, 'kind' | 'state'> & { id?: string; plan?: Deal['plan'] }, p: PacketData, now: Date, deedOn = p.dates.find((x) => sameDate(x.what, DEED_AFTER_WAIT) && x.when && !x.resolved)?.when ?? '') => { if (!certificateFirst(d) || ticked(p, 'Redemption period ends') || !deedOn) return ''; const e = p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when || redemptionEnd(d, p); return e && e >= localDay(now) && deedOn < e ? e : ''; };
/** An offer's earnest money marked sent on the roadmap counts as its date row handled (one answer, not two). */
const STEP_ROWS: Record<string, string[]> = { deposit: ['Earnest money due'], inspect: ['Inspection period ends', 'Option period ends'], 'loan-approval': ['Loan approval deadline'], appraise: ['Appraisal deadline'] };
let settling = false;
/** Every roadmap step marked done (or, but for the deposit, "doesn't apply") for this offer ticks one date row of its
 * kind, once: when it's marked, or when that row is added or dated later. The row carries the step's name, so the
 * answer travels with the packet (backups too), survives a rename, and a row you untick stays unticked. */
export function settleAllSteps(dealKey: string) {
  if (settling || !dealKey.startsWith('analyzed:')) return;
  settling = true;
  try {
    // (An earlier build kept which row each step ticked in its own store: move that onto the rows, once.)
    try {
      const old = JSON.parse(localStorage.getItem('deedowl.stepRows.v1') ?? 'null') as Record<string, Record<string, string>> | null;
      const mine = old && typeof old === 'object' ? old[dealKey] : undefined;
      if (mine && typeof mine === 'object') {
        let pk = loadPacket(dealKey);
        for (const [id, what] of Object.entries(mine)) {
          if (!STEP_ROWS[id] || pk.dates.some((x) => x.step === id || x.step === `~${id}`)) continue;
          const exact = what === '(already handled)' ? pk.dates.findIndex((x) => x.resolved && STEP_ROWS[id].some((n) => sameEvent(x.what, n))) : pk.dates.findIndex((x) => x.what === what);
          // (Renamed, or ticked by hand first: mark the first row of its kind as settled, leaving its tick as it is.)
          const k = exact >= 0 ? exact : pk.dates.findIndex((x) => STEP_ROWS[id].some((n) => sameEvent(x.what, n)));
          // (The step's own tick: the step can undo it. A row you unticked, or ticked yourself: yours.)
          if (k >= 0) pk = { ...pk, dates: pk.dates.map((x, i) => (i === k ? { ...x, step: what !== '(already handled)' && (exact >= 0 || x.resolved) ? id : `~${id}` } : x)) };
        }
        savePacket(dealKey, pk);
        const { [dealKey]: _done, ...rest } = old!;
        if (Object.keys(rest).length) localStorage.setItem('deedowl.stepRows.v1', JSON.stringify(rest)); else localStorage.removeItem('deedowl.stepRows.v1');
      }
    } catch { /* an unreadable old record: nothing to move */ }
    const prog = dealProgress(dealKey);
    for (const id of Object.keys(STEP_ROWS).filter((k) => prog.done.includes(k) || (k !== 'deposit' && prog.status[k] === 'na'))) {
      const p = loadPacket(dealKey);
      if (p.dates.some((x) => x.step === id || x.step === `~${id}`)) continue;
      const own = p.dates.findIndex((x) => x.resolved && STEP_ROWS[id].some((n) => sameEvent(x.what, n)));
      if (own >= 0) { savePacket(dealKey, { ...p, dates: p.dates.map((x, k) => (k === own ? { ...x, step: `~${id}` } : x)) }); continue; }
      settleStepRow(dealKey, id);
    }
  } finally {
    settling = false;
  }
}
/** A roadmap step set back (to do, or a deposit that doesn't apply): untick the row it ticked; let it settle again later. */
export function unsettleStep(dealKey: string, stepId: string) {
  const p = loadPacket(dealKey);
  if (!p.dates.some((x) => x.step === stepId || x.step === `~${stepId}`)) return;
  settling = true;
  try {
    savePacket(dealKey, { ...p, dates: p.dates.map((x) => (x.step === stepId ? (({ step: _s, ...rest }) => ({ ...rest, resolved: false }))(x) : x.step === `~${stepId}` ? (({ step: _s, ...rest }) => rest)(x) : x)) });
  } finally {
    settling = false;
  }
}
onPacketSaved(settleAllSteps);
/** A roadmap step marked done on an offer: tick its one date row in the packet (the row named for it, else the
 * earliest open one of that kind), so the table, Key dates and the reminders all agree. */
export function settleStepRow(dealKey: string, stepId: string): string {
  const names = STEP_ROWS[stepId];
  if (!names || !dealKey.startsWith('analyzed:')) return '';
  const d = loadDeals().find((x) => `analyzed:${x.id}` === dealKey);
  if (!d || wayOf(d) !== 'offer') return '';
  const p = loadPacket(dealKey);
  const open = p.dates.map((x, k) => ({ x, k })).filter(({ x }) => !x.resolved && names.some((n) => sameEvent(x.what, n)));
  const pick = open.find(({ x }) => names.some((n) => x.what.trim() === n)) ?? [...open].sort((a, b) => (a.x.when || '9999').localeCompare(b.x.when || '9999'))[0];
  if (!pick) return '';
  savePacket(dealKey, { ...p, dates: p.dates.map((x, k) => (k === pick.k ? { ...x, resolved: true, step: stepId } : x)) });
  return pick.x.what;
}
/** The first month to record: the purchase month if bought on the 1st (or it's already recorded), else the next one. */
export const firstFullMonth = (o: { boughtOn: string; months: { month: string }[] }): [number, number] => { let [y, m] = o.boughtOn.slice(0, 7).split('-').map(Number); if (Number(o.boughtOn.slice(8, 10)) > 1 && !o.months.some((x) => x.month === o.boughtOn.slice(0, 7))) { m += 1; if (m > 12) { m = 1; y += 1; } } return [y, m]; };
/** What the records came before: the sale (void), being picked (a lien), the win (an auction won or redeemed), else the purchase. */
export const beforeWhat = (d: Deal) => (sidState(d) === 'void' ? 'the sale' : d.kind === 'lien' ? 'you were picked' : wayOf(d) !== 'offer' && (stageOf(d) === 'contract' || redeemedOf(d) || (certificateFirst(d) && !!d.id && (redeemedIn(loadPacket(`analyzed:${d.id}`)) || (['closed', 'owned'].includes(stageOf(d)) && !ticked(loadPacket(`analyzed:${d.id}`), DEED_AFTER_WAIT))))) ? 'you won' : 'you bought');
/** The packet parts that, at this stage, are records from before you bought (the page and the download agree). */
export const recordParts = (d: Deal) => (sidState(d) === 'void' || ['closed', 'owned'].includes(stageOf(d)) || finishedDeal(d) ? ['plan', 'property', 'cash', 'numbers', 'evidence', 'pros', 'decision'] : stageOf(d) === 'contract' && !paidAtWin(d) ? ['plan', 'property', 'numbers', 'pros', 'decision'] : ['plan', 'property', 'cash', 'numbers', 'pros', 'decision']);
/** A passed offer's earnest money, back from escrow. */
export const EARNEST_BACK = 'Earnest money returned';
/** Rows an offer's buyer records from the closing tasks (or the roadmap step does instead). */
export const TITLE_REVIEWED = 'Title commitment reviewed';
export const INSURED_ROW = 'Insurance in place';
export const WALKTHROUGH_ROW = 'Final walkthrough done';
/** A task recorded by its own row: the row decides (unticked, it's open again); without one, the roadmap step does. */
const recordDone = (p: PacketData, row: string, step: boolean) => { const r = p.dates.find((x) => sameDate(x.what, row)); return r ? !!r.resolved : step; };
/** Set while a finished deal looks for the next open one (its tasks never look again). */
let findingNext = false;
/** The open property to go on to after another is finished or passed: one with a date that has passed, then one with
 *  something waiting, else the most recently updated (My plan and the packet both use this). */
export function nextOpenDeal(fromId: string): Deal | undefined {
  const others = loadDeals().filter((x) => x.id !== fromId && !x.practice && stageOf(x) !== 'passed' && !finishedDeal(x) && !soldOf(x)).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  if (!others.length) return undefined;
  const outer = !findingNext;
  findingNext = true;
  try {
    // (Then the one My plan would focus on among them: a property under way before one you're only researching.)
    const focus = focusDealId(others);
    // (The most serious first, the same order My plan's "Another property needs your attention" uses.)
    const pressing = others.filter((x) => needsAnswerNow(dealNextTask(x))).sort((a, b) => pressingWeight(dealNextTask(a)) - pressingWeight(dealNextTask(b)) || (dealNextTask(a).days ?? 99) - (dealNextTask(b).days ?? 99));
    return pressing[0] ?? others.find((x) => dealNextTask(x).urgent) ?? others.find((x) => `analyzed:${x.id}` === focus) ?? others[0];
  } finally { if (outer) findingNext = false; }
}
/** The row a Nevada tax-sale buyer records once the city or county has sent the Treasurer its SID payment affidavit. */
export const SID_AFFIDAVIT_SENT = 'SID payment affidavit sent to the Treasurer';
export const remindable = (p: PacketData, now: Date, early: boolean, behind: string[] = []): PacketData => {
  const deed = ticked(p, DEED_AFTER_WAIT);
  const past = (x: { when: string }) => !!x.when && x.when < localDay(now);
  return { ...p, dates: p.dates.filter((x) => !(early && afterSale(x.what)) && !(EVENTS.some((n) => sameDate(x.what, n)) && (past(x) || !early)) && !(!early && BEFORE_SALE.some((n) => sameDate(x.what, n))) && !((deed || redeemedIn(p)) && sameDate(x.what, 'Redemption period ends')) && !(redeemedIn(p) && [DEED_AFTER_WAIT, REDEEMED_ROW, 'Earliest you may act (unpaid lien)', 'Certificate expires'].some((n) => sameDate(x.what, n))) && !behind.some((n) => sameDate(x.what, n))) };
};
/** The usual dates a stage has put behind you: once it's closed or owned, the ones before closing and the recording rows. */
export const behindStage = (d: Pick<Deal, 'kind' | 'state'> & { plan?: Deal['plan']; id?: string }, stage: DealStage): string[] =>
  (stage === 'researching' || stage === 'offer') && wayOf(d) === 'offer' ? CONTRACT_ROWS.filter((n) => n !== 'Offer accepted' && n !== 'Acceptance') : stage === 'contract' && wayOf(d) !== 'offer' ? ['Bidder registration', 'Registration', 'Sale day', ...(paidAtWin(d) ? ['Payment deadline'] : [])] : stage === 'contract' && d.kind === 'short' && approvedOn(d) && approvedOn(d) <= localDay(new Date()) && d.id && loadPacket(`analyzed:${d.id}`).dates.every((x) => !sameDate(x.what, 'Lienholder approval deadline') || !x.when || approvedOn(d) <= x.when) ? ['Lienholder approval deadline'] : stage === 'closed' || stage === 'owned' ? [...suggestedDates(d).filter((n) => !afterSale(n) || RECORDED_ROWS.some((r) => sameDate(n, r))), ...(stage === 'owned' && certificateFirst(d) && deedInHand(d) ? ['Redemption period ends', DEED_AFTER_WAIT] : [])] : [];
/** Rows that mark an event, not a deadline: once their date has passed, they aren't a reminder. */
const EVENTS = ['Sale day', 'Contract signed', 'Offer accepted (Day 0)', 'Acceptance (Day 0)', 'Approval notice received'];
/** Registration rows: past the bidding (won, closed), they're behind you. */
const BEFORE_SALE = ['Registration', 'Bidder registration', 'Sealed bid and full payment due'];
/** Sale day is marked handled, or its date has passed: time to say whether you won. */
export const saleOver = (p: PacketData, now: Date) => p.dates.some((x) => sameDate(x.what, 'Sale day') && (x.when ? x.when < localDay(now) || (!!x.resolved && x.when <= localDay(now)) : !!x.resolved));
/** A row marked handled, with or without its date (the deed: you have it). */
const ticked = (p: PacketData, what: string) => p.dates.some((x) => sameDate(x.what, what) && !!x.resolved);
/** A Nevada tax sale's answer from the Treasurer that no SID affidavit was filed (NRS 361.595(6)). */
export const NO_SID_ROW = 'Treasurer confirmed no SID affidavit';
/** A redemption: the row for its payoff, added by "It was redeemed". */
export const REDEEMED_ROW = 'Redemption money collected';
export const redeemedIn = (p: PacketData) => p.dates.some((x) => sameDate(x.what, REDEEMED_ROW));
/** Who pays a redemption's money: you, or the sheriff for you (NRS 21.230(1), (3)); an HOA sale's, you (NRS 116.31166(3));
 *  an IRS sale's, you, or the IRS if you can't be found in the county (26 U.S.C. 6337(b)(2)). */
const payoffRow = (d: Pick<Deal, 'kind'>) => ({ when: '', what: REDEEMED_ROW, who: d.kind === 'court' ? 'The person who redeemed, or the sheriff for them' : d.kind === 'irs' ? 'The person who redeemed (the IRS, if you couldn’t be found)' : 'The person who redeemed' });
/** On a task about something else: the redemption is a different event, so the button names it. */
const redeemLabel = (d: Pick<Deal, 'kind' | 'state'> & { id?: string; plan?: Deal['plan'] }, p: PacketData, now: Date = new Date()) => { const e = p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when || redemptionEnd(d, p); return `Someone redeemed it: collect the payoff${e && e >= localDay(now) ? ` (the redemption period runs until ${prettyDay(e)})` : ''}`; };
const redeemButton = (d: Pick<Deal, 'kind'>, label = 'It was redeemed: collect the payoff') => ({ stage: 'closed' as DealStage, label, addRow: payoffRow(d) });
/** A flip's recorded sale (in its packet's owned section). */
export const soldOf = (d: { id?: string }) => (d.id ? loadOwned()[d.id]?.sold : undefined);
/** A deal whose redemption payoff is marked collected in its packet. */
const redeemedOf = (d: { id?: string }) => !!d.id && ticked(loadPacket(`analyzed:${d.id}`), REDEEMED_ROW);
/** A certificate-first deal that was redeemed, with its payoff not yet collected. */
export const redeemingNow = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && (certificateFirst(d) || (wayOf(d) === 'lien' && d.state === 'NV')) && redeemedIn(loadPacket(`analyzed:${d.id}`)) && !redeemedOf(d);
/** "The owner paid": starts a Nevada SID lien's payoff (its stage stays). */
const lienPaidButton = (d: Deal, stage: DealStage) => ({ stage, label: `The owner paid for ${d.name || 'this lien'}: collect it from the Treasurer`, addRow: { when: '', what: REDEEMED_ROW, who: 'The Treasurer who sold the certificate' } });
/** A Nevada SID lien paid off: the Treasurer pays the certificate holder what the owner paid (NRS 271.595(2)). */
const lienPayoff = (d: Deal, p: PacketData) => task({ key: 'payoff', label: `Collect the payoff for ${d.name || 'this lien'} from the Treasurer`, produces: 'the payoff the owner paid, from the Treasurer who sold the certificate (NRS 271.595(2)), with a receipt. Then mark it finished', href: packetHref(d, 'dates'), tick: { label: `I was repaid for ${d.name || 'this lien'}: mark it finished`, row: REDEEMED_ROW, then: 'passed' }, undo: { label: 'Not paid after all? Undo', removeRow: REDEEMED_ROW }, answer: true, support: [L.pro('cpa')], done: ticked(p, REDEEMED_ROW) });
/** Who delivers a certificate-first sale's deed. */
const deedWho = (d: Pick<Deal, 'kind'>) => (d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : d.kind === 'irs' ? 'The IRS' : 'The sheriff');
/** A Nevada HOA, sheriff or IRS sale's redemption end, counted from its sale day (60 days; 1 year; 180 days). */
export const redemptionEndFrom = (d: Pick<Deal, 'kind' | 'state'> & { id?: string; plan?: Deal['plan'] }, p: PacketData) => redemptionEnd(d, p);
const redemptionEnd = (d: Pick<Deal, 'kind' | 'state'> & { id?: string; plan?: Deal['plan'] }, p: PacketData) => {
  // (An IRS sale with "No redemption" picked has none: it isn't certificate-first.)
  if (!certificateFirst(d)) return '';
  const own = p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when;
  if (own) return own;
  const sd = p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when;
  if (!sd || !(d.kind === 'irs' || (d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court')))) return '';
  const t = new Date(`${sd}T12:00:00`);
  if (d.kind === 'court') { const m = t.getMonth(); t.setFullYear(t.getFullYear() + 1); if (t.getMonth() !== m) t.setDate(0); } else t.setDate(t.getDate() + (d.kind === 'hoa' ? 60 : 180));
  return localDay(t);
};
/** A certificate-first deal's redemption end (typed or worked out) when it is already past, else ''. */
const endedOn = (d: Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string }) => { if (!d.id) return ''; const e = redemptionEnd({ ...d, state: d.state ?? 'NV' }, loadPacket(`analyzed:${d.id}`)); return e && e < localDay(new Date()) ? e : ''; };
/** A deal's dated "Challenge window ends" row. */
const windowEndOf = (d: { id?: string }) => (d.id ? loadPacket(`analyzed:${d.id}`).dates.find((x) => sameDate(x.what, 'Challenge window ends') && x.when)?.when ?? '' : '');
/** A Nevada tax sale's answer from the Treasurer that the sale stands, after an SID payoff dated past its 20 days. */
export const SID_STANDS_ROW = 'Treasurer confirmed the sale stands';
/** …or that the sale is void (the payoff wasn't made within 20 days). */
export const SID_VOID_ROW = 'The sale is void';
const VOID_SAID = `${SID_VOID_ROW} (the Treasurer said so)`;
const VOID_UNPAID = `${SID_VOID_ROW} (the SID payoff wasn’t made within 20 days, NRS 361.595(6))`;
/** Whether the reader recorded the void from their own unpaid answer (not the Treasurer's). */
export const voidByLaw = (p: PacketData) => p.dates.some((x) => sameDate(x.what, VOID_UNPAID));
/** The reader entered the price paid at the win in Analyze (and said so). */
export const WON_BID_ROW = 'Winning bid entered in Analyze';
/** The packet as the calendar review sees it: a paid win's undated payment row is behind you. */
/** The rows a stage's calendar check counts (an accepted offer's calendar needs its closing date, even before that row is added). */
export const forCalendar = (d: { id?: string; kind: Deal['kind']; state?: Deal['state']; plan?: Deal['plan'] }, p: PacketData, stage: string): PacketData => (stage === 'contract' && wayOf(d) !== 'offer' && paidAtWin(d) ? { ...p, dates: p.dates.filter((x) => !(sameDate(x.what, 'Payment deadline') && !x.when)) } : stage === 'contract' && wayOf(d) === 'offer' && !p.dates.some((x) => sameEvent(x.what, 'Closing') || /close of escrow|settlement|\bCOE\b/i.test(x.what)) ? { ...p, dates: [...p.dates, { when: '', what: 'Closing', who: '' }] } : p);
/** At a won auction, the payment is made (its evidence ticked, or its row handled). */
/** Eureka County's tax sale is sealed-bid: full payment goes in with the bid (Eureka County Treasurer). */
/** A Nevada legal holiday (NRS 236.015), as observed (a Sunday holiday on Monday, a Saturday one on Friday): county
 * offices are closed. */
export const nvHoliday = (t: Date): boolean => {
  const y = t.getFullYear(); const m = t.getMonth(); const day = t.getDate();
  const nth = (mo: number, wd: number, n: number) => { const f = new Date(y, mo, 1).getDay(); return 1 + ((wd - f + 7) % 7) + (n - 1) * 7; };
  const last = (mo: number, wd: number) => { const lastDay = new Date(y, mo + 1, 0); return lastDay.getDate() - ((lastDay.getDay() - wd + 7) % 7); };
  const fixed = [[y, 0, 1], [y + 1, 0, 1], [y, 5, 19], [y, 6, 4], [y, 10, 11], [y, 11, 25]].some(([yy, mo, dd]) => { const h = new Date(yy, mo, dd); const o = h.getDay() === 0 ? new Date(yy, mo, dd + 1) : h.getDay() === 6 ? new Date(yy, mo, dd - 1) : h; return o.getFullYear() === y && o.getMonth() === m && o.getDate() === day; });
  const thanks = nth(10, 4, 4);
  return fixed || (m === 0 && day === nth(0, 1, 3)) || (m === 1 && day === nth(1, 1, 3)) || (m === 4 && day === last(4, 1)) || (m === 8 && day === nth(8, 1, 1)) || (m === 9 && day === last(9, 5)) || (m === 10 && (day === thanks || day === thanks + 1));
};
/** Eureka's sealed-bid row: the bid and full payment go in together, the day before the sale. */
export const SEALED_ROW = 'Sealed bid and full payment due';
export const sealedBid = (d: { state?: Deal['state']; kind?: Deal['kind']; county?: string }) => d.state === 'NV' && d.kind === 'taxSale' && d.county === 'Eureka';
export const paidAtWin = (d: { id?: string; state?: Deal['state']; kind?: Deal['kind']; county?: string }) => !!d.id && paidIn(loadPacket(`analyzed:${d.id}`), d);
/** Every payment row is handled (a deposit ticked with the balance still open isn't paid). */
export const paidIn = (p: PacketData, d?: { state?: Deal['state']; kind?: Deal['kind']; county?: string }) => {
  // (A sealed-bid sale: the full payment went in with the bid, so the bid sent is the payment made. Only there:
  // a row carried to another county's sale, where payment is due after the win, isn't a payment.)
  const sealed = d && sealedBid(d) ? p.dates.filter((x) => sameDate(x.what, SEALED_ROW)) : [];
  if (sealed.length > 0 && sealed.every((x) => !!x.resolved)) return true;
  const rows = p.dates.filter((x) => sameDate(x.what, 'Payment deadline'));
  return rows.length > 0 && rows.every((x) => !!x.resolved);
};
/** The day a sealed bid was due: the day before the sale, when the sale is dated (else blank, never today). */
export const sealedDay = (p: PacketData) => { const s = p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when; if (!s) return p.dates.find((x) => sameDate(x.what, SEALED_ROW) && x.when)?.when ?? ''; const t = new Date(`${s}T12:00:00`); t.setDate(t.getDate() - 1); /* (The Treasurer’s office is open Monday to Thursday: the last open day before the sale.) */ while ([0, 5, 6].includes(t.getDay()) || nvHoliday(t)) t.setDate(t.getDate() - 1); return t.toLocaleDateString('en-CA'); };
/** A sealed-bid sale with its sale day dated: a sealed-bid row not yet sent gets its usual deadline, the day before
 * the sale, when it's blank, or when the sale date changes (`before` is the packet as it was). A date the reader typed
 * from the notice is kept otherwise; the reminder says when it isn't the usual day before. */
const saleDayIn = (p: PacketData) => p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when ?? '';
export const fillSealedDay = (d: { state?: Deal['state']; kind?: Deal['kind']; county?: string }, p: PacketData, before?: PacketData): PacketData => {
  if (!sealedBid(d) || !saleDayIn(p)) return p;
  // (A blank row gets the usual day before, and the packet notes the sale date it came from (sealedFor). While the row
  // still holds that filled-in date, it follows the sale date, even across a half-typed blank one; a date the reader
  // typed from the notice is kept. The stage hint says when it isn't the usual day before the sale.)
  const sale = saleDayIn(p);
  const due = sealedDay({ ...p, dates: p.dates.filter((x) => !sameDate(x.what, SEALED_ROW)) });
  // (A packet saved before sealedFor existed: the sale date it had just before this change stands in for it.)
  const filledFrom = p.sealedFor ?? (before && saleDayIn(before) && saleDayIn(before) !== sale ? saleDayIn(before) : '');
  const filledDue = filledFrom ? sealedDay({ ...p, dates: [{ when: filledFrom, what: 'Sale day', who: '' }] }) : '';
  // (Before round 45 the filled-in date was the plain day before, even on a day the office is closed: those move too.)
  const rawBefore = (s: string) => { if (!s) return ''; const t = new Date(`${s}T12:00:00`); t.setDate(t.getDate() - 1); return t.toLocaleDateString('en-CA'); };
  const closedDay = (w: string) => !!w && ([0, 5, 6].includes(new Date(`${w}T12:00:00`).getDay()) || nvHoliday(new Date(`${w}T12:00:00`)));
  // (Round 45's rule skipped Fridays and weekends but not holidays: a deadline it filled on a holiday moves too.)
  const r45 = (s: string) => { if (!s) return ''; const t = new Date(`${s}T12:00:00`); t.setDate(t.getDate() - 1); while ([0, 5, 6].includes(t.getDay())) t.setDate(t.getDate() - 1); return t.toLocaleDateString('en-CA'); };
  const oldFilled = (w: string) => closedDay(w) && (w === rawBefore(sale) || w === rawBefore(filledFrom) || w === r45(sale) || w === r45(filledFrom));
  const redo = (x: PacketData['dates'][number]) => sameDate(x.what, SEALED_ROW) && !x.resolved && !!due && x.when !== due && (!x.when || (!!filledDue && x.when === filledDue) || oldFilled(x.when));
  // (An older packet whose deadline is still the usual one for its sale: note the sale it follows, so later edits move it.)
  if (!p.dates.some(redo)) return !p.sealedFor && sale && p.dates.some((x) => sameDate(x.what, SEALED_ROW) && !x.resolved && x.when === due) ? { ...p, sealedFor: sale } : p;
  return { ...p, sealedFor: sale, dates: p.dates.map((x) => (redo(x) ? { ...x, when: due } : x)) };
};
/** An offer's closing is marked handled, and its date (if any) has come. */
export const closingDoneIn = (p: PacketData, now: Date) => p.dates.some((x) => sameEvent(x.what, 'Closing') && !!x.resolved && (!x.when || x.when <= localDay(now)));
/** A paid Nevada tax sale whose SID question is still open: what to do about it (or '' when nothing is pending). */
export const sidPending = (d: { id?: string; state?: Deal['state']; kind: Deal['kind'] }, now: Date = new Date()): string => {
  if (!d.id || d.state !== 'NV' || d.kind !== 'taxSale' || !sidUnasked(d)) return '';
  const p = loadPacket(`analyzed:${d.id}`);
  const dl = sidDeadline(p);
  // (A yes answer dates or ticks the payoff row; the usual undated row is only a reminder to ask.)
  const row = p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && (!!x.when || !!x.resolved));
  if (dl < localDay(now)) return row ? `ask the Treasurer in writing whether the sale stands*: the 20 days for the special improvement district (SID) payoff ended ${prettyDay(dl)}, and if it wasn’t paid by then the sale is void (NRS 361.595(6))` : `ask the Treasurer whether a special improvement district (SID) affidavit was filed; the 20 days for any SID payoff ended ${prettyDay(dl)} (NRS 361.595(6))`;
  return `${row ? 'pay the special improvement district (SID) certificate' : 'ask the Treasurer whether a special improvement district (SID) affidavit was filed; if one was, pay the SID certificate'} by ${prettyDay(dl)}, or the sale is void (NRS 361.595(6)); the Treasurer then records the deed (NRS 361.595(7))`;
};
/** A Nevada tax sale where nothing records the SID answer (no payoff row handled, no "no affidavit"), with its 20-day date known. */
/** A dated SID payoff (you said an affidavit was filed) not yet paid, with the 20 days still running. */
const sidPayDue = (p: PacketData, now: Date) => { const dl = sidDeadline(p); const r = p.dates.find((x) => sameDate(x.what, 'SID certificate payoff') && !!x.when && !x.resolved); return dl && r && dl >= localDay(now) ? { dl, row: r.what } : null; };
const sidUnasked = (d: { id?: string }) => { if (!d.id) return false; const p = loadPacket(`analyzed:${d.id}`); return !!sidDeadline(p) && !p.dates.some((x) => (sameDate(x.what, 'SID certificate payoff') && x.resolved) || sameDate(x.what, NO_SID_ROW) || sameDate(x.what, SID_VOID_ROW)); };
/** A Nevada tax sale's SID payoff after its 20 days: 'late' (no answer from the Treasurer yet), 'void', or ''. */
export const sidState = (d: { id?: string; state?: Deal['state']; kind: Deal['kind'] }): '' | 'late' | 'void' => {
  if (!d.id || d.state !== 'NV' || d.kind !== 'taxSale') return '';
  const p = loadPacket(`analyzed:${d.id}`);
  const dl = sidDeadline(p);
  if (p.dates.some((x) => sameDate(x.what, SID_VOID_ROW))) return 'void';
  if (!dl || !p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && x.resolved && x.when > dl)) return '';
  return p.dates.some((x) => sameDate(x.what, SID_STANDS_ROW)) ? '' : 'late';
};
/** A Nevada trustee sale's challenge window worked out from the deed's recording (30 days), while its row is blank. */
const workedWindow = (d: { id?: string; state?: Deal['state']; kind: Deal['kind'] }) => { if (!d.id || d.state !== 'NV' || d.kind !== 'trustee') return ''; const on = loadPacket(`analyzed:${d.id}`).dates.find((x) => sameDate(x.what, 'Deed recorded') && x.when)?.when; if (!on) return ''; const t = new Date(`${on}T12:00:00`); t.setDate(t.getDate() + 30); return localDay(t); };
/** A sale postponed: clear its date, registration and payment dates for the new ones. */
const POSTPONE = { label: 'It was postponed: clear its dates to enter the new ones' };
/** What to answer first (lower first): a sale that may be void, then a task due today or tomorrow (a closing; not a
 *  plain date reminder), then the SID payoff, a passed sale day, other dates. */
// A won bid's missed payment deadline comes first: a winner who doesn't pay can lose the sale and owe the loss.
export const pressingWeight = (t: Pick<PlanTask, 'key' | 'label'> & { days?: number; urgent?: boolean }) => (t.key === 'sid-void' || t.key === 'sid-refund' || (t.days !== undefined && t.days < 0 && /Payment deadline/.test(t.label)) ? 0 : t.urgent && t.days !== undefined && t.days >= 0 && t.key !== 'date' ? 0.5 : /SID/.test(t.label) ? 1 : t.key === 'bid' ? 1.5 : t.key === 'date' ? 2 : 3);
/** Another property needs an answer now: a deadline passed, or its sale day passed ("did you win?"). */
export const needsAnswerNow = (t: PlanTask) => deadlinePassed(t) || (t.key === 'bid' && !!t.answer) || (t.days !== undefined && t.days <= 1 && !!t.urgent);
/** A deadline that has passed (a window ended, the SID payoff's 20 days): it needs an answer before routine work. */
export const deadlinePassed = (t: Pick<PlanTask, 'days'>) => t.days !== undefined && t.days < 0;
/** Who to ask whether anyone redeemed (and who answers on its row). */
/** The short name for who ran the sale, for questions and a row's who (the same in every state). */
export const sellerShort = (kind?: string): string => ({ trustee: 'the trustee', court: 'the sheriff’s civil office', hoa: 'the HOA’s foreclosure agent', irs: 'the IRS', taxSale: 'the Treasurer', lien: 'the treasurer that held the sale' } as Record<string, string>)[kind ?? ''] ?? 'whoever ran the sale';
const redeemAsk = (d: Pick<Deal, 'kind'>) => { const n = sellerShort(d.kind); return n[0].toUpperCase() + n.slice(1); };
/** An offer's Closing row marked handled. */
const closingTicked = (d: { id?: string }) => !!d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameEvent(x.what, 'Closing') && !!x.resolved && (!x.when || x.when <= localDay(new Date())));
/** A short sale's dated approval notice. */
/** An open lienholder-approval deadline whose date has passed. */
const approvalPassed = (d: { id?: string }) => !!d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameDate(x.what, 'Lienholder approval deadline') && !!x.when && !x.resolved && x.when < localDay(new Date()));
/** Nevada's own date and hour (Pacific time), for the SID lien's 10 a.m. payment cutoff wherever the reader is. */
const nvParts = (now: Date) => { const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now); const g = (t: string) => f.find((x) => x.type === t)?.value ?? ''; return { day: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) }; };
/** It's 10 a.m. or later in Nevada (NRS 271.560's cutoff). */
export const nvPastCutoff = (now: Date) => nvParts(now).hour >= 10;
/** A won bid's or picked certificate's open Payment deadline row that has passed (its date), else ''. A Nevada SID lien's
 * passes at 10 a.m. Nevada time on its date (NRS 271.560); any other at the end of its date. */
export const paymentPassed = (d: { id?: string; kind?: Deal['kind']; state?: Deal['state'] }, now = new Date()): string => {
  if (!d.id) return '';
  const nvLien = d.kind === 'lien' && d.state === 'NV';
  const nv = nvParts(now);
  return loadPacket(`analyzed:${d.id}`).dates.find((x) => sameDate(x.what, 'Payment deadline') && !x.resolved && !!x.when && (nvLien ? x.when < nv.day || (x.when === nv.day && nv.hour >= 10) : x.when < localDay(now)))?.when ?? '';
};
/** Who sells at this kind of sale (who to contact about a missed payment). */
export const sellerName = (kind?: string, state?: string): string => ({ trustee: 'the trustee', court: state === 'NV' ? 'the sheriff’s civil office (or the constable named on the notice)' : 'the sheriff’s civil office', hoa: state === 'NV' ? 'the person conducting the sale (the HOA’s foreclosure agent)' : 'the HOA’s foreclosure agent', irs: 'the IRS office named on the notice of sale', taxSale: 'the Treasurer', lien: state === 'NV' ? 'the city or county treasurer that held the sale' : 'the treasurer that held the sale' } as Record<string, string>)[kind ?? ''] ?? 'the official seller';
/** An open Closing row whose date has passed. */
const closingPassed = (d: { id?: string }) => !!d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameEvent(x.what, 'Closing') && !!x.when && !x.resolved && x.when < localDay(new Date()));
const approvedOn = (d: { id?: string }) => (d.id ? loadPacket(`analyzed:${d.id}`).dates.find((x) => sameDate(x.what, 'Approval notice received') && x.when)?.when ?? '' : '');
/** A certificate-first deal's redemption is over: the deed is in hand, or the period is marked over. */
export const redemptionOver = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && (deedInHand(d) || ticked(loadPacket(`analyzed:${d.id}`), 'Redemption period ends'));
/** The redemption is behind you: the deed or the end row ticked, or its end date (typed or worked out) already past. */
export const redemptionPast = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => {
  if (!d.id || redeemedDeal(d)) return false;
  if (deedInHand(d) || endedOn(d)) return true;
  // (Ticked early, with its date still ahead: it still runs.)
  const e = redemptionEnd({ ...d, state: d.state ?? 'NV' }, loadPacket(`analyzed:${d.id}`));
  return ticked(loadPacket(`analyzed:${d.id}`), 'Redemption period ends') && !(e && e >= localDay(new Date()));
};
export const redemptionEndedOn = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => endedOn(d);
/** A certificate-first deal without its deed yet (and not redeemed): the redemption end, or 'unknown'. Else ''. */
export const beforeDeed = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => (d.id && wayOf(d as Deal) !== 'lien' && certificateFirst(d) && !deedInHand(d) && !redeemedDeal(d) ? redemptionEnd({ ...d, state: d.state ?? 'NV' }, loadPacket(`analyzed:${d.id}`)) || 'unknown' : '');
/** Deed-recorded checks still open (the before-remodel check, a challenge or recovery window): moving on skips them. */
export const openDeedChecks = (d: Deal) => { if (!d.id || wayOf(d) === 'lien') return false; const p = loadPacket(`analyzed:${d.id}`); return stageTasks(d, 'closed', p, new Date()).some((t) => !t.done && (t.key === 'before-remodel' || t.key === 'window')); };
/** Moving past "Under contract" or "Won" early: the closing still ahead, or the payment not marked. '' when fine. */
export const earlyMoveNote = (d: Deal, pick: DealStage) => {
  if (!d.id || stageOf(d) !== 'contract' || !['closed', 'owned'].includes(pick)) return '';
  const p = loadPacket(`analyzed:${d.id}`); const today = localDay(new Date());
  if (wayOf(d) === 'offer') { const c = p.dates.find((x) => sameEvent(x.what, 'Closing') && !x.resolved); return c && (!c.when || c.when > today) ? `The closing${c.when ? ` (${prettyDay(c.when)})` : ''} isn’t marked done yet. Once it closes, press “It closed” in Your next action, or fix the Closing date in Key dates first.` : ''; }
  if (wayOf(d) === 'lien') return '';
  return p.dates.some((x) => sameDate(x.what, 'Payment deadline') && !x.resolved) ? 'The payment isn’t marked yet. If you paid, mark it in Your next action or Key dates first, so its next steps stay right.' : '';
};
/** The deal is marked redeemed (someone bought it back). */
export const redeemedDeal = (d: { id?: string }) => !!d.id && redeemedIn(loadPacket(`analyzed:${d.id}`));
/** A deal that's finished: a sold flip, or a redemption repaid. */
export const finishedDeal = (d: { id?: string }) => !!soldOf(d) || redeemedOf(d);
/** A certificate-first deal whose deed row is ticked in its packet. */
export const deedInHand = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && certificateFirst(d) && ticked(loadPacket(`analyzed:${d.id}`), DEED_AFTER_WAIT);

/** The stage's name for this kind of sale (you make an offer on a listing, but bid at an auction) and plan. */
export function stageLabel(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string; stage?: DealStage; county?: string }): string {
  const w = wayOf(d);
  if (stage !== 'passed' && d.stage === stage && sidState(d) === 'void') return 'Void: refund due';
  switch (stage) {
    case 'researching': return 'Researching';
    case 'offer': return w === 'offer' ? 'Preparing an offer' : w === 'lien' && d.state === 'NV' ? 'Preparing for the sale' : 'Preparing to bid';
    case 'contract': return w === 'offer' ? 'Under contract' : w === 'lien' && d.state === 'NV' ? (paidAtWin(d) ? 'Picked: paid, certificate next' : 'Picked: paying') : sealedBid(d) && paidAtWin(d) ? 'Won: paid with the sealed bid, recording next' : paidAtWin(d) ? (certificateFirst(d) ? 'Won: paid, certificate next' : 'Won: paid, recording next') : 'Won: paying and recording';
    case 'closed': return redeemingNow(d) && w !== 'lien' ? 'Redeemed: collecting the payoff' : w === 'offer' ? 'Closed' : w === 'lien' ? (redeemingNow(d) && (d as { stage?: string }).stage !== 'owned' ? 'Certificate in hand (paid off: collecting)' : 'Certificate in hand') : certificateFirst(d) && !deedInHand(d) ? (d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') : 'Deed recorded';
    case 'owned': return w === 'lien' ? (redeemingNow(d) && (d as { stage?: string }).stage === 'owned' ? 'Paid off: collecting from the Treasurer' : 'Holding the certificate') : d.plan === 'flip' ? (soldOf(d) ? 'Sold' : 'Fixing and selling') : liveIn(d) ? 'Living there' : 'Owned and operating';
    case 'passed': return redeemedOf(d) ? (wayOf(d) === 'lien' ? 'Paid off (repaid)' : 'Redeemed (repaid)') : 'Passed';
  }
}

/** One line on what the stage means, for the stage picker. */
type HintDeal = Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string; county?: string };
/** The county's usual deadline in words: 4 p.m. the day before the sale, or, when the office is closed that day, the
 * last day it's open before the sale (our safe reading: the notice gives the real date). */
const usualWords = (q: PacketData, usual: string): string => {
  const s = saleDayIn(q);
  const t = new Date(`${s}T12:00:00`); t.setDate(t.getDate() - 1);
  const raw = s ? t.toLocaleDateString('en-CA') : usual;
  const wd = (w: string) => new Date(`${w}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
  return raw === usual ? `4 p.m. the day before the sale (${wd(usual)}, ${prettyDay(usual)})` : `4 p.m. the day before the sale, but the Treasurer’s office is closed on that ${wd(raw)}, ${prettyDay(raw)}${nvHoliday(new Date(`${raw}T12:00:00`)) ? ', a Nevada holiday' : ''}. It’s open Monday to Thursday, except holidays, so to be safe we use its last open day before the sale: ${wd(usual)}, ${prettyDay(usual)}*`;
};
/** A sealed-bid deadline not yet sent that isn't the usual day before the sale: say so wherever the stage is shown. */
const sealedOff = (d: HintDeal): string => {
  if (!sealedBid(d) || !d.id) return '';
  const sp = loadPacket(`analyzed:${d.id}`);
  const row = sp.dates.find((x) => sameDate(x.what, SEALED_ROW) && x.when && !x.resolved);
  const usual = sealedDay({ ...sp, dates: sp.dates.filter((x) => !sameDate(x.what, SEALED_ROW)) });
  return !row || !usual || row.when === usual ? '' : row.when >= saleDayIn(sp) ? ` Your sealed-bid deadline (${prettyDay(row.when)}) is on or after the sale (${prettyDay(saleDayIn(sp))}): bids are due before the sale, usually by ${usualWords(sp, usual)}. Check the notice and fix the date.` : ` Your sealed-bid deadline (${prettyDay(row.when)}) isn’t the usual one. The usual deadline is ${usualWords(sp, usual)}. Keep your date only if the official notice says so.`;
};
export function stageHint(stage: DealStage, d: HintDeal): string {
  return stageHintBase(stage, d) + (stage === 'researching' || stage === 'offer' ? sealedOff(d) : '');
}
function stageHintBase(stage: DealStage, d: HintDeal): string {
  const w = wayOf(d);
  // (A sealed bid already sent can't be changed: the hint is about waiting for the sale, not research or a maximum bid.)
  if ((stage === 'researching' || stage === 'offer') && sealedBid(d) && d.id) {
    const sp = loadPacket(`analyzed:${d.id}`);
    if (ticked(sp, SEALED_ROW) && !saleOver(sp, new Date())) { const on = saleDayIn(sp); return `Your sealed bid and payment are with the Eureka County Treasurer. Wait for the sale${on ? ` (${prettyDay(on)})` : ''}; the Treasurer contacts each winning bidder by phone or mail.`; }
  }
  // (A certificate first: once its deed is in hand, the hint moves on.)
  const deedIn = deedInHand(d);
  switch (stage) {
    case 'researching': return w !== 'offer' && d.id && saleOver(loadPacket(`analyzed:${d.id}`), new Date()) ? (w === 'lien' && d.state === 'NV' ? 'The sale day has passed: say whether you were picked, in Your next action below.' : 'The sale day has passed: say whether you won, in Your next action below.') : w === 'offer' ? 'Checking whether it fits, before any offer. Check the listing and the seller’s deadlines while you research.' : w === 'lien' ? (d.state === 'NV' ? 'Checking whether it fits, before the sale. Check the sale’s registration and payment deadlines while you research.' : 'Checking whether it fits, before you bid. Check the sale’s registration and payment deadlines while you research.') : d.kind === 'trustee' ? 'Checking whether it fits, before any bid. Confirm the sale date and the trustee’s payment terms while you research.' : sealedBid(d) ? 'Checking whether it fits, before any bid. The sale is sealed-bid: your bid and full payment must reach the Treasurer’s office by the deadline in the notice (usually 4 p.m. the day before the sale; the office is open Monday to Thursday except holidays, so if it’s closed that day the deadline may be earlier*).' : 'Checking whether it fits, before any bid. Check the sale’s registration deadline while you research.';
    case 'offer': return w !== 'offer' && d.id && saleOver(loadPacket(`analyzed:${d.id}`), new Date()) ? (w === 'lien' && d.state === 'NV' ? 'The sale day has passed: say whether you were picked, in Your next action below.' : 'The sale day has passed: say whether you won, in Your next action below.') : w === 'offer' ? 'It checked out: you’re setting your price, the earnest money and your questions before you offer.' : w === 'lien' && d.state === 'NV' ? 'It checked out: you’re setting the most you’ll put into one certificate and getting the funds ready.' : 'It checked out: you’re setting your maximum bid and getting the funds ready.';
    case 'contract': return w === 'offer' && closingTicked(d) ? 'Closed? Mark it below to start the new-owner tasks.' : w === 'offer' ? (d.kind === 'short' ? (!(approvedOn(d) && approvedOn(d) <= localDay(new Date())) && approvalPassed(d) ? 'The lender’s approval deadline passed with no approval notice: see Your next action.' : !(approvedOn(d) && approvedOn(d) <= localDay(new Date())) && closingPassed(d) ? 'The closing date passed without the lender’s approval: see Your next action.' : approvedOn(d) && approvedOn(d) <= localDay(new Date()) ? `The lender approved the short sale on ${prettyDay(approvedOn(d))}: the contract’s deadlines are running.` : 'The seller accepted your offer. Most deadlines start when the lender approves the short sale: watch for the approval notice, and meet any deadline your addendum sets before then.') : (closingTicked(d) ? 'The closing is marked handled: mark the deal closed to start the new-owner tasks.' : 'The seller accepted your offer. The contract’s deadlines are running.')) : w === 'lien' && d.state === 'NV' ? (paidAtWin(d) ? 'You were picked and paid. Next: the certificate.' : paymentPassed(d) ? 'You were picked, and the payment deadline has passed.' : 'You were picked. The payment deadline is running.') : sidState(d) === 'void' ? (d.id && voidByLaw(loadPacket(`analyzed:${d.id}`)) ? 'The SID payoff wasn’t made within 20 days, so the sale is void (NRS 361.595(6)): ask the Treasurer in writing for the rest of what you paid*.' : 'The Treasurer said the sale is void: ask in writing for the rest of what you paid (it may keep up to 10%, NRS 361.595(6))*.') : sidState(d) === 'late' ? 'Paid, but the SID payoff came after the 20-day deadline: confirm with the Treasurer whether the sale stands*.' : paidAtWin(d) ? (sidPending(d) ? (sealedBid(d) ? 'Paid with your sealed bid (paid by card? check that the charge went through).' : 'Paid.') + ' Next: the special improvement district (SID) step in the next task; the Treasurer then records the deed (NRS 361.595(7)).' : certificateFirst(d) ? (d.id && (() => { const p = loadPacket(`analyzed:${d.id}`); const e = p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when || redemptionEnd({ ...d, state: d.state ?? 'NV' }, p); return !!e && e < localDay(new Date()); })() ? (ticked(loadPacket(`analyzed:${d.id}`), DEED_AFTER_WAIT) ? 'Paid, no one redeemed, and you have the deed: move it to the next stage (see the next task).' : (ticked(loadPacket(`analyzed:${d.id}`), d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') ? 'Paid, and the redemption period is over: move it to the next stage (see the next task).' : 'Paid, and the redemption period is over: move it to the next stage once you have the certificate of sale (see the next task).')) : d.id && RECORDED_ROWS.some((r) => ticked(loadPacket(`analyzed:${d.id}`), r)) ? 'Paid, and the certificate of sale is recorded: the deed comes once the redemption period ends, if no one redeems.' : 'Paid. The next task names each step: insure it, then the certificate of sale; the deed comes once the redemption period ends.') : 'Paid. The next task names each step until the deed is recorded.') : paymentPassed(d) ? 'The payment deadline has passed.' : 'Payment and recording deadlines are running.';
    case 'closed': if (d.state === 'NV' && d.kind === 'trustee' && d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameDate(x.what, 'Challenge window ends') && x.resolved)) return 'The deed is yours and the challenge window is handled. Your next action below names what’s still open.';
      return sidState(d) === 'void' ? (d.id && voidByLaw(loadPacket(`analyzed:${d.id}`)) ? 'The SID payoff wasn’t made within 20 days, so the sale is void (NRS 361.595(6)): ask the Treasurer in writing for the rest of what you paid*.' : 'The Treasurer said the sale is void: ask in writing for the rest of what you paid (it may keep up to 10%, NRS 361.595(6))*.') : sidState(d) === 'late' ? 'The SID payoff came after the 20-day deadline: confirm with the Treasurer whether the sale stands* before any work on it.' : redeemingNow(d) && w === 'lien' ? 'The owner paid: collect the payoff from the Treasurer, with a receipt, then mark it finished.' : redeemingNow(d) ? 'It was redeemed: no deed will come. Collect your price plus what the law adds, with a receipt, then mark it finished.' : w === 'offer' ? 'It’s yours: insurance, locks, utilities and repairs come first.' : w === 'lien' ? 'You hold the certificate: track it until it’s paid off.' : deedIn ? 'You have the recorded deed: secure and insure it, confirm possession and title insurance, then start the repairs.' : certificateFirst(d) && d.id && ticked(loadPacket(`analyzed:${d.id}`), 'Redemption period ends') ? `No one redeemed: get the deed from ${deedWho(d).replace(/^The /, 'the ')} and record it; secure and insure the property and confirm possession before the repairs.` : certificateFirst(d) && d.id && endedOn(d) ? `The redemption period ended on ${prettyDay(endedOn(d))}: find out whether anyone redeemed, then get the deed.` : certificateFirst(d) ? `A certificate of sale first: insure and maintain it; remodeling before the redemption period (${waitWord(d)} after the sale) ends and you have the deed puts that money at risk if someone redeems*.` : (d.state === 'NV' && d.kind === 'trustee' ? (windowEndOf(d) ? `The deed is yours: the challenge window ${windowEndOf(d) < localDay(new Date()) ? 'ended' : 'ends'} ${prettyDay(windowEndOf(d))}${d.id && sale90(loadPacket(`analyzed:${d.id}`)) > windowEndOf(d) && sale90(loadPacket(`analyzed:${d.id}`)) >= localDay(new Date()) ? (windowEndOf(d) < localDay(new Date()) ? `; anyone not properly notified can still sue until ${prettyDay(sale90(loadPacket(`analyzed:${d.id}`)))} (NRS 107.080(6))` : `, or ${prettyDay(sale90(loadPacket(`analyzed:${d.id}`)))} for anyone not properly notified`) : ''}; check possession and title before you remodel.` : workedWindow(d) ? `The deed is yours: the challenge window ${workedWindow(d) < localDay(new Date()) ? 'ended' : 'ends'} ${prettyDay(workedWindow(d))} (worked out from the deed’s recording; confirm it with your title company)${d.id && sale90(loadPacket(`analyzed:${d.id}`)) > workedWindow(d) && sale90(loadPacket(`analyzed:${d.id}`)) >= localDay(new Date()) ? (workedWindow(d) < localDay(new Date()) ? `; anyone not properly notified can still sue until ${prettyDay(sale90(loadPacket(`analyzed:${d.id}`)))} (NRS 107.080(6))` : `, or ${prettyDay(sale90(loadPacket(`analyzed:${d.id}`)))} for anyone not properly notified`) : ''}; check possession and title before you remodel.` : 'The deed is yours: put the challenge window’s end (30 days after the deed is recorded, or up to 90 days after the sale for anyone not properly notified) on its calendar, and check possession and title before you remodel.') : d.state === 'NV' && d.kind === 'taxSale' && d.id && (() => { const t = sidPaidAffidavit(d as Deal, loadPacket(`analyzed:${d.id}`), new Date(), 'this property'); return !!t && !t.done; })() ? 'Paid on time: the Treasurer can’t issue the deed until the city or county files its affidavit that you paid the SID certificate (NRS 361.595(6)), so confirm it was sent. If you already have the recorded deed, ask the Treasurer in writing whether the affidavit was filed*.' : d.state === 'NV' && d.kind === 'taxSale' && d.id && sidPayDue(loadPacket(`analyzed:${d.id}`), new Date()) ? `You marked the deed recorded, but the Treasurer can’t issue a deed until the SID certificate is paid and the city or county files its affidavit (NRS 361.595(6)): pay it by ${prettyDay(sidPayDue(loadPacket(`analyzed:${d.id}`), new Date())!.dl)}. If you don’t have the recorded deed yet, move it back to “Won: paying and recording”; if you do, ask the Treasurer in writing whether an SID affidavit was filed*.` : d.state === 'NV' && d.kind === 'taxSale' ? `${sidUnasked(d) ? 'Your deed is recorded. The Treasurer may issue it only if no SID affidavit was filed or the SID amount was paid (NRS 361.595(6)): get that in writing from the Treasurer for your title company*. Then check' : 'The deed is yours: check'} the 2-year recovery-suit window, possession and title before you remodel.${sidUnasked(d) ? ` If the Treasurer had an SID affidavit for the parcel, its payoff ${sidDeadline(loadPacket(`analyzed:${d.id}`)) < localDay(new Date()) ? 'was' : 'is'} due by ${prettyDay(sidDeadline(loadPacket(`analyzed:${d.id}`)))} (NRS 361.595(6)): ${sidDeadline(loadPacket(`analyzed:${d.id}`)) < localDay(new Date()) ? 'see Your next action for whether it was paid in time' : d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameDate(x.what, 'SID certificate payoff') && !!x.when) ? 'pay it by then' : 'ask the Treasurer if you haven’t'}.` : ''}` : 'The deed is yours: check redemption, possession and title before you remodel.');
    case 'owned': return beforeDeed(d) ? (d.id && ticked(loadPacket(`analyzed:${d.id}`), 'Redemption period ends') ? `No one redeemed: get the deed from ${deedWho(d).replace(/^The /, 'the ')} and record it; the owner tasks start here once you have it.` : beforeDeed(d) !== 'unknown' && beforeDeed(d) < localDay(new Date()) ? `The redemption period ended on ${prettyDay(beforeDeed(d))}: find out whether anyone redeemed, then get the deed.` : `You hold a certificate of sale, not the deed${beforeDeed(d) !== 'unknown' ? `: the redemption period ends ${prettyDay(beforeDeed(d))}` : ''}. Repairs or a sale before the deed put that money at risk if someone redeems.*`) : sidState(d) === 'void' ? (d.id && voidByLaw(loadPacket(`analyzed:${d.id}`)) ? 'The SID payoff wasn’t made within 20 days, so the sale is void (NRS 361.595(6)): ask the Treasurer in writing for the rest of what you paid*.' : 'The Treasurer said the sale is void: ask in writing for the rest of what you paid (it may keep up to 10%, NRS 361.595(6))*.') : sidState(d) === 'late' ? 'The SID payoff came after the 20-day deadline: confirm with the Treasurer whether the sale stands* before any work on it.' : w === 'lien' && redeemingNow(d) ? 'The owner paid: collect the payoff from the Treasurer, with a receipt, then mark it finished.' : w === 'lien' ? 'Tracking payoffs, interest and what to do with unpaid liens.' : liveIn(d) ? 'Living there: recording what your home really costs each month.' : d.plan === 'flip' ? (soldOf(d) ? `Sold on ${prettyDay(soldOf(d)!.on)} for $${Math.round(soldOf(d)!.price).toLocaleString('en-US')}: ${d.id && /Rough profit/.test(flipSaleLine({ ...(d as Deal), plan: 'flip' }) ?? '') ? 'the sale notice under “After you buy” shows a rough profit against the one you planned' : `in Analyze, under Fix and flip, enter the resale value and costs, then the price you paid in “Check ${wayOf(d) === 'offer' ? 'an offer' : 'a bid'}”, to see your rough profit`}. Then find your next property.` : (d.state === 'NV' && d.kind === 'trustee' && d.id && !soldOf(d) && !loadPacket(`analyzed:${d.id}`).dates.some((x) => sameDate(x.what, 'Challenge window ends') && x.resolved) ? 'Bought at a trustee’s sale: the challenge window comes first (see the next task), then fix it up and track costs against your budget.' : 'Fixing it up and selling it: tracking repair and holding costs against your budget.')) : 'Renting or holding it: recording real rent and costs each month.';
    case 'passed': return d.id && loadPacket(`analyzed:${d.id}`).dates.some((x) => sameDate(x.what, SID_VOID_ROW)) ? 'The sale was void: keep the Treasurer’s refund receipt with your records. Find your next property when you’re ready.' : redeemedOf(d) ? (wayOf(d) === 'lien' ? 'The owner paid off the lien and the Treasurer repaid you (NRS 271.595(2)). A fine result: find your next lien sale.' : 'It was redeemed and you were repaid your price plus what the law adds. A fine result: find your next property.') : paymentPassed(d) && !sealedBid(d) && wayOf(d) !== 'offer' ? (wayOf(d) === 'lien' ? `Passed. Find your next lien sale when you’re ready. If you were picked but didn’t pay by the deadline, the certificate isn’t yours${d.state === 'NV' ? ' (NRS 271.560)' : ''}.` : `You walked away or were outbid. Either is a fine result when the evidence says no: find your next property. If you won but didn’t pay by the deadline, ask ${sellerName(d.kind, d.state)} and an attorney what you may owe.`) : sealedBid(d) ? 'Passed. If you sent a sealed bid that didn’t win, the county returns the enclosed payment by certified mail; if it doesn’t arrive, ask the Eureka County Treasurer.' : certificateFirst(d) ? 'You walked away or were outbid. Either is a fine result when the evidence says no: find your next property.' : 'You walked away. A good result when the evidence says no.';
  }
}

/** The roadmap steps (roadmap.ts) that belong to each stage, so the roadmap's next step follows the deal's stage. */
export const STAGE_STEPS: Record<DealStage, string[]> = {
  researching: ['find', 'evidence', 'quotes', 'a-find', 'a-research', 'a-value', 'a-insure', 'c-sale', 'c-research', 'c-budget'],
  offer: ['offer', 'a-max', 'a-bid', 'c-bid'],
  contract: ['deposit', 'inspect', 'appraise', 'title', 'loan-approval', 'bind-insurance', 'walkthrough', 'close', 'a-pay', 'a-possess'],
  closed: ['first-week', 'a-before-remodel', 'repairs', 'rent', 'c-own', 'c-hold'],
  owned: ['operate', 'review', 'exit-refi', 'exit-sell', 'exit-1031', 'c-decide'],
  passed: [],
};

/** The stage a roadmap step belongs to, if it's one of a property's steps. */
export const stageOfStep = (id: string): DealStage | undefined => DEAL_STAGES.find((st) => STAGE_STEPS[st].includes(id));

/** The stage a deal saved before stages existed is most likely at, from what's already recorded for it. */
export function inferStage(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), log: EvidenceLog = loadLog(`analyzed:${d.id}`), owned: Record<string, Owned> = loadOwned()): DealStage {
  const o = owned[d.id];
  if (o) return o.months.length ? 'owned' : 'closed';
  if (log.gate === 'pass') return 'passed';
  // An accepted offer on its calendar: the contract is signed. Without one, it's still a candidate.
  if (wayOf(d) === 'offer' && p.dates.some((x) => x.when && /accepted|contract signed|effective date/i.test(x.what))) return 'contract';
  return 'researching';
}

/** The deal's stage: the one the buyer chose, or the most likely one for a deal saved before stages existed. */
export const stageOf = (d: Deal): DealStage => d.stage ?? inferStage(d);

/** A saved deal's stage by id (inferred for older deals, as everywhere else), or '' when there's no such deal. */
export const savedStageOf = (id?: string): DealStage | '' => { const d = id ? loadDeals().find((x) => x.id === id) : undefined; return d ? stageOf(d) : ''; };

/** Change a saved deal's stage. Kept with the deal, so Analyze, the deal packet and My plan all agree. */
export function setDealStage(id: string, stage: DealStage) {
  if (!isDealStage(stage)) return;
  const all = loadDeals();
  const was = all.find((d) => d.id === id);
  if (!was) return;
  // A home bought to live in keeps that answer from now on (so a later Decide change doesn't turn it into a rental).
  saveDeals(all.map((d) => (d.id === id ? { ...d, stage, ...((stage === 'closed' || stage === 'owned') && !d.home && d.plan === 'rent' && wayOf(d) === 'offer' && decideAnswered() ? { home: liveIn(d) ? 'live' as const : 'rent' as const, homeFrom: 'plan' as const } : {}) } : d)));
  // Moved back off a repaid finish (from any page): the payoff isn't collected after all.
  if (stage !== 'passed') {
    const k = `analyzed:${id}`;
    const pk = loadPacket(k);
    if (pk.dates.some((x) => sameDate(x.what, REDEEMED_ROW) && x.resolved)) savePacket(k, { ...pk, dates: pk.dates.map((x) => (sameDate(x.what, REDEEMED_ROW) ? { ...x, resolved: false } : x)) });
  }
  // A sealed-bid sale won (by any button or the stage list): the full payment went in with the bid, so it's paid.
  if (sealedBid(was) && (stageOf(was) === 'researching' || stageOf(was) === 'offer') && (stage === 'contract' || stage === 'closed' || stage === 'owned')) {
    const k = `analyzed:${id}`;
    const pk = loadPacket(k);
    // (Only the sealed-bid row: Eureka has no separate payment deadline. One carried over from another county is
    // settled too, undated ones dropped, so it isn't a reminder.)
    const rows = pk.dates.filter((x) => !(sameDate(x.what, 'Payment deadline') && !x.when)).map((x) => (sameDate(x.what, SEALED_ROW) ? { ...x, resolved: true, when: x.when || sealedDay(pk), who: x.who || 'You' } : sameDate(x.what, 'Payment deadline') ? { ...x, resolved: true } : x));
    const dates = rows.some((x) => sameDate(x.what, SEALED_ROW)) ? rows : [...rows, { what: SEALED_ROW, when: sealedDay(pk), who: 'You', resolved: true }];
    if (JSON.stringify(dates) !== JSON.stringify(pk.dates)) savePacket(k, { ...pk, dates });
  }
  try {
    // The deal open in Analyze is kept separately: change its copy too, so it doesn't write the old stage back.
    const cur = JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null') as Deal | null;
    if (cur && cur.id === id) { const st = loadDeals().find((x) => x.id === id); localStorage.setItem(CURRENT_KEY, JSON.stringify({ ...cur, stage, ...(st?.home ? { home: st.home, homeFrom: st.homeFrom } : {}) })); }
  } catch {
    /* storage unavailable */
  }
  progressChanged();
}

export interface Support {
  label: string;
  href: string;
}

export interface PlanTask {
  key: string;
  /** What to do, naming the property: "Verify the rent for 123 Main St". */
  label: string;
  /** What you'll have when it's done. */
  produces: string;
  /** Where the work happens. */
  href: string;
  /** Opens the deal in Analyze (the link alone opens whatever deal Analyze last had). */
  openDeal?: boolean;
  /** Continue changes the deal's stage (the decision behind it is already recorded). */
  setStage?: DealStage;
  /** A second button for the event that moves the deal on: "The seller accepted: mark it under contract". */
  advance?: { stage: DealStage; label: string; /** Rows this answer also marks handled (the deed recorded): dated today if blank, added if missing. */ ticks?: string[]; tickWho?: string; /** The date for a blank or added row in place of today ('' leaves it undated). */ tickWhen?: string };
  /** The other answer to the same event: "I didn't win: mark it passed". addRow adds a row to its dates (a redemption's payoff). */
  advance2?: { stage: DealStage; label: string; addRow?: { when: string; what: string; who: string }; closes?: string };
  /** The task is a question its buttons answer: no Continue or "Go there" link beside them. */
  answer?: boolean;
  /** A button that marks one of its date rows handled (then, optionally, moves the deal on). */
  tick?: { label: string; row: string; /** The roadmap step it also marks done. */ step?: string; /** Sets the row's date (over one typed later). */ setWhen?: string; /** Leaves a blank date blank (instead of today). */ noDate?: boolean; then?: DealStage; closes?: string; /** Fills a blank "who" (and adds the row if it's missing). */ who?: string; /** The date to record when the row has none (else today). */ when?: string; /** An undated row this answer makes moot (removed). */ drops?: string };
  /** Moves a row's date ("The 90-day limit still runs: move the end to …"). */
  redate?: { label: string; row: string; when: string; who?: string; /** Renames the row (the condition in its name is settled). */ as?: string };
  /** Records an answer as a new handled row ("I didn't pay it in time: the sale is void"). */
  record?: { label: string; row: { when: string; what: string; who: string; resolved?: boolean }; /** A row this answer settles (marked handled). */ closes?: string; /** The roadmap step it also marks done. */ step?: string };
  /** The sale was postponed: clears the sale day, registration and payment dates (TaskActions). */
  postpone?: { label: string };
  /** A date reminder's days until its date (below 0: it has passed). */
  days?: number;
  /** Takes back an answer: removes the row it added ("Not redeemed after all? Undo"). */
  undo?: { label: string; removeRow: string; /** A row put in its place (the Treasurer's answer). */ addRow?: { when: string; what: string; who: string; resolved?: boolean }; /** The stage to go back to. */ then?: DealStage };
  /** Lessons, practice missions, guides and team pages that help with this task. */
  support: Support[];
  done: boolean;
  /** Shown instead of "done" when done only means it was worked out, not checked: "Calculated: verify the inputs". */
  doneLabel?: string;
  /** A deadline or open question that comes before everything else. */
  urgent?: boolean;
  /** The whole action as one sentence, for the deal packet and its text download. */
  text: string;
}

const packetHref = (d: Deal, section: string) => `#/deals/packet/${d.id}/${section}`;
/** My plan, opened at a roadmap step. */
const stepHrefFor = (id: string, dealId?: string) => `#/toolkit/roadmap?${dealId ? `deal=${encodeURIComponent(`analyzed:${dealId}`)}&` : ''}step=${encodeURIComponent(id)}`;
const ROADMAP_HREF = '#/toolkit/roadmap';
const L = {
  analyze: { label: 'Lesson: Analyzing a deal', href: '#/learn/analyze' },
  rentMission: { label: 'Practice missions: would you buy this $265,000 rental?', href: '#/practice/drills/rental-265' },
  negotiate: { label: 'Lesson: Making an offer and closing', href: '#/learn/negotiate' },
  walkAway: { label: 'Lesson: When to walk away', href: '#/learn/walk-away' },
  afterClosing: { label: 'Lesson: Running a rental', href: '#/learn/after-closing' },
  guides: { label: 'Your sale guide', href: '#/playbooks' },
  findDeals: { label: 'Official sources for your county', href: '#/find-deals' },
  practiceAuction: { label: 'Practice an auction', href: '#/practice' },
  practiceLien: { label: 'Practice a lien certificate', href: '#/practice/sid-house' },
  buyBox: { label: 'Your buy box', href: '#/toolkit/buy-box' },
  caseStage: (stage: string, title: string) => ({ label: `Practice purchase: ${title}`, href: `#/practice/case/${stage}` }),
  pro: (k: string) => ({ label: `Your team: ${(proGuideByKey(k as never)?.title ?? k).toLowerCase()}`, href: `#/pros/${k}` }),
};

const lastMonth = (now: Date) => {
  const m = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
};

/** A Nevada tax sale's SID payoff after its 20 days: whether the sale stands, or (once void) the refund. */
/** A Nevada tax sale's SID question: was an affidavit filed, and was it paid (asked at Won, and still at Deed recorded or
 *  Owned while unanswered; NRS 361.595(6)). */
function sidAffidavitTask(d: Deal, p: PacketData, now: Date, n: string): PlanTask {
  return task({ key: 'sid-affidavit', answer: true, ...(sidDeadline(p) && sidDeadline(p) >= localDay(now) ? { redate: { label: `Yes, there’s an SID affidavit: I’ll pay it by ${prettyDay(sidDeadline(p))}`, row: 'SID certificate payoff (if the Treasurer has an SID affidavit for the parcel)', when: sidDeadline(p), who: 'Me', as: 'SID certificate payoff (affidavit filed)' } } : {}), ...(sidDeadline(p) && sidDeadline(p) < localDay(now) && !(p.dates.some((x) => (sameDate(x.what, 'SID certificate payoff') && (!!x.when || !!x.resolved)) || sameDate(x.what, NO_SID_ROW))) ? { days: -1 } : {}), label: p.dates.some((x) => (sameDate(x.what, 'SID certificate payoff') && (!!x.when || !!x.resolved)) || sameDate(x.what, NO_SID_ROW)) ? `Asked the Treasurer about an SID affidavit for ${n}` : sidDeadline(p) && sidDeadline(p) < localDay(now) ? `The 20 days for any SID payoff on ${n} ended ${prettyDay(sidDeadline(p))}: ask the Treasurer today whether a city or county filed a special improvement district (SID) affidavit` : `Ask the Treasurer today whether a city or county filed a special improvement district (SID) affidavit for ${n}`, produces: sidDeadline(p) && sidDeadline(p) < localDay(now) ? 'a written yes or no. If one was filed and it wasn’t paid by then, the sale is void and the Treasurer may keep up to 10% of what you paid (NRS 361.595(6)); if you paid it, enter the payoff’s date in Key dates and mark it handled' : `a written yes or no. If yes, the amount owed, paid to that city or county by ${sidDeadline(p) ? prettyDay(sidDeadline(p)) : 'the 20th day after the sale'}${sidDeadline(p) ? ' (20 days after the sale)' : ''}, or the sale is void (NRS 361.595(6)), with its date in Key dates`, href: packetHref(d, 'dates'), tick: { label: 'The Treasurer confirmed no SID affidavit', row: NO_SID_ROW, who: 'The county treasurer', drops: 'SID certificate payoff' }, ...(sidDeadline(p) && sidDeadline(p) < localDay(now) ? { undo: { label: 'An affidavit was filed and I didn’t pay it in time: the sale is void', removeRow: SID_VOID_ROW, addRow: { when: localDay(now), what: VOID_UNPAID, who: 'You', resolved: true } } } : {}), support: [L.guides], done: p.dates.some((x) => (sameDate(x.what, 'SID certificate payoff') && (!!x.when || !!x.resolved)) || sameDate(x.what, NO_SID_ROW) || sameDate(x.what, SID_VOID_ROW)) });
}
/** After an on-time SID payoff: the city or county's affidavit to the Treasurer, which the deed waits for (NRS 361.595(6)). */
function sidPaidAffidavit(d: Deal, p: PacketData, now: Date, n: string): PlanTask | null {
  return d.state === 'NV' && d.kind === 'taxSale' && sidDeadline(p) && p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && x.resolved && (x.when ? x.when <= sidDeadline(p) : !/\(if /i.test(x.what))) ? task({ key: 'sid-paid-affidavit', label: `Confirm the city or county sent the Treasurer its affidavit that you paid the SID certificate for ${n}`, produces: 'the city or county’s confirmation that its affidavit reached the Treasurer, noted in its deal packet. The Treasurer can’t issue your deed without it (NRS 361.595(6))', href: packetHref(d, 'dates'), record: { label: 'They sent it: mark it handled', row: { when: localDay(now), what: SID_AFFIDAVIT_SENT, who: 'The city or county', resolved: true } }, support: [], done: p.dates.some((x) => sameDate(x.what, SID_AFFIDAVIT_SENT)) || RECORDED_ROWS.some((r) => ticked(p, r)) }) : null;
}
function sidTasks(d: Deal, p: PacketData, now: Date, n: string): PlanTask[] {
  const out: PlanTask[] = [];
    const sidLateRow = d.state === 'NV' && d.kind === 'taxSale' && sidDeadline(p) ? p.dates.find((x) => sameDate(x.what, 'SID certificate payoff') && x.resolved && x.when > sidDeadline(p)) : undefined;
    if (sidLateRow) out.push(task({ key: 'sid-void', days: -1, label: `The SID payoff for ${n} is dated ${prettyDay(sidLateRow.when)}, after the 20-day deadline (${prettyDay(sidDeadline(p))}): ask the Treasurer in writing whether the sale stands*`, produces: 'a written answer from the Treasurer, in its evidence log. If the payoff wasn’t made within 20 days, the sale is void and the Treasurer may keep up to 10% of what you paid (NRS 361.595(6))', href: packetHref(d, 'dates'), tick: { label: 'The Treasurer confirmed in writing that the sale stands: mark it', row: SID_STANDS_ROW, who: 'The county treasurer' }, undo: { label: 'The Treasurer said the sale is void: mark it', removeRow: SID_VOID_ROW, addRow: { when: localDay(now), what: VOID_SAID, who: 'The county treasurer', resolved: true } }, answer: true, urgent: true, support: [L.guides], done: p.dates.some((x) => sameDate(x.what, SID_STANDS_ROW) || sameDate(x.what, SID_VOID_ROW)) }));
    if (d.state === 'NV' && d.kind === 'taxSale' && p.dates.some((x) => sameDate(x.what, SID_VOID_ROW))) out.push(task({ key: 'sid-refund', days: -1, label: `The sale of ${n} is void: ask the Treasurer in writing for the rest of what you paid*`, produces: `the refund and a receipt, in its evidence log. The Treasurer may keep up to 10% of what you paid for administrative costs (NRS 361.595(6))${p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && x.resolved) ? '. Ask the city or county you paid for the SID certificate what happens to that payment*; your attorney can help' : ''}. Then mark it passed`, href: packetHref(d, 'dates'), tick: { label: 'I got the refund: mark it passed', row: 'Refund received from the Treasurer', who: 'The county treasurer', then: 'passed' }, undo: { label: 'Not void after all? Undo', removeRow: SID_VOID_ROW }, answer: true, urgent: true, support: [L.guides], done: false }));
  return out;
}

/** At a win (and after it, until it's entered): the winning bid in Analyze, so the packet's numbers use it. */
function wonPrice(d: Deal, p: PacketData, n: string): PlanTask {
  const typed = bidTyped(d);
  return task({ key: 'won-price', label: typed ? `Enter your winning bid for ${n} in Analyze` : `No bid is saved for ${n} yet: enter your winning bid in Analyze`, produces: `the price you paid, in ${d.plan === 'flip' ? '“Check a bid” under Fix and flip (it appears once the resale value is in)' : '“Your winning bid” under Buy and hold'}, so the packet’s cash and numbers use it instead of the ${d.plan === 'flip' ? 'opening bid' : 'walk-away price'}. ${typed ? 'Then mark it here' : 'Then come back here: a button to mark it appears once the bid is in'}`, href: '#/analyze', openDeal: true, ...(typed ? { tick: { label: 'I entered my winning bid: mark it', row: WON_BID_ROW, who: 'Me' } } : {}), support: [], done: p.dates.some((x) => sameDate(x.what, WON_BID_ROW)) });
}

/** A task in the stage's list. `text` defaults to the label. */
function task(t: Omit<PlanTask, 'text' | 'support'> & { support?: Support[]; text?: string }): PlanTask {
  return { support: [], ...t, text: t.text ?? `${t.label}${/[?.!]$/.test(t.label) ? '' : '.'}` };
}

/**
 * The tasks for the deal's stage, in order, each marked done from what's recorded (the evidence log, the deal packet,
 * the saved numbers, the roadmap kept for this property, and the owned-property record). The last task of a stage is
 * never done: it's the event that moves the deal on.
 */
export function stageTasks(d: Deal, stage: DealStage = stageOf(d), p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date(), log: EvidenceLog = loadLog(`analyzed:${d.id}`), owned: Record<string, Owned> = loadOwned()): PlanTask[] {
  p = fillSealedDay(d, p);
  // (A step link names this property, so the roadmap opens on it.)
  const stepHref = (id: string) => stepHrefFor(id, d.id);
  const n = d.name || 'this property';
  const w = wayOf(d);
  const ev = (k: string) => !!log.rows[k]?.done;
  const per = dealProgress(`analyzed:${d.id}`);
  const stepDone = (id: string) => per.done.includes(id) || per.status[id] === 'na';
  const nums = savedNumbers(d);
  const hasNums = d.plan === 'lien' || hasSavedNumbers(nums); // only the property's own numbers (dealPacket.ownNumbers)
  const tx = d.state === 'TX';
  const out: PlanTask[] = [];

  const numbers = () => {
    // A lien certificate: the price and the wait, from the Lien certificate calculator (done once the price is typed).
    if (d.plan === 'lien') {
      out.push(task({ key: 'numbers', label: `Run the lien numbers for ${n}: the price, the rate and the wait`, produces: 'its yearly yield if it’s paid on time and if it takes longer, saved with the deal', href: '#/analyze', openDeal: true, support: [L.analyze], done: !!nums.lien, doneLabel: 'Calculated: verify the inputs' }));
      return;
    }
    const verb = w === 'offer' ? 'pay' : 'bid';
    out.push(task({
      key: 'numbers',
      label: liveIn(d) ? `Run the numbers for ${n} at the price you’d pay` : d.plan === 'rent' ? `Run the rental numbers for ${n} at the price you’d ${verb}` : d.plan === 'flip' ? `Set your walk-away price for ${n} (fix and sell)` : `Run the income numbers for ${n}`,
      produces: liveIn(d) ? 'its monthly cost and the cash it needs, saved with the deal (rent 0, or only the rent from space you’ll rent out)' : d.plan === 'rent' ? 'its own rent typed in (not our example), its monthly cash flow, the cash it needs and downside cases, saved with the deal' : d.plan === 'flip' ? 'the most you can pay and still make your profit from your resale value and repairs (enter title, possession and holding costs, or 0, before you rely on it)' : 'the most its income supports at your target return',
      href: '#/analyze',
      openDeal: true,
      support: d.plan === 'rent' ? [L.analyze, L.rentMission] : [L.analyze],
      done: hasNums,
      // Entered numbers give a result, not a verified one: the inputs still need checking against quotes and comps.
      doneLabel: 'Calculated: verify the inputs',
    }));
  };
  // Paying at a win: done once the payment is marked (its row handled), not by the pre-sale "funds ready" tick.
  const payTask = (label: string, produces: string) => out.push(task({ key: 'ev-terms', label, produces, href: packetHref(d, 'dates'), tick: { label: 'I paid: mark it handled', row: 'Payment deadline', who: 'Me', noDate: true }, support: [L.guides], done: paidIn(p, d) }));
  const area = (k: string, label: string, produces: string, support: Support[] = [], also = false) => { const t = areasFor(d.kind, liveIn(d)).find((x) => x.key === k)?.title; out.push(task({ key: `ev-${k}`, label, produces: t ? `${produces} (tick “${t}”)` : produces, href: packetHref(d, 'evidence'), support, done: ev(k) || also })); };
  const noBox = (() => { try { const b = cleanBuyBox(JSON.parse(localStorage.getItem('deedowl.buybox.v1') ?? 'null') ?? EMPTY_BUY_BOX); return !(b.area.trim() || b.types.length || b.strategy || b.priceMax || b.repairsMax || b.cashMax || b.minCashFlow || b.beds || b.dealBreakers.length || b.notes.trim()); } catch { return true; } })();
  const fit = () => out.push(task({ key: 'fit', label: noBox ? `Write your buy box (about 2 minutes), then check ${n} against it` : `Check ${n} against your buy box`, produces: 'a fits or doesn’t-fit call with the reason, in its deal packet', href: noBox ? L.buyBox.href : packetHref(d, 'plan'), support: [L.buyBox], done: !!(p.fit && p.fitWhy.trim()) && (!noBox || p.fit !== 'fits') }));
  const decide = () => out.push(task({ key: 'decide', label: `Decide on ${n}: pass, or go on to ${w === 'offer' ? 'an offer' : w === 'lien' && d.state === 'NV' ? 'the sale' : 'bidding'}`, produces: 'your decision and the reason, recorded in its evidence log', href: packetHref(d, 'decision'), support: [L.walkAway], done: log.gate === 'pass' || log.gate === 'proceed' }));
  // (Another property still open: the one My plan goes on to, the same way it picks: a passed date, then something
  // waiting, then the one in focus, else the first.)
  const findNext = () => {
    // (Only for a deal that's done: a property still open keeps its own last task. The guard stops any loop.)
    const nextOne = !findingNext && (stage === 'passed' || finishedDeal(d) || !!soldOf(d)) ? nextOpenDeal(d.id) : undefined;
    out.push(nextOne ? task({ key: 'next', label: `Go on to ${nextOne.name || 'your next property'} in My plan`, produces: 'its next task, in My plan', href: `#/toolkit?deal=analyzed:${nextOne.id}`, support: [], done: false }) : task({ key: 'next', label: d.kind === 'lien' ? 'Find your next lien sale' : 'Find your next property', produces: 'a new candidate saved in Analyze, starting at Researching', href: '#/find-deals', support: [L.findDeals, L.analyze], done: false }));
  };

  if (stage === 'researching') {
    // Once you've chosen Pass, moving it to Passed comes first, ahead of research you no longer need.
    if (log.gate === 'pass') out.push(task({ key: 'stage', label: `Mark ${n} as passed`, produces: 'the property in Passed, and your plan moved on to your next property', href: packetHref(d, 'decision'), setStage: 'passed', done: false }));
    numbers();
    if (w === 'offer') {
      area('sale', `Confirm who is selling ${n}, and what exactly is sold`, 'the listing or official notice in its evidence log, with the source and the date you checked', [L.findDeals]);
      if (d.plan === 'flip') area('exit', `Check what ${n} would sell for after repairs`, 'recent sales of similar homes nearby, saved in its evidence log', [L.analyze]);
      else if (liveIn(d)) area('income', `Compare ${n}’s monthly cost with what you pay now`, 'its loan payment, tax, insurance and any HOA dues against your rent or payment now, in its evidence log', [L.analyze]);
      else area('income', `Verify the rent for ${n}`, '3 comparable rents from leases signed nearby, saved in its evidence log', d.plan === 'rent' ? [L.analyze, L.rentMission] : [L.analyze]);
      area('insurance', `Get an insurance quote and the flood zone for ${n}`, 'a written quote for this property and its FEMA flood zone, in its evidence log', [L.pro('insurance')]);
    } else if (w === 'auction') {
      area('sale', `Confirm the sale of ${n} with the official seller`, 'the official notice in its evidence log: the sale date, the terms and exactly what is sold', [L.guides, L.findDeals]);
      area('title', `Get a title search for ${n}`, 'a title professional’s list of the recorded liens, and which ones survive this kind of sale', [L.pro('title'), L.guides]);
      area('occupancy', `Check occupancy and the lawful path to possession for ${n}`, 'what the sale notice and public records show, and the lawful steps to possession, in its evidence log', [L.guides]);
      area('insurance', `Find out whether you can insure ${n} from the day you buy`, 'a written quote or a clear answer from an insurance agent, in its evidence log', [L.pro('insurance')]);
    } else {
      area('sale', `Read the county’s lien sale terms for ${n}`, d.state === 'NV' ? 'the sale date, how buyers are chosen and how payment works, in its evidence log' : 'the sale date, the bidding rules and how payment works, in its evidence log', [L.guides]);
      area('title', `Research the parcel behind ${n}`, 'its value, other liens and anything that could leave the lien unpaid, in its evidence log', [L.guides]);
    }
    fit();
    decide();
    if (log.gate !== 'pass') out.push(task({
      key: 'stage',
      label: `Move ${n} to ${stageLabel('offer', d)}`,
      produces: w === 'offer' ? 'the offer tasks for it: your price, the earnest money and your professionals’ questions' : w === 'lien' && d.state === 'NV' ? 'the sale tasks for it: the funds the sale requires and the dates' : 'the bidding tasks for it: your maximum bid, the funds the sale requires and the dates',
      href: packetHref(d, 'decision'),
      setStage: 'offer',
      done: false,
    }));
    return out;
  }

  if (stage === 'offer') {
    numbers();
    if (w === 'offer') {
      area('terms', `Line up the money for ${n}`, 'a pre-approval letter or proof of funds, and the loan’s conditions, in its evidence log', [L.pro('lender')]);
      out.push(task({ key: 'earnest', label: `Set the earnest money you’ll offer on ${n}`, produces: 'the deposit amount in its deal packet, so the cash it needs is complete', href: packetHref(d, 'cash'), support: [L.negotiate], done: p.earnest > 0 }));
      // (A commercial building bought by offer has a commercial broker, as Your team and the packet name it.)
      const agentName = roleTitleFor(d, 'agent');
      out.push(task({ key: 'qa', label: `Ask your ${d.plan === 'commercial' ? 'broker' : 'agent'} or lender your questions about ${n}`, produces: 'their answers, with dates, in its deal packet', href: packetHref(d, 'pros'), support: [{ label: `Your team: ${agentName.toLowerCase()}`, href: '#/pros/agent' }, L.pro('lender')], done: p.qa.some((x) => x.q.trim() && x.a.trim()) }));
      out.push(task({
        key: 'offer',
        label: `Make your offer on ${n}`,
        produces: 'a signed offer with deadlines you can meet. When the seller accepts, mark it under contract and its contract deadlines appear here',
        href: ROADMAP_HREF,
        advance: { stage: 'contract', label: 'The seller accepted: mark it under contract' },
        support: [L.negotiate, L.caseStage('offer', 'Your offer')],
        done: false,
      }));
    } else {
      area('terms', `Have the funds the sale requires for ${n}`, sealedBid(d) ? 'the full payment ready to enclose with your sealed bid, in a form the county takes (a card is charged only when your bid wins, so keep it available until then), noted in its evidence log' : 'the money ready in the form the sale requires before sale day, noted in its evidence log', [L.guides]);
      out.push(task({ key: 'dates', label: `Put ${n}’s sale dates on its calendar`, produces: `${suggestedDates(d).slice(0, 3).join(', ').toLowerCase()} on one calendar, with the next one shown here`, href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(forCalendar(d, p, stage), stage) }));
      if (stage === 'offer') out.push(task({ key: 'qa', label: `Ask your title company or attorney your questions about ${n}`, produces: `their answers, with dates, in its deal packet (${w === 'lien' ? 'what the certificate gives you and how it’s paid off' : `what survives the sale, possession${d.state === 'NV' && d.kind === 'trustee' ? ', and the challenge window' : ''}`})`, href: packetHref(d, 'pros'), support: [L.pro('title'), L.pro('attorney')], done: p.qa.some((x) => x.q.trim() && x.a.trim()) }));
      const bidTask = task({
        key: 'bid',
        label: saleOver(p, now) ? (w === 'lien' && d.state === 'NV' ? `Sale day has passed for ${n}: were you picked?` : `Sale day has passed for ${n}: did you win?`) : w === 'lien' ? (d.state === 'NV' ? `Sign up for ${n} at the county’s sale` : `Bid on ${n} at the county’s sale`) : sealedBid(d) ? `Get your sealed bid for ${n}, with full payment, to the Eureka County Treasurer’s office by the notice’s deadline (usually 4 p.m. the day before the sale; the office is open Monday to Thursday except holidays, so if it’s closed that day the deadline may be earlier*)` : `Register and bid on ${n}, up to your maximum`,
        produces: saleOver(p, now) ? `your answer. If you ${w === 'lien' && d.state === 'NV' ? 'were picked, mark it and the payment step appears here' : (sealedBid(d) ? 'won (the Treasurer contacts each winning bidder by phone or mail; a tie gets further bidding instructions), mark it: the payment went in with your bid, and the recording steps appear here' : 'won, mark it and the payment and recording steps appear here')}; if the sale was postponed, clear its date and enter the new one; if not, mark it passed` : w === 'lien' && d.state === 'NV' ? 'your name in for it at the sale (buyers are picked by a drawing or a show of hands), or a clean walk-away. If you’re picked, mark it and the payment deadline appears here' : sealedBid(d) ? 'a sealed bid at or below your limit, with full payment enclosed (a card is charged at the award; if it’s declined, the parcel goes to the next highest bidder), or a clean walk-away. If you win, mark it won and the recording steps appear here' : 'a bid at or below your limit, or a clean walk-away. If you win, mark it won and the payment deadlines appear here',
        href: ROADMAP_HREF,
        advance: { stage: 'contract', label: w === 'lien' && d.state === 'NV' ? 'I was picked: mark it' : sealedBid(d) && !ticked(p, SEALED_ROW) ? 'My sealed bid went in on time and won: mark it won' : 'I won the bid: mark it won', ...(sealedBid(d) ? { ticks: [SEALED_ROW], tickWho: 'You', tickWhen: sealedDay(p) } : {}) },
        ...(saleOver(p, now) ? { advance2: { stage: 'passed' as DealStage, label: w === 'lien' && d.state === 'NV' ? 'I wasn’t picked: mark it passed' : sealedBid(d) ? (ticked(p, SEALED_ROW) ? 'My bid didn’t win: mark it passed (the county returns the enclosed payment by certified mail)' : 'My bid didn’t win, or I didn’t send one: mark it passed (the county returns any enclosed payment by certified mail)') : 'I didn’t win (or didn’t bid): mark it passed' }, postpone: POSTPONE } : {}),
        support: [L.guides, w === 'lien' && d.state === 'NV' ? L.practiceLien : L.practiceAuction],
        answer: saleOver(p, now),
        urgent: saleOver(p, now),
        done: false,
      });
      if (saleOver(p, now)) out.unshift(bidTask, task({ key: 'lost', label: w === 'lien' && d.state === 'NV' ? `Not picked for ${n}? Mark it passed` : `Didn’t win ${n}? Mark it passed`, produces: 'the deal moved to Passed, with its record kept', href: packetHref(d, 'decision'), setStage: 'passed', done: false }));
      if (!saleOver(p, now)) out.push(bidTask);
    }
    return out;
  }

  if (stage === 'contract') {
    if (w === 'offer') {
      out.push(task({ key: 'deposit-sent', label: ticked(p, 'Earnest money due') ? `Confirm escrow received the earnest money for ${n}` : `Send the earnest money for ${n} and confirm receipt`, produces: `escrow’s written confirmation that it received the deposit${tx ? ' and any option fee' : ''} your contract requires; mark it handled here`, href: stepHref('deposit'), ...(!ticked(p, 'Earnest money due') ? { tick: { label: 'I sent it: mark it handled', row: 'Earnest money due', who: 'Escrow', step: 'deposit' } } : {}), support: [L.negotiate], done: stepDone('deposit') || ticked(p, 'Earnest money due') }));
      if (d.kind === 'short') { const dl = p.dates.find((x) => sameDate(x.what, 'Lienholder approval deadline') && x.when && !x.resolved && x.when >= localDay(now))?.when; out.push(task({ key: 'short-approval', label: `Wait for the lender’s approval of the short sale for ${n}${dl ? ` (your addendum’s deadline: ${prettyDay(dl)})` : ''}`, produces: 'the lender’s approval notice: enter its date in Key dates (“Approval notice received”), and the contract’s deadlines count from it. Ask your agent before paying for inspections earlier than that*', href: packetHref(d, 'dates'), support: [L.pro('agent')], done: p.dates.some((x) => sameDate(x.what, 'Approval notice received') && !!x.when && x.when <= localDay(now)) })); }
      // (Every date in, only a name or one date missing: the task says which.)
      const calMiss = p.dates.length ? calendarRows(forCalendar(d, p, stage), stage).filter((x) => !dateRowComplete(x)) : [];
      const calName = (x: { what: string }) => x.what.replace(/\s*\([^)]*\)\s*$/, '');
      out.push(task({ key: 'dates', label: calMiss.length && calMiss.every((x) => x.when) ? `Add who handles ${calMiss.map(calName).join(', ')} for ${n}` : calMiss.length === 1 && !calMiss[0].when ? `Add the date for ${calName(calMiss[0])} for ${n}` : `Put ${n}’s contract deadlines on its calendar`, produces: 'every deadline from the signed contract on one calendar (the date rows under Key dates), with the next one shown here', href: packetHref(d, 'dates'), support: [L.negotiate], done: calendarComplete(forCalendar(d, p, stage), stage) }));
      out.push(task({ key: 'inspection-complete', label: `Inspect ${n} before the ${d.plan === 'commercial' ? 'feasibility (due-diligence) period ends' : tx ? 'option period ends' : d.state === 'UT' ? 'Due Diligence Deadline' : 'inspection period ends'}`, produces: 'the report, repair bids and written decision before the deadline; mark the inspection roadmap task done', href: stepHref('inspect'), support: d.plan === 'commercial' ? [L.pro('environmental'), L.pro('appraiser')] : [L.pro('inspector'), L.caseStage('inspection', 'The inspection')], done: stepDone('inspect') || ticked(p, 'Inspection period ends') || ticked(p, 'Option period ends') }));
      out.push(task({ key: 'final-financing', label: `Get the loan approved for ${n}, or confirm your cash`, produces: 'final lender approval with conditions satisfied, or verified available closing funds; mark the final financing roadmap task done', href: stepHref('loan-approval'), support: [L.pro('lender')], done: stepDone('loan-approval') || ticked(p, 'Loan approval deadline') }));
      out.push(task({ key: 'appraisal-complete', label: `Resolve the appraisal for ${n}`, produces: 'the appraisal and any gap resolved before the deadline, or a documented cash-purchase choice not to obtain one', href: stepHref('appraise'), support: [L.pro('appraiser')], done: stepDone('appraise') || ticked(p, 'Appraisal deadline') }));
      out.push(task({ key: 'contract-title', label: `Review the title commitment for ${n}`, produces: 'requirements and HOA restrictions reviewed within the contract period; mark the title roadmap task done', href: stepHref('title'), record: { label: 'I reviewed it: mark it done', row: { when: localDay(now), what: TITLE_REVIEWED, who: 'Me', resolved: true }, step: 'title' }, support: [L.pro('title'), L.caseStage('appraisal', 'Appraisal and title')], done: recordDone(p, TITLE_REVIEWED, stepDone('title')) }));
      out.push(task({ key: 'bound-insurance', label: `Have insurance in place for ${n} by closing`, produces: 'written coverage confirmation and its start date; mark the insurance activation roadmap task done', href: stepHref('bind-insurance'), record: { label: 'It’s in place: mark it done', row: { when: localDay(now), what: INSURED_ROW, who: 'Me', resolved: true }, step: 'bind-insurance' }, support: [L.pro('insurance')], done: recordDone(p, INSURED_ROW, stepDone('bind-insurance')) }));
      out.push(task({ key: 'final-walkthrough', label: `Do the final walkthrough of ${n}`, produces: 'agreed repairs, condition and possession checked with your agent; mark the walkthrough roadmap task done', href: stepHref('walkthrough'), record: { label: 'I did the walkthrough: mark it done', row: { when: localDay(now), what: WALKTHROUGH_ROW, who: 'Me', resolved: true }, step: 'walkthrough' }, done: recordDone(p, WALKTHROUGH_ROW, stepDone('walkthrough')) }));
      const closedTick = p.dates.some((x) => sameEvent(x.what, 'Closing') && !!x.resolved && (!x.when || x.when <= localDay(now)));
      out.push(task({ key: 'close', label: closedTick ? `The closing is marked handled: mark ${n} closed` : `Close on ${n}`, produces: closedTick ? 'the new-owner tasks here (keep the signed closing statement and the recorded deed)' : 'the signed closing statement and the deed. Then mark it closed and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: 'It closed: mark it closed' }, support: [L.caseStage('closing', 'Closing')], done: false }));
    } else {
      // California homes of 1–4 units: a trustee-sale win isn't final until the eligible-bidder windows close (Civil Code 2924m).
      const ca2924m = d.kind === 'trustee' && d.state === 'CA';
      payTask(`Pay for ${n} as the sale requires`, w === 'lien' ? 'the receipt, and the certificate you’re owed, in its evidence log' : d.state === 'NV' && d.kind === 'trustee' ? 'the receipt, and the trustee’s deed you’re owed, in its evidence log' : d.state === 'NV' && d.kind === 'taxSale' ? 'the receipt, and the Treasurer’s deed you’re owed, in its evidence log' : certificateFirst(d) ? 'the receipt, and the certificate of sale you’re owed, in its evidence log' : 'the receipt, and the deed or certificate you’re owed, in its evidence log');
      if (d.state === 'NV' && d.kind === 'taxSale') out.push(sidAffidavitTask(d, p, now, n));
      out.push(...sidTasks(d, p, now, n));
      if (d.state === 'NV' && d.kind === 'taxSale' && p.dates.some((x) => sameDate(x.what, SID_VOID_ROW))) return out;
      if (w === 'auction' && !ev('insurance')) area('insurance', `Insure ${n} right away`, certificateFirst(d) ? 'a policy that covers your interest from the day of the sale (ask your insurance agent how to insure a certificate of sale)*, in its evidence log' : 'a policy in your name from the day you own it, in its evidence log', [L.pro('insurance')]);
      if (w === 'auction' && (d.plan === 'flip' || d.plan === 'rent')) out.push(wonPrice(d as Deal, p, n));
      out.push(task({ key: 'dates', label: w === 'lien' ? `Put ${n}’s payment deadline on its calendar` : paidAtWin(d) ? `Put ${n}’s recording date on its calendar` : `Put ${n}’s payment and recording deadlines on its calendar`, produces: w === 'lien' ? 'the payment deadline and when you’ll receive the certificate, on one calendar' : paidAtWin(d) ? (certificateFirst(d) ? 'when the certificate of sale should be recorded, on one calendar (the payment is done)' : 'when the deed should be recorded, on one calendar (the payment is done)') : d.kind === 'irs' && certificateFirst(d) ? 'the payment deadline and when you’ll receive the certificate of sale, on one calendar' : ca2924m ? 'the payment deadline and when the deed should be recorded, on one calendar; for a home of 1–4 units, also the eligible-bidder windows (15 and 45 days after the sale), since your win isn’t final until they close, unless an exception applies*' : certificateFirst(d) ? 'the payment deadline and when the certificate of sale should be recorded, on one calendar' : 'the payment deadline and when the deed or certificate should be recorded, on one calendar', href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(forCalendar(d, p, stage), stage) }));
      if (w === 'auction') {
        area('title', `Have a title professional check what ${n}’s sale gives you and what still stands against it`, certificateFirst(d) ? 'what the certificate gives you, what still stands against it, and when a deed can follow, in its evidence log' : 'what the sale gives you and what still stands against it, in its evidence log', [L.pro('title')]);
      }
      // A Nevada HOA or sheriff's sale gives a certificate of sale first; the deed comes only after the redemption period
      // (60 days, NRS 116.31166; 1 year, NRS 21.210), if no one redeems.
      // The SID certificate paid in time: the Treasurer can't issue the deed until the city or county files its affidavit
      // that it was paid (NRS 361.595(6)).
      { const t = sidPaidAffidavit(d, p, now, n); if (t) out.push(t); }
      const certFirst = certificateFirst(d);
      const recordedTick = w !== 'lien' && RECORDED_ROWS.some((x) => ticked(p, x));
      out.push(task({ key: 'record', label: recordedTick ? `The ${certFirst ? 'certificate of sale' : 'deed'} for ${n} is ${certFirst && d.kind === 'irs' ? 'in hand' : 'recorded'}: mark it to go on to the next tasks` : w === 'lien' ? `Get the certificate for ${n}` : certFirst ? (d.kind === 'irs' ? `Get the certificate of sale for ${n}` : d.state === 'NV' && d.kind === 'hoa' ? `Confirm the certificate of sale for ${n} is recorded (whoever ran the sale records it, NRS 116.31166(2))` : d.state === 'NV' && d.kind === 'court' ? `Confirm the certificate of sale for ${n} is recorded (the sheriff files a copy with the county recorder, NRS 21.190)` : `Get the certificate of sale for ${n} recorded`) : d.state === 'NV' && d.kind === 'taxSale' ? `Confirm the Treasurer recorded the deed for ${n} (it records it at your cost before giving it to you, NRS 361.595(7))` : d.state === 'NV' && d.kind === 'trustee' ? `Confirm the deed for ${n} is recorded (the trustee records it within 30 days of the sale, or gives it to you to record, NRS 107.080(10))` : `Get the deed for ${n} recorded`, produces: w === 'lien' ? 'the certificate in your records. Then mark it in hand and the holding tasks appear here' : certFirst ? `the ${d.kind === 'irs' ? '' : 'recorded '}certificate of sale. The deed comes after the redemption period (${waitWord(d)} after the sale), if no one redeems. Then mark it ${d.kind === 'irs' ? 'received' : 'recorded'} (its date is set to today: change it to the date on the certificate if different) and the tasks for the wait appear here` : 'the recorded deed. Then mark it recorded (its date is set to today: change it to the recording date on the deed if different) and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: w === 'lien' ? 'I have the certificate: mark it' : certFirst ? (d.kind === 'irs' ? 'I have the certificate of sale: mark it' : 'The certificate of sale is recorded: mark it') : 'The deed is recorded: mark it', ticks: w === 'lien' ? [] : [d.kind === 'taxSale' && d.state === 'NV' ? 'Treasurer’s deed recorded' : certFirst ? (d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') : d.kind === 'trustee' ? 'Deed recorded' : 'Deed or certificate recorded', ...RECORDED_ROWS], tickWho: d.kind === 'trustee' ? 'The trustee' : d.kind === 'taxSale' ? 'The county treasurer' : d.kind === 'irs' ? 'The IRS' : d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : 'The sheriff' }, support: [L.guides], done: false }));
    }
    return out;
  }

  if (stage === 'closed') {
    // (A sale that may be void comes first, wherever the stage was moved.)
    if (d.state === 'NV' && d.kind === 'taxSale' && sidUnasked(d) && !p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && !!x.when)) out.push(sidAffidavitTask(d, p, now, n));
    if (d.state === 'NV' && d.kind === 'taxSale') { const t = sidPaidAffidavit(d, p, now, n); if (t && !t.done) out.push(t); }
    if (d.state === 'NV' && d.kind === 'taxSale') { const due = sidPayDue(p, now); if (due) out.push(task({ key: 'sid-pay', label: `Pay the special improvement district (SID) certificate for ${n} by ${prettyDay(due.dl)}, or the sale is void (NRS 361.595(6))`, produces: 'the payment to the city or county, with its receipt, and its affidavit sent to the Treasurer', href: packetHref(d, 'dates'), tick: { label: 'I paid it: mark it handled', row: due.row, setWhen: localDay(now) }, support: [], done: false })); }
    if (d.state === 'NV' && d.kind === 'taxSale') { const st = sidTasks(d, p, now, n).filter((t) => !t.done); if (st.length) { out.push(...st); return out; } }
    if (w === 'lien') {
      if (d.state === 'NV' && redeemedIn(p)) { out.push(lienPayoff(d, p)); return out; }
      out.push(task({ key: 'track', label: `Start tracking ${n}`, produces: d.state === 'NV' ? 'its payoff date and interest on one record, plus any later taxes you paid and the written notice of them you gave the Treasurer (without that notice, they aren’t repaid: NRS 271.595(1))' : 'its payoff date, interest and any later taxes on one record', href: stepHref('c-hold'), support: [L.guides], ...(d.state === 'NV' ? { advance2: lienPaidButton(d, stage) } : {}), done: stepDone('c-hold') }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the holding tasks: payoffs, interest and what to do if it’s never paid', href: ROADMAP_HREF, setStage: 'owned', done: false }));
      return out;
    }
    // It was redeemed: collect the payoff (your price plus what the law adds), then it's finished.
    if (certificateFirst(d) && redeemedIn(p)) {
      out.push(task({ key: 'payoff', label: `Collect the redemption money for ${n}`, produces: `the payoff (${d.state === 'NV' && d.kind === 'hoa' ? 'your price plus 1% a month, plus the taxes, assessments, payments on earlier liens (with interest) and needed upkeep you paid: have your receipts ready' : d.state === 'NV' && d.kind === 'court' ? 'your price plus 1% a month, plus the taxes, assessments and payments on earlier liens you paid, with interest, minus any rent you collected, or were entitled to collect, during the wait (NRS 21.210, 21.250): have your receipts ready' : 'your price plus what the law adds'}) and a receipt. ${d.kind === 'court' ? 'The person who redeemed pays you, or pays the sheriff, who then pays you (NRS 21.230): ask the sheriff’s civil office whether it holds the money.' : d.kind === 'irs' ? 'The person who redeemed pays you; only if you can’t be found in the county is it paid to the IRS for you (26 U.S.C. 6337(b)(2)).' : 'The person who redeemed pays you (NRS 116.31166(3)). If the former owner redeemed, you sign a certificate of redemption for them, which is then recorded (116.31166(5)); if a lender redeemed, whoever ran the sale gives it a deed (116.31166(6)). Ask your attorney which applies.'} Then mark it finished`, href: packetHref(d, 'dates'), tick: { label: `I was repaid for ${n}: mark it finished`, row: REDEEMED_ROW, then: 'passed' }, undo: { label: 'Not redeemed after all? Undo', removeRow: REDEEMED_ROW, ...(!p.dates.some((x) => RECORDED_ROWS.some((r) => sameDate(x.what, r)) && !!x.resolved) ? { then: 'contract' as DealStage } : {}) }, answer: true, support: [L.pro('attorney')], done: ticked(p, REDEEMED_ROW) }));
      return out;
    }
    // A certificate first: insure it on day one, then the wait, then the deed (each done from the packet's dates).
    const firstWeek = task({ key: 'first-week', label: certificateFirst(d) && ticked(p, 'Redemption period ends') ? `Secure and insure ${n}` : `Your first week with ${n}`, produces: certificateFirst(d) && !deedInHand(d) ? `insurance in your name and a dated record of its condition; locks, utilities and possession as your attorney advises ${ticked(p, 'Redemption period ends') ? 'until the deed is delivered' : 'while the redemption period runs'}*` : 'insurance in your name, a dated record of its condition, and, once you lawfully have possession of a vacant home, locks changed and utilities in your name', href: stepHref('first-week'), support: d.plan === 'flip' ? [L.caseStage('after', 'Your first weeks')] : [L.afterClosing, L.caseStage('after', 'Your first weeks')], done: stepDone('first-week') });
    // Once no one redeemed, the deed comes first (the answer said "ask for the deed").
    const deedFirst = certificateFirst(d) && (ticked(p, 'Redemption period ends') || ticked(p, DEED_AFTER_WAIT));
    // During the redemption wait, someone can redeem any day: that answer rides on whichever task leads.
    const waiting = certificateFirst(d) && !deedFirst && !redeemedIn(p);
    const withRedeem = (t: PlanTask): PlanTask => (waiting && !t.advance2 ? { ...t, advance2: redeemButton(d, redeemLabel(d, p, now)) } : t);
    if (!deedFirst) out.push(withRedeem(firstWeek));
    const wonLater = w === 'auction' && (d.plan === 'flip' || d.plan === 'rent') ? wonPrice(d as Deal, p, n) : undefined;
    const won = wonLater && !wonLater.done && !bidTyped(d as Deal) ? wonLater : undefined;
    if (won && !deedFirst) out.push(withRedeem(won));
    const nvTrustee = d.state === 'NV' && d.kind === 'trustee';
    const nvTax = d.state === 'NV' && d.kind === 'taxSale';
    const redemptionDone = certificateFirst(d) && ticked(p, 'Redemption period ends');
    const beforeRemodel = task({ key: 'before-remodel', label: d.state === 'NV' && d.kind === 'trustee' ? `Check possession and title insurance for ${n} before you remodel` : redemptionDone ? `Check possession and title for ${n} before you remodel` : `Check redemption, possession and title for ${n} before you remodel`, produces: d.state === 'NV' && d.kind === 'trustee' ? 'a written answer on lawful possession and when title insurance is available (there’s no owner buy-back after a Nevada trustee’s sale)' : redemptionDone ? 'a written answer on lawful possession and title insurance' : 'a written answer on any redemption period, lawful possession and title insurance', href: stepHref('a-before-remodel'), support: [L.guides], done: stepDone('a-before-remodel') });
    if (w === 'auction' && !nvTrustee && !nvTax && !deedFirst) out.push(withRedeem(beforeRemodel));
    // The redemption wait comes first: the end date on its calendar, the property insured and kept up, no remodeling.
    if (certificateFirst(d)) {
      out.push(task({ key: 'redemption-wait', label: !ticked(p, 'Redemption period ends') && redemptionEnd(d, p) ? `Wait out ${n}’s redemption period (ends ${prettyDay(redemptionEnd(d, p))}, ${waitWord(d)} after the sale; confirm with whoever ran the sale)` : ticked(p, 'Redemption period ends') && !handled(p, 'Redemption period ends', now) ? `${n}’s redemption period ends ${prettyDay(p.dates.find((x) => sameDate(x.what, 'Redemption period ends'))?.when ?? '') || 'soon'}: it counts once that day has passed, then the deed comes` : `Wait out ${n}’s redemption period (${waitWord(d)} after the sale)`, produces: `the end date on its calendar, the property insured and maintained, ${d.kind === 'court' ? 'receipts for the taxes, assessments and earlier liens you pay (a redemption repays those, not upkeep)' : d.kind === 'irs' ? 'your records of what you pay (a redemption repays your price plus 20% a year, compounded daily (26 U.S.C. 6337(b), 6622), not taxes or upkeep)' : 'receipts for the taxes, assessments, payments on earlier liens and needed upkeep you pay'}, and know that remodeling before it ends puts that money at risk if someone redeems. Once it has passed, mark “Redemption period ends” handled in its dates`, href: packetHref(d, 'dates'), advance2: redeemButton(d), support: [L.pro('attorney')], done: handled(p, 'Redemption period ends', now) || ticked(p, DEED_AFTER_WAIT) }));
      out.push(task({ key: 'deed', label: ticked(p, 'Redemption period ends') ? `Get the deed for ${n} and record it` : `Get the deed for ${n} and record it, if no one redeemed`, produces: `the deed from ${d.kind === 'hoa' ? 'whoever conducted the sale' : d.kind === 'irs' ? 'the IRS, for your certificate of sale' : 'the sheriff'}, recorded, then mark “${DEED_AFTER_WAIT}” handled in its dates (its date is set to today: change it to the recording date on the deed if different)${ticked(p, 'Redemption period ends') ? '' : '. If it was redeemed instead, you’re repaid your price plus what the law adds: press “It was redeemed” to collect the payoff'}`, href: packetHref(d, 'dates'), tick: { label: 'I have the deed, and it’s recorded: mark it handled', row: DEED_AFTER_WAIT, who: deedWho(d) }, ...(ticked(p, 'Redemption period ends') ? {} : { advance2: redeemButton(d) }), support: [L.pro('title')], done: ticked(p, DEED_AFTER_WAIT) }));
      if (deedFirst) out.push({ ...firstWeek, label: `Secure and insure ${n}` });
      if (deedFirst && w === 'auction' && !nvTrustee && !nvTax) out.push(beforeRemodel);
      if (won && deedFirst) out.push(won);
    }
    // Nevada: a trustee's sale can be challenged for 30 days after the deed is recorded (NRS 107.080(5)), a tax sale's
    // land recovered by a suit within 2 years after the Treasurer's deed (NRS 361.600): their end on the calendar first.
    const win = d.state === 'NV' && d.kind === 'trustee' ? { row: 'Challenge window ends', base: 'Deed recorded', days: 30 } : d.state === 'NV' && d.kind === 'taxSale' ? { row: 'Recovery-suit window ends', base: 'Treasurer’s deed recorded', days: 0 } : null;
    const plusDays = (from: string | undefined, days: number) => (from ? (() => { const t = new Date(`${from}T12:00:00`); t.setDate(t.getDate() + days); return localDay(t); })() : '');
    // A Nevada trustee's sale: the work waits for the challenge window (until its row is ticked).
    const windowOpen = d.state === 'NV' && d.kind === 'trustee' && !p.dates.some((x) => sameDate(x.what, 'Challenge window ends') && x.resolved);
    const windowEnd = p.dates.find((x) => sameDate(x.what, 'Challenge window ends') && x.when)?.when || plusDays(p.dates.find((x) => sameDate(x.what, 'Deed recorded') && x.when)?.when, 30);
    const late90 = plusDays(p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when, 90);
    const windowWords = windowEnd ? ` (${prettyDay(windowEnd)}${late90 && late90 > windowEnd ? `, or ${prettyDay(late90)} if anyone wasn’t properly notified; ask your title company` : ''})` : '';
    if (win) {
      const baseDate = p.dates.find((x) => sameDate(x.what, win.base) && x.when)?.when;
      const end = win.days ? plusDays(baseDate, win.days) : '';
      const late = win.days ? plusDays(p.dates.find((x) => sameDate(x.what, 'Sale day') && x.when)?.when, 90) : '';
      out.push(task({ key: 'window', label: win.days ? `Put the challenge window’s end on ${n}’s calendar` : `Put the recovery-suit window’s end on ${n}’s calendar`, produces: win.days ? `the date the challenge window ends, in its Key dates: 30 days after the trustee’s deed was recorded${end ? ` (${prettyDay(end)})` : ''}, or 90 days after the sale${late ? ` (${prettyDay(late)})` : ''} if anyone didn’t get proper notice (NRS 107.080(5), (6)). Ask your title company which applies, and plan repairs and new contracts for after it, as your attorney advises` : `its end date in its dates (2 years after the Treasurer’s deed was delivered to you, NRS 361.600${baseDate ? `; about ${prettyDay((() => { const t = new Date(`${baseDate}T12:00:00`); const m = t.getMonth(); t.setFullYear(t.getFullYear() + 2); if (t.getMonth() !== m) t.setDate(0); return localDay(t); })())} if it was delivered the day it was recorded, ${prettyDay(baseDate)}*` : ''}), and a title company’s answer on when it will insure`, href: packetHref(d, 'dates'), support: [L.pro('title')], done: p.dates.some((x) => sameDate(x.what, win.row) && (!!x.when || !!x.resolved)) }));
    }
    if (nvTax) out.push(task({ key: 'before-remodel', label: `Check the recovery-suit window, possession and title for ${n} before you remodel`, produces: 'a written answer on the 2-year recovery-suit window (no owner buy-back after a Nevada tax sale, NRS 361.600), lawful possession and when a title company will insure', href: stepHref('a-before-remodel'), support: [L.guides, L.pro('title')], done: stepDone('a-before-remodel') }));
    if (nvTrustee) out.push(task({ key: 'before-remodel', label: d.state === 'NV' && d.kind === 'trustee' ? `Check possession and title insurance for ${n} before you remodel` : `Check redemption, possession and title for ${n} before you remodel`, produces: d.state === 'NV' && d.kind === 'trustee' ? 'a written answer on lawful possession and when title insurance is available (there’s no owner buy-back after a Nevada trustee’s sale)' : 'a written answer on any redemption period, lawful possession and title insurance', href: stepHref('a-before-remodel'), support: [L.guides], done: stepDone('a-before-remodel') }));
    if (d.plan === 'flip') {
      // A flip gets the work and the sale, not rental tasks.
      out.push(task({ key: 'repairs', label: certificateFirst(d) && !deedInHand(d) ? `Get repair bids for ${n}, and start the work once you have the deed` : windowOpen && stepDone('repairs') ? `Repairs are marked done for ${n}: this finishes once the challenge window is handled${windowWords}` : windowOpen ? `Get repair bids for ${n} now; start the work after the challenge window ends${windowWords}` : `Get repair bids for ${n} and start the work`, produces: 'written bids, permits where needed, and the work done and checked', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') && !windowOpen }));
      out.push(task({ key: 'owned', label: `Track ${n}’s repair and holding costs against your budget`, produces: flipBudget(d) ? 'a monthly record of what you pay (with $0 rent), shown against the budget in your Fix and flip numbers (repairs, holding and any loan interest and points)' : 'a monthly record of what you pay (with $0 rent), to compare yourself with the repairs and holding costs under Fix and flip in Analyze', href: packetHref(d, 'owned'), done: !!owned[d.id]?.months.length }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the selling tasks: list it at a price backed by sold comps, and record the sale', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
      return out;
    }
    if (liveIn(d)) {
      out.push(task({ key: 'rental-repairs', label: `Finish the repairs ${n} needs`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') }));
      out.push(task({ key: 'owned', label: `Start tracking ${n}’s real costs`, produces: 'a monthly record of what your home actually costs, against what you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
      out.push(task({ key: 'stage', label: `Mark ${n} as your home`, produces: 'the monthly tasks: record your costs, and review them against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
      return out;
    }
    out.push(task({ key: 'rental-repairs', label: certificateFirst(d) && !deedInHand(d) ? `Once you have the deed, finish the repairs ${n} needs before renting` : windowOpen && stepDone('repairs') ? `Repairs are marked done for ${n}: this finishes once the challenge window is handled${windowWords}` : windowOpen ? `Once the challenge window ends${windowWords}, finish the repairs ${n} needs before renting` : `Finish the repairs ${n} needs before renting`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') && !windowOpen }));
    out.push(task({ key: 'rental-lease', label: `Rent ${n} lawfully, or confirm its existing tenancy`, produces: 'screening, disclosures, a lawful lease and tenant records reviewed with your team; mark the rental roadmap task done', href: stepHref('rent'), support: [L.afterClosing], done: stepDone('rent') }));
    out.push(task({ key: 'owned', label: `Start tracking ${n}’s real rent and costs`, produces: 'a monthly record of actual rent and costs, against the cash flow you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
    out.push(task({ key: 'stage', label: `Mark ${n} as owned and operating`, produces: 'the monthly tasks: record the rent and costs, and review it against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
    return out;
  }

  if (stage === 'owned') {
    // (A certificate-first deal moved here before the deed: the wait and the deed still come first.)
    if (wayOf(d) !== 'lien' && certificateFirst(d) && !deedInHand(d) && !redeemedIn(p) && !owned[d.id]?.sold) { const cl = stageTasks(d, 'closed', p, now).filter((t) => !t.done && (t.key === 'redemption-wait' || t.key === 'deed')); const cn = dealNextTask(d, p, now, 'closed'); const ask = cn.key === 'date' && /redeem|redemption/i.test(cn.label) && !cl.some((t) => t.key === cn.key) ? [cn] : []; if (cl.length || ask.length) { out.push(...ask, ...cl.filter((t) => !(ask.length && t.key === 'redemption-wait'))); return out; } }
    if (d.state === 'NV' && d.kind === 'taxSale' && sidUnasked(d) && !p.dates.some((x) => sameDate(x.what, 'SID certificate payoff') && !!x.when)) out.push(sidAffidavitTask(d, p, now, n));
    if (d.state === 'NV' && d.kind === 'taxSale') { const t = sidPaidAffidavit(d, p, now, n); if (t && !t.done) out.push(t); }
    if (d.state === 'NV' && d.kind === 'taxSale') { const due = sidPayDue(p, now); if (due) out.push(task({ key: 'sid-pay', label: `Pay the special improvement district (SID) certificate for ${n} by ${prettyDay(due.dl)}, or the sale is void (NRS 361.595(6))`, produces: 'the payment to the city or county, with its receipt, and its affidavit sent to the Treasurer', href: packetHref(d, 'dates'), tick: { label: 'I paid it: mark it handled', row: due.row, setWhen: localDay(now) }, support: [], done: false })); }
    if (d.state === 'NV' && d.kind === 'taxSale') { const st = sidTasks(d, p, now, n).filter((t) => !t.done); if (st.length) { out.push(...st); return out; } }
    // (A certificate-first deal moved here before its deed: once the deed comes, the first week and the
    // before-remodel check still come first, as at Deed recorded.)
    if (wayOf(d) !== 'lien' && certificateFirst(d) && !owned[d.id]?.sold) { const safe = stageTasks(d, 'closed', p, now).filter((t) => !t.done && (t.key === 'first-week' || t.key === 'before-remodel')); out.push(...safe); }
    // (A Nevada tax-sale or trustee deal moved here with its window or before-remodel check open: those still come
    // first. A Nevada trustee flip's window is handled below.)
    if (d.state === 'NV' && (d.kind === 'taxSale' || (d.kind === 'trustee' && d.plan !== 'flip')) && !owned[d.id]?.sold) { const safe = stageTasks(d, 'closed', p, now).filter((t) => !t.done && (t.key === 'window' || t.key === 'before-remodel')); out.push(...safe); }
    // (The first finished month not recorded, as the tracker opens on it.)
    const open = (() => { const o = owned[d.id]; const b = o?.boughtOn?.slice(0, 7); if (!o || !b) return ''; const t = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lm = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; for (let [y, m] = firstFullMonth(o), i = 0; i < 1200; i++) { const k = `${y}-${String(m).padStart(2, '0')}`; if (k > lm) return ''; if (!o.months.some((x) => x.month === k)) return k === lm ? '' : k; m += 1; if (m > 12) { m = 1; y += 1; } } return ''; })();
    const openWord = open ? new Date(`${open}-15T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    if (w === 'lien') {
      if (d.state === 'NV' && redeemedIn(p)) { out.push(lienPayoff(d, p)); return out; }
      out.push(task({ key: 'hold', label: `Track ${n}’s payoff, interest and later taxes`, produces: d.state === 'NV' ? 'an up-to-date record of what you’re owed, with the written notice you gave the Treasurer for any later taxes you paid (without it, they aren’t repaid: NRS 271.595(1))' : 'an up-to-date record of what you’re owed', href: stepHref('c-hold'), support: [L.guides], ...(d.state === 'NV' ? { advance2: lienPaidButton(d, stage) } : {}), done: stepDone('c-hold') }));
      out.push(task({ key: 'decide-unpaid', label: `Decide what to do if ${n} is never paid`, produces: 'a dated plan, with your attorney, for an unpaid lien', href: stepHref('c-decide'), support: [L.pro('attorney')], done: stepDone('c-decide') }));
    } else if (d.plan === 'flip') {
      // (A Nevada trustee buy: the challenge window comes before repairs and a resale, as at Deed recorded.)
      if (d.state === 'NV' && d.kind === 'trustee' && !owned[d.id]?.sold && !p.dates.some((x) => sameDate(x.what, 'Challenge window ends') && x.resolved)) { const cn = dealNextTask(d, p, now, 'closed'); const w0 = cn.key === 'date' && /challenge window|90-day/i.test(cn.label) ? cn : stageTasks(d, 'closed', p, now).find((t) => t.key === 'window' && !t.done); const endRow = p.dates.find((x) => sameDate(x.what, 'Challenge window ends') && x.when && !x.resolved); if (w0) out.push(w0); else if (endRow && endRow.when > localDay(now)) out.push(task({ key: 'window-wait', label: `Before you spend on repairs or sign a sale for ${n}, ask your title company whether a challenge was filed; the window ends ${prettyDay(endRow.when)}${sale90(p) > endRow.when ? `, or ${prettyDay(sale90(p))} for anyone not properly notified` : ''} (NRS 107.080(5)–(6))`, produces: 'the title company’s answer, in its deal packet. Many buyers wait until the window ends; whether to start sooner depends on your situation and risk tolerance, so ask your attorney*', href: packetHref(d, 'dates'), support: [L.pro('title')], done: false })); }
      // (No tracker started yet: the months since the purchase come before a listing.)
      if (!owned[d.id]) { const tr = stageTasks(d, 'closed', p, now).find((t) => t.key === 'owned' && !t.done); if (tr) out.push(tr); }
      // (A finished month not recorded yet: record it before the sale, so the profit counts it.)
      // (Last month too, once it's over: a flipper who records each month is asked for the latest one.)
      const lastKey = (() => { const t = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; })();
      const fo = owned[d.id];
      const lastOpen = !openWord && !!fo?.boughtOn && !fo.sold && `${firstFullMonth(fo)[0]}-${String(firstFullMonth(fo)[1]).padStart(2, '0')}` <= lastKey && !fo.months.some((m) => m.month === lastKey);
      if (lastOpen) out.push(task({ key: 'month', label: `Record last month’s costs for ${n}`, produces: 'what you paid that month for repairs and holding, so the sale’s profit counts it', href: packetHref(d, 'owned'), support: [], done: false }));
      if (openWord && !owned[d.id]?.sold) out.push(task({ key: 'month', label: `Record ${openWord}’s costs for ${n} (the first month not yet recorded)`, produces: 'what you paid that month for repairs and holding, so the sale’s profit counts it', href: packetHref(d, 'owned'), support: [], done: false }));
      out.push(task({ key: 'list', label: `List ${n} for sale at a price backed by sold comps`, produces: 'recent sales of similar homes nearby and a net sheet (price, commission, closing costs, loan payoff and tax), then the listing', href: stepHref('exit-sell'), support: [L.pro('agent'), L.pro('cpa')], done: stepDone('exit-sell') || !!owned[d.id]?.sold }));
      out.push(task({ key: 'sold', label: `Record ${n}’s sale and your actual profit`, produces: 'the closing date and sale price recorded in its deal packet, and a rough profit against the one you planned', href: packetHref(d, 'owned'), support: [L.pro('cpa')], done: !!owned[d.id]?.sold }));
    } else {
      const month = lastMonth(now);
      // Bought this month or last: the first full month has to end first.
      const bought = owned[d.id]?.boughtOn ?? p.dates.find((x) => (sameEvent(x.what, 'Closing') || (x.resolved && (RECORDED_ROWS.some((r) => sameDate(x.what, r)) || sameDate(x.what, DEED_AFTER_WAIT)))) && x.when && x.when <= localDay(now))?.when ?? '';
      const firstEnd = /^\d{4}-\d{2}-\d{2}$/.test(bought) ? (() => { const [y, m, day] = bought.split('-').map(Number); const t = new Date(y, m - 1 + (day > 1 ? 2 : 1), 0); return localDay(t); })() : '';
      if (firstEnd && localDay(now) <= firstEnd && !owned[d.id]?.months.length) out.push(task({ key: 'month', label: `${n}’s first full month ends ${prettyDay(firstEnd)}: then record ${liveIn(d) ? 'what it cost' : 'its rent and costs'}`, produces: liveIn(d) ? 'what your home actually cost that month, against what you planned' : 'its actual cash flow for the month, against what you planned', href: packetHref(d, 'owned'), support: [L.caseStage('run', 'Run it and review')], done: false }));
      if (!(firstEnd && localDay(now) <= firstEnd && !owned[d.id]?.months.length)) out.push(task({ key: 'month', label: openWord ? `Record ${openWord}’s ${liveIn(d) ? 'costs' : 'rent and costs'} for ${n} (the first month not yet recorded)` : liveIn(d) ? `Record last month’s costs for ${n}` : `Record last month’s rent and costs for ${n}`, produces: liveIn(d) ? `what your home actually cost ${openWord ? 'that month' : 'last month'}, against what you planned` : 'its actual cash flow for the month, against what you planned', href: packetHref(d, 'owned'), support: [L.caseStage('run', 'Run it and review')], done: !!owned[d.id]?.months.some((m) => m.month >= month) && !openWord }));
      out.push(task({ key: 'review', label: `Review ${n} against your goal`, produces: 'a written decision: keep it as it is, improve it, refinance or sell', href: stepHref('review'), support: [L.pro('cpa')], done: stepDone('review') }));
    }
    findNext();
    return out;
  }

  if (stage === 'passed' && wayOf(d) === 'offer' && (per.done.includes('deposit') || p.dates.some((x) => (sameEvent(x.what, 'Earnest money due') || sameDate(x.what, 'Earnest money')) && !!x.resolved))) out.push(task({ key: 'deposit-back', label: `Get your earnest money back for ${n}`, produces: 'escrow’s written release of your earnest money under the contract’s cancellation terms*, kept with its records. Ask your agent or attorney if the seller disputes it', href: packetHref(d, 'dates'), tick: { label: 'I got it back: mark it handled', row: EARNEST_BACK, who: 'Escrow' }, support: [L.pro('attorney')], done: p.dates.some((x) => sameDate(x.what, EARNEST_BACK) && !!x.resolved) }));
  findNext();
  return out;
}

/**
 * The one thing to do next on a deal: a deadline within a week, an open question or a professional's answer you're
 * waiting for comes first; then the first unfinished task of its stage.
 */
export function dealNextTask(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date(), stage: DealStage = stageOf(d)): PlanTask {
  p = fillSealedDay(d, p);
  const t = nextTaskFor(d, p, now, stage);
  // A certificate-first win, paid: the redemption period is running, so someone can redeem any day.
  return stage === 'contract' && certificateFirst(d) && paidIn(p, d) && !redeemedIn(p) && !ticked(p, 'Redemption period ends') && !t.advance2 && !t.done ? { ...t, advance2: redeemButton(d, redeemLabel(d, p, now)) } : t;
}
function nextTaskFor(d: Deal, p: PacketData, now: Date, stage: DealStage): PlanTask {
  // A certificate-first win left at Won, paid, after its redemption period ended: whether anyone redeemed comes first,
  // as at Certificate of sale recorded.
  if (stage === 'contract' && wayOf(d) !== 'offer' && certificateFirst(d) && paidIn(p, d) && !redeemedIn(p)) {
    if (ticked(p, DEED_AFTER_WAIT)) { const next = stageLabel('closed', d); return task({ key: 'move-closed', label: `You have the deed for ${d.name || 'this property'}: move it to “${next}”`, produces: 'the owner tasks: securing and insuring it, then its costs', href: packetHref(d, 'dates'), advance: { stage: 'closed', label: `Move it to “${next}”` }, support: [], done: false }); }
    const e = p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when || redemptionEnd(d, p);
    // (Ended, or answered: the rest happens at the next stage, so the step is to move it there.)
    if (ticked(p, 'Redemption period ends') || (e && e < localDay(now))) { const n = d.name || 'this property'; const next = stageLabel('closed', d); const certRow = d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded'; const hasCert = ticked(p, certRow); const once = hasCert ? '' : 'once you have the certificate of sale, '; return task({ key: 'move-closed', label: ticked(p, 'Redemption period ends') ? `No one redeemed ${n}: ${once}move it to “${next}” for the deed` : `The redemption period for ${n} ended ${prettyDay(e)}: ${once}move it to “${next}” to answer whether anyone redeemed`, produces: `the next steps there: ${ticked(p, 'Redemption period ends') ? 'the deed' : 'whether anyone redeemed, then the deed'}${hasCert ? '' : ` (“${certRow}” is dated today: change it to the date on the certificate if different)`}`, href: packetHref(d, 'dates'), advance: { stage: 'closed', label: hasCert ? `Move it to “${next}”` : `I have the certificate: move it to “${next}”`, ticks: hasCert ? [] : [certRow] }, support: [], done: false }); }
  }
  if (stage !== 'passed') {
    // Sale day has passed with the deal still before the sale: whether you won comes first.
    if (stage === 'offer' && wayOf(d) !== 'offer' && saleOver(p, now)) {
      const t = stageTasks(d, stage, p, now).find((x) => x.key === 'bid');
      if (t) return t;
    }
    // A postponed sale: the new date first (its old registration and payment dates were cleared with it).
    if ((stage === 'researching' || stage === 'offer') && wayOf(d) !== 'offer' && p.postponedSale && p.dates.some((x) => sameDate(x.what, 'Sale day') && !x.when && !x.resolved)) {
      const n = d.name || 'this property';
      if (sealedBid(d)) return task({ key: 'date', label: `Enter the new sale date for ${n}, and ask the Eureka County Treasurer whether a sealed bid you already sent stands or must be sent again, and how its payment comes back*`, produces: 'the new date in Key dates, then the new sealed-bid deadline from the notice (usually 4 p.m. the day before the new sale date; the office is open Monday to Thursday except holidays, so if it’s closed that day the deadline may be earlier*)', href: packetHref(d, 'dates'), urgent: true, support: [], done: false });
      return task({ key: 'date', label: `Enter the new sale date for ${n} (${d.state === 'NV' && d.kind === 'trustee' ? 'the trustee announces it at the sale, same time and place, or after three postponements in a new notice; NRS 107.082' : 'whoever runs the sale announces it'})`, produces: 'the new date in Key dates, then the registration and payment deadlines for that date', href: packetHref(d, 'dates'), urgent: true, support: [], done: false });
    }
    // Still researching when the sale went by: did you bid and win? (Never "overdue: sale day".)
    if (stage === 'researching' && wayOf(d) !== 'offer' && saleOver(p, now)) {
      const n = d.name || 'this property';
      const picked = wayOf(d) === 'lien' && d.state === 'NV';
      return task({ key: 'bid', label: picked ? `Sale day has passed for ${n}: were you picked?` : `Sale day has passed for ${n}: did you win?`, produces: picked ? 'your answer. If you were picked, mark it and the payment step appears here; if the sale was postponed, clear its date and enter the new one; if not, mark it passed' : `your answer. If you won, mark it and the ${sealedBid(d) ? 'recording steps (the payment went in with your bid; the Treasurer contacts each winning bidder by phone or mail)' : 'payment and recording steps'} appear here; if the sale was postponed, clear its date and enter the new one; if not, mark it passed`, href: packetHref(d, 'decision'), advance: { stage: 'contract', label: picked ? 'I was picked: mark it' : sealedBid(d) && !ticked(p, SEALED_ROW) ? 'My sealed bid went in on time and won: mark it won' : 'I won the bid: mark it won', ...(sealedBid(d) ? { ticks: [SEALED_ROW], tickWho: 'You', tickWhen: sealedDay(p) } : {}) }, advance2: { stage: 'passed', label: picked ? 'I wasn’t picked: mark it passed' : sealedBid(d) ? (ticked(p, SEALED_ROW) ? 'My bid didn’t win: mark it passed (the county returns the enclosed payment by certified mail)' : 'My bid didn’t win, or I didn’t send one: mark it passed (the county returns any enclosed payment by certified mail)') : 'I didn’t win (or didn’t bid): mark it passed' }, postpone: POSTPONE, answer: true, urgent: true, support: [], done: false });
    }
    // An offer's closing marked handled: "It closed" comes before any earlier contract date.
    if (stage === 'contract' && wayOf(d) === 'offer' && closingDoneIn(p, now)) { const c = stageTasks(d, stage, p, now).find((x) => x.key === 'close'); if (c) return { ...c, produces: `${c.produces}. Mark the earlier dates handled for your records` }; }
    // Before you've won, a date that only matters after the sale isn't a reminder yet; a sale day that has passed isn't
    // a reminder at all; and once the deed is in hand, the redemption period is behind you.
    const early = stage === 'researching' || stage === 'offer';
    // (On or after sale day, the sale day leads: registration is behind it.)
    const saleNow = early && p.dates.some((x) => sameDate(x.what, 'Sale day') && x.when && x.when <= localDay(now));
    let nd = nextDate(remindable(capSid(p, d), now, early, [...behindStage(d, stage), ...notYet(d, stage, p, now), TITLE_REVIEWED, INSURED_ROW, WALKTHROUGH_ROW, SID_AFFIDAVIT_SENT, ...(saleNow ? ['Bidder registration', 'Registration', SEALED_ROW] : [])]), now);
    nd = contingencyFirst(nd, p, now, stage, d.kind);
    // A Nevada tax sale whose SID payoff came after the 20 days: whether the sale stands (or the refund) comes first.
    const sidOpen = ['contract', 'closed', 'owned'].includes(stage) && d.state === 'NV' && d.kind === 'taxSale' ? sidTasks(d, p, now, d.name || 'this property').find((t) => !t.done) : undefined;
    if (sidOpen) return sidOpen;
    // (Preparing to bid, with the sale days away: that stage's own tasks lead; Key dates keeps the countdown.)
    const bidPrep = (stage === 'offer' || stage === 'researching') && wayOf(d) !== 'offer' && nd && nd.days > 0 && sameEvent(nd.what, 'Sale day') && stageTasks(d, stage, p, now).some((t) => !t.done && t.key !== 'dates' && t.key !== 'stage');
    // (A sealed bid already sent: it can't be changed, so the countdown is only to the sale and how winners are told.)
    if (bidPrep && nd && sealedBid(d) && ticked(p, SEALED_ROW)) return task({ key: 'date', days: nd.days, label: `Your sealed bid for ${d.name || 'this property'} is in. The sale is ${nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`} (${prettyDay(nd.when)}): the Treasurer contacts each winning bidder by phone or mail`, produces: 'the Treasurer’s answer; then mark it won or passed in its deal packet', href: packetHref(d, 'dates'), support: [], done: false });
    if (bidPrep && nd && nd.days <= 7) { const t0 = stageTasks(d, stage, p, now).find((t) => !t.done && t.key !== 'dates' && t.key !== 'stage'); if (t0) return { ...t0, label: `The sale is ${nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`}: ${t0.label.charAt(0).toLowerCase()}${t0.label.slice(1)}${sealedOff(d) ? `${/[.?!]$/.test(t0.label) ? '' : '.'}${sealedOff(d)}` : ''}` }; }
    // (Under contract, the closing a week or less away: the title commitment, insurance and walkthrough still open lead,
    // one at a time, before "It closed".)
    // (A short sale's closing a week or less away with no approval notice yet: it can't close without the lender's yes.)
    if (nd && stage === 'contract' && d.kind === 'short' && sameEvent(nd.what, 'Closing') && nd.days <= 7 && !p.dates.some((x) => sameDate(x.what, 'Approval notice received') && !!x.when && x.when <= localDay(now))) {
      const n = d.name || 'this property';
      // (The date already passed: what happened is the question, with an answer for each.)
      if (nd.days < 0) return task({ key: 'short-wait', days: nd.days, urgent: true, answer: true, label: `The closing date (${prettyDay(nd.when)}) has passed without the lender’s approval for ${n}: ask your agent and escrow, in writing, for a new closing date or whether to cancel under the short sale addendum*. A new date? Type it on the Closing row in Key dates.`, produces: 'a written answer on the closing date, noted in its deal packet', href: packetHref(d, 'dates'), record: { label: 'The approval came: record it (fix its date in Key dates if it came earlier)', row: { when: localDay(now), what: 'Approval notice received', who: 'The lender', resolved: true } }, advance2: { stage: 'passed', label: 'We cancelled: mark it passed' }, support: [L.pro('attorney')], done: false });
      return task({ key: 'short-wait', days: nd.days, urgent: nd.days <= 1, label: `Closing is set for ${prettyDay(nd.when)}, but the lender hasn’t approved the short sale for ${n} yet: ask your agent and escrow whether the closing date must move, and get any extension in writing`, produces: 'a written answer on the closing date (or an extension), noted in its deal packet. When the approval comes, enter its date under Key dates', href: packetHref(d, 'dates'), support: [L.pro('attorney')], done: false });
    }
    if (nd && stage === 'contract' && wayOf(d) === 'offer' && sameEvent(nd.what, 'Closing') && nd.days >= 0 && nd.days <= 7 && !(d.kind === 'short' && !p.dates.some((x) => sameDate(x.what, 'Approval notice received') && !!x.when && x.when <= localDay(now)))) {
      // (A seller's disclosure still open: the right to cancel over it ends at closing, NRS 113.150(1).)
      const discRow = p.dates.find((x) => sameDate(x.what, 'Seller’s disclosure form due'));
      const t00 = stageTasks(d, stage, p, now).find((t) => !t.done && ['deposit-sent', 'contract-title', 'bound-insurance', 'final-walkthrough'].includes(t.key));
      const disc = d.state === 'NV' && d.plan !== 'commercial' && !discRow?.resolved && (discRow || !t00) ? (discRow ?? { what: 'Seller’s disclosure form due', when: '', who: 'The seller', resolved: false }) : undefined;
      // (Contingency rows with no date: whether they passed or were met is worth knowing before closing.)
      const undated = p.dates.filter((x) => !x.when && !x.resolved && ['Inspection period ends', 'Option period ends', 'Appraisal deadline', 'Loan approval deadline'].some((k) => sameEvent(x.what, k)));
      if (!disc && undated.length && !t00) { const n = d.name || 'this property'; const when = nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`; return task({ key: 'closing-undated', days: nd.days, urgent: nd.days <= 1, label: `Closing for ${n} is ${when} (${prettyDay(nd.when)}): ${undated.map((x) => x.what.replace(/\s*\(.*\)$/, '')).join(', ')} ${undated.length === 1 ? 'has' : 'have'} no date. Enter the date, or mark it handled if it passed or was met`, produces: 'every contract deadline dated or handled in its deal packet', href: packetHref(d, 'dates'), support: [], done: false }); }
      if (disc) { const n = d.name || 'this property'; const when = nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`; return task({ key: 'disclosure-check', days: nd.days, urgent: nd.days <= 1, answer: true, label: `Closing for ${n} is ${when} (${prettyDay(nd.when)}): did the seller’s disclosure form arrive at least 10 days before closing? If it didn’t, you can cancel before closing without penalty (NRS 113.150(1)); ask your agent or attorney whether your sale requires one*`, produces: 'the form read, or your written decision, noted in its deal packet', href: packetHref(d, 'dates'), record: { label: 'It arrived, isn’t required, or I’m going ahead: mark it handled', row: { when: disc.when, what: disc.what, who: disc.who || 'The seller', resolved: true } }, advance2: { stage: 'passed', label: 'It didn’t, and I cancelled in writing: mark it passed' }, support: [L.pro('attorney')], done: false }); }
      const t0 = stageTasks(d, stage, p, now).find((t) => !t.done && ['deposit-sent', 'contract-title', 'bound-insurance', 'final-walkthrough'].includes(t.key));
      const what = t0 ? t0.label.replace(/ by closing$/, '') : '';
      if (t0) { const label = `Closing is ${nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`} (${prettyDay(nd.when)}): ${nd.days === 0 ? 'first' : 'before then'}, ${what.charAt(0).toLowerCase()}${what.slice(1)}`; return { ...t0, days: nd.days, urgent: nd.days <= 1, label, text: label }; }
    }
    if (nd && !bidPrep && (nd.days <= 7 || (stage === 'contract' && sameDate(nd.what, 'SID certificate payoff')))) {
      const ended = nd.days < 0 ? windowEnded(nd.what, -nd.days, d.kind) : null;
      const late90Ahead = ended && d.state === 'NV' && d.kind === 'trustee' && sameDate(nd.what, 'Challenge window ends') ? challenge90Ahead(p, now) : '';
      const deedTick = stage === 'closed' && certificateFirst(d) && sameDate(nd.what, DEED_AFTER_WAIT) && ticked(p, 'Redemption period ends') ? { label: 'I have the deed, and it’s recorded: mark it handled', row: nd.what, who: deedWho(d) } : undefined;
      const paidTick = early && sameDate(nd.what, SEALED_ROW) ? { label: nd.days < 0 ? 'I sent it by the deadline: mark it handled' : 'I sent my sealed bid and payment: mark it handled', row: nd.what, who: 'You', ...(nd.when ? { setWhen: nd.when } : {}) } : stage === 'contract' && sameDate(nd.what, 'Payment deadline') ? { label: 'I paid: mark it handled', row: nd.what } : stage === 'contract' && (sameEvent(nd.what, 'Earnest money due') || sameEvent(nd.what, 'Option fee')) ? { label: 'I sent it: mark it handled', row: nd.what, ...(sameEvent(nd.what, 'Earnest money due') ? { step: 'deposit' } : {}) } : sameDate(nd.what, 'SID certificate payoff') ? (sidDeadline(p) && sidDeadline(p) < localDay(now) && d.state === 'NV' && d.kind === 'taxSale' && (p.dates.find((x) => sameDate(x.what, 'SID certificate payoff') && x.when)?.when ?? '') <= sidDeadline(p) ? { label: `I paid it by ${prettyDay(sidDeadline(p))}: mark it handled`, row: nd.what } : { label: 'I paid it: mark it handled', row: nd.what, ...((p.dates.find((x) => sameDate(x.what, 'SID certificate payoff') && x.when)?.when ?? '') > localDay(now) ? { setWhen: localDay(now) } : {}) }) : undefined;
      const sidUnpaid = sameDate(nd.what, 'SID certificate payoff') && d.state === 'NV' && d.kind === 'taxSale' && sidDeadline(p) && sidDeadline(p) < localDay(now) ? { label: `I didn’t pay it by ${prettyDay(sidDeadline(p))}: the sale is void`, row: { when: localDay(now), what: VOID_UNPAID, who: 'You', resolved: true } } : undefined;
      const approvalMissedRow = stage === 'contract' && d.kind === 'short' && sameDate(nd.what, 'Lienholder approval deadline');
      // A passed row with no other answer: mark it handled from here (registration, inspections, a contract date).
      // (Never a stage's own event: the sale, a closing, a recording or the deed. Those have their own answers.)
      const ownEvent = ['Sale day', 'Closing', 'Offer accepted', 'Acceptance', 'Contract signed', 'Payment deadline', 'Earnest money due', 'Option fee', 'Approval notice received', DEED_AFTER_WAIT].some((n) => sameEvent(nd.what, n)) || sameDate(nd.what, 'Payment deadline') || RECORDED_ROWS.some((r) => sameDate(nd.what, r)) || ['Redemption period ends', 'Redemption money collected'].some((n) => sameDate(nd.what, n));
      const passedTick = nd.days < 0 && !approvalMissedRow && !ownEvent && !sameDate(nd.what, 'SID certificate payoff') && !windowEnded(nd.what, -nd.days, d.kind) ? { label: /^(bidder )?registration/i.test(nd.what.trim()) ? 'I registered (or none was needed): mark it handled' : sameEvent(nd.what, 'Inspection period ends') ? 'Inspections done: mark it handled' : stage === 'contract' && wayOf(d) === 'offer' && (sameEvent(nd.what, 'Appraisal deadline') || sameEvent(nd.what, 'Appraisal addendum deadline') || sameEvent(nd.what, 'Loan approval deadline')) ? 'It was resolved: mark it handled' : 'Done (or it no longer applies): mark it handled', row: nd.what } : undefined;
      const sidNone = sameDate(nd.what, 'SID certificate payoff') ? { label: 'No SID affidavit after all: remove the payoff row', removeRow: nd.what, addRow: { when: localDay(now), what: NO_SID_ROW, who: 'The county treasurer', resolved: true } } : undefined;
      const sidLate = nd.days < 0 && sameDate(nd.what, 'SID certificate payoff') && d.state === 'NV' && stage === 'contract';
      const sidAfterDeed = sameDate(nd.what, 'SID certificate payoff') && d.state === 'NV' && (stage === 'closed' || stage === 'owned');
      if (ended && d.state === 'NV' && d.kind === 'trustee' && sameDate(nd.what, 'Challenge window ends')) {
        const c = challengeEnded(p, now, ended.then, ended.tick);
        ended.then = c.then; ended.tick = c.tick;
      } else if (ended && !late90Ahead) ended.then = ended.then.replace('If it does, move the end date; if not, mark it handled', 'If none was filed, mark it handled');
      const sidRow = sameDate(nd.what, 'SID certificate payoff') ? p.dates.find((x) => sameDate(x.what, 'SID certificate payoff') && x.when)?.when ?? '' : '';
      const sidNote = sidRow && sidRow > nd.when ? ` The deadline is ${prettyDay(nd.when)}, 20 days after the sale; your date, ${prettyDay(sidRow)}, is later. If it isn’t paid by then, the sale is void (NRS 361.595(6)).` : '';
      const inspectionEnded = nd.days < 0 && stage === 'contract' && sameEvent(nd.what, 'Inspection period ends');
      // (An appraisal or loan deadline that has passed: resolved, or cancelled in writing in time, as the contract allows.)
      const contingencyEnded = nd.days < 0 && stage === 'contract' && wayOf(d) === 'offer' && (sameEvent(nd.what, 'Appraisal deadline') || sameEvent(nd.what, 'Appraisal addendum deadline') || sameEvent(nd.what, 'Loan approval deadline'));
      const approvalMissed = nd.days < 0 && stage === 'contract' && d.kind === 'short' && sameDate(nd.what, 'Lienholder approval deadline') && !p.dates.some((x) => sameDate(x.what, 'Approval notice received') && x.when && x.when <= localDay(now));
      const inspectionNow = stage === 'contract' && wayOf(d) === 'offer' && sameEvent(nd.what, 'Inspection period ends');
      const deedAny = (stage === 'contract' || stage === 'closed') && certificateFirst(d) && sameDate(nd.what, DEED_AFTER_WAIT) && !ticked(p, 'Redemption period ends') && !redeemedIn(p);
      // (A deed date typed before the redemption ends, past or future: check the date, don't ask yet.)
      const deedEarly = deedAny && !!earlyDeedEnd(d, p, now, nd.when);
      const deedAsk = deedAny && !deedEarly && nd.days < 0;
      const deedRow = deedEarly || deedAsk;
      const rEnd = deedRow ? (deedEarly ? earlyDeedEnd(d, p, now, nd.when) : p.dates.find((x) => sameDate(x.what, 'Redemption period ends') && x.when)?.when || redemptionEnd(d, p)) : '';
      const deedAskTick = deedAsk ? { label: 'No one redeemed: mark it handled', row: 'Redemption period ends', who: redeemAsk(d), ...(rEnd ? { when: rEnd } : {}) } : undefined;
      const recordingPast = !deedRow && nd.days < 0 && (RECORDED_ROWS.some((r) => sameDate(nd.what, r)) || sameDate(nd.what, DEED_AFTER_WAIT));
      const inHand = sameDate(nd.what, 'Certificate of sale received') || sameDate(nd.what, DEED_AFTER_WAIT);
      const isDeed = sameDate(nd.what, DEED_AFTER_WAIT);
      const whenWord = isDeed ? 'when it will be delivered' : inHand ? 'when you’ll get it' : 'when it will be recorded';
      const askWho = nd.who && !/^(me|you)$/i.test(nd.who.trim()) ? `ask ${/^the /i.test(nd.who.trim()) ? nd.who.trim().replace(/^The /, 'the ') : `your contact (${nd.who.trim()})`} ${whenWord}` : `check ${whenWord}`;
      const text = approvalMissed ? `The lender’s approval deadline for ${d.name || 'this property'} passed (${prettyDay(nd.when)}) with no approval notice. Ask your agent, in writing, whether to extend it or cancel under the short sale addendum*. Extended? Type the new deadline in Key dates.${p.dates.some((x) => sameEvent(x.what, 'Closing') && !!x.when && !x.resolved && x.when < localDay(now)) ? ' Your closing date has passed too: ask your agent and escrow for a new one.' : ''}` : deedEarly ? `The deed date you entered for ${d.name || 'this property'} (${prettyDay(nd.when)}) is before the redemption period ends (${prettyDay(rEnd)}): check the date with ${redeemAsk(d).replace(/^The /, 'the ')}, and move it in Key dates.` : deedAsk ? `The redemption period for ${d.name || 'this property'} is over: did anyone redeem? Ask ${redeemAsk(d).replace(/^The /, 'the ')} in writing.${rEnd && nd.when < rEnd ? ` (Your deed date, ${prettyDay(nd.when)}, is before the redemption end, ${prettyDay(rEnd)}: check it too.)` : ''}` : recordingPast ? (isDeed ? `Do you have the deed for ${d.name || 'this property'} yet? It was expected on ${prettyDay(nd.when)}. If you have it and it’s recorded, mark it handled; if not, ${askWho}.` : `${nd.what.replace(/\s*\([^)]*\)\s*$/, '')} for ${d.name || 'this property'}: expected on ${prettyDay(nd.when)}. If ${inHand ? 'you have it' : 'it’s recorded'}, mark it handled; if not, ${askWho}.`) : stage === 'contract' && wayOf(d) === 'offer' && nd.days < 0 && sameEvent(nd.what, 'Closing') ? `The closing date for ${d.name || 'this property'} (${prettyDay(nd.when)}) has passed: if it closed, mark it closed; if it moved, type the new closing date on the Closing row in Key dates.` : contingencyEnded ? `The ${/loan/i.test(nd.what) ? 'loan approval' : 'appraisal'} deadline for ${d.name || 'this property'} ended ${-nd.days} day${nd.days === -1 ? '' : 's'} ago (${prettyDay(nd.when)}): ${/loan/i.test(nd.what) ? 'was the loan approved' : 'did the appraisal come in at the price, or was the gap settled'}, or did you cancel in writing in time, as your contract allows*? Ask your agent if you’re not sure.` : inspectionEnded ? `The inspection period for ${d.name || 'this property'} ended ${-nd.days} day${nd.days === -1 ? '' : 's'} ago (${prettyDay(nd.when)}): did you finish your inspections, or cancel in writing in time? If they’re done, mark it handled to go on; if you cancelled, mark the deal passed.` : sidAfterDeed ? `The SID certificate payoff for ${d.name || 'this property'} is still open. The Treasurer can’t issue the deed until it’s paid (NRS 361.595(6)), so a recorded deed usually means it was paid*. If you paid it, mark it handled; if not, call the Treasurer today.` : sidLate ? (sidDeadline(p) && sidDeadline(p) < localDay(now) ? `The 20 days for the SID certificate payoff for ${d.name || 'this property'} ended ${prettyDay(sidDeadline(p))}. If it wasn’t paid by then, the sale is void and the Treasurer may keep up to 10% of what you paid (NRS 361.595(6)). Call the Treasurer today.` : `Overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}: the SID certificate payoff for ${d.name || 'this property'}${sidDeadline(p) ? ` (the deadline is ${prettyDay(sidDeadline(p))}, 20 days after the sale)` : ''}. If it isn’t paid by then, the sale is void (NRS 361.595(6)): call the Treasurer today.`) : ended ? `${ended.text[0].toUpperCase()}${ended.text.slice(1)}: ${ended.then}.` : `${nd.days < 0 ? `Overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}` : nd.days === 0 ? 'Today' : nd.days === 1 ? 'Tomorrow' : `In ${nd.days} days`}${nd.days >= 0 && wayOf(d) === 'lien' && d.state === 'NV' && sameDate(nd.what, 'Payment deadline') ? (nd.days === 0 && nvPastCutoff(now) ? '' : ', before 10 a.m.') : ''}: ${nd.what} for ${d.name || 'this property'}${nd.who ? ` (who: ${nd.who})` : ''}.${sidNote}${nd.days === 0 && nvPastCutoff(now) && wayOf(d) === 'lien' && d.state === 'NV' && sameDate(nd.what, 'Payment deadline') ? ' The 10 a.m. cutoff has passed: if you paid in time, mark it handled; if not, the certificate isn’t yours (NRS 271.560), so mark the deal passed.' : ''}`;
      const redeemable = stage === 'closed' && certificateFirst(d) && (sameDate(nd.what, 'Redemption period ends') || (sameDate(nd.what, DEED_AFTER_WAIT) && !ticked(p, 'Redemption period ends')));
      // The stage's own event (the deed recorded, the closing): its "mark it" button comes with the reminder.
      const own = stage === 'contract' && (RECORDED_ROWS.some((r) => sameEvent(nd.what, r)) || (sameEvent(nd.what, 'Closing') && nd.days <= 0)) ? stageTasks(d, stage, p, now).find((t) => t.advance)?.advance : undefined;
      // CODE-5: the sale day (or the day the offer is accepted) itself: its answer buttons come with the reminder.
      const today = (stage === 'offer' || stage === 'researching') && nd.days === 0 && (wayOf(d) === 'offer' ? ['Offer accepted', 'Acceptance'] : ['Sale day']).some((n) => sameEvent(nd.what, n));
      const todayAdvance = today ? (stageTasks(d, stage, p, now).find((t) => t.advance)?.advance ?? (wayOf(d) !== 'offer' ? { stage: 'contract' as DealStage, label: wayOf(d) === 'lien' && d.state === 'NV' ? 'I was picked: mark it' : sealedBid(d) && !ticked(p, SEALED_ROW) ? 'My sealed bid went in on time and won: mark it won' : 'I won the bid: mark it won', ...(sealedBid(d) ? { ticks: [SEALED_ROW], tickWho: 'You', tickWhen: sealedDay(p) } : {}) } : undefined)) : undefined;
      const todayLost = today && wayOf(d) !== 'offer' ? { stage: 'passed' as DealStage, label: wayOf(d) === 'lien' && d.state === 'NV' ? 'I wasn’t picked: mark it passed' : sealedBid(d) ? (ticked(p, SEALED_ROW) ? 'My bid didn’t win: mark it passed (the county returns the enclosed payment by certified mail)' : 'My bid didn’t win, or I didn’t send one: mark it passed (the county returns any enclosed payment by certified mail)') : 'I didn’t win (or didn’t bid): mark it passed' } : undefined;
      const countdown = stage === 'researching' && wayOf(d) !== 'offer' && nd.days > 0 && sameEvent(nd.what, 'Sale day');
      // (Eureka's bid deadline: it must arrive, not be mailed, by then; a date that isn't the usual day before is flagged.)
      const sealedUsual = sameDate(nd.what, SEALED_ROW) && sealedBid(d) ? sealedDay({ ...p, dates: p.dates.filter((x) => !sameDate(x.what, SEALED_ROW)) }) : '';
      const sealedClosed = [0, 5, 6].includes(new Date(`${nd.when}T12:00:00`).getDay()) || nvHoliday(new Date(`${nd.when}T12:00:00`));
      const sealedNote = sameDate(nd.what, SEALED_ROW) && nd.days >= 0 && early ? (sealedUsual && nd.when >= saleDayIn(p) ? ` This date is on or after the sale (${prettyDay(saleDayIn(p))}): bids are due before it, usually by ${usualWords(p, sealedUsual)}. Fix the date in Key dates.` : sealedClosed ? ` The Treasurer’s office is open Monday to Thursday, except holidays, so it’s closed that day: check the notice for the real deadline. Your bid must reach the office by it (by USPS, FedEx, UPS or by hand); a late bid isn’t accepted.` : ` It must reach the Eureka County Treasurer’s office by the notice’s deadline that day (usually 4 p.m.; ${nd.days === 0 ? 'today, hand delivery is the way to be sure it arrives' : 'by USPS, FedEx, UPS or by hand'}); a late bid isn’t accepted.${sealedUsual && sealedUsual !== nd.when ? ` Eureka’s usual deadline is ${usualWords(p, sealedUsual)}. Keep your date only if the official notice says so.` : sealedUsual && /closed/.test(usualWords(p, sealedUsual)) ? ` Eureka’s usual deadline is ${usualWords(p, sealedUsual)}. Check the notice for the real deadline.` : ''}`) : '';
      // (A sealed-bid deadline that passed without the bid marked sent: a late bid isn't accepted, so the answer is whether it went in.)
      const sealedMissed = early && sameDate(nd.what, SEALED_ROW) && nd.days < 0;
      const sealedLater = sealedMissed && !!sealedUsual && sealedUsual >= localDay(now);
      const sealedText = sealedLater ? `The bid deadline you entered for ${d.name || 'this property'} (${prettyDay(nd.when)}) has passed, but Eureka’s usual deadline is ${usualWords(p, sealedUsual)}. Check the notice: if its deadline passed without your bid, you can’t bid at this sale.` : sealedMissed ? `The sealed-bid deadline for ${d.name || 'this property'} passed (${prettyDay(nd.when)}). If you sent your bid in time, press “I sent it by the deadline”; if not, you can’t bid at this sale.` : text + sealedNote;
      return { key: 'date', days: sidLate && sidDeadline(p) && sidDeadline(p) < localDay(now) ? -1 : nd.days, label: sealedText, produces: countdown ? `${wayOf(d) === 'lien' ? 'the most you’ll put into one certificate' : 'your maximum bid'} set and the funds ready before then: finish the research and move it to ${stageLabel('offer', d)} in its deal packet` : ended?.ask ? ended.ask : ended ? `a written answer on whether ${/suit/i.test(ended.tick ?? '') ? 'a suit was filed' : sameDate(nd.what, 'Redemption period ends') ? 'anyone redeemed' : 'it’s still unpaid'}, noted in its deal packet` : recordingPast ? (isDeed ? 'the recorded deed, noted in its deal packet' : inHand ? 'the document in hand, noted in its deal packet' : 'the recorded document, noted in its deal packet') : deedAsk ? 'a written answer on whether anyone redeemed, noted in its deal packet' : deedEarly ? 'the right deed date, in its deal packet' : contingencyEnded ? 'what happened (resolved, or cancelled in writing), noted in its deal packet' : stage === 'contract' && sameEvent(nd.what, 'Closing') ? 'the closing done and the deal marked Closed' : approvalMissed ? 'a written answer on extending or cancelling, noted in its deal packet' : sealedLater ? 'the deadline from the notice in Key dates' : sealedMissed ? 'whether the bid went in on time, or that you pass on this sale' : nd.days < 0 && sameDate(nd.what, 'Payment deadline') ? (wayOf(d) === 'lien' && d.state === 'NV' ? 'the payment marked handled if you paid; if you didn’t, the deal marked passed (the certificate isn’t yours)' : `the payment marked handled if you paid, or an answer from ${sellerName(d.kind, d.state)}${wayOf(d) === 'lien' ? '' : ' and an attorney'} on what happens now`) : 'the deadline met, with what you did noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, ...(own ? { advance: own } : todayAdvance ? { advance: todayAdvance } : countdown ? { advance: { stage: 'offer' as DealStage, label: `Research done? Move it to ${stageLabel('offer', d)}` } } : {}), ...(todayLost ? { advance2: todayLost, postpone: POSTPONE } : {}), ...(late90Ahead ? { redate: { label: `Wait for the 90-day limit: move the end to ${prettyDay(late90Ahead)}`, row: nd.what, when: late90Ahead } } : {}), ...(deedAskTick ? { tick: deedAskTick, answer: true } : ended?.tick ? { tick: { label: ended.tick, row: nd.what, ...(sameDate(nd.what, 'Redemption period ends') ? { who: redeemAsk(d) } : {}) }, answer: true } : paidTick ? { tick: paidTick } : deedTick ? { tick: deedTick } : passedTick ? { tick: passedTick } : inspectionNow ? { tick: { label: 'Inspections done: mark it handled', row: nd.what } } : {}), ...(sidNone ? { undo: sidNone } : {}), ...(sealedMissed ? { advance2: { stage: 'passed' as DealStage, label: sealedLater ? 'The notice’s deadline passed without my bid: mark it passed' : 'I didn’t send a bid: mark it passed' }, answer: true } : {}), ...(wayOf(d) === 'lien' && d.state === 'NV' && stage === 'contract' && (nd.days < 0 || (nd.days === 0 && nvPastCutoff(now))) && sameDate(nd.what, 'Payment deadline') ? { advance2: { stage: 'passed' as DealStage, label: 'I didn’t pay in time: mark it passed' } } : {}), ...(sealedLater ? { redate: { label: `If the notice gives the usual deadline, change it to ${prettyDay(sealedUsual)}`, row: nd.what, when: sealedUsual } } : {}), ...(sidUnpaid ? { record: sidUnpaid } : ended && sameDate(nd.what, 'Seller’s disclosure form due') ? { record: { label: 'It never came: note it, then ask my agent', row: { when: localDay(now), what: 'Seller’s disclosure form didn’t arrive (ask your agent about cancelling before closing, NRS 113.150)*', who: 'Me', resolved: true }, closes: nd.what } } : {}), ...(redeemable ? { advance2: redeemButton(d) } : stage === 'closed' && certificateFirst(d) && !ticked(p, 'Redemption period ends') && !ticked(p, DEED_AFTER_WAIT) && !redeemedIn(p) ? { advance2: redeemButton(d, redeemLabel(d, p, now)) } : wayOf(d) === 'lien' && d.state === 'NV' && (stage === 'closed' || stage === 'owned') && !redeemedIn(p) ? { advance2: lienPaidButton(d, stage) } : {}), ...(inspectionNow || contingencyEnded ? { advance2: { stage: 'passed' as DealStage, label: 'I cancelled in writing: mark it passed' } } : approvalMissed ? { advance2: { stage: 'passed' as DealStage, label: 'We cancelled: mark it passed' }, record: { label: 'The approval came: record it (fix its date in Key dates if it came earlier)', row: { when: localDay(now), what: 'Approval notice received', who: 'The lender', resolved: true }, closes: nd.what } } : ended?.cancel ? { advance2: { stage: 'passed' as DealStage, label: 'I cancelled in writing: mark it passed' } } : {}), support: [], done: false, urgent: !ended && !deedTick && !countdown && !recordingPast && !deedRow, text: sealedText };
    }
    // A redemption end worked out from the sale day (the row has no date) that has passed: did anyone redeem?
    const computedEnd = stage === 'closed' && certificateFirst(d) && !ticked(p, 'Redemption period ends') && !ticked(p, DEED_AFTER_WAIT) && !redeemedIn(p) && !p.dates.some((x) => sameDate(x.what, 'Redemption period ends') && x.when) ? redemptionEnd(d, p) : '';
    if (computedEnd && computedEnd < localDay(now)) {
      const daysAgo = Math.round((new Date(`${localDay(now)}T12:00:00`).getTime() - new Date(`${computedEnd}T12:00:00`).getTime()) / 864e5);
      const e = windowEnded('Redemption period ends', daysAgo, d.kind)!;
      const text = `The redemption period ended ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago (${prettyDay(computedEnd)}): ${e.then}.`;
      return { key: 'date', days: -daysAgo, label: text, produces: 'a written answer on whether anyone redeemed, noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, tick: { label: e.tick!, row: 'Redemption period ends', when: computedEnd, who: redeemAsk(d) }, answer: true, advance2: redeemButton(d), support: [], done: false, urgent: false, text };
    }
    // A Nevada trustee sale's challenge window, worked out (30 days after the deed was recorded) while its row is blank, that has passed.
    const winDeed = d.state === 'NV' && d.kind === 'trustee' && stage === 'closed' && !p.dates.some((x) => sameDate(x.what, 'Challenge window ends') && (x.when || x.resolved)) ? p.dates.find((x) => sameDate(x.what, 'Deed recorded') && x.when)?.when ?? '' : '';
    const winEnd = winDeed ? (() => { const t = new Date(`${winDeed}T12:00:00`); t.setDate(t.getDate() + 30); return localDay(t); })() : '';
    if (winEnd && winEnd < localDay(now)) {
      const daysAgo = Math.round((new Date(`${localDay(now)}T12:00:00`).getTime() - new Date(`${winEnd}T12:00:00`).getTime()) / 864e5);
      const pw: PacketData = { ...p, dates: [...p.dates.filter((x) => !sameDate(x.what, 'Challenge window ends')), { when: winEnd, what: 'Challenge window ends', who: '' }] };
      const e = windowEnded('Challenge window ends', daysAgo, d.kind)!;
      const late = challenge90Ahead(pw, now);
      const c = challengeEnded(pw, now, e.then, e.tick);
      const text = `The challenge window ended ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago (${prettyDay(winEnd)}, worked out from the deed’s recording): ${c.then}.`;
      return { key: 'date', days: -daysAgo, label: text, produces: 'a written answer on whether a suit was filed, noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, tick: { label: c.tick!, row: 'Challenge window ends', when: winEnd, who: 'Your title company' }, answer: true, ...(late ? { redate: { label: `Wait for the 90-day limit: move the end to ${prettyDay(late)}`, row: 'Challenge window ends', when: late, who: 'Your title company' } } : {}), support: [], done: false, urgent: false, text };
    }
    const log = loadLog(`analyzed:${d.id}`);
    const openRow = areasFor(d.kind, liveIn(d)).map((a) => ({ a, r: log.rows[a.key] })).find(({ r }) => r?.open && !r.done);
    if (openRow) {
      const text = `Get an answer to: ${openRow.r.open}${openRow.r.owner ? ` (${openRow.r.owner})` : ''}.`;
      return { key: 'open', label: text, produces: `the answer recorded under “${openRow.a.title}” in its evidence log`, href: `#/deals/packet/${d.id}/evidence`, support: [], done: false, urgent: true, text };
    }
    const waiting = p.qa.find((x) => x.q && !x.a);
    if (waiting) {
      const text = `Get an answer from your ${(proGuideByKey(waiting.role as never) ? roleTitleFor(d, waiting.role as never) : 'professional').toLowerCase()}: ${waiting.q}`;
      return { key: 'qa-wait', label: text, produces: 'their answer, with the date, in its deal packet', href: `#/deals/packet/${d.id}/pros`, support: [], done: false, urgent: true, text };
    }
  }
  const tasks = stageTasks(d, stage, p, now);
  // An offer's closing marked handled: "It closed" comes first.
  if (stage === 'contract' && wayOf(d) === 'offer' && closingDoneIn(p, now)) { const c = tasks.find((x) => x.key === 'close'); if (c) return c; }
  // (The winning bid, while it still needs numbers in Analyze, waits behind the sale's own steps.)
  const t = tasks.find((x) => !x.done && !(stage === 'contract' && x.key === 'won-price' && !x.tick)) ?? tasks.find((x) => !x.done) ?? tasks[tasks.length - 1];
  // Every date it needs is in: what's left is the review for this stage.
  if (t.key === 'dates' && !t.done && calendarReady(forCalendar(d, p, stage), stage)) return { ...t, label: `Confirm ${d.name || 'this property'}’s calendar for this stage`, produces: 'a tick on “I checked every deadline for this stage” under Key dates, once each date matches the official notice or contract', text: `Confirm ${d.name || 'this property'}’s calendar for this stage.` };
  return t;
}
