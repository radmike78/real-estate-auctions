import type { Lesson } from './types';

export const analyze: Lesson = {
  key: 'analyze',
  minutes: 9,
  intro: 'A deal is made or lost on the numbers and the paperwork. This lesson walks through what a property is worth, what it will cost you, what it can earn, and what to check before you commit.',
  takeaways: [
    'How value is set: comparable sales, appraisals and income.',
    'The costs buyers forget: closing, holding, repairs and selling.',
    'The core measures: NOI, cash flow, cap rate, cash-on-cash return and gross rent multiplier.',
    'The checks to make before you buy, including Nevada and California disclosure deadlines.',
  ],
  sections: [
    {
      heading: 'Start with value',
      blocks: [
        'An appraisal is a written opinion of what a property is worth. For a home, appraisers compare it with similar homes that sold nearby: Fannie Mae requires at least three closed comparable sales, usually from the last 12 months. You can do a rough version yourself with recent sold prices, as long as the homes really are similar in size, age, condition and location.',
        'Investors who plan to fix a property estimate its value after the work is done, often called the after-repair value (ARV). That number is only as good as the comparable sales behind it, so use sold prices of homes already in that finished condition, not asking prices.',
        'For income property, value comes from the income, as in lesson 1: net operating income divided by the cap rate buyers expect.',
      ],
    },
    {
      heading: 'Count every cost',
      blocks: [
        { list: [
          'Buying: closing costs typically run 2% to 5% of the price for a home buyer, not counting the down payment. Forced sales can add their own costs, like auction deposits or fees.',
          'Repairs: get a contractor’s estimate, and add a cushion for what you can’t see.',
          'Holding: loan payments, property taxes, insurance, HOA dues, utilities and upkeep for every month you own it, including months it’s empty.',
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
              ['Net operating income (NOI)', 'Gross rent, minus vacancy and credit loss, minus operating expenses. Loan payments and depreciation are left out.', 'What the property earns on its own, whoever owns it or however it’s financed.'],
              ['Cash flow', 'Rent minus operating costs minus the loan payment.', 'What you actually keep each month or year.'],
              ['Cap rate', 'NOI ÷ price (or value).', 'The return before financing. Compare with similar properties nearby.'],
              ['Cash-on-cash return', 'A year’s cash flow before taxes ÷ all the cash you put in (down payment, closing costs, repairs).', 'The return on your own money, after the loan.'],
              ['Gross rent multiplier (GRM)', 'Price ÷ gross yearly rent.', 'A quick screen: lower usually means more rent for the price. It ignores expenses.'],
            ],
          },
        },
        'Example: a rental costs $300,000 and rents for $2,400 a month ($28,800 a year). With 5% vacancy ($1,440) and $9,000 of yearly expenses, NOI is $18,360, a 6.1% cap rate. If the loan payments are $14,000 a year, cash flow is $4,360. If you put in $80,000 in cash, the cash-on-cash return is about 5.5%. The GRM is about 10.4.',
      ],
    },
    {
      heading: 'Rules of thumb, and their limits',
      blocks: [
        'Flippers often quote a “70% rule”: offer no more than 70% of the after-repair value, minus repairs. It’s an informal shortcut, not a standard, and it doesn’t fit every market or price range. Use it to screen deals, then run your own numbers with real costs. For auctions, set your maximum bid before the sale and don’t go past it.',
      ],
    },
    {
      heading: 'Check before you commit',
      blocks: [
        { list: [
          'Title: a title search shows who owns the property and what liens are recorded. Owner’s title insurance protects you if someone later claims an interest from before you bought it. Lenders usually require their own policy.',
          'Condition: a home inspection is different from an appraisal, and you generally need both. At an auction you often can’t go inside, so look from the street and budget for surprises.',
          'Lead paint: for homes built before 1978, sellers must give buyers a lead hazard pamphlet and a 10-day chance to test for lead-based paint, which buyers can waive.',
          'Flood risk: check the property on FEMA’s Flood Map Service Center, the official source for flood zones.',
          'Taxes: look up the property tax bill and any unpaid taxes with the county assessor and treasurer.',
        ] },
      ],
    },
    {
      heading: 'Disclosures in Nevada and California',
      blocks: [
        {
          table: {
            head: ['', 'Nevada', 'California'],
            rows: [
              ['Seller’s disclosure', 'At least 10 days before a home is conveyed, the seller must complete and deliver a disclosure form (NRS 113.130). Sellers don’t have to disclose defects they don’t know about. If it comes late, the buyer can cancel before closing without penalty.', 'The seller delivers a Transfer Disclosure Statement as soon as practicable before title transfers (Civil Code 1102.3). If it arrives after the offer is signed, the buyer has 3 days after hand delivery, or 5 days by mail or electronically, to cancel.'],
              ['HOA documents', 'The owner provides a resale package (governing documents, dues, budget, reserves, lawsuits, fees). The buyer can cancel in writing until midnight of the fifth day after receiving it (NRS 116.4109).', 'The owner provides governing documents, financial and reserve disclosures, assessments, violation notices and rental limits before transfer (Civil Code 4525).'],
              ['Forced sales', 'Auctions and bank sales usually come as-is. Check each guide for what applies.', 'Foreclosure sales, court-ordered sales and many resales by the foreclosing lender are exempt from the Transfer Disclosure Statement (Civil Code 1102.2).'],
            ],
          },
        },
        'Arizona and Utah have their own disclosure rules; we’ll add them. Until then, ask a local agent or real estate attorney.',
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
  ],
  reviewed: '2026-09-29',
};
