import type { Lesson } from './types';

export const financing: Lesson = {
  key: 'financing',
  minutes: 12,
  intro: 'Most real estate is bought with borrowed money. The loan you can get depends on a few things: whether you’ll live in the property, how many units it has, and whether it’s a home or a business property. Here are the main kinds and what each asks of you.',
  takeaways: [
    'Why living in the property opens the lowest down payments.',
    'What lenders ask of investors: larger down payments, savings in reserve and a limit on financed properties.',
    'How FHA, VA and renovation loans work.',
    'How to get pre-approved, and what lenders check: debt-to-income, credit, down payment and savings.',
    'How DSCR and hard-money loans work, and what to have ready for each.',
    'The waiting periods before refinancing a cash or hard-money purchase.',
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
              ['VA', 'Often none, with full VA entitlement and the lender’s approval, as long as the price isn’t above the appraised value. With less entitlement left (for example, a VA loan you haven’t paid off), the lender may require a down payment.', 'For eligible veterans and service members who will live in the home. Can buy up to four units.'],
              ['Conventional', 'Varies by lender and program.', 'If you put down less than 20%, you’ll usually pay private mortgage insurance (PMI). It protects the lender, not you.'],
              ['FHA 203(k)', 'FHA terms.', 'Adds repair costs to the loan: up to $75,000 for smaller jobs (Limited 203(k)), or larger projects of at least $5,000 (Standard 203(k)).'],
            ],
          },
        },
        'You can use these loans to start investing: buy a two-to-four-unit home, live in one unit and rent out the others.',
      ],
    },
    {
      heading: 'Loans for investment property',
      blocks: [
        'An investment property is one you own but don’t live in. FHA and VA loans require you to live in the home, so expect to put more money down. On Fannie Mae loans, lenders also look for:',
        { list: [
          'Savings in reserve: generally six months of payments for an investment property or a two-to-four-unit home you live in. If you already own other mortgaged properties (not counting your own home), Fannie Mae adds more: 2% of what you still owe on them if you have 1 to 4, 4% for 5 or 6, and 6% for 7 to 10 (Selling Guide B3-4.1-01).',
          'A limit of 10 financed properties, counting your own home, when the new loan is for a second home or investment property. That limit of 10 applies to loans approved through Fannie Mae’s automated system; loans a person underwrites by hand stop at 6 (Selling Guide B2-2-03).',
          'Rent to help you qualify (Fannie Mae, long-term rental): the lender takes 75% of the market rent and subtracts the full payment with taxes, insurance and HOA dues (PITIA). Example: rent $2,400 × 75% = $1,800; payment $1,600; $200 left over. With 12 months or more of experience managing rentals, that $200 can count as income. With less, the rent still helps: it can cover the $1,600 payment, so that payment isn’t counted against you, but the $200 doesn’t count as income. If the result is negative, the shortfall counts against you either way. The 25% cut is the lender’s qualifying cushion, not a budget or a forecast of your profit. Short-term (nightly) rentals use 50% of the rent, but only on a one-unit investment property that’s legally allowed to operate as a short-term rental, and not from an ADU. Other lenders and programs have their own rules.',
        ] },
        'Rules change, and lenders can add their own. Ask a licensed loan officer for current requirements.',
      ],
    },
    {
      heading: 'Getting approved, step by step',
      blocks: [
        'Talk to a lender before you make offers. A financing letter can make a seller take your offer more seriously, and you learn your real price range before you fall for a property. If you’re paying cash, get proof of funds (a recent bank or brokerage statement) instead. At an auction, what counts is having the money ready by the payment deadline, not a letter.',
        { list: [
          'Pre-qualification and pre-approval: lenders use these names differently, so ask what the lender actually checked (credit, income, savings documents) and what is still a condition (the appraisal, title, insurance, the property itself, final underwriting). A letter based on checked documents is stronger, but no letter guarantees the loan. Each seller decides what they’ll accept; some bank-owned sellers ask for a specific letter or their own lender’s review.',
          'Debt-to-income (DTI) ratio: your monthly debt payments, including the new loan, divided by your gross monthly income. Fannie Mae’s limit is 36% on loans a person underwrites by hand, up to 45% with strong credit and savings, and up to 50% through its automated system (Selling Guide B3-6-02).',
          'Credit: a higher score gets a lower rate and fees. Investment-property loans already cost more than loans on a home you live in, so small score gains matter.',
          'Down payment: on a Fannie Mae loan for an investment property, expect at least 15% down on one unit and 25% on two to four units, plus closing costs and the reserves above.',
          'Compare at least three written quotes for the same property and loan, ideally on the same day. On a home loan covered by consumer rules (for example, one you’ll live in), compare Loan Estimates. On a loan for a rental you won’t live in, which federal rules treat as a business loan, ask for a written term sheet and a full fee list instead, and ask the lender which disclosures apply. Either way, compare the rate and whether it’s locked, points, fees, required reserves, prepayment penalties, any balloon, and the conditions still left before approval.',
        ] },
        'Have ready, for a regular investment-property loan: two years of tax returns and W-2s or 1099s, recent pay stubs, two months of bank and investment statements, the lease and rent history on any rentals you own, and an explanation for any large deposit.',
      ],
    },
    {
      heading: 'DSCR loans: qualifying on the rent',
      blocks: [
        'A DSCR loan (debt service coverage ratio) is approved mainly on the property’s rent instead of your income. The lender divides the monthly rent by the monthly payment with taxes, insurance and any HOA dues. Many want 1.0 or more; a higher ratio gets better terms. Commercial lenders figure DSCR differently: they first subtract operating costs from the rent (that’s net operating income), then divide by the year’s loan payments. So the same property shows a lower ratio on a commercial loan.',
        { list: [
          'Example: rent of $2,400 and a full payment of $2,000 is a ratio of 1.2.',
          'They’re made by private lenders, not Fannie Mae or Freddie Mac, so terms vary widely. Down payments of 20% to 25% and higher rates than a regular loan are common.',
          'Many have a prepayment penalty for the first three to five years. Ask how it’s figured before you plan to sell or refinance early.',
          'Many lend to an LLC, usually with your personal guarantee.',
        ] },
        'Have ready: the lease or the appraiser’s rent estimate, your LLC papers if the LLC borrows, bank statements showing the down payment and reserves, and your credit report.',
        { links: [{ label: 'Run a rental’s DSCR in the Deal Lab', url: '#/analyze?plan=rent', what: 'The rent calculator shows the coverage ratio for your loan.' }] },
      ],
    },
    {
      heading: 'Commercial and business loans',
      blocks: [
        'Commercial loans are sized on the property’s income. Lenders use the debt service coverage ratio (NOI divided by the year’s loan payments). Many aren’t fully paid off by the end of their term. Instead they end with a balloon payment, which you may need to refinance, and that can be hard if values fall.',
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
        'Private lenders and hard-money lenders make loans secured by the property, often short-term. People use them for projects like flips when a bank loan doesn’t fit. Terms vary widely, so compare the rate, points, fees, term, and what happens if you can’t repay on time. Get every term in writing.',
        { list: [
          'They lend on the deal more than on you: often a share of the price and repairs (loan-to-cost), capped at a share of the value after repairs.',
          'Expect points paid up front, interest-only payments, and a term of about 6 to 18 months, with fees to extend it.',
          'Repair money usually comes in draws: you pay for work first, the lender inspects, then reimburses. Plan cash for the gap.',
          'Have ready: the purchase contract, a scope of work with contractor bids, the after-repair value with comparable sales, your track record, and how you’ll repay (a sale or a refinance).',
        ] },
        'In Nevada, a specific state law covers mortgage companies and the private investors who fund loans (NRS 645B).',
        'In California, finance lenders and brokers are licensed under the California Financing Law.',
        'You can check many lenders on NMLS Consumer Access, the free national lookup. Some private lenders hold a different license, such as a real estate broker’s license, and some are exempt. Ask which license they hold and check it with that regulator.',
      ],
    },
    {
      heading: 'Refinancing after a cash or hard-money purchase',
      blocks: [
        'Buying with cash or a short-term loan and then refinancing (the BRRRR plan) depends on a lender agreeing to the new loan, at the value an appraiser gives. Plan for the rules before you buy.',
        { list: [
          'Waiting period: Fannie Mae requires you to be on title for at least six months before a cash-out refinance (with exceptions such as delayed financing), and Fannie Mae requires a first mortgage being paid off to be at least 12 months old (Selling Guide B2-1.3-03).',
          'If you paid all cash, Fannie Mae’s “delayed financing” exception can let you take cash out sooner, limited to what you can document you put in, for an arm’s-length purchase.',
          'A hard-money loan usually can’t be paid off with a regular cash-out loan until those periods pass. Some lenders allow a rate-and-term refinance sooner; ask before you buy, and make sure the hard-money term is long enough.',
          'The new loan is sized on the appraisal and the rent, not on what you spent. A low appraisal can leave more of your cash in the property than you planned.',
        ] },
        { links: [{ label: 'BRRRR in the rent calculator', url: '#/analyze?plan=rent', what: 'Shows your cash until the refinance closes, and what stays in after it.' }] },
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
              ['FHA: 3.5% down, 6.5% for 30 years', '$10,500', 'About $2,000', 'You must live there (1–4 units). Includes FHA’s 1.75% upfront and 0.55% yearly mortgage insurance. With less than 10% down, the yearly premium lasts as long as the loan.'],
              ['VA: no down payment, 6.5% for 30 years', '$0', 'About $1,940', 'For eligible veterans who live there, with full VA entitlement (with less, the lender may require a down payment). Includes the 2.15% funding fee added to the loan, unless you’re exempt. You still need cash for closing costs unless the seller pays them.'],
              ['Hard money: 90% of the price, 11% interest-only, 2 points', '$35,400', 'About $2,480', 'Short-term, often due in about a year. You must sell or refinance in time, or face default.'],
              ['Seller financing: 10% down, 6%, 30-year schedule, balloon after 5 years', '$30,000', 'About $1,620', 'About $251,000 is still owed at year five. If you can’t refinance then, you could lose the property. On a home the buyer will live in, a seller who doesn’t use a licensed loan originator can include a balloon only if the seller is a person, estate or trust that finances just one property in 12 months.'],
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
          'Compare lenders. On most consumer home loans, such as a loan to buy a one- or two-unit home you’ll live in or a second home you won’t rent out, the lender must give you a Loan Estimate within three business days of your application. Home equity lines of credit (HELOCs) and reverse mortgages use different disclosures. Business loans don’t require this form. Federal rules count two kinds of purchase loans as business loans: a loan to buy a rental you won’t live in, however many units it has, and a loan to buy a building with three or more units, even if you’ll live in one of them (“live in” means more than 14 days in the coming year). For those, ask for a written term sheet, and compare rate, points, fees, balloon and prepayment terms side by side.',
          'Check the final numbers. On most consumer home loans (not HELOCs or reverse mortgages), you must receive the Closing Disclosure at least three business days before you sign the loan. Compare it with your Loan Estimate. A pre-approval is conditional: it isn’t a promise to fund.',
          'Check each lender’s license with its regulator; NMLS Consumer Access covers many of them.',
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
    { label: 'Fannie Mae Selling Guide: debt-to-income ratios (B3-6-02)', url: 'https://selling-guide.fanniemae.com/sel/b3-6-02/debt-income-ratios' },
    { label: 'Fannie Mae Selling Guide: cash-out refinances and delayed financing (B2-1.3-03)', url: 'https://selling-guide.fanniemae.com/sel/b2-1.3-03/cash-out-refinance-transactions' },
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
