import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { hashPassword } from './auth';
import { writeSignedJson } from './directory';
import type { Mail } from './mailer';
import { describeChange } from './mailer';
import { diffSnapshots, dueReminders, type ListingSnapshot } from './tracker';
import { generateSigningKeys, loadPrivateKey } from '../ingest/lib/sign';
import type { Feed, FeedFederalSale, FeedListing } from '../src/feed/types';

const SNAP: ListingSnapshot = {
  apn: '161-17-510-031',
  address: '4731 Fuentes Way',
  minimumBid: 25587,
  auctionStartsAt: '2027-05-06T15:00:00.000Z',
  auctionFormat: 'In-Person',
  auctionLocation: 'Commission Chambers',
  sourceUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
};

describe('tracked-property changes', () => {
  it('finds removals, returns, and changed dates, bids and places', () => {
    expect(diffSnapshots(SNAP, true, SNAP)).toEqual([]);
    expect(diffSnapshots(SNAP, true, null)).toEqual([{ kind: 'removed' }]);
    expect(diffSnapshots(SNAP, false, null)).toEqual([]); // already gone: don't repeat
    expect(diffSnapshots(SNAP, false, SNAP)).toEqual([{ kind: 'back', auctionStartsAt: SNAP.auctionStartsAt, minimumBid: SNAP.minimumBid }]);
    const moved = { ...SNAP, auctionStartsAt: '2027-05-13T15:00:00.000Z', minimumBid: 26000, auctionLocation: 'Online' };
    expect(diffSnapshots(SNAP, true, moved).map((c) => c.kind)).toEqual(['date', 'minimumBid', 'place']);
  });

  it('reminds 10 days before (register) and the day before, once each', () => {
    const start = Date.parse(SNAP.auctionStartsAt!);
    expect(dueReminders(SNAP, new Date(start - 11 * 86_400_000))).toEqual([]);
    expect(dueReminders(SNAP, new Date(start - 9 * 86_400_000)).map((r) => r.change.kind)).toEqual(['register']);
    expect(dueReminders(SNAP, new Date(start - 5 * 86_400_000))).toEqual([]); // registration has closed: no late nag
    expect(dueReminders(SNAP, new Date(start - 3_600_000)).map((r) => r.change.kind)).toEqual(['tomorrow']);
    expect(dueReminders(SNAP, new Date(start + 1))).toEqual([]);
  });

  it('describes changes in plain words, in Las Vegas time', () => {
    expect(describeChange({ kind: 'date', from: '2027-05-06T15:00:00.000Z', to: '2027-05-13T15:00:00.000Z' })).toMatch(/May 6, 2027.*8:00 AM PDT → .*May 13, 2027/);
    expect(describeChange({ kind: 'removed' })).toMatch(/paid off, withdrawn or sold/);
    expect(describeChange({ kind: 'minimumBid', from: 25587, to: 26000 })).toBe('Minimum bid changed: $25,587 → $26,000.');
  });
});

describe('tracking a verified listing (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-track-'));
  const dataDir = join(dir, 'data');
  const keys = generateSigningKeys();
  const key = loadPrivateKey(keys.privatePem);
  const mails: Mail[] = [];
  let clock = new Date('2027-04-01T12:00:00Z');
  let server: Server;
  let base = '';
  let app: ReturnType<typeof createApp>;

  const listing = (apn: string, over: Partial<FeedListing> = {}): FeedListing => ({
    sourceId: 'clark-county-treasurer',
    apn,
    address: `${apn.slice(-3)} Test Ave`,
    minimumBid: 10000,
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
    landUse: null,
    snapshotSha256: 'a'.repeat(64),
    ...over,
  });
  const publishFeed = (listings: FeedListing[], expires = new Date(clock.getTime() + 86_400_000)) => {
    const feed: Feed = { version: 1, generatedAt: clock.toISOString(), expiresAt: expires.toISOString(), sources: [], listings };
    writeSignedJson(dataDir, 'listings.json', feed, key);
  };

  beforeAll(async () => {
    publishFeed([listing('100-00-000-001'), listing('100-00-000-002')]);
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
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  let ip = 1;
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${ip}`, ...headers }, body: JSON.stringify(body) });
  const app1 = { 'x-fsf-request': '1' };
  const last = () => mails[mails.length - 1];
  const linkIn = (m: Mail, path: string) => m.text.match(new RegExp(`https://fsf\\.example/#/alerts/${path}/([A-Za-z0-9._-]+)`))![1];
  let manageToken = '';

  it('records the first feed without emailing anyone', async () => {
    expect(await app.checkTracked()).toBe(0);
  });

  it('only verified listings can be tracked', async () => {
    expect((await post('/api/alerts/track', { email: 'buyer@example.com', target: 'tax:999-99-999-999' })).status).toBe(404);
    expect((await post('/api/alerts/track', { email: 'buyer@example.com', target: 'sample:p1' })).status).toBe(404);
  });

  it('a new address confirms first, with the property named from our own data', async () => {
    expect((await post('/api/alerts/track', { email: 'buyer@example.com', target: 'tax:100-00-000-001' })).status).toBe(202);
    expect(last().text).toMatch(/starting with updates on 001 Test Ave \(APN 100-00-000-001\)/);
    const r = await post('/api/alerts/confirm', { token: linkIn(last(), 'confirm') });
    manageToken = (await r.json()).manageToken;
    const view = await (await post('/api/alerts/manage', { token: manageToken }, app1)).json();
    expect(view.subscriptions).toMatchObject([{ kind: 'property', target: 'tax:100-00-000-001', label: '001 Test Ave (APN 100-00-000-001)' }]);
    expect(view.listOptIn).toBe(false);
  });

  it('an active address confirms each new property from its own manage page', async () => {
    ip = 2;
    const before = mails.length;
    expect((await post('/api/alerts/track', { email: 'buyer@example.com', target: 'tax:100-00-000-002' })).status).toBe(202);
    expect(mails).toHaveLength(before + 1);
    expect(last().subject).toMatch(/Confirm: track 002 Test Ave/);
    expect(last().text).toMatch(/add updates on 002 Test Ave/);
    expect(last().text).toMatch(/#\/alerts\/manage\/[^?\s]+\?add=tax%3A100-00-000-002/);
    // Nothing is added until they choose it on the manage page.
    let view = await (await post('/api/alerts/manage', { token: manageToken, preview: 'tax:100-00-000-002' }, app1)).json();
    expect(view.subscriptions).toHaveLength(1);
    expect(view.preview).toEqual({ kind: 'property', target: 'tax:100-00-000-002', label: '002 Test Ave (APN 100-00-000-002)', tracked: false });
    view = await (await post('/api/alerts/update', { token: manageToken, add: 'tax:100-00-000-002' }, app1)).json();
    expect(view.subscriptions).toHaveLength(2);
  });

  it('emails one message per person listing every change, and nothing when nothing changed', async () => {
    const before = mails.length;
    expect(await app.checkTracked()).toBe(0);
    clock = new Date(clock.getTime() + 3_600_000);
    publishFeed([listing('100-00-000-001', { auctionStartsAt: '2027-05-13T15:00:00.000Z', minimumBid: 12000 })]);
    expect(await app.checkTracked()).toBe(1);
    expect(mails).toHaveLength(before + 1);
    const m = last();
    expect(m.to).toBe('buyer@example.com');
    expect(m.subject).toBe("Updates on 2 properties you're tracking");
    expect(m.text).toMatch(/Auction date changed/);
    expect(m.text).toMatch(/Minimum bid changed: \$10,000 → \$12,000/);
    expect(m.text).toMatch(/002 Test Ave[\s\S]*No longer on the Treasurer's auction list/);
    expect(m.headers?.['List-Unsubscribe']).toMatch(/unsubscribe\?t=/);
    expect(m.text).toMatch(/Unsubscribe from everything/);
  });

  it('tells you when a property comes back, and reminds before the auction once', async () => {
    clock = new Date(clock.getTime() + 3_600_000);
    publishFeed([listing('100-00-000-001', { auctionStartsAt: '2027-05-13T15:00:00.000Z', minimumBid: 12000 }), listing('100-00-000-002')]);
    await app.checkTracked();
    expect(last().text).toMatch(/002 Test Ave[\s\S]*On the Treasurer's auction list for the auction on/);
    clock = new Date(Date.parse('2027-05-06T15:00:00.000Z') - 9 * 86_400_000);
    publishFeed([listing('100-00-000-001', { auctionStartsAt: '2027-05-13T15:00:00.000Z', minimumBid: 12000 }), listing('100-00-000-002')]);
    const before = mails.length;
    await app.checkTracked();
    expect(mails).toHaveLength(before + 1);
    expect(last().text).toMatch(/Registration usually closes about a week before/);
    await app.checkTracked();
    expect(mails).toHaveLength(before + 1); // not twice
  });

  it('sends nothing while the feed is expired or tampered with', async () => {
    clock = new Date(clock.getTime() + 3_600_000);
    const before = mails.length;
    publishFeed([], new Date(clock.getTime() - 1)); // expired: would look like "everything removed"
    expect(await app.checkTracked()).toBe(0);
    publishFeed([]);
    writeFileSync(join(dataDir, 'listings.json.sig'), 'AAAA'); // bad signature
    expect(await app.checkTracked()).toBe(0);
    expect(mails).toHaveLength(before);
  });

  it('stops emailing once someone unsubscribes', async () => {
    const s = app.alerts.byEmail('buyer@example.com')!;
    await fetch(`${base}/api/alerts/unsubscribe?t=${encodeURIComponent(app.alerts.token(s, 'unsubscribe'))}`, { method: 'POST' });
    clock = new Date(clock.getTime() + 3_600_000);
    const before = mails.length;
    publishFeed([listing('100-00-000-001', { minimumBid: 50000 })]);
    await app.checkTracked();
    expect(mails).toHaveLength(before);
  });
});

describe('tracking an IRS sale (running server)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fsf-track-irs-'));
  const dataDir = join(dir, 'data');
  const key = loadPrivateKey(generateSigningKeys().privatePem);
  const mails: Mail[] = [];
  let clock = new Date('2026-10-01T12:00:00Z');
  let server: Server;
  let base = '';
  let app: ReturnType<typeof createApp>;
  const sale = (over: Partial<FeedFederalSale> = {}): FeedFederalSale => ({
    sourceId: 'us-irs-auctions',
    id: 'made-up-las-vegas-home',
    title: 'MADE UP: Single family home in Las Vegas, NV',
    apns: ['999-01-101-001'],
    address: '1234 Example Ave',
    city: 'Las Vegas',
    zip: '89101',
    saleKind: 'ADMINISTRATIVE',
    saleFormat: 'Public auction',
    minimumBid: 185000,
    saleStartsAt: '2026-11-18T18:00:00.000Z',
    saleLocation: 'Example Federal Building',
    state: 'AVAILABLE',
    corroboratedAt: '2026-10-01T00:00:00.000Z',
    firstSeenAt: '2026-10-01T00:00:00.000Z',
    lastVerifiedAt: '2026-10-01T00:00:00.000Z',
    sourceUrl: 'https://www.irsauctions.gov/ad/made-up-las-vegas-home/',
    landUse: null,
    snapshotSha256: 'b'.repeat(64),
    ...over,
  });
  const publish = (federalSales: FeedFederalSale[]) =>
    writeSignedJson(dataDir, 'listings.json', { version: 1, generatedAt: clock.toISOString(), expiresAt: new Date(clock.getTime() + 86_400_000).toISOString(), sources: [], listings: [], federalSales } satisfies Feed, key);
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.0.1', ...headers }, body: JSON.stringify(body) });
  const last = () => mails[mails.length - 1];

  beforeAll(async () => {
    publish([sale()]);
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
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it('tracks a verified IRS sale and emails IRS wording when it changes or is canceled', async () => {
    expect(await app.checkTracked()).toBe(0); // baseline
    expect((await post('/api/alerts/track', { email: 'irs@example.com', target: 'irs:not-listed' })).status).toBe(404);
    expect((await post('/api/alerts/track', { email: 'irs@example.com', target: 'irs:made-up-las-vegas-home' })).status).toBe(202);
    expect(last().text).toMatch(/updates on 1234 Example Ave \(APN 999-01-101-001\)/);
    await post('/api/alerts/confirm', { token: last().text.match(/#\/alerts\/confirm\/([A-Za-z0-9._-]+)/)![1] });

    clock = new Date(clock.getTime() + 3_600_000);
    publish([sale({ minimumBid: null, saleStartsAt: '2026-11-20T18:00:00.000Z' })]);
    expect(await app.checkTracked()).toBe(1);
    expect(last().text).toMatch(/on irsauctions\.gov:/);
    expect(last().text).toMatch(/Minimum bid changed: \$185,000 → see the notice/);
    expect(last().text).toMatch(/Official record: https:\/\/www\.irsauctions\.gov\/ad\/made-up-las-vegas-home\//);

    clock = new Date(clock.getTime() + 3_600_000);
    publish([]);
    expect(await app.checkTracked()).toBe(1);
    expect(last().text).toMatch(/No longer listed on irsauctions\.gov\. The sale may have been canceled, postponed or held/);
  });
});
