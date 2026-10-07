import type { Drill } from './drills';

/**
 * How each drill is shown on the Practice page: the kind of sale (big, in its own colour), the property, one labelled
 * money fact from the drill and the missions it asks. Everything here comes from the drill's own facts and missions;
 * nothing new is claimed.
 */

/** A topic picks the card's icon. Colours are handed out by position (see HUE_COUNT), so cards side by side never match. */
export const HUE_COUNT = 10;
export type Topic = 'trustee' | 'tax' | 'taxlien' | 'hoa' | 'sheriff' | 'irs' | 'bank' | 'short' | 'rental' | 'flip' | 'brrrr' | 'commercial' | 'manufactured' | 'land';

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
  bank: 'listed', short: 'listed', rental: 'listed', flip: 'flip', brrrr: 'flip', commercial: 'commercial', manufactured: 'manufactured', land: 'land',
};

interface CardInfo {
  /** The kind of sale or deal, shown large: "HOA sale". Where the group already names the kind (commercial, land,
   * manufactured homes), the specific property instead ("Retail strip", "10 acres"), so a row doesn't repeat one word.
   * Drills that share a kind of sale and sit in the same row add a few words from their question ("IRS sale: paying later"). */
  sale: string;
  topic: Topic;
  /** The property or general type, shown small in the "Drill · …" line: "Condo", "Commercial". */
  property: string;
}

const CARDS: Record<string, CardInfo> = {
  'rental-265': { sale: 'Rental numbers', topic: 'rental', property: 'House' },
  'trustee-sale-nv': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'tax-deed-nv': { sale: 'Tax sale', topic: 'tax', property: 'House' },
  'hoa-sale-nv': { sale: 'HOA sale', topic: 'hoa', property: 'Condo' },
  'hoa-fannie-nv': { sale: 'HOA sale: a Fannie Mae loan', topic: 'hoa', property: 'Townhouse' },
  'hoa-sale-ca': { sale: 'HOA sale', topic: 'hoa', property: 'Condo' },
  'hoa-sale-az': { sale: 'HOA sale', topic: 'hoa', property: 'Home' },
  'hoa-sale-ut': { sale: 'HOA sale', topic: 'hoa', property: 'Townhome' },
  'sheriff-sale-nv': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'irs-sale': { sale: 'IRS sale: the 180-day wait', topic: 'irs', property: 'House' },
  'irs-deferred-payment': { sale: 'IRS sale: paying later', topic: 'irs', property: 'House' },
  'irs-senior-liens': { sale: 'IRS sale: liens that stay', topic: 'irs', property: 'Duplex' },
  'irs-redeemed': { sale: 'IRS sale: the owner buys it back', topic: 'irs', property: 'House' },
  'bank-owned': { sale: 'Bank-owned', topic: 'bank', property: 'House' },
  'short-sale': { sale: 'Short sale', topic: 'short', property: 'House' },
  'tax-lien-az': { sale: 'Tax lien', topic: 'taxlien', property: 'Vacant land' },
  'trustee-sale-ca': { sale: 'Trustee’s sale', topic: 'trustee', property: 'Duplex' },
  'tax-deed-ca': { sale: 'Tax sale', topic: 'tax', property: 'Vacant lot' },
  'sheriff-sale-ca': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'tax-sale-ut': { sale: 'Tax sale', topic: 'tax', property: 'Cabin lot' },
  'trustee-sale-ut': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'sheriff-sale-ut': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'trustee-sale-az': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'sheriff-sale-az': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'House' },
  'retail-strip': { sale: 'Retail strip', topic: 'commercial', property: 'Commercial' },
  'apartments-12': { sale: '12 apartments', topic: 'commercial', property: 'Commercial' },
  'office-lease-up': { sale: 'Office lease-up', topic: 'commercial', property: 'Commercial' },
  'warehouse-environmental': { sale: 'Warehouse', topic: 'commercial', property: 'Commercial' },
  'commercial-tax-sale': { sale: 'Commercial tax sale', topic: 'commercial', property: 'Former restaurant' },
  'commercial-trustee-sale': { sale: 'Commercial trustee’s sale', topic: 'commercial', property: 'Retail building' },
  'commercial-receiver-sale': { sale: 'Receiver’s sale', topic: 'commercial', property: 'Office building' },
  'commercial-bank-auction': { sale: 'Commercial auction', topic: 'commercial', property: 'Industrial building' },
  'flip-numbers': { sale: 'Fix and flip: the profit', topic: 'flip', property: 'House' },
  'flip-delays': { sale: 'Fix and flip: delays', topic: 'flip', property: 'House' },
  'brrrr-appraisal': { sale: 'BRRRR: a low appraisal', topic: 'brrrr', property: 'House' },
  'brrrr-rates': { sale: 'BRRRR: rates rise', topic: 'brrrr', property: 'House' },
  'manufactured-own-land': { sale: 'Double-wide on 1 acre', topic: 'manufactured', property: 'Manufactured home' },
  'manufactured-park-nv': { sale: 'Home in a park', topic: 'manufactured', property: 'Manufactured home' },
  'mobile-home-1974': { sale: '1974 mobile home', topic: 'manufactured', property: 'Mobile home' },
  'land-access': { sale: '10 acres', topic: 'land', property: 'Land' },
  'land-unsubdivided-az': { sale: '4 acres', topic: 'land', property: 'Land' },
  'land-build-lot': { sale: 'Building lot', topic: 'land', property: 'Land' },
  'trustee-sale-tx': { sale: 'Trustee’s sale', topic: 'trustee', property: 'House' },
  'tax-deed-tx': { sale: 'Tax sale', topic: 'tax', property: 'House' },
  'hoa-sale-tx': { sale: 'HOA sale', topic: 'hoa', property: 'House' },
  'sheriff-sale-tx': { sale: 'Sheriff’s sale', topic: 'sheriff', property: 'Rental house' },
};

/** Facts whose label says what the dollar amount is (a bid, a price, the debt being sold for). */
const MONEY_FACT = /^(opening bid|minimum bid|starting bid|asking price|list price|lot price|price|your (winning |maximum )?bid|your price|lien amount|hoa (lien|debt|judgment)|judgment|all in)$/i;
/** When a drill has none of those, its key value or sale figure, in this order (all from the drill's own facts). */
const KEY_FACTS = [/^value( as-is)?$/i, /^sale price$/i, /^loan being foreclosed$/i, /^market rent( \(example\))?$/i];
/** A dollar amount, keeping "about" and a rate unit when the fact has them. */
const AMOUNT = /(about )?\$\d{1,3}(,\d{3})*(\.\d+)?( million)?( per sq ft)?( a (year|month))?/i;

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
  const hasAmount = (x: Drill['facts'][number]) => AMOUNT.test(x.value);
  const f =
    d.facts.find((x) => MONEY_FACT.test(x.label.trim()) && hasAmount(x)) ??
    KEY_FACTS.map((re) => d.facts.find((x) => re.test(x.label.trim()) && hasAmount(x))).find(Boolean);
  const raw = f?.value.match(AMOUNT)?.[0];
  // "About $300,000" stays "about $300,000": the card never reads more exact than the drill.
  const amount = raw && /^about /i.test(raw) ? `about ${raw.slice(6)}` : raw;
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

const STATE_WORDS: Record<string, string> = { NV: 'Nevada', CA: 'California', AZ: 'Arizona', UT: 'Utah', TX: 'Texas' };

/**
 * A drill's text without its state's name, for a visitor who chose that state (the page already says "Texas rules"):
 * "A Texas sheriff is selling" reads "A sheriff is selling", "Bluebonnet County, Texas." reads "Bluebonnet County."
 * Only the chosen state's name goes; another state's name still says something.
 */
export function withoutState(text: string, state: string | null | undefined): string {
  const name = state ? STATE_WORDS[state] : undefined;
  if (!name) return text;
  const article = (orig: string, next: string) => {
    const an = /^([aeiou]|HOA\b|IRS\b)/i.test(next) && !/^(one|uni|use|usu)/i.test(next);
    const w = an ? 'an' : 'a';
    return /^[A-Z]/.test(orig) ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  };
  return text
    .replace(new RegExp(`\\b(A|An|a|an) ${name} (\\S+)`, 'g'), (_m, art: string, next: string) => `${article(art, next)} ${next}`)
    .replace(new RegExp(` in ${name}\\b`, 'g'), '')
    .replace(new RegExp(`, ${name}\\b`, 'g'), '');
}
