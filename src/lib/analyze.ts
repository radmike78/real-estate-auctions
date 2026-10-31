import { workStorage as localStorage } from './workStorage';
import type { SaleType } from '../types';
import { removeLog } from './evidence';
import { forgetRoadmapDeal } from './roadmapDeals';
import { removePacket } from './dealPacket';
import { loadOwned, saveOwned } from './owned';
// Analyze a Deal (step 6): the visitor describes a deal (state, county, kind of sale, plan) and gets the checklist for
// that sale in that state. Every rule here comes from the Learn lessons and their sources. Deals are kept in this browser.
import { COUNTY_OFFICES } from './countyOffices';
import { navigate } from './nav';
import { countyName, stateByCode, type StateCode } from './regions';

export type SaleKind = 'listing' | 'reo' | 'short' | 'trustee' | 'taxSale' | 'lien' | 'court' | 'hoa' | 'irs';
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
  { key: 'short', label: 'Short sale (the seller’s lender must approve)' },
  { key: 'trustee', label: 'Foreclosure auction (trustee sale)' },
  { key: 'taxSale', label: 'County tax sale (the property)', states: ['NV', 'CA', 'UT', 'TX'] },
  { key: 'lien', label: 'Tax lien sale', states: ['AZ', 'NV'], labelIn: { NV: 'SID lien certificate', AZ: 'Tax lien sale (lien certificate)' } },
  { key: 'court', label: 'Sheriff’s or court sale' },
  { key: 'hoa', label: 'HOA foreclosure', states: ['NV', 'CA', 'TX'] },
  { key: 'irs', label: 'IRS sale' },
];

export const kindsFor = (st: StateCode) => SALE_KINDS.filter((k) => !k.states || k.states.includes(st));
export const kindLabel = (k: SaleKindInfo, st: StateCode) => k.labelIn?.[st] ?? k.label;

export const PLANS: { key: Plan; label: string }[] = [
  { key: 'flip', label: 'Fix and flip (fix and sell)' },
  { key: 'rent', label: 'Buy and hold (keep and rent)' },
  { key: 'commercial', label: 'Commercial income' },
  { key: 'lien', label: 'Hold the lien for interest' },
];

/** Plans that make sense for a kind of sale (a lien can only be held for interest). */
export const plansFor = (kind: SaleKind): Plan[] => (kind === 'lien' ? ['lien'] : ['flip', 'rent', 'commercial']);

/**
 * Where a saved deal stands in the real world. It picks the deal's next action and task list in My plan: a new
 * candidate is researched first, and the accepted-offer deadlines only come in once it's under contract.
 */
export type DealStage = 'researching' | 'offer' | 'contract' | 'closed' | 'owned' | 'passed';
export const DEAL_STAGES: DealStage[] = ['researching', 'offer', 'contract', 'closed', 'owned', 'passed'];
export const isDealStage = (v: unknown): v is DealStage => DEAL_STAGES.includes(v as DealStage);

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
  /** Set by the buyer; deals saved before stages existed have none, and My plan works one out (dealStage.ts). */
  stage?: DealStage;
  /** Explicit confirmation for this property, not the visitor's general browsing area. */
  locationConfirmed?: boolean;
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
    if (st === 'AZ') sale.push({ id: 'az-disclosure', text: 'Arizona: sellers must disclose specific items, such as soil remediation they know about. For a seller of five or fewer parcels of unsubdivided land in an unincorporated county area, and a subsequent seller of a qualifying parcel, A.R.S. 33-422 requires an affidavit of disclosure at least 7 days before transfer, with 5 days to cancel after receipt. The statute excludes trustees at trustee sales and sheriffs at execution sales. Ask your agent or attorney whether your transaction qualifies.' });
    if (st === 'TX') sale.push({ id: 'tx-disclosure', text: 'Texas: for a single-family home, most sellers must give you the Seller’s Disclosure Notice (Property Code 5.008). If it comes after you sign, the TREC contract lets you end it within 7 days. For a fee, the contract’s option period lets you end it for any reason; the deadline is strict.' });
    if (st === 'TX') sale.push({ id: 'tx-water', text: 'Texas (not on TREC’s condominium contract, which has no water paragraph): ask your agent which box in paragraph 7I of the TREC contract applies to the Seller’s Water Disclosure (groundwater and surface water rights). If box 7I(2) is checked (you haven’t received it yet), read it when it comes and record the delivery date: you can end the contract within 7 days after you receive it, or before closing if that comes first, and if it never comes you can end it before closing. If box 1 (already received) or box 3 (not required, because every statement in 7I(3) is true) is checked, there’s no new termination window; for box 3, record why.', href: '#/learn/negotiate' });
    if (st === 'UT') sale.push({ id: 'ut-disclosure', text: 'Utah: under the state purchase contract, the seller gives a property condition disclosure by the Seller Disclosure Deadline, and you can cancel by the Due Diligence Deadline. Sellers must disclose methamphetamine contamination they know about.' });
    const hoa: Record<StateCode, string> = {
      NV: 'Condo or HOA home: read the resale package; you can cancel in writing until midnight of the fifth day after you get it (NRS 116.4109).',
      CA: 'Condo or HOA home: get the governing documents, budget, reserves and rental limits before you commit (Civil Code 4525).',
      AZ: 'Condo or HOA home: the association’s rules, budget, reserves and any lawsuits must reach you within 10 days. With 50 or more homes or units, the association sends them after the seller’s notice of the accepted offer; in a planned community with fewer than 50 homes or a condo with fewer than 50 units, the seller sends them after accepting your offer; the association’s fee is capped at $400 (A.R.S. 33-1806; condos 33-1260).',
      UT: 'Condo or HOA home: the seller must give you the association’s recorded governing documents and a link to the state’s educational materials for HOA buyers before closing (Utah Code 57-8a-105.1, 57-8-6.1).',
      TX: 'Condo or HOA home: get the resale certificate and the association’s rules, budget and fees before the deadline in the HOA addendum (Property Code 207.003 for a subdivision HOA, 82.157 for a condo). Ask your agent which TREC addendum your contract uses.',
    };
    sale.push({ id: 'hoa-docs', text: hoa[st] });
    sale.push({ id: 'lead', text: 'Built before 1978: in most sales you get a lead-paint pamphlet and 10 days to test for lead-based paint, unless you waive it. A sale at foreclosure is exempt, so plan your own lead-safe inspection there.' });
  }
  if (d.kind === 'reo') {
    sale.push({ id: 'reo-asis', text: 'Expect an as-is sale: the seller usually won’t repair. Inspect within the contract’s window (10 days on Fannie Mae’s contract).', href: '#/bank-owned' });
    sale.push({ id: 'reo-hud', text: 'HUD homes: bid through a HUD-registered broker, and check whether owner-occupants get the first bidding period.' });
    if (st === 'NV') sale.push({ id: 'reo-firstlook', text: 'Nevada Fannie Mae homes: for the first 30 days, only buyers who will live there, public entities and some nonprofits can make offers.' });
  }
  if (d.kind === 'short') {
    sale.push({ id: 'short-approval', text: 'Every lienholder must approve the sale in writing before closing. Until then the price isn’t settled, and approval can take months. Ask your agent how long the file has been open and how many liens there are.', href: '#/short-sales' });
    sale.push({ id: 'short-foreclosure', text: 'Ask whether a foreclosure sale is posted. A lender’s approval doesn’t stop it by itself: get written word from the lender or its attorney that the sale is postponed or called off, and keep it.' });
    sale.push({ id: 'short-dates', text: 'Put every date on one calendar: the approval deadline, your option or inspection period, your loan approval and the lender’s closing deadline. Ask your agent when you can end the contract while you wait, and get your earnest money back.' });
    if (st === 'TX') sale.push({ id: 'tx-short', text: 'Texas: with the TREC Short Sale Addendum (form 45-2), the contract binds you when signed and the earnest money and option fee are due on time, but neither side has to perform until every lienholder approves (45-2, C). For performance, the effective date becomes the day the seller tells you of the approval (the Amended Effective Date, 45-2, D). Your option period starts when you both sign and keeps running while you wait for the lender; when it ends depends on how paragraph 5’s days are counted after the Amended Effective Date* (45-2, F). Have your agent write out the exact dates. If approval doesn’t come by the addendum’s date, the contract ends and your earnest money is refunded; extend that date in writing if needed.' });
    sale.push({ id: 'short-team', text: 'Your agent tracks the lender’s answer. Ask the title company to confirm every lien is in the approval, and a real estate attorney if a foreclosure sale is posted or the approval letter has conditions you don’t understand.', href: '#/pros/attorney' });
  }
  if (auction) sale.push({ id: 'confirm-sale', text: 'Confirm the sale with the official seller the day before: sales are often postponed, paid off or cancelled.' });
  if (d.kind === 'trustee') {
    if (st === 'NV') sale.push({ id: 'nv-trustee', text: 'Nevada: the sale comes at least 3 months after the notice of default; the notice of sale is posted 20 days before. Ask the trustee how and when you must pay.' });
    if (st === 'CA') sale.push({ id: 'ca-trustee', text: 'California: bring proof you can pay the full bid in cash or cashier’s checks. On homes of one to four units, tenants can match, and other eligible bidders can beat, the winning bid within 15 to 45 days after the sale, so it isn’t final right away.' });
    if (st === 'AZ') sale.push({ id: 'az-trustee', text: 'Arizona: if you win, you pay the full bid by 5 p.m. the next business day.' });
    if (st === 'TX') sale.push({ id: 'tx-trustee', text: 'Texas: trustee sales happen on the first Tuesday of the month, between 10 a.m. and 4 p.m., with at least 21 days’ notice (Property Code 51.002). You pay when the bid is accepted, as the trustee directs. After a mortgage foreclosure the owner can’t buy it back; after a property tax loan foreclosure they can (Tax Code 32.06(k), (k-1)).' });
    if (st === 'UT') sale.push({ id: 'ut-trustee', text: 'Utah: your bid can’t be withdrawn, you pay as the trustee directs, and the trustee’s deed has no right of redemption.' });
  }
  if (d.kind === 'taxSale') {
    if (st === 'NV') sale.push({ id: 'nv-tax', text: 'Nevada: the treasurer sells by quitclaim deed, and owners and lenders can pay off until the third business day before the sale. Some liens can survive, and title insurance may be hard to get at first.' });
    if (st === 'CA') sale.push({ id: 'ca-tax', text: 'California: tax-defaulted property is sold as-is; the county isn’t responsible for other liens or easements. Read the tax collector’s terms for deposits and payment.' });
    if (st === 'TX') sale.push({ id: 'tx-tax', text: 'Texas: a sheriff or constable sells the property after a court judgment, on the first Tuesday of the month. In counties of 250,000 or more, and smaller ones that have adopted the rule, you need the tax office’s statement that you owe no delinquent taxes (Tax Code 34.015) or, where the county uses it, a bidder registration (Tax Code 34.011). The owner can redeem for 180 days, or 2 years if it was a homestead, land designated for agricultural use or a mineral interest, counted from the day the deed is filed (34.21). Check which applies in the judgment and the appraisal district record before you bid.' });
    if (st === 'UT') sale.push({ id: 'ut-tax', text: 'Utah: the county auditor holds the sale in May or June; a bid must cover the taxes, penalties, interest and costs.' });
  }
  if (d.kind === 'lien') {
    if (st === 'AZ') sale.push({ id: 'az-lien', text: 'Arizona: liens are sold in February. You bid the interest rate down from 16% a year; the owner can pay you off any time. After three years (and within ten) you can go to court for a deed. Or, if you or the owner ask and the property is likely to sell for more than $2,500 above what’s owed, the court must order an auction instead, and you’re paid in cash (A.R.S. 42-18204).', href: '#/learn/forced-sales' });
    if (st === 'NV') sale.push({ id: 'nv-sid', text: 'Nevada SID lien certificates earn 1% a month until paid; read how they work before you buy.', href: '#/playbooks/sid' });
  }
  if (d.kind === 'court') {
    const r: Record<StateCode, string> = {
      NV: 'Nevada: after a sheriff’s execution sale, the owner can redeem for up to 1 year.',
      CA: 'California: after a judicial foreclosure sale, only when the court’s judgment allows the lender to seek a deficiency (the notice of sale says whether the sale is subject to redemption), the owner can redeem for 3 months if the sale paid the debt, or 1 year if it didn’t (CCP 729.010, 729.030).',
      AZ: 'Arizona: after a judicial foreclosure sale, the owner can redeem for 6 months, or 30 days if the judgment found it both abandoned and not used mainly for farming or grazing. Then junior lienholders can redeem in turn, 5 days each (A.R.S. 12-1282).',
      UT: 'Utah: after a sheriff’s sale, the owner can redeem for 180 days.',
      TX: 'Texas: after a sheriff’s or constable’s execution sale, the owner has no right to redeem, but you get only what the debtor owned, so liens ahead of the judgment stay.',
    };
    sale.push({ id: 'court-redeem', text: st === 'TX' ? r[st] : `${r[st]} You own it subject to that right; secure and maintain it, and hold off on remodeling until it ends.` });
  }
  if (d.kind === 'hoa' && st === 'NV') sale.push({ id: 'nv-hoa', text: 'Nevada HOA foreclosures: the owner can redeem for 60 days. Check with a title company whether the first loan survives.', href: '#/playbooks/hoa' });
  if (d.kind === 'hoa' && st === 'CA') sale.push({ id: 'ca-hoa', text: 'California HOA sales: an HOA can foreclose only when unpaid assessments reach $1,800 or are more than 12 months late (Civil Code 5720). A first deed of trust recorded before the HOA’s notice usually stays (Civil Code 5680), and after a nonjudicial HOA sale the home can be redeemed for 90 days (Civil Code 5715).', href: '#/playbooks/cahoa' });
  if (d.kind === 'hoa' && st === 'TX') {
    sale.push({ id: 'tx-hoa-type', text: 'Texas: read the recorded declaration first. It decides whether this is a subdivision HOA (Property Code 209) or a condominium association (82); a townhome can be either.', href: '#/playbooks/txhoa' });
    sale.push({ id: 'tx-hoa-redeem', text: 'Subdivision: the owner, or a lender after 90 days, can redeem until 180 days after the HOA mails notice of the sale, and you can’t sell to anyone else until then (209.011). Condominium: the owner can redeem until 90 days after the sale and repays your bid plus 6% a year, and you can’t sell to anyone else until then either (82.113(g)). Ask a title company whether the first loan survives.' });
  }
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
  const taxOffice = st === 'TX' ? 'tax assessor-collector' : 'treasurer';
  const records = st === 'TX' ? 'county clerk' : 'recorder';
  research.push({ id: 'taxes', text: `Check the tax bill and any unpaid taxes${offices?.treasurer ? ` with ${place}’s ${taxOffice}` : ` with the county ${taxOffice}`}.`, href: offices?.treasurer?.url ?? '#/find-deals' });
  if (offices?.recorder) research.push({ id: 'recorded', text: `Read the recorded documents (deeds, loans, liens, notices) at ${place}’s ${records}.`, href: offices.recorder.url });
  if (auction) research.push({ id: 'bankruptcy', text: 'Check whether the owner has filed for bankruptcy, which can stop a sale.', href: '#/learn/tools' });
  groups.push({ title: 'Research the property', items: research });

  // 3. Money and plan
  const money: CheckItem[] = [];
  money.push({ id: 'numbers', text: d.plan === 'lien' ? 'Work out what the lien earns per year, counting the wait to be paid (calculator below).' : `Set your maximum ${auction ? 'bid' : 'price'} with every cost counted (calculator below). Past it, the deal no longer meets your own numbers.` });
  money.push({ id: 'funds', text: auction ? 'Have the money ready: most auctions want cash or cashier’s checks on a tight deadline.' : 'Get pre-approved, or have proof of funds, before you offer.', href: '#/pros/lender' });
  if (d.plan === 'flip') {
    money.push({ id: 'arv', text: 'Base your resale value on sold homes already in finished condition, not asking prices.' });
    money.push({ id: 'contractor', text: st === 'TX' ? 'Get written bids with a scope and payment schedule. Texas has no state license for general contractors or remodelers: check the trade licenses (electrician, plumber, air conditioning) for that work, the city’s registration and permits, insurance and references.' : `Get a bid from a contractor licensed in ${state}, and check permits with the building department.`, href: '#/pros/contractor' });
  }
  if (d.plan === 'rent') {
    money.push({ id: 'rent', text: 'Check the rent against HUD’s Fair Market Rents and nearby rentals, and count vacancy, repairs and management.', href: '#/learn/tools' });
    money.push({ id: 'landlord', text: st === 'CA' ? 'California limits most rent increases to 10%, or 5% plus inflation if lower, in 12 months. Check whether your property is covered.' : `Read ${state}’s landlord-tenant rules before you rent it out.` });
    money.push({ id: 'insurance', text: 'Get landlord insurance quotes before you commit.', href: '#/pros/insurance' });
  }
  if (d.plan === 'commercial') money.push({ id: 'noi', text: 'Get the rent roll and operating statements, and check NOI, cap rate and debt coverage with a commercial lender.', href: '#/learn/analyze' });
  if (d.kind !== 'lien' && (auction || d.kind === 'reo')) money.push({ id: 'occupants', text: `Plan for occupants: find out whether they’re the former owner or tenants, and get any lease. Removing anyone takes a court process. After a foreclosure, federal law gives tenants with a genuine lease or rental at least 90 days’ notice, or the rest of their lease unless you’ll live there yourself${st === 'TX' ? '; Texas’s shorter notice doesn’t cut that' : ''}. Ask an attorney how this applies to your sale before you give any notice.` });
  groups.push({ title: 'Money and plan', items: money });

  // 4. Before you commit
  const commit: CheckItem[] = [{ id: 'team', text: 'Have a real estate attorney or title company review anything you don’t understand.', href: '#/pros/attorney' }];
  commit.push({ id: 'wire', text: 'Verify emailed payment instructions independently; call the title or escrow officer at a number you already know.' });
  if (auction) commit.push({ id: 'seller', text: 'Buy only from the official seller. Never contact homeowners facing foreclosure.' });
  groups.push({ title: 'Before you commit', items: commit });
  return groups;
}

/** Which calculator tab opens for a plan. */
/** The plan a link asks for ("#/analyze?plan=commercial"), or undefined for an unknown one. */
export const planParam = (v: string | null | undefined): Plan | undefined => PLANS.find((p) => p.key === v)?.key;

/** A deal set up for `plan`: a lien plan needs a lien sale (Nevada and Arizona only); other plans need a property sale. */
export function withPlan(d: Deal, plan: Plan): Deal {
  if (plan === 'lien') return d.state === 'NV' || d.state === 'AZ' ? { ...d, kind: 'lien', plan } : d;
  return { ...d, kind: d.kind === 'lien' ? 'listing' : d.kind, plan };
}

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
  navigate('/analyze');
}

/** A stored deal, cleaned so old, hand-edited or restored data can't break the page. Null if it's unusable. */
export function cleanDeal(v: unknown): Deal | null {
  const d = (v && typeof v === 'object' ? v : null) as Record<string, unknown> | null;
  if (!d || typeof d.id !== 'string' || typeof d.state !== 'string' || !stateByCode(d.state)) return null;
  const st = stateByCode(d.state)!;
  const kind = SALE_KINDS.find((k) => k.key === d.kind && (!k.states || k.states.includes(st.code)));
  const kindKey = (kind?.key ?? 'listing') as SaleKind;
  const plan = plansFor(kindKey).includes(d.plan as Plan) ? (d.plan as Plan) : plansFor(kindKey)[0];
  const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
  return {
    id: d.id.slice(0, 64),
    name: str(d.name, 200),
    state: st.code,
    county: typeof d.county === 'string' && st.counties.includes(d.county) ? d.county : st.counties[0],
    kind: kindKey,
    plan,
    notes: str(d.notes, 4000),
    done: Array.isArray(d.done) ? d.done.filter((x): x is string => typeof x === 'string').slice(0, 500) : [],
    updatedAt: typeof d.updatedAt === 'string' && !Number.isNaN(Date.parse(d.updatedAt)) ? d.updatedAt : new Date().toISOString(),
    ...(isDealStage(d.stage) ? { stage: d.stage } : {}),
    ...(d.locationConfirmed === true && typeof d.county === 'string' && st.counties.includes(d.county) ? { locationConfirmed: true } : {}),
  };
}

export function loadDeals(): Deal[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(v)) return [];
    const seen = new Set<string>();
    // One copy per id: a hand-edited backup can repeat one, and both copies would change together.
    return v.map(cleanDeal).filter((d): d is Deal => d !== null && !seen.has(d.id) && !!seen.add(d.id));
  } catch {
    return [];
  }
}

export function saveDeals(list: Deal[]) {
  // Properties you own are never dropped for space; the oldest of the rest go first.
  const owned = loadOwned();
  const room = Math.max(0, MAX_DEALS - list.filter((d) => owned[d.id]).length);
  let others = 0;
  const kept = list.filter((d) => owned[d.id] || others++ < room);
  try {
    localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    /* private mode: kept for this visit only */
  }
  // Deals past the limit are dropped: forget their evidence and roadmap progress too.
  for (const d of list) if (!kept.includes(d)) forgetDeal(d.id);
}

const MAX_DEALS = 50;

/** The calculator numbers kept for an analyzed deal (rent, commercial and flip; offer and auction versions). */
const dealCalcKeys = (id: string) => [
  ...['rent', 'commercial'].flatMap((k) => [`fsf.calc.${k}.${id}.v1`, `fsf.calc.${k}.${id}-offer.v1`, `fsf.calc.${k}.${id}.v1.region`, `fsf.calc.${k}.${id}-offer.v1.region`]),
  `fsf.bid.analyzed-${id}.v1`,
  ...['', '-az'].flatMap((az) => [`fsf.calc.lien.${id}${az}.v1`, `fsf.calc.lien.${id}${az}.v1.typed.v1`, `fsf.calc.lien.${id}${az}.typed.v1`]),
  `fsf.bid.analyzed-${id}.v1.region`,
  `fsf.bid.analyzed-${id}.v1.typed.v1`,
  `fsf.bid.analyzed-${id}.typed.v1`,
  ...['rent', 'commercial'].flatMap((k) => ['', '-offer'].flatMap((suffix) => [`fsf.calc.${k}.${id}${suffix}.v1.typed.v1`, `fsf.calc.${k}.${id}${suffix}.typed.v1`])),
];

/** Forget everything kept for an analyzed deal besides the deal itself: its numbers, evidence log and roadmap progress. */
export function forgetDeal(id: string) {
  removeLog(`analyzed:${id}`);
  forgetRoadmapDeal(`analyzed:${id}`);
  removePacket(`analyzed:${id}`);
  const owned = loadOwned();
  if (owned[id]) {
    delete owned[id];
    saveOwned(owned);
  }
  try {
    for (const k of dealCalcKeys(id)) localStorage.removeItem(k);
  } catch {
    /* storage unavailable */
  }
}

/** Forget the unsaved calculator numbers, so a new deal starts from your plan's starting numbers. */
export function clearDraftNumbers() {
  try {
    // Analyze's unsaved drafts. The plain rent and commercial keys belong to Analyze alone (the old Calculators page
    // now opens Analyze), so a new deal never starts from the last deal's rent, costs or price.
    for (const k of ['fsf.calc.rent.v1', 'fsf.calc.commercial.v1', 'fsf.calc.rent.offer.v1', 'fsf.calc.commercial.offer.v1', 'fsf.bid.analyze-draft.v1', 'fsf.calc.lien.v1', 'fsf.calc.lien.az.v1']) {
      localStorage.removeItem(k);
      localStorage.removeItem(`${k}.region`);
      localStorage.removeItem(`${k}.typed.v1`);
      localStorage.removeItem(k.replace(/\.v1$/, '.typed.v1'));
    }
  } catch {
    /* storage unavailable */
  }
}

/** When a new deal is saved, the numbers typed before saving become that deal's numbers. */
export function carryDraftNumbers(id: string, offer: boolean) {
  try {
    const moves: [string, string][] = [
      [offer ? 'fsf.calc.rent.offer.v1' : 'fsf.calc.rent.v1', `fsf.calc.rent.${id}${offer ? '-offer' : ''}.v1`],
      [offer ? 'fsf.calc.commercial.offer.v1' : 'fsf.calc.commercial.v1', `fsf.calc.commercial.${id}${offer ? '-offer' : ''}.v1`],
      ['fsf.bid.analyze-draft.v1', `fsf.bid.analyzed-${id}.v1`],
      ['fsf.calc.lien.v1', `fsf.calc.lien.${id}.v1`],
      ['fsf.calc.lien.az.v1', `fsf.calc.lien.${id}-az.v1`],
    ];
    for (const [from, to] of moves) {
      const v = localStorage.getItem(from);
      if (v !== null) localStorage.setItem(to, v);
      // The region stamp and the list of fields you typed travel with the numbers.
      for (const suffix of ['.region', '.typed.v1']) {
        const x = localStorage.getItem(`${from}${suffix}`) ?? (suffix === '.typed.v1' ? localStorage.getItem(from.replace(/\.v1$/, '.typed.v1')) : null);
        if (x !== null) localStorage.setItem(`${to}${suffix}`, x);
        else localStorage.removeItem(`${to}${suffix}`);
      }
      localStorage.removeItem(to.replace(/\.v1$/, '.typed.v1'));
    }
    clearDraftNumbers(); // the next new deal starts from your plan, not from this one's numbers
  } catch {
    /* storage unavailable */
  }
}

/** A property the visitor found on DeedOwl, sent to Analyze so they don't retype it. */
export interface Prefill {
  name: string;
  state: StateCode;
  county: string;
  kind: SaleKind;
}

const SALE_KIND_OF: Record<SaleType, SaleKind> = {
  TAX_DEED: 'taxSale',
  TAX_LIEN_CERTIFICATE: 'lien',
  TRUSTEE_SALE: 'trustee',
  JUDICIAL_FORECLOSURE: 'court',
  HOA_FORECLOSURE: 'hoa',
  SHERIFF_EXECUTION: 'court',
  FEDERAL_TAX_SEIZURE: 'irs',
  REO: 'reo',
};

/** "#/analyze?name=…&state=NV&county=Clark&kind=taxSale" for a listing, or null if its state or county isn't covered. */
export function analyzeHref(p: { address: string; city?: string; state: string; county: string; saleType?: string }): string | null {
  const st = stateByCode(p.state);
  const county = p.county.replace(/\s+County$/i, '');
  const kind = (p.saleType && SALE_KIND_OF[p.saleType as SaleType]) || 'listing';
  if (!st || !st.counties.includes(county)) return null;
  const q = new URLSearchParams({ name: [p.address, p.city].filter(Boolean).join(', ').slice(0, 80), state: st.code, county, kind });
  return `#/analyze?${q.toString()}`;
}

/** Reads a prefill from the address, keeping only values the page can show. */
export function prefillParam(params: URLSearchParams): Prefill | undefined {
  const st = stateByCode(params.get('state') ?? '');
  const county = params.get('county') ?? '';
  const kind = params.get('kind') as SaleKind | null;
  if (!st || !st.counties.includes(county) || !kind || !SALE_KINDS.some((k) => k.key === kind)) return undefined;
  return { name: (params.get('name') ?? '').slice(0, 80), state: st.code, county, kind };
}
