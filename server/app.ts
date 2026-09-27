// HTTP API: advertiser signup, admin approval/billing, lead forms, privacy-preserving metrics,
// advertiser dashboard, plus static hosting of the built site.
//
// Public
//   POST /api/applications                  submit an advertiser application (rate limited, honeypot)
//   POST /api/applications/confirm          confirm email ownership with the emailed token
//   POST /api/events                        count a view/impression/contact click for listed pros
//   POST /api/pros/:id/leads                send a contact request to a listed pro (with consent)
//   POST /api/pro/login                     email a one-time sign-in link to a listed advertiser
//   POST /api/pro/session                   exchange that link's token for a session
//   POST /api/alerts/signup                 sign up for email (double opt-in; already-active addresses get their manage link)
//   POST /api/alerts/track                  track a verified listing or save a search, by email (new addresses confirm first; active ones confirm the add)
//   POST /api/alerts/confirm                confirm the address with the emailed token
//   POST /api/alerts/manage | /update       view or change what an address gets (manage-link token; x-fsf-request: 1)
//   POST /api/alerts/unsubscribe?t=         stop all email and delete the address (also one-click from mail apps)
// Advertiser (fsf_pro cookie; writes need x-fsf-request: 1 and same origin)
//   GET  /api/pro/me | /api/pro/metrics | /api/pro/leads | /api/pro/leads.csv ; POST /api/pro/logout
// Admin (fsf_admin cookie; writes need x-fsf-request: 1 and same origin)
//   POST /api/admin/login | /logout ; GET /api/admin/me | /api/admin/applications[/:id[/metrics]]
//   POST /api/admin/applications/:id/(approve|billing|reject|suspend) ; POST /api/admin/publish | /api/admin/reports
//   GET  /api/admin/email | /api/admin/email/list.csv ; POST /api/admin/email/test | /api/admin/email/send   (general email list)

import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { approvalBlockers, normalizePhone, plain, validateApplication, validateBilling, type ApplicationInput, type LicenseVerification } from '../src/lib/proApplication';
import { CATEGORIES, isListable, REVERIFY_DAYS } from '../src/lib/pros';
import { newToken, parseCookies, RateLimiter, SESSION_IDLE_MS, SESSION_MAX_MS, safeEqualStrings, sessionCookie, sha256, verifyPasswordAsync } from './auth';
import { METRIC_KINDS, openDb, type ApplicationRow, type Db, type MetricKind } from './db';
import { buildProsFeed, toPro, writeSignedJson } from './directory';
import { isSiteAction, isSitePage } from '../src/lib/siteStats';
import { visitorIp } from './cloudflare';
import { alertsAddEmail, alertsConfirmEmail, broadcastEmail, alertsManageLinkEmail, alertsWelcomeEmail, searchDigestEmail, trackedChangesEmail, approvedEmail, confirmationEmail, consoleMailer, leadEmail, leadReceiptEmail, loginLinkEmail, maskEmail, paymentFailedEmail, type Mail, type Mailer } from './mailer';
import { ALERT_LIMITS, CONFIRM_TTL_MS, openAlerts, openBroadcasts, type Subscriber } from './alerts';
import { SITE_INFO } from '../src/lib/siteInfo';
import { parseSearchTarget, searchLabel } from '../src/lib/savedSearch';
import { collectChanges, collectDigests, feedReader, labelOf, openTracker, TARGET_RE, trackableListings, type ListingSnapshot } from './tracker';
import { CHECKOUT_URL_PREFIX, invoicePeriodEnd, invoiceSubscriptionId, PORTAL_URL_PREFIX, verifyWebhook, type StripeClient, type StripeEvent } from './stripe';
import { BOT_UA, leadsToCsv, monthlyReportText, monthRange, pacificDay, pacificDaysToUtc, siteSummary, summarize, VisitorHasher } from './metrics';

export interface AppConfig {
  dbPath: string;
  dataDir: string; // where signed feeds are written and served from (/data/*)
  distDir: string | null; // built site; null = API only
  adminUsername: string;
  adminPasswordHash: string;
  /** Signs the advertiser directory (pros.json). Never the listings key. */
  directorySigningKey: KeyObject | null;
  /** Public key (SPKI, base64) of the listings key, to read the signed listings feed. */
  feedPublicKey: string | null;
  baseUrl: string; // public site URL used in emails
  mailer?: Mailer;
  secureCookies?: boolean;
  trustProxy?: boolean;
  /** The domain is proxied through Cloudflare: take the visitor's address from CF-Connecting-IP on requests from Cloudflare. */
  trustCloudflare?: boolean;
  /** Online payments. Omit to take payments offline only (admin records billing by hand). */
  stripe?: { client: StripeClient; webhookSecret: string } | null;
  now?: () => Date;
  /** Whether the business name and postal address are set (CAN-SPAM). Defaults to checking src/lib/siteInfo.ts. */
  postalAddressReady?: boolean;
}

const JSON_LIMIT = 32 * 1024;
const WEBHOOK_LIMIT = 256 * 1024;
/** Days a card-paid listing stays up past the billing period end, so a renewal that's a few hours late doesn't drop it. */
const PAYMENT_GRACE_DAYS = 3;
const ACTIVE_SUB = new Set(['active', 'trialing', 'past_due', 'incomplete']);
const ID_RE = /^[a-f0-9]{24}$/;
const EMAIL_TOKEN_TTL_MS = 48 * 3_600_000;
const LOGIN_TOKEN_TTL_MS = 15 * 60_000;
const ADMIN_COOKIE = 'fsf_admin';
const EMAIL_RE = /^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const PRO_COOKIE = 'fsf_pro';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.sig': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function createApp(config: AppConfig) {
  const db: Db = openDb(config.dbPath);
  const alerts = openAlerts(db.raw);
  const tracker = openTracker(db.raw);
  const broadcasts = openBroadcasts(db.raw);
  const postalReady = config.postalAddressReady ?? ![SITE_INFO.operatorName, SITE_INFO.mailingAddress].some((v) => /^\[.*\]$/.test(v));
  const readFeed = feedReader(config.dataDir, config.feedPublicKey);
  const mailer = config.mailer ?? consoleMailer;
  // Sending never breaks a request: a failure is logged (without the message body, which can hold
  // sign-in links) and reported to the caller, which decides whether the visitor needs to know.
  async function deliver(mail: Mail): Promise<boolean> {
    try {
      await mailer.send(mail);
      return true;
    } catch (e) {
      console.error(`Email to ${maskEmail(mail.to)} ("${mail.subject}") was not sent: ${(e as Error).message}`);
      return false;
    }
  }
  const now = config.now ?? (() => new Date());
  const base = config.baseUrl.replace(/\/$/, '');
  const secure = config.secureCookies ?? true;
  const limiters = {
    apply: new RateLimiter(5, 3_600_000),
    applyEmail: new RateLimiter(3, 3_600_000),
    confirm: new RateLimiter(20, 3_600_000),
    loginIp: new RateLimiter(5, 15 * 60_000),
    loginUser: new RateLimiter(10, 15 * 60_000),
    proLinkIp: new RateLimiter(5, 15 * 60_000),
    proLinkEmail: new RateLimiter(3, 3_600_000),
    lead: new RateLimiter(5, 3_600_000),
    events: new RateLimiter(60, 60_000),
    checkout: new RateLimiter(10, 3_600_000),
    eventsIp: new RateLimiter(120, 60_000),
    alertsIp: new RateLimiter(10, 3_600_000),
    alertsEmail: new RateLimiter(3, 3_600_000),
    alertsManage: new RateLimiter(60, 10 * 60_000),
  };
  const hasher = new VisitorHasher();

  // Behind our own reverse proxy, the client address is the LAST X-Forwarded-For entry (the one the
  // proxy appended). Earlier entries come from the client and can be forged.
  // Behind Cloudflare, that address is a Cloudflare server; the visitor's is in CF-Connecting-IP.
  const clientIp = (req: IncomingMessage) => {
    const peer = (config.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',').pop()!.trim() : '') || req.socket.remoteAddress || 'unknown';
    return config.trustCloudflare ? visitorIp(peer, req.headers['cf-connecting-ip']) : peer;
  };
  // Networks the admin has signed in from recently: the per-username lockout doesn't apply to them,
  // so an attacker can't lock the real admin out by failing logins on purpose.
  const trustedAdminIps = new Map<string, number>();
  const TRUSTED_IP_MS = 30 * 86_400_000;

  function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
  }

  async function readRaw(req: IncomingMessage, limit: number): Promise<Buffer> {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const c of req) {
      size += (c as Buffer).length;
      if (size > limit) throw new HttpError(413, 'Request too large');
      chunks.push(c as Buffer);
    }
    return Buffer.concat(chunks);
  }

  async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) throw new HttpError(415, 'Expected application/json');
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const c of req) {
      size += (c as Buffer).length;
      if (size > JSON_LIMIT) throw new HttpError(413, 'Request too large');
      chunks.push(c as Buffer);
    }
    try {
      const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error();
      return v;
    } catch {
      throw new HttpError(400, 'Invalid JSON');
    }
  }

  /** Blocks cross-site requests: writes must come from our own pages. */
  function assertSameOrigin(req: IncomingMessage) {
    const origin = req.headers.origin;
    if (!origin) return;
    let host: string | null = null;
    try {
      host = new URL(origin).host;
    } catch {
      /* "null" (sandboxed frames) or garbage */
    }
    if (host !== req.headers.host) throw new HttpError(403, 'Cross-origin request refused');
  }
  /** Custom header can't be sent cross-site without a CORS preflight, which we never allow. */
  function assertAppRequest(req: IncomingMessage) {
    if (req.headers['x-fsf-request'] !== '1') throw new HttpError(403, 'Missing request header');
    assertSameOrigin(req);
  }

  function requireSession(req: IncomingMessage, kind: 'admin' | 'pro'): { subject: string; tokenHash: string } {
    const token = parseCookies(req.headers.cookie)[kind === 'admin' ? ADMIN_COOKIE : PRO_COOKIE];
    if (!token) throw new HttpError(401, 'Not signed in');
    const tokenHash = sha256(token);
    const s = db.sessions.get(tokenHash, kind);
    const t = now().getTime();
    if (!s || t - s.createdAt > SESSION_MAX_MS || t - s.lastSeen > SESSION_IDLE_MS) {
      if (s) db.sessions.delete(tokenHash);
      throw new HttpError(401, 'Session expired');
    }
    db.sessions.touch(tokenHash, t);
    if (req.method !== 'GET') assertAppRequest(req);
    return { subject: s.subject, tokenHash };
  }

  // Listed (approved, verified, paid) professionals, refreshed at most once a minute.
  let listedCache: { at: number; ids: Map<string, ApplicationRow> } = { at: 0, ids: new Map() };
  function listed(): Map<string, ApplicationRow> {
    const t = now().getTime();
    if (t - listedCache.at > 60_000) {
      const ids = new Map<string, ApplicationRow>();
      for (const row of db.listByStatus('APPROVED')) {
        const p = toPro(row);
        if (p && isListable(p, now())) ids.set(row.id, row);
      }
      listedCache = { at: t, ids };
    }
    return listedCache.ids;
  }

  function publish(): number {
    listedCache.at = 0;
    if (!config.directorySigningKey) return 0;
    const feed = buildProsFeed(db.listByStatus('APPROVED'), now());
    writeSignedJson(config.dataDir, 'pros.json', feed, config.directorySigningKey);
    return feed.pros.length;
  }

  /** Links that go in every alert email: manage, the unsubscribe page, and the one-click endpoint for mail apps. */
  function alertLinks(s: Subscriber) {
    const unsub = alerts.token(s, 'unsubscribe');
    return {
      manage: `${base}/#/alerts/manage/${alerts.token(s, 'manage')}`,
      unsubscribe: `${base}/#/alerts/unsubscribe/${unsub}`,
      oneClick: `${base}/api/alerts/unsubscribe?t=${encodeURIComponent(unsub)}`,
    };
  }
  /** A listing that can be tracked right now: on the current verified feed. */
  async function trackable(target: unknown): Promise<ListingSnapshot | null> {
    if (typeof target !== 'string' || !TARGET_RE.test(target)) return null;
    const feed = await readFeed(now());
    return (feed && trackableListings(feed).get(target)) ?? null;
  }

  /** A property on the current verified feed, or a valid saved search: what can be added to someone's alerts. */
  async function resolveTarget(target: unknown): Promise<{ kind: 'property' | 'search'; target: string; label: string } | null> {
    if (typeof target !== 'string') return null;
    const search = parseSearchTarget(target);
    if (search) return { kind: 'search', target, label: searchLabel(search) };
    const snap = await trackable(target);
    return snap ? { kind: 'property', target, label: labelOf(snap) } : null;
  }

  /** Emails each subscriber the changes to the properties they track. Returns how many emails went out. */
  let checking = false;
  async function checkTracked(): Promise<number> {
    if (checking) return 0;
    checking = true;
    try {
      const feed = await readFeed(now());
      if (!feed) return 0; // missing, invalid or expired: never guess
      let sent = 0;
      for (const [subscriberId, items] of collectChanges(tracker, feed, now())) {
        const s = alerts.get(subscriberId);
        if (s?.status !== 'ACTIVE') continue;
        if (await deliver(trackedChangesEmail(s.email, items, { ...alertLinks(s), live: `${base}/#/live` }))) sent++;
      }
      // Once a day: new listings matching each saved search.
      for (const [subscriberId, groups] of collectDigests(tracker, now())) {
        const s = alerts.get(subscriberId);
        if (s?.status !== 'ACTIVE') continue;
        if (await deliver(searchDigestEmail(s.email, groups, { ...alertLinks(s), live: `${base}/#/live` }))) sent++;
      }
      return sent;
    } finally {
      checking = false;
    }
  }

  /** Sends queued updates to the general list, one recipient at a time; resumes after a restart. */
  let pumping = false;
  async function sendBroadcasts(): Promise<number> {
    if (pumping) return 0;
    pumping = true;
    let n = 0;
    try {
      for (let batch = broadcasts.queued(50); batch.length; batch = broadcasts.queued(50)) {
        for (const { broadcast: b, subscriberId } of batch) {
          const s = alerts.get(subscriberId);
          // Unsubscribed or opted out since the send started: skip them.
          if (!s || s.status !== 'ACTIVE' || !s.listOptIn) {
            broadcasts.mark(b.id, subscriberId, 'SKIPPED', now().toISOString());
            continue;
          }
          const ok = await deliver(broadcastEmail(s.email, b.subject, b.body, alertLinks(s)));
          broadcasts.mark(b.id, subscriberId, ok ? 'SENT' : 'FAILED', now().toISOString());
          if (ok) n++;
        }
      }
    } finally {
      pumping = false;
    }
    return n;
  }

  /** The admin's subject and body: plain text, no control characters, sensible lengths. */
  function validateBroadcast(body: Record<string, unknown>): { subject: string; text: string } {
    const subject = String(body.subject ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
    const text = String(body.body ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();
    const errors: Record<string, string> = {};
    if (subject.length < 5 || subject.length > 120) errors.subject = 'Write a subject of 5 to 120 characters.';
    if (text.length < 20 || text.length > 20_000) errors.body = 'Write a message of 20 to 20,000 characters.';
    if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', { errors });
    return { subject, text };
  }

  /** What the manage page shows. Only the holder of the manage link sees it. */
  function alertsView(s: Subscriber) {
    return { email: s.email, listOptIn: s.listOptIn, confirmedAt: s.confirmedAt, subscriptions: alerts.subscriptions(s.id) };
  }

  const today = () => now().toISOString().slice(0, 10);
  const daysSince = (d: string | undefined) => (d ? Math.floor((now().getTime() - Date.parse(`${d}T00:00:00Z`)) / 86_400_000) : null);

  function adminView(a: ApplicationRow) {
    const age = daysSince(a.verification?.verifiedAt);
    const pro = toPro(a);
    return {
      ...a,
      duplicates: db.duplicates(a),
      daysSinceVerified: age,
      reverifyDueInDays: age === null ? null : REVERIFY_DAYS - age,
      listed: !!pro && isListable(pro, now()),
      payments: paymentsView(a),
    };
  }

  /** What an advertiser (or admin) sees about online payment for a listing. */
  function paymentsView(a: ApplicationRow) {
    const plan = config.stripe?.client.planFor(a.profile.category) ?? null;
    const acct = db.stripe.forPro(a.id);
    return {
      available: !!plan,
      amountLabel: plan?.amountLabel ?? null,
      status: acct?.status ?? null,
      active: ACTIVE_SUB.has(acct?.status ?? ''),
      cancelAtPeriodEnd: !!acct?.cancelAtPeriodEnd,
      hasCard: !!acct,
    };
  }

  /** Applies a verified Stripe event. Only a paid invoice extends a listing. */
  async function handleStripeEvent(event: StripeEvent) {
    const o = event.data.object;
    const customer = typeof o.customer === 'string' ? o.customer : null;
    const acct = customer ? db.stripe.byCustomer(customer) : undefined;
    if (!acct) return; // not one of ours (or created outside this site): ignore
    const at = now().toISOString();
    const row = db.get(acct.proId);
    if (!row) return;
    const log = (action: string, detail: string | null) => db.audit({ at, actor: 'stripe', applicationId: row.id, action, detail });

    switch (event.type) {
      case 'checkout.session.completed':
        if (typeof o.subscription === 'string') db.stripe.setSubscription(row.id, { subscriptionId: o.subscription }, at);
        log('CHECKOUT_COMPLETED', null);
        return;
      case 'invoice.paid': {
        const end = invoicePeriodEnd(o);
        if (!end) return;
        const paidThrough = pacificDay(new Date((end + PAYMENT_GRACE_DAYS * 86_400) * 1000));
        const current = row.billing?.paidThrough ?? '';
        const plan = config.stripe?.client.planFor(row.profile.category);
        const billing = { plan: `Card · ${plan?.amountLabel ?? 'monthly'}`, paidThrough: paidThrough > current ? paidThrough : current };
        db.update(row.id, { billing }, at);
        db.stripe.setSubscription(row.id, { subscriptionId: invoiceSubscriptionId(o) ?? undefined, status: 'active' }, at);
        const amount = typeof o.amount_paid === 'number' ? `${(o.amount_paid / 100).toFixed(2)} ${String(o.currency ?? '').toUpperCase()}` : '';
        log('PAYMENT_RECEIVED', `${amount} · listed through ${billing.paidThrough}`.trim());
        publish();
        return;
      }
      case 'invoice.payment_failed':
        db.stripe.setSubscription(row.id, { status: 'past_due' }, at);
        log('PAYMENT_FAILED', null);
        await deliver(paymentFailedEmail(row.profile.email, row.profile.name, `${base}/#/advertiser`));
        return;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        db.stripe.setSubscription(row.id, { subscriptionId: typeof o.id === 'string' ? o.id : undefined, status: typeof o.status === 'string' ? o.status : null, cancelAtPeriodEnd: o.cancel_at_period_end === true }, at);
        if (event.type === 'customer.subscription.updated' && o.cancel_at_period_end === true) log('CANCEL_SCHEDULED', 'Plan ends at the end of the paid period');
        return;
      case 'customer.subscription.deleted':
        // Already-paid time stays listed; it simply isn't extended.
        db.stripe.setSubscription(row.id, { status: 'canceled', cancelAtPeriodEnd: false }, at);
        log('SUBSCRIPTION_ENDED', null);
        return;
    }
  }

  function loadApp(id: string): ApplicationRow {
    if (!ID_RE.test(id)) throw new HttpError(404, 'Not found');
    const a = db.get(id);
    if (!a) throw new HttpError(404, 'Not found');
    return a;
  }

  function dateRange(url: URL, maxDays = 366): { from: string; to: string } {
    const to = url.searchParams.get('to') ?? pacificDay(now());
    const from = url.searchParams.get('from') ?? new Date(Date.parse(`${to}T12:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10);
    const ok = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
    if (!ok(from) || !ok(to) || from > to || Date.parse(to) - Date.parse(from) > maxDays * 86_400_000) throw new HttpError(400, 'Invalid date range');
    return { from, to };
  }

  function sendMonthlyReports(month: string): number {
    const { from, to } = monthRange(month);
    let sent = 0;
    for (const row of db.listByStatus('APPROVED')) {
      if (db.reports.wasSent(row.id, month)) continue;
      const s = summarize(db, row.id, from, to);
      const { start, end } = pacificDaysToUtc(from, to);
      const leads = db.leads.forPro(row.id, start, end).length;
      void deliver({ to: row.profile.email, subject: `Your Forced-Sale Finder report for ${month}`, text: monthlyReportText(row.profile.name, month, s, leads, `${base}/#/advertiser`) });
      db.reports.markSent(row.id, month, now().toISOString());
      sent++;
    }
    return sent;
  }

  async function handleApi(req: IncomingMessage, res: ServerResponse, path: string, url: URL) {
    const method = req.method ?? 'GET';

    // ---------------- payments (called by Stripe's servers, authenticated by signature) ----------------
    if (method === 'POST' && path === '/api/stripe/webhook') {
      if (!config.stripe) throw new HttpError(404, 'Not found');
      const raw = await readRaw(req, WEBHOOK_LIMIT);
      let event: StripeEvent;
      try {
        event = verifyWebhook(raw, req.headers['stripe-signature'] as string | undefined, config.stripe.webhookSecret, Math.floor(now().getTime() / 1000));
      } catch {
        throw new HttpError(400, 'Invalid signature');
      }
      if (!db.stripe.claimEvent(event.id, event.type, now().toISOString())) return send(res, 200, { received: true, duplicate: true });
      try {
        await handleStripeEvent(event);
      } catch (e) {
        db.stripe.releaseEvent(event.id); // let Stripe retry
        throw e;
      }
      return send(res, 200, { received: true });
    }

    // ---------------- public ----------------
    if (method === 'POST' && path === '/api/applications') {
      assertSameOrigin(req);
      if (!limiters.apply.hit(clientIp(req))) throw new HttpError(429, 'Too many applications from this network. Try again later.');
      const input = (await readJson(req)) as Partial<ApplicationInput>;
      const accepted = { ok: true, message: 'Application received. Check your email to confirm your address.' };
      if (input.company_url) return send(res, 202, accepted); // honeypot: pretend success, store nothing
      const v = validateApplication(input);
      if (!v.ok) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: v.errors });
      // Per-recipient cap: nobody can use this form to flood one inbox with confirmation emails.
      if (!limiters.applyEmail.hit(v.profile.email)) return send(res, 202, accepted);
      const id = randomBytes(12).toString('hex');
      const token = newToken();
      const t = now();
      db.insertApplication({ id, profile: v.profile, tokenHash: sha256(token), tokenExpires: new Date(t.getTime() + EMAIL_TOKEN_TTL_MS).toISOString(), now: t.toISOString() });
      db.audit({ at: t.toISOString(), actor: 'applicant', applicationId: id, action: 'SUBMITTED', detail: CATEGORIES[v.profile.category].label });
      if (!(await deliver(confirmationEmail(v.profile.email, `${base}/#/advertise/confirm/${token}`, CATEGORIES[v.profile.category].regulator)))) {
        throw new HttpError(503, 'We couldn\'t send your confirmation email just now. Please try again in a few minutes.');
      }
      return send(res, 202, accepted);
    }

    if (method === 'POST' && path === '/api/applications/confirm') {
      assertSameOrigin(req);
      if (!limiters.confirm.hit(clientIp(req))) throw new HttpError(429, 'Too many attempts. Try again later.');
      const { token } = await readJson(req);
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw new HttpError(400, 'This confirmation link is invalid or has expired.');
      const id = db.confirmEmail(sha256(token), now().toISOString());
      if (!id) throw new HttpError(400, 'This confirmation link is invalid or has expired.');
      db.audit({ at: now().toISOString(), actor: 'applicant', applicationId: id, action: 'EMAIL_CONFIRMED', detail: null });
      return send(res, 200, { ok: true, message: 'Email confirmed. We will verify your license and confirm your identity before your profile goes live.' });
    }

    if (method === 'POST' && path === '/api/events') {
      assertSameOrigin(req);
      const ua = String(req.headers['user-agent'] ?? '');
      const body = await readJson(req);
      if (BOT_UA.test(ua) || !ua) return send(res, 204, {});
      const day = pacificDay(now());
      const ip = clientIp(req);
      // Uniques are counted per network, not per browser string, so rotating the User-Agent from
      // one address can't inflate an advertiser's numbers; a per-address cap bounds the totals too.
      const visitor = hasher.hash(ip, '', day);
      if (!limiters.eventsIp.hit(ip) || !limiters.events.hit(visitor)) return send(res, 204, {});
      // Site-wide counts: a page view (one visit per visitor per day) or a research action.
      if (body.kind === 'pageview') {
        if (!isSitePage(body.page)) throw new HttpError(400, 'Unknown page');
        db.site.record(day, 'visit', '', visitor);
        db.site.record(day, 'page', body.page, visitor);
        return send(res, 204, {});
      }
      if (body.kind === 'action') {
        if (!isSiteAction(body.action)) throw new HttpError(400, 'Unknown action');
        db.site.record(day, 'action', body.action, visitor);
        return send(res, 204, {});
      }
      const kind = body.kind as MetricKind;
      if (!METRIC_KINDS.includes(kind) || kind === 'lead') throw new HttpError(400, 'Unknown event');
      const ids = (kind === 'impression' ? (Array.isArray(body.proIds) ? body.proIds : []) : [body.proId]).slice(0, 50);
      const live = listed();
      for (const id of new Set(ids)) if (typeof id === 'string' && live.has(id)) db.metrics.record(id, day, kind, visitor);
      return send(res, 204, {});
    }

    // ---------------- email alerts (no accounts: a confirmed address plus signed links) ----------------
    if (method === 'POST' && path === '/api/alerts/signup') {
      assertSameOrigin(req);
      if (!limiters.alertsIp.hit(clientIp(req))) throw new HttpError(429, 'Too many sign-ups from this network. Try again later.');
      const body = await readJson(req);
      const accepted = { ok: true, message: 'Check your inbox for a link to confirm. It expires in 48 hours.' };
      if (body.company_url) return send(res, 202, accepted); // honeypot
      const email = plain(body.email, 254).toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { email: 'Enter a valid email address.' } });
      if (body.list !== true) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { list: 'Choose what you’d like to get.' } });
      // Same answer whether or not the address is known, and a per-address cap so nobody can flood an inbox.
      if (!limiters.alertsEmail.hit(email)) return send(res, 202, accepted);
      const current = alerts.byEmail(email);
      if (current?.status === 'ACTIVE') {
        const l = alertLinks(current);
        await deliver(alertsManageLinkEmail(email, l.manage, l.unsubscribe, l.oneClick));
        return send(res, 202, accepted);
      }
      const token = newToken();
      const t = now();
      alerts.upsertPending(email, true, sha256(token), new Date(t.getTime() + CONFIRM_TTL_MS).toISOString(), t.toISOString());
      if (!(await deliver(alertsConfirmEmail(email, `${base}/#/alerts/confirm/${token}`)))) {
        throw new HttpError(503, 'We couldn\'t send your confirmation email just now. Please try again in a few minutes.');
      }
      return send(res, 202, accepted);
    }

    if (method === 'POST' && path === '/api/alerts/track') {
      assertSameOrigin(req);
      if (!limiters.alertsIp.hit(clientIp(req))) throw new HttpError(429, 'Too many sign-ups from this network. Try again later.');
      const body = await readJson(req);
      const accepted = { ok: true, message: 'Check your inbox for a link to confirm. It expires in 48 hours.' };
      if (body.company_url) return send(res, 202, accepted);
      const email = plain(body.email, 254).toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { email: 'Enter a valid email address.' } });
      const r = await resolveTarget(body.target);
      if (!r) throw new HttpError(404, 'This property isn’t on the current verified list, so it can’t be tracked.');
      if (!limiters.alertsEmail.hit(email)) return send(res, 202, accepted);
      const current = alerts.byEmail(email);
      if (current?.status === 'ACTIVE') {
        // Already signed up: they confirm the add from their own manage page, so nobody can add alerts to someone else's inbox.
        const l = alertLinks(current);
        await deliver(alertsAddEmail(email, r.label, `${l.manage}?add=${encodeURIComponent(r.target)}`, l.manage, l.unsubscribe, l.oneClick, r.kind));
        return send(res, 202, accepted);
      }
      const token = newToken();
      const t = now();
      const s = alerts.upsertPending(email, body.list === true, sha256(token), new Date(t.getTime() + CONFIRM_TTL_MS).toISOString(), t.toISOString());
      alerts.addSubscription(s.id, r.kind, r.target, r.label, t.toISOString());
      if (!(await deliver(alertsConfirmEmail(email, `${base}/#/alerts/confirm/${token}`, r.label, r.kind)))) {
        throw new HttpError(503, 'We couldn\'t send your confirmation email just now. Please try again in a few minutes.');
      }
      return send(res, 202, accepted);
    }

    if (method === 'POST' && path === '/api/alerts/confirm') {
      assertSameOrigin(req);
      if (!limiters.confirm.hit(clientIp(req))) throw new HttpError(429, 'Too many attempts. Try again later.');
      const { token } = await readJson(req);
      const invalid = new HttpError(400, 'This confirmation link is invalid or has expired. Sign up again to get a new one.');
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw invalid;
      const s = alerts.confirm(sha256(token), now().toISOString());
      if (!s) throw invalid;
      const l = alertLinks(s);
      await deliver(alertsWelcomeEmail(s.email, l.manage, l.unsubscribe, l.oneClick));
      return send(res, 200, { ok: true, manageToken: alerts.token(s, 'manage') });
    }

    if (method === 'POST' && (path === '/api/alerts/manage' || path === '/api/alerts/update')) {
      assertAppRequest(req);
      if (!limiters.alertsManage.hit(clientIp(req))) throw new HttpError(429, 'Too many requests. Try again later.');
      const body = await readJson(req);
      const s = alerts.verify(body.token, 'manage');
      if (!s || s.status !== 'ACTIVE') throw new HttpError(404, 'This link doesn’t work anymore. You may have unsubscribed; sign up again to get a new one.');
      if (path === '/api/alerts/update') {
        if (body.deleteAll === true) {
          alerts.delete(s.id);
          return send(res, 200, { ok: true, deleted: true });
        }
        if (typeof body.list === 'boolean') alerts.setListOptIn(s.id, body.list, now().toISOString());
        if (typeof body.remove === 'string') alerts.removeSubscription(s.id, body.remove);
        if (body.add !== undefined) {
          const r = await resolveTarget(body.add);
          if (!r) throw new HttpError(404, 'This property isn’t on the current verified list, so it can’t be tracked.');
          if (alerts.addSubscription(s.id, r.kind, r.target, r.label, now().toISOString()) === 'limit') {
            throw new HttpError(409, r.kind === 'search' ? `You already have ${ALERT_LIMITS.search} saved searches, the most we allow. Remove one first.` : `You’re already tracking ${ALERT_LIMITS.property} properties, the most we allow. Remove one first.`);
          }
        }
      }
      // The manage page can ask about an alert before adding it (from an emailed "add this" link).
      let preview: { kind: 'property' | 'search'; target: string; label: string; tracked: boolean } | null = null;
      if (typeof body.preview === 'string') {
        const r = await resolveTarget(body.preview);
        if (r) preview = { ...r, tracked: alerts.subscriptions(s.id).some((x) => x.kind === r.kind && x.target === r.target) };
      }
      return send(res, 200, { ok: true, ...alertsView(alerts.get(s.id)!), preview });
    }

    // Mail apps POST here directly for one-click unsubscribe (RFC 8058), so no same-origin check:
    // the signed token is the authorization, and all it can do is delete that one address.
    if (method === 'POST' && path === '/api/alerts/unsubscribe') {
      if (!limiters.alertsManage.hit(clientIp(req))) throw new HttpError(429, 'Too many requests. Try again later.');
      const s = alerts.verify(url.searchParams.get('t'), 'unsubscribe');
      if (s) alerts.delete(s.id);
      // Same answer for an unknown link: an address that was already removed is still unsubscribed.
      return send(res, 200, { ok: true, message: 'We deleted your email address and everything you signed up for. You won’t get any more email from us.' });
    }

    const leadMatch = path.match(/^\/api\/pros\/([a-f0-9]{24})\/leads$/);
    if (method === 'POST' && leadMatch) {
      assertSameOrigin(req);
      if (!limiters.lead.hit(clientIp(req))) throw new HttpError(429, 'Too many messages from this network. Try again later.');
      const body = await readJson(req);
      const row = listed().get(leadMatch[1]);
      if (!row) throw new HttpError(404, 'This professional is not currently listed.');
      if (body.company_url) return send(res, 202, { ok: true });
      const errors: Record<string, string> = {};
      const name = plain(body.name, 80);
      const email = plain(body.email, 254).toLowerCase();
      const phoneRaw = plain(body.phone, 30);
      const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
      const message = plain(body.message, 1000);
      const interest = plain(body.interest, 60) || null;
      if (name.length < 2) errors.name = 'Enter your name.';
      if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(email)) errors.email = 'Enter a valid email address.';
      if (phoneRaw && !phone) errors.phone = 'Enter a valid U.S. phone number, or leave it blank.';
      if (message.length < 10) errors.message = 'Write a short message (at least 10 characters).';
      if (body.consent !== true) errors.consent = 'Please agree to share your details with this professional.';
      if (body.acknowledge !== true) errors.acknowledge = 'Please acknowledge the notice.';
      if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', { errors });
      const lead = { id: randomBytes(12).toString('hex'), proId: row.id, createdAt: now().toISOString(), name, email, phone, message, interest };
      db.leads.insert(lead);
      db.metrics.record(row.id, pacificDay(now()), 'lead', hasher.hash(clientIp(req), '', pacificDay(now())));
      // The lead is saved and shown on the advertiser's dashboard even if the email doesn't go out.
      await deliver(leadEmail(row.profile.email, row.profile.name, lead, `${base}/#/advertiser`));
      await deliver(leadReceiptEmail(email, row.profile.name));
      return send(res, 202, { ok: true, message: `Your message was sent to ${row.profile.name}. They will contact you directly.` });
    }

    if (method === 'POST' && path === '/api/pro/login') {
      assertSameOrigin(req);
      const body = await readJson(req);
      const email = plain(body.email, 254).toLowerCase();
      const generic = { ok: true, message: 'If that email belongs to a listed advertiser, a sign-in link is on its way. It expires in 15 minutes.' };
      if (!limiters.proLinkIp.hit(clientIp(req)) || !limiters.proLinkEmail.hit(email)) return send(res, 200, generic); // no enumeration, no spam
      const row = db.approvedByEmail(email);
      if (row) {
        const token = newToken();
        db.loginTokens.create(sha256(token), row.id, now().getTime() + LOGIN_TOKEN_TTL_MS);
        await deliver(loginLinkEmail(email, row.profile.name, `${base}/#/advertiser/login/${token}`));
      }
      return send(res, 200, generic);
    }

    if (method === 'POST' && path === '/api/pro/session') {
      assertAppRequest(req);
      const { token } = await readJson(req);
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw new HttpError(400, 'This sign-in link is invalid or has expired.');
      const proId = db.loginTokens.consume(sha256(token), now().getTime());
      if (!proId || db.get(proId)?.status !== 'APPROVED') throw new HttpError(400, 'This sign-in link is invalid or has expired.');
      const session = newToken();
      db.sessions.create(sha256(session), 'pro', proId, now().getTime());
      db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: proId, action: 'ADVERTISER_LOGIN', detail: null });
      return send(res, 200, { ok: true }, { 'set-cookie': sessionCookie(PRO_COOKIE, session, '/api/pro', secure) });
    }

    // ---------------- advertiser ----------------
    if (path.startsWith('/api/pro/')) {
      const s = requireSession(req, 'pro');
      const row = db.get(s.subject);
      if (!row || row.status !== 'APPROVED') {
        db.sessions.delete(s.tokenHash);
        throw new HttpError(401, 'Not signed in');
      }
      if (method === 'POST' && path === '/api/pro/logout') {
        db.sessions.delete(s.tokenHash);
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'ADVERTISER_LOGOUT', detail: null });
        return send(res, 200, { ok: true }, { 'set-cookie': sessionCookie(PRO_COOKIE, '', '/api/pro', secure, 0) });
      }
      if (method === 'GET' && path === '/api/pro/me') {
        const pro = toPro(row);
        return send(res, 200, {
          id: row.id,
          status: row.status,
          profile: row.profile,
          billing: row.billing,
          verifiedAt: row.verification?.verifiedAt ?? null,
          reverifyDueInDays: row.verification ? REVERIFY_DAYS - (daysSince(row.verification.verifiedAt) ?? 0) : null,
          listed: !!pro && isListable(pro, now()),
          payments: paymentsView(row),
        });
      }
      if (method === 'POST' && path === '/api/pro/checkout') {
        const stripe = config.stripe;
        const plan = stripe?.client.planFor(row.profile.category);
        if (!stripe || !plan) throw new HttpError(409, 'Online payment is not available for your category yet. We will contact you about your plan.');
        if (!row.verification) throw new HttpError(409, 'Your license must be verified before you can start advertising.');
        if (!limiters.checkout.hit(row.id)) throw new HttpError(429, 'Too many attempts. Try again later.');
        let acct = db.stripe.forPro(row.id);
        if (acct && ACTIVE_SUB.has(acct.status ?? '')) throw new HttpError(409, 'You already have an active plan. Use "Manage billing" to change your card or cancel.');
        if (!acct) {
          const customer = await stripe.client.createCustomer({ proId: row.id, email: row.profile.email, name: row.profile.company || row.profile.name });
          db.stripe.link(row.id, customer.id, now().toISOString());
          acct = db.stripe.forPro(row.id)!;
        }
        const session = await stripe.client.createCheckoutSession({
          proId: row.id,
          customerId: acct.customerId,
          priceId: plan.priceId,
          successUrl: `${base}/#/advertiser?payment=done`,
          cancelUrl: `${base}/#/advertiser?payment=cancelled`,
          attempt: newToken().slice(0, 16),
        });
        if (typeof session.url !== 'string' || !session.url.startsWith(CHECKOUT_URL_PREFIX)) throw new HttpError(502, 'The payment page could not be opened. Try again.');
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'CHECKOUT_STARTED', detail: plan.amountLabel });
        return send(res, 200, { url: session.url });
      }
      if (method === 'POST' && path === '/api/pro/billing-portal') {
        const acct = config.stripe && db.stripe.forPro(row.id);
        if (!config.stripe || !acct) throw new HttpError(409, 'There is no card on file to manage.');
        const portal = await config.stripe.client.createPortalSession({ customerId: acct.customerId, returnUrl: `${base}/#/advertiser` });
        if (typeof portal.url !== 'string' || !portal.url.startsWith(PORTAL_URL_PREFIX)) throw new HttpError(502, 'The billing page could not be opened. Try again.');
        return send(res, 200, { url: portal.url });
      }
      if (method === 'GET' && path === '/api/pro/metrics') {
        const { from, to } = dateRange(url);
        return send(res, 200, summarize(db, row.id, from, to));
      }
      if (method === 'GET' && (path === '/api/pro/leads' || path === '/api/pro/leads.csv')) {
        const { from, to } = dateRange(url);
        const { start, end } = pacificDaysToUtc(from, to);
        const leads = db.leads.forPro(row.id, start, end);
        if (path.endsWith('.csv')) {
          db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'LEADS_EXPORTED', detail: `${from} to ${to}, ${leads.length} leads` });
          res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="leads-${from}-to-${to}.csv"`, 'cache-control': 'no-store' });
          return res.end(leadsToCsv(leads));
        }
        return send(res, 200, { leads });
      }
      throw new HttpError(404, 'Not found');
    }

    // ---------------- admin ----------------
    if (method === 'POST' && path === '/api/admin/login') {
      assertAppRequest(req);
      const ip = clientIp(req);
      const body = await readJson(req);
      const username = plain(body.username, 64);
      const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
      const trusted = (trustedAdminIps.get(ip) ?? 0) > now().getTime();
      if (limiters.loginIp.blocked(ip) || (!trusted && limiters.loginUser.blocked(username))) throw new HttpError(429, 'Too many failed sign-in attempts. Wait 15 minutes.');
      // Always run the (slow) password check so response time doesn't reveal whether the username exists.
      const userOk = safeEqualStrings(username, config.adminUsername);
      const passOk = await verifyPasswordAsync(password, config.adminPasswordHash);
      if (!(userOk && passOk)) {
        limiters.loginIp.hit(ip);
        limiters.loginUser.hit(username);
        // Don't store whatever was typed as an unknown username (it's sometimes a mistyped password).
        db.audit({ at: now().toISOString(), actor: userOk ? config.adminUsername : '(unknown user)', applicationId: null, action: 'LOGIN_FAILED', detail: ip });
        throw new HttpError(401, 'Incorrect username or password.');
      }
      limiters.loginIp.reset(ip);
      trustedAdminIps.set(ip, now().getTime() + TRUSTED_IP_MS);
      const token = newToken();
      db.sessions.purge(now().getTime() - SESSION_MAX_MS);
      db.sessions.create(sha256(token), 'admin', config.adminUsername, now().getTime());
      db.audit({ at: now().toISOString(), actor: config.adminUsername, applicationId: null, action: 'LOGIN', detail: ip });
      return send(res, 200, { ok: true, username: config.adminUsername }, { 'set-cookie': sessionCookie(ADMIN_COOKIE, token, '/api/admin', secure) });
    }

    if (!path.startsWith('/api/admin/')) throw new HttpError(404, 'Not found');
    const admin = requireSession(req, 'admin');
    const audit = (applicationId: string | null, action: string, detail: string | null = null) =>
      db.audit({ at: now().toISOString(), actor: admin.subject, applicationId, action, detail });

    if (method === 'POST' && path === '/api/admin/logout') {
      audit(null, 'LOGOUT');
      db.sessions.delete(admin.tokenHash);
      return send(res, 200, { ok: true }, { 'set-cookie': sessionCookie(ADMIN_COOKIE, '', '/api/admin', secure, 0) });
    }
    if (method === 'GET' && path === '/api/admin/me') return send(res, 200, { username: admin.subject, signingConfigured: !!config.directorySigningKey });
    if (method === 'GET' && path === '/api/admin/applications') return send(res, 200, { applications: db.list().map(adminView) });
    if (method === 'GET' && path === '/api/admin/site-stats') return send(res, 200, siteSummary(db, ...(Object.values(dateRange(url, 400)) as [string, string])));
    if (method === 'POST' && path === '/api/admin/publish') {
      const n = publish();
      audit(null, 'PUBLISHED', `${n} listings`);
      return send(res, 200, { ok: true, published: n });
    }
    // ---------------- general email list ----------------
    if (method === 'GET' && path === '/api/admin/email') {
      const c = alerts.counts();
      const subs = db.raw.prepare(`SELECT kind, COUNT(*) AS n FROM subscriptions s JOIN subscribers u ON u.id = s.subscriber_id WHERE u.status = 'ACTIVE' GROUP BY kind`).all() as { kind: string; n: number }[];
      const count = (k: string) => subs.find((x) => x.kind === k)?.n ?? 0;
      return send(res, 200, { counts: { ...c, trackedProperties: count('property'), savedSearches: count('search') }, postalAddressReady: postalReady, broadcasts: broadcasts.recent() });
    }
    if (method === 'GET' && path === '/api/admin/email/list.csv') {
      const rows = broadcasts.listMembers();
      audit(null, 'EMAIL_LIST_EXPORTED', `${rows.length} addresses`);
      const cell = (v: string | null) => `"${(v ?? '').replace(/"/g, '""').replace(/^([=+\-@\t\r])/, "'$1")}"`;
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="email-list-${pacificDay(now())}.csv"`, 'cache-control': 'no-store' });
      return res.end([['Email', 'Confirmed'].map(cell).join(','), ...rows.map((r) => [r.email, r.confirmedAt].map(cell).join(','))].join('\r\n'));
    }
    if (method === 'POST' && path === '/api/admin/email/test') {
      const body = await readJson(req);
      const { subject, text } = validateBroadcast(body);
      const to = plain(body.to, 254).toLowerCase();
      if (!EMAIL_RE.test(to)) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { to: 'Enter the address to send the test to.' } });
      const sample = { manage: `${base}/#/alerts`, unsubscribe: `${base}/#/alerts`, oneClick: `${base}/#/alerts` };
      if (!(await deliver({ ...broadcastEmail(to, `[Test] ${subject}`, text, sample), headers: undefined }))) throw new HttpError(503, 'The test email could not be sent. Check the server log.');
      audit(null, 'EMAIL_TEST_SENT', `${subject} → ${maskEmail(to)}`);
      return send(res, 200, { ok: true, message: `Test sent to ${to}.` });
    }
    if (method === 'POST' && path === '/api/admin/email/send') {
      const body = await readJson(req);
      const { subject, text } = validateBroadcast(body);
      if (!postalReady) throw new HttpError(409, 'Set your business name and postal address in src/lib/siteInfo.ts first. The law requires them in every update (CAN-SPAM).');
      if (broadcasts.sending()) throw new HttpError(409, 'Another update is still sending. Wait until it finishes.');
      // A double click, or a repeat by mistake, must not email everyone twice.
      const repeat = broadcasts.recent(5).find((b) => b.subject === subject && b.body === text && now().getTime() - Date.parse(b.createdAt) < 86_400_000);
      if (repeat) throw new HttpError(409, 'You already sent this update in the last 24 hours.');
      const recipients = alerts.counts().listOptIn;
      if (recipients === 0) throw new HttpError(409, 'Nobody has signed up for general updates yet.');
      // The admin confirms the number they saw; if it changed, they look again before anything goes out.
      if (body.expectedRecipients !== recipients) throw new HttpError(409, `The list now has ${recipients} ${recipients === 1 ? 'address' : 'addresses'}. Review and confirm again.`, { recipients });
      const b = broadcasts.create(subject, text, admin.subject, now().toISOString());
      broadcasts.closeIfEmpty(b.id, now().toISOString());
      audit(null, 'EMAIL_UPDATE_SENT', `"${subject}" to ${b.recipients}`);
      void sendBroadcasts();
      return send(res, 202, { ok: true, broadcast: b });
    }

    if (method === 'POST' && path === '/api/admin/reports') {
      const { month } = await readJson(req);
      if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
      const n = sendMonthlyReports(month);
      audit(null, 'REPORTS_SENT', `${month}: ${n}`);
      return send(res, 200, { ok: true, sent: n });
    }

    const m = path.match(/^\/api\/admin\/applications\/([^/]+)(?:\/(approve|billing|reject|suspend|metrics))?$/);
    if (!m) throw new HttpError(404, 'Not found');
    const app = loadApp(m[1]);
    const action = m[2];

    if (method === 'GET' && !action) return send(res, 200, { application: adminView(app), audit: db.auditFor(app.id) });
    if (method === 'GET' && action === 'metrics') return send(res, 200, summarize(db, app.id, ...(Object.values(dateRange(url)) as [string, string])));
    if (method !== 'POST' || !action || action === 'metrics') throw new HttpError(405, 'Method not allowed');
    const body = await readJson(req);

    if (action === 'approve') {
      if (!['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(app.status)) {
        throw new HttpError(409, app.status === 'EMAIL_UNCONFIRMED' ? 'The applicant has not confirmed their email yet.' : `Can't approve an application that is ${app.status}.`);
      }
      const raw = (body.verification ?? {}) as Partial<LicenseVerification>;
      const info = CATEGORIES[app.profile.category];
      const verification: LicenseVerification = {
        licenseStatus: raw.licenseStatus as LicenseVerification['licenseStatus'],
        licenseExpires: info.licenseExpires ? plain(raw.licenseExpires, 10) : null,
        nameMatches: raw.nameMatches === true,
        typeMatches: raw.typeMatches === true,
        companyMatches: raw.companyMatches === true,
        identityConfirmed: raw.identityConfirmed === true,
        identityMethod: plain(raw.identityMethod, 300),
      };
      const blockers = approvalBlockers(app.profile.category, verification, today());
      if (blockers.length) throw new HttpError(422, 'Verification incomplete.', { blockers });
      const clash = db.duplicates(app).find((d) => d.field === 'license' && d.status === 'APPROVED');
      if (clash) throw new HttpError(409, `This ${info.licenseLabel} is already listed under another approved profile (${clash.id}). Resolve that first.`);
      const wasApproved = app.status === 'APPROVED';
      db.update(app.id, { status: 'APPROVED', verification: { ...verification, verifiedAt: today(), verifiedBy: admin.subject }, decisionReason: null }, now().toISOString());
      audit(app.id, wasApproved ? 'REVERIFIED' : 'APPROVED', `${info.regulator}: ${verification.licenseStatus}${verification.licenseExpires ? `, expires ${verification.licenseExpires}` : ''}. Identity: ${verification.identityMethod}`);
      publish();
      if (!wasApproved) await deliver(approvedEmail(app.profile.email, app.profile.name, `${base}/#/advertiser`, !!config.stripe?.client.planFor(app.profile.category)));
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }

    if (action === 'billing') {
      if (!['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(app.status)) throw new HttpError(409, `Can't bill an application that is ${app.status}.`);
      const billing = validateBilling((body.billing ?? {}) as Record<string, string>);
      if (!billing) throw new HttpError(422, 'Enter a plan name and a paid-through date.');
      db.update(app.id, { billing }, now().toISOString());
      audit(app.id, 'BILLING', `${billing.plan}, paid through ${billing.paidThrough}`);
      publish();
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }

    const reason = plain(body.reason, 300);
    if (reason.length < 5) throw new HttpError(422, 'Give a reason (at least 5 characters).');
    if (action === 'reject') {
      if (!['EMAIL_UNCONFIRMED', 'PENDING_REVIEW'].includes(app.status)) throw new HttpError(409, `Can't reject an application that is ${app.status}.`);
      db.update(app.id, { status: 'REJECTED', decisionReason: reason }, now().toISOString());
      audit(app.id, 'REJECTED', reason);
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }
    if (app.status !== 'APPROVED') throw new HttpError(409, 'Only approved listings can be suspended.');
    db.update(app.id, { status: 'SUSPENDED', decisionReason: reason }, now().toISOString());
    db.sessions.deleteForSubject('pro', app.id);
    db.loginTokens.deleteForPro(app.id);
    audit(app.id, 'SUSPENDED', reason);
    publish();
    return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, path: string) {
    const fromData = path.startsWith('/data/');
    const root = fromData ? config.dataDir : config.distDir;
    if (!root || (req.method !== 'GET' && req.method !== 'HEAD')) return send(res, 404, { error: 'Not found' });
    const rel = fromData ? path.slice('/data/'.length) : path === '/' ? 'index.html' : path.slice(1);
    const baseDir = resolve(root);
    const file = resolve(baseDir, normalize(rel));
    if (file !== baseDir && !file.startsWith(baseDir + sep)) return send(res, 404, { error: 'Not found' });
    if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': fromData || file.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  }

  async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('content-security-policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    res.setHeader('permissions-policy', 'geolocation=(), camera=(), microphone=()');
    if (secure) res.setHeader('strict-transport-security', 'max-age=63072000; includeSubDomains');

    let url: URL;
    let path: string;
    try {
      url = new URL(req.url ?? '/', 'http://x');
      path = decodeURIComponent(url.pathname);
    } catch {
      return send(res, 400, { error: 'Bad request' });
    }
    try {
      // Health check for Podman, Kubernetes and OpenShift probes: the process is up and the database answers.
      if (path === '/healthz') {
        res.setHeader('cache-control', 'no-store');
        return db.ping() ? send(res, 200, { ok: true }) : send(res, 503, { ok: false });
      }
      if (path.startsWith('/api/')) return await handleApi(req, res, path, url);
      return serveStatic(req, res, path);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.body });
      console.error(e);
      return send(res, 500, { error: 'Something went wrong.' });
    }
  }

  /** Housekeeping: republish, purge old visitor hashes/sessions/leads, send last month's reports on the 1st. */
  function maintain() {
    const t = now();
    publish();
    db.metrics.purgeSeen(pacificDay(new Date(t.getTime() - 2 * 86_400_000)));
    db.site.purgeSeen(pacificDay(new Date(t.getTime() - 2 * 86_400_000)));
    db.sessions.purge(t.getTime() - SESSION_MAX_MS);
    db.leads.purgeOlderThan(new Date(t.getTime() - 400 * 86_400_000).toISOString()); // ~13 months retention
    alerts.purgeUnconfirmed(t.toISOString());
    void sendBroadcasts(); // resume a send interrupted by a restart
    const day = pacificDay(t);
    if (day.endsWith('-01')) {
      const prev = new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 7);
      sendMonthlyReports(prev);
    }
  }

  return { handler, publish, maintain, sendMonthlyReports, checkTracked, sendBroadcasts, db, alerts };
}
