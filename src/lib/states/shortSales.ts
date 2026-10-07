// Short sales, state by state: deficiency after a short sale, disclosures, state notes, and the "don't contact
// homeowners" rule. Every line names its state.
// Sources: each line's citation, read on the state's official code site (checked 2026-10-04).
import type { ByStateLines } from '../../components/ByState';
import { TX_SHORT_DEFICIENCY, TX_SHORT_DISCLOSURES, TX_SHORT_NOTES, TX_SHORT_OWNERS } from './texas';

/** Could the seller still owe the lender afterward (a deficiency)? */
export const DEFICIENCY: ByStateLines = {
  NV: [
    { text: 'In Nevada, a bank or credit union that agrees to a short sale of a single-family home can’t get a deficiency judgment if the owner bought the home with that loan and lived in it as their main home, and the signed short-sale agreement waives the rest of the debt and states the amount waived (NRS 40.458).*', links: [['NRS chapter 40', 'https://www.leg.state.nv.us/NRS/NRS-040.html']] },
    { text: 'In Nevada, a financial institution holding a second loan used to buy such a home, and never refinanced, can’t sue the owner for it after the short sale (NRS 40.4638). Other second-lien holders must sue within 6 months (NRS 40.4639).*' },
    { text: 'In Nevada, this is the seller’s question, not the buyer’s. It can still slow a deal down, so read the approval letter’s terms and deadlines with your agent.' },
  ],
  CA: [
    { text: 'In California, after a lender gives written consent to a short sale of a home of up to 4 units, it can’t collect the rest of the loan (a deficiency). The deed must be recorded and the sale money paid to the lender as agreed. This covers first loans, and second loans whose holders consent. It doesn’t apply when the borrower is a corporation, LLC or limited partnership, or when there was fraud or waste (Code of Civil Procedure 580e).', links: [['Code of Civil Procedure 580e', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=580e']] },
    { text: 'In California, a lender can’t ask the seller for more money as a condition of approving the short sale (Code of Civil Procedure 580e).' },
  ],
  AZ: [
    { text: 'In Arizona, the main anti-deficiency law protects owners after a trustee’s sale: no deficiency suit can follow when qualifying property is sold under the trustee’s power of sale (A.R.S. 33-814(G)). A short sale is a voluntary sale, not a trustee’s sale.', links: [['A.R.S. 33-814', 'https://www.azleg.gov/ars/33/00814.htm']] },
    { text: 'In Arizona, whether the seller still owes after a short sale depends on what the lender’s approval letter says. Some lenders release the remaining debt in writing. Others reserve the right to collect it. Sellers should have an Arizona attorney read the approval letter before signing, and a tax professional review the tax side.' },
    { text: 'In Arizona, this is the seller’s question, not the buyer’s. It can still delay or end a deal, so expect the seller’s side to negotiate it.' },
  ],
  UT: [
    { text: 'In Utah, the 3-month deadline and fair-market-value limit on suing for the rest of the loan apply only after a trustee’s sale (Utah Code 57-1-32). We found no Utah statute that does the same for a short sale. So unless the lender agrees in writing to waive it, the seller may still owe the difference. Sellers should ask an attorney.', links: [['Utah Code 57-1-32', 'https://le.utah.gov/xcode/Title57/Chapter1/57-1-S32.html']] },
    { text: 'In Utah, a lender generally has 6 years to sue on a written contract such as a promissory note (Utah Code 78B-2-309). This is the seller’s risk, but it’s why short-sale approvals can be slow and full of conditions. As a buyer, read the approval letter’s terms and deadlines with your agent.', links: [['Utah Code 78B-2-309', 'https://le.utah.gov/xcode/Title78B/Chapter2/78B-2-S309.html']] },
  ],
  TX: TX_SHORT_DEFICIENCY,
};

/** What the seller must tell you, and what you get. */
export const DISCLOSURES: ByStateLines = {
  NV: [
    { text: 'In Nevada, the seller (the homeowner, in a short sale) must complete the Seller’s Real Property Disclosure form and give it to you at least 10 days before the home is conveyed, and you can’t be made to waive it. Only a trustee’s foreclosure sale (NRS 107) and a few other listed sales are exempt (NRS 113.130).', links: [['NRS chapter 113', 'https://www.leg.state.nv.us/NRS/NRS-113.html']] },
  ],
  CA: [
    { text: 'In California, a short sale is a normal sale by the owner, so it isn’t exempt from the Transfer Disclosure Statement or the Natural Hazard Disclosure Statement. Those exemptions cover sales by a lender after foreclosure, not short sales (Civil Code 1102.2, 1103.1).', links: [['Civil Code 1102.2', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.2']] },
    { text: 'In California, the listing agent must also do a visual inspection of a home of 1 to 4 units and disclose what it finds (Civil Code 2079).' },
  ],
  AZ: [
    { text: 'In Arizona, if the home is in an HOA, you get the HOA’s documents within about 10 days after your offer is accepted (in communities of 50 or more homes, 10 days after the HOA gets the seller’s notice), such as the rules, the budget, the fees owed and any pending lawsuits. In larger communities the HOA sends them; in communities under 50 homes, the seller does (A.R.S. 33-1806; condominiums, A.R.S. 33-1260).', links: [['A.R.S. 33-1806', 'https://www.azleg.gov/ars/33/01806.htm'], ['A.R.S. 33-1260', 'https://www.azleg.gov/ars/33/01260.htm']] },
    { text: 'In Arizona, if the home or land isn’t in a recorded subdivision and is in an unincorporated area of a county, the seller (of up to five parcels) must give you an affidavit of disclosure at least 7 days before the transfer. You then have 5 days after you get it to cancel (A.R.S. 33-422).', links: [['A.R.S. 33-422', 'https://www.azleg.gov/ars/33/00422.htm']] },
  ],
  UT: [
    { text: 'In Utah, licensed agents use the state-approved Real Estate Purchase Contract (REPC). Short-sale terms go in an addendum.', links: [['Real Estate Purchase Contract (Utah Division of Real Estate)', 'https://commerce.utah.gov/wp-content/uploads/2023/03/purchase-contract.pdf']] },
  ],
  TX: TX_SHORT_DISCLOSURES,
};

/** Other things that differ by state: other liens, foreclosure timing, closing deadlines. */
export const NOTES: ByStateLines = {
  CA: [
    { text: 'In California, every lienholder, including a second loan or an HOA, has to agree to release its lien for the sale to close. A second lender that consents can’t later collect the shortfall either (Code of Civil Procedure 580e). Your title report shows every lien that needs a release.' },
    { text: 'In California, the trustee sale can still go ahead while a short sale is pending. For a 1 to 4 unit home, the law requires one 45-day postponement if the owner sends the trustee a listing agreement at least 5 business days before the sale (Civil Code 2924f(e)). A second postponement is only for a purchase agreement that pays off everything recorded against the home, so a short sale doesn’t qualify for it. Ask the listing agent for the sale date and whether it has been postponed.' },
  ],
  UT: [
    { text: 'In Utah, the lender’s approval can come with a firm closing deadline. Keep your financing ready.' },
  ],
  TX: TX_SHORT_NOTES,
};

/** Don't contact homeowners: the state law that applies. Each ends by pointing buyers to agents and the tracker (on the page). */
export const OWNERS: ByStateLines = {
  NV: [
    { text: 'In Nevada, foreclosure consultants must be licensed, and a buyer who uses fraud or deceit on an owner in foreclosure faces criminal penalties and can have the purchase undone (NRS Chapter 645F).', links: [['NRS Chapter 645F', 'https://www.leg.state.nv.us/NRS/NRS-645F.html']] },
  ],
  CA: [
    { text: 'In California, an investor (any buyer who won’t live in it) buying a 1 to 4 unit home from an owner who lives there after a notice of default is recorded is covered by the Home Equity Sales Contract Act. It requires a written contract and gives the owner a right to cancel, and breaking it carries fines and jail (Civil Code 1695 and following).', links: [['Civil Code 1695.1', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.1']] },
  ],
  AZ: [
    { text: 'In Arizona, most people who offer paid help to stop an owner’s foreclosure are foreclosure consultants (attorneys and the lender or servicer are among the exceptions). A consultant can’t take payment up front or take an interest in the home, and fraud or deceit against the owner is a class 1 misdemeanor (A.R.S. 44-1378.02, 44-1378.06).', links: [['A.R.S. 44-1378.02', 'https://www.azleg.gov/ars/44/01378-02.htm']] },
  ],
  UT: [
    { text: 'In Utah, offering a paid deal on an owner’s title to “stop” their foreclosure is regulated foreclosure rescue. It needs a real estate license and a written agreement, and certain deals are banned (Utah Code 61-2f-102, 61-2f-401).', links: [['Utah Code 61-2f-401', 'https://le.utah.gov/xcode/Title61/Chapter2F/61-2f-S401.html']] },
  ],
  TX: TX_SHORT_OWNERS,
};
