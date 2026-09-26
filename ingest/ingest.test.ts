import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import type { PeerCertificate } from 'node:tls';
import { describe, expect, it } from 'vitest';
import {
  extractAuctionId,
  parseSnapshot,
  SchemaDriftError,
  toPlainText,
  type ParsedRow,
  type ParseResult,
  type RawSnapshot,
} from './connectors/clarkTaxSale';
import { assertTrustedUrl, secureFetch, UntrustedSourceError } from './lib/secureFetch';
import { maxAgeMinutes, observedChangeIntervalHours, pollIntervalMinutes } from './lib/cadence';
import { applySnapshot, detectAnomalies, emptyState, type SourceState } from './lib/reconcile';
import { confirmParcelsExist } from './lib/corroborate';
import { assertPublicDns, IdentityError, isPrivateAddress, judgeIdentity, makeCertificateVerifier, toIdentity } from './lib/siteIdentity';
import { buildFeed } from './lib/publish';
import { generateSigningKeys, loadPrivateKey, signBytes, verifyBytes } from './lib/sign';
import { SOURCES, validateRegistry } from './sources/registry';
import { verifyFeed } from '../src/feed/verify';

const dir = new URL('./fixtures/clark-2026-05/', import.meta.url);
const REAL: RawSnapshot = {
  page: readFileSync(new URL('page.html', dir), 'utf8'),
  events: readFileSync(new URL('events.json', dir), 'utf8'),
  parcels: readFileSync(new URL('parcels.json', dir), 'utf8'),
};
const SRC = { ...SOURCES[0], termsReviewedAt: '2026-09-24' };
const SHA = 'a'.repeat(64);

/** The real snapshot re-dated so its sessions are upcoming. */
function upcomingSnapshot(start = '2027-05-13T08:00:00-07:00'): RawSnapshot {
  const ev = JSON.parse(REAL.events);
  ev.Data[0].EventDateTimeStart = start;
  ev.Data[0].EventStatus = 'Upcoming';
  ev.Data[1].EventDateTimeStart = start.replace('08:00', '14:00');
  ev.Data[1].EventStatus = 'Upcoming';
  return { ...REAL, events: JSON.stringify(ev) };
}
const withParcels = (mutate: (d: { Data: Record<string, unknown>[]; Total: number; Errors: unknown }) => void): RawSnapshot => {
  const p = JSON.parse(REAL.parcels);
  mutate(p);
  return { ...REAL, parcels: JSON.stringify(p) };
};

describe('Clark County Treasurer connector (real data, auction 21)', () => {
  const { parsed, sha256 } = parseSnapshot(REAL);
  const by = Object.fromEntries(parsed.rows.map((r) => [r.apn, r]));

  it('discovers the auction and validates every parcel', () => {
    expect(parsed.auctionKey).toBe('21');
    expect(parsed.rows).toHaveLength(14);
    expect(parsed.rejected).toEqual([]);
    expect(sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('reads auction sessions, stripping the HTML the county embeds', () => {
    expect(parsed.auctionFormat).toBe('In-Person');
    expect(parsed.auctionLocation).toBe('Commission Chambers of the Clark County Government Center, 500 S. Grand Central Parkway, Las Vegas, Nevada');
    // Both sessions are "Prior": the latest one is used, so the sale reads as already held.
    expect(parsed.auctionStartsAt).toBe('2026-05-07T21:00:00.000Z');
  });

  it('marks lined-out and sold parcels as withdrawn', () => {
    expect(by['138-01-406-008']).toMatchObject({ withdrawn: false, sold: false, address: '5472 W ALEXANDER RD', minimumBid: 185588.61 });
    expect(by['040-26-501-008']).toMatchObject({ withdrawn: true, sold: true }); // winning bid 4,900
    expect(by['059-09-301-024']).toMatchObject({ withdrawn: true, sold: false }); // lined out (redeemed)
    expect(parsed.rows.filter((r) => !r.withdrawn)).toHaveLength(6);
  });

  it('extracts grouped parcels from the county\'s <button> markup and flags "#" parcels', () => {
    expect(by['138-13-710-053']).toMatchObject({ groupApn: '138-13-710-053', withdrawn: false });
    expect(by['059-08-801-004'].personalPropertyExcluded).toBe(true);
    expect(by['001-09-401-030'].address).toBeNull(); // "UNASSIGNED SITUS"
  });

  it('picks the next upcoming session when one is scheduled', () => {
    expect(parseSnapshot(upcomingSnapshot()).parsed.auctionStartsAt).toBe('2027-05-13T15:00:00.000Z');
  });

  it('never keeps markup from source text', () => {
    const r = parseSnapshot(withParcels((d) => (d.Data[0].PropertyLocation = '1 Main St<script>alert(1)</script>'))).parsed;
    expect(r.rows[0].address).toBe('1 Main St alert(1)');
    expect(toPlainText('<b>a</b>&amp;<br/>b')).toBe('a & b');
  });

  it('fails closed on page or format changes', () => {
    expect(() => extractAuctionId('<html>no grid</html>')).toThrow(SchemaDriftError);
    expect(() => extractAuctionId('Parcel_Read?auctionId=21 Parcel_Read?auctionId=22')).toThrow(/exactly one/);
    expect(() => parseSnapshot({ ...REAL, parcels: '<html>Request Rejected</html>' })).toThrow(/did not return JSON/);
    expect(() => parseSnapshot(withParcels((d) => (d.Total = 500)))).toThrow(/partial list/);
    expect(() => parseSnapshot(withParcels((d) => (d.Errors = ['boom'])))).toThrow(/returned errors/);
    expect(() => parseSnapshot(withParcels((d) => d.Data.forEach((r) => delete r.IsLineOut)))).toThrow(/failed validation/);
  });

  it('rejects rows that belong to another auction or carry bad values', () => {
    const many = withParcels((d) => {
      d.Data = Array.from({ length: 30 }, () => d.Data).flat().map((r, i) => ({ ...r, ShowParcelNumber: `100-00-000-${String(i).padStart(3, '0')}`, ParcelNumber: `100-00-000-${String(i).padStart(3, '0')}` }));
      d.Data[0].TrusteeAuctionId = 99;
      d.Data[1].MinBidAmount = -5;
      d.Total = d.Data.length;
    });
    const r = parseSnapshot(many).parsed;
    expect(r.rejected.map((x) => x.reason)).toEqual(['belongs to auction 99, expected 21', 'invalid minimum bid for 100-00-000-001']);
  });
});

describe('source registry', () => {
  it('only allows exact .gov hosts over HTTPS', () => {
    expect(() => validateRegistry()).not.toThrow();
    expect(() => validateRegistry([{ ...SRC, allowedHosts: ['clarkcountynv-treasurer.com'] }])).toThrow(/not an exact \.gov/);
    expect(() => validateRegistry([{ ...SRC, corroborationHosts: ['maps.co.clark.nv.us'] }])).toThrow(/not an exact \.gov/);
    expect(() => validateRegistry([{ ...SRC, fetchUrl: 'http://treasurer.clarkcountynv.gov/x' }])).toThrow(/not HTTPS/);
  });
});

describe('secure fetch', () => {
  const hosts = ['treasurer.clarkcountynv.gov'];

  it('only allows HTTPS on exact official hosts (clones and look-alikes are unreachable)', () => {
    expect(() => assertTrustedUrl('https://treasurer.clarkcountynv.gov/auction', hosts)).not.toThrow();
    for (const bad of [
      'http://treasurer.clarkcountynv.gov/auction',
      'https://treasurer.clarkcountynv.gov.evil.com/auction',
      'https://treasurer-clarkcountynv.gov/auction',
      'https://evil.com/treasurer.clarkcountynv.gov',
      'https://user:pw@treasurer.clarkcountynv.gov/',
      'https://treasurer.clarkcountynv.gov:8443/',
    ]) {
      expect(() => assertTrustedUrl(bad, hosts), bad).toThrow(UntrustedSourceError);
    }
  });

  it('refuses a redirect to an unofficial host', async () => {
    const fake = (async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/list' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/auction', { allowedHosts: hosts, fetchImpl: fake })).rejects.toThrow(/not on the official allowlist/);
  });

  it('hashes content and rejects unexpected types and oversized bodies', async () => {
    const ok = (async () => new Response('{}', { headers: { 'content-type': 'application/json' } })) as typeof fetch;
    const res = await secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: ok });
    expect(res.kind === 'ok' && res.sha256).toMatch(/^[0-9a-f]{64}$/);
    const bin = (async () => new Response('x', { headers: { 'content-type': 'application/octet-stream' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: bin })).rejects.toThrow(/content-type/);
    const big = (async () => new Response('x'.repeat(2000), { headers: { 'content-type': 'text/html' } })) as typeof fetch;
    await expect(secureFetch('https://treasurer.clarkcountynv.gov/a', { allowedHosts: hosts, fetchImpl: big, maxBytes: 1000 })).rejects.toThrow(/exceeded/);
  });
});

describe('site identity', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  const cert = (over: Partial<Record<string, unknown>> = {}) =>
    ({
      subject: { CN: 'treasurer.clarkcountynv.gov' },
      issuer: { O: 'Sectigo Limited', CN: 'Sectigo RSA Domain Validation Secure Server CA' },
      subjectaltname: 'DNS:treasurer.clarkcountynv.gov, DNS:www.treasurer.clarkcountynv.gov',
      fingerprint256: 'AA:01',
      valid_from: 'Jan  1 00:00:00 2026 GMT',
      valid_to: 'Jan  1 00:00:00 2027 GMT',
      ...over,
    }) as unknown as PeerCertificate;
  const host = 'treasurer.clarkcountynv.gov';
  const baseline = { issuerOrg: 'Sectigo Limited', issuerCN: 'x', fingerprint256: 'AA:01', approvedAt: '2026-01-01' };

  it('accepts the known certificate and routine renewals from the same CA', () => {
    expect(judgeIdentity(toIdentity(host, cert(), now), baseline, now)).toEqual({ ok: true, renewed: false });
    expect(judgeIdentity(toIdentity(host, cert({ fingerprint256: 'BB:02' }), now), baseline, now)).toEqual({ ok: true, renewed: true });
  });

  it('flags a certificate from a different CA (possible hijack), a wrong name, or an expired certificate', () => {
    const hijack = judgeIdentity(toIdentity(host, cert({ fingerprint256: 'EE:66', issuer: { O: 'Some Other CA' } }), now), baseline, now);
    expect(hijack).toMatchObject({ ok: false, code: 'ISSUER_CHANGED' });
    const wrongName = judgeIdentity(toIdentity(host, cert({ subjectaltname: 'DNS:clarkcountynv-gov.com' }), now), null, now);
    expect(wrongName).toMatchObject({ ok: false, code: 'NAME_MISMATCH' });
    const expired = judgeIdentity(toIdentity(host, cert({ valid_to: 'Jan  1 00:00:00 2026 GMT' }), now), null, now);
    expect(expired).toMatchObject({ ok: false, code: 'EXPIRED' });
  });

  it('verifier aborts on a changed CA unless an operator approved that exact certificate', () => {
    const observed = {};
    const other = cert({ fingerprint256: 'EE:66', issuer: { O: 'Some Other CA' } });
    expect(() => makeCertificateVerifier({ [host]: baseline }, observed, { now })(host, other)).toThrow(IdentityError);
    expect(() => makeCertificateVerifier({ [host]: baseline }, observed, { now, approvedFingerprint: 'EE:66' })(host, other)).not.toThrow();
  });

  it('refuses DNS answers pointing at private or internal addresses', async () => {
    for (const ip of ['10.0.0.5', '127.0.0.1', '192.168.1.1', '172.16.0.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', '::ffff:10.1.1.1',
      '::ffff:7f00:1', '64:ff9b::a00:1', '2002:a00:1::1', 'fec0::1', '192.0.0.8', '192.0.2.1', '198.51.100.1', '203.0.113.9', 'not-an-ip']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    expect(isPrivateAddress('156.99.1.10')).toBe(false);
    expect(isPrivateAddress('2607:f8b0:4005::1')).toBe(false);
    const rebind = (async () => [{ address: '169.254.169.254', family: 4 }]) as never;
    await expect(assertPublicDns(host, rebind)).rejects.toThrow(/non-public/);
    const ok = (async () => [{ address: '156.99.1.10', family: 4 }]) as never;
    await expect(assertPublicDns(host, ok)).resolves.toEqual(['156.99.1.10']);
  });
});

describe('Assessor corroboration', () => {
  it('confirms only parcels the Assessor returns', async () => {
    let asked = '';
    const fake = (async (u: string) => {
      asked = new URL(u).searchParams.get('where') ?? '';
      return new Response(JSON.stringify({ features: [{ attributes: { APN: '13801406008' } }] }), { headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    const found = await confirmParcelsExist(['138-01-406-008', '999-99-999-999'], ['maps.clarkcountynv.gov'], { fetchImpl: fake });
    expect([...found]).toEqual(['138-01-406-008']);
    expect(asked).toContain("APN IN ('13801406008','99999999999')");
  });

  it('fails (rather than confirming) when the Assessor errors, and never sends malformed input', async () => {
    const err = (async () => new Response(JSON.stringify({ error: { code: 400 } }), { headers: { 'content-type': 'application/json' } })) as typeof fetch;
    await expect(confirmParcelsExist(['138-01-406-008'], ['maps.clarkcountynv.gov'], { fetchImpl: err })).rejects.toThrow(/Assessor query failed/);
    await expect(confirmParcelsExist(["1') OR 1=1 --"], ['maps.clarkcountynv.gov'])).rejects.toThrow(/malformed APN/);
  });
});

describe('Assessor land use', () => {
  const page = (lu: string) => `<html><body><table><tr><td>Land Use</td><td>${lu}</td></tr><tr><td>Dwelling Units</td><td>1</td></tr></table></body></html>`;

  it('reads the land-use code and description from a parcel page', async () => {
    const { parseLandUse } = await import('./lib/landUse');
    expect(parseLandUse(page('20.110 - Single Family Residential'))).toEqual({ code: '20.110', description: 'Single Family Residential' });
    expect(parseLandUse(page('41.335.C - Offices, Professional and Business Services. Cond'))).toMatchObject({ code: '41.335.C' });
    expect(parseLandUse('<p>no land use here</p>')).toBeNull();
    expect(parseLandUse(page('<script>alert(1)</script>'))).toBeNull();
  });

  it('never blocks a run: unreadable pages just leave parcels unclassified', async () => {
    const { fetchLandUse } = await import('./lib/landUse');
    const fake = (async (u: string) =>
      new URL(u).searchParams.get('hdnParcel') === '13801406008'
        ? new Response(page('42.311 - Casino or Hotel Casino. Hotels - Class 2'), { headers: { 'content-type': 'text/html' } })
        : new Response('oops', { status: 500, headers: { 'content-type': 'text/html' } })) as typeof fetch;
    const got = await fetchLandUse(['138-01-406-008', '162-23-210-001', 'bad'], ['maps.clarkcountynv.gov'], { fetchImpl: fake }, 0);
    expect([...got.entries()]).toEqual([['138-01-406-008', { code: '42.311', description: 'Casino or Hotel Casino. Hotels - Class 2' }]]);
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
    expect(pollIntervalMinutes(SRC, base)).toBe(360);
    const hourly = ['2027-01-01T00:00:00Z', '2027-01-01T01:00:00Z', '2027-01-01T02:00:00Z', '2027-01-01T03:00:00Z'];
    expect(pollIntervalMinutes(SRC, { ...base, changeTimes: hourly })).toBe(15);
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-03T12:00:00Z' })).toBe(60);
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-02T08:00:00Z' })).toBe(15);
    expect(pollIntervalMinutes(SRC, { ...base, nextAuctionAt: '2027-05-02T08:00:00Z', consecutiveErrors: 2 })).toBe(60);
  });

  it('verification lifetime shrinks with the poll interval', () => {
    expect(maxAgeMinutes(SRC, 360)).toBe(750);
    expect(maxAgeMinutes(SRC, 15)).toBe(60);
  });
});

const row = (apn: string, over: Partial<ParsedRow> = {}): ParsedRow => ({
  apn,
  address: null,
  minimumBid: 1000,
  withdrawn: false,
  sold: false,
  groupApn: null,
  personalPropertyExcluded: false,
  auctionStartsAt: '2027-05-13T15:00:00.000Z',
  ...over,
});
const result = (rows: ParsedRow[], auctionKey = '22'): ParseResult => ({
  auctionKey,
  auctionStartsAt: rows[0]?.auctionStartsAt ?? '2027-05-13T15:00:00.000Z',
  auctionFormat: 'In-Person',
  auctionLocation: 'Commission Chambers',
  events: [],
  rows,
  rejected: [],
});
const apn = (i: number) => `161-20-11${String(i).padStart(5, '0').slice(0, 1)}-${String(i).padStart(3, '0').slice(-3)}`;

function stateWith(n: number, now: Date, confirmAll = true): SourceState {
  const rows = Array.from({ length: n }, (_, i) => row(apn(i), { minimumBid: 1000 + i }));
  return applySnapshot(emptyState(SRC.id), result(rows), {
    sha256: SHA,
    sourceUrl: SRC.officialUrl,
    now,
    confirmedApns: new Set(confirmAll ? rows.map((r) => r.apn) : []),
  });
}

describe('reconcile and anomaly quarantine', () => {
  const now = new Date('2027-05-01T12:00:00Z');

  it('keeps parcels the Assessor did not confirm out of availability', () => {
    const s = stateWith(3, now, false);
    expect(Object.values(s.listings).map((l) => l.state)).toEqual(['UNCONFIRMED', 'UNCONFIRMED', 'UNCONFIRMED']);
    expect(s.message).toMatch(/not found in Assessor/);
  });

  it('withdraws parcels that are lined out or drop off the list', () => {
    const s = stateWith(3, now);
    const next = applySnapshot(s, result([row(apn(0), { withdrawn: true })]), { sha256: 'b'.repeat(64), sourceUrl: SRC.officialUrl, now, confirmedApns: new Set() });
    expect(Object.values(next.listings).every((l) => l.state === 'WITHDRAWN')).toBe(true);
  });

  it('quarantines vanished parcels, injected parcels and bid manipulation', () => {
    const prev = stateWith(40, now);
    const keep = Object.values(prev.listings).map((l) => row(l.apn, { minimumBid: l.minimumBid }));
    expect(detectAnomalies(prev, result(keep), now)).toEqual([]);
    expect(detectAnomalies(prev, result(keep.slice(0, 10)), now)[0].code).toBe('MASS_REMOVAL');
    const injected = [...keep, ...Array.from({ length: 15 }, (_, i) => row(`999-00-000-${String(i).padStart(3, '0')}`))];
    expect(detectAnomalies(prev, result(injected), now)[0].code).toBe('MASS_ADDITION');
    expect(detectAnomalies(prev, result(keep.map((r) => ({ ...r, minimumBid: 1 }))), now)[0].code).toBe('BID_SHIFT');
  });

  it('does not flag normal events: bulk line-outs, post-auction results, a new auction cycle', () => {
    const prev = stateWith(40, now);
    const keep = Object.values(prev.listings).map((l) => row(l.apn, { minimumBid: l.minimumBid }));
    expect(detectAnomalies(prev, result(keep.map((r) => ({ ...r, withdrawn: true }))), now)).toEqual([]);
    expect(detectAnomalies(prev, result([]), new Date('2027-05-14T00:00:00Z'))).toEqual([]);
    expect(detectAnomalies(prev, result([row('161-99-000-001')], '23'), now)).toEqual([]);
  });
});

describe('published feed', () => {
  const t0 = new Date('2027-05-01T12:00:00Z');
  const hours = (h: number) => new Date(t0.getTime() + h * 3_600_000);

  it('publishes only fresh, confirmed, available listings with a scheduled auction', () => {
    const s = stateWith(3, t0);
    expect(buildFeed([SRC], { [SRC.id]: s }, t0).listings).toHaveLength(3);
    const stale = buildFeed([SRC], { [SRC.id]: s }, hours(13));
    expect(stale.listings).toHaveLength(0);
    expect(stale.sources[0].health).toBe('stale');
    expect(buildFeed([{ ...SRC, termsReviewedAt: null }], { [SRC.id]: s }, t0).listings).toHaveLength(0);
    expect(buildFeed([SRC], { [SRC.id]: { ...s, health: 'quarantined' } }, t0).listings).toHaveLength(0);
    expect(buildFeed([SRC], { [SRC.id]: stateWith(3, t0, false) }, t0).listings).toHaveLength(0);
    const noDate = { ...s, listings: Object.fromEntries(Object.entries(s.listings).map(([k, l]) => [k, { ...l, auctionStartsAt: null }])) };
    expect(buildFeed([SRC], { [SRC.id]: noDate }, t0).listings).toHaveLength(0);
  });

  it('publishes nothing from the real May 2026 data today (auction already held)', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    const { parsed, sha256 } = parseSnapshot(REAL);
    const s = applySnapshot(emptyState(SRC.id), parsed, { sha256, sourceUrl: SRC.officialUrl, now, confirmedApns: new Set(parsed.rows.map((r) => r.apn)) });
    expect(buildFeed([SRC], { [SRC.id]: s }, now).listings).toHaveLength(0);
  });
});

describe('signed feed (anti-spoofing)', () => {
  const now = new Date('2027-05-01T12:00:00Z');
  const keys = generateSigningKeys();
  const feed = buildFeed([SRC], { [SRC.id]: stateWith(2, now) }, now);
  const bytes = new TextEncoder().encode(JSON.stringify(feed));
  const sig = signBytes(bytes, loadPrivateKey(keys.privatePem));
  const subtle = webcrypto.subtle as unknown as SubtleCrypto;
  const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
  const signed = (f: unknown) => {
    const b = new TextEncoder().encode(JSON.stringify(f));
    return [buf(b), signBytes(b, loadPrivateKey(keys.privatePem))] as const;
  };

  it('accepts listings with a valid land use, and older feeds without one', async () => {
    const [b, s] = signed({ ...feed, listings: [{ ...feed.listings[0], landUse: { code: '41.335.C', description: 'Offices' } }, { ...feed.listings[1], landUse: undefined }] });
    const r = await verifyFeed(b, s, keys.publicSpkiB64, now, subtle);
    expect(r.ok && r.feed.listings.length).toBe(2);
  });

  it('accepts a genuine feed in Node and in the browser verifier', async () => {
    expect(verifyBytes(bytes, sig, keys.publicSpkiB64)).toBe(true);
    const r = await verifyFeed(buf(bytes), sig, keys.publicSpkiB64, now, subtle);
    expect(r.ok && r.feed.listings.length).toBe(2);
  });

  it('rejects a tampered listing, a foreign key, and an expired feed', async () => {
    const tampered = new TextEncoder().encode(JSON.stringify({ ...feed, listings: [{ ...feed.listings[0], minimumBid: 1 }] }));
    expect(await verifyFeed(buf(tampered), sig, keys.publicSpkiB64, now, subtle)).toMatchObject({ ok: false, reason: 'BAD_SIGNATURE' });
    const forged = signBytes(bytes, loadPrivateKey(generateSigningKeys().privatePem));
    expect(await verifyFeed(buf(bytes), forged, keys.publicSpkiB64, now, subtle)).toMatchObject({ ok: false, reason: 'BAD_SIGNATURE' });
    expect(await verifyFeed(buf(bytes), sig, keys.publicSpkiB64, new Date('2027-05-03T00:00:00Z'), subtle)).toMatchObject({ ok: false, reason: 'EXPIRED' });
    expect(await verifyFeed(buf(bytes), sig, null, now, subtle)).toMatchObject({ ok: false, reason: 'NOT_CONFIGURED' });
  });

  it('drops signed listings that link off official hosts or lack Assessor confirmation', async () => {
    for (const bad of [{ sourceUrl: 'https://evil.example/pay-here' }, { corroboratedAt: null }, { auctionStartsAt: null }, { groupApn: '<b>x</b>' }, { landUse: { code: 'x', description: 'y' } }, { landUse: { code: '20.110', description: null } }]) {
      const [b, s] = signed({ ...feed, listings: [{ ...feed.listings[0], ...bad }] });
      const r = await verifyFeed(b, s, keys.publicSpkiB64, now, subtle);
      expect(r.ok && r.feed.listings.length, JSON.stringify(bad)).toBe(0);
    }
  });
});
