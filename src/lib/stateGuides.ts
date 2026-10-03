// Step-by-step guides for California, Arizona and Utah, in the same shape as Nevada’s (see playbooks.ts).
// Every rule cites the state’s statutes or court rules; county details are labeled as examples to confirm locally.
// Examples are illustrative, not real properties or transactions.

import type { Playbook } from './playbooks';
import { TEAM } from './playbookTeam';

const REVIEWED = '2026-09-29';

export const STATE_GUIDES: Playbook[] = [
{
  key: "catax",
  title: "California tax sales",
  short: "Tax sales",
  oneLine: "When property taxes go unpaid for years, the county tax collector can sell the property at auction and give the buyer a tax deed.",
  youGet: "A tax deed from the county tax collector. It clears most private liens, such as mortgages and judgments, but some government liens, easements and IRS liens can stay.",
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county treasurer-tax collector, with approval from the board of supervisors."
    },
    {
      label: "When a property can be sold",
      value: "After 5 years of tax default, or 3 years for nonresidential commercial property (R&T 3691). A county may choose to use 5 years for commercial property too."
    },
    {
      label: "Notice",
      value: "Mailed to parties of interest 45 to 120 days before the sale, and published once a week for 3 weeks starting at least 21 days before (R&T 3701, 3702)."
    },
    {
      label: "Minimum bid",
      value: "At least the full amount to redeem plus costs (R&T 3698.5). An unsold property can be reoffered later at a lower minimum with board approval."
    },
    {
      label: "Owner can redeem until",
      value: "Close of business on the last business day before the sale starts (R&T 3707)."
    },
    {
      label: "Deposit and payment",
      value: "Set by each county. State law lets a county require a deposit of $5,000 or 10% of the minimum bid, whichever is greater, with the balance due within 90 days at most (R&T 3693.1). Confirm in your county’s terms."
    },
    {
      label: "What you get",
      value: "A tax deed, issued after you pay in full (R&T 3708)."
    },
    {
      label: "Challenge window",
      value: "About 1 year: a challenge must start with a petition to the board of supervisors within 1 year of the deed (R&T 3725)."
    }
  ],
  steps: [
    {
      title: "Find your county’s sale",
      detail: "Each county tax collector posts its own auction list, dates and terms. Many California counties run the online bidding through a contracted auction website, but the county is the seller and its official terms control. Read the county’s terms and conditions in full."
    },
    {
      title: "Check the property is really eligible",
      detail: "Property can be sold after 5 years of default, or 3 years for nonresidential commercial property (R&T 3691). Properties drop off the list when the owner redeems, so expect some to be withdrawn."
    },
    {
      title: "Research each parcel before you bid",
      detail: "Property is sold as is (R&T 3692.3). Check the location, access, zoning and whether the parcel is even buildable. Look up recorded liens and easements with a title company. Do not go onto private property; the Los Angeles County terms, for example, say you may inspect but may not trespass."
    },
    {
      title: "Know what the tax deed will not clear",
      detail: "The deed wipes out most prior encumbrances, but not future tax installments, liens of taxing agencies that did not consent, some special assessments, Mello-Roos and 1915 Act bond amounts not paid from the sale, easements and recorded restrictions, and some IRS liens (R&T 3712). Budget for these."
    },
    {
      title: "Register and post your deposit",
      detail: "Deposits and deadlines differ by county. Example, Los Angeles County 2026A auction: a $5,000 deposit or 10% of your spending limit, whichever is greater. Example, San Diego County 2026 auction: a $1,000 deposit plus a $35 non-refundable fee. Confirm in your county’s notice."
    },
    {
      title: "Bid, then pay on time",
      detail: "Bids start at the minimum bid. Pay the balance in the form and by the deadline your county sets, plus transfer taxes and fees. Example: San Diego County requires full payment within 5 business days of the auction close. If you miss the deadline you can lose your deposit and the owner’s right to redeem comes back (R&T 3693.1)."
    },
    {
      title: "Wait for the recorded tax deed",
      detail: "Title does not pass until the tax collector records the tax deed. Example: Los Angeles County says deeds go to the Recorder about 60 to 70 days after the sale. Until then, do not enter the property, collect rent or contact any occupants; Los Angeles County may cancel a sale for that."
    },
    {
      title: "Plan for the 1-year challenge period",
      detail: "Anyone who claims the sale was invalid must first petition the board of supervisors within 1 year of the deed (R&T 3725). Los Angeles and San Diego counties both advise waiting about a year before making improvements. Many title companies will not insure until then."
    },
    {
      title: "Take possession the legal way",
      detail: "If someone lives in the property after your deed records, talk to an eviction attorney and use the court process. Former owners and lienholders may claim any excess proceeds from the county; that is between them and the county, not the buyer (R&T 4675)."
    }
  ],
  survives: {
    wipedOut: [
      "Mortgages and deeds of trust recorded before the sale",
      "Private judgment liens and mechanic’s liens",
      "The prior delinquent property taxes being collected by the sale"
    ],
    mayStay: [
      "Upcoming property tax installments after the sale (R&T 3712(a))",
      "Liens or rights of a taxing agency that did not consent to the sale",
      "Special assessments not included in the redemption amount",
      "Unpaid 1915 Act bond assessments and Mello-Roos special taxes not paid from the sale proceeds",
      "Easements, separately held water rights and recorded restrictions",
      "Recorded public offers of dedication and public-agency purchase options",
      "Some federal IRS liens",
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
      prevent: "Read R&T 3712 and your county’s list of liens that survive. Get a title company’s view before bidding."
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
      prevent: "The sale can be challenged for about a year. Many buyers wait until then and until title insurance is available."
    }
  ],
  example: {
    title: "Fictional example: a vacant lot in an online county auction",
    story: "Dana, a first-time buyer, finds a vacant lot on a county’s tax sale list with a minimum bid of $8,000. She checks the county map and finds the lot has no legal road access, so she skips it. She picks another lot, confirms it has access, and asks a title company about recorded liens. The title company notes a sewer assessment that will stay with the lot. She wins at $14,000, pays within the county’s deadline, and waits for the recorded tax deed before visiting to clear brush. She holds off on building until the one-year challenge window passes.",
    lesson: "Research access and surviving liens first, pay on time, and wait for the recorded deed and the challenge window before investing more."
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
  oneLine: "Most California home loans are deeds of trust, so a lender can foreclose without court through a trustee who auctions the property.",
  youGet: "A trustee’s deed. You take the property subject to any liens senior to the loan being foreclosed, as is, and often with occupants who have legal rights.",
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The trustee named in the deed of trust, on behalf of the lender (beneficiary)."
    },
    {
      label: "Notice of default",
      value: "Recorded first. At least 3 months must pass before the notice of sale (Civ 2924)."
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
      label: "Payment",
      value: "Cash, a cashier’s check from a bank, or a check from a credit union or savings bank. The trustee can require proof of full funds before recognizing your bid (Civ 2924h)."
    },
    {
      label: "1 to 4 unit homes",
      value: "The sale is not final right away. Eligible tenants, owner-occupants and certain nonprofits and public agencies have 15 days to give notice and up to 45 days to bid (Civ 2924m, in effect until January 1, 2031)."
    },
    {
      label: "Liens",
      value: "Senior liens stay. Junior liens are paid from any surplus in order of priority (Civ 2924k)."
    },
    {
      label: "Tenants",
      value: "Tenants generally get at least 90 days’ written notice; some fixed-term leases must be honored (CCP 1161b and the federal Protecting Tenants at Foreclosure Act)."
    }
  ],
  steps: [
    {
      title: "Find sales from the official source",
      detail: "Trustee sales are listed in the recorded notice of sale, which the trustee posts and publishes. Each notice names the trustee, sale time and place, and a phone number or website for sale-date updates. Deal only with the trustee; DeedOwl never helps anyone contact the homeowner."
    },
    {
      title: "Learn the timeline",
      detail: "The lender records a notice of default. At least 3 months later the trustee can give a notice of sale, which must be recorded, posted and first published at least 20 days before the sale (Civ 2924, 2924f). The owner can usually reinstate the loan until 5 business days before the sale date (Civ 2924c)."
    },
    {
      title: "Order a title report",
      detail: "The notice of sale warns that you may be bidding on a junior lien and may have to pay off all senior liens to get clear title. Ask a title company for the recorded liens and their priority, plus unpaid property taxes."
    },
    {
      title: "Look, but do not trespass",
      detail: "You usually cannot inspect inside. Drive by from the street and assume repairs are needed. Do not approach or contact occupants."
    },
    {
      title: "Check the sale status the day before and the day of",
      detail: "Sales are often postponed. The trustee must announce postponements at the sale location and keep a phone line or website with current dates (Civ 2924f, 2924g). Any postponement cancels the last bid (Civ 2924h)."
    },
    {
      title: "Bring certified funds and bid",
      detail: "Sales happen between 9 a.m. and 5 p.m. on a business day, in the county where the property is (Civ 2924g). Every bid is an irrevocable offer. The trustee can ask you to show you can pay the full bid before it is recognized, and the winning bidder must pay in full when the sale closes (Civ 2924h). The lender may credit bid up to what it is owed."
    },
    {
      title: "For 1 to 4 unit homes, wait for finality",
      detail: "Unless the winner is a prospective owner-occupant who signs the required declaration, the sale is not final for at least 15 days. If an eligible tenant buyer or eligible bidder sends a notice of intent, they have until 45 days after the sale to match or beat your bid (Civ 2924m). Title stays with the owner until the sale is final."
    },
    {
      title: "Get and record the trustee’s deed",
      detail: "The trustee issues a trustee’s deed after the sale is final and funds clear. A standard trustee sale has no redemption period afterward."
    },
    {
      title: "Handle occupants lawfully",
      detail: "A former owner who stays can be served a 3-day notice to quit once title is perfected (CCP 1161a). Tenants generally get at least 90 days’ written notice, and a fixed-term lease can continue to its end in many cases (CCP 1161b). Local just-cause and relocation rules also apply (Civ 2924n). Use an eviction attorney."
    }
  ],
  survives: {
    wipedOut: [
      "The deed of trust being foreclosed",
      "Junior liens recorded after it, such as a later second loan; they are paid from any surplus instead (Civ 2924k)"
    ],
    mayStay: [
      "Senior loans and liens recorded ahead of the one being foreclosed",
      "Unpaid property taxes and government assessments",
      "Easements and recorded restrictions",
      "Federal tax liens can have special rules; ask a title company",
      "Tenants’ rights under CCP 1161b, the federal Protecting Tenants at Foreclosure Act and local ordinances"
    ]
  },
  mistakes: [
    {
      mistake: "Buying a junior lien by accident",
      prevent: "Get a title report. If the foreclosing loan is a second, the first loan stays and you must deal with it."
    },
    {
      mistake: "Showing up with the wrong funds",
      prevent: "Bring cashier’s checks or other funds the notice of sale accepts. A personal check will not work."
    },
    {
      mistake: "Assuming you own a 1 to 4 unit home the day you win",
      prevent: "Plan for the 15 to 45 day finality window under Civ 2924m and keep your funds available."
    },
    {
      mistake: "Trying to remove occupants yourself",
      prevent: "Give the legally required notices and use the court process through an eviction attorney."
    },
    {
      mistake: "Making deals with other bidders",
      prevent: "Offering or accepting anything not to bid, or fixing bids, is a crime (Civ 2924h(g))."
    }
  ],
  example: {
    title: "Fictional example: a duplex at a trustee sale",
    story: "Sam, a first-time investor, wins a trustee sale for a fictional duplex with a $310,000 cashier’s check bid. His title report showed the foreclosing loan was the first deed of trust, so no senior loan remains, but there is a year of unpaid property taxes. Because it is a 2-unit building and Sam is not moving in, the sale is not final yet. On day 12 an eligible tenant buyer sends a notice of intent. By day 45 no qualifying bid arrives, so the sale becomes final and the trustee issues the deed. Sam then gives the tenants their required written notices through his attorney instead of acting on his own.",
    lesson: "Check lien priority first, expect a waiting period on 1 to 4 unit homes, and follow tenant notice laws exactly."
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
  oneLine: "When a court orders property sold, the sheriff (the levying officer) auctions it, sometimes subject to a redemption period.",
  youGet: "A sheriff’s deed of sale, or first a certificate of sale if the owner still has a right to redeem. Liens senior to the one being enforced stay.",
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county sheriff as levying officer, under a court judgment or writ."
    },
    {
      label: "Notice of sale",
      value: "Served, posted on the property, mailed to lienholders and first published at least 20 days before the sale (CCP 701.540)."
    },
    {
      label: "Payment",
      value: "Cash, certified check or cashier’s check (CCP 701.590)."
    },
    {
      label: "Credit option",
      value: "If your winning bid on real property is over $5,000, you may deposit $5,000 or 10% of the bid, whichever is greater, and pay the rest plus costs and interest within 10 days (CCP 701.590)."
    },
    {
      label: "Redemption",
      value: "Only in some judicial foreclosures: 3 months if the sale covers the debt, 1 year if it does not (CCP 729.030)."
    },
    {
      label: "Redemption price",
      value: "Your purchase price plus taxes, insurance, upkeep and some senior payments, with interest at the money-judgment rate, generally 10% a year (CCP 729.060, 685.010)."
    },
    {
      label: "Owner’s home",
      value: "A court order is required, and a bid must exceed the homestead exemption plus all liens (CCP 704.740, 704.800)."
    },
    {
      label: "Liens",
      value: "The lien being enforced, junior liens and state tax liens are wiped out; senior liens stay (CCP 701.630)."
    }
  ],
  steps: [
    {
      title: "Find sales at the sheriff’s office",
      detail: "County sheriffs post notices of sale for real property. Example: the Riverside County Sheriff lists upcoming real property sales on its Court Services page. Deal only with the sheriff; DeedOwl never helps anyone contact the owner."
    },
    {
      title: "Read the notice of sale closely",
      detail: "It gives the date, time, place, a legal description and street address (CCP 701.540). In a judicial foreclosure it must say whether the property is sold subject to a right of redemption and state the debt amount (CCP 729.010)."
    },
    {
      title: "Order a title report",
      detail: "An execution sale wipes out the lien being enforced, junior liens and state tax liens, but senior liens stay (CCP 701.630). In a judicial foreclosure, recorded interests of people who were not named in the lawsuit are not affected (CCP 726)."
    },
    {
      title: "Check for homestead rules",
      detail: "If the property is a person’s home, the sale needs a court order. No bid can be accepted unless it exceeds the homestead exemption plus all liens, and a bid under 90% of fair market value needs court approval (CCP 704.740, 704.800). The exemption is at least $300,000 and up to $600,000, adjusted for inflation (CCP 704.730)."
    },
    {
      title: "Pre-qualify and bring funds",
      detail: "Sales are held between 9 a.m. and 5 p.m. in the county where the property is (CCP 701.570). Example, Riverside County Sheriff: bidders must pre-qualify, show proof of funds, arrive on time, and pay by cashier’s check, certified check or cash payable to the Riverside County Sheriff. Confirm in your county’s notice."
    },
    {
      title: "Bid and pay",
      detail: "Pay in full at the sale, or on a real property bid over $5,000 elect a credit sale: deposit $5,000 or 10%, whichever is greater, and pay the rest plus costs and interest within 10 days. You have no right to possession until you pay in full (CCP 701.590). A bidder who defaults can owe the shortfall and costs (CCP 701.600)."
    },
    {
      title: "Receive a deed or certificate of sale",
      detail: "If there is no redemption right, the sheriff gives you a deed of sale and records a copy (CCP 701.660). If there is one, you get a certificate of sale and the deed only after the redemption period ends (CCP 729.040, 729.080)."
    },
    {
      title: "During any redemption period",
      detail: "The owner can redeem for 3 months or 1 year (CCP 729.030). You may collect rents or the value of use from whoever is in possession and may enter at reasonable hours to repair and maintain (CCP 729.090), but you must pay back rents collected if the owner redeems."
    },
    {
      title: "Take possession lawfully",
      detail: "After title is perfected, the former owner can be served a 3-day notice to quit (CCP 1161a). Tenants may have longer notice rights after a foreclosure (CCP 1161b). Use an eviction attorney."
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
      prevent: "Read the notice. If it says subject to redemption, expect a certificate of sale and a wait of 3 months to 1 year."
    },
    {
      mistake: "Assuming the sale clears senior loans",
      prevent: "Only the enforced lien and junior liens are wiped out. Get a title report and budget for senior debt."
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
      prevent: "Limit spending to taxes, insurance and needed upkeep, which are added to the redemption price. Keep receipts."
    }
  ],
  example: {
    title: "Fictional example: a judicial foreclosure with a 1-year redemption",
    story: "Priya, a new investor, reads a sheriff’s notice for a fictional house that says it is sold subject to a right of redemption. She wins with a $220,000 bid, which is less than the debt, so the redemption period is 1 year. She receives a certificate of sale, pays the property taxes and fire insurance, and keeps every receipt. Ten months later the former owner redeems. Priya is paid back her purchase price, the taxes and insurance, and interest at the money-judgment rate, less rent she had collected.",
    lesson: "A sale subject to redemption can end in a refund with interest instead of a house. Keep receipts and do not over-invest before the deed."
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
  oneLine: "Each February, Arizona county treasurers sell liens for unpaid property taxes. You bid the interest rate down from 16%, and the owner can pay you back with interest at any time before a deed is delivered.",
  youGet: "A certificate of purchase (a lien), not the property. You can ask a court for a treasurer’s deed only after 3 years, and only if the lien is still unpaid.",
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
      value: "A processing fee of up to $10 per lien (ARS 42-18116); counties may add others. Confirm with your county treasurer"
    },
    {
      label: "Owner can redeem",
      value: "Any time until a treasurer’s deed is delivered (ARS 42-18152)"
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
      value: "Go to the state; anyone may buy them later from the treasurer (ARS 42-18113, 42-18122)"
    }
  ],
  steps: [
    {
      title: "Learn your county’s sale rules",
      detail: "Each county treasurer runs its own sale in February and publishes bidder rules. Many counties hold the sale online through a vendor such as RealAuction. Read the treasurer’s own rules page first. Example: Pima County’s 2026 sale was online only, and bidders had to register by a set date."
    },
    {
      title: "Research every parcel before you bid",
      detail: "You are buying a lien, not a house. Check the parcel map, legal description, zoning and access. Some parcels are slivers, drainage strips or land you could never use. Treasurers do not warrant title. Pima County warns that legal descriptions may be wrong and that other liens or special assessments may exist."
    },
    {
      title: "Bid the interest rate",
      detail: "The lien goes to the bidder who pays all taxes, interest, penalties and charges due and accepts the lowest interest rate. The rate cannot go above 16% (ARS 42-18114). Example: Pima County starts bidding at 16% and moves in 1% steps; a 0% bid is allowed. Popular parcels often get very low bids."
    },
    {
      title: "Pay on time",
      detail: "Pay the full amount in cash by the treasurer’s deadline, no later than 15 days after the sale closes. Add a processing fee of up to $10 per lien. If you don’t pay, the treasurer can resell the lien, sue you for the amount, or bar you from Arizona tax lien sales for up to one year (ARS 42-18116)."
    },
    {
      title: "Hold the certificate and track redemptions",
      detail: "Interest runs at your bid rate from the first day of the month after you buy (ARS 42-18114). Any part of a month counts as a full month (ARS 42-18053). When the lien is redeemed, the treasurer pays you what you paid plus interest. Processing fees are not paid back (ARS 42-18153)."
    },
    {
      title: "Decide on subsequent taxes",
      detail: "If later years’ taxes go unpaid, you may pay them on or after June 1 after your purchase. They earn your certificate’s interest rate, with a $5 fee per entry (ARS 42-18121). Example: Pima County accepts these from June 1 through December 15."
    },
    {
      title: "After 3 years, decide whether to foreclose",
      detail: "If the lien is still unpaid, you may file a lawsuit in superior court to foreclose the right to redeem. You must name the county treasurer as a party. You must file within 10 years (ARS 42-18201). Most buyers hire an attorney for this."
    },
    {
      title: "Send the required notice first",
      detail: "At least 30 days before filing, the law requires notice by certified mail to the property owner and the county treasurer, at the addresses the statute lists (ARS 42-18202). The notice tells the owner they may ask for an excess proceeds sale. Your attorney handles this. Never contact the owner in any other way."
    },
    {
      title: "Get the judgment, then the deed",
      detail: "If the court rules for you, it directs the treasurer to deliver a treasurer’s deed. If the owner or holder asks for it and the property is likely worth more than $2,500 above the costs, the court may order an excess proceeds sale instead, and the owner keeps the surplus (ARS 42-18204). Buy title insurance before you spend money on the property."
    }
  ],
  survives: {
    wipedOut: [
      "The former owner’s right, title and interest, once the foreclosure judgment is final (ARS 42-18204)",
      "Your own lien, once it is redeemed or once you get the deed"
    ],
    mayStay: [
      "Easements on or benefiting the property (ARS 42-18204)",
      "Certain special assessment liens, such as improvement district liens (ARS 42-18204)",
      "Liens held by the state (ARS 42-17153)",
      "Other liens and title problems the court case did not clear. Get a title report and ask your attorney"
    ]
  },
  mistakes: [
    {
      mistake: "Treating the certificate as a way to get cheap property",
      prevent: "Most liens are redeemed. Plan for interest income, and bid only on parcels you would actually want to own."
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
      prevent: "Use an attorney who sends the certified-mail notices ARS 42-18202 requires. Without them, the court cannot enter judgment."
    },
    {
      mistake: "Ignoring bankruptcy",
      prevent: "Check whether the owner is in bankruptcy. Pima County warns that a bankruptcy court may cut your interest or refund, and you cannot foreclose during the stay."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Dana, a fictional buyer, bids on a lien for about $1,800 on a small house lot. Several bidders compete, and she wins at 6%. Fourteen months later the owner pays the taxes through the treasurer. Dana receives her $1,800 back plus 6% simple interest for 14 months, about $126. Her processing fee is not refunded.",
    lesson: "A tax lien usually ends with a modest interest payment, not a house. Low winning rates mean low returns, so bid only where the numbers still make sense."
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
  oneLine: "Most Arizona home loans use a deed of trust. When the owner defaults, the trustee can sell the home at a public auction without a court case. The sale is final, with no redemption.",
  youGet: "A trustee’s deed that the trustee records after you pay. It is final. You take the property subject to liens senior to the deed of trust, and you must handle any occupants yourself.",
  forSale: true,
  glance: [
    {
      label: "Earliest sale",
      value: "The 91st day after the notice of sale is recorded (ARS 33-808)"
    },
    {
      label: "Notice",
      value: "Posted at least 20 days before the sale; published once a week for 4 weeks in a row (ARS 33-808)"
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
      value: "None. The sale is absolute (ARS 33-811)"
    },
    {
      label: "Deed",
      value: "Trustee submits it for recording within 7 business days after payment (ARS 33-811)"
    },
    {
      label: "Can the owner stop it?",
      value: "Yes, by reinstating before 5 p.m. MST on the last business day before the sale (ARS 33-813)"
    }
  ],
  steps: [
    {
      title: "Find the notice of trustee’s sale",
      detail: "The trustee records the notice with the county recorder, posts it and publishes it in a newspaper. The notice lists the date, time, place, legal description, parcel number and the trustee’s phone number (ARS 33-808). Work only with the trustee. Never contact the homeowner."
    },
    {
      title: "Expect postponements or cancellation",
      detail: "The owner or a junior lienholder can reinstate the loan until 5 p.m. MST on the last business day before the sale (ARS 33-813). The trustee can also postpone a sale by announcing a new date within 90 calendar days (ARS 33-810). Call the trustee the day before and the morning of the sale."
    },
    {
      title: "Research title and the property",
      detail: "Order a title report. The sale clears liens junior to the deed of trust but not senior ones (ARS 33-811). Look at the outside of the property from the street only. You usually cannot go inside, so price in repairs you cannot see."
    },
    {
      title: "Bring the deposit",
      detail: "Every bidder except the lender must give the trustee a $10,000 deposit, in a form the trustee accepts, before bidding (ARS 33-810). Ask the trustee what form they accept, such as a cashier’s check."
    },
    {
      title: "Bid at the auction",
      detail: "The trustee or its agent runs a public auction and sells to the highest bidder. Only the lender (the beneficiary) can bid with credit instead of cash (ARS 33-810). The lender’s credit bid often sets the opening price."
    },
    {
      title: "Pay the balance by 5 p.m. the next business day",
      detail: "Pay the rest of your bid by 5 p.m. MST on the next business day, in a form the trustee accepts. If you don’t, you lose your deposit, you may owe for the trustee’s losses and attorney fees, and you can be barred from the trustee’s future sales (ARS 33-811)."
    },
    {
      title: "Receive the trustee’s deed",
      detail: "The trustee submits the deed for recording within 7 business days after payment. Recording is delivery to you. There is no right of redemption (ARS 33-811)."
    },
    {
      title: "Deal with occupants lawfully",
      detail: "A bona fide tenant generally gets at least 90 days’ notice under the federal Protecting Tenants at Foreclosure Act, and may stay to the end of the lease unless you will live there. For anyone else, give a written demand for possession; if they stay, you file a forcible detainer (eviction) case in court (ARS 12-1173.01). Never change locks or remove belongings yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The deed of trust being foreclosed",
      "Liens and interests junior to that deed of trust (ARS 33-811)",
      "The former owner’s right to get the property back. There is no redemption (ARS 33-811)"
    ],
    mayStay: [
      "Liens senior to the foreclosed deed of trust, such as an earlier mortgage (ARS 33-811)",
      "Property taxes, which are a lien ahead of almost all others (ARS 42-17153)",
      "Leases and possessory rights superior to the interest sold (ARS 12-1173.01)",
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
      prevent: "Use written demand and a forcible detainer case. Give bona fide tenants the 90 days federal law requires."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Sam, a fictional buyer, plans to bid on a house at a trustee’s sale. His title report shows the loan being foreclosed is a second mortgage, and a first mortgage of $210,000 is recorded ahead of it. The lender opens with a credit bid of $45,000. Sam realizes that if he wins at $60,000, he still takes the house subject to the $210,000 first loan. He stops bidding.",
    lesson: "A trustee sale only clears liens junior to the loan being foreclosed. Always know which loan is being foreclosed and what sits ahead of it."
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
  oneLine: "After a court judgment, the sheriff sells real property at a public auction near the courthouse. In most cases the owner can still redeem, so you get a certificate of sale first and a sheriff’s deed later.",
  youGet: "A certificate of sale right after you pay. A sheriff’s deed only after every redemption period ends without redemption. If someone redeems, you get your price back plus 8%.",
  forSale: true,
  glance: [
    {
      label: "Who sells",
      value: "The county sheriff, under a court order or writ"
    },
    {
      label: "Notice",
      value: "Posted in 3 public places for at least 15 days; published 3 weeks in a row (ARS 12-1621)"
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
      value: "A certificate of sale; a duplicate is recorded (ARS 12-1626)"
    },
    {
      label: "Redemption period",
      value: "30 days if the court found the property abandoned (and not farm or grazing land); otherwise 6 months (ARS 12-1282)"
    },
    {
      label: "Redemption price",
      value: "Your price plus 8%, plus taxes or assessments you paid, with interest (ARS 12-1285)"
    },
    {
      label: "Deed",
      value: "Sheriff’s deed after all redemption periods end (ARS 12-1286)"
    }
  ],
  steps: [
    {
      title: "Know which kind of sale it is",
      detail: "A judicial foreclosure sale sells the property to pay a mortgage or other lien the court foreclosed. An execution sale sells a debtor’s property to pay a money judgment. In both, you buy only the debtor’s right, title and interest (ARS 12-1626)."
    },
    {
      title: "Find the notice of sale",
      detail: "The sheriff posts notice in three public places, one at or near the courthouse door, for at least 15 days, and publishes it in a newspaper for three weeks in a row (ARS 12-1621). Example: the Pima County Sheriff posts real property sale notices online and holds sales on the east steps of the Superior Court. Confirm your county’s practice with the sheriff’s civil unit."
    },
    {
      title: "Read the judgment and pull title",
      detail: "Get the court case number from the notice and read the judgment. It says what is being sold and whether the court found the property abandoned. Order a title report to see which liens come before the one being foreclosed."
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
      detail: "Pay within five working days after the sale. If you don’t, the sheriff offers the property to the second-highest bidder, and you can be liable for others’ losses and attorney fees (ARS 12-1624)."
    },
    {
      title: "Get and record your certificate of sale",
      detail: "The sheriff gives you a certificate of sale showing the property, the price and whether it can be redeemed, and records a duplicate (ARS 12-1626)."
    },
    {
      title: "Wait out the redemption period",
      detail: "The owner can redeem within 30 days if the court found the home abandoned, or 6 months otherwise. Junior creditors may then redeem in 5-day turns (ARS 12-1282). If anyone redeems, you get your price plus 8%, plus taxes or assessments you paid with interest (ARS 12-1285). Keep receipts."
    },
    {
      title: "Receive the sheriff’s deed",
      detail: "When all redemption periods end, the sheriff executes the deed to you (or to the last redemptioner) and records it within 30 days (ARS 12-1286). If occupants stay after a written demand, file a forcible detainer case (ARS 12-1173.01)."
    }
  ],
  survives: {
    wipedOut: [
      "The judgment debtor’s interest, once the sheriff’s deed issues (ARS 12-1626, 12-1286)",
      "In a foreclosure, the lien being foreclosed. Which junior liens are cut off depends on the judgment. Ask your title company"
    ],
    mayStay: [
      "Liens and mortgages senior to the one foreclosed, or not foreclosed by the judgment",
      "Property taxes, which are a lien ahead of almost all others (ARS 42-17153)",
      "Leases and possessory rights superior to the interest sold (ARS 12-1173.01)",
      "The owner’s and junior creditors’ redemption rights until the periods end (ARS 12-1282)"
    ]
  },
  mistakes: [
    {
      mistake: "Thinking you own the property the day of the sale",
      prevent: "You get a certificate of sale first. Plan to wait 30 days or 6 months, and plan for the chance you are simply paid back with 8%."
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
    story: "Jordan, a fictional buyer, wins a sheriff’s foreclosure sale at $150,000 and pays within five working days. The court did not find the home abandoned, so the redemption period is 6 months. In month five, the owner redeems. Jordan receives $150,000 plus 8% ($12,000), plus the $1,400 in property taxes Jordan paid, with interest.",
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
  oneLine: "After four years of unpaid property taxes, the county auditor auctions the property once a year for at least what is owed.",
  youGet: "A tax deed from the county. It is not a warranty deed, and the county makes no promises about title or possession.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The county auditor in the county where the property sits."
    },
    {
      label: "When",
      value: "Once a year, in May or June. Each auditor picks the date. Confirm in your county auditor’s notice."
    },
    {
      label: "What gets it on the list",
      value: "Taxes still unpaid by March 15 after four years of delinquency (Utah Code 59-2-1343)."
    },
    {
      label: "Minimum bid",
      value: "All delinquent taxes, tax notice charges, penalties, interest and administrative costs (59-2-1351.1)."
    },
    {
      label: "Owner’s last chance",
      value: "Anyone may redeem for the owner at any time before the sale. There is no redemption after the sale (59-2-1346)."
    },
    {
      label: "What you get",
      value: "A tax deed, recorded by the county after the county governing body accepts your bid."
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
      detail: "Utah property taxes are due November 30. If taxes stay unpaid and the property is not redeemed by March 15 after four years, the county treasurer puts it on the tax sale listing and sends it to the county auditor."
    },
    {
      title: "Watch for the auditor’s notice",
      detail: "The auditor mails notice to the owner, any occupant and other interests of record. The auditor also publishes notice for about four weeks before the sale, on the county website in the largest county class or in a newspaper and the state public notice website elsewhere. The notice lists the parcel number or address and the date, time and place."
    },
    {
      title: "Register the way your county requires",
      detail: "Counties differ. Salt Lake County (2026) ran its sale online only and required advance registration and a $500 refundable deposit by wire. Utah County holds its sale on the third Thursday of May and uses deposit tiers of $0, $500 or $2,500 for online bidding. Davis County has held an in-person sale in Farmington. Confirm in your county auditor’s notice."
    },
    {
      title: "Research every parcel before you bid",
      detail: "Counties tell buyers to do their own due diligence. Pull the recorded documents, check the legal description, look for easements and other liens, and drive by from the street. Ask a title company whether it will insure a tax deed from this county. The owner may still redeem up to the start of the sale, so some parcels will be pulled."
    },
    {
      title: "Bid at or above the minimum",
      detail: "No bid below the full amount owed is accepted. The county may accept the highest bid for the whole parcel. State law also lets the county accept a bid that pays the full amount for the smallest part of the parcel, and then the rest counts as redeemed by the owner. The county may reject all bids."
    },
    {
      title: "Pay on the county’s deadline",
      detail: "Payment rules are local. Salt Lake County takes wires only, adds a 5% buyer’s premium, and does not apply the $500 deposit to your purchase. Davis County has required cash or check in person right after the auction. Utah County says it will not finance. The county can get a court judgment against a winning bidder who does not pay."
    },
    {
      title: "Wait for ratification and your deed",
      detail: "The county governing body accepts the bids. The auditor then signs a tax deed in the county’s name, and the county recorder records it. Salt Lake County says it records and mails deeds within 60 days after council ratification. Utah County says 60 to 180 days after the sale."
    },
    {
      title: "Get title insurance and handle possession lawfully",
      detail: "The county makes no promises about your right to possession. If someone lives there, talk to an attorney and use the court’s eviction process. Never change locks or remove belongings on your own."
    },
    {
      title: "If there were no bids, ask about county-owned parcels",
      detail: "Parcels with no buyer are struck off to the county. The county may later sell them at a price and on terms its governing body sets (59-2-1351.5). Ask your county how it offers these parcels."
    }
  ],
  survives: {
    wipedOut: [
      "The unpaid property taxes, penalties, interest and costs your bid pays",
      "The former owner’s right to redeem (it ends when the sale starts)"
    ],
    mayStay: [
      "Easements and other recorded encumbrances. Utah County warns buyers assume the risk of liens, easements and encumbrances.",
      "Liens the county does not clear by its sale. Ask a title company which recorded liens it would still list.",
      "Occupants. The county makes no promise about possession.",
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
      prevent: "If a tax title is later found invalid, the buyer’s lien is limited to the smaller of the taxes, interest and penalties or the amount paid (59-2-1352). Bid only what you can afford to lose while title is uncertain."
    },
    {
      mistake: "Missing the county’s deposit or payment rules",
      prevent: "Read the auditor’s notice early. Check the deposit deadline, payment method, buyer’s premium and whether the deposit counts toward your purchase."
    },
    {
      mistake: "Counting on a parcel that disappears",
      prevent: "Anyone can redeem for the owner until the sale begins. Check the updated list the morning of the sale."
    },
    {
      mistake: "Assuming you can move in right away",
      prevent: "Wait for the recorded deed. If the home is occupied, hire an attorney and use the court process."
    },
    {
      mistake: "Skipping the legal description",
      prevent: "The auditor must refuse to sell a parcel whose description conveys no title, but you should still confirm the description matches the land you think you are buying."
    }
  ],
  example: {
    title: "Illustrative example: a vacant lot in a fictional Utah county",
    story: "Jordan, a made-up buyer, found a vacant lot on the county auditor’s May sale list. The minimum bid was $4,200. Jordan pulled the recorded documents and found a utility easement across the back. A title company said it would review the parcel after the deed was recorded. Jordan bid $9,000 and won, wired payment the same day under the county’s rules, and received the recorded tax deed about two months later.",
    lesson: "Know the county’s payment rules before you bid, and price in title risk. A tax deed carries no warranties, and easements can stay with the land."
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
  oneLine: "Most Utah home loans use a trust deed, so the trustee can sell the home at a public auction without a court case.",
  youGet: "A trustee’s deed with no right of redemption. It carries the owner’s interest and wipes out interests that came after the loan being foreclosed.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The trustee named in the trust deed, or the trustee’s attorney, acting as auctioneer."
    },
    {
      label: "Earliest sale",
      value: "Notice of default recorded first. At least three months later the trustee may give notice of sale (Utah Code 57-1-24)."
    },
    {
      label: "Notice of sale",
      value: "Published once a week for three weeks, the last 10 to 30 days before the sale. Posted on the property and at the county recorder at least 20 days before (57-1-25)."
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
      value: "As the trustee directs, in U.S. money. Read the notice and call the trustee’s office before the sale."
    },
    {
      label: "Deed",
      value: "Trustee records the deed within five business days after receiving your payment (57-1-28)."
    },
    {
      label: "Redemption",
      value: "None. The trustee’s deed conveys without right of redemption."
    }
  ],
  steps: [
    {
      title: "Learn the timeline",
      detail: "After a default, the trustee records a notice of default with the county recorder. The owner or a junior lienholder can cure the default within three months of that recording. After at least three months, the trustee may give notice of sale."
    },
    {
      title: "Find sales through official notices",
      detail: "Read the notice of trustee’s sale in the newspaper, on the Utah public notice website, or posted at the county recorder. The notice gives the time, the courthouse, the legal description, the current beneficiary and any deposit required."
    },
    {
      title: "Research the property and the title",
      detail: "Order a title report. Find out which loan is being foreclosed, and which liens are older than it. Look at the home only from the street. Do not contact the owner or occupants."
    },
    {
      title: "Check the deposit and payment rules",
      detail: "Utah law lets the trustee require a deposit set in the notice and says you pay as the trustee directs. Call the trustee’s office listed on the notice and ask what funds they accept and by when."
    },
    {
      title: "Bid at the courthouse",
      detail: "The trustee or its attorney runs the auction. Anyone may bid, including the lender. The lender can credit bid up to what it is owed plus costs. Every bid is an irrevocable offer."
    },
    {
      title: "Expect postponements",
      detail: "The trustee may postpone for any reason by announcing it at the time and place of sale. No new notice is needed unless the sale moves more than 45 days past the original date."
    },
    {
      title: "Pay and get your deed",
      detail: "If you win, pay as directed. A bidder who refuses to pay loses the deposit and is liable for the trustee’s losses. Within five business days after payment, the trustee must submit the trustee’s deed for recording. You can ask for an unrecorded copy."
    },
    {
      title: "Handle occupants through the court",
      detail: "On residential rental property, the posted notice tells tenants that federal law may let them stay until the lease ends or 90 days after a notice to vacate, whichever is later. If anyone refuses to leave, hire an attorney for an unlawful detainer case. Never use self-help."
    }
  ],
  survives: {
    wipedOut: [
      "The trust deed being foreclosed",
      "The owner’s rights and the rights of anyone claiming through the owner, such as later trust deeds and liens recorded after the foreclosed loan",
      "Any right of redemption. Utah trustee sales have none."
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
      prevent: "Get a title report. If a second loan is foreclosing, the first loan stays on the property and you take the home subject to it."
    },
    {
      mistake: "Showing up without the right funds",
      prevent: "Call the trustee’s office before the sale. Confirm the deposit amount in the notice and what payment they accept."
    },
    {
      mistake: "Treating a bid as something you can take back",
      prevent: "Utah treats every bid as irrevocable. Set your maximum before you arrive and stop there."
    },
    {
      mistake: "Assuming a postponed sale needs new notice",
      prevent: "Only a postponement over 45 days past the original date requires renotice. Attend on the announced date or ask the trustee."
    },
    {
      mistake: "Forcing occupants out",
      prevent: "Use the court’s unlawful detainer process with an attorney. Respect tenant notice rights."
    },
    {
      mistake: "Ignoring surplus rules",
      prevent: "Extra money after the debt and costs goes to the people legally entitled to it, or to the district court clerk. It is not the buyer’s concern, and buyers should not contact former owners about it."
    }
  ],
  example: {
    title: "Illustrative example: a postponed trustee sale",
    story: "Riley, a made-up investor, read a notice of trustee’s sale for a condo. The notice required a $5,000 deposit by cashier’s check. At the courthouse the trustee announced a two-week postponement. Riley came back on the new date, won at $210,000, paid the balance as the trustee directed, and received a recorded trustee’s deed about a week later. Riley’s title report had already shown that the foreclosing loan was the first trust deed.",
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
  oneLine: "When a court orders property sold to pay a judgment or foreclose a mortgage, the sheriff auctions it, and the owner has 180 days to redeem.",
  youGet: "A certificate of sale right away, then a deed (conveyance) after the 180-day redemption period ends, if no one redeems.",
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
      value: "Posted at least 21 days on the property, the place of sale, the district courthouse and three other public places. Published weekly for three weeks before the sale (URCP 69B)."
    },
    {
      label: "Where and when",
      value: "At the district courthouse of the county, Monday to Saturday except holidays, 9 a.m. to 8 p.m."
    },
    {
      label: "Bids",
      value: "Every bid is an irrevocable offer. A bidder who refuses to pay owes the difference if the property later sells for less."
    },
    {
      label: "Redemption",
      value: "180 days after the sale. Price is the sale price plus 6%, plus recorded costs plus 6% (URCP 69C)."
    },
    {
      label: "What you get at the sale",
      value: "A certificate of sale. The sheriff records a duplicate with the county recorder."
    },
    {
      label: "Postponement",
      value: "Announced at the sale. Over 72 hours needs a new notice."
    }
  ],
  steps: [
    {
      title: "Understand where the sale comes from",
      detail: "A creditor with a judgment gets a writ of execution, or a lender wins a court foreclosure. The court directs the sheriff to sell under the rules for execution sales. A trust deed can also be foreclosed this way if the lender chooses court."
    },
    {
      title: "Find the notice",
      detail: "The sheriff posts the notice at least 21 days before the sale on the property, at the place of sale, at the district courthouse and in three other public places. It is also published once a week for three weeks in a local newspaper. Your county sheriff’s civil office can tell you how it lists sales."
    },
    {
      title: "Research the case and the title",
      detail: "Read the court case. The sale transfers only the defendant’s right, title and interest. Get a title report to see which liens are older than the one being enforced. Look at the property from the street only."
    },
    {
      title: "Confirm payment terms with the sheriff",
      detail: "The rules say the sheriff delivers the certificate on payment of the bid. Each sheriff sets how and when you pay. Call the sheriff’s civil office before the sale."
    },
    {
      title: "Bid at the courthouse",
      detail: "Sales are public auctions to the highest bidder. The sheriff sells only as much property as needed to pay the amount due, and sells separate lots separately. The sheriff may not bid."
    },
    {
      title: "Get and record the certificate of sale",
      detail: "After you pay, the sheriff gives you a certificate of sale for each parcel. It states the price and whether the sale is subject to redemption. The sheriff records a duplicate with the county recorder."
    },
    {
      title: "Wait out the 180-day redemption period",
      detail: "The defendant, or a creditor with a junior lien, may redeem within 180 days. If you pay taxes, insurance, repairs or other liens, record a notice of those amounts with the county recorder or you cannot add them to the redemption price. You are entitled to rents during this time, but they are credited against the redemption price."
    },
    {
      title: "Receive your deed",
      detail: "If no one redeems, the purchaser (or last redemptioner) is entitled to the deed when the redemption period ends. If the owner redeems, the sale is undone and you get your price plus 6% and recorded costs."
    },
    {
      title: "Take possession lawfully",
      detail: "If occupants remain, work with an attorney and use the court process. Do not use self-help."
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
      prevent: "The owner can still redeem. Spend only on what protects the property, and record notice of taxes, insurance and repair costs so they count toward the redemption price."
    },
    {
      mistake: "Forgetting to record your costs",
      prevent: "URCP 69C says costs not recorded with the county recorder are waived. Record a notice each time you pay."
    },
    {
      mistake: "Assuming the sale clears older liens",
      prevent: "Only the defendant’s interest is sold. Check the title for senior mortgages and liens before bidding."
    },
    {
      mistake: "Showing up without confirmed funds",
      prevent: "Ask the sheriff’s civil office how and when to pay. Bids are irrevocable."
    },
    {
      mistake: "Missing a rent accounting request",
      prevent: "If someone asks in writing for an accounting of rents, you must serve it. Missing it can extend the redemption period."
    }
  ],
  example: {
    title: "Illustrative example: a redeemed sheriff’s sale",
    story: "Casey, a made-up buyer, won a sheriff’s sale for $150,000 and got a certificate of sale. Casey paid $2,000 in property taxes and recorded a notice of that payment. Four months later the owner redeemed. Casey received $159,000 plus $2,120 for the recorded taxes, and the sale was undone.",
    lesson: "A sheriff’s sale is not final for 180 days. Record every cost you pay, and plan your money as if the owner might redeem."
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
      label: "Utah County Sheriff: sheriff sales",
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
  oneLine: "A California homeowners association can sell a home to collect unpaid assessments under the Davis-Stirling Act (Civil Code 5700–5740), usually through a trustee.",
  youGet: "The owner’s interest, subject to a 90-day right of redemption after a nonjudicial sale, and usually subject to the first deed of trust and any other lien recorded before the HOA’s lien.",
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
      value: "By the court (judicial) or by a trustee named in the recorded notice of delinquent assessment (nonjudicial), no sooner than 30 days after that notice is recorded (Civ 5700, 5675)."
    },
    {
      label: "Board vote",
      value: "Only the HOA board can decide to foreclose, by majority vote in executive session, at least 30 days before any public sale (Civ 5705)."
    },
    {
      label: "Redemption",
      value: "After a nonjudicial HOA sale, the home can be redeemed for 90 days. The notice of sale must say the property is sold subject to this right (Civ 5715, CCP 729.035)."
    },
    {
      label: "First mortgage",
      value: "The HOA lien is ahead only of liens recorded after its notice of delinquent assessment, and the CC&Rs can put it behind others (Civ 5680). A first deed of trust recorded earlier usually stays. Confirm with a title report."
    },
    {
      label: "Fines",
      value: "Penalties for breaking HOA rules can’t be made a lien that the HOA forecloses on (Civ 5725). Late payments are the exception."
    }
  ],
  steps: [
    {
      title: "Find the sale through the official notice",
      detail: "A nonjudicial HOA sale follows the same notice of default and notice of sale steps as a California trustee sale (Civ 5710). The notice names the trustee, the date, time and place. Deal only with the trustee named in the notice; DeedOwl never helps anyone contact the homeowner."
    },
    {
      title: "Confirm the HOA was allowed to foreclose",
      detail: "For assessment debts from 2006 on, the HOA can’t foreclose unless the unpaid assessments reach $1,800 or are more than 12 months late (Civ 5720). The board must also have voted at least 30 days before the sale (Civ 5705). Have an attorney review the recorded notices if anything looks off."
    },
    {
      title: "Order a title report",
      detail: "The HOA lien starts when its notice of delinquent assessment is recorded and ranks ahead only of liens recorded after that (Civ 5675, 5680). A first deed of trust recorded before it usually survives, and the CC&Rs may make the HOA lien junior to it anyway. Ask the title company which loans, liens and unpaid property taxes will stay."
    },
    {
      title: "Set your maximum bid",
      detail: "Add any surviving loan balance, unpaid property taxes, dues that keep coming after you buy, and repairs. If a first deed of trust survives, its lender can foreclose on you if it isn’t paid. Use the max bid calculator."
    },
    {
      title: "Bid and pay",
      detail: "Bring the funds the notice of sale requires, usually cashier’s checks. The HOA trustee follows the same sale rules as a deed of trust sale (Civ 5710). See our California trustee sales guide for bidding and payment."
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
      "The 90-day right of redemption after a nonjudicial sale (Civ 5715)"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming an HOA sale wipes out the mortgage, like in Nevada",
      prevent: "California’s HOA lien ranks ahead only of liens recorded after it (Civ 5680). Get a title report and budget for the first loan."
    },
    {
      mistake: "Fixing up the home during the 90 days",
      prevent: "The sale can still be undone by redemption (Civ 5715). Limit spending to securing and insuring the property until the period ends."
    },
    {
      mistake: "Bidding on a sale the HOA may not have been allowed to hold",
      prevent: "Check the amounts and dates in the recorded notices against the $1,800 or 12-month rule (Civ 5720) and the board-vote rule (Civ 5705). Ask an attorney if in doubt."
    },
    {
      mistake: "Contacting the owner to ask about the debt or the house",
      prevent: "Get all information from the trustee, the recorded documents and a title company. DeedOwl never helps anyone contact the owner."
    }
  ],
  example: {
    title: "Fictional example: a $14,000 condo that cost $300,000",
    story: "Jordan, a new investor, sees a fictional condo worth about $340,000 at an HOA trustee sale with a $14,000 opening bid. The title report shows a first deed of trust of about $285,000, recorded years before the HOA’s notice of delinquent assessment. Jordan figures the real cost: the bid, plus the surviving loan, plus property taxes and repairs, comes to more than $300,000. Jordan also notes that the home could be redeemed for 90 days after the sale.",
    lesson: "In California an HOA sale usually leaves the earlier first mortgage in place. Price the surviving loan and the redemption wait into your bid, or walk away."
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
  oneLine: "The IRS can seize and sell California real estate to collect unpaid federal taxes, by public auction or sealed bid, under federal law.",
  youGet: "A certificate of sale, then after 180 days without redemption, an IRS deed to the taxpayer’s interest. Mortgages and liens ahead of the federal tax lien stay.",
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
      value: "10 to 40 days after the public notice, in the county where the property was seized unless the IRS orders otherwise (26 U.S.C. 6335(d))."
    },
    {
      label: "Minimum bid",
      value: "The IRS sets a minimum price. If no one bids it, the property goes to the government at that price or back to the owner (26 U.S.C. 6335(e))."
    },
    {
      label: "Payment",
      value: "Cash, certified, cashier’s or treasurer’s check, or a U.S. postal, bank or express money order. Full payment at the sale, or a deposit with the rest within the time in the notice, no more than 1 month (26 U.S.C. 6335(e); IRM 5.10.5.14)."
    },
    {
      label: "Redemption",
      value: "180 days. The owner, heirs, or anyone with an interest or lien can redeem by paying your price plus 20% a year interest, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8)."
    },
    {
      label: "What you get",
      value: "A certificate of sale when you pay in full; a deed after 180 days if no one redeems (26 U.S.C. 6338)."
    },
    {
      label: "California transfer tax",
      value: "Counties and cities can tax deeds that transfer real property (R&T 11911). The government exemption covers deeds where the agency is acquiring title, not selling (R&T 11922). Confirm what you’ll owe with the county recorder."
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov",
      detail: "IRS real estate sales in California are rare. Read each notice of sale for the minimum bid, deposit, payment deadline and whether bids are taken at public auction or by sealed bid."
    },
    {
      title: "Ask for the list of known liens",
      detail: "The IRS will give bidders Form 2434-B, which lists the liens and interests it found. It doesn’t guarantee the list is complete, so verify it yourself (IRM 5.10.5.13)."
    },
    {
      title: "Order a title report",
      detail: "You get only the taxpayer’s interest, as is, where is, with no warranty (IRM 5.10.5.7). Mortgages and liens ahead of the federal tax lien stay. Liens behind it are wiped out by the deed (26 U.S.C. 6339(c))."
    },
    {
      title: "Look from the street only",
      detail: "You usually can’t go inside. Assume repairs are needed. Don’t contact or approach the owner or occupants; direct every question to the IRS contact on the notice."
    },
    {
      title: "Bid and pay on time",
      detail: "Pay in the forms the notice allows. If you agreed to a deferred payment and don’t pay the rest, the IRS can sue you for it with 6% interest, or cancel the sale and keep what you paid (26 U.S.C. 6335(e)(3))."
    },
    {
      title: "Record the certificate of sale",
      detail: "You get a certificate of sale when you pay in full (26 U.S.C. 6338(a)). The IRS notes that recording it can stop the taxpayer from selling the property to someone else (IRM 5.10.5.17.5). Ask a title company or attorney about recording it with the county recorder."
    },
    {
      title: "Plan for 180 days",
      detail: "The property can be redeemed for 180 days by paying you your price plus 20% a year interest (26 U.S.C. 6337; IRM 5.10.6.8). If it’s vacant you may enter only as needed to prevent damage. If it’s occupied, the IRS decides with its counsel whether a court order is needed (IRM 5.10.5.19). Don’t renovate yet."
    },
    {
      title: "Get and record the deed",
      detail: "If no one redeems, surrender the certificate of sale and the IRS gives you a deed made under California’s rules for execution sales (26 U.S.C. 6338(b); IRM 5.10.6.9). Record it with the county recorder and file a change in ownership statement (R&T 480). The assessor will reassess the property to market value (BOE)."
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
      prevent: "A redeemer pays your price plus interest, not your repair costs (26 U.S.C. 6337). Only prevent damage until the deed is issued."
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
    story: "Alex, a first-time bidder, reads an IRS notice of sealed-bid sale for a fictional cabin with a $90,000 minimum bid. Alex’s title report shows a $60,000 first mortgage recorded before the federal tax lien. Alex bids $110,000, wins, and records the certificate of sale. Five months later a relative of the owner redeems, and Alex is paid back $110,000 plus 20% a year interest for the time the money was tied up.",
    lesson: "Count the senior mortgage in your price, expect a 180-day wait, and don’t spend on improvements before the deed."
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
  oneLine: "Homes a lender, Fannie Mae, Freddie Mac or HUD took back through foreclosure in California, sold through a listing agent with a normal escrow.",
  youGet: "The property through a purchase contract plus the seller’s addendum, closed through escrow with title insurance, usually as is.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s listing agent. Your agent submits the offer with the seller’s own forms and addenda."
    },
    {
      label: "Seller disclosures",
      value: "A lender selling a home it took back through foreclosure doesn’t have to give the California Transfer Disclosure Statement (Civ 1102.2) or the Natural Hazard Disclosure under Civ 1103 (Civ 1103.1). Other required disclosures may still be given separately."
    },
    {
      label: "Condition",
      value: "Usually as is. Do your own inspections during your contingency period."
    },
    {
      label: "HUD homes",
      value: "Offers go through a HUD-registered broker. Since March 1, 2022, homes eligible for FHA 203(b) financing have a 30-day exclusive listing period for owner-occupants, government entities and HUD-approved nonprofits (FHA INFO 2022-03). Investors can bid only after it ends."
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: for the first 30 days in the MLS, only owner-occupants, public entities and certain nonprofits can offer. Multi-family homes and vacant land are excluded."
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Owner-occupant offers get priority. Owner-occupants certify they’ll move in within 60 days of closing and live there at least a year. Ask the listing agent whether a First Look period is running."
    },
    {
      label: "Property taxes",
      value: "Your purchase is a change in ownership, so the assessor reassesses to market value as of that date (BOE; R&T 110.1)."
    }
  ],
  steps: [
    {
      title: "Search official sources only",
      detail: "Use HUD Home Store, HomeSteps, HomePath and the REO pages of the bank or credit union that owns the home. DeedOwl lists only direct sources."
    },
    {
      title: "Get pre-approved or show proof of funds",
      detail: "Sellers want a pre-approval letter, or proof of funds for cash offers, with your offer. HomeSteps lists these among required items."
    },
    {
      title: "Use a licensed agent",
      detail: "HUD requires a HUD-registered broker to bid for you. For HomeSteps and HomePath, your agent works with the listing agent. If you’re buying to live there, say so: owner-occupants get early or priority offer periods."
    },
    {
      title: "Read every addendum",
      detail: "The seller’s addendum usually overrides parts of the standard California contract, including repairs, deadlines and earnest money. HomePath, for example, wants the deposit within two calendar days of a fully signed contract; HomeSteps wants it in certified funds."
    },
    {
      title: "Inspect and appraise",
      detail: "Because a foreclosing lender is exempt from the Transfer Disclosure Statement (Civ 1102.2), you learn about the home mostly from your own inspections. Hire a licensed inspector and check permits with the city or county."
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
      detail: "File the change in ownership statement with your deed (R&T 480). Expect a supplemental property tax bill, since the assessor sets a new value on the date ownership changes (R&T 75.10)."
    }
  ],
  survives: {
    wipedOut: [
      "Most liens are cleared by the seller before or at closing (confirm on the title report)"
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
      prevent: "A lender selling after foreclosure is exempt from the Transfer Disclosure Statement (Civ 1102.2). Get full inspections."
    },
    {
      mistake: "Investors offering during an owner-occupant period",
      prevent: "Check the listing for HUD’s exclusive period or Freddie Mac’s 30-day First Look, and wait until investor offers are allowed."
    },
    {
      mistake: "Falsely claiming you’ll live there",
      prevent: "HUD, Fannie Mae and Freddie Mac require occupancy certifications. A false one can bring civil or criminal liability."
    },
    {
      mistake: "Skipping the addendum",
      prevent: "Read every page. Addenda can shorten deadlines, add per-day fees and shift costs to you."
    }
  ],
  example: {
    title: "Fictional example: a HomeSteps house in First Look",
    story: "Maria, a teacher buying her first home, finds a fictional Freddie Mac house on HomeSteps that is 12 days into its First Look. Her agent submits her offer with a pre-approval letter, the HomeSteps addenda and her signed owner-occupant affidavit. Because the lender seller is exempt from the Transfer Disclosure Statement, she orders a full inspection, which finds a leaking water heater. She asks for a credit, Freddie Mac declines, and she closes anyway with the repair in her budget.",
    lesson: "Owner-occupants can get an early shot at REO homes, but inspections replace the seller disclosures you’d normally get."
  },
  sources: [
    { label: "HUD FHA INFO 2022-03: 30-day exclusive listing period", url: "https://www.hud.gov/sites/dfiles/SFH/documents/SFH_FHA_INFO_2022-03.pdf" },
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.contractor, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "cashort",
  title: "California short sales",
  short: "Short sales",
  oneLine: "A California owner sells for less than the loan balance, with the lender’s written approval, through a listing agent and normal escrow.",
  youGet: "The property by grant deed through escrow, once every lienholder that needs to approves the price.",
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
      value: "After an approved short sale of a dwelling of 1 to 4 units, the lender can’t collect the rest of the loan from the owner, with some exceptions (CCP 580e). That is why lenders insist on written approval of the exact deal."
    },
    {
      label: "No side payments",
      value: "The lender can’t require the owner to pay extra for its consent (CCP 580e(b)). Every payment goes through escrow."
    },
    {
      label: "Investors and homes in foreclosure",
      value: "If you won’t live there, and the owner lives in a 1 to 4 unit home with a recorded notice of default, California’s home equity sales law can apply: a strict written contract and a right for the owner to cancel (Civ 1695.1–1695.6). Ask an attorney."
    },
    {
      label: "Disclosures",
      value: "The owner, not a lender, is selling, so the normal California seller disclosure rules generally apply (Civ 1102). The foreclosure exemption covers lenders selling homes they took back (Civ 1102.2)."
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
      detail: "The seller signs your offer first. Then the listing agent sends the package to each lender. Your contract isn’t final until every lienholder approves in writing."
    },
    {
      title: "Check whether California’s equity purchaser law applies",
      detail: "If the owner lives there, a notice of default is recorded, and you aren’t buying to live there, the contract must meet Civ 1695.2 and the owner can cancel until midnight of the fifth business day after signing, or 8 a.m. on the sale day if sooner (Civ 1695.4). Until then you can’t record documents or pay the owner (Civ 1695.6). Have an attorney review it."
    },
    {
      title: "Inspect and review disclosures",
      detail: "Expect the seller’s Transfer Disclosure Statement (Civ 1102). Do your own inspection anyway, since owners in hardship often defer repairs."
    },
    {
      title: "Watch the foreclosure date",
      detail: "Ask the listing agent whether a trustee sale is scheduled and whether the lender has agreed to postpone it. A short sale can be cancelled by a foreclosure."
    },
    {
      title: "Close through escrow",
      detail: "Pay only through escrow, with every payment disclosed to the lenders. Never pay the owner, a “negotiator” or anyone else on the side."
    }
  ],
  survives: {
    wipedOut: [
      "Loans and liens whose holders approve the sale and are paid through escrow"
    ],
    mayStay: [
      "Any lien whose holder doesn’t agree; the sale can’t close with clear title until they do",
      "Anything listed as an exception in your title policy",
      "Property taxes and HOA dues from closing on",
      "Leases with tenants living there; ask the listing agent whether the home is delivered vacant"
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
      prevent: "If you won’t live there and a notice of default is recorded on an owner-occupied home, have an attorney prepare a compliant contract (Civ 1695.1–1695.6)."
    },
    {
      mistake: "Assuming one approval is enough",
      prevent: "Ask how many loans and liens there are. Each holder must agree before closing."
    }
  ],
  example: {
    title: "Fictional example: two lenders, one sale",
    story: "Chris, a first-time buyer, offers $480,000 on a fictional short-sale condo listed by the owner’s agent. The first-loan lender approves after nine weeks. The second-loan holder asks for more money to release its lien, and the listing agent negotiates through escrow for three more weeks. Chris keeps his loan approval current, never contacts the owner, and closes after both lenders sign written approvals.",
    lesson: "Expect each lienholder to negotiate, keep your financing ready, and let the listing agent and escrow handle every contact."
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.attorney, TEAM.contractor],
  lastReviewed: "2026-10-03",
  state: 'CA'
},
{
  key: "cacommercial",
  title: "California commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land in California, sold by banks, trustees, sheriffs, receivers and tax collectors.",
  youGet: "The same deed as a home bought the same way, but without California’s home seller disclosures, and often with tenants, leases and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: tax sales, trustee sales, sheriff and court sales, court-appointed receivers, and bank or government sellers."
    },
    {
      label: "Seller disclosures",
      value: "California’s Transfer Disclosure Statement doesn’t apply to property that isn’t single-family residential (Civ 1102.2). Your own due diligence is the main protection."
    },
    {
      label: "Property tax (Prop 13)",
      value: "A purchase is a change in ownership. The assessor reassesses the property to market value as of that date, and that becomes the new base year value (BOE; R&T 60, 110.1). A supplemental tax bill can follow (R&T 75.10)."
    },
    {
      label: "Transfer tax",
      value: "Counties can tax deeds at $0.55 per $500 of value, and cities can add their own (R&T 11911). Confirm the total rate with the county recorder."
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment done within one year before you buy, with key parts updated within 180 days, can protect you from federal cleanup liability (EPA All Appropriate Inquiries)."
    },
    {
      label: "Accessibility",
      value: "On every new commercial lease, California owners must say whether a Certified Access Specialist (CASp) has inspected the premises (Civ 1938)."
    },
    {
      label: "Residential tenants",
      value: "In apartment buildings bought after foreclosure, month-to-month tenants get 90 days’ written notice, and many fixed-term leases continue (CCP 1161b). Local just-cause rules can also apply."
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor’s record for land use, building size and year built, and the parcel map for access and boundaries."
    },
    {
      title: "Get the rent roll and leases",
      detail: "A receiver, bank or listing broker can usually provide them. At an auction you often can’t, so assume the building is empty until proven otherwise."
    },
    {
      title: "Value it by income",
      detail: "For a rental building: net operating income (rent after vacancy and operating costs) divided by the cap rate. Use a property tax figure based on your price, not the seller’s old Prop 13 value, since the assessor will reassess (BOE)."
    },
    {
      title: "Order a title report",
      detail: "Commercial parcels often carry easements, reciprocal easement agreements, CC&Rs, mechanic’s liens and recorded leases. Ask which ones survive the kind of sale you’re buying at."
    },
    {
      title: "Screen for contamination",
      detail: "Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Check state cleanup databases such as DTSC EnviroStor and the Water Board’s GeoTracker, and order a Phase I assessment within one year before you buy (EPA)."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Confirm with the city or county planning department that your planned use is allowed and that there are no open code cases or expired permits."
    },
    {
      title: "Line up your money",
      detail: "Auctions need certified funds. Have a commercial or bridge lender ready to refinance after. Budget for transfer tax (R&T 11911) and the reassessed property tax."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it, file the change in ownership statement with your deed (R&T 480), tell tenants in writing where to pay rent, and ask each tenant for an estoppel certificate confirming their lease. Follow CCP 1161b for any residential tenants."
    }
  ],
  survives: {
    wipedOut: [
      "At a trustee or sheriff sale: liens recorded after the lien being foreclosed",
      "Leases signed after that lien, or put behind it, unless the lender agreed to keep them. Confirm with an attorney",
      "In a bank or receiver sale: liens the seller pays off at closing (confirm on the title report)"
    ],
    mayStay: [
      "Property taxes and special assessments",
      "Liens recorded ahead of the lien being foreclosed",
      "Environmental cleanup liability: it follows the owner, not the lien",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases with priority or a non-disturbance agreement, and residential tenant rights under CCP 1161b",
      "Anything listed as an exception in your title policy"
    ]
  },
  mistakes: [
    {
      mistake: "Using the seller’s property tax bill",
      prevent: "Your purchase triggers reassessment to market value (BOE; R&T 110.1). Underwrite with the tax on your price."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. Get a Phase I assessment on time to keep the federal defense (EPA)."
    },
    {
      mistake: "Expecting a seller disclosure statement",
      prevent: "The Transfer Disclosure Statement doesn’t cover commercial property (Civ 1102.2). Ask for reports and do your own inspections."
    },
    {
      mistake: "Assuming tenants will keep paying",
      prevent: "Get estoppel certificates, and budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Fictional example: the tax bill that ate the cap rate",
    story: "Dana, a new investor, buys a fictional bank-owned strip center for $2,000,000. The seller’s tax bill was based on a Prop 13 value set decades ago. After the sale, the assessor reassesses the center to about $2,000,000 and a supplemental tax bill arrives, cutting Dana’s net operating income by tens of thousands of dollars a year. Dana had also skipped estoppels and later learned one tenant had a rent reduction not shown in the rent roll.",
    lesson: "In California, underwrite with property tax based on your price, and confirm every lease with an estoppel certificate before closing."
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
      label: "California Civil Code 1102.2 (disclosure exemptions)",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.2"
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
  oneLine: "An Arizona homeowners association can foreclose its lien for unpaid assessments, but only through a court case, like a mortgage, and only after a large or long delinquency. The home is then sold at a sheriff’s sale, usually subject to the first mortgage.",
  youGet: "A certificate of sale first, and a sheriff’s deed only after the redemption period ends. You get the owner’s interest, which in most cases is still subject to the recorded first mortgage or deed of trust and to property taxes.",
  forSale: true,
  glance: [
    {
      label: "Law (planned communities)",
      value: "A.R.S. 33-1807. Condominiums fall under a separate statute (A.R.S. 33-1256); confirm its current rules with an Arizona attorney"
    },
    {
      label: "When the HOA can foreclose",
      value: "Only if the owner has been delinquent for 18 months, or owes $10,000 or more, whichever comes first, as of the day the case is filed (A.R.S. 33-1807)"
    },
    {
      label: "How",
      value: "Through a court case, “in the same manner as a mortgage” (A.R.S. 33-1807). After judgment, the sheriff sells the home at public auction"
    },
    {
      label: "Priority",
      value: "Behind the recorded first mortgage or first deed of trust, property taxes and government assessments, and liens recorded before the HOA’s declaration (A.R.S. 33-1807). There is no Nevada-style “super-priority”"
    },
    {
      label: "Payment",
      value: "Within 5 working days after the sheriff’s sale, unless the sheriff agrees in writing to more time (A.R.S. 12-1624)"
    },
    {
      label: "Redemption",
      value: "6 months after the sale, or 30 days if the court found the home abandoned (and not farm or grazing land) (A.R.S. 12-1282, 12-1283)"
    },
    {
      label: "Redemption price",
      value: "Your price plus 8%, plus taxes or assessments you paid, with interest (A.R.S. 12-1285)"
    },
    {
      label: "Deed",
      value: "Sheriff’s deed after every redemption period ends; the sheriff records it within 30 days (A.R.S. 12-1286)"
    }
  ],
  steps: [
    {
      title: "Confirm it really is an HOA foreclosure sale",
      detail: "In Arizona, an HOA can’t use a quick trustee’s sale for unpaid assessments. It must file a lawsuit and win a judgment, and then the county sheriff sells the home (A.R.S. 33-1807). Find the sheriff’s notice of sale, which gives the court case number. Work only with the sheriff’s civil unit and the court file. Never contact the homeowner."
    },
    {
      title: "Read the judgment",
      detail: "Get the judgment from the court file. It says what is being sold, the amount owed and whether the court found the home abandoned, which sets the redemption period at 30 days instead of 6 months (A.R.S. 12-1282). For a condominium, the HOA’s lien is governed by A.R.S. 33-1256 instead; have an attorney confirm how it applies."
    },
    {
      title: "Order a title report and find the first mortgage",
      detail: "The HOA lien ranks behind a recorded first mortgage or first deed of trust, property taxes and government assessments, and liens recorded before the HOA’s declaration (A.R.S. 33-1807). Those generally stay on the home after an HOA sale. Ask the title company for the first loan’s recorded amount and whether a trustee’s sale on it is already scheduled."
    },
    {
      title: "Set your maximum bid",
      detail: "Add the surviving first mortgage, unpaid property taxes, any mechanic’s liens (the HOA lien doesn’t change their priority, A.R.S. 33-1807) and repairs to your price. If the total is near the home’s value, walk away. Use the max bid calculator."
    },
    {
      title: "Confirm the sale is still on",
      detail: "The owner can settle with the HOA, and the sheriff can postpone. Call the sheriff’s civil unit before you go, and ask what forms of payment it accepts."
    },
    {
      title: "Bid and pay within 5 working days",
      detail: "The sheriff sells at public auction. You must pay within five working days. If you don’t, the sheriff offers the home to the second-highest bidder, and you can owe others’ losses and attorney fees (A.R.S. 12-1624)."
    },
    {
      title: "Get your certificate of sale",
      detail: "The certificate describes the property, the price and whether it can be redeemed. You get “all the right, title, interest and claim” of the owner, nothing more (A.R.S. 12-1626)."
    },
    {
      title: "Wait out the redemption period",
      detail: "The owner can redeem for 6 months (30 days if the court found the home abandoned). After that, creditors with later liens can redeem in 5-day turns (A.R.S. 12-1282, 12-1283). If anyone redeems, you get your price plus 8%, plus taxes or assessments you paid with interest (A.R.S. 12-1285). Repairs aren’t repaid, so keep receipts and hold off on upgrades."
    },
    {
      title: "Receive the sheriff’s deed and take possession lawfully",
      detail: "When every redemption period ends, the sheriff gives you the deed and records it within 30 days (A.R.S. 12-1286). If anyone is still living there, give a written demand for possession and, if needed, file a forcible detainer (eviction) case (A.R.S. 12-1173.01). Never change locks or remove belongings yourself."
    }
  ],
  survives: {
    wipedOut: [
      "The HOA lien that was foreclosed",
      "The former owner’s interest, once the sheriff’s deed issues (A.R.S. 12-1626, 12-1286)",
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
      prevent: "You get a certificate of sale. Plan for a 6-month wait (30 days only if the court found the home abandoned), and for the chance you are simply paid back with 8%."
    },
    {
      mistake: "Renovating during the redemption period",
      prevent: "A redeemer repays your price plus 8% and taxes or assessments you paid, not upgrades (A.R.S. 12-1285). Wait for the deed."
    },
    {
      mistake: "Ignoring a trustee’s sale on the first loan",
      prevent: "If the first lender forecloses by trustee’s sale, liens junior to its deed of trust are cleared, and your interest from the HOA sale could be wiped out (A.R.S. 33-811). Check the recorder for a notice of trustee’s sale before you bid."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Riley, a fictional buyer, sees a sheriff’s sale of a townhome worth about $320,000 after an HOA judgment. Bidding opens near $14,000. Riley’s title report shows a recorded first deed of trust of about $255,000 and $3,000 in unpaid property taxes, both of which would stay. The court didn’t find the home abandoned, so the owner would have 6 months to redeem.",
    lesson: "The real cost is the bid plus about $258,000 in surviving liens, plus repairs, and Riley might wait 6 months only to be paid back with 8%. In Arizona, an HOA sale is rarely the bargain the opening bid suggests."
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
  oneLine: "The IRS seizes and sells real property in Arizona to collect unpaid federal taxes, by public auction or sealed bid. Federal law sets the rules, and the owner has 180 days to redeem.",
  youGet: "A certificate of sale when you pay in full, and a deed (usually a quitclaim deed) only if no one redeems within 180 days. You get only the taxpayer’s interest, “as is” and “where is,” subject to liens senior to the IRS.",
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
      value: "Cash, or a certified, cashier’s or treasurer’s check, or a money order, per the notice. Full payment, or a deferred balance of up to 1 month if the notice allows (26 U.S.C. 6335; IRM 5.10.5.14)"
    },
    {
      label: "Redemption",
      value: "180 days. The owner, heirs, or anyone with an interest or lien can redeem by paying your price plus 20% a year, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8)"
    },
    {
      label: "What you get",
      value: "A certificate of sale; a deed after 180 days without redemption (26 U.S.C. 6338)"
    },
    {
      label: "Arizona recording",
      value: "Record the deed with the county recorder. Arizona requires an affidavit of property value with most deeds, but a deed from a federal agency may be exempt (A.R.S. 11-1134, code A3). Confirm with the county recorder"
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov and read the notice of sale",
      detail: "IRS real estate sales in Arizona are few. Each notice gives the date, time, place, the property, the minimum bid and the payment terms. The sale must be 10 to 40 days after public notice and in the county where the property was seized (26 U.S.C. 6335). Ask questions only of the IRS contact named in the notice. Never contact the taxpayer."
    },
    {
      title: "Research the title",
      detail: "The IRS sells only the taxpayer’s right, title and interest, “as is” and “where is,” with no warranty (IRM 5.10.5.7). Order a title report. Mortgages and liens recorded ahead of the federal tax lien stay. Arizona property taxes are a lien ahead of almost all others (A.R.S. 42-17153), and federal law also lets local property tax liens outrank the federal tax lien (26 U.S.C. 6323(b)(6))."
    },
    {
      title: "Look at the property from the street",
      detail: "You usually can’t go inside. Price in repairs you can’t see. Check the county assessor and treasurer for the parcel, taxes owed and any special assessments."
    },
    {
      title: "Bring the right payment",
      detail: "Pay in the form the notice allows: cash, a certified, cashier’s or treasurer’s check, or a money order (IRM 5.10.5.14). If the notice allows deferred payment, the balance is due within the time it sets, no more than one month. If you don’t pay, the IRS can resell the property, and the money you paid is forfeited (26 U.S.C. 6335)."
    },
    {
      title: "Get your certificate of sale",
      detail: "When you pay in full, the IRS gives you a certificate of sale (26 U.S.C. 6338). Keep it safe; you surrender it to get the deed. Ask the IRS and a title company whether to record it with the county recorder. Recording it keeps the taxpayer from selling to an innocent buyer (IRM 5.10.5.17.5)."
    },
    {
      title: "Plan for 180 days",
      detail: "The owner, heirs, or anyone with an interest or lien can redeem within 180 days by paying you your price plus 20% a year, compounded daily (26 U.S.C. 6337; IRM 5.10.6.8). The IRS and the purchaser both must keep the property from wasting during this time (IRM 5.10.5.19). Whether you can collect rent, move in or remove occupants depends on state law, so ask an Arizona attorney before you bid."
    },
    {
      title: "Get the deed",
      detail: "If no one redeems, the IRS gives you a deed, usually a quitclaim deed, when you surrender the certificate (26 U.S.C. 6338). It is prepared under the laws of the state where the property is (IRM 5.10.6.9). It conveys the taxpayer’s interest as of when the federal tax lien attached and clears liens the federal tax lien had priority over (26 U.S.C. 6339)."
    },
    {
      title: "Record the deed in Arizona",
      detail: "Record the deed with the county recorder. Arizona requires an affidavit of property value with most deeds, and the recorder can refuse a deed without one unless it’s exempt (A.R.S. 11-1133). A deed where a U.S. agency is the named grantor is listed as exempt (A.R.S. 11-1134, code A3). Confirm with your county recorder, then buy title insurance before you spend money on the property."
    }
  ],
  survives: {
    wipedOut: [
      "The federal tax lien being enforced",
      "Liens and interests the federal tax lien had priority over, once the deed issues (26 U.S.C. 6339)",
      "The taxpayer’s interest, if no one redeems within 180 days"
    ],
    mayStay: [
      "Mortgages and liens recorded ahead of the federal tax lien",
      "Property taxes and special assessments (A.R.S. 42-17153; 26 U.S.C. 6323(b)(6))",
      "The 180-day redemption right (26 U.S.C. 6337)",
      "Occupants, until removed through the process Arizona law requires. Ask an attorney"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming a clean title",
      prevent: "The IRS sells only the taxpayer’s interest, as is. Get a title report; senior mortgages and property taxes stay."
    },
    {
      mistake: "Planning a quick flip",
      prevent: "Build 180 days of holding costs into your bid. If someone redeems, you get 20% a year on your price, not your repair spending."
    },
    {
      mistake: "Missing the deferred-payment deadline",
      prevent: "Have the full price ready before you bid. A buyer who defaults loses what they already paid (26 U.S.C. 6335)."
    },
    {
      mistake: "Moving in or evicting on your own",
      prevent: "Possession during the redemption period depends on state law. Ask an Arizona attorney before you act."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Morgan, a fictional buyer, wins an IRS sealed-bid sale of a Tucson-area lot at $40,000. Four months later, a creditor with a junior lien redeems. Morgan receives the $40,000 plus about 120 days of 20% yearly interest, compounded daily, roughly $2,700.",
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
  oneLine: "Homes a lender, Fannie Mae, Freddie Mac or HUD took back after foreclosure and now sells through a listing agent. You make an offer with your own agent, usually on the seller’s addendum, and buy the home as is.",
  youGet: "The home through a normal Arizona purchase with escrow and title insurance. The seller usually makes few promises about condition, so your inspection matters more than usual.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s broker in the MLS, or on the official seller sites: HUD Home Store, Fannie Mae HomePath, Freddie Mac HomeSteps"
    },
    {
      label: "HUD homes",
      value: "Bids go through a HUD-registered broker. Since March 1, 2022, homes eligible for FHA 203(b) financing have a 30-day exclusive listing period for owner-occupants, government entities and HUD-approved nonprofits (FHA INFO 2022-03). Investors can bid only after it ends"
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Your agent must be registered in HomePath to submit offers. Owner-occupants get a First Look period before investors; confirm its length on the listing"
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: the first 30 days a home is listed in the MLS, for owner-occupants, some nonprofits and public entities"
    },
    {
      label: "Condition",
      value: "Usually sold as is. Arizona’s Seller’s Property Disclosure Statement (SPDS) is a standard form, not a statute; a seller’s duty to disclose remains even if no SPDS is given (ADRE Buyer Advisory)"
    },
    {
      label: "Rural land",
      value: "For 5 or fewer unsubdivided parcels in an unincorporated area, the seller must give an affidavit of disclosure at least 7 days before transfer; you can rescind within 5 days after (A.R.S. 33-422)"
    },
    {
      label: "Recording",
      value: "Buyer and seller sign an affidavit of property value; $2 filing fee (A.R.S. 11-1133, 11-1134)"
    }
  ],
  steps: [
    {
      title: "Get pre-approved or gather proof of funds",
      detail: "Sellers want proof you can close. If you need an FHA loan, check the HUD listing code: “IE” homes need repairs of no more than $10,000 and need a repair escrow at closing (HUD Home Store FAQ)."
    },
    {
      title: "Choose a buyer’s agent who can submit to each seller",
      detail: "HUD bids must come through a HUD-registered broker. Fannie Mae requires your agent to be registered in HomePath to submit offers. Ask your agent how each bank’s listing agent takes offers. Use only the official seller sites and the MLS listing, never third-party auction sites."
    },
    {
      title: "Know the owner-occupant priority periods",
      detail: "HUD: owner-occupants, government entities and HUD-approved nonprofits bid first, for 30 days on homes eligible for FHA 203(b) financing (FHA INFO 2022-03); ask the HUD-registered broker about other homes. Freddie Mac: First Look for the first 30 days in the MLS. Fannie Mae: a First Look period; confirm the length on the listing. Fannie Mae’s owner-occupant buyers certify they’ll move in within 60 days of closing and live there at least a year, with $10,000 in damages for a false certification."
    },
    {
      title: "Read the seller’s addendum before you sign",
      detail: "Bank and government sellers use their own addendum, which usually overrides parts of the Arizona purchase contract, such as repairs, deadlines and per-day fees for late closing. Ask what disclosures the seller will give. Most sellers give an SPDS, but a lender that never lived in the home may know little. The seller’s duty to disclose what it knows remains even without an SPDS (ADRE Buyer Advisory)."
    },
    {
      title: "Inspect everything you can",
      detail: "The ADRE Buyer Advisory calls a professional inspection “absolutely essential.” In Arizona, also check: roof age, pool barriers, sewer connection (a plumber can verify it), a septic or other on-site system (the ADRE Buyer Advisory says a qualified inspector must inspect it within six months before a transfer), soil problems such as expansive soil or earth fissures, termites, and a five-year insurance claims history. Homes built before 1978 need a lead-based paint disclosure."
    },
    {
      title: "Check rural and HOA disclosures",
      detail: "For 5 or fewer parcels of unsubdivided land in an unincorporated area, the seller must give you an affidavit of disclosure covering access, flood zone, utilities, water, septic and more, at least 7 days before transfer, and you can rescind within 5 days after you get it (A.R.S. 33-422). In an HOA or condo, you should receive the resale disclosure the ADRE Buyer Advisory describes (A.R.S. 33-1260 and 33-1806). Also ask whether the home is in a Community Facilities District, which adds to the tax bill."
    },
    {
      title: "Appraise and review title",
      detail: "Your lender orders the appraisal. Read the title commitment, especially the Schedule B exceptions: easements and other items your policy won’t cover. Escrow can request an HOA statement of unpaid assessments, which the HOA must give within 10 days and which binds it (A.R.S. 33-1807)."
    },
    {
      title: "Close through escrow and record",
      detail: "Buyer and seller each sign the Arizona affidavit of property value, filed with the deed for a $2 fee unless exempt (A.R.S. 11-1133, 11-1134). A sale where a U.S. agency such as HUD is the named seller is listed as exempt (code A3)."
    },
    {
      title: "Fix your property tax class",
      detail: "A home owned in foreclosure by a financial institution is taxed as class 4 residential property (A.R.S. 42-12004). If you’ll live there, make sure the county assessor classifies it as your primary residence, class 3 (A.R.S. 42-12003). Confirm the steps with your county assessor."
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
      "Physical problems the seller didn’t know about or disclose; you buy as is"
    ]
  },
  mistakes: [
    {
      mistake: "Skipping the addendum",
      prevent: "Read every page. It can shift repairs, deadlines and per-day late fees to you."
    },
    {
      mistake: "Skipping the inspection because the home is as is",
      prevent: "As is means the seller won’t fix things, not that you shouldn’t know about them. Inspect within your contingency period."
    },
    {
      mistake: "Signing a false owner-occupant certification",
      prevent: "Bid during First Look only if you’ll live there. Fannie Mae’s certification carries $10,000 in damages and can bar you from future sales."
    },
    {
      mistake: "Using an unregistered agent",
      prevent: "HUD requires a HUD-registered broker, and Fannie Mae requires a HomePath-registered agent. Confirm before you find the home you want."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Avery, a fictional buyer, offers on a Fannie Mae home in Mesa during First Look and signs the owner-occupant certification. The inspection finds a failing roof and evidence of old termite damage. The as-is addendum means no repairs, but Avery’s agent negotiates a lower price before the inspection period ends.",
    lesson: "Bank-owned homes are sold as is, but your inspection period still gives you room to renegotiate or walk away. Use it fully."
  },
  sources: [
    { label: "HUD FHA INFO 2022-03: 30-day exclusive listing period", url: "https://www.hud.gov/sites/dfiles/SFH/documents/SFH_FHA_INFO_2022-03.pdf" },
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.contractor, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azshort",
  title: "Arizona short sales",
  short: "Short sales",
  oneLine: "The owner sells for less than the loan balance, and the lender agrees to accept less. You buy through the listing agent, and the sale can close only after every lienholder approves.",
  youGet: "The home by a normal Arizona sale through escrow, with title insurance, once the lender (and any other lienholder) approves the price.",
  forSale: true,
  glance: [
    {
      label: "What it is",
      value: "A sale for less than what’s owed on the mortgage, which the lender must agree to; a type of loss mitigation (CFPB)"
    },
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent, marked “short sale” or “subject to lender approval”"
    },
    {
      label: "Timeline",
      value: "Often weeks to months for lender approval; each lienholder reviews separately"
    },
    {
      label: "Foreclosure risk",
      value: "A trustee’s sale can still happen. In Arizona it is final, with no redemption (A.R.S. 33-811)"
    },
    {
      label: "Financing and inspection",
      value: "Allowed, on the usual Arizona contract plus the lender’s approval terms"
    },
    {
      label: "Deficiency",
      value: "Whether the lender can pursue the seller for the shortfall is between the seller and the lender. Arizona’s anti-deficiency statutes (A.R.S. 33-729 and 33-814) may matter; the seller should ask an attorney"
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
      detail: "Your agent works with the listing agent, who manages the seller’s file with the lender. All questions go through the agents. Never contact the owner directly, and never send the owner letters or offers outside the listing."
    },
    {
      title: "Offer subject to lender approval",
      detail: "The seller accepts your offer first. Then the listing agent sends it to the lender with the seller’s hardship package. Your contract should say what happens if approval doesn’t come by a set date."
    },
    {
      title: "Ask about every lien",
      detail: "A second mortgage, HOA lien or judgment lien must also be released, and each holder may ask for more money. Ask your title company for a preliminary report early. Escrow can request the HOA’s statement of unpaid assessments, which the HOA must give within 10 days (A.R.S. 33-1807)."
    },
    {
      title: "Watch the foreclosure calendar",
      detail: "Ask the listing agent whether a trustee’s sale is scheduled and whether the lender will postpone it. Federal servicing rules limit a foreclosure sale while a complete loss-mitigation application, which can include a short sale, is under review, if it was received more than 37 days before the sale (12 CFR 1024.41). An Arizona trustee’s sale is final, so if it goes ahead, your deal ends (A.R.S. 33-811)."
    },
    {
      title: "Inspect during your inspection period",
      detail: "Short-sale sellers often can’t afford repairs, and the lender won’t pay for them. Use your inspection period, and review the SPDS and other disclosures with your agent (ADRE Buyer Advisory)."
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
      "Any lien whose holder doesn’t agree; the sale can’t close with a clear title until they do",
      "Property taxes, which escrow pays at closing; they are a lien ahead of almost all others (A.R.S. 42-17153)",
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
      prevent: "Keep looking at other homes. The lender can reject or counter, and a trustee’s sale can still go ahead."
    },
    {
      mistake: "Ignoring the second loan",
      prevent: "Ask up front how many liens there are. Each lienholder must agree."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Casey, a fictional buyer, offers $340,000 on a Chandler short sale. The first lender approves after 11 weeks. Then the second-mortgage holder asks for $6,000 more to release its lien, and the first lender agrees to let escrow pay part of it. The approval letter gives 30 days to close.",
    lesson: "Expect each lienholder to negotiate, and have your loan ready so you can meet the approval letter’s deadline."
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.contractor, TEAM.attorney],
  lastReviewed: "2026-10-03",
  state: 'AZ'
},
{
  key: "azcommercial",
  title: "Arizona commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land sold in Arizona at trustee, sheriff and tax sales, by receivers, and by bank or government sellers.",
  youGet: "The same deed as a home bought the same way, but without home-buyer protections, and often with tenants, leases, city rent taxes and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: trustee’s sales (final, no redemption, A.R.S. 33-811), sheriff’s sales (6-month redemption in most cases, A.R.S. 12-1282, 12-1283), tax lien sales, court receivers, and bank or government sellers"
    },
    {
      label: "Value",
      value: "Rental property: by income (net operating income ÷ cap rate). Land and owner-user buildings: by recent sales of similar commercial property"
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment (ASTM E1527-21) within one year before you take title, with key parts updated within 180 days, plus continuing obligations after you buy, can protect you from federal cleanup liability"
    },
    {
      label: "Transfer tax",
      value: "None. Arizona’s constitution bars new taxes or fees on transferring real property (Ariz. Const. art. 9, § 24). You file an affidavit of property value with a $2 fee (A.R.S. 11-1133, 11-1134)"
    },
    {
      label: "Property tax class",
      value: "Commercial and industrial property is class 1 (A.R.S. 42-12001); residential rentals, including apartments, are class 4 (A.R.S. 42-12004). Each class has its own assessment ratio (A.R.S. 42-15001 to 42-15009); confirm the current ratio with the county assessor"
    },
    {
      label: "Rent tax",
      value: "Commercial rent is subject to city and, in some counties, county transaction privilege tax (TPT). Look up the address on the ADOR rate tool"
    },
    {
      label: "Tenants",
      value: "A trustee’s sale clears interests junior to the deed of trust (A.R.S. 33-811), which can include later leases. The federal tenant protection law (PTFA) covers residential tenants, not stores or offices"
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor record for land use, building size, year built and property class, and the parcel map for access and boundaries. Work only with the official seller: the trustee, sheriff, receiver, treasurer or the bank’s listing broker. Never contact the owner, its employees or its customers."
    },
    {
      title: "Know which sale rules apply",
      detail: "A trustee’s sale is final with no redemption and clears liens junior to the deed of trust (A.R.S. 33-811). A sheriff’s sale after a court foreclosure has a 6-month redemption period in most cases (A.R.S. 12-1282, 12-1283). A tax lien sale gives a lien, not the building. Read the right DeedOwl guide for each."
    },
    {
      title: "Get the rent roll and leases, if you can",
      detail: "A receiver or listing broker can usually provide them. At an auction you often can’t, so assume the building is empty until proven otherwise. Leases recorded or signed before the deed of trust, or with a non-disturbance agreement, may stay. Ask an attorney."
    },
    {
      title: "Value it the right way",
      detail: "For a rental building: net operating income (rent after vacancy and operating costs) divided by the cap rate. Ask a local commercial broker or appraiser for current cap rates. Include Arizona costs: class 1 property tax, and city or county TPT on commercial rent, which covers rent and many reimbursements, such as property tax, insurance and common area charges (ADOR)."
    },
    {
      title: "Order a title search",
      detail: "Commercial parcels often carry easements, CC&Rs, reciprocal easement agreements, mechanic’s liens and recorded leases. Property taxes are a lien ahead of almost all others (A.R.S. 42-17153). Know which items survive your kind of sale."
    },
    {
      title: "Screen for contamination",
      detail: "Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Search EPA records and the Arizona Department of Environmental Quality (ADEQ) for nearby landfills and contamination sites. Order a Phase I assessment within one year before you take title; its site visit, interviews and records searches must be within 180 days (EPA)."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Ask the city or county planning department whether your planned use is allowed and whether there are open code cases or expired permits. If the land is in an unincorporated area and the sale is 5 or fewer unsubdivided parcels, a non-auction seller must give you an affidavit of disclosure covering access, utilities, flood zone and zoning, and you can rescind within 5 days (A.R.S. 33-422)."
    },
    {
      title: "Line up your money",
      detail: "Trustee and sheriff sales need certified funds within days, with a deposit to bid at a trustee’s sale. Confirm the amounts and deadlines in the notice and in DeedOwl’s Arizona trustee and sheriff sale guides. Have a commercial or bridge lender ready to refinance after."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it, secure the building, tell tenants in writing where to pay rent, and ask each tenant to sign an estoppel certificate confirming their lease. Register for TPT if you’ll collect commercial rent (ADOR). In a building open to the public, plan for ADA barrier removal where it’s readily achievable."
    }
  ],
  survives: {
    wipedOut: [
      "Liens and interests junior to the deed of trust foreclosed at a trustee’s sale (A.R.S. 33-811)",
      "Leases junior to that deed of trust, unless the lender agreed to keep them (non-disturbance agreement). A tenant whose lease is wiped out can also leave. Confirm with an attorney"
    ],
    mayStay: [
      "Property taxes and special assessments (A.R.S. 42-17153)",
      "Liens recorded before the lien being foreclosed",
      "Environmental cleanup liability: it follows the owner, not the lien",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases that have priority or a non-disturbance agreement",
      "Residential tenants’ federal 90-day notice rights in apartment buildings (PTFA)"
    ]
  },
  mistakes: [
    {
      mistake: "Valuing it like a house",
      prevent: "Use income and cap rate. A vacant building is worth its leased value minus the cost of getting there: lost rent, leasing commissions and tenant improvements."
    },
    {
      mistake: "Forgetting Arizona’s rent tax and commercial tax class",
      prevent: "Budget for city or county TPT on commercial rent and class 1 property tax. Confirm the address on the ADOR rate tool and the class with the county assessor."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. Check EPA and ADEQ records and get a Phase I assessment when you can."
    },
    {
      mistake: "Assuming the tenants will keep paying",
      prevent: "Get estoppel certificates, and budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Illustrative example (fictional)",
    story: "Jamie, a fictional buyer, wins a small Phoenix-area retail building at a trustee’s sale. The rent roll from the old listing showed full occupancy, but two tenants’ leases were signed after the deed of trust and had no non-disturbance agreements. Both tenants used the sale to leave, and Jamie’s budget hadn’t included city TPT on the remaining rent.",
    lesson: "Check lease priority before you bid, and count Arizona’s rent tax and commercial tax class in your numbers."
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
  oneLine: "A Utah homeowners or condo association can sell a home to collect unpaid assessments, either through a trustee sale or a court case.",
  youGet: "The owner’s interest, usually still subject to the first mortgage. A trustee sale has no redemption; a court (sheriff) sale has a 180-day redemption period.",
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Community Association Act (Utah Code 57-8a-301 to 57-8a-306) for HOAs; Condominium Ownership Act (57-8-44 to 57-8-47) for condos. The rules are nearly the same."
    },
    {
      label: "Two ways to foreclose",
      value: "Nonjudicial (a trustee sale, as if the lien were a trust deed) or judicial (a court case ending in a sheriff’s sale) (57-8a-302, 57-8-45)."
    },
    {
      label: "Trustee needed",
      value: "A trustee sale can happen only if the association appoints a qualified trustee: a Utah attorney or law firm, or a title insurance company or agency with an office in Utah (57-8a-302(3), 57-1-21)."
    },
    {
      label: "Priority",
      value: "The association’s lien is junior to a first or second mortgage recorded before the association recorded its notice of lien, to liens recorded before the declaration, and to property taxes (57-8a-301(4), 57-8-44(4)). There is no Nevada-style super-priority."
    },
    {
      label: "Limits on trustee sales",
      value: "The owner must get 30 days’ warning and can demand a court case instead. A trustee sale can’t collect fines, and needs an assessment more than 180 days overdue (57-8a-303, 57-8-46)."
    },
    {
      label: "Redemption",
      value: "Trustee sale: none (57-1-28). Court foreclosure: 180 days after the sheriff’s sale (78B-6-906, URCP 69C)."
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
      detail: "A trustee sale is noticed like any Utah trust deed sale: a notice of default recorded with the county recorder, then a notice of sale published and posted (57-1-24, 57-1-25). A court foreclosure ends in a sheriff’s sale under the court rules. The notice names the trustee or sheriff to call."
    },
    {
      title: "Find every loan ahead of the association",
      detail: "Order a title report. In Utah, a first or second mortgage recorded before the association’s notice of lien stays ahead of the association’s lien, and so do property taxes. Your purchase usually leaves that mortgage on the home, and its lender can still foreclose and wipe you out if it isn’t paid."
    },
    {
      title: "Check that the sale was set up correctly",
      detail: "For a trustee sale, the trustee must be a qualified Utah attorney or title company, the owner must have received the 30-day notice with the right to demand a court case, the lien can’t include fines, and it must include an assessment more than 180 days overdue (57-8a-302, 57-8a-303). Ask the trustee for its file, and have a title company or attorney review it before you bid."
    },
    {
      title: "Confirm the association is registered",
      detail: "Utah associations must register with the Department of Commerce and keep it current. While an association is out of compliance, it can’t enforce its lien (57-8a-105, 57-8-13.1). Ask the trustee or the association’s attorney to confirm registration, and have your title company check it."
    },
    {
      title: "Set your maximum bid",
      detail: "Add the surviving mortgage balance, unpaid property taxes, future dues, repairs and your holding costs. Use the max bid calculator. A cheap opening bid can be very expensive once the first mortgage is added."
    },
    {
      title: "Bid and pay as directed",
      detail: "At a trustee sale, every bid is irrevocable and you pay as the trustee directs (57-1-27, 57-1-28). At a sheriff’s sale, confirm payment terms with the sheriff’s civil office. Look at the home only from the street. Don’t contact the owner or occupants."
    },
    {
      title: "Get your deed, or wait out redemption",
      detail: "After a trustee sale, the trustee submits the trustee’s deed for recording within five business days of payment, with no redemption (57-1-28). After a sheriff’s sale, you get a certificate of sale; the owner or a junior creditor can redeem for 180 days at your price plus 6% and recorded costs (URCP 69C)."
    },
    {
      title: "Take over lawfully and keep paying the loan holder in mind",
      detail: "Insure the home, start paying the dues, and talk to the senior lender’s servicer about the loan that stayed on the property (an attorney can advise how). If anyone lives there, use the court’s unlawful detainer process with an attorney. Never change locks or remove belongings on your own."
    }
  ],
  survives: {
    wipedOut: [
      "The association’s lien being foreclosed",
      "The owner’s interest and liens recorded after the association’s lien, if the sale was valid",
      "Redemption rights, after a trustee sale (there are none)"
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
      prevent: "Utah’s association lien is junior to a first or second mortgage recorded before the notice of lien. Get a title report and add the surviving loan to your price."
    },
    {
      mistake: "Ignoring how the sale was started",
      prevent: "A trustee sale is invalid if the owner didn’t get the 30-day notice, demanded a court case, or the lien included fines. Have an attorney or title company review the trustee’s file."
    },
    {
      mistake: "Fixing up during a sheriff’s sale redemption period",
      prevent: "After a court foreclosure, the owner can redeem for 180 days. Spend only to protect the property, and record notice of what you pay (URCP 69C)."
    },
    {
      mistake: "Forgetting the first lender can still foreclose",
      prevent: "If the senior loan is in default, its trustee can sell the home and wipe out your interest. Check the loan status and budget to deal with it."
    }
  ],
  example: {
    title: "Illustrative example: the $6,000 townhome",
    story: "Morgan, a made-up investor, saw a notice of trustee’s sale for a townhome in a fictional Utah HOA. The association was owed about $6,000. Morgan’s title report showed a $240,000 first trust deed recorded years before the association recorded its notice of lien, and the home was worth about $300,000. Morgan also learned the first loan was already in default.",
    lesson: "The first trust deed would survive, so the real cost was about $246,000 plus taxes, dues and repairs, with a foreclosure risk on top. Morgan passed. In Utah, price an HOA sale as if the first mortgage stays."
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
  oneLine: "The IRS seizes and sells a Utah property to collect unpaid federal taxes, by public auction or sealed bid, under federal law.",
  youGet: "A certificate of sale at payment, then a deed to the taxpayer’s interest after a 180-day redemption period. The property is sold as-is, subject to liens ahead of the IRS.",
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Federal: 26 U.S.C. 6335 (sale), 6337 (redemption), 6338 (certificate and deed), 6339 (effect of the deed). Utah law adds recording rules."
    },
    {
      label: "Where listed",
      value: "irsauctions.gov. The IRS also publishes notice in a newspaper in the county, or posts it if there is none (6335(b))."
    },
    {
      label: "Timing",
      value: "The sale is held 10 to 40 days after public notice, in the county where the property was seized unless the IRS orders otherwise (6335(d))."
    },
    {
      label: "Minimum bid",
      value: "Set by the IRS before the sale. No sale below it; if no one bids it, the property may be deemed sold to the United States or released to the owner (6335(e))."
    },
    {
      label: "Payment",
      value: "Cash, certified, cashier’s or treasurer’s check, or a U.S. postal, bank or express money order, payable to the United States Treasury (Form 2434-B). Full payment or a deferred part, as the notice says."
    },
    {
      label: "Redemption",
      value: "180 days. The owner, heirs, or anyone with an interest or lien can redeem by paying your price plus 20% a year interest. The IRS says this interest is compounded daily (6337, Form 2434-B)."
    },
    {
      label: "What you get",
      value: "A certificate of sale (Form 2435) when you pay in full; a deed after 180 days if no one redeems (6338)."
    },
    {
      label: "Court-ordered sales",
      value: "Different rules. A federal court can order a sale in a lien case (26 U.S.C. 7403); the terms come from the court’s order. Read it."
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov for Utah listings",
      detail: "IRS real estate sales are rare and scattered. Each listing links a notice of sale with the date, place, minimum bid, payment terms and whether the sale is by auction or sealed bid."
    },
    {
      title: "Read the notice of encumbrances (Form 2434-B)",
      detail: "The IRS lists the liens and interests it knows about, but it doesn’t warrant that list. The taxpayer’s interest is sold subject to mortgages and liens ahead of the federal tax lien. Order your own title report from a Utah title company."
    },
    {
      title: "Check whether it’s the taxpayer’s home",
      detail: "The IRS can levy on a taxpayer’s principal residence only with a federal judge’s written approval (26 U.S.C. 6334(a)(13), (e)). If it’s a home, look for that approval in the file, and remember someone may live there."
    },
    {
      title: "Inspect only what you can see legally",
      detail: "The property is sold as-is and where-is, with no warranty about title or condition, and no refund if it isn’t what you expected (Form 2434-B). View it from the street. Don’t contact the owner or occupants."
    },
    {
      title: "Set your maximum bid",
      detail: "Add any senior mortgage, unpaid Utah property taxes, repairs, and 180 days of holding costs. Use the max bid calculator."
    },
    {
      title: "Bid and pay as the notice requires",
      detail: "If full payment is required and you don’t pay, the IRS resells right away. If part can be deferred and you miss it, you can be sued for the balance with 6% interest, or the sale can be voided and your payment forfeited (6335(e)(3))."
    },
    {
      title: "Hold your certificate for 180 days",
      detail: "Anyone entitled can redeem for 180 days by paying your price plus 20% a year. Whether you can collect rent, evict or move in during this time isn’t spelled out in the federal statutes; ask a Utah attorney before you bid, and don’t start renovations."
    },
    {
      title: "Get your deed and record it with the county recorder",
      detail: "If no one redeems, surrender the certificate of sale to the IRS office named on it to get your deed (6338, Form 2434-B). Record it right away with the recorder in the Utah county where the land sits. Utah lets a federal document be recorded without notarization (Utah Code 57-4a-3), and an unrecorded deed can lose out to a later good-faith buyer who records first (57-3-103)."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone is still living there after you have the deed, hire an attorney and use Utah’s unlawful detainer process (78B-6-802). Never use self-help."
    }
  ],
  survives: {
    wipedOut: [
      "The federal tax lien being enforced",
      "Liens and interests junior to that federal tax lien (6339(c))",
      "The taxpayer’s interest, once the 180 days pass without redemption"
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
      prevent: "The IRS says it doesn’t warrant Form 2434-B. Order your own title search before you bid."
    },
    {
      mistake: "Renovating during the 180 days",
      prevent: "A redeemer repays your price plus 20% a year, not your repairs. Wait for the deed."
    },
    {
      mistake: "Bringing the wrong kind of money",
      prevent: "Read the notice. The IRS takes cash, certified or cashier’s checks, and certain money orders, payable to the United States Treasury."
    },
    {
      mistake: "Not recording the deed",
      prevent: "Record it with the county recorder as soon as you get it. In Utah, an unrecorded document can be void against a later good-faith buyer who records first."
    }
  ],
  example: {
    title: "Illustrative example: a cabin lot near a fictional Utah town",
    story: "Avery, a made-up buyer, won an IRS sale for a mountain lot at $38,000, paying with a cashier’s check made out to the United States Treasury. Avery’s title report showed no mortgage, but did show unpaid property taxes. Five months later, a lienholder redeemed and paid Avery the $38,000 plus 20% a year interest.",
    lesson: "The interest paid Avery for the wait, but the lot was gone. Plan for redemption, pay attention to property taxes, and don’t spend on improvements until you have the deed."
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
  oneLine: "Homes a bank, Fannie Mae, Freddie Mac or HUD took back after foreclosure, sold through a listing agent with the seller’s own contract terms.",
  youGet: "The home by a normal purchase through a Utah title company, usually as-is, with the seller’s addendum overriding parts of the standard contract.",
  forSale: true,
  glance: [
    {
      label: "Utah contract",
      value: "Utah licensees must use the state-approved Real Estate Purchase Contract (REPC), but buyer and seller can agree to change it or use another form. Big sellers often do."
    },
    {
      label: "Fannie Mae (HomePath)",
      value: "Your agent must register on HomePath and submits offers online. Fannie Mae uses its own Residential Real Estate Purchase and Sale Contract and won’t sign conflicting addenda."
    },
    {
      label: "Freddie Mac (HomeSteps)",
      value: "First Look: for the first 30 days a home is listed in the MLS, only owner-occupants, public entities and certain non-profits can buy. Investors can offer after that."
    },
    {
      label: "HUD homes",
      value: "Bids go through a HUD-registered broker. Since March 1, 2022, homes eligible for FHA 203(b) financing have a 30-day exclusive listing period for owner-occupants, government entities and HUD-approved non-profits."
    },
    {
      label: "Condition",
      value: "Usually as-is. The REPC itself says the buyer takes the home as-is after a due diligence period, so use that period well."
    },
    {
      label: "Title",
      value: "Close through a Utah title company with an owner’s title insurance policy. Under the REPC, the seller pays for it; a bank’s addendum may change that."
    },
    {
      label: "Water",
      value: "In Utah, water rights and water shares can be part of the sale. The REPC includes those that serve the home unless excluded. Check the seller’s addendum."
    }
  ],
  steps: [
    {
      title: "Find homes from direct sources",
      detail: "Search HomePath (Fannie Mae), HomeSteps (Freddie Mac), HUD Home Store and the real estate pages of banks and credit unions that own Utah homes. Avoid paid lists and middlemen."
    },
    {
      title: "Get pre-approved or gather proof of funds",
      detail: "Fannie Mae requires a pre-qualification or proof of funds for offer acceptance. HomeSteps wants a pre-approval letter, or proof of funds for cash, with every offer."
    },
    {
      title: "Hire a Utah buyer’s agent who knows REO",
      detail: "HUD requires a HUD-registered broker. HomePath requires your agent to be registered on its site. Your agent also handles the seller’s portal, forms and deadlines."
    },
    {
      title: "Make your offer on the right paperwork",
      detail: "Your agent starts from the Utah REPC or the seller’s own contract. Fannie Mae uses its own contract and won’t accept a sale-of-other-home or 1031 exchange contingency. HomeSteps requires its own addenda and certified earnest money at contract signing. Owner-occupant buyers sign an occupancy certification."
    },
    {
      title: "Read every page of the addendum",
      detail: "The seller’s addendum usually overrides the REPC on repairs, disclosures, deadlines, closing costs and penalties for late closing. Ask your agent to explain anything that shifts cost or risk to you."
    },
    {
      title: "Inspect during due diligence",
      detail: "The REPC gives you a due diligence period to inspect, test and review documents, and to cancel or resolve objections by the deadline. Miss it and your earnest money can become non-refundable. Banks that never lived in the home may give little or no condition disclosure, so hire a licensed inspector."
    },
    {
      title: "Get the appraisal and loan approved",
      detail: "Under the REPC, you can cancel if the home appraises below the price or your loan falls through, but only by the Financing & Appraisal Deadline and only if those conditions are checked. Watch the dates."
    },
    {
      title: "Review the title commitment",
      detail: "Look for liens the seller hasn’t cleared, HOA dues, easements and water rights. A home a lender took back at a Utah trustee sale came with no redemption right (57-1-28), but older liens can still be on title."
    },
    {
      title: "Close through the title company",
      detail: "Sign, pay through the title company, and get your recorded deed and owner’s title policy. Ask the listing agent whether the home is vacant and who delivers possession."
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
      prevent: "Ask the listing agent how many First Look days are left. HomeSteps and HUD consider investor offers only after their exclusive periods."
    },
    {
      mistake: "Signing an owner-occupant certification you won’t keep",
      prevent: "HomeSteps warns that a false affidavit can lead to criminal or civil liability. Only certify if you’ll live there."
    },
    {
      mistake: "Overlooking water rights",
      prevent: "Ask whether water shares or rights come with the home and how they’ll be transferred at closing."
    }
  ],
  example: {
    title: "Illustrative example: a HomeSteps home in a fictional Utah suburb",
    story: "Sam, a made-up first-time buyer, found a Freddie Mac home on day 12 of its First Look period. Sam’s agent sent the offer with a pre-approval letter, the HomeSteps addenda and certified earnest money. The inspection found a cracked sewer line. The addendum said the seller made no repairs, so Sam negotiated a lower price before the due diligence deadline.",
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
      label: "HUD FHA INFO 2022-03: 30-day exclusive listing period",
      url: "https://www.hud.gov/sites/dfiles/SFH/documents/SFH_FHA_INFO_2022-03.pdf"
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.contractor, TEAM.insurance],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utshort",
  title: "Utah short sales",
  short: "Short sales",
  oneLine: "The owner sells for less than the loan balance, and the lender agrees to accept less. You buy through the listing agent like a normal sale, once the lender approves.",
  youGet: "The home by a normal purchase through a Utah title company, once every lienholder approves its payoff.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent as a short sale, subject to lender approval. All contact goes through the listing agent."
    },
    {
      label: "Contract",
      value: "The Utah REPC, with the short-sale terms in an addendum. The seller accepts first; then the lender decides."
    },
    {
      label: "Timeline",
      value: "Often weeks to months for lender approval. Each lienholder has to agree."
    },
    {
      label: "Foreclosure clock",
      value: "A Utah trustee sale can be noticed three months after the notice of default is recorded (57-1-24). Postponements up to 45 days need no new notice (57-1-27)."
    },
    {
      label: "Agent rules",
      value: "Utah agents can’t use a lender’s short sale demand letter outside the deal, can’t have the seller sign a lien for the agent, and can’t charge a fee hidden in the gap between the approved price and the payoff (R162-2f-401b)."
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
      detail: "Your agent works with the listing agent, tracks the lender’s requests and keeps the deadlines straight. Don’t contact the owner directly; everything goes through the listing agent."
    },
    {
      title: "Write the offer subject to lender approval",
      detail: "Your agent uses the Utah REPC and an addendum that makes the deal subject to approval by every lienholder. Set your due diligence and settlement deadlines with a long approval in mind."
    },
    {
      title: "Ask about the foreclosure timeline",
      detail: "Through your agent, ask whether a notice of default or notice of sale has been recorded and whether the trustee has agreed to postpone the sale. You can also check the county recorder. A sale can go ahead while the lender is still reviewing."
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
      detail: "All money moves through the title company and appears on the settlement statement the lender approves. Never pay a side fee, “negotiator” fee or the seller outside closing."
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
      prevent: "Extend the REPC deadlines in writing if approval runs long, or your earnest money may be at risk."
    }
  ],
  example: {
    title: "Illustrative example: two lienholders, one sale",
    story: "Jamie, a made-up buyer, offered $395,000 on a short sale in a fictional Utah city. The first lender approved after nine weeks. The second-mortgage holder asked for more to release its lien, which added a month. Jamie’s agent got the REPC deadlines extended in writing, and the sale closed through the title company.",
    lesson: "Ask early how many liens there are, expect each one to negotiate, and keep your contract deadlines extended in writing."
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
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.contractor, TEAM.attorney],
  lastReviewed: "2026-10-03",
  state: 'UT'
},
{
  key: "utcommercial",
  title: "Utah commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land sold at Utah tax, trustee, sheriff and IRS sales, or by banks and government sellers.",
  youGet: "The same deed as a home bought the same way, but without home-buyer programs, and often with tenants, leases, water rights and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: county tax sales, trustee sales, sheriff sales, IRS sales, court-appointed receivers, and bank or government sellers. Read the matching Utah guide for each."
    },
    {
      label: "Value",
      value: "Rental property: by income (net operating income ÷ cap rate). Land, and buildings a business will use itself: by recent sales of similar commercial property. Not by comparing it with homes."
    },
    {
      label: "Property tax",
      value: "The county assessor values property at fair market value as of January 1 (Utah Code 59-2-103, 59-2-301). Only residential property gets the 45% residential exemption, so a store or office is taxed on full value."
    },
    {
      label: "Tax appeals",
      value: "File with the county board of equalization by September 15 or within 45 days after the county’s valuation notice, whichever is later (59-2-1004)."
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment (ASTM E1527-21) within one year before you take title, with key parts updated within 180 days, plus ongoing duties after you buy, can protect you from federal cleanup liability."
    },
    {
      label: "Water",
      value: "Utah water rights and shares can be sold with land or separately. A deed can come with a water rights addendum filed with the county recorder (57-3-109). Confirm what water comes with the property."
    },
    {
      label: "No home-buyer programs",
      value: "No owner-occupant First Look. HomeSteps excludes multi-family homes and vacant land from First Look. Financing is commercial, bridge or SBA (for a business using the building)."
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the county assessor’s record for land use, building size and year built, and the county recorder for the legal description, easements and recorded leases. Check access and boundaries on the parcel map."
    },
    {
      title: "Get the rent roll and leases, if you can",
      detail: "A receiver or listing broker can usually provide them. At a tax, trustee or sheriff’s sale you often can’t, so assume the building is empty until proven otherwise."
    },
    {
      title: "Value it the right way",
      detail: "For a rental building: net operating income divided by the cap rate. Ask a local commercial broker or appraiser for current cap rates. Budget property tax on full fair market value, since only residential property gets Utah’s 45% exemption (apartments where tenants live as their primary residence can qualify)."
    },
    {
      title: "Order a title search",
      detail: "Commercial parcels often carry easements, reciprocal easement agreements, CC&Rs, mechanic’s liens and recorded leases. Know which ones survive the kind of sale you’re in. Property tax liens attach every January 1 (59-2-1325)."
    },
    {
      title: "Check water rights",
      detail: "Ask what water rights or shares serve the property and how they’ll transfer. Search the Utah Division of Water Rights records, and ask your title company and attorney to confirm."
    },
    {
      title: "Screen for contamination",
      detail: "Check EPA records for the address and ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Order a Phase I assessment if time allows, and ask your consultant to check Utah Department of Environmental Quality records too."
    },
    {
      title: "Check zoning, code and permits",
      detail: "Confirm with the city or county planning department that your planned use is allowed and that there are no open code cases or expired permits."
    },
    {
      title: "Line up your money and your contract",
      detail: "Auctions need cash on the trustee’s or sheriff’s terms; line up a commercial or bridge lender to refinance after. For a negotiated purchase, have your attorney review whether the state-approved REPC fits the deal or a custom contract is needed."
    },
    {
      title: "Take over well",
      detail: "Insure it the day you own it, secure the building, tell tenants in writing where to pay rent, and ask each tenant to sign an estoppel certificate confirming their lease (most leases require it). If you disagree with the January 1 value, appeal on time."
    }
  ],
  survives: {
    wipedOut: [
      "At a trustee or sheriff’s sale: liens recorded after the lien being foreclosed, if the sale was valid",
      "Leases signed after that lien, or subordinated to it, unless the lender agreed to keep them (non-disturbance agreement). A tenant whose lease is wiped out can also leave. Confirm with an attorney",
      "In a negotiated purchase: liens the seller pays off at closing (confirm on the title commitment)"
    ],
    mayStay: [
      "Property taxes (they attach every January 1)",
      "Liens recorded before the lien being foreclosed",
      "Environmental cleanup liability: it follows the owner, not the lien",
      "Easements, reciprocal easement agreements and CC&Rs",
      "Leases that have priority or a non-disturbance agreement",
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
      prevent: "Past uses can mean cleanup costs bigger than the price. Check EPA and Utah DEQ records, and get a Phase I assessment."
    },
    {
      mistake: "Assuming the water comes with the land",
      prevent: "In Utah, water rights can be sold separately. Confirm in writing what transfers, and record it properly."
    },
    {
      mistake: "Assuming the tenants will keep paying",
      prevent: "Get estoppel certificates, and budget for vacancy, leasing commissions and tenant improvements."
    }
  ],
  example: {
    title: "Illustrative example: a small shop building in a fictional Utah county",
    story: "Taylor, a made-up investor, bought a two-unit shop building from a bank for $620,000. Taylor’s Phase I found an old fuel tank on the lot, and the bank agreed to remove it before closing. Taylor budgeted property tax on full value, not the residential rate, and had both tenants sign estoppel certificates at closing. One tenant’s lease turned out to end in four months.",
    lesson: "Check past uses, budget Utah property tax on full value for commercial property, and confirm every lease in writing before you count on the rent."
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
}
];
