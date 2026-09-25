// Business details shown on the Privacy Policy and Terms of Use pages.
// EDIT BEFORE LAUNCH: replace the bracketed placeholders, set the effective dates, and set
// LEGAL_REVIEWED to true once a Nevada attorney has reviewed both pages.

export const SITE_INFO = {
  siteName: 'Forced-Sale Finder',
  /** The legal name of the business that runs the site (LLC, corporation or sole proprietor). */
  operatorName: '[Legal business name]',
  /** Mailing address for legal notices. */
  mailingAddress: '[Street address, City, NV ZIP]',
  /** Where people send privacy requests, including requests not to sell their information (NRS 603A.345). */
  privacyEmail: '[privacy@your-domain]',
  /** General contact for questions about the Terms. */
  contactEmail: '[contact@your-domain]',
  /** State whose law governs the Terms, and where disputes are heard. */
  governingLaw: 'Nevada',
  venue: 'Clark County, Nevada',
};

/** Dates the current versions take effect (YYYY-MM-DD). Update when either page changes materially. */
export const PRIVACY_EFFECTIVE = '2026-10-01';
export const TERMS_EFFECTIVE = '2026-10-01';

/** false = both pages show a "draft, under legal review" notice. */
export const LEGAL_REVIEWED = false;

/** True while any placeholder above is still in brackets. */
export const hasPlaceholders = () => Object.values(SITE_INFO).some((v) => /^\[.*\]$/.test(v));
