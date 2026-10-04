// Business assets & closures, state by state: who the official sellers are, what to check before buying
// assets or a whole business, and where sales are noticed. Every line names its state.
// Links go only to official sellers and government sites (courts, the U.S. Trustee, Secretaries of State); see CLAUDE.md.
// Sources: each line's citation, read on the state's official code or court-rules site (checked 2026-10-04).
import type { ByStateLines } from '../../components/ByState';

/** Who sells a struggling or closed business's property, by state. */
export const SELLERS: ByStateLines = {
  NV: [
    { text: 'In Nevada, bankruptcy cases are in the U.S. Bankruptcy Court for the District of Nevada. Trustees sell equipment, inventory, vehicles, real estate and whole businesses, with court approval.', links: [['U.S. Bankruptcy Court, District of Nevada', 'https://www.nvb.uscourts.gov/']] },
    { text: 'In Nevada, receiverships are state court cases, where a court-appointed receiver runs or sells a business or its property. Receiver sales usually need court approval. In Clark County, search the Eighth Judicial District Court’s case portal, then contact the receiver.', links: [['Eighth Judicial District Court portal', 'https://www.clarkcountycourts.us/portal/']] },
    { text: 'In Nevada, the sheriff sells business property seized under a writ of execution to pay a court judgment (NRS Chapter 21). Property is sold as-is.', links: [['Clark County Sheriff: civil section', 'https://www.clarkcountynv.gov/government/departments/sheriff_civil/']] },
  ],
  CA: [
    { text: 'In California, bankruptcy cases are in 4 federal districts: Central, Eastern, Northern and Southern. Sales of a debtor’s assets need court approval (11 U.S.C. 363). U.S. Trustee Regions 15, 16 and 17 cover California.', links: [['Central District', 'https://www.cacb.uscourts.gov/'], ['Eastern District', 'https://www.caeb.uscourts.gov/'], ['Northern District', 'https://www.canb.uscourts.gov/'], ['Southern District', 'https://www.casb.uscourts.gov/'], ['U.S. Trustee Region 15', 'https://www.justice.gov/ust/ust-regions-r15'], ['Region 16', 'https://www.justice.gov/ust/ust-regions-r16'], ['Region 17', 'https://www.justice.gov/ust/ust-regions-r17']] },
    { text: 'In California, a superior court can appoint a receiver, for example when a corporation is insolvent or dissolved, to enforce a judgment, or to protect property (CCP 564). A receiver sells only with a court order, and the sale isn’t final until the court confirms it (CCP 568.5). The court file names the receiver.' },
    { text: 'In California, a struggling business can make an assignment for the benefit of creditors: it transfers all its assets to an assignee, who sells them for all its creditors (CCP 493.010). Deal only with the assignee.' },
    { text: 'In California, the sheriff (the levying officer) sells seized business property to pay a court judgment. For personal property such as equipment or inventory, the sheriff posts a notice at least 10 days before the sale in 3 public places, giving the date, time, place and what’s being sold (CCP 701.530).' },
  ],
  AZ: [
    { text: 'In Arizona, bankruptcy cases are in the U.S. Bankruptcy Court for the District of Arizona. Sales outside the ordinary course of business need court approval (11 U.S.C. 363).', links: [['U.S. Bankruptcy Court, District of Arizona', 'https://www.azb.uscourts.gov/']] },
    { text: 'In Arizona, a superior court can appoint a receiver to protect and preserve property, even when that’s the only thing the case asks for (A.R.S. 12-1241).' },
    { text: 'In Arizona, commercial real estate and related equipment have a separate receivership law. Under it, a receiver may sell outside the ordinary course of business only with court approval. Unless the sale agreement says otherwise, the sale is free and clear of the lien of the creditor who asked for the receiver and of junior liens, but subject to senior liens (A.R.S. 33-2615).' },
    { text: 'In Arizona, a business that can’t pay its debts can sign its property over to an assignee, who sells it and pays creditors. The assignment must be recorded (A.R.S. 44-1031). In 2026, Arizona adopted the Uniform Assignment for Benefit of Creditors Act for assignments made after it took effect. It gives the assignee power to run the business and to sell its assets (A.R.S. 44-601 to 44-625, including 44-609). Deal only with the assignee.' },
    { text: 'In Arizona, before a sheriff sells personal property (other than perishables) to pay a judgment, notice is posted for at least 10 days in a row in three public places, one at or near the courthouse door. The notice names the court, the judgment and the property (A.R.S. 12-1621).' },
  ],
  UT: [
    { text: 'In Utah, bankruptcy cases are in the U.S. Bankruptcy Court for the District of Utah. Sales are noticed in the case and need court approval.', links: [['U.S. Bankruptcy Court, District of Utah', 'https://www.utb.uscourts.gov/']] },
    { text: 'In Utah, a district court can appoint a receiver, for example when a company is insolvent or property is in danger of being lost. The receiver must be neutral. A receiver must pay applicable taxes before selling personal property, and must record the court order with the county recorder before taking real property (Utah Rule of Civil Procedure 66).' },
    { text: 'In Utah, for commercial real estate, the receivership act lets a receiver sell with court approval, usually free of the lien of the creditor who asked for the receiver and of junior liens, but subject to senior liens (Utah Code 78B-21-116). Ask the receiver or check the court case for terms.' },
    { text: 'In Utah, a struggling business can sign its assets over to an assignee, who sells them and pays creditors. The Utah Uniform Assignment for Benefit of Creditors Act took effect May 6, 2026. The assignee can sell assets, even ones subject to liens. It must notify known creditors within 30 days and record the assignment for any real estate (Utah Code 6-2-105, 6-2-106, 6-2-109). Buy from the assignee, not the former owners.' },
    { text: 'In Utah, for a sheriff’s sale of personal property, notice is posted at the courthouse and in 3 other public places for at least 7 days. It is also published once in a local newspaper, if there is one. Every bid is final (Utah Rule of Civil Procedure 69B).' },
  ],
};

/** Taxes, liens and bulk-sale rules that matter when you buy assets or a whole business, by state. */
export const BUYING: ByStateLines = {
  NV: [
    { text: 'In Nevada, if you buy all or part of a business or its stock of goods, other than in the seller’s normal sales, hold back enough of the price until the seller gives you a receipt or certificate from the Department of Taxation. If you don’t, you can owe their unpaid state taxes, up to what you paid (NRS 360.525).', links: [['Nevada Department of Taxation', 'https://tax.nv.gov/']] },
    { text: 'In Nevada, for a Nevada LLC or corporation, lenders file UCC financing statements with the Nevada Secretary of State; for an out-of-state company, in that state (NRS 104.9307).' },
  ],
  CA: [
    { text: 'In California, if you buy a business or its stock of goods, hold back enough of the price to cover the seller’s unpaid sales and use tax. Keep it until the seller shows a receipt from the California Department of Tax and Fee Administration (CDTFA) or a certificate saying nothing is due (R&T Code 6811). If you don’t, you can be personally liable for those taxes, up to the purchase price (R&T Code 6812).' },
    { text: 'In California, ask CDTFA for a tax and fee clearance, online or in writing, before you close. If escrow closes without CDTFA’s Certificate of Payment (CDTFA-471), you may owe what the seller didn’t pay. Ask a CPA about payroll and other state taxes too.' },
    { text: 'In California, a bulk sale law still applies (Commercial Code 6101). It covers a California business that mainly sells inventory, or a restaurant, selling a large part of its inventory and equipment outside the normal course of business, if the assets are worth from $10,000 to $5,000,000 (Commercial Code 6103).' },
    { text: 'In California, under the bulk sale law the buyer must give notice at least 12 business days before the sale. The notice is recorded with the county recorder, published in a local newspaper and sent to the county tax collector (Commercial Code 6105). When the price is $2,000,000 or less and mostly cash, the money usually goes through escrow to pay the seller’s creditors’ claims (Commercial Code 6106.2).' },
    { text: 'In California, the bulk sale law doesn’t apply to sales by a receiver, bankruptcy trustee, debtor in possession or public officer under judicial process. It also doesn’t apply to a general assignment for the benefit of creditors, or to the assignee’s later sale (Commercial Code 6103).' },
    { text: 'In California, lenders file UCC financing statements with the Secretary of State for California-organized businesses.', links: [['UCC search (California Secretary of State)', 'https://bizfileonline.sos.ca.gov/search/ucc']] },
  ],
  AZ: [
    { text: 'In Arizona, if you buy a business or its stock of goods, hold back enough of the price to cover the seller’s unpaid state taxes. Keep holding it until the seller shows you a receipt or a no-tax-due certificate from the Arizona Department of Revenue. If you don’t, you can be personally liable for those taxes, interest and penalties. If you have the certificate, a later audit deficiency stays the seller’s problem. The department has 15 days to answer the seller’s request (A.R.S. 42-1110).' },
    { text: 'In Arizona, there is no bulk sales (bulk transfer) chapter in the state’s commercial code today. Tax clearance and lien searches still matter.' },
    { text: 'In Arizona, most liens on business equipment and inventory are filed with the Arizona Secretary of State. Liens on fixtures may be filed with the county recorder instead (A.R.S. 47-9501). For a company organized in another state, search that state too. Vehicle liens show on the title.' },
  ],
  UT: [
    { text: 'In Utah, when someone sells their business or stock of goods, unpaid sales tax is a lien on their property. The buyer must hold back enough of the price until the seller shows a receipt from the State Tax Commission, or a certificate that no taxes are due. If the buyer doesn’t, the buyer becomes personally liable for the seller’s unpaid sales taxes, and unlike Nevada’s rule, there is no “up to what you paid” cap (Utah Code 59-12-112).' },
    { text: 'In Utah, lenders file UCC financing statements with the Division of Corporations and Commercial Code, and fixture filings go to the county recorder (Utah Code 70A-9a-501). For an out-of-state company, search the state where it is organized.' },
    { text: 'In Utah, the current Uniform Commercial Code (Title 70A) has no bulk sales chapter. Creditors won’t get a bulk-sale notice, so do your own lien and tax searches.' },
  ],
};

/** Where each kind of official sale is noticed, by state. */
export const NOTICES: ByStateLines = {
  NV: [
    { text: 'In Nevada, bankruptcy sale notices and bid procedures are filed in each case. Read them on PACER, then contact the trustee or the sale contact named in the notice.' },
    { text: 'In Nevada, receiver sales are in the district court case. Sheriff’s sales are in the sheriff’s notices, and each one sets the payment terms.' },
  ],
  CA: [
    { text: 'In California, bankruptcy sales are on the bankruptcy court docket (PACER) and in the trustee’s notice of sale.' },
    { text: 'In California, receiver sales are in the superior court case file and the court’s order approving the sale.' },
    { text: 'In California, sheriff’s sales are in notices posted in public places, and at the county sheriff’s civil unit.' },
    { text: 'In California, bulk sales are in the notice recorded with the county recorder and published in a local newspaper (Commercial Code 6105).' },
  ],
  AZ: [
    { text: 'In Arizona, bankruptcy sales are on the bankruptcy court docket (PACER).' },
    { text: 'In Arizona, receiver sales are in the superior court case file in the county where the case is filed (for example, Maricopa County Superior Court).' },
    { text: 'In Arizona, an assignment for the benefit of creditors is recorded (A.R.S. 44-1031), and the papers name the assignee to contact.' },
    { text: 'In Arizona, sheriff’s sales of personal property are posted for at least 10 days in three public places, one at or near the courthouse door (A.R.S. 12-1621).' },
  ],
  UT: [
    { text: 'In Utah, receivership sales are on the court case docket. Assignment sales are in the assignee’s notice to creditors (Utah Code 6-2-106). Ask the receiver or assignee.' },
    { text: 'In Utah, sheriff’s sales are posted at the courthouse and in public places, and published in a local newspaper (Utah Rule of Civil Procedure 69B). Many sheriff’s offices list sales online.' },
    { text: 'In Utah, bankruptcy sales are on the bankruptcy court docket (PACER).' },
  ],
};

/** Source cards in src/lib/businessAssets.ts that are Nevada-only; the rest (PACER, IRS, GSA) work in every state. */
export const NEVADA_ONLY_SOURCES = new Set([
  'https://www.nvb.uscourts.gov/',
  'https://www.clarkcountycourts.us/portal/',
  'https://www.clarkcountynv.gov/government/departments/sheriff_civil/',
  'https://orion.nv.gov/portal/public/',
  'https://tax.nv.gov/',
]);
