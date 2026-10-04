// Where to check a professional's license in each state DeedOwl covers. A visitor sees their own state's office
// (or all four when they haven't picked one), never another state's.
import type { ProKey } from './proGuide';
import type { StateCode } from './regions';

export type Lookup = { who: string; url: string } | { note: string };

const NMLS = { who: 'NMLS Consumer Access (state mortgage licenses)', url: 'https://www.nmlsconsumeraccess.org/' };
const ASC = { who: 'Appraisal Subcommittee national registry', url: 'https://www.asc.gov/appraiser' };
const BAR: Record<StateCode, Lookup> = {
  NV: { who: 'State Bar of Nevada', url: 'https://nvbar.org/for-the-public/find-a-lawyer/' },
  CA: { who: 'State Bar of California', url: 'https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch' },
  AZ: { who: 'State Bar of Arizona member directory', url: 'https://www.azbar.org/for-legal-professionals/practice-tools-management/member-directory/' },
  UT: { who: 'Utah State Bar member directory', url: 'https://services.utahbar.org/Member-Directory' },
};
const REAL_ESTATE: Record<StateCode, Lookup> = {
  NV: { who: 'Nevada Real Estate Division', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx' },
  CA: { who: 'California Department of Real Estate', url: 'https://www2.dre.ca.gov/PublicASP/pplinfo.asp' },
  AZ: { who: 'Arizona Department of Real Estate', url: 'https://services.azre.gov/publicdatabase/' },
  UT: { who: 'Utah Division of Real Estate', url: 'https://realestate.utah.gov/' },
};
const INSURANCE: Record<StateCode, Lookup> = {
  NV: { who: 'Nevada Division of Insurance', url: 'https://di.nv.gov/nv/r/doi/licensing/search' },
  CA: { who: 'California Department of Insurance', url: 'https://cdicloud.insurance.ca.gov/cal/LicenseNumberSearch' },
  AZ: { who: 'Arizona Department of Insurance and Financial Institutions', url: 'https://difi.az.gov/' },
  UT: { who: 'Utah Insurance Department', url: 'https://insurance.utah.gov/' },
};

export const LICENSE_LOOKUPS: Partial<Record<ProKey, Record<StateCode, Lookup>>> = {
  agent: REAL_ESTATE,
  lender: { NV: NMLS, CA: NMLS, AZ: NMLS, UT: NMLS },
  private_lender: { NV: NMLS, CA: NMLS, AZ: NMLS, UT: NMLS },
  title: INSURANCE,
  attorney: BAR,
  eviction: BAR,
  inspector: {
    NV: { who: 'Nevada Real Estate Division (inspectors of structures)', url: 'https://red.prod.secure.nv.gov/Lookup/LicenseLookup.aspx' },
    CA: { note: 'California doesn’t license home inspectors. Ask for proof of insurance and training, and a sample report.' },
    AZ: { who: 'Arizona Board of Technical Registration', url: 'https://btr.az.gov/' },
    UT: { note: 'Utah doesn’t license home inspectors. Ask for proof of insurance and training, and a sample report.' },
  },
  appraiser: { NV: ASC, CA: ASC, AZ: ASC, UT: ASC },
  contractor: {
    NV: { who: 'Nevada State Contractors Board', url: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch/ContractorLicenseSearch.aspx' },
    CA: { who: 'California Contractors State License Board', url: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx' },
    AZ: { who: 'Arizona Registrar of Contractors', url: 'https://roc.az.gov/contractor-search' },
    UT: { who: 'Utah Division of Professional Licensing', url: 'https://secure.utah.gov/llv/search/index.html' },
  },
  insurance: INSURANCE,
  cpa: {
    NV: { who: 'NASBA licensee database (CPAverify)', url: 'https://ald.nasba.org/search/cpa' },
    CA: { who: 'California Board of Accountancy', url: 'https://www.cba.ca.gov/' },
    AZ: { who: 'NASBA licensee database (CPAverify)', url: 'https://ald.nasba.org/search/cpa' },
    UT: { who: 'Utah Division of Professional Licensing', url: 'https://secure.utah.gov/llv/search/index.html' },
  },
  property_manager: REAL_ESTATE,
};
