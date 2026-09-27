// Hardened HTTPS GET for official sources.
//  - HTTPS only, exact-host allowlist, re-checked on every redirect hop (blocks redirect spoofing).
//  - TLS certificate and hostname validation always on (never disabled).
//  - The server certificate of THE SAME connection that returns the data is handed to
//    `verifyCertificate`, so the identity check cannot be bypassed by a different server
//    answering the data request.
//  - Direct mode resolves DNS once, refuses private/internal addresses, and connects to
//    exactly that address (no DNS-rebinding window). Behind an egress proxy
//    (HTTPS_PROXY) the proxy resolves names; TLS is still validated end to end.
//  - Response size and time limits, content-type check, SHA-256 of the raw bytes.

import { createHash } from 'node:crypto';
import { request as httpRequest, type IncomingMessage } from 'node:http';
import { connect as tlsConnect, type PeerCertificate, type TLSSocket } from 'node:tls';
import type { Socket } from 'node:net';
import { assertPublicDns } from './siteIdentity';

export interface FetchOptions {
  allowedHosts: string[];
  etag?: string | null;
  lastModified?: string | null;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  acceptContentTypes?: RegExp;
  /** Called with the server certificate of the connection that served the response. Throw to reject. */
  verifyCertificate?: (host: string, cert: PeerCertificate) => void;
  /** Test hook: replaces the network transport. */
  fetchImpl?: typeof fetch;
}

export type FetchResult =
  | { kind: 'not_modified'; url: string }
  | { kind: 'ok'; url: string; body: string; sha256: string; etag: string | null; lastModified: string | null; contentType: string };

export class UntrustedSourceError extends Error {}

const USER_AGENT = 'DeedOwl/0.1 (public-records monitor)';

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

interface RawResponse {
  status: number;
  headers: Headers;
  body: Uint8Array;
  cert: PeerCertificate | null;
}

function tunnel(host: string, proxy: URL, timeoutMs: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: proxy.hostname, port: proxy.port || 80, method: 'CONNECT', path: `${host}:443`, timeout: timeoutMs });
    req.on('connect', (res, socket) => (res.statusCode === 200 ? resolve(socket) : reject(new Error(`Proxy refused ${host} (${res.statusCode})`))));
    req.on('timeout', () => req.destroy(new Error('Proxy CONNECT timed out')));
    req.on('error', reject);
    req.end();
  });
}

async function openTls(host: string, timeoutMs: number): Promise<TLSSocket> {
  const proxyEnv = process.env.HTTPS_PROXY ?? process.env.https_proxy;
  const base = { servername: host, rejectUnauthorized: true, timeout: timeoutMs } as const;
  const sock = proxyEnv
    ? tlsConnect({ ...base, socket: await tunnel(host, new URL(proxyEnv), timeoutMs) })
    : tlsConnect({ ...base, host: (await assertPublicDns(host))[0], port: 443 });
  await new Promise<void>((resolve, reject) => {
    sock.once('secureConnect', resolve);
    sock.once('error', reject);
    sock.once('timeout', () => sock.destroy(new Error(`TLS to ${host} timed out`)));
  });
  return sock;
}

async function readLimited(stream: AsyncIterable<Uint8Array>, maxBytes: number): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const c of stream) {
    total += c.byteLength;
    if (total > maxBytes) throw new UntrustedSourceError(`Response exceeded ${maxBytes} bytes`);
    chunks.push(c);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

/** Hard cap on one request, start to last byte (the socket timeout only catches silence, not a slow drip). */
const TOTAL_TIMEOUT_MS = 120_000;

async function nodeGet(url: URL, headers: Record<string, string>, timeoutMs: number, maxBytes: number): Promise<RawResponse> {
  const tls = await openTls(url.hostname, timeoutMs);
  const cert = tls.getPeerCertificate();
  return new Promise<RawResponse>((settle, fail) => {
    const resolve = (v: RawResponse) => {
      clearTimeout(deadline);
      settle(v);
    };
    const reject = (e: unknown) => {
      clearTimeout(deadline);
      fail(e);
    };
    const deadline = setTimeout(() => {
      tls.destroy();
      reject(new Error(`Request to ${url.hostname} exceeded ${TOTAL_TIMEOUT_MS / 1000}s`));
    }, TOTAL_TIMEOUT_MS);
    const req = httpRequest(
      { host: url.hostname, path: url.pathname + url.search, method: 'GET', headers: { ...headers, host: url.hostname, connection: 'close' }, createConnection: () => tls, timeout: timeoutMs },
      (res: IncomingMessage) => {
        const h = new Headers();
        for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) h.set(k, Array.isArray(v) ? v.join(', ') : v);
        readLimited(res, maxBytes).then((body) => resolve({ status: res.statusCode ?? 0, headers: h, body, cert }), reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Request to ${url.hostname} timed out`)));
    req.on('error', reject);
    req.end();
  });
}

async function viaFetch(fetchImpl: typeof fetch, url: URL, headers: Record<string, string>, timeoutMs: number, maxBytes: number): Promise<RawResponse> {
  const res = await fetchImpl(url.href, { headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new UntrustedSourceError(`Response too large (${declared} bytes)`);
  const body = res.body ? await readLimited(res.body as unknown as AsyncIterable<Uint8Array>, maxBytes) : new Uint8Array();
  return { status: res.status, headers: res.headers, body, cert: null };
}

export async function secureFetch(url: string, opts: FetchOptions): Promise<FetchResult> {
  const {
    allowedHosts,
    maxBytes = 10 * 1024 * 1024,
    timeoutMs = 30_000,
    maxRedirects = 3,
    acceptContentTypes = /^(text\/html|application\/xhtml\+xml|text\/csv|application\/json)\b/i,
  } = opts;

  let current = assertTrustedUrl(url, allowedHosts);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const headers: Record<string, string> = { 'user-agent': USER_AGENT, accept: '*/*' };
    if (hop === 0 && opts.etag) headers['if-none-match'] = opts.etag;
    if (hop === 0 && opts.lastModified) headers['if-modified-since'] = opts.lastModified;

    const res = opts.fetchImpl
      ? await viaFetch(opts.fetchImpl, current, headers, timeoutMs, maxBytes)
      : await nodeGet(current, headers, timeoutMs, maxBytes);
    if (res.cert && opts.verifyCertificate) opts.verifyCertificate(current.hostname, res.cert);

    if (res.status >= 300 && res.status < 400 && res.status !== 304) {
      const loc = res.headers.get('location');
      if (!loc) throw new UntrustedSourceError(`Redirect without Location from ${current.href}`);
      current = assertTrustedUrl(new URL(loc, current).href, allowedHosts);
      continue;
    }
    if (res.status === 304) return { kind: 'not_modified', url: current.href };
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status} from ${current.href}`);

    const contentType = res.headers.get('content-type') ?? '';
    if (!acceptContentTypes.test(contentType)) {
      throw new UntrustedSourceError(`Unexpected content-type "${contentType}" from ${current.href}`);
    }
    return {
      kind: 'ok',
      url: current.href,
      body: new TextDecoder('utf-8').decode(res.body),
      sha256: createHash('sha256').update(res.body).digest('hex'),
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified'),
      contentType,
    };
  }
  throw new UntrustedSourceError(`Too many redirects from ${url}`);
}
