import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { alertsConfirmEmail, broadcastEmail, maskEmail, MailError, postmarkMailer, resendMailer, type Mail } from './mailer';

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

describe('Resend mailer', () => {
  const opts = { apiKey: 're_test_123', from: 'DeedOwl <no-reply@fsf.example>', retryDelayMs: 0, minIntervalMs: 0 };

  it('sends plain text with header-safe fields and unsubscribe headers', async () => {
    const { f, calls } = fakeFetch([{ status: 200, body: { id: 'abc' } }]);
    await resendMailer({ ...opts, replyTo: 'help@fsf.example', fetch: f }).send({ ...MAIL, headers: { 'List-Unsubscribe': '<https://fsf.example/u>\r\nX: y' } });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer re_test_123');
    expect(headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      from: 'DeedOwl <no-reply@fsf.example>',
      to: ['buyer@example.com'],
      subject: 'Hello Bcc: evil@example.com',
      text: MAIL.text,
      reply_to: 'help@fsf.example',
      headers: { 'List-Unsubscribe': '<https://fsf.example/u> X: y' },
    });
  });

  it('retries a rate limit once with the same idempotency key, so a message is never sent twice', async () => {
    const { f, calls } = fakeFetch([{ status: 429, body: { name: 'rate_limit_exceeded', message: 'Too many requests' } }, { status: 200, body: { id: 'x' } }]);
    await resendMailer({ ...opts, fetch: f }).send(MAIL);
    expect(calls).toHaveLength(2);
    const key = (i: number) => (calls[i].init.headers as Record<string, string>)['Idempotency-Key'];
    expect(key(0)).toBe(key(1));
  });

  it('does not retry a used-up quota or a rejected message, and reports the reason', async () => {
    const quota = fakeFetch([{ status: 429, body: { name: 'daily_quota_exceeded', message: 'You have reached your daily email sending quota.' } }]);
    const e1 = await resendMailer({ ...opts, fetch: quota.f }).send(MAIL).catch((e) => e);
    expect(quota.calls).toHaveLength(1);
    expect(e1).toBeInstanceOf(MailError);
    expect(e1.message).toBe('Resend HTTP 429, daily_quota_exceeded: You have reached your daily email sending quota.');
    const bad = fakeFetch([{ status: 403, body: { name: 'validation_error', message: 'The fsf.example domain is not verified.' } }]);
    await expect(resendMailer({ ...opts, fetch: bad.f }).send(MAIL)).rejects.toThrow(/403, validation_error/);
    expect(bad.calls).toHaveLength(1);
  });

  it('retries network failures once, then gives up', async () => {
    const { f, calls } = fakeFetch([new Error('ECONNRESET'), new Error('ECONNRESET')]);
    await expect(resendMailer({ ...opts, fetch: f }).send(MAIL)).rejects.toThrow(/Resend request failed/);
    expect(calls).toHaveLength(2);
  });

  it('sends one request at a time, spaced out, and uses the broadcast sender for list updates', async () => {
    const times: number[] = [];
    const bodies: Record<string, unknown>[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const f = (async (_u: string, init: RequestInit) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      times.push(Date.now());
      bodies.push(JSON.parse(String(init.body)));
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return new Response('{"id":"x"}', { status: 200 });
    }) as unknown as typeof fetch;
    const m = resendMailer({ ...opts, minIntervalMs: 40, broadcastFrom: 'DeedOwl <news@updates.fsf.example>', fetch: f });
    await Promise.all([
      m.send({ to: 'a@example.com', subject: 'Update', text: 'x', stream: 'broadcast' }),
      m.send({ to: 'b@example.com', subject: 'Sign in', text: 'x' }),
      m.send({ to: 'c@example.com', subject: 'Sign in', text: 'x' }),
    ]);
    expect(maxInFlight).toBe(1);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(35);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(35);
    expect(bodies.map((b) => b.from)).toEqual(['DeedOwl <news@updates.fsf.example>', 'DeedOwl <no-reply@fsf.example>', 'DeedOwl <no-reply@fsf.example>']);
  });
});

describe('Resend mailer ordering', () => {
  it('sends email someone is waiting for ahead of bulk email already queued', async () => {
    const order: string[] = [];
    let allQueued!: () => void;
    const queued = new Promise<void>((r) => (allQueued = r));
    let signIn: Promise<void> | undefined;
    // The sign-in link is asked for while the first bulk email is being sent and the other two are already queued.
    // Queuing it from inside that request (not after a timer) keeps the test independent of how busy the machine is:
    // the old version waited 5 ms, and on a slow machine the 20 ms gap had already passed and report 2 had gone out.
    const f = (async (_u: string, init: RequestInit) => {
      const subject = JSON.parse(String(init.body)).subject;
      order.push(subject);
      if (subject === 'report 1') {
        await queued;
        signIn = m.send({ to: 'b@example.com', subject: 'sign-in link', text: 'x' });
      }
      return new Response('{"id":"x"}', { status: 200 });
    }) as unknown as typeof fetch;
    const m = resendMailer({ apiKey: 're_x', from: 'no-reply@fsf.example', minIntervalMs: 20, retryDelayMs: 0, fetch: f });
    const reports = [1, 2, 3].map((i) => m.send({ to: 'a@example.com', subject: `report ${i}`, text: 'x', bulk: true }));
    allQueued();
    await Promise.all(reports);
    // Queued while report 1 was being sent, so it exists (and has gone out) by the time report 3 is done.
    expect(signIn).toBeDefined();
    await signIn;
    expect(order).toEqual(['report 1', 'sign-in link', 'report 2', 'report 3']);
  });

  it('marks a used-up quota so callers can pause instead of failing everyone', async () => {
    const { f } = fakeFetch([{ status: 429, body: { name: 'monthly_quota_exceeded', message: 'Quota' } }]);
    const e = await resendMailer({ apiKey: 're_x', from: 'no-reply@fsf.example', minIntervalMs: 0, retryDelayMs: 0, fetch: f }).send(MAIL).catch((x) => x);
    expect(e).toBeInstanceOf(MailError);
    expect(e.quota).toBe(true);
  });
});

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

describe('postal address', () => {
  it('appears only in general-list updates, never in alert confirmations', () => {
    const links = { manage: 'https://x/m', unsubscribe: 'https://x/u', oneClick: 'https://x/o' };
    expect(broadcastEmail('a@example.com', 'Hi', 'Body', links, 'PO Box 1, Las Vegas, NV 89101').text).toContain('PO Box 1, Las Vegas, NV 89101');
    expect(alertsConfirmEmail('a@example.com', 'https://x/c').text).not.toMatch(/PO Box|undefined/);
    expect(alertsConfirmEmail('a@example.com', 'https://x/c').text).toMatch(/general DeedOwl updates/);
    expect(alertsConfirmEmail('a@example.com', 'https://x/c', '1 Main St', 'property', false).text).not.toMatch(/general DeedOwl updates/);
    expect(alertsConfirmEmail('a@example.com', 'https://x/c', '1 Main St', 'property', true).text).toMatch(/general DeedOwl updates/);
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
        state: 'NV', serviceCounties: ['Clark'], serviceCities: ['Las Vegas'], serviceZips: '89123', services: ['Short sales'], creditProfiles: [], languages: ['English'],
        headline: 'Short-sale specialist in the valley', phone: '(702) 555-0199', email: 'taylor@example.com', website: '',
        bio: 'I help buyers navigate short sales and lender approval in the Las Vegas valley.',
        attestLicensed: true, attestAccurate: true, consentVerification: true, attestAdvertising: true, attestOriginal: true,
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
