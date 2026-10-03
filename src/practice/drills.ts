// "Would you buy it?" drills: one fictional property worked through as missions (value, rent, repairs, liens, numbers),
// then a decision. Feedback scores the process, not whether the visitor picks the same answer. The properties and
// prices are made up for practice; repair ranges are examples, so real bids come from licensed contractors.

export interface PickOption {
  label: string;
  detail?: string;
  /** Whether an experienced investor would pick it. */
  good: boolean;
  why: string;
}

export type Mission =
  | { kind: 'pick'; id: string; title: string; question: string; multi: boolean; options: PickOption[]; lesson: string }
  | { kind: 'estimate'; id: string; title: string; question: string; items: { label: string; low: number; high: number; note: string }[]; lesson: string }
  | { kind: 'facts'; id: string; title: string; lines: { label: string; value: string }[]; lesson: string };

export interface Drill {
  id: string;
  title: string;
  teaser: string;
  /** Rules that depend on a state say which one. */
  where: string;
  facts: { label: string; value: string }[];
  missions: Mission[];
  verdict: { question: string; choices: { label: 'Buy' | 'Investigate' | 'Pass'; feedback: string }[]; expert: string };
}

export const DRILLS: Drill[] = [
  {
    id: 'rental-265',
    title: 'A $265,000 rental house: would you buy it?',
    teaser: 'A dated 3-bedroom listed for $265,000. The seller says it rents for $2,300. Value it, price the repairs, run the numbers.',
    where: 'A fictional house in a fictional neighborhood, bought with a regular investment loan.',
    facts: [
      { label: 'Asking price', value: '$265,000' },
      { label: 'House', value: '3 bedrooms, 2 baths, 1,500 sq ft, built 1998' },
      { label: 'Seller says', value: 'Rents for $2,300 a month; “just needs paint”' },
      { label: 'Your loan', value: '20% down ($53,000), 7% for 30 years: about $1,410 a month' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'comps',
        title: 'Mission 1: What is it worth?',
        question: 'Which recent sales would you use to value this house as it is today? Pick all that fit.',
        multi: true,
        options: [
          { label: 'Sale A: $272,000', detail: '3 bed, 2 bath, 1,480 sq ft, average condition, sold 2 months ago, 0.4 miles away', good: true, why: 'Similar size, age and condition, recent and close: a strong comparable.' },
          { label: 'Sale B: $268,000', detail: '3 bed, 2 bath, 1,550 sq ft, average condition, sold 4 months ago, 0.7 miles away', good: true, why: 'Also similar and recent. Two good comps point to about $270,000.' },
          { label: 'Sale C: $395,000', detail: '4 bed, 3 bath, 2,300 sq ft, fully remodeled, sold 1 month ago, 0.5 miles away', good: false, why: 'Much bigger and remodeled. It tells you what a different house is worth, not this one.' },
          { label: 'Sale D: $240,000', detail: '3 bed, 2 bath, 1,500 sq ft, sold 14 months ago, 0.3 miles away', good: false, why: 'Over a year old. Prices may have moved since, so use it only if nothing recent exists.' },
          { label: 'Sale E: $205,000', detail: '3 bed, 2 bath, 1,510 sq ft, bank sale with fire damage, sold as-is 3 months ago', good: false, why: 'A distressed sale of a damaged house. It sets a floor for a wreck, not the value of a livable home.' },
        ],
        lesson: 'Value comes from recent sales of similar homes nearby, in similar condition. Here that’s about $270,000, so at $265,000 you’d be paying nearly full price for a house that still needs work.',
      },
      {
        kind: 'pick',
        id: 'rent',
        title: 'Mission 2: What will it rent for?',
        question: 'Which monthly rent would you plan on?',
        multi: false,
        options: [
          { label: '$2,300', detail: 'What the seller says, and what a similar house is advertised for online', good: false, why: 'An asking rent isn’t a rent anyone paid, and the seller wants a high number.' },
          { label: '$2,000', detail: 'Two similar houses nearby rented in the last 3 months for $1,950 and $2,050', good: true, why: 'Rents that tenants actually agreed to, for similar houses. Plan on this.' },
          { label: '$2,600', detail: 'A 4-bedroom with a pool around the corner', good: false, why: 'A bigger house with a pool rents for more. It isn’t comparable.' },
        ],
        lesson: 'Use rents that were actually signed, for similar homes, not asking rents or the seller’s number. $300 a month of wishful rent is $3,600 a year that never shows up.',
      },
      {
        kind: 'estimate',
        id: 'repairs',
        title: 'Mission 3: What will the repairs cost?',
        question: 'The inspection found the items below. Enter your total repair budget before you look at the example ranges.',
        items: [
          { label: 'Roof: 21-year-old asphalt shingles, near the end of their life', low: 9000, high: 15000, note: 'Replace soon, or budget for it now.' },
          { label: 'Air conditioning and furnace: 14 years old', low: 7000, high: 12000, note: 'Working, but plan for a replacement within a few years.' },
          { label: 'Water heater: 9 years old', low: 1500, high: 2500, note: 'Often replaced around 8 to 12 years.' },
          { label: 'Flooring: damaged in most rooms', low: 5000, high: 9000, note: 'Needed before a tenant moves in.' },
          { label: 'Kitchen: dated but working', low: 0, high: 15000, note: 'Optional for a rental. Paint and hardware may be enough.' },
        ],
        lesson: '“Just needs paint” was really $22,500 to $53,500 of work. Price what you can’t see too: the roof and the HVAC are the expensive surprises. These ranges are examples; get written bids from licensed contractors in your area.',
      },
      {
        kind: 'facts',
        id: 'numbers',
        title: 'Mission 4: Run the numbers',
        lines: [
          { label: 'Rent', value: '$2,000 a month' },
          { label: 'Vacancy (6%)', value: '−$120' },
          { label: 'Property tax and insurance', value: '−$275' },
          { label: 'Repairs and upkeep (8%)', value: '−$160' },
          { label: 'Big-item reserves (8%)', value: '−$160' },
          { label: 'Property management (about 9%)', value: '−$170' },
          { label: 'Income after operating costs', value: 'About $1,115 a month' },
          { label: 'Loan payment', value: '−$1,410' },
          { label: 'Cash flow', value: 'About −$295 a month' },
        ],
        lesson: 'With realistic rent and costs, this house loses about $295 a month before any of the repairs, and you’d have $53,000 down plus $22,500 or more of work in it. It only works at a much lower price. Try it in the rent calculator.',
      },
    ],
    verdict: {
      question: 'At $265,000, what would you do?',
      choices: [
        { label: 'Buy', feedback: 'At this price the numbers lose money every month, on top of $22,500 or more of repairs. Buying would mean hoping prices rise to bail you out.' },
        { label: 'Investigate', feedback: 'Fair if you mean “investigate a much lower offer.” At the asking price, more research won’t fix the math.' },
        { label: 'Pass', feedback: 'That’s what most experienced investors would do at $265,000. Passing on a bad deal is a good result.' },
      ],
      expert: 'Pass at the asking price. The comps say it’s worth about $270,000 as it is, real rent is about $2,000 rather than $2,300, and the repairs are much more than paint. With 20% down it loses about $295 a month. It would only make sense far below the asking price, and the seller may never agree to that.',
    },
  },
  {
    id: 'trustee-sale-nv',
    title: 'A Nevada foreclosure auction: what would you really owe?',
    teaser: 'A trustee’s sale with a $180,000 opening bid. Read the title report, find what survives the sale, and decide.',
    where: 'A fictional house at a trustee’s sale in Nevada. Lien rules differ by state and by kind of sale.',
    facts: [
      { label: 'Sale', value: 'Trustee’s sale for the first deed of trust, Nevada' },
      { label: 'Opening bid', value: '$180,000, cash or cashier’s check' },
      { label: 'Value as-is (from comps)', value: 'About $290,000' },
      { label: 'Occupied?', value: 'Lights on and a car in the driveway' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'liens',
        title: 'Mission 1: What survives the sale?',
        question: 'The title report lists these. Which could you still have to pay after you buy? Pick all that apply.',
        multi: true,
        options: [
          { label: 'First deed of trust being foreclosed: $184,000', good: false, why: 'This is the loan being foreclosed. The sale pays it from the winning bid; it doesn’t stay on the property.' },
          { label: 'Second mortgage recorded after the first: $30,000', good: false, why: 'A junior loan is wiped out by the senior lender’s foreclosure. Its lender can only claim surplus money from the sale.' },
          { label: 'Unpaid property taxes: $6,100', good: true, why: 'Property taxes come ahead of the mortgage and survive. Budget to pay them.' },
          { label: 'Federal tax lien recorded after the first deed of trust: $18,500', good: true, why: 'It can survive if the IRS wasn’t notified at least 25 days before the sale, and even if it was, the IRS can buy the property back within 120 days. Budget for it until your attorney or title company says otherwise.' },
        ],
        lesson: 'What you bid isn’t what you pay. Add surviving liens to your costs, and have a title company or attorney confirm the list before the sale.',
      },
      {
        kind: 'pick',
        id: 'occupants',
        title: 'Mission 2: Someone lives there',
        question: 'The house looks occupied. What do you plan for?',
        multi: false,
        options: [
          { label: 'Change the locks the day I buy it', good: false, why: 'Never. Occupants have legal rights, and removing them without a court process is illegal.' },
          { label: 'Time and money for a legal process to take possession', good: true, why: 'Right. Former owners and tenants can only be removed through the courts; tenants may have rights to stay longer. Budget months and legal costs.' },
          { label: 'Nothing: the trustee hands over the keys', good: false, why: 'The trustee sells the property as it is, occupants included. Getting possession is your job.' },
        ],
        lesson: 'Plan for occupants: who they are decides how long it takes. Never contact or pressure a homeowner before the sale; deal with occupants only after you own it, through the legal process.',
      },
      {
        kind: 'facts',
        id: 'numbers',
        title: 'Mission 3: Your real cost',
        lines: [
          { label: 'Opening bid', value: '$180,000' },
          { label: 'Property taxes that survive', value: '+$6,100' },
          { label: 'Federal tax lien, until cleared', value: '+$18,500' },
          { label: 'Possession: legal costs and months of holding', value: '+$5,000 to $10,000' },
          { label: 'Repairs, unseen inside', value: '+$25,000 to $50,000 (a guess: you can’t inspect)' },
          { label: 'Real cost', value: 'About $235,000 to $265,000' },
          { label: 'Value as-is', value: 'About $290,000' },
        ],
        lesson: 'A $110,000 “discount” shrinks to $25,000 to $55,000 once you add what survives, possession and repairs you can’t see. And bidding usually goes above the opening bid. Set your walk-away price before the sale with the maximum bid calculator.',
      },
    ],
    verdict: {
      question: 'Would you bid at this sale?',
      choices: [
        { label: 'Buy', feedback: 'Bidding without a title report reviewed by a professional, a walk-away price and a plan for occupants is how auction buyers lose money.' },
        { label: 'Investigate', feedback: 'Good instinct. Confirm the liens with a title company, learn more about the occupants from public records, set a firm walk-away price, and only then decide whether to bid.' },
        { label: 'Pass', feedback: 'A reasonable choice if you don’t have the cash, the time for possession, or a title professional. There will be other sales.' },
      ],
      expert: 'Investigate, then bid only up to a firm walk-away price. The margin is real but much thinner than the opening bid suggests, and it depends on the federal tax lien, the occupants and the inside condition. Experienced buyers price in the worst case and let the deal go if bidding passes their number.',
    },
  },
];

export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
