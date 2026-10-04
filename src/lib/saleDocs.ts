// "Documents and what to say" for each kind of sale: the papers you'll need, get or sign, what to check on each,
// and words to use with the official seller or your own team. General to every state on purpose: exact forms,
// amounts and deadlines are in each guide's steps and the official notice, which always wins.
// Scripts go only to official sellers and your own professionals, never to an owner, occupant or former owner.

export interface SaleDoc {
  name: string;
  /** What to check on it, or how to fill it in. */
  check: string;
}

export interface SaleScript {
  to: string;
  script: string;
}

export type SaleKindKey = 'deed' | 'taxlien' | 'sid' | 'trustee' | 'hoa' | 'sheriff' | 'irs' | 'reo' | 'short' | 'commercial';

/** The kind of sale a guide covers, from its key ("catax" and "tax" are both tax deed sales). */
export function saleKindOf(guideKey: string): SaleKindKey {
  const k = guideKey.replace(/^(ca|az|ut)(?=[a-z]{3})/, '');
  if (k === 'tax') return 'deed';
  if (k === 'foreclosure') return 'trustee';
  return (['taxlien', 'sid', 'hoa', 'sheriff', 'irs', 'reo', 'short', 'commercial'] as const).find((x) => x === k) ?? 'deed';
}

const NOTICE: SaleDoc = { name: 'The official notice of sale', check: 'Save a copy with the date you saved it. Check the sale date, place or website, opening bid, deposit, form of payment and deadline. Check again the day before: sales are often postponed or cancelled.' };
const TITLE_SEARCH: SaleDoc = { name: 'A title search or report', check: 'Lists the recorded owner, loans and liens. Ask the title company which liens would survive this kind of sale, and whether it would insure the title after you buy.' };
const FUNDS: SaleDoc = { name: 'Certified funds (cashier’s checks or a wire)', check: 'In the exact form and amounts the notice requires. Ask your bank how long they take. Never send money from instructions in an email without calling to confirm.' };
const RECEIPT: SaleDoc = { name: 'Your payment receipt', check: 'Keep it with the sale notice. It proves what you paid and when.' };
const PREAPPROVAL: SaleDoc = { name: 'Pre-approval letter or proof of funds', check: 'A lender’s pre-approval for the price you’re offering, or a recent bank statement for a cash offer. Sellers usually want one with every offer.' };
const BUYER_AGREEMENT: SaleDoc = { name: 'Buyer agreement with your agent', check: 'Read what your agent will do, how and by whom they’re paid, how long it lasts and how to end it, before you sign.' };
const CONTRACT: SaleDoc = { name: 'Purchase contract', check: 'Price, deposit amount and deadline, and each contingency’s deadline (inspection, appraisal, loan). Put every date on your calendar the day it’s accepted.' };
const INSPECTION: SaleDoc = { name: 'Inspection report and repair bids', check: 'Sort findings into fix now and budget later. Get written bids for the big items before your inspection deadline.' };
const COMMITMENT: SaleDoc = { name: 'Title commitment (or preliminary report)', check: 'Requirements must be cleared before closing, such as payoffs and releases. Exceptions are things the title policy won’t cover. Ask how each requirement will be cleared.' };
const CLOSING: SaleDoc = { name: 'Closing statement', check: 'Compare every line with your contract and loan quote, including the credit for your deposit, before you sign.' };
const DEED: SaleDoc = { name: 'Recorded deed', check: 'Confirm your name is spelled exactly right and it’s recorded with the county recorder. Keep a copy.' };

export const SALE_DOCS: Record<SaleKindKey, SaleDoc[]> = {
  deed: [
    NOTICE,
    { name: 'Bidder registration form', check: 'Fill it in with the exact name you want on the deed. Some counties allow only an individual’s name: your guide says if yours does.' },
    { name: 'Photo ID and the registration deposit', check: 'Bring what the notice asks for, in the form it asks for, by the registration deadline.' },
    TITLE_SEARCH,
    FUNDS,
    RECEIPT,
    { name: 'The tax deed', check: 'Usually a deed with no promises about the title. Confirm it’s recorded in your name. A title company may want a quiet title case before it will insure the property: ask an attorney what that costs.' },
  ],
  taxlien: [
    NOTICE,
    { name: 'Bidder registration (often online)', check: 'Register by the county’s deadline. The county may ask for a W-9 so it can report the interest you earn.' },
    { name: 'Your parcel research notes', check: 'For each parcel: map, access, zoning and use. Bid only on parcels you’d be willing to own.' },
    FUNDS,
    { name: 'Certificate of purchase (or the county’s record of it)', check: 'Parcel number, amount paid and your interest rate. Keep it with your receipt.' },
    { name: 'Your payoff record', check: 'For each certificate: what you paid, the rate, and every payment the county sends you. Match each payoff to your record.' },
  ],
  sid: [
    NOTICE,
    { name: 'Buyer registration form', check: 'Fill it in exactly as the notice says, with the ID it asks for.' },
    { name: 'Your parcel research notes', check: 'Map, access, zoning and other liens. Bid only on parcels you’d be willing to own.' },
    FUNDS,
    { name: 'Certificate of sale', check: 'Parcel, amount and date. Keep it: you need it to be repaid, or to ask for a deed if the owner never redeems. It expires if you wait too long.' },
  ],
  trustee: [
    NOTICE,
    TITLE_SEARCH,
    FUNDS,
    { name: 'Trustee’s deed', check: 'Confirm it’s recorded in your name. It doesn’t clear liens senior to the loan that was foreclosed.' },
    { name: 'Insurance binder', check: 'Coverage starting when the property becomes your risk under this sale. Ask the trustee when that is.' },
  ],
  hoa: [
    NOTICE,
    TITLE_SEARCH,
    { name: 'Any recorded payment of the super-priority amount', check: 'In Nevada, search the Recorder for it before the sale: it changes whether the first mortgage survives.' },
    FUNDS,
    { name: 'Certificate of sale, then the deed', check: 'In Nevada, you get a certificate of sale first. The owner or a junior lender can redeem for 60 days. If no one does, you get a deed without warranty. Don’t renovate before then. In other states, read your guide for when the deed comes.' },
  ],
  sheriff: [
    NOTICE,
    { name: 'The court case file', check: 'The judgment and the writ of execution behind the sale. Your attorney can tell you what the judgment covers.' },
    TITLE_SEARCH,
    FUNDS,
    { name: 'Certificate of sale or sheriff’s deed', check: 'If the sale has a redemption period, you get a certificate first and the deed after it ends: keep the certificate safe and calendar the date. Your guide says which applies.' },
  ],
  irs: [
    NOTICE,
    { name: 'Form 2434-B (the IRS list of known liens)', check: 'Ask the IRS contact on the notice for it. It isn’t guaranteed complete, so order your own title report too.' },
    TITLE_SEARCH,
    FUNDS,
    { name: 'Certificate of sale', check: 'You get it when you pay in full. Ask a title company or attorney about recording it.' },
    { name: 'The deed, after 180 days', check: 'If no one redeems, turn in the certificate of sale for the deed, then record the deed.' },
  ],
  reo: [PREAPPROVAL, BUYER_AGREEMENT, CONTRACT, { name: 'The bank’s addendum', check: '“As-is” terms, who pays which costs, deposit and closing deadlines, and any per-day fee for closing late. It usually overrides the standard contract.' }, INSPECTION, COMMITMENT, CLOSING, DEED],
  short: [PREAPPROVAL, BUYER_AGREEMENT, CONTRACT, { name: 'Short-sale addendum', check: 'Says the sale depends on the lender’s approval. Check how long you’ll wait and whether you can cancel while you wait.' }, { name: 'The lender’s approval letter', check: 'The price it accepts, the closing deadline, and which costs it will and won’t pay. Close by its deadline.' }, INSPECTION, COMMITMENT, CLOSING, DEED],
  commercial: [
    PREAPPROVAL,
    { name: 'Letter of intent, then the purchase contract', check: 'Price, deposit, due-diligence period, closing date, and which documents the seller must give you.' },
    { name: 'Leases, rent roll and estoppel letters', check: 'What each tenant pays and owes. Estoppels confirm it from the tenant’s side. Compare them line by line.' },
    { name: 'Operating statements (the last 12 months or more)', check: 'Real income and expenses. Ask for bank statements or tax returns to back them up.' },
    { name: 'Environmental report (Phase I)', check: 'Ordered before you buy, by an environmental professional. Read its findings and data gaps with your attorney.' },
    COMMITMENT,
    { name: 'Survey', check: 'Boundaries, easements, access and anything built over a line.' },
    CLOSING,
    DEED,
  ],
};

const OFFICIAL_ASK = '“I’m thinking about bidding at your [date] sale. Where can I find the bidder rules, the property list and any updates? What deposit and form of payment do you need, when is the balance due, and how will I learn if a property is withdrawn?”';

export const SALE_SCRIPTS: Record<SaleKindKey, SaleScript[]> = {
  deed: [
    { to: 'County treasurer’s tax sale office', script: OFFICIAL_ASK },
    { to: 'Title company', script: '“I’m considering bidding on parcel [number] at the county tax sale on [date]. Which liens would likely survive, and would you insure the title afterward, or would you need a quiet title case first?”' },
  ],
  taxlien: [{ to: 'County treasurer', script: '“I’d like to bid at your tax lien sale. Where are the bidder rules and the list? How do I register, what fees apply, and when and how is payment due?”' }],
  sid: [{ to: 'The sale’s office or agent named on the notice', script: OFFICIAL_ASK }],
  trustee: [
    { to: 'The trustee (from the notice of sale)', script: '“I’m interested in the trustee’s sale for [notice number or parcel] on [date]. Is it still scheduled? What’s the opening bid, where is it held, what form of funds do you need, and when does the property become the buyer’s risk?”' },
    { to: 'Title company', script: '“Which loan is being foreclosed on parcel [number], and which liens would survive this sale? Would you insure the title afterward?”' },
  ],
  hoa: [{ to: 'The HOA’s foreclosure agent or trustee (from the notice)', script: '“I’m interested in the HOA sale for [parcel] on [date]. Is it still scheduled? What’s the opening bid, what form of funds do you need, and does the sale affect the first mortgage?”' }],
  sheriff: [{ to: 'The sheriff’s civil section', script: '“I’m interested in the sheriff’s sale in case [number] on [date]. Is it still scheduled? What deposit and form of payment do you need, and what document will the buyer receive?”' }],
  irs: [{ to: 'The IRS contact on the notice', script: '“I’m interested in the sale of [property] on [date]. Could I have Form 2434-B and the sale terms? What forms of payment do you accept, and when is the balance due?”' }],
  reo: [{ to: 'Your agent', script: '“Before we offer, could you ask the listing agent whether the bank has an addendum we should read, whether the home will be vacant at closing, and whether the utilities can be on for the inspection?”' }],
  short: [{ to: 'Your agent (to ask the listing agent)', script: '“Has the seller’s package gone to every lender with a lien? How many liens are there, how long has the file been open, and is a foreclosure sale scheduled?”' }],
  commercial: [{ to: 'The listing broker', script: '“Could you send the rent roll, current leases, the last 12 months of operating statements and any environmental reports? What’s the seller’s timeline, and will tenants sign estoppel letters?”' }],
};

/** The documents for one guide, leaving out rules that belong to another state. */
export function saleDocsFor(guideKey: string, state: string): SaleDoc[] {
  return SALE_DOCS[saleKindOf(guideKey)].filter((d) => state === 'NV' || !/super-priority/.test(d.name));
}
