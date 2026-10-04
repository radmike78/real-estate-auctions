// The investing roadmap in My plan: the real tasks of buying, from your first goal to owning (or walking away),
// for three ways of buying. Every step says what you'll have when it's done, exactly what to do, who to talk to and
// what to say, which documents you'll need, when to stop, and how to know it's really done (evidence, not a page
// visit).
//
// Accuracy rules: steps describe the usual process in plain words, never a state's deadlines or forms as universal
// rules. State-specific details live in the sale guides the steps link to. Scripts never involve contacting a
// homeowner, an occupant or a former owner (site rule): official sellers, your own team and the county only.

export type RoadmapPath = 'listing' | 'auction' | 'certificate';

export interface RoadmapStep {
  id: string;
  /** Which of the six phases it belongs to. */
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  /** A short name for the step. */
  title: string;
  /** What to do and why, in a sentence or two. */
  text: string;
  /** What you'll have when the step is done. */
  outcome: string;
  /** The actions, in order. */
  steps: string[];
  /** Who to talk to, and words you can use. */
  say?: { to: string; script: string };
  /** Documents you'll need, get or fill out. */
  docs?: string[];
  /** When to pause or walk away instead of going on. */
  stop?: string;
  /** When to mark it done: evidence you have, not a page you opened. */
  doneWhen: string;
  /** What the link does, so a learner knows where it goes. */
  action?: string;
  href?: string;
  /** The ways of buying it applies to; steps without it apply to all three. */
  path?: RoadmapPath[];
  /** When the step can be marked “Doesn't apply”, and why (e.g. a rental step on a flip). */
  skip?: string;
}

export const ROADMAP_PHASES: Record<RoadmapStep['phase'], string> = {
  1: 'Get ready',
  2: 'Make a plan',
  3: 'Practice and line up your team',
  4: 'Find and check a deal',
  5: 'Buy it',
  6: 'Own it',
};

export const ROADMAP_PATHS: Record<RoadmapPath, { label: string; hint: string }> = {
  listing: { label: 'Through an agent', hint: 'A home listed for sale, bank-owned homes and short sales: you make an offer with conditions, then inspect before you’re committed.' },
  auction: { label: 'At an auction', hint: 'Tax, foreclosure, sheriff and IRS sales of the property itself: you research first, then bid, usually with no inside look and no way out after you win.' },
  certificate: { label: 'Lien certificates', hint: 'Arizona tax liens and Nevada SID liens: you buy a lien that earns interest, not the property. Owners usually pay them off; you own the property only if a court or the law later gives it to you.' },
};

const AGENT: RoadmapPath[] = ['listing'];
const AUCTION: RoadmapPath[] = ['auction'];
const LIEN: RoadmapPath[] = ['certificate'];
const OWNERS: RoadmapPath[] = ['listing', 'auction'];
const PROPERTY: RoadmapPath[] = ['listing', 'auction'];

/** From first idea to owning the property, in order. Phases 4 to 6 depend on how you buy. */
export const ROADMAP: RoadmapStep[] = [
  // 1. Get ready
  {
    id: 'goal', phase: 1, title: 'Write your goal',
    text: 'Decide what you want from investing: monthly income, long-term growth, a home to live in and rent part of, or a one-time profit.',
    outcome: 'One sentence: your goal, how long you’ll hold, and how many hours a week you can give it.',
    steps: ['Answer the Decide questions about your money, time and comfort with risk.', 'Write your goal in one sentence, for example: “A rental I’ll hold 10 years, where the rent covers the costs.”', 'Write how many hours a week you can really give it.'],
    doneWhen: 'Your goal is written down in one sentence.',
    action: 'Answer the Decide questions', href: '#/decide',
  },
  {
    id: 'money', phase: 1, title: 'Work out your investable cash',
    text: 'Find the most you could put into a deal without touching your emergency fund or money promised to other goals.',
    outcome: 'One number: your investable cash, written down with how you got it.',
    steps: ['Add up savings and investments you could sell.', 'Take out an emergency fund (several months of household spending: you choose how many).', 'Take out money already promised to other goals in the next year.', 'If you have high-interest debt, plan to pay it off first.', 'Use the cash worksheet below to work it out.'],
    stop: 'If the plan only works by using your emergency fund, or you carry high-interest debt, pause here and keep learning and practicing.',
    doneWhen: 'You have an investable-cash number that leaves your emergency fund untouched.',
    action: 'Open the cash worksheet', href: '#/toolkit/cash',
  },
  {
    id: 'strategy', phase: 1, title: 'Choose one strategy',
    text: 'Pick one strategy that fits your money, time and comfort with risk, and learn it first.',
    outcome: 'One strategy, and the reason it fits you.',
    steps: ['Read the strategies Decide suggests, including what could go seriously wrong with each.', 'Pick one. Write why it fits your goal and your cash.'],
    doneWhen: 'You’ve picked one strategy and written why.',
    action: 'Compare strategies', href: '#/decide',
  },
  {
    id: 'avoid', phase: 1, title: 'Learn the scam warning signs',
    text: 'Seminars, coaching programs and “deal finders” cost many beginners thousands. Know the signs before anyone pitches you.',
    outcome: 'A short list of warning signs you’ll walk away from.',
    steps: ['Read the red-flags lesson.', 'Write down two or three warning signs you’ll act on, such as pressure to pay today or to borrow to pay for a course.'],
    doneWhen: 'You can name the warning signs and what you’ll do if you see one.',
    action: 'Read the warning signs', href: '#/learn/red-flags',
  },

  // 2. Make a plan
  {
    id: 'market', phase: 2, title: 'Pick a county and a kind of sale',
    text: 'Choose where you’ll buy, and exactly what kind of sale. A deed, a lien certificate and an offer through an agent are different purchases with different rules.',
    outcome: 'A state, a county, the kind of sale, and what you’d actually get (a deed, a certificate, or a contract to buy).',
    steps: ['Choose your state and county in Find Deals and look at which sales happen there.', 'Read the sale guide for the kind of sale you’re interested in.', 'Choose your route at the top of this roadmap: through an agent, at an auction, or lien certificates.'],
    doneWhen: 'You know your county, the kind of sale, and what you’d get if you buy.',
    action: 'Find sales near you', href: '#/find-deals',
  },
  {
    id: 'buybox', phase: 2, title: 'Write your buy box',
    text: 'Set your limits before you look, so a property can’t talk you into it.',
    outcome: 'A saved buy box: area, property type, price limit, repair limit, return target and deal breakers.',
    steps: ['Fill in the buy box below.', 'Add at least three deal breakers, things that end a deal no matter the price.', 'Print or download it.'],
    doneWhen: 'Your buy box has an area, a property type, a price limit and deal breakers.',
    action: 'Fill in your buy box', href: '#/toolkit/buy-box',
  },
  {
    id: 'financing', phase: 2, title: 'Know how you’ll pay',
    text: 'Compare the ways of paying for your kind of purchase. Most auctions and lien sales need cash or certified funds, on a short deadline.',
    outcome: 'How you’ll pay, and the cash you need on top of any loan.',
    steps: ['Read the financing lesson.', 'For an auction or lien sale, read your sale guide’s payment rules: deposit, form of payment, and deadline.', 'Write down where the money comes from and when it has to be there.'],
    doneWhen: 'You know how you’ll pay and that you can meet the sale’s payment rules.',
    action: 'Compare ways to pay', href: '#/learn/financing',
  },
  {
    id: 'lender', phase: 2, path: AGENT, title: 'Get pre-approved, or document your cash',
    text: 'Sellers want to know you can pay. With a loan, that’s a pre-approval from a licensed loan officer. Paying cash, it’s proof of funds.',
    outcome: 'A pre-approval letter and a written quote (rate, down payment, closing costs and the reserves the lender wants), or, paying cash, a current proof of funds.',
    steps: ['Ask two or three lenders for a quote on the same loan, so you can compare.', 'Check each loan officer’s license on NMLS Consumer Access.', 'Ask what conditions could still stop the loan after you’re approved.', 'Paying cash instead: get a recent bank or brokerage statement, or a letter from your bank, showing the money is available. Keep it current, and show only the account that holds it.'],
    say: { to: 'Loan officer', script: '“I’m buying a [one-unit home] I [will / won’t] live in, around [$price], in [county]. What down payment, rate and reserves would you need? Can you give me a written quote and a pre-approval? What could stop the loan after I’m approved?”' },
    docs: ['Lenders usually ask for: photo ID, recent pay stubs, W-2s or tax returns, and bank statements', 'You get: a pre-approval letter, and a Loan Estimate after you apply when federal consumer rules cover the loan: generally a one- or two-unit home you’ll live in. A loan to buy a rental you won’t live in counts as a business loan, so the law doesn’t require one; ask for a written term sheet instead (the financing lesson explains which loans are covered)'],
    doneWhen: 'You have a pre-approval letter and a written quote you’ve compared with at least one other, or, paying cash, a proof of funds dated within the last 30 days.',
    action: 'What to ask a lender', href: '#/pros/lender',
  },
  {
    id: 'a-funds', phase: 2, path: [...AUCTION, ...LIEN], title: 'Have the funds the sale requires',
    text: 'Auctions and lien sales want cash or certified funds, often a deposit to register and the rest within a short deadline.',
    outcome: 'Money in the form and amount your sale requires, available by the deadline.',
    steps: ['Read the official bidder rules for the deposit, form of payment and deadline.', 'Ask your bank how long a cashier’s check or wire takes, and what it costs.', 'Keep a cushion for costs after the sale: recording, back taxes or liens that stay, insurance and repairs.'],
    say: { to: 'Your bank', script: '“I may need a cashier’s check or a wire for [$amount] on [date] for a county sale. How long does each take, what does it cost, and what’s your daily limit?”' },
    doneWhen: 'You can show the funds in the required form by the sale’s deadline.',
    action: 'Read your sale guide', href: '#/playbooks',
  },

  // 3. Practice and line up your team
  {
    id: 'practice', phase: 3, path: AGENT, title: 'Finish a practice purchase',
    text: 'Work a full purchase with fictional paperwork before you risk money: the numbers, the documents and the decisions.',
    outcome: 'A practice deal packet: budget, deadline calendar, evidence log, your questions and your decisions.',
    steps: ['Work through “Buy a rental, start to finish” in Practice.', 'Try at least three “Would you buy it?” drills.', 'Go back over any question you missed on the first try.'],
    doneWhen: 'You have a finished practice deal packet, and three drills done.',
    action: 'Start the practice purchase', href: '#/practice/case',
  },
  {
    id: 'a-practice', phase: 3, path: AUCTION, title: 'Finish a practice auction',
    text: 'Work one auction purchase with fictional paperwork before you risk money: the notice, the title search, your maximum bid, sale day and what comes after.',
    outcome: 'A finished practice sale, your written maximum bid with how you set it, and three drills done.',
    steps: ['In Practice, choose the kind of sale you plan to use (a tax sale or a foreclosure sale) and work one property to the end.', 'Write your maximum bid and the costs behind it before sale day in the practice.', 'Try at least three “Would you buy it?” drills, including one with liens that survive the sale.'],
    doneWhen: 'One practice sale is finished, with a written maximum bid, and three drills are done.',
    action: 'Choose a practice sale', href: '#/practice',
  },
  {
    id: 'c-practice', phase: 3, path: LIEN, title: 'Practice a lien purchase',
    text: 'A lien certificate earns interest until the owner pays; you don’t get the property or any rent. Practice the parts that decide whether it pays: the price, the wait, the costs while you wait, and what happens if it’s never paid.',
    outcome: 'A practice record: the certificate price and rate, a holding budget, three payoff scenarios, and when you’d bring in an attorney.',
    steps: [
      'Work the Nevada special assessment (SID) lien practice in Practice from the notice to the wait for redemption. Arizona buyers: work it anyway for the steps, then read your county’s tax lien guide.',
      'In the lien calculator, try three payoffs: paid in 6 months, paid in 2 years, and never paid.',
      'List the later taxes or assessments you might pay to protect your lien, and add them to your holding budget.',
      'Write the point where you’d ask an attorney about enforcing the lien, and what that would cost.',
    ],
    doneWhen: 'You have the three payoff results, a holding budget with later taxes, and a written attorney trigger.',
    action: 'Open the lien practice', href: '#/practice?sale=sid',
  },
  {
    id: 'paper', phase: 3, path: PROPERTY, title: 'Analyze real properties on paper',
    text: 'Run the numbers on real properties in your buy box, with sources for every number, before you’re in a hurry.',
    outcome: 'At least three real properties analyzed, with one you’d pass on and why.',
    steps: ['Find three real properties that fit your buy box.', 'For each, write the rent or value and where it came from, every cost, and a bad-case version.', 'Write one reason you’d pass on at least one of them.'],
    doneWhen: 'Three analyses are saved in Analyze with sources, and one has a written reason to pass.',
    action: 'Open Analyze', href: '#/analyze',
  },
  {
    id: 'c-paper', phase: 3, path: LIEN, title: 'Research real parcels on paper',
    text: 'Pick parcels from your county’s published lien list and research them as if you were bidding. You’re judging the lien’s risk, not a property’s rent.',
    outcome: 'Three parcels researched, with one you’d skip and why.',
    steps: [
      'Choose three parcels from the official list for your county’s next lien sale.',
      'For each, write: the parcel number, what’s on the land and its assessed value (from the assessor), the lien amount, and the rate or bid rules.',
      'Note anything that makes payoff or enforcement harder: other liens, a parcel too small or odd to use, or a property in bankruptcy.',
      'Run each one in the lien calculator, and write one reason you’d skip at least one of them.',
    ],
    doneWhen: 'Three parcels are researched with sources, run in the lien calculator, and one has a written reason to skip.',
    action: 'Open the lien calculator', href: '#/analyze?plan=lien',
  },
  {
    id: 'walk', phase: 3, title: 'Set your walk-away rules',
    text: 'Decide in advance what makes you stop, including your maximum price. An investment is bought on the numbers, not on how much you like it.',
    outcome: 'Your walk-away rules, written next to your buy box.',
    steps: ['Read the walk-away lesson.', 'Write how you’ll set a maximum price for any property, and three things that end a deal.'],
    doneWhen: 'Your walk-away rules are written down.',
    action: 'Learn when to walk away', href: '#/learn/walk-away',
  },
  {
    id: 'team', phase: 3, title: 'Line up your team',
    text: 'Know who you’ll call for each part of the deal, and check their licenses before you need them.',
    outcome: 'A name and a checked license for each role your route needs.',
    steps: ['Build your team list in Your team for your kind of purchase.', 'Check each license with the state lookup.', 'Ask each one what they charge, how fast they can act, and what they won’t do.'],
    say: { to: 'Each professional', script: '“I’m planning to buy [kind of property] in [county] through [kind of sale]. Have you worked on this kind of purchase? What do you charge, how quickly can you act, and what would you need from me?”' },
    doneWhen: 'Every role your route needs has a name, a checked license where one is required, and written fees.',
    action: 'Build your team', href: '#/pros',
  },

  // 4. Find and check a deal: through an agent
  {
    id: 'find', phase: 4, path: AGENT, title: 'Find a property and screen it',
    text: 'Find a real listing that fits your buy box, then decide quickly whether it deserves more work.',
    outcome: 'One property that passes your buy box, and a list of facts you still need.',
    steps: ['Search listings, bank-owned homes or short sales in your area.', 'Compare it to your buy box. If it fails, move on.', 'Write what you still need: real rents or sales nearby, condition, HOA rules, insurance and taxes.', 'Enter it in Analyze to get its checklist.'],
    stop: 'If it fails your buy box, stop. Don’t bend the box to fit the property.',
    doneWhen: 'It passes your buy box, and you have your list of missing facts.',
    action: 'Find deals', href: '#/find-deals',
  },
  {
    id: 'evidence', phase: 4, path: AGENT, title: 'Check the rent and the value',
    text: 'Base your numbers on what similar homes actually rented and sold for, not on the listing.',
    outcome: 'A rent and a value, each backed by comparables you chose and can explain.',
    steps: ['Ask your agent for homes that leased and sold nearby in the last 6 months.', 'Keep the ones that match on size, age and condition. Leave out asking prices.', 'Write your rent and value with the comparables you used.'],
    say: { to: 'Your agent', script: '“Could you send me homes within a mile that leased and sold in the last 6 months, similar in size, age and condition to this one? Closed sales and signed leases, please, not asking prices.”' },
    doneWhen: 'Your rent and value are written with the comparables behind them.',
    action: 'Lesson: analyzing a deal', href: '#/learn/analyze',
  },
  {
    id: 'quotes', phase: 4, path: AGENT, title: 'Get the property’s real costs',
    text: 'Price the costs that sink deals: insurance, property taxes after you buy, HOA dues and rules, and repairs.',
    outcome: 'An insurance quote, the tax after you buy, the HOA’s dues and rental rules, and a loan quote for this property.',
    steps: ['Ask an insurance agent for a quote for how you’ll use it (a rental needs a landlord policy).', 'Ask the county what the property tax will be after you buy.', 'Get the HOA’s dues and rules on renting.', 'Run the numbers in Analyze with these real costs.'],
    say: { to: 'Insurance agent', script: '“I’m buying [address] as a [rental / home]. Could you quote a policy for that use? What’s not covered, what’s the deductible, and are there limits if it’s empty for a while?”' },
    docs: ['Insurance quote', 'HOA rules and dues (the full resale documents come after you’re under contract)'],
    stop: 'If it can’t be insured at a price that works, or the HOA bans your plan, walk away.',
    doneWhen: 'Your Analyze numbers use a real insurance quote, the tax after purchase and the HOA dues.',
    action: 'Analyze a deal', href: '#/analyze',
  },
  {
    id: 'agree', phase: 4, path: AGENT, title: 'Sign a clear agreement with your agent',
    text: 'Know exactly what your agent will do and how they’re paid before they write an offer for you.',
    outcome: 'A signed buyer agreement you understand: what the agent does, how and how much they’re paid, and how long it lasts.',
    steps: ['Ask for the buyer agreement before you tour or make an offer.', 'Read what it says about pay, who pays it, and how to end it.', 'Ask about anything you don’t understand before you sign.'],
    say: { to: 'Your agent', script: '“Before I sign, could you walk me through what you’ll do for me, how you’re paid and by whom, how long this lasts, and how either of us can end it?”' },
    docs: ['Buyer agreement (sometimes called a buyer representation or buyer broker agreement)'],
    doneWhen: 'You’ve signed an agreement and can explain its pay terms in your own words.',
    action: 'Your team: agent', href: '#/pros/agent',
  },

  // 4. Find and check a deal: at an auction
  {
    id: 'a-find', phase: 4, path: AUCTION, title: 'Find a sale and a property on the official list',
    text: 'Work only from the official seller’s list: the county, the trustee, the sheriff or the IRS.',
    outcome: 'The official notice for one property: sale date, place or website, opening bid, deposit and payment rules.',
    steps: ['Get the list from the official seller (Find Deals links them by county).', 'Save the notice for the property, with the date you saved it.', 'Write down the sale’s rules: registration, deposit, form of payment and deadline.'],
    say: { to: 'The county treasurer, trustee or sheriff', script: '“I’m thinking about bidding at your [date] sale. Where can I find the bidder rules, the property list and any updates? What deposit and form of payment do you need, and when is the balance due?”' },
    docs: ['The official notice of sale', 'The bidder rules or terms of sale'],
    doneWhen: 'You have the official notice and the written sale rules for one property.',
    action: 'Find official sales', href: '#/find-deals',
  },
  {
    id: 'a-research', phase: 4, path: AUCTION, title: 'Research title and condition before the sale',
    text: 'At most auctions you can’t go inside and can’t back out after you win, so the research happens now.',
    outcome: 'What you’d own, which liens could stay with it, whether it looks occupied, and its access and zoning.',
    steps: ['Order a title search, or pay a title company to review the records.', 'List the liens that could survive this kind of sale (your sale guide explains which).', 'Look from the street and on the county map: condition, access, and whether it looks lived in. Don’t contact the owner or anyone living there.', 'Check zoning and code violations with the city or county.'],
    say: { to: 'Title company', script: '“I’m considering bidding on [parcel number] at a [kind of sale] on [date]. Could you search the records and tell me which liens would likely survive that sale, and whether you’d insure the title afterward?”' },
    docs: ['Title search or report', 'County map, tax record and any code-violation records'],
    stop: 'If liens that stay with the property make the numbers fail, or a title company wouldn’t insure it, skip it.',
    doneWhen: 'You have a title search and a written list of what stays with the property.',
    action: 'Read how the sale works', href: '#/playbooks',
  },
  {
    id: 'a-value', phase: 4, path: AUCTION, title: 'Value it from the outside',
    text: 'Estimate value and repairs without seeing inside, and add a cushion for what you can’t see.',
    outcome: 'A value from sold comparables and a repair budget with a cushion for surprises.',
    steps: ['Find recent sales of similar homes in similar condition.', 'Estimate repairs from the outside, then add a cushion for the inside.', 'Ask whether an exterior-only appraisal is possible.'],
    say: { to: 'Appraiser or agent', script: '“I can’t get inside [address]. Could you estimate its value from recent sales and an exterior view? What would you assume about the inside?”' },
    doneWhen: 'You have a value with its comparables and a repair budget with a cushion.',
    action: 'About appraisers', href: '#/pros/appraiser',
  },
  {
    id: 'a-insure', phase: 4, path: AUCTION, title: 'Line up insurance before you bid',
    text: 'Some insurers won’t cover homes they can’t inspect. Find out now, and find out when the risk becomes yours under this sale.',
    outcome: 'An insurer willing to cover it, and the moment the risk becomes yours under this sale.',
    steps: ['Ask an insurance agent about covering a home bought at auction, sight unseen.', 'Ask the trustee, sheriff or county when the property becomes your risk under their sale.'],
    say: { to: 'Insurance agent', script: '“I may buy [address] at a [kind of sale] on [date] without seeing inside. Could you cover it from the day it becomes mine, vacant? What would you need from me?”' },
    stop: 'If no one will insure it, think hard before bidding: an uninsured loss is all yours.',
    doneWhen: 'You know who would insure it and from when.',
    action: 'Your team: insurance agent', href: '#/pros/insurance',
  },

  // 4. Find and check a deal: lien certificates
  {
    id: 'c-sale', phase: 4, path: LIEN, title: 'Learn your county’s lien sale',
    text: 'Each county runs its own sale with its own dates, vendor and rules.',
    outcome: 'The sale date, how to register, what you bid, how you pay, and the deadlines.',
    steps: ['Read the sale guide for your state’s lien sale.', 'Read the county treasurer’s own rules page.', 'Register by the county’s deadline.'],
    say: { to: 'County treasurer', script: '“I’d like to bid at your lien sale. Where are the bidder rules and the list? How do I register, what fees apply, and when and how is payment due?”' },
    docs: ['Bidder registration', 'A W-9 if the county asks for one (for reporting interest you earn)'],
    doneWhen: 'You’re registered, and the sale rules are saved.',
    action: 'Read the lien guides', href: '#/playbooks',
  },
  {
    id: 'c-research', phase: 4, path: LIEN, title: 'Research every parcel',
    text: 'Owners usually pay off the lien, but bid only on parcels you’d actually want to own if one isn’t.',
    outcome: 'A short list of parcels you’d be willing to own, with notes on each.',
    steps: ['Check each parcel on the county map: access, size, zoning and use.', 'Leave out slivers, drainage strips and land with no access.', 'Check for other liens and special assessments.'],
    stop: 'If you wouldn’t want to own the parcel, don’t bid on it.',
    doneWhen: 'Your list has only parcels you checked and would be willing to own.',
    action: 'Arizona tax lien guide', href: '#/playbooks/aztaxlien',
  },
  {
    id: 'c-budget', phase: 4, path: LIEN, title: 'Budget for the whole holding period',
    text: 'Plan for more than the purchase: later years’ taxes you may pay, fees, and an attorney if you ever foreclose.',
    outcome: 'A budget for the purchase, later taxes, fees, and a possible attorney.',
    steps: ['Total what you’ll pay at the sale, with fees.', 'Estimate later years’ taxes you may choose to pay.', 'Get an attorney’s rough cost for a foreclosure case, in case you need one.'],
    doneWhen: 'Your budget covers the purchase, later taxes, fees and a possible attorney.',
    action: 'Lien calculator', href: '#/analyze?plan=lien',
  },

  // 5. Buy it: through an agent
  {
    id: 'offer', phase: 5, path: AGENT, title: 'Make your offer',
    text: 'Offer at or below your maximum, with conditions (contingencies) that let you cancel and keep your deposit if something goes wrong.',
    outcome: 'An accepted contract, and every deadline in it on your calendar.',
    steps: ['Set your maximum price from your analysis before you write the offer.', 'Ask your agent to include inspection, appraisal and loan contingencies, with deadlines you can meet.', 'Remember: it’s a contract only once the seller accepts in writing.', 'Put every deadline on your calendar the day it’s accepted.'],
    say: { to: 'Your agent', script: '“I’d like to offer [$price], with inspection, appraisal and loan contingencies. What deadlines are realistic for each, and what happens to my deposit if I cancel inside them?”' },
    docs: ['Purchase contract', 'Pre-approval letter or proof of funds'],
    stop: 'Don’t go above your maximum or drop your contingencies to win.',
    doneWhen: 'The seller has accepted in writing, and every deadline is on your calendar.',
    action: 'How to negotiate', href: '#/learn/negotiate',
  },
  {
    id: 'deposit', phase: 5, path: AGENT, title: 'Send your earnest money safely',
    text: 'Wiring fraud is common in real estate. Confirm instructions by phone before you send anything.',
    outcome: 'Your deposit received by escrow, confirmed in writing.',
    steps: ['Get the escrow company’s phone number from your agent or the company’s website, not from an email.', 'Call to confirm the instructions before you wire.', 'Get a receipt.'],
    say: { to: 'Escrow officer (by phone)', script: '“I received wiring instructions for my earnest money on [address]. Could you confirm the bank, account and amount with me now, before I send it?”' },
    docs: ['Earnest money receipt'],
    doneWhen: 'Escrow has confirmed it received your deposit.',
    action: 'Your team: title and escrow', href: '#/pros/title',
  },
  {
    id: 'inspect', phase: 5, path: AGENT, title: 'Inspect, then decide before the deadline',
    text: 'Hire a qualified inspector (check the license or certificate your state requires), get the report, and settle what it found before your inspection period ends.',
    outcome: 'The inspection report, repair bids for the big items, and your written answer to the seller before the deadline.',
    steps: ['Book the inspection right away. Add specialists the inspector suggests (a sewer camera, a roofer, an electrician).', 'Sort the findings: fix now, budget for later.', 'Get written bids for the big items.', 'Before the deadline, ask for a lower price or repairs, go ahead, or cancel, in writing.'],
    say: { to: 'Your agent', script: '“The inspection found [items], with bids totaling [$]. I’d like to ask for [a price reduction of $ / repairs by a licensed contractor with permits] before my inspection deadline on [date].”' },
    docs: ['Inspection report', 'Repair bids', 'Your written request, and the seller’s answer'],
    stop: 'If the repairs don’t fit your cash, and the seller won’t adjust, cancel before the deadline.',
    doneWhen: 'You have the report and you’ve answered the seller in writing before the deadline.',
    action: 'Your team: inspector', href: '#/pros/inspector',
  },
  {
    id: 'appraise', phase: 5, path: AGENT, title: 'Handle the appraisal',
    text: 'The lender orders an appraisal. If it comes in low, you can ask for a lower price, bring more cash, or cancel within your appraisal contingency.',
    outcome: 'The appraisal, and your decision before the appraisal deadline if it’s low.',
    steps: ['Ask your lender when the appraisal will be done.', 'If it’s low, work out the new down payment (the loan is based on the lower of price and appraisal).', 'Decide before the deadline: ask for a lower price, pay the difference, or cancel.'],
    say: { to: 'Your agent', script: '“The appraisal came in at [$], below our [$] price. I’d like to ask the seller to reduce the price to the appraised value before my appraisal deadline on [date].”' },
    docs: ['Appraisal report (your lender gives you a copy)'],
    doneWhen: 'The appraisal is in, and any gap is settled in writing before the deadline.',
    skip: 'You’re paying cash and chose not to get an appraisal.',
    action: 'Your team: appraiser', href: '#/pros/appraiser',
  },
  {
    id: 'title', phase: 5, path: AGENT, title: 'Review the title and HOA documents',
    text: 'The title commitment lists what must be cleared before closing and what the title policy won’t cover. HOA documents have the rules and finances.',
    outcome: 'Every requirement in the title commitment has a plan to clear it, and the HOA rules fit your plan.',
    steps: ['Read the title commitment’s requirements (to clear before closing) and exceptions (not covered).', 'Ask the title officer how each unusual item will be cleared.', 'Read the HOA rules, budget and any special assessments within your review period.'],
    say: { to: 'Title officer', script: '“In the commitment for [address], how will requirement [#] be cleared before closing? Will I get a recorded release? Which exceptions should I understand before I close?”' },
    docs: ['Title commitment', 'HOA resale documents (rules, budget, reserves, dues statement)'],
    stop: 'If a lien can’t be cleared, or the HOA rules block your plan, cancel within your contract’s review period.',
    doneWhen: 'Each title requirement has a plan, and you’ve read the HOA documents within the review period.',
    action: 'Your team: title and escrow', href: '#/pros/title',
  },
  {
    id: 'close', phase: 5, path: AGENT, title: 'Close',
    text: 'Check the final numbers, confirm wiring by phone, have insurance start at closing, and keep every document.',
    outcome: 'The deed recorded in your name, insurance in force, and a copy of every document.',
    steps: ['Get final loan approval and give the lender proof of insurance.', 'Compare the closing statement with your contract and loan quote, line by line, including your deposit credit.', 'Confirm the wiring instructions by phone with a number you trust.', 'Sign, and get a copy of the recorded deed.'],
    say: { to: 'Escrow officer', script: '“Could you walk me through the closing statement? I want to confirm my earnest money credit, every fee, and the exact amount I wire. I’ll call you at your office number to confirm the wiring details.”' },
    docs: ['Closing Disclosure or closing statement', 'Proof of insurance', 'Recorded deed', 'Title insurance policy'],
    doneWhen: 'The deed is recorded in your name, insurance is in force, and you have copies of everything.',
    action: 'Your team: title and escrow', href: '#/pros/title',
  },

  // 5. Buy it: at an auction
  {
    id: 'a-max', phase: 5, path: AUCTION, title: 'Set your maximum bid',
    text: 'Work out the most you’ll bid with every cost counted, and write it down before the sale.',
    outcome: 'A written maximum bid, with every cost behind it.',
    steps: ['Use the maximum bid calculator with your value, repairs, liens that stay, holding costs and selling costs.', 'Write the number down, and take it to the sale.'],
    doneWhen: 'Your maximum is written down and your funds meet the sale’s payment rules.',
    action: 'Set your maximum bid', href: '#/analyze?plan=flip',
  },
  {
    id: 'a-bid', phase: 5, path: AUCTION, title: 'Register and bid',
    text: 'Register by the deadline, bid only up to your maximum, and stop.',
    outcome: 'You bid within your maximum, or walked away.',
    steps: ['Register and pay any deposit by the deadline.', 'Check for postponements or cancellations on the day.', 'Bid up to your maximum. If it goes higher, stop.'],
    docs: ['Bidder registration form', 'Deposit receipt', 'A W-9 if the seller asks'],
    stop: 'Never bid past your maximum. Losing an auction costs nothing.',
    doneWhen: 'You bid within your maximum, or walked away.',
    action: 'Practice an auction', href: '#/practice',
  },
  {
    id: 'a-pay', phase: 5, path: AUCTION, title: 'Pay, and get the right paperwork',
    text: 'Pay the balance by the deadline and get the document this sale gives you. Some sales aren’t final right away, and some give the former owner time to redeem.',
    outcome: 'Payment made on time, and the deed or certificate this sale gives, recorded where it should be.',
    steps: ['Pay the balance in the required form by the deadline.', 'Get the receipt and the document the sale gives (a deed, or a certificate of sale).', 'Check your sale guide for any waiting or redemption period before the sale is final.', 'Make sure the deed is recorded.'],
    say: { to: 'Trustee, sheriff or county', script: '“I’m the winning bidder on [parcel]. When will I receive the deed or certificate, will you record it or should I, and is there any period before the sale is final?”' },
    docs: ['Payment receipt', 'Deed or certificate of sale', 'Recorded copy'],
    doneWhen: 'You’ve paid on time and have the recorded deed (or know when you’ll get it).',
    action: 'Read your sale guide', href: '#/playbooks',
  },
  {
    id: 'a-possess', phase: 5, path: AUCTION, title: 'Insure it and get possession lawfully',
    text: 'Insure it from the moment it’s your risk. If anyone lives there, possession goes through the legal process, never changing locks or removing belongings yourself.',
    outcome: 'Insurance in force and lawful possession.',
    steps: ['Start insurance from the moment the risk is yours.', 'If it’s occupied, hire an attorney for the lawful process in your state. Don’t contact or pressure the occupants yourself.', 'Consider title insurance before you spend money on repairs.'],
    say: { to: 'Attorney', script: '“I bought [address] at a [kind of sale] on [date], and it appears occupied. What is the lawful process to get possession here, how long does it take, and what will it cost?”' },
    stop: 'Never change locks, cut utilities or remove belongings to force someone out.',
    doneWhen: 'Insurance is in force, and you have lawful possession.',
    action: 'How possession works', href: '#/pros/eviction',
  },

  // 5. Buy it: lien certificates
  {
    id: 'c-bid', phase: 5, path: LIEN, title: 'Bid and pay',
    text: 'Bid only on parcels on your list, and pay in full by the county’s deadline.',
    outcome: 'Your certificates paid for and listed with the county.',
    steps: ['Bid on your researched parcels only.', 'Pay in full, in the form the county requires, by its deadline.', 'Save each certificate and receipt.'],
    docs: ['Certificate of purchase (or the county’s record of it)', 'Payment receipts'],
    doneWhen: 'Each certificate is paid for and saved.',
    action: 'Lien guides', href: '#/playbooks',
  },
  {
    id: 'c-hold', phase: 5, path: LIEN, title: 'Track payoffs, interest and later taxes',
    text: 'Keep a simple record of each certificate: what you paid, the interest rate, and what you’ve been paid back.',
    outcome: 'A record of every certificate, matched to the county’s payments to you.',
    steps: ['Record each certificate: parcel, amount, rate, date.', 'Match each payoff the county sends you to your record.', 'Decide each year whether to pay later years’ taxes on the parcels you still hold.'],
    doneWhen: 'Every certificate is recorded, and every payoff matches.',
    action: 'Lien calculator', href: '#/analyze?plan=lien',
  },
  {
    id: 'c-decide', phase: 5, path: LIEN, title: 'Decide what to do with unpaid liens',
    text: 'If a lien is still unpaid when the law allows, decide with an attorney whether to start the legal process. Notices go through your attorney, never through contacting the owner yourself.',
    outcome: 'A decision, made with an attorney, for each lien still unpaid at the earliest date the law allows.',
    steps: ['Note the earliest date you may act and the last date before the lien expires.', 'Talk with an attorney about cost, timing and whether a court-ordered sale could pay you instead of giving you the deed.', 'Decide: start the process, or keep holding.'],
    say: { to: 'Attorney', script: '“I hold the certificate on [parcel], bought [date], still unpaid. What are my options and deadlines, what would a foreclosure cost, and how likely is a court-ordered sale instead of a deed?”' },
    stop: 'Never contact the owner yourself about the lien or the property.',
    doneWhen: 'Each unpaid lien has a written decision and a calendar date.',
    action: 'Your team: attorney', href: '#/pros/attorney',
  },

  // 6. Own it
  {
    id: 'first-week', phase: 6, path: OWNERS, title: 'Your first week',
    text: 'Make the property safe, secure and insured, and set up clean records from day one.',
    outcome: 'Locks changed (once you lawfully have possession of a vacant home), utilities in your name, condition photos, insurance confirmed, and a separate bank account.',
    steps: ['If the home is vacant and you lawfully have possession: change or rekey the locks.', 'If a tenant stays on: don’t change their locks or touch their utilities. Get the lease and deposit records from the seller or escrow, tell the tenant in writing who you are and where to pay rent, and follow your state’s rules for entry.', 'Move the utilities you’re responsible for into your name, without any gap in service.', 'Take dated photos and video of every room.', 'Confirm your insurance is in force for how you’re using it.', 'Give the HOA, if any, your mailing address and contact details.', 'Open a separate bank account for the property.'],
    doneWhen: 'Each item that applies to your home (vacant or with a tenant) is done.',
    action: 'Lesson: after you close', href: '#/learn/after-closing',
  },
  {
    id: 'repairs', phase: 6, path: OWNERS, title: 'Repairs, the right way',
    text: 'Fix safety items first, with licensed contractors and permits where required.',
    outcome: 'Written bids, permits where needed, and the work done and checked.',
    steps: ['Get two or three written bids for the same scope.', 'Check each contractor’s license and insurance.', 'Pull permits where required, and pay as work is done, not all up front.', 'Keep receipts and lien releases.'],
    say: { to: 'Contractor', script: '“Could you bid this scope in writing: [work]? Please include permits, timeline and a payment schedule tied to finished work. What’s your license number?”' },
    docs: ['Written bids', 'Contract with a payment schedule', 'Permits and final inspections', 'Lien releases or receipts'],
    doneWhen: 'The work is done, permitted where required, and paid against receipts.',
    action: 'Your team: contractor', href: '#/pros/contractor',
  },
  {
    id: 'rent', phase: 6, path: OWNERS, title: 'Rent it lawfully (if renting)',
    text: 'Screen every applicant with the same written criteria, give the required disclosures, and use a lease that follows your state’s law.',
    outcome: 'Written screening criteria, a lawful lease, the required disclosures, and a tenant moved in.',
    steps: ['Write your screening criteria and apply them the same way to everyone.', 'If a report leads you to deny someone, or to ask for a cosigner, a bigger deposit or higher rent, give the adverse action notice.', 'For homes built before 1978, give the lead pamphlet and disclosure.', 'Use a lease that follows your state’s law, and follow its deposit and entry rules.'],
    docs: ['Rental application', 'Screening criteria', 'Adverse action notice (when required)', 'Lead disclosure and pamphlet (homes built before 1978)', 'Lease', 'Move-in condition checklist with photos'],
    doneWhen: 'A tenant has signed a lawful lease, with the required disclosures on file.',
    skip: 'You won’t rent it: you’re selling it after repairs, or living in it.',
    action: 'Lesson: after you close', href: '#/learn/after-closing',
  },
  {
    id: 'operate', phase: 6, path: OWNERS, title: 'Keep the books and the reserves',
    text: 'Track every dollar in and out each month, and set money aside for vacancies, repairs and big replacements.',
    outcome: 'Monthly records that match your bank account, and a reserve that meets your plan.',
    steps: ['Record rent and every cost each month.', 'Move a set amount into your reserve each month, even when nothing breaks.', 'Keep receipts for your tax advisor.'],
    say: { to: 'Tax advisor', script: '“I own a rental at [address] since [date]. What records do you need from me each year, and is there anything I should set up now?”' },
    doneWhen: 'Three months are reconciled with your bank statements; every reserve deposit and withdrawal is recorded; and the reserve meets your plan, or you’ve written down how and when you’ll rebuild it after a repair or a vacancy.',
    action: 'Your team: tax advisor', href: '#/pros/cpa',
  },
  {
    id: 'review', phase: 6, path: OWNERS, title: 'Review, then decide what’s next',
    text: 'Compare what happened with your plan. Then decide whether to keep, refinance or sell, with your tax advisor and lender, and update your buy box.',
    outcome: 'A written review: plan versus actual, what you’d change, and an updated buy box.',
    steps: ['After 6 to 12 months, compare actual income and costs with your plan.', 'Talk with your tax advisor and lender before any refinance or sale.', 'Update your buy box and walk-away rules.'],
    doneWhen: 'Your review is written and your buy box is updated.',
    action: 'Update your buy box', href: '#/toolkit/buy-box',
  },
  {
    id: 'c-own', phase: 6, path: LIEN, title: 'If you end up owning the property',
    text: 'Owners usually pay off the lien. If you ever get the deed, you’re an owner: switch to the auction route’s “Own it” steps.',
    outcome: 'A plan for ownership, or a clean record of liens paid off.',
    steps: ['If a lien ends with you getting the deed, get title insurance before spending money on the property.', 'Then follow the “Own it” steps on the auction route.'],
    doneWhen: 'Every lien is paid off and recorded, or you’ve switched to the owner steps.',
    action: 'Lien guides', href: '#/playbooks',
  },
];

/** The steps for one way of buying. */
export const roadmapFor = (path: RoadmapPath) => ROADMAP.filter((s) => !s.path || s.path.includes(path));

/** The roadmap for buying through an agent (the default). */
export const FIRST_DEAL: RoadmapStep[] = roadmapFor('listing');

/** Where a step stands. "Done" is kept in the done list; the others here. */
export type StepStatus = 'doing' | 'waiting' | 'stopped' | 'na';
export const STEP_STATUS_LABEL: Record<StepStatus | 'done' | 'todo', string> = {
  todo: 'Not started',
  doing: 'Working on it',
  waiting: 'Waiting on someone',
  stopped: 'Stopped: I walked away',
  na: 'Doesn’t apply to me',
  done: 'Done',
};
