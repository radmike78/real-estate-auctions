import type { Lesson } from './types';

export const veterans: Lesson = {
  key: 'veterans',
  minutes: 10,
  intro: 'Military service brings real estate benefits that can lower what you pay to buy, borrow and own. This lesson starts with the federal benefits that apply in every state, then covers the property tax and home-buying programs in Nevada, California, Arizona and Utah. Amounts change every year, so check with the agency before you count on one.',
  takeaways: [
    'What a VA home loan offers, and why it’s for a home you live in, not a pure rental.',
    'How veterans who receive VA disability compensation skip the VA funding fee.',
    'How the Servicemembers Civil Relief Act affects landlords and auction buyers.',
    'Your state’s property tax exemptions for veterans and disabled veterans, and how to apply.',
  ],
  sections: [
    {
      heading: 'VA home loans',
      blocks: [
        'A VA home loan comes from a private lender, and the Department of Veterans Affairs guarantees part of it. To use one, you need a Certificate of Eligibility, which shows you meet the service requirements.',
        { list: [
          'No down payment if you have full entitlement and the price isn’t above the appraised value. If part of your entitlement is still tied up in another VA loan, the lender may ask for a down payment. You still need the lender’s approval, and cash for closing costs unless the seller pays them.',
          'No private mortgage insurance (PMI), and no prepayment penalty.',
          'No loan limit if you have full entitlement. If part of your entitlement is still tied up in another VA loan, your county’s limit affects how much you can borrow with no down payment. Lenders still need you to qualify on income and credit.',
          'A one-time VA funding fee, unless you’re exempt.',
        ] },
        {
          table: {
            head: ['Funding fee on a purchase', 'First use', 'After first use'],
            rows: [
              ['Less than 5% down', '2.15%', '3.3%'],
              ['5% or more down', '1.5%', '1.5%'],
              ['10% or more down', '1.25%', '1.25%'],
            ],
          },
        },
        'These rates have applied since April 7, 2023.',
        'Veterans with a VA disability rating often pay no funding fee. You’re exempt if you receive VA disability compensation, or would receive it if you weren’t taking retirement or active-duty pay instead. Surviving spouses who receive Dependency and Indemnity Compensation are exempt too, and so are active-duty service members who received a Purple Heart. If VA later awards compensation back to a date before your closing, you can get the fee refunded (38 U.S.C. 3729).',
      ],
    },
    {
      heading: 'The catch: you have to live there',
      blocks: [
        'A VA loan is for a home you’ll live in. When you apply, and again at closing, you confirm in writing that you intend to move in within a reasonable time (38 U.S.C. 3704). While you’re on active duty, a spouse or dependent child living there can meet this rule for you. A VA loan can’t buy a property that will only be a rental.',
        'Within that rule, veterans still have room to invest:',
        { list: [
          'Buy 1 to 4 units and live in one, often called house hacking. A lender can count rent from the other units only if you show you’re likely to succeed as a landlord and have 6 months of payments in reserve. Then it counts 75% of the lease rent (38 CFR 36.4340).',
          'Use your entitlement again. You get it back when you sell and pay off the loan, or when a veteran buyer takes over your loan and substitutes their own entitlement. You can also get it back once if you pay off the loan and keep the home. Even without that, you may have entitlement left over to buy another home to live in.',
          'Refinance a former home that’s now a rental. VA’s streamline refinance (IRRRL) works on a home you live in or used to live in. A VA cash-out refinance requires that you live there now.',
          'Sell with an assumable loan. Any buyer, veteran or not, can take over a VA loan, as long as the payments are current and the buyer qualifies for credit. When that happens, you’re released from liability. Your entitlement comes back only if the buyer is a veteran who substitutes theirs (38 U.S.C. 3714).',
        ] },
      ],
    },
    {
      heading: 'Protections landlords and auction buyers should know',
      blocks: [
        'The Servicemembers Civil Relief Act (SCRA) protects people on active duty. It matters whether you’re the service member or the investor on the other side.',
        { list: [
          'Interest cap: debts taken out before active duty, including mortgages, are capped at 6% interest. For a mortgage, the cap lasts through service and 1 year after (50 U.S.C. 3937).',
          'Auction buyers: if the owner took out the mortgage before their military service, a sale or foreclosure for missed payments during service, or within 1 year after, isn’t valid without a court order (50 U.S.C. 3953). The Department of Justice says this covers non-judicial foreclosures too. Trustees and lenders check military status in the Defense Department’s SCRA database. Ask your title company whether the sale complied before you bid.',
          'Landlords: a tenant who enters military service, or who gets orders for a permanent move or a deployment of 90 days or more, can end the lease early with no fee. With monthly rent, the lease ends 30 days after the next rent due date following the notice (50 U.S.C. 3955).',
          'Landlords: you can’t evict a service member or their dependents during military service without a court order. This covers homes renting below a ceiling that’s updated each year: $10,542.60 a month in 2026 (50 U.S.C. 3951).',
        ] },
      ],
    },
    {
      heading: 'Selling a home you rented out',
      blocks: [
        'When you sell your home, you may be able to leave the gain out of your federal income tax. To do that, you generally must have owned it and lived in it for 2 of the 5 years before the sale. You can pause that 5-year period for up to 10 years if you or your spouse are on qualified official extended duty. That means orders for more than 90 days, at a duty station at least 50 miles from the home or in government housing. This pause can let a service member rent out a former home and still qualify when they sell. Depreciation from the rental years can’t be excluded (IRS Publication 523).',
      ],
    },
    {
      heading: 'Housing grants for veterans with disabilities',
      blocks: [
        'VA’s housing grants help veterans with certain service-connected disabilities buy, build or change a home they’ll live in. For fiscal year 2026, a Specially Adapted Housing (SAH) grant was up to $126,526, and a Special Housing Adaptation (SHA) grant was up to $25,350. VA updates the amounts each October (fiscal year 2026 ended September 30, 2026), so check VA for the current amounts. They’re for your own home, not rental property.',
      ],
    },
    {
      heading: 'Benefits in your state',
      blocks: [
        'Each state sets its own property tax exemptions and home-buying help. Choose your state above to see only its programs.',
        { list: [
          'In Nevada, a qualifying veteran can take $3,640 off the assessed value of their property for the 2026-27 fiscal year (NRS 361.090). To qualify, you must have served at least 90 days of active duty, with part of it in a period the law lists or in a campaign that earned a medal, and been honorably discharged. The exemption can go on property tax or vehicle tax. Apply with your county assessor. To use it on your property tax bill, file by June 15.',
          'In Nevada, a veteran with a permanent service-connected disability of 60% or more can take a larger exemption instead of the one above (NRS 361.091). For 2025-26 it was $18,200 of assessed value at 60 to 79%, $27,300 at 80 to 99%, and $36,400 at 100%. It rises every year. A qualifying surviving spouse can also claim it.',
          'In Nevada, the Nevada Housing Division’s Home Is Possible programs offer veterans down payment help. First-time or repeat buyers can get up to 5% of the loan amount. Buyers who haven’t owned a home in the past 3 years can get up to 4%.',
          'In California, a veteran rated 100% disabled, or paid at the 100% rate because of unemployability, can exempt part of their home’s assessed value. The exemption is $180,671 for 2026, or $271,009 if household income is $81,131 or less (Revenue and Taxation Code 205.5). It covers only the home you live in, not a rental. File form BOE-261-G with your county assessor. You must claim the low-income amount again each year by February 15.',
          'In California, a $4,000 Veterans’ Exemption is open to veterans who own little other property: no more than $5,000, or $10,000 if married. File form BOE-261 by February 15 each year.',
          'In California, CalVet Home Loans buy the home and sell it to the veteran under a purchase contract. You or your family must move in within 60 days. The home can have 2 to 4 units if you live in one. The down payment is at least 2% in most cases, and the term can run up to 40 years. You need CalVet’s written consent to rent the home out (Military and Veterans Code 987.50 and following).',
          'In Arizona, starting with tax year 2026, a veteran rated 100% service-connected disabled, or unemployable, pays no property tax on their primary residence (A.R.S. 42-11111).',
          'In Arizona, other veterans with a disability get a partial exemption: for 2026, $4,873 of assessed value times their disability percentage.',
          'In Arizona, apply with your county assessor. The income and property value limits in A.R.S. 42-11111 apply to the widow, widower and total-disability exemptions, not to the veteran exemptions. A surviving spouse claiming under the veteran’s rating should confirm with the assessor.',
          'In Utah, a veteran with a service-connected disability of at least 10% can exempt part of their primary residence’s taxable value. The amount is in proportion to their rating. At 100%, the maximum was $521,620 of taxable value in 2025, and it’s raised every year. Apply with your county by September 1.',
          'In Utah, an active or reserve duty member can exempt the full taxable value of their primary residence. To qualify, they must have served at least 200 days in a continuous 365-day period outside the state. Apply by September 1 of the year after that service.',
          'In Utah, the Department of Veterans and Military Affairs offers a $2,500 grant for buying a first home in Utah. It’s open to veterans who separated in the last 5 years, and to current service members. You must live in the home. The Legislature sets the funding, and it can run out, so check before you count on it.',
        ] },
      ],
    },
  ],
  terms: [
    { term: 'Certificate of Eligibility (COE)', meaning: 'VA’s proof that you meet the service requirements for a VA home loan.' },
    { term: 'Entitlement', meaning: 'The amount VA will guarantee for you. It’s tied up while a VA loan is open, and can be restored.' },
    { term: 'Funding fee', meaning: 'A one-time fee on a VA loan; veterans receiving VA disability compensation don’t pay it.' },
    { term: 'House hacking', meaning: 'Buying a 2 to 4 unit property, living in one unit and renting the others.' },
    { term: 'SCRA', meaning: 'The Servicemembers Civil Relief Act: protections for people on active duty, including on mortgages, leases and evictions.' },
    { term: 'Assessed value', meaning: 'The value the county taxes. Many exemptions take a set amount off it.' },
  ],
  tryIt: { label: 'Run the numbers on a house hack in the deal calculator', href: '#/analyze?plan=rent' },
  sources: [
    { label: 'VA: eligibility for a VA home loan', url: 'https://www.va.gov/housing-assistance/home-loans/eligibility/' },
    { label: 'VA: purchase loans', url: 'https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/' },
    { label: 'VA: loan limits and entitlement', url: 'https://www.va.gov/housing-assistance/home-loans/loan-limits/' },
    { label: 'VA: funding fee and closing costs', url: 'https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/' },
    { label: 'VA: Interest Rate Reduction Refinance Loan', url: 'https://www.va.gov/housing-assistance/home-loans/loan-types/interest-rate-reduction-loan/' },
    { label: 'VA: cash-out refinance loan', url: 'https://www.va.gov/housing-assistance/home-loans/loan-types/cash-out-loan/' },
    { label: 'VA: disability housing grants', url: 'https://www.va.gov/housing-assistance/disability-housing-grants/' },
    { label: '38 U.S.C. 3704: occupancy', url: 'https://www.law.cornell.edu/uscode/text/38/3704' },
    { label: '38 U.S.C. 3714: assumptions', url: 'https://www.law.cornell.edu/uscode/text/38/3714' },
    { label: '38 U.S.C. 3729: funding fee and exemptions', url: 'https://www.law.cornell.edu/uscode/text/38/3729' },
    { label: '38 CFR 36.4340: underwriting, including rental income', url: 'https://www.law.cornell.edu/cfr/text/38/36.4340' },
    { label: 'Department of Justice: servicemembers’ financial and housing rights', url: 'https://www.justice.gov/servicemembers/financial-and-housing-rights-0' },
    { label: '50 U.S.C. 3937: 6% interest cap', url: 'https://www.law.cornell.edu/uscode/text/50/3937' },
    { label: '50 U.S.C. 3951: evictions', url: 'https://www.law.cornell.edu/uscode/text/50/3951' },
    { label: '50 U.S.C. 3953: mortgages and foreclosures', url: 'https://www.law.cornell.edu/uscode/text/50/3953' },
    { label: '50 U.S.C. 3955: ending a lease', url: 'https://www.law.cornell.edu/uscode/text/50/3955' },
    { label: 'Federal Register: 2026 SCRA housing price adjustment', url: 'https://www.federalregister.gov/documents/2026/03/10/2026-04689/notice-of-publication-of-housing-price-inflation-adjustment' },
    { label: 'IRS Publication 523: selling your home', url: 'https://www.irs.gov/publications/p523' },
    { label: 'Nevada: NRS 361 (veteran exemptions, 361.090 and 361.091)', url: 'https://www.leg.state.nv.us/NRS/NRS-361.html' },
    { label: 'Nevada: Douglas County Assessor, veteran exemption amounts', url: 'https://www.douglascountynv.gov/GOVERNMENT/departments/assessor/assessors-online-services/exemptions/veteran_exemption' },
    { label: 'Nevada: Home Is Possible for veterans (Nevada Housing Division)', url: 'https://www.homeispossiblenv.org/veterans' },
    { label: 'California: Board of Equalization, Disabled Veterans’ Exemption', url: 'https://www.boe.ca.gov/proptaxes/dv_exemption.htm' },
    { label: 'California: Board of Equalization, 2026 exemption amounts (LTA 2025/014)', url: 'https://boe.ca.gov/proptaxes/pdf/lta25014.pdf' },
    { label: 'California: Board of Equalization, Veterans’ Exemption', url: 'https://www.boe.ca.gov/proptaxes/veterans_exemption.htm' },
    { label: 'California: Revenue and Taxation Code 205.5', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=205.5' },
    { label: 'California: Military and Veterans Code, CalVet purchase contracts', url: 'https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=MVC&division=4.&title=&part=&chapter=6.&article=3.1' },
    { label: 'Arizona: A.R.S. 42-11111 (veteran exemptions)', url: 'https://www.azleg.gov/ars/42/11111.htm' },
    { label: 'Arizona: Mohave County Assessor, 2026 exemption amounts', url: 'https://www.mohave.gov/departments/assessor/program-enrollment/exemptions/' },
    { label: 'Utah: State Tax Commission, property tax relief table', url: 'https://files.tax.utah.gov/propertytax/media/tax-relief.pdf' },
    { label: 'Utah: Utah Housing, veteran homebuyer grant FAQ', url: 'https://utahhousingcorp.org/pdf/Veteran_Grant_FAQ.pdf' },
  ],
  practice: 'Ask your county assessor’s or treasurer’s office which exemptions you qualify for, and the deadline to apply.',
  reviewed: '2026-10-02',
};
