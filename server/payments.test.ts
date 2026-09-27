import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword, newToken, sha256 } from './auth';
import type { Mail } from './mailer';
import { pacificDay } from './metrics';
import { createStripeClient, parsePlans, signWebhook, verifyWebhook } from './stripe';
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
    expect(parsePlans('{"agent":{"priceId":"price_ABC123","amountLabel":"$199 / month"}}').agent?.priceId).toBe('price_ABC123');
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
    expect(m.billing.plan).toBe('Card · $199 / month');
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
