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
        db.prepare('UPDATE subscribers SET list_opt_in = ?, confirm_token_hash = ?, confirm_expires = ?, updated_at = ? WHERE id = ?').run(
          cur.listOptIn || listOptIn ? 1 : 0, confirmHash, expires, now, cur.id,
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
