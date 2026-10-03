// Why you would hire each professional, and why you might not: from different buyers’ points of view, with real examples.
// Every example is from a source we read (see each point’s source). Researched and checked 2026-10-02.

import type { WhyPoint } from './lessons/types';

export const PRO_WHY = {
  agent: {
    yes: [
      {
        who: "First-time buyer",
        text: "A buyer’s agent can walk you through offers, contingencies and deadlines, which is where new buyers most often make costly mistakes.",
        example: "Since August 17, 2024, agents ask buyers to sign a written buyer agreement after choosing them, and the agreement must spell out the pay (a set amount, flat fee, percent or hourly rate), so you know the cost up front.",
        source: {
          label: "NAR: consumer guide to written buyer agreements",
          url: "https://www.nar.realtor/the-facts/consumer-guide-written-buyer-agreements"
        }
      },
      {
        who: "Buyer of bank-owned (REO) homes",
        text: "Banks and Fannie Mae/Freddie Mac often list their foreclosed homes through local agents, so an agent can get you showings and submit offers in the format the seller expects."
      },
      {
        who: "Investor new to a market",
        text: "A local agent knows neighborhood prices, rent levels and HOA quirks that are hard to see from listing photos or public records."
      },
      {
        who: "Busy landlord or out-of-state buyer",
        text: "An agent can preview homes, attend inspections and keep the deal on schedule when you can’t be there in person."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Buyer-agent pay is now negotiated, not automatic, so you may have to cover some or all of the fee yourself if the seller won’t.",
        example: "NAR’s own guide says the agent’s pay is negotiable and not set by law, and must be written into the buyer agreement.",
        source: {
          label: "NAR: consumer guide to written buyer agreements",
          url: "https://www.nar.realtor/the-facts/consumer-guide-written-buyer-agreements"
        }
      },
      {
        who: "Tax-sale and courthouse-auction buyer",
        text: "Government tax sales and trustee auctions are run directly by the county or trustee, so a buyer’s agent usually has no transaction to manage and may add cost without adding access.",
        example: "In Sonoma County, California, the treasurer-tax collector says legal title to a tax-defaulted parcel comes only from winning the county’s auction.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Experienced investor",
        text: "Agents are paid when a deal closes, so read the written buyer agreement carefully for the fee, the term and whether it is exclusive before you sign."
      },
      {
        who: "Everyone",
        text: "An agent is not an inspector, appraiser or lawyer; don’t rely on an agent’s opinion of a home’s condition or legal title."
      }
    ]
  },
  lender: {
    yes: [
      {
        who: "First-time buyer",
        text: "A loan officer can tell you what you qualify for, which programs fit (FHA, VA, conventional) and how big a down payment you really need."
      },
      {
        who: "Anyone financing a purchase",
        text: "Shopping several lenders can save real money because rates differ for similar borrowers.",
        example: "CFPB research found the average buyer paid about $300 a year more than the lowest rate available to them, or $9,000 over a 30-year loan.",
        source: {
          label: "CFPB blog, the one thing you can do to save on your new home",
          url: "https://www.consumerfinance.gov/about-us/blog/one-thing-you-can-do-take-control-homebuying-process-and-save-your-new-home-any-housing-market/"
        }
      },
      {
        who: "Landlord building a portfolio",
        text: "Long-term, fixed-rate bank financing is usually far cheaper than private money, which helps rental cash flow."
      },
      {
        who: "Bank-owned (REO) buyer",
        text: "A pre-approval letter makes your offer on a listed foreclosure more credible to the selling bank."
      }
    ],
    no: [
      {
        who: "Trustee-sale (foreclosure auction) buyer",
        text: "Courthouse and trustee auctions expect payment in cash or cashier’s checks, so a normal mortgage can’t close in time.",
        example: "California Civil Code 2924h lets the trustee require every bidder to show they can pay the full final bid in cash, a cashier’s check or a designated cash equivalent.",
        source: {
          label: "California Civil Code section 2924h (trustee’s sale bidding)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924h"
        }
      },
      {
        who: "Buyer of a fixer-upper",
        text: "Many standard loans require the home to meet property standards; if the appraisal finds major repairs, the lender can require them before closing.",
        example: "The CFPB notes a lender may require major repairs, like a new roof, to be made before closing as a condition of the loan.",
        source: {
          label: "CFPB, Schedule a home inspection",
          url: "https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/"
        }
      },
      {
        who: "Anyone on a tight budget",
        text: "Being approved for an amount doesn’t mean you can comfortably afford it; set your own payment limit, including taxes, insurance and repairs."
      },
      {
        who: "Everyone",
        text: "Don’t take the first quote; compare Loan Estimates from at least a few lenders before you commit."
      }
    ]
  },
  private_lender: {
    yes: [
      {
        who: "Fix-and-flip investor",
        text: "Hard-money lenders lend mainly on the property’s value and can close in days, which can work for a house a bank won’t finance because of its condition."
      },
      {
        who: "Auction or cash buyer",
        text: "Some investors pay cash at auction and then use private money to repair the property before refinancing into a cheaper loan."
      },
      {
        who: "Experienced investor with a clear exit",
        text: "If you have a solid, tested plan to sell or refinance within months, the speed can be worth the higher cost."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Private loans usually carry much higher rates and upfront points than bank mortgages, so cost overruns or delays eat profits quickly."
      },
      {
        who: "First-time investor",
        text: "These loans are short-term; if the house doesn’t sell or refinance before the loan is due, you can lose the property and your down payment."
      },
      {
        who: "Landlord planning to hold",
        text: "Short-term, high-rate money rarely fits a long-term rental unless you’re sure you can refinance; rental income seldom covers hard-money payments."
      },
      {
        who: "Everyone",
        text: "Read the note for prepayment penalties, default interest, extension fees and balloon dates, and have an attorney review it if anything is unclear."
      }
    ]
  },
  title: {
    yes: [
      {
        who: "Every buyer",
        text: "A neutral title and escrow company holds the money and documents and only releases them when every condition is met, which protects both sides."
      },
      {
        who: "Anyone wiring closing funds",
        text: "Wire fraud targets closings; a reputable escrow officer you call at a known number is your best check on wiring instructions.",
        example: "In a March 2024 case handled by FBI Denver, buyers received a spoofed email from their supposed agents asking them to wire $956,342 to close; the FBI’s Recovery Asset Team stopped and returned $955,060.",
        source: {
          label: "FBI Internet Crime Complaint Center, 2024 Internet Crime Report",
          url: "https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf"
        }
      },
      {
        who: "Buyer of a bank-owned or older property",
        text: "Owner’s title insurance can protect you if someone later claims an interest in the home from before you bought it.",
        example: "The CFPB says such claims could come from a previous owner’s unpaid taxes or from contractors who weren’t paid.",
        source: {
          label: "CFPB, What is owner’s title insurance?",
          url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
        }
      },
      {
        who: "Auction buyer doing research",
        text: "A title company can run a title search or preliminary report before you bid, so you know which liens may survive the sale."
      }
    ],
    no: [
      {
        who: "Tax-sale buyer",
        text: "Title insurers often won’t insure a tax deed right away, so you may need to wait or file a quiet title action first.",
        example: "Sonoma County, California tells tax-sale buyers that most title companies won’t insure title for one year after the tax deed is recorded.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Anyone with a mortgage",
        text: "The lender’s title policy protects the lender, not you; you need a separate owner’s policy to protect your own investment."
      },
      {
        who: "Anyone on a tight budget",
        text: "You can usually shop for title insurance rather than accept the first provider suggested."
      },
      {
        who: "Everyone",
        text: "Never follow wiring instructions from an email, even one that looks like it’s from escrow; scammers copy real names and logos."
      }
    ]
  },
  attorney: {
    yes: [
      {
        who: "Tax-sale buyer",
        text: "A real estate attorney can file a quiet title action, which is often what makes a tax-deed property insurable and sellable.",
        example: "Sonoma County, California warns that a quiet title action may be needed before title insurance is available on tax-sale property.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Auction or foreclosure buyer",
        text: "An attorney can review the sale notice and lien search to explain which debts survive the sale and what risks remain."
      },
      {
        who: "Investor forming an LLC or partnership",
        text: "Agreements on who puts in money, who decides and how profits are split prevent expensive disputes later."
      },
      {
        who: "Landlord",
        text: "An attorney can review leases and notices so they follow your state’s landlord-tenant law."
      }
    ],
    no: [
      {
        who: "Simple, standard purchase",
        text: "In Nevada, California, Arizona and Utah, escrow and title companies commonly handle closings, so many routine purchases close without an attorney."
      },
      {
        who: "Anyone on a tight budget",
        text: "Hourly fees add up; ask for a written fee agreement and an estimate before work starts.",
        example: "In California, an attorney must put the fee contract in writing when total expected cost to the client will exceed $1,000 (with some exceptions).",
        source: {
          label: "California Business and Professions Code section 6148 (attorney fee agreements)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=6148"
        }
      },
      {
        who: "Everyone",
        text: "Check the attorney’s license with the state bar and choose someone who actually handles real estate in that state; rules differ by state."
      },
      {
        who: "Investor in a hurry",
        text: "A quiet title action can take months, so factor that time into your holding costs before you bid."
      }
    ]
  },
  inspector: {
    yes: [
      {
        who: "First-time buyer",
        text: "An inspector looks at the home’s condition; an appraisal only estimates value for the lender, so you generally need both."
      },
      {
        who: "Buyer of a bank-owned home",
        text: "Foreclosures are often sold as-is; an inspection tells you what you’re getting into and can support a renegotiation or a decision to walk away."
      },
      {
        who: "Landlord",
        text: "Finding roof, plumbing or electrical problems before you buy lets you budget repairs and avoid surprise vacancies."
      },
      {
        who: "Anyone with an inspection contingency",
        text: "If your contract allows it, an unsatisfactory inspection can let you cancel without penalty."
      }
    ],
    no: [
      {
        who: "Courthouse-auction or tax-sale buyer",
        text: "You often can’t get inside before the sale, so an inspection may be impossible and the price must allow for unknown repairs."
      },
      {
        who: "Everyone",
        text: "Choose your own inspector; someone paid by another party, or only if the deal closes, may play down problems."
      },
      {
        who: "Everyone",
        text: "Check credentials; licensing rules vary by state.",
        example: "In Nevada, acting as a home inspector without a state certificate is a misdemeanor (NRS 645D.160).",
        source: {
          label: "Nevada Revised Statutes chapter 645D (inspectors), NRS 645D.160",
          url: "https://www.leg.state.nv.us/NRS/NRS-645D.html"
        }
      },
      {
        who: "Buyer of an older or rural home",
        text: "A general inspection is visual and may not cover sewer lines, wells, septic, mold or pests; you may need specialists."
      }
    ]
  },
  contractor: {
    yes: [
      {
        who: "Fix-and-flip investor",
        text: "A licensed contractor can give a written bid before you buy, so your offer reflects real repair costs."
      },
      {
        who: "Landlord",
        text: "Licensed contractors pull permits, which matters for safety, insurance claims and selling later."
      },
      {
        who: "Anyone hiring out work in California",
        text: "Hiring licensed is required for larger jobs and gives you access to state complaint processes.",
        example: "In California, a contractor’s license is required for jobs of $500 or more; in a May 2024 sting in Merced, CSLB referred 11 people for misdemeanor prosecution for contracting without a license.",
        source: {
          label: "California Contractors State License Board press release, Merced sting (May 21, 2024)",
          url: "https://www.cslb.ca.gov/Resources/PressReleases/2024/Merced_Sting.pdf"
        }
      },
      {
        who: "Buyer of an auction or REO property",
        text: "Contractors can find structural, roof or system issues quickly once you have access, so you can plan the work in order."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "An unlicensed ‘handyman’ may be cheaper but often has no insurance and can leave you liable for injuries or bad work.",
        example: "In Nevada, contracting without a license is a misdemeanor on the first offense and a Class E felony on the third (NRS 624.700).",
        source: {
          label: "Nevada State Contractors Board, Unlicensed contracting: penalties and law",
          url: "https://www.nvcontractorsboard.com/investigations/unlicensed-contracting-penalties-law/"
        }
      },
      {
        who: "Everyone",
        text: "Don’t pay a large deposit up front.",
        example: "In California, a home improvement contractor may ask for no more than 10% of the project price or $1,000, whichever is less, as a down payment.",
        source: {
          label: "California Contractors State License Board press release, Merced sting (May 21, 2024)",
          url: "https://www.cslb.ca.gov/Resources/PressReleases/2024/Merced_Sting.pdf"
        }
      },
      {
        who: "Experienced investor",
        text: "Small cosmetic jobs may not need a general contractor; managing trades yourself saves markup but costs your time, and permits still apply."
      },
      {
        who: "Everyone",
        text: "Verify the license on the state board’s website (NSCB in Nevada, CSLB in California, ROC in Arizona, DOPL in Utah) before signing anything."
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
        text: "Standard policies can stop covering certain losses when a building sits empty, so you may need a vacant-property policy.",
        example: "California’s standard fire policy form says the insurer isn’t liable for loss while a building is vacant or unoccupied beyond 60 consecutive days, unless the policy says otherwise.",
        source: {
          label: "California Insurance Code section 2071 (standard form fire policy)",
          url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=INS&sectionNum=2071"
        }
      },
      {
        who: "Landlord",
        text: "An agent can set up a landlord (dwelling fire) policy and liability coverage, which a regular homeowners policy may not provide for a rental."
      },
      {
        who: "Anyone in a flood-prone area",
        text: "Flood is usually a separate policy, so ask about it explicitly.",
        example: "FEMA says most homeowners insurance does not cover flood damage, and almost one-third of NFIP claims from 2014 to 2024 came from low- to moderate-risk flood zones.",
        source: {
          label: "FEMA / FloodSmart, Most homeowners insurance does not cover flood damage (2025)",
          url: "https://agents.floodsmart.gov/sites/default/files/media/document/2025-08/fema_nfip-most-homeowners-insurance-does-not-cover-flood-damage_postcard_08-2025.pdf"
        }
      }
    ],
    no: [
      {
        who: "Anyone comparing prices",
        text: "An agent tied to one company can only offer that company’s policies; compare with an independent agent or other carriers."
      },
      {
        who: "Everyone",
        text: "Read the exclusions yourself; vacancy, flood, earthquake and short-term rental use are common gaps."
      },
      {
        who: "Auction buyer",
        text: "Some insurers hesitate to cover homes they can’t inspect or that need major repairs; line up options before you bid so the home isn’t uninsured after the sale."
      },
      {
        who: "Anyone on a tight budget",
        text: "Very low premiums can mean high deductibles or thin coverage; check what you’d actually be paid after a claim."
      }
    ]
  },
  cpa: {
    yes: [
      {
        who: "Landlord with a full-time job",
        text: "Rental losses are limited by passive activity rules, and a CPA can tell you how much you can deduct.",
        example: "IRS Publication 925 lets active participants deduct up to $25,000 of rental losses against other income, phased out between $100,000 and $150,000 of modified AGI.",
        source: {
          label: "IRS Publication 925, Passive Activity and At-Risk Rules",
          url: "https://www.irs.gov/publications/p925"
        }
      },
      {
        who: "New landlord",
        text: "Depreciation is a major rental deduction, and a CPA can set it up correctly from the start.",
        example: "IRS Publication 527 says residential rental buildings are depreciated over 27.5 years under the general system.",
        source: {
          label: "IRS Publication 527, Residential Rental Property",
          url: "https://www.irs.gov/publications/p527"
        }
      },
      {
        who: "Fix-and-flip investor",
        text: "Flips are often taxed differently from long-term rentals, and a CPA can help you plan for the tax before you sell."
      },
      {
        who: "Anyone starting an LLC or partnership",
        text: "Choosing an entity affects taxes, bookkeeping and filing; a CPA can explain the trade-offs."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "If you have one simple rental, good records and tax software may be enough; consider a one-time consultation instead of ongoing fees."
      },
      {
        who: "Higher-income landlord",
        text: "Don’t expect a CPA to unlock the $25,000 rental loss allowance if your income is too high."
      },
      {
        who: "Everyone",
        text: "Not every tax preparer is a CPA; check credentials before you hire.",
        example: "The IRS notes that anyone with a Preparer Tax Identification Number can prepare returns for pay, and skill levels vary.",
        source: {
          label: "IRS, Choosing a tax professional",
          url: "https://www.irs.gov/tax-professionals/choosing-a-tax-professional"
        }
      },
      {
        who: "Everyone",
        text: "Aggressive advice is still your responsibility; you sign the return and owe any tax, interest and penalties."
      }
    ]
  },
  property_manager: {
    yes: [
      {
        who: "Out-of-state or busy landlord",
        text: "A manager handles showings, screening, rent collection and repairs so you don’t have to be on call."
      },
      {
        who: "New landlord",
        text: "A licensed manager should know fair housing, deposit and notice rules, which helps you avoid costly mistakes.",
        example: "In Nevada, managers must hold a real estate license plus a property management permit, which requires at least 24 classroom hours of property management instruction.",
        source: {
          label: "Nevada Revised Statutes chapter 645, NRS 645.230 and 645.6052",
          url: "https://www.leg.state.nv.us/NRS/NRS-645.html"
        }
      },
      {
        who: "Landlord with several units",
        text: "Managers often have vendors and systems that cut vacancy time and repair costs."
      },
      {
        who: "Owner of a property with a problem tenant",
        text: "A manager can handle notices and coordinate with an eviction attorney while following the legal process."
      }
    ],
    no: [
      {
        who: "Anyone on a tight budget",
        text: "Fees (usually a share of monthly rent plus leasing and renewal fees) can wipe out the cash flow on a small rental; run the numbers first."
      },
      {
        who: "Everyone",
        text: "Check that the manager is properly licensed in the state where the property is.",
        example: "Nevada law makes it unlawful to act as a property manager without a real estate license and a property management permit (NRS 645.230).",
        source: {
          label: "Nevada Revised Statutes chapter 645, NRS 645.230 and 645.6052",
          url: "https://www.leg.state.nv.us/NRS/NRS-645.html"
        }
      },
      {
        who: "Hands-on landlord",
        text: "If you live nearby and have time, managing one or two units yourself can work and teaches you the business."
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
        text: "Evictions must go through the courts; an eviction attorney helps you get the notices and filings right the first time.",
        example: "In 2022, California’s Attorney General said the only lawful way to evict a tenant is to file a lawsuit and wait for the court to order the sheriff or marshal to carry it out.",
        source: {
          label: "California Attorney General press release on unlawful lockouts (July 13, 2022)",
          url: "https://oag.ca.gov/node/555214"
        }
      },
      {
        who: "Buyer of an occupied foreclosure",
        text: "Former owners or tenants may still be living there after the sale, and removing them requires a court process and the sheriff or constable, not you."
      },
      {
        who: "Landlord trying to save time",
        text: "A mistake in a notice can restart the clock; professionals who file every week know local court rules."
      },
      {
        who: "Any landlord",
        text: "Self-help lockouts can cost you money even if the tenant owes rent.",
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
        text: "Eviction costs, lost rent and turnover can exceed what a tenant owes; a payment plan or negotiated move-out may cost less."
      },
      {
        who: "Auction buyer",
        text: "Factor eviction time and cost into your bid; the county or trustee generally won’t do it for you.",
        example: "Sonoma County, California tells tax-sale buyers it does not handle foreclosure or eviction processes.",
        source: {
          label: "Sonoma County (CA) Treasurer-Tax Collector, Tax-defaulted property auctions FAQs",
          url: "https://sonomacounty.gov/administrative-support-and-fiscal-services/auditor-controller-treasurer-tax-collector/divisions/revenue-accounting/tax-defaulted-property-auctions/tax-defaulted-property-auctions-faqs"
        }
      },
      {
        who: "Everyone",
        text: "Never change locks, shut off utilities or remove belongings to force someone out, even with help from a ‘process server’."
      },
      {
        who: "Landlord with a simple case",
        text: "Courts publish self-help forms, so some landlords handle simple cases themselves, but errors can delay the case."
      }
    ]
  },
  appraiser: {
    yes: [
      {
        who: "Investor setting a maximum bid or offer",
        text: "An appraisal gives you a professional value, as the property stands and after the repairs you plan, so your maximum isn’t built on a guess."
      },
      {
        who: "Buyer paying cash",
        text: "With no lender, nobody else checks the price. An appraisal is your check before you pay."
      },
      {
        who: "Investor planning a refinance",
        text: "The loan you get later depends on the lender’s appraisal. Knowing the value first helps you avoid a refinance that comes up short."
      }
    ],
    no: [
      {
        who: "Auction buyer who can’t go inside",
        text: "An appraiser who can’t see the inside can’t judge its condition. Allow extra for what the appraisal couldn’t see."
      },
      {
        who: "Buyer with a mortgage",
        text: "Lenders usually order their own appraisal, so one you order may not count for the loan. It can still help you decide what to offer."
      }
    ]
  },
  environmental: {
    yes: [
      {
        who: "Buyer of commercial, industrial or vacant land",
        text: "A Phase I environmental site assessment looks for signs of past contamination, like old gas stations or dry cleaners, before you buy."
      },
      {
        who: "Anyone buying former industrial property",
        text: "Doing All Appropriate Inquiries before purchase can protect you from federal cleanup liability under CERCLA (Superfund).",
        example: "EPA says AAI done to the ASTM E1527-21 standard can support protection as an innocent landowner, contiguous property owner or bona fide prospective purchaser.",
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
        text: "Closed shops, garages and plants may have tanks or chemicals left behind; an assessment tells you before the cleanup becomes yours."
      }
    ],
    no: [
      {
        who: "Typical single-family home buyer",
        text: "A Phase I is usually overkill for an ordinary house; a home inspection plus radon, mold or lead testing may fit better."
      },
      {
        who: "Investor in a hurry",
        text: "The timing rules are strict, so a report done too early may not protect you.",
        example: "EPA says AAI must be done within one year before acquisition, and key parts (interviews, records review, site visit, lien search) within 180 days.",
        source: {
          label: "U.S. EPA, Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        who: "Everyone",
        text: "A Phase I is mostly a records review, interviews and a site visit; sampling soil or water is a separate Phase II, so a ‘clean’ Phase I isn’t a guarantee.",
        example: "EPA lists Phase II sampling and analysis, along with lead paint, mold, radon and asbestos, as services beyond the scope of the AAI rule.",
        source: {
          label: "U.S. EPA, Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        who: "Anyone on a tight budget",
        text: "If the Phase I flags a concern, Phase II testing and cleanup can cost far more than the property is worth; be ready to walk away."
      }
    ]
  }
} satisfies Record<string, { yes: WhyPoint[]; no: WhyPoint[] }>;
