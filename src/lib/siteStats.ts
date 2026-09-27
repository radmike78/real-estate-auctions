// Site-wide visit counting, shared by the browser (what it reports) and the server (what it accepts).
// Only these fixed keys are ever stored, as daily totals. See server/metrics.ts for how unique
// visitors are counted without storing anything that identifies them.

/** Public sections of the site. Admin and advertiser pages are never counted. */
export const SITE_PAGES = {
  home: 'Home',
  search: 'Property search',
  property: 'Property pages',
  live: 'Live tax sales',
  preforeclosures: 'Pre-foreclosure tracker',
  shortsales: 'Short sales guide',
  bankowned: 'Bank-owned & government homes',
  businessassets: 'Business assets & closures',
  playbook: 'Nevada playbooks',
  practice: 'Practice buying',
  calculator: 'Max bid calculator',
  deals: 'My deals',
  alerts: 'Email alerts',
  agents: 'Find an agent',
  financing: 'Financing',
  pros: 'Title, insurance & repairs',
  pro: 'Advertiser profiles',
  homeowner: 'Homeowner help',
  about: 'How it works',
  advertise: 'Advertise with us',
  other: 'Other pages',
} as const;
export type SitePage = keyof typeof SITE_PAGES;

/** Actions that show people researching and acting on deals. */
export const SITE_ACTIONS = {
  calculator_used: 'Used the max bid calculator',
  deal_saved: 'Saved a deal',
  photos_opened: 'Opened photos & views',
  official_source: 'Went to an official government source',
  bank_owned_source: 'Went to a bank or Fannie Mae / Freddie Mac listing site',
} as const;
export type SiteAction = keyof typeof SITE_ACTIONS;

export const isSitePage = (k: unknown): k is SitePage => typeof k === 'string' && Object.prototype.hasOwnProperty.call(SITE_PAGES, k);
export const isSiteAction = (k: unknown): k is SiteAction => typeof k === 'string' && Object.prototype.hasOwnProperty.call(SITE_ACTIONS, k);

/** Which section a route belongs to, or null for pages that are never counted (admin, advertiser dashboard). */
export function sitePageFor(route: string): SitePage | null {
  if (route === 'admin' || route === 'advertiser' || route === 'applicationConfirm') return null;
  if (route === 'apply') return 'advertise';
  if (route === 'practiceRun') return 'practice';
  if (route === 'disclaimer' || route === 'privacy' || route === 'terms') return 'other';
  return isSitePage(route) ? route : 'other';
}

const BANK_OWNED_HOSTS = /(^|\.)(fanniemae\.com|homesteps\.com|bankofamerica\.com|firstcitizens\.com|usbank\.com|chase\.com)$/;

/** What kind of outside link a visitor followed, for the stats; null for links we don't count. */
export function outboundAction(href: string): SiteAction | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  if ((host === 'www.google.com' || host === 'google.com') && u.pathname.startsWith('/maps')) return 'photos_opened';
  if (host === 'maps.clarkcountynv.gov' && /^\/(openweb|assessor\/webimages)/.test(u.pathname)) return 'photos_opened';
  if (host.endsWith('.gov')) return 'official_source';
  if (BANK_OWNED_HOSTS.test(host)) return 'bank_owned_source';
  return null;
}
