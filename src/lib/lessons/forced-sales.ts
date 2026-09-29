import type { Lesson } from './types';

export const forcedSales: Lesson = {
  key: 'forced-sales',
  minutes: 10,
  intro: 'A forced sale is one the owner didn’t choose: a county selling for unpaid taxes, a lender’s trustee selling after a missed loan, a sheriff selling to pay a court judgment, or the IRS selling seized property. The rules change a lot from state to state: choose your state below to see only its rules.',
  takeaways: [
    'Whether your county sells the property itself or a tax lien.',
    'How trustee (foreclosure) auctions work: timelines, notices and payment.',
    'Which sales leave the owner a right to buy the property back after the sale.',
    'What stays with the property, and why you buy as-is.',
    'Where to find your county’s sale offices.',
  ],
  sections: [
    {
      heading: 'Tax sales',
      blocks: [
        {
          table: {
            head: ['State', 'What’s sold', 'Key rules'],
            rows: [
              ['Nevada', 'The property, by quitclaim deed', 'The county treasurer holds the property for 2 years after the tax certificate (1 year if abandoned), then auctions it for at least the taxes, costs, penalties and interest. Owners and lenders can pay off until the third business day before the sale.'],
              ['California', 'The property (tax-defaulted land)', 'The tax collector can sell after five years of default (three for nonresidential commercial property). The minimum bid is at least the amount needed to redeem, plus costs.'],
              ['Arizona', 'A tax lien, not the property', 'Liens are sold in February. Bidders bid down the interest rate, which can’t exceed 16% a year. The owner can redeem; after three years (and within ten), the lien holder can go to court to foreclose the right to redeem and get a deed.'],
              ['Utah', 'The property', 'Property still unpaid after four years is sold by the county auditor at a tax sale in May or June. A bid must cover the taxes, penalties, interest and costs.'],
            ],
          },
        },
        'A tax sale doesn’t clear everything. Read the county’s rules before every sale.',
        'In Nevada, Washoe County warns that some government liens and other encumbrances may remain, and that for two years the former owner can challenge the sale, when title insurance may be hard to get.',
        'In California, San Diego County sells “as is” and takes no responsibility for other liens, encumbrances or easements.',
      ],
    },
    {
      heading: 'Trustee (foreclosure) sales',
      blocks: [
        'Most home loans in all four states are deeds of trust. When a borrower defaults, a trustee can sell the home at a public auction without going to court.',
        {
          table: {
            head: ['State', 'Timeline and notice', 'Paying'],
            rows: [
              ['Nevada', 'At least 3 months after the notice of default is recorded. The notice of sale is posted 20 days and published once a week for 3 weeks.', 'Set by the trustee; see our guide.'],
              ['California', 'At least 3 months after the notice of default. The notice of sale is posted at least 20 days before.', 'The trustee can require bidders to show they can pay the full bid in cash or cashier’s checks, and can require the full amount from the winner.'],
              ['Arizona', 'The sale is no sooner than the 91st day after the notice of sale is recorded; notice is posted 20 days before and published four weeks in a row.', 'The winner pays by 5 p.m. the next business day.'],
              ['Utah', 'At least 3 months after the notice of default. The notice of sale is published three times and posted at least 20 days before.', 'As the trustee directs. A bid can’t be withdrawn, and the trustee’s deed comes with no right of redemption.'],
            ],
          },
        },
        'California adds a step for homes of one to four units: after the auction, eligible tenant buyers have 15 days and other eligible bidders 45 days to match the winning bid (Civil Code 2924m, in effect until 2031). The winning bid isn’t final until that period ends.',
      ],
    },
    {
      heading: 'Court sales and the right to redeem',
      blocks: [
        'When a foreclosure goes through court, or a sheriff sells property to pay a judgment, the owner may be able to buy it back for a time after the sale. You own it subject to that right until it ends.',
        { list: [
          'Nevada: up to 1 year after a sheriff’s execution sale.',
          'California: 3 months after a judicial foreclosure sale if the sale paid the debt in full, or 1 year if it didn’t.',
          'Arizona: 30 days after a judicial foreclosure sale if the court found the property abandoned, otherwise 6 months.',
          'Utah: 180 days after a sheriff’s sale.',
        ] },
      ],
    },
    {
      heading: 'Federal sales',
      blocks: [
        { list: [
          'IRS sales: the IRS sells seized property by public or sealed-bid auction. For 180 days afterward, the owner or anyone with an interest can redeem it by paying what you paid plus 20% a year interest, so you can’t count on keeping it until then.',
          'HUD homes: foreclosed FHA homes sold through HUD Home Store; bids go through a HUD-registered broker.',
          'Tenants: after a foreclosure, a new owner must give genuine tenants at least 90 days’ notice before eviction and generally honor their lease. The exception is a buyer who will live there, who can end the lease with 90 days’ notice.',
        ] },
      ],
    },
    {
      heading: 'Before any forced sale',
      blocks: [
        { list: [
          'Read the official notice and the seller’s rules: deposit, payment deadline, and what the deed promises.',
          'Get a title search: which liens survive depends on the kind of sale.',
          'Expect to buy as-is, usually without seeing inside.',
          'Check whether the owner has filed bankruptcy, which can stop a sale.',
          'Know your walk-away price before bidding, and include the cost of any redemption period.',
          'Plan for occupants: owners and tenants have legal rights, and removing them takes a court process.',
        ] },
        'Find Deals lists each county’s tax sale page and records offices. Never contact homeowners facing foreclosure; buy from the official seller.',
        'Our step-by-step guides walk through each kind of sale in your state, from the notice to getting possession:',
        { links: [
          { label: 'Nevada guides (Clark County)', url: '#/playbooks', what: 'Tax sales, lien certificates, foreclosure auctions, HOA foreclosures, sheriff sales, IRS sales, bank-owned homes, commercial property and short sales.' },
          { label: 'California guides', url: '#/playbooks', what: 'Tax sales, trustee sales and sheriff sales.' },
          { label: 'Arizona guides', url: '#/playbooks', what: 'Tax lien sales, trustee sales and sheriff sales.' },
          { label: 'Utah guides', url: '#/playbooks', what: 'Tax sales, trustee sales and sheriff sales.' },
        ] },
      ],
    },
  ],
  terms: [
    { term: 'Tax lien', meaning: 'A claim for unpaid taxes. Where liens are sold, investors buy the lien and earn interest until it’s paid or foreclosed.' },
    { term: 'Tax deed', meaning: 'A deed to the property itself, sold by the county for unpaid taxes.' },
    { term: 'Trustee sale', meaning: 'An out-of-court foreclosure auction held by the trustee under a deed of trust.' },
    { term: 'Right of redemption', meaning: 'The owner’s right to buy the property back for a time after certain sales.' },
    { term: 'Quitclaim deed', meaning: 'A deed that passes whatever interest the seller has, with no promise that title is clear.' },
  ],
  tryIt: { label: 'Find your county’s sale offices', href: '#/find-deals' },
  sources: [
    { label: 'NRS 361: property tax and tax sales (361.570, 361.585, 361.595)', url: 'https://www.leg.state.nv.us/NRS/NRS-361.html' },
    { label: 'California Revenue and Taxation Code 3691: when tax-defaulted property can be sold', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3691' },
    { label: 'California Revenue and Taxation Code 3698.5: minimum bid', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=3698.5' },
    { label: 'Arizona Revised Statutes 42-18112: tax lien sale in February', url: 'https://www.azleg.gov/ars/42/18112.htm' },
    { label: 'Arizona Revised Statutes 42-18114: bidding down the interest rate', url: 'https://www.azleg.gov/ars/42/18114.htm' },
    { label: 'Arizona Revised Statutes 42-18053: 16% interest cap', url: 'https://www.azleg.gov/ars/42/18053.htm' },
    { label: 'Arizona Revised Statutes 42-18201: foreclosing the right to redeem', url: 'https://www.azleg.gov/ars/42/18201.htm' },
    { label: 'Utah Code 59-2-1343: property listed for tax sale', url: 'https://le.utah.gov/xcode/Title59/Chapter2/C59-2-S1343_2026010120250507.html' },
    { label: 'Utah Code 59-2-1351: the tax sale', url: 'https://le.utah.gov/xcode/Title59/Chapter2/C59-2-S1351_2023031320230313.html' },
    { label: 'Utah Code 59-2-1351.1: minimum bid', url: 'https://le.utah.gov/xcode/Title59/Chapter2/C59-2-S1351.1_2018050820180508.html' },
    { label: 'Washoe County Treasurer: real property tax sales FAQ', url: 'https://www.washoecounty.gov/treas/faq/faq-category_Real_Property_Tax_Sales.php' },
    { label: 'San Diego County Treasurer-Tax Collector: research before a tax sale', url: 'https://www.sdttc.com/content/ttc/en/tax-collection/property-tax-sales/research.html' },
    { label: 'NRS 107: deeds of trust and trustee sales (107.080)', url: 'https://www.leg.state.nv.us/NRS/NRS-107.html' },
    { label: 'California Civil Code 2924: notice of default', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924' },
    { label: 'California Civil Code 2924f and 2924h: notice of sale and bidding', url: 'https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=CIV&division=3.&title=14.&part=4.&chapter=2.&article=1' },
    { label: 'California Civil Code 2924m: tenant and eligible bidder period', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2924m' },
    { label: 'Arizona Revised Statutes 33-808: notice of trustee sale', url: 'https://www.azleg.gov/ars/33/00808.htm' },
    { label: 'Arizona Revised Statutes 33-811: paying the bid', url: 'https://www.azleg.gov/ars/33/00811.htm' },
    { label: 'Utah Code 57-1-24: notice of default', url: 'https://le.utah.gov/xcode/Title57/Chapter1/C57-1-S24_1800010118000101.html' },
    { label: 'Utah Code 57-1-25: notice of sale', url: 'https://le.utah.gov/xcode/Title57/Chapter1/C57-1-S25_2020051220200512.html' },
    { label: 'Utah Code 57-1-27: bids are irrevocable', url: 'https://le.utah.gov/xcode/Title57/Chapter1/C57-1-S27_2016051020160510.html' },
    { label: 'Utah Code 57-1-28: payment and the trustee’s deed', url: 'https://le.utah.gov/xcode/Title57/Chapter1/C57-1-S28_2016051020160510.html' },
    { label: 'NRS 21: execution sales and redemption (21.210)', url: 'https://www.leg.state.nv.us/NRS/NRS-021.html' },
    { label: 'California Code of Civil Procedure 729.030: redemption period', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=729.030' },
    { label: 'Arizona Revised Statutes 12-1282: redemption after judicial sale', url: 'https://www.azleg.gov/ars/12/01282.htm' },
    { label: 'Utah Rule of Civil Procedure 69C: redemption', url: 'https://legacy.utcourts.gov/rules/view.php?type=urcp&rule=69C' },
    { label: 'IRS: redeeming your real estate', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/redeeming-your-real-estate' },
    { label: 'IRS right of redemption (26 U.S.C. 6337)', url: 'https://www.law.cornell.edu/uscode/text/26/6337' },
    { label: 'IRS: auctions of real and personal property', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/auctions-of-real-and-personal-property' },
    { label: 'HUD Home Store', url: 'https://www.hudhomestore.gov/' },
    { label: 'Federal Reserve: Protecting Tenants at Foreclosure Act restored', url: 'https://www.federalreserve.gov/supervisionreg/caletters/caltr1804.htm' },
  ],
  reviewed: '2026-09-29',
};
