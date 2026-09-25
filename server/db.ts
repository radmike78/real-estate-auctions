// SQLite storage (node:sqlite, built into Node 22). One file, no external database.

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AgentProfile, LicenseVerification } from '../src/lib/agentApplication';

export type ApplicationStatus = 'EMAIL_UNCONFIRMED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface StoredVerification extends LicenseVerification {
  verifiedAt: string; // YYYY-MM-DD
  verifiedBy: string; // admin username (never published)
}

export interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  profile: AgentProfile;
  verification: StoredVerification | null;
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

export function openDb(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      license_number TEXT NOT NULL,
      email TEXT NOT NULL,
      profile TEXT NOT NULL,
      verification TEXT,
      decision_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      email_confirmed_at TEXT,
      email_token_hash TEXT,
      email_token_expires TEXT
    );
    CREATE INDEX IF NOT EXISTS applications_license ON applications (license_number);
    CREATE INDEX IF NOT EXISTS applications_token ON applications (email_token_hash);
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL,
      actor TEXT NOT NULL,
      application_id TEXT,
      action TEXT NOT NULL,
      detail TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );
  `);

  const toRow = (r: Record<string, unknown>): ApplicationRow => ({
    id: r.id as string,
    status: r.status as ApplicationStatus,
    profile: JSON.parse(r.profile as string),
    verification: r.verification ? JSON.parse(r.verification as string) : null,
    decisionReason: (r.decision_reason as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    emailConfirmedAt: (r.email_confirmed_at as string) ?? null,
  });

  return {
    raw: db,
    insertApplication(a: { id: string; profile: AgentProfile; tokenHash: string; tokenExpires: string; now: string }) {
      db.prepare(
        `INSERT INTO applications (id, status, license_number, email, profile, created_at, updated_at, email_token_hash, email_token_expires)
         VALUES (?, 'EMAIL_UNCONFIRMED', ?, ?, ?, ?, ?, ?, ?)`,
      ).run(a.id, a.profile.licenseNumber, a.profile.email, JSON.stringify(a.profile), a.now, a.now, a.tokenHash, a.tokenExpires);
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
    /** Other applications using the same license number or email (possible impersonation). */
    duplicates(a: ApplicationRow): { id: string; status: string; field: 'license' | 'email' }[] {
      const rows = db
        .prepare('SELECT id, status, license_number, email FROM applications WHERE id != ? AND (license_number = ? OR email = ?)')
        .all(a.id, a.profile.licenseNumber, a.profile.email) as { id: string; status: string; license_number: string; email: string }[];
      return rows.map((r) => ({ id: r.id, status: r.status, field: r.license_number === a.profile.licenseNumber ? 'license' : 'email' }));
    },
    update(id: string, fields: { status?: ApplicationStatus; verification?: StoredVerification | null; decisionReason?: string | null }, now: string) {
      const cur = this.get(id);
      if (!cur) return;
      db.prepare('UPDATE applications SET status = ?, verification = ?, decision_reason = ?, updated_at = ? WHERE id = ?').run(
        fields.status ?? cur.status,
        JSON.stringify(fields.verification === undefined ? cur.verification : fields.verification),
        fields.decisionReason === undefined ? cur.decisionReason : fields.decisionReason,
        now,
        id,
      );
    },
    audit(e: AuditEntry) {
      db.prepare('INSERT INTO audit (at, actor, application_id, action, detail) VALUES (?, ?, ?, ?, ?)').run(e.at, e.actor, e.applicationId, e.action, e.detail);
    },
    auditFor(id: string): AuditEntry[] {
      return (db.prepare('SELECT at, actor, application_id AS applicationId, action, detail FROM audit WHERE application_id = ? ORDER BY id').all(id) as unknown) as AuditEntry[];
    },
    sessions: {
      create(tokenHash: string, username: string, now: number) {
        db.prepare('INSERT INTO sessions (token_hash, username, created_at, last_seen) VALUES (?, ?, ?, ?)').run(tokenHash, username, now, now);
      },
      get(tokenHash: string) {
        return db.prepare('SELECT username, created_at AS createdAt, last_seen AS lastSeen FROM sessions WHERE token_hash = ?').get(tokenHash) as
          | { username: string; createdAt: number; lastSeen: number }
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
  };
}

export type Db = ReturnType<typeof openDb>;
