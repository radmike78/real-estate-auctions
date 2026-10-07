// Why you would hire each professional, and why you might not: from different buyers’ points of view, with real examples.
// Every example is from a source we read (see each point’s source). Researched and checked 2026-10-02.

import type { WhyPoint } from './lessons/types';

export const PRO_WHY = {
  agent: {
    yes: [
      {
        who: "First-time buyer",
        text: "Worth it when you’re buying a listed home and haven’t written an offer before. A buyer’s agent walks you through offers, contingencies and deadlines, where new buyers can make costly mistakes."
      },
      {
        who: "Buyer of bank-owned (REO) homes",
        text: "Worth it for bank-owned and Fannie Mae/Freddie Mac homes. These are usually listed through local agents, and your agent gets you showings and sends offers in the form the seller expects."
      },
      {
        who: "Investor new to a market",
        text: "Worth it when you don’t know the area. A local agent knows neighborhood prices, rents and HOA quirks that listing photos and public records don’t show."
      },
      {
        who: "Busy landlord or out-of-state buyer",
        text: "Worth it when you can’t be there in person. An agent can preview homes, attend inspections and keep the deal on schedule."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Buyer-agent pay is negotiated, not automatic. If the seller won’t pay it, you may owe some or all of it. Agree on the fee in writing before you tour, and don’t sign an agreement you can’t afford.",
        example: "NAR’s own guide says the agent’s pay is negotiable and not set by law. It must be written into the buyer agreement.",
        source: {
          label: "NAR: consumer guide to written buyer agreements",
          url: "https://www.nar.realtor/the-facts/consumer-guide-written-buyer-agreements"
        }
      },
      {
        who: "Tax-sale and courthouse-auction buyer",
        text: "Skip one for county tax sales and trustee auctions. The county or trustee runs the sale, so a buyer’s agent has no deal to manage. You may still want an agent’s price estimate before you bid.",
        example: "In California, the Sonoma County treasurer-tax collector says the only way to get legal title to a tax-defaulted parcel is to win the county’s auction.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Experienced investor",
        text: "If you already know the market and how to write an offer, you may need less help. Before you sign any buyer agreement, read the fee, how long it lasts and whether it is exclusive."
      },
      {
        who: "Everyone",
        text: "An agent is not an inspector, appraiser or lawyer. Don’t rely on an agent’s opinion of a home’s condition or legal title."
      }
    ]
  },
  lender: {
    yes: [
      {
        who: "First-time buyer",
        text: "Talk to one before you shop. A loan officer can tell you what you qualify for, which programs fit (FHA, VA, conventional) and how big a down payment you really need."
      },
      {
        who: "Anyone financing a purchase",
        text: "Shopping several lenders can save real money. Rates differ, even for similar borrowers.",
        example: "CFPB research found the average buyer paid about $300 a year more than the lowest rate available to them. That is $9,000 over a 30-year loan.",
        source: {
          label: "CFPB blog, the one thing you can do to save on your new home",
          url: "https://www.consumerfinance.gov/about-us/blog/one-thing-you-can-do-take-control-homebuying-process-and-save-your-new-home-any-housing-market/"
        }
      },
      {
        who: "Landlord building a portfolio",
        text: "Worth it once the property is ready to rent. A long-term, fixed-rate bank loan usually costs far less than private money, which helps your cash flow."
      },
      {
        who: "Bank-owned (REO) buyer",
        text: "A pre-approval letter makes your offer on a listed foreclosure more believable to the selling bank. It isn’t a promise to lend: the appraisal and final underwriting still have to pass."
      }
    ],
    no: [
      {
        who: "Trustee-sale (foreclosure auction) buyer",
        text: "Courthouse and trustee auctions expect cash or cashier’s checks. A normal mortgage can’t close in time.",
        example: "In California, the trustee can require every bidder to show they can pay the full final bid in cash, a cashier’s check or a designated cash equivalent (Civil Code 2924h).",
        source: {
          label: "California Civil Code section 2924h (trustee’s sale bidding)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924h"
        }
      },
      {
        who: "Buyer of a fixer-upper",
        text: "Hold off on a standard mortgage if the home needs major repairs. Many loans require the home to meet property standards, so a renovation loan or cash may be a better fit.",
        example: "The CFPB notes a lender may make major repairs, like a new roof, a condition of the loan that has to be done before closing.",
        source: {
          label: "CFPB, Schedule a home inspection",
          url: "https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/"
        }
      },
      {
        who: "Anyone on a tight budget",
        text: "Being approved for an amount doesn’t mean you can easily afford it. Set your own payment limit, including taxes, insurance and repairs."
      },
      {
        who: "Investor buying a rental or flip",
        text: "A loan for a property you won’t live in usually comes without a Loan Estimate. Ask each lender for written terms (rate, points, fees, term, prepayment penalty) and compare those."
      }
    ]
  },
  private_lender: {
    yes: [
      {
        who: "Fix-and-flip investor",
        text: "Worth it when a house needs too much work for a bank loan and you have a tested repair budget. Hard-money lenders lend mainly on the property’s value and can close in days."
      },
      {
        who: "Auction or cash buyer",
        text: "Worth it after an auction: some investors pay cash, then use private money for repairs before refinancing into a cheaper loan."
      },
      {
        who: "Experienced investor with a clear exit",
        text: "If you have a solid, tested plan to sell or refinance within months, the speed can be worth the higher cost."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Private loans usually cost much more than bank mortgages, with higher rates and upfront points. Cost overruns or delays eat profits quickly."
      },
      {
        who: "First-time investor",
        text: "These loans are short-term. If the house doesn’t sell or refinance before the loan is due, you can lose the property and your down payment."
      },
      {
        who: "Landlord planning to hold",
        text: "Short-term, high-rate money rarely fits a long-term rental unless you have a lender’s written refinance requirements and a backup plan if the refinance comes late or not at all. Rental income seldom covers hard-money payments."
      },
      {
        who: "Everyone",
        text: "Read the loan papers for prepayment penalties, default interest, extension fees and balloon dates. A credit report or appraisal fee before closing can be normal. A demand for “deposits” or “taxes” to release a loan is a scam."
      }
    ]
  },
  title: {
    yes: [
      {
        who: "Every buyer",
        text: "A neutral title and escrow company holds the money and papers and releases them only when every condition is met. That protects both sides."
      },
      {
        who: "Anyone wiring closing funds",
        text: "Scammers target closings with wire fraud. Your best check on wiring instructions is a trusted escrow officer you call at a known number.",
        example: "In a March 2024 case handled by FBI Denver, buyers got a fake email from their supposed agents. It asked them to wire $956,342 to close. The FBI’s Recovery Asset Team stopped and returned $955,060.",
        source: {
          label: "FBI Internet Crime Complaint Center, 2024 Internet Crime Report",
          url: "https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf"
        }
      },
      {
        who: "Buyer of a bank-owned or older property",
        text: "Owner’s title insurance can protect you if someone later claims a right to the home from before you bought it.",
        example: "The CFPB says such claims could come from a previous owner’s unpaid taxes or from contractors who weren’t paid.",
        source: {
          label: "CFPB, What is owner’s title insurance?",
          url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
        }
      },
      {
        who: "Auction buyer doing research",
        text: "Worth it before you bid: a title search or preliminary report shows the liens on record. It isn’t a guarantee, so ask an attorney which ones survive this kind of sale."
      }
    ],
    no: [
      {
        who: "Tax-sale buyer",
        text: "Put off the policy, not the search: title insurers often won’t insure a tax deed right away. You may need to wait or file a quiet title action first.",
        example: "In California, Sonoma County tells tax-sale buyers that most title companies won’t insure title for one year after the tax deed is recorded.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Anyone with a mortgage",
        text: "The lender’s title policy protects the lender, not you. You need a separate owner’s policy to protect your own money."
      },
      {
        who: "Anyone on a tight budget",
        text: "You can usually shop for title insurance rather than take the first company suggested."
      },
      {
        who: "Everyone",
        text: "Never follow wiring instructions from an email, even one that looks like it’s from escrow. Scammers copy real names and logos."
      }
    ]
  },
  attorney: {
    yes: [
      {
        who: "Tax-sale buyer",
        text: "A real estate attorney can file a quiet title action. That is often what makes a tax-deed property insurable and sellable.",
        example: "In California, Sonoma County warns that a quiet title action may be needed before title insurance is available on tax-sale property.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Auction or foreclosure buyer",
        text: "An attorney can review the sale notice and lien search. They can explain which debts survive the sale and what risks remain."
      },
      {
        who: "Investor forming an LLC or partnership",
        text: "Worth it when you invest with partners. An attorney can write down who puts in money, who decides and how profits are split, which prevents costly fights later."
      },
      {
        who: "Landlord",
        text: "An attorney can review leases and notices so they follow your state’s landlord-tenant law."
      }
    ],
    no: [
      {
        who: "Simple, standard purchase",
        text: "In every state DeedOwl covers, escrow or title companies commonly handle closings. So many routine purchases close without an attorney."
      },
      {
        who: "Anyone on a tight budget",
        text: "Hourly fees add up. Ask for a written fee agreement and an estimate before work starts.",
        example: "In California, an attorney has to put the fee agreement in writing when you’re expected to pay more than $1,000 in total (with some exceptions).",
        source: {
          label: "California Business and Professions Code section 6148 (attorney fee agreements)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6148"
        }
      },
      {
        who: "Everyone",
        text: "Check the attorney’s license with the state bar. Choose someone who actually handles real estate in that state, because rules differ by state."
      },
      {
        who: "Investor in a hurry",
        text: "A quiet title action can take months. Count that time in your holding costs before you bid."
      }
    ]
  },
  inspector: {
    yes: [
      {
        who: "First-time buyer",
        text: "An inspector checks the home’s condition. An appraiser gives an opinion of its value. They answer different questions, so you generally need both."
      },
      {
        who: "Buyer of a bank-owned home",
        text: "Foreclosures are often sold as-is. An inspection tells you what you’re getting into. It can also support asking for a better deal or walking away."
      },
      {
        who: "Landlord",
        text: "Find roof, plumbing or electrical problems before you buy. Then you can budget for repairs and avoid surprise vacancies."
      },
      {
        who: "Anyone with an inspection contingency",
        text: "If your contract allows it, a bad inspection can let you cancel without penalty. Skipping it can be costly.",
        example: "A buyer who waived inspection to win a bid found leaks after moving in. The first repair estimate was nearly $20,000.",
        source: {
          label: "AARP: Should You Waive a Home Inspection in a Hot Real Estate Market? (Oct 15, 2021)",
          url: "https://www.aarp.org/home-family/your-home/info-2021/home-inspection-pros-and-cons.html"
        }
      }
    ],
    no: [
      {
        who: "Courthouse-auction or tax-sale buyer",
        text: "You often can’t get inside before the sale, so an inspection may be impossible. Your price must allow for unknown repairs."
      },
      {
        who: "Everyone",
        text: "Choose your own inspector. Someone paid by another party, or paid only if the deal closes, may play down problems."
      },
      {
        who: "Everyone",
        text: "Check credentials. Licensing rules vary by state.",
        example: "In Nevada, working as a home inspector without a state certificate is a misdemeanor (NRS 645D.160).",
        source: {
          label: "Nevada Revised Statutes chapter 645D (inspectors), NRS 645D.160",
          url: "https://www.leg.state.nv.us/NRS/NRS-645D.html"
        }
      },
      {
        who: "Buyer of an older or rural home",
        text: "A general inspection is visual. It may not cover sewer lines, wells, septic, mold or pests, so you may need specialists."
      }
    ]
  },
  contractor: {
    yes: [
      {
        who: "Fix-and-flip investor",
        text: "Worth it before you buy: a qualified contractor’s written bid makes your offer reflect real repair costs."
      },
      {
        who: "Landlord",
        text: "Pulling permits matters for safety, insurance claims and selling later."
      },
      {
        who: "Anyone hiring out work in California",
        text: "In California, you need a licensed contractor for any job of $1,000 or more, and for a smaller job that needs a permit, uses helpers, or is done by someone who advertises as a contractor (Business and Professions Code 7048). Hiring someone licensed also gives you the state’s complaint process.",
        example: "In a May 2024 sting in Merced, CSLB referred 11 people for misdemeanor charges for contracting without a license.",
        source: {
          label: "California Contractors State License Board press release, Merced sting (May 21, 2024)",
          url: "https://www.cslb.ca.gov/Resources/PressReleases/2024/Merced_Sting.pdf"
        }
      },
      {
        who: "Buyer of an auction or REO property",
        text: "Once you have access, contractors can quickly find structural, roof or system problems. Then you can plan the work in order."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "An unlicensed “handyman” may be cheaper but often has no insurance. You could be liable for injuries or bad work.",
        example: "In Nevada, contracting without a license is a misdemeanor on the first offense. On a third offense, it’s a category E felony (NRS 624.700 and 624.750).",
        source: {
          label: "Nevada State Contractors Board, Unlicensed contracting: penalties and law",
          url: "https://www.nvcontractorsboard.com/investigations/unlicensed-contracting-penalties-law/"
        }
      },
      {
        who: "Everyone",
        text: "Don’t pay a large deposit up front.",
        example: "In California, a home improvement contractor may ask for no more than 10% of the project price or $1,000 as a down payment, whichever is less.",
        source: {
          label: "California Contractors State License Board press release, Merced sting (May 21, 2024)",
          url: "https://www.cslb.ca.gov/Resources/PressReleases/2024/Merced_Sting.pdf"
        }
      },
      {
        who: "Experienced investor",
        text: "Small cosmetic jobs like paint may not need a general contractor. Managing trades yourself saves markup but costs your time. Jobs that need a permit still need one. Most electrical, plumbing and heating or air-conditioning work needs a permit, and so a licensed contractor. In Nevada, the small-job exemption never covers these trades. In Utah, the handyman exemption never covers these trades. In Texas, electricians, plumbers and air-conditioning contractors must hold a state license."
      },
      {
        who: "Everyone",
        text: "Don’t sign anything until you’ve checked the license with the state’s official lookup (see “Check before you hire”)."
      }
    ]
  },
  insurance: {
    yes: [
      {
        who: "Every owner",
        text: "An agent can help you choose coverage limits and deductibles you can actually afford if something goes wrong."
      },
      {
        who: "Buyer of a vacant foreclosure or flip",
        text: "Standard policies can stop covering certain losses when a building sits empty. You may need a vacant-property policy.",
        example: "In California, the standard fire policy form says the insurer isn’t required to pay for a loss once a building has been vacant or unoccupied for more than 60 days in a row, unless the policy says otherwise.",
        source: {
          label: "California Insurance Code section 2071 (standard form fire policy)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=INS&sectionNum=2071"
        }
      },
      {
        who: "Landlord",
        text: "An agent can set up a landlord (dwelling fire) policy and liability coverage. A regular homeowners policy may not provide these for a rental."
      },
      {
        who: "Anyone in a flood-prone area",
        text: "Flood is usually a separate policy, so ask about it directly.",
        example: "FEMA says most homeowners insurance does not cover flood damage. Almost one-third of NFIP claims from 2014 to 2024 came from low- to moderate-risk flood zones.",
        source: {
          label: "FEMA / FloodSmart, Most homeowners insurance does not cover flood damage (2025)",
          url: "https://agents.floodsmart.gov/sites/default/files/media/document/2025-08/fema_nfip-most-homeowners-insurance-does-not-cover-flood-damage_postcard_08-2025.pdf"
        }
      }
    ],
    no: [
      {
        who: "Anyone comparing prices",
        text: "An agent tied to one company can only offer that company’s policies. Compare with an independent agent or other insurers."
      },
      {
        who: "Everyone",
        text: "Read the exclusions yourself. Vacancy, flood, earthquake and short-term rental use are common gaps."
      },
      {
        who: "Auction buyer",
        text: "Some insurers hesitate to cover homes they can’t inspect or that need major repairs. Line up options before you bid. Ask the trustee or sheriff, and your insurance agent, when the risk becomes yours under this sale, and have coverage ready by then."
      },
      {
        who: "Anyone on a tight budget",
        text: "Very low premiums can mean high deductibles or thin coverage. Check what you’d actually be paid after a claim."
      }
    ]
  },
  cpa: {
    yes: [
      {
        who: "Landlord with a full-time job",
        text: "Worth it if your rental may show a loss and you have a job. Passive activity rules limit those losses (see “Working with one”), and a CPA can tell you how much you can deduct."
      },
      {
        who: "New landlord",
        text: "Depreciation is a major rental deduction, and part of it is taxed back when you sell. A CPA can set it up correctly from the start.",
        example: "Residential rental buildings are depreciated over 27.5 years under the general system (IRS Publication 527).",
        source: {
          label: "IRS Publication 527, Residential Rental Property",
          url: "https://www.irs.gov/publications/p527"
        }
      },
      {
        who: "Fix-and-flip investor",
        text: "Profit from a flip is often taxed as ordinary income, not as a lower-taxed capital gain. If flipping is your business, you may also owe self-employment tax of about 15.3%.* And you can’t use a 1031 exchange for a flip. Talk to a CPA before you buy, not after you sell."
      },
      {
        who: "Anyone starting an LLC or partnership",
        text: "The type of business you choose affects taxes, bookkeeping and filing. A CPA can explain the trade-offs."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "If you have one simple rental, good records and tax software may be enough. Think about a one-time consultation instead of ongoing fees."
      },
      {
        who: "Higher-income landlord",
        text: "Don’t expect a CPA to unlock the $25,000 rental loss allowance if your income is too high."
      },
      {
        who: "Everyone",
        text: "Not every tax preparer is a CPA. Check credentials before you hire (see “Check before you hire”)."
      },
      {
        who: "Everyone",
        text: "Risky advice is still your responsibility. You sign the return and owe any tax, interest and penalties."
      }
    ]
  },
  property_manager: {
    yes: [
      {
        who: "Out-of-state or busy landlord",
        text: "A manager handles showings, screening, rent collection and repairs. You don’t have to be on call."
      },
      {
        who: "New landlord",
        text: "Worth it if you don’t know fair housing, deposit and notice rules. A license means the manager met state requirements and a regulator can discipline them. It isn’t proof they follow the rules, so check statements yourself.",
        example: "In Nevada, managers must hold a real estate license plus a property management permit. The permit requires at least 24 classroom hours of property management training.",
        source: {
          label: "Nevada Revised Statutes chapter 645, NRS 645.230 and 645.6052",
          url: "https://www.leg.state.nv.us/NRS/NRS-645.html"
        }
      },
      {
        who: "Landlord with several units",
        text: "Worth it once you have several units. Managers often have vendors and systems that cut vacancy time and repair costs."
      },
      {
        who: "Owner of a property with a problem tenant",
        text: "A manager can handle notices and work with an eviction attorney while following the legal process."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Fees can wipe out the cash flow on a small rental. They are usually a share of monthly rent plus leasing and renewal fees. Run the numbers first."
      },
      {
        who: "Everyone",
        text: "Check that the manager is properly licensed in the state where the property is.",
        example: "In Nevada, it’s against the law to work as a property manager without a real estate license and a property management permit (NRS 645.230).",
        source: {
          label: "Nevada Revised Statutes chapter 645, NRS 645.230 and 645.6052",
          url: "https://www.leg.state.nv.us/NRS/NRS-645.html"
        }
      },
      {
        who: "Hands-on landlord",
        text: "If you live nearby and have time, managing one or two units yourself can work. It also teaches you the business."
      },
      {
        who: "Everyone",
        text: "Read the management agreement for cancellation terms, markups on repairs and who keeps late fees."
      }
    ]
  },
  eviction: {
    yes: [
      {
        who: "Landlord",
        text: "Evictions must go through the courts. An eviction attorney helps you get the notices and filings right the first time.",
        example: "In California, the Attorney General said in 2022 that the only legal way to evict a tenant is to file a lawsuit and wait for the court to order the sheriff or marshal to carry it out.",
        source: {
          label: "California Attorney General press release on unlawful lockouts (July 13, 2022)",
          url: "https://oag.ca.gov/node/555214"
        }
      },
      {
        who: "Buyer of an occupied foreclosure",
        text: "Former owners or tenants may still live there after the sale. Removing them takes a court process and an officer, not you. After a foreclosure, tenants of the former owner usually get at least 90 days’ notice under federal law."
      },
      {
        who: "Landlord trying to save time",
        text: "A mistake in a notice can restart the clock. Professionals who file every week know local court rules."
      },
      {
        who: "Any landlord",
        text: "Locking a tenant out yourself can cost you money, even if the tenant owes rent.",
        example: "In Nevada, a tenant unlawfully locked out can recover actual damages and up to $2,500 set by the court (NRS 118A.390).",
        source: {
          label: "Nevada Revised Statutes chapter 118A, NRS 118A.390",
          url: "https://www.leg.state.nv.us/NRS/NRS-118A.html"
        }
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Eviction costs, lost rent and turnover can add up to more than the tenant owes. A payment plan or agreed move-out may cost less."
      },
      {
        who: "Auction buyer",
        text: "Count eviction time and cost in your bid. The county or trustee generally won’t do it for you.",
        example: "In California, Sonoma County tells tax-sale buyers it doesn’t handle foreclosures or evictions.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Everyone",
        text: "Never change locks, shut off utilities or remove belongings to force someone out, even if a “process server” offers to help."
      },
      {
        who: "Landlord with a simple case",
        text: "Courts publish self-help forms, so some landlords handle simple cases themselves. But errors can delay the case."
      }
    ]
  },
  appraiser: {
    yes: [
      { who: "Investor setting a maximum bid", text: "An appraiser gives a written opinion of value. Ask for two numbers: the value as it stands today (\"as is\") and the value after repairs. Then set your top bid so the deal still works after repair costs." },
      { who: "Cash buyer with no lender", text: "If you pay cash, no lender checks the price for you. Hire your own state-licensed or certified appraiser. You get an independent second look before you commit your money.", example: "In a scheme run from Utah, beginner investors bought West Virginia homes using false appraisals that about doubled their value. One home appraised at $645,000 had been under contract for $355,000. It later sold in a short sale (a sale for less than the loan balance) for $282,500.", source: { label: "U.S. Attorney, S.D. West Virginia (2012)", url: "https://www.justice.gov/archive/usao/wvs/press_releases/Nov2012/attachments/110512Morris-sentencing.html" } },
      { who: "Investor planning to refinance", text: "When you refinance, your lender may order a new appraisal and may charge you a fair fee for it. That value helps decide how much you can borrow. So plan your numbers around a realistic value.", source: { label: "CFPB: What are appraisals?", url: "https://www.consumerfinance.gov/ask-cfpb/what-are-appraisals-and-why-do-i-need-to-look-at-them-en-167/" } },
      { who: "Any buyer using a first mortgage on a home", text: "Your lender has to give you a free copy of every appraisal. You get it right after it’s finished or at least three business days before closing, whichever comes first (federal Equal Credit Opportunity Act, Regulation B).", source: { label: "CFPB: Regulation B § 1002.14", url: "https://www.consumerfinance.gov/rules-policy/regulations/1002/14/" } },
    ],
    no: [
      { who: "Auction buyer who can’t go inside", text: "At many foreclosure and tax sales you can’t get inside before you bid. Then an appraiser has to work from the outside and public records. Hidden damage won’t show up in the value. Treat that number as rough and keep a big repair cushion." },
      { who: "Buyer getting a Fannie Mae-backed mortgage", text: "Don’t pay for your own appraisal expecting the lender to use it. Fannie Mae says lenders choose the appraiser. They may not use appraisals ordered by borrowers or others with an interest in the deal. Yours can still help you decide what to offer.", source: { label: "Fannie Mae Selling Guide B4-1.1-03", url: "https://selling-guide.fanniemae.com/sel/b4-1.1-03/appraiser-selection-criteria" } },
      { who: "Anyone treating the number as a fact", text: "An appraisal is an opinion of value on a certain date. It can be wrong or even biased. You can ask the lender to reconsider the value. Point out errors or better comparable sales. But each lender’s process is different.", example: "A Baltimore couple said their home appraised at $472,000 while family photos were up. A second appraisal, after they took the photos down, came in at $750,000.", source: { label: "CFPB blog (Mar. 13, 2023)", url: "https://www.consumerfinance.gov/about-us/blog/protecting-homeowners-from-discriminatory-home-appraisals/" } },
      { who: "Flipper selling within six months", text: "If you bought the home less than six months ago and your buyer gets a higher-priced mortgage, the buyer’s lender may need a second appraisal with an inside inspection. That applies when your resale price is more than 10% above what you paid within 90 days, or more than 20% above it within 91 to 180 days.", source: { label: "CFPB: Flipped homes and second appraisals", url: "https://www.consumerfinance.gov/ask-cfpb/i-was-told-im-buying-a-home-that-was-flipped-and-that-i-have-to-get-a-second-appraisal-how-does-that-work-en-1799/" } },
    ],
  },
  environmental: {
    yes: [
      {
        who: "Buyer of commercial, industrial or vacant land",
        text: "A Phase I environmental site assessment looks for signs of past pollution, like from an old gas station or dry cleaner, before you buy."
      },
      {
        who: "Anyone buying former industrial property",
        text: "Do “All Appropriate Inquiries” (AAI) before you buy. Doing them can protect you from federal cleanup liability under CERCLA (Superfund).",
        example: "EPA says AAI done to the ASTM E1527-21 standard can help protect you as an innocent landowner, a contiguous property owner or a bona fide prospective purchaser.",
        source: {
          label: "U.S. EPA, Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        who: "Investor using a commercial loan",
        text: "Many commercial lenders require a Phase I before they will lend."
      },
      {
        who: "Business-closure or receivership buyer",
        text: "Closed shops, garages and plants may have tanks or chemicals left behind. An assessment tells you before the cleanup becomes yours."
      }
    ],
    no: [
      {
        who: "Typical single-family home buyer",
        text: "A Phase I is usually overkill for an ordinary house. A home inspection plus radon, mold or lead testing may fit better."
      },
      {
        who: "Investor in a hurry",
        text: "Don’t skip it to save time; time it instead. A report done too early may not protect you. The environmental professional’s signed declaration must also be within 180 days of buying.",
        example: "EPA says AAI must be done within one year before you buy. Key parts must be done within 180 days: interviews, records review, site visit and lien search.",
        source: {
          label: "U.S. EPA, Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        who: "Everyone",
        text: "A Phase I is mostly a records review, interviews and a site visit. Testing soil or water is a separate Phase II. So a “clean” Phase I isn’t a guarantee.",
        example: "EPA says Phase II sampling and analysis fall outside the AAI rule, and so do lead paint, mold, radon and asbestos.",
        source: {
          label: "U.S. EPA, Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        who: "Anyone on a tight budget",
        text: "If the Phase I flags a concern, Phase II testing and cleanup can cost far more than the property is worth. Be ready to walk away."
      }
    ]
  }
} satisfies Record<string, { yes: WhyPoint[]; no: WhyPoint[] }>;
