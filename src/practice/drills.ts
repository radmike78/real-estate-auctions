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
  /** Commercial property: listed in its own group on the Practice page. */
  commercial?: boolean;
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
  {
    id: 'tax-deed-ca',
    title: 'A California tax sale: is the $9,000 lot a bargain?',
    teaser: 'A county tax collector lists a vacant lot with a $9,000 minimum bid. Check what the tax deed wipes out, and what it doesn’t.',
    where: 'A fictional lot at a county tax sale in California. Each county sets its own deposit, payment deadline and auction website.',
    facts: [
      { label: 'Sale', value: 'County treasurer-tax collector’s tax deed auction, California' },
      { label: 'Minimum bid', value: '$9,000 (taxes, penalties and costs)' },
      { label: 'Parcel', value: 'Vacant residential lot; the county map shows no road frontage' },
      { label: 'Title report', value: 'A recorded sewer assessment and a utility easement' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'research',
        title: 'Mission 1: What do you check first?',
        question: 'The county map shows no road touching the lot. What does that mean for you?',
        multi: false,
        options: [
          { label: 'Confirm legal access before bidding; a lot with no legal access may be nearly impossible to build on or sell', good: true, why: 'Right. Sales are final and as is (R&T 3692.3). Check access, zoning and whether the parcel is buildable.' },
          { label: 'Walk onto the lot to look around before the sale', good: false, why: 'No. Look from public roads only; counties such as Los Angeles say you may not trespass.' },
          { label: 'Nothing: a low minimum bid means a bargain', good: false, why: 'A low price often reflects a problem like no access.' },
        ],
        lesson: 'Research every parcel before you bid: the map, access, zoning and recorded liens. Sales are final and as is.',
      },
      {
        kind: 'pick',
        id: 'survives',
        title: 'Mission 2: What stays with the property?',
        question: 'Which of these can still be there after you get the tax deed? Pick all that apply.',
        multi: true,
        options: [
          { label: 'A private mortgage recorded against the lot', good: false, why: 'Most private liens, such as mortgages and judgments, are wiped out by the tax deed.' },
          { label: 'The recorded sewer assessment', good: true, why: 'Some special assessments survive (R&T 3712). Budget for it.' },
          { label: 'The utility easement', good: true, why: 'Easements and recorded restrictions stay.' },
          { label: 'Future property tax installments', good: true, why: 'Future taxes are always yours once you own it.' },
        ],
        lesson: 'Read R&T 3712 and your county’s list of liens that survive, and ask a title company before you bid.',
      },
      {
        kind: 'pick',
        id: 'after',
        title: 'Mission 3: You won. When can you build?',
        question: 'What should you plan for after the sale?',
        multi: false,
        options: [
          { label: 'Wait for the recorded deed, then expect about a year before title insurance and major work', good: true, why: 'Right. A challenge must start within 1 year of the deed (R&T 3725), and counties such as Los Angeles and San Diego advise waiting about a year before improving.' },
          { label: 'Start building the day after the auction', good: false, why: 'Title doesn’t pass until the deed is recorded, often about 60 to 70 days later in Los Angeles County.' },
        ],
        lesson: 'Pay in the exact form and by the deadline your county sets; a missed deadline can cost your deposit.',
      },
    ],
    verdict: {
      question: 'Would you bid on this lot?',
      choices: [
        { label: 'Buy', feedback: 'Without legal access, you may own a lot no one can build on or wants to buy.' },
        { label: 'Investigate', feedback: 'Good: confirm legal access and the surviving assessment with a title company first.' },
        { label: 'Pass', feedback: 'Sensible unless you can confirm legal access. Choose a lot with clear access instead.' },
      ],
      expert: 'Investigate, and pass unless legal access is confirmed. Then budget for the sewer assessment, the easement, future taxes and a year of waiting before you can insure or improve it.',
    },
  },
  {
    id: 'sheriff-sale-ca',
    title: 'A California sheriff’s sale: what does the notice tell you?',
    teaser: 'A court ordered a house sold in a judicial foreclosure. The notice says it’s sold subject to a right of redemption.',
    where: 'A fictional house at a sheriff’s sale after a judicial foreclosure in California.',
    facts: [
      { label: 'Sale', value: 'Sheriff’s sale (levying officer) after a judicial foreclosure, California' },
      { label: 'Notice', value: 'Subject to a right of redemption; the sale won’t cover the full debt' },
      { label: 'Your bid', value: '$380,000' },
      { label: 'Payment', value: 'Cash, certified or cashier’s check' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'redemption',
        title: 'Mission 1: What do you get on sale day?',
        question: 'The notice says the sale is subject to redemption and won’t cover the debt. What happens?',
        multi: false,
        options: [
          { label: 'A certificate of sale. The owner can redeem for 1 year, and I get the deed only after that', good: true, why: 'Right. It’s 3 months if the sale covers the debt and 1 year if it doesn’t (CCP 729.030).' },
          { label: 'A deed the same day', good: false, why: 'Not when the sale is subject to redemption.' },
        ],
        lesson: 'If someone redeems, you get your price plus taxes, insurance, upkeep and some senior payments, with interest, generally 10% a year (CCP 729.060).',
      },
      {
        kind: 'pick',
        id: 'pay',
        title: 'Mission 2: Paying for it',
        question: 'Your bid is over $5,000. How can you pay?',
        multi: false,
        options: [
          { label: 'In full at the sale, or a deposit of $5,000 or 10%, whichever is greater, with the rest plus costs and interest within 10 days', good: true, why: 'Right (CCP 701.590). A bidder who defaults can owe the shortfall and costs.' },
          { label: 'A deposit now and a mortgage in 60 days', good: false, why: 'The balance is due within 10 days. Arrange your money before the sale.' },
        ],
        lesson: 'You have no right to possession until you pay in full.',
      },
      {
        kind: 'pick',
        id: 'meanwhile',
        title: 'Mission 3: The redemption year',
        question: 'What can you sensibly spend on during the year?',
        multi: true,
        options: [
          { label: 'Taxes, insurance and needed upkeep, with receipts', good: true, why: 'Right. These are added to the redemption price.' },
          { label: 'A new kitchen to raise the value', good: false, why: 'Upgrades aren’t repaid if the owner redeems.' },
          { label: 'Collecting rent from whoever is in possession, knowing I repay it if the owner redeems', good: true, why: 'Right (CCP 729.090).' },
        ],
        lesson: 'Liens senior to the one being foreclosed stay with the property. Get a title report before you bid.',
      },
    ],
    verdict: {
      question: 'Would you bid $380,000?',
      choices: [
        { label: 'Buy', feedback: 'Only if a year of holding costs and the chance of being redeemed still leave your target.' },
        { label: 'Investigate', feedback: 'Good: check senior liens and your holding costs for a year, and line up the full payment.' },
        { label: 'Pass', feedback: 'Reasonable if you can’t tie up $380,000 for a year without income you control.' },
      ],
      expert: 'Investigate. A redemption year means a certificate, not a deed, limited spending, and a return capped at about 10% a year if the owner redeems. Price that in, and confirm senior liens first.',
    },
  },
  {
    id: 'tax-sale-ut',
    title: 'A Utah county tax sale: can you back out?',
    teaser: 'A Utah county auditor’s May tax sale lists a cabin lot. The minimum bid is what’s owed. Learn what the tax deed gives you.',
    where: 'A fictional lot at a county tax sale in Utah. Each county sets its own deposit, payment method and premium.',
    facts: [
      { label: 'Sale', value: 'County auditor’s annual tax sale (May or June), Utah' },
      { label: 'Minimum bid', value: 'All delinquent taxes, penalties, interest and costs: $6,200' },
      { label: 'Parcel', value: 'A cabin lot; the recorded description is unclear' },
      { label: 'Payment', value: 'Wire only, plus a 5% buyer’s premium, in this example county' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'what-you-get',
        title: 'Mission 1: What do you get?',
        question: 'If you win, what do you receive?',
        multi: false,
        options: [
          { label: 'A tax deed recorded after the county accepts my bid, with no promises about title or possession', good: true, why: 'Right. It isn’t a warranty deed.' },
          { label: 'A warranty deed with clean title', good: false, why: 'No. The county makes no promises about title or possession.' },
        ],
        lesson: 'Ask a title company whether it will insure a tax deed from this county before you bid.',
      },
      {
        kind: 'pick',
        id: 'rescind',
        title: 'Mission 2: Can you change your mind?',
        question: 'You win, then find out the description doesn’t match the land you looked at. Can you cancel?',
        multi: false,
        options: [
          { label: 'No. Once the auditor closes the sale on a parcel, I can’t rescind my bid', good: true, why: 'Right (59-2-1351.1(6)). Confirm the description matches the land before you bid.' },
          { label: 'Yes, within 30 days', good: false, why: 'There’s no cooling-off period.' },
        ],
        lesson: 'If a tax title is later found invalid, your claim is limited to the smaller of the taxes, interest and penalties or what you paid (59-2-1352). Bid only what you can afford to lose while title is uncertain.',
      },
      {
        kind: 'pick',
        id: 'redeem',
        title: 'Mission 3: The morning of the sale',
        question: 'Can the owner still keep the property?',
        multi: false,
        options: [
          { label: 'Yes, anyone can redeem for the owner until the sale begins, so check the updated list that morning', good: true, why: 'Right. There’s no redemption after the sale (59-2-1346).' },
          { label: 'Yes, for one year after the sale', good: false, why: 'Utah tax sales have no redemption after the sale.' },
        ],
        lesson: 'Read the auditor’s notice early: deposit deadline, payment method, buyer’s premium, and whether the deposit counts toward the price.',
      },
    ],
    verdict: {
      question: 'Would you bid on this lot?',
      choices: [
        { label: 'Buy', feedback: 'With an unclear description and no right to back out, you could pay for land you can’t identify.' },
        { label: 'Investigate', feedback: 'Good: have a title company or surveyor match the description to the land first.' },
        { label: 'Pass', feedback: 'Sensible if the description can’t be confirmed before the sale.' },
      ],
      expert: 'Investigate, and pass if the description can’t be matched to the land. Bids can’t be rescinded, the deed carries no warranty, and your claim if title fails is limited.',
    },
  },
  {
    id: 'trustee-sale-ut',
    title: 'A Utah trustee’s sale: which loan is foreclosing?',
    teaser: 'A Utah trustee is auctioning a house at the courthouse. The opening bid looks low. Read the notice before you bid.',
    where: 'A fictional house at a trustee’s sale in Utah.',
    facts: [
      { label: 'Sale', value: 'Trustee’s sale at a courthouse, Utah' },
      { label: 'Loan being foreclosed', value: 'A $45,000 second mortgage' },
      { label: 'Older first mortgage', value: '$260,000' },
      { label: 'Value as-is', value: 'About $380,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'first-loan',
        title: 'Mission 1: The first mortgage',
        question: 'The second mortgage is foreclosing. What happens to the older $260,000 first mortgage?',
        multi: false,
        options: [
          { label: 'It stays: I’d take the house subject to it', good: true, why: 'Right. The sale wipes out interests that came after the loan being foreclosed, not older ones.' },
          { label: 'It’s wiped out by the sale', good: false, why: 'Only later interests are wiped out. The older first mortgage stays.' },
        ],
        lesson: 'Get a title report. If a second loan is foreclosing, the first loan stays, and your real price is your bid plus that loan.',
      },
      {
        kind: 'pick',
        id: 'bid',
        title: 'Mission 2: At the auction',
        question: 'What’s true about bidding in Utah?',
        multi: true,
        options: [
          { label: 'Every bid is an irrevocable offer, so I set my maximum before I arrive', good: true, why: 'Right.' },
          { label: 'I pay as the trustee directs, and confirm the deposit and payment method with the trustee’s office first', good: true, why: 'Right (57-1-27).' },
          { label: 'After the sale, the owner has a year to redeem', good: false, why: 'A trustee’s deed conveys without a right of redemption.' },
        ],
        lesson: 'The trustee records your deed within five business days after you pay (57-1-28).',
      },
    ],
    verdict: {
      question: 'Would you bid?',
      choices: [
        { label: 'Buy', feedback: 'Remember your price is the bid plus the $260,000 first mortgage on a $380,000 house.' },
        { label: 'Investigate', feedback: 'Good: confirm the loan amounts with a title report and set a maximum that includes the first mortgage.' },
        { label: 'Pass', feedback: 'Reasonable if the bid plus the first mortgage leaves too little margin.' },
      ],
      expert: 'Investigate and price in the surviving first mortgage. A low opening bid on a second mortgage’s sale isn’t the price of the house.',
    },
  },
  {
    id: 'sheriff-sale-ut',
    title: 'A Utah sheriff’s sale: the 180 days',
    teaser: 'A Utah sheriff sells a house to pay a court judgment. Then the owner has 180 days to redeem.',
    where: 'A fictional house at a sheriff’s sale in Utah.',
    facts: [
      { label: 'Sale', value: 'Sheriff’s sale on a judgment, Utah' },
      { label: 'Your bid', value: '$210,000' },
      { label: 'Value after repairs', value: 'About $330,000' },
      { label: 'Repairs needed', value: 'About $40,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'what-you-get',
        title: 'Mission 1: What do you get?',
        question: 'After you pay, what do you receive?',
        multi: false,
        options: [
          { label: 'A certificate of sale. The owner, or a junior lienholder, can redeem within 180 days for my price plus 6%, plus recorded costs plus 6%', good: true, why: 'Right (URCP 69C). You get the deed only if no one redeems.' },
          { label: 'The deed, the same day', good: false, why: 'You get a certificate of sale first.' },
        ],
        lesson: 'The sale transfers only the defendant’s interest. Check the title for older mortgages and liens before bidding.',
      },
      {
        kind: 'pick',
        id: 'costs',
        title: 'Mission 2: Paying taxes and insurance meanwhile',
        question: 'You pay the property taxes and insurance during the 180 days. How do you protect that money?',
        multi: false,
        options: [
          { label: 'Record a notice of each amount with the county recorder, so it’s added to the redemption price', good: true, why: 'Right. Costs not recorded are waived (URCP 69C).' },
          { label: 'Keep the receipts at home', good: false, why: 'Without a recorded notice, you can’t add them to the redemption price.' },
        ],
        lesson: 'Spend only on what protects the property. If someone asks in writing for an accounting of rents, you must give it, or the redemption period can be extended.',
      },
    ],
    verdict: {
      question: 'Would you bid $210,000?',
      choices: [
        { label: 'Buy', feedback: 'Only with six months of holding costs in your numbers, and no renovation until the period ends.' },
        { label: 'Investigate', feedback: 'Good: check the title, ask the sheriff’s civil office how to pay, and set your maximum.' },
        { label: 'Pass', feedback: 'Reasonable if you need to start the $40,000 renovation right away.' },
      ],
      expert: 'Investigate. If the owner redeems, you earn 6% plus recorded costs; if not, you can renovate only after 180 days. Price in the wait and the older liens.',
    },
  },
  {
    id: 'trustee-sale-az',
    title: 'An Arizona trustee’s sale: are you ready by 5 p.m. tomorrow?',
    teaser: 'An Arizona trustee is auctioning a house. You need $10,000 to bid and the rest by the next business day.',
    where: 'A fictional house at a trustee’s sale in Arizona.',
    facts: [
      { label: 'Sale', value: 'Trustee’s sale, Arizona' },
      { label: 'Loan being foreclosed', value: 'The first deed of trust' },
      { label: 'Your maximum bid', value: '$300,000' },
      { label: 'Your money', value: '$40,000 in savings and a hard-money lender who needs 10 days to fund' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'pay',
        title: 'Mission 1: Paying for it',
        question: 'If you win at $300,000, when is the rest due?',
        multi: false,
        options: [
          { label: 'By 5 p.m. Arizona time the next business day, after a $10,000 deposit to bid', good: true, why: 'Right (A.R.S. 33-810 and 33-811).' },
          { label: 'Within 30 days, like a normal closing', good: false, why: 'No. Miss the next-day deadline and you lose the $10,000 deposit, may owe the trustee’s losses and fees, and can be barred from that trustee’s future sales.' },
        ],
        lesson: 'With a lender who needs 10 days, you can’t meet the deadline. Have cash or funding confirmed before you bid.',
      },
      {
        kind: 'pick',
        id: 'final',
        title: 'Mission 2: After you pay',
        question: 'What’s true once you’ve paid?',
        multi: true,
        options: [
          { label: 'The sale is final: there’s no redemption', good: true, why: 'Right (A.R.S. 33-811).' },
          { label: 'Liens older than the deed of trust stay with the house', good: true, why: 'Right. The sale clears junior liens, not senior ones. Order a title report before the sale.' },
          { label: 'The trustee hands over the keys and removes any occupants', good: false, why: 'Occupants are yours to handle: a written demand, then a court eviction (forcible detainer) case if needed. Bona fide tenants generally get at least 90 days under federal law.' },
        ],
        lesson: 'The trustee submits your deed for recording within 7 business days after payment. Work only with the trustee; never contact the homeowner.',
      },
      {
        kind: 'pick',
        id: 'morning',
        title: 'Mission 3: The day before',
        question: 'Why call the trustee the day before and the morning of the sale?',
        multi: false,
        options: [
          { label: 'The owner can reinstate the loan until 5 p.m. the last business day before, and the trustee can postpone the sale', good: true, why: 'Right (A.R.S. 33-813 and 33-810). Many sales don’t happen on the first date.' },
          { label: 'To ask the trustee to hold the house for me', good: false, why: 'Trustees sell at public auction to the highest bidder.' },
        ],
        lesson: 'Confirm the sale is still on, the deposit amount and the payment forms the trustee accepts.',
      },
    ],
    verdict: {
      question: 'With funding that takes 10 days, do you bid?',
      choices: [
        { label: 'Buy', feedback: 'You’d likely miss the next-day deadline and lose your $10,000 deposit.' },
        { label: 'Investigate', feedback: 'Fine for researching the house, but don’t bid until your money can arrive by 5 p.m. the next business day.' },
        { label: 'Pass', feedback: 'Right for this sale. Line up cash or same-day funding before the next one.' },
      ],
      expert: 'Pass on this sale. Arizona trustee’s sales need $10,000 to bid and the balance the next business day, and the sale is final. Bid only when the money is ready and the title report is read.',
    },
  },
  {
    id: 'sheriff-sale-az',
    title: 'An Arizona sheriff’s sale: 30 days or 6 months?',
    teaser: 'An Arizona sheriff sells a house after a court foreclosure. How long you wait depends on what the court found.',
    where: 'A fictional house at a sheriff’s sale in Arizona.',
    facts: [
      { label: 'Sale', value: 'Sheriff’s sale after a judicial foreclosure, Arizona' },
      { label: 'Your bid', value: '$190,000' },
      { label: 'Judgment', value: 'The court did not find the property abandoned' },
      { label: 'Repairs needed', value: 'About $35,000' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'wait',
        title: 'Mission 1: How long is the redemption period?',
        question: 'The court did not find the property abandoned. How long can the owner redeem?',
        multi: false,
        options: [
          { label: '6 months, then junior creditors may redeem in turns', good: true, why: 'Right (A.R.S. 12-1282). It’s 30 days only if the court found the property abandoned.' },
          { label: '30 days', good: false, why: 'That’s only when the court found the property abandoned.' },
          { label: 'None: sheriff’s sales are final', good: false, why: 'You get a certificate of sale first, and a sheriff’s deed only after every redemption period ends.' },
        ],
        lesson: 'Read the judgment in the court case: it says what’s being sold and whether the court found the property abandoned.',
      },
      {
        kind: 'pick',
        id: 'redeemed',
        title: 'Mission 2: If someone redeems',
        question: 'The owner redeems after 5 months. What do you get?',
        multi: false,
        options: [
          { label: 'My price plus 8%, plus taxes or assessments I paid, with interest', good: true, why: 'Right (A.R.S. 12-1285). Keep receipts for what you pay.' },
          { label: 'The property’s full value', good: false, why: 'Redemption repays your price plus 8% and certain costs, not the value.' },
        ],
        lesson: 'Repairs aren’t in that list. Hold off on the $35,000 of work until the redemption periods end.',
      },
    ],
    verdict: {
      question: 'Would you bid $190,000?',
      choices: [
        { label: 'Buy', feedback: 'Only if waiting 6 months, and possibly getting 8% back instead of the house, still fits your plan.' },
        { label: 'Investigate', feedback: 'Good: read the judgment, pull title for older liens, and confirm with the sheriff’s civil unit how to pay within 5 working days.' },
        { label: 'Pass', feedback: 'Reasonable if you need the house, not a possible 8% return, within six months.' },
      ],
      expert: 'Investigate. You buy only the debtor’s interest, wait 6 months here, and may be paid back with 8% instead. Price the wait and senior liens before you bid.',
    },
  },
  {
    id: 'retail-strip',
    commercial: true,
    title: 'A $1.8 million retail strip: whose income do you trust?',
    teaser: 'A six-unit retail strip is priced at a 7.5% cap rate on the seller’s pro forma. Check the real income before you value it.',
    where: 'A fictional retail strip center bought from a private seller through a commercial broker.',
    facts: [
      { label: 'Asking price', value: '$1,800,000' },
      { label: 'Seller’s pro forma NOI', value: '$135,000 a year (7.5% cap rate)' },
      { label: 'Last 12 months, actual NOI', value: '$112,000 a year' },
      { label: 'Leases', value: 'Two tenants are month-to-month; one lease ends in 4 months' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'income',
        title: 'Mission 1: Which income do you value?',
        question: 'Which NOI should you use to value the property?',
        multi: false,
        options: [
          { label: 'The actual last-12-months NOI, checked against the leases', good: true, why: 'Right. Value what the property earns now, not what the seller hopes it could earn.' },
          { label: 'The seller’s pro forma, since that’s what the broker advertises', good: false, why: 'A pro forma is a projection, often with every space leased at top rents.' },
        ],
        lesson: 'Value = NOI ÷ cap rate. At 7.5% on the actual $112,000, it’s worth about $1,493,000, not $1,800,000.',
      },
      {
        kind: 'pick',
        id: 'verify',
        title: 'Mission 2: Is the rent roll real?',
        question: 'How do you confirm what the tenants actually pay and owe? Pick all that apply.',
        multi: true,
        options: [
          { label: 'Read every lease, not just the rent roll summary', good: true, why: 'Right. Leases show rent, increases, options, who pays which costs, and any special rights.' },
          { label: 'Get estoppel certificates: each tenant confirms its rent, deposit, lease term and any claims', good: true, why: 'Right. Estoppels catch side deals and disputes the seller didn’t mention.' },
          { label: 'Trust the broker’s marketing summary', good: false, why: 'The summary is marketing. Verify against the leases and estoppels.' },
        ],
        lesson: 'Check which leases are triple-net (tenants pay most taxes, insurance and maintenance) and which aren’t: it changes your expenses a lot.',
      },
      {
        kind: 'facts',
        id: 'risk',
        title: 'Mission 3: The lease risk',
        lines: [
          { label: 'Value on actual NOI at a 7.5% cap rate', value: 'About $1,493,000' },
          { label: 'Asking price', value: '$1,800,000' },
          { label: 'Gap', value: 'About $307,000 of hoped-for income' },
          { label: 'Tenants who could leave within months', value: 'Three of six' },
        ],
        lesson: 'With half the tenants able to leave soon, even the actual NOI isn’t secure. Price in vacancy, leasing costs and months to re-lease.',
      },
    ],
    verdict: {
      question: 'At $1,800,000, what do you do?',
      choices: [
        { label: 'Buy', feedback: 'You’d pay for income the property doesn’t earn, with half the tenants able to leave.' },
        { label: 'Investigate', feedback: 'Good, at a lower price: read the leases, get estoppels, and value on actual NOI with a cushion for turnover.' },
        { label: 'Pass', feedback: 'Reasonable if the seller won’t price on actual income.' },
      ],
      expert: 'Investigate only at a price based on actual NOI, about $1.49 million at the same cap rate, and lower for the lease risk. Paying for a pro forma is paying the seller for work you’d still have to do.',
    },
  },
  {
    id: 'apartments-12',
    commercial: true,
    title: 'A 12-unit apartment building: will the lender agree?',
    teaser: 'Twelve units at $1,500,000. The seller’s expenses look low. Rebuild the numbers and see what a lender will lend.',
    where: 'A fictional 12-unit apartment building bought with a commercial loan. Rent and property tax rules depend on the state and city.',
    facts: [
      { label: 'Price', value: '$1,500,000' },
      { label: 'Rents', value: '12 units at $1,350 a month' },
      { label: 'Seller’s expenses', value: '30% of collected rent' },
      { label: 'Loan you hoped for', value: '70% of the price, $1,050,000, at 7% over 25 years: about $89,000 a year' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'expenses',
        title: 'Mission 1: Are the expenses real?',
        question: 'The seller’s expenses are 30% of collected rent. What do you check?',
        multi: true,
        options: [
          { label: 'The property tax after the sale, from the county: it can rise when a building sells', good: true, why: 'Right. Ask the assessor what the tax will be at your price.' },
          { label: 'A fresh insurance quote for the building', good: true, why: 'Right. The seller’s old policy price may not be available to you.' },
          { label: 'Whether the seller manages it for free and left out management and repairs', good: true, why: 'Right. Owner-managed buildings often under-report costs.' },
          { label: 'Nothing: the seller’s numbers come from their tax return', good: false, why: 'Verify anyway. Ask for the trailing 12 months of statements and the bills behind them.' },
        ],
        lesson: 'Rebuilt with realistic taxes, insurance, management and repairs, expenses come to about 45% of collected rent.',
      },
      {
        kind: 'facts',
        id: 'numbers',
        title: 'Mission 2: The numbers, rebuilt',
        lines: [
          { label: 'Rent if fully rented', value: '$194,400 a year' },
          { label: 'Vacancy and unpaid rent (assumed 7%)', value: '−$13,608' },
          { label: 'Operating expenses (about 45% of collected rent)', value: '−$81,356' },
          { label: 'Net operating income (NOI)', value: 'About $99,400' },
          { label: 'Reserves for big replacements (assumed $300 a unit)', value: '−$3,600' },
          { label: 'Debt service on a $1,050,000 loan', value: '−$89,054' },
          { label: 'Cash flow', value: 'About $6,800 a year' },
          { label: 'Loan coverage (DSCR): NOI ÷ debt service', value: 'About 1.12' },
        ],
        lesson: 'With the seller’s 30% expenses, DSCR would look like 1.42. With realistic expenses it’s 1.12.',
      },
      {
        kind: 'pick',
        id: 'lender',
        title: 'Mission 3: What will the lender do?',
        question: 'The lender requires a DSCR of at least 1.25. What happens?',
        multi: false,
        options: [
          { label: 'The loan shrinks to about $938,000, so I need about $112,000 more cash', good: true, why: 'Right. At 1.25, the most debt service the NOI supports is about $79,500 a year, which carries about $938,000 at 7% over 25 years.' },
          { label: 'The lender ignores DSCR if my credit is good', good: false, why: 'Commercial loans are sized on the property’s income.' },
        ],
        lesson: 'Many commercial loans also end with a balloon payment before they’re paid off. Know the term, any prepayment penalty, and whether you’re personally liable.',
      },
    ],
    verdict: {
      question: 'At $1,500,000, what do you do?',
      choices: [
        { label: 'Buy', feedback: 'Thin cash flow, a smaller loan than planned, and $112,000 more cash: only if you have deep reserves and a clear plan to raise income.' },
        { label: 'Investigate', feedback: 'Good: get the real tax, insurance and operating statements, then offer a price that works at a 1.25 DSCR.' },
        { label: 'Pass', feedback: 'Reasonable if the seller won’t move toward a price the income supports.' },
      ],
      expert: 'Investigate and re-price. On realistic expenses the building earns about $99,400, supports a loan of about $938,000, and leaves little cash flow. The asking price leans on the seller’s low expenses.',
    },
  },
  {
    id: 'office-lease-up',
    commercial: true,
    title: 'A half-empty office building: what does it cost to fill?',
    teaser: 'A 10,000 sq ft office building is half leased. The price assumes it’s full. Count the cost of getting there.',
    where: 'A fictional small office building. Lease terms and costs vary by market; these are example figures.',
    facts: [
      { label: 'Building', value: '10,000 sq ft; 5,000 sq ft empty' },
      { label: 'Market rent (example)', value: '$24 per sq ft a year' },
      { label: 'Price', value: 'Based on the building fully leased' },
      { label: 'Time to lease the empty space (example)', value: '9 to 12 months' },
    ],
    missions: [
      {
        kind: 'estimate',
        id: 'lease-up',
        title: 'Mission 1: The cost to lease it up',
        question: 'Enter what you think it will cost to lease the 5,000 empty square feet, before looking at the example ranges.',
        items: [
          { label: 'Tenant improvements: building out the space for a new tenant', low: 150000, high: 250000, note: 'Example: $30 to $50 per sq ft. Ask local brokers what tenants expect.' },
          { label: 'Leasing commissions to brokers', low: 30000, high: 45000, note: 'Often a percentage of the lease’s total rent.' },
          { label: 'Costs you pay on the empty space while it’s vacant', low: 30000, high: 50000, note: 'Taxes, insurance, utilities and upkeep for 9 to 12 months.' },
        ],
        lesson: 'Lease-up can cost $210,000 to $345,000 here. A price based on a full building should come down by at least that much, plus a margin for the risk it takes longer.',
      },
      {
        kind: 'pick',
        id: 'existing',
        title: 'Mission 2: The tenants who are there',
        question: 'What do you check about the existing tenants?',
        multi: true,
        options: [
          { label: 'When each lease ends, and any options to leave early or renew at a fixed rent', good: true, why: 'Right. A lease ending soon can turn half-empty into mostly empty.' },
          { label: 'Estoppel certificates confirming their rent and any claims', good: true, why: 'Right.' },
          { label: 'Nothing: occupied space is safe income', good: false, why: 'Check every lease. Occupied isn’t the same as secure.' },
        ],
        lesson: 'Value the building as it is today, then subtract what it costs and how long it takes to reach full occupancy.',
      },
    ],
    verdict: {
      question: 'At a price based on a full building, what do you do?',
      choices: [
        { label: 'Buy', feedback: 'You’d pay for income that doesn’t exist yet and fund the lease-up yourself.' },
        { label: 'Investigate', feedback: 'Good: talk to local leasing brokers about demand, rents and tenant improvements, then offer a price that subtracts lease-up costs.' },
        { label: 'Pass', feedback: 'Sensible if office demand in the area is weak or you can’t fund a year of lease-up.' },
      ],
      expert: 'Investigate, priced as half-leased, minus $210,000 to $345,000 of lease-up costs and a cushion for time. Commercial vacancy can last much longer than a house sitting empty.',
    },
  },
  {
    id: 'warehouse-environmental',
    commercial: true,
    title: 'A small warehouse that used to be a repair shop',
    teaser: 'A well-priced warehouse once housed an auto repair business. Before you buy, find out what’s in the ground.',
    where: 'A fictional industrial building. Federal environmental rules apply in every state.',
    facts: [
      { label: 'Price', value: '$900,000' },
      { label: 'History', value: 'An auto repair shop for 20 years; floor drains in the old service bays' },
      { label: 'Use you plan', value: 'Lease it to a contractor for storage' },
      { label: 'Your lender', value: 'Requires an environmental report' },
    ],
    missions: [
      {
        kind: 'pick',
        id: 'phase1',
        title: 'Mission 1: The environmental report',
        question: 'What do you order, and when?',
        multi: false,
        options: [
          { label: 'A Phase I environmental site assessment (ASTM E1527-21) completed within one year before I take title, with its site visit, interviews and record searches within 180 days', good: true, why: 'Right. That timing is what preserves the federal liability protection for a buyer who investigates first.' },
          { label: 'Skip it: the seller says there’s never been a problem', good: false, why: 'A buyer can be held responsible for contamination they didn’t cause. The report is your protection.' },
          { label: 'Order one after closing', good: false, why: 'Too late to protect you or renegotiate.' },
        ],
        lesson: 'Old repair shops, gas stations and dry cleaners are classic sources of contamination: oil, solvents and buried tanks.',
      },
      {
        kind: 'pick',
        id: 'phase2',
        title: 'Mission 2: The Phase I finds a problem',
        question: 'The report flags the floor drains as a “recognized environmental condition.” What do you do? Pick all that apply.',
        multi: true,
        options: [
          { label: 'Ask the environmental professional about a Phase II: sampling soil and groundwater', good: true, why: 'Right. Sampling tells you whether there’s contamination and roughly what cleanup could cost.' },
          { label: 'Use the contract’s due-diligence period to renegotiate or cancel', good: true, why: 'Right. Make sure your contract gives you time and a way out for environmental findings.' },
          { label: 'Close on schedule and deal with it later', good: false, why: 'Cleanup costs can exceed the property’s value, and lenders may not lend.' },
        ],
        lesson: 'Talk with a real estate attorney about the environmental terms in your contract before you sign it.',
      },
    ],
    verdict: {
      question: 'What do you do now?',
      choices: [
        { label: 'Buy', feedback: 'Not before you know what’s in the ground and what cleanup would cost.' },
        { label: 'Investigate', feedback: 'Good: Phase II sampling within your due-diligence period, then decide or renegotiate.' },
        { label: 'Pass', feedback: 'Reasonable if the seller won’t allow sampling or extend the due-diligence period.' },
      ],
      expert: 'Investigate. A Phase I in time, then a Phase II on the drains. A good price on a contaminated site can be the most expensive building you ever buy.',
    },
  },
];

export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
