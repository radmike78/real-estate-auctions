// Advertising plans, and how many advertisers each category can hold. Shared by the server (checkout, webhooks,
// admin billing) and the browser (plan chooser, directory, topic ads).
//
//  - Standard: a profile page and a place in the category's directory list, shown in fair rotating order.
//  - Premium: Standard, plus a separate box labeled "Featured ad" on the category's directory pages, shown above the
//    list. It never moves anyone up in the list itself: the list keeps the same rotation for everyone (pros.ts).
//  - Premium Plus: Premium, plus one labeled advertiser box beside one Learn or Practice topic (adTopics.ts).
//
// Prices are never set here: they come from the operator's Stripe configuration (STRIPE_PLANS, server/stripe.ts).

import { AD_TOPICS, adTopicByKey, type AdTopic } from './adTopics';
import { CATEGORIES, type Category } from './pros';

export type AdTier = 'standard' | 'premium' | 'premium_plus';
export const AD_TIERS: AdTier[] = ['standard', 'premium', 'premium_plus'];
export const isAdTier = (v: unknown): v is AdTier => typeof v === 'string' && (AD_TIERS as string[]).includes(v);

export const TIER_INFO: Record<AdTier, { label: string; includes: string[]; badge?: string }> = {
  standard: {
    label: 'Standard',
    includes: ['Your own profile page with a contact form', 'A place in your category’s directory list, in fair rotating order', 'A results dashboard and a monthly report'],
  },
  premium: {
    label: 'Premium',
    includes: ['Everything in Standard', 'A separate box labeled “Featured ad” on your category’s directory pages, above the list'],
  },
  premium_plus: {
    label: 'Premium Plus',
    includes: ['Everything in Premium', 'A labeled ad beside one Learn or Practice topic you choose'],
    badge: 'Best value',
  },
};

/** How many advertisers each category holds at once. Change them here; checkout and admin billing enforce them. */
export const CAPS = {
  /** Listed advertisers per category, all plans counted. */
  listing: 5,
  /** Featured ad spots per category (Premium and Premium Plus). */
  featured: 2,
  /** Topic ad spots per category and topic, for real estate settlement services (they rotate). Premium Plus also takes
   * a Featured spot, so this can't usefully be more than `featured`. */
  topicSettlement: 2,
  /** Topic ad spots per category and topic for every other category (exclusive). */
  topicOther: 1,
} as const;

/**
 * Real estate settlement-service categories (RESPA). Several of them share a topic spot in rotation, so no single
 * one is presented as the choice; other categories hold a topic spot alone.
 */
export const RESPA_CATEGORIES: ReadonlySet<Category> = new Set<Category>(['agent', 'loan_officer', 'mortgage_company', 'bank', 'credit_union', 'private_lender', 'title_escrow', 'attorney']);

export const hasFeaturedBox = (t: AdTier) => t === 'premium' || t === 'premium_plus';
export const topicCap = (c: Category) => (RESPA_CATEGORIES.has(c) ? CAPS.topicSettlement : CAPS.topicOther);

/** The Learn and Practice topics an advertiser in this category can choose for Premium Plus. */
export const topicsFor = (c: Category): AdTopic[] => AD_TOPICS.filter((t) => t.categories.includes(c));
export const topicAllowed = (c: Category, key: unknown): key is string => typeof key === 'string' && topicsFor(c).some((t) => t.key === key);

/** Short license label shown in ad boxes (the NMLS ID for mortgage lenders). */
export const SHORT_LICENSE_LABEL: Record<Category, string> = {
  agent: 'Nevada license',
  loan_officer: 'NMLS ID',
  mortgage_company: 'NMLS ID',
  bank: 'FDIC cert.',
  credit_union: 'NCUA charter',
  private_lender: 'NMLS ID',
  title_escrow: 'Nevada Division of Insurance license',
  insurance: 'Nevada insurance license',
  contractor: 'NSCB license',
  home_inspector: 'Nevada inspector certificate',
  property_manager: 'Nevada property management permit',
  attorney: 'State Bar of Nevada no.',
  cpa: 'Nevada CPA certificate',
};

/** Fine print under every ad box. */
export const AD_FINE_PRINT = 'Paid ad. DeedOwl checks that advertisers hold an active license but doesn’t recommend, rank or review them. Compare more than one.';

/** One advertiser's current spot: what counts toward the caps. */
export interface Placement {
  id: string;
  category: Category;
  tier: AdTier;
  topic: string | null;
}

export type CapProblem = { kind: 'listing' | 'featured' | 'topic'; cap: number };

/**
 * Whether `want` fits next to the advertisers already listed (`current`, which may include `want` itself: it's left
 * out of the count). Null when it fits.
 */
export function capProblem(current: Placement[], want: Placement): CapProblem | null {
  const others = current.filter((p) => p.id !== want.id && p.category === want.category);
  if (others.length >= CAPS.listing) return { kind: 'listing', cap: CAPS.listing };
  if (hasFeaturedBox(want.tier) && others.filter((p) => hasFeaturedBox(p.tier)).length >= CAPS.featured) return { kind: 'featured', cap: CAPS.featured };
  if (want.tier === 'premium_plus' && want.topic) {
    const cap = topicCap(want.category);
    if (others.filter((p) => p.tier === 'premium_plus' && p.topic === want.topic).length >= cap) return { kind: 'topic', cap };
  }
  return null;
}

/** What to tell an advertiser when a spot is full. */
export function capMessage(problem: CapProblem, category: Category, topic: string | null = null): string {
  const plural = CATEGORIES[category].plural;
  if (problem.kind === 'listing') return `The ${plural} directory is full right now: it lists up to ${problem.cap} advertisers at a time. Try again later.`;
  if (problem.kind === 'featured') return `All ${problem.cap} Featured ad spots for ${plural} are taken right now. Choose Standard, or try again later.`;
  const label = adTopicByKey(topic)?.label ?? 'this topic';
  return problem.cap === 1
    ? `The ${label} ad spot for ${plural} is taken right now. Choose another topic or plan, or try again later.`
    : `All ${problem.cap} ${label} ad spots for ${plural} are taken right now. Choose another topic or plan, or try again later.`;
}

/** Picks up to `n` items in a random order (a fresh shuffle per page view). */
export function pickRandom<T>(items: T[], n: number, random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
