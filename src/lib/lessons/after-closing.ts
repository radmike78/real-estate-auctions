import type { Lesson } from './types';

export const afterClosing: Lesson = {
  key: 'after-closing',
  minutes: 13,
  intro: 'Most real estate education stops at closing, but that’s when the work starts. This lesson walks you through the first weeks of owning a rental and how to find and screen tenants within fair housing law. Then it covers your state’s rules on deposits, entry, rent increases, short-term rentals and unpaid rent, the records your taxes need, and the tax when you sell.',
  takeaways: [
    'What to do in the first weeks after you buy.',
    'How to screen tenants without breaking fair housing law.',
    'Your state’s limits on security deposits and the deadline to return them.',
    'How much notice you must give before entering, and any limits on raising rent.',
    'Whether your state, city or county lets you rent a home by the night.',
    'The notice your state requires when rent is unpaid, and why you never lock a tenant out yourself.',
    'The records a rental needs, and how the profit is taxed when you sell.',
  ],
  sections: [
    {
      heading: 'The first weeks',
      blocks: [
        { list: [
          'Have insurance in place from the day you take ownership: a landlord policy, not a homeowner’s policy.',
          'Once you have legal possession, change or rekey the locks and put utilities you’ll pay in your name. If a tenant stays, don’t change their unit’s locks: their lease continues.',
          'Open a separate bank account for the property, and keep every receipt from buying it and from repairs.',
          'Finish the repairs a tenant needs before you advertise: safety items first.',
          'Set aside a cash reserve for repairs and vacancies before you count any profit.',
        ] },
      ],
    },
    {
      heading: 'Finding and screening tenants',
      blocks: [
        'Use the same written criteria for every applicant, such as income, rental history and credit, and apply them the same way. The federal Fair Housing Act bans discrimination because of race, color, national origin, religion, sex, familial status or disability. State and local laws can add more protected groups.',
        'For housing built before 1978, landlords must do two things before the lease is signed: tell tenants about any lead-based paint and hazards they know of, and give them the EPA’s lead pamphlet. The lease needs the federal Lead Warning Statement, a list of any lead records or reports, and the tenant’s signed acknowledgment. Keep a copy for three years.',
        'If you turn someone down, or ask for a cosigner, a bigger deposit or higher rent, because of a credit or screening report, federal law says you must tell them. Give the screening company’s name, address and phone number. Say that the company didn’t make the decision and can’t explain it. Tell them they can get a free copy of their report within 60 days and dispute anything wrong. If you used a credit score, more is required, including the score itself. Written notice is best, so you have a record (FTC: Using Consumer Reports: What Landlords Need to Know).',
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
              ['California', '1 month’s rent for deposits collected from July 1, 2024. Some small landlords may collect up to 2 months: a landlord who is a person, or an LLC of people, with no more than two rental properties and four units. Even they can’t collect the higher amount from a service member (Civil Code 1950.5).', '21 days after the tenant moves out, with an itemized statement. Since April 1, 2025, landlords must photograph the unit before and after repairs or cleaning they deduct for. For tenancies starting on or after July 1, 2025, they must also photograph it at move-in.'],
              ['Arizona', '1½ months’ rent (A.R.S. 33-1321)', '14 days, not counting weekends and holidays, after the tenancy ends, the tenant moves out and the tenant asks. Mail an itemized list of deductions with any refund'],
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
          'In California, give reasonable written notice before entering. The law assumes 24 hours is reasonable (Civil Code 1954). The Tenant Protection Act limits most rent increases in 12 months to 5% plus inflation, never more than 10%. It also says that after a tenant has lived there 12 months, you need a just cause to end the tenancy (if another adult joined the lease within the first 24 months, once all tenants reach 12 months or any tenant reaches 24). Some properties are exempt. Both rules run until January 1, 2030 (Civil Code 1947.12 and 1946.2). Some cities have stricter rules.',
          'In Arizona, give at least two days’ notice before entering, except in an emergency (A.R.S. 33-1343). State law doesn’t let cities or towns control rents (A.R.S. 33-1329).',
          'In Utah, give at least 24 hours’ notice before you enter, unless your rental agreement sets a different rule (Utah Code 57-22-4). The Utah courts’ self-help center explains the rest of Utah’s landlord-tenant law.',
        ] },
      ],
    },
    {
      heading: 'Can I rent it short-term?',
      blocks: [
        'A short-term rental is a home rented by the night or week, usually for fewer than 30 days in a row. Cities, counties and HOAs control them, and the rules change often. Many beginners plan on nightly rent and then find they can’t get a license.',
        {
          table: {
            head: ['State', 'What state law says', 'Local rules to check (examples)'],
            rows: [
              ['Nevada', 'In Clark County, Nevada, a short-term rental needs a county or city license plus a state business license. State law requires at least 660 feet between short-term rentals and 2,500 feet from a resort hotel. A home in an HOA can’t get a license unless the HOA’s documents expressly allow it. Renting without a license can bring a fine of $1,000 to $10,000 for each violation (NRS 244.353545).', 'Unincorporated Clark County: 1,000 feet between rentals, a cap of 1% of the homes in each area, and each owner may hold an interest in only one license. The county has proposed stricter rules, so check the current ordinance. City of Las Vegas: the owner must live in the home during every guest stay, and the home can have no more than three bedrooms.'],
              ['California', 'California has no single statewide rule. Each city sets its own.', 'City of Los Angeles: you can rent short-term only in your primary residence, where you live more than six months a year. The limit is 120 days a year unless the city approves more. You must register and show the registration number on every listing. Other California cities differ, so check with the city first.'],
              ['Arizona', 'Arizona cities, towns and counties can’t ban short-term rentals. They can require a local permit (the fee can’t be more than $250 or the cost of issuing it, whichever is less), a state transaction privilege tax (TPT) license and $500,000 of liability insurance (A.R.S. 9-500.39 and 11-269.17).', 'An Arizona HOA can ban rentals in its declaration (A.R.S. 33-1806.01). Read the HOA documents, and ask the city or town about its permit.'],
              ['Utah', 'A Utah city can require a business license or permit for a short-term rental, which Utah defines as fewer than 30 days in a row. It can’t punish you only for listing a rental online, but it can use the listing as evidence along with other information (Utah Code 10-8-85.4).', 'Check the city’s zoning and license rules. In Utah, a short-term rental also loses the 45% residential property tax exemption, which can raise the tax a lot (Utah Code 59-2-102 and 59-2-103).'],
            ],
          },
        },
        'Never buy a home that only works as a nightly rental before you confirm a license is possible.',
      ],
    },
    {
      heading: 'If a tenant stops paying',
      blocks: [
        'Eviction is a court process. It starts with a written notice, and each state sets its own notice period and form. Use your state’s form, or ask an eviction attorney or your local court’s self-help center.',
        {
          table: {
            head: ['State', 'Notice for unpaid rent', 'What to know'],
            rows: [
              ['Nevada', '7 judicial days (court days) to pay or leave (NRS 40.2512 and 40.253)', 'Clark County says an eviction can take anywhere from 10 to 180 days.'],
              ['California', '3 days, not counting Saturdays, Sundays and court holidays (Code of Civil Procedure 1161)', 'Then you file an unlawful detainer case in court. Since January 1, 2025, the tenant has 10 days, not counting weekends and court holidays, to answer it (CCP 1167).'],
              ['Arizona', '5 days after written notice (A.R.S. 33-1368)', 'Then you file a special detainer case. If the tenant pays all past-due rent and a reasonable late fee from the written lease before you file, the lease continues.'],
              ['Utah', '3 business days to pay or leave (Utah Code 78B-6-802)', 'Then you file an unlawful detainer case in court.'],
            ],
          },
        },
        'Never change the locks, cut off utilities or remove a tenant’s belongings yourself. All four states forbid it, and the tenant can sue you for damages (Nevada NRS 118A.390, California Civil Code 789.3, Arizona A.R.S. 33-1367, Utah Code 78B-6-814). Only a sheriff or constable carries out a court’s eviction order.',
        'Plan for it before you buy. Budget for months of lost rent and legal costs, not weeks. Keep enough cash to pay the mortgage, taxes and insurance while the case runs.',
        { links: [{ label: 'Eviction attorneys', url: '#/pros/eviction', what: 'When you need one and how the process works.' }] },
      ],
    },
    {
      heading: 'Records and taxes',
      blocks: [
        'You normally report rental income and expenses on Schedule E. For residential rental property, you depreciate the building, but not the land, over 27.5 years. Many repairs and costs are deductible (IRS Publication 527). Rental losses usually can’t offset your wages: active landlords can deduct up to $25,000, and that shrinks to zero as modified income goes from $100,000 to $150,000 (IRS Publication 925). Depreciation also lowers your cost basis, and when you sell, that part of the gain is taxed at up to 25%. Keep records of what you paid, every improvement and every expense. Talk with a tax advisor before your first tax return as a landlord.',
        { links: [{ label: 'CPAs and tax advisors', url: '#/pros/cpa', what: 'When you need one, and what to ask.' }] },
      ],
    },
    {
      heading: 'When you sell',
      blocks: [
        'How long you held a property, and why you bought it, decide how the profit is taxed.',
        { list: [
          'A flip is usually taxed like wages, at ordinary income rates, because property you hold mainly to sell to customers in your business isn’t a capital asset. And any gain on property held one year or less is short-term, which is taxed at ordinary rates too (IRS Publication 544 and Topic 409).',
          'A rental you held more than one year usually qualifies for the lower long-term capital gains rates (IRS Topic 409).',
          'Depreciation comes back when you sell. The part of the gain that comes from depreciation on a building (“unrecaptured section 1250 gain”) is taxed at up to 25% (IRS Topic 409).',
          'A 1031 exchange can put off the tax when you trade one rental or investment property for another. It doesn’t apply to property held mainly for sale, like a flip, and it has strict 45-day and 180-day deadlines (Form 8824 instructions).',
        ] },
        'In California, escrow usually holds back 3⅓% of the sales price for the state when the price is over $100,000. It’s a prepayment toward your California income tax, not an extra tax. You can claim an exemption on FTB Form 593, for example if you sell at a loss or zero gain, if it was your main home, or in a qualifying 1031 exchange. You can also choose to have the withholding figured on your estimated gain instead. Example: a California flip that sells for $600,000 can have $20,000 held back from your check.',
        'Plan the tax before you buy. Put an estimated tax on profit into your flip numbers, and talk with a tax advisor before you sell.',
        { links: [
          { label: '1031 exchange basics', url: '#/learn/negotiate', what: 'Deadlines and what qualifies, in “Structuring tools”.' },
          { label: 'CPAs and tax advisors', url: '#/pros/cpa', what: 'When you need one, and what to ask.' },
        ] },
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
    { term: 'Short-term rental', meaning: 'A home rented by the night or week, usually for fewer than 30 days in a row. Most cities and counties require a license.' },
    { term: 'Unlawful detainer', meaning: 'The court case a landlord files to get possession back from a tenant. Arizona calls it a special detainer.' },
    { term: 'Depreciation recapture', meaning: 'Tax on the part of your gain that comes from depreciation you took. For a rental building it’s taxed at up to 25%.' },
  ],
  tryIt: { label: 'Run your rental numbers in the Deal Lab', href: '#/analyze?plan=rent' },
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
    { label: 'Nevada: NRS 244.353545 (short-term rentals in Clark County)', url: 'https://www.leg.state.nv.us/nrs/nrs-244.html' },
    { label: 'Clark County: short-term rental FAQ (unincorporated county)', url: 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:8e756291-fe2f-4e6f-9fe5-f3ea3acc52a5/original/as/str-faqs.pdf' },
    { label: 'Clark County: proposed short-term rental amendments', url: 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:d77079bd-28c5-47cf-84cc-fc6ab6f10a24/original/as/ordintro-str-amendments-20261020.pdf' },
    { label: 'City of Las Vegas: can my home become a short-term rental?', url: 'https://files.lasvegasnevada.gov/business-licensing/Short-Term_Rental-One_Page_Overview.pdf' },
    { label: 'Los Angeles City Planning: home-sharing FAQs', url: 'https://planning.lacity.gov/odocument/b246d6cc-41b8-4bb9-a28e-2c3046205420/Fact_Sheet.pdf' },
    { label: 'Arizona: A.R.S. 9-500.39 (city short-term rental limits)', url: 'https://www.azleg.gov/ars/9/00500-39.htm' },
    { label: 'Arizona: A.R.S. 11-269.17 (county short-term rental limits)', url: 'https://www.azleg.gov/ars/11/00269-17.htm' },
    { label: 'Arizona: A.R.S. 33-1806.01 (HOA rental rules)', url: 'https://www.azleg.gov/ars/33/01806-01.htm' },
    { label: 'Utah Code 10-8-85.4 (short-term rentals)', url: 'https://le.utah.gov/xcode/Title10/Chapter8/10-8-S85.4.html' },
    { label: 'Utah Code 59-2-102 (residential property excludes transient use)', url: 'https://le.utah.gov/xcode/Title59/Chapter2/59-2-S102.html' },
    { label: 'Utah Code 59-2-103 (45% residential exemption)', url: 'https://le.utah.gov/xcode/Title59/Chapter2/59-2-S103.html' },
    { label: 'Nevada: NRS 40.2512 and 40.253 (notice for unpaid rent)', url: 'https://www.leg.state.nv.us/nrs/nrs-040.html' },
    { label: 'Clark County: Las Vegas Township Constable, eviction process', url: 'https://www.clarkcountynv.gov/government/departments/constable/constable_las_vegas_township/services/eviction-process' },
    { label: 'California: Code of Civil Procedure 1161 (unpaid rent notice)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1161' },
    { label: 'California: Code of Civil Procedure 1167 (tenant response time)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1167' },
    { label: 'California: Civil Code 789.3 (no lockouts or utility shutoffs)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=789.3' },
    { label: 'Arizona: A.R.S. 33-1368 (unpaid rent)', url: 'https://www.azleg.gov/ars/33/01368.htm' },
    { label: 'Arizona: A.R.S. 33-1367 (unlawful ouster)', url: 'https://www.azleg.gov/ars/33/01367.htm' },
    { label: 'Utah Code 78B-6-802 (unlawful detainer)', url: 'https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S802.html' },
    { label: 'Utah Code 78B-6-814 (no lockouts without a court)', url: 'https://le.utah.gov/xcode/Title78B/Chapter6/78B-6-S814.html' },
    { label: 'IRS Publication 544: sales and other dispositions of assets', url: 'https://www.irs.gov/publications/p544' },
    { label: 'IRS Topic 409: capital gains and losses', url: 'https://www.irs.gov/taxtopics/tc409' },
    { label: 'IRS: instructions for Form 8824 (like-kind exchanges)', url: 'https://www.irs.gov/instructions/i8824' },
    { label: 'California FTB: Form 593 instructions (real estate withholding)', url: 'https://www.ftb.ca.gov/forms/2025/2025-593-instructions.html' },
    { label: 'California FTB Publication 1016: real estate withholding guidelines', url: 'https://www.ftb.ca.gov/forms/misc/1016.html' },
  ],
  practice: 'Before you advertise a rental, write your tenant screening criteria and check any limit your state sets on security deposits.',
  reviewed: '2026-10-04',
};
