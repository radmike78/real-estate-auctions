import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { htmlTables, parseCertificateTable, parseSaleNotices, parseSidPage, parseSidSnapshot, SchemaDriftError } from './connectors/sidCertificateSale';
import { applySidSnapshot, detectSidAnomalies } from './lib/sidReconcile';
import { emptyState } from './lib/reconcile';
import { buildFeed } from './lib/publish';
import { generateSigningKeys, loadPrivateKey, signBytes } from './lib/sign';
import { AGENT_HOSTS, getSource, SOURCES, validateRegistry } from './sources/registry';
import { verifyFeed } from '../src/feed/verify';

const dir = new URL('./fixtures/amg-2026-09/', import.meta.url);
/** The real notice-of-sale page (Henderson sale announced, list not posted yet). */
const PAGE = readFileSync(new URL('page.html', dir), 'utf8');
/** A MADE-UP list (book 999 parcels, fake names) until the real one is posted. */
const LIST = readFileSync(new URL('made-up-list.html', dir), 'utf8');
const withList = (list = LIST) => PAGE.replace('</body>', `${list}</body>`);

const SID = getSource('nv-clark-sid-certificate-sale');
const ON = { ...SID, termsReviewedAt: '2026-10-06', parserVerifiedAt: '2026-10-06' };
const NOW = new Date('2026-10-10T17:00:00Z');

describe('SID source registry', () => {
  it('allows the agent host only for the source it publishes, and still corroborates on .gov', () => {
    expect(() => validateRegistry()).not.toThrow();
    expect(SID.allowedHosts).toEqual(['www.amgnv.com']);
    expect(AGENT_HOSTS['www.amgnv.com'].confirmedBy).toMatch(/^https:\/\/www\.clarkcountynv\.gov\//);
    expect(() => validateRegistry([{ ...SID, publishedBy: undefined }])).toThrow(/only allowed for sources published by/);
    expect(() => validateRegistry([{ ...SOURCES[0], allowedHosts: ['www.amgnv.com'], fetchUrl: 'https://www.amgnv.com/x', officialUrl: 'https://www.amgnv.com/x' }])).toThrow(/only allowed/);
    expect(() => validateRegistry([{ ...SID, allowedHosts: ['amgnv.com'] }])).toThrow(/not an exact \.gov/);
    expect(() => validateRegistry([{ ...SID, corroborationHosts: ['www.amgnv.com'] }])).toThrow(/corroboration host/);
    expect(() => validateRegistry([{ ...SID, corroborationHosts: [] }])).toThrow(/corroboration host/);
  });

  it('stays off until the terms and the real list are checked', () => {
    expect(SID.termsReviewedAt).toBeNull();
    expect(SID.parserVerifiedAt).toBeNull();
  });
});

describe('SID notice-of-sale page (real page, 2026-09-26)', () => {
  it('reads the announced sale and finds no list yet', () => {
    expect(parseSaleNotices(PAGE)).toEqual([{ jurisdiction: 'City of Henderson', saleDate: '2026-10-27' }]);
    const r = parseSidPage(PAGE, NOW);
    expect(r).toMatchObject({ sale: null, rows: [], rejected: [] });
  });

  it('ignores announcements for other places and impossible dates', () => {
    expect(parseSaleNotices('<p>City of Reno - October 27, 2026</p><p>Clark County - February 30, 2027</p><p>Clark County - January 28, 2027</p>')).toEqual([
      { jurisdiction: 'Clark County', saleDate: '2027-01-28' },
    ]);
  });
});

describe('SID certificate list (made-up list)', () => {
  it('reads parcel, address, district and amount, and never the owner', () => {
    const r = parseSidPage(withList(), NOW);
    expect(r.sale).toEqual({ jurisdiction: 'City of Henderson', saleDate: '2026-10-27' });
    expect(r.rejected).toEqual([]);
    expect(r.rows).toEqual([
      { apn: '999-01-101-001', district: 'SID 128', amountDue: 1234.56, address: '100 EXAMPLE ST' },
      { apn: '999-01-101-002', district: 'SID 128', amountDue: 987, address: '102 EXAMPLE ST' },
      { apn: '999-02-201-003', district: 'LID 707', amountDue: 2500, address: null },
      { apn: '999-03-301-004', district: 'SID 155', amountDue: 310.25, address: '4 SAMPLE WAY' },
    ]);
    expect(JSON.stringify(r)).not.toMatch(/OWNER/);
  });

  it('skips layout tables that wrap the list', () => {
    const tables = htmlTables(`<table><tr><td>${LIST}</td></tr></table>`);
    expect(tables).toHaveLength(1);
    expect(tables[0][0]).toContain('Parcel Number');
  });

  it('refuses a list whose columns changed', () => {
    expect(() => parseCertificateTable([['SID', 'Parcel Number', 'Owner Name', 'Situs Address'], ['1', '999-01-101-001', 'X', 'Y']])).toThrow(/amount due/);
    expect(() => parseCertificateTable([['Parcel Number', 'Amount Due'], ['999-01-101-001', '$5.00']])).toThrow(/district/);
    // An owner column is never mistaken for another column, even if its header also says "address".
    expect(() => parseCertificateTable([['SID', 'Parcel', 'Owner Mailing Address', 'Amount'], ['1', '999-01-101-001', 'X', '$5.00']])).not.toThrow();
    expect(parseCertificateTable([['SID', 'Parcel', 'Owner Mailing Address', 'Amount'], ['1', '999-01-101-001', 'X', '$5.00']]).rows[0].address).toBeNull();
  });

  it('rejects the whole list when too many rows are bad', () => {
    const bad = LIST.replace('$987.00', 'see note').replace('999-03-301-004', 'N/A');
    expect(() => parseSidPage(withList(bad), NOW)).toThrow(SchemaDriftError);
  });

  it('refuses a list it cannot tie to exactly one upcoming sale, and ignores one after the sale', () => {
    const two = withList().replace('</body>', '<p>Clark County - October 29, 2026</p></body>');
    expect(() => parseSidPage(two, NOW)).toThrow(/2 upcoming sales/);
    expect(parseSidPage(withList(), new Date('2026-10-28T12:00:00Z'))).toMatchObject({ sale: null, rows: [] });
  });
});

describe('SID reconcile and feed', () => {
  const snap = parseSidSnapshot(withList(), NOW);
  const all = new Set(snap.parsed.rows.map((r) => r.apn));
  const meta = { sha256: snap.sha256, sourceUrl: SID.officialUrl, publishedBy: 'Assessment Management Group', now: NOW };

  it('publishes only Assessor-confirmed certificates once the source is enabled', () => {
    const s = applySidSnapshot(emptyState(SID.id), snap.parsed, { ...meta, confirmedApns: new Set([...all].slice(0, 3)) });
    expect(buildFeed([SID], { [SID.id]: s }, NOW).certificates).toBeUndefined(); // off: terms and list not checked
    expect(buildFeed([SID], { [SID.id]: s }, NOW).sources[0]).toMatchObject({ health: 'terms_not_reviewed', publishedBy: 'Assessment Management Group' });
    expect(buildFeed([{ ...SID, termsReviewedAt: '2026-10-06' }], { [SID.id]: s }, NOW).sources[0].message).toMatch(/first posted list/);
    const feed = buildFeed([ON], { [SID.id]: s }, NOW);
    expect(feed.certificates).toHaveLength(3);
    expect(feed.certificates![0]).toMatchObject({ jurisdiction: 'City of Henderson', saleDate: '2026-10-27', state: 'AVAILABLE' });
    expect(Object.keys(feed.certificates![0])).not.toContain('owner');
    expect(feed.listings).toEqual([]);
  });

  it('hides certificates after the sale and when they drop off the list', () => {
    const s = applySidSnapshot(emptyState(SID.id), snap.parsed, { ...meta, confirmedApns: all });
    expect(buildFeed([ON], { [SID.id]: { ...s, lastSuccessAt: '2026-10-28T08:00:00Z' } }, new Date('2026-10-28T09:00:00Z')).certificates).toBeUndefined();
    const paid = parseSidSnapshot(withList(LIST.replace(/<tr><td>SID 155[\s\S]*?<\/tr>/, '')), NOW);
    const next = applySidSnapshot(s, paid.parsed, { ...meta, sha256: paid.sha256, confirmedApns: all });
    expect(next.certificates!['SID 155|999-03-301-004'].state).toBe('WITHDRAWN');
    expect(buildFeed([ON], { [SID.id]: next }, NOW).certificates).toHaveLength(3);
  });

  it('quarantines a list that suddenly loses most certificates', () => {
    const big = { ...emptyState(SID.id), certificates: {} as NonNullable<ReturnType<typeof emptyState>['certificates']> };
    for (let i = 0; i < 30; i++) {
      const apn = `999-09-000-${String(i).padStart(3, '0')}`;
      big.certificates[`SID 1|${apn}`] = { ...applySidSnapshot(emptyState(SID.id), snap.parsed, { ...meta, confirmedApns: all }).certificates!['SID 128|999-01-101-001'], apn, district: 'SID 1' };
    }
    expect(detectSidAnomalies(big, snap.parsed).map((a) => a.code)).toEqual(['MASS_REMOVAL']);
  });

  it('the browser accepts signed certificates only from the agency or its named agent', async () => {
    const keys = generateSigningKeys();
    const subtle = webcrypto.subtle as unknown as SubtleCrypto;
    const s = applySidSnapshot(emptyState(SID.id), snap.parsed, { ...meta, confirmedApns: all });
    const feed = buildFeed([ON], { [SID.id]: s }, NOW);
    const check = async (f: unknown) => {
      const b = new TextEncoder().encode(JSON.stringify(f));
      const r = await verifyFeed(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, signBytes(b, loadPrivateKey(keys.privatePem)), keys.publicSpkiB64, NOW, subtle);
      return r.ok ? r.feed.certificates!.length : -1;
    };
    expect(await check(feed)).toBe(4);
    expect(await check({ ...feed, certificates: undefined })).toBe(0); // older feeds
    const c = feed.certificates![0];
    for (const bad of [{ sourceUrl: 'https://amgnv.com.evil.example/x' }, { corroboratedAt: null }, { saleDate: 'soon' }, { amountDue: -1 }, { apn: '1' }, { state: 'UNCONFIRMED' }]) {
      expect(await check({ ...feed, certificates: [{ ...c, ...bad }] }), JSON.stringify(bad)).toBe(0);
    }
  });
});
