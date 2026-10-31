// "Not sure where to start?": a few plain questions at the top of a crowded page that narrow it to two or three
// places to begin, each with the reason. Every page still shows all of its options below. "Not sure" answers get a
// suggestion the visitor can accept.
import type { StateCode } from './regions';
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
  suggest: () => ({ value: 'NV', why: 'Nevada’s guides are the original set and cover the most kinds of sales. If you live in another of our states, its guides cover its own sales.' }),
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
  if (property === 'land') return [{ kind: 'tax', why: 'Most land at auction is sold at county tax sales.' }, { kind: 'foreclosure', why: 'Land with a loan against it can also sell at a foreclosure auction, under the same rules as a house.' }];
  if (property === 'commercial') return [{ kind: 'commercial', why: 'What to check before buying commercial property at any sale.' }, { kind: 'foreclosure', why: 'Commercial buildings often sell at foreclosure auctions.' }];
  return [
    { kind: 'foreclosure', why: 'Foreclosure auctions are the most common, and they happen most weeks.' },
    { kind: 'tax', why: 'Tax sales come once or twice a year in most counties, with their own rules.' },
  ];
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
      // New readers start with how their strategy makes money (Learn's first block), then the numbered lessons.
      const way = (slug: string, title: string) => ({ label: title, href: `#/learn/strategies/${slug}`, why: 'How this strategy makes money, what it takes and what goes wrong: the frame for every lesson after it.' });
      const basics = goal === 'commercial' ? lesson('markets', 'How commercial property differs from homes: who buys, how prices are set, loans and leases.') : goal === 'auction' ? way('auctions', 'Tax and foreclosure auctions') : goal === 'flip' ? way('fix-and-flip', 'Fix and flip') : way('buy-and-hold', 'Buy and hold a rental');
      const numbers = lesson('analyze', 'How to run the numbers on a property and find the price that still works.');
      if (goal === 'commercial') return [know === 'new' ? basics : lesson('types', 'What each kind of commercial property earns and where it goes wrong.'), numbers, lesson('financing', 'How commercial loans differ: bigger down payments, income-based approval and shorter terms.')];
      if (goal === 'auction') return [...(know === 'new' ? [basics] : []), lesson('forced-sales', 'How each kind of auction works in your state, and what survives the sale.'), numbers, ...(know === 'new' ? [] : [lesson('walk-away', 'The warning signs that should stop a bid.')])];
      if (goal === 'flip') return [...(know === 'new' ? [basics] : []), numbers, lesson('walk-away', 'When the profit isn’t there after every cost, and how to walk away in time.'), ...(know === 'new' ? [] : [lesson('financing', 'Hard money and other short-term loans for a flip.')])];
      return [...(know === 'new' ? [basics] : []), numbers, lesson('financing', 'Loans for a rental: what lenders ask for and how much cash you need.'), ...(know === 'new' ? [] : [lesson('after-closing', 'Running the rental: tenants, deposits, records and taxes.')])];
    },
  };
}

/** My plan: which part of the page to use first, for where someone is right now. */
export function toolkitConfig(next?: { label: string; href: string }): NarrowConfig {
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
      // "Just starting" leads with the same next step as the Next box beside it, so the page gives one first step.
      return [
        ...(next ? [{ label: `Your next step: ${next.label}`, href: next.href, why: 'The same next step as “Your next step” on this page, in the site’s order: decide, learn, practice, then line up your team.' }] : []),
        { label: 'Your investable cash', scrollTo: 'cash', why: 'What you can put in without touching your emergency money, and the price that supports.' },
        { label: 'Your buy box', scrollTo: 'buy-box', why: 'The price, area and kind of property you’re looking for, so you can say no fast.' },
        { label: 'Your investing roadmap', scrollTo: 'roadmap', why: 'Every step from here to owning it, in order.' },
      ].slice(0, 3);
    },
  };
}

/** Practice: where to start among the practice deal, the full purchase, auction practice and the drills. */
export function practiceConfig(auctionPracticeHere: boolean): NarrowConfig {
  return {
    questions: [
      {
        key: 'started',
        question: 'Have you worked through practice part 1, Cedar House (the decisions)?',
        options: [
          { value: 'no', label: 'Not yet' },
          { value: 'yes', label: 'Yes, or most of it' },
        ],
        suggest: () => ({ value: 'no', why: 'Start there: it’s one short decision at a time, and it teaches the checks that Part 2 and the drills use.' }),
      },
      BUY_Q,
    ],
    result: ({ started, buy }) => {
      const picks: NarrowPick[] = [];
      if (started !== 'yes') picks.push({ label: 'Practice part 1: Cedar House', href: '#/practice/deal', why: 'Short decisions on one fictional rental, from the ad’s rent claim to your first month as an owner.' });
      if (buy === 'auction') {
        picks.push(auctionPracticeHere
          ? { label: 'Auction practice', scrollTo: 'practice-auction', why: 'Buy a fictional property at one kind of sale, step by step, from research to the day after.' }
          : { label: 'Your state’s sale guides', href: '#/playbooks', why: 'Your state’s guides show how its own sales work, step by step; the auction drills below practice the decisions.' });
      } else {
        picks.push({ label: 'Practice part 2: Buy a rental', scrollTo: 'practice-case', why: 'About 45 minutes. The paperwork and calls of a purchase through an agent, with a deal packet at the end.' });
      }
      picks.push({ label: 'Quick drills', scrollTo: 'practice-drills', why: 'One short made-up deal each: value it, check the rent, find the liens, then decide Buy, Investigate or Pass.' });
      return picks.slice(0, 3);
    },
  };
}
