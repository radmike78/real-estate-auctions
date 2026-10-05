import { describe, expect, it } from 'vitest';
import { isCloudflare, visitorIp } from './cloudflare';

describe('Cloudflare visitor addresses', () => {
  it('recognizes Cloudflare ranges, including IPv4-mapped IPv6', () => {
    expect(isCloudflare('173.245.48.1')).toBe(true);
    expect(isCloudflare('104.16.0.1')).toBe(true);
    expect(isCloudflare('::ffff:162.158.1.1')).toBe(true);
    expect(isCloudflare('2606:4700::1')).toBe(true);
    expect(isCloudflare('8.8.8.8')).toBe(false);
    expect(isCloudflare('2001:db8::1')).toBe(false);
    expect(isCloudflare('not-an-ip')).toBe(false);
  });

  it('uses CF-Connecting-IP only when the request came from Cloudflare', () => {
    expect(visitorIp('162.158.10.20', '203.0.113.7')).toBe('203.0.113.7');
    expect(visitorIp('2606:4700::5', '2001:db8::9')).toBe('2001:db8::9');
    // Someone connecting directly can't pick their own address.
    expect(visitorIp('198.51.100.4', '203.0.113.7')).toBe('198.51.100.4');
    // A garbage header from Cloudflare falls back to the Cloudflare address.
    expect(visitorIp('162.158.10.20', 'nonsense, 1.2.3.4')).toBe('162.158.10.20');
    expect(visitorIp('162.158.10.20', undefined)).toBe('162.158.10.20');
  });
});

describe('rate limits behind Cloudflare (running server)', () => {
  it('limits each visitor separately, not every Cloudflare visitor together', async () => {
    const { mkdtempSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { createServer } = await import('node:http');
    const { createApp } = await import('./app');
    const { hashPassword } = await import('./auth');
    const app = createApp({
      dbPath: join(mkdtempSync(join(tmpdir(), 'fsf-cf-')), 'app.db'),
      dataDir: join(tmpdir(), 'fsf-cf-data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('a-long-admin-password'),
      directorySigningKey: null,
      feedPublicKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async () => {} },
      trustProxy: true,
      trustCloudflare: true,
    });
    const server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    let n = 0;
    // Our proxy saw a Cloudflare server (last X-Forwarded-For entry); Cloudflare names the visitor.
    const apply = (visitor: string, peer = '162.158.10.20') =>
      fetch(base + '/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (test)', 'x-forwarded-for': `${visitor}, ${peer}`, 'cf-connecting-ip': visitor },
        body: JSON.stringify({
          category: 'agent', name: 'Taylor Q. Applicant', company: 'Example Brokerage LLC', licenseId: 's.0123456',
          state: 'NV', serviceCounties: ['Clark'], serviceCities: ['Las Vegas'], serviceZips: '89123', services: ['Short sales'], creditProfiles: [], languages: ['English'],
          headline: 'Short-sale specialist in the valley', phone: '(702) 555-0199', email: `agent${n++}@example.com`, website: '',
          bio: 'I help buyers navigate short sales and lender approval in the Las Vegas valley.',
          attestLicensed: true, attestAccurate: true, consentVerification: true, attestAdvertising: true, attestOriginal: true,
        }),
      }).then((r) => r.status);
    try {
      const first: number[] = [];
      for (let i = 0; i < 6; i++) first.push(await apply('203.0.113.7'));
      expect(first.slice(0, 5)).toEqual([202, 202, 202, 202, 202]);
      expect(first[5]).toBe(429); // the same visitor hits the limit...
      expect(await apply('198.51.100.9')).toBe(202); // ...but a different visitor through Cloudflare does not
      // A direct (non-Cloudflare) connection can't dodge the limit by forging the header.
      const forged: number[] = [];
      for (let i = 0; i < 6; i++) forged.push(await apply(`192.0.2.${i + 1}`, '198.51.100.200'));
      expect(forged[5]).toBe(429);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
