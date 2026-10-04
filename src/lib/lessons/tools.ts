import type { Lesson } from './types';

export const tools: Lesson = {
  key: 'tools',
  minutes: 8,
  intro: 'Most of what you need to research a property is public and free: county records, federal maps and data, and state license lookups. Here are the tools investors use, and a routine for checking any property.',
  takeaways: [
    'Which county offices hold ownership, tax and recorded-document records.',
    'Free federal tools for rents, flood risk, neighborhood data and environmental records.',
    'How to check a contractor, agent or lender before you hire them.',
    'How to spot a bankruptcy that can stop a sale.',
    'A research routine you can use on every property.',
  ],
  sections: [
    {
      heading: 'The three county offices',
      blocks: [
        { list: [
          'Assessor: the parcel number, owner of record, lot size, building details and assessed value, usually with a parcel map.',
          'Recorder: recorded documents such as deeds, deeds of trust, liens, notices of default and releases. This is where a title search starts.',
          'Treasurer or tax collector: the tax bill, whether taxes are unpaid, and the county’s tax sale.',
        ] },
        'Start with the parcel number from the assessor, since the other offices use it too. Here are the largest counties in our four states:',
        { links: [
          { label: 'Clark County (NV) Assessor', url: 'https://www.clarkcountynv.gov/assessor', what: 'Property record search.' },
          { label: 'Clark County (NV) Recorder', url: 'https://www.clarkcountynv.gov/recorder', what: 'Recorded documents online and the GIS map.' },
          { label: 'Clark County (NV) Treasurer', url: 'https://www.clarkcountynv.gov/treasurer', what: 'Tax bills and the delinquent property tax auction.' },
          { label: 'Washoe County (NV) Assessor', url: 'https://www.washoecounty.gov/assessor/', what: 'Parcel search and maps.' },
          { label: 'Washoe County (NV) Recorder', url: 'https://www.washoecounty.gov/recorder/', what: 'Document search and copies.' },
          { label: 'Washoe County (NV) Treasurer', url: 'https://www.washoecounty.gov/treas/', what: 'Taxes and the tax auction.' },
          { label: 'Los Angeles County (CA) Assessor', url: 'https://assessor.lacounty.gov/', what: 'Parcel information and maps.' },
          { label: 'Los Angeles County (CA) Treasurer and Tax Collector', url: 'https://ttc.lacounty.gov/', what: 'Tax bills and tax-defaulted property auctions.' },
          { label: 'San Diego County (CA) Assessor/Recorder/County Clerk', url: 'https://www.sdarcc.gov/', what: 'Official record search, maps and tax billing information.' },
          { label: 'San Diego County (CA) Treasurer-Tax Collector', url: 'https://www.sdttc.com/', what: 'Property tax auctions.' },
          { label: 'Maricopa County (AZ) Assessor', url: 'https://mcassessor.maricopa.gov/', what: 'Parcel viewer and GIS maps.' },
          { label: 'Maricopa County (AZ) Treasurer', url: 'https://treasurer.maricopa.gov/', what: 'Parcel tax information and payments.' },
          { label: 'Pima County (AZ) Treasurer', url: 'https://www.to.pima.gov/', what: 'Property search and the tax sale booklet.' },
          { label: 'Salt Lake County (UT) Assessor', url: 'https://www.saltlakecounty.gov/assessor/', what: 'Parcel map and parcel data.' },
          { label: 'Salt Lake County (UT) Recorder', url: 'https://www.saltlakecounty.gov/recorder/', what: 'Interactive parcel map and recorded documents.' },
          { label: 'Utah County (UT) Recorder', url: 'https://recorder.utahcounty.gov/', what: 'Land record searches.' },
        ] },
        'For other counties, search for the county’s name with “assessor,” “recorder” or “treasurer” added. Make sure the site ends in .gov or is linked from the county’s official website. Find Deals will add each county as we research it.',
      ],
    },
    {
      heading: 'Free federal tools',
      blocks: [
        { links: [
          { label: 'HUD Fair Market Rents', url: 'https://www.huduser.gov/portal/datasets/fmr.html', what: 'HUD’s yearly rent estimates by area and bedroom count: a check on what a rental might bring. Small Area FMRs go down to ZIP codes.' },
          { label: 'Census QuickFacts', url: 'https://www.census.gov/programs-surveys/sis/resources/data-tools/quickfacts.html', what: 'Population, income, housing and business figures for states, counties, and cities over 5,000 people.' },
          { label: 'Census Geocoder', url: 'https://geocoding.geo.census.gov/geocoder/', what: 'Finds the census tract and area for an address, so you can look up its data.' },
          { label: 'FEMA Flood Map Service Center', url: 'https://msc.fema.gov/portal/home', what: 'The official flood maps. Search by address.' },
          { label: 'FEMA National Risk Index', url: 'https://www.fema.gov/emergency-managers/practitioners/resilience-analysis-and-planning-tool', what: 'Community risk for 18 natural hazards, such as wildfire, earthquake and heat.' },
          { label: 'EPA Envirofacts', url: 'https://www.epa.gov/enviro/envirofacts-overview', what: 'EPA records on nearby waste, water, air and toxics sites. Search by address or ZIP code.' },
        ] },
      ],
    },
    {
      heading: 'Check who you hire',
      blocks: [
        { links: [
          { label: 'Nevada State Contractors Board: license search', url: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch/ContractorLicenseSearch.aspx', what: 'Nevada contractors.' },
          { label: 'California CSLB: check a license', url: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx', what: 'California contractors, by license number, business or name.' },
          { label: 'Arizona Registrar of Contractors: contractor search', url: 'https://azroc.my.site.com/AZRoc/s/contractor-search', what: 'Arizona contractors.' },
          { label: 'Utah license lookup', url: 'https://secure.utah.gov/llv/search/index.html', what: 'Utah contractors and other licensed professions.' },
          { label: 'Nevada Real Estate Division: license lookup', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx', what: 'Nevada agents, brokers and property managers.' },
          { label: 'California DRE: public license lookup', url: 'https://www2.dre.ca.gov/PublicASP/pplinfo.asp', what: 'California agents and brokers.' },
          { label: 'Arizona Department of Real Estate: public database', url: 'https://services.azre.gov/publicdatabase/', what: 'Arizona agents and brokers.' },
          { label: 'NMLS Consumer Access', url: 'https://www.nmlsconsumeraccess.org/', what: 'Mortgage lenders, brokers and loan officers in every state.' },
          { label: 'California Secretary of State: business search', url: 'https://bizfileonline.sos.ca.gov/search/business', what: 'Who is behind a California company or LLC.' },
          { label: 'Arizona Corporation Commission: entity search', url: 'https://arizonabusinesscenter.azcc.gov/EntitySearch/Index', what: 'Who is behind an Arizona company or LLC.' },
        ] },
        'See Your Team for what each professional does and how to find one.',
      ],
    },
    {
      heading: 'Court records and bankruptcy',
      blocks: [
        'When an owner files for bankruptcy, federal law usually stops anyone from enforcing a lien against their property, which can halt a foreclosure or tax sale. There are exceptions, especially for repeat filers, so ask the trustee or your title company whether a sale is on hold. Federal court records, including bankruptcy cases, are on PACER. Documents cost 10 cents a page, capped at $3 each; search results and transcripts have no cap. Fees are waived if you spend $30 or less in a quarter. State court cases are on each state’s or county’s court website.',
        { links: [
          { label: 'PACER', url: 'https://pacer.uscourts.gov/', what: 'Federal court and bankruptcy records.' },
          { label: 'PACER Case Locator', url: 'https://pcl.uscourts.gov/', what: 'Search for a person’s or company’s federal cases nationwide.' },
        ] },
      ],
    },
    {
      heading: 'A research routine for any property',
      blocks: [
        { list: [
          'Get the parcel number and owner of record from the assessor, and look at the parcel map.',
          'Read the recorded documents: the last deed, open deeds of trust, liens and any notices.',
          'Check the tax bill and any unpaid taxes with the treasurer.',
          'Check flood, hazard and environmental records.',
          'Look at the street and neighborhood, in person if you can.',
          'Estimate value from sold prices, and rent from homes like this one that actually rented nearby. HUD’s Fair Market Rent is a rough area benchmark that includes utilities, not proof of what this unit will rent for.',
          'Check for a bankruptcy if a sale is coming up.',
          'Order a title search from a title company before you commit money.',
        ] },
        'Keep notes and copies in one place. My deals can track them.',
      ],
    },
  ],
  terms: [
    { term: 'Parcel number (APN)', meaning: 'The county’s ID number for a piece of land; used on tax bills and maps.' },
    { term: 'Owner of record', meaning: 'The owner shown in county records.' },
    { term: 'Recorded document', meaning: 'A deed, loan, lien or notice filed with the county recorder, open to the public.' },
    { term: 'Automatic stay', meaning: 'The legal pause on collection, including foreclosure, when someone files for bankruptcy.' },
    { term: 'Fair Market Rent (FMR)', meaning: 'HUD’s estimate of typical rent, including most utilities, for an area and unit size.' },
  ],
  tryIt: { label: 'Track your research in My deals', href: '#/deals' },
  sources: [
    { label: 'HUD USER: Fair Market Rents', url: 'https://www.huduser.gov/portal/datasets/fmr.html' },
    { label: 'Census Bureau: QuickFacts', url: 'https://www.census.gov/programs-surveys/sis/resources/data-tools/quickfacts.html' },
    { label: 'Census Geocoder', url: 'https://geocoding.geo.census.gov/geocoder/' },
    { label: 'FEMA Flood Map Service Center', url: 'https://msc.fema.gov/portal/home' },
    { label: 'FEMA: Resilience Analysis and Planning Tool (National Risk Index)', url: 'https://www.fema.gov/emergency-managers/practitioners/resilience-analysis-and-planning-tool' },
    { label: 'EPA: Envirofacts overview', url: 'https://www.epa.gov/enviro/envirofacts-overview' },
    { label: 'PACER: federal court records and fees', url: 'https://pacer.uscourts.gov/' },
    { label: 'Bankruptcy automatic stay (11 U.S.C. 362)', url: 'https://www.law.cornell.edu/uscode/text/11/362' },
  ],
  practice: 'Look up one property’s parcel, tax bill, recorded documents and flood zone. Record the source and the date for each.',
  reviewed: '2026-09-29',
};
