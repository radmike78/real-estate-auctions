// Denial-of-service defenses: bounded rate limiters, IPv6 grouping, sign-in floods and static files.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { clientKey, hashPassword, RateLimiter } from './auth';

describe('rate limiter under a flood', () => {
  it('stops storing hits once a key is over its limit, so a flood costs nothing extra', () => {
    const r = new RateLimiter(3, 60_000);
    for (let i = 0; i < 100_000; i++) r.hit('attacker', 1_000);
    expect(r.hit('attacker', 1_000)).toBe(false);
    expect((r as unknown as { hits: Map<string, number[]> }).hits.get('attacker')).toHaveLength(3);
    expect(r.hit('attacker', 61_001)).toBe(true); // the window slides
  });

  it('evicts the least recently used key, so cycling addresses can’t reset a key still in use', () => {
    const r = new RateLimiter(2, 60_000, 100);
    r.hit('admin', 1);
    r.hit('admin', 2);
    for (let i = 0; i < 1_000; i++) {
      r.hit(`ip-${i}`, 3);
      if (i % 50 === 0) r.blocked('admin', 3); // still being tried
    }
    expect(r.blocked('admin', 4)).toBe(true);
    expect(r.size).toBeLessThanOrEqual(100);
  });

  it('forgets keys whose window has passed', () => {
    const r = new RateLimiter(5, 1_000);
    for (let i = 0; i < 500; i++) r.hit(`k${i}`, 0);
    for (let i = 0; i < 1_000; i++) r.hit('late', 10_000 + i);
    expect(r.size).toBeLessThan(10);
  });
});

describe('client keys', () => {
  it('group IPv6 addresses by their /64 network and leave IPv4 alone', () => {
    expect(clientKey('203.0.113.9')).toBe('203.0.113.9');
    expect(clientKey('::ffff:203.0.113.9')).toBe('203.0.113.9');
    expect(clientKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2::/64');
    expect(clientKey('2001:db8:1:2::1')).toBe('2001:db8:1:2::/64');
    expect(clientKey('2001:0db8:0001:0002:0:0:0:ffff')).toBe('2001:db8:1:2::/64');
    expect(clientKey('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(clientKey('unknown')).toBe('unknown');
  });
});

describe('server under load', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-avail-'));
  const dist = join(dir, 'dist');
  let server: Server;
  let base = '';

  beforeAll(async () => {
    mkdirSync(join(dist, 'assets'), { recursive: true });
    writeFileSync(join(dist, 'index.html'), '<!doctype html><title>t</title>');
    writeFileSync(join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
    writeFileSync(join(dist, 'favicon.svg'), '<svg/>');
    mkdirSync(join(dist, 'learn', 'markets'), { recursive: true });
    writeFileSync(join(dist, 'learn', 'markets', 'index.html'), '<!doctype html><title>Markets</title>');
    writeFileSync(join(dist, 'sitemap.xml'), '<urlset/>');
    const app = createApp({
      dbPath: join(dir, 'app.db'),
      dataDir: join(dir, 'data'),
      distDir: dist,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('a-long-admin-password'),
      directorySigningKey: null,
      feedPublicKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async () => {} },
      secureCookies: false,
      trustProxy: true,
    });
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  const login = (ip: string, username = 'admin') =>
    fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-fsf-request': '1', origin: base, 'x-forwarded-for': ip },
      body: JSON.stringify({ username, password: 'wrong-password-here' }),
    });

  it('counts parallel sign-in attempts before the slow password check, and runs at most two at once', async () => {
    const codes = (await Promise.all(Array.from({ length: 30 }, () => login('198.51.100.7')))).map((r) => r.status);
    expect(codes.filter((c) => c === 401).length).toBeLessThanOrEqual(5);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(25);
  });

  it('treats a whole IPv6 /64 as one network for sign-in limits', async () => {
    const codes: number[] = [];
    for (let i = 1; i <= 8; i++) codes.push((await login(`2001:db8:5:6::${i.toString(16)}`, `user${i}`)).status); // a new name each time: only the network limit applies
    expect(codes.slice(0, 5).every((c) => c === 401)).toBe(true);
    expect(codes.slice(5).every((c) => c === 429)).toBe(true);
  });

  it('serves hashed build files for a year and everything else with a revalidating ETag', async () => {
    const asset = await fetch(`${base}/assets/app-abc123.js`);
    expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    const icon = await fetch(`${base}/favicon.svg`);
    expect(icon.headers.get('cache-control')).toBe('no-cache');
    const etag = icon.headers.get('etag')!;
    expect(etag).toMatch(/^W\/"/);
    const again = await fetch(`${base}/favicon.svg`, { headers: { 'if-none-match': etag } });
    expect(again.status).toBe(304);
  });

  it('serves a page folder’s index.html and the sitemap, but never a folder listing', async () => {
    for (const u of ['/learn/markets/', '/learn/markets']) {
      const r = await fetch(`${base}${u}`);
      expect(r.status, u).toBe(200);
      expect(await r.text()).toContain('<title>Markets</title>');
    }
    expect((await fetch(`${base}/learn/`)).status).toBe(404);
    expect((await fetch(`${base}/sitemap.xml`)).headers.get('content-type')).toBe('application/xml; charset=utf-8');
  });

  it('keeps running when a file disappears between the check and the read', async () => {
    writeFileSync(join(dist, 'gone.txt'), 'x');
    rmSync(join(dist, 'gone.txt'));
    expect((await fetch(`${base}/gone.txt`)).status).toBe(404);
    expect((await fetch(`${base}/healthz`)).status).toBe(200);
  });
});
