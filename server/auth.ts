// Admin authentication.
//  - Password stored only as a scrypt hash (ADMIN_PASSWORD_HASH), compared in constant time.
//  - Sessions: 32 random bytes in an HttpOnly, SameSite=Strict cookie; only a SHA-256 of the
//    token is stored, so a leaked database can't be used to hijack sessions.
//  - Absolute lifetime 8 h, idle timeout 1 h.
//  - Login throttling per client IP and per username.

import { createHash, randomBytes, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const SESSION_MAX_MS = 8 * 3_600_000;
export const SESSION_IDLE_MS = 3_600_000;
// Learners keep a longer sign-in than admins: nothing privileged is behind it, and a daily lockout would lose unsaved work.
export const LEARNER_SESSION_MAX_MS = 30 * 86_400_000;
export const LEARNER_SESSION_IDLE_MS = 7 * 86_400_000;

export function hashPassword(password: string): string {
  if (password.length < 12) throw new Error('Admin password must be at least 12 characters.');
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize('NFKC'), salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Same check as verifyPassword, without blocking the server while scrypt runs. */
export async function verifyPasswordAsync(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function safeEqualStrings(a: string, b: string): boolean {
  const x = Buffer.from(sha256(a));
  const y = Buffer.from(sha256(b));
  return timingSafeEqual(x, y);
}

/**
 * Sliding-window limiter kept in memory (single server process). Built to survive floods:
 * - once a key is at its limit, further hits are refused without being stored, so each key holds at
 *   most `limit` timestamps and a flooding client costs O(limit) per request, not O(requests);
 * - keys are kept least-recently-used first and the oldest-used are evicted past `maxKeys`, so an
 *   attacker cycling through addresses can't push out a key that is still being hit (like "admin");
 * - expired keys are swept regularly.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private sinceSweep = 0;
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 50_000,
  ) {}
  private recent(key: string, now: number): number[] {
    const list = this.hits.get(key);
    if (!list) return [];
    const fresh = list[0] !== undefined && now - list[0] >= this.windowMs ? list.filter((t) => now - t < this.windowMs) : list;
    // Move to the most-recently-used end.
    this.hits.delete(key);
    if (fresh.length) this.hits.set(key, fresh);
    return fresh;
  }
  /** Records a hit; returns false (and records nothing) when the key is over its limit. */
  hit(key: string, now = Date.now()): boolean {
    if (++this.sinceSweep >= 1_000) this.sweep(now);
    const recent = this.recent(key, now);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    while (this.hits.size > this.maxKeys) this.hits.delete(this.hits.keys().next().value!); // least recently used
    return true;
  }
  blocked(key: string, now = Date.now()): boolean {
    return this.recent(key, now).length >= this.limit;
  }
  reset(key: string) {
    this.hits.delete(key);
  }
  get size() {
    return this.hits.size;
  }
  private sweep(now: number) {
    this.sinceSweep = 0;
    for (const [k, list] of this.hits) if (!list.length || now - list[list.length - 1] >= this.windowMs) this.hits.delete(k);
  }
}

/**
 * The key a client is rate-limited and counted by. IPv4 as is; IPv6 by its /64 network, because one
 * home or server usually gets a whole /64 and could otherwise rotate through billions of addresses.
 */
export function clientKey(ip: string): string {
  const v4 = /^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (v4) return v4[1];
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('%')[0].toLowerCase().split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
  if (full.length !== 8 || !full.every((x) => /^[0-9a-f]{1,4}$/.test(x))) return ip;
  return `${full.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* malformed percent-encoding: ignore this cookie */
    }
  }
  return out;
}

export function sessionCookie(name: string, token: string, path: string, secure: boolean, maxAgeSec = SESSION_MAX_MS / 1000): string {
  return `${name}=${token}; Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}
