// Ed25519 public keys (SPKI, base64) the browser uses to verify signed feeds. There are two key pairs so the
// web server never holds the key that signs listings:
//   FEED       listings.json, signed by the listings updater (ingest) only
//   DIRECTORY  pros.json (advertiser directory), signed by the web server
// Set by `npm run keys:generate`, or at build time with VITE_FEED_PUBLIC_KEY and VITE_DIRECTORY_PUBLIC_KEY
// (container builds pass them as build arguments). null = that feed stays off until its key is set.
const valid = (k: string | undefined) => {
  const v = k?.trim();
  return v && /^[A-Za-z0-9+/=]{40,200}$/.test(v) ? v : null;
};
export const FEED_PUBLIC_KEY_SPKI_B64: string | null = valid(import.meta.env.VITE_FEED_PUBLIC_KEY);
export const DIRECTORY_PUBLIC_KEY_SPKI_B64: string | null = valid(import.meta.env.VITE_DIRECTORY_PUBLIC_KEY);
