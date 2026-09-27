// The key facts the guides teach (numbers, deadlines, rules), each tied to the official sources that support it
// and the date it was last checked against them.
//
// `where` lists exact text on the site that states the fact. If someone edits that text, the test in
// src/content/content.test.ts fails until the fact is checked again against its sources and this entry is updated
// (new text, new `checked` date). That way no number changes without being re-verified.

export interface Fact {
  id: string;
  /** The fact in plain words. */
  claim: string;
  /** Ids from src/content/sources.ts. */
  sources: string[];
  /** When the fact was last checked against those sources (YYYY-MM-DD). */
  checked: string;
  /** Where the site states it: file (from the repo root) and a piece of text that must appear in it. */
  where: { file: string; text: string }[];
  /** Official sources disagree, or something to watch. */
  note?: string;
}

const PB = 'src/lib/playbooks.ts';
const CL = 'src/lib/buyerChecklists.ts';

export const FACTS: Fact[] = [
  // ---------------- Clark County tax sale (tax deed) ----------------
  {
    id: 'tax-deposit',
    claim: 'Registering for the Treasurer’s auction takes a $5,000 deposit in certified funds, credited if you win.',
    sources: ['treasurer-faq', 'treasurer-notice-2025-05'],
    checked: '2026-09-27',
    where: [{ file: PB, text: '$5,000 per bidder in certified funds' }],
  },
  {
    id: 'tax-deposit-refund',
    claim: 'Unsuccessful bidders’ deposits are refunded a few weeks after the sale.',
    sources: ['treasurer-faq', 'treasurer-notice-2025-05'],
    checked: '2026-09-27',
    where: [{ file: CL, text: '2–3 weeks in its FAQ and 4–5 weeks in past auction notices' }],
    note: 'Sources disagree: the FAQ says 2–3 weeks, the May 2025 notice says about 4–5 weeks. The site gives both.',
  },
  {
    id: 'tax-bidder-cap',
    claim: 'Registration is capped at 280 bidders.',
    sources: ['treasurer-notice-2025-05'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Capped at 280 bidders' }],
  },
  {
    id: 'tax-payment-deadline',
    claim: 'Winning bids are paid in full the same day by 1:00 p.m.; parcels re-auctioned at 2:00 p.m. are paid by 4:30 p.m.',
    sources: ['treasurer-faq', 'treasurer-notice-2025-05'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Full price the same day by 1:00 p.m. (4:30 p.m. for parcels re-auctioned at 2:00 p.m.)' }],
  },
  {
    id: 'tax-deed-name',
    claim: 'The deed goes to the bidder name on the registration form, which must be an individual, not a company, LLC or trust.',
    sources: ['treasurer-notice-2025-05'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'the Treasurer’s form requires an individual’s name, not a company, LLC or trust' },
      { file: CL, text: 'which must be an individual’s name, not a company, LLC or trust' },
      { file: 'src/practice/scenarios.ts', text: 'which must be an individual’s name' },
    ],
  },
  {
    id: 'tax-payoff-deadline',
    claim: 'Owners can pay the taxes until close of business 3 business days before the sale.',
    sources: ['nrs-361', 'treasurer-faq'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Owners can pay until close of business 3 business days before the sale' }],
  },
  {
    id: 'tax-sid-certificate',
    claim: 'If a city or county sold an SID lien certificate on the parcel and tells the Treasurer in time, the buyer must pay it within 20 days or the tax sale is void.',
    sources: ['nrs-361'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'within 20 days or the tax sale is void (NRS 361.595)' }],
  },
  {
    id: 'tax-challenge-window',
    claim: 'Former owners have 2 years after the Treasurer’s deed is delivered to sue to recover the land.',
    sources: ['nrs-361'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'the Treasurer’s deed is delivered (NRS 361.600)' }],
  },
  {
    id: 'irs-7425',
    claim: 'When a federal tax lien was on the property, the U.S. can redeem within 120 days of the sale.',
    sources: ['irs-auctions'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'within 120 days (26 U.S.C. 7425)' }],
  },

  // ---------------- SID lien certificates ----------------
  {
    id: 'sid-interest',
    claim: 'SID lien certificates earn 1% a month simple interest on the certificate price.',
    sources: ['nrs-271', 'treasurer-faq'],
    checked: '2026-09-27',
    where: [{ file: PB, text: '1% a month simple interest on the certificate pric' }],
  },
  {
    id: 'sid-redemption',
    claim: 'The owner has 120 days to redeem, or 2 years if there is a home or significant improvements.',
    sources: ['nrs-271'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'the redemption period is 2 years, not 120 days' }],
  },
  {
    id: 'sid-expiry',
    claim: 'A certificate expires 3 years after the redemption period ends if the holder never asks for a deed.',
    sources: ['nrs-271'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'the certificate expires 3 years after the redemption period ends' }],
  },

  // ---------------- Trustee sales (NRS 107) ----------------
  {
    id: 'trustee-timeline',
    claim: 'At least 3 months pass after the notice of default before a notice of sale.',
    sources: ['nrs-107'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Notice of default, then at least 3 months, then a notice of sale' }],
  },
  {
    id: 'trustee-notice',
    claim: 'The notice of sale is posted for 20 days and published once a week for 3 weeks.',
    sources: ['nrs-107'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Posted for 20 days and published once a week for 3 weeks' }],
  },
  {
    id: 'trustee-mediation',
    claim: 'Owner-occupants can petition for foreclosure mediation within 30 days after the notice of default is served.',
    sources: ['nrs-107', 'courts-mediation'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'foreclosure mediation within 30 days after the notice of default is served' }],
  },
  {
    id: 'trustee-challenge',
    claim: 'A lawsuit filed within 30 days after the trustee’s deed is recorded can void the sale; without proper notice, 90 days from the sale.',
    sources: ['nrs-107'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'if filed within 30 days after the trustee’s deed is recorded' },
      { file: PB, text: 'has 90 days from the sale date (NRS 107.080)' },
    ],
  },
  {
    id: 'possession-notices',
    claim: 'Former owners get a 3-day notice; tenants generally at least 60 days; bona fide tenants at least 90 days under federal law.',
    sources: ['nrs-040', 'usc-12-5220'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'Former owners get a 3-day notice (NRS 40.255)' },
      { file: PB, text: 'Bona fide tenants get at least 90 days’ written notice under federal law' },
    ],
  },

  // ---------------- HOA foreclosure (NRS 116) ----------------
  {
    id: 'hoa-super-priority',
    claim: 'Up to 9 months of HOA dues (plus certain charges) rank ahead of the first mortgage.',
    sources: ['nrs-116'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Up to 9 months of dues (plus certain charges)' }],
  },
  {
    id: 'hoa-redemption',
    claim: 'After an HOA sale the owner has 60 days to redeem at the price plus 1% a month, plus taxes and assessments paid.',
    sources: ['nrs-116'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'subject to a 60-day redemption period' },
      { file: PB, text: '60 days after the sale, at your price plus 1% a' },
    ],
  },
  {
    id: 'hoa-lender-payment',
    claim: 'If the lender pays the super-priority amount (recorded at least 2 days before the sale), the buyer takes subject to the first mortgage.',
    sources: ['nrs-116'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'it must be recorded at least 2 days before the sale' }],
  },

  // ---------------- Sheriff / execution sales (NRS 21) ----------------
  {
    id: 'sheriff-redemption',
    claim: 'After an execution sale the debtor can redeem for 1 year at the price plus 1% a month; rents collected are subtracted.',
    sources: ['nrs-021'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'the year is subtracted from the payoff (NRS 21.250)' },
      { file: PB, text: 'within 60 days of each redemption' },
    ],
  },
  {
    id: 'sheriff-homestead',
    claim: 'A recorded homestead protects up to $605,000 of equity from execution.',
    sources: ['nrs-021'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'up to $605,000 of equity is protected from execution' }],
  },

  // ---------------- IRS seizure sales ----------------
  {
    id: 'irs-redemption',
    claim: 'After an IRS seizure sale the owner can redeem for 180 days at the price plus 20% a year, compounded daily.',
    sources: ['irs-auctions'],
    checked: '2026-09-27',
    where: [
      { file: PB, text: 'can redeem by paying your price plus 20% a year, compounded daily' },
      { file: PB, text: 'A certificate of sale; a deed after 180 days' },
    ],
  },

  // ---------------- Bank-owned / government-owned ----------------
  {
    id: 'fannie-first-look',
    claim: 'Fannie Mae gives owner-occupants a 30-day First Look period in Nevada before investors can offer.',
    sources: ['homepath'],
    checked: '2026-09-27',
    where: [{ file: PB, text: 'Owner-occupants get a 30-day “First Look” period before investors' }],
  },
];
