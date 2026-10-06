// Single source for the site's role and disclaimers, so every page says the same thing.

export const ROLE_SHORT =
  'DeedOwl teaches the steps to invest in real estate, then points you to deals from official sources. Each deal is yours to research and decide.';

/** Where our information comes from, and that professional advice is the buyer's job. Shown on every page. */
export const SOURCES_AND_ADVICE =
  'We make every effort to pull information from government and other official sources. Our guides are general education; for advice ' +
  'on your own deal, work with qualified professionals: an attorney, a tax advisor, a licensed real estate agent or broker, and a ' +
  'financial advisor.';

export type DisclaimerKind = 'sales' | 'professionals' | 'financing' | 'services';

export const DISCLAIMERS: Record<DisclaimerKind, { title: string; text: string }> = {
  sales: {
    title: 'Verify before you bid or buy',
    text:
      "We aren't the seller, auctioneer, trustee or government agency, and we don't take bids or money. Sales can be paid off, postponed or " +
      'cancelled at the last minute, and some liens may survive. Confirm everything with the official source, and get your own title, ' +
      'legal, tax, real estate, financial and inspection advice. Any purchase is between you and the seller, and at your own risk.',
  },
  professionals: {
    title: 'Advertisements, not recommendations',
    text:
      'Professionals listed here pay to advertise. Being listed is not an endorsement. We check licenses on the official regulator lookup, ' +
      "but we don't supervise anyone's work and aren't responsible for any agreement, advice or outcome. Interview several, check the " +
      'license yourself, and get every agreement in writing.',
  },
  financing: {
    title: "We don't offer financing",
    text:
      'Lenders listed here pay to advertise. Being listed is not an endorsement. ' +
      "We help you find lenders to contact. We don't make, arrange, broker or negotiate loans, recommend a lender, or guarantee credit. " +
      "Any terms are between you and the lender, and we aren't responsible for them. Compare several offers in writing: a Loan Estimate " +
      "for a home loan, or the lender's term sheet and disclosures for a business loan like a flip or rental, which often doesn't get one. Read every " +
      "disclosure, check the lender's license with its regulator (often on NMLS), and never pay fees or wire money before you have verified the lender.",
  },
  services: {
    title: 'Hire carefully',
    text:
      'Service providers listed here pay to advertise. Being listed is not an endorsement. Check the license and insurance yourself, get ' +
      "written bids and contracts, and never pay large sums upfront. We aren't a party to your agreement and aren't responsible for the work.",
  },
};
