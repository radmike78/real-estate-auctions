import type { AcquisitionStatus, Occupancy, Property, PropertyType, SaleType } from '../types';
import { moneySummary } from './rules';
import { classOfType, type ClassFilter } from './propertyClass';
import { STATUS } from './status';

export interface Filters {
  location: string; // "Las Vegas, NV" | "89123" | address | APN | county
  statuses: AcquisitionStatus[];
  saleTypes: SaleType[];
  bidding: 'any' | 'online' | 'in_person';
  auctionWithinDays: number | null;
  maxMinimumBid: number | null;
  minEquity: number | null;
  propertyClass: ClassFilter;
  propertyTypes: PropertyType[];
  occupancy: Occupancy | 'any';
  redemption: 'any' | 'none' | 'has';
  purchasableOnly: boolean;
  bounds: [south: number, west: number, north: number, east: number] | null;
  sort: 'auction' | 'equity' | 'minBid' | 'updated';
}

export const DEFAULT_FILTERS: Filters = {
  location: '',
  statuses: [],
  saleTypes: [],
  bidding: 'any',
  auctionWithinDays: null,
  maxMinimumBid: null,
  minEquity: null,
  propertyClass: 'all',
  propertyTypes: [],
  occupancy: 'any',
  redemption: 'any',
  purchasableOnly: false,
  bounds: null,
  sort: 'auction',
};

export type LocationQuery =
  | { kind: 'zip'; zip: string }
  | { kind: 'cityState'; city: string; state: string }
  | { kind: 'apn'; apn: string }
  | { kind: 'text'; text: string }
  | { kind: 'none' };

export function parseLocation(raw: string): LocationQuery {
  const s = raw.trim();
  if (!s) return { kind: 'none' };
  if (/^\d{5}(-\d{4})?$/.test(s)) return { kind: 'zip', zip: s.slice(0, 5) };
  if (/^\d{3}-?\d{2}-?\d{3}-?\d{3}$/.test(s)) return { kind: 'apn', apn: s.replace(/-/g, '') };
  const m = s.match(/^([A-Za-z .'-]+),\s*([A-Za-z]{2})$/);
  if (m) return { kind: 'cityState', city: m[1].trim().toLowerCase(), state: m[2].toUpperCase() };
  return { kind: 'text', text: s.toLowerCase() };
}

function matchesLocation(p: Property, q: LocationQuery): boolean {
  switch (q.kind) {
    case 'none':
      return true;
    case 'zip':
      return p.zip === q.zip;
    case 'apn':
      return p.apn.replace(/-/g, '') === q.apn;
    case 'cityState':
      return p.city.toLowerCase() === q.city && p.state === q.state;
    case 'text': {
      const hay = `${p.address} ${p.city} ${p.state} ${p.zip} ${p.county} county ${p.apn}`.toLowerCase();
      return q.text.split(/\s+/).every((t) => hay.includes(t.replace(/,$/, '')));
    }
  }
}

const isOnline = (p: Property) => p.status === 'ONLINE_BIDDING';
const isInPerson = (p: Property) => ['IN_PERSON_AUCTION', 'SEALED_BID', 'COURT_CONFIRMATION_REQUIRED'].includes(p.status);

export function applyFilters(all: Property[], f: Filters, now = new Date()): Property[] {
  const loc = parseLocation(f.location);
  const out = all.filter((p) => {
    if (!matchesLocation(p, loc)) return false;
    if (f.statuses.length && !f.statuses.includes(p.status)) return false;
    if (f.saleTypes.length && (!p.sale || !f.saleTypes.includes(p.sale.saleType))) return false;
    if (f.bidding === 'online' && !isOnline(p)) return false;
    if (f.bidding === 'in_person' && !isInPerson(p)) return false;
    if (f.purchasableOnly && !STATUS[p.status].purchasable) return false;
    if (f.propertyClass !== 'all' && classOfType(p.propertyType) !== f.propertyClass) return false;
    if (f.propertyTypes.length && !f.propertyTypes.includes(p.propertyType)) return false;
    if (f.occupancy !== 'any' && p.occupancy !== f.occupancy) return false;
    if (f.redemption !== 'any') {
      const has = !!p.sale?.redemptionPeriod && !/^none|expired/i.test(p.sale.redemptionPeriod);
      if ((f.redemption === 'has') !== has) return false;
    }
    if (f.auctionWithinDays !== null) {
      const start = p.sale?.startsAt ? new Date(p.sale.startsAt).getTime() : null;
      if (start === null || start < now.getTime() || start > now.getTime() + f.auctionWithinDays * 86_400_000) return false;
    }
    const money = moneySummary(p);
    if (f.maxMinimumBid !== null && (money.minimumBid === null || money.minimumBid > f.maxMinimumBid)) return false;
    if (f.minEquity !== null && (money.estimatedEquity === null || money.estimatedEquity < f.minEquity)) return false;
    if (f.bounds) {
      const [s, w, n, e] = f.bounds;
      if (p.lat === null || p.lng === null || p.lat < s || p.lat > n || p.lng < w || p.lng > e) return false;
    }
    return true;
  });

  // Upcoming sales first (soonest first), then past/undated ones.
  const auctionKey = (p: Property) => {
    const t = p.sale?.startsAt ? new Date(p.sale.startsAt).getTime() : null;
    return t === null || t < now.getTime() ? Number.MAX_SAFE_INTEGER : t;
  };
  const cmp: Record<Filters['sort'], (a: Property, b: Property) => number> = {
    auction: (a, b) => auctionKey(a) - auctionKey(b),
    equity: (a, b) => (moneySummary(b).estimatedEquity ?? -Infinity) - (moneySummary(a).estimatedEquity ?? -Infinity),
    minBid: (a, b) => (moneySummary(a).minimumBid ?? Infinity) - (moneySummary(b).minimumBid ?? Infinity),
    updated: (a, b) => b.lastUpdated.localeCompare(a.lastUpdated),
  };
  return out.sort(cmp[f.sort]);
}
