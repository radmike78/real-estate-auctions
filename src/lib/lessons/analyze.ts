import type { Lesson } from './types';

export const analyze: Lesson = {
  key: 'analyze',
  minutes: 9,
  intro: 'A deal is made or lost on the numbers and the paperwork. This lesson shows you what a property is worth and what it will cost you. It also covers what it can earn and what to check before you commit.',
  takeaways: [
    'How value is set: comparable sales, appraisals and income.',
    'The costs buyers forget: closing, holding, repairs and selling.',
    'The core measures: NOI, cash flow, cap rate, cash-on-cash return and gross rent multiplier.',
    'The checks to make before you buy, including seller and HOA disclosure deadlines.',
  ],
  sections: [
    {
      heading: 'Start with value',
      blocks: [
        'An appraisal is a written opinion of what a property is worth. For a home, appraisers compare it with similar homes that sold nearby. Fannie Mae requires at least three closed comparable sales, usually from the last 12 months. You can do a rough version yourself with recent sold prices. It only works if the homes really are similar in size, age, condition and location.',
        'Your own estimate is only a starting point. Value depends on the neighborhood, recent comparable sales, the property’s condition and the market. The best way to determine what a property is worth is a professional appraisal by a state-licensed or certified appraiser. Until you have one, your real estate agent can estimate the value from recent comparable sales.',
        'Upgrades don’t add their cost to the value. A remodel can make a home more appealing. But appraisers value a feature by what buyers in that market pay for it, not by what it cost. Fannie Mae says adjustments must reflect how the market reacts, not the cost of equipment and installation dollar for dollar. Some improvements are bigger or cost more than is typical for the neighborhood, like a pool where pools are rare. Those count only for what they add. Real estate agents estimated in 2025 that a complete kitchen renovation gets back about 60% of its cost at resale. For a bathroom renovation, they estimated about 50%.',
        { links: [{ label: 'Appraisers', url: '#/pros/appraiser', what: 'What they do, when to hire one and how to check a license.' }, { label: 'Real estate agents', url: '#/pros/agent', what: 'How an agent helps you estimate value and make an offer.' }] },
        'Investors who plan to fix a property estimate its value after the work is done. This is often called the after-repair value (ARV). That number is only as good as the comparable sales behind it. So use sold prices of homes already in that finished condition, not asking prices.',
        'For income property, value comes from the income, as in lesson 1: net operating income divided by the cap rate buyers expect.',
      ],
    },
    {
      heading: 'Count every cost',
      blocks: [
        { list: [
          'Buying: closing costs usually run 2% to 5% of the price for a home buyer, not counting the down payment. Forced sales can add their own costs, like auction deposits or fees.',
          'Repairs: get a contractor’s estimate, and add a cushion for what you can’t see.',
          'Holding: loan payments, property taxes, insurance, HOA dues, utilities and upkeep. Count each month you own it, even months it’s empty.',
          'Operating (for a rental): taxes, insurance, HOA dues, repairs and maintenance, vacancy, and property management if you hire it.',
          'Selling: agent commissions, closing costs and any concessions to the buyer.',
        ] },
      ],
    },
    {
      heading: 'The core measures',
      blocks: [
        {
          table: {
            head: ['Measure', 'How to figure it', 'What it tells you'],
            rows: [
              ['Net operating income (NOI)', 'Gross rent, minus vacancy and credit loss, minus operating expenses. Leave out loan payments and depreciation.', 'What the property earns on its own, no matter who owns it or how it’s paid for.'],
              ['Cash flow', 'NOI, minus reserves you set aside for big replacements like the roof and HVAC, minus the loan payment (debt service).', 'What you really keep each month or year.'],
              ['Cap rate', 'NOI ÷ price (or value).', 'The return before financing. Compare with similar properties nearby.'],
              ['Cash-on-cash return', 'A year’s cash flow before taxes ÷ all the cash you put in (down payment, closing costs, repairs).', 'The return on your own money, after the loan.'],
              ['Gross rent multiplier (GRM)', 'Price ÷ gross yearly rent.', 'A quick screen: lower usually means more rent for the price. It ignores expenses.'],
            ],
          },
        },
        'Example: a rental costs $300,000 and rents for $2,400 a month ($28,800 a year). Vacancy is 5% ($1,440), and yearly expenses are $9,000. That makes NOI $18,360, a 6.1% cap rate. Say you set aside $1,400 a year for big replacements, and the loan payments are $14,000 a year. Then cash flow is $2,960. If you put in $80,000 in cash, the cash-on-cash return is about 3.7%. The GRM is about 10.4.',
      ],
    },
    {
      heading: 'Rules of thumb, and their limits',
      blocks: [
        'Flippers often quote a “70% rule”: offer no more than 70% of the after-repair value, minus repairs. It’s an informal shortcut, not a standard. It doesn’t fit every market or price range. Use it to screen deals, then run your own numbers with real costs. For auctions, set your top bid before the sale and don’t go past it.',
      ],
    },
    {
      heading: 'Check before you commit',
      blocks: [
        { list: [
          'Title: a title search shows who owns the property and what liens are recorded. Owner’s title insurance protects you if someone later claims an interest from before you bought it. Lenders usually require their own policy.',
          'Condition: a home inspection is not the same as an appraisal, and you usually need both. At an auction you often can’t go inside, so look from the street and budget for surprises.',
          'Lead paint: for homes built before 1978, sellers must give buyers a lead hazard pamphlet. Sellers must also give buyers a 10-day chance to test for lead-based paint. Buyers can waive that chance.',
          'Flood risk: check the property on FEMA’s Flood Map Service Center, the official source for flood zones.',
          'Taxes: look up the property tax bill and any unpaid taxes with the county assessor and treasurer.',
        ] },
      ],
    },
    {
      heading: 'Seller and HOA disclosures',
      blocks: [
        {
          table: {
            head: ['', 'Nevada', 'California', 'Arizona', 'Utah'],
            rows: [
              [
                'Seller’s disclosure',
                'At least 10 days before a home is conveyed, the seller must complete and deliver a disclosure form (NRS 113.130). Sellers don’t have to disclose defects they don’t know about. If it comes late, the buyer can cancel before closing without penalty.',
                'The seller delivers a Transfer Disclosure Statement as soon as practicable before title transfers (Civil Code 1102.3). It may arrive after the offer is signed. Then the buyer has 3 days to cancel after hand delivery, or 5 days if it came by mail or electronically.',
                'State law requires certain disclosures. One example is soil remediation the owner knows about (A.R.S. 33-434.01). State law also requires an affidavit of disclosure for unsubdivided land outside cities. It’s due at least 7 days before transfer, with 5 days to cancel (A.R.S. 33-422). Ask your agent which disclosure form your contract uses.',
                'The state-approved purchase contract has the seller give a written property condition disclosure by the Seller Disclosure Deadline. The buyer can cancel by the Due Diligence Deadline. Sellers must disclose methamphetamine contamination they know about (Utah Code 57-27-201).',
              ],
              [
                'HOA documents',
                'The owner gives a resale package (governing documents, dues, budget, reserves, lawsuits, fees). The buyer can cancel in writing until midnight of the fifth day after receiving it (NRS 116.4109).',
                'The owner gives governing documents, financial and reserve disclosures, assessments, violation notices and rental limits before transfer (Civil Code 4525).',
                'The association delivers its documents (rules, budget, reserves, insurance, lawsuits) within 10 days. The 10 days start after notice of a pending offer. In smaller communities, they start after the offer is accepted. Its fee can’t be more than $400, plus up to $100 for a rush (A.R.S. 33-1260 and 33-1806).',
                'Before closing, the seller gives the buyer the association’s recorded governing documents (Utah Code 57-8a-105.1 and 57-8-6.1). A payoff fee can’t exceed $50.',
              ],
              [
                'Forced sales',
                'Auctions and bank sales usually come as-is. Check each guide for what applies.',
                'Foreclosure sales, court-ordered sales and many resales by the foreclosing lender are exempt from the Transfer Disclosure Statement (Civil Code 1102.2).',
                'Auctions and bank sales usually come as-is. Read the sale’s terms.',
                'Auctions and bank sales usually come as-is. Read the sale’s terms.',
              ],
            ],
          },
        },
        'In Arizona, sellers and agents can’t be sued for not disclosing certain facts (A.R.S. 32-2156). These facts are that a home was the site of a death or felony, or was lived in by someone with HIV. They also include that a home is near a sex offender.',
        'In Utah, sellers and their agents aren’t liable for not disclosing certain facts (Utah Code 57-1-37). These facts are that a home was the site of a homicide, suicide or other felony. They also include that a home was lived in by someone with HIV.',
      ],
    },
  ],
  terms: [
    { term: 'Comparable sale (comp)', meaning: 'A recent sale of a similar property nearby, used to estimate value.' },
    { term: 'After-repair value (ARV)', meaning: 'What a property should sell for once the planned work is done.' },
    { term: 'Cash-on-cash return', meaning: 'A year’s pre-tax cash flow divided by the cash you invested.' },
    { term: 'Gross rent multiplier (GRM)', meaning: 'Price divided by gross yearly rent.' },
    { term: 'Title insurance', meaning: 'Insurance against claims on the property that existed before you bought it.' },
    { term: 'Resale package', meaning: 'Nevada’s bundle of HOA documents a condo or HOA home seller gives the buyer.' },
  ],
  tryIt: { label: 'Run your numbers in the deal calculator', href: '#/analyze' },
  sources: [
    { label: 'CFPB: what are appraisals and why do I need to look at them?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-are-appraisals-and-why-do-i-need-to-look-at-them-en-167/' },
    { label: 'Fannie Mae Selling Guide: comparable sales (B4-1.3-08)', url: 'https://selling-guide.fanniemae.com/sel/b4-1.3-08/comparable-sales' },
    { label: 'Fannie Mae Selling Guide: adjustments to comparable sales (B4-1.3-09)', url: 'https://selling-guide.fanniemae.com/sel/b4-1.3-09/adjustments-comparable-sales' },
    { label: 'Fannie Mae Selling Guide: over-improvements (B4-1.3-03)', url: 'https://selling-guide.fanniemae.com/sel/b4-1.3-03/neighborhood-section-appraisal-report' },
    { label: 'Fannie Mae Selling Guide: improvements section of the appraisal report (B4-1.3-05)', url: 'https://selling-guide.fanniemae.com/sel/b4-1.3-05/improvements-section-appraisal-report' },
    { label: 'NAR: 2025 Remodeling Impact Report', url: 'https://cms.nar.realtor/sites/default/files/2025-04/2025-remodeling-impact-report_04-09-2025.pdf' },
    { label: 'University of San Diego: how to analyze real estate investments', url: 'https://pce.sandiego.edu/real-estate-investment-property-analysis/' },
    { label: 'NYU Stern (Damodaran): estimating value with cap rates', url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/articles/caprate.htm' },
    { label: 'CFPB: figure out how much you want to spend', url: 'https://www.consumerfinance.gov/owning-a-home/prepare/figure-out-how-much-you-want-to-spend/' },
    { label: 'CFPB: what is owner’s title insurance?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-owners-title-insurance-en-164/' },
    { label: 'CFPB: schedule a home inspection', url: 'https://www.consumerfinance.gov/owning-a-home/close/schedule-a-home-inspection/' },
    { label: 'EPA: real estate disclosures about lead hazards', url: 'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards' },
    { label: 'FEMA Flood Map Service Center', url: 'https://msc.fema.gov/portal/home' },
    { label: 'NRS 113: residential property disclosures', url: 'https://www.leg.state.nv.us/NRS/NRS-113.html' },
    { label: 'NRS 116: common-interest communities (resale package, 116.4109)', url: 'https://www.leg.state.nv.us/NRS/NRS-116.html' },
    { label: 'California Civil Code 1102.3: delivering the Transfer Disclosure Statement', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.3' },
    { label: 'California Civil Code 1102.2: sales exempt from the disclosure statement', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.2' },
    { label: 'California Civil Code 4525: HOA documents for buyers', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4525' },
    { label: 'Arizona Revised Statutes 33-422: affidavit of disclosure for unsubdivided land', url: 'https://www.azleg.gov/ars/33/00422.htm' },
    { label: 'Arizona Revised Statutes 33-434.01: seller’s duty to disclose soil remediation', url: 'https://www.azleg.gov/ars/33/00434-01.htm' },
    { label: 'Arizona Revised Statutes 32-2156: facts sellers needn’t disclose', url: 'https://www.azleg.gov/ars/32/02156.htm' },
    { label: 'Arizona Revised Statutes 33-1260: condominium resale disclosure', url: 'https://www.azleg.gov/ars/33/01260.htm' },
    { label: 'Arizona Revised Statutes 33-1806: planned community resale disclosure', url: 'https://www.azleg.gov/ars/33/01806.htm' },
    { label: 'Utah Division of Real Estate: state-approved Real Estate Purchase Contract', url: 'https://commerce.utah.gov/realestate/wp-content/uploads/2023/03/purchase-contract.pdf' },
    { label: 'Utah Code 57-27-201: methamphetamine contamination disclosure', url: 'https://le.utah.gov/xcode/Title57/Chapter27/57-27-S201.html' },
    { label: 'Utah Code 57-1-37: stigmatized property', url: 'https://le.utah.gov/xcode/Title57/Chapter1/57-1-S37.html' },
    { label: 'Utah Code 57-8a-105.1: HOA documents before closing', url: 'https://le.utah.gov/xcode/Title57/Chapter8A/57-8a-S105.1.html' },
    { label: 'Utah Code 57-8a-106: HOA payoff fee', url: 'https://le.utah.gov/xcode/Title57/Chapter8A/57-8a-S106.html' },
  ],
  practice: 'Take one real listing and write down where each number comes from: rented comparables, the county’s tax bill, an insurance quote. Mark every number you guessed.',
  reviewed: '2026-09-29',
};
