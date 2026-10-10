// Why you would choose each property type, and why you wouldn’t: from different investors’ points of view, with real examples.
// Every example is from a source we read (see each point’s source). Researched 2026-10-02; made conditional (when each point holds, what to check) 2026-10-04.
// Points about one state start with that state’s name, so the lesson’s state filter shows them only to that state.

import type { WhyPoint } from './types';

export const PROPERTY_WHY = {
  singleFamily: {
    yes: [
      {
        who: "First-time investors with little cash",
        text: "It’s the easiest kind of property to understand and to finance. If you’ll really live in it, an owner-occupant loan can mean a small down payment. FHA generally requires establishing the home as your principal residence within 60 days and intending to continue occupancy for at least a year. Ask your lender about the requirements and any applicable exceptions before changing its use. Match the loan to your intended use: investment-property loans may finance a home you do not plan to occupy. For an owner-occupant loan, give the lender accurate occupancy plans and confirm the requirements.",
        example: "HUD says FHA loans allow a down payment as low as 3.5% of the price on 1–4 unit homes. This is for buyers who will live there.",
        source: {
          label: "HUD: Loans (FHA)",
          url: "https://www.hud.gov/helping-americans/loans"
        }
      },
      {
        who: "Long-term rental owners",
        text: "Once the home is rented, tax rules let you deduct the building’s wear and tear over time (not the land), which can shield part of the rent from income tax. How much that helps depends on your own taxes, so check with a tax professional.",
        example: "IRS Publication 527 says a residential rental building is depreciated over 27.5 years (the land part is not).",
        source: {
          label: "IRS Publication 527, Residential Rental Property",
          url: "https://www.irs.gov/publications/p527"
        }
      },
      {
        who: "Flippers and anyone who may need to sell",
        text: "You can sell a house to families who want a home, not just to other investors, so you’ll have the most buyers when it’s time to sell, as long as it’s priced for what local buyers can borrow. That pool shrinks when mortgage rates rise."
      },
      {
        who: "Small landlords in California",
        text: "California’s statewide rent cap can exempt a single home whose owner is not a REIT, a corporation, or an LLC with a corporate member. The exemption only works if the tenant gets the exact written notice the law requires.",
        example: "California Civil Code 1947.12(d)(5) exempts separately titled homes not owned by a REIT, a corporation or an LLC with a corporate member. For tenancies starting or renewed since July 1, 2020, the notice must be in the rental agreement.",
        source: {
          label: "California Civil Code § 1947.12",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12"
        }
      }
    ],
    no: [
      {
        who: "Investors buying government-owned homes",
        text: "Many government-owned homes go first to people who will live in them, and investors often only get a turn after that window closes, when the best homes may be gone. Check each listing’s investor bid date on the official site.",
        example: "For HUD homes listed since May 30, 2025, owner-occupants, government buyers and HUD-approved nonprofits get the first 15 days (5 days for homes marked “uninsured”). Investors can bid only after that (HUD Mortgagee Letter 2025-13).",
        source: {
          label: "HUD Mortgagee Letter 2025-13: 15-day exclusive listing period",
          url: "https://hud.gov/sites/dfiles/OCHCO/documents/2025-13hsgml.pdf"
        }
      },
      {
        who: "Investors who want steady income",
        text: "With only one tenant, an empty house means your rent drops to zero, but the mortgage, taxes and insurance do not. If the numbers only work with no empty months at all, walk away."
      },
      {
        who: "Buyers with thin savings",
        text: "Every repair is yours alone, and a new roof or air conditioner can wipe out several years of profit on one house. Before you buy, find out how old the roof and air conditioner are. If you couldn’t pay for one big repair from savings, wait."
      },
      {
        who: "Cash-flow investors in high-price areas",
        text: "In expensive markets the rent may not cover the mortgage, taxes and insurance, so you end up paying in each month and betting on the price going up. Compare real local rents with your full monthly cost first."
      }
    ]
  },
  condo: {
    yes: [
      {
        who: "First-time investors",
        text: "A condo or townhouse usually costs less than a detached house in the same area, so it can be a cheaper first rental. High or rising HOA dues can erase the savings, so add the dues to your monthly cost before you compare."
      },
      {
        who: "Hands-off owners and retirees",
        text: "The HOA usually handles the roof, outside walls and grounds, so you have fewer repairs to manage, but only if it has saved enough to pay for them. Read the reserve study and budget before you buy."
      },
      {
        who: "Long-term landlords in California",
        text: "California law stops HOAs from banning or unreasonably restricting long-term rentals. An HOA may still cap rentals, but not below 25% of the units, and it can ban stays of 30 days or less. Before buying, ask whether the rental limit is already full.",
        example: "California Civil Code 4741 bars HOA rules that limit renting to fewer than 25% of the units. It allows bans on rentals of 30 days or less.",
        source: {
          label: "California Civil Code § 4741",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4741"
        }
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "If the building needs big repairs and the HOA has not saved enough, owners can be billed a large special assessment on short notice. Ask in writing about planned assessments, and walk away if reserves are low and big repairs are near.",
        example: "In 2021, Champlain Towers South collapsed in Surfside, Florida, killing 98 people. Afterward Florida required inspections and reserve studies. Some associations hit owners with very large assessments.",
        source: {
          label: "News Service of Florida via WKMG ClickOrlando (Feb. 11, 2025)",
          url: "https://www.clickorlando.com/news/2025/02/11/florida-lawmakers-say-no-bailouts-for-condo-owners"
        }
      },
      {
        who: "Flippers and auction buyers",
        text: "If the building needs major repairs, many buyers cannot get a normal loan there, which makes the unit harder to sell and can lower its price. Before you buy, ask a lender whether the project qualifies.",
        example: "Fannie Mae’s Selling Guide lists condo projects needing critical repairs as ineligible for its loans.",
        source: {
          label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
          url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
        }
      },
      {
        who: "Investors who want control",
        text: "HOA fees and rules can change by board or member vote. You’re just one vote among many, and rising fees cut directly into your rent. Read recent board minutes to see where fees are heading."
      },
      {
        who: "Short-term rental investors in California",
        text: "In California, an HOA can still ban rentals of 30 days or less, so a vacation-rental plan may not be allowed. Read the CC&Rs before you buy.",
        example: "California Civil Code 4741(c) lets an HOA prohibit rentals of 30 days or less.",
        source: {
          label: "California Civil Code § 4741",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4741"
        }
      },
      {
        who: "Investors buying several units in one building",
        text: "If one owner holds too many units, buyers may not be able to get a normal loan in that building, which can make every unit harder to sell. Before you buy more than one, ask how many units each owner already holds.",
        example: "Fannie Mae won’t buy loans in projects where one owner holds more than 2 units (in projects of 11–20 units, or 5–10 units within a master association) or more than 20% of the units (in projects of 21 or more).",
        source: {
          label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
          url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
        }
      }
    ]
  },
  smallMultifamily: {
    yes: [
      {
        who: "First-time investors with little cash",
        text: "You can live in one unit and rent the others. That lets you use an owner-occupant loan with a small down payment while tenants help pay the mortgage. It only works if you really live there and the rents are real, so check the current leases before you count on them.",
        example: "HUD says FHA’s 3.5% minimum down payment is available on 1–4 unit properties.",
        source: {
          label: "HUD: Loans (FHA)",
          url: "https://www.hud.gov/helping-americans/loans"
        }
      },
      {
        who: "Investors who want steadier income",
        text: "With two to four units, one empty unit does not cut your rent to zero the way it would with a single house. The cushion is small, though: in a duplex, one empty unit still cuts the rent in half."
      },
      {
        who: "Owner-occupants in California",
        text: "In California, the statewide rent cap doesn’t apply to a duplex if you lived in one unit when the tenant moved in and you still live there. It does apply if either unit is an ADU or a junior ADU.",
        example: "California Civil Code 1947.12(d)(6) exempts a two-unit building when the owner lived in one unit at the start of the tenancy and still does, and neither unit is an ADU or junior ADU.",
        source: {
          label: "California Civil Code § 1947.12",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12"
        }
      }
    ],
    no: [
      {
        who: "FHA buyers of 3–4 units",
        text: "Lenders want proof you’ll have cash left over after closing, so the low down payment does not mean you can buy with almost nothing. Count closing costs and those savings before you make an offer.",
        example: "HUD Mortgagee Letter 2023-17 (Oct. 16, 2023) covers 3–4 unit FHA loans. It requires lenders to document reserves of three months’ mortgage payments after closing.",
        source: {
          label: "HUD Mortgagee Letter 2023-17",
          url: "https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-17hsgml.pdf"
        }
      },
      {
        who: "Owner-occupants",
        text: "You live next to your tenants, so late-night repair calls, noise and rent talks become part of your home life. If you want privacy from tenants, this may not be for you."
      },
      {
        who: "Investors (not living there) in California",
        text: "In California, a 2–4 unit building more than 15 years old that you don’t live in usually falls under the statewide rent cap. That limits how fast income can grow. Some cities have stricter rent control, so check the city too.",
        example: "The California Attorney General says yearly rent increases under state law are capped at 5% plus inflation, up to 10%.",
        source: {
          label: "California Attorney General: Limits on Rent Increases",
          url: "https://oag.ca.gov/rentcaps"
        }
      },
      {
        who: "Flippers",
        text: "Fewer people shop for a duplex or fourplex than for a house, so resale can take longer, and buyers often price it on rent rather than looks. Base your plan on the rent from the start."
      }
    ]
  },
  manufactured: {
    yes: [
      {
        who: "Investors with little cash",
        text: "A manufactured home costs about half as much per square foot to buy (not counting land) as a site-built house. That can make it a low-cost way to start, if you also have land or a lot rent you can afford.",
        example: "Census data for 2024: new manufactured homes averaged about $84 per square foot, and new site-built houses about $169 per square foot, not counting land. The manufactured-home price doesn’t include land or lot rent (national figures).",
        source: {
          label: "U.S. Census Bureau, Manufactured Housing Survey: Cost & Size Comparisons 2014–2024 (spreadsheet)",
          url: "https://www2.census.gov/programs-surveys/mhs/tables/time-series/sitebuiltvsmh.xlsx"
        }
      },
      {
        who: "Buyers who can get the land too",
        text: "When you own the land under the home, you control the lot costs and avoid rent increases from a park owner. The home is also easier to finance if it is titled with the land as real property. Check the title and zoning before you buy."
      },
      {
        who: "Investors who want steady demand",
        text: "Low-cost housing is in short supply in many areas, so modest homes often attract renters and buyers who are priced out of houses. That depends on the area and the park, so check local rents and recent sales of similar homes."
      }
    ],
    no: [
      {
        who: "Buyers who need a loan",
        text: "Loans on manufactured homes are often ‘chattel’ loans on the home only, which usually cost more and protect you less than a mortgage. Get loan quotes before you shop, and compare them with a regular mortgage.",
        example: "A May 2021 CFPB report found about 42% of manufactured home purchase loans were chattel loans. These generally have higher interest rates.",
        source: {
          label: "CFPB press release (May 27, 2021)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/manufactured-housing-loan-borrowers-face-higher-interest-rates-risks-and-barriers-to-credit/"
        }
      },
      {
        who: "Buyers of a home on rented land",
        text: "If the home sits in a park, the park owner sets the lot rent, and since moving the home is costly or impossible, you may have to accept increases. Ask who owns the park and for its history of rent increases; a recent sale to an investor is a warning sign.",
        example: "AP reported in 2022 on an Iowa park bought by an investor. A resident said his rent and fees had almost doubled since 2019.",
        source: {
          label: "Associated Press via PBS NewsHour (July 25, 2022)",
          url: "https://www.pbs.org/newshour/economy/rents-spike-as-large-corporate-investors-buy-mobile-home-parks"
        }
      },
      {
        who: "Long-term investors counting on appreciation",
        text: "On rented land you own only the home, and older homes on rented lots often lose value. Any gain in land value goes to the park owner, not you. Don’t count on a resale gain unless you also own the land."
      }
    ]
  },
  multifamily: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "A building with many units can usually afford a professional manager, so the owner does not deal with tenants day to day. A manager costs part of the rent and still needs watching, so check the books every month."
      },
      {
        who: "Value-add investors",
        text: "Larger apartment buildings are priced mainly on the income they bring in, so raising rents to market or cutting waste can raise the value. It works in reverse too: higher costs, empty units or interest rates can lower it. Check local rent rules before you plan rent increases."
      },
      {
        who: "Investors who worry about vacancy",
        text: "With dozens of units, a few empty apartments only trim income instead of wiping it out. That doesn’t protect you from a local slump or a jump in interest rates, which hit every unit at once."
      }
    ],
    no: [
      {
        who: "Buyers who use a lot of borrowed money",
        text: "If rates go up, your payments rise on a floating-rate loan or when you refinance. Even with a fixed-rate loan, higher rates can mean buyers pay less for the same rent, so values can fall even if the building is full. Make sure the building could still pay its loan at refinance if rates rose 2–3 points.",
        example: "The Federal Reserve raised its key rate to 5.25%–5.5% in July 2023.",
        source: {
          label: "Federal Reserve FOMC statement (July 26, 2023)",
          url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230726a.htm"
        }
      },
      {
        who: "Anyone who bought near a peak",
        text: "Apartment prices can drop sharply when rates rise, and owners who have to sell or refinance in a down market can lose all the money they put in. Check when the loan comes due, and avoid deals that need a refinance soon.",
        example: "Freddie Mac reported in mid-2024 that U.S. apartment property prices had fallen nearly 19% from their highs in 2022.",
        source: {
          label: "Freddie Mac 2024 Midyear Multifamily Outlook",
          url: "https://mf.freddiemac.com/docs/2024_midyear_multifamily_outlook.pdf"
        }
      },
      {
        who: "First-time investors",
        text: "Buildings with 5+ units use commercial loans, which usually need bigger down payments, more cash reserves and proof of experience. Without a landlord track record, you may need a partner or more cash."
      }
    ]
  },
  retail: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "Store tenants often sign multi-year leases and may pay a share of taxes, insurance and upkeep. That only helps while the space is leased, though: if a store leaves, you pay those costs yourself. Check when each lease ends."
      },
      {
        who: "Cautious investors",
        text: "Centers with a grocery store tend to keep shoppers coming, because people buy food every week. That depends on the grocer staying, so check its lease length and whether other tenants may leave if it closes.",
        example: "JLL reported that vacancy in U.S. grocery-anchored shopping centers was 3.5% in the fourth quarter of 2024.",
        source: {
          label: "JLL Grocery Report 2025",
          url: "https://www.jll.com/en-us/insights/market-perspectives/grocery-tracker"
        }
      },
      {
        who: "Investors who prefer local services",
        text: "Shops that sell in-person services, like haircuts, dentists or takeout, are harder to replace with online shopping. Small tenants can still close, so check how long they have been there and whether they pay on time."
      }
    ],
    no: [
      {
        who: "Owners who depend on one big tenant",
        text: "If a large chain goes bankrupt, it can leave a huge empty space that can take a long time and a lot of money to fill again. Ask who else could use the space and what it would cost to re-lease.",
        example: "In April 2023, Bed Bath & Beyond filed for bankruptcy. It said it would close all 475 of its remaining stores.",
        source: {
          label: "CBS News / Associated Press (April 2023)",
          url: "https://www.cbsnews.com/news/bed-bath-beyond-bankruptcy-today-2023-04-23/"
        }
      },
      {
        who: "Mall and big-box investors",
        text: "Department stores and large chains have closed many locations as shopping habits change. Don’t buy a mall or big-box store on a low price alone.",
        example: "In October 2018, Sears Holdings filed for Chapter 11. It said it would close 142 more Sears and Kmart stores.",
        source: {
          label: "Associated Press via PBS NewsHour (Oct. 15, 2018)",
          url: "https://www.pbs.org/newshour/economy/sears-files-for-chapter-11-amid-plunging-sales-and-massive-debt"
        }
      },
      {
        who: "First-time investors",
        text: "When a store leaves, the next tenant often wants months of free rent and money to rebuild the space, so a vacancy can cost far more than the lost rent. Budget for that on every space before you buy."
      }
    ]
  },
  office: {
    yes: [
      {
        who: "Bargain hunters and forced-sale buyers",
        text: "Office prices have fallen hard in some cities. A low price may suit you if you have cash to fill empty space and can wait many years. Just remember that a big drop from an old price doesn’t mean the building is worth more than you pay.",
        example: "In 2023, a mostly empty tower at 350 California St. in San Francisco sold for about $61 million, roughly 75% below its 2020 asking price. The buyers planned to hold it for 10 years or more and pay to lease it up.",
        source: {
          label: "The San Francisco Standard (Sept. 26, 2023)",
          url: "https://sfstandard.com/2023/09/26/downtown-san-francisco-61m-tower-purchase-signals-real-estate-reset/"
        }
      },
      {
        who: "Investors who want long leases",
        text: "Business tenants often sign leases of several years, so a well-leased building can give steady income for a while, until those leases end. Check how much space expires in the next 2–3 years."
      },
      {
        who: "Local small-office buyers",
        text: "Small offices for doctors, dentists, insurance agents and similar local services can behave differently from big downtown towers. It fits best if your own business will use the space, or local demand is proven."
      }
    ],
    no: [
      {
        who: "Office buyers",
        text: "Remote and hybrid work cut how much space companies need, and national vacancy hit record highs in 2024. Check vacancy in the building’s own area before you buy.",
        example: "Moody’s data showed U.S. office vacancy reached 20.1% in the second quarter of 2024. It was the first time above 20%. That was a 2024 figure; check current vacancy for the building’s area.",
        source: {
          label: "Facilities Dive, citing Moody’s (July 9, 2024)",
          url: "https://www.facilitiesdive.com/news/us-office-vacancy-rates-moodys-analysis/720862/"
        }
      },
      {
        who: "Downtown buyers",
        text: "Downtown office towers have been hit hardest, with rising vacancies and falling rents. Walk away from a mostly empty tower unless you have cash to wait years.",
        example: "The Federal Reserve’s October 2023 Financial Stability Report said office fundamentals were especially weak in central business districts.",
        source: {
          label: "Federal Reserve Financial Stability Report, October 2023",
          url: "https://www.federalreserve.gov/publications/2023-october-financial-stability-report-asset-valuations.htm"
        }
      },
      {
        who: "Small investors",
        text: "New office tenants usually expect the owner to pay to rebuild the space and to cover broker fees, so filling an empty suite can be very costly. Price these costs in before you make an offer."
      }
    ]
  },
  industrial: {
    yes: [
      {
        who: "Long-term investors",
        text: "Online shopping needs warehouses to store and ship goods, and online sales keep taking a bigger share of retail. That only helps where companies want space, and new buildings nearby can still leave yours empty.",
        example: "The Census Bureau reported that e-commerce made up 17.1% of total U.S. retail sales in the second quarter of 2026.",
        source: {
          label: "U.S. Census Bureau, Quarterly Retail E-Commerce Sales",
          url: "https://www.census.gov/retail/ecommerce.html"
        }
      },
      {
        who: "Investors who want hands-off income",
        text: "Warehouses are simple buildings, and tenants often handle much of the upkeep under their leases. Check who pays for the roof and the paving, which can be costly."
      },
      {
        who: "Cautious investors",
        text: "In 2023, even after it rose, warehouse vacancy was still below its long-run average. It changes by area and year, so check the local rate and new construction nearby before you buy.",
        example: "Cushman & Wakefield reported U.S. industrial vacancy of 5.2% in Q4 2023, below its 15-year average of 6.4%. That was a 2023 figure, not today’s.",
        source: {
          label: "Cushman & Wakefield news release (Jan. 11, 2024)",
          url: "https://www.cushmanwakefield.com/en/united-states/news/2024/01/us-industrial-vacancy-surpasses-robust-speculative-deliveries"
        }
      }
    ],
    no: [
      {
        who: "Investors buying after a boom",
        text: "When demand is strong, builders rush to add space, and when the new buildings all open at once, vacancy rises and rents soften. Check how much new space is being built nearby.",
        example: "Cushman & Wakefield reported a record 609.6 million square feet of new U.S. industrial space delivered in 2023. Vacancy rose at the same time.",
        source: {
          label: "Cushman & Wakefield news release (Jan. 11, 2024)",
          url: "https://www.cushmanwakefield.com/en/united-states/news/2024/01/us-industrial-vacancy-surpasses-robust-speculative-deliveries"
        }
      },
      {
        who: "Small investors",
        text: "Most warehouses are large and expensive, with few small, affordable options for a beginner. Smaller ‘flex’ buildings or real estate funds may fit better."
      },
      {
        who: "Owners of single-tenant buildings",
        text: "Many warehouses have one tenant. If that tenant leaves, income goes to zero, and a specialized building may be hard to lease again. Check the tenant’s finances and how many months of payments you could cover with it empty."
      }
    ]
  },
  mixedUse: {
    yes: [
      {
        who: "Redevelopers in California",
        text: "California lets some sites zoned for shops, offices or parking skip parts of the usual approvals to build housing, but only if the project meets set rules, such as affordable units and wage standards. Check whether your lot qualifies before you count on it.",
        example: "In September 2022, California enacted AB 2011 and SB 6. These allow housing on some commercial sites zoned for retail, office and parking, if the project meets the laws’ conditions.",
        source: {
          label: "Office of Governor Gavin Newsom (Sept. 28, 2022)",
          url: "https://www.gov.ca.gov/2022/09/28/california-to-build-more-housing-faster/"
        }
      },
      {
        who: "Investors who want more than one income stream",
        text: "Rent from apartments and from shops comes from different tenants, so a weak spell in one can be softened by the other. That only works if both are actually leased, so check how long the storefront has been empty."
      },
      {
        who: "Owner-operators",
        text: "You can run your own business on the ground floor and rent out or live in the space above. It fits if your business is stable and you plan to stay for years."
      }
    ],
    no: [
      {
        who: "Condo investors and anyone who needs to resell",
        text: "Common home loans limit how much of a building can be commercial, so fewer buyers may be able to finance a unit. Ask a lender whether the building qualifies before you buy.",
        example: "Fannie Mae generally won’t buy loans in condo projects where more than 35% of the project or building is commercial or mixed-use space.",
        source: {
          label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
          url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
        }
      },
      {
        who: "First-time investors",
        text: "Financing is often a commercial loan with a bigger down payment, and you need to understand both home rentals and store leases. Talk to a commercial lender early."
      },
      {
        who: "Hands-off investors",
        text: "Two kinds of tenants means two sets of rules, leases and repair needs. An empty storefront can also make the apartments harder to rent. Check how much of the income depends on the storefront."
      }
    ]
  },
  hotel: {
    yes: [
      {
        who: "Investors worried about inflation",
        text: "Hotel rooms are re-priced every night, so income can rise quickly when demand is strong. It falls just as fast when demand weakens.",
        example: "In 2022, the average Las Vegas room rate reached about $171, 28.9% above 2019 (Las Vegas, Clark County, Nevada). That was a strong year, not a typical one.",
        source: {
          label: "LVCVA Executive Summary, December 2022",
          url: "https://assets.simpleviewcms.com/simpleview/image/upload/v1/clients/lasvegas/ES_Dec_2022_55ca21d9-0cc5-41f4-ac92-4022429f8380.pdf"
        }
      },
      {
        who: "Hands-on operators",
        text: "A hotel is a business as well as a building. Better service, marketing and pricing can raise income in ways a regular rental cannot. It only works if you, or a manager you trust, run it well every day."
      },
      {
        who: "Investors buying a branded hotel",
        text: "A franchise brand brings a booking system and loyal guests, which can help a smaller owner fill rooms. It also brings fees and required upgrades, so read the franchise agreement first."
      }
    ],
    no: [
      {
        who: "Anyone who needs steady income",
        text: "Hotel income can disappear almost overnight: there are no leases, so guests can simply stop coming. Know how many months you could pay the loan with no guests at all.",
        example: "On March 17, 2020, the Nevada Gaming Control Board ordered all gaming in Nevada shut down by 11:59 p.m. that day. This was under the governor’s COVID-19 order.",
        source: {
          label: "Nevada Gaming Control Board, Notice to Licensees #2020-19",
          url: "https://www.gaming.nv.gov/uploadedFiles/gamingnvgov/content/about/industry-notices/2020-19.pdf"
        }
      },
      {
        who: "Investors using heavy loans",
        text: "A sharp drop in travel can leave a hotel unable to pay its loan. Keep cash reserves, and avoid loans that could come due in a slump.",
        example: "Las Vegas had 19.0 million visitors in 2020, down 55.2% from 2019. Hotel occupancy averaged 42.1% for the year (Las Vegas, Nevada).",
        source: {
          label: "LVCVA Summary of Monthly Tourism Indicators, Calendar Year 2020 (Nevada State Library archive)",
          url: "https://epubs.nsla.nv.gov/statepubs/epubs/651944-2020.pdf"
        }
      },
      {
        who: "Investors who want predictable income",
        text: "Travel demand swings even in normal years, and with no long leases, hotel income is harder to predict than rent. Get at least three years of real occupancy and room rates.",
        example: "Even outside a crisis, demand swings. Las Vegas visitor volume fell 7.5% in 2025 compared with 2024 (Las Vegas, Nevada).",
        source: {
          label: "LVCVA Summary of Monthly Tourism Indicators, Calendar Year 2025 (Nevada State Library archive)",
          url: "https://epubs.nsla.nv.gov/statepubs/epubs/651944-2025.pdf"
        }
      },
      {
        who: "Investors who want hands-off income",
        text: "Hotels need staff every day and night, so wages and hiring problems hit profit directly. Get real payroll numbers, not a broker’s estimate."
      }
    ]
  },
  selfStorage: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "Storage usually has fewer repair calls than housing, so it often needs fewer staff. But gates, security, roofs and flooding can still need urgent attention, and someone still has to rent units, collect payments and keep the site secure."
      },
      {
        who: "Investors worried about inflation",
        text: "Most units rent month to month, so rents can be raised quickly when demand is strong. They can also fall when demand weakens, as they have slipped since 2023.",
        example: "Cushman & Wakefield reported U.S. self-storage rents reached an all-time high average of $134 per unit in Q3 2022. That was a peak, not today’s rate.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "Retirees and long-term holders",
        text: "Demand comes from ordinary life events like moving, downsizing and settling estates, which happen in good and bad times. When fewer people move, fewer rent units, so check local occupancy."
      }
    ],
    no: [
      {
        who: "Buyers who pay top price after a boom",
        text: "Month-to-month rents also fall fast, and new facilities are fairly quick to build, which adds competition. Count the facilities open and planned within a few miles.",
        example: "Cushman & Wakefield reported average self-storage rents began falling in the second half of 2023. The causes were weaker demand and new supply.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "Investors counting on steady growth",
        text: "Storage demand rises and falls with home sales and moves, so when people stop moving, fewer rent units. Compare what current tenants pay with what new tenants are offered.",
        example: "In Cushman & Wakefield’s investor survey, 39% named the slowing housing market as their top concern for self-storage.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "First-time investors",
        text: "It is a retail-style business with pricing, marketing and collections, and small facilities often compete with large national chains. If you invest through a promoter, check fees and track record first."
      }
    ]
  },
  land: {
    yes: [
      {
        who: "Patient long-term investors",
        text: "Land has no tenants or roofs to fix. It still takes some work: yearly taxes with no income, weed and fire rules, dumping, trespassers, and keeping access open. Check on it, and keep cash to hold it."
      },
      {
        who: "Investors in Nevada",
        text: "In Nevada, most land is federal, so privately owned land near growing towns is limited. That doesn’t guarantee a gain, because federal land sales add supply. Check planned growth and land sales near your parcel.",
        example: "The Bureau of Land Management manages nearly 48 million acres, about 63% of Nevada’s land (Nevada).",
        source: {
          label: "Bureau of Land Management: What We Manage – Nevada",
          url: "https://www.blm.gov/about/what-we-manage/nevada"
        }
      },
      {
        who: "Buyers at government auctions",
        text: "Government agencies sometimes sell land at public auction, with clear rules and published terms. Clear rules don’t mean a good lot, so check access, water and zoning before you bid.",
        example: "In January 2014, the BLM auctioned 440 acres in 28 parcels in Clark County, Nevada. Buyers paid 20% down on sale day and the rest within 180 days.",
        source: {
          label: "Bureau of Land Management press release (Jan. 2014)",
          url: "https://www.blm.gov/press-release/blm-sell-440-acres-auction"
        }
      }
    ],
    no: [
      {
        who: "Investors who need income",
        text: "Raw land usually earns nothing, but you still pay property taxes and any loan, and you cannot deduct depreciation on land. Make sure you can keep paying the taxes for years.",
        example: "The IRS says land is never depreciable, unlike rental buildings.",
        source: {
          label: "IRS Tax Topic 704, Depreciation",
          url: "https://www.irs.gov/taxtopics/tc704"
        }
      },
      {
        who: "Buyers planning to build in Arizona",
        text: "In Arizona, water rules can stop or slow building, which can make land worth less than expected. The rules changed again in 2025, so check the current water rules for the exact parcel.",
        example: "In June 2023, Arizona said it would not approve new housing on the edges of metro Phoenix that relies on groundwater (Maricopa County area, Arizona).",
        source: {
          label: "Associated Press via WKMG ClickOrlando (June 2023)",
          url: "https://www.clickorlando.com/business/2023/06/02/arizona-to-restrict-some-new-construction-in-fast-growing-areas-of-phoenix-reliant-on-groundwater/"
        }
      },
      {
        who: "Anyone who may need cash quickly",
        text: "Fewer lenders make land loans, and fewer buyers shop for land, so it can take a long time to sell. Only buy land with money you won’t need for years."
      },
      {
        who: "Buyers who skip due diligence",
        text: "Access roads, utilities, zoning and flood or slope issues decide what land is worth, and they are easy to miss from a listing. Check each with the county, and walk away if there is no legal access."
      }
    ]
  }
} satisfies Record<string, { yes: WhyPoint[]; no: WhyPoint[] }>;
