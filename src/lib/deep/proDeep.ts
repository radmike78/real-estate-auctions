// In-depth content for each professional (Your Team): detail and real stories, from sources we read (researched 2026-10-03).
// Private people are described, never named.

import type { TopicDeep } from './types';

export const PRO_DEEP: Partial<Record<string, TopicDeep>> = {
  agent: {
    overview: [
      "A real estate agent helps you find a property, write and negotiate the offer, and get to closing. A buyer’s agent is supposed to work for you, not the seller. How much an agent helps depends on the person. A careful agent checks facts, spots red flags, and pushes you to compare lenders and get inspections. A careless one passes along whatever the seller’s side says.",
      "Watch who the agent really works for. Sometimes one brokerage, or one person, represents both buyer and seller. This is called “dual agency.” Both sides must be told and must agree in writing. In Nevada, a licensee must give a duties-owed form and get each party’s written consent before acting for more than one party. In California, a brokerage may act as a dual agent only with both parties’ consent after full disclosure. In Utah, an agent for both sides (a “limited agent”) must first get both parties’ informed consent in writing. Since August 17, 2024, agents who belong to a Realtor-run MLS must sign a written agreement with a buyer before touring a home, even a virtual tour. That agreement sets the agent’s pay. In California, state law also requires a written buyer agreement no later than your offer. For an individual buyer it can last at most three months and can’t renew automatically.",
      "A note for auction buyers: many forced-sale purchases happen without an agent at all. Examples are county tax sales and trustee’s sales at the courthouse. Agents matter most for bank-owned (REO) and Fannie Mae/Freddie Mac homes listed on the MLS. There, offers usually go through a licensed agent."
    ],
    bestFor: [
      "First-time buyers who need someone to walk them through offers, deadlines and disclosures.",
      "Buyers of bank-owned (REO) or Fannie Mae/Freddie Mac homes. These are usually sold through listing agents and standard purchase contracts.",
      "Out-of-area buyers who can’t visit the property or neighborhood themselves.",
      "Buyers who want help comparing lenders and lining up inspectors, title and escrow."
    ],
    notFor: [
      "Bidders at county tax-deed sales or trustee’s sales. There is usually no listing agent there, and agents can’t change the sale terms.",
      "Buyers who won’t read the documents themselves. An agent’s word on size, condition or title is not a substitute for checking public records.",
      "Anyone who isn’t comfortable with dual agency and hasn’t asked whether the agent or brokerage also represents the seller."
    ],
    costs: [
      "Agent pay is negotiable and must be written into the buyer agreement. The agent may not take more from any source than that agreement allows (NAR settlement rules, Aug 2024).",
      "A seller may still offer to pay part or all of the buyer agent’s fee. But that is a term you negotiate in the deal, not a set rate.",
      "A bad agent can cost far more than the fee. Wrong square footage or a botched dual-agency deal can lead to a lawsuit (see stories)."
    ],
    money: [
      "Agents are usually paid a commission when the deal closes. The amount is set in the written buyer agreement, and you can negotiate it (NAR Settlement FAQs).",
      "Since Aug 17, 2024, offers of buyer-agent pay can’t be posted on Realtor-run MLSs. So ask up front who will pay your agent and how much (NAR Settlement FAQs)."
    ],
    checklist: [
      "Look up the agent’s license with the state regulator and check for discipline. The regulators are the Nevada Real Estate Division, California DRE, Arizona Department of Real Estate and Utah Division of Real Estate.",
      "Make sure the agent is licensed in the state where the property is. Nevada has disciplined California brokers acting on Nevada deals without a Nevada license.",
      "Ask in writing whether the agent or brokerage also represents the seller (dual agency) and what that changes.",
      "Read the buyer agreement: pay amount, who pays, how long it lasts, and how to end it.",
      "Ask the agent for the public-record facts, such as assessor square footage, permits and HOA resale packages. Ask them to say plainly what they have not verified.",
      "Expect the agent to urge you to get several loan quotes and a home inspection. They should never send wire instructions by email."
    ],
    facts: [
      {
        text: "Nevada: acting for both sides without each party’s written consent breaks state law (NRS 645.252).",
        source: {
          label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law and Order, Case 2017-64 (Jun 2019)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2019/Orders/LeBeau-Witty_Patricia_2017-64.pdf"
        }
      },
      {
        text: "Nevada has disciplined a California-licensed broker who represented the seller of a Las Vegas property without a Nevada license.",
        source: {
          label: "Nevada Real Estate Commission: Stipulation and Order, Case 2021-93 (Feb 2023)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2023/Orders/February/Bracco-Jeff_2021-93_Stip-Order.pdf"
        }
      },
      {
        text: "California: a brokerage may be a dual agent only if both parties consent after full disclosure.",
        source: {
          label: "Supreme Court of California: Horiike v. Coldwell Banker Residential Brokerage Co., S218734 (Nov 21, 2016)",
          url: "https://www.courts.ca.gov/opinions/archive/S218734.PDF"
        }
      },
      {
        text: "Since Aug 2024, Realtor MLS members need a written agreement with a buyer before touring a home.",
        source: {
          label: "National Association of Realtors: NAR Settlement FAQs",
          url: "https://www.nar.realtor/the-facts/nar-settlement-faqs"
        }
      },
      {
        text: "An agent can’t be paid more than the written buyer agreement allows.",
        source: {
          label: "National Association of Realtors: NAR Settlement FAQs",
          url: "https://www.nar.realtor/the-facts/nar-settlement-faqs"
        }
      },
      {
        text: "Research caution (seller side, one unusual market): an NBER study looked at a market where listings were open to all. There, sellers who used a broker sold for 5.9% to 7.7% less. Agents’ incentives and clients’ interests don’t always line up.",
        source: {
          label: "NBER Working Paper 13796: Do Real Estate Brokers Add Value When Listing Services Are Unbundled? (Bernheim & Meer)",
          url: "https://www.nber.org/papers/w13796"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A couple buying a vacant lot near Helotes (San Antonio), Texas",
        year: "2023",
        title: "Listing agent’s phone call stopped a fake land sale",
        happened: "A couple’s $250,000 cash offer on a one-acre vacant lot was accepted. But the ‘seller’, who had hired the listing agent online, was an impostor. The agent found a different phone number for the real owner and called it. A different voice was on the voicemail, so the agent stopped the sale. The station reported the buyers would have lost about $200,000.",
        lesson: "A careful agent who checks for themselves who really owns the property can save a buyer from wiring money to a thief.",
        source: {
          label: "KSAT 12 (San Antonio): Dirty deals: Imposters try to sell vacant land in Helotes they don’t own (Mar 30, 2023)",
          url: "https://www.ksat.com/news/local/2023/03/30/dirty-deals-imposters-try-to-sell-vacant-land-in-helotes-they-dont-own"
        }
      },
      {
        tone: "good",
        who: "A 28-year-old first-time buyer in Baton Rouge, Louisiana",
        year: "2025",
        title: "Agent insisted she compare several lenders",
        happened: "Her agent refused to send her to just one loan officer. Instead, the agent gave her several to choose from. She almost skipped the extra applications. But the last lender offered 5.25%, when the others offered 6% to 7%. She closed in October 2025.",
        lesson: "A good agent steers you to compare lenders, not just to the agent’s favorite referral.",
        source: {
          label: "Bankrate via WCAX: Three homeowners who scored lower mortgage rates: and how they did it (Jun 30, 2026)",
          url: "https://www.wcax.com/bankrate-article/2026/06/29/three-homeowners-who-scored-lower-mortgage-rates-how-they-did-it/"
        }
      },
      {
        tone: "caution",
        who: "A cash buyer of a home in Henderson, Nevada",
        year: "2016",
        title: "Agent sold her own home, acted for both sides, then tried to change the deal",
        happened: "A licensee wrote a contract to sell her own home. She listed herself as agent for both seller and buyer, without the required duties-owed form or written consent. She then tried to remove the buyer’s 3% closing-cost credit and threatened to relist the home. The buyer cancelled when HOA resale packages never arrived. In 2019 the Nevada Real Estate Commission downgraded her license and fined her $11,616.64 including costs.",
        lesson: "Be careful when the ‘agent’ is also the seller or represents both sides. Insist on the written disclosures your state requires.",
        source: {
          label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law and Order, Case 2017-64 (Jun 2019)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2019/Orders/LeBeau-Witty_Patricia_2017-64.pdf"
        }
      },
      {
        tone: "caution",
        who: "A buyer of a Malibu, California, luxury home (one brokerage on both sides)",
        year: "2016",
        title: "Marketed as 15,000 sq ft; public records said about 9,400",
        happened: "The listing salesperson marketed the home as about 15,000 square feet of living area. But the assessor’s record and building permit showed far less. Another agent at the same brokerage represented the buyer. The buyer bought without checking and later found the gap. In 2016 the California Supreme Court held that the seller’s salesperson owed the buyer the same fiduciary duty as the dual-agent brokerage.",
        lesson: "In dual agency, check size and condition in public records yourself. Know the agent’s duties to you before you rely on their numbers.",
        source: {
          label: "Supreme Court of California: Horiike v. Coldwell Banker Residential Brokerage Co., S218734 (Nov 21, 2016)",
          url: "https://www.courts.ca.gov/opinions/archive/S218734.PDF"
        }
      }
    ],
    sources: [
      {
        label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law and Order, Case 2017-64 (Jun 2019)",
        url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2019/Orders/LeBeau-Witty_Patricia_2017-64.pdf"
      },
      {
        label: "Nevada Real Estate Commission: Stipulation and Order, Case 2021-93 (Feb 2023)",
        url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2023/Orders/February/Bracco-Jeff_2021-93_Stip-Order.pdf"
      },
      {
        label: "Supreme Court of California: Horiike v. Coldwell Banker Residential Brokerage Co., S218734 (Nov 21, 2016)",
        url: "https://www.courts.ca.gov/opinions/archive/S218734.PDF"
      },
      {
        label: "National Association of Realtors: NAR Settlement FAQs",
        url: "https://www.nar.realtor/the-facts/nar-settlement-faqs"
      },
      {
        label: "NBER Working Paper 13796: Do Real Estate Brokers Add Value When Listing Services Are Unbundled? (Bernheim & Meer)",
        url: "https://www.nber.org/papers/w13796"
      },
      {
        label: "KSAT 12 (San Antonio): Dirty deals: Imposters try to sell vacant land in Helotes they don’t own (Mar 30, 2023)",
        url: "https://www.ksat.com/news/local/2023/03/30/dirty-deals-imposters-try-to-sell-vacant-land-in-helotes-they-dont-own"
      },
      {
        label: "Bankrate via WCAX: Three homeowners who scored lower mortgage rates: and how they did it (Jun 30, 2026)",
        url: "https://www.wcax.com/bankrate-article/2026/06/29/three-homeowners-who-scored-lower-mortgage-rates-how-they-did-it/"
      }
    ]
  },
  lender: {
    overview: [
      "A loan officer at a bank, credit union or mortgage company takes your application. They quote a rate and fees and guide the loan to closing. The same borrower can get different rates and fees from different lenders on the same day. So the lender you pick changes what you pay for years.",
      "Most buyers don’t shop around. Freddie Mac found more than three-quarters applied to only one lender. Yet one extra quote saved about $1,500 on average over the life of the loan, and five quotes saved about $3,000. Federal rules ban paying loan officers more for steering you into a higher rate. But the CFPB has caught lenders doing it.",
      "For forced-sale buyers: county tax sales and trustee’s sales usually require cash or certified funds at the sale. So a regular mortgage often can’t be used there. Mortgages work best for bank-owned (REO) and Fannie Mae/Freddie Mac homes bought by contract, with time to close."
    ],
    bestFor: [
      "Buyers of owner-occupied homes, including bank-owned and Fannie Mae/Freddie Mac homes, who can wait for appraisal and underwriting.",
      "Borrowers willing to request several Loan Estimates and compare rates, points and origination charges.",
      "Investors refinancing after buying with cash or short-term money, once the property is repaired."
    ],
    notFor: [
      "Bidders at courthouse tax or trustee’s sales who must pay at or soon after the auction.",
      "Properties too damaged to pass a lender’s appraisal or condition rules, unless a renovation loan fits.",
      "Borrowers who only talk to one lender someone else referred. You can’t tell whether that quote is good."
    ],
    costs: [
      "Interest rate: shopping five lenders cut the average rate by about 0.166 percentage points in Freddie Mac’s 1995–2017 data.",
      "Points: one point equals 1% of the loan amount paid up front, in exchange for a lower rate (Freddie Mac).",
      "Origination charges are upfront lender fees. Compare them line by line on each Loan Estimate (CFPB).",
      "Watch for prepayment penalties and balloon payments listed on the Loan Estimate (CFPB). A loan for a rental or flip you won’t live in usually comes without a Loan Estimate, so get these terms in writing."
    ],
    money: [
      "Lenders earn money from interest, points and origination charges shown on the Loan Estimate (CFPB).",
      "Federal rules ban paying loan officers based on loan terms such as the interest rate (CFPB, Franklin Loan action)."
    ],
    checklist: [
      "Check the loan officer and company in NMLS Consumer Access (nmlsconsumeraccess.org).",
      "Get Loan Estimates from at least three lenders (bank, credit union, mortgage company) on the same day. Compare rate, points and origination charges. For a rental or flip you won’t live in, there’s usually no Loan Estimate, so ask for written terms instead.",
      "Treat a pre-approval as conditional. The appraisal and final underwriting still have to pass.",
      "Ask whether the rate is locked, for how long, and what it costs to extend.",
      "Look for a prepayment penalty or balloon payment and ask about other options if you see one.",
      "If a builder or agent pushes a ‘preferred lender’, get an outside quote too. Compare total cost, not just the incentive.",
      "Never wire closing money based on an email. Call a known number first."
    ],
    facts: [
      {
        text: "One extra rate quote saved borrowers about $1,500 on average over the life of the loan. Five quotes saved about $3,000.",
        source: {
          label: "Freddie Mac Economic & Housing Research Insight: Why Are Consumers Leaving Money On The Table? (Apr 2018)",
          url: "https://www.freddiemac.com/fmac-resources/research/pdf/201804-Insight.pdf"
        }
      },
      {
        text: "Most borrowers apply to only one lender.",
        source: {
          label: "Freddie Mac Economic & Housing Research Insight: Why Are Consumers Leaving Money On The Table? (Apr 2018)",
          url: "https://www.freddiemac.com/fmac-resources/research/pdf/201804-Insight.pdf"
        }
      },
      {
        text: "A point is 1% of the loan amount in upfront fees.",
        source: {
          label: "Freddie Mac Economic & Housing Research Insight: Why Are Consumers Leaving Money On The Table? (Apr 2018)",
          url: "https://www.freddiemac.com/fmac-resources/research/pdf/201804-Insight.pdf"
        }
      },
      {
        text: "Loan officers can’t legally be paid based on your interest rate.",
        source: {
          label: "CFPB: CFPB Takes Action Against Franklin Loan Corporation for Steering Consumers into Costlier Mortgages (Nov 13, 2014)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-takes-action-against-franklin-loan-corporation-for-steering-consumers-into-costlier-mortgages/"
        }
      },
      {
        text: "The CFPB tells buyers to request multiple Loan Estimates.",
        source: {
          label: "CFPB: Loan estimate explainer",
          url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
        }
      },
      {
        text: "Compare origination charges across Loan Estimates.",
        source: {
          label: "CFPB: Loan estimate explainer",
          url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A 28-year-old first-time buyer in Baton Rouge, Louisiana",
        year: "2025",
        title: "Last application brought the best rate",
        happened: "She applied with several lenders, even though it felt like a hassle. The last lender offered 5.25%. The others offered 6% to 7%, and the national average was in the mid-6% range. She closed in October 2025.",
        lesson: "Each extra quote is a chance at a much lower rate. The first offer is often not the best.",
        source: {
          label: "Bankrate via WCAX: Three homeowners who scored lower mortgage rates: and how they did it (Jun 30, 2026)",
          url: "https://www.wcax.com/bankrate-article/2026/06/29/three-homeowners-who-scored-lower-mortgage-rates-how-they-did-it/"
        }
      },
      {
        tone: "good",
        who: "A buyer of a new-construction home in Roseville, California",
        year: "2023",
        title: "Compared the agent’s lender with the builder’s offer",
        happened: "His agent’s referred lender offered 5.75%. The builder’s preferred lender offered 5.375%, plus about $22,000 in incentives for closing costs, appliances and blinds. He read the paperwork closely and took the builder’s offer.",
        lesson: "Compare the full package. But remember that builders can offer rate deals while keeping prices higher, so do the math.",
        source: {
          label: "Bankrate via WCAX: Three homeowners who scored lower mortgage rates: and how they did it (Jun 30, 2026)",
          url: "https://www.wcax.com/bankrate-article/2026/06/29/three-homeowners-who-scored-lower-mortgage-rates-how-they-did-it/"
        }
      },
      {
        tone: "caution",
        who: "More than 1,400 borrowers of a Southern California mortgage lender",
        year: "2014",
        title: "Loan officers got bigger bonuses for higher rates",
        happened: "From 2011 to 2013, Franklin Loan Corporation paid at least $730,000 in quarterly bonuses to 32 loan officers. The bonuses were based partly on the interest rates of the loans they closed. The CFPB ordered it to stop and pay $730,000 to affected consumers.",
        lesson: "Your loan officer may have reasons to quote you a higher rate. Outside quotes protect you.",
        source: {
          label: "CFPB: CFPB Takes Action Against Franklin Loan Corporation for Steering Consumers into Costlier Mortgages (Nov 13, 2014)",
          url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-takes-action-against-franklin-loan-corporation-for-steering-consumers-into-costlier-mortgages/"
        }
      },
      {
        tone: "caution",
        who: "Customers of an Alamo, California, mortgage lender",
        year: "2015",
        title: "$19 million order over pay plan that rewarded higher rates",
        happened: "The CFPB found RPM Mortgage’s 2011 pay plan gave loan officers incentives to steer customers into higher-rate loans. A June 2015 court order required $18 million in refunds plus penalties. The company settled without admitting wrongdoing and said its rates were competitive.",
        lesson: "Even a large, established lender’s quote should be checked against competitors.",
        source: {
          label: "Pleasanton Weekly: Alamo-based RPM Mortgage to pay $19 million in federal order (Jul 13, 2015)",
          url: "https://www.pleasantonweekly.com/?p=17127"
        }
      }
    ],
    sources: [
      {
        label: "Freddie Mac Economic & Housing Research Insight: Why Are Consumers Leaving Money On The Table? (Apr 2018)",
        url: "https://www.freddiemac.com/fmac-resources/research/pdf/201804-Insight.pdf"
      },
      {
        label: "CFPB: CFPB Takes Action Against Franklin Loan Corporation for Steering Consumers into Costlier Mortgages (Nov 13, 2014)",
        url: "https://www.consumerfinance.gov/about-us/newsroom/cfpb-takes-action-against-franklin-loan-corporation-for-steering-consumers-into-costlier-mortgages/"
      },
      {
        label: "CFPB: Loan estimate explainer",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
      },
      {
        label: "Bankrate via WCAX: Three homeowners who scored lower mortgage rates: and how they did it (Jun 30, 2026)",
        url: "https://www.wcax.com/bankrate-article/2026/06/29/three-homeowners-who-scored-lower-mortgage-rates-how-they-did-it/"
      },
      {
        label: "Pleasanton Weekly: Alamo-based RPM Mortgage to pay $19 million in federal order (Jul 13, 2015)",
        url: "https://www.pleasantonweekly.com/?p=17127"
      }
    ]
  },
  private_lender: {
    overview: [
      "A hard-money or private lender makes short-term loans backed mainly by the property, not your income. Investors use them to buy and repair a house fast, then sell or refinance. The trade-off is price. Rates are usually well above bank mortgage rates, plus points and fees, and terms are short. Get today’s quotes in writing. Many loans end in a large balloon payment.",
      "These lenders lend on the property’s value, so they may lend to people who can’t actually repay. NPR reported on a Florida homeowner whose hard-money refinance started at 10% and rose to 12%. It carried a heavy prepayment penalty, and the home headed toward foreclosure. Fake ‘private lenders’ also collect upfront fees and never fund the loan. California’s DFPI has ordered several to stop.",
      "If you are the one lending, or investing in a hard-money fund, the risks flip. Borrowers default, projects stall, and dishonest brokers can misuse money. In California, a hard-money broker’s collapse cost hundreds of people more than $20 million. Las Vegas hard-money fund investors also lost heavily in the recession."
    ],
    bestFor: [
      "Experienced renovators with a tested budget and a clear exit (sale or refinance) within the loan term.",
      "Buyers who need to close faster than a bank allows, such as on a bank-owned home with a short deadline.",
      "Properties that need too much work for a regular mortgage, when the numbers still work at a high rate."
    ],
    notFor: [
      "Homeowners trying to borrow their way out of trouble. High rates and balloon payments can lead to losing the home.",
      "First-time flippers without cash reserves for delays, overruns or a slow sale.",
      "Anyone asked to pay ‘deposits’ or ‘fees’ before a loan is funded, especially to an unlicensed lender."
    ],
    costs: [
      "Interest: one Los Angeles private lender said he charged about 10% a year and lent up to 75% of purchase-and-repair costs (Reuters, 2013).",
      "Upfront fees: a California hard-money broker was entitled to a 3% fee per loan (CA Attorney General, 2009). Fees can be negotiated and should be in writing.",
      "Prepayment penalties and balloon payments can make refinancing out of the loan hard (NPR, 2008). Investor loans usually come without a Loan Estimate, so get every term in writing.",
      "Carrying costs during repairs: interest, insurance, taxes and utilities add up every month the project runs late."
    ],
    money: [
      "Private lenders earn interest (often around 10% in the Reuters example) plus points or origination fees, and sometimes prepayment penalties.",
      "Brokers who arrange the loan may take a separate fee. In the California case it was 3% of each loan (CA Attorney General)."
    ],
    checklist: [
      "Check the lender’s license. In California, finance lenders and brokers need a license under the California Financing Law (DFPI). Check NMLS too.",
      "Some fees before closing are normal: a credit report, and an appraisal or application fee once you decide to go ahead, listed in writing. A demand for ‘deposits’, ‘insurance’ or ‘taxes’ before a loan will be released is the classic scam. Stop and check the lender’s license.",
      "Get the full terms in writing: rate, points, term, balloon date, extension fees, default rate and prepayment penalty.",
      "Make sure loan money and repair draws go through a licensed escrow or title company, not a personal account.",
      "Plan two exits (sale and refinance) and price the deal with a few extra months of interest.",
      "If you will lend or invest in a fund, check the borrower, title and insurance. Make sure the money sits in a supervised trust or escrow account."
    ],
    facts: [
      {
        text: "Private lenders fill a gap banks won’t: short-term, quick financing for flippers.",
        source: {
          label: "Reuters (via Gulf Times): Buy it, flip it, sell it for a cool profit (Aug 2013)",
          url: "https://www.gulf-times.com/story/362691/buy-it-flip-it-sell-it-for-a-cool-profit"
        }
      },
      {
        text: "Example terms: up to 75% of purchase-and-repair costs at about 10% a year.",
        source: {
          label: "Reuters (via Gulf Times): Buy it, flip it, sell it for a cool profit (Aug 2013)",
          url: "https://www.gulf-times.com/story/362691/buy-it-flip-it-sell-it-for-a-cool-profit"
        }
      },
      {
        text: "Hard-money lenders may lend on equity without checking ability to repay.",
        source: {
          label: "NPR: Facing Foreclosure, One Home at a Time (Apr 23, 2008)",
          url: "https://www.npr.org/2008/04/23/89856332/facing-foreclosure-one-home-at-a-time"
        }
      },
      {
        text: "A prepayment penalty lets a lender charge you for paying off early.",
        source: {
          label: "CFPB: Loan estimate explainer",
          url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
        }
      },
      {
        text: "Fake private lenders collect advance fees. One Californian paid over $24,000.",
        source: {
          label: "California DFPI: Desist and Refrain Order, String Financials US LLC (2024)",
          url: "https://dfpi.ca.gov/wp-content/uploads/sites/337/2024/02/D-R-String-Financials-US-LLC.pdf"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A Los Angeles real estate agent and investor flipping a Hollywood Hills house",
        year: "2013",
        title: "Private loan funded a $1.5 million purchase and $600,000 remodel (sale not reported)",
        happened: "Reuters reported that an investor bought a four-bedroom house in December 2012 for $1.5 million. The money came from a private lender, and the investor put another $600,000 into it. The plan was to list it at $3.295 million. The lender said flippers come to him because banks won’t make short-term, quick loans. He lends about 75% of costs at about 10%. The article reported only the planned asking price, not a sale, so whether the flip made money isn’t known.",
        lesson: "Private money can make a fast purchase and renovation possible. Whether it pays off depends on the sale, so it works only for investors with enough equity and a realistic resale plan.",
        source: {
          label: "Reuters (via Gulf Times): Buy it, flip it, sell it for a cool profit (Aug 2013)",
          url: "https://www.gulf-times.com/story/362691/buy-it-flip-it-sell-it-for-a-cool-profit"
        }
      },
      {
        tone: "caution",
        who: "A single mother in South Florida",
        year: "2008",
        title: "Hard-money refinance: 10% rate, then 12%, and a prepayment penalty",
        happened: "Behind on her mortgage, she refinanced with a hard-money lender. It lent on her equity rather than her income. Payments of about $2,800 a month were a struggle. The lender’s prepayment penalty made it hard to refinance elsewhere. After her rate rose to 12%, she expected to be left with nothing after foreclosure.",
        lesson: "Hard money is a short bridge for a property with a clear exit. It is not a rescue loan for a homeowner who can’t afford payments.",
        source: {
          label: "NPR: Facing Foreclosure, One Home at a Time (Apr 23, 2008)",
          url: "https://www.npr.org/2008/04/23/89856332/facing-foreclosure-one-home-at-a-time"
        }
      },
      {
        tone: "caution",
        who: "A California borrower answering a ‘real estate’ loan offer",
        year: "2023",
        title: "Paid about $70,000 in fees for a loan that never came",
        happened: "An unlicensed outfit offered a $200,000 loan. It kept demanding payments before it would release the money. After about $70,000 in fees over a month and no loan, the borrower asked for a refund and was told it was too late. In June 2025, California’s DFPI ordered the company and its agents to stop lending without a license.",
        lesson: "If a lender wants money before funding, stop and verify its license with the state.",
        source: {
          label: "California DFPI: Desist and Refrain Order, AGS Financing LLC (Jun 27, 2025)",
          url: "https://dfpi.ca.gov/wp-content/uploads/2025/06/D-R-AGS-Financing-LLC.pdf"
        }
      },
      {
        tone: "caution",
        who: "Investors who funded hard-money loans through a broker in Nevada County and the Sacramento area, California",
        year: "2009",
        title: "Broker’s hard-money loans collapsed, costing hundreds of people over $20 million",
        happened: "A hard-money broker arranged more than 270 loans for home-development projects from 2004 to 2007. Prosecutors said he told investors that borrowers had excellent credit when many didn’t. They said he never set up the required trust account and took fees up front. The California Attorney General filed 73 criminal counts in 2009.",
        lesson: "If you act as a private lender, check the borrower and keep money in a supervised trust or escrow account.",
        source: {
          label: "California Attorney General: Brown Files Criminal Charges Against Broker who Masterminded Elaborate Real Estate Scheme (Feb 20, 2009)",
          url: "https://oag.ca.gov/node/30519"
        }
      }
    ],
    sources: [
      {
        label: "Reuters (via Gulf Times): Buy it, flip it, sell it for a cool profit (Aug 2013)",
        url: "https://www.gulf-times.com/story/362691/buy-it-flip-it-sell-it-for-a-cool-profit"
      },
      {
        label: "NPR: Facing Foreclosure, One Home at a Time (Apr 23, 2008)",
        url: "https://www.npr.org/2008/04/23/89856332/facing-foreclosure-one-home-at-a-time"
      },
      {
        label: "CFPB: Loan estimate explainer",
        url: "https://www.consumerfinance.gov/owning-a-home/loan-estimate/"
      },
      {
        label: "California DFPI: Desist and Refrain Order, String Financials US LLC (2024)",
        url: "https://dfpi.ca.gov/wp-content/uploads/sites/337/2024/02/D-R-String-Financials-US-LLC.pdf"
      },
      {
        label: "California DFPI: Desist and Refrain Order, AGS Financing LLC (Jun 27, 2025)",
        url: "https://dfpi.ca.gov/wp-content/uploads/2025/06/D-R-AGS-Financing-LLC.pdf"
      },
      {
        label: "California Attorney General: Brown Files Criminal Charges Against Broker who Masterminded Elaborate Real Estate Scheme (Feb 20, 2009)",
        url: "https://oag.ca.gov/node/30519"
      }
    ]
  },
  title: {
    overview: [
      "A title company searches public records to confirm the seller really owns the property. It also looks for liens, then insures the result. An escrow (settlement) officer holds the money and documents and pays everyone at closing. In California, Nevada, Arizona and Utah, title or escrow companies usually handle closings rather than attorneys.",
      "There are two policies. The lender’s policy protects the lender and is usually required. The owner’s policy protects you if someone later claims the property. That could happen because of a forged deed or an old unpaid bill. The CFPB says the owner’s policy is optional but can protect your investment. Fraud is rising. In ALTA’s 2024 study, 28% of title companies saw a seller-impersonation attempt in 2023. Vacant land, all-cash deals and unknown notaries were top red flags.",
      "The biggest single risk at closing is wire fraud. Criminals send fake wiring instructions that look like they came from your escrow officer, agent or lawyer. FBI teams can sometimes freeze the money if you report it within hours. But many victims never get it back."
    ],
    bestFor: [
      "Every buyer: you need a title search and a neutral escrow holder on any purchase.",
      "Buyers of vacant land, rentals and homes of absentee owners, the property types fraudsters target most.",
      "Investors buying at forced sales who later want to resell or refinance and need insurable title."
    ],
    notFor: [
      "Do not assume you can get a title policy right after a tax-deed or trustee’s sale. Insurers may require extra steps first, such as a court quiet-title action. Ask before you bid.",
      "Do not treat an escrow company’s insurance as wire-fraud protection. Its errors-and-omissions policy may not cover it."
    ],
    costs: [
      "Lender’s title policy: usually required by the lender (CFPB).",
      "Owner’s title policy: optional, and usually cheaper when bought from the same insurer as the lender’s policy (CFPB).",
      "You can usually shop for the title provider separately from your mortgage, and shopping can save money (CFPB).",
      "Escrow fees and recording fees appear on your Loan Estimate and Closing Disclosure. Compare them."
    ],
    money: [
      "Title insurance is a one-time premium paid at closing. Who pays for which policy depends on local custom and the contract.",
      "Escrow and settlement fees are listed on the Loan Estimate and Closing Disclosure and can be compared across providers (CFPB)."
    ],
    checklist: [
      "Check that the title or escrow company is licensed with your state’s regulator and has been in business a while.",
      "Ask for the preliminary title report early and read every lien and exception. It’s an offer to insure, not a guarantee that title is clean.",
      "Ask about an owner’s policy. If you will own vacant land or a rental, also ask about post-closing forgery coverage (ALTA 49 endorsements).",
      "At the start, get the escrow officer’s phone number in person or from the company’s official website. Check all wire instructions by calling that number.",
      "If you wired money and something seems wrong, call your bank right away and file at ic3.gov. Speed matters.",
      "For land or absentee-owned property, ask how the title company verifies the seller’s identity and notary."
    ],
    facts: [
      {
        text: "Owner’s title insurance protects you against older claims on the property.",
        source: {
          label: "CFPB: What is owner’s title insurance?",
          url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
        }
      },
      {
        text: "You can shop for title insurance separately from your mortgage.",
        source: {
          label: "CFPB: What is owner’s title insurance?",
          url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
        }
      },
      {
        text: "28% of title companies saw a seller-impersonation attempt in 2023 (ALTA study of 783 title companies).",
        source: {
          label: "American Land Title Association: New Study Shows Increase in Seller Impersonation Fraud (Aug 5, 2024)",
          url: "https://www.alta.org/news-and-publications/press-release/New-Study-Shows-Increase-in-Seller-Impersonation-Fraud"
        }
      },
      {
        text: "Red flags: vacant land, unknown notaries, all-cash deals.",
        source: {
          label: "American Land Title Association: New Study Shows Increase in Seller Impersonation Fraud (Aug 5, 2024)",
          url: "https://www.alta.org/news-and-publications/press-release/New-Study-Shows-Increase-in-Seller-Impersonation-Fraud"
        }
      },
      {
        text: "Utah: residents lost $20 million to real estate wire scams in 2018.",
        source: {
          label: "Utah State University Extension: Ask an Expert - Beware of Consumer Real Estate Scams (Sep 24, 2019)",
          url: "https://www.usu.edu/today/story/ask-an-expert---beware-of-consumer-real-estate-scams"
        }
      },
      {
        text: "California escrow fraud: escrow companies’ errors-and-omissions insurance may not cover wire fraud.",
        source: {
          label: "NBC 7 San Diego / NBC4: California couple loses $160,000 in down payment scam (Feb 21, 2024)",
          url: "https://www.nbcsandiego.com/news/investigations/national-investigations/down-payment-scam-real-estate-escrow-home-buying-scams/3442105/"
        }
      },
      {
        text: "CFPB: verify closing instructions by phone at a number you already agreed on.",
        source: {
          label: "CFPB: Mortgage Closing Scams: How to protect yourself and your closing funds",
          url: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "Buyers in the Houston, Texas, area who unknowingly bought homes from a deed-fraud ring",
        year: "2022",
        title: "Title insurance paid when forged deeds were exposed",
        happened: "Federal prosecutors said a Dallas man and co-conspirators filed fake deeds with fake notary stamps. They used them to take over mortgaged houses. Then they sold the houses as if the mortgages were gone. A Houston jury convicted him in 2022. Some title insurers had to pay the claims of buyers who bought those houses.",
        lesson: "An owner’s title policy is what protects a buyer when the seller turns out not to have good title.",
        source: {
          label: "U.S. Attorney’s Office, S.D. Texas (copy hosted by FHFA-OIG): Jury Returns Guilty Verdict in Local Deed Fraud Scheme (Sep 20, 2022)",
          url: "https://www.fhfaoig.gov/sites/default/files/Houston_Jury_Returns_Guilty_Verdict_Fraud_Scheme_1.pdf"
        }
      },
      {
        tone: "good",
        who: "Home buyers in the Denver, Colorado, area",
        year: "2024",
        title: "FBI froze a $955,060 closing wire",
        happened: "The buyers got a fake email that seemed to come from their real estate agents. It told them to wire $956,342 to close. Two days later they realized it was fake and reported it. The FBI’s Recovery Asset Team froze the receiving account, and the money was returned.",
        lesson: "If you suspect wire fraud, report it to your bank and the FBI (ic3.gov) at once. Fast reports are the ones that get money back.",
        source: {
          label: "FBI Internet Crime Complaint Center: 2024 IC3 Annual Report",
          url: "https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf"
        }
      },
      {
        tone: "good",
        who: "The owner of a vacant lot in Florida",
        year: "2024",
        title: "Title company spotted an AI ‘seller’ on a looping video",
        happened: "A title company president found red flags in a vacant-lot sale. There was an out-of-state ID, tax bills going to the Bahamas since 1978, and excuses that the owner was hard of hearing. On a video call, the ‘seller’ turned out to be a looped video. The sale was stopped.",
        lesson: "A careful title company verifying the seller protects both the true owner and the buyer.",
        source: {
          label: "NBC Washington / NBC6: Title company owner stops fraudulent vacant-lot sale that used an AI video (Sep 20, 2024)",
          url: "https://www.nbcwashington.com/news/national-international/title-fraud-scam-ai-artificial-intelligence-deepfakes/3722897/"
        }
      },
      {
        tone: "caution",
        who: "A couple buying a home in West Hills (Los Angeles), California",
        year: "2024",
        title: "$160,000 down payment wired to a fake escrow officer",
        happened: "After months of being outbid, the couple got an email with wire instructions. It looked exactly like their escrow officer’s, and they wired $160,000. It was a scammer, likely inside the escrow company’s email. The money was not recovered. They closed only by borrowing from family.",
        lesson: "Never wire money based on an email, even one that looks right. Call your escrow officer at a known number first.",
        source: {
          label: "NBC 7 San Diego / NBC4: California couple loses $160,000 in down payment scam (Feb 21, 2024)",
          url: "https://www.nbcsandiego.com/news/investigations/national-investigations/down-payment-scam-real-estate-escrow-home-buying-scams/3442105/"
        }
      },
      {
        tone: "caution",
        who: "A retired couple buying a riverside home in Wilmington, Illinois",
        year: "2017",
        title: "$307,000 life savings wired to thieves posing as their attorneys",
        happened: "The couple received closing instructions on their attorney’s letterhead. They showed the property address, title company details and the exact balance owed. The couple wired their savings two weeks before closing. At the closing table they learned the money never arrived. Their daughter bought the home for them.",
        lesson: "Real-looking documents prove nothing. Confirm wiring instructions by phone with someone you know.",
        source: {
          label: "ABC7 Chicago: Wired Away: Couple loses life savings during home purchase (Nov 14, 2017)",
          url: "https://abc7chicago.com/fraud-wire-transfer-down-payment-stolen/2630496/"
        }
      },
      {
        tone: "caution",
        who: "About 22 buyers, sellers and lenders who used a title agency in Syracuse, Utah",
        year: "2024",
        title: "Licensed title agent diverted over $9 million",
        happened: "A Utah-licensed title agent failed to pay off sellers’ mortgages, kept buyers’ earnest money, and diverted closing funds. In 2024 he was sentenced to two back-to-back prison terms of 1 to 15 years each. Over $6.5 million in restitution was still owed.",
        lesson: "Check that your title or escrow company is licensed and established. After closing, make sure payoffs are actually recorded.",
        source: {
          label: "Utah Attorney General: a Syracuse, Utah title agent’s fraud case (Oct 23, 2024)",
          url: "https://attorneygeneral.utah.gov/upholding-white-collar-crime-prevention-and-prosecution-ryan-goodrich-case/"
        }
      }
    ],
    sources: [
      {
        label: "CFPB: What is owner’s title insurance?",
        url: "https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/"
      },
      {
        label: "American Land Title Association: New Study Shows Increase in Seller Impersonation Fraud (Aug 5, 2024)",
        url: "https://www.alta.org/news-and-publications/press-release/New-Study-Shows-Increase-in-Seller-Impersonation-Fraud"
      },
      {
        label: "Utah State University Extension: Ask an Expert - Beware of Consumer Real Estate Scams (Sep 24, 2019)",
        url: "https://www.usu.edu/today/story/ask-an-expert---beware-of-consumer-real-estate-scams"
      },
      {
        label: "NBC 7 San Diego / NBC4: California couple loses $160,000 in down payment scam (Feb 21, 2024)",
        url: "https://www.nbcsandiego.com/news/investigations/national-investigations/down-payment-scam-real-estate-escrow-home-buying-scams/3442105/"
      },
      {
        label: "CFPB: Mortgage Closing Scams: How to protect yourself and your closing funds",
        url: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/"
      },
      {
        label: "U.S. Attorney’s Office, S.D. Texas (copy hosted by FHFA-OIG): Jury Returns Guilty Verdict in Local Deed Fraud Scheme (Sep 20, 2022)",
        url: "https://www.fhfaoig.gov/sites/default/files/Houston_Jury_Returns_Guilty_Verdict_Fraud_Scheme_1.pdf"
      },
      {
        label: "FBI Internet Crime Complaint Center: 2024 IC3 Annual Report",
        url: "https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf"
      },
      {
        label: "NBC Washington / NBC6: Title company owner stops fraudulent vacant-lot sale that used an AI video (Sep 20, 2024)",
        url: "https://www.nbcwashington.com/news/national-international/title-fraud-scam-ai-artificial-intelligence-deepfakes/3722897/"
      },
      {
        label: "ABC7 Chicago: Wired Away: Couple loses life savings during home purchase (Nov 14, 2017)",
        url: "https://abc7chicago.com/fraud-wire-transfer-down-payment-stolen/2630496/"
      },
      {
        label: "Utah Attorney General: a Syracuse, Utah title agent’s fraud case (Oct 23, 2024)",
        url: "https://attorneygeneral.utah.gov/upholding-white-collar-crime-prevention-and-prosecution-ryan-goodrich-case/"
      }
    ]
  },
  attorney: {
    overview: [
      "A real estate attorney gives legal advice, reviews contracts and title problems, and goes to court when needed. One example is a suit to quiet title after a tax-deed or foreclosure purchase. That means asking a court to declare who owns a property. In Nevada, California, Arizona and Utah, title and escrow companies run most home closings. So an attorney is optional for a simple purchase but valuable when something is unusual.",
      "Forced-sale purchases are where a lawyer earns their fee. A tax-sale buyer’s title can be challenged if the government didn’t give the owner proper notice. In Jones v. Flowers (2006), the U.S. Supreme Court ruled Arkansas’s notice was not enough after its letters came back unclaimed. Rules also change. In Tyler v. Hennepin County (2023), the Court held a county could not keep the surplus from a tax sale.",
      "Lawyers are also targets. Criminals fake attorneys’ emails to steal closing funds. Impostor ‘sellers’ have also fooled realtors and real estate attorneys into closing sales of land the impostors didn’t own."
    ],
    bestFor: [
      "Tax-deed and trustee’s-sale buyers who need a quiet-title action before they can insure, sell or refinance.",
      "Buyers facing title defects, boundary disputes, liens, probate or heirs’ property.",
      "Anyone who has been defrauded or misled in a purchase and needs to pursue a claim."
    ],
    notFor: [
      "Routine purchases with clean title, where a title company and escrow already handle closing. In NV, CA, AZ and UT, attorneys are not usually part of closing.",
      "Buyers expecting an attorney to also check every wire instruction. You still must call to confirm."
    ],
    costs: [
      "Attorney fees vary widely by task, such as contract review, a quiet-title lawsuit or litigation. Get a written fee agreement before work starts.",
      "Court costs, service and publication of notice add to a quiet-title action.",
      "Skipping legal review on a forced-sale purchase can cost you the property itself. That can happen if the sale is later found defective (see Jones v. Flowers)."
    ],
    money: [],
    checklist: [
      "Check the lawyer’s license and discipline record with the State Bar of Nevada, California, Arizona or Utah.",
      "Ask how many quiet-title or tax-deed cases they have handled in that county.",
      "Get a written engagement letter: scope, hourly rate or flat fee, and estimated court costs.",
      "Before bidding at a tax or trustee’s sale, ask the lawyer to review the notice steps. Also ask what a title insurer will require afterward.",
      "Get the firm’s phone number from the State Bar listing or official website. Confirm any wire instructions by calling that number."
    ],
    facts: [
      {
        text: "Tax sales: when mailed notice comes back unclaimed, the state must take more reasonable steps before selling.",
        source: {
          label: "U.S. Supreme Court: Jones v. Flowers, 547 U.S. 220 (2006), via Cornell LII",
          url: "https://www.law.cornell.edu/supct/html/04-1477.ZO.html"
        }
      },
      {
        text: "Most states return tax-sale surplus to the former owner.",
        source: {
          label: "U.S. Supreme Court: Tyler v. Hennepin County (2023), via Cornell LII",
          url: "https://www.law.cornell.edu/supremecourt/text/22-166"
        }
      },
      {
        text: "Scammers pose as legal representatives to steal closing funds.",
        source: {
          label: "CFPB: Mortgage Closing Scams: How to protect yourself and your closing funds",
          url: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A home buyer in Massachusetts",
        year: "2017",
        title: "Fast calls to the FBI, his lawyer and his bank got $280,000 back",
        happened: "He got a fake email made to look like it came from his real estate agent. It told him to wire more than $280,000 to the closing attorney, and he did. He called the FBI, his lawyer and his bank right away. The bank issued a SWIFT recall that froze the money before it left the country. A local real estate lawyer told the station his firm now assigns an employee to watch email transactions.",
        lesson: "Keep your lawyer’s and bank’s numbers handy and act within hours if a wire looks wrong.",
        source: {
          label: "WHDH 7News Boston: Hank Investigates: wire fraud (May 2, 2017)",
          url: "https://whdh.com/news/hank-investigates-wire-fraud/"
        }
      },
      {
        tone: "good",
        who: "A buyer of a Malibu, California, luxury home",
        year: "2016",
        title: "Lawsuit over misstated square footage won a key ruling",
        happened: "The buyer found the home was much smaller than marketed. The buyer sued the brokerage and the seller’s salesperson. In 2016 the California Supreme Court ruled that the salesperson owed the buyer the same fiduciary duty as the dual-agent brokerage. That let the claim go forward.",
        lesson: "When you’ve been misled, a real estate lawyer can enforce duties the law already gives you.",
        source: {
          label: "Supreme Court of California: Horiike v. Coldwell Banker Residential Brokerage Co., S218734 (Nov 21, 2016)",
          url: "https://www.courts.ca.gov/opinions/archive/S218734.PDF"
        }
      },
      {
        tone: "caution",
        who: "A buyer at an Arkansas tax sale (Little Rock)",
        year: "2006",
        title: "Bought an $80,000 house for about $21,000; the sale was challenged for bad notice",
        happened: "The state mailed tax-sale notices by certified mail, and both came back unclaimed. Then it sold the house. The owner learned of it only when the buyer had an eviction notice served. The U.S. Supreme Court ruled the state should have taken more steps to notify him. It reversed the ruling that had upheld the sale.",
        lesson: "Before counting on a tax-deed property, have a lawyer check whether the owner was properly notified. A defective notice can undo your purchase.",
        source: {
          label: "U.S. Supreme Court: Jones v. Flowers, 547 U.S. 220 (2006), via Cornell LII",
          url: "https://www.law.cornell.edu/supct/html/04-1477.ZO.html"
        }
      },
      {
        tone: "caution",
        who: "A family buying a home in Westchester County, New York",
        year: "2018",
        title: "Missed the lawyer’s warning; $70,558 down payment stolen",
        happened: "Scammers hacked the family’s real estate attorney’s email. They sent look-alike emails with an extra letter in the attorney’s name, plus an accurate fake closing statement. The family wired $70,558 to a stranger’s account. They did this even though the real attorney had emailed earlier, warning them to ignore wire requests.",
        lesson: "Read and follow your attorney’s wire-fraud warnings, and confirm any payment instructions by phone.",
        source: {
          label: "ABC7 New York: 7 On Your Side: How to avoid the most devastating real estate scam (May 9, 2018)",
          url: "https://abc7ny.com/news/3444981/"
        }
      },
      {
        tone: "caution",
        who: "Out-of-state owners of a 1.84-acre lot in Concord, Massachusetts",
        year: "2024",
        title: "Impostor fooled a realtor and a real estate attorney; land sold for about $525,000",
        happened: "An impostor used a Google Voice number, a fake email and ID photos to pose as the owners. The impostor fooled a Massachusetts realtor and real estate attorney. The lot was deeded to a buyer in May 2024. The owners found out in August 2024, after a developer had started building a house on it. Federal charges were announced in 2026.",
        lesson: "Professionals can be fooled too. Buyers of vacant land need title insurance and strict seller-identity checks.",
        source: {
          label: "Boston.com: How scammers allegedly impersonated Concord landowners, secretly selling their property (Jul 24, 2026)",
          url: "https://www.boston.com/news/local-news/2026/07/24/how-scammers-allegedly-impersonated-concord-landowners/"
        }
      }
    ],
    sources: [
      {
        label: "U.S. Supreme Court: Jones v. Flowers, 547 U.S. 220 (2006), via Cornell LII",
        url: "https://www.law.cornell.edu/supct/html/04-1477.ZO.html"
      },
      {
        label: "U.S. Supreme Court: Tyler v. Hennepin County (2023), via Cornell LII",
        url: "https://www.law.cornell.edu/supremecourt/text/22-166"
      },
      {
        label: "CFPB: Mortgage Closing Scams: How to protect yourself and your closing funds",
        url: "https://www.consumerfinance.gov/about-us/blog/mortgage-closing-scams-how-protect-yourself-and-your-closing-funds/"
      },
      {
        label: "WHDH 7News Boston: Hank Investigates: wire fraud (May 2, 2017)",
        url: "https://whdh.com/news/hank-investigates-wire-fraud/"
      },
      {
        label: "Supreme Court of California: Horiike v. Coldwell Banker Residential Brokerage Co., S218734 (Nov 21, 2016)",
        url: "https://www.courts.ca.gov/opinions/archive/S218734.PDF"
      },
      {
        label: "ABC7 New York: 7 On Your Side: How to avoid the most devastating real estate scam (May 9, 2018)",
        url: "https://abc7ny.com/news/3444981/"
      },
      {
        label: "Boston.com: How scammers allegedly impersonated Concord landowners, secretly selling their property (Jul 24, 2026)",
        url: "https://www.boston.com/news/local-news/2026/07/24/how-scammers-allegedly-impersonated-concord-landowners/"
      }
    ]
  },
  inspector: {
    overview: [
      "A home inspector walks the property and writes a report on its systems and structure. That covers the roof, foundation, plumbing, electrical, heating and cooling. The report tells you about expensive problems before you are locked in. You use it to ask the seller to repair, give a credit, or let you cancel under an inspection contingency.",
      "Rules differ by state. Nevada certifies ‘inspectors of structures’. A residential inspector there needs at least 40 hours of pre-licensing education and a state exam. They also need proof of $100,000 errors-and-omissions and $100,000 general liability insurance. Other states’ rules differ, so check your state’s requirements before hiring.",
      "Forced-sale caution: at many tax-deed and trustee’s sales you can’t get inside before bidding. So no inspection is possible, and you buy ‘as is’. Bank-owned homes usually allow an inspection period. In 2021’s hot market, many buyers waived inspections to win bids. Some paid for it after moving in."
    ],
    bestFor: [
      "Every buyer who can get access before committing, especially for older homes, vacant homes and bank-owned (REO) homes.",
      "Investors estimating a repair budget before setting a maximum price.",
      "Buyers who want leverage to ask for repairs or credits, or a documented reason to cancel."
    ],
    notFor: [
      "It can’t replace specialists. When the general report flags a concern, ask for a sewer-line camera, roof, structural or pest inspection.",
      "Courthouse auction buyers usually can’t inspect inside. Price the unknowns into your bid instead."
    ],
    costs: [
      "A short pre-offer inspection costs about a third of a full inspection. It takes about a quarter of the time (AARP, 2021).",
      "Skipping inspection puts all repair risk on you. Repairs can add thousands to tens of thousands of dollars (FOX6, 2021).",
      "Instead of waiving, offer to cover small repairs, such as $2,000 to $3,000, and keep the contingency (agent quoted by FOX6, 2021)."
    ],
    money: [
      "The buyer usually pays the inspector a flat fee at the time of the inspection. Ask for the price and what it covers in writing.",
      "Nevada inspectors must carry $100,000 errors-and-omissions and $100,000 general liability insurance (Nevada Real Estate Division)."
    ],
    checklist: [
      "Check the inspector’s state credential where one exists (Nevada Real Estate Division; Arizona Board of Technical Registration). Ask about insurance.",
      "Ask for a sample report and what is excluded (roof walk, crawlspace, sewer line, pool, solar).",
      "Attend the inspection and ask questions on site.",
      "Order specialist inspections for anything flagged: sewer scope, roof, structure, pests, mold.",
      "Keep an inspection contingency with enough days to get repair bids. If you must compete, offer a repair credit instead of waiving.",
      "Use the report to request repairs or credits in writing before the contingency deadline."
    ],
    facts: [
      {
        text: "Nevada residential inspectors need at least 40 hours of pre-licensing education (50 general, 60 master).",
        source: {
          label: "Nevada Real Estate Division: Inspectors of Structures, Initial Certification Requirements",
          url: "https://red.nv.gov/Content/IOS/Initial_Certification_Requirements/"
        }
      },
      {
        text: "Nevada inspectors must carry $100,000 E&O and $100,000 general liability insurance.",
        source: {
          label: "Nevada Real Estate Division: Inspectors of Structures, Initial Certification Requirements",
          url: "https://red.nv.gov/Content/IOS/Initial_Certification_Requirements/"
        }
      },
      {
        text: "In July 2021, 27% of buyers waived inspections, per NAR (reported by AARP).",
        source: {
          label: "AARP: Should You Waive a Home Inspection in a Hot Real Estate Market? (Oct 15, 2021)",
          url: "https://www.aarp.org/home-family/your-home/info-2021/home-inspection-pros-and-cons.html"
        }
      },
      {
        text: "Waiving the inspection puts all repair risk on the buyer.",
        source: {
          label: "FOX6 Milwaukee: Waiving home inspection: Home buyers took risk to land houses in 2021 (Nov 10, 2021)",
          url: "https://www.fox6now.com/news/home-buyers-risk-waiving-home-inspection"
        }
      }
    ],
    stories: [
      {
        tone: "caution",
        who: "A condo buyer in the Milwaukee, Wisconsin, area",
        year: "2021",
        title: "Waived inspection after four lost bids, then paid for floors, electrical and plumbing",
        happened: "After losing four bids, he waived the home inspection contingency to make his offer stand out. After closing he paid to replace floors and carpet and for electricians and plumbers. His advice: “Don’t do what I did.”",
        lesson: "Winning the house isn’t a win if hidden repairs eat your savings. Keep the inspection or offer a repair credit instead.",
        source: {
          label: "FOX6 Milwaukee: Waiving home inspection: Home buyers took risk to land houses in 2021 (Nov 10, 2021)",
          url: "https://www.fox6now.com/news/home-buyers-risk-waiving-home-inspection"
        }
      },
      {
        tone: "caution",
        who: "A 67-year-old buyer in Rochester, New York",
        year: "2020",
        title: "15-minute walk-through, no inspection, hidden leaks",
        happened: "She was told her bid wouldn’t be considered unless she waived inspection. So she bought an 1,800-square-foot house after a 15-minute walk-through. After moving in she found leaks of about five gallons a day. The first repair estimate was nearly $20,000. She later found someone to fix it for $5,000.",
        lesson: "If you can’t inspect fully, at least bring someone knowledgeable or get a short pre-offer inspection.",
        source: {
          label: "AARP: Should You Waive a Home Inspection in a Hot Real Estate Market? (Oct 15, 2021)",
          url: "https://www.aarp.org/home-family/your-home/info-2021/home-inspection-pros-and-cons.html"
        }
      },
      {
        tone: "caution",
        who: "Home buyers in the Milwaukee, Wisconsin, area (inspector’s account)",
        year: "2021",
        title: "Post-closing inspections found chimney, roof and foundation problems",
        happened: "There were fewer pre-purchase inspections during 2021. A local inspector said he was doing more inspections after closing, for owners’ information only. Those found chimney, roof and foundation issues. The buyers then had to pay for them themselves.",
        lesson: "An inspection is worth the most before you are committed, when findings can still change the price or the deal.",
        source: {
          label: "FOX6 Milwaukee: Waiving home inspection: Home buyers took risk to land houses in 2021 (Nov 10, 2021)",
          url: "https://www.fox6now.com/news/home-buyers-risk-waiving-home-inspection"
        }
      }
    ],
    sources: [
      {
        label: "Nevada Real Estate Division: Inspectors of Structures, Initial Certification Requirements",
        url: "https://red.nv.gov/Content/IOS/Initial_Certification_Requirements/"
      },
      {
        label: "AARP: Should You Waive a Home Inspection in a Hot Real Estate Market? (Oct 15, 2021)",
        url: "https://www.aarp.org/home-family/your-home/info-2021/home-inspection-pros-and-cons.html"
      },
      {
        label: "FOX6 Milwaukee: Waiving home inspection: Home buyers took risk to land houses in 2021 (Nov 10, 2021)",
        url: "https://www.fox6now.com/news/home-buyers-risk-waiving-home-inspection"
      }
    ]
  },
  contractor: {
    overview: [
      "A licensed contractor is a builder or tradesperson the state has tested and licensed for a type of work. In Nevada the license comes from the Nevada State Contractors Board (NSCB). In California it comes from the Contractors State License Board (CSLB). In Arizona it comes from the Registrar of Contractors (ROC). In Utah it comes from the Division of Professional Licensing (DOPL). Investors who buy at auction or buy bank-owned homes usually need repairs. So picking the contractor is often the biggest money decision after the purchase itself.",
      "The license matters most when something goes wrong. Nevada and Arizona run recovery funds that can repay homeowners hurt by a licensed contractor. Utah gives homeowners a way to clear a supplier’s lien if they paid a licensed contractor under a written contract. People who hire an unlicensed worker usually lose those protections. The NSCB warns that unlicensed workers often skip workers’ compensation insurance and trade exams.",
      "Read the fine print on those funds before counting on them. Nevada’s Residential Recovery Fund covers owners who own and live in a single-family home. Arizona’s fund covers work on the homeowner’s primary residence. A rental or flip you don’t live in may not qualify. And Arizona’s fund has paid only part of some losses when many victims claim against the same contractor."
    ],
    bestFor: [
      "Buyers of foreclosure or bank-owned homes that need roof, plumbing, electrical or structural repair. Permits and licensed trades protect resale and insurance.",
      "Owner-occupants in Nevada and Arizona who want access to the state recovery fund if a licensed contractor fails to finish.",
      "Investors who want written bids, a detailed contract and a payment schedule tied to finished work.",
      "Anyone financing repairs with a loan that requires licensed, permitted work."
    ],
    notFor: [
      "Owners who want to pay cash to the lowest bidder with no contract. The NSCB tells homeowners never to pay in cash.",
      "Rental or flip owners who assume a recovery fund will cover them. Nevada’s and Arizona’s funds focus on owner-occupied homes.",
      "Projects where a contractor asks for a large deposit up front. In California the down payment limit is 10% or $1,000, whichever is less.",
      "People who can’t take the time to check a license number against the state board’s website."
    ],
    costs: [
      "Deposit: in California, never more than 10% of the price or $1,000, whichever is less. This is state law, per CSLB guidance reported by NBC Los Angeles.",
      "Bids: the NSCB recommends getting at least three bids. It takes time but helps you spot overpricing.",
      "Permits and inspections, which licensed contractors normally pull. Ask who pays.",
      "Lien risk: if your contractor doesn’t pay a supplier, the supplier can file a lien on your home. In Utah, a homeowner can get a Certificate of Compliance to have it removed. That works if they hired a licensed contractor under a written contract and paid in full.",
      "Recovery fund limits: Arizona caps payouts at $30,000 per homeowner and $200,000 per contractor license. It has prorated (shared out) awards when many people claim against one license."
    ],
    money: [
      "Pay in stages tied to finished work, not up front. The NSCB tells homeowners to put payment schedules in a detailed contract and never pay in cash.",
      "In California the legal cap on a home-improvement down payment is 10% or $1,000, whichever is less.",
      "Keep receipts, contracts and photos. Arizona’s ROC asks for these documents when a homeowner files a recovery fund claim."
    ],
    checklist: [
      "Look up the license number on the state board site and confirm it covers the type of work. The boards are NSCB in Nevada, CSLB in California, ROC in Arizona and DOPL in Utah.",
      "Get at least three written bids and call references.",
      "Sign a detailed written contract listing materials, scope, timeline and payment schedule.",
      "Don’t pay cash, and don’t pay a deposit above the legal limit (10% or $1,000 in California).",
      "Ask about workers’ compensation and liability insurance and permits before work starts.",
      "Keep proof of every payment. In Utah, proof of a written contract and full payment is what lets you clear a supplier’s lien.",
      "Check whether your property qualifies for the state recovery fund before relying on it (owner-occupied homes in Nevada and Arizona)."
    ],
    facts: [
      {
        text: "Nevada’s Residential Recovery Fund (created 1999) has paid about $15 million to harmed homeowners. It covers owners who occupy a single-family home and file within four years of the contract.",
        source: {
          label: "KTNV Las Vegas: Homeowners harmed by contractors awarded almost $400K through recovery fund (Jan. 23, 2024)",
          url: "https://www.ktnv.com/news/homeowners-harmed-by-contractors-awarded-almost-400k-through-recovery-fund"
        }
      },
      {
        text: "Nevada fund eligibility: the owner must own and occupy the single-family home where the work was done.",
        source: {
          label: "KTNV Las Vegas: Homeowners harmed by contractors awarded almost $400K through recovery fund (Jan. 23, 2024)",
          url: "https://www.ktnv.com/news/homeowners-harmed-by-contractors-awarded-almost-400k-through-recovery-fund"
        }
      },
      {
        text: "In Nevada, hiring an unlicensed contractor means you can’t use the Residential Recovery Fund.",
        source: {
          label: "Nevada State Contractors Board news release: Notorious Northern Nevada unlicensed contractor convicted (Apr. 24, 2024)",
          url: "https://nvcontractorsboard.com/wp-content/uploads/2024/05/04-24-2024-NOTORIOUS-NORTHERN-NEVADA-UNLICENSED-CONTRACTOR-CONVICTED-RE-BATH-RENO-OWNER-STOLE-160000-FROM-14-HOMEOWNERS-NEWS-RELEASE.pdf"
        }
      },
      {
        text: "California: a home-improvement down payment may not be more than 10% or $1,000, whichever is less.",
        source: {
          label: "NBC Los Angeles: Undercover investigators arrest 27 in unlicensed contractors sting (Oct. 31, 2008)",
          url: "https://www.nbclosangeles.com/news/27_arrests_in_undercover_sting/1843594"
        }
      },
      {
        text: "Arizona’s recovery fund pays up to $30,000 per homeowner and $200,000 per contractor license.",
        source: {
          label: "AZFamily (KTVK/KPHO): Some Phoenix-area victims of Unity Pools get partial reimbursement from Arizona’s Recovery Fund (Apr. 3, 2025)",
          url: "https://www.azfamily.com/2025/04/03/some-phoenix-area-victims-unity-pools-get-partial-reimbursement-arizonas-recovery-fund/"
        }
      },
      {
        text: "Utah: a homeowner who hired a licensed contractor, had a written contract and paid as agreed is still protected against a supplier’s lien. That is true even though the Residence Lien Recovery Fund has run out of money.",
        source: {
          label: "KSL.com: Lien trap: Why a safety net for homeowners facing a construction lien despite full payment is going away (June 3, 2026)",
          url: "https://www.ksl.com/article/news/ksl-investigates/get-gephardt/lien-trap-why-a-safety-net-for-homeowners-facing-a-construction-lien-despite-full-payment-is-going-away/51592052"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "Two dozen Las Vegas-area homeowners, Nevada",
        year: "2024",
        title: "Licensed contractor failed, recovery fund repaid owners",
        happened: "The NSCB awarded 24 homeowners a total of $394,068 from the Residential Recovery Fund after licensed contractors failed them. Nearly half had paid S&E Contracting Inc. (doing business as Made in the Shade) for work that was never done. The board revoked that license. One owner had paid $8,750 for a patio cover the licensee never built, and was paid back.",
        lesson: "Hiring a licensed contractor gave these owner-occupants a state safety net that people who hire unlicensed workers don’t get.",
        source: {
          label: "KTNV Las Vegas: Homeowners harmed by contractors awarded almost $400K through recovery fund (Jan. 23, 2024)",
          url: "https://www.ktnv.com/news/homeowners-harmed-by-contractors-awarded-almost-400k-through-recovery-fund"
        }
      },
      {
        tone: "good",
        who: "Homeowners in Lehi, Utah",
        year: "2026",
        title: "Paid-in-full roof job, supplier lien lifted",
        happened: "A couple hired a roofing company and paid in full. Then a materials supplier put a lien on their home because the roofer hadn’t paid it. The roofer and supplier settled, and the lien was lifted. Utah’s director of professional licensing explained the rules. Homeowners who hire a licensed contractor, sign a written contract and pay as agreed can still get a Certificate of Compliance. It requires a lien to be removed within 15 days. That holds even though the state’s lien recovery fund is out of money.",
        lesson: "A license, a written contract and proof of payment are what protect a Utah owner from paying twice.",
        source: {
          label: "KSL.com: Lien trap: Why a safety net for homeowners facing a construction lien despite full payment is going away (June 3, 2026)",
          url: "https://www.ksl.com/article/news/ksl-investigates/get-gephardt/lien-trap-why-a-safety-net-for-homeowners-facing-a-construction-lien-despite-full-payment-is-going-away/51592052"
        }
      },
      {
        tone: "caution",
        who: "At least 14 homeowners, mostly seniors, in the Reno area, Nevada",
        year: "2024",
        title: "Unlicensed ‘Re-Bath Reno’ took $160,000",
        happened: "The owner of Re-Bath Reno, an unlicensed contractor, had been convicted of unlicensed contracting in 2015. The owner took about $160,000 from at least 14 homeowners. Most victims were seniors who paid and never saw any work done. The owner pleaded guilty to two felony counts of obtaining money under false pretenses and faced more than $133,000 in restitution.",
        lesson: "Unlicensed contractors leave you with no recovery fund, so check the license before you pay a dollar.",
        source: {
          label: "Nevada State Contractors Board news release: Notorious Northern Nevada unlicensed contractor convicted (Apr. 24, 2024)",
          url: "https://nvcontractorsboard.com/wp-content/uploads/2024/05/04-24-2024-NOTORIOUS-NORTHERN-NEVADA-UNLICENSED-CONTRACTOR-CONVICTED-RE-BATH-RENO-OWNER-STOLE-160000-FROM-14-HOMEOWNERS-NEWS-RELEASE.pdf"
        }
      },
      {
        tone: "caution",
        who: "A homeowner in the Phoenix area, Arizona",
        year: "2025",
        title: "Licensed pool builder vanished; fund paid one-third",
        happened: "A Phoenix-area homeowner was one of more than a dozen who paid Unity Pools. Its owner abandoned jobs and left ‘concrete holes.’ The ROC revoked the licenses and tapped its Recovery Fund. But payouts are capped at $200,000 per license, so eight homeowners were cut to $25,000 each. He was out about $75,000 and got a $25,000 check.",
        lesson: "Even with a licensed contractor, recovery funds have caps, so don’t prepay large sums ahead of the work.",
        source: {
          label: "AZFamily (KTVK/KPHO): Some Phoenix-area victims of Unity Pools get partial reimbursement from Arizona’s Recovery Fund (Apr. 3, 2025)",
          url: "https://www.azfamily.com/2025/04/03/some-phoenix-area-victims-unity-pools-get-partial-reimbursement-arizonas-recovery-fund/"
        }
      }
    ],
    sources: [
      {
        label: "KTNV Las Vegas: Homeowners harmed by contractors awarded almost $400K through recovery fund (Jan. 23, 2024)",
        url: "https://www.ktnv.com/news/homeowners-harmed-by-contractors-awarded-almost-400k-through-recovery-fund"
      },
      {
        label: "Nevada State Contractors Board news release: Notorious Northern Nevada unlicensed contractor convicted (Apr. 24, 2024)",
        url: "https://nvcontractorsboard.com/wp-content/uploads/2024/05/04-24-2024-NOTORIOUS-NORTHERN-NEVADA-UNLICENSED-CONTRACTOR-CONVICTED-RE-BATH-RENO-OWNER-STOLE-160000-FROM-14-HOMEOWNERS-NEWS-RELEASE.pdf"
      },
      {
        label: "NBC Los Angeles: Undercover investigators arrest 27 in unlicensed contractors sting (Oct. 31, 2008)",
        url: "https://www.nbclosangeles.com/news/27_arrests_in_undercover_sting/1843594"
      },
      {
        label: "AZFamily (KTVK/KPHO): Some Phoenix-area victims of Unity Pools get partial reimbursement from Arizona’s Recovery Fund (Apr. 3, 2025)",
        url: "https://www.azfamily.com/2025/04/03/some-phoenix-area-victims-unity-pools-get-partial-reimbursement-arizonas-recovery-fund/"
      },
      {
        label: "KSL.com: Lien trap: Why a safety net for homeowners facing a construction lien despite full payment is going away (June 3, 2026)",
        url: "https://www.ksl.com/article/news/ksl-investigates/get-gephardt/lien-trap-why-a-safety-net-for-homeowners-facing-a-construction-lien-despite-full-payment-is-going-away/51592052"
      },
      {
        label: "ABC15 Arizona: Arizona homeowners can recover money from bad contractor jobs. Here’s how",
        url: "https://www.abc15.com/news/let-abc15-know/arizona-homeowners-can-recover-money-from-bad-contractor-jobs-heres-how"
      }
    ]
  },
  insurance: {
    overview: [
      "An insurance agent or broker helps you buy property and liability coverage. For investors the key decision is the type of policy. A standard homeowners policy is written for a home you live in. A rental (dwelling or landlord) policy is written for a home you rent out. Tell your agent how the home will actually be used.",
      "Vacant homes are a special risk. Many property policies limit coverage for some losses, such as water damage, once a building has been vacant for more than 60 straight days. A California appeals court ruled in 2020 that this count can include days before you owned the home. That matters for anyone buying an empty foreclosure or bank-owned house.",
      "In California’s wildfire areas, many owners can’t find private coverage. They end up on the California FAIR Plan, the state’s insurer of last resort. It mainly covers fire, so most owners add a separate ‘wrap-around’ (difference in conditions) policy for theft, water damage and liability. Compare the total of both quotes with any private offer before you bid. Most homeowners and renters policies don’t cover flood damage, so you usually need a separate flood policy."
    ],
    bestFor: [
      "Anyone buying an empty foreclosure or REO home who needs coverage that fits a vacant property from day one.",
      "Landlords converting a former residence to a rental who need to switch to a landlord/dwelling policy.",
      "California buyers in wildfire zones who need help comparing private carriers, the FAIR Plan and wrap-around policies.",
      "Owners outside mapped flood zones who want a second opinion on flood coverage."
    ],
    notFor: [
      "Buyers who assume their old homeowners policy will cover a home they now rent out or leave vacant.",
      "Owners who only shop on price. A cheaper policy may pay ‘actual cash value’ (depreciated) rather than replacement cost.",
      "Anyone who would let a flood policy lapse because the area ‘isn’t a flood zone.’"
    ],
    costs: [
      "Premiums vary widely. In one Altadena, California example, a private policy cost $1,264 a year for up to $1.5 million of coverage. A neighbor paid $2,000 a year on the FAIR Plan for a $686,000 maximum. The neighbor also paid $1,500 a year for wrap-around coverage (AP, 2025).",
      "A Los Angeles agent told CNN that in high-fire California areas, FAIR Plan or non-admitted coverage can cost $20,000 to $30,000 a year (2025).",
      "Flood insurance is usually a separate cost. One New Jersey family let a flood policy lapse that cost about $650 a year. Then they faced about $100,000 in damage (AP, 2021).",
      "Vacancy: a policy may stop covering some losses after 60 days of vacancy. So budget for a vacant-property policy or endorsement while you renovate."
    ],
    money: [
      "Ask how your agent is paid and whether they can quote several carriers. (We found no sourced typical commission figure. Ask the agent directly.)",
      "In California, if a claim is delayed or underpaid, you can file a free complaint with the Department of Insurance. The department says it has recovered more than $280 million for Eaton and Palisades fire survivors through direct intervention."
    ],
    checklist: [
      "Tell the agent exactly how the property will be used: owner-occupied, rental, or vacant during rehab. Get the right policy type in writing.",
      "Ask how the policy handles vacancy and whether days before you bought the home count toward a vacancy limit.",
      "Ask whether the policy pays replacement cost or actual cash value, and what dwelling limit it would take to rebuild.",
      "Ask about flood coverage even if the home is outside a mapped flood zone.",
      "In California wildfire areas, compare private carriers, the FAIR Plan and wrap-around policies. Check whether an old roof limits your options.",
      "Confirm liability coverage for tenants and visitors on a rental."
    ],
    facts: [
      {
        text: "California FAIR Plan residential policies more than doubled from 2020 to 2024, to nearly 452,000.",
        source: {
          label: "AP via KPBS: LA neighbors have vastly different post-wildfire rebuilding options due to insurance crisis (Feb. 5, 2025)",
          url: "https://www.kpbs.org/news/economy/2025/02/05/la-neighbors-have-vastly-different-post-wildfire-rebuilding-options-due-to-insurance-crisis"
        }
      },
      {
        text: "Most homeowners and renters policies don’t cover flood damage.",
        source: {
          label: "FEMA / FloodSmart, Most homeowners insurance does not cover flood damage (2025)",
          url: "https://agents.floodsmart.gov/sites/default/files/media/document/2025-08/fema_nfip-most-homeowners-insurance-does-not-cover-flood-damage_postcard_08-2025.pdf"
        }
      },
      {
        text: "California’s vacancy-clause ruling: the 60-day count looks back from the date of loss whether or not you owned the building then.",
        source: {
          label: "California Court of Appeal: St. Mary & St. John Coptic Orthodox Church v. SBC Insurance Services, A156085 (Nov. 23, 2020)",
          url: "https://cases.justia.com/california/court-of-appeal/2020-a156085.pdf"
        }
      },
      {
        text: "The California Department of Insurance says it has recovered more than $280 million for Eaton and Palisades fire survivors through direct intervention.",
        source: {
          label: "California Department of Insurance press release: enforcement action against State Farm over LA wildfire claims (May 4, 2026)",
          url: "https://www.insurance.ca.gov/0400-news/0100-press-releases/2026/release019-2026.cfm"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A single mother in Altadena, California",
        year: "2025",
        title: "Private policy paid quickly after the Eaton Fire",
        happened: "Her house burned in the Eaton Fire. She had a standard private policy with Mercury Insurance that cost $1,264 a year. It offered up to $1.5 million for her home, other structures and belongings. That included up to $303,000 for living expenses. Within days the insurer wired tens of thousands of dollars to get her started.",
        lesson: "Full replacement-cost coverage from a private carrier made rebuilding far easier. Review your limits before a disaster, not after.",
        source: {
          label: "AP via KPBS: LA neighbors have vastly different post-wildfire rebuilding options due to insurance crisis (Feb. 5, 2025)",
          url: "https://www.kpbs.org/news/economy/2025/02/05/la-neighbors-have-vastly-different-post-wildfire-rebuilding-options-due-to-insurance-crisis"
        }
      },
      {
        tone: "good",
        who: "Eaton and Palisades fire survivors in Los Angeles County, California",
        year: "2026",
        title: "State regulator recovered $280 million for policyholders",
        happened: "After consumer complaints about wildfire claims, the California Department of Insurance stepped in directly. It said it had recovered more than $280 million from insurers for Eaton and Palisades fire survivors that way. It also brought an enforcement action against State Farm General after an exam found mishandled claims.",
        lesson: "If an insurer stalls or underpays, filing a complaint with the state insurance regulator is free and can work.",
        source: {
          label: "California Department of Insurance press release: enforcement action against State Farm over LA wildfire claims (May 4, 2026)",
          url: "https://www.insurance.ca.gov/0400-news/0100-press-releases/2026/release019-2026.cfm"
        }
      },
      {
        tone: "caution",
        who: "A homeowner and his pregnant wife in Altadena, California",
        year: "2025",
        title: "Non-renewed, moved to the FAIR Plan, underinsured",
        happened: "His private insurer declined to renew in 2024, so he moved to the California FAIR Plan. He paid $2,000 a year for a $686,000 maximum payout and $1,500 a year for wrap-around coverage. Because his roof was too old, he could only get ‘actual cash value’ coverage. After the Eaton Fire, he expected to need loans to rebuild.",
        lesson: "Before you buy in a California fire zone, check what the FAIR Plan really pays: replacement cost or actual cash value. Also check what the property will cost to insure.",
        source: {
          label: "AP via KPBS: LA neighbors have vastly different post-wildfire rebuilding options due to insurance crisis (Feb. 5, 2025)",
          url: "https://www.kpbs.org/news/economy/2025/02/05/la-neighbors-have-vastly-different-post-wildfire-rebuilding-options-due-to-insurance-crisis"
        }
      },
      {
        tone: "caution",
        who: "A church that bought an empty house in the San Francisco Bay Area, California (Alameda County case)",
        year: "2015 (ruling 2020)",
        title: "Water damage 57 days after closing; vacancy clause applied",
        happened: "A church bought a vacant house and was insured through its broker under a commercial policy. Water damage struck 57 days after escrow closed. The insurer denied the claim under a 60-day vacancy clause. The church and insurer settled with a loan of about $461,000 for repairs. A California appeals court later ruled the 60-day count includes time before the buyer owned the house.",
        lesson: "If you buy an empty foreclosure or REO home, tell your agent it is vacant. Get coverage written for that from day one.",
        source: {
          label: "California Court of Appeal: St. Mary & St. John Coptic Orthodox Church v. SBC Insurance Services, A156085 (Nov. 23, 2020)",
          url: "https://cases.justia.com/california/court-of-appeal/2020-a156085.pdf"
        }
      },
      {
        tone: "caution",
        who: "A retired corrections officer and his wife in Monroe Township, New Jersey",
        year: "2021",
        title: "Let flood policy lapse, then $100,000 in damage",
        happened: "When his mother owned the home, it carried flood insurance that cost about $650 a year. The couple let it lapse after being told the area wasn’t a flood zone. Then came Tropical Storm Henri and the remnants of Hurricane Ida. They estimated $100,000 to make the house livable and replace their car. Their homeowners policy paid nothing for the flood.",
        lesson: "Most homeowners policies don’t cover floods, so price flood coverage even outside a mapped flood zone.",
        source: {
          label: "AP via Fox Business: After Northeast flooding, insurance woes swamp residents (Sept. 23, 2021)",
          url: "https://www.foxbusiness.com/lifestyle/after-northeast-flooding-insurance-woes-swamp-residents"
        }
      }
    ],
    sources: [
      {
        label: "AP via KPBS: LA neighbors have vastly different post-wildfire rebuilding options due to insurance crisis (Feb. 5, 2025)",
        url: "https://www.kpbs.org/news/economy/2025/02/05/la-neighbors-have-vastly-different-post-wildfire-rebuilding-options-due-to-insurance-crisis"
      },
      {
        label: "AP via Fox Business: After Northeast flooding, insurance woes swamp residents (Sept. 23, 2021)",
        url: "https://www.foxbusiness.com/lifestyle/after-northeast-flooding-insurance-woes-swamp-residents"
      },
      {
        label: "California Court of Appeal: St. Mary & St. John Coptic Orthodox Church v. SBC Insurance Services, A156085 (Nov. 23, 2020)",
        url: "https://cases.justia.com/california/court-of-appeal/2020-a156085.pdf"
      },
      {
        label: "California Department of Insurance press release: enforcement action against State Farm over LA wildfire claims (May 4, 2026)",
        url: "https://www.insurance.ca.gov/0400-news/0100-press-releases/2026/release019-2026.cfm"
      },
      {
        label: "CNN: They lost their insurance. Then their homes burned (Jan. 18, 2025)",
        url: "https://www.cnn.com/2025/01/18/business/home-insurance-california-fires-burned/index.html"
      }
    ]
  },
  cpa: {
    overview: [
      "A CPA or enrolled agent helps you keep rental and flipping taxes legal and organized. The hardest rental rules are the ‘passive activity’ rules. Rental losses usually can’t offset wage income, except for a special allowance of up to $25,000 for owners who actively take part. That allowance shrinks once modified adjusted gross income passes $100,000. It is gone at $150,000, and it is smaller if you’re married filing separately. Flips and sales are taxed differently: a flip is often taxed as ordinary income, not as a lower-taxed capital gain, and a 1031 exchange can’t be used for it. When you sell a rental, the depreciation you took is partly taxed back.",
      "The bigger exception is ‘real estate professional’ status. You must work more than 750 hours a year in real estate businesses, and that must be more than half of all your working hours. You must also materially participate in the rentals themselves, either each one separately or all together if you make the IRS election to group them. The Tax Court regularly rejects claims backed only by estimates or by calendars rebuilt from memory during an audit. If the shortfall is large, it can add a 20% penalty unless you show reasonable cause. Owners who win usually have good records.",
      "Anyone with a PTIN can charge to prepare returns. But only CPAs, enrolled agents and attorneys have unlimited rights to represent you before the IRS. A CPA can only protect you if you give them full, accurate information."
    ],
    bestFor: [
      "Landlords with losses who need to know whether the $25,000 allowance or real estate professional status applies.",
      "Investors with several properties, LLCs or a spouse who works in real estate full time.",
      "Flippers who need to separate business income from investment gains.",
      "Anyone who has received an IRS audit letter about rental losses."
    ],
    notFor: [
      "Owners who want a preparer to ‘find’ a bigger refund. The IRS warns against preparers who promise larger refunds or charge a percentage of the refund.",
      "Taxpayers who won’t keep records. Even a CPA can’t defend real estate professional hours you can’t back up.",
      "People hoping a professional’s signature alone will shield them from penalties. That defense requires giving the professional all relevant facts."
    ],
    costs: [
      "Preparation fees: ask up front. The IRS tells taxpayers to find out about service fees before hiring.",
      "Penalties for getting it wrong: the Tax Court applied a 20% substantial understatement penalty when a California couple’s real estate professional claim failed (2018).",
      "Lost deductions: in one case the IRS disallowed $31,318 of a $40,490 rental loss after the owner failed the 750-hour test (Tax Court, 2010).",
      "Time cost of record keeping: a contemporaneous log of hours, receipts and mileage."
    ],
    money: [
      "Fee structure: the IRS says to avoid preparers who base their fee on a percentage of your refund.",
      "Credentials affect what you get for the fee. Enrolled agents, CPAs and attorneys have unlimited representation rights before the IRS. Preparers with only a PTIN can prepare returns but have limited representation rights."
    ],
    checklist: [
      "Confirm the preparer has a PTIN and signs the return. Check credentials in the IRS directory of preparers.",
      "Prefer a CPA, enrolled agent or tax attorney if you might face an audit (unlimited representation rights).",
      "Ask about fees up front, and walk away from percentage-of-refund pricing.",
      "Ask how they will document the $25,000 allowance or real estate professional status, and what logs they need from you.",
      "Give them complete facts, including your hours and other jobs. Relying on a professional only helps if you gave them all relevant information.",
      "Ask about experience with rentals, flips and passive-loss rules."
    ],
    facts: [
      {
        text: "Up to $25,000 of rental losses can offset other income for active participants. It phases out above $100,000 of modified AGI.",
        source: {
          label: "IRS Publication 925: Passive Activity and At-Risk Rules",
          url: "https://www.irs.gov/publications/p925"
        }
      },
      {
        text: "Real estate professional tests: more than 750 hours and more than half of working time in real estate businesses, plus material participation in the rentals.",
        source: {
          label: "IRS Publication 925: Passive Activity and At-Risk Rules",
          url: "https://www.irs.gov/publications/p925"
        }
      },
      {
        text: "The IRS accepts any reasonable proof of participation, such as an appointment book or calendar.",
        source: {
          label: "IRS Publication 925: Passive Activity and At-Risk Rules",
          url: "https://www.irs.gov/publications/p925"
        }
      },
      {
        text: "The IRS warns against percentage-of-refund pricing.",
        source: {
          label: "IRS: Tips for choosing a tax return preparer",
          url: "https://www.irs.gov/newsroom/tips-for-choosing-a-tax-return-preparer"
        }
      },
      {
        text: "Anyone with a PTIN can be a paid preparer. Skill levels vary.",
        source: {
          label: "IRS: Choosing a tax professional",
          url: "https://www.irs.gov/tax-professionals/choosing-a-tax-professional"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A couple with two small apartment properties. The husband was an emergency physician and the wife managed the rentals (U.S. Tax Court case)",
        year: "2018",
        title: "Detailed spreadsheets won real estate professional status",
        happened: "The IRS disallowed the couple’s rental loss. The wife was the only person running the day-to-day work. That included cleaning, repairs, tenant contact, rent collection and hiring contractors. She backed it up with detailed spreadsheets, time-keeping entries and receipts. The Tax Court found she met the real estate professional test and allowed the loss.",
        lesson: "Good records kept as you go are the strongest proof for a real estate professional claim.",
        source: {
          label: "RSM US tax alert on Birdsong v. Commissioner (U.S. Tax Court, 2018)",
          url: "https://rsmus.com/insights/tax-alerts/2018/recent-case-shows-benefit-of-record-keeping-when-claiming-rental-loss.html"
        }
      },
      {
        tone: "good",
        who: "A two-dentist couple who also ran a real estate brokerage and four rentals (U.S. Tax Court case)",
        year: "2017",
        title: "Contemporaneous logs saved $200,000-plus yearly losses",
        happened: "The IRS disallowed real estate losses of about $220,000 to $242,000 a year for 2010 to 2012. It argued the husband’s dental work came first. He produced logs showing more than 1,000 real estate hours a year. He testified credibly that the logs were kept at the time, and witnesses backed him up. The Tax Court found he was a real estate professional.",
        lesson: "Logs written at the time, not rebuilt later, made the difference in court.",
        source: {
          label: "Current Federal Tax Developments (Ed Zollars, CPA), quoting Zarrinnegar v. Commissioner, T.C. Memo 2017-34 (Feb. 14, 2017)",
          url: "https://www.currentfederaltaxdevelopments.com/blog/2017/2/14/dentist-establishes-he-was-a-real-estate-professional"
        }
      },
      {
        tone: "caution",
        who: "A California couple with rentals in San Jose, San Diego, Tucson and elsewhere (U.S. Tax Court case)",
        year: "2018",
        title: "Calendars rebuilt from memory fell apart",
        happened: "The couple claimed real estate professional status without keeping any log. During the audit they rebuilt calendars from memory. Bank records showed them in London and Dallas on days the calendars said they were working on the properties. The court rejected the claim and applied a 20% penalty.",
        lesson: "Don’t claim real estate professional status unless you can back up the hours. A log kept as you go is the strongest proof. A calendar or appointment book can work, but numbers rebuilt from memory during an audit usually fail.",
        source: {
          label: "Current Federal Tax Developments (Ed Zollars, CPA), quoting Pourmirzaie v. Commissioner, T.C. Memo 2018-26 (Mar. 9, 2018)",
          url: "https://www.currentfederaltaxdevelopments.com/blog/2018/3/9/tax-court-rejects-taxpayers-reconstruction-of-real-estate-hours"
        }
      },
      {
        tone: "caution",
        who: "A nuclear plant technician who owned seven rentals (U.S. Tax Court case)",
        year: "2010",
        title: "‘On-call’ time didn’t count; most of loss disallowed",
        happened: "The owner worked about 1,900 hours at his plant job. He estimated 645 hours on his rentals, with no detailed log. He argued his ‘on-call’ time should count. The Tax Court disagreed, so he could deduct only $9,172 of a $40,490 loss. He also got a negligence penalty because he hadn’t given his CPA his hours.",
        lesson: "A CPA can’t protect you if you don’t give them the facts, and estimates aren’t records.",
        source: {
          label: "Journal of Accountancy (AICPA): Taxpayer off the clock for real estate loss, on Moss v. Commissioner, 135 T.C. No. 18 (Dec. 1, 2010)",
          url: "https://www.journalofaccountancy.com/issues/2010/dec/realestate/"
        }
      },
      {
        tone: "caution",
        who: "Clients of a paid tax preparer in Utica, New York",
        year: "2024",
        title: "Preparer faked rental losses for clients",
        happened: "A paid preparer in Oneida County, New York filed client returns from 2014 to 2018. The returns claimed false rental losses that cut the clients’ taxes. She was sentenced to three years of probation and ordered to pay $101,636 in restitution to the IRS.",
        lesson: "A preparer who invents rental losses puts you at risk. Choose credentialed professionals and review what they file.",
        source: {
          label: "IRS Criminal Investigation / U.S. Attorney N.D.N.Y.: Former Utica tax preparer sentenced for filing false tax returns (June 13, 2024)",
          url: "https://www.irs.gov/compliance/criminal-investigation/former-utica-tax-preparer-sentenced-for-filing-false-tax-returns"
        }
      }
    ],
    sources: [
      {
        label: "IRS Publication 925: Passive Activity and At-Risk Rules",
        url: "https://www.irs.gov/publications/p925"
      },
      {
        label: "Journal of Accountancy (AICPA): Taxpayer off the clock for real estate loss, on Moss v. Commissioner, 135 T.C. No. 18 (Dec. 1, 2010)",
        url: "https://www.journalofaccountancy.com/issues/2010/dec/realestate/"
      },
      {
        label: "IRS: Tips for choosing a tax return preparer",
        url: "https://www.irs.gov/newsroom/tips-for-choosing-a-tax-return-preparer"
      },
      {
        label: "IRS: Choosing a tax professional",
        url: "https://www.irs.gov/tax-professionals/choosing-a-tax-professional"
      },
      {
        label: "RSM US tax alert on Birdsong v. Commissioner (U.S. Tax Court, 2018)",
        url: "https://rsmus.com/insights/tax-alerts/2018/recent-case-shows-benefit-of-record-keeping-when-claiming-rental-loss.html"
      },
      {
        label: "Current Federal Tax Developments (Ed Zollars, CPA), quoting Zarrinnegar v. Commissioner, T.C. Memo 2017-34 (Feb. 14, 2017)",
        url: "https://www.currentfederaltaxdevelopments.com/blog/2017/2/14/dentist-establishes-he-was-a-real-estate-professional"
      },
      {
        label: "Current Federal Tax Developments (Ed Zollars, CPA), quoting Pourmirzaie v. Commissioner, T.C. Memo 2018-26 (Mar. 9, 2018)",
        url: "https://www.currentfederaltaxdevelopments.com/blog/2018/3/9/tax-court-rejects-taxpayers-reconstruction-of-real-estate-hours"
      },
      {
        label: "IRS Criminal Investigation / U.S. Attorney N.D.N.Y.: Former Utica tax preparer sentenced for filing false tax returns (June 13, 2024)",
        url: "https://www.irs.gov/compliance/criminal-investigation/former-utica-tax-preparer-sentenced-for-filing-false-tax-returns"
      }
    ]
  },
  property_manager: {
    overview: [
      "A property manager finds and screens tenants, collects rent, handles repairs and keeps owners’ and tenants’ money in trust accounts. In Nevada, managing rentals for others requires a real estate license plus a property management permit. Check your state’s real estate regulator for the licensing rules that apply to managers there.",
      "The biggest risk is the trust account. If a manager mixes or spends owner rents and tenant deposits, owners can lose months of rent. They can still owe tenants their deposits back. Nevada regulators found one Las Vegas broker’s security deposit account held $15 when his records said $185,343.",
      "Licensing also gives you a backstop. California’s Department of Real Estate Consumer Recovery Account and Arizona’s Real Estate Recovery Fund can repay some losses caused by licensees. They pay after a court judgment, up to set limits."
    ],
    bestFor: [
      "Out-of-state investors who can’t handle showings, repairs and rent collection themselves.",
      "Owners with several units who need consistent screening, accounting and legal compliance.",
      "Landlords who want a licensee whose conduct is overseen by a state real estate regulator, with recovery-fund protection in California and Arizona. A license isn’t proof they follow the rules, so still check statements."
    ],
    notFor: [
      "Owners who won’t read monthly statements or check that deposits match bank records.",
      "Owners choosing an unlicensed ‘manager’ to save fees, which gives up regulator oversight and recovery funds.",
      "Very small, nearby rentals where the owner has time to self-manage and knows landlord-tenant law."
    ],
    costs: [
      "Management fees: ask for every fee in writing, such as monthly management, leasing, renewal and maintenance markups. (No sourced typical percentage was found.)",
      "Loss risk: in one Nevada case a broker failed to pay owners their rents and deposits. That included more than $23,000 for one owner’s four units (2025 order).",
      "Recovery fund limits: California pays up to $50,000 per transaction and $250,000 per licensee. Arizona pays up to $30,000 per transaction and $90,000 per licensee.",
      "Legal and court costs to get a judgment, which both California’s and Arizona’s funds require before they pay."
    ],
    money: [
      "Ask how the manager is paid: flat fee or share of rent, leasing fees, repair markups. Get it in the management agreement. No reliable sourced typical-fee data was found for these states.",
      "Make sure rent and deposits go into a separate trust account. You should get monthly statements you can check against your own bank deposits."
    ],
    checklist: [
      "Check the license with the state real estate regulator, and look at its discipline history. In Nevada, also check the property management permit.",
      "Ask where rent and security deposits are held and ask for trust account reconciliations.",
      "Get a written management agreement covering fees, repair spending limits, and any ‘deferment’ or offset arrangements. In the Nevada case, a broker’s unwritten rent deferment deal led to missing rent.",
      "Compare monthly owner statements to your own bank deposits. Missing deposits are an early warning.",
      "Confirm the security deposit will be transferred to you or the next manager if you change managers.",
      "Ask for references from current owner-clients."
    ],
    facts: [
      {
        text: "California’s Consumer Recovery Account pays up to $50,000 per transaction and $250,000 per licensee. It covers fraud or conversion of trust funds by a licensee.",
        source: {
          label: "California Department of Real Estate: Consumer Recovery Account",
          url: "https://www.dre.ca.gov/consumers/ConsumerRecoveryAccount.html"
        }
      },
      {
        text: "California’s account has paid more than $65 million since 1964.",
        source: {
          label: "California Department of Real Estate: Consumer Recovery Account",
          url: "https://www.dre.ca.gov/consumers/ConsumerRecoveryAccount.html"
        }
      },
      {
        text: "Arizona’s Real Estate Recovery Fund limit: $30,000 per transaction, $90,000 total per licensee.",
        source: {
          label: "Arizona Department of Real Estate: Recovery Fund",
          url: "https://azre.gov/consumers/recovery-fund"
        }
      },
      {
        text: "A Nevada broker’s security-deposit account held $15 while his own records showed $185,343.",
        source: {
          label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law, and Order, Case Nos. 2024-364, 2024-540, 2024-1012 (hearing May 13, 2025)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2025/Orders/Brooks-Dane-C._2024-364-2024-540-2024-1012_Oder.pdf"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "Rental owners who used a property management company in Carlsbad, California",
        year: "2019",
        title: "Manager stole; licensing let owners recover part of it",
        happened: "Owners hired Carousel Properties, a Carlsbad management company, to pay fees on their rentals. The company’s owner was accused of taking about $200,000. She faced 29 felony embezzlement counts and took a plea deal for a year in custody. With the district attorney’s help, 23 victims were paid back $172,084.68 from the Department of Real Estate’s Consumer Recovery Account. More payments were pending.",
        lesson: "A recovery fund is a safety net after a loss, and it needs a court judgment or restitution order first. It doesn’t prevent the loss, so check statements and the trust account yourself.",
        source: {
          label: "ABC 10News San Diego (KGTV): Victims get refunds in Carlsbad embezzlement case (Feb. 19, 2019)",
          url: "https://www.10news.com/news/team-10/team-10-victims-get-refunds-in-carlsbad-embezzlement-case"
        }
      },
      {
        tone: "good",
        who: "A condo owner in Las Vegas, Nevada",
        year: "2024",
        title: "Owner tracked deposits, complained, was made whole",
        happened: "An owner noticed her bank statements showed no rent deposits for several months in 2023, though her two units were rented. In April 2024 she filed a complaint with the Nevada Real Estate Division. By October 2024 she told the investigator the broker had paid all the money he owed her. The Division kept investigating anyway, and the broker’s licenses were later revoked.",
        lesson: "Comparing statements to your bank account and complaining early to the state regulator can get your money back.",
        source: {
          label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law, and Order, Case Nos. 2024-364, 2024-540, 2024-1012 (hearing May 13, 2025)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2025/Orders/Brooks-Dane-C._2024-364-2024-540-2024-1012_Oder.pdf"
        }
      },
      {
        tone: "caution",
        who: "Rental owners who used a property management company in Las Vegas, Nevada",
        year: "2025",
        title: "Broker kept rents and deposits; licenses revoked",
        happened: "The Nevada Real Estate Commission found a Las Vegas broker had misused rents and security deposits for properties he managed. In one complaint, owners of four rented units said they never received more than $23,000 in rent and deposits. His trust account showed $15 in security deposits against records claiming $185,343. The commission revoked all his licenses and ordered more than $35,000 in fines and costs.",
        lesson: "Ask for trust account reconciliations, and act quickly when rent deposits stop arriving.",
        source: {
          label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law, and Order, Case Nos. 2024-364, 2024-540, 2024-1012 (hearing May 13, 2025)",
          url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2025/Orders/Brooks-Dane-C._2024-364-2024-540-2024-1012_Oder.pdf"
        }
      },
      {
        tone: "caution",
        who: "HOAs, property owners and tenants in Iron County (Cedar City), Utah",
        year: "2025",
        title: "Property manager took $586,000 to fund gambling",
        happened: "A Cedar City property manager pleaded guilty to cheating HOAs, property owners and tenants in Iron County out of more than $586,000. This happened between January 2020 and January 2025. There was also a separate $1.4 million scheme against a bank. He was caught after one victim’s lawyer reported suspicious activity. Investigators found accounts where he was the sole signer. He was sentenced to more than two years in federal prison.",
        lesson: "Don’t let one person be the only signer on accounts holding your rent and deposits without outside review.",
        source: {
          label: "KUTV (Salt Lake City): Former Cedar City property manager sentenced after defrauding $2.1M from victims (Dec. 16, 2025)",
          url: "https://kjzz.com/news/local/former-cedar-city-property-manager-sentenced-after-defrauding-21m-from-victims"
        }
      }
    ],
    sources: [
      {
        label: "California Department of Real Estate: Consumer Recovery Account",
        url: "https://www.dre.ca.gov/consumers/ConsumerRecoveryAccount.html"
      },
      {
        label: "Arizona Department of Real Estate: Recovery Fund",
        url: "https://azre.gov/consumers/recovery-fund"
      },
      {
        label: "Nevada Real Estate Commission: Findings of Fact, Conclusions of Law, and Order, Case Nos. 2024-364, 2024-540, 2024-1012 (hearing May 13, 2025)",
        url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/REC/2025/Orders/Brooks-Dane-C._2024-364-2024-540-2024-1012_Oder.pdf"
      },
      {
        label: "ABC 10News San Diego (KGTV): Victims get refunds in Carlsbad embezzlement case (Feb. 19, 2019)",
        url: "https://www.10news.com/news/team-10/team-10-victims-get-refunds-in-carlsbad-embezzlement-case"
      },
      {
        label: "KUTV (Salt Lake City): Former Cedar City property manager sentenced after defrauding $2.1M from victims (Dec. 16, 2025)",
        url: "https://kjzz.com/news/local/former-cedar-city-property-manager-sentenced-after-defrauding-21m-from-victims"
      }
    ]
  },
  eviction: {
    overview: [
      "Eviction is a court process. A landlord cannot legally remove a tenant by changing the locks, shutting off utilities or taking the tenant’s belongings. In California only a sheriff or marshal, with a court order, may carry out an eviction. In Arizona and Nevada, tenants locked out or cut off from essential services can sue for damages set by statute.",
      "Each state runs its own process. In Nevada, an eviction for unpaid rent starts with a 7-day notice to pay or quit. Clark County says evictions take anywhere from 10 to 180 days depending on the case, so budget for the long end. Nevada’s fast ‘summary eviction’ can’t be used against a former owner or the former owner’s tenant after a foreclosure. California’s ‘unlawful detainer’ case requires the landlord to file and serve a lawsuit. Arizona requires written notice before filing, such as 10 days for many lease violations. An eviction attorney helps you serve the right notice, file correctly and avoid defenses that restart the clock.",
      "Investors who buy occupied homes at foreclosure auctions or as REOs must also go through the courts to remove occupants. After a foreclosure, tenants who rented from the former owner usually get at least 90 days’ notice under federal law, and a lease signed before the sale may run to its end unless the buyer will live there. Self-help, like changing the locks yourself, can turn a rent dispute into a damages award against you."
    ],
    bestFor: [
      "Landlords facing a nonpaying or lease-violating tenant who want possession back quickly and lawfully.",
      "Auction or REO buyers who take title to an occupied property.",
      "Out-of-state owners unfamiliar with local notice rules and court procedures.",
      "Owners of rent-controlled or ‘just cause’ units in California, where notices are technical."
    ],
    notFor: [
      "Landlords tempted to change locks, cut utilities or remove belongings. That exposes you to statutory damages in California, Arizona and Nevada.",
      "Disputes that a payment plan or mediation could settle cheaper and faster.",
      "Owners hoping to evict to retaliate for a tenant’s complaint. Courts have awarded damages for retaliatory eviction."
    ],
    costs: [
      "Court filing fees, notice service and constable or sheriff fees. In 2019 the Review-Journal reported Nevada tenants paid a $71 filing fee to contest an eviction in the two largest counties.",
      "Lost rent during the process. In Nevada, Clark County says evictions take anywhere from 10 to 180 days. Contested cases take longer.",
      "Self-help penalties: California Civil Code 789.3 penalties are up to $100 a day and at least $250 per violation. One landlord was ordered to pay $36,000 in penalties plus damages and fees (1980). In Nevada a court can award up to $2,500 plus actual damages. In Arizona it can award two months’ rent or twice actual damages.",
      "Attorney fees: California’s utility shutoff statute awards fees to the prevailing party."
    ],
    money: [
      "Ask whether the attorney charges a flat fee per uncontested eviction, or bills by the hour if the tenant contests. Ask what court and service costs are extra. (No sourced typical fee figure was found.)"
    ],
    checklist: [
      "Confirm the attorney regularly handles landlord evictions in the county where the property is.",
      "Ask which notice your situation requires (nonpayment, lease violation, no-cause) and the deadline in that state.",
      "Ask about local rent control or ‘just cause’ rules (common in California cities).",
      "Ask how long an uncontested and a contested case usually take in that court.",
      "Agree never to use self-help (lockouts, utility shutoffs, removing belongings) while the case runs.",
      "For auction or REO purchases, ask how to remove a former owner or occupant who isn’t on a lease, and whether a tenant gets 90 days’ notice or can stay to the end of a lease under federal law."
    ],
    facts: [
      {
        text: "California: only a sheriff or marshal, with a court order, may evict.",
        source: {
          label: "California Attorney General: Know Your Rights, The Eviction Process",
          url: "https://oag.ca.gov/system/files/media/Know-Your-Rights-Eviction-Process-English.pdf"
        }
      },
      {
        text: "California: lockouts, utility shutoffs and removing belongings are illegal.",
        source: {
          label: "California Attorney General: Know Your Rights, The Eviction Process",
          url: "https://oag.ca.gov/system/files/media/Know-Your-Rights-Eviction-Process-English.pdf"
        }
      },
      {
        text: "Arizona: a tenant unlawfully ousted, or whose utilities are cut, can recover two months’ rent or twice actual damages, whichever is greater.",
        source: {
          label: "Arizona Revised Statutes 33-1367: Tenant’s remedies for landlord’s unlawful ouster",
          url: "https://www.azleg.gov/ars/33/01367.htm"
        }
      },
      {
        text: "Nevada: a court can award up to $2,500 plus actual damages for an unlawful lockout or service shutoff (NRS 118A.390).",
        source: {
          label: "Nevada Revised Statutes chapter 118A (NRS 118A.390)",
          url: "https://www.leg.state.nv.us/NRS/NRS-118A.html"
        }
      },
      {
        text: "Nevada: Clark County says evictions may take anywhere from 10 to 180 days, and its fast summary eviction can’t be used against a former owner or the former owner’s tenant.",
        source: {
          label: "Clark County (NV): Las Vegas Township eviction process",
          url: "https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process"
        }
      },
      {
        text: "Nevada: from 2014 through 2018, Las Vegas Valley constables received eviction orders for more than 99,000 homes, apartments and hotel rooms.",
        source: {
          label: "Las Vegas Review-Journal: Despite changes, Nevada eviction law still favors landlords (June 2019)",
          url: "https://www.reviewjournal.com/local/local-nevada/despite-changes-nevada-eviction-law-still-favors-landlords-1697301/"
        }
      },
      {
        text: "California Civil Code 789.3 (as revised in 1979) also bars changing locks, removing doors or windows, and removing a tenant’s property to evict. The minimum penalty is $250 per violation.",
        source: {
          label: "Supreme Court of California: Kinney v. Vaccari, 27 Cal. 3d 348 (1980), Caselaw Access Project",
          url: "https://static.case.law/cal-3d/27/html/0348-01.html"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A landlord renting a home in Summerlin (Las Vegas), Nevada",
        year: "2018",
        title: "In 2018, the court process took about three weeks",
        happened: "A tenant’s $1,450 rent was not paid on July 6, 2018. An eviction notice was posted that day. The landlord used Nevada’s summary eviction process. The court entered a default judgment. Constable deputies removed the occupants on July 27, without the landlord touching the locks.",
        lesson: "The lawful court process avoids self-help penalties. This case was fast; Clark County now says evictions take 10 to 180 days. It’s hard on everyone, though. That’s why many landlords first try a payment plan or a negotiated move-out.",
        source: {
          label: "Las Vegas Review-Journal: Despite changes, Nevada eviction law still favors landlords (June 2019)",
          url: "https://www.reviewjournal.com/local/local-nevada/despite-changes-nevada-eviction-law-still-favors-landlords-1697301/"
        }
      },
      {
        tone: "caution",
        who: "Sixteen tenants (including seven children) in six rental units, California",
        year: "1974 (ruling 1980)",
        title: "Gas cut off to force tenants out: $36,000 in penalties",
        happened: "The landlord’s son and managing agent let the gas bill go unpaid so service would be shut off. He also refused tenants’ rent payments. Families were left without heat or hot water for 60 days in harsh winter weather. The trial court awarded $7,901 in damages, $36,000 in statutory penalties, $5,600 in attorney fees, and punitive damages. The California Supreme Court upheld the penalties.",
        lesson: "Cutting utilities to force tenants out can cost far more than the rent you were owed.",
        source: {
          label: "Supreme Court of California: Kinney v. Vaccari, 27 Cal. 3d 348 (1980), Caselaw Access Project",
          url: "https://static.case.law/cal-3d/27/html/0348-01.html"
        }
      },
      {
        tone: "caution",
        who: "An apartment-house landlord in California",
        year: "1961",
        title: "Lease ‘re-entry’ clause no defense to a lockout",
        happened: "A tenant fell two months behind on $132.50 rent. While she was away, the landlord unlocked her apartment and moved her furniture to a warehouse. He refused to let her back in. He relied on a lease clause giving him a right of re-entry. A jury awarded her $6,500 plus $3,000 in punitive damages. The California Supreme Court held that the lockout was a forcible entry even without violence. It also held that a lease cannot authorize one. But it upheld a new trial on other grounds.",
        lesson: "A lease clause doesn’t let you skip the court process.",
        source: {
          label: "Supreme Court of California: Jordan v. Talbot, 55 Cal. 2d 597 (1961), Caselaw Access Project",
          url: "https://static.case.law/cal-2d/55/html/0597-01.html"
        }
      }
    ],
    sources: [
      {
        label: "California Attorney General: Know Your Rights, The Eviction Process",
        url: "https://oag.ca.gov/system/files/media/Know-Your-Rights-Eviction-Process-English.pdf"
      },
      {
        label: "Arizona Revised Statutes 33-1367: Tenant’s remedies for landlord’s unlawful ouster",
        url: "https://www.azleg.gov/ars/33/01367.htm"
      },
      {
        label: "Nevada Revised Statutes chapter 118A (NRS 118A.390)",
        url: "https://www.leg.state.nv.us/NRS/NRS-118A.html"
      },
      {
        label: "Clark County (NV): Las Vegas Township eviction process",
        url: "https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process"
      },
      {
        label: "Las Vegas Review-Journal: Despite changes, Nevada eviction law still favors landlords (June 2019)",
        url: "https://www.reviewjournal.com/local/local-nevada/despite-changes-nevada-eviction-law-still-favors-landlords-1697301/"
      },
      {
        label: "Supreme Court of California: Kinney v. Vaccari, 27 Cal. 3d 348 (1980), Caselaw Access Project",
        url: "https://static.case.law/cal-3d/27/html/0348-01.html"
      },
      {
        label: "Supreme Court of California: Jordan v. Talbot, 55 Cal. 2d 597 (1961), Caselaw Access Project",
        url: "https://static.case.law/cal-2d/55/html/0597-01.html"
      },
      {
        label: "U.S. Supreme Court: Alabama Association of Realtors v. HHS, 594 U.S. ___ (Aug. 26, 2021)",
        url: "https://www.supremecourt.gov/opinions/20pdf/21a23_ap6c.pdf"
      }
    ]
  },
  appraiser: {
    overview: [
      "An appraisal is a written report that gives an opinion of how much a property is worth. The appraiser usually compares the home with similar nearby homes that sold recently. These are called comparable sales, or “comps”. The appraiser then adjusts for differences like size and condition.",
      "Appraisers hold state credentials at different levels. In California, a Licensed Residential appraiser may do non-complex 1–4 unit homes up to $1 million. There, a Certified Residential appraiser may do any 1–4 unit home, and a Certified General appraiser may do any type of property. A report can be “as is”, meaning the value today. Or it can be “subject to” repairs being finished.",
      "A professional appraisal is the best way to determine a property’s value. A real estate agent can estimate it from comparable sales in the meantime. When the appraiser can’t go inside, as at many auctions, the value rests on outside views and records. Hidden problems can be missed.",
      "Upgrades don’t add their cost to the value. Appraisers value a feature by what buyers in that market pay for it, not what it cost. Say an improvement is bigger or costlier than is typical for the neighborhood, like a pool where pools are rare. It counts only for what it adds. So $70,000 of upgrades doesn’t necessarily make a home worth $70,000 more.",
    ],
    bestFor: [
      "Investors setting a maximum bid who want an independent value, both as is and after repairs.",
      "Cash buyers who have no lender double-checking the price.",
      "Owners planning a refinance who want to know roughly what value a lender may find.",
      "Buyers who think a lender’s appraisal is wrong and want evidence for a reconsideration of value.",
    ],
    notFor: [
      "Buyers getting a Fannie Mae-backed loan who hope the lender will use an appraisal they ordered themselves. Lenders choose the appraiser.",
      "Auction properties you can’t enter, if you expect a precise number. Without an inside look, the value is only a rough guide.",
      "Anyone wanting a guarantee. An appraisal is an opinion as of one date, and markets change.",
    ],
    costs: [
      "You pay the appraiser’s fee when you order the appraisal yourself.",
      "When a lender orders the appraisal, it may charge you a reasonable fee for its cost.",
      "Lenders may not charge you for copies of the appraisal.",
    ],
    money: [
      "Whoever orders the appraisal pays the appraiser’s fee. When your lender orders it, the lender may pass a reasonable fee for the appraisal on to you.",
      "Federal rules say lenders must pay independent fee appraisers a fee that is “customary and reasonable”. That is judged for that kind of work in that local market.",
      "An appraiser’s pay must not depend on the value they report or on whether the loan closes. Federal rules ban tying payment to a target value.",
    ],
    checklist: [
      "Check the appraiser’s credential on the national registry (asc.gov/appraiser). It lists licensed and certified appraisers in every state, plus revocations and suspensions.",
      "Ask about the appraiser’s experience with this property type and this area.",
      "Ask for both an as-is value and an after-repair (“subject to completion”) value.",
      "Ask whether the appraiser will inspect inside or only outside, and make sure the report says so clearly.",
      "Read the comparable sales. Are they close by, recent, and similar in size and quality?",
      "Don’t expect upgrades to add their cost: ask how the appraiser valued each one against comparable sales.",
      "If you have better comparable sales or spot factual errors, ask the lender for a reconsideration of value.",
      "With a first-mortgage loan, watch for your free copy of the appraisal at least three business days before closing.",
    ],
    facts: [
      { text: "Fannie Mae requires appraisers’ adjustments to reflect the market’s reaction to differences between properties, not rules of thumb.", source: { label: "Fannie Mae Selling Guide B4-1.3-09: adjustments to comparable sales", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales" } },
      { text: "For energy-efficient features, Fannie Mae says the appraiser can’t adjust value dollar for dollar from equipment and installation cost. The appraiser must study how the market reacts.", source: { label: "Fannie Mae Selling Guide B4-1.3-05: improvements section", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-05/improvements-section-appraisal-report" } },
      { text: "An over-improvement is one larger or costlier than typical for the neighborhood, such as an in-ground pool where pools aren’t typical. The appraiser must show its contributory value: what it adds, not what it cost.", source: { label: "Fannie Mae Selling Guide B4-1.3-03: neighborhood section", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-03/neighborhood-section-appraisal-report" } },
      { text: "Real estate agents estimated in 2025 that a complete kitchen renovation recovers about 60% of its cost at resale. A bathroom renovation recovers about 50%.", source: { label: "NAR: 2025 Remodeling Impact Report", url: "https://cms.nar.realtor/sites/default/files/2025-04/2025-remodeling-impact-report_04-09-2025.pdf" } },
      { text: "For a first-mortgage loan on a 1–4 unit home, the lender must give you a copy of each appraisal. You get it right after it’s done, or three business days before closing, whichever is earlier. The lender can’t charge you for the copy.", source: { label: "CFPB: Regulation B § 1002.14", url: "https://www.consumerfinance.gov/rules-policy/regulations/1002/14/" } },
      { text: "Federal rules ban pressuring an appraiser to hit a minimum or maximum value, and withholding pay because the value missed a target.", source: { label: "CFPB: Regulation Z § 1026.42", url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/42/" } },
      { text: "Borrowers can ask a lender to reconsider a value they think is wrong. They can point out errors, weak comparable sales or evidence of bias. Each lender’s process may be different.", source: { label: "CFPB blog (Oct. 2022)", url: "https://www.consumerfinance.gov/archive/blog/mortgage-borrowers-can-challenge-inaccurate-appraisals-through-the-reconsideration-of-value-process/" } },
      { text: "Fannie Mae says an appraisal is done “as is” for minor wear. But it must be “subject to” repairs for problems that affect safety or structure, such as roof leaks or foundation settlement.", source: { label: "Fannie Mae Selling Guide B4-1.2-05", url: "https://selling-guide.fanniemae.com/sel/b4-1.2-05/requirements-verifying-completion-and-postponed-improvements" } },
    ],
    stories: [
      { tone: 'caution', who: "A state-licensed appraiser in Southern California", year: "2010", title: "Inflated appraisals lead to prison", happened: "Federal prosecutors said the appraiser’s reports usually valued homes at about three times what they really cost. She used comps that were bigger, fancier and in better neighborhoods, then reused her own inflated homes as comps. She got three years in prison and was ordered to repay more than $46 million.", lesson: "Always read the comparable sales. If they are bigger, nicer or farther away than the home you’re buying, the value may be inflated.", source: { label: "U.S. Attorney, C.D. California (Jan. 29, 2010)", url: "https://www.justice.gov/archive/usao/cac/Pressroom/pr2010/020.html" } },
      { tone: 'caution', who: "Beginner investors in a Utah investing group", year: "2012", title: "False appraisals sold to new investors", happened: "Organizers pitched out-of-state homes to novice investors using appraisals that about doubled their market value. One home under contract for $355,000 appraised at $645,000. The buyer couldn’t resell it, and the lender sold it in a short sale for $282,500. Organizers and an appraiser went to federal prison.", lesson: "Never rely on an appraisal supplied by the person selling you the deal. Get your own from an appraiser you check yourself.", source: { label: "U.S. Attorney, S.D. West Virginia (Nov. 5, 2012)", url: "https://www.justice.gov/archive/usao/wvs/press_releases/Nov2012/attachments/110512Morris-sentencing.html" } },
      { tone: 'caution', who: "A certified residential appraiser in Nevada", year: "2023", title: "Nevada revokes a license over a Las Vegas appraisal", happened: "Nevada’s Commission of Appraisers found that a 2020 report on a Las Vegas home had no support for the adjustments in its comparable sales grid. The report also said in different places that the inspection was exterior-only and that it was interior and exterior. The commission revoked the license and ordered $5,252.14 in costs and fees.", lesson: "Check that the report clearly says whether the appraiser went inside, and that each adjustment to a comparable sale is explained.", source: { label: "Nevada Real Estate Division, Case No. 2020-638", url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/CARE/2025/Supporting_Materials/April/Beebe-Don-E-Jr_2020-638_Order.pdf" } },
      { tone: 'good', who: "A Black couple refinancing in Baltimore", year: "2022–2024", title: "A second appraisal and a lender policy change", happened: "The couple said their home appraised at $472,000 while family photos were up. A new appraisal, after they took the photos down, came in at $750,000. In 2024 the lender settled. It agreed to tell customers about their right to a reconsideration of value and to set standards for free second appraisals. The lender denied breaking any law, and the appraiser disputed the claim.", lesson: "If an appraisal looks wrong, ask for a reconsideration of value and bring your evidence. A second opinion can change the result.", source: { label: "Insurance Journal (Mar. 26, 2024)", url: "https://amp.insurancejournal.com/news/east/2024/03/26/766474.htm" } },
    ],
    sources: [
      { label: "CFPB: What are appraisals and why do I need to look at them?", url: "https://www.consumerfinance.gov/ask-cfpb/what-are-appraisals-and-why-do-i-need-to-look-at-them-en-167/" },
      { label: "CFPB: Regulation B § 1002.14 (copies of appraisals)", url: "https://www.consumerfinance.gov/rules-policy/regulations/1002/14/" },
      { label: "CFPB: Regulation Z § 1026.42 (valuation independence)", url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/42/" },
      { label: "CFPB: Challenging inaccurate appraisals through reconsideration of value", url: "https://www.consumerfinance.gov/archive/blog/mortgage-borrowers-can-challenge-inaccurate-appraisals-through-the-reconsideration-of-value-process/" },
      { label: "CFPB: Protecting homeowners from discriminatory appraisals", url: "https://www.consumerfinance.gov/about-us/blog/protecting-homeowners-from-discriminatory-home-appraisals/" },
      { label: "CFPB: Flipped homes and second appraisals", url: "https://www.consumerfinance.gov/ask-cfpb/i-was-told-im-buying-a-home-that-was-flipped-and-that-i-have-to-get-a-second-appraisal-how-does-that-work-en-1799/" },
      { label: "Fannie Mae Selling Guide B4-1.1-03: appraiser selection", url: "https://selling-guide.fanniemae.com/sel/b4-1.1-03/appraiser-selection-criteria" },
      { label: "Fannie Mae Selling Guide B4-1.2-05: as is and subject to", url: "https://selling-guide.fanniemae.com/sel/b4-1.2-05/requirements-verifying-completion-and-postponed-improvements" },
      { label: "Fannie Mae Selling Guide B4-1.3-03: over-improvements", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-03/neighborhood-section-appraisal-report" },
      { label: "Fannie Mae Selling Guide B4-1.3-05: improvements section", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-05/improvements-section-appraisal-report" },
      { label: "Fannie Mae Selling Guide B4-1.3-09: adjustments to comparable sales", url: "https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales" },
      { label: "NAR: 2025 Remodeling Impact Report", url: "https://cms.nar.realtor/sites/default/files/2025-04/2025-remodeling-impact-report_04-09-2025.pdf" },
      { label: "Appraisal Subcommittee: national registry of appraisers", url: "https://www.asc.gov/appraiser" },
      { label: "California Bureau of Real Estate Appraisers: license levels", url: "https://brea.ca.gov/pdf/0_real_estate_appraisal_licese_levels.pdf" },
      { label: "Nevada Commission of Appraisers order, Case No. 2020-638", url: "https://red.nv.gov/uploadedFiles/rednvgov/Content/Meetings/CARE/2025/Supporting_Materials/April/Beebe-Don-E-Jr_2020-638_Order.pdf" },
      { label: "U.S. Attorney, C.D. California, Release No. 10-020", url: "https://www.justice.gov/archive/usao/cac/Pressroom/pr2010/020.html" },
      { label: "U.S. Attorney, S.D. West Virginia (Nov. 5, 2012)", url: "https://www.justice.gov/archive/usao/wvs/press_releases/Nov2012/attachments/110512Morris-sentencing.html" },
      { label: "Insurance Journal: couple settles with lender (2024)", url: "https://amp.insurancejournal.com/news/east/2024/03/26/766474.htm" },
    ],
  },
  environmental: {
    overview: [
      "An environmental consultant checks whether a property may be contaminated, usually through a Phase I Environmental Site Assessment. That means a records review, interviews and a site visit. If the Phase I finds warning signs, a Phase II tests soil, groundwater or tanks. Old gas stations, dry cleaners, auto shops and industrial lots are the classic risks.",
      "Under the federal Superfund law (CERCLA), a current owner can be liable for cleanup even if it did not cause the pollution. Buyers can qualify as ‘bona fide prospective purchasers’ only if they meet several conditions. One key condition is completing ‘all appropriate inquiries’. That generally means a Phase I under ASTM E1527-21, done by a qualified environmental professional. It must be done within one year before buying. The interviews, records review, site visit, lien search and the environmental professional’s signed declaration must be done or updated within 180 days. After buying, you must keep meeting ‘continuing obligations’: take ‘reasonable steps’ to stop releases and limit exposure, follow any land-use limits, cooperate and give access to cleanup agencies, answer their information requests and give required notices. A clean Phase I isn’t a guarantee the site is clean.",
      "Courts have denied this protection to buyers who knew of contamination but didn’t act. One example is a Las Vegas shopping-center owner that demolished a former dry cleaner without removing contaminated soil. When the work is done right, EPA Brownfields grants have paid for Phase I and II assessments. These let abandoned sites be sold and reused."
    ],
    bestFor: [
      "Buyers of commercial, industrial or mixed-use land, especially former gas stations, dry cleaners and auto shops.",
      "Buyers of tax-sale or foreclosed commercial lots who may be taking on a former owner’s contamination.",
      "Lenders or partners who require a Phase I before closing.",
      "Cities and nonprofits redeveloping blighted sites with EPA Brownfields grants."
    ],
    notFor: [
      "Buyers who plan to rely on an old report. Parts of the inquiry must be done or updated within 180 days, and the whole within one year, before you buy.",
      "Buyers who learn of contamination and then do nothing. Courts require ‘reasonable steps’ after purchase.",
      "Standard single-family home purchases with no commercial history, where a Phase I is usually not part of the deal (confirm with your lender)."
    ],
    costs: [
      "Phase I fee: get written quotes. (No sourced typical fee was found.)",
      "Phase II testing, if the Phase I flags concerns. In one Pennsylvania gas station case, Phase II work uncovered seven underground tanks where records showed two.",
      "Cleanup liability: a South Carolina buyer failed to qualify as a bona fide prospective purchaser. It shared liability for response costs at a site where it had already spent at least $194,000.",
      "State cleanup claims: Nevada’s environmental agency had spent about $160,000 by 2008 at a Las Vegas dry-cleaner site and sought repayment from owners.",
      "Grants can offset costs for public and nonprofit redevelopers. Silver City, New Mexico used a $168,393 EPA assessment grant for Phase I and II work."
    ],
    money: [
      "Ask for a written fixed fee for the Phase I and a separate estimate for any Phase II sampling. (No sourced typical fee was found.)",
      "Cities, counties and other eligible entities can apply for EPA Brownfields Assessment grants. Phase I work paid for by those grants must follow the AAI rule (40 CFR Part 312)."
    ],
    checklist: [
      "Confirm the consultant meets EPA’s definition of an ‘environmental professional’ and will follow ASTM E1527-21 (or E2247-23 for rural/forest land).",
      "Time it right: complete the Phase I within one year before closing. The interviews, records review, site visit, lien search and the environmental professional’s declaration must be within 180 days.",
      "Make sure the report is in your name (the buyer) and signed by the environmental professional.",
      "Ask what historical uses they’ll research (gas stations, dry cleaners, tanks) and whether they’ll search for environmental cleanup liens.",
      "Ask about data gaps and when they’d recommend a Phase II.",
      "Plan the ‘reasonable steps’ you’ll take after buying, such as capping sumps or limiting exposure, and document them. Also follow any land-use limits, cooperate with cleanup agencies, answer their information requests and give required notices."
    ],
    facts: [
      {
        text: "All appropriate inquiries must be done or updated within one year before buying.",
        source: {
          label: "U.S. EPA: Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        text: "ASTM E1527-21 is the standard Phase I practice that meets EPA’s AAI rule.",
        source: {
          label: "U.S. EPA: Brownfields All Appropriate Inquiries",
          url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
        }
      },
      {
        text: "CERCLA is strict liability: an owner can be liable without having caused the contamination.",
        source: {
          label: "U.S. Court of Appeals, 9th Circuit: Voggenthaler v. Maryland Square Shopping Center LLC, 724 F.3d 1050 (2013), Caselaw Access Project",
          url: "https://static.case.law/f3d/724/html/1050-01.html"
        }
      },
      {
        text: "Silver City, NM got a $168,393 EPA Brownfields Assessment Grant for Phase I and II assessments.",
        source: {
          label: "U.S. EPA Brownfields success story: The Silver Lining in an Abandoned Hospital, Silver City, NM (Oct. 2020)",
          url: "https://www.epa.gov/sites/default/files/2020-10/documents/the_silver_lining_in_an_abandoned_hospital.pdf"
        }
      }
    ],
    stories: [
      {
        tone: "good",
        who: "A local business that bought a former gas station in Carmichaels, Pennsylvania",
        year: "2024",
        title: "Phase I found tanks; cleanup made sale possible",
        happened: "A county development authority used a 2022 EPA Brownfields Assessment Grant on an old service station. It had sat vacant for years. The Phase I flagged two underground tanks. Phase II work found and removed seven tanks, and testing showed no exceedances of state standards. A local business bought the site in 2024. It now runs a machinery reclamation and auction company there, with new full-time jobs.",
        lesson: "A proper Phase I and II turned an unsellable former gas station into a property a small business could safely buy.",
        source: {
          label: "U.S. EPA Brownfields success story: From Service Pumps to Commercial Hub (Carmichaels, PA)",
          url: "https://www.epa.gov/brownfields/service-pumps-commercial-hub-greene-county-pa"
        }
      },
      {
        tone: "good",
        who: "The town of Silver City, New Mexico, and a senior-housing developer",
        year: "2019",
        title: "Abandoned hospital became 69 affordable senior apartments",
        happened: "The town bought a long-abandoned hospital. It then used a $168,393 EPA Brownfields Assessment Grant for Phase I and II assessments. They found asbestos, lead and incinerator ash. A $342,560 EPA revolving loan paid for cleanup and demolition. A developer later built affordable senior housing there, finished in fall 2019.",
        lesson: "Assessing contamination before redevelopment lets a risky site be fixed and reused instead of sitting idle.",
        source: {
          label: "U.S. EPA Brownfields success story: The Silver Lining in an Abandoned Hospital, Silver City, NM (Oct. 2020)",
          url: "https://www.epa.gov/sites/default/files/2020-10/documents/the_silver_lining_in_an_abandoned_hospital.pdf"
        }
      },
      {
        tone: "caution",
        who: "Owners of the Maryland Square Shopping Center in Las Vegas, Nevada",
        year: "2013",
        title: "Bought a dry-cleaner site, then spread the contamination",
        happened: "A former dry cleaner had leaked the solvent PCE under a Las Vegas shopping center. It reached groundwater beneath nearby homes. A buyer bought the site in 2005, knowing about the contamination. It tore down the building in 2006 and did not remove contaminated soil, so the state had to. The Ninth Circuit called the buyer’s evidence for bona fide prospective purchaser status ‘woefully insufficient’. It held the buyer liable to the state under Nevada law.",
        lesson: "Knowing about contamination isn’t enough. You must do proper inquiries and take reasonable steps after buying.",
        source: {
          label: "U.S. Court of Appeals, 9th Circuit: Voggenthaler v. Maryland Square Shopping Center LLC, 724 F.3d 1050 (2013), Caselaw Access Project",
          url: "https://static.case.law/f3d/724/html/1050-01.html"
        }
      },
      {
        tone: "caution",
        who: "A developer that bought a former fertilizer plant site in Charleston, South Carolina",
        year: "2013",
        title: "Delayed filling sumps, lost buyer protection",
        happened: "In 2003 the developer bought 27.62 acres for $2.7 million. It knew the soil was contaminated and meant to clean it up. Courts found it failed to promptly clean out and fill sumps and to manage a debris pile. So it did not take the required ‘reasonable steps.’ It lost bona fide prospective purchaser protection. It was held to share cleanup liability, after spending at least $194,000.",
        lesson: "Buyer protection under CERCLA depends on what you do after closing, not just the Phase I.",
        source: {
          label: "U.S. Court of Appeals, 4th Circuit: PCS Nitrogen Inc. v. Ashley II of Charleston LLC, 714 F.3d 161 (2013), Caselaw Access Project",
          url: "https://static.case.law/f3d/714/html/0161-01.html"
        }
      }
    ],
    sources: [
      {
        label: "U.S. EPA: Brownfields All Appropriate Inquiries",
        url: "https://www.epa.gov/brownfields/brownfields-all-appropriate-inquiries"
      },
      {
        label: "U.S. Court of Appeals, 9th Circuit: Voggenthaler v. Maryland Square Shopping Center LLC, 724 F.3d 1050 (2013), Caselaw Access Project",
        url: "https://static.case.law/f3d/724/html/1050-01.html"
      },
      {
        label: "U.S. EPA Brownfields success story: The Silver Lining in an Abandoned Hospital, Silver City, NM (Oct. 2020)",
        url: "https://www.epa.gov/sites/default/files/2020-10/documents/the_silver_lining_in_an_abandoned_hospital.pdf"
      },
      {
        label: "U.S. EPA Brownfields success story: From Service Pumps to Commercial Hub (Carmichaels, PA)",
        url: "https://www.epa.gov/brownfields/service-pumps-commercial-hub-greene-county-pa"
      },
      {
        label: "U.S. Court of Appeals, 4th Circuit: PCS Nitrogen Inc. v. Ashley II of Charleston LLC, 714 F.3d 161 (2013), Caselaw Access Project",
        url: "https://static.case.law/f3d/714/html/0161-01.html"
      }
    ]
  }
};
