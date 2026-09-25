// Verifies that an official host is really the agency's server before its data is trusted.
//
// Threats covered:
//  - Clone / look-alike sites: never reachable, because only exact .gov hostnames from the
//    registry are ever contacted (see validateRegistry and assertTrustedUrl).
//  - DNS poisoning / hijack pointing the real name at another server: the attacker would
//    also need a publicly trusted certificate for that exact name. TLS validation is
//    always on, and the certificate's issuing CA is tracked. An unexpected CA change
//    quarantines the source until a person approves it.
//  - DNS answers pointing at private/internal addresses (rebinding): refused.

import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import type { PeerCertificate } from 'node:tls';

export interface CertIdentity {
  host: string;
  subjectCN: string;
  subjectAltNames: string[];
  issuerOrg: string;
  issuerCN: string;
  fingerprint256: string;
  validFrom: string;
  validTo: string;
  observedAt: string;
}

export interface IdentityBaseline {
  issuerOrg: string;
  issuerCN: string;
  fingerprint256: string;
  approvedAt: string;
}

export type IdentityVerdict =
  | { ok: true; renewed: boolean }
  | { ok: false; code: 'ISSUER_CHANGED' | 'NAME_MISMATCH' | 'EXPIRED'; detail: string };

// Every IANA special-purpose range that should never host a public .gov site: private, loopback,
// link-local, CGNAT, documentation, benchmarking, multicast, reserved, plus IPv6 transition
// ranges (NAT64, 6to4, Teredo, IPv4-mapped) that can smuggle an internal IPv4 address.
const NON_PUBLIC = new BlockList();
for (const [net, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) NON_PUBLIC.addSubnet(net, bits, 'ipv4');
for (const [net, bits] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64], ['2001::', 23],
  ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
] as const) NON_PUBLIC.addSubnet(net, bits, 'ipv6');

/** True for any address that isn't ordinary public unicast (see NON_PUBLIC). Unparseable input counts as private. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return NON_PUBLIC.check(ip, 'ipv4');
  // IPv4-mapped (::ffff:0:0/96) is checked here rather than in the list: Node's BlockList treats
  // every IPv4 address as mapped, so adding that range there would match all of IPv4.
  if (v === 6) return /^::ffff:/i.test(ip) || NON_PUBLIC.check(ip, 'ipv6');
  return true;
}

export async function assertPublicDns(host: string, resolver = lookup): Promise<string[]> {
  const addrs = await resolver(host, { all: true, verbatim: true });
  const ips = (Array.isArray(addrs) ? addrs : [addrs]).map((a) => a.address);
  if (!ips.length) throw new Error(`${host} did not resolve`);
  const bad = ips.filter(isPrivateAddress);
  if (bad.length) throw new Error(`${host} resolves to non-public address(es) ${bad.join(', ')}. Possible DNS tampering.`);
  return ips;
}

function hostMatches(pattern: string, host: string): boolean {
  pattern = pattern.toLowerCase();
  if (pattern === host) return true;
  if (pattern.startsWith('*.')) {
    const rest = host.slice(host.indexOf('.') + 1);
    return rest === pattern.slice(2) && host.split('.').length === pattern.split('.').length;
  }
  return false;
}

export function toIdentity(host: string, cert: PeerCertificate, now = new Date()): CertIdentity {
  const san = (cert.subjectaltname ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('DNS:'))
    .map((s) => s.slice(4));
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  return {
    host,
    subjectCN: first(cert.subject?.CN),
    subjectAltNames: san,
    issuerOrg: first(cert.issuer?.O),
    issuerCN: first(cert.issuer?.CN),
    fingerprint256: cert.fingerprint256,
    validFrom: new Date(cert.valid_from).toISOString(),
    validTo: new Date(cert.valid_to).toISOString(),
    observedAt: now.toISOString(),
  };
}

/** Compares a freshly observed certificate against the approved baseline for the host. */
export function judgeIdentity(id: CertIdentity, baseline: IdentityBaseline | null, now = new Date()): IdentityVerdict {
  const names = id.subjectAltNames.length ? id.subjectAltNames : [id.subjectCN];
  if (!names.some((n) => hostMatches(n, id.host))) {
    return { ok: false, code: 'NAME_MISMATCH', detail: `Certificate is for ${names.join(', ')}, not ${id.host}.` };
  }
  if (Date.parse(id.validTo) < now.getTime() || Date.parse(id.validFrom) > now.getTime()) {
    return { ok: false, code: 'EXPIRED', detail: `Certificate for ${id.host} is outside its validity period.` };
  }
  if (!baseline) return { ok: true, renewed: false }; // first sighting becomes the baseline
  if (id.fingerprint256 === baseline.fingerprint256) return { ok: true, renewed: false };
  // New certificate. Routine renewals keep the same issuing CA; a switch to a different CA is
  // how a hijacker holding a mis-issued certificate would look, so a person must approve it.
  if (id.issuerOrg !== baseline.issuerOrg) {
    return {
      ok: false,
      code: 'ISSUER_CHANGED',
      detail: `Certificate issuer for ${id.host} changed from "${baseline.issuerOrg}" to "${id.issuerOrg}" (fingerprint ${id.fingerprint256}).`,
    };
  }
  return { ok: true, renewed: true };
}

export class IdentityError extends Error {
  constructor(
    readonly code: 'ISSUER_CHANGED' | 'NAME_MISMATCH' | 'EXPIRED',
    readonly host: string,
    readonly fingerprint256: string,
    detail: string,
  ) {
    super(detail);
    this.name = 'IdentityError';
  }
}

/**
 * Builds a certificate verifier for secureFetch. Each connection's certificate is judged
 * against the approved baseline; failures throw IdentityError (and abort the fetch).
 * Accepted identities are collected in `observed` so the caller can update baselines.
 */
export function makeCertificateVerifier(
  baselines: Record<string, IdentityBaseline>,
  observed: Record<string, CertIdentity>,
  opts: { now?: Date; approvedFingerprint?: string } = {},
) {
  return (host: string, cert: PeerCertificate) => {
    const id = toIdentity(host, cert, opts.now);
    const verdict = judgeIdentity(id, baselines[host] ?? null, opts.now);
    if (!verdict.ok && !(verdict.code === 'ISSUER_CHANGED' && opts.approvedFingerprint === id.fingerprint256)) {
      throw new IdentityError(verdict.code, host, id.fingerprint256, verdict.detail);
    }
    observed[host] = id;
  };
}
