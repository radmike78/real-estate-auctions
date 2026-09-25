// SQLite storage (node:sqlite, built into Node 22). One file, no external database.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Billing, LicenseVerification, ProProfile } from '../src/lib/proApplication';

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
}

export interface AuditEntry {
  at: string;
  actor: string;
  applicationId: string | null;
  action: string;
  detail: string | null;
}

export type MetricKind = 'impression' | 'profile_view' | 'phone_click' | 'email_click' | 'website_click' | 'lead';
export const METRIC_KINDS: MetricKind[] = ['impression', 'profile_view', 'phone_click', 'email_click', 'website_click', 'lead'];

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
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL,
      actor TEXT NOT NULL,
      application_id TEXT,
      action TEXT NOT NULL,
      detail TEXT
    );
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
  `);

  const toRow = (r: Record<string, unknown>): ApplicationRow => ({
    id: r.id as string,
    status: r.status as ApplicationStatus,
    profile: JSON.parse(r.profile as string),
    verification: r.verification ? JSON.parse(r.verification as string) : null,
    billing: r.billing ? JSON.parse(r.billing as string) : null,
    decisionReason: (r.decision_reason as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    emailConfirmedAt: (r.email_confirmed_at as string) ?? null,
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
        .prepare('SELECT id, status, category, license_id, email FROM applications WHERE id != ? AND ((category = ? AND license_id = ?) OR email = ?)')
        .all(a.id, a.profile.category, a.profile.licenseId, a.profile.email) as { id: string; status: string; category: string; license_id: string; email: string }[];
      return rows.map((r) => ({ id: r.id, status: r.status, field: r.category === a.profile.category && r.license_id === a.profile.licenseId ? 'license' : 'email' }));
    },
    update(
      id: string,
      fields: { status?: ApplicationStatus; verification?: StoredVerification | null; billing?: Billing | null; decisionReason?: string | null },
      now: string,
    ) {
      const cur = api.get(id);
      if (!cur) return;
      db.prepare('UPDATE applications SET status = ?, verification = ?, billing = ?, decision_reason = ?, updated_at = ? WHERE id = ?').run(
        fields.status ?? cur.status,
        JSON.stringify(fields.verification === undefined ? cur.verification : fields.verification),
        JSON.stringify(fields.billing === undefined ? cur.billing : fields.billing),
        fields.decisionReason === undefined ? cur.decisionReason : fields.decisionReason,
        now,
        id,
      );
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
    reports: {
      wasSent(proId: string, month: string) {
        return !!db.prepare('SELECT 1 FROM reports_sent WHERE pro_id = ? AND month = ?').get(proId, month);
      },
      markSent(proId: string, month: string, at: string) {
        db.prepare('INSERT OR IGNORE INTO reports_sent (pro_id, month, sent_at) VALUES (?, ?, ?)').run(proId, month, at);
      },
    },
  };
  return api;
}

export type Db = ReturnType<typeof openDb>;
