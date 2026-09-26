// Links that let a buyer see a property before bidding: listing photos at the source, Google Street
// View, and Clark County's own aerial view and building sketch. We link to them rather than copying
// images: listing photos belong to whoever took them, and the source always has the current set.
// Only for properties that are actually for sale. Homes in pre-foreclosure get none of these links,
// because the Assessor's record names the owner and we never help anyone contact those homeowners.

const APN = /^(\d{3})-(\d{2})-(\d{3})-(\d{3})$/;
const COUNTY_MAPS = 'https://maps.clarkcountynv.gov';

/** Clark County parcel number without dashes, or null if it isn't a real one. Sample data uses book 000, which doesn't exist. */
export function parcelDigits(apn: string): string | null {
  const m = APN.exec(apn.trim());
  return m && m[1] !== '000' ? m.slice(1).join('') : null;
}

export interface ViewLink {
  key: 'listing' | 'street' | 'aerial' | 'sketch' | 'assessor';
  label: string;
  detail: string;
  url: string;
  source: string;
}

export interface ViewInput {
  apn: string;
  address: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  listingUrl?: string | null; // the property's own page at the seller (HUD, HomePath, bank), when known
}

const coord = (n: number | null | undefined, max: number) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= max;

export function streetViewUrl(v: Pick<ViewInput, 'address' | 'city' | 'lat' | 'lng'>): string | null {
  if (coord(v.lat, 90) && coord(v.lng, 180) && !(v.lat === 0 && v.lng === 0)) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${v.lat!.toFixed(6)},${v.lng!.toFixed(6)}`;
  }
  if (!v.address?.trim()) return null;
  const q = [v.address.trim(), v.city?.trim(), 'NV'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function propertyViews(v: ViewInput): ViewLink[] {
  const links: ViewLink[] = [];
  if (v.listingUrl && /^https:\/\//.test(v.listingUrl)) {
    links.push({ key: 'listing', label: 'Listing photos', detail: 'Photos from the seller’s own listing, when it has them', url: v.listingUrl, source: 'Seller' });
  }
  const sv = streetViewUrl(v);
  if (sv) links.push({ key: 'street', label: 'Street View', detail: 'The outside of the home and the street, from Google', url: sv, source: 'Google Maps' });
  const digits = parcelDigits(v.apn);
  if (digits) {
    links.push(
      { key: 'aerial', label: 'Aerial view', detail: 'The lot, roof, pool and neighbors from above', url: `${COUNTY_MAPS}/openweb/?getParcel=${digits}`, source: 'Clark County' },
      { key: 'sketch', label: 'Building sketch', detail: 'The Assessor’s outline of the building and its areas', url: `${COUNTY_MAPS}/assessor/webimages/default.asp?appID=2&txtAPN=${digits}`, source: 'Clark County Assessor' },
      { key: 'assessor', label: 'Assessor record', detail: 'Values, size, year built and sales history', url: `${COUNTY_MAPS}/assessor/AssessorParcelDetail/parceldetail.aspx?hdnParcel=${digits}`, source: 'Clark County Assessor' },
    );
  }
  return links;
}
