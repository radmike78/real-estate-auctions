// Online payments for advertisers, through Stripe.
//
// Design:
//  - Card details never touch this server: advertisers pay on Stripe-hosted Checkout and manage
//    their card or cancel on Stripe's billing portal.
//  - Three monthly plans (Standard, Premium, Premium Plus: src/lib/adPlans.ts), priced by the operator per category
//    or with one default for all ("*") in STRIPE_PLANS. The browser only names the plan; the price (and any
//    founding-advertiser coupon) is chosen server-side from the advertiser's category and record.
//  - Advertisers can type a promotion code the operator created in Stripe on the Checkout page, unless a founding
//    coupon is already applied (Stripe allows one or the other in a session).
//  - A listing is paid only when Stripe says so, in a signed webhook (invoice.paid). The
//    "success" redirect back from Checkout grants nothing.
//  - Webhooks are verified with the endpoint secret (HMAC-SHA256 over the exact raw body,
//    5-minute timestamp tolerance, constant-time compare), and each event is processed once.
//  - API calls go only to https://api.stripe.com, with idempotency keys on creates.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { AD_TIERS, isAdTier, type AdTier } from '../src/lib/adPlans';
import { CATEGORIES, type Category } from '../src/lib/pros';

export interface StripePlan {
  priceId: string; // Stripe Price ID (price_...), a recurring monthly price
  amountLabel: string; // shown to advertisers, e.g. "$199 / month"
  /** Stripe coupon applied at checkout for founding advertisers (marked by an admin). */
  foundingCoupon?: string;
  /** The founding price shown to founding advertisers, e.g. "$139 / month for 12 months". */
  foundingLabel?: string;
}

export type CategoryPlans = Partial<Record<AdTier, StripePlan>>;
/** Plans per category; "*" is the default for categories not listed. */
export type StripePlans = Partial<Record<Category | '*', CategoryPlans>>;

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  plans: StripePlans;
  fetchImpl?: typeof fetch;
}

const API = 'https://api.stripe.com/v1/';
export const CHECKOUT_URL_PREFIX = 'https://checkout.stripe.com/';
export const PORTAL_URL_PREFIX = 'https://billing.stripe.com/';
const TOLERANCE_SEC = 300;

const PRICE_RE = /^price_[A-Za-z0-9]{6,}$/;
const COUPON_RE = /^[A-Za-z0-9_-]{1,64}$/;

function parsePlan(where: string, v: unknown): StripePlan {
  const p = (v ?? {}) as Record<string, unknown>;
  if (typeof p.priceId !== 'string' || !PRICE_RE.test(p.priceId)) throw new Error(`STRIPE_PLANS.${where}.priceId must be a Stripe price ID (price_...)`);
  if (typeof p.amountLabel !== 'string' || !p.amountLabel.trim() || p.amountLabel.length > 40) throw new Error(`STRIPE_PLANS.${where}.amountLabel must be short text like "$199 / month"`);
  for (const k of Object.keys(p)) if (!['priceId', 'amountLabel', 'foundingCoupon', 'foundingLabel'].includes(k)) throw new Error(`STRIPE_PLANS.${where}: unknown field "${k}"`);
  const out: StripePlan = { priceId: p.priceId, amountLabel: p.amountLabel.trim() };
  if (p.foundingCoupon !== undefined) {
    if (typeof p.foundingCoupon !== 'string' || !COUPON_RE.test(p.foundingCoupon)) throw new Error(`STRIPE_PLANS.${where}.foundingCoupon must be a Stripe coupon ID (letters, digits, _ and -)`);
    out.foundingCoupon = p.foundingCoupon;
  }
  if (p.foundingLabel !== undefined) {
    if (typeof p.foundingLabel !== 'string' || !p.foundingLabel.trim() || p.foundingLabel.length > 60) throw new Error(`STRIPE_PLANS.${where}.foundingLabel must be short text like "$139 / month for 12 months"`);
    if (!out.foundingCoupon) throw new Error(`STRIPE_PLANS.${where}.foundingLabel needs a foundingCoupon (the price shown must be the price charged)`);
    out.foundingLabel = p.foundingLabel.trim();
  }
  return out;
}

/**
 * Parses STRIPE_PLANS. Two shapes:
 *  - plans: {"*": {"standard": {"priceId": "price_...", "amountLabel": "$99 / month", "foundingCoupon": "FOUNDING_STD",
 *    "foundingLabel": "$69 / month for 12 months"}, "premium": {...}, "premium_plus": {...}}, "agent": {...}}
 *    where "*" covers every category not listed by name;
 *  - the older flat shape {"agent": {"priceId": "price_...", "amountLabel": "$199 / month"}}: Standard only.
 * Throws on anything unexpected.
 */
export function parsePlans(json: string): StripePlans {
  const raw = JSON.parse(json) as unknown;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('STRIPE_PLANS must be a JSON object');
  const out: StripePlans = {};
  const tierOfPrice = new Map<string, AdTier>();
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k !== '*' && !Object.prototype.hasOwnProperty.call(CATEGORIES, k)) throw new Error(`STRIPE_PLANS: unknown category "${k}"`);
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`STRIPE_PLANS.${k} must be an object`);
    const entry = v as Record<string, unknown>;
    const plans: CategoryPlans = {};
    if ('priceId' in entry) plans.standard = parsePlan(k, entry);
    else {
      for (const [t, plan] of Object.entries(entry)) {
        if (!isAdTier(t)) throw new Error(`STRIPE_PLANS.${k}: unknown plan "${t}" (use ${AD_TIERS.join(', ')})`);
        plans[t] = parsePlan(`${k}.${t}`, plan);
      }
    }
    for (const [t, plan] of Object.entries(plans) as [AdTier, StripePlan][]) {
      // Payments are matched back to a plan by price, so one price can't stand for two plans.
      if ((tierOfPrice.get(plan.priceId) ?? t) !== t) throw new Error(`STRIPE_PLANS: ${plan.priceId} is used for two different plans`);
      tierOfPrice.set(plan.priceId, t);
    }
    out[k as Category | '*'] = plans;
  }
  return out;
}

/** The plan for a category and tier: the category's own entry if it has one, otherwise the "*" default. */
export function planFor(plans: StripePlans, c: Category, tier: AdTier = 'standard'): StripePlan | null {
  const entry = plans[c] ?? plans['*'];
  return entry?.[tier] ?? null;
}

/** Which plan a Stripe price belongs to (for payments and plan switches made on Stripe's pages). */
export function tierForPrice(plans: StripePlans, priceId: string): AdTier | null {
  for (const entry of Object.values(plans)) for (const t of AD_TIERS) if (entry?.[t]?.priceId === priceId) return t;
  return null;
}

/**
 * Verifies a Stripe-Signature header against the raw request body. Returns the parsed event,
 * or throws. See https://docs.stripe.com/webhooks#verify-manually.
 */
export function verifyWebhook(rawBody: Buffer, header: string | undefined, secret: string, nowSec = Math.floor(Date.now() / 1000)): StripeEvent {
  if (!header) throw new Error('Missing Stripe-Signature');
  let t = NaN;
  const sigs: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2).map((s) => s.trim());
    if (k === 't') t = Number(v);
    else if (k === 'v1' && /^[a-f0-9]{64}$/.test(v ?? '')) sigs.push(v);
  }
  if (!Number.isInteger(t) || !sigs.length) throw new Error('Malformed Stripe-Signature');
  if (Math.abs(nowSec - t) > TOLERANCE_SEC) throw new Error('Stripe-Signature timestamp outside tolerance');
  const expected = createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest();
  if (!sigs.some((s) => timingSafeEqual(Buffer.from(s, 'hex'), expected))) throw new Error('Stripe signature mismatch');
  const event = JSON.parse(rawBody.toString('utf8')) as StripeEvent;
  if (typeof event?.id !== 'string' || typeof event.type !== 'string' || !event.data?.object) throw new Error('Unexpected event shape');
  return event;
}

/** Signs a payload the way Stripe does (used by tests and for local webhook testing). */
export function signWebhook(payload: string, secret: string, t = Math.floor(Date.now() / 1000)): string {
  return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
}

export interface StripeEvent {
  id: string;
  type: string;
  created?: number;
  data: { object: Record<string, unknown> };
}

/** Form-encodes nested params the way Stripe's API expects (a[b][c]=v). */
function form(params: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export function createStripeClient(cfg: StripeConfig) {
  const doFetch = cfg.fetchImpl ?? fetch;

  async function post<T>(path: string, params: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
    const res = await doFetch(API + path, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${cfg.secretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      },
      body: form(params).toString(),
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      // Log Stripe's error type only; never the request (it can contain customer details).
      const err = body.error as { type?: string; code?: string } | undefined;
      throw new Error(`Stripe ${path} failed (${res.status} ${err?.type ?? ''} ${err?.code ?? ''})`.trim());
    }
    return body as T;
  }

  async function get<T>(path: string): Promise<T> {
    const res = await doFetch(API + path, { headers: { authorization: `Bearer ${cfg.secretKey}` }, redirect: 'error', signal: AbortSignal.timeout(20_000) });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = body.error as { type?: string; code?: string } | undefined;
      throw new Error(`Stripe GET ${path.split('/')[0]} failed (${res.status} ${err?.type ?? ''} ${err?.code ?? ''})`.trim());
    }
    return body as T;
  }

  return {
    plans: cfg.plans,
    planFor: (c: Category, tier: AdTier = 'standard') => planFor(cfg.plans, c, tier),
    tierForPrice: (priceId: string) => tierForPrice(cfg.plans, priceId),

    createCustomer: (p: { proId: string; email: string; name: string }) =>
      post<{ id: string }>('customers', { email: p.email, name: p.name, metadata: { proId: p.proId } }, `customer-${p.proId}`),

    createCheckoutSession: (p: { proId: string; customerId: string; priceId: string; quantity: number; tier: AdTier; topic: string | null; coupon: string | null; successUrl: string; cancelUrl: string; attempt: string }) =>
      post<{ id: string; url: string }>(
        'checkout/sessions',
        {
          mode: 'subscription',
          customer: p.customerId,
          client_reference_id: p.proId,
          // One unit per ad area (a city or a whole county), at the plan's price.
          line_items: { 0: { price: p.priceId, quantity: p.quantity } },
          // Stripe takes either a coupon applied here or a code the advertiser types, never both.
          ...(p.coupon ? { discounts: { 0: { coupon: p.coupon } } } : { allow_promotion_codes: true }),
          // A code that covers the whole price (e.g. 100% off for 6 months) needs no card until it runs out; Stripe
          // then asks for one, and an unpaid invoice stops the listing from being extended.
          payment_method_collection: 'if_required',
          subscription_data: { metadata: { proId: p.proId, tier: p.tier, ...(p.topic ? { topic: p.topic } : {}) } },
          success_url: p.successUrl,
          cancel_url: p.cancelUrl,
        },
        `checkout-${p.proId}-${p.attempt}`,
      ),

    createPortalSession: (p: { customerId: string; returnUrl: string }) =>
      post<{ url: string }>('billing_portal/sessions', { customer: p.customerId, return_url: p.returnUrl }),

    /**
     * Changes how many ad areas a subscription pays for. Stripe charges (or credits) the difference for the rest of the
     * period right away (proration_behavior always_invoice); the new quantity comes back in customer.subscription.updated.
     * With payment_behavior pending_if_incomplete, a declined card leaves the old quantity in place instead of adding
     * areas nobody paid for.
     */
    async setQuantity(subscriptionId: string, quantity: number, idempotencyKey: string) {
      if (!/^sub_[A-Za-z0-9]{6,}$/.test(subscriptionId)) throw new Error('Unexpected subscription ID');
      const sub = await get<Record<string, unknown>>(`subscriptions/${subscriptionId}`);
      const item = ((sub.items as { data?: { id?: unknown }[] } | undefined)?.data ?? [])[0];
      if (typeof item?.id !== 'string' || !/^si_[A-Za-z0-9]{6,}$/.test(item.id)) throw new Error('Subscription has no item');
      return post<Record<string, unknown>>(`subscriptions/${subscriptionId}`, { items: { 0: { id: item.id, quantity } }, proration_behavior: 'always_invoice', payment_behavior: 'pending_if_incomplete' }, idempotencyKey);
    },
  };
}
export type StripeClient = ReturnType<typeof createStripeClient>;

/** Latest service period end (Unix seconds) covered by a paid invoice. */
export function invoicePeriodEnd(invoice: Record<string, unknown>): number | null {
  const lines = ((invoice.lines as { data?: { period?: { end?: number } }[] } | undefined)?.data ?? []).map((l) => l.period?.end ?? 0);
  const end = Math.max(0, ...lines, Number(invoice.period_end) || 0);
  return end > 0 ? end : null;
}

/** The price IDs on an invoice's lines, across Stripe API versions (line.price, or line.pricing.price_details.price). */
export function invoicePriceIds(invoice: Record<string, unknown>): string[] {
  const lines = ((invoice.lines as { data?: unknown[] } | undefined)?.data ?? []) as Record<string, unknown>[];
  const ids: string[] = [];
  for (const l of lines) {
    const price = l?.price as unknown;
    const details = (l?.pricing as { price_details?: { price?: unknown } } | undefined)?.price_details?.price;
    for (const v of [price, details]) {
      const id = typeof v === 'string' ? v : v && typeof v === 'object' ? (v as { id?: unknown }).id : null;
      if (typeof id === 'string' && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** The subscription's metadata as copied onto an invoice, across Stripe API versions. */
export function invoiceSubscriptionMetadata(invoice: Record<string, unknown>): Record<string, string> {
  const fromParent = (invoice.parent as { subscription_details?: { metadata?: unknown } } | undefined)?.subscription_details?.metadata;
  const legacy = (invoice.subscription_details as { metadata?: unknown } | undefined)?.metadata;
  const m = (fromParent ?? legacy ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(m).filter((e): e is [string, string] => typeof e[1] === 'string'));
}

/** Whether a discount (coupon or promotion code) applied to an invoice, and its total in cents when Stripe says. */
export function invoiceDiscount(invoice: Record<string, unknown>): { applied: boolean; cents: number } {
  const totals = Array.isArray(invoice.total_discount_amounts) ? (invoice.total_discount_amounts as { amount?: unknown }[]) : [];
  const cents = totals.reduce((n, d) => n + (typeof d?.amount === 'number' ? d.amount : 0), 0);
  // Some API versions and trimmed payloads list the discounts without amounts.
  const listed = (Array.isArray(invoice.discounts) && invoice.discounts.length > 0) || (!!invoice.discount && typeof invoice.discount === 'object');
  return { applied: cents > 0 || listed, cents };
}

/** The price of a subscription's first item (subscription events), or null. */
export function subscriptionPriceId(sub: Record<string, unknown>): string | null {
  const item = ((sub.items as { data?: { price?: unknown }[] } | undefined)?.data ?? [])[0];
  const price = item?.price;
  const id = typeof price === 'string' ? price : price && typeof price === 'object' ? (price as { id?: unknown }).id : null;
  return typeof id === 'string' ? id : null;
}

/** How many units (ad areas) a subscription's first item is for, or null. */
export function subscriptionQuantity(sub: Record<string, unknown>): number | null {
  const q = ((sub.items as { data?: { quantity?: unknown }[] } | undefined)?.data ?? [])[0]?.quantity;
  return typeof q === 'number' && Number.isInteger(q) && q > 0 ? q : null;
}

/**
 * The most units on an invoice's charge lines for these prices, or null. Credit lines (negative amounts, e.g. "unused
 * time" on the old quantity after an advertiser drops an area) are skipped, so a proration invoice gives the new quantity.
 */
export function invoiceQuantity(invoice: Record<string, unknown>, isOurPrice: (priceId: string) => boolean): number | null {
  const lines = ((invoice.lines as { data?: unknown[] } | undefined)?.data ?? []) as Record<string, unknown>[];
  let best: number | null = null;
  for (const l of lines) {
    const ids = invoicePriceIds({ lines: { data: [l] } });
    const q = l?.quantity;
    if (typeof l?.amount === 'number' && l.amount < 0) continue;
    if (ids.some(isOurPrice) && typeof q === 'number' && Number.isInteger(q) && q > 0) best = Math.max(best ?? 0, q);
  }
  return best;
}

/** The subscription ID an invoice belongs to, across Stripe API versions. */
export function invoiceSubscriptionId(invoice: Record<string, unknown>): string | null {
  const direct = invoice.subscription;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object' && typeof (direct as { id?: unknown }).id === 'string') return (direct as { id: string }).id;
  const parent = (invoice.parent as { subscription_details?: { subscription?: string } } | undefined)?.subscription_details?.subscription;
  return typeof parent === 'string' ? parent : null;
}
