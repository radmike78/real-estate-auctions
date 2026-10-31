// Learn: the lessons, in the order to take them. Lessons still being written show "Coming soon".

export interface LearnModule {
  key: string;
  title: string;
  summary: string;
  /** A page that's ready now; without it the module shows "Coming soon". */
  href?: string;
}

/** Learning paths: the lessons in order, grouped under the question each group answers. */
// The order: what you could buy and how to avoid costly pitches; how to research and run the numbers; how to pay
// for it; how to buy (walk away, offer and close, forced sales); after you own it; then deeper topics.
export const LEARN_PATHS: { title: string; what: string; keys: string[] }[] = [
  { title: 'Start here', what: 'The kinds of property, and the seminar pitches to recognize before you spend money on training.', keys: ['types', 'red-flags'] },
  { title: 'Is it a deal?', what: 'The research tools, then running the numbers.', keys: ['tools', 'analyze'] },
  { title: 'Paying for it', what: 'Loans and creative financing.', keys: ['financing', 'creative'] },
  { title: 'Buying it', what: 'When to walk away, making an offer and closing, and how forced sales work in your state.', keys: ['walk-away', 'negotiate', 'forced-sales'] },
  { title: 'After you buy', what: 'Running a rental, and the taxes from purchase to sale.', keys: ['after-closing', 'taxes'] },
  { title: 'Go further', what: 'Commercial property, who invests where, holding title and LLCs, benefits for veterans, and the books we recommend.', keys: ['markets', 'who', 'structuring', 'veterans', 'reading'] },
];

export const LEARN_MODULES: LearnModule[] = [
  { key: 'types', title: 'Types of property', summary: 'Houses, condos, small and large apartment buildings, retail, office, industrial and land.' },
  { key: 'red-flags', title: 'Seminar red flags', summary: 'How seminar and coaching scams work, the warning signs regulators found, and how to evaluate financing without sales pressure.' },
  { key: 'tools', title: 'Tools and tricks of the trade', summary: 'Records, maps, comps and checklists investors use to research a property.' },
  { key: 'analyze', title: 'Analyzing a deal', summary: 'Value, repairs, rents, expenses and returns: the numbers that decide whether a deal works.' },
  { key: 'financing', title: 'Traditional financing', summary: 'Mortgages, commercial loans, hard-money and bridge loans: how each works and what it costs.' },
  { key: 'creative', title: 'Creative financing', summary: 'Seller financing, partnerships and other structures, with the legal risks to know first.' },
  { key: 'walk-away', title: 'When to walk away', summary: 'The numbers, building problems, title and HOA issues and auction terms that should make you pass on a deal.' },
  { key: 'negotiate', title: 'Making an offer and closing', summary: 'Who your agent works for, what goes into an offer, negotiating after the inspection, and the steps from an accepted offer to the keys.' },
  { key: 'forced-sales', title: 'Buying at forced sales', summary: 'Tax, foreclosure, sheriff and IRS sales across Nevada, California, Arizona, Utah and Texas, with step-by-step guides.' },
  { key: 'after-closing', title: 'Running a rental', summary: 'The first weeks, tenant screening and fair housing, deposits, entry and rent rules in your state, and records for taxes.' },
  { key: 'taxes', title: 'Taxes from purchase to sale', summary: 'Transfer and property tax, rental income and depreciation, how flips are taxed, selling, 1031 exchanges and each state’s income tax.' },
  { key: 'markets', title: 'Residential vs. commercial', summary: 'How the two markets differ: who buys, how prices are set, loans, leases and risk.' },
  { key: 'who', title: 'Who invests where, and why', summary: 'The kinds of investors in each market, and why someone picks one property type over another.' },
  { key: 'structuring', title: 'Holding title and structuring deals', summary: 'Ways to hold title, owning through an LLC, 1031 exchanges, installment sales and seller credits.' },
  { key: 'veterans', title: 'Benefits for veterans', summary: 'VA loans, the funding fee exemption, servicemember protections, and veteran property tax breaks in your state.' },
  { key: 'reading', title: 'Recommended reading', summary: 'Books worth reading, picked for new investors.', href: '#/learn/reading' },
];
