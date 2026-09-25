import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword, verifyPassword, RateLimiter } from './auth';
import type { Mail } from './mailer';
import { leadsToCsv, monthRange, pacificDaysToUtc } from './metrics';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import { verifyProsFeed } from '../src/feed/prosFeed';
import { approvalBlockers, validateApplication, validateBilling, type ApplicationInput } from '../src/lib/proApplication';

const AGENT: ApplicationInput = {
  category: 'agent',
  name: 'Taylor Q. Applicant',
  company: 'Example Brokerage LLC',
  licenseId: 's.0123456',
  serviceCities: ['Las Vegas', 'Henderson'],
  serviceZips: '89123, 89052 89014',
  services: ['Short sales'],
  creditProfiles: [],
  languages: ['English', 'Spanish'],
  headline: 'Short-sale specialist in the valley',
  phone: '(702) 555-0199',
  email: 'Taylor@Example.com',
  website: 'https://example.com/taylor',
  bio: 'I help buyers navigate short sales and lender approval in the Las Vegas valley.',
  attestLicensed: true,
  attestAccurate: true,
  consentVerification: true,
  attestAdvertising: true,
};

const LENDER: ApplicationInput = {
  ...AGENT,
  category: 'private_lender',
  name: 'Example Bridge Capital',
  company: 'Example Bridge Capital, LLC',
  licenseId: '1234567',
  services: ['Hard money', 'Fix & flip / bridge'],
  creditProfiles: ['Fair (620–679)', 'Rebuilding (below 620)'],
  email: 'loans@example.com',
  phone: '702-555-0142',
  headline: 'Fix-and-flip loans for auction buyers',
};

const VERIFIED = {
  licenseStatus: 'Active',
  licenseExpires: '2027-06-30',
  nameMatches: true,
  typeMatches: true,
  companyMatches: true,
  identityConfirmed: true,
  identityMethod: 'Called the company main line listed with the regulator; office manager confirmed.',
};
const PAID = { plan: 'Monthly listing', paidThrough: '2099-12-31' };

describe('application validation', () => {
  it('normalizes a good application for each kind of business', () => {
    const a = validateApplication(AGENT);
    expect(a.ok && a.profile).toMatchObject({ licenseId: 'S.0123456', licenseType: 'Salesperson', phone: '+17025550199', email: 'taylor@example.com', serviceZips: ['89123', '89052', '89014'] });
    const l = validateApplication(LENDER);
    expect(l.ok && l.profile).toMatchObject({ category: 'private_lender', licenseType: null, creditProfiles: ['Fair (620–679)', 'Rebuilding (below 620)'] });
  });

  it('rejects bad or dangerous input, with category-specific rules', () => {
    const bad = validateApplication({ ...AGENT, name: 'X', licenseId: '12345', serviceZips: '10001', phone: '555-1234', email: 'nope', website: 'javascript:alert(1)', serviceCities: ['Reno'], services: ['Hard money'], creditProfiles: ['Good (680–739)'], attestAdvertising: false });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(Object.keys(bad.errors).sort()).toEqual(['attestAdvertising', 'creditProfiles', 'email', 'licenseId', 'name', 'phone', 'serviceCities', 'serviceZips', 'services', 'website'].sort());
    }
    expect(validateApplication({ ...LENDER, creditProfiles: [] }).ok).toBe(false); // lenders must list credit situations
    expect(validateApplication({ ...AGENT, category: 'astrologer' }).ok).toBe(false);
  });

  it('strips markup from free text', () => {
    const v = validateApplication({ ...AGENT, bio: 'Great agent <img src=x onerror=alert(1)> who helps buyers with short sales.' });
    expect(v.ok && v.profile.bio).not.toMatch(/[<>]/);
  });

  it('requires every verification step, with expiry only where licenses expire', () => {
    expect(approvalBlockers('agent', VERIFIED as never, '2026-09-25')).toEqual([]);
    expect(approvalBlockers('agent', { ...VERIFIED, licenseExpires: null } as never, '2026-09-25')).toHaveLength(1);
    expect(approvalBlockers('bank', { ...VERIFIED, licenseExpires: null } as never, '2026-09-25')).toEqual([]);
    expect(approvalBlockers('agent', { ...VERIFIED, identityConfirmed: false, identityMethod: 'ok' } as never, '2026-09-25')).toHaveLength(2);
  });

  it('validates billing', () => {
    expect(validateBilling(PAID)).toEqual(PAID);
    expect(validateBilling({ plan: 'x', paidThrough: 'soon' })).toBeNull();
  });
});

describe('admin password, throttling and CSV safety', () => {
  it('hashes with scrypt and verifies', () => {
    const h = hashPassword('correct horse battery');
    expect(verifyPassword('correct horse battery', h)).toBe(true);
    expect(verifyPassword('wrong password here', h)).toBe(false);
    expect(() => hashPassword('short')).toThrow(/12 characters/);
  });

  it('rate limiter blocks after the limit', () => {
    const r = new RateLimiter(2, 1000);
    expect([r.hit('a', 0), r.hit('a', 1), r.hit('a', 2)]).toEqual([true, true, false]);
    expect(r.hit('a', 5000)).toBe(true);
  });

  it('neutralizes spreadsheet formulas in lead exports', () => {
    const csv = leadsToCsv([{ id: '1', proId: 'p', createdAt: '2026-09-01', name: '=HYPERLINK("http://evil")', email: 'a@b.co', phone: null, message: 'hi "there"', interest: null }]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(monthRange('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    // Las Vegas calendar days map to UTC boundaries (an evening lead belongs to that Pacific day).
    expect(pacificDaysToUtc('2026-09-24', '2026-09-24')).toEqual({ start: '2026-09-24T07:00:00.000Z', end: '2026-09-25T07:00:00.000Z' });
    expect(pacificDaysToUtc('2026-12-31', '2026-12-31').end).toBe('2027-01-01T08:00:00.000Z');
  });
});

describe('advertiser flow (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-'));
  const keys = generateSigningKeys();
  const mails: Mail[] = [];
  const PASSWORD = 'a-long-admin-password';
  let server: Server;
  let base = '';
  let cookie = '';
  let proCookie = '';

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
      trustProxy: true, // lets tests simulate different client networks via X-Forwarded-For
    });
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  const UA = { 'user-agent': 'Mozilla/5.0 (test browser)' };
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...UA, ...headers }, body: JSON.stringify(body) });
  const admin = (path: string, body?: unknown) =>
    body === undefined ? fetch(base + path, { headers: { cookie } }) : post(path, body, { cookie, 'x-fsf-request': '1' });
  const tokenFrom = (m: Mail, kind: string) => m.text.match(new RegExp(`${kind}/([A-Za-z0-9_-]+)`))![1];
  const readFeed = async () => {
    const data = readFileSync(join(dir, 'data', 'pros.json'));
    const sig = readFileSync(join(dir, 'data', 'pros.json.sig'), 'utf8');
    return verifyProsFeed(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer, sig, keys.publicSpkiB64, new Date(), webcrypto.subtle as unknown as SubtleCrypto);
  };

  let agentId = '';
  let lenderId = '';

  it('accepts applications and emails confirmation links', async () => {
    expect((await post('/api/applications', AGENT)).status).toBe(202);
    expect((await post('/api/applications', LENDER)).status).toBe(202);
    expect(mails.map((m) => m.to)).toEqual(['taylor@example.com', 'loans@example.com']);
    expect(mails[1].text).toMatch(/NMLS/);
    expect(mails[0].text).toMatch(/https:\/\/fsf\.example\/#\/advertise\/confirm\/[A-Za-z0-9_-]{43}/);
  });

  it('drops honeypot submissions, rejects invalid and cross-origin ones', async () => {
    expect((await post('/api/applications', { ...AGENT, company_url: 'http://spam' })).status).toBe(202);
    expect(mails).toHaveLength(2);
    const bad = await post('/api/applications', { ...AGENT, licenseId: 'nope' });
    expect(bad.status).toBe(422);
    expect((await bad.json()).errors.licenseId).toMatch(/Nevada real estate license/);
    expect((await post('/api/applications', AGENT, { origin: 'https://evil.example' })).status).toBe(403);
  });

  it('admin sign-in is protected', async () => {
    expect((await fetch(base + '/api/admin/applications')).status).toBe(401);
    expect((await post('/api/admin/login', { username: 'admin', password: 'wrong' }, { 'x-fsf-request': '1' })).status).toBe(401);
    expect((await post('/api/admin/login', { username: 'admin', password: PASSWORD })).status).toBe(403);
    const r = await post('/api/admin/login', { username: 'admin', password: PASSWORD }, { 'x-fsf-request': '1' });
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')).toMatch(/HttpOnly.*SameSite=Strict/);
    cookie = r.headers.get('set-cookie')!.split(';')[0];
    const list = (await (await admin('/api/admin/applications')).json()).applications;
    agentId = list.find((a: { profile: { category: string } }) => a.profile.category === 'agent').id;
    lenderId = list.find((a: { profile: { category: string } }) => a.profile.category === 'private_lender').id;
    expect((await admin(`/api/admin/applications/${agentId}/approve`, { verification: VERIFIED })).status).toBe(409); // email unconfirmed
    expect((await post(`/api/admin/applications/${agentId}/reject`, { reason: 'x reason' }, { cookie })).status).toBe(403); // CSRF header missing
  });

  it('confirms emails (single use)', async () => {
    for (const m of mails.slice(0, 2)) {
      const token = tokenFrom(m, 'confirm');
      expect((await post('/api/applications/confirm', { token })).status).toBe(200);
      expect((await post('/api/applications/confirm', { token })).status).toBe(400);
    }
  });

  it('lists a professional only when verified AND paid', async () => {
    const incomplete = await admin(`/api/admin/applications/${agentId}/approve`, { verification: { ...VERIFIED, identityConfirmed: false } });
    expect(incomplete.status).toBe(422);
    expect((await admin(`/api/admin/applications/${agentId}/approve`, { verification: VERIFIED })).status).toBe(200);
    let feed = await readFeed();
    expect(feed.ok && feed.feed.pros).toEqual([]); // approved but not paid
    expect((await admin(`/api/admin/applications/${agentId}/billing`, { billing: PAID })).status).toBe(200);
    expect((await admin(`/api/admin/applications/${lenderId}/approve`, { verification: VERIFIED })).status).toBe(200);
    expect((await admin(`/api/admin/applications/${lenderId}/billing`, { billing: PAID })).status).toBe(200);
    feed = await readFeed();
    expect(feed.ok && feed.feed.pros.map((p) => [p.category, p.name, p.licenseVerifiedBy]).sort()).toEqual([
      ['agent', 'Taylor Q. Applicant', 'Forced-Sale Finder staff'],
      ['private_lender', 'Example Bridge Capital', 'Forced-Sale Finder staff'],
    ]);
    expect(readFileSync(join(dir, 'data', 'pros.json'), 'utf8')).not.toMatch(/"admin"/);
  });

  it('counts views and contact clicks privately: unique visitors, bots ignored, unlisted ids ignored', async () => {
    const ev = (body: unknown, headers: Record<string, string> = {}) => post('/api/events', body, headers);
    expect((await ev({ kind: 'impression', proIds: [agentId, lenderId, 'f'.repeat(24)] })).status).toBe(204);
    await ev({ kind: 'profile_view', proId: agentId });
    await ev({ kind: 'profile_view', proId: agentId }); // same visitor, same day
    await ev({ kind: 'profile_view', proId: agentId }, { 'user-agent': 'Other Browser 2.0' }); // same network, new browser string: not a new visitor
    await ev({ kind: 'profile_view', proId: agentId }, { 'x-forwarded-for': '198.51.100.2' }); // different network: new visitor
    await ev({ kind: 'phone_click', proId: agentId });
    await ev({ kind: 'profile_view', proId: agentId }, { 'user-agent': 'Googlebot/2.1' }); // bot
    expect((await ev({ kind: 'lead', proId: agentId })).status).toBe(400); // leads only via the form
    const m = await (await admin(`/api/admin/applications/${agentId}/metrics`)).json();
    expect(m.totals.impression.total).toBe(1);
    expect(m.totals.profile_view).toEqual({ total: 4, uniques: 2 });
    expect(m.totals.phone_click.uniques).toBe(1);
    expect(m.contactRate).toBe(0.5);
  });

  it('sends a lead to the professional (with consent) and a receipt to the consumer', async () => {
    const missing = await post(`/api/pros/${agentId}/leads`, { name: 'Buyer', email: 'buyer@example.org', message: 'Interested in short sales', consent: false });
    expect(missing.status).toBe(422);
    const r = await post(`/api/pros/${agentId}/leads`, { name: 'Bea Buyer', email: 'Bea@Example.org', phone: '702 555 0123', message: 'I am looking for short sales in 89123.', interest: 'Short sales', consent: true, acknowledge: true });
    expect(r.status).toBe(202);
    const [toPro, receipt] = mails.slice(-2);
    expect(toPro.to).toBe('taylor@example.com');
    expect(toPro.text).toMatch(/Bea Buyer[\s\S]*bea@example.org[\s\S]*\+17025550123/);
    expect(receipt.to).toBe('bea@example.org');
    expect(receipt.text).toMatch(/verify their license/);
    expect((await post(`/api/pros/${'a'.repeat(24)}/leads`, { name: 'x' })).status).toBe(404); // not listed
  });

  it('advertiser signs in with a one-time emailed link and sees their own results and leads', async () => {
    const generic = await (await post('/api/pro/login', { email: 'nobody@example.com' })).json();
    const before = mails.length;
    const ok = await (await post('/api/pro/login', { email: 'TAYLOR@example.com' })).json();
    expect(ok.message).toBe(generic.message); // no account enumeration
    expect(mails.length).toBe(before + 1);
    const token = tokenFrom(mails.at(-1)!, 'login');
    expect((await post('/api/pro/session', { token })).status).toBe(403); // header required
    const s = await post('/api/pro/session', { token }, { 'x-fsf-request': '1' });
    expect(s.status).toBe(200);
    proCookie = s.headers.get('set-cookie')!.split(';')[0];
    expect((await post('/api/pro/session', { token }, { 'x-fsf-request': '1' })).status).toBe(400); // single use
    const me = await (await fetch(base + '/api/pro/me', { headers: { cookie: proCookie } })).json();
    expect(me).toMatchObject({ id: agentId, listed: true });
    const metrics = await (await fetch(base + '/api/pro/metrics', { headers: { cookie: proCookie } })).json();
    expect(metrics.totals.lead.total).toBe(1);
    expect(metrics.daily.length).toBe(30);
    const leads = await (await fetch(base + '/api/pro/leads', { headers: { cookie: proCookie } })).json();
    expect(leads.leads.map((l: { name: string }) => l.name)).toEqual(['Bea Buyer']);
    const csv = await fetch(base + '/api/pro/leads.csv', { headers: { cookie: proCookie } });
    expect(csv.headers.get('content-type')).toMatch(/text\/csv/);
    expect(await csv.text()).toMatch(/Bea Buyer/);
    // The admin cookie doesn't work for advertiser endpoints and vice versa.
    expect((await fetch(base + '/api/pro/me', { headers: { cookie } })).status).toBe(401);
    expect((await fetch(base + '/api/admin/applications', { headers: { cookie: proCookie } })).status).toBe(401);
  });

  it('sends monthly reports once per month', async () => {
    const month = new Date().toISOString().slice(0, 7);
    const r1 = await (await admin('/api/admin/reports', { month })).json();
    const r2 = await (await admin('/api/admin/reports', { month })).json();
    expect([r1.sent, r2.sent]).toEqual([2, 0]);
    expect(mails.find((m) => m.subject.includes('report') && m.to === 'taylor@example.com')!.text).toMatch(/Profile views \(unique visitors\):\s+2/);
  });

  it('flags a second application reusing a license and refuses to list it', async () => {
    await post('/api/applications', { ...AGENT, email: 'impostor@example.net', phone: '702-555-0144' });
    await post('/api/applications/confirm', { token: tokenFrom(mails.at(-1)!, 'confirm') });
    const impostor = (await (await admin('/api/admin/applications')).json()).applications.find((a: { profile: { email: string } }) => a.profile.email === 'impostor@example.net');
    expect(impostor.duplicates).toEqual([{ id: agentId, status: 'APPROVED', field: 'license' }]);
    expect((await admin(`/api/admin/applications/${impostor.id}/approve`, { verification: VERIFIED })).status).toBe(409);
  });

  it('suspending removes the listing; audit trail records everything', async () => {
    expect((await admin(`/api/admin/applications/${agentId}/suspend`, { reason: 'Brokerage reported they left' })).status).toBe(200);
    const feed = await readFeed();
    expect(feed.ok && feed.feed.pros.map((p) => p.category)).toEqual(['private_lender']);
    const detail = await (await admin(`/api/admin/applications/${agentId}`)).json();
    expect(detail.audit.map((e: { action: string }) => e.action)).toEqual(['SUBMITTED', 'EMAIL_CONFIRMED', 'APPROVED', 'BILLING', 'ADVERTISER_LOGIN', 'LEADS_EXPORTED', 'SUSPENDED']);
    expect((await post(`/api/pros/${agentId}/leads`, { name: 'x' })).status).toBe(404); // no longer listed
    // A suspended advertiser is signed out everywhere and can't use an old sign-in link.
    expect((await fetch(base + '/api/pro/me', { headers: { cookie: proCookie } })).status).toBe(401);
    await post('/api/pro/login', { email: 'taylor@example.com' });
    expect(mails.filter((m) => m.subject.includes('sign-in link')).length).toBe(1); // no new link for a suspended account
  });

  it('rejects oversized, malformed and traversal requests; rate limits applications', async () => {
    expect((await post('/api/applications/confirm', { token: 'x'.repeat(40_000) })).status).toBe(413);
    expect((await fetch(base + '/api/applications/confirm', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hi' })).status).toBe(415);
    expect((await fetch(base + '/data/..%2f..%2fapp.db')).status).toBe(404);
    expect((await admin('/api/admin/applications/../../etc')).status).toBe(404);
    expect((await post('/api/applications', AGENT)).status).toBe(429); // 6th from this network within the hour
    expect(existsSync(join(dir, 'app.db'))).toBe(true);
  });

  it('refuses malformed Origin and cookie headers cleanly, and forged forwarding addresses', async () => {
    expect((await post('/api/applications', AGENT, { origin: 'null' })).status).toBe(403);
    expect((await fetch(base + '/api/admin/me', { headers: { cookie: 'fsf_admin=%E0' } })).status).toBe(401);
    // The client can prepend anything to X-Forwarded-For; only the last (proxy-added) entry counts.
    const tries = [];
    for (let i = 0; i < 7; i++) {
      tries.push((await post('/api/admin/login', { username: `guess${i}`, password: 'wrong' }, { 'x-fsf-request': '1', 'x-forwarded-for': `10.9.9.${i}, 203.0.113.50` })).status);
    }
    expect(tries.at(-1)).toBe(429);
  });

  it("failed logins for the admin's username can't lock the admin out of a network they've used", async () => {
    // Our earlier successful login came from 127.0.0.1. Flood failures for 'admin' from many addresses...
    for (let i = 0; i < 12; i++) await post('/api/admin/login', { username: 'admin', password: 'wrong' }, { 'x-fsf-request': '1', 'x-forwarded-for': `203.0.113.${100 + i}` });
    // ...a new network is locked out for a while, but the admin's usual network still gets in.
    expect((await post('/api/admin/login', { username: 'admin', password: PASSWORD }, { 'x-fsf-request': '1', 'x-forwarded-for': '198.51.100.99' })).status).toBe(429);
    const r = await post('/api/admin/login', { username: 'admin', password: PASSWORD }, { 'x-fsf-request': '1' });
    expect(r.status).toBe(200);
    cookie = r.headers.get('set-cookie')!.split(';')[0];
  });

  it('signs out', async () => {
    expect((await admin('/api/admin/logout', {})).status).toBe(200);
    expect((await admin('/api/admin/applications')).status).toBe(401);
  });
});
