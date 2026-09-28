// Live license lookups from official sources that allow it. Each search goes to the official source at the moment
// someone asks (results kept for a few hours so repeat searches don't hit it again); nothing is stored long-term.
//   - State Bar of Nevada: its public "Find a Lawyer" directory takes the search in the address and returns results.
//     Its robots.txt only closes /wp-admin/. Emails are protected on that page, so we leave them there.
//   - FDIC BankFind: the FDIC's free public API (api.fdic.gov), built for this.
// Other regulators' lookups use CAPTCHAs or forbid automated queries, so the site links to them instead.

export type LiveKind = 'attorney' | 'bank';

export interface LicenseResult {
  name: string;
  id: string; // bar number or FDIC certificate
  status: string;
  since?: string;
  company?: string;
  address?: string;
  phone?: string;
  website?: string;
  discipline?: string[];
  officialUrl: string;
}

export interface LicenseSearch {
  kind: LiveKind;
  source: string;
  results: LicenseResult[];
  more: boolean; // more matches than shown
  checkedAt: string;
}

const UA = 'DeedOwl license lookup (+https://deedowl.com)';
const MAX_RESULTS = 20;
const MAX_BODY = 4 * 1024 * 1024;
const FETCH_HOSTS = new Set(['nvbar.org', 'www.nvbar.org', 'api.fdic.gov']);
const CACHE_MS = 6 * 3_600_000;
const CACHE_MAX = 500;

/** A name, firm or license number: letters (any language), digits, spaces and a little punctuation, 2–60 characters. */
export function cleanQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const q = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (q.length < 2 || q.length > 60 || !/^[\p{L}\p{N} .,'&-]+$/u.test(q)) return null;
  return q;
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Attorney records from the State Bar's Find a Lawyer results page. */
export function parseStateBar(html: string): { results: LicenseResult[]; more: boolean } {
  const blocks = html.split(/<article class="user_chunk\b/).slice(1);
  const results: LicenseResult[] = [];
  for (const b of blocks) {
    const field = (k: string) => {
      const m = b.match(new RegExp(`\\[${k}\\] => ([^\\n]*)`));
      return m ? decode(m[1]) : '';
    };
    const bar = field('attorney_barnumber');
    const last = field('last_name');
    const first = [field('first_name'), field('attorney_middle')].filter(Boolean).join(' ');
    const name = decode(b.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? '') || [last, first].filter(Boolean).join(', ');
    if (!bar || !/^\d{1,6}$/.test(bar) || !name) continue;
    const street = [field('attorney_address1'), field('attorney_address2')].filter(Boolean).join(', ');
    const place = [field('attorney_city'), [field('attorney_state'), field('attorney_zipcode')].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    const disc = b.split(/Disciplinary Actions:/)[1]?.match(/<ol>([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const discipline = [...disc.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1]).replace(/\s*\[\s*View Document\s*\]\s*$/i, '')).filter((t) => t && !/^none\.?$/i.test(t));
    results.push({
      name,
      id: bar,
      status: field('attorney_membertype') || 'See the State Bar',
      since: field('attorney_admissiondate') || undefined,
      company: field('attorney_firmname') || undefined,
      address: [street, place].filter(Boolean).join(', ') || undefined,
      phone: field('attorney_phone') || undefined,
      discipline,
      officialUrl: `https://nvbar.org/for-the-public/find-a-lawyer/?usearch=${bar}`,
    });
    if (results.length >= MAX_RESULTS) break;
  }
  return { results, more: blocks.length > results.length };
}

interface FdicRow {
  data?: { NAME?: string; CERT?: number | string; CITY?: string; STALP?: string; ADDRESS?: string; ZIP?: string; WEBADDR?: string; ACTIVE?: number };
}

/** Banks from the FDIC BankFind API (active FDIC-insured institutions). */
export function parseFdic(json: unknown): { results: LicenseResult[]; more: boolean } {
  const rows: FdicRow[] = Array.isArray((json as { data?: unknown })?.data) ? (json as { data: FdicRow[] }).data : [];
  const total = Number((json as { meta?: { total?: number } })?.meta?.total ?? rows.length);
  const results = rows
    .map((r) => r.data ?? {})
    .filter((d) => d.NAME && d.CERT !== undefined && /^\d{1,7}$/.test(String(d.CERT)))
    // Nevada banks first; the order is otherwise the FDIC's.
    .sort((a, b) => Number(b.STALP === 'NV') - Number(a.STALP === 'NV'))
    .slice(0, MAX_RESULTS)
    .map((d) => {
      const site = typeof d.WEBADDR === 'string' && /^[a-z0-9.-]+\.[a-z]{2,}(\/[\w./-]*)?$/i.test(d.WEBADDR.replace(/^https?:\/\//i, '')) ? `https://${d.WEBADDR.replace(/^https?:\/\//i, '')}` : undefined;
      return {
        name: String(d.NAME),
        id: String(d.CERT),
        status: 'Active, FDIC-insured',
        address: [d.ADDRESS, d.CITY, [d.STALP, d.ZIP].filter(Boolean).join(' ')].filter(Boolean).join(', ') || undefined,
        website: site,
        officialUrl: 'https://banks.data.fdic.gov/bankfind-suite/bankfind',
      };
    });
  return { results, more: total > results.length };
}

export function createLicenseSearch(fetchImpl: typeof fetch = fetch, now: () => Date = () => new Date()) {
  const cache = new Map<string, { at: number; value: LicenseSearch }>();

  async function get(url: string, accept: string): Promise<string> {
    const res = await fetchImpl(url, { headers: { 'user-agent': UA, accept }, redirect: 'follow', signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    // Redirects are followed only within the two official hosts.
    if (res.url && !FETCH_HOSTS.has(new URL(res.url).hostname)) throw new Error('unexpected host');
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BODY) throw new Error('too large');
    if (!res.body) return res.text();
    // Count bytes as they arrive, so a reply without a declared size is still capped.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new Error('too large');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  return async function search(kind: LiveKind, q: string): Promise<LicenseSearch> {
    const key = `${kind}|${q.toLowerCase()}`;
    const hit = cache.get(key);
    const t = now().getTime();
    if (hit && t - hit.at < CACHE_MS) return hit.value;
    let parsed: { results: LicenseResult[]; more: boolean };
    let source: string;
    if (kind === 'attorney') {
      source = 'State Bar of Nevada';
      parsed = parseStateBar(await get(`https://nvbar.org/for-the-public/find-a-lawyer/?usearch=${encodeURIComponent(q)}`, 'text/html'));
    } else {
      source = 'FDIC BankFind';
      const words = q.replace(/["\\:()]/g, ' ').trim();
      const url = `https://api.fdic.gov/banks/institutions?filters=${encodeURIComponent('ACTIVE:1')}&search=${encodeURIComponent(`NAME:"${words}"`)}&fields=NAME,CERT,CITY,STALP,ADDRESS,ZIP,WEBADDR&limit=${MAX_RESULTS}&format=json`;
      parsed = parseFdic(JSON.parse(await get(url, 'application/json')));
    }
    const value: LicenseSearch = { kind, source, ...parsed, checkedAt: now().toISOString() };
    cache.set(key, { at: t, value });
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
    return value;
  };
}
