// The property types that have their own page under Learn (#/learn/types/<key>), in lesson order.

export const PROPERTY_TOPICS = [
  { key: 'singleFamily', slug: 'single-family', title: 'Single-family houses', group: 'Residential' },
  { key: 'condo', slug: 'condo', title: 'Condos and townhouses', group: 'Residential' },
  { key: 'smallMultifamily', slug: 'duplex-fourplex', title: 'Duplexes to fourplexes (2–4 units)', group: 'Residential' },
  { key: 'manufactured', slug: 'manufactured', title: 'Manufactured homes', group: 'Residential' },
  { key: 'multifamily', slug: 'apartments', title: 'Apartment buildings (5+ units)', group: 'Commercial' },
  { key: 'retail', slug: 'retail', title: 'Retail property', group: 'Commercial' },
  { key: 'office', slug: 'office', title: 'Office buildings', group: 'Commercial' },
  { key: 'industrial', slug: 'industrial', title: 'Industrial and warehouses', group: 'Commercial' },
  { key: 'mixedUse', slug: 'mixed-use', title: 'Mixed-use buildings', group: 'Commercial' },
  { key: 'hotel', slug: 'hotels', title: 'Hotels and motels', group: 'Commercial' },
  { key: 'selfStorage', slug: 'self-storage', title: 'Self-storage', group: 'Commercial' },
  { key: 'land', slug: 'land', title: 'Raw land', group: 'Land' },
] as const;

export type PropertyKey = (typeof PROPERTY_TOPICS)[number]['key'];
export const topicBySlug = (slug: string) => PROPERTY_TOPICS.find((t) => t.slug === slug);
export const topicHref = (key: PropertyKey) => `#/learn/types/${PROPERTY_TOPICS.find((t) => t.key === key)!.slug}`;
