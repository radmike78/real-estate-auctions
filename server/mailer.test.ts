import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { maskEmail, MailError, postmarkMailer, type Mail } from './mailer';

const MAIL: Mail = { to: 'buyer@example.com', subject: 'Hello\r\nBcc: evil@example.com', text: 'Sign in: https://fsf.example/#/advertiser/login/abc' };

function fakeFetch(responses: Array<{ status: number; body?: unknown } | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses.shift()!;
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { f, calls };
}

describe('Postmark mailer', () => {
  it('sends a plain-text email with tracking off and header-safe fields', async () => {
    const { f, calls } = fakeFetch([{ status: 200, body: { ErrorCode: 0, Message: 'OK' } }]);
    await postmarkMailer({ serverToken: 'tok-123', from: 'DeedOwl <no-reply@fsf.example>', replyTo: 'help@fsf.example', fetch: f }).send(MAIL);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.postmarkapp.com/email');
    expect((calls[0].init.headers as Record<string, string>)['X-Postmark-Server-Token']).toBe('tok-123');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body).toEqual({
      From: 'DeedOwl <no-reply@fsf.example>',
      To: 'buyer@example.com',
      Subject: 'Hello Bcc: evil@example.com',
      TextBody: MAIL.text,
      ReplyTo: 'help@fsf.example',
      MessageStream: 'outbound',
      TrackOpens: false,
      TrackLinks: 'None',
    });
  });

  it('passes one-click unsubscribe headers to Postmark, with line breaks removed', async () => {
    const { f, calls } = fakeFetch([{ status: 200, body: { ErrorCode: 0 } }]);
    await postmarkMailer({ serverToken: 't', from: 'no-reply@fsf.example', fetch: f }).send({
      ...MAIL,
      headers: { 'List-Unsubscribe': '<https://fsf.example/api/alerts/unsubscribe?t=x>\r\nBcc: evil@example.com', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
    expect(JSON.parse(String(calls[0].init.body)).Headers).toEqual([
      { Name: 'List-Unsubscribe', Value: '<https://fsf.example/api/alerts/unsubscribe?t=x> Bcc: evil@example.com' },
      { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
    ]);
  });

  it('retries once on server errors, rate limits and network failures', async () => {
    for (const first of [{ status: 500 }, { status: 429 }, new Error('socket hang up')]) {
      const { f, calls } = fakeFetch([first, { status: 200, body: { ErrorCode: 0 } }]);
      await postmarkMailer({ serverToken: 't', from: 'a@b.co', fetch: f, retryDelayMs: 0 }).send(MAIL);
      expect(calls).toHaveLength(2);
    }
    const { f, calls } = fakeFetch([{ status: 503 }, { status: 503 }]);
    await expect(postmarkMailer({ serverToken: 't', from: 'a@b.co', fetch: f, retryDelayMs: 0 }).send(MAIL)).rejects.toThrow(/HTTP 503/);
    expect(calls).toHaveLength(2);
  });

  it('does not retry rejected messages, and reports Postmark’s reason', async () => {
    const { f, calls } = fakeFetch([{ status: 422, body: { ErrorCode: 406, Message: 'You tried to send to recipient(s) that have been marked as inactive.' } }]);
    const err = await postmarkMailer({ serverToken: 't', from: 'a@b.co', fetch: f, retryDelayMs: 0 }).send(MAIL).catch((e) => e);
    expect(err).toBeInstanceOf(MailError);
    expect(err.message).toMatch(/HTTP 422, error 406: You tried to send/);
    expect(calls).toHaveLength(1);
  });

  it('masks addresses for logs', () => {
    expect(maskEmail('taylor@example.com')).toBe('ta***@example.com');
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });
});

describe('when email cannot be sent', () => {
  it('tells an applicant to try again instead of failing silently, and never crashes', async () => {
    const app = createApp({
      dbPath: join(mkdtempSync(join(tmpdir(), 'fsf-mail-')), 'app.db'),
      dataDir: join(tmpdir(), 'fsf-mail-data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('a-long-admin-password'),
      directorySigningKey: null,
      feedPublicKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async () => { throw new MailError('Postmark HTTP 500', true); } },
      secureCookies: false,
      trustProxy: false,
    });
    const server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const post = (path: string, body: unknown) =>
      fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (test)' }, body: JSON.stringify(body) });
    try {
      const r = await post('/api/applications', {
        category: 'agent', name: 'Taylor Q. Applicant', company: 'Example Brokerage LLC', licenseId: 's.0123456',
        serviceCities: ['Las Vegas'], serviceZips: '89123', services: ['Short sales'], creditProfiles: [], languages: ['English'],
        headline: 'Short-sale specialist in the valley', phone: '(702) 555-0199', email: 'taylor@example.com', website: '',
        bio: 'I help buyers navigate short sales and lender approval in the Las Vegas valley.',
        attestLicensed: true, attestAccurate: true, consentVerification: true, attestAdvertising: true,
      });
      expect(r.status).toBe(503);
      expect((await r.json()).error).toMatch(/couldn't send your confirmation email/);
      // Sign-in requests stay generic whether or not the email went out.
      expect((await post('/api/pro/login', { email: 'nobody@example.com' })).status).toBe(200);
      expect((await fetch(base + '/healthz')).status).toBe(200);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
