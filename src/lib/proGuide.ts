// "Your team": a beginner's guide to the professionals in a forced-sale purchase — what each one does, when you
// need them, how to find one and what to ask. It teaches; it doesn't vouch for anyone. Each entry names the state
// office that licenses that kind of professional so people can look someone up themselves before hiring.

import type { Category } from './pros';

export type ProKey =
  | 'agent' | 'lender' | 'private_lender' | 'title' | 'attorney' | 'inspector' | 'contractor' | 'insurance' | 'cpa'
  | 'property_manager' | 'eviction' | 'environmental' | 'appraiser';

export interface ProGuide {
  key: ProKey;
  title: string;
  /** One line for the tile. */
  summary: string;
  does: string;
  when: string[];
  find: string[];
  ask: string[];
  /** Advertiser categories that match, for the "who advertises on DeedOwl" list. */
  directory?: Category[];
}


export const PRO_GUIDES: ProGuide[] = [
  {
    key: 'agent',
    title: 'Real estate agent',
    summary: 'Finds and prices properties, writes offers and negotiates for you.',
    does: 'An agent finds properties, estimates what they’re worth, writes your offer and negotiates. You buy bank-owned homes and short sales through an agent. At an auction you bid yourself, but an agent can still help you price the property before and sell or rent it after.',
    when: ['Bank-owned (REO) and HUD homes: offers go through an agent (HUD homes need a HUD-registered broker).', 'Short sales: an agent handles the offer and the lender’s approval.', 'Auctions: pricing before you bid, and selling or renting after.'],
    find: ['Ask for an agent who has closed bank-owned, short-sale or auction purchases in the county where the property is. Ask for recent examples.', 'Interview two or three before you choose.'],
    ask: ['How many investor, bank-owned or auction purchases have you closed here?', 'Who pays your commission on this purchase, and how much is it?', 'Will you help me estimate repairs and resale value?', 'Do you or your brokerage also represent the seller?'],
    directory: ['agent'],
  },
  {
    key: 'lender',
    title: 'Loan officer or mortgage lender',
    summary: 'Arranges a mortgage and gives you the loan terms to compare.',
    does: 'A loan officer at a bank, credit union or mortgage company arranges a home loan. For most consumer home loans, such as a loan to buy a one- or two-unit home you’ll live in, they must give you a Loan Estimate that lists the rate and costs (home equity lines and reverse mortgages use different forms). A pre-approval letter shows sellers that a lender is willing to lend you up to a set amount. That still depends on the appraisal, final underwriting and your finances staying the same.',
    when: ['Bank-owned homes and short sales: get pre-approved before you make an offer.', 'Auctions usually need cash on sale day, so a mortgage comes later, to refinance.'],
    find: ['Get comparable written quotes from at least three lenders on the same day. For a covered consumer mortgage, compare Loan Estimates; for business-purpose rental, flip or commercial financing, ask for written term sheets. Compare rates, points, fees, payment terms, penalties and closing requirements line by line.'],
    ask: ['What are the rate, points and closing costs?', 'Do you lend on homes that need work? (Some loans include repair money.)', 'How long will it take to close?'],
    directory: ['loan_officer', 'mortgage_company', 'bank', 'credit_union'],
  },
  {
    key: 'private_lender',
    title: 'Hard-money or private lender',
    summary: 'Short-term loans for auction buys and fix-and-flips, at higher cost.',
    does: 'Hard-money and private lenders make short-term loans based mostly on the property. Investors often use one to get back the cash they paid at an auction, or to pay for repairs. These loans close fast but cost more than a mortgage.',
    when: ['After an auction, to replace the cash you paid.', 'For a fix-and-flip, to cover the price and repairs.'],
    find: ['Compare written terms from several lenders (the full list to get in writing is under “Check before you hire”). Ask local investors who they’ve used.', 'Line it up before the sale: most auctions want full payment the same day.', 'Check the lender’s license with its regulator; many are on NMLS Consumer Access, while some hold a real estate broker’s license or are exempt. A credit report or appraisal fee can be normal, but never pay a “deposit” or “tax” to release a loan.'],
    ask: ['What are the rate, points, fees and any prepayment penalty?', 'How much of the price and repairs will you lend?', 'How fast can you fund, and what do you need from me?'],
    directory: ['private_lender'],
  },
  {
    key: 'title',
    title: 'Title and escrow company',
    summary: 'Checks the records for liens, insures title and handles the closing.',
    does: 'A title company searches the property’s records for liens and ownership problems. It also issues title insurance. Escrow holds the money and documents until the purchase closes.',
    when: ['Most purchases by contract close through title and escrow. At an auction, you follow the official payment and deed process, so arrange your own title search separately.', 'Before you bid at an auction: order a title search (see “Should you hire one?” below for what it can and can’t tell you).', 'After a tax or foreclosure sale, many won’t insure until a quiet title action is done.', 'Land, a rural property, a fence or building near the line, or commercial property: ask what a survey would add. Title insurance usually excludes what only a survey would show; a licensed land surveyor marks the boundaries, easements and encroachments.'],
    find: ['Call a few title companies in the county and ask for a title search or preliminary title report on the parcel.', 'For an auction property, ask whether and when they would insure it.'],
    ask: ['Will you insure this property after this kind of sale, and what do you need first?', 'What does a title search cost, and how long does it take?', 'Which liens could stay with the property?'],
    directory: ['title_escrow'],
  },
  {
    key: 'attorney',
    title: 'Real estate attorney',
    summary: 'Explains your rights, reviews liens and sale problems, and can file a quiet-title case (a court order that settles who owns it).',
    does: 'A real estate attorney reviews the sale and any title problems and tells you what survives the sale. When a title company needs a quiet title action, they file it.',
    when: ['Tax sales, foreclosure auctions, HOA and sheriff sales, and lien certificates.', 'Any time there are surviving liens, a challenge to the sale, or people living in the property.'],
    find: ['Look up the lawyer with the state bar where the property is, using the lookup on this page. It shows any discipline.', 'Ask for an attorney who handles quiet title and foreclosure matters in the county where the property is.'],
    ask: ['Have you handled quiet title actions here? How long do they take?', 'Flat fee or hourly, and what’s your estimate?', 'What should I do before I bid?'],
    directory: ['attorney'],
  },
  {
    key: 'inspector',
    title: 'Home inspector',
    summary: 'Examines the home’s condition and writes a report before you buy.',
    does: 'A home inspector checks the roof, plumbing, electrical, heating and cooling, and structure, and writes a report so you know what repairs to expect.',
    when: ['Bank-owned homes and short sales: during your inspection period, before you’re committed.', 'Auctions: you usually can’t go inside, so plan for an exterior look and a repair cushion.'],
    find: ['Ask your agent for a few names, and read a sample report from each.'],
    ask: ['Can I see a sample report?', 'Do you check the sewer line, roof or pool, or is that separate?', 'When will I get the report?'],
    directory: ['home_inspector'],
  },
  {
    key: 'appraiser',
    title: 'Appraiser',
    summary: 'Gives a written opinion of what a property is worth on a date. A professional appraisal is the best way to determine value.',
    does: 'A state-licensed or certified appraiser studies the property and recent sales of similar properties nearby. Then they write an appraisal: a professional opinion of its value. Value depends on the neighborhood, comparable sales, condition and the market. A professional appraisal is the best way to determine it: an opinion of value for a particular date and purpose, not a guarantee of the price a buyer will pay. Your own numbers, and your agent’s, are estimates until then. Appraisers value upgrades by what buyers in that market pay for them, not by what they cost. So $70,000 of upgrades doesn’t necessarily make a home worth $70,000 more.',
    when: ['Before you set your maximum bid or offer: the value as it stands and after the repairs you plan.', 'Before you count on a refinance, since the lender’s appraisal sets the loan.', 'At an auction you often can’t go inside. Ask whether an exterior-only appraisal is possible, and allow for what it can’t see.'],
    find: ['Ask your real estate agent or lender for appraisers they trust. Your agent can estimate the value from recent comparable sales while you wait.'],
    ask: ['Are you licensed or certified in this state for this kind of property?', 'Can you value it both as it stands and after the repairs I plan?', 'Which comparable sales did you use, and why?', 'What does it cost, and how soon can you finish?'],
  },
  {
    key: 'contractor',
    title: 'Contractor',
    summary: 'Bids on and does the repairs, with the license your state requires and the right permits.',
    does: 'A contractor prices and does repairs and pulls permits. Each license covers certain types of work. In Nevada, each license also has a dollar limit. An unlicensed person may do only small repair or upkeep jobs under $1,000 that need no permit, and never plumbing, electrical, or heating and air-conditioning work, and you can’t split a bigger job into small contracts to stay under the limit. In California, an unlicensed handyman may take only jobs under $1,000 (labor and materials) that need no building permit. A job under $1,000 also needs a license if the worker has any helpers, and you can’t split a bigger job into small contracts to stay under the limit. In Arizona, an unlicensed handyman may take only jobs under $1,000 (labor and materials) that need no building permit, and you can’t split a bigger job into small contracts to stay under the limit. In Utah, the handyman exemption (not a limit on licensed contractors) lets an unlicensed worker take small jobs, under $7,000 a project (labor and materials). For a job over $3,000, the worker must first file a one-time affirmation with the Division of Professional Licensing (DOPL) showing liability insurance, plus workers’ compensation if they have employees. That registration isn’t a contractor license, and plumbing, electrical, gas and heating work still needs a licensed trade. Check DOPL’s current requirements. Texas has no statewide license for general contractors or remodelers: the state licenses electricians, plumbers and air-conditioning contractors, and some cities register contractors, so check those, plus insurance and references.',
    when: ['Before you buy: a repair estimate, even from the outside, to set your maximum bid.', 'After you own it: the full scope once you have the keys.'],
    find: ['Get at least three written bids for the same scope of work.', 'Ask for proof of insurance, and never pay large sums upfront.'],
    ask: ['Which licenses do you and your trades hold, and does the job fit their type of work (and dollar limit, where the state sets one)?', 'Texas: which trade licenses and city registration cover this job?', 'What’s the payment schedule?', 'Who pulls the permits?'],
    directory: ['contractor'],
  },
  {
    key: 'insurance',
    title: 'Insurance agent',
    summary: 'Insures the property from the day its risk is yours, including when it’s vacant.',
    does: 'An insurance agent sets up coverage for the property. Vacant homes, rentals and homes under renovation often need a special policy.',
    when: ['Before you bid, ask the trustee or sheriff, your attorney and the insurer when the risk becomes yours under this sale’s terms, and have coverage ready by then. The sale becoming final, getting the deed and getting possession can happen on different days.', 'A tax lien certificate isn’t ownership. You insure only if you later get the deed.', 'In California, a trustee’s sale of a 1–4 unit home usually isn’t final until at least 15 days after the auction, unless an owner-occupant wins. Ask the trustee when the sale is final.', 'Before renovation or renting it out.'],
    find: ['Ask agents who write vacant-property, landlord or renovation policies, and compare quotes.'],
    ask: ['Do you cover vacant properties and renovations?', 'Can coverage start the day this sale’s risk becomes mine, even before I have the deed or possession?', 'What isn’t covered?'],
    directory: ['insurance'],
  },
  {
    key: 'cpa',
    title: 'CPA or tax advisor',
    summary: 'Explains how your deal is taxed and how to hold the property.',
    does: 'A CPA explains how your flip or rental will be taxed, and whether to buy in your own name or through a company. In Arizona, that includes interest from tax lien certificates.',
    when: ['Before you buy: the plan changes the taxes.', 'At tax time, for your records and deductions.', 'Before you list a rental you want to trade in a 1031 exchange: a qualified intermediary must be in place before the sale closes, and your sale money goes to them, never to you.'],
    find: ['Ask for a CPA who works with real estate investors.', 'For a 1031 exchange, your CPA or title company can name qualified intermediaries. Check that they’re bonded and insured and keep your money in a separate account.', 'In Nevada, the state regulates qualified intermediaries (NRS 645G).', 'In California, the state regulates exchange facilitators (Financial Code 51000 and following).'],
    ask: ['How would a flip and a rental be taxed for me, including tax on depreciation when I sell?', 'Should I buy in my own name or an LLC?', 'What records should I keep?'],
    directory: ['cpa'],
  },
  {
    key: 'property_manager',
    title: 'Property manager',
    summary: 'Finds tenants, collects rent and handles repairs on a rental.',
    does: 'A property manager advertises the rental, screens tenants, collects rent and arranges repairs.',
    when: ['If you’ll rent it out and can’t handle showings, screening, rent and repairs yourself, or you live far away.', 'Commercial property with tenants: from day one.'],
    find: ['Ask local investors who they use, and compare fees and contracts.', 'In Nevada, property managers need a real estate license plus a property management permit from the Real Estate Division.'],
    ask: ['What’s your monthly fee, and your fee to find a tenant?', 'How do you screen tenants?', 'How are repairs approved and billed?'],
    directory: ['property_manager'],
  },
  {
    key: 'eviction',
    title: 'Eviction help',
    summary: 'An eviction attorney or service handles the court process when someone still lives in a home you bought.',
    does: 'If people still live in a property you bought, you have to follow a legal process to take possession. You can’t change the locks or remove people or belongings yourself.',
    when: ['Right after a tax, foreclosure, HOA or sheriff sale, if the property is occupied.', 'Former owners and tenants get different notice periods; tenants often get more time.', 'After a foreclosure, tenants who rented from the former owner usually get at least 90 days’ notice under federal law. A real lease signed before the foreclosure sale transferred title may let them stay until it ends, unless you will live in the home yourself. Ask your attorney whether the tenant qualifies.'],
    find: ['An attorney who handles evictions after foreclosure. Check them with the state bar, using the lookup on this page.', 'In Nevada, Clark County’s eviction page explains the steps; in Las Vegas Township, Metro police officers carry out court-ordered lockouts.', 'In Nevada, Clark County says its fast “summary eviction” can’t be used to remove a former owner, or the former owner’s tenant, after a foreclosure; those cases need an attorney.'],
    ask: ['How long will it take, and what will it cost?', 'Do the occupants have a lease or extra time under the law?', 'What can I do (and not do) while I wait?'],
  },
  {
    key: 'environmental',
    title: 'Environmental consultant',
    summary: 'For commercial property: a Phase I environmental report, a records-and-site check for past contamination.',
    does: 'An environmental consultant does a Phase I environmental site assessment. That’s a records search, interviews and a site visit, looking for past uses that could have left pollution behind.',
    when: ['Commercial property, before you take title: cleanup can cost more than the price.', 'Vacant land with a past commercial or industrial use, such as an old gas station or dry cleaner.'],
    find: ['Ask a commercial lender or broker for consultants who do Phase I assessments.'],
    ask: ['How long will the Phase I take, and what does it cost?', 'What happens if you find a problem?'],
  },
];

export const proGuideByKey = (k: string) => PRO_GUIDES.find((p) => p.key === k);

/** Most first-time buyers need these, whatever the kind of sale (a cash buyer can skip the lender). */
export const CORE_TEAM: ProKey[] = ['agent', 'lender', 'title', 'attorney', 'inspector', 'insurance'];
