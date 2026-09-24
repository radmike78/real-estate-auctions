import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { normalizeApn, pacificToIso, parseAuctionList, parseMoney, SchemaDriftError } from './connectors/clarkTaxSale';
import { assertTrustedUrl, secureFetch, UntrustedSourceError } from './lib/secureFetch';
import { observedChangeIntervalHours, pollIntervalMinutes, maxAgeMinutes } from './lib/cadence';
import { applyNotModified, applySnapshot, detectAnomalies, emptyState } from './lib/reconcile';
import { buildFeed } from './lib/publish';
import { generateSigningKeys, loadPrivateKey, signBytes, verifyBytes } from './lib/sign';
import { SOURCES } from './sources/registry';
import { verifyFeed } from '../src/feed/verify';

const fixture = readFileSync(new URL('./fixtures/auction-list.synthetic.html', import.meta.url), 'utf8');
const SRC = { ...SOURCES[0], termsReviewedAt: '2026-09-24' };
const SHA = 'a'.repeat(64);

describe('Clark County tax-sale parser', () => {
  const r = parseAuctionList(fixture);

  it('finds the auction table by headers and reads every parcel', () => {
    expect(r.rows.map((x) => x.apn)).toEqual([
      '161-20-110-001', '161-20-110-002', '161-20-110-003', '161-20-110-004', '161-20-110-005', '161-20-110-006',
    ]);
    expect(r.rejected).toEqual([]);
    expect(r.rows[0]).toMatchObject({ minimumBid: 4512.33, address: '0 Sample Ave, Las Vegas', withdrawn: false });
  });

  it('treats lined-out and redeemed parcels as withdrawn', () => {
    const w = Object.fromEntries(r.rows.map((x) => [x.apn.slice(-3), x.withdrawn]));
    expect(w).toEqual({ '001': false, '002': false, '003': true, '004': true, '005': true, '006': false });
  });

  it('reads the auction date in Las Vegas time', () => {
    expect(r.auctionStartsAt).toBe('2027-05-14T15:00:00.000Z'); // 8:00 a.m. PDT
    expect(pacificToIso(2027, 0, 10, 8, 0)).toBe('2027-01-10T16:00:00.000Z'); // PST
  });

  it('keeps source text as plain text (no markup is interpreted)', () => {
    expect(r.rows[5].address).toBe('5 Fixture Ct <script>alert(1)</script>');
  });

  it('rejects the whole snapshot when the layout changes', () => {
    expect(() => parseAuctionList('<table><tr><th>Parcel</th><th>Owner</th></tr></table>')).toThrow(SchemaDriftError);
    expect(() => parseAuctionList('<html><body>Service unavailable</body></html>')).toThrow(SchemaDriftError);
  });

  it('rejects the snapshot when too many rows fail validation', () => {
    const bad = fixture.replace(/\$\d[\d,.]*/g, 'TBD');
    expect(() => parseAuctionList(bad)).toThrow(/failed validation/);
  });

  it('rejects rows with unrecognized status instead of guessing', () => {
    const rows = Array.from({ length: 40 }, (_, i) => `<tr><td>161-20-111-${String(i).padStart(3, '0')}</td><td>$100.00</td><td>${i === 0 ? 'Pending review' : ''}</td></tr>`);
    const out = parseAuctionList(`<table><tr><th>APN</th><th>Minimum Bid</th><th>Status</th></tr>${rows.join('')}</table>`);
    expect(out.rows).toHaveLength(39);
    expect(out.rejected[0].reason).toMatch(/unrecognized status/);
  });

  it('validates APNs and money strictly', () => {
    expect(normalizeApn('161 20 110 001')).toBe('161-20-110-001');
    expect(normalizeApn('161-20-110')).toBeNull();
    expect(parseMoney('$1,000.50')).toBe(1000.5);
    expect(parseMoney('-5')).toBeNull();
    expect(parseMoney('1e9')).toBeNull();
  });
});

describe('secure fetch', () => {
  const hosts = ['treasurer.clarkcountynv.gov'];

  it('only allows HTTPS on exact official hosts', () => {
    expect(() => assertTrustedUrl('https://treasurer.clarkcountynv.gov/auction', hosts)).not.toThrow();
    for (const bad of [
      'http://treasurer.clarkcountynv.gov/auction',
      'https://treasurer.clarkcountynv.gov.evil.com/auction',
      'https://evil.com/treasurer.clarkcountynv.gov',
      'https://user:pw@treasurer.clarkcountynv.gov/',
      'https://treasurer.clarkcountynv.gov:8443/',
      'https://clarkcountynv.gov.attacker.net/',
    ]) {
      expect(() => assertTrustedUrl(bad, hosts), bad).toThrow(UntrustedSourceError);
    }
  });

  it('refuses a redirect to an unofficial host', async () => {
    const fake = (async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/list' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/auction', { allowedHosts: hosts, fetchImpl: fake })).rejects.toThrow(/not on the official allowlist/);
  });

  it('hashes content, sends conditional headers, and handles 304', async () => {
    let seen: Headers | undefined;
    const ok = (async (_u: string, init?: RequestInit) => {
      seen = new Headers(init?.headers);
      return new Response('<table></table>', { status: 200, headers: { 'content-type': 'text/html', etag: '"v2"' } });
    }) as typeof fetch;
    const res = await secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: ok, etag: '"v1"' });
    expect(seen?.get('if-none-match')).toBe('"v1"');
    expect(res).toMatchObject({ kind: 'ok', etag: '"v2"' });
    if (res.kind === 'ok') expect(res.sha256).toMatch(/^[0-9a-f]{64}$/);

    const nm = (async () => new Response(null, { status: 304 })) as typeof fetch;
    expect((await secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: nm })).kind).toBe('not_modified');
  });

  it('rejects unexpected content types and oversized responses', async () => {
    const pdf = (async () => new Response('x', { headers: { 'content-type': 'application/octet-stream' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: pdf })).rejects.toThrow(/content-type/);
    const big = (async () => new Response('x'.repeat(2000), { headers: { 'content-type': 'text/html' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: big, maxBytes: 1000 })).rejects.toThrow(/exceeded/);
  });
});

describe('cadence and freshness', () => {
  const now = new Date('2027-05-01T12:00:00Z');
  const base = { changeTimes: [] as string[], nextAuctionAt: null, consecutiveErrors: 0, now };

  it('learns the real update interval from observed changes', () => {
    expect(observedChangeIntervalHours(['2027-01-01T00:00:00Z', '2027-01-01T12:00:00Z'])).toBeNull();
    expect(observedChangeIntervalHours(['2027-01-01T00:00:00Z', '2027-01-01T12:00:00Z', '2027-01-02T00:00:00Z', '2027-01-02T06:00:00Z'])).toBe(12);
  });

  it('polls ~4x per update, faster near the auction, slower on errors', () => {
    expect(pollIntervalMinutes(SRC, base)).toBe(360); // declared daily -> every 6 h
    const hourly = ['2027-01-01T00:00:00Z', '2027-01-01T01:00:00Z', '2027-01-01T02:00:00Z', '2027-01-01T03:00:00Z'];
    expect(pollIntervalMinutes(SRC, { ...base, changeTimes: hourly })).toBe(15);
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-03T12:00:00Z' })).toBe(60); // 48 h out
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-02T08:00:00Z' })).toBe(15); // 20 h out
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-02T08:00:00Z', consecutiveErrors: 2 })).toBe(60);
  });

  it('verification lifetime shrinks with the poll interval', () => {
    expect(maxAgeMinutes(SRC, 360)).toBe(750);
    expect(maxAgeMinutes(SRC, 15)).toBe(60);
  });
});

function stateWithListings(n: number, now: Date) {
  const rows = Array.from({ length: n }, (_, i) => ({
    apn: normalizeApn(`1612011${String(i).padStart(4, '0')}`)!,
    address: null,
    minimumBid: 1000 + i,
    withdrawn: false,
    auctionStartsAt: '2027-05-14T15:00:00.000Z',
  }));
  return applySnapshot(emptyState(SRC.id), { auctionStartsAt: rows[0].auctionStartsAt, rows, rejected: [] }, { sha256: SHA, sourceUrl: SRC.fetchUrl, now });
}

describe('reconcile and anomaly quarantine', () => {
  const now = new Date('2027-05-01T12:00:00Z');

  it('marks parcels that drop off the official list as withdrawn', () => {
    const s = stateWithListings(3, now);
    const next = applySnapshot(s, { auctionStartsAt: null, rows: [], rejected: [] }, { sha256: 'b'.repeat(64), sourceUrl: SRC.fetchUrl, now });
    expect(Object.values(next.listings).every((l) => l.state === 'WITHDRAWN')).toBe(true);
  });

  it('quarantines a mass removal, mass addition or bid manipulation', () => {
    const prev = stateWithListings(40, now);
    const keep = Object.values(prev.listings).map((l) => ({ apn: l.apn, address: null, minimumBid: l.minimumBid, withdrawn: false, auctionStartsAt: l.auctionStartsAt }));
    const cycle = keep[0].auctionStartsAt;
    expect(detectAnomalies(prev, { auctionStartsAt: cycle, rows: keep, rejected: [] })).toEqual([]);
    expect(detectAnomalies(prev, { auctionStartsAt: cycle, rows: keep.slice(0, 10), rejected: [] })[0].code).toBe('MASS_REMOVAL');
    const injected = [...keep, ...Array.from({ length: 15 }, (_, i) => ({ ...keep[0], apn: normalizeApn(`9990000${String(i).padStart(4, '0')}`)! }))];
    expect(detectAnomalies(prev, { auctionStartsAt: cycle, rows: injected, rejected: [] })[0].code).toBe('MASS_ADDITION');
    const cheap = keep.map((r) => ({ ...r, minimumBid: 1 }));
    expect(detectAnomalies(prev, { auctionStartsAt: cycle, rows: cheap, rejected: [] })[0].code).toBe('BID_SHIFT');
  });

  it('allows a legitimately new auction cycle to replace the list', () => {
    const prev = stateWithListings(40, now);
    const fresh = [{ apn: '161-99-000-001', address: null, minimumBid: 500, withdrawn: false, auctionStartsAt: '2027-11-05T16:00:00.000Z' }];
    expect(detectAnomalies(prev, { auctionStartsAt: '2027-11-05T16:00:00.000Z', rows: fresh, rejected: [] })).toEqual([]);
  });
});

describe('published feed', () => {
  const t0 = new Date('2027-05-01T12:00:00Z');
  const hours = (h: number) => new Date(t0.getTime() + h * 3_600_000);

  it('publishes only fresh, available listings from reviewed, healthy sources', () => {
    const s = stateWithListings(3, t0);
    s.listings['161-20-110-0002'] = { ...Object.values(s.listings)[0], apn: '161-20-119-999', state: 'WITHDRAWN' };
    expect(buildFeed([SRC], { [SRC.id]: s }, t0).listings).toHaveLength(3);
    // Source never re-verified: after the verification window, nothing is shown.
    const stale = buildFeed([SRC], { [SRC.id]: s }, hours(13));
    expect(stale.listings).toHaveLength(0);
    expect(stale.sources[0].health).toBe('stale');
    // A 304 re-verifies everything.
    expect(buildFeed([SRC], { [SRC.id]: applyNotModified(s, hours(13)) }, hours(13)).listings).toHaveLength(3);
    // Unreviewed terms or quarantine -> nothing published.
    expect(buildFeed([{ ...SRC, termsReviewedAt: null }], { [SRC.id]: s }, t0).listings).toHaveLength(0);
    expect(buildFeed([SRC], { [SRC.id]: { ...s, health: 'quarantined' } }, t0).listings).toHaveLength(0);
    // Auction over -> hidden.
    expect(buildFeed([SRC], { [SRC.id]: applyNotModified(s, new Date('2027-05-15T12:00:00Z')) }, new Date('2027-05-15T12:00:00Z')).listings).toHaveLength(0);
  });
});

describe('signed feed (anti-spoofing)', () => {
  const now = new Date('2027-05-01T12:00:00Z');
  const keys = generateSigningKeys();
  const feed = buildFeed([SRC], { [SRC.id]: stateWithListings(2, now) }, now);
  const bytes = new TextEncoder().encode(JSON.stringify(feed));
  const sig = signBytes(bytes, loadPrivateKey(keys.privatePem));
  const subtle = webcrypto.subtle as unknown as SubtleCrypto;
  const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

  it('accepts a genuine feed in Node and in the browser verifier', async () => {
    expect(verifyBytes(bytes, sig, keys.publicSpkiB64)).toBe(true);
    const r = await verifyFeed(buf(bytes), sig, keys.publicSpkiB64, now, subtle);
    expect(r.ok && r.feed.listings.length).toBe(2);
  });

  it('rejects a tampered listing, a foreign key, and an expired feed', async () => {
    const tampered = new TextEncoder().encode(JSON.stringify({ ...feed, listings: [{ ...feed.listings[0], minimumBid: 1 }] }));
    expect(await verifyFeed(buf(tampered), sig, keys.publicSpkiB64, now, subtle)).toMatchObject({ ok: false, reason: 'BAD_SIGNATURE' });
    const other = generateSigningKeys();
    const forged = signBytes(bytes, loadPrivateKey(other.privatePem));
    expect(await verifyFeed(buf(bytes), forged, keys.publicSpkiB64, now, subtle)).toMatchObject({ ok: false, reason: 'BAD_SIGNATURE' });
    expect(await verifyFeed(buf(bytes), sig, keys.publicSpkiB64, new Date('2027-05-03T00:00:00Z'), subtle)).toMatchObject({ ok: false, reason: 'EXPIRED' });
    expect(await verifyFeed(buf(bytes), sig, null, now, subtle)).toMatchObject({ ok: false, reason: 'NOT_CONFIGURED' });
  });

  it('drops signed listings that link off official hosts (defense in depth)', async () => {
    const evil = { ...feed, listings: [{ ...feed.listings[0], sourceUrl: 'https://evil.example/pay-here' }] };
    const b = new TextEncoder().encode(JSON.stringify(evil));
    const r = await verifyFeed(buf(b), signBytes(b, loadPrivateKey(keys.privatePem)), keys.publicSpkiB64, now, subtle);
    expect(r.ok && r.feed.listings.length).toBe(0);
  });
});
