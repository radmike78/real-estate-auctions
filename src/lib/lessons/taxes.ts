import type { Lesson } from './types';

// Taxes from the day you buy to the day you sell, for rentals and flips. Federal rules apply in every state; the
// state parts say which state they cover.
export const taxes: Lesson = {
  key: 'taxes',
  minutes: 12,
  intro: 'Taxes can turn a good-looking deal into a poor one, and the rules for a rental and a flip are very different. This lesson follows a property from the day you buy it to the day you sell it. It covers the taxes at closing, property tax while you own it, how rental income and depreciation work, how a flip is taxed, what happens when you sell or trade a rental, and what your state adds. It’s general education, not tax advice: plan the tax with a CPA or tax advisor before you buy.',
  takeaways: [
    'The taxes you pay when you buy, while you own, and when you sell.',
    'Why a rental and a flip are taxed so differently.',
    'How depreciation lowers your tax now and comes back when you sell.',
    'When a 1031 exchange or the home-sale exclusion can put off or remove the tax.',
    'What your state adds on top of federal tax.',
  ],
  sections: [
    {
      heading: 'When you buy: transfer tax and fees',
      blocks: [
        'Some states tax the transfer of real property when the deed is recorded. Who pays it is negotiable and set by local custom, so check your contract.',
        {
          table: {
            head: ['State', 'Transfer tax'],
            rows: [
              ['Nevada', '$1.95 for each $500 of value or portion of $500, $2.05 in Washoe and Churchill counties, and $2.55 in Clark County (NRS 375.020 and 375.023, plus a local tax in Washoe and Churchill; exemptions may apply; confirm with the county recorder).'],
              ['California', '$0.55 for each $500 of value, charged by the county (Revenue and Taxation Code 11911). Some cities add much more, such as Los Angeles, San Francisco and Oakland.'],
              ['Arizona', 'None. You pay the recorder’s recording fee (about $30 a document), which includes Arizona’s $2 state transfer fee (A.R.S. 11-475 and 11-1132).'],
              ['Utah', 'None. You pay the county recorder’s recording fees.'],
              ['Texas', 'None, and the state constitution bars new transfer taxes (article VIII, section 29). You pay recording fees and the title insurance premium the state sets.'],
            ],
          },
        },
        'Buying also changes the property tax bill. The seller’s bill often doesn’t predict yours; the lesson on analyzing a deal shows how each state resets or caps it.',
        { links: [{ label: 'Your tax bill after you buy', url: '#/learn/analyze', what: 'How each state changes the bill when a property sells or becomes a rental.' }] },
      ],
    },
    {
      heading: 'While you own it: property tax and appeals',
      blocks: [
        'Property tax can be one of your largest costs after the loan. Put the bill for your use (a rental, not the seller’s home) in your numbers, and check each year’s notice of value.',
        'If the county’s value is too high, you can appeal it, but only within a short window after the notice of value arrives. The notice gives the deadline and where to file. Bring sold comparables and photos of anything that lowers the value.',
        'In Texas, you protest to the appraisal review board by May 15, or 30 days after the notice was delivered if that’s later (Tax Code 41.44).',
      ],
    },
    {
      heading: 'Owning a rental: income, deductions and depreciation',
      blocks: [
        'You normally report rental income and expenses on Schedule E. Rent, fees and any part of a deposit you keep are income. Mortgage interest, property tax, insurance, repairs, management, utilities you pay, travel to the property and many other costs are deductible (IRS Publication 527).',
        'Depreciation is a deduction for the building wearing out, even while the rent covers every bill. You depreciate the building and its improvements, never the land:',
        { list: [
          'Under the usual depreciation schedule, a residential rental building over 27.5 years and a commercial building over 39 years. Other schedules can apply (IRS Publication 946).',
          'Example: a $300,000 rental where the land is worth $60,000 has $240,000 of building to depreciate. That’s about $8,727 for a full year. The first and last years are adjusted for when it enters or leaves rental use.',
          'A repair that keeps the property in working order is generally a current expense. An improvement that makes it better, longer-lasting or fit for a new use (a new roof, an addition) is generally depreciated over years. Your tax advisor can check the treatment and timing.',
          'A cost segregation study splits the price into parts with shorter lives (appliances, carpet, landscaping, paving). Eligible shorter-lived parts acquired and placed in service after January 19, 2025 can qualify for 100% bonus depreciation in the first year. Acquisition, use and other rules apply; the building itself doesn’t qualify (IRS Notice 2026-11). Studies cost money and make the most sense on larger properties; ask a CPA.',
        ] },
        'Rental losses usually can’t offset your wages. A rental is a passive activity, so losses mostly offset passive income. If you actively manage it, you can deduct up to $25,000 of losses against other income, and that shrinks to zero as your modified income goes from $100,000 to $150,000. Losses you can’t use carry forward. They’re generally freed up when you sell your whole interest in a fully taxable sale to an unrelated buyer; a 1031 exchange or installment sale changes that (IRS Publication 925).',
        'A real estate professional (more than half of your working time, and more than 750 hours a year, in real property businesses where you materially participate) isn’t limited this way for the rentals you also materially participate in; the IRS looks at each rental separately unless you elect to group them. The test is strict and the IRS checks time logs (26 U.S.C. 469(c)(7)).*',
        'Higher earners can also owe a 3.8% tax on the smaller of their net investment income or the amount their modified adjusted gross income exceeds the threshold: $200,000 for single or head-of-household filers, $250,000 married filing jointly, or $125,000 married filing separately. Rent and gains can count as investment income; exceptions apply (IRS guidance).',
      ],
    },
    {
      heading: 'Flipping: taxed like a business',
      blocks: [
        'A flip is usually taxed very differently from a rental, and many first flippers find out after the sale.',
        { list: [
          'Property you hold mainly to sell to customers isn’t a capital asset.* The profit is ordinary income, taxed at the same rates as wages, and a gain on anything held one year or less is short-term anyway (IRS Publication 544 and Topic 409).',
          'If flipping is your business,* the profit can also owe self-employment tax (Social Security and Medicare, about 15.3% on most of it), while ordinary rental income generally doesn’t. Rentals with substantial tenant services, such as regular maid service, and real estate dealer activities can be exceptions (IRS Publication 527; 26 U.S.C. 1402).',
          'A flip can’t be traded tax-free in a 1031 exchange, and property held for sale to customers generally doesn’t qualify for the installment method. Special rules apply to certain residential lots and timeshares (IRS Publication 537).',
          'You don’t depreciate a flip. Count every buying, repair, holding and selling cost when you work out the profit. For taxes, ask your CPA which costs add to the property’s cost and which you can deduct as you go.',
        ] },
        'Example: a flip with a $60,000 profit after every cost could owe about $8,500 in self-employment tax plus income tax, depending on your other income and deductions, before any state tax. Put an estimated tax line in your flip numbers before you bid.',
      ],
    },
    {
      heading: 'Selling a rental',
      blocks: [
        { list: [
          'A rental held more than one year usually qualifies for the lower long-term capital gains rates (IRS Topic 409).',
          'Depreciation comes back. The part of the gain that comes from depreciation on the building is taxed at up to 25%, even if you never claimed it but could have (IRS Topic 409 and Publication 544).',
          'Selling costs (commission, title and escrow fees, transfer tax) come off the gain.',
          'If the buyer pays you over time, an installment sale can spread the tax over the years you’re paid. Recapture on shorter-lived parts, such as appliances, is still taxed in the year of sale (IRS Publication 537).',
        ] },
      ],
    },
    {
      heading: 'Trading up: the 1031 exchange',
      blocks: [
        'A 1031 exchange puts off the tax when you sell a rental or investment property and buy another one. The tax isn’t forgiven; it carries into the new property.',
        { list: [
          'Both properties must be held for investment or business use. Flips and your own home don’t qualify.',
          'You have 45 days after the sale to identify the replacement in writing, and 180 days to close on it, or until your tax return for the year of the sale is due, including extensions, if that’s sooner. Sell late in the year and you may need to file an extension to keep the full 180 days.',
          'Don’t take the money in between. A qualified intermediary holds the sale money and uses it to buy the replacement. If you receive the sale money, or can control it, before you get the replacement, the deal is generally treated as a taxable sale, not an exchange. Taking some cash out doesn’t have to end the exchange, though: it’s taxed as boot (next point), and the rest of the gain can still be deferred if the exchange is set up correctly.*',
          'Cash or other property that isn’t like-kind, or a drop in your debt, is “boot.” Gain is taxed up to the amount of the boot, but never more than your total gain, and the rest stays deferred. New borrowing or your own added cash can offset a drop in debt. Have your intermediary and CPA check the numbers before closing.',
          'Report the exchange on Form 8824 with your tax return for the year you trade (IRS instructions).',
        ] },
        'Example: you sell a rental for $400,000 with a $150,000 gain and buy a $500,000 replacement within the deadlines, through an intermediary. Assume all of the sale money goes into the new property, you take no cash out, and your new loan is at least as large as the one you paid off (or you add your own cash to make up the difference), so you receive no boot. Then no tax is due now, and the new property’s tax basis is lowered by the $150,000 you didn’t pay tax on. If you had taken $30,000 in cash out instead, $30,000 of the gain would be taxed now and $120,000 deferred.',
        'California keeps track of exchanges out of state: if you trade a California property for one in another state, you file FTB Form 3840 for the year of the exchange and generally each year afterward until the California deferred gain or loss is recognized for tax purposes. Another exchange can continue the reporting requirement; ask your tax professional how it applies to you.',
        { links: [{ label: 'CPAs and tax advisors', url: '#/pros/cpa', what: 'Plan an exchange before you list the property, not after.' }] },
      ],
    },
    {
      heading: 'Living in it first: the home-sale exclusion',
      blocks: [
        'You may qualify to exclude up to $250,000 of home-sale gain, or $500,000 married filing jointly. Usually, you need to own and use it as your main home for at least 2 of the 5 years before selling, and not have used the exclusion on another sale in the previous 2 years. For the joint $500,000 limit, both spouses generally need to meet the use test and at least one the ownership test. Check the full eligibility rules in IRS Publication 523.',
        'Two limits: depreciation you took while it was a rental is still taxed, and years it was a rental before you moved in can reduce the exclusion. Publication 523 shows the math.',
      ],
    },
    {
      heading: 'State income tax',
      blocks: [
        'You generally owe tax to the state where the property is, even if you live somewhere else, plus your home state may tax it too (with a credit).',
        {
          table: {
            head: ['State', 'Income tax on rent and gains'],
            rows: [
              ['Nevada', 'None.'],
              ['Texas', 'None. An LLC owes franchise tax only above $2.65 million of revenue (2026 and 2027 reports) but must still file a report every year.'],
              ['California', 'Gains are taxed as ordinary income, at rates up to 13.3%. Escrow usually holds back 3⅓% of the price on a sale over $100,000 as a prepayment, unless you qualify for an exemption on FTB Form 593. An LLC pays at least $800 a year.'],
              ['Arizona', 'A flat 2.5% (A.R.S. 43-1011.01). For long-term capital gains on assets bought after December 31, 2011, you subtract 25% of the gain first, so the effective rate on those gains is about 1.9% (A.R.S. 43-1022(22)).'],
              ['Utah', 'A flat 4.45% for 2026, lowered from 4.5% (S.B. 60).'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Owning through an LLC',
      blocks: [
        'A single-member LLC doesn’t change your federal income tax by default: the rental still goes on your own return. It can limit liability, but it adds yearly state fees and filings, can complicate loans, and doesn’t protect you from your own mistakes. Decide with an attorney and a CPA.',
        { links: [{ label: 'Owning through an LLC', url: '#/learn/negotiate', what: 'Liability, loans and each state’s yearly LLC costs, in the lesson on negotiating and structuring deals.' }] },
      ],
    },
    {
      heading: 'Records to keep from day one',
      blocks: [
        { list: [
          'The closing statement from the purchase: it sets your starting basis.',
          'Every improvement, with receipts and dates, separate from repairs.',
          'Rent received, deposits held and returned, and every expense.',
          'Mileage and time logs, especially if you’ll claim real estate professional status.',
          'The closing statement from the sale, and any exchange paperwork.',
        ] },
        'Keep property records until the IRS assessment deadline for the sale year has passed: often three years, but longer in some cases. After a tax-deferred exchange, keep the old and new property records until you dispose of the replacement and that deadline passes. Other recordkeeping requirements may last longer (IRS guidance).',
      ],
    },
  ],
  terms: [
    { term: 'Basis', meaning: 'What you paid plus improvements, minus depreciation: the number your gain is measured from.' },
    { term: 'Depreciation', meaning: 'A yearly deduction for the wear on a building: 27.5 years for residential rentals, 39 for commercial buildings.' },
    { term: 'Depreciation recapture', meaning: 'Tax on the part of a gain that comes from depreciation. For a rental building it’s taxed at up to 25%.' },
    { term: 'Passive activity', meaning: 'A business you don’t materially participate in. Rentals count as passive even if you do participate, unless you qualify as a real estate professional. Its losses mostly offset only passive income.' },
    { term: 'Ordinary income', meaning: 'Income taxed at the regular rates, like wages. Flip profits usually are.' },
    { term: '1031 exchange', meaning: 'Trading one investment property for another while putting off the tax, through a qualified intermediary and within 45 days to identify and 180 days (or the tax return’s due date with extensions, if sooner) to close.' },
    { term: 'Qualified intermediary', meaning: 'The company that holds your sale money in a 1031 exchange so you never receive it.' },
    { term: 'Cost segregation', meaning: 'A study that splits a building’s price into parts with shorter depreciation lives.' },
  ],
  tryIt: { label: 'Add an estimated tax line to your flip numbers', href: '#/analyze?plan=flip' },
  practice: 'For a property you’re looking at, write down the tax at each stage: transfer tax at closing, the property tax bill for a rental, and the tax if you sold it in a year versus in five. Take the list to a CPA.',
  sources: [
    { label: 'IRS Publication 527: residential rental property', url: 'https://www.irs.gov/publications/p527' },
    { label: 'IRS Publication 946: how to depreciate property', url: 'https://www.irs.gov/publications/p946' },
    { label: 'IRS Publication 925: passive activity and at-risk rules', url: 'https://www.irs.gov/publications/p925' },
    { label: 'IRS Publication 544: sales and other dispositions of assets', url: 'https://www.irs.gov/publications/p544' },
    { label: 'IRS Topic 409: capital gains and losses', url: 'https://www.irs.gov/taxtopics/tc409' },
    { label: 'IRS Publication 537: installment sales', url: 'https://www.irs.gov/publications/p537' },
    { label: 'IRS Publication 523: selling your home', url: 'https://www.irs.gov/publications/p523' },
    { label: 'IRS Publication 583: records to keep', url: 'https://www.irs.gov/publications/p583' },
    { label: 'IRS: how long to keep records, including exchanges', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records' },
    { label: 'IRS Notice 2026-11: bonus depreciation eligibility', url: 'https://www.irs.gov/pub/irs-drop/n-26-11.pdf' },
    { label: 'IRS: instructions for Form 8824 (like-kind exchanges)', url: 'https://www.irs.gov/instructions/i8824' },
    { label: 'IRS: net investment income tax', url: 'https://www.irs.gov/individuals/net-investment-income-tax' },
    { label: '26 U.S.C. 168: depreciation, including bonus depreciation (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/168' },
    { label: '26 U.S.C. 469: passive activity losses (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/469' },
    { label: '26 U.S.C. 453: installment method (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/453' },
    { label: '26 U.S.C. 1402: self-employment income (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/1402' },
    { label: 'Nevada: NRS 375 (real property transfer tax)', url: 'https://www.leg.state.nv.us/nrs/nrs-375.html' },
    { label: 'California FTB Publication 1016: real estate withholding guidelines', url: 'https://www.ftb.ca.gov/forms/misc/1016.html' },
    { label: 'California FTB Form 3840: like-kind exchanges of California property', url: 'https://www.ftb.ca.gov/file/personal/reporting-like-kind-exchanges.html' },
    { label: 'Arizona: A.R.S. 43-1011.01 (income tax rate)', url: 'https://www.azleg.gov/ars/43/01011.01.htm' },
    { label: 'Arizona: A.R.S. 43-1022 (subtractions, including the long-term capital gain subtraction)', url: 'https://www.azleg.gov/ars/43/01022.htm' },
    { label: 'Utah House: S.B. 60 (2026) income tax rate', url: 'https://house.utleg.gov/utahs-tax-cut-streak-six-years-and-1-5-billion/' },
    { label: 'Texas Tax Code 41.44: deadline to protest', url: 'https://statutes.capitol.texas.gov/Docs/TX/htm/TX.41.htm' },
    { label: 'Texas Comptroller: franchise tax', url: 'https://comptroller.texas.gov/taxes/franchise/' },
  ],
  reviewed: '2026-10-10',
};
