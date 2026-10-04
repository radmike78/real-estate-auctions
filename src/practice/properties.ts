// Fictional practice properties for the hands-on buying simulator. Nothing here is a real listing:
// street names are made up ("Practice", "Example", "Sample"), parcel numbers are in book 999, which
// the Clark County Assessor doesn't use, and every number is a practice number, not market data.

import type { PropertyType } from '../types';
import type { PropertyClass } from '../lib/propertyClass';

export interface PracticeIncome {
  units: string; // e.g. "12 apartments, 10 leased"
  grossRent: number; // scheduled rent per year if fully leased
  vacancyPct: number;
  operatingExpenses: number; // per year: taxes, insurance, repairs, management, utilities the owner pays
  capRatePct: number; // practice cap rate (ask a commercial broker for current rates)
}

export interface PracticeProperty {
  id: string;
  type: PropertyType;
  cls: PropertyClass;
  label: string; // plain-English kind, e.g. "Single-family house"
  address: string;
  city: string;
  zip: string;
  apn: string; // book 999: not a real Clark County parcel
  facts: { label: string; value: string }[];
  /** Practice value once repaired (homes and land: similar sales; rental buildings: income ÷ cap rate). */
  value: number;
  /** Practice repair estimate from the outside (no interior access at most forced sales). */
  repairs: number;
  hasBuilding: boolean;
  hoaMonthly: number | null; // in a homeowners association
  occupancy: 'Vacant' | 'Unknown' | 'Tenants';
  income: PracticeIncome | null;
  /** Something about the history that a careful buyer should find. */
  watchOut: string | null;
  /** The watch-out for a negotiated purchase (bank-owned or short sale), when it differs from an auction's. */
  watchOutNegotiated?: string;
}

/** Net operating income and value by the income approach. */
export function incomeValue(i: PracticeIncome) {
  const effective = i.grossRent * (1 - i.vacancyPct / 100);
  const noi = effective - i.operatingExpenses;
  return { effective, noi, value: Math.round(noi / (i.capRatePct / 100) / 1000) * 1000 };
}

const income = (i: PracticeIncome) => ({ income: i, value: incomeValue(i).value });

export const PRACTICE_PROPERTIES: PracticeProperty[] = [
  {
    id: 'house',
    type: 'Single Family',
    cls: 'residential',
    label: 'Single-family house',
    address: '1418 Practice Ridge Dr',
    city: 'Las Vegas',
    zip: '89123',
    apn: '999-10-101-001',
    facts: [
      { label: 'Beds / baths', value: '3 / 2' },
      { label: 'Living area', value: '1,620 sq ft' },
      { label: 'Lot', value: '6,100 sq ft' },
      { label: 'Built', value: '1998' },
      { label: 'HOA', value: '$60 a month' },
    ],
    value: 415_000,
    repairs: 45_000,
    hasBuilding: true,
    hoaMonthly: 60,
    occupancy: 'Unknown',
    income: null,
    watchOut: 'Overgrown yard and a tarp on part of the roof, seen from the street.',
  },
  {
    id: 'condo',
    type: 'Condo',
    cls: 'residential',
    label: 'Condo',
    address: '3150 Example Palms Ct #208',
    city: 'Las Vegas',
    zip: '89121',
    apn: '999-20-201-208',
    facts: [
      { label: 'Beds / baths', value: '2 / 2' },
      { label: 'Living area', value: '1,050 sq ft' },
      { label: 'Floor', value: '2nd of 3' },
      { label: 'Built', value: '2004' },
      { label: 'HOA', value: '$285 a month' },
    ],
    value: 235_000,
    repairs: 18_000,
    hasBuilding: true,
    hoaMonthly: 285,
    occupancy: 'Unknown',
    income: null,
    watchOut: 'The HOA’s higher dues mean a bigger unpaid-dues balance can build up quickly.',
  },
  {
    id: 'townhouse',
    type: 'Townhouse',
    cls: 'residential',
    label: 'Townhouse',
    address: '7722 Sample Mesa Ln',
    city: 'Henderson',
    zip: '89014',
    apn: '999-30-301-022',
    facts: [
      { label: 'Beds / baths', value: '3 / 2.5' },
      { label: 'Living area', value: '1,480 sq ft' },
      { label: 'Garage', value: '2-car attached' },
      { label: 'Built', value: '2006' },
      { label: 'HOA', value: '$140 a month' },
    ],
    value: 345_000,
    repairs: 25_000,
    hasBuilding: true,
    hoaMonthly: 140,
    occupancy: 'Unknown',
    income: null,
    watchOut: null,
  },
  {
    id: 'fourplex',
    type: 'Multi-Family',
    cls: 'residential',
    label: 'Fourplex (4 units)',
    address: '2206 Practice Ave',
    city: 'Las Vegas',
    zip: '89104',
    apn: '999-40-401-006',
    facts: [
      { label: 'Units', value: '4 two-bedroom apartments, 3 rented' },
      { label: 'Building', value: '3,600 sq ft, built 1978' },
      { label: 'Rents', value: '$1,250 a month per unit' },
      { label: 'HOA', value: 'None' },
    ],
    value: 720_000,
    repairs: 60_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Tenants',
    income: null,
    watchOut: 'Three units have tenants. At an auction, you won’t know their lease terms or deposits until after the sale.',
    watchOutNegotiated: 'Three units have tenants. Ask for every lease, the rent roll and the security-deposit list during your contingency period, before you close.',
  },
  {
    id: 'lot',
    type: 'Vacant Land',
    cls: 'residential',
    label: 'Residential lot',
    address: 'Practice Vista Rd (no street number)',
    city: 'North Las Vegas',
    zip: '89084',
    apn: '999-50-501-050',
    facts: [
      { label: 'Size', value: '0.48 acre' },
      { label: 'Zoning (practice)', value: 'Single-family residential' },
      { label: 'Utilities', value: 'Power at the street; water and sewer unconfirmed' },
      { label: 'Access', value: 'Fronts a paved road' },
    ],
    value: 95_000,
    repairs: 0,
    hasBuilding: false,
    hoaMonthly: null,
    occupancy: 'Vacant',
    income: null,
    watchOut: 'Water and sewer connections are unconfirmed. Connection fees can be large.',
  },
  {
    id: 'apartments',
    type: 'Apartments (5+ units)',
    cls: 'commercial',
    label: 'Apartment building (12 units)',
    address: '4900 Example Blvd',
    city: 'Las Vegas',
    zip: '89119',
    apn: '999-60-601-490',
    facts: [
      { label: 'Units', value: '12 one-bedroom apartments, 10 rented' },
      { label: 'Building', value: '8,400 sq ft, two stories, built 1984' },
      { label: 'Parking', value: '16 spaces' },
    ],
    ...income({ units: '12 apartments', grossRent: 12 * 1_100 * 12, vacancyPct: 17 /* 10 of 12 rented */, operatingExpenses: 62_000, capRatePct: 7 }),
    repairs: 90_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Tenants',
    watchOut: 'Ten apartments have residential tenants. The building is commercial, but its tenants still have residential tenant rights, and you take on their security deposits. Which notices they get depends on the kind of sale; ask an attorney.',
  },
  {
    id: 'retail',
    type: 'Retail',
    cls: 'commercial',
    label: 'Small retail center (5 suites)',
    address: '6120 Sample Commerce Way',
    city: 'Las Vegas',
    zip: '89108',
    apn: '999-70-701-612',
    facts: [
      { label: 'Building', value: '9,800 sq ft, 5 suites, built 1986' },
      { label: 'Tenants', value: '3 of 5 suites leased' },
      { label: 'Parking', value: 'Shared lot with the neighboring center' },
      { label: 'Past tenants', value: 'Suite C was a dry cleaner until 2011' },
    ],
    ...income({ units: '5 suites', grossRent: 9_800 * 18, vacancyPct: 40, operatingExpenses: 38_000, capRatePct: 8 }),
    repairs: 65_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Tenants',
    watchOut: 'A former dry cleaner is a classic source of solvent contamination. Check environmental records first.',
  },
  {
    id: 'office',
    type: 'Office',
    cls: 'commercial',
    label: 'Office building',
    address: '880 Practice Center Pkwy',
    city: 'Henderson',
    zip: '89052',
    apn: '999-80-801-880',
    facts: [
      { label: 'Building', value: '14,000 sq ft, two stories, built 1999' },
      { label: 'Tenants', value: '6 offices, 4 leased' },
      { label: 'Parking', value: '52 spaces' },
    ],
    ...income({ units: '6 offices', grossRent: 14_000 * 21, vacancyPct: 33 /* 4 of 6 leased */, operatingExpenses: 72_000, capRatePct: 8 }),
    repairs: 110_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Tenants',
    watchOut: 'Any renovation must meet the ADA standards. Spaces leased to businesses open to the public (a medical office, for example) must also remove barriers where that’s easy and affordable.',
  },
  {
    id: 'industrial',
    type: 'Industrial',
    cls: 'commercial',
    label: 'Warehouse / light industrial',
    address: '3400 Example Industrial Rd',
    city: 'North Las Vegas',
    zip: '89030',
    apn: '999-90-901-340',
    facts: [
      { label: 'Building', value: '22,000 sq ft, built 2001, 24-ft ceilings' },
      { label: 'Tenant', value: 'One tenant on a lease through 2028' },
      { label: 'Past use', value: 'Truck repair shop until 2015' },
    ],
    ...income({ units: '1 tenant', grossRent: 22_000 * 12, vacancyPct: 5, operatingExpenses: 24_000, capRatePct: 7 }),
    repairs: 70_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Tenants',
    watchOut: 'A former truck repair shop can mean oil, solvents or buried tanks. Environmental check first.',
  },
  {
    id: 'motel',
    type: 'Hotel / Motel',
    cls: 'commercial',
    label: 'Motel (48 rooms)',
    address: '1776 Sample Strip Ave',
    city: 'Las Vegas',
    zip: '89101',
    apn: '999-11-111-776',
    facts: [
      { label: 'Rooms', value: '48, two stories, built 1972' },
      { label: 'Status', value: 'Operating, run by the owner’s company' },
      { label: 'Extras', value: 'Pool, office, manager’s apartment' },
    ],
    ...income({ units: '48 rooms', grossRent: 48 * 55 * 365, vacancyPct: 35, operatingExpenses: 520_000, capRatePct: 9 }),
    repairs: 240_000,
    hasBuilding: true,
    hoaMonthly: null,
    occupancy: 'Unknown', // guests and possibly a live-in manager: an attorney decides how to take possession
    watchOut: 'A motel is a building and a business. Many licenses don’t simply pass to you, and furniture and the business may not be part of the sale.',
  },
  {
    id: 'commercial-lot',
    type: 'Commercial Land',
    cls: 'commercial',
    label: 'Commercial lot',
    address: 'Sample Crossing Rd at Practice Ave (no street number)',
    city: 'North Las Vegas',
    zip: '89031',
    apn: '999-12-121-012',
    facts: [
      { label: 'Size', value: '1.2 acres' },
      { label: 'Zoning (practice)', value: 'General commercial' },
      { label: 'Utilities', value: 'At the street' },
      { label: 'Past use', value: 'Gas station, demolished in 2004' },
    ],
    value: 780_000,
    repairs: 0,
    hasBuilding: false,
    hoaMonthly: null,
    occupancy: 'Vacant',
    income: null,
    watchOut: 'Former gas station: underground storage tanks and fuel leaks are possible. Environmental check first.',
  },
];

export const practiceProperty = (id: string) => PRACTICE_PROPERTIES.find((p) => p.id === id) ?? null;
