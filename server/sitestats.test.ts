import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { outboundAction, sitePageFor } from '../src/lib/siteStats';

describe('site stats keys', () => {
  it('maps routes to sections and never counts admin or advertiser pages', () => {
    expect(sitePageFor('property')).toBe('property');
    expect(sitePageFor('bankowned')).toBe('bankowned');
    expect(sitePageFor('privacy')).toBe('other');
    expect(sitePageFor('apply')).toBe('advertise');
    expect(sitePageFor('admin')).toBeNull();
    expect(sitePageFor('advertiser')).toBeNull();
  });

  it('classifies outside links', () => {
    expect(outboundAction('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=1,2')).toBe('photos_opened');
    expect(outboundAction('https://maps.clarkcountynv.gov/openweb/?getParcel=1')).toBe('photos_opened');
    expect(outboundAction('https://maps.clarkcountynv.gov/assessor/AssessorParcelDetail/parceldetail.aspx?hdnParcel=1')).toBe('official_source');
    expect(outboundAction('https://www.hudhomestore.gov/searchresult')).toBe('official_source');
    expect(outboundAction('https://homepath.fanniemae.com/property-finder')).toBe('bank_owned_source');
    expect(outboundAction('https://evil-fanniemae.com/')).toBeNull();
    expect(outboundAction('https://www.example.com/')).toBeNull();
    expect(outboundAction('not a url')).toBeNull();
  });
});

describe('site stats (running server)', () => {
  it('counts visits, sections and actions without bots, and reports them to the admin only', async () => {
    const PASSWORD = 'a-long-admin-password';
    const app = createApp({
      dbPath: join(mkdtempSync(join(tmpdir(), 'fsf-stats-')), 'app.db'),
      dataDir: join(tmpdir(), 'fsf-stats-data'),
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword(PASSWORD),
      signingKey: null,
      baseUrl: 'https://fsf.example',
      mailer: { send: async () => {} },
      trustProxy: true,
    });
    const server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const ev = (body: unknown, ip: string, ua = 'Mozilla/5.0 (test browser)') =>
      fetch(base + '/api/events', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': ua, 'x-forwarded-for': ip }, body: JSON.stringify(body) }).then((r) => r.status);
    try {
      // Visitor A: 3 page views in 2 sections; visitor B: 1 page view; a bot is ignored.
      expect(await ev({ kind: 'pageview', page: 'home' }, '203.0.113.1')).toBe(204);
      expect(await ev({ kind: 'pageview', page: 'property' }, '203.0.113.1')).toBe(204);
      expect(await ev({ kind: 'pageview', page: 'property' }, '203.0.113.1')).toBe(204);
      expect(await ev({ kind: 'pageview', page: 'property' }, '203.0.113.2')).toBe(204);
      expect(await ev({ kind: 'pageview', page: 'home' }, '203.0.113.3', 'Googlebot/2.1')).toBe(204);
      expect(await ev({ kind: 'action', action: 'calculator_used' }, '203.0.113.2')).toBe(204);
      expect(await ev({ kind: 'pageview', page: 'admin' }, '203.0.113.1')).toBe(400);
      expect(await ev({ kind: 'action', action: 'hack' }, '203.0.113.1')).toBe(400);

      expect((await fetch(base + '/api/admin/site-stats')).status).toBe(401);
      const login = await fetch(base + '/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-fsf-request': '1', 'x-forwarded-for': '198.51.100.1' },
        body: JSON.stringify({ username: 'admin', password: PASSWORD }),
      });
      const cookie = login.headers.get('set-cookie')!.split(';')[0];
      const s = await (await fetch(base + '/api/admin/site-stats', { headers: { cookie } })).json();
      expect(s.visits).toBe(2);
      expect(s.pageViews).toBe(4);
      expect(s.pages[0]).toMatchObject({ key: 'property', views: 3, visits: 2 });
      expect(s.pages.find((p: { key: string }) => p.key === 'home')).toMatchObject({ views: 1, visits: 1 });
      expect(s.actions.find((a: { key: string }) => a.key === 'calculator_used')).toMatchObject({ total: 1, visits: 1 });
      expect(s.daily.length).toBe(30);
      expect(JSON.stringify(s)).not.toMatch(/203\.0\.113/);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
