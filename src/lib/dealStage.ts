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
import { readConfirmed } from './calcConfirmation';
import { calendarReady, flipSaleLine, savePacket, irsWithoutRedemption, RECORDED_ROWS, sameEvent, windowEnded, sameDate, roleTitleFor, loadPacket, calendarComplete, nextDate, savedNumbers, hasSavedNumbers, flipBudget, suggestedDates, type PacketData } from './dealPacket';
import { areasFor, loadLog, type EvidenceLog } from './evidence';
import { loadOwned, type Owned } from './owned';
import { proGuideByKey } from './proGuide';
import { dealProgress, progressChanged } from './roadmapState';

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
/** A home you'll live in (Decide: a home loan you'd live in), bought by offer, with no rent typed for it: no rental tasks. */
export function liveIn(d: { kind: Deal['kind']; plan?: Deal['plan']; id?: string }): boolean {
  if (!d.id) return false;
  if (d.plan !== 'rent' || wayOf(d) !== 'offer' || !investorProfile().ownerOccupant) return false;
  try {
    const key = `fsf.calc.rent.${d.id}-offer.v1`;
    const r = JSON.parse(localStorage.getItem(key) ?? 'null') as { monthlyRent?: unknown } | null;
    return !(readConfirmed(key).has('monthlyRent') && typeof r?.monthlyRent === 'number' && r.monthlyRent > 0);
  } catch { return true; }
}

/** Dates that only matter once you've won (they come after the sale): no reminder for them before then. */
const AFTER_SALE = ['SID certificate payoff', 'Certificate of sale recorded', 'Certificate of sale received', 'Redemption period ends', DEED_AFTER_WAIT, 'Deed recorded', 'Deed or certificate recorded', 'Treasurer’s deed recorded', 'Recovery-suit window ends', 'Challenge window ends', 'Rescission window ends', 'Intent-to-bid window ends', 'Eligible bid deadline (45 days)', 'Earliest you may act (unpaid lien)', 'Certificate expires'];
export const afterSale = (what: string) => AFTER_SALE.some((n) => sameDate(what, n));
/** The packet's dates that can be a reminder now: before winning, not the post-sale ones; never a sale day that has
 *  passed; and once the deed is ticked, not the redemption period. */
export const remindable = (p: PacketData, now: Date, early: boolean, behind: string[] = []): PacketData => {
  const deed = ticked(p, DEED_AFTER_WAIT);
  const past = (x: { when: string }) => !!x.when && x.when < localDay(now);
  return { ...p, dates: p.dates.filter((x) => !(early && afterSale(x.what)) && !(EVENTS.some((n) => sameDate(x.what, n)) && (past(x) || !early)) && !(!early && BEFORE_SALE.some((n) => sameDate(x.what, n))) && !((deed || redeemedIn(p)) && sameDate(x.what, 'Redemption period ends')) && !(redeemedIn(p) && [DEED_AFTER_WAIT, REDEEMED_ROW, 'Earliest you may act (unpaid lien)', 'Certificate expires'].some((n) => sameDate(x.what, n))) && !behind.some((n) => sameDate(x.what, n))) };
};
/** The usual dates a stage has put behind you: once it's closed or owned, the ones before closing and the recording rows. */
export const behindStage = (d: Pick<Deal, 'kind' | 'state'> & { plan?: Deal['plan']; id?: string }, stage: DealStage): string[] =>
  stage === 'closed' || stage === 'owned' ? [...suggestedDates(d).filter((n) => !afterSale(n) || RECORDED_ROWS.some((r) => sameDate(n, r))), 'SID certificate payoff', ...(stage === 'owned' && certificateFirst(d) ? ['Redemption period ends', DEED_AFTER_WAIT] : [])] : [];
/** Rows that mark an event, not a deadline: once their date has passed, they aren't a reminder. */
const EVENTS = ['Sale day', 'Contract signed', 'Offer accepted (Day 0)', 'Acceptance (Day 0)', 'Approval notice received'];
/** Registration rows: past the bidding (won, closed), they're behind you. */
const BEFORE_SALE = ['Registration', 'Bidder registration'];
/** Sale day is marked handled, or its date has passed: time to say whether you won. */
const saleOver = (p: PacketData, now: Date) => p.dates.some((x) => sameDate(x.what, 'Sale day') && (x.when ? x.when < localDay(now) || (!!x.resolved && x.when <= localDay(now)) : !!x.resolved));
/** A row marked handled, with or without its date (the deed: you have it). */
const ticked = (p: PacketData, what: string) => p.dates.some((x) => sameDate(x.what, what) && !!x.resolved);
/** A redemption: the row for its payoff, added by "It was redeemed". */
export const REDEEMED_ROW = 'Redemption money collected';
const redeemedIn = (p: PacketData) => p.dates.some((x) => sameDate(x.what, REDEEMED_ROW));
/** Who pays a redemption's money: you, or the sheriff for you (NRS 21.230(1), (3)); an HOA sale's, you (NRS 116.31166(3));
 *  an IRS sale's, you, or the IRS if you can't be found in the county (26 U.S.C. 6337(b)(2)). */
const payoffRow = (d: Pick<Deal, 'kind'>) => ({ when: '', what: REDEEMED_ROW, who: d.kind === 'court' ? 'The person who redeemed, or the sheriff for them' : d.kind === 'irs' ? 'The person who redeemed (the IRS, if you couldn’t be found)' : 'The person who redeemed' });
const redeemButton = (d: Pick<Deal, 'kind'>, label = 'It was redeemed: collect the payoff') => ({ stage: 'closed' as DealStage, label, addRow: payoffRow(d) });
/** A flip's recorded sale (in its packet's owned section). */
export const soldOf = (d: { id?: string }) => (d.id ? loadOwned()[d.id]?.sold : undefined);
/** A deal whose redemption payoff is marked collected in its packet. */
const redeemedOf = (d: { id?: string }) => !!d.id && ticked(loadPacket(`analyzed:${d.id}`), REDEEMED_ROW);
/** A certificate-first deal that was redeemed, with its payoff not yet collected. */
export const redeemingNow = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && (certificateFirst(d) || (wayOf(d) === 'lien' && d.state === 'NV')) && redeemedIn(loadPacket(`analyzed:${d.id}`)) && !redeemedOf(d);
/** "The owner paid": starts a Nevada SID lien's payoff (its stage stays). */
const lienPaidButton = (d: Deal, _stage: DealStage) => ({ stage: 'owned' as DealStage, label: `The owner paid for ${d.name || 'this lien'}: collect it from the Treasurer`, addRow: { when: '', what: REDEEMED_ROW, who: 'The Treasurer who sold the certificate' } });
/** A Nevada SID lien paid off: the Treasurer pays the certificate holder what the owner paid (NRS 271.595(2)). */
const lienPayoff = (d: Deal, p: PacketData) => task({ key: 'payoff', label: `Collect the payoff for ${d.name || 'this lien'} from the Treasurer`, produces: 'the payoff the owner paid, from the Treasurer who sold the certificate (NRS 271.595(2)), with a receipt. Then mark it finished', href: packetHref(d, 'dates'), tick: { label: `I was repaid for ${d.name || 'this lien'}: mark it finished`, row: REDEEMED_ROW, then: 'passed' }, undo: { label: 'Not paid after all? Undo', removeRow: REDEEMED_ROW }, answer: true, support: [L.pro('cpa')], done: ticked(p, REDEEMED_ROW) });
/** Who delivers a certificate-first sale's deed. */
const deedWho = (d: Pick<Deal, 'kind'>) => (d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : d.kind === 'irs' ? 'The IRS' : 'The sheriff');
/** A deal that's finished: a sold flip, or a redemption repaid. */
export const finishedDeal = (d: { id?: string }) => !!soldOf(d) || redeemedOf(d);
/** A certificate-first deal whose deed row is ticked in its packet. */
const deedInHand = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && certificateFirst(d) && ticked(loadPacket(`analyzed:${d.id}`), DEED_AFTER_WAIT);

/** The stage's name for this kind of sale (you make an offer on a listing, but bid at an auction) and plan. */
export function stageLabel(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string }): string {
  const w = wayOf(d);
  switch (stage) {
    case 'researching': return 'Researching';
    case 'offer': return w === 'offer' ? 'Preparing an offer' : w === 'lien' && d.state === 'NV' ? 'Preparing for the sale' : 'Preparing to bid';
    case 'contract': return w === 'offer' ? 'Under contract' : w === 'lien' && d.state === 'NV' ? 'Picked: paying' : 'Won: paying and recording';
    case 'closed': return redeemingNow(d) && w !== 'lien' ? 'Redeemed: collecting the payoff' : w === 'offer' ? 'Closed' : w === 'lien' ? 'Certificate in hand' : certificateFirst(d) && !deedInHand(d) ? (d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') : 'Deed recorded';
    case 'owned': return w === 'lien' ? (redeemingNow(d) ? 'Paid off: collecting from the Treasurer' : 'Holding the certificate') : d.plan === 'flip' ? (soldOf(d) ? 'Sold' : 'Fixing and selling') : liveIn(d) ? 'Living there' : 'Owned and operating';
    case 'passed': return redeemedOf(d) ? (wayOf(d) === 'lien' ? 'Paid off (repaid)' : 'Redeemed (repaid)') : 'Passed';
  }
}

/** One line on what the stage means, for the stage picker. */
export function stageHint(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string }): string {
  const w = wayOf(d);
  // (A certificate first: once its deed is in hand, the hint moves on.)
  const deedIn = deedInHand(d);
  switch (stage) {
    case 'researching': return w === 'offer' ? 'Checking whether it fits, before any offer. Check the listing and the seller’s deadlines while you research.' : w === 'lien' ? (d.state === 'NV' ? 'Checking whether it fits, before the sale. Check the sale’s registration and payment deadlines while you research.' : 'Checking whether it fits, before you bid. Check the sale’s registration and payment deadlines while you research.') : d.kind === 'trustee' ? 'Checking whether it fits, before any bid. Confirm the sale date and the trustee’s payment terms while you research.' : 'Checking whether it fits, before any bid. Check the sale’s registration deadline while you research.';
    case 'offer': return w === 'offer' ? 'It checked out: you’re setting your price, the earnest money and your questions before you offer.' : w === 'lien' && d.state === 'NV' ? 'It checked out: you’re setting the most you’ll put into one certificate and getting the funds ready.' : 'It checked out: you’re setting your maximum bid and getting the funds ready.';
    case 'contract': return w === 'offer' ? (d.kind === 'short' ? 'The seller accepted your offer. Most deadlines start when the lender approves the short sale: watch for the approval notice, and meet any deadline your addendum sets before then.' : 'The seller accepted your offer. The contract’s deadlines are running.') : w === 'lien' && d.state === 'NV' ? 'You were picked. The payment deadline is running.' : 'You won the bid. Payment and recording deadlines are running.';
    case 'closed': return redeemingNow(d) && w === 'lien' ? 'The owner paid: collect the payoff from the Treasurer, with a receipt, then mark it finished.' : redeemingNow(d) ? 'It was redeemed: no deed will come. Collect your price plus what the law adds, with a receipt, then mark it finished.' : w === 'offer' ? 'It’s yours: insurance, locks, utilities and repairs come first.' : w === 'lien' ? 'You hold the certificate: track it until it’s paid off.' : deedIn ? 'You have the deed: make sure it’s recorded, get title insurance, then start the repairs.' : certificateFirst(d) ? `A certificate of sale first: insure and maintain it, and hold off on remodeling until the redemption period (${waitWord(d)} after the sale) ends and you have the deed.` : (d.state === 'NV' && d.kind === 'trustee' ? 'The deed is yours: put the challenge window’s end on its calendar, and check possession and title before you remodel.' : d.state === 'NV' && d.kind === 'taxSale' ? 'The deed is yours: check the 2-year recovery-suit window, possession and title before you remodel.' : 'The deed is yours: check redemption, possession and title before you remodel.');
    case 'owned': return w === 'lien' && redeemingNow(d) ? 'The owner paid: collect the payoff from the Treasurer, with a receipt, then mark it finished.' : w === 'lien' ? 'Tracking payoffs, interest and what to do with unpaid liens.' : liveIn(d) ? 'Living there: recording what your home really costs each month.' : d.plan === 'flip' ? (soldOf(d) ? `Sold on ${soldOf(d)!.on} for $${Math.round(soldOf(d)!.price).toLocaleString('en-US')}: ${d.id && /Rough profit/.test(flipSaleLine({ ...(d as Deal), plan: 'flip' }) ?? '') ? 'the sale notice under “After you buy” shows a rough profit against the one you planned' : 'type the price you paid in “Check an offer” under Fix and sell (Analyze) to see your rough profit'}. Then find your next property.` : 'Fixing it up and selling it: tracking repair and holding costs against your budget.') : 'Renting or holding it: recording real rent and costs each month.';
    case 'passed': return redeemedOf(d) ? (wayOf(d) === 'lien' ? 'The owner paid off the lien and the Treasurer repaid you (NRS 271.595(2)). A fine result: find your next lien sale.' : 'It was redeemed and you were repaid your price plus what the law adds. A fine result: find your next property.') : certificateFirst(d) ? 'You walked away or were outbid. Either is a fine result when the evidence says no: find your next property.' : 'You walked away. A good result when the evidence says no.';
  }
}

/** The roadmap steps (roadmap.ts) that belong to each stage, so the roadmap's next step follows the deal's stage. */
export const STAGE_STEPS: Record<DealStage, string[]> = {
  researching: ['find', 'evidence', 'quotes', 'a-find', 'a-research', 'a-value', 'a-insure', 'c-sale', 'c-research', 'c-budget'],
  offer: ['offer', 'a-max', 'a-bid', 'c-bid'],
  contract: ['deposit', 'inspect', 'appraise', 'title', 'loan-approval', 'bind-insurance', 'walkthrough', 'close', 'a-pay', 'a-possess'],
  closed: ['first-week', 'a-before-remodel', 'repairs', 'rent', 'c-own'],
  owned: ['operate', 'review', 'exit-refi', 'exit-sell', 'exit-1031', 'c-hold', 'c-decide'],
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

/** Change a saved deal's stage. Kept with the deal, so Analyze, the deal packet and My plan all agree. */
export function setDealStage(id: string, stage: DealStage) {
  if (!isDealStage(stage)) return;
  const all = loadDeals();
  if (!all.some((d) => d.id === id)) return;
  saveDeals(all.map((d) => (d.id === id ? { ...d, stage } : d)));
  // Moved back off a repaid finish (from any page): the payoff isn't collected after all.
  if (stage !== 'passed') {
    const k = `analyzed:${id}`;
    const pk = loadPacket(k);
    if (pk.dates.some((x) => sameDate(x.what, REDEEMED_ROW) && x.resolved)) savePacket(k, { ...pk, dates: pk.dates.map((x) => (sameDate(x.what, REDEEMED_ROW) ? { ...x, resolved: false } : x)) });
  }
  try {
    // The deal open in Analyze is kept separately: change its copy too, so it doesn't write the old stage back.
    const cur = JSON.parse(localStorage.getItem(CURRENT_KEY) ?? 'null') as Deal | null;
    if (cur && cur.id === id) localStorage.setItem(CURRENT_KEY, JSON.stringify({ ...cur, stage }));
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
  advance?: { stage: DealStage; label: string; /** Rows this answer also marks handled (the deed recorded): dated today if blank, added if missing. */ ticks?: string[]; tickWho?: string };
  /** The other answer to the same event: "I didn't win: mark it passed". addRow adds a row to its dates (a redemption's payoff). */
  advance2?: { stage: DealStage; label: string; addRow?: { when: string; what: string; who: string }; closes?: string };
  /** The task is a question its buttons answer: no Continue or "Go there" link beside them. */
  answer?: boolean;
  /** A button that marks one of its date rows handled (then, optionally, moves the deal on). */
  tick?: { label: string; row: string; then?: DealStage; closes?: string; /** Fills a blank "who" (and adds the row if it's missing). */ who?: string };
  /** Takes back an answer: removes the row it added ("Not redeemed after all? Undo"). */
  undo?: { label: string; removeRow: string };
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
const stepHref = (id: string) => `#/toolkit/roadmap?step=${encodeURIComponent(id)}`;
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
  const area = (k: string, label: string, produces: string, support: Support[] = [], also = false) => out.push(task({ key: `ev-${k}`, label, produces, href: packetHref(d, 'evidence'), support, done: ev(k) || also }));
  const fit = () => out.push(task({ key: 'fit', label: `Check ${n} against your buy box`, produces: 'a fits or doesn’t-fit call with the reason, in its deal packet', href: packetHref(d, 'plan'), support: [L.buyBox], done: !!(p.fit && p.fitWhy.trim()) }));
  const decide = () => out.push(task({ key: 'decide', label: `Decide on ${n}: pass, or go on to ${w === 'offer' ? 'an offer' : w === 'lien' && d.state === 'NV' ? 'the sale' : 'bidding'}`, produces: 'your decision and the reason, recorded in its evidence log', href: packetHref(d, 'decision'), support: [L.walkAway], done: log.gate === 'pass' || log.gate === 'proceed' }));
  const findNext = () => out.push(task({ key: 'next', label: d.kind === 'lien' ? 'Find your next lien sale' : 'Find your next property', produces: 'a new candidate saved in Analyze, starting at Researching', href: '#/find-deals', support: [L.findDeals, L.analyze], done: false }));

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
      out.push(task({ key: 'qa', label: `Ask your ${d.plan === 'commercial' ? 'broker' : 'agent'} and lender your questions about ${n}`, produces: 'their answers, with dates, in its deal packet', href: packetHref(d, 'pros'), support: [{ label: `Your team: ${agentName.toLowerCase()}`, href: '#/pros/agent' }, L.pro('lender')], done: p.qa.some((x) => x.q.trim() && x.a.trim()) }));
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
      area('terms', `Have the funds the sale requires for ${n}`, 'the money ready in the form the sale requires before sale day, noted in its evidence log', [L.guides]);
      out.push(task({ key: 'dates', label: `Put ${n}’s sale dates on its calendar`, produces: `${suggestedDates(d).slice(0, 3).join(', ').toLowerCase()} on one calendar, with the next one shown here`, href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(p, stage) }));
      const bidTask = task({
        key: 'bid',
        label: saleOver(p, now) ? (w === 'lien' && d.state === 'NV' ? `Sale day has passed for ${n}: were you picked?` : `Sale day has passed for ${n}: did you win?`) : w === 'lien' ? (d.state === 'NV' ? `Sign up for ${n} at the county’s sale` : `Bid on ${n} at the county’s sale`) : `Register and bid on ${n}, up to your maximum`,
        produces: saleOver(p, now) ? `your answer. If you ${w === 'lien' && d.state === 'NV' ? 'were picked, mark it and the payment step appears here' : 'won, mark it and the payment and recording steps appear here'}; if not, mark it passed` : w === 'lien' && d.state === 'NV' ? 'your name in for it at the sale (buyers are picked by a drawing or a show of hands), or a clean walk-away. If you’re picked, mark it and the payment deadline appears here' : 'a bid at or below your limit, or a clean walk-away. If you win, mark it won and the payment deadlines appear here',
        href: ROADMAP_HREF,
        advance: { stage: 'contract', label: w === 'lien' && d.state === 'NV' ? 'I was picked: mark it' : 'I won the bid: mark it won' },
        ...(saleOver(p, now) ? { advance2: { stage: 'passed' as DealStage, label: w === 'lien' && d.state === 'NV' ? 'I wasn’t picked: mark it passed' : 'I didn’t win (or didn’t bid): mark it passed' } } : {}),
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
      out.push(task({ key: 'deposit-sent', label: ticked(p, 'Earnest money due') ? `Confirm escrow received the earnest money for ${n}` : `Send the earnest money for ${n} and confirm receipt`, produces: 'escrow’s written confirmation that it received the deposit and any option fee your contract requires; mark the deposit roadmap task done', href: stepHref('deposit'), support: [L.negotiate], done: stepDone('deposit') }));
      out.push(task({ key: 'dates', label: `Put ${n}’s contract deadlines on its calendar`, produces: `every deadline from the signed contract on one calendar (${suggestedDates(d).join('; ')}), with the next one shown here`, href: packetHref(d, 'dates'), support: [L.negotiate], done: calendarComplete(p, stage) }));
      out.push(task({ key: 'inspection-complete', label: `Inspect ${n} before the ${d.plan === 'commercial' ? 'feasibility (due-diligence) period ends' : tx ? 'option period ends' : d.state === 'UT' ? 'Due Diligence Deadline' : 'inspection period ends'}`, produces: 'the report, repair bids and written decision before the deadline; mark the inspection roadmap task done', href: stepHref('inspect'), support: d.plan === 'commercial' ? [L.pro('environmental'), L.pro('appraiser')] : [L.pro('inspector'), L.caseStage('inspection', 'The inspection')], done: stepDone('inspect') }));
      out.push(task({ key: 'final-financing', label: `Get the loan approved for ${n}, or confirm your cash`, produces: 'final lender approval with conditions satisfied, or verified available closing funds; mark the final financing roadmap task done', href: stepHref('loan-approval'), support: [L.pro('lender')], done: stepDone('loan-approval') }));
      out.push(task({ key: 'appraisal-complete', label: `Resolve the appraisal for ${n}`, produces: 'the appraisal and any gap resolved before the deadline, or a documented cash-purchase choice not to obtain one', href: stepHref('appraise'), support: [L.pro('appraiser')], done: stepDone('appraise') }));
      out.push(task({ key: 'contract-title', label: `Review the title commitment for ${n}`, produces: 'requirements and HOA restrictions reviewed within the contract period; mark the title roadmap task done', href: stepHref('title'), support: [L.pro('title'), L.caseStage('appraisal', 'Appraisal and title')], done: stepDone('title') }));
      out.push(task({ key: 'bound-insurance', label: `Have insurance in place for ${n} by closing`, produces: 'written coverage confirmation and its start date; mark the insurance activation roadmap task done', href: stepHref('bind-insurance'), support: [L.pro('insurance')], done: stepDone('bind-insurance') }));
      out.push(task({ key: 'final-walkthrough', label: `Do the final walkthrough of ${n}`, produces: 'agreed repairs, condition and possession checked with your agent; mark the walkthrough roadmap task done', href: stepHref('walkthrough'), done: stepDone('walkthrough') }));
      out.push(task({ key: 'close', label: `Close on ${n}`, produces: 'the signed closing statement and the deed. Then mark it closed and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: 'It closed: mark it closed' }, support: [L.caseStage('closing', 'Closing')], done: false }));
    } else {
      // California homes of 1–4 units: a trustee-sale win isn't final until the eligible-bidder windows close (Civil Code 2924m).
      const ca2924m = d.kind === 'trustee' && d.state === 'CA';
      area('terms', `Pay for ${n} as the sale requires`, w === 'lien' ? 'the receipt, and the certificate you’re owed, in its evidence log' : certificateFirst(d) ? 'the receipt, and the certificate of sale you’re owed, in its evidence log' : 'the receipt, and the deed or certificate you’re owed, in its evidence log', [L.guides], p.dates.some((x) => sameDate(x.what, 'Payment deadline') && !!x.resolved));
      if (w === 'auction' && !ev('insurance')) area('insurance', `Insure ${n} right away`, certificateFirst(d) ? 'a policy that covers your interest from the day of the sale (ask your insurance agent how to insure a certificate of sale)*, in its evidence log' : 'a policy in your name from the day you own it, in its evidence log', [L.pro('insurance')]);
      out.push(task({ key: 'dates', label: w === 'lien' ? `Put ${n}’s payment deadline on its calendar` : `Put ${n}’s payment and recording deadlines on its calendar`, produces: w === 'lien' ? 'the payment deadline and when you’ll receive the certificate, on one calendar' : d.kind === 'irs' && certificateFirst(d) ? 'the payment deadline and when you’ll receive the certificate of sale, on one calendar' : ca2924m ? 'the payment deadline and when the deed should be recorded, on one calendar; for a home of 1–4 units, also the eligible-bidder windows (15 and 45 days after the sale), since your win isn’t final until they close, unless an exception applies*' : certificateFirst(d) ? 'the payment deadline and when the certificate of sale should be recorded, on one calendar' : 'the payment deadline and when the deed or certificate should be recorded, on one calendar', href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(p, stage) }));
      if (w === 'auction') {
        area('title', certificateFirst(d) ? `Have a title professional review ${n}’s certificate of sale` : `Have a title professional review ${n}’s deed`, certificateFirst(d) ? 'what the certificate gives you, what still stands against it, and when a deed can follow, in its evidence log' : 'what the deed gives you and what still stands against it, in its evidence log', [L.pro('title')]);
      }
      // A Nevada HOA or sheriff's sale gives a certificate of sale first; the deed comes only after the redemption period
      // (60 days, NRS 116.31166; 1 year, NRS 21.210), if no one redeems.
      const certFirst = certificateFirst(d);
      const recordedTick = w !== 'lien' && RECORDED_ROWS.some((x) => ticked(p, x));
      out.push(task({ key: 'record', label: recordedTick ? `The ${certFirst ? 'certificate of sale' : 'deed'} for ${n} is ${certFirst && d.kind === 'irs' ? 'in hand' : 'recorded'}: mark it to go on to the next tasks` : w === 'lien' ? `Get the certificate for ${n}` : certFirst ? (d.kind === 'irs' ? `Get the certificate of sale for ${n}` : `Get the certificate of sale for ${n} recorded`) : `Get the deed for ${n} recorded`, produces: w === 'lien' ? 'the certificate in your records. Then mark it in hand and the holding tasks appear here' : certFirst ? `the ${d.kind === 'irs' ? '' : 'recorded '}certificate of sale. The deed comes after the redemption period (${waitWord(d)} after the sale), if no one redeems. Then mark it ${d.kind === 'irs' ? 'received' : 'recorded'} and the tasks for the wait appear here` : 'the recorded deed. Then mark it recorded and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: w === 'lien' ? 'I have the certificate: mark it' : certFirst ? (d.kind === 'irs' ? 'I have the certificate of sale: mark it' : 'The certificate of sale is recorded: mark it') : 'The deed is recorded: mark it', ticks: w === 'lien' ? [] : [d.kind === 'taxSale' && d.state === 'NV' ? 'Treasurer’s deed recorded' : certFirst ? (d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') : d.kind === 'trustee' ? 'Deed recorded' : 'Deed or certificate recorded', ...RECORDED_ROWS], tickWho: d.kind === 'trustee' ? 'The trustee' : d.kind === 'taxSale' ? 'The county treasurer' : d.kind === 'irs' ? 'The IRS' : d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : 'The sheriff' }, support: [L.guides], done: false }));
    }
    return out;
  }

  if (stage === 'closed') {
    if (w === 'lien') {
      if (d.state === 'NV' && redeemedIn(p)) { out.push(lienPayoff(d, p)); return out; }
      out.push(task({ key: 'track', label: `Start tracking ${n}`, produces: 'its payoff date, interest and any later taxes on one record', href: stepHref('c-hold'), support: [L.guides], ...(d.state === 'NV' ? { advance2: lienPaidButton(d, stage) } : {}), done: stepDone('c-hold') }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the holding tasks: payoffs, interest and what to do if it’s never paid', href: ROADMAP_HREF, setStage: 'owned', done: false }));
      return out;
    }
    // It was redeemed: collect the payoff (your price plus what the law adds), then it's finished.
    if (certificateFirst(d) && redeemedIn(p)) {
      out.push(task({ key: 'payoff', label: `Collect the redemption money for ${n}`, produces: `the payoff (your price plus what the law adds) and a receipt. ${d.kind === 'court' ? 'The person who redeemed pays you, or pays the sheriff, who then pays you (NRS 21.230): ask the sheriff’s civil office whether it holds the money.' : d.kind === 'irs' ? 'The person who redeemed pays you; only if you can’t be found in the county is it paid to the IRS for you (26 U.S.C. 6337(b)(2)).' : 'The person who redeemed pays you (NRS 116.31166(3)). If the former owner redeemed, you sign a certificate of redemption for them, which is then recorded (116.31166(5)); if a lender redeemed, whoever ran the sale gives it a deed (116.31166(6)). Ask your attorney which applies.'} Then mark it finished`, href: packetHref(d, 'dates'), tick: { label: `I was repaid for ${n}: mark it finished`, row: REDEEMED_ROW, then: 'passed' }, undo: { label: 'Not redeemed after all? Undo', removeRow: REDEEMED_ROW }, answer: true, support: [L.pro('attorney')], done: ticked(p, REDEEMED_ROW) }));
      return out;
    }
    // A certificate first: insure it on day one, then the wait, then the deed (each done from the packet's dates).
    const firstWeek = task({ key: 'first-week', label: `Your first week with ${n}`, produces: certificateFirst(d) && !deedInHand(d) ? `insurance in your name and a dated record of its condition; locks, utilities and possession as your attorney advises ${ticked(p, 'Redemption period ends') ? 'until the deed is delivered' : 'while the redemption period runs'}*` : 'insurance in your name, locks changed, utilities on, and a dated record of its condition', href: stepHref('first-week'), support: d.plan === 'flip' ? [L.caseStage('after', 'Your first weeks')] : [L.afterClosing, L.caseStage('after', 'Your first weeks')], done: stepDone('first-week') });
    out.push(firstWeek);
    const nvTrustee = d.state === 'NV' && d.kind === 'trustee';
    const nvTax = d.state === 'NV' && d.kind === 'taxSale';
    if (w === 'auction' && !nvTrustee && !nvTax) out.push(task({ key: 'before-remodel', label: d.state === 'NV' && d.kind === 'trustee' ? `Check possession and title insurance for ${n} before you remodel` : `Check redemption, possession and title for ${n} before you remodel`, produces: d.state === 'NV' && d.kind === 'trustee' ? 'a written answer on lawful possession and when title insurance is available (there’s no owner buy-back after a Nevada trustee’s sale)' : 'a written answer on any redemption period, lawful possession and title insurance', href: stepHref('a-before-remodel'), support: [L.guides], done: stepDone('a-before-remodel') }));
    // The redemption wait comes first: the end date on its calendar, the property insured and kept up, no remodeling.
    if (certificateFirst(d)) {
      out.push(task({ key: 'redemption-wait', label: ticked(p, 'Redemption period ends') && !handled(p, 'Redemption period ends', now) ? `${n}’s redemption period ends ${prettyDay(p.dates.find((x) => sameDate(x.what, 'Redemption period ends'))?.when ?? '') || 'soon'}: it counts once that day has passed, then the deed comes` : `Wait out ${n}’s redemption period (${waitWord(d)} after the sale)`, produces: `the end date on its calendar, the property insured and maintained, ${d.kind === 'court' ? 'receipts for the taxes, assessments and earlier liens you pay (a redemption repays those, not upkeep)' : d.kind === 'irs' ? 'your records of what you pay (a redemption repays your price plus 20% a year, not taxes or upkeep)' : 'receipts for the taxes and upkeep you pay'}, and no remodeling until it ends. Once it has passed, mark “Redemption period ends” handled in its dates`, href: packetHref(d, 'dates'), advance2: redeemButton(d), support: [L.pro('attorney')], done: handled(p, 'Redemption period ends', now) || ticked(p, DEED_AFTER_WAIT) }));
      out.push(task({ key: 'deed', label: ticked(p, 'Redemption period ends') ? `Get the deed for ${n} and record it` : `Get the deed for ${n} and record it, if no one redeemed`, produces: `the deed from ${d.kind === 'hoa' ? 'whoever conducted the sale' : d.kind === 'irs' ? 'the IRS, for your certificate of sale' : 'the sheriff'}, recorded, then enter the date you got it and mark “${DEED_AFTER_WAIT}” handled in its dates${ticked(p, 'Redemption period ends') ? '' : '. If it was redeemed instead, you’re repaid your price plus what the law adds: press “It was redeemed” to collect the payoff'}`, href: packetHref(d, 'dates'), tick: { label: 'I have the deed: mark it handled', row: DEED_AFTER_WAIT, who: deedWho(d) }, ...(ticked(p, 'Redemption period ends') ? {} : { advance2: redeemButton(d) }), support: [L.pro('title')], done: ticked(p, DEED_AFTER_WAIT) }));
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
      out.push(task({ key: 'window', label: win.days ? `Put the challenge window’s end on ${n}’s calendar` : `Put the recovery-suit window’s end on ${n}’s calendar`, produces: win.days ? `the date the challenge window ends, in its Key dates: 30 days after the trustee’s deed was recorded${end ? ` (${prettyDay(end)})` : ''}, or 90 days after the sale${late ? ` (${prettyDay(late)})` : ''} if anyone didn’t get proper notice (NRS 107.080(5), (6)). Ask your title company which applies, and plan repairs and new contracts for after it, as your attorney advises` : 'its end date in its dates (2 years after the Treasurer’s deed was delivered to you, NRS 361.600), and a title company’s answer on when it will insure', href: packetHref(d, 'dates'), support: [L.pro('title')], done: p.dates.some((x) => sameDate(x.what, win.row) && (!!x.when || !!x.resolved)) }));
    }
    if (nvTax) out.push(task({ key: 'before-remodel', label: `Check the recovery-suit window, possession and title for ${n} before you remodel`, produces: 'a written answer on the 2-year recovery-suit window (no owner buy-back after a Nevada tax sale, NRS 361.600), lawful possession and when a title company will insure', href: stepHref('a-before-remodel'), support: [L.guides, L.pro('title')], done: stepDone('a-before-remodel') }));
    if (nvTrustee) out.push(task({ key: 'before-remodel', label: d.state === 'NV' && d.kind === 'trustee' ? `Check possession and title insurance for ${n} before you remodel` : `Check redemption, possession and title for ${n} before you remodel`, produces: d.state === 'NV' && d.kind === 'trustee' ? 'a written answer on lawful possession and when title insurance is available (there’s no owner buy-back after a Nevada trustee’s sale)' : 'a written answer on any redemption period, lawful possession and title insurance', href: stepHref('a-before-remodel'), support: [L.guides], done: stepDone('a-before-remodel') }));
    if (d.plan === 'flip') {
      // A flip gets the work and the sale, not rental tasks.
      out.push(task({ key: 'repairs', label: certificateFirst(d) && !deedInHand(d) ? `Get repair bids for ${n}, and start the work once you have the deed` : windowOpen ? `Get repair bids for ${n} now; start the work after the challenge window ends${windowWords}` : `Get repair bids for ${n} and start the work`, produces: 'written bids, permits where needed, and the work under way', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') && !windowOpen }));
      out.push(task({ key: 'owned', label: `Track ${n}’s repair and holding costs against your budget`, produces: flipBudget(d) ? 'a monthly record of what you pay (with $0 rent), shown against the budget in your Fix and sell numbers (repairs, holding and any loan interest and points)' : 'a monthly record of what you pay (with $0 rent), to compare yourself with the repairs and holding costs in Fix and sell (Analyze)', href: packetHref(d, 'owned'), done: !!owned[d.id] }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the selling tasks: list it at a price backed by sold comps, and record the sale', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
      return out;
    }
    if (liveIn(d)) {
      out.push(task({ key: 'rental-repairs', label: `Finish the repairs ${n} needs`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') }));
      out.push(task({ key: 'owned', label: `Start tracking ${n}’s real costs`, produces: 'a monthly record of what your home actually costs, against what you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
      out.push(task({ key: 'stage', label: `Mark ${n} as your home`, produces: 'the monthly tasks: record your costs, and review them against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
      return out;
    }
    out.push(task({ key: 'rental-repairs', label: certificateFirst(d) && !deedInHand(d) ? `Once you have the deed, finish the repairs ${n} needs before renting` : windowOpen ? `Once the challenge window ends${windowWords}, finish the repairs ${n} needs before renting` : `Finish the repairs ${n} needs before renting`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') && !windowOpen }));
    out.push(task({ key: 'rental-lease', label: `Rent ${n} lawfully, or confirm its existing tenancy`, produces: 'screening, disclosures, a lawful lease and tenant records reviewed with your team; mark the rental roadmap task done', href: stepHref('rent'), support: [L.afterClosing], done: stepDone('rent') }));
    out.push(task({ key: 'owned', label: `Start tracking ${n}’s real rent and costs`, produces: 'a monthly record of actual rent and costs, against the cash flow you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
    out.push(task({ key: 'stage', label: `Mark ${n} as owned and operating`, produces: 'the monthly tasks: record the rent and costs, and review it against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
    return out;
  }

  if (stage === 'owned') {
    if (w === 'lien') {
      if (d.state === 'NV' && redeemedIn(p)) { out.push(lienPayoff(d, p)); return out; }
      out.push(task({ key: 'hold', label: `Track ${n}’s payoff, interest and later taxes`, produces: 'an up-to-date record of what you’re owed', href: stepHref('c-hold'), support: [L.guides], ...(d.state === 'NV' ? { advance2: lienPaidButton(d, stage) } : {}), done: stepDone('c-hold') }));
      out.push(task({ key: 'decide-unpaid', label: `Decide what to do if ${n} is never paid`, produces: 'a dated plan, with your attorney, for an unpaid lien', href: stepHref('c-decide'), support: [L.pro('attorney')], done: stepDone('c-decide') }));
    } else if (d.plan === 'flip') {
      out.push(task({ key: 'list', label: `List ${n} for sale at a price backed by sold comps`, produces: 'recent sales of similar homes nearby and a net sheet (price, commission, closing costs, loan payoff and tax), then the listing', href: stepHref('exit-sell'), support: [L.pro('agent'), L.pro('cpa')], done: stepDone('exit-sell') || !!owned[d.id]?.sold }));
      out.push(task({ key: 'sold', label: `Record ${n}’s sale and your actual profit`, produces: 'the closing date and sale price recorded in its deal packet, and a rough profit against the one you planned', href: packetHref(d, 'owned'), support: [L.pro('cpa')], done: !!owned[d.id]?.sold }));
    } else {
      const month = lastMonth(now);
      out.push(task({ key: 'month', label: liveIn(d) ? `Record last month’s costs for ${n}` : `Record last month’s rent and costs for ${n}`, produces: liveIn(d) ? 'what your home actually cost last month, against what you planned' : 'its actual cash flow for the month, against what you planned', href: packetHref(d, 'owned'), support: [L.caseStage('run', 'Run it and review')], done: !!owned[d.id]?.months.some((m) => m.month >= month) }));
      out.push(task({ key: 'review', label: `Review ${n} against your goal`, produces: 'a written decision: keep it as it is, improve it, refinance or sell', href: stepHref('review'), support: [L.pro('cpa')], done: stepDone('review') }));
    }
    findNext();
    return out;
  }

  findNext();
  return out;
}

/**
 * The one thing to do next on a deal: a deadline within a week, an open question or a professional's answer you're
 * waiting for comes first; then the first unfinished task of its stage.
 */
export function dealNextTask(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date(), stage: DealStage = stageOf(d)): PlanTask {
  if (stage !== 'passed') {
    // Sale day has passed with the deal still before the sale: whether you won comes first.
    if (stage === 'offer' && wayOf(d) !== 'offer' && saleOver(p, now)) {
      const t = stageTasks(d, stage, p, now).find((x) => x.key === 'bid');
      if (t) return t;
    }
    // Still researching when the sale went by: did you bid and win? (Never "overdue: sale day".)
    if (stage === 'researching' && wayOf(d) !== 'offer' && saleOver(p, now)) {
      const n = d.name || 'this property';
      const picked = wayOf(d) === 'lien' && d.state === 'NV';
      return task({ key: 'bid', label: picked ? `Sale day has passed for ${n}: were you picked?` : `Sale day has passed for ${n}: did you win?`, produces: picked ? 'your answer. If you were picked, mark it and the payment step appears here; if not, mark it passed' : 'your answer. If you won, mark it and the payment and recording steps appear here; if not, mark it passed', href: packetHref(d, 'decision'), advance: { stage: 'contract', label: picked ? 'I was picked: mark it' : 'I won the bid: mark it won' }, advance2: { stage: 'passed', label: picked ? 'I wasn’t picked: mark it passed' : 'I didn’t win (or didn’t bid): mark it passed' }, answer: true, urgent: true, support: [], done: false });
    }
    // Before you've won, a date that only matters after the sale isn't a reminder yet; a sale day that has passed isn't
    // a reminder at all; and once the deed is in hand, the redemption period is behind you.
    const early = stage === 'researching' || stage === 'offer';
    const nd = nextDate(remindable(p, now, early, behindStage(d, stage)), now);
    if (nd && nd.days <= 7) {
      const ended = nd.days < 0 ? windowEnded(nd.what, -nd.days, d.kind) : null;
      const deedTick = stage === 'closed' && certificateFirst(d) && sameDate(nd.what, DEED_AFTER_WAIT) && ticked(p, 'Redemption period ends') ? { label: 'I have the deed: mark it handled', row: nd.what, who: deedWho(d) } : undefined;
      const paidTick = stage === 'contract' && nd.days <= 0 && sameEvent(nd.what, 'Payment deadline') ? { label: 'I paid: mark it handled', row: nd.what } : stage === 'contract' && nd.days <= 0 && (sameEvent(nd.what, 'Earnest money due') || sameEvent(nd.what, 'Option fee')) ? { label: 'I sent it: mark it handled', row: nd.what } : sameDate(nd.what, 'SID certificate payoff') && nd.days <= 0 ? { label: 'I paid it: mark it handled', row: nd.what } : undefined;
      const sidNone = sameDate(nd.what, 'SID certificate payoff') ? { label: 'The sale notice listed no SID certificate: remove it', removeRow: nd.what } : undefined;
      const sidLate = nd.days < 0 && sameDate(nd.what, 'SID certificate payoff') && d.state === 'NV';
      const text = sidLate ? `Overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}: the SID certificate payoff for ${d.name || 'this property'}. If it isn’t paid, the sale is void (NRS 361.595(6)): call the treasurer today.` : ended ? `${ended.text[0].toUpperCase()}${ended.text.slice(1)}: ${ended.then}.` : `${nd.days < 0 ? `Overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}` : nd.days === 0 ? 'Today' : nd.days === 1 ? 'Tomorrow' : `In ${nd.days} days`}: ${nd.what} for ${d.name || 'this property'}${nd.who ? ` (who: ${nd.who})` : ''}.`;
      const redeemable = stage === 'closed' && certificateFirst(d) && (sameDate(nd.what, 'Redemption period ends') || (sameDate(nd.what, DEED_AFTER_WAIT) && !ticked(p, 'Redemption period ends')));
      // The stage's own event (the deed recorded, the closing): its "mark it" button comes with the reminder.
      const own = stage === 'contract' && (RECORDED_ROWS.some((r) => sameEvent(nd.what, r)) || sameEvent(nd.what, 'Closing')) ? stageTasks(d, stage, p, now).find((t) => t.advance)?.advance : undefined;
      // CODE-5: the sale day (or the day the offer is accepted) itself: its answer buttons come with the reminder.
      const today = stage === 'offer' && nd.days === 0 && (wayOf(d) === 'offer' ? ['Offer accepted', 'Acceptance'] : ['Sale day']).some((n) => sameEvent(nd.what, n));
      const todayAdvance = today ? stageTasks(d, stage, p, now).find((t) => t.advance)?.advance : undefined;
      const todayLost = today && wayOf(d) !== 'offer' ? { stage: 'passed' as DealStage, label: wayOf(d) === 'lien' && d.state === 'NV' ? 'I wasn’t picked: mark it passed' : 'I didn’t win (or didn’t bid): mark it passed' } : undefined;
      return { key: 'date', label: text, produces: ended ? `a written answer on whether ${/suit/i.test(ended.tick ?? '') ? 'a suit was filed' : sameDate(nd.what, 'Redemption period ends') ? 'anyone redeemed' : 'it’s still unpaid'}, noted in its deal packet` : 'the deadline met, with what you did noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, ...(own ? { advance: own } : todayAdvance ? { advance: todayAdvance } : {}), ...(todayLost ? { advance2: todayLost } : {}), ...(ended?.tick ? { tick: { label: ended.tick, row: nd.what }, answer: true } : paidTick ? { tick: paidTick } : deedTick ? { tick: deedTick } : {}), ...(sidNone ? { undo: sidNone } : {}), ...(redeemable ? { advance2: redeemButton(d) } : wayOf(d) === 'lien' && d.state === 'NV' && (stage === 'closed' || stage === 'owned') && !redeemedIn(p) ? { advance2: lienPaidButton(d, stage) } : {}), support: [], done: false, urgent: !ended && !deedTick, text };
    }
    const log = loadLog(`analyzed:${d.id}`);
    const openRow = areasFor(d.kind).map((a) => ({ a, r: log.rows[a.key] })).find(({ r }) => r?.open && !r.done);
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
  const t = tasks.find((x) => !x.done) ?? tasks[tasks.length - 1];
  // Every date it needs is in: what's left is the review for this stage.
  if (t.key === 'dates' && !t.done && calendarReady(p, stage)) return { ...t, label: `Confirm ${d.name || 'this property'}’s calendar for this stage`, produces: 'a tick on “I checked every applicable deadline” under Key dates, once each date matches the official notice or contract', text: `Confirm ${d.name || 'this property'}’s calendar for this stage.` };
  return t;
}
