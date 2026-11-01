// Fixed ad spots: the places across the site where Spotlight and Mentor Connect advertisers appear together in a labeled
// "Advertisement" box. The site owner turns each spot on or off, and picks which kinds of professionals it shows, in
// Admin → Ad spots. Saved on the server (GET /api/ad-spots); without the server, the defaults below apply.
//
// Pages for homeowners (homeowner help, pre-foreclosures, surplus money) and business closures have no spot and
// can't be given one: an ad there could reach owners in distress, which the site never helps anyone do (CLAUDE.md).
// "Automatic" spots (Analyze a deal, My plan) show the professionals the deal or step needs, and only when buying
// through an agent (contextAds.ts); the owner can replace that with a fixed list.
import { CATEGORIES, type Category } from './pros';

export interface AdSpot {
  key: string;
  /** Where it shows, as the owner sees it in Admin and advertisers see it on the Advertise page. */
  label: string;
  /** What the spot sits next to. */
  where: string;
  /** Kinds of professionals suggested (shown when the owner hasn't chosen; for automatic spots, when they switch to a list). */
  categories: Category[];
  /** The page picks the professionals itself (by plan or step); the owner may still choose a fixed list. */
  auto?: boolean;
  /** On until the owner turns it off. */
  on?: boolean;
}

const LENDERS: Category[] = ['loan_officer', 'mortgage_company', 'bank', 'credit_union'];
const BUYER_TEAM: Category[] = ['agent', ...LENDERS, 'title_escrow', 'attorney', 'home_inspector'];
const INVESTOR_TEAM: Category[] = [...BUYER_TEAM, 'insurance', 'property_manager', 'contractor', 'cpa', 'private_lender'];

export const AD_SPOTS: AdSpot[] = [
  { key: 'finddeals', label: 'Find deals', where: 'after the official sources, before “Other sites”', categories: BUYER_TEAM, on: true },
  { key: 'analyze', label: 'Analyze a deal', where: 'beside “What’s next”', categories: INVESTOR_TEAM, auto: true, on: true },
  { key: 'toolkit', label: 'My plan', where: 'beside “Your next step”', categories: INVESTOR_TEAM, auto: true, on: true },
  { key: 'deals', label: 'My deals', where: 'after your saved deals', categories: INVESTOR_TEAM },
  { key: 'dealPacket', label: 'Deal packet', where: 'after the packet', categories: INVESTOR_TEAM },
  { key: 'learn', label: 'Learn (the list of lessons) and strategy guides', where: 'after the lessons, and at the end of each strategy guide (not the auctions guide)', categories: INVESTOR_TEAM },
  { key: 'lesson', label: 'Lessons (not the forced-sales lesson)', where: 'at the end of the lesson', categories: INVESTOR_TEAM },
  { key: 'decide', label: 'Decide', where: 'at the end of the page', categories: INVESTOR_TEAM },
  { key: 'practice', label: 'Practice (the main page)', where: 'at the end of the page', categories: INVESTOR_TEAM },
  { key: 'drill', label: 'Practice drills (not forced-sale, lien or short-sale drills)', where: 'at the end of the drill', categories: INVESTOR_TEAM },
  { key: 'practiceCase', label: 'Practice purchase', where: 'at the end of each step', categories: BUYER_TEAM },
  { key: 'guides', label: 'Guides (the list)', where: 'at the end of the page', categories: INVESTOR_TEAM },
  { key: 'playbook', label: 'Sale guides for bank-owned homes and short sales', where: 'at the end of those guides and the list of guides', categories: BUYER_TEAM },
  { key: 'bankowned', label: 'Bank-owned and government homes', where: 'at the end of the page', categories: BUYER_TEAM },
  { key: 'shortsales', label: 'Short sales (for buyers)', where: 'at the end of the page', categories: BUYER_TEAM },
  { key: 'financing', label: 'Financing', where: 'at the end of the page', categories: [...LENDERS, 'private_lender'] },
  { key: 'propertyType', label: 'Property types', where: 'at the end of the page', categories: INVESTOR_TEAM },
  { key: 'property', label: 'Each property page', where: 'at the end of the page', categories: BUYER_TEAM },
];

export const adSpotByKey = (k: string) => AD_SPOTS.find((s) => s.key === k);

/** What the owner chose for one spot. `categories: 'auto'` only on automatic spots. */
export interface SpotSetting {
  on: boolean;
  categories: Category[] | 'auto';
}
export type SpotSettings = Record<string, SpotSetting>;

export const defaultSpot = (s: AdSpot): SpotSetting => ({ on: !!s.on, categories: s.auto ? 'auto' : [...s.categories] });
export const DEFAULT_SPOTS: SpotSettings = Object.fromEntries(AD_SPOTS.map((s) => [s.key, defaultSpot(s)]));

/** Settings from storage or a request, cleaned: unknown spots and categories dropped, every spot present. */
export function cleanSpots(v: unknown): SpotSettings {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  return Object.fromEntries(
    AD_SPOTS.map((s) => {
      const x = o[s.key] && typeof o[s.key] === 'object' ? (o[s.key] as Record<string, unknown>) : null;
      if (!x) return [s.key, defaultSpot(s)];
      const cats = x.categories === 'auto' && s.auto ? 'auto' : Array.isArray(x.categories) ? [...new Set(x.categories.filter((c): c is Category => typeof c === 'string' && Object.prototype.hasOwnProperty.call(CATEGORIES, c)))] : defaultSpot(s).categories;
      return [s.key, { on: x.on === true, categories: cats }];
    }),
  );
}

/**
 * The professionals a spot shows right now, or none when it's off. `auto`: what the page itself would pick (by plan
 * or step); an automatic spot left on "automatic" shows nothing when the page picks no one.
 */
export function spotCategories(settings: SpotSettings, key: string, auto: Category[] = []): Category[] {
  const s = settings[key];
  if (!s?.on) return [];
  return s.categories === 'auto' ? auto : s.categories;
}

/** The spots that are on, for the Advertise page. */
export const spotsOn = (settings: SpotSettings) => AD_SPOTS.filter((s) => settings[s.key]?.on);

/** Every ad placement an advertiser's report can name: the page spots above plus the category page, the Your team
 * rotating ad, the professional list and topic ads. Shared by the browser (what it reports) and the server (what it accepts). */
export const AD_PLACEMENTS: Record<string, string> = {
  category: 'Your category’s page (Featured ad)',
  directory: 'Financing page (Featured ad)',
  team: 'Your team (rotating ad)',
  topic: 'Learn and Practice topic ad',
  ...Object.fromEntries(AD_SPOTS.map((s) => [s.key, s.label])),
};
export const isAdPlacement = (k: unknown): k is string => typeof k === 'string' && Object.prototype.hasOwnProperty.call(AD_PLACEMENTS, k);
