// "What you'll need" checklists for each type of sale. For types that aren't for sale yet
// (pre-foreclosures, liens on record), the list is what to prepare in case they go to sale.
// Clark County / Nevada specifics are taken from official notices and statutes; amounts and
// deadlines change, so every list tells buyers to confirm with the official notice.

import type { AcquisitionStatus, SaleType } from '../types';

export interface ChecklistItem {
  text: string;
  detail?: string;
}

export interface BuyerChecklist {
  key: string;
  forSale: boolean;
  title: string;
  intro: string;
  items: ChecklistItem[];
  link?: { href: string; label: string };
  /** Official government site listing these properties (opens in a new tab). */
  official?: { href: string; label: string; note: string };
}

/** HUD's own Nevada search on HUD Home Store (the official site for HUD-owned homes). */
export const HUD_NEVADA_SEARCH = 'https://www.hudhomestore.gov/searchresult?citystate=NV';

const CONFIRM = { text: 'Confirm the details in the official notice', detail: 'Dates, deposits and payment rules change. Check again the day before.' };

export const CHECKLISTS: Record<string, BuyerChecklist> = {
  all: {
    key: 'all',
    forSale: true,
    title: 'What you need to buy at a forced sale',
    intro: 'The basics for any auction or distressed sale. Choose a type of sale to see its exact requirements.',
    items: [
      { text: 'Proof of funds or financing lined up', detail: 'Most auctions need certified funds within hours; financed purchases need pre-approval.' },
      { text: 'Government-issued photo ID' },
      { text: 'A title search on the property', detail: 'Find out which liens survive the sale before you bid.' },
      { text: 'A repair budget', detail: "You often can't inspect the inside first." },
      { text: 'A plan if the home is occupied' },
      CONFIRM,
    ],
  },
  tax: {
    key: 'tax',
    forSale: true,
    title: 'Buying at a Clark County tax sale',
    intro: 'The Treasurer auctions properties with 3+ years of unpaid property taxes, in person at the Government Center. You receive a quitclaim deed to the property.',
    items: [
      { text: 'Registration form and $5,000 deposit, about a week before', detail: "Certified funds to the Treasurer by the registration deadline (in 2025, eight days before the sale). Capped at 280 bidders. No registration on auction day. The deposit is credited if you win and refunded 4–5 weeks later if you don't." },
      { text: 'Register in your own name, not an LLC or trust', detail: 'The deed is issued to the individual on the registration form. Moving it into a company later means recording a separate deed.' },
      { text: 'Photo ID and your registration confirmation on auction day', detail: 'Check-in starts at 7:00 a.m. No phones, laptops or cameras are allowed in the chambers.' },
      { text: 'Certified funds for the full price by 1:00 p.m.', detail: "Cash, cashier's check, wire or money order. If you win several parcels, you must pay for all of them or lose the deposit and be banned from future auctions." },
      { text: 'Research each parcel you want', detail: 'Match the parcel number on the Assessor map and drive by. Parcels can be paid off (lined out) until the Treasurer\'s deadline a few days before the sale.' },
      { text: 'A title search, and a plan for title insurance', detail: 'Not all liens are wiped out, and the IRS can redeem within 120 days if it holds a lien. The former owner can protest the sale for 2 years, and title insurers may not insure until then or until a quiet title action.' },
      { text: 'Budget beyond the bid', detail: 'Recording fees, surviving liens, repairs, possibly quiet title ($1,500–$5,000+ if uncontested), and legal help if someone lives there. The county does not help with occupants.' },
      CONFIRM,
    ],
    link: { href: '#/live', label: 'See verified live tax-sale listings' },
  },
  foreclosure: {
    key: 'foreclosure',
    forSale: true,
    title: 'Buying at a foreclosure auction',
    intro: 'Trustee sales (most Nevada foreclosures) and court-ordered sales after a mortgage default.',
    items: [
      { text: "Cashier's checks for your full bid", detail: 'Trustees usually require certified funds at the sale. Bring several checks to match different bid amounts.' },
      { text: 'Government-issued photo ID' },
      { text: 'Cash or a hard-money or bridge loan arranged in advance', detail: "Regular mortgages can't fund a trustee sale." },
      { text: 'A title search', detail: 'Property taxes and the HOA super-priority lien survive. Check for IRS and other senior liens.' },
      { text: 'Confirmation the sale is still on', detail: 'Call the trustee the day before. Postponements and cancellations are common.' },
      { text: 'An as-is repair budget and an occupancy plan', detail: 'No interior inspection. Tenants must get a change-of-ownership notice (at least 60 days for monthly tenants); former owners a 3-day notice (NRS 40.255). Budget for an eviction attorney.' },
      { text: 'For court-ordered sales: time for redemption', detail: 'The owner can redeem for up to 1 year, so your money may be tied up.' },
    ],
  },
  reo: {
    key: 'reo',
    forSale: true,
    title: 'Buying a bank-owned (REO) home',
    intro: 'The lender owns the home and sells it through an agent or an online auction.',
    items: [
      { text: 'Mortgage pre-approval or proof of funds' },
      { text: 'A buyer’s agent', detail: 'REO sales go through listing brokers.' },
      { text: 'Earnest money deposit', detail: "Held in escrow. The amount is set in the lender's offer terms." },
      { text: "The lender's addendum, read carefully", detail: 'It usually overrides parts of the standard contract.' },
      { text: 'A home inspection within your contingency period' },
      { text: 'Title insurance and escrow for closing' },
      { text: 'For online REO auctions: registration and buyer’s premium', detail: 'Check the platform terms before you bid.' },
      { text: 'For HUD homes: a HUD-registered broker', detail: 'You can’t bid on a HUD home yourself. Owner-occupants get the first bidding period; investors can bid after it ends.' },
    ],
    official: {
      href: HUD_NEVADA_SEARCH,
      label: 'See HUD-owned homes in Nevada on HUD Home Store',
      note: 'HUD’s official listings. We link to them rather than copying them, so you always see HUD’s current list.',
    },
  },
  hoa: {
    key: 'hoa',
    forSale: true,
    title: 'Buying at an HOA foreclosure',
    intro: 'Sales run by an HOA to collect unpaid assessments under NRS 116.',
    items: [
      { text: "Cashier's checks for your full bid", detail: 'Confirm the amount and payee with the HOA’s foreclosure agent.' },
      { text: 'Government-issued photo ID' },
      { text: 'Proof the first mortgage is wiped out, or budget for it', detail: 'If the lender paid the HOA’s priority amount at least 5 days before the sale, the first mortgage survives (NRS 116.31166). Check the Recorder for a recorded payment or satisfaction, and get a title professional’s opinion.' },
      { text: 'A 60-day wait before the sale is final', detail: 'The former owner or a lender can redeem within 60 days by paying your price plus 1% a month. Don’t start repairs until the redemption period ends.' },
      { text: 'Cash, or hard-money financing arranged in advance' },
      { text: 'Budget for surviving liens, repairs and possession' },
      CONFIRM,
    ],
  },
  sheriff: {
    key: 'sheriff',
    forSale: true,
    title: 'Buying at a sheriff or IRS sale',
    intro: 'Sales to satisfy court judgments (sheriff) or federal tax debts (IRS).',
    items: [
      { text: 'Certified funds', detail: 'IRS sealed bids usually need a deposit of 20% of the bid or $200, whichever is greater. See the notice.' },
      { text: 'Government-issued photo ID' },
      { text: 'Time for redemption', detail: 'Sheriff sales: up to 1 year. IRS sales: 180 days. You receive a certificate first, and the deed later.' },
      { text: 'A title search', detail: "You receive only the debtor's or taxpayer's interest. Senior liens stay." },
      { text: 'Cash or hard-money financing arranged in advance' },
      CONFIRM,
    ],
  },
  short: {
    key: 'short',
    forSale: true,
    title: 'Buying a short sale',
    intro: 'A voluntary sale below the loan balance, with the lender’s approval.',
    items: [
      { text: 'Mortgage pre-approval or proof of funds' },
      { text: 'A buyer’s agent with short-sale experience' },
      { text: 'Earnest money deposit, held in escrow' },
      { text: 'Patience for lender approval', detail: 'Often weeks to months. The lender may counter or say no.' },
      { text: 'A home inspection within your contingency period' },
      { text: 'Everything paid through escrow', detail: 'Never pay side fees to anyone outside escrow.' },
    ],
    link: { href: '#/agents/short-sales', label: 'Find a verified short-sale agent' },
  },
  pre: {
    key: 'pre',
    forSale: false,
    title: 'Not for sale yet: how to get ready',
    intro: 'The owner is behind on payments, but nothing is for sale. Prepare now in case it goes to auction or is listed.',
    items: [
      { text: 'Do not contact the homeowner', detail: 'Nevada strictly regulates approaching owners in foreclosure (NRS 645F).' },
      { text: 'Track the property', detail: 'A notice of sale can come 3 months after the default. The auction is about 3+ weeks after that.' },
      { text: 'Line up your money now', detail: "Cash, or a hard-money or bridge loan for an auction. A pre-approval for a short-sale or bank-owned purchase." },
      { text: "Practice with cashier's checks and ID", detail: 'Trustee sales usually need certified funds for the full bid.' },
      { text: 'Order a title search once a notice of sale is recorded' },
      { text: 'Have an agent ready', detail: 'If the owner lists it as a short sale, or the lender takes it back as REO, it sells through agents.' },
    ],
    link: { href: '#/pre-foreclosures', label: 'Open the pre-foreclosure tracker' },
  },
  liens: {
    key: 'liens',
    forSale: false,
    title: 'Not for sale: what liens mean for you',
    intro: 'A lien secures a debt. It does not put the property up for sale.',
    items: [
      { text: 'Watch for an enforcement notice', detail: 'Only a notice of sale, levy or tax-sale listing means a sale is coming.' },
      { text: 'Learn which liens would survive a sale', detail: 'Taxes and some HOA and federal liens can stay with the property.' },
      { text: 'Expect liens to be paid off at closing', detail: 'If the owner ever sells normally, liens are paid from the sale.' },
      { text: 'Get your financing ready in case it goes to sale' },
      { text: 'Respect the owner’s privacy', detail: "Don't use lien records to pressure an owner to sell." },
    ],
  },
};

/** Checklist for a property, from its sale type or status. */
export function checklistForProperty(saleType: SaleType | null, status: AcquisitionStatus): BuyerChecklist {
  if (status === 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE') return CHECKLISTS.pre;
  if (status === 'NOT_FOR_SALE_LIEN_ONLY') return CHECKLISTS.liens;
  switch (saleType) {
    case 'TAX_DEED':
    case 'TAX_LIEN_CERTIFICATE':
      return CHECKLISTS.tax;
    case 'TRUSTEE_SALE':
    case 'JUDICIAL_FORECLOSURE':
      return CHECKLISTS.foreclosure;
    case 'HOA_FORECLOSURE':
      return CHECKLISTS.hoa;
    case 'SHERIFF_EXECUTION':
    case 'FEDERAL_TAX_SEIZURE':
      return CHECKLISTS.sheriff;
    case 'REO':
      return CHECKLISTS.reo;
    default:
      return CHECKLISTS.all;
  }
}

/** Checklist matching the search page's filters (one sale type or status family), else the general one. */
export function checklistForFilters(saleTypes: SaleType[], statuses: AcquisitionStatus[]): BuyerChecklist {
  if (statuses.length === 1 && statuses[0] === 'NOT_FOR_SALE_LIEN_ONLY') return CHECKLISTS.liens;
  if (statuses.length === 1 && statuses[0] === 'PRE_FORECLOSURE_NOT_YET_PURCHASABLE') return CHECKLISTS.pre;
  const keys = new Set(saleTypes.map((t) => checklistForProperty(t, 'IN_PERSON_AUCTION').key));
  return keys.size === 1 ? CHECKLISTS[[...keys][0]] : CHECKLISTS.all;
}
