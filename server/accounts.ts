// Optional learner accounts. Separate from admin/advertiser identities and privileges.
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { domainToASCII } from 'node:url';
import { newToken, parseCookies, RateLimiter, safeEqualStrings, sessionCookie, sha256, SESSION_IDLE_MS, SESSION_MAX_MS } from './auth';
import type { Mail } from './mailer';
import { validCloudWork, type CloudWork } from '../src/lib/cloudWork';

export class AccountError extends Error { constructor(readonly status: number, message: string) { super(message); } }
interface Options {
  key: string; baseUrl: string; secure: boolean; now: () => Date;
  ip: (req: IncomingMessage) => string;
  json: (req: IncomingMessage) => Promise<Record<string, unknown>>;
  write: (req: IncomingMessage) => void;
  send: (res: ServerResponse, status: number, body: unknown) => void;
  mail: (mail: Mail) => Promise<boolean>;
}
const LINK_MS = 15 * 60_000;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
function fields(body: Record<string, unknown>, names: string[]) {
  if (Object.keys(body).some(k => !names.includes(k))) throw new AccountError(400, 'This form contains an unsupported field.');
}
export function accountEmail(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 254 || /[\r\n\u0000]/.test(value)) return null;
  const parts = value.trim().split('@');
  if (parts.length !== 2) return null;
  const [local, domain] = parts; const host = domainToASCII(domain).toLowerCase();
  // Support the common unquoted ASCII mailbox form. Preserve local-part case, dots and +tags.
  if (local.length < 1 || local.length > 64 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(host) || host.split('.').some(p => p.length > 63)) return null;
  return `${local}@${host}`;
}
export function openAccounts(db: DatabaseSync, o: Options) {
  const rootKey = Buffer.from(o.key, 'hex');
  const key = createHmac('sha256',rootKey).update('deedowl-account-encryption-v1').digest();
  const lookupKey = createHmac('sha256',rootKey).update('deedowl-account-email-lookup-v1').digest();
  if (!/^[a-f0-9]{64}$/i.test(o.key)) throw new Error('ACCOUNT_ENCRYPTION_KEY must contain 32 random bytes in hex.');
  if (o.secure && new URL(o.baseUrl).protocol !== 'https:') throw new Error('Accounts require an HTTPS public URL.');
  const cookie = o.secure ? '__Host-deedowl_account' : 'deedowl_account_dev';
  const browserCookie = o.secure ? '__Host-deedowl_verify' : 'deedowl_verify_dev';
  const hmac = (value: string) => createHmac('sha256', lookupKey).update('deedowl-email-v1\0').update(value).digest('hex');
  const encrypt = (value: unknown, scope: string): string => {
    const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key, iv); c.setAAD(Buffer.from(scope));
    const data = Buffer.concat([c.update(JSON.stringify(value), 'utf8'), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64');
  };
  const decrypt = <T>(value: string, scope: string): T => {
    const bytes = Buffer.from(value, 'base64'); const c = createDecipheriv('aes-256-gcm', key, bytes.subarray(0,12));
    c.setAAD(Buffer.from(scope)); c.setAuthTag(bytes.subarray(12,28));
    return JSON.parse(Buffer.concat([c.update(bytes.subarray(28)), c.final()]).toString('utf8')) as T;
  };
  db.exec(`
    CREATE TABLE IF NOT EXISTS learner_accounts (id TEXT PRIMARY KEY, email_key TEXT NOT NULL UNIQUE, profile TEXT NOT NULL, work TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learner_links (token_hash TEXT PRIMARY KEY, browser_hash TEXT NOT NULL, email_key TEXT NOT NULL, profile TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learner_sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES learner_accounts(id) ON DELETE CASCADE, created INTEGER NOT NULL, seen INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS learner_session_owner ON learner_sessions(account_id);
  `);
  const ipLimit = new RateLimiter(5, 15 * 60_000);
  const addressLimit = new RateLimiter(3, 60 * 60_000);
  const exchangeLimit = new RateLimiter(20, 15 * 60_000);
  const workLimit = new RateLimiter(60, 60 * 1000);
  const time = () => o.now().getTime();
  const purge = () => {
    const at = time();
    db.prepare('DELETE FROM learner_links WHERE expires <= ?').run(at);
    db.prepare('DELETE FROM learner_sessions WHERE created <= ? OR seen <= ?').run(at - SESSION_MAX_MS, at - SESSION_IDLE_MS);
  };
  function write(req: IncomingMessage) {
    o.write(req);
    // A known public origin, independent of untrusted Host/X-Forwarded-Host headers.
    if (req.headers.origin !== new URL(o.baseUrl).origin) throw new AccountError(403, 'Cross-origin request refused.');
  }
  function session(req: IncomingMessage) {
    const token = parseCookies(req.headers.cookie)[cookie];
    if (!token || !TOKEN.test(token)) throw new AccountError(401, 'Sign in again to use saved work.');
    const hash = sha256(token);
    const s = db.prepare('SELECT account_id AS id, created, seen FROM learner_sessions WHERE token_hash = ?').get(hash) as {id:string;created:number;seen:number}|undefined;
    if (!s || s.created <= time() - SESSION_MAX_MS || s.seen <= time() - SESSION_IDLE_MS) {
      db.prepare('DELETE FROM learner_sessions WHERE token_hash = ?').run(hash);
      throw new AccountError(401, 'Your sign-in expired. Download any unsaved work, then sign in again.');
    }
    db.prepare('UPDATE learner_sessions SET seen = ? WHERE token_hash = ?').run(time(), hash);
    return { ...s, hash };
  }
  function row(id: string) {
    const r = db.prepare('SELECT profile, work, revision, updated FROM learner_accounts WHERE id = ?').get(id) as {profile:string;work:string;revision:number;updated:number}|undefined;
    if (!r) throw new AccountError(401, 'Sign in again to use saved work.');
    return r;
  }
  function info(id: string) {
    const r = row(id); return { id, ...decrypt<{email:string;firstName:string}>(r.profile, `profile:${id}`), revision:r.revision, updatedAt:new Date(r.updated).toISOString() };
  }
  async function handle(req: IncomingMessage, res: ServerResponse, path: string): Promise<boolean> {
    if (!path.startsWith('/api/account/')) return false;
    res.setHeader('cache-control','no-store'); res.setHeader('referrer-policy','no-referrer');
    const method = req.method ?? 'GET';
    if (method === 'POST') write(req);
    if (method === 'POST' && path === '/api/account/link') {
      if (!ipLimit.hit(o.ip(req))) throw new AccountError(429, 'Too many sign-in requests. Try again in 15 minutes.');
      const b = await o.json(req); fields(b, ['email','firstName','consent']);
      const email = accountEmail(b.email);
      const firstName = typeof b.firstName === 'string' ? b.firstName.trim() : '';
      if (!email || firstName.length > 50 || (firstName && !/^[\p{L}\p{M} '\u2019-]+$/u.test(firstName)) || b.consent !== true) throw new AccountError(400, 'Enter a valid email and first name, and accept account storage.');
      purge();
      const emailKey = hmac(email);
      if (addressLimit.hit(emailKey)) {
        const count = db.prepare('SELECT count(*) AS n FROM learner_links').get() as {n:number};
        if (count.n >= 1000) throw new AccountError(429, 'Sign-in is busy. Try again in a few minutes.');
        const token = newToken(); const browser = newToken(); const hash = sha256(token);
        db.prepare('INSERT INTO learner_links VALUES (?, ?, ?, ?, ?)').run(hash, sha256(browser), emailKey, encrypt({email,firstName},`link:${hash}`), time()+LINK_MS);
        res.setHeader('set-cookie', sessionCookie(browserCookie,browser,'/',o.secure,LINK_MS/1000));
        const ok = await o.mail({to:email,subject:'Your DeedOwl sign-in link',text:`Use this link to verify your email and sign in:\n${o.baseUrl.replace(/\/$/,'')}/account#verify=${token}\n\nOpen it in the same browser where you requested it. It expires in 15 minutes and works once. Do not forward it. No password is needed. If you did not request this, ignore this email.`});
        if (!ok) { db.prepare('DELETE FROM learner_links WHERE token_hash = ?').run(hash); throw new AccountError(503, 'The email could not be sent. Your browser work is unchanged. Try again later.'); }
      }
      o.send(res,200,{ok:true,message:'If delivery is available, a sign-in link will arrive. Open it in this browser within 15 minutes.'}); return true;
    }
    if (method === 'POST' && path === '/api/account/verify') {
      if (!exchangeLimit.hit(o.ip(req))) throw new AccountError(429,'Too many attempts. Try again later.');
      const b = await o.json(req); fields(b,['token']);
      const browser = parseCookies(req.headers.cookie)[browserCookie];
      if (typeof b.token !== 'string' || !TOKEN.test(b.token) || !browser || !TOKEN.test(browser)) throw new AccountError(400,'Request a new link in this browser, then open that link here.');
      purge();
      const hash = sha256(b.token);
      // Atomic delete-return prevents simultaneous exchanges from replaying the same link.
      const p = db.prepare('DELETE FROM learner_links WHERE token_hash = ? AND browser_hash = ? AND expires > ? RETURNING profile, email_key').get(hash,sha256(browser),time()) as {profile:string;email_key:string}|undefined;
      if (!p) throw new AccountError(400,'That link expired or was already used. Request a new link.');
      const old = db.prepare('SELECT id FROM learner_accounts WHERE email_key = ?').get(p.email_key) as {id:string}|undefined;
      const id = old?.id ?? randomBytes(16).toString('hex');
      if (!old) db.prepare('INSERT INTO learner_accounts VALUES (?, ?, ?, ?, 0, ?)').run(id,p.email_key,encrypt(decrypt(p.profile,`link:${hash}`),`profile:${id}`),encrypt({},`work:${id}`),time());
      const previous = parseCookies(req.headers.cookie)[cookie];
      if (previous) db.prepare('DELETE FROM learner_sessions WHERE token_hash = ?').run(sha256(previous));
      const token = newToken(); db.prepare('INSERT INTO learner_sessions VALUES (?, ?, ?, ?)').run(sha256(token),id,time(),time());
      res.setHeader('set-cookie',[sessionCookie(cookie,token,'/',o.secure),sessionCookie(browserCookie,'','/',o.secure,0)]);
      o.send(res,200,{account:info(id)}); return true;
    }
    if (method === 'GET' && path === '/api/account/me') { const s=session(req); o.send(res,200,{account:info(s.id)}); return true; }
    if (method === 'GET' && path === '/api/account/work') {
      const s=session(req); const r=row(s.id);
      o.send(res,200,{owner:s.id,revision:r.revision,updatedAt:new Date(r.updated).toISOString(),data:decrypt<CloudWork>(r.work,`work:${s.id}`)}); return true;
    }
    if (method === 'POST' && path === '/api/account/work') {
      const s=session(req);
      if (!workLimit.hit(s.id)) throw new AccountError(429,'Too many saves. Wait a minute and try again.');
      const b=await o.json(req); fields(b,['owner','revision','data']);
      // owner is only a guard against an account switched in another tab, never an authorization selector.
      if (typeof b.owner !== 'string' || !safeEqualStrings(b.owner,s.id)) throw new AccountError(409,'The signed-in account changed. Download unsaved work and reload.');
      if (!Number.isSafeInteger(b.revision) || Number(b.revision)<0 || !validCloudWork(b.data)) throw new AccountError(400,'Only supported property details, deal numbers and learning progress can be saved.');
      const result=db.prepare('UPDATE learner_accounts SET work = ?, revision = revision + 1, updated = ? WHERE id = ? AND revision = ?').run(encrypt(b.data,`work:${s.id}`),time(),s.id,Number(b.revision));
      if (Number(result.changes)!==1) throw new AccountError(409,'A newer save exists on another tab or device. Download this work before reloading the saved version.');
      o.send(res,200,{revision:Number(b.revision)+1,updatedAt:new Date(time()).toISOString()}); return true;
    }
    if (method === 'POST' && path === '/api/account/logout') {
      const b=await o.json(req); fields(b,[]);
      const token=parseCookies(req.headers.cookie)[cookie]; if(token) db.prepare('DELETE FROM learner_sessions WHERE token_hash = ?').run(sha256(token));
      res.setHeader('set-cookie',sessionCookie(cookie,'','/',o.secure,0)); o.send(res,200,{ok:true}); return true;
    }
    if (method === 'POST' && path === '/api/account/delete') {
      const s=session(req); const b=await o.json(req); fields(b,['owner','confirm']);
      if (b.owner!==s.id || b.confirm!=='DELETE') throw new AccountError(400,'Confirm account deletion.');
      if (s.created <= time()-LINK_MS) throw new AccountError(403,'For safety, sign in with a fresh email link before deleting your account.');
      const r = row(s.id);
      const profile=decrypt<{email:string}>(r.profile,`profile:${s.id}`);
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('DELETE FROM learner_links WHERE email_key = ?').run(hmac(profile.email));
        db.prepare('DELETE FROM learner_sessions WHERE account_id = ?').run(s.id);
        db.prepare('DELETE FROM learner_accounts WHERE id = ?').run(s.id);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
      res.setHeader('set-cookie',sessionCookie(cookie,'','/',o.secure,0)); o.send(res,200,{ok:true}); return true;
    }
    throw new AccountError(404,'Not found');
  }
  return {handle,purge};
}
