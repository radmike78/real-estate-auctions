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
          { label: 'Rent (assumed from rented comparables)', value: '$2,000 a month' },
          { label: 'Vacancy and unpaid rent (assumed 6%)', value: '−$120' },
          { label: 'Property tax and insurance (assumed)', value: '−$275' },
          { label: 'Repairs and upkeep (assumed 8% of rent)', value: '−$160' },
          { label: 'Property management (about 9% of rent collected)', value: '−$170' },
          { label: 'Net operating income (NOI): income after operating costs, before the loan', value: 'About $1,275 a month' },
          { label: 'Reserves for big items like the roof and HVAC (assumed 8% of rent)', value: '−$160' },
          { label: 'Debt service: the loan payment, principal and interest', value: '−$1,410' },
          { label: 'Cash flow: what’s left after NOI, reserves and the loan', value: 'About −$295 a month' },
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
  {
    id: 'tax-deed-nv',
    title: 'A Nevada county tax sale: is a $14,000 house a bargain?',
    teaser: 'A Clark County tax sale lists a small house with a $14,000 minimum bid. Find out what a tax deed really gives you.',
    where: 'A fictional house at a county tax sale in Nevada. Tax sales work differently in each state.',
    facts: [
      { label: 'Sale', value: 'County treasurer’s tax sale, Nevada' },
      { label: 'Minimum bid', value: '$14,000 (back taxes, penalties and costs)' },
      { label: 'Value as-is (from comps)', value: 'About $210,000' },
      { label: 'Title search', value: 'A federal tax lien of $22,000 is recorded against the owner' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'what-you-get',
        title: 'Mission 1: What do you get if you win?',
        question: 'What does the winning bidder receive?',
        multi: false,
        options: [
          { label: 'The property, by quitclaim deed from the treasurer, with no warranty of title', good: true, why: 'Right. The deed promises nothing about the title, so problems are yours to find and fix.' },
          { label: 'The property with a guaranteed clean title', good: false, why: 'No. A tax deed is a quitclaim with no warranty.' },
          { label: 'A certificate that earns interest until the owner pays', good: false, why: 'That’s how Arizona’s tax lien sales work, not a Nevada tax deed sale.' },
        ],
        lesson: 'In Nevada, there’s no redemption after the tax sale, but anyone claiming the land, usually the former owner, can sue to recover it for 2 years after the deed is delivered (NRS 361.600). Many title insurers won’t insure until that window passes or a quiet title action is done.',
      },
      {
        kind: 'pick',
        id: 'irs-lien',
        title: 'Mission 2: The federal tax lien',
        question: 'The title search shows a $22,000 federal tax lien. What do you plan for?',
        multi: false,
        options: [
          { label: 'Nothing: the tax sale wipes it out', good: false, why: 'Only if the IRS was properly notified at least 25 days before the sale, and even then the United States can buy the property back within 120 days.' },
          { label: 'Budget for it until an attorney or title company confirms it’s cleared', good: true, why: 'Right. Treat it as a cost until a professional tells you otherwise.' },
        ],
        lesson: 'A low minimum bid isn’t the price. Add liens that may survive, the cost of a quiet title action, and two years in which you may not be able to insure or sell easily.',
      },
      {
        kind: 'facts',
        id: 'numbers',
        title: 'Mission 3: Your real cost (assumptions)',
        lines: [
          { label: 'Winning bid (bidding usually goes above the minimum)', value: 'Assume $60,000' },
          { label: 'Federal tax lien, until cleared', value: '+$22,000' },
          { label: 'Quiet title action and legal work (assumed)', value: '+$5,000 to $10,000' },
          { label: 'Possession, if someone lives there (assumed)', value: '+$3,000 to $8,000' },
          { label: 'Repairs, unseen inside (a guess)', value: '+$20,000 to $45,000' },
          { label: 'Real cost', value: 'About $110,000 to $145,000' },
          { label: 'Value as-is', value: 'About $210,000, but hard to sell or refinance until title is cleared' },
        ],
        lesson: 'The margin is real, but it depends on clearing the title, and your money may be stuck for two years. Set a walk-away price that includes all of this before the sale.',
      },
    ],
    verdict: {
      question: 'Would you bid?',
      choices: [
        { label: 'Buy', feedback: 'Bidding without a title professional’s review and a plan for the two-year window is how tax-sale buyers end up with property they can’t sell.' },
        { label: 'Investigate', feedback: 'Good. Ask a title company whether it will insure, get a quote for quiet title, confirm the IRS notice, and set your walk-away price.' },
        { label: 'Pass', feedback: 'Reasonable if you can’t leave your cash tied up for two years or more.' },
      ],
      expert: 'Investigate, then bid only to a walk-away price that includes the IRS lien, quiet title and the time your money is stuck. A $14,000 minimum bid isn’t the deal; what you can insure and sell is.',
    },
  },
  {
    id: 'hoa-sale-nv',
    title: 'A Nevada HOA foreclosure: does the mortgage survive?',
    teaser: 'An HOA forecloses on a condo for unpaid dues. The opening bid is $9,000. Check what stays with the property.',
    where: 'A fictional condo at an HOA foreclosure sale in Nevada.',
    facts: [
      { label: 'Sale', value: 'HOA (owners’ association) foreclosure, Nevada' },
      { label: 'Opening bid', value: '$9,000' },
      { label: 'Value as-is', value: 'About $240,000' },
      { label: 'First deed of trust', value: '$195,000 owed to a bank' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'mortgage',
        title: 'Mission 1: The Recorder shows the lender paid the HOA’s priority amount 10 days before the sale',
        question: 'What happens to the $195,000 first mortgage?',
        multi: false,
        options: [
          { label: 'It survives: I’d own the condo subject to the $195,000 loan', good: true, why: 'Right. When the lender pays the priority amount at least 5 days before the sale, the first deed of trust stays. The same is true if Fannie Mae or Freddie Mac owns the loan.' },
          { label: 'It’s wiped out: HOA sales always wipe out the mortgage', good: false, why: 'Not when the lender paid, or validly offered, the priority amount at least 5 days before the sale.' },
        ],
        lesson: 'A $9,000 condo with a $195,000 loan attached costs $204,000 or more. That’s why most HOA sales with a paid-up lender are a pass.',
      },
      {
        kind: 'pick',
        id: 'redemption',
        title: 'Mission 2: If you win, when is it yours?',
        question: 'What happens in the first 60 days after the sale?',
        multi: false,
        options: [
          { label: 'The former owner, or a lender ranked below the HOA lien, can redeem by repaying my price plus 1% a month and certain costs', good: true, why: 'Right (NRS 116.31166). You get a certificate of sale first and a deed after 60 days. Upgrades you make aren’t repaid.' },
          { label: 'Nothing: I get the deed the same day and can start renovating', good: false, why: 'You get a certificate of sale first. Spending on upgrades during the 60 days is at risk.' },
        ],
        lesson: 'Plan for a 60-day wait, and spend only on what the law repays if someone redeems.',
      },
    ],
    verdict: {
      question: 'With the mortgage surviving, would you bid?',
      choices: [
        { label: 'Buy', feedback: 'Your real price is the bid plus the $195,000 loan, past-due dues and repairs. On a $240,000 condo, that leaves little or nothing.' },
        { label: 'Investigate', feedback: 'Only worth it if your math, including the surviving loan, still leaves a margin. Here it doesn’t.' },
        { label: 'Pass', feedback: 'That’s what most experienced bidders would do here.' },
      ],
      expert: 'Pass. The first mortgage survives because the lender paid the priority amount in time, so the true price is about $204,000 before dues, repairs and the 60-day wait, on a $240,000 condo.',
    },
  },
  {
    id: 'sheriff-sale-nv',
    title: 'A Nevada sheriff’s sale: should you renovate right away?',
    teaser: 'You can win a house at a sheriff’s sale for $150,000. Then there’s a one-year redemption period.',
    where: 'A fictional house at a sheriff’s execution sale in Nevada.',
    facts: [
      { label: 'Sale', value: 'Sheriff’s sale to satisfy a court judgment, Nevada' },
      { label: 'Your bid', value: '$150,000' },
      { label: 'Value after repairs', value: 'About $280,000' },
      { label: 'Repairs needed', value: 'About $50,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'redemption',
        title: 'Mission 1: What do you get on sale day?',
        question: 'What happens after you win?',
        multi: false,
        options: [
          { label: 'A certificate of sale. For 1 year the debtor, or a creditor with a later judgment or mortgage, can redeem by paying my price plus 1% a month and certain costs', good: true, why: 'Right. You get the deed only after the redemption period ends.' },
          { label: 'The deed, the same day', good: false, why: 'Not while the debtor still has a right to redeem.' },
        ],
        lesson: 'Liens senior to the judgment being enforced stay with the property, so check the title too.',
      },
      {
        kind: 'pick',
        id: 'renovate',
        title: 'Mission 2: Start the $50,000 renovation now?',
        question: 'Do you renovate during the redemption year?',
        multi: false,
        options: [
          { label: 'No. Wait until the redemption period ends', good: true, why: 'Right. If someone redeems, you get your price plus 1% a month and the taxes and earlier-lien payments you made, but not what you spent on repairs.' },
          { label: 'Yes. The sooner it’s fixed, the sooner I can sell', good: false, why: 'If the debtor redeems in month eleven, your repair spending is lost.' },
        ],
        lesson: 'Build a year or more of holding costs into your bid: taxes, insurance and the cost of your money while you wait.',
      },
    ],
    verdict: {
      question: 'Would you bid $150,000?',
      choices: [
        { label: 'Buy', feedback: 'Only if your numbers include a year of holding costs and the chance of being redeemed, which returns your money with 1% a month but no profit from the house.' },
        { label: 'Investigate', feedback: 'Good. Check senior liens, the occupants and your holding costs for a year, then set your walk-away price.' },
        { label: 'Pass', feedback: 'Reasonable if you can’t leave $150,000 idle for a year.' },
      ],
      expert: 'Investigate. The spread looks large, but your cash sits for a year, you can’t safely renovate meanwhile, and a redemption ends the deal with 1% a month instead of a profit.',
    },
  },
  {
    id: 'irs-sale',
    title: 'An IRS auction: what does the 180-day wait cost?',
    teaser: 'The IRS is selling a house seized for unpaid federal taxes. Work out what you own, and when.',
    where: 'A fictional house at an IRS sale. The redemption rules are federal; possession follows the law of the state where the property is.',
    facts: [
      { label: 'Sale', value: 'IRS sale of seized real estate' },
      { label: 'Your bid', value: '$120,000' },
      { label: 'Value after repairs', value: 'About $230,000' },
      { label: 'Repairs needed', value: 'About $35,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'redemption',
        title: 'Mission 1: The 180 days',
        question: 'What happens after the sale?',
        multi: false,
        options: [
          { label: 'The owner, or anyone with an interest or lien, can redeem for 180 days by paying my price plus 20% a year, compounded daily', good: true, why: 'Right. You receive a certificate of sale first and the deed after 180 days if no one redeems.' },
          { label: 'I get the deed immediately, with a clean title', good: false, why: 'You get a certificate of sale first, and the IRS sells only the taxpayer’s interest.' },
        ],
        lesson: 'Other liens may come with the property. Have a title professional check before you bid.',
      },
      {
        kind: 'pick',
        id: 'repairs',
        title: 'Mission 2: Can you flip it within 90 days?',
        question: 'Your plan was a quick flip. Does it work?',
        multi: false,
        options: [
          { label: 'No. The redemption period alone is 180 days; build it into my holding costs', good: true, why: 'Right. Repairs are at risk while the owner can still redeem.' },
          { label: 'Yes, if I start repairs on day one', good: false, why: 'Repairs are at risk for 180 days, because the owner can redeem.' },
        ],
        lesson: 'If someone redeems, you earn 20% a year on your price for the time it was held, which is a good return, but not the flip profit you planned.',
      },
    ],
    verdict: {
      question: 'Would you bid $120,000?',
      choices: [
        { label: 'Buy', feedback: 'Only with at least six months of holding costs in your numbers and a title check for other liens.' },
        { label: 'Investigate', feedback: 'Good. Check the title, the occupants and your holding costs, then set your walk-away price.' },
        { label: 'Pass', feedback: 'Reasonable if you need your cash back within six months.' },
      ],
      expert: 'Investigate. The redemption premium protects you if the owner redeems, but your money is tied up for at least 180 days and the title isn’t guaranteed. Price in the wait and the title work.',
    },
  },
  {
    id: 'bank-owned',
    title: 'A bank-owned house: what does the inspection change?',
    teaser: 'A Fannie Mae-owned house is listed at $310,000. You’re an investor, and the inspection finds a problem.',
    where: 'A fictional bank-owned (REO) house sold through a listing agent. The rules shown are for Fannie Mae and Freddie Mac homes.',
    facts: [
      { label: 'Seller', value: 'Fannie Mae, through a listing agent' },
      { label: 'List price', value: '$310,000' },
      { label: 'Value from comps', value: 'About $320,000 after paint and flooring' },
      { label: 'Your plan', value: 'Keep it as a rental' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'first-look',
        title: 'Mission 1: When can you make an offer?',
        question: 'The house was listed yesterday. Can an investor offer now?',
        multi: false,
        options: [
          { label: 'Not yet: for the first 30 days, offers come only from people who will live there, public entities and nonprofits', good: true, why: 'Right. That’s Fannie Mae and Freddie Mac’s “First Look” period.' },
          { label: 'Yes, any buyer can offer from day one', good: false, why: 'Not on Fannie Mae or Freddie Mac homes during First Look.' },
        ],
        lesson: 'Use the 30 days to run your numbers and line up financing, so your offer is ready when investors can bid.',
      },
      {
        kind: 'pick',
        id: 'inspection',
        title: 'Mission 2: The inspection finds a cracked sewer line',
        question: 'A camera inspection shows roots and a cracked sewer line. Replacement is estimated at $8,000 to $15,000. The sale is as-is. What can you do within the inspection period?',
        multi: true,
        options: [
          { label: 'Ask for a price reduction or credit, with the inspection report', good: true, why: 'As-is sellers often won’t repair, but they may lower the price. It never hurts to ask with evidence.' },
          { label: 'Cancel within the inspection period if the numbers no longer work', good: true, why: 'That’s what the inspection period is for. Check your contract for the exact deadline.' },
          { label: 'Close anyway and hope the line lasts', good: false, why: 'A failed sewer line can flood the house and stop you from renting it.' },
          { label: 'Wait until after closing to decide', good: false, why: 'After the inspection period, you lose the easy way out.' },
        ],
        lesson: 'As-is doesn’t mean you can’t inspect. It means the seller won’t fix things: use the inspection period to renegotiate or walk away.',
      },
    ],
    verdict: {
      question: 'The seller won’t lower the price. What do you do?',
      choices: [
        { label: 'Buy', feedback: 'Only if your rental numbers still work with $15,000 more of repairs on top of paint and flooring.' },
        { label: 'Investigate', feedback: 'Get a plumber’s written bid before the inspection period ends, then decide.' },
        { label: 'Pass', feedback: 'A sound choice if the repair erases your margin. Another bank-owned home will come along.' },
      ],
      expert: 'Get a firm repair bid inside the inspection period and rerun the rental numbers. If $310,000 plus the sewer line still meets your target, buy; if not, cancel in time.',
    },
  },
  {
    id: 'short-sale',
    title: 'A short sale: can you close in 60 days?',
    teaser: 'A homeowner owes more than the house is worth, and the lender must approve any sale. Your hard-money loan expires in 60 days.',
    where: 'A fictional short sale through a listing agent. Never contact homeowners in foreclosure yourself; work through the listing agent.',
    facts: [
      { label: 'List price', value: '$285,000, subject to lender approval' },
      { label: 'Owed on the first mortgage', value: '$330,000' },
      { label: 'Foreclosure', value: 'A trustee’s sale is scheduled in about 60 days' },
      { label: 'Your financing', value: 'A hard-money approval good for 60 days' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'timing',
        title: 'Mission 1: How long will approval take?',
        question: 'What timeline do you plan for?',
        multi: false,
        options: [
          { label: 'Weeks to months, with no guarantee the lender approves', good: true, why: 'Right. The lender reviews a full package and orders its own valuation before it decides.' },
          { label: 'About a week, like a normal sale', good: false, why: 'Short sales need the lender’s approval, which takes much longer.' },
        ],
        lesson: 'Short sales reward patience. Financing that expires quickly is a poor fit.',
      },
      {
        kind: 'pick',
        id: 'foreclosure-date',
        title: 'Mission 2: The trustee’s sale date',
        question: 'What do you ask the listing agent?',
        multi: false,
        options: [
          { label: 'Whether a foreclosure sale date is set, and whether the lender has postponed it for the short sale', good: true, why: 'Right. The lender can still foreclose while a short sale is pending.' },
          { label: 'Nothing. The short sale stops the foreclosure', good: false, why: 'It doesn’t, unless the lender agrees to postpone.' },
        ],
        lesson: 'Know both dates: when the lender may approve, and when the house may be sold at auction instead.',
      },
    ],
    verdict: {
      question: 'With 60-day financing, do you offer?',
      choices: [
        { label: 'Buy', feedback: 'Your financing may expire before the lender answers.' },
        { label: 'Investigate', feedback: 'Good: ask whether the sale date is postponed, and line up financing that can wait.' },
        { label: 'Pass', feedback: 'Reasonable if you can’t get financing that lasts several months.' },
      ],
      expert: 'Investigate, or pass. The lender sets the price near market value and may take months, and the foreclosure may go ahead. Offer only with financing and patience that fit the timeline.',
    },
  },
  {
    id: 'tax-lien-az',
    title: 'An Arizona tax lien: what will you really earn?',
    teaser: 'You can bid on a $2,400 tax lien. The rate starts at 16%, and bidders bid it down.',
    where: 'A fictional lien at an Arizona county tax lien sale. Arizona sells liens, not property.',
    facts: [
      { label: 'Sale', value: 'County treasurer’s tax lien sale, Arizona, in February' },
      { label: 'Lien amount', value: '$2,400 of taxes, interest and fees' },
      { label: 'Starting rate', value: '16% a year, bid down' },
      { label: 'Parcel', value: 'A narrow strip of vacant land with no road access' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'what-you-get',
        title: 'Mission 1: What do you buy?',
        question: 'If you win, what do you get?',
        multi: false,
        options: [
          { label: 'A certificate of purchase: a lien that earns interest at my bid rate until the owner pays', good: true, why: 'Right. You can ask a court for a treasurer’s deed only after 3 years, if the lien is still unpaid.' },
          { label: 'The land', good: false, why: 'Arizona sells liens, not the property.' },
        ],
        lesson: 'Most liens are redeemed: plan on interest, not on getting the land.',
      },
      {
        kind: 'facts',
        id: 'returns',
        title: 'Mission 2: What the rate means in dollars (simple interest, per year)',
        lines: [
          { label: 'Won at 16%', value: '$384 a year' },
          { label: 'Won at 6%', value: '$144 a year' },
          { label: 'Won at 2%', value: '$48 a year' },
          { label: 'Processing fee, not paid back', value: 'Up to $10 per lien' },
        ],
        lesson: 'Competition often pushes popular liens far below 16%. Your money is tied up until the owner pays, and the payoff date is unknown.',
      },
      {
        kind: 'pick',
        id: 'parcel',
        title: 'Mission 3: What if the owner never pays?',
        question: 'This parcel is a landlocked strip. Is it a good lien to bid on?',
        multi: false,
        options: [
          { label: 'No. Bid only on parcels I’d actually want to own', good: true, why: 'Right. If the lien isn’t redeemed, you may end up paying for a lawsuit to own land no one wants.' },
          { label: 'Yes. Unwanted land gets less competition, so a higher rate', good: false, why: 'A higher rate on land no one will pay taxes on can mean you’re the one stuck with it.' },
        ],
        lesson: 'Foreclosing the right to redeem is a lawsuit in superior court, filed within 10 years, and most buyers hire an attorney.',
      },
    ],
    verdict: {
      question: 'Would you bid on this lien?',
      choices: [
        { label: 'Buy', feedback: 'The rate may look good, but the parcel is the kind of land that’s least likely to be redeemed and hardest to use.' },
        { label: 'Investigate', feedback: 'Look at the parcel’s access, zoning and value first. Here, that research points to a pass.' },
        { label: 'Pass', feedback: 'Good call. Choose liens on parcels you’d be glad to own.' },
      ],
      expert: 'Pass on this one. Tax liens are a slow, modest-interest investment, not a cheap way to get property, and a landlocked strip is the parcel you least want to end up owning.',
    },
  },
  {
    id: 'trustee-sale-ca',
    title: 'A California trustee’s sale: is your winning bid final?',
    teaser: 'You win a duplex at a California foreclosure auction for $450,000. Then the clock starts.',
    where: 'A fictional duplex at a trustee’s sale in California. These rules apply to 1–4 unit homes.',
    facts: [
      { label: 'Sale', value: 'Trustee’s sale, California' },
      { label: 'Property', value: 'A 2-unit building; one unit is rented' },
      { label: 'Your winning bid', value: '$450,000 by cashier’s check' },
      { label: 'You plan to', value: 'Rent both units, not live there' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'final',
        title: 'Mission 1: When is the sale final?',
        question: 'You’re not moving in. When is the property yours?',
        multi: false,
        options: [
          { label: 'Not for at least 15 days. Eligible tenants and bidders can give notice, then have up to 45 days after the sale to match or beat my bid', good: true, why: 'Right (Civil Code 2924m). Title stays with the owner until the sale is final.' },
          { label: 'Immediately, when the auctioneer accepts my bid', good: false, why: 'Only a prospective owner-occupant who signs the required declaration gets a final sale right away.' },
          { label: 'After a 1-year redemption period', good: false, why: 'California trustee’s sales have no redemption period; the 2924m window is a different rule.' },
        ],
        lesson: 'Plan for the 15 to 45 day window: keep your funds available and don’t start work on a property that isn’t yours yet.',
      },
      {
        kind: 'pick',
        id: 'meanwhile',
        title: 'Mission 2: What do you do while you wait?',
        question: 'Pick what’s sensible during the window.',
        multi: true,
        options: [
          { label: 'Keep my funds ready and line up insurance to start when the sale is final', good: true, why: 'Right.' },
          { label: 'Line up a property manager and a plan for the tenant, who has legal rights', good: true, why: 'Right. Tenants keep protections after a foreclosure.' },
          { label: 'Change the locks and start renovating', good: false, why: 'It isn’t yours yet, and occupants can only be removed through the legal process.' },
        ],
        lesson: 'Another buyer may end up with the property. Budget your time accordingly and keep looking.',
      },
    ],
    verdict: {
      question: 'Was bidding a good idea?',
      choices: [
        { label: 'Buy', feedback: 'Fine if your numbers worked, as long as you planned for the window and the tenant.' },
        { label: 'Investigate', feedback: 'Wise before the next sale: know the 2924m window and tenant rights before you bid.' },
        { label: 'Pass', feedback: 'Reasonable if your cash can’t sit idle for up to 45 days without a guaranteed property.' },
      ],
      expert: 'Bidding can make sense, but treat the win as conditional for up to 45 days, keep the money ready, and plan for the tenant. Never start work before the sale is final.',
    },
  },
];

export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
