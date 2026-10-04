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
//   POST /api/pro/photo (raw image body) | /api/pro/photo/remove ; GET /api/pro/photo/(pending|live)
//   POST /api/pro/checkout {tier, topic?} | /api/pro/billing-portal | /api/pro/ad-line {adLine} | /api/pro/ad-topic {topic}
// Public: GET /api/ad-plans                  price labels per category and plan (no Stripe IDs)
// Public: GET /api/pro-photos/<sha256>.webp   approved profile photos only, by the hash in the signed directory
// Admin (fsf_admin cookie; writes need x-fsf-request: 1 and same origin)
//   POST /api/admin/login | /logout ; GET /api/admin/me | /api/admin/applications[/:id[/metrics]]
//   POST /api/admin/applications/:id/(approve|billing|reject|suspend|founding|ad-line/approve|ad-line/reject) ; POST /api/admin/publish | /api/admin/reports
//   GET  /api/admin/applications/:id/photo (pending photo) ; POST /api/admin/applications/:id/photo/(approve|reject)
//   GET  /api/admin/email | /api/admin/email/list.csv ; POST /api/admin/email/test | /api/admin/email/send   (general email list)

import { randomBytes } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';
import { pipeline } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { approvalBlockers, billingTier, normalizePhone, plain, validateAdLine, validateApplication, validateBilling, type ApplicationInput, type Billing, type LicenseVerification } from '../src/lib/proApplication';
import { AD_TIERS, capMessage, capProblem, CAPS, isAdTier, TIER_INFO, topicAllowed, topicsFor, type AdTier } from '../src/lib/adPlans';
import type { Category } from '../src/lib/pros';
import { CATEGORIES, isListable, REVERIFY_DAYS } from '../src/lib/pros';
import { clientKey, newToken, parseCookies, RateLimiter, SESSION_IDLE_MS, SESSION_MAX_MS, safeEqualStrings, sessionCookie, sha256, verifyPasswordAsync } from './auth';
import { METRIC_KINDS, openDb, type ApplicationRow, type Db, type MetricKind } from './db';
import { buildProsFeed, placements, toPro, writeSignedJson } from './directory';
import { PHOTO_MAX_BYTES, PhotoError, processPhoto } from './photos';
import { isSiteAction, isSitePage } from '../src/lib/siteStats';
import { visitorIp } from './cloudflare';
import { alertsAddEmail, alertsConfirmEmail, broadcastEmail, alertsManageLinkEmail, alertsWelcomeEmail, searchDigestEmail, trackedChangesEmail, approvedEmail, confirmationEmail, consoleMailer, leadEmail, leadReceiptEmail, loginLinkEmail, MailError, maskEmail, paymentFailedEmail, type Mail, type Mailer } from './mailer';
import { ALERT_LIMITS, CONFIRM_TTL_MS, openAlerts, openBroadcasts, type Subscriber } from './alerts';
import { SITE_INFO, TERMS_EFFECTIVE } from '../src/lib/siteInfo';
import { parseSearchTarget, searchLabel } from '../src/lib/savedSearch';
import { collectChanges, collectDigests, feedReader, labelOf, openTracker, TARGET_RE, trackableListings, type ListingSnapshot } from './tracker';
import { cleanQuery, createLicenseSearch } from './licenses';
import { CHECKOUT_URL_PREFIX, invoiceDiscount, invoicePeriodEnd, invoicePriceIds, invoiceSubscriptionId, invoiceSubscriptionMetadata, PORTAL_URL_PREFIX, subscriptionPriceId, verifyWebhook, type StripeClient, type StripeEvent } from './stripe';
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
  /** Most updates to the general list sent per day (0 = no limit). Keeps a free email plan's daily allowance
   *  free for sign-in links and alerts; the rest of an update goes out the next day. */
  broadcastDailyMax?: number;
  secureCookies?: boolean;
  trustProxy?: boolean;
  /** The domain is proxied through Cloudflare: take the visitor's address from CF-Connecting-IP on requests from Cloudflare. */
  trustCloudflare?: boolean;
  /** Online payments. Omit to take payments offline only (admin records billing by hand). */
  stripe?: { client: StripeClient; webhookSecret: string } | null;
  now?: () => Date;
  /** Postal address for updates to the general email list (CAN-SPAM). Server-only: never sent to the browser. */
  postalAddress?: string;
  /** Tests only: override whether general-list sending is allowed. */
  postalAddressReady?: boolean;
  /** Tests only: stands in for the official sources the license lookup asks. */
  licenseFetch?: typeof fetch;
}

const JSON_LIMIT = 32 * 1024;
const WEBHOOK_LIMIT = 256 * 1024;
/** Site-wide hourly budget for email triggered by public forms (see deliverFromForm). */
const FORM_MAIL_PER_HOUR = 200;
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
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
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
  const postalAddress = (config.postalAddress ?? '').trim();
  const postalReady = config.postalAddressReady ?? (postalAddress !== '' && !/^\[.*\]$/.test(SITE_INFO.operatorName));
  const readFeed = feedReader(config.dataDir, config.feedPublicKey);
  const mailer = config.mailer ?? consoleMailer;
  // Sending never breaks a request: a failure is logged (without the message body, which can hold
  // sign-in links) and reported to the caller, which decides whether the visitor needs to know.
  async function deliver(mail: Mail): Promise<boolean> {
    return (await deliverOutcome(mail)) === 'sent';
  }
  /** Like deliver, but says when the email service's sending allowance is used up. */
  async function deliverOutcome(mail: Mail): Promise<'sent' | 'failed' | 'quota'> {
    try {
      await mailer.send(mail);
      return 'sent';
    } catch (e) {
      console.error(`Email to ${maskEmail(mail.to)} ("${mail.subject}") was not sent: ${(e as Error).message}`);
      return e instanceof MailError && e.quota ? 'quota' : 'failed';
    }
  }
  // Email a stranger can trigger by filling in a public form (confirmations, sign-in links, leads and
  // receipts) shares one site-wide hourly budget. Per-address and per-network limits come first; this is
  // the backstop against a flood from many networks at once, which would otherwise burn through the
  // email service's allowance or get the account suspended for complaints. Alerts, updates and reports are
  // sent by the server itself and aren't counted.
  const formMailBudget = new RateLimiter(FORM_MAIL_PER_HOUR, 3_600_000);
  let formMailWarnedAt = 0;
  async function deliverFromForm(mail: Mail): Promise<boolean> {
    if (!formMailBudget.hit('all')) {
      if (Date.now() - formMailWarnedAt > 3_600_000) {
        formMailWarnedAt = Date.now();
        console.warn(`WARNING: more than ${FORM_MAIL_PER_HOUR} form emails in the last hour; holding further ones. Check for a spam flood (see README, Cloudflare).`);
      }
      return false;
    }
    return deliver(mail);
  }
  const now = config.now ?? (() => new Date());
  const licenseSearch = createLicenseSearch(config.licenseFetch ?? fetch, now);
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
    // The lead form emails the typed address a receipt and the advertiser the lead: cap both, so the form
    // can't be used to flood someone's inbox (or an advertiser's) even from many networks.
    leadEmail: new RateLimiter(3, 3_600_000),
    leadPro: new RateLimiter(30, 86_400_000),
    proSession: new RateLimiter(20, 15 * 60_000),
    events: new RateLimiter(60, 60_000),
    checkout: new RateLimiter(10, 3_600_000),
    // Each upload is decoded and re-encoded (CPU): keep it to a handful per advertiser per hour.
    proPhoto: new RateLimiter(10, 3_600_000),
    eventsIp: new RateLimiter(120, 60_000),
    alertsIp: new RateLimiter(10, 3_600_000),
    // Live license lookups go to the State Bar or FDIC: a few a minute per visitor, and a site-wide cap so the site
    // never sends them more than a trickle.
    licenseIp: new RateLimiter(20, 10 * 60_000),
    licenseAll: new RateLimiter(300, 60 * 60_000),
    alertsEmail: new RateLimiter(3, 3_600_000),
    alertsManage: new RateLimiter(60, 10 * 60_000),
  };
  const hasher = new VisitorHasher();

  // Behind our own reverse proxy, the client address is the LAST X-Forwarded-For entry (the one the
  // proxy appended). Earlier entries come from the client and can be forged.
  // Behind Cloudflare, that address is a Cloudflare server; the visitor's is in CF-Connecting-IP.
  // IPv6 visitors are counted by their /64 network (clientKey), so rotating addresses doesn't escape limits.
  const clientIp = (req: IncomingMessage) => {
    const peer = (config.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',').pop()!.trim() : '') || req.socket.remoteAddress || 'unknown';
    return clientKey(config.trustCloudflare ? visitorIp(peer, req.headers['cf-connecting-ip']) : peer);
  };
  // Password checks (scrypt) share Node's small worker pool with file reads and DNS; allow only two at
  // once so a burst of sign-in attempts can't slow the rest of the site.
  let passwordChecks = 0;
  const MAX_PASSWORD_CHECKS = 2;
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
    const feed = buildProsFeed(db.listByStatus('APPROVED'), now(), db.photos.liveMap());
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
        if (await deliver({ ...trackedChangesEmail(s.email, items, { ...alertLinks(s), live: `${base}/#/live` }), bulk: true })) sent++;
      }
      // Once a day: new listings matching each saved search.
      for (const [subscriberId, groups] of collectDigests(tracker, now())) {
        const s = alerts.get(subscriberId);
        if (s?.status !== 'ACTIVE') continue;
        if (await deliver({ ...searchDigestEmail(s.email, groups, { ...alertLinks(s), live: `${base}/#/live` }), bulk: true })) sent++;
      }
      return sent;
    } finally {
      checking = false;
    }
  }

  /** Sends queued updates to the general list, one recipient at a time; resumes after a restart. At most
   *  `broadcastDailyMax` a day (leaving the rest of a free plan's allowance for sign-in links and alerts), and
   *  it pauses when the email service's allowance runs out: the rest stay queued and go out on later runs. */
  let pumping = false;
  const dailyMax = config.broadcastDailyMax ?? 0;
  let broadcastDay = '';
  let broadcastSentToday = 0;
  let pausedUntil = 0;
  async function sendBroadcasts(): Promise<number> {
    if (pumping || Date.now() < pausedUntil) return 0;
    pumping = true;
    let n = 0;
    try {
      outer: for (let batch = broadcasts.queued(50); batch.length; batch = broadcasts.queued(50)) {
        for (const { broadcast: b, subscriberId } of batch) {
          const day = pacificDay(now());
          if (day !== broadcastDay) {
            broadcastDay = day;
            broadcastSentToday = broadcasts.sentOn(day);
          }
          if (dailyMax && broadcastSentToday >= dailyMax) {
            console.log(`Email update: ${dailyMax} sent today (the daily limit); the rest go out tomorrow.`);
            break outer;
          }
          const s = alerts.get(subscriberId);
          // Unsubscribed or opted out since the send started: skip them.
          if (!s || s.status !== 'ACTIVE' || !s.listOptIn) {
            broadcasts.mark(b.id, subscriberId, 'SKIPPED', now().toISOString());
            continue;
          }
          const result = await deliverOutcome(broadcastEmail(s.email, b.subject, b.body, alertLinks(s), postalAddress));
          if (result === 'quota') {
            // Leave this recipient queued and try again in an hour (the hourly housekeeping resumes it).
            pausedUntil = Date.now() + 55 * 60_000;
            console.warn('Email update paused: the email service says the sending allowance is used up. It resumes automatically.');
            break outer;
          }
          broadcasts.mark(b.id, subscriberId, result === 'sent' ? 'SENT' : 'FAILED', now().toISOString());
          if (result === 'sent') {
            n++;
            broadcastSentToday = broadcasts.bumpSent(day);
          }
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
      photo: db.photos.meta(a.id),
    };
  }

  /** Sends a stored (already re-encoded) photo. */
  function sendImage(res: ServerResponse, image: Buffer, cache: string) {
    res.writeHead(200, {
      'content-type': 'image/webp',
      'content-length': String(image.length),
      'cache-control': cache,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'",
      'cross-origin-resource-policy': 'same-origin',
    });
    res.end(image);
  }

  const planFor = (c: Category, tier: AdTier) => config.stripe?.client.planFor(c, tier) ?? null;
  /** Card payments are possible for this category (at least one plan is configured). */
  const payable = (c: Category) => AD_TIERS.some((t) => !!planFor(c, t));
  /** The label stored with a card payment, e.g. "Card · Premium · $199 / month". */
  const cardPlanLabel = (c: Category, tier: AdTier, founding = false) => {
    const plan = planFor(c, tier);
    return `Card · ${TIER_INFO[tier].label} · ${(founding && plan?.foundingLabel) || plan?.amountLabel || 'monthly'}`;
  };

  /** Price labels for each plan in a category. Never includes Stripe price or coupon IDs. */
  function planLabels(c: Category) {
    return Object.fromEntries(
      AD_TIERS.map((t) => {
        const plan = planFor(c, t);
        return [t, { available: !!plan, amountLabel: plan?.amountLabel ?? null, foundingLabel: plan?.foundingLabel ?? null }];
      }),
    ) as Record<AdTier, { available: boolean; amountLabel: string | null; foundingLabel: string | null }>;
  }

  /** The cap problem (if any) for this advertiser taking `tier` (and `topic`), counting everyone listed now except them. */
  function capFor(row: ApplicationRow, tier: AdTier, topic: string | null) {
    return capProblem(placements(db.listByStatus('APPROVED'), now()), { id: row.id, category: row.profile.category, tier, topic });
  }

  /** What an advertiser (or admin) sees about their plan and online payment. */
  function paymentsView(a: ApplicationRow) {
    const tier = billingTier(a.billing);
    const acct = db.stripe.forPro(a.id);
    const cat = a.profile.category;
    const current = placements(db.listByStatus('APPROVED'), now());
    const full = (t: AdTier, topic: string | null = null) => !!capProblem(current, { id: a.id, category: cat, tier: t, topic });
    return {
      available: payable(cat),
      amountLabel: planFor(cat, tier)?.amountLabel ?? null,
      tier,
      topic: tier === 'premium_plus' && topicAllowed(cat, a.profile.adTopic) ? a.profile.adTopic : null,
      founding: a.founding,
      complimentary: !!a.billing?.complimentary,
      status: acct?.status ?? null,
      active: ACTIVE_SUB.has(acct?.status ?? ''),
      cancelAtPeriodEnd: !!acct?.cancelAtPeriodEnd,
      hasCard: !!acct,
      /** Plans (and Premium Plus topics) that are full for this advertiser right now. */
      full: Object.fromEntries(AD_TIERS.map((t) => [t, full(t)])) as Record<AdTier, boolean>,
      topicsFull: topicsFor(cat).filter((t) => full('premium_plus', t.key)).map((t) => t.key),
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
    const cat = row.profile.category;
    const tierOf = (priceId: string | null) => (priceId && config.stripe?.client.tierForPrice(priceId)) || null;

    switch (event.type) {
      case 'checkout.session.completed':
        if (typeof o.subscription === 'string') db.stripe.setSubscription(row.id, { subscriptionId: o.subscription }, at);
        log('CHECKOUT_COMPLETED', null);
        return;
      case 'invoice.paid': {
        const end = invoicePeriodEnd(o);
        if (!end) return;
        const paidThrough = pacificDay(new Date((end + PAYMENT_GRACE_DAYS * 86_400) * 1000));
        // The later of the two dates: a card payment never shortens time already paid or given free.
        const current = row.billing?.paidThrough ?? '';
        // The plan comes from the price Stripe charged; the plan chosen at checkout only if the price isn't one of ours.
        const tier: AdTier = invoicePriceIds(o).map(tierOf).find((t): t is AdTier => !!t) ?? acct.pendingTier ?? billingTier(row.billing);
        const meta = invoiceSubscriptionMetadata(o);
        const topic = [meta.topic, acct.pendingTopic].find((t) => topicAllowed(cat, t)) ?? null;
        const discount = invoiceDiscount(o);
        const billing: Billing = { plan: cardPlanLabel(cat, tier, discount.applied && row.founding), paidThrough: paidThrough > current ? paidThrough : current, tier, complimentary: false };
        const profile = tier === 'premium_plus' && topic ? { ...row.profile, adTopic: topic } : tier !== 'premium_plus' ? { ...row.profile, adTopic: '' } : row.profile;
        db.update(row.id, { billing, profile }, at);
        db.stripe.setSubscription(row.id, { subscriptionId: invoiceSubscriptionId(o) ?? undefined, status: 'active' }, at);
        db.stripe.setPending(row.id, null, null, at);
        const money = (cents: number) => `${(cents / 100).toFixed(2)} ${String(o.currency ?? '').toUpperCase()}`.trim();
        const amount = typeof o.amount_paid === 'number' ? money(o.amount_paid) : '';
        const off = discount.applied ? ` · discount applied${discount.cents > 0 ? ` (${money(discount.cents)} off)` : ''}` : '';
        log('PAYMENT_RECEIVED', `${amount} · ${TIER_INFO[tier].label}${profile.adTopic && tier === 'premium_plus' ? ` (${profile.adTopic})` : ''}${off} · listed through ${billing.paidThrough}`.replace(/^ · /, ''));
        publish();
        return;
      }
      case 'invoice.payment_failed':
        db.stripe.setSubscription(row.id, { status: 'past_due' }, at);
        log('PAYMENT_FAILED', null);
        await deliver(paymentFailedEmail(row.profile.email, row.profile.name, `${base}/#/advertiser`));
        return;
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        db.stripe.setSubscription(row.id, { subscriptionId: typeof o.id === 'string' ? o.id : undefined, status: typeof o.status === 'string' ? o.status : null, cancelAtPeriodEnd: o.cancel_at_period_end === true }, at);
        if (event.type === 'customer.subscription.updated' && o.cancel_at_period_end === true) log('CANCEL_SCHEDULED', 'Plan ends at the end of the paid period');
        // A plan switch made on Stripe's billing portal: follow the price. Leaving Premium Plus frees its topic spot;
        // coming back to it, the advertiser picks a topic again on their dashboard (checked against the caps).
        const tier = tierOf(subscriptionPriceId(o));
        if (!tier) return;
        if (!row.billing) {
          db.stripe.setPending(row.id, tier, acct.pendingTopic, at);
          return;
        }
        const was = billingTier(row.billing);
        if (tier === was) return;
        const profile = tier === 'premium_plus' ? row.profile : { ...row.profile, adTopic: '' };
        db.update(row.id, { billing: { ...row.billing, tier, plan: cardPlanLabel(cat, tier), complimentary: false }, profile }, at);
        log('PLAN_CHANGED', `${TIER_INFO[was].label} → ${TIER_INFO[tier].label}`);
        publish();
        return;
      }
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

  /** Reports handed to the email service but not yet accepted, so a second run can't send them twice. */
  const reportsInFlight = new Set<string>();
  function sendMonthlyReports(month: string): number {
    const { from, to } = monthRange(month);
    let sent = 0;
    for (const row of db.listByStatus('APPROVED')) {
      const key = `${month}|${row.id}`;
      if (reportsInFlight.has(key) || db.reports.wasSent(row.id, month)) continue;
      reportsInFlight.add(key);
      const s = summarize(db, row.id, from, to);
      const { start, end } = pacificDaysToUtc(from, to);
      const leads = db.leads.forPro(row.id, start, end).length;
      // Marked sent only once the email service accepts it; a failure is retried at the next hourly run.
      void deliver({ to: row.profile.email, subject: `Your DeedOwl report for ${month}`, text: monthlyReportText(row.profile.name, month, s, leads, `${base}/#/advertiser`), bulk: true })
        .then((ok) => {
          if (ok) db.reports.markSent(row.id, month, now().toISOString());
        })
        .finally(() => reportsInFlight.delete(key));
      sent++;
    }
    return sent;
  }

  async function handleApi(req: IncomingMessage, res: ServerResponse, path: string, url: URL) {
    const method = req.method ?? 'GET';

    // Live license lookups from official sources that allow them (server/licenses.ts).
    if (method === 'GET' && path === '/api/licenses') {
      const kind = url.searchParams.get('kind');
      const q = cleanQuery(url.searchParams.get('q'));
      if ((kind !== 'attorney' && kind !== 'bank') || !q) throw new HttpError(400, 'Enter a name or number (2 to 60 letters or digits).');
      if (!limiters.licenseIp.hit(clientIp(req)) || !limiters.licenseAll.hit('all')) throw new HttpError(429, 'Too many searches right now. Try again in a few minutes, or use the official lookup.');
      try {
        return send(res, 200, await licenseSearch(kind, q), { 'cache-control': 'private, max-age=600' });
      } catch {
        throw new HttpError(502, kind === 'attorney' ? 'The State Bar’s directory didn’t answer. Try again, or search it directly.' : 'The FDIC didn’t answer. Try again, or search BankFind directly.');
      }
    }

    // What this server has set up, so pages say "coming soon" instead of offering sign-ups that can't work yet.
    if (method === 'GET' && path === '/api/features') return send(res, 200, { email: mailer !== consoleMailer, payments: !!config.stripe });

    // Price labels for the Advertise page and the plan chooser: per category, with "*" already resolved. No Stripe IDs.
    if (method === 'GET' && path === '/api/ad-plans') {
      const categories = Object.fromEntries((Object.keys(CATEGORIES) as Category[]).map((c) => [c, planLabels(c)]));
      return send(res, 200, { available: !!config.stripe, caps: CAPS, categories }, { 'cache-control': 'no-cache' });
    }

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
      db.audit({ at: t.toISOString(), actor: 'applicant', applicationId: id, action: 'SUBMITTED', detail: `${CATEGORIES[v.profile.category].label}. Confirmed: licensed, accurate, verification consent, original content, Terms of ${TERMS_EFFECTIVE}` });
      if (!(await deliverFromForm(confirmationEmail(v.profile.email, `${base}/#/advertise/confirm/${token}`, CATEGORIES[v.profile.category].regulator)))) {
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
      const ids = (kind === 'impression' || kind === 'ad_impression' ? (Array.isArray(body.proIds) ? body.proIds : []) : [body.proId]).slice(0, 50);
      const live = listed();
      for (const id of new Set(ids)) if (typeof id === 'string' && live.has(id)) db.metrics.record(id, day, kind, visitor);
      return send(res, 204, {});
    }

    // ---------------- email alerts (no accounts: a confirmed address plus signed links) ----------------
    if (method === 'POST' && path === '/api/alerts/signup') {
      assertSameOrigin(req);
      if (!limiters.alertsIp.hit(clientIp(req))) throw new HttpError(429, 'Too many sign-ups from this network. Try again later.');
      const body = await readJson(req);
      const accepted = { ok: true, message: 'Check your inbox. New sign-ups get a link to confirm (it expires in 48 hours); if you’re already signed up, we’ve sent your link to manage your alerts instead.' };
      if (body.company_url) return send(res, 202, accepted); // honeypot
      const email = plain(body.email, 254).toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { email: 'Enter a valid email address.' } });
      // Same answer whether or not the address is known, and a per-address cap so nobody can flood an inbox.
      // Without the updates box ticked, this is "send me my manage link": only a signed-up address gets one.
      const manageOnly = { ok: true, message: 'If this address is signed up, we’ve sent it a link to manage your alerts. To sign up, tick General updates.' };
      if (!limiters.alertsEmail.hit(email)) return send(res, 202, body.list === true ? accepted : manageOnly);
      const current = alerts.byEmail(email);
      if (body.list !== true) {
        if (current?.status === 'ACTIVE') {
          const l = alertLinks(current);
          await deliverFromForm(alertsManageLinkEmail(email, l.manage, l.unsubscribe, l.oneClick));
        }
        return send(res, 202, manageOnly);
      }
      if (current?.status === 'ACTIVE') {
        const l = alertLinks(current);
        await deliverFromForm(alertsManageLinkEmail(email, l.manage, l.unsubscribe, l.oneClick));
        return send(res, 202, accepted);
      }
      const token = newToken();
      const t = now();
      alerts.upsertPending(email, true, sha256(token), new Date(t.getTime() + CONFIRM_TTL_MS).toISOString(), t.toISOString());
      if (!(await deliverFromForm(alertsConfirmEmail(email, `${base}/#/alerts/confirm/${token}`)))) {
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
        await deliverFromForm(alertsAddEmail(email, r.label, `${l.manage}?add=${encodeURIComponent(r.target)}`, l.manage, l.unsubscribe, l.oneClick, r.kind));
        return send(res, 202, accepted);
      }
      const token = newToken();
      const t = now();
      const s = alerts.upsertPending(email, body.list === true, sha256(token), new Date(t.getTime() + CONFIRM_TTL_MS).toISOString(), t.toISOString());
      alerts.addSubscription(s.id, r.kind, r.target, r.label, t.toISOString());
      if (!(await deliverFromForm(alertsConfirmEmail(email, `${base}/#/alerts/confirm/${token}`, r.label, r.kind, body.list === true)))) {
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
      await deliverFromForm(alertsWelcomeEmail(s.email, l.manage, l.unsubscribe, l.oneClick));
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
      return send(res, 200, { ok: true, message: 'If your address was on our list, we deleted it and everything you signed up for. You won’t get any more email from us.' });
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
      if (!limiters.leadEmail.hit(email)) throw new HttpError(429, 'You’ve sent several messages in the last hour. Try again later.');
      if (!limiters.leadPro.hit(row.id)) throw new HttpError(429, 'This professional has received many messages today. Try again tomorrow, or use the contact details on their profile.');
      const lead = { id: randomBytes(12).toString('hex'), proId: row.id, createdAt: now().toISOString(), name, email, phone, message, interest };
      db.leads.insert(lead);
      db.metrics.record(row.id, pacificDay(now()), 'lead', hasher.hash(clientIp(req), '', pacificDay(now())));
      // The lead is saved and shown on the advertiser's dashboard even if the email doesn't go out.
      await deliverFromForm(leadEmail(row.profile.email, row.profile.name, lead, `${base}/#/advertiser`));
      await deliverFromForm(leadReceiptEmail(email, row.profile.name));
      return send(res, 202, { ok: true, message: `Your message was sent to ${row.profile.name}. They will contact you directly.` });
    }

    // Approved profile photos, by the hash the signed directory lists. Pending photos are never public.
    const photoPath = method === 'GET' ? path.match(/^\/api\/pro-photos\/([0-9a-f]{64})\.webp$/) : null;
    if (photoPath) {
      const image = db.photos.liveBySha(photoPath[1]);
      if (!image) throw new HttpError(404, 'Not found');
      return sendImage(res, image, 'public, max-age=31536000, immutable');
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
        await deliverFromForm(loginLinkEmail(email, row.profile.name, `${base}/#/advertiser/login/${token}`));
      }
      return send(res, 200, generic);
    }

    if (method === 'POST' && path === '/api/pro/session') {
      assertAppRequest(req);
      if (!limiters.proSession.hit(clientIp(req))) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
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
          photo: db.photos.meta(row.id),
        });
      }
      const ownPhoto = method === 'GET' ? path.match(/^\/api\/pro\/photo\/(pending|live)$/) : null;
      if (ownPhoto) {
        const p = db.photos.get(row.id, ownPhoto[1] as 'pending' | 'live');
        if (!p) throw new HttpError(404, 'No photo');
        return sendImage(res, p.image, 'no-store');
      }
      if (method === 'POST' && path === '/api/pro/photo') {
        assertAppRequest(req);
        if (!/^image\/(jpeg|png|webp)$/i.test(req.headers['content-type'] ?? '')) throw new HttpError(415, 'Use a JPG, PNG or WebP photo.');
        if (!limiters.proPhoto.hit(row.id)) throw new HttpError(429, 'Too many uploads. Try again in an hour.');
        let raw: Buffer;
        try {
          raw = await readRaw(req, PHOTO_MAX_BYTES);
        } catch (e) {
          if (e instanceof HttpError && e.status === 413) throw new HttpError(413, 'That photo is over 5 MB. Choose a smaller one.');
          throw e;
        }
        let photo: Awaited<ReturnType<typeof processPhoto>>;
        try {
          photo = await processPhoto(raw);
        } catch (e) {
          if (e instanceof PhotoError) throw new HttpError(422, e.message);
          throw e;
        }
        db.photos.setPending(row.id, photo.sha256, photo.image, now().toISOString());
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'PHOTO_UPLOADED', detail: photo.sha256.slice(0, 12) });
        return send(res, 200, { ok: true, message: 'Photo received. It will appear on your profile once we approve it, usually within a business day.' });
      }
      if (method === 'POST' && path === '/api/pro/photo/remove') {
        assertAppRequest(req);
        const which = (await readJson(req)).which;
        if (which !== 'pending' && which !== 'live') throw new HttpError(400, 'Say which photo to remove.');
        if (db.photos.remove(row.id, which)) {
          db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: which === 'live' ? 'PHOTO_REMOVED' : 'PHOTO_WITHDRAWN', detail: null });
          if (which === 'live') publish();
        }
        return send(res, 200, { ok: true });
      }
      if (method === 'POST' && path === '/api/pro/checkout') {
        const stripe = config.stripe;
        if (!stripe || !payable(row.profile.category)) throw new HttpError(409, 'Online payment is not available for your category yet. We will contact you about your plan.');
        // The browser only names a plan (and a topic); the price and any discount are chosen here.
        const body = await readJson(req);
        const tier = body.tier === undefined ? 'standard' : body.tier;
        if (!isAdTier(tier)) throw new HttpError(400, 'Choose a plan.');
        const plan = stripe.client.planFor(row.profile.category, tier);
        if (!plan) throw new HttpError(409, `The ${TIER_INFO[tier].label} plan isn’t available for your category yet.`);
        const topic = tier === 'premium_plus' ? body.topic : null;
        if (tier === 'premium_plus' && !topicAllowed(row.profile.category, topic)) throw new HttpError(422, 'Choose the Learn or Practice topic for your Premium Plus ad.');
        if (!row.verification) throw new HttpError(409, 'Your license must be verified before you can start advertising.');
        if (!limiters.checkout.hit(row.id)) throw new HttpError(429, 'Too many attempts. Try again later.');
        let acct = db.stripe.forPro(row.id);
        if (acct && ACTIVE_SUB.has(acct.status ?? '')) throw new HttpError(409, 'You already have an active plan. Use "Manage billing" to change your card or cancel.');
        const full = capFor(row, tier, topic);
        if (full) throw new HttpError(409, capMessage(full, row.profile.category, topic));
        if (!acct) {
          const customer = await stripe.client.createCustomer({ proId: row.id, email: row.profile.email, name: row.profile.company || row.profile.name });
          db.stripe.link(row.id, customer.id, now().toISOString());
          acct = db.stripe.forPro(row.id)!;
        }
        const coupon = row.founding && plan.foundingCoupon ? plan.foundingCoupon : null;
        const session = await stripe.client.createCheckoutSession({
          proId: row.id,
          customerId: acct.customerId,
          priceId: plan.priceId,
          tier,
          topic,
          coupon,
          successUrl: `${base}/#/advertiser?payment=done`,
          cancelUrl: `${base}/#/advertiser?payment=cancelled`,
          attempt: newToken().slice(0, 16),
        });
        if (typeof session.url !== 'string' || !session.url.startsWith(CHECKOUT_URL_PREFIX)) throw new HttpError(502, 'The payment page could not be opened. Try again.');
        db.stripe.setPending(row.id, tier, topic, now().toISOString());
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'CHECKOUT_STARTED', detail: `${TIER_INFO[tier].label} · ${plan.amountLabel}${topic ? ` · topic ${topic}` : ''}${coupon ? ' · founding coupon' : ''}` });
        return send(res, 200, { url: session.url });
      }
      if (method === 'POST' && path === '/api/pro/ad-line') {
        assertAppRequest(req);
        const raw = (await readJson(req)).adLine;
        const error = validateAdLine(raw, row.profile.category);
        if (error) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: { adLine: error } });
        const line = typeof raw === 'string' ? raw.trim() : '';
        if (!line) {
          // Taking an ad line down needs no review.
          db.update(row.id, { profile: { ...row.profile, adLine: '', adLinePending: '' } }, now().toISOString());
          db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'AD_LINE_REMOVED', detail: null });
          publish();
          return send(res, 200, { ok: true, message: 'Your ad line was removed.' });
        }
        db.update(row.id, { profile: { ...row.profile, adLinePending: line } }, now().toISOString());
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'AD_LINE_SUBMITTED', detail: line });
        return send(res, 200, { ok: true, message: 'Ad line received. It appears once we review it, usually within a business day.' });
      }
      if (method === 'POST' && path === '/api/pro/ad-topic') {
        assertAppRequest(req);
        const topic = (await readJson(req)).topic;
        if (billingTier(row.billing) !== 'premium_plus') throw new HttpError(409, 'Topic ads are part of the Premium Plus plan.');
        if (!topicAllowed(row.profile.category, topic)) throw new HttpError(422, 'Choose one of the topics for your category.');
        const full = capFor(row, 'premium_plus', topic);
        if (full) throw new HttpError(409, capMessage(full, row.profile.category, topic));
        db.update(row.id, { profile: { ...row.profile, adTopic: topic } }, now().toISOString());
        db.audit({ at: now().toISOString(), actor: 'advertiser', applicationId: row.id, action: 'AD_TOPIC_SET', detail: topic });
        publish();
        return send(res, 200, { ok: true });
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
      if (passwordChecks >= MAX_PASSWORD_CHECKS) throw new HttpError(429, 'Sign-in is busy. Try again in a minute.');
      // Count the attempt BEFORE the slow check, so parallel requests can't all slip under the limit.
      if (!limiters.loginIp.hit(ip) || (!trusted && !limiters.loginUser.hit(username))) throw new HttpError(429, 'Too many failed sign-in attempts. Wait 15 minutes.');
      // Always run the (slow) password check so response time doesn't reveal whether the username exists.
      const userOk = safeEqualStrings(username, config.adminUsername);
      passwordChecks++;
      let passOk = false;
      try {
        passOk = await verifyPasswordAsync(password, config.adminPasswordHash);
      } finally {
        passwordChecks--;
      }
      if (!(userOk && passOk)) {
        // Don't store whatever was typed as an unknown username (it's sometimes a mistyped password).
        db.audit({ at: now().toISOString(), actor: userOk ? config.adminUsername : '(unknown user)', applicationId: null, action: 'LOGIN_FAILED', detail: ip });
        throw new HttpError(401, 'Incorrect username or password.');
      }
      limiters.loginIp.reset(ip);
      limiters.loginUser.reset(username);
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
      return send(res, 200, { counts: { ...c, trackedProperties: count('property'), savedSearches: count('search') }, postalAddressReady: postalReady, dailyMax, broadcasts: broadcasts.recent() });
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
      if (!(await deliver({ ...broadcastEmail(to, `[Test] ${subject}`, text, sample, postalAddress || '(postal address)'), headers: undefined }))) throw new HttpError(503, 'The test email could not be sent. Check the server log.');
      audit(null, 'EMAIL_TEST_SENT', `${subject} → ${maskEmail(to)}`);
      return send(res, 200, { ok: true, message: `Test sent to ${to}.` });
    }
    if (method === 'POST' && path === '/api/admin/email/send') {
      const body = await readJson(req);
      const { subject, text } = validateBroadcast(body);
      if (!postalReady) throw new HttpError(409, 'Set your business name (src/lib/siteInfo.ts) and postal address (MAIL_POSTAL_ADDRESS) first. The law requires them in every update (CAN-SPAM).');
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
      sendBroadcasts().catch((e) => console.error('Sending the email update failed:', e));
      return send(res, 202, { ok: true, broadcast: b });
    }

    if (method === 'POST' && path === '/api/admin/reports') {
      const { month } = await readJson(req);
      if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'month must be YYYY-MM');
      const n = sendMonthlyReports(month);
      audit(null, 'REPORTS_SENT', `${month}: ${n}`);
      return send(res, 200, { ok: true, sent: n });
    }

    const m = path.match(/^\/api\/admin\/applications\/([^/]+)(?:\/(approve|billing|reject|suspend|metrics|photo|photo\/approve|photo\/reject|founding|ad-line\/approve|ad-line\/reject))?$/);
    if (!m) throw new HttpError(404, 'Not found');
    const app = loadApp(m[1]);
    const action = m[2];

    if (method === 'GET' && !action) return send(res, 200, { application: adminView(app), audit: db.auditFor(app.id) });
    if (method === 'GET' && action === 'metrics') return send(res, 200, summarize(db, app.id, ...(Object.values(dateRange(url)) as [string, string])));
    if (method === 'GET' && action === 'photo') {
      const p = db.photos.get(app.id, 'pending');
      // With ?sha=, only that exact upload: the admin sees the same photo they then approve.
      const want = url.searchParams.get('sha');
      if (!p || (want && want !== p.sha256)) throw new HttpError(404, 'No photo waiting');
      return sendImage(res, p.image, 'no-store');
    }
    if (method === 'POST' && (action === 'photo/approve' || action === 'photo/reject')) {
      // The decision names the exact photo reviewed, so a replacement uploaded meanwhile is never approved unseen.
      const sha = (await readJson(req) as { sha256?: unknown }).sha256;
      if (typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha)) throw new HttpError(400, 'Say which photo you reviewed.');
      const changed = 'The photo changed since you opened it. Review the new one.';
      if (action === 'photo/approve') {
        if (!db.photos.approve(app.id, sha)) throw new HttpError(409, db.photos.meta(app.id).pending ? changed : 'No photo is waiting for review.');
        audit(app.id, 'PHOTO_APPROVED', db.photos.meta(app.id).live?.slice(0, 12) ?? null);
        publish();
      } else {
        if (!db.photos.rejectPending(app.id, sha)) throw new HttpError(409, db.photos.meta(app.id).pending ? changed : 'No photo is waiting for review.');
        audit(app.id, 'PHOTO_REJECTED', null);
      }
      return send(res, 200, { ok: true, application: adminView(app) });
    }
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
        contentReviewed: raw.contentReviewed === true,
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
      if (!wasApproved) await deliver(approvedEmail(app.profile.email, app.profile.name, `${base}/#/advertiser`, payable(app.profile.category)));
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }

    if (action === 'billing') {
      if (!['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(app.status)) throw new HttpError(409, `Can't bill an application that is ${app.status}.`);
      // Payments received another way, or a complimentary (fee-waived) listing: plan label "Complimentary".
      const billing = validateBilling((body.billing ?? {}) as Record<string, unknown>);
      if (!billing) throw new HttpError(422, 'Enter a plan name, a plan and a listed-through date.');
      const tier = billingTier(billing);
      const rawTopic = (body.billing as { topic?: unknown } | undefined)?.topic;
      const topic = tier === 'premium_plus' ? (topicAllowed(app.profile.category, rawTopic) ? rawTopic : null) : null;
      if (tier === 'premium_plus' && rawTopic && !topic) throw new HttpError(422, 'Choose one of the topics for this category.');
      // Comped and manually billed advertisers count toward the caps like card-paying ones.
      const full = capFor(app, tier, topic);
      if (full) throw new HttpError(409, capMessage(full, app.profile.category, topic));
      const profile = { ...app.profile, adTopic: topic ?? (tier === 'premium_plus' ? app.profile.adTopic : '') };
      db.update(app.id, { billing, profile }, now().toISOString());
      audit(app.id, billing.complimentary ? 'COMPLIMENTARY' : 'BILLING', `${billing.plan} · ${TIER_INFO[tier].label}${topic ? ` (${topic})` : ''}, listed through ${billing.paidThrough}`);
      publish();
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }

    if (action === 'founding') {
      if (typeof body.founding !== 'boolean') throw new HttpError(400, 'Say whether this is a founding advertiser.');
      db.setFounding(app.id, body.founding, now().toISOString());
      audit(app.id, body.founding ? 'FOUNDING_SET' : 'FOUNDING_REMOVED', null);
      return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
    }

    if (action === 'ad-line/approve' || action === 'ad-line/reject') {
      // The decision names the exact text reviewed, so a newer submission is never approved unseen.
      if (!app.profile.adLinePending) throw new HttpError(409, 'No ad line is waiting for review.');
      if (body.adLine !== app.profile.adLinePending) throw new HttpError(409, 'The ad line changed since you opened it. Review the new one.');
      if (action === 'ad-line/approve') {
        const error = validateAdLine(app.profile.adLinePending, app.profile.category);
        if (error) throw new HttpError(422, error);
        db.update(app.id, { profile: { ...app.profile, adLine: app.profile.adLinePending, adLinePending: '' } }, now().toISOString());
        audit(app.id, 'AD_LINE_APPROVED', app.profile.adLinePending);
        publish();
      } else {
        db.update(app.id, { profile: { ...app.profile, adLinePending: '' } }, now().toISOString());
        audit(app.id, 'AD_LINE_REJECTED', app.profile.adLinePending);
      }
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
    let file = resolve(baseDir, normalize(rel));
    if (file !== baseDir && !file.startsWith(baseDir + sep)) return send(res, 404, { error: 'Not found' });
    let info;
    try {
      info = statSync(file);
      // A folder of the built site serves its index.html: the crawlable copies of each page (scripts/prerender.ts).
      if (info.isDirectory() && !fromData) {
        file = join(file, 'index.html');
        info = statSync(file);
      }
    } catch {
      // Pages are normal paths (/practice/drills/x): one without a pre-built copy gets the app, which shows the
      // page (or its own "not found"). Missing files (anything with an extension) and data stay 404s.
      if (fromData || /\.[a-z0-9]{1,8}$/i.test(path) || path.startsWith('/assets/')) return send(res, 404, { error: 'Not found' });
      file = join(baseDir, 'index.html');
      try {
        info = statSync(file);
      } catch {
        return send(res, 404, { error: 'Not found' });
      }
    }
    if (!info.isFile()) return send(res, 404, { error: 'Not found' });
    // Only Vite's content-hashed build files can be cached forever. Everything else (index.html, the
    // signed feeds, the favicon) is revalidated on each use; the ETag makes an unchanged file a tiny 304.
    const hashed = !fromData && path.startsWith('/assets/');
    const etag = `W/"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;
    const headers = {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
      etag,
    };
    if (!hashed && req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    res.writeHead(200, { ...headers, 'content-length': info.size });
    if (req.method === 'HEAD') return res.end();
    // pipeline() handles errors (a file removed mid-deploy, too many open files): the response is
    // closed instead of the error crashing the whole server.
    pipeline(createReadStream(file), res, (err) => {
      if (err && !res.destroyed) res.destroy();
    });
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
    db.purgeStale(t.toISOString());
    sendBroadcasts().catch((e) => console.error('Sending the email update failed:', e)); // resume a send interrupted by a restart
    const day = pacificDay(t);
    if (day.endsWith('-01')) {
      const prev = new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 7);
      sendMonthlyReports(prev);
    }
  }

  return { handler, publish, maintain, sendMonthlyReports, checkTracked, sendBroadcasts, db, alerts };
}
