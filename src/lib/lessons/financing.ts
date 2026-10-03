import type { Lesson } from './types';

export const financing: Lesson = {
  key: 'financing',
  minutes: 9,
  intro: 'Most real estate is bought with borrowed money. The loan you can get depends on a few things. Will you live in the property? How many units does it have? Is it a home or a business property? Here are the main kinds and what each asks of you.',
  takeaways: [
    'Why living in the property opens the lowest down payments.',
    'What lenders ask of investors: larger down payments, savings in reserve and a limit on financed properties.',
    'How FHA, VA and renovation loans work.',
    'How commercial, SBA and short-term loans differ.',
    'How one purchase compares across seven ways to pay for it.',
    'What to check before you sign.',
  ],
  sections: [
    {
      heading: 'Loans for a home you’ll live in',
      blocks: [
        {
          table: {
            head: ['Loan', 'Down payment', 'What to know'],
            rows: [
              ['FHA', 'As low as 3.5% with a credit score of 580 or higher. With a score of 500 to 579, it’s 10%.', 'Your main home, one to four units. Mortgage insurance has an upfront cost at closing and a monthly cost.'],
              ['VA', 'None, as long as the price isn’t above the appraised value.', 'For eligible veterans and service members who will live in the home. Can buy up to four units.'],
              ['Conventional', 'Varies by lender and program.', 'If you put down less than 20%, you’ll usually pay private mortgage insurance (PMI). It protects the lender, not you.'],
              ['FHA 203(k)', 'FHA terms.', 'Adds repair costs to the loan: up to $75,000 for smaller jobs (Limited 203(k)), or larger projects of at least $5,000 (Standard 203(k)).'],
            ],
          },
        },
        'You can use these loans to start investing. Buy a two-to-four-unit home, live in one unit and rent the others.',
      ],
    },
    {
      heading: 'Loans for investment property',
      blocks: [
        'An investment property is one you own but don’t live in. FHA and VA loans require you to live in the home, so expect to put more money down. On Fannie Mae loans, lenders also look for:',
        { list: [
          'Savings in reserve: generally six months of payments for an investment property or a two-to-four-unit home you live in.',
          'A limit of 10 financed properties when the new loan is for a second home or investment property.',
          'Rent to help you qualify: usually 75% of the gross rent counts. Positive rental income counts only if you have at least 12 months of experience managing property.',
        ] },
        'Rules change, and lenders can add their own. Ask a licensed loan officer for current requirements.',
      ],
    },
    {
      heading: 'Commercial and business loans',
      blocks: [
        'Commercial loans are sized on the property’s income. Lenders use the debt service coverage ratio (NOI divided by the year’s loan payments). Many don’t pay off over their term. Instead they end with a balloon payment, which you may need to refinance. If values fall, that can be hard.',
        'Some commercial loans are nonrecourse: the lender can only take the property, not your other assets. They usually have “carve-outs” that make you personally liable in certain cases, so read them.',
        { list: [
          'SBA 7(a): up to $5 million; can be used to buy, refinance or improve real estate for your business.',
          'SBA 504: up to $5.5 million for buildings and land your business uses. It can’t be used to invest in rental real estate.',
          'Bridge loans: short-term loans that carry a property until it’s stable enough to sell or refinance.',
        ] },
      ],
    },
    {
      heading: 'Private and hard-money lenders',
      blocks: [
        'Private lenders and hard-money lenders make loans secured by the property, often short-term. People use them for projects like flips when a bank loan doesn’t fit. Terms vary widely. Compare the rate, points, fees, term, and what happens if you can’t repay on time. Get every term in writing.',
        'In Nevada, mortgage companies and the private investors who fund loans fall under NRS 645B.',
        'In California, finance lenders and brokers are licensed under the California Financing Law.',
        'Wherever you are, check any lender’s license on NMLS Consumer Access, the free national lookup.',
      ],
    },
    {
      heading: 'Using equity you already have',
      blocks: [
        'A home equity line of credit (HELOC) lets you borrow repeatedly against your home’s equity. A cash-out refinance replaces your mortgage with a bigger one and pays you the difference, usually with closing costs. Both put your home on the line: if you can’t repay, you could lose it.',
        'Don’t use home equity, credit cards or a 401(k) loan to pay for courses, coaching or an auction deposit. Seminar schemes the FTC shut down told people to do exactly that.',
        { links: [{ label: 'Seminar red flags', url: '#/learn/red-flags', what: 'How seminar and coaching schemes work, and the warning signs.' }] },
      ],
    },
    {
      heading: 'One $300,000 home, financed seven ways',
      blocks: [
        'The same purchase looks very different depending on how you pay for it. This example uses round numbers to compare structures. The rates are examples, not quotes: ask lenders for today’s rates. Monthly payments are principal, interest and mortgage insurance only. Taxes, insurance and closing costs come on top.',
        {
          table: {
            head: ['How you pay', 'Cash at purchase', 'Monthly payment', 'The catch'],
            rows: [
              ['All cash', '$300,000', 'None', 'Ties up all your money in one property. No help from a loan if repairs run over.'],
              ['Conventional investment loan: 20% down, 7% for 30 years', '$60,000', 'About $1,600', 'You qualify on your own income and credit, and need savings in reserve.'],
              ['DSCR loan: 25% down, 7.75% for 30 years', '$75,000', 'About $1,610', 'Qualifies on the property’s rent rather than your income, usually at a higher rate and down payment.'],
              ['FHA: 3.5% down, 6.5% for 30 years', '$10,500', 'About $2,000', 'You must live there (1–4 units). Includes FHA’s 1.75% upfront and 0.55% yearly mortgage insurance.'],
              ['VA: no down payment, 6.5% for 30 years', '$0', 'About $1,940', 'For eligible veterans who live there. Includes the 2.15% funding fee added to the loan, unless you’re exempt.'],
              ['Hard money: 90% of the price, 11% interest-only, 2 points', '$35,400', 'About $2,480', 'Short-term, often due in about a year. You must sell or refinance in time, or face default.'],
              ['Seller financing: 10% down, 6%, balloon after 5 years', '$30,000', 'About $1,620', 'About $251,000 is still owed at year five. If you can’t refinance then, you could lose the property.'],
            ],
          },
        },
        'Lower cash up front usually means a bigger monthly payment, a requirement to live there, or a deadline you must meet. Run each option through the rent calculator before you choose.',
      ],
    },
    {
      heading: 'Before you sign',
      blocks: [
        { list: [
          'Compare lenders. On home loans, a lender must give you a Loan Estimate within three business days of your application. That lets you compare offers side by side.',
          'Check the final numbers. You get the Closing Disclosure at least three business days before closing. Compare it with your Loan Estimate.',
          'Check licenses on NMLS Consumer Access.',
          'Plan for the worst case: higher repairs, a slow sale, or a vacancy while payments are due.',
        ] },
      ],
    },
  ],
  terms: [
    { term: 'Down payment', meaning: 'The part of the price you pay yourself, not borrowed.' },
    { term: 'Mortgage insurance (PMI, MIP)', meaning: 'Insurance that protects the lender if you stop paying; required on many loans with small down payments.' },
    { term: 'Reserves', meaning: 'Savings left after closing, measured in months of loan payments.' },
    { term: 'Nonrecourse loan', meaning: 'A loan where the lender can only take the property if you don’t pay, subject to carve-outs.' },
    { term: 'Bridge loan', meaning: 'Short-term financing until a property can be sold or refinanced.' },
    { term: 'HELOC', meaning: 'A home equity line of credit: a revolving loan against your home.' },
  ],
  tryIt: { label: 'See who helps with financing', href: '#/pros/lender' },
  sources: [
    { label: 'HUD: FHA loans', url: 'https://www.hud.gov/helping-americans/loans' },
    { label: 'HUD Mortgagee Letter 2010-29: FHA credit scores and loan-to-value', url: 'https://www.hud.gov/sites/documents/10-29ml.pdf' },
    { label: 'HUD Mortgagee Letter 2023-05: FHA mortgage insurance premiums', url: 'https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-05hsgml.pdf' },
    { label: 'VA: funding fee and closing costs', url: 'https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/' },
    { label: 'HUD: 203(k) rehabilitation loans', url: 'https://www.hud.gov/hud-partners/single-family-203k' },
    { label: 'VA: purchase loans', url: 'https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/' },
    { label: 'CFPB: what is private mortgage insurance?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/' },
    { label: 'CFPB: what is mortgage insurance and how does it work?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-mortgage-insurance-and-how-does-it-work-en-1953/' },
    { label: 'Fannie Mae Selling Guide: occupancy types (B2-1.1-01)', url: 'https://selling-guide.fanniemae.com/sel/b2-1.1-01/occupancy-types' },
    { label: 'Fannie Mae Selling Guide: minimum reserve requirements (B3-4.1-01)', url: 'https://selling-guide.fanniemae.com/sel/b3-4.1-01/minimum-reserve-requirements' },
    { label: 'Fannie Mae Selling Guide: multiple financed properties (B2-2-03)', url: 'https://selling-guide.fanniemae.com/sel/b2-2-03/multiple-financed-properties-same-borrower' },
    { label: 'Fannie Mae Selling Guide: rental income (B3-3.8-01)', url: 'https://selling-guide.fanniemae.com/sel/b3-3.8-01/rental-income' },
    { label: 'Fannie Mae Selling Guide: rental income from the subject property (B3-3.8-02)', url: 'https://selling-guide.fanniemae.com/sel/b3-3.8-02/rental-income-subject-property' },
    { label: 'OCC Comptroller’s Handbook: commercial real estate lending', url: 'https://www.occ.gov/publications-and-resources/publications/comptrollers-handbook/files/commercial-real-estate-lending/pub-ch-commercial-real-estate.pdf' },
    { label: 'SBA: 7(a) loans', url: 'https://www.sba.gov/funding-programs/loans/7a-loans' },
    { label: 'SBA: 504 loans', url: 'https://www.sba.gov/funding-programs/loans/504-loans' },
    { label: 'NRS 645B: mortgage companies and private investors', url: 'https://www.leg.state.nv.us/NRS/NRS-645B.html' },
    { label: 'California DFPI: California Financing Law', url: 'https://dfpi.ca.gov/regulated-industries/california-financing-law/' },
    { label: 'CFPB: what is a home equity line of credit?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc-en-107/' },
    { label: 'CFPB: loans similar to a HELOC, including cash-out refinancing', url: 'https://www.consumerfinance.gov/ask-cfpb/what-other-types-of-loans-are-similar-to-a-heloc-en-253/' },
    { label: 'CFPB: what is a Loan Estimate?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-loan-estimate-en-1995/' },
    { label: 'CFPB: what is a Closing Disclosure?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-closing-disclosure-en-1983/' },
    { label: 'CFPB: how to check a mortgage lender or broker’s license', url: 'https://www.consumerfinance.gov/ask-cfpb/is-there-any-way-i-can-check-to-see-if-the-company-or-person-i-contact-is-permitted-to-make-or-broker-mortgage-loans-en-133/' },
  ],
  practice: 'Ask two lenders the same questions and compare their Loan Estimates or written term sheets side by side.',
  reviewed: '2026-09-29',
};
