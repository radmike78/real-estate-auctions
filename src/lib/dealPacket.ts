// The deal packet: one page per property you're analyzing that pulls together everything a decision needs and says
// what's still missing. Most of it comes from what's already saved (the deal, its calculators, its evidence log,
// your goal, buy box and team). This file adds the few things nothing else stores: whether it fits your buy box and
// why, the deal's key dates, your questions to professionals and their answers, your earnest money, and the reason
// for your decision with any conditions still open. Kept only in this browser, like the rest.
import { kindLabel, SALE_KINDS, type Deal } from './analyze';
import { maxSafeBid, sanitizeInputs, BLANK_INPUTS, type BidInputs } from './bidCalc';
import { cleanBuyBox, EMPTY_BUY_BOX, type BuyBox } from './toolkit';
import { EVIDENCE_AREAS, GATES, loadLog } from './evidence';
import { rentAtPrice, rentStress, RENT_DEFAULTS, sanitizeNumbers, type RentInputs } from './holdCalc';
import { cleanGoal, GOAL_KEY, investorProfile, TEAM_ROLES } from './myPlan';
import { proGuideByKey } from './proGuide';
import { countyName } from './regions';

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

/** The dates most deals of this kind need on the calendar, to start the list from. */
export function suggestedDates(d: Pick<Deal, 'kind' | 'state'>): string[] {
  if (d.kind === 'short') return ['Contract signed', 'Lienholder approval deadline (from the short sale addendum)', 'Approval notice received (dates count from here)', d.state === 'TX' ? 'Option period ends (5 p.m.)' : 'Inspection period ends', 'Loan approval deadline', 'Closing'];
  if (isOffer(d)) return ['Offer accepted (Day 0)', d.state === 'TX' ? 'Earnest money and option fee due (within 3 days after the effective date)' : 'Earnest money due', d.state === 'TX' ? 'Option period ends (5 p.m.)' : 'Inspection period ends', 'Appraisal deadline', 'Loan approval deadline', 'Closing'];
  if (d.kind === 'lien') return ['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Earliest date you may act on an unpaid lien'];
  const out = ['Bidder registration deadline', 'Sale day', 'Payment deadline', 'Deed or certificate recorded'];
  if (['taxSale', 'hoa', 'irs', 'court'].includes(d.kind) && !(d.state === 'TX' && d.kind === 'court')) out.push('Redemption period ends');
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

/** The numbers saved for this deal: the rental at your price, and the auction or flip calculator. */
export function savedNumbers(d: Deal) {
  const offer = isOffer(d);
  const rentRaw = read(`fsf.calc.rent.${d.id}${offer ? '-offer' : ''}.v1`);
  let rent: { price: number; monthly: number; cashIn: number; cashOnCash: number | null; target: number; stress: { label: string; monthly: number }[] } | null = null;
  if (rentRaw) {
    const v = sanitizeNumbers(rentRaw, RENT_DEFAULTS) as RentInputs;
    if (v.atPrice > 0) {
      const a = rentAtPrice(v, v.atPrice, offer);
      rent = { price: v.atPrice, monthly: a.cashFlow / 12, cashIn: a.cashIn, cashOnCash: a.cashOnCash, target: v.targetCocPct, stress: rentStress(v, v.atPrice, offer).map((s) => ({ label: s.label, monthly: s.monthly })) };
    }
  }
  const bidRaw = read(`fsf.bid.analyzed-${d.id}.v1`);
  let bid: { maxBid: number; cashOnDay: number; cashTotal: number; exitValue: number } | null = null;
  if (bidRaw && typeof bidRaw === 'object') {
    const i: BidInputs = sanitizeInputs(bidRaw, BLANK_INPUTS);
    if (i.exitValue > 0) {
      const r = maxSafeBid(i);
      bid = { maxBid: r.maxBid, cashOnDay: r.cashAtAuction, cashTotal: r.cashToStabilize, exitValue: i.exitValue };
    }
  }
  return { rent, bid };
}

export type SectionStatus = 'done' | 'started' | 'missing';
export interface PacketSection {
  key: string;
  title: string;
  status: SectionStatus;
  lines: string[];
  /** Where to fill it in, when it's not on the packet page itself. */
  fix?: { label: string; href: string };
}

const daysFrom = (iso: string, now: Date) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12)) / 86_400_000);

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
  const { rent, bid } = savedNumbers(d);
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

  // 4. Cash needed, by when
  const cash: string[] = [];
  if (offer) {
    cash.push(p.earnest ? `When you sign: ${money(p.earnest)} earnest money` : 'When you sign: earnest money (enter it below)');
    cash.push(rent ? `At closing, all in: ${money(rent.cashIn)} at a ${money(rent.price)} price (from Keep and rent: down payment, closing costs and repairs you entered)` : 'At closing: run Keep and rent with the price you’d pay');
  } else {
    if (p.earnest) cash.push(`Before the sale: ${money(p.earnest)} bidder deposit`);
    cash.push(bid ? `On sale day, at your walk-away price: ${money(bid.cashOnDay)} (bid plus any buyer’s premium, in the form the sale requires)` : 'On sale day: set your walk-away price in Fix and sell');
    if (bid) cash.push(`Through repairs and holding until it sells: ${money(bid.cashTotal)} in all`);
  }
  if (profile.investable > 0) {
    const need = offer ? rent?.cashIn ?? 0 : bid?.cashTotal ?? 0;
    if (need > 0) cash.push(need > profile.investable ? `That’s ${money(need - profile.investable)} more than your investable cash: the deal doesn’t fit as entered.` : `Leaves ${money(profile.investable - need)} of your investable cash for surprises.`);
  }
  out.push({ key: 'cash', title: 'Cash you’ll need, and when', status: (offer ? rent && p.earnest : bid) ? 'done' : rent || bid || p.earnest ? 'started' : 'missing', lines: cash, fix: (offer ? !rent : !bid) ? { label: offer ? 'Keep and rent at your price' : 'Fix and sell: your walk-away price', href: '#/analyze' } : undefined });

  // 5. Numbers: base and downside
  const nums: string[] = [];
  if (rent) {
    nums.push(`Monthly cash flow at ${money(rent.price)}: ${money(rent.monthly)}; ${rent.cashOnCash === null ? 'all your cash back' : `${(rent.cashOnCash * 100).toFixed(1)}% a year on your cash`} (target ${rent.target}%)`);
    for (const s of rent.stress.slice(1)) nums.push(`  If ${s.label.toLowerCase()}: ${money(s.monthly)} a month`);
  }
  if (bid) nums.push(`Walk-away price: ${money(bid.maxBid)}, based on a ${money(bid.exitValue)} resale value`);
  out.push({ key: 'numbers', title: 'Numbers: base case and downside', status: rent && rent.stress.length > 1 ? 'done' : rent || bid ? 'started' : 'missing', lines: nums.length ? nums : ['No numbers yet. Every figure here is your estimate until a source backs it.'], fix: { label: 'Open in Analyze', href: '#/analyze' } });

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

/** The one thing to do next, with where to do it. */
export function nextAction(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): { text: string; href?: string } {
  const nd = nextDate(p, now);
  if (nd && nd.days <= 7) return { text: `${nd.days === 0 ? 'Today' : nd.days === 1 ? 'Tomorrow' : `In ${nd.days} days`}: ${nd.what}.${nd.who ? ` Who: ${nd.who}.` : ''}` };
  const log = loadLog(`analyzed:${d.id}`);
  const openRow = EVIDENCE_AREAS.map((a) => ({ a, r: log.rows[a.key] })).find(({ r }) => r?.open && !r.done);
  if (openRow) return { text: `Get an answer to: ${openRow.r.open}${openRow.r.owner ? ` (${openRow.r.owner})` : ''}.` };
  const waiting = p.qa.find((x) => x.q && !x.a);
  if (waiting) return { text: `Get an answer from your ${(proGuideByKey(waiting.role as never)?.title ?? 'professional').toLowerCase()}: ${waiting.q}` };
  const { rent, bid } = savedNumbers(d);
  if (isOffer(d) ? !rent : !bid) return { text: isOffer(d) ? 'Run Keep and rent with the price you’d pay, so the packet has your numbers and downside cases.' : 'Set your walk-away price in Fix and sell before you bid.', href: '#/analyze' };
  if (!p.dates.some((x) => x.when)) return { text: `Put the deal’s dates on its calendar: ${suggestedDates(d).slice(0, 3).join(', ')}.` };
  const unchecked = EVIDENCE_AREAS.find((a) => !log.rows[a.key]?.done);
  if (unchecked) return { text: `Check “${unchecked.title}”: ${unchecked.what}` };
  if (!log.gate) return { text: 'Every area is checked: record your decision and why.' };
  if (nd) return { text: `Next date, in ${nd.days} days: ${nd.what}.` };
  return { text: 'Review your decision with your professionals before you commit.' };
}

/** The whole packet as plain text, to download, print or share with your professionals. */
export function dealPacketText(d: Deal, p: PacketData = loadPacket(`analyzed:${d.id}`), now = new Date()): string {
  const lines = [`DEAL PACKET: ${d.name}`, 'DeedOwl educational worksheet. Every number is your estimate until a source backs it; a checkmark records your review, not a clear title.', ''];
  lines.push(`NEXT ACTION: ${nextAction(d, p, now).text}`, '');
  for (const s of packetSections(d, p, now)) {
    lines.push(`${s.title.toUpperCase()} [${s.status === 'done' ? 'complete' : s.status === 'started' ? 'in progress' : 'missing'}]`, ...s.lines, '');
  }
  return lines.join('\n');
}
