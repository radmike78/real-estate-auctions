// "Not sure where to start?": a few plain questions at the top of a crowded page that narrow it to two or three
// places to begin, each with the reason. Every page still shows all of its options below. "Not sure" answers get a
// suggestion the visitor can accept.
import type { StateCode } from './regions';
import { drillById } from '../practice/drills';
import { PRACTICE_PROPERTIES } from '../practice/properties';
import { playbookByKey } from './playbooks';
import { LEARN_MODULES } from './learn';

export const NOT_SURE = 'unsure';

export interface NarrowQuestion {
  key: string;
  question: string;
  options: { value: string; label: string; hint?: string }[];
  /** What to suggest when the visitor isn't sure, and why. */
  suggest: (a: Record<string, string>) => { value: string; why: string };
}

export interface NarrowPick {
  label: string;
  why: string;
  href?: string;
  /** An element on the same page to scroll to, instead of a link. */
  scrollTo?: string;
}

export interface NarrowConfig {
  questions: NarrowQuestion[];
  result: (a: Record<string, string>) => NarrowPick[];
}

const STATE_Q: NarrowQuestion = {
  key: 'state',
  question: 'Which state do you want to invest in?',
  options: [
    { value: 'NV', label: 'Nevada' },
    { value: 'CA', label: 'California' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'UT', label: 'Utah' },
    { value: 'TX', label: 'Texas' },
  ],
  suggest: () => ({ value: 'NV', why: 'Start with the state you live in or know best. Nevada has the most live sale data on DeedOwl today.' }),
};

const BUY_Q: NarrowQuestion = {
  key: 'buy',
  question: 'How do you want to buy?',
  options: [
    { value: 'agent', label: 'Through an agent', hint: 'Listed homes, bank-owned homes and short sales' },
    { value: 'auction', label: 'At an auction', hint: 'Tax, foreclosure, sheriff, HOA and IRS sales' },
  ],
  suggest: () => ({ value: 'agent', why: 'Buying through an agent lets you inspect, get an appraisal and back out if something’s wrong. Auctions need cash and more research.' }),
};

const PROPERTY_Q: NarrowQuestion = {
  key: 'property',
  question: 'What kind of property?',
  options: [
    { value: 'home', label: 'A home or small rental', hint: 'House, condo or 2 to 4 units' },
    { value: 'commercial', label: 'Commercial or apartments', hint: 'Retail, office, industrial, 5+ units' },
    { value: 'land', label: 'Land or a manufactured home' },
  ],
  suggest: () => ({ value: 'home', why: 'Most first-time investors start with a home or small rental: lower prices, more lenders, and easier to rent or sell.' }),
};

/** The answer to use: the visitor's, or the suggestion if they weren't sure. */
export function resolveAnswers(c: NarrowConfig, a: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of c.questions) {
    const v = a[q.key];
    out[q.key] = !v || v === NOT_SURE ? q.suggest({ ...a, ...out }).value : v;
  }
  return out;
}

/** Step-by-step guide keys by state and kind of sale. */
const GUIDE: Record<StateCode, Record<string, string>> = {
  NV: { tax: 'tax', foreclosure: 'foreclosure', sheriff: 'sheriff', hoa: 'hoa', reo: 'reo', short: 'short', commercial: 'commercial', irs: 'irs' },
  CA: { tax: 'catax', foreclosure: 'caforeclosure', sheriff: 'casheriff', hoa: 'cahoa', reo: 'careo', short: 'cashort', commercial: 'cacommercial', irs: 'cairs' },
  AZ: { tax: 'aztaxlien', foreclosure: 'azforeclosure', sheriff: 'azsheriff', hoa: 'azhoa', reo: 'azreo', short: 'azshort', commercial: 'azcommercial', irs: 'azirs' },
  UT: { tax: 'uttax', foreclosure: 'utforeclosure', sheriff: 'utsheriff', hoa: 'uthoa', reo: 'utreo', short: 'utshort', commercial: 'utcommercial', irs: 'utirs' },
  TX: { tax: 'txtax', foreclosure: 'txforeclosure', sheriff: 'txsheriff', hoa: 'txhoa', reo: 'txreo', short: 'txshort', commercial: 'txcommercial', irs: 'txirs' },
};
export const guideKey = (st: string, kind: string) => GUIDE[(st as StateCode) in GUIDE ? (st as StateCode) : 'NV'][kind];

/** Which kinds of sale fit how and what someone wants to buy. */
function salesFor(buy: string, property: string): { kind: string; why: string }[] {
  if (buy === 'agent') {
    if (property === 'commercial') return [{ kind: 'commercial', why: 'Due diligence, leases and environmental checks for commercial property.' }, { kind: 'reo', why: 'Banks sell commercial property they own, too.' }];
    return [
      { kind: 'reo', why: 'Bank-owned homes: a normal purchase through an agent, usually as-is, with time to inspect.' },
      { kind: 'short', why: 'Short sales: the owner sells with the lender’s approval. Slower, but you can inspect.' },
    ];
  }
  if (property === 'land') return [{ kind: 'tax', why: 'Most land at auction is sold at county tax sales.' }];
  if (property === 'commercial') return [{ kind: 'commercial', why: 'What to check before buying commercial property at any sale.' }, { kind: 'foreclosure', why: 'Commercial buildings often sell at foreclosure auctions.' }];
  return [
    { kind: 'foreclosure', why: 'Foreclosure auctions are the most common, and they happen most weeks.' },
    { kind: 'tax', why: 'Tax sales come once or twice a year in most counties, with their own rules.' },
  ];
}

/** Practice: a whole purchase or quick drills, for the way and the property they want. */
export function practiceConfig(myState: string | null): NarrowConfig {
  return {
    questions: [
      ...(myState ? [] : [STATE_Q]),
      {
        key: 'what',
        question: 'What would help most right now?',
        options: [
          { value: 'full', label: 'Walk through a whole purchase', hint: 'Step by step, from research to the day after the sale' },
          { value: 'quick', label: 'Practice quick decisions', hint: 'Value, rent, repairs and liens on one property' },
        ],
        suggest: () => ({ value: 'full', why: 'Walking through one whole purchase shows every step once. Then the drills sharpen your judgment.' }),
      },
      BUY_Q,
      { ...PROPERTY_Q, options: [...PROPERTY_Q.options, { value: 'flip', label: 'A fix-and-flip or BRRRR' }] },
    ],
    result: (raw) => {
      const st = (raw.state || myState || 'NV').toLowerCase();
      const { what, buy, property } = raw;
      if (what === 'full') {
        // One named practice property to start with, then other ways in. Practice follows Nevada (Clark County) rules.
        const names: Record<string, string> = { reo: 'bank-owned', short: 'short sale', foreclosure: 'foreclosure auction', tax: 'tax sale' };
        const run = (sale: string, prop: string, why: string): NarrowPick => {
          const label = PRACTICE_PROPERTIES.find((p) => p.id === prop)?.label.toLowerCase() ?? prop;
          return { label: `Buy the practice ${label}: ${names[sale]}`, href: `#/practice/${sale}-${prop}`, why: `${why} A fictional Nevada property, step by step.` };
        };
        const drill = (id: string, why: string): NarrowPick => ({ label: drillById(id)?.title ?? id, href: `#/practice/drills/${id}`, why });
        const prop = property === 'commercial' ? 'retail' : property === 'land' ? 'lot' : 'house';
        const why = (k: string) => salesFor(buy, property).find((x) => x.kind === k)?.why ?? '';
        if (buy === 'agent') {
          if (property === 'commercial') return [run('reo', prop, why('reo')), drill('retail-strip', 'Then a quick decision on a small retail building’s leases and income.')];
          // A home from a listing: the full rental purchase comes first (the page's "Start here"), in Texas rules for
          // Texas and Nevada rules everywhere else.
          if (prop === 'house') {
            const caseState = st === 'tx' ? 'Texas' : 'Nevada';
            return [
              { label: 'Buy a rental, start to finish', href: '#/practice/case', why: `The most common first deal: a listed home with a loan, from the offer to the first tenant. It follows ${caseState} rules.` },
              drill('rental-265', 'Then a quick one: is a rental worth it at this price?'),
              run('reo', prop, why('reo')),
            ];
          }
          return [run('reo', prop, why('reo')), drill('land-access', 'Then a quick one on access, utilities and holding costs.')];
        }
        if (property === 'land') return [run('tax', prop, why('tax')), drill('land-access', 'Then a quick one on access, utilities and holding costs.')];
        return [run('foreclosure', prop, why('foreclosure') || 'Foreclosure auctions happen most weeks.'), run('tax', prop, 'Tax sales come once or twice a year in most counties, with their own rules.')];
      }
      const drills: Record<string, [string, string][]> = {
        'agent-home': [['bank-owned', 'A bank-owned home: inspection, repairs and the as-is contract.'], ['rental-265', 'Is a rental worth it at this price? Comps, rent, repairs and cash flow.']],
        'auction-home': [[`trustee-sale-${st}`, 'A foreclosure auction in your state: liens, occupants and the numbers.'], [st === 'az' ? 'tax-lien-az' : st === 'ut' ? 'tax-sale-ut' : `tax-deed-${st}`, 'A tax sale in your state: what you get and what survives.']],
        'agent-commercial': [['retail-strip', 'A small retail building: leases, income and value.'], ['apartments-12', 'A 12-unit building: rent roll, expenses and the loan.']],
        'auction-commercial': [['commercial-tax-sale', 'A vacant building at a tax sale: research and your maximum bid.'], ['commercial-bank-auction', 'A bank auction with a buyer’s premium: your real last bid.']],
        land: [['land-access', 'Rural land: access, utilities and holding costs.'], ['manufactured-own-land', 'A manufactured home on its own land: title, comps and repairs.']],
        flip: [['flip-numbers', 'A fix-and-flip: is there really a profit after every cost?'], ['brrrr-appraisal', 'A BRRRR where the appraisal comes in low.']],
      };
      const key = property === 'flip' ? 'flip' : property === 'land' ? 'land' : `${buy}-${property}`;
      return (drills[key] ?? drills['agent-home']).map(([id, why]) => ({ label: drillById(id)?.title ?? id, href: `#/practice/drills/${id}`, why }));
    },
  };
}

/** Find Deals: where to look first, for the way and the property they want. */
export function findDealsConfig(): NarrowConfig {
  return {
    questions: [BUY_Q, PROPERTY_Q],
    result: ({ buy, property }) => {
      if (buy === 'agent') {
        return [
          { label: 'A buyer’s agent and an MLS search', href: '#/pros/agent', why: 'Most rentals are bought as regular listings. A buyer’s agent can set up an MLS search that matches your buy box, and you can inspect and back out if something’s wrong.' },
          { label: 'Bank-owned and government homes', href: '#/bank-owned', why: 'Homes sold by banks, HUD, Fannie Mae and Freddie Mac, usually through an agent.' },
          property === 'home'
            ? { label: 'How short sales work', href: '#/short-sales', why: 'Homes an owner sells with the lender’s approval, listed by an agent.' }
            : { label: 'Official sellers across your state and nationwide', scrollTo: 'deals-national', why: 'Federal agencies and the banks that own the homes, on this page.' },
        ];
      }
      return [
        { label: 'Your county’s sale offices', scrollTo: 'deals-county', why: property === 'land' ? 'County tax sales are where most land is auctioned.' : 'The county’s own pages for tax sales, records and sheriff’s sales, on this page.' },
        { label: 'How sales work in your state', scrollTo: 'deals-rules', why: 'Who runs each kind of auction and what to check first.' },
      ];
    },
  };
}

/** Sale guides: which guides to read first. */
export function guidesConfig(myState: string | null): NarrowConfig {
  return {
    questions: [...(myState ? [] : [STATE_Q]), BUY_Q, PROPERTY_Q],
    result: (raw) => {
      const st = raw.state || myState || 'NV';
      return salesFor(raw.buy, raw.property).map((s) => ({ label: playbookByKey(guideKey(st, s.kind))?.title ?? s.kind, href: `#/playbooks/${guideKey(st, s.kind)}`, why: s.why }));
    },
  };
}

/** Learn: which two or three lessons to read first, for what someone wants to do and how much they know. */
export function learnConfig(): NarrowConfig {
  const lesson = (key: string, why: string): NarrowPick => ({ label: LEARN_MODULES.find((m) => m.key === key)?.title ?? key, href: `#/learn/${key}`, why });
  return {
    questions: [
      {
        key: 'goal',
        question: 'What do you want to do first?',
        options: [
          { value: 'rental', label: 'Buy a rental' },
          { value: 'flip', label: 'Fix and sell (a flip)' },
          { value: 'auction', label: 'Bid at auctions' },
          { value: 'commercial', label: 'Buy commercial property' },
        ],
        suggest: () => ({ value: 'rental', why: 'A rental bought through an agent is the most common first deal: you can inspect it, get a loan and learn as you go.' }),
      },
      {
        key: 'know',
        question: 'How much do you know already?',
        options: [
          { value: 'new', label: 'I’m new to this' },
          { value: 'some', label: 'I know the basics' },
        ],
        suggest: () => ({ value: 'new', why: 'Starting with the basics takes a few minutes and makes every later lesson easier.' }),
      },
    ],
    result: ({ goal, know }) => {
      const basics = lesson('markets', 'The two markets, who buys in each, and how prices are set: the base for everything else.');
      const numbers = lesson('analyze', 'How to run the numbers on a property and find the price that still works.');
      if (goal === 'commercial') return [know === 'new' ? basics : lesson('types', 'What each kind of commercial property earns and where it goes wrong.'), numbers, lesson('financing', 'How commercial loans differ: bigger down payments, income-based approval and shorter terms.')];
      if (goal === 'auction') return [...(know === 'new' ? [basics] : []), lesson('forced-sales', 'How each kind of auction works in your state, and what survives the sale.'), numbers, ...(know === 'new' ? [] : [lesson('walk-away', 'The warning signs that should stop a bid.')])];
      if (goal === 'flip') return [...(know === 'new' ? [basics] : []), numbers, lesson('walk-away', 'When the profit isn’t there after every cost, and how to walk away in time.'), ...(know === 'new' ? [] : [lesson('financing', 'Hard money and other short-term loans for a flip.')])];
      return [...(know === 'new' ? [basics] : []), numbers, lesson('financing', 'Loans for a rental: what lenders ask for and how much cash you need.'), ...(know === 'new' ? [] : [lesson('after-closing', 'Running the rental: tenants, deposits, records and taxes.')])];
    },
  };
}

/** My plan: which part of the page to use first, for where someone is right now. */
export function toolkitConfig(): NarrowConfig {
  return {
    questions: [
      {
        key: 'stage',
        question: 'Where are you right now?',
        options: [
          { value: 'start', label: 'Just starting', hint: 'No property in mind yet' },
          { value: 'looking', label: 'Looking at a property' },
          { value: 'offer', label: 'Making an offer or bidding soon' },
          { value: 'bought', label: 'Just bought one' },
        ],
        suggest: () => ({ value: 'start', why: 'Knowing your cash and what you’re looking for first keeps you from chasing deals that don’t fit.' }),
      },
    ],
    result: ({ stage }) => {
      if (stage === 'looking') return [
        { label: 'Analyze the property', href: '#/analyze', why: 'Run the numbers and get a walk-away price before you get attached.' },
        { label: 'Check it against your buy box', scrollTo: 'buy-box', why: 'Does it fit the price, area and kind of property you chose?' },
        { label: 'Your team', scrollTo: 'team', why: 'Who to call now: an agent, a lender, an inspector.' },
      ];
      if (stage === 'offer') return [
        { label: 'Read the paperwork', scrollTo: 'paperwork', why: 'The contract, the loan estimate and the title commitment, part by part, with the deadlines that matter.' },
        { label: 'Your team', scrollTo: 'team', why: 'Line up the lender, inspector, title company and insurance agent before the deadlines start.' },
        { label: 'Where you are on the roadmap', scrollTo: 'roadmap', why: 'The steps from offer to closing, and what “done” looks like for each.' },
      ];
      if (stage === 'bought') return [
        { label: 'After you close', href: '#/learn/after-closing', why: 'Insurance, the first tenant, deposits, records and taxes.' },
        { label: 'Worksheets to download', scrollTo: 'worksheets', why: 'Records you’ll want from day one.' },
        { label: 'Your roadmap', scrollTo: 'roadmap', why: 'The last steps: owning it, and what comes next.' },
      ];
      return [
        { label: 'Your investable cash', scrollTo: 'cash', why: 'What you can put in without touching your emergency money, and the price that supports.' },
        { label: 'Your buy box', scrollTo: 'buy-box', why: 'The price, area and kind of property you’re looking for, so you can say no fast.' },
        { label: 'Your investing roadmap', scrollTo: 'roadmap', why: 'Every step from here to owning it, in order.' },
      ];
    },
  };
}
