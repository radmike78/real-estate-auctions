// The investor toolkit: a first-deal roadmap to tick off, a buy box to fill in, and links to every free tool and
// checklist on the site. Ticks and the buy box stay in this browser.

export * from './roadmap';

/** An example buy box a beginner can start from and change. */
export const EXAMPLE_BUY_BOX = {
  area: 'Two or three ZIP codes near where I live',
  types: ['Single-family house', 'Condo or townhouse'],
  strategy: 'Buy and hold a rental',
  priceMax: 300000,
  repairsMax: 25000,
  cashMax: 120000,
  minCashFlow: 200,
  beds: '3+ beds, 2 baths',
  dealBreakers: ['Foundation or structural problems', 'High-risk flood zone', 'Negative cash flow with realistic rent'],
  notes: 'Example only. Replace these with your own numbers.',
};

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

export const PROPERTY_TYPE_OPTIONS = ['Single-family house', 'Condo or townhouse', 'Duplex to fourplex', 'Manufactured home', 'Apartment building (5+ units)', 'Commercial property', 'Mixed-use property', 'Land'];
export const STRATEGY_OPTIONS = ['Live in one unit, rent the others', 'Buy and hold a rental', 'Buy, fix, rent and refinance (BRRRR)', 'Fix and flip', 'Bank-owned and government homes', 'Tax and foreclosure auctions', 'Lien certificates (earn interest until the owner pays)', 'Still deciding'];
/** The buy-box strategy for liens: there's no property to rent, so rent and bedroom fields don't apply. */
export const LIEN_STRATEGY = 'Lien certificates (earn interest until the owner pays)';
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
      { label: 'Walk-away price calculator (fix and sell)', href: '#/analyze?plan=flip', what: 'Your walk-away price: the most you can pay and still make your profit, with what-ifs for a lower value or higher repairs.' },
      { label: 'Rental calculator and Deal Lab', href: '#/analyze?plan=rent', what: 'Monthly cash flow, your yearly return on the cash you put in (cash-on-cash), whether the rent covers the loan, and the deal explained in plain words.' },
      { label: 'Commercial income and value', href: '#/analyze?plan=commercial', what: 'Net operating income (rent after operating costs), cap rate (that income as a % of the price) and what the income says the building is worth.' },
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
    group: 'Questions to ask your team',
    items: [
      { label: 'Questions for a lender', href: '#/pros/lender', what: 'What to ask, how they’re paid and what to check before you hire.' },
      { label: 'Questions for a contractor', href: '#/pros/contractor', what: 'Licenses, bids, insurance and what went wrong for others.' },
      { label: 'Questions for a property manager', href: '#/pros/property_manager', what: 'Fees, screening, reports and the management agreement.' },
      { label: 'Questions for an inspector', href: '#/pros/inspector', what: 'What an inspection covers and what it misses.' },
      { label: 'Questions for an appraiser', href: '#/pros/appraiser', what: 'What an appraisal is, how it differs from your agent’s estimate, and why it’s the best way to determine a property’s value.' },
    ],
  },
];

/** Worksheets to download or print: questions to ask and checklists to work through. */
export const WORKSHEETS: { key: string; title: string; intro: string; items: string[] }[] = [
  {
    key: 'lender',
    title: 'Lender interview',
    intro: 'Ask two or three lenders the same questions, and compare their Loan Estimates or written term sheets side by side. Loans for a property you won’t live in often come with a term sheet instead of a Loan Estimate.',
    items: [
      'What loan types fit this property and my plan?',
      'What are the rate, points and closing costs?',
      'What down payment and cash reserves will you require?',
      'Do you lend on homes that need work?',
      'If you offer DSCR loans, how do you calculate DSCR, and what minimum do you require?',
      'What conditions must be met before closing, and how long will it take to close?',
      'Is there a prepayment penalty, a balloon payment, or a limit on refinancing?',
      'Which license do you hold, which regulator issued it, and what is the number?',
    ],
  },
  {
    key: 'contractor',
    title: 'Contractor interview',
    intro: 'Get at least two written bids for the same scope of work from qualified contractors, and check the licenses your state requires on its official lookup. Texas has no statewide license for general contractors or remodelers: check the trade licenses (electrical, plumbing, air conditioning), insurance and references instead.',
    items: [
      'Which licenses do you and your trades hold, and does the job fit their type of work (and dollar limit, where the state sets one)? What are the numbers?',
      'Do you carry liability insurance and, if you have employees, workers’ compensation?',
      'Can I see references from similar jobs?',
      'What is included and excluded in the written scope?',
      'Who pulls the permits and schedules inspections?',
      'What’s the payment schedule? (Pay as work is completed, not far ahead of it.)',
      'How are change orders priced and approved?',
      'What warranty do you give on the work?',
    ],
  },
  {
    key: 'property-manager',
    title: 'Property manager interview',
    intro: 'Read the management agreement before you sign, especially fees and how to end it.',
    items: [
      'What’s your monthly fee, and your fee to find a tenant and to renew a lease?',
      'How do you screen tenants, using the same written criteria for everyone?',
      'Who approves repairs, up to what amount, and how are they billed?',
      'How do you handle emergencies after hours?',
      'What reports do I get each month: rent collected, vacancy, expenses?',
      'Do you hold a real estate or property management license where required?',
      'How do I end the agreement, and what does it cost?',
    ],
  },
  {
    key: 'auction',
    title: 'Auction checklist',
    intro: 'Work through it before every tax, trustee, sheriff, HOA or IRS sale. Rules differ by state and kind of sale.',
    items: [
      'Find the official sale notice and who runs the sale.',
      'Confirm the parcel number, address and exactly what interest is being sold.',
      'Read the deposit, payment deadline and accepted forms of payment.',
      'Have a title professional review which liens survive this kind of sale in this state.',
      'Find out who lives there and plan a lawful path to possession.',
      'Check any redemption period and what it means for repairs.',
      'Budget repairs you can’t see, possession costs, holding costs and reserves.',
      'Set a walk-away price with the calculator, and have the cash ready before you bid.',
      'Never contact or pressure the homeowner. Deal only with the official seller.',
    ],
  },
  {
    key: 'post-purchase',
    title: 'After you buy',
    intro: 'The first weeks of owning a rental. See the lesson “After you buy” for your state’s rules.',
    items: [
      'Landlord insurance in place from the day you own it.',
      'Locks changed or rekeyed once you legally have possession, and utilities in your name.',
      'A separate bank account for the property, and every receipt kept.',
      'Safety repairs done before you advertise.',
      'Written screening criteria and a lease that follows your state’s law.',
      'A cash reserve for repairs and vacancies.',
      'A plan for emergencies: who answers calls, and which vendors to use.',
      'Once a year, your actual income and costs compared with your plan.',
    ],
  },
];

/** A worksheet as plain text with space to write. */
export function worksheetText(w: { title: string; intro: string; items: string[] }): string {
  return [`${w.title}`, 'DeedOwl educational worksheet. General information, not legal, tax or financial advice.', '', w.intro, '', ...w.items.map((x) => `[ ] ${x}\n    Notes:\n`)].join('\n');
}
