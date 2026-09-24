// Connector: Clark County Treasurer delinquent-property (trustee) auction list.
//
// The Treasurer publishes the list of parcels held in trust for non-payment of taxes and
// updates it daily as owners pay; paid parcels are lined out and are no longer eligible.
//
// This parser is FAIL-CLOSED:
//  - It locates the table by header names, not by position. If the required columns
//    (parcel number and minimum bid) are missing, the whole snapshot is rejected
//    (SchemaDriftError). A layout change can never silently produce wrong listings.
//  - Every row is validated. Bad APNs, bad amounts, duplicates and unrecognized statuses
//    are rejected rather than guessed at. If too many rows fail, the snapshot is rejected.
//  - Lined-out rows (<s>/<del>/<strike>, line-through styling) and status text such as
//    "redeemed", "paid" or "withdrawn" mark a parcel as withdrawn.
//
// NOTE: written against the Treasurer's published description of the list. Validate it
// against the live page (npm run ingest -- --dry-run) before enabling scheduled runs.

import { parse, type HTMLElement } from 'node-html-parser';

export class SchemaDriftError extends Error {}

export interface ParsedRow {
  apn: string;
  address: string | null;
  minimumBid: number;
  withdrawn: boolean;
  auctionStartsAt: string | null;
}

export interface ParseResult {
  auctionStartsAt: string | null;
  rows: ParsedRow[];
  rejected: { row: number; reason: string }[];
}

const HEADER_ALIASES = {
  apn: /^(parcel(\s*(number|no\.?|#))?|apn)$/i,
  minimumBid: /^(min(imum)?\.?\s*bid|minimum\s*bid\s*amount|opening\s*bid)$/i,
  address: /^(address|situs(\s*address)?|location|property\s*address)$/i,
  status: /^(status|remarks?|notes?)$/i,
  auctionDate: /^(auction|sale)\s*date$/i,
} as const;

const WITHDRAWN_TEXT = /\b(redeemed|paid|withdrawn|removed|cancell?ed|not\s+available|pulled|bankruptcy)\b/i;
const AVAILABLE_TEXT = /^(|active|available|open|for\s+sale|eligible)$/i;
const MAX_REJECT_RATIO = 0.05;

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function normalizeApn(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
}

export function parseMoney(raw: string): number | null {
  const s = clean(raw).replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n < 50_000_000 ? n : null;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Converts a Las Vegas wall-clock time to an ISO UTC string (handles PST/PDT). */
export function pacificToIso(y: number, mo: number, d: number, h: number, mi: number): string {
  const guess = Date.UTC(y, mo, d, h, mi);
  const offsetOf = (t: number) => {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'longOffset' })
      .formatToParts(new Date(t))
      .find((p) => p.type === 'timeZoneName')!.value; // "GMT-07:00"
    const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000 : 0;
  };
  const first = guess - offsetOf(guess);
  return new Date(guess - offsetOf(first)).toISOString();
}

/** Finds "Month D, YYYY" (and optional "h:mm a.m.") in text. */
export function parseAuctionDate(text: string): string | null {
  const m = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),\s*(\d{4})(?:[^0-9]{0,40}?(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?)?/i,
  );
  if (!m) return null;
  let hour = m[4] ? Number(m[4]) % 12 : 8; // Treasurer auctions have historically started at 8:00 a.m.
  if (m[6]?.toLowerCase() === 'p') hour += 12;
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (day < 1 || day > 31 || year < 2000 || year > 2100) return null;
  return pacificToIso(year, MONTHS.indexOf(m[1].toLowerCase()), day, hour, m[5] ? Number(m[5]) : 0);
}

function isLinedOut(el: HTMLElement): boolean {
  if (el.querySelector('s, del, strike')) return true;
  const styled = [el, ...el.querySelectorAll('*')];
  return styled.some(
    (x) => /line-through/i.test(x.getAttribute('style') ?? '') || /\b(strike|lined|withdrawn|redeemed)\b/i.test(x.getAttribute('class') ?? ''),
  );
}

export function parseAuctionList(html: string): ParseResult {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: false } });

  // Find the first table whose header row contains the required columns.
  let table: HTMLElement | null = null;
  let col: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  for (const t of root.querySelectorAll('table')) {
    const headerCells = t.querySelectorAll('tr')[0]?.querySelectorAll('th, td') ?? [];
    const found: typeof col = {};
    headerCells.forEach((c, i) => {
      const text = clean(c.text);
      for (const [key, re] of Object.entries(HEADER_ALIASES) as [keyof typeof HEADER_ALIASES, RegExp][]) {
        if (found[key] === undefined && re.test(text)) found[key] = i;
      }
    });
    if (found.apn !== undefined && found.minimumBid !== undefined) {
      table = t;
      col = found;
      break;
    }
  }
  if (!table) throw new SchemaDriftError('No table with "Parcel" and "Minimum Bid" columns found. Page layout may have changed.');

  const pageText = clean(root.querySelector('body')?.text ?? root.text);
  const auctionIdx = pageText.search(/auction/i);
  const pageDate = parseAuctionDate(auctionIdx >= 0 ? pageText.slice(auctionIdx) : pageText) ?? parseAuctionDate(pageText);

  const rows: ParsedRow[] = [];
  const rejected: ParseResult['rejected'] = [];
  const seen = new Set<string>();
  const trs = table.querySelectorAll('tr').slice(1);

  trs.forEach((tr, i) => {
    const cells = tr.querySelectorAll('td');
    if (!cells.length || cells.every((c) => !clean(c.text))) return; // spacer row
    const cell = (k: keyof typeof HEADER_ALIASES) => (col[k] !== undefined ? clean(cells[col[k]!]?.text ?? '') : '');

    const apn = normalizeApn(cell('apn'));
    if (!apn) return void rejected.push({ row: i + 1, reason: `invalid parcel number "${cell('apn')}"` });
    if (seen.has(apn)) return void rejected.push({ row: i + 1, reason: `duplicate parcel ${apn}` });
    seen.add(apn);

    const minimumBid = parseMoney(cell('minimumBid'));
    if (minimumBid === null) return void rejected.push({ row: i + 1, reason: `invalid minimum bid "${cell('minimumBid')}" for ${apn}` });

    const status = cell('status');
    const withdrawn = isLinedOut(tr) || WITHDRAWN_TEXT.test(status);
    if (!withdrawn && !AVAILABLE_TEXT.test(status)) {
      return void rejected.push({ row: i + 1, reason: `unrecognized status "${status}" for ${apn}` });
    }

    const rowDate = col.auctionDate !== undefined ? parseAuctionDate(cell('auctionDate')) : null;
    const address = cell('address') || null;
    rows.push({ apn, address: address && address.length <= 200 ? address : null, minimumBid, withdrawn, auctionStartsAt: rowDate ?? pageDate });
  });

  const total = rows.length + rejected.length;
  if (total === 0) throw new SchemaDriftError('Auction table has no parcel rows.');
  if (rejected.length / total > MAX_REJECT_RATIO) {
    throw new SchemaDriftError(`${rejected.length} of ${total} rows failed validation (limit ${MAX_REJECT_RATIO * 100}%). First: ${rejected[0].reason}`);
  }
  return { auctionStartsAt: pageDate, rows, rejected };
}
