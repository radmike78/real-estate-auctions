// "Find a pro": a beginner's guide to the professionals in a forced-sale purchase — what each one does, when you
// need them, how to find one and what to ask. It teaches; it doesn't vouch for anyone. Each entry names the state
// office that licenses that kind of professional so people can look someone up themselves before hiring.

import { CATEGORIES, type Category } from './pros';

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
  /** The state office that licenses them, with its public lookup. */
  license?: { who: string; url: string };
  /** Advertiser categories that match, for the "who advertises on DeedOwl" list. */
  directory?: Category[];
}

const lic = (c: Category) => ({ who: CATEGORIES[c].regulator, url: CATEGORIES[c].lookupUrl });
const EVICTION = 'https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process';

export const PRO_GUIDES: ProGuide[] = [
  {
    key: 'agent',
    title: 'Real estate agent',
    summary: 'Finds and prices properties, writes offers and negotiates for you.',
    does: 'An agent finds properties, estimates what they’re worth, writes your offer and negotiates. You buy bank-owned homes and short sales through an agent; at auctions you bid yourself, but an agent helps you price the property and sell or rent it after.',
    when: ['Bank-owned (REO) and HUD homes: offers go through an agent (HUD homes need a HUD-registered broker).', 'Short sales: an agent handles the offer and the lender’s approval.', 'Auctions: pricing before you bid, and selling or renting after.'],
    find: ['Ask for an agent who has closed bank-owned, short-sale or auction purchases in Clark County, and ask for recent examples.', 'Interview two or three before you choose.'],
    ask: ['How many investor, bank-owned or auction purchases have you closed here?', 'Who pays your commission on this purchase, and how much is it?', 'Will you help me estimate repairs and resale value?'],
    license: lic('agent'),
    directory: ['agent'],
  },
  {
    key: 'lender',
    title: 'Loan officer or mortgage lender',
    summary: 'Arranges a mortgage and gives you a Loan Estimate to compare.',
    does: 'A loan officer at a bank, credit union or mortgage company arranges a home loan and gives you a Loan Estimate that lists the rate and costs. A pre-approval letter shows sellers you can pay.',
    when: ['Bank-owned homes and short sales: get pre-approved before you make an offer.', 'Auctions usually need cash on sale day, so a mortgage comes later, to refinance.'],
    find: ['Get Loan Estimates from at least three lenders (a bank, a credit union and a mortgage company) and compare them line by line.', 'Ask whether they lend on homes that need repairs; some loans include repair money.'],
    ask: ['What are the rate, points and closing costs?', 'Do you lend on homes that need work?', 'How long will it take to close?'],
    license: lic('loan_officer'),
    directory: ['loan_officer', 'mortgage_company', 'bank', 'credit_union'],
  },
  {
    key: 'private_lender',
    title: 'Hard-money or private lender',
    summary: 'Short-term loans for auction buys and fix-and-flips, at higher cost.',
    does: 'Hard-money and private lenders make short-term loans based mostly on the property, often to repay the cash you used at an auction or to fund repairs. They close fast but cost more than a mortgage.',
    when: ['After an auction, to replace the cash you paid.', 'For a fix-and-flip, to cover the price and repairs.'],
    find: ['Compare written terms from several lenders; ask local investors who they’ve used.', 'Line it up before the sale: most auctions want full payment the same day.'],
    ask: ['What are the rate, points, fees and any prepayment penalty?', 'How much of the price and repairs will you lend?', 'How fast can you fund, and what do you need from me?'],
    license: lic('private_lender'),
    directory: ['private_lender'],
  },
  {
    key: 'title',
    title: 'Title and escrow company',
    summary: 'Checks the records for liens, insures title and handles the closing.',
    does: 'A title company searches the property’s records for liens and ownership problems and issues title insurance. Escrow holds the money and documents until the purchase closes.',
    when: ['Every purchase closes through title and escrow.', 'Before an auction: a title search shows which liens may survive the sale.', 'After a tax or foreclosure sale, many won’t insure until a quiet title action is done.'],
    find: ['Call a few title companies in Las Vegas and ask for a title search or preliminary title report on the parcel.', 'For an auction property, ask whether and when they would insure it.'],
    ask: ['Will you insure this property after this kind of sale, and what do you need first?', 'What does a title search cost, and how long does it take?', 'Which liens could stay with the property?'],
    license: lic('title_escrow'),
    directory: ['title_escrow'],
  },
  {
    key: 'attorney',
    title: 'Real estate attorney',
    summary: 'Explains your rights, reviews liens and sale problems, and handles quiet title.',
    does: 'A real estate attorney reviews the sale and any title problems, explains what survives the sale, and files a quiet title action when a title company needs one.',
    when: ['Tax sales, foreclosure auctions, HOA and sheriff sales, and lien certificates.', 'Any time there are surviving liens, a challenge to the sale, or people living in the property.'],
    find: ['The State Bar of Nevada has a lawyer referral service and a search by name.', 'Ask for an attorney who handles quiet title and foreclosure matters in Clark County.'],
    ask: ['Have you handled quiet title actions here? How long do they take?', 'Flat fee or hourly, and what’s your estimate?', 'What should I do before I bid?'],
    license: lic('attorney'),
    directory: ['attorney'],
  },
  {
    key: 'inspector',
    title: 'Home inspector',
    summary: 'Examines the home’s condition and writes a report before you buy.',
    does: 'A home inspector checks the roof, plumbing, electrical, heating and cooling, and structure, and writes a report so you know what repairs to expect.',
    when: ['Bank-owned homes and short sales: during your inspection period, before you’re committed.', 'Auctions: you usually can’t go inside, so plan for an exterior look and a repair cushion.'],
    find: ['Ask your agent for a few names, and read a sample report from each.', 'Nevada licenses home inspectors through the Real Estate Division.'],
    ask: ['Can I see a sample report?', 'Do you check the sewer line, roof or pool, or is that separate?', 'When will I get the report?'],
    license: lic('home_inspector'),
    directory: ['home_inspector'],
  },
  {
    key: 'appraiser',
    title: 'Appraiser',
    summary: 'The only way to know what a property is worth.',
    does: 'A state-licensed or certified appraiser studies the property and recent sales of similar properties nearby, and writes an appraisal: a professional opinion of its value. Value depends on the neighborhood, comparable sales, condition and the market, and an appraisal is the only way to know it. Your own numbers, and your agent’s, are estimates until then.',
    when: ['Before you set your maximum bid or offer: the value as it stands and after the repairs you plan.', 'Before you count on a refinance, since the lender’s appraisal sets the loan.', 'At an auction you often can’t go inside. Ask whether an exterior-only appraisal is possible, and allow for what it can’t see.'],
    find: ['Look up appraisers licensed in your state on the national registry of state-licensed and certified appraisers.', 'Ask your real estate agent or lender for appraisers they trust. Your agent can estimate the value from recent comparable sales while you wait.'],
    ask: ['Are you licensed or certified in this state for this kind of property?', 'Can you value it both as it stands and after the repairs I plan?', 'Which comparable sales did you use, and why?', 'What does it cost, and how soon can you finish?'],
    license: { who: 'Appraisal Subcommittee: national registry of state-licensed and certified appraisers', url: 'https://www.asc.gov/appraiser' },
  },
  {
    key: 'contractor',
    title: 'Licensed contractor',
    summary: 'Bids on and does the repairs, with the right license and permits.',
    does: 'A contractor prices and does repairs and pulls permits. Nevada requires a contractor’s license for most repair work, and each license has a type of work and a dollar limit.',
    when: ['Before you buy: a repair estimate, even from the outside, to set your maximum bid.', 'After you own it: the full scope once you have the keys.'],
    find: ['Get at least three written bids for the same scope of work.', 'Ask for proof of insurance, and never pay large sums upfront.'],
    ask: ['Does the job fit your license’s type of work and dollar limit?', 'What’s the payment schedule?', 'Who pulls the permits?'],
    license: lic('contractor'),
    directory: ['contractor'],
  },
  {
    key: 'insurance',
    title: 'Insurance agent',
    summary: 'Insures the property from the day you own it, including when it’s vacant.',
    does: 'An insurance agent sets up coverage for the property. Vacant homes, rentals and homes under renovation often need a special policy.',
    when: ['From the day you own it: at an auction, that’s the day of the sale.', 'Before renovation or renting it out.'],
    find: ['Ask agents who write vacant-property, landlord or renovation policies, and compare quotes.'],
    ask: ['Do you cover vacant properties and renovations?', 'Can coverage start the day I win the auction?', 'What isn’t covered?'],
    license: lic('insurance'),
    directory: ['insurance'],
  },
  {
    key: 'cpa',
    title: 'CPA or tax advisor',
    summary: 'Explains how your deal is taxed and how to hold the property.',
    does: 'A CPA explains how a flip, a rental or lien-certificate interest is taxed for you, and whether to buy in your own name or a company.',
    when: ['Before you buy: the plan changes the taxes.', 'At tax time, for your records and deductions.'],
    find: ['Ask for a CPA who works with real estate investors.'],
    ask: ['How would a flip and a rental be taxed for me?', 'Should I buy in my own name or an LLC?', 'What records should I keep?'],
    license: lic('cpa'),
    directory: ['cpa'],
  },
  {
    key: 'property_manager',
    title: 'Property manager',
    summary: 'Finds tenants, collects rent and handles repairs on a rental.',
    does: 'A property manager advertises the rental, screens tenants, collects rent and arranges repairs.',
    when: ['If you’ll rent the property out.', 'Commercial property with tenants: from day one.'],
    find: ['Ask local investors who they use, and compare fees and contracts.', 'Nevada property managers need a permit from the Real Estate Division.'],
    ask: ['What’s your monthly fee, and your fee to find a tenant?', 'How do you screen tenants?', 'How are repairs approved and billed?'],
    license: lic('property_manager'),
    directory: ['property_manager'],
  },
  {
    key: 'eviction',
    title: 'Eviction help',
    summary: 'The legal way to take possession when someone still lives there.',
    does: 'If people still live in a property you bought, there is a legal process to take possession. You can’t change the locks or remove people or belongings yourself.',
    when: ['Right after a tax, foreclosure, HOA or sheriff sale, if the property is occupied.', 'Former owners and tenants get different notice periods; tenants often get more time.'],
    find: ['An attorney who handles evictions after foreclosure.', 'The Las Vegas Township Constable explains the eviction process and carries out lockouts.'],
    ask: ['How long will it take, and what will it cost?', 'Do the occupants have a lease or extra time under the law?', 'What can I do (and not do) while I wait?'],
    license: { who: 'Clark County: Las Vegas Township Constable', url: EVICTION },
  },
  {
    key: 'environmental',
    title: 'Environmental consultant',
    summary: 'For commercial property: a Phase I check for contamination.',
    does: 'An environmental consultant does a Phase I environmental site assessment: a records search, interviews and a site visit that look for past uses that could leave contamination.',
    when: ['Commercial property, before you take title: cleanup costs can exceed the price.'],
    find: ['Ask a commercial lender or broker for consultants who do Phase I assessments.'],
    ask: ['How long will the Phase I take, and what does it cost?', 'What happens if you find a problem?'],
  },
];

export const proGuideByKey = (k: string) => PRO_GUIDES.find((p) => p.key === k);

/** Most first-time buyers of a forced-sale property need these, whatever the kind of sale. */
export const CORE_TEAM: ProKey[] = ['agent', 'title', 'attorney', 'inspector', 'insurance'];
