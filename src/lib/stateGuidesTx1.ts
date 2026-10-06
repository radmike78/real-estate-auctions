// Step-by-step guides for Texas, in the same shape as Nevada’s (see playbooks.ts) and the other states (see stateGuides.ts).
// Every rule cites the Texas statutes, the Texas Constitution or the Texas Rules of Civil Procedure.
// County details are labeled as examples to confirm locally. Examples are illustrative, not real properties or transactions.
//
// Statute text was read from the official Texas Constitution and Statutes site. The site is a single-page app;
// its chapter files are served from https://tcss.legis.texas.gov/resources/<code>/htm/<code>.<chapter>.htm.
// The source links below use the public statutes.capitol.texas.gov form, with a #section anchor.

import type { Playbook } from './playbooks';
import { TEAM } from './playbookTeam';

const REVIEWED = '2026-10-05';

const TXS = (code: string, ch: string, sec: string) =>
  `https://tcss.legis.texas.gov/resources/${code}/htm/${code}.${ch}.htm#${sec}`;
const TRCP = 'https://www.txcourts.gov/media/1463426/texas-rules-of-civil-procedure.pdf';

export const TX_GUIDES_1: Playbook[] = [
{
  key: "txtax",
  title: "Texas tax sales",
  short: "Tax sales",
  oneLine: "When property taxes go unpaid, the taxing units sue. After the court orders a sale, a sheriff or constable auctions the property on the first Tuesday of the month.",
  youGet: "A sheriff’s or constable’s deed to the interest the defendants owned. The owner can still buy it back: for two years if it was a homestead, land designated for agricultural use or a mineral interest, or 180 days otherwise. Check which in the judgment and the appraisal district record: vacant or rural land isn’t automatically one or the other.",
  plain: "The house, by a deed from the sheriff or constable. But the owner may buy it back for up to two years, so it isn’t fully yours yet.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "A sheriff or constable, under a court order of sale after a delinquent tax lawsuit (Tax Code 33.53, 34.01)."
    },
    {
      label: "When",
      value: "The first Tuesday of the month, between 10 a.m. and 4 p.m. If that Tuesday is January 1 or July 4, the sale moves to Wednesday. Online auctions may open earlier but must end at 4 p.m. that day (34.01(r-1), (r-2))."
    },
    {
      label: "What gets it on the list",
      value: "Taxes unpaid on February 1 are delinquent (31.02). A taxing unit may then sue to foreclose its lien at any time (33.41). The court must order the sale."
    },
    {
      label: "Minimum bid",
      value: "The lesser of the property’s value set in the judgment or the full judgment, including costs of the suit and sale (34.01(j), 33.50)."
    },
    {
      label: "Owner’s buy-back",
      value: "Homestead, land designated for agricultural use, or a mineral interest: two years after your deed is recorded, plus a premium of 25% in year one or 50% in year two (a percentage of what you paid: your bid, the deed recording fee, and taxes and costs you paid). Other property: 180 days, with a premium of no more than 25% (34.21)."
    },
    {
      label: "What you get",
      value: "A deed from the sheriff or constable. It gives you what the defendants owned, still subject to the owner’s buy-back right (34.01(n))."
    },
    {
      label: "Bidder paperwork",
      value: "In counties of 250,000 or more, and in smaller counties that have adopted the rule, you need a county statement that you owe no back taxes, or a bidder registration if the county uses one (34.015, 34.011)."
    },
    {
      label: "Payment",
      value: "Set by each county. No financing. Example: Harris County takes cash or certified funds right after the sale. Confirm with the officer running your sale."
    }
  ],
  steps: [
    {
      title: "Know how a property reaches the sale",
      detail: "Texas property taxes are delinquent if not paid before February 1 (Tax Code 31.02). Penalties start at 6% and reach 12% by July 1. Interest adds 1% a month (33.01). A taxing unit, like the county, city or school district, can then sue (33.41). The court sets the property’s market value in the judgment (33.50) and orders it sold (33.53)."
    },
    {
      title: "Watch for the notice and the sale list",
      detail: "The officer publishes the notice once a week for three weeks in a county newspaper. The first notice runs at least 20 days before the sale (Rule 647). The officer also sends notice to each defendant (34.01(c)). Many counties hire law firms to collect delinquent taxes. Example: Harris County says Linebarger Goggan Blair & Sampson and Perdue Brandon Fielder Collins & Mott post the properties for the taxing units they represent. In Bexar County, you get the tax sale list from Linebarger."
    },
    {
      title: "Get your bidder paperwork early",
      detail: "In counties of 250,000 or more, and in smaller counties that have adopted the rule, the officer can’t give you a deed unless you show a current county statement that you owe no back taxes. These statements expire after 90 days (34.015). Some counties use bidder registration instead (34.011). Examples: Harris County requires a bidder card, renewed every year. Travis County runs its sales online through RealAuction and wants registration and a $10 fee at least five business days before the sale. Dallas County runs its tax sales online through Real Auction. Confirm the rules in your county."
    },
    {
      title: "Research every property before you bid",
      detail: "Read the court judgment and the list of defendants. Pull the recorded documents and get a title report. Find the taxes that came due after the judgment (post-judgment taxes). Harris County says the buyer pays those (33.52(d)). Look at the property only from the street. Don’t contact the owner or anyone living there."
    },
    {
      title: "Bid at or above the minimum",
      detail: "The minimum is the lesser of the value in the judgment or the full amount owed with costs. Harris County says the officer announces it at the sale. If no one bids enough, the property goes to the taxing unit (struck off) (34.01(j))."
    },
    {
      title: "Pay right away, the way your county requires",
      detail: "Payment rules are local. Harris County takes cash or a cashier’s check right after the auction and issues the deed in 4 to 6 weeks. Dallas County takes wire transfers only for its online tax sales. A winning bidder who doesn’t pay can owe 20% of the property’s value plus costs, and the officer sells it again (Rules 652, 653)."
    },
    {
      title: "Record the deed and track your costs",
      detail: "The officer files the deed with the county clerk, or gives it to the taxing unit to file (34.01(m)). The owner’s buy-back clock starts on the day it is recorded. Keep receipts for insurance, required repairs, HOA dues and other allowed costs. The owner can ask in writing for a list of what you spent. You have 10 days to send it. Only costs on that list count toward the buy-back price (34.21(g), (i))."
    },
    {
      title: "Take possession through the court",
      detail: "The former owner has no right to live in or rent out the property during the buy-back period (34.21(h)). The court clerk can issue a writ of possession 20 days or more after your deed is recorded. The officer then posts a warning at least 10 days before acting (33.51). A residential tenant who pays on time gets at least 30 days’ written notice to vacate (Property Code 24.005(b)). Never change locks or remove belongings on your own."
    },
    {
      title: "If no one bid, ask about resales",
      detail: "A taxing unit that gets a property at the sale may resell it later. It can ask the sheriff or constable to hold a public resale, or sell it privately (34.05). A public resale can go for any amount. The owner’s buy-back right still applies. It runs from the day the taxing unit’s deed was recorded. Example: Harris County says struck-off properties often come back later with a lower minimum bid."
    }
  ],
  survives: {
    wipedOut: [
      "The tax liens included in the judgment (34.01(q))",
      "The defendants’ ownership, once the buy-back period ends without a redemption",
      "Most court challenges to the sale, after one year from recording, or two years for a homestead or land appraised (or eligible to be) as agricultural or open-space land (33.54)"
    ],
    mayStay: [
      "The owner’s right to buy it back: two years for a homestead, land designated for agricultural use or a mineral interest, 180 days for other property (34.21)",
      "Taxes that came due after the judgment. The sale clears only liens in the judgment, so the buyer pays them (34.01(q), 33.52(d)).",
      "Recorded deed restrictions and easements recorded before January 1 of the year the tax lien arose. Also an HOA lien under those restrictions, if the judgment didn’t wipe it out (34.01(n)).",
      "Liens of anyone who wasn’t named in the tax lawsuit. The deed passes only what the defendants owned (34.01(n)).*",
      "A federal tax lien, if it was recorded before the suit and the United States wasn’t named (26 USC 7425(a))",
      "Occupants, until you get a writ of possession or finish an eviction"
    ]
  },
  mistakes: [
    {
      mistake: "Fixing up the property during the buy-back period",
      prevent: "The owner can redeem. Spend only on what protects the property: insurance, repairs the code requires, HOA dues. Keep receipts. Only costs you itemize count toward the buy-back price (34.21(g), (i))."
    },
    {
      mistake: "Thinking you’re buying a tax lien certificate",
      prevent: "Texas sells the property, not the lien. Travis County says plainly that it doesn’t sell tax lien certificates. Your return comes from the property, or from the premium if the owner redeems."
    },
    {
      mistake: "Paying the owner for their buy-back right",
      prevent: "The law makes any transfer of the owner’s right of redemption void (34.21(l)). Don’t buy it, and don’t contact owners about it."
    },
    {
      mistake: "Forgetting taxes that came due after the judgment",
      prevent: "Ask the tax office for the post-judgment taxes before you bid. Add them to your price."
    },
    {
      mistake: "Showing up without bidder paperwork",
      prevent: "Get the county’s no-back-taxes statement or bidder registration ahead of time. Statements expire after 90 days (34.015)."
    },
    {
      mistake: "Counting on a sale that gets stopped",
      prevent: "An owner who is 65 or older, or disabled, can stop a sale of their homestead by delivering an affidavit by the fifth day before the sale (33.06). Owners can also pay the judgment before the sale (33.53(e)). Check the list the morning of the sale."
    }
  ],
  example: {
    title: "Illustrative example: a vacant lot in a fictional Texas county",
    story: "Avery, a made-up buyer, found a vacant lot on the county’s list for the first Tuesday sale. The judgment and costs came to $6,800, and the value in the judgment was $25,000. So the minimum bid was $6,800. Avery got the county’s no-back-taxes statement two weeks before. Avery also learned that $1,100 in taxes had come due after the judgment. Avery won at $12,000 and paid the officer that day. Before bidding, Avery checked the judgment and the appraisal district record, and a title attorney confirmed it: when the suit was filed, the lot wasn’t anyone’s homestead, had no agricultural-use designation and wasn’t a mineral interest. Only then did the 180-day period apply, counted from the deed’s recording. No one redeemed.",
    lesson: "Know your county’s paperwork and payment rules. Add post-judgment taxes to your price. Don’t spend on improvements until the buy-back period ends."
  },
  sources: [
    {
      label: "Texas Tax Code 31.02 (delinquency date)",
      url: TXS('TX', '31', '31.02')
    },
    {
      label: "Texas Tax Code 32.01 and 32.05 (tax lien and its priority)",
      url: TXS('TX', '32', '32.05')
    },
    {
      label: "Texas Tax Code 33.01 (penalties and interest)",
      url: TXS('TX', '33', '33.01')
    },
    {
      label: "Texas Tax Code 33.06 (deferral for homeowners 65 or older or disabled)",
      url: TXS('TX', '33', '33.06')
    },
    {
      label: "Texas Tax Code 33.41 (suit to collect delinquent tax)",
      url: TXS('TX', '33', '33.41')
    },
    {
      label: "Texas Tax Code 33.50 to 33.54 (adjudged value, writ of possession, order of sale, time limits)",
      url: TXS('TX', '33', '33.50')
    },
    {
      label: "Texas Tax Code 34.01 (tax sale: officer, date, minimum bid, deed)",
      url: TXS('TX', '34', '34.01')
    },
    {
      label: "Texas Tax Code 34.011 and 34.015 (bidder registration and no-back-taxes statement)",
      url: TXS('TX', '34', '34.015')
    },
    {
      label: "Texas Tax Code 34.02 to 34.04 (proceeds and excess proceeds)",
      url: TXS('TX', '34', '34.04')
    },
    {
      label: "Texas Tax Code 34.05 (resale by taxing unit)",
      url: TXS('TX', '34', '34.05')
    },
    {
      label: "Texas Tax Code 34.21 (right of redemption)",
      url: TXS('TX', '34', '34.21')
    },
    {
      label: "Texas Property Code 24.005 (notice to vacate)",
      url: TXS('PR', '24', '24.005')
    },
    {
      label: "Texas Rules of Civil Procedure 647, 652 and 653 (notice, failed payment, resale)",
      url: TRCP
    },
    {
      label: "26 USC 7425 (federal tax liens and sales)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "Texas Comptroller: property tax bills, delinquency, penalty and interest",
      url: "https://comptroller.texas.gov/taxes/property-tax/bills/index.php"
    },
    {
      label: "Harris County Tax Office: tax sales",
      url: "https://www.hctax.net/Property/TaxSales"
    },
    {
      label: "Travis County Tax Office: foreclosed properties",
      url: "https://tax-office.traviscountytx.gov/properties/foreclosed"
    },
    {
      label: "Travis County Tax Office: tax sale FAQ",
      url: "https://tax-office.traviscountytx.gov/properties/foreclosed/faq"
    },
    {
      label: "Dallas County Sheriff: Writ Enforcement Section (tax and sheriff’s sales)",
      url: "https://www.dallascounty.org/departments/sheriff/writ-enforcement-section/"
    },
    {
      label: "Bexar County Clerk: foreclosure sales and bidding",
      url: "https://www.bexar.org/2950/Real-PropertyLand-Records"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: REVIEWED,
  state: 'TX'
},
{
  key: "txforeclosure",
  title: "Texas trustee sales",
  short: "Trustee sales",
  oneLine: "Most Texas home loans use a deed of trust. That lets a trustee sell the home at a courthouse auction on the first Tuesday of the month, without a court case.",
  youGet: "A trustee’s deed, “as is” with no warranties except title. After a mortgage or deed-of-trust foreclosure, Texas law gives the owner no right to buy it back. The exception is a property tax loan (a transferred tax lien): if that's the lien being foreclosed, the owner or the servicer of an earlier mortgage can buy it back within 2 years for a home (180 days otherwise) by paying 125% of your price in the first year or 150% in the second, plus your costs (Tax Code 32.06(k)). A junior federal tax lien gives the United States 120 days to buy it back (26 USC 7425(d)). If the IRS lien was filed more than 30 days before the sale and the IRS didn’t get written notice at least 25 days before it, the lien isn’t cleared and stays on the title (26 USC 7425(b)).",
  plain: "The house as is. After a mortgage foreclosure there’s no buy-back period (a property tax loan foreclosure has one). You take it with any loans that were ahead of the one being foreclosed.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "The trustee or substitute trustee named in the notice of sale. The notice must give a name and street address (Property Code 51.0075(e))."
    },
    {
      label: "When",
      value: "The first Tuesday of the month, between 10 a.m. and 4 p.m. If that Tuesday is January 1 or July 4, the sale moves to Wednesday. It starts at the time in the notice or within three hours after (51.002(a), (a-1), (c))."
    },
    {
      label: "Where",
      value: "At the county courthouse, in the area the commissioners court designates. That area may be a nearby public place (51.002(a), (h))."
    },
    {
      label: "Notice of sale",
      value: "At least 21 days before: posted at the courthouse door, filed with the county clerk, and mailed to the borrower by certified mail. The county posts it on its website (51.002(b), (f-1))."
    },
    {
      label: "Before the notice (homes)",
      value: "For a home the borrower lives in, the servicer first mails a default notice. It gives at least 20 days to catch up (51.002(d))."
    },
    {
      label: "Payment",
      value: "Due right when your bid is accepted, unless the trustee agrees to a short delay. The trustee may set reasonable terms, announced before the day’s first sale (51.0075(a), (f))."
    },
    {
      label: "Can it be undone?",
      value: "For a home of 1 to 4 units or a condo, yes: within 15 days, for reasons the law lists. Then you get only your money back (51.016)."
    },
    {
      label: "Redemption",
      value: "None after a mortgage or deed-of-trust foreclosure. The exception is a property tax loan (a transferred tax lien): if that's the lien being foreclosed, the owner or the servicer of an earlier mortgage can buy it back within 2 years for a home (180 days otherwise) by paying 125% of your price in the first year or 150% in the second, plus your costs (Tax Code 32.06(k)). If a junior federal tax lien is on title, the United States may buy it back within 120 days (26 USC 7425(d)). If the IRS lien was filed more than 30 days before the sale and the IRS didn’t get written notice at least 25 days before it, the lien isn’t cleared and stays on the title (26 USC 7425(b))."
    }
  ],
  steps: [
    {
      title: "Learn the timeline",
      detail: "If the borrower lives in the home, the servicer mails a notice of default first. It gives at least 20 days to catch up (Property Code 51.002(d)). Then the notice of sale goes out at least 21 days before the sale date (51.002(b)). The sale itself is on the first Tuesday of a month."
    },
    {
      title: "Find sales through official notices",
      detail: "Notices are posted at the courthouse and filed with the county clerk. Each county also posts them online with the date, time and place (51.002(f-1)). Examples: Tarrant County says its notices are on its official records search, and the clerk throws out each month’s file the day after the sale. Bexar County has a foreclosure map on its clerk’s site."
    },
    {
      title: "Check for a home equity loan",
      detail: "A Texas home equity loan, reverse mortgage or property tax loan needs a court order before the trustee can sell. A property tax loan also gives the owner a buy-back right after the sale (Tax Code 32.06(k)). Lenders usually get it through a quick Rule 736 case (Rule 735.1). The order must be attached to the trustee’s deed (Rule 736.12). If the owner files a separate lawsuit by 5 p.m. on the Monday before the sale, the case stops. A sale held anyway is void. The trustee then must return your money within 10 business days (Rule 736.11)."
    },
    {
      title: "Research the property and the title",
      detail: "Order a title report. Find out which loan is being foreclosed and which liens are ahead of it. Property taxes come before almost everything else (Tax Code 32.05). Look at the home only from the street. Don’t contact the owner or anyone living there."
    },
    {
      title: "Bring the right funds",
      detail: "Payment is due right away unless the trustee agrees to a short delay (51.0075(f)). Each trustee sets its own terms and announces them before the day’s first sale (51.0075(a)). Example: Bexar County says its mortgage foreclosure sales are cash auctions. It takes only cash or certified funds, and no personal checks. Call the trustee on the notice before sale day."
    },
    {
      title: "Bid at the courthouse",
      detail: "The trustee runs a public auction to the highest bidder. You buy “as is.” The only promise you get is about title. The law says you aren’t a consumer for this purchase (51.009)."
    },
    {
      title: "Get your deed, and watch for a rescission",
      detail: "The trustee gives you a trustee’s deed. Record it right away. For 15 days, the lender or trustee can undo the sale for reasons the law lists. Two examples: the owner had caught up before the sale, or a bankruptcy stay was in effect. If that happens, you get back what you paid, within 5 days, and nothing more (51.016)."
    },
    {
      title: "Know what happens to the owner’s debt",
      detail: "If the sale brings less than the debt, the lender has two years to sue the borrower for the rest. A court can lower that amount if the home was worth more than the sale price (51.003). That is between the borrower and the lender. It doesn’t change your purchase."
    },
    {
      title: "Handle occupants through the court",
      detail: "Give a written notice to vacate before you file an eviction (forcible detainer) case. A former owner who stays usually gets at least three days.* A residential tenant who pays on time, whose lease came after the foreclosed loan, gets at least 30 days if you don’t keep the lease (Property Code 24.005(b)); a lease that came before the loan survives the sale. Federal law can require at least 90 days, or the rest of a genuine lease unless you’ll live there yourself, and Texas law makes you wait for it (24.005(c-1)). Hire an attorney. Never change locks or remove belongings on your own."
    }
  ],
  survives: {
    wipedOut: [
      "The deed of trust being foreclosed",
      "The owner’s rights after a mortgage foreclosure. (A property tax loan foreclosure has a buy-back period: Tax Code 32.06(k).)",
      "Liens recorded after the foreclosed deed of trust, in most cases*"
    ],
    mayStay: [
      "Older (senior) deeds of trust and liens recorded before the foreclosed loan",
      "Property tax liens, which attach every January 1 and come before almost everything else (Tax Code 32.01, 32.05)",
      "HOA or condo liens that rank ahead of the foreclosed loan",
      "Easements and other recorded encumbrances",
      "A federal tax lien’s 120-day buy-back right (26 USC 7425(d)), or the whole lien if it was filed more than 30 days before the sale and the IRS didn’t get 25 days’ notice (26 USC 7425(b))",
      "Tenants with a right to notice before they move"
    ]
  },
  mistakes: [
    {
      mistake: "Bidding on a junior loan without knowing it",
      prevent: "Get a title report. If the loan being foreclosed is a second loan, the first loan stays on the property. You take the home with that debt still on it."
    },
    {
      mistake: "Showing up without the right funds",
      prevent: "Payment is due when your bid is accepted. Call the trustee before the sale. Ask what funds they take and what terms they will announce."
    },
    {
      mistake: "Fixing up the home in the first 15 days",
      prevent: "The sale can be undone within 15 days, and you would get back only your bid (51.016). Wait out that window before you spend on repairs."
    },
    {
      mistake: "Missing the home equity rules",
      prevent: "A home equity sale needs a court order, attached to the deed. If the owner sues by 5 p.m. the Monday before, the sale is void (Rule 736.11, 736.12). Ask the trustee about the Rule 736 order."
    },
    {
      mistake: "Forcing occupants out",
      prevent: "Give the right notice to vacate. Then use an eviction case in court, with an attorney (Property Code 24.005)."
    },
    {
      mistake: "Getting involved in leftover money",
      prevent: "The trustee pays out the sale money as the law requires (51.0075(f)). That isn’t the buyer’s business. Don’t contact former owners about it."
    }
  ],
  example: {
    title: "Illustrative example: a sale undone after 10 days",
    story: "Jamie, a made-up investor, read a notice of substitute trustee’s sale for a house. Jamie’s title report showed the foreclosing loan was the first deed of trust. On the first Tuesday, Jamie won at $185,000 and paid with cashier’s checks. Ten days later, the trustee sent a notice of rescission. The owner had paid what was owed before the sale. Jamie got the $185,000 back, but no interest and no profit.",
    lesson: "A Texas trustee sale can be undone for 15 days. Hold off on repairs and new contracts until that window passes."
  },
  sources: [
    {
      label: "Texas Property Code 51.002 (sale date, place, notices, 20-day cure notice)",
      url: TXS('PR', '51', '51.002')
    },
    {
      label: "Texas Property Code 51.003 (deficiency after trustee sale)",
      url: TXS('PR', '51', '51.003')
    },
    {
      label: "Texas Property Code 51.0075 (trustee’s authority, payment)",
      url: TXS('PR', '51', '51.0075')
    },
    {
      label: "Texas Property Code 51.009 (sold as is)",
      url: TXS('PR', '51', '51.009')
    },
    {
      label: "Texas Property Code 51.016 (rescission within 15 days)",
      url: TXS('PR', '51', '51.016')
    },
    {
      label: "Texas Property Code 24.005 (notice to vacate)",
      url: TXS('PR', '24', '24.005')
    },
    {
      label: "Texas Tax Code 32.01 and 32.05 (property tax lien and priority)",
      url: TXS('TX', '32', '32.05')
    },
    {
      label: "Texas Rules of Civil Procedure 735 and 736 (court order for home equity foreclosures)",
      url: TRCP
    },
    {
      label: "26 USC 7425 (federal tax lien, 120-day redemption)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "Tarrant County Clerk: foreclosure notices",
      url: "https://www.tarrantcountytx.gov/en/county-clerk/real-estate-records/foreclosures.html"
    },
    {
      label: "Bexar County Clerk: foreclosure sales and bidding",
      url: "https://www.bexar.org/2950/Real-PropertyLand-Records"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: REVIEWED,
  state: 'TX'
},
{
  key: "txsheriff",
  title: "Texas sheriff and constable sales",
  short: "Sheriff sales",
  oneLine: "When a court judgment goes unpaid, a sheriff or constable can take the debtor’s property and auction it. A court foreclosure ends the same way. A homestead is protected from most of these sales.",
  youGet: "A deed from the sheriff or constable to whatever the defendant owned in the property (Civ. Prac. & Rem. Code 34.045). Older liens stay on it.",
  plain: "Whatever the debtor owned in the property, with any older loans still on it.",
  forSale: true,
  glance: [
    {
      label: "Who runs it",
      value: "A sheriff or constable, named in the writ of execution or order of sale (Rule 629)."
    },
    {
      label: "Why it happens",
      value: "A writ of execution on an unpaid money judgment, or an order of sale after a court foreclosure of a mortgage or other lien (Rule 309)."
    },
    {
      label: "Earliest",
      value: "Usually 30 days after the judgment is signed, if there is no appeal bond (Rule 627)."
    },
    {
      label: "When",
      value: "The first Tuesday of the month, between 10 a.m. and 4 p.m. If that Tuesday is January 1 or July 4, the sale moves to Wednesday (Rule 646a, Civ. Prac. & Rem. Code 34.041(c))."
    },
    {
      label: "Notice",
      value: "Published once a week for three weeks in a county newspaper, the first at least 20 days before the sale. The defendant also gets written notice (Rule 647)."
    },
    {
      label: "Homestead",
      value: "Protected from forced sale for most debts. The exceptions include the purchase money, property taxes and certain home loans (Tex. Const. art. XVI, sec. 50; Property Code 41.001)."
    },
    {
      label: "Bidder paperwork",
      value: "In counties of 250,000 or more, and in smaller counties that have adopted the rule, you need a county no-back-taxes statement or bidder registration to get the deed (Civil Practice and Remedies Code 34.0445)."
    },
    {
      label: "Redemption",
      value: "None. Texas execution law has no buy-back period. If you win and don’t pay, you can owe 20% of the property’s value plus costs (Rule 652)."
    }
  ],
  steps: [
    {
      title: "Understand where the sale comes from",
      detail: "A creditor wins a money judgment and gets a writ of execution. Or a lender wins a court foreclosure, and the judgment orders the sheriff or constable to sell the property “as under execution” (Rule 309). The officer levies on (formally takes) the property, then sells it at auction (Rule 637)."
    },
    {
      title: "Find the notice",
      detail: "The officer publishes the notice once a week for three weeks in a county newspaper. It gives the authority for the sale, the time and place, and a description of the property (Rule 647). Example: Dallas County holds its live writ sales at the Records Building on the first Tuesday. It runs its tax sales separately, online. Ask your sheriff’s or constable’s civil office how it lists sales."
    },
    {
      title: "Check the homestead question",
      detail: "A home the debtor lives in is protected from forced sale for most debts (Tex. Const. art. XVI, sec. 50). The exceptions include the loan used to buy it, property taxes, and certain home loans (Property Code 41.001). A homestead can be up to 10 acres in town. In the country, it can be up to 200 acres for a family or 100 acres for a single adult (41.002). Land beyond that may be sold once the homestead is marked out (41.021 to 41.024). Have an attorney check this before you bid."
    },
    {
      title: "Research the case and the title",
      detail: "Read the judgment and the writ. The sale passes only what the defendant owned (Civ. Prac. & Rem. Code 34.045). Get a title report for older mortgages, tax liens and HOA liens. A judgment can go dormant if no writ issues within 10 years (34.001). Look at the property only from the street."
    },
    {
      title: "Get your paperwork and funds ready",
      detail: "In counties of 250,000 or more, and in smaller counties that have adopted the rule, bring a current county statement that you owe no back taxes, or a bidder registration (34.0445). Each office sets payment terms. Example: Dallas County wants cash or a cashier’s check made out to the Sheriff’s Office for its live writ sales. It also wants a current bidder certificate and adds a $30 deed fee. If you can’t pay right away, it resells the property on the spot."
    },
    {
      title: "Bid at the sale",
      detail: "Sales are public auctions to the highest bidder. Town lots are offered one at a time unless the buildings make that impossible (34.042). The officer and the officer’s deputies can’t buy (34.048). Your bid is final.*"
    },
    {
      title: "Pay and get your deed",
      detail: "Once you pay, the officer signs a deed to all the right, title and interest the defendant had (34.045). If you don’t pay, you can owe 20% of the property’s value plus costs. The officer sells it again (Rules 652, 653). Record your deed right away."
    },
    {
      title: "Leave the leftover money alone",
      detail: "If the sale brings more than the judgment, the officer pays the extra to the defendant (34.047(c)). That isn’t the buyer’s business. Don’t contact the former owner about it."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone stays, give written notice to vacate and file an eviction (forcible detainer) case with an attorney (Property Code 24.005). If the sale foreclosed a mortgage on a rented home, tenants may have federal rights to more time (24.005(c-1)). Never change locks or remove belongings on your own."
    }
  ],
  survives: {
    wipedOut: [
      "The defendant’s ownership interest (34.045)",
      "The defendant’s chance to stop the sale by paying. Texas has no buy-back period after an execution sale."
    ],
    mayStay: [
      "Older mortgages and liens. The sale transfers only the defendant’s interest.",
      "Property tax liens, which attach every January 1 (Tax Code 32.01)",
      "HOA liens and recorded deed restrictions",
      "Easements and other recorded encumbrances",
      "A homestead claim, if the property was the debtor’s protected homestead",
      "A federal tax lien, if it was recorded before the suit and the United States wasn’t named (26 USC 7425(a))"
    ]
  },
  mistakes: [
    {
      mistake: "Bidding on a debtor’s homestead",
      prevent: "A homestead is protected from most forced sales (Tex. Const. art. XVI, sec. 50). Ask an attorney whether the property is a homestead before you bid."
    },
    {
      mistake: "Assuming the sale clears older liens",
      prevent: "You get only what the defendant owned (34.045). Check the title for senior mortgages, taxes and HOA liens."
    },
    {
      mistake: "Showing up without funds or paperwork",
      prevent: "Call the sheriff’s or constable’s civil office. Bring the payment it takes and your bidder statement. A bidder who doesn’t pay can owe 20% of the value (Rule 652)."
    },
    {
      mistake: "Mixing up sale types",
      prevent: "Writ sales, tax sales and tax resales can all happen on the same first Tuesday, with different rules. Read the notice to see which one you are bidding on."
    },
    {
      mistake: "Forcing occupants out",
      prevent: "Use the court’s eviction process with an attorney. Give the notice to vacate the law requires (Property Code 24.005)."
    }
  ],
  example: {
    title: "Illustrative example: a rental lot on a writ sale",
    story: "Taylor, a made-up buyer, saw a writ sale notice for a small rental house. The owner didn’t live there. Taylor’s title report showed a $90,000 first mortgage, recorded years before the judgment. The house was worth about $160,000. Taylor bid $40,000 and won. Taylor paid by cashier’s check that day and received a sheriff’s deed. The mortgage stayed on the house, so Taylor’s real cost was about $130,000 plus taxes and repairs.",
    lesson: "A sheriff’s sale passes only the debtor’s interest. Add every older lien to your bid before you raise your hand."
  },
  sources: [
    {
      label: "Texas Rules of Civil Procedure 309, 627, 629, 637, 646a, 647, 652 and 653 (execution and sale)",
      url: TRCP
    },
    {
      label: "Texas Civil Practice and Remedies Code 34.001 (dormant judgments)",
      url: TXS('CP', '34', '34.001')
    },
    {
      label: "Texas Civil Practice and Remedies Code 34.041 to 34.048 (execution sales of real property)",
      url: TXS('CP', '34', '34.041')
    },
    {
      label: "Texas Civil Practice and Remedies Code 34.0445 (who may buy)",
      url: TXS('CP', '34', '34.0445')
    },
    {
      label: "Texas Constitution art. XVI, sec. 50 (homestead protection)",
      url: TXS('CN', '16', '16.50')
    },
    {
      label: "Texas Property Code 41.001 and 41.002 (homestead exemption and size)",
      url: TXS('PR', '41', '41.001')
    },
    {
      label: "Texas Property Code 41.021 to 41.024 (designating a homestead after execution)",
      url: TXS('PR', '41', '41.021')
    },
    {
      label: "Texas Property Code 24.005 (notice to vacate)",
      url: TXS('PR', '24', '24.005')
    },
    {
      label: "Texas Tax Code 32.01 (property tax lien)",
      url: TXS('TX', '32', '32.01')
    },
    {
      label: "26 USC 7425 (federal tax liens and sales)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "Dallas County Sheriff: Writ Enforcement Section",
      url: "https://www.dallascounty.org/departments/sheriff/writ-enforcement-section/"
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: REVIEWED,
  state: 'TX'
},
{
  key: "txhoa",
  title: "Texas HOA foreclosures",
  short: "HOA foreclosures",
  oneLine: "A Texas association can sell a home for unpaid dues, under one of two laws. Read the recorded declaration first: a subdivision HOA (Property Code 209) needs a court order, and the owner can buy the home back until 180 days after the HOA mails notice of the sale. A condominium association (Property Code 82) can sell without a court, and the owner has 90 days after the sale.",
  youGet: "The owner’s interest, subject to a buy-back right: for a subdivision HOA, until 180 days after the post-sale notice is mailed (owner and lienholders); for a condominium, until 90 days after the sale (the owner). Either way, you can’t sell it to anyone but the redeeming owner until that ends. Any mortgage that ranks ahead of the association’s lien stays on the home.",
  plain: "The owner’s interest, usually with the mortgage still on it. The owner can buy it back: 180 days after the HOA’s notice for a subdivision, 90 days after the sale for a condo. You can’t resell until then.",
  forSale: true,
  glance: [
    {
      label: "Which law: check first",
      value: "Read the recorded declaration, with a title company or attorney. A subdivision HOA follows Property Code chapter 209; a condominium association follows chapter 82 (209.003, 82.113). A townhome can be either: don’t judge by how the building looks. The court order, the buy-back clock and what a redemption repays all differ."
    },
    {
      label: "Court order first (subdivision)",
      value: "A subdivision HOA must get a quick court order (Rule 736) or win a court foreclosure before any sale. The owner can waive this in writing, but only at the time of foreclosure (209.0092). A condominium association can sell without a court, under the power of sale (82.113(d), (e))."
    },
    {
      label: "Not for fines",
      value: "An HOA can’t foreclose if the debt is only fines, or attorney’s fees tied only to fines (209.009)."
    },
    {
      label: "Lender gets a chance",
      value: "Before going to court, the HOA must notify lenders whose liens are inferior to the HOA’s lien. They have until the 61st day after the HOA mails that notice (60 days) to pay the debt (209.0091)."
    },
    {
      label: "Notice after the sale (subdivision)",
      value: "Within 30 days, a subdivision HOA mails the owner and lienholders a notice of their right to buy it back (209.010). The buy-back clock starts from that mailing, not the sale day."
    },
    {
      label: "Redemption",
      value: "Subdivision: the owner, or a lienholder, may buy it back within 180 days after the notice is mailed; a lienholder must wait until day 90 (209.011(b)). Condominium: the owner may buy it back within 90 days after the sale (82.113(g))."
    },
    {
      label: "During redemption",
      value: "Under both laws, you can’t sell it to anyone but the redeeming owner (209.011(c), 82.113(g)). For a subdivision, any lease you sign is subject to the buy-back (209.011(k))."
    },
    {
      label: "Priority",
      value: "Property taxes come first (Tax Code 32.05). For an HOA, the declaration sets whether a mortgage ranks ahead.* For a condo, a first deed of trust recorded before the dues went unpaid ranks ahead (82.113(b))."
    }
  ],
  steps: [
    {
      title: "Learn which law applies",
      detail: "Get the recorded declaration and have a title company or attorney confirm whether the association is a subdivision HOA (chapter 209) or a condominium association (chapter 82). Every step below depends on it: the court order, when the buy-back clock starts, how long it runs and what a redemption repays."
    },
    {
      title: "Learn which kind of sale it is",
      detail: "Condominium: the association may sell without a court, usually as a trustee sale (82.113(d), (e); 51.002). Subdivision HOA: with a Rule 736 order, the sale follows the usual trustee sale rules: first Tuesday, with 21 days’ notice (Rule 736.9, Property Code 51.002). With a court judgment, a sheriff or constable sells it (Rules 309, 646a). The same buy-back and notice rules apply to both (209.010(d), 209.011(p))."
    },
    {
      title: "Find every loan ahead of the association",
      detail: "Order a title report. Property tax liens come before the HOA lien (Tax Code 32.05). Chapter 209 doesn’t rank the HOA lien against a mortgage. The recorded declaration does.* Have a title company or attorney read it. If a mortgage stays and isn’t paid, its lender can still foreclose and wipe you out."
    },
    {
      title: "Check that the sale was set up correctly",
      detail: "Ask the trustee or the HOA’s attorney for the court order. After a Rule 736 sale, the order must be attached to the trustee’s deed (Rule 736.12). The debt can’t be only fines (209.009). Lenders whose liens are inferior to the HOA’s lien must have had 60 days, until the 61st day after the notice, to pay (209.0091). Have an attorney or title company review the file before you bid."
    },
    {
      title: "Know the last-minute risk",
      detail: "If the owner files a separate lawsuit by 5 p.m. on the Monday before the sale, a Rule 736 case is stopped. A sale held anyway is void. The trustee must return your money within 10 business days (Rule 736.11)."
    },
    {
      title: "Set your maximum bid",
      detail: "Add up any surviving mortgage, unpaid property taxes, future dues, repairs and holding costs. Remember your money is tied up for the whole buy-back period: about 7 months for a subdivision (180 days after a notice mailed up to 30 days after the sale), 90 days for a condo. Use the max bid calculator."
    },
    {
      title: "Bid and pay as directed",
      detail: "At a trustee sale, payment is due when your bid is accepted unless the trustee agrees to a short delay (51.0075(f)). At a sheriff’s or constable’s sale, ask the civil office how to pay. Look at the home only from the street. Don’t contact the owner or anyone living there."
    },
    {
      title: "Wait out the buy-back period",
      detail: "Under both laws you can’t sell the home during this time, except back to the owner (209.011(c), 82.113(g)). Condominium: for 90 days after the sale; if the owner redeems, you get your bid plus 6% a year, assessments you paid, and reasonable costs as owner, including maintenance and leasing (82.113(g)). Subdivision: for 180 days after the notice; if the owner redeems, you get back four things: your price, the recording fee, HOA dues you paid after the sale, and property taxes you paid after the sale. You also get court costs from an eviction case (209.011(e)(2)). Any rent you collected is subtracted (209.011(i)). Repairs aren’t on that list, so keep spending low."
    },
    {
      title: "Close out the buy-back period",
      detail: "Subdivision: if the owner or a lienholder sends a written request to redeem by the last day, the deadline stretches. It runs until 10 days after you tell them the amount (209.011(m)). When the period ends with no redemption, record an affidavit saying so (209.011(n))."
    },
    {
      title: "Take possession through the court",
      detail: "If the home is occupied, you must file an eviction (forcible detainer) case to get possession (209.011(a)). Give the notice to vacate the law requires first (24.005). Never change locks or remove belongings on your own."
    }
  ],
  survives: {
    wipedOut: [
      "The association’s lien being foreclosed",
      "The owner’s interest, once the buy-back period ends with no redemption",
      "Liens that rank below the association’s lien, if the sale was valid"
    ],
    mayStay: [
      "Property tax liens, which come before the HOA lien (Tax Code 32.05)",
      "Any mortgage the declaration ranks ahead of the HOA lien.* For condos, a first deed of trust recorded before the dues went unpaid (82.113(b)).",
      "The buy-back right: until 180 days after the notice for a subdivision (209.011), 90 days after the sale for a condo (82.113(g))",
      "Easements, deed restrictions and other recorded encumbrances",
      "Occupants, until an eviction case is finished (209.011(a))"
    ]
  },
  mistakes: [
    {
      mistake: "Assuming an HOA sale wipes out the mortgage",
      prevent: "Read the declaration with a title company or attorney. Price the home as if any mortgage ranked ahead of the HOA lien stays."
    },
    {
      mistake: "Fixing up during the buy-back period",
      prevent: "If the owner redeems, repairs aren’t on the list of what you get back (209.011(e)(2)). Spend only to protect the property."
    },
    {
      mistake: "Trying to flip the home right away",
      prevent: "You can’t transfer it to anyone but the redeeming owner until the buy-back period ends: 180 days after the notice for a subdivision, 90 days after the sale for a condo (209.011(c), 82.113(g)). Plan to hold it."
    },
    {
      mistake: "Ignoring how the sale was started",
      prevent: "A sale without the court order, or one held during a Rule 736 stay, can be void. Have an attorney review the file (209.0092, Rule 736.11)."
    },
    {
      mistake: "Using condo rules for an HOA, or HOA rules for a condo",
      prevent: "Read the recorded declaration first. Condos follow chapter 82: sales without a court, and a 90-day buy-back counted from the sale (82.113(d), (e), (g)). Subdivision HOAs follow chapter 209: a court order, and 180 days counted from the mailed notice. Both bar reselling until the buy-back period ends."
    }
  ],
  example: {
    title: "Illustrative example: the $5,000 townhome",
    story: "Morgan, a made-up investor, saw a notice of sale for a townhome in a fictional Texas HOA. The association was owed about $5,000. Morgan’s title report showed a $210,000 first deed of trust. The declaration showed a subdivision under chapter 209, not a condominium, and ranked the HOA lien behind the loan. The home was worth about $270,000. Morgan also learned the owner could buy it back for 180 days. And Morgan couldn’t resell during that time.",
    lesson: "The first mortgage would survive. So the real cost was about $215,000 plus taxes, dues and about 7 months of holding costs, with a buy-back risk on top. Morgan passed. In Texas, price an HOA sale with the mortgage and the 180 days in mind."
  },
  sources: [
    {
      label: "Texas Property Code 209.003 (which associations chapter 209 covers)",
      url: TXS('PR', '209', '209.003')
    },
    {
      label: "Texas Property Code 209.009 (no foreclosure for fines only)",
      url: TXS('PR', '209', '209.009')
    },
    {
      label: "Texas Property Code 209.0091 (61-day notice to lienholders)",
      url: TXS('PR', '209', '209.0091')
    },
    {
      label: "Texas Property Code 209.0092 (court order required)",
      url: TXS('PR', '209', '209.0092')
    },
    {
      label: "Texas Property Code 209.0094 (notices before filing an assessment lien)",
      url: TXS('PR', '209', '209.0094')
    },
    {
      label: "Texas Property Code 209.010 (notice after foreclosure sale)",
      url: TXS('PR', '209', '209.010')
    },
    {
      label: "Texas Property Code 209.011 (180-day right of redemption)",
      url: TXS('PR', '209', '209.011')
    },
    {
      label: "Texas Property Code 82.113 (condo association lien, priority, 90-day redemption)",
      url: TXS('PR', '82', '82.113')
    },
    {
      label: "Texas Property Code 51.002 and 51.0075 (trustee sale rules)",
      url: TXS('PR', '51', '51.002')
    },
    {
      label: "Texas Property Code 24.005 (notice to vacate)",
      url: TXS('PR', '24', '24.005')
    },
    {
      label: "Texas Tax Code 32.05 (tax lien priority over HOA liens)",
      url: TXS('TX', '32', '32.05')
    },
    {
      label: "Texas Rules of Civil Procedure 309, 646a, 735 and 736 (court foreclosure and expedited order)",
      url: TRCP
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.lender, TEAM.insurance, TEAM.eviction, TEAM.contractor],
  lastReviewed: REVIEWED,
  state: 'TX'
}
];

/*
 * Facts NOT verified from a primary source (confirm before publishing):
 *
 * 1. Junior liens: that a Texas trustee sale cuts off liens recorded after the foreclosed deed of trust
 *    "in most cases" (txforeclosure). Chapter 51 does not say this; it comes from case law and title practice.
 * 2. Liens of people not named in the tax suit "may stay" (txtax). This is an inference from Tax Code 34.01(n)
 *    (the deed passes only "the interest owned by the defendant"); the detailed rule comes from case law.
 * 3. "A former owner who stays usually gets at least three days" (txforeclosure). 24.005(b) gives three days to a
 *    tenant at will or by sufferance; treating the former owner as a tenant at sufferance depends on the deed of
 *    trust's wording, which was not checked.
 * 4. HOA lien vs. mortgage priority: chapter 209 is silent; I wrote that the recorded declaration sets it. That
 *    the declaration controls (and how homestead law interacts with HOA liens) comes from case law, not verified.
 * 5. Federal tenant protections after foreclosure (Protecting Tenants at Foreclosure Act). Only referenced through
 *    Property Code 24.005(c-1), which acknowledges federal notice rules; the federal act itself was not fetched.
 * 6. "Your bid is final" at an execution sale (txsheriff). Rule 652 penalizes a bidder who fails to pay, and Dallas
 *    County says "All sales are final", but no statute says bids are irrevocable in those words.
 * 7. Texas Comptroller pages: no Comptroller page on tax foreclosure sales or redemption was found. Only the
 *    property tax bills page (delinquency date, penalty and interest) is cited.
 * 8. Dallas County "Written Statement" requirement for tax sales and its "2 business days before" deadline:
 *    taxoffice.dallascounty.org returned HTTP 403 (bot protection, not bypassed), so it is not used. Dallas County's
 *    sheriff page says only that live writ sales need "a current bidder certificate".
 * 9. Which law firm handles Dallas, Travis and Tarrant tax sales: not named on those counties' official pages, so
 *    not stated. Verified only for Harris County (hctax.net names Linebarger Goggan Blair & Sampson and Perdue Brandon
 *    Fielder Collins & Mott as posting sale lists) and Bexar County (bexar.org: tax sale registration and lists
 *    through Linebarger Goggan Blair & Sampson). McCreary Veselka Bragg & Allen was not found on any county page checked.
 * 10. Travis County: the official FAQ says sales run on RealAuction, with a Constable's Deed and a $10 registration fee
 *    at least five business days before the sale. The "upcoming sales" page returned 404, so the online sale time was
 *    not verified.
 * 11. Tarrant County: the County Clerk page says Constable Precinct 3 personnel conduct tax sales. That detail was not
 *    used in the guides, and the firm handling Tarrant tax suits was not verified.
 * 12. Title insurance availability for Texas tax deeds (when insurers will cover them) was not verified; the guide
 *    only says to get a title report.
 * 13. Statute links use the statutes.capitol.texas.gov "#section" anchor form. The pages are a JavaScript app; the
 *    text was read from the site's file server (tcss.legis.texas.gov/resources/...). Anchors should be spot-checked
 *    in a browser.
 * 14. The TRCP PDF (txcourts.gov/media/1463426) was read as published on 2026-10-05; its amendment date was not
 *    checked against the Supreme Court of Texas's latest rule orders.
 */
