// Email alerts without accounts: people give an email address, confirm it once (double opt-in), and
// manage everything from a link in each email. Stored in the same SQLite file as the rest of the site.
//
// Links carry an HMAC of the subscriber id instead of a stored secret, so every email can include a
// working "manage" and "unsubscribe" link without keeping raw tokens in the database. The key is
// generated on first run and kept in the settings table. Bumping token_version invalidates old links.

import { createHmac, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { safeEqualStrings } from './auth';

export type SubscriberStatus = 'PENDING' | 'ACTIVE';
export type TokenPurpose = 'manage' | 'unsubscribe';

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  listOptIn: boolean;
  tokenVersion: number;
  createdAt: string;
  confirmedAt: string | null;
}

export interface Subscription {
  id: string;
  kind: string; // 'property' | 'search' (added by later steps)
  target: string;
  label: string;
  createdAt: string;
}

/** Most properties one address can track, and most saved searches. */
export const ALERT_LIMITS = { property: 25, search: 10 } as const;
/** Unconfirmed sign-ups are deleted after this long. */
export const CONFIRM_TTL_MS = 48 * 3_600_000;

const ID_RE = /^[a-f0-9]{24}$/;
const b64url = (b: Buffer) => b.toString('base64url');

export function openAlerts(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    -- One row per email address. PENDING until the address is confirmed; deleted on unsubscribe.
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      list_opt_in INTEGER NOT NULL DEFAULT 0,
      token_version INTEGER NOT NULL DEFAULT 1,
      confirm_token_hash TEXT,
      confirm_expires TEXT,
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS subscribers_confirm ON subscribers(confirm_token_hash);
    -- What each address asked to hear about: a tracked property or a saved search.
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      target TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (subscriber_id, kind, target)
    );
    CREATE INDEX IF NOT EXISTS subscriptions_target ON subscriptions(kind, target);
    -- Updates the admin sends to everyone on the general list, and each recipient's delivery,
    -- so a send resumes after a restart and nobody gets the same update twice.
    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      recipients INTEGER NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL, -- SENDING | DONE
      finished_at TEXT
    );
    CREATE TABLE IF NOT EXISTS broadcast_sends (
      broadcast_id TEXT NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
      subscriber_id TEXT NOT NULL,
      status TEXT NOT NULL, -- QUEUED | SENT | FAILED | SKIPPED
      PRIMARY KEY (broadcast_id, subscriber_id)
    );
  `);

  let secret = (db.prepare(`SELECT value FROM settings WHERE key = 'alerts_link_key'`).get() as { value: string } | undefined)?.value;
  if (!secret) {
    secret = randomBytes(32).toString('hex');
    db.prepare(`INSERT INTO settings (key, value) VALUES ('alerts_link_key', ?)`).run(secret);
  }
  const mac = (purpose: TokenPurpose, id: string, version: number) =>
    b64url(createHmac('sha256', secret!).update(`${purpose}:${id}:${version}`).digest());

  const toSubscriber = (r: Record<string, unknown>): Subscriber => ({
    id: r.id as string,
    email: r.email as string,
    status: r.status as SubscriberStatus,
    listOptIn: r.list_opt_in === 1,
    tokenVersion: r.token_version as number,
    createdAt: r.created_at as string,
    confirmedAt: (r.confirmed_at as string) ?? null,
  });

  const api = {
    /** A long-lived link token for one subscriber and purpose ("id.mac"). */
    token(s: Pick<Subscriber, 'id' | 'tokenVersion'>, purpose: TokenPurpose): string {
      return `${s.id}.${mac(purpose, s.id, s.tokenVersion)}`;
    },
    /** The subscriber a link token belongs to, or null if it's malformed, forged or out of date. */
    verify(token: unknown, purpose: TokenPurpose): Subscriber | null {
      if (typeof token !== 'string' || token.length > 100) return null;
      const [id, sig] = token.split('.');
      if (!id || !sig || !ID_RE.test(id)) return null;
      const s = api.get(id);
      if (!s || !safeEqualStrings(sig, mac(purpose, s.id, s.tokenVersion))) return null;
      return s;
    },
    get(id: string): Subscriber | null {
      const r = db.prepare('SELECT * FROM subscribers WHERE id = ?').get(id) as Record<string, unknown> | undefined;
      return r ? toSubscriber(r) : null;
    },
    byEmail(email: string): Subscriber | null {
      const r = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email) as Record<string, unknown> | undefined;
      return r ? toSubscriber(r) : null;
    },
    /** Creates or refreshes a PENDING sign-up with a new confirmation token. Never touches an ACTIVE one. */
    upsertPending(email: string, listOptIn: boolean, confirmHash: string, expires: string, now: string): Subscriber {
      const cur = api.byEmail(email);
      if (cur?.status === 'ACTIVE') return cur;
      if (cur) {
        // A new request replaces the earlier link, so its choice (general updates or not) is the one the confirmation email describes.
        db.prepare('UPDATE subscribers SET list_opt_in = ?, confirm_token_hash = ?, confirm_expires = ?, updated_at = ? WHERE id = ?').run(
          listOptIn ? 1 : 0, confirmHash, expires, now, cur.id,
        );
      } else {
        db.prepare(
          `INSERT INTO subscribers (id, email, status, list_opt_in, confirm_token_hash, confirm_expires, created_at, updated_at)
           VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
        ).run(randomBytes(12).toString('hex'), email, listOptIn ? 1 : 0, confirmHash, expires, now, now);
      }
      return api.byEmail(email)!;
    },
    /** Consumes a confirmation token (single use). Returns the now-active subscriber, or null. */
    confirm(confirmHash: string, now: string): Subscriber | null {
      const r = db.prepare(`SELECT id, confirm_expires FROM subscribers WHERE confirm_token_hash = ? AND status = 'PENDING'`).get(confirmHash) as
        | { id: string; confirm_expires: string }
        | undefined;
      if (!r || r.confirm_expires < now) return null;
      db.prepare(
        `UPDATE subscribers SET status = 'ACTIVE', confirmed_at = ?, updated_at = ?, confirm_token_hash = NULL, confirm_expires = NULL WHERE id = ?`,
      ).run(now, now, r.id);
      return api.get(r.id);
    },
    setListOptIn(id: string, on: boolean, now: string) {
      db.prepare('UPDATE subscribers SET list_opt_in = ?, updated_at = ? WHERE id = ?').run(on ? 1 : 0, now, id);
    },
    subscriptions(subscriberId: string): Subscription[] {
      return db
        .prepare('SELECT id, kind, target, label, created_at AS createdAt FROM subscriptions WHERE subscriber_id = ? ORDER BY created_at')
        .all(subscriberId) as unknown as Subscription[];
    },
    /** Adds a subscription unless it exists or the address is at its limit for that kind. */
    addSubscription(subscriberId: string, kind: keyof typeof ALERT_LIMITS, target: string, label: string, now: string): 'added' | 'exists' | 'limit' {
      const exists = db.prepare('SELECT 1 FROM subscriptions WHERE subscriber_id = ? AND kind = ? AND target = ?').get(subscriberId, kind, target);
      if (exists) return 'exists';
      const { n } = db.prepare('SELECT COUNT(*) AS n FROM subscriptions WHERE subscriber_id = ? AND kind = ?').get(subscriberId, kind) as { n: number };
      if (n >= ALERT_LIMITS[kind]) return 'limit';
      db.prepare('INSERT INTO subscriptions (id, subscriber_id, kind, target, label, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        randomBytes(12).toString('hex'), subscriberId, kind, target, label, now,
      );
      return 'added';
    },
    removeSubscription(subscriberId: string, subscriptionId: string): boolean {
      return db.prepare('DELETE FROM subscriptions WHERE subscriber_id = ? AND id = ?').run(subscriberId, subscriptionId).changes > 0;
    },
    /** Unsubscribe: removes the address and everything it asked for. */
    delete(id: string): boolean {
      return db.prepare('DELETE FROM subscribers WHERE id = ?').run(id).changes > 0;
    },
    /** Deletes sign-ups nobody confirmed in time. */
    purgeUnconfirmed(now: string): number {
      return db.prepare(`DELETE FROM subscribers WHERE status = 'PENDING' AND confirm_expires < ?`).run(now).changes as number;
    },
    counts(): { active: number; listOptIn: number; pending: number } {
      return db
        .prepare(
          `SELECT COALESCE(SUM(status = 'ACTIVE'), 0) AS active, COALESCE(SUM(status = 'ACTIVE' AND list_opt_in = 1), 0) AS listOptIn,
                  COALESCE(SUM(status = 'PENDING'), 0) AS pending FROM subscribers`,
        )
        .get() as { active: number; listOptIn: number; pending: number };
    },
  };
  return api;
}

export type Alerts = ReturnType<typeof openAlerts>;

export interface Broadcast {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  createdBy: string;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  status: 'SENDING' | 'DONE';
  finishedAt: string | null;
}

export function openBroadcasts(db: DatabaseSync) {
  const cols = `id, subject, body, created_at AS createdAt, created_by AS createdBy, recipients, sent, failed, skipped, status, finished_at AS finishedAt`;
  return {
    /** Confirmed addresses on the general list, oldest first (for the admin export). */
    listMembers(): { email: string; confirmedAt: string | null }[] {
      return db
        .prepare(`SELECT email, confirmed_at AS confirmedAt FROM subscribers WHERE status = 'ACTIVE' AND list_opt_in = 1 ORDER BY confirmed_at`)
        .all() as { email: string; confirmedAt: string | null }[];
    },
    sending(): Broadcast | null {
      return (db.prepare(`SELECT ${cols} FROM broadcasts WHERE status = 'SENDING' LIMIT 1`).get() as Broadcast | undefined) ?? null;
    },
    recent(limit = 20): Broadcast[] {
      return db.prepare(`SELECT ${cols} FROM broadcasts ORDER BY created_at DESC LIMIT ?`).all(limit) as unknown as Broadcast[];
    },
    /** Creates a send and queues every confirmed address on the general list. */
    create(subject: string, body: string, createdBy: string, now: string): Broadcast {
      const id = randomBytes(12).toString('hex');
      db.exec('BEGIN');
      try {
        db.prepare(`INSERT INTO broadcasts (id, subject, body, created_at, created_by, recipients, status) VALUES (?, ?, ?, ?, ?, 0, 'SENDING')`).run(id, subject, body, now, createdBy);
        const n = db
          .prepare(`INSERT INTO broadcast_sends (broadcast_id, subscriber_id, status) SELECT ?, id, 'QUEUED' FROM subscribers WHERE status = 'ACTIVE' AND list_opt_in = 1`)
          .run(id).changes as number;
        db.prepare('UPDATE broadcasts SET recipients = ? WHERE id = ?').run(n, id);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      return db.prepare(`SELECT ${cols} FROM broadcasts WHERE id = ?`).get(id) as unknown as Broadcast;
    },
    queued(limit: number): { broadcast: Broadcast; subscriberId: string }[] {
      const b = this.sending();
      if (!b) return [];
      const rows = db.prepare(`SELECT subscriber_id AS s FROM broadcast_sends WHERE broadcast_id = ? AND status = 'QUEUED' LIMIT ?`).all(b.id, limit) as { s: string }[];
      return rows.map((r) => ({ broadcast: b, subscriberId: r.s }));
    },
    /** Records one recipient's result; closes the send when nobody is left in the queue. */
    mark(broadcastId: string, subscriberId: string, status: 'SENT' | 'FAILED' | 'SKIPPED', now: string) {
      const changed = db.prepare(`UPDATE broadcast_sends SET status = ? WHERE broadcast_id = ? AND subscriber_id = ? AND status = 'QUEUED'`).run(status, broadcastId, subscriberId).changes;
      if (!changed) return;
      const col = status === 'SENT' ? 'sent' : status === 'FAILED' ? 'failed' : 'skipped';
      db.prepare(`UPDATE broadcasts SET ${col} = ${col} + 1 WHERE id = ?`).run(broadcastId);
      const left = db.prepare(`SELECT 1 FROM broadcast_sends WHERE broadcast_id = ? AND status = 'QUEUED' LIMIT 1`).get(broadcastId);
      if (!left) db.prepare(`UPDATE broadcasts SET status = 'DONE', finished_at = ? WHERE id = ?`).run(now, broadcastId);
    },
    /** How many list updates went out on a (Pacific) day, for the daily limit; kept across restarts. */
    sentOn(day: string): number {
      const r = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(`broadcast_sent:${day}`) as { value: string } | undefined;
      return r ? Number(r.value) || 0 : 0;
    },
    bumpSent(day: string): number {
      db.prepare(`DELETE FROM settings WHERE key LIKE 'broadcast_sent:%' AND key < ?`).run(`broadcast_sent:${day}`);
      db.prepare(`INSERT INTO settings (key, value) VALUES (?, '1') ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1`).run(`broadcast_sent:${day}`);
      return this.sentOn(day);
    },
    /** A send with nobody on the list has nothing to wait for. */
    closeIfEmpty(broadcastId: string, now: string) {
      const left = db.prepare(`SELECT 1 FROM broadcast_sends WHERE broadcast_id = ? AND status = 'QUEUED' LIMIT 1`).get(broadcastId);
      if (!left) db.prepare(`UPDATE broadcasts SET status = 'DONE', finished_at = ? WHERE id = ? AND status = 'SENDING'`).run(now, broadcastId);
    },
  };
}

export type Broadcasts = ReturnType<typeof openBroadcasts>;
