import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { writeSignedJson } from './directory';
import type { Mail } from './mailer';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import type { Feed, FeedListing } from '../src/feed/types';
import { matchesSearch, parseSearchTarget, searchLabel, searchTarget } from '../src/lib/savedSearch';

describe('saved searches', () => {
  it('round-trips a canonical target and rejects anything else', () => {
    const t = searchTarget({ source: 'tax', cls: 'commercial', maxBid: 50000 });
    expect(t).toBe('search:tax?class=commercial&max=50000');
    expect(parseSearchTarget(t)).toEqual({ source: 'tax', cls: 'commercial', maxBid: 50000 });
    expect(parseSearchTarget('search:tax?class=all')).toEqual({ source: 'tax', cls: 'all', maxBid: null });
    for (const bad of ['search:tax?class=mansions', 'search:tax?class=all&max=0', 'search:tax?class=all&max=-5', 'search:sample?class=all', 'search:tax?class=all&max=1&x=<b>']) {
      expect(parseSearchTarget(bad)).toBeNull();
    }
  });

  it('matches by Assessor land-use class and minimum bid', () => {
    const res = parseSearchTarget('search:tax?class=residential&max=30000')!;
    expect(matchesSearch(res, { minimumBid: 25000, landUseCode: '20.110' })).toBe(true);
    expect(matchesSearch(res, { minimumBid: 35000, landUseCode: '20.110' })).toBe(false);
    expect(matchesSearch(res, { minimumBid: 5000, landUseCode: '42.311' })).toBe(false);
    expect(matchesSearch(res, { minimumBid: 5000, landUseCode: null })).toBe(false); // unclassified: only "all"
    expect(matchesSearch(parseSearchTarget('search:tax?class=all')!, { minimumBid: 5000, landUseCode: null })).toBe(true);
    expect(searchLabel(res)).toBe('Residential tax-sale parcels, minimum bid up to $30,000');
  });
});

describe('daily digests (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-digest-'));
  const dataDir = join(dir, 'data');
  const key = loadPrivateKey(generateSigningKeys().privatePem);
  const mails: Mail[] = [];
  // 2027-04-01 06:00 in Las Vegas (PDT = UTC-7): before the 7 a.m. digest hour.
  let clock = new Date('2027-04-01T13:00:00Z');
  let server: Server;
  let base = '';
  let app: ReturnType<typeof createApp>;

  const listing = (apn: string, landUse: string | null, minimumBid = 10000): FeedListing => ({
    sourceId: 'clark-county-treasurer',
    apn,
    address: `${apn.slice(-3)} Digest St`,
    minimumBid,
    auctionId: '2027-05',
    auctionStartsAt: '2027-05-06T15:00:00.000Z',
    auctionFormat: 'In-Person',
    auctionLocation: 'Commission Chambers',
    groupApn: null,
    personalPropertyExcluded: false,
    state: 'AVAILABLE',
    corroboratedAt: '2027-03-30T00:00:00.000Z',
    firstSeenAt: '2027-03-01T00:00:00.000Z',
    lastVerifiedAt: '2027-03-31T00:00:00.000Z',
    sourceUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
    landUse: landUse ? { code: landUse, description: 'Test' } : null,
    snapshotSha256: 'b'.repeat(64),
  });
  const publishFeed = (listings: FeedListing[]) => {
    const feed: Feed = { version: 1, generatedAt: clock.toISOString(), expiresAt: new Date(clock.getTime() + 3 * 86_400_000).toISOString(), sources: [], listings };
    writeSignedJson(dataDir, 'listings.json', feed, key);
  };
  const hours = (h: number) => (clock = new Date(clock.getTime() + h * 3_600_000));

  beforeAll(async () => {
    publishFeed([listing('200-00-000-001', '20.110')]); // baseline: never counts as new
    app = createApp({
      dbPath: join(dir, 'app.db'),
      dataDir,
      distDir: null,
      adminUsername: 'admin',
      adminPasswordHash: hashPassword('a-long-admin-password'),
      signingKey: key,
      baseUrl: 'https://fsf.example',
      mailer: { send: async (m) => void mails.push(m) },
      secureCookies: false,
      trustProxy: true,
      now: () => clock,
    });
    server = createServer(app.handler);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    await app.checkTracked();
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.0.1', ...headers }, body: JSON.stringify(body) });
  const last = () => mails[mails.length - 1];
  const linkIn = (m: Mail, path: string) => m.text.match(new RegExp(`https://fsf\\.example/#/alerts/${path}/([A-Za-z0-9._-]+)`))![1];
  const digests = () => mails.filter((m) => /new match/.test(m.subject));

  it('saves a search with double opt-in, named in our own words', async () => {
    expect((await post('/api/alerts/track', { email: 'saver@example.com', target: 'search:tax?class=residential&max=30000' })).status).toBe(202);
    expect(last().text).toMatch(/daily emails about new matches for "Residential tax-sale parcels, minimum bid up to \$30,000"/);
    const r = await (await post('/api/alerts/confirm', { token: linkIn(last(), 'confirm') })).json();
    const view = await (await post('/api/alerts/manage', { token: r.manageToken }, { 'x-fsf-request': '1' })).json();
    expect(view.subscriptions).toMatchObject([{ kind: 'search', label: 'Residential tax-sale parcels, minimum bid up to $30,000' }]);
    expect((await post('/api/alerts/track', { email: 'x@example.com', target: 'search:tax?class=castles' })).status).toBe(404);
  });

  it('sends nothing the day a search is saved, or before 7 a.m.', async () => {
    hours(2); // 08:00 same day
    publishFeed([listing('200-00-000-001', '20.110'), listing('200-00-000-002', '20.110')]);
    await app.checkTracked();
    expect(digests()).toHaveLength(0);
    hours(21); // 05:00 next day
    await app.checkTracked();
    expect(digests()).toHaveLength(0);
  });

  it('sends one digest at 7 a.m. with only new, matching parcels', async () => {
    publishFeed([
      listing('200-00-000-001', '20.110'), // baseline
      listing('200-00-000-002', '20.110'), // new yesterday, matches
      listing('200-00-000-003', '42.311'), // commercial: no
      listing('200-00-000-004', '20.110', 90000), // over the max bid: no
      listing('200-00-000-005', null), // unclassified: only "all" searches
    ]);
    await app.checkTracked();
    hours(2); // 07:00
    await app.checkTracked();
    expect(digests()).toHaveLength(1);
    const d = last();
    expect(d.subject).toBe('1 new match for your saved search');
    expect(d.text).toMatch(/002 Digest St/);
    expect(d.text).not.toMatch(/00[1345] Digest St/);
    expect(d.headers?.['List-Unsubscribe']).toBeTruthy();
    await app.checkTracked();
    hours(1);
    await app.checkTracked();
    expect(digests()).toHaveLength(1); // once a day
  });

  it('skips days with no new matches, and counts a parcel that comes back', async () => {
    hours(24);
    await app.checkTracked();
    expect(digests()).toHaveLength(1);
    publishFeed([listing('200-00-000-001', '20.110')]); // 002 leaves the list
    hours(1);
    await app.checkTracked();
    publishFeed([listing('200-00-000-001', '20.110'), listing('200-00-000-002', '20.110')]); // and comes back
    hours(1);
    await app.checkTracked();
    hours(22); // next morning
    await app.checkTracked();
    expect(digests()).toHaveLength(2);
    expect(last().text).toMatch(/002 Digest St/);
  });
});
