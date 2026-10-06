// Connector: special improvement district (SID) lien-certificate sales in Clark County.
//
// Clark County and the cities (Las Vegas, Henderson, North Las Vegas) sell lien certificates for
// unpaid SID assessments under NRS 271. The Treasurer's certificate-sale page
// (clarkcountynv.gov/.../county_treasurer/certificate-sale) sends buyers to the notice-of-sale
// page run by Assessment Management Group (AMG), which publishes the lists for them. AMG is the
// only non-.gov host the ingester may contact (see AGENT_HOSTS in the registry).
//
// Verified against the live page on 2026-09-26: the page announces each sale as a line like
// "City of Henderson - October 27, 2026". The parcel list itself goes up about 3 weeks before
// the sale and its format hasn't been seen yet, so the table reader below is written against a
// made-up list and the source stays off (parserVerifiedAt: null) until it is checked against
// the real one.
//
// PRIVACY: these homes are not for sale. Only the parcel number, address, district, amount due
// and sale are kept. Owner or mailing columns are never read, stored or logged.
//
// FAIL-CLOSED rules:
//  - The sale must be announced on the same page, with a valid date; a list that can't be tied
//    to exactly one upcoming sale is refused.
//  - A table that looks like a certificate list but lacks a parcel, district or amount column
//    is a format change: nothing is published (SchemaDriftError).
//  - Each row is validated; more than 5% bad rows rejects the whole list.

import { createHash } from 'node:crypto';
import type { SourceConfig } from '../sources/registry';
import { secureFetch, type FetchOptions } from '../lib/secureFetch';
import { SchemaDriftError, toPlainText } from './clarkTaxSale';
import { zoneOffset } from './irsAuctions';

export { SchemaDriftError };

export interface SaleNotice {
  jurisdiction: string; // "City of Henderson", "Clark County", …
  saleDate: string; // YYYY-MM-DD
}

export interface CertificateRow {
  apn: string;
  address: string | null;
  district: string;
  amountDue: number;
}

export interface SidParseResult {
  notices: SaleNotice[];
  /** The sale the list belongs to; null when no list is posted yet. */
  sale: SaleNotice | null;
  rows: CertificateRow[];
  rejected: { row: number; reason: string }[];
}

const MAX_REJECT_RATIO = 0.05;
const APN_RE = /^(\d{3})-?(\d{2})-?(\d{3})-?(\d{3})$/;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const JURISDICTION_RE = /^(Clark County|City of (?:Las Vegas|North Las Vegas|Henderson|Boulder City|Mesquite))$/i;
const NOTICE_RE = /(Clark County|City of [A-Za-z ]{3,30}?)\s*[-–—]\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/g;

/** Sale announcements on the page, e.g. "City of Henderson - October 27, 2026". */
export function parseSaleNotices(html: string): SaleNotice[] {
  const text = toPlainText(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' '));
  const out: SaleNotice[] = [];
  for (const m of text.matchAll(NOTICE_RE)) {
    const jurisdiction = m[1].trim().replace(/\s+/g, ' ');
    if (!JURISDICTION_RE.test(jurisdiction)) continue; // only the agencies that hold these sales
    const month = MONTHS.indexOf(m[2].toLowerCase());
    const day = Number(m[3]);
    const year = Number(m[4]);
    const d = new Date(Date.UTC(year, month, day));
    if (month < 0 || d.getUTCDate() !== day || year < 2020 || year > 2100) continue;
    const saleDate = d.toISOString().slice(0, 10);
    if (!out.some((n) => n.jurisdiction === jurisdiction && n.saleDate === saleDate)) out.push({ jurisdiction, saleDate });
  }
  return out;
}

/** A local time on a sale date in Las Vegas, as an ISO string with that day's offset (PST or PDT). */
export const vegasTime = (saleDate: string, time: string) => `${saleDate}T${time}${zoneOffset(Date.parse(`${saleDate}T12:00:00Z`), 'America/Los_Angeles')}`;

/** A sale is still ahead until the end of its day in Las Vegas. */
export function saleStillAhead(saleDate: string, now: Date): boolean {
  return now.getTime() < Date.parse(vegasTime(saleDate, '23:59:59'));
}

/** Every HTML table on the page as rows of plain-text cells. Nested tables are read separately. */
export function htmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  // Innermost tables only: layout tables that wrap others are skipped.
  for (const t of html.matchAll(/<table\b[^>]*>((?:(?!<table\b)[\s\S])*?)<\/table>/gi)) {
    const body = t[1];
    const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => toPlainText(c[1])));
    tables.push(rows.filter((r) => r.some((c) => c)));
  }
  return tables;
}

type Column = 'apn' | 'district' | 'amount' | 'address' | 'private';
const COLUMN_TESTS: [Column, RegExp][] = [
  // Owner and mailing columns are matched first so they can never be read as anything else.
  ['private', /owner|name|taxpayer|mailing|care of|c\/o/i],
  ['apn', /parcel|\bapn\b/i],
  ['district', /\b(sid|lid|district)\b/i],
  ['amount', /amount|due|delinquen|total|balance/i],
  ['address', /address|situs|location/i],
];

function headerColumns(header: string[]): Map<Column, number> | null {
  const cols = new Map<Column, number>();
  header.forEach((h, i) => {
    const hit = COLUMN_TESTS.find(([, re]) => re.test(h));
    if (hit && hit[0] !== 'private' && !cols.has(hit[0])) cols.set(hit[0], i);
  });
  return cols.has('apn') ? cols : null;
}

function parseAmount(v: string): number | null {
  const m = v.replace(/\s/g, '').match(/^\$?(\d{1,3}(,\d{3})*|\d+)(\.\d{2})?$/);
  if (!m) return null;
  const n = Number(v.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? Math.round(n * 100) / 100 : null;
}

/** Reads one certificate list table (header row first). */
export function parseCertificateTable(table: string[][]): { rows: CertificateRow[]; rejected: SidParseResult['rejected'] } {
  const headerAt = table.findIndex((r) => headerColumns(r));
  const cols = headerAt >= 0 ? headerColumns(table[headerAt])! : null;
  if (!cols) throw new SchemaDriftError('Certificate list has no parcel number column. The list format may have changed.');
  for (const need of ['district', 'amount'] as const) {
    if (!cols.has(need)) throw new SchemaDriftError(`Certificate list has no ${need === 'district' ? 'district (SID)' : 'amount due'} column. The list format may have changed.`);
  }
  const rows: CertificateRow[] = [];
  const rejected: SidParseResult['rejected'] = [];
  const seen = new Set<string>();
  table.slice(headerAt + 1).forEach((cells, i) => {
    const row = i + 1;
    const reject = (reason: string) => void rejected.push({ row, reason });
    const cell = (c: Column) => (cols.has(c) ? (cells[cols.get(c)!] ?? '').trim() : '');
    if (/^(sub)?total\b/i.test(cells.join(' ').trim())) return; // summary line
    const m = cell('apn').match(APN_RE);
    if (!m) return reject(`no valid parcel number in "${cell('apn').slice(0, 20)}"`);
    const apn = `${m[1]}-${m[2]}-${m[3]}-${m[4]}`;
    const districtRaw = cell('district').replace(/\s+/g, ' ');
    if (!/^[A-Za-z]{0,4}\s?-?\s?\d{1,4}[A-Za-z]?(-[A-Za-z0-9]{1,4})?$/.test(districtRaw)) return reject(`invalid district for ${apn}`);
    const district = /^[A-Za-z]/.test(districtRaw) ? districtRaw.toUpperCase().replace(/^([A-Z]+)\s?-?\s?/, '$1 ') : `SID ${districtRaw}`;
    const amountDue = parseAmount(cell('amount'));
    if (amountDue === null) return reject(`invalid amount due for ${apn}`);
    const key = `${district}|${apn}`;
    if (seen.has(key)) return reject(`duplicate parcel ${apn} in ${district}`);
    seen.add(key);
    const addr = cell('address');
    rows.push({ apn, district, amountDue, address: addr && !/^(unassigned|none|n\/a)/i.test(addr) ? addr.slice(0, 200) : null });
  });
  return { rows, rejected };
}

const looksLikeList = (t: string[][]) => t.slice(0, 3).some((r) => r.some((c) => /parcel|\bapn\b/i.test(c)));

/**
 * Parses the notice-of-sale page. With no list posted it returns the announced sales and no rows.
 * With a list, it must belong to exactly one sale that is still ahead; once that sale is over, the
 * list is ignored.
 */
export function parseSidPage(html: string, now: Date): SidParseResult {
  const notices = parseSaleNotices(html);
  const lists = htmlTables(html).filter(looksLikeList);
  if (!lists.length) return { notices, sale: null, rows: [], rejected: [] };
  const ahead = notices.filter((n) => saleStillAhead(n.saleDate, now));
  // A list left up after its sale is over offers nothing.
  if (!ahead.length) return { notices, sale: null, rows: [], rejected: [] };
  if (ahead.length > 1) {
    throw new SchemaDriftError(`A certificate list is posted but ${ahead.length} upcoming sales are announced; can't tell which sale it belongs to.`);
  }
  const rows: CertificateRow[] = [];
  const rejected: SidParseResult['rejected'] = [];
  let offset = 0;
  for (const t of lists) {
    const r = parseCertificateTable(t);
    rows.push(...r.rows);
    rejected.push(...r.rejected.map((x) => ({ ...x, row: x.row + offset })));
    offset += t.length;
  }
  const total = rows.length + rejected.length;
  if (total === 0) throw new SchemaDriftError('Certificate list is empty.');
  if (rejected.length / total > MAX_REJECT_RATIO) {
    throw new SchemaDriftError(`${rejected.length} of ${total} certificates failed validation (limit ${MAX_REJECT_RATIO * 100}%). First: ${rejected[0].reason}`);
  }
  return { notices, sale: ahead[0], rows, rejected };
}

export function parseSidSnapshot(page: string, now: Date): { parsed: SidParseResult; sha256: string } {
  return { parsed: parseSidPage(page, now), sha256: createHash('sha256').update(page).digest('hex') };
}

/** Fetches the notice-of-sale page from the agent's exact host. */
export async function fetchSidPage(source: SourceConfig, extra: Pick<FetchOptions, 'fetchImpl' | 'verifyCertificate'> = {}): Promise<string> {
  const r = await secureFetch(source.fetchUrl, { allowedHosts: source.allowedHosts, ...extra, acceptContentTypes: /^text\/html\b/i });
  if (r.kind !== 'ok') throw new Error(`Unexpected 304 from ${source.fetchUrl}`);
  return r.body;
}
