import type { ProKey } from './proGuide';

export interface TeamEntry { role: string; when: string; href?: string; pro?: ProKey }

/** The professionals a guide can list, and when each one comes in. */
export const TEAM = {
  agent: { role: 'Real estate agent', when: 'Finding and pricing the property, and selling or renting it after', href: '#/pros/agent', pro: 'agent' },
  lender: { role: 'Hard-money or private lender', when: 'Lined up before the sale; most auctions need cash the same day, so loans usually come after', href: '#/pros/private_lender', pro: 'private_lender' },
  mortgage: { role: 'Loan officer or mortgage company', when: 'Pre-approval before you make an offer', href: '#/pros/lender', pro: 'lender' },
  title: { role: 'Title and escrow company', when: 'A title search before you bid, and title insurance when available', href: '#/pros/title', pro: 'title' },
  attorney: { role: 'Real estate attorney', when: 'Reviewing surviving liens, sale validity and quiet title', href: '#/pros/attorney', pro: 'attorney' },
  eviction: { role: 'Eviction help', when: 'An eviction attorney or process server, right after the sale if anyone lives there', href: '#/pros/eviction', pro: 'eviction' },
  insurance: { role: 'Insurance agent', when: 'Vacant-property coverage starting the day you own it', href: '#/pros/insurance', pro: 'insurance' },
  contractor: { role: 'Contractor and home inspector', when: 'An exterior look before the sale; a full scope once you have the keys (check the contractor’s license where your state requires one)', href: '#/pros/contractor', pro: 'contractor' },
  /** For an offer on a listed home (bank-owned, short sale): you inspect during the contract, not after. */
  offerInspector: { role: 'Home inspector and contractors', when: 'Inspection and written repair bids before your inspection deadline, with the access the seller allows; ask the listing agent to turn on utilities for it', href: '#/pros/inspector', pro: 'inspector' },
  /** For an offer on a listed home: title and insurance come during escrow, not before a bid. */
  offerTitle: { role: 'Title and escrow company', when: 'A preliminary title report or title commitment during escrow, and an owner’s title policy at closing', href: '#/pros/title', pro: 'title' },
  offerAttorney: { role: 'Real estate attorney', when: 'Reviewing the short-sale contract and the lender’s approval letter, and which liens and judgments are released at closing', href: '#/pros/attorney', pro: 'attorney' },
  offerInsurance: { role: 'Insurance agent', when: 'A quote early in escrow, and coverage in force by closing (vacant-property coverage if no one will live there yet)', href: '#/pros/insurance', pro: 'insurance' },
  /** Lien certificates: you buy a lien, not the property (no insurance, repairs or rent). */
  lienTitle: { role: 'Title and escrow company', when: 'A title report on a parcel before you bid; title insurance matters only if you later take the property', href: '#/pros/title', pro: 'title' },
  lienAttorney: { role: 'Real estate attorney', when: 'Before you act on a lien that isn’t paid: the notices, deadlines and cost of getting the property, which your state’s law sets', href: '#/pros/attorney', pro: 'attorney' },
  lienCpa: { role: 'CPA or tax advisor', when: 'Before you buy: how the interest a certificate earns is taxed, and what to keep for records', href: '#/pros/cpa', pro: 'cpa' },
  cpa: { role: 'CPA or tax advisor', when: 'Before you buy: flips and rentals are taxed differently', href: '#/pros/cpa', pro: 'cpa' },
  commercialBroker: { role: 'Commercial real estate broker', when: 'Current rents and cap rates for this property type, and leasing it up after', href: '#/pros/agent', pro: 'agent' },
  environmental: { role: 'Environmental consultant', when: 'A Phase I environmental site assessment completed (or updated) within one year before you take title (site visit, interviews, record and lien searches within 180 days)', href: '#/pros/environmental', pro: 'environmental' },
  commercialLender: { role: 'Commercial or bridge lender', when: 'Before the sale: auctions need cash, so the long-term loan comes after', href: '#/pros/private_lender', pro: 'private_lender' },
  propertyManager: { role: 'Commercial property manager', when: 'From day one if there are tenants: rent collection, estoppels, repairs', href: '#/pros/property_manager', pro: 'property_manager' },
} satisfies Record<string, TeamEntry>;

