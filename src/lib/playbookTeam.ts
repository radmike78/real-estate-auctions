import type { ProKey } from './proGuide';

export interface TeamEntry { role: string; when: string; href?: string; pro?: ProKey }

/** The professionals a guide can list, and when each one comes in. */
export const TEAM = {
  agent: { role: 'Real estate agent', when: 'Finding and pricing the property, and selling or renting it after', href: '#/pros/agent', pro: 'agent' },
  lender: { role: 'Hard-money or bridge lender', when: 'Lined up before the sale; most auctions need cash the same day, so loans usually come after', href: '#/pros/private_lender', pro: 'private_lender' },
  mortgage: { role: 'Loan officer or mortgage company', when: 'Pre-approval before you make an offer', href: '#/pros/lender', pro: 'lender' },
  title: { role: 'Title company or title researcher', when: 'A title search before you bid, and title insurance when available', href: '#/pros/title', pro: 'title' },
  attorney: { role: 'Real estate attorney', when: 'Reviewing surviving liens, sale validity and quiet title', href: '#/pros/attorney', pro: 'attorney' },
  eviction: { role: 'Eviction attorney or process server', when: 'Right after the sale if anyone lives there', href: '#/pros/eviction', pro: 'eviction' },
  insurance: { role: 'Insurance agent', when: 'Vacant-property coverage starting the day you own it', href: '#/pros/insurance', pro: 'insurance' },
  contractor: { role: 'Licensed contractor and inspector', when: 'An exterior look before the sale; a full scope once you have the keys', href: '#/pros/contractor', pro: 'contractor' },
  cpa: { role: 'CPA', when: 'Before you buy: flips and rentals are taxed differently', href: '#/pros/cpa', pro: 'cpa' },
  commercialBroker: { role: 'Commercial real estate broker', when: 'Current rents and cap rates for this property type, and leasing it up after', href: '#/pros/agent', pro: 'agent' },
  environmental: { role: 'Environmental consultant', when: 'A Phase I environmental site assessment within one year before you take title (site visit, interviews and record searches within 180 days)', href: '#/pros/environmental', pro: 'environmental' },
  commercialLender: { role: 'Commercial or bridge lender', when: 'Before the sale: auctions need cash, so the long-term loan comes after', href: '#/pros/private_lender', pro: 'private_lender' },
  propertyManager: { role: 'Commercial property manager', when: 'From day one if there are tenants: rent collection, estoppels, repairs', href: '#/pros/property_manager', pro: 'property_manager' },
} satisfies Record<string, TeamEntry>;

export type TeamKey = keyof typeof TEAM;
