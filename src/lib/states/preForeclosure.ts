// Pre-foreclosure guide, state by state: how a foreclosure progresses, where notices appear, how investors buy,
// how to read a notice of sale, and why the site never helps anyone contact owners. Every line names its state.
// Sources: each line's citation, read on the state's official code site (checked 2026-10-04).
import type { ByStateLines } from '../../components/ByState';

/** From missed payments to auction. Rendered as an ordered list. */
export const TIMELINE: ByStateLines = {
  NV: [
    { text: 'In Nevada, notice of default: the trustee or HOA records it. The owner can still catch up and fix the default (called curing it).' },
    { text: 'In Nevada, 3+ months: the shortest wait before a notice of sale can be recorded is 3 months for a mortgage (NRS 107.080) and 90 days for an HOA (NRS 116.31162).' },
    { text: 'In Nevada, notice of sale: it is posted for 20 days and published for 3 weeks. It sets the auction date.' },
    { text: 'In Nevada, auction: it is held, postponed or cancelled. A sale becomes an auction listing on this site.' },
  ],
  CA: [
    { text: 'In California, contact comes first: for an owner-occupied 1 to 4 unit home with a first mortgage, the servicer must contact the owner, or try hard to, at least 30 days before recording a notice of default. The notice of default must include a statement that it did (Civil Code 2923.5, 2923.55).' },
    { text: 'In California, notice of default: the trustee records it with the county recorder. The owner can still catch up (reinstate).' },
    { text: 'In California, 3+ months: at least 3 months must pass after the notice of default before a notice of sale (Civil Code 2924).' },
    { text: 'In California, notice of sale: it is recorded with the county recorder, posted on the property and in a public place at least 20 days before the sale, and published once a week for 3 weeks (Civil Code 2924f). The owner can reinstate until 5 business days before the sale (Civil Code 2924c).' },
    { text: 'In California, auction: it is held, postponed or cancelled. For a first loan on a 1 to 4 unit home, the trustee can’t sell at the first sale for less than 67% of the home’s fair market value. If it doesn’t sell, the sale must be postponed at least 7 days (Civil Code 2924f(f)).' },
    { text: 'In California, 15 to 45 days (1 to 4 units): the sale isn’t final right away. Eligible tenants, owner-occupants, nonprofits and public agencies can step in (Civil Code 2924m, until January 1, 2031).' },
  ],
  AZ: [
    { text: 'In Arizona, missed payments: the loan servicer sends its own letters. Nothing is recorded yet.' },
    { text: 'In Arizona, notice of trustee’s sale: the trustee records it with the county recorder (in Maricopa County, the Maricopa County Recorder). Within 5 business days, the trustee mails the owner a copy with a statement of the default (A.R.S. 33-808, 33-809).' },
    { text: 'In Arizona, posting and publishing: the notice is posted on the property at least 20 days before the sale, and at the superior court. It is published once a week for 4 weeks in a newspaper in the county (A.R.S. 33-808).' },
    { text: 'In Arizona, earliest sale, day 91: the sale can’t be held until the 91st day after the notice is recorded (A.R.S. 33-807, 33-808).' },
    { text: 'In Arizona, reinstatement or postponement: the owner or a junior lienholder can reinstate until 5 p.m. on the last business day before the sale. If they do, the trustee records a cancellation of the notice of sale (A.R.S. 33-813). The trustee can also postpone the sale to a new date within 90 days by announcing it at the sale (A.R.S. 33-810).' },
    { text: 'In Arizona, auction: the sale is held on a weekday from 9 a.m. to 5 p.m., at the property, at a superior court building or at the trustee’s office (A.R.S. 33-808). A sale becomes an auction listing on this site.' },
  ],
  UT: [
    { text: 'In Utah, lender’s notice: if the home is the owner’s main home and the lender is a bank, credit union or similar, the lender first sends the owner a notice with the amount to catch up, and at least 30 days to pay (Utah Code 57-1-24.3).' },
    { text: 'In Utah, notice of default: the trustee records it with the county recorder. Within 3 months after that, the owner or a junior lienholder can catch up and cure the default (Utah Code 57-1-24, 57-1-31).' },
    { text: 'In Utah, 3+ months: this is the shortest wait before notice of sale can be given (Utah Code 57-1-24). A community association (HOA) uses the same steps, but first sends the owner a 30-day notice (Utah Code 57-8a-303).' },
    { text: 'In Utah, notice of sale: it is published in a newspaper once a week for 3 weeks, on the state’s public legal notice website for 30 days, and posted on the property and at the county recorder at least 20 days before the sale (Utah Code 57-1-25).' },
    { text: 'In Utah, auction: it is held at a courthouse in the county, between 8 a.m. and 5 p.m. It can be postponed. A postponement of more than 45 days needs a new notice (Utah Code 57-1-25, 57-1-27). A sale becomes an auction listing on this site.' },
  ],
};

/** State-specific notes under the timeline (why many never reach auction is said once on the page for every state). */
export const TIMELINE_NOTES: ByStateLines = {
  CA: [{ text: 'In California, a complete loan modification application can also pause the process (Civil Code 2923.6, 2924.18).' }],
  UT: [{ text: 'In Utah, some lenders foreclose in court instead. That ends in a sheriff’s sale with a 180-day redemption period (URCP 69C).' }],
};

/** Where to find recorded and posted notices. */
export const WHERE: ByStateLines = {
  NV: [
    { text: 'In Nevada, this tracker follows notices of default and sale recorded with the Clark County Recorder. Elsewhere in Nevada, check the recorder in the county where the property is.' },
  ],
  CA: [
    { text: 'In California, notices of default and notices of sale are recorded with the county recorder where the property is (Civil Code 2924, 2924f). Search that county’s recorder index by document type.', links: [['Civil Code 2924', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924']] },
    { text: 'In California, the notice of sale is also posted on the property and in a public place in the city or county, and published in a local newspaper. Each notice names the trustee and the sale date, time and place.' },
    { text: 'In California, the only person to ask about a sale is the trustee named on the notice. Never contact the owner or anyone living in the home.' },
  ],
  AZ: [
    { text: 'In Arizona, notices of trustee’s sale and cancellations are recorded with the recorder in the county where the property is. Once recorded, they give public notice (A.R.S. 33-808, 33-813, 33-818).' },
    { text: 'In Arizona, the notice gives the trustee’s name, address and phone number. It also gives the parcel number, the original loan amount and the sale date, time and place (A.R.S. 33-808).' },
  ],
  UT: [
    { text: 'In Utah, the notice of default is recorded with the county recorder’s office (Utah Code 57-1-24).' },
    { text: 'In Utah, the notice of sale is in a local newspaper, on the state’s public legal notice website run by Utah’s newspapers, and posted at the county recorder and on the property (Utah Code 57-1-25, 45-1-101).' },
  ],
};

/** How an investor can buy without ever contacting the owner. */
export const BUY: ByStateLines = {
  NV: [
    { text: 'In Nevada, a trustee’s or HOA sale becomes an auction listing on this site. Ask only the trustee named on the notice of sale about it.' },
    { text: 'In Nevada, if the owner lists the home (often as a short sale), or the lender takes it back as bank-owned (REO), it sells through agents.' },
  ],
  CA: [
    { text: 'In California, at the trustee sale: bid at the auction run by the trustee named on the notice of sale. Read the California trustee sales guide for funds, bidding and the 15 to 45 day wait for 1 to 4 unit homes.' },
    { text: 'In California, after the sale (bank-owned): if no one outbids the lender, the home becomes bank-owned (REO). You buy it through the lender’s listing agent, like a normal home.' },
    { text: 'In California, from a listing: if an owner decides to sell (including a short sale), a licensed agent lists the home on the MLS. Make your offer through your own agent.' },
  ],
  AZ: [
    { text: 'In Arizona, at the trustee’s sale, ask the trustee only. The trustee can give the unpaid principal and a list of recorded liens, if it actually knows them. You can ask in writing starting 30 days after the notice is recorded, while the loan can still be reinstated. The trustee may charge a fee of up to $100 (A.R.S. 33-809(E)).' },
    { text: 'In Arizona, on the last business day before the sale, and on the sale day, the trustee must make available the lender’s opening bid or a good-faith estimate of it (A.R.S. 33-809(F)).' },
    { text: 'In Arizona, bring a $10,000 deposit in a form the trustee accepts (A.R.S. 33-810). Pay the rest by 5 p.m. the next business day. The trustee must sign the deed and submit it for recording within 7 business days after you pay. The sale clears liens junior to the deed of trust, but not senior ones (A.R.S. 33-811). If a federal tax lien is recorded, the IRS may have up to 120 days after the sale to redeem (26 U.S.C. 7425).' },
    { text: 'In Arizona, after the sale (bank-owned): if no one outbids the lender, the home becomes bank-owned (REO). You buy it later through the lender’s listing agent.' },
  ],
  UT: [
    { text: 'In Utah, at the trustee’s sale, every bid is final (Utah Code 57-1-27). Pay the way the trustee directs. The trustee sends the trustee’s deed for recording within 5 business days after you pay. There is no right of redemption after the sale (Utah Code 57-1-28).' },
    { text: 'In Utah, after the sale (bank-owned): if no one outbids the lender, the lender owns the home and usually lists it with an agent.' },
    { text: 'In Utah, before the sale, only if the owner lists it: if an owner decides to sell, a licensed agent lists the home, often as a short sale. Find it on the listings, not by reaching out.' },
  ],
};

/** What a notice of sale must say, by state (the "How to read a notice of sale" list). */
export const READ_NOTICE: ByStateLines = {
  NV: [
    { text: 'In Nevada, the law requires the date, time and place, a description of the property and its address, and the trustee’s contact details.' },
  ],
  CA: [
    { text: 'In California, the notice of sale must give the time of sale, the street address and the exact place of the sale, and a description of the property. It must be recorded, and posted on the property, at least 20 days before the sale (Civil Code 2924f).' },
  ],
  AZ: [
    { text: 'In Arizona, the law requires the date, time and place; the street address, legal description and parcel number; and the original loan amount. It also requires the lender’s and trustee’s names and addresses, the trustee’s phone number and the trustee’s regulator (A.R.S. 33-808).', links: [['A.R.S. 33-808', 'https://www.azleg.gov/ars/33/00808.htm']] },
    { text: 'In Arizona, the original loan amount is not what is owed today, and it isn’t the property’s value. Ask the trustee for the lender’s bid the day before the sale (A.R.S. 33-809(F)).' },
  ],
  UT: [
    { text: 'In Utah, the notice gives the date, time and courthouse of the sale, the property’s address and legal description, the current beneficiary (lender), the record owners when the default was recorded, and the trustee (Utah Code 57-1-25). It may set a deposit the winning bidder must pay (Utah Code 57-1-27).', links: [['Utah Code 57-1-25', 'https://le.utah.gov/xcode/Title57/Chapter1/57-1-S25.html']] },
  ],
};

/** The caution box: why the site never helps anyone contact owners in foreclosure. */
export const NO_CONTACT: ByStateLines = {
  NV: [
    { text: 'In Nevada, foreclosure consultants must be licensed, and a buyer who uses fraud or deceit on an owner in foreclosure faces criminal penalties. The owner can also cancel such a purchase for up to 2 years (NRS Chapter 645F). Owners may be in the state’s Foreclosure Mediation Program, too.' },
  ],
  CA: [
    { text: 'In California, anyone buying a home from an owner who lives there after a notice of default is recorded must follow the Home Equity Sales Contract Act. The contract must be in writing, with set terms and a cancellation notice. The owner can cancel until midnight of the 5th business day after signing, or until 8 a.m. on the sale day, whichever comes first. Until then the buyer can’t take a deed, record anything or pay the owner (Civil Code 1695.3, 1695.4, 1695.6).' },
    { text: 'In California, breaking these rules can bring a fine of up to $25,000, up to a year in county jail, or both (Civil Code 1695.8). If the buyer took unconscionable advantage, the owner can undo the sale for 2 years (Civil Code 1695.13, 1695.14).' },
  ],
  AZ: [
    { text: 'In Arizona, most people who offer an owner in foreclosure paid help to stop or delay the sale are “foreclosure consultants” (attorneys and the lender or servicer are among the exceptions). The law bars that person from taking payment before the work is done, and from taking the owner’s deed or any interest in the home (A.R.S. 44-1378, 44-1378.02).' },
    { text: 'In Arizona, a foreclosure consultant who commits fraud or deceit against a homeowner, including in a “sell me your house and rent it back” deal, commits a class 1 misdemeanor (A.R.S. 44-1378.06).' },
  ],
  UT: [
    { text: 'In Utah, a person paid to offer an owner a deal involving the home’s title that they say will stop a foreclosure is doing “foreclosure rescue.” That needs a Utah real estate license and a written agreement. A licensee can’t require the owner to sign the home over to the licensee or to someone they have a business tie with, pay someone other than their servicer, or stop talking to their lender or counselor (Utah Code 61-2f-102, 61-2f-401).' },
  ],
};
