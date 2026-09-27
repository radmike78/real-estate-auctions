import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import type { Mail } from './mailer';

describe('email alerts (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-alerts-'));
  const mails: Mail[] = [];
  let clock = new Date('2026-10-01T12:00:00Z');
  let server: Server;
  let base = '';
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp({
      dbPath: join(dir, 'app.db'),
      dataDir: join(dir, 'data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('a-long-admin-password'),
      directorySigningKey: null,
      feedPublicKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async (m) => void mails.push(m) },
      secureCookies: false,
      trustProxy: true,
      now: () => clock,
    });
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  let ip = 1;
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}`, ...headers },
      body: JSON.stringify(body),
    });
  const app1 = { 'x-fsf-request': '1' };
  const last = () => mails[mails.length - 1];
  const linkIn = (m: Mail, path: string) => m.text.match(new RegExp(`https://fsf\\.example/#/alerts/${path}/([A-Za-z0-9._-]+)`))![1];

  let manageToken = '';

  it('signs up with double opt-in and never echoes what was typed', async () => {
    const r = await post('/api/alerts/signup', { email: 'Investor@Example.com', list: true });
    expect(r.status).toBe(202);
    expect(mails).toHaveLength(1);
    expect(last().to).toBe('investor@example.com');
    expect(last().subject).toMatch(/Confirm/);
    expect(last().headers).toBeUndefined(); // no unsubscribe header before the address is confirmed
    expect(app.alerts.byEmail('investor@example.com')?.status).toBe('PENDING');
  });

  it('rejects bad input, cross-origin posts and honeypots', async () => {
    expect((await post('/api/alerts/signup', { email: 'nope', list: true })).status).toBe(422);
    expect((await post('/api/alerts/signup', { email: 'a@b.co', list: false })).status).toBe(422);
    expect((await post('/api/alerts/signup', { email: 'a@b.co', list: true }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post('/api/alerts/signup', { email: 'bot@b.co', list: true, company_url: 'x' })).status).toBe(202);
    expect(app.alerts.byEmail('bot@b.co')).toBeNull();
    expect(mails).toHaveLength(1);
  });

  it('caps confirmation emails per address', async () => {
    ip = 2;
    for (let i = 0; i < 5; i++) expect((await post('/api/alerts/signup', { email: 'flood@example.com', list: true })).status).toBe(202);
    expect(mails.filter((m) => m.to === 'flood@example.com')).toHaveLength(3);
  });

  it('confirms once, then sends a welcome email with manage and one-click unsubscribe links', async () => {
    const confirmMail = mails.find((m) => m.to === 'investor@example.com')!;
    const token = linkIn(confirmMail, 'confirm');
    const r = await post('/api/alerts/confirm', { token });
    expect(r.status).toBe(200);
    manageToken = (await r.json()).manageToken;
    expect(manageToken).toMatch(/^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/);
    expect((await post('/api/alerts/confirm', { token })).status).toBe(400); // single use
    const welcome = last();
    expect(welcome.subject).toMatch(/signed up/);
    expect(linkIn(welcome, 'manage')).toBe(manageToken);
    expect(welcome.headers?.['List-Unsubscribe']).toMatch(/^<https:\/\/fsf\.example\/api\/alerts\/unsubscribe\?t=/);
    expect(welcome.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(welcome.text).toMatch(/Unsubscribe from everything/);
  });

  it('sends an already-active address its manage link instead of changing anything', async () => {
    ip = 3;
    const before = mails.length;
    expect((await post('/api/alerts/signup', { email: 'investor@example.com', list: true })).status).toBe(202);
    expect(mails).toHaveLength(before + 1);
    expect(last().subject).toMatch(/alerts link/);
    expect(linkIn(last(), 'manage')).toBe(manageToken);
  });

  it('manage link shows and changes preferences; forged or wrong-purpose links fail', async () => {
    const view = await (await post('/api/alerts/manage', { token: manageToken }, app1)).json();
    expect(view).toMatchObject({ email: 'investor@example.com', listOptIn: true, subscriptions: [] });
    expect((await post('/api/alerts/manage', { token: manageToken })).status).toBe(403); // app header required
    const forged = manageToken.slice(0, -2) + (manageToken.endsWith('AA') ? 'BB' : 'AA');
    expect((await post('/api/alerts/manage', { token: forged }, app1)).status).toBe(404);
    const s = app.alerts.byEmail('investor@example.com')!;
    expect((await post('/api/alerts/manage', { token: app.alerts.token(s, 'unsubscribe') }, app1)).status).toBe(404);
    const off = await (await post('/api/alerts/update', { token: manageToken, list: false }, app1)).json();
    expect(off.listOptIn).toBe(false);
    expect(app.alerts.addSubscription(s.id, 'property', 'p1', '123 Test St', clock.toISOString())).toBe('added');
    expect(app.alerts.addSubscription(s.id, 'property', 'p1', '123 Test St', clock.toISOString())).toBe('exists');
    const withSub = await (await post('/api/alerts/manage', { token: manageToken }, app1)).json();
    expect(withSub.subscriptions).toHaveLength(1);
    const removed = await (await post('/api/alerts/update', { token: manageToken, remove: withSub.subscriptions[0].id }, app1)).json();
    expect(removed.subscriptions).toHaveLength(0);
  });

  it('limits subscriptions per address', () => {
    const s = app.alerts.byEmail('investor@example.com')!;
    for (let i = 0; i < 10; i++) app.alerts.addSubscription(s.id, 'search', `q${i}`, `Search ${i}`, clock.toISOString());
    expect(app.alerts.addSubscription(s.id, 'search', 'q10', 'One too many', clock.toISOString())).toBe('limit');
  });

  it('one-click unsubscribe from a mail app deletes the address and everything with it', async () => {
    const s = app.alerts.byEmail('investor@example.com')!;
    const oneClick = `/api/alerts/unsubscribe?t=${encodeURIComponent(app.alerts.token(s, 'unsubscribe'))}`;
    // Mail apps post a form body from their own servers: no origin check, no app header.
    const r = await fetch(base + oneClick, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://mail.example' }, body: 'List-Unsubscribe=One-Click' });
    expect(r.status).toBe(200);
    expect(app.alerts.byEmail('investor@example.com')).toBeNull();
    expect(app.alerts.subscriptions(s.id)).toHaveLength(0);
    expect((await post('/api/alerts/manage', { token: manageToken }, app1)).status).toBe(404);
    expect((await fetch(base + oneClick, { method: 'POST' })).status).toBe(200); // idempotent
  });

  it('manage page can delete everything too', async () => {
    ip = 4;
    await post('/api/alerts/signup', { email: 'second@example.com', list: true });
    const c = await (await post('/api/alerts/confirm', { token: linkIn(last(), 'confirm') })).json();
    expect((await (await post('/api/alerts/update', { token: c.manageToken, deleteAll: true }, app1)).json()).deleted).toBe(true);
    expect(app.alerts.byEmail('second@example.com')).toBeNull();
  });

  it('deletes unconfirmed sign-ups after 48 hours', async () => {
    ip = 5;
    await post('/api/alerts/signup', { email: 'late@example.com', list: true });
    const token = linkIn(last(), 'confirm');
    clock = new Date(clock.getTime() + 49 * 3_600_000);
    expect((await post('/api/alerts/confirm', { token })).status).toBe(400);
    app.maintain();
    expect(app.alerts.byEmail('late@example.com')).toBeNull();
    expect(app.alerts.counts()).toMatchObject({ pending: 0 });
  });
});
