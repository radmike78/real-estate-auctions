// Facing foreclosure? State by state: free help, deadlines, scams and tenants' rights. Every line names its state.
// Sources: each line's citation, read on the state's official code site (checked 2026-10-04).
import type { ByStateLines } from '../../components/ByState';

export const HELP: ByStateLines = {
  NV: [
    { text: 'In Nevada, if you live in the home, you can ask the district court for foreclosure mediation, a meeting with your lender and a neutral mediator. File your petition within 30 days after the notice of default is served (NRS 107.086). It costs a $25 filing fee plus your half of the mediation fee, and the law caps the total mediation fee at $500. In Clark County, the Eighth Judicial District Court runs it.', links: [['Foreclosure mediation (Clark County courts)', 'https://www.clarkcountycourts.us/departments/adr/foreclosure-mediation/']] },
    { text: 'In Nevada, free legal help comes from legal aid offices and the court’s self-help center.', links: [['Legal Aid Center of Southern Nevada', 'https://www.lacsn.org/'], ['Nevada Legal Services', 'https://nevadalegalservices.org/'], ['Civil Law Self-Help Center', 'https://www.civillawselfhelpcenter.org/']] },
  ],
  CA: [
    { text: 'In California, before your servicer can record a notice of default on the home you live in, it has to give you HUD’s toll-free number for finding a housing counselor, (800) 569-4287 (Civil Code 2923.5 and 2923.55).' },
    { text: 'In California, the state’s Mortgage Relief Program no longer takes applications. If a disaster between January 1, 2023 and January 8, 2025 destroyed or badly damaged your home, CalHFA’s CalAssist Mortgage Fund may pay up to 1 year of your mortgage. You don’t have to pay it back, applying is free, and it closes when the money runs out.', links: [['CalAssist Mortgage Fund (CalHFA)', 'https://www.calassistmortgagefund.org/']] },
    { text: 'In California, LawHelpCA lists free legal aid offices by county, and the courts run self-help centers for people without a lawyer.', links: [['LawHelpCA', 'https://www.lawhelpca.org/'], ['California Courts Self-Help Guide', 'https://selfhelp.courts.ca.gov/']] },
  ],
  AZ: [
    { text: 'In Arizona, free legal help comes from legal aid offices and the courts’ self-help site.', links: [['AZLawHelp.org', 'https://www.azlawhelp.org/'], ['Community Legal Services', 'https://clsaz.org/'], ['Southern Arizona Legal Aid', 'https://www.sazlegalaid.org/'], ['DNA People’s Legal Services (northern Arizona)', 'https://dnalegalservices.org/'], ['AZCourtHelp.org', 'https://azcourthelp.org/']] },
    { text: 'In Arizona, we found no law that gives homeowners a right to foreclosure mediation like Nevada’s. Ask your servicer and a housing counselor about a modification, a repayment plan or a short sale.' },
  ],
  UT: [
    { text: 'In Utah, Utah Legal Services gives free civil legal help if you qualify, and you can apply online.', links: [['Utah Legal Services', 'https://www.utahlegalservices.org/']] },
    { text: 'In Utah, the courts’ Self-Help Center gives free help from staff attorneys to people without a lawyer: forms, the court process and your options. They can’t represent you. Call 888-683-0009 or text 801-742-1898.', links: [['Utah Courts Self-Help Center', 'https://www.utcourts.gov/en/self-help/services/contact.html']] },
    { text: 'In Utah, if Utah Housing Corporation services your loan, call its mortgage servicing line at 801-902-8250 or 800-344-0452.', links: [['Utah Housing Corporation', 'https://utahhousingcorp.org/homeowner/']] },
  ],
};

export const DEADLINES: ByStateLines = {
  NV: [
    { text: 'In Nevada, a notice of sale can’t come until at least 3 months after the notice of default is recorded, and the sale notice must be published for 3 weeks.' },
    { text: 'In Nevada, if you live in the home, you can generally catch up on what you owe (called reinstating) until 5 days before the sale (NRS 107.0805). You can also work out a modification or repayment plan, sell (including a short sale), or get legal help to review your case.' },
    { text: 'In Nevada, you have to ask for foreclosure mediation within 30 days after the notice of default is served (NRS 107.086).' },
  ],
  CA: [
    { text: 'In California, if you live in the home (1 to 4 units) and the loan is a first mortgage, your servicer generally has to contact you, or try hard to, at least 30 days before it records a notice of default, to talk about ways to avoid foreclosure (Civil Code 2923.5, 2923.55 and 2924.15).' },
    { text: 'In California, at least 3 months must pass after the notice of default is recorded before a notice of sale can be given (Civil Code 2924).' },
    { text: 'In California, the notice of sale is posted on the home, posted in a public place and recorded at least 20 days before the sale, and published once a week for 3 weeks (Civil Code 2924f).' },
    { text: 'In California, you can generally pay the past-due amount, plus allowed fees and costs, and keep the loan (reinstate) until 5 business days before the sale date (Civil Code 2924c).' },
    { text: 'In California, if you live in the home and send your servicer a complete application for a first-loan modification at least 5 business days before a scheduled sale, the servicer can’t record a notice of default or sale, or hold the sale, while it decides (Civil Code 2923.6 and 2924.18). It can’t charge you a fee to apply (Civil Code 2924.11).' },
    { text: 'In California, when you ask a larger servicer for help avoiding foreclosure, it must give you a single point of contact who knows your file (Civil Code 2923.7). Very small servicers are exempt.' },
    { text: 'In California, the county can sell a home at a tax sale once its taxes have been unpaid for 5 years or more (3 years for commercial property) (Revenue and Taxation Code 3691). Before then, ask your county tax collector about paying in installments (Revenue and Taxation Code 4217).' },
    { text: 'In California, an HOA can’t foreclose unless the unpaid assessments reach $1,800 or are more than 12 months late, not counting late fees, collection costs, attorney’s fees and interest (Civil Code 5720). Within 15 days of the HOA’s notice, you can ask in writing to meet the board about a payment plan (Civil Code 5665). After a nonjudicial HOA sale, you have 90 days to buy the home back (Civil Code 5715).' },
  ],
  AZ: [
    { text: 'In Arizona, most home loans use a deed of trust, so the trustee can sell the home without a court case. The trustee records a notice of sale with the county recorder, and the sale can’t be held until the 91st day after that (A.R.S. 33-807, 33-808).' },
    { text: 'In Arizona, the trustee must mail you a copy of the notice within 5 business days after it is recorded, with a statement of what you missed (A.R.S. 33-809). The notice is also posted on the home at least 20 days before the sale and published once a week for 4 weeks (A.R.S. 33-808).' },
    { text: 'In Arizona, you can catch up on what you owe (reinstate) until 5 p.m. on the last business day before the sale. Ask the trustee in writing for the exact amount; it must answer within 5 business days (A.R.S. 33-813).' },
    { text: 'In Arizona, if you think the sale is wrong, you must get a court order stopping it before 5 p.m. on the last business day before the sale, or you may lose your objections (A.R.S. 33-811). Talk to legal aid right away.' },
    { text: 'In Arizona, a trustee’s sale is final: there is no right to buy the home back afterward (A.R.S. 33-811). If the lender forecloses in court instead, you can usually redeem within 6 months after the sheriff’s sale, or 30 days if the court found the home abandoned (A.R.S. 12-1282).' },
    { text: 'In Arizona, after a trustee’s sale, the lender can’t sue you for the rest of the loan if the home is on 2.5 acres or less and used as a single one- or two-family home (A.R.S. 33-814(G)). For deeds of trust made after 2014 there are exceptions, such as homes never finished or never lived in (A.R.S. 33-814(H)).' },
    { text: 'In Arizona, the county treasurer can sell a tax lien on your home, and you can pay it off (redeem) at the treasurer’s office (A.R.S. 42-18152, 42-18153). The lien buyer can’t sue to take the home until 3 years after the lien sale and must mail you notice at least 30 days before suing (A.R.S. 42-18201, 42-18202). You can still redeem until the judgment (A.R.S. 42-18206).' },
    { text: 'In Arizona, an HOA in a planned community can foreclose only through a court case, and only once you are 18 months behind or owe $10,000 or more, whichever comes first. Before that, the board must offer a reasonable payment plan and send a certified-mail notice at least 30 days before sending your account to collections (A.R.S. 33-1807). Condominiums have a separate law (A.R.S. 33-1256).' },
  ],
  UT: [
    { text: 'In Utah, if you live in the home and your lender is a bank, credit union or other financial institution, it must first send you a written notice of what you owe, give you at least 30 days to catch up before a notice of default is filed, and name one contact person to ask about help such as a loan modification (Utah Code 57-1-24.3).' },
    { text: 'In Utah, most home loans are foreclosed by a trustee’s sale, without a court case. It starts when the trustee records a notice of default with the county recorder, and notice of sale can’t be given until at least 3 months later (Utah Code 57-1-24).' },
    { text: 'In Utah, you can catch up on the missed payments, plus costs and fees, at any time within 3 months after the notice of default is recorded (Utah Code 57-1-31). If you apply for help with the contact person during those 3 months, the notice of sale can’t be given until you get a written decision (Utah Code 57-1-24.3).' },
    { text: 'In Utah, the notice of sale is published in a newspaper once a week for 3 weeks and on the state’s public legal notice website for 30 days, and posted on the home and at the county recorder at least 20 days before the sale (Utah Code 57-1-25). The trustee also mails you a copy at least 20 days before the sale (Utah Code 57-1-26).' },
    { text: 'In Utah, there is no right to buy the home back after a trustee’s sale (Utah Code 57-1-28). If the lender wants the rest of the loan (a deficiency), it has to sue within 3 months after the sale, and can get only what you owed minus the home’s fair market value on the sale date (Utah Code 57-1-32).' },
    { text: 'In Utah, if a lender forecloses in court instead, a sheriff sells the home, and you can buy it back (redeem) within 180 days by paying the sale price plus 6%, plus recorded costs (Utah Rule of Civil Procedure 69C).' },
    { text: 'In Utah, property taxes are due November 30 (Utah Code 59-2-1331). If they stay unpaid, you can still pay them, with penalties and interest, at any time before the county’s tax sale, held in May or June after 4 years (Utah Code 59-2-1343, 59-2-1346, 59-2-1351). The county treasurer accepts partial payments of $10 or more (Utah Code 59-2-1346).' },
    { text: 'In Utah, before an HOA starts a trustee’s sale for unpaid assessments, it must send you a notice by certified mail at least 30 days ahead, and you then have 30 days to demand in writing that it go to court instead. It can’t use a trustee’s sale for fines, or unless an assessment is more than 180 days past due (Utah Code 57-8a-302, 57-8a-303).' },
  ],
};

export const SCAMS: ByStateLines = {
  NV: [
    { text: 'In Nevada, foreclosure consultants must be licensed, and buyers who use fraud or deceit on owners in foreclosure face criminal penalties (NRS 645F). If a buyer used fraud or deceit, you can cancel the sale within 2 years.' },
    { text: 'In Nevada, report scams to the Attorney General.', links: [['Nevada Attorney General', 'https://ag.nv.gov/']] },
  ],
  CA: [
    { text: 'In California, nobody who offers to “save” your home may charge you before they have done everything they promised, including foreclosure consultants and loan modification companies (Civil Code 2945.4 and 2944.7). A consultant’s contract must be in writing, and you can cancel it until midnight of the 5th business day after you sign (Civil Code 2945.2 and 2945.3).' },
    { text: 'In California, if you live in the home and a notice of default has been recorded, a buyer must give you a written contract. You can cancel until midnight of the 5th business day after you sign, or until 8 a.m. on the sale date, whichever comes first, and until then the buyer can’t take your deed or pay you (Civil Code 1695.4 and 1695.6). If a buyer took unconscionable advantage of you, you can undo the deal within 2 years (Civil Code 1695.13 and 1695.14).' },
    { text: 'In California, report scams to the Attorney General’s Public Inquiry Unit, (800) 952-5225. Report a state-licensed lender or servicer to the Department of Financial Protection and Innovation (DFPI), 1-866-275-2677.', links: [['Foreclosure rescue scams (California AG)', 'https://oag.ca.gov/consumers/general/foreclosure_scams'], ['File a complaint (DFPI)', 'https://dfpi.ca.gov/file-a-complaint/']] },
  ],
  AZ: [
    { text: 'In Arizona, a foreclosure consultant can’t take any payment until all the promised work is done, and can’t take your deed, a lien or a power of attorney (A.R.S. 44-1378.02). The contract must be in writing and notarized, you must get it at least 24 hours before you sign, and you can cancel until midnight of the 3rd business day after signing (A.R.S. 44-1378.03, 44-1378.04).' },
    { text: 'In Arizona, report scams to the Attorney General (Phoenix 602-542-5763, Tucson 520-628-6648).', links: [['File a consumer complaint (Arizona AG)', 'https://www.azag.gov/complaints/consumer']] },
  ],
  UT: [
    { text: 'In Utah, a person paid to help with a loan modification needs a Utah mortgage license and a written agreement, must give you 3 business days to cancel, and can’t charge a fee until you have accepted a written offer from your lender (Utah Code 61-2c-301).' },
    { text: 'In Utah, someone paid to “rescue” you from foreclosure through a deal involving your home’s title needs a Utah real estate license and a written agreement, and can’t ask you to sign over your home, pay them instead of your servicer, or stop talking to your lender or counselor (Utah Code 61-2f-102, 61-2f-401).' },
    { text: 'In Utah, report scams to the Division of Consumer Protection, and report a real estate agent or broker to the Division of Real Estate.', links: [['Utah Division of Consumer Protection', 'https://commerce.utah.gov/dcp/'], ['Utah Division of Real Estate', 'https://commerce.utah.gov/realestate/']] },
  ],
};

export const TENANTS: ByStateLines = {
  NV: [{ text: 'In Nevada, for homes with up to 4 units, the new owner must also give you a notice of the change of ownership (NRS 40.255).' }],
  CA: [{ text: 'In California, the lender or trustee must post a notice on the home and mail it to residents explaining their rights (Civil Code 2924.8). After the sale, a month-to-month tenant gets at least 90 days’ written notice, and a tenant with a fixed-term lease can generally stay until it ends (Code of Civil Procedure 1161b). Some California cities give tenants even more protection.' }],
  AZ: [{ text: 'In Arizona, your landlord must tell you in writing about a foreclosure: within 5 business days of getting a notice of trustee’s sale, or in the lease if it was signed after the foreclosure started. This doesn’t cover buildings of 4 or more connected units (A.R.S. 33-1331).' }],
  UT: [{ text: 'In Utah, when a rental home goes to a trustee’s sale, the trustee must post a “Notice to Tenant” on the property or mail it to each unit, explaining that federal law may let you stay until your lease ends or 90 days after a notice to vacate, whichever is later (Utah Code 57-1-25).' }],
};
