import { describe, expect, it } from 'vitest';
import { listingToProperty, liveId, typeFromLandUse } from './toProperty';
import type { FeedListing } from './types';
import { moneySummary } from '../lib/rules';
import { diligenceReport } from '../lib/diligence';
import { applyFilters, DEFAULT_FILTERS } from '../lib/search';
import { defaultsFor, maxSafeBid } from '../lib/bidCalc';

const L: FeedListing = {
  sourceId: 'nv-clark-treasurer-tax-sale',
  apn: '161-17-510-031',
  address: '4731 FUENTES WAY',
  minimumBid: 25587.87,
  auctionId: '2027-05',
  auctionStartsAt: '2027-05-06T15:00:00.000Z',
  auctionFormat: 'In-Person',
  auctionLocation: 'Commission Chambers, 500 S Grand Central Pkwy',
  groupApn: null,
  personalPropertyExcluded: true,
  state: 'AVAILABLE',
  corroboratedAt: '2027-03-30T00:00:00.000Z',
  firstSeenAt: '2027-03-01T08:00:00.000Z',
  lastVerifiedAt: '2027-03-31T00:00:00.000Z',
  sourceUrl: 'https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList',
  landUse: { code: '20.110', description: 'Single Family Residential' },
  snapshotSha256: 'a'.repeat(64),
};

describe('verified listing → property', () => {
  it('fills in only what the Treasurer and Assessor publish, and marks the rest unknown', () => {
    const p = listingToProperty(L);
    expect(p).toMatchObject({
      id: liveId(L.apn),
      origin: 'treasurer-feed',
      propertyType: 'Single Family',
      status: 'IN_PERSON_AUCTION',
      estimatedMarketValue: null,
      assessedValue: null,
      lat: null,
      ownerOfRecord: null,
      flags: null,
      liensChecked: false,
      occupancy: 'Unknown',
    });
    expect(p.sale).toMatchObject({ saleType: 'TAX_DEED', minimumBid: 25587.87, officialUrl: L.sourceUrl, buyerPremiumPct: 0, startsAt: L.auctionStartsAt });
    expect(p.sale!.eligibility).toMatch(/Personal property is not included/);
    expect(p.events[0].source).toMatchObject({ agency: 'Clark County Treasurer', url: L.sourceUrl, confidence: 'high' });
  });

  it('maps Assessor land use to a property type, never guessing when it can’t tell', () => {
    const t = (code: string, description: string) => typeFromLandUse({ code, description });
    expect(t('21.170', 'Condominium')).toBe('Condo');
    expect(t('31.000', 'Duplex')).toBe('Multi-Family');
    expect(t('33.150', 'Apartments')).toBe('Apartments (5+ units)');
    expect(t('14.000', 'Vacant - Commercial')).toBe('Commercial Land');
    expect(t('44.100', 'Hotel')).toBe('Hotel / Motel');
    expect(t('42.311', 'General Commercial')).toBe('Other commercial');
    expect(t('51.250', 'Warehouse')).toBe('Industrial');
    expect(t('41.460', 'Government Facilities')).toBe('Not classified');
    expect(t('13.000', 'Vacant - Multi-residential')).toBe('Not classified');
    expect(typeFromLandUse(null)).toBe('Not classified');
  });

  it('shows no spread, and asks for a lien search, instead of implying there are no liens', () => {
    const p = listingToProperty(L);
    expect(moneySummary(p).estimatedEquity).toBeNull();
    const liens = diligenceReport(p).filter((c) => ['Mortgages and assignments', 'Federal tax liens', 'Liens and apparent priority'].includes(c.area));
    expect(liens).toHaveLength(3);
    for (const c of liens) expect(c).toMatchObject({ result: 'manual', detail: expect.stringMatching(/Not searched/) });
    expect(diligenceReport(p).find((c) => c.area === 'Zoning and land use')).toMatchObject({ result: 'manual' });
    // It's being sold for delinquent taxes: never "current".
    expect(diligenceReport(p).find((c) => c.area === 'Property-tax status')).toMatchObject({ result: 'review', detail: expect.stringMatching(/^Delinquent/) });
    expect(diligenceReport(p).find((c) => c.area === 'Foreclosure stage')).toMatchObject({ result: 'manual' });
    expect(diligenceReport(p).find((c) => c.area === 'Estimated spread')!.detail).not.toMatch(/No minimum bid/);
  });

  it('is searchable (but never matches a map area it has no location for) and starts the calculator without a value', () => {
    const p = listingToProperty(L);
    expect(applyFilters([p], { ...DEFAULT_FILTERS, saleTypes: ['TAX_DEED'] })).toHaveLength(1);
    expect(applyFilters([p], { ...DEFAULT_FILTERS, location: '161-17-510-031' })).toHaveLength(1);
    expect(applyFilters([p], { ...DEFAULT_FILTERS, bounds: [35, -116, 37, -114] })).toHaveLength(0);
    expect(applyFilters([p], { ...DEFAULT_FILTERS, propertyClass: 'residential' })).toHaveLength(1);
    expect(defaultsFor(p).exitValue).toBe(0);
    expect(maxSafeBid(defaultsFor(p)).maxBid).toBe(0);
  });
});
