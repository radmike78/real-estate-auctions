// Turns a verified Clark County Treasurer listing into a Property the rest of the site can show:
// search, property pages, My deals, the bid calculator and due diligence. Only facts the Treasurer
// and the Assessor publish are filled in. Everything else stays empty (null) so pages say "not
// checked" instead of guessing: no market value, no lien search, no map location, no risk flags.

import type { FeedListing } from './types';
import type { Property, PropertyType, SourceRef } from '../types';
import { classOfLandUse } from '../lib/propertyClass';

export const LIVE_ID_PREFIX = 'tax-';
export const liveId = (apn: string) => `${LIVE_ID_PREFIX}${apn}`;

/** A coarse property type from the Assessor land-use code and description. */
export function typeFromLandUse(landUse: FeedListing['landUse']): PropertyType {
  if (!landUse) return 'Not classified';
  const family = Number(landUse.code.slice(0, 2));
  const d = landUse.description;
  const cls = classOfLandUse(landUse.code);
  if (cls === null) return 'Not classified';
  if (family === 12) return 'Vacant Land';
  if (family === 14 || family === 15) return 'Commercial Land';
  if (family >= 20 && family <= 29) return /condo/i.test(d) ? 'Condo' : /town/i.test(d) ? 'Townhouse' : 'Single Family';
  if (family >= 30 && family <= 32) return 'Multi-Family';
  if (family >= 33 && family <= 39) return 'Apartments (5+ units)';
  if (family >= 50 && family <= 59) return 'Industrial';
  if (/hotel|motel|casino|resort|lodg/i.test(d)) return 'Hotel / Motel';
  if (/office/i.test(d)) return 'Office';
  if (/retail|store|shop|market/i.test(d)) return 'Retail';
  return 'Other commercial';
}

export function listingToProperty(l: FeedListing, agency = 'Clark County Treasurer'): Property {
  const source: SourceRef = { agency, url: l.sourceUrl, lastVerified: l.lastVerifiedAt, confidence: 'high' };
  const online = /online/i.test(l.auctionFormat ?? '');
  const notes = [
    l.groupApn ? `Sold together with parcel group ${l.groupApn} as one bid.` : null,
    l.personalPropertyExcluded ? 'Personal property is not included in the sale.' : null,
  ].filter(Boolean);
  return {
    id: liveId(l.apn),
    origin: 'treasurer-feed',
    apn: l.apn,
    address: l.address ?? `Parcel ${l.apn} (no street address)`,
    city: 'Clark County',
    county: 'Clark',
    state: 'NV',
    zip: '',
    lat: null,
    lng: null,
    legalDescription: null,
    ownerOfRecord: null,
    propertyType: typeFromLandUse(l.landUse),
    landUse: l.landUse ?? null,
    beds: null,
    baths: null,
    sqft: null,
    lotSqft: null,
    yearBuilt: null,
    assessedValue: null,
    estimatedMarketValue: null,
    lastSale: null,
    occupancy: 'Unknown',
    status: online ? 'ONLINE_BIDDING' : 'IN_PERSON_AUCTION',
    sale: {
      saleType: 'TAX_DEED',
      conductedBy: agency,
      startsAt: l.auctionStartsAt,
      endsAt: null,
      location: l.auctionLocation ?? l.auctionFormat ?? 'See the official auction notice',
      officialUrl: l.sourceUrl,
      minimumBid: l.minimumBid,
      deposit: 'Set in the official auction notice ($5,000 per bidder in recent auctions, in certified funds)',
      registrationDeadline: null,
      paymentMethods: ['Cash', "Cashier's check", 'Wire', 'Money order'],
      finalPaymentDeadline: null,
      buyerPremiumPct: 0,
      deedType: 'Quitclaim deed from the Treasurer, recorded within 30 days, to the name on your registration form',
      redemptionPeriod: 'None after the auction. The former owner can protest the sale for 2 years, and title insurance may be unavailable meanwhile',
      eligibility: notes.length ? notes.join(' ') : null,
      postponements: 0,
    },
    liens: [],
    liensChecked: false,
    events: [{ date: l.firstSeenAt.slice(0, 10), type: 'SALE_SCHEDULED', description: "On the Clark County Treasurer's tax-sale auction list", source }],
    flags: null,
    lastUpdated: l.lastVerifiedAt,
  };
}
