// Step-by-step guides for California, Arizona, Utah and Texas (Texas in stateGuidesTx1.ts and stateGuidesTx2.ts), in the same shape as Nevada’s (see playbooks.ts).
// Every rule cites the state’s statutes or court rules; county details are labeled as examples to confirm locally.
// Examples are illustrative, not real properties or transactions.

import type { Playbook } from './playbooks';
import { TEAM } from './playbookTeam';
import { TX_GUIDES_1 } from './stateGuidesTx1';
import { TX_GUIDES_2 } from './stateGuidesTx2';

const REVIEWED = '2026-09-29';

export const STATE_GUIDES: Playbook[] = [
{
  key: "catax",
  title: "California tax sales",
  short: "Tax sales",
  oneLine: "When property taxes go unpaid for years, the county tax collector can sell the property at auction. The buyer gets a tax deed.",
  youGet: "A tax deed from the county tax collector. It wipes out most private liens, like mortgages and judgments. But some government liens, easements and IRS liens can stay with the property.",
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county treasurer-tax collector, with approval from the board of supervisors."
    },
    {
      label: "When a property can be sold",
      value: "After 5 years of unpaid taxes, or 3 years for nonresidential commercial property (R&T 3691). A county may choose to use 5 years for commercial property too. A property can also be sold after 3 years if a city, county, nonprofit or nuisance-abatement lienholder asks (R&T 3691(b))."
    },
    {
      label: "Notice",
      value: "Mailed to parties of interest 45 to 120 days before the sale. Also published once a week for 3 weeks, starting at least 21 days before (R&T 3701, 3702)."
    },
    {
      label: "Minimum bid",
      value: "At least what the owner would have to pay to buy it back (redeem), plus costs (R&T 3698.5). If a property goes unsold, the county can offer it again later at a lower minimum with board approval."
    },
    {
      label: "Owner can redeem until",
      value: "The owner can pay what’s owed and keep the property until close of business on the last business day before the sale starts (R&T 3707)."
    },
    {
      label: "Deposit and payment",
      value: "Each county sets its own. If the county lets winners pay later (a deferred-payment sale), state law lets it ask for a deposit of $5,000 or 10% of the minimum bid, whichever is greater, with the rest due within 90 days at most (R&T 3693.1). Confirm in your county’s terms."
    },
    {
      label: "What you get",
      value: "A tax deed, issued after you pay in full (R&T 3708)."
    },
    {
      label: "Challenge window",
      value: "At least 1 year, sometimes longer. Someone who wants to challenge the sale first has to file a petition with the board of supervisors within 1 year of the deed. If the board says no, they get another year to sue (R&T 3725). The board can also cancel (rescind) the sale if the property should not have been sold. Then you get back only your price plus county interest, not what you spent on repairs (R&T 3731)."
    }
  ],
  steps: [
    {
      title: "Find your county’s sale",
      detail: "Each county tax collector posts its own auction list, dates and terms. Many California counties run the online bidding on a hired auction website. But the county is the seller, and its official terms control. Read the county’s terms and conditions in full."
    },
    {
      title: "Check the property is really eligible",
      detail: "Property can be sold after 5 years of unpaid taxes, or 3 years for nonresidential commercial property (R&T 3691). Properties drop off the list when the owner redeems (pays what is owed). Expect some to be withdrawn."
    },
    {
      title: "Research each parcel before you bid",
      detail: "Property is sold as is (R&T 3692.3). Check the location, access and zoning. Check whether the parcel can even be built on. Ask a title company to look up recorded liens and easements. Do not go onto private property. The Los Angeles County terms, for example, say you may inspect but may not trespass."
    },
    {
      title: "Know what the tax deed will not clear",
      detail: "The deed wipes out most older debts on the property. It does not clear future tax bills, or liens held by a taxing agency that did not agree to the sale. Some special assessments stay. So do Mello-Roos and 1915 Act bond amounts not paid from the sale. Easements, recorded restrictions and some IRS liens stay too (R&T 3712). Budget for these."
    },
    {
      title: "Register and post your deposit",
      detail: "Deposits and deadlines differ by county. Example, Los Angeles County: a $5,000 deposit or 10% of your spending limit, whichever is greater. Example, San Diego County 2026 auction: a $1,000 deposit plus a $35 non-refundable fee. Confirm in your county’s notice."
    },
    {
      title: "Bid, then pay on time",
      detail: "Bids start at the minimum bid. Pay the rest by your county’s deadline, in the form it requires, plus transfer taxes and fees. Example: San Diego County requires full payment within 5 business days of the auction close. If you miss the deadline, you can lose your deposit. The owner’s right to redeem also comes back (R&T 3707)."
    },
    {
      title: "Wait for the recorded tax deed",
      detail: "You do not own it until the tax collector records the tax deed. Example: Los Angeles County says deeds go to the Recorder about 60 to 70 days after the sale. Until then, do not enter the property, collect rent or contact any occupants. Los Angeles County may cancel a sale for that."
    },
    {
      title: "Plan for the 1-year challenge period",
      detail: "Anyone who claims the sale was invalid has 1 year from the deed to file a petition with the board of supervisors. If the board refuses, they have 1 more year to sue (R&T 3725). The board can also cancel (rescind) the sale. If it does, you get back only your price plus interest (R&T 3731). Los Angeles and San Diego counties both advise waiting about a year before making improvements. Many title companies will not insure until then.*"
    },
    {
      title: "Take possession the legal way",
      detail: "If someone still lives there after your deed is recorded, talk to an eviction attorney and use the court process. Former owners and lienholders may claim any excess proceeds (money left over from the sale) from the county. That is between them and the county, not the buyer (R&T 4675)."
    }
  ],
  survives: {
    wipedOut: [
      "Mortgages and deeds of trust recorded before the sale",
      "Private judgment liens and mechanic’s liens",
      "The past-due property taxes the sale is collecting"
    ],
    mayStay: [
      "Upcoming property tax installments after the sale (R&T 3712(a))",
      "Liens or rights of a taxing agency that did not consent to the sale",
      "Special assessments not included in the redemption amount",
      "Unpaid 1915 Act bond assessments and Mello-Roos special taxes not paid from the sale proceeds",
      "Easements, separately held water rights and recorded restrictions",
      "Recorded public offers of dedication and public-agency purchase options",
      "Some federal IRS liens. Even when the IRS lien is wiped out, the U.S. can buy the property back within 120 days of the sale (26 U.S.C. 7425(d))",
      "Public liens such as PACE, weed abatement or demolition liens (Los Angeles County example)"
    ]
  },
  mistakes: [
    {
      mistake: "Bidding on a parcel you never researched",
      prevent: "Sales are final and as is. Check the map, access, zoning and liens for every parcel before you bid."
    },
    {
      mistake: "Assuming the tax deed clears everything",
      prevent: "Read your county’s list of liens that stay with the property after the sale (R&T 3712). Ask a title company to review the parcel before you bid."
    },
    {
      mistake: "Missing the payment deadline",
      prevent: "Have funds ready in the exact form your county accepts. A missed deadline can cost your deposit."
    },
    {
      mistake: "Moving in, fixing up or contacting occupants before the deed records",
      prevent: "Wait for the recorded tax deed. Then use an attorney and the court process for any occupants."
    },
    {
      mistake: "Spending heavily on improvements in the first year",
      prevent: "The sale can be challenged for at least a year. If it is rescinded, the refund is only your price plus county interest, not what you spent on repairs (R&T 3731). Many buyers hold off until then, and until they can get title insurance."
    }
  ],
  example: {
    title: "Fictional example: a vacant lot in an online county auction",
    story: "Dana, a first-time buyer, finds a vacant lot on a county’s tax sale list. The minimum bid is $8,000. She checks the county map and finds the lot has no legal road access, so she skips it. She picks another lot and confirms it has access. Then she asks a title company about recorded liens. The title company notes a sewer assessment that will stay with the lot. She wins at $14,000 and pays within the county’s deadline. She waits for the recorded tax deed before visiting to clear brush. She holds off on building until the one-year challenge window passes.",
    lesson: "Research access and surviving liens first. Pay on time. Wait for the recorded deed and the challenge window before you invest more."
  },
  sources: [
    {
      label: "California R&T Code 3691 (when property can be sold)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3691"
    },
    {
      label: "California R&T Code 3698.5 (minimum bid)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3698.5"
    },
    {
      label: "California R&T Code 3707 (end of redemption)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3707"
    },
    {
      label: "California R&T Code 3693.1 (deposit and deferred payment)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3693.1"
    },
    {
      label: "California R&T Code 3712 (what the tax deed does not clear)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3712"
    },
    {
      label: "California R&T Code 3725 (time to challenge a sale)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3725"
    },
    {
      label: "California R&T Code 3731 (board may rescind a tax sale)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3731"
    },
    {
      label: "26 U.S.C. 7425: federal tax liens and the 120-day redemption (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "California R&T Code 4675 (excess proceeds claims)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=4675"
    },
    {
      label: "Los Angeles County Treasurer and Tax Collector, 2026A auction terms (example)",
      url: "https://ttc.lacounty.gov/wp-content/uploads/2026/03/2026A-Terms-and-Conditions.pdf"
    },
    {
      label: "San Diego County Treasurer-Tax Collector, bidder registration (example)",
      url: "https://www.sdttc.com/content/ttc/en/tax-collection/property-tax-sales/bidder-registration.html"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.cpa, TEAM.insurance, TEAM.contractor],
  lastReviewed: REVIEWED,
  state: 'CA'
},
{
  key: "caforeclosure",
  title: "California trustee sales",
  short: "Trustee sales",
  oneLine: "Most California home loans are deeds of trust. That lets a lender foreclose without going to court, through a trustee who auctions the property.",
  youGet: "A trustee’s deed. You get the property as is. Liens recorded ahead of the loan being foreclosed (senior liens) stay with it, and people living there often have legal rights.",
  plain: 'The house as is. Debts recorded ahead of the loan being foreclosed stay with it, and people living there may have legal rights.',
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The trustee named in the deed of trust. It sells for the lender (called the beneficiary)."
    },
    {
      label: "Notice of default",
      value: "This is recorded first. At least 3 months have to pass before the notice of sale (Civ 2924)."
    },
    {
      label: "Notice of sale",
      value: "Posted, recorded and first published at least 20 days before the sale (Civ 2924f)."
    },
    {
      label: "Postponements",
      value: "Common. A sale can be postponed up to 365 days in total before a new notice of sale is needed (Civ 2924g)."
    },
    {
      label: "Price floor at the first sale",
      value: "For a first loan on a 1 to 4 unit home, the trustee can’t sell at the first sale for less than 67% of the home’s fair market value. If it doesn’t sell, the sale must be postponed at least 7 days (Civ 2924f(f)). The value is the one the lender gives the trustee (an appraisal, broker’s opinion or automated valuation)."
    },
    {
      label: "Payment",
      value: "Cash, a cashier’s check from a bank, or a check from a credit union or savings bank. The trustee can ask for proof that you have the full amount before accepting your bid (Civ 2924h)."
    },
    {
      label: "1 to 4 unit homes",
      value: "The sale is not final right away. Eligible tenants, buyers who will live in the home (prospective owner-occupants) and certain nonprofits and public agencies have 15 days to say they plan to bid, and up to 45 days to make that bid (Civ 2924m, in effect until January 1, 2031)."
    },
    {
      label: "Liens",
      value: "Liens recorded earlier (senior liens) stay with the property. Liens recorded later (junior liens) get paid from any money left over, in order of priority (Civ 2924k)."
    },
    {
      label: "Tenants",
      value: "Tenants generally get at least 90 days’ written notice. Some fixed-term leases must be honored (CCP 1161b and the federal Protecting Tenants at Foreclosure Act)."
    }
  ],
  steps: [
    {
      title: "Find sales from the official source",
      detail: "Trustee sales are listed in the recorded notice of sale. The trustee posts and publishes it. Each notice names the trustee and the sale time and place. It also gives a phone number or website for sale-date updates. Deal only with the trustee. DeedOwl never helps anyone contact the homeowner."
    },
    {
      title: "Learn the timeline",
      detail: "First, the lender records a notice of default. At least 3 months later, the trustee can give a notice of sale. It must be recorded, posted and first published at least 20 days before the sale (Civ 2924, 2924f). The owner can usually catch up on the loan until 5 business days before the sale date (Civ 2924c)."
    },
    {
      title: "Order a title report",
      detail: "The notice of sale warns that you may be bidding on a junior lien (one with other liens ahead of it). If so, you may have to pay off all the senior liens to get clear title. Ask a title company for the recorded liens and their order of priority. Ask about unpaid property taxes too."
    },
    {
      title: "Look, but do not trespass",
      detail: "You usually cannot inspect inside. Drive by from the street and assume repairs are needed. Do not approach or contact occupants."
    },
    {
      title: "Check the sale status the day before and the day of",
      detail: "Sales are often postponed. The trustee has to announce postponements at the sale location and keep a phone line or website with current dates (Civ 2924f, 2924g). Any postponement cancels the last bid (Civ 2924h)."
    },
    {
      title: "Bring certified funds and bid",
      detail: "Sales happen between 9 a.m. and 5 p.m. on a business day, in the county where the property is (Civ 2924g). Every bid is binding and final. You can’t take it back (irrevocable). The trustee can ask you to show you can pay the full bid before accepting it. If you win, you pay in full when the sale closes (Civ 2924h). The lender may credit bid (bid the debt instead of cash) up to what it is owed."
    },
    {
      title: "For 1 to 4 unit homes, wait for finality",
      detail: "The sale is not final for at least 15 days, unless you plan to live there and sign the required declaration. During that time, an eligible tenant buyer or eligible bidder can send a notice that they intend to bid. If one does, a tenant can match, and other eligible bidders can beat, your bid until 45 days after the sale (Civ 2924m). Until the sale is final you don’t get the trustee’s deed, so don’t take possession or start work. Once the deed is recorded on time, the sale counts as complete from 8 a.m. on the sale day (Civ 2924h(c))."
    },
    {
      title: "Get and record the trustee’s deed",
      detail: "Once the sale is final and your funds clear, the trustee gives you a trustee’s deed. After that, the owner has no right to buy the property back. But if the sale wiped out a junior federal tax lien, the U.S. can buy it back within 120 days (26 U.S.C. 7425(d)). If the IRS didn’t get the required notice, its lien isn’t wiped out at all and stays on the property (26 U.S.C. 7425(b))."
    },
    {
      title: "Handle occupants lawfully",
      detail: "If the former owner stays, they can be served a 3-day notice to quit once your title is complete (perfected) (CCP 1161a). Tenants generally get at least 90 days’ written notice, and in many cases a fixed-term lease can run to its end (CCP 1161b). Statewide and local just-cause rules also apply. In many rentals you need a legal reason to end the tenancy and may owe a month’s rent in relocation help. A notice that breaks these rules is void (Civ 1946.2, 2924n). Use an eviction attorney."
    }
  ],
  survives: {
    wipedOut: [
      "The deed of trust being foreclosed",
      "Junior liens recorded after it, such as a later second loan. They are paid from any surplus instead (Civ 2924k)"
    ],
    mayStay: [
      "Senior loans and liens recorded ahead of the one being foreclosed",
      "Unpaid property taxes and government assessments",
      "Easements and recorded restrictions",
      "Federal tax liens. Even when wiped out, the U.S. can buy the property back within 120 days (26 U.S.C. 7425(d)). Ask a title company",
      "Tenants’ rights under CCP 1161b, the federal Protecting Tenants at Foreclosure Act and local ordinances"
    ]
  },
  mistakes: [
    {
      mistake: "Buying a junior lien by accident",
      prevent: "Get a title report. If the loan being foreclosed is a second loan, the first loan stays on the house and you have to deal with it."
    },
    {
      mistake: "Showing up with the wrong funds",
      prevent: "Bring cashier’s checks or other funds the notice of sale accepts. A personal check will not work."
    },
    {
      mistake: "Assuming you own a 1 to 4 unit home the day you win",
      prevent: "The sale can take 15 to 45 days to become final. Plan for that wait and keep your funds available (Civ 2924m)."
    },
    {
      mistake: "Trying to remove occupants yourself",
      prevent: "Give the legally required notices and use the court process through an eviction attorney."
    },
    {
      mistake: "Leaving a vacant house alone after you win",
      prevent: "Once the sale is final, you must keep a vacant home’s outside cared for and keep out squatters and standing water. After a warning and time to fix it, the city or county can fine you up to $2,000 a day for 30 days, then up to $5,000 a day (Civ 2929.3). Budget to secure and check on it from day one."
    },
    {
      mistake: "Making deals with other bidders",
      prevent: "It is a crime to offer or accept anything in return for not bidding, or to fix bids (Civ 2924h(g))."
    }
  ],
  example: {
    title: "Fictional example: a duplex at a trustee sale",
    story: "Sam, a first-time investor, wins a trustee sale for a fictional duplex. His bid is a $310,000 cashier’s check. His title report showed the foreclosing loan was the first deed of trust, so no senior loan remains. But there is a year of unpaid property taxes. It is a 2-unit building and Sam is not moving in, so the sale is not final yet. On day 12, an eligible tenant buyer sends a notice of intent. By day 45 no qualifying bid arrives. The sale becomes final, and the trustee issues the deed. Sam then has his attorney give the tenants their required written notices instead of acting on his own.",
    lesson: "Check lien priority first. Expect a waiting period on 1 to 4 unit homes. Follow tenant notice laws exactly."
  },
  sources: [
    {
      label: "California Civil Code 2924 (notice of default, 3 months)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924"
    },
    {
      label: "California Civil Code 2924f (notice of sale, 20 days, bidder notices)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924f"
    },
    {
      label: "California Civil Code 2924g (sale rules, postponements)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924g"
    },
    {
      label: "California Civil Code 2924h (bidding and payment)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924h"
    },
    {
      label: "California Civil Code 2924m (tenant and eligible bidder window)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924m"
    },
    {
      label: "California Civil Code 2924k (surplus to junior lienholders)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924k"
    },
    {
      label: "California Code of Civil Procedure 1161b (tenants after foreclosure)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161b"
    },
    {
      label: "California Code of Civil Procedure 1161a (notice to quit after sale)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161a"
    },
    {
      label: "FDIC: Protecting Tenants at Foreclosure Act",
      url: "https://www.fdic.gov/consumer-compliance-examination-manual/v-16-protecting-tenants-foreclosure-act-2009"
    },
    {
      label: "California Civil Code 2929.3 (fines for not maintaining a vacant foreclosed home)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2929.3"
    },
    {
      label: "California Civil Code 1946.2 (statewide just-cause rules)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1946.2"
    },
    {
      label: "California Civil Code 2924n (new owner must follow tenant laws)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924n"
    },
    {
      label: "26 U.S.C. 7425: federal tax liens and the 120-day redemption (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.eviction, TEAM.insurance, TEAM.contractor, TEAM.lender],
  lastReviewed: REVIEWED,
  state: 'CA'
},
{
  key: "casheriff",
  title: "California sheriff sales",
  short: "Sheriff sales",
  oneLine: "When a court orders property sold, the sheriff (the levying officer) auctions it. Sometimes the owner gets a period to buy it back (redemption).",
  youGet: "A sheriff’s deed of sale. If the owner still has the right to buy it back (redeem), you get a certificate of sale first. Liens recorded ahead of the one being enforced stay with the property.",
  plain: 'A deed to the house, or first a certificate if the owner can still buy it back. Debts recorded ahead of the one being collected stay with it.',
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county sheriff, acting as the levying officer to carry out a court judgment or writ."
    },
    {
      label: "Notice of sale",
      value: "The notice is served, posted on the property, mailed to lienholders and first published at least 20 days before the sale (CCP 701.540)."
    },
    {
      label: "Payment",
      value: "Cash, certified check or cashier’s check (CCP 701.590)."
    },
    {
      label: "Credit option",
      value: "On real property, if your winning bid is over $5,000, you may deposit $5,000 or 10% of the bid, whichever is greater. Then pay the rest plus costs and interest within 10 days (CCP 701.590)."
    },
    {
      label: "Redemption",
      value: "Only in some judicial foreclosures. The owner gets 3 months to buy it back if the sale pays off the debt, or 1 year if it does not (CCP 729.030). Separately, if the United States was named in the case and held a junior lien, it can buy the property back for 1 year (for IRS liens, 120 days or the state period if longer) (28 U.S.C. 2410(c)). If it wasn’t named, its lien isn’t wiped out."
    },
    {
      label: "Redemption price",
      value: "Whoever redeems pays your purchase price plus what you paid for taxes, insurance, upkeep and some senior liens. Interest is added at the money-judgment rate, generally 10% a year (CCP 729.060, 685.010)."
    },
    {
      label: "Owner’s home",
      value: "If it’s the owner’s home, the sale needs a court order. A bid must be more than the homestead exemption plus all liens, and a bid under 90% of the court’s fair market value needs court approval (CCP 704.740, 704.800)."
    },
    {
      label: "Liens",
      value: "The sale wipes out the lien being enforced, junior liens and state tax liens. Senior liens stay (CCP 701.630)."
    }
  ],
  steps: [
    {
      title: "Find sales at the sheriff’s office",
      detail: "County sheriffs post notices of sale for real property. Example: the Riverside County Sheriff lists upcoming real property sales on its Court Services page. Deal only with the sheriff. DeedOwl never helps anyone contact the owner."
    },
    {
      title: "Read the notice of sale closely",
      detail: "It gives the date, time and place, a legal description and the street address (CCP 701.540). In a judicial foreclosure, it also has to state the amount owed. And it has to say whether the sale is subject to a right of redemption, meaning the owner can buy the property back afterward (CCP 729.010)."
    },
    {
      title: "Order a title report",
      detail: "An execution sale wipes out the lien being enforced, junior liens and state tax liens. Senior liens stay (CCP 701.630). In a judicial foreclosure, the sale does not affect recorded interests of people who were not named in the lawsuit (CCP 726)."
    },
    {
      title: "Check for homestead rules",
      detail: "If the property is a person’s home, the sale needs a court order. No bid can be accepted unless it is more than the homestead exemption plus all liens. A bid under 90% of fair market value needs court approval (CCP 704.740, 704.800). The exemption is the county’s median home price from the year before, but never less than about $370,000 or more than about $740,000 in 2026 (the $300,000 floor and $600,000 cap in the law, adjusted each January for inflation) (CCP 704.730).*"
    },
    {
      title: "Pre-qualify and bring funds",
      detail: "Sales are held between 9 a.m. and 5 p.m. in the county where the property is (CCP 701.570). Example, Riverside County Sheriff: bidders must pre-qualify, show proof of funds and arrive on time. They pay by cashier’s check, certified check or cash payable to the Riverside County Sheriff. Confirm in your county’s notice."
    },
    {
      title: "Bid and pay",
      detail: "Pay in full at the sale. Or, on a real property bid over $5,000, you can choose a credit sale. You deposit $5,000 or 10%, whichever is greater, and pay the rest plus costs and interest within 10 days. You have no right to move in until you pay in full (CCP 701.590). A bidder who defaults can owe the shortfall and costs (CCP 701.600)."
    },
    {
      title: "Receive a deed or certificate of sale",
      detail: "If there is no redemption right, the sheriff gives you a deed of sale and records a copy (CCP 701.660). If there is one, you get a certificate of sale first. You get the deed only after the redemption period ends (CCP 729.040, 729.080)."
    },
    {
      title: "During any redemption period",
      detail: "The owner can buy the property back for 3 months or 1 year (CCP 729.030). Meanwhile, you may collect rent, or the value of using the property, from whoever has it. You may also enter at reasonable hours to repair and maintain it (CCP 729.090). But if the owner redeems, you have to pay back the rent you collected."
    },
    {
      title: "Take possession lawfully",
      detail: "Once your title is complete (perfected), the former owner can be served a 3-day notice to quit (CCP 1161a). Tenants may have longer notice rights after a foreclosure (CCP 1161b). Use an eviction attorney. If you bought a vacant home in a foreclosure, keep its outside cared for and secured. The city or county can fine you up to $2,000 a day, then $5,000 a day (Civ 2929.3)."
    }
  ],
  survives: {
    wipedOut: [
      "The judgment lien or mortgage being enforced",
      "Liens junior to it",
      "State tax liens on the property (CCP 701.630)"
    ],
    mayStay: [
      "Senior mortgages and liens",
      "In a judicial foreclosure, recorded interests of anyone not named in the lawsuit (CCP 726)",
      "Property taxes and government assessments",
      "Easements and recorded restrictions",
      "The former owner’s right to redeem, if the notice says the sale is subject to redemption"
    ]
  },
  mistakes: [
    {
      mistake: "Ignoring the redemption period",
      prevent: "Read the notice. If it says subject to redemption, expect a certificate of sale. Then expect a wait of 3 months to 1 year."
    },
    {
      mistake: "Assuming the sale clears senior loans",
      prevent: "Only the lien being enforced and the liens behind it are wiped out. Get a title report and budget for any senior debt."
    },
    {
      mistake: "Arriving late or without proof of funds",
      prevent: "Pre-qualify with the sheriff and bring cashier’s or certified checks for the full amount or the credit-sale deposit."
    },
    {
      mistake: "Missing the 10-day balance on a credit sale",
      prevent: "Arrange the rest of your money before the sale. A default can leave you owing the shortfall and costs."
    },
    {
      mistake: "Spending heavily on a property still subject to redemption",
      prevent: "Limit spending to taxes, insurance and needed upkeep. Those get added to the redemption price, so keep receipts."
    }
  ],
  example: {
    title: "Fictional example: a judicial foreclosure with a 1-year redemption",
    story: "Priya, a new investor, reads a sheriff’s notice for a fictional house. It says the house is sold subject to a right of redemption. She wins with a $220,000 bid. That is less than the debt, so the redemption period is 1 year. She receives a certificate of sale, pays the property taxes and fire insurance, and keeps every receipt. Ten months later the former owner redeems. Priya is paid back her purchase price, the taxes and insurance, and interest at the money-judgment rate. Rent she had collected is subtracted.",
    lesson: "A sale subject to redemption can end in a refund with interest instead of a house. Keep receipts. Do not over-invest before the deed."
  },
  sources: [
    {
      label: "California Code of Civil Procedure 701.540 (notice of sale of real property)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=701.540"
    },
    {
      label: "California Code of Civil Procedure 701.590 (payment and credit sales)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=701.590"
    },
    {
      label: "California Code of Civil Procedure 701.630 (liens extinguished)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=701.630"
    },
    {
      label: "California Code of Civil Procedure 704.800 (homestead minimum bid)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=704.800"
    },
    {
      label: "California Code of Civil Procedure 729.030 (redemption period)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=729.030"
    },
    {
      label: "California Code of Civil Procedure 729.060 (redemption price)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=729.060"
    },
    {
      label: "California Code of Civil Procedure 729.090 (rents during redemption)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=729.090"
    },
    {
      label: "California Code of Civil Procedure 726 (judicial foreclosure)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=726"
    },
    {
      label: "28 U.S.C. 2410(c): U.S. right to redeem (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/28/2410"
    },
    {
      label: "California Civil Code 2929.3 (fines for not maintaining a vacant foreclosed home)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2929.3"
    },
    {
      label: "Riverside County Sheriff: Sheriff’s Court Services and sales (example)",
      url: "https://www.riversidesheriff.org/158/Sheriffs-Court-Services"
    },
    {
      label: "Riverside County Sheriff: bidder pre-qualification notice (example)",
      url: "https://www.riversidesheriff.org/DocumentCenter/View/6985/Bidder-Pre-Qualification-Notice"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.eviction, TEAM.insurance, TEAM.lender],
  lastReviewed: REVIEWED,
  state: 'CA'
},
{
  key: "aztaxlien",
  title: "Arizona tax lien sales",
  short: "Tax lien sales",
  teaser: "Each February, Arizona county treasurers sell liens for unpaid property taxes. You bid the interest rate down from 16%.",
  oneLine: "Each February, Arizona county treasurers sell liens for unpaid property taxes. You bid the interest rate down from 16%. The owner can pay you back with interest until a court rules for you or a treasurer’s deed is delivered. Land the state already owns through a tax deed is a separate program: the county board of supervisors sells it at a public auction (ARS 42-18301 to 42-18303).",
  youGet: "A certificate of purchase (a lien), not the property. You can ask a court for a treasurer’s deed only after 3 years, and only if the lien is still unpaid. Or, if you or the owner ask and the property is likely to sell for more than $2,500 above what’s owed, the court must order an auction instead, and you’re paid in cash (A.R.S. 42-18204).",
  forSale: true,
  glance: [
    {
      label: "When",
      value: "February, on dates each county treasurer sets (ARS 42-18112)"
    },
    {
      label: "What you bid",
      value: "The interest rate, starting at 16% simple per year and bidding down (ARS 42-18053, 42-18114)"
    },
    {
      label: "When you pay",
      value: "In cash, when the treasurer says, and no later than 15 days after the sale closes (ARS 42-18116)"
    },
    {
      label: "Fees",
      value: "A processing fee of up to $10 per lien (ARS 42-18116). Counties may add others. Confirm with your county treasurer"
    },
    {
      label: "Owner can redeem",
      value: "Any time until a treasurer’s deed is delivered or, if the holder sues to foreclose, until the court enters judgment (ARS 42-18152, 42-18206)"
    },
    {
      label: "Earliest foreclosure",
      value: "3 years after the sale (ARS 42-18201)"
    },
    {
      label: "Deadline to foreclose",
      value: "10 years, or the lien becomes void (ARS 42-18127, 42-18201)"
    },
    {
      label: "Unsold liens",
      value: "Go to the state. Anyone may buy them later from the treasurer (ARS 42-18113, 42-18122)"
    }
  ],
  steps: [
    {
      title: "Learn your county’s sale rules",
      detail: "Each county treasurer runs its own sale in February and publishes bidder rules. Many counties hold the sale online through a vendor such as RealAuction. Read the treasurer’s own rules page first. Example: Pima County’s 2026 sale was online only. Bidders had to register by a set date."
    },
    {
      title: "Research every parcel before you bid",
      detail: "You are buying a lien, not a house. Check the parcel map, legal description, zoning and access. Some parcels are slivers, drainage strips or land you could never use. Treasurers do not guarantee the title. Pima County warns that legal descriptions may be wrong and that other liens or special assessments may exist."
    },
    {
      title: "Bid the interest rate",
      detail: "You must pay all taxes, interest, penalties and charges due. The lien goes to the bidder who accepts the lowest interest rate. The rate cannot go above 16% (ARS 42-18114). Example: Pima County starts bidding at 16% and moves in 1% steps. A 0% bid is allowed. Popular parcels often get very low bids."
    },
    {
      title: "Pay on time",
      detail: "Pay the full amount in cash by the treasurer’s deadline, no later than 15 days after the sale closes. Add a processing fee of up to $10 per lien. If you don’t pay, the treasurer resells the lien if the sale is still open. If it has closed, the treasurer can sue you for the amount or bar you from Arizona tax lien sales for up to one year (ARS 42-18116)."
    },
    {
      title: "Hold the certificate and track redemptions",
      detail: "Interest runs at your bid rate from the first day of the month after you buy (ARS 42-18114). Any part of a month counts as a full month (ARS 42-18053). When the owner pays off the lien (redeems), the treasurer pays you what you paid plus interest. Processing fees are not paid back (ARS 42-18153)."
    },
    {
      title: "Decide on subsequent taxes",
      detail: "If later years’ taxes go unpaid, you may pay them too, starting June 1 after your purchase. That money earns your certificate’s interest rate, with a $5 fee each time (ARS 42-18121). Example: Pima County accepts these from June 1 through December 15."
    },
    {
      title: "After 3 years, decide whether to foreclose",
      detail: "If the lien is still unpaid, you may sue in superior court to foreclose, which ends the owner’s right to redeem. You have to name the county treasurer in the case and file within 10 years (ARS 42-18201). Most buyers hire an attorney for this."
    },
    {
      title: "Send the required notice first",
      detail: "At least 30 days, and no more than 180 days, before filing, a notice has to go by certified mail to the property owner and the county treasurer, at the addresses the law lists (ARS 42-18202). The notice tells the owner they may ask for an excess proceeds sale. Your attorney handles this. Never contact the owner in any other way."
    },
    {
      title: "Get the judgment, then the deed",
      detail: "If the court rules for you, it directs the treasurer to deliver a treasurer’s deed. The owner or the certificate holder can ask for an excess proceeds sale instead. If the property is likely to sell for more than $2,500 above what is owed, the court must order that sale. You are then paid from the sale instead of getting the deed, and the owner gets the surplus (ARS 42-18204). Other bidders at that sale must post a deposit of 10% of the opening bid or $2,500, whichever is more. It is returned to everyone except the winning bidder (ARS 42-18234). Buy title insurance before you spend money on the property."
    }
  ],
  survives: {
    wipedOut: [
      "The former owner’s ownership (right, title and interest), once the foreclosure judgment is final (ARS 42-18204)",
      "Your own lien, once it is redeemed or once you get the deed"
    ],
    mayStay: [
      "Easements on or benefiting the property (ARS 42-18204)",
      "Certain special assessment liens, such as improvement district liens (ARS 42-18204)",
      "County cleanup (abatement) liens for things like weeds, debris or unsafe buildings, through September 30, 2028 (ARS 42-18204, 11-268)",
      "Liens held by the state (ARS 42-17153)*. If the court orders an excess proceeds sale, it clears them, except assessments and property tax liens (ARS 42-18234)",
      "Other liens and title problems the court case did not clear. Get a title report and ask your attorney"
    ]
  },
  mistakes: [
    {
      mistake: "Treating the certificate as a way to get cheap property",
      prevent: "Owners usually pay off these liens. Plan for interest income. Bid only on parcels you would actually want to own."
    },
    {
      mistake: "Bidding on a parcel you never researched",
      prevent: "Check the map, access, zoning and legal description first. Skip slivers, common areas and land with no road access."
    },
    {
      mistake: "Missing the payment deadline",
      prevent: "Have the money ready before the sale. Late buyers can be sued and barred from Arizona sales for up to one year (ARS 42-18116)."
    },
    {
      mistake: "Letting the certificate expire",
      prevent: "Put the 10-year deadline on your calendar. After it, the lien is void and you lose your money (ARS 42-18127)."
    },
    {
      mistake: "Filing foreclosure without the 30-day notice",
      prevent: "Use an attorney who sends the required certified-mail notices. Without them, the court cannot enter judgment (ARS 42-18202)."
    },
    {
      mistake: "Ignoring bankruptcy",
      prevent: "Check whether the owner is in bankruptcy. Pima County warns that a bankruptcy court may cut your interest or refund. You also cannot foreclose during the bankruptcy stay."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Dana, a fictional buyer, bids on a lien for about $1,800 on a small house lot. Several bidders compete, and she wins at 6%. Fourteen months later the owner pays the taxes through the treasurer. Dana receives her $1,800 back plus 6% simple interest for 14 months, about $126. Her processing fee is not refunded.",
    lesson: "A tax lien usually ends with a modest interest payment, not a house. Low winning rates mean low returns. Bid only where the numbers still make sense."
  },
  sources: [
    {
      label: "ARS 42-18112: Tax lien sale held in February",
      url: "https://www.azleg.gov/ars/42/18112.htm"
    },
    {
      label: "ARS 42-18114: Successful purchaser; lowest interest rate",
      url: "https://www.azleg.gov/ars/42/18114.htm"
    },
    {
      label: "ARS 42-18116: Payment within 15 days; processing fee",
      url: "https://www.azleg.gov/ars/42/18116.htm"
    },
    {
      label: "ARS 42-18121: Payment of subsequent taxes",
      url: "https://www.azleg.gov/ars/42/18121.htm"
    },
    {
      label: "ARS 42-18122: Resale of tax liens assigned to the state",
      url: "https://www.azleg.gov/ars/42/18122.htm"
    },
    {
      label: "ARS 42-18153: Redemption amount",
      url: "https://www.azleg.gov/ars/42/18153.htm"
    },
    {
      label: "ARS 42-18201: Foreclosure action: 3 and 10 years",
      url: "https://www.azleg.gov/ars/42/18201.htm"
    },
    {
      label: "ARS 42-18202: 30-day notice before filing",
      url: "https://www.azleg.gov/ars/42/18202.htm"
    },
    {
      label: "ARS 42-18204: Judgment, treasurer’s deed, excess proceeds sale",
      url: "https://www.azleg.gov/ars/42/18204.htm"
    },
    {
      label: "Pima County Treasurer: Tax Lien Sale (county example)",
      url: "https://www.to.pima.gov/taxLienSale/"
    }
  ],
  team: [TEAM.attorney, TEAM.title, TEAM.cpa],
  lastReviewed: REVIEWED,
  state: 'AZ'
},
{
  key: "azforeclosure",
  title: "Arizona trustee sales",
  short: "Trustee sales",
  oneLine: "Most Arizona home loans use a deed of trust. When the owner falls behind, the trustee can sell the home at a public auction without a court case. The sale is final, with no redemption.",
  youGet: "A trustee’s deed, which the trustee records after you pay. The sale is final. Liens recorded ahead of the deed of trust (senior liens) stay with the property, and you have to handle any occupants yourself.",
  plain: 'The house, and the sale is final. Debts recorded ahead of the loan stay with it. You handle anyone still living there.',
  forSale: true,
  glance: [
    {
      label: "Earliest sale",
      value: "The 91st day after the notice of sale is recorded (ARS 33-808)"
    },
    {
      label: "Notice",
      value: "Posted at least 20 days before the sale. Published once a week for 4 weeks in a row (ARS 33-808)"
    },
    {
      label: "Sale hours",
      value: "9 a.m. to 5 p.m. MST, not on Saturdays or legal holidays (ARS 33-808)"
    },
    {
      label: "Deposit to bid",
      value: "$10,000, in a form the trustee accepts (ARS 33-810)"
    },
    {
      label: "Balance due",
      value: "By 5 p.m. MST the next business day (ARS 33-811)"
    },
    {
      label: "Redemption",
      value: "None. Once the sale is over, the owner can’t buy it back (ARS 33-811). But if the sale wiped out a junior federal tax lien, the United States may buy it back within 120 days (26 USC 7425(d)). A lien the sale didn’t wipe out (for example, the IRS didn’t get the required notice) stays on title (26 USC 7425(b))"
    },
    {
      label: "Deed",
      value: "The trustee sends it to be recorded within 7 business days after you pay (ARS 33-811)"
    },
    {
      label: "Can the owner stop it?",
      value: "Yes. The owner can catch up on the loan (reinstate) before 5 p.m. MST on the last business day before the sale (ARS 33-813)"
    }
  ],
  steps: [
    {
      title: "Find the notice of trustee’s sale",
      detail: "The trustee records the notice with the county recorder, posts it and publishes it in a newspaper. The notice lists the date, time, place, legal description and parcel number. It also gives the trustee’s phone number (ARS 33-808). Work only with the trustee. Never contact the homeowner."
    },
    {
      title: "Expect postponements or cancellation",
      detail: "The owner or a junior lienholder can catch up the loan (reinstate) until 5 p.m. MST on the last business day before the sale (ARS 33-813). The trustee can also postpone a sale by announcing a new date within 90 calendar days (ARS 33-810). Call the trustee the day before and the morning of the sale."
    },
    {
      title: "Research title and the property",
      detail: "Order a title report. The sale clears liens that rank behind the deed of trust (junior liens), but not the ones ahead of it (senior liens) (ARS 33-811). Look at the outside of the property from the street only. You usually cannot go inside, so price in repairs you cannot see."
    },
    {
      title: "Bring the deposit",
      detail: "Before bidding, every bidder except the lender has to give the trustee a $10,000 deposit, in a form the trustee accepts (ARS 33-810). Ask the trustee ahead of time which forms they take, such as a cashier’s check."
    },
    {
      title: "Bid at the auction",
      detail: "The trustee or its agent runs a public auction and sells to the highest bidder. Only the lender (the beneficiary) can bid with credit instead of cash (ARS 33-810). The lender’s credit bid often sets the opening price."
    },
    {
      title: "Pay the balance by 5 p.m. the next business day",
      detail: "Pay the rest of your bid by 5 p.m. MST on the next business day, in a form the trustee accepts. If you don’t, you lose your deposit. You may also owe for the trustee’s losses and attorney fees. And you can be barred from the trustee’s future sales (ARS 33-811)."
    },
    {
      title: "Receive the trustee’s deed",
      detail: "The trustee sends the deed to be recorded within 7 business days after you pay. Once it is recorded, it counts as delivered to you. The owner has no right to buy the property back (ARS 33-811)."
    },
    {
      title: "Deal with occupants lawfully",
      detail: "A bona fide (genuine) tenant generally gets at least 90 days’ notice under the federal Protecting Tenants at Foreclosure Act. The tenant may stay to the end of the lease unless you will live there. For anyone else, give a written demand for possession. If they stay, you file a forcible detainer (eviction) case in court (ARS 12-1173.01). Never change locks or remove belongings yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The deed of trust being foreclosed",
      "Liens and interests junior to that deed of trust (ARS 33-811)",
      "The former owner’s right to get the property back. There is no redemption (ARS 33-811), except that the United States may redeem within 120 days if the sale wiped out a junior federal tax lien (26 USC 7425(d))"
    ],
    mayStay: [
      "Liens senior to the foreclosed deed of trust, such as an earlier mortgage (ARS 33-811)",
      "Property taxes, which are a lien ahead of almost all others (ARS 42-17153)",
      "Leases and other rights to occupy the property that rank ahead of the interest sold (ARS 12-1173.01)",
      "Bona fide tenants’ federal 90-day notice rights"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming you buy the house free and clear",
      prevent: "Order a title report before the sale. If the deed of trust being foreclosed is a second loan, the first loan stays on the house."
    },
    {
      mistake: "Showing up without the right deposit",
      prevent: "Call the trustee ahead of time. Bring $10,000 in the exact form they accept."
    },
    {
      mistake: "Not having the rest of the money by the next day",
      prevent: "Have cash or a lender ready before you bid. Missing the 5 p.m. deadline costs you the $10,000 deposit."
    },
    {
      mistake: "Driving to a sale that was cancelled",
      prevent: "Confirm with the trustee the day before and the morning of the sale. Owners can reinstate until 5 p.m. the last business day before."
    },
    {
      mistake: "Removing occupants yourself",
      prevent: "Make a written demand, then use a forcible detainer (eviction) case. Give genuine (bona fide) tenants the 90 days federal law requires."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Sam, a fictional buyer, plans to bid on a house at a trustee’s sale. His title report shows the loan being foreclosed is a second mortgage. A first mortgage of $210,000 is recorded ahead of it. The lender opens with a credit bid of $45,000. Sam realizes that if he wins at $60,000, he still takes the house subject to the $210,000 first loan. He stops bidding.",
    lesson: "A trustee sale only clears liens junior to the loan being foreclosed. Before you bid, find out which loan is being foreclosed and what comes ahead of it."
  },
  sources: [
    {
      label: "ARS 33-808: Notice of trustee’s sale",
      url: "https://www.azleg.gov/ars/33/00808.htm"
    },
    {
      label: "ARS 33-810: Sale procedure; $10,000 deposit; credit bids",
      url: "https://www.azleg.gov/ars/33/00810.htm"
    },
    {
      label: "ARS 33-811: Payment, trustee’s deed, no redemption",
      url: "https://www.azleg.gov/ars/33/00811.htm"
    },
    {
      label: "ARS 33-812: Application of sale proceeds",
      url: "https://www.azleg.gov/ars/33/00812.htm"
    },
    {
      label: "ARS 33-813: Reinstatement before the sale",
      url: "https://www.azleg.gov/ars/33/00813.htm"
    },
    {
      label: "ARS 12-1173.01: Forcible detainer after a sale",
      url: "https://www.azleg.gov/ars/12/01173-01.htm"
    },
    {
      label: "ARS 42-17153: Property tax lien priority",
      url: "https://www.azleg.gov/ars/42/17153.htm"
    },
    {
      label: "Federal Reserve CA 18-4: Protecting Tenants at Foreclosure Act restored",
      url: "https://www.federalreserve.gov/supervisionreg/caletters/caltr1804.htm"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: REVIEWED,
  state: 'AZ'
},
{
  key: "azsheriff",
  title: "Arizona sheriff sales",
  short: "Sheriff sales",
  teaser: "After a court judgment, the sheriff sells real property at a public auction. In most cases the owner can still buy it back (redeem).",
  oneLine: "After a court judgment, the sheriff sells real property at a public auction near the courthouse. In most cases the owner can still buy it back (redeem). So you get a certificate of sale first and a sheriff’s deed later.",
  youGet: "A certificate of sale right after you pay. You get a sheriff’s deed only after every redemption period ends with no one buying the property back. If someone redeems, you get your price back plus 8%.",
  plain: 'A certificate right after you pay. The deed comes only if no one buys the house back in time. If someone does, you get your price back plus 8%.',
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county sheriff, under a court order or writ"
    },
    {
      label: "Notice",
      value: "Posted in 3 public places for at least 15 days. Published 3 weeks in a row (ARS 12-1621)"
    },
    {
      label: "Where and when",
      value: "At or near the courthouse door, between 10 a.m. and 4 p.m. (ARS 12-1621, 12-1622)"
    },
    {
      label: "Payment",
      value: "Within 5 working days after the sale, unless the sheriff agrees in writing to more time (ARS 12-1624)"
    },
    {
      label: "Right after the sale",
      value: "You get a certificate of sale, and a copy is recorded (ARS 12-1626)"
    },
    {
      label: "Redemption period",
      value: "30 days if the judgment found the property both abandoned and not used mainly for farming or grazing. Otherwise 6 months. Then junior creditors can redeem in turn, 5 days each (ARS 12-1282)"
    },
    {
      label: "Redemption price",
      value: "Your price plus 8%, plus taxes or assessments you paid, with interest (ARS 12-1285)"
    },
    {
      label: "Deed",
      value: "A sheriff’s deed, once all redemption periods end (ARS 12-1286)"
    }
  ],
  steps: [
    {
      title: "Know which kind of sale it is",
      detail: "A judicial foreclosure sale sells the property to pay a mortgage or other lien the court foreclosed. An execution sale sells a debtor’s property to pay a money judgment. In both, you buy only the debtor’s rights in the property (right, title and interest) (ARS 12-1626). When a judgment creditor sells someone’s home to pay a money judgment, no bid can be accepted unless it is more than the homestead exemption (at least $400,000, adjusted each year) plus earlier mortgages and costs (ARS 33-1101, 33-1105)."
    },
    {
      title: "Find the notice of sale",
      detail: "The sheriff posts notice in three public places for at least 15 days. One is at or near the courthouse door. The sheriff also publishes it in a newspaper for three weeks in a row (ARS 12-1621). Example: the Pima County Sheriff posts real property sale notices online. It holds sales on the east steps of the Superior Court. Confirm your county’s practice with the sheriff’s civil unit."
    },
    {
      title: "Read the judgment and pull title",
      detail: "Get the court case number from the notice and read the judgment. It says what is being sold. It also says whether the court found the property both abandoned and not used mainly for farming or grazing. Order a title report to see which liens come before the one being foreclosed."
    },
    {
      title: "Confirm the sale is still on",
      detail: "The sheriff can postpone a sale by reposting and republishing the notice with the new date (ARS 12-1623). Call the sheriff’s civil unit before you go."
    },
    {
      title: "Bid at the auction",
      detail: "The sheriff sells at public auction to the highest bidder between 10 a.m. and 4 p.m. (ARS 12-1622). Ask the sheriff ahead of time what payment forms they accept."
    },
    {
      title: "Pay within 5 working days",
      detail: "Pay within five working days after the sale. If you don’t, the sheriff offers the property to the second-highest bidder. You can also owe for other people’s losses and attorney fees (ARS 12-1624)."
    },
    {
      title: "Get and record your certificate of sale",
      detail: "The sheriff gives you a certificate of sale and records a duplicate (ARS 12-1626). It shows the property, the price and whether it can be redeemed."
    },
    {
      title: "Wait out the redemption period",
      detail: "The owner can redeem within 6 months, or within 30 days if the judgment found the home both abandoned and not used mainly for farming or grazing. After that, creditors with junior liens may redeem one after another, in order of priority, each within 5 days after the one before, so each one can add up to 5 days to your wait (ARS 12-1282). If anyone redeems, you get your price plus 8%. You also get back taxes or assessments you paid, with interest (ARS 12-1285). Keep receipts."
    },
    {
      title: "Receive the sheriff’s deed",
      detail: "When all redemption periods end, the sheriff signs the deed to you (or to the last person who redeemed). The sheriff records it within 30 days (ARS 12-1286). If occupants stay after a written demand, file a forcible detainer (eviction) case (ARS 12-1173.01). If the sale forecloses a mortgage on a rented home, federal law usually lets a genuine tenant stay until the lease ends, or 90 days after a notice to vacate if that is later. A buyer who will live there can end the lease with 90 days’ notice (Protecting Tenants at Foreclosure Act)."
    }
  ],
  survives: {
    wipedOut: [
      "The judgment debtor’s interest in the property, once the sheriff’s deed is issued (ARS 12-1626, 12-1286)",
      "In a foreclosure, the lien being foreclosed. Which junior liens are cut off depends on the judgment. Ask your title company"
    ],
    mayStay: [
      "Liens and mortgages senior to the one foreclosed, or not foreclosed by the judgment",
      "Property taxes, which are a lien ahead of almost all others (ARS 42-17153)",
      "Leases and other rights to occupy the property that rank ahead of the interest sold (ARS 12-1173.01)",
      "The owner’s and junior creditors’ redemption rights until the periods end (ARS 12-1282)"
    ]
  },
  mistakes: [
    {
      mistake: "Thinking you own the property the day of the sale",
      prevent: "You get a certificate of sale first. Plan to wait 30 days or 6 months. Also plan for the chance you are simply paid back with 8%."
    },
    {
      mistake: "Buying at an execution sale without checking mortgages",
      prevent: "You get only the debtor’s interest. Pull title so you know which mortgages and liens stay on the property."
    },
    {
      mistake: "Missing the 5-working-day payment deadline",
      prevent: "Have funds ready before bidding. Late buyers can owe the losses and attorney fees their default causes (ARS 12-1624)."
    },
    {
      mistake: "Not keeping receipts for taxes you pay during redemption",
      prevent: "Keep proof. Taxes and assessments you lawfully pay are added to the redemption price with interest (ARS 12-1285)."
    },
    {
      mistake: "Removing occupants yourself",
      prevent: "After the sheriff’s deed, make a written demand and use a forcible detainer case if needed."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Jordan, a fictional buyer, wins a sheriff’s foreclosure sale at $150,000. Jordan pays within five working days. The court did not find the home abandoned, so the redemption period is 6 months. In month five, the owner redeems. Jordan receives $150,000 plus 8% ($12,000). Jordan also gets back the $1,400 in property taxes Jordan paid, with interest.",
    lesson: "At a sheriff’s sale with redemption, you may end up with a fixed return instead of the property. Budget for both outcomes."
  },
  sources: [
    {
      label: "ARS 12-1282: Redemption periods: 30 days or 6 months",
      url: "https://www.azleg.gov/ars/12/01282.htm"
    },
    {
      label: "ARS 12-1285: Redemption price: plus 8%",
      url: "https://www.azleg.gov/ars/12/01285.htm"
    },
    {
      label: "ARS 12-1286: Sheriff’s deed",
      url: "https://www.azleg.gov/ars/12/01286.htm"
    },
    {
      label: "ARS 12-1621: Notice of execution sale of real property",
      url: "https://www.azleg.gov/ars/12/01621.htm"
    },
    {
      label: "ARS 12-1622: Sale procedure",
      url: "https://www.azleg.gov/ars/12/01622.htm"
    },
    {
      label: "ARS 12-1624: Payment within 5 working days",
      url: "https://www.azleg.gov/ars/12/01624.htm"
    },
    {
      label: "ARS 12-1626: Certificate of sale; what the buyer gets",
      url: "https://www.azleg.gov/ars/12/01626.htm"
    },
    {
      label: "ARS 12-1173.01: Forcible detainer after a sale",
      url: "https://www.azleg.gov/ars/12/01173-01.htm"
    },
    {
      label: "Pima County Sheriff: Civil Enforcement (county example)",
      url: "https://pimasheriff.org/services/civil-enforcement"
    }
  ],
  team: [TEAM.attorney, TEAM.title, TEAM.insurance, TEAM.eviction, TEAM.contractor, TEAM.lender],
  lastReviewed: REVIEWED,
  state: 'AZ'
},
{
  key: "uttax",
  title: "Utah tax sales",
  short: "Tax sales",
  oneLine: "When property taxes are still unpaid four years after they first went delinquent (usually five years of taxes by sale day), the county auditor auctions the property. Sales happen once a year, for at least what is owed.",
  youGet: "A tax deed from the county. It is not a warranty deed, and the county makes no promises about title or possession.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The county auditor in the county where the property sits (in Davis County, the Controller)."
    },
    {
      label: "When",
      value: "Once a year, in May or June. Each auditor picks the date. Confirm in your county auditor’s notice."
    },
    {
      label: "What gets it on the list",
      value: "Property taxes that have been past due for four years and still aren’t paid by March 15 (Utah Code 59-2-1343)."
    },
    {
      label: "Minimum bid",
      value: "All past-due taxes, tax notice charges, penalties, interest and administrative costs (59-2-1351.1)."
    },
    {
      label: "Owner’s last chance",
      value: "Anyone may pay what’s owed for the owner (redeem) at any time before the sale (59-2-1346). After it, the owner can’t buy it back. But if the sale wiped out a junior federal tax lien, the United States may redeem within 120 days (26 USC 7425(d)). Some counties, like Utah County, wait 120 days to ratify those bids."
    },
    {
      label: "What you get",
      value: "A tax deed. The county records it after the county governing body accepts your bid."
    },
    {
      label: "Can you back out?",
      value: "No. Once the auditor closes the sale on a parcel, you cannot rescind your bid (59-2-1351.1(6))."
    },
    {
      label: "Payment",
      value: "Set by each county. No financing. Confirm in your county auditor’s notice."
    }
  ],
  steps: [
    {
      title: "Know how a property reaches the sale",
      detail: "Utah property taxes are due November 30. If the taxes stay unpaid and the property is not redeemed by March 15 after four years, the county treasurer puts it on the tax sale listing and sends it to the county auditor."
    },
    {
      title: "Watch for the auditor’s notice",
      detail: "The auditor mails notice to the owner, any occupant and anyone else with a recorded interest. The auditor also publishes notice for about four weeks before the sale. In the largest county class, it goes on the county website. Elsewhere, it goes in a newspaper and on the state public notice website. The notice lists the parcel number or address and the date, time and place."
    },
    {
      title: "Register the way your county requires",
      detail: "Counties differ. Salt Lake County (2026) ran its sale online only. It required advance registration and a $500 refundable deposit by wire. Utah County holds its sale online on the third Thursday of May. Bidders register with the county’s auction vendor, which may charge fees or require a deposit, so check the vendor’s terms before you bid.* Davis County has held an in-person sale in Farmington. Confirm in your county auditor’s notice."
    },
    {
      title: "Research every parcel before you bid",
      detail: "Counties tell buyers to do their own research (due diligence). Pull the recorded documents and check the legal description. Look for easements and other liens, and drive by from the street. Ask a title company whether it will insure a tax deed from this county. The owner may still redeem up to the start of the sale, so some parcels will be pulled."
    },
    {
      title: "Bid at or above the minimum",
      detail: "No bid below the full amount owed is accepted. The county may accept the highest bid for the whole parcel. State law also lets the county accept a bid that pays the full amount for the smallest part of the parcel. Then the rest counts as redeemed by the owner. Some counties (Utah County) sell an undivided percentage instead: the lowest percentage wins, and you co-own the parcel with the former owner. If you buy 49% or less, a later sale pays you only your price plus 12% or your pro-rata share, whichever is greater (Utah Code 59-2-1351.7). Check the bid type on each parcel. The county may reject all bids."
    },
    {
      title: "Pay on the county’s deadline",
      detail: "Payment rules are local. Salt Lake County requires the $500 deposit by wire, adds a 5% buyer’s premium, and doesn’t credit the deposit to your purchase. Davis County has required cash or check in person right after the auction. Utah County says it will not finance. The county can get a court judgment against a winning bidder who does not pay."
    },
    {
      title: "Wait for ratification and your deed",
      detail: "First the county’s governing body approves (ratifies) the bids. The auditor then signs a tax deed in the county’s name, and the county recorder records it. Salt Lake County mails the deed after the council ratifies the sale, within 60 days after the sale. Utah County says 60 to 180 days after the sale."
    },
    {
      title: "Get title insurance and handle possession lawfully",
      detail: "The county makes no promises about your right to possession. If someone lives there, talk to an attorney. Use the court’s eviction process. Never change locks or remove belongings on your own."
    },
    {
      title: "If there were no bids, ask about county-owned parcels",
      detail: "Parcels with no buyer go to the county (struck off). The county may later sell them at a price and on terms its governing body sets (59-2-1351.5). Ask your county how it offers these parcels."
    }
  ],
  survives: {
    wipedOut: [
      "The unpaid property taxes, penalties, interest and costs your bid pays",
      "The former owner’s right to redeem (it ends when the sale starts)"
    ],
    mayStay: [
      "Easements and other recorded claims on the property (encumbrances). Utah County warns that buyers take on the risk of liens, easements and encumbrances.",
      "Liens the county does not clear by its sale. Ask a title company which recorded liens it would still list.",
      "Occupants. The county makes no promise about possession.",
      "A junior federal tax lien’s redemption right. If the sale wiped out a federal tax lien, the United States may redeem within 120 days (26 USC 7425(d)). Some counties, like Utah County, wait 120 days to ratify those bids.",
      "A court challenge to the tax deed for up to four years, or longer if the owner stayed in possession (Utah Code 78B-2-206)."
    ]
  },
  mistakes: [
    {
      mistake: "Treating the tax deed like a warranty deed",
      prevent: "Read the county’s rules. Tax deeds come with no warranties. Get a title report and ask whether a title insurer will cover the parcel."
    },
    {
      mistake: "Bidding far over the minimum without knowing the risk",
      prevent: "If the tax title is later found invalid, your claim is limited to a lien for the smaller of two amounts: the taxes, interest and penalties, or what you paid (59-2-1352). Bid only what you can afford to lose while title is uncertain."
    },
    {
      mistake: "Missing the county’s deposit or payment rules",
      prevent: "Read the auditor’s notice early. Check the deposit deadline, payment method and buyer’s premium. Check whether the deposit counts toward your purchase."
    },
    {
      mistake: "Counting on a parcel that disappears",
      prevent: "Anyone can pay what’s owed for the owner until the sale begins. Check the updated list the morning of the sale."
    },
    {
      mistake: "Assuming you can move in right away",
      prevent: "Wait for the recorded deed. If the home is occupied, hire an attorney and use the court process."
    },
    {
      mistake: "Skipping the legal description",
      prevent: "The auditor has to refuse to sell a parcel whose description would pass no title. Still, confirm the description matches the land you think you are buying."
    }
  ],
  example: {
    title: "Illustrative example: a vacant lot in a fictional Utah county",
    story: "Jordan, a made-up buyer, found a vacant lot on the county auditor’s May sale list. The minimum bid was $4,200. Jordan pulled the recorded documents and found a utility easement across the back. A title company said it would review the parcel after the deed was recorded. Jordan bid $9,000 and won. Jordan wired payment the same day under the county’s rules. The recorded tax deed arrived about two months later.",
    lesson: "Know the county’s payment rules before you bid, and price in title risk. A tax deed carries no warranties. Easements can stay with the land."
  },
  sources: [
    {
      label: "Utah Code 59-2-1343 (tax sale listing)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1343.html"
    },
    {
      label: "Utah Code 59-2-1346 (redemption before sale)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1346.html"
    },
    {
      label: "Utah Code 59-2-1351 (notice of tax sale, May or June)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1351.html"
    },
    {
      label: "Utah Code 59-2-1351.1 (bids, excess funds, tax deed)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1351.1.html"
    },
    {
      label: "Utah Code 59-2-1351.3 and 1351.5 (struck off to county)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1351.5.html"
    },
    {
      label: "Utah Code 59-2-1352 (invalid tax title lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1352.html"
    },
    {
      label: "Utah Code 78B-2-206 (time limit to challenge a tax title)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter2/78B-2-S206.html"
    },
    {
      label: "Salt Lake County tax sale procedures and rules",
      url: "https://saltlakecounty.gov/property-tax/property-tax-sale/procedures-and-rules"
    },
    {
      label: "Utah County May tax sale policies",
      url: "https://auditor.utahcounty.gov/may-tax-sale/policies"
    },
    {
      label: "Utah Code 59-2-1351.7 (undivided interest buyers)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1351.7.html"
    },
    {
      label: "Utah County tax sale excess funds (120-day wait for federal tax liens)",
      url: "https://auditor.utahcounty.gov/may-tax-sale/excess-funds"
    },
    {
      label: "26 USC 7425 (federal tax lien redemption after a nonjudicial sale)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "Davis County tax sale FAQ",
      url: "https://www.daviscountyutah.gov/controller/tax-administration-group/tax-sale/tax-sale-faq"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: REVIEWED,
  state: 'UT'
},
{
  key: "utforeclosure",
  title: "Utah trustee sales",
  short: "Trustee sales",
  oneLine: "Most Utah home loans use a trust deed. That lets the trustee sell the home at a public auction without a court case.",
  youGet: "A trustee’s deed. Once the sale is over, the owner can’t buy it back. You get the owner’s interest, and the sale wipes out interests that came after the loan being foreclosed. The one exception is a junior federal tax lien the sale wiped out: the United States may still buy the home back within 120 days (26 USC 7425(d)). If the IRS didn’t get the required notice, the sale doesn’t wipe its lien out, and the lien stays on title (26 USC 7425(b)).",
  plain: 'The house, with no buy-back period. The sale clears debts recorded after the loan being foreclosed.',
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The trustee named in the trust deed, or the trustee’s attorney, acting as auctioneer."
    },
    {
      label: "Earliest sale",
      value: "The notice of default is recorded first. At least three months later, the trustee may give notice of sale (Utah Code 57-1-24)."
    },
    {
      label: "Notice of sale",
      value: "Published once a week for three weeks in a newspaper, with the last one 10 to 30 days before the sale, and on the state’s public notice website for 30 days before. Also posted on the property and at the county recorder at least 20 days before (57-1-25)."
    },
    {
      label: "Where and when",
      value: "At a courthouse serving the county, between 8 a.m. and 5 p.m., as stated in the notice."
    },
    {
      label: "Deposit",
      value: "Only if the notice of sale sets one. The trustee may require it from the winning bidder (57-1-27)."
    },
    {
      label: "Payment",
      value: "In U.S. money, however the trustee directs. Read the notice and call the trustee’s office before the sale."
    },
    {
      label: "Deed",
      value: "The trustee records the deed within five business days after you pay (57-1-28)."
    },
    {
      label: "Redemption",
      value: "None. Once the sale is over, the owner can’t buy it back. If the sale wiped out a junior federal tax lien, the United States may buy it back within 120 days (26 USC 7425(d)). If the IRS didn’t get the required notice, its lien isn’t wiped out and stays on title instead (26 USC 7425(b))."
    }
  ],
  steps: [
    {
      title: "Learn the timeline",
      detail: "If the home is the owner’s main home, the loan was for personal or household purposes, and the lender is a bank, credit union or similar, the lender first sends the owner a notice giving at least 30 days to catch up (Utah Code 57-1-24.3). A servicer that follows the federal servicing rules is treated as complying, and a missed step doesn’t undo a sale to an outside buyer (Utah Code 57-1-24.3(12), (13)).* After a default (missed payments), the trustee records a notice of default with the county recorder. The owner, or anyone holding a later (junior) lien, can catch up and fix the default within three months of that recording. After at least three months, the trustee may give notice of sale."
    },
    {
      title: "Find sales through official notices",
      detail: "Read the notice of trustee’s sale in the newspaper, on the Utah public notice website, or posted at the county recorder. The notice gives the time, the courthouse and the legal description. It also names the current beneficiary (lender) and any deposit required."
    },
    {
      title: "Research the property and the title",
      detail: "Order a title report. Find out which loan is being foreclosed, and which liens are older than it. Look at the home only from the street. Do not contact the owner or occupants."
    },
    {
      title: "Check the deposit and payment rules",
      detail: "Utah law lets the trustee require a deposit, set in the notice, and says you pay the way the trustee directs. Call the trustee’s office listed on the notice. Ask what funds they accept and by when."
    },
    {
      title: "Bid at the courthouse",
      detail: "The trustee or its attorney runs the auction. Anyone may bid, including the lender. The lender can bid what it is owed plus costs instead of cash (a credit bid). Every bid is binding and final. You can’t take it back (irrevocable)."
    },
    {
      title: "Expect postponements",
      detail: "The trustee may postpone for any reason by announcing it at the time and place of sale. No new notice is needed unless the sale moves more than 45 days past the date in the original notice (57-1-27)."
    },
    {
      title: "Pay and get your deed",
      detail: "If you win, pay as directed. If you refuse to pay, you lose the deposit and owe for the trustee’s losses. Within five business days after you pay, the trustee has to send the trustee’s deed for recording. You can ask for an unrecorded copy."
    },
    {
      title: "Handle occupants through the court",
      detail: "On residential rental property, the posted notice tells tenants about their federal rights. Federal law may let them stay until the lease ends or 90 days after a notice to vacate, whichever is later. A buyer who will live in the home can end the lease with 90 days’ notice. If anyone refuses to leave, hire an attorney for an unlawful detainer (eviction) case. Never use self-help, like changing the locks or removing belongings."
    }
  ],
  survives: {
    wipedOut: [
      "The trust deed being foreclosed",
      "The owner’s rights and the rights of anyone claiming through the owner. This includes later trust deeds and liens recorded after the foreclosed loan",
      "The former owner’s right to buy it back: Utah trustee sales have none (57-1-28). If the sale wiped out a junior federal tax lien, the United States can still redeem within 120 days (26 USC 7425(d))"
    ],
    mayStay: [
      "Older (senior) trust deeds and liens recorded before the loan being foreclosed",
      "Property tax liens, which attach every January 1",
      "Easements and other recorded encumbrances",
      "Tenants with protected leases or a right to a notice to vacate"
    ]
  },
  mistakes: [
    {
      mistake: "Bidding on a junior loan without knowing it",
      prevent: "Get a title report. If the loan being foreclosed is a second loan, the first loan stays on the property, and you take the home with that debt still on it."
    },
    {
      mistake: "Showing up without the right funds",
      prevent: "Call the trustee’s office before the sale. Confirm the deposit amount in the notice. Ask what payment they accept."
    },
    {
      mistake: "Treating a bid as something you can take back",
      prevent: "Utah treats every bid as final (irrevocable). Set your maximum before you arrive and stop there."
    },
    {
      mistake: "Assuming a postponed sale needs new notice",
      prevent: "A new notice is needed only if the sale moves more than 45 days past the date in the original notice. Go on the announced date, or ask the trustee."
    },
    {
      mistake: "Forcing occupants out",
      prevent: "Use the court’s unlawful detainer process with an attorney. Respect tenant notice rights."
    },
    {
      mistake: "Ignoring surplus rules",
      prevent: "Any money left after the debt and costs goes to the people legally entitled to it, or to the district court clerk. That is not the buyer’s business, and you should not contact former owners about it."
    }
  ],
  example: {
    title: "Illustrative example: a postponed trustee sale",
    story: "Riley, a made-up investor, read a notice of trustee’s sale for a condo. The notice required a $5,000 deposit by cashier’s check. At the courthouse the trustee announced a two-week postponement. Riley came back on the new date and won at $210,000. Riley paid the balance as the trustee directed. A recorded trustee’s deed arrived about a week later. Riley’s title report had already shown that the foreclosing loan was the first trust deed.",
    lesson: "Read the notice, confirm funds with the trustee, and check lien priority before bidding. Postponements under 45 days are announced only at the sale."
  },
  sources: [
    {
      label: "Utah Code 57-1-23 (trustee power of sale)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S23.html"
    },
    {
      label: "Utah Code 57-1-24 (notice of default, three months)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S24.html"
    },
    {
      label: "Utah Code 57-1-24.3 (lender's 30-day notice before default, owner-occupied homes)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S24.3.html"
    },
    {
      label: "Utah Code 57-1-25 (notice of sale, tenant notice)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S25.html"
    },
    {
      label: "Utah Code 57-1-27 (auction, deposit, postponement)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S27.html"
    },
    {
      label: "Utah Code 57-1-28 (payment, trustee’s deed, no redemption)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S28.html"
    },
    {
      label: "Utah Code 57-1-29 (sale proceeds)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S29.html"
    },
    {
      label: "Utah Code 57-1-31 (reinstatement within three months)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S31.html"
    },
    {
      label: "Utah Code 78B-6-802 (unlawful detainer)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S802.html"
    },
    {
      label: "Utah Code 59-2-1325 (property tax lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1325.html"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: REVIEWED,
  state: 'UT'
},
{
  key: "utsheriff",
  title: "Utah sheriff sales",
  short: "Sheriff sales",
  oneLine: "When a court orders property sold to pay a judgment or foreclose a mortgage, the sheriff auctions it. The owner then has 180 days to buy it back (redeem).",
  youGet: "A certificate of sale right away. Then, if no one buys the property back during the 180-day redemption period, you get the deed (conveyance) when it ends.",
  plain: 'A certificate right away. Then the deed after 180 days, if no one buys the house back.',
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The sheriff (the officer named in the writ or court order)."
    },
    {
      label: "Why it happens",
      value: "A writ of execution on a money judgment, or a court judgment foreclosing a mortgage or lien (Utah Code 78B-6-901)."
    },
    {
      label: "Notice",
      value: "Posted for at least 21 days on the property, the place of sale, the district courthouse and three other public places. Also published once a week for three weeks before the sale (URCP 69B)."
    },
    {
      label: "Where and when",
      value: "At the district courthouse of the county, Monday to Saturday except holidays, 9 a.m. to 8 p.m."
    },
    {
      label: "Bids",
      value: "Every bid is final (irrevocable). If you win and refuse to pay, you owe the difference if the property later sells for less."
    },
    {
      label: "Redemption",
      value: "180 days after the sale. To redeem, someone pays the sale price plus 6%, plus recorded costs plus 6% (URCP 69C)."
    },
    {
      label: "What you get at the sale",
      value: "A certificate of sale. The sheriff records a duplicate with the county recorder."
    },
    {
      label: "Postponement",
      value: "Announced at the sale. A delay of over 72 hours needs a new notice."
    }
  ],
  steps: [
    {
      title: "Understand where the sale comes from",
      detail: "A creditor with a judgment gets a writ of execution, or a lender wins a court foreclosure. The court tells the sheriff to sell under the rules for execution sales. A trust deed can also be foreclosed this way if the lender chooses court."
    },
    {
      title: "Find the notice",
      detail: "At least 21 days before the sale, the sheriff posts the notice in several places. These are the property, the place of sale, the district courthouse and three other public places. It is also published once a week for three weeks in a local newspaper. Your county sheriff’s civil office can tell you how it lists sales."
    },
    {
      title: "Research the case and the title",
      detail: "Read the court case. The sale transfers only the defendant’s rights in the property (right, title and interest). Get a title report to see which liens are older than the one being enforced. Look at the property from the street only."
    },
    {
      title: "Confirm payment terms with the sheriff",
      detail: "The court rules say the sheriff gives you the certificate when you pay your bid. Each sheriff sets how and when you pay. Call the sheriff’s civil office before the sale."
    },
    {
      title: "Bid at the courthouse",
      detail: "Sales are public auctions to the highest bidder. The sheriff sells only as much property as needed to pay the amount due. Separate lots are sold separately. The sheriff may not bid."
    },
    {
      title: "Get and record the certificate of sale",
      detail: "After you pay, the sheriff gives you a certificate of sale for each parcel. It states the price and whether the sale is subject to redemption. The sheriff records a duplicate with the county recorder."
    },
    {
      title: "Wait out the 180-day redemption period",
      detail: "The defendant, or a creditor with a junior lien, may buy the property back within 180 days. If you pay taxes, insurance, repairs or other liens, record a notice of those amounts with the county recorder. Otherwise you cannot add them to the redemption price. You get to collect rent during this time, but it is subtracted from the redemption price."
    },
    {
      title: "Receive your deed",
      detail: "If no one redeems, you (or the last creditor who redeemed) get the deed when the redemption period ends. If the owner redeems, the sale is undone. You get your price plus 6% and recorded costs."
    },
    {
      title: "Take possession lawfully",
      detail: "If occupants remain, work with an attorney and use the court process. Do not use self-help, such as changing the locks. If the sale forecloses a mortgage on a rented home, federal law usually lets a genuine tenant stay until the lease ends, or 90 days after a notice to vacate if that is later. A buyer who will live there can end the lease with 90 days’ notice (Protecting Tenants at Foreclosure Act)."
    }
  ],
  survives: {
    wipedOut: [
      "The defendant’s ownership, once the redemption period ends without a redemption",
      "Junior creditors’ rights, if they do not redeem in time"
    ],
    mayStay: [
      "Older liens and mortgages. The sale transfers only the defendant’s interest.",
      "Property tax liens, which attach every January 1",
      "Easements and other recorded encumbrances",
      "The owner’s and junior creditors’ right to redeem for 180 days"
    ]
  },
  mistakes: [
    {
      mistake: "Fixing up the property during redemption",
      prevent: "The owner can still redeem. Spend only on what protects the property. Record notice of taxes, insurance and repair costs so they count toward the redemption price."
    },
    {
      mistake: "Forgetting to record your costs",
      prevent: "Costs you do not record with the county recorder can’t be added to the redemption price (URCP 69C). Record a notice each time you pay."
    },
    {
      mistake: "Assuming the sale clears older liens",
      prevent: "Only the defendant’s interest is sold. Check the title for senior mortgages and liens before bidding."
    },
    {
      mistake: "Showing up without confirmed funds",
      prevent: "Ask the sheriff’s civil office how and when to pay. Bids are final and can’t be taken back (irrevocable)."
    },
    {
      mistake: "Missing a rent accounting request",
      prevent: "If someone asks in writing before the period ends, you must serve a sworn accounting of rents. The redemption period then runs until 7 days after you serve it. If you don’t serve it within 30 days, they can sue (within 60 days of asking), and the period runs until 21 days after the court’s order (URCP 69C(i))."
    }
  ],
  example: {
    title: "Illustrative example: a redeemed sheriff’s sale",
    story: "Casey, a made-up buyer, won a sheriff’s sale for $150,000 and got a certificate of sale. Casey paid $2,000 in property taxes and recorded a notice of that payment. Four months later the owner redeemed. Casey received $159,000 plus $2,120 for the recorded taxes. The sale was undone.",
    lesson: "A sheriff’s sale is not final for 180 days. Record every cost you pay. Plan your money as if the owner might redeem."
  },
  sources: [
    {
      label: "Utah Rules of Civil Procedure, Rule 69B (sale of property)",
      url: "https://legacy.utcourts.gov/rules/view.php?type=urcp&rule=69B"
    },
    {
      label: "Utah Rules of Civil Procedure, Rule 69C (redemption)",
      url: "https://legacy.utcourts.gov/rules/view.php?type=urcp&rule=69C"
    },
    {
      label: "Utah Code 78B-6-901 (mortgage foreclosure, sheriff sale)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S901.html"
    },
    {
      label: "Utah Code 78B-6-906 (redemption after foreclosure sale)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S906.html"
    },
    {
      label: "Utah Code 57-1-23 (trust deed may be foreclosed in court)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S23.html"
    },
    {
      label: "Utah Code 59-2-1325 (property tax lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1325.html"
    },
    {
      label: "Utah County Sheriff’s sales",
      url: "https://sheriff.utahcounty.gov/supportServices/judicial/sheriffSales"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: REVIEWED,
  state: 'UT'
},
{
  key: "cahoa",
  title: "California HOA foreclosures",
  short: "HOA foreclosures",
  oneLine: "A California homeowners association can sell a home to collect unpaid assessments (dues). It does this under the Davis-Stirling Act (Civil Code 5650–5740), usually through a trustee.",
  youGet: "The owner’s interest in the home. After a nonjudicial sale, the home can be bought back (redeemed) for 90 days. The first deed of trust, and any other lien recorded before the HOA’s lien, usually stays with the property.",
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "California Davis-Stirling Act, Civil Code 5650–5740 (assessment liens and collection)."
    },
    {
      label: "When the HOA can foreclose",
      value: "Only if the unpaid regular or special assessments reach $1,800, or are more than 12 months late. Late fees, collection costs, attorney’s fees and interest don’t count toward the $1,800 (Civ 5720)."
    },
    {
      label: "How it’s sold",
      value: "By the court (judicial) or by a trustee named in the recorded notice of delinquent assessment (nonjudicial). It can happen no sooner than 30 days after that notice is recorded (Civ 5700, 5675)."
    },
    {
      label: "Board vote",
      value: "Only the HOA board can decide to foreclose. It has to vote by majority in a closed (executive) session, at least 30 days before any public sale (Civ 5705)."
    },
    {
      label: "Redemption",
      value: "After a nonjudicial HOA sale, the home can be bought back (redeemed) for 90 days. The notice of sale has to say the property is sold subject to this right (Civ 5715, CCP 729.035)."
    },
    {
      label: "First mortgage",
      value: "The HOA’s lien ranks ahead of only the liens recorded after its notice of delinquent assessment, and the CC&Rs (the HOA’s recorded rules) can put it behind others (Civ 5680). So a first deed of trust recorded earlier usually stays. Confirm with a title report."
    },
    {
      label: "Fines",
      value: "The HOA can’t foreclose on fines for breaking its rules. Penalties for late payments are the exception (Civ 5725)."
    }
  ],
  steps: [
    {
      title: "Find the sale through the official notice",
      detail: "A nonjudicial HOA sale follows the same notice of default and notice of sale steps as a California trustee sale (Civ 5710). The notice names the trustee, the date, time and place. Deal only with the trustee named in the notice. DeedOwl never helps anyone contact the homeowner."
    },
    {
      title: "Confirm the HOA was allowed to foreclose",
      detail: "For assessment debts from 2006 on, the HOA can’t foreclose unless the unpaid assessments reach $1,800 or are more than 12 months late (Civ 5720). The board must also have voted at least 30 days before the sale (Civ 5705). If anything looks off, have an attorney review the recorded notices."
    },
    {
      title: "Order a title report",
      detail: "The HOA lien starts when its notice of delinquent assessment is recorded. It ranks ahead only of liens recorded after that (Civ 5675, 5680). A first deed of trust recorded before it usually stays. The CC&Rs may also put the HOA lien behind it anyway. Ask the title company which loans, liens and unpaid property taxes will stay."
    },
    {
      title: "Set your maximum bid",
      detail: "Add up any surviving loan balance and unpaid property taxes. Add the dues that keep coming after you buy, and repairs. If a first deed of trust stays on the home, its lender can foreclose on you if the loan isn’t paid. Use Analyze a deal (Fix and sell) to find your walk-away price."
    },
    {
      title: "Bid and pay",
      detail: "Bring the funds the notice of sale requires, usually cashier’s checks. The HOA trustee follows the notice and reinstatement rules for deed of trust sales (Civ 5710, citing Civ 2924, 2924b and 2924c); the notice of sale sets the bidding and payment terms. Ask the trustee if anything is unclear.*"
    },
    {
      title: "Wait out the 90 days",
      detail: "The home can be redeemed for 90 days after a nonjudicial HOA sale (Civ 5715, CCP 729.035). Ask an attorney how the redemption price is figured and when the trustee will deliver your deed. Don’t renovate until the period ends."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone lives there after the redemption period, use an eviction attorney and the court process. Never contact or pressure the former owner yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The HOA assessment lien being foreclosed",
      "Liens recorded after the HOA’s notice of delinquent assessment, in most cases (confirm with a title company)"
    ],
    mayStay: [
      "A first deed of trust or other lien recorded before the HOA’s notice of delinquent assessment (Civ 5680)",
      "Liens the CC&Rs put ahead of the HOA lien",
      "Unpaid property taxes and government assessments",
      "HOA dues from the day you buy",
      "The 90-day right of redemption after a nonjudicial sale (Civ 5715)",
      "Federal tax liens. Even when wiped out, the U.S. can buy the home back within 120 days of the sale (26 U.S.C. 7425(d))"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming an HOA sale wipes out the mortgage, like in Nevada",
      prevent: "California’s HOA lien ranks ahead only of liens recorded after it (Civ 5680). Get a title report. Budget for the first loan."
    },
    {
      mistake: "Fixing up the home during the 90 days",
      prevent: "The sale can still be undone if someone buys the home back (Civ 5715). Until the period ends, limit spending to securing and insuring the property."
    },
    {
      mistake: "Leaving a vacant home alone after you win",
      prevent: "If you buy a vacant home at a foreclosure sale, you have to keep the outside cared for and keep squatters out. After a warning, the city or county can fine you up to $2,000 a day, then $5,000 a day (Civ 2929.3)."
    },
    {
      mistake: "Bidding on a sale the HOA may not have been allowed to hold",
      prevent: "Check the amounts and dates in the recorded notices against the $1,800 or 12-month rule (Civ 5720). Also check the board-vote rule (Civ 5705). Ask an attorney if in doubt."
    },
    {
      mistake: "Contacting the owner to ask about the debt or the house",
      prevent: "Get all information from the trustee, the recorded documents and a title company. DeedOwl never helps anyone contact the owner."
    }
  ],
  example: {
    title: "Fictional example: a $14,000 condo that cost $300,000",
    story: "Jordan, a new investor, sees a fictional condo worth about $340,000 at an HOA trustee sale. The opening bid is $14,000. The title report shows a first deed of trust of about $285,000. It was recorded years before the HOA’s notice of delinquent assessment. Jordan figures the real cost. The bid, plus the surviving loan, plus property taxes and repairs, comes to more than $300,000. Jordan also notes that the home could be redeemed for 90 days after the sale.",
    lesson: "In California an HOA sale usually leaves the earlier first mortgage in place. Price the surviving loan and the redemption wait into your bid. Or walk away."
  },
  sources: [
    {
      label: "California Civil Code 5675 (notice of delinquent assessment creates the lien)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5675"
    },
    {
      label: "California Civil Code 5680 (priority of the HOA lien)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5680"
    },
    {
      label: "California Civil Code 5700 (how the lien can be enforced)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5700"
    },
    {
      label: "California Civil Code 5705 (dispute resolution and board vote before foreclosure)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5705"
    },
    {
      label: "California Civil Code 5710 (trustee sale rules)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5710"
    },
    {
      label: "California Civil Code 5715 (90-day right of redemption)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5715"
    },
    {
      label: "California Civil Code 5720 ($1,800 or 12-month threshold)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5720"
    },
    {
      label: "California Civil Code 5725 (fines can’t be foreclosed as assessments)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5725"
    },
    {
      label: "California Code of Civil Procedure 729.035 (redemption after an HOA sale)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=729.035"
    },
    {
      label: "California Civil Code 2929.3 (fines for not maintaining a vacant foreclosed home)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2929.3"
    },
    {
      label: "26 U.S.C. 7425: federal tax liens and the 120-day redemption (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    }
  ],
  team: [TEAM.attorney, TEAM.title, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor, TEAM.agent],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "cairs",
  title: "California IRS sales",
  short: "IRS sales",
  oneLine: "The IRS can take and sell California real estate to collect unpaid federal taxes. It sells by public auction or sealed bid, under federal law.",
  youGet: "A certificate of sale first. If no one buys the property back within 180 days, you get an IRS deed to the taxpayer’s interest. Mortgages and liens ahead of the federal tax lien stay with the property.",
  plain: 'A certificate first. The deed comes after 180 days if no one buys it back. Loans and liens ahead of the federal tax lien stay with it.',
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Federal: 26 U.S.C. 6335 (sale), 6337 (redemption), 6338 (certificate and deed), 6339 (effect of the deed)."
    },
    {
      label: "Where listed",
      value: "irsauctions.gov, plus a notice published in a newspaper in the county (26 U.S.C. 6335(b))."
    },
    {
      label: "Sale date",
      value: "10 to 40 days after the public notice. It is held in the county where the property was seized, unless the IRS orders otherwise (26 U.S.C. 6335(d))."
    },
    {
      label: "Minimum bid",
      value: "The IRS sets a minimum price. If no one bids it, the property goes to the government at that price or back to the owner (26 U.S.C. 6335(e))."
    },
    {
      label: "Payment",
      value: "Cash, certified, cashier’s or treasurer’s check, or a U.S. postal, bank or express money order. Pay in full at the sale, or pay a deposit at the sale and the rest by the deadline in the notice, which is no more than 1 month (26 U.S.C. 6335(e); IRM 5.10.5.14)."
    },
    {
      label: "Redemption",
      value: "180 days. The owner, their heirs, or anyone with an interest or lien can buy the property back (redeem). They pay you your price plus 20% a year interest, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8)."
    },
    {
      label: "What you get",
      value: "A certificate of sale when you pay in full. A deed after 180 days if no one redeems (26 U.S.C. 6338)."
    },
    {
      label: "California transfer tax",
      value: "Counties and cities can charge a tax when a deed transfers real property (R&T 11911). The government exemption covers deeds where the agency is getting title, not selling it (R&T 11922). Confirm what you’ll owe with the county recorder."
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov",
      detail: "IRS real estate sales in California are rare. Read each notice of sale for the minimum bid, deposit and payment deadline. It also says whether bids are taken at public auction or by sealed bid."
    },
    {
      title: "Ask for the list of known liens",
      detail: "The IRS will give bidders Form 2434-B, which lists the liens and interests it found. It doesn’t promise the list is complete, so check it yourself (IRM 5.10.5.7)."
    },
    {
      title: "Order a title report",
      detail: "You get only the taxpayer’s interest, as is, where is, with no warranty (IRM 5.10.5.7). Mortgages and liens ahead of the federal tax lien stay. The deed wipes out liens behind it (26 U.S.C. 6339(c))."
    },
    {
      title: "Look from the street only",
      detail: "You usually can’t go inside. Assume repairs are needed. Don’t contact or approach the owner or occupants. Send every question to the IRS contact on the notice."
    },
    {
      title: "Bid and pay on time",
      detail: "Pay in the forms the notice allows. If you agreed to pay the rest later (deferred payment) and don’t pay it, the IRS can sue you for it with 6% interest. Or it can cancel the sale and keep what you paid (26 U.S.C. 6335(e)(3))."
    },
    {
      title: "Record the certificate of sale",
      detail: "You get a certificate of sale when you pay in full (26 U.S.C. 6338(a)). The IRS notes that recording it can stop the taxpayer from selling the property to someone else (IRM 5.10.5.17.5). Ask a title company or attorney about recording it with the county recorder."
    },
    {
      title: "Plan for 180 days",
      detail: "The property can be bought back (redeemed) for 180 days. Whoever redeems pays you your price plus 20% a year interest (26 U.S.C. 6337; IRM 5.10.6.8). If it’s vacant you may enter only as needed to prevent damage. If it’s occupied, the IRS and its lawyers decide whether a court order is needed (IRM 5.10.5.19). Don’t renovate yet."
    },
    {
      title: "Get and record the deed",
      detail: "If no one redeems, turn in the certificate of sale. The IRS then gives you a deed made under California’s rules for execution sales (26 U.S.C. 6338(b); IRM 5.10.6.9). Record it with the county recorder and file a change in ownership statement (R&T 480). The assessor will reassess the property to market value (BOE)."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone still lives there, use an eviction attorney and the court process. Never remove people or belongings yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The federal tax lien being enforced",
      "Liens and interests behind the federal tax lien (26 U.S.C. 6339(c))"
    ],
    mayStay: [
      "Mortgages and liens ahead of the federal tax lien",
      "Unpaid property taxes",
      "Easements and recorded restrictions",
      "The 180-day right of redemption"
    ]
  },
  mistakes: [
    {
      mistake: "Trusting the IRS lien list as complete",
      prevent: "Form 2434-B isn’t guaranteed. Get your own title report before bidding."
    },
    {
      mistake: "Renovating during the 180 days",
      prevent: "If someone redeems, they pay your price plus interest, not your repair costs (26 U.S.C. 6337). Until the deed is issued, only do what prevents damage."
    },
    {
      mistake: "Bidding without the balance ready",
      prevent: "Missing a deferred payment can cost you your deposit (26 U.S.C. 6335(e)(3)). Have all your funds lined up first."
    },
    {
      mistake: "Forgetting California costs",
      prevent: "Budget for documentary transfer tax (R&T 11911) and a higher property tax bill after the assessor reassesses the property."
    }
  ],
  example: {
    title: "Fictional example: a sealed-bid cabin",
    story: "Alex, a first-time bidder, reads an IRS notice of sealed-bid sale for a fictional cabin. The minimum bid is $90,000. Alex’s title report shows a $60,000 first mortgage recorded before the federal tax lien. Alex bids $110,000, wins, and records the certificate of sale. Five months later a relative of the owner redeems. Alex is paid back $110,000 plus 20% a year interest for the time the money was tied up.",
    lesson: "Count the senior mortgage in your price. Expect a 180-day wait. Don’t spend on improvements before the deed."
  },
  sources: [
    {
      label: "IRS auctions",
      url: "https://www.irsauctions.gov/"
    },
    {
      label: "26 U.S.C. 6335: sale of seized property (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/6335"
    },
    {
      label: "26 U.S.C. 6337: redemption (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/6337"
    },
    {
      label: "26 U.S.C. 6338: certificate of sale and deed (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/6338"
    },
    {
      label: "26 U.S.C. 6339: legal effect of the deed (Cornell LII)",
      url: "https://www.law.cornell.edu/uscode/text/26/6339"
    },
    {
      label: "IRS Internal Revenue Manual 5.10.5: conducting the sale",
      url: "https://www.irs.gov/irm/part5/irm_05-010-005"
    },
    {
      label: "IRS Internal Revenue Manual 5.10.6: after the sale (redemption, deed)",
      url: "https://www.irs.gov/irm/part5/irm_05-010-006"
    },
    {
      label: "California Revenue and Taxation Code 11911 (documentary transfer tax)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=11911"
    },
    {
      label: "California Revenue and Taxation Code 11922 (government exemption)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=11922"
    },
    {
      label: "California Revenue and Taxation Code 480 (change in ownership statement)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=480"
    },
    {
      label: "California State Board of Equalization: change in ownership FAQs",
      url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.agent],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "careo",
  title: "California bank-owned (REO) homes",
  short: "Bank-owned (REO)",
  oneLine: "These are California homes a lender, Fannie Mae, Freddie Mac or HUD took back through foreclosure. They are sold through a listing agent with a normal escrow.",
  youGet: "The home itself, bought with a regular purchase contract plus the seller’s addendum. You close through escrow with title insurance, and you usually buy it as is.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s listing agent. Your agent submits the offer with the seller’s own forms and addenda (add-on pages)."
    },
    {
      label: "Seller disclosures",
      value: "A lender selling a home it took back through foreclosure doesn’t have to give the California Transfer Disclosure Statement (Civ 1102.2). It also doesn’t have to give the Natural Hazard Disclosure (Civ 1103, 1103.1). You may still get other required disclosures separately."
    },
    {
      label: "Condition",
      value: "Usually as is. Do your own inspections during your contingency period."
    },
    {
      label: "HUD homes",
      value: "Offers go through a HUD-registered broker. For homes listed since May 30, 2025, owner-occupants, government entities and HUD-approved nonprofits get the first 15 days (5 days for homes marked “uninsured”). Investors can bid only after that (HUD Mortgagee Letter 2025-13)."
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: for the first 30 days in the MLS, only owner-occupants, public entities and certain nonprofits can offer. Multi-family homes and vacant land are left out."
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Owner-occupant offers get priority. Owner-occupants promise they’ll move in within 60 days of closing and live there at least a year. First Look: for the first 30 days on HomePath, only owner-occupants, public entities and some nonprofits can offer."
    },
    {
      label: "Property taxes",
      value: "Buying the home counts as a change in ownership, so the assessor resets its taxable value to market value as of that date (BOE; R&T 110.1)."
    }
  ],
  steps: [
    {
      title: "Search official sources only",
      detail: "Use HUD Home Store, HomeSteps, HomePath and the REO pages of the bank or credit union that owns the home. DeedOwl lists only direct sources."
    },
    {
      title: "Get pre-approved or show proof of funds",
      detail: "Sellers want a pre-approval letter with your offer, or proof of funds for cash offers. HomeSteps lists these among required items."
    },
    {
      title: "Use a licensed agent",
      detail: "HUD requires a HUD-registered broker to bid for you. For HomeSteps and HomePath, your agent works with the listing agent. If you’re buying to live there, say so. Owner-occupants get early or priority offer periods."
    },
    {
      title: "Read every addendum",
      detail: "The seller’s addendum usually overrides parts of the standard California contract, such as repairs, deadlines and earnest money. HomePath, for example, wants the deposit within two calendar days of a fully signed contract. HomeSteps wants it in certified funds."
    },
    {
      title: "Inspect and appraise",
      detail: "A lender selling after foreclosure doesn’t have to give you a Transfer Disclosure Statement, so most of what you learn about the home comes from your own inspections (Civ 1102.2). California doesn’t license home inspectors, so ask for proof of training and insurance, and a sample report. Check permits with the city or county."
    },
    {
      title: "Check title and occupancy",
      detail: "Review the preliminary title report for anything that stays. If tenants lived there at the foreclosure, they may have rights to stay (CCP 1161b). Ask the listing agent whether the home will be delivered vacant."
    },
    {
      title: "Close through escrow",
      detail: "Buy an owner’s title insurance policy. Pay only through escrow, never in cash or to a person directly."
    },
    {
      title: "After closing",
      detail: "File the change in ownership statement with your deed (R&T 480). Expect a supplemental property tax bill. The assessor sets a new value on the date ownership changes (R&T 75.10)."
    }
  ],
  survives: {
    wipedOut: [
      "The seller pays off most liens before or at closing (confirm on the title report)"
    ],
    mayStay: [
      "Anything listed as an exception in your title policy",
      "Easements and recorded restrictions (CC&Rs)",
      "Property taxes for your share of the year, and supplemental taxes after reassessment",
      "HOA dues from closing on",
      "Leases or tenant rights that survived the foreclosure (CCP 1161b)"
    ]
  },
  mistakes: [
    {
      mistake: "Expecting the usual seller disclosures",
      prevent: "A lender selling after foreclosure doesn’t have to give you a Transfer Disclosure Statement (Civ 1102.2). Get full inspections."
    },
    {
      mistake: "Investors offering during an owner-occupant period",
      prevent: "Check the listing for HUD’s exclusive period or the 30-day First Look on Fannie Mae and Freddie Mac homes. Wait until investor offers are allowed."
    },
    {
      mistake: "Falsely claiming you’ll live there",
      prevent: "HUD, Fannie Mae and Freddie Mac make you sign a statement that you’ll live there. A false one can lead to a lawsuit or criminal charges."
    },
    {
      mistake: "Skipping the addendum",
      prevent: "Read every page. Addenda can shorten deadlines, add per-day fees and shift costs to you."
    }
  ],
  example: {
    title: "Fictional example: a HomeSteps house in First Look",
    story: "Maria, a teacher buying her first home, finds a fictional Freddie Mac house on HomeSteps. It is 12 days into its First Look. Her agent submits her offer with a pre-approval letter, the HomeSteps addenda and her signed owner-occupant affidavit. The lender seller is exempt from the Transfer Disclosure Statement. So she orders a full inspection, which finds a leaking water heater. She asks for a credit, and Freddie Mac declines. She closes anyway, with the repair in her budget.",
    lesson: "Owner-occupants can get an early shot at REO homes. But inspections replace the seller disclosures you’d normally get."
  },
  sources: [
    { label: "HUD Mortgagee Letter 2025-13: 15-day exclusive listing period", url: "https://hud.gov/sites/dfiles/OCHCO/documents/2025-13hsgml.pdf" },
    {
      label: "HUD Home Store",
      url: "https://www.hudhomestore.gov/"
    },
    {
      label: "HUD Home Store help: buyer types and listing periods",
      url: "https://www.hudhomestore.gov/FAQ"
    },
    {
      label: "Freddie Mac HomeSteps",
      url: "https://www.homesteps.com/"
    },
    {
      label: "HomeSteps: Freddie Mac First Look Initiative",
      url: "https://www.homesteps.com/homebuyer/firstlook"
    },
    {
      label: "HomeSteps: making an offer",
      url: "https://www.homesteps.com/homebuyer/making-an-offer"
    },
    {
      label: "Fannie Mae HomePath: online offer tips (PDF)",
      url: "https://homepath.fanniemae.com/images/documents/HomePath_Online_Offer_Tips.pdf"
    },
    {
      label: "Fannie Mae HomePath: Owner Occupant Certification (PDF)",
      url: "https://homepath.fanniemae.com/images/documents/Owner_Occupant_Certification.pdf"
    },
    {
      label: "California Civil Code 1102.2 (Transfer Disclosure Statement exemptions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.2"
    },
    {
      label: "California Civil Code 1103.1 (Natural Hazard Disclosure exemptions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1103.1"
    },
    {
      label: "California Code of Civil Procedure 1161b (tenants after foreclosure)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161b"
    },
    {
      label: "California Revenue and Taxation Code 110.1 (base year value)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=110.1"
    },
    {
      label: "California Revenue and Taxation Code 75.10 (supplemental assessment)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=75.10"
    },
    {
      label: "California Revenue and Taxation Code 480 (change in ownership statement)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=480"
    },
    {
      label: "California State Board of Equalization: change in ownership FAQs",
      url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "cashort",
  title: "California short sales",
  short: "Short sales",
  oneLine: "A California owner sells for less than the loan balance, with the lender’s written approval. The sale goes through a listing agent and normal escrow.",
  youGet: "The home, by grant deed through escrow, once every lienholder whose approval is needed agrees to the price.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent, usually marked “short sale” or “subject to lender approval.” All contact goes through the listing agent."
    },
    {
      label: "Timeline",
      value: "Often weeks to months for lender approval. A foreclosure can still happen first."
    },
    {
      label: "Owner’s protection",
      value: "After an approved short sale of a 1 to 4 unit home, the lender can’t collect the rest of the loan from the owner. There are some exceptions (CCP 580e). That is why lenders insist on written approval of the exact deal."
    },
    {
      label: "No side payments",
      value: "The lender can’t require the owner to pay extra for its consent (CCP 580e(b)). Every payment goes through escrow."
    },
    {
      label: "Investors and homes in foreclosure",
      value: "California’s home equity sales law can apply if you won’t live there and the owner lives in a 1 to 4 unit home with a recorded notice of default. It requires a strict written contract and gives the owner a right to cancel (Civ 1695.1–1695.6). Ask an attorney."
    },
    {
      label: "Disclosures",
      value: "The owner, not a lender, is selling. So the normal California seller disclosure rules generally apply (Civ 1102). The foreclosure exemption covers lenders selling homes they took back (Civ 1102.2)."
    },
    {
      label: "Financing and inspection",
      value: "Allowed. Keep your contingencies in writing."
    }
  ],
  steps: [
    {
      title: "Get pre-approved",
      detail: "Lenders approving a short sale want proof you can close: a pre-approval letter or proof of funds."
    },
    {
      title: "Use an agent with short-sale experience",
      detail: "Your agent works only with the listing agent. DeedOwl never helps anyone contact the owner directly, and you shouldn’t either."
    },
    {
      title: "Offer subject to lender approval",
      detail: "The seller signs your offer first. Then the listing agent sends the package to each lender. The signed agreement may already be binding, with performance subject to lender approval. Confirm each required approval and the contract’s deadlines before closing."
    },
    {
      title: "Check whether California’s equity purchaser law applies",
      detail: "A special rule applies if the owner lives there, a notice of default is recorded, and you aren’t buying to live there. Then the contract has to meet strict written requirements (Civ 1695.2). The owner can cancel until midnight of the fifth business day after signing, or 8 a.m. on the sale day if sooner (Civ 1695.4). Until then you can’t record documents or pay the owner (Civ 1695.6). Saturdays count as business days (Civ 1695.1). If the deal takes unfair advantage of the owner, the owner can undo it for up to 2 years after your deed is recorded, and you must give the house back (Civ 1695.14). Have an attorney review it."
    },
    {
      title: "Inspect and review disclosures",
      detail: "Expect the seller’s Transfer Disclosure Statement (Civ 1102). Do your own inspection anyway. Owners in hardship often put off repairs."
    },
    {
      title: "Watch the foreclosure date",
      detail: "Ask the listing agent whether a trustee sale is scheduled, and whether the lender has agreed to postpone it. A foreclosure can cancel a short sale."
    },
    {
      title: "Close through escrow",
      detail: "Pay only through escrow, and disclose every payment to the lenders. Never pay the owner, a “negotiator” or anyone else on the side."
    }
  ],
  survives: {
    wipedOut: [
      "Loans and liens whose holders approve the sale and are paid through escrow"
    ],
    mayStay: [
      "Any lien whose holder doesn’t agree. The sale can’t close with clear title until they do",
      "Anything listed as an exception in your title policy",
      "Property taxes and HOA dues from closing on",
      "Leases with tenants living there. Ask the listing agent whether the home is delivered vacant"
    ]
  },
  mistakes: [
    {
      mistake: "Contacting the owner directly",
      prevent: "Work only through the listing agent and escrow. DeedOwl never helps anyone contact the owner."
    },
    {
      mistake: "Paying a “negotiator” or the owner outside escrow",
      prevent: "All money goes through escrow and is disclosed to the lenders. California strictly limits fees for people who promise to stop a foreclosure or deal with lenders for an owner (Civ 2945.1, 2945.4)."
    },
    {
      mistake: "Ignoring the equity purchaser law as an investor",
      prevent: "This applies if you won’t live there and a notice of default is recorded on an owner-occupied home. A deal that takes unfair advantage of the owner can be undone for 2 years (Civ 1695.14). Have an attorney prepare a contract that follows the law (Civ 1695.1–1695.6)."
    },
    {
      mistake: "Assuming one approval is enough",
      prevent: "Ask how many loans and liens there are. Each holder must agree before closing."
    }
  ],
  example: {
    title: "Fictional example: two lenders, one sale",
    story: "Chris, a first-time buyer, offers $480,000 on a fictional short-sale condo listed by the owner’s agent. The first-loan lender approves after nine weeks. The second-loan holder asks for more money to release its lien. The listing agent negotiates through escrow for three more weeks. Chris keeps his loan approval current and never contacts the owner. He closes after both lenders sign written approvals.",
    lesson: "Expect each lienholder to negotiate. Keep your financing ready. Let the listing agent and escrow handle every contact."
  },
  sources: [
    {
      label: "California Code of Civil Procedure 580e (no deficiency after an approved short sale)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=580e"
    },
    {
      label: "California Civil Code 1695.1 (equity purchaser definitions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.1"
    },
    {
      label: "California Civil Code 1695.2 (contract requirements)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.2"
    },
    {
      label: "California Civil Code 1695.4 (owner’s right to cancel)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.4"
    },
    {
      label: "California Civil Code 1695.6 (equity purchaser limits)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.6"
    },
    {
      label: "California Civil Code 1695.14 (owner’s 2-year right to rescind)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1695.14"
    },
    {
      label: "California Civil Code 2945.1 (foreclosure consultant definition)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2945.1"
    },
    {
      label: "California Civil Code 2945.4 (foreclosure consultant prohibitions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2945.4"
    },
    {
      label: "California Civil Code 1102 (seller disclosures apply)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102"
    },
    {
      label: "California Civil Code 1102.2 (disclosure exemptions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.2"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.attorney, TEAM.offerInspector],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "cacommercial",
  title: "California commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land in California. Banks, trustees, sheriffs, receivers and tax collectors sell them.",
  youGet: "The same kind of deed you’d get buying a home the same way. A purely commercial building doesn’t come with California’s home seller disclosures. A building that mixes shops with one to four homes might, unless the sale is exempt; ask your agent or attorney which apply. Expect tenants, leases and some environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: tax sales, trustee sales, sheriff and court sales, court-appointed receivers, and bank or government sellers."
    },
    {
      label: "Seller disclosures",
      value: "California’s Transfer Disclosure Statement covers property with one to four dwelling units (Civ 1102(a)), so a mixed-use building with one to four apartments can be covered even if it’s sold as commercial. Buildings with no homes or five or more units aren’t, and some sales are exempt (Civ 1102.2, such as foreclosure sales). Ask your agent or attorney which apply; your own research (due diligence) is still the main protection."
    },
    {
      label: "Property tax (Prop 13)",
      value: "Buying it counts as a change in ownership. The assessor resets the property’s value to market value as of that date, and that becomes its new base year value (BOE; R&T 60, 110.1). A supplemental tax bill can follow (R&T 75.10)."
    },
    {
      label: "Transfer tax",
      value: "Counties can charge a transfer tax of $0.55 per $500 of value, and cities can add their own (R&T 11911). Confirm the total rate with the county recorder."
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment can help protect you from having to pay for a federal cleanup. It has to be completed (or updated) within one year before you buy, with key parts done or updated within 180 days. The report alone isn’t enough: you also have to qualify for the protection (for example, as a bona fide prospective purchaser) and meet ongoing duties after you buy (EPA All Appropriate Inquiries)."
    },
    {
      label: "Accessibility",
      value: "On every new commercial lease, California owners must say whether a Certified Access Specialist (CASp) has inspected the premises (Civ 1938)."
    },
    {
      label: "Residential tenants",
      value: "In apartment buildings bought after foreclosure, month-to-month tenants get 90 days’ written notice. Many fixed-term leases continue (CCP 1161b). Statewide just-cause rules (Civ 1946.2) and local rules can also apply, including relocation pay."
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor’s record for land use, building size and year built. Use the parcel map to find the parcel and spot questions. The title company confirms legal access from recorded easements, and a survey confirms boundaries."
    },
    {
      title: "Get the rent roll and leases",
      detail: "A receiver, bank or listing broker can usually provide them. At an auction you often can’t get them. Until you can confirm the leases, count the rent as zero, but don’t assume the building is legally empty: tenants may have rights to stay. Plan how you’ll confirm who occupies it and gain possession lawfully, and ask an attorney before you enter, renovate or remove anyone."
    },
    {
      title: "Value it by income",
      detail: "For a rental building, divide net operating income by the cap rate. Net operating income is rent after vacancy and operating costs. Use a property tax figure based on your price, not the seller’s old Prop 13 value. The assessor will reassess (BOE)."
    },
    {
      title: "Order a title report",
      detail: "Commercial parcels often carry easements, reciprocal easement agreements, CC&Rs, mechanic’s liens and recorded leases. Ask which ones stay after the kind of sale you’re buying at."
    },
    {
      title: "Screen for contamination",
      detail: "Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Check state cleanup databases such as DTSC EnviroStor and the Water Board’s GeoTracker. Get a Phase I assessment finished (not just ordered) within one year before you buy, with its interviews, records review, site visit and lien search done or updated within 180 days before you buy. A report alone doesn’t guarantee protection: you also have to qualify and keep meeting ongoing duties after you buy. The environmental consultant guide explains the details (EPA All Appropriate Inquiries)."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Ask the city or county planning department to confirm that your planned use is allowed. Also confirm there are no open code cases or expired permits."
    },
    {
      title: "Line up your money",
      detail: "Auctions need certified funds. Have a commercial or bridge lender ready to refinance after. Budget for transfer tax (R&T 11911) and the reassessed property tax."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it. File the change in ownership statement with your deed (R&T 480). Tell tenants in writing where to pay rent. Ask each tenant to sign an estoppel certificate, a signed statement confirming their lease terms. Follow CCP 1161b for any residential tenants."
    }
  ],
  survives: {
    wipedOut: [
      "At a trustee or sheriff sale: liens recorded after the lien being foreclosed",
      "Leases signed after that lien, or put behind it, unless the lender agreed to keep them.* Confirm with an attorney",
      "In a bank or receiver sale: liens the seller pays off at closing (confirm on the title report)"
    ],
    mayStay: [
      "Property taxes and special assessments",
      "Liens recorded ahead of the lien being foreclosed",
      "Responsibility for environmental cleanup. It can follow whoever owns the property, not the lien*",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases that rank ahead of the lien or have a non-disturbance agreement, and residential tenant rights under CCP 1161b",
      "Anything listed as an exception in your title policy"
    ]
  },
  mistakes: [
    {
      mistake: "Using the seller’s property tax bill",
      prevent: "Your purchase resets the property’s taxable value to market value (BOE; R&T 110.1). Run your numbers with the tax based on your price."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. A Phase I assessment done on time is part of keeping the federal protection, along with duties after you buy; it isn’t a promise you’ll never pay for cleanup (EPA)."
    },
    {
      mistake: "Expecting a seller disclosure statement",
      prevent: "The Transfer Disclosure Statement covers only property with one to four dwelling units, and some sales are exempt (Civ 1102(a), 1102.2). For a purely commercial building, ask for reports and do your own inspections."
    },
    {
      mistake: "Assuming tenants will keep paying",
      prevent: "Get estoppel certificates. Budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Fictional example: the tax bill that ate the cap rate",
    story: "Dana, a new investor, buys a fictional bank-owned strip center for $2,000,000. The seller’s tax bill was based on a Prop 13 value set decades ago. After the sale, the assessor reassesses the center to about $2,000,000. A supplemental tax bill arrives. It cuts Dana’s net operating income by tens of thousands of dollars a year. Dana had also skipped estoppels. Later Dana learned one tenant had a rent reduction not shown in the rent roll.",
    lesson: "Run your numbers with property tax based on your price. Confirm every lease with an estoppel certificate before closing."
  },
  sources: [
    {
      label: "California State Board of Equalization: change in ownership FAQs",
      url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
    },
    {
      label: "California Revenue and Taxation Code 60 (change in ownership)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=60"
    },
    {
      label: "California Revenue and Taxation Code 110.1 (base year value)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=110.1"
    },
    {
      label: "California Revenue and Taxation Code 75.10 (supplemental assessment)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=75.10"
    },
    {
      label: "California Revenue and Taxation Code 480 (change in ownership statement)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=480"
    },
    {
      label: "California Revenue and Taxation Code 11911 (documentary transfer tax)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=11911"
    },
    {
      label: "California Civil Code 1102 (which sales need the Transfer Disclosure Statement)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102"
    },
    {
      label: "California Civil Code 1946.2 (statewide just-cause rules)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1946.2"
    },
    {
      label: "California Civil Code 1938 (CASp statement in commercial leases)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1938"
    },
    {
      label: "California Code of Civil Procedure 1161b (tenants after foreclosure)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161b"
    },
    {
      label: "EPA: All Appropriate Inquiries (Phase I environmental site assessments)",
      url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
    }
  ],
  team: [TEAM.commercialBroker, TEAM.title, TEAM.attorney, TEAM.environmental, TEAM.commercialLender, TEAM.insurance, TEAM.contractor, TEAM.propertyManager, TEAM.cpa],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "azhoa",
  title: "Arizona HOA foreclosures",
  short: "HOA foreclosures",
  teaser: "An Arizona homeowners association can foreclose its lien for unpaid dues, but only through a court case. The home is then sold at a sheriff’s sale.",
  oneLine: "An Arizona homeowners association can foreclose its lien for unpaid assessments (dues). But it can do this only through a court case, like a mortgage, and only after a large or long delinquency. The home is then sold at a sheriff’s sale, usually subject to the first mortgage.",
  youGet: "A certificate of sale first, and a sheriff’s deed only after the redemption period ends. You get the owner’s interest. In most cases the recorded first mortgage or deed of trust, and property taxes, still stay with the home.",
  plain: 'A certificate first, and the deed only after the buy-back period ends. The first mortgage and property taxes usually stay with the house.',
  forSale: true,
  glance: [
    {
      label: "Law (planned communities)",
      value: "A.R.S. 33-1807 for planned communities. Condominiums use A.R.S. 33-1256, which has the same 18-month or $10,000 rule and the same priority"
    },
    {
      label: "When the HOA can foreclose",
      value: "Only if the owner has been behind for 18 months, or owes $10,000 or more, whichever comes first. This is measured on the day the case is filed. For a special assessment that started at $10,000 or more, only the 18-month rule applies (A.R.S. 33-1807)"
    },
    {
      label: "How",
      value: "Through a court case, “in the same manner as a mortgage” (A.R.S. 33-1807). After judgment, the sheriff sells the home at public auction"
    },
    {
      label: "Priority",
      value: "Behind the recorded first mortgage or first deed of trust, and behind property taxes and government assessments. Also behind liens recorded before the HOA’s declaration (A.R.S. 33-1807). There is no Nevada-style “super-priority”"
    },
    {
      label: "Payment",
      value: "Within 5 working days after the sheriff’s sale, unless the sheriff agrees in writing to more time (A.R.S. 12-1624)"
    },
    {
      label: "Redemption",
      value: "6 months after the sale, or 30 days if the judgment found the home both abandoned and not used mainly for farming or grazing. Then junior creditors can redeem in turn, 5 days each (A.R.S. 12-1282, 12-1283)"
    },
    {
      label: "Redemption price",
      value: "Your price plus 8%, plus taxes or assessments you paid, with interest (A.R.S. 12-1285)"
    },
    {
      label: "Deed",
      value: "A sheriff’s deed, once every redemption period ends. The sheriff records it within 30 days (A.R.S. 12-1286)"
    }
  ],
  steps: [
    {
      title: "Confirm it really is an HOA foreclosure sale",
      detail: "An HOA can’t use a quick trustee’s sale for unpaid assessments. It must file a lawsuit and win a judgment. Then the county sheriff sells the home (A.R.S. 33-1807). Find the sheriff’s notice of sale, which gives the court case number. Work only with the sheriff’s civil unit and the court file. Never contact the homeowner."
    },
    {
      title: "Read the judgment",
      detail: "Get the judgment from the court file. It says what is being sold and the amount owed. It also says whether the court found the home both abandoned and not used mainly for farming or grazing. Only that finding cuts the owner’s redemption period to 30 days instead of 6 months (A.R.S. 12-1282). For a condominium, the HOA’s lien falls under A.R.S. 33-1256, which works the same way."
    },
    {
      title: "Order a title report and find the first mortgage",
      detail: "The HOA lien ranks behind a recorded first mortgage or first deed of trust. It also ranks behind property taxes, government assessments and liens recorded before the HOA’s declaration (A.R.S. 33-1807). Those generally stay on the home after an HOA sale. Ask the title company for the first loan’s recorded amount, and whether a trustee’s sale on it is already scheduled."
    },
    {
      title: "Set your maximum bid",
      detail: "Add these to your price: the surviving first mortgage, unpaid property taxes, any mechanic’s liens and repairs. Mechanic’s liens keep their place in line, since the HOA lien doesn’t change their priority (A.R.S. 33-1807). If the total is near the home’s value, the deal may leave little or no room for profit or surprises; many buyers pass at that point. Use Analyze a deal (Fix and sell) to find your walk-away price."
    },
    {
      title: "Confirm the sale is still on",
      detail: "The owner can settle with the HOA, and the sheriff can postpone. Call the sheriff’s civil unit before you go. Ask what forms of payment it accepts."
    },
    {
      title: "Bid and pay within 5 working days",
      detail: "The sheriff sells at public auction. You must pay within five working days. If you don’t, the sheriff offers the home to the second-highest bidder. You can also owe for other people’s losses and attorney fees (A.R.S. 12-1624)."
    },
    {
      title: "Get your certificate of sale",
      detail: "The certificate describes the property, the price and whether it can be redeemed. You get “all the right, title, interest and claim” of the owner, nothing more (A.R.S. 12-1626)."
    },
    {
      title: "Wait out the redemption period",
      detail: "The owner can redeem for 6 months (30 days only if the judgment found the home both abandoned and not used mainly for farming or grazing). After that, creditors with later liens can redeem one after another, in order of priority, each within 5 days after the one before. Each one can add up to 5 days to your wait, so count them on your title report (A.R.S. 12-1282, 12-1283). If anyone redeems, you get your price plus 8%. You also get back taxes or assessments you paid, with interest (A.R.S. 12-1285). Repairs aren’t repaid. So keep receipts and hold off on upgrades."
    },
    {
      title: "Receive the sheriff’s deed and take possession lawfully",
      detail: "When every redemption period ends, the sheriff gives you the deed. The sheriff records it within 30 days (A.R.S. 12-1286). If anyone is still living there, give a written demand for possession. If needed, file a forcible detainer (eviction) case (A.R.S. 12-1173.01). Never change locks or remove belongings yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The HOA lien that was foreclosed",
      "The former owner’s interest, once the sheriff’s deed is issued (A.R.S. 12-1626, 12-1286)",
      "Liens junior to the HOA lien, only if the judgment cut them off. Ask your title company"
    ],
    mayStay: [
      "The recorded first mortgage or first deed of trust (A.R.S. 33-1807)",
      "Liens recorded before the HOA’s declaration (A.R.S. 33-1807)",
      "Property taxes, which are a lien ahead of almost all others (A.R.S. 42-17153), and other government assessments",
      "Mechanic’s and materialmen’s liens, whose priority the HOA lien doesn’t change (A.R.S. 33-1807)",
      "The owner’s and junior creditors’ redemption rights until the periods end (A.R.S. 12-1282)",
      "Future HOA assessments, which you owe from the day you own the home"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming an Arizona HOA sale wipes out the mortgage, as it can in Nevada",
      prevent: "In Arizona the HOA lien ranks behind the recorded first mortgage or deed of trust (A.R.S. 33-1807). Price the surviving loan into your bid."
    },
    {
      mistake: "Thinking you own the home on sale day",
      prevent: "You get a certificate of sale. Plan for a 6-month wait (30 days only if the judgment found the home both abandoned and not used mainly for farming or grazing), plus 5 days for each junior creditor who could redeem after the owner. Also plan for the chance you are simply paid back with 8%."
    },
    {
      mistake: "Renovating during the redemption period",
      prevent: "If someone redeems, they repay your price plus 8% and taxes or assessments you paid. Upgrades are not repaid (A.R.S. 12-1285). Wait for the deed."
    },
    {
      mistake: "Ignoring a trustee’s sale on the first loan",
      prevent: "If the first lender forecloses by trustee’s sale, liens junior to its deed of trust are cleared. Your interest from the HOA sale could be wiped out (A.R.S. 33-811). Check the recorder for a notice of trustee’s sale before you bid."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Riley, a fictional buyer, sees a sheriff’s sale of a townhome worth about $320,000 after an HOA judgment. Bidding opens near $14,000. Riley’s title report shows a recorded first deed of trust of about $255,000. It also shows $3,000 in unpaid property taxes. Both would stay. The court didn’t find the home abandoned, so the owner would have 6 months to redeem.",
    lesson: "The real cost is the bid plus about $258,000 in surviving liens, plus repairs. And Riley might wait 6 months only to be paid back with 8%. An HOA sale is rarely the bargain the opening bid suggests."
  },
  sources: [
    {
      label: "A.R.S. 33-1807: Planned community assessment liens; foreclosure thresholds; priority",
      url: "https://www.azleg.gov/ars/33/01807.htm"
    },
    {
      label: "A.R.S. 12-1281: Who may redeem",
      url: "https://www.azleg.gov/ars/12/01281.htm"
    },
    {
      label: "A.R.S. 12-1282: Redemption periods: 30 days or 6 months",
      url: "https://www.azleg.gov/ars/12/01282.htm"
    },
    {
      label: "A.R.S. 12-1283: Redemption after foreclosure of mortgages and other liens",
      url: "https://www.azleg.gov/ars/12/01283.htm"
    },
    {
      label: "A.R.S. 12-1285: Redemption price: plus 8%",
      url: "https://www.azleg.gov/ars/12/01285.htm"
    },
    {
      label: "A.R.S. 12-1286: Sheriff’s deed",
      url: "https://www.azleg.gov/ars/12/01286.htm"
    },
    {
      label: "A.R.S. 12-1621: Notice of sale of real property",
      url: "https://www.azleg.gov/ars/12/01621.htm"
    },
    {
      label: "A.R.S. 12-1624: Payment within 5 working days",
      url: "https://www.azleg.gov/ars/12/01624.htm"
    },
    {
      label: "A.R.S. 12-1626: Certificate of sale; what the buyer gets",
      url: "https://www.azleg.gov/ars/12/01626.htm"
    },
    {
      label: "A.R.S. 33-811: Trustee’s deed clears junior liens",
      url: "https://www.azleg.gov/ars/33/00811.htm"
    },
    {
      label: "A.R.S. 42-17153: Property tax lien priority",
      url: "https://www.azleg.gov/ars/42/17153.htm"
    },
    {
      label: "A.R.S. 12-1173.01: Forcible detainer after a sale",
      url: "https://www.azleg.gov/ars/12/01173-01.htm"
    }
  ],
  team: [TEAM.attorney, TEAM.title, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azirs",
  title: "Arizona IRS sales",
  short: "IRS sales",
  teaser: "The IRS takes and sells real property in Arizona to collect unpaid federal taxes. The owner has 180 days to buy it back (redeem).",
  oneLine: "The IRS takes and sells real property in Arizona to collect unpaid federal taxes. It sells by public auction or sealed bid. Federal law sets the rules, and the owner has 180 days to buy it back (redeem).",
  youGet: "A certificate of sale when you pay in full, and a deed (usually a quitclaim deed) only if no one redeems within 180 days. You get only the taxpayer’s interest, “as is” and “where is.” Liens ahead of the IRS stay with the property.",
  plain: 'A certificate when you pay. A deed only if no one buys it back within 180 days. You buy it as is, and debts ahead of the IRS stay with it.',
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Federal: 26 U.S.C. 6335 (sale), 6337 (redemption), 6338 (certificate and deed), 6339 (effect of the deed)"
    },
    {
      label: "Where listed",
      value: "irsauctions.gov, plus a notice published in a newspaper or posted in public places (26 U.S.C. 6335)"
    },
    {
      label: "Sale date",
      value: "10 to 40 days after public notice, in the county where the property was seized (26 U.S.C. 6335)"
    },
    {
      label: "Minimum bid",
      value: "The IRS sets a minimum price before the sale (26 U.S.C. 6335)"
    },
    {
      label: "Payment",
      value: "Cash, a certified, cashier’s or treasurer’s check, or a money order, as the notice says. Pay in full at the sale, or pay a deposit there and the rest within the time the notice gives, up to 1 month (26 U.S.C. 6335(e); IRM 5.10.5.14)"
    },
    {
      label: "Redemption",
      value: "180 days. The owner, their heirs, or anyone with an interest or lien can buy the property back (redeem). They pay you your price plus 20% a year, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8)"
    },
    {
      label: "What you get",
      value: "A certificate of sale. Then a deed, if no one redeems within 180 days (26 U.S.C. 6338)"
    },
    {
      label: "Arizona recording",
      value: "Record the deed with the county recorder. Arizona requires an affidavit of property value with most deeds. But a deed from a federal agency may be exempt (A.R.S. 11-1134, code A3). Confirm with the county recorder"
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov and read the notice of sale",
      detail: "IRS real estate sales in Arizona are few. Each notice gives the date, time, place and property. It also gives the minimum bid and the payment terms. The sale must be 10 to 40 days after public notice and in the county where the property was seized (26 U.S.C. 6335). Ask questions only of the IRS contact named in the notice. Never contact the taxpayer."
    },
    {
      title: "Research the title",
      detail: "The IRS sells only the taxpayer’s rights in the property (right, title and interest). It sells “as is” and “where is,” with no warranty (IRM 5.10.5.7). Order a title report. Mortgages and liens recorded ahead of the federal tax lien stay. Arizona property taxes are a lien ahead of almost all others (A.R.S. 42-17153). Federal law also lets local property tax liens outrank the federal tax lien (26 U.S.C. 6323(b)(6))."
    },
    {
      title: "Look at the property from the street",
      detail: "You usually can’t go inside. Price in repairs you can’t see. Check the county assessor and treasurer for the parcel, taxes owed and any special assessments."
    },
    {
      title: "Bring the right payment",
      detail: "Pay in the form the notice allows: cash, a certified, cashier’s or treasurer’s check, or a money order (IRM 5.10.5.14). If the notice allows deferred payment, the rest is due within the time it sets, no more than one month. If you don’t pay, the IRS can resell the property. The money you paid is forfeited (lost) (26 U.S.C. 6335)."
    },
    {
      title: "Get your certificate of sale",
      detail: "When you pay in full, the IRS gives you a certificate of sale (26 U.S.C. 6338). Keep it safe. You turn it in to get the deed. Ask the IRS and a title company whether to record it with the county recorder. Recording it keeps the taxpayer from selling to an innocent buyer (IRM 5.10.5.17.5)."
    },
    {
      title: "Plan for 180 days",
      detail: "The owner, their heirs, or anyone with an interest or lien can buy the property back within 180 days. They pay you your price plus 20% a year, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8). During this time, both the IRS and you have to keep the property from being damaged or run down (IRM 5.10.5.19). State law decides whether you can collect rent, move in or remove occupants. Ask an Arizona attorney before you bid."
    },
    {
      title: "Get the deed",
      detail: "If no one redeems, turn in the certificate. The IRS then gives you a deed, usually a quitclaim deed (26 U.S.C. 6338). It is prepared under the laws of the state where the property is (IRM 5.10.6.9). The deed gives you the taxpayer’s interest as it stood when the federal tax lien attached. It also clears liens that ranked behind the federal tax lien (26 U.S.C. 6339)."
    },
    {
      title: "Record the deed in Arizona",
      detail: "Record the deed with the county recorder. Arizona requires an affidavit of property value with most deeds. The recorder can refuse a deed without one unless it’s exempt (A.R.S. 11-1133). A deed where a U.S. agency is the named seller (grantor) is listed as exempt (A.R.S. 11-1134, code A3). Confirm with your county recorder. Then buy title insurance before you spend money on the property."
    }
  ],
  survives: {
    wipedOut: [
      "The federal tax lien being enforced",
      "Liens and interests that ranked behind the federal tax lien, once the deed is issued (26 U.S.C. 6339)",
      "The taxpayer’s interest, if no one redeems within 180 days"
    ],
    mayStay: [
      "Mortgages and liens recorded ahead of the federal tax lien",
      "Property taxes and special assessments (A.R.S. 42-17153; 26 U.S.C. 6323(b)(6))",
      "The 180-day redemption right (26 U.S.C. 6337)",
      "Anyone living there, until they are removed through the process Arizona law requires. Ask an attorney"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming a clean title",
      prevent: "The IRS sells only the taxpayer’s interest, as is. Get a title report. Senior mortgages and property taxes stay."
    },
    {
      mistake: "Planning a quick flip",
      prevent: "Build 180 days of holding costs into your bid. If someone redeems, you get 20% a year on your price. You do not get back what you spent on repairs."
    },
    {
      mistake: "Missing the deferred-payment deadline",
      prevent: "Have the full price ready before you bid. If you don’t pay the rest, you lose what you already paid (26 U.S.C. 6335)."
    },
    {
      mistake: "Moving in or evicting on your own",
      prevent: "Whether you can take possession during the redemption period depends on state law. Ask an Arizona attorney before you act."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Morgan, a fictional buyer, wins an IRS sealed-bid sale of a Tucson-area lot at $40,000. Four months later, a creditor with a junior lien redeems. Morgan receives the $40,000 plus about 120 days of 20% yearly interest, compounded daily. That is roughly $2,700.",
    lesson: "An IRS sale may end in a short, high-rate return instead of property. Don’t spend on improvements until the 180 days pass and the deed is in your hands."
  },
  sources: [
    {
      label: "26 U.S.C. 6335: Sale of seized property",
      url: "https://www.law.cornell.edu/uscode/text/26/6335"
    },
    {
      label: "26 U.S.C. 6337: Redemption: 180 days, 20% a year",
      url: "https://www.law.cornell.edu/uscode/text/26/6337"
    },
    {
      label: "26 U.S.C. 6338: Certificate of sale and deed",
      url: "https://www.law.cornell.edu/uscode/text/26/6338"
    },
    {
      label: "26 U.S.C. 6339: Effect of the deed; junior liens discharged",
      url: "https://www.law.cornell.edu/uscode/text/26/6339"
    },
    {
      label: "26 U.S.C. 6323: Local property tax liens ahead of the federal tax lien",
      url: "https://www.law.cornell.edu/uscode/text/26/6323"
    },
    {
      label: "IRM 5.10.5: Sale procedures, payment, as-is terms, protection during redemption",
      url: "https://www.irs.gov/irm/part5/irm_05-010-005"
    },
    {
      label: "IRM 5.10.6: Redemption and deed to real property",
      url: "https://www.irs.gov/irm/part5/irm_05-010-006"
    },
    {
      label: "IRS Auctions",
      url: "https://www.irsauctions.gov/"
    },
    {
      label: "IRS Auctions: frequently asked questions",
      url: "https://www.irsauctions.gov/frequently-asked-questions"
    },
    {
      label: "A.R.S. 11-1133: Affidavit of property value required to record",
      url: "https://www.azleg.gov/ars/11/01133.htm"
    },
    {
      label: "Arizona Department of Revenue: Affidavit of Property Value (Form 82162) and exemption codes",
      url: "https://azdor.gov/sites/default/files/2023-05/FORMS_PROPERTY_2019_82162-f.pdf"
    },
    {
      label: "A.R.S. 42-17153: Property tax lien priority",
      url: "https://www.azleg.gov/ars/42/17153.htm"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.contractor, TEAM.agent],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azreo",
  title: "Arizona bank-owned (REO) and government homes",
  short: "Bank-owned (REO)",
  teaser: "These are homes a lender, Fannie Mae, Freddie Mac or HUD took back after foreclosure. They sell as is through a listing agent.",
  oneLine: "These are homes a lender, Fannie Mae, Freddie Mac or HUD took back after foreclosure. They now sell through a listing agent. You make an offer with your own agent, usually on the seller’s addendum, and buy the home as is.",
  youGet: "The home through a normal Arizona purchase with escrow and title insurance. The seller usually makes few promises about condition, so your inspection matters more than usual.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s broker in the MLS, or on the official seller sites: HUD Home Store, Fannie Mae HomePath, Freddie Mac HomeSteps"
    },
    {
      label: "HUD homes",
      value: "Bids go through a HUD-registered broker. For homes listed since May 30, 2025, owner-occupants, government entities and HUD-approved nonprofits get the first 15 days (5 days for homes marked “uninsured”). Investors can bid only after that (HUD Mortgagee Letter 2025-13)"
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Your agent must be registered in HomePath to submit offers. First Look: for the first 30 days on HomePath, only owner-occupants, public entities and some nonprofits can offer"
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: during a home’s first 30 days in the MLS, it is reserved for owner-occupants, some nonprofits and public entities"
    },
    {
      label: "Condition",
      value: "Usually sold as is. Arizona’s Seller’s Property Disclosure Statement (SPDS) is a standard form, not a law. A seller still has a duty to disclose, even if it doesn’t give you an SPDS (ADRE Buyer Advisory)"
    },
    {
      label: "Rural land",
      value: "For 5 or fewer unsubdivided parcels in an unincorporated area, the seller must give an affidavit of disclosure at least 7 days before transfer. You can cancel (rescind) within 5 days after you get it (A.R.S. 33-422)"
    },
    {
      label: "Recording",
      value: "Buyer and seller sign an affidavit of property value, filed with the deed; the recording fee already includes Arizona’s $2 transfer fee (A.R.S. 11-1132)"
    }
  ],
  steps: [
    {
      title: "Get pre-approved or gather proof of funds",
      detail: "Sellers want proof you can close. If you need an FHA loan, check the HUD listing code. “IE” homes need no more than $10,000 in repairs, and you’ll need a repair escrow at closing (HUD Home Store FAQ)."
    },
    {
      title: "Choose a buyer’s agent who can submit to each seller",
      detail: "HUD bids must come through a HUD-registered broker. Fannie Mae requires your agent to be registered in HomePath to submit offers. Ask your agent how each bank’s listing agent takes offers. Start from the official seller sites (HUD Home Store, HomePath, HomeSteps) and the MLS listing. If a bank sells through an auction it chose, confirm the bank is the owner of record, and check the buyer’s premium and whether the bank must approve the winning bid before you register. DeedOwl doesn’t list homes from auction marketplaces."
    },
    {
      title: "Know the owner-occupant priority periods",
      detail: "HUD: owner-occupants, government entities and HUD-approved nonprofits bid first, for 15 days (5 days for homes marked “uninsured”) (HUD Mortgagee Letter 2025-13). Freddie Mac: First Look for the first 30 days in the MLS. Fannie Mae: First Look for the first 30 days on HomePath. Fannie Mae’s owner-occupant buyers promise they’ll move in within 60 days of closing and live there at least a year. Making that promise falsely can cost you $10,000 in damages."
    },
    {
      title: "Read the seller’s addendum before you sign",
      detail: "Bank and government sellers use their own addendum. It usually overrides parts of the Arizona purchase contract, such as repairs, deadlines and per-day fees for late closing. Ask what disclosures the seller will give. Bank sellers usually don’t fill out the SPDS, since a lender that never lived in the home may know little. The seller still has to disclose what it knows, even without an SPDS (ADRE Buyer Advisory)."
    },
    {
      title: "Inspect everything you can",
      detail: "The ADRE Buyer Advisory calls a professional inspection “absolutely essential.” Also check the roof age, pool barriers and sewer connection (a plumber can verify it). Check any septic or other on-site system. The ADRE Buyer Advisory says a qualified inspector must inspect it within six months before a transfer. Also check for soil problems such as expansive soil or earth fissures, termites, and a five-year insurance claims history. Homes built before 1978 need a lead-based paint disclosure."
    },
    {
      title: "Check rural and HOA disclosures",
      detail: "If you’re buying 5 or fewer parcels of unsubdivided land in an unincorporated area, the seller must give you an affidavit of disclosure at least 7 days before transfer. It covers access, flood zone, utilities, water, septic and more. You can cancel (rescind) within 5 days after you get it (A.R.S. 33-422). In an HOA or condo, you should receive the resale disclosure the ADRE Buyer Advisory describes (A.R.S. 33-1260 and 33-1806). Also ask whether the home is in a Community Facilities District, which adds to the tax bill."
    },
    {
      title: "Appraise and review title",
      detail: "Your lender orders the appraisal. Read the title commitment, especially the Schedule B exceptions. These are easements and other items your policy won’t cover. Escrow can request an HOA statement of unpaid assessments. The HOA must give it within 10 days, and the HOA is held to the amounts in it (A.R.S. 33-1807)."
    },
    {
      title: "Close through escrow and record",
      detail: "Buyer and seller each sign the Arizona affidavit of property value. It is filed with the deed unless exempt; the recording fee already includes Arizona’s $2 transfer fee (A.R.S. 11-1132). A sale where a U.S. agency such as HUD is the named seller is listed as exempt (code A3)."
    },
    {
      title: "Fix your property tax class",
      detail: "While a bank or other lender owns a home it took back in foreclosure, the home is taxed as class 4 residential property (A.R.S. 42-12004). If you’ll live there, make sure the county assessor classifies it as your primary residence, class 3 (A.R.S. 42-12003). Confirm the steps with your county assessor."
    }
  ],
  survives: {
    wipedOut: [
      "Most liens, which the seller pays off or releases at closing (confirm on the title commitment)",
      "In a planned community, the HOA’s lien for assessments then due, if the HOA fails to give escrow its requested statement within 10 days (A.R.S. 33-1807)"
    ],
    mayStay: [
      "Anything listed as an exception in Schedule B of the title commitment, such as easements and CC&Rs",
      "Community Facilities District and other special assessments on the tax bill",
      "Occupants, if the seller hasn’t delivered the home vacant (confirm in the addendum)",
      "Physical problems the seller didn’t know about or disclose. You buy as is"
    ]
  },
  mistakes: [
    {
      mistake: "Skipping the addendum",
      prevent: "Read every page. It can shift repairs, deadlines and per-day late fees to you."
    },
    {
      mistake: "Skipping the inspection because the home is as is",
      prevent: "As is means the seller won’t fix things. It does not mean you shouldn’t know about them. Inspect within your contingency period."
    },
    {
      mistake: "Signing a false owner-occupant certification",
      prevent: "Bid during First Look only if you’ll live there. A false Fannie Mae certification can cost $10,000 in damages. It can also bar you from future sales."
    },
    {
      mistake: "Using an unregistered agent",
      prevent: "HUD requires a HUD-registered broker. Fannie Mae requires a HomePath-registered agent. Confirm before you find the home you want."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Avery, a fictional buyer, offers on a Fannie Mae home in Mesa during First Look. Avery signs the owner-occupant certification. The inspection finds a failing roof and signs of old termite damage. The as-is addendum means no repairs. But Avery’s agent negotiates a lower price before the inspection period ends.",
    lesson: "Bank-owned homes are sold as is. But your inspection period still gives you room to renegotiate or walk away. Use it fully."
  },
  sources: [
    { label: "HUD Mortgagee Letter 2025-13: 15-day exclusive listing period", url: "https://hud.gov/sites/dfiles/OCHCO/documents/2025-13hsgml.pdf" },
    {
      label: "HUD Home Store",
      url: "https://www.hudhomestore.gov/"
    },
    {
      label: "HUD Home Store: FAQ (listing periods, owner-occupants, repair escrow)",
      url: "https://hudhomestore.gov/FAQ"
    },
    {
      label: "Fannie Mae HomePath",
      url: "https://homepath.fanniemae.com/property-finder"
    },
    {
      label: "Fannie Mae HomePath: registration and online offer process",
      url: "https://homepath.fanniemae.com/images/documents/HomePath_Online_Offer_Tips.pdf"
    },
    {
      label: "Fannie Mae HomePath: Owner Occupant Certification",
      url: "https://homepath.fanniemae.com/images/documents/Owner_Occupant_Certification.pdf"
    },
    {
      label: "Freddie Mac HomeSteps: First Look Initiative",
      url: "https://www.homesteps.com/homebuyer/firstlook"
    },
    {
      label: "Arizona Department of Real Estate: Buyer Advisory (January 2025)",
      url: "https://azre.gov/sites/default/files/2025-08/Buyer%20Advisory%20January%202025.pdf"
    },
    {
      label: "A.R.S. 33-422: Affidavit of disclosure for unsubdivided land",
      url: "https://www.azleg.gov/ars/33/00422.htm"
    },
    {
      label: "A.R.S. 33-1807: HOA statement of unpaid assessments",
      url: "https://www.azleg.gov/ars/33/01807.htm"
    },
    {
      label: "A.R.S. 11-1133: Affidavit of property value",
      url: "https://www.azleg.gov/ars/11/01133.htm"
    },
    {
      label: "Arizona Department of Revenue: Affidavit of Property Value (Form 82162) and exemption codes",
      url: "https://azdor.gov/sites/default/files/2023-05/FORMS_PROPERTY_2019_82162-f.pdf"
    },
    {
      label: "Arizona Department of Revenue: Property Classification",
      url: "https://azdor.gov/sites/default/files/2023-03/PROPERTY_PropertyClassification.pdf"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azshort",
  title: "Arizona short sales",
  short: "Short sales",
  oneLine: "The owner sells for less than the loan balance, and the lender agrees to accept less. You buy through the listing agent. The sale can close only after every lienholder approves.",
  youGet: "The home by a normal Arizona sale through escrow, with title insurance, once the lender (and any other lienholder) approves the price.",
  forSale: true,
  glance: [
    {
      label: "What it is",
      value: "A sale for less than what’s owed on the mortgage, which the lender must agree to. It’s one of the ways lenders help borrowers avoid foreclosure, called loss mitigation (CFPB)"
    },
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent, marked “short sale” or “subject to lender approval”"
    },
    {
      label: "Timeline",
      value: "Often weeks to months for lender approval. Each lienholder reviews separately"
    },
    {
      label: "Foreclosure risk",
      value: "A trustee’s sale can still happen. In Arizona that sale is final, with no buy-back for the owner (A.R.S. 33-811). The one exception: if the sale wipes out a junior federal tax lien, the United States can still redeem within 120 days (26 USC 7425(d))"
    },
    {
      label: "Financing and inspection",
      value: "Allowed, on the usual Arizona contract plus the lender’s approval terms"
    },
    {
      label: "Deficiency",
      value: "Whether the lender can go after the seller for the shortfall is between the seller and the lender. Arizona’s anti-deficiency laws may matter (A.R.S. 33-729 and 33-814). The seller should ask an attorney"
    },
    {
      label: "Contact",
      value: "Only through the listing agent and escrow. Never contact the owner directly"
    }
  ],
  steps: [
    {
      title: "Get pre-approved",
      detail: "Lenders approving a short sale want proof you can close. Have your pre-approval letter or proof of funds ready to send with your offer."
    },
    {
      title: "Use an agent with short-sale experience",
      detail: "Your agent works with the listing agent, who manages the seller’s file with the lender. All questions go through the agents. Never contact the owner directly. Never send the owner letters or offers outside the listing."
    },
    {
      title: "Offer subject to lender approval",
      detail: "The seller accepts your offer first. Then the listing agent sends it to the lender with the seller’s hardship package. Your contract should say what happens if approval doesn’t come by a set date."
    },
    {
      title: "Ask about every lien",
      detail: "A second mortgage, HOA lien or judgment lien must also be released. Each holder may ask for more money. Ask your title company for a preliminary report early. Escrow can request the HOA’s statement of unpaid assessments. The HOA must give it within 10 days (A.R.S. 33-1807)."
    },
    {
      title: "Watch the foreclosure calendar",
      detail: "Ask the listing agent whether a trustee’s sale is scheduled, and whether the lender will postpone it. Federal rules limit a foreclosure sale while the lender reviews the owner’s complete application for help (a loss-mitigation application), which can include a short sale. This applies if the lender got the application more than 37 days before the sale, and only when the home is the owner’s principal residence (12 CFR 1024.41, 1024.30(c)(2)). An Arizona trustee’s sale is final, so if it goes ahead, your deal ends (A.R.S. 33-811)."
    },
    {
      title: "Inspect during your inspection period",
      detail: "Short-sale sellers often can’t afford repairs, and the lender won’t pay for them. Use your inspection period. Review the SPDS and other disclosures with your agent (ADRE Buyer Advisory)."
    },
    {
      title: "Read the lender’s approval letter",
      detail: "It sets the approved price, the closing deadline and what the lender will pay at closing. Ask your agent to check that it matches your contract. If the date is tight, line up your loan early."
    },
    {
      title: "Close through escrow",
      detail: "Every payment goes through escrow and is disclosed to the lender. Never pay a “negotiator” or anyone else outside escrow. Buyer and seller sign the Arizona affidavit of property value for recording (A.R.S. 11-1133)."
    }
  ],
  survives: {
    wipedOut: [
      "Mortgages and liens whose holders approve the sale and release them at closing"
    ],
    mayStay: [
      "Any lien whose holder doesn’t agree. The sale can’t close with a clear title until they do",
      "Property taxes, which escrow pays at closing. They are a lien ahead of almost all others (A.R.S. 42-17153)",
      "Easements, CC&Rs and other Schedule B exceptions on the title commitment"
    ]
  },
  mistakes: [
    {
      mistake: "Contacting the owner directly",
      prevent: "Go through the listing agent only. DeedOwl never helps anyone contact owners in distress."
    },
    {
      mistake: "Paying a fee outside escrow",
      prevent: "All money goes through escrow and is disclosed to the lender. Walk away from anyone who asks for a side payment."
    },
    {
      mistake: "Assuming the sale will close",
      prevent: "Keep looking at other homes. The lender can reject or counter. A trustee’s sale can still go ahead."
    },
    {
      mistake: "Ignoring the second loan",
      prevent: "Ask up front how many liens there are. Each lienholder must agree."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Casey, a fictional buyer, offers $340,000 on a Chandler short sale. The first lender approves after 11 weeks. Then the second-mortgage holder asks for $6,000 more to release its lien. The first lender agrees to let escrow pay part of it. The approval letter gives 30 days to close.",
    lesson: "Expect each lienholder to negotiate. Have your loan ready so you can meet the approval letter’s deadline."
  },
  sources: [
    {
      label: "CFPB: What is a short sale?",
      url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-short-sale-en-290/"
    },
    {
      label: "12 CFR 1024.41: Loss mitigation procedures (foreclosure sale limits)",
      url: "https://www.consumerfinance.gov/rules-policy/regulations/1024/41/"
    },
    {
      label: "A.R.S. 33-811: Trustee’s sale is final, no redemption",
      url: "https://www.azleg.gov/ars/33/00811.htm"
    },
    {
      label: "A.R.S. 33-1807: HOA statement of unpaid assessments",
      url: "https://www.azleg.gov/ars/33/01807.htm"
    },
    {
      label: "A.R.S. 42-17153: Property tax lien priority",
      url: "https://www.azleg.gov/ars/42/17153.htm"
    },
    {
      label: "A.R.S. 11-1133: Affidavit of property value",
      url: "https://www.azleg.gov/ars/11/01133.htm"
    },
    {
      label: "Arizona Department of Real Estate: Buyer Advisory (January 2025)",
      url: "https://azre.gov/sites/default/files/2025-08/Buyer%20Advisory%20January%202025.pdf"
    },
    {
      label: "Our short-sale guide",
      url: "#/short-sales"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.attorney],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azcommercial",
  title: "Arizona commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land sold in Arizona. They are sold at trustee, sheriff and tax sales, by receivers, and by bank or government sellers.",
  youGet: "The same kind of deed you’d get buying a home the same way. But you don’t get home-buyer protections, and the property often comes with tenants, leases, city rent taxes and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: trustee’s sales, which are final with no buy-back by the owner (A.R.S. 33-811), and sheriff’s sales, which have a 6-month redemption period in most cases (A.R.S. 12-1282, 12-1283). Also tax lien sales, court receivers, and bank or government sellers"
    },
    {
      label: "Value",
      value: "For a rental property, divide net operating income by the cap rate. For land, or a building the owner will use, look at recent sales of similar commercial property"
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment (ASTM E1527-21) can help protect you from having to pay for a federal cleanup. Have it completed (or updated) within one year before you take title, with key parts done or updated within 180 days. You also have to qualify for the protection and meet ongoing duties after you buy"
    },
    {
      label: "Transfer tax",
      value: "None. Arizona’s constitution bars new taxes or fees on transferring real property (Ariz. Const. art. 9, § 24). You file an affidavit of property value with the deed; the recording fee already includes Arizona’s $2 transfer fee (A.R.S. 11-1132)"
    },
    {
      label: "Property tax class",
      value: "Commercial and industrial property is class 1 (A.R.S. 42-12001). Residential rentals, including apartments, are class 4 (A.R.S. 42-12004). Each class has its own assessment ratio (A.R.S. 42-15001 to 42-15009). Confirm the current ratio with the county assessor"
    },
    {
      label: "Rent tax",
      value: "Cities, and some counties, charge a transaction privilege tax (TPT) on commercial rent. Look up the address on the ADOR rate tool"
    },
    {
      label: "Tenants",
      value: "A trustee’s sale clears interests that rank behind the deed of trust, and that can include later leases (A.R.S. 33-811). The federal tenant protection law (PTFA) covers residential tenants, not stores or offices"
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor record for land use, building size, year built and property class. Use the parcel map to find the parcel and spot questions. The title company confirms legal access from recorded easements, and a survey confirms boundaries. Work only with the official seller: the trustee, sheriff, receiver, treasurer or the bank’s listing broker. Never contact the owner, its employees or its customers."
    },
    {
      title: "Know which sale rules apply",
      detail: "A trustee’s sale is final, with no buy-back period for the owner, and it clears liens that rank behind the deed of trust (A.R.S. 33-811). One exception: if the sale wiped out a junior federal tax lien, the United States can redeem within 120 days (or the state period if longer); if the IRS wasn’t properly notified, its lien stays (26 USC 7425). A sheriff’s sale after a court foreclosure has a 6-month redemption period in most cases (A.R.S. 12-1282, 12-1283). A tax lien sale gives a lien, not the building. Read the right DeedOwl guide for each."
    },
    {
      title: "Get the rent roll and leases, if you can",
      detail: "A receiver or listing broker can usually provide them. At an auction you often can’t get them. Until you can confirm the leases, count the rent as zero, but don’t assume the building is legally empty: tenants may have rights to stay. Plan how you’ll confirm who occupies it and gain possession lawfully, and ask an attorney before you enter, renovate or remove anyone. Leases may stay if they were recorded or signed before the deed of trust, or have a non-disturbance agreement. Ask an attorney."
    },
    {
      title: "Value it the right way",
      detail: "For a rental building, divide net operating income by the cap rate. Net operating income is rent after vacancy and operating costs. Ask a local commercial broker or appraiser for current cap rates. Include Arizona costs: class 1 property tax, and city or county TPT on commercial rent. TPT covers rent and many reimbursements, such as property tax, insurance and common area charges (ADOR)."
    },
    {
      title: "Order a title search",
      detail: "Commercial parcels often carry easements, CC&Rs, reciprocal easement agreements, mechanic’s liens and recorded leases. Property taxes are a lien ahead of almost all others (A.R.S. 42-17153). Find out which items stay after your kind of sale."
    },
    {
      title: "Screen for contamination",
      detail: "Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Search EPA records and the Arizona Department of Environmental Quality (ADEQ) for nearby landfills and contamination sites. Get a Phase I assessment finished (not just ordered) within one year before you take title. Its interviews, records review, site visit and lien search must be done or updated within 180 days before you take title. A report alone doesn’t guarantee protection: you also have to qualify and keep meeting ongoing duties after you buy (EPA All Appropriate Inquiries)."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Ask the city or county planning department whether your planned use is allowed. Ask whether there are open code cases or expired permits. A special rule applies if the land is in an unincorporated area and the sale is 5 or fewer unsubdivided parcels. Then the seller (other than a trustee at a trustee’s sale or a sheriff at an execution sale) must give you an affidavit of disclosure covering access, utilities, flood zone and zoning. You can cancel (rescind) within 5 days (A.R.S. 33-422)."
    },
    {
      title: "Line up your money",
      detail: "Trustee and sheriff sales need certified funds within days. A trustee’s sale also needs a deposit to bid. Confirm the amounts and deadlines in the notice and in DeedOwl’s Arizona trustee and sheriff sale guides. Have a commercial or bridge lender ready to refinance after."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it, and secure the building. Tell tenants in writing where to pay rent. Ask each tenant to sign an estoppel certificate confirming their lease. Register for TPT if you’ll collect commercial rent (ADOR). In a building open to the public, plan to remove accessibility barriers where that is readily achievable (ADA)."
    }
  ],
  survives: {
    wipedOut: [
      "Liens and interests junior to the deed of trust foreclosed at a trustee’s sale (A.R.S. 33-811)",
      "Leases junior to that deed of trust, unless the lender agreed to keep them (non-disturbance agreement).* A tenant whose lease is wiped out can also leave. Confirm with an attorney"
    ],
    mayStay: [
      "Property taxes and special assessments (A.R.S. 42-17153)",
      "Liens recorded before the lien being foreclosed",
      "Responsibility for environmental cleanup. It can follow whoever owns the property, not the lien*",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases that rank ahead of the deed of trust or have a non-disturbance agreement",
      "Residential tenants’ federal 90-day notice rights in apartment buildings (PTFA)"
    ]
  },
  mistakes: [
    {
      mistake: "Valuing it like a house",
      prevent: "Use income and cap rate. A vacant building is worth its leased value minus the cost of getting there. That means lost rent, leasing commissions and tenant improvements."
    },
    {
      mistake: "Forgetting Arizona’s rent tax and commercial tax class",
      prevent: "Budget for city or county TPT on commercial rent and class 1 property tax. Check the address on the ADOR rate tool. Confirm the class with the county assessor."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. Check EPA and ADEQ records and get a Phase I assessment before you’re committed; if you can’t, count that risk in whether to buy at all."
    },
    {
      mistake: "Assuming the tenants will keep paying",
      prevent: "Get estoppel certificates. Budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Jamie, a fictional buyer, wins a small Phoenix-area retail building at a trustee’s sale. The rent roll from the old listing showed full occupancy. But two tenants’ leases were signed after the deed of trust and had no non-disturbance agreements. Both tenants used the sale to leave. And Jamie’s budget hadn’t included city TPT on the remaining rent.",
    lesson: "Check lease priority before you bid. Count Arizona’s rent tax and commercial tax class in your numbers."
  },
  sources: [
    {
      label: "A.R.S. 33-811: Trustee’s deed; junior interests cleared; no redemption",
      url: "https://www.azleg.gov/ars/33/00811.htm"
    },
    {
      label: "A.R.S. 12-1282: Redemption periods",
      url: "https://www.azleg.gov/ars/12/01282.htm"
    },
    {
      label: "A.R.S. 12-1283: Redemption after foreclosure",
      url: "https://www.azleg.gov/ars/12/01283.htm"
    },
    {
      label: "A.R.S. 42-17153: Property tax lien priority",
      url: "https://www.azleg.gov/ars/42/17153.htm"
    },
    {
      label: "A.R.S. 33-422: Affidavit of disclosure for unsubdivided land",
      url: "https://www.azleg.gov/ars/33/00422.htm"
    },
    {
      label: "Arizona Constitution art. 9, § 24: No new real property transfer taxes",
      url: "https://azleg.gov/const/9/24.htm"
    },
    {
      label: "A.R.S. 11-1133: Affidavit of property value",
      url: "https://www.azleg.gov/ars/11/01133.htm"
    },
    {
      label: "Arizona Department of Revenue: Affidavit of Property Value (Form 82162)",
      url: "https://azdor.gov/sites/default/files/2023-05/FORMS_PROPERTY_2019_82162-f.pdf"
    },
    {
      label: "Arizona Department of Revenue: Property Classification",
      url: "https://azdor.gov/sites/default/files/2023-03/PROPERTY_PropertyClassification.pdf"
    },
    {
      label: "Arizona Department of Revenue: Commercial lease (TPT)",
      url: "https://azdor.gov/business/transaction-privilege-tax/commercial-lease"
    },
    {
      label: "EPA: All Appropriate Inquiries (Phase I environmental site assessments)",
      url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
    },
    {
      label: "Federal Reserve CA 18-4: Protecting Tenants at Foreclosure Act",
      url: "https://www.federalreserve.gov/supervisionreg/caletters/caltr1804.htm"
    },
    {
      label: "ADA.gov: businesses open to the public",
      url: "https://www.ada.gov/topics/title-iii/"
    },
    {
      label: "Arizona Department of Real Estate: Buyer Advisory (January 2025)",
      url: "https://azre.gov/sites/default/files/2025-08/Buyer%20Advisory%20January%202025.pdf"
    }
  ],
  team: [TEAM.commercialBroker, TEAM.title, TEAM.attorney, TEAM.environmental, TEAM.commercialLender, TEAM.insurance, TEAM.contractor, TEAM.propertyManager, TEAM.cpa],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "uthoa",
  title: "Utah HOA foreclosures",
  short: "HOA foreclosures",
  oneLine: "A Utah homeowners or condo association can sell a home to collect unpaid assessments (dues). It can use a trustee sale or a court case.",
  youGet: "The owner’s interest, usually with the first mortgage still on it. After a trustee sale, the owner has no right to buy it back (but if the sale wipes out a junior federal tax lien, the United States can still redeem for 120 days). After a court (sheriff) sale, there is a 180-day redemption period, and a federal tax lien wiped out by that sale gets the same 180 days. Any other United States lien wiped out by a court sale gets one year (28 USC 2410(c)).",
  plain: 'The owner’s interest, usually with the first mortgage still on it. No buy-back after a trustee sale. After a court sale, 180 days.',
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Community Association Act (Utah Code 57-8a-301 to 57-8a-306) for HOAs. Condominium Ownership Act (57-8-44 to 57-8-47) for condos. The rules are nearly the same."
    },
    {
      label: "Two ways to foreclose",
      value: "Nonjudicial (a trustee sale, as if the lien were a trust deed) or judicial (a court case ending in a sheriff’s sale) (57-8a-302, 57-8-45)."
    },
    {
      label: "Trustee needed",
      value: "A trustee sale can happen only if the association appoints a qualified trustee. That means a Utah attorney or law firm, or a title insurance company or agency with an office in Utah (57-8a-302(3), 57-1-21)."
    },
    {
      label: "Priority",
      value: "The association’s lien ranks behind a first or second mortgage recorded before the association recorded its notice of lien. It also ranks behind liens recorded before the declaration, and behind property taxes (57-8a-301(4), 57-8-44(4)). There is no Nevada-style super-priority."
    },
    {
      label: "Limits on trustee sales",
      value: "The owner must get 30 days’ warning and can demand a court case instead. A trustee sale can’t be used to collect fines, and an assessment has to be more than 180 days overdue (57-8a-303, 57-8-46)."
    },
    {
      label: "Redemption",
      value: "After a trustee sale, the owner has no right to buy it back (57-1-28). But if the sale wiped out a junior federal tax lien, the United States may redeem within 120 days (26 USC 7425(d)). After a court foreclosure, there are 180 days to redeem after the sheriff’s sale (78B-6-906, URCP 69C). If that sale wiped out a federal tax lien, the United States also gets 120 days or the state period, whichever is longer, so 180 days (28 USC 2410(c)). A sale that didn’t wipe the lien out (the IRS didn’t get the required notice, or the United States wasn’t named in the court case) leaves the lien on the home instead."
    },
    {
      label: "Registration",
      value: "An association that isn’t registered with the Utah Department of Commerce can’t enforce its lien while it is out of compliance (57-8a-105, 57-8-13.1)."
    },
    {
      label: "Payment",
      value: "As the trustee or sheriff directs. Read the notice of sale and call the office named on it."
    }
  ],
  steps: [
    {
      title: "Find the notice and learn which kind of sale it is",
      detail: "A trustee sale uses the same notices as any Utah trust deed sale. First a notice of default is recorded with the county recorder. Then a notice of sale is published and posted (57-1-24, 57-1-25). A court foreclosure ends in a sheriff’s sale under the court rules. The notice names the trustee or sheriff to call."
    },
    {
      title: "Find every loan ahead of the association",
      detail: "Order a title report. A first or second mortgage recorded before the association’s notice of lien stays ahead of the association’s lien. So do property taxes. Your purchase usually leaves that mortgage on the home. If it isn’t paid, its lender can still foreclose and wipe you out."
    },
    {
      title: "Check that the sale was set up correctly",
      detail: "For a trustee sale, check four things. The trustee must be a qualified Utah attorney or title company. The owner must have received the 30-day notice with the right to demand a court case. The lien can’t include fines, and it must include an assessment more than 180 days overdue (57-8a-302, 57-8a-303). Ask the trustee for its file. Have a title company or attorney review it before you bid."
    },
    {
      title: "Confirm the association is registered",
      detail: "Utah associations must register with the Department of Commerce and keep it current. While an association is out of compliance, it can’t enforce its lien (57-8a-105, 57-8-13.1). Ask the trustee or the association’s attorney to confirm registration. Have your title company check it too."
    },
    {
      title: "Set your maximum bid",
      detail: "Add up the surviving mortgage balance, unpaid property taxes, future dues, repairs and your holding costs. Use Analyze a deal (Fix and sell) to find your walk-away price. A cheap opening bid can be very expensive once the first mortgage is added."
    },
    {
      title: "Bid and pay as directed",
      detail: "At a trustee sale, every bid is final (irrevocable), and you pay as the trustee directs (57-1-27, 57-1-28). At a sheriff’s sale, confirm payment terms with the sheriff’s civil office. Look at the home only from the street. Don’t contact the owner or occupants."
    },
    {
      title: "Get your deed, or wait out redemption",
      detail: "After a trustee sale, the trustee sends the trustee’s deed for recording within five business days after you pay. There is no buy-back period (57-1-28). After a sheriff’s sale, you get a certificate of sale. The owner or a junior creditor can buy the property back within 180 days by paying your price plus 6% and recorded costs (URCP 69C)."
    },
    {
      title: "Take over lawfully and keep paying the loan holder in mind",
      detail: "Insure the home and start paying the dues. Talk to the senior lender’s servicer about the loan that stayed on the property (an attorney can advise how). If anyone lives there, use the court’s unlawful detainer (eviction) process with an attorney. Never change locks or remove belongings on your own."
    }
  ],
  survives: {
    wipedOut: [
      "The association’s lien being foreclosed",
      "The owner’s interest and liens recorded after the association’s lien, if the sale was valid",
      "The former owner’s right to buy it back, after a trustee sale (there is none under Utah law; the United States can still redeem within 120 days if the sale wiped out a junior federal tax lien)"
    ],
    mayStay: [
      "A first or second mortgage recorded before the association’s notice of lien (the usual case)",
      "Liens recorded before the association’s declaration",
      "Property taxes and other government assessments (they attach every January 1)",
      "Easements, CC&Rs and other recorded encumbrances",
      "The 180-day redemption right, after a court foreclosure and sheriff’s sale"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming an HOA sale wipes out the mortgage",
      prevent: "Utah’s association lien ranks behind a first or second mortgage recorded before the notice of lien. Get a title report. Add the surviving loan to your price."
    },
    {
      mistake: "Ignoring how the sale was started",
      prevent: "Utah law bars a trustee sale in four cases: the owner didn’t get the 30-day notice, the owner demanded a court case, the lien included fines, or no assessment was more than 180 days overdue (57-8a-303). A sale held anyway may be open to challenge.* Have an attorney or title company review the trustee’s file."
    },
    {
      mistake: "Fixing up during a sheriff’s sale redemption period",
      prevent: "After a court foreclosure, the owner can redeem for 180 days. Spend only to protect the property. Record notice of what you pay (URCP 69C)."
    },
    {
      mistake: "Forgetting the first lender can still foreclose",
      prevent: "If the senior loan is in default, its trustee can sell the home and wipe out your interest. Check the loan status. Budget to deal with it."
    }
  ],
  example: {
    title: "Illustrative example: the $6,000 townhome",
    story: "Morgan, a made-up investor, saw a notice of trustee’s sale for a townhome in a fictional Utah HOA. The association was owed about $6,000. Morgan’s title report showed a $240,000 first trust deed. It was recorded years before the association recorded its notice of lien. The home was worth about $300,000. Morgan also learned the first loan was already in default.",
    lesson: "The first trust deed would survive. So the real cost was about $246,000 plus taxes, dues and repairs, with a foreclosure risk on top. Morgan passed. Price an HOA sale as if the first mortgage stays."
  },
  sources: [
    {
      label: "Utah Code 57-8a-301 (HOA lien and priority)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S301.html"
    },
    {
      label: "Utah Code 57-8a-302 (enforcement, trustee appointment)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S302.html"
    },
    {
      label: "Utah Code 57-8a-303 (notice and limits on nonjudicial foreclosure)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S303.html"
    },
    {
      label: "Utah Code 57-8a-304 (trust deed rules apply)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S304.html"
    },
    {
      label: "Utah Code 57-8a-305 and 57-8a-306 (one-action rule, costs and fees)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S306.html"
    },
    {
      label: "Utah Code 57-8a-105 (HOA registration with Department of Commerce)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8a/57-8a-S105.html"
    },
    {
      label: "Utah Code 57-8-44 (condo association lien and priority)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8/57-8-S44.html"
    },
    {
      label: "Utah Code 57-8-45 to 57-8-47 (condo lien enforcement)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8/57-8-S46.html"
    },
    {
      label: "Utah Code 57-8-13.1 (condo association registration)",
      url: "https://le.utah.gov/xcode/Title57/Chapter8/57-8-S13.1.html"
    },
    {
      label: "Utah Code 57-1-21 (who can be a trustee)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S21.html"
    },
    {
      label: "Utah Code 57-1-28 (trustee’s deed, no redemption)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S28.html"
    },
    {
      label: "Utah Code 78B-6-906 (redemption after court foreclosure)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S906.html"
    },
    {
      label: "Utah Rules of Civil Procedure, Rule 69C (redemption)",
      url: "https://legacy.utcourts.gov/rules/view.php?type=urcp&rule=69C"
    },
    {
      label: "Utah Code 59-2-1325 (property tax lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1325.html"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utirs",
  title: "Utah IRS sales",
  short: "IRS sales",
  oneLine: "The IRS takes and sells a Utah property to collect unpaid federal taxes. It sells by public auction or sealed bid, under federal law.",
  youGet: "A certificate of sale when you pay. If no one buys the property back during the 180-day redemption period, you then get a deed to the taxpayer’s interest. The property is sold as-is, and liens ahead of the IRS stay with it.",
  plain: 'A certificate when you pay. Then a deed after 180 days, if no one buys it back. As is, with debts ahead of the IRS still on it.',
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Federal: 26 U.S.C. 6335 (sale), 6337 (redemption), 6338 (certificate and deed), 6339 (effect of the deed). Utah law adds recording rules."
    },
    {
      label: "Where listed",
      value: "irsauctions.gov. The IRS also publishes notice in a newspaper in the county, or posts it if the county has no newspaper (6335(b))."
    },
    {
      label: "Timing",
      value: "The sale is held 10 to 40 days after public notice. It is in the county where the property was seized, unless the IRS orders otherwise (6335(d))."
    },
    {
      label: "Minimum bid",
      value: "The IRS sets it before the sale, and there is no sale below it. If no one bids that much, the property may be treated as sold to the United States, or released back to the owner (6335(e))."
    },
    {
      label: "Payment",
      value: "Cash, certified, cashier’s or treasurer’s check, or a U.S. postal, bank or express money order. Make it payable to the United States Treasury (Form 2434-B). Pay in full or defer part, as the notice says."
    },
    {
      label: "Redemption",
      value: "180 days. The owner, their heirs, or anyone with an interest or lien can buy the property back (redeem). They pay you your price plus 20% a year interest, which the IRS says is compounded daily (6337, Form 2434-B)."
    },
    {
      label: "What you get",
      value: "A certificate of sale (Form 2435) when you pay in full. A deed after 180 days if no one redeems (6338)."
    },
    {
      label: "Court-ordered sales",
      value: "Different rules. A federal court can order a sale in a lien case (26 U.S.C. 7403). The terms come from the court’s order. Read it."
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov for Utah listings",
      detail: "IRS real estate sales are rare and scattered. Each listing links a notice of sale. It gives the date, place, minimum bid and payment terms. It also says whether the sale is by auction or sealed bid."
    },
    {
      title: "Read the notice of encumbrances (Form 2434-B)",
      detail: "The IRS lists the liens and interests it knows about, but it doesn’t promise the list is right. Mortgages and liens ahead of the federal tax lien stay with the property. Order your own title report from a Utah title company."
    },
    {
      title: "Check whether it’s the taxpayer’s home",
      detail: "The IRS can levy on (take) a taxpayer’s main home only with a federal judge’s written approval (26 U.S.C. 6334(a)(13), (e)). If it’s a home, look for that approval in the file. Remember someone may live there."
    },
    {
      title: "Inspect only what you can see legally",
      detail: "The property is sold as-is and where-is. There is no warranty about title or condition, and no refund if it isn’t what you expected (Form 2434-B). View it from the street. Don’t contact the owner or occupants."
    },
    {
      title: "Set your maximum bid",
      detail: "Add any senior mortgage, unpaid Utah property taxes, repairs, and 180 days of holding costs. Use Analyze a deal (Fix and sell) to find your walk-away price."
    },
    {
      title: "Bid and pay as the notice requires",
      detail: "If full payment is required and you don’t pay, the IRS resells right away. If part can be deferred and you miss it, you can be sued for the rest with 6% interest. Or the sale can be canceled, and you lose what you paid (6335(e)(3))."
    },
    {
      title: "Hold your certificate for 180 days",
      detail: "Anyone with the right to redeem can buy the property back within 180 days by paying your price plus 20% a year. Whether you can collect rent, evict or move in during this time isn’t spelled out in the federal statutes. Ask a Utah attorney before you bid, and don’t start renovations."
    },
    {
      title: "Get your deed and record it with the county recorder",
      detail: "If no one redeems, turn in the certificate of sale to the IRS office named on it to get your deed (6338, Form 2434-B). Record it right away with the recorder in the Utah county where the land sits. Utah lets a federal document be recorded without notarization (Utah Code 57-4a-3). An unrecorded deed can lose out to a later good-faith buyer who records first (57-3-103)."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone is still living there after you have the deed, hire an attorney and use Utah’s unlawful detainer (eviction) process (78B-6-802). Never use self-help, like changing the locks."
    }
  ],
  survives: {
    wipedOut: [
      "The federal tax lien being enforced",
      "Liens and interests that rank behind that federal tax lien (6339(c))",
      "The taxpayer’s interest, once the 180 days pass with no one redeeming"
    ],
    mayStay: [
      "Mortgages and liens ahead of the federal tax lien",
      "Utah property taxes (they attach every January 1). Check Form 2434-B and your title report",
      "Easements and other recorded encumbrances",
      "The 180-day redemption right"
    ]
  },
  mistakes: [
    {
      mistake: "Treating the IRS’s lien list as a title report",
      prevent: "The IRS says it doesn’t guarantee Form 2434-B is accurate. Order your own title search before you bid."
    },
    {
      mistake: "Renovating during the 180 days",
      prevent: "If someone redeems, they repay your price plus 20% a year, not your repairs. Wait for the deed."
    },
    {
      mistake: "Bringing the wrong kind of money",
      prevent: "Read the notice. The IRS takes cash, certified or cashier’s checks, and certain money orders, payable to the United States Treasury."
    },
    {
      mistake: "Not recording the deed",
      prevent: "Record it with the county recorder as soon as you get it. An unrecorded document can lose out to a later good-faith buyer who records first."
    }
  ],
  example: {
    title: "Illustrative example: a cabin lot near a fictional Utah town",
    story: "Avery, a made-up buyer, won an IRS sale for a mountain lot at $38,000. Avery paid with a cashier’s check made out to the United States Treasury. Avery’s title report showed no mortgage, but did show unpaid property taxes. Five months later, a lienholder redeemed. The lienholder paid Avery the $38,000 plus 20% a year interest.",
    lesson: "The interest paid Avery for the wait, but the lot was gone. Plan for redemption and pay attention to property taxes. Don’t spend on improvements until you have the deed."
  },
  sources: [
    {
      label: "IRS auctions (Treasury)",
      url: "https://www.irsauctions.gov/"
    },
    {
      label: "IRS Form 2434-B: notice of encumbrances and sale terms (sample)",
      url: "https://www.irsauctions.gov/system/files/2026-04/f2434b.pdf"
    },
    {
      label: "IRS: redeeming your real estate after seizure and sale",
      url: "https://www.irs.gov/businesses/small-businesses-self-employed/redeeming-your-real-estate"
    },
    {
      label: "26 U.S.C. 6335 (sale of seized property)",
      url: "https://www.law.cornell.edu/uscode/text/26/6335"
    },
    {
      label: "26 U.S.C. 6337 (redemption)",
      url: "https://www.law.cornell.edu/uscode/text/26/6337"
    },
    {
      label: "26 U.S.C. 6338 (certificate of sale, deed)",
      url: "https://www.law.cornell.edu/uscode/text/26/6338"
    },
    {
      label: "26 U.S.C. 6339 (effect of the deed, junior liens)",
      url: "https://www.law.cornell.edu/uscode/text/26/6339"
    },
    {
      label: "26 U.S.C. 6334 (principal residence needs court approval)",
      url: "https://www.law.cornell.edu/uscode/text/26/6334"
    },
    {
      label: "26 U.S.C. 7403 (court-ordered sales)",
      url: "https://www.law.cornell.edu/uscode/text/26/7403"
    },
    {
      label: "Utah Code 57-4a-3 (federal documents recordable without acknowledgment)",
      url: "https://le.utah.gov/xcode/Title57/Chapter4a/57-4a-S3.html"
    },
    {
      label: "Utah Code 57-3-103 (effect of not recording)",
      url: "https://le.utah.gov/xcode/Title57/Chapter3/57-3-S103.html"
    },
    {
      label: "Utah Code 59-2-1325 (property tax lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1325.html"
    },
    {
      label: "Utah Code 78B-6-802 (unlawful detainer)",
      url: "https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S802.html"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utreo",
  title: "Utah bank-owned (REO) homes",
  short: "Bank-owned (REO)",
  oneLine: "These are homes a bank, Fannie Mae, Freddie Mac or HUD took back after foreclosure. They are sold through a listing agent with the seller’s own contract terms.",
  youGet: "The home, bought the normal way through a Utah title company. It’s usually as-is, and the seller’s addendum overrides parts of the standard contract.",
  forSale: true,
  glance: [
    {
      label: "Utah contract",
      value: "Utah real estate licensees (agents and brokers) must use the state-approved Real Estate Purchase Contract (REPC). But buyer and seller can agree to change it or use another form. Big sellers often do."
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Your agent must register on HomePath and submit offers online. Fannie Mae uses its own Residential Real Estate Purchase and Sale Contract. It won’t sign addenda that conflict with it. First Look: for the first 30 days on HomePath, only owner-occupants, public entities and some nonprofits can offer."
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: for the first 30 days a home is listed in the MLS, only owner-occupants, public entities and certain non-profits can buy. Investors can offer after that."
    },
    {
      label: "HUD homes",
      value: "Bids go through a HUD-registered broker. For homes listed since May 30, 2025, owner-occupants, government entities and HUD-approved non-profits get the first 15 days (5 days for homes marked “uninsured”) (HUD Mortgagee Letter 2025-13)."
    },
    {
      label: "Condition",
      value: "Usually as-is. The REPC itself says the buyer takes the home as-is after a due diligence (inspection and research) period. So use that period well."
    },
    {
      label: "Title",
      value: "Close through a Utah title company with an owner’s title insurance policy. Under the REPC, the seller pays for it. A bank’s addendum may change that."
    },
    {
      label: "Water",
      value: "Water rights and water shares can be part of the sale. The REPC includes those that serve the home unless the contract leaves them out. Check the seller’s addendum."
    }
  ],
  steps: [
    {
      title: "Find homes from direct sources",
      detail: "Search HomePath (Fannie Mae), HomeSteps (Freddie Mac) and HUD Home Store. Also search the real estate pages of banks and credit unions that own Utah homes. Avoid paid lists and middlemen."
    },
    {
      title: "Get pre-approved or gather proof of funds",
      detail: "Fannie Mae requires a pre-qualification or proof of funds before it accepts an offer. HomeSteps wants a pre-approval letter with every offer, or proof of funds for cash."
    },
    {
      title: "Hire a Utah buyer’s agent who knows REO",
      detail: "HUD requires a HUD-registered broker. HomePath requires your agent to be registered on its site. Your agent also handles the seller’s portal, forms and deadlines."
    },
    {
      title: "Make your offer on the right paperwork",
      detail: "Your agent starts from the Utah REPC or the seller’s own contract. Fannie Mae uses its own contract. It won’t accept an offer that depends on you selling another home or completing a 1031 exchange. HomeSteps requires its own addenda and certified earnest money at contract signing. Owner-occupant buyers sign an occupancy certification."
    },
    {
      title: "Read every page of the addendum",
      detail: "The seller’s addendum usually overrides the REPC on repairs, disclosures, deadlines, closing costs and penalties for late closing. Ask your agent to explain anything that shifts cost or risk to you."
    },
    {
      title: "Inspect during due diligence",
      detail: "The REPC gives you a due diligence period to inspect, test and review documents. By the deadline, you must cancel or resolve objections. Miss it and your earnest money can become non-refundable. A bank never lived in the home, so it may tell you little or nothing about its condition. Hire an inspector with a state Private Home Inspector license (Utah DOPL)."
    },
    {
      title: "Get the appraisal and loan approved",
      detail: "Under the REPC, you can cancel if the home appraises below the price (with a copy of the lender’s or appraiser’s notice of the appraised value) or you aren’t satisfied with your loan terms, but only by the Financing & Appraisal Deadline, and only if those conditions are checked on your contract. A low appraisal returns your earnest money. Canceling over loan terms can still give the seller the amount written in section 8.3(b)(i). If your loan fails after that deadline, the seller keeps all of it (REPC section 8.3(b)(iii)). Watch the dates."
    },
    {
      title: "Review the title commitment",
      detail: "Under the REPC it comes with the seller’s disclosures, so raise any title problem before the Due Diligence Deadline (the bank’s addendum may change this). Look for liens the seller hasn’t cleared, HOA dues, easements and water rights. If a lender took the home back at a Utah trustee sale, the former owner has no right to buy it back (57-1-28). But older liens can still be on title. A junior federal tax lien that the sale wiped out still gives the United States 120 days to redeem after the sale (26 USC 7425(d)), and one the sale didn’t wipe out stays on title."
    },
    {
      title: "Close through the title company",
      detail: "Sign, pay through the title company, and get your recorded deed and owner’s title policy. Ask the listing agent whether the home is vacant and who hands over the keys."
    }
  ],
  survives: {
    wipedOut: [
      "Liens the seller pays off or clears at closing (confirm on the final title commitment)",
      "The former owner’s rights, cleared by the foreclosure before the bank took title"
    ],
    mayStay: [
      "Anything listed as an exception in the title commitment",
      "Easements, CC&Rs and HOA dues",
      "Current-year property taxes (prorated at closing)",
      "Defects in the home, since it’s usually sold as-is"
    ]
  },
  mistakes: [
    {
      mistake: "Skipping the seller’s addendum",
      prevent: "Read every page before you sign. It often overrides repair, disclosure and deadline terms in the REPC."
    },
    {
      mistake: "Missing the due diligence deadline",
      prevent: "Schedule the inspection the day the offer is accepted. Cancel or resolve objections in writing before the deadline."
    },
    {
      mistake: "Investors offering during First Look",
      prevent: "Ask the listing agent how many First Look days are left. HomePath, HomeSteps and HUD consider investor offers only after their exclusive periods."
    },
    {
      mistake: "Signing an owner-occupant certification you won’t keep",
      prevent: "HomeSteps warns that a false affidavit can lead to criminal or civil liability. Only certify if you’ll live there."
    },
    {
      mistake: "Overlooking water rights",
      prevent: "Ask whether water shares or rights come with the home, and how they’ll be transferred at closing."
    }
  ],
  example: {
    title: "Illustrative example: a HomeSteps home in a fictional Utah suburb",
    story: "Sam, a made-up first-time buyer, found a Freddie Mac home on day 12 of its First Look period. Sam’s agent sent the offer with a pre-approval letter, the HomeSteps addenda and certified earnest money. The inspection found a cracked sewer line. The addendum said the seller made no repairs. So Sam negotiated a lower price before the due diligence deadline.",
    lesson: "Use the First Look window, send a complete offer, and inspect early. In an as-is sale, your due diligence period is when you can still change the deal."
  },
  sources: [
    {
      label: "Utah Division of Real Estate: state-approved forms",
      url: "https://commerce.utah.gov/realestate/real-estate/forms/state-approved/"
    },
    {
      label: "Utah Real Estate Purchase Contract (REPC)",
      url: "https://commerce.utah.gov/wp-content/uploads/2023/03/purchase-contract.pdf"
    },
    {
      label: "Fannie Mae HomePath",
      url: "https://homepath.fanniemae.com/"
    },
    {
      label: "Fannie Mae: HomePath registration and online offer process",
      url: "https://homepath.fanniemae.com/images/documents/HomePath_Online_Offer_Tips.pdf"
    },
    {
      label: "Freddie Mac HomeSteps: First Look Initiative",
      url: "https://www.homesteps.com/homebuyer/firstlook"
    },
    {
      label: "Freddie Mac HomeSteps: making an offer",
      url: "https://www.homesteps.com/homebuyer/making-an-offer"
    },
    {
      label: "HUD Home Store",
      url: "https://www.hudhomestore.gov/"
    },
    {
      label: "HUD Mortgagee Letter 2025-13: 15-day exclusive listing period",
      url: "https://hud.gov/sites/dfiles/OCHCO/documents/2025-13hsgml.pdf"
    },
    {
      label: "Utah Code 57-1-28 (trustee’s deed, no redemption)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S28.html"
    },
    {
      label: "Every direct bank and government source",
      url: "#/bank-owned"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utshort",
  title: "Utah short sales",
  short: "Short sales",
  oneLine: "The owner sells for less than the loan balance, and the lender agrees to accept less. Once the lender approves, you buy through the listing agent like a normal sale.",
  youGet: "The home, bought the normal way through a Utah title company, once every lienholder approves its payoff.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent as a short sale, subject to lender approval. All contact goes through the listing agent."
    },
    {
      label: "Contract",
      value: "The Utah REPC, with the short-sale terms in an addendum. The seller accepts first. Then the lender decides."
    },
    {
      label: "Timeline",
      value: "Often weeks to months for lender approval. Each lienholder has to agree."
    },
    {
      label: "Foreclosure clock",
      value: "The notice of sale for a Utah trustee sale can go out three months after the notice of default is recorded (57-1-24). A new notice is needed only if the sale moves more than 45 days past the date in the original notice (57-1-27)."
    },
    {
      label: "Agent rules",
      value: "Utah agents have three limits (R162-2f-401b). They can’t use a lender’s short sale demand letter outside the deal. They can’t have the seller sign a lien for the agent. And they can’t charge a fee hidden in the gap between the approved price and the payoff."
    },
    {
      label: "Deficiency",
      value: "That’s between the seller and the lender. After a trustee’s sale, Utah limits a deficiency to the debt above fair market value (57-1-32). After a short sale, the seller should ask their own attorney."
    },
    {
      label: "Financing and inspection",
      value: "Allowed, like a normal purchase. Use the REPC’s due diligence and financing deadlines."
    }
  ],
  steps: [
    {
      title: "Get pre-approved",
      detail: "Lenders reviewing a short sale want proof you can close. A pre-approval or proof of funds makes your offer stronger."
    },
    {
      title: "Use a buyer’s agent with short-sale experience",
      detail: "Your agent works with the listing agent, tracks the lender’s requests and keeps the deadlines straight. Don’t contact the owner directly. Everything goes through the listing agent."
    },
    {
      title: "Write the offer subject to lender approval",
      detail: "Your agent uses the Utah REPC and an addendum. The addendum makes the deal subject to approval by every lienholder. Set your due diligence and settlement deadlines with a long approval in mind."
    },
    {
      title: "Ask about the foreclosure timeline",
      detail: "Through your agent, ask whether a notice of default or notice of sale has been recorded, and whether the trustee has agreed to postpone the sale. You can also check the county recorder. A sale can go ahead while the lender is still reviewing."
    },
    {
      title: "Inspect and appraise",
      detail: "Do your inspection during due diligence. Short sales are often as-is, and the lender won’t pay for repairs."
    },
    {
      title: "Wait for written approval from every lienholder",
      detail: "A first mortgage, second mortgage, HOA or other lienholder may each want something. The title company can’t close until each lien is paid or released."
    },
    {
      title: "Close through the title company, with every dollar disclosed",
      detail: "All money moves through the title company and shows up on the settlement statement the lender approves. Never pay a side fee, “negotiator” fee or the seller outside closing."
    }
  ],
  survives: {
    wipedOut: [
      "Liens released by the lienholders who approve the sale (confirm on the final title commitment)"
    ],
    mayStay: [
      "Any lien whose holder doesn’t agree. The sale can’t close until it does",
      "Easements, CC&Rs and other exceptions on the title commitment",
      "Current-year property taxes (prorated at closing)"
    ]
  },
  mistakes: [
    {
      mistake: "Paying anything outside closing",
      prevent: "All payments go through the title company and are disclosed to the lender. Utah agents can’t charge a fee hidden in the gap between the approved price and the payoff."
    },
    {
      mistake: "Contacting the owner directly",
      prevent: "Work only through the listing agent. Don’t contact the owner or occupants, and don’t advise them about their debt."
    },
    {
      mistake: "Assuming the foreclosure is on hold",
      prevent: "Ask, through your agent, whether the trustee sale is scheduled and postponed. Check the recorder for new notices."
    },
    {
      mistake: "Letting deadlines lapse while you wait",
      prevent: "If approval runs long, extend the REPC deadlines in writing. Otherwise your earnest money may be at risk."
    }
  ],
  example: {
    title: "Illustrative example: two lienholders, one sale",
    story: "Jamie, a made-up buyer, offered $395,000 on a short sale in a fictional Utah city. The first lender approved after nine weeks. The second-mortgage holder asked for more to release its lien, which added a month. Jamie’s agent got the REPC deadlines extended in writing. The sale closed through the title company.",
    lesson: "Ask early how many liens there are. Expect each one to negotiate. Keep your contract deadlines extended in writing."
  },
  sources: [
    {
      label: "Utah Real Estate Purchase Contract (REPC)",
      url: "https://commerce.utah.gov/wp-content/uploads/2023/03/purchase-contract.pdf"
    },
    {
      label: "Utah Division of Real Estate: state-approved forms",
      url: "https://commerce.utah.gov/realestate/real-estate/forms/state-approved/"
    },
    {
      label: "Utah Admin. Code R162-2f-401b (licensee conduct in short sales)",
      url: "https://www.law.cornell.edu/regulations/utah/Utah-Admin-Code-R162-2f-401b"
    },
    {
      label: "Utah Code 57-1-24 (notice of default, three months)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S24.html"
    },
    {
      label: "Utah Code 57-1-27 (postponement of trustee sale)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S27.html"
    },
    {
      label: "Utah Code 57-1-32 (deficiency after a trustee’s sale)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S32.html"
    },
    {
      label: "CFPB: what is a short sale?",
      url: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-short-sale-en-290/"
    },
    {
      label: "Our short-sale guide",
      url: "#/short-sales"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.attorney],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utcommercial",
  title: "Utah commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land. They are sold at Utah tax, trustee, sheriff and IRS sales, or by banks and government sellers.",
  youGet: "The same kind of deed you’d get buying a home the same way. But home-buyer programs don’t apply, and the property often comes with tenants, leases, water rights and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: county tax sales, trustee sales, sheriff sales, IRS sales, court-appointed receivers, and bank or government sellers. Read the matching Utah guide for each."
    },
    {
      label: "Value",
      value: "For a rental property, divide net operating income by the cap rate. For land, or a building a business will use itself, look at recent sales of similar commercial property. Don’t compare it with homes."
    },
    {
      label: "Property tax",
      value: "The county assessor values property at fair market value as of January 1 (Utah Code 59-2-103, 59-2-301). Only residential property gets the 45% residential exemption. So a store or office is taxed on full value."
    },
    {
      label: "Tax appeals",
      value: "File with the county board of equalization. The deadline is September 15 or 45 days after the county’s valuation notice, whichever is later (59-2-1004)."
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment (ASTM E1527-21) can help protect you from having to pay for a federal cleanup. Have it completed (or updated) within one year before you take title, with key parts done or updated within 180 days. You also have to qualify for the protection and meet ongoing duties after you buy."
    },
    {
      label: "Water",
      value: "Utah water rights and shares can be sold with land or separately. A deed can come with a water rights addendum filed with the county recorder (57-3-109). Confirm what water comes with the property."
    },
    {
      label: "No home-buyer programs",
      value: "There’s no owner-occupant First Look period. HomeSteps leaves multi-family homes and vacant land out of First Look. Financing is commercial, bridge or SBA (for a business using the building)."
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor’s record for land use, building size and year built. Use the county recorder for the legal description, easements and recorded leases. Use the parcel map to find the parcel and spot questions. The title company confirms legal access from recorded easements, and a survey confirms boundaries."
    },
    {
      title: "Get the rent roll and leases, if you can",
      detail: "A receiver or listing broker can usually provide them. At a tax, trustee or sheriff’s sale you often can’t get them. Until you can confirm the leases, count the rent as zero, but don’t assume the building is legally empty: tenants may have rights to stay. Plan how you’ll confirm who occupies it and gain possession lawfully, and ask an attorney before you enter, renovate or remove anyone."
    },
    {
      title: "Value it the right way",
      detail: "For a rental building, divide net operating income by the cap rate. Ask a local commercial broker or appraiser for current cap rates. Budget property tax on full fair market value. Only residential property gets Utah’s 45% exemption. (Apartments where tenants live as their main home can qualify.)"
    },
    {
      title: "Order a title search",
      detail: "Commercial parcels often carry easements, reciprocal easement agreements, CC&Rs, mechanic’s liens and recorded leases. Find out which ones stay after the kind of sale you’re in. Property tax liens attach every January 1 (59-2-1325)."
    },
    {
      title: "Check water rights",
      detail: "Ask what water rights or shares serve the property and how they’ll transfer. Search the Utah Division of Water Rights records. Ask your title company and attorney to confirm."
    },
    {
      title: "Screen for contamination",
      detail: "Check EPA records for the address. Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Order a Phase I assessment before you’re committed: during the contract’s feasibility period in a negotiated purchase, or before you bid at an auction. Without it you can lose the federal protection from cleanup costs, so if you can’t get one in time, count that risk in whether to buy at all. Ask your consultant to check Utah Department of Environmental Quality records too."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Ask the city or county planning department to confirm that your planned use is allowed. Also confirm there are no open code cases or expired permits."
    },
    {
      title: "Line up your money and your contract",
      detail: "Auctions need cash on the trustee’s or sheriff’s terms. Line up a commercial or bridge lender to refinance after. For a negotiated purchase, have your attorney check whether the state-approved REPC fits the deal or a custom contract is needed."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it, and secure the building. Tell tenants in writing where to pay rent. Ask each tenant to sign an estoppel certificate confirming their lease (most leases require it). If you disagree with the January 1 value, appeal on time."
    }
  ],
  survives: {
    wipedOut: [
      "At a trustee or sheriff’s sale: liens recorded after the lien being foreclosed, if the sale was valid",
      "Leases signed after that lien, or put behind it, unless the lender agreed to keep them (non-disturbance agreement).* A tenant whose lease is wiped out can also leave. Confirm with an attorney",
      "In a negotiated purchase: liens the seller pays off at closing (confirm on the title commitment)"
    ],
    mayStay: [
      "Property taxes (they attach every January 1)",
      "Liens recorded before the lien being foreclosed",
      "Responsibility for environmental cleanup. It can follow whoever owns the property, not the lien*",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases that rank ahead of the lien being foreclosed or have a non-disturbance agreement",
      "A 180-day redemption right after a sheriff’s sale or IRS sale"
    ]
  },
  mistakes: [
    {
      mistake: "Valuing it like a house",
      prevent: "Use income and cap rate. A vacant building is worth its value once leased, minus lost rent, leasing commissions and tenant improvements."
    },
    {
      mistake: "Budgeting property tax at the residential rate",
      prevent: "Commercial property doesn’t get Utah’s 45% residential exemption. Ask the county assessor’s office about the current value and tax rate."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. Check EPA and Utah DEQ records, and get a Phase I assessment before you’re committed."
    },
    {
      mistake: "Assuming the water comes with the land",
      prevent: "Water rights can be sold separately. Confirm in writing what transfers. Record it properly."
    },
    {
      mistake: "Assuming the tenants will keep paying",
      prevent: "Get estoppel certificates. Budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Illustrative example: a small shop building in a fictional Utah county",
    story: "Taylor, a made-up investor, bought a two-unit shop building from a bank for $620,000. Taylor’s Phase I found an old fuel tank on the lot. The bank agreed to remove it before closing. Taylor budgeted property tax on full value, not the residential rate. Taylor also had both tenants sign estoppel certificates at closing. One tenant’s lease turned out to end in four months.",
    lesson: "Check past uses. For commercial property, budget Utah property tax on full value. Confirm every lease in writing before you count on the rent."
  },
  sources: [
    {
      label: "Utah Code 59-2-103 (fair market value, residential exemption)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S103.html"
    },
    {
      label: "Utah Code 59-2-301 (county assessor)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S301.html"
    },
    {
      label: "Utah Code 59-2-1004 (appeal to county board of equalization)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1004.html"
    },
    {
      label: "Utah Code 59-2-1325 (property tax lien)",
      url: "https://le.utah.gov/xcode/Title59/Chapter2/59-2-S1325.html"
    },
    {
      label: "Utah Code 57-3-109 (water rights addendum)",
      url: "https://le.utah.gov/xcode/Title57/Chapter3/57-3-S109.html"
    },
    {
      label: "Utah Code 57-1-28 (trustee’s deed)",
      url: "https://le.utah.gov/xcode/Title57/Chapter1/57-1-S28.html"
    },
    {
      label: "Utah Division of Water Rights",
      url: "https://waterrights.utah.gov/"
    },
    {
      label: "Utah Real Estate Purchase Contract (REPC)",
      url: "https://commerce.utah.gov/wp-content/uploads/2023/03/purchase-contract.pdf"
    },
    {
      label: "Freddie Mac HomeSteps: First Look Initiative (exclusions)",
      url: "https://www.homesteps.com/homebuyer/firstlook"
    },
    {
      label: "EPA: All Appropriate Inquiries (Phase I environmental site assessments)",
      url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
    },
    {
      label: "EPA Envirofacts: environmental records by address",
      url: "https://enviro.epa.gov/"
    },
    {
      label: "SBA 504 loans",
      url: "https://www.sba.gov/loans/504-loans/"
    },
    {
      label: "ADA.gov: businesses open to the public",
      url: "https://www.ada.gov/topics/title-iii/"
    }
  ],
  team: [TEAM.commercialBroker, TEAM.title, TEAM.attorney, TEAM.environmental, TEAM.commercialLender, TEAM.insurance, TEAM.contractor, TEAM.propertyManager, TEAM.cpa],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
  ...TX_GUIDES_1,
  ...TX_GUIDES_2,
];
