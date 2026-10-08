import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { labeledParcels, parseIndex, parseIrsSnapshot, parseMinimumBid, parseSaleDate, SchemaDriftError, TIME_ZONE } from './connectors/irsAuctions';
import { countyOf } from './lib/countyOf';
import { timeZoneFor } from '../src/lib/regions';
import { applyIrsSnapshot, detectIrsAnomalies } from './lib/irsReconcile';
import { emptyState } from './lib/reconcile';
import { buildFeed } from './lib/publish';
import { generateSigningKeys, loadPrivateKey, signBytes } from './lib/sign';
import { getSource, validateRegistry } from './sources/registry';
import { verifyFeed } from '../src/feed/verify';
import { federalSaleToProperty } from '../src/feed/toProperty';

/** 8 real ads (2026-09-26, notice text trimmed) plus made-up ads in the states we cover; see the fixture README. */
const INDEX = readFileSync(new URL('./fixtures/irs-2026-09/index.json', import.meta.url), 'utf8');
const IRS = getSource('us-irs-auctions');
const ON = { ...IRS, termsReviewedAt: '2026-09-26' };
const NOW = new Date('2026-11-01T17:00:00Z');

describe('IRS source registry', () => {
  it('reads only the site’s own index on the exact .gov host, with the terms review recorded', () => {
    expect(() => validateRegistry()).not.toThrow();
    expect(IRS.allowedHosts).toEqual(['www.irsauctions.gov']);
    expect(IRS.fetchUrl).toBe('https://www.irsauctions.gov/index.json');
    expect(IRS.termsReviewedAt).toBe('2026-09-26');
  });
});

describe('IRS auctions index', () => {
  it('parses sale dates in Las Vegas time, and refuses missing ones', () => {
    expect(parseSaleDate('Nov 18, 2026 10:00 AM')).toBe('2026-11-18T18:00:00.000Z'); // PST
    expect(parseSaleDate('Sep 24, 2026 10:00 AM')).toBe('2026-09-24T17:00:00.000Z'); // PDT
    expect(parseSaleDate('Dec 03, 2026 12:30 PM')).toBe('2026-12-03T20:30:00.000Z');
    for (const bad of ['Sale date To Be Announced/Determined', '', 'Feb 30, 2027 1:00 PM', 'Sept 24, 2026']) expect(parseSaleDate(bad), bad).toBeNull();
  });

  it('reads each state’s sale times in its own time zone (Arizona has no daylight saving time)', () => {
    expect(parseSaleDate('Jul 15, 2027 10:00 AM', TIME_ZONE.AZ)).toBe('2027-07-15T17:00:00.000Z');
    expect(parseSaleDate('Jan 15, 2027 10:00 AM', TIME_ZONE.AZ)).toBe('2027-01-15T17:00:00.000Z');
    expect(parseSaleDate('Jul 15, 2027 10:00 AM', TIME_ZONE.UT)).toBe('2027-07-15T16:00:00.000Z');
    expect(parseSaleDate('Jan 15, 2027 10:00 AM', TIME_ZONE.UT)).toBe('2027-01-15T17:00:00.000Z');
    expect(parseSaleDate('Jul 15, 2027 10:00 AM', TIME_ZONE.CA)).toBe('2027-07-15T17:00:00.000Z');
    expect(parseSaleDate('Jul 15, 2027 10:00 AM', TIME_ZONE.TX)).toBe('2027-07-15T15:00:00.000Z');
    // El Paso and Hudspeth counties are on Mountain time.
    expect(parseSaleDate('Jul 15, 2027 10:00 AM', timeZoneFor('TX', 'El Paso'))).toBe('2027-07-15T16:00:00.000Z');
  });

  it('reads parcel numbers outside Clark County only where the notice labels them', () => {
    expect(labeledParcels('APN: 020-120-110 and Assessor’s Parcel No. 10767006C')).toEqual(['020-120-110', '10767006C']);
    expect(labeledParcels("Assessor's Parcel Number: 0310-672-35-0000. AIN 5555-012-034.")).toEqual(['0310-672-35-0000', '5555-012-034']);
    expect(labeledParcels('Parcel ID 15-22-301-004-0000; Parcel #: 302-15-117A')).toEqual(['15-22-301-004-0000', '302-15-117A']);
    // Phone numbers, prices, ZIPs and short numbers are never taken for a parcel.
    expect(labeledParcels('Call 602-555-0100. Minimum bid $150,000. ZIP 85201. APN 12-3.')).toEqual([]);
    expect(labeledParcels('APN <script>1234567</script>')).toEqual([]);
  });

  it('names the county from the city, or from the county the ad names when the city spans several', () => {
    expect(countyOf('NV', 'Reno', '')).toBe('Washoe');
    expect(countyOf('AZ', 'Mesa', '')).toBe('Maricopa');
    expect(countyOf('CA', 'Los Angeles', '')).toBe('Los Angeles');
    expect(countyOf('CA', 'Unincorporated San Bernardino County', '')).toBe('San Bernardino');
    expect(countyOf('CA', 'Nowhereville', 'property in Santa Cruz County')).toBe('Santa Cruz');
    expect(countyOf('CA', 'Nowhereville', 'Riverside County or San Diego County')).toBeNull();
    expect(countyOf('UT', 'Nowhereville', '')).toBeNull();
    // Texas: Austin spans three counties, so it needs the county named in the ad.
    expect(countyOf('TX', 'El Paso', '')).toBe('El Paso');
    expect(countyOf('TX', 'Austin', '')).toBeNull();
    expect(countyOf('TX', 'Austin', 'located in Travis County, Texas')).toBe('Travis');
  });

  it('reads the minimum bid in the formats the site uses', () => {
    expect(parseMinimumBid('137027.61')).toBe(137027.61);
    expect(parseMinimumBid('2.14063013e+06')).toBe(2140630.13);
    expect(parseMinimumBid('')).toBeNull();
    expect(parseMinimumBid('call')).toBe('invalid');
  });

  it('keeps real estate in NV, CA, AZ and UT with a known county and a parcel number', () => {
    const r = parseIndex(INDEX);
    expect(r.totalAds).toBe(17);
    expect(r.rows.map((x) => x.id)).toEqual([
      'made-up-las-vegas-home',
      'made-up-judicial-sale-henderson',
      'made-up-canceled-condo',
      'made-up-tba-home',
      'made-up-reno-home',
      'made-up-pahrump-land',
      'made-up-mesa-land',
    ]);
    expect(r.skipped).toEqual([
      { id: 'made-up-2021-pickup-truck', reason: 'no Clark County parcel number in the notice' },
      { id: 'made-up-unknown-town', reason: 'county not identified' },
    ]);
    const [home, judicial, canceled, tba, reno, pahrump, mesa] = r.rows;
    for (const x of [home, judicial, canceled, tba]) expect(x).toMatchObject({ usState: 'NV', county: 'Clark', assessorChecked: true });
    expect(reno).toMatchObject({ usState: 'NV', county: 'Washoe', assessorChecked: false, apns: ['999-05-501-006'] });
    expect(pahrump).toMatchObject({ usState: 'NV', county: 'Nye', assessorChecked: false });
    // Arizona time (no daylight saving time); the phone number in the notice isn't read as a parcel.
    expect(mesa).toMatchObject({ usState: 'AZ', county: 'Maricopa', assessorChecked: false, apns: ['999-07-701A'], saleStartsAt: '2026-11-18T17:00:00.000Z', minimumBid: 50000 });
    expect(home).toMatchObject({
      apns: ['999-01-101-001', '999-01-101-002'],
      address: '1234 Example Ave',
      city: 'Las Vegas',
      zip: '89101',
      saleKind: 'ADMINISTRATIVE',
      saleFormat: 'Public auction',
      minimumBid: 185000,
      saleStartsAt: '2026-11-18T18:00:00.000Z',
      saleLocation: 'Example Federal Building, 100 Example St, Las Vegas, NV 89101',
      canceled: false,
      sourceUrl: 'https://www.irsauctions.gov/ad/made-up-las-vegas-home/',
    });
    expect(judicial).toMatchObject({ apns: ['999-02-201-003'], saleKind: 'JUDICIAL', saleFormat: 'Sealed bid', minimumBid: null, address: null, city: 'Henderson' });
    expect(canceled.canceled).toBe(true);
    expect(tba.saleStartsAt).toBeNull();
    // The notice text (which names the taxpayer) is never kept.
    expect(JSON.stringify(r)).not.toMatch(/TEST TAXPAYER|nonpayment/);
  });

  it('fails closed when the index is not what the site publishes', () => {
    expect(() => parseIndex('<html>Access denied</html>')).toThrow(SchemaDriftError);
    expect(() => parseIndex('{"items":[]}')).toThrow(/not a list/);
    expect(() => parseIndex('[]')).toThrow(/only 0 ads/);
    const ads = JSON.parse(INDEX).map((a: Record<string, unknown>) => ({ ...a, minimumBid: undefined }));
    expect(() => parseIndex(JSON.stringify(ads))).toThrow(/minimumBid/);
  });
});

describe('IRS sales in the feed', () => {
  const snap = parseIrsSnapshot(INDEX);
  const all = new Set(snap.parsed.rows.flatMap((r) => r.apns));
  const state = (confirmed = all) => applyIrsSnapshot(emptyState(IRS.id), snap.parsed, { sha256: snap.sha256, now: NOW, confirmedApns: confirmed });

  const ids = (st: ReturnType<typeof state>, at = NOW) => buildFeed([ON], { [IRS.id]: st }, at).federalSales!.map((f) => f.id);
  const OUTSIDE_CLARK = ['made-up-mesa-land', 'made-up-pahrump-land', 'made-up-reno-home'];

  it('publishes open sales once the terms are reviewed, Clark County ones only when the Assessor confirms them', () => {
    expect(buildFeed([{ ...IRS, termsReviewedAt: null }], { [IRS.id]: state() }, NOW).federalSales).toBeUndefined();
    const feed = buildFeed([ON], { [IRS.id]: state() }, NOW);
    expect(feed.federalSales!.map((f) => f.id)).toEqual(['made-up-mesa-land', 'made-up-las-vegas-home', 'made-up-pahrump-land', 'made-up-reno-home', 'made-up-judicial-sale-henderson']);
    expect(feed.sources[0].message).toBe('The IRS index contains 17 notices nationwide, including past, canceled and undated notices. These are not counts of available auctions. We parsed 7 notices in Nevada, California, Arizona, Utah or Texas, 4 of them in Clark County. 5 upcoming sales meet our publication checks as of this source check. Only eligible upcoming sales appear in the feed; stale or held sources can hide them. 2 additional notices in those states aren’t shown here because the notice has no Clark County parcel number, or the notice doesn’t name the county.');
    // Outside Clark County nothing is claimed as checked by DeedOwl.
    for (const f of feed.federalSales!.filter((x) => x.county !== 'Clark')) expect(f.corroboratedAt).toBeNull();
  });

  it('hides a Clark County sale unless every parcel in it is confirmed, and every sale after it happens', () => {
    const partial = new Set([...all].filter((a) => a !== '999-01-101-002'));
    expect(ids(state(partial))).toEqual(['made-up-mesa-land', 'made-up-pahrump-land', 'made-up-reno-home', 'made-up-judicial-sale-henderson']);
    expect(ids(state(new Set()))).toEqual(OUTSIDE_CLARK);
    const later = new Date('2026-11-19T12:00:00Z');
    const s = { ...state(), lastSuccessAt: later.toISOString(), federalSales: Object.fromEntries(Object.entries(state().federalSales!).map(([k, v]) => [k, { ...v, lastVerifiedAt: later.toISOString() }])) };
    expect(ids(s, later)).toEqual(['made-up-judicial-sale-henderson']);
  });

  it('counts only upcoming eligible sales and upcoming unconfirmed parcels in the source explanation', () => {
    const later = new Date('2026-11-19T12:00:00Z');
    const checked = applyIrsSnapshot(emptyState(IRS.id), snap.parsed, { sha256: snap.sha256, now: later, confirmedApns: all });
    expect(checked.message).toContain('1 upcoming sale meets our publication checks');
    const unconfirmed = applyIrsSnapshot(emptyState(IRS.id), snap.parsed, { sha256: snap.sha256, now: later, confirmedApns: new Set() });
    expect(unconfirmed.message).toContain('0 upcoming sales meet our publication checks');
    expect(unconfirmed.message).toContain('1 upcoming sale is hidden because the parcel');
    expect(buildFeed([ON], { [IRS.id]: unconfirmed }, later).federalSales ?? []).toEqual([]);
  });

  it('withdraws a sale that is canceled or removed from the site', () => {
    const first = state();
    const gone = JSON.parse(INDEX).filter((a: { url: string }) => !a.url.includes('made-up-las-vegas-home'));
    const snap2 = parseIrsSnapshot(JSON.stringify(gone));
    const next = applyIrsSnapshot(first, snap2.parsed, { sha256: snap2.sha256, now: NOW, confirmedApns: all });
    expect(next.federalSales!['made-up-las-vegas-home'].state).toBe('WITHDRAWN');
    expect(next.federalSales!['made-up-canceled-condo'].state).toBe('WITHDRAWN');
  });

  it('holds a changed minimum bid, a moved sale or a burst of new sales for review (anti-spoofing)', () => {
    const first = state();
    expect(detectIrsAnomalies(first, snap.parsed, NOW)).toEqual([]);
    const home = snap.parsed.rows.find((r) => r.id === 'made-up-las-vegas-home')!;
    const edit = (patch: Partial<typeof home>) => ({ ...snap.parsed, rows: snap.parsed.rows.map((r) => (r.id === home.id ? { ...r, ...patch } : r)) });
    expect(detectIrsAnomalies(first, edit({ minimumBid: (home.minimumBid ?? 1000) * 10 }), NOW).map((a) => a.code)).toEqual(['BID_SHIFT']);
    expect(detectIrsAnomalies(first, edit({ saleLocation: 'Somewhere Else, Reno NV' }), NOW).map((a) => a.code)).toEqual(['LOCATION_CHANGE']);
    expect(detectIrsAnomalies(first, edit({ canceled: true }), NOW)).toEqual([]); // postponements and cancellations are normal
    const burst = { ...snap.parsed, rows: [...snap.parsed.rows, ...Array.from({ length: 12 }, (_, i) => ({ ...home, id: `new-${i}` }))] };
    expect(detectIrsAnomalies(first, burst, NOW).map((a) => a.code)).toEqual(['MASS_ADDITION']);
    // Past and canceled ads (which appear all at once when a state is first covered) never count as a burst.
    const old = { ...snap.parsed, rows: [...snap.parsed.rows, ...Array.from({ length: 30 }, (_, i) => ({ ...home, id: `old-${i}`, canceled: i % 2 === 0, saleStartsAt: i % 2 ? '2026-01-01T18:00:00.000Z' : home.saleStartsAt }))] };
    expect(detectIrsAnomalies(first, old, NOW)).toEqual([]);
  });

  it('becomes a property with the right terms for each kind of sale', () => {
    const sales = buildFeed([ON], { [IRS.id]: state() }, NOW).federalSales!;
    const [home, judicial] = ['made-up-las-vegas-home', 'made-up-judicial-sale-henderson'].map((id) => sales.find((f) => f.id === id)!);
    const p = federalSaleToProperty(home);
    expect(p).toMatchObject({ id: 'irs-made-up-las-vegas-home', origin: 'irs-feed', apn: '999-01-101-001', address: '1234 Example Ave', city: 'Las Vegas', zip: '89101', liensChecked: false, ownerOfRecord: null, estimatedMarketValue: null });
    expect(p.sale).toMatchObject({ saleType: 'FEDERAL_TAX_SEIZURE', minimumBid: 185000, startsAt: '2026-11-18T18:00:00.000Z' });
    expect(p.sale!.redemptionPeriod).toMatch(/^180 days/);
    expect(p.sale!.eligibility).toMatch(/Sold together with parcel 999-01-101-002/);
    const j = federalSaleToProperty(judicial);
    expect(j.status).toBe('SEALED_BID');
    expect(j.sale!.redemptionPeriod).toMatch(/court order/);
    expect(j.sale!.whatYouBuy).toMatch(/federal court/);
  });

  it('the browser accepts signed IRS sales only with links to irsauctions.gov ads', async () => {
    const keys = generateSigningKeys();
    const subtle = webcrypto.subtle as unknown as SubtleCrypto;
    const feed = buildFeed([ON], { [IRS.id]: state() }, NOW);
    const check = async (f: unknown) => {
      const b = new TextEncoder().encode(JSON.stringify(f));
      const r = await verifyFeed(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, signBytes(b, loadPrivateKey(keys.privatePem)), keys.publicSpkiB64, NOW, subtle);
      return r.ok ? r.feed.federalSales!.length : -1;
    };
    expect(await check(feed)).toBe(5);
    expect(await check({ ...feed, federalSales: undefined })).toBe(0);
    const f = feed.federalSales!.find((x) => x.id === 'made-up-las-vegas-home')!;
    for (const bad of [
      { sourceUrl: 'https://www.irsauctions.gov.evil.example/ad/x/' },
      { sourceUrl: 'https://www.irsauctions.gov/pay?x=1' },
      { apns: [] },
      { zip: '89501' },
      { corroboratedAt: null },
      { saleStartsAt: '' },
      { minimumBid: 0 },
      { saleKind: 'OTHER' },
    ]) {
      expect(await check({ ...feed, federalSales: [{ ...f, ...bad }] }), JSON.stringify(bad)).toBe(0);
    }
  });

  it('the browser accepts sales outside Clark County only with a county of that state and no DeedOwl check claimed', async () => {
    const keys = generateSigningKeys();
    const subtle = webcrypto.subtle as unknown as SubtleCrypto;
    const feed = buildFeed([ON], { [IRS.id]: state() }, NOW);
    const check = async (f: unknown) => {
      const b = new TextEncoder().encode(JSON.stringify(f));
      const r = await verifyFeed(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, signBytes(b, loadPrivateKey(keys.privatePem)), keys.publicSpkiB64, NOW, subtle);
      return r.ok ? r.feed.federalSales!.length : -1;
    };
    const mesa = feed.federalSales!.find((x) => x.id === 'made-up-mesa-land')!;
    expect(await check({ ...feed, federalSales: [mesa] })).toBe(1);
    for (const bad of [
      { county: 'Clark' }, // not an Arizona county
      { county: 'Nowhere' },
      { county: undefined },
      { usState: 'TX' },
      { corroboratedAt: NOW.toISOString() },
      { apns: ['<script>'] },
      { apns: ['12'] },
      { zip: '8520' },
    ]) {
      expect(await check({ ...feed, federalSales: [{ ...mesa, ...bad }] }), JSON.stringify(bad)).toBe(0);
    }
  });
});
