import { ASTERISK_NOTE } from './disclaimers';
import { readConfirmed } from './calcConfirmation';
import { workStorage as localStorage } from './workStorage';
// The deal packet: one page per property you're analyzing that pulls together everything a decision needs and says
// what's still missing. Most of it comes from what's already saved (the deal, its calculators, its evidence log,
// your goal, buy box and team). This file adds the few things nothing else stores: whether it fits your buy box and
// why, the deal's key dates, your questions to professionals and their answers, your earnest money, and the reason
// for your decision with any conditions still open. Kept only in this browser, like the rest.
import { kindLabel, SALE_KINDS, type Deal } from './analyze';
import { loadOwned } from './owned';
import { costsAtBid, maxSafeBid, offerInputs, redemptionOutcome, ruleOf, totalMonths, proposedPriceOf, resultAtPrice, requiredProfit, sanitizeInputs, stressCases, unenteredCosts, BLANK_INPUTS, DRAW_NOTE, type BidInputs } from './bidCalc';
import { offeredRedemptionRules, redemptionChoicesFor } from './stateCosts';
import { cleanBuyBox, EMPTY_BUY_BOX, LIEN_STRATEGY, type BuyBox } from './toolkit';
import { areasFor, GATES, loadLog } from './evidence';
import { commercialAtPrice, commercialMaxBid, COMMERCIAL_DEFAULTS, rentAtPrice, rentStress, RENT_DEFAULTS, LIEN_DEFAULTS, lienYield, sanitizeNumbers, withoutOldValueExample, refiOnExampleValue, refiValueWords, withPlanCash, dscrText, capText, noRealisticPrice, noRealisticAdvice, cashAndPropertyWeak, fhaMonthlyMi, type CommercialInputs, type LienInputs, type RentInputs } from './holdCalc';
import { cleanGoal, GOAL_KEY, investorProfile } from './myPlan';
import { PLAYBOOKS } from './playbooks';
import { proGuideByKey, type ProKey } from './proGuide';
import { countyName } from './regions';
import { dealNextTask, stageLabel, stageOf, afterSale, remindable, behindStage, finishedDeal } from './dealStage';

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
/** A date that applies only if something happens (its name says “(if …)”): it can stay undated. */
const ifOnly = (what: string) => /\(if /.test(what);
/** A packet row is this date, even renamed by the reader: its name starts with the date's own (without any “(if …)”). */
export const sameDate = (rowWhat: string, name: string) => rowWhat.trim().toLowerCase().startsWith(dateBase(name).toLowerCase()) || (/^(bidder )?registration/i.test(name) && /^(bidder )?registration/i.test(rowWhat.trim()));
/** A date's name without its trailing note in parentheses ("Bidder registration (if required)" -> "Bidder registration"). */
const dateBase = (name: string) => name.replace(/\s*\([^)]*\)$/, '');
/** A row that is this event itself, not another date that starts with its words ("Closing Disclosure received" isn't
 *  "Closing"): after the name, only the end, a note in parentheses, a colon or dash, a date or "on"/"at". */
export const sameEvent = (rowWhat: string, name: string) => {
  const base = dateBase(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${base}(\\s*($|[(:–—-]|\\d)|\\s+(on|at)\\b)`, 'i').test(rowWhat.trim());
};

/** A date row filled in: its date and who handles it, or (a date that applies only if something happens) left undated. */
export const dateRowComplete = (d: { when: string; what: string; who: string }) => !!d.what.trim() && ((!!d.when && !!d.who.trim()) || (!d.when && ifOnly(d.what)));
/** Dates counted from a later event (a deed recorded, a period's end): they can stay undated until that event. */
const LATER = ['Redemption money collected', 'Challenge window ends', 'Recovery-suit window ends', 'Redemption period ends', 'Deed delivered (if no one redeemed)', 'Certificate expires', 'Earliest you may act (unpaid lien)', 'Rescission window ends', 'Intent-to-bid window ends', 'Eligible bid deadline (45 days)'];
/** The rows this stage's calendar needs filled in: before the sale, only the dates before it; after, all but those
 *  counted from a later event (they can wait for it). */
export const calendarRows = (p: PacketData, stage: string) => {
  if (['researching', 'offer'].includes(stage)) return p.dates.filter((x) => !afterSale(x.what));
  // A short sale's dates count from the lender's approval: until it's dated, it and the rows after it can wait.
  const approval = p.dates.findIndex((x) => sameDate(x.what, 'Approval notice received'));
  const waiting = approval >= 0 && !p.dates[approval].when;
  return p.dates.filter((x, i) => x.when || !(LATER.some((n) => sameDate(x.what, n)) || (stage === 'contract' && RECORDED_ROWS.some((n) => sameDate(x.what, n))) || (waiting && i >= approval)));
};
/** A row the calendar review lets wait for a later event (filling it in later needs no new review). */
export const laterRow = (what: string) => LATER.some((n) => sameDate(what, n)) || RECORDED_ROWS.some((n) => sameDate(what, n)) || sameDate(what, 'Redemption money collected');
/** The recording rows at a win: the record task is how they get done (they can stay undated until then). */
export const RECORDED_ROWS = ['Deed recorded', 'Deed or certificate recorded', 'Treasurer’s deed recorded', 'Certificate of sale recorded', 'Certificate of sale received'];
/** Windows that end on their own (no one acted in time): past their date, they ended; they weren't missed. */
const WINDOWS: { name: string; what: string; then: (kind?: string) => string; tick?: string }[] = [
  { name: 'Redemption period ends', what: 'the redemption period', tick: 'No one redeemed: mark it handled',
    then: (k) => `ask ${k === 'court' ? 'the sheriff’s civil office' : k === 'hoa' ? 'the HOA’s foreclosure agent' : k === 'irs' ? 'the IRS sale officer' : 'whoever ran the sale'} in writing whether anyone redeemed. If no one did, mark it handled and ask for the deed` },
  { name: 'Challenge window ends', what: 'the challenge window', tick: 'No suit was filed, and the 90-day limit doesn’t apply: mark it handled', then: () => 'ask your title company or attorney whether any suit was filed, and whether the 90-day limit for anyone not properly notified (NRS 107.080(6)) still runs. If not, mark it handled' },
  { name: 'Recovery-suit window ends', what: 'the recovery-suit window', tick: 'No suit was filed: mark it handled', then: () => 'ask your title company or attorney whether any suit was filed. If not, mark it handled' },
  { name: 'Earliest you may act (unpaid lien)', what: 'the wait before you may act on an unpaid lien', then: () => 'if it’s still unpaid, ask your attorney about your next step, or mark it handled' },
];
/** A window past its date: `text` for a sentence ("the challenge window ended 3 days ago"), `short` for a list. */
export const windowEnded = (what: string, daysAgo: number, kind?: string): { text: string; short: string; then: string; tick?: string } | null => {
  const w = WINDOWS.find((x) => sameDate(what, x.name));
  const ago = `ended ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  return w ? { text: `${w.what} ${ago}`, short: ago, then: w.then(kind), tick: w.tick } : null;
};
export const calendarReady = (p: PacketData, stage: string) => p.dates.length > 0 && calendarRows(p, stage).every(dateRowComplete);
export const calendarComplete = (p: PacketData, stage: string) => p.calendarReviewedFor === stage && calendarReady(p, stage);

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

/** A sale with no owner redemption, in words: Nevada's and Utah's trustee sales are confirmed by statute; others
 *  carry an asterisk. */
export function noRedemptionWords(d: Pick<Deal, 'state' | 'kind'>): string {
  if (d.state === 'NV' && d.kind === 'trustee') return 'Nevada trustee sales are made “without equity or right of redemption” (NRS 107.080(5)).';
  // Utah Code 57-1-28(3) (le.utah.gov): the trustee's deed conveys the title "without right of redemption".
  if (d.state === 'UT' && d.kind === 'trustee') return 'Utah trustee sales convey the title “without right of redemption” (Utah Code 57-1-28(3)).';
  // A.R.S. 33-811(E) (azleg.gov): the trustee's deed conveys title "absolute without right of redemption".
  if (d.state === 'AZ' && d.kind === 'trustee') return 'Arizona trustee sales convey the title “absolute without right of redemption” (A.R.S. 33-811(E)).';
  if (d.state === 'TX' && d.kind === 'trustee') return 'A Texas mortgage foreclosure has no redemption.*';
  return 'This kind of sale doesn’t usually carry a right of redemption.*';
}

/** The same, short, for a line in My deals. */
export function noRedemptionShort(d: Pick<Deal, 'state' | 'kind'>): string {
  if (d.kind === 'trustee' && (d.state === 'NV' || d.state === 'UT' || d.state === 'AZ')) return `${d.state === 'NV' ? 'Nevada' : d.state === 'UT' ? 'Utah' : 'Arizona'} trustee sales carry no right of redemption`;
  if (d.kind === 'trustee' && d.state === 'TX') return 'a Texas mortgage foreclosure has no redemption*';
  return 'this kind of sale doesn’t usually carry a right of redemption*';
}

/**
 * Who can redeem after this deal's sale, for the wait in its Fix and sell numbers, as Fix and sell names it: the United
 * States after a sale that wiped out a junior federal lien, else the owner. Null when the wait is your own what-if on a
 * sale with no owner redemption (a Nevada trustee sale, for one: NRS 107.080(5) sells "without equity or right of
 * redemption").
 */
export function redemptionWho(d: Pick<Deal, 'state' | 'kind'> & { id?: string }, i: BidInputs): string | null {
  const rule = redemptionRule(d, i);
  if (rule === 'usFederal' || rule === 'usCourt') return 'the United States';
  // A sale that usually carries no redemption (the rule it starts from is "none": a trustee's mortgage foreclosure, a
  // Texas execution sale) makes a typed wait your what-if; the special rules it also offers (Texas property tax loans)
  // apply only when picked.
  return rule === 'custom' && redemptionChoicesFor(d.state, d.kind).start === 'none' ? null : 'the owner';
}

/** The redemption rule this deal's Fix and sell numbers follow: the one picked from the menu while its numbers still
 *  match, else the rule those numbers match, else "custom" (your own numbers). */
export function redemptionRule(d: Pick<Deal, 'state' | 'kind'> & { id?: string }, i: BidInputs): string {
  const offered = offeredRedemptionRules(d.state, d.kind);
  const pre = `rulePick_${d.state}_${d.kind}_`;
  const pick = d.id ? [...readConfirmed(`fsf.bid.analyzed-${d.id}.v1`)].find((x) => x.startsWith(pre)) : undefined;
  const pr = pick ? offered[pick.slice(pre.length)] : undefined;
  // (A rule picked from the menu counts while the numbers are still that rule's, as in Fix and sell.)
  const rule = pr && pr.months === i.redemptionMonths && pr.ratePct === i.redemptionRatePct && pr.daily === (i.redemptionDaily ?? 0) && pr.flat === (i.redemptionFlat ?? 0) ? pick!.slice(pre.length) : ruleOf(i, offered);
  return rule;
}

/** The shortest owner redemption period the law sets for this kind of sale (in its menu), in months; 0 when there is none,
 *  or when the menu also offers "No redemption" (a California or Arizona court sale, an IRS sale: the law may set none). */
export function shortestRedemptionMonths(d: Pick<Deal, 'state' | 'kind'>): number {
  if (redemptionChoicesFor(d.state, d.kind).keys.includes('none')) return 0;
  const ms = Object.entries(offeredRedemptionRules(d.state, d.kind)).filter(([k, r]) => !['none', 'usFederal', 'usCourt'].includes(k) && r.months > 0).map(([, r]) => r.months);
  return ms.length ? Math.min(...ms) : 0;
}

/** Your wait, as shown (to a tenth of a month), is under the shortest period the law sets for this sale (0: none). */
export const shorterThanLaw = (months: number, shortest: number): boolean => shortest > 0 && Math.round(months * 10) / 10 < shortest;

/** Your wait in words: "a 3-month redemption wait", or "no redemption wait" for one that shows as 0. */
export const waitWords = (months: number): string => (months > 0 ? `a ${months}-month redemption wait` : 'no redemption wait');

/** The shortest period, in its rule's own words, with months where those are days or years ("180 days (about 6
 *  months)"); "" when there is none (as shortestRedemptionMonths). */
export function shortestRedemptionWords(d: Pick<Deal, 'state' | 'kind'>, inParens = false): string {
  const m = shortestRedemptionMonths(d);
  if (!m) return '';
  const r = Object.entries(offeredRedemptionRules(d.state, d.kind)).find(([k, x]) => !['none', 'usFederal', 'usCourt'].includes(k) && x.months === m)?.[1];
  // (The period in a rule's label: "Tax sale, other property: 180 days, up to +25%…" gives "180 days".)
  const said = r?.label.split(': ')[1]?.split(', ')[0]?.trim() ?? '';
  return !said ? monthsWord(m) : /month/.test(said) ? said : inParens ? `${said}, about ${monthsWord(m)}` : `${said} (about ${monthsWord(m)})`;
}

/** "N months", or "1 month". */
export const monthsWord = (n: number): string => `${n} month${n === 1 ? '' : 's'}`;

/** The redemption rule this deal's saved Fix and sell numbers follow, or null with none saved. */
function savedRule(d: Pick<Deal, 'state' | 'kind'> & { id?: string; plan?: Deal['plan'] }): string | null {
  if (!d.id || d.plan !== 'flip') return null;
  const raw = read(`fsf.bid.analyzed-${d.id}.v1`);
  if (!raw || typeof raw !== 'object') return null;
  const i = sanitizeInputs(raw, BLANK_INPUTS);
  const rule = redemptionRule(d, i);
  // "No redemption" you didn't choose (no wait typed, not confirmed, not picked) isn't set yet: Fix and sell starts
  // from the rule you last picked for this kind of sale, else the sale's own, as it does when it opens.
  const choices = redemptionChoicesFor(d.state, d.kind);
  const typed = readConfirmed(`fsf.bid.analyzed-${d.id}.v1`);
  const pickedHere = choices.keys.find((k) => typed.has(`rulePick_${d.state}_${d.kind}_${k}`));
  if (rule === 'none' && !i.redemptionChecked && !typed.has(`rulePick_${d.state}_${d.kind}_custom`) && (pickedHere ? pickedHere !== 'none' : choices.start !== 'none')) return pickedHere ?? choices.start;
  return rule;
}

/** An IRS sale with "No redemption" picked in Fix and sell (a court-ordered sale can allow none): a deed, not a certificate first. */
export const irsWithoutRedemption = (d: Pick<Deal, 'state' | 'kind'> & { id?: string; plan?: Deal['plan'] }): boolean => d.kind === 'irs' && savedRule({ ...d, plan: 'flip' }) === 'none';

/** A redemption wait typed in Fix and sell for this deal (a what-if its price is built on). */
function typedWait(d: Pick<Deal, 'state' | 'kind'> & { id?: string; plan?: Deal['plan'] }): boolean {
  if (!d.id || d.plan !== 'flip') return false;
  const raw = read(`fsf.bid.analyzed-${d.id}.v1`);
  if (!raw || typeof raw !== 'object') return false;
  const i = sanitizeInputs(raw, BLANK_INPUTS);
  // Only a wait someone can actually redeem in (not your what-if on a sale with no right of redemption).
  return Math.round(i.redemptionMonths * 10) > 0 && redemptionWho(d, i) !== null;
}

/** What to do about it, the same in Analyze and the packet. */
export const RENT_WAIT_ADVICE = 'These numbers start the rent right away: count that time’s holding costs, with no rent, in your budget (for example under Possession costs)';

/** Before the deed, a redemption period with no rent you can count on (a certificate of sale first): its words, or null. */
export function rentWaitNote(state: string | null | undefined, kind: string | null | undefined, dealId?: string): string | null {
  // (An IRS sale with "No redemption" picked: none.)
  if (kind === 'irs' && dealId && state && irsWithoutRedemption({ state: state as Deal['state'], kind: 'irs', id: dealId })) return null;
  if (state === 'NV' && kind === 'court') return 'After a Nevada sheriff’s sale the owner can redeem for 1 year, and whoever lives there may keep using the property until then (NRS 21.210, 21.240). If a tenant rents it, you’re entitled to that rent during the year, but it’s subtracted from what you’re repaid if someone redeems (NRS 21.250).';
  if (state === 'NV' && kind === 'hoa') return 'After a Nevada HOA sale the owner can redeem for 60 days, and you get the deed only after that (NRS 116.31166).';
  if (kind === 'irs') return 'After an IRS sale the owner can redeem for 180 days, and you get the deed only after that (26 U.S.C. 6337(b), 6338).';
  return null;
}

/** A bank-owned home: its seller may say it's exempt as a sale by foreclosure (NRS 113.130(2)(a)); then the trustee and
 *  lender give written notice of the defects they know of instead (113.130(4)). Whether a resale qualifies is a legal call. */
const reoDisclosure = (g: DateGuide): DateGuide => g.what !== 'Seller’s disclosure form due' ? g : {
  ...g,
  when: 'At least 10 days before closing, if the law requires one. A bank selling a home it took back may say it’s exempt as a sale by foreclosure; then the lender must give written notice of the defects it knows of instead.* Ask your agent which applies before you count on canceling.',
  missed: 'If a required form never comes, you may cancel before closing; confirm with your agent or attorney first.',
  why: 'NRS 113.130(2)(a) and (4), 113.150(1)',
};

/** Nevada's own deadlines on a home bought by offer (NRS 113.130, 113.150, 116.4109, leg.state.nv.us). */
const NV_OFFER_DATES: DateGuide[] = [
  { what: 'Seller’s disclosure form due', when: 'At least 10 days before closing (not required for some sales, such as a builder’s first sale, an estate or trust sale, or a sale between relatives; ask your agent).*', who: 'The seller or the seller’s agent', todo: 'Read it as soon as it arrives.', missed: 'If it never comes, you may cancel before closing without penalty.', why: 'NRS 113.130 and 113.150(1)' },
  { what: 'Defect cancellation deadline (if a defect is disclosed)', when: '4 working days after you’re told of a defect in writing.', who: 'You', todo: 'To cancel, put it in writing, have it notarized, and serve it on escrow (or the seller if there’s no escrow).', missed: 'You can close and accept the defect as disclosed.', why: 'NRS 113.150(2) and (3)' },
  { what: 'HOA resale package: cancel by (if in an HOA)', when: 'Midnight of the 5th calendar day after you receive it (no package is required on a sale by a government agency, such as HUD or VA, or a court-ordered sale).', who: 'You', todo: 'Write down the day it arrives; to cancel, give written notice.', missed: 'The right to cancel under that law ends.', why: 'NRS 116.4109(2) and 116.4101(2)' },
];

/** The dates most deals of this kind need on the calendar, each with how it works where we have it (Texas contracts). */
export function dateGuide(d: Pick<Deal, 'kind' | 'state'> & { plan?: Deal['plan']; id?: string }): DateGuide[] {
  const tx = d.state === 'TX';
  // A commercial building isn't bought on a home contract (Texas: TREC's one-to-four-family form), so no home-form dates.
  if (d.plan === 'commercial' && isOffer(d)) return [
    ...names(['Contract signed', 'Earnest money due', 'Feasibility (due-diligence) period ends', 'Title and survey objections due', ...(d.kind === 'short' ? ['Lienholder approval deadline (from the short sale addendum)'] : []), 'Loan approval deadline', 'Closing']),
  ];
  // Utah's state-approved purchase contract (REPC, section 24) has its own named deadlines.
  if (isOffer(d) && d.state === 'UT') return names([...(d.kind === 'short' ? ['Lienholder approval deadline (from the short sale addendum)'] : []), 'Acceptance (Day 0)', 'Earnest Money Deposit due (4 calendar days after Acceptance, unless the contract says otherwise)', 'Seller Disclosure Deadline', 'Due Diligence Deadline', 'Financing & Appraisal Deadline', 'Settlement Deadline', ...(d.kind === 'reo' ? ['Any dates the bank’s addendum changes (it can replace the REPC’s)'] : [])]);
  if (d.kind === 'short') return [...names(['Contract signed']), ...(tx ? TX_DEPOSIT_DATES : []), ...names(['Lienholder approval deadline (from the short sale addendum)', 'Approval notice received (dates count from here)']), ...(d.state === 'NV' ? NV_OFFER_DATES : []), ...(tx ? [TX_SHORT_OPTION_END, txDisclosureDate(true), txHoaDate(true), TX_TITLE_DATE, txWaterDate(true), txAppraisalDate(true), ...txLoanDates(true)] : names(['Inspection period ends', 'Loan approval deadline'])), ...names(['Closing'])];
  // Nevada (leg.state.nv.us): the seller's disclosure form at least 10 days before conveyance (NRS 113.130(1)); rescission
  // if it isn't served (113.150(1)), or within 4 working days, notarized, after a disclosed defect (113.150(2)-(3)); and 5
  // calendar days to cancel after an HOA's resale package arrives (116.4109(2)).
  if (isOffer(d) && d.state === 'NV') return [...names(['Offer accepted (Day 0)', 'Earnest money due', 'Inspection period ends']),
    ...(d.kind === 'reo' ? NV_OFFER_DATES.map(reoDisclosure) : NV_OFFER_DATES),
    ...names(['Appraisal deadline', 'Loan approval deadline', 'Closing'])];
  if (isOffer(d)) return [...names(['Offer accepted (Day 0)']), ...(tx ? TX_DEPOSIT_DATES : names(['Earnest money due'])), ...(tx ? [TX_OPTION_END, txDisclosureDate(false), txHoaDate(false), TX_TITLE_DATE, txWaterDate(false), txAppraisalDate(false), ...txLoanDates(false)] : names(['Inspection period ends', 'Appraisal deadline', 'Loan approval deadline'])), ...names(['Closing'])];
  // Nevada tax sale (leg.state.nv.us): the treasurer gives a quitclaim deed and records it at the purchaser's expense (NRS
  // 361.595(5), (7)); no action to recover the land lies unless brought within 2 years after its delivery (361.600).
  if (d.kind === 'taxSale' && d.state === 'NV') return [...names(['Bidder registration deadline', 'Sale day', 'Payment deadline']),
    { what: 'SID certificate payoff (if the sale notice lists one)', when: 'Within 20 days after the sale, if a city or county filed notice with the treasurer that the parcel has an unpaid special assessment (SID) certificate of sale (it sold one, or holds one).', who: 'You, with that city or county', todo: 'Pay what the certificate is owed; the treasurer can’t issue your deed until you do.', missed: 'The tax sale is void, and the treasurer may keep up to 10% of what you paid.', why: 'NRS 361.595(6)' },
    { what: 'Treasurer’s deed recorded', when: 'The county treasurer records the quitclaim deed at your expense after you pay.', who: 'The county treasurer', todo: 'Get a recorded copy, and insure the property right away.', missed: 'Ask the treasurer when it will be recorded.', why: 'NRS 361.595(5) and (7)' },
    { what: 'Recovery-suit window ends', when: '2 years after the treasurer’s deed is delivered to you.', who: 'The former owner, or anyone claiming the land', todo: 'Ask your title company when it will insure the title; a quiet title action may let you sell sooner.', missed: 'After it, no action to recover the land lies under that law.', why: 'NRS 361.600' }];
  // Nevada (NRS 271.595, leg.state.nv.us): redemption within 2 years with a home or other significant permanent
  // improvement, else 120 days, after the certificate of sale (1); a deed only after notice, given after that period, and
  // 60 days with no redemption (3)-(4); the certificate expires 3 years after the period ends (6), with no deed after (7).
  if (d.kind === 'lien' && d.state === 'NV') return [...names(['Registration (check the notice)', 'Sale day', 'Payment deadline']),
    { what: 'Earliest you may act (unpaid lien)', when: 'When the redemption period ends: 120 days after the certificate of sale, or 2 years if there was a home or other significant permanent improvement on the property. A deed can follow only after the notice the law requires, given after that, and 60 days with no redemption.', who: 'You, with your attorney', todo: 'Ask your attorney how to demand the deed: the law sets the notice and how it’s given.', missed: 'Nothing happens on its own: watch the date the certificate expires.', why: 'NRS 271.595(1), (3) and (4)' },
    { what: 'Certificate expires', when: '3 years after the redemption period ends (longer only while a court order or stay prevents a deed).', who: 'You, with the treasurer who sold the certificate', todo: 'If the lien isn’t paid, demand the deed from that treasurer before then.', missed: 'The certificate is void, and no deed can be issued to you.', why: 'NRS 271.595(6) and (7)' }];
  if (d.kind === 'lien') return names(['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Earliest date you may act on an unpaid lien']);
  // California homes of one to four units: a win isn't final until eligible bidders' windows close (Civil Code 2924m).
  // Texas: within 15 days the lender or trustee may rescind a sale for the reasons Property Code 51.016(b) lists (statutory
  // requirements not met, default cured before the sale, a bankruptcy stay in effect, and others).
  // Nevada: a sale that didn't substantially follow the law can be voided by a suit filed within 30 days after the trustee's
  // deed is recorded (90 days after the sale for someone who didn't get proper notice); after that, the failure doesn't
  // affect a bona fide purchaser (NRS 107.080(5)-(7)).
  if (d.kind === 'trustee' && d.state === 'NV') return [
    { what: 'Bidder registration (if required)', when: 'Ask the trustee before the sale; each trustee sets its own terms.', who: 'You, with the trustee', todo: 'Confirm how to bid and pay (usually cashier’s checks for the full bid at the sale).', missed: 'You may not be able to bid.' },
    ...names(['Sale day', 'Payment deadline']),
    { what: 'Deed recorded', when: 'The trustee records the deed within 30 days after the sale, or gives it to you within 20 days; then you must record it within 10 days of receiving it.', who: 'The trustee, or you if the trustee gives you the deed', todo: 'Ask the trustee which it will do. If you record it, post a copy on the property within 5 days after recording (your title company or attorney can arrange it).', missed: 'You can be liable for up to $500 plus damages and attorney’s fees, and the challenge window below starts only once the deed is recorded.', why: 'NRS 107.080(10) to (12)' },
    { what: 'Challenge window ends', when: '30 days after the trustee’s deed is recorded (90 days after the sale for someone who didn’t get proper notice).', who: 'The former owner, or anyone entitled to notice of the sale', todo: 'Record your deed right away, and hold off on repairs and new contracts until it passes; ask your title company whether it will insure before then.', missed: 'After it, a failure to follow the law in the sale no longer affects a bona fide purchaser’s rights.*', why: 'NRS 107.080(5)-(7)' },
    ...names([...(typedWait(d) ? ['Redemption period ends'] : [])])];
  if (d.kind === 'trustee' && d.state === 'TX') return [
    { what: 'Bidder registration (if required)', when: 'Ask the trustee before the sale.', who: 'You, with the trustee', todo: 'Confirm how to bid and pay (the price is due without delay when your bid is accepted).', missed: 'You may not be able to bid.' },
    ...names(['Sale day', 'Payment deadline']),
    { what: 'Rescission window ends', when: 'For a home of 1 to 4 units, a condo or a co-op unit: within 15 days after the sale.', who: 'The lender (mortgagee), the trustee or a substitute trustee', todo: 'Hold off on repairs and new contracts until it passes. The reasons the law lists include: the sale’s legal requirements weren’t met, the default was cured before the sale, or a bankruptcy stay was in effect.', missed: 'A notice mailed and recorded by day 15 counts even if it reaches you later; after that, the sale can’t be rescinded under that law.*', why: 'Property Code 51.016' },
    ...names(['Deed recorded', ...(typedWait(d) ? ['Redemption period ends'] : [])])];
  if (d.kind === 'trustee' && d.state === 'CA') return [{ what: 'Bidder registration (if required)', when: 'Ask the trustee before the sale; each trustee sets its own terms.', who: 'You, with the trustee', todo: 'Confirm how to bid and pay.', missed: 'You may not be able to bid.' }, ...names(['Sale day', 'Payment deadline']),
    { what: 'Intent-to-bid window ends', when: 'For a home of 1–4 units: 15 days after the sale.', who: 'Eligible bidders (such as tenants and some buyers who will live there)', todo: 'Watch for a notice that one of them intends to bid; until then your win isn’t final.', missed: 'If none gives notice in time, your win stands, unless an exception applies.*', why: 'Civil Code 2924m, in effect until January 1, 2031' },
    { what: 'Eligible bid deadline (45 days)', when: 'For a home of 1–4 units: 45 days after the sale, if one gave notice of intent.', who: 'The eligible bidder who gave notice', todo: 'Plan for the chance that a higher eligible bid replaces yours.', missed: 'If no qualifying bid arrives in time, your win stands.', why: 'Civil Code 2924m, in effect until January 1, 2031' },
    ...names(['Deed recorded', ...(typedWait(d) ? ['Redemption period ends'] : [])])];
  // (A trustee's sale lists registration only if the trustee requires one: the statutes set no registration step.)
  if (d.kind === 'trustee') return [{ what: 'Bidder registration (if required)', when: 'Ask the trustee before the sale; each trustee sets its own terms.', who: 'You, with the trustee', todo: 'Confirm how to bid and pay.', missed: 'You may not be able to bid.' }, ...names(['Sale day', 'Payment deadline', 'Deed recorded', ...(typedWait(d) ? ['Redemption period ends'] : [])])];
  const certFirst = d.kind === 'irs' ? savedRule({ ...d, plan: 'flip' }) !== 'none' : d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court');
  const out = [d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court') ? 'Bidder registration (if required)' : 'Bidder registration deadline', 'Sale day', 'Payment deadline', d.kind === 'irs' && certFirst ? 'Certificate of sale received' : certFirst ? 'Certificate of sale recorded' : 'Deed or certificate recorded'];
  const nvCert = d.kind === 'irs' && certFirst
    ? { what: 'Certificate of sale received', when: 'When you pay the full price.', who: 'The IRS', todo: 'Keep it safe: you hand it in for the deed.', missed: 'Ask the IRS sale officer.', why: '26 U.S.C. 6338(a)' }
    : d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court')
    ? { what: 'Certificate of sale recorded', when: 'After the sale.', who: d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : 'The sheriff', todo: 'Get a recorded copy, and insure the property right away.', missed: d.kind === 'hoa' ? 'Ask the HOA’s agent who ran the sale when it will be recorded.' : 'Ask the sheriff’s civil office when it will be recorded.', why: d.kind === 'hoa' ? 'NRS 116.31166(2)' : 'NRS 21.190' }
    : null;
  // Owners can't redeem after a Nevada, California, Utah or Arizona tax sale (redemption ends before the sale), or after a
  // Texas execution sale; a Texas tax sale has its own redemption period (Tax Code 34.21).
  if ((['hoa', 'irs', 'court'].includes(d.kind) || (d.kind === 'taxSale' && d.state === 'TX')) && redemptionChoicesFor(d.state, d.kind).start !== 'none' && savedRule(d.kind === 'irs' ? { ...d, plan: 'flip' } : d) !== 'none') out.push('Redemption period ends');
  // A redemption wait typed in Fix and sell (a what-if the price is built on) puts its end on the calendar too.
  else if (typedWait(d)) out.push('Redemption period ends');
  // Then the deed, if no one redeemed (NRS 116.31166(7); NRS 21.220(4); 26 U.S.C. 6338(b)).
  if (certFirst && out.includes('Redemption period ends')) out.push('Deed delivered (if no one redeemed)');
  const deedRow = certFirst ? { what: 'Deed delivered (if no one redeemed)', when: `After the redemption period, if no one redeemed${d.kind === 'irs' ? ': hand in the certificate of sale for the deed' : ''}.`, who: d.kind === 'hoa' ? 'The person who conducted the sale (the HOA’s agent)' : d.kind === 'irs' ? 'The IRS' : 'The sheriff', todo: 'Record the deed and get title insurance before you remodel or sell. If it was redeemed instead, you’re repaid your price plus what the law adds: press “It was redeemed: collect the payoff”, then “I was repaid” once you have it.', missed: d.kind === 'hoa' ? 'Ask the HOA’s agent who ran the sale when the deed will be delivered.' : d.kind === 'irs' ? 'Ask the IRS sale officer when the deed will be delivered.' : 'Ask the sheriff’s civil office when the deed will be delivered.', why: d.kind === 'hoa' ? 'NRS 116.31166(5) and (7)' : d.kind === 'irs' ? '26 U.S.C. 6338(b)' : 'NRS 21.220(4) and (5)' } : null;
  // When the owner's period starts, where the rule says (not under a United States redemption, which has its own).
  const ownerRule = !['usCourt', 'usFederal'].includes(savedRule(d) ?? '');
  // Nevada (leg.state.nv.us): an HOA sale's owner or a junior lienholder may redeem within 60 days (NRS 116.31166(3)), a
  // sheriff's sale's judgment debtor or a later lienholder within 1 year (NRS 21.200, 21.210); a certificate of sale first.
  const nvEnds = d.state === 'NV' && (d.kind === 'hoa' || d.kind === 'court')
    ? { what: 'Redemption period ends', when: d.kind === 'hoa' ? '60 days after the sale.' : '1 year after the sale.', who: d.kind === 'hoa' ? 'The former owner, or a lender whose recorded loan ranked below the HOA’s lien' : 'The former owner (the judgment debtor), or a creditor with a later judgment or mortgage lien', todo: d.kind === 'hoa' ? 'Secure, insure and maintain the property; hold off on remodeling until it ends. Keep receipts for taxes and upkeep you pay.' : 'Secure, insure and maintain the property; hold off on remodeling until it ends. Keep receipts for taxes, assessments and payments on earlier liens you make: a redemption repays those with interest, but not repairs or upkeep.', missed: 'After it ends, no one can redeem under that law, and the deed can follow if no one redeemed.*', why: d.kind === 'hoa' ? 'NRS 116.31166(2) and (3)' : 'NRS 21.200 and 21.210' }
    : null;
  // An IRS sale: 180 days for the owner or anyone with an interest in it (26 U.S.C. 6337(b)).
  const irsEnds = d.kind === 'irs' ? { what: 'Redemption period ends', when: '180 days after the sale.', who: 'The owner, or anyone with an interest in the property or a lien on it', todo: 'Secure, insure and maintain the property; hold off on remodeling until it ends. A redemption repays your price plus 20% a year, not taxes or upkeep you pay.', missed: 'After it ends, it can’t be redeemed under that law, and the deed can follow.*', why: '26 U.S.C. 6337(b)(1) and (2)' } : null;
  const ends = nvEnds ?? irsEnds ?? (d.state === 'UT' && d.kind === 'court' && ownerRule
    ? { what: 'Redemption period ends', when: '180 days after the sale.', who: 'The owner, or others the rule lets redeem', todo: 'Secure, insure and maintain the property; hold off on remodeling until it ends.', missed: 'After it ends, the owner can no longer redeem under that rule.*', why: 'Utah Rule of Civil Procedure 69C' }
    : d.state === 'TX' && d.kind === 'taxSale' && ownerRule
      ? { what: 'Redemption period ends', when: '180 days, or 2 years for the owner’s home (homestead), land designated for agricultural use or a mineral interest, counted from the day your deed is recorded, not from sale day.', who: 'The former owner', todo: 'Secure, insure and maintain the property; hold off on remodeling until it ends.', missed: 'After it ends, the owner can no longer redeem under that law.*', why: 'Tax Code 34.21' }
      : null);
  const hoaReg = d.state === 'NV' && d.kind === 'hoa' ? { what: 'Bidder registration (if required)', when: 'Ask the HOA’s foreclosure agent before the sale; each sets its own terms.', who: 'You, with the HOA’s foreclosure agent', todo: 'Confirm how to bid and pay.', missed: 'You may not be able to bid.' }
    : d.state === 'NV' && d.kind === 'court' ? { what: 'Bidder registration (if required)', when: 'Ask the sheriff’s civil office before the sale.', who: 'You, with the sheriff’s civil office', todo: 'Confirm how to bid and pay.', missed: 'You may not be able to bid.' } : null;
  return names(out).map((g) => (hoaReg && g.what === hoaReg.what ? hoaReg : ends && g.what === 'Redemption period ends' ? ends : nvCert && g.what === nvCert.what ? nvCert : deedRow && g.what === deedRow.what ? deedRow : g));
}

/** The names of the dates most deals of this kind need on the calendar, to start the list from. */
export function suggestedDates(d: Pick<Deal, 'kind' | 'state'>): string[] {
  return dateGuide(d).map((g) => g.what);
}

/** One plain line per detailed date, for the text download. */
export function dateGuideLines(d: Pick<Deal, 'kind' | 'state'>): string[] {
  return dateGuide(d).filter((g) => g.when).map((g) => `${g.what}: ${g.when} Who: ${g.who}. To do: ${g.todo} If missed: ${g.missed}${g.why ? ` (${g.why})` : ''}`);
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
/** Whether a deal's numbers are its own: the rent (or resale value) typed in, not the calculator's examples left in
 *  place behind one click on "Use the walk-away price". Lien certificates have no such input. */
const lienKey = (d: Deal) => `fsf.calc.lien.${d.id}${d.state === 'AZ' ? '-az' : ''}.v1`;

const GUIDE_FOR: Partial<Record<Deal['kind'], string>> = { trustee: 'foreclosure', taxSale: 'tax', court: 'sheriff', hoa: 'hoa', irs: 'irs', reo: 'reo', short: 'short' };
const LISTING_ROLES: ProKey[] = ['agent', 'lender', 'inspector', 'title', 'attorney', 'insurance', 'property_manager'];
/** A commercial building bought by offer (through a broker, or from a bank): no home inspector; environmental, appraisal and tax help. */
export const COMMERCIAL_OFFER_ROLES: ProKey[] = ['agent', 'lender', 'attorney', 'title', 'environmental', 'appraiser', 'insurance', 'cpa', 'property_manager'];

/**
 * The professionals this kind of sale usually needs (the team Your team shows for it), without a lender when your plan
 * says you're paying cash. Every other role can still be picked for a question.
 */
/** The sale guide for a deal's kind of sale in its state ('' for a regular listing). */
export function guideKeyFor(d: Pick<Deal, 'kind' | 'state'>): string {
  const pre = d.state === 'NV' ? '' : d.state.toLowerCase();
  return d.kind === 'lien' ? (d.state === 'NV' ? 'sid' : 'aztaxlien') : GUIDE_FOR[d.kind] ? `${pre}${GUIDE_FOR[d.kind]}` : '';
}

/** A professional's name for this deal: a commercial building bought by offer has a commercial broker, as Your team says. */
export function roleTitleFor(d: Pick<Deal, 'plan' | 'kind'>, k: ProKey): string {
  if (k === 'agent' && d.plan === 'commercial' && isOffer(d as Deal)) return 'Commercial real estate broker';
  return proGuideByKey(k)?.title ?? k;
}

export function teamRolesFor(d: Deal): ProKey[] {
  // A commercial deal bought by offer: the commercial-offer team (the commercial sale guides are built for auctions).
  const key = d.plan === 'commercial' && isOffer(d) ? '' : guideKeyFor(d);
  const book = key ? PLAYBOOKS.find((p) => p.key === key) : undefined;
  const roles = book ? [...new Set(book.team.map((t) => t.pro).filter((k): k is ProKey => !!k))] : d.plan === 'commercial' && isOffer(d) ? COMMERCIAL_OFFER_ROLES : LISTING_ROLES;
  const cash = investorProfile().loan === 'cash';
  return roles.filter((k) => !(cash && (k === 'lender' || k === 'private_lender')));
}

export function ownNumbers(d: Deal): boolean {
  const offerKey = isOffer(d) ? '-offer' : '';
  if (d.plan === 'rent') return readConfirmed(`fsf.calc.rent.${d.id}${offerKey}.v1`).has('monthlyRent');
  if (d.plan === 'flip') {
    // The resale value and the repairs (a walk-away price with repairs never entered counts nothing to fix).
    const key = `fsf.bid.analyzed-${d.id}.v1`;
    const typed = readConfirmed(key);
    const raw = read(key) as { repairs?: unknown } | null;
    return typed.has('exitValue') && (typed.has('repairs') || (typeof raw?.repairs === 'number' && raw.repairs > 0));
  }
  if (d.plan === 'commercial') return readConfirmed(`fsf.calc.commercial.${d.id}${offerKey}.v1`).has('monthlyRent');
  if (d.plan === 'lien') return readConfirmed(lienKey(d)).has('price');
  return true;
}

/** A fix-and-sell deal with its resale value typed but its repairs not yet (typed, or 0): the one thing missing. */
export function flipNeedsRepairs(d: Deal): boolean {
  if (d.plan !== 'flip') return false;
  const typed = readConfirmed(`fsf.bid.analyzed-${d.id}.v1`);
  return typed.has('exitValue') && !ownNumbers(d);
}

export function savedNumbers(d: Deal) {
  const offer = isOffer(d);
  // Example numbers aren't the property's numbers: nothing is reported until its own are typed.
  const own = ownNumbers(d);
  let rent: {
    /** FHA mortgage insurance a month, not counted (0: none). */
    mi: number; /** A loan over 80% of the price with no mortgage insurance counted (an investor's). */ miLeftOut?: boolean; /** An investor's offer loan over 85% of the price (under 15% down). */ loanHigh?: boolean; price: number; monthly: number; cashIn: number; allIn: number; repairs: number; possession: number; retained: number; refi: boolean; noLoan: boolean; exampleValue: boolean; refiValue: number; cashLimit: number; cashTyped: boolean; cashOnCash: number | null; target: number; /** The return target was typed (else it's our example). */ targetTyped?: boolean; /** Under the minimum income coverage at this price (investors). */ coverageShort?: boolean; minDscr?: number; dscrTyped?: boolean; stress: { label: string; monthly: number }[] } | null = null;
  let bid: {
    maxBid: number; cashOnDay: number; cashTotal: number; cashPeak: number; exitValue: number; none: boolean; target: number;
    /** No bid works only because of the cash entered: the deal itself works up to `profitBid`. */
    cashBlocked: boolean; profitBid: number;
    /** A profit target was typed (else it's our starting 15%). */
    targetTyped: boolean;
    /** Dollar target left at $0: no target yet (the walk-away is break-even). */
    noTarget: boolean;
    /** A loan pays part of the price or repairs (repair draws aren't modeled, so the cash figures assume the loan pays as costs come due). */
    financed: boolean;
    unentered: string[];
    /** A cash limit entered in Fix and sell (0: none). */
    cashLimit: number;
    /** What sets the walk-away price (your cash, or your profit target). */
    limitedBy: string;
    /** You typed the cash limit (a typed 0: no limit). */
    cashTyped: boolean;
    /** The result at your own price (your offer or bid, or else the asking price or opening bid); null when none is entered. */
    at: { price: number; source: 'yours' | 'listed'; profit: number; cashOnDay: number; cashPeak: number; cashLeft: number } | null;
    /** The redemption wait the walk-away price was built on, and what a redemption at its end returns against what you'd
     *  have spent, at your price (else the walk-away price), as Fix and sell shows it; null with no wait. */
    redeem?: { months: number; price: number; repaid: number; spent: number; net: number; who: string | null; source: 'yours' | 'walk'; /** Your own wait is under every period the law sets for this sale: the shortest (else 0). */ shortest?: number } | null;
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
    /** A cash limit entered in Commercial income (0: none). */
    cashLimit?: number;
    /** A cash figure was typed there (a typed 0 means no limit, as the field says). */
    cashTyped?: boolean;
    /** Your own cash needed at your price: all in before an auction's refinance, else the cash you put in. */
    atNeed?: number;
    /** The lender's minimum income coverage (DSCR) you entered. */
    minDscr?: number;
    /** The target cap rate was typed (else it's our example). */
    capTyped?: boolean;
    /** The value once leased, as entered (0: blank). */
    value?: number;
    /** No realistic price fits the cash entered: it doesn't cover the costs, or leaves almost nothing for the price. */
    noRealistic?: boolean;
    /** Cash due on sale day at your bid: the bid plus any buyer's premium (an auction). */
    atSaleDay?: number;
    /** Cash due on sale day at the highest price (an auction). */
    saleDay?: number;
    /** A loan is entered. */
    hasLoan?: boolean;
    /** Cash short and the deal itself supports under a tenth of the value: that price (0: not this case). */
    weakSupported?: number;
    /** The refinance entered costs more a year than the building earns (no bid works with that loan). */
    loanTooBig?: boolean;
    /** The minimum coverage was typed (else our example). */
    dscrTyped?: boolean;
    at?: ReturnType<typeof commercialAtPrice> & { price: number };
    stress: { label: string; maxBid: number | null; limitedBy?: CommercialLimit; capOnCost?: number | null }[];
  } | null = null;
  if (d.plan === 'rent' && own) {
    const rentRaw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
    if (rentRaw) {
      const key = `fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`;
      const typedRent = readConfirmed(key);
      // The same cash limit Keep and rent uses (My plan's until you type your own).
      const v = withPlanCash(withoutOldValueExample(sanitizeNumbers(rentRaw, RENT_DEFAULTS) as RentInputs, offer, typedRent), offer, typedRent, investorProfile().investable);
      if (v.atPrice > 0) {
        const a = rentAtPrice(v, v.atPrice, offer);
        rent = { mi: investorProfile().ownerOccupant && offer ? fhaMonthlyMi(v)?.monthly ?? 0 : 0, miLeftOut: offer && !investorProfile().ownerOccupant && v.loanPct > 80, loanHigh: offer && !investorProfile().ownerOccupant && Math.round(v.loanPct * 100) / 100 > 85, price: v.atPrice, monthly: a.cashFlow / 12, cashIn: a.cashIn, allIn: a.allIn, repairs: v.repairs * (1 + v.contingencyPct / 100), possession: v.possession, retained: v.reserveCash, refi: !offer && a.loan > 0, noLoan: !(a.loan > 0), exampleValue: refiOnExampleValue(v, offer, typedRent), refiValue: v.value, cashLimit: typedRent.has('cashAvailable') && v.cashAvailable > 0 ? v.cashAvailable : 0, cashTyped: typedRent.has('cashAvailable'), cashOnCash: a.cashOnCash, target: v.targetCocPct, targetTyped: typedRent.has('targetCocPct'), coverageShort: !(offer && investorProfile().ownerOccupant) && !refiOnExampleValue(v, offer, typedRent) && v.minDscr > 0 && a.dscr !== null && a.dscr < v.minDscr, minDscr: v.minDscr, dscrTyped: typedRent.has('minDscr'), stress: rentStress(v, v.atPrice, offer).map((s) => ({ label: s.label, monthly: s.monthly })) };
      }
    }
  } else if (d.plan === 'flip' && own) {
    const bidRaw = read(`fsf.bid.analyzed-${d.id}.v1`);
    if (bidRaw && typeof bidRaw === 'object') {
      const saved: BidInputs = sanitizeInputs(bidRaw, BLANK_INPUTS);
      const i = offer ? offerInputs(saved) : saved;
      if (i.exitValue > 0) {
        const r = maxSafeBid(i);
        const pp = proposedPriceOf(i);
        const at = pp ? { ...resultAtPrice(i, pp.price), source: pp.source } : null;
        const stress = stressCases(i).map((c) => ({ label: c.label, maxBid: maxSafeBid(c.inputs).maxBid, profit: pp ? resultAtPrice(c.inputs, pp.price).profit : null }));
        bid = { noTarget: !!i.profitInDollars && !(i.targetProfitMin > 0), targetTyped: (() => { const t = readConfirmed(`fsf.bid.analyzed-${d.id}.v1`); return t.has('targetProfitPct') || t.has('profitInDollars') || !!i.profitInDollars || (t.has('targetProfitMin') && (i.exitValue * i.targetProfitPct) / 100 < i.targetProfitMin); })(), cashBlocked: r.noBidWorks && r.profitBid > 0, profitBid: r.profitBid, maxBid: r.maxBid, cashOnDay: r.cashAtAuction, cashTotal: r.cashToStabilize, cashPeak: r.cashPeak, exitValue: i.exitValue, none: r.noBidWorks, target: requiredProfit(i), at, stress, financed: i.financedPct > 0, limitedBy: r.limitedBy, cashTyped: !offer && readConfirmed(`fsf.bid.analyzed-${d.id}.v1`).has('cashAvailable'), cashLimit: !offer && i.cashAvailable > 0 && readConfirmed(`fsf.bid.analyzed-${d.id}.v1`).has('cashAvailable') ? i.cashAvailable : 0, unentered: unenteredCosts(i, readConfirmed(`fsf.bid.analyzed-${d.id}.v1`), offer), redeem: (() => { // Your own price, else the walk-away price (as Fix and sell shows it; not the opening bid).
        // None when the walk-away price is below the opening bid (no bid there can be placed; My deals says so instead).
        const below = at?.source === 'listed' && r.maxBid < at.price;
        const price = at?.source === 'yours' ? at.price : r.noBidWorks || below ? 0 : r.maxBid;
        // Who redeems, as Fix and sell names it (null: your what-if on a sale with no right of redemption).
        const who = redemptionWho(d, i); const typedNone = (() => { const t = readConfirmed(`fsf.bid.analyzed-${d.id}.v1`); return t.has('redemptionMonths') || t.has(`rulePick_${d.state}_${d.kind}_custom`); })(); const shortest = who === 'the owner' && redemptionRule(d, i) === 'custom' && shorterThanLaw(i.redemptionMonths, shortestRedemptionMonths(d)) && (Math.round(i.redemptionMonths * 10) > 0 || typedNone) ? shortestRedemptionMonths(d) : 0; const o = !offer && price > 0 && Math.round(i.redemptionMonths * 10) > 0 ? redemptionOutcome(i, price) : null; if (!o) return !offer && (Math.round(i.redemptionMonths * 10) > 0 || shortest > 0) ? { months: Math.round(i.redemptionMonths * 10) / 10, price: 0, repaid: 0, spent: 0, net: 0, who, source: 'walk' as const, shortest } : null; return { months: Math.round(i.redemptionMonths * 10) / 10, price, ...o, who, source: at?.source === 'yours' ? 'yours' as const : 'walk' as const, shortest }; })() };
      }
    }
  } else if (d.plan === 'commercial' && own) {
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
        if (commercial) {
          commercial.cashLimit = v.cashAvailable > 0 ? v.cashAvailable : 0;
          commercial.minDscr = v.minDscr;
          commercial.dscrTyped = readConfirmed(`fsf.calc.commercial.${d.id}${offer ? '-offer' : ''}.v1`).has('minDscr');
          commercial.capTyped = readConfirmed(`fsf.calc.commercial.${d.id}${offer ? '-offer' : ''}.v1`).has('targetCapPct');
          commercial.value = v.value > 0 ? v.value : 0;
          // Only the cash entered is short (Commercial income says "No realistic price fits your cash").
          const unc = commercialMaxBid({ ...v, cashAvailable: 0 }, offer);
          commercial.noRealistic = noRealisticPrice(r, unc, v.value);
          commercial.weakSupported = cashAndPropertyWeak(r, unc, v.value) ? unc.maxBid : 0;
          commercial.loanTooBig = !!r.loanTooBig;
          commercial.hasLoan = v.loanPct > 0 && (offer || v.value > 0);
          commercial.saleDay = r.noBidWorks || !Number.isFinite(r.cashAtAuction) ? 0 : r.cashAtAuction;
          commercial.cashTyped = readConfirmed(`fsf.calc.commercial.${d.id}${offer ? '-offer' : ''}.v1`).has('cashAvailable');
        }
        if (commercial && v.atPrice > 0) {
          const a = commercialAtPrice(v, v.atPrice, offer);
          commercial.at = a;
          commercial.atSaleDay = Math.round(v.atPrice * (1 + (offer ? 0 : Math.max(0, v.buyerPremiumPct || 0)) / 100));
          commercial.atNeed = !offer && a.loan > 0 ? a.allIn : a.cashIn;
        }
      }
    }
  }
  // A lien certificate: its yield at the wait you entered, then paid later, from the Lien certificate calculator.
  let lien: { overCap: boolean; price: number; fees: number; months: number; yearly: number | null; profit: number; later: { months: number; yearly: number | null; profit: number } | null; /** Washoe doesn't prorate its 1% a month, and these months include a part month. */ partMonth?: boolean } | null = null;
  if (d.plan === 'lien' && own) {
    const raw = read(lienKey(d)) as Partial<LienInputs> | null;
    if (raw && typeof raw === 'object' && typeof raw.price === 'number' && raw.price > 0) {
      const v = sanitizeNumbers(raw, LIEN_DEFAULTS) as LienInputs;
      const y = lienYield(v);
      // The longest wait worth showing: the end of the owner's time to pay off (Nevada SID: up to 2 years with a
      // building), or Arizona's 3 years before a holder can go to court. Past that you're enforcing, not waiting.
      const laterMonths = d.state === 'NV' ? 24 : 36;
      const l = laterMonths > v.monthsToRedeem ? lienYield({ ...v, monthsToRedeem: laterMonths }) : null;
      lien = { overCap: v.ratePctMonth > (d.state === 'AZ' ? 16 / 12 : 1) + 0.001, price: v.price, fees: v.fees, months: v.monthsToRedeem, yearly: y.yearlyYield, profit: y.profit, later: l ? { months: laterMonths, yearly: l.yearlyYield, profit: l.profit } : null, partMonth: d.state === 'NV' && d.county === 'Washoe' && !Number.isInteger(Math.round(v.monthsToRedeem * 100) / 100) };
    }
  }
  return { rent, bid, commercial, lien };
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
/**
 * A sold flip in plain words: the sale against the resale value planned, and a rough profit before income tax (the sale,
 * less the price you entered, the costs to buy, what you recorded paying each month and the selling costs), against the
 * profit Fix and sell planned at that price.
 */
export function flipSaleLine(d: Deal): string | null {
  const sold = loadOwned()[d.id]?.sold;
  if (d.plan !== 'flip' || !sold) return null;
  const head = `Sold on ${sold.on} for ${money(sold.price)}`;
  const raw = read(`fsf.bid.analyzed-${d.id}.v1`);
  if (!raw || typeof raw !== 'object') return `${head}. Save its Fix and sell numbers in Analyze, with the price you paid in “Check an offer”, to see your rough profit; keep the closing statement for your taxes.`;
  const saved: BidInputs = sanitizeInputs(raw, BLANK_INPUTS);
  const i = isOffer(d) ? offerInputs(saved) : saved;
  const proposed = proposedPriceOf(i);
  const planned = i.exitValue > 0 ? ` (you planned a ${money(i.exitValue)} resale)` : '';
  if (!proposed || proposed.source !== 'yours') return `${head}${planned}. Type the price you paid in “Check an offer” under Fix and sell (Analyze) to see your rough profit; keep the closing statement for your taxes.`;
  const c = costsAtBid(i, proposed.price);
  const buy = c.premium + c.transferTax + c.survivingLiens + c.titleLegal + c.possession;
  const o = loadOwned()[d.id];
  const paid = o ? o.months.reduce((t, m) => t + m.costs - m.rent, 0) : 0;
  const selling = (sold.price * (i.sellingCostPct || 0)) / 100;
  const profit = sold.price - proposed.price - buy - paid - selling;
  const plan = c.total > 0 ? ` You planned about ${money(i.exitValue - c.total)} at that price.` : '';
  return `${head}${planned}. Rough profit before income tax: about ${money(profit)} (the sale, less your ${money(proposed.price)} ${isOffer(d) ? 'price' : 'bid'}, about ${money(buy)} to buy it, the ${money(paid)} you recorded paying${o && o.months.length ? '' : ' (no months recorded yet: add them for a truer figure)'}, and selling costs at ${i.sellingCostPct || 0}%, about ${money(selling)}).${plan} Your closing statement and your tax advisor have the exact figures.`;
}

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
  return !!(n.rent || n.bid || n.lien || (n.commercial && !n.commercial.noTarget));
}

const UNCONFIRMED_PLACE = 'Its location isn’t confirmed in Analyze: costs that follow the state and county (transfer tax, insurance, property tax) update once you confirm it there.';

const REPAIRS_NEEDED = (strategy: string) => `Enter the repairs in ${strategy} (type 0 if there truly are none). Until then this deal’s walk-away price doesn’t count them, so it isn’t shown here.`;

const commercialNoTarget = (strategy: string, overCap = false) => overCap
  ? `The price is over $1 billion with the rent and costs you entered in ${strategy}: check them for a typo.`
  : `No target return entered in ${strategy}: enter the cap rate you require to get a walk-away price.`;

type CommercialLimit = 'return' | 'cash' | 'dscr';
const pct1 = (x: number | null | undefined, target = 0) => (x === null || x === undefined ? null : `${capText(x, target)}%`);
/** The commercial walk-away price, worded by what sets it: your target return, your cash, or the lender's coverage. */
/** The calculator's own words for the cash limit: "put in" for a listed property (down payment, closing costs and repairs), "bring" at an auction. */
const cashLimit = (offer: boolean) => (offer ? 'the cash you can put in' : 'the cash you can bring');
function commercialPriceText(capPct: number, maxBid: number, limitedBy: CommercialLimit | undefined, capOnCost: number | null | undefined, offer: boolean, lower = false, noRealistic = false, capTyped = true, dscrTyped = true): string {
  const roc = pct1(capOnCost, capPct);
  // Under a tenth of the value: the cash goes to the costs, leaving almost nothing for the price (as the calculator says).
  if (noRealistic) return `${lower ? 'walk-away price' : 'Walk-away price'}, set by ${cashLimit(offer)}: ${money(maxBid)}, far below what the deal itself supports, so no realistic ${offer ? 'offer' : 'bid'} fits this cash`;
  if (limitedBy === 'cash') return `${lower ? 'walk-away price' : 'Walk-away price'}, set by ${cashLimit(offer)}: ${money(maxBid)}${roc ? ` (return on cost at that price: ${roc})` : ''}`;
  if (limitedBy === 'dscr') return `${lower ? 'walk-away price' : 'Walk-away price'}, set by ${dscrTyped ? 'your' : 'our example'} minimum income coverage (DSCR): ${money(maxBid)}${roc ? ` (return on cost at that price: ${roc})` : ''}`;
  return lower ? `highest price ${money(maxBid)}` : `Highest price for ${capTyped ? `${/^(8|11|18)(\.|$)|^8/.test(String(capPct)) ? 'an' : 'a'}` : 'our example'} ${capPct}% return on cost: ${money(maxBid)}`;
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
  const { rent, bid, commercial, lien } = savedNumbers(d);
  // An untouched profit target is our starting example, not the reader's goal: say so wherever it's the yardstick.
  const targetW = bid?.noTarget ? 'break-even (no profit target set yet)' : bid && !bid.targetTyped ? 'our example profit target' : 'your profit target';
  const goalW = targetW === 'your profit target' ? 'your goal' : targetW;
  const out: PacketSection[] = [];

  // 1. Your plan and buy box
  const boxLines = [
    `Goal: ${goal || 'not written yet'}`,
    `Investable cash: ${profile.investable > 0 ? money(profile.investable) : 'not worked out yet'}`,
    box.priceMax || box.types.length || box.cashMax || box.strategy ? `Buy box: ${[box.strategy ? box.strategy.charAt(0).toLowerCase() + box.strategy.slice(1) : '', box.types.join(', '), box.priceMax ? `up to ${money(box.priceMax)}${box.strategy === LIEN_STRATEGY ? ' for one certificate' : ''}` : '', box.cashMax ? `${money(box.cashMax)} of cash at most${profile.investable > 0 && box.cashMax > profile.investable ? ` (more than the ${money(profile.investable)} of investable cash you have now: update your buy box if it no longer fits)` : ''}` : '', box.minCashFlow && box.strategy !== 'Fix and flip' && box.strategy !== LIEN_STRATEGY ? `at least ${money(box.minCashFlow)} a month` : ''].filter(Boolean).join('; ')}` : 'Buy box: not set up yet',
    p.fit ? `This property: ${FIT_LABEL[p.fit]}${p.fitWhy ? `, because ${p.fitWhy}` : ''}` : 'This property: not judged against your buy box yet',
  ];
  out.push({ key: 'plan', title: 'Your plan and buy box', status: p.fit && p.fitWhy && goal ? 'done' : p.fit || goal || box.priceMax || box.cashMax || box.strategy || box.types.length ? 'started' : 'missing', lines: boxLines, fix: !goal || !(box.priceMax || box.cashMax) ? { label: 'Goal, cash and buy box in My plan', href: '#/toolkit' } : undefined });

  // 2. The property
  const sale = log.rows.sale;
  out.push({
    key: 'property',
    title: 'The property and the sale',
    status: sale?.done && sale.finding ? 'done' : sale?.done || sale?.finding ? 'started' : 'missing',
    lines: [`${d.name}`, `${kind ? kindLabel(kind, d.state) : d.kind} · ${countyName(d.county)}, ${d.state}`, sale?.finding ? `Verified: ${sale.finding}${sale.source ? ` (source: ${sale.source}${sale.checked ? `, ${sale.checked}` : ''})` : ''}` : sale?.done ? 'Reviewed (no finding written yet): add what the notice says in its evidence log.' : 'Not verified yet: the parcel, who is selling and what exactly is sold, from the official notice or listing.'],
  });

  // 3. Key dates
  const early = ['researching', 'offer'].includes(stageOf(d));
  const nd = stageOf(d) === 'passed' || finishedDeal(d) ? null : nextDate(remindable(p, now, early, behindStage(d, stageOf(d))), now);
  const openAfter = early && p.dates.some((x) => x.when && !x.resolved && afterSale(x.what));
  const dated = p.dates.filter((x) => x.when);
  const undatedDone = p.dates.filter((x) => !x.when && x.resolved && x.what.trim());
  out.push({
    key: 'dates',
    title: 'Key dates',
    // (A deal you passed on, or that was redeemed and repaid, has no stage left to review its calendar for.)
    status: calendarComplete(p, stageOf(d)) || (stageOf(d) === 'passed' && calendarReady(p, 'passed')) ? 'done' : dated.length ? 'started' : 'missing',
    lines: dated.length || undatedDone.length
      ? [...[...dated].sort((a, b) => a.when.localeCompare(b.when)).map((x) => `${x.when}: ${x.what}${x.who ? ` (${x.who})` : ''}${x.resolved ? ' — handled' : ' — open'}`), ...undatedDone.map((x) => `No date: ${x.what}${x.who ? ` (${x.who})` : ''} — handled`), nd ? `Next: ${nd.what}, ${nd.days < 0 && windowEnded(nd.what, -nd.days, d.kind) ? `${windowEnded(nd.what, -nd.days, d.kind)!.short} (${windowEnded(nd.what, -nd.days, d.kind)!.then})` : nd.days < 0 ? `overdue by ${-nd.days} day${nd.days === -1 ? '' : 's'}` : nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`}` : (openAfter ? 'Nothing is due before the sale; the dates after it come once you win.' : p.dates.some((x) => x.when && !x.resolved) ? 'Nothing else is due now.' : 'All dated items are marked handled.')]
      : [`Add the dates from the ${offer ? 'contract' : d.kind === 'trustee' && d.state === 'CA' ? 'official notice (the eligible-bidder windows count from the sale day, for homes of 1–4 units)' : d.kind === 'trustee' && d.state === 'NV' ? 'official notice (the challenge window counts from the day the trustee’s deed is recorded)' : d.kind === 'trustee' && d.state === 'TX' ? 'official notice (the rescission window counts from the sale day)' : 'official notice'}: ${suggestedDates(d).join('; ')}.${offer && d.plan === 'commercial' ? ' Commercial contracts vary: take each date from your signed contract.' : ''}`],
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
  // Washoe County publishes its tax sale's deposit and payment terms (Treasurer's FAQ, checked 2026-11-03).
  const washoeTax = !offer && d.kind === 'taxSale' && d.state === 'NV' && d.county === 'Washoe';
  if (washoeTax) cash.push('Washoe County’s tax sale terms (Treasurer’s FAQ): a $500 pre-bid deposit in certified funds when you register; if you win, a $500 non-refundable deposit (the FAQ doesn’t say whether it’s the pre-bid deposit)* and the balance by 5:00 p.m. the day after the sale, in cash, cashier’s check, certified check or money order. Confirm them in the sale notice.');
  // Washoe's balance is due the day after the sale, not all on sale day.
  const saleDay = (at: string, amount: number, end = '') => washoeTax
    ? `By 5:00 p.m. the day after the sale, at ${at}: ${money(amount)} (the full amount by then, in the form the sale requires; see the deposit terms above)${end}`
    : `On sale day, at ${at}: ${money(amount)} (bid plus any buyer’s premium, in the form the sale requires)${end}`;
  let need = 0;
  // The price `need` is figured at, so the investable-cash line after the what-if says which price it means.
  let needAt = '';
  if (rent) {
    if (rent.refi) {
      // A refinance comes later, if at all: until then every dollar of the price and costs is your cash.
      need = rent.allIn;
      needAt = `At a ${money(rent.price)} price`;
      cash.push(`From sale day until the refinance closes, all in: ${money(rent.allIn)} at a ${money(rent.price)} price (from ${strategy}: bid, buying costs and repairs)`);
      cash.push(rent.exampleValue ? `After a refinance: not this property’s yet (${refiValueWords(rent.refiValue)}). Enter the value after repairs in Keep and rent to see what a refinance would return.` : `After a refinance, if approved: ${rent.cashIn > 0 ? `${money(rent.cashIn)} of your cash left in` : 'the loan returns all your cash'}`);
    } else {
      need = rent.cashIn;
      needAt = `At a ${money(rent.price)} price`;
      if (offer) {
        const acquisition = Math.max(0, rent.cashIn - rent.repairs - rent.possession);
        cash.push(`Acquisition cash estimate at a ${money(rent.price)} price, before deposit credits: ${money(acquisition)} (${rent.noLoan ? 'the price and modeled buying costs, paying cash' : 'down payment and modeled purchase/loan costs'}; excludes repairs, possession costs and retained reserves).`);
        if (p.depositCredit) {
          cash.push(p.depositCredit <= acquisition && p.depositCredit <= p.earnest + (p.optionFee ?? 0)
            ? `After ${money(p.depositCredit)} of confirmed deposit/fee credits: ${money(acquisition - p.depositCredit)} remaining acquisition cash in this planning estimate.`
            : 'Review the confirmed credit: it exceeds the recorded deposit/fee payments or modeled acquisition cash. No remainder is calculated.');
        }
        cash.push(`Repair spending as work is done: ${money(rent.repairs)}, including the contingency. Possession costs, if needed: ${money(rent.possession)}.`);
        cash.push(`Total modeled acquisition, repairs and possession cash: ${money(rent.cashIn)}. This is not the amount to wire at closing.`);
        cash.push('Ask title/escrow and your lender for the actual cash to close and payment dates. Prepaid costs, escrow funding, prorations, credits and costs paid earlier can change it. Repair/lease-up carrying costs also need a separate budget if not included.');
      } else cash.push(`From sale day until it’s rented, all in: ${money(rent.cashIn)} at a ${money(rent.price)} price (from ${strategy}: bid, buying costs and repairs)${rentWaitNote(d.state, d.kind, d.id) ? `. ${rentWaitNote(d.state, d.kind, d.id)} ${RENT_WAIT_ADVICE}.` : ''}`);
    }
    cash.push(rent.retained > 0 ? `Retained property reserves: ${money(rent.retained)}, kept separately from the ${money(need)} modeled cash requirement.` : 'Retained property reserves: not entered. Set aside a separate amount for vacancies and unexpected costs.');
    if (rent.retained > 0) need += rent.retained;
  } else if (bid?.none && !bid.at) {
    cash.push(bid.cashBlocked ? `No bid fits the cash you entered in ${strategy}: the deal itself meets ${goalW} up to ${money(bid.profitBid)}, but every cost until you sell takes more cash than you entered.` : `No price works with the numbers you entered in ${strategy}: the costs and ${targetW} take up the whole ${money(bid.exitValue)} resale value.`);
  } else if (bid) {
    // Your own price first; the walk-away price is a separate what-if (the most you'd pay), never your price.
    const a = bid.at;
    if (a) {
      need = a.cashPeak;
      const at = `${priceName(a.source, offer)} of ${money(a.price)}`;
      needAt = `At ${at}`;
      if (!offer) cash.push(saleDay(at, a.cashOnDay));
      cash.push(`Estimated cash you’ll put in, at ${at}, under these assumptions (through repairs and holding until it sells): ${money(a.cashPeak)}`);
      if (a.cashLeft < a.cashPeak) cash.push(`Left in once the loan funds, at ${at}: ${money(a.cashLeft)}`);
    } else {
      need = bid.cashPeak;
      needAt = `At your walk-away price of ${money(bid.maxBid)}`;
      cash.push(`No ${offer ? 'offer or asking price' : 'bid or opening bid'} entered yet: add it in ${strategy} to see the cash at your own price.`);
    }
    // A walk-away price below the opening bid (or asking price) is no price you could pay: say so instead of a what-if.
    if (!bid.none && a?.source === 'listed' && bid.maxBid < a.price) {
      cash.push(`No ${offer ? 'offer at or above the asking price' : 'bid at or above the opening bid'} of ${money(a.price)} ${a.profit >= bid.target && bid.limitedBy === 'cash' ? 'fits your cash' : `meets ${goalW}`} as entered: the most that would is ${money(bid.maxBid)}, below it.`);
    } else if (!bid.none) {
      const what = `What-if, at your walk-away price of ${money(bid.maxBid)} (the most you could pay, not your price)`;
      cash.push(offer ? `${what}: estimated cash you’d put in ${money(bid.cashPeak)}` : `${what}: ${money(bid.cashOnDay)} ${washoeTax ? 'by 5:00 p.m. the day after the sale' : 'on sale day'}; estimated cash you’d put in ${money(bid.cashPeak)}`);
      // As Fix and sell says in red: with no cash entered there, the walk-away price can need more than My plan's cash.
      if (bid.at && bid.at.cashPeak <= profile.investable && !(bid.cashLimit > 0) && !bid.cashTyped && profile.investable > 0 && bid.cashPeak > profile.investable) cash.push(`That walk-away price needs ${money(bid.cashPeak - profile.investable)} more than the ${money(profile.investable)} of investable cash in My plan: ${offer ? 'offer only what fits your cash' : `enter the cash you can bring in ${strategy} to cap the bid at what you have`}.`);
    }
    if (bid.unentered.length) cash.push(`Doesn’t include costs still at $0 because not entered: ${bid.unentered.join('; ')}.`);
    if (bid.financed) cash.push(DRAW_NOTE);
  } else if (commercial?.at) {
    const a = commercial.at;
    need = commercial.atNeed ?? (!offer && a.loan > 0 ? a.allIn : a.cashIn);
    needAt = `At your actual price of ${money(a.price)}`;
    if (!offer) cash.push(saleDay(`your bid of ${money(a.price)}`, commercial.atSaleDay ?? a.price, '.'));
    cash.push(`${needAt}: ${money(need)} needed ${!offer && a.loan > 0 ? 'before a refinance closes (loan fees are paid at refinancing)' : a.loan > 0 ? 'from your own cash, including the loan’s points and fees' : 'from your own cash'}.`);
  } else if (commercial?.noTarget) {
    cash.push(commercialNoTarget(strategy, commercial.overCap));
  } else if (commercial?.noRealistic) {
    cash.push(`No realistic ${offer ? 'offer' : 'bid'} fits the cash you entered in ${strategy}: ${commercial.none ? 'it doesn’t cover the repairs and costs, before any price' : commercial.hasLoan ? `with what’s left for the down payment, the most you could pay is about ${money(commercial.maxBid)}` : `it covers the costs but leaves only about ${money(commercial.maxBid)} for the price`}. ${noRealisticAdvice(offer, !!commercial.hasLoan)}`);
  } else if (commercial?.none && commercial.weakSupported) {
    cash.push(`The income supports a price of only about ${money(commercial.weakSupported)}, far below the value, and the cash you entered in ${strategy} doesn’t cover the costs either. Check the rent and costs, or skip this one.`);
  } else if (commercial?.none && commercial.loanTooBig) {
    cash.push(`The refinance you entered costs more a year than the property earns, so no price works with that loan. Try a smaller loan, or run it all cash (in ${strategy}).`);
  } else if (commercial?.none && !(commercial.capPct > 0)) {
    cash.push(`No price works with the income, costs and loan you entered in ${strategy}.`);
  } else if (commercial?.none) {
    cash.push(`No price meets ${commercial.capTyped ? 'your' : 'our example'} ${commercial.capPct}% return on cost with the income and costs you entered in ${strategy}.`);
  } else if (commercial) {
    need = commercial.refi ? commercial.allIn : commercial.cashLeft;
    needAt = `At your highest price of ${money(commercial.maxBid)}`;
    if (!offer && (commercial.saleDay ?? 0) > 0) cash.push(saleDay(`your highest price of ${money(commercial.maxBid)}`, commercial.saleDay!, '.'));
    cash.push(commercial.refi
      ? `All in at your highest price, until a refinance closes: ${money(commercial.allIn)}; after a refinance, if approved: ${commercial.cashLeft < 0 ? `none left in (it returns all your cash and ${money(-commercial.cashLeft)} more)` : `${money(commercial.cashLeft)} left in`} (from ${strategy})`
      : `All in at your highest price: ${money(commercial.allIn)}, with ${money(commercial.cashLeft)} of your own cash left in (from ${strategy})`);
  } else if (lien) {
    need = lien.price + lien.fees;
    needAt = 'For the certificate';
    cash.push(`Certificate price ${money(lien.price)} plus fees ${money(lien.fees)}: ${money(need)}, ${d.state === 'NV' && (d.county === 'Clark' || d.county === 'Washoe') ? `due by 10:00 a.m. the ${d.county === 'Clark' ? 'business day' : 'day'} after the sale (${d.county} County Treasurer; confirm it in the notice of sale)` : d.state === 'AZ' ? 'due by the date the county treasurer sets, no later than 15 days after the sale closes (A.R.S. 42-18116); confirm it in the county’s sale terms' : 'due by the sale’s payment deadline (confirm the deadline and method in the county’s sale terms)'}.`);
  } else if (d.plan === 'lien') {
    cash.push('The certificate price and fees, from the Lien certificate calculator in Analyze.');
  } else if (flipNeedsRepairs(d)) {
    cash.push(REPAIRS_NEEDED(strategy));
  } else {
    cash.push(`Run ${strategy} in Analyze to see the cash this deal needs.`);
  }
  // The same limit the calculator uses: the cash you entered there, else My plan's investable cash.
  const entered = rent?.cashLimit || bid?.cashLimit || commercial?.cashLimit || 0;
  const typedNoLimit = !(entered > 0) && (rent?.cashTyped || bid?.cashTyped || commercial?.cashTyped || false);
  const limit = entered > 0 ? entered : typedNoLimit ? 0 : profile.investable;
  const limitWord = entered > 0 ? `the cash you entered in ${strategy}` : 'your investable cash';
  if (limit > 0 && need > 0) cash.push(need > limit ? `${needAt}, the ${money(need)} you’d put in is ${money(need - limit)} more than ${limitWord}: the deal doesn’t fit as entered. ${d.stage && !['researching', 'offer', 'passed'].includes(d.stage) ? `Check that you have it, or ${entered > 0 ? `update the cash in ${strategy}` : 'update My plan'}.` : `Skip this one, or ${entered > 0 ? `raise the cash in ${strategy}` : 'update My plan'} if you have more.`}` : `${needAt}, that leaves ${money(limit - Math.round(need))} unallocated from ${limitWord}${rent?.retained ? ', after the reserves you keep (above)' : ''}.`);
  const hasNums = hasSavedNumbers({ rent, bid, commercial, lien });
  out.push({ key: 'cash', title: 'Cash you’ll need, and when', doneLabel: 'Calculated (not verified)', status: hasNums && !bid?.unentered.length && (!offer || p.earnest) ? 'done' : hasNums || p.earnest || flipNeedsRepairs(d) ? 'started' : 'missing', lines: cash, fix: hasNums ? undefined : { label: `${strategy} in Analyze`, href: '#/analyze' } });

  // 5. Numbers: base and downside, for the deal's strategy only
  const nums: string[] = ['Returns, profit and cash flow are before income tax; personal taxes and depreciation are not included.', `Strategy: ${strategy}. These are the numbers you saved in its calculator; other strategies’ calculators aren’t counted.`];
  // You plan to live there: a monthly loss is what living there costs you (as Keep and rent and My deals say).
  const living = !!rent && offer && !!profile.ownerOccupant;
  if (rent && living) {
    nums.push(`Your offer (your actual price): ${money(rent.price)} → ${Math.round(Math.abs(rent.monthly)) === 0 ? 'the rent you collect about breaks even with every cost' : rent.monthly < 0 ? `living there costs you about ${money(-rent.monthly)} a month after any rent you collect` : `the rent you collect covers every cost, with about ${money(rent.monthly)} a month to spare`}${rent.mi > 0 ? `, before mortgage insurance (about ${money(rent.mi)} a month on an FHA loan; not counted)` : ''}. Compare that with what you pay to live where you are now; the return target is an investor’s yardstick.`);
    for (const s of rent.stress.slice(1)) nums.push(`  If ${s.label.toLowerCase().replace(/^takes /, 'it takes ')}: ${s.monthly < 0 ? `living there costs about ${money(-s.monthly)} a month` : `${money(s.monthly)} a month to spare`}`);
  } else if (rent) {
    nums.push(`${offer ? 'Your offer' : 'Your bid'} (your actual price): ${money(rent.price)} → monthly cash flow ${money(rent.monthly)}${rent.exampleValue ? ` (${refiValueWords(rent.refiValue)})` : rent.refi ? ' after the refinance' : ''}; ${rent.exampleValue && rent.refiValue > 0 ? 'return not shown until you enter the value after repairs' : rent.cashOnCash === null ? 'all your cash back' : `${capText(rent.cashOnCash, rent.target)}% a year on your cash`} (${rent.targetTyped ? 'your' : 'our example'} target ${rent.target}%)${rent.coverageShort ? `; income coverage under ${rent.dscrTyped ? 'your' : 'our example'} ${rent.minDscr}× minimum` : ''}`);
    for (const s of rent.stress.slice(1)) nums.push(`  If ${s.label.toLowerCase().replace(/^takes /, 'it takes ')}: ${money(s.monthly)} a month`);
    if (rent.loanHigh) nums.push('Loans for a property you won’t live in usually need 15% to 25% down,* so this loan may be more than a lender would make: ask your lender for their figure. Mortgage insurance isn’t included in these payments either.');
    else if (rent.miLeftOut) nums.push('Mortgage insurance, which most loans add with under 20% down, isn’t included in these payments: ask your lender for it.');
  }
  if (bid) {
    const a = bid.at;
    if (a) nums.push(`${priceName(a.source, offer, true)} (${a.source === 'yours' ? 'your actual price' : offer ? 'used until you enter your own offer' : 'the lowest you could pay, used until you enter your own bid'}): ${money(a.price)} → estimated profit ${money(a.profit)} (${bid.noTarget ? 'no profit target set yet' : `${bid.targetTyped ? 'your target' : 'our example target'} ${money(bid.target)}`}${a.profit < bid.target ? (bid.noTarget ? ', below break-even' : ', so it falls short') : ''}), based on a ${money(bid.exitValue)} resale value`);
    const belowOpening = !bid.none && a?.source === 'listed' && bid.maxBid < a.price;
    nums.push(bid.none && bid.cashBlocked ? `No bid fits the cash you entered: the deal itself meets ${goalW} up to ${money(bid.profitBid)}, but every cost until you sell takes more cash than that` : bid.none ? `No price works at a ${money(bid.exitValue)} resale value with these costs and ${targetW}` : `What-if: walk-away price ${money(bid.maxBid)}, ${bid.limitedBy === 'cash' ? `the most your cash covers with every cost until you sell (${goalW} alone allows ${money(bid.profitBid)})` : `the most you could pay and still meet ${goalW}`} (not your actual price)${a ? '' : `, based on a ${money(bid.exitValue)} resale value`}${belowOpening ? `. That’s below the ${offer ? 'asking price' : 'opening bid'} of ${money(a!.price)}, so ${a!.profit >= bid.target && bid.limitedBy === 'cash' ? 'your cash doesn’t cover this deal' : `this deal doesn’t meet ${goalW}`} as entered` : ''}`);
    if (bid.redeem && !bid.redeem.who) nums.push(`Built on a ${bid.redeem.months}-month wait you typed as a what-if. ${noRedemptionWords(d)} Check the sale terms with the official seller or an attorney.`);
    // Your own wait, under every period the law sets for this sale: said once, with the shortest.
    const shorter = bid?.redeem?.shortest ? ` That’s shorter than any redemption period the law sets for this sale (the shortest is ${shortestRedemptionWords(d, true)}):* the owner can still redeem until it ends.` : '';
    if (bid?.redeem && bid.redeem.who && !(bid.redeem.price > 0)) nums.push(bid.redeem.shortest ? `Built on ${waitWords(bid.redeem.months)}.${shorter}` : `Built on a ${bid.redeem.months}-month redemption wait: ${bid.redeem.who} can redeem until it ends.`);
    else if (bid.redeem && bid.redeem.who) { const x = bid.redeem; nums.push(`Built on a ${x.months}-month redemption wait.${shorter} If ${x.who} redeems at its end, you’d get back about ${money(x.repaid)}* on a ${money(x.price)} ${offer ? 'offer' : 'bid'}${x.source === 'walk' ? ' (your walk-away price)' : ''}, having spent about ${money(x.spent)}: about ${money(Math.abs(x.net))} ${x.net < 0 ? 'short' : 'ahead'} (Fix and sell shows how).`); }
    if (bid.unentered.length) nums.push(`Still $0 because not entered: ${bid.unentered.join('; ')}. Until you enter them (or type 0 where there truly is none), these numbers and the downside cases below don’t count them.`);
    const floor = a?.source === 'listed' ? a.price : 0;
    for (const s of bid.stress.slice(1)) {
      const walk = s.maxBid > 0 && floor > 0 && s.maxBid < floor ? `below the ${offer ? 'asking price' : 'opening bid'} (walk-away price ${money(s.maxBid)})` : s.maxBid > 0 ? `walk-away price ${money(s.maxBid)}` : 'no price works';
      nums.push(`  If ${s.label.toLowerCase().replace(/^takes /, 'it takes ')}: ${a && s.profit !== null ? `profit ${money(s.profit)} at ${money(a.price)}; ${walk}` : walk}`);
    }
  }
  if (commercial?.at) {
    const a = commercial.at;
    nums.push(`Your ${offer ? 'offer' : 'bid'} (your actual price): ${money(a.price)} → monthly cash flow before income tax ${money(a.cashFlow / 12)}; ${a.cashIn < 0 ? `cash left in: none (the refinance returns all your cash and ${money(-a.cashIn)} more, if approved)` : `cash left in ${money(a.cashIn)}`}; return on total cost ${pct1(a.capOnCost, commercial.capPct)}; ${a.dscr === null ? 'no loan' : `income coverage ${dscrText(a.dscr)}× (${a.loanOk ? 'meets' : 'below'} ${commercial.dscrTyped ? 'your' : 'our example'} ${commercial.minDscr ?? 1.25}× minimum)`}`);
  }
  if (commercial?.noTarget) nums.push(commercialNoTarget(strategy, commercial.overCap));
  else if (commercial?.none && commercial.noRealistic) nums.push(`No realistic ${offer ? 'offer' : 'bid'} fits the cash you entered: it doesn’t cover the repairs and costs, before any price. ${commercial.capPct > 0 ? `Without that cash limit the deal meets ${commercial.capTyped ? 'your' : 'our example'} ${commercial.capPct}% return on cost` : 'Without that cash limit the numbers work'}`);
  else if (commercial?.none && commercial.weakSupported) nums.push(`The income supports a price of only about ${money(commercial.weakSupported)}, far below the value, and the cash you entered doesn’t cover the costs either`);
  else if (commercial?.none && commercial.loanTooBig) nums.push(`The refinance you entered costs more a year than the property earns, so no price works with that loan. Try a smaller loan, or run it all cash (in ${strategy})`);
  else if (commercial?.none && !(commercial.capPct > 0)) nums.push(`No price works with the income, costs and loan you entered in ${strategy}`);
  else if (commercial?.none) nums.push(`No price meets ${commercial.capTyped ? 'your' : 'our example'} ${commercial.capPct}% return on cost with the income and costs you entered`);
  else if (commercial) {
    const priceText = commercialPriceText(commercial.capPct, commercial.maxBid, commercial.limitedBy, commercial.capOnCost, offer, false, !!commercial.noRealistic, !!commercial.capTyped, !!commercial.dscrTyped);
    nums.push(/no realistic/.test(priceText) ? `${priceText}.` : `${priceText}, on ${money(commercial.noi)} a year of net operating income`);
    for (const s of commercial.noRealistic ? [] : commercial.stress) {
      // Cash sets both prices: the lower rent doesn't move it, so say so instead of repeating the same figure as news.
      const same = s.limitedBy === 'cash' && commercial.limitedBy === 'cash' && s.maxBid === commercial.maxBid;
      nums.push(`  If ${s.label.toLowerCase().replace(/^takes /, 'it takes ')}: ${s.maxBid !== null && s.maxBid > 0 ? (same ? `still ${money(s.maxBid)}, set by ${cashLimit(offer)}${pct1(s.capOnCost, commercial.capPct) ? ` (return on cost at that price: ${pct1(s.capOnCost, commercial.capPct)})` : ''}` : commercialPriceText(commercial.capPct, s.maxBid, s.limitedBy, s.capOnCost, offer, true, false, !!commercial.capTyped, !!commercial.dscrTyped)) : 'no price works'}`);
    }
  }
  if (lien) {
    const yr = (y: number | null) => (y === null ? 'no yield' : `${(y * 100).toFixed(1)}% a year`);
    if (lien.overCap) nums.push(`The interest rate entered is more than ${d.state === 'AZ' ? 'Arizona’s legal maximum of 16% a year (1.33% a month)' : 'Nevada’s 1% a month'}, so no yield is shown: enter the monthly rate in Lien certificate.`);
    if (!lien.overCap) nums.push(`Certificate ${money(lien.price)}: if paid off in ${lien.months} months, ${yr(lien.yearly)} on your cash (profit after fees ${money(lien.profit)})${lien.partMonth ? '. Washoe County says its 1% a month “will not be prorated”, so the part month may not earn its share: ask the Treasurer how it’s counted' : ''}`);
    nums.push('  Downside, if it’s never paid off: no payoff comes; your cash stays in until you enforce the lien, which usually takes an attorney and more cost.*');
    if (lien.later && !lien.overCap) nums.push(`  If it takes longer, to ${lien.later.months} months: your ${money(lien.price)} is tied up ${lien.later.months - lien.months} months more, earning ${yr(lien.later.yearly)} (profit after fees ${money(lien.later.profit)}; the yearly rate can read higher because the fees and the wait to be paid are spread over more months, but your money is tied up longer); add any later taxes or assessments you pay to protect the lien.`);
  }
  // A saved deal's state or county changed in Analyze and isn't confirmed yet: its costs still follow the old place.
  if (hasNums && !d.locationConfirmed) nums.push(UNCONFIRMED_PLACE);
  if (!hasNums && flipNeedsRepairs(d)) nums.push(REPAIRS_NEEDED(strategy));
  else if (!hasNums && d.plan === 'rent') nums.push(`No numbers yet: type the property’s rent, and the price you’d pay, in ${strategy}. Our example rent doesn’t count.`);
  else if (!hasNums && d.plan === 'commercial') nums.push(`No numbers yet: type the building’s rent in ${strategy}. Our example rent doesn’t count.`);
  else if (!hasNums) nums.push('No numbers yet. Every figure here is your estimate until a source backs it.');
  // Done only once there's a downside to look at, not just the base case.
  const downside = !!lien || (rent && rent.stress.length > 1) || (bid && bid.stress.length > 1) || (commercial && (commercial.none || commercial.stress.length > 0));
  out.push({ key: 'numbers', title: 'Numbers: base case and downside', doneLabel: 'Calculated (not verified)', status: downside && !bid?.unentered.length ? 'done' : hasNums || flipNeedsRepairs(d) ? 'started' : 'missing', lines: nums, fix: { label: 'Open in Analyze', href: '#/analyze' } });

  // 6. Evidence
  const areas = areasFor(d.kind);
  const checked = areas.filter((a) => log.rows[a.key]?.done);
  const open = areas.map((a) => ({ a, r: log.rows[a.key] })).filter(({ r }) => r?.open && !r.done);
  out.push({
    key: 'evidence',
    title: 'What you’ve verified, and what’s open',
    status: checked.length === areas.length ? 'done' : checked.length || open.length ? 'started' : 'missing',
    lines: [`${checked.length} of ${areas.length} areas checked${checked.length ? `: ${checked.map((x) => x.title).join(', ')}` : ''}`, ...open.map(({ a, r }) => `Open (${a.title}): ${r.open}${r.owner ? `, ${r.owner}` : ''}`), ...areas.filter((a) => !log.rows[a.key]?.done && !log.rows[a.key]?.open).map((a) => `Not checked: ${a.title}`)],
  });

  // 7. Professionals
  const answered = p.qa.filter((x) => x.q && x.a);
  const waiting = p.qa.filter((x) => x.q && !x.a);
  out.push({
    key: 'pros',
    title: 'Questions for your professionals',
    status: answered.length && !waiting.length ? 'done' : p.qa.length ? 'started' : 'missing',
    lines: p.qa.length
      ? p.qa.filter((x) => x.q).map((x) => `${proGuideByKey(x.role as never) ? roleTitleFor(d, x.role as never) : 'Other'}: ${x.q} → ${x.a ? `${x.a}${x.on ? ` (${x.on})` : ''}` : 'waiting for an answer'}`)
      : [`Write down the question this deal raises for each of: ${teamRolesFor(d).map((k) => roleTitleFor(d, k)).join(', ')}. Add any other professional you’ll use.`],
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
  return { text: t.urgent ? t.text : `${t.label}${/[?.!]$/.test(t.label) ? '' : '.'} You’ll have ${t.produces}.`, href: t.openDeal ? '#/analyze' : undefined };
}

/** The whole packet as plain text, to download, print or share with your professionals. */
export function dealPacketText(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): string {
  const lines = [`DEAL PACKET: ${d.name}`, 'DeedOwl educational worksheet. Every number is your estimate until a source backs it; a checkmark records your review, not a clear title.', ''];
  lines.push(`STAGE: ${stageLabel(stageOf(d), d)}`, `NEXT ACTION: ${nextAction(d, p, now).text}`, ...(flipSaleLine(d) ? [`SALE: ${flipSaleLine(d)}`] : []), '');
  for (const s of packetSections(d, p, now)) {
    lines.push(`${s.title.toUpperCase()} [${s.status === 'done' ? (s.doneLabel ?? 'complete').toLowerCase() : s.status === 'started' ? 'in progress' : 'missing'}]`, ...s.lines);
    if (s.key === 'dates' && dateGuideLines(d).length) lines.push(`What the less familiar ${d.state === 'TX' ? (isOffer(d) ? 'Texas contract ' : 'Texas ') : ''}dates mean (${isOffer(d) ? 'the signed contract wins' : 'the official notice wins'}):`, ...dateGuideLines(d).map((l) => `- ${l}`));
    lines.push('');
  }
  // A line marked with an asterisk: say what it means (a downloaded file has no page footer).
  if (lines.some((l) => l.includes('*'))) lines.push(ASTERISK_NOTE);
  return lines.join('\n');
}
