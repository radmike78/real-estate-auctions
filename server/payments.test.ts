import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword, newToken, sha256 } from './auth';
import type { Mail } from './mailer';
import { pacificDay } from './metrics';
import { createStripeClient, invoiceDiscount, invoicePriceIds, invoiceSubscriptionMetadata, parsePlans, planFor, signWebhook, subscriptionPriceId, tierForPrice, verifyWebhook } from './stripe';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import { validateApplication, type ApplicationInput } from '../src/lib/proApplication';

const SECRET = 'whsec_testsecret123';

describe('Stripe webhook signatures', () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'invoice.paid', data: { object: { customer: 'cus_1' } } });
  const t = 1_800_000_000;

  it('accepts a correctly signed, fresh event', () => {
    expect(verifyWebhook(Buffer.from(body), signWebhook(body, SECRET, t), SECRET, t + 10).id).toBe('evt_1');
  });
  it('accepts when any one of several v1 signatures matches (secret rotation)', () => {
    const good = signWebhook(body, SECRET, t);
    const header = `t=${t},v1=${'0'.repeat(64)},${good.split(',')[1]}`;
    expect(verifyWebhook(Buffer.from(body), header, SECRET, t).type).toBe('invoice.paid');
  });
  it('rejects a wrong secret, a changed body, an old timestamp and a missing header', () => {
    expect(() => verifyWebhook(Buffer.from(body), signWebhook(body, 'whsec_other', t), SECRET, t)).toThrow(/mismatch/);
    expect(() => verifyWebhook(Buffer.from(body.replace('cus_1', 'cus_2')), signWebhook(body, SECRET, t), SECRET, t)).toThrow(/mismatch/);
    expect(() => verifyWebhook(Buffer.from(body), signWebhook(body, SECRET, t), SECRET, t + 301)).toThrow(/tolerance/);
    expect(() => verifyWebhook(Buffer.from(body), undefined, SECRET, t)).toThrow(/Missing/);
    expect(() => verifyWebhook(Buffer.from(body), 't=abc,v1=zz', SECRET, t)).toThrow(/Malformed/);
  });
  it('validates plan configuration', () => {
    expect(parsePlans('{"agent":{"priceId":"price_ABC123","amountLabel":"$199 / month"}}').agent?.standard?.priceId).toBe('price_ABC123');
    expect(() => parsePlans('{"wizard":{"priceId":"price_ABC123","amountLabel":"$1"}}')).toThrow(/unknown category/);
    expect(() => parsePlans('{"agent":{"priceId":"prod_ABC123","amountLabel":"$1"}}')).toThrow(/price ID/);
  });
});

const AGENT: ApplicationInput = {
  category: 'agent',
  name: 'Robin Payer',
  company: 'Example Brokerage LLC',
  licenseId: 'S.0012345',
  serviceCities: ['Las Vegas'],
  serviceZips: '',
  services: ['Short sales'],
  creditProfiles: [],
  languages: ['English'],
  headline: 'Short-sale specialist',
  phone: '702-555-0100',
  email: 'robin@example.com',
  website: '',
  bio: 'I help buyers navigate short sales and lender approval in the valley.',
  attestLicensed: true,
  attestAccurate: true,
  consentVerification: true,
  attestAdvertising: true,
  attestOriginal: true,
};

describe('advertiser card payments (running server, simulated Stripe)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-pay-'));
  const mails: Mail[] = [];
  const calls: { path: string; params: URLSearchParams; headers: Record<string, string> }[] = [];
  let checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_test_123';
  // Stands in for api.stripe.com: records each request and answers like Stripe would.
  const fakeFetch = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.replace('/v1/', '');
    calls.push({ path, params: new URLSearchParams(String(init?.body ?? '')), headers: init?.headers as Record<string, string> });
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    if (url.hostname !== 'api.stripe.com') return new Response('{}', { status: 500 });
    if (path === 'customers') return json({ id: 'cus_robin' });
    if (path === 'checkout/sessions') return json({ id: 'cs_test_123', url: checkoutUrl });
    if (path === 'billing_portal/sessions') return json({ url: 'https://billing.stripe.com/p/session/test_1' });
    return new Response('{}', { status: 404 });
  }) as typeof fetch;

  let server: Server;
  let base = '';
  let cookie = '';
  let proId = '';
  const keys = generateSigningKeys();
  const app = createApp({
    dbPath: join(dir, 'app.db'),
    dataDir: join(dir, 'data'),
    distDir: null,
    adminUsername: 'admin',
    adminPasswordHash: hashPassword('a-long-admin-password'),
    directorySigningKey: loadPrivateKey(keys.privatePem),
    feedPublicKey: null,
    baseUrl: 'https://fsf.example',
    mailer: { send: async (m) => void mails.push(m) },
    secureCookies: false,
    stripe: {
      client: createStripeClient({ secretKey: 'sk_test_x', webhookSecret: SECRET, plans: parsePlans('{"agent":{"priceId":"price_AGENT199","amountLabel":"$199 / month"}}'), fetchImpl: fakeFetch }),
      webhookSecret: SECRET,
    },
  });

  const pro = (path: string, body?: unknown) =>
    body === undefined
      ? fetch(base + path, { headers: { cookie } })
      : fetch(base + path, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-fsf-request': '1' }, body: JSON.stringify(body) });
  const me = async () => (await pro('/api/pro/me')).json();
  const hook = (event: unknown, secret = SECRET) => {
    const payload = JSON.stringify(event);
    return fetch(base + '/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': signWebhook(payload, secret) }, body: payload });
  };
  const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86_400;
  const invoicePaid = (id: string, customer = 'cus_robin') => ({
    id,
    type: 'invoice.paid',
    data: { object: { customer, subscription: 'sub_1', amount_paid: 19900, currency: 'usd', lines: { data: [{ period: { end: periodEnd } }] } } },
  });

  beforeAll(async () => {
    // An approved (verified) advertiser who hasn't paid yet, signed in to their dashboard.
    const v = validateApplication(AGENT);
    if (!v.ok) throw new Error('fixture invalid');
    proId = 'a'.repeat(24);
    const t = new Date().toISOString();
    app.db.insertApplication({ id: proId, profile: v.profile, tokenHash: sha256('x'), tokenExpires: t, now: t });
    app.db.update(proId, {
      status: 'APPROVED',
      verification: { licenseStatus: 'Active', licenseExpires: '2099-01-01', nameMatches: true, typeMatches: true, companyMatches: true, identityConfirmed: true, contentReviewed: true, identityMethod: 'Called the brokerage main line from the regulator record.', verifiedAt: pacificDay(new Date()), verifiedBy: 'admin' },
    }, t);
    const token = newToken();
    app.db.sessions.create(sha256(token), 'pro', proId, Date.now());
    cookie = `fsf_pro=${token}`;
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => server?.close());

  it('tells pages that online payments are on', async () => {
    expect((await (await fetch(base + '/api/features')).json()).payments).toBe(true);
  });

  it('offers the flat category price and is not listed before paying', async () => {
    const m = await me();
    expect(m.payments).toMatchObject({ available: true, amountLabel: '$199 / month', active: false, hasCard: false });
    expect(m.listed).toBe(false);
  });

  it('starts Stripe Checkout with the server-chosen price, ignoring anything the browser sends', async () => {
    const r = await pro('/api/pro/checkout', { priceId: 'price_EVIL1', amount: 1 });
    expect(r.status).toBe(200);
    expect((await r.json()).url).toBe(checkoutUrl);
    const customer = calls.find((c) => c.path === 'customers')!;
    expect(customer.params.get('metadata[proId]')).toBe(proId);
    const session = calls.find((c) => c.path === 'checkout/sessions')!;
    expect(session.params.get('line_items[0][price]')).toBe('price_AGENT199');
    expect(session.params.get('mode')).toBe('subscription');
    expect(session.params.get('customer')).toBe('cus_robin');
    expect(session.headers['idempotency-key']).toMatch(/^checkout-/);
    expect((await me()).listed).toBe(false); // returning from Checkout grants nothing
  });

  it('requires the app header on checkout (CSRF)', async () => {
    const r = await fetch(base + '/api/pro/checkout', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' });
    expect(r.status).toBe(403);
  });

  it('refuses forged or unsigned webhooks without changing anything', async () => {
    expect((await hook(invoicePaid('evt_forged'), 'whsec_attacker')).status).toBe(400);
    expect((await fetch(base + '/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(invoicePaid('evt_x')) })).status).toBe(400);
    expect((await me()).billing).toBeNull();
  });

  it('a paid invoice lists the advertiser through the period end plus grace, and republishes the directory', async () => {
    expect((await hook(invoicePaid('evt_paid_1'))).status).toBe(200);
    const m = await me();
    expect(m.billing.paidThrough).toBe(pacificDay(new Date((periodEnd + 3 * 86_400) * 1000)));
    expect(m.billing.plan).toBe('Card · Rotating · $199 / month');
    expect(m.billing.tier).toBe('standard');
    expect(m.payments.active).toBe(true);
    expect(m.listed).toBe(true);
    expect(JSON.parse(readFileSync(join(dir, 'data', 'pros.json'), 'utf8')).pros.map((p: { id: string }) => p.id)).toContain(proId);
  });

  it('processes each event once, even if Stripe delivers it again', async () => {
    const again = await hook(invoicePaid('evt_paid_1'));
    expect(await again.json()).toMatchObject({ duplicate: true });
    expect(app.db.auditFor(proId).filter((e) => e.action === 'PAYMENT_RECEIVED')).toHaveLength(1);
  });

  it('ignores events for customers that are not ours', async () => {
    expect((await hook(invoicePaid('evt_other', 'cus_someone_else'))).status).toBe(200);
  });

  it('sends active advertisers to the billing portal instead of a second checkout', async () => {
    expect((await pro('/api/pro/checkout', {})).status).toBe(409);
    const r = await pro('/api/pro/billing-portal', {});
    expect((await r.json()).url).toMatch(/^https:\/\/billing\.stripe\.com\//);
  });

  it('emails the advertiser when a payment fails, and keeps already-paid time after cancellation', async () => {
    await hook({ id: 'evt_fail', type: 'invoice.payment_failed', data: { object: { customer: 'cus_robin' } } });
    expect(mails.at(-1)!.subject).toMatch(/did not go through/);
    expect(mails.at(-1)!.text).not.toMatch(/card number/i);
    const before = (await me()).billing.paidThrough;
    await hook({ id: 'evt_del', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', customer: 'cus_robin', status: 'canceled' } } });
    const m = await me();
    expect(m.payments.status).toBe('canceled');
    expect(m.billing.paidThrough).toBe(before);
    expect(m.listed).toBe(true);
  });

  it('only ever redirects to Stripe-hosted pages', async () => {
    checkoutUrl = 'https://evil.example/pay';
    const r = await pro('/api/pro/checkout', {});
    expect(r.status).toBe(502);
    checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_test_123';
  });
});

describe('plan configuration (STRIPE_PLANS)', () => {
  const tiers = (std: string, prem: string, plus: string, extra = '') =>
    `{"standard":{"priceId":"${std}","amountLabel":"$99 / month"${extra}},"premium":{"priceId":"${prem}","amountLabel":"$199 / month"},"premium_plus":{"priceId":"${plus}","amountLabel":"$249 / month"}}`;
  const plans = parsePlans(`{"*":${tiers('price_STD001', 'price_PRM001', 'price_PLS001', ',"foundingCoupon":"FOUNDING_STD","foundingLabel":"$69 / month for 12 months"')},"agent":${tiers('price_AGT001', 'price_AGT002', 'price_AGT003')}}`);

  it('reads three plans per category, with "*" as the default for categories not listed', () => {
    expect(planFor(plans, 'cpa', 'premium')?.priceId).toBe('price_PRM001');
    expect(planFor(plans, 'cpa')?.foundingCoupon).toBe('FOUNDING_STD');
    expect(planFor(plans, 'cpa')?.foundingLabel).toBe('$69 / month for 12 months');
    expect(planFor(plans, 'agent', 'premium_plus')?.priceId).toBe('price_AGT003');
    expect(planFor(plans, 'agent')?.foundingCoupon).toBeUndefined(); // the category's own entry replaces "*" entirely
    expect(tierForPrice(plans, 'price_PLS001')).toBe('premium_plus');
    expect(tierForPrice(plans, 'price_AGT001')).toBe('standard');
    expect(tierForPrice(plans, 'price_UNKNOWN')).toBeNull();
  });
  it('still reads the older flat shape, as Standard only', () => {
    const old = parsePlans('{"agent":{"priceId":"price_ABC123","amountLabel":"$199 / month"}}');
    expect(planFor(old, 'agent')?.priceId).toBe('price_ABC123');
    expect(planFor(old, 'agent', 'premium')).toBeNull();
    expect(planFor(old, 'cpa')).toBeNull();
  });
  it('refuses unknown plans, bad coupons, a founding price without a coupon and one price for two plans', () => {
    expect(() => parsePlans('{"*":{"gold":{"priceId":"price_ABC123","amountLabel":"$1"}}}')).toThrow(/unknown plan/);
    expect(() => parsePlans('{"*":{"standard":{"priceId":"price_ABC123","amountLabel":"$1","foundingCoupon":"bad coupon!"}}}')).toThrow(/coupon/);
    expect(() => parsePlans(`{"*":{"standard":{"priceId":"price_ABC123","amountLabel":"$1","foundingCoupon":"${'x'.repeat(65)}"}}}`)).toThrow(/coupon/);
    expect(() => parsePlans('{"*":{"standard":{"priceId":"price_ABC123","amountLabel":"$1","foundingLabel":"$1 off"}}}')).toThrow(/needs a foundingCoupon/);
    expect(() => parsePlans('{"*":{"standard":{"priceId":"price_ABC123","amountLabel":"$1"},"premium":{"priceId":"price_ABC123","amountLabel":"$2"}}}')).toThrow(/two different plans/);
    expect(() => parsePlans('{"*":{"standard":{"priceId":"price_ABC123","amountLabel":"$1","price":5}}}')).toThrow(/unknown field/);
    expect(() => parsePlans('[]')).toThrow(/object/);
  });
  it('reads prices, metadata and discounts from invoices across Stripe API versions', () => {
    expect(invoicePriceIds({ lines: { data: [{ price: { id: 'price_A' } }, { pricing: { price_details: { price: 'price_B' } } }, { pricing: { price_details: { price: { id: 'price_C' } } } }] } })).toEqual(['price_A', 'price_B', 'price_C']);
    expect(invoicePriceIds({})).toEqual([]);
    expect(invoiceSubscriptionMetadata({ parent: { subscription_details: { metadata: { tier: 'premium_plus', topic: 'offer' } } } })).toEqual({ tier: 'premium_plus', topic: 'offer' });
    expect(invoiceSubscriptionMetadata({ subscription_details: { metadata: { topic: 'offer', n: 1 } } })).toEqual({ topic: 'offer' });
    expect(invoiceDiscount({ total_discount_amounts: [{ amount: 3000 }] })).toEqual({ applied: true, cents: 3000 });
    expect(invoiceDiscount({ discounts: ['di_1'] })).toEqual({ applied: true, cents: 0 });
    expect(invoiceDiscount({ discount: { id: 'di_1' } }).applied).toBe(true);
    expect(invoiceDiscount({ discounts: [], total_discount_amounts: [] })).toEqual({ applied: false, cents: 0 });
    expect(subscriptionPriceId({ items: { data: [{ price: { id: 'price_X' } }] } })).toBe('price_X');
    expect(subscriptionPriceId({})).toBeNull();
  });
});

describe('advertising plans: checkout, caps and webhooks (running server, simulated Stripe)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-plans-'));
  const calls: { path: string; params: URLSearchParams }[] = [];
  let customers = 0;
  const fakeFetch = (async (input: string | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname.replace('/v1/', '');
    calls.push({ path, params: new URLSearchParams(String(init?.body ?? '')) });
    const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    if (path === 'customers') return json({ id: `cus_${++customers}` });
    if (path === 'checkout/sessions') return json({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  const PLANS = '{"*":{"standard":{"priceId":"price_STD001","amountLabel":"$99 / month","foundingCoupon":"FOUND_STD","foundingLabel":"$69 / month for 12 months"},"premium":{"priceId":"price_PRM001","amountLabel":"$199 / month","foundingCoupon":"FOUND_PRM","foundingLabel":"$139 / month for 12 months"},"premium_plus":{"priceId":"price_PLS001","amountLabel":"$249 / month","foundingCoupon":"FOUND_PLS","foundingLabel":"$179 / month for 12 months"}}}';
  const app = createApp({
    dbPath: join(dir, 'app.db'),
    dataDir: join(dir, 'data'),
    distDir: null,
    adminUsername: 'admin',
    adminPasswordHash: hashPassword('a-long-admin-password'),
    directorySigningKey: loadPrivateKey(generateSigningKeys().privatePem),
    feedPublicKey: null,
    baseUrl: 'https://fsf.example',
    mailer: { send: async () => {} },
    secureCookies: false,
    stripe: { client: createStripeClient({ secretKey: 'sk_test_x', webhookSecret: SECRET, plans: parsePlans(PLANS), fetchImpl: fakeFetch }), webhookSecret: SECRET },
  });
  let server: Server;
  let base = '';
  let n = 0;
  const today = pacificDay(new Date());

  /** An approved advertiser; `billing` lists them now. Returns their id and a signed-in cookie. */
  function advertiser(category: 'agent' | 'home_inspector' | 'loan_officer', billing: Record<string, string> | null = null, adTopic = '') {
    const input: ApplicationInput = { ...AGENT, email: `pro${++n}@example.com`, licenseId: `S.00${String(10000 + n)}` };
    if (category === 'home_inspector') Object.assign(input, { category, licenseId: `IOS.00${10000 + n}`, services: ['Pre-purchase home inspection'] });
    if (category === 'loan_officer') Object.assign(input, { category, licenseId: String(100000 + n), services: ['FHA'], creditProfiles: ['Good (680–739)'] });
    const v = validateApplication(input);
    if (!v.ok) throw new Error(`fixture invalid: ${JSON.stringify(v.errors)}`);
    const id = n.toString(16).padStart(24, '0');
    const t = new Date().toISOString();
    app.db.insertApplication({ id, profile: v.profile, tokenHash: sha256(`x${n}`), tokenExpires: t, now: t });
    app.db.update(id, {
      status: 'APPROVED',
      verification: { licenseStatus: 'Active', licenseExpires: '2099-01-01', nameMatches: true, typeMatches: true, companyMatches: true, identityConfirmed: true, contentReviewed: true, identityMethod: 'Called the main line from the regulator record.', verifiedAt: today, verifiedBy: 'admin' },
      billing: billing ? { plan: 'Manual', paidThrough: '2099-01-01', ...billing } as never : null,
      profile: { ...v.profile, adTopic },
    }, t);
    const token = newToken();
    app.db.sessions.create(sha256(token), 'pro', id, Date.now());
    return { id, cookie: `fsf_pro=${token}` };
  }
  const post = (cookie: string, path: string, body: unknown) =>
    fetch(base + path, { method: 'POST', headers: { cookie, 'content-type': 'application/json', 'x-fsf-request': '1' }, body: JSON.stringify(body) });
  const meOf = async (cookie: string) => (await fetch(base + '/api/pro/me', { headers: { cookie } })).json();
  const hook = (event: unknown) => {
    const payload = JSON.stringify(event);
    return fetch(base + '/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': signWebhook(payload, SECRET) }, body: payload });
  };
  const lastSession = () => calls.filter((c) => c.path === 'checkout/sessions').at(-1)!.params;
  const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86_400;

  beforeAll(async () => {
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => server?.close());

  it('publishes price labels per category and plan, without Stripe IDs', async () => {
    const r = await (await fetch(base + '/api/ad-plans')).json();
    expect(r.available).toBe(true);
    expect(r.categories.cpa.premium_plus).toEqual({ available: true, amountLabel: '$249 / month', foundingLabel: '$179 / month for 12 months' });
    expect(JSON.stringify(r)).not.toMatch(/price_|FOUND_/);
  });

  it('checks out Premium Plus with the topic in the subscription metadata, and allows promotion codes', async () => {
    const a = advertiser('agent');
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'premium_plus' })).status).toBe(422); // a topic is required
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'premium_plus', topic: 'financing' })).status).toBe(422); // not an agents' topic
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'platinum' })).status).toBe(400);
    const r = await post(a.cookie, '/api/pro/checkout', { tier: 'premium_plus', topic: 'offer', priceId: 'price_EVIL01' });
    expect(r.status).toBe(200);
    const s = lastSession();
    expect(s.get('line_items[0][price]')).toBe('price_PLS001');
    expect(s.get('subscription_data[metadata][tier]')).toBe('premium_plus');
    expect(s.get('subscription_data[metadata][topic]')).toBe('offer');
    expect(s.get('allow_promotion_codes')).toBe('true');
    expect(s.get('discounts[0][coupon]')).toBeNull();
    expect(s.get('payment_method_collection')).toBe('if_required');
    // The plan comes from the price Stripe charged; the topic from the subscription's metadata.
    await hook({ id: 'evt_pp_1', type: 'invoice.paid', data: { object: { customer: 'cus_1', subscription: 'sub_pp', amount_paid: 24900, currency: 'usd', lines: { data: [{ period: { end: periodEnd }, pricing: { price_details: { price: 'price_PLS001' } } }] }, parent: { subscription_details: { metadata: { tier: 'premium_plus', topic: 'offer' } } } } } });
    const m = await meOf(a.cookie);
    expect(m.billing).toMatchObject({ tier: 'premium_plus', plan: 'Card · Mentor Connect · $249 / month' });
    expect(m.payments).toMatchObject({ tier: 'premium_plus', topic: 'offer', active: true });
    const feed = JSON.parse(readFileSync(join(dir, 'data', 'pros.json'), 'utf8'));
    expect(feed.pros.find((p: { id: string }) => p.id === a.id)).toMatchObject({ tier: 'premium_plus', adTopic: 'offer' });
  });

  it('applies the founding coupon (and no promotion-code box) only for advertisers an admin marked', async () => {
    const a = advertiser('home_inspector');
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'premium' })).status).toBe(200);
    expect(lastSession().get('discounts[0][coupon]')).toBeNull();
    app.db.setFounding(a.id, true, new Date().toISOString());
    expect((await meOf(a.cookie)).payments.foundingDiscount.premium).toBe(true);
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'premium' })).status).toBe(200);
    const s = lastSession();
    expect(s.get('discounts[0][coupon]')).toBe('FOUND_PRM');
    expect(s.get('allow_promotion_codes')).toBeNull();
    expect(s.get('line_items[0][price]')).toBe('price_PRM001');
  });

  it('refuses checkout with a clear 409 when the category, Featured spots or a topic are full', async () => {
    // Two Featured spots for inspectors: one already Premium Plus on "inspections" (exclusive: 1 per topic).
    const holder = advertiser('home_inspector', { tier: 'premium_plus' }, 'inspections');
    advertiser('home_inspector', { tier: 'premium' });
    const c = advertiser('home_inspector');
    const featured = await post(c.cookie, '/api/pro/checkout', { tier: 'premium' });
    expect(featured.status).toBe(409);
    expect((await featured.json()).error).toMatch(/Featured ad spots/);
    const me = await meOf(c.cookie);
    expect(me.payments.full).toMatchObject({ standard: false, premium: true, premium_plus: true });
    expect(me.payments.topicsFull).toContain('inspections');
    expect((await post(c.cookie, '/api/pro/checkout', { tier: 'standard' })).status).toBe(200);
    // Listing cap: 5 per category, all plans counted (the requester isn't counted against themselves).
    advertiser('home_inspector', { tier: 'standard' });
    advertiser('home_inspector', { tier: 'standard' });
    advertiser('home_inspector', { tier: 'standard' });
    const full = await post(c.cookie, '/api/pro/checkout', { tier: 'standard' });
    expect(full.status).toBe(409);
    expect((await full.json()).error).toMatch(/directory is full/);
    expect((await meOf(holder.cookie)).payments.full.standard).toBe(false);
  });

  it('caps a settlement-service topic at 3, so lenders rotate', async () => {
    const lenders = [0, 1, 2].map(() => advertiser('loan_officer', { tier: 'premium_plus' }, 'financing'));
    expect(lenders).toHaveLength(3);
    const d = advertiser('loan_officer');
    const r = await post(d.cookie, '/api/pro/checkout', { tier: 'premium_plus', topic: 'financing' });
    expect(r.status).toBe(409); // the 2 Featured spots are taken first
  });

  it('follows the price on plan switches, falls back to the plan chosen at checkout, and notes discounts', async () => {
    const a = advertiser('agent');
    expect((await post(a.cookie, '/api/pro/checkout', { tier: 'premium' })).status).toBe(200);
    const cus = `cus_${customers}`;
    // A price that isn't in STRIPE_PLANS: the plan remembered from checkout is used. A promotion code covered it in full.
    await hook({ id: 'evt_fb_1', type: 'invoice.paid', data: { object: { customer: cus, subscription: 'sub_fb', amount_paid: 0, currency: 'usd', total_discount_amounts: [{ amount: 19900 }], lines: { data: [{ period: { end: periodEnd }, price: { id: 'price_LEGACY' } }] } } } });
    let m = await meOf(a.cookie);
    expect(m.billing.tier).toBe('premium');
    expect(m.billing.paidThrough).toBe(pacificDay(new Date((periodEnd + 3 * 86_400) * 1000)));
    expect(m.listed).toBe(true);
    expect(app.db.auditFor(a.id).find((e) => e.action === 'PAYMENT_RECEIVED')!.detail).toMatch(/discount covered this period in full/);
    // Switched to Standard on Stripe's billing portal.
    await hook({ id: 'evt_sw_1', type: 'customer.subscription.updated', data: { object: { id: 'sub_fb', customer: cus, status: 'active', items: { data: [{ price: { id: 'price_STD001' } }] } } } });
    m = await meOf(a.cookie);
    expect(m.billing).toMatchObject({ tier: 'standard', plan: 'Card · Rotating · $99 / month' });
    expect(app.db.auditFor(a.id).some((e) => e.action === 'PLAN_CHANGED' && e.detail === 'Spotlight → Rotating')).toBe(true);
    // A partial discount is noted with its amount.
    await hook({ id: 'evt_fb_2', type: 'invoice.paid', data: { object: { customer: cus, subscription: 'sub_fb', amount_paid: 6900, currency: 'usd', total_discount_amounts: [{ amount: 3000 }], lines: { data: [{ period: { end: periodEnd }, price: { id: 'price_STD001' } }] } } } });
    expect(app.db.auditFor(a.id).filter((e) => e.action === 'PAYMENT_RECEIVED').at(-1)!.detail).toMatch(/discount applied \(30\.00 USD off\)/);
  });

  it('lets Premium Plus advertisers change their topic, within the caps', async () => {
    const a = advertiser('agent', { tier: 'premium_plus' });
    expect((await post(a.cookie, '/api/pro/ad-topic', { topic: 'financing' })).status).toBe(422);
    expect((await post(a.cookie, '/api/pro/ad-topic', { topic: 'offer' })).status).toBe(200);
    expect((await meOf(a.cookie)).payments.topic).toBe('offer');
    const b = advertiser('agent', { tier: 'standard' });
    expect((await post(b.cookie, '/api/pro/ad-topic', { topic: 'offer' })).status).toBe(409);
  });

  it('reviews ad lines sent from the dashboard before they are published', async () => {
    const a = advertiser('loan_officer', { tier: 'premium' });
    const bad = await post(a.cookie, '/api/pro/ad-line', { adLine: 'Rates from 5.9% APR for every buyer here!' });
    expect(bad.status).toBe(422);
    expect((await bad.json()).errors.adLine).toMatch(/Lenders/);
    const line = 'Ask us how renovation loans work for a home that needs repairs.';
    expect((await post(a.cookie, '/api/pro/ad-line', { adLine: line })).status).toBe(200);
    expect(app.db.get(a.id)!.profile).toMatchObject({ adLine: '', adLinePending: line });
    expect(app.db.auditFor(a.id).some((e) => e.action === 'AD_LINE_SUBMITTED')).toBe(true);
    // Removing it needs no review.
    expect((await post(a.cookie, '/api/pro/ad-line', { adLine: '' })).status).toBe(200);
    expect(app.db.get(a.id)!.profile).toMatchObject({ adLine: '', adLinePending: '' });
  });
});
