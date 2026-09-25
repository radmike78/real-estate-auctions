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
}

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
    intro: 'The Treasurer auctions properties with 3+ years of unpaid property taxes, in person at the Government Center.',
    items: [
      { text: 'Registration form and $5,000 refundable deposit', detail: "Due to the Treasurer's office by the registration deadline, about a week before the auction. Registration is capped at 280 bidders." },
      { text: 'Government-issued photo ID for check-in' },
      { text: 'Certified funds for the full price', detail: "Cash, cashier's check, wire or money order, due by 1:00 p.m. on auction day." },
      { text: 'Research each parcel you want', detail: 'Check the Assessor record and drive by. Parcels can be lined out (paid off) up to the payment deadline.' },
      { text: 'A title search', detail: 'Not all liens are wiped out. The IRS can redeem within 120 days if it holds a lien.' },
      { text: 'Budget beyond the bid', detail: 'Include recording fees, surviving liens, repairs, and possibly a quiet-title action.' },
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
      { text: 'An as-is repair budget and an occupancy plan', detail: 'No interior inspection. Occupants may need to be evicted.' },
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
    ],
  },
  hoa: {
    key: 'hoa',
    forSale: true,
    title: 'Buying at an HOA foreclosure',
    intro: 'Sales run by an HOA to collect unpaid assessments under NRS 116.',
    items: [
      { text: "Cashier's checks for your full bid", detail: 'Confirm the amount and payee with the HOA’s foreclosure agent.' },
      { text: 'Government-issued photo ID' },
      { text: 'A title review by a professional', detail: 'Whether the first mortgage survives is often disputed in Nevada. Get advice before you bid.' },
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
