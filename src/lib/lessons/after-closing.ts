import type { Lesson } from './types';

export const afterClosing: Lesson = {
  key: 'after-closing',
  minutes: 9,
  intro: 'Most real estate education stops at closing, but that’s when the work starts. This lesson covers the first weeks of owning a rental, finding and screening tenants within fair housing law, your state’s rules on deposits, entry and rent increases, and keeping the records your taxes need.',
  takeaways: [
    'What to do in the first weeks after you buy.',
    'How to screen tenants without breaking fair housing law.',
    'Your state’s limits on security deposits and the deadline to return them.',
    'How much notice you must give before entering, and any limits on raising rent.',
    'The records and tax forms a rental needs.',
  ],
  sections: [
    {
      heading: 'The first weeks',
      blocks: [
        { list: [
          'Have insurance in place from the day you take ownership: a landlord policy, not a homeowner’s policy.',
          'Once you have legal possession, change or rekey the locks and put utilities you’ll pay in your name.',
          'Open a separate bank account for the property, and keep every receipt from the purchase and repairs.',
          'Finish the repairs a tenant needs before you advertise: safety items first.',
          'Set aside a cash reserve for repairs and vacancies before you count any profit.',
        ] },
      ],
    },
    {
      heading: 'Finding and screening tenants',
      blocks: [
        'Use the same written criteria for every applicant, such as income, rental history and credit, and apply them the same way. The federal Fair Housing Act bans discrimination because of race, color, national origin, religion, sex, familial status or disability. State and local laws can add more protected groups.',
        'For housing built before 1978, landlords must disclose known lead-based paint and hazards, and give tenants the EPA’s lead pamphlet, before the lease is signed.',
        'Use a written lease that follows your state’s landlord-tenant law. A local property manager or real estate attorney can help with both.',
        { links: [
          { label: 'Property managers', url: '#/pros/property_manager', what: 'What they do, how they’re paid and what to check before you hire one.' },
          { label: 'Eviction attorneys', url: '#/pros/eviction', what: 'When you need one and how the process works.' },
        ] },
      ],
    },
    {
      heading: 'Security deposits in your state',
      blocks: [
        {
          table: {
            head: ['State', 'Most you can collect', 'Deadline to return it'],
            rows: [
              ['Nevada', '3 months’ rent (NRS 118A.242)', '30 days after the tenancy ends, with an itemized list of deductions'],
              ['California', '1 month’s rent for deposits collected from July 1, 2024. A landlord who is a person, or an LLC of people, with no more than two rental properties and four units may collect up to 2 months, but not from a service member (Civil Code 1950.5).', '21 days after the tenant moves out, with an itemized statement. Landlords must also photograph the unit at move-in and move-out.'],
              ['Arizona', '1½ months’ rent (A.R.S. 33-1321)', '14 days, not counting weekends and holidays, after the tenancy ends and the tenant asks'],
              ['Utah', 'We couldn’t confirm a limit in Utah law. Check Utah Code Title 57, Chapter 17, or the Utah courts’ self-help center.', '30 days after the tenant moves out (Utah courts)'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Entering the unit and raising the rent',
      blocks: [
        { list: [
          'In Nevada, give at least 24 hours’ notice before entering, and enter only at reasonable times during normal business hours, except in an emergency (NRS 118A.330). There’s no statewide rent control.',
          'In California, give reasonable written notice before entering; 24 hours is presumed reasonable (Civil Code 1954). The Tenant Protection Act limits most rent increases to 5% plus inflation, never more than 10%, in 12 months, and after a tenant has lived there 12 months you need a just cause to end the tenancy. Some properties are exempt, and both rules run until January 1, 2030 (Civil Code 1947.12 and 1946.2). Some cities have stricter rules.',
          'In Arizona, give at least two days’ notice before entering, except in an emergency (A.R.S. 33-1343). State law doesn’t let cities or towns control rents (A.R.S. 33-1329).',
          'In Utah, follow the entry notice in your lease and Utah’s landlord-tenant laws; the Utah courts’ self-help center explains them.',
        ] },
      ],
    },
    {
      heading: 'Records and taxes',
      blocks: [
        'You normally report rental income and expenses on Schedule E. The building, but not the land, is depreciated over 27.5 years for residential rental property, and many repairs and costs are deductible (IRS Publication 527). Keep records of what you paid, every improvement and every expense, and talk with a tax advisor before your first tax return as a landlord.',
        { links: [{ label: 'CPAs and tax advisors', url: '#/pros/cpa', what: 'When you need one, and what to ask.' }] },
      ],
    },
    {
      heading: 'Every year',
      blocks: [
        { list: [
          'Compare your actual income and costs with what you planned.',
          'Shop your insurance and check your property tax bill.',
          'Walk the property, and replace big items before they fail.',
          'Check rent against similar homes, within your state’s limits.',
          'Decide whether to keep it, refinance or sell, with your advisors.',
        ] },
      ],
    },
  ],
  terms: [
    { term: 'Security deposit', meaning: 'Money a tenant pays up front to cover unpaid rent or damage, returned with an itemized list of any deductions.' },
    { term: 'Fair housing', meaning: 'Laws that ban discrimination in renting and selling housing.' },
    { term: 'Just cause', meaning: 'A reason the law accepts for ending a tenancy, such as unpaid rent.' },
    { term: 'Depreciation', meaning: 'A yearly tax deduction for the wear on a building, spread over its set recovery period.' },
    { term: 'Schedule E', meaning: 'The IRS form where most landlords report rental income and expenses.' },
  ],
  tryIt: { label: 'Run your rental numbers in the Deal Lab', href: '#/analyze' },
  sources: [
    { label: 'HUD: Fair Housing Act overview', url: 'https://www.hud.gov/helping-americans/fair-housing-act-overview' },
    { label: 'EPA: lead-based paint disclosure rule', url: 'https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x' },
    { label: 'IRS Publication 527: residential rental property', url: 'https://www.irs.gov/publications/p527' },
    { label: 'Nevada: NRS 118A (landlord and tenant, deposits and entry)', url: 'https://www.leg.state.nv.us/nrs/nrs-118a.html' },
    { label: 'California: Civil Code 1950.5 (security deposits)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5' },
    { label: 'California: Civil Code 1954 (entry)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1954' },
    { label: 'California: Civil Code 1947.12 (rent increases)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1947.12' },
    { label: 'California: Civil Code 1946.2 (just cause)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1946.2' },
    { label: 'Arizona: A.R.S. 33-1321 (security deposits)', url: 'https://www.azleg.gov/ars/33/01321.htm' },
    { label: 'Arizona: A.R.S. 33-1343 (entry)', url: 'https://www.azleg.gov/ars/33/01343.htm' },
    { label: 'Arizona: A.R.S. 33-1329 (no local rent control)', url: 'https://www.azleg.gov/ars/33/01329.htm' },
    { label: 'Utah courts: refunding deposits', url: 'https://www.utcourts.gov/en/self-help/case-categories/housing/landlord/refunding-deposits.html' },
  ],
  reviewed: '2026-10-03',
};
