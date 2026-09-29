// Step-by-step guides for California, Arizona and Utah, in the same shape as Nevada’s (see playbooks.ts).
// Every rule cites the state’s statutes or court rules; county details are labeled as examples to confirm locally.
// Examples are illustrative, not real properties or transactions.

import type { Playbook } from './playbooks';
import { TEAM } from './playbookTeam';

const REVIEWED = '2026-09-29';

export const STATE_GUIDES: Playbook[] = [
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
}
];
