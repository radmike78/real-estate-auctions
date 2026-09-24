// Ed25519 signing of the published feed. The browser verifies the signature with a
// public key compiled into the site before it shows a single listing, so a tampered or
// injected listings file (e.g. on a compromised CDN or storage bucket) is rejected.

import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from 'node:crypto';

export function generateSigningKeys(): { privatePem: string; publicSpkiB64: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicSpkiB64: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
  };
}

export function loadPrivateKey(pem: string): KeyObject {
  const key = createPrivateKey(pem);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('Feed signing key must be Ed25519');
  return key;
}

export const signBytes = (data: Uint8Array, key: KeyObject): string => sign(null, data, key).toString('base64');

export function verifyBytes(data: Uint8Array, sigB64: string, publicSpkiB64: string): boolean {
  const pub = createPublicKey({ key: Buffer.from(publicSpkiB64, 'base64'), format: 'der', type: 'spki' });
  return verify(null, data, pub, Buffer.from(sigB64, 'base64'));
}
