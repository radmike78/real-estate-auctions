// Texas lines for the state pages (src/lib/states/*): one export per map, added under each map's TX key.
// Every line names its state, and cites its source (checked 2026-10-05): Texas statutes (statutes.capitol.texas.gov),
// the Texas Rules of Civil Procedure, TREC forms 20-19 and 45-2, TDI, the Comptroller, HUD/CFPB and IRS Pub. 4681.
import type { StateLine } from '../../components/ByState';

// Official statute links (the site's /Docs/ routes open the section in its viewer).
const TX = (code: string, chapter: string, section: string) =>
  `https://tcss.legis.texas.gov/resources/${code}/htm/${code}.${chapter}.htm#${section}`;

// ───────────────────────────────────────────────────────────────────────────────────────────────
// src/lib/states/homeownerHelp.ts
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** homeownerHelp.ts → HELP, key TX */
export const TX_HOMEOWNER_HELP: StateLine[] = [
  { topic: 'Free legal help', text: 'In Texas, three legal aid groups each cover part of the state: Texas RioGrande Legal Aid (68 counties in central and southwest Texas), Lone Star Legal Aid (based in Houston; toll free (800) 733-8394) and Legal Aid of NorthWest Texas (114 counties in North and West Texas; 1-888-529-5277). Each site shows which counties it serves. TexasLawHelp.org explains the foreclosure process in plain English.', links: [['Texas RioGrande Legal Aid', 'https://www.trla.org/'], ['Lone Star Legal Aid', 'https://www.lonestarlegal.org/'], ['Legal Aid of NorthWest Texas', 'https://legalaidtx.org/'], ['Foreclosure Fact Sheet (TexasLawHelp.org)', 'https://texaslawhelp.org/article/foreclosure-fact-sheet']] },
  { topic: 'Housing counselor', text: 'In Texas, a HUD-approved housing counselor can help you talk to your servicer about a repayment plan, a loan modification or a short sale, usually for free. Call HUD’s line at (800) 569-4287, or search the CFPB’s list of HUD-approved agencies by ZIP code.', links: [['Find a housing counselor (CFPB, HUD-approved list)', 'https://www.consumerfinance.gov/find-a-housing-counselor/']] },
  { topic: 'Homeowner Assistance Fund', text: 'In Texas, the state’s Homeowner Assistance Fund (TXHAF), run by the Texas Department of Housing and Community Affairs (TDHCA), closed on April 15, 2025 and no longer helps homeowners. TDHCA’s Help for Texans page lists the help it still offers. If you have a VA loan, TDHCA points you to VA’s housing assistance.', links: [['Help for Texans (TDHCA)', 'https://www.tdhca.texas.gov/help-for-texans'], ['TXHAF program status (TDHCA)', 'https://www.tdhca.texas.gov/homeowner-assistance-fund-haf-program']] },
  { topic: 'Putting off property taxes', text: 'In Texas, if you are 65 or older, disabled, or qualify for the disabled veteran exemption, you can put off paying property taxes on the home you live in by filing a tax deferral affidavit (Comptroller Form 50-126) with your county appraisal district. Taxes still add up at 5% a year, but the taxing units can’t sue or sell the home for them while you own it and live there. If a suit is already filed, file the affidavit in that court; if a tax sale is set, deliver it at least 5 days before the sale (Tax Code 33.06).', links: [['Property tax payment options (Texas Comptroller)', 'https://comptroller.texas.gov/taxes/property-tax/pay/options.php'], ['Tax Code 33.06', TX('TX', '33', '33.06')]] },
  { topic: 'Homestead exemption', text: 'In Texas, a homestead exemption lowers the taxes on the home you live in. School districts must exempt $140,000 of its value, plus another $60,000 if you are 65 or older or disabled (Tax Code 11.13). Apply once with your county appraisal district (Comptroller Form 50-114).', links: [['Property tax exemptions (Texas Comptroller)', 'https://comptroller.texas.gov/taxes/property-tax/exemptions/']] },
];

/** homeownerHelp.ts → DEADLINES, key TX */
export const TX_HOMEOWNER_DEADLINES: StateLine[] = [
  { topic: 'When foreclosure can start', text: 'In Texas, as in every state, most servicers can’t start a foreclosure until you are more than 120 days behind (12 CFR 1024.41(f)). If you send a complete application for help more than 37 days before a scheduled sale, the servicer must decide on it before it can sell (12 CFR 1024.41(c), (g)).', links: [['12 CFR 1024.41 (eCFR)', 'https://www.ecfr.gov/current/title-12/chapter-X/part-1024/subpart-C/section-1024.41']] },
  { topic: 'How foreclosure works', text: 'In Texas, most home loans use a deed of trust, so the trustee can sell the home without a court case. If you live in the home, your servicer must first send you a notice of default by certified mail and give you at least 20 days to catch up before a notice of sale can be given (Property Code 51.002(d)).', links: [['Property Code 51.002', TX('PR', '51', '51.002')]] },
  { topic: 'Notice of sale', text: 'In Texas, the notice of sale must be given at least 21 days before the sale: posted at the courthouse door, filed with the county clerk, and mailed to you by certified mail (Property Code 51.002(b)). The sale is held on the first Tuesday of the month, between 10 a.m. and 4 p.m., at the courthouse or a place the county has chosen (Property Code 51.002(a), (h)).' },
  { topic: 'Court order first', text: 'In Texas, a home equity loan, a reverse mortgage, a property tax loan or a subdivision HOA’s lien can’t be foreclosed by a trustee until a court signs an order allowing it. You get court papers and a chance to answer first (Texas Rules of Civil Procedure 735 and 736).' },
  { topic: 'The rest of the loan', text: 'In Texas, after a trustee’s sale, a lender that wants the rest of the loan (a deficiency) must sue within 2 years. You can ask the court to find the home’s fair market value on the sale day, and if that is higher than the sale price, the difference comes off what you owe (Property Code 51.003).' },
  { topic: 'Late property taxes', text: 'In Texas, property taxes become late if not paid before February 1 (Tax Code 31.02). If you have a homestead exemption, the tax office must give you a monthly payment plan of 12 to 36 months if you ask and haven’t had one in the last 24 months. While you keep to it, the home can’t be sold or sued on for those taxes (Tax Code 33.02). Tell your servicer at least 10 days before you sign, so it can’t treat the late taxes as a default on your mortgage (Property Code 51.0011).' },
  { topic: 'Buying back after a tax sale', text: 'In Texas, if your home is sold at a tax sale, you can buy it back (redeem) within 2 years after the buyer’s deed is recorded if it was your homestead or land designated for agricultural use (or the sale was of a mineral interest), or within 180 days otherwise. You pay what the buyer paid, plus costs and a premium: for a homestead, agricultural land or mineral interest, 25% in the first year or 50% in the second; for other property, no more than 25% (Tax Code 34.21).' },
  { topic: 'Money left over', text: 'In Texas, if a tax sale brings more than was owed, the extra money (excess proceeds) goes to the court clerk. You have 2 years from the sale to file a claim in that court case (Tax Code 34.03, 34.04). After a mortgage foreclosure, ask the trustee named on the notice of sale about any money left over.', links: [['Tax Code 34.04', TX('TX', '34', '34.04')]] },
  { topic: 'HOA foreclosure', text: 'In Texas, a subdivision HOA can’t foreclose for fines alone, and it must get a court order first (Property Code 209.009, 209.0092). One with more than 14 lots must usually offer a payment plan of at least 3 months, with some exceptions, such as if you broke a plan in the last 2 years (Property Code 209.0062). After its foreclosure sale, you can buy the home back within 180 days after the HOA mails you notice of the sale (Property Code 209.011). If your home is a condominium, chapter 82 applies instead: the association can’t foreclose for fines alone, and you can buy the unit back within 90 days after the sale (Property Code 82.113). Your recorded declaration says which applies.' },
];

/** homeownerHelp.ts → SCAMS, key TX */
export const TX_HOMEOWNER_SCAMS: StateLine[] = [
  { topic: 'Foreclosure consultants', text: 'In Texas, a “foreclosure consultant” paid to stop or delay your sale must give you a written, dated contract and a notice in bold type saying they can’t have you sign over any interest in your home and you can cancel at any time. They can’t charge until all the work is done (unless bonded), take a power of attorney except to look at documents, or take an interest in your property (Business and Commerce Code 21.051, 21.052, 21.101, 21.102). Breaking these rules is a crime (Business and Commerce Code 21.151).', links: [['Business and Commerce Code chapter 21', 'https://tcss.legis.texas.gov/resources/BC/htm/BC.21.htm']] },
  { topic: 'Money-left-over helpers', text: 'In Texas, after a tax sale, only an attorney may charge you to get your excess proceeds, and the fee can’t be more than 25% or $1,000, whichever is less. Anyone buying your claim can’t do it until 36 days after the money reaches the court, can’t find you through an in-person or phone pitch, and must pay you at least 80% of it (Tax Code 34.04(f), (i)).' },
  { topic: 'Mortgage relief companies', text: 'In Texas, federal law bars mortgage relief companies from charging you before you sign a modification or other deal with your lender. Report scams to the Texas Attorney General’s Consumer Protection Division.', links: [['Loan and mortgage scams (Texas AG)', 'https://www.texasattorneygeneral.gov/consumer-protection/financial-and-insurance-scams/loan-and-mortgage-scams'], ['File a consumer complaint (Texas AG)', 'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint']] },
];

/** homeownerHelp.ts → TENANTS, key TX */
export const TX_HOMEOWNER_TENANTS: StateLine[] = [
  { topic: 'Tenants after a foreclosure', text: 'In Texas, if the building you rent is sold at a foreclosure sale under a loan or lien that came before your lease (a property tax lien always does) and you are paid up and not otherwise in default, the buyer must give you at least 30 days’ written notice to move if it won’t keep your lease (Property Code 24.005(b)). Federal law may give you longer, and the buyer can’t have you removed until that time has run (Property Code 24.005(c-1)).' },
];

// ───────────────────────────────────────────────────────────────────────────────────────────────
// src/lib/states/preForeclosure.ts
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** preForeclosure.ts → TIMELINE, key TX (rendered as an ordered list) */
export const TX_PRE_TIMELINE: StateLine[] = [
  { text: 'In Texas, missed payments: the servicer sends its own letters. For most loans, it can’t take the first step toward foreclosure until the owner is more than 120 days behind (12 CFR 1024.41(f)). Nothing is recorded yet.' },
  { text: 'In Texas, notice of default: for a home the owner lives in, the servicer mails it by certified mail and gives at least 20 days to catch up (Property Code 51.002(d)). It isn’t recorded or posted, so buyers don’t see it.' },
  { text: 'In Texas, notice of sale: at least 21 days before the sale, it is posted at the courthouse door, filed with the county clerk and mailed to the owner (Property Code 51.002(b)). The county must also post it on its website (Property Code 51.002(f-1)).' },
  { text: 'In Texas, auction: held on the first Tuesday of the month (the first Wednesday if that Tuesday is January 1 or July 4), between 10 a.m. and 4 p.m., in the area the county has chosen at or near the courthouse. It starts at the time in the notice or within 3 hours after (Property Code 51.002(a), (c), (h)). It can be postponed or cancelled.' },
  { text: 'In Texas, 15 days after: for a 1 to 4 unit home, the trustee or lender can undo (rescind) the sale for listed reasons, such as a missed legal step, a cure before the sale or a bankruptcy stay, and must return the winning bid within 5 days after rescinding (Property Code 51.016).' },
];

/** preForeclosure.ts → TIMELINE_NOTES, key TX */
export const TX_PRE_TIMELINE_NOTES: StateLine[] = [
  { text: 'In Texas, home equity loans, reverse mortgages, property tax loans and subdivision HOA liens need a court order before the trustee’s sale, which adds weeks to months (Texas Rules of Civil Procedure 735, 736). Some lenders foreclose by a full court case instead, ending in a sheriff’s or constable’s sale.' },
];

/** preForeclosure.ts → WHERE, key TX */
export const TX_PRE_WHERE: StateLine[] = [
  { text: 'In Texas, the county clerk keeps every filed notice of sale in a public file until the sale date, and the county must post each one online with the sale’s date, time and place (Property Code 51.002(f), (f-1)). In Harris County, search the County Clerk’s foreclosure notices. In Dallas County, see the County Clerk’s foreclosure notices page. Other counties post them on the clerk’s or county’s website.', links: [['Foreclosure notices (Harris County Clerk)', 'https://www.cclerk.hctx.net/Applications/WebSearch/FRCL_R.aspx'], ['Find foreclosure notices (Dallas County Clerk)', 'https://www.dallascounty.org/government/county-clerk/recording/foreclosures.php'], ['Property Code 51.002', TX('PR', '51', '51.002')]] },
  { text: 'In Texas, a lis pendens is a notice, filed with the county clerk, that a lawsuit over a property’s title or a lien on it is pending. It names the court, the case number, the parties and the property (Property Code 12.007). You’ll see one in court foreclosures, not in most trustee’s sales. Search the clerk’s real property records for it.' },
];

/** preForeclosure.ts → BUY, key TX */
export const TX_PRE_BUY: StateLine[] = [
  { text: 'In Texas, at the trustee’s sale, the trustee can set reasonable conditions, such as how you must pay, if it announces them before bidding opens (Property Code 51.0075(a)). The price is due right away when your bid is accepted, unless the trustee agrees to a short delay (Property Code 51.0075(f)). Bring funds in the form the trustee requires.' },
  { text: 'In Texas, you buy at a trustee’s sale “as is,” with no warranties except of title, and at your own risk (Property Code 51.009). The sale can be rescinded within 15 days in some cases (Property Code 51.016). There is no right to buy the home back after a mortgage trustee’s sale, but there is after a subdivision HOA sale (180 days after the HOA mails notice, Property Code 209.011), a condominium association sale (90 days, 82.113) and a tax sale (Tax Code 34.21).' },
  { text: 'In Texas, after the sale (bank-owned): if no one outbids the lender, the lender owns the home and usually lists it with an agent. Tenants who are paid up get at least 30 days’ written notice from any buyer that won’t keep their lease (Property Code 24.005(b)). Federal law can require more: after a foreclosure, a tenant with a genuine lease or rental gets at least 90 days’ notice, or the rest of the lease unless the buyer will live there (Protecting Tenants at Foreclosure Act).' },
];

/** preForeclosure.ts → READ_NOTICE, key TX */
export const TX_PRE_READ_NOTICE: StateLine[] = [
  { text: 'In Texas, the notice names the county where the sale will be held and the earliest time it will begin (Property Code 51.002(b)), the area of the courthouse if the county hasn’t chosen one (Property Code 51.002(a)), and the trustee’s or substitute trustee’s name and street address (Property Code 51.0075(e)). Many notices also appoint the substitute trustee in a paragraph in capital letters (Property Code 51.0076).', links: [['Property Code 51.0075', TX('PR', '51', '51.0075')]] },
];

/** preForeclosure.ts → NO_CONTACT, key TX */
export const TX_PRE_NO_CONTACT: StateLine[] = [
  { text: 'In Texas, once a notice of sale is filed on a 1 to 4 unit home the owner lives in, anyone paid to help the owner stop the sale, catch up or get leftover sale money is a “foreclosure consultant.” They need a written contract with a bold notice, can’t charge before the work is done unless bonded, and can’t take an interest in the home. A violation is a crime (Business and Commerce Code 21.001, 21.052, 21.101, 21.102, 21.151). After a tax sale, buying an owner’s claim to excess proceeds through an in-person or phone pitch is not allowed (Tax Code 34.04(f)).' },
];

// ───────────────────────────────────────────────────────────────────────────────────────────────
// src/lib/states/shortSales.ts
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** shortSales.ts → DEFICIENCY, key TX */
export const TX_SHORT_DEFICIENCY: StateLine[] = [
  { text: 'In Texas, the 2-year deadline and fair-market-value credit on suing for the rest of the loan apply only after a foreclosure sale (Property Code 51.003, 51.004, 51.005). We found no Texas statute that does the same for a short sale. So unless the lender agrees in writing to accept the sale money in full, the seller may still owe the difference. Sellers should ask an attorney.', links: [['Property Code 51.003', TX('PR', '51', '51.003')]] },
  { text: 'In Texas, the state’s Short Sale Addendum (TREC No. 45-2) makes the deal depend on each lender agreeing to accept the seller’s net proceeds in full satisfaction of the loan and to release its lien. If that isn’t in hand by the date in the addendum, the contract ends and your earnest money comes back.', links: [['Short Sale Addendum, TREC No. 45-2', 'https://www.trec.texas.gov/forms/short-sale-addendum-0']] },
];

/** shortSales.ts → DISCLOSURES, key TX */
export const TX_SHORT_DISCLOSURES: StateLine[] = [
  { text: 'In Texas, a short sale is a sale by the owner, so the seller must give you the Seller’s Disclosure Notice for a single-family home. The exemptions cover foreclosure sales and lenders reselling after foreclosure, not short sales (Property Code 5.008). Agents use TREC’s One to Four Family Residential Contract (Resale) (TREC No. 20-19) with the Short Sale Addendum.', links: [['Property Code 5.008', TX('PR', '5', '5.008')], ['TREC No. 20-19', 'https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale']] },
];

/** shortSales.ts → NOTES, key TX */
export const TX_SHORT_NOTES: StateLine[] = [
  { text: 'In Texas, the trustee’s sale can still go ahead on the first Tuesday while a short sale waits for approval. Ask the listing agent for any sale date. Under the addendum, most deadlines restart from the day the seller tells you the lender approved. Your option period doesn’t restart; it runs from the original contract date (TREC No. 45-2, D and F).' },
  { text: 'In Texas, there is no state income tax, but the federal tax break for forgiven debt on a main home (qualified principal residence indebtedness) ended for debt forgiven after 2025, unless it was agreed in writing before January 1, 2026 (IRS Publication 4681). This is the seller’s issue; sellers should ask a tax professional.', links: [['IRS Publication 4681', 'https://www.irs.gov/publications/p4681']] },
];

/** shortSales.ts → OWNERS, key TX */
export const TX_SHORT_OWNERS: StateLine[] = [
  { text: 'In Texas, offering paid help to stop an owner’s foreclosure on a home they live in makes you a foreclosure consultant (licensed real estate agents acting as agents and attorneys are among the exceptions, unless the deal moves the title to them). A consultant can’t take payment up front unless bonded or take an interest in the home, and a violation is a crime (Business and Commerce Code 21.002, 21.101, 21.102, 21.151).', links: [['Business and Commerce Code chapter 21', 'https://tcss.legis.texas.gov/resources/BC/htm/BC.21.htm']] },
];

// ───────────────────────────────────────────────────────────────────────────────────────────────
// src/lib/states/bankOwned.ts
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** bankOwned.ts → BUYING, key TX */
export const TX_REO_BUYING: StateLine[] = [
  { text: 'In Texas, a lender reselling a home it got at a foreclosure sale or by a deed in lieu, and a government agency selling a home, don’t have to give you the Seller’s Disclosure Notice (Property Code 5.008(e)). Ask the listing agent what the bank knows, and get your own inspection.', links: [['Property Code 5.008', TX('PR', '5', '5.008')]] },
  { text: 'In Texas, agents must use TREC’s contract forms, such as the One to Four Family Residential Contract (Resale), TREC No. 20-19 (effective July 1, 2026). For a condo, agents use TREC’s condominium resale contract instead. Owners, including banks, can require their own attorney-drafted forms, and federal agencies can require theirs (22 Texas Administrative Code 537.11). Bank and HUD addenda usually override parts of the TREC contract, so read every one before you sign.', links: [['TREC No. 20-19', 'https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale']] },
  { text: 'In Texas, the TREC contract’s option period is your exit. You pay a small option fee, and until 5 p.m. on the last day of the period you can end the contract for any reason. You lose the option fee but get your earnest money back (TREC No. 20-19, paragraph 5). Banks often shorten or remove it in their addendum.' },
  { text: 'In Texas, under the TREC contract you can accept the home “As Is,” which still lets you inspect it and end the contract during the option period (TREC No. 20-19, paragraph 7D). Homes built before 1978 come with the federal lead-based paint disclosure (paragraph 7C).' },
  { text: 'In Texas, title insurance premiums are set by the Texas Department of Insurance, so every title company charges the same premium for the same policy. Under the TREC contract, the seller gets you a title commitment within 20 days after the title company receives the contract (TREC No. 20-19, paragraph 6).', links: [['What is title insurance? (TDI)', 'https://www.tdi.texas.gov/tips/title-insurance.html']] },
  { text: 'In Texas, HUD, Fannie Mae (HomePath), Freddie Mac (HomeSteps), VA and USDA sell their homes the same way they do nationwide, so their source cards (under Fannie Mae & Freddie Mac, and Government agencies) apply. HUD homes need a HUD-registered broker to bid for you.', links: [['HUD homes in Texas (HUD Home Store)', 'https://www.hudhomestore.gov/searchresult?citystate=TX']] },
];


// ───────────────────────────────────────────────────────────────────────────────────────────────
// src/lib/states/businessAssets.ts
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** businessAssets.ts → SELLERS, key TX */
export const TX_BIZ_SELLERS: StateLine[] = [
  { text: 'In Texas, bankruptcy cases are in 4 federal districts: Northern, Southern, Eastern and Western. Sales outside the ordinary course of business need notice and usually a court order (11 U.S.C. 363). U.S. Trustee Region 6 covers the Northern and Eastern Districts, and Region 7 the Southern and Western.', links: [['Northern District', 'https://www.txnb.uscourts.gov/'], ['Southern District', 'https://www.txs.uscourts.gov/page/bankruptcy-court'], ['Eastern District', 'https://www.txeb.uscourts.gov/'], ['Western District', 'https://www.txwb.uscourts.gov/'], ['U.S. Trustee Region 6', 'https://www.justice.gov/ust/ust-regions-r06'], ['Region 7', 'https://www.justice.gov/ust/ust-regions-r07']] },
  { text: 'In Texas, a state court can appoint a receiver, for example for a corporation that is insolvent or dissolved, or for property in danger of being lost (Civil Practice and Remedies Code 64.001). The receiver acts under the court’s control and sells only as the court allows (Civil Practice and Remedies Code 64.031). The court file names the receiver.', links: [['Civil Practice and Remedies Code chapter 64', 'https://tcss.legis.texas.gov/resources/CP/htm/CP.64.htm']] },
  { text: 'In Texas, a struggling business can assign its property to an assignee for the benefit of its creditors. The assignment must be recorded, and the assignee must be bonded and publish notice of the appointment once a week for 3 weeks in a local newspaper (Business and Commerce Code 23.08, 23.16, 23.17). Deal only with the assignee.' },
  { text: 'In Texas, a sheriff or constable sells property seized to pay a court judgment. Personal property, such as equipment, is sold after notice is posted for 10 days at the courthouse door and where the sale will be. Real property is sold on the first Tuesday of the month after 3 weeks of newspaper notice (Texas Rules of Civil Procedure 646a, 647, 649, 650). A winning bidder who doesn’t pay can owe 20% of the property’s value (Rule 652).' },
];

/** businessAssets.ts → BUYING, key TX */
export const TX_BIZ_BUYING: StateLine[] = [
  { text: 'In Texas, if you buy a business or its stock of goods, hold back enough of the price to pay the seller’s state taxes until the seller gives you a receipt from the Comptroller or a certificate saying nothing is due. If you don’t, you can owe those taxes, up to the purchase price (Tax Code 111.020). Seller and buyer request the certificate together on Form 86-114, before closing. The Comptroller must answer within 60 days of the request or of getting the seller’s records, and never later than 90 days; if it doesn’t, you are released (Tax Code 111.020(c), (d)).', links: [['Buying an existing business (Texas Comptroller)', 'https://comptroller.texas.gov/taxes/publications/98-117.php'], ['Tax Code 111.020', TX('TX', '111', '111.020')]] },
  { text: 'In Texas, check the seller first. The Comptroller’s Taxable Entity Search shows a company’s franchise tax status. The Secretary of State’s SOSPortal (formerly SOSDirect) shows its filings and registered agent, for $1 per search.', links: [['Taxable Entity Search (Texas Comptroller)', 'https://comptroller.texas.gov/taxes/franchise/account-status/search'], ['SOSPortal business search (Texas Secretary of State)', 'https://www.sos.state.tx.us/corp/sosda/index.shtml']] },
  { text: 'In Texas, lenders file UCC financing statements on equipment and inventory with the Secretary of State, and fixture filings with the county (Business and Commerce Code 9.501). For a company organized in another state, search that state too. We found no bulk sales chapter in Texas’s current Business and Commerce Code, so do your own lien and tax searches.', links: [['UCC (Texas Secretary of State)', 'https://www.sos.state.tx.us/ucc/index.shtml']] },
];

/** businessAssets.ts → NOTICES, key TX */
export const TX_BIZ_NOTICES: StateLine[] = [
  { text: 'In Texas, bankruptcy sales are on the bankruptcy court docket (PACER).' },
  { text: 'In Texas, receiver sales are in the state court case file in the county where the case is filed. Assignments for the benefit of creditors are recorded with the county clerk and published in a local newspaper (Business and Commerce Code 23.16, 23.17). Ask the receiver or assignee.' },
  { text: 'In Texas, sheriff’s and constable’s sales of personal property are posted for 10 days at the courthouse door and where the sale will be (Texas Rules of Civil Procedure 650). Many sheriff’s and constable’s offices list sales online.' },
];

// businessAssets.ts → NEVADA_ONLY_SOURCES: no change (it lists Nevada-only cards; nothing Texas-specific goes there).
