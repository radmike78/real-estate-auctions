// SQLite storage (node:sqlite, built into Node 22). One file, no external database.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { isAdTier, type AdTier } from '../src/lib/adPlans';
import { withProfileDefaults, type Billing, type LicenseVerification, type ProProfile } from '../src/lib/proApplication';

export type ApplicationStatus = 'EMAIL_UNCONFIRMED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface StoredVerification extends LicenseVerification {
  verifiedAt: string; // YYYY-MM-DD
  verifiedBy: string; // admin username (never published)
}

export interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  profile: ProProfile;
  verification: StoredVerification | null;
  billing: Billing | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
  emailConfirmedAt: string | null;
  /** Founding advertiser (set by an admin): checkout applies the plan's founding coupon. */
  founding: boolean;
  /** Ads turned off by an admin: the profile and directory listing stay, the ad boxes don't show. */
  adsHidden: boolean;
}

export interface AuditEntry {
  at: string;
  actor: string;
  applicationId: string | null;
  action: string;
  detail: string | null;
}

// ad_impression / ad_click: the advertiser's Featured ad or topic ad box was shown / its contact button was used.
export type MetricKind = 'impression' | 'profile_view' | 'phone_click' | 'email_click' | 'website_click' | 'lead' | 'ad_impression' | 'ad_click';
export const METRIC_KINDS: MetricKind[] = ['impression', 'profile_view', 'phone_click', 'email_click', 'website_click', 'lead', 'ad_impression', 'ad_click'];

export interface LeadRow {
  id: string;
  proId: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  interest: string | null;
}

export function openDb(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL; -- safe with WAL: a power cut can lose the last moment of writes, never corrupt the file
    PRAGMA busy_timeout = 5000; -- wait up to 5 s for a lock (e.g. during a backup) instead of failing
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      license_id TEXT NOT NULL,
      email TEXT NOT NULL,
      profile TEXT NOT NULL,
      verification TEXT,
      billing TEXT,
      decision_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      email_confirmed_at TEXT,
      email_token_hash TEXT,
      email_token_expires TEXT
    );
    CREATE INDEX IF NOT EXISTS applications_license ON applications (category, license_id);
    CREATE INDEX IF NOT EXISTS applications_token ON applications (email_token_hash);
    CREATE INDEX IF NOT EXISTS applications_email ON applications (email);
    CREATE INDEX IF NOT EXISTS applications_status ON applications (status, created_at);
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL,
      actor TEXT NOT NULL,
      application_id TEXT,
      action TEXT NOT NULL,
      detail TEXT
    );
    CREATE INDEX IF NOT EXISTS audit_application ON audit (application_id);
    CREATE INDEX IF NOT EXISTS audit_action ON audit (action, at);
    -- kind: 'admin' | 'pro'. subject: admin username or pro id.
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      subject TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_tokens (
      token_hash TEXT PRIMARY KEY,
      pro_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    -- Aggregated counts only. No IP addresses or visitor identifiers are stored here.
    CREATE TABLE IF NOT EXISTS metrics_daily (
      pro_id TEXT NOT NULL,
      day TEXT NOT NULL,
      kind TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      uniques INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (pro_id, day, kind)
    );
    -- Salted one-way visitor hashes, used only to count unique visitors per day; purged after 2 days.
    CREATE TABLE IF NOT EXISTS metric_seen (
      pro_id TEXT NOT NULL,
      day TEXT NOT NULL,
      kind TEXT NOT NULL,
      visitor TEXT NOT NULL,
      PRIMARY KEY (pro_id, day, kind, visitor)
    );
    -- Site-wide daily totals by fixed key (page section or action). No visitor identifiers.
    CREATE TABLE IF NOT EXISTS site_daily (
      day TEXT NOT NULL,
      metric TEXT NOT NULL,
      key TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      uniques INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, metric, key)
    );
    -- Salted one-way daily visitor hashes for site-wide unique counts; purged after 2 days.
    CREATE TABLE IF NOT EXISTS site_seen (
      day TEXT NOT NULL,
      metric TEXT NOT NULL,
      key TEXT NOT NULL,
      visitor TEXT NOT NULL,
      PRIMARY KEY (day, metric, key, visitor)
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      pro_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      interest TEXT
    );
    CREATE INDEX IF NOT EXISTS leads_pro ON leads (pro_id, created_at);
    CREATE TABLE IF NOT EXISTS reports_sent (
      pro_id TEXT NOT NULL,
      month TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      PRIMARY KEY (pro_id, month)
    );
    -- Profile photos, already cleaned and re-encoded (server/photos.ts). 'pending' waits for an admin;
    -- 'live' is the approved one shown on the site. At most one of each per advertiser.
    CREATE TABLE IF NOT EXISTS pro_photos (
      pro_id TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('pending', 'live')),
      sha256 TEXT NOT NULL,
      image BLOB NOT NULL,
      uploaded_at TEXT NOT NULL,
      PRIMARY KEY (pro_id, state)
    );
    CREATE INDEX IF NOT EXISTS pro_photos_sha ON pro_photos (sha256);
    -- Online payments: one Stripe customer per advertiser. No card data is ever stored here.
    CREATE TABLE IF NOT EXISTS stripe_accounts (
      pro_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL UNIQUE,
      subscription_id TEXT,
      status TEXT,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    -- Small site settings, one value per key: the admin's choices (e.g. the Mentor Connect ad spots, as JSON) and
    -- the email alerts' own keys (server/alerts.ts).
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    -- Stripe events already processed (webhooks can be delivered more than once).
    CREATE TABLE IF NOT EXISTS stripe_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      received_at TEXT NOT NULL
    );
  `);
  // Columns added after the first release. SQLite has no ADD COLUMN IF NOT EXISTS, so check first; existing rows get the default.
  const addColumn = (table: string, column: string, definition: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  };
  addColumn('applications', 'founding', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('applications', 'ads_hidden', 'INTEGER NOT NULL DEFAULT 0');
  // The plan and topic chosen at checkout, used if a payment's price can't be matched to a plan (and for the topic).
  addColumn('stripe_accounts', 'pending_tier', 'TEXT');
  addColumn('stripe_accounts', 'pending_topic', 'TEXT');

  const toRow = (r: Record<string, unknown>): ApplicationRow => ({
    id: r.id as string,
    status: r.status as ApplicationStatus,
    profile: withProfileDefaults(JSON.parse(r.profile as string)),
    verification: r.verification ? JSON.parse(r.verification as string) : null,
    billing: r.billing ? JSON.parse(r.billing as string) : null,
    decisionReason: (r.decision_reason as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    emailConfirmedAt: (r.email_confirmed_at as string) ?? null,
    founding: r.founding === 1,
    adsHidden: r.ads_hidden === 1,
  });

  const api = {
    raw: db,
    insertApplication(a: { id: string; profile: ProProfile; tokenHash: string; tokenExpires: string; now: string }) {
      db.prepare(
        `INSERT INTO applications (id, status, category, license_id, email, profile, created_at, updated_at, email_token_hash, email_token_expires)
         VALUES (?, 'EMAIL_UNCONFIRMED', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(a.id, a.profile.category, a.profile.licenseId, a.profile.email, JSON.stringify(a.profile), a.now, a.now, a.tokenHash, a.tokenExpires);
    },
    /** Consumes an email token (single use). Returns the application id, or null if invalid/expired. */
    confirmEmail(tokenHash: string, now: string): string | null {
      const r = db.prepare(`SELECT id, email_token_expires FROM applications WHERE email_token_hash = ? AND status = 'EMAIL_UNCONFIRMED'`).get(tokenHash) as
        | { id: string; email_token_expires: string }
        | undefined;
      if (!r || r.email_token_expires < now) return null;
      db.prepare(
        `UPDATE applications SET status = 'PENDING_REVIEW', email_confirmed_at = ?, updated_at = ?, email_token_hash = NULL, email_token_expires = NULL WHERE id = ?`,
      ).run(now, now, r.id);
      return r.id;
    },
    get(id: string): ApplicationRow | null {
      const r = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Record<string, unknown> | undefined;
      return r ? toRow(r) : null;
    },
    list(): ApplicationRow[] {
      return (db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all() as Record<string, unknown>[]).map(toRow);
    },
    listByStatus(status: ApplicationStatus): ApplicationRow[] {
      return (db.prepare('SELECT * FROM applications WHERE status = ? ORDER BY created_at').all(status) as Record<string, unknown>[]).map(toRow);
    },
    approvedByEmail(email: string): ApplicationRow | null {
      const r = db.prepare(`SELECT * FROM applications WHERE email = ? AND status = 'APPROVED' ORDER BY updated_at DESC LIMIT 1`).get(email) as Record<string, unknown> | undefined;
      return r ? toRow(r) : null;
    },
    /** Other applications with the same license (in the same category) or email: possible impersonation. */
    duplicates(a: ApplicationRow): { id: string; status: string; field: 'license' | 'email' }[] {
      const rows = db
        .prepare("SELECT id, status, category, license_id, email FROM applications WHERE id != ? AND ((category = ? AND license_id = ? AND license_id != '') OR email = ?)")
        .all(a.id, a.profile.category, a.profile.licenseId, a.profile.email) as { id: string; status: string; category: string; license_id: string; email: string }[];
      return rows.map((r) => ({ id: r.id, status: r.status, field: a.profile.licenseId && r.category === a.profile.category && r.license_id === a.profile.licenseId ? 'license' : 'email' }));
    },
    update(
      id: string,
      fields: { status?: ApplicationStatus; verification?: StoredVerification | null; billing?: Billing | null; decisionReason?: string | null; profile?: ProProfile },
      now: string,
    ) {
      const cur = api.get(id);
      if (!cur) return;
      // The category, license and email never change after applying (their indexed columns stay as they are).
      const profile = fields.profile ? { ...fields.profile, category: cur.profile.category, licenseId: cur.profile.licenseId, email: cur.profile.email } : cur.profile;
      db.prepare('UPDATE applications SET status = ?, verification = ?, billing = ?, decision_reason = ?, profile = ?, updated_at = ? WHERE id = ?').run(
        fields.status ?? cur.status,
        JSON.stringify(fields.verification === undefined ? cur.verification : fields.verification),
        JSON.stringify(fields.billing === undefined ? cur.billing : fields.billing),
        fields.decisionReason === undefined ? cur.decisionReason : fields.decisionReason,
        JSON.stringify(profile),
        now,
        id,
      );
    },
    setFounding(id: string, founding: boolean, now: string) {
      db.prepare('UPDATE applications SET founding = ?, updated_at = ? WHERE id = ?').run(founding ? 1 : 0, now, id);
    },
    setAdsHidden(id: string, hidden: boolean, now: string) {
      db.prepare('UPDATE applications SET ads_hidden = ?, updated_at = ? WHERE id = ?').run(hidden ? 1 : 0, now, id);
    },
    /**
     * Housekeeping so spam can't fill the disk: applications whose email was never confirmed (the link
     * expires after 48 hours) go after 7 days; sign-in records after 90 days; processed Stripe event ids
     * after 90 days (Stripe stops retrying after 3). Decisions about applications are kept.
     */
    purgeStale(nowIso: string) {
      const daysAgo = (d: number) => new Date(Date.parse(nowIso) - d * 86_400_000).toISOString();
      db.prepare(`DELETE FROM applications WHERE status = 'EMAIL_UNCONFIRMED' AND created_at < ?`).run(daysAgo(7));
      db.prepare(`DELETE FROM audit WHERE action IN ('LOGIN', 'LOGIN_FAILED') AND at < ?`).run(daysAgo(90));
      db.prepare('DELETE FROM stripe_events WHERE received_at < ?').run(daysAgo(90));
    },
    audit(e: AuditEntry) {
      db.prepare('INSERT INTO audit (at, actor, application_id, action, detail) VALUES (?, ?, ?, ?, ?)').run(e.at, e.actor, e.applicationId, e.action, e.detail);
    },
    auditFor(id: string): AuditEntry[] {
      return db.prepare('SELECT at, actor, application_id AS applicationId, action, detail FROM audit WHERE application_id = ? ORDER BY id').all(id) as unknown as AuditEntry[];
    },
    sessions: {
      create(tokenHash: string, kind: 'admin' | 'pro', subject: string, now: number) {
        db.prepare('INSERT INTO sessions (token_hash, kind, subject, created_at, last_seen) VALUES (?, ?, ?, ?, ?)').run(tokenHash, kind, subject, now, now);
      },
      get(tokenHash: string, kind: 'admin' | 'pro') {
        return db.prepare('SELECT subject, created_at AS createdAt, last_seen AS lastSeen FROM sessions WHERE token_hash = ? AND kind = ?').get(tokenHash, kind) as
          | { subject: string; createdAt: number; lastSeen: number }
          | undefined;
      },
      touch(tokenHash: string, now: number) {
        db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(now, tokenHash);
      },
      delete(tokenHash: string) {
        db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
      },
      purge(olderThan: number) {
        db.prepare('DELETE FROM sessions WHERE last_seen < ?').run(olderThan);
      },
      /** Signs a subject out everywhere (e.g. when an advertiser is suspended). */
      deleteForSubject(kind: 'admin' | 'pro', subject: string) {
        db.prepare('DELETE FROM sessions WHERE kind = ? AND subject = ?').run(kind, subject);
      },
    },
    loginTokens: {
      create(tokenHash: string, proId: string, expiresAt: number) {
        db.prepare('INSERT INTO login_tokens (token_hash, pro_id, expires_at) VALUES (?, ?, ?)').run(tokenHash, proId, expiresAt);
      },
      /** Single use. */
      consume(tokenHash: string, now: number): string | null {
        const r = db.prepare('SELECT pro_id AS proId, expires_at AS expiresAt FROM login_tokens WHERE token_hash = ?').get(tokenHash) as { proId: string; expiresAt: number } | undefined;
        db.prepare('DELETE FROM login_tokens WHERE token_hash = ? OR expires_at < ?').run(tokenHash, now);
        return r && r.expiresAt >= now ? r.proId : null;
      },
      deleteForPro(proId: string) {
        db.prepare('DELETE FROM login_tokens WHERE pro_id = ?').run(proId);
      },
    },
    metrics: {
      /** Counts one event; `visitor` is a salted daily hash used only for unique counts. */
      record(proId: string, day: string, kind: MetricKind, visitor: string) {
        const fresh = db.prepare('INSERT OR IGNORE INTO metric_seen (pro_id, day, kind, visitor) VALUES (?, ?, ?, ?)').run(proId, day, kind, visitor).changes > 0;
        db.prepare(
          `INSERT INTO metrics_daily (pro_id, day, kind, total, uniques) VALUES (?, ?, ?, 1, ?)
           ON CONFLICT (pro_id, day, kind) DO UPDATE SET total = total + 1, uniques = uniques + excluded.uniques`,
        ).run(proId, day, kind, fresh ? 1 : 0);
      },
      series(proId: string, from: string, to: string) {
        return db.prepare('SELECT day, kind, total, uniques FROM metrics_daily WHERE pro_id = ? AND day BETWEEN ? AND ? ORDER BY day').all(proId, from, to) as {
          day: string;
          kind: MetricKind;
          total: number;
          uniques: number;
        }[];
      },
      purgeSeen(beforeDay: string) {
        db.prepare('DELETE FROM metric_seen WHERE day < ?').run(beforeDay);
      },
    },
    site: {
      /** Counts one site event: metric 'visit' (key ''), 'page' (section) or 'action'. */
      record(day: string, metric: 'visit' | 'page' | 'action', key: string, visitor: string) {
        const fresh = db.prepare('INSERT OR IGNORE INTO site_seen (day, metric, key, visitor) VALUES (?, ?, ?, ?)').run(day, metric, key, visitor).changes > 0;
        db.prepare(
          `INSERT INTO site_daily (day, metric, key, total, uniques) VALUES (?, ?, ?, 1, ?)
           ON CONFLICT (day, metric, key) DO UPDATE SET total = total + 1, uniques = uniques + excluded.uniques`,
        ).run(day, metric, key, fresh ? 1 : 0);
      },
      series(from: string, to: string) {
        return db.prepare('SELECT day, metric, key, total, uniques FROM site_daily WHERE day BETWEEN ? AND ? ORDER BY day').all(from, to) as {
          day: string;
          metric: string;
          key: string;
          total: number;
          uniques: number;
        }[];
      },
      /** Advertiser totals across every profile, by kind. */
      advertiserTotals(from: string, to: string) {
        return db.prepare('SELECT kind, SUM(total) AS total, SUM(uniques) AS uniques FROM metrics_daily WHERE day BETWEEN ? AND ? GROUP BY kind').all(from, to) as {
          kind: MetricKind;
          total: number;
          uniques: number;
        }[];
      },
      purgeSeen(beforeDay: string) {
        db.prepare('DELETE FROM site_seen WHERE day < ?').run(beforeDay);
      },
    },
    leads: {
      insert(l: LeadRow) {
        db.prepare('INSERT INTO leads (id, pro_id, created_at, name, email, phone, message, interest) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          l.id, l.proId, l.createdAt, l.name, l.email, l.phone, l.message, l.interest,
        );
      },
      /** Leads received in [start, end) (ISO UTC instants). */
      forPro(proId: string, start: string, end: string): LeadRow[] {
        return db
          .prepare('SELECT id, pro_id AS proId, created_at AS createdAt, name, email, phone, message, interest FROM leads WHERE pro_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at DESC')
          .all(proId, start, end) as unknown as LeadRow[];
      },
      purgeOlderThan(iso: string) {
        db.prepare('DELETE FROM leads WHERE created_at < ?').run(iso);
      },
    },
    photos: {
      setPending(proId: string, sha256: string, image: Buffer, at: string) {
        db.prepare("INSERT OR REPLACE INTO pro_photos (pro_id, state, sha256, image, uploaded_at) VALUES (?, 'pending', ?, ?, ?)").run(proId, sha256, image, at);
      },
      get(proId: string, state: 'pending' | 'live') {
        const r = db.prepare('SELECT sha256, image, uploaded_at AS uploadedAt FROM pro_photos WHERE pro_id = ? AND state = ?').get(proId, state) as
          | { sha256: string; image: Uint8Array; uploadedAt: string }
          | undefined;
        return r ? { ...r, image: Buffer.from(r.image) } : undefined;
      },
      /** Replaces the live photo with the pending one, only if it is still the exact photo the admin reviewed
       *  (`sha256`). Returns false if nothing matching is pending. */
      approve(proId: string, sha256: string): boolean {
        if (api.photos.get(proId, 'pending')?.sha256 !== sha256) return false;
        db.exec('BEGIN');
        try {
          db.prepare("DELETE FROM pro_photos WHERE pro_id = ? AND state = 'live'").run(proId);
          db.prepare("UPDATE pro_photos SET state = 'live' WHERE pro_id = ? AND state = 'pending'").run(proId);
          db.exec('COMMIT');
        } catch (e) {
          db.exec('ROLLBACK');
          throw e;
        }
        return true;
      },
      remove(proId: string, state: 'pending' | 'live') {
        return db.prepare('DELETE FROM pro_photos WHERE pro_id = ? AND state = ?').run(proId, state).changes > 0;
      },
      /** Rejects the pending photo only if it is still the one the admin reviewed. */
      rejectPending(proId: string, sha256: string) {
        return db.prepare("DELETE FROM pro_photos WHERE pro_id = ? AND state = 'pending' AND sha256 = ?").run(proId, sha256).changes > 0;
      },
      /** An approved photo of a currently approved advertiser, by its hash (the only way photos are served publicly). */
      liveBySha(sha256: string) {
        const r = db
          .prepare("SELECT p.image FROM pro_photos p JOIN applications a ON a.id = p.pro_id WHERE p.sha256 = ? AND p.state = 'live' AND a.status = 'APPROVED' LIMIT 1")
          .get(sha256) as { image: Uint8Array } | undefined;
        return r ? Buffer.from(r.image) : undefined;
      },
      liveMap(): Map<string, string> {
        const rows = db.prepare("SELECT pro_id AS proId, sha256 FROM pro_photos WHERE state = 'live'").all() as { proId: string; sha256: string }[];
        return new Map(rows.map((r) => [r.proId, r.sha256]));
      },
      /** Hash and upload time of each state, without the image bytes. */
      meta(proId: string): { live: string | null; pendingAt: string | null; pending: string | null } {
        const rows = db.prepare('SELECT state, sha256, uploaded_at AS uploadedAt FROM pro_photos WHERE pro_id = ?').all(proId) as { state: string; sha256: string; uploadedAt: string }[];
        const pending = rows.find((r) => r.state === 'pending');
        return { live: rows.find((r) => r.state === 'live')?.sha256 ?? null, pendingAt: pending?.uploadedAt ?? null, pending: pending?.sha256 ?? null };
      },
      pendingIds(): Set<string> {
        return new Set((db.prepare("SELECT pro_id AS proId FROM pro_photos WHERE state = 'pending'").all() as { proId: string }[]).map((r) => r.proId));
      },
    },
    reports: {
      wasSent(proId: string, month: string) {
        return !!db.prepare('SELECT 1 FROM reports_sent WHERE pro_id = ? AND month = ?').get(proId, month);
      },
      markSent(proId: string, month: string, at: string) {
        db.prepare('INSERT OR IGNORE INTO reports_sent (pro_id, month, sent_at) VALUES (?, ?, ?)').run(proId, month, at);
      },
    },
    stripe: {
      forPro(proId: string) {
        return toAccount(db.prepare(`SELECT ${STRIPE_COLS} FROM stripe_accounts WHERE pro_id = ?`).get(proId));
      },
      byCustomer(customerId: string) {
        return toAccount(db.prepare(`SELECT ${STRIPE_COLS} FROM stripe_accounts WHERE customer_id = ?`).get(customerId));
      },
      /** Remembers the plan and topic chosen at checkout (null clears them). */
      setPending(proId: string, tier: AdTier | null, topic: string | null, at: string) {
        db.prepare('UPDATE stripe_accounts SET pending_tier = ?, pending_topic = ?, updated_at = ? WHERE pro_id = ?').run(tier, topic, at, proId);
      },
      link(proId: string, customerId: string, at: string) {
        db.prepare('INSERT INTO stripe_accounts (pro_id, customer_id, updated_at) VALUES (?, ?, ?) ON CONFLICT (pro_id) DO NOTHING').run(proId, customerId, at);
      },
      setSubscription(proId: string, fields: { subscriptionId?: string | null; status?: string | null; cancelAtPeriodEnd?: boolean }, at: string) {
        const cur = api.stripe.forPro(proId);
        if (!cur) return;
        db.prepare('UPDATE stripe_accounts SET subscription_id = ?, status = ?, cancel_at_period_end = ?, updated_at = ? WHERE pro_id = ?').run(
          fields.subscriptionId === undefined ? cur.subscriptionId : fields.subscriptionId,
          fields.status === undefined ? cur.status : fields.status,
          (fields.cancelAtPeriodEnd === undefined ? !!cur.cancelAtPeriodEnd : fields.cancelAtPeriodEnd) ? 1 : 0,
          at,
          proId,
        );
      },
      /** Records an event ID; returns false if it was already processed. */
      claimEvent(id: string, type: string, at: string): boolean {
        return db.prepare('INSERT OR IGNORE INTO stripe_events (id, type, received_at) VALUES (?, ?, ?)').run(id, type, at).changes > 0;
      },
      releaseEvent(id: string) {
        db.prepare('DELETE FROM stripe_events WHERE id = ?').run(id);
      },
    },
    /** A saved setting, parsed (null when never saved or unreadable). */
    getSetting(key: string): unknown {
      const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
      if (!r) return null;
      try {
        return JSON.parse(r.value);
      } catch {
        return null;
      }
    },
    setSetting(key: string, value: unknown) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
    },
    /** Cheap query used by the health check. */
    ping(): boolean {
      return (db.prepare('SELECT 1 AS ok').get() as { ok: number }).ok === 1;
    },
    /** Writes a consistent copy of the database to `file` while the site keeps running. */
    backupTo(file: string) {
      db.prepare('VACUUM INTO ?').run(file);
    },
    close() {
      db.close();
    },
  };
  return api;
}

export type Db = ReturnType<typeof openDb>;

export interface StripeAccount {
  proId: string;
  customerId: string;
  subscriptionId: string | null;
  status: string | null;
  cancelAtPeriodEnd: number;
  pendingTier: AdTier | null;
  pendingTopic: string | null;
}

const STRIPE_COLS = 'pro_id AS proId, customer_id AS customerId, subscription_id AS subscriptionId, status, cancel_at_period_end AS cancelAtPeriodEnd, pending_tier AS pendingTier, pending_topic AS pendingTopic';

function toAccount(r: unknown): StripeAccount | undefined {
  if (!r) return undefined;
  const a = r as StripeAccount;
  return { ...a, pendingTier: isAdTier(a.pendingTier) ? a.pendingTier : null, pendingTopic: typeof a.pendingTopic === 'string' ? a.pendingTopic : null };
}
