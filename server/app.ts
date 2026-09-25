// HTTP API for agent signup and admin approval, plus static hosting of the built site.
//
// Public:
//   POST /api/agent-applications            submit an application (rate limited, honeypot)
//   POST /api/agent-applications/confirm    confirm email ownership with the emailed token
// Admin (session cookie + x-fsf-admin header + same-origin check on every write):
//   POST /api/admin/login | /logout, GET /api/admin/me
//   GET  /api/admin/applications[/:id]
//   POST /api/admin/applications/:id/approve   (also used to re-verify an approved agent)
//   POST /api/admin/applications/:id/reject | /suspend
//   POST /api/admin/publish
// Static: /data/* from dataDir (signed feeds), everything else from distDir.

import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import type { KeyObject } from 'node:crypto';
import { approvalBlockers, plain, validateApplication, type ApplicationInput, type LicenseVerification } from '../src/lib/agentApplication';
import { REVERIFY_DAYS } from '../src/lib/agents';
import { COOKIE, newToken, parseCookies, RateLimiter, SESSION_IDLE_MS, SESSION_MAX_MS, safeEqualStrings, sessionCookie, sha256, verifyPassword } from './auth';
import { openDb, type ApplicationRow, type Db } from './db';
import { buildAgentsFeed, writeSignedJson } from './directory';
import { confirmationEmail, consoleMailer, type Mailer } from './mailer';

export interface AppConfig {
  dbPath: string;
  dataDir: string; // where signed feeds are written and served from (/data/*)
  distDir: string | null; // built site; null = API only
  adminUsername: string;
  adminPasswordHash: string;
  signingKey: KeyObject | null;
  baseUrl: string; // public site URL used in email links
  mailer?: Mailer;
  secureCookies?: boolean;
  trustProxy?: boolean;
  now?: () => Date;
}

const JSON_LIMIT = 32 * 1024;
const ID_RE = /^[a-f0-9]{24}$/;
const EMAIL_TOKEN_TTL_MS = 48 * 3_600_000;

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
  const mailer = config.mailer ?? consoleMailer;
  const now = config.now ?? (() => new Date());
  const submitLimiter = new RateLimiter(5, 3_600_000);
  const confirmLimiter = new RateLimiter(20, 3_600_000);
  const loginIpLimiter = new RateLimiter(5, 15 * 60_000);
  const loginUserLimiter = new RateLimiter(10, 15 * 60_000);

  const clientIp = (req: IncomingMessage) =>
    (config.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';

  function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
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
    if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, 'Cross-origin request refused');
  }

  function requireAdmin(req: IncomingMessage): { username: string; tokenHash: string } {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) throw new HttpError(401, 'Not signed in');
    const tokenHash = sha256(token);
    const s = db.sessions.get(tokenHash);
    const t = now().getTime();
    if (!s || t - s.createdAt > SESSION_MAX_MS || t - s.lastSeen > SESSION_IDLE_MS) {
      if (s) db.sessions.delete(tokenHash);
      throw new HttpError(401, 'Session expired');
    }
    db.sessions.touch(tokenHash, t);
    if (req.method !== 'GET') {
      // Custom header can't be sent cross-site without a CORS preflight, which we never allow.
      if (req.headers['x-fsf-admin'] !== '1') throw new HttpError(403, 'Missing admin request header');
      assertSameOrigin(req);
    }
    return { username: s.username, tokenHash };
  }

  function publish(): number {
    if (!config.signingKey) return 0;
    const feed = buildAgentsFeed(db.listByStatus('APPROVED'), now());
    writeSignedJson(config.dataDir, 'agents.json', feed, config.signingKey);
    return feed.agents.length;
  }

  const today = () => now().toISOString().slice(0, 10);
  const daysSince = (d: string | undefined) => (d ? Math.floor((now().getTime() - Date.parse(`${d}T00:00:00Z`)) / 86_400_000) : null);

  function adminView(a: ApplicationRow) {
    const age = daysSince(a.verification?.verifiedAt);
    return {
      ...a,
      duplicates: db.duplicates(a),
      daysSinceVerified: age,
      reverifyDueInDays: age === null ? null : REVERIFY_DAYS - age,
    };
  }

  function loadApp(id: string): ApplicationRow {
    if (!ID_RE.test(id)) throw new HttpError(404, 'Not found');
    const a = db.get(id);
    if (!a) throw new HttpError(404, 'Not found');
    return a;
  }

  async function handleApi(req: IncomingMessage, res: ServerResponse, path: string) {
    const method = req.method ?? 'GET';

    // ---------- public ----------
    if (method === 'POST' && path === '/api/agent-applications') {
      assertSameOrigin(req);
      if (!submitLimiter.hit(clientIp(req))) throw new HttpError(429, 'Too many applications from this network. Try again later.');
      const input = (await readJson(req)) as Partial<ApplicationInput>;
      const accepted = { ok: true, message: 'Application received. Check your email to confirm your address.' };
      if (input.company_url) return send(res, 202, accepted); // honeypot: pretend success, store nothing
      const v = validateApplication(input);
      if (!v.ok) throw new HttpError(422, 'Please fix the highlighted fields.', { errors: v.errors });
      const id = randomBytes(12).toString('hex');
      const token = newToken();
      const t = now();
      db.insertApplication({ id, profile: v.profile, tokenHash: sha256(token), tokenExpires: new Date(t.getTime() + EMAIL_TOKEN_TTL_MS).toISOString(), now: t.toISOString() });
      db.audit({ at: t.toISOString(), actor: 'applicant', applicationId: id, action: 'SUBMITTED', detail: null });
      await mailer.send(confirmationEmail(v.profile.email, v.profile.name, `${config.baseUrl.replace(/\/$/, '')}/#/agents/confirm/${token}`));
      return send(res, 202, accepted);
    }

    if (method === 'POST' && path === '/api/agent-applications/confirm') {
      assertSameOrigin(req);
      if (!confirmLimiter.hit(clientIp(req))) throw new HttpError(429, 'Too many attempts. Try again later.');
      const { token } = await readJson(req);
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw new HttpError(400, 'This confirmation link is invalid or has expired.');
      const id = db.confirmEmail(sha256(token), now().toISOString());
      if (!id) throw new HttpError(400, 'This confirmation link is invalid or has expired.');
      db.audit({ at: now().toISOString(), actor: 'applicant', applicationId: id, action: 'EMAIL_CONFIRMED', detail: null });
      return send(res, 200, { ok: true, message: 'Email confirmed. We will verify your license and contact your brokerage before your profile goes live.' });
    }

    // ---------- admin ----------
    if (method === 'POST' && path === '/api/admin/login') {
      assertSameOrigin(req);
      if (req.headers['x-fsf-admin'] !== '1') throw new HttpError(403, 'Missing admin request header');
      const ip = clientIp(req);
      const body = await readJson(req);
      const username = plain(body.username, 64);
      const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
      if (loginIpLimiter.blocked(ip) || loginUserLimiter.blocked(username)) throw new HttpError(429, 'Too many failed sign-in attempts. Wait 15 minutes.');
      const ok = safeEqualStrings(username, config.adminUsername) && verifyPassword(password, config.adminPasswordHash);
      if (!ok) {
        loginIpLimiter.hit(ip);
        loginUserLimiter.hit(username);
        db.audit({ at: now().toISOString(), actor: username || '(blank)', applicationId: null, action: 'LOGIN_FAILED', detail: ip });
        throw new HttpError(401, 'Incorrect username or password.');
      }
      loginIpLimiter.reset(ip);
      const token = newToken();
      db.sessions.purge(now().getTime() - SESSION_MAX_MS);
      db.sessions.create(sha256(token), config.adminUsername, now().getTime());
      db.audit({ at: now().toISOString(), actor: config.adminUsername, applicationId: null, action: 'LOGIN', detail: ip });
      return send(res, 200, { ok: true, username: config.adminUsername }, { 'set-cookie': sessionCookie(token, config.secureCookies ?? true) });
    }

    if (!path.startsWith('/api/admin/')) throw new HttpError(404, 'Not found');
    const admin = requireAdmin(req);
    const audit = (applicationId: string | null, action: string, detail: string | null = null) =>
      db.audit({ at: now().toISOString(), actor: admin.username, applicationId, action, detail });

    if (method === 'POST' && path === '/api/admin/logout') {
      db.sessions.delete(admin.tokenHash);
      return send(res, 200, { ok: true }, { 'set-cookie': sessionCookie('', config.secureCookies ?? true, 0) });
    }
    if (method === 'GET' && path === '/api/admin/me') return send(res, 200, { username: admin.username, signingConfigured: !!config.signingKey });
    if (method === 'GET' && path === '/api/admin/applications') return send(res, 200, { applications: db.list().map(adminView) });
    if (method === 'POST' && path === '/api/admin/publish') {
      const n = publish();
      audit(null, 'PUBLISHED', `${n} agents`);
      return send(res, 200, { ok: true, published: n });
    }

    const m = path.match(/^\/api\/admin\/applications\/([^/]+)(?:\/(approve|reject|suspend))?$/);
    if (!m) throw new HttpError(404, 'Not found');
    const app = loadApp(m[1]);
    const action = m[2];

    if (method === 'GET' && !action) return send(res, 200, { application: adminView(app), audit: db.auditFor(app.id) });
    if (method !== 'POST' || !action) throw new HttpError(405, 'Method not allowed');
    const body = await readJson(req);

    if (action === 'approve') {
      if (!['PENDING_REVIEW', 'APPROVED', 'SUSPENDED'].includes(app.status)) {
        throw new HttpError(409, app.status === 'EMAIL_UNCONFIRMED' ? 'The applicant has not confirmed their email yet.' : `Can't approve an application that is ${app.status}.`);
      }
      const raw = (body.verification ?? {}) as Partial<LicenseVerification>;
      const verification: LicenseVerification = {
        licenseStatus: raw.licenseStatus as LicenseVerification['licenseStatus'],
        licenseExpires: plain(raw.licenseExpires, 10),
        nameMatches: raw.nameMatches === true,
        typeMatches: raw.typeMatches === true,
        brokerageMatches: raw.brokerageMatches === true,
        identityConfirmed: raw.identityConfirmed === true,
        identityMethod: plain(raw.identityMethod, 300),
      };
      const blockers = approvalBlockers(verification, today());
      if (blockers.length) throw new HttpError(422, 'Verification incomplete.', { blockers });
      const clash = db.duplicates(app).find((d) => d.field === 'license' && d.status === 'APPROVED');
      if (clash) throw new HttpError(409, `License ${app.profile.licenseNumber} is already listed under another approved profile (${clash.id}). Resolve that first.`);
      const wasApproved = app.status === 'APPROVED';
      db.update(app.id, { status: 'APPROVED', verification: { ...verification, verifiedAt: today(), verifiedBy: admin.username }, decisionReason: null }, now().toISOString());
      audit(app.id, wasApproved ? 'REVERIFIED' : 'APPROVED', `NRED: ${verification.licenseStatus}, expires ${verification.licenseExpires}. Identity: ${verification.identityMethod}`);
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
    // suspend
    if (app.status !== 'APPROVED') throw new HttpError(409, 'Only approved agents can be suspended.');
    db.update(app.id, { status: 'SUSPENDED', decisionReason: reason }, now().toISOString());
    audit(app.id, 'SUSPENDED', reason);
    publish();
    return send(res, 200, { ok: true, application: adminView(db.get(app.id)!) });
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, path: string) {
    const fromData = path.startsWith('/data/');
    const root = fromData ? config.dataDir : config.distDir;
    if (!root || (req.method !== 'GET' && req.method !== 'HEAD')) return send(res, 404, { error: 'Not found' });
    const rel = fromData ? path.slice('/data/'.length) : path === '/' ? 'index.html' : path.slice(1);
    const base = resolve(root);
    const file = resolve(base, normalize(rel));
    if (file !== base && !file.startsWith(base + sep)) return send(res, 404, { error: 'Not found' });
    if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': fromData || file.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  }

  async function handler(req: IncomingMessage, res: ServerResponse) {
    // Security headers on every response (the built HTML also carries its CSP meta tag).
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('content-security-policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    res.setHeader('permissions-policy', 'geolocation=(), camera=(), microphone=()');
    if (config.secureCookies ?? true) res.setHeader('strict-transport-security', 'max-age=63072000; includeSubDomains');

    let path: string;
    try {
      path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    } catch {
      return send(res, 400, { error: 'Bad request' });
    }
    try {
      if (path.startsWith('/api/')) return await handleApi(req, res, path);
      return serveStatic(req, res, path);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.body });
      console.error(e);
      return send(res, 500, { error: 'Something went wrong.' });
    }
  }

  return { handler, publish, db };
}

