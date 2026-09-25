// Nevada / Clark County playbooks: how each kind of forced sale actually works, step by step.
// Facts come from the Nevada Revised Statutes and Clark County's own pages (see `sources`).
// Anything that changes each sale (dates, deposits, deadlines) says to confirm in the current notice.
// Examples are illustrative, not real properties or transactions.

import type { SaleType } from '../types';

export interface Playbook {
  key: string;
  title: string;
  short: string; // tile label
  oneLine: string;
  youGet: string;
  forSale: boolean;
  glance: { label: string; value: string }[];
  steps: { title: string; detail: string }[];
  survives: { wipedOut: string[]; mayStay: string[] };
  mistakes: { mistake: string; prevent: string }[];
  example: { title: string; story: string; lesson: string };
  team: { role: string; when: string; href?: string }[];
  sources: { label: string; url: string }[];
  lastReviewed: string;
}

const REVIEWED = '2026-09-25';
const NRS = (ch: string) => `https://www.leg.state.nv.us/NRS/NRS-${ch}.html`;
const TREASURER_FAQ = 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs';
const RECORDER = 'https://recorderecomm.clarkcountynv.gov/AcclaimWeb/';
const ASSESSOR = 'https://www.clarkcountynv.gov/government/assessor/';
const EVICTION = 'https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process';

const T = {
  agent: { role: 'Real estate agent', when: 'Finding and pricing the property, and selling or renting it after', href: '#/agents' },
  lender: { role: 'Hard-money or bridge lender', when: 'Lined up before the sale; most auctions need cash the same day, so loans usually come after', href: '#/financing' },
  mortgage: { role: 'Loan officer or mortgage company', when: 'Pre-approval before you make an offer', href: '#/financing' },
  title: { role: 'Title company or title researcher', when: 'A title search before you bid, and title insurance when available', href: '#/pros' },
  attorney: { role: 'Real estate attorney', when: 'Reviewing surviving liens, sale validity and quiet title', href: 'https://www.nvbar.org/' },
  eviction: { role: 'Eviction attorney or process server', when: 'Right after the sale if anyone lives there', href: EVICTION },
  insurance: { role: 'Insurance agent', when: 'Vacant-property coverage starting the day you own it', href: '#/pros' },
  contractor: { role: 'Licensed contractor and inspector', when: 'An exterior look before the sale; a full scope once you have the keys', href: '#/pros' },
  cpa: { role: 'CPA', when: 'Before you buy: flips and rentals are taxed differently' },
};

export const PLAYBOOKS: Playbook[] = [
  {
    key: 'tax',
    title: 'Clark County tax sale (tax deed)',
    short: 'Tax sales',
    oneLine: 'Properties with three or more years of unpaid property taxes, sold by the Treasurer at an in-person auction.',
    youGet: 'The property, by quitclaim deed from the Treasurer, with no warranty of title.',
    forSale: true,
    glance: [
      { label: 'Run by', value: 'Clark County Treasurer, as trustee for the state and county' },
      { label: 'How often', value: 'Usually once a year in spring; sometimes a second sale' },
      { label: 'Where', value: 'In person, Commission Chambers, 500 S. Grand Central Pkwy (confirm in the notice)' },
      { label: 'Register', value: 'Opens about 3–4 weeks before and closes about a week before. Capped at 280 bidders. No registration on the day.' },
      { label: 'Deposit', value: '$5,000 per bidder in certified funds; credited if you win' },
      { label: 'Payment', value: "Full price the same day by 1:00 p.m. (4:30 p.m. for parcels re-auctioned at 2:00 p.m.) in cash, cashier's check or money order; confirm accepted forms in the notice. No financing." },
      { label: 'Deed', value: 'Quitclaim deed in your individual name (not an LLC or trust), recorded within 30 days' },
      { label: 'After the sale', value: 'No redemption, but the former owner can protest for 2 years; title insurance may be unavailable meanwhile' },
    ],
    steps: [
      { title: 'Get the list and the notice', detail: 'The Treasurer publishes the parcel list and the auction information notice before each sale. Parcels drop off as owners pay (lined out) until a few days before.' },
      { title: 'Narrow the list', detail: 'Match every parcel number on the Assessor map. Throw out strips, common areas, landlocked lots and anything you can’t use or sell.' },
      { title: 'Research each finalist', detail: 'Search the Recorder for liens (IRS, city, sewer, special assessments), check for occupants, and drive by. The county makes no promises about condition or liens.' },
      { title: 'Set a maximum bid for each', detail: 'Count quiet title ($1,500–$5,000+ uncontested), liens that may stay, repairs, holding costs and possession. Use the max bid calculator.' },
      { title: 'Register and pay the deposit', detail: 'Submit the registration form in your own name with the $5,000 certified-funds deposit by the deadline. Watch for the confirmation email.' },
      { title: 'Auction day', detail: 'Check in from 7:00 a.m. with photo ID and your confirmation. No phones or laptops in the room. Parcels are read in list order.' },
      { title: 'Pay by 1:00 p.m.', detail: 'Pay in full for every parcel you win. If you don’t, you lose the deposit and are banned from future sales. Unsold or unpaid parcels may be re-auctioned at 2:00 p.m.' },
      { title: 'After you win', detail: 'Insure the property, secure it, and plan possession with an attorney if anyone lives there (the county won’t help). Talk to a title company about when they can insure; many need a quiet title action first.' },
    ],
    survives: {
      wipedOut: ['The delinquent property taxes and costs paid by your bid', 'Most private liens and mortgages (confirm with a title professional)'],
      mayStay: ['Federal tax liens (the IRS can redeem within 120 days)', 'Some city and special assessment liens (a city SID certificate on the parcel must be paid within 20 days of the sale, or the county sale is void, NRS 361.595)', 'Easements, covenants and HOA restrictions', 'The former owner’s right to protest the sale for 2 years'],
    },
    mistakes: [
      { mistake: 'Bidding on a parcel you never looked up', prevent: 'Match the parcel number on the Assessor map, not just the address.' },
      { mistake: 'Planning to resell right away', prevent: 'Budget for the 2-year protest window or a quiet title action before a title company will insure.' },
      { mistake: 'Registering in a company name', prevent: 'Register as an individual; move it to an LLC later with a new deed if your attorney recommends it.' },
      { mistake: 'Winning several parcels without the cash for all of them', prevent: 'Bring certified funds for everything you might win. One unpaid parcel costs the deposit and a ban.' },
    ],
    example: {
      title: 'The $3,400 lot that wasn’t a lot',
      story: 'A vacant parcel had a minimum bid of $3,400 and an assessed land value ten times higher. On the Assessor map it was a 12-foot strip between two houses with no street access.',
      lesson: 'Cheap parcels are often unusable. Walking away cost nothing; buying it would have meant paying taxes on land no one can use.',
    },
    team: [T.title, T.attorney, T.lender, T.insurance, T.eviction, T.contractor, T.agent, T.cpa],
    sources: [
      { label: 'Clark County Treasurer: tax auction FAQs', url: TREASURER_FAQ },
      { label: 'Clark County Treasurer: auction list', url: 'https://treasurer.clarkcountynv.gov/auction' },
      { label: 'Treasurer: past auction results', url: 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/real-property-tax-auction-information' },
      { label: 'NRS 361 (property tax, tax sales)', url: NRS('361') },
      { label: 'Clark County Assessor', url: ASSESSOR },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'sid',
    title: 'Special assessment lien certificates',
    short: 'Lien certificates',
    oneLine: 'Clark County sells the lien for unpaid special improvement district (SID) assessments. You buy a debt that earns interest, not the property.',
    youGet: 'A certificate of sale: the right to be repaid plus 1% a month. You can ask for a deed only if the owner never redeems, and the certificate expires if you wait too long.',
    forSale: true,
    glance: [
      { label: 'Run by', value: 'Clark County Treasurer (special improvement districts)' },
      { label: 'Law', value: 'NRS 271' },
      { label: 'How winners are chosen', value: 'A random drawing among registered buyers, with first and second alternates. Not highest bid.' },
      { label: 'Register', value: 'In person on sale day, about an hour before, with photo ID; the certificate is issued in that name. No deposit or fee.' },
      { label: 'Payment', value: "By 10:00 a.m. the next business day, in cash, cashier's check or money order" },
      { label: 'Interest', value: '1% a month simple interest on the certificate price, paid when the owner redeems' },
      { label: 'Redemption', value: '120 days, or 2 years if there is a home or significant improvement on the land' },
      { label: 'Deed', value: 'After the redemption period: notify the owner, who has 60 more days to redeem. You must pay delinquent taxes and assessments first. The certificate expires 3 years after redemption ends if you never ask for a deed (NRS 271.595).' },
      { label: 'Taxes', value: 'You file a W-9; interest over $10 is reported on a 1099-INT' },
    ],
    steps: [
      { title: 'Check the sale list', detail: 'The Treasurer gives notice of the sale within 60 days after an assessment installment goes delinquent.' },
      { title: 'Research the parcels', detail: 'The Assessor has parcel details but not liens; search the Recorder too. Know what the land is in case you end up owning it.' },
      { title: 'Register in person', detail: 'Bring what the Treasurer requires. You must be present; friends and family can’t register for you.' },
      { title: 'Drawing and payment', detail: "A random number generator picks the winner and two alternates for each parcel. Pay by 10:00 a.m. the next business day in cash, cashier's check or money order, or the certificate goes to the next person." },
      { title: 'Wait for redemption', detail: 'Most owners pay. You receive the price plus 1% a month, usually 30–60 days after they redeem. You may pay later delinquent taxes and add them to the certificate by giving the Treasurer written notice and receipts.' },
      { title: 'If there is no redemption', detail: 'After the period ends, give the owner notice of your intent to request a deed. If they still don’t redeem within 60 days, pay any delinquent taxes and assessments and request the deed. Don’t wait: the certificate expires 3 years after the redemption period ends.' },
    ],
    survives: {
      wipedOut: ['While you hold the certificate: nothing, you hold a lien that ranks with general taxes', 'If you take a deed: other liens and claims, except taxes and assessments (NRS 271.600)'],
      mayStay: ['Mortgages and other liens, until a deed is issued', 'Property taxes and other assessments', 'Liens held by the FDIC for failed banks, which the FDIC says a certificate does not extinguish'],
    },
    mistakes: [
      { mistake: 'Expecting to get the property', prevent: 'Treat it as an investment in a debt. Most certificates are redeemed.' },
      { mistake: 'Ignoring what’s on the land', prevent: 'If there is a building, the redemption period is 2 years, not 120 days.' },
      { mistake: 'Forgetting later taxes', prevent: 'Pay later delinquent taxes and notify the Treasurer in writing so they’re added to your certificate.' },
    ],
    example: {
      title: 'Reading the interest correctly',
      story: 'A $2,000 certificate redeemed after 8 months pays $160 in interest (1% a month, simple), about 30–60 days after the owner pays.',
      lesson: 'It’s a slow, modest return that depends on patience and paperwork, not a shortcut to owning homes.',
    },
    team: [T.title, T.attorney, T.cpa],
    sources: [
      { label: 'Clark County Treasurer FAQs (special assessment certificates)', url: TREASURER_FAQ },
      { label: 'NRS 271 (local improvements, certificates of sale)', url: NRS('271') },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'foreclosure',
    title: 'Trustee sale (mortgage foreclosure)',
    short: 'Foreclosure auctions',
    oneLine: 'Most Nevada foreclosures are non-judicial: a trustee sells the home at auction after the owner defaults.',
    youGet: 'The owner’s interest by trustee’s deed, subject to anything senior to the loan being foreclosed.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 107 (deeds of trust)' },
      { label: 'Timeline', value: 'Notice of default, then at least 3 months, then a notice of sale, then the auction' },
      { label: 'Notice of sale', value: 'Posted for 20 days and published once a week for 3 weeks' },
      { label: 'Mediation', value: 'Owner-occupants can petition the court for foreclosure mediation within 30 days after the notice of default is served; a sale of an owner-occupied home needs a recorded mediation certificate' },
      { label: 'Payment', value: "Usually cashier's checks for the full bid at the sale; each trustee sets its terms" },
      { label: 'Redemption', value: 'None for the owner. If a federal tax lien was on the property, the U.S. can redeem within 120 days (26 U.S.C. § 7425)' },
      { label: 'Challenges', value: 'A lawsuit can void the sale if filed within 30 days after the trustee’s deed is recorded (90 days for defective notice), NRS 107.080' },
      { label: 'Postponements', value: 'Common. Confirm with the trustee the day before' },
      { label: 'Where listed', value: 'Recorded notices; trustee and auction company sites; legal newspapers' },
    ],
    steps: [
      { title: 'Follow the notices', detail: 'Track the notice of default and notice of sale (the pre-foreclosure tracker shows where each one is). The notice of sale gives the date, place and trustee.' },
      { title: 'Identify which loan is foreclosing', detail: 'If it’s a second mortgage or a junior lien, the first mortgage stays and becomes your problem. Get a title search.' },
      { title: 'Check for senior debts', detail: 'Property taxes, HOA dues (including up to 9 months of super-priority), IRS liens and city liens may survive.' },
      { title: 'Look at the property', detail: 'From the outside only. Assume it may be occupied and need major repairs.' },
      { title: 'Set your maximum bid', detail: 'Include surviving debts, repairs, eviction and holding costs. Use the max bid calculator.' },
      { title: 'Confirm the sale is on', detail: 'Call the trustee the day before. Sales are often postponed or cancelled when owners reinstate, sell or file bankruptcy.' },
      { title: 'Bid with certified funds', detail: "Bring cashier's checks in amounts that let you pay exactly your bid, per the trustee's terms." },
      { title: 'After you win', detail: 'Get the trustee’s deed recorded, insure the property, and serve the right notices if anyone lives there.' },
    ],
    survives: {
      wipedOut: ['The loan being foreclosed', 'Liens recorded after it (junior liens), in most cases'],
      mayStay: ['Any loan recorded before the one being foreclosed', 'Property taxes', 'Up to 9 months of HOA dues (super-priority)', 'Federal tax liens if the IRS wasn’t properly notified; even if discharged, the U.S. can redeem within 120 days', 'Some city liens'],
    },
    mistakes: [
      { mistake: 'Buying at a second mortgage’s sale', prevent: 'Confirm which lien is foreclosing; the first mortgage survives a junior lien’s sale.' },
      { mistake: 'Driving to a sale that was postponed', prevent: 'Call the trustee the day before and check the status here.' },
      { mistake: 'Forgetting occupants', prevent: 'Bona fide tenants get at least 90 days’ written notice under federal law (Protecting Tenants at Foreclosure Act), and a lease can run to its end unless the buyer will live there; former owners get a 3-day notice (NRS 40.255).' },
    ],
    example: {
      title: 'The $40,000 opening bid',
      story: 'A $420,000 house had a $40,000 opening bid. A title search showed the sale was for a second mortgage; the $310,000 first mortgage would stay with the house.',
      lesson: 'The real price was about $350,000 plus repairs, more than the house was worth after fixing it. The buyer walked away and saved a six-figure mistake.',
    },
    team: [T.title, T.attorney, T.lender, T.insurance, T.eviction, T.contractor, T.agent, T.cpa],
    sources: [
      { label: 'NRS 107 (deeds of trust, trustee sales)', url: NRS('107') },
      { label: 'NRS 40 (possession after foreclosure, NRS 40.255)', url: NRS('040') },
      { label: 'Protecting Tenants at Foreclosure Act (OCC summary)', url: 'https://www.occ.treas.gov/publications-and-resources/publications/comptrollers-handbook/files/protecting-tenants-foreclosure/pub-ch-ptfa.pdf' },
      { label: 'Foreclosure mediation (Eighth Judicial District Court)', url: 'https://www.clarkcountycourts.us/departments/adr/foreclosure-mediation/' },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'hoa',
    title: 'HOA foreclosure',
    short: 'HOA foreclosures',
    oneLine: 'A homeowners association sells a home to collect unpaid dues, under NRS 116.',
    youGet: 'The owner’s title, subject to a 60-day redemption period, and possibly subject to the first mortgage.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 116 (common-interest communities)' },
      { label: 'Super-priority', value: 'Up to 9 months of dues (plus certain charges) rank ahead of the first mortgage' },
      { label: 'Lender payoff', value: 'If the lender pays the priority amount at least 5 days before the sale, the first mortgage survives' },
      { label: 'Fannie Mae / Freddie Mac loans', value: 'If one of them owned the loan, the mortgage survives an HOA sale unless the FHFA consented (federal Foreclosure Bar)' },
      { label: 'Redemption', value: '60 days after the sale, at your price plus 1% a month plus taxes, assessments and upkeep you paid' },
      { label: 'What you get first', value: 'A certificate of sale; a deed after the redemption period' },
      { label: 'Payment', value: 'Certified funds; confirm the terms with the HOA’s foreclosure agent' },
    ],
    steps: [
      { title: 'Find the sale notice', detail: 'HOA sales are noticed and recorded like trustee sales. Confirm the date with the HOA’s foreclosure agent.' },
      { title: 'Check whether the lender paid', detail: 'Search the Recorder for a recorded payment of the super-priority amount (it must be recorded at least 2 days before the sale), and listen for the auctioneer’s announcement. If the lender paid at least 5 days before the sale, you take the home with the first mortgage. Also check whether Fannie Mae or Freddie Mac owned the loan; if so, it usually survives.' },
      { title: 'Get a professional opinion', detail: 'Nevada HOA sales were heavily litigated after the SFR Investments decision (2014). Have a title professional or attorney review the sale before you bid.' },
      { title: 'Set your maximum bid', detail: 'If the first mortgage may survive, add it to your costs. Use the max bid calculator.' },
      { title: 'Bid and pay', detail: 'Bring certified funds per the agent’s terms.' },
      { title: 'Wait out the 60 days', detail: 'The former owner or a lender can redeem by paying your price plus 1% a month. Don’t spend on repairs until the period ends.' },
    ],
    survives: {
      wipedOut: ['The HOA lien being foreclosed', 'The first mortgage, only if the lender did not pay the priority amount, the loan wasn’t owned by Fannie Mae or Freddie Mac, and the sale was proper'],
      mayStay: ['The first mortgage, if the lender paid the priority amount in time or Fannie Mae or Freddie Mac owned the loan', 'Property taxes', 'Federal tax liens', 'The 60-day redemption right'],
    },
    mistakes: [
      { mistake: 'Assuming every HOA sale wipes out the mortgage', prevent: 'Check the Recorder for the lender’s payment before bidding.' },
      { mistake: 'Starting repairs right away', prevent: 'Wait until the 60-day redemption period has ended.' },
    ],
    example: {
      title: 'The $9,000 condo',
      story: 'A condo worth about $260,000 went to an HOA sale with a $9,000 opening bid. The Recorder showed the lender had paid the HOA’s priority amount ten days before the sale.',
      lesson: 'The $190,000 first mortgage would survive, making the real cost about $199,000 plus unpaid dues and repairs. Not a bargain. Walk away.',
    },
    team: [T.attorney, T.title, T.lender, T.insurance, T.eviction, T.contractor, T.agent],
    sources: [
      { label: 'NRS 116 (NRS 116.3116 priority, 116.31166 redemption)', url: NRS('116') },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'sheriff',
    title: 'Sheriff and constable sales (court judgments)',
    short: 'Sheriff sales',
    oneLine: 'Property sold to pay a court judgment, including judicial foreclosures.',
    youGet: 'The debtor’s interest, subject to a 1-year redemption right, and to anything senior to the judgment.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 21 (execution sales)' },
      { label: 'Where', value: 'Clark County Sheriff Civil Section sales (see the sheriff’s sales page)' },
      { label: 'Redemption', value: '1 year after the sale, at your price plus 1% a month (NRS 21.210)' },
      { label: 'What you get first', value: 'A certificate of sale; a deed after the redemption period' },
      { label: 'Payment', value: 'Certified funds per the sale notice' },
    ],
    steps: [
      { title: 'Find the sale', detail: 'Check the Sheriff Civil Section’s sales listings and the notice for the case.' },
      { title: 'Research the title', detail: 'You receive only the debtor’s interest. Senior mortgages and liens stay.' },
      { title: 'Plan for a year of waiting', detail: 'The debtor can redeem for a year. Your money is tied up and you shouldn’t improve the property until then.' },
      { title: 'Set your maximum bid', detail: 'Include a year or more of holding costs. Use the max bid calculator.' },
    ],
    survives: {
      wipedOut: ['The judgment lien being enforced', 'Junior liens, in most cases'],
      mayStay: ['Mortgages and liens senior to the judgment', 'Property taxes', 'The 1-year redemption right'],
    },
    mistakes: [{ mistake: 'Treating it like a quick flip', prevent: 'Plan to hold for at least a year before improving or reselling.' }],
    example: {
      title: 'A year of waiting',
      story: 'A buyer paid $120,000 at a sheriff’s sale and started repairs. Eleven months later the debtor redeemed, repaying the price plus 1% a month but not the repair spending.',
      lesson: 'The interest covered the wait, not the repairs. Don’t improve a property until the redemption period ends.',
    },
    team: [T.attorney, T.title, T.insurance, T.agent],
    sources: [
      { label: 'NRS 21 (execution sales; NRS 21.210 redemption)', url: NRS('021') },
      { label: 'Clark County Sheriff: sheriff’s sales', url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/sheriff_s_sales/' },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'irs',
    title: 'IRS seizure sales',
    short: 'IRS sales',
    oneLine: 'The IRS seizes and sells property to collect unpaid federal taxes, by public auction or sealed bid.',
    youGet: 'The taxpayer’s interest by quitclaim-type deed, after a 180-day redemption period.',
    forSale: true,
    glance: [
      { label: 'Where listed', value: 'irsauctions.gov' },
      { label: 'Redemption', value: '180 days; the owner repays your price plus 20% a year' },
      { label: 'Deposit', value: 'Set in each sale notice; sealed bids usually need a deposit with the bid' },
      { label: 'What you get first', value: 'A certificate of sale; a deed after 180 days' },
    ],
    steps: [
      { title: 'Watch irsauctions.gov', detail: 'Sales are few and scattered. Read each notice of sale for terms, deposit and payment deadlines.' },
      { title: 'Research the title', detail: 'You get only the taxpayer’s interest. Mortgages and other senior liens stay.' },
      { title: 'Plan for 180 days', detail: 'The owner can redeem for 180 days. Whether you can collect rent, evict or move in during that time depends on state law; ask an attorney before you bid.' },
    ],
    survives: { wipedOut: ['The federal tax lien being enforced'], mayStay: ['Mortgages and liens senior to the IRS', 'Property taxes', 'The 180-day redemption right'] },
    mistakes: [{ mistake: 'Assuming a clean title', prevent: 'Get a title search; you inherit senior liens.' }],
    example: {
      title: 'Counting the waiting period',
      story: 'A buyer planned a 4-month flip on an IRS sale property, then learned it couldn’t be touched for 180 days.',
      lesson: 'Build the redemption period into holding costs from the start.',
    },
    team: [T.title, T.attorney, T.insurance, T.agent],
    sources: [{ label: 'IRS auctions', url: 'https://www.irsauctions.gov/' }],
    lastReviewed: REVIEWED,
  },
  {
    key: 'reo',
    title: 'Bank-owned (REO) and HUD homes',
    short: 'Bank-owned (REO)',
    oneLine: 'Homes a lender took back at a foreclosure auction, sold through agents or online auctions.',
    youGet: 'The property by a normal purchase contract, usually with a lender addendum and a special warranty deed.',
    forSale: true,
    glance: [
      { label: 'How it’s sold', value: 'Listed by a broker, or by online auction' },
      { label: 'Financing', value: 'Allowed; get pre-approved first' },
      { label: 'Inspection', value: 'Usually allowed within your contingency period' },
      { label: 'Title', value: 'Normal title insurance and escrow' },
      { label: 'HUD homes', value: 'Bid through a HUD-registered broker; owner-occupants get a first bidding period' },
      { label: 'Fannie Mae & Freddie Mac', value: 'Owner-occupants get a 30-day “First Look” period before investors' },
      { label: 'Online auctions', value: 'Check the buyer’s premium and whether the seller must approve the winning bid' },
    ],
    steps: [
      { title: 'Get pre-approved', detail: 'Or have proof of funds ready for cash offers.' },
      { title: 'Choose a buyer’s agent', detail: 'REO and HUD sales go through listing brokers. HUD requires a HUD-registered broker.' },
      { title: 'Offer and read the addendum', detail: 'The lender’s addendum usually overrides parts of the standard contract, including repairs and deadlines.' },
      { title: 'Inspect and appraise', detail: 'Use your contingency period. Homes are usually sold as-is.' },
      { title: 'Close through escrow', detail: 'With title insurance, like a normal purchase.' },
    ],
    survives: { wipedOut: ['Most liens are cleared by the lender before or at closing (confirm on the title report)'], mayStay: ['Anything listed as an exception on the title report'] },
    mistakes: [{ mistake: 'Skipping the addendum', prevent: 'Read every page; it can shift costs and deadlines to you.' }],
    example: {
      title: 'The addendum’s fine print',
      story: 'A buyer’s offer on a bank-owned home was accepted, but the addendum made the buyer pay a per-day penalty if closing ran late.',
      lesson: 'Line up your loan and inspection early, and read the addendum before signing.',
    },
    team: [T.agent, T.mortgage, T.title, T.contractor, T.insurance],
    sources: [
      { label: 'HUD Home Store', url: 'https://www.hudhomestore.gov/' },
      { label: 'Fannie Mae HomePath', url: 'https://homepath.fanniemae.com/property-finder' },
      { label: 'Freddie Mac HomeSteps', url: 'https://www.homesteps.com/' },
      { label: 'VA-acquired homes', url: 'https://www.benefits.va.gov/homeloans/realtors_property_mgmt.asp' },
      { label: 'Every direct bank and government source for Clark County', url: '#/bank-owned' },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'short',
    title: 'Short sales',
    short: 'Short sales',
    oneLine: 'The owner sells for less than they owe, with the lender’s approval.',
    youGet: 'The property by a normal sale through escrow, once the lender approves.',
    forSale: true,
    glance: [
      { label: 'How it’s sold', value: 'Listed by the owner’s agent, marked "short sale" or "subject to lender approval"' },
      { label: 'Timeline', value: 'Often weeks to months for lender approval' },
      { label: 'Financing', value: 'Allowed' },
      { label: 'Inspection', value: 'Usually allowed' },
      { label: 'Risk', value: 'The lender can reject or counter; foreclosure can happen first' },
    ],
    steps: [
      { title: 'Get pre-approved', detail: 'Lenders want proof you can close.' },
      { title: 'Use an agent with short-sale experience', detail: 'They know how each lender works and how to keep the file moving.' },
      { title: 'Offer subject to lender approval', detail: 'The seller accepts first, then the listing agent sends the package to the lender.' },
      { title: 'Wait, and keep your options open', detail: 'Ask whether a foreclosure sale date is scheduled and whether it’s postponed for the short sale.' },
      { title: 'Close through escrow', detail: 'Never pay side fees outside escrow.' },
    ],
    survives: { wipedOut: ['Liens released by the lenders who approve the sale'], mayStay: ['Any lien whose holder doesn’t agree; the sale can’t close until they do'] },
    mistakes: [{ mistake: 'Paying a “negotiator” outside escrow', prevent: 'All payments go through escrow and are disclosed to the lender.' }],
    example: {
      title: 'Two lenders, one sale',
      story: 'The first lender approved after 10 weeks, but the second-mortgage holder wanted more money to release its lien, adding another month.',
      lesson: 'Ask up front how many liens there are, and expect each to negotiate.',
    },
    team: [T.agent, T.mortgage, T.title, T.contractor],
    sources: [{ label: 'Our short-sale guide', url: '#/short-sales' }],
    lastReviewed: REVIEWED,
  },
];

export const playbookByKey = (k: string) => PLAYBOOKS.find((p) => p.key === k) ?? null;

/** Playbook for a property's sale type. */
export function playbookForSale(t: SaleType | null | undefined): Playbook | null {
  switch (t) {
    case 'TAX_DEED':
      return playbookByKey('tax');
    case 'TAX_LIEN_CERTIFICATE':
      return playbookByKey('sid');
    case 'TRUSTEE_SALE':
      return playbookByKey('foreclosure');
    case 'JUDICIAL_FORECLOSURE':
    case 'SHERIFF_EXECUTION':
      return playbookByKey('sheriff');
    case 'HOA_FORECLOSURE':
      return playbookByKey('hoa');
    case 'FEDERAL_TAX_SEIZURE':
      return playbookByKey('irs');
    case 'REO':
      return playbookByKey('reo');
    default:
      return null;
  }
}
