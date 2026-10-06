import type { Lesson } from './types';
import { PROPERTY_WHY as W } from './propertyWhy';
import { topicHref } from '../deep/propertyTopics';

export const typesOfProperty: Lesson = {
  key: 'types',
  minutes: 15,
  intro: 'Each kind of property has its own buyers, loans, costs and risks. Here’s what each one is, and what you should know before you buy one.',
  takeaways: [
    'The main kinds of residential and commercial property.',
    'Which ones qualify for home loans, and which need commercial or cash financing.',
    'Costs that come with some types, like HOA dues.',
    'Why land is the hardest kind of property to finance.',
    'Why you would, or wouldn’t, choose each type, with real examples from recent years.',
  ],
  sections: [
    {
      heading: 'Residential: one to four homes',
      blocks: [
        {
          table: {
            head: ['Type', 'What it is', 'What to know'],
            rows: [
              ['Single-family house', 'One home on its own lot.', 'The easiest to finance, rent and resell. Valued by comparable sales.'],
              ['Condo or townhouse', 'A home that shares walls or grounds with others, under an association (HOA). “Condo” is a way of owning: your unit plus a share of the common areas. A townhouse is a building style that may be a condo or come with its own lot.', 'HOA dues are paid on top of the mortgage. They can run from a few hundred to more than a thousand dollars a month. Read the HOA’s rules on renting.'],
              ['Duplex, triplex, fourplex (2–4 units)', 'One building or lot with two to four homes.', 'Still residential for lending. If you live in one unit, you can use a home loan, including FHA. With FHA, three or four units need more savings after closing, and the rents must cover the payment (FHA’s self-sufficiency test).'],
              ['Manufactured home', 'A factory-built home made to the federal HUD Code.', 'Every one built after June 15, 1976 must carry a HUD certification label. Financing depends on whether you own the land under it or rent it.'],
            ],
          },
        },
        'Why you would, or wouldn’t, choose each one, from different investors’ points of view. Tap a type to open it.',
        { why: { title: 'Single-family house', ...W.singleFamily, more: { href: topicHref('singleFamily'), label: 'Learn more about single-family houses' } } },
        { why: { title: 'Condo or townhouse', ...W.condo, more: { href: topicHref('condo'), label: 'Learn more about condos and townhouses' } } },
        { why: { title: 'Duplex, triplex, fourplex (2–4 units)', ...W.smallMultifamily, more: { href: topicHref('smallMultifamily'), label: 'Learn more about duplexes to fourplexes' } } },
        { why: { title: 'Manufactured home', ...W.manufactured, more: { href: topicHref('manufactured'), label: 'Learn more about manufactured homes' } } },
      ],
    },
    {
      heading: 'Commercial',
      blocks: [
        {
          table: {
            head: ['Type', 'What it is', 'What to know'],
            rows: [
              ['Multifamily (5+ units)', 'Apartment buildings.', 'Financed with commercial-style loans and valued by income. Many tenants, so one vacancy hurts less.'],
              ['Retail', 'Stores, shopping centers, restaurants.', 'Depends on tenants’ businesses doing well. Leases are often triple-net.'],
              ['Office', 'Buildings leased to businesses.', 'Long leases, but vacancies can last. Hybrid work cut demand for some offices.'],
              ['Industrial', 'Warehouses, distribution and light manufacturing.', 'Simple buildings, often with one tenant on a long lease.'],
              ['Mixed-use', 'Shops or offices plus homes in one building.', 'Combines residential and commercial rules, tenants and risks.'],
              ['Hotels and motels', 'Rooms rented by the night.', 'Run like a business every day. For taxes, it isn’t residential rental property when more than half the units are rented to short-stay guests.'],
              ['Self-storage', 'Units rented by the month.', 'Many small tenants and simple buildings. Income depends on local demand.'],
            ],
          },
        },
        'Why you would, or wouldn’t, choose each one, from different investors’ points of view. Tap a type to open it.',
        { why: { title: 'Multifamily (5+ units)', ...W.multifamily, more: { href: topicHref('multifamily'), label: 'Learn more about apartment buildings' } } },
        { why: { title: 'Retail', ...W.retail, more: { href: topicHref('retail'), label: 'Learn more about retail property' } } },
        { why: { title: 'Office', ...W.office, more: { href: topicHref('office'), label: 'Learn more about office buildings' } } },
        { why: { title: 'Industrial', ...W.industrial, more: { href: topicHref('industrial'), label: 'Learn more about industrial property' } } },
        { why: { title: 'Mixed-use', ...W.mixedUse, more: { href: topicHref('mixedUse'), label: 'Learn more about mixed-use buildings' } } },
        { why: { title: 'Hotels and motels', ...W.hotel, more: { href: topicHref('hotel'), label: 'Learn more about hotels and motels' } } },
        { why: { title: 'Self-storage', ...W.selfStorage, more: { href: topicHref('selfStorage'), label: 'Learn more about self-storage' } } },
      ],
    },
    {
      heading: 'Land',
      blocks: [
        'Land can be the cheapest way in, but it’s the hardest to finance. Federal guidelines suggest banks lend no more than 65% of the value of raw land, compared with 75% for land being developed and 85% for improved property. So expect a big down payment, or plan to pay cash. Land earns no income until it’s used, and it can’t be depreciated for taxes.',
        'Before buying land, check the zoning, access, water, sewer or septic, and utilities with the county. Our guides point to each county’s records.',
        { why: { title: 'Raw land', ...W.land, more: { href: topicHref('land'), label: 'Learn more about raw land' } } },
      ],
    },
    {
      heading: 'Choosing a type',
      blocks: [
        { list: [
          'Starting out with little money: often a one-to-four-unit home you live in, with a home loan, if you’re willing to live there, can qualify for the loan and have the down payment, closing costs and the savings the lender wants left over. A low down payment doesn’t mean low total cash or low risk. If you can’t meet those yet, build savings and credit first (the “Learn first” strategy in Decide).',
          'Wanting steady rent with less hands-on work: larger buildings with a property manager, or real estate funds (see the next lesson).',
          'Wanting to buy at forced sales: most tax and foreclosure auctions sell houses, condos and land, usually for cash.',
        ] },
      ],
    },
  ],
  terms: [
    { term: 'HOA', meaning: 'Homeowners’ association: runs shared areas in a condo or planned community and collects dues.' },
    { term: 'HUD Code', meaning: 'Federal construction and safety standards for manufactured homes.' },
    { term: 'Zoning', meaning: 'Local rules on how land can be used and what can be built on it.' },
    { term: 'Improved property', meaning: 'Land with buildings, roads or utilities already in place.' },
  ],
  tryIt: { label: 'Practice buying a residential or commercial property', href: '#/practice' },
  sources: [
    { label: 'Fannie Mae Selling Guide: general property eligibility (B2-3-01)', url: 'https://selling-guide.fanniemae.com/sel/b2-3-01/general-property-eligibility' },
    { label: 'CFPB: are condo fees or HOA dues included in my mortgage payment?', url: 'https://www.consumerfinance.gov/ask-cfpb/are-condoco-op-fees-or-homeowners-association-dues-included-in-my-monthly-mortgage-payment-en-1945/' },
    { label: 'HUD Mortgagee Letter 2023-17: reserves for three- and four-unit homes', url: 'https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-17hsgml.pdf' },
    { label: 'HUD: manufactured home resources', url: 'https://www.hud.gov/hud-partners/manufactured-home-resources' },
    { label: 'IRS Publication 946: how to depreciate property', url: 'https://www.irs.gov/publications/p946' },
    { label: 'SEC investor bulletin: real estate investment trusts (REITs)', url: 'https://www.sec.gov/files/reits.pdf' },
    { label: 'FDIC examination manual: loans and supervisory LTV limits (section 3.2)', url: 'https://www.fdic.gov/resources/supervision-and-examinations/examination-policies-manual/section3-2.pdf' },
    { label: 'Housing goals definitions: dwelling units in mixed-use property (12 CFR 1282.1)', url: 'https://www.law.cornell.edu/cfr/text/12/1282.1' },
    { label: 'IRS Publication 527: residential rental property', url: 'https://www.irs.gov/publications/p527' },
  ],
  practice: 'Choose the two property types that fit your money and time best, and write one reason against each.',
  reviewed: '2026-09-29',
};
