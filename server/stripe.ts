// Online payments for advertisers, through Stripe.
//
// Design:
//  - Card details never touch this server: advertisers pay on Stripe-hosted Checkout and manage
//    their card or cancel on Stripe's billing portal.
//  - One flat monthly price per category, set by the operator (STRIPE_PLANS). The price is chosen
//    server-side from the advertiser's category; nothing about price comes from the browser.
//  - A listing is paid only when Stripe says so, in a signed webhook (invoice.paid). The
//    "success" redirect back from Checkout grants nothing.
//  - Webhooks are verified with the endpoint secret (HMAC-SHA256 over the exact raw body,
//    5-minute timestamp tolerance, constant-time compare), and each event is processed once.
//  - API calls go only to https://api.stripe.com, with idempotency keys on creates.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { CATEGORIES, type Category } from '../src/lib/pros';

export interface StripePlan {
  priceId: string; // Stripe Price ID (price_...), a recurring monthly price
  amountLabel: string; // shown to advertisers, e.g. "$199 / month"
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  plans: Partial<Record<Category, StripePlan>>;
  fetchImpl?: typeof fetch;
}

const API = 'https://api.stripe.com/v1/';
export const CHECKOUT_URL_PREFIX = 'https://checkout.stripe.com/';
export const PORTAL_URL_PREFIX = 'https://billing.stripe.com/';
const TOLERANCE_SEC = 300;

/** Parses STRIPE_PLANS: {"agent": {"priceId": "price_...", "amountLabel": "$199 / month"}, ...}. Throws on anything unexpected. */
export function parsePlans(json: string): Partial<Record<Category, StripePlan>> {
  const raw = JSON.parse(json) as Record<string, unknown>;
  const out: Partial<Record<Category, StripePlan>> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!(k in CATEGORIES)) throw new Error(`STRIPE_PLANS: unknown category "${k}"`);
    const p = v as Partial<StripePlan>;
    if (typeof p?.priceId !== 'string' || !/^price_[A-Za-z0-9]{6,}$/.test(p.priceId)) throw new Error(`STRIPE_PLANS.${k}.priceId must be a Stripe price ID (price_...)`);
    if (typeof p.amountLabel !== 'string' || !p.amountLabel.trim() || p.amountLabel.length > 40) throw new Error(`STRIPE_PLANS.${k}.amountLabel must be short text like "$199 / month"`);
    out[k as Category] = { priceId: p.priceId, amountLabel: p.amountLabel.trim() };
  }
  return out;
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

  return {
    plans: cfg.plans,
    planFor: (c: Category) => cfg.plans[c] ?? null,

    createCustomer: (p: { proId: string; email: string; name: string }) =>
      post<{ id: string }>('customers', { email: p.email, name: p.name, metadata: { proId: p.proId } }, `customer-${p.proId}`),

    createCheckoutSession: (p: { proId: string; customerId: string; priceId: string; successUrl: string; cancelUrl: string; attempt: string }) =>
      post<{ id: string; url: string }>(
        'checkout/sessions',
        {
          mode: 'subscription',
          customer: p.customerId,
          client_reference_id: p.proId,
          line_items: { 0: { price: p.priceId, quantity: 1 } },
          subscription_data: { metadata: { proId: p.proId } },
          success_url: p.successUrl,
          cancel_url: p.cancelUrl,
        },
        `checkout-${p.proId}-${p.attempt}`,
      ),

    createPortalSession: (p: { customerId: string; returnUrl: string }) =>
      post<{ url: string }>('billing_portal/sessions', { customer: p.customerId, return_url: p.returnUrl }),
  };
}
export type StripeClient = ReturnType<typeof createStripeClient>;

/** Latest service period end (Unix seconds) covered by a paid invoice. */
export function invoicePeriodEnd(invoice: Record<string, unknown>): number | null {
  const lines = ((invoice.lines as { data?: { period?: { end?: number } }[] } | undefined)?.data ?? []).map((l) => l.period?.end ?? 0);
  const end = Math.max(0, ...lines, Number(invoice.period_end) || 0);
  return end > 0 ? end : null;
}

/** The subscription ID an invoice belongs to, across Stripe API versions. */
export function invoiceSubscriptionId(invoice: Record<string, unknown>): string | null {
  const direct = invoice.subscription;
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object' && typeof (direct as { id?: unknown }).id === 'string') return (direct as { id: string }).id;
  const parent = (invoice.parent as { subscription_details?: { subscription?: string } } | undefined)?.subscription_details?.subscription;
  return typeof parent === 'string' ? parent : null;
}
