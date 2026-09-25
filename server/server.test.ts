import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword, verifyPassword, RateLimiter } from './auth';
import type { Mail } from './mailer';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import { verifyAgentsFeed } from '../src/feed/agentsFeed';
import { approvalBlockers, validateApplication, type ApplicationInput } from '../src/lib/agentApplication';

const GOOD: ApplicationInput = {
  name: 'Taylor Q. Applicant',
  brokerage: 'Example Brokerage LLC',
  licenseNumber: 's.0123456',
  licenseType: 'Salesperson',
  serviceCities: ['Las Vegas', 'Henderson'],
  serviceZips: '89123, 89052 89014',
  specialties: ['Short sales'],
  languages: ['English', 'Spanish'],
  shortSaleExperience: '25 short sales closed',
  phone: '(702) 555-0199',
  email: 'Taylor@Example.com',
  website: 'https://example.com/taylor',
  bio: 'I help buyers navigate short sales and lender approval in the Las Vegas valley.',
  attestLicensed: true,
  attestAccurate: true,
  consentVerification: true,
};

const VERIFIED = {
  licenseStatus: 'Active',
  licenseExpires: '2027-06-30',
  nameMatches: true,
  typeMatches: true,
  brokerageMatches: true,
  identityConfirmed: true,
  identityMethod: 'Called the brokerage main line listed on NRED; office manager confirmed Taylor works there and applied.',
};

describe('application validation', () => {
  it('normalizes a good application', () => {
    const v = validateApplication(GOOD);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.profile).toMatchObject({ licenseNumber: 'S.0123456', phone: '+17025550199', email: 'taylor@example.com', serviceZips: ['89123', '89052', '89014'] });
    }
  });

  it('rejects bad or dangerous input', () => {
    const bad = validateApplication({
      ...GOOD,
      name: 'X',
      licenseNumber: 'BS.0123456', // broker-salesperson number with Salesperson type
      serviceZips: '10001',
      phone: '555-1234',
      email: 'not-an-email',
      website: 'javascript:alert(1)',
      serviceCities: ['Reno'],
      attestLicensed: false,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(Object.keys(bad.errors).sort()).toEqual(['attestLicensed', 'email', 'licenseType', 'name', 'phone', 'serviceCities', 'serviceZips', 'website'].sort());
    }
  });

  it('strips markup from free text', () => {
    const v = validateApplication({ ...GOOD, bio: 'Great agent <img src=x onerror=alert(1)> who helps buyers with short sales.' });
    expect(v.ok && v.profile.bio).not.toMatch(/[<>]/);
  });

  it('requires every verification step before approval', () => {
    expect(approvalBlockers(VERIFIED as never, '2026-09-25')).toEqual([]);
    expect(approvalBlockers({ ...VERIFIED, licenseStatus: 'Expired' } as never, '2026-09-25')).toHaveLength(1);
    expect(approvalBlockers({ ...VERIFIED, identityConfirmed: false, identityMethod: 'ok' } as never, '2026-09-25')).toHaveLength(2);
    expect(approvalBlockers({ ...VERIFIED, licenseExpires: '2026-01-01' } as never, '2026-09-25')).toHaveLength(1);
  });
});

describe('admin password and throttling', () => {
  it('hashes with scrypt and verifies in constant time', () => {
    const h = hashPassword('correct horse battery');
    expect(h).toMatch(/^scrypt\$/);
    expect(verifyPassword('correct horse battery', h)).toBe(true);
    expect(verifyPassword('wrong password here', h)).toBe(false);
    expect(() => hashPassword('short')).toThrow(/12 characters/);
  });

  it('rate limiter blocks after the limit', () => {
    const r = new RateLimiter(2, 1000);
    expect([r.hit('a', 0), r.hit('a', 1), r.hit('a', 2)]).toEqual([true, true, false]);
    expect(r.hit('a', 5000)).toBe(true);
  });
});

describe('signup and approval flow (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-'));
  const keys = generateSigningKeys();
  const mails: Mail[] = [];
  const PASSWORD = 'a-long-admin-password';
  let server: Server;
  let base = '';
  let cookie = '';

  beforeAll(async () => {
    const app = createApp({
      dbPath: join(dir, 'app.db'),
      dataDir: join(dir, 'data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword(PASSWORD),
      signingKey: loadPrivateKey(keys.privatePem),
      baseUrl: 'https://fsf.example',
      mailer: { send: async (m) => void mails.push(m) },
      secureCookies: false,
    });
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const admin = (path: string, body?: unknown) =>
    body === undefined
      ? fetch(base + path, { headers: { cookie } })
      : post(path, body, { cookie, 'x-fsf-admin': '1' });

  let appId = '';

  it('accepts an application and emails a confirmation link', async () => {
    const r = await post('/api/agent-applications', GOOD);
    expect(r.status).toBe(202);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe('taylor@example.com');
    expect(mails[0].text).toMatch(/https:\/\/fsf\.example\/#\/agents\/confirm\/[A-Za-z0-9_-]{43}/);
  });

  it('silently drops honeypot submissions and rejects invalid ones', async () => {
    expect((await post('/api/agent-applications', { ...GOOD, company_url: 'http://spam' })).status).toBe(202);
    expect(mails).toHaveLength(1); // nothing stored, nothing sent
    const bad = await post('/api/agent-applications', { ...GOOD, licenseNumber: 'nope' });
    expect(bad.status).toBe(422);
    expect((await bad.json()).errors.licenseNumber).toBeTruthy();
    expect((await post('/api/agent-applications', GOOD, { origin: 'https://evil.example' })).status).toBe(403);
  });

  it('rejects bad admin logins and non-admin access', async () => {
    expect((await fetch(base + '/api/admin/applications')).status).toBe(401);
    expect((await post('/api/admin/login', { username: 'admin', password: 'wrong' }, { 'x-fsf-admin': '1' })).status).toBe(401);
    expect((await post('/api/admin/login', { username: 'admin', password: PASSWORD })).status).toBe(403); // missing header
  });

  it('signs in and lists the application, which cannot be approved before email confirmation', async () => {
    const r = await post('/api/admin/login', { username: 'admin', password: PASSWORD }, { 'x-fsf-admin': '1' });
    expect(r.status).toBe(200);
    const setCookie = r.headers.get('set-cookie')!;
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    cookie = setCookie.split(';')[0];
    const list = await (await admin('/api/admin/applications')).json();
    expect(list.applications).toHaveLength(1);
    appId = list.applications[0].id;
    expect(list.applications[0].status).toBe('EMAIL_UNCONFIRMED');
    expect((await admin(`/api/admin/applications/${appId}/approve`, { verification: VERIFIED })).status).toBe(409);
  });

  it('refuses admin writes without the admin header (CSRF defense)', async () => {
    const r = await post(`/api/admin/applications/${appId}/reject`, { reason: 'test reason' }, { cookie });
    expect(r.status).toBe(403);
  });

  it('confirms email with the token (single use)', async () => {
    const token = mails[0].text.match(/confirm\/([A-Za-z0-9_-]+)/)![1];
    expect((await post('/api/agent-applications/confirm', { token })).status).toBe(200);
    expect((await post('/api/agent-applications/confirm', { token })).status).toBe(400);
  });

  it('blocks approval until every check is done, then publishes a signed directory', async () => {
    const incomplete = await admin(`/api/admin/applications/${appId}/approve`, { verification: { ...VERIFIED, identityConfirmed: false } });
    expect(incomplete.status).toBe(422);
    expect((await incomplete.json()).blockers[0]).toMatch(/applicant is the licensee/);
    expect(existsSync(join(dir, 'data', 'agents.json'))).toBe(false);

    const ok = await admin(`/api/admin/applications/${appId}/approve`, { verification: VERIFIED });
    expect(ok.status).toBe(200);
    const data = readFileSync(join(dir, 'data', 'agents.json'));
    const sig = readFileSync(join(dir, 'data', 'agents.json.sig'), 'utf8');
    const res = await verifyAgentsFeed(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, sig, keys.publicSpkiB64, new Date(), webcrypto.subtle as unknown as SubtleCrypto);
    expect(res.ok && res.feed.agents.map((a) => [a.name, a.phone, a.licenseVerifiedBy])).toEqual([['Taylor Q. Applicant', '+17025550199', 'Forced-Sale Finder staff']]);
    // Admin identity is never published.
    expect(data.toString()).not.toMatch(/"admin"/);
  });

  it('flags a second application reusing the same license (possible impersonation) and refuses to list it', async () => {
    await post('/api/agent-applications', { ...GOOD, email: 'impostor@example.net', phone: '702-555-0142' });
    const token = mails.at(-1)!.text.match(/confirm\/([A-Za-z0-9_-]+)/)![1];
    await post('/api/agent-applications/confirm', { token });
    const list = (await (await admin('/api/admin/applications')).json()).applications;
    const impostor = list.find((a: { profile: { email: string } }) => a.profile.email === 'impostor@example.net');
    expect(impostor.duplicates).toEqual([{ id: appId, status: 'APPROVED', field: 'license' }]);
    expect((await admin(`/api/admin/applications/${impostor.id}/approve`, { verification: VERIFIED })).status).toBe(409);
    expect((await admin(`/api/admin/applications/${impostor.id}/reject`, { reason: 'License belongs to another agent' })).status).toBe(200);
  });

  it('suspending an agent removes them from the published directory; audit trail records everything', async () => {
    expect((await admin(`/api/admin/applications/${appId}/suspend`, { reason: 'Brokerage reported they left' })).status).toBe(200);
    expect(JSON.parse(readFileSync(join(dir, 'data', 'agents.json'), 'utf8')).agents).toEqual([]);
    const detail = await (await admin(`/api/admin/applications/${appId}`)).json();
    expect(detail.audit.map((e: { action: string }) => e.action)).toEqual(['SUBMITTED', 'EMAIL_CONFIRMED', 'APPROVED', 'SUSPENDED']);
  });

  it('rejects oversized or malformed requests and path traversal', async () => {
    expect((await post('/api/agent-applications', { bio: 'x'.repeat(40_000) })).status).toBe(413);
    const notJson = await fetch(base + '/api/agent-applications/confirm', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hi' });
    expect(notJson.status).toBe(415);
    // 6th application from one network within the hour is refused.
    expect((await post('/api/agent-applications', GOOD)).status).toBe(429);
    expect((await fetch(base + '/data/..%2f..%2fapp.db')).status).toBe(404);
    expect((await admin('/api/admin/applications/../../etc')).status).toBe(404);
  });

  it('signs out', async () => {
    expect((await admin('/api/admin/logout', {})).status).toBe(200);
    expect((await admin('/api/admin/applications')).status).toBe(401);
  });
});
