// Strategy pages (#/learn/strategies/<key>): each way of making money with real estate, built from the Decide
// strategies (what it is, the honest risk, the first steps) plus how the money is made and where to learn, practice
// and run the numbers on this site.
import { STRATEGIES, type Strategy, type StrategyKey } from './decide';

export interface StrategyGuide {
  key: Exclude<StrategyKey, 'practice'>;
  /** Short name for links and the URL. */
  slug: string;
  /** How the money is actually made, in order of how much it usually counts. */
  makesMoney: string[];
  /** What usually goes wrong for a first deal of this kind. */
  watchFor: string[];
  calc?: { label: string; href: string };
  practice: { label: string; href: string }[];
  lessons: string[];
  team: string[];
}

export const STRATEGY_GUIDES: StrategyGuide[] = [
  {
    key: 'househack',
    slug: 'house-hack',
    makesMoney: [
      'The other units’ rent pays part of your mortgage, so you live for less than you would renting or owning a single home.',
      'Each payment pays down the loan, and the property can gain value over time.',
      'Later you can move out and keep it as a full rental, then buy your next home the same way.',
    ],
    watchFor: [
      'Home-loan terms (FHA, VA, conventional) require you to live there; FHA expects you to move in within 60 days and stay at least a year.',
      'Lenders count only part of the other units’ rent, and an FHA loan on 3–4 units must pass a self-sufficiency test on the rents.',
      'You live next to your tenants: screening, rules and repairs are personal.',
    ],
    calc: { label: 'Run it in Keep and rent', href: '#/analyze?plan=rent' },
    practice: [{ label: 'Practice: is a rental worth it at this price?', href: '#/practice/drills/rental-265' }],
    lessons: ['financing', 'analyze', 'after-closing', 'taxes'],
    team: ['lender', 'agent', 'inspector'],
  },
  {
    key: 'rental',
    slug: 'buy-and-hold',
    makesMoney: [
      'Monthly cash flow: the rent left after the loan, taxes, insurance, repairs, vacancy and savings for big replacements.',
      'Loan paydown: the tenant’s rent pays your loan balance down every month.',
      'Appreciation over years, which you can’t count on in any one year.',
      'Tax: depreciation lowers the tax on the rent; it comes back when you sell.',
    ],
    watchFor: [
      'The listing’s rent and the seller’s tax bill are rarely yours: check leased comparables and your own tax bill.',
      'Known replacements (roof, water heater, HVAC) belong in the numbers before you offer.',
      'A thin cushion: keep at least six months of payments in savings after closing.',
    ],
    calc: { label: 'Run it in Keep and rent', href: '#/analyze?plan=rent' },
    practice: [{ label: 'Buy a rental, start to finish', href: '#/practice/case' }, { label: 'Practice: is a rental worth it at this price?', href: '#/practice/drills/rental-265' }],
    lessons: ['analyze', 'walk-away', 'financing', 'after-closing', 'taxes'],
    team: ['agent', 'lender', 'inspector', 'insurance', 'property_manager'],
  },
  {
    key: 'reo',
    slug: 'bank-owned',
    makesMoney: [
      'Buying below what similar homes sell for, because banks and agencies sell as-is and often need repairs.',
      'Then the same ways as a rental or a flip, depending on your plan.',
    ],
    watchFor: [
      'As-is means no seller repairs: use the inspection period and walk away if the numbers break.',
      'Bank addenda override parts of the standard contract: read deadlines, per-day penalties and who pays what.',
      'Some government sales give owner-occupants first chance before investors can bid.',
    ],
    calc: { label: 'Run it in Fix and sell or Keep and rent', href: '#/analyze?plan=flip' },
    practice: [{ label: 'Practice: a bank-owned home', href: '#/practice/drills/bank-owned' }, { label: 'Practice purchase: bank-owned house', href: '#/practice/reo-house' }],
    lessons: ['forced-sales', 'analyze', 'negotiate'],
    team: ['agent', 'inspector', 'title', 'lender'],
  },
  {
    key: 'flip',
    slug: 'fix-and-flip',
    makesMoney: [
      'The sale price minus everything: the purchase, repairs, loan and holding costs while you work, and the commission and closing costs when you sell.',
      'Profit comes from buying low enough and finishing on budget and on time, not from the market rising.',
    ],
    watchFor: [
      'Repairs and time run over: add a contingency and price each extra month of holding costs.',
      'The profit is usually taxed as ordinary income, and can owe self-employment tax; it can’t use a 1031 exchange.',
      'Have a fallback: can you rent it if it doesn’t sell at your price?',
    ],
    calc: { label: 'Run it in Fix and sell', href: '#/analyze?plan=flip' },
    practice: [{ label: 'Practice: is there really a profit?', href: '#/practice/drills/flip-numbers' }],
    lessons: ['analyze', 'walk-away', 'financing', 'taxes'],
    team: ['agent', 'contractor', 'private_lender', 'inspector', 'cpa'],
  },
  {
    key: 'brrrr',
    slug: 'brrrr',
    makesMoney: [
      'Repairs raise the value, and a refinance at the new value returns part of your cash to use again.',
      'After that, it earns like a rental: cash flow, loan paydown and appreciation.',
    ],
    watchFor: [
      'The refinance depends on the appraisal and the lender’s waiting period (often 6 to 12 months). A low appraisal leaves more cash in.',
      'The new, bigger loan must still leave positive cash flow at the new rate.',
      'Short-term money (hard money, credit) gets expensive if the refinance is late.',
    ],
    calc: { label: 'Run it in Keep and rent (with the refinance)', href: '#/analyze?plan=rent' },
    practice: [{ label: 'Practice: a BRRRR where the appraisal comes in low', href: '#/practice/drills/brrrr-appraisal' }],
    lessons: ['analyze', 'financing', 'after-closing', 'taxes'],
    team: ['private_lender', 'lender', 'contractor', 'appraiser', 'property_manager'],
  },
  {
    key: 'auction',
    slug: 'auctions',
    makesMoney: [
      'Buying well below market value, at the price of more risk: cash on the day, no inspection inside, and title or occupancy problems.',
      'Then reselling or renting once title is insurable and any redemption period has ended.',
    ],
    watchFor: [
      'Each kind of sale differs by state: what survives the sale, redemption periods, and how you pay.',
      'You usually can’t see inside, and occupants must be removed through the courts.',
      'Many title companies won’t insure right away; budget for a quiet title action.',
    ],
    calc: { label: 'Run it in Fix and sell (maximum bid)', href: '#/analyze?plan=flip' },
    practice: [{ label: 'Practice: a foreclosure auction (Nevada)', href: '#/practice/drills/trustee-sale-nv' }, { label: 'Sale guides for your state', href: '#/playbooks' }],
    lessons: ['forced-sales', 'walk-away', 'tools', 'taxes'],
    team: ['attorney', 'title', 'eviction', 'insurance'],
  },
  {
    key: 'apartments',
    slug: 'apartments-and-commercial',
    makesMoney: [
      'Net operating income: rent from many tenants after operating costs.',
      'Value follows the income (value = NOI ÷ cap rate), so raising rents or cutting costs raises the value: $10,000 more NOI at a 7% cap rate is about $143,000 of value.',
      'Loan paydown and long-term appreciation, often shared with partners.',
    ],
    watchFor: [
      'Verify the rent roll, the last 12 months of income and costs, and tenant estoppels; sellers’ “pro forma” numbers are guesses.',
      'Commercial loans size on the income, often end in a balloon, and can carry personal-guarantee carve-outs.',
      'A Phase I environmental review before you’re committed, for most commercial property.',
    ],
    calc: { label: 'Run it in Commercial income', href: '#/analyze?plan=commercial' },
    practice: [{ label: 'Practice: a 12-unit apartment building', href: '#/practice/drills/apartments-12' }, { label: 'Practice: a small retail building', href: '#/practice/drills/retail-strip' }],
    lessons: ['markets', 'types', 'analyze', 'financing'],
    team: ['agent', 'lender', 'attorney', 'environmental', 'cpa'],
  },
  {
    key: 'passive',
    slug: 'reits-and-funds',
    makesMoney: [
      'Dividends from the company’s or fund’s rental income, and changes in the share price.',
      'No property to manage, and you can usually start with little money.',
    ],
    watchFor: [
      'Prices of traded REITs rise and fall with the stock market.',
      'Non-traded REITs and private funds can be hard to sell and carry high fees; read the offering documents.',
      'REIT dividends are usually taxed as ordinary income, though most qualify for a 20% deduction (Section 199A).',
    ],
    practice: [],
    lessons: ['who', 'red-flags'],
    team: ['cpa'],
  },
];

export const strategyBySlug = (slug: string) => STRATEGY_GUIDES.find((g) => g.slug === slug);
export const strategyOf = (g: StrategyGuide): Strategy => STRATEGIES.find((s) => s.key === g.key)!;
export const strategyHref = (key: StrategyKey) => {
  const g = STRATEGY_GUIDES.find((x) => x.key === key);
  return g ? `#/learn/strategies/${g.slug}` : '#/decide';
};
