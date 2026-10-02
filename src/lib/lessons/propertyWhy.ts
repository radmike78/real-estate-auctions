// Why you would choose each property type, and why you wouldn’t: from different investors’ points of view, with real examples.
// Every example is from a source we read (see each point’s source). Researched and checked 2026-10-02.
// Points about one state start with that state’s name, so the lesson’s state filter shows them only to that state.

import type { WhyPoint } from './types';

export const PROPERTY_WHY = {
  singleFamily: {
    yes: [
      {
        who: "First-time investors with little cash",
        text: "It is the easiest kind of property to finance and understand. If you live in it first, an owner-occupant loan can need a small down payment, and you can rent it out later.",
        example: "HUD says FHA loans allow a down payment as low as 3.5% of the price on 1–4 unit homes for buyers who will live there.",
        source: {
          label: "HUD: Loans (FHA)",
          url: "https://www.hud.gov/helping-americans/loans"
        }
      },
      {
        who: "Long-term rental owners",
        text: "The tax rules let you deduct the building’s wear and tear over time, which can shelter part of the rent from income tax.",
        example: "IRS Publication 527 says a residential rental building is depreciated over 27.5 years (the land part is not).",
        source: {
          label: "IRS Publication 527, Residential Rental Property",
          url: "https://www.irs.gov/publications/p527"
        }
      },
      {
        who: "Flippers and anyone who may need to sell",
        text: "Houses can be sold to families who want a home, not just to other investors. That gives you the largest pool of buyers when it is time to sell."
      },
      {
        who: "Small landlords in California",
        text: "California’s statewide rent cap has an exemption for a single home owned by an individual (not a corporation or REIT), as long as tenants get the required written notice.",
        example: "California Civil Code 1947.12(d)(5) exempts separately titled homes not owned by a REIT or corporation when tenants receive written notice.",
        source: {
          label: "California Civil Code § 1947.12",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12"
        }
      }
    ],
    no: [
      {
        who: "Investors buying government-owned homes",
        text: "Many government-owned homes go to people who will live in them first. Investors often only get a turn after that window closes, so the best homes may be gone.",
        example: "Starting March 1, 2022, HUD lengthened its owner-occupant-only listing period for many HUD homes from 15 to 30 days nationwide.",
        source: {
          label: "HUD press release 22-007 (January 13, 2022)",
          url: "https://archives.hud.gov/news/2022/pr22-007.cfm"
        }
      },
      {
        who: "Investors who want steady income",
        text: "There is only one tenant. When the house is empty, your rent drops to zero but the mortgage, taxes and insurance do not."
      },
      {
        who: "Buyers with thin savings",
        text: "Every repair is yours alone. A new roof or air conditioner can wipe out several years of profit on one house."
      },
      {
        who: "Cash-flow investors in high-price areas",
        text: "In expensive markets the rent may not cover the mortgage, taxes and insurance, so you could be paying each month and betting on the price going up."
      }
    ]
  },
  condo: {
    yes: [
      {
        who: "First-time investors",
        text: "A condo or townhouse usually costs less than a detached house in the same area, so it can be a cheaper first rental."
      },
      {
        who: "Hands-off owners and retirees",
        text: "The HOA usually handles the roof, outside walls and grounds, so you have fewer repairs to manage yourself."
      },
      {
        who: "Long-term landlords in California",
        text: "California law stops HOAs from banning or unreasonably limiting long-term rentals, though they can ban stays of 30 days or less.",
        example: "California Civil Code 4741 bars HOA rules that prohibit or unreasonably restrict renting, but allows bans on rentals of 30 days or less.",
        source: {
          label: "California Civil Code § 4741",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4741"
        }
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "If the building needs big repairs and the HOA has not saved enough, owners can be billed a large special assessment on short notice.",
        example: "After the 2021 Champlain Towers South collapse in Surfside, Florida, which killed 98 people, Florida required inspections and reserve studies, and some associations hit owners with very large assessments.",
        source: {
          label: "News Service of Florida via WKMG ClickOrlando (Feb. 11, 2025)",
          url: "https://www.clickorlando.com/news/2025/02/11/florida-lawmakers-say-no-bailouts-for-condo-owners"
        }
      },
      {
        who: "Flippers and auction buyers",
        text: "If the building needs major repairs, many buyers cannot get a normal loan there, which makes the unit harder to sell and can lower its price.",
        example: "Fannie Mae’s Selling Guide lists condo projects needing critical repairs as ineligible for its loans.",
        source: {
          label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
          url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
        }
      },
      {
        who: "Investors who want control",
        text: "HOA fees and rules can change by board or member vote. You are one vote among many, and rising fees cut directly into your rent."
      },
      {
        who: "Short-term rental investors in California",
        text: "In California, an HOA can still ban rentals of 30 days or less, so a vacation-rental plan may not be allowed.",
        example: "California Civil Code 4741(c) lets an HOA prohibit rentals of 30 days or less.",
        source: {
          label: "California Civil Code § 4741",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4741"
        }
      }
    ]
  },
  smallMultifamily: {
    yes: [
      {
        who: "First-time investors with little cash",
        text: "You can live in one unit and rent the others, which lets you use an owner-occupant loan with a small down payment while tenants help pay the mortgage.",
        example: "HUD says FHA’s 3.5% minimum down payment is available on 1–4 unit properties.",
        source: {
          label: "HUD: Loans (FHA)",
          url: "https://www.hud.gov/helping-americans/loans"
        }
      },
      {
        who: "Investors who want steadier income",
        text: "With two to four units, one empty unit does not cut your rent to zero the way it does with a single house."
      },
      {
        who: "Owner-occupants in California",
        text: "In California, if you live in one side of a duplex, the statewide rent cap generally doesn’t apply to it while you keep living there.",
        example: "California Civil Code 1947.12(d)(6) exempts a two-unit building where the owner lives in one unit from the statewide rent cap.",
        source: {
          label: "California Civil Code § 1947.12",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12"
        }
      }
    ],
    no: [
      {
        who: "FHA buyers of 3–4 units",
        text: "Lenders want proof you have cash left over after closing, so the low down payment does not mean you can buy with almost nothing.",
        example: "HUD Mortgagee Letter 2023-17 (Oct. 16, 2023) requires lenders to document reserves of three months’ mortgage payments after closing for 3–4 unit FHA loans.",
        source: {
          label: "HUD Mortgagee Letter 2023-17",
          url: "https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-17hsgml.pdf"
        }
      },
      {
        who: "Owner-occupants",
        text: "You live next to your tenants. Late-night repair calls, noise and rent conversations become part of your home life."
      },
      {
        who: "Investors (not living there) in California",
        text: "In California, most rentals fall under a statewide cap on yearly rent increases, which limits how fast income can grow.",
        example: "The California Attorney General says annual rent increases under state law are capped at 5% plus inflation, up to 10%.",
        source: {
          label: "California Attorney General: Limits on Rent Increases",
          url: "https://oag.ca.gov/rentcaps"
        }
      },
      {
        who: "Flippers",
        text: "Fewer people shop for a duplex or fourplex than for a house, so resale can take longer, and buyers often price it on rent rather than looks."
      }
    ]
  },
  manufactured: {
    yes: [
      {
        who: "Investors with little cash",
        text: "A manufactured home costs far less to buy than a newly built house, so it can be a low-cost way to start.",
        example: "Census data show new manufactured homes averaged $123,300 in 2024, compared with $514,500 for a new site-built house sold with its land (national figures).",
        source: {
          label: "U.S. Census Bureau, Manufactured Housing Survey: Cost & Size Comparisons 2014–2024 (spreadsheet)",
          url: "https://www2.census.gov/programs-surveys/mhs/tables/time-series/sitebuiltvsmh.xlsx"
        }
      },
      {
        who: "Buyers who can get the land too",
        text: "When you own the land under the home, you control the lot costs and avoid surprise rent increases from a park owner."
      },
      {
        who: "Investors who want steady demand",
        text: "Low-cost housing is in short supply in many areas, so modest homes often attract renters and buyers who are priced out of houses."
      }
    ],
    no: [
      {
        who: "Buyers who need a loan",
        text: "Loans on manufactured homes are often ‘chattel’ loans on the home only, which usually cost more and protect the borrower less than a mortgage.",
        example: "A May 2021 CFPB report found about 42% of manufactured home purchase loans were chattel loans, which generally have higher interest rates.",
        source: {
          label: "CFPB press release (May 27, 2021)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/manufactured-housing-loan-borrowers-face-higher-interest-rates-risks-and-barriers-to-credit/"
        }
      },
      {
        who: "Buyers of a home on rented land",
        text: "If the home sits in a park, the park owner sets the lot rent. Moving the home is costly or impossible, so you may have to accept increases.",
        example: "AP reported in 2022 that a resident of an Iowa park bought by an investor said his rent and fees had almost doubled since 2019.",
        source: {
          label: "Associated Press via PBS NewsHour (July 25, 2022)",
          url: "https://www.pbs.org/newshour/economy/rents-spike-as-large-corporate-investors-buy-mobile-home-parks"
        }
      },
      {
        who: "Long-term investors counting on appreciation",
        text: "On rented land you own only the structure, and a structure wears out over time. Any gain in land value goes to the park owner, not you."
      }
    ]
  },
  multifamily: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "A building with many units can usually afford a professional manager, so the owner does not have to deal with tenants day to day."
      },
      {
        who: "Value-add investors",
        text: "Larger apartment buildings are priced mainly on the income they produce, so raising rents to market or cutting waste can raise the building’s value."
      },
      {
        who: "Investors who worry about vacancy",
        text: "With dozens of units, a few empty apartments only trim income instead of wiping it out."
      }
    ],
    no: [
      {
        who: "Buyers who use a lot of borrowed money",
        text: "When interest rates jump, loan payments rise and buyers will pay less for the same rent, so values can fall even if the building is full.",
        example: "The Federal Reserve raised its key rate to 5.25%–5.5% in July 2023.",
        source: {
          label: "Federal Reserve FOMC statement (July 26, 2023)",
          url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230726a.htm"
        }
      },
      {
        who: "Anyone who bought near a peak",
        text: "Apartment prices can drop sharply when rates rise. Owners who must sell or refinance in a down market can lose their equity.",
        example: "Freddie Mac reported that U.S. apartment property prices fell 18.7% in the seven quarters after peaking in the second quarter of 2022.",
        source: {
          label: "Freddie Mac 2024 Midyear Multifamily Outlook",
          url: "https://mf.freddiemac.com/docs/2024_midyear_multifamily_outlook.pdf"
        }
      },
      {
        who: "First-time investors",
        text: "Buildings with 5+ units use commercial loans, which usually need bigger down payments, more cash reserves and proof of experience."
      }
    ]
  },
  retail: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "Store tenants often sign multi-year leases and may pay a share of taxes, insurance and upkeep, so the owner has fewer day-to-day duties."
      },
      {
        who: "Cautious investors",
        text: "Centers with a grocery store tend to keep shoppers coming because people buy food every week.",
        example: "JLL reported that vacancy in U.S. grocery-anchored shopping centers was 3.5% in the fourth quarter of 2024.",
        source: {
          label: "JLL Grocery Report 2025",
          url: "https://www.jll.com/en-us/insights/market-perspectives/grocery-tracker"
        }
      },
      {
        who: "Investors who prefer local services",
        text: "Shops that sell services people need in person, like haircuts, dentists or takeout, are harder to replace with online shopping."
      }
    ],
    no: [
      {
        who: "Owners who depend on one big tenant",
        text: "If a large chain goes bankrupt, it can leave a huge empty space that takes a long time and a lot of money to re-lease.",
        example: "In April 2023, Bed Bath & Beyond filed for bankruptcy and said it would close all 475 of its remaining stores.",
        source: {
          label: "CBS News / Associated Press (April 2023)",
          url: "https://www.cbsnews.com/news/bed-bath-beyond-bankruptcy-today-2023-04-23/"
        }
      },
      {
        who: "Mall and big-box investors",
        text: "Department stores and large chains have closed many locations as shopping habits change.",
        example: "In October 2018, Sears Holdings filed for Chapter 11 and said it would close 142 more Sears and Kmart stores.",
        source: {
          label: "Associated Press via PBS NewsHour (Oct. 15, 2018)",
          url: "https://www.pbs.org/newshour/economy/sears-files-for-chapter-11-amid-plunging-sales-and-massive-debt"
        }
      },
      {
        who: "First-time investors",
        text: "When a store leaves, the next tenant often wants months of free rent and money to rebuild the space, so a vacancy can cost far more than lost rent."
      }
    ]
  },
  office: {
    yes: [
      {
        who: "Bargain hunters and forced-sale buyers",
        text: "Office prices have fallen hard in some cities, so patient buyers can sometimes buy buildings far below what they sold for a few years ago.",
        example: "In 2023, 350 California St. in San Francisco sold for about $61 million, roughly 75% below the price its owner asked in 2020.",
        source: {
          label: "The San Francisco Standard (Sept. 26, 2023)",
          url: "https://sfstandard.com/2023/09/26/downtown-san-francisco-61m-tower-purchase-signals-real-estate-reset/"
        }
      },
      {
        who: "Investors who want long leases",
        text: "Business tenants often sign leases of several years, so a well-leased building can give steady income for a long stretch."
      },
      {
        who: "Local small-office buyers",
        text: "Small offices for doctors, dentists, insurance agents and similar local services can behave differently from big downtown towers."
      }
    ],
    no: [
      {
        who: "Anyone buying offices today",
        text: "Remote and hybrid work cut how much space companies need, and nationwide vacancy hit record highs.",
        example: "Moody’s data showed U.S. office vacancy reached 20.1% in the second quarter of 2024, the first time above 20%.",
        source: {
          label: "Facilities Dive, citing Moody’s (July 9, 2024)",
          url: "https://www.facilitiesdive.com/news/us-office-vacancy-rates-moodys-analysis/720862/"
        }
      },
      {
        who: "Downtown buyers",
        text: "Downtown office towers have been hit hardest, with rising vacancies and falling rents.",
        example: "The Federal Reserve’s October 2023 Financial Stability Report said office fundamentals were especially weak in central business districts.",
        source: {
          label: "Federal Reserve Financial Stability Report, October 2023",
          url: "https://www.federalreserve.gov/publications/2023-october-financial-stability-report-asset-valuations.htm"
        }
      },
      {
        who: "Small investors",
        text: "New office tenants usually expect the owner to pay to rebuild the space and to pay broker fees, so filling an empty suite can be very costly."
      }
    ]
  },
  industrial: {
    yes: [
      {
        who: "Long-term investors",
        text: "Online shopping needs warehouses to store and ship goods, and online sales keep taking a bigger share of retail.",
        example: "The Census Bureau reported that e-commerce made up 17.1% of total U.S. retail sales in the second quarter of 2026.",
        source: {
          label: "U.S. Census Bureau, Quarterly Retail E-Commerce Sales",
          url: "https://www.census.gov/retail/ecommerce.html"
        }
      },
      {
        who: "Investors who want hands-off income",
        text: "Warehouses are simple buildings, and tenants often handle much of the upkeep under their leases."
      },
      {
        who: "Cautious investors",
        text: "Even after vacancy rose, warehouse vacancy stayed below its long-run average.",
        example: "Cushman & Wakefield reported U.S. industrial vacancy of 5.2% in Q4 2023, still below its 15-year average of 6.4%.",
        source: {
          label: "Cushman & Wakefield news release (Jan. 11, 2024)",
          url: "https://www.cushmanwakefield.com/en/united-states/news/2024/01/us-industrial-vacancy-surpasses-robust-speculative-deliveries"
        }
      }
    ],
    no: [
      {
        who: "Investors buying after a boom",
        text: "When demand is strong, builders rush to add space. When the new buildings open at once, vacancy rises and rents soften.",
        example: "Cushman & Wakefield reported a record 609.6 million square feet of new U.S. industrial space delivered in 2023, as vacancy rose.",
        source: {
          label: "Cushman & Wakefield news release (Jan. 11, 2024)",
          url: "https://www.cushmanwakefield.com/en/united-states/news/2024/01/us-industrial-vacancy-surpasses-robust-speculative-deliveries"
        }
      },
      {
        who: "Small investors",
        text: "Most warehouses are large and expensive, so there are few small, affordable options for a beginner."
      },
      {
        who: "Owners of single-tenant buildings",
        text: "Many warehouses have one tenant. If that tenant leaves, income goes to zero, and a specialized building may be hard to re-lease."
      }
    ]
  },
  mixedUse: {
    yes: [
      {
        who: "Redevelopers in California",
        text: "California now lets housing be built on many sites zoned only for shops, offices or parking, which can open new options for older commercial lots.",
        example: "In September 2022, California enacted AB 2011 and SB 6, allowing housing on some commercial sites zoned for retail, office and parking.",
        source: {
          label: "Office of Governor Gavin Newsom (Sept. 28, 2022)",
          url: "https://www.gov.ca.gov/2022/09/28/california-to-build-more-housing-faster/"
        }
      },
      {
        who: "Investors who want more than one income stream",
        text: "Rent from apartments and from shops comes from different tenants, so a weak spell in one can be softened by the other."
      },
      {
        who: "Owner-operators",
        text: "You can run your own business on the ground floor and rent out or live in the space above."
      }
    ],
    no: [
      {
        who: "Condo investors and anyone who needs to resell",
        text: "Common home loans have limits on how much of a building can be commercial, so fewer buyers may be able to finance a unit.",
        example: "Fannie Mae generally won’t buy loans in condo projects where more than 35% of the project or building is commercial or mixed-use space.",
        source: {
          label: "Fannie Mae Selling Guide B4-2.1-03, Ineligible Projects",
          url: "https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects"
        }
      },
      {
        who: "First-time investors",
        text: "Financing is often a commercial loan with bigger down payments, and you must understand both home rentals and store leases."
      },
      {
        who: "Hands-off investors",
        text: "Two kinds of tenants means two sets of rules, leases and repair needs. An empty storefront can also make the apartments harder to rent."
      }
    ]
  },
  hotel: {
    yes: [
      {
        who: "Investors worried about inflation",
        text: "Hotel rooms are re-priced every night, so income can rise quickly when demand and prices go up.",
        example: "In 2022, the average Las Vegas room rate reached about $171, 28.9% above 2019 (Las Vegas, Clark County, Nevada).",
        source: {
          label: "LVCVA Executive Summary, December 2022",
          url: "https://assets.simpleviewcms.com/simpleview/image/upload/v1/clients/lasvegas/ES_Dec_2022_55ca21d9-0cc5-41f4-ac92-4022429f8380.pdf"
        }
      },
      {
        who: "Hands-on operators",
        text: "A hotel is a business as well as a building. Better service, marketing and pricing can raise income in ways a regular rental cannot."
      },
      {
        who: "Investors buying a branded hotel",
        text: "A franchise brand brings a reservation system and loyal guests, which can help a smaller owner fill rooms."
      }
    ],
    no: [
      {
        who: "Anyone who needs steady income",
        text: "Hotel income can disappear almost overnight, because guests can stop coming when there are no leases.",
        example: "On March 17, 2020, the Nevada Gaming Control Board ordered all gaming in Nevada shut down by 11:59 p.m. that day under the governor’s COVID-19 order.",
        source: {
          label: "Nevada Gaming Control Board, Notice to Licensees #2020-19",
          url: "https://www.gaming.nv.gov/uploadedFiles/gamingnvgov/content/about/industry-notices/2020-19.pdf"
        }
      },
      {
        who: "Investors using heavy loans",
        text: "A sharp drop in travel can leave a hotel unable to pay its loan.",
        example: "Las Vegas had 19.0 million visitors in 2020, down 55.2% from 2019, and hotel occupancy averaged 42.1% for the year (Las Vegas, Nevada).",
        source: {
          label: "LVCVA Summary of Monthly Tourism Indicators, Calendar Year 2020 (Nevada State Library archive)",
          url: "https://epubs.nsla.nv.gov/statepubs/epubs/651944-2020.pdf"
        }
      },
      {
        who: "Investors who want predictable income",
        text: "Travel demand swings even in normal years, and with no long leases, hotel income is harder to predict than rent.",
        example: "Even outside a crisis, demand swings: Las Vegas visitor volume fell 7.5% in 2025 compared with 2024 (Las Vegas, Nevada).",
        source: {
          label: "LVCVA Summary of Monthly Tourism Indicators, Calendar Year 2025 (Nevada State Library archive)",
          url: "https://epubs.nsla.nv.gov/statepubs/epubs/651944-2025.pdf"
        }
      },
      {
        who: "Investors who want hands-off income",
        text: "Hotels need staff every day and night, so wages and hiring problems hit profit directly."
      }
    ]
  },
  selfStorage: {
    yes: [
      {
        who: "Investors who want hands-off income",
        text: "There are no kitchens, bathrooms or late-night tenant emergencies, so storage usually needs fewer staff and simpler upkeep than housing."
      },
      {
        who: "Investors worried about inflation",
        text: "Most units rent month to month, so rents can be raised quickly when demand is strong.",
        example: "Cushman & Wakefield reported U.S. self-storage rents reached an all-time high average of $134 per unit in Q3 2022.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "Retirees and long-term holders",
        text: "Demand comes from ordinary life events like moving, downsizing and settling estates, which happen in good and bad times."
      }
    ],
    no: [
      {
        who: "Buyers who pay top price after a boom",
        text: "Month-to-month rents also fall fast, and new facilities are fairly quick to build, which adds competition.",
        example: "Cushman & Wakefield reported average self-storage rents began falling in the second half of 2023 due to weaker demand and new supply.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "Investors counting on steady growth",
        text: "Storage demand rises and falls with home sales and moves. When people stop moving, fewer rent units.",
        example: "In Cushman & Wakefield’s investor survey, 39% named the slowing housing market as their top concern for self-storage.",
        source: {
          label: "Cushman & Wakefield: U.S. Self Storage Market Trends & Sector Outlook",
          url: "https://www.cushmanwakefield.com/en/united-states/insights/us-self-storage-market-trends-and-sector-outlook"
        }
      },
      {
        who: "First-time investors",
        text: "It is a retail-style business with pricing, marketing and collections, and small facilities often compete with large national chains."
      }
    ]
  },
  land: {
    yes: [
      {
        who: "Patient long-term investors",
        text: "Land has no tenants, toilets or roofs to fix, so there is very little to manage while you wait."
      },
      {
        who: "Investors in Nevada",
        text: "In Nevada, most land is federal, so privately owned land near growing towns is limited.",
        example: "The Bureau of Land Management manages nearly 48 million acres, about 63% of Nevada’s land (Nevada).",
        source: {
          label: "Bureau of Land Management: What We Manage – Nevada",
          url: "https://www.blm.gov/about/what-we-manage/nevada"
        }
      },
      {
        who: "Buyers at government auctions",
        text: "Government agencies sometimes sell land at public auction, with clear rules and published terms.",
        example: "In January 2014, the BLM auctioned 440 acres in 28 parcels in Clark County, Nevada, requiring 20% down on sale day and the rest within 180 days.",
        source: {
          label: "Bureau of Land Management press release (Jan. 2014)",
          url: "https://www.blm.gov/press-release/blm-sell-440-acres-auction"
        }
      }
    ],
    no: [
      {
        who: "Investors who need income",
        text: "Raw land usually earns nothing, but you still pay property taxes and any loan, and you cannot deduct depreciation on land.",
        example: "The IRS says land is never depreciable, unlike rental buildings.",
        source: {
          label: "IRS Tax Topic 704, Depreciation",
          url: "https://www.irs.gov/taxtopics/tc704"
        }
      },
      {
        who: "Buyers planning to build in Arizona",
        text: "In Arizona, water rules can stop or slow building, which can make land worth less than expected.",
        example: "In June 2023, Arizona said it would not approve new housing on the edges of metro Phoenix that relies on groundwater (Maricopa County area, Arizona).",
        source: {
          label: "Associated Press via WKMG ClickOrlando (June 2023)",
          url: "https://www.clickorlando.com/business/2023/06/02/arizona-to-restrict-some-new-construction-in-fast-growing-areas-of-phoenix-reliant-on-groundwater/"
        }
      },
      {
        who: "Anyone who may need cash quickly",
        text: "Fewer lenders make land loans, and fewer buyers shop for land, so it can take a long time to sell."
      },
      {
        who: "Buyers who skip due diligence",
        text: "Access roads, utilities, zoning and flood or slope issues decide what land is worth, and they are easy to miss from a listing."
      }
    ]
  }
} satisfies Record<string, { yes: WhyPoint[]; no: WhyPoint[] }>;
