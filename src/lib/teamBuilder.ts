// "Build your team": a few plain questions (what you're buying, how, how you'll pay, your plan, its condition), then
// only the professionals that fit, each with the reason. "Not sure" answers get a suggestion the visitor can accept.
import type { ProKey } from './proGuide';

export interface TeamQuestion {
  key: keyof TeamAnswers;
  question: string;
  options: { value: string; label: string; hint?: string }[];
  /** What to suggest when the visitor isn't sure, and why. Can depend on earlier answers. */
  suggest: (a: TeamAnswers) => { value: string; why: string };
}

export interface TeamAnswers {
  property?: string;
  buy?: string;
  pay?: string;
  plan?: string;
  condition?: string;
}

export const UNSURE = 'unsure';

export const TEAM_QUESTIONS: TeamQuestion[] = [
  {
    key: 'property',
    question: 'What kind of property do you want to buy?',
    options: [
      { value: 'home', label: 'A house, condo or townhouse' },
      { value: 'small', label: 'A duplex to fourplex', hint: '2 to 4 units' },
      { value: 'manufactured', label: 'A manufactured home' },
      { value: 'apartments', label: 'An apartment building', hint: '5 or more units' },
      { value: 'commercial', label: 'Commercial property', hint: 'Retail, office, industrial' },
      { value: 'land', label: 'Land' },
    ],
    suggest: () => ({ value: 'home', why: 'Most first-time investors start with a house or condo: prices are lower, more lenders will lend, and it’s easier to rent or sell.' }),
  },
  {
    key: 'buy',
    question: 'How do you plan to buy it?',
    options: [
      { value: 'agent', label: 'Through an agent', hint: 'Listed homes, bank-owned homes and short sales' },
      { value: 'auction', label: 'At an auction', hint: 'Tax, foreclosure, sheriff, HOA and IRS sales' },
    ],
    suggest: () => ({ value: 'agent', why: 'Buying through an agent lets you inspect, get an appraisal and back out if something’s wrong. Auctions need cash and more research, with no way out after you win.' }),
  },
  {
    key: 'pay',
    question: 'How will you pay for it?',
    options: [
      { value: 'cash', label: 'Cash' },
      { value: 'loan', label: 'With a loan' },
    ],
    suggest: (a) =>
      a.buy === 'auction'
        ? { value: 'cash', why: 'Most auctions need the full price in cash or certified funds the same day or within days. A loan, if any, comes after.' }
        : { value: 'loan', why: 'Most buyers use a loan. A loan officer can tell you what you’d qualify for before you look.' },
  },
  {
    key: 'plan',
    question: 'What will you do with it?',
    options: [
      { value: 'live', label: 'Live in it', hint: 'Or live in one unit and rent the others' },
      { value: 'rent', label: 'Rent it out' },
      { value: 'flip', label: 'Fix it up and sell it' },
    ],
    suggest: () => ({ value: 'rent', why: 'A rental gives you time: it can pay its costs while you learn. A flip only works if repairs stay on budget and it sells quickly.' }),
  },
  {
    key: 'condition',
    question: 'What condition do you expect it to be in?',
    options: [
      { value: 'ready', label: 'Ready to use' },
      { value: 'cosmetic', label: 'Needs cosmetic work', hint: 'Paint, flooring, fixtures' },
      { value: 'major', label: 'Needs major repairs', hint: 'Roof, systems, structure' },
    ],
    suggest: (a) =>
      a.buy === 'auction'
        ? { value: 'major', why: 'At most auctions you can’t go inside before you bid, so plan as if it needs major repairs.' }
        : { value: 'cosmetic', why: 'Plan for some work: even good homes usually need paint, flooring or small repairs, and the inspection will tell you more.' },
  },
];

/** The answer to use: the visitor's, or the suggestion if they weren't sure. */
export function resolved(a: TeamAnswers): Required<TeamAnswers> {
  const out = {} as Required<TeamAnswers>;
  for (const q of TEAM_QUESTIONS) {
    const v = a[q.key];
    out[q.key] = !v || v === UNSURE ? q.suggest({ ...a, ...out }).value : v;
  }
  return out;
}

/** The team for these answers, in the order you’d usually bring each one in, with the reason. */
export function teamFor(answers: TeamAnswers): { pro: ProKey; why: string }[] {
  const a = resolved(answers);
  const auction = a.buy === 'auction';
  const business = a.property === 'commercial' || a.property === 'apartments';
  const team: { pro: ProKey; why: string }[] = [];
  const add = (pro: ProKey, why: string) => team.push({ pro, why });

  add('agent', auction ? 'To price the property before you bid, and to sell or rent it after.' : business ? 'A commercial broker finds the property, knows local rents and cap rates, and negotiates for you.' : 'Finds the property, writes your offer and negotiates for you.');
  if (a.pay === 'loan') add(auction || a.plan === 'flip' ? 'private_lender' : 'lender', auction ? 'Auctions need cash on the day, so line up a hard-money or bridge loan before, or refinance after.' : a.plan === 'flip' ? 'Fix-and-flip loans are usually short-term loans from private or hard-money lenders.' : 'A pre-approval tells you what you can spend before you make an offer.');
  add('title', auction ? 'A title search before you bid shows which liens stay with the property, and title insurance when it’s available.' : 'Checks the records for liens and handles the closing.');
  add('appraiser', auction ? 'An exterior-only appraisal, or your agent’s estimate, gives you a value to set your maximum bid.' : 'An appraisal is the only way to know what the property is worth.');
  if (auction || business || a.property === 'land') add('attorney', auction ? 'Reviews which liens survive, whether the sale was valid, and any quiet title action.' : a.property === 'land' ? 'Reviews access, easements, zoning and the contract for land.' : 'Reviews leases, the contract and the title for a commercial purchase.');
  if (!auction && a.property !== 'land') add('inspector', a.property === 'manufactured' ? 'Checks the home, its foundation and its HUD labels before you commit.' : 'Examines the condition and writes a report while you can still back out.');
  if (a.property === 'commercial' || a.property === 'land') add('environmental', 'A Phase I environmental assessment before you take title: cleanup can cost more than the price.');
  if (a.condition !== 'ready' || a.plan === 'flip') add('contractor', a.condition === 'major' ? 'Prices the major repairs before you buy and does the work after.' : 'Bids the repairs so your numbers are real.');
  if (auction) add('eviction', 'If anyone still lives there, the law sets how you take possession. You can’t change the locks yourself.');
  add('insurance', 'Coverage from the day you own it, including while it’s empty or being repaired.');
  if (a.plan === 'rent' || business) add('property_manager', 'Finds and screens tenants, collects rent and handles repairs, if you don’t want to do it yourself.');
  if (a.plan !== 'live' || business) add('cpa', a.plan === 'flip' ? 'A flip is taxed differently from a rental. Talk before you buy.' : 'Rental income, depreciation and how you hold the property all affect your taxes.');
  return team;
}
