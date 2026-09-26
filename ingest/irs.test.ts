import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseIndex, parseIrsSnapshot, parseMinimumBid, parseSaleDate, SchemaDriftError } from './connectors/irsAuctions';
import { applyIrsSnapshot } from './lib/irsReconcile';
import { emptyState } from './lib/reconcile';
import { buildFeed } from './lib/publish';
import { generateSigningKeys, loadPrivateKey, signBytes } from './lib/sign';
import { getSource, validateRegistry } from './sources/registry';
import { verifyFeed } from '../src/feed/verify';
import { federalSaleToProperty } from '../src/feed/toProperty';

/** 8 real ads (2026-09-26, notice text trimmed) plus made-up Nevada ads; see the fixture README. */
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

  it('reads the minimum bid in the formats the site uses', () => {
    expect(parseMinimumBid('137027.61')).toBe(137027.61);
    expect(parseMinimumBid('2.14063013e+06')).toBe(2140630.13);
    expect(parseMinimumBid('')).toBeNull();
    expect(parseMinimumBid('call')).toBe('invalid');
  });

  it('keeps only Clark County real estate with a parcel number', () => {
    const r = parseIndex(INDEX);
    expect(r.totalAds).toBe(15);
    expect(r.rows.map((x) => x.id)).toEqual(['made-up-las-vegas-home', 'made-up-judicial-sale-henderson', 'made-up-canceled-condo', 'made-up-tba-home']);
    expect(r.skipped).toEqual([{ id: 'made-up-2021-pickup-truck', reason: 'no Clark County parcel number in the notice' }]);
    const [home, judicial, canceled, tba] = r.rows;
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

  it('publishes open, Assessor-confirmed sales once the terms are reviewed', () => {
    expect(buildFeed([{ ...IRS, termsReviewedAt: null }], { [IRS.id]: state() }, NOW).federalSales).toBeUndefined();
    const feed = buildFeed([ON], { [IRS.id]: state() }, NOW);
    expect(feed.federalSales!.map((f) => f.id)).toEqual(['made-up-las-vegas-home', 'made-up-judicial-sale-henderson']);
    expect(feed.sources[0].message).toMatch(/15 ads nationwide; 4 in Clark County; 1 Clark County ad\(s\) not shown/);
  });

  it('hides a sale unless every parcel in it is confirmed, and after the sale', () => {
    const partial = new Set([...all].filter((a) => a !== '999-01-101-002'));
    expect(buildFeed([ON], { [IRS.id]: state(partial) }, NOW).federalSales!.map((f) => f.id)).toEqual(['made-up-judicial-sale-henderson']);
    const later = new Date('2026-11-19T12:00:00Z');
    const s = { ...state(), lastSuccessAt: later.toISOString(), federalSales: Object.fromEntries(Object.entries(state().federalSales!).map(([k, v]) => [k, { ...v, lastVerifiedAt: later.toISOString() }])) };
    expect(buildFeed([ON], { [IRS.id]: s }, later).federalSales!.map((f) => f.id)).toEqual(['made-up-judicial-sale-henderson']);
  });

  it('withdraws a sale that is canceled or removed from the site', () => {
    const first = state();
    const gone = JSON.parse(INDEX).filter((a: { url: string }) => !a.url.includes('made-up-las-vegas-home'));
    const snap2 = parseIrsSnapshot(JSON.stringify(gone));
    const next = applyIrsSnapshot(first, snap2.parsed, { sha256: snap2.sha256, now: NOW, confirmedApns: all });
    expect(next.federalSales!['made-up-las-vegas-home'].state).toBe('WITHDRAWN');
    expect(next.federalSales!['made-up-canceled-condo'].state).toBe('WITHDRAWN');
  });

  it('becomes a property with the right terms for each kind of sale', () => {
    const [home, judicial] = buildFeed([ON], { [IRS.id]: state() }, NOW).federalSales!;
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
    expect(await check(feed)).toBe(2);
    expect(await check({ ...feed, federalSales: undefined })).toBe(0);
    const f = feed.federalSales![0];
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
});
