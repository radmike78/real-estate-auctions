// Nevada / Clark County playbooks: how each kind of forced sale actually works, step by step.
// Facts come from the Nevada Revised Statutes and Clark County's own pages (see `sources`).
// Anything that changes each sale (dates, deposits, deadlines) says to confirm in the current notice.
// Examples are illustrative, not real properties or transactions.

import type { ProKey } from './proGuide';
import type { SaleType } from '../types';
import type { StateCode } from './regions';
import { STATE_GUIDES } from './stateGuides';
import { TEAM } from './playbookTeam';

export interface Playbook {
  key: string;
  title: string;
  short: string; // tile label
  oneLine: string;
  youGet: string;
  /** "What you get" in plain words, when the legal wording needs it; the legal line then shows beneath. */
  plain?: string;
  forSale: boolean;
  glance: { label: string; value: string }[];
  steps: { title: string; detail: string }[];
  survives: { wipedOut: string[]; mayStay: string[] };
  mistakes: { mistake: string; prevent: string }[];
  example: { title: string; story: string; lesson: string };
  team: { role: string; when: string; href?: string; pro?: ProKey }[];
  sources: { label: string; url: string }[];
  lastReviewed: string;
  /** The state whose law the guide follows; the original guides are Nevada’s (Clark County). */
  state?: StateCode;
}

export const stateOf = (p: Playbook): StateCode => p.state ?? 'NV';

const REVIEWED = '2026-09-25';
const NRS = (ch: string) => `https://www.leg.state.nv.us/NRS/NRS-${ch}.html`;
const TREASURER_FAQ = 'https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/faqs';
const RECORDER = 'https://recorderecomm.clarkcountynv.gov/AcclaimWeb/';
const ASSESSOR = 'https://www.clarkcountynv.gov/government/assessor/';

const T = TEAM;

const NEVADA: Playbook[] = [
  {
    key: 'tax',
    title: 'Tax sales',
    short: 'Tax sales',
    oneLine: 'Homes and land with three or more years of unpaid property taxes, sold by the Treasurer at an in-person auction. If the county found a property abandoned, two years is enough.',
    youGet: 'The property, by quitclaim deed from the Treasurer, with no warranty of title.',
    plain: 'The house itself, but the county makes no promise that the title is clear.',
    forSale: true,
    glance: [
      { label: 'Run by', value: 'Clark County Treasurer, as trustee for the state and county' },
      { label: 'How often', value: 'Usually in May. Some years add a December or February auction. Some years have none: the Treasurer holds one only if needed. Dates are posted on the Treasurer’s website. There is no mailing list.' },
      { label: 'Where', value: 'In person, Commission Chambers, 500 S. Grand Central Pkwy (confirm in the notice)' },
      { label: 'Register', value: 'Opens about 3–4 weeks before and closes about a week before. Capped at 280 bidders. No registration on the day.' },
      { label: 'Deposit', value: '$5,000 per bidder in certified funds; credited if you win' },
      { label: 'Payment', value: "Pay the full price the same day by 1:00 p.m. (4:30 p.m. for parcels re-auctioned at 2:00 p.m.). Use cash, cashier's check or money order. The May 2025 notice didn't list wire for the final payment. Confirm accepted forms in the current notice. No financing." },
      { label: 'Deed', value: 'A quitclaim deed to the name on your Trustee Auction Registration Form. It is recorded within 30 days and mailed to you. To change the name later, you record your own new deed' },
      { label: 'After the sale', value: 'There’s no redemption: the owner can’t buy it back. But for 2 years after the Treasurer’s deed is delivered, the former owner, or anyone else claiming the land, can sue to recover it. You may not be able to get title insurance during that time (NRS 361.600)' },
    ],
    steps: [
      { title: 'Get the list and the notice', detail: 'The Treasurer publishes the parcel list and the auction information notice before each sale. Owners, and lenders or other lienholders of record, can pay until close of business 3 business days before the sale. Parcels that get paid are crossed off the list (called lined out) (NRS 361.585).' },
      { title: 'Narrow the list', detail: 'Match every parcel number on the Assessor map. Throw out strips, common areas, landlocked lots and anything you can’t use or sell.' },
      { title: 'Research each finalist', detail: 'Search the Recorder for liens (IRS, city, sewer, special assessments). Check zoning with the city or county. Look for occupants from the street. Don’t go onto the property: it’s privately owned until the new deed is recorded, and the county warns you may be trespassing. The county makes no promises about the condition or the liens.' },
      { title: 'Set a maximum bid for each', detail: 'Count every cost: quiet title, liens that may stay, repairs, holding costs and possession. For an uncontested quiet title, attorneys often quote about $1,500–$5,000+. Get a quote. Use the max bid calculator.' },
      { title: 'Register and pay the deposit', detail: 'Register online or at the Treasurer’s office by the deadline, with the $5,000 certified-funds deposit. The deed will be issued to exactly the name on your form, so decide that first.' },
      { title: 'Auction day', detail: 'Only the registered bidder can bid, by showing their bidder card. Parcels are offered one at a time in the published order. The auctioneer reads the parcel number and minimum bid. Arrive early. The notice has the day’s rules.' },
      { title: 'Pay by 1:00 p.m.', detail: 'Pay in full for every parcel you win. If you don’t, you lose the deposit and are banned from future sales. Unsold or unpaid parcels may be re-auctioned at 2:00 p.m.' },
      { title: 'After you win', detail: 'Insure the property and secure it. If anyone lives there, plan possession with an attorney (the county won’t help). Ask a title company when they can insure. Many need a quiet title action first.' },
    ],
    survives: {
      wipedOut: ['The delinquent property taxes and costs paid by your bid', 'Most private liens and mortgages (confirm with a title professional)'],
      mayStay: ['Federal tax liens. A lien survives if the IRS wasn’t notified at least 25 days before the sale. No notice is needed for a lien filed 30 days or less before the sale. Even when notified, the IRS can buy the property back within 120 days (26 U.S.C. 7425)', 'Some government and special assessment liens. If a city, town or county sold an SID lien certificate on the parcel, it can notify the Treasurer by 3 business days before the sale. Then you must pay that certificate within 20 days, or the tax sale is void (NRS 361.595)', 'Easements, covenants and HOA restrictions', 'A 2-year window, after the deed is delivered, for anyone claiming the land to sue to recover it (NRS 361.600)'],
    },
    mistakes: [
      { mistake: 'Bidding on a parcel you never looked up', prevent: 'Match the parcel number on the Assessor map, not just the address.' },
      { mistake: 'Planning to resell right away', prevent: 'Budget for the wait. Before a title company will insure, you’ll need to get past the 2-year window after the deed, or win a quiet title action (NRS 361.600).' },
      { mistake: 'Registering in the wrong name', prevent: 'The deed goes to exactly the bidder name on your registration form. The Treasurer’s form requires an individual’s name, not a company, LLC or trust. To hold it in an entity, record your own deed to it after you receive the Treasurer’s deed. Ask an attorney first.' },
      { mistake: 'Hoping to buy an unsold parcel later', prevent: 'The county doesn’t sell parcels over the counter. Unsold parcels may come back at a future auction.' },
      { mistake: 'Winning several parcels without the cash for all of them', prevent: 'Bring certified funds for everything you might win. One unpaid parcel costs the deposit and a ban.' },
    ],
    example: {
      title: 'The $3,400 lot that wasn’t a lot',
      story: 'A vacant parcel had a minimum bid of $3,400. Its assessed land value was ten times higher. On the Assessor map, it was a 12-foot strip between two houses with no street access.',
      lesson: 'Cheap parcels are often unusable. Walking away cost nothing. Buying it would have meant paying taxes on land no one can use.',
    },
    team: [T.title, T.attorney, T.lender, T.insurance, T.eviction, T.contractor, T.agent, T.cpa],
    sources: [
      { label: 'Clark County Treasurer: tax auction FAQs', url: TREASURER_FAQ },
      { label: 'Treasurer: auction notice and registration form (May 2025, the latest posted)', url: 'https://treasurer.co.clark.nv.us/pdf/May%202025%20Trustee%20Auction%20Info.pdf' },
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
    title: 'Lien certificates',
    short: 'Lien certificates',
    oneLine: 'The Clark County Treasurer sells the lien for unpaid special improvement district (SID) assessments. You buy a debt that earns interest, not the property.',
    youGet: 'A certificate of sale: the right to be repaid plus 1% a month. You can ask for a deed only if the owner never redeems, and the certificate expires if you wait too long.',
    plain: 'Not the house. You get the right to be repaid what you paid plus 1% a month. You can ask for the deed only if the owner never pays. That right runs out if you wait too long.',
    forSale: true,
    glance: [
      { label: 'Run by', value: 'Clark County Treasurer (special improvement districts)' },
      { label: 'Law', value: 'NRS 271' },
      { label: 'How winners are chosen', value: 'A random drawing among registered buyers, with first and second alternates. Not highest bid.' },
      { label: 'When', value: 'Usually 4 times a year (late January, March, July and September). Generally at 11:00 a.m. at the Government Center' },
      { label: 'Register', value: 'In person on sale day, about an hour before. Bring government photo ID showing your current mailing address. The certificate is issued in that name. One registration per person. No deposit or registration fee at present. You must be 18 or older. Late arrivals can’t take part.' },
      { label: 'Payment', value: "By 10:00 a.m. the next business day, in cash, cashier's check or money order" },
      { label: 'Interest', value: '1% a month simple interest on the certificate price, paid when the owner redeems (NRS 271.610; NRS 271.595 caps the redemption interest at 1%). Confirm the rate in the sale notice' },
      { label: 'Redemption', value: '120 days, or 2 years if there was a home or significant improvement on the land at the time of the sale, as the county or city decides (NRS 271.595)' },
      { label: 'Deed', value: 'After the redemption period, serve the owner notice in person, and post it on the property if the public can reach it. If they don’t live in Nevada, or can’t be found here after a diligent search of Assessor, Recorder and Secretary of State records, publish the notice and mail it to every address the search turns up. The owner then has 60 more days to redeem. Before a deed is issued, the District Attorney reviews the notice, and you must pay any delinquent taxes and assessments. If you never ask for a deed, the certificate expires 3 years after redemption ends (NRS 271.595).' },
      { label: 'Taxes', value: 'You file a W-9; interest over $10 is reported on a 1099-INT' },
    ],
    steps: [
      { title: 'Check the sale list', detail: 'Within 60 days after an installment goes delinquent, the County Commission tells the Treasurer to give notice of sale. Sales are usually held 4 times a year (late January, March, July and September). The list is posted about 3 weeks before. The cities hold their own SID sales too. Assessment Management Group posts the notices and lists for the county and the cities. Each city sets its own sale procedures, so read that sale’s notice.' },
      { title: 'Research the parcels', detail: 'The Assessor has parcel details but not liens, so search the Recorder too. Know what the land is in case you end up owning it.' },
      { title: 'Register in person', detail: 'Bring government photo ID with your current mailing address and fill out the buyer registration form. You must be present. Friends and family can’t register for you, and late arrivals can’t take part.' },
      { title: 'Drawing and payment', detail: "A random number generator picks the winner and two alternates for each parcel. Pay by 10:00 a.m. the next business day in cash, cashier's check or money order. Otherwise, the certificate goes to the first alternate (then the second). If nobody pays for a certificate, it’s sold first come, first served at the Treasurer’s window the next business day from 8:00 a.m. After noon, what’s left goes to the County. The County may sell them over the counter later for the price plus 1% a month." },
      { title: 'Wait for redemption', detail: 'Most owners pay. You get back the price plus 1% a month, usually 30–60 days after they redeem. If later taxes go unpaid, you may pay them and add them to the certificate. To do that, give the Treasurer written notice and your receipts.' },
      { title: 'If there is no redemption', detail: 'After the period ends, serve the owner notice that you intend to request a deed. Serve it in person. Certified mail isn’t enough; the Treasurer suggests a process server. Also post it on the property if the public can reach it. If the owner can’t be found, give notice by publication. If they still don’t redeem within 60 days, pay any delinquent taxes and assessments and request the deed. Don’t wait: the certificate expires 3 years after the redemption period ends.' },
    ],
    survives: {
      wipedOut: ['While you hold the certificate: nothing. You hold a lien that ranks with general taxes', 'If you take a deed: most other liens (NRS 271.600). But taxes, assessments, some government liens and FDIC liens may remain. The county warns not all liens are satisfied'],
      mayStay: ['Mortgages and other liens, until a deed is issued', 'Property taxes and other assessments', 'Liens held by the FDIC for failed banks. The FDIC says a certificate does not extinguish them'],
    },
    mistakes: [
      { mistake: 'Expecting to get the property', prevent: 'Treat it as an investment in a debt. Most certificates are redeemed.' },
      { mistake: 'Treating the land as yours', prevent: 'A certificate is only a lien. You have no right to enter, mow, cut trees or use the property.' },
      { mistake: 'Ignoring what’s on the land', prevent: 'If there is a building, the redemption period is 2 years, not 120 days.' },
      { mistake: 'Forgetting later taxes', prevent: 'Pay later delinquent taxes and notify the Treasurer in writing so they’re added to your certificate.' },
    ],
    example: {
      title: 'Reading the interest correctly',
      story: 'A $2,000 certificate redeemed after 8 months pays $160 in interest (1% a month, simple). The money arrives about 30–60 days after the owner pays.',
      lesson: 'It’s a slow, modest return. It depends on patience and paperwork. It is not a shortcut to owning homes.',
    },
    team: [T.title, T.attorney, T.cpa],
    sources: [
      { label: 'Clark County Treasurer FAQs (special assessment certificates)', url: TREASURER_FAQ },
      { label: 'Notice of sale, published by Assessment Management Group for Clark County and the cities', url: 'https://www.amgnv.com/notice-of-sale.asp' },
      { label: 'NRS 271 (local improvements, certificates of sale)', url: NRS('271') },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'foreclosure',
    title: 'Foreclosure auctions',
    short: 'Foreclosure auctions',
    oneLine: 'Most Nevada foreclosures are non-judicial. After the owner defaults, a trustee sells the property at auction.',
    youGet: 'The owner’s interest by trustee’s deed, subject to anything senior to the loan being foreclosed.',
    plain: 'The house as the owner held it. Debts recorded ahead of the loan being foreclosed stay with it.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 107 (deeds of trust)' },
      { label: 'Timeline', value: 'Notice of default, then at least 3 months, then a notice of sale, then the auction. These are legal minimums; many foreclosures take longer or never reach a sale' },
      { label: 'Notice of sale', value: 'Posted for 20 days and published once a week for 3 weeks' },
      { label: 'Mediation', value: 'Owner-occupants can petition the court for foreclosure mediation within 30 days after the notice of default is served. A sale of an owner-occupied home needs a recorded mediation certificate' },
      { label: 'Payment', value: "Usually cashier's checks for the full bid at the sale. Each trustee sets its terms" },
      { label: 'Redemption', value: 'None for the owner. If a federal tax lien was on the property, the U.S. can redeem within 120 days (26 U.S.C. § 7425)' },
      { label: 'Challenges', value: 'A lawsuit filed within 30 days after the trustee’s deed is recorded can void the sale. Someone who didn’t get proper notice has 90 days from the sale date (NRS 107.080)' },
      { label: 'Postponements', value: 'Common. Confirm with the trustee the day before' },
      { label: 'Where listed', value: 'Recorded notices of sale (County Recorder), the trustee named in the notice, and legal newspapers' },
    ],
    steps: [
      { title: 'Follow the notices', detail: 'Track the notice of default and notice of sale. The pre-foreclosure tracker shows where each one is. The notice of sale gives the date, place and trustee.' },
      { title: 'Identify which loan is foreclosing', detail: 'If it’s a second mortgage or another junior lien, the first mortgage stays with the house, and it becomes your problem. Get a title search.' },
      { title: 'Check for senior debts', detail: 'Property taxes, HOA dues (including up to 9 months of super-priority), IRS liens and city liens may survive.' },
      { title: 'Look at the property', detail: 'From the outside only. Assume it may be occupied and need major repairs. There is no seller disclosure form at a trustee sale. But the trustee and the lender must tell you in writing about defects they know of, at the latest when the property is transferred to you or when you ask. So ask (NRS 113.130).' },
      { title: 'Set your maximum bid', detail: 'Include surviving debts, repairs, eviction and holding costs. Use the max bid calculator.' },
      { title: 'Confirm the sale is on', detail: 'Call the trustee the day before. Sales are often postponed or cancelled when owners reinstate, sell or file bankruptcy.' },
      { title: 'Bid with certified funds', detail: "Bring cashier's checks in amounts that let you pay exactly your bid. Follow the trustee's terms." },
      { title: 'After you win', detail: 'Get the trustee’s deed recorded and insure the property. If anyone lives there, serve the right notices.' },
    ],
    survives: {
      wipedOut: ['The loan being foreclosed', 'In most cases, liens recorded after it (junior liens)'],
      mayStay: ['Any loan recorded before the one being foreclosed', 'Property taxes', 'Up to 9 months of HOA dues (super-priority)', 'IRS liens recorded before the loan being foreclosed. Also junior IRS liens, if the IRS didn’t get 25 days’ notice (unless the lien was filed 30 days or less before the sale). Even when wiped out, the U.S. can buy the property back within 120 days', 'Some city liens'],
    },
    mistakes: [
      { mistake: 'Buying at a second mortgage’s sale', prevent: 'Confirm which lien is foreclosing. The first deed of trust survives a junior lien’s sale.' },
      { mistake: 'Driving to a sale that was postponed', prevent: 'Call the trustee the day before and check the status here.' },
      { mistake: 'Forgetting occupants', prevent: 'Bona fide tenants get at least 90 days’ written notice under federal law (Protecting Tenants at Foreclosure Act). A lease can run to its end unless the buyer will live there. For homes with up to 4 units, Nevada also requires a written notice of the change of ownership. Tenants keep their lease rights for a notice period, generally at least 60 days (NRS 40.255). You take on the landlord’s duties, including their existing security deposits (NRS 118A.244). Former owners get a 3-day notice (NRS 40.255).' },
    ],
    example: {
      title: 'The $40,000 opening bid',
      story: 'A $420,000 house had a $40,000 opening bid. A title search showed the sale was for a second mortgage. The $310,000 first mortgage would stay with the house.',
      lesson: 'The real price was about $350,000 plus repairs. That was more than the house was worth after fixing it. The buyer walked away and saved a six-figure mistake.',
    },
    team: [T.title, T.attorney, T.lender, T.insurance, T.eviction, T.contractor, T.agent, T.cpa],
    sources: [
      { label: 'NRS 107 (deeds of trust, trustee sales)', url: NRS('107') },
      { label: 'NRS 40 (possession after foreclosure, NRS 40.255)', url: NRS('040') },
      { label: 'NRS 113 (NRS 113.130: trustee’s notice of known defects)', url: NRS('113') },
      { label: 'Protecting Tenants at Foreclosure Act (made permanent in 2018; see the note to 12 U.S.C. 5220)', url: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title12-section5220&num=0&edition=prelim' },
      { label: 'Foreclosure mediation (Eighth Judicial District Court)', url: 'https://www.clarkcountycourts.us/departments/adr/foreclosure-mediation/' },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'hoa',
    title: 'HOA foreclosures',
    short: 'HOA foreclosures',
    oneLine: 'A homeowners association (HOA) sells a home to collect unpaid dues (NRS 116).',
    youGet: 'The owner’s title, subject to a 60-day redemption period, and possibly subject to the first mortgage.',
    plain: 'The house, but the owner can buy it back within 60 days, and the first mortgage may stay with it.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 116 (common-interest communities)' },
      { label: 'Super-priority', value: 'Up to 9 months of dues (plus certain charges) rank ahead of the first mortgage' },
      { label: 'Lender payoff', value: 'The first deed of trust (the main home loan) survives if the lender paid the priority amount at least 5 days before the sale. It also survives if the lender offered to pay it and the HOA refused (Bank of America v. SFR, 2018)' },
      { label: 'Fannie Mae / Freddie Mac loans', value: 'If one of them owned the loan, the mortgage survives an HOA sale unless the FHFA consented (federal Foreclosure Bar)' },
      { label: 'Redemption', value: '60 days after the sale. The redeemer pays your price plus 1% a month, plus taxes, assessments and upkeep you paid' },
      { label: 'What you get first', value: 'A certificate of sale; a deed without warranty after the redemption period (NRS 116.31166). If a federal tax lien was on the home, the U.S. can buy it back for 120 days (26 U.S.C. 7425). Ask a title company before bidding whether it will insure without a quiet title lawsuit' },
      { label: 'Payment', value: 'Certified funds; confirm the terms with the HOA’s foreclosure agent' },
    ],
    steps: [
      { title: 'Find the sale notice', detail: 'Notices for HOA sales are given and recorded the same way as for trustee sales. Confirm the date with the HOA’s foreclosure agent.' },
      { title: 'Check whether the lender paid', detail: 'Search the Recorder for a recorded payment of the super-priority amount. It must be recorded at least 2 days before the sale. Also listen for the auctioneer’s announcement. If the lender paid at least 5 days before the sale, you take the home with the first mortgage. Also check whether Fannie Mae or Freddie Mac owned the loan. If so, it usually survives.' },
      { title: 'Get a professional opinion', detail: 'After the SFR Investments decision (2014), Nevada HOA sales ended up in court again and again. Have a title professional or attorney review the sale before you bid.' },
      { title: 'Set your maximum bid', detail: 'If the first mortgage may survive, add it to your costs. Use the max bid calculator.' },
      { title: 'Bid and pay', detail: 'Bring certified funds, following the foreclosure agent’s terms.' },
      { title: 'Wait out the 60 days', detail: 'The former owner can redeem during this time. So can a lender whose loan ranked below the HOA lien. They pay your price plus 1% a month. They also repay taxes and assessments you paid, and reasonable spending needed to maintain and repair the unit to the HOA’s standards (NRS 116.31166). Upgrades and renovations aren’t repaid, so save those until the period ends.' },
    ],
    survives: {
      wipedOut: ['The HOA lien being foreclosed', 'The first mortgage, only if three things are true. The lender did not pay the priority amount. The loan wasn’t owned by Fannie Mae or Freddie Mac. And the sale was proper'],
      mayStay: ['The first mortgage, if the lender paid the priority amount at least 5 days before the sale, or validly offered it and was refused. Also if Fannie Mae or Freddie Mac owned the loan (while they are under federal conservatorship)', 'Property taxes', 'Federal tax liens. Even when wiped out, the U.S. can buy the home back within 120 days, longer than the owner’s 60 days (26 U.S.C. 7425)', 'The 60-day redemption right'],
    },
    mistakes: [
      { mistake: 'Assuming every HOA sale wipes out the mortgage', prevent: 'Check the Recorder for the lender’s payment before bidding. No recorded payment doesn’t prove the mortgage is gone. An offer to pay that the HOA refused, or Fannie Mae or Freddie Mac owning the loan, can keep it. Have an attorney check.' },
      { mistake: 'Renovating right away', prevent: 'Only spend what’s needed to maintain and repair the unit to the HOA’s standards. A redeemer repays that. Save upgrades until the 60-day redemption period ends.' },
    ],
    example: {
      title: 'The $9,000 condo',
      story: 'A condo worth about $260,000 went to an HOA sale with a $9,000 opening bid. The Recorder showed the lender had paid the HOA’s priority amount ten days before the sale.',
      lesson: 'The $190,000 first mortgage would survive. That made the real cost about $199,000, plus unpaid dues and repairs. Not a bargain. Walk away.',
    },
    team: [T.attorney, T.title, T.lender, T.insurance, T.eviction, T.contractor, T.agent],
    sources: [
      { label: 'NRS 116 (NRS 116.3116 priority, 116.31166 redemption)', url: NRS('116') },
      { label: '26 U.S.C. 7425: federal tax liens and the 120-day redemption (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/7425' },
      { label: 'Clark County Recorder: search records', url: RECORDER },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'sheriff',
    title: 'Sheriff sales',
    short: 'Sheriff sales',
    oneLine: 'Property sold to pay a court judgment, including judicial foreclosures.',
    youGet: 'The debtor’s interest, subject to a 1-year redemption right, and to anything senior to the judgment.',
    plain: 'The house as the owner held it. The owner can buy it back for 1 year. Debts recorded ahead of the judgment stay with it.',
    forSale: true,
    glance: [
      { label: 'Law', value: 'NRS 21 (execution sales)' },
      { label: 'Where', value: 'Clark County Sheriff Civil Section sales (see the sheriff’s sales page)' },
      { label: 'Redemption', value: '1 year after the sale. The debtor, or a creditor with a later judgment or mortgage lien, can redeem. They pay your price plus 1% a month, plus taxes, assessments and payments on earlier liens you made, with interest (NRS 21.200–21.210). Those creditors can redeem from each other within 60 days of each redemption, so the deed can come later (NRS 21.220)' },
      { label: 'What you get first', value: 'A certificate of sale; a deed after the redemption period' },
      { label: 'Payment', value: 'Certified funds, as the sale notice says' },
    ],
    steps: [
      { title: 'Find the sale', detail: 'Check the Sheriff Civil Section’s sales listings and the notice for the case.' },
      { title: 'Research the title', detail: 'You get only what the debtor owned. Mortgages and liens ranked ahead of the judgment stay.' },
      { title: 'Check for a homestead', detail: 'Does the debtor live there and have a recorded declaration of homestead? Then up to $605,000 of equity is protected from a judgment creditor’s execution (NRS 21.090, NRS 115). It doesn’t protect against a mortgage or deed of trust the owner signed, taxes or mechanic’s liens (NRS 115.010). If the home is sold because equity is over the limit, no bid under $605,000 can be accepted (NRS 115.050). Check the Recorder, and have an attorney review the sale.' },
      { title: 'Plan for a year of waiting', detail: 'The debtor, or a creditor with a later lien, can redeem for a year. It can take longer if creditors redeem from each other. Your money is tied up. If someone redeems, taxes and payments on earlier liens are repaid with interest. Repairs aren’t, so don’t improve the property until then.' },
      { title: 'Set your maximum bid', detail: 'Include a year or more of holding costs. Use the max bid calculator.' },
    ],
    survives: {
      wipedOut: ['The judgment lien being enforced', 'Junior liens, in most cases'],
      mayStay: ['Mortgages and liens senior to the judgment', 'Property taxes', 'The 1-year redemption right'],
    },
    mistakes: [{ mistake: 'Treating it like a quick flip', prevent: 'Plan to hold for at least a year before improving or reselling.' }],
    example: {
      title: 'A year of waiting',
      story: 'A buyer paid $120,000 at a sheriff’s sale and started repairs. Eleven months later the debtor redeemed. The debtor repaid the price plus 1% a month, but not the repair spending.',
      lesson: 'The interest covered the wait, not the repairs. Any rent collected during the year is also subtracted from the payoff (NRS 21.250). Don’t improve a property until the redemption period ends.',
    },
    team: [T.attorney, T.title, T.insurance, T.agent],
    sources: [
      { label: 'NRS 21 (execution sales; NRS 21.210 redemption)', url: NRS('021') },
      { label: 'NRS 115 (homestead exemption)', url: NRS('115') },
      { label: 'Clark County Sheriff: sheriff’s sales', url: 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/sheriff_s_sales/' },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'irs',
    title: 'IRS sales',
    short: 'IRS sales',
    oneLine: 'The IRS seizes and sells property to collect unpaid federal taxes, by public auction or sealed bid.',
    youGet: 'The taxpayer’s interest by quitclaim-type deed, after a 180-day redemption period (seizure sales; court-ordered sales differ).',
    plain: 'The owner’s interest in the house, once the 180 days the owner has to buy it back are over. Court-ordered IRS sales work differently.',
    forSale: true,
    glance: [
      { label: 'Where listed', value: 'irsauctions.gov' },
      { label: 'Redemption', value: '180 days. The owner, or anyone with an interest or lien, can redeem. They pay your price plus 20% a year, compounded daily' },
      { label: 'Deposit', value: 'Set in each sale notice. Sealed bids usually need a deposit with the bid' },
      { label: 'What you get first', value: 'A certificate of sale; a deed after 180 days' },
      { label: 'Court-ordered sales', value: 'No 180-day redemption. The court must confirm the sale, and your deed comes under its order. Read the order of sale' },
    ],
    steps: [
      { title: 'Watch irsauctions.gov', detail: 'Sales are few and scattered. Read each notice of sale for the minimum bid, deposit and payment deadline. It also says whether bids are taken at public auction or by sealed bid.' },
      { title: 'Ask for the list of known liens', detail: 'The IRS will give bidders Form 2434-B, which lists the liens and interests it found. It doesn’t promise the list is complete, so check it yourself (IRM 5.10.5.7).' },
      { title: 'Research the title', detail: 'You get only the taxpayer’s interest, as is, where is, with no warranty (IRM 5.10.5.7). Mortgages and other liens ahead of the federal tax lien stay. Order a title report before you bid.' },
      { title: 'Look from the street only', detail: 'You usually can’t go inside. Assume repairs are needed. Don’t contact or approach the owner or occupants. Send every question to the IRS contact on the notice.' },
      { title: 'Bid and pay on time', detail: 'Pay in the forms the notice allows. If you agreed to pay the rest later (deferred payment) and don’t pay it, the IRS can sue you for it with 6% interest, or cancel the sale and keep what you paid (26 U.S.C. 6335(e)(3)).' },
      { title: 'Record the certificate of sale', detail: 'You get a certificate of sale when you pay in full (26 U.S.C. 6338(a)). The IRS notes that recording it can stop the taxpayer from selling the property to someone else (IRM 5.10.5.17.5). Ask a title company or attorney about recording it with the county recorder.' },
      { title: 'Plan for 180 days', detail: 'The property can be bought back (redeemed) for 180 days. Whoever redeems pays you your price plus 20% a year interest (26 U.S.C. 6337). If it’s vacant you may enter only as needed to prevent damage. If it’s occupied, the IRS and its lawyers decide whether a court order is needed (IRM 5.10.5.19). Don’t renovate yet.' },
      { title: 'Get the deed, then possession', detail: 'If no one redeems, turn in the certificate of sale and the IRS gives you a deed (26 U.S.C. 6338(b)). Record it with the county recorder. If anyone still lives there, use an eviction attorney and the court process. Never remove people or belongings yourself.' },
    ],
    survives: { wipedOut: ['The federal tax lien being enforced', 'Liens and interests junior to the federal tax lien'], mayStay: ['Mortgages and liens senior to the IRS', 'Property taxes', 'The 180-day redemption right'] },
    mistakes: [{ mistake: 'Assuming a clean title', prevent: 'Get a title search. You inherit senior liens.' }],
    example: {
      title: 'Counting the waiting period',
      story: 'A buyer planned a 4-month flip on an IRS sale property. Then the buyer learned the owner could redeem for 180 days. Any money spent on repairs was at risk.',
      lesson: 'Build the redemption period into holding costs from the start.',
    },
    team: [T.title, T.attorney, T.insurance, T.agent],
    sources: [{ label: 'IRS auctions', url: 'https://www.irsauctions.gov/' }],
    lastReviewed: REVIEWED,
  },
  {
    key: 'reo',
    title: 'Bank-owned (REO)',
    short: 'Bank-owned (REO)',
    oneLine: 'Property a lender took back at a foreclosure auction. The lender sells it through its broker or an auction it chooses.',
    youGet: 'The property, bought with a normal purchase contract (usually with the lender’s addendum). You get a deed with limited promises from the lender, and title insurance.',
    forSale: true,
    glance: [
      { label: 'How it’s sold', value: 'Listed by the lender’s broker, or at an auction the lender chooses' },
      { label: 'Financing', value: 'Allowed; get pre-approved first' },
      { label: 'Inspection', value: 'Usually allowed within your contingency period. Bank-owned doesn’t mean good condition, empty or clear title. Inspect, ask whether it will be delivered vacant, and read the title report' },
      { label: 'Disclosures', value: 'Nevada’s exemption from the seller disclosure form covers the foreclosure sale itself, not a later resale by the bank (NRS 113.130). Ask for the form, but expect the bank to know little about the home. Your inspection is your main protection' },
      { label: 'Title', value: 'Normal title insurance and escrow' },
      { label: 'HUD homes', value: 'Bid through a HUD-registered broker. For homes listed since May 30, 2025, owner-occupants, government entities and HUD-approved nonprofits get the first 15 days (5 days for homes marked “uninsured”) (HUD Mortgagee Letter 2025-13)' },
      { label: 'Fannie Mae & Freddie Mac', value: 'Owner-occupants get a “First Look” period before investors: 30 days for Freddie Mac; 20 days for Fannie Mae, 30 in Nevada (confirm on the listing)' },
      { label: 'Lender-run auctions', value: 'Check the buyer’s premium and whether the lender must approve the winning bid. Make sure the lender is the owner of record' },
    ],
    steps: [
      { title: 'Get pre-approved', detail: 'Get a pre-approval letter from a lender, or for a cash offer, a recent bank statement as proof of funds. Bank sellers usually want one with every offer.' },
      { title: 'Choose a buyer’s agent', detail: 'REO and HUD sales go through listing brokers. HUD requires a HUD-registered broker. Your agent will usually ask you to sign a written buyer agreement first: read how they’re paid, by whom, and how to end it.' },
      { title: 'Offer and read the addendum', detail: 'The bank’s addendum usually overrides parts of the standard contract. Before you sign, look for: “as-is” terms, who pays which closing costs, the deadlines for your deposit and closing, and any per-day fee if you close late.' },
      { title: 'Inspect within your contingency period', detail: 'Homes are usually sold as-is, so the inspection is how you learn the condition. A bank never lived there and may know little. Ask your agent to have the utilities turned on for the inspection, and add specialists the inspector suggests.' },
      { title: 'Appraise and check the title', detail: 'If you’re borrowing, the lender orders an appraisal. Read the title commitment: its requirements must be cleared before closing, and its exceptions aren’t covered. Ask the title officer how each requirement will be cleared.' },
      { title: 'Ask whether it will be vacant', detail: 'Ask the listing agent whether the home will be delivered vacant at closing. If someone may still live there, talk with an attorney about the lawful process before you commit.' },
      { title: 'Send money safely', detail: 'Wire your deposit and closing funds only after confirming the instructions by phone with escrow, using a number you looked up yourself, not one from an email.' },
      { title: 'Close through escrow', detail: 'Check the closing statement against your contract before you sign, including your deposit credit. Get title insurance and a copy of the recorded deed, like a normal purchase.' },
    ],
    survives: { wipedOut: ['Most liens are cleared by the lender before or at closing (confirm on the title report)'], mayStay: ['Anything listed as an exception on the title report'] },
    mistakes: [{ mistake: 'Skipping the addendum', prevent: 'Read every page. It can shift costs and deadlines to you.' }],
    example: {
      title: 'The addendum’s fine print',
      story: 'A buyer’s offer on a bank-owned home was accepted. But the addendum made the buyer pay a per-day penalty if closing ran late.',
      lesson: 'Line up your loan and inspection early, and read the addendum before signing.',
    },
    team: [T.agent, T.mortgage, T.title, T.offerInspector, T.insurance],
    sources: [
      { label: 'HUD Home Store', url: 'https://www.hudhomestore.gov/' },
      { label: 'Fannie Mae HomePath', url: 'https://homepath.fanniemae.com/property-finder' },
      { label: 'Freddie Mac HomeSteps', url: 'https://www.homesteps.com/' },
      { label: 'VA-acquired homes', url: 'https://www.benefits.va.gov/homeloans/realtors_property_mgmt.asp' },
      { label: 'HUD Mortgagee Letter 2025-13: 15-day exclusive listing period', url: 'https://hud.gov/sites/dfiles/OCHCO/documents/2025-13hsgml.pdf' },
      { label: 'NRS 113 (seller disclosures; NRS 113.130 exemptions)', url: NRS('113') },
      { label: 'Every direct bank and government source for Clark County', url: '#/bank-owned' },
    ],
    lastReviewed: REVIEWED,
  },
  {
    key: 'commercial',
    title: 'Commercial property',
    short: 'Commercial property',
    oneLine: 'Stores, offices, industrial buildings, apartments with 5+ units and commercial land. They are sold at tax, trustee, court and bank sales.',
    youGet: 'The same deed as a home bought the same way, but without the protections home buyers get, and often with tenants, leases and environmental history.',
    forSale: true,
    glance: [
      { label: 'How it’s sold', value: 'The same channels as homes: Treasurer tax sales, trustee sales, court and sheriff sales, court-appointed receivers, and bank or government sellers' },
      { label: 'Value', value: 'Rental property: by income (net operating income ÷ cap rate). Land, and buildings a business will use itself: by recent sales of similar commercial property. Not by comparing it with homes' },
      { label: 'Environmental', value: 'A Phase I environmental site assessment (ASTM E1527-21) can protect you from federal cleanup liability. To get that protection, do it within one year before you take title, and update key parts within 180 days. You also need to meet ongoing duties after you buy' },
      { label: 'Tenants', value: 'A lease can be wiped out unless there’s a non-disturbance agreement. That applies to a lease that comes after the loan being foreclosed, or one the tenant agreed to put behind it (subordination). If the lease is wiped out, you can remove the tenant, but the tenant can also leave. The federal tenant protection law (PTFA) covers residential tenants, including in apartment buildings. It does not cover stores, offices or other commercial tenants' },
      { label: 'Financing', value: 'Auctions need cash. Afterwards: commercial, bridge or hard-money loans. SBA 504 and 7(a) loans are for a business that will use the building, not rental investment' },
      { label: 'Zoning', value: 'Confirm with the city or county planning department that the use is allowed. Check open code cases and permits too' },
      { label: 'No home-buyer programs', value: 'No owner-occupant first look. HUD Home Store, HomePath and HomeSteps sell homes with 1–4 units only. HUD sells some large apartment buildings through separate multifamily foreclosure sales' },
    ],
    steps: [
      { title: 'Pin down what you’re buying', detail: 'Use the Assessor record for land use, building size, year built and sales. Use the parcel map for access and boundaries.' },
      { title: 'Get the rent roll and leases, if you can', detail: 'A receiver or listing broker can usually provide them. At an auction you often can’t, so assume the building is empty until proven otherwise.' },
      { title: 'Value it the right way', detail: 'For a rental building, divide net operating income (rent after vacancy and operating costs) by the cap rate. Ask a local commercial broker or appraiser for current cap rates for this type of property. For land or an owner-user building: recent sales of similar commercial property.' },
      { title: 'Order a title search', detail: 'Commercial parcels often carry easements, reciprocal easement agreements, CC&Rs, mechanic’s liens and recorded leases. Know which survive the sale.' },
      { title: 'Screen for contamination', detail: 'Check EPA and state records for the address, and ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Order a Phase I assessment if time allows.' },
      { title: 'Check zoning, code and permits', detail: 'Make sure your planned use is allowed and there are no open code cases or expired permits.' },
      { title: 'Line up your money', detail: 'Certified funds for the sale, plus a commercial or bridge lender ready to refinance after.' },
      { title: 'Take over well', detail: 'Insure it the day you own it, and secure the building. Tell tenants in writing where to pay rent. Ask each tenant to sign an estoppel certificate confirming their lease (most leases require it).' },
    ],
    survives: {
      wipedOut: [
        'Liens recorded after the lien being foreclosed (trustee and court sales)',
        'Leases signed after that lien, or subordinated to it, unless the lender agreed to keep them (non-disturbance agreement). A tenant whose lease is wiped out can also leave. Confirm with an attorney',
      ],
      mayStay: [
        'Property taxes and special assessments (SIDs)',
        'Liens recorded before the lien being foreclosed',
        'Environmental cleanup liability: it follows the owner, not the lien',
        'Easements, reciprocal easement agreements and CC&Rs',
        'Leases that have priority or a non-disturbance agreement',
      ],
    },
    mistakes: [
      { mistake: 'Valuing it like a house', prevent: 'Use income and cap rate. A vacant building is worth its value once leased, minus the cost of getting there. That cost includes lost rent, leasing commissions and tenant improvements.' },
      { mistake: 'Skipping the environmental check', prevent: 'Past uses can mean cleanup costs bigger than the price. Check EPA and state records, and ask about past tenants.' },
      { mistake: 'Assuming the tenants will keep paying', prevent: 'Get estoppel certificates, and budget for vacancy, leasing commissions and tenant improvements.' },
      { mistake: 'Forgetting accessibility rules', prevent: 'In an existing building open to the public, barriers must be removed where that’s easy and affordable. Renovations must meet the ADA standards. As the landlord, you share responsibility with your tenants (28 CFR 36.201(b)). Spell out who does what in each lease. Budget for parking, entrance and restroom fixes.' },
    ],
    example: {
      title: 'The bargain strip center',
      story: 'A buyer won a small retail building at a tax sale for a fraction of its value. One former tenant was a dry cleaner. Soil tests found solvent contamination that cost more than the purchase price to clean up.',
      lesson: 'Check past uses and environmental records before bidding, and get a Phase I assessment when you can.',
    },
    team: [T.commercialBroker, T.title, T.attorney, T.environmental, T.commercialLender, T.insurance, T.contractor, T.propertyManager, T.cpa],
    sources: [
      { label: 'NRS Chapter 107: deeds of trust and trustee sales', url: NRS('107') },
      { label: 'NRS Chapter 361: property tax and tax sales', url: NRS('361') },
      { label: 'EPA: All Appropriate Inquiries (Phase I environmental site assessments)', url: 'https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries' },
      { label: 'EPA Envirofacts: environmental records by address', url: 'https://enviro.epa.gov/' },
      { label: 'Nevada Division of Environmental Protection: cleanup sites', url: 'https://ndep.nv.gov/environmental-cleanup' },
      { label: 'Clark County Comprehensive Planning (zoning)', url: 'https://www.clarkcountynv.gov/government/departments/comprehensive_planning_department/' },
      { label: 'SBA 504 loans', url: 'https://www.sba.gov/loans/504-loans/' },
      { label: 'ADA.gov: businesses open to the public', url: 'https://www.ada.gov/topics/title-iii/' },
      { label: 'Clark County Assessor', url: ASSESSOR },
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
      { label: 'Timeline', value: 'Lender approval often takes weeks to months' },
      { label: 'Financing', value: 'Allowed' },
      { label: 'Inspection', value: 'Usually allowed' },
      { label: 'Risk', value: 'The lender can say no or counter, and the foreclosure can happen first. One lender’s approval doesn’t clear other liens: every lienholder has to agree, and the title report must show it' },
      { label: 'Investors and homes in foreclosure', value: 'If a notice of default is recorded on a home with 1–4 units, Nevada’s foreclosure-purchaser law covers investors who buy from the owner. A deal that misleads the owner is a crime, and the owner can undo it for 2 years (NRS 645F.430, 645F.440). Have an attorney review the contract, and make offers only through the listing agent.' },
    ],
    steps: [
      { title: 'Get pre-approved', detail: 'The seller’s lender wants proof you can close: a pre-approval letter, or proof of funds for a cash offer.' },
      { title: 'Use an agent with short-sale experience', detail: 'They know how each lender works and how to keep the file moving. Have your agent ask the listing agent: has the seller’s package gone to every lender with a lien, how many liens are there, and how long has the file been open?' },
      { title: 'Offer subject to lender approval', detail: 'The seller accepts first, usually with a short-sale addendum, and then the listing agent sends the package to the lender, or to every lender if there’s more than one loan. Nothing is final until each lender approves in writing.' },
      { title: 'Wait, and keep your options open', detail: 'Approval can take weeks or months. Ask whether a foreclosure sale date is scheduled and whether it’s postponed for the short sale. You can usually keep looking at other homes while you wait.' },
      { title: 'Read the approval letter', detail: 'When a lender approves, read its letter closely: the price it accepts, the closing deadline, and which costs it will and won’t pay. If the terms change your numbers, talk with your agent before you go on.' },
      { title: 'Inspect', detail: 'Use your inspection period. Many short sales are sold as-is, and the seller may not be able to pay for repairs.' },
      { title: 'Close through escrow', detail: 'Close by the approval letter’s deadline. Every payment goes through escrow and shows on the closing statement. Never pay side fees outside escrow.' },
    ],
    survives: { wipedOut: ['Liens released by the lenders who approve the sale'], mayStay: ['Any lien whose holder doesn’t agree. The sale can’t close until they do'] },
    mistakes: [{ mistake: 'Paying a “negotiator” outside escrow', prevent: 'All payments go through escrow and are disclosed to the lender.' }],
    example: {
      title: 'Two lenders, one sale',
      story: 'The first lender approved after 10 weeks. But the second-mortgage holder wanted more money to release its lien. That added another month.',
      lesson: 'Ask up front how many liens there are, and expect each to negotiate.',
    },
    team: [T.agent, T.mortgage, T.title, T.offerInspector],
    sources: [
      { label: 'Our short-sale guide', url: '#/short-sales' },
      { label: 'NRS 645F (foreclosure purchasers, NRS 645F.300–645F.450)', url: NRS('645F') },
    ],
    lastReviewed: REVIEWED,
  },
];

/** Every guide: Nevada’s (Clark County), then California, Arizona and Utah. */
export const PLAYBOOKS: Playbook[] = [...NEVADA, ...STATE_GUIDES];

/** The guides for one state, or all of them. */
export const guidesFor = (st: StateCode | null) => (st ? PLAYBOOKS.filter((p) => stateOf(p) === st) : PLAYBOOKS);

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
