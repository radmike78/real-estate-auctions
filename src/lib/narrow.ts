// "Not sure where to start?": a few plain questions at the top of a crowded page that narrow it to two or three
// places to begin, each with the reason. Every page still shows all of its options below. "Not sure" answers get a
// suggestion the visitor can accept.
import type { StateCode } from './regions';
import { drillById } from '../practice/drills';
import { playbookByKey } from './playbooks';

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
        const sales = buy === 'agent' ? ['reo', 'short'] : property === 'land' ? ['tax'] : ['foreclosure', 'tax'];
        const names: Record<string, string> = { reo: 'a bank-owned purchase', short: 'a short sale', foreclosure: 'a foreclosure auction', tax: 'a tax sale' };
        return sales.map((s) => ({ label: `Practice ${names[s]}`, href: `#/practice?sale=${s}`, why: salesFor(buy, property).find((x) => x.kind === s)?.why ?? 'A fictional property, step by step.' }));
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
          { label: 'Bank-owned and government homes', href: '#/bank-owned', why: 'Homes sold by banks, HUD, Fannie Mae and Freddie Mac, usually through an agent.' },
          { label: 'Official sellers across your state and nationwide', scrollTo: 'deals-national', why: 'Federal agencies and the banks that own the homes, on this page.' },
          ...(property === 'home' ? [{ label: 'How short sales work', href: '#/short-sales', why: 'Homes an owner sells with the lender’s approval, listed by an agent.' }] : []),
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
