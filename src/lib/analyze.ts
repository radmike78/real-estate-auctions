// Analyze a Deal (step 6): the visitor describes a deal (state, county, kind of sale, plan) and gets the checklist for
// that sale in that state. Every rule here comes from the Learn lessons and their sources. Deals are kept in this browser.
import { COUNTY_OFFICES } from './countyOffices';
import { countyName, stateByCode, type StateCode } from './regions';

export type SaleKind = 'listing' | 'reo' | 'trustee' | 'taxSale' | 'lien' | 'court' | 'hoa' | 'irs';
export type Plan = 'flip' | 'rent' | 'commercial' | 'lien';

export interface SaleKindInfo {
  key: SaleKind;
  label: string;
  /** States where this kind of sale applies; all four when omitted. */
  states?: StateCode[];
  /** How it's labeled in a given state, when that differs. */
  labelIn?: Partial<Record<StateCode, string>>;
}

export const SALE_KINDS: SaleKindInfo[] = [
  { key: 'listing', label: 'Regular listing (agent or owner)' },
  { key: 'reo', label: 'Bank-owned or government home (REO, HUD)' },
  { key: 'trustee', label: 'Foreclosure auction (trustee sale)' },
  { key: 'taxSale', label: 'County tax sale (the property)', states: ['NV', 'CA', 'UT'] },
  { key: 'lien', label: 'Tax lien sale', states: ['AZ', 'NV'], labelIn: { NV: 'SID lien certificate', AZ: 'Tax lien sale (lien certificate)' } },
  { key: 'court', label: 'Sheriff’s or court sale' },
  { key: 'hoa', label: 'HOA foreclosure', states: ['NV'] },
  { key: 'irs', label: 'IRS sale' },
];

export const kindsFor = (st: StateCode) => SALE_KINDS.filter((k) => !k.states || k.states.includes(st));
export const kindLabel = (k: SaleKindInfo, st: StateCode) => k.labelIn?.[st] ?? k.label;

export const PLANS: { key: Plan; label: string }[] = [
  { key: 'flip', label: 'Fix and sell' },
  { key: 'rent', label: 'Keep and rent' },
  { key: 'commercial', label: 'Commercial income' },
  { key: 'lien', label: 'Hold the lien for interest' },
];

/** Plans that make sense for a kind of sale (a lien can only be held for interest). */
export const plansFor = (kind: SaleKind): Plan[] => (kind === 'lien' ? ['lien'] : ['flip', 'rent', 'commercial']);

export interface Deal {
  id: string;
  name: string;
  state: StateCode;
  county: string;
  kind: SaleKind;
  plan: Plan;
  notes: string;
  done: string[];
  updatedAt: string;
}

export interface CheckItem {
  id: string;
  text: string;
  href?: string;
}

export interface CheckGroup {
  title: string;
  items: CheckItem[];
}

const AUCTIONS: SaleKind[] = ['trustee', 'taxSale', 'lien', 'court', 'hoa', 'irs'];

/** The checklist for a deal: what to confirm, research, and plan for, in this state and county. */
export function checklistFor(d: Pick<Deal, 'state' | 'county' | 'kind' | 'plan'>): CheckGroup[] {
  const st = d.state;
  const state = stateByCode(st)!.name;
  const offices = COUNTY_OFFICES[`${st}/${d.county}`];
  const place = countyName(d.county);
  const auction = AUCTIONS.includes(d.kind);
  const groups: CheckGroup[] = [];

  // 1. The sale itself
  const sale: CheckItem[] = [];
  if (d.kind === 'listing') {
    sale.push({ id: 'offer-contingent', text: 'Make your offer contingent on financing and a satisfactory inspection, with deadlines you can meet.', href: '#/learn/negotiate' });
    if (st === 'NV') sale.push({ id: 'nv-disclosure', text: 'Nevada: the seller must give you the disclosure form at least 10 days before the home is conveyed (NRS 113.130). If it’s late, you can cancel before closing.' });
    if (st === 'CA') sale.push({ id: 'ca-tds', text: 'California: get the Transfer Disclosure Statement. If it arrives after you sign the offer, you have 3 days (5 by mail or electronically) to cancel.' });
    if (st === 'AZ' || st === 'UT') sale.push({ id: 'azut-disclosure', text: `Ask your agent which seller disclosures ${state} requires and when you get them.` });
    sale.push({ id: 'hoa-docs', text: st === 'NV' ? 'Condo or HOA home: read the resale package; you can cancel in writing until midnight of the fifth day after you get it (NRS 116.4109).' : st === 'CA' ? 'Condo or HOA home: get the governing documents, budget, reserves and rental limits before you commit (Civil Code 4525).' : 'Condo or HOA home: get the HOA’s rules, budget and dues before you commit.' });
    sale.push({ id: 'lead', text: 'Built before 1978: you get a lead-paint pamphlet and 10 days to test for lead-based paint, unless you waive it.' });
  }
  if (d.kind === 'reo') {
    sale.push({ id: 'reo-asis', text: 'Expect an as-is sale: the seller usually won’t repair. Inspect within the contract’s window (10 days on Fannie Mae’s contract).', href: '#/bank-owned' });
    sale.push({ id: 'reo-hud', text: 'HUD homes: bid through a HUD-registered broker, and check whether owner-occupants get the first bidding period.' });
    if (st === 'NV') sale.push({ id: 'reo-firstlook', text: 'Nevada Fannie Mae homes: for the first 30 days, only buyers who will live there, public entities and some nonprofits can make offers.' });
  }
  if (auction) sale.push({ id: 'confirm-sale', text: 'Confirm the sale with the official seller the day before: sales are often postponed, paid off or cancelled.' });
  if (d.kind === 'trustee') {
    if (st === 'NV') sale.push({ id: 'nv-trustee', text: 'Nevada: the sale comes at least 3 months after the notice of default; the notice of sale is posted 20 days before. Ask the trustee how and when you must pay.' });
    if (st === 'CA') sale.push({ id: 'ca-trustee', text: 'California: bring proof you can pay the full bid in cash or cashier’s checks. On homes of one to four units, tenants and some buyers have 15 to 45 days after the sale to match the winning bid, so it isn’t final right away.' });
    if (st === 'AZ') sale.push({ id: 'az-trustee', text: 'Arizona: if you win, you pay the full bid by 5 p.m. the next business day.' });
    if (st === 'UT') sale.push({ id: 'ut-trustee', text: 'Utah: your bid can’t be withdrawn, you pay as the trustee directs, and the trustee’s deed has no right of redemption.' });
  }
  if (d.kind === 'taxSale') {
    if (st === 'NV') sale.push({ id: 'nv-tax', text: 'Nevada: the treasurer sells by quitclaim deed, and owners and lenders can pay off until the third business day before the sale. Some liens can survive, and title insurance may be hard to get at first.' });
    if (st === 'CA') sale.push({ id: 'ca-tax', text: 'California: tax-defaulted property is sold as-is; the county isn’t responsible for other liens or easements. Read the tax collector’s terms for deposits and payment.' });
    if (st === 'UT') sale.push({ id: 'ut-tax', text: 'Utah: the county auditor holds the sale in May or June; a bid must cover the taxes, penalties, interest and costs.' });
  }
  if (d.kind === 'lien') {
    if (st === 'AZ') sale.push({ id: 'az-lien', text: 'Arizona: liens are sold in February. You bid the interest rate down from 16% a year; the owner can pay you off any time. After three years (and within ten) you can go to court for a deed.', href: '#/learn/forced-sales' });
    if (st === 'NV') sale.push({ id: 'nv-sid', text: 'Nevada SID lien certificates earn 1% a month until paid; read how they work before you buy.', href: '#/playbooks/sid' });
  }
  if (d.kind === 'court') {
    const r: Record<StateCode, string> = {
      NV: 'Nevada: after a sheriff’s execution sale, the owner can redeem for up to 1 year.',
      CA: 'California: after a judicial foreclosure sale, the owner can redeem for 3 months if the sale paid the debt, or 1 year if it didn’t.',
      AZ: 'Arizona: after a judicial foreclosure sale, the owner can redeem for 30 days if the court found it abandoned, otherwise 6 months.',
      UT: 'Utah: after a sheriff’s sale, the owner can redeem for 180 days.',
    };
    sale.push({ id: 'court-redeem', text: `${r[st]} You own it subject to that right; hold off on repairs until it ends.` });
  }
  if (d.kind === 'hoa') sale.push({ id: 'nv-hoa', text: 'Nevada HOA foreclosures: the owner can redeem for 60 days. Check with a title company whether the first loan survives.', href: '#/playbooks/hoa' });
  if (d.kind === 'irs') sale.push({ id: 'irs-redeem', text: 'IRS sales: for 180 days the owner can buy it back by paying your price plus 20% a year, so you can’t count on keeping it until then.', href: '#/learn/forced-sales' });
  if (offices?.taxSale && (d.kind === 'taxSale' || d.kind === 'lien')) sale.push({ id: 'county-sale-page', text: `Read ${place}’s tax sale page: dates, deposit, payment deadline and what the deed promises.`, href: offices.taxSale.url });
  if (sale.length) groups.push({ title: 'The sale', items: sale });

  // 2. Research the property
  const research: CheckItem[] = [];
  if (d.kind !== 'lien') {
    research.push({ id: 'title', text: 'Order a title search: who owns it, and which liens would stay with the property.', href: '#/pros/title' });
    research.push({ id: 'condition', text: auction ? 'Look at the condition from the street, since you usually can’t go inside, and budget for surprises.' : 'Get an inspection and a repair estimate.', href: '#/pros/inspector' });
    research.push({ id: 'flood', text: 'Check flood, hazard and environmental records.', href: '#/learn/tools' });
  }
  research.push({ id: 'taxes', text: `Check the tax bill and any unpaid taxes${offices?.treasurer ? ` with ${place}’s treasurer` : ' with the county treasurer'}.`, href: offices?.treasurer?.url ?? '#/find-deals' });
  if (offices?.recorder) research.push({ id: 'recorded', text: `Read the recorded documents (deeds, loans, liens, notices) at ${place}’s recorder.`, href: offices.recorder.url });
  if (auction) research.push({ id: 'bankruptcy', text: 'Check whether the owner has filed for bankruptcy, which can stop a sale.', href: '#/learn/tools' });
  groups.push({ title: 'Research the property', items: research });

  // 3. Money and plan
  const money: CheckItem[] = [];
  money.push({ id: 'numbers', text: d.plan === 'lien' ? 'Work out what the lien earns per year, counting the wait to be paid (calculator below).' : `Set your maximum ${auction ? 'bid' : 'price'} with every cost counted (calculator below), and don’t go past it.` });
  money.push({ id: 'funds', text: auction ? 'Have the money ready: most auctions want cash or cashier’s checks on a tight deadline.' : 'Get pre-approved, or have proof of funds, before you offer.', href: '#/pros/lender' });
  if (d.plan === 'flip') {
    money.push({ id: 'arv', text: 'Base your resale value on sold homes already in finished condition, not asking prices.' });
    money.push({ id: 'contractor', text: `Get a bid from a contractor licensed in ${state}, and check permits with the building department.`, href: '#/learn/tools' });
  }
  if (d.plan === 'rent') {
    money.push({ id: 'rent', text: 'Check the rent against HUD’s Fair Market Rents and nearby rentals, and count vacancy, repairs and management.', href: '#/learn/tools' });
    money.push({ id: 'landlord', text: st === 'CA' ? 'California limits most rent increases to 10%, or 5% plus inflation if lower, in 12 months. Check whether your property is covered.' : `Read ${state}’s landlord-tenant rules before you rent it out.` });
    money.push({ id: 'insurance', text: 'Get landlord insurance quotes before you commit.', href: '#/pros/insurance' });
  }
  if (d.plan === 'commercial') money.push({ id: 'noi', text: 'Get the rent roll and operating statements, and check NOI, cap rate and debt coverage with a commercial lender.', href: '#/learn/analyze' });
  if (d.kind !== 'lien' && (auction || d.kind === 'reo')) money.push({ id: 'occupants', text: 'Plan for occupants: removing anyone takes a court process, and tenants after a foreclosure get at least 90 days’ notice.' });
  groups.push({ title: 'Money and plan', items: money });

  // 4. Before you commit
  const commit: CheckItem[] = [{ id: 'team', text: 'Have a real estate attorney or title company review anything you don’t understand.', href: '#/pros/attorney' }];
  commit.push({ id: 'wire', text: 'Never follow payment instructions sent by email; call the title or escrow officer at a number you already know.' });
  if (auction) commit.push({ id: 'seller', text: 'Buy only from the official seller. Never contact homeowners facing foreclosure.' });
  groups.push({ title: 'Before you commit', items: commit });
  return groups;
}

/** Which calculator tab opens for a plan. */
export const calcTabFor = (plan: Plan) => (plan === 'rent' ? 'rent' : plan === 'commercial' ? 'commercial' : plan === 'lien' ? 'lien' : 'flip');

const KEY = 'deedowl.analyze.v1';
export const CURRENT_KEY = 'deedowl.analyze.current.v1';

/** Open a saved deal on the Analyze page. */
export function openDeal(d: Deal) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(d));
  } catch {
    /* private mode */
  }
  window.location.hash = '#/analyze';
}

export function loadDeals(): Deal[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((d) => d && typeof d.id === 'string' && stateByCode(d.state)) : [];
  } catch {
    return [];
  }
}

export function saveDeals(list: Deal[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* private mode: kept for this visit only */
  }
}
