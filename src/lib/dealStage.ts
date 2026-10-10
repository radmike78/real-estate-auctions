// Where a saved deal stands (researching, preparing an offer or bid, under contract or won, closed, owned and
// operating, or passed) and the tasks that belong to that stage. The stage picks the deal's next action in My plan:
// a new candidate gets research and verification tasks, and the accepted-offer deadlines only appear once the seller
// has accepted. Each task says what you'll have when it's done, and links the lessons and practice that help.
//
// Site rules: tasks never involve contacting a homeowner, an occupant or a former owner. Official sellers, your own
// team, public records and the county only.
import { CURRENT_KEY, DEAL_STAGES, isDealStage, loadDeals, saveDeals, type Deal, type DealStage } from './analyze';
import { loadPacket, calendarComplete, nextDate, savedNumbers, hasSavedNumbers, flipBudget, suggestedDates, type PacketData } from './dealPacket';
import { EVIDENCE_AREAS, loadLog, type EvidenceLog } from './evidence';
import { loadOwned, type Owned } from './owned';
import { proGuideByKey } from './proGuide';
import { dealProgress, progressChanged } from './roadmapState';

export { DEAL_STAGES, isDealStage, type DealStage };

type Way = 'offer' | 'auction' | 'lien';
/** How the property is bought: an offer on a listing, a bid at an auction, or a lien certificate. */
export const wayOf = (d: Pick<Deal, 'kind'>): Way => (d.kind === 'lien' ? 'lien' : d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short' ? 'offer' : 'auction');

/** The stage's name for this kind of sale (you make an offer on a listing, but bid at an auction) and plan. */
export function stageLabel(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan'] }): string {
  const w = wayOf(d);
  switch (stage) {
    case 'researching': return 'Researching';
    case 'offer': return w === 'offer' ? 'Preparing an offer' : 'Preparing to bid';
    case 'contract': return w === 'offer' ? 'Under contract' : 'Won: paying and recording';
    case 'closed': return w === 'offer' ? 'Closed' : w === 'lien' ? 'Certificate in hand' : 'Deed recorded';
    case 'owned': return w === 'lien' ? 'Holding the certificate' : d.plan === 'flip' ? 'Fixing and selling' : 'Owned and operating';
    case 'passed': return 'Passed';
  }
}

/** One line on what the stage means, for the stage picker. */
export function stageHint(stage: DealStage, d: Pick<Deal, 'kind'> & { plan?: Deal['plan'] }): string {
  const w = wayOf(d);
  switch (stage) {
    case 'researching': return 'Checking whether it fits, before any offer or bid. Check listing, registration and seller deadlines while you research.';
    case 'offer': return w === 'offer' ? 'It checked out: you’re setting your price, the earnest money and your questions before you offer.' : 'It checked out: you’re setting your maximum bid and getting the funds ready.';
    case 'contract': return w === 'offer' ? 'The seller accepted your offer. The contract’s deadlines are running.' : 'You won the bid. Payment and recording deadlines are running.';
    case 'closed': return w === 'offer' ? 'It’s yours: insurance, locks, utilities and repairs come first.' : w === 'lien' ? 'You hold the certificate: track it until it’s paid off.' : 'The deed is yours: check redemption, possession and title before you remodel.';
    case 'owned': return w === 'lien' ? 'Tracking payoffs, interest and what to do with unpaid liens.' : d.plan === 'flip' ? 'Fixing it up and selling it: tracking repair and holding costs against your budget.' : 'Renting or holding it: recording real rent and costs each month.';
    case 'passed': return 'You walked away. A good result when the evidence says no.';
  }
}

/** The roadmap steps (roadmap.ts) that belong to each stage, so the roadmap's next step follows the deal's stage. */
export const STAGE_STEPS: Record<DealStage, string[]> = {
  researching: ['find', 'evidence', 'quotes', 'agree', 'a-find', 'a-research', 'a-value', 'a-insure', 'c-sale', 'c-research', 'c-budget'],
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
const ROADMAP_HREF = '#/toolkit/roadmap';
const L = {
  analyze: { label: 'Lesson: Analyzing a deal', href: '#/learn/analyze' },
  rentMission: { label: 'Practice missions: would you buy this $265,000 rental?', href: '#/practice/drills/rental-265' },
  negotiate: { label: 'Lesson: Negotiating and structuring deals', href: '#/learn/negotiate' },
  walkAway: { label: 'Lesson: When to walk away', href: '#/learn/walk-away' },
  afterClosing: { label: 'Lesson: Running a rental', href: '#/learn/after-closing' },
  guides: { label: 'Your sale guide', href: '#/playbooks' },
  findDeals: { label: 'Official sources for your county', href: '#/find-deals' },
  practiceAuction: { label: 'Practice an auction', href: '#/practice' },
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
  const hasNums = d.plan === 'lien' || hasSavedNumbers(nums);
  const tx = d.state === 'TX';
  const out: PlanTask[] = [];

  const numbers = () => {
    if (d.plan === 'lien') return;
    const verb = w === 'offer' ? 'pay' : 'bid';
    out.push(task({
      key: 'numbers',
      label: d.plan === 'rent' ? `Run Keep and rent for ${n} with the price you’d ${verb}` : d.plan === 'flip' ? `Set your walk-away price for ${n} in Fix and sell` : `Run Commercial income for ${n}`,
      produces: d.plan === 'rent' ? 'its monthly cash flow, the cash it needs and downside cases, saved with the deal' : d.plan === 'flip' ? 'the most you can pay and still make your profit, with every cost counted' : 'the most its income supports at your target return',
      href: '#/analyze',
      openDeal: true,
      support: d.plan === 'rent' ? [L.analyze, L.rentMission] : [L.analyze],
      done: hasNums,
      // Entered numbers give a result, not a verified one: the inputs still need checking against quotes and comps.
      doneLabel: 'Calculated: verify the inputs',
    }));
  };
  const area = (k: string, label: string, produces: string, support: Support[] = []) => out.push(task({ key: `ev-${k}`, label, produces, href: packetHref(d, 'evidence'), support, done: ev(k) }));
  const fit = () => out.push(task({ key: 'fit', label: `Check ${n} against your buy box`, produces: 'a fits or doesn’t-fit call with the reason, in its deal packet', href: packetHref(d, 'plan'), support: [L.buyBox], done: !!(p.fit && p.fitWhy.trim()) }));
  const decide = () => out.push(task({ key: 'decide', label: `Decide on ${n}: pass, or go on to ${w === 'offer' ? 'an offer' : 'bidding'}`, produces: 'your decision and the reason, recorded in its evidence log', href: packetHref(d, 'decision'), support: [L.walkAway], done: log.gate === 'pass' || log.gate === 'proceed' }));
  const findNext = () => out.push(task({ key: 'next', label: 'Find your next property', produces: 'a new candidate saved in Analyze, starting at Researching', href: '#/find-deals', support: [L.findDeals, L.analyze], done: false }));

  if (stage === 'researching') {
    numbers();
    if (w === 'offer') {
      area('sale', `Confirm who is selling ${n}, and what exactly is sold`, 'the listing or official notice in its evidence log, with the source and the date you checked', [L.findDeals]);
      if (d.plan === 'flip') area('exit', `Check what ${n} would sell for after repairs`, 'recent sales of similar homes nearby, saved in its evidence log', [L.analyze]);
      else area('income', `Verify the rent for ${n}`, '3 comparable rents from leases signed nearby, saved in its evidence log', d.plan === 'rent' ? [L.analyze, L.rentMission] : [L.analyze]);
      area('insurance', `Get an insurance quote and the flood zone for ${n}`, 'a written quote for this property and its FEMA flood zone, in its evidence log', [L.pro('insurance')]);
    } else if (w === 'auction') {
      area('sale', `Confirm the sale of ${n} with the official seller`, 'the official notice in its evidence log: the sale date, the terms and exactly what is sold', [L.guides, L.findDeals]);
      area('title', `Get a title search for ${n}`, 'a title professional’s list of the recorded liens, and which ones survive this kind of sale', [L.pro('title'), L.guides]);
      area('occupancy', `Check occupancy and the lawful path to possession for ${n}`, 'what the sale notice and public records show, and the lawful steps to possession, in its evidence log', [L.guides]);
      area('insurance', `Find out whether you can insure ${n} from the day you buy`, 'a written quote or a clear answer from an insurance agent, in its evidence log', [L.pro('insurance')]);
    } else {
      area('sale', `Read the county’s lien sale terms for ${n}`, 'the sale date, the bidding rules and how payment works, in its evidence log', [L.guides]);
      area('title', `Research the parcel behind ${n}`, 'its value, other liens and anything that could leave the lien unpaid, in its evidence log', [L.guides]);
    }
    fit();
    decide();
    if (log.gate === 'pass') out.push(task({ key: 'stage', label: `Mark ${n} as passed`, produces: 'it moves to Passed, and your plan moves on to the next property', href: packetHref(d, 'decision'), setStage: 'passed', done: false }));
    else out.push(task({
      key: 'stage',
      label: `Move ${n} to ${stageLabel('offer', d)}`,
      produces: w === 'offer' ? 'the offer tasks for it: your price, the earnest money and your professionals’ questions' : 'the bidding tasks for it: your maximum bid, the funds the sale requires and the dates',
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
      out.push(task({ key: 'qa', label: `Ask your agent and lender your questions about ${n}`, produces: 'their answers, with dates, in its deal packet', href: packetHref(d, 'pros'), support: [L.pro('agent'), L.pro('lender')], done: p.qa.some((x) => x.q.trim() && x.a.trim()) }));
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
      out.push(task({
        key: 'bid',
        label: w === 'lien' ? `Bid on ${n} at the county’s sale` : `Register and bid on ${n}, up to your maximum`,
        produces: 'a bid at or below your limit, or a clean walk-away. If you win, mark it won and the payment deadlines appear here',
        href: ROADMAP_HREF,
        advance: { stage: 'contract', label: 'I won the bid: mark it won' },
        support: [L.guides, L.practiceAuction],
        done: false,
      }));
    }
    return out;
  }

  if (stage === 'contract') {
    if (w === 'offer') {
      out.push(task({ key: 'dates', label: `Put ${n}’s contract deadlines on its calendar`, produces: `every deadline from the signed contract on one calendar (${suggestedDates(d).join('; ')}), with the next one shown here`, href: packetHref(d, 'dates'), support: [L.negotiate], done: calendarComplete(p, stage) }));
      out.push(task({ key: 'deposit-sent', label: `Send the earnest money for ${n} and confirm receipt`, produces: 'escrow confirms receipt of the deposit and any option fee required by your contract; mark the deposit roadmap task done', href: ROADMAP_HREF, support: [L.negotiate], done: stepDone('deposit') }));
      out.push(task({ key: 'inspection-complete', label: `Inspect ${n} before the ${tx ? 'option period' : 'inspection period'} ends`, produces: 'the report, repair bids and written decision before the deadline; mark the inspection roadmap task done', href: ROADMAP_HREF, support: [L.pro('inspector'), L.caseStage('inspection', 'The inspection')], done: stepDone('inspect') }));
      out.push(task({ key: 'final-financing', label: `Get the loan approved for ${n}, or confirm your cash`, produces: 'final lender approval with conditions satisfied, or verified available closing funds; mark the final financing roadmap task done', href: ROADMAP_HREF, support: [L.pro('lender')], done: stepDone('loan-approval') }));
      out.push(task({ key: 'appraisal-complete', label: `Resolve the appraisal for ${n}`, produces: 'the appraisal and any gap resolved before the deadline, or a documented cash-purchase choice not to obtain one', href: ROADMAP_HREF, support: [L.pro('appraiser')], done: stepDone('appraise') }));
      out.push(task({ key: 'contract-title', label: `Review the title commitment for ${n}`, produces: 'requirements and HOA restrictions reviewed within the contract period; mark the title roadmap task done', href: ROADMAP_HREF, support: [L.pro('title'), L.caseStage('appraisal', 'Appraisal and title')], done: stepDone('title') }));
      out.push(task({ key: 'bound-insurance', label: `Have insurance in place for ${n} by closing`, produces: 'written coverage confirmation and its start date; mark the insurance activation roadmap task done', href: ROADMAP_HREF, support: [L.pro('insurance')], done: stepDone('bind-insurance') }));
      out.push(task({ key: 'final-walkthrough', label: `Do the final walkthrough of ${n}`, produces: 'agreed repairs, condition and possession checked with your agent; mark the walkthrough roadmap task done', href: ROADMAP_HREF, done: stepDone('walkthrough') }));
      out.push(task({ key: 'close', label: `Close on ${n}`, produces: 'the signed closing statement and the deed. Then mark it closed and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: 'It closed: mark it closed' }, support: [L.caseStage('closing', 'Closing')], done: false }));
    } else {
      out.push(task({ key: 'dates', label: `Put ${n}’s payment and recording deadlines on its calendar`, produces: 'the payment deadline and when the deed or certificate should be recorded, on one calendar', href: packetHref(d, 'dates'), support: [L.guides], done: calendarComplete(p, stage) }));
      area('terms', `Pay for ${n} as the sale requires`, 'the receipt, and the deed or certificate you’re owed, in its evidence log', [L.guides]);
      if (w === 'auction') {
        if (!ev('insurance')) area('insurance', `Insure ${n} right away`, 'a policy in your name from the day you own it, in its evidence log', [L.pro('insurance')]);
        area('title', `Have a title professional review ${n}’s deed`, 'what the deed gives you and what still stands against it, in its evidence log', [L.pro('title')]);
      }
      out.push(task({ key: 'record', label: w === 'lien' ? `Get the certificate for ${n}` : `Get the deed for ${n} recorded`, produces: w === 'lien' ? 'the certificate in your records. Then mark it in hand and the holding tasks appear here' : 'the recorded deed. Then mark it recorded and the new-owner tasks appear here', href: ROADMAP_HREF, advance: { stage: 'closed', label: w === 'lien' ? 'I have the certificate: mark it' : 'The deed is recorded: mark it' }, support: [L.guides], done: false }));
    }
    return out;
  }

  if (stage === 'closed') {
    if (w === 'lien') {
      out.push(task({ key: 'track', label: `Start tracking ${n}`, produces: 'its payoff date, interest and any later taxes on one record', href: ROADMAP_HREF, support: [L.guides], done: stepDone('c-hold') }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the holding tasks: payoffs, interest and what to do if it’s never paid', href: ROADMAP_HREF, setStage: 'owned', done: false }));
      return out;
    }
    if (w === 'auction') out.push(task({ key: 'before-remodel', label: `Check redemption, possession and title for ${n} before you remodel`, produces: 'a written answer on any redemption period, lawful possession and title insurance', href: ROADMAP_HREF, support: [L.guides], done: stepDone('a-before-remodel') }));
    out.push(task({ key: 'first-week', label: `Your first week with ${n}`, produces: 'insurance in your name, locks changed, utilities on, and a dated record of its condition', href: ROADMAP_HREF, support: d.plan === 'flip' ? [L.caseStage('after', 'Your first weeks')] : [L.afterClosing, L.caseStage('after', 'Your first weeks')], done: stepDone('first-week') }));
    if (d.plan === 'flip') {
      // A flip gets the work and the sale, not rental tasks.
      out.push(task({ key: 'repairs', label: `Get repair bids for ${n} and start the work`, produces: 'written bids, permits where needed, and the work under way', href: ROADMAP_HREF, support: [L.pro('contractor')], done: stepDone('repairs') }));
      out.push(task({ key: 'owned', label: `Track ${n}’s repair and holding costs against your budget`, produces: flipBudget(d) ? 'a monthly record of what you pay (with $0 rent), shown against the budget in your Fix and sell numbers (repairs, holding and any loan interest and points)' : 'a monthly record of what you pay (with $0 rent), to compare yourself with the repairs and holding costs in Fix and sell (Analyze)', href: packetHref(d, 'owned'), done: !!owned[d.id] }));
      out.push(task({ key: 'stage', label: `Mark ${n} as ${stageLabel('owned', d).toLowerCase()}`, produces: 'the selling tasks: list it at a price backed by sold comps, and record the sale', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
      return out;
    }
    out.push(task({ key: 'rental-repairs', label: `Finish the repairs ${n} needs before renting`, produces: 'required repairs completed and checked, with permits where needed; mark the repairs roadmap task done', href: ROADMAP_HREF, support: [L.pro('contractor')], done: stepDone('repairs') }));
    out.push(task({ key: 'rental-lease', label: `Rent ${n} lawfully, or confirm its existing tenancy`, produces: 'screening, disclosures, a lawful lease and tenant records reviewed with your team; mark the rental roadmap task done', href: ROADMAP_HREF, support: [L.afterClosing], done: stepDone('rent') }));
    out.push(task({ key: 'owned', label: `Start tracking ${n}’s real rent and costs`, produces: 'a monthly record of actual rent and costs, against the cash flow you planned', href: packetHref(d, 'owned'), support: [L.afterClosing], done: !!owned[d.id] }));
    out.push(task({ key: 'stage', label: `Mark ${n} as owned and operating`, produces: 'the monthly tasks: record the rent and costs, and review it against your goal', href: packetHref(d, 'owned'), setStage: 'owned', done: false }));
    return out;
  }

  if (stage === 'owned') {
    if (w === 'lien') {
      out.push(task({ key: 'hold', label: `Track ${n}’s payoff, interest and later taxes`, produces: 'an up-to-date record of what you’re owed', href: ROADMAP_HREF, support: [L.guides], done: stepDone('c-hold') }));
      out.push(task({ key: 'decide-unpaid', label: `Decide what to do if ${n} is never paid`, produces: 'a dated plan, with your attorney, for an unpaid lien', href: ROADMAP_HREF, support: [L.pro('attorney')], done: stepDone('c-decide') }));
    } else if (d.plan === 'flip') {
      out.push(task({ key: 'list', label: `List ${n} for sale at a price backed by sold comps`, produces: 'recent sales of similar homes nearby and a net sheet (price, commission, closing costs, loan payoff and tax), then the listing', href: ROADMAP_HREF, support: [L.pro('agent'), L.pro('cpa')], done: stepDone('exit-sell') }));
      out.push(task({ key: 'sold', label: `Record ${n}’s sale and your actual profit`, produces: 'the closing statement, and your real profit against the walk-away price you planned', href: ROADMAP_HREF, support: [L.pro('cpa')], done: false }));
    } else {
      const month = lastMonth(now);
      out.push(task({ key: 'month', label: `Record last month’s rent and costs for ${n}`, produces: 'its actual cash flow for the month, against what you planned', href: packetHref(d, 'owned'), support: [L.caseStage('run', 'Run it and review')], done: !!owned[d.id]?.months.some((m) => m.month >= month) }));
      out.push(task({ key: 'review', label: `Review ${n} against your goal`, produces: 'a written decision: keep it as it is, improve it, refinance or sell', href: ROADMAP_HREF, support: [L.pro('cpa')], done: stepDone('review') }));
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
    const nd = nextDate(p, now);
    if (nd && nd.days <= 7) {
      const text = `${nd.days < 0 ? `Overdue by ${-nd.days} days` : nd.days === 0 ? 'Today' : nd.days === 1 ? 'Tomorrow' : `In ${nd.days} days`}: ${nd.what}.${nd.who ? ` Who: ${nd.who}.` : ''}`;
      return { key: 'date', label: text, produces: 'the deadline met, with what you did noted in its deal packet', href: `#/deals/packet/${d.id}/dates`, support: [], done: false, urgent: true, text };
    }
    const log = loadLog(`analyzed:${d.id}`);
    const openRow = EVIDENCE_AREAS.map((a) => ({ a, r: log.rows[a.key] })).find(({ r }) => r?.open && !r.done);
    if (openRow) {
      const text = `Get an answer to: ${openRow.r.open}${openRow.r.owner ? ` (${openRow.r.owner})` : ''}.`;
      return { key: 'open', label: text, produces: `the answer recorded under “${openRow.a.title}” in its evidence log`, href: `#/deals/packet/${d.id}/evidence`, support: [], done: false, urgent: true, text };
    }
    const waiting = p.qa.find((x) => x.q && !x.a);
    if (waiting) {
      const text = `Get an answer from your ${(proGuideByKey(waiting.role as never)?.title ?? 'professional').toLowerCase()}: ${waiting.q}`;
      return { key: 'qa-wait', label: text, produces: 'their answer, with the date, in its deal packet', href: `#/deals/packet/${d.id}/pros`, support: [], done: false, urgent: true, text };
    }
  }
  const tasks = stageTasks(d, stage, p, now);
  return tasks.find((t) => !t.done) ?? tasks[tasks.length - 1];
}
