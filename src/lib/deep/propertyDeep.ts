// In-depth content for each property type page (#/learn/types/<slug>): detail and real stories, from sources we read (researched 2026-10-03).
// Private people are described, never named.

import type { TopicDeep } from './types';
import type { PropertyKey } from './propertyTopics';

export const PROPERTY_DEEP: Partial<Record<PropertyKey, TopicDeep>> = {
  singleFamily: {
    overview: [
      "A single-family rental is one house on its own lot. You can rent it to one household. Or you can buy it, fix it and resell it (a “flip”). It is the easiest rental to understand and to get a loan for. Tenants often stay longer than in apartments. But all the income comes from one tenant. If that tenant stops paying or moves out, or the house sits empty, your income drops to zero. The mortgage, taxes, insurance and repairs keep coming.",
      "Flipping is a short, high-stakes bet. You bet on the price you pay, the repair budget, and the market while you hold the house. In 2021 and early 2022, Phoenix and Las Vegas were among the hottest markets for investors. Then mortgage rates jumped in 2022. Even the big buyers that set prices by computer (Zillow, Opendoor) lost money on many homes. Local flippers who bought distressed homes cheaply did better.",
      "You also compete with large buyers who have lots of money. In late 2021, investors bought about a quarter of U.S. single-family homes sold. Phoenix and Las Vegas were among the hot spots. Cash offers often win. Small investors do best when they buy below market, for example from banks, government agencies or public auctions. They also plan their budget with care and can hold the house for years if the market turns."
    ],
    bestFor: [
      "People with steady income and cash reserves who can pay the mortgage for several months with no rent coming in.",
      "Hands-on owners (or those who budget for a manager) who can handle repairs, tenant screening and state landlord-tenant rules.",
      "Long-term holders who can wait out a down market instead of being forced to sell.",
      "Flippers with real repair experience and reliable contractors. They must be willing to walk away from deals where the numbers don’t work.",
      "Buyers who can act fast with cash or a pre-approved loan when a motivated seller (estate, bank, corporate owner) needs to sell."
    ],
    notFor: [
      "Anyone who needs the rent to pay their own bills. One non-paying tenant can wipe out a year of profit.",
      "First-time flippers counting on prices to keep rising. When rates rose in 2022-2023, flip profits fell to the lowest return since 2007.",
      "Investors who cannot visit or check on the property. Empty homes attract squatters and damage.",
      "People who are uncomfortable with eviction, court deadlines, or state rules on deposits and fees."
    ],
    costs: [
      "Mortgage, property tax and insurance every month, rented or not.",
      "Vacancy and non-payment. During the pandemic, as many as 58% of small landlords (under four units) had tenants behind on rent (National Association of Realtors, via AP).",
      "Repairs and cleaning between tenants. One Las Vegas owner spent $2,000 just to clean an empty house for sale after squatters. Then the owner faced the bill again.",
      "Flip holding costs (loan interest, utilities, taxes) and selling costs. In 2023 the typical flip sold for $66,000 more than it was bought for, and the return fell from 35.7% (2021) to the lowest since 2007 (ATTOM via FOX 11). That ‘gross profit’ is before repair, holding and selling costs, so the real profit is much smaller and can be close to zero.",
      "Property management (often a percentage of rent) if you don’t manage it yourself.",
      "Legal rules: fees and deposit deductions must be disclosed and fair. The largest single-family landlord agreed to pay $48 million (without admitting wrongdoing). It settled FTC claims over hidden fees and deposit practices."
    ],
    money: [
      "Owner-occupied loans (FHA, VA, conventional) have the lowest down payments, but you must really live in the home. FHA expects you to move in within 60 days and stay at least a year, and its 3.5% minimum needs a credit score of 580 or more (500–579 needs 10% down). Investment-property loans usually need larger down payments and higher rates.",
      "Cash buyers often win in competitive markets. Investors ‘chase the same affordable properties that first-time buyers dependent on mortgages are also competing for’ (Bloomberg, 2022).",
      "Flips are often paid for with short-term, higher-cost loans. Every extra month you hold the house eats into profit. So the exit plan (sell or rent) must work at today’s rates."
    ],
    checklist: [
      "Run the numbers with a cautious rent estimate. Include vacancy, repairs, taxes, insurance and management.",
      "For a flip, set your top price from the realistic resale value. Subtract repairs, holding and selling costs, and a profit cushion. Assume prices could fall.",
      "Get a professional inspection and repair bids before you commit.",
      "Check local rent levels, how long homes sit on the market, and recent price cuts in the neighborhood.",
      "Learn your state’s landlord-tenant rules (notices, deposits, evictions) for the county where the house is.",
      "Plan how you will lock up and check on an empty house (locks, visits, neighbors).",
      "Keep cash reserves of several months of all costs."
    ],
    facts: [
      {
        text: "U.S. flips fell 29% in 2023 to 308,922.",
        source: {
          label: "FOX 11 Los Angeles: House flipping down nearly 30% as profits drop, data reveals (2024, citing ATTOM)",
          url: "https://www.foxla.com/news/house-flipping-down-profits-drop-real-estate"
        }
      },
      {
        text: "Typical gross flip profit fell to $66,000 in 2023. That is the gap between the buy and sale prices, before repair and holding costs.",
        source: {
          label: "FOX 11 Los Angeles: House flipping down nearly 30% as profits drop, data reveals (2024, citing ATTOM)",
          url: "https://www.foxla.com/news/house-flipping-down-profits-drop-real-estate"
        }
      },
      {
        text: "Flip ROI in 2023 was the lowest since 2007.",
        source: {
          label: "FOX 11 Los Angeles: House flipping down nearly 30% as profits drop, data reveals (2024, citing ATTOM)",
          url: "https://www.foxla.com/news/house-flipping-down-profits-drop-real-estate"
        }
      },
      {
        text: "Salt Lake City had among the worst flip profit margins in 2023. Phoenix, Las Vegas, Sacramento and Tucson saw big drops in flipping.",
        source: {
          label: "FOX 11 Los Angeles: House flipping down nearly 30% as profits drop, data reveals (2024, citing ATTOM)",
          url: "https://www.foxla.com/news/house-flipping-down-profits-drop-real-estate"
        }
      },
      {
        text: "Invitation Homes, the largest single-family landlord, agreed to pay $48 million to settle FTC claims. It had about 9,200 rentals in Phoenix.",
        source: {
          label: "AZFamily (KTVK/KPHO Phoenix): FTC reaches $48M settlement with corporate landlord over undisclosed fees, security deposits (Sep 24, 2024)",
          url: "https://www.azfamily.com/2024/09/24/ftc-reaches-48m-settlement-with-leasing-company-practices-that-allegedly-harmed-renters/"
        }
      },
      {
        text: "Small landlords (fewer than four units) were hit hardest by unpaid rent during the pandemic.",
        source: {
          label: "Associated Press (via Times-Republican): Landlords look for an exit amid federal eviction moratorium (Aug 2021)",
          url: "https://www.timesrepublican.com/news/money-markets/2021/08/landlords-look-for-an-exit-amid-federal-eviction-moratorium/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A self-taught house flipper in Phoenix, Arizona, who started out as an airport janitor",
        year: "2023",
        title: "Buying cheap made the flips work",
        happened: "An immigrant began flipping homes in Phoenix. He estimated he made about $200,000 buying, fixing and reselling homes during the 2020-2022 boom. His method was to buy low from motivated sellers with quick cash offers. Then he did much of the repair work himself. When the market cooled, a later flip still came out ahead, but by only about $2,000 after costs. He planned to shift toward renting homes out.",
        lesson: "Your profit is mostly set by the price you pay, and it shrinks fast when the market turns. This is one person’s result during a boom, not a typical one.",
        source: {
          label: "Bloomberg (via WealthManagement.com): Wall Street Is Losing Out to Amateur Buyers in the Housing Slump (Jan 30, 2023)",
          url: "https://www.wealthmanagement.com/estate-planning/wall-street-is-losing-out-to-amateur-buyers-in-the-housing-slump"
        }
      },
      {
        tone: "good",
        who: "A young first-time-buyer couple in Glendale, Arizona",
        year: "2022",
        title: "Patient buyers got a deal from a forced seller",
        happened: "The couple had $20,000 saved. They found a two-bedroom house that Opendoor, a big corporate home flipper, had cut in price seven times, to $346,000. That was below what Opendoor paid. Their lender approved only $340,000, so they offered that. Opendoor accepted and also gave them an $8,000 credit toward closing costs.",
        lesson: "When a big owner needs to unload homes, buyers with a loan lined up can bargain hard.",
        source: {
          label: "Bloomberg (via WealthManagement.com): Wall Street Is Losing Out to Amateur Buyers in the Housing Slump (Jan 30, 2023)",
          url: "https://www.wealthmanagement.com/estate-planning/wall-street-is-losing-out-to-amateur-buyers-in-the-housing-slump"
        }
      },
      {
        tone: "caution",
        who: "Opendoor, a publicly traded company that bought and resold homes using pricing algorithms, in Phoenix, Arizona",
        year: "2022",
        title: "A computer-priced flipper lost money on most Phoenix sales",
        happened: "Opendoor kept buying Phoenix homes at high prices as mortgage rates rose in 2022. In the fourth quarter it lost money on 89% of the Phoenix homes it sold. The average loss was about $58,000 per home before fees and expenses. It also wrote down the value of its homes by $573 million.",
        lesson: "Paying top dollar on the way up leaves no cushion when prices fall.",
        source: {
          label: "Bloomberg (via WealthManagement.com): Wall Street Is Losing Out to Amateur Buyers in the Housing Slump (Jan 30, 2023)",
          url: "https://www.wealthmanagement.com/estate-planning/wall-street-is-losing-out-to-amateur-buyers-in-the-housing-slump"
        }
      },
      {
        tone: "caution",
        who: "Zillow Group, the real estate listings company (national, including Phoenix and Las Vegas markets)",
        year: "2021",
        title: "Zillow quit flipping after big losses",
        happened: "Zillow used pricing algorithms to buy homes, make light repairs and resell them. It overpaid during the frothy 2021 market. It lost more than $380 million on the business in one quarter and wrote down more than $500 million of homes. Then it shut the operation and cut about 25% of its workforce.",
        lesson: "Even big buyers with lots of data can misjudge prices. A flip needs room for error.",
        source: {
          label: "Bloomberg (via Boston.com): At risk of losing millions, Zillow ends its house-flipping operation and cuts its workforce (Nov 4, 2021)",
          url: "https://www.boston.com/real-estate/untagged/2021/11/04/zillow-ends-house-flipping-operation/"
        }
      },
      {
        tone: "caution",
        who: "An owner selling a vacant house in east Las Vegas, Nevada",
        year: "2017",
        title: "Squatters sank a pending sale",
        happened: "The house sat on the market for months with lock boxes. But squatters moved in, and the owner’s buyer backed out. Police arrested two people. The squatters broke in again after the locks were changed. The owner faced paying again for a cleanup that had already cost $2,000.",
        lesson: "An empty flip or rental needs to be locked up and checked often. Otherwise, holding costs can balloon.",
        source: {
          label: "KTNV 13 Action News Las Vegas: Squatter spotters: Real estate deal falls through because of squatters (Feb 16, 2017)",
          url: "https://www.ktnv.com/news/squatters/squatter-spotters-real-estate-deal-falls-through-because-of-squatters"
        }
      }
    ],
    sources: [
      {
        label: "FOX 11 Los Angeles: House flipping down nearly 30% as profits drop, data reveals (2024, citing ATTOM)",
        url: "https://www.foxla.com/news/house-flipping-down-profits-drop-real-estate"
      },
      {
        label: "AZFamily (KTVK/KPHO Phoenix): FTC reaches $48M settlement with corporate landlord over undisclosed fees, security deposits (Sep 24, 2024)",
        url: "https://www.azfamily.com/2024/09/24/ftc-reaches-48m-settlement-with-leasing-company-practices-that-allegedly-harmed-renters/"
      },
      {
        label: "Associated Press (via Times-Republican): Landlords look for an exit amid federal eviction moratorium (Aug 2021)",
        url: "https://www.timesrepublican.com/news/money-markets/2021/08/landlords-look-for-an-exit-amid-federal-eviction-moratorium/"
      },
      {
        label: "Bloomberg (via WealthManagement.com): Wall Street Is Losing Out to Amateur Buyers in the Housing Slump (Jan 30, 2023)",
        url: "https://www.wealthmanagement.com/estate-planning/wall-street-is-losing-out-to-amateur-buyers-in-the-housing-slump"
      },
      {
        label: "Bloomberg (via Boston.com): At risk of losing millions, Zillow ends its house-flipping operation and cuts its workforce (Nov 4, 2021)",
        url: "https://www.boston.com/real-estate/untagged/2021/11/04/zillow-ends-house-flipping-operation/"
      },
      {
        label: "KTNV 13 Action News Las Vegas: Squatter spotters: Real estate deal falls through because of squatters (Feb 16, 2017)",
        url: "https://www.ktnv.com/news/squatters/squatter-spotters-real-estate-deal-falls-through-because-of-squatters"
      }
    ]
  },
  condo: {
    overview: [
      "“Condo” is a way of owning: you own your unit plus a share of the common areas. A townhouse is a building style. It can be a condo, or a home on its own lot in a planned community with an HOA. When you buy a condo or a townhouse in a homeowners association (HOA), you own your unit. But you share the building or community with everyone else. The HOA collects monthly dues. It keeps a savings account (“reserves”) for big repairs like roofs, balconies and concrete. It also sets rules on pets, parking, remodeling and renting. Its board can raise dues. It can charge “special assessments” (one-time bills) when reserves fall short. In many states it can foreclose if an owner doesn’t pay.",
      "In 2021 the Champlain Towers South condo collapsed in Surfside, Florida, killing 98 people. Florida then required inspections and fully funded reserves for older buildings. In some buildings, owners were billed $50,000 to $140,000 each. California has its own balcony laws. California condo associations must have an engineer or architect inspect exterior elevated elements, such as balconies, walkways and stairs (Civil Code 5551, from SB 326). California apartment buildings with three or more units face similar inspections (SB 721). In Nevada, an HOA’s lien for up to 9 months of unpaid dues can come ahead of the first mortgage. Nevada saw many HOA foreclosure sales after the housing crash. Nevada HOA sales can’t wipe out a mortgage owned by Fannie Mae or Freddie Mac, because federal law protects those loans.",
      "Condos are often the cheapest way into a market, and the HOA handles outside upkeep. The risk is that you are tied to your neighbors’ decisions. A board that kept dues low for years can leave a big bill for whoever owns the unit when repairs come due. Before buying, read the budget, reserve study, board minutes and rules (including any limits on renting)."
    ],
    bestFor: [
      "First-time buyers who want a lower price than a house and don’t want to do exterior maintenance.",
      "Owners who plan to live in the unit and are comfortable following shared rules.",
      "Buyers who carefully check the HOA’s finances and pick a well-funded, well-run association.",
      "Retirees or people who travel, as long as they have savings to cover a surprise assessment."
    ],
    notFor: [
      "Buyers stretching to afford the mortgage with no savings left for a special assessment.",
      "Investors who plan short-term or nightly rentals without confirming the HOA allows them.",
      "Anyone buying in an older building without seeing the reserve study, inspections and minutes.",
      "People who fall behind on dues. In Nevada and many other states, the HOA can foreclose."
    ],
    costs: [
      "Monthly HOA dues. In Las Vegas, the Review-Journal reported condo dues of about 50 cents to a dollar per square foot (c. 2016).",
      "Special assessments after Florida’s post-Surfside law. Buildings billed owners $22,000 (Orlando), $50,000-$60,000 (Daytona Beach), and $140,000 (Miami) per unit (NBC News, 2024).",
      "Rising dues as associations build the reserves the law requires.",
      "Late fees, collection costs and possible HOA foreclosure if dues go unpaid. In Nevada, up to 9 months of assessments plus some costs can come ahead of the first mortgage (NRS 116.3116). Nevada HOA sales can’t wipe out a mortgage owned by Fannie Mae or Freddie Mac.",
      "Your own unit insurance (interior and contents) on top of the HOA’s master policy."
    ],
    money: [
      "Many lenders and loan programs require the condo project itself to qualify. For example, VA loans can buy a condo only in a VA-approved project.",
      "Lenders count HOA dues as part of your monthly housing cost, which can reduce how much you can borrow.",
      "Large pending assessments, low reserves, or lawsuits against the HOA can make a unit harder to finance and resell.",
      "Fannie Mae won’t buy loans in projects where one owner holds too many units (more than 2 in a 5–20 unit project, or more than 20% in a larger one). Investors buying several units can make the whole building harder to finance."
    ],
    checklist: [
      "Get the resale package: budget, reserve study, financial statements, and the last 1-2 years of board minutes. Look for talk of roofs, balconies, concrete, plumbing or insurance problems.",
      "Ask in writing about any approved or proposed special assessments and who pays them (buyer or seller).",
      "Read the CC&Rs and rules, especially rental limits, short-term rental bans, pets and renovations.",
      "Check the master insurance policy and recent premium increases.",
      "In California, ask for the latest balcony/elevated-element inspection report (Civil Code 5551). In Florida, ask for the milestone inspection and structural reserve study.",
      "Confirm the HOA has no unpaid-dues liens on the unit and check for lawsuits.",
      "Get your own inspection of the unit (water damage, firewalls between units)."
    ],
    facts: [
      {
        text: "Florida’s post-Surfside law covers condo buildings older than 30 years. Their associations must do regular structural inspections and fully fund repair reserves.",
        source: {
          label: "NPR: Florida lawmakers try to balance condo safety with cost (May 3, 2025)",
          url: "https://www.npr.org/2025/05/03/nx-s1-5385870/florida-condo-safety-law-surfside"
        }
      },
      {
        text: "Before the Surfside collapse, the Champlain Towers South association had delayed about $15 million in structural repairs.",
        source: {
          label: "NPR: Florida lawmakers try to balance condo safety with cost (May 3, 2025)",
          url: "https://www.npr.org/2025/05/03/nx-s1-5385870/florida-condo-safety-law-surfside"
        }
      },
      {
        text: "In 2025 Florida lawmakers softened the law. They set a later inspection deadline and a two-year grace period for reserves, and they allowed borrowing for repairs.",
        source: {
          label: "NPR: Florida lawmakers try to balance condo safety with cost (May 3, 2025)",
          url: "https://www.npr.org/2025/05/03/nx-s1-5385870/florida-condo-safety-law-surfside"
        }
      },
      {
        text: "Florida’s inspection requirement covered roughly 900,000 condo units.",
        source: {
          label: "NBC News: A reckoning is coming for Florida’s condo owners as buildings face millions in repairs (Aug 11, 2024)",
          url: "https://www.nbcnews.com/politics/economics/reckoning-coming-floridas-condo-owners-buildings-face-millions-repairs-rcna165764"
        }
      },
      {
        text: "Nevada: an HOA’s lien for up to 9 months of regular assessments can come ahead of the first mortgage (the ‘super-priority’ lien).",
        source: {
          label: "Nevada Revised Statutes, NRS 116.3116 (Liens against units for assessments)",
          url: "https://www.leg.state.nv.us/nrs/nrs-116.html"
        }
      },
      {
        text: "California condo associations must have balconies and other elevated elements inspected by a licensed engineer or architect. The first inspection was due by January 1, 2025, then every nine years.",
        source: {
          label: "California Civil Code section 5551 (condo balcony/elevated element inspections, SB 326)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5551"
        }
      },
      {
        text: "Las Vegas condo buyers get a resale package after making an offer. It shows the assessment, common expenses and budget.",
        source: {
          label: "Las Vegas Review-Journal: condos as an affordable option in Las Vegas (Ann Friedman, c. 2016)",
          url: "https://www.reviewjournal.com/?p=1043468"
        }
      },
      {
        text: "Some Las Vegas HOAs ban nightly rentals even when buyers assume they can rent that way.",
        source: {
          label: "Las Vegas Review-Journal: condos as an affordable option in Las Vegas (Ann Friedman, c. 2016)",
          url: "https://www.reviewjournal.com/?p=1043468"
        }
      }
    ],
    stories: [
      {
        tone: "caution",
        who: "A widowed retired teacher who bought a condo in Ormond Beach, Florida",
        year: "2024",
        title: "A $100,000 assessment sent a retiree back to work",
        happened: "She bought her unit for $400,000 in 2021. Most of her retirement savings went to the down payment. Within a year the association billed her $100,000 for concrete repairs, new windows and higher reserves. Selling was not a way out, because the assessment pushed values down. A similar unit was listed at $335,000. So she went back to teaching full time in Las Vegas and moved in with her son to pay it off.",
        lesson: "Before buying in an older building, check the reserves and inspection reports. Keep savings for a surprise assessment.",
        source: {
          label: "NBC News: A reckoning is coming for Florida’s condo owners as buildings face millions in repairs (Aug 11, 2024)",
          url: "https://www.nbcnews.com/politics/economics/reckoning-coming-floridas-condo-owners-buildings-face-millions-repairs-rcna165764"
        }
      },
      {
        tone: "caution",
        who: "Owners at the Palm Bay Yacht Club condominium in Miami, Florida",
        year: "2024",
        title: "A $140,000-per-unit bill",
        happened: "Two-bedroom units in the building sold for $400,000 to $500,000. Owners were told to pay $140,000 each toward a special assessment for building improvements. It was part of a wave of large bills after Florida’s post-Surfside safety law.",
        lesson: "A special assessment can equal a third or more of a unit’s value. Ask about planned projects before you buy.",
        source: {
          label: "NBC News: A reckoning is coming for Florida’s condo owners as buildings face millions in repairs (Aug 11, 2024)",
          url: "https://www.nbcnews.com/politics/economics/reckoning-coming-floridas-condo-owners-buildings-face-millions-repairs-rcna165764"
        }
      },
      {
        tone: "caution",
        who: "A homeowner in an HOA community in Summerlin, Las Vegas, Nevada",
        year: "2018",
        title: "HOA auctioned a $430,000 home for $30,000",
        happened: "After serious medical problems, the owner fell behind on both her mortgage and HOA dues. She arranged a short sale with a buyer ready to pay $450,000. She did not tell the HOA about the short sale. The HOA sold the house at a foreclosure auction over the unpaid dues for $30,000, which ended the short sale.",
        lesson: "In Nevada an HOA can foreclose for unpaid dues. If you are behind, talk to the HOA in writing right away, even if a sale is pending.",
        source: {
          label: "KTNV 13 Investigates, Las Vegas: Woman loses home after HOA auctions nearly $500K home for $30K (Jul 23, 2018)",
          url: "https://www.ktnv.com/news/contact-13/las-vegas-womans-home-goes-to-auction-for-30k"
        }
      },
      {
        tone: "good",
        who: "Ten holdout owners at the Biscayne 21 condominium in Miami, Florida",
        year: "2024",
        title: "Building rules protected owners who didn’t want to sell",
        happened: "A developer bought all but ten of the 192 units and took over the board. It changed the rules so 80% of owners, instead of 100%, could vote to end the condominium and tear the building down. The holdouts sued. A Florida appeals court ruled the change violated their voting rights and the termination was illegal.",
        lesson: "Read the declaration. Some condo documents give each owner strong rights, such as a veto over termination.",
        source: {
          label: "NPR (via WYSU): A court decision worries developers eyeing Florida’s aging condos (Jul 29, 2024)",
          url: "https://wysu.org/npr-national-news/2024-07-29/a-court-decision-worries-developers-eyeing-floridas-aging-condos"
        }
      },
      {
        tone: "good",
        who: "Owners at the sinking Millennium Tower condo high-rise in San Francisco, California",
        year: "2019",
        title: "Owners who sued together won a fix and compensation",
        happened: "The luxury tower was found to be sinking and tilting, and hundreds of owners sued. A tentative settlement included $100 million to drill 52 new piles into bedrock. It also paid owners for the lost value of their units, though it took years to get there.",
        lesson: "Owners acting together through the HOA and the courts can recover from builders for defects. But it can take years, and the problem may not be fully solved.",
        source: {
          label: "ABC7 San Francisco (KGO): Settlement tentatively reached in lawsuit involving SF Millennium Tower homeowners (Aug 29, 2019)",
          url: "https://abc7news.com/millennium-tower-lawsuit-leaning-san-francisco/5499261/"
        }
      }
    ],
    sources: [
      {
        label: "NPR: Florida lawmakers try to balance condo safety with cost (May 3, 2025)",
        url: "https://www.npr.org/2025/05/03/nx-s1-5385870/florida-condo-safety-law-surfside"
      },
      {
        label: "NBC News: A reckoning is coming for Florida’s condo owners as buildings face millions in repairs (Aug 11, 2024)",
        url: "https://www.nbcnews.com/politics/economics/reckoning-coming-floridas-condo-owners-buildings-face-millions-repairs-rcna165764"
      },
      {
        label: "Nevada Revised Statutes, NRS 116.3116 (Liens against units for assessments)",
        url: "https://www.leg.state.nv.us/nrs/nrs-116.html"
      },
      {
        label: "California Civil Code section 5551 (condo balcony/elevated element inspections, SB 326)",
        url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=5551"
      },
      {
        label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
        url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
      },
      {
        label: "Las Vegas Review-Journal: condos as an affordable option in Las Vegas (Ann Friedman, c. 2016)",
        url: "https://www.reviewjournal.com/?p=1043468"
      },
      {
        label: "KTNV 13 Investigates, Las Vegas: Woman loses home after HOA auctions nearly $500K home for $30K (Jul 23, 2018)",
        url: "https://www.ktnv.com/news/contact-13/las-vegas-womans-home-goes-to-auction-for-30k"
      },
      {
        label: "NPR (via WYSU): A court decision worries developers eyeing Florida’s aging condos (Jul 29, 2024)",
        url: "https://wysu.org/npr-national-news/2024-07-29/a-court-decision-worries-developers-eyeing-floridas-aging-condos"
      },
      {
        label: "ABC7 San Francisco (KGO): Settlement tentatively reached in lawsuit involving SF Millennium Tower homeowners (Aug 29, 2019)",
        url: "https://abc7news.com/millennium-tower-lawsuit-leaning-san-francisco/5499261/"
      }
    ]
  },
  smallMultifamily: {
    overview: [
      "A small multifamily property is a duplex, triplex or fourplex: one building (or lot) with two to four homes. Lenders treat it as a home, not a commercial building. So if you live in one unit, you can use owner-occupant loans. Examples are FHA (often 3.5% down) or a VA loan (no down payment if you qualify). Living in one unit and renting out the others to cut your housing cost is called “house hacking.”",
      "The upside is real. Tenants’ rent can cover a big share of the mortgage, and you build landlord skills while living on site. The downside is that you are now a landlord to your neighbors. You handle repairs, late rent and evictions. Lenders and underwriters often count only about 75% of expected rent to allow for vacancies. During the pandemic eviction bans, many small landlords had tenants stop paying and sold properties.",
      "Rules depend on the state and county. In California, buildings with three or more units must have balconies, decks and stairs inspected (Health and Safety Code 17973, SB 721). Local rent control there may also limit increases. Check local rules before you buy."
    ],
    bestFor: [
      "First-time buyers who will live in one unit and want rent to offset their mortgage.",
      "Veterans and service members who can use a VA loan (up to 4 units, owner-occupied).",
      "Handy, organized people willing to be on-site landlords.",
      "Buyers with steady jobs and savings, since lenders and good sense both call for reserves."
    ],
    notFor: [
      "People who want privacy from their tenants or dislike conflict.",
      "Buyers who need every dollar of rent to make the payment. A vacancy or non-paying tenant can break the budget.",
      "Anyone not willing to learn their state’s landlord-tenant and eviction rules.",
      "Buyers who plan to move out quickly. Owner-occupant loans require you to live there."
    ],
    costs: [
      "Mortgage, taxes and insurance on a building that usually costs more than a single-family home in the same area.",
      "FHA mortgage insurance: an upfront premium of 1.75% of the loan plus an ongoing premium (WFTV/Lower feature, 2026).",
      "Closing costs of about 2% to 6% of the price (WFTV/Lower feature, 2026).",
      "Vacancy and non-payment. Plan for at least a 25% cushion on projected rent, as underwriters do (National Mortgage News).",
      "Repairs and upkeep for several kitchens, baths and systems. In California, 3+ unit buildings need balcony/stair inspections and repairs.",
      "Legal costs and time for evictions."
    ],
    money: [
      "FHA: as little as 3.5% down for 2-4 units if you live in one unit. Purchases of 3 and 4 units must also pass a ‘self-sufficiency’ rent test (WFTV/Lower feature).",
      "VA: eligible veterans can buy a home of up to 4 units with no down payment if the price isn’t above appraised value. They must live there (VA.gov).",
      "Conventional: in late 2023, Fannie Mae cut the minimum down payment on owner-occupied 2-4 unit homes to 5%. It had been at least 15% (as described to National Mortgage News).",
      "Lenders may count part of the expected rent to help you qualify. Underwriters generally reduce it to allow for vacancies."
    ],
    checklist: [
      "Get the current leases, rent roll and security deposit records. Confirm them with the tenants (estoppel letters).",
      "Run the numbers with rent cut by 25% and with one unit vacant for several months.",
      "Inspect every unit, plus roof, plumbing, electrical, and separate meters.",
      "Check local rent control, eviction rules and rental registration requirements for the city and county.",
      "In California, for 3+ units, ask for the SB 721 elevated-element inspection report.",
      "Confirm the zoning allows the number of units (legal vs. unpermitted units).",
      "Consider a landlord education class before buying."
    ],
    facts: [
      {
        text: "VA-backed purchase loans can be used to buy a home of up to 4 units that the borrower will live in.",
        source: {
          label: "U.S. Department of Veterans Affairs: VA-backed purchase loan",
          url: "https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/"
        }
      },
      {
        text: "VA loans need no down payment as long as the sales price isn’t above appraised value.",
        source: {
          label: "U.S. Department of Veterans Affairs: VA-backed purchase loan",
          url: "https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/"
        }
      },
      {
        text: "California: buildings with three or more multifamily units must have load-bearing exterior elevated elements inspected. First inspections are due by January 1, 2026, then every six years.",
        source: {
          label: "California Health and Safety Code section 17973 (SB 721 inspections for buildings with 3+ units)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=17973"
        }
      },
      {
        text: "Small landlords own nearly half of U.S. rental units.",
        source: {
          label: "NPR (CapRadio, via KUNC): Economic pressures are rising on mom-and-pop rental owners (Jul 7, 2021)",
          url: "https://www.kunc.org/2021-07-07/economic-pressures-are-rising-on-mom-and-pop-rental-owners"
        }
      }
    ],
    stories: [
      {
        tone: "caution",
        who: "A Sacramento, California couple who owned six rental properties, including duplexes in Sacramento and the Bay Area",
        year: "2021",
        title: "Four of nine tenants stopped paying",
        happened: "When the economy shut down in 2020, four of their nine tenants stopped paying rent entirely. Eviction bans kept the couple from going to court. They used personal savings for repairs, property taxes and mortgages. In the end they sold half their properties because they couldn’t make the numbers work.",
        lesson: "Keep large cash reserves. With only a few units, a couple of non-paying tenants can wipe out your income.",
        source: {
          label: "NPR (CapRadio, via KUNC): Economic pressures are rising on mom-and-pop rental owners (Jul 7, 2021)",
          url: "https://www.kunc.org/2021-07-07/economic-pressures-are-rising-on-mom-and-pop-rental-owners"
        }
      },
      {
        tone: "caution",
        who: "A 39-year-old small landlord with three small rental properties in Dupont, Pennsylvania",
        year: "2021",
        title: "Counting on rent for retirement, then selling",
        happened: "He bought three rental properties in 2017. He expected about $1,000 a month after expenses to support his family and later his retirement. During the pandemic eviction moratoriums, unpaid rent built up. When the federal moratorium was extended, he decided to sell.",
        lesson: "Rental income can stop suddenly because of tenants or new laws. Don’t depend on it for your own bills.",
        source: {
          label: "Associated Press (via Times-Republican): Landlords look for an exit amid federal eviction moratorium (Aug 2021)",
          url: "https://www.timesrepublican.com/news/money-markets/2021/08/landlords-look-for-an-exit-amid-federal-eviction-moratorium/"
        }
      }
    ],
    sources: [
      {
        label: "U.S. Department of Veterans Affairs: VA-backed purchase loan",
        url: "https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/"
      },
      {
        label: "California Health and Safety Code section 17973 (SB 721 inspections for buildings with 3+ units)",
        url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=17973"
      },
      {
        label: "NPR (CapRadio, via KUNC): Economic pressures are rising on mom-and-pop rental owners (Jul 7, 2021)",
        url: "https://www.kunc.org/2021-07-07/economic-pressures-are-rising-on-mom-and-pop-rental-owners"
      },
      {
        label: "Associated Press (via Times-Republican): Landlords look for an exit amid federal eviction moratorium (Aug 2021)",
        url: "https://www.timesrepublican.com/news/money-markets/2021/08/landlords-look-for-an-exit-amid-federal-eviction-moratorium/"
      }
    ]
  },
  manufactured: {
    overview: [
      "A manufactured home is built in a factory to a federal code and moved to a site. It is often the cheapest way to own a home. The big question is the land. If you own the land too, the home can be financed and valued much like a regular house. If the home sits on a rented lot in a park, you own the house but pay “lot rent” to the park owner. Moving the home is costly or impossible. So you have little power if the rent goes up.",
      "Since about 2015, investors and private equity firms have bought many parks and raised lot rents sharply. AP reported increases of 87% at one Iowa park. At another, owned by Utah-based Havenpark, rent and fees nearly doubled. Some residents have fought back by buying their parks as resident-owned cooperatives (ROCs). They often get help from nonprofits like ROC USA and state funds. In California, residents of a Fresno County park bought theirs in 2024 using state programs.",
      "Loans on homes without land are usually “chattel” loans (personal-property loans). According to the CFPB, they make up about 42% of manufactured home purchase loans. They have higher interest rates and fewer protections than mortgages. Older homes in parks often lose value instead of gaining it. State law matters. Nevada requires 90 days’ written notice before a lot-rent increase (NRS 118B.150). California has its Mobilehome Residency Law, and some of its cities and counties have local rent control."
    ],
    bestFor: [
      "Buyers who also buy the land, so the home can be financed and gain value more like a house.",
      "People who need low housing costs and choose a resident-owned park, or one with local rent control or a long-term lease.",
      "Retirees on fixed incomes in parks with stable, protected rents.",
      "Residents ready to organize with neighbors to buy their park when it goes up for sale."
    ],
    notFor: [
      "Investors expecting a home on a rented lot to gain value like a house.",
      "Buyers in an investor-owned park without rent protection who can’t handle large rent increases.",
      "Anyone who needs a low interest rate but can only get a chattel loan.",
      "People who assume the home can easily be moved. Moving costs thousands, and older homes may not be movable at all."
    ],
    costs: [
      "Lot rent, which can rise quickly. One Massachusetts park went from $207 to $503.06 a month in 2024 (Stateline). A Montana resident’s rent and fees rose $117 in under two years (AP, 2022).",
      "Higher loan costs: chattel loans 'have higher interest rates and fewer consumer protections than mortgages’ (CFPB).",
      "Moving costs if the park closes or rent becomes too high. AP reports owners may have to abandon the home and lose tens of thousands of dollars.",
      "Park fees and utilities billed separately, plus home insurance and repairs (roof, skirting, plumbing).",
      "In a resident-owned park, your share of paying back the purchase loan through lot rent. At Linnhaven in Maine, rents rose $100 at first."
    ],
    money: [
      "Chattel (personal property) loans are secured by the home only. About 42% of manufactured home purchase loans are chattel loans (CFPB).",
      "Less than 30% of manufactured home loan applications are approved, versus more than 70% for site-built homes (CFPB).",
      "Owning the land and titling the home as real property opens up regular mortgages. Fannie Mae and Freddie Mac have manufactured-housing programs.",
      "Resident co-op purchases use nonprofit lenders (such as ROC USA Capital) and state or local grants and low-interest loans."
    ],
    checklist: [
      "Find out whether you are buying the land or renting a lot. If renting, get the lease, the park rules and the history of rent increases.",
      "Ask who owns the park, whether it has been sold recently, and whether a sale is pending.",
      "Check state and local protections (rent control, notice rules, right of residents to buy the park). In Nevada, ask for the list of rent increases for the last 5 years.",
      "Compare chattel loan offers with mortgage options if land is included.",
      "Inspect the home (roof, floors, plumbing, ties/anchoring) and check its age and HUD label.",
      "Estimate the cost of moving the home, or whether it can be moved at all."
    ],
    facts: [
      {
        text: "About 42% of manufactured home purchase loans are chattel loans, which have higher rates and fewer protections.",
        source: {
          label: "CFPB: Manufactured Housing Loan Borrowers Face Higher Interest Rates, Risks, and Barriers to Credit (2021)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/manufactured-housing-loan-borrowers-face-higher-interest-rates-risks-and-barriers-to-credit/"
        }
      },
      {
        text: "Fewer than 30% of manufactured home loan applications are approved, versus more than 70% for site-built homes.",
        source: {
          label: "CFPB: Manufactured Housing Loan Borrowers Face Higher Interest Rates, Risks, and Barriers to Credit (2021)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/manufactured-housing-loan-borrowers-face-higher-interest-rates-risks-and-barriers-to-credit/"
        }
      },
      {
        text: "More than 22 million mostly low-income Americans live in 43,000 manufactured home communities.",
        source: {
          label: "Associated Press (via Times-Republican): Rents spike as big-pocketed investors buy mobile home parks (Jul 26, 2022)",
          url: "https://www.timesrepublican.com/news/money-markets/2022/07/rents-spike-as-big-pocketed-investors-buy-mobile-home-parks/"
        }
      },
      {
        text: "12 private equity funds own more than 1,300 U.S. mobile home communities with 250,000+ lots.",
        source: {
          label: "Stateline (via Daily Montanan): To save affordable housing, states promote resident-owned mobile home parks (Oct 31, 2024)",
          url: "https://dailymontanan.com/?p=27599"
        }
      },
      {
        text: "22 states have laws giving or encouraging residents a chance to buy their park.",
        source: {
          label: "Stateline (via Daily Montanan): To save affordable housing, states promote resident-owned mobile home parks (Oct 31, 2024)",
          url: "https://dailymontanan.com/?p=27599"
        }
      },
      {
        text: "Average mobile home price rose from $71,900 (2017) to $127,300 (2022).",
        source: {
          label: "New York Times (via Boston.com): Maine mobile home park renters buy their community (Oct 13, 2024)",
          url: "https://www.boston.com/real-estate/renting/2024/10/13/maine-mobile-home-park-renters-buy-community/"
        }
      },
      {
        text: "Nevada requires that a tenant receive written notice 90 days before a lot-rent increase takes effect.",
        source: {
          label: "Nevada Revised Statutes, NRS 118B.150 (manufactured home parks: rent increases)",
          url: "https://www.leg.state.nv.us/nrs/nrs-118b.html"
        }
      },
      {
        text: "ROC USA, the national nonprofit network for resident-owned communities, launched in 2008.",
        source: {
          label: "ROC USA: About ROC USA",
          url: "https://rocusa.org/about-roc-usa/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "About 52 families, mostly Oaxacan farmworkers, at a mobile home park in Fresno County, California",
        year: "2024",
        title: "Residents bought their park and kept rent near $500",
        happened: "A Stockton-based company bought the park in 2019. Residents alleged a 32% rent increase and poor conditions, and they sued. As part of a settlement, they formed a limited-equity co-op. They bought the park for a little over $7.6 million. They used two state programs ($4.5 million and $3.25 million) and a bridge loan from ROC USA. Rent and fees were expected to be close to $500 a month. The effort took five years.",
        lesson: "Buying a park is possible, but it took organizing, lawyers, nonprofits and state money.",
        source: {
          label: "KQED: To fight rising rents, these Fresno County residents bought their mobile home park (Mar 1, 2024)",
          url: "https://www.kqed.org/news/11977464/to-fight-rising-rents-these-fresno-county-residents-bought-their-mobile-home-park"
        }
      },
      {
        tone: "good",
        who: "Residents of a nearly 300-home park in Brunswick, Maine",
        year: "2024",
        title: "A state notice law let residents beat an outside buyer",
        happened: "The longtime owner got a $26.25 million offer from an outside buyer. A new Maine law required him to give residents notice and a chance to buy. Residents formed a board, offered $26.3 million and closed with loans and grants from the state and town. Lot rents went up $100 at first to cover the debt. But residents gained security against investor rent hikes.",
        lesson: "A ‘right to buy’ or notice law gives residents a real chance. Check whether your state has one.",
        source: {
          label: "New York Times (via Boston.com): Maine mobile home park renters buy their community (Oct 13, 2024)",
          url: "https://www.boston.com/real-estate/renting/2024/10/13/maine-mobile-home-park-renters-buy-community/"
        }
      },
      {
        tone: "good",
        who: "Residents of a suburban mobile home park outside Kansas City, in Liberty, Missouri",
        year: "2021",
        title: "A retiring owner sold to the residents",
        happened: "The longtime owner wanted out and suggested resident ownership. Working with a nonprofit, residents bought the park with a $9.5 million loan repaid through lot rents. A volunteer board now handles finances and upkeep with a hired manager. Residents say neighbors now know each other.",
        lesson: "Resident ownership works best when the seller cooperates. It also means owners take on the work of running the park.",
        source: {
          label: "Stateline (via Daily Montanan): To save affordable housing, states promote resident-owned mobile home parks (Oct 31, 2024)",
          url: "https://dailymontanan.com/?p=27599"
        }
      },
      {
        tone: "caution",
        who: "Residents of an Iowa park bought by an out-of-state investor",
        year: "2022",
        title: "Rent and fees up 87% in three years",
        happened: "Investors began buying Iowa parks. Iowa Legal Aid reported that one park bought by Impact Communities saw rent and fees rise 87% between 2017 and 2020. Many residents were on fixed incomes and could not keep up. The Iowa attorney general’s office said complaints rose sharply.",
        lesson: "On a rented lot, a new park owner can change your costs quickly. Check ownership history and state protections before buying.",
        source: {
          label: "Associated Press (via Times-Republican): Rents spike as big-pocketed investors buy mobile home parks (Jul 26, 2022)",
          url: "https://www.timesrepublican.com/news/money-markets/2022/07/rents-spike-as-big-pocketed-investors-buy-mobile-home-parks/"
        }
      },
      {
        tone: "caution",
        who: "Residents of a park in Ludlow, Massachusetts",
        year: "2024",
        title: "Lot rent jumped nearly 150%",
        happened: "A new owner of eight parks raised monthly lot rent at one community from $207 to $503.06. The new owner said the old owner had charged too little for decades and left a backlog of repairs. The town’s rent board approved it, and the decision was challenged in court.",
        lesson: "Very low rent under an old owner can mean a big jump after a sale. Budget for it.",
        source: {
          label: "Stateline (via Daily Montanan): To save affordable housing, states promote resident-owned mobile home parks (Oct 31, 2024)",
          url: "https://dailymontanan.com/?p=27599"
        }
      },
      {
        tone: "caution",
        who: "Residents who bought a 120-home park in Durango, Colorado",
        year: "2021",
        title: "Co-op ownership didn’t cut rent right away",
        happened: "Residents bought their park for $14 million from a corporate owner under Colorado’s right-of-first-refusal law. The purchase loan had to be repaid, so lot rents went up at first rather than down. The volunteer board now has to run the park.",
        lesson: "A resident-owned park protects against investor hikes. But loan payments can raise rent in the early years.",
        source: {
          label: "KSJD / Rocky Mountain Community Radio: Coloradans have been purchasing their own mobile home parks... but the resident-owned model also comes with challenges (Nov 16, 2021)",
          url: "https://www.ksjd.org/podcast/ksjd-local-newscasts/2021-11-16/coloradans-have-been-purchasing-their-own-mobile-home-parks-to-keep-them-affordable-but-the-resident-owned-model-also-comes-with-significant-challenges-and-limitations"
        }
      }
    ],
    sources: [
      {
        label: "CFPB: Manufactured Housing Loan Borrowers Face Higher Interest Rates, Risks, and Barriers to Credit (2021)",
        url: "https://www.consumerfinance.gov/about-us/newsroom/manufactured-housing-loan-borrowers-face-higher-interest-rates-risks-and-barriers-to-credit/"
      },
      {
        label: "Associated Press (via Times-Republican): Rents spike as big-pocketed investors buy mobile home parks (Jul 26, 2022)",
        url: "https://www.timesrepublican.com/news/money-markets/2022/07/rents-spike-as-big-pocketed-investors-buy-mobile-home-parks/"
      },
      {
        label: "Stateline (via Daily Montanan): To save affordable housing, states promote resident-owned mobile home parks (Oct 31, 2024)",
        url: "https://dailymontanan.com/?p=27599"
      },
      {
        label: "New York Times (via Boston.com): Maine mobile home park renters buy their community (Oct 13, 2024)",
        url: "https://www.boston.com/real-estate/renting/2024/10/13/maine-mobile-home-park-renters-buy-community/"
      },
      {
        label: "Nevada Revised Statutes, NRS 118B.150 (manufactured home parks: rent increases)",
        url: "https://www.leg.state.nv.us/nrs/nrs-118b.html"
      },
      {
        label: "ROC USA: About ROC USA",
        url: "https://rocusa.org/about-roc-usa/"
      },
      {
        label: "KQED: To fight rising rents, these Fresno County residents bought their mobile home park (Mar 1, 2024)",
        url: "https://www.kqed.org/news/11977464/to-fight-rising-rents-these-fresno-county-residents-bought-their-mobile-home-park"
      },
      {
        label: "KSJD / Rocky Mountain Community Radio: Coloradans have been purchasing their own mobile home parks... but the resident-owned model also comes with challenges (Nov 16, 2021)",
        url: "https://www.ksjd.org/podcast/ksjd-local-newscasts/2021-11-16/coloradans-have-been-purchasing-their-own-mobile-home-parks-to-keep-them-affordable-but-the-resident-owned-model-also-comes-with-significant-challenges-and-limitations"
      }
    ]
  },
  multifamily: {
    overview: [
      "A multifamily building (5 or more units) is a business as much as a home. Its value comes from net income. That is the rent collected minus vacancy, repairs, taxes, insurance, utilities, staff and management. Lenders and buyers price the building on that income. So a few empty units or a jump in costs changes what it is worth.",
      "Buildings with 5+ units are usually financed with commercial loans, not regular home mortgages. The loan terms decide whether you survive a bad year: fixed or floating rate, how long, and how much the income must cover the payment. In 2022–2023, many owners who had bought Sun Belt apartments with short-term floating-rate loans saw payments rise far faster than rents. They lost buildings to foreclosure.",
      "Many beginners invest through a “syndication.” A sponsor pools money from passive investors to buy a large complex. You own a share, but you have no control. The sponsor is paid fees whether or not you profit. If the deal fails, you can lose all of your money."
    ],
    bestFor: [
      "Patient, long-term owners who want steady income and can hold through slow years. (The Utah Housing Preservation Fund buys older complexes and plans to hold them indefinitely.)",
      "Buyers with enough cash reserves to cover vacancies, big repairs and higher interest costs without missing a loan payment.",
      "People who will manage hands-on, or who pay a professional property manager and check the books monthly.",
      "Mission-driven buyers (nonprofits, land trusts) who want to keep rents stable for current tenants. They can use public or charity money."
    ],
    notFor: [
      "Anyone counting on fast rent increases to cover a loan payment that is bigger than today’s income.",
      "Passive investors who cannot afford to lose the whole investment. Also anyone who cannot read a syndication’s offering documents and loan terms.",
      "Owners who plan to cut maintenance to make the numbers work. Tenant complaints, code cases and empty units follow, and the value falls.",
      "People who want a quick flip. Apartment buildings are hard to sell fast in a falling market."
    ],
    costs: [
      "Debt service: with a floating-rate loan, the payment rises with interest rates. The Federal Reserve began raising rates in 2022. After that, one Houston owner’s floating-rate payments roughly doubled and then tripled (American Prospect).",
      "Property taxes: in California, a purchase normally triggers reassessment to current market value under Proposition 13. So the new owner’s tax bill can be much higher than the seller’s (California Board of Equalization).",
      "Repairs and capital items (big one-time costs): roofs, plumbing, air conditioning, parking lots and unit turnovers. Older ‘value-add’ complexes often need more than the seller’s numbers show.",
      "Vacancy and unpaid rent. Plan for some units empty and some tenants behind. Evictions take time and money.",
      "Management, insurance, utilities paid by the owner, trash, pest control and security.",
      "Sponsor fees, if you invest in a syndication. These include acquisition fees tied to the purchase price plus ongoing fees from rent. They are paid even if investors lose money (American Prospect, describing a lawsuit by 123 investors)."
    ],
    money: [
      "Agency loans (Fannie Mae and Freddie Mac) are the main long-term, often fixed-rate source for apartment buildings. They lend based on the building’s income. They compare the building’s net income, after operating costs, with the loan payments. The required coverage depends on the program and the deal, and gross rent alone is not the test.",
      "Short-term ‘bridge’ or floating-rate loans let buyers borrow more and renovate first, but the payment can jump. Many 2021–2022 buyers who used them lost buildings in 2023–2024.",
      "Syndications raise money from investors. The Wall Street Journal found syndicators reported raising at least $115 billion from 2020 through 2022.",
      "Nonprofit buyers can combine private, charity and state money. Utah set aside about $30 million for the Utah Housing Preservation Fund."
    ],
    checklist: [
      "Get the rent roll and at least 2 years of income and expense statements. Compare them with bank deposits and tax returns.",
      "Read the loan terms: fixed or floating rate, interest-rate cap and when it expires, maturity date, prepayment penalty.",
      "Stress-test: can the building still pay its loan if occupancy drops 10%, and, on a floating-rate loan or at refinance, if rates rise 2–3 points?",
      "Inspect every unit and the major systems. Check with the city or county for open code cases and tenant complaints.",
      "For a syndication, check the sponsor’s past deals, lawsuits and record with securities regulators. Read how fees are paid and what happens if a capital call is needed.",
      "Confirm the real purchase price (county recorder records) and get an independent appraisal. Fraud cases have used fake, inflated contracts.",
      "Know the tenant rules in that state and city. These include rent control in parts of California, Nevada protections when a building changes hands, and the federal 90-day notice for tenants after a foreclosure."
    ],
    facts: [
      {
        text: "From 2020 through 2022, real estate syndicators reported raising at least $115 billion from investors (Wall Street Journal analysis of SEC filings).",
        source: {
          label: "Wall Street Journal (summary via MBA Newslink): A Housing Bust Comes for Thousands of Small-Time Investors (May 23, 2023)",
          url: "https://newslink.mba.org/mba-newslinks/2023/may/mba-newslink-tuesday-may-23-2023/a-housing-bust-comes-for-thousands-of-small-time-investors/"
        }
      },
      {
        text: "In Houston, apartment prices rose from about $90,000 per unit before the pandemic to more than $150,000 per unit in the 2021 boom.",
        source: {
          label: "The American Prospect: The hell of the underwater landlord (May 22, 2024)",
          url: "https://prospect.org/2024/05/22/2024-05-22-hell-underwater-landlord/"
        }
      },
      {
        text: "California: when a property changes ownership, Proposition 13 requires the county assessor to reassess it to current fair market value.",
        source: {
          label: "California State Board of Equalization: Change in Ownership FAQs",
          url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
        }
      },
      {
        text: "Nevada (Las Vegas, Clark County): local TV reported on a state law that protects tenants after a foreclosure sale. If tenants keep paying rent under their lease, new owners can’t evict them for 60 days.",
        source: {
          label: "KTNV Channel 13 Las Vegas: Tenants’ futures uncertain after Las Vegas apartment complex foreclosure (Feb. 11, 2026)",
          url: "https://ktnv.com/news/where-are-we-gonna-go-tenants-futures-uncertain-after-las-vegas-apartment-complex-foreclosure"
        }
      },
      {
        text: "Federal law (the Protecting Tenants at Foreclosure Act, permanent since 2018) requires 90 days’ notice to tenants after a foreclosure. Tenants with a real lease can usually stay until it ends, unless the buyer will live in the unit.",
        source: {
          label: "Federal Reserve: Protecting Tenants at Foreclosure Act restored (CA 18-4)",
          url: "https://www.federalreserve.gov/supervisionreg/caletters/caltr1804.htm"
        }
      },
      {
        text: "Utah: the Utah Housing Preservation Fund secured another $100 million, including about $30 million from the state. The money is to buy existing apartments and keep them affordable.",
        source: {
          label: "Salt Lake Tribune: Utah’s housing needs are actually growing faster than the state. Here’s why and one solution. (Feb. 22, 2022)",
          url: "https://sltrib.com/news/2022/02/22/utahs-housing-needs-are"
        }
      }
    ],
    stories: [
      {
        tone: "caution",
        who: "An apartment syndicator from the Dallas area that bought Houston complexes with investor money",
        year: "2023",
        title: "Floating-rate loans cost a syndicator 3,200 Houston apartments",
        happened: "Applesway Investment Group bought four Houston apartment complexes with more than 3,200 units during the pandemic boom. It used floating-rate loans. When the Federal Reserve raised rates, the loan payments soared faster than rents. The lender foreclosed on all four complexes in April 2023, and the company’s investors lost their money.",
        lesson: "A loan whose payment can rise is a bet on interest rates. Check what happens to the deal if rates double.",
        source: {
          label: "Wall Street Journal (summary via MBA Newslink): Houston Apartment Owner Loses 3,200 Units to Foreclosure as Multifamily Feels the Heat (Apr. 11, 2023)",
          url: "https://newslink.mba.org/?p=196329"
        }
      },
      {
        tone: "caution",
        who: "123 small investors in a Houston apartment syndication, some using retirement savings",
        year: "2023",
        title: "Investors say their money went to a different deal",
        happened: "A group of 123 investors gave a syndicator $12.4 million to buy a 643-unit Houston complex. Their lawsuit says the purchase never happened. It says the money was quietly moved to a larger deal that collapsed, and the deposit was lost. Some had used retirement savings. When reported, the claims were allegations in a lawsuit.",
        lesson: "Passive investors have little control. Check county records to verify the property was actually bought, and never invest money you cannot afford to lose.",
        source: {
          label: "Bisnow: Multifamily Investors Sue Troubled Applesway Over Alleged $12.4M Fraud (May 30, 2023)",
          url: "https://www.bisnow.com/houston/news/multifamily/123-houston-multifamily-investors-sue-troubled-applesway-over-alleged-fraud-119157"
        }
      },
      {
        tone: "caution",
        who: "Tenants and the out-of-state owner of a nearly 200-unit complex in southeast Las Vegas, Nevada",
        year: "2026",
        title: "Las Vegas complex heads to foreclosure auction",
        happened: "Tides on Twain is a nearly 200-unit complex near Boulder Highway. Its owner fell behind on the loan. A notice taped to the leasing office said the owner owed nearly $43 million and the property would be sold at public auction. Residents said nobody had told them.",
        lesson: "Heavy debt on an older complex leaves no room for error, and the tenants feel it too. In Nevada, a new owner must follow state and federal tenant protections after foreclosure, including 90 days’ notice under federal law.",
        source: {
          label: "KTNV Channel 13 Las Vegas: Tenants’ futures uncertain after Las Vegas apartment complex foreclosure (Feb. 11, 2026)",
          url: "https://ktnv.com/news/where-are-we-gonna-go-tenants-futures-uncertain-after-las-vegas-apartment-complex-foreclosure"
        }
      },
      {
        tone: "caution",
        who: "Apartment buyers in Cincinnati, Ohio, who used fake contracts to get a bigger Fannie Mae loan",
        year: "2025",
        title: "Inflated purchase price ends in prison sentences",
        happened: "Investors bought the Williamsburg of Cincinnati apartment complex for $70 million in 2019. But they showed the lender and Fannie Mae a fake contract for over $95 million. That got them a loan of more than $74 million, more than the real price. In 2025 two of the managing members were sentenced to prison for wire fraud conspiracy.",
        lesson: "Always check the true sale price and get an independent appraisal. Numbers in a sponsor’s pitch can be false.",
        source: {
          label: "U.S. Department of Justice: Four Real Estate Investors Sentenced in Multimillion-Dollar Loan Scheme (2025)",
          url: "https://www.justice.gov/opa/pr/four-real-estate-investors-sentenced-multimillion-dollar-loan-scheme"
        }
      },
      {
        tone: "good",
        who: "A Utah nonprofit fund backed by banks, a health system, philanthropists and the state",
        year: "2022",
        title: "Buying an older complex and keeping it affordable in West Valley City",
        happened: "The Utah Housing Preservation Fund bought the 90-unit Aspen Village complex in West Valley City, Utah, and renovated the units. It kept two-bedroom rents around $1,100 when nearby rents averaged about $1,400. The fund buys older, sometimes run-down complexes before investors raise rents. It plans to hold them for the long term.",
        lesson: "Older apartment buildings suit patient owners who renovate carefully. They must be happy with steady income rather than a quick profit.",
        source: {
          label: "Salt Lake Tribune: Utah’s housing needs are actually growing faster than the state. Here’s why and one solution. (Feb. 22, 2022)",
          url: "https://sltrib.com/news/2022/02/22/utahs-housing-needs-are"
        }
      },
      {
        tone: "good",
        who: "More than 100 longtime tenants in South Los Angeles working with a community land trust",
        year: "2023",
        title: "Tenants win the chance to buy their buildings",
        happened: "Boston University inherited four apartment buildings in the Baldwin Hills area of Los Angeles. Tenants and the Liberty Community Land Trust organized for two years. Then the university accepted their purchase offer instead of selling to a developer. Some tenants had lived there for decades and paid under $1,000 a month for a two-bedroom.",
        lesson: "Mission-driven buyers like land trusts can be a good fit for older buildings when the goal is stability, not maximum rent. The price was not disclosed.",
        source: {
          label: "GBH News: BU agrees to sell Los Angeles buildings to tenant group to preserve affordable housing (Jan. 10, 2023)",
          url: "https://wgbh.org/news/local/2023-01-10/bu-agrees-to-sell-los-angeles-buildings-to-tenant-group-to-preserve-affordable-housing"
        }
      }
    ],
    sources: [
      {
        label: "Wall Street Journal (summary via MBA Newslink): A Housing Bust Comes for Thousands of Small-Time Investors (May 23, 2023)",
        url: "https://newslink.mba.org/mba-newslinks/2023/may/mba-newslink-tuesday-may-23-2023/a-housing-bust-comes-for-thousands-of-small-time-investors/"
      },
      {
        label: "The American Prospect: The hell of the underwater landlord (May 22, 2024)",
        url: "https://prospect.org/2024/05/22/2024-05-22-hell-underwater-landlord/"
      },
      {
        label: "California State Board of Equalization: Change in Ownership FAQs",
        url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
      },
      {
        label: "KTNV Channel 13 Las Vegas: Tenants’ futures uncertain after Las Vegas apartment complex foreclosure (Feb. 11, 2026)",
        url: "https://ktnv.com/news/where-are-we-gonna-go-tenants-futures-uncertain-after-las-vegas-apartment-complex-foreclosure"
      },
      {
        label: "Federal Reserve: Protecting Tenants at Foreclosure Act restored (CA 18-4)",
        url: "https://www.federalreserve.gov/supervisionreg/caletters/caltr1804.htm"
      },
      {
        label: "Salt Lake Tribune: Utah’s housing needs are actually growing faster than the state. Here’s why and one solution. (Feb. 22, 2022)",
        url: "https://sltrib.com/news/2022/02/22/utahs-housing-needs-are"
      },
      {
        label: "Wall Street Journal (summary via MBA Newslink): Houston Apartment Owner Loses 3,200 Units to Foreclosure as Multifamily Feels the Heat (Apr. 11, 2023)",
        url: "https://newslink.mba.org/?p=196329"
      },
      {
        label: "Bisnow: Multifamily Investors Sue Troubled Applesway Over Alleged $12.4M Fraud (May 30, 2023)",
        url: "https://www.bisnow.com/houston/news/multifamily/123-houston-multifamily-investors-sue-troubled-applesway-over-alleged-fraud-119157"
      },
      {
        label: "U.S. Department of Justice: Four Real Estate Investors Sentenced in Multimillion-Dollar Loan Scheme (2025)",
        url: "https://www.justice.gov/opa/pr/four-real-estate-investors-sentenced-multimillion-dollar-loan-scheme"
      },
      {
        label: "GBH News: BU agrees to sell Los Angeles buildings to tenant group to preserve affordable housing (Jan. 10, 2023)",
        url: "https://wgbh.org/news/local/2023-01-10/bu-agrees-to-sell-los-angeles-buildings-to-tenant-group-to-preserve-affordable-housing"
      }
    ]
  },
  retail: {
    overview: [
      "Retail property includes neighborhood strip centers and single-tenant stores (a drugstore or fast-food pad). It also includes larger 'power centers’ with big boxes, and enclosed malls. The owner earns rent from businesses, usually on long leases where tenants also pay a share of taxes, insurance and upkeep.",
      "The big risk is losing a tenant, especially an anchor. An anchor is a grocery store or big box that draws shoppers. When a national chain goes bankrupt, the owner can be left with an empty building and no rent. Smaller tenants may leave too. Re-leasing can take months or years. It often costs money for remodeling and broker commissions.",
      "Since about 2022, neighborhood centers with grocery stores and service businesses (restaurants, salons, gyms, medical) have done well. They did well because little new retail space was built. Large downtown malls that depend on tourists and office workers have struggled, especially in San Francisco."
    ],
    bestFor: [
      "Owners who want long leases where tenants pay many property costs. They must be able to afford some vacancy between tenants.",
      "Buyers of neighborhood centers with daily-needs tenants (grocery, pharmacy, food, services) in growing areas.",
      "Investors with leasing experience or a good local broker. They can find a new tenant when a chain leaves.",
      "Local business owners who buy the small building their own shop uses."
    ],
    notFor: [
      "Anyone whose whole income depends on one tenant, especially a weak chain.",
      "Buyers without reserves for tenant improvements and leasing commissions when a space goes dark.",
      "Investors who can’t judge local shopping traffic, safety and access (parking, visibility, turn lanes).",
      "People drawn to a very large mall or downtown property by a low price alone. The San Francisco Centre lost most of its value and tenants."
    ],
    costs: [
      "Vacancy: a closed drugstore shell is often 8,000 to 16,000 square feet. It can sit empty for years (Philadelphia Inquirer).",
      "Re-leasing: tenant improvement money, free rent and broker commissions to land a new tenant. Some owners split a big box into smaller spaces.",
      "Common-area costs (parking lot, lighting, landscaping, security). Under triple-net leases these are mostly passed to tenants. But the owner pays them when spaces are empty.",
      "Property taxes and insurance. In California, a purchase triggers reassessment to market value (Board of Equalization).",
      "Loan payments that continue whether or not tenants pay."
    ],
    money: [
      "Banks and credit unions make commercial loans based on the center’s income and tenant quality. Leases with strong national tenants are easier to finance.",
      "A small business that uses at least 51% of an existing building (60% if newly built) may qualify for an SBA 504 loan to buy it. These are long-term, fixed-rate loans, with a maximum 504 loan of $5.5 million.",
      "Large malls are often financed with big securitized loans. When income drops, owners may stop paying and hand the property to the lender. That happened with the San Francisco Centre in 2023."
    ],
    checklist: [
      "Read every lease: rent, length, renewal options, and who pays what (triple-net or not). Look for any ‘co-tenancy’ clause that lets tenants cut rent or leave if the anchor closes.",
      "Check the financial health of the main tenants (bankruptcy news, store-closing lists).",
      "Look at traffic, parking, visibility and nearby competition. Visit at different times of day.",
      "Estimate what it would cost and how long it would take to re-lease the largest space.",
      "Confirm zoning allows likely replacement uses (medical, gym, grocery, restaurant).",
      "Get an environmental report if the site had a dry cleaner or gas station."
    ],
    facts: [
      {
        text: "Shopping-center vacancy fell to 5.6% in the first quarter of 2023. That was the lowest since Cushman & Wakefield began tracking in 2007.",
        source: {
          label: "CNBC (via NBC Connecticut): Bed Bath & Beyond Store Closures Will Kick Off a Land Grab for Fast-Growing Retailers (Apr. 28, 2023)",
          url: "https://www.nbcconnecticut.com/news/business/money-report/bed-bath-beyond-store-closures-will-kick-off-a-land-grab-for-fast-growing-retailers/3022276/"
        }
      },
      {
        text: "Bed Bath & Beyond stores were typically about 30,000 square feet, a size many retailers can reuse.",
        source: {
          label: "CNBC (via NBC Connecticut): Bed Bath & Beyond Store Closures Will Kick Off a Land Grab for Fast-Growing Retailers (Apr. 28, 2023)",
          url: "https://www.nbcconnecticut.com/news/business/money-report/bed-bath-beyond-store-closures-will-kick-off-a-land-grab-for-fast-growing-retailers/3022276/"
        }
      },
      {
        text: "Foot traffic to grocery stores was 12% higher in the third quarter of 2024 than in the same period of 2019.",
        source: {
          label: "Business Insider (via AOL): The lowly neighborhood strip mall might be the hottest new thing in commercial real estate (Jan. 5, 2025)",
          url: "https://www.aol.com/lowly-neighborhood-strip-mall-might-205415253.html"
        }
      },
      {
        text: "San Francisco Centre sales fell from $455 million in 2019 to $298 million in 2022. Foot traffic dropped 43%.",
        source: {
          label: "Fortune (Bloomberg): San Francisco mall owner defaults as real estate woes rise (June 12, 2023)",
          url: "https://fortune.com/2023/06/12/san-francisco-commercial-real-estate-apocalypse-westfield-center"
        }
      },
      {
        text: "CoStar estimated the San Francisco Centre’s appraised value fell by $930 million since 2016.",
        source: {
          label: "San Francisco Examiner: SF mall lien to be auctioned for $625M in defaulted loans (Oct. 2024)",
          url: "https://www.sfexaminer.com/news/business/lien-on-emporium-centre-sf-mall-will-be-auctioned-for-defaulted-lenders/article_c8516630-8db2-11ef-bae1-f7f3a1f90a5e.html"
        }
      }
    ],
    stories: [
      {
        tone: "caution",
        who: "The owners of San Francisco’s biggest downtown mall, Unibail-Rodamco-Westfield and Brookfield",
        year: "2023",
        title: "A downtown mall handed back to the lender",
        happened: "Nordstrom and other stores left. Sales at the Westfield San Francisco Centre fell from $455 million in 2019 to $298 million in 2022, and foot traffic dropped 43%. The owners stopped paying a $558 million mortgage. They turned the mall over to a court-appointed receiver. In 2024 the lenders moved to sell it at a foreclosure auction. By then the debt had grown to about $625.6 million.",
        lesson: "A big retail property depends on its anchors and on people visiting the area. When both leave, even large, experienced owners can lose it.",
        source: {
          label: "Fortune (Bloomberg): San Francisco mall owner defaults as real estate woes rise (June 12, 2023)",
          url: "https://fortune.com/2023/06/12/san-francisco-commercial-real-estate-apocalypse-westfield-center"
        }
      },
      {
        tone: "caution",
        who: "Landlords of closed Rite Aid drugstores in the Philadelphia region, Pennsylvania",
        year: "2024",
        title: "Drugstore shells sit empty after a chain’s bankruptcy",
        happened: "Rite Aid closed at least 73 stores in the Philadelphia region from 2022 to late 2024 as it went through bankruptcy. Some buildings, like one in West Philadelphia, sat empty for years. A CBRE broker said the shells are often in good shape, but many tenants find them the wrong size. Grocers, dollar stores, medical offices and car washes have filled some.",
        lesson: "Before buying a single-tenant store, ask who else could use the building if that tenant leaves. Budget for a long gap.",
        source: {
          label: "Philadelphia Inquirer: Vacant Rite Aid stores and what replaces them (Dec. 16, 2024)",
          url: "https://www.inquirer.com/business/retail/a/vacant-rite-aid-new-businesses-20241216.html"
        }
      },
      {
        tone: "good",
        who: "Shopping-center owners, including Kimco Realty, with former Bed Bath & Beyond stores (national, reported from Phoenix)",
        year: "2023",
        title: "Empty Bed Bath & Beyond boxes re-leased at higher rents",
        happened: "Bed Bath & Beyond closed all its stores in 2023. Chains like Burlington, HomeGoods and Michaels moved quickly into the empty spaces, including several in the Phoenix area. Kimco Realty had 26 former Bed Bath leases. It said its new leases were 38% higher than the old rents. Little new retail space had been built since 2008, so good boxes were scarce.",
        lesson: "Well-located centers in busy suburbs can recover fast from losing a tenant. That is especially true when little new space is being built.",
        source: {
          label: "ABC15 Arizona: Bed Bath & Beyond stores won’t be empty for long, here’s who’s moving in (Nov. 28, 2023)",
          url: "https://www.abc15.com/news/local-news/bed-bath-beyond-stores-wont-be-empty-for-long-heres-whos-moving-in"
        }
      },
      {
        tone: "good",
        who: "Large investors buying grocery-anchored neighborhood centers on the West Coast, including one in San Mateo, California",
        year: "2024",
        title: "Grocery-anchored strip centers come back into favor",
        happened: "Blackstone paid $4 billion for Retail Opportunity Investments. That company owns about 90 shopping centers, most anchored by grocery stores. Another investment firm, Cohen & Steers, bought a fully leased outdoor shopping center in San Mateo, California, for $127 million. Investors pointed to little new construction and steady visits to grocery stores and services.",
        lesson: "Neighborhood centers built around daily needs (groceries, food, services) have held up better than malls. The lesson is about tenant mix, not size.",
        source: {
          label: "Business Insider (via AOL): The lowly neighborhood strip mall might be the hottest new thing in commercial real estate (Jan. 5, 2025)",
          url: "https://www.aol.com/lowly-neighborhood-strip-mall-might-205415253.html"
        }
      }
    ],
    sources: [
      {
        label: "CNBC (via NBC Connecticut): Bed Bath & Beyond Store Closures Will Kick Off a Land Grab for Fast-Growing Retailers (Apr. 28, 2023)",
        url: "https://www.nbcconnecticut.com/news/business/money-report/bed-bath-beyond-store-closures-will-kick-off-a-land-grab-for-fast-growing-retailers/3022276/"
      },
      {
        label: "Business Insider (via AOL): The lowly neighborhood strip mall might be the hottest new thing in commercial real estate (Jan. 5, 2025)",
        url: "https://www.aol.com/lowly-neighborhood-strip-mall-might-205415253.html"
      },
      {
        label: "Fortune (Bloomberg): San Francisco mall owner defaults as real estate woes rise (June 12, 2023)",
        url: "https://fortune.com/2023/06/12/san-francisco-commercial-real-estate-apocalypse-westfield-center"
      },
      {
        label: "San Francisco Examiner: SF mall lien to be auctioned for $625M in defaulted loans (Oct. 2024)",
        url: "https://www.sfexaminer.com/news/business/lien-on-emporium-centre-sf-mall-will-be-auctioned-for-defaulted-lenders/article_c8516630-8db2-11ef-bae1-f7f3a1f90a5e.html"
      },
      {
        label: "Philadelphia Inquirer: Vacant Rite Aid stores and what replaces them (Dec. 16, 2024)",
        url: "https://www.inquirer.com/business/retail/a/vacant-rite-aid-new-businesses-20241216.html"
      },
      {
        label: "ABC15 Arizona: Bed Bath & Beyond stores won’t be empty for long, here’s who’s moving in (Nov. 28, 2023)",
        url: "https://www.abc15.com/news/local-news/bed-bath-beyond-stores-wont-be-empty-for-long-heres-whos-moving-in"
      },
      {
        label: "The San Francisco Standard: Who wants to own a dead mall? The San Francisco Centre heads to auction (Oct. 28, 2024)",
        url: "https://sfstandard.com/2024/10/28/san-francisco-centre-mall-headed-to-auction"
      },
      {
        label: "California State Board of Equalization: Change in Ownership FAQs",
        url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
      },
      {
        label: "U.S. Small Business Administration: 504 loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans"
      }
    ]
  },
  office: {
    overview: [
      "Office buildings range from small medical and professional buildings to downtown towers. Since the pandemic, many companies need less space because people work from home part of the week. National office vacancy reached about 20% in 2024. In San Francisco it passed 33% in 2023.",
      "Big downtown towers have lost the most value. Several San Francisco and Los Angeles buildings sold for 60–90% less than their earlier prices. Large owners such as Brookfield defaulted on loans. Some buyers see a chance to buy at the new, lower price. But a big drop from an old price is not proof of a bargain. What matters is the rent the building can earn after paying to fill it. But leasing space still costs money (tenant improvements, commissions, free rent) and can take years.",
      "Small office buildings used by the owner’s own business (a dentist, doctor, accountant) are a different story. The owner is the tenant, so vacancy risk is low. SBA loans can make buying possible with a small down payment. Turning offices into apartments is possible but slow and costly, and only some buildings fit."
    ],
    bestFor: [
      "Professionals (dentists, doctors, accountants) who will use the building themselves. They want stable occupancy costs and to build equity instead of paying rent.",
      "Well-funded buyers with cash and patience. They buy at today’s lower prices and plan to hold 10 years or more.",
      "Experienced developers converting suitable older buildings to housing, especially where cities offer incentives.",
      "Public agencies or users who need space and can buy a building for less than the cost of fixing their own (Los Angeles County)."
    ],
    notFor: [
      "Beginners buying a mostly vacant multi-tenant building with borrowed money.",
      "Investors who assume prices will bounce back quickly.",
      "Anyone without reserves for tenant improvements, commissions and free-rent periods.",
      "Conversion projects without expert help; zoning, design and approvals can take years."
    ],
    costs: [
      "Leasing costs: building out space for new tenants, broker commissions and free rent. These are often large before any rent comes in.",
      "Vacancy: the Gas Company Tower in Los Angeles was only 57% leased in 2024.",
      "Property taxes and insurance. A California purchase triggers reassessment to market value (Board of Equalization).",
      "Transfer taxes: in the City of Los Angeles, Measure ULA can add a 5.5% tax on high-priced sales. Commercial Observer reported it would have applied to the $200 million Gas Company Tower sale, had the buyer not been a government agency.",
      "SBA 504 loans charge fees of about 3% of the debt, which can be financed (SBA).",
      "Building systems: elevators, HVAC, roofs and seismic upgrades in older California buildings."
    ],
    money: [
      "SBA 504 loans: long-term, fixed-rate loans for owner-occupied business real estate. They have 10-, 20- or 25-year terms and a maximum loan of $5.5 million. They are not for passive or speculative investment (SBA).",
      "Bank commercial loans for investors. Lenders are cautious on office in 2023–2025, so expect larger down payments.",
      "Large towers often carry big securitized loans. When income falls, owners may default, and lenders foreclose or appoint receivers.",
      "Conversions may use city incentives, such as Washington, D.C.'s 20-year property tax abatement (NPR)."
    ],
    checklist: [
      "Get the rent roll and every lease: expiration dates, renewal options, who pays what.",
      "Find out how much of the building is leased today and how much expires in the next 2–3 years.",
      "Estimate leasing costs (improvements, commissions, free rent) for empty space.",
      "Inspect elevators, HVAC, roof, parking and accessibility. In California, check seismic status.",
      "If you will occupy it, confirm SBA 504 eligibility and that the space fits your practice now and as you grow.",
      "For a conversion, check zoning, window placement, floor depth, plumbing and parking with an architect before buying."
    ],
    facts: [
      {
        text: "Nationally, office vacancy reached roughly 20% in 2024.",
        source: {
          label: "NPR: From cubicles to kitchens: How empty offices are becoming homes (Feb. 21, 2026)",
          url: "https://www.npr.org/2026/02/21/g-s1-110595/from-cubicles-to-kitchens-how-empty-offices-are-becoming-homes"
        }
      },
      {
        text: "San Francisco office vacancy hit a record 33.6% in the third quarter of 2023 (CBRE preliminary data).",
        source: {
          label: "The San Francisco Standard: Downtown San Francisco $61M tower purchase signals real estate reset (Sept. 26, 2023)",
          url: "https://sfstandard.com/2023/09/26/downtown-san-francisco-61m-tower-purchase-signals-real-estate-reset/"
        }
      },
      {
        text: "SBA 504 loans have a maximum of $5.5 million.",
        source: {
          label: "U.S. Small Business Administration: 504 loans",
          url: "https://www.sba.gov/funding-programs/loans/504-loans"
        }
      },
      {
        text: "SBA 504 loans offer 10-, 20- and 25-year terms.",
        source: {
          label: "U.S. Small Business Administration: 504 loans",
          url: "https://www.sba.gov/funding-programs/loans/504-loans"
        }
      },
      {
        text: "SBA 504 loans cannot be made to businesses engaged in passive or speculative activities. So they suit owner-users, not landlords.",
        source: {
          label: "U.S. Small Business Administration: 504 loans",
          url: "https://www.sba.gov/funding-programs/loans/504-loans"
        }
      },
      {
        text: "Washington, D.C. completed 11 office conversions with nearly 2,000 apartments since 2024. It offers a 20-year property tax abatement.",
        source: {
          label: "NPR: From cubicles to kitchens: How empty offices are becoming homes (Feb. 21, 2026)",
          url: "https://www.npr.org/2026/02/21/g-s1-110595/from-cubicles-to-kitchens-how-empty-offices-are-becoming-homes"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A dentist in Napa, California, who had outgrown his leased office",
        year: "2022",
        title: "A dentist buys his own building with an SBA 504 loan",
        happened: "A Napa dentist opened his practice in 2010 in a leased space. It grew to a staff of eight and ran out of room. He worked with a local bank and a certified development company. With SBA 504 financing, he bought and renovated a 3,127-square-foot building a couple of miles away. The move added two local jobs.",
        lesson: "Owning your own small office can suit an established professional whose practice is stable and who plans to stay for many years.",
        source: {
          label: "Napa Valley Register: Napa biz buzz: dental practice relocates with SBA funding (Feb. 8, 2022)",
          url: "https://napavalleyregister.com/business/napa-biz-buzz-perez-dental-practice-relocates-with-sba-funding/article_0681c1cd-20ae-52a0-b25c-338a2c21cdf8.html"
        }
      },
      {
        tone: "good",
        who: "Two San Francisco real estate firms with cash and a long-term view",
        year: "2023",
        title: "Buying a mostly empty tower far below its old asking price, and planning to hold",
        happened: "SKS Partners and the Swig Company bought 350 California St., a 22-story Financial District tower, for about $61 million. That was roughly 75% below what the seller had asked in 2020. The building was mostly vacant. The buyers planned to hold it for a decade or more. The low price let them lease space at lower rents.",
        lesson: "Buying an office building cheaply only works for owners who can wait years and pay to lease it up.",
        source: {
          label: "The San Francisco Standard: Downtown San Francisco $61M tower purchase signals real estate reset (Sept. 26, 2023)",
          url: "https://sfstandard.com/2023/09/26/downtown-san-francisco-61m-tower-purchase-signals-real-estate-reset/"
        }
      },
      {
        tone: "good",
        who: "A Washington, D.C. developer that bought an office building in 2019 to convert it",
        year: "2026",
        title: "Office building becomes apartments",
        happened: "Foulger Pratt, a developer that used to focus on offices, looked at 30 properties. In 2019 it bought a downtown D.C. office building to convert into apartments. Residents began moving into the converted building in October 2025. The city offers incentives such as a 20-year property tax abatement for conversions.",
        lesson: "Conversions can work for experienced developers who pick the right building early and use local incentives. They are not a beginner project.",
        source: {
          label: "NPR: From cubicles to kitchens: How empty offices are becoming homes (Feb. 21, 2026)",
          url: "https://www.npr.org/2026/02/21/g-s1-110595/from-cubicles-to-kitchens-how-empty-offices-are-becoming-homes"
        }
      },
      {
        tone: "caution",
        who: "Brookfield, owner of the Gas Company Tower in downtown Los Angeles, California",
        year: "2024",
        title: "A Los Angeles skyscraper sells for $200 million after a $632 million valuation",
        happened: "Brookfield defaulted on the loan on the 52-story Gas Company Tower after its main tenant planned to move out. Los Angeles County bought it in December 2024 for $200 million. It had been valued at $632 million in 2021. The tower was only 57% leased.",
        lesson: "A big office building’s value depends on its tenants. When they leave and the loan comes due, even a famous tower can lose two-thirds of its value.",
        source: {
          label: "Commercial Observer: L.A. County Finally Closes $200M Deal for Troubled Gas Company Tower (Dec. 11, 2024)",
          url: "https://commercialobserver.com/2024/12/la-county-closes-gas-company-tower-deal/"
        }
      },
      {
        tone: "caution",
        who: "The seller of the David Hewes Building in San Francisco’s Mid-Market area",
        year: "2024",
        title: "A 15-story office building sells at 90% off",
        happened: "The 15-floor David Hewes Building was once a Burning Man headquarters and a WeWork location. It sold in 2024 for about 90% less than its 2016 price. The building sits on a stretch of Market Street the city has struggled to make safer. A JLL researcher said office pricing in San Francisco may have hit bottom.",
        lesson: "Location and tenant demand drive office value. Buying at a peak can wipe out almost all of an owner’s equity.",
        source: {
          label: "NBC Bay Area: San Francisco office tower sells at steep discount (Apr. 24, 2024)",
          url: "https://www.nbcbayarea.com/news/local/san-francisco/san-francisco-office-tower-sells-at-steep-discount/3519772/"
        }
      },
      {
        tone: "caution",
        who: "The developers of an 11-story office-to-apartment conversion in uptown Phoenix, Arizona",
        year: "2026",
        title: "Phoenix office conversion opens after years and a foreclosure",
        happened: "One Camelback, a former office building at Central Avenue and Camelback Road, was turned into 163 luxury apartments. The project took years and went through a foreclosure. Then new owners, Kinella Capital, got it on track, and pre-leasing began in 2026. The owners said approvals and design made conversion complicated and expensive.",
        lesson: "Office-to-housing conversions can succeed, but plan for long delays and high costs. The first owner may not be the one who finishes.",
        source: {
          label: "FOX 10 Phoenix: One Camelback: Phoenix office building converted to apartment now accepting leases (June 3, 2026)",
          url: "https://fox10phoenix.com/news/one-camelback-phoenix-office-building-converted-apartment-now-accepting-leases"
        }
      }
    ],
    sources: [
      {
        label: "NPR: From cubicles to kitchens: How empty offices are becoming homes (Feb. 21, 2026)",
        url: "https://www.npr.org/2026/02/21/g-s1-110595/from-cubicles-to-kitchens-how-empty-offices-are-becoming-homes"
      },
      {
        label: "The San Francisco Standard: Downtown San Francisco $61M tower purchase signals real estate reset (Sept. 26, 2023)",
        url: "https://sfstandard.com/2023/09/26/downtown-san-francisco-61m-tower-purchase-signals-real-estate-reset/"
      },
      {
        label: "U.S. Small Business Administration: 504 loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans"
      },
      {
        label: "Napa Valley Register: Napa biz buzz: dental practice relocates with SBA funding (Feb. 8, 2022)",
        url: "https://napavalleyregister.com/business/napa-biz-buzz-perez-dental-practice-relocates-with-sba-funding/article_0681c1cd-20ae-52a0-b25c-338a2c21cdf8.html"
      },
      {
        label: "Commercial Observer: L.A. County Finally Closes $200M Deal for Troubled Gas Company Tower (Dec. 11, 2024)",
        url: "https://commercialobserver.com/2024/12/la-county-closes-gas-company-tower-deal/"
      },
      {
        label: "NBC Bay Area: San Francisco office tower sells at steep discount (Apr. 24, 2024)",
        url: "https://www.nbcbayarea.com/news/local/san-francisco/san-francisco-office-tower-sells-at-steep-discount/3519772/"
      },
      {
        label: "FOX 10 Phoenix: One Camelback: Phoenix office building converted to apartment now accepting leases (June 3, 2026)",
        url: "https://fox10phoenix.com/news/one-camelback-phoenix-office-building-converted-apartment-now-accepting-leases"
      },
      {
        label: "Spectrum News: LA County set to acquire Gas Company Tower in downtown LA (Nov. 6, 2024)",
        url: "https://mynews13.com/fl/orlando/politics/2024/11/06/la-county-set-to-acquire-gas-company-tower-in-downtown-la"
      },
      {
        label: "California State Board of Equalization: Change in Ownership FAQs",
        url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
      }
    ]
  },
  industrial: {
    overview: [
      "Industrial property includes warehouses, distribution centers, and smaller ‘flex’ or light-industrial buildings. These are used for storage, light manufacturing, contractors and showrooms. The buildings are simple, often described as four walls with a lot of air in between. Tenants usually pay most operating costs under triple-net leases.",
      "Online shopping drove a huge boom from 2020 to 2022. Vacancy fell to record lows (1.3% in Southern Nevada in 2022), and rents jumped. New warehouses were often fully leased before construction finished. Developers then built a lot of new space, especially in the Inland Empire and Phoenix.",
      "Since 2023 demand has cooled. Amazon and other companies gave back space, vacancy rose in the Inland Empire and Phoenix, and rents slipped. Large new buildings without tenants are the most exposed. Small, well-located buildings that local businesses need tend to hold up better."
    ],
    bestFor: [
      "Investors who want long leases where tenants pay most property costs, with little day-to-day management.",
      "Owner-users (contractors, distributors, small manufacturers) who buy the building their business uses.",
      "Buyers of smaller, well-located buildings near highways and population centers where local demand is steady.",
      "Patient investors who can ride out a few years of higher vacancy."
    ],
    notFor: [
      "Beginners developing large speculative warehouses (built before tenants sign).",
      "Owners who depend on one big tenant whose needs could shrink (Amazon gave back space in 2022).",
      "Buyers who can’t pay the loan through a long vacancy. Large buildings can take a long time to re-lease.",
      "Anyone ignoring local opposition and environmental rules for truck-heavy sites in California."
    ],
    costs: [
      "Vacancy and re-leasing time. Inland Empire vacancy reached 5.9% in early 2024, with 11% in Redlands (CBRE, via Community Forward Redlands).",
      "Roof, parking/truck court paving, dock doors and fire sprinklers (major capital items).",
      "Tenant improvements and broker commissions when leasing.",
      "Property taxes and insurance. California purchases trigger reassessment to market value (Board of Equalization).",
      "Environmental reports, especially for sites with past manufacturing or fuel storage."
    ],
    money: [
      "Bank and life-insurance-company loans based on lease income. Strong tenants on long leases get better terms.",
      "Owner-users can use SBA 504 loans (long-term, fixed-rate, up to $5.5 million) to buy their own building, if the business uses at least 51% of it (60% if newly built).",
      "Speculative development uses construction loans that must be repaid or refinanced. If the building doesn’t lease, the developer is squeezed."
    ],
    checklist: [
      "Check the tenant’s financial strength, the lease length and renewal options.",
      "Look at local vacancy and how much new space is under construction nearby.",
      "Inspect clear height, loading docks, truck access, power and sprinklers. They decide who can use the building.",
      "Get a Phase I environmental report.",
      "Confirm zoning and any city limits on warehouse uses or truck traffic.",
      "Estimate how long re-leasing would take and how many months of payments you can cover."
    ],
    facts: [
      {
        text: "Southern Nevada industrial vacancy was just 1.3% in the third quarter of 2022 (Colliers). More than 8.3 million square feet was under construction.",
        source: {
          label: "Las Vegas Review-Journal: Southern Nevada industrial market keeps flooring it (Nov. 2022)",
          url: "https://www.reviewjournal.com/business/business-columns/real-estate-insider/forget-the-brakes-southern-nevada-warehouse-market-keeps-flooring-it-2438760/"
        }
      },
      {
        text: "North Las Vegas warehouse vacancy was just 0.4% in early 2022.",
        source: {
          label: "Las Vegas Review-Journal: New warehouse project in North Las Vegas sells for $271.5 million (May 27, 2022)",
          url: "https://www.reviewjournal.com/business/new-warehouse-complex-near-speedway-sells-for-271-5m-2460895/"
        }
      },
      {
        text: "Inland Empire (California) industrial vacancy rose to 5.9% in the first quarter of 2024 (CBRE). It was driven by 3.8 million square feet of new but vacant space.",
        source: {
          label: "Community Forward Redlands: Unused warehouse space on the rise in IE following pandemic-era retail boom (2024)",
          url: "https://www.communityforwardredlands.com/unused-warehouse-space-on-the-rise-in-ie"
        }
      },
      {
        text: "Redlands, California recorded an 11% industrial vacancy rate in early 2024.",
        source: {
          label: "Community Forward Redlands: Unused warehouse space on the rise in IE following pandemic-era retail boom (2024)",
          url: "https://www.communityforwardredlands.com/unused-warehouse-space-on-the-rise-in-ie"
        }
      },
      {
        text: "Phoenix-area industrial gross absorption reached a record 35.9 million square feet in 2024 (CBRE), even as construction slowed.",
        source: {
          label: "ABC15 Arizona: Last big wave of Valley industrial deliveries expected in early 2025 (Jan. 24, 2025)",
          url: "https://www.abc15.com/news/business/last-big-wave-of-valley-industrial-deliveries-expected-in-early-2025"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A warehouse developer in North Las Vegas, Nevada",
        year: "2022",
        title: "Fully leased before finished, sold for $143 million",
        happened: "SunCap Property Group and a partner built SunPoint West, six warehouse buildings on almost 40 acres in North Las Vegas. The project was fully leased before construction ended in September 2022. It sold the next month for about $143 million to German asset manager DWS. Online shopping had pushed local vacancy to record lows.",
        lesson: "Warehouses do best when demand is strong and tenants sign before the building is finished. Timing matters.",
        source: {
          label: "Las Vegas Review-Journal: Southern Nevada industrial market keeps flooring it (Nov. 2022)",
          url: "https://www.reviewjournal.com/business/business-columns/real-estate-insider/forget-the-brakes-southern-nevada-warehouse-market-keeps-flooring-it-2438760/"
        }
      },
      {
        tone: "good",
        who: "A California developer building warehouses near the Las Vegas Motor Speedway, Nevada",
        year: "2022",
        title: "Two leased warehouses sell for $271.5 million",
        happened: "CapRock Partners built two warehouses totaling 1.1 million square feet off Interstate 15 in North Las Vegas. Both were fully leased, the larger one to Amazon. Property records showed Eaton Vance bought them for $271.5 million. A CapRock executive called pricing ‘a little bit frothy’ even as demand stayed strong.",
        lesson: "Fully leased warehouses with strong tenants attract buyers, but prices set at the peak of a boom can be hard to repeat.",
        source: {
          label: "Las Vegas Review-Journal: New warehouse project in North Las Vegas sells for $271.5 million (May 27, 2022)",
          url: "https://www.reviewjournal.com/business/new-warehouse-complex-near-speedway-sells-for-271-5m-2460895/"
        }
      },
      {
        tone: "caution",
        who: "Warehouse owners and developers who had counted on Amazon’s pandemic expansion (national, including California)",
        year: "2022",
        title: "Amazon sublets space as online sales cool",
        happened: "Amazon roughly doubled its warehouse network during the pandemic, then found it had too much space. In 2022 it said it would sublease some warehouses. Bloomberg and the Wall Street Journal reported at least 10 million square feet, and possible lease exits in states including California. Sublease space competes with landlords trying to lease their own buildings.",
        lesson: "Even the biggest tenant can shrink. Don’t assume a boom’s demand will last.",
        source: {
          label: "Associated Press (via WSLS): Amazon to sublease warehouses as online shopping slows (May 23, 2022)",
          url: "https://www.wsls.com/business/2022/05/23/amazon-to-sublease-warehouses-as-online-shopping-slows/"
        }
      },
      {
        tone: "caution",
        who: "Warehouse landlords and developers in California’s Inland Empire (Riverside and San Bernardino counties)",
        year: "2024",
        title: "The Inland Empire warehouse boom stalls",
        happened: "After years of nonstop growth, Inland Empire warehouse leasing slowed in 2023. Companies gave back space they took during the pandemic. Rents dipped and lease terms shifted in tenants’ favor. The Los Angeles Times reported warehouses closing in Rialto, Fontana, Jurupa Valley, Perris and Chino. By early 2024 vacancy reached 11% in Redlands.",
        lesson: "Markets with lots of new construction can flip from shortage to surplus fast. Buy with enough reserves to wait for tenants.",
        source: {
          label: "Patch: Inland Empire’s white-hot warehousing sector cools (Feb. 22, 2024)",
          url: "https://patch.com/california/banning-beaumont/inland-empires-white-hot-warehousing-sector-cools"
        }
      }
    ],
    sources: [
      {
        label: "Las Vegas Review-Journal: Southern Nevada industrial market keeps flooring it (Nov. 2022)",
        url: "https://www.reviewjournal.com/business/business-columns/real-estate-insider/forget-the-brakes-southern-nevada-warehouse-market-keeps-flooring-it-2438760/"
      },
      {
        label: "Las Vegas Review-Journal: New warehouse project in North Las Vegas sells for $271.5 million (May 27, 2022)",
        url: "https://www.reviewjournal.com/business/new-warehouse-complex-near-speedway-sells-for-271-5m-2460895/"
      },
      {
        label: "Community Forward Redlands: Unused warehouse space on the rise in IE following pandemic-era retail boom (2024)",
        url: "https://www.communityforwardredlands.com/unused-warehouse-space-on-the-rise-in-ie"
      },
      {
        label: "ABC15 Arizona: Last big wave of Valley industrial deliveries expected in early 2025 (Jan. 24, 2025)",
        url: "https://www.abc15.com/news/business/last-big-wave-of-valley-industrial-deliveries-expected-in-early-2025"
      },
      {
        label: "Associated Press (via WSLS): Amazon to sublease warehouses as online shopping slows (May 23, 2022)",
        url: "https://www.wsls.com/business/2022/05/23/amazon-to-sublease-warehouses-as-online-shopping-slows/"
      },
      {
        label: "Patch: Inland Empire’s white-hot warehousing sector cools (Feb. 22, 2024)",
        url: "https://patch.com/california/banning-beaumont/inland-empires-white-hot-warehousing-sector-cools"
      },
      {
        label: "NPR: Prime farmland in Ontario, Calif., is being overtaken by warehouses (Apr. 2022)",
        url: "https://www.npr.org/transcripts/1093006047"
      },
      {
        label: "California State Board of Equalization: Change in Ownership FAQs",
        url: "https://www.boe.ca.gov/proptaxes/faqs/changeinownership.htm"
      },
      {
        label: "U.S. Small Business Administration: 504 loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans"
      }
    ]
  },
  mixedUse: {
    overview: [
      "A mixed-use building puts a business space (a shop, cafe, office or studio) and one or more homes in the same building. Usually the shop is on the street floor and the apartments are above. Many owners are ‘owner-operators’. They run their own business downstairs and live upstairs. That cuts out a commute and a second rent or mortgage.",
      "It is really two investments in one. The homes behave like ordinary rentals. But the storefront depends on foot traffic, the local economy and finding a business tenant. Commercial space can sit empty for years. In San Francisco, the Chronicle found 17 vacant storefronts (about 45 percent) in 20 new buildings near Market Street in 2017. That was true even though the apartments above were built and rented.",
      "Financing and rules are also mixed. Fannie Mae will back a home loan on a one-unit home with a business space only if the borrower lives there. The borrower must also own and run the business, and the property must be mainly residential. Larger buildings with a storefront and several apartments usually need a commercial loan. Zoning, building codes and insurance must also allow both uses."
    ],
    bestFor: [
      "Small-business owners who want to live where they work and stop paying separate rent for a shop or studio.",
      "Buyers who already understand both residential and small commercial leasing, or who will run the storefront themselves.",
      "Long-term holders in walkable town centers and older main streets where shops on the ground floor are normal.",
      "People who like being part of street life and don’t mind customers and neighbors knowing their routine."
    ],
    notFor: [
      "Buyers counting on the storefront rent to cover the mortgage. Commercial space can stay empty for years.",
      "People who need a standard home loan on a larger building. Most mixed-use buildings with several units need commercial financing.",
      "People who value privacy and quiet. Living above a bar, cafe or shop means noise, odors and little separation from work.",
      "First-time investors who have never handled a commercial lease, build-out or business tenant."
    ],
    costs: [
      "Down payment and loan costs. A home-style loan only fits owner-occupied, mainly residential properties (Fannie Mae). Otherwise, plan on a commercial loan. It usually needs a bigger down payment and has shorter terms.",
      "Vacancy in the storefront: you carry the building’s mortgage, taxes and insurance with no retail rent while you look for a tenant.",
      "Tenant improvements and build-out. New business tenants often need plumbing, electrical, venting or accessibility work before they can open.",
      "Commercial-grade insurance and code compliance (fire separation between the shop and homes, accessibility for the public area).",
      "City charges where they exist. San Francisco supervisors looked at a vacancy tax or fee on owners who leave storefronts empty (2017)."
    ],
    money: [
      "Fannie Mae buys loans on homes with a business space only if the borrower lives there as a principal residence. Examples of a business space are a day care, barber shop or doctor’s office. The borrower must also own and run the business, and the property must be mainly residential.",
      "Buildings with a storefront plus several apartments usually need a commercial or small-balance multifamily loan from a bank or credit union.",
      "An owner-operator business may qualify for an SBA 504 loan (up to $5.5 million) only if the business itself uses at least 51% of an existing building (60% if newly built). If apartments take up most of the space, it likely won’t qualify. SBA 504 loans cannot be used for speculation or investment in rental real estate.",
      "Buying with cash at a tax sale or foreclosure auction removes the risk of loan approval. But it leaves you to fund repairs and vacancy yourself."
    ],
    checklist: [
      "Confirm zoning allows both the business and the homes. Make sure existing units are legal (permits on file with the city or county).",
      "Read every lease: commercial lease length, rent, and who pays taxes and repairs. Check whether the residential units have tenant protections.",
      "Check how long the storefront has been empty and what similar storefronts on the block rent for.",
      "Have the building inspected for fire separation, plumbing, venting and electrical capacity. This is especially important if a restaurant or salon is below homes.",
      "Talk to a lender early. Ask whether the property qualifies for a residential loan or needs commercial financing.",
      "Get insurance quotes that cover both the commercial and residential parts."
    ],
    facts: [
      {
        text: "Fannie Mae will back loans on homes with a business use only if the borrower both owns and runs the business.",
        source: {
          label: "Fannie Mae Selling Guide B2-3-04: Special Property Eligibility Considerations (Mixed-Use Properties)",
          url: "https://selling-guide.fanniemae.com/sel/b2-3-04/special-property-eligibility-considerations"
        }
      },
      {
        text: "Fannie Mae also requires the property to be mainly a home.",
        source: {
          label: "Fannie Mae Selling Guide B2-3-04: Special Property Eligibility Considerations (Mixed-Use Properties)",
          url: "https://selling-guide.fanniemae.com/sel/b2-3-04/special-property-eligibility-considerations"
        }
      },
      {
        text: "In 2017 the San Francisco Chronicle counted 17 vacant storefronts, about 45 percent, in 20 new housing developments near Market Street.",
        source: {
          label: "San Francisco Chronicle: SF developers struggling to fill new ground-floor retail (Nov. 21, 2017)",
          url: "https://www.sfchronicle.com/bayarea/article/SF-developers-struggling-to-fill-new-ground-floor-12372889.php"
        }
      },
      {
        text: "SBA 504 loans (up to $5.5 million) are for operating businesses and cannot be used for speculation or investment in rental real estate.",
        source: {
          label: "U.S. Small Business Administration: 504 loans",
          url: "https://www.sba.gov/funding-programs/loans/504-loans"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A bar owner and her husband in Fells Point, Baltimore, Maryland",
        year: "2005",
        title: "Bar downstairs, home upstairs for decades",
        happened: "A couple bought a 203-year-old brick rowhouse in Baltimore’s Fells Point and opened a Scotch whisky bar on the first floor. They made their home on the two floors above, so they could skip a late-night drive home after closing. When the Baltimore Sun visited in 2005, the owner had held the building for 23 years.",
        lesson: "Owning the building you work in can keep a small business in place for decades. It also removes the commute and a second housing payment.",
        source: {
          label: "Baltimore Sun: Above it all (July 31, 2005)",
          url: "https://www.baltimoresun.com/2005/07/31/above-it-all-2/"
        }
      },
      {
        tone: "good",
        who: "A couple running a TV repair shop in Chisholm, Minnesota",
        year: "2021",
        title: "Shop on the ground floor, family upstairs",
        happened: "A couple bought a small downtown building in 1988. They ran an electronics repair shop on the ground floor and raised their children in the apartment above. They sold it in 1997 and bought it back in 2004. The wife said having the shop downstairs meant they never paid for day care. Her husband was home when the kids got back from school.",
        lesson: "For an owner-operator family, a building with the shop below and the home above can save on child care, commuting and rent. That holds as long as both uses fit the business.",
        source: {
          label: "Duluth News Tribune: Chisholm couple calls commercial space home (Oct. 31, 2021)",
          url: "https://www.duluthnewstribune.com/lifestyle/chisholm-couple-calls-commercial-space-home"
        }
      },
      {
        tone: "good",
        who: "A chef-owner and her family in Mount Airy, Philadelphia, Pennsylvania",
        year: "2007",
        title: "Sold the house, moved above the cafe",
        happened: "A chef worked 12-hour days at her own cafe and commuted twice a day. She and her spouse did the math. They sold their six-bedroom house and moved into a four-room apartment over the restaurant. The move gave the family more time together and cut a separate mortgage. But they had to adjust to a much smaller space.",
        lesson: "Living above your own business trades space and privacy for time and lower housing costs. So it suits owners who will actually work there every day.",
        source: {
          label: "Philadelphia Inquirer: Living above store? Works for them (Oct. 12, 2007)",
          url: "https://inquirer.com/philly/entertainment/20071012_Home__Works_for_them.html"
        }
      },
      {
        tone: "caution",
        who: "A saloon worker who lived above the bar in Towson, Maryland",
        year: "2005",
        title: "No privacy above the saloon",
        happened: "A part-time worker lived in the apartment above a saloon where he also worked. Regulars flagged him down whenever he stepped outside. Coworkers watched who came and went from his door, and he was pulled in for extra shifts. He finally moved out to a quieter townhouse, saying the setup is not for everyone.",
        lesson: "Before buying a building to live above a business, be honest with yourself. How much noise, contact and lack of privacy can you live with?",
        source: {
          label: "Baltimore Sun: Above it all (July 31, 2005)",
          url: "https://www.baltimoresun.com/2005/07/31/above-it-all-2/"
        }
      },
      {
        tone: "caution",
        who: "Developers of new apartment buildings on Market Street, San Francisco, California",
        year: "2017",
        title: "Apartments filled, storefronts stayed empty",
        happened: "A 700-unit apartment complex at 10th and Market streets announced a restaurant for its ground floor. The restaurant pulled out about 18 months later. More than four years after opening, all 13,500 square feet of its retail space was still empty. The Chronicle found the same problem across 17 storefronts in 20 new buildings nearby.",
        lesson: "Do not assume the ground-floor shop will rent quickly. Budget for years of empty commercial space, even when the homes above are full.",
        source: {
          label: "San Francisco Chronicle: SF developers struggling to fill new ground-floor retail (Nov. 21, 2017)",
          url: "https://www.sfchronicle.com/bayarea/article/SF-developers-struggling-to-fill-new-ground-floor-12372889.php"
        }
      },
      {
        tone: "caution",
        who: "The owner of a historic apartment-and-store building in downtown Los Angeles, California",
        year: "2026",
        title: "Store tenant gone, loan in default",
        happened: "A family whose discount clothing chain had gone bankrupt owned the Metropolitan building at 449 South Broadway. It had 88 apartments above a ground-floor store. After the store space went completely vacant, the owners defaulted on a roughly $32 million loan. This happened even though the apartments were 91 percent occupied.",
        lesson: "In mixed-use property, losing the one big commercial tenant can sink the whole building’s finances. Check how much of the income depends on the storefront.",
        source: {
          label: "The Real Deal: A DTLA mixed-use loan sent to special servicing after $32M default (March 26, 2026)",
          url: "https://therealdeal.com/la/2026/03/26/dtla-loan-sent-to-special-servicing/"
        }
      }
    ],
    sources: [
      {
        label: "Fannie Mae Selling Guide B2-3-04: Special Property Eligibility Considerations (Mixed-Use Properties)",
        url: "https://selling-guide.fanniemae.com/sel/b2-3-04/special-property-eligibility-considerations"
      },
      {
        label: "San Francisco Chronicle: SF developers struggling to fill new ground-floor retail (Nov. 21, 2017)",
        url: "https://www.sfchronicle.com/bayarea/article/SF-developers-struggling-to-fill-new-ground-floor-12372889.php"
      },
      {
        label: "U.S. Small Business Administration: 504 loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans"
      },
      {
        label: "SBA 504 occupancy rules (13 CFR 120.131)",
        url: "https://www.law.cornell.edu/cfr/text/13/120.131"
      },
      {
        label: "Baltimore Sun: Above it all (July 31, 2005)",
        url: "https://www.baltimoresun.com/2005/07/31/above-it-all-2/"
      },
      {
        label: "Duluth News Tribune: Chisholm couple calls commercial space home (Oct. 31, 2021)",
        url: "https://www.duluthnewstribune.com/lifestyle/chisholm-couple-calls-commercial-space-home"
      },
      {
        label: "Philadelphia Inquirer: Living above store? Works for them (Oct. 12, 2007)",
        url: "https://inquirer.com/philly/entertainment/20071012_Home__Works_for_them.html"
      },
      {
        label: "The Real Deal: A DTLA mixed-use loan sent to special servicing after $32M default (March 26, 2026)",
        url: "https://therealdeal.com/la/2026/03/26/dtla-loan-sent-to-special-servicing/"
      }
    ]
  },
  hotel: {
    overview: [
      "Owning a hotel or motel means owning a business that resells the same rooms every night. Income can rise fast when travel is strong and collapse when it stops. During the 78-day shutdown in 2020, Nevada’s 219 major casinos lost an estimated $6.2 billion. Some Las Vegas properties never reopened.",
      "Small motels are often run by owner-operator families who live on site. They do much of the work themselves: the front desk, laundry, cleaning and repairs. NPR reported that Indian immigrants and their children own roughly half of U.S. motels. Many were started by families living behind the lobby.",
      "Hotels are financed and valued as businesses, not homes. Lenders look at occupancy and room revenue. Franchise brands require upgrades, and old motels can hide huge repair bills. In California, cities bought many motels during the pandemic through Project Homekey. Some became housing quickly. Others needed millions in repairs or ended in foreclosure.",
      "Short-term rentals (renting a house or apartment by the night) are a related, small-scale version. Their income depends heavily on local rules. New York City’s 2023 registration law in effect ended most whole-apartment stays under 30 days. Arizona law, by contrast, says a city or town may not ban short-term rentals but may require permits. Arizona HOAs can still ban or limit rentals in their recorded rules (CC&Rs)."
    ],
    bestFor: [
      "Owner-operator families willing to live on site and work long hours at the desk, laundry and maintenance.",
      "Experienced hospitality operators who can manage staff, online booking sites, pricing and franchise standards.",
      "Well-funded buyers with cash reserves to ride out travel slumps (pandemics, recessions, convention slowdowns).",
      "Buyers who plan a change of use (for example, motel to apartments). They should check zoning, building codes and repair costs first."
    ],
    notFor: [
      "Passive investors looking for steady, low-effort rent. A motel is a seven-day-a-week business.",
      "Buyers who can’t survive months of low occupancy. Income falls right away when travel drops.",
      "Anyone buying an old motel without a full inspection. Plumbing, electrical and window replacements can cost millions.",
      "Short-term rental buyers in cities that ban or tightly limit nightly rentals. Also buyers who haven’t checked local permit rules."
    ],
    costs: [
      "Staff, utilities, laundry, supplies, booking-site commissions and property management. These continue even when rooms are empty.",
      "Franchise fees and required brand upgrades (property improvement plans) for branded hotels.",
      "Major repairs on older buildings. A Los Angeles motel bought for $9 million in 2020 needed new windows, plumbing and electrical. After nearly $3 million, it was still vacant in 2026 (CalMatters).",
      "Debt service on commercial loans that come due. In 2023 the owner of two large San Francisco hotels stopped paying a $725 million loan.",
      "Local taxes and licenses: hotel occupancy (transient lodging) taxes and short-term rental permits. Arizona cities may require a local permit or license for short-term rentals."
    ],
    money: [
      "Hotels are usually financed with commercial loans based on the property’s income (occupancy and room revenue). The loan is not based on the buyer’s paycheck.",
      "Owner-operated hotels and motels may use SBA 504 loans (up to $5.5 million, 10- to 25-year terms) because they are operating businesses. 504 loans cannot be used for speculation or rental real estate.",
      "Large hotel loans are often non-recourse loans that come due on a set date. If values fall, owners may hand the property back to the lender. Park Hotels & Resorts planned to do that with two San Francisco hotels in 2023.",
      "Government buyers have been a real exit in California. Project Homekey accounted for $890 million of hotel sales in the state in 2020."
    ],
    checklist: [
      "Get at least three years of the property’s real occupancy, room rates and expenses. Use tax returns and booking reports, not just a broker sheet.",
      "Inspect everything: roof, plumbing, electrical, windows, fire and life-safety systems, and accessibility.",
      "Check franchise agreements, required upgrades and any transfer fees if the hotel is branded.",
      "Confirm zoning and local rules for hotels, extended stays or short-term rentals, including permits and occupancy taxes.",
      "Stress-test the budget for a slump. How many months could you pay the loan with half the rooms empty?",
      "If converting the property to housing, price the repairs with a contractor before you buy, not after."
    ],
    facts: [
      {
        text: "During Nevada’s 78-day casino shutdown in 2020, the state’s 219 major casinos lost an estimated $6.2 billion.",
        source: {
          label: "Las Vegas Review-Journal (via Hawaii Tribune-Herald): Four years ago, Las Vegas’ casinos shut down for 78 days. The fallout was brutal (March 16, 2024)",
          url: "https://www.hawaiitribune-herald.com/?p=318350"
        }
      },
      {
        text: "Nevada gaming revenue later hit records, $15.5 billion in 2023.",
        source: {
          label: "Las Vegas Review-Journal (via Hawaii Tribune-Herald): Four years ago, Las Vegas’ casinos shut down for 78 days. The fallout was brutal (March 16, 2024)",
          url: "https://www.hawaiitribune-herald.com/?p=318350"
        }
      },
      {
        text: "California’s Project Homekey accounted for $890 million of hotel sales in 2020.",
        source: {
          label: "Spectrum News 1: Project Homekey makes up most of California’s hotel sales (Feb. 23, 2021)",
          url: "https://spectrumnews1.com/ca/orange-county/business/2021/02/22/project-homekey-makes-up-most-of-california-s-hotel-sales"
        }
      },
      {
        text: "A state auditor estimated Homekey’s average cost at $144,000 per unit.",
        source: {
          label: "CalMatters (via KQED): Did Newsom’s $3.8 billion hotels-to-housing program pay off? (May 7, 2026)",
          url: "https://www.kqed.org/news/12082668/did-newsoms-3-8-billion-hotels-to-housing-program-pay-off"
        }
      },
      {
        text: "Arizona state law says a city or town may not prohibit vacation rentals or short-term rentals. It may regulate them, including with permits.",
        source: {
          label: "Arizona Revised Statutes 9-500.39: Limits on regulation of vacation rentals and short-term rentals",
          url: "https://www.azleg.gov/ars/9/00500-39.htm"
        }
      },
      {
        text: "When New York City began enforcing its short-term rental registration law in September 2023, only 257 hosts on Airbnb had been approved.",
        source: {
          label: "THE CITY (via New York Amsterdam News): Airbnb’s sidelined in NYC. That probably won’t stop illegal short-term rentals. (Sept. 5, 2023)",
          url: "https://amsterdamnews.com/news/2023/09/05/airbnbs-sidelined-in-nyc-that-probably-wont-stop-illegal-short-term-rentals/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "An immigrant family that started with a small motel in rural Pennsylvania",
        year: "2016",
        title: "From living behind the lobby to a hotel company",
        happened: "Hasu P. Shah, a former electrical engineer, and his family lived behind the lobby of the 23-room Red Rose Motel. It was one of their first properties, and they did chores like mowing and skimming the pool. They kept buying hotels. By 2016, the company that grew from that motel, Hersha Hospitality Trust, owned 52 hotels and was worth $2.5 billion.",
        lesson: "Small motels can suit hard-working owner-operator families who live on site, keep costs low and reinvest over many years. Growing to 52 hotels is a rare outcome, not a typical one.",
        source: {
          label: "NPR: Here to stay: How Indian-born innkeepers revolutionized America’s motels (March 5, 2016)",
          url: "https://www.npr.org/2016/03/05/469180918/here-to-stay-how-indian-born-innkeepers-revolutionized-americas-motels"
        }
      },
      {
        tone: "good",
        who: "Hotel and motel owners selling during the pandemic in California",
        year: "2020",
        title: "Selling motels to the state’s Homekey program",
        happened: "The pandemic emptied hotels in 2020, and sales fell sharply nationwide. But California’s Project Homekey funded cities and counties to buy motels for homeless housing. A hotel broker said the program gave owners who wanted to sell a buyer at the prices they expected. Homekey made up $890 million in California hotel sales that year.",
        lesson: "A government or nonprofit buyer can be a real exit for a motel owner. But the state paid only up to the appraised value.",
        source: {
          label: "Spectrum News 1: Project Homekey makes up most of California’s hotel sales (Feb. 23, 2021)",
          url: "https://spectrumnews1.com/ca/orange-county/business/2021/02/22/project-homekey-makes-up-most-of-california-s-hotel-sales"
        }
      },
      {
        tone: "caution",
        who: "A city and nonprofit converting a motel in Gardena, Los Angeles County, California",
        year: "2020",
        title: "A $9 million motel that stayed empty for five years",
        happened: "The City of Los Angeles bought a Travelodge in Gardena for $9 million. The nonprofit taking it over saw only online photos and basic inspection reports first. A consultant estimated about $50,000 to start moving people in. The motel turned out to need all new windows, plumbing and electrical. After nearly $3 million and more than five years, it was still vacant in 2026.",
        lesson: "Inspect an old motel fully and price repairs with a contractor before buying. Photos of the surface hide the costliest problems.",
        source: {
          label: "CalMatters (via KQED): Did Newsom’s $3.8 billion hotels-to-housing program pay off? (May 7, 2026)",
          url: "https://www.kqed.org/news/12082668/did-newsoms-3-8-billion-hotels-to-housing-program-pay-off"
        }
      },
      {
        tone: "caution",
        who: "Residents and owners of a converted motel in San Bernardino, California",
        year: "2024",
        title: "Converted motel lost to foreclosure",
        happened: "A developer renovated the All Star Lodge in downtown San Bernardino. It opened as Homekey housing in late 2022. Two years later the bank foreclosed. No affordable-housing restriction had been recorded on the property. So the new owner told tenants it would quadruple the rent.",
        lesson: "Motel conversions carry heavy debt and the risk that plans go wrong. Before investing in or lending on one, check the operator’s finances and recorded deed restrictions.",
        source: {
          label: "CalMatters (via KQED): Did Newsom’s $3.8 billion hotels-to-housing program pay off? (May 7, 2026)",
          url: "https://www.kqed.org/news/12082668/did-newsoms-3-8-billion-hotels-to-housing-program-pay-off"
        }
      },
      {
        tone: "caution",
        who: "The owner of San Francisco’s largest hotel and another big downtown hotel, California",
        year: "2023",
        title: "Hotel owner stops paying a $725 million loan",
        happened: "Park Hotels & Resorts stopped paying a $725 million loan on two hotels. They were the 1,921-room Hilton San Francisco Union Square and the 1,024-room Parc 55. The company pointed to record office vacancy, street conditions, a slow return to offices and a weak convention calendar. It expected the hotels to leave its portfolio.",
        lesson: "Hotel values depend on the health of the whole local market. A downtown slump can wipe out an owner’s equity, even in famous properties.",
        source: {
          label: "KTVU FOX 2: Investment firm stops paying $725M loan on 2 of San Francisco’s largest downtown hotels (June 5, 2023)",
          url: "https://www.ktvu.com/news/owner-to-stop-paying-725m-loan-on-2-of-san-franciscos-largest-downtown-hotels"
        }
      },
      {
        tone: "caution",
        who: "Casino-hotel owners in Las Vegas, Nevada",
        year: "2020",
        title: "78 days closed, some never reopened",
        happened: "Nevada’s governor ordered all casinos closed on March 17, 2020, and they stayed closed for 78 days. Most big Strip resorts reopened on June 4, 2020. But Red Rock Resorts never reopened Texas Station, Fiesta Rancho or Fiesta Henderson, which were later sold and torn down. Boyd Gaming’s Eastside Cannery never returned either.",
        lesson: "A hotel’s income can drop to zero overnight. Owners need reserves and loan terms that can survive a long closure.",
        source: {
          label: "Las Vegas Review-Journal (via Hawaii Tribune-Herald): Four years ago, Las Vegas’ casinos shut down for 78 days. The fallout was brutal (March 16, 2024)",
          url: "https://www.hawaiitribune-herald.com/?p=318350"
        }
      },
      {
        tone: "caution",
        who: "A homeowner who rented rooms in his Bronx townhouse, New York City (short-term rental)",
        year: "2023",
        title: "New registration law puts a host’s income on hold",
        happened: "New York City’s Local Law 18 took effect in September 2023. Hosts renting for under 30 days had to register, live in the home during stays and host no more than two guests. A Bronx host who had rented space since 2011 met the rules. But he was still waiting for approval as Airbnb blocked new bookings. He said the income had helped him pay his mortgage.",
        lesson: "Short-term rental income can vanish when a city changes its rules. Never buy a property that only works as a nightly rental without checking local law.",
        source: {
          label: "Spectrum News NY1: New law cracking down on short-term rentals takes effect (Sept. 3, 2023)",
          url: "https://ny1.com/nyc/all-boroughs/news/2023/09/03/new-law-cracks-down-on-short-term-rentals"
        }
      }
    ],
    sources: [
      {
        label: "Las Vegas Review-Journal (via Hawaii Tribune-Herald): Four years ago, Las Vegas’ casinos shut down for 78 days. The fallout was brutal (March 16, 2024)",
        url: "https://www.hawaiitribune-herald.com/?p=318350"
      },
      {
        label: "Spectrum News 1: Project Homekey makes up most of California’s hotel sales (Feb. 23, 2021)",
        url: "https://spectrumnews1.com/ca/orange-county/business/2021/02/22/project-homekey-makes-up-most-of-california-s-hotel-sales"
      },
      {
        label: "CalMatters (via KQED): Did Newsom’s $3.8 billion hotels-to-housing program pay off? (May 7, 2026)",
        url: "https://www.kqed.org/news/12082668/did-newsoms-3-8-billion-hotels-to-housing-program-pay-off"
      },
      {
        label: "Arizona Revised Statutes 9-500.39: Limits on regulation of vacation rentals and short-term rentals",
        url: "https://www.azleg.gov/ars/9/00500-39.htm"
      },
      {
        label: "THE CITY (via New York Amsterdam News): Airbnb’s sidelined in NYC. That probably won’t stop illegal short-term rentals. (Sept. 5, 2023)",
        url: "https://amsterdamnews.com/news/2023/09/05/airbnbs-sidelined-in-nyc-that-probably-wont-stop-illegal-short-term-rentals/"
      },
      {
        label: "NPR: Here to stay: How Indian-born innkeepers revolutionized America’s motels (March 5, 2016)",
        url: "https://www.npr.org/2016/03/05/469180918/here-to-stay-how-indian-born-innkeepers-revolutionized-americas-motels"
      },
      {
        label: "KTVU FOX 2: Investment firm stops paying $725M loan on 2 of San Francisco’s largest downtown hotels (June 5, 2023)",
        url: "https://www.ktvu.com/news/owner-to-stop-paying-725m-loan-on-2-of-san-franciscos-largest-downtown-hotels"
      },
      {
        label: "Spectrum News NY1: New law cracking down on short-term rentals takes effect (Sept. 3, 2023)",
        url: "https://ny1.com/nyc/all-boroughs/news/2023/09/03/new-law-cracks-down-on-short-term-rentals"
      },
      {
        label: "CalMatters: Can Newsom use the pandemic to beat back homelessness? (Nov. 2020)",
        url: "https://calmatters.org/housing/2020/11/newsom-pandemic-beat-homelessness/"
      },
      {
        label: "U.S. Small Business Administration: 504 loans",
        url: "https://www.sba.gov/funding-programs/loans/504-loans"
      }
    ]
  },
  selfStorage: {
    overview: [
      "A self-storage facility rents lockable units, usually month to month, to people and small businesses. There are few toilets, kitchens or tenants calling at midnight, which is why many investors like it. But it is still a business. Someone has to rent units, collect payments, deal with late payers and keep the site secure.",
      "Demand follows moving, downsizing and life changes. Storage boomed in the pandemic. By 2022, more than 131 million square feet of new space was planned or under construction nationwide. Then demand slowed and rents fell. The Wall Street Journal reported record rent cuts in 2023. In 2026, advertised rates were still falling in most large metros, including Las Vegas.",
      "When tenants stop paying, owners can sell what is in the unit. But they can do so only by following their state’s self-storage lien law step by step. Mistakes can lead to lawsuits, so owners need good records and notices."
    ],
    bestFor: [
      "Investors who want a business with simple buildings and fewer repair calls than apartments. They must be willing to learn local lien and lease rules.",
      "Owners of well-located land in growing areas with limited existing storage supply.",
      "Buyers of existing, already-full facilities who can see years of real rent and occupancy history.",
      "Patient, well-funded investors who can wait through a slow lease-up period for a new facility."
    ],
    notFor: [
      "Builders in markets with lots of new storage under construction. Supply surges push rents down.",
      "Investors who hand money to a promoter (syndicator) without checking fees, conflicts and track record.",
      "Anyone who assumes storage runs itself. Marketing, pricing, collections and security still take work.",
      "Buyers using short-term, high-rate construction loans with thin cash reserves."
    ],
    costs: [
      "Land and construction, or the purchase price of an existing facility.",
      "Lease-up time: a new facility can take years to fill, while loan payments start right away. A 949-unit project in Yonkers, New York, ended in a foreclosure filing in 2024 after higher interest rates changed its numbers.",
      "Property taxes, insurance, security systems, gates, cameras and lighting.",
      "Management and marketing (on-site staff or a management company, online advertising).",
      "Falling street rents during oversupply. National advertised rates fell 1.9% year over year in August 2026 (Yardi Matrix, reported by Scotsman Guide)."
    ],
    money: [
      "Most facilities are bought or built with commercial loans or construction loans based on the facility’s expected income.",
      "Construction loans come due on a fixed date. If the facility is not finished or not leased up by then, the lender can foreclose. Parkview Financial did that on a Yonkers, New York, project in 2024.",
      "Many small investors buy in through syndications (pooled investments). Check fees and conflicts carefully. A San Diego storage syndicator’s owners pleaded guilty to wire-fraud conspiracy in 2015."
    ],
    checklist: [
      "Count competing facilities and new ones planned within a few miles (city planning and permit records).",
      "Get the real rent roll, occupancy and delinquency history for at least three years.",
      "Compare in-place rents (what current tenants pay) with street rents (what new tenants are offered).",
      "Confirm zoning allows self-storage and check any design or landscaping requirements.",
      "Learn your state’s self-storage lien law before you ever sell the contents of a unit.",
      "If investing through a syndicator, read the offering documents for fees, related-party deals and how returns are paid."
    ],
    facts: [
      {
        text: "In 2022, more than 131 million square feet of storage space was planned or under construction nationwide.",
        source: {
          label: "The Real Deal: Self storage still rising after pandemic surge (May 16, 2022)",
          url: "https://therealdeal.com/2022/05/16/self-storage-still-rising-after-pandemic-surge/"
        }
      },
      {
        text: "In July 2023 the Wall Street Journal reported that storage facilities were cutting rents by record amounts.",
        source: {
          label: "MBA NewsLink summary of Wall Street Journal: Self-storage rents fall record amount as pandemic boom cools (July 25, 2023)",
          url: "https://newslink.mba.org/?p=206715"
        }
      },
      {
        text: "In August 2026, national advertised storage rates fell 1.9% year over year to an average of $16.39 per square foot.",
        source: {
          label: "Scotsman Guide: Self-storage woes continue as sector works through oversupply (Sept. 25, 2026)",
          url: "https://www.scotsmanguide.com/news/self-storage-woes-continue-as-sector-works-through-oversupply/"
        }
      },
      {
        text: "Las Vegas was among the cities with the biggest rate losses for non-climate-controlled units. Salt Lake City was one of only four large metros with a small increase.",
        source: {
          label: "Scotsman Guide: Self-storage woes continue as sector works through oversupply (Sept. 25, 2026)",
          url: "https://www.scotsmanguide.com/news/self-storage-woes-continue-as-sector-works-through-oversupply/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "Two business partners in El Cajon, California",
        year: "1972",
        title: "Two partners, $50,000, and orange doors",
        happened: "B. Wayne Hughes and a partner put up $25,000 each and opened their first Public Storage location in El Cajon. They painted the unit doors bright orange so drivers on a nearby highway would notice. The business grew into Public Storage, with more than 2,500 locations. It turned their $50,000 into a multi-billion dollar fortune.",
        lesson: "This is one of the industry’s biggest successes, not a typical result. It came from an early start, visible sites and decades of growth.",
        source: {
          label: "USC Today: Self-storage pioneer and USC Trustee B. Wayne Hughes, 87 (Aug. 25, 2021)",
          url: "https://today.usc.edu/?p=21658"
        }
      },
      {
        tone: "good",
        who: "A graduate student turned developer (company later based in Salt Lake City, Utah)",
        year: "1977",
        title: "A research project became a Utah-based storage giant",
        happened: "Ken Woolley got interested in self-storage through a research project as a Stanford graduate student. He built his first facility in Billings, Montana, in May 1977. His company, Extra Space Storage, went public in 2004. At the time, it was the largest IPO by a Utah-headquartered company. By 2017 it had 1,441 locations.",
        lesson: "Study demand before you build. This is a rare outcome: most small operators never grow like this, and new facilities can take years to fill.",
        source: {
          label: "Inside Self-Storage: Self-storage REIT Extra Space celebrates 40 years in business (June 1, 2017)",
          url: "https://www.insideselfstorage.com/self-storage-investing-real-estate/self-storage-reit-extra-space-celebrates-40-years-in-business"
        }
      },
      {
        tone: "caution",
        who: "Investors in a San Diego, California, storage syndication company",
        year: "2015",
        title: "Storage investors defrauded by their own syndicator",
        happened: "A father and two sons ran Equity Based Services, a San Diego company that bought and managed storage facilities. In 2015 they pleaded guilty to federal wire-fraud conspiracy. They were accused of charging excessive fees, mixing money between projects and raising more than needed. They had promised returns of up to 8 percent. Some investors said it was set up like a Ponzi scheme, which the owners’ lawyer disputed. The father was sentenced to six months in prison.",
        lesson: "Before investing in a storage deal through a promoter, check fees, conflicts and where the money goes. ‘Guaranteed’ returns are a red flag.",
        source: {
          label: "Inside Self-Storage: Equity Based Services owners admit to federal wire-fraud conspiracy in self-storage investments (2015; updated Jan. 11, 2016)",
          url: "https://www.insideselfstorage.com/companies-and-products/equity-based-services-owners-admit-federal-wire-fraud-conspiracy-self-storage"
        }
      },
      {
        tone: "caution",
        who: "A family building a self-storage facility on its old industrial site in Yonkers, New York",
        year: "2024",
        title: "Construction loan due, facility unfinished",
        happened: "A family had owned a site for more than three decades. In 2022 it took an $18.3 million construction loan to build an eight-story, 949-unit storage facility. It was due to finish in late 2023. But higher interest rates changed the numbers, and a hoped-for equity partner never joined. The lender started a foreclosure in late 2024.",
        lesson: "New storage projects need cash reserves and realistic timelines. Rising rates and slow lease-up can turn a construction loan into a foreclosure.",
        source: {
          label: "Inside Self-Storage: Foreclosure filed on Yonkers, NY, self-storage development (Dec. 2, 2024)",
          url: "https://www.insideselfstorage.com/self-storage-development/foreclosure-filed-on-yonkers-ny-self-storage-development"
        }
      }
    ],
    sources: [
      {
        label: "The Real Deal: Self storage still rising after pandemic surge (May 16, 2022)",
        url: "https://therealdeal.com/2022/05/16/self-storage-still-rising-after-pandemic-surge/"
      },
      {
        label: "MBA NewsLink summary of Wall Street Journal: Self-storage rents fall record amount as pandemic boom cools (July 25, 2023)",
        url: "https://newslink.mba.org/?p=206715"
      },
      {
        label: "Scotsman Guide: Self-storage woes continue as sector works through oversupply (Sept. 25, 2026)",
        url: "https://www.scotsmanguide.com/news/self-storage-woes-continue-as-sector-works-through-oversupply/"
      },
      {
        label: "USC Today: Self-storage pioneer and USC Trustee B. Wayne Hughes, 87 (Aug. 25, 2021)",
        url: "https://today.usc.edu/?p=21658"
      },
      {
        label: "Inside Self-Storage: Self-storage REIT Extra Space celebrates 40 years in business (June 1, 2017)",
        url: "https://www.insideselfstorage.com/self-storage-investing-real-estate/self-storage-reit-extra-space-celebrates-40-years-in-business"
      },
      {
        label: "Inside Self-Storage: Equity Based Services owners admit to federal wire-fraud conspiracy in self-storage investments (2015; updated Jan. 11, 2016)",
        url: "https://www.insideselfstorage.com/companies-and-products/equity-based-services-owners-admit-federal-wire-fraud-conspiracy-self-storage"
      },
      {
        label: "Inside Self-Storage: Foreclosure filed on Yonkers, NY, self-storage development (Dec. 2, 2024)",
        url: "https://www.insideselfstorage.com/self-storage-development/foreclosure-filed-on-yonkers-ny-self-storage-development"
      }
    ]
  },
  land: {
    overview: [
      "Raw land is property with no house or building on it. It may cost less to keep up than a building (no tenants, few repairs), but taxes, loan interest, weed and fire rules, access and security still cost money. But it usually earns nothing until it is built on, farmed, leased or sold. Its value depends on access, water, utilities, zoning and growth nearby.",
      "Many cheap lots are cheap for a reason, including lots sold at county tax sales. Reasons include no legal road access, no water or power, steep or flood-prone ground, or rules that prevent building. In Arizona, a 1980 law requires subdivisions of six or more lots inside the state’s groundwater Active Management Areas (such as the Phoenix area) to prove a 100-year water supply. In Arizona, outside those areas, lots can usually be sold even when the water supply is inadequate, as long as that is disclosed, and lot splits of five or fewer avoided the rule. Arizona passed an ‘Ag-to-Urban’ law in 2025 that lets some builders in the Phoenix and Pinal areas use water credits from retired farmland. In Arizona, homes in Rio Verde Foothills lost their hauled water supply from Scottsdale in 2023.",
      "Land also attracts scams. For decades, promoters sold desert lots in California City sight unseen, with promises of future growth. Today the FBI warns of impostors who pose as the owners of vacant land. They sell it to buyers who never meet them. Land can pay off well for patient owners when a town grows toward it. But that can take decades."
    ],
    bestFor: [
      "Patient, long-term holders who can pay taxes for years without income.",
      "Buyers with a specific plan (a home, a farm, a business site). They should confirm access, water, power and zoning first.",
      "Local buyers who can visit the land and know the area’s growth plans.",
      "Neighbors buying an adjoining parcel to expand their own property."
    ],
    notFor: [
      "Anyone buying sight unseen from an online ad, or from a seller they cannot meet or verify.",
      "Buyers who need income soon. Vacant land usually produces none.",
      "Buyers counting on a well or a water hauler in areas with groundwater limits.",
      "Tax-sale bidders who haven’t checked whether the lot has legal access and can be built on."
    ],
    costs: [
      "Property taxes every year, with no rent to pay them.",
      "Getting legal and physical access (an easement or a road) if the parcel is landlocked.",
      "Utilities: extending power lines, drilling a well, or connecting water and sewer. In Rio Verde Foothills, hauled water was projected to cost $20 per 1,000 gallons, versus about $1.65 in Scottsdale.",
      "Survey, title insurance, soil and percolation (septic) tests, and flood-zone checks.",
      "Quiet-title or legal costs after a tax-sale purchase if the title is unclear."
    ],
    money: [
      "Most land is bought with cash or seller financing. Banks and credit unions lend on raw land less often. They usually want a larger down payment than for a home.",
      "Tax-sale and auction lots must usually be paid for in full within a short time after the sale.",
      "If you finance through the seller, use a title company. Record the deed or contract so you are protected."
    ],
    checklist: [
      "Visit the land and verify the seller. Meet in person or confirm identity through a title company. Be wary of rushed, below-market sales by email or text only (FBI warning signs).",
      "Confirm legal access: a recorded road or easement, not just a dirt track.",
      "Confirm water. In Arizona, check the state water department rules for the area; outside its Active Management Areas, lots can often be sold even when water is inadequate, so read the water disclosure. Ask whether a well is allowed and how deep nearby wells go.",
      "Check zoning, minimum lot size and whether a building permit is possible.",
      "Look up the flood zone on FEMA flood maps and check for wetlands, steep slopes or other limits.",
      "Buy title insurance and get a survey. At tax sales, read the county’s terms about what the deed does and doesn’t guarantee."
    ],
    facts: [
      {
        text: "Arizona’s 1980 groundwater law requires subdivisions with six or more lots in its groundwater management areas, such as the Phoenix area, to prove a 100-year water supply.",
        source: {
          label: "New York Times (via Boston Globe): An Arizona suburb’s water is cut off, leading to a worst-case scenario for homeowners (Jan. 16, 2023)",
          url: "https://www.bostonglobe.com/2023/01/16/nation/an-arizona-suburbs-water-is-cut-leading-worst-case-scenario-homeowners/"
        }
      },
      {
        text: "Builders who split parcels into five or fewer lots avoided that requirement (Maricopa County, Arizona).",
        source: {
          label: "New York Times (via Boston Globe): An Arizona suburb’s water is cut off, leading to a worst-case scenario for homeowners (Jan. 16, 2023)",
          url: "https://www.bostonglobe.com/2023/01/16/nation/an-arizona-suburbs-water-is-cut-leading-worst-case-scenario-homeowners/"
        }
      },
      {
        text: "In June 2023 Arizona stopped approving new groundwater-based subdivisions on the edges of metro Phoenix, such as parts of Queen Creek and Buckeye.",
        source: {
          label: "Associated Press (via KPRC Click2Houston): Arizona to restrict some new construction in fast-growing areas of Phoenix reliant on groundwater (June 1, 2023)",
          url: "https://www.click2houston.com/business/2023/06/02/arizona-to-restrict-some-new-construction-in-fast-growing-areas-of-phoenix-reliant-on-groundwater/"
        }
      },
      {
        text: "Rio Verde Foothills, Arizona, residents were projected to pay $20 per 1,000 gallons of hauled water.",
        source: {
          label: "NBC News: Faucets poised to run dry for hundreds of Arizona residents by year’s end (Nov. 17, 2022)",
          url: "https://www.nbcnews.com/news/us-news/faucets-poised-run-dry-hundreds-arizona-residents-years-end-rcna57550"
        }
      },
      {
        text: "The FBI reported a 500% increase in vacant land fraud over four years.",
        source: {
          label: "ABC11 / ABC News: FBI warns scammers are posing as landowners to sell properties to unsuspecting buyers (Sept. 26, 2024)",
          url: "https://abc11.com/fbi-warns-scammers-are-posing-as-landowners-to-sell-properties-to-u/15359383/"
        }
      },
      {
        text: "More than 73,000 people bought land in California City, California, from its original developer.",
        source: {
          label: "LAist: 60 years of deception and land sales in California City: 7 takeaways from my investigative podcast (Sept. 2, 2020)",
          url: "https://laist.com/2020/09/02/california_city_podcast_investigation_lawsuit_takeaways.php"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "Two investors who bought a huge ranch east of Reno, Storey County, Nevada",
        year: "2014",
        title: "A 1998 land bet that landed Tesla 16 years later",
        happened: "In 1998, Reno’s casino economy was struggling. Developer Lance Gilman and a partner bought a parcel east of town larger than the city of Las Vegas. They planned an industrial park. They paid for roads, water and power and worked with county leaders. Sixteen years later, Tesla chose the park for its battery factory. By then Gilman’s park had more than 165 companies.",
        lesson: "Land can pay off hugely, but this took deep pockets, roads, water and power, and 16 years. It is a rare outcome: most land bets don’t end with a famous tenant.",
        source: {
          label: "Las Vegas Sun: The rise of Reno: Northern Nevada is booming; what can we learn? (Sept. 28, 2014)",
          url: "https://lasvegassun.com/news/2014/sep/28/rise-reno-northern-nevada-booming-what-can-we-lear/"
        }
      },
      {
        tone: "good",
        who: "A longtime farm owner in Kentucky",
        year: "2025",
        title: "Farm worth five times its price after 30 years",
        happened: "A diversified farmer had bought a 250-acre farm 30 years earlier. He received a $10 million offer from a data center developer, five times what he had paid. He turned it down. Around the country, landowners near growth areas have received offers above $120,000 per acre.",
        lesson: "The jump came from a data-center boom nearby, which few owners can count on. Plan as if your land may only keep up with inflation.",
        source: {
          label: "University of Illinois Farm Policy News: Farmers increasingly rejecting data center bids for land (March 2026)",
          url: "https://farmpolicynews.illinois.edu/2026/03/farmers-increasingly-rejecting-data-center-bids-for-land/"
        }
      },
      {
        tone: "caution",
        who: "Homeowners who built on split desert lots in Rio Verde Foothills, Arizona",
        year: "2023",
        title: "Land without a water supply",
        happened: "Cheap land and lot splits that avoided Arizona’s 100-year water rule led to a home-building boom outside Scottsdale. The area had no fixed water supply. Residents relied on haulers filling up in Scottsdale. In January 2023 the city cut off sales to roughly 500 to 700 homes. Families flushed toilets with rainwater, used paper plates and faced much higher water costs.",
        lesson: "Before buying land in the desert, confirm a legal, lasting water source. A well or hauled water is not a guarantee.",
        source: {
          label: "New York Times (via Boston Globe): An Arizona suburb’s water is cut off, leading to a worst-case scenario for homeowners (Jan. 16, 2023)",
          url: "https://www.bostonglobe.com/2023/01/16/nation/an-arizona-suburbs-water-is-cut-leading-worst-case-scenario-homeowners/"
        }
      },
      {
        tone: "caution",
        who: "Tens of thousands of lot buyers in California City, Kern County, California",
        year: "1977",
        title: "Desert lots sold on promises of a boom",
        happened: "From the late 1950s on, a developer sold lots in a planned Mojave Desert city to more than 73,000 people. Many were recruited through a sales-training program. The developer promised the area would boom, but the growth never came. The Federal Trade Commission sued. In 1977 the company settled and was ordered to pay what was then the largest consumer refund in FTC history.",
        lesson: "Never buy land on a seller’s promise of future growth. Check what is actually built, planned and selling nearby.",
        source: {
          label: "LAist: 60 years of deception and land sales in California City: 7 takeaways from my investigative podcast (Sept. 2, 2020)",
          url: "https://laist.com/2020/09/02/california_city_podcast_investigation_lawsuit_takeaways.php"
        }
      },
      {
        tone: "caution",
        who: "Investors in ‘landbanking’ shares of California City desert land, California",
        year: "2019",
        title: "State says desert land shares were ‘near worthless’",
        happened: "A company that kept selling California City land later sold shares in large tracts of desert (‘landbanking’). It paid $2,000 referral rewards. In September 2019, the California Department of Business Oversight sued it for securities fraud and shut it down. The department called the land ‘near worthless real estate.’ A receiver was trying to sell the land to repay investors.",
        lesson: "Pooled land investments with referral bonuses and big growth promises are a warning sign. Check with your state securities regulator first.",
        source: {
          label: "LAist: 60 years of deception and land sales in California City: 7 takeaways from my investigative podcast (Sept. 2, 2020)",
          url: "https://laist.com/2020/09/02/california_city_podcast_investigation_lawsuit_takeaways.php"
        }
      },
      {
        tone: "caution",
        who: "A buyer of a vacant lot in Randolph, New Jersey",
        year: "2024",
        title: "Paid $70,000 to a fake owner",
        happened: "A man posed as the Canadian owner of a vacant lot. He hired a local agent, sent fake Ontario driver’s licenses and sold the land for $140,000. The buyer’s first $70,000 payment went through. Then the title company ran into trouble with the second payment and reached the real owners, a Texas couple. They had never agreed to sell. The FBI says vacant land fraud rose 500% in four years.",
        lesson: "Verify the seller’s identity on your own, especially when they won’t meet in person and the land is vacant. Use a title company and title insurance.",
        source: {
          label: "ABC11 / ABC News: FBI warns scammers are posing as landowners to sell properties to unsuspecting buyers (Sept. 26, 2024)",
          url: "https://abc11.com/fbi-warns-scammers-are-posing-as-landowners-to-sell-properties-to-u/15359383/"
        }
      }
    ],
    sources: [
      {
        label: "New York Times (via Boston Globe): An Arizona suburb’s water is cut off, leading to a worst-case scenario for homeowners (Jan. 16, 2023)",
        url: "https://www.bostonglobe.com/2023/01/16/nation/an-arizona-suburbs-water-is-cut-leading-worst-case-scenario-homeowners/"
      },
      {
        label: "Associated Press (via KPRC Click2Houston): Arizona to restrict some new construction in fast-growing areas of Phoenix reliant on groundwater (June 1, 2023)",
        url: "https://www.click2houston.com/business/2023/06/02/arizona-to-restrict-some-new-construction-in-fast-growing-areas-of-phoenix-reliant-on-groundwater/"
      },
      {
        label: "NBC News: Faucets poised to run dry for hundreds of Arizona residents by year’s end (Nov. 17, 2022)",
        url: "https://www.nbcnews.com/news/us-news/faucets-poised-run-dry-hundreds-arizona-residents-years-end-rcna57550"
      },
      {
        label: "ABC11 / ABC News: FBI warns scammers are posing as landowners to sell properties to unsuspecting buyers (Sept. 26, 2024)",
        url: "https://abc11.com/fbi-warns-scammers-are-posing-as-landowners-to-sell-properties-to-u/15359383/"
      },
      {
        label: "LAist: 60 years of deception and land sales in California City: 7 takeaways from my investigative podcast (Sept. 2, 2020)",
        url: "https://laist.com/2020/09/02/california_city_podcast_investigation_lawsuit_takeaways.php"
      },
      {
        label: "Las Vegas Sun: The rise of Reno: Northern Nevada is booming; what can we learn? (Sept. 28, 2014)",
        url: "https://lasvegassun.com/news/2014/sep/28/rise-reno-northern-nevada-booming-what-can-we-lear/"
      },
      {
        label: "University of Illinois Farm Policy News: Farmers increasingly rejecting data center bids for land (March 2026)",
        url: "https://farmpolicynews.illinois.edu/2026/03/farmers-increasingly-rejecting-data-center-bids-for-land/"
      }
    ]
  }
};
