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
  sid: {
    key: 'sid',
    forSale: true,
    title: 'Buying a special assessment lien certificate',
    intro: 'When special improvement district (SID) assessments go unpaid, the Clark County Treasurer sells the lien. You buy a certificate that earns 1% a month, not the property (NRS 271).',
    items: [
      { text: 'Register in person on sale day', detail: 'About an hour before the sale, with government photo ID. The certificate is issued in the name on your ID. There is no deposit or registration fee at present. You must be 18 or older, arrive on time, and register yourself.' },
      { text: 'Funds for the next morning', detail: "Winners are drawn at random. Pay by 10:00 a.m. the next business day in cash, cashier's check or money order, or the certificate goes to an alternate." },
      { text: 'A W-9 for the Treasurer', detail: 'Interest over $10 is reported on a 1099-INT.' },
      { text: 'Patience for the redemption period', detail: '120 days, or 2 years if the land has a building or significant improvement. Most owners redeem.' },
      { text: 'A calendar reminder for the deadline', detail: 'If the owner never redeems, serve them notice in person, and post it on the property if the public can reach it. If they can’t be found, publish the notice and mail it to every address a diligent records search finds. Then pay any delinquent taxes and assessments and request a deed. The certificate expires 3 years after the redemption period ends.' },
      CONFIRM,
    ],
  },
  tax: {
    key: 'tax',
    forSale: true,
    title: 'Buying at a Clark County tax sale',
    intro: 'The Treasurer auctions properties with 3+ years of unpaid property taxes, in person at the Government Center. If you win, you get a quitclaim deed to the property.',
    items: [
      { text: 'Registration form and $5,000 deposit, about a week before', detail: "Certified funds to the Treasurer by the registration deadline in the auction notice (in recent auctions, about a week before). Capped at 280 bidders. No registration on auction day. The deposit is credited if you win and refunded a few weeks after the sale if you don't (the Treasurer has said 2–3 weeks in its FAQ and 4–5 weeks in past auction notices)." },
      { text: 'The exact name you want on the deed', detail: 'The deed is issued to the bidder name on your Trustee Auction Registration Form, which must be an individual’s name, not a company, LLC or trust. To hold it in an entity, record a separate deed after the sale; ask an attorney first.' },
      { text: 'Your bidder card on auction day', detail: 'Only the registered bidder may bid, by showing their bidder card. Arrive early; the auction notice has the start time and the day’s rules.' },
      { text: 'Certified funds for the full price by 1:00 p.m.', detail: "Cash, cashier's check or money order (confirm accepted forms in the current notice). Parcels re-auctioned at 2:00 p.m. must be paid by 4:30 p.m. If you win several parcels, you must pay for all of them or lose the deposit and be banned from future auctions." },
      { text: 'Research each parcel you want', detail: 'Match the parcel number on the Assessor map and look from the street. Don’t go onto the property; it’s private until the new deed is recorded. Parcels can be paid off (lined out) until close of business 3 business days before the sale.' },
      { text: 'A title search, and a plan for title insurance', detail: 'Not all liens are wiped out. A federal tax lien can survive if the IRS wasn’t given 25 days’ notice, though notice is not needed for a lien filed 30 days or less before the sale. Even when the IRS was notified, it can buy the property back within 120 days. For 2 years after the Treasurer’s deed is delivered, anyone claiming the land (usually the former owner) can sue to recover it, and you may not be able to get title insurance during that time (NRS 361.600).' },
      { text: 'Budget beyond the bid', detail: 'Recording fees, surviving liens, repairs, possibly quiet title (often quoted around $1,500–$5,000+ if uncontested; get an attorney’s quote), and legal help if someone lives there. The county does not help with occupants.' },
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
      { text: 'An as-is repair budget and an occupancy plan', detail: 'You won’t get to see inside. Bona fide tenants get at least 90 days’ written notice under federal law (Protecting Tenants at Foreclosure Act), and a lease can run to its end unless the buyer will live there. For homes with up to 4 units, Nevada also requires a written notice of the change of ownership. Tenants keep their lease rights for a notice period, generally at least 60 days (NRS 40.255). You take over the landlord’s duties, including responsibility for the security deposits tenants already paid, so find out the amounts and budget for them (NRS 118A.244). Former owners get a 3-day notice (NRS 40.255). Budget for an eviction attorney.' },
      { text: 'For court-ordered sales: time for redemption', detail: 'The owner can buy the property back (redeem) for up to 1 year, so your money may be tied up.' },
    ],
  },
  reo: {
    key: 'reo',
    forSale: true,
    title: 'Buying a bank-owned (REO) home',
    intro: 'The lender owns the home and sells it through its listing broker or at an auction it chooses.',
    items: [
      { text: 'Mortgage pre-approval or proof of funds' },
      { text: 'A buyer’s agent', detail: 'REO sales go through listing brokers.' },
      { text: 'Earnest money deposit', detail: "Held in escrow. The amount is set in the lender's offer terms." },
      { text: "The lender's addendum, read carefully", detail: 'It usually overrides parts of the standard contract.' },
      { text: 'A home inspection within your contingency period' },
      { text: 'Title insurance and escrow for closing' },
      { text: 'For lender-run auctions: registration and buyer’s premium', detail: 'Read the auction terms before you bid, and confirm on the recorded deed that the lender is the owner.' },
      { text: 'For HUD homes: a HUD-registered broker', detail: 'You can’t bid on a HUD home yourself. Owner-occupants, HUD-approved nonprofits and government agencies get the first bidding period (15 days for most homes, 5 for uninsured ones). Investors can bid after that.' },
    ],
    official: {
      href: HUD_NEVADA_SEARCH,
      label: 'See HUD-owned homes in Nevada on HUD Home Store',
      note: 'HUD’s official listings. We link to them rather than copying them, so you always see HUD’s current list.',
    },
  },
  business: {
    key: 'business',
    forSale: true,
    title: 'Buying business assets or a whole business',
    intro: 'Equipment, inventory, vehicles or a whole business sold by a court trustee, receiver, the sheriff or a tax agency.',
    items: [
      { text: 'The sale notice and any court order', detail: 'They say exactly what is sold, the deadline, the deposit, and whether it’s free of liens.' },
      { text: 'A lien search on the equipment', detail: 'Lenders record UCC financing statements with the Nevada Secretary of State. A sheriff or tax sale may not clear them.' },
      { text: 'A state tax clearance when you buy all or part of a business or its stock of goods', detail: 'Outside normal sales, hold back enough of the price until the seller gives you a receipt or certificate from the Department of Taxation. Otherwise you can owe their unpaid state taxes, up to what you paid (NRS 360.525). For a trustee or sheriff sale, ask the Department how this applies.' },
      { text: 'An inspection, and a plan for removal', detail: 'Items are sold as-is. Budget for rigging, transport and storage, and meet the pickup deadline.' },
      { text: 'Certified funds, and a deposit if required' },
      { text: 'Your own licenses and permits', detail: 'Many business, liquor, health and contractor licenses don’t simply pass with the assets. You may need a new license, a transfer approval or a change-of-ownership filing. Confirm with each agency that issued one.' },
      { text: 'Leases, customer data and titles', detail: 'The building lease needs the landlord’s consent. Customer data may carry privacy limits. Vehicles need titles.' },
      { text: 'An attorney and a CPA for a whole business', detail: 'Buying assets and buying the company are very different for debts, taxes and liability.' },
    ],
  },
  commercial: {
    key: 'commercial',
    forSale: true,
    title: 'Extra checks for commercial property',
    intro: 'On top of the checklist for the type of sale: what’s different about stores, offices, industrial buildings, apartments with 5+ units and commercial land.',
    items: [
      { text: 'Rent roll and copies of the leases', detail: 'From the receiver or listing broker. At an auction you usually can’t get them, so value it as if empty.' },
      { text: 'Your own value', detail: 'Rental property: net operating income ÷ cap rate; ask a commercial broker for current cap rates for this property type. Land or an owner-user building: recent sales of similar commercial property.' },
      { text: 'An environmental screen, and a Phase I if you can', detail: 'Check EPA and state records and past uses (gas station, dry cleaner, auto repair). A Phase I done within one year before you take title (with the site visit, interviews and record searches updated within 180 days), plus meeting ongoing duties after you buy, can protect you from federal cleanup liability (40 CFR 312.20).' },
      { text: 'A title search that lists recorded leases and easements', detail: 'Know which leases, easements and agreements survive the sale.' },
      { text: 'Zoning, open code cases and permits', detail: 'Confirm your planned use is allowed with the city or county.' },
      { text: 'Your money: certified funds for an auction, or proof of funds or a lender’s term sheet for a negotiated sale', detail: 'Auctions need cash; a commercial lender can refinance after. SBA 504 and 7(a) loans are only for a business that will use the building, not rental investment.' },
      { text: 'Commercial insurance from the day you own it', detail: 'Vacant commercial buildings need a specific policy.' },
      { text: 'Estoppel certificates from tenants after you buy', detail: 'Each tenant confirms their rent, deposit, term and any claims, in writing. Most leases require tenants to sign one.' },
    ],
  },
  hoa: {
    key: 'hoa',
    forSale: true,
    title: 'Buying at an HOA foreclosure',
    intro: 'A homeowners association (HOA) sells a home to collect unpaid assessments (NRS 116).',
    items: [
      { text: "Cashier's checks for your full bid", detail: 'Confirm the amount and payee with the HOA’s foreclosure agent.' },
      { text: 'Government-issued photo ID' },
      { text: 'Proof the first deed of trust is wiped out, or budget for it', detail: 'If the lender paid the HOA’s priority amount at least 5 days before the sale, the first deed of trust (the main home loan) survives (NRS 116.31166). It also survives if Fannie Mae or Freddie Mac owned the loan, unless the FHFA consented. Check the Recorder for a recorded payment or satisfaction, and get a title professional’s opinion.' },
      { text: 'A 60-day wait before the sale is final', detail: 'The former owner, or a lender whose loan ranked below the HOA lien, can redeem within 60 days. They pay your price plus 1% a month, plus the taxes, assessments and upkeep you paid. That includes reasonable spending needed to maintain and repair the unit to the HOA’s standards, but not upgrades, so save renovations until the redemption period ends.' },
      { text: 'Cash, or hard-money financing arranged in advance' },
      { text: 'Budget for surviving liens, repairs and possession' },
      CONFIRM,
    ],
  },
  sheriff: {
    key: 'sheriff',
    forSale: true,
    title: 'Buying at a sheriff or IRS sale',
    intro: 'The sheriff sells property to pay a court judgment, and the IRS sells property to collect unpaid federal taxes.',
    items: [
      { text: 'Certified funds', detail: 'Each sale notice (the sheriff’s or the IRS’s) sets the deposit and how to pay. Read it for each sale.' },
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
    intro: 'The owner chooses to sell for less than the loan balance, and the lender has to approve.',
    items: [
      { text: 'Mortgage pre-approval or proof of funds' },
      { text: 'A buyer’s agent with short-sale experience' },
      { text: 'Earnest money deposit, held in escrow' },
      { text: 'Patience for lender approval', detail: 'Often weeks to months. The lender may counter or say no.' },
      { text: 'A home inspection within your contingency period' },
      { text: 'Everything paid through escrow', detail: 'Never pay side fees to anyone outside escrow.' },
    ],
    link: { href: '#/pros/agent', label: 'How to find a short-sale agent' },
  },
  pre: {
    key: 'pre',
    forSale: false,
    title: 'Not for sale yet: how to get ready',
    intro: 'The owner is behind on payments, but nothing is for sale. Prepare now in case it goes to auction or is listed.',
    items: [
      { text: 'Do not contact the homeowner', detail: 'Nevada licenses foreclosure consultants, and buyers who use fraud or deceit on owners in foreclosure face criminal penalties and can have the sale undone (NRS 645F). Our rule is simple: no contact.' },
      { text: 'Track the property', detail: 'A notice of sale can come 3 months after the notice of default is recorded (90 days for an HOA). The auction is about 3+ weeks after that.' },
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
      return CHECKLISTS.tax;
    case 'TAX_LIEN_CERTIFICATE':
      return CHECKLISTS.sid;
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

// Some sale-type checklist items are about homes only: HOA super-priority liens (NRS 116 covers
// residential communities), the federal 90-day tenant notice (PTFA covers residential tenants, including
// apartment buildings, but not stores, offices or other commercial tenants), and HUD's
// owner-occupant rules. On a commercial property page, show commercial wording instead.
const COMMERCIAL_WORDING: Record<string, Partial<ChecklistItem> | null> = {
  'A title search': { detail: 'Property taxes, special assessments and liens recorded before the one being foreclosed can survive. Check for IRS and other senior liens, and recorded leases.' },
  'An as-is repair budget and an occupancy plan': {
    text: 'An as-is repair budget and a plan for tenants',
    detail: 'No interior inspection. The federal 90-day tenant notice protects residential tenants, including in apartment buildings, but not commercial tenants. A commercial lease signed after the foreclosed loan, or subordinated to it, can be wiped out unless there’s a non-disturbance agreement, and then the tenant can also leave. Have an attorney review each lease and how to take possession.',
  },
  'A plan if the home is occupied': { text: 'A plan for any tenants or occupants' },
  'For HUD homes: a HUD-registered broker': null, // HUD sells homes only
  'Mortgage pre-approval or proof of funds': { text: 'A commercial lender’s term sheet or proof of funds' },
  'A buyer’s agent': { text: 'A commercial broker', detail: 'Bank-owned commercial property is sold through listing brokers.' },
  'A home inspection within your contingency period': { text: 'A property inspection within your due-diligence period' },
};

// Vacant land has no building, occupants to plan for, home inspection or tenants, and land is rarely
// bought with a mortgage. On a land parcel, show land wording instead.
const LAND_SITE_CHECK: Partial<ChecklistItem> = {
  text: 'A site check and a clean-up budget',
  detail: 'Drive by the lot: look for dumping, stored items or anyone camping there, and confirm legal access. Confirm zoning and what it costs to connect water, sewer and power.',
};
const LAND_DUE_DILIGENCE: Partial<ChecklistItem> = { text: 'Land due diligence within your contingency period', detail: 'Zoning, legal access, a survey, soils, and what it costs to connect water, sewer and power.' };
const LAND_FUNDS: Partial<ChecklistItem> = { text: 'Proof of funds', detail: 'Land loans are harder to get than home loans. Plan on cash, or a land or construction lender lined up in advance.' };
const LAND_WORDING: Record<string, Partial<ChecklistItem> | null> = {
  'An as-is repair budget and an occupancy plan': LAND_SITE_CHECK,
  'An as-is repair budget and a plan for tenants': LAND_SITE_CHECK,
  'A home inspection within your contingency period': LAND_DUE_DILIGENCE,
  'A property inspection within your due-diligence period': LAND_DUE_DILIGENCE,
  'Mortgage pre-approval or proof of funds': LAND_FUNDS,
  'A commercial lender’s term sheet or proof of funds': LAND_FUNDS,
  'For HUD homes: a HUD-registered broker': null, // HUD sells homes only
  'Rent roll and copies of the leases': null,
  'Estoppel certificates from tenants after you buy': null,
  'Commercial insurance from the day you own it': { text: 'Liability insurance from the day you own it' },
  'Your money: certified funds for an auction, or proof of funds or a lender’s term sheet for a negotiated sale': { detail: 'Auctions need cash. Land loans are harder to get; plan on cash, or a construction lender if you’ll build.' },
};

function reword(list: BuyerChecklist, wording: Record<string, Partial<ChecklistItem> | null>, suffix: string): BuyerChecklist {
  const items = list.items.flatMap((item) => {
    if (!(item.text in wording)) return [item];
    const change = wording[item.text];
    return change ? [{ ...item, ...change }] : [];
  });
  return {
    ...list,
    key: `${list.key}-${suffix}`, // ticks are kept separately from the residential version
    title: list.title.replace(/\bhome\b/, 'property'),
    intro: list.intro.replace('owns the home', 'owns the property'),
    items,
    official: list.key === 'reo' ? undefined : list.official, // HUD Home Store link is for homes
  };
}

/** The same checklist with building, occupant and mortgage items reworded (or dropped) for vacant land. */
export function forLand(list: BuyerChecklist): BuyerChecklist {
  return reword(list, LAND_WORDING, 'land');
}

/** The same checklist with home-only items reworded (or dropped) for a commercial property. */
export function forCommercial(list: BuyerChecklist): BuyerChecklist {
  return reword(list, COMMERCIAL_WORDING, 'commercial');
}
