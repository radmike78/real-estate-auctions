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
import { irsWithoutRedemption, sameDate, roleTitleFor, loadPacket, calendarComplete, nextDate, savedNumbers, hasSavedNumbers, flipBudget, suggestedDates, type PacketData } from './dealPacket';
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
const localDay = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const handled = (p: PacketData, what: string, now: Date) => p.dates.some((x) => sameDate(x.what, what) && !!x.resolved && !!x.when && x.when < localDay(now));
/** A home you'll live in (Decide: a home loan you'd live in), bought by offer, with no rent typed for it: no rental tasks. */
function liveIn(d: { kind: Deal['kind']; plan?: Deal['plan']; id?: string }): boolean {
  if (!d.id) return false;
  if (d.plan !== 'rent' || wayOf(d) !== 'offer' || !investorProfile().ownerOccupant) return false;
  try {
    const key = `fsf.calc.rent.${d.id}-offer.v1`;
    const r = JSON.parse(localStorage.getItem(key) ?? 'null') as { monthlyRent?: unknown } | null;
    return !(readConfirmed(key).has('monthlyRent') && typeof r?.monthlyRent === 'number' && r.monthlyRent > 0);
  } catch { return true; }
}

/** Dates that only matter once you've won (they come after the sale): no reminder for them before then. */
const AFTER_SALE = ['Certificate of sale recorded', 'Certificate of sale received', 'Redemption period ends', DEED_AFTER_WAIT, 'Deed recorded', 'Deed or certificate recorded', 'Treasurer’s deed recorded', 'Recovery-suit window ends', 'Challenge window ends', 'Rescission window ends', 'Intent-to-bid window ends', 'Eligible bid deadline (45 days)', 'Earliest you may act (unpaid lien)', 'Certificate expires'];
export const afterSale = (what: string) => AFTER_SALE.some((n) => sameDate(what, n));
/** The packet's dates that can be a reminder now: before winning, not the post-sale ones; never a sale day that has
 *  passed; and once the deed is ticked, not the redemption period. */
export const remindable = (p: PacketData, now: Date, early: boolean): PacketData => {
  const deed = ticked(p, DEED_AFTER_WAIT);
  return { ...p, dates: p.dates.filter((x) => !(early && afterSale(x.what)) && !(sameDate(x.what, 'Sale day') && !!x.when && x.when < localDay(now)) && !(deed && sameDate(x.what, 'Redemption period ends'))) };
};
/** Sale day is marked handled, or its date has passed: time to say whether you won. */
const saleOver = (p: PacketData, now: Date) => p.dates.some((x) => sameDate(x.what, 'Sale day') && (x.when ? x.when < localDay(now) || (!!x.resolved && x.when <= localDay(now)) : !!x.resolved));
/** A row marked handled, with or without its date (the deed: you have it). */
const ticked = (p: PacketData, what: string) => p.dates.some((x) => sameDate(x.what, what) && !!x.resolved);
/** A certificate-first deal whose deed row is ticked in its packet. */
const deedInHand = (d: { kind: Deal['kind']; state?: Deal['state']; id?: string; plan?: Deal['plan'] }) => !!d.id && certificateFirst(d) && ticked(loadPacket(`analyzed:${d.id}`), DEED_AFTER_WAIT);

/** The stage's name for this kind of sale (you make an offer on a listing, but bid at an auction) and plan. */
export function stageLabel(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan']; state?: Deal['state']; id?: string }): string {
  const w = wayOf(d);
  switch (stage) {
    case 'researching': return 'Researching';
    case 'offer': return w === 'offer' ? 'Preparing an offer' : w === 'lien' && d.state === 'NV' ? 'Preparing for the sale' : 'Preparing to bid';
    case 'contract': return w === 'offer' ? 'Under contract' : w === 'lien' && d.state === 'NV' ? 'Picked: paying' : 'Won: paying and recording';
    case 'closed': return w === 'offer' ? 'Closed' : w === 'lien' ? 'Certificate in hand' : certificateFirst(d) && !deedInHand(d) ? (d.kind === 'irs' ? 'Certificate of sale received' : 'Certificate of sale recorded') : 'Deed recorded';
    case 'owned': return w === 'lien' ? 'Holding the certificate' : d.plan === 'flip' ? 'Fixing and selling' : liveIn(d) ? 'Living there' : 'Owned and operating';
    case 'passed': return 'Passed';
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
    case 'contract': return w === 'offer' ? 'The seller accepted your offer. The contract’s deadlines are running.' : w === 'lien' && d.state === 'NV' ? 'You were picked. The payment deadline is running.' : 'You won the bid. Payment and recording deadlines are running.';
    case 'closed': return w === 'offer' ? 'It’s yours: insurance, locks, utilities and repairs come first.' : w === 'lien' ? 'You hold the certificate: track it until it’s paid off.' : deedIn ? 'You have the deed: make sure it’s recorded, get title insurance, then start the repairs.' : certificateFirst(d) ? `A certificate of sale first: insure and maintain it, and hold off on remodeling until the redemption period (${waitWord(d)} after the sale) ends and you have the deed.` : 'The deed is yours: check redemption, possession and title before you remodel.';
    case 'owned': return w === 'lien' ? 'Tracking payoffs, interest and what to do with unpaid liens.' : liveIn(d) ? 'Living there: recording what your home really costs each month.' : d.plan === 'flip' ? 'Fixing it up and selling it: tracking repair and holding costs against your budget.' : 'Renting or holding it: recording real rent and costs each month.';
    case 'passed': return certificateFirst(d) ? 'You walked away, were outbid, or it was redeemed and you were repaid. Each is a fine result: find your next property.' : 'You walked away. A good result when the evidence says no.';
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
  advance?: { stage: DealStage; label: string };
  /** The other answer to the same event: "I didn't win: mark it passed". */
  advance2?: { stage: DealStage; label: string };
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
  return { support: [], ...t, text: t.text ?? `${t.label}.` };
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
        label: saleOver(p, now) ? (w === 'lien' && d.state === 'NV' ? `Sale day has passed: were you picked for ${n}?` : `Sale day has passed: did you win ${n}?`) : w === 'lien' ? (d.state === 'NV' ? `Sign up for ${n} at the county’s sale` : `Bid on ${n} at the county’s sale`) : `Register and bid on ${n}, up to your maximum`,
        produces: saleOver(p, now) ? `your answer. If you ${w === 'lien' && d.state === 'NV' ? 'were picked, mark it and the payment step appears here' : 'won, mark it and the payment and recording steps appear here'}; if not, mark it passed` : w === 'lien' && d.state === 'NV' ? 'your name in for it at the sale (buyers are picked by a drawing or a show of hands), or a clean walk-away. If you’re picked, mark it and the payment deadline appears here' : 'a bid at or below your limit, or a clean walk-away. If you win, mark it won and the payment deadlines appear here',
        href: ROADMAP_HREF,
        advance: { stage: 'contract', label: w === 'lien' && d.state === 'NV' ? 'I was picked: mark it' : 'I won the bid: mark it won' },
        ...(saleOver(p, now) ? { advance2: { stage: 'passed' as DealStage, label: w === 'lien' && d.state === 'NV' ? 'I wasn’t picked: mark it passed' : 'I didn’t win: mark it passed' } } : {}),
        support: [L.guides, w === 'lien' && d.state === 'NV' ? L.practiceLien : L.practiceAuction],
        done: false,
      });
      if (saleOver(p, now)) out.unshift(bidTask, task({ key: 'lost', label: w === 'lien' && d.state === 'NV' ? `Not picked for ${n}? Mark it passed` : `Didn’t win ${n}? Mark it passed`, produces: 'the deal moved to Passed, with its record kept', href: packetHref(d, 'decision'), setStage: 'passed', done: false }));
      if (!saleOver(p, now)) out.push(bidTask);
    }
    return out;
  }

  if (stage === 'contract') {
    if (w === 'offer') {
      out.push(task({ key: 'dates', label: `Put ${n}’s contract deadlines on its calendar`, produces: `every deadline from the signed contract on one calendar (${suggestedDates(d).join('; ')}), with the next one shown here`, href: packetHref(d, 'dates'), support: [L.negotiate], done: calendarComplete(p, stage) }));
      out.push(task({ key: 'deposit-sent', label: `Send the earnest money for ${n} and confirm receipt`, produces: 'escrow confirms receipt of the deposit and any option fee required by your contract; mark the deposit roadmap task done', href: stepHref('deposit'), support: [L.negotiate], done: stepDone('deposit') }));
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
      out.push(task({ key: 'dates', label: w === 'lien' ? `Put ${n}’s payment deadline on its calendar` : `Put ${n}’s payment and recording deadlines on its calendar`, produces: w === 'lien' ? 'the payment deadline and when you’ll receive the certificate, on one calendar' : d.kind === 'irs' && certificateFirst(d) ? 'the payment deadline and when you’ll receive the certificate of sale, on one calendar' : ca2924m ? 'the payment deadline and when the deed should be recorded, on one calendar; for a home of 1–4 units, also the eligible-bidder windows (15 and 45 days after the sale), since your win isn’t final until they close, unless an exception applies*' : certificateFirst(d) ? 'the payment deadline and when the certificate of sale should be recorded, on one calendar' : 'the payment deadline and when the deed or certificate should be recorded, on one calendar', href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(p, stage) }));
      area('terms', `Pay for ${n} as the sale requires`, w === 'lien' ? 'the receipt, and the certificate you’re owed, in its evidence log' : certificateFirst(d) ? 'the receipt, and the certificate of sale you’re owed, in its evidence log' : 'the receipt, and the deed or certificate you’re owed, in its evidence log', [L.guides], p.dates.some((x) => sameDate(x.what, 'Payment deadline') && !!x.resolved));
      if (w === 'auction') {
        if (!ev('insurance')) area('insurance', `Insure ${n} right away`, 'a policy in your name from the day you own it, in its evidence log', [L.pro('insurance')]);
        area('title', certificateFirst(d) ? `Have a title professional review ${n}’s certificate of sale` : `Have a title professional review ${n}’s deed`, certificateFirst(d) ? 'what the certificate gives you, what still stands against it, and when a deed can follow, in its evidence log' : 'what the deed gives you and what still stands against it, in its evidence log', [L.pro('title')]);
      }
      // A Nevada HOA or sheriff's sale gives a certificate of sale first; the deed comes only after the redemption period
      // (60 days, NRS 116.31166; 1 year, NRS 21.210), if no one redeems.
      const certFirst = certificateFirst(d);
      out.push(task({ key: 'record', label: w === 'lien' ? `Get the certificate for ${n}` : certFirst ? (d.kind === 'irs' ? `Get the certificate of sale for ${n}` : `Get the certificate of sale for ${n} recorded`) : `Get the deed for ${n} recorded`, produces: w === 'lien' ? 'the certificate in your records. Then mark it in hand and the holding tasks appear here' : certFirst ? `the ${d.kind === 'irs' ? '' : 'recorded '}certificate of sale. The deed comes after the redemption period (${waitWord(d)} after the sale), if no one redeems. Then mark it ${d.kind === 'irs' ? 'received' : 'recorded'} and the tasks for the wait appear here` : 'the recorded deed. Then mark it recorded and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: w === 'lien' ? 'I have the certificate: mark it' : certFirst ? (d.kind === 'irs' ? 'I have the certificate of sale: mark it' : 'The certificate of sale is recorded: mark it') : 'The deed is recorded: mark it' }, support: [L.guides], done: false }));
    }
    return out;
  }

  if (stage === 'closed') {
    if (w === 'lien') {
      out.push(task({ key: 'track', label: `Start tracking ${n}`, produces: 'its payoff date, interest and any later taxes on one record', href: stepHref('c-hold'), support: [L.guides], done: stepDone('c-hold') }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the holding tasks: payoffs, interest and what to do if it’s never paid', href: ROADMAP_HREF, setStage: 'owned', done: false }));
      return out;
    }
    // A certificate first: insure it on day one, then the wait, then the deed (each done from the packet's dates).
    const firstWeek = task({ key: 'first-week', label: `Your first week with ${n}`, produces: certificateFirst(d) && !deedInHand(d) ? 'insurance in your name and a dated record of its condition; locks, utilities and possession as your attorney advises while the redemption period runs*' : 'insurance in your name, locks changed, utilities on, and a dated record of its condition', href: stepHref('first-week'), support: d.plan === 'flip' ? [L.caseStage('after', 'Your first weeks')] : [L.afterClosing, L.caseStage('after', 'Your first weeks')], done: stepDone('first-week') });
    if (certificateFirst(d)) out.push(firstWeek);
    if (w === 'auction') out.push(task({ key: 'before-remodel', label: `Check redemption, possession and title for ${n} before you remodel`, produces: 'a written answer on any redemption period, lawful possession and title insurance', href: stepHref('a-before-remodel'), support: [L.guides], done: stepDone('a-before-remodel') }));
    // The redemption wait comes first: the end date on its calendar, the property insured and kept up, no remodeling.
    if (certificateFirst(d)) {
      out.push(task({ key: 'redemption-wait', label: `Wait out ${n}’s redemption period (${waitWord(d)} after the sale)`, produces: `the end date on its calendar, the property insured and maintained, ${d.kind === 'court' ? 'receipts for the taxes, assessments and earlier liens you pay (a redemption repays those, not upkeep)' : d.kind === 'irs' ? 'your records of what you pay (a redemption repays your price plus 20% a year, not taxes or upkeep)' : 'receipts for the taxes and upkeep you pay'}, and no remodeling until it ends. Once it has passed, mark “Redemption period ends” handled in its dates`, href: packetHref(d, 'dates'), support: [L.pro('attorney')], done: handled(p, 'Redemption period ends', now) || ticked(p, DEED_AFTER_WAIT) }));
      out.push(task({ key: 'deed', label: `Get the deed for ${n} and record it, if no one redeemed`, produces: `the deed from ${d.kind === 'hoa' ? 'whoever conducted the sale' : d.kind === 'irs' ? 'the IRS, for your certificate of sale' : 'the sheriff'}, recorded, then enter the date you got it and mark “${DEED_AFTER_WAIT}” handled in its dates. If it was redeemed instead, you’re repaid your price plus what the law adds: record the payoff and mark the deal passed`, href: packetHref(d, 'dates'), support: [L.pro('title')], done: ticked(p, DEED_AFTER_WAIT) }));
    } else out.push(firstWeek);
    if (d.plan === 'flip') {
      // A flip gets the work and the sale, not rental tasks.
      out.push(task({ key: 'repairs', label: certificateFirst(d) ? `Get repair bids for ${n}, and start the work once you have the deed` : `Get repair bids for ${n} and start the work`, produces: 'written bids, permits where needed, and the work under way', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') }));
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
    out.push(task({ key: 'rental-repairs', label: certificateFirst(d) ? `Once you have the deed, finish the repairs ${n} needs before renting` : `Finish the repairs ${n} needs before renting`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: stepHref('repairs'), support: [L.pro('contractor')], done: stepDone('repairs') }));
    out.push(task({ key: 'rental-lease', label: `Rent ${n} lawfully, or confirm its existing tenancy`, produces: 'screening, disclosures, a lawful lease and tenant records reviewed with your team; mark the rental roadmap task done', href: stepHref('rent'), support: [L.afterClosing], done: stepDone('rent') }));
    out.push(task({ key: 'owned', label: `Start tracking ${n}’s real rent and costs`, produces: 'a monthly record of actual rent and costs, against the cash flow you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
    out.push(task({ key: 'stage', label: `Mark ${n} as owned and operating`, produces: 'the monthly tasks: record the rent and costs, and review it against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
    return out;
  }

  if (stage === 'owned') {
    if (w === 'lien') {
      out.push(task({ key: 'hold', label: `Track ${n}’s payoff, interest and later taxes`, produces: 'an up-to-date record of what you’re owed', href: stepHref('c-hold'), support: [L.guides], done: stepDone('c-hold') }));
      out.push(task({ key: 'decide-unpaid', label: `Decide what to do if ${n} is never paid`, produces: 'a dated plan, with your attorney, for an unpaid lien', href: stepHref('c-decide'), support: [L.pro('attorney')], done: stepDone('c-decide') }));
    } else if (d.plan === 'flip') {
      out.push(task({ key: 'list', label: `List ${n} for sale at a price backed by sold comps`, produces: 'recent sales of similar homes nearby and a net sheet (price, commission, closing costs, loan payoff and tax), then the listing', href: stepHref('exit-sell'), support: [L.pro('agent'), L.pro('cpa')], done: stepDone('exit-sell') }));
      out.push(task({ key: 'sold', label: `Record ${n}’s sale and your actual profit`, produces: 'the closing statement, and your real profit against the walk-away price you planned', href: ROADMAP_HREF, support: [L.pro('cpa')], done: false }));
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
      return task({ key: 'bid', label: `Sale day has passed for ${n}: did you bid and win?`, produces: 'your answer. If you won, mark it and the payment and recording steps appear here; if not, mark it passed', href: packetHref(d, 'decision'), advance: { stage: 'contract', label: 'I won: mark it won' }, advance2: { stage: 'passed', label: 'I didn’t bid or win: mark it passed' }, support: [], done: false });
    }
    // Before you've won, a date that only matters after the sale isn't a reminder yet; a sale day that has passed isn't
    // a reminder at all; and once the deed is in hand, the redemption period is behind you.
    const early = stage === 'researching' || stage === 'offer';
    const nd = nextDate(remindable(p, now, early), now);
    if (nd && nd.days <= 7) {
      const text = nd.days < 0 && sameDate(nd.what, 'Redemption period ends') ? `The redemption period ended ${-nd.days} day${nd.days === -1 ? '' : 's'} ago: if no one redeemed, mark it handled and ask for the deed.` : `${nd.days < 0 ? `Overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}` : nd.days === 0 ? 'Today' : nd.days === 1 ? 'Tomorrow' : `In ${nd.days} days`}: ${nd.what}.${nd.who ? ` Who: ${nd.who}.` : ''}`;
      return { key: 'date', label: text, produces: 'the deadline met, with what you did noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, support: [], done: false, urgent: true, text };
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
  return tasks.find((t) => !t.done) ?? tasks[tasks.length - 1];
}
