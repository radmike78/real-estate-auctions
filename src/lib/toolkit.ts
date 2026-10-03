// The investor toolkit: a first-deal roadmap to tick off, a buy box to fill in, and links to every free tool and
// checklist on the site. Ticks and the buy box stay in this browser.

export interface RoadmapStep {
  id: string;
  text: string;
  href?: string;
}

/** From first idea to closing, in order. */
export const FIRST_DEAL: RoadmapStep[] = [
  { id: 'goal', text: 'Decide what you want from investing: monthly income, long-term growth or a one-time profit.', href: '#/decide' },
  { id: 'money', text: 'Know your numbers: savings after an emergency fund, debts and credit.', href: '#/decide' },
  { id: 'strategy', text: 'Choose a strategy that fits your money, time and comfort with risk.', href: '#/decide' },
  { id: 'avoid', text: 'Learn the warning signs of seminar and coaching scams.', href: '#/learn/red-flags' },
  { id: 'market', text: 'Pick a state and county, and learn how sales work there.', href: '#/find-deals' },
  { id: 'buybox', text: 'Write your buy box: the exact properties you’re looking for.', href: '#/toolkit/buy-box' },
  { id: 'financing', text: 'Learn how you’d pay for it, and compare the options.', href: '#/learn/financing' },
  { id: 'lender', text: 'Talk with a licensed loan officer about what you’d qualify for.', href: '#/pros/lender' },
  { id: 'team', text: 'Line up your team: agent, title company, inspector, contractor and attorney.', href: '#/pros' },
  { id: 'practice', text: 'Finish practice purchases and “Would you buy it?” drills.', href: '#/practice' },
  { id: 'paper', text: 'Analyze ten real listings on paper with the calculators.', href: '#/analyze' },
  { id: 'walk', text: 'Know when to walk away: set your maximum price before you look.', href: '#/analyze' },
  { id: 'tour', text: 'Tour properties and have a licensed inspector check the one you want.', href: '#/pros/inspector' },
  { id: 'offer', text: 'Make your first offer or bid, at or below your maximum.', href: '#/learn/negotiate' },
  { id: 'diligence', text: 'Do your due diligence: title, liens, permits, insurance and occupants.', href: '#/learn/tools' },
  { id: 'close', text: 'Close through a title or escrow company, and keep every document.', href: '#/pros/title' },
];

export interface BuyBox {
  state: string;
  area: string;
  types: string[];
  strategy: string;
  priceMax: number;
  repairsMax: number;
  cashMax: number;
  minCashFlow: number;
  beds: string;
  dealBreakers: string[];
  notes: string;
}

export const PROPERTY_TYPE_OPTIONS = ['Single-family house', 'Condo or townhouse', 'Duplex to fourplex', 'Manufactured home', 'Apartment building (5+ units)', 'Commercial property', 'Land'];
export const STRATEGY_OPTIONS = ['Live in one unit, rent the others', 'Buy and hold a rental', 'Buy, fix, rent and refinance (BRRRR)', 'Fix and flip', 'Bank-owned and government homes', 'Tax and foreclosure auctions', 'Still deciding'];
export const DEAL_BREAKERS = [
  'High-risk flood zone',
  'Foundation or structural problems',
  'Unpermitted additions',
  'Septic or sewer line problems',
  'HOA with special assessments or lawsuits',
  'Occupied, with no clear path to possession',
  'Liens or title problems I can’t clear',
  'Can’t get insurance at a workable price',
  'Negative cash flow with realistic rent',
];

export const EMPTY_BUY_BOX: BuyBox = { state: '', area: '', types: [], strategy: '', priceMax: 0, repairsMax: 0, cashMax: 0, minCashFlow: 0, beds: '', dealBreakers: [], notes: '' };

/** A saved buy box, cleaned so a damaged or old entry can't break the page. */
export function cleanBuyBox(v: unknown): BuyBox {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const str = (x: unknown, max = 200) => (typeof x === 'string' ? x.slice(0, max) : '');
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.min(x, 1e9) : 0);
  const pick = (x: unknown, allowed: string[]) => (Array.isArray(x) ? x.filter((y): y is string => typeof y === 'string' && allowed.includes(y)) : []);
  return {
    state: str(o.state, 2),
    area: str(o.area),
    types: pick(o.types, PROPERTY_TYPE_OPTIONS),
    strategy: STRATEGY_OPTIONS.includes(str(o.strategy)) ? str(o.strategy) : '',
    priceMax: num(o.priceMax),
    repairsMax: num(o.repairsMax),
    cashMax: num(o.cashMax),
    minCashFlow: num(o.minCashFlow),
    beds: str(o.beds, 40),
    dealBreakers: pick(o.dealBreakers, DEAL_BREAKERS),
    notes: str(o.notes, 1000),
  };
}

/** The free tools and checklists on DeedOwl, grouped. */
export const TOOLKIT: { group: string; items: { label: string; href: string; what: string }[] }[] = [
  {
    group: 'Calculators',
    items: [
      { label: 'Maximum bid and flip calculator', href: '#/analyze', what: 'Your walk-away price, with stress tests on value and repairs.' },
      { label: 'Rental calculator and Deal Lab', href: '#/analyze', what: 'Cash flow, cash-on-cash, loan coverage, stress tests and the deal explained.' },
      { label: 'Commercial income and value', href: '#/analyze', what: 'Net operating income, cap rate and value by income.' },
    ],
  },
  {
    group: 'Practice',
    items: [
      { label: 'Practice purchases', href: '#/practice', what: 'Buy a fictional property step by step for each kind of sale.' },
      { label: '“Would you buy it?” drills', href: '#/practice', what: 'Pick comps, check rent, price repairs, find liens, then decide.' },
    ],
  },
  {
    group: 'Checklists',
    items: [
      { label: 'How each kind of sale works', href: '#/playbooks', what: 'Step-by-step guides with what to check before you bid.' },
      { label: 'Due diligence and research tools', href: '#/learn/tools', what: 'Records, maps, comps and the checks investors run.' },
      { label: 'Before any forced sale', href: '#/learn/forced-sales', what: 'Title, liens that survive, occupants and redemption.' },
      { label: 'Seminar red flags', href: '#/learn/red-flags', what: 'Warning signs of coaching and seminar scams.' },
    ],
  },
  {
    group: 'Your team',
    items: [
      { label: 'Questions for a lender', href: '#/pros/lender', what: 'What to ask, how they’re paid and what to check before you hire.' },
      { label: 'Questions for a contractor', href: '#/pros/contractor', what: 'Licenses, bids, insurance and what went wrong for others.' },
      { label: 'Questions for a property manager', href: '#/pros/property_manager', what: 'Fees, screening, reports and the management agreement.' },
      { label: 'Questions for an inspector', href: '#/pros/inspector', what: 'What an inspection covers and what it misses.' },
    ],
  },
];
