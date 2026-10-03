// The investor toolkit: a first-deal roadmap to tick off, a buy box to fill in, and links to every free tool and
// checklist on the site. Ticks and the buy box stay in this browser.

export type RoadmapPath = 'listing' | 'auction';

export interface RoadmapStep {
  id: string;
  /** Which of the four phases it belongs to. */
  phase: 1 | 2 | 3 | 4;
  text: string;
  /** What the link does, so a learner knows where it goes. */
  action?: string;
  href?: string;
  /** When to tick it. */
  doneWhen: string;
  /** Only on one way of buying; steps without it apply to both. */
  path?: RoadmapPath;
}

export const ROADMAP_PHASES: Record<RoadmapStep['phase'], string> = {
  1: 'Get ready',
  2: 'Make a plan',
  3: 'Practice and build your team',
  4: 'Buy your first property',
};

export const ROADMAP_PATHS: Record<RoadmapPath, { label: string; hint: string }> = {
  listing: { label: 'Through an agent', hint: 'A home listed for sale, bank-owned homes and short sales: you make an offer with conditions.' },
  auction: { label: 'At an auction', hint: 'Tax, foreclosure, sheriff and other sales: you research first, then bid, usually with no inside look and no way out.' },
};

/** From first idea to owning the property, in order. Step 4 depends on how you buy. */
export const ROADMAP: RoadmapStep[] = [
  { id: 'goal', phase: 1, text: 'Decide what you want from investing: monthly income, long-term growth or a one-time profit.', action: 'Choose your goal', href: '#/decide', doneWhen: 'You can say your goal in one sentence.' },
  { id: 'money', phase: 1, text: 'Know your numbers: savings after an emergency fund, debts and credit.', action: 'Check your finances', href: '#/decide', doneWhen: 'You know how much cash you could invest without touching your emergency fund.' },
  { id: 'strategy', phase: 1, text: 'Choose a strategy that fits your money, time and comfort with risk.', action: 'Compare strategies', href: '#/decide', doneWhen: 'You’ve picked one strategy to learn first.' },
  { id: 'avoid', phase: 1, text: 'Learn the warning signs of seminar and coaching scams.', action: 'Read the warning signs', href: '#/learn/red-flags', doneWhen: 'You’ve read the lesson and know what to walk away from.' },
  { id: 'market', phase: 2, text: 'Pick a state and county, and learn how sales work there.', action: 'Find sales near you', href: '#/find-deals', doneWhen: 'You’ve picked a county and know which kinds of sales happen there.' },
  { id: 'buybox', phase: 2, text: 'Write your buy box: the exact properties you’re looking for.', action: 'Fill in your buy box', href: '#/toolkit/buy-box', doneWhen: 'Your buy box has an area, a property type, a price limit and deal breakers.' },
  { id: 'financing', phase: 2, text: 'Learn how you’d pay for it, and compare the options.', action: 'Compare ways to pay', href: '#/learn/financing', doneWhen: 'You know which ways of paying fit your plan. Most auctions need cash.' },
  { id: 'lender', phase: 2, text: 'Talk with a licensed loan officer about what you’d qualify for.', action: 'What to ask a lender', href: '#/pros/lender', doneWhen: 'You have a written pre-approval, or you know your cash limit.' },
  { id: 'team', phase: 3, text: 'Line up your team: agent, title company, inspector, appraiser, contractor and attorney.', action: 'Meet your deal team', href: '#/pros', doneWhen: 'You have a name for each role, or know where you’ll find one.' },
  { id: 'practice', phase: 3, text: 'Finish practice purchases and “Would you buy it?” drills.', action: 'Try a practice deal', href: '#/practice', doneWhen: 'You’ve finished one practice purchase and at least three drills.' },
  { id: 'paper', phase: 3, text: 'Analyze ten real listings on paper with the calculators.', action: 'Open the calculators', href: '#/analyze', doneWhen: 'You’ve run the numbers on ten real properties.' },
  { id: 'walk', phase: 3, text: 'Know when to walk away: set your maximum price before you look.', action: 'Learn when to walk away', href: '#/learn/walk-away', doneWhen: 'You can work out a maximum price before you look at a property.' },
  { id: 'tour', phase: 4, path: 'listing', text: 'Tour properties, then have a licensed inspector check the one you want.', action: 'What an inspection covers', href: '#/pros/inspector', doneWhen: 'You have an inspection report, or an inspection condition in your offer.' },
  { id: 'appraise', phase: 4, path: 'listing', text: 'Have a licensed appraiser value it. Your agent can estimate the value from comparable sales until then.', action: 'About appraisers', href: '#/pros/appraiser', doneWhen: 'You have an appraisal, or your offer depends on one.' },
  { id: 'offer', phase: 4, path: 'listing', text: 'Make an offer at or below your maximum, with conditions (contingencies) for the inspection, your loan and the appraisal.', action: 'How to negotiate', href: '#/learn/negotiate', doneWhen: 'Your offer is signed and its deadlines are on your calendar.' },
  { id: 'diligence', phase: 4, path: 'listing', text: 'Finish your checks before each deadline: title, permits, insurance and any HOA.', action: 'Research tools', href: '#/learn/tools', doneWhen: 'Every check is done before its deadline, or you canceled in time.' },
  { id: 'close', phase: 4, path: 'listing', text: 'Close through a title or escrow company, and keep every document.', action: 'About title companies', href: '#/pros/title', doneWhen: 'The deed is recorded in your name and you have copies of everything.' },
  { id: 'a-research', phase: 4, path: 'auction', text: 'Research before the sale: the official notice, a title search for liens that stay, and who lives there. You usually can’t go inside, and you can’t back out after you win.', action: 'Read how the sale works', href: '#/playbooks', doneWhen: 'You know what you’d own, which liens stay with it, and how you’d lawfully get possession.' },
  { id: 'a-value', phase: 4, path: 'auction', text: 'Estimate the value from the outside: an exterior-only appraisal if one is possible, or your agent’s estimate from comparable sales.', action: 'About appraisers', href: '#/pros/appraiser', doneWhen: 'You have a value estimate and a repair budget with a cushion.' },
  { id: 'a-max', phase: 4, path: 'auction', text: 'Set your maximum bid with every cost, and have the cash or certified funds the sale requires.', action: 'Set your maximum bid', href: '#/calculator', doneWhen: 'Your maximum is written down and your funds meet the sale’s payment rules.' },
  { id: 'a-bid', phase: 4, path: 'auction', text: 'Register, bid, and stop at your maximum.', action: 'Practice an auction', href: '#/practice', doneWhen: 'You bid within your maximum, or walked away.' },
  { id: 'a-after', phase: 4, path: 'auction', text: 'After you win: pay on time, record the deed, insure it, and take possession only through the lawful process.', action: 'How possession works', href: '#/pros/eviction', doneWhen: 'The deed is recorded, the property is insured and you have lawful possession.' },
];

/** The steps for one way of buying. */
export const roadmapFor = (path: RoadmapPath) => ROADMAP.filter((s) => !s.path || s.path === path);

/** The roadmap for buying through an agent (the default). */
export const FIRST_DEAL: RoadmapStep[] = roadmapFor('listing');

/** An example buy box a beginner can start from and change. */
export const EXAMPLE_BUY_BOX = {
  area: 'Two or three ZIP codes near where I live',
  types: ['Single-family house', 'Condo or townhouse'],
  strategy: 'Buy and hold a rental',
  priceMax: 300000,
  repairsMax: 25000,
  cashMax: 80000,
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
      { label: 'Maximum bid and flip calculator', href: '#/calculator', what: 'Your walk-away price: the most you can pay and still make your profit, with what-ifs for a lower value or higher repairs.' },
      { label: 'Rental calculator and Deal Lab', href: '#/analyze', what: 'Monthly cash flow, your yearly return on the cash you put in (cash-on-cash), whether the rent covers the loan, and the deal explained in plain words.' },
      { label: 'Commercial income and value', href: '#/analyze', what: 'Net operating income (rent after operating costs), cap rate (that income as a % of the price) and what the income says the building is worth.' },
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
      'What is your NMLS license number?',
    ],
  },
  {
    key: 'contractor',
    title: 'Contractor interview',
    intro: 'Get at least two written bids for the same scope of work, and check each license with the state board.',
    items: [
      'Does the job fit your license’s type of work and dollar limit? What is your license number?',
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
      'Landlord insurance in place from the day you take ownership.',
      'Locks changed or rekeyed once you have legal possession; utilities in your name.',
      'A separate bank account for the property; every receipt kept.',
      'Safety repairs done before you advertise.',
      'Written screening criteria and a lease that follows your state’s law.',
      'A cash reserve for repairs and vacancies.',
      'A plan for emergencies: who answers calls, and which vendors to use.',
      'Actual income and costs compared with your numbers each year.',
    ],
  },
];

/** A worksheet as plain text with space to write. */
export function worksheetText(w: { title: string; intro: string; items: string[] }): string {
  return [`${w.title}`, 'DeedOwl educational worksheet. General information, not legal, tax or financial advice.', '', w.intro, '', ...w.items.map((x) => `[ ] ${x}\n    Notes:\n`)].join('\n');
}
