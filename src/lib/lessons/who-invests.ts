import type { Lesson } from './types';

export const whoInvests: Lesson = {
  key: 'who',
  minutes: 6,
  intro: 'From someone renting out half a duplex to funds that own thousands of buildings, investors pick property that fits their money, time and goals. Here’s who buys what, and why.',
  takeaways: [
    'The main kinds of real estate investors and what each usually buys.',
    'How owning a property differs from owning shares of a real estate fund.',
    'What decides the right fit: money, time, borrowing, risk, taxes and how quickly you can sell.',
  ],
  sections: [
    {
      heading: 'Who invests where',
      blocks: [
        {
          table: {
            head: ['Investor', 'Usually buys', 'Why'],
            rows: [
              ['Live-in landlord', 'A 2–4 unit home: live in one unit, rent the others.', 'Home-loan terms: with FHA, about 96.5% financing when it’s your main home.'],
              ['Small landlord', 'Houses, condos and small multi-unit homes to rent out.', 'Monthly rent and long-term growth. Lenders treat these as investment properties, and the loans as business loans.'],
              ['Flipper', 'Homes that need work, often bank-owned or from auctions.', 'Profit from repairs and a quick resale. Timing and repair costs decide the result.'],
              ['Business owner (owner-user)', 'The building their own business uses.', 'Stable space and building equity. SBA 504 loans can help when the business occupies most of the building.'],
              ['Syndicator and their investors', 'Apartment and commercial buildings bought as a group.', 'Pooling money buys bigger property. Usually offered privately, often only to accredited investors.'],
              ['REIT shareholder', 'Shares in a company that owns income property.', 'Real estate income without owning or managing a building.'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Owning a building vs. owning shares',
      blocks: [
        'Congress created real estate investment trusts (REITs) in 1960 so individuals could invest in large income-producing property: offices, shopping centers, apartments, hotels, self-storage and warehouses. A REIT must pay out at least 90% of its taxable income as dividends each year and have at least 100 shareholders.',
        'Shares of a REIT listed on a stock exchange can be sold any day the market is open. Non-traded REITs are different: selling your shares back is typically very limited, and upfront fees can reach 9 to 10% of what you invest. Read the offering documents and fees before investing.',
        'Private group deals (syndications) are often sold under SEC Rule 506(b), which lets a sponsor raise unlimited money from accredited investors but bars advertising the offering to the public. If someone advertises a private real estate deal to you, ask how it complies.',
      ],
    },
    {
      heading: 'What decides the right fit',
      blocks: [
        { list: [
          'Money: living in the property unlocks the lowest down payments. Investment homes, commercial property and land need more cash up front, and many forced sales need cash.',
          'Time: a rental you manage yourself takes regular time; a property manager or a REIT takes less.',
          'Borrowing: home loans on 1–4 units are sized on your income; commercial loans on the property’s income. SBA 504 loans can’t be used for rental property investments.',
          'Risk: one property means one roof, one set of tenants and one neighborhood. Funds spread risk but add fees.',
          'Taxes: buildings wear out on paper. Residential rental buildings are depreciated over 27.5 years and commercial buildings over 39; land isn’t depreciated at all. Ask a tax advisor how this applies to you.',
          'Selling: a building can take months to sell; listed REIT shares can sell the same day.',
        ] },
        'The Decide step turns these questions into a plan for you.',
      ],
    },
  ],
  terms: [
    { term: 'REIT', meaning: 'Real estate investment trust: a company that owns income property and pays most of its income to shareholders.' },
    { term: 'Syndication', meaning: 'A group investment in property, run by a sponsor and paid for by several investors.' },
    { term: 'Accredited investor', meaning: 'A person or entity the SEC allows to buy certain private investments, based on income, net worth or credentials.' },
    { term: 'Depreciation', meaning: 'A yearly tax deduction for the wear on a building (not the land) over a set number of years.' },
    { term: 'Owner-user', meaning: 'A business that buys the building it operates from.' },
  ],
  tryIt: { label: 'Next step: decide what fits you', href: '#/decide' },
  sources: [
    { label: 'HUD: FHA 203(b) mortgage insurance', url: 'https://www.hud.gov/hud-partners/single-family-sfh203b' },
    { label: 'Fannie Mae Selling Guide: occupancy types (B2-1.1-01)', url: 'https://selling-guide.fanniemae.com/sel/b2-1.1-01/occupancy-types' },
    { label: 'CFPB: official interpretation of the business-purpose exemption', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/interp-3/' },
    { label: 'SBA: 504 loans', url: 'https://www.sba.gov/funding-programs/loans/504-loans' },
    { label: 'SBA 504 occupancy rules (13 CFR 120.131)', url: 'https://www.law.cornell.edu/cfr/text/13/120.131' },
    { label: 'SEC: private placements under Rule 506(b)', url: 'https://www.sec.gov/resources-small-businesses/exempt-offerings/private-placements-rule-506b' },
    { label: 'SEC investor bulletin: real estate investment trusts (REITs)', url: 'https://www.sec.gov/files/reits.pdf' },
    { label: 'IRS instructions for Form 1120-REIT', url: 'https://www.irs.gov/instructions/i1120rei' },
    { label: 'IRS Publication 946: how to depreciate property', url: 'https://www.irs.gov/publications/p946' },
    { label: 'IRS Publication 527: residential rental property', url: 'https://www.irs.gov/publications/p527' },
  ],
  reviewed: '2026-09-29',
};
