// The deal packet: one page per property you're analyzing that pulls together everything a decision needs and says
// what's still missing. Most of it comes from what's already saved (the deal, its calculators, its evidence log,
// your goal, buy box and team). This file adds the few things nothing else stores: whether it fits your buy box and
// why, the deal's key dates, your questions to professionals and their answers, your earnest money, and the reason
// for your decision with any conditions still open. Kept only in this browser, like the rest.
import { kindLabel, SALE_KINDS, type Deal } from './analyze';
import { maxSafeBid, offerInputs, proposedPriceOf, resultAtPrice, requiredProfit, sanitizeInputs, stressCases, BLANK_INPUTS, type BidInputs } from './bidCalc';
import { cleanBuyBox, EMPTY_BUY_BOX, type BuyBox } from './toolkit';
import { EVIDENCE_AREAS, GATES, loadLog } from './evidence';
import { commercialMaxBid, COMMERCIAL_DEFAULTS, rentAtPrice, rentStress, RENT_DEFAULTS, sanitizeNumbers, type CommercialInputs, type RentInputs } from './holdCalc';
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
  qa: PacketQA[];
  /** Earnest money (or a bidder deposit) you'll put up when you commit; 0 when not known yet. */
  earnest: number;
  decisionWhy: string;
  conditions: string;
}

export const EMPTY_PACKET: PacketData = { fit: '', fitWhy: '', dates: [], qa: [], earnest: 0, decisionWhy: '', conditions: '' };

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
    return { when: DATE.test(when) ? when : '', what: str(r.what, 200), who: str(r.who, 120) };
  });
  const qa = (Array.isArray(o.qa) ? o.qa : []).slice(0, 40).map((d) => {
    const r = obj(d);
    const on = str(r.on, 10);
    return { role: str(r.role, 30), q: str(r.q, 500), a: str(r.a, 1000), on: DATE.test(on) ? on : '' };
  });
  const earnest = typeof o.earnest === 'number' && Number.isFinite(o.earnest) && o.earnest > 0 ? Math.min(o.earnest, 1e9) : 0;
  return { fit, fitWhy: str(o.fitWhy, 600), dates, qa, earnest, decisionWhy: str(o.decisionWhy, 1000), conditions: str(o.conditions, 1000) };
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

/** Texas financing dates: the appraisal addendum (49-1) and the financing addendum's two approvals (40-11, paragraph 2A and 2B). */
const TX_LOAN_DATES = ['Appraisal addendum deadline, if you have one (49-1: notice plus a copy of the appraisal to the seller)', 'Buyer Approval deadline (40-11, 2A: notice plus the lender’s written statement)', 'Property Approval deadline (40-11, 2B: 3rd day before closing)'];

/** Texas earnest money and option fee (20-19, 5A and 5D). Under a short sale addendum they're still due on time (45-2, C). */
const TX_DEPOSIT_DATES = ['Earnest money due (within 3 days after the effective date; a last day on a weekend or legal holiday moves to the next day that isn’t one; if late, the seller can end the contract until you deliver it)', 'Option fee due (same 3 days and weekend rule; if late, you lose the right to end the contract during the option period)'];

/** Texas water disclosure (20-19, 7I(2)): only when that box is checked. */
const TX_WATER_DATE = 'Seller’s Water Disclosure due, if box 7I(2) is checked (you can end the contract within 7 days after you receive it, or before closing if sooner)';

/** The dates most deals of this kind need on the calendar, to start the list from. */
export function suggestedDates(d: Pick<Deal, 'kind' | 'state'>): string[] {
  if (d.kind === 'short') return ['Contract signed', ...(d.state === 'TX' ? TX_DEPOSIT_DATES : []), 'Lienholder approval deadline (from the short sale addendum)', 'Approval notice received (dates count from here)', d.state === 'TX' ? 'Option period ends (5 p.m.)' : 'Inspection period ends', ...(d.state === 'TX' ? [TX_WATER_DATE, ...TX_LOAN_DATES.slice(1)] : ['Loan approval deadline']), 'Closing'];
  if (isOffer(d)) return ['Offer accepted (Day 0)', ...(d.state === 'TX' ? TX_DEPOSIT_DATES : ['Earnest money due']), d.state === 'TX' ? 'Option period ends (5 p.m.)' : 'Inspection period ends', ...(d.state === 'TX' ? [TX_WATER_DATE, ...TX_LOAN_DATES] : ['Appraisal deadline', 'Loan approval deadline']), 'Closing'];
  if (d.kind === 'lien') return ['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Earliest date you may act on an unpaid lien'];
  const out = ['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Deed or certificate recorded'];
  // Owners can't redeem after a Nevada, California, Utah or Arizona tax sale (redemption ends before the sale), or after a
  // Texas execution sale; a Texas tax sale has its own redemption period (Tax Code 34.21).
  if ((['hoa', 'irs', 'court'].includes(d.kind) || (d.kind === 'taxSale' && d.state === 'TX')) && !(d.state === 'TX' && d.kind === 'court')) out.push('Redemption period ends');
  return out;
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
  let rent: { price: number; monthly: number; cashIn: number; allIn: number; refi: boolean; cashOnCash: number | null; target: number; stress: { label: string; monthly: number }[] } | null = null;
  let bid: {
    maxBid: number; cashOnDay: number; cashTotal: number; cashPeak: number; exitValue: number; none: boolean; target: number;
    /** The result at your own price (your offer or bid, or else the asking price or opening bid); null when none is entered. */
    at: { price: number; source: 'yours' | 'listed'; profit: number; cashOnDay: number; cashPeak: number; cashLeft: number } | null;
    /** Each downside case: the walk-away price, and the profit at your own price (null when no price is entered). */
    stress: { label: string; maxBid: number; profit: number | null }[];
  } | null = null;
  let commercial: { maxBid: number; noi: number; capPct: number; cashLeft: number; allIn: number; refi: boolean; none: boolean; stress: { label: string; maxBid: number | null }[] } | null = null;
  if (d.plan === 'rent') {
    const rentRaw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
    if (rentRaw) {
      const v = sanitizeNumbers(rentRaw, RENT_DEFAULTS) as RentInputs;
      if (v.atPrice > 0) {
        const a = rentAtPrice(v, v.atPrice, offer);
        rent = { price: v.atPrice, monthly: a.cashFlow / 12, cashIn: a.cashIn, allIn: a.allIn, refi: !offer && a.loan > 0, cashOnCash: a.cashOnCash, target: v.targetCocPct, stress: rentStress(v, v.atPrice, offer).map((s) => ({ label: s.label, monthly: s.monthly })) };
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
        bid = { maxBid: r.maxBid, cashOnDay: r.cashAtAuction, cashTotal: r.cashToStabilize, cashPeak: r.cashPeak, exitValue: i.exitValue, none: r.noBidWorks, target: requiredProfit(i), at, stress };
      }
    }
  } else if (d.plan === 'commercial') {
    const raw = read(`fsf.calc.commercial.${d.id}${offer ? '-offer' : ''}.v1`);
    if (raw) {
      const v = sanitizeNumbers(raw, COMMERCIAL_DEFAULTS) as CommercialInputs;
      if (v.monthlyRent > 0) {
        const r = commercialMaxBid(v, offer);
        // No price meets the target return with these numbers: that's a result too, not a missing one.
        if (r.noBidWorks || !Number.isFinite(r.maxBid)) commercial = { maxBid: 0, noi: r.noi, capPct: v.targetCapPct, cashLeft: 0, allIn: 0, refi: false, none: true, stress: [] };
        else {
          // The downside: the same deal with rent 10% lower (null: no price meets the target then).
          const low = commercialMaxBid({ ...v, monthlyRent: v.monthlyRent * 0.9 }, offer);
          const stress = [{ label: 'Rent 10% lower', maxBid: low.noBidWorks || !Number.isFinite(low.maxBid) ? null : low.maxBid }];
          commercial = { maxBid: r.maxBid, noi: r.noi, capPct: v.targetCapPct, cashLeft: r.cashLeft, allIn: r.allIn, refi: !offer && r.debtService > 0, none: false, stress };
        }
      }
    }
  }
  return { rent, bid, commercial };
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
  const up = p.dates.filter((x) => x.when && daysFrom(x.when, now) >= 0).map((x) => ({ ...x, days: daysFrom(x.when, now) }));
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
    status: dated.length >= 2 ? 'done' : dated.length ? 'started' : 'missing',
    lines: dated.length
      ? [...[...dated].sort((a, b) => a.when.localeCompare(b.when)).map((x) => `${x.when}: ${x.what}${x.who ? ` (${x.who})` : ''}`), nd ? `Next: ${nd.what}, ${nd.days === 0 ? 'today' : nd.days === 1 ? 'tomorrow' : `in ${nd.days} days`}` : 'Every date on the list has passed.']
      : [`Add the dates from the ${offer ? 'contract' : 'official notice'}: ${suggestedDates(d).join('; ')}.`],
  });

  // 4. Cash needed, by when (from the deal's own strategy)
  const strategy = STRATEGY_LABEL[d.plan];
  const cash: string[] = [];
  if (offer) cash.push(p.earnest ? `When you sign: ${money(p.earnest)} earnest money` : 'When you sign: earnest money (enter it below)');
  else if (p.earnest) cash.push(`Before the sale: ${money(p.earnest)} bidder deposit`);
  let need = 0;
  if (rent) {
    if (rent.refi) {
      // A refinance comes later, if at all: until then every dollar of the price and costs is your cash.
      need = rent.allIn;
      cash.push(`From sale day until the refinance closes, all in: ${money(rent.allIn)} at a ${money(rent.price)} price (from ${strategy}: bid, buying costs and repairs you entered)`);
      cash.push(`After a refinance, if approved: ${rent.cashIn > 0 ? `${money(rent.cashIn)} of your cash left in` : 'the loan returns all your cash'}`);
    } else {
      need = rent.cashIn;
      cash.push(`${offer ? 'At closing' : 'From sale day until it’s rented'}, all in: ${money(rent.cashIn)} at a ${money(rent.price)} price (from ${strategy}: down payment or bid, closing costs and repairs you entered)`);
    }
  } else if (bid?.none && !bid.at) {
    cash.push(`No price works with the numbers you entered in ${strategy}: the costs and your profit target take up the whole ${money(bid.exitValue)} resale value.`);
  } else if (bid) {
    // Your own price first; the walk-away price is a separate what-if (the most you'd pay), never your price.
    const a = bid.at;
    if (a) {
      need = a.cashPeak;
      const at = `${priceName(a.source, offer)} of ${money(a.price)}`;
      if (!offer) cash.push(`On sale day, at ${at}: ${money(a.cashOnDay)} (bid plus any buyer’s premium, in the form the sale requires)`);
      cash.push(`Most cash you’ll have in at once, at ${at}, through repairs and holding until it sells: ${money(a.cashPeak)}`);
      if (a.cashLeft < a.cashPeak) cash.push(`Left in once the loan funds, at ${at}: ${money(a.cashLeft)}`);
    } else {
      need = bid.cashPeak;
      cash.push(`No ${offer ? 'offer or asking price' : 'bid or opening bid'} entered yet: add it in ${strategy} to see the cash at your own price.`);
    }
    if (!bid.none) {
      const what = `What-if, at your walk-away price of ${money(bid.maxBid)} (the most you could pay, not your price)`;
      cash.push(offer ? `${what}: most cash in at once ${money(bid.cashPeak)}` : `${what}: ${money(bid.cashOnDay)} on sale day; most cash in at once ${money(bid.cashPeak)}`);
    }
  } else if (commercial?.none) {
    cash.push(`No price meets your ${commercial.capPct}% return on cost with the income and costs you entered in ${strategy}.`);
  } else if (commercial) {
    need = commercial.refi ? commercial.allIn : commercial.cashLeft;
    cash.push(commercial.refi
      ? `All in at your highest price, until a refinance closes: ${money(commercial.allIn)}; after a refinance, if approved: ${money(commercial.cashLeft)} left in (from ${strategy})`
      : `All in at your highest price: ${money(commercial.allIn)}, with ${money(commercial.cashLeft)} of your own cash left in (from ${strategy})`);
  } else if (d.plan === 'lien') {
    cash.push('The certificate price and fees, from the Lien certificate calculator in Analyze.');
  } else {
    cash.push(`Run ${strategy} in Analyze to see the cash this deal needs.`);
  }
  if (profile.investable > 0 && need > 0) cash.push(need > profile.investable ? `That’s ${money(need - profile.investable)} more than your investable cash: the deal doesn’t fit as entered.` : `Leaves ${money(profile.investable - need)} of your investable cash for surprises.`);
  const hasNums = !!(rent || bid || commercial);
  out.push({ key: 'cash', title: 'Cash you’ll need, and when', doneLabel: 'Calculated (not verified)', status: hasNums && (!offer || p.earnest) ? 'done' : hasNums || p.earnest ? 'started' : 'missing', lines: cash, fix: hasNums ? undefined : { label: `${strategy} in Analyze`, href: '#/analyze' } });

  // 5. Numbers: base and downside, for the deal's strategy only
  const nums: string[] = [`Strategy: ${strategy}. These are the numbers you saved in its calculator; other strategies’ calculators aren’t counted.`];
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
  if (commercial?.none) nums.push(`No price meets your ${commercial.capPct}% return on cost with the income and costs you entered`);
  else if (commercial) {
    nums.push(`Highest price for a ${commercial.capPct}% return on cost: ${money(commercial.maxBid)}, on ${money(commercial.noi)} a year of net operating income`);
    for (const s of commercial.stress) nums.push(`  If ${s.label.toLowerCase()}: ${s.maxBid !== null && s.maxBid > 0 ? `highest price ${money(s.maxBid)}` : 'no price works'}`);
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
    lines.push(`${s.title.toUpperCase()} [${s.status === 'done' ? (s.doneLabel ?? 'complete').toLowerCase() : s.status === 'started' ? 'in progress' : 'missing'}]`, ...s.lines, '');
  }
  return lines.join('\n');
}
