import type { Lesson } from './types';

export const markets: Lesson = {
  key: 'markets',
  minutes: 7,
  intro: 'Real estate splits into two markets with different buyers, prices, loans and rules. Knowing which one a property is in tells you how it’s valued and how you can pay for it.',
  takeaways: [
    'Where the line between residential and commercial falls.',
    'Why a house is priced by comparable sales and an income property by its income.',
    'How loans and leases differ between the two.',
    'Why some protections follow how a property is used, not what it is.',
  ],
  sections: [
    {
      heading: 'Where the line is',
      blocks: [
        'For home loans, a building with one to four homes in it (a house, a condo, a duplex, a triplex or a fourplex) is residential. Federal housing rules call it single-family housing, and Fannie Mae buys loans on it as residential property.',
        'A building with five or more homes is multifamily. It’s bought, valued and financed like a business, with commercial-style loans. Offices, stores, warehouses, hotels and self-storage are commercial too.',
      ],
    },
    {
      heading: 'At a glance',
      blocks: [
        {
          table: {
            head: ['', 'Residential (1–4 homes)', 'Commercial (5+ homes, stores, offices, industrial)'],
            rows: [
              ['Value set by', 'Recent sales of similar homes nearby', 'The income it produces (net operating income and cap rate)'],
              ['Loans', 'Home mortgages, including low-down-payment loans if you live there', 'Commercial loans, often shorter with a large final (balloon) payment'],
              ['Leases', 'Usually a year or less, with strong tenant protections', 'Often years long; the tenant may pay taxes, insurance and upkeep'],
              ['Main risk', 'Repairs, a bad tenant, a slow sale', 'Vacancies and leases that don’t renew'],
            ],
          },
        },
      ],
    },
    {
      heading: 'How each is valued',
      blocks: [
        'Homes that people live in are usually valued by comparing recent sales of similar homes, because there are plenty of them. Federal bank examiners describe this as the usual approach for owner-occupied homes.',
        'Commercial property often doesn’t have enough similar sales to compare, so it’s valued by its income. Start with net operating income (NOI): the rent it collects in a normal year, minus operating costs like taxes, insurance, repairs and management, before any loan payment. Then divide by a capitalization (cap) rate, the return buyers in that market expect.',
        { list: ['Example: a building earns $120,000 of NOI a year. If buyers expect a 6% cap rate, it’s worth about $120,000 ÷ 0.06 = $2,000,000.', 'Raise the NOI by $10,000 and, at the same cap rate, the value goes up about $167,000. That’s why commercial investors focus on raising rent and cutting costs.'] },
      ],
    },
    {
      heading: 'How loans differ',
      blocks: [
        'Loans on one to four homes follow the rules of Fannie Mae, Freddie Mac and the FHA. If you’ll live in the property, an FHA loan can cover about 96.5% of the price on a home with up to four units. Buying three or four units with FHA also means showing three months of payments in savings after closing, compared with one month for one or two units.',
        'Commercial loans are sized on the property’s income. Lenders look at the loan-to-value ratio (LTV) and the debt service coverage ratio (DSCR): how many times the NOI covers the loan payments. A federal banking example describes an office loan at 75% LTV and 1.30x DSCR, paid as if over 20 years but with the rest due as a balloon after five. Lenders also look at who guarantees the loan.',
      ],
    },
    {
      heading: 'How leases differ',
      blocks: [
        'Residential tenants have strong protections, and each state sets its own landlord-tenant law. Read yours before you rent out a home.',
        'In California, most rentals fall under the Tenant Protection Act: rent can’t go up more than 10%, or 5% plus inflation, whichever is lower, in 12 months, and there are rules on when a landlord can end a tenancy.',
        'Commercial leases are negotiated between businesses and are often much longer. In a triple-net (NNN) lease, the tenant pays rent plus the property’s taxes, insurance and maintenance; these leases commonly run 10 or 15 years.',
      ],
    },
    {
      heading: 'Protections follow the use, not just the building',
      blocks: [
        'Federal truth-in-lending rules protect consumers, not businesses. A loan to buy a rental you won’t live in counts as a business loan, even if it’s a single house, so some consumer protections don’t apply. If you’ll live in the property, a loan for up to two units stays a consumer loan; for three or more units it counts as business.',
      ],
    },
    {
      heading: 'Where the risk is',
      blocks: [
        'A rental home depends on one household at a time, with short leases, so problems show up fast and are usually small. A commercial building can depend on a few large tenants with long leases: steady while they stay, but a single vacancy or a lease that doesn’t renew can cut income sharply. Bank examiners watch vacancy rates and lease renewals for that reason, and office buildings lost income when many businesses moved to hybrid work.',
      ],
    },
  ],
  terms: [
    { term: 'Net operating income (NOI)', meaning: 'A year’s rent and other income, minus operating costs, before loan payments.' },
    { term: 'Cap rate', meaning: 'NOI divided by price. The return buyers expect from a property before financing.' },
    { term: 'Loan-to-value (LTV)', meaning: 'The loan amount as a share of the property’s value.' },
    { term: 'Debt service coverage ratio (DSCR)', meaning: 'NOI divided by the year’s loan payments. 1.30x means the income covers the payments 1.3 times.' },
    { term: 'Balloon payment', meaning: 'A large final payment of the loan’s remaining balance, due before it would otherwise be paid off.' },
    { term: 'Triple-net (NNN) lease', meaning: 'A commercial lease where the tenant also pays the property’s taxes, insurance and maintenance.' },
  ],
  tryIt: { label: 'Try the commercial income calculator', href: '#/analyze' },
  sources: [
    { label: 'Housing goals definitions: single-family and multifamily (12 CFR 1282.1)', url: 'https://www.law.cornell.edu/cfr/text/12/1282.1' },
    { label: 'Fannie Mae Selling Guide: general property eligibility (B2-3-01)', url: 'https://selling-guide.fanniemae.com/sel/b2-3-01/general-property-eligibility' },
    { label: 'HUD: FHA 203(b) mortgage insurance', url: 'https://www.hud.gov/hud-partners/single-family-sfh203b' },
    { label: 'HUD Mortgagee Letter 2023-17: reserves for three- and four-unit homes', url: 'https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-17hsgml.pdf' },
    { label: 'FDIC examination manual: loans and appraisal approaches (section 3.2)', url: 'https://www.fdic.gov/resources/supervision-and-examinations/examination-policies-manual/section3-2.pdf' },
    { label: 'Federal Reserve SR 23-5: commercial real estate loans, valuation and examples', url: 'https://www.federalreserve.gov/supervisionreg/srletters/SR2305.pdf' },
    { label: 'Truth in Lending: business-purpose credit is exempt (12 CFR 1026.3)', url: 'https://www.law.cornell.edu/cfr/text/12/1026.3' },
    { label: 'CFPB: official interpretation of the business-purpose exemption', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/interp-3/' },
    { label: 'California Attorney General: landlord-tenant issues', url: 'https://oag.ca.gov/consumers/general/landlord-tenant-issues' },
    { label: 'Legal Information Institute: triple net lease', url: 'https://www.law.cornell.edu/wex/triple_net_lease' },
  ],
  practice: 'Pick one house and one small commercial building listed near you. Write down how each would be valued: by comparable sales, or by its income and a cap rate.',
  reviewed: '2026-09-29',
};
