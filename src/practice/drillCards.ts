import type { Drill } from './drills';

/**
 * How each drill is shown on the Practice page: the kind of sale (big, in its own colour), the property, one labelled
 * money fact from the drill and the missions it asks. Everything here comes from the drill's own facts and missions;
 * nothing new is claimed.
 */

/** A topic is a colour and an icon. Colours name a kind of sale, never "safe" or "risky" (no green, red or amber). */
export type Topic = 'trustee' | 'tax' | 'taxlien' | 'hoa' | 'sheriff' | 'irs' | 'listed' | 'rental' | 'flip' | 'commercial' | 'manufactured' | 'land';

/** The filter groups readers choose from. */
export type TopicGroup = 'auctions' | 'listed' | 'flip' | 'commercial' | 'manufactured' | 'land';
export const TOPIC_GROUPS: { key: TopicGroup; label: string }[] = [
  { key: 'auctions', label: 'Auctions and tax liens' },
  { key: 'listed', label: 'Listed homes and rentals' },
  { key: 'flip', label: 'Flips and BRRRR' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'manufactured', label: 'Manufactured homes' },
  { key: 'land', label: 'Land' },
];

const GROUP_OF: Record<Topic, TopicGroup> = {
  trustee: 'auctions', tax: 'auctions', taxlien: 'auctions', hoa: 'auctions', sheriff: 'auctions', irs: 'auctions',
  listed: 'listed', rental: 'listed', flip: 'flip', commercial: 'commercial', manufactured: 'manufactured', land: 'land',
};

interface CardInfo {
  /** The kind of sale or deal, shown large: "HOA sale". */
  sale: string;
  topic: Topic;
  /** The property, shown as a tag beside the state: "Condo". */
  property: string;
}

const CARDS: Record<string, CardInfo> = {
  'rental-265': { sale: 'Rental numbers', topic: 'rental', property: 'House' },
  'trustee-sale-nv': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'tax-deed-nv': { sale: 'Tax sale', topic: 'tax', property: 'House' },
  'hoa-sale-nv': { sale: 'HOA sale', topic: 'hoa', property: 'Condo' },
  'hoa-fannie-nv': { sale: 'HOA sale', topic: 'hoa', property: 'Townhouse' },
  'hoa-sale-ca': { sale: 'HOA sale', topic: 'hoa', property: 'Condo' },
  'hoa-sale-az': { sale: 'HOA sale', topic: 'hoa', property: 'Home' },
  'hoa-sale-ut': { sale: 'HOA sale', topic: 'hoa', property: 'Townhome' },
  'sheriff-sale-nv': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'irs-sale': { sale: 'IRS sale', topic: 'irs', property: 'House' },
  'irs-deferred-payment': { sale: 'IRS sale', topic: 'irs', property: 'House' },
  'irs-senior-liens': { sale: 'IRS sale', topic: 'irs', property: 'Duplex' },
  'irs-redeemed': { sale: 'IRS sale', topic: 'irs', property: 'House' },
  'bank-owned': { sale: 'Bank-owned', topic: 'listed', property: 'House' },
  'short-sale': { sale: 'Short sale', topic: 'listed', property: 'House' },
  'tax-lien-az': { sale: 'Tax lien', topic: 'taxlien', property: 'Vacant land' },
  'trustee-sale-ca': { sale: 'Trustee’s sale', topic: 'trustee', property: 'Duplex' },
  'tax-deed-ca': { sale: 'Tax sale', topic: 'tax', property: 'Vacant lot' },
  'sheriff-sale-ca': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'tax-sale-ut': { sale: 'Tax sale', topic: 'tax', property: 'Cabin lot' },
  'trustee-sale-ut': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'sheriff-sale-ut': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'trustee-sale-az': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'sheriff-sale-az': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'retail-strip': { sale: 'Commercial', topic: 'commercial', property: 'Retail strip' },
  'apartments-12': { sale: 'Commercial', topic: 'commercial', property: '12 apartments' },
  'office-lease-up': { sale: 'Commercial', topic: 'commercial', property: 'Office building' },
  'warehouse-environmental': { sale: 'Commercial', topic: 'commercial', property: 'Warehouse' },
  'commercial-tax-sale': { sale: 'Commercial tax sale', topic: 'commercial', property: 'Former restaurant' },
  'commercial-trustee-sale': { sale: 'Commercial trustee’s sale', topic: 'commercial', property: 'Retail building' },
  'commercial-receiver-sale': { sale: 'Receiver’s sale', topic: 'commercial', property: 'Office building' },
  'commercial-bank-auction': { sale: 'Commercial auction', topic: 'commercial', property: 'Industrial building' },
  'flip-numbers': { sale: 'Fix and flip', topic: 'flip', property: 'House' },
  'flip-delays': { sale: 'Fix and flip', topic: 'flip', property: 'House' },
  'brrrr-appraisal': { sale: 'BRRRR', topic: 'flip', property: 'House' },
  'brrrr-rates': { sale: 'BRRRR', topic: 'flip', property: 'House' },
  'manufactured-own-land': { sale: 'Manufactured home', topic: 'manufactured', property: 'Double-wide on 1 acre' },
  'manufactured-park-nv': { sale: 'Manufactured home', topic: 'manufactured', property: 'Home in a park' },
  'mobile-home-1974': { sale: 'Mobile home', topic: 'manufactured', property: 'Home on its own lot' },
  'land-access': { sale: 'Land', topic: 'land', property: '10 acres' },
  'land-unsubdivided-az': { sale: 'Land', topic: 'land', property: '4 acres' },
  'land-build-lot': { sale: 'Land', topic: 'land', property: 'Building lot' },
  'trustee-sale-tx': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'tax-deed-tx': { sale: 'Tax sale', topic: 'tax', property: 'House' },
  'hoa-sale-tx': { sale: 'HOA sale', topic: 'hoa', property: 'House' },
  'sheriff-sale-tx': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'Rental house' },
};

/** Facts whose label says what the dollar amount is (a bid, a price, the debt being sold for). */
const MONEY_FACT = /^(opening bid|minimum bid|starting bid|asking price|list price|lot price|price|your (winning |maximum )?bid|your price|lien amount|hoa (lien|debt|judgment)|judgment|all in)$/i;

export interface DrillCard {
  sale: string;
  topic: Topic;
  group: TopicGroup;
  property: string;
  /** The decision the drill asks, as a short title: "Does the mortgage survive?" */
  question: string;
  /** One money fact with its label, or null when the drill has none to show. */
  fact: { label: string; value: string } | null;
  /** The mission questions, for "Your missions: …". */
  missions: string[];
}

export function drillCard(d: Drill): DrillCard {
  const info = CARDS[d.id] ?? { sale: 'Drill', topic: 'rental' as Topic, property: 'Property' };
  // "A Nevada HOA foreclosure: does the mortgage survive?" asks "Does the mortgage survive?"
  const colon = d.title.indexOf(': ');
  // Without a question, drop the state from the front: the card's tags already name it.
  const q = colon > 0 ? d.title.slice(colon + 2) : d.title.replace(/^An? (Nevada|California|Arizona|Utah|Texas) /, '');
  const f = d.facts.find((x) => MONEY_FACT.test(x.label.trim()));
  const amount = f?.value.match(/\$\d{1,3}(,\d{3})*(\.\d+)?( million)?/)?.[0];
  return {
    ...info,
    group: GROUP_OF[info.topic],
    question: q.charAt(0).toUpperCase() + q.slice(1),
    fact: f && amount ? { label: f.label, value: amount } : null,
    missions: d.missions.map((m) => m.title.replace(/^Mission \d+:\s*/, '')),
  };
}

/** Every drill has card details (checked by a test), so none falls back to the placeholder. */
export const hasCard = (id: string) => id in CARDS;
