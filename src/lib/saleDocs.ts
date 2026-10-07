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
  const k = guideKey.replace(/^(ca|az|ut|tx)(?=[a-z]{3})/, '');
  if (k === 'tax') return 'deed';
  if (k === 'foreclosure') return 'trustee';
  return (['taxlien', 'sid', 'hoa', 'sheriff', 'irs', 'reo', 'short', 'commercial'] as const).find((x) => x === k) ?? 'deed';
}

const NOTICE: SaleDoc = { name: 'The official notice of sale', check: 'Save a copy with the date you saved it. Check the sale date, place or website, opening bid, deposit, form of payment and deadline. Check again the day before: sales are often postponed or cancelled.' };
const TITLE_SEARCH: SaleDoc = { name: 'A title search or report', check: 'Lists the recorded owner, loans and liens. Ask the title company which liens would survive this kind of sale, and whether it would insure the title after you buy.' };
const FUNDS: SaleDoc = { name: 'Certified funds (in the form the notice requires)', check: 'Often a cashier’s check or a wire, in the exact amounts the notice requires. Ask your bank how long they take. Never send money from instructions in an email without calling to confirm.' };
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
    { name: 'Your parcel research notes', check: 'Map, access, zoning and other liens. Ask for certificates only on parcels you’d be willing to own.' },
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
    { name: 'Certificate of sale, then the deed', check: 'In Nevada, you get a certificate of sale first. The owner or a junior lender can redeem for 60 days. If no one does, you get a deed without warranty. Don’t renovate before then.' },
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
  sid: [{ to: 'The sale’s office or agent named on the notice', script: '“I’m planning to take part in your [date] SID certificate sale. Where are the list and the rules, what ID do I bring to register, and what forms of payment do you take the next morning?”' }],
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

// Texas runs some sales differently: a sheriff or constable sells tax-foreclosed property, an HOA's rules depend on
// whether it's a subdivision or a condominium, and the TREC forms set the contract dates. These replace the general
// lists for Texas guides (Tax Code 34.01, 34.015, 34.21; Property Code 82.113, 209.0092, 209.011; TREC 20-19, 45-2).
const TX_TAX_NOTICE: SaleDoc = { name: 'The notice of sale and the county’s sale page', check: 'The sheriff or constable posts it before the first-Tuesday sale. Save it with the date you saved it. The county’s page sets how you register, whether the sale is in person or online, the funds it takes and when payment is due; those override any general summary. Check again the day before: properties are often pulled when the taxes are paid.' };
const TX_DOCS: Partial<Record<SaleKindKey, SaleDoc[]>> = {
  deed: [
    TX_TAX_NOTICE,
    { name: 'The tax office’s statement that you owe no delinquent taxes', check: 'In counties of 250,000 people or more, and smaller ones that adopt the rule, the officer can’t give you a deed without it (Tax Code 34.015). Ask the county tax assessor-collector for it before the sale, in the exact name you’ll bid in. It expires 90 days after it’s issued, and the fee is $10 or less. Where the county uses bidder registration instead, register with the county before the sale (Tax Code 34.011).' },
    { name: 'The court judgment and order of sale', check: 'From the district clerk. It shows the amount owed, the market value the court set and who was sued. Ask a title company or attorney which liens and interests the judgment covers and which ones stay.' },
    { name: 'Appraisal district record and the judgment’s description', check: 'They tell you the redemption period: 2 years for a home that was the owner’s homestead, land designated for agricultural use, or a mineral interest; 180 days for other property (Tax Code 34.21). Vacant land isn’t automatically 180 days, and rural land isn’t automatically agricultural: check the record.' },
    TITLE_SEARCH,
    { name: 'Funds in the form the sale requires', check: 'In person, the officer says what it takes; online sales often require a wire. Ask your bank how long it takes, and never follow wiring instructions from an email without calling a number you looked up yourself.' },
    RECEIPT,
    { name: 'The sheriff’s or constable’s deed', check: 'It gives you the owner’s interest, including the right to use and possess the property, subject to the redemption right and certain recorded covenants, easements and liens (Tax Code 34.01(n)). It’s filed for record by the officer: the redemption clock starts on that filing date, so put it on your calendar. Ask a title company when it would insure the title.' },
  ],
  trustee: [
    { name: 'The notice of trustee’s sale', check: 'Posted at the courthouse and filed with the county clerk at least 21 days before the first-Tuesday sale (Property Code 51.002). It names the trustee, the place and the time the sale starts. Save it, and check again the day before: many sales are postponed or cancelled.' },
    { name: 'The deed of trust and any recorded assignments', check: 'From the county clerk’s records. They show which loan is being foreclosed and who holds it. Your title company can pull them with the title search.' },
    TITLE_SEARCH,
    FUNDS,
    { name: 'Trustee’s deed', check: 'Confirm it’s recorded in your name. It doesn’t clear liens senior to the loan that was foreclosed. Before anyone is asked to leave, find out whether the people living there are the former owner or tenants: tenants can have more time under their lease and federal law.' },
    { name: 'Insurance binder', check: 'Coverage starting when the property becomes your risk under this sale. Ask the trustee when that is.' },
  ],
  hoa: [
    { name: 'The notice of sale and the court order', check: 'A subdivision HOA usually needs a court order before it can sell a home (Property Code 209.0092). A condominium association can foreclose in court or without a court under its statutory power of sale, using the Property Code 51.002 trustee-sale procedure unless the declaration sets another procedure (Property Code 82.113(d), (e)). Check the notice for the trustee or attorney running the sale.' },
    { name: 'The recorded declaration', check: 'It decides which law applies: a subdivision (Chapter 209) or a condominium (Chapter 82). A townhome can be either, and the name or look of the building doesn’t tell you.' },
    TITLE_SEARCH,
    FUNDS,
    { name: 'The foreclosure deed, and the redemption deadline', check: 'Subdivision: the owner, or a lender after 90 days, can redeem until 180 days after the HOA mails notice of the sale, and you can’t sell to anyone else until then (209.011). Condominium: the owner can redeem until 90 days after the sale and repays your bid plus 6% a year (82.113). Hold off on remodeling until it ends.' },
  ],
  sheriff: [
    NOTICE,
    { name: 'The tax office’s statement that you owe no delinquent taxes, or your county bidder registration', check: 'In counties of 250,000 people or more, and smaller ones that adopt the rule, the officer can’t give you a deed without one of them (Civ. Prac. & Rem. Code 34.0445). Ask the county tax assessor-collector for the statement before the sale, in the exact name you’ll bid in, or register as a bidder where the county uses registration.' },
    { name: 'The court case file', check: 'The judgment and the writ of execution behind the sale. Your attorney can tell you what the judgment covers.' },
    TITLE_SEARCH,
    FUNDS,
    { name: 'The sheriff’s or constable’s deed', check: 'It conveys only what the debtor owned, so liens ahead of the judgment stay. Confirm it’s recorded in your name.' },
  ],
  reo: [
    PREAPPROVAL,
    BUYER_AGREEMENT,
    { name: 'The TREC resale contract (form 20-19)', check: 'Price, earnest money and the option fee, the option period (your strict deadline to end the contract for any reason), the financing addendum’s deadlines and the closing date. Put every date on your calendar the day it’s signed.' },
    { name: 'The bank’s addendum', check: '“As-is” terms, who pays which costs, deposit and closing deadlines, and any per-day fee for closing late. It usually overrides the standard contract.' },
    INSPECTION,
    COMMITMENT,
    CLOSING,
    DEED,
  ],
  short: [
    PREAPPROVAL,
    BUYER_AGREEMENT,
    { name: 'The TREC resale contract (form 20-19)', check: 'Price, earnest money, the option fee and the closing date. With a short sale, these dates are tied to the addendum below.' },
    { name: 'TREC Short Sale Addendum (form 45-2)', check: 'Says the contract depends on every lienholder’s written approval (45-2, A, I). Read which dates change: for performance, the effective date becomes the day you’re told of the approval (D), while your option period begins on the original effective date and runs until it expires under paragraph 5 (F). Note the approval deadline and how to extend it, and have your agent write out every date for your contract.' },
    { name: 'Each lienholder’s approval letter', check: 'The price it accepts, the closing deadline and which costs it will and won’t pay. An approval doesn’t prove a posted foreclosure sale has been called off: have your agent or attorney confirm that in writing.' },
    INSPECTION,
    COMMITMENT,
    CLOSING,
    DEED,
  ],
};

/** The documents for one guide, leaving out rules that belong to another state. */
// The HOA deed and buy-back period differ by state, so the Nevada certificate entry is swapped for the state's own
// (Civ. Code 5715 and CCP 729.035; A.R.S. 12-1282, 12-1286; Utah Code 57-1-28, URCP 69C).
const HOA_DEED: Partial<Record<string, SaleDoc>> = {
  CA: { name: 'The trustee’s deed, and the 90-day redemption deadline', check: 'After a nonjudicial HOA sale, the home can be bought back for 90 days (Civil Code 5715, CCP 729.035). Ask the trustee when it will deliver your deed and put the 90th day on your calendar. Don’t renovate before then; spend only to protect the property.' },
  AZ: { name: 'Certificate of sale, then the sheriff’s deed', check: 'An Arizona HOA forecloses in court. You get a certificate of sale at the sheriff’s sale, and the owner can redeem for 6 months. It’s 30 days only if the judgment found the home both abandoned and not used mainly for farming or grazing (A.R.S. 12-1282). If the owner doesn’t redeem, creditors with liens behind the one foreclosed can redeem one after another, in order of priority, each within 5 days after the one before, so every such creditor adds up to 5 more days to the wait (12-1282(C)). The sheriff’s deed comes only after every redemption period ends (12-1286). The judgment tells you which owner period applies, and your title report shows which creditors could redeem. Don’t renovate before then.' },
  UT: { name: 'The deed, or the certificate of sale', check: 'Trustee sale: the trustee sends the trustee’s deed for recording within 5 business days after you pay, and the former owner has no right to buy it back (Utah Code 57-1-28). Court foreclosure: you get a certificate of sale, and the owner or a junior creditor can redeem for 180 days (URCP 69C). Either way, if the sale wiped out a junior federal tax lien, the United States can still redeem: within 120 days or the state redemption period, whichever is longer, so 120 days after a trustee sale and 180 days after a court sale (26 U.S.C. 7425(d); 28 U.S.C. 2410(c)). If the sale didn’t wipe the lien out (the IRS didn’t get the required notice, or the United States wasn’t named in the court case), the lien simply stays on the home. Ask your title company before you renovate.' },
};

// Nevada's Clark County Treasurer lists cash, cashier's check or money order for tax deed and SID sale payments,
// not wire (May 2025 auction notice; Treasurer FAQ).
const NV_FUNDS: SaleDoc = { name: 'Cash, cashier’s check or money order', check: 'The forms the Clark County Treasurer lists for this sale; wire isn’t listed. Confirm them in the current notice, and have the exact amount ready by the payment deadline.' };

export function saleDocsFor(guideKey: string, state: string): SaleDoc[] {
  const kind = saleKindOf(guideKey);
  if (state === 'TX' && TX_DOCS[kind]) return TX_DOCS[kind];
  const nvFunds = state === 'NV' && (kind === 'deed' || kind === 'sid');
  const docs = SALE_DOCS[kind].filter((d) => state === 'NV' || !/super-priority/.test(d.name)).map((d) => (nvFunds && d === FUNDS ? NV_FUNDS : d));
  const deed = kind === 'hoa' ? HOA_DEED[state] : undefined;
  return deed ? docs.map((d) => (/^Certificate of sale, then the deed/.test(d.name) ? deed : d)) : docs;
}

const TX_SCRIPTS: Partial<Record<SaleKindKey, SaleScript[]>> = {
  deed: [
    { to: 'The sheriff’s or constable’s office running the sale', script: OFFICIAL_ASK },
    { to: 'County tax assessor-collector', script: '“I plan to bid at the [month] tax sale. How do I request the statement that I owe no delinquent taxes, what does it cost, and how long does it take?”' },
    { to: 'Title company', script: '“I’m considering bidding on the property in tax suit [cause number] at the [date] sale. Which liens and interests would survive, which redemption period applies, and when would you insure the title?”' },
  ],
  hoa: [
    { to: 'The HOA’s attorney or trustee (from the notice)', script: '“I’m interested in the sale for [property] on [date]. Is it still scheduled? Is the property in a subdivision or a condominium under the declaration, what’s the opening bid, and what form of funds do you need?”' },
    { to: 'Title company', script: '“Which loans and liens would survive this HOA sale, which redemption rule applies, and when would you insure the title?”' },
  ],
  sheriff: [{ to: 'The sheriff’s or constable’s civil section', script: '“I’m interested in the execution sale in case [number] on [date]. Is it still scheduled? What form of payment do you need, when is it due, and what deed will the buyer receive?”' }],
  short: [{ to: 'Your agent (to ask the listing agent)', script: '“Has every lienholder received the seller’s package? How many liens are there, how long has the file been open, and is a foreclosure sale posted? If one is, who is confirming in writing that it will be called off?”' }],
};

/** The words to use for one guide, with Texas's offices where they differ. */
export function saleScriptsFor(guideKey: string, state: string): SaleScript[] {
  const kind = saleKindOf(guideKey);
  // Utah's tax sale is run by the county auditor (Davis County: the Controller), not the treasurer (Utah Code 59-2-1351(1)).
  if (state === 'UT' && kind === 'deed')
    return SALE_SCRIPTS.deed.map((x, i) => (i === 0 ? { ...x, to: 'County auditor’s tax sale office (Davis County: the Controller)' } : x));
  return (state === 'TX' && TX_SCRIPTS[kind]) || SALE_SCRIPTS[kind];
}
