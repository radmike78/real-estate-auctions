// Where to check a professional's license in each state DeedOwl covers. A visitor sees their own state's office
// (or all of them when they haven't picked one), never another state's.
import type { ProKey } from './proGuide';
import type { StateCode } from './regions';

export type Lookup = { who: string; url: string } | { note: string };

const NMLS = { who: 'NMLS Consumer Access (state mortgage licenses)', url: 'https://www.nmlsconsumeraccess.org/' };
const ASC = { who: 'Appraisal Subcommittee national registry', url: 'https://www.asc.gov/appraiser' };
const BAR: Record<StateCode, Lookup> = {
  NV: { who: 'State Bar of Nevada', url: 'https://nvbar.org/for-the-public/find-a-lawyer/' },
  CA: { who: 'State Bar of California', url: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch' },
  AZ: { who: 'State Bar of Arizona member directory', url: 'https://www.azbar.org/for-legal-professionals/practice-tools-management/member-directory/' },
  UT: { who: 'Utah State Bar member directory', url: 'https://services.utahbar.org/Licensee-Directory' },
  TX: { who: 'State Bar of Texas (Find a Lawyer)', url: 'https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&Template=/CustomSource/MemberDirectory/Search_Form_Client_Main.cfm' },
};
const REAL_ESTATE: Record<StateCode, Lookup> = {
  NV: { who: 'Nevada Real Estate Division', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx' },
  CA: { who: 'California Department of Real Estate', url: 'https://www2.dre.ca.gov/PublicASP/pplinfo.asp' },
  AZ: { who: 'Arizona Department of Real Estate', url: 'https://services.azre.gov/publicdatabase/' },
  UT: { who: 'Utah Division of Real Estate license lookup', url: 'https://secure.utah.gov/rer/relv/search.html' },
  TX: { who: 'Texas Real Estate Commission (TREC) license holder search', url: 'https://www.trec.texas.gov/license-search' },
};
const INSURANCE: Record<StateCode, Lookup> = {
  NV: { who: 'Nevada Division of Insurance', url: 'https://di.nv.gov/nv/r/doi/licensing/search' },
  CA: { who: 'California Department of Insurance', url: 'https://cdicloud.insurance.ca.gov/cal/LicenseNumberSearch' },
  AZ: { who: 'Arizona Department of Insurance and Financial Institutions (license search)', url: 'https://difi.az.gov/license-search' },
  UT: { who: 'Utah Insurance Department', url: 'https://insurance.utah.gov/' },
  TX: { who: 'Texas Department of Insurance (agent lookup)', url: 'https://www.tdi.texas.gov/agent/agent-lookup.html' },
};

export const LICENSE_LOOKUPS: Partial<Record<ProKey, Record<StateCode, Lookup>>> = {
  agent: REAL_ESTATE,
  lender: { NV: NMLS, CA: NMLS, AZ: NMLS, UT: NMLS, TX: NMLS },
  // A California private lender may hold a finance lender license (DFPI, often on NMLS) or a broker license (DRE),
  // or be exempt: ask which, then check with that regulator.
  private_lender: { NV: NMLS, CA: { note: 'Ask which license the lender holds. A finance lender’s is on the DFPI licensee search or NMLS Consumer Access; a real estate broker’s is on the DRE license lookup. Some lenders are exempt.' }, AZ: NMLS, UT: NMLS, TX: { note: 'Ask which license the lender holds. Residential mortgage lenders and loan originators are licensed by the Texas Department of Savings and Mortgage Lending; check them on NMLS Consumer Access. Some business-purpose lenders are exempt.' } },
  // An independent escrow company is licensed by a different office than title companies in California and Nevada.
  title: {
    ...INSURANCE,
    CA: { note: 'Title companies and title agents are licensed by the California Department of Insurance (license search at cdicloud.insurance.ca.gov). An independent escrow company is licensed by the Department of Financial Protection and Innovation (DFPI); check it on the DFPI licensee search.' },
    NV: { note: 'Title agents and title-company escrow officers are licensed by the Nevada Division of Insurance (search at di.nv.gov). An independent escrow agency is licensed by the Nevada Mortgage Lending Division (NRS 645A).' },
  },
  attorney: BAR,
  eviction: BAR,
  inspector: {
    NV: { who: 'Nevada Real Estate Division (inspectors of structures)', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx' },
    CA: { note: 'California doesn’t license home inspectors. Ask for proof of insurance and training, and a sample report.' },
    AZ: { who: 'Arizona Board of Technical Registration', url: 'https://btr.az.gov/' },
    UT: { who: 'Utah Division of Professional Licensing (Private Home Inspector license)', url: 'https://secure.utah.gov/llv/search/index.html' },
    TX: { who: 'Texas Real Estate Commission (TREC) license holder search (choose Inspector)', url: 'https://www.trec.texas.gov/license-search' },
  },
  appraiser: { NV: ASC, CA: ASC, AZ: ASC, UT: ASC, TX: { who: 'Texas Appraiser Licensing and Certification Board (TALCB) license holder search', url: 'https://www.talcb.texas.gov/license-search' } },
  contractor: {
    NV: { who: 'Nevada State Contractors Board', url: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch/ContractorLicenseSearch.aspx' },
    CA: { who: 'California Contractors State License Board', url: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx' },
    AZ: { who: 'Arizona Registrar of Contractors', url: 'https://roc.az.gov/contractor-search' },
    UT: { who: 'Utah Division of Professional Licensing', url: 'https://secure.utah.gov/llv/search/index.html' },
    TX: { note: 'Texas has no statewide license for general contractors or remodelers. Check the trades: electricians and air-conditioning contractors on the TDLR license search, and plumbers on the Texas State Board of Plumbing Examiners’ license search. Ask your city whether it registers contractors, and ask for proof of insurance.' },
  },
  insurance: INSURANCE,
  cpa: {
    NV: { who: 'NASBA licensee database (CPAverify)', url: 'https://ald.nasba.org/search/cpa' },
    CA: { who: 'California Board of Accountancy (DCA license search)', url: 'https://search.dca.ca.gov/' },
    AZ: { who: 'NASBA licensee database (CPAverify)', url: 'https://ald.nasba.org/search/cpa' },
    UT: { who: 'Utah Division of Professional Licensing', url: 'https://secure.utah.gov/llv/search/index.html' },
    TX: { who: 'Texas State Board of Public Accountancy (license lookup)', url: 'https://www.tsbpa.texas.gov/license-lookup/' },
  },
  property_manager: REAL_ESTATE,
};
