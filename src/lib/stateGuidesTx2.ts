// Texas guides, part 2: IRS sales, bank-owned (REO) homes, short sales and commercial property.
// Same shape as the Utah guides in stateGuides.ts. Every rule cites a primary source in parentheses.
// County, city and lender details are labeled as examples to confirm locally.
// Examples are illustrative, not real properties or transactions.

import type { Playbook } from './playbooks';
import { TEAM } from './playbookTeam';

const TX = (code: string, ch: string) => `https://tcss.legis.texas.gov/resources/${code}/htm/${code}.${ch}.htm`;

export const TX_GUIDES_2: Playbook[] = [
{
  key: "txirs",
  title: "Texas IRS sales",
  short: "IRS sales",
  oneLine: "The IRS takes and sells a Texas property to collect unpaid federal taxes. It sells by public auction or sealed bid, under federal law.",
  youGet: "A certificate of sale when you pay. If no one buys the property back during the 180-day redemption period, you then get a deed to the taxpayer’s interest. The property is sold as-is, and liens ahead of the IRS stay with it.",
  plain: 'A certificate when you pay. Then a deed after 180 days, if no one buys it back. As is, with debts ahead of the IRS still on it.',
  forSale: true,
  glance: [
    {
      label: "Law",
      value: "Federal: 26 U.S.C. 6335 (sale), 6337 (redemption), 6338 (certificate and deed), 6339 (effect of the deed). Texas law adds recording rules (Property Code 13.001)."
    },
    {
      label: "Where listed",
      value: "irsauctions.gov. The IRS also publishes notice in a newspaper in the county. If there is no newspaper, it posts the notice in public places (6335(b))."
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
      value: "180 days. The owner, their heirs, or anyone with an interest or lien can buy the property back (redeem). They pay you your price plus 20% a year interest, which the IRS says is compounded daily (6337(b), Form 2434-B)."
    },
    {
      label: "What you get",
      value: "A certificate of sale when you pay in full. A deed after 180 days if no one redeems (6338)."
    },
    {
      label: "IRS lien at other sales",
      value: "If a Texas trustee sale or tax sale wipes out a junior federal tax lien, the IRS can still redeem. It has 120 days, or the Texas redemption period if that is longer (26 U.S.C. 7425(d), 28 U.S.C. 2410(c))."
    }
  ],
  steps: [
    {
      title: "Watch irsauctions.gov for Texas listings",
      detail: "IRS real estate sales are rare and scattered. Each listing links a notice of sale. It gives the date, place, minimum bid and payment terms. It also says whether the sale is by auction or sealed bid."
    },
    {
      title: "Read the notice of encumbrances (Form 2434-B)",
      detail: "The IRS lists the liens and interests it knows about, but it doesn’t promise the list is right. Mortgages and liens ahead of the federal tax lien stay with the property. Order your own title search from a Texas title company."
    },
    {
      title: "Check for unpaid Texas property taxes",
      detail: "A property tax lien attaches every January 1 (Tax Code 32.01). It ranks ahead of most other liens, even older ones (32.05). Ask the county tax office for the amount owed. Add it to your costs."
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
      detail: "Add any senior mortgage, unpaid Texas property taxes, repairs, and 180 days of holding costs. Use Analyze a deal (Fix and sell) to find your walk-away price."
    },
    {
      title: "Bid and pay as the notice requires",
      detail: "If full payment is required and you don’t pay, the IRS resells right away. If part can be deferred and you miss it, you can be sued for the rest with 6% interest. Or the sale can be canceled, and you lose what you paid (6335(e)(3))."
    },
    {
      title: "Hold your certificate for 180 days",
      detail: "Anyone with the right to redeem can buy the property back within 180 days by paying your price plus 20% a year (6337(b)). Whether you can collect rent, evict or move in during this time isn’t spelled out in the federal statutes. Ask a Texas attorney before you bid, and don’t start renovations."
    },
    {
      title: "Get your deed and record it with the county clerk",
      detail: "If no one redeems, turn in the certificate of sale to the IRS office named on it to get your deed (6338, Form 2434-B). Record it right away with the county clerk in the Texas county where the land sits. An unrecorded deed is void against a later buyer who pays value and has no notice of it (Property Code 13.001)."
    },
    {
      title: "Take possession lawfully",
      detail: "If anyone still lives there, hire an attorney. Texas evictions are filed in the justice court for the precinct where the property sits (Property Code 24.004). A written notice to vacate, usually at least 3 days, comes first (24.005). Never use self-help, like changing the locks."
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
      "Texas property taxes. The lien attaches every January 1 and outranks most other liens (Tax Code 32.01, 32.05). Check Form 2434-B and your title search",
      "Easements, deed restrictions and other recorded encumbrances",
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
      mistake: "Forgetting the property tax lien",
      prevent: "Texas property tax liens outrank almost everything (Tax Code 32.05). Get the tax amount from the county tax office before you bid."
    },
    {
      mistake: "Not recording the deed",
      prevent: "Record it with the county clerk as soon as you get it. An unrecorded deed can lose out to a later buyer who pays value without notice (Property Code 13.001)."
    }
  ],
  example: {
    title: "Illustrative example: a rural lot in a fictional Texas county",
    story: "Avery, a made-up buyer, won an IRS sale for a 5-acre lot at $42,000. Avery paid with a cashier’s check made out to the United States Treasury. Avery’s title search showed no mortgage, but did show two years of unpaid property taxes. Four months later, a lienholder redeemed. The lienholder paid Avery the $42,000 plus 20% a year interest.",
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
      label: "26 U.S.C. 7425 (federal liens at nonjudicial sales; 120-day redemption)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "28 U.S.C. 2410 (federal liens at judicial sales; redemption)",
      url: "https://www.law.cornell.edu/uscode/text/28/2410"
    },
    {
      label: "Texas Property Code 13.001 (effect of not recording)",
      url: TX('PR', '13')
    },
    {
      label: "Texas Tax Code 32.01 and 32.05 (property tax lien and priority)",
      url: TX('TX', '32')
    },
    {
      label: "Texas Property Code 24.004 and 24.005 (eviction court and notice to vacate)",
      url: TX('PR', '24')
    }
  ],
  team: [TEAM.title, TEAM.attorney, TEAM.insurance, TEAM.eviction, TEAM.cpa],
  lastReviewed: "2026-10-05",
  state: 'TX'
},
{
  key: "txreo",
  title: "Texas bank-owned (REO) homes",
  short: "Bank-owned (REO)",
  oneLine: "These are homes a bank, Fannie Mae, Freddie Mac or HUD took back after foreclosure. They are sold through a listing agent with the seller’s own contract terms.",
  youGet: "The home, bought the normal way through a Texas title company. It’s usually as-is, and the seller’s addendum overrides parts of the standard contract.",
  forSale: true,
  glance: [
    {
      label: "Texas contract",
      value: "Texas agents must use TREC’s promulgated forms, like the One to Four Family Residential Contract (Resale), TREC 20-19. But a federal agency’s required form, or a contract the owner’s attorney prepared, can be used instead (22 TAC 537.11). Big REO sellers often do that."
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
      value: "Bids go through a HUD-registered broker. Owner-occupants, government entities and HUD-approved non-profits get the first 15 days (5 days for homes marked “uninsured”) (HUD Mortgagee Letter 2025-13)."
    },
    {
      label: "Seller’s disclosure",
      value: "Texas requires a Seller’s Disclosure Notice when a single-family home is sold (Property Code 5.008(a)). But a lender selling a home it took back in foreclosure, and a government seller like HUD, don’t have to give one (Property Code 5.008(e)). Expect little or no information about condition."
    },
    {
      label: "Condition and option period",
      value: "Usually as-is. Under the TREC contract, you can pay an option fee for a set number of days to back out for any reason (20-19, paragraph 5). Use those days to inspect. Many bank addenda change this. Read yours."
    },
    {
      label: "Title",
      value: "Close through a Texas title company with an owner’s title policy. Texas sets title insurance premiums by rule (TDI). Example: the basic premium on a $250,000 policy is $1,521 under the March 1, 2026 rates. Who pays is negotiated (20-19, paragraph 6A)."
    }
  ],
  steps: [
    {
      title: "Find homes from direct sources",
      detail: "Search HomePath (Fannie Mae), HomeSteps (Freddie Mac) and HUD Home Store. Also search the real estate pages of banks and credit unions that own Texas homes. Avoid paid lists and middlemen."
    },
    {
      title: "Get pre-approved or gather proof of funds",
      detail: "Fannie Mae requires a pre-qualification or proof of funds before it accepts an offer. Expect other sellers to ask for the same. Have it ready before you offer."
    },
    {
      title: "Hire a Texas buyer’s agent who knows REO",
      detail: "HUD requires a HUD-registered broker. HomePath requires your agent to be registered on its site. Your agent also handles the seller’s portal, forms and deadlines."
    },
    {
      title: "Make your offer on the right paperwork",
      detail: "Your agent starts from TREC 20-19 or the seller’s own contract. If you’re getting a loan, add the Third Party Financing Addendum (TREC 40-11). Fannie Mae uses its own contract. It won’t accept an offer that depends on you selling another home or completing a 1031 exchange. HomeSteps requires its own addenda. Owner-occupant buyers sign an occupancy certification.*"
    },
    {
      title: "Read every page of the addendum",
      detail: "The seller’s addendum usually overrides the TREC contract on repairs, disclosures, deadlines, closing costs and penalties for late closing. Ask your agent to explain anything that shifts cost or risk to you. If you use the TREC contract, also ask which box in paragraph 7I applies to the Seller’s Water Disclosure (groundwater and surface water rights). If box 7I(2) is checked (you haven’t received it yet), read it when it comes and note the date: you can end the contract within 7 days after you receive it, or before closing if sooner. If box 1 (already received) or box 3 (not required, because every statement in 7I(3) is true) is checked, there’s no new termination window. Whether a bank’s addendum changes this depends on its wording, so ask.*"
    },
    {
      title: "Inspect during the option period",
      detail: "Under TREC 20-19, you deliver the option fee and earnest money within 3 days after the effective date. Then you can end the contract for any reason before the option period ends. You keep your earnest money but lose the option fee (paragraph 5). Deadlines are strict. Hire an inspector licensed by TREC."
    },
    {
      title: "Get the loan and appraisal approved",
      detail: "Under the Third Party Financing Addendum, you can end the contract if the lender won’t approve you, but only within the days you fill in. You can also end it if the property fails the lender’s appraisal or other requirements, up to 3 days before closing. You need a written statement from the lender either way (TREC 40-11)."
    },
    {
      title: "Review the title commitment",
      detail: "Look for liens the seller hasn’t cleared, HOA dues, deed restrictions and easements. If the home went through a Texas trustee sale, a junior federal tax lien that the sale wiped out still gives the IRS 120 days to redeem after the sale (26 U.S.C. 7425(d)), and one the sale didn’t wipe out stays on title. Ask the title company whether one was on record."
    },
    {
      title: "Close through the title company",
      detail: "Sign, pay through the title company, and get your recorded deed and owner’s title policy. This year’s property taxes are usually split at closing (20-19, paragraph 13). Ask the listing agent whether the home is vacant and who hands over the keys."
    }
  ],
  survives: {
    wipedOut: [
      "Liens the seller pays off or clears at closing (confirm on the final title commitment)",
      "Liens junior to the foreclosed loan, cleared by the foreclosure before the bank took title"
    ],
    mayStay: [
      "Anything listed as an exception in the title commitment",
      "Easements, deed restrictions and HOA dues",
      "Current-year property taxes (split at closing, then adjusted when the bill comes)",
      "A federal tax lien’s 120-day redemption right, if the foreclosure was recent",
      "Defects in the home, since it’s usually sold as-is"
    ]
  },
  mistakes: [
    {
      mistake: "Skipping the seller’s addendum",
      prevent: "Read every page before you sign. It often overrides repair, disclosure and deadline terms in the TREC contract."
    },
    {
      mistake: "Paying the option fee late",
      prevent: "If you don’t deliver the option fee on time, you lose the right to back out for any reason (20-19, paragraph 5D). Pay it within 3 days of the effective date."
    },
    {
      mistake: "Expecting a seller’s disclosure",
      prevent: "Lenders selling foreclosed homes and government sellers are exempt (Property Code 5.008(e)). Your inspection is your main protection."
    },
    {
      mistake: "Investors offering during First Look",
      prevent: "Ask the listing agent how many First Look days are left. HomePath, HomeSteps and HUD consider investor offers only after their exclusive periods."
    },
    {
      mistake: "Signing an owner-occupant certification you won’t keep",
      prevent: "First Look and HUD’s exclusive period are for buyers who will live in the home. Only certify if you will. A false certification can bring legal trouble."
    }
  ],
  example: {
    title: "Illustrative example: a HomeSteps home in a fictional Texas suburb",
    story: "Sam, a made-up first-time buyer, found a Freddie Mac home on day 12 of its First Look period. Sam’s agent sent the offer with a pre-approval letter and the seller’s addenda. Sam paid a $300 option fee for a 7-day option period. The inspection found a cracked sewer line. The addendum said the seller made no repairs. So Sam negotiated a lower price before the option period ended.",
    lesson: "Use the First Look window, send a complete offer, and inspect early. In an as-is sale, your option period is when you can still change the deal."
  },
  sources: [
    {
      label: "TREC: promulgated contract forms",
      url: "https://www.trec.texas.gov/agency-information/contracts"
    },
    {
      label: "TREC 20-19: One to Four Family Residential Contract (Resale)",
      url: "https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale"
    },
    {
      label: "TREC 40-11: Third Party Financing Addendum",
      url: "https://www.trec.texas.gov/forms/third-party-financing-addendum-0"
    },
    {
      label: "22 Tex. Admin. Code 537.11 (when agents must use TREC forms)",
      url: "https://www.trec.texas.gov/node/634"
    },
    {
      label: "Texas Property Code 5.008 (seller’s disclosure and exemptions)",
      url: TX('PR', '5')
    },
    {
      label: "Texas Department of Insurance: title insurance basic premium rates",
      url: "https://www.tdi.texas.gov/title/titlerates2026.html"
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
      label: "26 U.S.C. 7425 (federal tax lien redemption after a nonjudicial sale)",
      url: "https://www.law.cornell.edu/uscode/text/26/7425"
    },
    {
      label: "Every direct bank and government source",
      url: "#/bank-owned"
    }
  ],
  team: [TEAM.agent, TEAM.mortgage, TEAM.title, TEAM.offerInspector, TEAM.insurance],
  lastReviewed: "2026-10-05",
  state: 'TX'
},
{
  key: "txshort",
  title: "Texas short sales",
  short: "Short sales",
  oneLine: "The owner sells for less than the loan balance, and the lender agrees to accept less. Once the lender approves, you buy through the listing agent like a normal sale.",
  youGet: "The home, bought the normal way through a Texas title company, once every lienholder approves its payoff.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "Listed by the owner’s agent as a short sale, subject to lender approval. All contact goes through the listing agent."
    },
    {
      label: "Contract",
      value: "TREC 20-19 with the TREC Short Sale Addendum (45-2). TREC says agents must use the addendum for a short sale. The contract binds you when signed. But neither side has to perform until the lender agrees (45-2, C)."
    },
    {
      label: "Lender’s deadline",
      value: "The addendum has a date. If the seller hasn’t told you the lender agreed by then, the contract ends and your earnest money comes back (45-2, D). If the lender agrees, the effective date for performance moves to the day you’re told (the Amended Effective Date)."
    },
    {
      label: "Option period",
      value: "If you paid for an option period, it starts when you both sign and keeps running while you wait for the lender. When it ends depends on how paragraph 5’s days are counted after the Amended Effective Date* (45-2, F). Have your agent write out the exact dates; an amendment can change them."
    },
    {
      label: "Foreclosure clock",
      value: "For a home, the servicer must give at least 20 days to cure before a notice of sale (Property Code 51.002(d)). The notice of sale goes out at least 21 days before. Sales are held on the first Tuesday of the month at the county’s designated spot (51.002(a), (b))."
    },
    {
      label: "Seller’s disclosure",
      value: "For a single-family home, the owner is usually still the seller, so the Seller’s Disclosure Notice is required (Property Code 5.008). For a duplex to fourplex the law doesn’t require it, but ask for it. If you get it after signing, you can end the contract within 7 days (5.008(f))."
    },
    {
      label: "Deficiency",
      value: "That’s between the seller and the lender. The TREC addendum defines a short sale as one where the lender accepts the proceeds in full satisfaction of the seller’s loan (45-2, A). The seller should ask their own attorney."
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
      title: "Write the offer with the Short Sale Addendum",
      detail: "Your agent uses TREC 20-19 and the Short Sale Addendum (45-2). Pick a lender-approval date that allows for a long review. You still deliver earnest money and any option fee on time (45-2, C)."
    },
    {
      title: "Ask about the foreclosure timeline",
      detail: "Through your agent, ask whether a notice of sale has been filed. In Texas it’s filed with the county clerk and posted on the county’s website (51.002(b), (f-1)). A sale can go ahead on the first Tuesday while the lender is still reviewing."
    },
    {
      title: "Inspect and appraise",
      detail: "Use your option period to inspect, if you bought one. Short sales are often as-is, and the lender won’t pay for repairs. Hire a TREC-licensed inspector."
    },
    {
      title: "Wait for written approval from every lienholder",
      detail: "The addendum applies to each lienholder (45-2, I). A first mortgage, second mortgage, HOA or other lienholder may each want something. The title company can’t close until each lien is paid or released."
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
      "Easements, deed restrictions and other exceptions on the title commitment",
      "Current-year property taxes (split at closing under 20-19, paragraph 13)"
    ]
  },
  mistakes: [
    {
      mistake: "Paying anything outside closing",
      prevent: "All payments go through the title company and are disclosed to the lender. Walk away from any request for a side payment."
    },
    {
      mistake: "Contacting the owner directly",
      prevent: "Work only through the listing agent. Don’t contact the owner or occupants, and don’t advise them about their debt."
    },
    {
      mistake: "Assuming the foreclosure is on hold",
      prevent: "Ask, through your agent, whether a sale is posted for the next first Tuesday. Check the county clerk’s foreclosure notices."
    },
    {
      mistake: "Letting the lender-approval date pass",
      prevent: "If approval runs long, extend the date in writing with a TREC amendment. Otherwise the contract ends on its own (45-2, D)."
    }
  ],
  example: {
    title: "Illustrative example: two lienholders, one sale",
    story: "Jamie, a made-up buyer, offered $310,000 on a short sale in a fictional Texas city. The first lender approved after nine weeks. The second-mortgage holder asked for more to release its lien, which added a month. Jamie’s agent got the lender-approval date extended in writing. The sale closed through the title company.",
    lesson: "Ask early how many liens there are. Expect each one to negotiate. Keep your contract dates extended in writing."
  },
  sources: [
    {
      label: "TREC 45-2: Short Sale Addendum",
      url: "https://www.trec.texas.gov/forms/short-sale-addendum-0"
    },
    {
      label: "TREC 20-19: One to Four Family Residential Contract (Resale)",
      url: "https://www.trec.texas.gov/forms/one-four-family-residential-contract-resale"
    },
    {
      label: "TREC: promulgated contract forms",
      url: "https://www.trec.texas.gov/agency-information/contracts"
    },
    {
      label: "Texas Property Code 51.002 (foreclosure notice and sale)",
      url: TX('PR', '51')
    },
    {
      label: "Texas Property Code 51.003 to 51.005 (deficiency after foreclosure)",
      url: TX('PR', '51')
    },
    {
      label: "Texas Property Code 5.008 (seller’s disclosure notice)",
      url: TX('PR', '5')
    },
    {
      label: "TREC: Seller’s Disclosure Notice form",
      url: "https://www.trec.texas.gov/forms/sellers-disclosure-notice"
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
  lastReviewed: "2026-10-05",
  state: 'TX'
},
{
  key: "txcommercial",
  title: "Texas commercial property",
  short: "Commercial property",
  oneLine: "Stores, offices, industrial buildings, apartments with 5+ units and commercial land. They are sold at Texas tax, trustee, sheriff and IRS sales, or by banks and government sellers.",
  youGet: "The same kind of deed you’d get buying a home the same way. But home-buyer programs don’t apply, and the property often comes with tenants, leases, deed restrictions and environmental history.",
  forSale: true,
  glance: [
    {
      label: "How it’s sold",
      value: "The same channels as homes: county tax sales, trustee sales, sheriff sales, IRS sales, court-appointed receivers, and bank or government sellers. Read the matching Texas guide for each."
    },
    {
      label: "Contract",
      value: "TREC doesn’t promulgate forms for commercial property. Use a contract prepared by a Texas attorney or a trade association working with one. Have your agent confirm the form meets the applicable requirements (TREC; 22 TAC 537.11)."
    },
    {
      label: "Property tax",
      value: "The appraisal district values property at market value as of January 1 (Tax Code 23.01). Protest by May 15 or 30 days after your notice, whichever is later (41.44). Land appraised as open-space (1-d-1) can owe up to 3 years of extra tax when its use changes (23.55); land under the 1-d agricultural designation has its own rule (23.46). Ask the appraisal district.*"
    },
    {
      label: "State taxes",
      value: "Texas has no personal income tax (Texas Constitution art. 8, sec. 24-a). But LLCs, corporations and most partnerships owe franchise tax. For 2026 reports, no tax is due at or under $2.65 million in revenue (Comptroller). Rental income doesn’t count as passive (Tax Code 171.0003)."
    },
    {
      label: "Buying a business",
      value: "If you buy a business or its inventory, withhold enough to cover the seller’s state taxes, or get a Certificate of No Tax Due first. Otherwise you can owe them, up to the price (Tax Code 111.020)."
    },
    {
      label: "Zoning",
      value: "Example to confirm: Houston has no zoning. The city can sue to enforce recorded deed restrictions instead (Local Government Code 212.151, 212.153; City of Houston). Other cities have zoning. Check with the city."
    },
    {
      label: "Environmental",
      value: "A Phase I environmental site assessment (ASTM E1527-21) can protect you from having to pay for a federal cleanup, if you also meet the law’s other conditions.* Have it completed (or updated) within one year before you take title, with key parts done or updated within 180 days."
    }
  ],
  steps: [
    {
      title: "Pin down what you’re buying",
      detail: "Use the appraisal district’s record for land use, building size and year built. Use the county clerk’s records for the legal description, easements, deed restrictions and recorded leases. Use the plat to find the parcel and spot questions. The title company confirms legal access from recorded easements, and a survey confirms boundaries."
    },
    {
      title: "Get the rent roll and leases, if you can",
      detail: "A receiver or listing broker can usually provide them. At a tax, trustee or sheriff’s sale you often can’t get them. Until you can confirm the leases, count the rent as zero, but don’t assume the building is legally empty or that you can move in right away: tenants may have rights."
    },
    {
      title: "Value it the right way",
      detail: "For a rental building, divide net operating income by the cap rate. Ask a local commercial broker or appraiser for current cap rates. Budget property tax on full market value. A commercial building gets no homestead exemption."
    },
    {
      title: "Order a title search and owner’s policy",
      detail: "Commercial parcels often carry easements, deed restrictions, mechanic’s liens and recorded leases. Property tax liens attach every January 1 and outrank most liens (Tax Code 32.01, 32.05). Texas sets title premiums by rule. Example: the basic premium on a $900,000 policy is $4,732 (TDI, March 1, 2026 rates)."
    },
    {
      title: "Check zoning or deed restrictions",
      detail: "Ask the city planning department whether your planned use is allowed. In a city without zoning, like Houston, read the recorded deed restrictions. They can limit use and setbacks, and the city can enforce them (LGC 212.153)."
    },
    {
      title: "Screen for contamination",
      detail: "Check EPA records for the address. Ask what the property was used for. Gas stations, dry cleaners and auto shops are high risk. Order a Phase I assessment before you’re committed: during the contract’s feasibility period in a negotiated purchase, or before you bid at an auction. Without it you can lose the federal protection from cleanup costs, so if you can’t get one in time, count that risk in whether to buy at all. Ask your consultant to check TCEQ records too."
    },
    {
      title: "If a business comes with it, clear the seller’s taxes",
      detail: "Buying the business, its inventory or its name? The seller and you jointly request a Certificate of No Tax Due (Form 86-114) before closing. Without it, you can owe the seller’s unpaid state taxes up to the price (Tax Code 111.020; Comptroller)."
    },
    {
      title: "Line up your money and your contract",
      detail: "Auctions need cash on the trustee’s or sheriff’s terms; a later refinance is a plan, not a promise, because the building must appraise and lease up first. For a negotiated purchase, have a Texas attorney prepare or review the contract, and schedule the inspections, Phase I and lease review inside its feasibility period, before your earnest money becomes non-refundable."
    },
    {
      title: "Take over well",
      detail: "Insure it from the day it’s your risk, for how it’s actually used and occupied (a vacant building needs different coverage than a leased one), and secure the building. Tell tenants in writing where to pay rent. Ask each tenant to sign an estoppel certificate confirming their lease. If you disagree with the appraisal district’s value, protest on time (41.44)."
    }
  ],
  survives: {
    wipedOut: [
      "At a trustee or sheriff’s sale: liens recorded after the lien being foreclosed, if the sale was valid",
      "Leases signed after that lien, unless the lender agreed to keep them (non-disturbance agreement).* Confirm with an attorney",
      "In a negotiated purchase: liens the seller pays off at closing (confirm on the title commitment)"
    ],
    mayStay: [
      "Property taxes (they attach every January 1 and outrank most liens)",
      "Liens recorded before the lien being foreclosed",
      "Extra tax for past years if open-space (1-d-1) land changes use (Tax Code 23.55); land under the 1-d agricultural designation has its own rule (23.46). Ask the appraisal district.*",
      "The seller’s unpaid state taxes, if you bought the business without a Certificate of No Tax Due (Tax Code 111.020)",
      "Responsibility for environmental cleanup. It can follow whoever owns the property, not the lien*",
      "Easements, deed restrictions and recorded leases ahead of the foreclosed lien",
      "A redemption right after a Texas tax sale (Tax Code 34.21) or an IRS sale (180 days)"
    ]
  },
  mistakes: [
    {
      mistake: "Valuing it like a house",
      prevent: "Use income and cap rate. A vacant building is worth its value once leased, minus lost rent, leasing commissions and tenant improvements."
    },
    {
      mistake: "Using a home contract",
      prevent: "TREC forms are for homes, condos, farms and lots. Have a Texas attorney prepare or review the commercial contract."
    },
    {
      mistake: "Skipping the Certificate of No Tax Due",
      prevent: "If a business, its inventory or its name comes with the building, request the certificate before closing. The Comptroller can review for up to 60 to 90 days (Tax Code 111.020(c))."
    },
    {
      mistake: "Assuming no zoning means no rules",
      prevent: "In Houston, recorded deed restrictions can still limit use, and the city can sue to enforce them. Read them before you buy."
    },
    {
      mistake: "Skipping the environmental check",
      prevent: "Past uses can mean cleanup costs bigger than the price. Check EPA and TCEQ records. Get a Phase I assessment."
    }
  ],
  example: {
    title: "Illustrative example: a small shop building in a fictional Texas city",
    story: "Taylor, a made-up investor, bought a two-unit shop building from a bank for $650,000. Taylor’s Phase I found an old fuel tank on the lot. The bank agreed to remove it before closing. Taylor’s title search showed a recorded deed restriction allowing only retail and office use. Taylor also had both tenants sign estoppel certificates at closing. One tenant’s lease turned out to end in four months.",
    lesson: "Check past uses and recorded restrictions. Budget Texas property tax on full value. Confirm every lease in writing before you count on the rent."
  },
  sources: [
    {
      label: "TREC: contract forms (no promulgated commercial forms)",
      url: "https://www.trec.texas.gov/agency-information/contracts"
    },
    {
      label: "22 Tex. Admin. Code 537.11 (use of forms)",
      url: "https://www.trec.texas.gov/node/634"
    },
    {
      label: "Texas Tax Code 23.01, 23.46 and 23.55 (market value; extra tax on ag and open-space land)",
      url: TX('TX', '23')
    },
    {
      label: "Texas Tax Code 41.44 (protest deadline)",
      url: TX('TX', '41')
    },
    {
      label: "Texas Tax Code 32.01 and 32.05 (property tax lien and priority)",
      url: TX('TX', '32')
    },
    {
      label: "Texas Tax Code 34.21 (redemption after a tax sale)",
      url: TX('TX', '34')
    },
    {
      label: "Texas Tax Code 111.020 (buying a business: withholding)",
      url: TX('TX', '111')
    },
    {
      label: "Texas Tax Code 171.0002 and 171.0003 (franchise tax entities)",
      url: TX('TX', '171')
    },
    {
      label: "Texas Constitution art. 8, sec. 24-a (no personal income tax)",
      url: "https://tcss.legis.texas.gov/resources/CN/htm/CN.8.htm"
    },
    {
      label: "Texas Comptroller: franchise tax rates and thresholds",
      url: "https://comptroller.texas.gov/taxes/franchise/"
    },
    {
      label: "Texas Comptroller: buying an existing business",
      url: "https://comptroller.texas.gov/taxes/publications/98-117.php"
    },
    {
      label: "Texas Local Government Code 212.151 to 212.155 (city enforcement of deed restrictions)",
      url: TX('LG', '212')
    },
    {
      label: "City of Houston Legal Department: deed restrictions FAQ",
      url: "https://www.houstontx.gov/legal/dr-faq.html"
    },
    {
      label: "Texas Department of Insurance: title insurance basic premium rates",
      url: "https://www.tdi.texas.gov/title/titlerates2026.html"
    },
    {
      label: "Texas Commission on Environmental Quality",
      url: "https://www.tceq.texas.gov/"
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
  lastReviewed: "2026-10-05",
  state: 'TX'
}
];

/*
 * NOT VERIFIED FROM A PRIMARY SOURCE (or verified with caveats). Confirm before publishing:
 *
 * 1. The task brief named the resale contract "form 20-18". TREC's site shows the current form is 20-19
 *    (effective 07/01/2026); the guides cite 20-19. The Third Party Financing Addendum is 40-11 (eff. 01/03/2025),
 *    and the Short Sale Addendum is 45-2 (eff. 04/01/2021). TREC's own form page says 45-2 "must be used" for a
 *    short sale; that is TREC's description, not a quoted rule.
 * 2. Statute pages were read from the Legislature's raw files at tcss.legis.texas.gov/resources/...; the cited
 *    statutes.capitol.texas.gov/Docs/... URLs are the public viewer for the same files (a JavaScript app that curl
 *    can't render). Click-test the cited URLs.
 * 3. Texas REALTORS commercial contract forms: TREC confirms it does not promulgate commercial forms and points to
 *    attorneys or trade associations, but I did not verify the Texas REALTORS forms themselves (members-only).
 * 4. Fannie Mae HomePath: the homepath.fanniemae.com home page is a JavaScript app; only the Offer Tips PDF was read.
 *    Fannie Mae's 30-day First Look matches src/lib/reoSources.ts and the Nevada REO guide.
 * 5. homesteps.com/homebuyer/making-an-offer fetched, but its offer details render by JavaScript, so HomeSteps'
 *    addenda, earnest-money and pre-approval rules were not verified. The guide keeps only "HomeSteps requires its
 *    own addenda" (unverified) and "Owner-occupant buyers sign an occupancy certification" (unverified).
 *    First Look (30 days, investors after) IS verified on the First Look page.
 * 6. Whether an IRS certificate holder may collect rent, evict or occupy during the 180 days: not addressed in the
 *    statutes (same as the Utah guide).
 * 7. Houston: "Houston has no zoning" and city enforcement of deed restrictions are verified (City Legal Dept FAQ,
 *    LGC 212.151/212.153). Which restriction types Houston actually enforces (a search summary mentioned City Code
 *    10-553: use, setbacks, single-family) was NOT verified, so the guide doesn't list them.
 * 8. Phase I timing (one year, key parts within 180 days) and ASTM E1527-21 are carried over from the existing
 *    TEAM/Utah text and the EPA AAI page; not re-read for this draft.
 * 9. Tenant protections after foreclosure: Property Code 24.005(b) (30 days for a residential tenant current on rent
 *    under a lease junior to the foreclosed lien) and the federal Protecting Tenants at Foreclosure Act (90 days;
 *    revived by Pub. L. 115-174 sec. 304) were verified but are not used in these four guides. The 3-day notice to
 *    vacate (24.005) is cited. Note: SB 38 (2025) repealed parts of 24.005 (f)-(i); the text read is current.
 * 10. Resolved (round 10): the guide now cites 23.55 (3 years of extra tax) only for open-space (1-d-1) land and
 *     points 1-d agricultural-designation land to its own rule (23.46), both read on tcss.legis.texas.gov on
 *     2026-10-07. Property Code 5.010's notice still says "additional tax plus interest"; the asterisk stays.
 * 11. "Rental income doesn't count as passive" (Tax Code 171.0003(b)) applies to partnerships and trusts that
 *     might otherwise qualify as passive entities; whether a given owner owes franchise tax needs a CPA.
 * 12. Title premium examples ($1,521 on $250,000; $4,732 on $900,000) are my arithmetic from the TDI chart effective
 *     March 1, 2026; they are basic premiums only and exclude endorsements and simultaneous-issue charges.
 * 13. The Comptroller's 60-day / 90-day review window comes from Tax Code 111.020(c); the joint Form 86-114
 *     requirement comes from the Comptroller page 98-117 (citing SB 873, 2021), not from the statute text.
 * 14. Commissioners courts may designate a sale location other than the courthouse (51.002(h)); "the county's
 *     designated spot" is a summary. Notice posting on the county website is 51.002(f-1).
 */
