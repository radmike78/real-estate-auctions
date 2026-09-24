// Hardened fetch for official sources.
//  - HTTPS only; TLS certificate validation is always on (Node default, never disabled).
//  - Exact-host allowlist, re-checked on every redirect hop (blocks redirect-based spoofing).
//  - Response size and time limits, content-type check.
//  - Conditional requests (ETag / Last-Modified) so frequent polling stays cheap and polite.
//  - Returns a SHA-256 of the raw bytes so every published fact is traceable to a snapshot.

import { createHash } from 'node:crypto';

export interface FetchOptions {
  allowedHosts: string[];
  etag?: string | null;
  lastModified?: string | null;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  acceptContentTypes?: RegExp;
  fetchImpl?: typeof fetch; // injectable for tests
}

export type FetchResult =
  | { kind: 'not_modified'; url: string }
  | { kind: 'ok'; url: string; body: string; sha256: string; etag: string | null; lastModified: string | null; contentType: string };

export class UntrustedSourceError extends Error {}

const USER_AGENT = 'ForcedSaleFinder/0.1 (public-records monitor; respects robots.txt)';

export function assertTrustedUrl(raw: string, allowedHosts: string[]): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UntrustedSourceError(`Invalid URL: ${raw}`);
  }
  if (u.protocol !== 'https:') throw new UntrustedSourceError(`Refusing non-HTTPS URL: ${u.href}`);
  if (u.username || u.password) throw new UntrustedSourceError('Refusing URL with embedded credentials');
  if (u.port && u.port !== '443') throw new UntrustedSourceError(`Refusing non-standard port: ${u.port}`);
  const host = u.hostname.toLowerCase();
  if (!allowedHosts.map((h) => h.toLowerCase()).includes(host)) {
    throw new UntrustedSourceError(`Host "${host}" is not on the official allowlist (${allowedHosts.join(', ')})`);
  }
  return u;
}

export async function secureFetch(url: string, opts: FetchOptions): Promise<FetchResult> {
  const {
    allowedHosts,
    maxBytes = 10 * 1024 * 1024,
    timeoutMs = 30_000,
    maxRedirects = 3,
    acceptContentTypes = /^(text\/html|application\/xhtml\+xml|text\/csv|application\/json)\b/i,
    fetchImpl = fetch,
  } = opts;

  let current = assertTrustedUrl(url, allowedHosts);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const headers: Record<string, string> = { 'user-agent': USER_AGENT, accept: 'text/html,text/csv,application/json;q=0.9' };
    if (hop === 0 && opts.etag) headers['if-none-match'] = opts.etag;
    if (hop === 0 && opts.lastModified) headers['if-modified-since'] = opts.lastModified;

    const res = await fetchImpl(current.href, { headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });

    if (res.status >= 300 && res.status < 400 && res.status !== 304) {
      const loc = res.headers.get('location');
      if (!loc) throw new UntrustedSourceError(`Redirect without Location from ${current.href}`);
      current = assertTrustedUrl(new URL(loc, current).href, allowedHosts);
      continue;
    }
    if (res.status === 304) return { kind: 'not_modified', url: current.href };
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${current.href}`);

    const contentType = res.headers.get('content-type') ?? '';
    if (!acceptContentTypes.test(contentType)) {
      throw new UntrustedSourceError(`Unexpected content-type "${contentType}" from ${current.href}`);
    }
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new UntrustedSourceError(`Response too large (${declared} bytes)`);

    const bytes = await readLimited(res, maxBytes);
    return {
      kind: 'ok',
      url: current.href,
      body: new TextDecoder('utf-8').decode(bytes),
      sha256: createHash('sha256').update(bytes).digest('hex'),
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified'),
      contentType,
    };
  }
  throw new UntrustedSourceError(`Too many redirects from ${url}`);
}

async function readLimited(res: Response, maxBytes: number): Promise<Uint8Array> {
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new UntrustedSourceError(`Response exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}
