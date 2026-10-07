// Decide (step 2): a few questions that point to the investing strategies that fit someone's money, time and
// goals, each with a checklist of what to do next. Answers and ticked items stay in this browser.
import type { StateCode } from './regions';

export type QuestionKey = 'goal' | 'cash' | 'ready' | 'borrow' | 'time' | 'hands' | 'risk' | 'market' | 'state';

export interface Question {
  key: QuestionKey;
  ask: string;
  help?: string;
  /** How the answer reads in "fits because…" lines. */
  label: string;
  options: { value: string; text: string }[];
}

export const QUESTIONS: Question[] = [
  {
    key: 'goal',
    ask: 'What do you want most from investing?',
    label: 'your goal',
    options: [
      { value: 'income', text: 'Monthly income from rent' },
      { value: 'growth', text: 'Build wealth over the long run' },
      { value: 'quick', text: 'Profit from buying and reselling' },
      { value: 'handsoff', text: 'Invest without owning or managing a building' },
      { value: 'learn', text: 'I’m not sure yet; I want to learn first' },
    ],
  },
  {
    key: 'cash',
    ask: 'How much cash could you put toward a first deal?',
    help: 'Savings you can invest after keeping an emergency fund. Include closing and repair costs.',
    label: 'your budget',
    options: [
      { value: 'under10', text: 'Under $10,000' },
      { value: '10to50', text: '$10,000 to $50,000' },
      { value: '50to150', text: '$50,000 to $150,000' },
      { value: 'over150', text: 'More than $150,000' },
    ],
  },
  {
    key: 'ready',
    ask: 'Before you invest: where do your savings and debts stand?',
    help: 'Deals go over budget. Savings for emergencies and no high-interest debt keep a surprise from becoming a crisis.',
    label: 'your savings and debts',
    options: [
      { value: 'ready', text: 'I have an emergency fund and no high-interest debt' },
      { value: 'debt', text: 'I carry credit card or other high-interest debt' },
      { value: 'nofund', text: 'I don’t have an emergency fund yet' },
    ],
  },
  {
    key: 'borrow',
    ask: 'How would you pay for it?',
    label: 'how you’d pay',
    options: [
      { value: 'live', text: 'A home loan, and I’d live in the property' },
      { value: 'invest', text: 'A loan for an investment property I won’t live in' },
      { value: 'cash', text: 'Cash only' },
      { value: 'unsure', text: 'Not sure what I’d qualify for' },
    ],
  },
  {
    key: 'time',
    ask: 'How much time can you give it?',
    label: 'your time',
    options: [
      { value: 'monthly', text: 'A few hours a month' },
      { value: 'weekly', text: 'A few hours a week' },
      { value: 'parttime', text: '10 hours a week or more' },
    ],
  },
  {
    key: 'hands',
    ask: 'Repairs and tenants: how hands-on do you want to be?',
    label: 'how hands-on you are',
    options: [
      { value: 'diy', text: 'I’ll handle a lot myself' },
      { value: 'hire', text: 'I’ll hire contractors and a property manager' },
      { value: 'none', text: 'I don’t want to deal with either' },
    ],
  },
  {
    key: 'risk',
    ask: 'How much risk are you comfortable with?',
    help: 'Higher-risk strategies can pay more, and can lose more.',
    label: 'your comfort with risk',
    options: [
      { value: 'low', text: 'Low: I’d rather go slow and steady' },
      { value: 'medium', text: 'Medium: some surprises are OK' },
      { value: 'high', text: 'High: I could lose all the cash I put in, and owe more on a loan, and still be OK' },
    ],
  },
  {
    key: 'market',
    ask: 'Residential or commercial?',
    label: 'the market you picked',
    options: [
      { value: 'res', text: 'Residential: houses, condos, 2–4 units' },
      { value: 'com', text: 'Commercial: apartments, retail, office, industrial' },
      { value: 'unsure', text: 'Not sure yet' },
    ],
  },
  {
    key: 'state',
    ask: 'Where do you want to invest?',
    label: 'your state',
    options: [
      { value: 'NV', text: 'Nevada' },
      { value: 'CA', text: 'California' },
      { value: 'AZ', text: 'Arizona' },
      { value: 'UT', text: 'Utah' },
      { value: 'TX', text: 'Texas' },
    ],
  },
];

export type Answers = Partial<Record<QuestionKey, string>>;

export type StrategyKey = 'househack' | 'rental' | 'reo' | 'flip' | 'brrrr' | 'auction' | 'apartments' | 'passive' | 'practice';

export interface ChecklistItem {
  id: string;
  text: string;
  href?: string;
}

export interface Strategy {
  key: StrategyKey;
  title: string;
  what: string;
  /** Points for each answer; missing answers score 0. */
  weights: Partial<Record<Exclude<QuestionKey, 'state'>, Record<string, number>>>;
  /** The honest downside: the worst realistic outcome, the money at stake, and how long a first deal takes. */
  /** atRisk is the cash needed to start, not a loss limit; ongoing says what you keep owing and how you could lose more. */
  risk: { worst: string; atRisk: string; ongoing?: string; time: string };
  checklist: ChecklistItem[];
}

export const STRATEGIES: Strategy[] = [
  {
    key: 'househack',
    title: 'Live in one unit, rent the others',
    what: 'Buy a 2–4 unit home, live in one unit and rent out the rest. You get home-loan terms, and the rent helps pay the mortgage.',
    weights: {
      goal: { income: 2, growth: 2, quick: 0, handsoff: -1, learn: 2 },
      cash: { under10: -2, '10to50': 3, '50to150': 2, over150: 1 },
      ready: { ready: 0, debt: -3, nofund: -3 },
      borrow: { live: 4, invest: -3, cash: -2, unsure: 1 },
      time: { monthly: -2, weekly: 2, parttime: 2 },
      hands: { diy: 2, hire: 1, none: -2 },
      risk: { low: 1, medium: 2, high: 1 },
      market: { res: 1, com: -2, unsure: 0 },
    },
    risk: {
      worst: 'A unit sits empty or a tenant stops paying, and you still owe the whole mortgage on the home you live in.',
      atRisk: 'Your down payment, closing costs and the reserves your lender requires.',
      ongoing: 'You owe every loan payment, tax and insurance bill even when a unit is empty or repairs run over. If you can’t pay, you can lose the property and the equity in it, so you can lose more than the cash you start with.',
      time: 'Months: pre-approval, a search, then a closing like any home purchase.',
    },
    checklist: [
      { id: 'hh-lesson', text: 'Read the traditional financing lesson: FHA and VA loans for a home you’ll live in.', href: '#/learn/financing' },
      { id: 'hh-lender', text: 'Talk to a licensed loan officer about pre-approval for a 2–4 unit home you’ll live in.', href: '#/pros/lender' },
      { id: 'hh-reserves', text: 'Save for closing costs and reserves. An FHA loan on 3–4 units needs three months of payments left in savings after closing, and the rents must pass FHA’s self-sufficiency test.' },
      { id: 'hh-rules', text: 'Learn your state’s landlord-tenant rules and any local rent rules.' },
      { id: 'hh-agent', text: 'Find a buyer’s agent who knows small multi-unit homes.', href: '#/pros/agent' },
      { id: 'hh-numbers', text: 'Run the numbers with the rent from the other units, including vacancy and repairs.', href: '#/analyze?plan=rent' },
      { id: 'hh-landlord', text: 'Get ready to be a landlord: screening, leases and repairs.', href: '#/learn/reading' },
    ],
  },
  {
    key: 'rental',
    title: 'Buy and hold a rental',
    what: 'Buy a house, condo or small multi-unit home to rent out long term: monthly income and growth over time.',
    weights: {
      goal: { income: 3, growth: 2, quick: 0, handsoff: 0, learn: 1 },
      cash: { under10: -2, '10to50': 1, '50to150': 3, over150: 2 },
      ready: { ready: 0, debt: -4, nofund: -4 },
      borrow: { live: 1, invest: 3, cash: 1, unsure: 1 },
      time: { monthly: -1, weekly: 2, parttime: 2 },
      hands: { diy: 2, hire: 2, none: -1 },
      risk: { low: 1, medium: 2, high: 1 },
      market: { res: 1, com: -1, unsure: 0 },
    },
    risk: {
      worst: 'Vacancy, a tenant who stops paying or a big repair leaves you paying the mortgage yourself. Evictions take a court case.',
      atRisk: 'The down payment: at least 15% (one unit) to 25% (two to four units) on Fannie Mae investment loans, plus closing costs and reserves.',
      ongoing: 'You owe every loan payment, tax and insurance bill even when a unit is empty or repairs run over. If you can’t pay, you can lose the property and the equity in it, so you can lose more than the cash you start with.',
      time: 'Months: pre-approval, a search and a closing, then finding a tenant.',
    },
    checklist: [
      { id: 'rt-lessons', text: 'Read the lessons on analyzing a deal and traditional financing.', href: '#/learn/analyze' },
      { id: 'rt-market', text: 'Pick an area: check rents from homes like these that actually rented nearby, taxes and flood risk. HUD’s Fair Market Rent is only a rough area benchmark.', href: '#/learn/tools' },
      { id: 'rt-loan', text: 'Get pre-approved for an investment property loan; lenders often want six months of payments in reserve.', href: '#/pros/lender' },
      { id: 'rt-manage', text: 'Decide whether you’ll manage it yourself or hire a property manager, and get quotes.', href: '#/pros/property_manager' },
      { id: 'rt-numbers', text: 'Run the numbers with vacancy, repairs and management, and know your cash flow.', href: '#/analyze?plan=rent' },
      { id: 'rt-insure', text: 'Get landlord insurance quotes before you make an offer.', href: '#/pros/insurance' },
      { id: 'rt-tenants', text: 'Plan tenant screening and use a written lease that follows your state’s law.' },
    ],
  },
  {
    key: 'reo',
    title: 'Bank-owned and government homes',
    what: 'Buy homes a lender or agency already owns (a bank, Fannie Mae, Freddie Mac or HUD), most often after a foreclosure and sometimes after the owner signed the home over (a deed in lieu). They’re usually sold through a listing agent, with time to inspect. Bank-owned is a way to buy, not a promise of a bargain.',
    weights: {
      goal: { income: 1, growth: 2, quick: 2, handsoff: -1, learn: 1 },
      cash: { under10: -1, '10to50': 2, '50to150': 3, over150: 2 },
      ready: { ready: 0, debt: -3, nofund: -3 },
      borrow: { live: 2, invest: 2, cash: 1, unsure: 1 },
      time: { monthly: -1, weekly: 2, parttime: 2 },
      hands: { diy: 1, hire: 1, none: -1 },
      risk: { low: 2, medium: 2, high: 1 },
      market: { res: 1, com: -1, unsure: 0 },
    },
    risk: {
      worst: 'Repairs cost far more than you planned. These homes are sold as-is, and the seller won’t fix what an inspection finds.',
      atRisk: 'Your down payment or the cash price, the earnest money deposit, and the repairs.',
      ongoing: 'You owe every loan payment, tax and insurance bill even when a unit is empty or repairs run over. If you can’t pay, you can lose the property and the equity in it, so you can lose more than the cash you start with.',
      time: 'Weeks to months, often competing with other buyers’ offers.',
    },
    checklist: [
      { id: 'reo-page', text: 'Read how bank-owned and government homes are sold.', href: '#/bank-owned' },
      { id: 'reo-funds', text: 'Get pre-approved or gather proof of funds before you look.', href: '#/pros/lender' },
      { id: 'reo-agent', text: 'Work with an agent; HUD homes need a HUD-registered broker to bid.', href: '#/pros/agent' },
      { id: 'reo-asis', text: 'Expect as-is sales: the seller usually won’t repair, so inspect within the contract’s inspection period (check the bank’s contract for the deadline).', href: '#/pros/inspector' },
      { id: 'reo-numbers', text: 'Offer from your own numbers, including repairs.', href: '#/analyze' },
      { id: 'reo-title', text: 'Order a title search before closing.', href: '#/pros/title' },
    ],
  },
  {
    key: 'flip',
    title: 'Fix and flip',
    what: 'Buy a home that needs work, renovate it and sell it. Profit depends on the purchase price, repair costs and timing.',
    weights: {
      goal: { income: -1, growth: 0, quick: 4, handsoff: -3, learn: -1 },
      cash: { under10: -3, '10to50': 0, '50to150': 2, over150: 3 },
      ready: { ready: 0, debt: -5, nofund: -5 },
      borrow: { live: -1, invest: 1, cash: 2, unsure: 0 },
      time: { monthly: -3, weekly: 0, parttime: 3 },
      hands: { diy: 3, hire: 1, none: -3 },
      risk: { low: -3, medium: 1, high: 3 },
      market: { res: 1, com: -2, unsure: 0 },
    },
    risk: {
      worst: 'Repairs run over, the market slows, and you sell for less than you put in while paying loan interest every month.',
      atRisk: 'The purchase cash or down payment, the whole repair budget, and months of holding costs.',
      ongoing: 'You owe every loan payment, tax and insurance bill until it sells, even if repairs or the sale run late. If you can’t pay, you can lose the property and the cash you put in.',
      time: 'Months to find a deal, then months of work before you can sell.',
    },
    checklist: [
      { id: 'fl-lessons', text: 'Read the lessons on analyzing a deal and tools of the trade.', href: '#/learn/analyze' },
      { id: 'fl-arv', text: 'Estimate the after-repair value from sold homes already in finished condition; use the 70% rule only as a first screen.' },
      { id: 'fl-rehab', text: 'Learn to estimate repairs, and add a cushion for what you can’t see.', href: '#/learn/reading' },
      { id: 'fl-team', text: 'Line up a qualified contractor (licensed where required), a qualified inspector and an agent before you buy.', href: '#/pros/contractor' },
      { id: 'fl-money', text: 'Arrange financing before you offer, and compare every term of a hard-money loan.', href: '#/learn/financing' },
      { id: 'fl-costs', text: 'Budget buying, holding and selling costs, not just the repairs.', href: '#/analyze?plan=flip' },
      { id: 'fl-permits', text: 'Check permit rules with the city or county building department.' },
      { id: 'fl-practice', text: 'Practice a purchase from start to finish first.', href: '#/practice' },
    ],
  },
  {
    key: 'brrrr',
    title: 'Buy, fix, rent and refinance (BRRRR)',
    what: 'Buy a home that needs work, renovate it, rent it out, then refinance against the higher value to get some of your cash back for the next one.',
    weights: {
      goal: { income: 2, growth: 3, quick: 1, handsoff: -3, learn: -1 },
      cash: { under10: -3, '10to50': -1, '50to150': 3, over150: 2 },
      ready: { ready: 0, debt: -5, nofund: -5 },
      borrow: { live: -1, invest: 2, cash: 2, unsure: -1 },
      time: { monthly: -3, weekly: 1, parttime: 3 },
      hands: { diy: 2, hire: 2, none: -3 },
      risk: { low: -3, medium: 1, high: 3 },
      market: { res: 2, com: -1, unsure: 0 },
    },
    risk: {
      worst: 'Repairs run over or the appraisal comes in low, so the refinance returns less of your cash and it stays stuck in the property.',
      atRisk: 'The purchase price and the whole repair budget until you refinance. Fannie Mae generally needs you on title for 6 months before a cash-out refinance. If you’re paying off a loan you used to buy, such as a hard-money loan, that loan must be at least 12 months old. If you paid all cash, you may refinance sooner, but the new loan can only give back what you paid for the property plus closing costs, not your repair money. Plan to have cash tied up for a year or more.',
      ongoing: 'You owe every loan payment, tax and insurance bill even when a unit is empty or repairs run over. If you can’t pay, you can lose the property and the equity in it, so you can lose more than the cash you start with.',
      time: 'Months to buy and renovate, then months more before you can refinance.',
    },
    checklist: [
      { id: 'br-lessons', text: 'Read the lessons on analyzing a deal and traditional financing.', href: '#/learn/analyze' },
      { id: 'br-refi', text: 'Before you buy, ask a lender what they’ll lend on a cash-out refinance, how long you must own it first, and what they need from the appraisal.', href: '#/pros/lender' },
      { id: 'br-arv', text: 'Estimate the value after repairs from sold homes already in finished condition, and plan for an appraisal that comes in lower.' },
      { id: 'br-rehab', text: 'Get a written bid from a qualified contractor (licensed where required) and add a cushion for what you can’t see.', href: '#/pros/contractor' },
      { id: 'br-rent', text: 'Run the rent calculator at the refinanced loan amount: the rental must still pay for itself.', href: '#/analyze?plan=rent' },
      { id: 'br-reserves', text: 'Keep cash in reserve in case the refinance takes longer or returns less than planned.' },
      { id: 'br-practice', text: 'Practice a purchase first.', href: '#/practice' },
    ],
  },
  {
    key: 'auction',
    title: 'Tax and foreclosure auctions',
    what: 'Buy at county tax sales, trustee auctions or sheriff sales. Prices can be lower, but you usually pay cash, buy as-is and do all the research yourself.',
    weights: {
      goal: { income: 0, growth: 1, quick: 3, handsoff: -3, learn: -1 },
      cash: { under10: -3, '10to50': -1, '50to150': 2, over150: 3 },
      ready: { ready: 0, debt: -5, nofund: -5 },
      borrow: { live: -2, invest: -1, cash: 4, unsure: -1 },
      time: { monthly: -3, weekly: 0, parttime: 3 },
      hands: { diy: 2, hire: 1, none: -3 },
      risk: { low: -4, medium: 0, high: 3 },
      market: { res: 1, com: 0, unsure: 0 },
    },
    risk: {
      worst: 'You pay cash for a property with liens that survive, damage you couldn’t see, or occupants, and there’s usually no refund.',
      atRisk: 'The full price, often due in cash within a day or two, plus any deposit.',
      time: 'Learning a county’s process takes several sales. Some sales are held every month; some tax sales happen only once a year.',
    },
    checklist: [
      { id: 'au-lesson', text: 'Read the lesson on buying at forced sales in your state.', href: '#/learn/forced-sales' },
      { id: 'au-county', text: 'Find your county’s official sale pages: dates, deposit, payment deadline and what the deed promises.', href: '#/find-deals' },
      { id: 'au-cash', text: 'Have the money ready: most auctions want cash or cashier’s checks within a day or two.' },
      { id: 'au-research', text: 'Research every property: title, liens that survive, occupants and any bankruptcy.', href: '#/learn/tools' },
      { id: 'au-max', text: 'Set your maximum bid before the sale and don’t go past it.', href: '#/analyze?plan=flip' },
      { id: 'au-redeem', text: 'Plan for any redemption period and for occupants, who have legal rights.' },
      { id: 'au-practice', text: 'Practice a purchase first.', href: '#/practice' },
      { id: 'au-seller', text: 'Buy only from the official seller. Never contact homeowners facing foreclosure.' },
    ],
  },
  {
    key: 'apartments',
    title: 'Apartments and commercial property',
    what: 'Buy property that’s valued by the income it brings in: apartment buildings, retail, office or industrial, on your own or with partners.',
    weights: {
      goal: { income: 3, growth: 2, quick: 0, handsoff: 1, learn: -1 },
      cash: { under10: -4, '10to50': -2, '50to150': 0, over150: 3 },
      ready: { ready: 0, debt: -4, nofund: -4 },
      borrow: { live: -1, invest: 2, cash: 1, unsure: -1 },
      time: { monthly: -1, weekly: 1, parttime: 2 },
      hands: { diy: 0, hire: 2, none: 0 },
      risk: { low: -1, medium: 1, high: 2 },
      market: { res: -2, com: 5, unsure: 0 },
    },
    risk: {
      worst: 'The income doesn’t cover the loan payment. Commercial loans can come with balloon payments and personal guarantees.',
      atRisk: 'A larger down payment than on a home loan, plus reserves and the cost of inspections and reports.',
      ongoing: 'Every loan payment, tax bill and repair, even when units are empty. A personal guarantee can make you owe more than the property is worth, and a balloon payment can force a sale or refinance at a bad time.',
      time: 'Months: commercial due diligence and loans take longer than for a house.',
    },
    checklist: [
      { id: 'ap-lessons', text: 'Read the lessons on residential vs. commercial and traditional financing.', href: '#/learn/markets' },
      { id: 'ap-noi', text: 'Learn to read rent rolls and operating statements: NOI, cap rate and debt coverage.', href: '#/learn/analyze' },
      { id: 'ap-lender', text: 'Talk with commercial lenders about down payment, DSCR, balloon terms and recourse.', href: '#/pros/lender' },
      { id: 'ap-team', text: 'Build a team: commercial broker, real estate attorney, CPA and property manager.', href: '#/pros' },
      { id: 'ap-partners', text: 'If you’ll raise money from others, learn the securities rules first.', href: '#/learn/creative' },
      { id: 'ap-calc', text: 'Run the numbers in the commercial income calculator.', href: '#/analyze?plan=commercial' },
    ],
  },
  {
    key: 'passive',
    title: 'Hands-off: REITs and real estate funds',
    what: 'Own shares of companies or funds that own real estate, without buying or managing a building yourself.',
    weights: {
      goal: { income: 2, growth: 2, quick: -2, handsoff: 5, learn: 1 },
      cash: { under10: 2, '10to50': 2, '50to150': 1, over150: 1 },
      ready: { ready: 0, debt: -2, nofund: -2 },
      borrow: { live: 0, invest: 0, cash: 1, unsure: 1 },
      time: { monthly: 3, weekly: 1, parttime: 0 },
      hands: { diy: -1, hire: 0, none: 4 },
      risk: { low: 2, medium: 1, high: 0 },
      market: { res: 0, com: 1, unsure: 1 },
    },
    risk: {
      worst: 'Share prices fall, and non-traded REITs and private funds can be hard to sell for years.',
      atRisk: 'Only what you choose to invest; you can start small. You can lose much of it if prices fall.',
      time: 'Days, with listed REIT shares bought through a brokerage account.',
    },
    checklist: [
      { id: 'ps-lesson', text: 'Read the lesson on who invests where, including how REITs work.', href: '#/learn/who' },
      { id: 'ps-reit', text: 'Know the difference. Listed REIT shares can be sold any market day, but their prices can drop sharply. Non-traded REITs are hard to sell, and their upfront fees can reach about 9–10%.' },
      { id: 'ps-private', text: 'Private deals are often limited to accredited investors. Check the sponsor and read every document.', href: '#/learn/creative' },
      { id: 'ps-advisor', text: 'Talk with a licensed financial advisor about how it fits your plan.' },
      { id: 'ps-later', text: 'Keep learning: you can move to owning property directly later.', href: '#/learn' },
    ],
  },
  {
    key: 'practice',
    title: 'Learn first: practice and paper deals',
    what: 'Build knowledge, savings and credit before you buy: take the lessons, practice purchases and analyze real listings on paper.',
    weights: {
      goal: { income: 0, growth: 0, quick: 0, handsoff: 0, learn: 4 },
      cash: { under10: 4, '10to50': 1, '50to150': 0, over150: 0 },
      ready: { ready: 0, debt: 6, nofund: 6 },
      borrow: { live: 0, invest: 0, cash: 0, unsure: 2 },
      time: { monthly: 1, weekly: 2, parttime: 1 },
      hands: { diy: 1, hire: 1, none: 0 },
      risk: { low: 3, medium: 1, high: 0 },
      market: { res: 0, com: 0, unsure: 2 },
    },
    risk: {
      worst: 'Nothing but your time.',
      atRisk: 'None.',
      time: 'You can start today.',
    },
    checklist: [
      { id: 'pr-lessons', text: 'Take the first five lessons.', href: '#/learn' },
      { id: 'pr-practice', text: 'Complete a practice purchase for two kinds of sale.', href: '#/practice' },
      { id: 'pr-paper', text: 'Analyze three real listings on paper with the calculator.', href: '#/analyze' },
      { id: 'pr-credit', text: 'Talk with a loan officer about what you’d qualify for and how to improve it.', href: '#/pros/lender' },
      { id: 'pr-team', text: 'Learn who’s on a deal team and when you need each one.', href: '#/pros' },
      { id: 'pr-again', text: 'Come back to Decide when your savings or goals change.' },
    ],
  },
];

export interface Match {
  strategy: Strategy;
  score: number;
  /** Answers that point toward this strategy. */
  fits: string[];
  /** Answers that point away from it. */
  cautions: string[];
}

/** The answer as it reads mid-sentence: first letter lowercased, except "I". */
function answerText(q: Question, v: string) {
  const t = q.options.find((o) => o.value === v)?.text ?? v;
  return /^I[’ ]/.test(t) ? t : t[0].toLowerCase() + t.slice(1);
}

/** Without savings, or with high-interest debt, the honest answer is "not yet": learning first always ranks on top. */
const notYet = (answers: Answers, m: { strategy: Strategy }) => (m.strategy.key === 'practice' && (answers.ready === 'debt' || answers.ready === 'nofund') ? 1 : 0);

/** Strategies ranked for these answers, best first. */
export function rank(answers: Answers): Match[] {
  return STRATEGIES.map((s) => {
    let score = 0;
    const fits: string[] = [];
    const cautions: string[] = [];
    for (const q of QUESTIONS) {
      if (q.key === 'state') continue;
      const v = answers[q.key];
      const w = v ? (s.weights[q.key]?.[v] ?? 0) : 0;
      score += w;
      if (v && w >= 3) fits.push(`${q.label}: ${answerText(q, v)}`);
      if (v && w <= -2) cautions.push(`${q.label}: ${answerText(q, v)}`);
    }
    return { strategy: s, score, fits, cautions };
  }).sort((a, b) => notYet(answers, b) - notYet(answers, a) || b.score - a.score);
}

/** A state-specific note for a strategy, when the rules differ. */
export function stateNote(key: StrategyKey, state?: string): string | null {
  const st = state as StateCode | undefined;
  if (key === 'auction' && st === 'AZ') return 'In Arizona, counties sell tax liens, not the property: you earn interest until the owner pays, and can seek a deed only after three years. Or, if you or the owner ask and the property is likely to sell for more than $2,500 above what’s owed, the court must order an auction instead, and you’re paid in cash (A.R.S. 42-18204). Separately, the county board of supervisors auctions land the state already took by tax deed (A.R.S. 42-18301 to 42-18303). Competition often bids the rate far below the 16% cap, so expect modest interest, not a property. Trustee auctions sell the property itself.';
  if (key === 'auction' && st === 'CA') return 'In California, winning bids on homes of one to four units aren’t final right away: tenants can match, and other eligible bidders can beat, the winning bid within 15 to 45 days.';
  if (key === 'auction' && st === 'NV') return 'Our step-by-step guides cover each kind of sale in Clark County, Nevada.';
  if (key === 'auction' && st === 'UT') return 'Utah counties hold their tax sale each May or June, four years after the taxes went delinquent.';
  if (key === 'auction' && st === 'TX') return 'Texas counties don’t sell tax liens. A sheriff or constable sells the property itself, usually on the first Tuesday of the month, and the owner can still redeem it for 180 days, or 2 years for a homestead, land designated for agricultural use or a mineral interest, by paying your price and costs plus 25% (or 50% in the second year of a 2-year period). Trustee auctions after a mortgage foreclosure have no redemption; a property tax loan foreclosure does (Tax Code 32.06(k)).';
  if (key === 'rental' && st === 'TX') return 'A rental gets no homestead exemption, so its property tax bill is often much higher than an owner-occupant’s. Check the full tax rate for the address before you run the numbers.';
  if ((key === 'househack' || key === 'rental') && st === 'CA') return 'California limits most rent increases in a 12-month period to 5% plus inflation or 10%, whichever is lower. There are exemptions, so check the rules for your property.';
  return null;
}

export const DECIDE_KEY = 'deedowl.decide.v1';
