// Hands-on practice: walk through buying a fictional property, one kind of sale at a time.
//
// ACCURACY RULES for this file (checked in practice.test.ts):
//  - Rules, deadlines and legal effects come from the reviewed playbooks and buyer checklists
//    (src/lib/playbooks.ts, src/lib/buyerChecklists.ts), which cite the NRS, federal law and the
//    county's own pages. Where this file quotes them, it reads them from there, so there is one
//    source of truth. New sentences here only restate those facts.
//  - Simulated replies speak for a fictional professional, never for a government office, and never
//    promise an outcome the law doesn't. Anything that varies ("each notice sets its own terms") says so.
//  - Every number is a practice number. The max-bid math uses the same calculator as the real tool.

import { maxSafeBid, BLANK_INPUTS, type BidInputs } from '../lib/bidCalc';
import { CHECKLISTS, forCommercial, type BuyerChecklist } from '../lib/buyerChecklists';
import { playbookByKey, type Playbook } from '../lib/playbooks';
import { fmtMoney } from '../lib/status';
import { incomeValue, PRACTICE_PROPERTIES, type PracticeProperty } from './properties';
import type { Choice, SaleKey, Scenario, Stage, Task } from './types';

const money = (n: number) => fmtMoney(n);
const roundTo = (n: number, to: number) => Math.round(n / to) * to;
const hasTenants = (p: PracticeProperty) => p.occupancy === 'Tenants';
const commercial = (p: PracticeProperty) => p.cls === 'commercial';
const environmentalRisk = (p: PracticeProperty) => ['retail', 'industrial', 'commercial-lot'].includes(p.id);

// ---------- fictional people (every name and company is made up) ----------
const PEOPLE = {
  title: { role: 'Title officer', person: 'Morgan Lee, Sample Title Co. (fictional)' },
  attorney: { role: 'Real estate attorney', person: 'Priya Shah, Example Law Group (fictional)' },
  hardMoney: { role: 'Hard-money lender', person: 'Chris Park, Practice Capital (fictional)' },
  loanOfficer: { role: 'Loan officer', person: 'Jordan Reyes, Sample Home Loans (fictional)' },
  agent: { role: 'Buyer’s agent', person: 'Taylor Brooks, Example Realty (fictional)' },
  listingAgent: { role: 'Listing agent', person: 'Robin Hale, Practice Realty (fictional)' },
  commercialBroker: { role: 'Commercial broker', person: 'Sam Ortiz, Sample Commercial Advisors (fictional)' },
  commercialLender: { role: 'Commercial / bridge lender', person: 'Avery Chen, Example Commercial Capital (fictional)' },
  environmental: { role: 'Environmental consultant', person: 'Riley Novak, Practice Environmental (fictional)' },
  insurance: { role: 'Insurance agent', person: 'Casey Morgan, Sample Insurance (fictional)' },
  contractor: { role: 'Licensed contractor', person: 'Jamie Ruiz, Example Builders (fictional)' },
  propertyManager: { role: 'Property manager', person: 'Drew Patel, Sample Property Management (fictional)' },
  cpa: { role: 'CPA', person: 'Alex Kim, CPA, Example Tax Advisors (fictional)' },
  trustee: { role: 'Foreclosure trustee', person: 'Sample Trustee Services (fictional)' },
  hoaAgent: { role: 'HOA’s foreclosure agent', person: 'Example HOA Collections (fictional)' },
  irs: { role: 'IRS property specialist named in the notice', person: 'Practice contact (fictional)' },
} as const;

type Person = (typeof PEOPLE)[keyof typeof PEOPLE];
const contact = (id: string, who: Person, why: string, messages: { label: string; send: string; reply: string }[]): Task => ({
  kind: 'contact',
  id,
  role: who.role,
  person: who.person,
  why,
  messages,
});

// ---------- reusable pieces ----------

const insuranceContact = (p: PracticeProperty): Task =>
  contact('insurance', PEOPLE.insurance, 'Coverage has to start the day you own it.', [
    {
      label: 'Ask about coverage from day one',
      send: `Hi Casey, I may buy ${p.address} at a forced sale. It may be ${p.hasBuilding ? (p.occupancy === 'Vacant' ? 'vacant' : 'occupied') : 'bare land'}. What would I need to have coverage the day I take ownership?`,
      reply: p.hasBuilding
        ? `Happy to help. We can have a quote ready before the sale and bind the policy the day you own it. Tell me right away if it's vacant: ${commercial(p) ? 'a vacant commercial building needs a specific policy' : 'vacant homes need a vacant-property policy'}, and a standard policy may not cover it. Send me the parcel number, the sale date and what you plan to do with it. (Simulated reply.)`
        : 'For bare land, ask about general liability coverage. People get hurt on vacant lots too. Send me the parcel number and the sale date and I’ll quote it. (Simulated reply.)',
    },
  ]);

const contractorContact = (p: PracticeProperty, noEntry: boolean): Task =>
  contact('contractor', PEOPLE.contractor, 'A repair budget from what you can see.', [
    {
      label: 'Ask for a rough repair budget',
      send: `Hi Jamie, can you help me estimate repairs on ${p.address}? ${noEntry ? 'It’s a forced sale, so there’s no inside access before I buy.' : 'I can get you inside during my inspection period.'}`,
      reply: noEntry
        ? `I can look from the street and give you a range, but without seeing inside I'd add a cushion for surprises (roof, plumbing, electrical). Don't go onto the property before you own it. Once you have the keys, I'll do a full walk-through and a written scope. (Simulated reply.)`
        : 'Yes. Book me during your inspection period and I’ll go through it with the inspector’s report, then give you a written scope and price. (Simulated reply.)',
    },
  ]);

/** Commercial extras for any sale: broker, environmental, manager, and income value. */
function commercialResearch(p: PracticeProperty, sale: SaleKey): Task[] {
  const list = CHECKLISTS.commercial;
  const tasks: Task[] = [{ kind: 'checklist', id: 'commercial-checks', title: list.title, intro: list.intro, items: list.items }];
  if (p.income) {
    const iv = incomeValue(p.income);
    tasks.push({
      kind: 'read',
      id: 'income-value',
      title: 'Value it by income, not like a house',
      body: [
        `Practice numbers for ${p.income.units}: scheduled rent ${money(p.income.grossRent)} a year, ${p.income.vacancyPct}% vacancy, operating costs ${money(p.income.operatingExpenses)} a year.`,
        `Net operating income: ${money(iv.effective)} collected − ${money(p.income.operatingExpenses)} costs = ${money(iv.noi)}.`,
        `At a ${p.income.capRatePct}% cap rate (a practice rate; ask a commercial broker for current rates for this type of property): ${money(iv.noi)} ÷ ${p.income.capRatePct / 100} ≈ ${money(iv.value)}.`,
        sale === 'reo' ? 'A receiver or listing broker can usually give you the rent roll and leases.' : 'At an auction you usually can’t get the rent roll and leases, so check how the value holds up if some tenants leave.',
      ],
    });
  }
  if (environmentalRisk(p)) {
    tasks.push({
      kind: 'decision',
      id: 'environmental',
      title: 'Past use',
      question: `${p.watchOut} What do you do first?`,
      choices: [
        { label: 'Check EPA and state records for the address, and order a Phase I environmental assessment if time allows', correct: true, feedback: 'Right. Past uses can mean cleanup costs bigger than the price, and cleanup liability follows the owner, not the lien. A Phase I done within the time limits, plus meeting ongoing duties after you buy, can protect you from federal cleanup liability.' },
        { label: 'Skip it: the sale price is low enough to cover any problem', correct: false, feedback: 'Risky. In the guide’s example, soil contamination from a former dry cleaner cost more to clean up than the purchase price. Check the records first.' },
      ],
    });
  }
  if (p.id === 'motel') {
    tasks.push({
      kind: 'read',
      id: 'motel-business',
      title: 'A motel is a building and a business',
      body: [
        'Confirm exactly what the sale includes. The real property may be sold without the furniture, the business name or the booking accounts.',
        'Business, health and other licenses don’t transfer with the property. Apply in your own name before you reopen.',
        'Guests and a live-in manager may be there on sale day. Have an attorney plan how you take possession.',
      ],
    });
  }
  return tasks;
}

const commercialTeam = (p: PracticeProperty): Task[] => [
  contact('commercial-broker', PEOPLE.commercialBroker, 'Current rents and cap rates, and leasing it up after.', [
    {
      label: 'Ask for rents and a cap rate',
      send: `Hi Sam, I'm looking at ${p.address} (${p.label.toLowerCase()}). What are similar buildings renting for, and what cap rates are buyers paying for this type of property right now?`,
      reply: `I can pull recent leases and sales for similar ${p.type === 'Commercial Land' ? 'land' : 'buildings'} nearby and send you a range. Cap rates move with interest rates and the building's condition, so use my numbers as a starting point and check them against the actual rent roll if you can get it. (Simulated reply.)`,
    },
  ]),
  ...(environmentalRisk(p)
    ? [
        contact('environmental', PEOPLE.environmental, 'A Phase I environmental site assessment.', [
          {
            label: 'Ask for a Phase I',
            send: `Hi Riley, I need a Phase I environmental site assessment on ${p.address}. ${p.watchOut ?? ''} The sale is coming up soon. Can you do it in time?`,
            reply: 'We follow ASTM E1527-21. It covers a records search, a site visit and interviews. For the liability protection, the report has to be done within one year before you take title, with the site visit, interviews and record searches within 180 days. If we can’t get on the site before the sale, we’ll tell you what that limits. A former dry cleaner, auto shop or gas station often leads to a recommendation for soil or groundwater testing (a Phase II). (Simulated reply.)',
          },
        ]),
      ]
    : []),
  ...(hasTenants(p)
    ? [
        contact('property-manager', PEOPLE.propertyManager, 'Taking over the tenants from day one.', [
          {
            label: 'Ask what day one looks like',
            send: `Hi Drew, if I buy ${p.address}, can you take over management right away? There are tenants.`,
            reply: 'Yes. On day one we send every tenant a letter saying who the new owner is and where to pay rent, change the locks on empty units, and ask each tenant to sign an estoppel certificate confirming their rent, deposit, lease term and any claims. Most leases require them to sign one. Have an attorney review which leases survive this type of sale. (Simulated reply.)',
          },
        ]),
      ]
    : []),
];

const tenantsNote = (p: PracticeProperty) =>
  p.id === 'fourplex' || p.id === 'apartments'
    ? 'There are residential tenants. Their rights after the sale depend on the type of sale and their leases; have an attorney tell you what notices to give. Never pressure a tenant to leave.'
    : commercial(p) && hasTenants(p)
      ? 'There are commercial tenants. A lease can survive or be wiped out depending on its priority and any non-disturbance agreement; have an attorney review each lease.'
      : null;

/** Quiz built straight from a playbook "mistakes" entry. */
const mistakeQuiz = (id: string, m: { mistake: string; prevent: string }): Task => ({
  kind: 'decision',
  id,
  title: 'Common mistake',
  question: 'Which is the safer move?',
  choices: [
    { label: m.prevent, correct: true, feedback: 'Right. This is how buyers avoid one of the most common mistakes with this kind of sale.' },
    { label: m.mistake, correct: false, feedback: `This is a common, expensive mistake. Instead: ${m.prevent}` },
  ],
});

function numbersInputs(p: PracticeProperty, o: { holdingMonths: number; titleLegal: number; survivingLiens: number; financedPct?: number; interestRatePct?: number; pointsPct?: number }): BidInputs {
  const possession = p.occupancy === 'Vacant' ? 300 : p.occupancy === 'Unknown' ? 1_500 : 3_500;
  const monthlyCarry = roundTo((p.value * 0.012) / 12 + (p.hoaMonthly ?? 0) + (p.hasBuilding ? 100 : 0), 10);
  return {
    ...BLANK_INPUTS,
    exitValue: p.value,
    repairs: p.repairs,
    survivingLiens: o.survivingLiens,
    titleLegal: o.titleLegal + (environmentalRisk(p) ? 4_000 : 0), // practice figure for a Phase I; get a quote
    possession,
    holdingMonths: o.holdingMonths,
    monthlyCarry,
    financedPct: o.financedPct ?? 0,
    interestRatePct: o.interestRatePct ?? BLANK_INPUTS.interestRatePct,
    pointsPct: o.pointsPct ?? BLANK_INPUTS.pointsPct,
  };
}

const numbersTask = (inputs: BidInputs, compareTo: { label: string; amount: number }, lesson: string, auction: boolean): Task => ({
  kind: 'numbers',
  id: 'numbers',
  title: auction ? 'Set your maximum bid' : 'Set your maximum offer',
  intro: `These are practice numbers for a buy-fix-sell plan, using the same calculator as the real tool. ${auction ? 'Auctions need cash, so nothing is financed at the sale.' : 'This purchase can be financed, so part of the price and repairs is borrowed.'}`,
  inputs,
  compareTo,
  lesson,
});

const bidDecision = (maxBid: number, compare: { label: string; amount: number }, auction: boolean): Task => {
  const works = maxBid > compare.amount;
  if (!auction && !works) {
    return {
      kind: 'decision',
      id: 'go-no-go',
      title: 'Below the list price',
      question: `Your maximum offer is ${money(maxBid)}. The list price is ${money(compare.amount)}. What do you do?`,
      choices: [
        { label: `Offer no more than ${money(maxBid)}, and be ready to walk away if the seller won’t come down`, correct: true, feedback: 'Right. A list price is the seller’s opening position. Your maximum comes from your numbers, not theirs.' },
        { label: 'Offer the full list price so you don’t lose it', correct: false, feedback: `At the list price the deal doesn’t leave your target profit. Offer up to ${money(maxBid)}, or walk away.` },
      ],
    };
  }
  return {
    kind: 'decision',
    id: 'go-no-go',
    title: works ? 'Go or no go?' : 'The numbers say…',
    question: `Your maximum ${auction ? 'bid' : 'offer'} is ${money(maxBid)}. The ${compare.label.toLowerCase()} is ${money(compare.amount)}. What do you do?`,
    choices: works
      ? [
          { label: `${auction ? 'Go to the sale' : 'Make an offer'}, and never ${auction ? 'bid' : 'go'} above ${money(maxBid)}`, correct: true, feedback: 'Right. Your maximum is set before the sale, when you’re calm, and you stick to it.' },
          { label: 'Decide how high to go when you’re there', correct: false, feedback: `That’s how buyers overpay. Your maximum is ${money(maxBid)}: it already includes every cost and your target profit.` },
        ]
      : [
          { label: 'Walk away: at this price the deal doesn’t leave your target profit', correct: true, feedback: 'Right. Walking away costs nothing. The best buyers skip most properties they research.' },
          { label: `${auction ? 'Bid anyway' : 'Offer anyway'} and hope the value goes up`, correct: false, feedback: `Your maximum is ${money(maxBid)}, below the ${compare.label.toLowerCase()}. Paying more means planning to lose money or hoping to be rescued by the market.` },
        ],
  };
};

const auctionPressure = (maxBid: number): Task => ({
  kind: 'decision',
  id: 'bidding-war',
  title: 'Practice the hardest moment',
  question: `Another bidder keeps raising. The next bid would be ${money(roundTo(maxBid * 1.05, 500))}, above your maximum of ${money(maxBid)}. What do you do?`,
  choices: [
    { label: 'Stop. Let them have it.', correct: true, feedback: 'Right. Every dollar over your maximum comes out of your profit, or turns it into a loss. There will be other properties.' },
    { label: 'One more bid. It’s only a little more.', correct: false, feedback: 'That’s auction fever. Your maximum already includes every cost and your profit. Above it, you’re paying to take a risk.' },
  ],
});

// ---------- one flow per kind of sale ----------

interface Numbers {
  inputs: BidInputs;
  maxBid: number;
  compare: { label: string; amount: number };
  win: number; // the price the practice buyer pays, when they go ahead
}

interface Flow {
  key: SaleKey;
  playbook: string;
  checklist: string;
  available: (p: PracticeProperty) => string | null; // null = available, else why not
  own: { correct: string; wrong: string[] };
  numbers: (p: PracticeProperty) => Numbers | null;
  research: (p: PracticeProperty, n: Numbers | null, pb: Playbook) => Task[];
  team: (p: PracticeProperty, n: Numbers | null) => Task[];
  documents: (p: PracticeProperty, n: Numbers | null) => Task[];
  saleDay: (p: PracticeProperty, n: Numbers | null) => { title: string; summary: string; tasks: Task[] };
  after: (p: PracticeProperty, n: Numbers | null, pb: Playbook) => Task[];
}

/** An auction's practice numbers: max bid from the calculator, and a winning price at or below it. */
function auctionNumbers(p: PracticeProperty, compare: { label: string; amount: number }, o: Parameters<typeof numbersInputs>[1]): Numbers {
  const inputs = numbersInputs(p, o);
  const maxBid = maxSafeBid(inputs).maxBid;
  const gap = maxBid - compare.amount;
  const win = gap > 0 ? Math.max(compare.amount, roundTo(compare.amount + gap * 0.6, 100)) : compare.amount;
  return { inputs, maxBid, compare, win: Math.min(win, maxBid) };
}

const TAX: Flow = {
  key: 'tax',
  playbook: 'tax',
  checklist: 'tax',
  available: () => null,
  own: { correct: 'The property, by quitclaim deed from the Treasurer, with no warranty of title', wrong: ['A certificate that earns interest until the owner pays', 'The property with a guaranteed clean title'] },
  numbers: (p) => {
    const minimum = roundTo(Math.max(p.value * 0.03, 2_500), 10);
    return auctionNumbers(p, { label: 'Minimum bid', amount: minimum }, { holdingMonths: 6, titleLegal: 3_800, survivingLiens: roundTo(p.value * 0.02, 100) });
  },
  research: (p, n) => [
    {
      kind: 'document',
      id: 'title-search',
      title: 'Title search results (practice)',
      from: PEOPLE.title.person,
      purpose: 'What’s recorded against the parcel, and what the tax sale does to each item.',
      lines: [
        { label: 'Delinquent property taxes (3+ years)', value: 'Paid from the winning bid.' },
        { label: `Deed of trust to Example Bank, ${money(roundTo(p.value * 0.4, 1000))}`, value: 'Most private liens and mortgages are wiped out by a tax sale. Confirm with a title professional.' },
        { label: `Federal tax lien, ${money(n!.inputs.survivingLiens)}`, value: 'Can survive if the IRS wasn’t notified at least 25 days before the sale; even if notified, the IRS can buy the property back within 120 days. Budget for it until your attorney says otherwise.' },
        { label: 'Easements and CC&Rs', value: 'Stay with the property.' },
      ],
      note: 'Practice document. A real title search comes from a title company or researcher you hire.',
    },
    {
      kind: 'decision',
      id: 'parcel-match',
      title: 'Which parcel is it?',
      question: 'The list shows a parcel number and a minimum bid. How do you confirm what you’d be buying?',
      choices: [
        { label: 'Match the parcel number on the Assessor map, then look from the street without going onto the property', correct: true, feedback: 'Right. Cheap parcels are often strips, common areas or landlocked lots. And it’s private property until the new deed is recorded.' },
        { label: 'Go by the street address and walk the property to check it out', correct: false, feedback: 'Addresses can be wrong or missing on the list; the parcel number is what’s sold. And walking onto it before the deed is recorded may be trespassing.' },
      ],
    },
  ],
  team: (p) => [
    contact('title', PEOPLE.title, 'A title search before you bid, and title insurance when possible.', [
      { label: 'Order a title search', send: `Hi Morgan, please run a title search on parcel ${p.apn} before the Treasurer’s auction.`, reply: 'Will do. You’ll have it before the registration deadline. (See the practice title search in the research step.) (Simulated reply.)' },
      { label: 'Ask about title insurance', send: 'If I win at the tax sale, can you insure the title right away?', reply: 'Usually not right away. The former owner can protest a tax sale for 2 years, and many insurers won’t insure until that window passes or a quiet title action is done. Plan on holding it for a while, or budget for quiet title. (Simulated reply.)' },
    ]),
    contact('attorney', PEOPLE.attorney, 'Quiet title, surviving liens and anyone living there.', [
      { label: 'Ask for a quiet title quote', send: 'If I win a parcel at the tax sale, what would a quiet title action cost?', reply: 'If nobody contests it, quiet title often runs about $1,500 to $5,000 or more. I’ll give you a written quote once I see the title search and know who has to be served. (Simulated reply.)' },
      { label: 'Ask about the federal tax lien', send: 'The title search shows a federal tax lien. Does the tax sale wipe it out?', reply: 'Only if the IRS was properly notified at least 25 days before the sale, and even then the United States can buy the property back within 120 days. Until we confirm the notice, budget as if it stays. (Simulated reply.)' },
    ]),
    contact('lender', commercial(p) ? PEOPLE.commercialLender : PEOPLE.hardMoney, 'Money after the sale. The auction itself needs cash.', [
      { label: 'Ask about financing the purchase', send: 'Can you fund my purchase at the Treasurer’s tax sale?', reply: 'Not at the auction: the Treasurer needs full payment the same day in certified funds. After your deed is recorded we can talk about a loan, but we require a title policy before we lend, so plan on your own cash until the title can be insured. (Simulated reply.)' },
    ]),
    ...(p.hasBuilding ? [contractorContact(p, true)] : []),
    insuranceContact(p),
    ...(commercial(p) ? commercialTeam(p) : []),
  ],
  documents: (p) => [
    {
      kind: 'document',
      id: 'registration',
      title: 'Registration worksheet (practice)',
      from: 'You',
      purpose: 'Decide these before you fill in the Treasurer’s real Trustee Auction Registration Form.',
      lines: [
        { label: 'Name on the deed', value: 'Exactly the name you register. For an LLC or trust, ask the Treasurer first whether that name is accepted.' },
        { label: 'Deposit', value: '$5,000 in certified funds, by the registration deadline (about a week before the auction). Credited if you win.' },
        { label: 'Bidder limit', value: '280 bidders. No registration on auction day.' },
        { label: 'Parcels you’ll bid on', value: `${p.apn} (practice), with your maximum bid next to it.` },
      ],
      note: 'The real form and this year’s dates come from the Clark County Treasurer.',
    },
  ],
  saleDay: (_p, n) => ({
    title: 'Auction day',
    summary: 'Bidding in person, and paying the same day.',
    tasks: [
      { kind: 'event', id: 'arrive', title: 'You arrive early', body: ['The auction is in person at the Government Center (the notice has the time and room). Only the registered bidder can bid, by showing their bidder card.', 'Parcels are offered one at a time in the published order. The auctioneer reads the parcel number and minimum bid.'] },
      auctionPressure(n!.maxBid),
      { kind: 'event', id: 'win', title: 'This time, you win', body: [`In this practice run, the other bidder drops out and you win at ${money(n!.win)}, within your maximum.`] },
      {
        kind: 'decision',
        id: 'pay-by',
        title: 'Paying',
        question: 'When do you have to pay the full price?',
        choices: [
          { label: 'By 1:00 p.m. the same day, in certified funds (4:30 p.m. for parcels re-auctioned at 2:00 p.m.)', correct: true, feedback: 'Right. If you don’t, you lose the deposit and are banned from future auctions. If you win several parcels, you must pay for all of them.' },
          { label: 'Within 30 days, once my loan closes', correct: false, feedback: 'No. The Treasurer needs full payment the same day, and there’s no financing. Bring certified funds for everything you might win.' },
        ],
      },
    ],
  }),
  after: (p, _n, pb) => [
    {
      kind: 'read',
      id: 'after-tax',
      title: 'After you win',
      body: [
        'The Treasurer records a quitclaim deed to the name on your registration form within 30 days and mails it to you.',
        'There is no redemption, but the former owner can protest the sale for 2 years, and title insurance may be unavailable meanwhile.',
        p.occupancy === 'Vacant' ? 'Secure the property and insure it.' : 'If anyone lives there, plan possession with an attorney. The county won’t help.',
      ],
    },
    { kind: 'decision', id: 'resell', title: 'Resale', question: 'A buyer offers to buy it from you next month, with title insurance. Can you close?', choices: [
      { label: 'Probably not yet: many title companies need a quiet title action or the 2-year protest window to pass first', correct: true, feedback: 'Right. Budget time and money for quiet title before you plan a resale.' },
      { label: 'Yes, a tax deed is clean title', correct: false, feedback: 'A tax deed is a quitclaim with no warranty. Many insurers won’t insure until quiet title or the protest window passes.' },
    ] },
    mistakeQuiz('mistake', pb.mistakes[3]),
    ...(tenantsNote(p) ? [{ kind: 'read', id: 'tenants', title: 'Tenants', body: [tenantsNote(p)!] } as Task] : []),
  ],
};

const SID: Flow = {
  key: 'sid',
  playbook: 'sid',
  checklist: 'sid',
  available: () => null,
  own: { correct: 'A lien certificate: the right to be repaid the assessment plus 1% a month, not the property', wrong: ['The property, by deed, after the sale', 'A share of the special improvement district'] },
  numbers: () => null,
  research: (p) => [
    {
      kind: 'decision',
      id: 'redemption-period',
      title: 'How long could your money be tied up?',
      question: `This parcel ${p.hasBuilding ? 'has a building on it' : 'is vacant land with no building'}. How long does the owner have to redeem?`,
      choices: p.hasBuilding
        ? [
            { label: '2 years, because there’s a building on the land', correct: true, feedback: 'Right. It’s 120 days for land without a home or significant improvement, and 2 years with one.' },
            { label: '120 days', correct: false, feedback: '120 days is for land without a building. With a home or significant improvement, it’s 2 years.' },
          ]
        : [
            { label: '120 days, because there’s no building on it', correct: true, feedback: 'Right. With a home or significant improvement, it would be 2 years.' },
            { label: '2 years', correct: false, feedback: '2 years applies when there’s a home or significant improvement. Bare land is 120 days.' },
          ],
    },
    {
      kind: 'read',
      id: 'know-the-land',
      title: 'Know the land anyway',
      body: [
        'The Assessor has parcel details but not liens; search the Recorder too. Most certificates are redeemed, but know what the land is in case you end up owning it.',
        'A certificate is only a lien. You have no right to enter, mow, cut trees or use the property.',
      ],
    },
  ],
  team: () => [
    contact('attorney', PEOPLE.attorney, 'The deed process, if the owner never pays.', [
      { label: 'Ask how a deed would work', send: 'If the owner never redeems my SID certificate, how do I get a deed?', reply: 'After the redemption period ends, the owner must be served notice of your intent to request a deed, in person (certified mail isn’t enough; a process server is best), and it’s posted on the property if the public can reach it, or published if they can’t be found. They get 60 more days to redeem. The District Attorney reviews the notice, you pay any delinquent taxes and assessments, and then you request the deed. Don’t wait: the certificate expires 3 years after the redemption period ends. (Simulated reply.)' },
    ]),
    contact('cpa', PEOPLE.cpa, 'How the interest is taxed.', [
      { label: 'Ask about taxes on the interest', send: 'How is interest from an SID certificate reported?', reply: 'You’ll give the Treasurer a W-9. Interest over $10 is reported to you on a 1099-INT, and it’s generally taxed as ordinary interest income. Keep your purchase and payment records. (Simulated reply.)' },
    ]),
  ],
  documents: (p) => [
    {
      kind: 'document',
      id: 'sale-day-kit',
      title: 'Sale-day kit (practice)',
      from: 'You',
      purpose: 'What to bring to register in person on sale day.',
      lines: [
        { label: 'Government photo ID', value: 'Showing your current mailing address. The certificate is issued in the name on your ID.' },
        { label: 'Arrive early', value: 'Registration is about an hour before the sale. Late arrivals can’t take part. One registration per person; you must be 18 or older.' },
        { label: 'Money for the next morning', value: `Practice certificate price: ${money(p.hasBuilding ? (commercial(p) ? 18_500 : 2_400) : 1_300)}. Cash, cashier’s check or money order, by 10:00 a.m. the next business day.` },
        { label: 'W-9', value: 'For the interest you’ll earn.' },
      ],
      note: 'There is no deposit or registration fee at present. Confirm each sale’s notice.',
    },
  ],
  saleDay: (p) => {
    const price = p.hasBuilding ? (commercial(p) ? 18_500 : 2_400) : 1_300;
    return {
      title: 'Sale day: the drawing',
      summary: 'Winners are drawn at random, not by highest bid.',
      tasks: [
        { kind: 'event', id: 'drawing', title: 'The drawing', body: ['A random number generator picks the winner and two alternates for each parcel. Not highest bid.', `For practice, you’re drawn as the winner for parcel ${p.apn}, at ${money(price)}.`] },
        {
          kind: 'decision',
          id: 'pay-by',
          title: 'Paying',
          question: 'When and how do you pay?',
          choices: [
            { label: 'By 10:00 a.m. the next business day, in cash, cashier’s check or money order', correct: true, feedback: 'Right. If you don’t, the certificate goes to the first alternate, then the second.' },
            { label: 'By credit card at the end of the sale', correct: false, feedback: 'No. Pay by 10:00 a.m. the next business day in cash, cashier’s check or money order.' },
          ],
        },
      ],
    };
  },
  after: (p, _n, pb) => {
    const price = p.hasBuilding ? (commercial(p) ? 18_500 : 2_400) : 1_300;
    const months = 8;
    return [
      {
        kind: 'read',
        id: 'redemption',
        title: 'Waiting for redemption',
        body: [
          `Most owners pay. For practice, the owner redeems after ${months} months: you receive ${money(price)} plus 1% a month simple interest, ${money(price * 0.01 * months)}, usually 30–60 days after they redeem.`,
          'If later property taxes go unpaid, you may pay them and add them to the certificate by giving the Treasurer written notice and receipts.',
        ],
      },
      {
        kind: 'decision',
        id: 'enter',
        title: 'While you wait',
        question: 'The property looks neglected. Can you go clean it up?',
        choices: [
          { label: 'No. A certificate is only a lien; I have no right to enter or use the property', correct: true, feedback: 'Right. You own a debt, not the land.' },
          { label: 'Yes, I have an interest in it now', correct: false, feedback: 'A certificate is only a lien. You have no right to enter, mow, cut trees or use the property.' },
        ],
      },
      mistakeQuiz('mistake', pb.mistakes[0]),
    ];
  },
};

const FORECLOSURE: Flow = {
  key: 'foreclosure',
  playbook: 'foreclosure',
  checklist: 'foreclosure',
  available: () => null,
  own: { correct: 'The owner’s interest by trustee’s deed, subject to anything senior to the loan being foreclosed', wrong: ['Free and clear title, guaranteed by the trustee', 'A certificate of sale, with a deed a year later'] },
  numbers: (p) => {
    const taxes = roundTo(p.value * 0.01, 100);
    const hoa = p.hoaMonthly ? p.hoaMonthly * 9 : 0;
    return auctionNumbers(p, { label: 'Opening bid', amount: roundTo(p.value * 0.5, 1000) }, { holdingMonths: 6, titleLegal: 500, survivingLiens: taxes + hoa });
  },
  research: (p) => [
    {
      kind: 'document',
      id: 'title-search',
      title: 'Title search results (practice)',
      from: PEOPLE.title.person,
      purpose: 'Which loan is being foreclosed, and what stays.',
      lines: [
        { label: `First deed of trust, ${money(roundTo(p.value * 0.7, 1000))}`, value: 'This is the loan being foreclosed. Its own sale wipes it out.' },
        { label: `Second deed of trust, ${money(roundTo(p.value * 0.08, 1000))}`, value: 'Recorded after the first: wiped out in most cases.' },
        { label: `Unpaid property taxes, ${money(roundTo(p.value * 0.01, 100))}`, value: 'Stay with the property.' },
        ...(p.hoaMonthly ? [{ label: `HOA lien for unpaid dues`, value: `Up to 9 months of dues (${money(p.hoaMonthly * 9)} here, plus certain charges) can stay: the HOA super-priority.` }] : []),
        ...(commercial(p) && hasTenants(p) ? [{ label: 'Recorded lease (Suite/Unit A)', value: 'Signed after the first deed of trust. It can be wiped out unless there’s a non-disturbance agreement; have an attorney confirm.' }] : []),
      ],
      note: 'Practice document. A real title search comes from a title company or researcher you hire.',
    },
    {
      kind: 'decision',
      id: 'which-loan',
      title: 'Which loan is foreclosing?',
      question: 'What if the notice of sale had been for the second deed of trust instead?',
      choices: [
        { label: 'The first deed of trust would stay, and I’d have to add it to my costs', correct: true, feedback: 'Right. A junior lien’s sale leaves the senior loan in place. In the guide’s example, that turned a $40,000 opening bid into a $350,000 real price.' },
        { label: 'Every loan is wiped out at any foreclosure sale', correct: false, feedback: 'No. A sale only wipes out the loan being foreclosed and liens junior to it. Senior loans stay.' },
      ],
    },
    ...(p.cls === 'residential' ? [{ kind: 'read', id: 'mediation', title: 'If the owner lives there', body: ['Owner-occupants can petition the court for foreclosure mediation within 30 days after the notice of default is served. A sale of an owner-occupied home needs a recorded mediation certificate.', 'Never contact the owner. Watch the notices and the trustee’s status.'] } as Task] : []),
  ],
  team: (p) => [
    contact('trustee', PEOPLE.trustee, 'Is the sale still on?', [
      { label: 'Call the day before', send: `Hello, I’m calling about the trustee’s sale for ${p.address}, parcel ${p.apn}. Is it still going ahead tomorrow?`, reply: 'That sale has been postponed one week, same time and place. Call again the day before. Postponements are common when owners reinstate, sell or file bankruptcy. (Simulated reply.)' },
      { label: 'Ask about payment terms', send: 'What form of payment do you accept at the sale?', reply: 'Cashier’s checks for the full bid, payable as stated in our terms. Bring several checks in different amounts so you can pay exactly your bid. (Simulated reply.)' },
    ]),
    contact('title', PEOPLE.title, 'Which loan is foreclosing, and what survives.', [
      { label: 'Order a title search', send: `Hi Morgan, please run a title search on ${p.apn} before the trustee’s sale. I need to know which loan is foreclosing and what stays.`, reply: 'On it. I’ll flag the lien being foreclosed, anything senior to it, unpaid property taxes and any HOA lien. (See the practice title search in the research step.) (Simulated reply.)' },
    ]),
    contact('lender', commercial(p) ? PEOPLE.commercialLender : PEOPLE.hardMoney, 'Money for after the sale.', [
      { label: 'Ask about a loan for the sale', send: 'Can a mortgage pay for my winning bid at the trustee’s sale?', reply: 'A regular mortgage can’t fund a trustee sale: the trustee needs certified funds at the sale. Buyers use cash, or cash from a loan arranged in advance on other property. After you own it, we can refinance. (Simulated reply.)' },
    ]),
    contact('attorney', PEOPLE.attorney, 'Occupants and the sale’s validity.', [
      {
        label: 'Ask about occupants',
        send: `If someone lives at ${p.address} after I buy it, what do I have to do?`,
        reply: commercial(p) && p.id !== 'apartments'
          ? 'Commercial tenants depend on their leases: a lease signed after the foreclosed loan, or subordinated to it, can be wiped out unless there’s a non-disturbance agreement, and then the tenant can also leave. Send me each lease. (Simulated reply.)'
          : 'Bona fide tenants get at least 90 days’ written notice under federal law (the Protecting Tenants at Foreclosure Act), and a lease can run to its end unless the buyer will live there. A former owner who stays gets a 3-day notice under NRS 40.255. Don’t change locks or remove belongings yourself. (Simulated reply.)',
      },
      { label: 'Ask whether the sale can be undone', send: 'Can the sale be challenged after I buy?', reply: 'A lawsuit can void the sale if it’s filed within 30 days after the trustee’s deed is recorded. Someone who didn’t get proper notice has 90 days from the sale (NRS 107.080). I’d hold off on big repairs until that passes. (Simulated reply.)' },
    ]),
    ...(p.hasBuilding ? [contractorContact(p, true)] : []),
    insuranceContact(p),
    ...(commercial(p) ? commercialTeam(p) : []),
  ],
  documents: (_p, n) => [
    {
      kind: 'document',
      id: 'funds',
      title: 'Cashier’s checks plan (practice)',
      from: 'You and your bank',
      purpose: 'Certified funds that let you pay exactly your bid.',
      lines: [
        { label: 'Your maximum bid', value: money(n!.maxBid) },
        { label: 'Checks', value: `One for the opening bid (${money(n!.compare.amount)}), plus smaller checks so you can pay any amount up to your maximum. Confirm the payee and terms with the trustee.` },
        { label: 'ID', value: 'Government-issued photo ID.' },
      ],
    },
  ],
  saleDay: (_p, n) => ({
    title: 'Sale day',
    summary: 'After one postponement, the sale goes ahead.',
    tasks: [
      { kind: 'event', id: 'postponed', title: 'Postponed a week', body: ['The trustee postponed the sale one week (see your call with the trustee). You call again the day before: it’s on.'] },
      auctionPressure(n!.maxBid),
      { kind: 'event', id: 'win', title: 'The trustee accepts your bid', body: [`In this practice run, the other bidder drops out and you win at ${money(n!.win)} and pay with your cashier’s checks. The trustee’s deed will be recorded.`] },
    ],
  }),
  after: (p, _n, pb) => [
    {
      kind: 'read',
      id: 'after-foreclosure',
      title: 'After you win',
      body: [
        'Get the trustee’s deed recorded and insure the property the same day.',
        'There’s no redemption for the owner. If a federal tax lien was on the property, the United States can redeem within 120 days.',
        'A lawsuit can void the sale if filed within 30 days after the deed is recorded (90 days from the sale for someone who didn’t get proper notice).',
        ...(tenantsNote(p) ? [tenantsNote(p)!] : []),
      ],
    },
    // The occupants mistake quotes residential tenant law, so commercial buildings get the postponement one.
    mistakeQuiz('mistake', pb.mistakes[commercial(p) && p.id !== 'apartments' ? 1 : 2]),
  ],
};

const HOA: Flow = {
  key: 'hoa',
  playbook: 'hoa',
  checklist: 'hoa',
  available: (p) => (p.cls === 'residential' && p.hoaMonthly ? null : 'HOA foreclosures under NRS 116 are sales of homes in a homeowners association. This practice property isn’t in one.'),
  own: { correct: 'A certificate of sale, then a deed after the 60-day redemption period, and possibly still subject to the first mortgage', wrong: ['The home free of the mortgage, right away', 'A lien certificate earning 1% a month'] },
  numbers: (p) => {
    const first = roundTo(p.value * 0.72, 1000);
    return auctionNumbers(p, { label: 'Opening bid', amount: roundTo((p.hoaMonthly ?? 0) * 18 + 3_000, 100) }, { holdingMonths: 7, titleLegal: 2_800, survivingLiens: first });
  },
  research: (p, n) => [
    {
      kind: 'document',
      id: 'title-search',
      title: 'Title search and Recorder check (practice)',
      from: PEOPLE.title.person,
      purpose: 'Whether the first mortgage survives the HOA sale.',
      lines: [
        { label: 'HOA lien being foreclosed', value: 'Wiped out by its own sale.' },
        { label: `First deed of trust to Example Bank, ${money(n!.inputs.survivingLiens)}`, value: 'Survives if the lender paid or validly offered the HOA’s priority amount at least 5 days before the sale, or if Fannie Mae or Freddie Mac owned the loan.' },
        { label: 'Recorder: payment of the priority amount', value: 'FOUND: the lender’s payment of the super-priority amount was recorded 10 days before the sale.' },
      ],
      note: 'Practice document. In real life, get a title professional’s or attorney’s opinion before bidding.',
    },
    {
      kind: 'decision',
      id: 'mortgage-survives',
      title: 'What the Recorder shows',
      question: 'The lender’s payment was recorded 10 days before the sale. What happens to the first mortgage?',
      choices: [
        { label: `It survives: I’d take the home subject to the ${money(n!.inputs.survivingLiens)} loan`, correct: true, feedback: 'Right. The lender paid at least 5 days before the sale, so the first deed of trust stays. Add it to your costs.' },
        { label: 'It’s wiped out: HOA sales always wipe out the mortgage', correct: false, feedback: 'Not when the lender paid or validly offered the priority amount at least 5 days before, or when Fannie Mae or Freddie Mac owned the loan. Here, the payment was recorded.' },
      ],
    },
    { kind: 'read', id: 'hoa-dues', title: 'The HOA itself', body: [`Dues here are ${money(p.hoaMonthly ?? 0)} a month. Ask the HOA’s foreclosure agent for the sale terms, and budget for dues from the day you own it.`] },
  ],
  team: (p) => [
    contact('hoa-agent', PEOPLE.hoaAgent, 'The sale date and payment terms.', [
      { label: 'Confirm the sale and terms', send: `Hello, I’m calling about the HOA foreclosure sale for ${p.address}. Is it still on, and what payment do you accept?`, reply: 'The sale is on as noticed. We need certified funds for the full bid; bring cashier’s checks. (Simulated reply.)' },
    ]),
    contact('attorney', PEOPLE.attorney, 'An opinion on the sale before you bid.', [
      { label: 'Ask whether the mortgage survives', send: 'The Recorder shows the lender paid the HOA’s priority amount 10 days before the sale. Does the mortgage survive?', reply: 'Yes. When the lender pays, or validly offers, the priority amount at least 5 days before the sale, the first deed of trust survives. Nevada HOA sales were heavily litigated after SFR Investments (2014), so I review every one before a client bids. (Simulated reply.)' },
    ]),
    contact('title', PEOPLE.title, 'The Recorder check.', [
      { label: 'Ask for a Recorder check', send: `Can you check whether the lender paid the HOA’s priority amount on ${p.apn}?`, reply: 'Yes. A payment of the super-priority amount has to be recorded at least 2 days before the sale. I found one, recorded 10 days before. (See the practice document in the research step.) (Simulated reply.)' },
    ]),
  ],
  documents: () => [
    {
      kind: 'document',
      id: 'funds',
      title: 'What you’d bring (practice)',
      from: 'You',
      purpose: 'If the numbers had worked.',
      lines: [
        { label: 'Cashier’s checks', value: 'For your full bid, in amounts that let you pay exactly your bid. Confirm the payee with the HOA’s agent.' },
        { label: 'ID', value: 'Government-issued photo ID.' },
        { label: 'Money for 60 days', value: 'You can’t safely spend on repairs until the redemption period ends.' },
      ],
    },
  ],
  saleDay: (_p, n) => ({
    title: 'Sale day',
    summary: 'The disciplined choice.',
    tasks: [
      {
        kind: 'event',
        id: 'walk',
        title: n!.maxBid > n!.compare.amount ? 'You bid carefully' : 'You stay home',
        body: n!.maxBid > n!.compare.amount
          ? [`Your maximum already counts the surviving mortgage. For practice, you win at ${money(n!.win)}.`]
          : ['With the first mortgage surviving, no bid leaves your target profit. Someone else buys it. You keep your cash for a better deal, and you still practice what happens next, below.'],
      },
    ],
  }),
  after: (_p, _n, pb) => [
    {
      kind: 'read',
      id: 'redemption',
      title: 'If you had won: the 60-day wait',
      body: [
        'You’d get a certificate of sale first, and a deed after the redemption period.',
        'For 60 days, the former owner, or a lender whose loan ranked below the HOA lien, can redeem by paying your price plus 1% a month and the taxes, assessments and upkeep you paid.',
      ],
    },
    mistakeQuiz('mistake', pb.mistakes[1]),
  ],
};

const SHERIFF: Flow = {
  key: 'sheriff',
  playbook: 'sheriff',
  checklist: 'sheriff',
  available: () => null,
  own: { correct: 'A certificate of sale for the debtor’s interest, with a deed after the 1-year redemption period', wrong: ['A deed right away, free of all liens', 'A lien certificate earning interest'] },
  numbers: (p) => auctionNumbers(p, { label: 'Starting bid', amount: roundTo(p.value * 0.2, 1000) }, { holdingMonths: 15, titleLegal: 1_500, survivingLiens: roundTo(p.value * 0.3, 1000) }),
  research: (_p, n) => [
    {
      kind: 'document',
      id: 'title-search',
      title: 'Title search results (practice)',
      from: PEOPLE.title.person,
      purpose: 'You receive only the debtor’s interest. What stays?',
      lines: [
        { label: 'Judgment lien being enforced', value: 'Wiped out by the sale.' },
        { label: `First deed of trust, ${money(n!.inputs.survivingLiens)}`, value: 'Recorded before the judgment: stays.' },
        { label: 'Property taxes', value: 'Current (practice). Unpaid taxes would stay.' },
      ],
      note: 'Practice document. A real title search comes from a title company or researcher you hire.',
    },
  ],
  team: (p) => [
    contact('attorney', PEOPLE.attorney, 'The redemption year and what you can do meanwhile.', [
      { label: 'Ask about the redemption year', send: 'If I buy at the sheriff’s sale, what happens during the redemption period?', reply: 'The debtor can redeem for 1 year after the sale by paying your price plus 1% a month. Any rent you collect meanwhile is subtracted from what they pay. Don’t improve the property until the year is up: repair spending isn’t repaid if they redeem. (Simulated reply.)' },
    ]),
    contact('title', PEOPLE.title, 'What stays with the property.', [
      { label: 'Order a title search', send: `Please run a title search on ${p.apn} before the sheriff’s sale.`, reply: 'Will do. You get only the debtor’s interest, so I’ll list everything recorded before the judgment. (See the practice title search in the research step.) (Simulated reply.)' },
    ]),
    insuranceContact(p),
    ...(commercial(p) ? commercialTeam(p) : []),
  ],
  documents: () => [
    {
      kind: 'document',
      id: 'funds',
      title: 'What to bring (practice)',
      from: 'You',
      purpose: 'Per the sheriff’s sale notice.',
      lines: [
        { label: 'Certified funds', value: 'As stated in the notice for this case.' },
        { label: 'ID', value: 'Government-issued photo ID.' },
        { label: 'A year of holding costs', value: 'Taxes, insurance and loan payments while you wait out the redemption period.' },
      ],
    },
  ],
  saleDay: (_p, n) => ({
    title: 'Sale day',
    summary: 'You get a certificate, not a deed.',
    tasks: [
      auctionPressure(n!.maxBid),
      { kind: 'event', id: 'win', title: 'This time, you win', body: [`In this practice run, the other bidder drops out and you win at ${money(n!.win)}. You receive a certificate of sale; the deed comes after the 1-year redemption period.`] },
    ],
  }),
  after: (p, _n, pb) => [
    {
      kind: 'decision',
      id: 'renovate',
      title: 'Month two',
      question: `A contractor can start a ${money(roundTo(Math.max(p.repairs, 20_000), 1000))} renovation next week. Do it now?`,
      choices: [
        { label: 'No. Wait until the redemption year ends', correct: true, feedback: 'Right. If the debtor redeems, you get your price plus 1% a month, but not what you spent on repairs.' },
        { label: 'Yes. The sooner it’s fixed, the sooner I can sell', correct: false, feedback: `In the guide’s example, the debtor redeemed after eleven months and the buyer’s repair spending was lost. ${pb.mistakes[0].prevent}` },
      ],
    },
  ],
};

const IRS: Flow = {
  key: 'irs',
  playbook: 'irs',
  checklist: 'sheriff',
  available: () => null,
  own: { correct: 'A certificate of sale for the taxpayer’s interest, then a deed after the 180-day redemption period', wrong: ['Free and clear title from the federal government', 'The property with the IRS paying off the mortgage'] },
  numbers: (p) => auctionNumbers(p, { label: 'Minimum bid', amount: roundTo(p.value * 0.25, 1000) }, { holdingMonths: 9, titleLegal: 1_500, survivingLiens: roundTo(p.value * 0.25, 1000) }),
  research: (_p, n) => [
    {
      kind: 'document',
      id: 'title-search',
      title: 'Title search results (practice)',
      from: PEOPLE.title.person,
      purpose: 'You get only the taxpayer’s interest.',
      lines: [
        { label: 'Federal tax lien being enforced', value: 'Wiped out, along with liens junior to it.' },
        { label: `First deed of trust, ${money(n!.inputs.survivingLiens)}`, value: 'Recorded before the IRS lien: stays.' },
        { label: 'Property taxes', value: 'Stay with the property.' },
      ],
      note: 'Practice document. The IRS will give information about possible encumbrances on request.',
    },
    {
      kind: 'read',
      id: 'notice',
      title: 'Read the notice of sale',
      body: [
        'Each IRS notice sets the deposit, payment deadline, payment forms and whether it’s a public auction or sealed bid.',
        'In this practice notice: public auction, 20% of the bid on sale day and the rest within 30 days. One real IRS notice in 2026 used those terms; each notice sets its own.',
      ],
    },
  ],
  team: (p) => [
    contact('irs', PEOPLE.irs, 'Questions about this sale, to the contact in the notice.', [
      { label: 'Ask about the property', send: `I’m interested in the sale of ${p.address}. What is being sold, and are there other liens?`, reply: 'Only the taxpayer’s right, title and interest is offered, subject to any prior valid mortgages and liens. On request, we can give you information about possible encumbrances. The notice has the terms, the payment forms and whether the property can be inspected. (Simulated reply.)' },
    ]),
    contact('attorney', PEOPLE.attorney, 'The 180 days.', [
      { label: 'Ask about the 180 days', send: 'What can I do with the property during the 180-day redemption period?', reply: 'The owner, or anyone with an interest or lien, can redeem for 180 days by paying your price plus 20% a year, compounded daily. Whether you can collect rent, evict or move in during that time depends on state law, so let’s review it for this property before you bid. (Simulated reply.)' },
    ]),
    contact('title', PEOPLE.title, 'Senior liens you’d inherit.', [
      { label: 'Order a title search', send: `Please run a title search on ${p.apn} before the IRS sale.`, reply: 'Will do. You inherit anything senior to the IRS lien, so that’s what I’ll focus on. (See the practice title search in the research step.) (Simulated reply.)' },
    ]),
    insuranceContact(p),
    ...(commercial(p) ? commercialTeam(p) : []),
  ],
  documents: (_p, n) => [
    {
      kind: 'document',
      id: 'funds',
      title: 'Payment plan (practice)',
      from: 'You',
      purpose: 'Matching this practice notice’s terms.',
      lines: [
        { label: 'On sale day', value: `20% of your winning bid, in the form the notice requires. At your maximum, that’s ${money(roundTo(n!.maxBid * 0.2, 1))}.` },
        { label: 'Within 30 days', value: 'The rest of the price.' },
        { label: 'For 180 days', value: 'Money to hold the property while the redemption period runs.' },
      ],
      note: 'Practice terms. Read the real notice for each sale.',
    },
  ],
  saleDay: (_p, n) => ({
    title: 'Sale day',
    summary: 'A public auction, per the practice notice.',
    tasks: [
      auctionPressure(n!.maxBid),
      { kind: 'event', id: 'win', title: 'This time, you win', body: [`In this practice run, the other bidder drops out and you win at ${money(n!.win)} and pay 20% today. You receive a certificate of sale; the deed comes after 180 days.`] },
    ],
  }),
  after: (_p, _n, pb) => [
    {
      kind: 'read',
      id: 'after-irs',
      title: 'The 180 days',
      body: ['The owner, or anyone with an interest or lien, can redeem for 180 days by paying your price plus 20% a year, compounded daily.', 'You receive the deed after the redemption period if nobody redeems.'],
    },
    {
      kind: 'decision',
      id: 'flip',
      title: 'Plans',
      question: 'Can you plan a 4-month flip?',
      choices: [
        { label: 'No. The redemption period alone is 180 days; build it into holding costs', correct: true, feedback: `Right. ${pb.example.lesson}` },
        { label: 'Yes, if I start repairs on day one', correct: false, feedback: 'Repairs are at risk for 180 days, because the owner can redeem. Build the redemption period into your holding costs.' },
      ],
    },
  ],
};

/** Purchases through an agent (bank-owned and short sales): an offer instead of a bid. */
function offerNumbers(p: PracticeProperty, list: number, holdingMonths: number): Numbers {
  const inputs = numbersInputs(p, { holdingMonths, titleLegal: 500, survivingLiens: 0, financedPct: 75, interestRatePct: 7.5, pointsPct: 1 });
  const maxBid = maxSafeBid(inputs).maxBid;
  const compare = { label: 'List price', amount: list };
  return { inputs, maxBid, compare, win: Math.min(list, Math.floor(maxBid / 1000) * 1000) };
}

const REO: Flow = {
  key: 'reo',
  playbook: 'reo',
  checklist: 'reo',
  available: () => null,
  own: { correct: 'The property by a normal purchase through escrow, usually with a special warranty deed and title insurance', wrong: ['A certificate of sale with a redemption period', 'The bank’s loan, which you then foreclose'] },
  // Practice list prices: homes near market (you negotiate down), commercial buildings priced for their condition.
  numbers: (p) => offerNumbers(p, roundTo(p.value * (commercial(p) ? 0.58 : 0.8), 1000), 5),
  research: (p) => [
    {
      kind: 'document',
      id: 'title-commitment',
      title: 'Title commitment (practice)',
      from: PEOPLE.title.person,
      purpose: 'What the title policy will and won’t cover.',
      lines: [
        { label: 'Old mortgage and liens', value: 'Most are cleared by the lender before or at closing. Confirm on the title report.' },
        { label: 'Exceptions', value: `Recorded easements${p.hoaMonthly ? ', HOA CC&Rs' : ''} and anything else listed as an exception stay.` },
      ],
      note: 'Practice document. The real one comes from the title company handling your escrow.',
    },
    ...(p.cls === 'residential'
      ? [{ kind: 'read', id: 'programs', title: 'Special rules for some sellers', body: ['HUD homes: you bid through a HUD-registered broker; owner-occupants get the first bidding period.', 'Fannie Mae and Freddie Mac homes: owner-occupants get a 30-day “First Look” before investors.'] } as Task]
      : [{ kind: 'read', id: 'programs', title: 'No home-buyer programs', body: ['There’s no owner-occupant first look for commercial property. HUD Home Store, HomePath and HomeSteps sell homes with 1–4 units only.'] } as Task]),
  ],
  team: (p, n) => [
    ...(commercial(p)
      ? []
      : [
          contact('agent', PEOPLE.agent, 'REO sales go through listing brokers.', [
            { label: 'Ask them to write an offer', send: `Hi Taylor, I'd like to offer on the bank-owned ${p.label.toLowerCase()} at ${p.address}. My maximum is ${money(n!.maxBid)}.`, reply: `Happy to. The bank will send its own addendum after acceptance, and it usually overrides parts of the standard contract, including repairs and deadlines. Read every page before you sign. I'll need your pre-approval letter and proof of your earnest money. (Simulated reply.)` },
          ]),
          contact('loan', PEOPLE.loanOfficer, 'Pre-approval before you offer.', [
            { label: 'Ask for pre-approval', send: 'I want to make an offer on a bank-owned home. Can you pre-approve me?', reply: 'Yes. Send your pay stubs, tax returns, bank statements and ID, and I’ll run your credit. If the home needs major repairs, tell me: some loans require the home to meet condition standards, and that affects which loan fits. (Simulated reply.)' },
          ]),
        ]),
    contact('title', PEOPLE.title, 'Escrow and title insurance.', [
      { label: 'Ask about closing', send: 'Can you handle escrow and title insurance on a bank-owned purchase?', reply: 'Yes, it closes through escrow with title insurance, like a normal purchase. I’ll send the title commitment as soon as escrow opens. (Simulated reply.)' },
    ]),
    ...(p.hasBuilding ? [contractorContact(p, false)] : []),
    insuranceContact(p),
    ...(commercial(p)
      ? [
          contact('commercial-lender', PEOPLE.commercialLender, 'Financing a commercial purchase.', [
            { label: 'Ask about a loan', send: `I'm buying a bank-owned ${p.label.toLowerCase()} as an investment. What loan fits?`, reply: 'A commercial or bridge loan. SBA 504 and 7(a) loans are only for a business that will use the building itself, not for rental investment. Send me the rent roll, leases and your plan. (Simulated reply.)' },
          ]),
          contact('attorney', PEOPLE.attorney, 'The bank’s purchase agreement.', [
            { label: 'Ask for a contract review', send: 'The bank sent its purchase agreement. Can you review it?', reply: 'Yes. Banks sell as-is and their agreement usually overrides standard terms, so read every page before you sign. I’ll flag deadlines, what the bank won’t promise, and what happens if closing is late. (Simulated reply.)' },
          ]),
          ...commercialTeam(p),
        ]
      : []),
  ],
  documents: (p) => [
    { kind: 'checklist', id: 'packet', title: 'Your offer packet (practice)', items: commercial(p)
      ? [
          { text: 'Proof of funds and a lender’s term sheet' },
          { text: 'A letter of intent, then the bank’s purchase agreement, reviewed by your attorney' },
          { text: 'Earnest money, held in escrow' },
          { text: 'Rent roll, leases and estoppel certificates requested' },
          ...(environmentalRisk(p) ? [{ text: 'Phase I environmental site assessment ordered' }] : []),
          { text: 'Inspection during your due-diligence period' },
          { text: 'Commercial insurance quote, ready to bind at closing' },
        ]
      : [
          { text: 'Pre-approval letter or proof of funds' },
          { text: 'Offer written by your buyer’s agent' },
          { text: 'Earnest money deposit, held in escrow (the amount is set in the lender’s terms)' },
          { text: 'The lender’s addendum, read in full' },
          { text: 'Home inspection within your contingency period' },
          { text: 'Homeowner’s insurance quote, ready to bind at closing' },
        ] },
  ],
  saleDay: (_p, n) => ({
    title: 'Your offer',
    summary: 'Offer, addendum, inspection, closing.',
    tasks: [
      { kind: 'event', id: 'offer', title: 'You offer', body: [n!.maxBid >= n!.compare.amount ? `You offer ${money(n!.win)}, the list price, which is within your maximum.` : `The list price is above your maximum, so you offer ${money(n!.win)}. In this practice run, the bank counters, you hold at your number, and the bank accepts it.`] },
      {
        kind: 'decision',
        id: 'addendum',
        title: 'The addendum',
        question: 'The bank’s addendum charges you a per-day penalty if closing runs late. What do you do?',
        choices: [
          { label: 'Read every page, then line up the loan, inspection and appraisal early so closing is on time', correct: true, feedback: 'Right. The addendum usually overrides parts of the standard contract and can shift costs and deadlines to you.' },
          { label: 'Sign it: addenda are just paperwork', correct: false, feedback: 'The addendum can shift costs and deadlines to you. Read every page before signing.' },
        ],
      },
      { kind: 'event', id: 'close', title: 'Closing', body: ['Inspection and appraisal done within your contingency period. You close through escrow with title insurance.'] },
    ],
  }),
  after: (p) => [
    { kind: 'read', id: 'after-reo', title: 'After closing', body: ['Insure it from the day you own it, start repairs, and rent or sell.', ...(tenantsNote(p) ? [tenantsNote(p)!] : [])] },
  ],
};

const SHORT: Flow = {
  key: 'short',
  playbook: 'short',
  checklist: 'short',
  available: (p) =>
    p.cls === 'residential' && p.hasBuilding
      ? null
      : p.cls === 'commercial'
        ? 'Commercial loans are sometimes settled by a discounted sale, but those are negotiated privately and work differently. The short-sale practice covers homes.'
        : 'Short sales of vacant land are uncommon. The short-sale practice covers homes.',
  own: { correct: 'The property by a normal sale through escrow, once the lender approves', wrong: ['The owner’s loan', 'A certificate of sale with a redemption period'] },
  numbers: (p) => offerNumbers(p, roundTo(p.value * 0.8, 1000), 5),
  research: (p) => [
    {
      kind: 'document',
      id: 'title',
      title: 'Preliminary title report (practice)',
      from: PEOPLE.title.person,
      purpose: 'Every lien holder has to agree.',
      lines: [
        { label: `First deed of trust, ${money(roundTo(p.value * 0.95, 1000))}`, value: 'More than the sale price: this lender must approve the short sale.' },
        { label: `Second deed of trust, ${money(roundTo(p.value * 0.08, 1000))}`, value: 'This lender must also agree to release its lien.' },
      ],
      note: 'Practice document.',
    },
    {
      kind: 'decision',
      id: 'foreclosure-date',
      title: 'Before you offer',
      question: 'What should you ask the listing agent first?',
      choices: [
        { label: 'Whether a foreclosure sale date is set, and whether it’s postponed for the short sale', correct: true, feedback: 'Right. The lender can foreclose while a short sale is pending. Know the dates.' },
        { label: 'How low the owner will go', correct: false, feedback: 'The lender, not the owner, decides whether the price works. First find out whether foreclosure is scheduled.' },
      ],
    },
  ],
  team: (p, n) => [
    contact('agent', PEOPLE.agent, 'An agent with short-sale experience.', [
      { label: 'Ask them to write an offer', send: `Hi Taylor, I want to offer on the short sale at ${p.address}. My maximum is ${money(n!.maxBid)}.`, reply: 'Great. We offer subject to lender approval. The seller accepts first, then the listing agent sends the package to the lender. Approval often takes weeks to months, and the lender can counter or say no. (Simulated reply.)' },
    ]),
    contact('listing', PEOPLE.listingAgent, 'Timing.', [
      { label: 'Ask about a foreclosure date', send: `Is a foreclosure sale scheduled on ${p.address}, and is it postponed for the short sale?`, reply: 'There is a trustee’s sale date in about 60 days. The first lender has agreed to postpone it while they review a complete short-sale package. (Simulated reply.)' },
    ]),
    contact('loan', PEOPLE.loanOfficer, 'Pre-approval.', [
      { label: 'Ask for pre-approval', send: 'I’m offering on a short sale. Can you pre-approve me?', reply: 'Yes. Lenders on short sales want proof you can close. Also ask for a rate lock that can be extended, since approval can take months. (Simulated reply.)' },
    ]),
    contact('title', PEOPLE.title, 'Escrow.', [
      { label: 'Ask how payments work', send: 'Who do I pay during a short sale?', reply: 'Everything goes through escrow and is disclosed to the lenders on the settlement statement. Never pay anyone outside escrow. (Simulated reply.)' },
    ]),
  ],
  documents: () => [
    { kind: 'checklist', id: 'packet', title: 'Your offer packet (practice)', items: CHECKLISTS.short.items },
  ],
  saleDay: (_p, n) => ({
    title: 'Offer and lender approval',
    summary: 'Weeks to months, with two lenders.',
    tasks: [
      { kind: 'event', id: 'offer', title: 'You offer', body: [`You offer ${money(n!.win)}, subject to lender approval${n!.maxBid >= n!.compare.amount ? '' : ', below the list price'}. The seller accepts, and the listing agent sends the package to the lenders.`] },
      { kind: 'event', id: 'first-lender', title: 'Week 10', body: ['The first lender approves your price.'] },
      { kind: 'event', id: 'second-lender', title: 'Week 11', body: ['The second-mortgage holder wants more money to release its lien, which adds about another month. (This mirrors the guide’s example.)'] },
      {
        kind: 'decision',
        id: 'side-fee',
        title: 'An offer to speed it up',
        question: 'Someone says they can get the second lender to agree faster for $2,000, paid to them directly. What do you do?',
        choices: [
          { label: 'Refuse. Every payment goes through escrow and is disclosed to the lenders', correct: true, feedback: 'Right. Paying a “negotiator” outside escrow is a common and serious mistake.' },
          { label: 'Pay it: it’s cheaper than losing the deal', correct: false, feedback: 'Never pay side fees outside escrow. All payments go through escrow and are disclosed to the lender.' },
        ],
      },
      { kind: 'event', id: 'close', title: 'Approval and closing', body: ['Both lenders approve and release their liens. You close through escrow with title insurance.'] },
    ],
  }),
  after: (p) => [{ kind: 'read', id: 'after-short', title: 'After closing', body: ['You own it by a normal sale. Insure it, and start your repairs or move in.', ...(tenantsNote(p) ? [tenantsNote(p)!] : [])] }],
};

export const FLOWS: Record<SaleKey, Flow> = { tax: TAX, sid: SID, foreclosure: FORECLOSURE, hoa: HOA, sheriff: SHERIFF, irs: IRS, reo: REO, short: SHORT };
export const SALE_ORDER: SaleKey[] = ['tax', 'foreclosure', 'reo', 'short', 'hoa', 'sheriff', 'irs', 'sid'];

/** The buyer checklist for a sale, with commercial wording where needed. */
function checklistFor(flow: Flow, p: PracticeProperty): BuyerChecklist {
  const list = CHECKLISTS[flow.checklist];
  return commercial(p) ? forCommercial(list) : list;
}

/** Playbook facts that only apply to homes (owner-occupant mediation, HUD and Fannie Mae / Freddie Mac rules). */
export const HOME_ONLY_FACTS = new Set(['Mediation', 'HUD homes', 'Fannie Mae & Freddie Mac']);

/** Playbook steps reworded for commercial property (the playbook's version is about homes). */
export const COMMERCIAL_STEPS: Record<string, Record<string, { title: string; detail: string }>> = {
  reo: {
    'Get pre-approved': { title: 'Line up financing', detail: 'A commercial or bridge lender’s term sheet, or proof of funds for a cash offer.' },
    'Choose a buyer’s agent': { title: 'Work with a commercial broker', detail: 'Bank-owned commercial property is sold through listing brokers. HUD Home Store, HomePath and HomeSteps sell homes only.' },
  },
};

/** The playbook's steps for this sale, with commercial wording where the playbook is about homes. */
export function stepsFor(playbookKey: string, steps: { title: string; detail: string }[], isCommercial: boolean) {
  const over = isCommercial ? COMMERCIAL_STEPS[playbookKey] ?? {} : {};
  return steps.map((s) => over[s.title] ?? s);
}

export function whyUnavailable(sale: SaleKey, p: PracticeProperty): string | null {
  return FLOWS[sale].available(p);
}

export function buildScenario(sale: SaleKey, p: PracticeProperty): Scenario | null {
  const flow = FLOWS[sale];
  if (flow.available(p)) return null;
  const pb = playbookByKey(flow.playbook);
  if (!pb) return null;
  const n = flow.numbers(p);
  const checklist = checklistFor(flow, p);
  const shuffle = (choices: Choice[]) => [...choices].sort((a, b) => (a.label.length % 3) - (b.label.length % 3)); // stable, not always first
  const ownQuiz: Task = {
    kind: 'decision',
    id: 'what-you-own',
    title: 'What are you buying?',
    question: 'Right after this sale, what would you have?',
    choices: shuffle([
      { label: flow.own.correct, correct: true, feedback: `Right. ${pb.youGet}` },
      ...flow.own.wrong.map((w) => ({ label: w, correct: false, feedback: `Not quite. ${pb.youGet}` })),
    ]),
  };

  const stages: Stage[] = [
    {
      key: 'basics',
      title: 'What you’re buying',
      summary: 'What you’d own after this sale, and the steps it follows.',
      tasks: [
        ownQuiz,
        { kind: 'checklist', id: 'official-steps', title: 'The steps for this kind of sale', intro: pb.oneLine, items: stepsFor(pb.key, pb.steps, commercial(p)).map((s) => ({ text: s.title, detail: s.detail })) },
      ],
    },
    {
      key: 'research',
      title: 'Research',
      summary: 'Title, the property, and what would stay after the sale.',
      tasks: [
        ...flow.research(p, n, pb),
        ...(p.watchOut && !environmentalRisk(p) ? [{ kind: 'read', id: 'watch-out', title: 'What a careful buyer notices', body: [p.watchOut] } as Task] : []),
        ...(p.id === 'lot' || p.id === 'commercial-lot' ? [{ kind: 'read', id: 'land', title: 'Land checks', body: ['Confirm zoning and your planned use with the city or county planning department.', 'Ask the utilities what it would take to connect water, sewer and power, and what it costs.'] } as Task] : []),
        ...(commercial(p) && sale !== 'sid' ? commercialResearch(p, sale) : []),
      ],
    },
    { key: 'team', title: 'Your team', summary: 'Reach out to the professionals this sale needs.', tasks: flow.team(p, n) },
    ...(n
      ? [
          {
            key: 'numbers',
            title: 'Run the numbers',
            summary: 'Your maximum, set before the sale.',
            tasks: [numbersTask(n.inputs, n.compare, sale === 'hoa' ? 'The surviving first mortgage is counted as a cost. That is what makes most HOA sales with a paid-up lender a pass.' : 'Everything is in there: repairs with a cushion, surviving liens, title and legal work, holding, selling costs and your target profit.', sale !== 'reo' && sale !== 'short'), bidDecision(n.maxBid, n.compare, sale !== 'reo' && sale !== 'short')],
          },
        ]
      : []),
    {
      key: 'prepare',
      title: 'Documents and money',
      summary: 'Everything ready before the sale.',
      tasks: [{ kind: 'checklist', id: 'buyer-checklist', title: checklist.title, intro: checklist.intro, items: checklist.items }, ...flow.documents(p, n)],
    },
    { key: 'sale', ...flow.saleDay(p, n) },
    { key: 'after', title: 'After the sale', summary: 'Deed, waiting periods, possession and insurance.', tasks: flow.after(p, n, pb) },
  ];

  return {
    id: `${sale}-${p.id}`,
    sale,
    saleTitle: pb.title,
    property: p,
    youGet: pb.youGet,
    headline: `${p.label} · ${pb.short}`,
    sale_facts: commercial(p) ? pb.glance.filter((f) => !HOME_ONLY_FACTS.has(f.label)) : pb.glance,
    stages,
    playbookKey: pb.key,
  };
}

export function allScenarios(): Scenario[] {
  return SALE_ORDER.flatMap((sale) => PRACTICE_PROPERTIES.map((p) => buildScenario(sale, p)).filter((s): s is Scenario => !!s));
}

export function scenarioById(id: string): Scenario | null {
  const m = /^([a-z]+)-(.+)$/.exec(id);
  if (!m || !(m[1] in FLOWS)) return null;
  const p = PRACTICE_PROPERTIES.find((x) => x.id === m[2]);
  return p ? buildScenario(m[1] as SaleKey, p) : null;
}
