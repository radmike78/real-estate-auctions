// Visitor addresses behind Cloudflare. When the site's domain is proxied through Cloudflare (orange
// cloud), every request reaches us from a Cloudflare server, and the visitor's own address arrives in
// the CF-Connecting-IP header. We only believe that header when the request really came from one of
// Cloudflare's published address ranges; anyone connecting to the server directly can't forge it.

import { BlockList, isIP } from 'node:net';

// From https://www.cloudflare.com/ips-v4/ and https://www.cloudflare.com/ips-v6/ (checked 2026-09-26).
// If Cloudflare adds a range, visitors arriving through it are simply counted by Cloudflare's address
// (rate limits get stricter, never looser) until this list is updated.
export const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
  '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
];

const ranges = new BlockList();
for (const cidr of CLOUDFLARE_RANGES) {
  const [net, bits] = cidr.split('/');
  ranges.addSubnet(net, Number(bits), net.includes(':') ? 'ipv6' : 'ipv4');
}

/** True for an address inside Cloudflare's ranges (IPv4, IPv6, or IPv4-mapped IPv6). */
export function isCloudflare(ip: string): boolean {
  const v = isIP(ip);
  return v !== 0 && ranges.check(ip, v === 6 ? 'ipv6' : 'ipv4');
}

/** The visitor's address: CF-Connecting-IP when `peer` (the address that connected to us, or that our
 *  own proxy saw) is a Cloudflare server and the header holds a valid address; otherwise `peer`. */
export function visitorIp(peer: string, cfConnectingIp: string | string[] | undefined): string {
  const header = (Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp)?.trim() ?? '';
  return isCloudflare(peer) && isIP(header) ? header : peer;
}
