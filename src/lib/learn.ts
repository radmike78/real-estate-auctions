// Learn: the lessons, in the order to take them. Lessons still being written show "Coming soon".

export interface LearnModule {
  key: string;
  title: string;
  summary: string;
  /** A page that's ready now; without it the module shows "Coming soon". */
  href?: string;
}

export const LEARN_MODULES: LearnModule[] = [
  { key: 'markets', title: 'Residential vs. commercial', summary: 'How the two markets differ: who buys, how prices are set, loans, leases and risk.' },
  { key: 'types', title: 'Types of property', summary: 'Houses, condos, small and large apartment buildings, retail, office, industrial and land.' },
  { key: 'who', title: 'Who invests where, and why', summary: 'The kinds of investors in each market, and why someone picks one property type over another.' },
  { key: 'analyze', title: 'Analyzing a deal', summary: 'Value, repairs, rents, expenses and returns: the numbers that decide whether a deal works.' },
  { key: 'walk-away', title: 'When to walk away', summary: 'The numbers, building problems, title and HOA issues and auction terms that should make you pass on a deal.' },
  { key: 'negotiate', title: 'Negotiating and structuring deals', summary: 'Making offers, negotiating terms, and putting a deal together when you can.' },
  { key: 'financing', title: 'Traditional financing', summary: 'Mortgages, commercial loans, hard-money and bridge loans: how each works and what it costs.' },
  { key: 'creative', title: 'Creative financing', summary: 'Seller financing, partnerships and other structures, with the legal risks to know first.' },
  { key: 'red-flags', title: 'Seminar red flags', summary: 'How seminar and coaching scams work, the warning signs regulators found, and why you should never borrow to learn or to bid.' },
  { key: 'tools', title: 'Tools and tricks of the trade', summary: 'Records, maps, comps and checklists investors use to research a property.' },
  { key: 'forced-sales', title: 'Buying at forced sales', summary: 'Tax, foreclosure, sheriff and IRS sales across Nevada, California, Arizona and Utah, with step-by-step guides.' },
  { key: 'after-closing', title: 'After you buy: running a rental', summary: 'The first weeks, tenant screening and fair housing, deposits, entry and rent rules in your state, and records for taxes.' },
  { key: 'veterans', title: 'Benefits for veterans', summary: 'VA loans, the funding fee exemption, servicemember protections, and veteran property tax breaks in your state.' },
  { key: 'reading', title: 'Recommended reading', summary: 'Books worth reading, picked for new investors.', href: '#/learn/reading' },
];
