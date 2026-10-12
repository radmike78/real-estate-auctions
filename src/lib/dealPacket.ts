import { workStorage as localStorage } from './workStorage';
// The deal packet: one page per property you're analyzing that pulls together everything a decision needs and says
// what's still missing. Most of it comes from what's already saved (the deal, its calculators, its evidence log,
// your goal, buy box and team). This file adds the few things nothing else stores: whether it fits your buy box and
// why, the deal's key dates, your questions to professionals and their answers, your earnest money, and the reason
// for your decision with any conditions still open. Kept only in this browser, like the rest.
import { kindLabel, SALE_KINDS, type Deal } from './analyze';
import { costsAtBid, maxSafeBid, offerInputs, totalMonths, proposedPriceOf, resultAtPrice, requiredProfit, sanitizeInputs, stressCases, BLANK_INPUTS, DRAW_NOTE, type BidInputs } from './bidCalc';
import { cleanBuyBox, EMPTY_BUY_BOX, type BuyBox } from './toolkit';
import { EVIDENCE_AREAS, GATES, loadLog } from './evidence';
import { commercialAtPrice, commercialMaxBid, COMMERCIAL_DEFAULTS, rentAtPrice, rentStress, RENT_DEFAULTS, sanitizeNumbers, type CommercialInputs, type RentInputs } from './holdCalc';
import { cleanGoal, GOAL_KEY, investorProfile, TEAM_ROLES } from './myPlan';
import { proGuideByKey } from './proGuide';
import { countyName } from './regions';
import { dealNextTask, stageLabel, stageOf } from './dealStage';

export type Fit = '' | 'fits' | 'no' | 'more';
export const FIT_LABEL: Record<Exclude<Fit, ''>, string> = { fits: 'Fits my buy box', no: 'Doesn’t fit', more: 'Need more evidence' };

export interface PacketDate {
  /** YYYY-MM-DD */
  when: string;
  what: string;
  who: string;
  /** Confirmed handled; older entries stay open until the user reviews them. */
  resolved?: boolean;
}

export interface PacketQA {
  /** A team role key (agent, lender, title, attorney, inspector, insurance), or 'other'. */
  role: string;
  q: string;
  a: string;
  /** YYYY-MM-DD the answer came in. */
  on: string;
}

export interface PacketData {
  fit: Fit;
  fitWhy: string;
  dates: PacketDate[];
  /** Explicit review against the contract or notice for this deal stage. */
  calendarReviewedFor?: string;
  qa: PacketQA[];
  /** Earnest money (or a bidder deposit) you'll put up when you commit; 0 when not known yet. */
  earnest: number;
  /** Separate fee, if applicable; credit is entered only after confirmation from the settlement professional. */
  optionFee?: number;
  depositCredit?: number;
  decisionWhy: string;
  conditions: string;
}

export const EMPTY_PACKET: PacketData = { fit: '', fitWhy: '', dates: [], qa: [], earnest: 0, decisionWhy: '', conditions: '' };

/** A count of dates cannot establish that all applicable deadlines have been reviewed. */
export const calendarComplete = (p: PacketData, stage: string) => p.calendarReviewedFor === stage && p.dates.length > 0 && p.dates.every((d) => !!d.when && !!d.what.trim() && !!d.who.trim());

const KEY = 'deedowl.dealPacket.v1';
export const PACKET_KEY = KEY;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
const obj = (x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

/** One deal's packet, cleaned so old or hand-edited storage can't break the page. */
export function cleanPacket(v: unknown): PacketData {
  const o = obj(v);
  const fit = (['fits', 'no', 'more'] as const).find((f) => f === o.fit) ?? '';
  const dates = (Array.isArray(o.dates) ? o.dates : []).slice(0, 30).map((d) => {
    const r = obj(d);
    const when = str(r.when, 10);
    return { when: DATE.test(when) ? when : '', what: str(r.what, 200), who: str(r.who, 120), ...(r.resolved === true ? { resolved: true } : {}) };
  });
  const qa = (Array.isArray(o.qa) ? o.qa : []).slice(0, 40).map((d) => {
    const r = obj(d);
    const on = str(r.on, 10);
    return { role: str(r.role, 30), q: str(r.q, 500), a: str(r.a, 1000), on: DATE.test(on) ? on : '' };
  });
  const earnest = typeof o.earnest === 'number' && Number.isFinite(o.earnest) && o.earnest > 0 ? Math.min(o.earnest, 1e9) : 0;
  const amount = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0;
  return { fit, fitWhy: str(o.fitWhy, 600), dates, qa, earnest, ...(amount(o.optionFee) ? { optionFee: amount(o.optionFee) } : {}), ...(amount(o.depositCredit) ? { depositCredit: amount(o.depositCredit) } : {}), ...(str(o.calendarReviewedFor, 30) ? { calendarReviewedFor: str(o.calendarReviewedFor, 30) } : {}), decisionWhy: str(o.decisionWhy, 1000), conditions: str(o.conditions, 1000) };
}

function loadAll(): Record<string, unknown> {
  try {
    return obj(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return {};
  }
}

export const loadPacket = (dealId: string): PacketData => cleanPacket(loadAll()[dealId]);

export function savePacket(dealId: string, p: PacketData) {
  try {
    const all = loadAll();
    all[dealId] = cleanPacket(p);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: the packet lasts for this visit */
  }
}

export function removePacket(dealId: string) {
  try {
    const all = loadAll();
    if (!(dealId in all)) return;
    delete all[dealId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

const isOffer = (d: Pick<Deal, 'kind'>) => d.kind === 'listing' || d.kind === 'reo' || d.kind === 'short';

/** One date to put on the calendar. Texas contract dates also say how each is counted, who acts, what to do and
 * what happens if it's missed, with the form paragraph in `why`. */
export interface DateGuide {
  what: string;
  when?: string;
  who?: string;
  todo?: string;
  missed?: string;
  why?: string;
}

/** Texas earnest money and option fee (20-19, 5A, 5C and 5D). Under a short sale addendum they're still due on time (45-2, C). */
const TX_DEPOSIT_DATES: DateGuide[] = [
  { what: 'Earnest money due', when: 'Within 3 days after the effective date. If the last day is a Saturday, Sunday or legal holiday, the end of the next day that isn’t one.', who: 'You, to the escrow agent (usually the title company)', todo: 'Deliver the amount written in the contract and keep the receipt.', missed: 'The seller can end the contract (or use its other remedies) by notice before you deliver it.', why: 'TREC 20-19, paragraphs 5A and 5C' },
  { what: 'Option fee due', when: 'Same 3 days and the same weekend and holiday rule.', who: 'You, to the escrow agent', todo: 'Deliver it with the earnest money or separately.', missed: 'You don’t get the option period: no right to end the contract for any reason.', why: 'TREC 20-19, paragraphs 5A and 5D' },
];

const TX_OPTION_END: DateGuide = { what: 'Option period ends (5 p.m.)', when: 'The number of days written in the contract after the effective date, by 5 p.m. local time. The weekend rule for payments doesn’t move it.', who: 'You', todo: 'If you want out, give the seller written notice of termination before then.', missed: 'You can’t end the contract for any reason anymore; only the contract’s other conditions remain.', why: 'TREC 20-19, paragraph 5B' };
/** Under a short sale addendum the termination window starts at signing and runs on past the Amended Effective Date (45-2, F). */
const TX_SHORT_OPTION_END: DateGuide = { ...TX_OPTION_END, when: 'Starts when you both sign and keeps running while you wait for the lender; when it ends depends on how paragraph 5’s days are counted after the Amended Effective Date* (45-2, F). Have your agent write the exact date into an amendment.', why: 'TREC 20-19, paragraph 5B; TREC 45-2, paragraph F' };

/** "the effective date", or for a short sale the Amended Effective Date that performance counts from (45-2, D). */
const AMENDED = 'the Amended Effective Date (the day the seller tells you of the lender’s approval, 45-2, D)';
const after = (short: boolean) => (short ? AMENDED : 'the effective date');
const plus45 = (why: string, short: boolean) => (short ? `${why}; TREC 45-2, paragraph D` : why);

/** Texas Seller's Disclosure Notice (20-19, 7B(2)): only when that box is checked. */
const txDisclosureDate = (short: boolean): DateGuide => ({ what: 'Seller’s Disclosure Notice due (only if box 7B(2) is checked)', when: `Within the days written in 7B(2) after ${after(short)}. Your deadline to end the contract is 7 days after you receive it, or closing if that comes first. A lender reselling a home it took back at a foreclosure sale (or by a deed in lieu) doesn’t have to give one (Property Code 5.008(e)(4)), so a bank-owned sale may check box 7B(3) instead.`, who: 'The seller delivers it; you read it', todo: 'Record the day you receive it and put the 7-day deadline on the calendar.', missed: 'If it never comes, you can end the contract any time before closing. Once it comes, you can end it for any reason within 7 days or before closing, whichever is first, with your earnest money back; after that, this right is gone.', why: plus45('TREC 20-19, paragraph 7B; Property Code 5.008(f)', short) });

/** Texas HOA subdivision information (36-11, paragraph A): only with the HOA addendum. */
const txHoaDate = (short: boolean): DateGuide => ({ what: 'HOA subdivision information due (only with the HOA addendum)', when: `Within the days written in paragraph A after ${after(short)}, if box 1 (the seller gets it) or box 2 (you get it) is checked. Your deadline to end the contract is 3 days after you receive it, or closing if that comes first. Under box 2 you count as having received it on the day written in paragraph A even if it comes later, so the 3 days can run from that date. If box 3 is checked and you asked for an updated resale certificate, the seller must deliver it within 10 days after you pay for it, and you can end the contract if it doesn’t come in time.`, who: 'The seller (box 1) or you (box 2) get it from the association', todo: 'Record the day you receive the restrictions, bylaws, rules and resale certificate, read them, and put the 3-day deadline on the calendar. Under box 2, order it right away and treat the day written in paragraph A as your receipt date if it hasn’t come by then.', missed: 'After the 3 days you can’t end the contract over the HOA documents, except if they turn out untrue or change for the worse before closing (paragraph B). Under box 1, if the seller never delivers them, you can end the contract any time before closing.', why: plus45('TREC 36-11, paragraphs A and B', short) });

/** Texas title objections (20-19, 6D). */
const TX_TITLE_DATE: DateGuide = { what: 'Title objections due', when: 'The days written in paragraph 6D after you receive the title commitment, the exception documents and the survey, or the closing date if that’s sooner.', who: 'You (with your agent or attorney)', todo: 'Read the commitment, exception documents and survey, and send the seller written objections to any problem you want fixed.', missed: 'You give up your right to object, except to the requirements in Schedule C of the commitment.', why: 'TREC 20-19, paragraph 6D' };

/** Texas water disclosure (20-19, 7I(2)): only when that box is checked. */
const txWaterDate = (short: boolean): DateGuide => ({ what: 'Seller’s Water Disclosure due (only if box 7I(2) is checked)', when: `Within the days written in 7I(2) after ${after(short)}. Your review deadline is 7 days after you receive it, or closing if that comes first.`, who: 'The seller delivers it; you read it', todo: 'Record the day you receive it and put the 7-day deadline on the calendar.', missed: 'If it never comes, you can end the contract before closing. Once it comes, you can end it within 7 days or before closing, whichever is first, with your earnest money back. With box 1 (already received) or box 3 (not required) there’s no such window.', why: plus45('TREC 20-19, paragraph 7I', short) });

/** Texas financing dates: the appraisal addendum (49-1) and the financing addendum's two approvals (40-11, paragraph 2A and 2B). */
const txAppraisalDate = (short: boolean): DateGuide => ({ what: 'Appraisal addendum deadline (only if you have one)', when: `The days written in box 3 of the addendum, after ${after(short)}.`, who: 'You', todo: 'If the lender’s appraisal comes in under the amount written there, give notice of termination with a copy of the appraisal.', missed: 'You lose that extra right to end the contract; the Property Approval right may still apply.', why: plus45('TREC 49-1, box 3', short) });
const txLoanDates = (short: boolean): DateGuide[] => [
  { what: 'Buyer Approval deadline (only if paragraph 2A’s “subject to Buyer Approval” box is checked)', when: `The days written in paragraph 2A after ${after(short)}.`, who: 'You and your lender', todo: 'If the lender can’t approve you, give notice of termination with the lender’s written statement of the reasons.', missed: 'The contract is no longer subject to your loan approval, so if the loan later falls through, your earnest money is at risk.*', why: plus45('TREC 40-11, paragraph 2A', short) },
  { what: 'Property Approval deadline (only with the financing addendum)', when: 'The 3rd day before the closing date.', who: 'You and your lender', todo: 'If the lender says the property doesn’t meet its requirements (appraisal, insurability or required repairs), give notice of termination with the lender’s written statement. If your appraisal addendum (TREC 49-1) has box 1 checked, or box 2 and the appraisal is at or above the amount written there, a low appraisal alone isn’t a reason you can use, and if the lender then lends less because of the appraisal, you make up the difference in cash at closing (49-1).', missed: 'Property Approval is treated as obtained.', why: 'TREC 40-11, paragraph 2B; TREC 49-1, boxes 1 and 2' },
];

const names = (xs: string[]): DateGuide[] => xs.map((what) => ({ what }));

/** The dates most deals of this kind need on the calendar, each with how it works where we have it (Texas contracts). */
export function dateGuide(d: Pick<Deal, 'kind' | 'state'>): DateGuide[] {
  const tx = d.state === 'TX';
  if (d.kind === 'short') return [...names(['Contract signed']), ...(tx ? TX_DEPOSIT_DATES : []), ...names(['Lienholder approval deadline (from the short sale addendum)', 'Approval notice received (dates count from here)']), ...(tx ? [TX_SHORT_OPTION_END, txDisclosureDate(true), txHoaDate(true), TX_TITLE_DATE, txWaterDate(true), txAppraisalDate(true), ...txLoanDates(true)] : names(['Inspection period ends', 'Loan approval deadline'])), ...names(['Closing'])];
  if (isOffer(d)) return [...names(['Offer accepted (Day 0)']), ...(tx ? TX_DEPOSIT_DATES : names(['Earnest money due'])), ...(tx ? [TX_OPTION_END, txDisclosureDate(false), txHoaDate(false), TX_TITLE_DATE, txWaterDate(false), txAppraisalDate(false), ...txLoanDates(false)] : names(['Inspection period ends', 'Appraisal deadline', 'Loan approval deadline'])), ...names(['Closing'])];
  if (d.kind === 'lien') return names(['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Earliest date you may act on an unpaid lien']);
  const out = ['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Deed or certificate recorded'];
  // Owners can't redeem after a Nevada, California, Utah or Arizona tax sale (redemption ends before the sale), or after a
  // Texas execution sale; a Texas tax sale has its own redemption period (Tax Code 34.21).
  if ((['hoa', 'irs', 'court'].includes(d.kind) || (d.kind === 'taxSale' && d.state === 'TX')) && !(d.state === 'TX' && d.kind === 'court')) out.push('Redemption period ends');
  return names(out);
}

/** The names of the dates most deals of this kind need on the calendar, to start the list from. */
export function suggestedDates(d: Pick<Deal, 'kind' | 'state'>): string[] {
  return dateGuide(d).map((g) => g.what);
}

/** One plain line per detailed date, for the text download. */
export function dateGuideLines(d: Pick<Deal, 'kind' | 'state'>): string[] {
  return dateGuide(d).filter((g) => g.when).map((g) => `${g.what}: ${g.when} Who: ${g.who}. To do: ${g.todo} If missed: ${g.missed} (${g.why})`);
}

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;

/** Which price a Fix and sell result is figured at: the one you entered, or the listing's own. */
const priceName = (source: 'yours' | 'listed', offer: boolean, cap = false) => {
  const n = source === 'yours' ? (offer ? 'your offer' : 'your bid') : offer ? 'the asking price' : 'the opening bid';
  return cap ? n[0].toUpperCase() + n.slice(1) : n;
};

/** The plan's own calculator in Analyze, by name. */
export const STRATEGY_LABEL: Record<Deal['plan'], string> = { rent: 'Keep and rent', flip: 'Fix and sell', commercial: 'Commercial income', lien: 'Lien certificate' };

/**
 * The numbers saved for this deal, from the calculator of the strategy it's saved with (its plan) only. Numbers left
 * in another strategy's calculator (say, a Fix and sell walk-away price from before the deal switched to Keep and
 * rent) are never shown: they'd answer a different question.
 */
export function savedNumbers(d: Deal) {
  const offer = isOffer(d);
  let rent: { price: number; monthly: number; cashIn: number; allIn: number; repairs: number; possession: number; retained: number; refi: boolean; cashOnCash: number | null; target: number; stress: { label: string; monthly: number }[] } | null = null;
  let bid: {
    maxBid: number; cashOnDay: number; cashTotal: number; cashPeak: number; exitValue: number; none: boolean; target: number;
    /** A loan pays part of the price or repairs (repair draws aren't modeled, so the cash figures assume the loan pays as costs come due). */
    financed: boolean;
    /** The result at your own price (your offer or bid, or else the asking price or opening bid); null when none is entered. */
    at: { price: number; source: 'yours' | 'listed'; profit: number; cashOnDay: number; cashPeak: number; cashLeft: number } | null;
    /** Each downside case: the walk-away price, and the profit at your own price (null when no price is entered). */
    stress: { label: string; maxBid: number; profit: number | null }[];
  } | null = null;
  let commercial: {
    maxBid: number; noi: number; capPct: number; cashLeft: number; allIn: number; refi: boolean; none: boolean; noTarget: boolean;
    /** A target return is entered, but no price under $1 billion falls short of it: likely a typo in the rent or costs. */
    overCap: boolean;
    /** What sets the walk-away price: your target return, the cash you can bring, or the lender's minimum coverage (DSCR). */
    limitedBy: CommercialLimit;
    /** Return on cost at the walk-away price (NOI / all in), or null. */
    capOnCost: number | null;
    at?: ReturnType<typeof commercialAtPrice> & { price: number };
    stress: { label: string; maxBid: number | null; limitedBy?: CommercialLimit; capOnCost?: number | null }[];
  } | null = null;
  if (d.plan === 'rent') {
    const rentRaw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
    if (rentRaw) {
      const v = sanitizeNumbers(rentRaw, RENT_DEFAULTS) as RentInputs;
      if (v.atPrice > 0) {
        const a = rentAtPrice(v, v.atPrice, offer);
        rent = { price: v.atPrice, monthly: a.cashFlow / 12, cashIn: a.cashIn, allIn: a.allIn, repairs: v.repairs * (1 + v.contingencyPct / 100), possession: v.possession, retained: v.reserveCash, refi: !offer && a.loan > 0, cashOnCash: a.cashOnCash, target: v.targetCocPct, stress: rentStress(v, v.atPrice, offer).map((s) => ({ label: s.label, monthly: s.monthly })) };
      }
    }
  } else if (d.plan === 'flip') {
    const bidRaw = read(`fsf.bid.analyzed-${d.id}.v1`);
    if (bidRaw && typeof bidRaw === 'object') {
      const saved: BidInputs = sanitizeInputs(bidRaw, BLANK_INPUTS);
      const i = offer ? offerInputs(saved) : saved;
      if (i.exitValue > 0) {
        const r = maxSafeBid(i);
        const pp = proposedPriceOf(i);
        const at = pp ? { ...resultAtPrice(i, pp.price), source: pp.source } : null;
        const stress = stressCases(i).map((c) => ({ label: c.label, maxBid: maxSafeBid(c.inputs).maxBid, profit: pp ? resultAtPrice(c.inputs, pp.price).profit : null }));
        bid = { maxBid: r.maxBid, cashOnDay: r.cashAtAuction, cashTotal: r.cashToStabilize, cashPeak: r.cashPeak, exitValue: i.exitValue, none: r.noBidWorks, target: requiredProfit(i), at, stress, financed: i.financedPct > 0 };
      }
    }
  } else if (d.plan === 'commercial') {
    const raw = read(`fsf.calc.commercial.${d.id}${offer ? '-offer' : ''}.v1`);
    if (raw) {
      const v = sanitizeNumbers(raw, COMMERCIAL_DEFAULTS) as CommercialInputs;
      if (v.monthlyRent > 0) {
        const r = commercialMaxBid(v, offer);
        // No price meets the target return with these numbers: that's a result too, not a missing one.
        if (r.noBidWorks) commercial = { maxBid: 0, noi: r.noi, capPct: v.targetCapPct, cashLeft: 0, allIn: 0, refi: false, none: true, noTarget: false, overCap: false, limitedBy: r.limitedBy, capOnCost: null, stress: [] };
        // No target return (and no loan or cash limit): nothing caps the price yet, so there's no walk-away price.
        // With a target entered, an endless price means the search hit its $1 billion ceiling instead (overCap).
        else if (!Number.isFinite(r.maxBid)) commercial = { maxBid: 0, noi: r.noi, capPct: v.targetCapPct, cashLeft: 0, allIn: 0, refi: false, none: false, noTarget: true, overCap: r.overCap, limitedBy: r.limitedBy, capOnCost: null, stress: [] };
        else {
          // The downside: the same deal with rent 10% lower (null: no price meets the target then; left out when
          // nothing caps the price).
          const low = commercialMaxBid({ ...v, monthlyRent: v.monthlyRent * 0.9 }, offer);
          const stress = low.noBidWorks ? [{ label: 'Rent 10% lower', maxBid: null }] : Number.isFinite(low.maxBid) ? [{ label: 'Rent 10% lower', maxBid: low.maxBid, limitedBy: low.limitedBy, capOnCost: low.capOnCost }] : [];
          commercial = { maxBid: r.maxBid, noi: r.noi, capPct: v.targetCapPct, cashLeft: r.cashLeft, allIn: r.allIn, refi: !offer && r.debtService > 0, none: false, noTarget: false, overCap: false, limitedBy: r.limitedBy, capOnCost: r.capOnCost, stress };
        }
        if (commercial && v.atPrice > 0) commercial.at = commercialAtPrice(v, v.atPrice, offer);
      }
    }
  }
  return { rent, bid, commercial };
}

/**
 * The repair and holding budget saved in Fix and sell for a flip, to compare with what you actually pay once you own it
 * (null when it isn't a flip or no repairs or holding costs are saved).
 */
export function flipBudget(d: Deal): { repairs: number; monthly: number; months: number; holding: number; financing: number; price: number; source: 'yours' | 'listed' | null; total: number } | null {
  if (d.plan !== 'flip') return null;
  const raw = read(`fsf.bid.analyzed-${d.id}.v1`);
  if (!raw || typeof raw !== 'object') return null;
  const saved: BidInputs = sanitizeInputs(raw, BLANK_INPUTS);
  const i = isOffer(d) ? offerInputs(saved) : saved;
  // Repairs (with the contingency) and holding don't depend on the price. Loan interest and points do: they're figured
  // at your own saved price (your offer or bid, or else the asking price or opening bid), since you'll pay them each
  // month along with everything else you record.
  const proposed = proposedPriceOf(i);
  const price = proposed?.price ?? 0;
  const c = costsAtBid(i, price);
  if (c.repairs <= 0 && c.holding <= 0 && c.financing <= 0) return null;
  const months = totalMonths(i);
  return { repairs: c.repairs, monthly: months > 0 ? c.holding / months : 0, months, holding: c.holding, financing: c.financing, price, source: proposed?.source ?? null, total: c.repairs + c.holding + c.financing };
}

/**
 * The flip budget in one line for the owned tracker. With no price saved, the loan cost covers the repairs only, so it
 * says so; otherwise it names the price it was figured at (your offer or bid, or the asking price or opening bid).
 */
export function flipBudgetLine(d: Deal): string | null {
  const b = flipBudget(d);
  if (!b) return null;
  const offer = isOffer(d);
  const at = b.source === 'yours' ? `at your ${money(b.price)} ${offer ? 'offer' : 'bid'}` : `at the ${money(b.price)} ${offer ? 'asking price' : 'opening bid'}`;
  const loan = b.financing > 0
    ? b.price > 0
      ? `, loan interest and points about ${money(b.financing)} ${at}`
      : `, loan interest and points on the repairs only (about ${money(b.financing)}); enter your price in Fix and sell to include the purchase loan`
    : '';
  return `Your budget: repairs with contingency ${money(b.repairs)}, holding ${money(b.monthly)} a month for ${b.months} ${b.months === 1 ? 'month' : 'months'} (about ${money(b.holding)})${loan}: ${money(b.total)} in all.`;
}

/** Whether the deal's calculator has numbers to show: a commercial deal without a target return has no price yet. */
export function hasSavedNumbers(n: ReturnType<typeof savedNumbers>): boolean {
  return !!(n.rent || n.bid || (n.commercial && !n.commercial.noTarget));
}

const commercialNoTarget = (strategy: string, overCap = false) => overCap
  ? `The price is over $1 billion with the rent and costs you entered in ${strategy}: check them for a typo.`
  : `No target return entered in ${strategy}: enter the cap rate you require to get a walk-away price.`;

type CommercialLimit = 'return' | 'cash' | 'dscr';
const pct1 = (x: number | null | undefined) => (x === null || x === undefined ? null : `${(x * 100).toFixed(1)}%`);
/** The commercial walk-away price, worded by what sets it: your target return, your cash, or the lender's coverage. */
/** The calculator's own words for the cash limit: "put in" for a listed property (down payment, closing costs and repairs), "bring" at an auction. */
const cashLimit = (offer: boolean) => (offer ? 'the cash you can put in' : 'the cash you can bring');
function commercialPriceText(capPct: number, maxBid: number, limitedBy: CommercialLimit | undefined, capOnCost: number | null | undefined, offer: boolean, lower = false): string {
  const roc = pct1(capOnCost);
  if (limitedBy === 'cash') return `${lower ? 'walk-away price' : 'Walk-away price'}, set by ${cashLimit(offer)}: ${money(maxBid)}${roc ? ` (return on cost at that price: ${roc})` : ''}`;
  if (limitedBy === 'dscr') return `${lower ? 'walk-away price' : 'Walk-away price'}, set by the lender’s minimum coverage (DSCR): ${money(maxBid)}${roc ? ` (return on cost at that price: ${roc})` : ''}`;
  return lower ? `highest price ${money(maxBid)}` : `Highest price for a ${capPct}% return on cost: ${money(maxBid)}`;
}

export type SectionStatus = 'done' | 'started' | 'missing';
export interface PacketSection {
  key: string;
  title: string;
  status: SectionStatus;
  lines: string[];
  /** What "done" means for this part, when it isn't proof: numbers are calculated from your inputs, not verified. */
  doneLabel?: string;
  /** Where to fill it in, when it's not on the packet page itself. */
  fix?: { label: string; href: string };
}

// Counted from the reader's own calendar day: in the evening (Pacific), the UTC date is already tomorrow.
const daysFrom = (iso: string, now: Date) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12)) / 86_400_000);

/** The next date on the deal's calendar that hasn't passed. */
export function nextDate(p: PacketData, now = new Date()): (PacketDate & { days: number }) | null {
  const up = p.dates.filter((x) => x.when && !x.resolved).map((x) => ({ ...x, days: daysFrom(x.when, now) }));
  up.sort((a, b) => a.days - b.days);
  return up[0] ?? null;
}

/** Every section of the packet, each with what's in it and whether it's done. */
export function packetSections(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): PacketSection[] {
  const kind = SALE_KINDS.find((k) => k.key === d.kind);
  const offer = isOffer(d);
  const box: BuyBox = cleanBuyBox(read('deedowl.buybox.v1') ?? EMPTY_BUY_BOX);
  const profile = investorProfile();
  const goal = cleanGoal(read(GOAL_KEY));
  const log = loadLog(`analyzed:${d.id}`);
  const { rent, bid, commercial } = savedNumbers(d);
  const out: PacketSection[] = [];

  // 1. Your plan and buy box
  const boxLines = [
    `Goal: ${goal || 'not written yet'}`,
    `Investable cash: ${profile.investable > 0 ? money(profile.investable) : 'not worked out yet'}`,
    box.priceMax || box.types.length ? `Buy box: ${[box.types.join(', '), box.priceMax ? `up to ${money(box.priceMax)}` : '', box.cashMax ? `${money(box.cashMax)} of cash at most` : '', box.minCashFlow ? `at least ${money(box.minCashFlow)} a month` : ''].filter(Boolean).join('; ')}` : 'Buy box: not set up yet',
    p.fit ? `This property: ${FIT_LABEL[p.fit]}${p.fitWhy ? `, because ${p.fitWhy}` : ''}` : 'This property: not judged against your buy box yet',
  ];
  out.push({ key: 'plan', title: 'Your plan and buy box', status: p.fit && p.fitWhy && goal ? 'done' : p.fit || goal || box.priceMax ? 'started' : 'missing', lines: boxLines, fix: !goal || !box.priceMax ? { label: 'Goal, cash and buy box in My plan', href: '#/toolkit' } : undefined });

  // 2. The property
  const sale = log.rows.sale;
  out.push({
    key: 'property',
    title: 'The property and the sale',
    status: sale?.done ? 'done' : sale?.finding ? 'started' : 'missing',
    lines: [`${d.name}`, `${kind ? kindLabel(kind, d.state) : d.kind} · ${countyName(d.county)}, ${d.state}`, sale?.finding ? `Verified: ${sale.finding}${sale.source ? ` (source: ${sale.source}${sale.checked ? `, ${sale.checked}` : ''})` : ''}` : 'Not verified yet: the parcel, who is selling and what exactly is sold, from the official notice or listing.'],
  });

  // 3. Key dates
  const nd = nextDate(p, now);
  const dated = p.dates.filter((x) => x.when);
  out.push({
    key: 'dates',
    title: 'Key dates',
    status: calendarComplete(p, stageOf(d)) ? 'done' : dated.length ? 'started' : 'missing',
    lines: dated.length
      ? [...[...dated].sort((a, b) => a.when.localeCompare(b.when)).map((x) => `${x.when}: ${x.what}${x.who ? ` (${x.who})` : ''}${x.resolved ? ' — handled' : ' — open'}`), nd ? `Next: ${nd.what}, ${nd.days < 0 ? `overdue by ${-nd.days} days` : nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`}` : 'All dated items are marked handled.']
      : [`Add the dates from the ${offer ? 'contract' : 'official notice'}: ${suggestedDates(d).join('; ')}.`],
  });

  // 4. Cash needed, by when (from the deal's own strategy)
  const strategy = STRATEGY_LABEL[d.plan];
  const cash: string[] = [];
  if (offer) {
    cash.push(p.earnest ? `By the contract's deposit deadline: ${money(p.earnest)} earnest money` : 'By the contract’s deposit deadline: earnest money (enter it below)');
    if (p.optionFee) cash.push(`By the contract's fee deadline, if applicable: ${money(p.optionFee)} option fee, recorded separately from earnest money.`);
    cash.push('A deposit or fee may be credited toward the purchase. Confirm its treatment with your title or escrow professional; do not add an amount twice.');
  }
  else if (p.earnest) cash.push(`Before the sale: ${money(p.earnest)} bidder deposit`);
  let need = 0;
  // The price `need` is figured at, so the investable-cash line after the what-if says which price it means.
  let needAt = '';
  if (rent) {
    if (rent.refi) {
      // A refinance comes later, if at all: until then every dollar of the price and costs is your cash.
      need = rent.allIn;
      needAt = `At a ${money(rent.price)} price`;
      cash.push(`From sale day until the refinance closes, all in: ${money(rent.allIn)} at a ${money(rent.price)} price (from ${strategy}: bid, buying costs and repairs you entered)`);
      cash.push(`After a refinance, if approved: ${rent.cashIn > 0 ? `${money(rent.cashIn)} of your cash left in` : 'the loan returns all your cash'}`);
    } else {
      need = rent.cashIn;
      needAt = `At a ${money(rent.price)} price`;
      if (offer) {
        const acquisition = Math.max(0, rent.cashIn - rent.repairs - rent.possession);
        cash.push(`Acquisition cash estimate at a ${money(rent.price)} price, before deposit credits: ${money(acquisition)} (down payment and modeled purchase/loan costs; excludes repairs, possession costs and retained reserves).`);
        if (p.depositCredit) {
          cash.push(p.depositCredit <= acquisition && p.depositCredit <= p.earnest + (p.optionFee ?? 0)
            ? `After ${money(p.depositCredit)} of confirmed deposit/fee credits: ${money(acquisition - p.depositCredit)} remaining acquisition cash in this planning estimate.`
            : 'Review the confirmed credit: it exceeds the recorded deposit/fee payments or modeled acquisition cash. No remainder is calculated.');
        }
        cash.push(`Repair spending as work is done: ${money(rent.repairs)}, including the contingency. Possession costs, if needed: ${money(rent.possession)}.`);
        cash.push(`Total modeled acquisition, repairs and possession cash: ${money(rent.cashIn)}. This is not the amount to wire at closing.`);
        cash.push('Ask title/escrow and your lender for the actual cash to close and payment dates. Prepaid costs, escrow funding, prorations, credits and costs paid earlier can change it. Repair/lease-up carrying costs also need a separate budget if not included.');
      } else cash.push(`From sale day until it’s rented, all in: ${money(rent.cashIn)} at a ${money(rent.price)} price (from ${strategy}: bid, buying costs and repairs you entered)`);
    }
    cash.push(rent.retained > 0 ? `Retained property reserves: ${money(rent.retained)}, kept separately from the ${money(need)} modeled cash requirement.` : 'Retained property reserves: not entered. Set aside a separate amount for vacancies and unexpected costs.');
    if (rent.retained > 0) need += rent.retained;
  } else if (bid?.none && !bid.at) {
    cash.push(`No price works with the numbers you entered in ${strategy}: the costs and your profit target take up the whole ${money(bid.exitValue)} resale value.`);
  } else if (bid) {
    // Your own price first; the walk-away price is a separate what-if (the most you'd pay), never your price.
    const a = bid.at;
    if (a) {
      need = a.cashPeak;
      const at = `${priceName(a.source, offer)} of ${money(a.price)}`;
      needAt = `At ${at}`;
      if (!offer) cash.push(`On sale day, at ${at}: ${money(a.cashOnDay)} (bid plus any buyer’s premium, in the form the sale requires)`);
      cash.push(`Estimated cash you’ll put in, at ${at}, under these assumptions (through repairs and holding until it sells): ${money(a.cashPeak)}`);
      if (a.cashLeft < a.cashPeak) cash.push(`Left in once the loan funds, at ${at}: ${money(a.cashLeft)}`);
    } else {
      need = bid.cashPeak;
      needAt = `At your walk-away price of ${money(bid.maxBid)}`;
      cash.push(`No ${offer ? 'offer or asking price' : 'bid or opening bid'} entered yet: add it in ${strategy} to see the cash at your own price.`);
    }
    if (!bid.none) {
      const what = `What-if, at your walk-away price of ${money(bid.maxBid)} (the most you could pay, not your price)`;
      cash.push(offer ? `${what}: estimated cash you’d put in ${money(bid.cashPeak)}` : `${what}: ${money(bid.cashOnDay)} on sale day; estimated cash you’d put in ${money(bid.cashPeak)}`);
    }
    if (bid.financed) cash.push(DRAW_NOTE);
  } else if (commercial?.at) {
    const a = commercial.at;
    need = !offer && a.loan > 0 ? a.allIn : a.cashIn;
    needAt = `At your actual price of ${money(a.price)}`;
    cash.push(`${needAt}: ${money(need)} needed ${!offer && a.loan > 0 ? 'before a refinance closes (loan fees are paid at refinancing)' : 'from your own cash, including the loan’s points and fees'}.`);
  } else if (commercial?.noTarget) {
    cash.push(commercialNoTarget(strategy, commercial.overCap));
  } else if (commercial?.none) {
    cash.push(`No price meets your ${commercial.capPct}% return on cost with the income and costs you entered in ${strategy}.`);
  } else if (commercial) {
    need = commercial.refi ? commercial.allIn : commercial.cashLeft;
    needAt = `At your highest price of ${money(commercial.maxBid)}`;
    cash.push(commercial.refi
      ? `All in at your highest price, until a refinance closes: ${money(commercial.allIn)}; after a refinance, if approved: ${money(commercial.cashLeft)} left in (from ${strategy})`
      : `All in at your highest price: ${money(commercial.allIn)}, with ${money(commercial.cashLeft)} of your own cash left in (from ${strategy})`);
  } else if (d.plan === 'lien') {
    cash.push('The certificate price and fees, from the Lien certificate calculator in Analyze.');
  } else {
    cash.push(`Run ${strategy} in Analyze to see the cash this deal needs.`);
  }
  if (profile.investable > 0 && need > 0) cash.push(need > profile.investable ? `${needAt}, that’s ${money(need - profile.investable)} more than your investable cash: the deal doesn’t fit as entered.` : `${needAt}, that leaves ${money(profile.investable - need)} unallocated from your investable cash, after any retained reserves recorded above.`);
  const hasNums = hasSavedNumbers({ rent, bid, commercial });
  out.push({ key: 'cash', title: 'Cash you’ll need, and when', doneLabel: 'Calculated (not verified)', status: hasNums && (!offer || p.earnest) ? 'done' : hasNums || p.earnest ? 'started' : 'missing', lines: cash, fix: hasNums ? undefined : { label: `${strategy} in Analyze`, href: '#/analyze' } });

  // 5. Numbers: base and downside, for the deal's strategy only
  const nums: string[] = ['Returns, profit and cash flow are before income tax; personal taxes and depreciation are not included.', `Strategy: ${strategy}. These are the numbers you saved in its calculator; other strategies’ calculators aren’t counted.`];
  if (rent) {
    nums.push(`${offer ? 'Your offer' : 'Your bid'} (your actual price): ${money(rent.price)} → monthly cash flow ${money(rent.monthly)}; ${rent.cashOnCash === null ? 'all your cash back' : `${(rent.cashOnCash * 100).toFixed(1)}% a year on your cash`} (target ${rent.target}%)`);
    for (const s of rent.stress.slice(1)) nums.push(`  If ${s.label.toLowerCase()}: ${money(s.monthly)} a month`);
  }
  if (bid) {
    const a = bid.at;
    if (a) nums.push(`${priceName(a.source, offer, true)} (${a.source === 'yours' ? 'your actual price' : offer ? 'used until you enter your own offer' : 'the lowest you could pay, used until you enter your own bid'}): ${money(a.price)} → estimated profit ${money(a.profit)} (your target ${money(bid.target)}${a.profit < bid.target ? ', so it falls short' : ''}), based on a ${money(bid.exitValue)} resale value`);
    nums.push(bid.none ? `No price works at a ${money(bid.exitValue)} resale value with these costs and your profit target` : `What-if: walk-away price ${money(bid.maxBid)}, the most you could pay and still meet your goal (not your actual price)${a ? '' : `, based on a ${money(bid.exitValue)} resale value`}`);
    for (const s of bid.stress.slice(1)) {
      const walk = s.maxBid > 0 ? `walk-away price ${money(s.maxBid)}` : 'no price works';
      nums.push(`  If ${s.label.toLowerCase()}: ${a && s.profit !== null ? `profit ${money(s.profit)} at ${money(a.price)}; ${walk}` : walk}`);
    }
  }
  if (commercial?.at) {
    const a = commercial.at;
    nums.push(`Your ${offer ? 'offer' : 'bid'} (your actual price): ${money(a.price)} → monthly cash flow before income tax ${money(a.cashFlow / 12)}; cash left in ${money(a.cashIn)}; return on total cost ${pct1(a.capOnCost)}; ${a.dscr === null ? 'no loan' : `income coverage ${a.dscr.toFixed(3)} (${a.loanOk ? 'meets' : 'below'} your minimum)`}`);
  }
  if (commercial?.noTarget) nums.push(commercialNoTarget(strategy, commercial.overCap));
  else if (commercial?.none) nums.push(`No price meets your ${commercial.capPct}% return on cost with the income and costs you entered`);
  else if (commercial) {
    nums.push(`${commercialPriceText(commercial.capPct, commercial.maxBid, commercial.limitedBy, commercial.capOnCost, offer)}, on ${money(commercial.noi)} a year of net operating income`);
    for (const s of commercial.stress) {
      // Cash sets both prices: the lower rent doesn't move it, so say so instead of repeating the same figure as news.
      const same = s.limitedBy === 'cash' && commercial.limitedBy === 'cash' && s.maxBid === commercial.maxBid;
      nums.push(`  If ${s.label.toLowerCase()}: ${s.maxBid !== null && s.maxBid > 0 ? (same ? `still ${money(s.maxBid)}, set by ${cashLimit(offer)}${pct1(s.capOnCost) ? ` (return on cost at that price: ${pct1(s.capOnCost)})` : ''}` : commercialPriceText(commercial.capPct, s.maxBid, s.limitedBy, s.capOnCost, offer, true)) : 'no price works'}`);
    }
  }
  if (!hasNums) nums.push('No numbers yet. Every figure here is your estimate until a source backs it.');
  // Done only once there's a downside to look at, not just the base case.
  const downside = (rent && rent.stress.length > 1) || (bid && bid.stress.length > 1) || (commercial && (commercial.none || commercial.stress.length > 0));
  out.push({ key: 'numbers', title: 'Numbers: base case and downside', doneLabel: 'Calculated (not verified)', status: downside ? 'done' : hasNums ? 'started' : 'missing', lines: nums, fix: { label: 'Open in Analyze', href: '#/analyze' } });

  // 6. Evidence
  const checked = EVIDENCE_AREAS.filter((a) => log.rows[a.key]?.done);
  const open = EVIDENCE_AREAS.map((a) => ({ a, r: log.rows[a.key] })).filter(({ r }) => r?.open && !r.done);
  out.push({
    key: 'evidence',
    title: 'What you’ve verified, and what’s open',
    status: checked.length === EVIDENCE_AREAS.length ? 'done' : checked.length || open.length ? 'started' : 'missing',
    lines: [`${checked.length} of ${EVIDENCE_AREAS.length} areas checked${checked.length ? `: ${checked.map((x) => x.title).join(', ')}` : ''}`, ...open.map(({ a, r }) => `Open (${a.title}): ${r.open}${r.owner ? `, ${r.owner}` : ''}`), ...EVIDENCE_AREAS.filter((a) => !log.rows[a.key]?.done && !log.rows[a.key]?.open).map((a) => `Not checked: ${a.title}`)],
  });

  // 7. Professionals
  const answered = p.qa.filter((x) => x.q && x.a);
  const waiting = p.qa.filter((x) => x.q && !x.a);
  out.push({
    key: 'pros',
    title: 'Questions for your professionals',
    status: answered.length && !waiting.length ? 'done' : p.qa.length ? 'started' : 'missing',
    lines: p.qa.length
      ? p.qa.filter((x) => x.q).map((x) => `${proGuideByKey(x.role as never)?.title ?? 'Other'}: ${x.q} → ${x.a ? `${x.a}${x.on ? ` (${x.on})` : ''}` : 'waiting for an answer'}`)
      : [`Write down the question this deal raises for each of: ${TEAM_ROLES.map((k) => proGuideByKey(k)?.title ?? k).join(', ')}.`],
  });

  // 8. Decision
  const gate = GATES.find((g) => g.key === log.gate);
  out.push({
    key: 'decision',
    title: 'Your decision',
    status: gate && p.decisionWhy ? 'done' : gate || p.decisionWhy ? 'started' : 'missing',
    lines: [gate ? `${gate.label}: ${gate.when}` : 'Not decided yet', p.decisionWhy ? `Why: ${p.decisionWhy}` : 'Why: not written yet', p.conditions ? `Still to resolve before you commit: ${p.conditions}` : 'Conditions still to resolve: none written'],
  });
  return out;
}

/**
 * The one thing to do next, with where to do it. It follows the deal's stage (dealStage.ts): a candidate you're
 * researching gets research tasks, and the accepted-offer deadlines only come up once it's under contract.
 */
export function nextAction(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): { text: string; href?: string } {
  const t = dealNextTask(d, p, now);
  return { text: t.urgent ? t.text : `${t.label}. You’ll have ${t.produces}.`, href: t.openDeal ? '#/analyze' : undefined };
}

/** The whole packet as plain text, to download, print or share with your professionals. */
export function dealPacketText(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): string {
  const lines = [`DEAL PACKET: ${d.name}`, 'DeedOwl educational worksheet. Every number is your estimate until a source backs it; a checkmark records your review, not a clear title.', ''];
  lines.push(`STAGE: ${stageLabel(stageOf(d), d)}`, `NEXT ACTION: ${nextAction(d, p, now).text}`, '');
  for (const s of packetSections(d, p, now)) {
    lines.push(`${s.title.toUpperCase()} [${s.status === 'done' ? (s.doneLabel ?? 'complete').toLowerCase() : s.status === 'started' ? 'in progress' : 'missing'}]`, ...s.lines);
    if (s.key === 'dates' && dateGuideLines(d).length) lines.push('How each date works (the signed contract wins):', ...dateGuideLines(d).map((l) => `- ${l}`));
    lines.push('');
  }
  return lines.join('\n');
}
