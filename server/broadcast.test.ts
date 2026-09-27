import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type AppConfig } from './app';
import { hashPassword } from './auth';
import { MailError, postmarkMailer, type Mail } from './mailer';
import { openBroadcasts } from './alerts';

const PASSWORD = 'a-long-admin-password';

async function start(overrides: Partial<AppConfig> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-bcast-'));
  const mails: Mail[] = [];
  const app = createApp({
    dbPath: join(dir, 'app.db'),
    dataDir: join(dir, 'data'),
    distDir: null,
    adminUsername: 'admin',
    adminPasswordHash: hashPassword(PASSWORD),
    directorySigningKey: null,
    feedPublicKey: null,
    baseUrl: 'https://fsf.example',
    mailer: { send: async (m) => void mails.push(m) },
    secureCookies: false,
    trustProxy: true,
    postalAddressReady: true,
    ...overrides,
  });
  const server = createServer(app.handler);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let ip = 1;
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.3.0.${ip++}`, ...headers }, body: JSON.stringify(body) });
  const login = await post('/api/admin/login', { username: 'admin', password: PASSWORD }, { 'x-fsf-request': '1' });
  const cookie = login.headers.get('set-cookie')!.split(';')[0];
  const admin = (path: string, body?: unknown) =>
    body === undefined ? fetch(base + path, { headers: { cookie } }) : post(path, body, { cookie, 'x-fsf-request': '1' });
  /** Signs an address up and confirms it; list = general updates on or off. */
  async function subscriber(email: string, list: boolean) {
    await post('/api/alerts/signup', { email, list: true });
    const m = mails[mails.length - 1].text.match(/#\/alerts\/confirm\/([A-Za-z0-9_-]+)/)![1];
    const { manageToken } = await (await post('/api/alerts/confirm', { token: m })).json();
    if (!list) await post('/api/alerts/update', { token: manageToken, list: false }, { 'x-fsf-request': '1' });
    return manageToken as string;
  }
  return { app, server, mails, post, admin, subscriber };
}

describe('general email list (running server)', () => {
  let t: Awaited<ReturnType<typeof start>>;
  beforeAll(async () => {
    t = await start();
    await t.subscriber('one@example.com', true);
    await t.subscriber('two@example.com', true);
    await t.subscriber('quiet@example.com', false); // confirmed, but general updates off
    await t.post('/api/alerts/signup', { email: 'pending@example.com', list: true }); // never confirmed
  });
  afterAll(() => new Promise<void>((r) => t.server.close(() => r())));

  const UPDATE = { subject: 'Spring tax auction list is out', body: 'The Treasurer published the list for the May auction. See it on Live tax sales.' };

  it('is admin-only', async () => {
    expect((await t.post('/api/admin/email/send', { ...UPDATE, expectedRecipients: 2 })).status).toBe(401);
    expect((await t.post('/api/admin/email/test', { ...UPDATE, to: 'me@example.com' })).status).toBe(401);
  });

  it('shows counts: only confirmed addresses with general updates on are on the list', async () => {
    const r = await (await t.admin('/api/admin/email')).json();
    expect(r.counts).toMatchObject({ active: 3, listOptIn: 2, pending: 1 });
    expect(r.postalAddressReady).toBe(true);
    expect(r.broadcasts).toEqual([]);
  });

  it('validates the message and sends a test that is clearly marked', async () => {
    expect((await t.admin('/api/admin/email/test', { subject: 'Hi', body: 'short', to: 'me@example.com' })).status).toBe(422);
    const before = t.mails.length;
    expect((await t.admin('/api/admin/email/test', { ...UPDATE, to: 'me@example.com' })).status).toBe(200);
    expect(t.mails).toHaveLength(before + 1);
    expect(t.mails[before]).toMatchObject({ to: 'me@example.com', subject: `[Test] ${UPDATE.subject}`, stream: 'broadcast' });
  });

  it('makes the admin confirm the current number of recipients', async () => {
    const r = await t.admin('/api/admin/email/send', { ...UPDATE, expectedRecipients: 5 });
    expect(r.status).toBe(409);
    expect((await r.json()).recipients).toBe(2);
  });

  it('sends once to each confirmed list member through the broadcast stream, with unsubscribe links', async () => {
    const before = t.mails.length;
    const r = await t.admin('/api/admin/email/send', { ...UPDATE, expectedRecipients: 2 });
    expect(r.status).toBe(202);
    const again = await t.admin('/api/admin/email/send', { ...UPDATE, expectedRecipients: 2 }); // a double click
    expect(again.status).toBe(409);
    expect((await again.json()).error).toMatch(/already sent this update|still sending/);
    await t.app.sendBroadcasts();
    for (let i = 0; i < 50 && (await (await t.admin('/api/admin/email')).json()).broadcasts[0].status !== 'DONE'; i++) await new Promise((res) => setTimeout(res, 20));
    const sent = t.mails.slice(before);
    expect(sent.map((m) => m.to).sort()).toEqual(['one@example.com', 'two@example.com']);
    for (const m of sent) {
      expect(m.stream).toBe('broadcast');
      expect(m.subject).toBe(UPDATE.subject);
      expect(m.text).toMatch(/^The Treasurer published the list/);
      expect(m.text).toMatch(/signed up for general updates[\s\S]*Unsubscribe from everything: https:\/\/fsf\.example\/#\/alerts\/unsubscribe\//);
      expect(m.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    }
    const history = (await (await t.admin('/api/admin/email')).json()).broadcasts;
    expect(history[0]).toMatchObject({ subject: UPDATE.subject, recipients: 2, sent: 2, failed: 0, status: 'DONE', createdBy: 'admin' });
    await t.app.sendBroadcasts();
    expect(t.mails).toHaveLength(before + 2); // nothing resent
  });

  it('exports the list as CSV with spreadsheet formulas neutralized', async () => {
    const r = await t.admin('/api/admin/email/list.csv');
    expect(r.headers.get('content-type')).toMatch(/text\/csv/);
    const csv = await r.text();
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csv).toMatch(/"one@example.com"/);
    expect(csv).not.toMatch(/quiet@example.com|pending@example.com/);
  });
});

describe('general email list safeguards', () => {
  it('refuses to send until the business name and postal address are set', async () => {
    const t = await start({ postalAddressReady: false });
    await t.subscriber('one@example.com', true);
    const r = await t.admin('/api/admin/email/send', { subject: 'Spring tax auction list is out', body: 'The Treasurer published the list for the May auction.', expectedRecipients: 1 });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toMatch(/postal address/);
    expect((await (await t.admin('/api/admin/email')).json()).postalAddressReady).toBe(false);
    await new Promise<void>((res) => t.server.close(() => res()));
  });

  it('skips people who unsubscribe or opt out while a send is queued', async () => {
    const t = await start();
    await t.subscriber('stay@example.com', true);
    const leaving = await t.subscriber('leave@example.com', true);
    const gone = await t.subscriber('gone@example.com', true);
    // Queue the send directly (the API would start sending at once), then two people leave before their turn.
    openBroadcasts(t.app.db.raw).create('Fall auction update', 'A second auction may be held this fall; watch this list.', 'admin', new Date().toISOString());
    await t.post('/api/alerts/update', { token: leaving, list: false }, { 'x-fsf-request': '1' });
    await t.post('/api/alerts/update', { token: gone, deleteAll: true }, { 'x-fsf-request': '1' });
    const before = t.mails.length;
    await t.app.sendBroadcasts();
    expect(t.mails.slice(before).map((m) => m.to)).toEqual(['stay@example.com']);
    expect((await (await t.admin('/api/admin/email')).json()).broadcasts[0]).toMatchObject({ recipients: 3, sent: 1, skipped: 2, status: 'DONE' });
    await new Promise<void>((res) => t.server.close(() => res()));
  });
});

describe('Postmark broadcast stream', () => {
  it('sends list updates on the broadcast stream and everything else on the transactional one', async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchFn = (async (_u: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ ErrorCode: 0 }), { status: 200 });
    }) as unknown as typeof fetch;
    const m = postmarkMailer({ serverToken: 't', from: 'no-reply@fsf.example', broadcastStream: 'news', fetch: fetchFn });
    await m.send({ to: 'a@example.com', subject: 'Update', text: 'x', stream: 'broadcast' });
    await m.send({ to: 'a@example.com', subject: 'Sign in', text: 'x' });
    expect(bodies.map((b) => b.MessageStream)).toEqual(['news', 'outbound']);
  });
});

describe('email-service limits for list updates', () => {
  const UPDATE = { subject: 'Spring tax auction list is out', body: 'The Treasurer published the list for the May auction. See it on Live tax sales.' };
  const until = async (ok: () => boolean) => {
    for (let i = 0; i < 100 && !ok(); i++) await new Promise((r) => setTimeout(r, 20));
  };

  it('sends at most the daily limit and leaves the rest queued for tomorrow', async () => {
    const t = await start({ broadcastDailyMax: 2 });
    for (const e of ['a@example.com', 'b@example.com', 'c@example.com']) await t.subscriber(e, true);
    const before = t.mails.length;
    expect((await t.admin('/api/admin/email/send', { ...UPDATE, expectedRecipients: 3 })).status).toBe(202);
    await until(() => t.mails.length - before >= 2);
    await new Promise((r) => setTimeout(r, 100));
    expect(t.mails.slice(before).filter((m) => m.stream === 'broadcast')).toHaveLength(2);
    const b = (await (await t.admin('/api/admin/email')).json()).broadcasts[0];
    expect(b).toMatchObject({ status: 'SENDING', sent: 2, failed: 0 });
    await new Promise<void>((r) => t.server.close(() => r()));
  });

  it('pauses when the email service says the allowance is used up, without failing anyone', async () => {
    let quotaHit = false;
    const t = await start({
      mailer: {
        send: async (m) => {
          if (m.stream === 'broadcast') {
            quotaHit = true;
            throw new MailError('Resend HTTP 429, daily_quota_exceeded', false, true);
          }
          sent.push(m);
        },
      },
    });
    const sent: Mail[] = []; // confirmation emails, from the fake mailer above
    for (const e of ['a@example.com', 'b@example.com']) {
      await t.post('/api/alerts/signup', { email: e, list: true });
      const tok = sent[sent.length - 1].text.match(/#\/alerts\/confirm\/([A-Za-z0-9_-]+)/)![1];
      await t.post('/api/alerts/confirm', { token: tok });
    }
    expect((await t.admin('/api/admin/email/send', { ...UPDATE, expectedRecipients: 2 })).status).toBe(202);
    await until(() => quotaHit);
    await new Promise((r) => setTimeout(r, 100));
    const b = (await (await t.admin('/api/admin/email')).json()).broadcasts[0];
    expect(b).toMatchObject({ status: 'SENDING', sent: 0, failed: 0 });
    await new Promise<void>((r) => t.server.close(() => r()));
  });
});
